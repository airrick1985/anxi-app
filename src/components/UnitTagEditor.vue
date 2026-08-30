<template>
  <div class="unit-tag-editor">
    <div class="ute-header">
      <span class="ute-title">文字標籤</span>
      <span class="ute-hint">最多 {{ max }} 個，顯示於銷控網格右上角（{{ tags.length }}/{{ max }}）</span>
    </div>

    <!-- 目前標籤 -->
    <div class="ute-current" v-if="tags.length > 0">
      <v-chip
        v-for="(tag, idx) in tags"
        :key="idx"
        size="small"
        label
        closable
        class="ute-chip"
        :class="{ 'is-editing': editingIndex === idx }"
        :style="{ backgroundColor: tag.bgColor, color: tag.textColor }"
        @click="startEdit(idx)"
        @click:close="removeTag(idx)"
      >
        {{ tag.text }}
      </v-chip>
      <span class="ute-hint ml-1">點標籤可修改顏色</span>
    </div>
    <div v-else class="ute-empty">尚未設定標籤</div>

    <!-- 新增 / 修改列 -->
    <div class="ute-form" :class="{ 'is-editing': editingIndex !== null }">
      <div class="ute-form-row">
        <v-combobox
          v-model="draft.text"
          :items="suggestionTexts"
          :label="editingIndex === null ? '新增標籤文字' : '修改標籤文字'"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          :maxlength="12"
          class="ute-text"
          @update:model-value="onTextChange"
          @keydown.enter.prevent="commit"
        >
          <template #item="{ props: itemProps, item }">
            <v-list-item v-bind="itemProps" :title="undefined">
              <v-chip size="x-small" label class="mr-2" :style="suggestionChipStyle(item.raw)">{{ item.raw }}</v-chip>
              <span class="text-caption text-grey">已用 {{ suggestionCount(item.raw) }} 戶</span>
            </v-list-item>
          </template>
        </v-combobox>

        <v-chip size="small" label class="ute-preview" :style="{ backgroundColor: draft.bgColor, color: previewTextColor }">
          {{ draft.text || '預覽' }}
        </v-chip>
      </div>

      <div class="ute-form-row ute-colors">
        <span class="ute-label">標籤顏色</span>
        <button
          v-for="c in presetColors"
          :key="c.value"
          type="button"
          class="ute-swatch"
          :class="{ 'is-active': draft.bgColor === c.value }"
          :style="{ backgroundColor: c.value }"
          :title="c.name"
          @click="draft.bgColor = c.value"
        ></button>
        <v-menu :close-on-content-click="false" location="bottom start">
          <template #activator="{ props: menuProps }">
            <button type="button" v-bind="menuProps" class="ute-swatch ute-swatch-custom" :class="{ 'is-active': !isPresetBg }" title="自訂顏色">
              <v-icon size="14">mdi-eyedropper-variant</v-icon>
            </button>
          </template>
          <v-card class="pa-2">
            <v-color-picker v-model="draft.bgColor" mode="hex" :modes="['hex']" width="260" />
          </v-card>
        </v-menu>
      </div>

      <div class="ute-form-row ute-colors">
        <span class="ute-label">文字顏色</span>
        <v-btn-toggle v-model="draft.textMode" color="primary" variant="outlined" density="compact" mandatory>
          <v-btn value="auto" size="x-small">自動（{{ autoTextColor === '#FFFFFF' ? '白' : '黑' }}）</v-btn>
          <v-btn value="custom" size="x-small">自訂</v-btn>
        </v-btn-toggle>
        <template v-if="draft.textMode === 'custom'">
          <button
            v-for="c in textPresetColors"
            :key="c.value"
            type="button"
            class="ute-swatch ute-swatch-sm"
            :class="{ 'is-active': draft.textColor === c.value }"
            :style="{ backgroundColor: c.value }"
            :title="c.name"
            @click="draft.textColor = c.value"
          ></button>
          <v-menu :close-on-content-click="false" location="bottom start">
            <template #activator="{ props: menuProps }">
              <button type="button" v-bind="menuProps" class="ute-swatch ute-swatch-sm ute-swatch-custom" title="自訂文字顏色">
                <v-icon size="12">mdi-eyedropper-variant</v-icon>
              </button>
            </template>
            <v-card class="pa-2">
              <v-color-picker v-model="draft.textColor" mode="hex" :modes="['hex']" width="260" />
            </v-card>
          </v-menu>
        </template>
      </div>

      <div class="ute-form-row ute-actions">
        <v-btn
          size="small"
          color="primary"
          variant="flat"
          :disabled="!canCommit"
          :prepend-icon="editingIndex === null ? 'mdi-tag-plus' : 'mdi-check'"
          @click="commit"
        >
          {{ editingIndex === null ? '新增標籤' : '套用修改' }}
        </v-btn>
        <v-btn v-if="editingIndex !== null" size="small" variant="text" @click="resetDraft">取消修改</v-btn>
        <span v-if="!canAddMore && editingIndex === null" class="ute-hint text-warning">已達上限 {{ max }} 個</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import {
  MAX_UNIT_TAGS, TAG_PRESET_COLORS, DEFAULT_TAG_BG,
  normalizeUnitTags, normalizeHexColor, getContrastTextColor,
} from '@/utils/unitTags';

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  /** [{ text, bgColor, textColor, count }] 由全建案戶別推導的常用標籤 */
  suggestions: { type: Array, default: () => [] },
  max: { type: Number, default: MAX_UNIT_TAGS },
});
const emit = defineEmits(['update:modelValue']);

