<template>
  <v-dialog
    :model-value="modelValue"
    max-width="640"
    scrollable
    persistent
    content-class="mac-dialog-fit"
    @update:model-value="v => !v && close()"
  >
    <v-card class="mac-sheet pti">
      <div class="mac-sheet-head">
        <v-icon size="18">mdi-file-document-arrow-right-outline</v-icon>
        <span>從期款範本帶入</span>
        <button type="button" class="mac-sheet-close" title="關閉" :disabled="saving" @click="close">
          <v-icon size="18">mdi-close</v-icon>
        </button>
      </div>

      <v-card-text class="pa-0 mac-form pti-body">
        <div v-if="loading" class="pti-state">
          <v-progress-circular indeterminate size="24" width="2" color="grey"></v-progress-circular>
        </div>

        <div v-else-if="loadError" class="pti-state pti-state--error">
          <div class="mac-callout mac-callout--error">
            <v-icon size="16">mdi-alert-circle-outline</v-icon><span>{{ loadError }}</span>
          </div>
          <button type="button" class="mac-btn" @click="loadTemplates">重試</button>
        </div>

        <div v-else-if="!templates.length" class="mac-list-empty">此建案尚未建立期款範本</div>

        <template v-else>
          <div class="mac-sheet-label">期款範本</div>
          <v-select
            v-model="templateId"
            :items="templateOptions"
            item-title="templateName"
            item-value="id"
            class="mac-vfield"
            variant="solo"
            flat
            density="compact"
            hide-details
            menu-icon="mdi-unfold-more-horizontal"
            placeholder="選擇範本"
            :menu-props="TEMPLATE_MENU_PROPS"
          >
            <template v-slot:item="{ props: itemProps, item }">
              <PaymentTemplateOptionItem v-bind="itemProps" :option="item.raw" />
            </template>
          </v-select>

          <div v-if="!activeTemplate" class="mac-callout mac-callout--warning pti-note">
            <v-icon size="16">mdi-alert-outline</v-icon><span>沒有符合此戶條件的{{ autoCategory }}範本，請手動選擇</span>
          </div>
          <div v-if="mismatchText" class="mac-callout mac-callout--warning pti-note">
            <v-icon size="16">mdi-alert-outline</v-icon><span>條件外：{{ mismatchText }}</span>
          </div>
          <div v-if="activeTemplate && baseAmount <= 0" class="mac-callout mac-callout--warning pti-note">
            <v-icon size="16">mdi-alert-outline</v-icon><span>此戶尚無{{ baseLabel }}，無法計算金額</span>
          </div>

          <template v-if="rows.length">
            <div class="mac-form-label pti-list-label">
              <span>期別</span>
              <span class="mac-spacer"></span>
              <span>基準 {{ formatMoney(baseAmount) }} 萬</span>
            </div>
            <div class="mac-form-group">
              <template v-for="row in rows" :key="row.key">
                <div v-if="row.groupHead" class="pti-group-head">{{ row.groupHead }}</div>
                <div v-if="state[row.key]" class="pti-row" :class="{ 'is-off': !state[row.key].checked }">
                  <label class="pti-row-main">
                    <input
                      v-model="state[row.key].checked"
                      type="checkbox"
                      class="mac-check"
                      :disabled="saving || state[row.key].imported"
                    />
                    <span class="pti-name">
                      {{ row.name }}
                      <span v-if="state[row.key].imported" class="mac-tag mac-tag--green">已帶入</span>
                      <span v-else-if="row.exists" class="mac-tag">已有</span>
                    </span>
                    <span class="pti-amount">{{ formatMoney(row.amount) }} 元</span>
                  </label>
                  <v-text-field
                    v-model="state[row.key].expectedDate"
                    class="mac-vfield pti-date"
                    type="date"
                    variant="solo"
                    flat
                    density="compact"
                    hide-details
                    :disabled="saving || !state[row.key].checked"
                    aria-label="預計日"
                  ></v-text-field>
                </div>
              </template>
            </div>
            <div v-if="skippedCount" class="mac-sheet-note pti-skip">略過 {{ skippedCount }} 期（金額 0 或負數）</div>
          </template>

          <div v-if="saveError" class="mac-callout mac-callout--error pti-note">
            <v-icon size="16">mdi-alert-circle-outline</v-icon><span>{{ saveError }}</span>
          </div>
        </template>
      </v-card-text>

      <div class="mac-sheet-foot">
        <span v-if="missingDateCount" class="pti-missing">還有 {{ missingDateCount }} 筆未填預計日</span>
        <span class="mac-spacer"></span>
        <button type="button" class="mac-btn" :disabled="saving" @click="close">取消</button>
        <button type="button" class="mac-btn mac-btn--primary" :disabled="!canSubmit" @click="submit">
          <v-progress-circular v-if="saving" indeterminate size="14" width="2" color="white"></v-progress-circular>
          <span>帶入 {{ checkedRows.length }} 筆</span>
        </button>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
