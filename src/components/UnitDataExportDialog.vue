<template>
  <v-dialog v-model="isOpen" max-width="1200" scrollable :fullscreen="$vuetify.display.smAndDown">
    <v-card>
      <v-card-title class="d-flex align-center bg-blue-grey-darken-2 text-white">
        <v-icon start>mdi-table-arrow-down</v-icon>
        下載指定戶別資料
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" size="small" @click="isOpen = false"></v-btn>
      </v-card-title>

      <v-card-text class="pa-0 export-dialog-body d-flex flex-column">
        <!-- 篩選列：比照銷控系統（全域關鍵字 + 展開式篩選面板） -->
        <div class="filter-bar">
          <div class="d-flex align-center gap-2">
            <v-text-field
              v-model="dlgFilters.keyword"
              placeholder="全域搜尋：戶別、買方、電話、銷售人員、備註…（可空白分隔多關鍵字）"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              class="flex-grow-1"
            >
              <template #append-inner>
                <span v-if="dlgFilters.keyword && dlgFilters.keyword.trim()" class="text-caption text-grey text-no-wrap">
                  {{ filteredItems.length }} 筆
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
                    <v-select
                      v-model="dlgFilters.categories"
                      :items="categoryOptions"
                      label="類型 (多選)"
                      multiple
                      chips
                      closable-chips
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                    ></v-select>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <v-select
                      v-model="dlgFilters.buildings"
                      :items="buildingOptions"
                      label="棟別 (多選)"
                      multiple
                      chips
                      closable-chips
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                      :menu-props="{ maxHeight: 320 }"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <v-select
                      v-model="dlgFilters.floors"
                      :items="floorOptions"
                      label="樓層 (多選)"
                      multiple
                      chips
                      closable-chips
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                      :menu-props="{ maxHeight: 320 }"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <div class="d-flex align-center gap-2">
                      <v-text-field v-model.number="dlgFilters.areaMin" label="面積 最小" type="number" variant="outlined" density="compact" hide-details></v-text-field>
                      <span class="text-grey">~</span>
                      <v-text-field v-model.number="dlgFilters.areaMax" label="最大" type="number" variant="outlined" density="compact" hide-details></v-text-field>
                    </div>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <div class="d-flex align-center gap-2">
                      <v-text-field v-model.number="dlgFilters.totalPriceMin" label="房屋總價 最小" type="number" variant="outlined" density="compact" hide-details></v-text-field>
                      <span class="text-grey">~</span>
                      <v-text-field v-model.number="dlgFilters.totalPriceMax" label="最大" type="number" variant="outlined" density="compact" hide-details></v-text-field>
                    </div>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <div class="d-flex align-center gap-2">
                      <v-text-field v-model.number="dlgFilters.unitPriceMin" label="房屋單價 最小" type="number" variant="outlined" density="compact" hide-details></v-text-field>
                      <span class="text-grey">~</span>
                      <v-text-field v-model.number="dlgFilters.unitPriceMax" label="最大" type="number" variant="outlined" density="compact" hide-details></v-text-field>
                    </div>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <div class="d-flex align-center gap-2">
                      <v-text-field v-model.number="dlgFilters.terraceMin" label="露臺坪數 最小" type="number" variant="outlined" density="compact" hide-details></v-text-field>
                      <span class="text-grey">~</span>
                      <v-text-field v-model.number="dlgFilters.terraceMax" label="最大" type="number" variant="outlined" density="compact" hide-details></v-text-field>
                    </div>
                  </v-col>
                </v-row>

                <v-divider class="my-3 border-dashed"></v-divider>

                <v-row dense>
                  <v-col cols="12" sm="6" md="3">
                    <v-select
                      v-model="dlgFilters.statuses"
                      :items="statusOptions"
                      label="銷控狀態 (多選)"
                      multiple
                      chips
                      closable-chips
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                    ></v-select>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <v-autocomplete
                      v-model="dlgFilters.salesperson"
                      :items="personnelOptions"
                      label="銷售人員 (多選)"
                      multiple
                      chips
                      closable-chips
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                    ></v-autocomplete>
                  </v-col>
                  <v-col cols="12" sm="6" md="2">
                    <v-text-field
                      v-model="dlgFilters.buyerName"
                      label="買方姓名"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6" md="2">
                    <div class="d-flex flex-column">
                      <span class="text-caption text-grey ml-1">小訂日期</span>
                      <div class="d-flex align-center gap-1">
                        <input type="date" v-model="dlgFilters.depositDateStart" class="date-input-compact">
                        <span class="text-grey">~</span>
                        <input type="date" v-model="dlgFilters.depositDateEnd" class="date-input-compact">
                      </div>
                    </div>
                  </v-col>
                  <v-col cols="12" sm="6" md="2">
                    <div class="d-flex flex-column">
                      <span class="text-caption text-grey ml-1">簽約日期</span>
                      <div class="d-flex align-center gap-1">
                        <input type="date" v-model="dlgFilters.contractDateStart" class="date-input-compact">
                        <span class="text-grey">~</span>
                        <input type="date" v-model="dlgFilters.contractDateEnd" class="date-input-compact">
                      </div>
                    </div>
                  </v-col>
                </v-row>

                <v-divider class="my-3 border-dashed"></v-divider>
                <div class="text-caption text-grey mb-1 ml-1 font-weight-bold">進階價格篩選</div>
                <v-row dense>
                  <v-col cols="12" sm="6" md="4">
                    <div class="d-flex align-center gap-2">
                      <v-text-field v-model.number="dlgFilters.floorPriceMin" label="底價 最小" type="number" variant="outlined" density="compact" hide-details></v-text-field>
                      <span class="text-grey">~</span>
                      <v-text-field v-model.number="dlgFilters.floorPriceMax" label="最大" type="number" variant="outlined" density="compact" hide-details></v-text-field>
                    </div>
                  </v-col>
                  <v-col cols="12" sm="6" md="4">
                    <div class="d-flex align-center gap-2">
                      <v-text-field v-model.number="dlgFilters.floorUnitPriceMin" label="底價單價 最小" type="number" variant="outlined" density="compact" hide-details></v-text-field>
                      <span class="text-grey">~</span>
                      <v-text-field v-model.number="dlgFilters.floorUnitPriceMax" label="最大" type="number" variant="outlined" density="compact" hide-details></v-text-field>
                    </div>
                  </v-col>
                  <v-col cols="12" sm="6" md="4">
                    <div class="d-flex align-center gap-2">
                      <v-text-field v-model.number="dlgFilters.transPriceMin" label="成交總價 最小" type="number" variant="outlined" density="compact" hide-details></v-text-field>
                      <span class="text-grey">~</span>
                      <v-text-field v-model.number="dlgFilters.transPriceMax" label="最大" type="number" variant="outlined" density="compact" hide-details></v-text-field>
                    </div>
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
          <!-- 左側：戶別勾選（來源為頁面篩選後資料，再套用上方對話框篩選） -->
          <v-col cols="12" md="5" class="d-flex flex-column panel-col border-e">
            <div class="panel-header">
              <div class="d-flex align-center">
                <span class="text-subtitle-2 font-weight-bold">選擇戶別</span>
                <span class="text-caption text-medium-emphasis ml-2">（已勾選 {{ visibleSelectedCount }} / {{ filteredItems.length }} 戶）</span>
                <v-spacer></v-spacer>
                <v-btn size="x-small" variant="text" color="primary" @click="selectAllUnits">全選</v-btn>
                <v-btn size="x-small" variant="text" color="grey-darken-1" @click="clearAllUnits">清除</v-btn>
              </div>
              <div class="text-caption text-medium-emphasis">涵蓋全部類型（住家/店面等）共 {{ items.length }} 戶，僅匯出上方篩選結果中已勾選的戶別。</div>
            </div>
            <div class="panel-scroll">
              <div
                v-for="item in filteredItems"
                :key="item.unitId"
                class="unit-row d-flex align-center"
                @click="toggleUnit(item.unitId)"
              >
                <v-checkbox-btn
                  :model-value="selectedUnitIds.has(item.unitId)"
                  density="compact"
                  color="primary"
                  class="flex-grow-0 mr-1"
                  @click.stop="toggleUnit(item.unitId)"
                ></v-checkbox-btn>
                <span class="font-weight-medium unit-id-text">{{ item.unitId }}</span>
                <span class="text-caption text-medium-emphasis ml-2">{{ item.building }} / {{ item.floor }}F</span>
                <span v-if="unitCategory(item) !== '住家'" class="text-caption category-chip ml-2">{{ unitCategory(item) }}</span>
                <v-spacer></v-spacer>
                <span v-if="item.buyerName" class="text-caption text-medium-emphasis mr-2">{{ item.buyerName }}</span>
                <span v-if="item.status" class="text-caption status-chip">{{ item.status }}</span>
              </div>
              <div v-if="filteredItems.length === 0" class="text-center text-medium-emphasis py-8 text-body-2">
                沒有符合篩選條件的戶別
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
                    :group="{ name: 'exportColumns' }"
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
                    :group="{ name: 'exportColumns' }"
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
      <v-card-actions class="px-4">
        <span class="text-caption text-medium-emphasis">
          將匯出 {{ visibleSelectedCount }} 戶 × {{ selectedColumns.length }} 欄
        </span>
        <v-spacer></v-spacer>
        <v-btn color="grey-darken-1" variant="text" @click="isOpen = false">取消</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-tray-arrow-down"
          :disabled="visibleSelectedCount === 0 || selectedColumns.length === 0"
          @click="handleExport"
        >下載 EXCEL</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue';
