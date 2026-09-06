<template>
  <div class="ai-pcard" :class="[`ai-pcard--${status}`, { 'ai-pcard--cancel-kind': proposal.kind === 'cancel' }]">
    <div class="ai-pcard__head">
      <v-icon size="18" :color="proposal.kind === 'cancel' ? 'error' : 'primary'">{{ proposal.kind === 'cancel' ? 'mdi-account-cancel-outline' : 'mdi-file-document-edit-outline' }}</v-icon>
      <span class="ai-pcard__title">{{ proposal.kind === 'cancel' ? '退戶草案' : '變更預覽' }}</span>
      <v-chip size="x-small" :color="statusMeta.color" variant="flat" class="ml-auto">{{ statusMeta.label }}</v-chip>
    </div>

    <div v-for="(rows, target) in grouped" :key="target" class="ai-pcard__group">
      <div class="ai-pcard__target">{{ target }}</div>
      <table class="ai-pcard__table">
        <tbody>
          <tr v-for="(d, i) in rows" :key="i">
            <td class="ai-pcard__label">{{ d.label }}</td>
            <td class="ai-pcard__from">{{ fmt(d.from) }}</td>
            <td class="ai-pcard__arrow">→</td>
            <td class="ai-pcard__to">
              {{ fmt(d.to) }}<span v-if="d.note" class="ai-pcard__note">（{{ d.note }}）</span><span v-else-if="d.auto" class="ai-pcard__note">（自動計算）</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="proposal.warnings && proposal.warnings.length" class="ai-pcard__warn">
      <div v-for="(w, i) in proposal.warnings" :key="i">⚠ {{ w }}</div>
    </div>
    <div v-if="proposal.blockers && proposal.blockers.length" class="ai-pcard__block">
      <div v-for="(b, i) in proposal.blockers" :key="i">⛔ {{ b }}</div>
    </div>

    <AiQuestionCard v-if="question && question.questions && question.questions.length && status === 'pending'" :questions="question.questions" :disabled="disabled" @submit="$emit('answer', $event)" />

    <template v-if="status === 'pending' && executableNow">
      <div v-if="proposal.requireTypedConfirm" class="ai-pcard__typed">
        <div class="ai-pcard__typed-label">此操作不可逆，請輸入戶別「{{ proposal.requireTypedConfirm }}」確認：</div>
        <v-text-field v-model="typed" density="compact" variant="outlined" hide-details :placeholder="proposal.requireTypedConfirm" class="ai-pcard__typed-input" />
      </div>
      <div class="ai-pcard__actions">
        <v-btn size="small" variant="text" :disabled="disabled" @click="$emit('cancel')">取消</v-btn>
        <v-btn size="small" variant="flat" :color="proposal.kind === 'cancel' ? 'error' : 'primary'" :disabled="disabled || !typedOk" :loading="disabled" @click="$emit('execute', typed)">
          {{ proposal.kind === 'cancel' ? '確認退戶' : '確認執行' }}
        </v-btn>
      </div>
    </template>
    <div v-else-if="status === 'pending' && !executableNow && !(question && question.questions && question.questions.length)" class="ai-pcard__actions">
      <v-btn size="small" variant="text" :disabled="disabled" @click="$emit('cancel')">關閉</v-btn>
    </div>
    <div v-if="status === 'pending' && proposal.expiresAt" class="ai-pcard__expire">有效至 {{ expireText }}</div>
  </div>
</template>

<script setup>
// 變更預覽卡（docs/銷控AI智能助理-spec.md §3.4）
import { ref, computed } from 'vue';
import AiQuestionCard from './AiQuestionCard.vue';

const props = defineProps({
  proposal: { type: Object, required: true },
  question: { type: Object, default: null },
  disabled: { type: Boolean, default: false },
});
defineEmits(['execute', 'cancel', 'answer']);

