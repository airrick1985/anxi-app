<template>
  <v-dialog
    :model-value="show"
    @update:model-value="$emit('update:show', $event)"
    max-width="1140"
    :fullscreen="smAndDown"
    scrollable
  >
    <v-card>
      <v-toolbar color="primary" density="compact">
        <v-toolbar-title>下載銷控表（PDF）</v-toolbar-title>
        <v-spacer />
        <v-btn icon="mdi-close" @click="$emit('update:show', false)" />
      </v-toolbar>

      <v-card-text class="pa-4">
        <!-- 參數列 -->
        <div class="params-bar">
          <div class="param-item">
            <div class="param-label">紙張</div>
            <v-btn-toggle v-model="paper" color="primary" variant="outlined" density="compact" mandatory>
              <v-btn value="A4" size="small">A4</v-btn>
              <v-btn value="A3" size="small">A3</v-btn>
            </v-btn-toggle>
          </div>

          <div class="param-item">
            <div class="param-label">方向</div>
            <v-btn-toggle v-model="orientation" color="primary" variant="outlined" density="compact" mandatory>
              <v-btn value="landscape" size="small">橫式</v-btn>
              <v-btn value="portrait" size="small">直式</v-btn>
            </v-btn-toggle>
          </div>

          <div class="param-item param-slider">
            <div class="param-label">每頁樓層數：{{ rowsPerPage }} / {{ floors.length }}</div>
            <v-slider
              v-model="rowsPerPage"
              :min="1"
              :max="Math.max(1, floors.length)"
              :step="1"
              density="compact"
              hide-details
              color="primary"
            />
          </div>

          <div class="param-item param-slider">
            <div class="param-label">每頁棟別數：{{ colsPerPage }} / {{ buildings.length }}</div>
            <v-slider
              v-model="colsPerPage"
              :min="1"
              :max="Math.max(1, buildings.length)"
              :step="1"
              density="compact"
              hide-details
              color="primary"
            />
          </div>

          <div class="param-item">
            <div class="param-label">格子內容</div>
            <div class="content-checks">
              <v-checkbox v-model="content.total" label="總價" density="compact" hide-details />
              <v-checkbox v-model="content.area" label="坪數" density="compact" hide-details />
              <v-checkbox v-model="content.unit" label="單價" density="compact" hide-details />
              <v-checkbox v-model="content.terrace" label="露台標示" density="compact" hide-details />
            </div>
          </div>
        </div>

        <!-- 資訊列 -->
        <div class="info-bar">
          <v-chip size="small" variant="tonal" color="primary" class="mr-2">
            共 {{ plan.totalPages }} 頁（樓層 {{ floorChunkCount }} 段 × 棟別 {{ buildingChunkCount }} 段）
          </v-chip>
          <v-chip size="small" variant="tonal" class="mr-2">
            格寬約 {{ plan.cellWidthMm.toFixed(1) }} mm
          </v-chip>
          <v-chip v-if="plan.cellWidthMm < 12" size="small" color="warning" variant="tonal">
            <v-icon start size="small">mdi-alert</v-icon>
            格子過小可能難以閱讀，建議減少每頁棟別數或改用 A3 / 橫式
          </v-chip>
        </div>

        <!-- 分頁即時預覽 -->
        <div class="preview-scroll">
          <div
            v-for="page in previewPages"
            :key="page.pageNo"
            class="preview-wrap"
          >
            <div class="preview-page-label">第 {{ page.pageNo }} / {{ page.totalPages }} 頁</div>
            <div class="preview-page" :style="{ width: px(plan.paperW), height: px(plan.paperH) }">
              <!-- 頁首 -->
              <div class="pv-title" :style="{
                left: px(plan.margin), top: px(plan.margin),
                width: px(contentW * 0.45), height: px(plan.headerH),
                fontSize: px(plan.fonts.title)
              }">{{ docTitle }}</div>
              <div v-if="priceModeLabel" class="pv-meta" :style="{
                left: px(plan.margin + contentW * 0.45), top: px(plan.margin),
                width: px(contentW * 0.15), height: px(plan.headerH),
                fontSize: px(plan.fonts.meta), justifyContent: 'center'
              }">價格：{{ priceModeLabel }}</div>
              <div class="pv-meta" :style="{
                left: px(plan.margin + contentW * 0.6), top: px(plan.margin),
                width: px(contentW * 0.4), height: px(plan.headerH),
                fontSize: px(plan.fonts.meta), justifyContent: 'flex-end'
              }">{{ generatedAt }}　第 {{ page.pageNo }} / {{ page.totalPages }} 頁</div>

              <!-- 棟別表頭 -->
              <div
                v-for="(building, j) in page.buildings"
                :key="'b' + building"
                class="pv-header-cell"
                :style="{
                  left: px(colX(j)), top: px(plan.gridTop),
                  width: px(plan.cellW), height: px(plan.buildingHeaderH),
                  fontSize: px(plan.fonts.header)
                }"
              >{{ building }}</div>

              <!-- 樓層表頭 -->
              <div
                v-for="(floor, i) in page.floors"
                :key="'f' + floor"
                class="pv-header-cell"
                :style="{
                  left: px(plan.gridLeft), top: px(rowY(i)),
                  width: px(plan.floorHeaderW), height: px(plan.cellH),
                  fontSize: px(plan.fonts.header)
                }"
              >{{ floor }}F</div>

              <!-- 格子 -->
              <div
                v-for="(cell, idx) in page.cells"
                :key="'c' + idx"
                class="pv-cell"
                :class="{ empty: cell.empty }"
                :style="{
                  left: px(colX(idx % page.buildings.length)),
                  top: px(rowY(Math.floor(idx / page.buildings.length))),
                  width: px(plan.cellW), height: px(plan.cellH),
                  borderRadius: px(Math.min(4 * plan.scale, plan.cellW / 4, plan.cellH / 4)),
                  backgroundColor: cell.empty ? '#e9ecef' : (cell.bgColor || '#ffffff')
                }"
              >
                <template v-if="!cell.empty">
                  <span
                    v-if="cell.hasTerrace && plan.cellW >= 40"
                    class="pv-dot"
                    :style="{ width: px(5 * plan.scale), height: px(5 * plan.scale), top: px(2.5 * plan.scale), right: px(2.5 * plan.scale) }"
                  ></span>
                  <span class="pv-line pv-unit" :style="{ fontSize: px(plan.fonts.unitName), lineHeight: px(plan.fonts.unitName * 1.25) }">{{ cell.unitId }}</span>
                  <template v-if="cell.soldOnly">
                    <span class="pv-line pv-sold" :style="{ fontSize: px(plan.fonts.sold), lineHeight: px(plan.fonts.sold * 1.25) }">已售</span>
                  </template>
                  <template v-else>
                    <span v-if="cell.lines.total" class="pv-line pv-total" :style="{ fontSize: px(plan.fonts.total), lineHeight: px(plan.fonts.total * 1.25) }">{{ cell.lines.total }}</span>
                    <span v-if="cell.lines.breakdown" class="pv-line pv-sub" :style="{ fontSize: px(plan.fonts.sub), lineHeight: px(plan.fonts.sub * 1.25) }">{{ cell.lines.breakdown }}</span>
                    <span v-if="cell.lines.area" class="pv-line pv-sub" :style="{ fontSize: px(plan.fonts.sub), lineHeight: px(plan.fonts.sub * 1.25) }">{{ cell.lines.area }}</span>
                    <span v-if="cell.lines.unit" class="pv-line pv-sub" :style="{ fontSize: px(plan.fonts.sub), lineHeight: px(plan.fonts.sub * 1.25) }">{{ cell.lines.unit }}</span>
                  </template>
                </template>
              </div>

              <!-- 圖例 -->
              <div
                v-if="legendItems.length > 0"
                class="pv-legend"
                :style="{
                  left: px(plan.margin), width: px(contentW),
                  top: px(plan.paperH - plan.margin - plan.legendH + 4)
                }"
              >
                <div
                  v-for="(row, r) in legendRows"
                  :key="'lr' + r"
                  class="pv-legend-row"
                  :style="{ height: px(plan.legendRowH), fontSize: px(plan.fonts.legend) }"
                >
                  <span v-for="item in row.items" :key="item.statusName" class="pv-legend-item">
                    <i :style="{ backgroundColor: item.colorCode || '#ffffff', width: px(10), height: px(10) }"></i>
                    {{ item.statusName }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <v-alert
            v-if="plan.totalPages > PREVIEW_PAGE_LIMIT"
            type="info"
            variant="tonal"
            density="compact"
            class="mt-2"
          >
            預覽僅顯示前 {{ PREVIEW_PAGE_LIMIT }} 頁，下載的 PDF 仍包含全部 {{ plan.totalPages }} 頁。
          </v-alert>
        </div>
      </v-card-text>

      <v-divider />
      <v-card-actions class="pa-3">
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:show', false)">關閉</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-file-pdf-box"
          :loading="isGenerating"
          @click="handleDownload"
        >
          下載 PDF
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="4000" location="top">
      {{ snackbar.message }}
    </v-snackbar>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useDisplay } from 'vuetify';
