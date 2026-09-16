<template>
  <v-dialog v-model="show" max-width="640" scrollable>
    <v-card>
      <v-card-title class="plan-picker-header text-white d-flex align-center py-3">
        <v-icon start>mdi-star-box-multiple</v-icon>
        選擇方案 - {{ item.unitId }}
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" size="small" @click="show = false"></v-btn>
      </v-card-title>

      <v-card-text class="pa-4">
        <!-- 戶別未設定可選方案 → 不可選任何方案；有設定但全數不在啟用期間 → 提示無開放中方案 -->
        <v-alert v-if="visiblePlans.length === 0" type="info" variant="tonal">
          <template v-if="unitPlans.length > 0">
            目前沒有開放中的方案（已截止或尚未開始的方案不會顯示）。
          </template>
          <template v-else>
            此戶別尚未設定可選方案，請洽銷控人員於銷控系統的「銷售資訊」設定「可選方案」。
          </template>
        </v-alert>

        <template v-else>
          <v-card
            v-for="plan in visiblePlans"
            :key="plan.id"
            variant="outlined"
            class="mb-3 plan-pick-card"
            :class="{
              'plan-pick-selected': isSelected(plan.id),
              'plan-pick-disabled': isPlanDisabled(plan)
            }"
            @click="togglePlan(plan)"
          >
            <v-card-text class="py-3">
              <div class="d-flex align-center mb-1">
                <v-checkbox-btn
                  :model-value="isSelected(plan.id)"
                  :disabled="isPlanDisabled(plan)"
                  density="compact"
                  class="flex-grow-0 mr-1"
                  @click.stop="togglePlan(plan)"
                ></v-checkbox-btn>
                <span class="text-subtitle-1 font-weight-bold">{{ plan.name }}</span>
                <v-spacer></v-spacer>
                <span v-if="isPlanDisabled(plan)" class="text-caption text-error">{{ disabledReason(plan) }}</span>
              </div>

              <div v-if="formatPlanPeriodText(plan)" class="ml-8 mb-2">
                <span class="text-caption text-grey-darken-1 mr-2">啟用期間：</span>
                <span class="text-caption text-grey-darken-2">{{ formatPlanPeriodText(plan) }}</span>
              </div>

              <div v-if="hasPayment(plan)" class="mb-2 ml-8 plan-pay">
                <div class="plan-pay-title">
                  <span class="text-caption text-grey-darken-1">付款方式</span>
                  <span
                    v-if="plan.paymentTemplateIds.length > 1"
                    class="plan-pay-hint"
                    :class="{ 'is-pending': isSelected(plan.id) && !selectedTemplateByPlan[plan.id] }"
                  >擇一</span>
                </div>
                <div class="plan-pay-list">
                  <button
                    v-for="tid in plan.paymentTemplateIds"
                    :key="tid"
                    type="button"
                    class="plan-pay-option"
                    :class="{
                      'is-checked': isTemplateChecked(plan, tid),
                      'is-missing': !templateExists(tid)
                    }"
                    :disabled="!templateExists(tid) || (isPlanDisabled(plan) && !isSelected(plan.id))"
                    @click.stop="pickTemplate(plan, tid)"
                  >
                    <span class="plan-pay-radio">
                      <v-icon v-if="isTemplateChecked(plan, tid)" size="14">mdi-check-bold</v-icon>
                    </span>
                    <span v-if="templateExists(tid)" class="plan-pay-cat">{{ templateCategory(tid) }}</span>
                    <span class="plan-pay-name">{{ templateName(tid) }}</span>
                  </button>
                </div>
              </div>

              <div v-if="hasNegotiation(plan)" class="mb-2 ml-8">
                <span class="text-caption text-grey-darken-1 mr-2">議價調整：</span>
                <v-chip size="small" color="deep-purple-darken-1" variant="outlined">{{ adjustmentText(plan) }}</v-chip>
              </div>

              <div v-if="(plan.note || '').trim()" class="text-body-2 text-grey-darken-2 ml-8 plan-pick-note">
                <v-icon size="small" class="mr-1">mdi-text-box-outline</v-icon>{{ plan.note }}
              </div>
            </v-card-text>
          </v-card>
        </template>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-3">
        <v-btn
          v-if="(item.appliedPlans || []).length > 0"
          color="red-darken-1"
          variant="text"
          prepend-icon="mdi-close-circle-outline"
          @click="handleClear"
        >清除方案</v-btn>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="show = false">取消</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="!canApply"
          @click="handleApply"
        >確認套用</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { getPlanTimeStatus, PLAN_TIME_STATUS_LABEL, formatPlanPeriodText } from '@/utils/quotePlanUtils';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // 報價項目（quoteStore item）
  item: { type: Object, required: true },
  // 建案全部方案（依 order 排序）
  plans: { type: Array, default: () => [] },
  // 期款範本（顯示付款方式名稱用）
  paymentTemplates: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'apply', 'clear']);

