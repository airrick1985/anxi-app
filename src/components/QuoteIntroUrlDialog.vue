<template>
  <v-dialog v-model="show" max-width="500" persistent scrollable content-class="mac-dialog-fit">
    <v-card class="mac-sheet qiu">
      <div class="mac-sheet-head">
        <v-icon size="18">mdi-qrcode</v-icon>
        <span>建案簡介 QR Code</span>
        <button type="button" class="mac-sheet-close" title="關閉" aria-label="關閉" @click="close">
          <v-icon size="18">mdi-close</v-icon>
        </button>
      </div>

      <div class="mac-form qiu-body">
        <div class="mac-form-label qiu-first-label">網址</div>
        <div class="qiu-url" :class="{ 'is-error': !!urlError }">
          <input
            v-model="urlInput"
            class="qiu-url-input"
            type="url"
            inputmode="url"
            autocapitalize="off"
            autocorrect="off"
            spellcheck="false"
            placeholder="https://"
            aria-label="建案簡介網址"
            :disabled="loading"
          />
          <button v-if="urlInput" type="button" class="mac-icon-btn" title="清除" aria-label="清除" @click="urlInput = ''">
            <v-icon size="16">mdi-close-circle</v-icon>
          </button>
          <a v-if="validUrl" class="mac-icon-btn" :href="validUrl" target="_blank" rel="noopener" title="開啟網址" aria-label="開啟網址">
            <v-icon size="16">mdi-open-in-new</v-icon>
          </a>
        </div>
        <div v-if="urlError" class="qiu-error">{{ urlError }}</div>

        <div class="mac-form-label">
          預覽
          <span class="mac-spacer"></span>
          <template v-if="validUrl && !loading">
            <span v-if="fit.limited && label.fontRatio" class="mac-tag mac-tag--orange">已達可掃描上限</span>
            <span v-if="fit.verified" class="mac-tag mac-tag--green"><v-icon size="13">mdi-check</v-icon>可掃描</span>
            <span v-else-if="settled" class="mac-tag mac-tag--red"><v-icon size="13">mdi-alert</v-icon>可能掃不到</span>
          </template>
        </div>
        <div class="mac-form-group">
          <div class="qiu-preview">
            <!-- 可直接操作的預覽：點中央文字修改、拖角落縮放 -->
            <div ref="stageRef" class="qiu-stage" :class="{ 'is-empty': !validUrl }">
              <template v-if="validUrl && !loading">
                <img v-if="previewUrl" :src="previewUrl" class="qiu-qr" alt="QR Code 預覽" draggable="false" />

                <textarea
                  v-if="editing"
                  ref="editRef"
                  class="qiu-edit"
                  :value="draft"
                  :style="editStyle"
                  :maxlength="QR_LABEL_MAX_CHARS"
                  spellcheck="false"
                  aria-label="中央文字"
                  @input="onEditInput"
                  @blur="finishEdit"
                  @keydown.esc.stop.prevent="cancelEdit"
                  @keydown.meta.enter.prevent="$event.target.blur()"
                  @keydown.ctrl.enter.prevent="$event.target.blur()"
                ></textarea>

                <div v-else-if="box" class="qiu-label" :class="{ 'is-resizing': resizing }" :style="labelStyle">
                  <button type="button" class="qiu-label-hit" title="點一下修改文字" aria-label="修改中央文字" @click="startEdit"></button>
                  <span
                    v-for="c in CORNERS"
                    :key="c"
                    class="qiu-handle"
                    :class="`qiu-handle--${c}`"
                    title="拖曳調整大小"
                    @pointerdown.stop.prevent="startResize"
                  ></span>
                </div>

                <button v-else type="button" class="mac-btn mac-btn--sm qiu-add" @click="startEdit">
                  <v-icon size="15">mdi-plus</v-icon>文字
                </button>
              </template>
              <v-progress-circular v-else-if="loading" indeterminate size="28" width="3" color="#8e8e93" />
              <v-icon v-else size="56" color="#c7c7cc">mdi-qrcode</v-icon>
            </div>

            <div v-if="validUrl && printUrl" class="qiu-print">
              <img :src="printUrl" class="qiu-print-qr" alt="列印大小" draggable="false" />
              <span>列印大小</span>
            </div>
          </div>

          <div v-if="validUrl && !loading" class="qiu-tools">
            <button type="button" class="mac-icon-btn" title="縮小文字" aria-label="縮小文字" :disabled="!box" @click="nudge(-1)">
              <v-icon size="18">mdi-format-font-size-decrease</v-icon>
            </button>
            <input
              type="range"
              class="qiu-range"
              :min="QR_FONT_MIN"
              :max="QR_FONT_MAX"
              step="0.001"
              :value="currentRatio"
              :disabled="!box"
              aria-label="文字大小"
              @input="setRatio(Number($event.target.value))"
            />
            <button type="button" class="mac-icon-btn" title="放大文字" aria-label="放大文字" :disabled="!box" @click="nudge(1)">
              <v-icon size="18">mdi-format-font-size-increase</v-icon>
            </button>
            <span class="qiu-pt">{{ box ? `${toPt(currentRatio)} pt` : '' }}</span>
            <button type="button" class="mac-btn mac-btn--sm" :class="{ 'is-active': !label.fontRatio }" :disabled="!box" @click="setAuto">自動</button>
          </div>
          <div v-if="validUrl && !loading && label.custom" class="qiu-restore">
            <button type="button" class="mac-link-btn" @click="restoreName">還原為建案名稱</button>
          </div>
        </div>
      </div>

      <div class="mac-sheet-foot">
        <span v-if="updatedInfo" class="mac-sheet-note qiu-updated">{{ updatedInfo }}</span>
        <span class="mac-spacer"></span>
        <button type="button" class="mac-btn" :disabled="saving" @click="close">取消</button>
        <button v-if="isRemoving" type="button" class="mac-btn mac-btn--danger-fill" :disabled="saving" @click="save">
          <v-progress-circular v-if="saving" indeterminate size="14" width="2" />移除
        </button>
        <button v-else type="button" class="mac-btn mac-btn--primary" :disabled="!canSave" @click="save">
          <v-progress-circular v-if="saving" indeterminate size="14" width="2" />儲存
        </button>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
