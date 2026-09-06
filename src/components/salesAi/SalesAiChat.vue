<template>
  <div class="sai-chat">
    <!-- 無權限／錯誤 -->
    <div v-if="aiStore.capsLoaded && aiStore.capsError" class="sai-chat__blocked">
      <v-icon size="40" color="grey-lighten-1">mdi-robot-off-outline</v-icon>
      <div>{{ aiStore.capsError }}</div>
      <v-btn size="small" variant="tonal" @click="aiStore.loadCapabilities()">重試</v-btn>
    </div>

    <template v-else>
      <div ref="scroller" class="sai-chat__messages">
        <div v-if="!aiStore.messages.length" class="sai-chat__empty">
          <AiOrbIcon :size="64" state="idle" />
          <div class="sai-chat__empty-title">{{ aiStore.projectName || '本建案' }} 智能助理</div>
          <div class="sai-chat__empty-sub">
            可以問我戶別、車位、價格、統計；<template v-if="aiStore.canWrite">也可以直接說「把 A-3 改小訂，配 B6-18 車位，房價 3450」，我會準備草案讓您確認。</template><template v-else>修改銷控功能尚未開放給您，可請管理員在「銷控設定 → AI 助理」開啟。</template>
          </div>
        </div>

        <div v-for="m in aiStore.messages" :key="m.id" class="sai-msg" :class="[`sai-msg--${m.role}`, { 'sai-msg--card': m.type !== 'text' }]">
          <div v-if="m.role === 'model'" class="sai-msg__avatar"><AiOrbIcon :size="26" state="idle" /></div>
          <div class="sai-msg__body">
            <div v-if="m.type === 'text'" class="sai-msg__bubble" :class="{ 'sai-msg__bubble--error': m.isError }" v-html="render(m.text)"></div>
            <AiQuestionCard v-else-if="m.type === 'question'" :questions="m.payload.questions" :answered="!!m.payload.answered" :answers="m.payload.answers || null" :disabled="aiStore.isLoading" @submit="aiStore.answerQuestion(m, $event)" />
            <AiProposalCard v-else-if="m.type === 'proposal'" :proposal="m.payload.proposal" :question="m.payload.question" :disabled="aiStore.isLoading"
              @answer="aiStore.answerQuestion(m, $event)"
              @execute="aiStore.executeProposal(m, { typedConfirm: $event })" @cancel="aiStore.cancelProposal(m)" />
            <AiResultCard v-else-if="m.type === 'result'" :result="m.payload" @open-unit="openUnit" @notify="$emit('notify', $event)" />
            <div v-else-if="m.type === 'action'" class="sai-msg__action">
              <v-btn size="x-small" variant="tonal" color="primary" prepend-icon="mdi-open-in-app" @click="openUnit(m.payload.unitId)">開啟戶別 {{ m.payload.unitId }}</v-btn>
            </div>
          </div>
        </div>

        <div v-if="aiStore.isLoading" class="sai-msg sai-msg--model">
          <div class="sai-msg__avatar"><AiOrbIcon :size="26" state="thinking" /></div>
          <div class="sai-msg__body"><div class="sai-msg__bubble sai-msg__bubble--loading"><span class="sai-dots"><i></i><i></i><i></i></span>{{ aiStore.loadingText }}</div></div>
        </div>
        <div ref="endEl" style="height: 1px"></div>
      </div>

      <div class="sai-chat__quick" v-if="aiStore.quickPrompts.length && !aiStore.isLoading">
        <v-chip v-for="qp in aiStore.quickPrompts" :key="qp.label" size="x-small" variant="outlined" color="primary" @click="send(qp.text)">{{ qp.label }}</v-chip>
      </div>

      <div class="sai-chat__input">
        <v-chip v-if="aiStore.unitContext" size="x-small" closable color="indigo" variant="tonal" class="sai-chat__ctx" @click:close="aiStore.setUnitContext(null)">目前戶別：{{ aiStore.unitContext }}</v-chip>
        <div class="sai-chat__row">
          <v-textarea v-model="input" variant="outlined" density="compact" hide-details auto-grow rows="1" max-rows="4"
            :placeholder="aiStore.quotaExhausted ? 'Token 額度已用完' : '輸入問題或指令（Enter 送出，Shift+Enter 換行）'"
            :disabled="aiStore.isLoading || aiStore.quotaExhausted" @keydown="onKeydown" />
          <v-btn icon="mdi-send" color="primary" variant="flat" size="small" :disabled="!input.trim() || aiStore.isLoading || aiStore.quotaExhausted" @click="send()" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
// 對話內容元件（面板與戶別 Modal AI 分頁共用）docs/銷控AI智能助理-spec.md §3.2
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useSalesAiStore } from '@/store/salesAiStore';
import AiOrbIcon from './AiOrbIcon.vue';
import AiQuestionCard from './AiQuestionCard.vue';
import AiProposalCard from './AiProposalCard.vue';
import AiResultCard from './AiResultCard.vue';

const props = defineProps({
  projectId: { type: String, required: true },
  projectName: { type: String, default: '' },
  unitId: { type: String, default: null },
});
const emit = defineEmits(['open-unit', 'notify']);

const aiStore = useSalesAiStore();
const input = ref('');
const scroller = ref(null);
const endEl = ref(null);