import draggable from 'vuedraggable';
import * as XLSX from 'xlsx-js-style';
import { useToast, POSITION } from 'vue-toastification';
import { formatSalespersons, normalizeSalespersons, salespersonsIntersect } from '@/utils/salespersonUtils';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // 頁面篩選後的戶別資料（含前端計算欄位）
  items: { type: Array, default: () => [] },
  // 可匯出欄位定義 [{ key, title }]
  columns: { type: Array, default: () => [] },
  projectName: { type: String, default: '' },
  // 銷控狀態選項（含 '(無)'），由父層傳入
  statusOptions: { type: Array, default: () => [] },
  // 頁面目前的價格顯示模式（list/floor/transaction），房屋總價/單價篩選比照
  priceMode: { type: String, default: 'list' },
});
const emit = defineEmits(['update:modelValue']);

const toast = useToast();

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

// ── 篩選（比照 SalesControlSystem 銷控模式的篩選欄位與邏輯） ──
const showFilters = ref(false);
const dlgFilters = reactive({
  keyword: '',
  categories: [],
  buildings: [],
  floors: [],
  areaMin: null, areaMax: null,
  totalPriceMin: null, totalPriceMax: null,
  unitPriceMin: null, unitPriceMax: null,
  terraceMin: null, terraceMax: null,
  statuses: [],
  salesperson: [],
  buyerName: '',
  depositDateStart: null, depositDateEnd: null,
  contractDateStart: null, contractDateEnd: null,
  floorPriceMin: null, floorPriceMax: null,
  floorUnitPriceMin: null, floorUnitPriceMax: null,
  transPriceMin: null, transPriceMax: null,
});