import { saveAs } from 'file-saver';
import { generateSalesGridPdf } from '@/api';
import { buildPagePlan, groupLegendRows } from '@/utils/salesGridLayout';

const props = defineProps({
  show: { type: Boolean, default: false },
  buildings: { type: Array, default: () => [] },   // 棟別（左→右）
  floors: { type: Array, default: () => [] },      // 樓層（高→低）
  gridData: { type: Object, default: () => ({}) }, // dataMap[floor][building] = household
  statusColorMap: { type: Object, default: () => new Map() },
  salesParameters: { type: Array, default: () => [] },
  viewMode: { type: String, default: 'sales' },    // 'sales' | 'quote'
  priceDisplayMode: { type: String, default: 'list' }, // 'list' | 'floor' | 'transaction'（sales 模式）
  priceDisplayLabel: { type: String, default: '表價' },
  projectName: { type: String, default: '' },
  projectId: { type: String, default: '' },
  displayType: { type: String, default: '住家' },  // '住家' | '店面'
  getTotalPrice: { type: Function, required: true },
  getUnitPrice: { type: Function, required: true },
});

defineEmits(['update:show']);

const { smAndDown } = useDisplay();

const PREVIEW_PAGE_LIMIT = 60;
const PREVIEW_W = 660; // 預覽頁面顯示寬（px）

