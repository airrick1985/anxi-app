<template>
  <v-navigation-drawer
    :model-value="modelValue"
    location="right"
    temporary
    :width="drawerWidth"
    class="pipeline-drawer"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template v-if="sub && cycle">
      <div class="pd-header">
        <div class="d-flex align-center">
          <div class="flex-grow-1" style="min-width: 0;">
            <div class="text-subtitle-1 font-weight-bold text-truncate">{{ sub.projectName }}</div>
            <div class="text-caption text-grey-darken-1">{{ sub.systemFunction }}</div>
          </div>
          <v-btn icon="mdi-pencil-outline" variant="text" size="small" title="訂閱資料" @click="emit('edit', sub)"></v-btn>
          <v-btn icon="mdi-close" variant="text" size="small" @click="emit('update:modelValue', false)"></v-btn>
        </div>
        <div class="d-flex flex-wrap align-center ga-2 mt-1">
          <v-chip :color="sub.color" size="x-small" label>{{ sub.status }}</v-chip>
          <v-chip :color="stageMeta(currentSummary.stage).color" size="x-small" label variant="flat">{{ stageMeta(currentSummary.stage).label }}</v-chip>
          <span v-if="sub.startDate" class="text-caption text-grey-darken-1">{{ sub.startDate }} ～ {{ sub.endDate }}</span>
          <v-chip v-if="sub.nextFollowUpDate" size="x-small" color="orange" variant="tonal" label>
            <v-icon start size="12">mdi-bell-outline</v-icon>{{ sub.nextFollowUpDate }}
          </v-chip>
        </div>
      </div>

      <v-tabs v-model="tab" density="compact" color="primary" grow>
        <v-tab value="flow">流程</v-tab>
        <v-tab value="followup">跟進紀錄</v-tab>
      </v-tabs>
      <v-divider></v-divider>

      <v-window v-model="tab">
        <!-- ===== 流程 ===== -->
        <v-window-item value="flow">
          <div class="pa-4">
            <div class="d-flex align-center flex-wrap ga-2 mb-3">
              <v-chip
                v-for="c in cycles"
                :key="c.id"
                :color="c.no === cycle.no ? 'primary' : undefined"
                :variant="c.no === cycle.no ? 'flat' : 'outlined'"
                size="small"
                @click="selectedNo = c.no"
              >第{{ c.no }}輪</v-chip>
              <v-spacer></v-spacer>
              <v-btn
                v-if="canStartNewCycle"
                size="small"
                variant="tonal"
                color="primary"
                prepend-icon="mdi-autorenew"
                :loading="saving"
                @click="startNewCycle"
              >開新一輪</v-btn>
            </div>

            <!-- 輪次步驟 -->
            <div v-for="key in CYCLE_STEP_KEYS" :key="key" class="pd-step" :class="`is-${cycleStepState(key)}`">
              <div class="pd-dot">
                <v-icon v-if="cycleStepState(key) === 'done'" size="18" color="white">mdi-check</v-icon>
                <v-icon v-else-if="cycleStepState(key) === 'skipped'" size="18" color="white">mdi-debug-step-over</v-icon>
                <span v-else>{{ CYCLE_STEP_KEYS.indexOf(key) + 1 }}</span>
              </div>
              <div class="flex-grow-1" style="min-width: 0;">
                <div class="d-flex align-center flex-wrap ga-2">
                  <span class="font-weight-bold">{{ STEP_LABELS[key] }}</span>
                  <span v-if="cycle.steps[key].date" class="text-body-2">{{ cycle.steps[key].date }}</span>
                  <v-chip v-if="cycle.steps[key].status === 'skipped'" size="x-small" label>略過</v-chip>
                </div>
                <div v-for="(line, i) in stepLines(key, cycle.steps[key])" :key="i" class="text-body-2 text-grey-darken-2">{{ line }}</div>
                <div v-if="cycle.steps[key].by" class="text-caption text-grey">{{ cycle.steps[key].byName || cycle.steps[key].by }} · {{ formatTime(cycle.steps[key].at) }}</div>
                <AttachmentField
                  v-if="cycle.steps[key].attachments.length"
                  :model-value="cycle.steps[key].attachments"
                  :path-prefix="pathPrefix"
                  readonly
                  class="mt-1"
                />
              </div>
              <div class="d-flex align-start ga-1 flex-shrink-0">
                <v-btn
                  v-if="key === 'quote'"
                  size="small"
                  variant="tonal"
                  color="primary"
                  prepend-icon="mdi-file-document-edit-outline"
                  @click="openQuote"
                >報價單</v-btn>
                <v-btn
                  v-if="cycleStepState(key) === 'current'"
                  size="small"
                  color="primary"
                  variant="flat"
                  @click="openStep(key, 'complete')"
                >完成</v-btn>
                <v-menu>
                  <template v-slot:activator="{ props: menuProps }">
                    <v-btn v-bind="menuProps" icon="mdi-dots-vertical" size="small" variant="text"></v-btn>
                  </template>
                  <v-list density="compact">
                    <v-list-item v-if="cycleStepState(key) === 'current'" title="略過" prepend-icon="mdi-debug-step-over" @click="openStep(key, 'skip')"></v-list-item>
                    <v-list-item v-if="isClosed(cycle.steps[key])" title="編輯" prepend-icon="mdi-pencil-outline" @click="openStep(key, 'edit')"></v-list-item>
                    <v-list-item v-if="isClosed(cycle.steps[key]) && canUndo(cycle, key)" title="撤銷" prepend-icon="mdi-undo" @click="undo(key)"></v-list-item>
                    <v-list-item v-if="cycleStepState(key) === 'future'" title="需先完成前一步" disabled></v-list-item>
                  </v-list>
                </v-menu>
              </div>
            </div>

            <!-- 款項 -->
            <div class="d-flex align-center mt-5 mb-2">
              <span class="text-subtitle-2 font-weight-bold">款項</span>
              <span v-if="cycle.installments.length" class="text-caption text-grey ms-2">
                共 {{ cycle.installments.length }} 期 · {{ money(installmentTotal) }}
              </span>
              <v-spacer></v-spacer>
              <v-btn size="small" variant="text" color="primary" prepend-icon="mdi-plus" @click="openInstallment(null)">新增一期</v-btn>
            </div>
            <div v-if="cycle.installments.length === 0" class="text-center text-grey text-body-2 py-4 pd-empty">
              儲存報價單後依付款條件自動產生
            </div>

            <v-card v-for="inst in cycle.installments" :key="inst.id" variant="outlined" class="mb-3">
              <v-card-text class="pa-3">
                <div class="d-flex align-start">
                  <div class="d-flex align-center flex-wrap ga-2 flex-grow-1">
                    <span class="font-weight-bold">{{ inst.label }}</span>
                    <span class="text-body-2">{{ money(inst.amount) }}</span>
                    <v-spacer></v-spacer>
                    <template v-if="inst.dueDate">
                      <span class="text-body-2">預計 {{ inst.dueDate }}</span>
                      <v-chip v-if="dueChip(inst)" :color="dueChip(inst).color" size="x-small" label>{{ dueChip(inst).text }}</v-chip>
                    </template>
                    <span v-else class="text-caption text-grey">繳款日待定</span>
                  </div>
                  <v-menu>
                    <template v-slot:activator="{ props: menuProps }">
                      <v-btn v-bind="menuProps" icon="mdi-dots-vertical" size="x-small" variant="text"></v-btn>
                    </template>
                    <v-list density="compact">
                      <v-list-item title="編輯" prepend-icon="mdi-pencil-outline" @click="openInstallment(inst)"></v-list-item>
                      <v-list-item
                        title="刪除"
                        prepend-icon="mdi-delete-outline"
                        :disabled="installmentHasProgress(inst)"
                        @click="removeInstallment(inst)"
                      ></v-list-item>
                    </v-list>
                  </v-menu>
                </div>
                <div class="text-caption text-grey">{{ planText(inst) }}<span v-if="inst.note"> · {{ inst.note }}</span></div>

                <div class="d-flex flex-wrap ga-2 mt-2">
                  <v-menu v-for="key in INSTALLMENT_STEP_KEYS" :key="key">
                    <template v-slot:activator="{ props: menuProps }">
                      <v-btn
                        v-bind="menuProps"
                        size="small"
                        :variant="instStepState(inst, key) === 'current' ? 'outlined' : 'tonal'"
                        :color="STEP_BTN_COLORS[instStepState(inst, key)]"
                        :disabled="instStepState(inst, key) === 'future'"
                        class="pd-inst-step"
                      >
                        <v-icon v-if="instStepState(inst, key) === 'done'" start size="16">mdi-check</v-icon>
                        <v-icon v-else-if="instStepState(inst, key) === 'skipped'" start size="16">mdi-debug-step-over</v-icon>
                        {{ STEP_LABELS[key] }}
                        <span v-if="inst.steps[key].date" class="ms-1 text-caption">{{ inst.steps[key].date.slice(5) }}</span>
                      </v-btn>
                    </template>
                    <v-list density="compact">
                      <template v-if="instStepState(inst, key) === 'current'">
                        <v-list-item title="完成" prepend-icon="mdi-check" @click="openStep(key, 'complete', inst)"></v-list-item>
                        <v-list-item title="略過" prepend-icon="mdi-debug-step-over" @click="openStep(key, 'skip', inst)"></v-list-item>
                      </template>
                      <template v-else>
                        <v-list-item title="編輯" prepend-icon="mdi-pencil-outline" @click="openStep(key, 'edit', inst)"></v-list-item>
                        <v-list-item v-if="canUndo(cycle, key, inst)" title="撤銷" prepend-icon="mdi-undo" @click="undo(key, inst)"></v-list-item>
                      </template>
                    </v-list>
                  </v-menu>
                </div>

                <div v-for="(line, i) in instLines(inst)" :key="i" class="text-caption text-grey-darken-2 mt-1">{{ line }}</div>
                <template v-for="key in INSTALLMENT_STEP_KEYS" :key="`att-${key}`">
                  <AttachmentField
                    v-if="inst.steps[key].attachments.length"
                    :model-value="inst.steps[key].attachments"
                    :path-prefix="pathPrefix"
                    readonly
                    class="mt-1"
                  />
                </template>
              </v-card-text>
            </v-card>
          </div>
        </v-window-item>

        <!-- ===== 跟進紀錄 ===== -->
        <v-window-item value="followup">
          <div class="pa-4">
            <FollowupTimeline
              :subscription="sub"
              :cycle-no="cycle.no"
              :user="user"
              :refresh-key="followupRefresh"
              @changed="emit('updated')"
            />
          </div>
        </v-window-item>
      </v-window>
    </template>

    <StepDialog
      v-model="stepDialog.open"
      :step-key="stepDialog.stepKey"
      :step="stepDialog.step"
      :mode="stepDialog.mode"
      :suffix="stepDialog.suffix"
      :expected-amount="stepDialog.expectedAmount"
      :path-prefix="`${pathPrefix}/${stepDialog.stepKey}`"
      :project-id="sub?.projectId || ''"
      :saving="saving"
      :require-project-id="stepDialog.stepKey === 'activated' && !sub?.projectId"
      :project-id-validator="(id) => projectIdValidator(id, sub)"
      @submit="onStepSubmit"
    />

    <QuoteEditorDialog
      v-if="sub && quoteEditor.quote"
      v-model="quoteEditor.open"
      :subscription="sub"
      :quote="quoteEditor.quote"
      :settings="settings"
      :copy-sources="copySources"
      :on-save="onSaveQuote"
      :on-attach-pdf="onAttachPdf"
      :on-save-template="onSaveTemplate"
    />

    <v-dialog v-model="instDialog.open" max-width="440" persistent>
      <v-card v-if="instDialog.inst" :title="instDialog.isNew ? '新增一期' : `編輯 ${instDialog.inst.label}`">
        <v-card-text>
          <v-row dense>
            <v-col cols="6"><v-text-field v-model="instDialog.inst.label" label="期別" variant="outlined" density="compact" hide-details></v-text-field></v-col>
            <v-col cols="6"><v-text-field v-model.number="instDialog.inst.amount" type="number" prefix="$" label="金額" variant="outlined" density="compact" hide-details></v-text-field></v-col>
            <v-col cols="12"><v-text-field v-model="instDialog.inst.dueDate" type="date" label="預計繳款日" variant="outlined" density="compact" hide-details clearable></v-text-field></v-col>
            <v-col cols="12"><v-text-field v-model="instDialog.inst.note" label="備註" variant="outlined" density="compact" hide-details></v-text-field></v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="instDialog.open = false">取消</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="saveInstallment">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useDisplay } from 'vuetify';
