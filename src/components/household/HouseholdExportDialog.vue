<template>
  <v-dialog :model-value="modelValue" max-width="720" scrollable content-class="mac-dialog-fit" @update:model-value="close">
    <v-card class="mac-sheet hxd">
      <div class="mac-sheet-head">
        <v-icon size="18">mdi-microsoft-excel</v-icon>
        <span>{{ title }}</span>
        <button type="button" class="mac-sheet-close" title="關閉" @click="close"><v-icon size="18">mdi-close</v-icon></button>
      </div>

      <div class="hxd-toolbar">
        <div class="hxd-search">
          <v-icon size="16">mdi-magnify</v-icon>
          <input v-model="keyword" type="search" placeholder="搜尋欄位" aria-label="搜尋欄位">
        </div>
        <span class="mac-spacer"></span>
        <span class="hxd-count">已選 {{ selectedCount }} / {{ totalCount }}</span>
        <button type="button" class="mac-link-btn" @click="toggleAll">{{ allSelected ? '全不選' : '全選' }}</button>
      </div>

      <div class="mac-form hxd-body">
        <template v-for="g in visibleGroups" :key="g.key">
          <div class="mac-form-label hxd-group-label">
            <label class="hxd-group-toggle">
              <input
                type="checkbox"
                class="mac-check"
                :checked="groupState(g) === 'all'"
                :indeterminate.prop="groupState(g) === 'some'"
                @change="toggleGroup(g)"
              >
              <span>{{ g.label }}</span>
            </label>
            <span class="hxd-group-count">{{ groupSelectedCount(g) }} / {{ g.items.length }}</span>
          </div>
          <div class="mac-form-group">
            <div class="mac-form-pad hxd-grid">
              <template v-if="g.key === firstGroupKey && !keyword">
                <label v-for="name in lockedLabels" :key="`locked-${name}`" class="hxd-check is-locked">
                  <input type="checkbox" class="mac-check" checked disabled>
                  <span>{{ name }}</span>
                </label>
              </template>
              <label v-for="item in g.visibleItems" :key="item.key" class="hxd-check">
                <input v-model="selected" type="checkbox" class="mac-check" :value="item.key">
                <span>{{ item.label }}</span>
              </label>
            </div>
          </div>
        </template>
        <div v-if="visibleGroups.length === 0" class="hxd-empty">找不到符合的欄位</div>
      </div>

      <div class="mac-sheet-foot">
        <span class="mac-spacer"></span>
        <button type="button" class="mac-btn" @click="close">取消</button>
        <button type="button" class="mac-btn mac-btn--primary" :disabled="selectedCount === 0" @click="confirm">
          <v-icon size="16">mdi-download</v-icon>下載
        </button>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
/**
 * 下載戶別資料：先選要匯出的欄位（每次開啟預設全選）
 * lockedLabels 為一律匯出的欄位（重新上傳靠它對應戶別），顯示在第一組、不列入選擇。
 * 驗屋預約（HouseholdGrid）與銷控系統（SalesControlSystem）共用。
 */
import { computed, ref, watch } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // [{ key, label, items: [{ key, label }] }]
  groups: { type: Array, default: () => [] },
  title: { type: String, default: '下載戶別資料' },
  lockedLabels: { type: Array, default: () => ['文件ID'] },
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const selected = ref([]);
const keyword = ref('');

const firstGroupKey = computed(() => props.groups[0]?.key);
const allKeys = computed(() => props.groups.flatMap(g => g.items.map(i => i.key)));
const totalCount = computed(() => allKeys.value.length);
const selectedSet = computed(() => new Set(selected.value));
const selectedCount = computed(() => allKeys.value.filter(k => selectedSet.value.has(k)).length);
const allSelected = computed(() => totalCount.value > 0 && selectedCount.value === totalCount.value);

// 每次開啟重設為全選
watch(() => props.modelValue, (open) => {
  if (!open) return;
  selected.value = [...allKeys.value];
  keyword.value = '';
}, { immediate: true });

const visibleGroups = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  return props.groups
    .map(g => ({ ...g, visibleItems: q ? g.items.filter(i => String(i.label).toLowerCase().includes(q)) : g.items }))
    .filter(g => g.visibleItems.length > 0);
});

const groupSelectedCount = (g) => g.items.filter(i => selectedSet.value.has(i.key)).length;
function groupState(g) {
  const n = groupSelectedCount(g);
  if (n === 0) return 'none';
  return n === g.items.length ? 'all' : 'some';
}
function toggleGroup(g) {
  const keys = new Set(g.items.map(i => i.key));
  selected.value = groupState(g) === 'all'
    ? selected.value.filter(k => !keys.has(k))
    : [...new Set([...selected.value, ...keys])];
}
function toggleAll() {
  selected.value = allSelected.value ? [] : [...allKeys.value];
}

function close() {
  emit('update:modelValue', false);
}
function confirm() {
  // 依欄位原本順序回傳
  emit('confirm', allKeys.value.filter(k => selectedSet.value.has(k)));
  close();
}
</script>

<style scoped>
.hxd-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 1px solid #ececf0;
  background: #fff;
}
.hxd-toolbar .mac-spacer { flex: 1 1 auto; }
.hxd-search {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 220px;
  max-width: 100%;
  height: 28px;
  padding: 0 9px;
  border-radius: 7px;
  background: rgba(0, 0, 0, 0.05);
  color: #8e8e93;
}
.hxd-search:focus-within { box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.22); background: #fff; }
.hxd-search input {
  flex: 1 1 auto;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: #1d1d1f;
  font: inherit;
  font-size: 13px;
}
.hxd-search input::placeholder { color: #8e8e93; }
.hxd-count { font-size: 12.5px; color: #6e6e73; white-space: nowrap; }

.hxd-body { padding: 0 16px 16px; overflow-y: auto; }
.hxd-group-label { justify-content: space-between; }
.hxd-group-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #1d1d1f;
  font-size: 12.5px;
  cursor: pointer;
}
.hxd-group-count { font-weight: 500; }

.hxd-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 2px 10px;
  padding: 8px 10px;
}
.hxd-check {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  padding: 4px 6px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.3;
  cursor: pointer;
}
.hxd-check:hover { background: rgba(0, 0, 0, 0.04); }
.hxd-check span { min-width: 0; overflow-wrap: anywhere; }
.hxd-check.is-locked { color: #8e8e93; cursor: default; }
.hxd-check.is-locked:hover { background: none; }
.hxd-empty { padding: 32px 0; color: #8e8e93; text-align: center; font-size: 13px; }

@media (max-width: 599.98px) {
  .hxd-toolbar { flex-wrap: wrap; padding: 10px 12px; }
  .hxd-search { width: 100%; height: 36px; }
  .hxd-search input { font-size: 16px; }
  .hxd-body { padding: 0 12px 12px; }
  .hxd-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .hxd-check { min-height: 40px; font-size: 15px; }
}
</style>
