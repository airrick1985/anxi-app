<template>
  <div ref="rootRef" class="amt" :class="[`amt--${fit}`, { 'is-tall': tall }]">
    <!-- 自建頁面：等比縮小的實際畫面 -->
    <div v-if="kind === 'page'" class="amt-paper amt-page" :style="pageBoxStyle" inert>
      <div v-if="seen && pageScale > 0" class="amt-page-stage" :style="{ transform: `scale(${pageScale})` }" v-html="pageHtml"></div>
    </div>

    <img
      v-else-if="src"
      class="amt-paper amt-img"
      :src="src"
      alt=""
      loading="lazy"
      decoding="async"
      draggable="false"
      @load="onLoad"
      @error="onError"
    />

    <!-- PDF 封面產生中／失敗 -->
    <div v-else class="amt-paper amt-placeholder">
      <v-progress-circular v-if="pdfPending" indeterminate size="22" width="2" color="#8e8e93" />
      <v-icon v-else size="34">{{ ACTIVITY_KIND_ICONS[kind] }}</v-icon>
    </div>
  </div>
</template>

<script setup>
/**
 * 活動訊息縮圖：圖片、PDF 第一頁、自建頁面實際畫面，完整顯示不裁切（特別長的只取上半部）
 * fit：contain＝置中放進父層（父層需 position: relative 且有高度）；width＝撐滿寬度；height＝撐滿高度
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { activityKind, ACTIVITY_KIND_ICONS } from '@/utils/activityMessage';
import { renderCanvasHtml, normalizeCanvas, CANVAS_WIDTH } from '@/utils/activityCanvas';
import { getRemotePdfCover } from '@/utils/activityCover';
import '@/styles/activityPageContent.css';

const props = defineProps({
  item: { type: Object, required: true },
  fit: { type: String, default: 'contain' },
});

// 高寬比超過此值視為長圖，只顯示上半部
const TALL_RATIO = 1.75;

const rootRef = ref(null);
const seen = ref(false);
const box = ref({ w: 0, h: 0 });
const tall = ref(false);
const failedSrc = ref('');
const localCover = ref('');
const pdfPending = ref(false);

const kind = computed(() => activityKind(props.item));
const src = computed(() => {
  const { coverURL, downloadURL } = props.item;
  if (kind.value === 'image') return coverURL && coverURL !== failedSrc.value ? coverURL : downloadURL;
  if (kind.value === 'pdf') return coverURL && coverURL !== failedSrc.value ? coverURL : localCover.value;
  return '';
});

function onLoad(e) {
  const { naturalWidth, naturalHeight } = e.target;
  tall.value = naturalWidth > 0 && naturalHeight / naturalWidth > TALL_RATIO;
}
function onError() {
  failedSrc.value = src.value;
}

// ---------- 自建頁面 ----------
const pageHeight = computed(() => (kind.value === 'page' ? normalizeCanvas(props.item.canvas).height : 0));
const pageHtml = computed(() => (kind.value === 'page' && seen.value ? renderCanvasHtml(props.item.canvas) : ''));
const pageVisibleHeight = computed(() => Math.min(pageHeight.value, CANVAS_WIDTH * TALL_RATIO));
const pageScale = computed(() => {
  const { w, h } = box.value;
  if (kind.value !== 'page') return 0;
  if (props.fit === 'width') return w / CANVAS_WIDTH;
  if (props.fit === 'height') return h / pageVisibleHeight.value;
  return Math.min(w / CANVAS_WIDTH, h / pageVisibleHeight.value);
});
const pageBoxStyle = computed(() => ({
  width: `${Math.round(CANVAS_WIDTH * pageScale.value)}px`,
  height: `${Math.round(pageVisibleHeight.value * pageScale.value)}px`,
}));

// ---------- 舊 PDF 沒有封面：捲到才畫第一頁 ----------
async function loadPdfCover() {
  if (kind.value !== 'pdf' || !seen.value || src.value || pdfPending.value || !props.item.downloadURL) return;
  const url = props.item.downloadURL;
  pdfPending.value = true;
  try {
    const cover = await getRemotePdfCover(url);
    if (url === props.item.downloadURL) localCover.value = cover.url;
  } catch (err) {
    console.warn('PDF 縮圖載入失敗：', err);
  } finally {
    pdfPending.value = false;
  }
}
watch(() => props.item.downloadURL, () => { localCover.value = ''; });
watch([seen, src, () => props.item.downloadURL], loadPdfCover);

let resizeObserver = null;
let viewObserver = null;
onMounted(() => {
  resizeObserver = new ResizeObserver(([entry]) => {
    box.value = { w: entry.contentRect.width, h: entry.contentRect.height };
  });
  resizeObserver.observe(rootRef.value);
  viewObserver = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    seen.value = true;
    viewObserver.disconnect();
  }, { rootMargin: '300px' });
  viewObserver.observe(rootRef.value);
});
onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  viewObserver?.disconnect();
});
</script>

<style scoped>
.amt { min-width: 0; }
.amt-paper {
  flex-shrink: 0;
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.14), 0 2px 8px rgba(0, 0, 0, 0.12);
}
.amt-img { display: block; user-select: none; -webkit-user-drag: none; }
.amt-page { position: relative; overflow: hidden; pointer-events: none; }
.amt-page-stage { position: absolute; top: 0; left: 0; transform-origin: 0 0; }
.amt-placeholder { display: grid; place-content: center; color: #b0b0b6; }

/* 置中放進父層 */
.amt--contain {
  position: absolute;
  inset: var(--amt-pad, 12px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.amt--contain .amt-img { max-width: 100%; max-height: 100%; }
.amt--contain.is-tall .amt-img { height: 100%; max-width: 100%; aspect-ratio: 4 / 7; object-fit: cover; object-position: top; }
.amt--contain .amt-placeholder { height: 100%; aspect-ratio: 210 / 297; max-width: 100%; }

/* 撐滿寬度，高度依比例 */
.amt--width { width: 100%; }
.amt--width .amt-img { width: 100%; height: auto; }
.amt--width.is-tall .amt-img { aspect-ratio: 4 / 7; object-fit: cover; object-position: top; }
.amt--width .amt-placeholder { width: 100%; aspect-ratio: 210 / 297; }

/* 撐滿高度，寬度依比例 */
.amt--height { height: 100%; }
.amt--height .amt-img { height: 100%; width: auto; }
.amt--height.is-tall .amt-img { aspect-ratio: 4 / 7; object-fit: cover; object-position: top; }
.amt--height .amt-placeholder { height: 100%; aspect-ratio: 210 / 297; }
</style>
