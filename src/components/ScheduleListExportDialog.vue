<template>
  <v-dialog v-model="isOpen" max-width="1200" scrollable :fullscreen="$vuetify.display.smAndDown">
    <v-card>
      <v-card-title class="d-flex align-center bg-blue-grey-darken-2 text-white">
        <v-icon start>mdi-table-arrow-down</v-icon>
        下載指定日期資料 (EXCEL 列表)
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" size="small" @click="isOpen = false"></v-btn>
      </v-card-title>

      <v-card-text class="pa-0 export-dialog-body d-flex flex-column">
        <!-- 篩選列：全域關鍵字 + 展開式篩選面板（比照銷控「下載指定戶別資料」） -->
        <div class="filter-bar">
          <div class="d-flex align-center gap-2">
            <v-text-field
              v-model="dlgFilters.keyword"
              placeholder="全域搜尋：戶別、預約人、電話、驗屋人員、備註…（可空白分隔多關鍵字）"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              class="flex-grow-1"
            >
              <template #append-inner>
                <span v-if="dlgFilters.keyword && dlgFilters.keyword.trim()" class="text-caption text-grey text-no-wrap">
                  {{ conditionFilteredItems.length }} 筆
                </span>
              </template>
            </v-text-field>
            <v-badge :content="dlgActiveFilterCount" :model-value="dlgActiveFilterCount > 0" color="error">
              <v-btn
                :color="showFilters ? 'primary' : 'black'"
                :variant="showFilters ? 'flat' : 'tonal'"
                size="small"
                prepend-icon="mdi-filter-variant"
                @click="showFilters = !showFilters"
              >篩選</v-btn>
            </v-badge>
          </div>

          <v-expand-transition>
            <div v-if="showFilters" class="mt-2">
              <v-card variant="outlined" class="pa-3">
                <v-row dense>
                  <v-col cols="12" sm="6" md="3">
                    <div class="d-flex flex-column">
                      <span class="text-caption text-grey ml-1">預約日期</span>
                      <div class="d-flex align-center gap-1">
                        <input type="date" v-model="dlgFilters.dateStart" class="date-input-compact">
                        <span class="text-grey">~</span>
                        <input type="date" v-model="dlgFilters.dateEnd" class="date-input-compact">
                      </div>
                    </div>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <v-select
                      v-model="dlgFilters.weekdays"
                      :items="weekdayOptions"
                      label="星期 (多選)"
                      multiple chips closable-chips
                      variant="outlined" density="compact" hide-details clearable
                    ></v-select>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <v-select
                      v-model="dlgFilters.timeSlots"
                      :items="timeSlotOptions"
                      label="時段 (多選)"
                      multiple chips closable-chips
                      variant="outlined" density="compact" hide-details clearable
                      :menu-props="{ maxHeight: 320 }"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <v-select
                      v-model="dlgFilters.statuses"
                      :items="statusOptions"
                      label="狀態 (多選)"
                      multiple chips closable-chips
                      variant="outlined" density="compact" hide-details clearable
                    ></v-select>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <v-select
                      v-model="dlgFilters.types"
                      :items="typeOptions"
                      label="預約項目 (多選)"
                      multiple chips closable-chips
                      variant="outlined" density="compact" hide-details clearable
                    ></v-select>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <v-select
                      v-model="dlgFilters.methods"
                      :items="methodOptions"
                      label="選擇方式 (多選)"
                      multiple chips closable-chips
                      variant="outlined" density="compact" hide-details clearable
                    ></v-select>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <v-select
                      v-model="dlgFilters.sources"
                      :items="sourceOptions"
                      label="來源 (多選)"
                      multiple chips closable-chips
                      variant="outlined" density="compact" hide-details clearable
                    ></v-select>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <v-select
                      v-model="dlgFilters.checkInStatuses"
                      :items="checkInOptions"
                      label="報到狀態 (多選)"
                      multiple chips closable-chips
                      variant="outlined" density="compact" hide-details clearable
                    ></v-select>
                  </v-col>
                </v-row>

                <v-divider class="my-3 border-dashed"></v-divider>

                <v-row dense>
                  <v-col cols="12" sm="6" md="3">
                    <v-autocomplete
                      v-model="dlgFilters.inspectors"
                      :items="inspectorOptions"
                      label="驗屋人員 (多選)"
                      multiple chips closable-chips
                      variant="outlined" density="compact" hide-details clearable
                    ></v-autocomplete>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <v-autocomplete
                      v-model="dlgFilters.companies"
                      :items="companyOptions"
                      label="代驗公司 (多選)"
                      multiple chips closable-chips
                      variant="outlined" density="compact" hide-details clearable
                    ></v-autocomplete>
                  </v-col>
                  <v-col cols="12" sm="6" md="2">
                    <v-select
                      v-if="buildingOptions.length > 0"
                      v-model="dlgFilters.buildings"
                      :items="buildingOptions"
                      label="棟別 (多選)"
                      multiple chips closable-chips
                      variant="outlined" density="compact" hide-details clearable
                    ></v-select>
                  </v-col>
                  <v-col cols="12" sm="6" md="2">
                    <v-text-field
                      v-model="dlgFilters.bookerName"
                      label="預約人姓名"
                      variant="outlined" density="compact" hide-details clearable
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6" md="2">
                    <v-text-field
                      v-model="dlgFilters.buyerName"
                      label="買方姓名"
                      variant="outlined" density="compact" hide-details clearable
                    ></v-text-field>
                  </v-col>
                </v-row>

                <div class="d-flex justify-end mt-2">
                  <v-btn
                    v-if="dlgActiveFilterCount > 0"
                    color="grey-darken-1"
                    variant="text"
                    size="small"
                    prepend-icon="mdi-broom"
                    @click="clearDlgFilters"
                  >清除所有條件</v-btn>
                </div>
              </v-card>
            </div>
          </v-expand-transition>
        </div>

        <v-row no-gutters class="content-row flex-grow-1">
          <!-- 左側：日期勾選（僅列出有預約資料的日期） -->
          <v-col cols="12" md="5" class="d-flex flex-column panel-col border-e">
            <div class="panel-header">
              <div class="d-flex align-center">
                <span class="text-subtitle-2 font-weight-bold">選擇日期</span>
                <span class="text-caption text-medium-emphasis ml-2">（已勾選 {{ visibleSelectedDateCount }} / {{ dateGroups.length }} 天，共 {{ exportItemCount }} 筆）</span>
                <v-spacer></v-spacer>
                <v-btn size="x-small" variant="text" color="primary" @click="selectAllDates">全選</v-btn>
                <v-btn size="x-small" variant="text" color="grey-darken-1" @click="clearAllDates">清除</v-btn>
              </div>
              <div class="text-caption text-medium-emphasis">日期區間預設與時間表相同；調整篩選的日期區間會自動載入該區間資料，僅列出有預約的日期。</div>
            </div>
            <v-progress-linear v-if="fetching" indeterminate color="primary" height="3"></v-progress-linear>
            <div class="panel-scroll">
              <div
                v-for="group in dateGroups"
                :key="group.dateKey"
                class="unit-row d-flex align-center"
                @click="toggleDate(group.dateKey)"
              >
                <v-checkbox-btn
                  :model-value="selectedDateKeys.has(group.dateKey)"
                  density="compact"
                  color="primary"
                  class="flex-grow-0 mr-1"
                  @click.stop="toggleDate(group.dateKey)"
                ></v-checkbox-btn>
                <span class="font-weight-medium date-text" :class="{ 'text-red-darken-1': group.isWeekend }">
                  {{ group.dateKey }}（{{ group.dowLabel }}）
                </span>
                <v-spacer></v-spacer>
                <span class="text-caption status-chip">{{ group.count }} 筆</span>
              </div>
              <div v-if="dateGroups.length === 0" class="text-center text-medium-emphasis py-8 text-body-2">
                沒有符合篩選條件的日期
              </div>
            </div>
          </v-col>

          <!-- 右側：欄位選擇（雙欄拖拉：右=所有欄位，拖到左=匯出欄位並可排序） -->
          <v-col cols="12" md="7" class="d-flex flex-column panel-col">
            <div class="panel-header">
              <div class="d-flex align-center mb-1">
                <span class="text-subtitle-2 font-weight-bold">選擇欄位</span>
                <span class="text-caption text-medium-emphasis ml-2">（已選 {{ selectedColumns.length }} / {{ columns.length }} 欄）</span>
                <v-spacer></v-spacer>
                <v-btn v-if="hasLastSaved" size="x-small" variant="text" color="primary" @click="applyLastSaved">帶入上次設定</v-btn>
              </div>
              <div class="text-caption text-medium-emphasis">
                <v-icon size="x-small">mdi-drag</v-icon>
                從右側「所有欄位」拖曳（或點 <v-icon size="x-small">mdi-plus</v-icon>）到左側成為匯出欄位；左側可拖曳排序，由上而下對應 Excel 由左至右。
              </div>
            </div>
            <div class="column-dual flex-grow-1">
              <!-- 左：匯出欄位（可排序） -->
              <div class="dual-pane border-e">
                <div class="dual-pane-header d-flex align-center">
                  <span class="text-caption font-weight-bold">匯出欄位（依順序）</span>
                  <v-spacer></v-spacer>
                  <v-btn v-if="selectedColumns.length > 0" size="x-small" variant="text" color="grey-darken-1" @click="clearSelectedColumns">清空</v-btn>
                </div>
                <div class="dual-pane-scroll drop-zone">
                  <draggable
                    v-model="selectedColumns"
                    item-key="key"
                    :group="{ name: 'listExportColumns' }"
                    handle=".drag-handle"
                    animation="200"
                    class="draggable-fill"
                  >
                    <template #item="{ element, index }">
                      <div class="column-row column-row--selected d-flex align-center">
                        <v-icon class="drag-handle mr-1" size="small" color="grey">mdi-drag</v-icon>
                        <span class="text-caption text-medium-emphasis order-badge mr-1">{{ index + 1 }}</span>
                        <span class="text-body-2">{{ element.title }}</span>
                        <v-spacer></v-spacer>
                        <v-btn icon="mdi-close" size="x-small" variant="text" color="grey" @click="removeColumn(element)"></v-btn>
                      </div>
                    </template>
                  </draggable>
                  <div v-if="selectedColumns.length === 0" class="drop-placeholder">
                    <v-icon size="large" color="grey-lighten-1">mdi-tray-arrow-down</v-icon>
                    <div class="text-caption text-medium-emphasis mt-1">從右側拖曳欄位到這裡</div>
                  </div>
                </div>
              </div>
              <!-- 右：所有欄位 -->
              <div class="dual-pane">
                <div class="dual-pane-header d-flex align-center">
                  <span class="text-caption font-weight-bold">所有欄位</span>
                  <v-spacer></v-spacer>
                  <v-btn v-if="availableColumns.length > 0" size="x-small" variant="text" color="primary" @click="addAllColumns">全部加入</v-btn>
                </div>
                <div class="px-2 pb-1">
                  <v-text-field
                    v-model="columnKeyword"
                    density="compact"
                    variant="outlined"
                    hide-details
                    clearable
                    prepend-inner-icon="mdi-magnify"
                    placeholder="搜尋欄位名稱"
                  ></v-text-field>
                </div>
                <div class="dual-pane-scroll">
                  <!-- 搜尋中：改為一般清單（點擊/＋加入），確保過濾即時生效 -->
                  <template v-if="isColumnFiltering">
                    <div
                      v-for="element in filteredAvailableColumns"
                      :key="element.key"
                      class="column-row d-flex align-center"
                      @click="addColumn(element)"
                    >
                      <v-icon class="mr-1" size="small" color="grey-lighten-1">mdi-magnify</v-icon>
                      <span class="text-body-2">{{ element.title }}</span>
                      <v-spacer></v-spacer>
                      <v-btn icon="mdi-plus" size="x-small" variant="text" color="primary" @click.stop="addColumn(element)"></v-btn>
                    </div>
                    <div v-if="filteredAvailableColumns.length === 0" class="text-center text-medium-emphasis py-8 text-body-2">
                      沒有符合「{{ columnKeyword }}」的欄位
                    </div>
                  </template>
                  <!-- 未搜尋：完整清單，可拖曳到左側 -->
                  <draggable
                    v-else
                    v-model="availableColumns"
                    item-key="key"
                    :group="{ name: 'listExportColumns' }"
                    handle=".drag-handle"
                    animation="200"
                    class="draggable-fill"
                  >
                    <template #item="{ element }">
                      <div class="column-row d-flex align-center" @click="addColumn(element)">
                        <v-icon class="drag-handle mr-1" size="small" color="grey" @click.stop>mdi-drag</v-icon>
                        <span class="text-body-2">{{ element.title }}</span>
                        <v-spacer></v-spacer>
                        <v-btn icon="mdi-plus" size="x-small" variant="text" color="primary" @click.stop="addColumn(element)"></v-btn>
                      </div>
                    </template>
                  </draggable>
                  <div v-if="!isColumnFiltering && availableColumns.length === 0" class="text-center text-medium-emphasis py-8 text-body-2">
                    所有欄位皆已加入
                  </div>
                </div>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions class="px-4 flex-wrap">
        <v-select
          v-model="sortMode"
          :items="sortOptions"
          label="資料排序"
          variant="outlined"
          density="compact"
          hide-details
          class="sort-select mr-3"
        ></v-select>
        <span class="text-caption text-medium-emphasis">
          將匯出 {{ exportItemCount }} 筆 × {{ selectedColumns.length }} 欄
        </span>
        <v-spacer></v-spacer>
        <v-btn color="grey-darken-1" variant="text" @click="isOpen = false">取消</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-tray-arrow-down"
          :disabled="exportItemCount === 0 || selectedColumns.length === 0 || fetching"
          :loading="fetching"
          @click="handleExport"
        >下載 EXCEL</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue';