marked.setOptions({ breaks: true, gfm: true });
function render(text) {
  try { return DOMPurify.sanitize(marked.parse(String(text || '')), { USE_PROFILES: { html: true }, FORBID_TAGS: ['style', 'script', 'iframe', 'form', 'input'], FORBID_ATTR: ['onerror', 'onload', 'onclick'] }); }
  catch { return DOMPurify.sanitize(String(text || '')); }
}
function scrollToBottom() { nextTick(() => endEl.value?.scrollIntoView({ behavior: 'instant', block: 'end' })); }
function send(text) {
  const t = (text ?? input.value).trim();
  if (!t) return;
  input.value = '';
  aiStore.sendMessage(t);
}
function onKeydown(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }
function openUnit(unitId) { emit('open-unit', unitId); }

onMounted(async () => {
  await aiStore.setProject(props.projectId, props.projectName);
  if (props.unitId) aiStore.setUnitContext(props.unitId);
  await aiStore.ensureReady();
  scrollToBottom();
});
watch(() => props.unitId, v => { if (v) aiStore.setUnitContext(v); });
// 戶別 Modal 關閉時清掉戶別上下文，避免浮動面板誤以為仍在該戶
onUnmounted(() => { if (props.unitId && aiStore.unitContext === props.unitId) aiStore.setUnitContext(null); });
watch(() => aiStore.messages.length, scrollToBottom);
watch(() => aiStore.isLoading, scrollToBottom);
</script>

<style scoped>
.sai-chat { display: flex; flex-direction: column; height: 100%; min-height: 0; background: #F6F8FC; }
.sai-chat__blocked { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: #78909C; font-size: 13px; padding: 24px; text-align: center; }
.sai-chat__messages { flex: 1; min-height: 0; overflow-y: auto; padding: 12px 12px 4px; display: flex; flex-direction: column; gap: 10px; }
.sai-chat__empty { display: flex; flex-direction: column; align-items: center; gap: 8px; margin: auto; padding: 24px 12px; text-align: center; color: #607D8B; }
.sai-chat__empty-title { font-size: 15px; font-weight: 600; color: #1A2B4C; margin-top: 8px; }
.sai-chat__empty-sub { font-size: 12.5px; line-height: 1.7; max-width: 320px; }
.sai-msg { display: flex; gap: 8px; align-items: flex-start; }
.sai-msg--user { justify-content: flex-end; }
.sai-msg__avatar { flex: 0 0 auto; margin-top: 2px; }
.sai-msg__body { max-width: 86%; min-width: 0; }
.sai-msg--card .sai-msg__body { width: 100%; max-width: 100%; }
.sai-msg__bubble { padding: 8px 12px; border-radius: 14px; font-size: 13.5px; line-height: 1.65; background: #fff; color: #263238; box-shadow: 0 1px 2px rgba(16, 32, 58, 0.08); word-break: break-word; }
.sai-msg--user .sai-msg__bubble { background: #2F6BFF; color: #fff; border-bottom-right-radius: 4px; }
.sai-msg--model .sai-msg__bubble { border-top-left-radius: 4px; }
.sai-msg__bubble--error { background: #FFEBEE; color: #B71C1C; }
.sai-msg__bubble--loading { display: flex; align-items: center; gap: 8px; color: #78909C; font-size: 12.5px; }
.sai-msg__bubble :deep(p) { margin: 0 0 6px; }
.sai-msg__bubble :deep(p:last-child) { margin-bottom: 0; }
.sai-msg__bubble :deep(ul), .sai-msg__bubble :deep(ol) { margin: 4px 0; padding-left: 18px; }
.sai-msg__bubble :deep(table) { border-collapse: collapse; font-size: 12.5px; margin: 6px 0; display: block; overflow-x: auto; max-width: 100%; }
.sai-msg__bubble :deep(th), .sai-msg__bubble :deep(td) { border: 1px solid #E0E6F0; padding: 3px 6px; white-space: nowrap; }
.sai-msg__bubble :deep(code) { background: #EEF2F8; padding: 1px 4px; border-radius: 4px; font-size: 12.5px; }
.sai-msg--user .sai-msg__bubble :deep(code) { background: rgba(255, 255, 255, 0.2); }
.sai-msg__action { display: flex; }
.sai-dots { display: inline-flex; gap: 3px; }
.sai-dots i { width: 5px; height: 5px; border-radius: 50%; background: #2F6BFF; animation: sai-dot 1.2s infinite ease-in-out; }
.sai-dots i:nth-child(2) { animation-delay: 0.2s; } .sai-dots i:nth-child(3) { animation-delay: 0.4s; }
@keyframes sai-dot { 0%, 80%, 100% { opacity: 0.25; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }
.sai-chat__quick { display: flex; gap: 6px; flex-wrap: wrap; padding: 4px 12px; }
.sai-chat__input { padding: 6px 10px 10px; background: #fff; border-top: 1px solid #E6EAF2; display: flex; flex-direction: column; gap: 6px; }
.sai-chat__ctx { align-self: flex-start; }
.sai-chat__row { display: flex; gap: 6px; align-items: flex-end; }
.sai-chat__row .v-textarea { flex: 1; }
</style>
