<template>
  <div class="la-comp">
    <div v-if="result" class="la-result">
      <div class="la-result__head">
        <v-icon size="16" color="#0071e3">mdi-creation</v-icon>
        <span class="la-result__title">{{ result.mode === 'polish' ? '潤稿結果' : 'AI 建議' }}</span>
        <span v-if="resultStyleName" class="la-result__style">{{ resultStyleName }}</span>
        <v-spacer />
        <button class="mac-icon-btn" title="關閉" @click="result = null"><v-icon size="16">mdi-close</v-icon></button>
      </div>
      <textarea v-model="result.text" class="mac-form-textarea la-result__text" rows="4" />
      <div v-if="result.cited?.length" class="la-result__cited">
        <v-icon size="14">mdi-file-document-outline</v-icon>{{ result.cited.join('、') }}
      </div>
      <div class="la-result__actions">
        <button class="mac-btn mac-btn--sm" :disabled="!!busy" @click="regenerate"><v-icon size="15">mdi-refresh</v-icon>重新產生</button>
        <button class="mac-btn mac-btn--sm" :disabled="!!busy" @click="useAsDraft"><v-icon size="15">mdi-pencil-outline</v-icon>再修改</button>
        <v-spacer />
        <button class="mac-btn mac-btn--sm" @click="copy(result.text)"><v-icon size="15">mdi-content-copy</v-icon>複製</button>
        <button v-if="canManual" class="mac-btn mac-btn--sm" @click="share(result.text)"><v-icon size="15">mdi-share-variant-outline</v-icon>分享到 LINE</button>
        <button
          v-if="canBot"
          class="mac-btn mac-btn--sm"
          :class="confirmKey === 'result' ? 'mac-btn--danger-fill' : 'mac-btn--primary'"
          :disabled="!!busy || !result.text.trim() || !active"
          @click="send('result')"
        >
          <v-icon size="15">mdi-send</v-icon>{{ confirmKey === 'result' ? '確認送出' : '官方帳號送出' }}
        </button>
      </div>
    </div>

    <div v-if="styles.length" class="la-styles">
      <button
        v-for="s in styles"
        :key="s.id"
        type="button"
        class="la-chip"
        :class="{ 'is-active': styleId === s.id }"
        @click="styleId = styleId === s.id ? null : s.id"
      >{{ s.name }}</button>
    </div>

    <div class="la-input">
      <textarea
        v-model="text"
        class="la-input__text"
        :rows="smAndDown ? 2 : 3"
        placeholder="輸入想說的重點或草稿"
        @keydown.meta.enter.prevent="generate('suggest')"
        @keydown.ctrl.enter.prevent="generate('suggest')"
      />
      <input
        v-if="showInstruction"
        v-model="instruction"
        class="mac-form-input la-input__instr"
        placeholder="要求（例：簡短一點、提醒週六看屋）"
      />
      <div class="la-input__bar">
        <v-menu location="top start" :close-on-content-click="false">
          <template #activator="{ props: menuProps }">
            <button v-bind="menuProps" class="mac-btn mac-btn--sm" :class="{ 'is-active': selectedSources.length }" title="引用雲端資料">
              <v-icon size="15">mdi-paperclip</v-icon><span class="mac-hide-xs">資料</span>
              <span v-if="selectedSources.length" class="mac-filter-count">{{ selectedSources.length }}</span>
            </button>
          </template>
          <div class="la-pop">
            <div class="mac-sheet-label">引用資料</div>
            <div v-if="!sources.length" class="la-pop__empty">尚未開放資料</div>
            <label v-for="s in sources" :key="s.id" class="la-pop__row">
              <input v-model="selectedSources" type="checkbox" class="mac-check" :value="s.id" />
              <v-icon size="16">{{ s.type === 'dropbox' ? 'mdi-dropbox' : 'mdi-google-drive' }}</v-icon>
              <span>{{ s.name }}</span>
              <span v-if="s.shared" class="la-pop__shared">共用</span>
            </label>
            <button class="mac-link-btn la-pop__manage" @click="$emit('manage-sources')">管理我的資料</button>
          </div>
        </v-menu>
        <button class="mac-btn mac-btn--sm mac-btn--icon" :class="{ 'is-active': showInstruction }" title="補充要求" @click="showInstruction = !showInstruction">
          <v-icon size="16">mdi-tune-variant</v-icon>
        </button>
        <v-spacer />
        <button
          v-if="canBot && text.trim()"
          class="mac-btn mac-btn--sm"
          :class="confirmKey === 'input' ? 'mac-btn--danger-fill' : ''"
          :disabled="!!busy || !active"
          title="直接由官方帳號送出輸入的文字"
          @click="send('input')"
        >
          <v-icon size="15">mdi-send-outline</v-icon><span :class="{ 'mac-hide-xs': confirmKey !== 'input' }">{{ confirmKey === 'input' ? '確認送出' : '送出' }}</span>
        </button>
        <button class="mac-btn mac-btn--sm" :disabled="!!busy || !text.trim() || !agent" @click="generate('polish')">
          <v-progress-circular v-if="busy === 'polish'" indeterminate size="13" width="2" />
          <v-icon v-else size="15">mdi-auto-fix</v-icon>潤稿
        </button>
        <button class="mac-btn mac-btn--sm mac-btn--primary" :disabled="!!busy || !agent" @click="generate('suggest')">
          <v-progress-circular v-if="busy === 'suggest'" indeterminate size="13" width="2" />
          <v-icon v-else size="15">mdi-creation</v-icon>建議回覆
        </button>
      </div>
    </div>
    <div v-if="!agent" class="la-comp__warn">尚未指定 AI Agent</div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useDisplay } from 'vuetify';
