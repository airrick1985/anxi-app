<template>
  <v-bottom-sheet :model-value="modelValue" @update:model-value="setOpen">
    <v-card
      ref="cardRef"
      class="mobile-sheet"
      rounded="t-xl"
      :style="cardStyle"
      @touchstart.passive="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
    >
      <div class="mobile-sheet-handle"></div>
      <button type="button" class="mobile-sheet-close" aria-label="關閉" @click="setOpen(false)">
        <v-icon size="22">mdi-close</v-icon>
      </button>
      <div class="mobile-sheet-title">
        <v-icon v-if="icon" size="20" color="primary">{{ icon }}</v-icon>{{ title }}
      </div>
      <slot />
    </v-card>
  </v-bottom-sheet>
</template>

<script setup>
// 手機版底部功能面板共用外殼：把手 + 標題 + 右上 X 關閉鈕，
// 並支援「下滑關閉」手勢（內容捲到頂時往下拖曳，超過門檻即關閉，否則彈回）
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  icon: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue']);

function setOpen(val) { emit('update:modelValue', val); }

/* ---------- 下滑關閉手勢 ---------- */
const cardRef = ref(null);
const dragY = ref(0);        // 目前下拖位移（px）
const dragging = ref(false); // 手勢已判定為「下拉面板」（垂直為主且內容在頂端）
let startX = 0;
let startY = 0;
let touching = false;

const CLOSE_THRESHOLD = 90;  // 放開時位移超過此值即關閉

function sheetEl() {
  return cardRef.value?.$el || null;
}

function onTouchStart(e) {
  if (e.touches.length !== 1) return;
  touching = true;
  dragging.value = false;
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
}

function onTouchMove(e) {
  if (!touching || e.touches.length !== 1) return;
  const dx = e.touches[0].clientX - startX;
  const dy = e.touches[0].clientY - startY;
  if (!dragging.value) {
    // 內容捲到頂 + 往下拖 + 垂直位移為主 → 進入下拉面板手勢；否則交還原生捲動
    const el = sheetEl();
    const atTop = !el || el.scrollTop <= 0;
    if (dy > 8 && Math.abs(dy) > Math.abs(dx) && atTop) {
      dragging.value = true;
      startY = e.touches[0].clientY;   // 重定起點，位移從 0 開始不跳動
    } else if (Math.abs(dx) > 8 || dy < -8 || !atTop) {
      touching = false;                // 橫向滑動 / 上滑 / 內容捲動中：本次不攔截
      return;
    }
  }
  if (dragging.value) {
    e.preventDefault();                // 阻止內容捲動 / 瀏覽器下拉重整
    dragY.value = Math.max(0, e.touches[0].clientY - startY);
  }
}

function onTouchEnd() {
  if (!touching) return;
  touching = false;
  if (dragging.value && dragY.value > CLOSE_THRESHOLD) {
    setOpen(false);
  }
  dragging.value = false;
  dragY.value = 0;   // 未達門檻彈回（transition 生效）；關閉時歸零避免下次殘留
}

// 面板重新開啟時重置手勢狀態
watch(() => props.modelValue, (val) => {
  if (val) { dragY.value = 0; dragging.value = false; touching = false; }
});

const cardStyle = computed(() => ({
  transform: dragY.value ? `translateY(${dragY.value}px)` : 'none',
  transition: dragging.value ? 'none' : 'transform .2s ease',
}));
</script>

<style scoped>
.mobile-sheet {
  padding: 6px 16px calc(20px + env(safe-area-inset-bottom, 0px));
  max-height: 82dvh;
  overflow-y: auto;
  overscroll-behavior: contain;   /* 避免捲到頂時觸發瀏覽器下拉重整 */
}
.mobile-sheet-handle {
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: #d4dae3;
  margin: 6px auto 10px;
}
.mobile-sheet-close {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #f0f3f8;
  color: #44546a;
  cursor: pointer;
}
.mobile-sheet-close:active { background: #e0e6ef; }
.mobile-sheet-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 700;
  color: #1a3a6e;
  margin-bottom: 12px;
  padding-right: 40px;   /* 避開右上關閉鈕 */
}
</style>