const clearDlgFilters = () => {
  dlgFilters.keyword = '';
  dlgFilters.categories = [];
  dlgFilters.buildings = [];
  dlgFilters.floors = [];
  dlgFilters.areaMin = null; dlgFilters.areaMax = null;
  dlgFilters.totalPriceMin = null; dlgFilters.totalPriceMax = null;
  dlgFilters.unitPriceMin = null; dlgFilters.unitPriceMax = null;
  dlgFilters.terraceMin = null; dlgFilters.terraceMax = null;
  dlgFilters.statuses = [];
  dlgFilters.salesperson = [];
  dlgFilters.buyerName = '';
  dlgFilters.depositDateStart = null; dlgFilters.depositDateEnd = null;
  dlgFilters.contractDateStart = null; dlgFilters.contractDateEnd = null;
  dlgFilters.floorPriceMin = null; dlgFilters.floorPriceMax = null;
  dlgFilters.floorUnitPriceMin = null; dlgFilters.floorUnitPriceMax = null;
  dlgFilters.transPriceMin = null; dlgFilters.transPriceMax = null;
};

const dlgActiveFilterCount = computed(() => {
  let count = 0;
  if (dlgFilters.keyword && dlgFilters.keyword.trim()) count++;
  if (dlgFilters.categories.length > 0) count++;
  if (dlgFilters.buildings.length > 0) count++;
  if (dlgFilters.floors.length > 0) count++;
  if (dlgFilters.areaMin || dlgFilters.areaMax) count++;
  if (dlgFilters.totalPriceMin || dlgFilters.totalPriceMax) count++;
  if (dlgFilters.unitPriceMin || dlgFilters.unitPriceMax) count++;
  if (dlgFilters.statuses.length > 0) count++;
  if (dlgFilters.salesperson.length > 0) count++;
  if (dlgFilters.buyerName) count++;
  if (dlgFilters.depositDateStart || dlgFilters.depositDateEnd) count++;
  if (dlgFilters.contractDateStart || dlgFilters.contractDateEnd) count++;
  if (dlgFilters.floorPriceMin || dlgFilters.floorPriceMax) count++;
  if (dlgFilters.floorUnitPriceMin || dlgFilters.floorUnitPriceMax) count++;
  if (dlgFilters.transPriceMin || dlgFilters.transPriceMax) count++;
  if (dlgFilters.terraceMin || dlgFilters.terraceMax) count++;
  return count;
});

