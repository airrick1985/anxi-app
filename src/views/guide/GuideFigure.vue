<template>
  <figure class="gf">
    <button v-if="src" type="button" class="gf-shot" :aria-label="`放大：${caption}`" @click="zoomed = true">
      <img :src="src" :alt="caption" loading="lazy" />
      <span class="gf-zoom mdi mdi-magnify-plus-outline" aria-hidden="true"></span>
    </button>
    <div v-else class="gf-mock" aria-hidden="true">
      <!-- 寬示意圖以固定寬度排版，畫面不夠寬時等比縮小 -->
      <div v-if="width" class="gf-fit" :style="{ maxWidth: `${width}px` }">
        <FixedWidthScaler :width="width"><slot /></FixedWidthScaler>
      </div>
      <slot v-else />
    </div>
    <figcaption v-if="caption">{{ caption }}</figcaption>

    <Teleport to="body">
      <div v-if="zoomed" class="gf-lightbox" role="dialog" :aria-label="caption" @click="zoomed = false">
        <img :src="src" :alt="caption" />
        <button type="button" class="gf-close mdi mdi-close" aria-label="關閉" @click.stop="zoomed = false"></button>
      </div>
    </Teleport>
  </figure>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue';
import FixedWidthScaler from '@/components/FixedWidthScaler.vue';

defineProps({
  src: { type: String, default: '' },
  caption: { type: String, default: '' },
  width: { type: Number, default: 0 }, // 示意圖排版寬度（px），0 = 自然寬度
});

const zoomed = ref(false);
const onKey = (e) => { if (e.key === 'Escape') zoomed.value = false; };
watch(zoomed, (open) => {
  if (open) window.addEventListener('keydown', onKey);
  else window.removeEventListener('keydown', onKey);
});
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));
</script>

<style scoped>
.gf {
  margin: 20px 0 24px;
}
.gf-mock {
  padding: 18px;
  background: #eef1f5;
  border-radius: 12px;
}
.gf-fit {
  margin: 0 auto;
}
@media (max-width: 599.98px) {
  .gf-mock {
    padding: 10px;
  }
}
.gf-shot {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  border: 1px solid #e3e6ea;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  cursor: zoom-in;
}
.gf-shot img {
  display: block;
  width: 100%;
  height: auto;
}
.gf-zoom {
  position: absolute;
  right: 10px;
  bottom: 10px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 18px;
  line-height: 32px;
  text-align: center;
}
figcaption {
  margin-top: 8px;
  font-size: 13px;
  color: #5f6b7a;
  text-align: center;
}
.gf-lightbox {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(15, 20, 28, 0.88);
  cursor: zoom-out;
}
.gf-lightbox img {
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
  background: #fff;
}
.gf-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 22px;
  cursor: pointer;
}
</style>
