<template>
  <v-dialog
    :model-value="modelValue"
    max-width="760"
    scrollable
    content-class="mac-dialog-fit"
    :persistent="saving"
    @update:model-value="v => !v && close()"
  >
    <v-card class="mac-sheet siu">
      <div class="mac-sheet-head">
        <span v-if="images.length === 1" class="siu-thumb"><img :src="images[0].src" alt="" /></span>
        <v-icon v-else size="18">mdi-home-edit-outline</v-icon>
        <span class="siu-title">使用戶別<span class="siu-title-sub">{{ subject }}</span></span>
        <button type="button" class="mac-sheet-close" title="關閉" :disabled="saving" @click="close">
          <v-icon size="18">mdi-close</v-icon>
        </button>
      </div>

      <div class="mac-sheet-section siu-filters">
        <div v-if="isBatch" class="mac-form-seg mac-form-seg--block" role="tablist">
          <button
            v-for="opt in MODE_OPTIONS"
            :key="opt.value"
            type="button"
            role="tab"
            class="mac-form-seg-btn"
            :class="{ 'is-active': mode === opt.value }"
            :disabled="saving"
            @click="setMode(opt.value)"
          >{{ opt.label }}</button>
        </div>
        <div v-if="options.buildings.length > 1" class="siu-filter-row">
          <span class="siu-filter-label">棟別</span>
          <div class="siu-chips">
            <button
              v-for="b in options.buildings"
              :key="b.value"
              type="button"
              class="siu-chip"
              :class="{ 'is-on': buildingSel.includes(b.value) }"
              @click="toggleFilter(buildingSel, b.value)"
            >{{ b.title }}</button>
          </div>
        </div>
        <div v-if="options.floors.length > 1" class="siu-filter-row">
          <span class="siu-filter-label">樓層</span>
          <div class="siu-chips">
            <button
              v-for="f in options.floors"
              :key="f.value"
              type="button"
              class="siu-chip"
              :class="{ 'is-on': floorSel.includes(f.value) }"
              @click="toggleFilter(floorSel, f.value)"
            >{{ f.title }}</button>
          </div>
        </div>
      </div>

      <div class="siu-listbar">
        <span class="siu-muted">{{ visibleUnits.length }} 戶</span>
        <button v-if="buildingSel.length || floorSel.length" type="button" class="mac-link-btn" @click="clearFilters">清除篩選</button>
        <span class="mac-spacer"></span>
        <button type="button" class="mac-link-btn" :disabled="!visibleUnits.length" @click="setVisible(true)">全選</button>
        <button type="button" class="mac-link-btn" :disabled="!visibleUnits.length" @click="setVisible(false)">全不選</button>
      </div>

      <v-card-text class="pa-0">
        <div v-for="g in groups" :key="g.floorKey" class="siu-floor">
          <button type="button" class="siu-floor-label" :title="`勾選 ${g.label}`" @click="toggleGroup(g)">{{ g.label }}</button>
          <div class="siu-units">
            <button
              v-for="u in g.units"
              :key="u.unitId"
              type="button"
              class="siu-unit"
              :class="{ 'is-on': selected.has(u.unitId), 'is-done': isDone(u) }"
              :disabled="isDone(u)"
              :title="isDone(u) ? '已使用' : ''"
              @click="toggleUnit(u.unitId)"
            >
              <v-icon v-if="selected.has(u.unitId) || isDone(u)" size="13">mdi-check-bold</v-icon>{{ u.unitId }}
            </button>
          </div>
        </div>
        <div v-if="!groups.length" class="mac-list-empty">{{ emptyText }}</div>
      </v-card-text>

      <div class="mac-sheet-foot">
        <span class="siu-summary">{{ summary }}</span>
        <span class="mac-spacer"></span>
        <button type="button" class="mac-btn" :disabled="saving" @click="close">取消</button>
        <button type="button" class="mac-btn mac-btn--primary" :disabled="!changes.length || saving" @click="save">
          <v-progress-circular v-if="saving" indeterminate size="14" width="2"></v-progress-circular>{{ saveLabel }}
        </button>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { updateHouseholdSalesImages } from '@/api.js';
import { useUserStore } from '@/store/user';
import { unitFilterOptions, floorLabel } from '@/utils/salesImages';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: String, required: true },
  // 要設定的圖片列（SalesImageManager 的 row：imageName、src、units）
  images: { type: Array, default: () => [] },
  // buildUnitList 的戶別清單
  units: { type: Array, default: () => [] },
  // 戶別目前引用的圖片：Map<戶別, Set<圖片名稱>>
  unitImages: { type: Map, default: () => new Map() },
});
const emit = defineEmits(['update:modelValue', 'saved']);