/**
 * 報價單「建案簡介 QR Code」設定：網址＋中央文字（內容、大小）
 * 文字直接在預覽上改：點一下編輯（Enter 換行）、拖角落縮放；預覽與列印用同一支程式繪製
 */
import { ref, reactive, computed, watch, nextTick, onBeforeUnmount } from 'vue';
import { useToast } from 'vue-toastification';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
import {
  normalizeIntroUrl,
  isValidIntroUrl,
  resolveQrLabel,
  fitIntroQr,
  drawIntroQr,
  measureIntroLabel,
  QR_FONT_MIN,
  QR_FONT_MAX,
  QR_LABEL_FONT,
  QR_LABEL_COLOR,
  QR_LABEL_LINE_HEIGHT,
  QR_LABEL_MAX_CHARS,
} from '@/utils/quoteQrCode';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: String, default: '' },
  projectName: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue', 'saved']);

const toast = useToast();
const userStore = useUserStore();
const projectStore = useProjectStore();

const PREVIEW_SIZE = 640;
const PRINT_MM = 20; // 報價單上的 QR Code 邊長
const CORNERS = ['nw', 'ne', 'sw', 'se'];

const show = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const loading = ref(false);
const saving = ref(false);
const updatedInfo = ref('');
const urlInput = ref('');
const urlError = ref('');
const initial = ref({ url: '', label: '' });

// text 只在自訂時使用；fontRatio 為 null 表示自動大小
const label = reactive({ custom: false, text: '', fontRatio: null });
const currentLabel = computed(() => ({
  custom: label.custom,
  text: label.custom ? label.text : props.projectName,
  fontRatio: label.fontRatio,
}));
const savedLabel = computed(() => ({
  text: label.custom ? label.text.trim() : null,
  fontRatio: label.fontRatio ? Math.round(label.fontRatio * 10000) / 10000 : null,
}));

const validUrl = computed(() => {
  const raw = urlInput.value.trim();
  return isValidIntroUrl(raw) ? normalizeIntroUrl(raw) : '';
});
const isDirty = computed(() =>
  (validUrl.value || urlInput.value.trim()) !== initial.value.url
  || JSON.stringify(savedLabel.value) !== initial.value.label
);
const isRemoving = computed(() => !loading.value && !urlInput.value.trim() && !!initial.value.url);
const canSave = computed(() => !loading.value && !saving.value && !!validUrl.value && isDirty.value);

// ---------- 載入 ----------
// 同步本地專案物件，讓列印對話框不必重新讀取即可反映最新設定
function syncLocalProject(url, labelData) {
  const project = projectStore.getProjectById(props.projectId);
  if (!project) return;
  project.quoteIntroUrl = url;
  if (labelData) project.quoteIntroQrLabel = labelData;
}

