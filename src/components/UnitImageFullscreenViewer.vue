<template>
  <v-dialog v-model="dialogModel" fullscreen transition="fade-transition">
    <v-card class="fullscreen-viewer" :class="{ 'measuring': measureActive }">
      <!-- 縮放外層容器 (接收 wheel / drag 事件) -->
      <div class="fullscreen-zoom-wrapper" ref="zoomWrapperRef" @wheel.prevent="onViewerWheel"
        @mousedown="onViewerMouseDown" @dblclick="onViewerDblClick" :style="{ cursor: viewerCursor }">
        <!-- 丈量工具: 圖片 + Canvas 疊加容器 (受 transform 控制) -->
        <div class="fullscreen-image-measure-container" ref="measureContainerRef" :style="viewerTransformStyle">
          <img v-if="currentImage" ref="measureImgRef" :src="currentImage.downloadURL" class="fullscreen-image-native"
            draggable="false" decoding="async" @load="onMeasureImgLoad" />
          <!-- 丈量畫布 (疊加於圖片正上方) -->
          <canvas ref="measureCanvasRef" class="measure-canvas" width="0" height="0"></canvas>
          <!-- 已完成區塊的刪除按鈕 (Vue 渲染，確保 scoped CSS 正確套用) -->
          <div class="measure-buttons-container" :style="measureOverlayStyle">
            <button v-for="(btn, idx) in deleteButtonPositions" :key="'del-' + idx" class="fp-delete-btn"
              :style="{ left: btn.left, top: btn.top }" :title="'刪除此區塊'"
              @click.stop="deleteMeasureBlock(idx)">✕</button>
          </div>
          <!-- 浮動完成按鈕容器 -->
          <div ref="floatingBtnWrapperRef" class="measure-buttons-container">
            <button ref="btnFloatingFinishRef" class="fp-floating-btn" @click.stop="finishMeasureBlock">✔ 完成此區塊</button>
          </div>
        </div>
      </div>

      <!-- 縮放比例指示器 -->
      <transition name="fade">
        <div v-if="viewerScale > 1.01" class="zoom-indicator">
          {{ Math.round(viewerScale * 100) }}%
        </div>
      </transition>

      <template v-if="images.length > 1">
        <v-btn class="image-nav-btn prev" icon="mdi-chevron-left" variant="flat" size="large"
          @click.stop="prevImage"></v-btn>
        <v-btn class="image-nav-btn next" icon="mdi-chevron-right" variant="flat" size="large"
          @click.stop="nextImage"></v-btn>
      </template>

      <v-btn class="close-btn" icon="mdi-close" variant="flat" @click="close"></v-btn>

      <!-- 丈量工具列 -->
      <div class="fp-measure-tools">
        <div class="fp-measure-panel" v-show="measureActive">
          <!-- 面板標題 -->
          <div class="fp-measure-panel-title">📐 丈量工具</div>
          <!-- 模式切換列 -->
          <div class="fp-measure-row">
            <label>模式選擇:</label>
            <div class="fp-measure-btn-group">
              <button :class="{ active: measureMode === 'calibrate' }"
                @click="setMeasureMode('calibrate')">尺寸校準</button>
              <button :class="{ active: measureMode === 'distance' }" @click="setMeasureMode('distance')">測量距離</button>
              <button :class="{ active: measureMode === 'area' }" @click="setMeasureMode('area')">測量面積</button>
            </div>
          </div>
          <!-- 校準輸入 -->
          <div class="fp-measure-row" v-show="measureMode === 'calibrate'">
            <label>參照線距離 (cm):</label>
            <input type="number" v-model.number="measureCalibrateCm" min="1" step="1" style="width: 80px;"
              @change="onCalibrateCmChange" />
          </div>
          <!-- 清除按鈕 -->
          <div class="fp-measure-row">
            <button class="fp-measure-clear-btn" @click="clearAllMeasurements">🗑️ 重劃 / 全部清除</button>
          </div>
          <!-- 結果顯示區 -->
          <div class="fp-measure-result" v-html="measureResultText"></div>
        </div>
        <button class="fp-measure-toggle" @click="toggleMeasureMode">
          {{ measureActive ? '❌ 關閉丈量' : '📏 開啟丈量' }}
        </button>
      </div>

      <v-expand-x-transition>
        <div v-if="showInfoOverlay" class="fullscreen-info-sidebar pa-4">
          <v-card variant="flat" color="rgba(255, 255, 255, 1)" class="pa-4 overlay-scroll-container" rounded="lg">
            <div class="d-flex justify-space-between align-center mb-4">
              <div class="text-h6 font-weight-bold text-primary">{{ unitData.unitId }} 完整資訊</div>
              <v-btn icon="mdi-chevron-left" variant="text" size="small" @click="showInfoOverlay = false"></v-btn>
            </div>

            <div class="total-area-card mb-4" style="background-color: #f5f5f5;">
              <div class="area-summary-item">
                <div>
                  <div class="total-area-title">房屋總面積</div>
                  <div class="total-area-value-sm">{{ formatNumber(unitData.area_house_ping, 2) }} 坪</div>
                  <div class="total-area-subtitle">{{ formatNumber(unitData.area_house_sqm, 2) }} m²</div>
                </div>
              </div>
              <v-divider vertical class="mx-3"></v-divider>
              <div class="area-summary-item">
                <div>
                  <div class="total-area-title">公設比</div>
                  <div class="total-area-value-sm">{{ formatPercentage(unitData.common_area_ratio) }}</div>
                </div>
              </div>
            </div>

            <div class="area-details mb-4">
              <div class="area-group">
                <div class="area-group-title text-primary"><v-icon size="small" class="mr-1">mdi-home</v-icon>建物面積明細
                </div>
                <div class="area-item-header"><span>項目</span><span>坪數</span><span>m²</span></div>
                <div class="area-item"><span>主建物</span><span class="area-ping-value-sm">{{
                  formatNumber(unitData.area_main_ping, 2) }}</span><span>{{ formatNumber(unitData.area_main_sqm, 2)
                    }}</span></div>
                <div class="area-item"><span>附屬建物</span><span class="area-ping-value-sm">{{
                  formatNumber(unitData.area_ancillary_ping, 2) }}</span><span>{{
                      formatNumber(unitData.area_ancillary_sqm, 2) }}</span></div>
                <div class="area-item"><span>共用部分</span><span class="area-ping-value-sm">{{
                  formatNumber(unitData.area_common_ping, 2) }}</span><span>{{ formatNumber(unitData.area_common_sqm,
                    2)
                    }}</span></div>
                <div v-if="unitData.area_terrace_ping > 0" class="area-item"><span>露臺</span><span
                    class="area-ping-value-sm">{{ formatNumber(unitData.area_terrace_ping, 2) }}</span><span>-</span>
                </div>
              </div>
            </div>

            <div class="area-details mb-4">
              <div class="area-group">
                <div class="area-group-title text-primary"><v-icon size="small" class="mr-1">mdi-earth</v-icon>土地持分
                </div>
                <div class="area-item-header"><span>項目</span><span>坪數</span><span>m²</span></div>
                <div class="area-item"><span>持分面積</span><span class="area-ping-value-sm">{{
                  formatNumber(unitData.land_share_ping, 2) }}</span><span>{{ formatNumber(unitData.land_share_sqm, 2)
                    }}</span></div>
              </div>
            </div>

            <v-divider class="my-4"></v-divider>

            <div class="price-block-overlay pa-3 rounded-lg text-center"
              style="border: 1px solid #ddd; background-color: #fff;">
              <div class="text-subtitle-2 text-grey-darken-1">房價</div>
              <div class="text-h5 font-weight-bold text-red-darken-2">
                {{ formatNumber(unitData.price_list_house_total) }} 萬
              </div>
              <div class="text-caption text-grey-darken-1">({{ unitPriceText }} 萬/坪)</div>
            </div>
          </v-card>
        </div>
      </v-expand-x-transition>

      <div class="fullscreen-actions">
        <v-btn class="mr-2" :color="showInfoOverlay ? 'primary' : 'grey-darken-3'" variant="flat" elevation="4"
          @click="showInfoOverlay = !showInfoOverlay">
          <v-icon left>{{ showInfoOverlay ? 'mdi-information' : 'mdi-information-outline' }}</v-icon>
          面積價格
        </v-btn>

        <v-btn v-if="currentImage" color="green" variant="flat" elevation="4" class="ml-2" @click="printImage">
          <v-icon left>mdi-printer</v-icon>
          列印
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
// 戶別圖片全螢幕檢視器（縮放 / 平移 / 丈量）
// 從 UnitDetailModal 抽出：縮放、拖曳、丈量的高頻狀態只在這裡重繪，不牽動整個戶別資訊視窗
import { ref, computed, watch, nextTick, onUnmounted } from 'vue';
import { useToast } from 'vue-toastification';
import { printImageA3 } from '@/utils/printImageA3';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  images: { type: Array, default: () => [] },
  index: { type: Number, default: 0 },
  unitData: { type: Object, default: null },
  unitPriceText: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue', 'update:index']);