const typed = ref('');
const status = computed(() => props.proposal.status || 'pending');
const STATUS_META = {
  pending: { label: '待確認', color: 'amber-darken-2' },
  executed: { label: '已執行', color: 'success' },
  cancelled: { label: '已取消', color: 'grey' },
  expired: { label: '已逾時', color: 'grey' },
  stale: { label: '資料已變動', color: 'error' },
  'dry-run': { label: '測試（不執行）', color: 'purple' },
  executing: { label: '執行中', color: 'primary' },
};
const statusMeta = computed(() => STATUS_META[status.value] || STATUS_META.pending);
const executableNow = computed(() => {
  if (props.proposal.blockers && props.proposal.blockers.length) return false;
  const required = (props.question?.questions || props.proposal.missing || []).filter(q => q.required !== false);
  return required.length === 0;
});
const typedOk = computed(() => !props.proposal.requireTypedConfirm || typed.value.trim().toUpperCase().replace(/\s+/g, '') === String(props.proposal.requireTypedConfirm).toUpperCase());
const grouped = computed(() => {
  const g = {};
  for (const d of props.proposal.diff || []) { (g[d.target] = g[d.target] || []).push(d); }
  return g;
});
const expireText = computed(() => {
  try { const d = new Date(props.proposal.expiresAt); return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Taipei' }); } catch { return ''; }
});
function fmt(v) {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'number') return v.toLocaleString('zh-TW');
  if (Array.isArray(v)) return v.join('、');
  return String(v).replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1/$2/$3');
}
</script>

<style scoped>
.ai-pcard { border: 1px solid #C5D3F5; background: #F7F9FF; border-radius: 12px; padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; }
.ai-pcard--cancel-kind { border-color: #FFCDD2; background: #FFF8F8; }
.ai-pcard--executed { border-color: #C8E6C9; background: #F6FCF6; }
.ai-pcard--cancelled, .ai-pcard--expired { opacity: 0.75; border-color: #E0E0E0; background: #FAFAFA; }
.ai-pcard--stale { border-color: #EF9A9A; }
.ai-pcard__head { display: flex; align-items: center; gap: 6px; }
.ai-pcard__title { font-size: 13px; font-weight: 600; color: #1A2B4C; }
.ai-pcard__group { display: flex; flex-direction: column; gap: 2px; }
.ai-pcard__target { font-size: 12.5px; font-weight: 600; color: #2F6BFF; }
.ai-pcard--cancel-kind .ai-pcard__target { color: #C62828; }
.ai-pcard__table { width: 100%; border-collapse: collapse; font-size: 12.5px; font-variant-numeric: tabular-nums; }
.ai-pcard__table td { padding: 3px 4px; vertical-align: top; border-bottom: 1px dashed #E3E8F4; }
.ai-pcard__label { color: #546E7A; white-space: nowrap; width: 34%; }
.ai-pcard__from { color: #9E9E9E; text-decoration: line-through; }
.ai-pcard__arrow { color: #B0BEC5; width: 18px; text-align: center; }
.ai-pcard__to { color: #1A2B4C; font-weight: 600; word-break: break-word; }
.ai-pcard__note { color: #78909C; font-weight: 400; font-size: 11.5px; }
.ai-pcard__warn { font-size: 12.5px; color: #8D6E00; background: #FFF8E1; border-radius: 8px; padding: 6px 8px; display: flex; flex-direction: column; gap: 2px; }
.ai-pcard__block { font-size: 12.5px; color: #B71C1C; background: #FFEBEE; border-radius: 8px; padding: 6px 8px; display: flex; flex-direction: column; gap: 2px; }
.ai-pcard__typed { display: flex; flex-direction: column; gap: 4px; }
.ai-pcard__typed-label { font-size: 12.5px; color: #B71C1C; }
.ai-pcard__typed-input { max-width: 220px; }
.ai-pcard__actions { display: flex; justify-content: flex-end; gap: 6px; }
.ai-pcard__expire { font-size: 11px; color: #9E9E9E; text-align: right; }
</style>
