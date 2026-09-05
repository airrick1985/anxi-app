<template>
  <div class="cf-root">
    <span v-if="label" class="cf-label">{{ label }}</span>
    <v-menu v-model="menu" :close-on-content-click="false" location="bottom start" :offset="4">
      <template #activator="{ props: act }">
        <button type="button" class="cf-swatch-btn" v-bind="act" :title="modelValue">
          <span class="cf-swatch" :style="{ background: modelValue || 'transparent' }"></span>
          <span class="cf-value">{{ display }}</span>
        </button>
      </template>
      <v-card class="pa-2" width="260">
        <v-color-picker v-model="inner" :modes="['hexa', 'rgba']" mode="hexa" elevation="0" width="244" :swatches="swatches" show-swatches swatches-max-height="96" />
        <div class="d-flex ga-1 mt-1">
          <v-btn v-if="allowTransparent" size="x-small" variant="text" @click="pick('transparent')">透明</v-btn>
          <v-spacer />
          <v-btn size="x-small" variant="text" @click="menu = false">完成</v-btn>
        </div>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: { type: String, default: '#000000' },
  label: { type: String, default: '' },
  allowTransparent: { type: Boolean, default: false },
  recent: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue']);

const menu = ref(false);
const inner = ref(props.modelValue);
watch(() => props.modelValue, v => { if (v !== inner.value) inner.value = v; });
let timer = null;
watch(inner, (v) => {
  if (!v || v === props.modelValue) return;
  clearTimeout(timer);
  timer = setTimeout(() => emit('update:modelValue', v), 60);
});

const display = computed(() => (props.modelValue === 'transparent' ? '透明' : (props.modelValue || '')).toUpperCase().slice(0, 9));
const baseSwatches = [
  ['#111827', '#374151', '#6b7280', '#9ca3af'], ['#ffffff', '#f3f4f6', '#e5e7eb', '#d1d5db'],
  ['#1e3a8a', '#2563eb', '#3b82f6', '#93c5fd'], ['#b91c1c', '#e11d48', '#f43f5e', '#fda4af'],
  ['#065f46', '#059669', '#10b981', '#6ee7b7'], ['#b45309', '#d97706', '#f59e0b', '#fcd34d'],
];
const swatches = computed(() => {
  const recent = (props.recent || []).filter(Boolean).slice(0, 8);
  return recent.length ? [recent.slice(0, 4), recent.slice(4, 8).length ? recent.slice(4, 8) : [], ...baseSwatches].filter(a => a.length) : baseSwatches;
});
function pick(v) { emit('update:modelValue', v); menu.value = false; }
</script>

<style scoped>
.cf-root { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 30px; }
.cf-label { font-size: 12px; color: #4b5563; white-space: nowrap; }
.cf-swatch-btn { display: inline-flex; align-items: center; gap: 6px; border: 1px solid rgba(0,0,0,0.18); border-radius: 6px; padding: 2px 8px 2px 3px; background: #fff; cursor: pointer; }
.cf-swatch { width: 20px; height: 20px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.15); background-image: linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%); background-size: 8px 8px; }
.cf-value { font-size: 11px; font-family: monospace; color: #374151; min-width: 60px; text-align: left; }
</style>
