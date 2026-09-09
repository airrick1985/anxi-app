<template>
  <div class="unit-effect-picker">
    <div class="uep-header">
      <span class="uep-title">網格邊框特效</span>
      <span class="uep-hint">為此戶的銷控網格加上邊框特效（暈光、閃爍…），可與文字標籤同時使用；點範本即可套用</span>
    </div>

    <!-- 範本清單：每張卡片都是即時預覽 -->
    <div class="uep-grid">
      <button
        type="button"
        class="uep-card"
        :class="{ 'is-active': !current }"
        @click="selectPreset(null)"
      >
        <div class="uep-mock">
          <span class="uep-mock-name">A1-8F</span>
          <span class="uep-mock-price">1,280 萬</span>
          <span class="uep-mock-sub">36.5 坪</span>
        </div>
        <div class="uep-card-name">無特效</div>
        <div class="uep-card-desc">維持一般網格</div>
        <v-icon v-if="!current" class="uep-check" size="16">mdi-check-circle</v-icon>
      </button>

      <button
        v-for="p in presets"
        :key="p.key"
        type="button"
        class="uep-card"
        :class="{ 'is-active': current && current.preset === p.key }"
        @click="selectPreset(p)"
      >
        <div class="uep-mock" :class="['unit-fx', `unit-fx--${p.key}`]" :style="{ '--fx-color': previewColorFor(p) }">
          <span class="uep-mock-name">A1-8F</span>
          <span class="uep-mock-price">1,280 萬</span>
          <span class="uep-mock-sub">36.5 坪</span>
        </div>
        <div class="uep-card-name">
          {{ p.name }}
          <span v-if="p.animated" class="uep-badge">動態</span>
        </div>
        <div class="uep-card-desc">{{ p.desc }}</div>
        <v-icon v-if="current && current.preset === p.key" class="uep-check" size="16">mdi-check-circle</v-icon>
      </button>
    </div>

    <!-- 已選範本：顏色與套用預覽 -->
    <div v-if="current" class="uep-detail">
      <div class="uep-detail-preview">
        <div class="uep-mock uep-mock--lg" :class="unitEffectClass(current)" :style="unitEffectStyle(current)">
          <span class="uep-mock-name">A1-8F</span>
          <span class="uep-mock-price">1,280 萬</span>
          <span class="uep-mock-sub">36.5 坪</span>
        </div>
        <div class="uep-detail-caption">套用預覽</div>
      </div>

      <div class="uep-detail-body">
        <div class="uep-detail-title">
          已選：{{ currentPreset ? currentPreset.name : current.preset }}
          <span v-if="currentPreset" class="uep-hint">{{ currentPreset.desc }}</span>
        </div>

        <div v-if="currentPreset && currentPreset.usesColor" class="uep-row">
          <span class="uep-label">特效顏色</span>
          <template v-if="tagColorOptions.length > 0">
            <button
              v-for="c in tagColorOptions"
              :key="'tag-' + c.value"
              type="button"
              class="uep-swatch uep-swatch-tag"
              :class="{ 'is-active': current.color === c.value }"
              :style="{ backgroundColor: c.value }"
              :title="`同標籤「${c.name}」顏色`"
              @click="setColor(c.value)"
            ><v-icon size="11">mdi-tag</v-icon></button>
            <span class="uep-sep"></span>
          </template>
          <button
            v-for="c in colorOptions"
            :key="c.value"
            type="button"
            class="uep-swatch"
            :class="{ 'is-active': current.color === c.value }"
            :style="{ backgroundColor: c.value }"
            :title="c.name"
            @click="setColor(c.value)"
          ></button>
          <v-menu :close-on-content-click="false" location="bottom start">
            <template #activator="{ props: menuProps }">
              <button type="button" v-bind="menuProps" class="uep-swatch uep-swatch-custom" :class="{ 'is-active': !isPresetColor }" title="自訂顏色">
                <v-icon size="14">mdi-eyedropper-variant</v-icon>
              </button>
            </template>
            <v-card class="pa-2">
              <v-color-picker :model-value="current.color" mode="hex" :modes="['hex']" width="260" @update:model-value="setColor" />
            </v-card>
          </v-menu>
        </div>
        <div v-else class="uep-row">
          <span class="uep-hint">此範本為多彩效果，不需選擇顏色</span>
        </div>

        <div class="uep-row">
          <v-btn size="small" variant="text" color="error" prepend-icon="mdi-close-circle-outline" @click="selectPreset(null)">移除特效</v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import {
  UNIT_EFFECT_PRESETS, EFFECT_PRESET_COLORS,
  normalizeUnitEffect, getUnitEffectPreset, unitEffectClass, unitEffectStyle,
} from '@/utils/unitEffects';
import { normalizeHexColor } from '@/utils/unitTags';

