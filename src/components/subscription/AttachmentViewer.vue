<template>
  <v-dialog
    :model-value="modelValue"
    fullscreen
    :scrim="false"
    transition="fade-transition"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="current" class="av">
      <div class="av-bar">
        <div class="av-title">
          <span class="av-name">{{ current.name || '附件' }}</span>
          <span v-if="items.length > 1" class="av-count">{{ index + 1 }} / {{ items.length }}</span>
        </div>
        <div class="av-actions">
          <div v-if="kind !== 'file'" class="av-zoom">
            <button type="button" class="av-btn av-btn--icon" title="縮小" :disabled="zoom <= ZOOM_MIN" @click="setZoom(zoom - ZOOM_STEP)">
              <v-icon size="18">mdi-minus</v-icon>
            </button>
            <button type="button" class="av-btn av-zoom-pct" title="符合畫面" @click="setZoom(1)">{{ Math.round(zoom * 100) }}%</button>
            <button type="button" class="av-btn av-btn--icon" title="放大" :disabled="zoom >= ZOOM_MAX" @click="setZoom(zoom + ZOOM_STEP)">
              <v-icon size="18">mdi-plus</v-icon>
            </button>
          </div>
          <button v-if="kind !== 'file'" type="button" class="av-btn" title="列印" :disabled="printing" @click="print">
            <v-progress-circular v-if="printing" indeterminate size="14" width="2"></v-progress-circular>
            <v-icon v-else size="18">mdi-printer-outline</v-icon>
            <span class="av-btn-text">列印</span>
          </button>
          <button type="button" class="av-btn" title="下載" :disabled="downloading" @click="download">
            <v-progress-circular v-if="downloading" indeterminate size="14" width="2"></v-progress-circular>
            <v-icon v-else size="18">mdi-download</v-icon>
            <span class="av-btn-text">下載</span>
          </button>
          <button type="button" class="av-btn av-btn--icon" title="新分頁開啟" @click="openTab">
            <v-icon size="18">mdi-open-in-new</v-icon>
          </button>
          <button type="button" class="av-btn av-btn--icon" title="關閉" @click="emit('update:modelValue', false)">
            <v-icon size="20">mdi-close</v-icon>
          </button>
        </div>
      </div>

      <div
        ref="stage"
        class="av-stage"
        @touchstart.passive="onTouchStart"
        @touchend="onTouchEnd"
      >
        <!-- 圖片 -->
        <div v-if="kind === 'image'" class="av-canvas">
          <img
            :key="current.url"
            :src="current.url"
            :alt="current.name"
            class="av-image"
            :style="imageStyle"
            draggable="false"
            @load="onImageLoad"
            @error="failed = true"
            @dblclick="setZoom(zoom > 1 ? 1 : 2)"
          />
        </div>

        <!-- PDF：逐頁渲染，縮放改變渲染寬度 -->
        <div v-else-if="kind === 'pdf'" class="av-canvas av-pdf">
          <div v-if="!pdfRendered" class="av-status">
            <v-progress-circular indeterminate size="32" width="3" color="white"></v-progress-circular>
            <span>PDF 載入中…</span>
          </div>
          <VuePdfEmbed
            v-if="pdfWidth"
            :key="current.url"
            :source="current.url"
            :width="pdfWidth"
            class="av-pdf-pages"
            :class="{ 'is-hidden': !pdfRendered }"
            @rendered="pdfRendered = true"
            @loading-failed="failed = true"
            @rendering-failed="failed = true"
          />
        </div>

        <!-- 無法預覽：檔案卡 -->
        <div v-else class="av-canvas">
          <div class="av-file">
            <v-icon size="64" :color="typeStyle.color">{{ typeStyle.icon }}</v-icon>
            <div class="av-file-name">{{ current.name || '附件' }}</div>
            <div class="av-file-meta">
              {{ typeStyle.label }}<template v-if="sizeText"> · {{ sizeText }}</template>
            </div>
            <div v-if="failed" class="av-file-meta">無法預覽此檔案</div>
            <div class="av-file-actions">
              <button type="button" class="mac-btn mac-btn--primary mac-btn--lg" :disabled="downloading" @click="download">
                <v-icon size="18">mdi-download</v-icon><span>下載</span>
              </button>
              <button type="button" class="mac-btn mac-btn--lg" @click="openTab">
                <v-icon size="18">mdi-open-in-new</v-icon><span>新分頁開啟</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <button v-if="index > 0" type="button" class="av-nav is-prev" title="上一個" @click="go(-1)">
        <v-icon size="28">mdi-chevron-left</v-icon>
      </button>
      <button v-if="index < items.length - 1" type="button" class="av-nav is-next" title="下一個" @click="go(1)">
        <v-icon size="28">mdi-chevron-right</v-icon>
      </button>
    </div>
  </v-dialog>
</template>

