<template>
  <v-dialog v-model="open" max-width="1180" scrollable persistent>
    <v-card class="info-card-dialog">
      <v-card-title class="d-flex align-center bg-primary text-white py-3">
        <v-icon start>mdi-card-text-outline</v-icon>
        <span>{{ templateMode ? '套用此卡片到其他戶別' : '新增資訊卡' }}</span>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="close" />
      </v-card-title>

      <v-card-text class="pa-0">
        <div class="icd-body">
          <!-- 左：選戶別 -->
          <section class="icd-col icd-col--units">
            <div class="icd-section-title">1. 選擇戶別 <span class="text-caption text-grey">（可多選，一戶一張卡）</span></div>
            <div class="d-flex ga-2 mb-2">
              <v-select v-model="filterBuilding" :items="buildingOptions" label="棟別" density="compact" variant="outlined" hide-details clearable class="flex-1" />
              <v-select v-model="filterFloor" :items="floorOptions" label="樓層" density="compact" variant="outlined" hide-details clearable class="flex-1" />
            </div>
            <v-text-field v-model="unitSearch" prepend-inner-icon="mdi-magnify" label="搜尋戶別" density="compact" variant="outlined" hide-details clearable class="mb-2" />
            <div class="d-flex align-center justify-space-between mb-1">
              <span class="text-caption text-grey">符合 {{ filteredUnits.length }} 戶，已選 {{ selectedUnitIds.length }} 戶</span>
              <div>
                <v-btn size="x-small" variant="text" @click="selectAllFiltered">全選符合</v-btn>
                <v-btn size="x-small" variant="text" @click="selectedUnitIds = []">清除</v-btn>
              </div>
            </div>
            <div class="icd-unit-list">
              <label v-for="u in filteredUnits" :key="u.unitId" class="icd-unit-item" :class="{ 'is-selected': selectedSet.has(u.unitId) }">
                <input type="checkbox" :checked="selectedSet.has(u.unitId)" @change="toggleUnit(u.unitId)" />
                <span class="icd-unit-id">{{ u.unitId }}</span>
                <span class="icd-unit-status" :class="statusClass(u)">{{ u.salesStatus_backend || '-' }}</span>
              </label>
              <div v-if="!filteredUnits.length" class="text-caption text-grey pa-3 text-center">沒有符合的戶別</div>
            </div>
          </section>

          <!-- 中：選欄位 -->
          <section class="icd-col icd-col--fields">
            <div class="icd-section-title">2. 選擇欄位</div>
            <div class="d-flex flex-wrap ga-1 mb-2">
              <v-chip v-for="p in presets" :key="p.key" size="small" variant="tonal" color="primary" @click="applyPreset(p)">{{ p.label }}</v-chip>
              <v-chip v-if="savedPreset" size="small" variant="tonal" color="teal" prepend-icon="mdi-star" @click="applyPreset(savedPreset)">記住的組合</v-chip>
              <v-chip size="small" variant="outlined" prepend-icon="mdi-content-save-outline" :disabled="!selectedFieldKeys.length" @click="rememberPreset">記住此組合</v-chip>
            </div>
            <v-text-field v-model="fieldSearch" prepend-inner-icon="mdi-magnify" label="搜尋欄位" density="compact" variant="outlined" hide-details clearable class="mb-2" />
            <div class="icd-field-groups">
              <v-expansion-panels v-model="openGroups" multiple variant="accordion">
                <v-expansion-panel v-for="g in visibleGroups" :key="g.key" :value="g.key">
                  <v-expansion-panel-title class="py-2">
                    <span class="font-weight-medium">{{ g.title }}</span>
                    <v-chip v-if="g.internal" size="x-small" color="warning" variant="tonal" class="ml-2" prepend-icon="mdi-alert-outline">內部資料</v-chip>
                    <span class="text-caption text-grey ml-2">{{ g.selectedCount ? `已選 ${g.selectedCount}` : '' }}</span>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <div class="icd-field-grid">
                      <label v-for="f in g.fields" :key="f.key" class="icd-field-item" :class="{ 'is-selected': selectedFieldSet.has(f.key) }">
                        <input type="checkbox" :checked="selectedFieldSet.has(f.key)" @change="toggleField(f.key)" />
                        <span>{{ f.title }}</span>
                      </label>
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </div>
          </section>

          <!-- 右：已選欄位排序 / 選項 / 預覽 -->
          <section class="icd-col icd-col--preview">
            <div class="icd-section-title">3. 排序與預覽</div>
            <draggable v-model="selectedFieldKeys" :item-key="(k) => k" handle=".drag-handle" class="icd-selected-list" ghost-class="icd-ghost">
              <template #item="{ element: key }">
                <div class="icd-selected-item">
                  <v-icon size="18" class="drag-handle text-grey">mdi-drag-vertical</v-icon>
                  <span class="flex-1 text-truncate">{{ fieldTitle(key) }}</span>
                  <v-btn icon="mdi-close" size="x-small" variant="text" @click="toggleField(key)" />
                </div>
              </template>
            </draggable>
            <div v-if="!selectedFieldKeys.length" class="text-caption text-grey text-center py-2">尚未選擇欄位</div>

            <div class="icd-options mt-2">
              <v-switch v-model="showHeader" label="顯示標題列（戶別）" density="compact" hide-details color="primary" />
              <v-switch v-model="showLabelColumn" label="顯示項目欄" density="compact" hide-details color="primary" />
              <v-switch v-model="shortLabel" label="使用簡短名稱" density="compact" hide-details color="primary" />
              <v-btn-toggle v-model="priceUnit" mandatory density="compact" variant="outlined" divided class="mt-1">
                <v-btn value="wan" size="small">價格：萬</v-btn>
                <v-btn value="yuan" size="small">價格：元</v-btn>
              </v-btn-toggle>
            </div>

            <div class="icd-section-title mt-3">預覽 <span class="text-caption text-grey">{{ previewUnit ? previewUnit.unitId : '' }}</span></div>
            <div class="icd-preview">
              <div v-if="previewRows.length || showHeader" class="icd-preview-card" :style="previewCardStyle">
                <div v-if="showHeader" class="icd-preview-header" :style="{ background: style.headerFill, color: style.headerTextColor }">{{ previewUnit?.unitId || '戶別' }}</div>
                <table>
                  <tbody>
                    <tr v-for="row in previewRows" :key="row.fieldKey">
                      <td v-if="showLabelColumn" :style="{ background: style.labelFill, color: style.labelTextColor, textAlign: style.labelAlign, borderColor: style.innerStroke }">{{ row.label }}</td>
                      <td :style="{ color: style.valueTextColor, textAlign: style.valueAlign, borderColor: style.innerStroke }">{{ row.value || '—' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="text-caption text-grey text-center py-4">選擇戶別與欄位後顯示預覽</div>
            </div>
          </section>
        </div>
      </v-card-text>

      <v-divider />
      <v-card-actions class="px-4 py-3">
        <span class="text-caption text-grey">
          將建立 <b>{{ selectedUnitIds.length }}</b> 張資訊卡
          <span v-if="hasInternalSelected" class="text-warning ml-2"><v-icon size="14">mdi-alert-outline</v-icon> 含內部資料欄位</span>
        </span>
        <v-spacer />
        <v-btn variant="text" @click="close">取消</v-btn>
        <v-btn color="primary" variant="flat" :disabled="!canInsert" @click="insert">插入到圖面</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import draggable from 'vuedraggable';
import { buildDrawingFieldGroups, isDrawingInternalField } from '@/constants/householdColumns';
import { buildInfoCardRows, getFieldLabel } from '@/utils/salesDrawing/fieldFormat';
import { DEFAULT_INFO_CARD_STYLE } from '@/utils/salesDrawing/drawingSchema';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: String, required: true },
  households: { type: Array, default: () => [] },   // 已含計算欄位
  planIdToName: { type: Object, default: null },    // Map
  defaultStyle: { type: Object, default: null },
  /** 以此卡為範本：{ fieldKeys, showHeader, showLabelColumn, style, layout } */
  template: { type: Object, default: null },
});
const emit = defineEmits(['update:modelValue', 'insert']);