import AttachmentField from './AttachmentField.vue';
import StepDialog from './StepDialog.vue';
import QuoteEditorDialog from './QuoteEditorDialog.vue';
import FollowupTimeline from './FollowupTimeline.vue';
import { newQuote } from './quoteDefaults';
import {
  saveSubscriptionFields,
  addSubscriptionFollowup,
  uploadSubscriptionFile,
  ensureSubscriptionProject,
  saveSubscriptionQuoteSettings,
} from '@/api.js';
import {
  STAGES, STEP_LABELS, CYCLE_STEP_KEYS, INSTALLMENT_STEP_KEYS,
  isClosed, canOperate, canUndo, cycleSummary, createCycle, createInstallment,
  quoteTotals, buildInstallments, hasInstallmentProgress, computeDueDate, resolveDueDates,
  subscriptionPeriodFromCycles, planText, diffDays, taiwanToday, effectiveDueDate,
} from '@/utils/subscriptionPipeline';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  subscription: { type: Object, default: null },
  firstAppointmentDate: { type: String, default: '' },
  settings: { type: Object, required: true },
  copySources: { type: Array, default: () => [] },
  user: { type: Object, default: () => ({}) },
  adminKey: { type: String, default: '' },
  projectIdValidator: { type: Function, default: () => '' },  // (id, sub) => 錯誤訊息
  assignProjectId: { type: Function, default: async () => {} }, // async (sub, id) 同名訂閱一起套用
});
const emit = defineEmits(['update:modelValue', 'updated', 'edit', 'settings-saved']);