const props = defineProps({
  /** { preset, color } 或 null */
  modelValue: { type: Object, default: null },
  /** 此戶文字標籤（[{ text, bgColor }]）：提供「同標籤顏色」快速選項 */
  tags: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue']);

const presets = UNIT_EFFECT_PRESETS;
const colorOptions = EFFECT_PRESET_COLORS;

const current = computed(() => normalizeUnitEffect(props.modelValue));
const currentPreset = computed(() => (current.value ? getUnitEffectPreset(current.value.preset) : null));
const isPresetColor = computed(() => {
  if (!current.value) return true;
  return colorOptions.some(c => c.value === current.value.color) || tagColorOptions.value.some(c => c.value === current.value.color);
});

/** 此戶標籤顏色（去重），供快速套用同色 */
const tagColorOptions = computed(() => {
  const seen = new Set();
  const list = [];
  for (const t of props.tags || []) {
    const v = normalizeHexColor(t?.bgColor);
    if (!v || seen.has(v)) continue;
    seen.add(v);
    list.push({ name: t.text || v, value: v });
  }
  return list;
});

/** 範本卡片預覽色：已選顏色優先（讓使用者看到自己的顏色套在各範本上），否則用範本預設色 */
function previewColorFor(p) {
  if (!p.usesColor) return p.color;
  return current.value?.color || p.color;
}

function selectPreset(p) {
  if (!p) { emit('update:modelValue', null); return; }
  const color = current.value?.color || p.color;
  emit('update:modelValue', { preset: p.key, color });
}

function setColor(val) {
  if (!current.value) return;
  const color = normalizeHexColor(val);
  if (!color) return;
  emit('update:modelValue', { preset: current.value.preset, color });
}
</script>

<style scoped>
.unit-effect-picker {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 10px 12px;
  background: #fafafa;
}
.uep-header { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px; margin-bottom: 10px; }
.uep-title { font-weight: 600; color: #37474f; }
.uep-hint { font-size: 0.72rem; color: #78909c; }

.uep-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  gap: 10px;
}
.uep-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 6px 8px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}
.uep-card:hover { border-color: #90caf9; transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); }
.uep-card.is-active { border-color: #1e88e5; box-shadow: 0 0 0 2px rgba(30, 136, 229, 0.25); background: #f3f8fe; }
.uep-check { position: absolute; top: 4px; right: 4px; color: #1e88e5; }
.uep-card-name { font-size: 0.8rem; font-weight: 600; color: #37474f; display: flex; align-items: center; gap: 4px; }
.uep-card-desc { font-size: 0.66rem; color: #90a4ae; line-height: 1.25; }
.uep-badge {
  font-size: 9px; font-weight: 600; line-height: 14px; padding: 0 5px;
  border-radius: 7px; background: #e3f2fd; color: #1565c0;
}

/* 仿銷控網格的迷你戶別卡（與實際 .unit-card 同圓角／同透明邊框，讓光環位置一致） */
.uep-mock {
  position: relative;
  width: 84px;
  height: 62px;
  border-radius: 6px;
  border: 2px solid transparent;
  background: #fff9c4;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 4px 0 4px;
  box-sizing: border-box;
}
.uep-mock--lg { width: 120px; height: 90px; margin: 6px; }
.uep-mock-name { font-size: 0.7rem; font-weight: 600; color: #1a237e; line-height: 1.2; }
.uep-mock-price { font-size: 0.72rem; font-weight: 700; color: #d81b60; line-height: 1.2; }
.uep-mock-sub { font-size: 0.6rem; color: #616161; line-height: 1.2; }
.uep-mock--lg .uep-mock-name { font-size: 0.95rem; }
.uep-mock--lg .uep-mock-price { font-size: 0.95rem; }
.uep-mock--lg .uep-mock-sub { font-size: 0.75rem; }

.uep-detail {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed #e0e0e0;
  display: flex;
  gap: 14px;
  align-items: flex-start;
  flex-wrap: wrap;
}
.uep-detail-preview { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px 4px; }
.uep-detail-caption { font-size: 0.68rem; color: #90a4ae; }
.uep-detail-body { flex: 1 1 220px; display: flex; flex-direction: column; gap: 8px; }
.uep-detail-title { font-size: 0.85rem; font-weight: 600; color: #37474f; display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline; }
.uep-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.uep-label { font-size: 0.75rem; color: #546e7a; min-width: 56px; }
.uep-swatch {
  width: 24px; height: 24px; border-radius: 6px; border: 2px solid #fff;
  box-shadow: 0 0 0 1px #cfd8dc; cursor: pointer; padding: 0;
  display: inline-flex; align-items: center; justify-content: center; color: #fff;
}
.uep-swatch.is-active { box-shadow: 0 0 0 2px #1e88e5; transform: scale(1.1); }
.uep-swatch-tag { border-radius: 50%; }
.uep-sep { width: 1px; height: 20px; background: #cfd8dc; margin: 0 2px; }
.uep-swatch-custom { background: linear-gradient(135deg, #ff5252, #ffab40, #ffee58, #69f0ae, #40c4ff, #b388ff); color: #333; }
</style>