const toast = useToast();

const dialogModel = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const currentImage = computed(() => props.images[props.index] || null);
const showInfoOverlay = ref(false);

function formatNumber(value, frac = 0) {
  if (value === null || value === undefined || String(value).trim() === '') return frac > 0 ? (0).toFixed(frac) : '0';
  const num = Number(value);
  if (isNaN(num)) return 'N/A';
  return num.toLocaleString('en-US', { minimumFractionDigits: frac, maximumFractionDigits: frac });
}

function formatPercentage(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return 'N/A';
  return `${(num * 100).toFixed(2)}%`;
}

function nextImage() {
  const n = props.images.length;
  if (n > 1) emit('update:index', (props.index + 1) % n);
}

function prevImage() {
  const n = props.images.length;
  if (n > 1) emit('update:index', (props.index - 1 + n) % n);
}

function close() {
  dialogModel.value = false;
}

function printImage() {
  printImageA3(currentImage.value?.downloadURL, {
    title: `列印圖面 - ${props.unitData?.unitId || ''}`,
    onError: () => toast.error('圖片載入失敗，無法列印'),
  });
}

// ============================================================
// ===== 圖片縮放平移 (Zoom & Pan) =====
// ============================================================

const zoomWrapperRef = ref(null);
const viewerScale = ref(1);
const viewerTx = ref(0);
const viewerTy = ref(0);
const VIEWER_MIN_SCALE = 1;
const VIEWER_MAX_SCALE = 8;

// 拖曳狀態
const viewerDragging = ref(false);
let dragStartX = 0;
let dragStartY = 0;
let dragStartTx = 0;
let dragStartTy = 0;

const viewerTransformStyle = computed(() => ({
  transform: `translate(${viewerTx.value}px, ${viewerTy.value}px) scale(${viewerScale.value})`,
  transformOrigin: 'center center',
  transition: viewerDragging.value ? 'none' : 'transform 0.15s ease-out',
}));

const viewerCursor = computed(() => {
  if (viewerScale.value > 1.01) {
    if (viewerDragging.value) return 'grabbing';
    // 丈量模式下已放大：Canvas 區域用 crosshair (由 CSS 控制)，其他區域用 grab
    return measureActive.value ? 'default' : 'grab';
  }
  return 'default';
});