const STEP_BTN_COLORS = { done: 'green', skipped: 'grey', current: 'primary', future: 'grey' };

const { mobile, width } = useDisplay();
const drawerWidth = computed(() => (mobile.value ? width.value : Math.min(760, width.value)));

const tab = ref('flow');
const selectedNo = ref(null);
const saving = ref(false);
const followupRefresh = ref(0);

// 寫入後先套用本地結果，待父層重新載入 (subscription 換新物件) 再以後端資料為準
const localPatch = ref(null);
watch(() => props.subscription, () => { localPatch.value = null; });
const sub = computed(() => (props.subscription ? { ...props.subscription, ...(localPatch.value || {}) } : null));
const cycles = computed(() => sub.value?.cycles || []);
const cycle = computed(() => cycles.value.find(c => c.no === selectedNo.value) || cycles.value[cycles.value.length - 1] || null);
const ctx = computed(() => ({ firstAppointmentDate: props.firstAppointmentDate }));
const currentSummary = computed(() => cycleSummary(cycles.value[cycles.value.length - 1], ctx.value));
const pathPrefix = computed(() => `subscriptions/${sub.value?.projectId || 'misc'}/${sub.value?.id}/c${cycle.value?.no || 1}`);
const installmentTotal = computed(() => (cycle.value?.installments || []).reduce((s, i) => s + (Number(i.amount) || 0), 0));
const canStartNewCycle = computed(() => {
  const last = cycles.value[cycles.value.length - 1];
  return !!last && isClosed(last.steps.activated);
});

