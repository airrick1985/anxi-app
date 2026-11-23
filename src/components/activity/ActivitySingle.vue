<template>
  <div class="amv-view">
    <header class="amv-bar">
      <button v-if="backLabel" type="button" class="mac-btn" @click="$emit('back')">
        <v-icon size="18" class="ams-back-icon">mdi-chevron-left</v-icon>{{ backLabel }}
      </button>
      <button
        v-if="!compact && items.length > 1"
        type="button"
        class="amv-tool"
        :class="{ 'is-on': sidebarOpen }"
        title="縮圖列"
        aria-label="縮圖列"
        @click="$emit('update:sidebarOpen', !sidebarOpen)"
      >
        <v-icon size="19">mdi-dock-left</v-icon>
      </button>
      <span v-if="items.length > 1" class="ams-counter">{{ index + 1 }} / {{ items.length }}</span>
      <span v-if="manageContext && item?.hidden" class="mac-tag"><v-icon size="13">mdi-eye-off</v-icon>已隱藏</span>
      <span class="amv-spacer"></span>

      <div v-if="!compact" class="ams-zoom">
        <button type="button" class="amv-tool" title="縮小" aria-label="縮小" @click="zoomBy(1 / 1.25)"><v-icon size="18">mdi-minus</v-icon></button>
        <button type="button" class="ams-zoom-value" title="符合視窗" @click="resetZoom">{{ Math.round(zoom * 100) }}%</button>
        <button type="button" class="amv-tool" title="放大" aria-label="放大" @click="zoomBy(1.25)"><v-icon size="18">mdi-plus</v-icon></button>
      </div>
      <a
        v-if="kind === 'pdf'"
        class="amv-tool"
        :href="item.downloadURL"
        target="_blank"
        rel="noopener"
        title="在新分頁開啟"
        aria-label="在新分頁開啟"
      ><v-icon size="19">mdi-open-in-new</v-icon></a>
      <button type="button" class="amv-tool" title="列印" aria-label="列印" :disabled="printing" @click="print">
        <v-progress-circular v-if="printing" indeterminate size="16" width="2" />
        <v-icon v-else size="19">mdi-printer-outline</v-icon>
      </button>
      <button
        v-if="canManage && !manageContext"
        type="button"
        class="amv-tool"
        title="管理"
        aria-label="管理"
        @click="$emit('manage', item?.id)"
      ><v-icon size="19">mdi-square-edit-outline</v-icon></button>
      <button type="button" class="amv-tool" title="關閉" aria-label="關閉" @click="$emit('close')">
        <v-icon size="20">mdi-close</v-icon>
      </button>
    </header>

    <div class="ams-body">
      <!-- 左側縮圖列（桌機／平板） -->
      <aside v-if="showSidebar" class="ams-side" :style="{ width: `${sidebarWidth}px` }">
        <div ref="stripRef" class="ams-side-list">
          <button
            v-for="it in items"
            :key="it.id"
            type="button"
            class="ams-side-item"
            :class="{ 'is-active': it.id === item?.id, 'is-hidden': it.hidden }"
            :data-id="it.id"
            @click="go(it.id)"
          >
            <span class="ams-side-thumb"><ActivityThumb :item="it" fit="width" /></span>
            <span v-if="activityPublicName(it)" class="ams-side-name">{{ activityPublicName(it) }}</span>
          </button>
        </div>
        <div
          class="ams-side-resizer"
          title="拖曳調整寬度"
          @pointerdown.prevent="startResize"
          @dblclick="$emit('update:sidebarWidth', SIDEBAR_DEFAULT)"
        ></div>
      </aside>

      <div class="ams-main">
        <div
          ref="stageRef"
          class="ams-stage"
          @wheel="onWheel"
          @touchstart.passive="onSwipeStart"
          @touchmove.passive="onSwipeMove"
          @touchend.passive="onSwipeEnd"
          @touchcancel.passive="onSwipeEnd"
        >
          <div class="ams-slide" :class="{ 'is-swiping': swiping }" :style="slideStyle">
            <template v-if="item">
              <ActivityCanvasView
                v-if="kind === 'page'"
                :key="item.id"
                v-model:zoom="softZoom"
                class="ams-fill ams-page"
                :style="touchStyle"
                :canvas="item.canvas || {}"
              />
              <ActivityPdfPages
                v-else-if="kind === 'pdf'"
                :key="`${item.id}_${item.downloadURL}`"
                v-model:zoom="softZoom"
                class="ams-fill"
                :style="touchStyle"
                :url="item.downloadURL"
                @page="pdfPage = $event"
              />
              <div v-else ref="panRef" class="ams-pan" @dblclick="toggleZoom">
                <img
                  :key="`${item.id}_${item.downloadURL}`"
                  class="ams-image"
                  :class="{ 'is-ready': imageSize.w > 0 }"
                  :style="imageStyle"
                  :src="item.downloadURL"
                  :alt="item.title || ''"
                  draggable="false"
                  @load="onImageLoad"
                  @error="imageFailed = true"
                />
              </div>
            </template>
          </div>

          <div v-if="kind === 'image' && !imageSize.w" class="ams-loading">
            <span v-if="imageFailed">圖片載入失敗</span>
            <v-progress-circular v-else indeterminate size="28" width="3" color="#8e8e93" />
          </div>
          <div v-if="kind === 'pdf' && pdfPage.total > 1" class="ams-page-pill">第 {{ pdfPage.current }} / {{ pdfPage.total }} 頁</div>

          <template v-if="items.length > 1">
            <button type="button" class="ams-nav ams-nav--prev" title="上一張" aria-label="上一張" @click="step(-1)"><v-icon size="26">mdi-chevron-left</v-icon></button>
            <button type="button" class="ams-nav ams-nav--next" title="下一張" aria-label="下一張" @click="step(1)"><v-icon size="26">mdi-chevron-right</v-icon></button>
          </template>
        </div>

        <!-- 標題與說明：放在內容下方不遮住；說明超過兩行可展開 -->
        <div v-if="item && (item.title || item.description)" class="ams-caption" :class="{ 'is-expanded': captionExpanded }">
          <div v-if="item.title" class="ams-caption-title">{{ item.title }}</div>
          <div v-if="item.description" ref="captionRef" class="ams-caption-desc">{{ item.description }}</div>
          <button v-if="captionOverflow || captionExpanded" type="button" class="mac-link-btn ams-caption-more" @click="captionExpanded = !captionExpanded">
            {{ captionExpanded ? '收合' : '更多' }}
          </button>
        </div>

        <!-- 手機：底部縮圖 -->
        <div v-if="compact && items.length > 1" ref="stripRef" class="ams-strip">
          <button
            v-for="it in items"
            :key="it.id"
            type="button"
            class="ams-strip-item"
            :class="{ 'is-active': it.id === item?.id, 'is-hidden': it.hidden }"
            :data-id="it.id"
            :aria-label="activityPublicName(it) || '活動訊息'"
            @click="go(it.id)"
          >
            <ActivityThumb :item="it" fit="height" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 活動訊息單張瀏覽：左側縮圖列（手機為底部）、縮放、左右滑動換張、列印
 * 圖片縮放用 panzoom；PDF 與自建頁面用 softZoom（乘在「符合視窗」之上）
 */
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useToast } from 'vue-toastification';
import ActivityThumb from './ActivityThumb.vue';
import ActivityPdfPages from './ActivityPdfPages.vue';
import ActivityCanvasView from '@/components/ActivityCanvasView.vue';
import { activityKind, activityPublicName } from '@/utils/activityMessage';
import { printActivity } from '@/utils/activityPrint';

