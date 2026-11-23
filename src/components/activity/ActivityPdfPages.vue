<template>
  <div
    ref="scrollRef"
    class="apdf"
    @scroll.passive="updateCurrentPage"
    @touchstart.passive="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
  >
    <div v-if="failed" class="apdf-status">
      <v-icon size="40">mdi-file-alert-outline</v-icon>
      <span>PDF 載入失敗</span>
      <a class="mac-btn" :href="url" target="_blank" rel="noopener"><v-icon size="16">mdi-open-in-new</v-icon>在新分頁開啟</a>
    </div>
    <div v-else-if="!pages.length" class="apdf-status">
      <v-progress-circular indeterminate size="28" width="3" color="#8e8e93" />
    </div>
    <div
      v-for="p in pages"
      :key="p.no"
      :ref="el => setPageEl(p.no, el)"
      class="apdf-page"
      :data-page="p.no"
      :style="{ width: `${Math.round(p.width * scale)}px`, height: `${Math.round(p.height * scale)}px` }"
    ></div>
  </div>
</template>

<script setup>
/**
 * 活動訊息 PDF 瀏覽：連續捲動，捲到才畫該頁；zoom 乘在「符合視窗」之上，支援雙指縮放
 */
import { ref, shallowRef, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { fetchPdfBytes, openActivityPdf } from '@/utils/activityCover';

const props = defineProps({
  url: { type: String, required: true },
  zoom: { type: Number, default: 1 },
});
const emit = defineEmits(['update:zoom', 'page']);

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;
const PAD = 20; // 與樣式的內距一致
const PAD_COMPACT = 10;
// 直式文件在寬螢幕上至少放到這個寬度，文字才好讀（高度超出可捲動）
const READABLE_WIDTH = 820;
const MAX_CANVAS_PIXELS = 16000000; // iOS canvas 上限約 16.7M px

const scrollRef = ref(null);
const pages = shallowRef([]);
const failed = ref(false);
const box = ref({ w: 0, h: 0 });

const baseScale = computed(() => {
  const first = pages.value[0];
  const { w, h } = box.value;
  if (!first || w <= 0 || h <= 0) return 1;
  const pad = w < 600 ? PAD_COMPACT : PAD;
  const availW = Math.max(200, w - pad * 2);
  const wholePage = Math.max(200, h - pad * 2) * (first.width / first.height);
  return Math.min(availW, Math.max(wholePage, READABLE_WIDTH)) / first.width;
});
const scale = computed(() => baseScale.value * props.zoom);

let pdf = null;
let disposed = false;
const pageEls = new Map();
const rendered = new Map(); // 頁碼 → 已畫的倍率
const tasks = new Map();
let observer = null;

function setPageEl(no, el) {
  if (el) pageEls.set(no, el);
  else pageEls.delete(no);
}

async function load() {
  try {
    const bytes = await fetchPdfBytes(props.url);
    const doc = await openActivityPdf(bytes);
    if (disposed) { doc.destroy(); return; }
    pdf = doc;
    const list = [];
    for (let no = 1; no <= doc.numPages; no += 1) {
      const page = await doc.getPage(no);
      if (disposed) return;
      const vp = page.getViewport({ scale: 1 });
      list.push({ no, width: vp.width, height: vp.height });
    }
    pages.value = list;
    await nextTick();
    observer = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) renderPage(Number(en.target.dataset.page)); });
    }, { root: scrollRef.value, rootMargin: '500px 0px' });
    pageEls.forEach(el => observer.observe(el));
    updateCurrentPage();
  } catch (err) {
    console.warn('PDF 載入失敗：', err);
    if (!disposed) failed.value = true;
  }
}

