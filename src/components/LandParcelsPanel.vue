<template>
  <v-expansion-panels v-model="expanded" class="land-parcels-panel" flat variant="accordion">
    <v-expansion-panel elevation="0">
      <v-expansion-panel-title class="land-parcels-title">
        <div class="d-flex align-center">
          <v-icon size="small" class="mr-1" color="brown">mdi-map-marker-multiple</v-icon>
          <span class="font-weight-medium">土地標的清冊</span>
          <v-chip size="x-small" class="ml-2" :color="parcels.length > 0 ? 'primary' : 'grey'" variant="tonal">
            {{ parcels.length }} 筆
          </v-chip>
        </div>
      </v-expansion-panel-title>

      <v-expansion-panel-text>
        <!-- ── 檢視模式 ── -->
        <div v-if="!editable">
          <div v-if="parcels.length === 0" class="text-caption text-grey text-center py-3">
            尚無土地資料
          </div>
          <div v-else class="land-parcel-view-table">
            <div class="lp-row lp-header">
              <div class="lp-col-idx">#</div>
              <div class="lp-col-city">縣市</div>
              <div class="lp-col-district">區域</div>
              <div class="lp-col-section">段小段</div>
              <div class="lp-col-number">地號</div>
              <div class="lp-col-area">面積(m²)</div>
              <div class="lp-col-rights">權利範圍</div>
              <div class="lp-col-zone">分區</div>
            </div>
            <div v-for="(p, idx) in parcels" :key="p.id || idx" class="lp-row">
              <div class="lp-col-idx">{{ idx + 1 }}</div>
              <div class="lp-col-city">{{ p.city || '—' }}</div>
              <div class="lp-col-district">{{ p.district || '—' }}</div>
              <div class="lp-col-section">{{ p.section || '—' }}</div>
              <div class="lp-col-number">{{ p.parcelNumber || '—' }}</div>
              <div class="lp-col-area">{{ formatArea(p.landAreaSqm) }}</div>
              <div class="lp-col-rights">
                <span>{{ formatRights(p) }}</span>
                <span v-if="rightsPercent(p)" class="text-caption text-grey ml-1">({{ rightsPercent(p) }})</span>
              </div>
              <div class="lp-col-zone">
                <span v-if="p.zoneText">{{ p.zoneText }}</span>
                <span v-if="p.zoneCategory" class="text-caption text-grey ml-1">{{ p.zoneCategory }}</span>
                <span v-if="!p.zoneText && !p.zoneCategory">—</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ── 編輯模式 ── -->
        <div v-else>
          <div class="d-flex justify-end mb-2">
            <v-btn size="small" color="primary" variant="tonal" prepend-icon="mdi-plus" @click="addParcel">
              新增土地
            </v-btn>
          </div>

          <div v-if="parcels.length === 0" class="text-caption text-grey text-center py-3">
            尚無土地資料，請點擊上方「新增土地」
          </div>

          <div v-for="(p, idx) in parcels" :key="p.id || idx" class="land-parcel-edit-card mb-3">
            <div class="d-flex align-center mb-2">
              <div class="text-subtitle-2 font-weight-medium">
                土地 #{{ idx + 1 }}
              </div>
              <v-spacer></v-spacer>
              <v-btn icon size="small" variant="text" color="error" @click="confirmRemove(idx)">
                <v-icon size="small">mdi-delete</v-icon>
              </v-btn>
            </div>

            <v-row dense>
              <v-col cols="6" md="3">
                <v-select
                  :model-value="p.cityCode"
                  :items="cityOptions"
                  item-title="name"
                  item-value="code"
                  label="縣市"
                  variant="outlined"
                  density="compact"
                  hide-details="auto"
                  clearable
                  @update:model-value="v => onCityChange(idx, v)"
                />
              </v-col>
              <v-col cols="6" md="3">
                <v-select
                  :model-value="p.districtCode"
                  :items="districtOptionsFor(p.cityCode)"
                  item-title="name"
                  item-value="code"
                  label="區域"
                  variant="outlined"
                  density="compact"
                  hide-details="auto"
                  clearable
                  :disabled="!p.cityCode"
                  @update:model-value="v => onDistrictChange(idx, v)"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-autocomplete
                  :model-value="p.sectionCode"
                  :items="sectionOptionsFor(p.cityCode, p.districtCode)"
                  item-title="section"
                  item-value="sectCode"
                  label="段小段"
                  variant="outlined"
                  density="compact"
                  hide-details="auto"
                  clearable
                  :disabled="!p.cityCode || !p.districtCode"
                  :loading="isSectionLoading(p.cityCode, p.districtCode)"
                  :no-data-text="!p.districtCode ? '請先選擇區域' : '無資料或載入失敗'"
                  @update:model-value="v => onSectionChange(idx, v)"
                  @update:focused="focused => focused && ensureSectionsLoaded(p.cityCode, p.districtCode)"
                />
              </v-col>

              <v-col cols="6" md="3">
                <v-text-field
                  :model-value="p.parcelNumber"
                  label="地號"
                  variant="outlined"
                  density="compact"
                  hide-details="auto"
                  placeholder="例: 123-4"
                  @update:model-value="v => update(idx, 'parcelNumber', v)"
                />
              </v-col>
              <v-col cols="6" md="3">
                <v-text-field
                  :model-value="p.landAreaSqm"
                  label="土地面積(m²)"
                  variant="outlined"
                  density="compact"
                  hide-details="auto"
                  type="number"
                  step="0.01"
                  @update:model-value="v => update(idx, 'landAreaSqm', toNumberOrNull(v))"
                />
              </v-col>
              <v-col cols="6" md="3">
                <v-select
                  :model-value="p.rightsType"
                  :items="rightsTypeOptions"
                  label="權利範圍類型"
                  variant="outlined"
                  density="compact"
                  hide-details="auto"
                  clearable
                  @update:model-value="v => onRightsTypeChange(idx, v)"
                />
              </v-col>
              <v-col cols="6" md="3">
                <div class="d-flex align-center gap-1">
                  <v-text-field
                    :model-value="p.rightsNumerator"
                    label="分子"
                    variant="outlined"
                    density="compact"
                    hide-details="auto"
                    type="number"
                    :disabled="p.rightsType === '全部'"
                    @update:model-value="v => update(idx, 'rightsNumerator', toNumberOrNull(v))"
                  />
                  <span class="mx-1">/</span>
                  <v-text-field
                    :model-value="p.rightsDenominator"
                    label="分母"
                    variant="outlined"
                    density="compact"
                    hide-details="auto"
                    type="number"
                    :disabled="p.rightsType === '全部'"
                    @update:model-value="v => update(idx, 'rightsDenominator', toNumberOrNull(v))"
                  />
                </div>
                <div v-if="rightsPercent(p)" class="text-caption text-grey mt-1">
                  ≈ {{ rightsPercent(p) }}
                </div>
              </v-col>

              <v-col cols="6" md="3">
                <v-select
                  :model-value="p.zoneText"
                  :items="zoneCategoryOptions"
                  label="都市土地使用分區"
                  variant="outlined"
                  density="compact"
                  hide-details="auto"
                  clearable
                  @update:model-value="v => update(idx, 'zoneText', v || '')"
                />
              </v-col>
              <v-col cols="12" md="9">
                <v-text-field
                  :model-value="p.zoneCategory"
                  label="次類別名稱"
                  variant="outlined"
                  density="compact"
                  hide-details="auto"
                  placeholder="例: 第三種住宅區"
                  @update:model-value="v => update(idx, 'zoneCategory', v)"
                />
              </v-col>
            </v-row>
          </div>
        </div>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup>