function formatUpdated(meta) {
  if (!meta?.updatedBy && !meta?.updatedAt) return '';
  const when = meta.updatedAt
    ? new Intl.DateTimeFormat('zh-TW', {
        timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
      }).format(new Date(meta.updatedAt))
    : '';
  return [meta.updatedBy, when].filter(Boolean).join('　');
}

// 開啟時直接讀 Firestore，避免本地快取過期
watch(show, async (visible) => {
  if (!visible) return;
  urlError.value = '';
  updatedInfo.value = '';
  previewUrl.value = '';
  printUrl.value = '';
  editing.value = false;
  loading.value = true;
  try {
    const data = await projectStore.fetchProjectSettings(props.projectId);
    const url = String(data?.quoteIntroUrl || '').trim();
    const saved = resolveQrLabel(data?.quoteIntroQrLabel, props.projectName);
    urlInput.value = url;
    Object.assign(label, { custom: saved.custom, text: saved.custom ? saved.text : '', fontRatio: saved.fontRatio });
    initial.value = { url: url ? normalizeIntroUrl(url) : '', label: JSON.stringify(savedLabel.value) };
    updatedInfo.value = formatUpdated(data?.quoteIntroUrlMeta);
    syncLocalProject(url, data?.quoteIntroQrLabel);
  } catch (e) {
    toast.error(`載入設定失敗：${e.message}`);
  } finally {
    loading.value = false;
    refresh();
  }
}, { immediate: true });

// ---------- 預覽 ----------
const stageRef = ref(null);
const previewUrl = ref('');
const printUrl = ref('');
const fit = reactive({ version: 0, fontRatio: null, limited: false, verified: false });
const settled = ref(false);

// 尚未驗證完成前，先用上次的密度即時畫
const drawLabelData = computed(() => ({
  ...currentLabel.value,
  fontRatio: settled.value ? fit.fontRatio : currentLabel.value.fontRatio,
  version: fit.version || undefined,
}));
const box = computed(() => measureIntroLabel(drawLabelData.value));
const currentRatio = computed(() => box.value?.fontRatio || QR_FONT_MIN);
const toPt = ratio => ((ratio * PRINT_MM * 72) / 25.4).toFixed(1);

function paint() {
  if (!validUrl.value) {
    previewUrl.value = '';
    printUrl.value = '';
    return;
  }
  try {
    previewUrl.value = drawIntroQr(validUrl.value, drawLabelData.value, PREVIEW_SIZE, { hideLabel: editing.value }).toDataURL('image/png');
    if (!editing.value) printUrl.value = previewUrl.value;
  } catch (e) {
    console.error('[QuoteIntroUrlDialog] 產生 QR Code 失敗:', e);
    previewUrl.value = '';
    printUrl.value = '';
    urlError.value = '網址太長，無法產生 QR Code';
  }
}

let seq = 0;
let settleTimer = null;
// 立即重畫，停下來再驗證能不能掃
function refresh(delay = 160) {
  seq += 1;
  settled.value = false;
  clearTimeout(settleTimer);
  paint();
  if (validUrl.value) settleTimer = setTimeout(settle, delay);
}
async function settle() {
  clearTimeout(settleTimer);
  const url = validUrl.value;
  if (!url) return;
  const mine = seq;
  try {
    const result = await fitIntroQr(url, currentLabel.value);
    if (mine !== seq) return;
    Object.assign(fit, result);
    // 手動大小超過可掃描範圍：停在上限
    if (label.fontRatio && result.fontRatio) label.fontRatio = result.fontRatio;
    settled.value = true;
    paint();
  } catch (e) {
    if (mine !== seq) return;
    console.error('[QuoteIntroUrlDialog] 驗證 QR Code 失敗:', e);
    Object.assign(fit, { limited: false, verified: false });
  }
}

let urlTimer = null;
watch(urlInput, () => {
  if (loading.value) return;
  clearTimeout(urlTimer);
  urlError.value = '';
  urlTimer = setTimeout(() => {
    if (urlInput.value.trim() && !validUrl.value) urlError.value = '網址格式不正確';
  }, 500);
});
watch(validUrl, () => { if (!loading.value) refresh(250); });
watch(() => props.projectName, () => { if (show.value && !loading.value) refresh(); });

// ---------- 大小 ----------
function setRatio(ratio) {
  label.fontRatio = Math.min(QR_FONT_MAX, Math.max(QR_FONT_MIN, ratio));
  refresh();
}
function nudge(direction) {
  setRatio(currentRatio.value + direction * 0.006);
}
function setAuto() {
  label.fontRatio = null;
  refresh(0);
}