import { watchDebounced } from '@vueuse/core';
import draggable from 'vuedraggable';
import * as XLSX from 'xlsx-js-style';
import { useToast, POSITION } from 'vue-toastification';
import { format } from 'date-fns';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // 已處理的預約資料（含 start Date、合併戶別資料、bookingMethodDetails）
  items: { type: Array, default: () => [] },
  // 可匯出欄位定義 [{ key, title }]；動態自訂欄位 key 為 'dyn:<id>'
  columns: { type: Array, default: () => [] },
  projectName: { type: String, default: '' },
  // 時間表目前檢視的日期範圍 (yyyy-MM-dd)：開啟時日期區間預設與其同步
  rangeStart: { type: String, default: null },
  rangeEnd: { type: String, default: null },
  // 父層正在載入日期區間資料
  fetching: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue', 'fetch-range']);

const toast = useToast();

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

// ── 取值輔助 ──
const DOW_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

const dateKeyOf = (item) => (item.start instanceof Date ? format(item.start, 'yyyy-MM-dd') : '');
const weekdayOf = (item) => (item.start instanceof Date ? `星期${DOW_LABELS[item.start.getDay()]}` : '');

// 時段統一為 HH:mm（資料可能是「09:30」或含後綴文字）
const timeSlotOf = (item) => {
  const raw = item.appointmentTimeSlot ? String(item.appointmentTimeSlot) : '';
  const m = raw.match(/(\d{1,2}[:：]\d{2})/);
  return m ? m[0].replace(/：/g, ':') : raw;
};