async function renderPage(no) {
  const host = pageEls.get(no);
  if (!pdf || !host || rendered.get(no) === scale.value) return;
  const target = scale.value;
  rendered.set(no, target);
  tasks.get(no)?.cancel();
  try {
    const page = await pdf.getPage(no);
    if (disposed) return;
    const base = page.getViewport({ scale: 1 });
    let ratio = target * Math.min(window.devicePixelRatio || 1, 2);
    const pixels = base.width * base.height * ratio * ratio;
    if (pixels > MAX_CANVAS_PIXELS) ratio *= Math.sqrt(MAX_CANVAS_PIXELS / pixels);
    const viewport = page.getViewport({ scale: ratio });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const task = page.render({ canvasContext: canvas.getContext('2d'), viewport });
    tasks.set(no, task);
    await task.promise;
    // 畫好才換上，縮放時不閃白
    if (!disposed) host.replaceChildren(canvas);
  } catch (err) {
    if (rendered.get(no) === target) rendered.delete(no);
    if (err?.name !== 'RenderingCancelledException') console.warn('PDF 頁面繪製失敗：', err);
  }
}

function renderVisible() {
  const root = scrollRef.value?.getBoundingClientRect();
  if (!root) return;
  pageEls.forEach((el, no) => {
    const r = el.getBoundingClientRect();
    if (r.bottom > root.top - 500 && r.top < root.bottom + 500) renderPage(no);
  });
}

function updateCurrentPage() {
  const root = scrollRef.value?.getBoundingClientRect();
  if (!root || !pages.value.length) return;
  const middle = root.top + root.height / 2;
  let current = 1;
  pages.value.forEach(({ no }) => {
    const el = pageEls.get(no);
    if (el && el.getBoundingClientRect().top <= middle) current = no;
  });
  emit('page', { current, total: pages.value.length });
}

// 使用者縮放：維持畫面中心的內容位置；視窗大小改變：維持最上方的內容位置。停下來再重畫
let redrawTimer = null;
watch([scale, () => props.zoom], ([next, zoom], [prev, prevZoom]) => {
  const el = scrollRef.value;
  if (!el || !pages.value.length) return;
  const k = next / prev;
  const centered = zoom !== prevZoom;
  const offsetX = centered ? el.clientWidth / 2 : 0;
  const offsetY = centered ? el.clientHeight / 2 : 0;
  const x = (el.scrollLeft + offsetX) * k - offsetX;
  const y = el.scrollTop > 0 || centered ? (el.scrollTop + offsetY) * k - offsetY : 0;
  nextTick(() => {
    el.scrollLeft = x;
    el.scrollTop = y;
  });
  clearTimeout(redrawTimer);
  redrawTimer = setTimeout(renderVisible, 160);
});

// 雙指縮放
let pinch = null;
const distance = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
function onTouchStart(e) {
  if (e.touches.length === 2) pinch = { dist: distance(e.touches), zoom: props.zoom };
}
function onTouchMove(e) {
  if (!pinch || e.touches.length !== 2) return;
  e.preventDefault();
  const next = pinch.zoom * (distance(e.touches) / pinch.dist);
  emit('update:zoom', Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next)));
}
function onTouchEnd(e) {
  if (e.touches.length < 2) pinch = null;
}

let resizeObserver = null;
onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    box.value = { w: scrollRef.value.clientWidth, h: scrollRef.value.clientHeight };
  });
  resizeObserver.observe(scrollRef.value);
  load();
});
onBeforeUnmount(() => {
  disposed = true;
  clearTimeout(redrawTimer);
  resizeObserver?.disconnect();
  observer?.disconnect();
  tasks.forEach(t => t.cancel());
  pdf?.destroy();
});
</script>

<style scoped>
.apdf {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  overflow: auto;
  padding: 20px;
  -webkit-overflow-scrolling: touch;
}
@media (max-width: 599.98px) {
  .apdf { padding: 10px; gap: 10px; }
}
.apdf-page {
  flex-shrink: 0;
  background: #fff;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.12), 0 3px 14px rgba(0, 0, 0, 0.14);
}
.apdf-page :deep(canvas) { display: block; width: 100%; height: 100%; }
.apdf-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin: auto;
  color: #6e6e73;
  font-size: 14px;
}
</style>