const labelStyle = computed(() => ({
  width: `${box.value.w * 100}%`,
  height: `${box.value.h * 100}%`,
}));

// 拖角落：依離中心的距離等比縮放
const resizing = ref(false);
let stopResize = null;
function startResize(e) {
  const rect = stageRef.value.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const startDistance = Math.max(8, Math.hypot(e.clientX - cx, e.clientY - cy));
  const startRatio = currentRatio.value;
  resizing.value = true;
  const move = (ev) => setRatio(startRatio * (Math.hypot(ev.clientX - cx, ev.clientY - cy) / startDistance));
  const up = () => {
    stopResize?.();
    settle();
  };
  stopResize = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    resizing.value = false;
    stopResize = null;
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
}

// ---------- 文字 ----------
const editRef = ref(null);
const editing = ref(false);
const draft = ref('');
let beforeEdit = null;
const defaultText = computed(() =>
  (measureIntroLabel({ text: props.projectName, custom: false, fontRatio: null })?.lines || []).join('\n')
);

const editStyle = computed(() => {
  const stage = stageRef.value?.clientWidth || 280;
  const b = box.value || { w: 0.24, h: 0.12, pad: 0.016, fontRatio: 0.08 };
  // 手機字級小於 16px 時 iOS 會自動放大畫面
  const fontSize = Math.max(16, b.fontRatio * stage);
  const k = fontSize / (b.fontRatio * stage);
  return {
    width: `${Math.max(b.w * stage * k + fontSize * 0.5, 56)}px`,
    height: `${Math.max(b.h * stage * k, fontSize * 1.5) + 4}px`,
    padding: `${b.pad * stage + 2}px 0`,
    fontSize: `${fontSize}px`,
    fontFamily: QR_LABEL_FONT,
    lineHeight: QR_LABEL_LINE_HEIGHT,
    color: QR_LABEL_COLOR,
  };
});

// 編輯時以看到的斷行為準
function startEdit() {
  beforeEdit = { custom: label.custom, text: label.text };
  draft.value = (box.value?.lines || []).join('\n');
  editing.value = true;
  paint();
  nextTick(() => {
    editRef.value?.focus();
    editRef.value?.select();
  });
}
function onEditInput(e) {
  draft.value = e.target.value;
  applyText(draft.value);
}
// 與建案名稱相同就沿用建案名稱（之後改名會跟著變）
function applyText(text) {
  const same = [props.projectName.trim(), defaultText.value].includes(text.trim());
  label.custom = !same;
  label.text = same ? '' : text;
  refresh();
}
function finishEdit() {
  if (!editing.value) return;
  editing.value = false;
  label.text = label.text.trim();
  refresh(0);
}
function cancelEdit() {
  Object.assign(label, beforeEdit);
  editing.value = false;
  refresh(0);
}
function restoreName() {
  editing.value = false;
  Object.assign(label, { custom: false, text: '' });
  refresh(0);
}

// ---------- 儲存 ----------
async function save() {
  if (saving.value) return;
  const raw = urlInput.value.trim();
  if (raw && !validUrl.value) {
    urlError.value = '網址格式不正確';
    return;
  }
  saving.value = true;
  try {
    if (validUrl.value) await settle(); // 確保存的是驗證後的大小
    const url = validUrl.value;
    const payload = {
      quoteIntroUrl: url,
      quoteIntroQrLabel: savedLabel.value,
      quoteIntroUrlMeta: { updatedBy: userStore.user?.name || '', updatedAt: new Date().toISOString() },
    };
    await projectStore.updateProjectSettings(props.projectId, payload);
    syncLocalProject(url, payload.quoteIntroQrLabel);
    toast.success(url ? '已儲存' : '已移除', { timeout: 1500 });
    emit('saved', url);
    show.value = false;
  } catch (e) {
    toast.error(`儲存失敗：${e.message}`);
  } finally {
    saving.value = false;
  }
}

function close() {
  show.value = false;
}

onBeforeUnmount(() => {
  clearTimeout(settleTimer);
  clearTimeout(urlTimer);
  stopResize?.();
});
</script>

<style scoped>
.qiu { display: flex; flex-direction: column; }
.qiu-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 4px 16px 18px; }
.qiu-first-label { margin-top: 10px; }