// --- 滑鼠滾輪縮放 (以滑鼠位置為中心，丈量模式下也可用) ---
// 觸控板一幀內會送出多個 wheel 事件：先累計格數，每幀只套用一次
let wheelSteps = 0;
let wheelClientX = 0;
let wheelClientY = 0;
let wheelRaf = 0;

function onViewerWheel(e) {
  wheelSteps += e.deltaY < 0 ? 1 : -1;
  wheelClientX = e.clientX;
  wheelClientY = e.clientY;
  if (!wheelRaf) wheelRaf = requestAnimationFrame(applyWheelZoom);
}

function applyWheelZoom() {
  wheelRaf = 0;
  const steps = wheelSteps;
  wheelSteps = 0;
  const wrapper = zoomWrapperRef.value;
  if (!wrapper || !steps) return;

  const rect = wrapper.getBoundingClientRect();
  // 滑鼠在 wrapper 內的座標 (相對於 wrapper 中心)
  const mx = wheelClientX - rect.left - rect.width / 2;
  const my = wheelClientY - rect.top - rect.height / 2;

  const oldScale = viewerScale.value;
  const zoomFactor = Math.pow(1.15, steps);
  let newScale = oldScale * zoomFactor;
  newScale = Math.max(VIEWER_MIN_SCALE, Math.min(VIEWER_MAX_SCALE, newScale));

  if (newScale === oldScale) return;

  // 以滑鼠位置為中心縮放: 調整平移量
  const scaleRatio = newScale / oldScale;
  viewerTx.value = mx - scaleRatio * (mx - viewerTx.value);
  viewerTy.value = my - scaleRatio * (my - viewerTy.value);
  viewerScale.value = newScale;

  // 如果縮放回到 1x，重置平移
  if (newScale <= VIEWER_MIN_SCALE + 0.01) {
    resetViewerZoom();
  }

  clampViewerPan();
}