const props = defineProps({
  items: { type: Array, required: true },
  currentId: { type: String, default: '' },
  backLabel: { type: String, default: '' },
  canManage: { type: Boolean, default: false },
  // 從管理模式開啟（顯示隱藏狀態、不再出現管理鈕）
  manageContext: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
  sidebarOpen: { type: Boolean, default: true },
  sidebarWidth: { type: Number, default: 200 },
  // 有子視窗開著時不處理快速鍵
  keysDisabled: { type: Boolean, default: false },
});
const emit = defineEmits(['update:currentId', 'update:sidebarOpen', 'update:sidebarWidth', 'back', 'manage', 'close']);

const toast = useToast();

const SIDEBAR_DEFAULT = 200;
const SIDEBAR_MIN = 130;
const SIDEBAR_MAX = 380;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;
const IMAGE_ZOOM_MAX = 6;

const index = computed(() => Math.max(0, props.items.findIndex(i => i.id === props.currentId)));
const item = computed(() => props.items[index.value] || null);
const kind = computed(() => (item.value ? activityKind(item.value) : ''));
const showSidebar = computed(() => !props.compact && props.sidebarOpen && props.items.length > 1);

// ---------- 換張 ----------
function go(id) {
  if (id !== props.currentId) emit('update:currentId', id);
}
function step(delta) {
  const len = props.items.length;
  if (len > 1) go(props.items[(index.value + delta + len) % len].id);
}

const stripRef = ref(null);
function revealActive(behavior) {
  nextTick(() => {
    const el = [...(stripRef.value?.children || [])].find(c => c.dataset.id === item.value?.id);
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior });
  });
}

