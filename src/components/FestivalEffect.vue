<!-- src/components/FestivalEffect.vue -->
<!-- ✅ 節日畫面特效覆蓋層（Login / Home 掛載）：
     - 日期判斷：src/utils/festivals.js（節日設定檔，含維護說明）
     - 特效實作：src/utils/festivalEffects.js（EFFECTS 註冊表）
     - 完全不干擾操作：pointer-events: none、z-index 低於選單與 dialog
     - 可點擊的特效（hitTest／tap）在 window 監聽，點在按鈕、輸入框等可操作元素上不觸發
     - 尊重 prefers-reduced-motion：只畫靜態畫面、不跑動畫、不啟用點擊互動
     - 測試：網址加 ?festival=<id>；停用：localStorage anxi-festival-off = '1' -->
<template>
  <canvas v-if="active" ref="canvasRef" class="festival-canvas" aria-hidden="true" />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { getActiveFestival } from '@/utils/festivals';
import { EFFECTS } from '@/utils/festivalEffects';

const canvasRef = ref(null);
const active = ref(false);

let effect = null;
let ctx = null;
let rafId = 0;
let startTs = 0;
let lastDrawTs = 0;
let reducedMotion = false;
let cssW = 0;
let cssH = 0;

const setupCanvas = () => {
  const canvas = canvasRef.value;
  if (!canvas) return false;
  const dpr = Math.min(window.devicePixelRatio || 1, 2); // 上限 2，控制效能
  cssW = window.innerWidth;
  cssH = window.innerHeight;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return true;
};

const renderStatic = () => {
  if (!ctx || !effect) return;
  ctx.clearRect(0, 0, cssW, cssH);
  effect.drawStatic(ctx, cssW, cssH);
};

const frame = (ts) => {
  if (!ctx || !effect) return;
  if (!startTs) startTs = ts;
  // 特效有指定 fps 上限時跳過多餘的幀（高更新率螢幕不必每幀重畫）
  if (effect.fps && lastDrawTs && ts - lastDrawTs < 1000 / effect.fps - 2) {
    rafId = requestAnimationFrame(frame);
    return;
  }
  lastDrawTs = ts;
  ctx.clearRect(0, 0, cssW, cssH);
  effect.draw(ctx, ts - startTs, cssW, cssH);
  rafId = requestAnimationFrame(frame);
};

// 可點擊特效：canvas 仍不攔截事件，改在 window 監聽，再由特效判斷是否點中圖案。
// 點在可操作元素上一律交給原本的元素處理，不觸發特效
const INTERACTIVE = 'a, button, input, textarea, select, label, summary, [role="button"], [role="link"], '
  + '[role="tab"], [role="menuitem"], [contenteditable="true"], .v-overlay__content, .v-list-item--link, '
  + '.v-card--link, .v-chip--link';
const isInteractive = (el) => !!el?.closest?.(INTERACTIVE);

let hovering = false;
const setHover = (on) => {
  if (on === hovering) return;
  hovering = on;
  document.documentElement.style.cursor = on ? 'pointer' : '';
};

const onClick = (e) => {
  if (!effect?.tap || isInteractive(e.target)) return;
  effect.tap(e.clientX, e.clientY);
  // 點完立刻重新判斷游標（例如月亮效果進行中暫時不能再點）
  if (hovering) setHover(!!effect.hitTest?.(e.clientX, e.clientY));
};

// 桌機滑鼠移到可點的圖案上時游標變手指
const onPointerMove = (e) => {
  if (e.pointerType !== 'mouse' || !effect?.hitTest) return;
  setHover(!isInteractive(e.target) && effect.hitTest(e.clientX, e.clientY));
};

const onResize = () => {
  if (!setupCanvas()) return;
  lastDrawTs = 0; // 改尺寸會清空畫布，下一幀立刻重畫
  effect?.resize(cssW, cssH);
  if (reducedMotion) renderStatic();
};

const teardown = () => {
  cancelAnimationFrame(rafId);
  rafId = 0;
  startTs = 0;
  lastDrawTs = 0;
  window.removeEventListener('resize', onResize);
  window.removeEventListener('click', onClick, true);
  window.removeEventListener('pointermove', onPointerMove);
  setHover(false);
  effect = null;
  ctx = null;
  active.value = false;
};

// 重新判斷是否顯示特效（掛載時 + hash 路由網址變更時，
// 方便直接在網址列加 ?festival=<id> 預覽而不用重新整理）
const evaluate = () => {
  teardown();
  const festival = getActiveFestival();
  const factory = festival && EFFECTS[festival.effect];
  if (!factory) return;

  active.value = true;
  // v-if 剛切換，等 DOM 出現 canvas
  requestAnimationFrame(() => {
    if (!setupCanvas()) return;
    effect = factory(cssW, cssH);
    window.addEventListener('resize', onResize);
    if (reducedMotion) {
      renderStatic();
      return;
    }
    rafId = requestAnimationFrame(frame);
    if (effect.tap) {
      // capture：子元件 stopPropagation 也收得到；只讀座標、不阻止預設行為
      window.addEventListener('click', onClick, true);
      window.addEventListener('pointermove', onPointerMove, { passive: true });
    }
  });
};

onMounted(() => {
  reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
  evaluate();
  window.addEventListener('hashchange', evaluate);
});

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', evaluate);
  teardown();
});
</script>

<style scoped>
.festival-canvas {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none; /* 絕不攔截點擊與捲動 */
  z-index: 2;           /* 高於頁面背景、低於漢堡鈕(1500)/抽屜/對話框 */
}
</style>