const open = computed({ get: () => props.modelValue, set: v => emit('update:modelValue', v) });
const templateMode = computed(() => !!props.template);

const allGroups = buildDrawingFieldGroups();
const fieldTitleMap = new Map(allGroups.flatMap(g => g.fields.map(f => [f.key, f.title])));

/* 戶別 */
const filterBuilding = ref(null);
const filterFloor = ref(null);
const unitSearch = ref('');
const selectedUnitIds = ref([]);
const selectedSet = computed(() => new Set(selectedUnitIds.value));

const buildingOptions = computed(() => [...new Set(props.households.map(u => u.building).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'zh-Hant', { numeric: true })));
const floorOptions = computed(() => {
  const list = props.households.filter(u => !filterBuilding.value || u.building === filterBuilding.value);
  return [...new Set(list.map(u => u.floor).filter(v => v !== undefined && v !== null && v !== ''))]
    .sort((a, b) => String(a).localeCompare(String(b), 'zh-Hant', { numeric: true }));
});
const filteredUnits = computed(() => {
  const q = (unitSearch.value || '').trim().toLowerCase();
  return props.households
    .filter(u => !filterBuilding.value || u.building === filterBuilding.value)
    .filter(u => filterFloor.value === null || filterFloor.value === undefined || String(u.floor) === String(filterFloor.value))
    .filter(u => !q || String(u.unitId || '').toLowerCase().includes(q))
    .slice()
    .sort((a, b) => String(a.unitId).localeCompare(String(b.unitId), 'zh-Hant', { numeric: true }));
});
function toggleUnit(id) {
  const i = selectedUnitIds.value.indexOf(id);
  if (i >= 0) selectedUnitIds.value.splice(i, 1); else selectedUnitIds.value.push(id);
}
function selectAllFiltered() {
  const set = new Set(selectedUnitIds.value);
  filteredUnits.value.forEach(u => set.add(u.unitId));
  selectedUnitIds.value = [...set];
}
function statusClass(u) {
  const s = u.salesStatus_backend || '';
  if (['簽約', '補足', '小訂', '售出'].some(k => s.includes(k))) return 'is-sold';
  if (s.includes('保留')) return 'is-hold';
  return '';
}

