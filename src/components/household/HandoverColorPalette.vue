<template>
  <div class="hcp">
    <div class="hcp-grid">
      <button
        v-for="c in COLOR_PRESETS"
        :key="c"
        type="button"
        class="hcp-swatch"
        :class="{ 'is-selected': current === c }"
        :style="{ background: c }"
        :title="c"
        @click="pick(c, true)"
      >
        <v-icon v-if="current === c" size="14" :color="textColorFor(c)">mdi-check</v-icon>
      </button>
    </div>
    <div class="hcp-custom">
      <label class="hcp-native" :style="{ background: current || '#FFFFFF' }" title="自訂顏色">
        <input
          type="color"
          :value="(current || '#FFFFFF').toLowerCase()"
          @input="pick($event.target.value, false)"
          @change="pick($event.target.value, true)"
        >
        <v-icon size="14" :color="textColorFor(current)">mdi-eyedropper-variant</v-icon>
      </label>
      <input
        class="mac-form-input hcp-hex"
        :value="hexDraft"
        maxlength="7"
        spellcheck="false"
        @input="onHexInput($event.target.value)"
        @keydown.enter.prevent="applyHex"
        @blur="applyHex"
      >
      <button
        v-if="defaultColor"
        type="button"
        class="mac-link-btn"
        :disabled="current === defaultColor"
        @click="pick(defaultColor, true)"
      >還原預設</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { COLOR_PRESETS, normalizeHex, textColorFor } from '@/utils/handoverBoard';

const props = defineProps({
  modelValue: { type: String, default: '' },
  defaultColor: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue', 'commit']);

const current = computed(() => normalizeHex(props.modelValue));
const hexDraft = ref(current.value || '');
watch(current, (v) => { hexDraft.value = v || ''; });

const pick = (value, commit) => {
  const hex = normalizeHex(value);
  if (!hex) return;
  emit('update:modelValue', hex);
  if (commit) emit('commit', hex);
};
// 輸入到完整 6 碼就即時套用（彈出框可能直接被點外面關掉，不一定有 blur／Enter）
const onHexInput = (value) => {
  hexDraft.value = value;
  const raw = String(value || '').trim();
  if (/^#?[0-9a-f]{6}$/i.test(raw)) {
    const hex = normalizeHex(raw.startsWith('#') ? raw : `#${raw}`);
    if (hex && hex !== current.value) pick(hex, false);
  }
};
const applyHex = () => {
  const raw = String(hexDraft.value || '').trim();
  const hex = normalizeHex(raw.startsWith('#') ? raw : `#${raw}`);
  if (!hex) {
    hexDraft.value = current.value || '';
    return;
  }
  if (hex !== current.value) pick(hex, true);
};
</script>

<style scoped>
.hcp-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 5px;
}
.hcp-swatch {
  display: grid;
  place-content: center;
  aspect-ratio: 1;
  min-width: 0;
  border: 0;
  border-radius: 6px;
  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.18);
  cursor: pointer;
  transition: transform 0.12s;
}
.hcp-swatch:hover { transform: scale(1.1); }
.hcp-swatch.is-selected { box-shadow: 0 0 0 2px #fff, 0 0 0 3.5px #0071e3; }
.hcp-custom {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}
.hcp-native {
  position: relative;
  display: grid;
  place-content: center;
  flex-shrink: 0;
  width: 30px;
  height: 28px;
  border-radius: 6px;
  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.2);
  cursor: pointer;
}
.hcp-native input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}
.hcp-hex {
  width: 92px;
  flex: 0 0 92px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  text-transform: uppercase;
}
.hcp-custom .mac-link-btn { margin-left: auto; }
@media (max-width: 600px) {
  .hcp-hex { font-size: 16px; }
}
</style>