const toast = useToast();
const userStore = useUserStore();
const MODE_OPTIONS = [
  { value: 'add', label: '加入戶別' },
  { value: 'remove', label: '移出戶別' },
];

const isBatch = computed(() => props.images.length > 1);
const names = computed(() => props.images.map(img => img.imageName));
const subject = computed(() => (isBatch.value ? `${props.images.length} 張圖片` : (props.images[0]?.imageName || '')));

const mode = ref('edit');
const selected = ref(new Set());
const initial = ref(new Set());
const buildingSel = ref([]);
const floorSel = ref([]);
const saving = ref(false);

const usesAll = u => names.value.every(n => props.unitImages.get(u.unitId)?.has(n));
const usesAny = u => names.value.some(n => props.unitImages.get(u.unitId)?.has(n));
// 批次加入時，已有全部圖片的戶別不必再選
const isDone = u => mode.value === 'add' && usesAll(u);

watch(() => props.modelValue, (open) => {
  if (!open) return;
  buildingSel.value = [];
  floorSel.value = [];
  saving.value = false;
  setMode(isBatch.value ? 'add' : 'edit');
}, { immediate: true });

function setMode(value) {
  mode.value = value;
  initial.value = new Set(value === 'edit' ? (props.images[0]?.units || []) : []);
  selected.value = new Set(initial.value);
}

// 批次移出只列有用到這些圖片的戶別
const pool = computed(() => (mode.value === 'remove' ? props.units.filter(usesAny) : props.units));
const options = computed(() => unitFilterOptions(pool.value));
// 換模式後選項變少，移除已不存在的篩選值
watch(options, ({ buildings, floors }) => {
  const b = new Set(buildings.map(o => o.value));
  const f = new Set(floors.map(o => o.value));
  buildingSel.value = buildingSel.value.filter(v => b.has(v));
  floorSel.value = floorSel.value.filter(v => f.has(v));
});

const visibleUnits = computed(() => pool.value.filter(u => (!buildingSel.value.length || buildingSel.value.includes(u.building))
  && (!floorSel.value.length || floorSel.value.includes(u.floorKey))));
const groups = computed(() => {
  const list = [];
  for (const u of visibleUnits.value) {
    const last = list[list.length - 1];
    if (last?.floorKey === u.floorKey) last.units.push(u);
    else list.push({ floorKey: u.floorKey, label: floorLabel(u.floorKey), units: [u] });
  }
  return list;
});
const emptyText = computed(() => {
  if (!props.units.length) return '尚無戶別資料';
  if (!pool.value.length) return '沒有戶別使用這些圖片';
  return '沒有符合的戶別';
});

function toggleFilter(list, value) {
  const i = list.indexOf(value);
  if (i >= 0) list.splice(i, 1);
  else list.push(value);
}
function clearFilters() {
  buildingSel.value = [];
  floorSel.value = [];
}

function setUnits(list, on) {
  const next = new Set(selected.value);
  list.filter(u => !isDone(u)).forEach(u => (on ? next.add(u.unitId) : next.delete(u.unitId)));
  selected.value = next;
}
const setVisible = on => setUnits(visibleUnits.value, on);
function toggleGroup(g) {
  const pickable = g.units.filter(u => !isDone(u));
  setUnits(pickable, !pickable.every(u => selected.value.has(u.unitId)));
}
function toggleUnit(unitId) {
  const next = new Set(selected.value);
  if (next.has(unitId)) next.delete(unitId);
  else next.add(unitId);
  selected.value = next;
}

// ── 異動 ──
const unitById = computed(() => new Map(props.units.map(u => [u.unitId, u])));
const changes = computed(() => {
  const list = [];
  const push = (unitId, key) => {
    const u = unitById.value.get(unitId);
    if (u) list.push({ docId: u.docId, unitId, [key]: names.value });
  };
  if (mode.value === 'edit') {
    selected.value.forEach(id => !initial.value.has(id) && push(id, 'add'));
    initial.value.forEach(id => !selected.value.has(id) && push(id, 'remove'));
  } else {
    selected.value.forEach(id => push(id, mode.value));
  }
  return list;
});
const addCount = computed(() => changes.value.filter(c => c.add).length);
const removeCount = computed(() => changes.value.filter(c => c.remove).length);