// --- 參數 state ---
const paper = ref('A4');
const orientation = ref('landscape');
const rowsPerPage = ref(1);
const colsPerPage = ref(1);
const content = reactive({ total: true, area: true, unit: true, terrace: true });
const isGenerating = ref(false);
const snackbar = reactive({ show: false, message: '', color: 'success' });
const generatedAt = ref('');

// 開啟時重置為「全部塞一頁」預設
watch(() => props.show, (val) => {
  if (val) {
    paper.value = 'A4';
    orientation.value = 'landscape';
    rowsPerPage.value = Math.max(1, props.floors.length);
    colsPerPage.value = Math.max(1, props.buildings.length);
    content.total = true;
    content.area = true;
    content.unit = true;
    content.terrace = true;
    generatedAt.value = formatTaiwanNow();
  }
});

// 資料變動（例如樓層數）時把超界值夾回範圍
watch(() => props.floors.length, (n) => { if (rowsPerPage.value > n) rowsPerPage.value = Math.max(1, n); });
watch(() => props.buildings.length, (n) => { if (colsPerPage.value > n) colsPerPage.value = Math.max(1, n); });

function formatTaiwanNow() {
  const parts = new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const get = (type) => parts.find(p => p.type === type)?.value || '';
  return `${get('year')}年${get('month')}月${get('day')}日 ${get('hour')}:${get('minute')}`;
}