.qiu-url {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 36px;
  padding: 0 5px 0 10px;
  border: 1px solid rgba(0, 0, 0, 0.14);
  border-radius: 8px;
  background: #fff;
  transition: border-color 0.12s, box-shadow 0.12s;
}
.qiu-url:focus-within { border-color: #0071e3; box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.22); }
.qiu-url.is-error { border-color: #d62d20; }
.qiu-url.is-error:focus-within { box-shadow: 0 0 0 3px rgba(214, 45, 32, 0.16); }
.qiu-url-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: #1d1d1f;
  font: inherit;
  font-size: 14px;
}
.qiu-error { margin: 5px 4px 0; color: #d62d20; font-size: 12.5px; }
a.mac-icon-btn { text-decoration: none; }

/* 預覽 */
.qiu-preview { display: flex; align-items: flex-end; justify-content: center; gap: 18px; padding: 18px 14px 16px; }
.qiu-stage {
  position: relative;
  flex: 0 1 290px;
  min-width: 0;
  aspect-ratio: 1;
  display: grid;
  place-content: center;
  border-radius: 8px;
  user-select: none;
  -webkit-user-select: none;
}
.qiu-stage.is-empty { background: #f5f5f7; }
.qiu-qr { position: absolute; inset: 0; width: 100%; height: 100%; display: block; -webkit-user-drag: none; }
.qiu-print { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 5px; font-size: 11.5px; color: #6e6e73; }
.qiu-print-qr { width: 20mm; height: 20mm; display: block; box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.16); }

/* 中央文字：虛線框＋四角控制點 */
.qiu-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.qiu-label-hit {
  position: absolute;
  inset: -3px;
  padding: 0;
  border: 1.5px dashed rgba(0, 113, 227, 0.75);
  border-radius: 6px;
  background: transparent;
  cursor: text;
}
.qiu-label-hit:hover { background: rgba(0, 113, 227, 0.07); border-style: solid; }
.qiu-label-hit:focus-visible { outline: 3px solid rgba(0, 113, 227, 0.3); }
.qiu-label.is-resizing .qiu-label-hit { border-style: solid; }
.qiu-handle { position: absolute; width: 30px; height: 30px; margin: -15px; touch-action: none; }
.qiu-handle::after {
  content: '';
  position: absolute;
  inset: 9px;
  border: 2px solid #0071e3;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}
.qiu-handle--nw { top: -3px; left: -3px; cursor: nwse-resize; }
.qiu-handle--ne { top: -3px; right: -3px; cursor: nesw-resize; }
.qiu-handle--sw { bottom: -3px; left: -3px; cursor: nesw-resize; }
.qiu-handle--se { bottom: -3px; right: -3px; cursor: nwse-resize; }

.qiu-edit {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  box-sizing: border-box;
  max-width: 100%;
  border: 2px solid #0071e3;
  border-radius: 8px;
  outline: none;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.22);
  font-weight: 700;
  text-align: center;
  white-space: pre;
  overflow: hidden;
  resize: none;
  user-select: text;
  -webkit-user-select: text;
}
.qiu-add { position: relative; z-index: 1; color: #0071e3; box-shadow: 0 1px 6px rgba(0, 0, 0, 0.28), 0 0 0 0.5px rgba(0, 0, 0, 0.1); }
.qiu-add .v-icon { color: #0071e3; }

/* 大小 */
.qiu-tools { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-top: 1px solid #ececf0; }
.qiu-tools .mac-icon-btn:disabled { opacity: 0.4; cursor: default; }
.qiu-range {
  appearance: none;
  -webkit-appearance: none;
  flex: 1 1 auto;
  min-width: 60px;
  height: 4px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.16);
  outline: none;
  cursor: pointer;
}
.qiu-range:disabled { opacity: 0.5; cursor: default; }
.qiu-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.18), 0 1px 3px rgba(0, 0, 0, 0.25);
}
.qiu-range::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border: 0;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.18), 0 1px 3px rgba(0, 0, 0, 0.25);
}
.qiu-range:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.35); }
.qiu-pt { flex-shrink: 0; min-width: 46px; text-align: right; font-size: 12.5px; color: #6e6e73; font-variant-numeric: tabular-nums; }
.qiu-restore { padding: 0 14px 10px; text-align: center; }
.qiu-updated { overflow-wrap: anywhere; }

@media (max-width: 600px) {
  .qiu-body { padding: 4px 12px 14px; }
  .qiu-url { height: 42px; }
  .qiu-url-input { font-size: 16px; }
  .qiu-preview { gap: 12px; padding: 16px 12px 14px; }
  .qiu-tools { gap: 6px; padding: 10px; }
}
</style>