// 前後各預載一張圖，換張不用等
function preloadNeighbors() {
  const len = props.items.length;
  if (len < 2) return;
  [1, -1].forEach((d) => {
    const it = props.items[(index.value + d + len) % len];
    if (activityKind(it) === 'image') new Image().src = it.downloadURL;
  });
}

// 用多來源比對：每次快照都會換新物件，但內容沒變時不可重設縮放
watch([() => item.value?.id, () => item.value?.downloadURL], () => {
  destroyPanzoom();
  imageSize.value = { w: 0, h: 0 };
  imageFailed.value = false;
  softZoom.value = 1;
  pdfPage.value = { current: 1, total: 0 };
});
watch(() => item.value?.id, () => {
  revealActive('smooth');
  preloadNeighbors();
});
watch(showSidebar, on => { if (on) revealActive('auto'); });

// ---------- 縮放 ----------
const stageRef = ref(null);
const panRef = ref(null);
const softZoom = ref(1);
const imageZoom = ref(1);
const pdfPage = ref({ current: 1, total: 0 });
const imageSize = ref({ w: 0, h: 0 });
const imageFailed = ref(false);
const stageBox = ref({ w: 0, h: 0 });
const zoom = computed(() => (kind.value === 'image' ? imageZoom.value : softZoom.value));

let panzoom = null;
let panTarget = null;
let PanzoomCtor = null;

// 圖片符合視窗（小圖放大，最多 3 倍）
const imageStyle = computed(() => {
  const { w, h } = imageSize.value;
  if (!w || !h) return {};
  const pad = props.compact ? 10 : 24;
  const k = Math.min(3, (stageBox.value.w - pad * 2) / w, (stageBox.value.h - pad * 2) / h);
  return { width: `${Math.max(1, Math.round(w * k))}px`, height: `${Math.max(1, Math.round(h * k))}px` };
});

function onPanzoomChange(e) {
  imageZoom.value = e.detail.scale;
  // 放大後才允許拖移
  panzoom?.setOptions({ disablePan: e.detail.scale <= 1.01 });
}

async function initPanzoom() {
  if (!PanzoomCtor) PanzoomCtor = (await import('@panzoom/panzoom')).default;
  await nextTick();
  destroyPanzoom();
  if (!panRef.value) return;
  // 套用在鋪滿舞台的外層而非圖片本身：外層貼齊舞台左上角，滾輪縮放的焦點才會跟著滑鼠
  panTarget = panRef.value;
  panzoom = PanzoomCtor(panTarget, {
    maxScale: IMAGE_ZOOM_MAX,
    minScale: 1,
    step: 0.5,
    cursor: 'default',
    startScale: 1,
    animate: true,
    disablePan: true,
  });
  panTarget.addEventListener('panzoomchange', onPanzoomChange);
}

function destroyPanzoom() {
  imageZoom.value = 1;
  if (!panzoom) return;
  panTarget?.removeEventListener('panzoomchange', onPanzoomChange);
  panzoom.reset({ animate: false });
  panzoom.destroy();
  panzoom = null;
}

function onImageLoad(e) {
  imageSize.value = { w: e.target.naturalWidth, h: e.target.naturalHeight };
  initPanzoom();
}

function setSoftZoom(next) {
  softZoom.value = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next));
}
function zoomBy(k) {
  if (kind.value !== 'image') setSoftZoom(softZoom.value * k);
  else if (k > 1) panzoom?.zoomIn();
  else panzoom?.zoomOut();
}
function resetZoom() {
  if (kind.value === 'image') panzoom?.reset();
  else softZoom.value = 1;
}
function toggleZoom() {
  if (!panzoom) return;
  if (imageZoom.value > 1.05) panzoom.reset();
  else panzoom.zoom(2.5, { animate: true });
}
// 圖片：滾輪縮放；PDF／頁面：滾輪捲動，觸控板捏合（ctrl＋滾輪）縮放
function onWheel(e) {
  if (kind.value === 'image') {
    e.preventDefault();
    panzoom?.zoomWithWheel(e);
  } else if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    setSoftZoom(softZoom.value * Math.exp(-e.deltaY / 200));
  }
}

