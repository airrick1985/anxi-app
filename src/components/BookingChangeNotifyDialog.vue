<template>
  <v-dialog :model-value="modelValue" max-width="560" persistent scrollable content-class="mac-dialog-fit">
    <v-card class="mac-sheet">
      <div class="mac-sheet-head">
        <v-icon size="18">mdi-email-edit-outline</v-icon>
        <span>儲存預約修改</span>
      </div>

      <div class="mac-form bcn-body">
        <div v-if="blockMessage" class="mac-callout mac-callout--warning bcn-callout">
          <v-icon size="16">mdi-alert-outline</v-icon><span>{{ blockMessage }}</span>
        </div>
        <div v-if="errorMessage" class="mac-callout mac-callout--error bcn-callout">
          <v-icon size="16">mdi-alert-circle-outline</v-icon><span>{{ errorMessage }}</span>
        </div>

        <template v-for="g in groups" :key="g.appointmentId">
          <div class="mac-form-label">{{ g.title }}</div>
          <div class="mac-form-group">
            <div v-for="c in g.changes" :key="c.field" class="mac-form-row bcn-row">
              <span class="bcn-label">{{ c.field }}</span>
              <span class="bcn-diff"><s v-if="c.before !== '無'">{{ c.before }}</s><span v-else class="bcn-none">無</span><v-icon size="14">mdi-arrow-right</v-icon><b>{{ c.after }}</b></span>
            </div>
          </div>
        </template>

        <div class="mac-form-label">修改通知收件人</div>
        <div class="mac-form-group">
          <label v-for="g in groups" :key="`b-${g.appointmentId}`" class="mac-form-row bcn-check" :class="{ 'is-disabled': !g.bookerEmail }">
            <input v-model="bookerChecked[g.appointmentId]" type="checkbox" class="mac-check" :disabled="!g.bookerEmail || saving">
            <span class="bcn-who">
              <span>預約人 {{ g.bookerName || '—' }}<template v-if="groups.length > 1">（{{ g.title }}）</template></span>
              <small>{{ g.bookerEmail || '沒有 Email' }}</small>
            </span>
          </label>
          <div v-if="loading" class="mac-form-row mac-form-empty">
            <v-progress-circular indeterminate size="14" width="2" />載入副本人員…
          </div>
          <template v-else>
            <label v-for="r in ccList" :key="r.email" class="mac-form-row bcn-check">
              <input v-model="ccChecked" type="checkbox" class="mac-check" :value="r.email" :disabled="saving">
              <span class="bcn-who"><span>{{ r.name || '副本人員' }}</span><small>{{ r.email }}</small></span>
            </label>
            <div v-if="loadError" class="mac-form-row mac-form-empty">副本人員載入失敗</div>
            <div v-if="mandatory.length" class="mac-form-row bcn-must">
              <v-icon size="14">mdi-lock-outline</v-icon>寄送時必寄：{{ mandatory.map(r => r.name || r.email).join('、') }}
            </div>
          </template>
        </div>
      </div>

      <div class="mac-sheet-foot">
        <button type="button" class="mac-btn" :disabled="saving" @click="emit('update:modelValue', false)">返回</button>
        <span class="mac-spacer"></span>
        <button type="button" class="mac-btn" :disabled="saving" @click="submit(false)">{{ blockMessage ? '強制儲存，不寄' : '只儲存' }}</button>
        <button type="button" class="mac-btn mac-btn--primary" :disabled="saving || loading || !hasRecipient" @click="submit(true)">
          <v-icon size="16">mdi-send-outline</v-icon>{{ saving ? '儲存中…' : (blockMessage ? '強制儲存並寄送' : '儲存並寄送') }}
        </button>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
/**
 * 修改預約後選擇是否寄「預約異動通知」
 * groups：[{ appointmentId, title, bookerName, bookerEmail, changes: [{ field, before, after }] }]
 * submit 事件：{ notifyById: { [appointmentId]: { toBooker, cc } } | null（只儲存）, force }
 * blockMessage 有值＝名額／日期等規則擋下，再按一次即強制儲存
 */
import { computed, ref, watch } from 'vue';
import { getCancelNotifyRecipients } from '@/api';

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  projectId: { type: String, default: '' },
  groups: { type: Array, default: () => [] },
  saving: { type: Boolean, default: false },
  blockMessage: { type: String, default: '' },
  errorMessage: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue', 'submit']);

const loading = ref(false);
const loadError = ref(false);
const ccList = ref([]);
const mandatory = ref([]);
const ccChecked = ref([]);
const bookerChecked = ref({});

const hasRecipient = computed(() => mandatory.value.length > 0 || ccChecked.value.length > 0
  || props.groups.some((g) => g.bookerEmail && bookerChecked.value[g.appointmentId]));

let requestId = 0;
watch(() => props.modelValue, async (open) => {
  const id = ++requestId;
  if (!open) return;
  bookerChecked.value = Object.fromEntries(props.groups.map((g) => [g.appointmentId, !!g.bookerEmail]));
  ccList.value = [];
  mandatory.value = [];
  ccChecked.value = [];
  loadError.value = false;
  loading.value = true;
  const res = await getCancelNotifyRecipients(props.projectId, props.groups[0]?.appointmentId);
  if (id !== requestId) return;
  loading.value = false;
  if (res?.status !== 'success') {
    loadError.value = true;
    return;
  }
  ccList.value = res.ccRecipients || [];
  mandatory.value = res.mandatoryRecipients || [];
  ccChecked.value = ccList.value.map((r) => r.email);
}, { immediate: true });

function submit(send) {
  const notifyById = send
    ? Object.fromEntries(props.groups.map((g) => [g.appointmentId, {
      toBooker: !!g.bookerEmail && !!bookerChecked.value[g.appointmentId],
      cc: [...ccChecked.value],
    }]))
    : null;
  emit('submit', { notifyById, force: !!props.blockMessage });
}
</script>

<style scoped>
.bcn-body { padding: 4px 16px 16px; overflow-y: auto; }
.bcn-callout { margin-top: 12px; }
.bcn-row { flex-wrap: nowrap; }
.bcn-label { flex: 0 0 104px; color: #6e6e73; overflow-wrap: anywhere; }
.bcn-diff { display: flex; flex: 1 1 auto; flex-wrap: wrap; align-items: center; gap: 2px 6px; min-width: 0; overflow-wrap: anywhere; }
.bcn-diff s, .bcn-none { color: #8e8e93; }
.bcn-diff b { font-weight: 600; min-width: 0; overflow-wrap: anywhere; }
.bcn-diff .v-icon { color: #8e8e93; }
.bcn-check { flex-wrap: nowrap; cursor: pointer; }
.bcn-check.is-disabled { color: #a1a1a6; cursor: default; }
.bcn-who { display: flex; flex-direction: column; min-width: 0; line-height: 1.4; overflow-wrap: anywhere; }
.bcn-who small { font-size: 12px; color: #6e6e73; }
.bcn-must { gap: 6px; font-size: 12.5px; color: #6e6e73; }
@media (max-width: 600px) {
  .mac-sheet-foot .mac-spacer { display: none; }
  .mac-sheet-foot .mac-btn { flex: 1 1 auto; height: 36px; padding: 0 10px; }
  .mac-sheet-foot .mac-btn--primary { order: -1; flex-basis: 100%; }
}
</style>
