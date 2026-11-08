<template>
  <div ref="rootEl" class="fps">
    <div ref="scrollEl" class="fps-scroll">
      <div v-if="kind === 'image' && imageUrl && !error" class="fps-center">
        <img
          :src="imageUrl"
          class="fps-img"
          :style="imgStyle"
          alt=""
          draggable="false"
          @load="onImgLoad"
          @error="error = true"
        />
      </div>

      <div v-else-if="kind === 'pdf' && active" class="fps-center">
        <canvas ref="pdfCanvas" class="fps-page"></canvas>
      </div>

      <div v-else-if="kind === 'docx' && active" class="fps-docx">
        <div ref="docxEl" class="fps-docx-inner" :style="docxStyle"></div>
      </div>

      <div v-if="showDeferred" class="fps-placeholder">
        <v-icon :color="icon.color" size="56">{{ icon.icon }}</v-icon>
        <button type="button" class="mac-btn" @click="loadRequested = true">
          <v-icon size="16">mdi-eye-outline</v-icon>載入預覽
        </button>
      </div>
      <div v-else-if="showUnsupported" class="fps-placeholder">
        <v-icon :color="icon.color" size="56">{{ icon.icon }}</v-icon>
        <span class="fps-placeholder-text">{{ error ? '無法預覽' : '此格式不支援預覽' }}</span>
      </div>

      <div v-if="loading || busy" class="fps-loading">
        <v-progress-circular indeterminate size="26" width="3" color="#8e8e93" />
      </div>
    </div>

    <div v-if="hasToolbar" class="fps-toolbar" @dblclick.stop>
      <template v-if="zoomable">
        <button type="button" class="fps-tool" title="縮小" :disabled="zoom <= 1" @click="zoomOut">
          <v-icon size="18">mdi-minus</v-icon>
        </button>
        <button type="button" class="fps-tool" title="符合大小" :disabled="zoom === 1" @click="zoom = 1">
          <v-icon size="17">mdi-fit-to-screen-outline</v-icon>
        </button>
        <button type="button" class="fps-tool" title="放大" :disabled="zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]" @click="zoomIn">
          <v-icon size="18">mdi-plus</v-icon>
        </button>
      </template>
      <template v-if="kind === 'pdf' && pageCount > 1">
        <span class="fps-sep"></span>
        <button type="button" class="fps-tool" title="上一頁" :disabled="pageNo <= 1" @click="pageNo -= 1">
          <v-icon size="18">mdi-chevron-up</v-icon>
        </button>
        <span class="fps-pages">{{ pageNo }} / {{ pageCount }}</span>
        <button type="button" class="fps-tool" title="下一頁" :disabled="pageNo >= pageCount" @click="pageNo += 1">
          <v-icon size="18">mdi-chevron-down</v-icon>
        </button>
      </template>
      <template v-if="rotatable">
        <span class="fps-sep"></span>
        <button type="button" class="fps-tool" title="向右旋轉" :disabled="busy" @click="emit('rotate')">
          <v-icon size="18">mdi-rotate-right</v-icon>
        </button>
      </template>
      <template v-if="expandable">
        <span class="fps-sep"></span>
        <button type="button" class="fps-tool" title="放大檢視（空白鍵）" @click="emit('expand')">
          <v-icon size="17">mdi-arrow-expand</v-icon>
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { openPdf, renderPdfPage, renderDocx } from '@/utils/filePreview';
import { fileIconForDocument } from '@/utils/unitDocuments';

const props = defineProps({
  kind: { type: String, default: 'none' }, // image | pdf | docx | none
  src: { type: Blob, default: null }, // PDF／Word 內容
  imageUrl: { type: String, default: '' },
  fileName: { type: String, default: '' },
  mimeType: { type: String, default: '' },
  deferred: { type: Boolean, default: false }, // 大檔：點了才載入
  rotatable: { type: Boolean, default: false },
  expandable: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
});
const emit = defineEmits(['rotate', 'expand']);

const PAD = 14;
const TOOLBAR_SPACE = 58; // 底部浮動工具列佔的高度，「符合大小」時不讓頁面被蓋住
const ZOOM_STEPS = [1, 1.5, 2, 3, 4];

const rootEl = ref(null);
const scrollEl = ref(null);
const pdfCanvas = ref(null);
const docxEl = ref(null);

const size = reactive({ cw: 0, ch: 0 });
const zoom = ref(1);
const loading = ref(false);
const error = ref(false);
const loadRequested = ref(false);
const natural = reactive({ w: 0, h: 0 });

