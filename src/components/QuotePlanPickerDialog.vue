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

              <div v-if="hasPayment(plan)" class="mb-2 ml-8">
                <span class="text-caption text-grey-darken-1 mr-2">付款方式：</span>
                <!-- 多個付款方式且已勾選 → 需二次擇一 -->
                <template v-if="isSelected(plan.id) && plan.paymentTemplateIds.length > 1">
                  <v-radio-group
                    :model-value="selectedTemplateByPlan[plan.id] || null"
                    density="compact"
                    hide-details
                    class="mt-1"
                    @update:model-value="(v) => setPlanTemplate(plan.id, v)"
                  >
                    <v-radio
                      v-for="tid in plan.paymentTemplateIds"
                      :key="tid"
                      :value="tid"
                      :label="templateTitle(tid)"
                      @click.stop
                    ></v-radio>
                  </v-radio-group>
                </template>
                <template v-else>
                  <v-chip
                    v-for="tid in plan.paymentTemplateIds"
                    :key="tid"
                    size="small"
                    color="blue-darken-1"
                    variant="outlined"
                    class="mr-1 mb-1"
                  >{{ templateTitle(tid) }}</v-chip>
                </template>
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

const templateTitleMap = computed(() =>
  new Map((props.paymentTemplates || []).map(t => [t.id, `【${t.paymentCategory || '未分類'}】${t.templateName}`]))
);
function templateTitle(id) {
  return templateTitleMap.value.get(id) || '（範本已刪除）';
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

function setPlanTemplate(planId, templateId) {
  selectedTemplateByPlan[planId] = templateId;
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
.plan-pick-note {
  white-space: pre-wrap;
  background: #f5f5f5;
  border-radius: 4px;
  padding: 6px 10px;
}
</style>