// 類型：比照銷控頁面的分類方式（layout === '店面' 視為店面，其餘為住家）
const unitCategory = (item) => (item.layout === '店面' ? '店面' : '住家');

const categoryOptions = computed(() => {
  const cats = new Set();
  props.items.forEach(u => cats.add(unitCategory(u)));
  return Array.from(cats).sort((a, b) => a.localeCompare(b, 'zh-Hant'));
});

// 下拉選項：由傳入的全部戶別資料推導
const buildingOptions = computed(() => {
  const names = new Set();
  props.items.forEach(u => {
    if (u.building !== null && u.building !== undefined && u.building !== '') names.add(String(u.building));
  });
  return Array.from(names).sort((a, b) =>
    a.localeCompare(b, 'zh-Hant', { numeric: true, sensitivity: 'base' })
  );
});

const floorOptions = computed(() => {
  const floors = new Set();
  props.items.forEach(u => {
    if (u.floor !== null && u.floor !== undefined && u.floor !== '') floors.add(String(u.floor));
  });
  return Array.from(floors).sort((a, b) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    if (!isNaN(na) && !isNaN(nb) && na !== nb) return nb - na;
    return b.localeCompare(a, 'zh-Hant', { numeric: true, sensitivity: 'base' });
  });
});

const personnelOptions = computed(() => {
  const names = new Set();
  props.items.forEach(u => {
    normalizeSalespersons(u.salesperson).forEach(n => names.add(n));
  });
  return Array.from(names).sort((a, b) =>
    String(a).localeCompare(String(b), 'zh-Hant', { numeric: true, sensitivity: 'base' })
  );
});

// 全域關鍵字：把一筆 item 攤平成可搜尋字串（涵蓋所有可匯出欄位）
const buildSearchBlob = (item) => {
  const parts = [];
  const pushVal = (val) => {
    if (val === null || val === undefined || val === '') return;
    if (Array.isArray(val)) { parts.push(formatSalespersons(val)); return; }
    if (typeof val === 'object') {
      if (typeof val.toDate === 'function') { parts.push(val.toDate().toISOString().split('T')[0]); return; }
      if (val instanceof Date) { parts.push(val.toISOString().split('T')[0]); return; }
      return;
    }
    parts.push(String(val));
  };
  for (const col of props.columns) pushVal(item[col.key]);
  pushVal(item.status);
  return parts.join(' ').toLowerCase();
};

const getDateStr = (ts) => {
  if (!ts) return null;
  if (ts instanceof Date) return ts.toISOString().split('T')[0];
  if (typeof ts.toDate === 'function') return ts.toDate().toISOString().split('T')[0];
  return null;
};

