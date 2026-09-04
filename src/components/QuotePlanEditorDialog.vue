<template>
  <v-dialog v-model="show" max-width="860" persistent scrollable>
    <v-card>
      <v-card-title class="d-flex align-center bg-blue-grey-darken-2 text-white py-3">
        <v-icon start>mdi-star-box-multiple</v-icon>
        方案編輯器
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" size="small" @click="close"></v-btn>
      </v-card-title>

      <v-card-text class="pa-4">
        <div class="text-body-2 text-grey-darken-1 mb-4">
          預先定義方案（付款方式＋議價調整＋文字內容），報價人員可在報價項目一鍵套用。拖曳卡片可調整顯示順序。
        </div>

        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>

        <template v-else>
          <div v-if="plans.length === 0" class="text-center py-8 text-grey">
            尚未建立任何方案，請點「新增方案」。
          </div>

          <draggable
            v-model="plans"
            item-key="id"
            handle=".plan-drag-handle"
            @end="persistPlans"
          >
            <template #item="{ element: plan }">
              <v-card variant="outlined" class="mb-3 plan-card">
                <v-card-text class="py-3">
                  <div class="d-flex align-center mb-2">
                    <v-icon class="plan-drag-handle mr-2" style="cursor: grab;">mdi-drag</v-icon>
                    <span class="text-subtitle-1 font-weight-bold">{{ plan.name }}</span>
                    <v-chip
                      v-if="formatPlanPeriodText(plan)"
                      size="small"
                      :color="planStatusColor(plan)"
                      variant="flat"
                      class="ml-2"
                    >{{ PLAN_TIME_STATUS_LABEL[getPlanTimeStatus(plan)] }}</v-chip>
                    <v-spacer></v-spacer>
                    <v-btn icon="mdi-pencil" size="small" variant="text" color="primary" @click="openEdit(plan)"></v-btn>
                    <v-btn icon="mdi-delete-outline" size="small" variant="text" color="error" @click="confirmDelete(plan)"></v-btn>
                  </div>

                  <div v-if="formatPlanPeriodText(plan)" class="mb-2">
                    <span class="text-caption text-grey-darken-1 mr-2">啟用期間：</span>
                    <span class="text-caption" :class="getPlanTimeStatus(plan) === 'active' ? 'text-grey-darken-2' : 'text-error'">
                      {{ formatPlanPeriodText(plan) }}
                    </span>
                  </div>

                  <div v-if="planTemplateNames(plan).length" class="mb-2">
                    <span class="text-caption text-grey-darken-1 mr-2">付款方式：</span>
                    <v-chip
                      v-for="name in planTemplateNames(plan)"
                      :key="name"
                      size="small"
                      color="blue-darken-1"
                      variant="outlined"
                      class="mr-1 mb-1"
                    >{{ name }}</v-chip>
                  </div>

                  <div v-if="planAdjustmentText(plan)" class="mb-2">
                    <span class="text-caption text-grey-darken-1 mr-2">議價調整：</span>
                    <v-chip size="small" color="deep-purple-darken-1" variant="outlined">{{ planAdjustmentText(plan) }}</v-chip>
                  </div>

                  <div v-if="(plan.note || '').trim()" class="text-body-2 text-grey-darken-2 plan-note">
                    <v-icon size="small" class="mr-1">mdi-text-box-outline</v-icon>{{ plan.note }}
                  </div>
                </v-card-text>
              </v-card>
            </template>
          </draggable>
        </template>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-3">
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-plus"
          :disabled="loading"
          @click="openCreate"
        >新增方案</v-btn>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="close">關閉</v-btn>
      </v-card-actions>
    </v-card>

    <!-- 方案編輯表單 -->
    <v-dialog v-model="editDialog" max-width="600" persistent scrollable>
      <v-card>
        <v-card-title class="bg-blue-grey-darken-1 text-white py-3">
          <v-icon start>{{ editingId ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
          {{ editingId ? '編輯方案' : '新增方案' }}
        </v-card-title>

        <v-card-text class="pa-4">
          <v-text-field
            v-model="form.name"
            label="方案名稱 *"
            variant="outlined"
            density="comfortable"
            placeholder="例如：方案A"
            class="mb-3"
          ></v-text-field>

          <v-select
            v-model="form.paymentTemplateIds"
            :items="templateOptions"
            item-title="title"
            item-value="id"
            label="可選擇的付款方式（可複選）"
            variant="outlined"
            density="comfortable"
            multiple
            chips
            closable-chips
            clearable
            hint="套用方案時，若選了多個付款方式，需再擇一"
            persistent-hint
            class="mb-4"
          ></v-select>

          <div class="text-subtitle-2 font-weight-bold mb-2">啟用期間</div>
          <div class="text-caption text-grey-darken-1 mb-3">
            可設定方案的啟用與結束時間（台灣時間），留空代表不限制；不在期間內的方案報價端將顯示「尚未開始」或「已截止」且不可選擇。
          </div>
          <v-row dense class="mb-3">
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.activeFrom"
                label="啟用時間"
                type="datetime-local"
                variant="outlined"
                density="compact"
                clearable
                hide-details
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.activeUntil"
                label="結束時間"
                type="datetime-local"
                variant="outlined"
                density="compact"
                clearable
                hide-details
              ></v-text-field>
            </v-col>
          </v-row>

          <div class="text-subtitle-2 font-weight-bold mb-2">議價調整</div>
          <div class="text-caption text-grey-darken-1 mb-3">
            「每坪調整」「直接調整」可並存；「輸入總價」與前兩者互斥（輸入其一會清空另一方）。
          </div>

          <v-text-field
            v-model="form.perTsuboValue"
            autocomplete="off"
            :name="`plan-neg-perTsuboValue-${noAutofillSeed}`"
            label="每坪調整"
            type="number"
            suffix="萬/坪"
            placeholder="例如: -2.5 (減) 或 +0.5 (加)"
            variant="outlined"
            density="compact"
            class="mb-3"
            @update:model-value="onAdjustmentInput"
          ></v-text-field>

          <v-text-field
            v-model="form.directAmountValue"
            autocomplete="off"
            :name="`plan-neg-directAmountValue-${noAutofillSeed}`"
            label="直接調整總價"
            type="number"
            suffix="萬"
            placeholder="例如: -5 (減) 或 +10 (加)"
            variant="outlined"
            density="compact"
            class="mb-3"
            @update:model-value="onAdjustmentInput"
          ></v-text-field>

          <v-text-field
            v-model="form.totalPriceValue"
            autocomplete="off"
            :name="`plan-neg-totalPriceValue-${noAutofillSeed}`"
            label="直接輸入總價"
            type="number"
            suffix="萬"
            placeholder="例如: 3500"
            variant="outlined"
            density="compact"
            hint="直接以此金額作為房屋總價，與上方調整欄位互斥"
            persistent-hint
            class="mb-4"
            @update:model-value="onTotalPriceInput"
          ></v-text-field>

          <v-textarea
            v-model="form.note"
            label="其他（文字內容）"
            variant="outlined"
            rows="2"
            auto-grow
            placeholder="例如：贈送冷氣全室20萬、優惠免收代辦費20萬"
          ></v-textarea>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-3">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="editDialog = false">取消</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="savePlan">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue';
import { useToast } from 'vue-toastification';
import draggable from 'vuedraggable';
import { fetchQuotePlans, saveQuotePlans } from '@/api';
import { useUserStore } from '@/store/user';
import { getPlanTimeStatus, PLAN_TIME_STATUS_LABEL, formatPlanPeriodText } from '@/utils/quotePlanUtils';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: String, default: '' },
  paymentTemplates: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue']);

const toast = useToast();
const userStore = useUserStore();

const show = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const plans = ref([]);
const loading = ref(false);
const saving = ref(false);

// 付款方式選項：排除「配套期款」（其計算基準為配套金額，不可套用於總價期款）
const templateOptions = computed(() =>
  (props.paymentTemplates || [])
    .filter(t => t.paymentCategory !== '配套期款')
    .map(t => ({ id: t.id, title: `【${t.paymentCategory || '未分類'}】${t.templateName}` }))
);

const templateNameMap = computed(() =>
  new Map(templateOptions.value.map(o => [o.id, o.title]))
);

function planTemplateNames(plan) {
  return (plan.paymentTemplateIds || [])
    .map(id => templateNameMap.value.get(id))
    .filter(Boolean);
}

function planStatusColor(plan) {
  const status = getPlanTimeStatus(plan);
  if (status === 'notStarted') return 'orange-darken-2';
  if (status === 'ended') return 'red-darken-2';
  return 'green-darken-1';
}

function planAdjustmentText(plan) {
  const parts = (plan.adjustments || []).map(a => {
    if (a.mode === 'perTsubo') return `每坪 ${a.value > 0 ? '+' : ''}${a.value} 萬`;
    if (a.mode === 'directAmount') return `直接 ${a.value > 0 ? '+' : ''}${a.value} 萬`;
    if (a.mode === 'totalPrice') return `輸入總價 ${a.value} 萬`;
    return '';
  }).filter(Boolean);
  return parts.join('｜');
}

// 開啟時載入最新方案清單
watch(show, async (visible) => {
  if (!visible) return;
  loading.value = true;
  try {
    const res = await fetchQuotePlans(props.projectId);
    if (res.status === 'success') {
      plans.value = [...res.data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    } else {
      throw new Error(res.message);
    }
  } catch (e) {
    toast.error(`載入方案失敗：${e.message}`);
    plans.value = [];
  } finally {
    loading.value = false;
  }
});

async function persistPlans() {
  const normalized = plans.value.map((p, i) => ({ ...p, order: i }));
  const res = await saveQuotePlans(props.projectId, normalized, userStore.user?.name || '');
  if (res.status === 'success') {
    plans.value = normalized;
  } else {
    toast.error(`儲存失敗：${res.message}`);
  }
  return res.status === 'success';
}

// ── 編輯表單 ──
const editDialog = ref(false);
const editingId = ref(null);
// ✅ [公用電腦防殘留] 議價欄位關閉瀏覽器自動完成：name 每次掛載都不同
const noAutofillSeed = Math.random().toString(36).slice(2, 10);

const form = reactive({
  name: '',
  paymentTemplateIds: [],
  activeFrom: '',
  activeUntil: '',
  perTsuboValue: '',
  directAmountValue: '',
  totalPriceValue: '',
  note: '',
});

// 每坪/直接調整輸入：與「輸入總價」互斥（比照 QuoteItem 議價調整）
function onAdjustmentInput() {
  if (form.totalPriceValue !== '') form.totalPriceValue = '';
}
function onTotalPriceInput() {
  if (form.perTsuboValue !== '') form.perTsuboValue = '';
  if (form.directAmountValue !== '') form.directAmountValue = '';
}

function genPlanId() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `plan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function openCreate() {
  editingId.value = null;
  form.name = '';
  form.paymentTemplateIds = [];
  form.activeFrom = '';
  form.activeUntil = '';
  form.perTsuboValue = '';
  form.directAmountValue = '';
  form.totalPriceValue = '';
  form.note = '';
  editDialog.value = true;
}

function openEdit(plan) {
  editingId.value = plan.id;
  form.name = plan.name || '';
  form.paymentTemplateIds = [...(plan.paymentTemplateIds || [])];
  form.activeFrom = plan.activeFrom || '';
  form.activeUntil = plan.activeUntil || '';
  const adj = (mode) => (plan.adjustments || []).find(a => a.mode === mode);
  form.perTsuboValue = adj('perTsubo') ? String(adj('perTsubo').value) : '';
  form.directAmountValue = adj('directAmount') ? String(adj('directAmount').value) : '';
  form.totalPriceValue = adj('totalPrice') ? String(adj('totalPrice').value) : '';
  form.note = plan.note || '';
  editDialog.value = true;
}

function buildAdjustments() {
  const adjustments = [];
  if (form.totalPriceValue !== '') {
    adjustments.push({ mode: 'totalPrice', value: Number(form.totalPriceValue) });
  } else {
    if (form.perTsuboValue !== '') adjustments.push({ mode: 'perTsubo', value: Number(form.perTsuboValue) });
    if (form.directAmountValue !== '') adjustments.push({ mode: 'directAmount', value: Number(form.directAmountValue) });
  }
  return adjustments;
}

async function savePlan() {
  const name = String(form.name || '').trim();
  if (!name) {
    toast.error('請輸入方案名稱');
    return;
  }
  if (plans.value.some(p => p.name === name && p.id !== editingId.value)) {
    toast.error('方案名稱重複，請改用其他名稱');
    return;
  }
  const adjustments = buildAdjustments();
  for (const a of adjustments) {
    if (!Number.isFinite(a.value)) {
      toast.error('議價調整數值格式錯誤');
      return;
    }
    if (a.mode === 'totalPrice' && a.value <= 0) {
      toast.error('「輸入總價」必須大於 0');
      return;
    }
  }
  const note = String(form.note || '').trim();
  if (form.paymentTemplateIds.length === 0 && adjustments.length === 0 && !note) {
    toast.error('付款方式、議價調整、文字內容至少需設定一項');
    return;
  }
  // 啟用期間：clearable 清除時值為 null，一律正規化為字串
  const activeFrom = String(form.activeFrom || '').trim();
  const activeUntil = String(form.activeUntil || '').trim();
  if (activeFrom && activeUntil && activeFrom >= activeUntil) {
    toast.error('「結束時間」必須晚於「啟用時間」');
    return;
  }

  saving.value = true;
  try {
    const payload = {
      id: editingId.value || genPlanId(),
      name,
      paymentTemplateIds: [...form.paymentTemplateIds],
      activeFrom,
      activeUntil,
      adjustments,
      note,
    };
    if (editingId.value) {
      const idx = plans.value.findIndex(p => p.id === editingId.value);
      if (idx !== -1) plans.value.splice(idx, 1, { ...plans.value[idx], ...payload });
    } else {
      plans.value.push({ ...payload, order: plans.value.length });
    }
    const ok = await persistPlans();
    if (ok) {
      toast.success('方案已儲存');
      editDialog.value = false;
    }
  } finally {
    saving.value = false;
  }
}

async function confirmDelete(plan) {
  const confirmed = confirm(
    `確定要刪除方案「${plan.name}」嗎？\n已設定此方案的戶別將自動忽略該方案。`
  );
  if (!confirmed) return;
  plans.value = plans.value.filter(p => p.id !== plan.id);
  const ok = await persistPlans();
  if (ok) toast.success('方案已刪除');
}

function close() {
  show.value = false;
}
</script>

<style scoped>
.plan-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
.plan-note {
  white-space: pre-wrap;
  background: #f5f5f5;
  border-radius: 4px;
  padding: 6px 10px;
}
</style>