const toast = useToast();

const show = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

// ── 可選方案過濾：戶別有設定 availablePlans 才顯示（未設定 → 空清單，不可選） ──
// 戶別可選方案（未過濾啟用期間），用於區分「未設定」與「全數已截止/尚未開始」兩種空清單訊息
const unitPlans = computed(() => {
  const availableIds = props.item?.unitDetails?.availablePlans;
  if (!Array.isArray(availableIds) || availableIds.length === 0) return [];
  const idSet = new Set(availableIds);
  return (props.plans || []).filter(p => idSet.has(p.id));
});

// 不在啟用期間內（已截止/尚未開始）的方案前端完全隱藏
const visiblePlans = computed(() =>
  unitPlans.value.filter(p => getPlanTimeStatus(p) === 'active')
);

function hasNegotiation(plan) {
  return Array.isArray(plan.adjustments) && plan.adjustments.length > 0;
}
function hasPayment(plan) {
  return Array.isArray(plan.paymentTemplateIds) && plan.paymentTemplateIds.length > 0;
}

const templateMap = computed(() =>
  new Map((props.paymentTemplates || []).map(t => [t.id, t]))
);
const templateTitleMap = computed(() =>
  new Map((props.paymentTemplates || []).map(t => [t.id, `【${t.paymentCategory || '未分類'}】${t.templateName}`]))
);
function templateExists(id) {
  return templateMap.value.has(id);
}
function templateCategory(id) {
  return templateMap.value.get(id)?.paymentCategory || '未分類';
}
function templateName(id) {
  return templateMap.value.get(id)?.templateName || '（範本已刪除）';
}

function adjustmentText(plan) {
  return (plan.adjustments || []).map(a => {
    if (a.mode === 'perTsubo') return `每坪 ${a.value > 0 ? '+' : ''}${a.value} 萬`;
    if (a.mode === 'directAmount') return `直接 ${a.value > 0 ? '+' : ''}${a.value} 萬`;
    if (a.mode === 'totalPrice') return `輸入總價 ${a.value} 萬`;
    return '';
  }).filter(Boolean).join('｜');
}

// ── 勾選狀態 ──
const selectedIds = ref([]);
const selectedTemplateByPlan = reactive({});

function isSelected(planId) {
  return selectedIds.value.includes(planId);
}

const selectedPlans = computed(() =>
  visiblePlans.value.filter(p => isSelected(p.id))
);

// 啟用期間狀態（開啟期間即時判斷，以台灣時間為準）
function planTimeStatus(plan) {
  return getPlanTimeStatus(plan);
}

// 衝突規則（最嚴格）：不在啟用期間內的方案一律停用；
// 含議價調整的方案僅能選一個；含付款方式的方案僅能選一個
function isPlanDisabled(plan) {
  if (planTimeStatus(plan) !== 'active') return true;
  if (isSelected(plan.id)) return false;
  if (hasNegotiation(plan) && selectedPlans.value.some(p => hasNegotiation(p))) return true;
  if (hasPayment(plan) && selectedPlans.value.some(p => hasPayment(p))) return true;
  return false;
}

function disabledReason(plan) {
  const timeStatus = planTimeStatus(plan);
  if (timeStatus !== 'active') return PLAN_TIME_STATUS_LABEL[timeStatus];
  if (hasNegotiation(plan) && selectedPlans.value.some(p => hasNegotiation(p))) return '議價調整方案僅能擇一';
  if (hasPayment(plan) && selectedPlans.value.some(p => hasPayment(p))) return '付款方式方案僅能擇一';
  return '';
}

function togglePlan(plan) {
  if (isSelected(plan.id)) {
    selectedIds.value = selectedIds.value.filter(id => id !== plan.id);
    return;
  }
  if (isPlanDisabled(plan)) return;
  selectedIds.value = [...selectedIds.value, plan.id];
  // 只有一個付款方式 → 自動選定
  if (hasPayment(plan) && plan.paymentTemplateIds.length === 1) {
    selectedTemplateByPlan[plan.id] = plan.paymentTemplateIds[0];
  }
}

function isTemplateChecked(plan, templateId) {
  return isSelected(plan.id) && selectedTemplateByPlan[plan.id] === templateId;
}

