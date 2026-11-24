<template>
  <v-dialog :model-value="modelValue" fullscreen transition="fade-transition" @update:model-value="v => emit('update:modelValue', v)">
    <div class="pnd">
      <PanoramaViewer
        v-if="modelValue && type"
        ref="viewerRef"
        :key="current.downloadURL"
        v-model:auto-rotate="autoRotate"
        :src="current.downloadURL"
        :type="type"
        @gyro-change="v => (gyroOn = v)"
      >
        <template #error>
          <button type="button" class="mac-btn" @click="emit('flat')">
            <v-icon size="16">mdi-image-outline</v-icon>平面檢視
          </button>
        </template>
      </PanoramaViewer>
      <div v-else class="pnd-wait">
        <v-progress-circular indeterminate size="28" width="2" color="white"></v-progress-circular>
      </div>

      <template v-if="images.length > 1">
        <button type="button" class="pnd-nav pnd-nav--prev" title="上一張" @click="go(-1)">
          <v-icon size="26">mdi-chevron-left</v-icon>
        </button>
        <button type="button" class="pnd-nav pnd-nav--next" title="下一張" @click="go(1)">
          <v-icon size="26">mdi-chevron-right</v-icon>
        </button>
      </template>

      <div class="pnd-bar">
        <button type="button" class="pnd-tool" :class="{ 'is-on': autoRotate }" title="自動旋轉" @click="toggleAutoRotate">
          <v-icon size="18">{{ autoRotate ? 'mdi-pause' : 'mdi-rotate-360' }}</v-icon><span class="pnd-tool-label">自動旋轉</span>
        </button>
        <button v-if="gyroSupported" type="button" class="pnd-tool" :class="{ 'is-on': gyroOn }" title="陀螺儀" @click="toggleGyro">
          <v-icon size="18">mdi-screen-rotation</v-icon><span class="pnd-tool-label">陀螺儀</span>
        </button>
        <button type="button" class="pnd-tool" title="回到正面" @click="viewerRef?.resetView()">
          <v-icon size="18">mdi-image-filter-center-focus</v-icon><span class="pnd-tool-label">重設</span>
        </button>
        <button type="button" class="pnd-tool" title="平面檢視" @click="emit('flat')">
          <v-icon size="18">mdi-image-outline</v-icon><span class="pnd-tool-label">平面檢視</span>
        </button>
        <span class="pnd-sep"></span>
        <button type="button" class="pnd-tool pnd-tool--icon" title="關閉" @click="emit('update:modelValue', false)">
          <v-icon size="18">mdi-close</v-icon>
        </button>
      </div>

      <div v-if="current" class="pnd-caption">
        <PanoramaBadge :type="type" />
        <span class="pnd-caption-name">{{ current.imageName }}</span>
        <span v-if="images.length > 1" class="pnd-caption-count">{{ index + 1 }} / {{ images.length }}</span>
      </div>
    </div>
  </v-dialog>
</template>

<script setup>
// 全景瀏覽視窗：自動旋轉、陀螺儀、上一張／下一張；切到一般圖片時通知父層回平面檢視（flat）
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useToast } from 'vue-toastification';
import PanoramaViewer from './PanoramaViewer.vue';
import PanoramaBadge from './PanoramaBadge.vue';
import { panoramaTypeOf, isPanoramaPending } from '@/utils/panorama';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // [{ downloadURL, imageName, width, height, panorama }]
  images: { type: Array, default: () => [] },
  index: { type: Number, default: 0 },
});
const emit = defineEmits(['update:modelValue', 'update:index', 'flat']);

const toast = useToast();
const viewerRef = ref(null);
const autoRotate = ref(false);
const gyroOn = ref(false);

const current = computed(() => props.images[props.index] || null);
const type = computed(() => panoramaTypeOf(current.value));
const pending = computed(() => isPanoramaPending(current.value));

const gyroSupported = typeof window !== 'undefined'
  && 'DeviceOrientationEvent' in window
  && window.matchMedia?.('(pointer: coarse)').matches;
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// 開啟、換圖時自動慢轉（系統設定減少動態效果時不轉）
function startAutoRotate() {
  autoRotate.value = !reducedMotion();
  gyroOn.value = false;
}