/* 欄位 */
const fieldSearch = ref('');
const selectedFieldKeys = ref([]);
const selectedFieldSet = computed(() => new Set(selectedFieldKeys.value));
const openGroups = ref(allGroups.filter(g => g.expanded).map(g => g.key));
const visibleGroups = computed(() => {
  const q = (fieldSearch.value || '').trim().toLowerCase();
  return allGroups.map(g => {
    const fields = q ? g.fields.filter(f => f.title.toLowerCase().includes(q) || f.key.toLowerCase().includes(q)) : g.fields;
    return { ...g, fields, selectedCount: g.fields.filter(f => selectedFieldSet.value.has(f.key)).length };
  }).filter(g => g.fields.length > 0);
});
watch(fieldSearch, (q) => { if (q) openGroups.value = allGroups.map(g => g.key); });
function toggleField(key) {
  const i = selectedFieldKeys.value.indexOf(key);
  if (i >= 0) selectedFieldKeys.value.splice(i, 1); else selectedFieldKeys.value.push(key);
}
function fieldTitle(key) { return fieldTitleMap.get(key) || key; }
const hasInternalSelected = computed(() => selectedFieldKeys.value.some(isDrawingInternalField));

const presets = [
  { key: 'area', label: '面積組', keys: ['area_house_ping', 'area_main_ping', 'area_ancillary_ping', 'area_common_ping', 'common_area_ratio'] },
  { key: 'price', label: '價格組', keys: ['area_house_ping', 'price_list_house_total', 'unit_price_list'] },
  { key: 'basic', label: '基本組', keys: ['layout', 'area_house_ping', 'price_list_house_total'] },
];
const presetStorageKey = computed(() => `salesDrawing.fieldPreset.${props.projectId}`);
const savedPreset = ref(null);
function loadSavedPreset() {
  try {
    const raw = localStorage.getItem(presetStorageKey.value);
    savedPreset.value = raw ? { key: 'saved', label: '記住的組合', ...JSON.parse(raw) } : null;
  } catch { savedPreset.value = null; }
}
function rememberPreset() {
  try {
    const data = { keys: [...selectedFieldKeys.value], showHeader: showHeader.value, showLabelColumn: showLabelColumn.value, shortLabel: shortLabel.value, priceUnit: priceUnit.value };
    localStorage.setItem(presetStorageKey.value, JSON.stringify(data));
    loadSavedPreset();
  } catch { /* ignore */ }
}
function applyPreset(p) {
  selectedFieldKeys.value = p.keys.filter(k => fieldTitleMap.has(k));
  if (p.showHeader !== undefined) showHeader.value = p.showHeader;
  if (p.showLabelColumn !== undefined) showLabelColumn.value = p.showLabelColumn;
  if (p.shortLabel !== undefined) shortLabel.value = p.shortLabel;
  if (p.priceUnit !== undefined) priceUnit.value = p.priceUnit;
}