import { ref, computed } from 'vue';
import { CITIES, TOWNS } from '@/constants/landOfficeCodeTable';
import {
  RIGHTS_TYPE_OPTIONS,
  ZONE_CATEGORY_OPTIONS,
  createEmptyLandParcel,
} from '@/constants/landParcelColumns';
import { fetchLandSections, getCachedLandSections } from '@/composables/useLandSections';

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  editable: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue']);

const expanded = ref([]); // 預設收合

const parcels = computed(() => props.modelValue || []);
const cityOptions = CITIES;
const rightsTypeOptions = RIGHTS_TYPE_OPTIONS;
const zoneCategoryOptions = ZONE_CATEGORY_OPTIONS;

// ── 區域依縣市過濾（memoize by cityCode）──
const districtsCache = new Map();
function districtOptionsFor(cityCode) {
  if (!cityCode) return [];
  if (!districtsCache.has(cityCode)) {
    districtsCache.set(cityCode, TOWNS.filter(t => t.cityCode === cityCode));
  }
  return districtsCache.get(cityCode);
}

// ── 段小段：非同步載入，loadingMap / sectionsMap 驅動重繪 ──
const sectionsMap = ref({}); // key = `${cityCode}${townCode}` → LandSection[]
const loadingMap = ref({});  // key = `${cityCode}${townCode}` → boolean

function sectionKey(cityCode, districtCode) {
  return cityCode && districtCode ? `${cityCode}${districtCode}` : '';
}

function sectionOptionsFor(cityCode, districtCode) {
  const key = sectionKey(cityCode, districtCode);
  if (!key) return [];
  // 優先讀本地 state；其次查模組層快取（可能由別的元件打過 API）
  if (sectionsMap.value[key]) return sectionsMap.value[key];
  const cached = getCachedLandSections(cityCode, districtCode);
  return cached || [];
}

function isSectionLoading(cityCode, districtCode) {
  const key = sectionKey(cityCode, districtCode);
  return key ? !!loadingMap.value[key] : false;
}

async function ensureSectionsLoaded(cityCode, districtCode) {
  const key = sectionKey(cityCode, districtCode);
  if (!key || sectionsMap.value[key] || loadingMap.value[key]) return;
  loadingMap.value[key] = true;
  try {
    const list = await fetchLandSections(cityCode, districtCode);
    sectionsMap.value[key] = list || [];
  } catch (err) {
    console.warn('[LandParcelsPanel] 段小段載入失敗', key, err);
    sectionsMap.value[key] = [];
  } finally {
    loadingMap.value[key] = false;
  }
}