const pageNo = ref(1);
const pageCount = ref(0);
let pdfDoc = null;
let renderTask = null;
let renderToken = 0;
let renderChain = Promise.resolve();
let loadToken = 0;
const docxPageWidth = ref(0);

const icon = computed(() => fileIconForDocument(props.mimeType, props.fileName));
const active = computed(() =>
  (props.kind === 'pdf' || props.kind === 'docx') && !!props.src && (!props.deferred || loadRequested.value) && !error.value
);
const showDeferred = computed(() =>
  (props.kind === 'pdf' || props.kind === 'docx') && !!props.src && props.deferred && !loadRequested.value
);
const showUnsupported = computed(() => {
  if (showDeferred.value) return false;
  if (error.value) return true;
  if (props.kind === 'image') return !props.imageUrl && !props.busy;
  if (props.kind === 'pdf' || props.kind === 'docx') return !props.src;
  return true;
});
const zoomable = computed(() => !error.value && (
  (props.kind === 'image' && !!props.imageUrl) || active.value
));
const hasToolbar = computed(() => zoomable.value || props.rotatable || props.expandable);

const imgStyle = computed(() => {
  if (!natural.w || !natural.h || !size.cw || !size.ch) return { maxWidth: '100%', maxHeight: '100%' };
  const fit = Math.min((size.cw - PAD * 2) / natural.w, (size.ch - PAD - TOOLBAR_SPACE) / natural.h, 1);
  const s = Math.max(fit, 0.01) * zoom.value;
  return { width: `${Math.round(natural.w * s)}px`, height: `${Math.round(natural.h * s)}px` };
});

const docxStyle = computed(() => {
  if (!docxPageWidth.value || !size.cw) return null;
  const fit = Math.min((size.cw - PAD * 2) / docxPageWidth.value, 1.25);
  return { zoom: String(Math.max(fit, 0.1) * zoom.value) };
});

function zoomIn() {
  const next = ZOOM_STEPS.find(z => z > zoom.value);
  if (next) zoom.value = next;
}
function zoomOut() {
  const prev = [...ZOOM_STEPS].reverse().find(z => z < zoom.value);
  zoom.value = prev || 1;
}

function onImgLoad(e) {
  natural.w = e.target.naturalWidth;
  natural.h = e.target.naturalHeight;
}

// ───────── PDF ─────────
function destroyPdf() {
  renderToken += 1;
  if (renderTask) {
    try { renderTask.cancel(); } catch (e) { /* noop */ }
    renderTask = null;
  }
  if (pdfDoc) {
    try { pdfDoc.destroy(); } catch (e) { /* noop */ }
    pdfDoc = null;
  }
  pageCount.value = 0;
}

function scheduleRender() {
  const token = ++renderToken;
  if (renderTask) {
    try { renderTask.cancel(); } catch (e) { /* noop */ }
  }
  // 依序執行：前一次 render 取消並結束後才開始，避免同一個 canvas 同時有兩個 render
  renderChain = renderChain.then(() => doRenderPdf(token)).catch(() => {});
}

async function doRenderPdf(token) {
  if (token !== renderToken || !pdfDoc || !pdfCanvas.value || !size.cw || !size.ch) return;
  const page = await pdfDoc.getPage(pageNo.value);
  if (token !== renderToken) return;
  const base = page.getViewport({ scale: 1 });
  const fitW = Math.min(size.cw - PAD * 2, (size.ch - PAD - TOOLBAR_SPACE) * (base.width / base.height));
  const cssW = Math.max(40, fitW * zoom.value);
  loading.value = true;
  let task = null;
  try {
    task = await renderPdfPage(pdfDoc, pageNo.value, pdfCanvas.value, cssW);
    renderTask = task;
    if (token !== renderToken) task.cancel();
    await task.promise;
  } catch (err) {
    if (err?.name !== 'RenderingCancelledException') {
      console.warn('[FilePreviewStage] PDF 渲染失敗:', err);
      if (token === renderToken) error.value = true;
    }
  } finally {
    if (renderTask === task) renderTask = null;
    if (token === renderToken) loading.value = false;
  }
}