<script setup>
// 附件全螢幕檢視器：圖片／PDF 預覽與縮放、其他檔案顯示檔案卡；可左右切換同一組附件、下載
import { ref, computed, watch, nextTick, onBeforeUnmount, defineAsyncComponent } from 'vue';
import {
  isImageAttachment, isPdfAttachment, fileTypeStyle, formatFileSize, downloadAttachment, printPdfAttachment, isIOSLike,
} from '@/utils/attachmentFile';
import { printImage } from '@/utils/printImageA3';

const VuePdfEmbed = defineAsyncComponent(() => import('vue-pdf-embed'));

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
  startIndex: { type: Number, default: 0 },
});
const emit = defineEmits(['update:modelValue']);

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.25;

const index = ref(0);
const zoom = ref(1);
const failed = ref(false);
const downloading = ref(false);
const printing = ref(false);
const pdfRendered = ref(false);
const natural = ref({ w: 0, h: 0 });
const stage = ref(null);
const stageSize = ref({ w: 0, h: 0 });

const current = computed(() => props.items[index.value] || null);
const kind = computed(() => {
  if (!current.value || failed.value) return 'file';
  if (isImageAttachment(current.value)) return 'image';
  if (isPdfAttachment(current.value)) return 'pdf';
  return 'file';
});
const typeStyle = computed(() => fileTypeStyle(current.value));
const sizeText = computed(() => formatFileSize(current.value?.size));

// 圖片：先符合畫面，再乘上縮放倍率
const imageStyle = computed(() => {
  const { w, h } = natural.value;
  const { w: sw, h: sh } = stageSize.value;
  if (!w || !h || !sw || !sh) return { maxWidth: '100%', maxHeight: '100%' };
  const fit = Math.min((sw - 32) / w, (sh - 32) / h, 1);
  return { width: `${Math.round(w * fit * zoom.value)}px` };
});

// PDF：寬度以畫面寬為基準（上限 860px），縮放後延遲重繪
const pdfWidth = ref(0);
let pdfTimer = null;
function updatePdfWidth() {
  clearTimeout(pdfTimer);
  if (kind.value !== 'pdf' || !stageSize.value.w) return;
  const target = Math.round(Math.min(stageSize.value.w - 32, 860) * zoom.value);
  if (!pdfWidth.value) pdfWidth.value = target;
  else if (target !== pdfWidth.value) pdfTimer = setTimeout(() => { pdfWidth.value = target; }, 200);
}
watch([zoom, () => stageSize.value.w, kind], updatePdfWidth);

function resetView() {
  zoom.value = 1;
  failed.value = false;
  pdfRendered.value = false;
  pdfWidth.value = 0;
  natural.value = { w: 0, h: 0 };
  nextTick(() => {
    measureStage();
    updatePdfWidth();
    stage.value?.scrollTo(0, 0);
  });
}

function onImageLoad(e) {
  natural.value = { w: e.target.naturalWidth, h: e.target.naturalHeight };
}

// 縮放時保持畫面中心位置
function setZoom(value) {
  const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 100) / 100));
  const el = stage.value;
  const ratio = el && el.scrollWidth
    ? { x: (el.scrollLeft + el.clientWidth / 2) / el.scrollWidth, y: (el.scrollTop + el.clientHeight / 2) / el.scrollHeight }
    : null;
  zoom.value = next;
  nextTick(() => {
    if (!ratio || !stage.value) return;
    stage.value.scrollLeft = ratio.x * stage.value.scrollWidth - stage.value.clientWidth / 2;
    stage.value.scrollTop = ratio.y * stage.value.scrollHeight - stage.value.clientHeight / 2;
  });
}

function go(step) {
  const next = index.value + step;
  if (next < 0 || next >= props.items.length) return;
  index.value = next;
  resetView();
}

async function download() {
  downloading.value = true;
  try {
    await downloadAttachment(current.value);
  } finally {
    downloading.value = false;
  }
}

async function print() {
  const att = current.value;
  // iPhone／iPad 無法在頁面內列印 PDF：改以瀏覽器開啟，再從分享選單列印
  if (kind.value === 'pdf' && isIOSLike()) {
    openTab();
    return;
  }
  printing.value = true;
  try {
    if (kind.value === 'image') {
      // A4 留白 10mm；橫式圖片改印橫向
      const landscape = natural.value.w > natural.value.h;
      printImage(att.url, {
        page: landscape ? 'A4 landscape' : 'A4 portrait',
        area: landscape ? { w: 277, h: 189 } : { w: 190, h: 276 },
        padding: 10,
        align: 'center',
        title: att.name,
        onError: () => alert('列印失敗：圖片載入失敗'),
      });
      setTimeout(() => window.focus(), 300);
    } else {
      await printPdfAttachment(att);
    }
  } catch (e) {
    console.error('附件列印失敗:', e);
    alert(`${e.message}，請改用「新分頁開啟」後列印`);
  } finally {
    printing.value = false;
  }
}

