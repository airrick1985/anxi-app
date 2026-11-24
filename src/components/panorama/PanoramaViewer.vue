<template>
  <div ref="rootRef" class="pano" :class="{ 'is-dragging': dragging }">
    <canvas
      ref="canvasRef"
      class="pano-canvas"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @wheel.prevent="onWheel"
      @dblclick="onDblClick"
      @contextmenu.prevent
    ></canvas>
    <div v-if="status === 'loading'" class="pano-state">
      <v-progress-circular indeterminate size="28" width="2" color="white"></v-progress-circular>
    </div>
    <div v-else-if="status === 'error'" class="pano-state">
      <v-icon size="34">mdi-image-broken-variant</v-icon>
      <div class="pano-state-text">{{ errorText }}</div>
      <slot name="error"></slot>
    </div>
  </div>
</template>

<script setup>
// 全景檢視：拖曳旋轉（含慣性）、滾輪／雙指縮放、自動慢轉、陀螺儀
// 視角等高頻狀態不放進響應式資料，直接畫到 canvas
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { PanoramaRenderer, viewMatrix, deviceMatrix, matrixHeading, yawed } from '@/utils/panoramaRenderer';
import { PANORAMA_STRIP, sampleImageStats, stripGeometry } from '@/utils/panorama';

const props = defineProps({
  src: { type: String, default: '' },
  // 'sphere'（360° 環景）｜'strip'（長條全景）
  type: { type: String, default: 'sphere' },
  autoRotate: { type: Boolean, default: false },
});
const emit = defineEmits(['update:autoRotate', 'gyro-change', 'ready', 'error']);

const DEG = Math.PI / 180;
const FOV_DEFAULT = 100; // 沿畫面長邊的視角
const FOV_MIN = 25;
const FOV_MAX = 120;
const AUTO_SPEED = 6 * DEG; // 每秒
const MAX_PIXEL_RATIO = 2;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const rootRef = ref(null);
const canvasRef = ref(null);
const status = ref('loading');
const errorText = ref('');
const dragging = ref(false);

let renderer = null;
let resizeObserver = null;
let raf = 0;
let lastTime = 0;
let loadToken = 0;
let strip = null;
const size = { w: 1, h: 1 };
const view = { yaw: 0, pitch: 0, fov: FOV_DEFAULT };
const velocity = { yaw: 0, pitch: 0 };
let autoDir = 1;

// ── 視角 ──
function tans() {
  const t = Math.tan((view.fov * DEG) / 2);
  const aspect = size.w / size.h;
  return aspect >= 1 ? { x: t, y: t / aspect } : { x: t * aspect, y: t };
}

// 長條全景：視角不可超出圖片範圍
function fovRange() {
  if (!strip) return { min: FOV_MIN, max: FOV_MAX };
  const aspect = size.w / size.h;
  let limit = (strip.height / 2) * (aspect >= 1 ? aspect : 1);
  if (!strip.wraps) {
    const side = Math.tan(Math.min(strip.angle / 2, 1.3));
    limit = Math.min(limit, aspect >= 1 ? side : side / aspect);
  }
  const max = Math.min(FOV_MAX, (2 * Math.atan(limit)) / DEG);
  return { min: Math.min(FOV_MIN, max), max };
}

// 回傳是否碰到左右邊界（長條全景自動旋轉時折返）
function clampView() {
  const range = fovRange();
  view.fov = clamp(view.fov, range.min, range.max);
  const t = tans();
  let hitEdge = false;
  if (strip) {
    const pitchMax = Math.max(0, Math.atan(strip.height / 2) - Math.atan(t.y));
    view.pitch = clamp(view.pitch, -pitchMax, pitchMax);
    if (!strip.wraps) {
      const yawMax = Math.max(0, strip.angle / 2 - Math.atan(t.x));
      if (Math.abs(view.yaw) >= yawMax) hitEdge = true;
      view.yaw = clamp(view.yaw, -yawMax, yawMax);
    }
  } else {
    view.pitch = clamp(view.pitch, -Math.PI / 2, Math.PI / 2);
  }
  if (view.yaw > Math.PI) view.yaw -= Math.PI * 2;
  else if (view.yaw < -Math.PI) view.yaw += Math.PI * 2;
  return hitEdge;
}

function resetView() {
  view.yaw = 0;
  view.pitch = 0;
  view.fov = strip ? fovRange().max : FOV_DEFAULT;
  velocity.yaw = 0;
  velocity.pitch = 0;
  autoDir = 1;
  if (gyro.active) gyro.needsOffset = true;
  clampView();
  requestFrame();
}

function zoomBy(factor) {
  view.fov *= factor;
  clampView();
  requestFrame();
}

