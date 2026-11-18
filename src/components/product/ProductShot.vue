<template>
  <!-- 真實截圖：瀏覽器框／手機框，點了放大（燈箱顯示同一個裁切範圍） -->
  <button
    type="button"
    class="pp-shot"
    :class="`pp-shot--${shot.frame}`"
    :aria-label="`放大檢視：${shot.alt}`"
    @click="$emit('open', shotKey, $event.currentTarget)"
  >
    <span v-if="shot.frame === 'browser'" class="pp-shot__bar" aria-hidden="true"><i></i><i></i><i></i></span>
    <ProductCrop :shot="shot" :eager="eager" class="pp-shot__screen" />
    <span class="pp-shot__zoom" aria-hidden="true"><v-icon size="18">mdi-magnify-plus-outline</v-icon></span>
  </button>
</template>

<script setup>
import { computed } from 'vue';
import { SHOTS } from '@/constants/productPage';
import ProductCrop from './ProductCrop.vue';

const props = defineProps({
  shotKey: { type: String, required: true },
  eager: { type: Boolean, default: false },
});
defineEmits(['open']);

const shot = computed(() => SHOTS[props.shotKey]);
</script>

<style scoped>
.pp-shot {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: #fff;
  text-align: left;
  cursor: zoom-in;
  box-shadow: 0 30px 70px rgba(15, 23, 42, 0.18);
  transition: transform 0.2s ease;
}
.pp-shot--browser {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #E5E7EB;
}
.pp-shot__bar {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 12px;
  background: #EEF0F4;
  border-bottom: 1px solid #E5E7EB;
}
.pp-shot__bar i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #D1D5DB;
}
.pp-shot--phone {
  border: 8px solid #0B0B0F;
  border-radius: 32px;
  background: #0B0B0F;
  overflow: hidden;
}
.pp-shot--phone .pp-shot__screen {
  border-radius: 24px;
}
.pp-shot__zoom {
  position: absolute;
  right: 10px;
  bottom: 10px;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(11, 11, 15, 0.72);
  color: #fff;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.2s ease, transform 0.2s ease;
  pointer-events: none;
}
.pp-shot:hover .pp-shot__zoom,
.pp-shot:focus-visible .pp-shot__zoom {
  opacity: 1;
  transform: none;
}
@media (hover: none) {
  .pp-shot__zoom { opacity: 1; transform: none; }
}
.pp-shot:focus-visible {
  outline: 2px solid #2F6BFF;
  outline-offset: 2px;
}
@media print {
  .pp-shot { box-shadow: none; }
  .pp-shot__zoom { display: none; }
}
</style>