/**
 * 從期款範本帶入預計繳款，規格：docs/SPEC_PaymentDueReminder.md §6.9
 * 基準與金額比照付款表（PaymentSchedulePreviewDialog）：範本以「萬」計算、四捨五入到整數萬，尾數依範本的餘額項。
 */
import { computed, reactive, ref, watch } from 'vue';
import { fetchPaymentTermTemplates } from '@/api';
import { runNewCalculationEngine } from '@/utils/paymentCalculation';
import {
  TEMPLATE_MENU_PROPS,
  buildTemplateOptionList,
  getTemplateMismatchReasons,
  joinReasonTexts,
  preferredPaymentCategory,
  resolveUnitPreferredPayment,
  selectAutoPaymentTemplate,
} from '@/utils/paymentTemplateMatch';
import { isValidYmd } from '@/utils/paymentRecordStatus';
import { useProjectStore } from '@/store/projectStore';
import PaymentTemplateOptionItem from '@/components/PaymentTemplateOptionItem.vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: String, required: true },
  unitData: { type: Object, default: null },
  dealTotalWan: { type: Number, default: 0 },
  existingRecords: { type: Array, default: () => [] },
  submitHandler: { type: Function, required: true },
});
const emit = defineEmits(['update:modelValue']);

const PACKAGE_CATEGORY = '配套期款';
const YUAN_PER_WAN = 10000;

const projectStore = useProjectStore();

const loading = ref(false);
const loadError = ref('');
const allTemplates = ref([]);
const templateId = ref(null);
const state = reactive({});
const saving = ref(false);
const saveError = ref('');

const formatMoney = value => (Number(value) || 0).toLocaleString('zh-TW');

// 配套合約判定與付款表相同：戶別沒有合約方式時用建案第一個合約方式；
// 依建案設定 packageContractTypes，未設定時相容舊寫死的「毛胚合約」
const isPackageContract = computed(() => {
  const project = projectStore.getProjectById(props.projectId);
  const type = props.unitData?.contractType || project?.contractTypes?.[0];
  if (!type) return false;
  const list = project?.packageContractTypes;
  return Array.isArray(list) ? list.includes(type) : type === '毛胚合約';
});

const packageDealWan = computed(() => Number(props.unitData?.price_package_deal) || 0);
// 付款表第 1 頁基準：配套模式為配套總價，否則成交總價；第 2 頁基準：成交總價 − 配套總價
const mainBase = computed(() => Math.round(isPackageContract.value ? packageDealWan.value : Number(props.dealTotalWan) || 0));
const packageBase = computed(() => Math.round((Number(props.dealTotalWan) || 0) - packageDealWan.value));

const templates = computed(() => (isPackageContract.value
  ? allTemplates.value
  : allTemplates.value.filter(t => t.paymentCategory !== PACKAGE_CATEGORY)));

const matchCondition = computed(() => ({
  propertyType: props.unitData?.propertyType || props.unitData?.layout || '住家',
  totalPrice: mainBase.value,
  buyerType: props.unitData?.isFirstTimeBuyer === false ? '非首購' : '首購',
}));

// 與付款表共用規則：依戶別優付開關與建案優付選項決定類別，取該類別第一個符合條件的範本；沒有就不預選並提示
const isPreferredUnit = computed(() => resolveUnitPreferredPayment(props.unitData, projectStore.getProjectById(props.projectId)));
const autoCategory = computed(() => preferredPaymentCategory(isPreferredUnit.value));
const autoTemplate = computed(() => selectAutoPaymentTemplate(templates.value, isPreferredUnit.value, matchCondition.value));

const templateOptions = computed(() => buildTemplateOptionList(templates.value, {
  ...matchCondition.value,
  unlocked: true, // 條件外也可選，選了會顯示警示
  autoTemplateId: autoTemplate.value?.id || null,
}));

const activeTemplate = computed(() => templates.value.find(t => t.id === templateId.value) || null);
const isPackageTemplate = computed(() => activeTemplate.value?.paymentCategory === PACKAGE_CATEGORY);
const baseAmount = computed(() => (isPackageTemplate.value ? packageBase.value : mainBase.value));
const baseLabel = computed(() => {
  if (isPackageTemplate.value) return '配套價';
  return isPackageContract.value ? '配套總價' : '成交總價';
});

const mismatchText = computed(() => {
  if (!activeTemplate.value) return '';
  return joinReasonTexts(getTemplateMismatchReasons(activeTemplate.value, matchCondition.value));
});

const existingNotes = computed(() => new Set((props.existingRecords || [])
  .map(r => String(r?.note || '').trim())
  .filter(Boolean)));