const inspectorListOf = (item) => {
  const raw = item.inspectors;
  const list = Array.isArray(raw) ? raw : String(raw || '').split(/[,、，;；/]+/);
  return list.map(s => String(s).trim()).filter(Boolean);
};

const sourceLabelOf = (item) => (item.source === 'admin' ? '後台新增' : '前台預約');

const formatDateLike = (value) => {
  let d = null;
  if (value instanceof Date) d = value;
  else if (value && typeof value.toDate === 'function') d = value.toDate();
  if (!d || isNaN(d.getTime())) return null;
  const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
  return format(d, hasTime ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd');
};

// 匯出/搜尋共用的儲存格取值
const getCellValue = (item, key) => {
  if (key.startsWith('dyn:')) {
    const v = item.bookingMethodDetails?.[key.slice(4)];
    if (v === null || v === undefined) return '';
    return Array.isArray(v) ? v.join('、') : String(v);
  }
  switch (key) {
    case 'date': return dateKeyOf(item);
    case 'weekday': return weekdayOf(item);
    case 'appointmentTimeSlot': return timeSlotOf(item);
    case 'inspectors': return inspectorListOf(item).join('、');
    case 'source': return sourceLabelOf(item);
  }
  const value = item[key];
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join('、');
  if (typeof value === 'object') return formatDateLike(value) ?? '';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return String(value);
};

// ── 篩選 ──
const showFilters = ref(false);
const dlgFilters = reactive({
  keyword: '',
  dateStart: null, dateEnd: null,
  weekdays: [],
  timeSlots: [],
  statuses: [],
  types: [],
  methods: [],
  sources: [],
  checkInStatuses: [],
  inspectors: [],
  companies: [],
  buildings: [],
  bookerName: '',
  buyerName: '',
});

const clearDlgFilters = () => {
  dlgFilters.keyword = '';
  dlgFilters.dateStart = null; dlgFilters.dateEnd = null;
  dlgFilters.weekdays = [];
  dlgFilters.timeSlots = [];
  dlgFilters.statuses = [];
  dlgFilters.types = [];
  dlgFilters.methods = [];
  dlgFilters.sources = [];
  dlgFilters.checkInStatuses = [];
  dlgFilters.inspectors = [];
  dlgFilters.companies = [];
  dlgFilters.buildings = [];
  dlgFilters.bookerName = '';
  dlgFilters.buyerName = '';
};

const dlgActiveFilterCount = computed(() => {
  let count = 0;
  if (dlgFilters.keyword && dlgFilters.keyword.trim()) count++;
  if (dlgFilters.dateStart || dlgFilters.dateEnd) count++;
  if (dlgFilters.weekdays.length > 0) count++;
  if (dlgFilters.timeSlots.length > 0) count++;
  if (dlgFilters.statuses.length > 0) count++;
  if (dlgFilters.types.length > 0) count++;
  if (dlgFilters.methods.length > 0) count++;
  if (dlgFilters.sources.length > 0) count++;
  if (dlgFilters.checkInStatuses.length > 0) count++;
  if (dlgFilters.inspectors.length > 0) count++;
  if (dlgFilters.companies.length > 0) count++;
  if (dlgFilters.buildings.length > 0) count++;
  if (dlgFilters.bookerName) count++;
  if (dlgFilters.buyerName) count++;
  return count;
});

// ── 下拉選項：由傳入資料推導 ──
const EMPTY_OPTION = '(無)';
const zhSort = (arr) => arr.sort((a, b) => String(a).localeCompare(String(b), 'zh-Hant', { numeric: true, sensitivity: 'base' }));

const collectOption = (getter, { withEmpty = false } = {}) => {
  const set = new Set();
  let hasEmpty = false;
  props.items.forEach(item => {
    const v = getter(item);
    if (v === null || v === undefined || v === '') { hasEmpty = true; return; }
    set.add(String(v));
  });
  const list = zhSort(Array.from(set));
  if (withEmpty && hasEmpty) list.push(EMPTY_OPTION);
  return list;
};

const weekdayOptions = computed(() =>
  [1, 2, 3, 4, 5, 6, 0].map(d => ({ value: d, title: `星期${DOW_LABELS[d]}` }))
);
const timeSlotOptions = computed(() => collectOption(timeSlotOf).sort());
const statusOptions = computed(() => {
  const base = ['預約中', '已完成', '取消'];
  const found = collectOption(i => i.status);
  return [...base, ...found.filter(s => !base.includes(s))];
});
const typeOptions = computed(() => collectOption(i => i.bookingType));
const methodOptions = computed(() => collectOption(i => i.inspectionMethod));
const sourceOptions = ['前台預約', '後台新增'];
const checkInOptions = computed(() => collectOption(i => i.checkInStatus, { withEmpty: true }));
const companyOptions = computed(() => collectOption(i => i.inspectionCompanyName, { withEmpty: true }));
const buildingOptions = computed(() => collectOption(i => i.building));
const inspectorOptions = computed(() => {
  const set = new Set();
  props.items.forEach(item => inspectorListOf(item).forEach(n => set.add(n)));
  return zhSort(Array.from(set));
});

// 全域關鍵字：把一筆資料攤平成可搜尋字串（涵蓋所有可匯出欄位）
const buildSearchBlob = (item) => {
  const parts = [];
  for (const col of props.columns) {
    const v = getCellValue(item, col.key);
    if (v) parts.push(v);
  }
  return parts.join(' ').toLowerCase();
};

const matchEmptyable = (selected, value) => {
  if (selected.length === 0) return true;
  const isEmpty = value === null || value === undefined || value === '';
  return selected.includes(String(value)) || (selected.includes(EMPTY_OPTION) && isEmpty);
};

// 除「日期勾選」外的所有篩選條件套用結果
const conditionFilteredItems = computed(() => {
  const f = dlgFilters;
  const kwTokens = (f.keyword || '').trim().toLowerCase().split(/\s+/).filter(Boolean);

  return props.items.filter(item => {
    const dateKey = dateKeyOf(item);
    if (!dateKey) return false;

    if (f.dateStart && dateKey < f.dateStart) return false;
    if (f.dateEnd && dateKey > f.dateEnd) return false;
    if (f.weekdays.length > 0 && !f.weekdays.includes(item.start.getDay())) return false;
    if (f.timeSlots.length > 0 && !f.timeSlots.includes(timeSlotOf(item))) return false;
    if (f.statuses.length > 0 && !f.statuses.includes(item.status)) return false;
    if (f.types.length > 0 && !f.types.includes(item.bookingType)) return false;
    if (f.methods.length > 0 && !f.methods.includes(item.inspectionMethod)) return false;
    if (f.sources.length > 0 && !f.sources.includes(sourceLabelOf(item))) return false;
    if (!matchEmptyable(f.checkInStatuses, item.checkInStatus)) return false;
    if (!matchEmptyable(f.companies, item.inspectionCompanyName)) return false;
    if (f.buildings.length > 0 && !f.buildings.includes(String(item.building ?? ''))) return false;

    if (f.inspectors.length > 0) {
      const list = inspectorListOf(item);
      if (!list.some(n => f.inspectors.includes(n))) return false;
    }

    if (f.bookerName && !(item.bookerName || '').includes(f.bookerName)) return false;
    if (f.buyerName && !(item.buyerName || '').includes(f.buyerName)) return false;

    if (kwTokens.length > 0) {
      const blob = buildSearchBlob(item);
      if (!kwTokens.every(tk => blob.includes(tk))) return false;
    }

    return true;
  });
});

// ── 日期勾選 ──
const selectedDateKeys = reactive(new Set());

// 左側清單：符合條件的資料依日期分組（由舊到新）
const dateGroups = computed(() => {
  const map = new Map();
  conditionFilteredItems.value.forEach(item => {
    const key = dateKeyOf(item);
    if (!map.has(key)) {
      const dow = item.start.getDay();
      map.set(key, { dateKey: key, dowLabel: DOW_LABELS[dow], isWeekend: dow === 0 || dow === 6, count: 0 });
    }
    map.get(key).count++;
  });
  return Array.from(map.values()).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
});

const visibleSelectedDateCount = computed(() =>
  dateGroups.value.reduce((n, g) => n + (selectedDateKeys.has(g.dateKey) ? 1 : 0), 0)
);

const toggleDate = (dateKey) => {
  if (selectedDateKeys.has(dateKey)) selectedDateKeys.delete(dateKey);
  else selectedDateKeys.add(dateKey);
};
// 全選/清除僅套用到目前篩選可見的日期
const selectAllDates = () => { dateGroups.value.forEach(g => selectedDateKeys.add(g.dateKey)); };
const clearAllDates = () => { dateGroups.value.forEach(g => selectedDateKeys.delete(g.dateKey)); };

// ── 資料排序 ──
const sortMode = ref('dateAsc');
const sortOptions = [
  { value: 'dateAsc', title: '日期＋時段（舊 → 新）' },
  { value: 'dateDesc', title: '日期＋時段（新 → 舊）' },
  { value: 'unit', title: '戶別' },
  { value: 'type', title: '預約項目' },
  { value: 'inspector', title: '驗屋人員' },
];

const exportItems = computed(() => {
  const items = conditionFilteredItems.value.filter(item => selectedDateKeys.has(dateKeyOf(item)));
  const byStart = (a, b) => a.start - b.start;
  const zhCompare = (a, b) => String(a).localeCompare(String(b), 'zh-Hant', { numeric: true, sensitivity: 'base' });
  switch (sortMode.value) {
    case 'dateDesc': return items.sort((a, b) => byStart(b, a));
    case 'unit': return items.sort((a, b) => zhCompare(a.unitId ?? '', b.unitId ?? '') || byStart(a, b));
    case 'type': return items.sort((a, b) => zhCompare(a.bookingType ?? '', b.bookingType ?? '') || byStart(a, b));
    case 'inspector': return items.sort((a, b) => zhCompare(inspectorListOf(a).join('、'), inspectorListOf(b).join('、')) || byStart(a, b));
    default: return items.sort(byStart);
  }
});
const exportItemCount = computed(() => exportItems.value.length);

// ── 欄位選擇（雙欄拖拉）：左=匯出欄位（依順序），右=所有欄位；預設左側為空 ──
const STORAGE_KEY = 'inspectionCalendar.listExport.selectedColumns.v1';
const selectedColumns = ref([]);
const availableColumns = ref([]);
const columnKeyword = ref('');
const lastSavedKeys = ref(null);

const initColumnState = () => {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { /* 壞資料就重來 */ }
  lastSavedKeys.value = Array.isArray(saved) ? saved : null;
  selectedColumns.value = [];
  availableColumns.value = props.columns.map(c => ({ key: c.key, title: c.title }));
  columnKeyword.value = '';
};

const hasLastSaved = computed(() =>
  Array.isArray(lastSavedKeys.value) && lastSavedKeys.value.some(key => props.columns.some(c => c.key === key))
);

// 帶入上次匯出的欄位與順序
const applyLastSaved = () => {
  if (!Array.isArray(lastSavedKeys.value)) return;
  const titleMap = new Map(props.columns.map(c => [c.key, c.title]));
  const selected = [];
  for (const key of lastSavedKeys.value) {
    if (titleMap.has(key)) {
      selected.push({ key, title: titleMap.get(key) });
      titleMap.delete(key);
    }
  }
  selectedColumns.value = selected;
  availableColumns.value = Array.from(titleMap, ([key, title]) => ({ key, title }));
};

const matchColumnKeyword = (element) => {
  const kw = (columnKeyword.value || '').trim().toLowerCase();
  if (!kw) return true;
  return element.title.toLowerCase().includes(kw) || element.key.toLowerCase().includes(kw);
};

const isColumnFiltering = computed(() => (columnKeyword.value || '').trim().length > 0);
const filteredAvailableColumns = computed(() => availableColumns.value.filter(matchColumnKeyword));

const addColumn = (element) => {
  const idx = availableColumns.value.findIndex(c => c.key === element.key);
  if (idx === -1) return;
  availableColumns.value.splice(idx, 1);
  selectedColumns.value.push(element);
};

const removeColumn = (element) => {
  const idx = selectedColumns.value.findIndex(c => c.key === element.key);
  if (idx === -1) return;
  selectedColumns.value.splice(idx, 1);
  availableColumns.value.push(element);
};

// 全部加入僅套用目前搜尋符合的欄位
const addAllColumns = () => {
  const matched = availableColumns.value.filter(matchColumnKeyword);
  availableColumns.value = availableColumns.value.filter(c => !matched.includes(c));
  selectedColumns.value.push(...matched);
};

const clearSelectedColumns = () => {
  availableColumns.value.push(...selectedColumns.value);
  selectedColumns.value = [];
};

// 已向父層要求過的日期區間（避免開啟時的預設區間重複觸發載入）
const lastRequestedRange = ref('');
// 已看過的日期 key：新載入/新出現的日期自動勾選
const seenDateKeys = new Set();

watch(isOpen, (open) => {
  if (open) {
    initColumnState();
    clearDlgFilters();
    showFilters.value = false;
    sortMode.value = 'dateAsc';
    // 日期區間預設與時間表目前檢視範圍同步（該範圍的資料已由時間表載入）
    dlgFilters.dateStart = props.rangeStart || null;
    dlgFilters.dateEnd = props.rangeEnd || null;
    lastRequestedRange.value = `${dlgFilters.dateStart || ''}|${dlgFilters.dateEnd || ''}`;
    selectedDateKeys.clear();
    seenDateKeys.clear();
    dateGroups.value.forEach(g => {
      selectedDateKeys.add(g.dateKey);
      seenDateKeys.add(g.dateKey);
    });
  }
});

// 調整日期區間時，通知父層載入該區間的預約資料（時間表未載入的日期才會有資料可匯出）
watchDebounced(
  () => [dlgFilters.dateStart, dlgFilters.dateEnd],
  ([start, end]) => {
    if (!isOpen.value || !start || !end || start > end) return;
    const rangeKey = `${start}|${end}`;
    if (rangeKey === lastRequestedRange.value) return;
    lastRequestedRange.value = rangeKey;
    emit('fetch-range', { start, end });
  },
  { debounce: 600 }
);

// 新出現的日期（載入新區間資料、放寬篩選）自動勾選
watch(dateGroups, (groups) => {
  if (!isOpen.value) return;
  groups.forEach(g => {
    if (!seenDateKeys.has(g.dateKey)) {
      seenDateKeys.add(g.dateKey);
      selectedDateKeys.add(g.dateKey);
    }
  });
});

// ── 匯出 ──
function isMobileLike() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 600;
}