watch(() => [props.modelValue, sub.value?.id], ([open]) => {
  if (!open) return;
  tab.value = 'flow';
  selectedNo.value = cycles.value.length ? cycles.value[cycles.value.length - 1].no : null;
});

const clone = (v) => JSON.parse(JSON.stringify(v));

function stageMeta(key) {
  return STAGES.find(s => s.key === key) || STAGES[0];
}

function money(n) {
  return `$${(Number(n) || 0).toLocaleString()}`;
}

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false }).replace(/:\d{2}$/, '');
}

function cycleStepState(key) {
  const step = cycle.value.steps[key];
  if (step.status === 'done') return 'done';
  if (step.status === 'skipped') return 'skipped';
  return canOperate(cycle.value, key) ? 'current' : 'future';
}

function instStepState(inst, key) {
  const step = inst.steps[key];
  if (step.status === 'done') return 'done';
  if (step.status === 'skipped') return 'skipped';
  return canOperate(cycle.value, key, inst) ? 'current' : 'future';
}

function installmentHasProgress(inst) {
  return INSTALLMENT_STEP_KEYS.some(k => isClosed(inst.steps[k]));
}

function stepLines(key, step) {
  const lines = [];
  if (key === 'quote' && cycle.value.quote) {
    const t = quoteTotals(cycle.value.quote);
    lines.push(`v${cycle.value.quote.version} · 總計 ${money(t.total)}${t.discounted ? ` · 優惠價 ${money(t.discounted)}` : ''}`);
  }
  if (key === 'activated' && step.startDate) {
    lines.push(`${step.startDate} ～ ${step.endDate} · ${step.userCount || 0} 人`);
  }
  if (step.status === 'skipped' && step.skipReason) lines.push(`略過原因：${step.skipReason}`);
  if (step.note) lines.push(step.note);
  return lines;
}

