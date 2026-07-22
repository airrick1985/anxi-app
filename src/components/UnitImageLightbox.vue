<template>
  <!-- 第一層：圖片燈箱（輪播 + 縮圖列） -->
  <v-dialog v-model="dialogModel" max-width="1000" scrollable>
    <v-card v-if="images.length > 0">
      <v-toolbar density="compact" color="primary">
        <v-toolbar-title class="text-subtitle-1 font-weight-bold">
          {{ title }} 戶別圖片
          <span class="text-caption ml-2">{{ currentIndex + 1 }} / {{ images.length }}</span>
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" @click="dialogModel = false"></v-btn>
      </v-toolbar>

      <v-card-text class="pa-3">
        <v-carousel
          v-model="currentIndex"
          class="carousel-stage"
          height="auto"
          hide-delimiters
          :show-arrows="images.length > 1 ? 'hover' : false"
        >
          <v-carousel-item v-for="image in images" :key="image.id || image.imageName">
            <v-img
              :src="image.downloadURL"
              contain
              max-height="65vh"
              style="cursor: zoom-in;"
              @click="openZoom"
            ></v-img>
          </v-carousel-item>
        </v-carousel>

        <div class="text-center text-caption text-grey mt-2">點擊圖片可放大檢視</div>

        <div v-if="images.length > 1" class="thumb-strip mt-3">
          <div
            v-for="(image, index) in images"
            :key="`thumb-${image.id || image.imageName}`"
            class="thumb"
            :class="{ 'thumb-active': index === currentIndex }"
            @click="currentIndex = index"
          >
            <v-img :src="image.downloadURL" aspect-ratio="16/9" cover></v-img>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- 第二層：放大燈箱（滾輪縮放 / 拖曳平移） -->
  <v-dialog v-model="zoomDialog" fullscreen hide-overlay transition="fade-transition">
    <div
      class="zoom-stage"
      @wheel.prevent="onWheel"
      @mousedown="startPan"
      @mousemove="onPan"
      @mouseup="endPan"
      @mouseleave="endPan"
      @dblclick="resetZoom"
    >
      <img
        v-if="currentImage"
        :src="currentImage.downloadURL"
        class="zoom-image"
        :style="zoomStyle"
        draggable="false"
      />

      <div v-if="scale > 1.01" class="zoom-indicator">{{ Math.round(scale * 100) }}%</div>

      <template v-if="images.length > 1">
        <v-btn class="nav-btn prev" icon="mdi-chevron-left" variant="flat" size="large"
          @click.stop="prevImage"></v-btn>
        <v-btn class="nav-btn next" icon="mdi-chevron-right" variant="flat" size="large"
          @click.stop="nextImage"></v-btn>
      </template>

      <div class="zoom-toolbar">
        <v-btn icon="mdi-magnify-minus-outline" variant="flat" size="small" @click.stop="zoomBy(-0.25)"></v-btn>
        <v-btn icon="mdi-magnify-plus-outline" variant="flat" size="small" @click.stop="zoomBy(0.25)"></v-btn>
        <v-btn icon="mdi-backup-restore" variant="flat" size="small" @click.stop="resetZoom"></v-btn>
        <span class="zoom-caption">{{ currentIndex + 1 }} / {{ images.length }}</span>
      </div>

      <v-btn class="close-btn" icon="mdi-close" variant="flat" @click.stop="zoomDialog = false"></v-btn>
    </div>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  images: { type: Array, default: () => [] },
  title: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue']);

const dialogModel = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const currentIndex = ref(0);
const zoomDialog = ref(false);

const currentImage = computed(() => props.images[currentIndex.value] || null);

// 每次重新開啟燈箱時回到第一張
watch(dialogModel, (open) => {
  if (open) currentIndex.value = 0;
  else zoomDialog.value = false;
});

// --- 放大燈箱：縮放 / 平移 ---
const scale = ref(1);
const offsetX = ref(0);
const offsetY = ref(0);
const isPanning = ref(false);
const panStart = { x: 0, y: 0, ox: 0, oy: 0 };

const zoomStyle = computed(() => ({
  transform: `translate(${offsetX.value}px, ${offsetY.value}px) scale(${scale.value})`,
  cursor: scale.value > 1.01 ? (isPanning.value ? 'grabbing' : 'grab') : 'default',
}));

function resetZoom() {
  scale.value = 1;
  offsetX.value = 0;
  offsetY.value = 0;
}

function zoomBy(delta) {
  const next = Math.min(6, Math.max(1, scale.value + delta));
  if (next === 1) resetZoom();
  else scale.value = next;
}

function openZoom() {
  resetZoom();
  zoomDialog.value = true;
}

function onWheel(e) {
  zoomBy(e.deltaY < 0 ? 0.2 : -0.2);
}

function startPan(e) {
  if (scale.value <= 1.01) return;
  isPanning.value = true;
  panStart.x = e.clientX;
  panStart.y = e.clientY;
  panStart.ox = offsetX.value;
  panStart.oy = offsetY.value;
}

function onPan(e) {
  if (!isPanning.value) return;
  offsetX.value = panStart.ox + (e.clientX - panStart.x);
  offsetY.value = panStart.oy + (e.clientY - panStart.y);
}

function endPan() {
  isPanning.value = false;
}

function nextImage() {
  if (props.images.length < 2) return;
  currentIndex.value = (currentIndex.value + 1) % props.images.length;
  resetZoom();
}

function prevImage() {
  if (props.images.length < 2) return;
  currentIndex.value = (currentIndex.value - 1 + props.images.length) % props.images.length;
  resetZoom();
}
</script>

<style scoped>
/* 輪播主圖底色：淺灰白，避免白底圖片與卡片融成一片 */
.carousel-stage {
  background-color: #e8eaed;
  border-radius: 4px;
}

.thumb-strip {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}
.thumb {
  flex: 0 0 96px;
  border: 2px solid transparent;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  opacity: 0.65;
  transition: opacity 0.2s, border-color 0.2s;
}
.thumb:hover { opacity: 1; }
.thumb-active {
  border-color: rgb(var(--v-theme-primary));
  opacity: 1;
}

.zoom-stage {
  position: relative;
  width: 100%;
  height: 100%;
  /* 淺灰白：與 UnitDetailModal 全螢幕檢視一致，讓白底圖片與背景有區隔 */
  background-color: #e8eaed;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}
.zoom-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transform-origin: center center;
  transition: transform 0.08s linear;
}
.zoom-indicator {
  position: absolute;
  top: 16px;
  left: 16px;
  padding: 4px 10px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  color: #333;
  font-size: 0.8rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
}
.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: #fff !important;
  color: #444 !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
.nav-btn.prev { left: 16px; }
.nav-btn.next { right: 16px; }
.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: #fff !important;
  color: #444 !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
.zoom-toolbar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}
.zoom-caption {
  font-size: 0.8rem;
  color: #555;
  padding: 0 4px;
}
</style>