// ---------- 左右滑動換張（未放大時） ----------
const swipeX = ref(0);
const swiping = ref(false);
let swipe = null;
const slideStyle = computed(() => ({
  transform: swipeX.value ? `translateX(${swipeX.value}px)` : 'none',
}));
// 未放大時橫向手勢留給換張；縮放一律由元件處理
const touchStyle = computed(() => ({ touchAction: zoom.value > 1.01 ? 'pan-x pan-y' : 'pan-y' }));
function onSwipeStart(e) {
  if (e.touches.length !== 1 || zoom.value > 1.01 || props.items.length < 2) { swipe = null; return; }
  swipe = { x: e.touches[0].clientX, y: e.touches[0].clientY, active: false };
}
function onSwipeMove(e) {
  if (!swipe) return;
  if (e.touches.length !== 1 || zoom.value > 1.01) { cancelSwipe(); return; }
  const dx = e.touches[0].clientX - swipe.x;
  const dy = e.touches[0].clientY - swipe.y;
  if (!swipe.active) {
    if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { swipe = null; return; }
    if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    swipe.active = true;
    swiping.value = true;
  }
  swipeX.value = dx;
}
function onSwipeEnd() {
  const dx = swipeX.value;
  cancelSwipe();
  if (Math.abs(dx) > 60) step(dx < 0 ? 1 : -1);
}
function cancelSwipe() {
  swipe = null;
  swiping.value = false;
  swipeX.value = 0;
}

// ---------- 縮圖列寬度 ----------
function startResize(e) {
  const startX = e.clientX;
  const startW = props.sidebarWidth;
  const move = (ev) => {
    const w = Math.round(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startW + ev.clientX - startX)));
    emit('update:sidebarWidth', w);
  };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    document.body.style.cursor = '';
  };
  document.body.style.cursor = 'col-resize';
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
}

// ---------- 標題與說明 ----------
const captionRef = ref(null);
const captionExpanded = ref(false);
const captionOverflow = ref(false);
function measureCaption() {
  nextTick(() => {
    if (captionExpanded.value) return;
    const el = captionRef.value;
    captionOverflow.value = !!el && el.scrollHeight > el.clientHeight + 1;
  });
}
watch([() => item.value?.id, () => item.value?.description], () => {
  captionExpanded.value = false;
  measureCaption();
});

// ---------- 列印 ----------
const printing = ref(false);
async function print() {
  const target = item.value;
  if (!target || printing.value) return;
  printing.value = true;
  try {
    await printActivity(target);
  } catch (err) {
    if (activityKind(target) === 'page') {
      toast.error(`列印失敗：${err.message}`);
    } else {
      // 退路：開新分頁，用瀏覽器內建檢視器列印
      toast.warning(`${err.message}，已改為另開分頁，請於該分頁列印。`, { timeout: 4000 });
      window.open(target.downloadURL, '_blank', 'noopener');
    }
  } finally {
    printing.value = false;
  }
}

// ---------- 快速鍵 ----------
function isTyping(e) {
  const t = e.target;
  return !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
}
function onKeydown(e) {
  if (props.keysDisabled) return;
  // 原生 Ctrl/Cmd+P 會把整個介面印出來，攔下來只印目前這則
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
    e.preventDefault();
    print();
    return;
  }
  if (isTyping(e) || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'ArrowLeft') step(-1);
  else if (e.key === 'ArrowRight') step(1);
  else if (e.key === '+' || e.key === '=') zoomBy(1.25);
  else if (e.key === '-' || e.key === '_') zoomBy(1 / 1.25);
  else if (e.key === '0') resetZoom();
  else if (e.key === ' ' && props.manageContext) emit('back');
  else return;
  e.preventDefault();
}

let resizeObserver = null;
onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    stageBox.value = { w: stageRef.value.clientWidth, h: stageRef.value.clientHeight };
    measureCaption();
  });
  resizeObserver.observe(stageRef.value);
  document.addEventListener('keydown', onKeydown);
  revealActive('auto');
  preloadNeighbors();
  measureCaption();
});
onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  document.removeEventListener('keydown', onKeydown);
  destroyPanzoom();
});
</script>