import { useToast } from 'vue-toastification';
import { lineAiCall, errorText, isLiffMode, composerDrafts as drafts } from './useLineAi';

const props = defineProps({
  conversationId: { type: String, required: true },
  agent: { type: Object, default: null },
  styles: { type: Array, default: () => [] },
  defaultStyleId: { type: String, default: null },
  sources: { type: Array, default: () => [] },
  active: { type: Boolean, default: true },
});
const emit = defineEmits(['sent', 'manage-sources']);

const toast = useToast();
const { smAndDown } = useDisplay();

const styleId = ref(null);
const text = ref('');
const instruction = ref('');
const showInstruction = ref(false);
const selectedSources = ref([]);
const result = ref(null);
const busy = ref(null);
const confirmKey = ref(null);
let confirmTimer = null;
let lastRequest = null;

const sendMode = computed(() => props.agent?.sendMode || 'manual');
const canBot = computed(() => ['bot', 'both'].includes(sendMode.value));
const canManual = computed(() => ['manual', 'both'].includes(sendMode.value));
const resultStyleName = computed(() => props.styles.find(s => s.id === result.value?.styleId)?.name || '');

function saveDraft(id) {
  if (id) drafts.set(id, { text: text.value, instruction: instruction.value, result: result.value, selectedSources: selectedSources.value });
}

watch(() => props.conversationId, (id, prev) => {
  saveDraft(prev);
  const d = drafts.get(id);
  text.value = d?.text || '';
  instruction.value = d?.instruction || '';
  result.value = d?.result || null;
  selectedSources.value = d?.selectedSources || [];
  showInstruction.value = !!instruction.value;
  confirmKey.value = null;
}, { immediate: true });

watch(() => [props.defaultStyleId, props.styles], () => {
  if (!props.styles.some(s => s.id === styleId.value)) {
    styleId.value = props.styles.some(s => s.id === props.defaultStyleId) ? props.defaultStyleId : null;
  }
}, { immediate: true });

watch(() => props.sources, list => {
  selectedSources.value = selectedSources.value.filter(id => list.some(s => s.id === id));
});

async function request(payload) {
  const convId = props.conversationId;
  busy.value = payload.mode;
  try {
    const r = await lineAiCall('generate', { conversationId: convId, ...payload });
    if (convId !== props.conversationId) return;
    result.value = { text: r.text, cited: r.cited || [], mode: payload.mode, styleId: r.styleId };
  } catch (e) {
    toast.error(errorText(e));
  } finally {
    busy.value = null;
  }
}

function generate(mode) {
  if (mode === 'polish' && !text.value.trim()) return;
  lastRequest = { mode, styleId: styleId.value, text: text.value, instruction: instruction.value, sourceIds: selectedSources.value };
  request(lastRequest);
}

function regenerate() {
  if (lastRequest) request({ ...lastRequest, styleId: styleId.value, instruction: instruction.value, sourceIds: selectedSources.value });
  else generate(result.value?.mode || 'suggest');
}