function openTab() {
  if (current.value?.url) window.open(current.value.url, '_blank', 'noopener');
}

// 手機左右滑動切換（放大中不切換，避免與捲動衝突）
let touchStart = null;
function onTouchStart(e) {
  touchStart = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
}
function onTouchEnd(e) {
  if (!touchStart || zoom.value > 1) return;
  const dx = e.changedTouches[0].clientX - touchStart.x;
  const dy = e.changedTouches[0].clientY - touchStart.y;
  touchStart = null;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
}

function onKeydown(e) {
  if (e.key === 'ArrowLeft') go(-1);
  else if (e.key === 'ArrowRight') go(1);
}

let resizeObserver = null;
function measureStage() {
  if (stage.value) stageSize.value = { w: stage.value.clientWidth, h: stage.value.clientHeight };
}

watch(() => props.modelValue, (open) => {
  if (open) {
    index.value = Math.min(Math.max(props.startIndex, 0), Math.max(props.items.length - 1, 0));
    resetView();
    window.addEventListener('keydown', onKeydown);
    nextTick(() => {
      resizeObserver?.disconnect();
      resizeObserver = new ResizeObserver(measureStage);
      if (stage.value) resizeObserver.observe(stage.value);
    });
  } else {
    window.removeEventListener('keydown', onKeydown);
    resizeObserver?.disconnect();
    clearTimeout(pdfTimer);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  resizeObserver?.disconnect();
  clearTimeout(pdfTimer);
});
</script>

<style scoped>
.av {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #262628;
  color: #f5f5f7;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang TC", "Noto Sans TC", sans-serif;
}
.av-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 12px;
  min-height: 56px;
  /* 左側避開全站漢堡鈕 */
  padding: 8px 10px 8px 58px;
  background: #1c1c1e;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.av-title {
  flex: 1 1 200px;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.av-name {
  font-size: 14.5px;
  font-weight: 600;
  line-height: 1.35;
  overflow-wrap: anywhere;
}
.av-count {
  flex-shrink: 0;
  font-size: 12.5px;
  color: #a1a1a6;
  font-variant-numeric: tabular-nums;
}
.av-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}
.av-zoom {
  display: flex;
  align-items: center;
  margin-right: 6px;
  padding: 2px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
}
.av-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 32px;
  padding: 0 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #f5f5f7;
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}
.av-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
}
.av-btn:disabled {
  opacity: 0.4;
  cursor: default;
}
.av-btn--icon {
  width: 32px;
  padding: 0;
}
.av-zoom .av-btn {
  height: 28px;
}
.av-zoom-pct {
  min-width: 52px;
  padding: 0 4px;
  font-variant-numeric: tabular-nums;
}
.av-stage {
  flex: 1;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
}
/* 內容小於畫面時置中、大於畫面時可完整捲動 */
.av-canvas {
  display: flex;
  box-sizing: border-box;
  width: max-content;
  min-width: 100%;
  min-height: 100%;
  padding: 16px;
}
.av-image {
  display: block;
  margin: auto;
  user-select: none;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.45);
}
.av-pdf {
  flex-direction: column;
}
.av-pdf-pages.is-hidden {
  visibility: hidden;
  height: 0;
  overflow: hidden;
}
.av-pdf-pages :deep(.vue-pdf-embed__page) {
  width: fit-content;
  margin: 0 auto 12px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.45);
}
.av-pdf-pages :deep(.vue-pdf-embed__page canvas) {
  display: block;
  max-width: none;
}
.av-status {
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #a1a1a6;
}
.av-file {
  margin: auto;
  width: min(360px, 100%);
  padding: 32px 24px 24px;
  border-radius: 14px;
  background: #fff;
  color: #1d1d1f;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
}
.av-file-name {
  margin-top: 12px;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.av-file-meta {
  margin-top: 4px;
  font-size: 12.5px;
  color: #6e6e73;
}
.av-file-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
}
.av-nav {
  position: absolute;
  top: 50%;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin-top: 28px;
  border: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  cursor: pointer;
  transform: translateY(-50%);
}
.av-nav:hover {
  background: rgba(0, 0, 0, 0.7);
}
.av-nav.is-prev {
  left: 12px;
}
.av-nav.is-next {
  right: 12px;
}

@media (max-width: 600px) {
  .av-btn-text {
    display: none;
  }
  .av-btn {
    padding: 0 8px;
  }
  .av-zoom {
    margin-right: 2px;
  }
  .av-zoom-pct {
    min-width: 44px;
  }
  .av-nav {
    width: 36px;
    height: 36px;
    background: rgba(0, 0, 0, 0.35);
  }
  .av-nav.is-prev {
    left: 6px;
  }
  .av-nav.is-next {
    right: 6px;
  }
}
</style>