// ── 繪製 ──
function draw() {
  if (!renderer || status.value !== 'ready') return;
  let rot;
  if (gyro.active && gyro.matrix) {
    rot = yawed(gyro.matrix, gyro.offset);
    const heading = matrixHeading(rot);
    view.yaw = heading.yaw;
    view.pitch = heading.pitch;
    // 長條全景不能轉出圖片範圍，也不跟著手機傾斜
    if (strip) {
      clampView();
      rot = viewMatrix(view.yaw, view.pitch);
    }
  } else {
    rot = viewMatrix(view.yaw, view.pitch);
  }
  const t = tans();
  renderer.render(rot, t.x, t.y, strip);
}

function frame(now) {
  raf = 0;
  const dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 0;
  lastTime = now;
  let animating = false;

  if (!dragging.value && !pinch) {
    if (Math.abs(velocity.yaw) > 0.012 || Math.abs(velocity.pitch) > 0.012) {
      // 放開後的慣性
      if (gyro.active) gyro.offset += velocity.yaw * dt;
      else {
        view.yaw += velocity.yaw * dt;
        view.pitch += velocity.pitch * dt;
      }
      const decay = Math.exp(-dt * 5);
      velocity.yaw *= decay;
      velocity.pitch *= decay;
      animating = true;
    } else if (props.autoRotate && !gyro.active) {
      view.yaw += autoDir * AUTO_SPEED * dt;
      animating = true;
    }
  }
  if (gyro.active) animating = true;

  if (clampView() && props.autoRotate) autoDir = view.yaw > 0 ? -1 : 1;
  draw();
  if (animating) requestFrame();
  else lastTime = 0;
}

function requestFrame() {
  if (!raf) raf = requestAnimationFrame(frame);
}

watch(() => props.autoRotate, (on) => { if (on) requestFrame(); });

// ── 載入 ──
async function load() {
  const token = ++loadToken;
  status.value = 'loading';
  if (!props.src) return;
  try {
    if (!renderer) renderer = new PanoramaRenderer(canvasRef.value);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.src = props.src;
    await img.decode();
    if (token !== loadToken) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    strip = props.type === PANORAMA_STRIP ? stripGeometry(w, h, !!sampleImageStats(img, w, h)?.seamless) : null;
    renderer.setImage(img, { wrap: strip ? strip.wraps : true });
    status.value = 'ready';
    measure();
    resetView();
    emit('ready');
  } catch (e) {
    if (token !== loadToken) return;
    console.error('[PanoramaViewer] 載入失敗', e);
    errorText.value = renderer ? '全景圖載入失敗' : (e.message || '此瀏覽器不支援全景瀏覽');
    status.value = 'error';
    emit('error', e);
  }
}