function instLines(inst) {
  const lines = [];
  const inv = inst.steps.invoice;
  if (inv.invoiceNo || (isClosed(inv) && inv.invoiceAmount)) {
    lines.push(`發票 ${inv.invoiceNo || ''}${inv.invoiceAmount ? ` · ${money(inv.invoiceAmount)}` : ''}`);
  }
  const cash = inst.steps.cashed;
  if (cash.method || cash.receivedAmount) {
    let text = cash.method || '';
    if (cash.chequeNo) text += ` #${cash.chequeNo}`;
    if (cash.chequeDueDate) text += ` 到期 ${cash.chequeDueDate}`;
    if (isClosed(cash) && cash.receivedAmount) {
      text += ` · 實收 ${money(cash.receivedAmount)}`;
      const diff = cash.receivedAmount - inst.amount;
      if (diff) text += `（差 ${diff > 0 ? '+' : ''}${diff.toLocaleString()}）`;
    }
    lines.push(text.trim());
  }
  INSTALLMENT_STEP_KEYS.forEach(k => {
    const s = inst.steps[k];
    if (s.status === 'skipped' && s.skipReason) lines.push(`${STEP_LABELS[k]}略過：${s.skipReason}`);
    if (s.note) lines.push(`${STEP_LABELS[k]}：${s.note}`);
  });
  return lines;
}

function dueChip(inst) {
  if (isClosed(inst.steps.cashed)) return null;
  const cheque = inst.steps.cashed.chequeDueDate;
  const d = diffDays(effectiveDueDate(inst), taiwanToday());
  if (d === null) return null;
  if (cheque) return { text: d < 0 ? `票期已過 ${-d} 天` : `票期 ${d} 天後`, color: d < 0 ? 'red' : 'teal' };
  if (d < 0) return { text: `逾期 ${-d} 天`, color: 'red' };
  if (d === 0) return { text: '今天', color: 'red' };
  if (d <= 30) return { text: `${d} 天後`, color: 'orange' };
  return null;
}