<style scoped>
.ams-back-icon { margin-left: -5px; margin-right: -3px; }
.ams-counter { font-size: 13px; font-weight: 500; color: #6e6e73; white-space: nowrap; font-variant-numeric: tabular-nums; }
.ams-zoom { display: inline-flex; align-items: center; padding: 0 2px; border-radius: 8px; background: rgba(0, 0, 0, 0.05); }
.ams-zoom-value {
  min-width: 52px;
  height: 28px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #1d1d1f;
  font: 500 12.5px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
}
.ams-zoom-value:hover { background: rgba(0, 0, 0, 0.06); }

.ams-body { display: flex; flex: 1 1 auto; min-height: 0; }
.ams-main { display: flex; flex-direction: column; flex: 1 1 auto; min-width: 0; }

/* 左側縮圖列 */
.ams-side { position: relative; flex-shrink: 0; background: #f6f6f8; border-right: 1px solid var(--amv-line); }
.ams-side-list {
  height: 100%;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  scrollbar-width: thin;
}
.ams-side-item {
  flex-shrink: 0;
  display: block;
  padding: 10px 10px 8px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #1d1d1f;
  font: inherit;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.12s;
}
.ams-side-item:hover { background: rgba(0, 0, 0, 0.05); }
.ams-side-item.is-active { background: rgba(0, 113, 227, 0.12); }
.ams-side-item.is-active :deep(.amt-paper) { box-shadow: 0 0 0 3px #0071e3; }
.ams-side-item.is-active .ams-side-name { color: #0058b0; font-weight: 600; }
.ams-side-item:focus-visible { outline: 2px solid rgba(0, 113, 227, 0.45); outline-offset: 1px; }
.ams-side-thumb { display: block; }
.ams-side-name { display: block; margin-top: 7px; font-size: 12.5px; font-weight: 500; line-height: 1.4; overflow-wrap: anywhere; }
.is-hidden .ams-side-thumb,
.ams-strip-item.is-hidden { opacity: 0.45; }
.ams-side-resizer { position: absolute; top: 0; right: -4px; bottom: 0; width: 8px; z-index: 2; cursor: col-resize; touch-action: none; }
.ams-side-resizer:hover { background: linear-gradient(90deg, transparent 3px, rgba(0, 113, 227, 0.5) 3px, rgba(0, 113, 227, 0.5) 5px, transparent 5px); }

/* 舞台 */
.ams-stage { position: relative; flex: 1 1 auto; min-height: 0; overflow: hidden; background: #e8e8ec; }
.ams-slide { position: absolute; inset: 0; transition: transform 0.2s ease; }
.ams-slide.is-swiping { transition: none; }
.ams-fill { position: absolute; inset: 0; }
.ams-page { padding: 24px; }
.ams-pan { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; touch-action: none; }
.ams-image {
  display: block;
  max-width: none;
  opacity: 0;
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.1), 0 6px 24px rgba(0, 0, 0, 0.16);
  user-select: none;
  -webkit-user-drag: none;
  -webkit-touch-callout: none;
}
.ams-image.is-ready { opacity: 1; }
.ams-loading { position: absolute; inset: 0; display: grid; place-content: center; color: #6e6e73; font-size: 14px; pointer-events: none; }
.ams-page-pill {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 12px;
  border-radius: 14px;
  background: rgba(29, 29, 31, 0.68);
  color: #fff;
  font-size: 12.5px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
}
.ams-nav {
  position: absolute;
  top: 50%;
  display: grid;
  place-content: center;
  width: 40px;
  height: 40px;
  margin-top: -20px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.82);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  color: #1d1d1f;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.12), 0 2px 10px rgba(0, 0, 0, 0.16);
  cursor: pointer;
  opacity: 0.55;
  transition: opacity 0.15s;
}
.ams-stage:hover .ams-nav { opacity: 0.9; }
.ams-nav:hover { opacity: 1 !important; background: #fff; }
.ams-nav--prev { left: 14px; }
.ams-nav--next { right: 14px; }

/* 標題與說明 */
.ams-caption { flex-shrink: 0; padding: 10px 20px 12px; background: #fff; border-top: 1px solid var(--amv-line); text-align: center; }
.ams-caption-title { font-size: 15.5px; font-weight: 600; line-height: 1.45; overflow-wrap: anywhere; }
.ams-caption-desc {
  max-width: 860px;
  margin: 2px auto 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 13.5px;
  line-height: 1.6;
  color: #48484a;
  white-space: pre-line;
  overflow-wrap: anywhere;
}
.is-expanded .ams-caption-desc { display: block; max-height: 38vh; overflow-y: auto; }
.ams-caption-more { margin-top: 2px; }

/* 手機底部縮圖 */
.ams-strip {
  flex-shrink: 0;
  display: flex;
  gap: 8px;
  padding: 8px 12px calc(8px + env(safe-area-inset-bottom, 0px));
  background: #f6f6f8;
  border-top: 1px solid var(--amv-line);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.ams-strip::-webkit-scrollbar { display: none; }
.ams-strip-item { flex-shrink: 0; height: 72px; padding: 3px; border: 0; border-radius: 7px; background: transparent; }
.ams-strip-item.is-active { box-shadow: 0 0 0 2.5px #0071e3; }

@media (hover: none) {
  /* 觸控裝置用滑動換張 */
  .ams-nav { display: none; }
}
@media (max-width: 767.98px) {
  .ams-page { padding: 10px; }
  .ams-caption { padding: 8px 14px 10px; }
  .ams-caption-title { font-size: 15px; }
}
</style>
