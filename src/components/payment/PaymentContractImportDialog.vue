<template>
  <v-dialog
    :model-value="modelValue"
    max-width="680"
    scrollable
    persistent
    content-class="mac-dialog-fit"
    @update:model-value="v => !v && close()"
  >
    <v-card class="mac-sheet pti">
      <div class="mac-sheet-head">
        <v-icon size="18">mdi-file-document-arrow-right-outline</v-icon>
        <span>帶入合約期款資料</span>
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
          <button type="button" class="mac-btn" @click="loadContract">重試</button>
        </div>

        <div v-else-if="!plan.hasData" class="pti-empty">
          <div class="pti-empty-title">尚未設定合約期款</div>
          <button type="button" class="mac-btn mac-btn--primary" @click="emit('open-contract-doc')">開啟合約製作設定</button>
        </div>

        <template v-else>
          <div v-for="text in warningTexts" :key="text" class="mac-callout mac-callout--warning pti-note">
            <v-icon size="16">mdi-alert-outline</v-icon><span>{{ text }}</span>
          </div>

          <div v-if="unassigned.length" class="mac-form-group pti-section pti-assign">
            <div class="pti-section-head">
              <span>尚未對應的已繳款</span>
              <span class="pti-section-total">{{ formatMoney(unassignedTotal) }} 元</span>
            </div>
            <div v-for="record in unassigned" :key="record.id" class="pti-assign-row">
              <div class="pti-assign-main">
                <span class="pti-assign-note">{{ paymentPeriodLabel(record) || '未填備註' }}</span>
                <span class="pti-assign-date">繳款 {{ record.date }}</span>
                <span class="pti-amount">{{ formatMoney(record.amount) }} 元</span>
              </div>
              <v-select
                :model-value="assignments[record.id] || ''"
                :items="assignOptions"
                item-title="title"
                item-value="value"
                class="mac-vfield pti-assign-select"
                variant="solo"
                flat
                density="compact"
                hide-details
                menu-icon="mdi-unfold-more-horizontal"
                aria-label="對應期別"
                :disabled="saving"
                @update:model-value="value => { assignmentChoices[record.id] = value || ''; }"
              ></v-select>
            </div>
          </div>

          <div class="mac-form-label pti-list-label">
            <span>期別</span>
            <span class="mac-spacer"></span>
            <button type="button" class="mac-btn mac-btn--sm" :disabled="saving" @click="emit('open-contract-doc')">
              <v-icon size="14">mdi-pencil-outline</v-icon>修改期款
            </button>
          </div>

          <div v-if="!plan.rows.length" class="mac-list-empty">沒有可帶入的期別</div>

          <div v-for="section in visibleSections" :key="section.id" class="mac-form-group pti-section">
            <div class="pti-section-head">
              <span>{{ section.label }}</span>
              <span class="pti-section-total">合計 {{ formatMoney(section.sumWan) }} 萬</span>
            </div>
            <template v-for="row in section.rows" :key="row.key">
              <div v-if="row.groupHead" class="pti-group-head">{{ row.groupHead }}</div>
              <div v-if="state[row.key]" class="pti-row" :class="{ 'is-off': !isRowChecked(row) }">
                <label class="pti-row-main">
                  <input
                    type="checkbox"
                    class="mac-check"
                    :checked="isRowChecked(row)"
                    :disabled="saving || !row.selectable"
                    @change="state[row.key].checked = $event.target.checked"
                  />
                  <span class="pti-name">
                    {{ row.name }}
                    <span v-if="rowTag(row)" class="mac-tag" :class="rowTag(row).cls">{{ rowTag(row).text }}</span>
                  </span>
                  <span class="pti-amount">
                    <template v-if="row.status === 'changed'">
                      <span class="pti-amount-old">{{ currentAmountText(row) }}</span>
                      <v-icon size="12">mdi-arrow-right</v-icon>
                    </template>
                    {{ formatMoney(rowAmount(row)) }} 元
                  </span>
                  <span v-if="rowDetail(row)" class="pti-detail">{{ rowDetail(row) }}</span>
                </label>
                <v-text-field
                  v-if="row.status === 'new'"
                  v-model="state[row.key].expectedDate"
                  class="mac-vfield pti-date"
                  type="date"
                  variant="solo"
                  flat
                  density="compact"
                  hide-details
                  :disabled="saving || !isRowChecked(row)"
                  aria-label="預計日"
                ></v-text-field>
                <span v-else-if="rowDateText(row)" class="pti-date-text">{{ rowDateText(row) }}</span>
              </div>
            </template>
          </div>

          <div v-if="plan.skippedCount" class="mac-sheet-note pti-skip">略過 {{ plan.skippedCount }} 期（金額 0 或負數）</div>

          <div v-if="saveError" class="mac-callout mac-callout--error pti-note pti-save-error">
            <v-icon size="16">mdi-alert-circle-outline</v-icon><span>{{ saveError }}</span>
          </div>
        </template>
      </v-card-text>

      <div class="mac-sheet-foot">
        <span v-if="missingDateCount" class="pti-missing">{{ missingDateCount }} 筆未填預計日，不會提醒</span>
        <span class="mac-spacer"></span>
        <button type="button" class="mac-btn" :disabled="saving" @click="close">{{ plan.rows.length ? '取消' : '關閉' }}</button>
        <button v-if="plan.rows.length" type="button" class="mac-btn mac-btn--primary" :disabled="!canSubmit" @click="submit">
          <v-progress-circular v-if="saving" indeterminate size="14" width="2" color="white"></v-progress-circular>
          <span>{{ submitLabel }}</span>
        </button>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