// --- 寫入 ---
async function persist(newCycles, extraFields = {}, logText = '') {
  saving.value = true;
  try {
    const resolved = clone(newCycles.map(c => resolveDueDates(c, ctx.value).cycle));
    await saveSubscriptionFields(sub.value.id, { cycles: resolved, ...extraFields }, props.adminKey);
    localPatch.value = { ...(localPatch.value || {}), cycles: resolved, ...extraFields };
    if (logText) {
      await addSubscriptionFollowup(sub.value.id, {
        type: '系統',
        content: logText,
        cycleNo: cycle.value?.no || null,
        createdBy: props.user.key || '',
        createdByName: props.user.name || '',
      });
      followupRefresh.value += 1;
    }
    emit('updated');
  } finally {
    saving.value = false;
  }
}

function withCycle(cycleId, fn) {
  return cycles.value.map(c => (c.id === cycleId ? fn(clone(c)) : c));
}

// 回簽／啟用日期變動：重算以該步驟為基準、尚無進度、未手動指定的預計繳款日
function recomputeDueDates(c, baseKey, clear = false) {
  c.installments = c.installments.map(inst => {
    if (inst.base !== baseKey || inst.dueDateManual || INSTALLMENT_STEP_KEYS.some(k => isClosed(inst.steps[k]))) return inst;
    return { ...inst, dueDate: clear ? '' : computeDueDate(inst, c, ctx.value) };
  });
  return c;
}

// 系統啟用 → 訂閱期間與人數方案
function activationFields(newCycles, cycleId) {
  const period = subscriptionPeriodFromCycles(newCycles);
  const a = newCycles.find(c => c.id === cycleId).steps.activated;
  const tiers = (sub.value.userLimitTiers || []).filter(t => t.cycleId !== cycleId);
  if (a.status === 'done') {
    tiers.push({ count: Number(a.userCount) || 0, paymentAmount: 0, paymentDate: '', startDate: a.startDate, endDate: a.endDate, cycleId });
  }
  return { startDate: period.startDate, endDate: period.endDate, userLimitTiers: tiers };
}

// --- 步驟 ---
const stepDialog = ref({ open: false, stepKey: '', mode: 'complete', step: null, suffix: '', expectedAmount: 0, instId: null });

function openStep(stepKey, mode, inst = null) {
  const step = clone(inst ? inst.steps[stepKey] : cycle.value.steps[stepKey]);
  if (stepKey === 'activated' && mode === 'complete' && !step.userCount) {
    const prev = cycles.value.filter(c => c.no < cycle.value.no && c.steps.activated.userCount).pop();
    step.userCount = prev?.steps.activated.userCount || 0;
  }
  if (stepKey === 'quote' && mode === 'complete' && !step.date && cycle.value.quote) {
    step.date = cycle.value.quote.date;
  }
  stepDialog.value = {
    open: true,
    stepKey,
    mode,
    step,
    suffix: inst ? inst.label : `第${cycle.value.no}輪`,
    expectedAmount: inst ? Number(inst.amount) || 0 : 0,
    instId: inst ? inst.id : null,
  };
}