const filteredItems = computed(() => {
  const f = dlgFilters;
  const kwTokens = (f.keyword || '').trim().toLowerCase().split(/\s+/).filter(Boolean);

  return props.items.filter(item => {
    if (kwTokens.length > 0) {
      const blob = buildSearchBlob(item);
      if (!kwTokens.every(tk => blob.includes(tk))) return false;
    }

    if (f.categories.length > 0 && !f.categories.includes(unitCategory(item))) return false;
    if (f.buildings.length > 0 && !f.buildings.includes(String(item.building))) return false;
    if (f.floors.length > 0 && !f.floors.includes(String(item.floor))) return false;

    const area = Number(item.area_house_ping) || 0;
    if (f.areaMin !== null && f.areaMin !== '' && area < Number(f.areaMin)) return false;
    if (f.areaMax !== null && f.areaMax !== '' && area > Number(f.areaMax)) return false;

    // 房屋總價/單價：比照頁面目前的價格顯示模式
    let targetTotalPrice = 0;
    let targetUnitPrice = 0;
    if (props.priceMode === 'floor') {
      targetTotalPrice = Number(item.price_floor_house_total) || 0;
      targetUnitPrice = Number(item.unit_price_floor) || 0;
    } else if (props.priceMode === 'transaction') {
      targetTotalPrice = Number(item.price_transaction_house) || 0;
      targetUnitPrice = Number(item.unit_price_transaction) || 0;
    } else {
      targetTotalPrice = Number(item.price_list_house_total) || 0;
      targetUnitPrice = Number(item.unit_price_list) || 0;
    }
    if (f.totalPriceMin !== null && f.totalPriceMin !== '' && targetTotalPrice < Number(f.totalPriceMin)) return false;
    if (f.totalPriceMax !== null && f.totalPriceMax !== '' && targetTotalPrice > Number(f.totalPriceMax)) return false;
    if (f.unitPriceMin !== null && f.unitPriceMin !== '' && targetUnitPrice < Number(f.unitPriceMin)) return false;
    if (f.unitPriceMax !== null && f.unitPriceMax !== '' && targetUnitPrice > Number(f.unitPriceMax)) return false;

    // 銷控狀態（含 '(無)' = 空狀態）
    if (f.statuses.length > 0) {
      const hasEmptyFilter = f.statuses.includes('(無)');
      const isStatusEmpty = item.status === null || item.status === undefined || item.status === '';
      const matchStatus = f.statuses.includes(item.status) || (hasEmptyFilter && isStatusEmpty);
      if (!matchStatus) return false;
    }

    // 銷售人員（陣列交集）
    if (f.salesperson.length > 0 && !salespersonsIntersect(item.salesperson, f.salesperson)) return false;

    // 買方姓名（模糊）
    if (f.buyerName) {
      if (!item.buyerName || !item.buyerName.includes(f.buyerName)) return false;
    }

    const depositDate = getDateStr(item.payment_deposit_date);
    const contractDate = getDateStr(item.payment_contract_date);
    if (f.depositDateStart && (!depositDate || depositDate < f.depositDateStart)) return false;
    if (f.depositDateEnd && (!depositDate || depositDate > f.depositDateEnd)) return false;
    if (f.contractDateStart && (!contractDate || contractDate < f.contractDateStart)) return false;
    if (f.contractDateEnd && (!contractDate || contractDate > f.contractDateEnd)) return false;

    const floorPrice = Number(item.price_floor_house_total) || 0;
    if (f.floorPriceMin !== null && f.floorPriceMin !== '' && floorPrice < Number(f.floorPriceMin)) return false;
    if (f.floorPriceMax !== null && f.floorPriceMax !== '' && floorPrice > Number(f.floorPriceMax)) return false;

    const floorUnitPrice = Number(item.unit_price_floor) || 0;
    if (f.floorUnitPriceMin !== null && f.floorUnitPriceMin !== '' && floorUnitPrice < Number(f.floorUnitPriceMin)) return false;
    if (f.floorUnitPriceMax !== null && f.floorUnitPriceMax !== '' && floorUnitPrice > Number(f.floorUnitPriceMax)) return false;

    const transPrice = Number(item.total_transaction) || 0;
    if (f.transPriceMin !== null && f.transPriceMin !== '' && transPrice < Number(f.transPriceMin)) return false;
    if (f.transPriceMax !== null && f.transPriceMax !== '' && transPrice > Number(f.transPriceMax)) return false;

    const terrace = Number(item.area_terrace_ping) || 0;
    if (f.terraceMin !== null && f.terraceMin !== '' && terrace < Number(f.terraceMin)) return false;
    if (f.terraceMax !== null && f.terraceMax !== '' && terrace > Number(f.terraceMax)) return false;

    return true;
  });
});

// ── 戶別勾選 ──
const selectedUnitIds = reactive(new Set());