const summary = computed(() => {
  if (mode.value !== 'edit') return selected.value.size ? `已選 ${selected.value.size} 戶` : '';
  const diff = [addCount.value && `+${addCount.value}`, removeCount.value && `−${removeCount.value}`].filter(Boolean).join(' ');
  return `已選 ${selected.value.size} 戶${diff ? `（${diff}）` : ''}`;
});
const saveLabel = computed(() => {
  if (mode.value === 'add') return `加入${addCount.value ? ` ${addCount.value} 戶` : ''}`;
  if (mode.value === 'remove') return `移出${removeCount.value ? ` ${removeCount.value} 戶` : ''}`;
  return '儲存';
});

function close() {
  if (!saving.value) emit('update:modelValue', false);
}

async function save() {
  if (!changes.value.length || saving.value) return;
  saving.value = true;
  const list = changes.value;
  try {
    const res = await updateHouseholdSalesImages({ projectId: props.projectId, userKey: userStore.user?.key || '', changes: list });
    const parts = [addCount.value && `加入 ${addCount.value} 戶`, removeCount.value && `移出 ${removeCount.value} 戶`].filter(Boolean);
    toast.success(`已${parts.join('、')}`);
    if (res?.notFound?.length) toast.warning(`${res.notFound.length} 戶已不存在`);
    if (res?.sheetSyncWarning) toast.warning(res.sheetSyncWarning, { timeout: 8000 });
    emit('saved', list);
    saving.value = false;
    close();
  } catch (e) {
    toast.error(`儲存失敗：${e.message}`);
    emit('saved', []);
    saving.value = false;
  }
}
</script>

<style scoped>
.siu-thumb {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  overflow: hidden;
  background: #f2f2f5;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.12);
}
.siu-thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
.siu-title { min-width: 0; overflow-wrap: anywhere; }
.siu-title-sub { margin-left: 8px; font-weight: 500; color: #6e6e73; }

.siu-filters { display: flex; flex-direction: column; gap: 10px; }
.siu-filter-row { display: flex; align-items: flex-start; gap: 10px; }
.siu-filter-label {
  flex-shrink: 0;
  width: 32px;
  padding-top: 5px;
  font-size: 12px;
  font-weight: 600;
  color: #6e6e73;
}
.siu-chips { display: flex; flex-wrap: wrap; gap: 6px; min-width: 0; }
.siu-chip {
  min-width: 40px;
  height: 28px;
  padding: 0 10px;
  border: 0;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.05);
  color: #1d1d1f;
  font: inherit;
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.12s, color 0.12s;
}
.siu-chip:hover { background: rgba(0, 0, 0, 0.09); }
.siu-chip.is-on { background: #0071e3; color: #fff; }

.siu-listbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: #fafafa;
}
.siu-listbar .mac-spacer { flex: 1 1 auto; }
.siu-muted { font-size: 12.5px; color: #6e6e73; }

.siu-floor {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 16px;
  border-bottom: 1px solid #f0f0f3;
}
.siu-floor-label {
  flex-shrink: 0;
  width: 56px;
  height: 30px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #6e6e73;
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
  padding: 0 6px;
  cursor: pointer;
}
.siu-floor-label:hover { background: rgba(0, 0, 0, 0.05); color: #1d1d1f; }
.siu-units { display: flex; flex-wrap: wrap; gap: 6px; min-width: 0; }
.siu-unit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-width: 64px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid rgba(0, 0, 0, 0.14);
  border-radius: 7px;
  background: #fff;
  color: #1d1d1f;
  font: inherit;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.12s, border-color 0.12s;
}
.siu-unit:hover { border-color: rgba(0, 113, 227, 0.5); }
.siu-unit.is-on { border-color: #0071e3; background: #0071e3; color: #fff; }
.siu-unit.is-on .v-icon { color: #fff; }
.siu-unit.is-done { border-color: transparent; background: rgba(52, 199, 89, 0.14); color: #1f7a35; cursor: default; }
.siu-unit.is-done .v-icon { color: #1f7a35; }

.siu-summary { font-size: 12.5px; font-weight: 600; color: #0058b0; }

@media (max-width: 600px) {
  .siu-floor { padding: 8px 12px; gap: 6px; }
  .siu-floor-label { width: 52px; height: 36px; }
  .siu-unit { height: 36px; min-width: 70px; font-size: 14px; }
  .siu-chip { height: 32px; border-radius: 16px; font-size: 14px; }
  .siu-listbar { padding: 8px 12px; }
}
</style>