async function onStepSubmit({ step, action, projectId: enteredProjectId }) {
  const { stepKey, instId, suffix } = stepDialog.value;
  const cycleId = cycle.value.id;
  const meta = { by: props.user.key || '', byName: props.user.name || '', at: new Date().toISOString() };
  const original = instId
    ? cycle.value.installments.find(i => i.id === instId).steps[stepKey]
    : cycle.value.steps[stepKey];

  let next;
  if (action === 'skip') next = { ...original, status: 'skipped', skipReason: step.skipReason.trim(), ...meta };
  else if (action === 'draft') next = { ...step, status: 'pending' };
  else if (action === 'complete') next = { ...step, status: 'done', skipReason: '', ...meta };
  else next = { ...step };

  const newCycles = withCycle(cycleId, (c) => {
    if (instId) {
      c.installments = c.installments.map(i => (i.id === instId ? { ...i, steps: { ...i.steps, [stepKey]: next } } : i));
    } else {
      c.steps[stepKey] = next;
      if ((stepKey === 'signed' || stepKey === 'activated') && next.status === 'done') recomputeDueDates(c, stepKey);
    }
    return c;
  });

  let extra = {};
  // 建案 ID 未設定的新建案，於系統啟用時設定 (與啟用日同一次寫入，觸發超級管理員授權)
  const newProjectId = stepKey === 'activated' && next.status === 'done' && !sub.value.projectId ? enteredProjectId : '';
  const projectId = sub.value.projectId || newProjectId;
  if (stepKey === 'activated' && action !== 'draft') {
    extra = activationFields(newCycles, cycleId);
    if (newProjectId) extra.projectId = newProjectId;
  }

  const label = STEP_LABELS[stepKey];
  const logText = action === 'complete' ? `完成「${label}」${suffix}`
    : action === 'skip' ? `略過「${label}」${suffix}：${next.skipReason}`
      : '';
  try {
    if (stepKey === 'activated' && next.status === 'done') {
      await ensureSubscriptionProject(projectId, sub.value.projectName, sub.value.projectIconUrl || '');
    }
    await persist(newCycles, extra, logText);
    if (newProjectId) await props.assignProjectId(sub.value, newProjectId);
    stepDialog.value.open = false;
  } catch (e) {
    alert('儲存失敗：' + e.message);
  }
}

async function undo(stepKey, inst = null) {
  const label = STEP_LABELS[stepKey];
  if (!confirm(`撤銷「${label}」？`)) return;
  const cycleId = cycle.value.id;
  const reset = (s) => ({ ...s, status: 'pending', skipReason: '' });
  const newCycles = withCycle(cycleId, (c) => {
    if (inst) {
      c.installments = c.installments.map(i => (i.id === inst.id ? { ...i, steps: { ...i.steps, [stepKey]: reset(i.steps[stepKey]) } } : i));
    } else {
      c.steps[stepKey] = reset(c.steps[stepKey]);
      if (stepKey === 'signed' || stepKey === 'activated') recomputeDueDates(c, stepKey, true);
    }
    return c;
  });
  const extra = stepKey === 'activated' ? activationFields(newCycles, cycleId) : {};
  try {
    await persist(newCycles, extra, `撤銷「${label}」${inst ? inst.label : `第${cycle.value.no}輪`}`);
  } catch (e) {
    alert('撤銷失敗：' + e.message);
  }
}

async function startNewCycle() {
  const no = cycles.value[cycles.value.length - 1].no + 1;
  if (!confirm(`開始第 ${no} 輪（續約）？`)) return;
  try {
    await persist([...cycles.value, createCycle(no)], {}, `開新一輪（第${no}輪）`);
    selectedNo.value = no;
  } catch (e) {
    alert('建立失敗：' + e.message);
  }
}

// --- 報價單 ---
const quoteEditor = ref({ open: false, quote: null, cycleId: null });

function openQuote() {
  const prev = cycles.value.filter(c => c.no < cycle.value.no && c.quote).pop();
  quoteEditor.value = {
    open: true,
    cycleId: cycle.value.id,
    quote: cycle.value.quote ? clone(cycle.value.quote) : newQuote(sub.value, props.settings, prev?.quote || null),
  };
}

function applyQuote(c, quote) {
  const finalAmount = quoteTotals(quote).finalAmount;
  const signature = JSON.stringify({ plan: quote.plan, finalAmount });
  c.quote = quote;
  // 款項尚無進度時，付款條件或金額變動 → 重新拆期
  if (!hasInstallmentProgress(c) && (c.planSignature !== signature || c.installments.length === 0)) {
    c.installments = buildInstallments(quote.plan, finalAmount);
    c.planSignature = signature;
  }
  return c;
}

async function onSaveQuote(quote) {
  const cycleId = quoteEditor.value.cycleId;
  const before = cycles.value.find(c => c.id === cycleId)?.quote;
  const newCycles = withCycle(cycleId, c => applyQuote(c, quote));
  const isNewVersion = !before || before.version !== quote.version;
  const logText = isNewVersion ? `報價單 v${quote.version}（${money(quoteTotals(quote).finalAmount)}）` : '';
  await persist(newCycles, { billTo: { ...quote.billTo } }, logText);
}

