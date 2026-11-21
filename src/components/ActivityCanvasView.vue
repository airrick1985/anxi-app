<template>
  <div
    ref="wrapRef"
    class="acv"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
  >
    <div class="acv-sizer" :style="sizerStyle">
      <div class="acv-stage" :style="{ transform: `scale(${scale})` }" v-html="html"></div>
    </div>
  </div>
</template>

<script setup>
/**
 * 活動訊息自建頁面（自由畫布）閱讀元件
 * - 寬 800 的畫布等比縮放到整頁放得進容器（寬、高皆符合，最大 1 倍），zoom 再乘上去；超出容器時可捲動
 * - 支援雙指縮放（回傳 update:zoom）
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { renderCanvasHtml, normalizeCanvas, CANVAS_WIDTH } from '@/utils/activityCanvas';
import '@/styles/activityPageContent.css';

const props = defineProps({
  canvas: { type: Object, required: true },
  zoom: { type: Number, default: 1 },
});
const emit = defineEmits(['update:zoom']);

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;

const wrapRef = ref(null);
// 容器扣除內距後的可用寬高
const availWidth = ref(0);
const availHeight = ref(0);

const height = computed(() => normalizeCanvas(props.canvas).height);
const html = computed(() => renderCanvasHtml(props.canvas));
// 預設整頁縮進視窗（寬、高都放得下，最大 1 倍）
const fit = computed(() => {
  if (availWidth.value <= 0 || availHeight.value <= 0) return 1;
  return Math.min(1, availWidth.value / CANVAS_WIDTH, availHeight.value / height.value);
});
const scale = computed(() => fit.value * props.zoom);
const sizerStyle = computed(() => ({
  width: `${Math.floor(CANVAS_WIDTH * scale.value)}px`,
  height: `${Math.floor(height.value * scale.value)}px`,
}));

function measure() {
  const el = wrapRef.value;
  if (!el) return;
  const cs = getComputedStyle(el);
  const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
  const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
  availWidth.value = el.clientWidth - padX;
  availHeight.value = el.clientHeight - padY;
}

let observer = null;
onMounted(() => {
  observer = new ResizeObserver(measure);
  if (wrapRef.value) observer.observe(wrapRef.value);
});
onBeforeUnmount(() => observer?.disconnect());

// 雙指縮放
let pinch = null;
const touchDistance = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
function onTouchStart(e) {
  if (e.touches.length === 2) pinch = { dist: touchDistance(e.touches), zoom: props.zoom };
}
function onTouchMove(e) {
  if (!pinch || e.touches.length !== 2) return;
  e.preventDefault();
  const next = pinch.zoom * (touchDistance(e.touches) / pinch.dist);
  emit('update:zoom', Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next)));
}
function onTouchEnd(e) {
  if (e.touches.length < 2) pinch = null;
}
</script>

<style scoped>
.acv {
  overflow: auto;
  padding: 12px;
  -webkit-overflow-scrolling: touch;
}
.acv-sizer {
  position: relative;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 6px;
  box-shadow: 0 6px 28px rgba(0, 0, 0, 0.55);
}
.acv-stage {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
}
.acv-stage :deep(.ac-linked) { cursor: pointer; }
</style>
