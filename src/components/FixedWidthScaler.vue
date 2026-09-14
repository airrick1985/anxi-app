<template>
  <!-- 外層依縮放後高度佔位，避免 transform 不影響版面而留白/重疊 -->
  <div ref="outerRef" class="fws-outer" :style="{ height: scaledHeight + 'px' }">
    <div ref="innerRef" class="fws-inner" :style="{ width: width + 'px', transform: `scale(${scale})` }">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';

/**
 * 固定寬度等比縮放容器
 * 內容永遠以 `width` px 的固定寬度排版（換行、行高與實際輸出完全一致），
 * 再依外層可用寬度以 CSS transform 等比縮小到能塞進畫面；外層寬度足夠時維持 1:1，不放大。
 * 用於「預覽必須與 html2canvas 實際輸出尺寸/比例一致」的場景。
 */
const props = defineProps({
  width: { type: Number, default: 794 }, // 內容排版寬度（px）
});
const emit = defineEmits(['scale']);

const outerRef = ref(null);
const innerRef = ref(null);
const scale = ref(1);
const scaledHeight = ref(0);

let outerObserver = null;
let innerObserver = null;

const recalc = () => {
  const outer = outerRef.value;
  const inner = innerRef.value;
  if (!outer || !inner) return;
  const available = outer.clientWidth || props.width;
  const next = Math.min(1, available / props.width);
  scale.value = next;
  // offsetHeight 為未套用 transform 的原始高度
  scaledHeight.value = Math.ceil(inner.offsetHeight * next);
  emit('scale', next);
};

onMounted(() => {
  recalc();
  if (typeof ResizeObserver !== 'undefined') {
    outerObserver = new ResizeObserver(recalc);
    outerObserver.observe(outerRef.value);
    innerObserver = new ResizeObserver(recalc);
    innerObserver.observe(innerRef.value);
  } else {
    window.addEventListener('resize', recalc);
  }
});

onBeforeUnmount(() => {
  outerObserver?.disconnect();
  innerObserver?.disconnect();
  window.removeEventListener('resize', recalc);
});

watch(() => props.width, recalc);
</script>

<style scoped>
.fws-outer {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.fws-inner {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: top left;
}
</style>