/**
 * 帶入合約期款資料，規格：docs/SPEC_PaymentDueReminder.md §6.9
 * 金額只讀合約製作上次儲存的內容，要改金額由「修改期款」開啟合約製作設定，關閉後重新讀取，已填內容保留。
 * 先前的已繳款只標期別，各期依已繳與溢繳沖抵後的差額帶入。
 */
import { computed, reactive, ref, watch } from 'vue';
import { fetchContractDocData } from '@/api';
import { isSpecialContractType } from '@/composables/usePriceFormula';
import {
  buildContractPlan,
  reconcileContractRows,
  suggestPeriodForRecord,
  unassignedPaidRecords,
} from '@/utils/contractPaymentPlan';
import { isValidYmd, paymentPeriodLabel } from '@/utils/paymentRecordStatus';
import { useProjectStore } from '@/store/projectStore';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: String, required: true },
  unitData: { type: Object, default: null },
  dealTotalWan: { type: Number, default: 0 },
  existingRecords: { type: Array, default: () => [] },
  contractDocOpen: { type: Boolean, default: false },
  submitHandler: { type: Function, required: true },
});
const emit = defineEmits(['update:modelValue', 'open-contract-doc']);

const projectStore = useProjectStore();

const loading = ref(true);
const loadError = ref('');
const contractData = ref(null);
const state = reactive({});
// 使用者在視窗內選的對應；沒選過的已繳款用系統預選
const assignmentChoices = reactive({});
const saving = ref(false);
const saveError = ref('');

const formatMoney = value => (Number(value) || 0).toLocaleString('zh-TW');

const householdDocId = computed(() => props.unitData?.id || `${props.projectId}_${props.unitData?.unitId || ''}`);

// 基準與合約製作相同：配套戶的期款看配套房屋總價、裝修期款看配套價格，一般戶看成交總價
const isPackageContract = computed(() => isSpecialContractType(
  props.unitData?.contractType,
  projectStore.getProjectById(props.projectId)?.packageContractTypes,
));
const packageDealWan = computed(() => Number(props.unitData?.price_package_deal) || 0);

const plan = computed(() => buildContractPlan(contractData.value, {
  isPackageContract: isPackageContract.value,
  mainBase: Math.round(isPackageContract.value ? packageDealWan.value : Number(props.dealTotalWan) || 0),
  decorationBase: isPackageContract.value ? Math.round((Number(props.dealTotalWan) || 0) - packageDealWan.value) : 0,
}));

const unassigned = computed(() => unassignedPaidRecords(plan.value, props.existingRecords));
const unassignedTotal = computed(() => unassigned.value.reduce((sum, record) => sum + (Number(record.amount) || 0), 0));
const assignOptions = computed(() => [
  { title: '不對應', value: '' },
  ...plan.value.rows.map(row => ({ title: row.period, value: row.period })),
]);
const assignments = computed(() => {
  const periods = new Set(plan.value.rows.map(row => row.period));
  return Object.fromEntries(unassigned.value.map((record) => {
    const choice = assignmentChoices[record.id];
    return [record.id, choice === '' || periods.has(choice) ? choice : suggestPeriodForRecord(record, plan.value)];
  }));
});
const assignedRecords = computed(() => unassigned.value.filter(record => assignments.value[record.id]));

const reconciled = computed(() => reconcileContractRows(plan.value, props.existingRecords, assignments.value));
const rows = computed(() => reconciled.value.rows);