// --- 拖曳平移 ---
function onViewerMouseDown(e) {
  if (viewerScale.value <= 1.01) return; // 未縮放不需拖曳
  // 丈量模式下，Canvas 上的點擊讓丈量工具處理，不啟動拖曳
  if (measureActive.value && e.target === measureCanvasRef.value) return;
  if (e.target.closest('.fp-measure-tools') || e.target.closest('.fullscreen-actions') ||
    e.target.closest('.close-btn') || e.target.closest('.image-nav-btn') ||
    e.target.closest('.fullscreen-info-sidebar') || e.target.closest('.zoom-indicator')) return;

  e.preventDefault();
  viewerDragging.value = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  dragStartTx = viewerTx.value;
  dragStartTy = viewerTy.value;

  // mousemove 比畫面更新頻繁：只記錄最後位置，每幀套用一次
  let lastX = e.clientX;
  let lastY = e.clientY;
  let moveRaf = 0;
  const applyMove = () => {
    moveRaf = 0;
    if (!viewerDragging.value) return;
    viewerTx.value = dragStartTx + (lastX - dragStartX);
    viewerTy.value = dragStartTy + (lastY - dragStartY);
    clampViewerPan();
  };
  const onMove = (ev) => {
    lastX = ev.clientX;
    lastY = ev.clientY;
    if (!moveRaf) moveRaf = requestAnimationFrame(applyMove);
  };

  const onUp = () => {
    if (moveRaf) cancelAnimationFrame(moveRaf);
    viewerDragging.value = false;
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

// --- 雙擊還原 ---
function onViewerDblClick(e) {
  // 丈量模式下，Canvas 上的雙擊讓丈量工具處理
  if (measureActive.value && e.target === measureCanvasRef.value) return;
  if (e.target.closest('.fp-measure-tools') || e.target.closest('.fullscreen-actions') ||
    e.target.closest('.close-btn') || e.target.closest('.fullscreen-info-sidebar')) return;

  if (viewerScale.value > 1.01) {
    // 已放大 → 還原
    resetViewerZoom();
  } else {
    // 未放大 → 快速放大到 2.5x (以雙擊位置為中心)
    const wrapper = zoomWrapperRef.value;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const mx = e.clientX - rect.left - rect.width / 2;
    const my = e.clientY - rect.top - rect.height / 2;
    const targetScale = 2.5;
    const scaleRatio = targetScale / viewerScale.value;
    viewerTx.value = mx - scaleRatio * (mx - viewerTx.value);
    viewerTy.value = my - scaleRatio * (my - viewerTy.value);
    viewerScale.value = targetScale;
    clampViewerPan();
  }
}

// --- 限制平移範圍不超出邊界 ---
function clampViewerPan() {
  const wrapper = zoomWrapperRef.value;
  if (!wrapper) return;
  const s = viewerScale.value;
  // 允許的平移範圍: 不讓圖片中心拖離視窗太遠
  const maxTx = wrapper.clientWidth * (s - 1) / 2;
  const maxTy = wrapper.clientHeight * (s - 1) / 2;
  viewerTx.value = Math.max(-maxTx, Math.min(maxTx, viewerTx.value));
  viewerTy.value = Math.max(-maxTy, Math.min(maxTy, viewerTy.value));
}

// --- 重置縮放 ---
function resetViewerZoom() {
  viewerScale.value = 1;
  viewerTx.value = 0;
  viewerTy.value = 0;
}

// ============================================================
// ===== 丈量工具 (Measurement Tool) 完整邏輯 =====
// ============================================================

// --- Template Refs ---
const measureContainerRef = ref(null);
const measureImgRef = ref(null);
const measureCanvasRef = ref(null);
const floatingBtnWrapperRef = ref(null);
const btnFloatingFinishRef = ref(null);

// --- 狀態變數 ---
const measureActive = ref(false);           // 丈量模式是否啟用
const measureMode = ref('calibrate');       // 'calibrate' | 'distance' | 'area'
const measurePxPerCm = ref(0);             // 像素對公分的比例
const measurePoints = ref([]);             // 當前操作中的座標點
const currentMousePos = ref(null);         // [新增] 當前滑鼠位置 (用於引導線)
const completedMeasurements = ref([]);     // 已完成的測量區塊
const measureResultText = ref('請在圖上點兩點進行校準');
const measureCalibrateCm = ref(500);       // 校準長度輸入

// --- 刪除按鈕容器定位 (響應式) ---
const measureOverlayPos = ref({ left: '0px', top: '0px', width: '0px', height: '0px' });
const measureOverlayStyle = computed(() => ({
  left: measureOverlayPos.value.left,
  top: measureOverlayPos.value.top,
  width: measureOverlayPos.value.width,
  height: measureOverlayPos.value.height,
}));

// --- 丈量座標系 = 圖片原始像素；Canvas 實際解析度另外限制上限 ---
// 平面圖原檔常見 6000px 以上，原尺寸 Canvas 會吃掉上百 MB 記憶體、縮放時整層重繪
const MEASURE_MAX_CANVAS_PIXELS = 6_000_000;
const measureSize = ref({ w: 0, h: 0 });
let measureBackingScale = 1;

// --- 刪除按鈕位置計算 (響應式) ---
const deleteButtonPositions = computed(() => {
  const { w, h } = measureSize.value;
  if (!w || !h) return [];
  return completedMeasurements.value.map((shape) => {
    // 統一放在形狀右上角
    const px = Math.max(...shape.points.map(p => p.x));
    const py = Math.min(...shape.points.map(p => p.y));
    return {
      left: `${(px / w) * 100}%`,
      top: `${(py / h) * 100}%`,
    };
  });
});

// --- 刪除單一區塊 ---
function deleteMeasureBlock(index) {
  completedMeasurements.value.splice(index, 1);
  drawMeasurement();
  measureResultText.value = '已刪除區塊';
}

// --- Canvas 尺寸同步 (精確對齊 object-fit: contain 的圖片渲染區域) ---
function resetMeasureCanvasSize() {
  const img = measureImgRef.value;
  const canvas = measureCanvasRef.value;
  const container = measureContainerRef.value;
  if (!img || !canvas || !img.naturalWidth || !container) return;

  // 丈量座標以圖片原始尺寸為準；Canvas 只在丈量時配置，且限制像素上限
  measureSize.value = { w: img.naturalWidth, h: img.naturalHeight };
  const needCanvas = measureActive.value || measurePoints.value.length > 0 || completedMeasurements.value.length > 0;
  if (needCanvas) {
    measureBackingScale = Math.min(1, Math.sqrt(MEASURE_MAX_CANVAS_PIXELS / (img.naturalWidth * img.naturalHeight)));
    const bw = Math.round(img.naturalWidth * measureBackingScale);
    const bh = Math.round(img.naturalHeight * measureBackingScale);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
  } else if (canvas.width || canvas.height) {
    canvas.width = 0;
    canvas.height = 0;
  }

  // 計算圖片經過 object-fit:contain 後的實際渲染尺寸和位置
  // 使用 zoomWrapper (無 transform) 的尺寸作為基準
  const wrapper = zoomWrapperRef.value || container;
  const wrapperRect = wrapper.getBoundingClientRect();
  const imgNatW = img.naturalWidth;
  const imgNatH = img.naturalHeight;
  const containerW = wrapperRect.width;
  const containerH = wrapperRect.height;

  const scaleToFit = Math.min(containerW / imgNatW, containerH / imgNatH);
  const renderedW = imgNatW * scaleToFit;
  const renderedH = imgNatH * scaleToFit;
  const offsetX = (containerW - renderedW) / 2;
  const offsetY = (containerH - renderedH) / 2;

  // 動態定位 Canvas 覆蓋圖片實際渲染區域
  canvas.style.left = `${offsetX}px`;
  canvas.style.top = `${offsetY}px`;
  canvas.style.width = `${renderedW}px`;
  canvas.style.height = `${renderedH}px`;

  // 同步定位按鈕容器 (響應式 ref)
  measureOverlayPos.value = {
    left: `${offsetX}px`,
    top: `${offsetY}px`,
    width: `${renderedW}px`,
    height: `${renderedH}px`,
  };

  // 同步定位浮動完成按鈕容器
  const floatingWrapper = floatingBtnWrapperRef.value;
  if (floatingWrapper) {
    floatingWrapper.style.left = `${offsetX}px`;
    floatingWrapper.style.top = `${offsetY}px`;
    floatingWrapper.style.width = `${renderedW}px`;
    floatingWrapper.style.height = `${renderedH}px`;
  }

  drawMeasurement();
}

function onMeasureImgLoad() {
  nextTick(() => {
    resetMeasureCanvasSize();
  });
}

// --- 視窗大小變化時重新對齊 Canvas ---
let measureResizeObserver = null;

function setupMeasureResizeObserver() {
  if (measureResizeObserver) return;
  // 監聽 zoomWrapper (無 transform) 的尺寸變化
  const wrapper = zoomWrapperRef.value || measureContainerRef.value;
  if (!wrapper) return;
  measureResizeObserver = new ResizeObserver(() => {
    resetMeasureCanvasSize();
  });
  measureResizeObserver.observe(wrapper);
}

function cleanupMeasureResizeObserver() {
  if (measureResizeObserver) {
    measureResizeObserver.disconnect();
    measureResizeObserver = null;
  }
}

// --- 座標轉換 ---
function getMeasureCanvasCoords(e) {
  const canvas = measureCanvasRef.value;
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  const scaleX = measureSize.value.w / rect.width;
  const scaleY = measureSize.value.h / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

// --- Canvas 點擊處理 ---
function onMeasureCanvasClick(e) {
  if (!measureActive.value) return;
  // 防止點擊工具列時觸發
  if (e.target.closest('.fp-measure-tools')) return;

  const coords = getMeasureCanvasCoords(e);
  if (!coords) return;

  let { x: px, y: py } = coords;

  // [新增] Shift 鍵正交鎖定
  if (e.shiftKey && measurePoints.value.length > 0) {
    const lastPt = measurePoints.value[measurePoints.value.length - 1];
    const dx = Math.abs(px - lastPt.x);
    const dy = Math.abs(py - lastPt.y);
    if (dx > dy) {
      py = lastPt.y;
    } else {
      px = lastPt.x;
    }
  }

  if (measureMode.value === 'calibrate') {
    if (measurePoints.value.length >= 2) measurePoints.value = [];
    measurePoints.value.push({ x: px, y: py });
    if (measurePoints.value.length === 2) {
      calculateMeasureCalibration();
      currentMousePos.value = null; // 清除引導線標記
    } else {
      measureResultText.value = '請點擊第二點完成校準線';
    }
    if (btnFloatingFinishRef.value) btnFloatingFinishRef.value.style.display = 'none';
  } else {
    if (!measurePxPerCm.value) return;
    measurePoints.value.push({ x: px, y: py });
    calculateMeasureResult();

    const canvas = measureCanvasRef.value;
    if (canvas && btnFloatingFinishRef.value) {
      const pctX = (px / measureSize.value.w) * 100;
      const pctY = (py / measureSize.value.h) * 100;
      btnFloatingFinishRef.value.style.left = `${pctX}%`;
      btnFloatingFinishRef.value.style.top = `${pctY}%`;
      btnFloatingFinishRef.value.style.display = 'block';
    }
  }
  drawMeasurement();
}

// --- 滑鼠移動 (即時引導線) ---
function onMeasureCanvasMouseMove(e) {
  if (!measureActive.value || measurePoints.value.length === 0) return;
  
  // 校準模式如果已經完成兩點，不畫引導線
  if (measureMode.value === 'calibrate' && measurePoints.value.length >= 2) return;

  const coords = getMeasureCanvasCoords(e);
  if (!coords) return;

  let { x: px, y: py } = coords;

  if (e.shiftKey) {
    const lastPt = measurePoints.value[measurePoints.value.length - 1];
    const dx = Math.abs(px - lastPt.x);
    const dy = Math.abs(py - lastPt.y);
    if (dx > dy) {
      py = lastPt.y;
    } else {
      px = lastPt.x;
    }
  }

  currentMousePos.value = { x: px, y: py };
  // 引導線每幀最多重算、重畫一次
  if (!guideRaf) guideRaf = requestAnimationFrame(drawGuide);
}

let guideRaf = 0;
function drawGuide() {
  guideRaf = 0;
  if (!currentMousePos.value || measurePoints.value.length === 0) return;
  // 即時計算結果
  calculateMeasureResult([...measurePoints.value, currentMousePos.value]);
  drawMeasurement();
}

function onMeasureCanvasMouseLeave() {
  if (guideRaf) { cancelAnimationFrame(guideRaf); guideRaf = 0; }
  currentMousePos.value = null;
  calculateMeasureResult(); // 恢復只計算已確認的點
  drawMeasurement();
}

// --- 觸控支援 ---
function onMeasureCanvasTouch(e) {
  if (!measureActive.value) return;
  e.preventDefault();
  const touch = e.touches[0];
  if (!touch) return;
  // 模擬 mouse event 的座標
  onMeasureCanvasClick({ clientX: touch.clientX, clientY: touch.clientY, target: e.target });
}

// --- 校準計算 ---
function calculateMeasureCalibration() {
  const pts = measurePoints.value;
  if (pts.length < 2) return;
  const p1 = pts[0], p2 = pts[1];
  const distPx = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  const targetCm = measureCalibrateCm.value || 500;
  measurePxPerCm.value = distPx / targetCm;
  measureResultText.value = `校準完成！(比例: 1cm = ${measurePxPerCm.value.toFixed(2)}px)`;
}

function onCalibrateCmChange() {
  if (measurePoints.value.length === 2 && measureMode.value === 'calibrate') {
    calculateMeasureCalibration();
    drawMeasurement();
  }
}

// --- 測量計算 ---
function calculateMeasureResult(tempPts = null) {
  const pts = tempPts && Array.isArray(tempPts) ? tempPts : measurePoints.value;
  if (pts.length < 2) {
    if (!tempPts) {
      if (measureMode.value === 'distance') measureResultText.value = '點擊畫面畫出測距線';
      if (measureMode.value === 'area') measureResultText.value = '點選畫出多邊形封閉範圍';
    }
    return;
  }

  if (measureMode.value === 'distance') {
    let totalDistPx = 0;
    for (let i = 1; i < pts.length; i++) {
      const p1 = pts[i - 1], p2 = pts[i];
      totalDistPx += Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }
    const cm = totalDistPx / measurePxPerCm.value;
    measureResultText.value = `總實測長度：${cm.toFixed(1)} cm`;
  } else if (measureMode.value === 'area') {
    if (pts.length < 3) {
      if (!tempPts) measureResultText.value = '請標記至少三點以形成面積';
      else if (pts.length === 2) {
        // 只有兩點時，先顯示長度
        const p1 = pts[0], p2 = pts[1];
        const distPx = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        const cm = distPx / measurePxPerCm.value;
        measureResultText.value = `即時長度：${cm.toFixed(1)} cm`;
      }
      return;
    }
    let areaPx = 0;
    let j = pts.length - 1;
    for (let i = 0; i < pts.length; i++) {
      areaPx += (pts[j].x + pts[i].x) * (pts[j].y - pts[i].y);
      j = i;
    }
    areaPx = Math.abs(areaPx / 2);
    const cm2 = areaPx / (measurePxPerCm.value * measurePxPerCm.value);
    const m2 = cm2 / 10000;
    const ping = m2 * 0.3025;
    measureResultText.value = `面積：${m2.toFixed(2)} m² <br> (${ping.toFixed(2)} 坪)`;
  }
}

// --- Canvas 繪圖引擎 ---
function drawMeasurement() {
  const canvas = measureCanvasRef.value;
  if (!canvas || !canvas.width || !canvas.height) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  // 以圖片原始像素座標作畫，縮放到實際 Canvas 解析度
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(measureBackingScale, 0, 0, measureBackingScale, 0, 0);

  // 1. 先繪製所有「已完成」的區塊
  completedMeasurements.value.forEach((shape) => {
    renderMeasureShape(ctx, measureSize.value.w, shape.mode, shape.points, true);
  });

  // 2. 再繪製「操作中」的點位
  if (measurePoints.value.length > 0) {
    const pts = [...measurePoints.value];
    if (currentMousePos.value && (measureMode.value !== 'calibrate' || measurePoints.value.length < 2)) {
      pts.push(currentMousePos.value);
    }
    renderMeasureShape(ctx, measureSize.value.w, measureMode.value, pts, false);
  }
}

function renderMeasureShape(ctx, canvasW, mode, points, isCompleted) {
  if (!points || points.length === 0) return;

  ctx.lineWidth = Math.max(1, canvasW / 1200);
  const crossSize = Math.max(3, canvasW / 600);

  let strokeColor = mode === 'calibrate' ? '#bd985c' : '#2563eb';
  let fillColor = strokeColor;
  if (mode === 'area') {
    fillColor = isCompleted ? 'rgba(16,185,129,0.25)' : 'rgba(37,99,235,0.2)';
    strokeColor = isCompleted ? '#10b981' : '#2563eb';
  } else if (isCompleted) {
    strokeColor = '#10b981';
    fillColor = '#10b981';
  }

  // 繪製線段/多邊形
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  if (mode === 'area' && points.length >= 3) {
    ctx.closePath();
    ctx.fill();
  }
  ctx.stroke();

  // 繪製頂點十字線
  ctx.strokeStyle = isCompleted ? '#059669' : '#ef4444';
  ctx.lineWidth = Math.max(1, canvasW / 1500);
  points.forEach((p, index) => {
    // 繪製十字線
    ctx.beginPath();
    ctx.moveTo(p.x - crossSize, p.y);
    ctx.lineTo(p.x + crossSize, p.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(p.x, p.y - crossSize);
    ctx.lineTo(p.x, p.y + crossSize);
    ctx.stroke();

    // 距離模式: 在每段線段中點標註長度
    if (mode === 'distance' && index > 0 && measurePxPerCm.value > 0) {
      const prev = points[index - 1];
      const distPx = Math.sqrt(Math.pow(p.x - prev.x, 2) + Math.pow(p.y - prev.y, 2));
      const cm = distPx / measurePxPerCm.value;
      const midX = (prev.x + p.x) / 2;
      const midY = (prev.y + p.y) / 2;
      const text = `${cm.toFixed(1)}cm`;

      ctx.save();
      ctx.font = `bold ${Math.max(12, canvasW / 90)}px sans-serif`;
      ctx.fillStyle = 'black';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = Math.max(2, canvasW / 200);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.strokeText(text, midX, midY - 4);
      ctx.fillText(text, midX, midY - 4);
      ctx.restore();
    }
  });

  // 面積模式: 在多邊形中心標註面積
  if (mode === 'area' && points.length >= 3 && measurePxPerCm.value > 0) {
    let cx = 0, cy = 0;
    points.forEach(p => { cx += p.x; cy += p.y; });
    cx /= points.length;
    cy /= points.length;

    let areaPx = 0;
    let j = points.length - 1;
    for (let i = 0; i < points.length; i++) {
      areaPx += (points[j].x + points[i].x) * (points[j].y - points[i].y);
      j = i;
    }
    areaPx = Math.abs(areaPx / 2);
    const cm2 = areaPx / (measurePxPerCm.value * measurePxPerCm.value);
    const m2 = cm2 / 10000;
    const ping = m2 * 0.3025;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fontSize = Math.max(14, canvasW / 65);
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = isCompleted ? '#059669' : '#ef4444';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = Math.max(2, canvasW / 180);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const gap = fontSize + 4;
    ctx.strokeText(`${ping.toFixed(2)} 坪`, cx, cy - gap / 2);
    ctx.fillText(`${ping.toFixed(2)} 坪`, cx, cy - gap / 2);
    ctx.strokeText(`${m2.toFixed(2)} m²`, cx, cy + gap / 2);
    ctx.fillText(`${m2.toFixed(2)} m²`, cx, cy + gap / 2);
    ctx.restore();
  }
}

// --- 完成按鈕邏輯 ---
function finishMeasureBlock(e) {
  if (e) e.stopPropagation();
  if (measurePoints.value.length > 0) {
    completedMeasurements.value.push({
      mode: measureMode.value,
      points: [...measurePoints.value],
      resultHtml: measureResultText.value
    });
    measurePoints.value = [];
    currentMousePos.value = null;
    if (btnFloatingFinishRef.value) btnFloatingFinishRef.value.style.display = 'none';
    drawMeasurement();
    measureResultText.value = '已保存當前圖形，可繼續點選圖面測量新區塊';
  }
}

// --- 清除所有標記 ---
function clearAllMeasurements() {
  measurePoints.value = [];
  currentMousePos.value = null;
  completedMeasurements.value = [];
  if (btnFloatingFinishRef.value) btnFloatingFinishRef.value.style.display = 'none';
  drawMeasurement();
  if (measureMode.value !== 'calibrate' && !measurePxPerCm.value) {
    measureResultText.value = '請先完成「尺寸校準」!!';
  } else {
    measureResultText.value = '已清除標記';
  }
}

// --- 模式切換 ---
function setMeasureMode(mode) {
  measureMode.value = mode;
  measurePoints.value = [];
  if (btnFloatingFinishRef.value) btnFloatingFinishRef.value.style.display = 'none';

  if (mode === 'calibrate') {
    measureResultText.value = '請在圖上點出兩點進行校準';
  } else if (mode === 'distance') {
    if (!measurePxPerCm.value) {
      measureResultText.value = '請先完成「尺寸校準」!!';
      return;
    }
    measureResultText.value = '點擊畫面畫出測距線';
  } else if (mode === 'area') {
    if (!measurePxPerCm.value) {
      measureResultText.value = '請先完成「尺寸校準」!!';
      return;
    }
    measureResultText.value = '點選畫出多邊形封閉範圍';
  }
  drawMeasurement();
}

// --- 丈量模式開關 ---
function toggleMeasureMode() {
  measureActive.value = !measureActive.value;
  if (measureActive.value) {
    // 啟用丈量: 保留當前縮放比例，綁定 Canvas 事件
    nextTick(() => {
      const canvas = measureCanvasRef.value;
      if (canvas) {
        canvas.addEventListener('mousedown', onMeasureCanvasClick);
        canvas.addEventListener('mousemove', onMeasureCanvasMouseMove);
        canvas.addEventListener('mouseleave', onMeasureCanvasMouseLeave);
        canvas.addEventListener('touchstart', onMeasureCanvasTouch, { passive: false });
      }
      resetMeasureCanvasSize();
      setupMeasureResizeObserver();
    });
  } else {
    // 停用丈量: 移除 Canvas 事件
    const canvas = measureCanvasRef.value;
    if (canvas) {
      canvas.removeEventListener('mousedown', onMeasureCanvasClick);
      canvas.removeEventListener('mousemove', onMeasureCanvasMouseMove);
      canvas.removeEventListener('mouseleave', onMeasureCanvasMouseLeave);
      canvas.removeEventListener('touchstart', onMeasureCanvasTouch);
    }
    cleanupMeasureResizeObserver();
    // 沒有留下的丈量圖形就釋放 Canvas
    resetMeasureCanvasSize();
  }
}

// --- 圖面切換時重置丈量 ---
function resetMeasureTool() {
  if (measureActive.value) {
    toggleMeasureMode(); // 關閉
  }
  clearAllMeasurements();
  measurePxPerCm.value = 0;
  measureMode.value = 'calibrate';
  measureResultText.value = '請在圖上點兩點進行校準';
  resetViewerZoom(); // 重置縮放
  nextTick(() => resetMeasureCanvasSize());
}

// 監聽圖片切換, 重置丈量工具（關閉期間換圖也要重置，避免沿用上一張的丈量）
watch(() => props.index, () => {
  resetMeasureTool();
});

watch(dialogModel, (open) => {
  if (open) {
    resetViewerZoom(); // 開啟時重置縮放
    return;
  }
  // 關閉時結束丈量模式並重置縮放
  if (measureActive.value) toggleMeasureMode();
  resetViewerZoom();
  showInfoOverlay.value = false;
});

onUnmounted(() => {
  if (wheelRaf) cancelAnimationFrame(wheelRaf);
  if (guideRaf) cancelAnimationFrame(guideRaf);
  cleanupMeasureResizeObserver();
});
</script>

<style scoped>
.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background-color: rgba(0, 0, 0, 0.4) !important;
  color: white !important;
  z-index: 10;
}

.image-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(0, 0, 0, 0.4) !important;
  color: white !important;
}

.image-nav-btn.prev {
  left: 16px;
}

.image-nav-btn.next {
  right: 16px;
}

.total-area-card {
  display: flex;
  align-items: center;
  background-color: #F5F5F5;
  padding: 12px 16px;
  border-radius: 8px;
}

.area-summary-item {
  display: flex;
  align-items: center;
  flex: 1;
}

.total-area-title {
  font-size: 0.9rem;
  color: #555;
}

.total-area-subtitle {
  font-size: 0.8rem;
  color: #777;
}

.area-details {
  font-size: 0.9rem;
}

.area-group {
  border: 1px solid #ECEFF1;
  border-radius: 6px;
  padding: 8px;
  height: 100%;
}

.area-group-title {
  font-weight: 600;
  color: #37474F;
  margin-bottom: 8px;
}

.area-item:last-child {
  border-bottom: none;
}

.fullscreen-actions {
  position: absolute;
  bottom: 24px;
  right: 24px;
  z-index: 10;
  display: flex;
}

.fullscreen-info-sidebar {
  position: absolute;
  top: 16px;
  left: 16px;
  bottom: 16px;
  width: 320px;
  max-width: 85vw;
  z-index: 9;
  display: flex;
  flex-direction: column;
}

.overlay-scroll-container {
  overflow-y: auto;
  height: 100%;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5) !important;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* 數據字體優化 */
.total-area-value-sm {
  font-size: 1.3rem;
  font-weight: 700;
  color: #1A237E;
  line-height: 1.2;
}

.area-ping-value-sm {
  font-weight: 600;
  color: #1A237E;
}

/* 確保與主介面明細樣式一致 */
.fullscreen-info-sidebar :deep(.area-item-header) {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  font-size: 0.75rem;
  color: #78909C;
  border-bottom: 1px solid #CFD8DC;
  padding: 2px 4px;
}

.fullscreen-info-sidebar :deep(.area-item) {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  padding: 6px 4px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.85rem;
}

.fullscreen-info-sidebar :deep(.area-item span:not(:first-child)) {
  text-align: right;
}

/* 右下角按鈕容器 */
.fullscreen-actions {
  position: absolute;
  bottom: 24px;
  right: 24px;
  z-index: 10;
  display: flex;
}

/* ============================================================ */
/* ===== 圖片縮放平移 (Zoom & Pan) 樣式 ===== */
/* ============================================================ */

/* 全螢幕檢視器背景：淺灰白（非純白，讓白底圖片邊界可辨識） */
.fullscreen-viewer {
  background-color: #e8eaed !important;
}

/* 縮放外層容器 */
.fullscreen-zoom-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 縮放比例指示器 */
.zoom-indicator {
  position: absolute;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 11;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  padding: 5px 16px;
  border-radius: 20px;
  pointer-events: none;
  letter-spacing: 0.5px;
}

/* fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ============================================================ */
/* ===== 丈量工具 (Measurement Tool) 樣式 ===== */
/* ============================================================ */

/* 圖片 + Canvas 疊加容器 (受 transform 控制) */
.fullscreen-image-measure-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 原生圖片（替換 v-img） */
.fullscreen-image-native {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
}

/* Canvas 疊加於圖片上方 — JS 動態設定 left/top/width/height */
.measure-canvas {
  position: absolute;
  pointer-events: none;
  z-index: 5;
  touch-action: none;
}

/* 丈量模式啟用時，Canvas 接收滑鼠事件並顯示十字游標 */
.measuring .measure-canvas {
  pointer-events: auto;
  cursor: crosshair;
}

/* 刪除按鈕容器 — JS 動態設定 left/top/width/height */
.measure-buttons-container {
  position: absolute;
  pointer-events: none;
  z-index: 15;
  overflow: visible;
}

/* 丈量工具列 */
.fp-measure-tools {
  position: absolute;
  bottom: 80px;
  right: 24px;
  z-index: 12;
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-end;
  gap: 12px;
}

/* 開關按鈕 */
.fp-measure-toggle {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(180, 165, 130, 0.5);
  padding: 10px 20px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  color: #1a1a1a;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.fp-measure-toggle:hover {
  background: #fff;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}

/* 控制面板 */
.fp-measure-panel {
  background: rgba(255, 255, 255, 0.97);
  border: 1px solid rgba(160, 150, 120, 0.35);
  border-radius: 14px;
  padding: 16px 20px;
  width: 330px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 面板標題 */
.fp-measure-panel-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
  padding-bottom: 6px;
  border-bottom: 2px solid #8b6914;
  margin-bottom: 2px;
}

.fp-measure-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.fp-measure-row label {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;
}

.fp-measure-row input[type="number"] {
  border: 1.5px solid #aaa;
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  background: #fff;
  outline: none;
  transition: border-color 0.2s;
}

.fp-measure-row input[type="number"]:focus {
  border-color: #8b6914;
  box-shadow: 0 0 0 2px rgba(139, 105, 20, 0.15);
}

/* 模式切換按鈕群組 */
.fp-measure-btn-group {
  display: flex;
  gap: 4px;
}

.fp-measure-btn-group button {
  padding: 6px 12px;
  border: 1.5px solid #bbb;
  border-radius: 6px;
  background: #f0f0f0;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
  color: #333;
}

.fp-measure-btn-group button:hover {
  background: #e5e5e5;
  border-color: #999;
}

.fp-measure-btn-group button.active {
  background: #8b6914;
  color: #fff;
  border-color: #7a5c10;
  box-shadow: 0 2px 6px rgba(139, 105, 20, 0.3);
}

/* 清除按鈕 */
.fp-measure-clear-btn {
  width: 100%;
  padding: 7px 12px;
  border: 1.5px solid #dc2626;
  border-radius: 6px;
  background: rgba(220, 38, 38, 0.06);
  color: #b91c1c;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.fp-measure-clear-btn:hover {
  background: #dc2626;
  color: #fff;
}

/* 結果顯示區 */
.fp-measure-result {
  font-size: 15px;
  font-weight: 700;
  text-align: center;
  background: #fdf6e3;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1.5px solid #d4a843;
  word-break: keep-all;
  line-height: 1.5;
  color: #1a1a1a;
}

/* 浮動「完成」按鈕 */
.fp-floating-btn {
  position: absolute;
  transform: translate(-50%, 10px);
  background: #bd985c;
  color: white;
  border: none;
  padding: 3px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  pointer-events: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  display: none;
  white-space: nowrap;
  z-index: 10;
  transition: background 0.2s ease;
}

.fp-floating-btn:hover {
  background: #a07e43;
}

/* 刪除按鈕 (形狀右上角) */
.fp-delete-btn {
  position: absolute;
  background: rgba(220, 38, 38, 0.9);
  color: white;
  border: 1.5px solid rgba(255, 255, 255, 0.6);
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  pointer-events: auto;
  z-index: 20;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  line-height: 1;
}

.fp-delete-btn:hover {
  background: #dc2626;
  transform: translate(-50%, -50%) scale(1.2);
}
</style>
