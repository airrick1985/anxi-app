<template>
  <span v-if="type" class="pano-badge" :class="{ 'pano-badge--sm': small }">
    <v-icon :size="small ? 11 : 13">{{ type === 'sphere' ? 'mdi-rotate-360' : 'mdi-panorama-horizontal-outline' }}</v-icon>
    <template v-if="!small">{{ panoramaLabel(type) }}</template>
  </span>
</template>

<script setup>
// 全景圖標記：360°（環景）／全景（長條）；small 只顯示圖示（縮圖用）
import { panoramaLabel } from '@/utils/panorama';

defineProps({
  type: { type: String, default: '' },
  small: { type: Boolean, default: false },
});
</script>

<style scoped>
.pano-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  height: 20px;
  padding: 0 7px;
  border-radius: 10px;
  background: rgba(28, 28, 30, 0.72);
  -webkit-backdrop-filter: saturate(180%) blur(10px);
  backdrop-filter: saturate(180%) blur(10px);
  color: #fff;
  font-size: 11.5px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  pointer-events: none;
}
.pano-badge .v-icon { color: #fff; }
.pano-badge--sm {
  width: 18px;
  height: 18px;
  padding: 0;
  justify-content: center;
  border-radius: 50%;
}
</style>