const warningTexts = computed(() => [
  ...plan.value.sections.filter(s => !s.matchesBase).map(s => (s.hasRows
    ? `${s.label}合計 ${formatMoney(s.sumWan)} 萬，目前${s.baseLabel} ${formatMoney(s.baseWan)} 萬`
    : `${s.label}尚未設定`)),
  ...reconciled.value.overpaid.map(o => `${o.label}已繳超過合約 ${formatMoney(o.amount)} 元，沒有可沖抵的期別`),
]);

// 分組標題跟著該組第一個可帶入的子項，避免第一個子項被略過時標題消失
const visibleSections = computed(() => plan.value.sections.map((section) => {
  const seenGroups = new Set();
  return {
    ...section,
    rows: rows.value.filter(row => row.section === section.id).map((row) => {
      const groupHead = row.groupName && !seenGroups.has(row.groupName) ? row.groupName : '';
      if (row.groupName) seenGroups.add(row.groupName);
      return { ...row, groupHead };
    }),
  };
}).filter(section => section.rows.length > 0));

// 沒動過的列依狀態決定：要帶入的預設勾選；金額不同可能是有人刻意改的單筆，要更新才勾
const isRowChecked = row => row.selectable && (state[row.key]?.checked ?? row.status === 'new');
const checkedRows = computed(() => rows.value.filter(isRowChecked));
const missingDateCount = computed(() => checkedRows.value
  .filter(row => row.status === 'new' && !isValidYmd(state[row.key]?.expectedDate)).length);
const canSubmit = computed(() => !saving.value && (checkedRows.value.length > 0 || assignedRecords.value.length > 0));

const submitLabel = computed(() => {
  const updateCount = checkedRows.value.filter(row => row.status === 'changed').length;
  const addCount = checkedRows.value.length - updateCount;
  const parts = [
    assignedRecords.value.length && `對應 ${assignedRecords.value.length} 筆`,
    addCount && `帶入 ${addCount} 筆`,
    updateCount && `更新 ${updateCount} 筆`,
  ].filter(Boolean);
  return parts.join('、') || '帶入 0 筆';
});

function rowTag(row) {
  if (row.status === 'settled') return { text: '已繳清', cls: 'mac-tag--green' };
  if (row.status === 'same') return { text: '已帶入', cls: 'mac-tag--green' };
  if (row.status === 'changed') return { text: '金額不同', cls: 'mac-tag--orange' };
  if (row.status === 'existing') return { text: row.matchCount > 1 ? `已有 ${row.matchCount} 筆` : '已有', cls: '' };
  if (row.status === 'new' && row.isBalance) return { text: '差額', cls: 'mac-tag--blue' };
  return null;
}

// 已繳清顯示合約金額，其他顯示還要繳的金額
function rowAmount(row) {
  return row.status === 'settled' ? row.amount : row.due;
}

function rowDetail(row) {
  const parts = [];
  if (row.status !== 'settled' && row.isBalance) parts.push(`合約 ${formatMoney(row.amount)}`);
  if (row.paidAmount > 0) parts.push(`已繳 ${formatMoney(row.paidAmount)}`);
  if (row.offset > 0) parts.push(`由溢繳沖抵 ${formatMoney(row.offset)}`);
  if (row.surplus > 0) parts.push(`超過 ${formatMoney(row.surplus)}`);
  if (row.status === 'settled' && row.plannedAmount > 0) parts.push(`另有預計 ${formatMoney(row.plannedAmount)}`);
  return parts.length ? `${parts.join('，')} 元` : '';
}

function rowDateText(row) {
  if (row.status === 'settled' || !row.record) return '';
  return isValidYmd(row.record.expectedDate) ? `預計 ${row.record.expectedDate}` : '預計日未定';
}

function currentAmountText(row) {
  return Number(row.record?.expectedAmount) > 0 ? formatMoney(row.record.expectedAmount) : '未填';
}

// 重新讀取合約時保留已填內容
function syncRowState() {
  const next = {};
  rows.value.forEach((row) => {
    const previous = state[row.key];
    next[row.key] = { checked: previous?.checked, expectedDate: previous?.expectedDate ?? '' };
  });
  Object.keys(state).forEach((key) => { delete state[key]; });
  Object.assign(state, next);
}

async function loadContract() {
  loading.value = true;
  loadError.value = '';
  try {
    contractData.value = await fetchContractDocData(householdDocId.value);
  } catch (error) {
    loadError.value = `載入合約期款失敗：${error.message || '請稍後再試'}`;
  } finally {
    loading.value = false;
  }
}

function close() {
  if (saving.value) return;
  emit('update:modelValue', false);
}