// 透過系統分享面板送出檔案（手機可存到檔案 App 或分享到 LINE）
async function shareFileViaSystem(blob, fileName, mimeType) {
  try {
    const ua = navigator.userAgent;
    const isDesktopOS = /Windows NT|Macintosh|CrOS|X11/.test(ua)
      && !/Android|iPhone|iPad|iPod/i.test(ua)
      && (navigator.maxTouchPoints || 0) === 0;
    if (isDesktopOS) return false;
    const file = new File([blob], fileName, { type: mimeType });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: fileName });
      return true;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return true; // 使用者自行取消分享面板，視為已處理
    console.warn('系統分享失敗，改用其他下載方式:', e);
  }
  return false;
}

function triggerLinkDownload(url, fileName) {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const WIDE_COLUMN_KEYS = new Set(['remarks', 'bookingRemarks', 'address', 'bookerEmail', 'buyerEmail']);

const handleExport = async () => {
  const exportColumns = selectedColumns.value;
  const rowsSource = exportItems.value;
  if (exportColumns.length === 0 || rowsSource.length === 0) return;

  const headers = exportColumns.map(c => c.title);
  const rows = rowsSource.map(item => exportColumns.map(c => getCellValue(item, c.key)));
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: 'FFD3D3D3' } } };
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_cell({ r: 0, c: C });
    if (ws[address]) ws[address].s = headerStyle;
  }
  ws['!freeze'] = { ySplit: 1 };
  ws['!cols'] = exportColumns.map(c => (WIDE_COLUMN_KEYS.has(c.key) ? { wch: 24 } : { wch: 12 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '預約清單');

  // 檔名日期以台灣時間 (Asia/Taipei) 為準
  const dateStr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Taipei' }).format(new Date()).replace(/-/g, '');
  const fileName = `${dateStr}-${props.projectName || 'unknown-project'}-預約時間表列表.xlsx`;

  // 記住這次的欄位選擇與順序（供「帶入上次設定」使用）
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exportColumns.map(c => c.key)));
  } catch { /* 儲存失敗不影響匯出 */ }

  if (isMobileLike()) {
    // 手機：優先叫出系統分享面板
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const excelMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const blob = new Blob([wbout], { type: excelMime });
    const shared = await shareFileViaSystem(blob, fileName, excelMime);
    if (!shared) {
      const url = URL.createObjectURL(blob);
      triggerLinkDownload(url, fileName);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  } else {
    XLSX.writeFile(wb, fileName);
  }

  toast.success(`已匯出 ${rowsSource.length} 筆預約資料`, { position: POSITION.BOTTOM_CENTER });
  isOpen.value = false;
};
</script>