// 切到一般圖片（或目前這張被移除）→ 交給父層開平面檢視
watch([() => props.modelValue, current, type, pending], ([open, image, t, wait]) => {
  if (!open) return;
  if (!image) emit('update:modelValue', false);
  else if (!t && !wait) emit('flat');
}, { immediate: true });

watch(() => [props.modelValue, current.value?.downloadURL], ([open]) => { if (open) startAutoRotate(); }, { immediate: true });

function go(step) {
  const n = props.images.length;
  if (n > 1) emit('update:index', (props.index + step + n) % n);
}

function toggleAutoRotate() {
  autoRotate.value = !autoRotate.value;
  if (autoRotate.value && gyroOn.value) viewerRef.value?.setGyro(false);
}

async function toggleGyro() {
  const message = await viewerRef.value?.setGyro(!gyroOn.value);
  if (message) toast.error(message);
}

function onKey(e) {
  if (e.key === 'ArrowLeft') go(-1);
  else if (e.key === 'ArrowRight') go(1);
  else if (e.key === '+' || e.key === '=') viewerRef.value?.zoomBy(0.85);
  else if (e.key === '-') viewerRef.value?.zoomBy(1 / 0.85);
}
watch(() => props.modelValue, (open) => {
  if (open) window.addEventListener('keydown', onKey);
  else window.removeEventListener('keydown', onKey);
}, { immediate: true });
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));
</script>

<style scoped>
.pnd {
  position: relative;
  width: 100%;
  height: 100%;
  background: #121214;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang TC", "Noto Sans TC", sans-serif;
}
.pnd-wait {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
}

/* 毛玻璃浮層 */
.pnd-bar,
.pnd-caption,
.pnd-nav {
  position: absolute;
  z-index: 2;
  background: rgba(40, 40, 44, 0.62);
  -webkit-backdrop-filter: saturate(180%) blur(16px);
  backdrop-filter: saturate(180%) blur(16px);
  box-shadow: 0 0 0 0.5px rgba(255, 255, 255, 0.16), 0 4px 16px rgba(0, 0, 0, 0.28);
  color: #fff;
}

/* 工具列放右上：左上角是全站選單鈕 */
.pnd-bar {
  top: calc(12px + env(safe-area-inset-top, 0px));
  right: calc(12px + env(safe-area-inset-right, 0px));
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border-radius: 12px;
}
.pnd-tool {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #fff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.12s;
}
.pnd-tool .v-icon { color: #fff; }
.pnd-tool:hover { background: rgba(255, 255, 255, 0.14); }
.pnd-tool.is-on { background: #0a84ff; }
.pnd-tool--icon { width: 32px; padding: 0; justify-content: center; }
.pnd-sep { width: 1px; height: 18px; margin: 0 2px; background: rgba(255, 255, 255, 0.22); }

.pnd-caption {
  left: calc(12px + env(safe-area-inset-left, 0px));
  bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  max-width: calc(100% - 24px);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px 6px 6px;
  border-radius: 14px;
  font-size: 13px;
  pointer-events: none;
}
.pnd-caption-name { font-weight: 600; line-height: 1.35; overflow-wrap: anywhere; }
.pnd-caption-count { flex-shrink: 0; color: rgba(255, 255, 255, 0.7); font-variant-numeric: tabular-nums; }

.pnd-nav {
  top: 50%;
  display: grid;
  place-content: center;
  width: 42px;
  height: 42px;
  margin-top: -21px;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.12s;
}
.pnd-nav:hover { background: rgba(70, 70, 76, 0.78); }
.pnd-nav .v-icon { color: #fff; }
.pnd-nav--prev { left: calc(12px + env(safe-area-inset-left, 0px)); }
.pnd-nav--next { right: calc(12px + env(safe-area-inset-right, 0px)); }

@media (max-width: 600px) {
  /* 手機只留圖示，文字放不下 */
  .pnd-tool-label { display: none; }
  .pnd-tool { width: 38px; height: 36px; padding: 0; justify-content: center; }
  .pnd-nav { width: 38px; height: 38px; margin-top: -19px; }
  .pnd-nav--prev { left: 8px; }
  .pnd-nav--next { right: 8px; }
}
</style>
