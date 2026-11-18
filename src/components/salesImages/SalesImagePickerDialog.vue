<template>
  <v-dialog
    :model-value="modelValue"
    max-width="880"
    scrollable
    content-class="mac-dialog-fit"
    @update:model-value="v => !v && close()"
  >
    <v-card class="mac-sheet sipk">
      <div class="mac-sheet-head">
        <v-icon size="18">mdi-image-multiple-outline</v-icon>從圖庫挑選
        <span class="mac-page-count">{{ images.length }} 張</span>
        <button type="button" class="mac-sheet-close" title="關閉" @click="close">
          <v-icon size="18">mdi-close</v-icon>
        </button>
      </div>

      <div class="mac-sheet-section sipk-search">
        <v-text-field
          v-model="search"
          placeholder="搜尋名稱、戶別"
          prepend-inner-icon="mdi-magnify"
          variant="solo"
          flat
          density="compact"
          hide-details
          clearable
          class="mac-vfield mac-vfield--search"
        ></v-text-field>
      </div>

      <v-card-text class="pa-0">
        <div v-if="rows.length" class="sipk-grid">
          <button
            v-for="row in rows"
            :key="row.id"
            type="button"
            class="sipk-card"
            :class="{ 'is-selected': selected.has(row.imageName), 'is-added': row.added }"
            :disabled="row.added"
            :title="row.imageName"
            @click="toggle(row)"
          >
            <div class="sipk-thumb">
              <img :src="row.downloadURL" :alt="row.imageName" loading="lazy" />
              <span v-if="row.added" class="mac-tag mac-tag--green sipk-badge">已加入</span>
              <span v-else class="sipk-check" :class="{ 'is-on': selected.has(row.imageName) }">
                <v-icon v-if="selected.has(row.imageName)" size="14" color="white">mdi-check-bold</v-icon>
              </span>
            </div>
            <div class="sipk-name">{{ row.imageName }}</div>
            <div class="sipk-sub">{{ row.units.length ? `${row.units.length} 戶使用` : '未使用' }}</div>
          </button>
        </div>
        <div v-else class="mac-list-empty">{{ images.length ? '找不到符合的圖片' : '圖庫尚無圖片' }}</div>
      </v-card-text>

      <div class="mac-sheet-foot">
        <span v-if="selected.size" class="sipk-count">已選 {{ selected.size }} 張</span>
        <span class="mac-spacer"></span>
        <button type="button" class="mac-btn" :disabled="saving" @click="close">取消</button>
        <button type="button" class="mac-btn mac-btn--primary" :disabled="!selected.size || saving" @click="confirm">
          <v-progress-circular v-if="saving" indeterminate size="14" width="2"></v-progress-circular>
          加入{{ selected.size ? ` ${selected.size} 張` : '' }}
        </button>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  images: { type: Array, default: () => [] },
  // Map<圖片名稱, 戶別陣列>
  usage: { type: Map, default: () => new Map() },
  // 本戶已有的圖片名稱
  addedNames: { type: Array, default: () => [] },
  saving: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const collator = new Intl.Collator('zh-Hant', { numeric: true });
const search = ref('');
const selected = ref(new Set());

watch(() => props.modelValue, (open) => {
  if (open) {
    search.value = '';
    selected.value = new Set();
  }
});

const rows = computed(() => {
  const added = new Set(props.addedNames);
  const q = String(search.value || '').trim().toLowerCase();
  return props.images
    .filter(img => img?.imageName && img.downloadURL)
    .map(img => ({ ...img, units: props.usage.get(img.imageName) || [], added: added.has(img.imageName) }))
    .filter(row => !q || row.imageName.toLowerCase().includes(q) || row.units.some(u => String(u).toLowerCase().includes(q)))
    // 可挑選的排前面，已加入的排後面
    .sort((a, b) => (a.added - b.added) || collator.compare(a.imageName, b.imageName));
});

function toggle(row) {
  if (row.added) return;
  const next = new Set(selected.value);
  if (next.has(row.imageName)) next.delete(row.imageName);
  else next.add(row.imageName);
  selected.value = next;
}

function close() {
  if (props.saving) return;
  emit('update:modelValue', false);
}

function confirm() {
  if (!selected.value.size || props.saving) return;
  // 依圖庫顯示順序加入
  emit('confirm', rows.value.filter(r => selected.value.has(r.imageName)).map(r => r.imageName));
}
</script>

<style scoped>
.sipk-search { padding-top: 10px; padding-bottom: 10px; }
.sipk-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
  gap: 14px;
  padding: 4px 16px 16px;
}
.sipk-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding: 6px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.12s;
}
.sipk-card:hover:not(:disabled) { background: rgba(0, 0, 0, 0.04); }
.sipk-card:focus-visible { outline: 2px solid #0071e3; outline-offset: 1px; }
.sipk-card.is-added { cursor: default; opacity: 0.55; }
.sipk-thumb {
  position: relative;
  aspect-ratio: 4 / 3;
  margin-bottom: 4px;
  border-radius: 8px;
  overflow: hidden;
  background: #e8eaed;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.12);
  transition: box-shadow 0.12s;
}
.sipk-card.is-selected .sipk-thumb { box-shadow: 0 0 0 3px #0071e3; }
.sipk-thumb img { width: 100%; height: 100%; object-fit: contain; display: block; }
.sipk-check {
  position: absolute;
  top: 6px;
  left: 6px;
  display: grid;
  place-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.95);
  background: rgba(0, 0, 0, 0.25);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}
.sipk-check.is-on { border-color: #0071e3; background: #0071e3; }
.sipk-badge { position: absolute; top: 6px; left: 6px; --mac-tag-bg: rgba(255, 255, 255, 0.92); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15); }
.sipk-name {
  font-size: 13px;
  font-weight: 500;
  color: #1d1d1f;
  line-height: 1.35;
  overflow-wrap: anywhere;
}
.sipk-sub { font-size: 12px; color: #6e6e73; }
.sipk-count { font-size: 13px; color: #6e6e73; white-space: nowrap; }

@media (max-width: 600px) {
  .sipk-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; padding: 4px 10px 12px; }
}
</style>