async function onAttachPdf(blob, fileName, quote) {
  const cycleId = quoteEditor.value.cycleId;
  const path = `${pathPrefix.value}/quote/${Date.now()}_v${quote.version}.pdf`;
  const att = await uploadSubscriptionFile(blob, fileName, path, sub.value.projectId);
  const newCycles = withCycle(cycleId, (c) => {
    applyQuote(c, quote);
    c.steps.quote.attachments = [...c.steps.quote.attachments, att];
    return c;
  });
  await persist(newCycles);
}

async function onSaveTemplate(kind, name, value) {
  const next = clone(props.settings);
  const key = kind === 'notes' ? 'noteTemplates' : 'planTemplates';
  const entry = kind === 'notes' ? { name, content: value } : { name, plan: value };
  next[key] = [...(next[key] || []).filter(t => t.name !== name), entry];
  await saveSubscriptionQuoteSettings(next, props.adminKey);
  emit('settings-saved', next);
}

// --- 款項 ---
const instDialog = ref({ open: false, inst: null, isNew: false });

function openInstallment(inst) {
  if (inst) {
    instDialog.value = { open: true, inst: clone(inst), isNew: false };
  } else {
    const list = cycle.value.installments;
    const no = list.reduce((m, i) => Math.max(m, i.no), 0) + 1;
    instDialog.value = {
      open: true,
      isNew: true,
      inst: createInstallment(no - 1, { label: `第${no}期`, base: 'date' }),
    };
  }
}

async function saveInstallment() {
  const { inst, isNew } = instDialog.value;
  const original = isNew ? null : cycle.value.installments.find(i => i.id === inst.id);
  const edited = {
    ...inst,
    amount: Number(inst.amount) || 0,
    dueDate: inst.dueDate || '',
  };
  if (isNew) {
    edited.fixedDate = edited.dueDate;
  } else if (edited.dueDate !== original.dueDate) {
    edited.dueDateManual = !!edited.dueDate;
  }
  const newCycles = withCycle(cycle.value.id, (c) => {
    c.installments = isNew ? [...c.installments, edited] : c.installments.map(i => (i.id === edited.id ? edited : i));
    return c;
  });
  try {
    await persist(newCycles, {}, isNew ? `新增款項「${edited.label}」${money(edited.amount)}` : '');
    instDialog.value.open = false;
  } catch (e) {
    alert('儲存失敗：' + e.message);
  }
}

async function removeInstallment(inst) {
  if (!confirm(`刪除「${inst.label}」？`)) return;
  const newCycles = withCycle(cycle.value.id, (c) => {
    c.installments = c.installments.filter(i => i.id !== inst.id);
    return c;
  });
  try {
    await persist(newCycles, {}, `刪除款項「${inst.label}」`);
  } catch (e) {
    alert('刪除失敗：' + e.message);
  }
}
</script>

<style scoped>
.pd-header {
  padding: 12px 12px 10px 16px;
  background: #f5f7fa;
}
.pd-step {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px dashed #e0e0e0;
}
.pd-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  border: 2px solid #bdbdbd;
  color: #9e9e9e;
}
.pd-step.is-done .pd-dot {
  background: #43a047;
  border-color: #43a047;
}
.pd-step.is-skipped .pd-dot {
  background: #9e9e9e;
  border-color: #9e9e9e;
}
.pd-step.is-current .pd-dot {
  border-color: #004383;
  color: #004383;
}
.pd-step.is-future {
  opacity: 0.6;
}
.pd-empty {
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
}
.pd-inst-step {
  text-transform: none;
  letter-spacing: 0;
}
@media (max-width: 959.98px) {
  /* 避開全站左上角漢堡鈕 */
  .pd-header {
    padding-left: 58px;
  }
}
</style>