// ── 編輯操作：emit 整個陣列出去（不就地改 props）──
function commit(nextList) {
  emit('update:modelValue', nextList);
}

function update(idx, key, value) {
  const next = parcels.value.map((p, i) => (i === idx ? { ...p, [key]: value } : p));
  commit(next);
}

function onCityChange(idx, cityCode) {
  const city = CITIES.find(c => c.code === cityCode);
  const next = parcels.value.map((p, i) => {
    if (i !== idx) return p;
    return {
      ...p,
      cityCode: cityCode || '',
      city: city ? city.name : '',
      // 清空下層
      districtCode: '', district: '',
      sectionCode: '', section: '',
    };
  });
  commit(next);
}

function onDistrictChange(idx, districtCode) {
  const p = parcels.value[idx];
  const town = TOWNS.find(t => t.cityCode === p.cityCode && t.code === districtCode);
  const next = parcels.value.map((parcel, i) => {
    if (i !== idx) return parcel;
    return {
      ...parcel,
      districtCode: districtCode || '',
      district: town ? town.name : '',
      sectionCode: '', section: '',
    };
  });
  commit(next);
  if (p.cityCode && districtCode) ensureSectionsLoaded(p.cityCode, districtCode);
}

function onSectionChange(idx, sectionCode) {
  const p = parcels.value[idx];
  const options = sectionOptionsFor(p.cityCode, p.districtCode);
  const found = options.find(s => s.sectCode === sectionCode);
  update(idx, 'sectionCode', sectionCode || '');
  // 同步更新 section 文字（在同一 commit 中）
  const next = parcels.value.map((parcel, i) => {
    if (i !== idx) return parcel;
    return {
      ...parcel,
      sectionCode: sectionCode || '',
      section: found ? found.section : '',
    };
  });
  commit(next);
}

function onRightsTypeChange(idx, rightsType) {
  const next = parcels.value.map((p, i) => {
    if (i !== idx) return p;
    if (rightsType === '全部') {
      return { ...p, rightsType, rightsNumerator: 1, rightsDenominator: 1 };
    }
    return { ...p, rightsType: rightsType || '' };
  });
  commit(next);
}

function addParcel() {
  commit([...parcels.value, createEmptyLandParcel()]);
}

function confirmRemove(idx) {
  if (!window.confirm(`確定要刪除土地 #${idx + 1} 嗎？`)) return;
  commit(parcels.value.filter((_, i) => i !== idx));
}

// ── 工具 ──
function toNumberOrNull(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function formatArea(v) {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  return Number.isNaN(n) ? '—' : n.toFixed(2);
}

function formatRights(p) {
  if (p.rightsType === '全部') return '全部';
  if (p.rightsNumerator && p.rightsDenominator) {
    return `${p.rightsNumerator}/${p.rightsDenominator}`;
  }
  return p.rightsType || '—';
}

function rightsPercent(p) {
  if (p.rightsType === '全部') return '100%';
  const num = Number(p.rightsNumerator);
  const den = Number(p.rightsDenominator);
  if (!den || Number.isNaN(num) || Number.isNaN(den)) return '';
  return `${((num / den) * 100).toFixed(2)}%`;
}
</script>

<style scoped>
.land-parcels-panel :deep(.v-expansion-panel-title) {
  min-height: 40px;
  padding: 8px 12px;
}
.land-parcels-panel :deep(.v-expansion-panel-text__wrapper) {
  padding: 8px 12px 12px;
}

/* ── 檢視模式表格 ── */
.land-parcel-view-table {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
}
.lp-row {
  display: grid;
  grid-template-columns: 36px 1fr 1fr 1.5fr 1fr 1fr 1.2fr 1.2fr;
  gap: 8px;
  padding: 4px 6px;
  border-bottom: 1px solid #eee;
  align-items: center;
}
.lp-header {
  background: #f5f5f5;
  font-weight: 600;
  color: #555;
  border-bottom: 1px solid #ddd;
}
.lp-col-idx { color: #999; text-align: center; }
.lp-col-area { text-align: right; font-variant-numeric: tabular-nums; }

@media (max-width: 768px) {
  .lp-row {
    grid-template-columns: 1fr 1fr;
    row-gap: 4px;
  }
  .lp-header { display: none; }
  .lp-col-idx::before { content: '#'; margin-right: 4px; }
  .lp-col-city::before { content: '縣市: '; color: #999; }
  .lp-col-district::before { content: '區域: '; color: #999; }
  .lp-col-section::before { content: '段小段: '; color: #999; }
  .lp-col-number::before { content: '地號: '; color: #999; }
  .lp-col-area::before { content: '面積(m²): '; color: #999; }
  .lp-col-rights::before { content: '權利範圍: '; color: #999; }
  .lp-col-zone::before { content: '分區: '; color: #999; }
}

/* ── 編輯模式卡片 ── */
.land-parcel-edit-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  background: #fafafa;
}
.gap-1 { gap: 4px; }
</style>