// 點選付款方式：未勾選的方案會一併勾選，再選定該範本
function pickTemplate(plan, templateId) {
  if (!templateExists(templateId)) return;
  if (!isSelected(plan.id)) {
    if (isPlanDisabled(plan)) return;
    selectedIds.value = [...selectedIds.value, plan.id];
  }
  selectedTemplateByPlan[plan.id] = templateId;
}

// 套用條件：至少選一個方案，且每個含付款方式的已選方案都已擇定範本（範本需仍存在）
const canApply = computed(() => {
  if (selectedPlans.value.length === 0) return false;
  return selectedPlans.value.every(p => {
    if (!hasPayment(p)) return true;
    const tid = selectedTemplateByPlan[p.id];
    return !!tid && templateTitleMap.value.has(tid);
  });
});

// 開啟時：以既有 appliedPlans 還原勾選狀態
watch(show, (visible) => {
  if (!visible) return;
  const applied = props.item?.appliedPlans || [];
  // 僅還原目前仍在啟用期間內的方案（已截止/尚未開始的方案不可再選擇）
  const selectableIdSet = new Set(
    visiblePlans.value.filter(p => planTimeStatus(p) === 'active').map(p => p.id)
  );
  selectedIds.value = applied.map(a => a.planId).filter(id => selectableIdSet.has(id));
  Object.keys(selectedTemplateByPlan).forEach(k => delete selectedTemplateByPlan[k]);
  applied.forEach(a => {
    if (a.selectedPaymentTemplateId) selectedTemplateByPlan[a.planId] = a.selectedPaymentTemplateId;
  });
  // 補：勾選中的方案只有一個付款方式 → 自動選定
  visiblePlans.value.forEach(p => {
    if (selectedIds.value.includes(p.id) && hasPayment(p) && p.paymentTemplateIds.length === 1) {
      selectedTemplateByPlan[p.id] = p.paymentTemplateIds[0];
    }
  });
});

function handleApply() {
  if (!canApply.value) {
    toast.error('請先完成方案與付款方式選擇');
    return;
  }
  const selections = selectedPlans.value.map(plan => ({
    plan,
    selectedPaymentTemplateId: hasPayment(plan) ? (selectedTemplateByPlan[plan.id] || null) : null,
  }));
  emit('apply', selections);
  show.value = false;
}

function handleClear() {
  emit('clear');
  show.value = false;
}
</script>

<style scoped>
.plan-picker-header {
  background: linear-gradient(135deg, #5e35b1, #d81b60);
}
.plan-pick-card {
  cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s;
}
.plan-pick-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
.plan-pick-selected {
  border-color: #5e35b1;
  border-width: 2px;
  background: #f6f2fb;
}
.plan-pick-disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
/* 付款方式選項列：單欄整齊排列，點選即勾選 */
.plan-pay-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.plan-pay-hint {
  font-size: 11px;
  line-height: 1;
  padding: 3px 7px;
  border-radius: 999px;
  background: #eeeeee;
  color: #757575;
}
.plan-pay-hint.is-pending {
  background: #fdecea;
  color: #c62828;
}
.plan-pay-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.plan-pay-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 38px;
  padding: 6px 12px 6px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  color: #212121;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.12s, background 0.12s, box-shadow 0.12s;
  -webkit-tap-highlight-color: transparent;
}
.plan-pay-option:hover:not(:disabled) {
  border-color: #b39ddb;
  background: #faf8fd;
}
.plan-pay-option:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.plan-pay-option.is-checked {
  border-color: #5e35b1;
  background: #ede7f6;
  box-shadow: inset 0 0 0 1px #5e35b1;
}
.plan-pay-radio {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #bdbdbd;
  background: #fff;
  color: #fff;
  transition: border-color 0.12s, background 0.12s;
}
.plan-pay-option.is-checked .plan-pay-radio {
  border-color: #5e35b1;
  background: #5e35b1;
}
.plan-pay-cat {
  flex: none;
  font-size: 11px;
  line-height: 1;
  padding: 4px 7px;
  border-radius: 6px;
  background: #e3f2fd;
  color: #1565c0;
  white-space: nowrap;
}
.plan-pay-option.is-checked .plan-pay-cat {
  background: #5e35b1;
  color: #fff;
}
.plan-pay-name {
  flex: 1;
  min-width: 0;
  line-height: 1.35;
  word-break: break-word;
}
.plan-pay-option.is-missing .plan-pay-name {
  color: #9e9e9e;
  text-decoration: line-through;
}
.plan-pick-note {
  white-space: pre-wrap;
  background: #f5f5f5;
  border-radius: 4px;
  padding: 6px 10px;
}
</style>