// --- 資料組裝 ---
const statusField = computed(() => props.viewMode === 'quote' ? 'salesStatus_quote' : 'salesStatus_backend');
// 報價模式：不顯示價格模式標註（空字串 → 頁首該欄整個省略）
const priceModeLabel = computed(() => props.viewMode === 'quote' ? '' : props.priceDisplayLabel);
const titleSuffix = computed(() => props.displayType === '店面' ? '（店面）' : '');
const docTitle = computed(() => `${props.projectName}${titleSuffix.value} 銷控表`);

const legendItems = computed(() => {
  // 報價模式：不顯示銷控狀態顏色圖例（圖例高度歸零，網格空間變大）
  if (props.viewMode === 'quote') return [];
  return [...props.salesParameters]
    .filter(p => p.statusName)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map(p => ({ statusName: p.statusName, colorCode: p.colorCode || '#ffffff' }));
});

const fmtWan = (v) => Math.round(Number(v) || 0).toLocaleString('en-US');

/**
 * 露臺戶拆分加註「房屋+露臺」（精簡：'1,100+134'）。
 * 取與顯示總價同一價格模式的欄位；成交價為單一議定價無拆分 → 不加註。
 */
function getTerraceBreakdown(data) {
  if (!(Number(data.area_terrace_ping) > 0)) return null;
  const isSales = props.viewMode === 'sales';
  const showTransaction = isSales && props.priceDisplayMode === 'transaction'
    && ['小訂', '補足', '簽約'].includes(data.salesStatus_backend) && data.price_transaction_house;
  if (showTransaction) return null;
  const useFloor = isSales && props.priceDisplayMode === 'floor' && data.price_floor_house_total;
  const house = useFloor ? data.price_floor_house_only : data.price_list_house_only;
  const terrace = useFloor ? data.price_floor_terrace : data.price_list_terrace;
  if (!Number(house) || !Number(terrace)) return null;
  return `${fmtWan(house)}+${fmtWan(terrace)}`;
}

function getCell(floor, building) {
  const data = props.gridData[floor]?.[building];
  if (!data) return { empty: true };
  const soldOnly = props.viewMode === 'quote' && data.salesStatus_quote === '已售';
  const cell = {
    unitId: data.unitId ?? '',
    bgColor: props.statusColorMap.get(data[statusField.value]) || '#ffffff',
    soldOnly,
    hasTerrace: content.terrace && Number(data.area_terrace_ping) > 0,
    lines: {},
  };
  if (!soldOnly) {
    if (content.total) {
      cell.lines.total = fmtWan(props.getTotalPrice(data)); // 紅色粗體、無「萬」
      if (content.terrace) {
        const breakdown = getTerraceBreakdown(data);
        if (breakdown) cell.lines.breakdown = breakdown;
      }
    }
    if (content.area) cell.lines.area = `${data.area_house_ping ?? '-'}坪`;
    if (content.unit) cell.lines.unit = `${props.getUnitPrice(data)}萬/坪`;
  }
  return cell;
}

const plan = computed(() => buildPagePlan({
  paper: paper.value,
  orientation: orientation.value,
  rowsPerPage: rowsPerPage.value,
  colsPerPage: colsPerPage.value,
  buildings: props.buildings,
  floors: props.floors,
  getCell,
  legendItems: legendItems.value,
}));

const contentW = computed(() => plan.value.paperW - plan.value.margin * 2);
const floorChunkCount = computed(() => Math.ceil(props.floors.length / Math.max(1, rowsPerPage.value)));
const buildingChunkCount = computed(() => Math.ceil(props.buildings.length / Math.max(1, colsPerPage.value)));
const previewPages = computed(() => plan.value.pages.slice(0, PREVIEW_PAGE_LIMIT));
const legendRows = computed(() => groupLegendRows(legendItems.value, contentW.value, plan.value.fonts.legend));