// 同付款表：母項有子項時列子項，沒有子項時列母項本身
const computedRows = computed(() => {
  const template = activeTemplate.value;
  if (!template || !Array.isArray(template.items) || baseAmount.value <= 0) return [];
  const results = runNewCalculationEngine(
    template.items,
    baseAmount.value,
    isPackageTemplate.value ? '配套金額' : '總價',
  );
  const amountOf = item => Math.round(Number(results[item.name]?.value) || 0) * YUAN_PER_WAN;
  return template.items.filter(i => !i.parentId).flatMap(parent => {
    const children = template.items.filter(i => i.parentId === parent.id);
    return (children.length ? children : [parent]).map(leaf => ({
      key: leaf.id,
      name: leaf.name,
      groupName: children.length ? parent.name : '',
      amount: amountOf(leaf),
      exists: existingNotes.value.has(String(leaf.name || '').trim()),
    }));
  });
});

// 負數或 0 的期別不帶入；分組標題跟著第一個可帶入的子項，避免第一個子項被濾掉時標題消失
const rows = computed(() => {
  const seenGroups = new Set();
  return computedRows.value.filter(row => row.amount > 0).map(row => {
    const groupHead = row.groupName && !seenGroups.has(row.groupName) ? row.groupName : '';
    if (row.groupName) seenGroups.add(row.groupName);
    return { ...row, groupHead };
  });
});
const skippedCount = computed(() => computedRows.value.length - rows.value.length);

const checkedRows = computed(() => rows.value.filter(r => state[r.key]?.checked));
const missingDateCount = computed(() => checkedRows.value.filter(r => !isValidYmd(state[r.key]?.expectedDate)).length);
const canSubmit = computed(() => !saving.value && checkedRows.value.length > 0 && missingDateCount.value === 0);

function resetRowState() {
  Object.keys(state).forEach(key => delete state[key]);
  rows.value.forEach(row => {
    state[row.key] = { checked: !row.exists, expectedDate: '', imported: false };
  });
}

async function loadTemplates() {
  loading.value = true;
  loadError.value = '';
  const res = await fetchPaymentTermTemplates(props.projectId);
  loading.value = false;
  if (res?.status !== 'success') {
    loadError.value = `載入範本失敗：${res?.message || '請稍後再試'}`;
    return;
  }
  allTemplates.value = res.data || [];
  templateId.value = autoTemplate.value?.id || null;
  resetRowState();
}

function close() {
  if (saving.value) return;
  emit('update:modelValue', false);
}

async function submit() {
  if (!canSubmit.value) return;
  saving.value = true;
  saveError.value = '';
  const keyByPlan = new Map(checkedRows.value.map(row => [{
    expectedDate: state[row.key].expectedDate,
    expectedAmount: row.amount,
    note: row.name,
  }, row.key]));
  let savedCount = 0;
  // 每成功一筆就取消勾選，失敗重送時只送尚未成功的期別，不會重複新增
  const onPlanSaved = plan => {
    const rowState = state[keyByPlan.get(plan)];
    if (!rowState) return;
    rowState.checked = false;
    rowState.imported = true;
    savedCount += 1;
  };
  try {
    await props.submitHandler([...keyByPlan.keys()], { onPlanSaved });
    saving.value = false;
    close();
  } catch (error) {
    saveError.value = savedCount
      ? `已帶入 ${savedCount} 筆，其餘失敗：${error.message}`
      : `帶入失敗：${error.message}`;
    saving.value = false;
  }
}

// 換範本或期別改變時，渲染前先重建勾選與日期狀態
watch([templateId, () => rows.value.map(row => row.key).join('|')], resetRowState);
watch(() => props.modelValue, open => {
  if (!open) return;
  saveError.value = '';
  loadTemplates();
}, { immediate: true });
</script>

<style scoped>
.pti-body { padding: 14px !important; }
.pti-state { display: flex; justify-content: center; padding: 40px 16px; }
.pti-state--error { flex-direction: column; align-items: flex-start; gap: 12px; padding: 4px 0; }
.pti-note { margin-top: 10px; }
.pti-list-label { margin-top: 14px; }
.pti-group-head {
  padding: 6px 14px;
  background: #fafafb;
  border-top: 1px solid #ececf0;
  color: #6e6e73;
  font-size: 12px;
  font-weight: 600;
}
.pti-group-head:first-child { border-top: 0; }
.pti-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 160px;
  align-items: center;
  gap: 8px 12px;
  padding: 7px 14px;
  border-top: 1px solid #ececf0;
}
.pti-row:first-child { border-top: 0; }
.pti-row.is-off .pti-name,
.pti-row.is-off .pti-amount { color: #8e8e93; }
.pti-row-main { display: flex; align-items: center; gap: 8px; min-width: 0; cursor: pointer; }
.pti-name { flex: 1 1 auto; min-width: 0; font-weight: 500; overflow-wrap: anywhere; }
.pti-amount { flex-shrink: 0; font-variant-numeric: tabular-nums; white-space: nowrap; }
.pti-skip { margin: 8px 4px 0; }
.pti-missing { color: #9a5b00; font-size: 12.5px; }

@media (max-width: 600px) {
  .pti-body { padding: 12px !important; }
  .pti-row { grid-template-columns: minmax(0, 1fr); }
}
</style>