function measure() {
  const el = rootRef.value;
  if (!el) return;
  size.w = Math.max(1, el.clientWidth);
  size.h = Math.max(1, el.clientHeight);
  renderer?.resize(size.w, size.h, Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
  clampView();
  requestFrame();
}

// ── 拖曳／雙指縮放 ──
const pointers = new Map();
let pinch = null;
let lastMove = 0;

function stopAutoRotate() {
  if (props.autoRotate) emit('update:autoRotate', false);
}

function pinchDistance() {
  const [a, b] = [...pointers.values()];
  return Math.hypot(a.x - b.x, a.y - b.y) || 1;
}

function onPointerDown(e) {
  if (status.value !== 'ready' || (e.pointerType === 'mouse' && e.button !== 0)) return;
  canvasRef.value.setPointerCapture?.(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  velocity.yaw = 0;
  velocity.pitch = 0;
  stopAutoRotate();
  if (pointers.size === 2) pinch = { distance: pinchDistance(), fov: view.fov };
  dragging.value = true;
  lastMove = performance.now();
}

function onPointerMove(e) {
  const point = pointers.get(e.pointerId);
  if (!point) return;
  const dx = e.clientX - point.x;
  const dy = e.clientY - point.y;
  point.x = e.clientX;
  point.y = e.clientY;

  if (pinch && pointers.size >= 2) {
    view.fov = (pinch.fov * pinch.distance) / pinchDistance();
    clampView();
    requestFrame();
    return;
  }
  // 畫面中心每像素對應的角度：拖多遠畫面就跟多遠
  const perPixel = (2 * tans().x) / size.w;
  const dYaw = -dx * perPixel;
  const dPitch = dy * perPixel;
  if (gyro.active) gyro.offset += dYaw;
  else {
    view.yaw += dYaw;
    view.pitch += dPitch;
  }
  const now = performance.now();
  const dt = Math.max(1, now - lastMove) / 1000;
  lastMove = now;
  velocity.yaw = velocity.yaw * 0.4 + (dYaw / dt) * 0.6;
  velocity.pitch = gyro.active ? 0 : velocity.pitch * 0.4 + (dPitch / dt) * 0.6;
  clampView();
  requestFrame();
}

function onPointerUp(e) {
  if (!pointers.delete(e.pointerId)) return;
  canvasRef.value.releasePointerCapture?.(e.pointerId);
  if (pointers.size < 2) pinch = null;
  if (pointers.size) {
    velocity.yaw = 0;
    velocity.pitch = 0;
    return;
  }
  dragging.value = false;
  // 停住一下才放開就不滑行
  if (performance.now() - lastMove > 90) {
    velocity.yaw = 0;
    velocity.pitch = 0;
  }
  requestFrame();
}

function onWheel(e) {
  if (status.value !== 'ready') return;
  stopAutoRotate();
  // 觸控板雙指開合會帶 ctrlKey，位移量較小
  zoomBy(Math.exp(e.deltaY * (e.ctrlKey ? 0.01 : 0.0012)));
}

function onDblClick() {
  if (status.value !== 'ready') return;
  const range = fovRange();
  const base = strip ? range.max : Math.min(FOV_DEFAULT, range.max);
  view.fov = view.fov < base * 0.75 ? base : base * 0.5;
  clampView();
  requestFrame();
}

// ── 陀螺儀 ──
const gyro = { active: false, matrix: null, offset: 0, needsOffset: false, timer: null };

function screenAngle() {
  return window.screen?.orientation?.angle ?? window.orientation ?? 0;
}

function onOrientation(e) {
  if (e.alpha == null && e.beta == null && e.gamma == null) return;
  gyro.matrix = deviceMatrix(e.alpha, e.beta, e.gamma, screenAngle());
  if (gyro.needsOffset) {
    // 開啟當下的畫面方向不跳動
    gyro.offset = view.yaw - matrixHeading(gyro.matrix).yaw;
    gyro.needsOffset = false;
  }
  requestFrame();
}

function stopGyro() {
  clearTimeout(gyro.timer);
  window.removeEventListener('deviceorientation', onOrientation);
  if (!gyro.active) return;
  gyro.active = false;
  gyro.matrix = null;
  emit('gyro-change', false);
}

/** 開關陀螺儀；需在使用者點擊的處理函式內呼叫（iPhone 要先同意）。失敗時回傳錯誤訊息 */
async function setGyro(on) {
  if (!on) {
    stopGyro();
    return '';
  }
  if (gyro.active) return '';
  const DeviceOrientation = window.DeviceOrientationEvent;
  if (!DeviceOrientation) return '此裝置不支援陀螺儀';
  if (typeof DeviceOrientation.requestPermission === 'function') {
    try {
      if ((await DeviceOrientation.requestPermission()) !== 'granted') return '未允許使用動作與方向';
    } catch (e) {
      return '未允許使用動作與方向';
    }
  }
  gyro.active = true;
  gyro.matrix = null;
  gyro.needsOffset = true;
  velocity.yaw = 0;
  velocity.pitch = 0;
  stopAutoRotate();
  window.addEventListener('deviceorientation', onOrientation);
  emit('gyro-change', true);
  return new Promise((resolve) => {
    // 沒有感測器的裝置不會送出事件
    gyro.timer = setTimeout(() => {
      if (gyro.active && !gyro.matrix) {
        stopGyro();
        resolve('此裝置不支援陀螺儀');
      } else resolve('');
    }, 1200);
  });
}

// ── 生命週期 ──
function onContextLost(e) {
  e.preventDefault();
  cancelAnimationFrame(raf);
  raf = 0;
}
function onContextRestored() {
  try {
    renderer?.restore();
    requestFrame();
  } catch (e) {
    errorText.value = '全景圖載入失敗';
    status.value = 'error';
  }
}

onMounted(() => {
  canvasRef.value.addEventListener('webglcontextlost', onContextLost);
  canvasRef.value.addEventListener('webglcontextrestored', onContextRestored);
  resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(rootRef.value);
  measure();
  watch(() => [props.src, props.type], load, { immediate: true });
});

onBeforeUnmount(() => {
  loadToken += 1;
  cancelAnimationFrame(raf);
  resizeObserver?.disconnect();
  stopGyro();
  canvasRef.value?.removeEventListener('webglcontextlost', onContextLost);
  canvasRef.value?.removeEventListener('webglcontextrestored', onContextRestored);
  renderer?.dispose();
  renderer = null;
});

defineExpose({ resetView, zoomBy, setGyro });
</script>

<style scoped>
.pano {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #121214;
  user-select: none;
  -webkit-user-select: none;
}
.pano-canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
  touch-action: none;
  outline: none;
}
.pano.is-dragging .pano-canvas { cursor: grabbing; }
.pano-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 14px;
  pointer-events: none;
}
.pano-state > :deep(*) { pointer-events: auto; }
.pano-state .v-icon { color: rgba(255, 255, 255, 0.6); }
</style>
