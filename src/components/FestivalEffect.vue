<!-- src/components/FestivalEffect.vue -->
<!-- ✅ 節日畫面特效覆蓋層（Login / Home 掛載）：
     - 日期判斷：src/utils/festivals.js（節日設定檔，含維護說明）
     - 特效實作：src/utils/festivalEffects.js（EFFECTS 註冊表）
     - 完全不干擾操作：pointer-events: none、z-index 低於選單與 dialog
     - 尊重 prefers-reduced-motion：只畫靜態畫面、不跑動畫
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
  ctx.clearRect(0, 0, cssW, cssH);
  effect.draw(ctx, ts - startTs, cssW, cssH);
  rafId = requestAnimationFrame(frame);
};

const onResize = () => {
  if (!setupCanvas()) return;
  effect?.resize(cssW, cssH);
  if (reducedMotion) renderStatic();
};

const teardown = () => {
  cancelAnimationFrame(rafId);
  rafId = 0;
  startTs = 0;
  window.removeEventListener('resize', onResize);
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
    if (reducedMotion) renderStatic();
    else rafId = requestAnimationFrame(frame);
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