<style scoped>
.export-dialog-body {
  height: 78vh;
}
.filter-bar {
  flex: 0 0 auto;
  padding: 12px 16px 8px;
  border-block-end: 1px solid rgba(0, 0, 0, 0.08);
}
.content-row {
  min-height: 0;
}
.panel-col {
  height: 100%;
  min-height: 0;
}
.panel-header {
  padding: 12px 16px 8px;
  flex: 0 0 auto;
}
.panel-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 0 8px 12px;
}
.unit-row,
.column-row {
  padding: 2px 8px;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
}
.unit-row:hover,
.column-row:hover {
  background: rgba(0, 0, 0, 0.04);
}
.column-row--selected {
  background: rgba(25, 118, 210, 0.06);
  margin-block-end: 2px;
}

/* 欄位選擇雙欄（左：匯出欄位，右：所有欄位） */
.column-dual {
  display: flex;
  min-height: 0;
}
.dual-pane {
  flex: 1 1 50%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.dual-pane-header {
  padding: 4px 12px;
  flex: 0 0 auto;
}
.dual-pane-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 0 8px 12px;
}
.drop-zone {
  position: relative;
}
.draggable-fill {
  min-height: 100%;
}
.drop-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  border: 2px dashed rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  margin: 4px 8px 12px;
}
.order-badge {
  min-width: 18px;
  text-align: center;
  background: rgba(25, 118, 210, 0.12);
  border-radius: 4px;
  line-height: 18px;
}
.date-text {
  min-width: 140px;
}
.status-chip {
  background: rgba(0, 0, 0, 0.06);
  border-radius: 4px;
  padding: 0 6px;
}
.drag-handle {
  cursor: grab;
}
.gap-1 {
  gap: 4px;
}
.gap-2 {
  gap: 8px;
}
.border-dashed {
  border-style: dashed !important;
}
.date-input-compact {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.9rem;
  width: 100%;
  color: #333;
}
.date-input-compact:focus {
  outline: 2px solid #1976D2;
  border-color: transparent;
}
.sort-select {
  max-width: 220px;
  min-width: 180px;
}

/* 手機版：左右改上下堆疊，各自可捲動 */
@media (max-width: 959px) {
  .export-dialog-body {
    height: auto;
  }
  .panel-col {
    height: 45vh;
  }
  .panel-col.border-e {
    border-inline-end: none !important;
    border-block-end: 1px solid rgba(0, 0, 0, 0.12);
  }
}
</style>