function useAsDraft() {
  text.value = result.value?.text || '';
  result.value = null;
}

async function copy(value) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = value;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  toast.success('已複製');
}

function share(value) {
  const url = `https://line.me/R/share?text=${encodeURIComponent(value)}`;
  if (isLiffMode()) window.location.href = url;
  else window.open(url, '_blank', 'noopener');
}

// 官方帳號送出要按兩次：第一次變成「確認送出」，4 秒內再按才送
async function send(key) {
  if (confirmKey.value !== key) {
    confirmKey.value = key;
    clearTimeout(confirmTimer);
    confirmTimer = setTimeout(() => { confirmKey.value = null; }, 4000);
    return;
  }
  clearTimeout(confirmTimer);
  confirmKey.value = null;
  const value = (key === 'result' ? result.value?.text : text.value) || '';
  if (!value.trim()) return;
  busy.value = 'send';
  try {
    const r = await lineAiCall('send', { conversationId: props.conversationId, text: value });
    emit('sent', r.message);
    toast.success('已送出');
    if (key === 'result') result.value = null;
    text.value = '';
    instruction.value = '';
  } catch (e) {
    toast.error(errorText(e));
  } finally {
    busy.value = null;
  }
}

onBeforeUnmount(() => { saveDraft(props.conversationId); clearTimeout(confirmTimer); });
</script>

<style scoped>
.la-comp { flex-shrink: 0; padding: 8px 12px 10px; border-top: 1px solid rgba(0, 0, 0, 0.08); background: #fff; }
.la-result { margin-bottom: 8px; padding: 8px 10px 10px; border-radius: 10px; background: #f2f7ff; box-shadow: inset 0 0 0 1px rgba(0, 113, 227, 0.18); }
.la-result__head { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.la-result__title { font-size: 12.5px; font-weight: 600; color: #0058b0; }
.la-result__style { font-size: 12px; color: #6e6e73; }
.la-result__text { min-height: 84px; max-height: 40vh; font-size: 14px; }
.la-result__cited { display: flex; align-items: center; gap: 4px; margin-top: 6px; font-size: 12px; color: #6e6e73; overflow-wrap: anywhere; }
.la-result__actions { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 8px; }
.la-styles { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: none; }
.la-styles::-webkit-scrollbar { display: none; }
.la-chip { flex-shrink: 0; height: 26px; padding: 0 11px; border: 0; border-radius: 13px; background: rgba(0, 0, 0, 0.06); color: #1d1d1f; font: 500 12.5px -apple-system, BlinkMacSystemFont, "PingFang TC", "Noto Sans TC", sans-serif; white-space: nowrap; cursor: pointer; }
.la-chip.is-active { background: #0071e3; color: #fff; }
.la-input { border-radius: 10px; box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.14); background: #fff; }
.la-input:focus-within { box-shadow: inset 0 0 0 1px #0071e3, 0 0 0 3px rgba(0, 113, 227, 0.18); }
.la-input__text { display: block; width: 100%; padding: 9px 12px 4px; border: 0; outline: none; resize: none; background: transparent; color: #1d1d1f; font: 14.5px/1.55 -apple-system, BlinkMacSystemFont, "PingFang TC", "Noto Sans TC", sans-serif; }
.la-input__instr { display: block; width: calc(100% - 20px); margin: 0 10px 4px; }
.la-input__bar { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; padding: 4px 8px 8px; }
.la-comp__warn { margin-top: 6px; font-size: 12px; color: #b25f00; }
.la-pop { width: 280px; max-width: calc(100vw - 32px); padding: 10px 12px; border-radius: 10px; background: #fff; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.16), 0 0 0 0.5px rgba(0, 0, 0, 0.12); }
.la-pop__empty { padding: 6px 0; font-size: 13px; color: #8e8e93; }
.la-pop__row { display: flex; align-items: center; gap: 8px; padding: 6px 0; font-size: 13.5px; cursor: pointer; overflow-wrap: anywhere; }
.la-pop__shared { margin-left: auto; font-size: 11px; color: #8e8e93; }
.la-pop__manage { margin-top: 4px; padding-left: 0; }
@media (max-width: 600px) {
  .la-input__text { font-size: 16px; }
  .la-comp { padding: 6px 8px 8px; }
}
</style>
