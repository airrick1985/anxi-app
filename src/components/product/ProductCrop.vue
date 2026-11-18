<template>
  <!-- 截圖裁切：外框比例＝裁切範圍，圖片放大後以負邊距對齊（docs/SPEC_ProductPage.md §7） -->
  <span class="pp-crop" :style="{ aspectRatio: `${c.w} / ${c.h}` }">
    <img
      :src="shot.src"
      :alt="alt ?? shot.alt"
      :width="shot.width"
      :height="shot.height"
      :loading="eager ? 'eager' : 'lazy'"
      :fetchpriority="eager ? 'high' : undefined"
      decoding="async"
      draggable="false"
      :style="imgStyle"
    />
  </span>
</template>

<script setup>
import { computed } from 'vue';
import { shotCrop } from '@/constants/productPage';

const props = defineProps({
  shot: { type: Object, required: true },
  eager: { type: Boolean, default: false },
  alt: { type: String, default: undefined },
});

const c = computed(() => shotCrop(props.shot));
const pct = (n) => `${(n * 100).toFixed(4)}%`;
const imgStyle = computed(() => ({
  width: pct(props.shot.width / c.value.w),
  marginLeft: pct(-c.value.x / c.value.w),
  marginTop: pct(-c.value.y / c.value.w),
}));
</script>

<style scoped>
.pp-crop {
  display: block;
  width: 100%;
  overflow: hidden;
  background: #F5F6F8;
}
.pp-crop img {
  display: block;
  max-width: none;
  height: auto;
  user-select: none;
  -webkit-user-drag: none;
}
</style>