/* 選項與預覽 */
const showHeader = ref(true);
const showLabelColumn = ref(true);
const shortLabel = ref(true);
const priceUnit = ref('wan');
const style = computed(() => ({ ...DEFAULT_INFO_CARD_STYLE, ...(props.template?.style || props.defaultStyle || {}) }));
const formatOpts = computed(() => ({ shortLabel: shortLabel.value, priceUnit: priceUnit.value, planIdToName: props.planIdToName }));
const previewUnit = computed(() => {
  const first = selectedUnitIds.value[0];
  return (first && props.households.find(u => u.unitId === first)) || filteredUnits.value[0] || null;
});
const previewRows = computed(() => previewUnit.value ? buildInfoCardRows(previewUnit.value, selectedFieldKeys.value, formatOpts.value) : []);
const previewCardStyle = computed(() => ({
  background: style.value.fill,
  borderColor: style.value.stroke,
  borderWidth: `${style.value.strokeWidth}px`,
  borderRadius: `${style.value.borderRadius}px`,
  fontSize: `${style.value.fontSize}px`,
  fontFamily: style.value.fontFamily,
  fontWeight: style.value.fontWeight,
}));

const canInsert = computed(() => selectedUnitIds.value.length > 0 && (selectedFieldKeys.value.length > 0 || showHeader.value));

function insert() {
  const cards = selectedUnitIds.value.map(id => {
    const unit = props.households.find(u => u.unitId === id);
    if (!unit) return null;
    return {
      unitDocId: unit.id || `${props.projectId}_${unit.unitId}`,
      unitId: unit.unitId,
      header: { show: showHeader.value, text: String(unit.unitId), overridden: false },
      rows: buildInfoCardRows(unit, selectedFieldKeys.value, formatOpts.value),
      layout: { ...(props.template?.layout || {}), colWidths: props.template?.layout?.colWidths || null, rowHeights: null, showLabelColumn: showLabelColumn.value },
      style: { ...style.value },
      format: { shortLabel: shortLabel.value, priceUnit: priceUnit.value },
    };
  }).filter(Boolean);
  emit('insert', cards);
  close();
}

function close() { open.value = false; }