// 只有「通過對話框篩選且已勾選」的戶別會被匯出
const visibleSelectedCount = computed(() =>
  filteredItems.value.reduce((n, item) => n + (selectedUnitIds.has(item.unitId) ? 1 : 0), 0)
);

const toggleUnit = (unitId) => {
  if (selectedUnitIds.has(unitId)) selectedUnitIds.delete(unitId);
  else selectedUnitIds.add(unitId);
};
// 全選/清除僅套用到目前篩選可見的戶別
const selectAllUnits = () => { filteredItems.value.forEach(item => selectedUnitIds.add(item.unitId)); };
const clearAllUnits = () => { filteredItems.value.forEach(item => selectedUnitIds.delete(item.unitId)); };

// ── 欄位選擇（雙欄拖拉）：左=匯出欄位（依順序），右=所有欄位；預設左側為空 ──
const STORAGE_KEY = 'salesControl.unitExport.selectedColumns.v2';
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

watch(isOpen, (open) => {
  if (open) {
    initColumnState();
    clearDlgFilters();
    showFilters.value = false;
    selectedUnitIds.clear();
    props.items.forEach(item => selectedUnitIds.add(item.unitId));
  }
});

// ── 匯出 ──
const UNIT_PRICE_KEYS = new Set(['unit_price_list', 'unit_price_floor', 'unit_price_transaction']);

const formatCellValue = (item, key) => {
  const value = item[key];
  if (value === null || value === undefined) return '';
  if (key === 'buyerDateOfBirth') {
    if (typeof value === 'object' && 'year' in value) {
      return `${value.year}年${value.month}月${value.day}日`;
    }
    let dateObj;
    if (typeof value.toDate === 'function') {
      dateObj = value.toDate();
    } else if (value instanceof Date) {
      dateObj = value;
    } else {
      const d = new Date(value);
      if (!isNaN(d.getTime())) dateObj = d;
    }
    if (dateObj) {
      return `${dateObj.getFullYear() - 1911}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
    }
    return '';
  }
  if (key === 'salesperson' || key === 'salespersonUserKey') {
    return formatSalespersons(value, ',', '');
  }
  if (UNIT_PRICE_KEYS.has(key) && typeof value === 'number') {
    return Number(value.toFixed(2));
  }
  if (value instanceof Date) return value.toISOString().split('T')[0];
  if (typeof value.toDate === 'function') return value.toDate().toISOString().split('T')[0];
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (Array.isArray(value)) return value.join(',');
  return value;
};

const handleExport = () => {
  const exportColumns = selectedColumns.value;
  const exportItems = filteredItems.value.filter(item => selectedUnitIds.has(item.unitId));
  if (exportColumns.length === 0 || exportItems.length === 0) return;

  const headers = exportColumns.map(c => c.title);
  const rows = exportItems.map(item => exportColumns.map(c => formatCellValue(item, c.key)));
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: 'FFD3D3D3' } } };
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_cell({ r: 0, c: C });
    if (ws[address]) ws[address].s = headerStyle;
  }
  ws['!freeze'] = { ySplit: 1 };
  ws['!cols'] = exportColumns.map(c => {
    if (c.key === 'remarks' || c.key.includes('Address') || c.key === 'driveFolderUrl' || c.key === 'contractDrawingFolderUrl') return { wch: 24 };
    return { wch: 12 };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '戶別資料');

  // 檔名日期以台灣時間 (Asia/Taipei) 為準
  const dateStr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Taipei' }).format(new Date()).replace(/-/g, '');
  const fileName = `${dateStr}-${props.projectName || 'unknown-project'}-戶別資料.xlsx`;
  XLSX.writeFile(wb, fileName);

  // 記住這次的欄位選擇與順序（供「帶入上次設定」使用）
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exportColumns.map(c => c.key)));
  } catch { /* 儲存失敗不影響匯出 */ }

  toast.success(`已匯出 ${exportItems.length} 戶資料`, { position: POSITION.BOTTOM_CENTER });
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
.unit-id-text {
  min-width: 64px;
}
.status-chip {
  background: rgba(0, 0, 0, 0.06);
  border-radius: 4px;
  padding: 0 6px;
}
.category-chip {
  background: rgba(255, 152, 0, 0.15);
  color: #b26a00;
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
