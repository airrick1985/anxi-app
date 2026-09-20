<template>
  <v-card variant="outlined" class="grid-preview">
    <v-card-title class="text-subtitle-2 d-flex align-center flex-wrap ga-1">
      <v-icon start size="small">mdi-eye-outline</v-icon>{{ title }}
      <span v-if="caption" class="text-caption text-medium-emphasis ml-2">{{ caption }}</span>
      <v-spacer></v-spacer>
      <div class="d-flex align-center ga-1">
        <v-btn icon="mdi-minus" size="x-small" variant="text" :disabled="zoom <= MIN_ZOOM" @click="stepZoom(-1)"></v-btn>
        <v-btn size="x-small" variant="text" class="zoom-label" @click="setZoom(1)">{{ Math.round(zoom * 100) }}%</v-btn>
        <v-btn icon="mdi-plus" size="x-small" variant="text" :disabled="zoom >= MAX_ZOOM" @click="stepZoom(1)"></v-btn>
        <v-btn size="x-small" variant="tonal" prepend-icon="mdi-arrow-expand-horizontal" :color="fitWidth ? 'primary' : undefined" @click="toggleFit">符合寬度</v-btn>
        <v-chip size="x-small" variant="tonal" class="ml-1">{{ grids.length }} {{ unitLabel }}</v-chip>
      </div>
    </v-card-title>
    <v-tabs v-if="grids.length > 1" v-model="tab" density="compact" color="primary" show-arrows>
      <v-tab v-for="(gr, i) in grids" :key="i" :value="i">{{ gr.name }}</v-tab>
    </v-tabs>
    <v-divider></v-divider>
    <v-card-text ref="wrapRef" class="preview-wrap" :style="{ maxHeight }">
      <div v-if="current" class="preview-zoom" :style="{ zoom }" v-html="html"></div>
      <div v-else class="text-center text-medium-emphasis py-8">沒有可預覽的內容</div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { gridToHtml } from '@/services/commissionExcelService';

const props = defineProps({
  grids: { type: Array, default: () => [] },
  title: { type: String, default: '即時預覽' },
  caption: { type: String, default: '' },
  unitLabel: { type: String, default: '張分頁' },
  maxHeight: { type: String, default: '70vh' },
});

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;
const PADDING = 32;   // preview-wrap 左右 padding 合計

const tab = ref(0);
const zoom = ref(1);
const fitWidth = ref(false);
const wrapRef = ref(null);

const current = computed(() => props.grids[tab.value] || null);
const html = computed(() => (current.value ? gridToHtml(current.value) : ''));
// gridToHtml 以 cols×1.05 設欄寬（table-layout: fixed），表格自然寬度可直接由欄寬加總得出
const naturalWidth = computed(() => (current.value ? current.value.cols.reduce((s, w) => s + Math.round(w * 1.05), 0) + 2 : 0));

function clamp(z) { return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 100) / 100)); }
function setZoom(z) { fitWidth.value = false; zoom.value = clamp(z); }
function stepZoom(dir) { setZoom(zoom.value + dir * ZOOM_STEP); }

function applyFit() {
  const el = wrapRef.value?.$el || wrapRef.value;
  if (!fitWidth.value || !el || !naturalWidth.value) return;
  zoom.value = clamp((el.clientWidth - PADDING) / naturalWidth.value);
}
function toggleFit() {
  fitWidth.value = !fitWidth.value;
  if (fitWidth.value) nextTick(applyFit);
  else zoom.value = 1;
}

watch(() => props.grids, (g) => { if (tab.value >= g.length) tab.value = 0; });
watch([current, naturalWidth], () => nextTick(applyFit));

let observer = null;
onMounted(() => {
  const el = wrapRef.value?.$el || wrapRef.value;
  if (el && typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(() => applyFit());
    observer.observe(el);
  }
});
onBeforeUnmount(() => { observer?.disconnect(); });
</script>

<style scoped>
.preview-wrap {
  overflow: auto;
  background: #eceff4;
  padding: 16px;
}
.preview-zoom { display: inline-block; min-width: 100%; }
.preview-wrap :deep(table.comm-grid) {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  margin: 0 auto;
}
.zoom-label { min-width: 48px; }
</style>