const presetColors = TAG_PRESET_COLORS;
const textPresetColors = [
  { name: '白', value: '#FFFFFF' },
  { name: '黑', value: '#000000' },
  { name: '黃', value: '#FFEB3B' },
  { name: '紅', value: '#E53935' },
];

const tags = computed(() => normalizeUnitTags(props.modelValue));
const canAddMore = computed(() => tags.value.length < props.max);

const editingIndex = ref(null);
const draft = reactive({ text: '', bgColor: DEFAULT_TAG_BG, textMode: 'auto', textColor: '#FFFFFF' });

const autoTextColor = computed(() => getContrastTextColor(draft.bgColor));
const previewTextColor = computed(() => (draft.textMode === 'custom' ? (normalizeHexColor(draft.textColor) || autoTextColor.value) : autoTextColor.value));
const isPresetBg = computed(() => presetColors.some(c => c.value === normalizeHexColor(draft.bgColor)));

const suggestionTexts = computed(() => props.suggestions.map(s => s.text));
const suggestionMap = computed(() => new Map(props.suggestions.map(s => [s.text, s])));
function suggestionChipStyle(text) {
  const s = suggestionMap.value.get(text);
  return s ? { backgroundColor: s.bgColor, color: s.textColor } : {};
}
function suggestionCount(text) {
  return suggestionMap.value.get(text)?.count || 0;
}

/** 選到既有標籤文字 → 自動帶入同樣顏色，維持全建案一致 */
function onTextChange(val) {
  const text = typeof val === 'string' ? val.trim() : '';
  const s = suggestionMap.value.get(text);
  if (s && editingIndex.value === null) {
    draft.bgColor = s.bgColor;
    const auto = getContrastTextColor(s.bgColor);
    if (s.textColor !== auto) { draft.textMode = 'custom'; draft.textColor = s.textColor; }
    else { draft.textMode = 'auto'; }
  }
}

const canCommit = computed(() => {
  const text = (typeof draft.text === 'string' ? draft.text : '').trim();
  if (!text) return false;
  if (editingIndex.value === null && !canAddMore.value) return false;
  // 同名標籤不可重複（修改自己除外）
  return !tags.value.some((t, i) => t.text === text && i !== editingIndex.value);
});

function resetDraft() {
  editingIndex.value = null;
  draft.text = '';
  draft.bgColor = DEFAULT_TAG_BG;
  draft.textMode = 'auto';
  draft.textColor = '#FFFFFF';
}

function startEdit(idx) {
  const t = tags.value[idx];
  if (!t) return;
  editingIndex.value = idx;
  draft.text = t.text;
  draft.bgColor = t.bgColor;
  const auto = getContrastTextColor(t.bgColor);
  draft.textMode = t.textColor === auto ? 'auto' : 'custom';
  draft.textColor = t.textColor;
}

function commit() {
  if (!canCommit.value) return;
  const bgColor = normalizeHexColor(draft.bgColor) || DEFAULT_TAG_BG;
  const tag = { text: String(draft.text).trim(), bgColor, textColor: previewTextColor.value };
  const next = [...tags.value];
  if (editingIndex.value === null) next.push(tag);
  else next.splice(editingIndex.value, 1, tag);
  emit('update:modelValue', normalizeUnitTags(next));
  resetDraft();
}

function removeTag(idx) {
  const next = tags.value.filter((_, i) => i !== idx);
  emit('update:modelValue', next);
  if (editingIndex.value === idx) resetDraft();
  else if (editingIndex.value !== null && editingIndex.value > idx) editingIndex.value -= 1;
}

// 外部資料整批更換（例如切換戶別）時，放棄進行中的修改
watch(() => props.modelValue, () => { if (editingIndex.value !== null && !tags.value[editingIndex.value]) resetDraft(); });
</script>

<style scoped>
.unit-tag-editor {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 10px 12px;
  background: #fafafa;
}
.ute-header { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px; margin-bottom: 8px; }
.ute-title { font-weight: 600; color: #37474f; }
.ute-hint { font-size: 0.72rem; color: #78909c; }
.ute-empty { font-size: 0.8rem; color: #9e9e9e; margin-bottom: 8px; }
.ute-current { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-bottom: 10px; }
.ute-chip { cursor: pointer; font-weight: 600; border: 1px solid rgba(255,255,255,0.7); }
.ute-chip.is-editing { outline: 2px solid #1e88e5; outline-offset: 1px; }
.ute-form { border-top: 1px dashed #e0e0e0; padding-top: 10px; display: flex; flex-direction: column; gap: 8px; }
.ute-form.is-editing { background: #e3f2fd; margin: 0 -12px -10px; padding: 10px 12px; border-radius: 0 0 8px 8px; }
.ute-form-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.ute-text { flex: 1 1 200px; min-width: 160px; }
.ute-preview { flex: 0 0 auto; font-weight: 600; min-width: 48px; justify-content: center; border: 1px solid rgba(0,0,0,0.12); }
.ute-label { font-size: 0.75rem; color: #546e7a; min-width: 56px; }
.ute-swatch {
  width: 24px; height: 24px; border-radius: 6px; border: 2px solid #fff;
  box-shadow: 0 0 0 1px #cfd8dc; cursor: pointer; padding: 0;
  display: inline-flex; align-items: center; justify-content: center; color: #fff;
}
.ute-swatch.is-active { box-shadow: 0 0 0 2px #1e88e5; transform: scale(1.1); }
.ute-swatch-sm { width: 20px; height: 20px; border-radius: 5px; color: #333; }
.ute-swatch-custom { background: linear-gradient(135deg, #ff5252, #ffab40, #ffee58, #69f0ae, #40c4ff, #b388ff); color: #333; }
.ute-actions { margin-top: 2px; }
</style>