async function loadContent() {
  const myLoad = ++loadToken;
  destroyPdf();
  docxPageWidth.value = 0;
  if (!active.value) return;
  loading.value = true;
  try {
    if (props.kind === 'pdf') {
      const doc = await openPdf(props.src);
      if (myLoad !== loadToken) { doc.destroy(); return; }
      pdfDoc = doc;
      pageCount.value = doc.numPages;
      pageNo.value = 1;
      await nextTick();
      scheduleRender();
    } else if (props.kind === 'docx') {
      await nextTick();
      if (!docxEl.value) return;
      const className = await renderDocx(props.src, docxEl.value);
      if (myLoad !== loadToken) return;
      const first = docxEl.value?.querySelector(`section.${className}`);
      docxPageWidth.value = first?.offsetWidth || 794;
    }
  } catch (err) {
    console.warn('[FilePreviewStage] 預覽載入失敗:', err);
    if (myLoad === loadToken) error.value = true;
  } finally {
    // PDF 頁面渲染中的轉圈由 doRenderPdf 自己控制
    if (myLoad === loadToken) loading.value = false;
  }
}

watch(() => [props.src, props.kind, props.imageUrl], (next, prev) => {
  const srcChanged = !prev || next[0] !== prev[0] || next[1] !== prev[1];
  zoom.value = 1;
  error.value = false;
  if (srcChanged) {
    loadRequested.value = false;
    natural.w = 0;
    natural.h = 0;
  }
  if (srcChanged) loadContent();
}, { immediate: true });

watch(loadRequested, (v) => { if (v) loadContent(); });

watch([pageNo, zoom], () => {
  if (props.kind === 'pdf' && pdfDoc) scheduleRender();
  if (scrollEl.value) scrollEl.value.scrollTop = 0;
});

// ───────── 尺寸 ─────────
let ro = null;
let resizeTimer = null;
function measure() {
  const el = scrollEl.value;
  if (!el) return;
  size.cw = el.clientWidth;
  size.ch = el.clientHeight;
}
watch(() => [size.cw, size.ch], () => {
  if (props.kind === 'pdf' && pdfDoc) scheduleRender();
});

onMounted(() => {
  measure();
  if (typeof ResizeObserver !== 'undefined' && scrollEl.value) {
    ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measure, 80);
    });
    ro.observe(scrollEl.value);
  }
});

onBeforeUnmount(() => {
  loadToken += 1;
  clearTimeout(resizeTimer);
  if (ro) ro.disconnect();
  destroyPdf();
});

defineExpose({ isZoomed: () => zoom.value > 1 });
</script>

<style scoped>
.fps {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #ececef;
}
.fps-scroll {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}
.fps-center {
  display: flex;
  box-sizing: border-box;
  width: max-content;
  min-width: 100%;
  min-height: 100%;
  padding: 14px 14px 58px;
}
.fps-img,
.fps-page {
  margin: auto;
  display: block;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.16), 0 0 0 0.5px rgba(0, 0, 0, 0.08);
  user-select: none;
  -webkit-user-drag: none;
}
.fps-docx {
  min-height: 100%;
  padding: 14px 14px 58px;
  box-sizing: border-box;
  overflow-x: auto;
}
.fps-docx-inner {
  width: max-content;
  min-width: 100%;
}
.fps-docx-inner :deep([class$="-wrapper"]) {
  background: transparent;
  padding: 0;
}
.fps-docx-inner :deep(section) {
  margin-bottom: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.16), 0 0 0 0.5px rgba(0, 0, 0, 0.08);
}
.fps-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  text-align: center;
}
.fps-placeholder-text {
  color: #6e6e73;
  font-size: 13px;
}
.fps-loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
}
.fps-toolbar {
  position: absolute;
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px 4px;
  border-radius: 10px;
  background: rgba(250, 250, 252, 0.92);
  -webkit-backdrop-filter: saturate(180%) blur(16px);
  backdrop-filter: saturate(180%) blur(16px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.14), 0 0 0 0.5px rgba(0, 0, 0, 0.12);
  white-space: nowrap;
}
.fps-tool {
  display: inline-grid;
  place-items: center;
  width: 30px;
  height: 28px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #3a3a3c;
  cursor: pointer;
}
.fps-tool:hover:not(:disabled) { background: rgba(0, 0, 0, 0.07); }
.fps-tool:disabled { opacity: 0.35; cursor: default; }
.fps-tool .v-icon { color: inherit; }
.fps-sep {
  width: 1px;
  height: 16px;
  margin: 0 3px;
  background: rgba(0, 0, 0, 0.12);
}
.fps-pages {
  min-width: 52px;
  padding: 0 2px;
  color: #3a3a3c;
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
  text-align: center;
}

@media (max-width: 600px) {
  .fps-tool { width: 36px; height: 34px; }
}
</style>