// --- 預覽座標（pt → px） ---
const zoom = computed(() => PREVIEW_W / plan.value.paperW);
function px(v) {
  return `${v * zoom.value}px`;
}
function colX(j) {
  const p = plan.value;
  return p.gridLeft + p.floorHeaderW + p.gapX + j * (p.cellW + p.gapX);
}
function rowY(i) {
  const p = plan.value;
  return p.gridTop + p.buildingHeaderH + p.gapY + i * (p.cellH + p.gapY);
}

// --- 下載 ---
function base64ToBlob(base64, mimeType) {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
}

async function handleDownload() {
  if (isGenerating.value) return;
  isGenerating.value = true;
  generatedAt.value = formatTaiwanNow();
  try {
    const p = plan.value;
    const payload = {
      projectId: props.projectId,
      doc: {
        projectName: props.projectName,
        titleSuffix: titleSuffix.value,
        generatedAt: generatedAt.value,
        priceModeLabel: priceModeLabel.value,
        layout: {
          paperW: p.paperW, paperH: p.paperH,
          margin: p.margin, headerH: p.headerH,
          legendH: p.legendH, legendRowH: p.legendRowH,
          floorHeaderW: p.floorHeaderW, buildingHeaderH: p.buildingHeaderH,
          cellW: p.cellW, cellH: p.cellH, gapX: p.gapX, gapY: p.gapY,
          gridLeft: p.gridLeft, gridTop: p.gridTop, scale: p.scale,
          fonts: p.fonts,
        },
        legend: legendItems.value,
        pages: p.pages,
      },
    };
    const result = await generateSalesGridPdf(payload);
    if (result?.status === 'success' && result.base64) {
      saveAs(base64ToBlob(result.base64, result.mimeType), result.fileName);
      snackbar.message = 'PDF 已下載';
      snackbar.color = 'success';
    } else {
      throw new Error(result?.message || '產製失敗');
    }
  } catch (e) {
    console.error('[SalesGridDownloadDialog] 下載失敗:', e);
    snackbar.message = e.message || '銷控表產製失敗，請稍後重試';
    snackbar.color = 'error';
  } finally {
    snackbar.show = true;
    isGenerating.value = false;
  }
}
</script>

<style scoped>
.params-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  align-items: flex-end;
  margin-bottom: 12px;
}
.param-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}
.param-slider {
  min-width: 200px;
  flex: 1 1 200px;
}
.content-checks {
  display: flex;
  gap: 0 8px;
  flex-wrap: wrap;
}
.info-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 0;
  align-items: center;
  margin-bottom: 12px;
}
.preview-scroll {
  background: #eceff1;
  border-radius: 8px;
  padding: 16px;
  overflow-x: auto;
}
.preview-wrap {
  margin-bottom: 20px;
}
.preview-page-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}
.preview-page {
  position: relative;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}
.pv-title {
  position: absolute;
  display: flex;
  align-items: center;
  font-weight: 700;
  color: #212121;
  white-space: nowrap;
  overflow: hidden;
}
.pv-meta {
  position: absolute;
  display: flex;
  align-items: center;
  color: #555;
  white-space: nowrap;
  overflow: hidden;
}
.pv-header-cell {
  position: absolute;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #212121;
  overflow: hidden;
  white-space: nowrap;
}
.pv-cell {
  position: absolute;
  border: 1px solid #d0d0d0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.pv-cell.empty {
  border-color: #e0e0e0;
}
.pv-line {
  display: block;
  white-space: nowrap;
  color: #212121;
  text-align: center;
}
.pv-unit {
  font-weight: 700;
}
.pv-total {
  color: #C00000;
  font-weight: 700;
}
.pv-sub {
  color: #555;
}
.pv-sold {
  color: #d32f2f;
  font-weight: 700;
}
.pv-dot {
  position: absolute;
  border-radius: 50%;
  background: #2e7d32;
}
.pv-legend {
  position: absolute;
}
.pv-legend-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
}
.pv-legend-item {
  display: inline-flex;
  align-items: center;
  margin-right: 14px;
  color: #212121;
  white-space: nowrap;
}
.pv-legend-item i {
  display: inline-block;
  border: 1px solid #d0d0d0;
  margin-right: 4px;
}
</style>