async function submit() {
  if (!canSubmit.value) return;
  saving.value = true;
  saveError.value = '';
  // 先標期別再寫預計：差額是依對應結果算的，對應失敗就不該帶入
  const plans = [
    ...assignedRecords.value.map(record => ({
      kind: 'assign', recordId: record.id, date: record.date, amount: Number(record.amount), period: assignments.value[record.id], note: record.note || '',
    })),
    ...checkedRows.value.map(row => (row.status === 'changed'
      // 金額不同只改預計金額，期別、備註與預計日照舊
      ? { kind: 'update', recordId: row.record.id, note: row.record.note || '', expectedDate: row.record.expectedDate || null, expectedAmount: row.due }
      : { kind: 'add', period: row.period, note: row.isBalance ? '差額' : '', expectedDate: state[row.key].expectedDate || null, expectedAmount: row.due })),
  ];
  let savedCount = 0;
  try {
    await props.submitHandler(plans, { onPlanSaved: () => { savedCount += 1; } });
    saving.value = false;
    close();
  } catch (error) {
    // 已成功的項目會反映到紀錄上而不再送出，失敗重送不會重複
    saveError.value = savedCount
      ? `已完成 ${savedCount} 筆，其餘失敗：${error.message}`
      : `帶入失敗：${error.message}`;
    saving.value = false;
  }
}

// 期別改變時，渲染前先重建勾選與日期狀態
watch(() => rows.value.map(row => row.key).join('|'), syncRowState);
watch(() => props.contractDocOpen, (open, wasOpen) => {
  if (wasOpen && !open && props.modelValue) loadContract();
});
watch(() => props.modelValue, (open) => {
  if (!open) return;
  saveError.value = '';
  loadContract();
}, { immediate: true });
</script>

<style scoped>
.pti-body { padding: 14px !important; }
.pti-state { display: flex; justify-content: center; padding: 40px 16px; }
.pti-state--error { flex-direction: column; align-items: flex-start; gap: 12px; padding: 4px 0; }
.pti-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 16px;
}
.pti-empty-title { color: #6e6e73; font-size: 13.5px; }
.pti-note { margin-bottom: 8px; }
.pti-save-error { margin-top: 8px; margin-bottom: 0; }
.pti-list-label { align-items: center; margin-top: 4px; }
.pti-assign { margin-bottom: 10px; }
.pti-assign-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px;
  align-items: center;
  gap: 8px 12px;
  padding: 7px 14px;
  border-top: 1px solid #ececf0;
}
.pti-assign-main { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 10px; min-width: 0; }
.pti-assign-note { flex: 1 1 100%; min-width: 0; font-weight: 500; overflow-wrap: anywhere; }
.pti-assign-date { color: #6e6e73; font-size: 12.5px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.pti-assign .pti-amount { margin-left: 0; }
.pti-section + .pti-section { margin-top: 10px; }
.pti-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 14px;
  background: #f5f5f7;
  color: #1d1d1f;
  font-size: 12.5px;
  font-weight: 600;
}
.pti-section-total {
  color: #6e6e73;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.pti-group-head {
  padding: 6px 14px;
  background: #fafafb;
  border-top: 1px solid #ececf0;
  color: #6e6e73;
  font-size: 12px;
  font-weight: 600;
}
.pti-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 160px;
  align-items: center;
  gap: 8px 12px;
  min-height: 46px;
  padding: 7px 14px;
  border-top: 1px solid #ececf0;
}
.pti-row.is-off .pti-name,
.pti-row.is-off .pti-amount { color: #8e8e93; }
.pti-row-main { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; min-width: 0; cursor: pointer; }
/* 基準寬度固定：長名稱在自己的欄位內換行，勾選框不會被擠到上一行；放不下時金額才換到下一行 */
.pti-name { flex: 1 1 120px; min-width: 0; font-weight: 500; overflow-wrap: anywhere; }
.pti-amount {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.pti-amount-old { color: #8e8e93; }
.pti-detail { flex: 1 1 100%; padding-left: 24px; color: #6e6e73; font-size: 12px; overflow-wrap: anywhere; }
.pti-date-text {
  color: #6e6e73;
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: nowrap;
}
.pti-skip { margin: 8px 4px 0; }
.pti-missing { color: #9a5b00; font-size: 12.5px; }

@media (max-width: 600px) {
  .pti-body { padding: 12px !important; }
  .pti-row, .pti-assign-row { grid-template-columns: minmax(0, 1fr); }
  .pti-date-text { text-align: left; }
  /* 提示獨佔一行，取消與主要按鈕才會留在同一行靠右 */
  .pti-missing { flex: 1 1 100%; }
}
</style>