function resetFromTemplate() {
  const t = props.template;
  if (t) {
    selectedFieldKeys.value = (t.fieldKeys || []).filter(k => fieldTitleMap.has(k));
    showHeader.value = t.showHeader !== false;
    showLabelColumn.value = t.showLabelColumn !== false;
    if (t.shortLabel !== undefined) shortLabel.value = t.shortLabel;
    if (t.priceUnit !== undefined) priceUnit.value = t.priceUnit;
    selectedUnitIds.value = [];
  }
}

watch(() => props.modelValue, (v) => {
  if (!v) return;
  loadSavedPreset();
  resetFromTemplate();
  if (!props.template && !selectedFieldKeys.value.length && savedPreset.value) applyPreset(savedPreset.value);
});
</script>

<style scoped>
.icd-body { display: grid; grid-template-columns: 260px 1fr 320px; min-height: 520px; max-height: 70vh; }
.icd-col { padding: 14px 16px; overflow: auto; display: flex; flex-direction: column; min-height: 0; }
.icd-col + .icd-col { border-left: 1px solid rgba(0,0,0,0.08); }
.icd-col > :deep(.v-input), .icd-col > :deep(.v-btn-toggle) { flex: 0 0 auto; }
.icd-section-title { font-weight: 600; font-size: 14px; margin-bottom: 8px; color: #1f2937; }
.flex-1 { flex: 1; min-width: 0; }
.icd-unit-list { flex: 1; min-height: 0; overflow: auto; border: 1px solid rgba(0,0,0,0.12); border-radius: 6px; }
.icd-unit-item { display: flex; align-items: center; gap: 8px; padding: 5px 10px; cursor: pointer; font-size: 13px; border-bottom: 1px solid rgba(0,0,0,0.05); }
.icd-unit-item:hover { background: #f3f4f6; }
.icd-unit-item.is-selected { background: #eef2ff; }
.icd-unit-id { flex: 1; font-weight: 500; }
.icd-unit-status { font-size: 11px; color: #6b7280; }
.icd-unit-status.is-sold { color: #dc2626; }
.icd-unit-status.is-hold { color: #d97706; }
.icd-field-groups { flex: 1; min-height: 0; overflow: auto; }
.icd-field-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 4px 10px; }
.icd-field-item { display: flex; align-items: center; gap: 6px; font-size: 13px; padding: 3px 6px; border-radius: 4px; cursor: pointer; }
.icd-field-item:hover { background: #f3f4f6; }
.icd-field-item.is-selected { background: #eef2ff; color: #1e3a8a; }
.icd-selected-list { display: flex; flex-direction: column; gap: 2px; }
.icd-selected-item { display: flex; align-items: center; gap: 6px; padding: 2px 4px 2px 2px; background: #f9fafb; border: 1px solid rgba(0,0,0,0.08); border-radius: 4px; font-size: 13px; }
.drag-handle { cursor: grab; }
.icd-ghost { opacity: 0.4; }
.icd-options { display: flex; flex-direction: column; }
.icd-preview { background: #e5e7eb; border-radius: 6px; padding: 12px; min-height: 120px; display: flex; align-items: flex-start; justify-content: center; overflow: auto; }
.icd-preview-card { border-style: solid; overflow: hidden; min-width: 160px; }
.icd-preview-header { text-align: center; font-weight: 700; padding: 6px 8px; }
.icd-preview-card table { border-collapse: collapse; width: 100%; }
.icd-preview-card td { padding: 5px 8px; border-bottom: 1px solid; border-color: #ccc; white-space: nowrap; }
.icd-preview-card td + td { border-left: 1px solid; }
.icd-preview-card tr:last-child td { border-bottom: none; }
@media (max-width: 960px) {
  .icd-body { grid-template-columns: 1fr; max-height: none; }
  .icd-col + .icd-col { border-left: none; border-top: 1px solid rgba(0,0,0,0.08); }
  .icd-unit-list { max-height: 220px; }
}
</style>
