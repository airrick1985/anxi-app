<template>
  <div class="floorplan-sizing-wrapper fill-height">
    <v-toolbar dark color="primary" density="compact" class="flex-shrink-0">
      <v-btn icon="mdi-arrow-left" @click="goBack"></v-btn>
      <v-toolbar-title>
        平面圖測量工具 - {{ unitId || '讀取中...' }}
      </v-toolbar-title>
      <v-spacer></v-spacer>
    </v-toolbar>

    <div v-if="isLoading" class="loading-container">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4 text-grey-darken-1">正在載入 SVG 圖檔...</p>
    </div>

    <div v-else-if="error" class="error-container">
        <v-icon size="x-large" color="error">mdi-alert-circle-outline</v-icon>
        <p class="mt-4 text-error">無法載入平面圖：{{ error }}</p>
        <v-btn @click="fetchSvgContent" color="primary" class="mt-4">重試</v-btn>
    </div>

    <div v-else class="d-flex flex-column fill-height">
        <div class="toolbar">
             <v-btn-toggle v-model="tool" color="primary" variant="outlined" density="compact" mandatory>
                 <v-btn value="pan">
                     <v-icon>mdi-cursor-move</v-icon>
                     <span class="d-none d-sm-inline ml-2">拖曳/縮放</span>
                 </v-btn>
                 <v-btn value="calibrate">
                     <v-icon>mdi-ruler-square</v-icon>
                     <span class="d-none d-sm-inline ml-2">校準</span>
                 </v-btn>
                 <v-btn value="distance" :disabled="!isCalibrated">
                     <v-icon>mdi-ruler</v-icon>
                     <span class="d-none d-sm-inline ml-2">測量距離</span>
                 </v-btn>
                 <v-btn value="area" :disabled="!isCalibrated">
                     <v-icon>mdi-texture-box</v-icon>
                     <span class="d-none d-sm-inline ml-2">測量面積</span>
                 </v-btn>
             </v-btn-toggle>
             <v-spacer></v-spacer>
             <v-btn v-if="hasMeasurements" @click="clearMeasurements" variant="text" color="error" size="small">
                 <v-icon left>mdi-delete-sweep</v-icon>
                 清除標記
             </v-btn>
             <div v-if="isCalibrated" class="scale-info text-success">
                 <v-icon color="success">mdi-check-circle</v-icon>
                 <span class="ml-1">已校準</span>
             </div>
              <div v-else class="scale-info text-warning">
                 <v-icon color="warning">mdi-alert</v-icon>
                 <span class="ml-1">未校準</span>
             </div>
        </div>
        
        <div v-if="isCalibrating || isMeasuringDistance || isMeasuringArea || tool === 'pan'" class="action-prompt">
            <v-icon color="white" class="mr-2" size="small">mdi-information-outline</v-icon>
            
            <div class="d-flex align-center flex-wrap justify-center" style="gap: 8px;">
                <span v-if="tool === 'pan'">(按住 Alt 鍵可拖曳平移，滾輪可縮放)</span>
                <span v-if="isCalibrating">請點擊圖面上有標記距離線段的【起點】{{ calibrationPoints.length > 0 ? '和【終點】' : '' }} ({{ calibrationPoints.length }}/2)</span>
                <span v-if="isMeasuringDistance">請點擊測量距離的【起點】{{ currentDistance.p1 ? '和【終點】' : '' }}</span>
                <span v-if="isMeasuringArea">請依序點擊測量區域的【頂點】<span v-if="!mobile">，雙擊左鍵可封閉圖形</span></span>

                <div class="d-flex align-center">
                    <v-btn v-if="isCalibrating && calibrationPoints.length > 0" size="x-small" variant="tonal" color="white" @click="resetCalibration" class="ml-2">重設</v-btn>
                    <v-btn v-if="isMeasuringDistance && currentDistance.p1" size="x-small" variant="tonal" color="white" @click="resetCurrentDistance" class="ml-2">取消本次</v-btn>
                    
                   <v-btn 
              v-if="isTouchDevice && isMeasuringArea && currentAreaPoints.length > 2" 
              size="small" 
              color="success" 
              variant="flat" 
              @click="completeAreaMeasurement" 
              class="ml-2"
            >
              <v-icon start>mdi-check</v-icon>範圍確認
            </v-btn>
                    
                    <v-btn v-if="isMeasuringArea && currentAreaPoints.length > 0" size="x-small" variant="text" color="red-lighten-3" @click="resetCurrentArea" class="ml-2">清除重測</v-btn>
                </div>
            </div>
        </div>

        <div class="canvas-container" ref="canvasContainer">
            <canvas ref="canvasEl"></canvas>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { fabric } from 'fabric';
import { useDisplay } from 'vuetify';
// ✅ START: 移除路由功能，引入 API
// import { useRoute, useRouter } from 'vue-router'; // 移除
import { getHouseholdByUnitId, getSvgBySvgName } from '@/api';
// ✅ END: 移除

const isTouchDevice = ref(false);
const { mobile } = useDisplay();

// --- State and Refs ---
// ✅ START: 移除 route 相關變數，改用 defineProps 和 defineEmits
const props = defineProps({
  projectId: { type: String, required: true },
  unitId: { type: String, required: true },
});
const emit = defineEmits(['close']);
// ✅ END

const isLoading = ref(true);
const svgUrl = ref(null);
const error = ref(null);
const tool = ref('pan');
const isCalibrated = ref(false);
const scaleRatio = ref(0);
const calibrationPoints = ref([]);
const distanceMeasurements = ref([]);
const currentDistance = ref({ p1: null, p2: null });
const areaMeasurements = ref([]);
const currentAreaPoints = ref([]);

const canvasContainer = ref(null);
const canvasEl = ref(null);
let fabricCanvas = null;
let calibrationLine = null;
let currentDrawingLine = null;
let previewPolygon = null;  
let resizeObserver = null;

// --- Computed ---
const isCalibrating = computed(() => tool.value === 'calibrate');
const isMeasuringDistance = computed(() => tool.value === 'distance' && isCalibrated.value);
const isMeasuringArea = computed(() => tool.value === 'area' && isCalibrated.value);
const hasMeasurements = computed(() => distanceMeasurements.value.length > 0 || areaMeasurements.value.length > 0);

// --- Watchers ---
watch(tool, (newTool) => {
    if (!fabricCanvas) return;
    const isPanMode = newTool === 'pan';
    fabricCanvas.selection = isPanMode;
    fabricCanvas.forEachObject(obj => obj.selectable = isPanMode);
    fabricCanvas.defaultCursor = isPanMode ? 'default' : 'crosshair';
    fabricCanvas.renderAll();
    resetCurrentDistance();
    resetCurrentArea();
});

watch([isLoading, svgUrl], ([loading, url]) => {
    if (!loading && url) {
        nextTick(() => initializeFabric(url));
    }
});

// ✅ START: 修改後的資料載入邏輯
async function fetchSvgContent() {
  isLoading.value = true;
  error.value = null;
  destroyFabric();
  isCalibrated.value = false;

  try {
    // ✅ 使用 props 替代 route.params
    const pId = props.projectId;
    const uId = props.unitId;

    if (!pId || !uId) throw new Error("缺少專案或戶別 ID。");

    const householdData = await getHouseholdByUnitId(pId, uId);
    if (!householdData) throw new Error(`在資料庫中找不到戶別 ${uId} 的資料。`);
    if (!householdData.svgName) throw new Error(`戶別 ${uId} 尚未設定關聯的 SVG 圖檔。`);
    
    const svgData = await getSvgBySvgName(pId, householdData.svgName);
    if (!svgData || !svgData.downloadURL) throw new Error(`在資料庫中找不到名為 ${householdData.svgName} 的 SVG 圖檔。`);

    const response = await fetch(svgData.downloadURL);
    if (!response.ok) throw new Error(`無法從連結下載 SVG 檔案 (HTTP ${response.status})`);
    
    const svgText = await response.text();
    const svgBlob = new Blob([svgText], {type: 'image/svg+xml;charset=utf-8'});
    svgUrl.value = URL.createObjectURL(svgBlob);

  } catch (err) {
    error.value = err.message || '發生未知錯誤';
  } finally {
    isLoading.value = false;
  }
}
// ✅ END

// --- Fabric.js and Measurement Logic (維持不變) ---
function initializeFabric(imageUrl) {
    if (!canvasContainer.value) return;
    fabricCanvas = new fabric.Canvas(canvasEl.value);
    resizeCanvas();
    fabric.Image.fromURL(imageUrl, (img) => {
        fabricCanvas.setBackgroundImage(img, () => {
            recenterBackgroundImage();
            fabricCanvas.renderAll();
        });
    });
    setupFabricEvents();
    tool.value = 'pan'; 
}

function resizeCanvas() {
    if (!fabricCanvas || !canvasContainer.value) return;
    const { clientWidth, clientHeight } = canvasContainer.value;
    if (clientWidth > 0 && clientHeight > 0) {
        fabricCanvas.setDimensions({ width: clientWidth, height: clientHeight });
        recenterBackgroundImage();
    }
}

function recenterBackgroundImage() {
    if (!fabricCanvas || !fabricCanvas.backgroundImage) return;
    const bgImg = fabricCanvas.backgroundImage;
    const canvasAspect = fabricCanvas.width / fabricCanvas.height;
    const imgAspect = bgImg.width / bgImg.height;
    let scale = (canvasAspect > imgAspect) ? fabricCanvas.height / bgImg.height : fabricCanvas.width / bgImg.width;
    bgImg.set({ scaleX: scale, scaleY: scale, top: fabricCanvas.height / 2, left: fabricCanvas.width / 2, originX: 'center', originY: 'center' });
    fabricCanvas.renderAll();
}

// 用來記錄雙指操作的狀態
let lastTouchDistance = 0;
let isGesture = false; // 是否正在進行雙指手勢
let lastTouchCenter = { x: 0, y: 0 };

function setupFabricEvents() {
    // 1. 滑鼠滾輪縮放 (電腦版維持不變)
    fabricCanvas.on('mouse:wheel', function(opt) {
      const delta = opt.e.deltaY;
      let zoom = fabricCanvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.1) zoom = 0.1;
      fabricCanvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // 2. 按下 (支援滑鼠與觸控)
    fabricCanvas.on('mouse:down', function(opt) {
      const evt = opt.e;
      
      // ✅ [優化] 觸控裝置邏輯判斷
      if (evt.type === 'touchstart') {
          const touches = evt.touches;
          // 如果是雙指，進入手勢模式 (平移/縮放)
          if (touches && touches.length === 2) {
              isGesture = true;
              this.selection = false; // 暫停選取
              
              // 計算初始距離與中心點
              const p1 = { x: touches[0].clientX, y: touches[0].clientY };
              const p2 = { x: touches[1].clientX, y: touches[1].clientY };
              lastTouchDistance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
              lastTouchCenter = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
              return; // 雙指時不觸發點擊
          }
      }

      // 電腦版 Alt 鍵或 Pan 模式 -> 啟用拖曳
      // 手機版如果是單指且在 Pan 模式 -> 啟用拖曳
      if (evt.altKey === true || tool.value === 'pan') {
        this.isDragging = true;
        this.selection = false;
        // 相容 touch 與 mouse 的座標獲取
        this.lastPosX = evt.clientX || (evt.touches ? evt.touches[0].clientX : 0);
        this.lastPosY = evt.clientY || (evt.touches ? evt.touches[0].clientY : 0);
      } else {
        // 測量模式下的點擊
        // 注意：在 touchstart 時不立即觸發測量點，避免是想拖曳
        // 但 fabric 的 mouse:down 對 click 處理較好，這裡維持原樣
        // 關鍵是上面已經攔截了雙指操作
        if (!isGesture) {
            const pos = this.getPointer(evt);
            if (isCalibrating.value) handleCalibrationClick(pos);
            else if (isMeasuringDistance.value) handleDistanceClick(pos);
            else if (isMeasuringArea.value) handleAreaClick(pos);
        }
      }
    });

    // 3. 移動 (處理拖曳、雙指縮放)
    fabricCanvas.on('mouse:move', function(opt) {
        const evt = opt.e;

        // ✅ [優化] 雙指縮放與平移邏輯
        if (evt.type === 'touchmove' && evt.touches && evt.touches.length === 2) {
            isGesture = true; // 確保標記為手勢中

            const p1 = { x: evt.touches[0].clientX, y: evt.touches[0].clientY };
            const p2 = { x: evt.touches[1].clientX, y: evt.touches[1].clientY };
            
            // A. 計算新距離 -> 縮放
            const newDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            const zoomStep = newDist / lastTouchDistance;
            let newZoom = fabricCanvas.getZoom() * zoomStep;
            // 限制縮放範圍
            if (newZoom > 20) newZoom = 20;
            if (newZoom < 0.1) newZoom = 0.1;

            // B. 計算新中心 -> 平移
            const newCenter = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
            const deltaX = newCenter.x - lastTouchCenter.x;
            const deltaY = newCenter.y - lastTouchCenter.y;

            // 應用縮放 (以雙指中心為基準)
            fabricCanvas.zoomToPoint({ x: newCenter.x, y: newCenter.y }, newZoom);
            
            // 應用平移
            const vpt = this.viewportTransform;
            vpt[4] += deltaX;
            vpt[5] += deltaY;

            // 更新狀態
            lastTouchDistance = newDist;
            lastTouchCenter = newCenter;
            
            this.requestRenderAll();
            // 阻止瀏覽器預設行為 (縮放網頁)
            if (evt.preventDefault) evt.preventDefault();
            return;
        }

        // 單指拖曳模式 (Pan)
        if (this.isDragging) {
            const clientX = evt.clientX || (evt.touches ? evt.touches[0].clientX : 0);
            const clientY = evt.clientY || (evt.touches ? evt.touches[0].clientY : 0);
            
            const vpt = this.viewportTransform;
            vpt[4] += clientX - this.lastPosX;
            vpt[5] += clientY - this.lastPosY;
            this.requestRenderAll();
            this.lastPosX = clientX;
            this.lastPosY = clientY;
            return;
        }

        // 測量時的輔助線移動 (僅在非手勢操作時)
        if (!isGesture) {
            const pos = this.getPointer(evt);
            if (isCalibrating.value && calibrationLine) {
                calibrationLine.set({ x2: pos.x, y2: pos.y });
            }
            if (isMeasuringDistance.value && currentDrawingLine) {
                currentDrawingLine.set({ x2: pos.x, y2: pos.y });
            }
            // Area 預覽多邊形
            if (isMeasuringArea.value && currentAreaPoints.value.length > 0) {
                if (previewPolygon) {
                    this.remove(previewPolygon);
                }
                const previewPoints = [...currentAreaPoints.value, pos];
                previewPolygon = new fabric.Polygon(previewPoints, {
                    fill: 'rgba(0,170,255,0.2)',
                    stroke: '#00aaff',
                    strokeWidth: 2,
                    selectable: false,
                    evented: false,
                    excludeFromExport: true,
                });
                this.add(previewPolygon);
            }
            this.requestRenderAll();
        }
    });

// 4. 放開 (mouse:up) - 保持不變
    fabricCanvas.on('mouse:up', function() {
      this.setViewportTransform(this.viewportTransform);
      this.isDragging = false;
      setTimeout(() => { isGesture = false; }, 100); 
      this.selection = tool.value === 'pan';
    });

    // ✅ [新增/恢復] 雙擊結束測量 (電腦版專用)
    // 這段代碼讓電腦使用者可以直接雙擊結束，不用去按按鈕
    fabricCanvas.on('mouse:dblclick', () => {
        if (isMeasuringArea.value && currentAreaPoints.value.length > 2) {
            completeAreaMeasurement();
        }
    });
}
function destroyFabric() {
    if (fabricCanvas) {
        fabricCanvas.dispose();
        fabricCanvas = null;
    }
    if(svgUrl.value) {
        URL.revokeObjectURL(svgUrl.value);
        svgUrl.value = null;
    }
}

function getPixelDistance(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

function resetCalibration() {
    if (calibrationLine) {
        fabricCanvas.remove(calibrationLine);
        calibrationLine = null;
    }
    calibrationPoints.value = [];
    fabricCanvas.requestRenderAll();
}

function handleCalibrationClick(pos) {
    if (calibrationPoints.value.length === 0) {
        calibrationPoints.value.push(pos);
        calibrationLine = new fabric.Line([pos.x, pos.y, pos.x, pos.y], {
            stroke: '#00aaff',
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
        });
        fabricCanvas.add(calibrationLine);
        return;
    }
    if (calibrationPoints.value.length === 1) {
        if (calibrationLine) {
            fabricCanvas.remove(calibrationLine);
            calibrationLine = null;
            fabricCanvas.renderAll();
        }
        const p1 = calibrationPoints.value[0];
        const pixelDistance = getPixelDistance(p1, pos);
        if (pixelDistance < 1) {
            alert('校準失敗：距離太近！');
            resetCalibration();
            return;
        }
        const realDistanceStr = prompt("請輸入這兩點的實際距離 (cm)：", "");
        if (realDistanceStr === null || realDistanceStr.trim() === "") {
            alert('校準已取消。');
            resetCalibration();
            return;
        }
        const realDistance = parseFloat(realDistanceStr);
        if (isNaN(realDistance) || realDistance <= 0) {
            alert('輸入無效，請輸入一個大於 0 的數字。');
            resetCalibration();
            return;
        }
        scaleRatio.value = realDistance / pixelDistance;
        isCalibrated.value = true;
        alert(`校準成功！比例尺已設定為 1 像素 ≈ ${(scaleRatio.value).toFixed(2)} cm`);
        calibrationPoints.value = [];
        tool.value = 'pan';
    }
}

function handleDistanceClick(pos) {
    if (!currentDistance.value.p1) {
        currentDistance.value.p1 = pos;
        currentDrawingLine = new fabric.Line([pos.x, pos.y, pos.x, pos.y], { stroke: '#00aaff', strokeWidth: 2, strokeDashArray: [5, 5], selectable: false, evented: false });
        fabricCanvas.add(currentDrawingLine);
    } else {
        const p1 = currentDistance.value.p1, p2 = pos;
        const realDist = getPixelDistance(p1, p2) * scaleRatio.value;
        fabricCanvas.remove(currentDrawingLine);
        const finalLine = new fabric.Line([p1.x, p1.y, p2.x, p2.y], { stroke: '#ff00ff', strokeWidth: 2.5, selectable: false, evented: false });
        const text = new fabric.Text(`${realDist.toFixed(1)} cm`, { left: (p1.x + p2.x) / 2, top: (p1.y + p2.y) / 2 - 20, fontSize: 16, fill: '#ff00ff', originX: 'center', originY: 'center', paintFirst: 'stroke', stroke: 'white', strokeWidth: 4 });
        const group = new fabric.Group([finalLine, text], { selectable: false, evented: false, isMeasurement: true });
        fabricCanvas.add(group);
        distanceMeasurements.value.push(group);
        resetCurrentDistance();
    }
}

function handleAreaClick(pos) {
    const startPoint = currentAreaPoints.value[0];
    if (currentAreaPoints.value.length > 2 && getPixelDistance(startPoint, pos) < 10) {
        completeAreaMeasurement();
        return;
    }
    currentAreaPoints.value.push(pos);
}

function completeAreaMeasurement() {
    if (previewPolygon) {
        fabricCanvas.remove(previewPolygon);
        previewPolygon = null;
    }
    const points = currentAreaPoints.value;
    if (points.length < 3) { resetCurrentArea(); return; }
    let pixelArea = 0;
    for (let i = 0; i < points.length; i++) {
        const p1 = points[i], p2 = points[(i + 1) % points.length];
        pixelArea += (p1.x * p2.y - p2.x * p1.y);
    }
    pixelArea = Math.abs(pixelArea) / 2;
    const realAreaM2 = (pixelArea * Math.pow(scaleRatio.value, 2)) / 10000;
    const realAreaPing = realAreaM2 * 0.3025;
    const finalPolygon = new fabric.Polygon(points, { fill: 'rgba(255,0,255,0.2)', stroke: '#ff00ff', strokeWidth: 2.5, selectable: false, evented: false });
    const center = finalPolygon.getCenterPoint();
    const textContent = `${realAreaM2.toFixed(2)}M²\n約${realAreaPing.toFixed(2)}坪`;
    const text = new fabric.Textbox(textContent, { 
        left: center.x, 
        top: center.y, 
        fontSize: 14, 
        originX: 'center', 
        originY: 'center', 
        backgroundColor: 'rgba(255,255,255,0.8)', 
        textAlign: 'center',
        width: 90,
        padding: 5,
    });
    const group = new fabric.Group([finalPolygon, text], { selectable: false, evented: false, isMeasurement: true });
    fabricCanvas.add(group);
    areaMeasurements.value.push(group);
    resetCurrentArea();
}

function resetCurrentDistance() {
    if (currentDrawingLine) fabricCanvas.remove(currentDrawingLine);
    currentDrawingLine = null;
    currentDistance.value = { p1: null, p2: null };
}

function resetCurrentArea() {
    if (previewPolygon) {
        fabricCanvas.remove(previewPolygon);
        previewPolygon = null;
    }
    currentAreaPoints.value = [];
}

function clearMeasurements() {
    if (confirm('確定要清除所有測量標記嗎？')) {
        const objectsToRemove = fabricCanvas.getObjects().filter(obj => obj.isMeasurement === true);
        objectsToRemove.forEach(obj => fabricCanvas.remove(obj));
        distanceMeasurements.value = [];
        areaMeasurements.value = [];
        fabricCanvas.renderAll();
    }
}

// ✅ START: 修改 goBack 方法
const goBack = () => {
  emit('close'); // 觸發 close 事件，通知父元件關閉 Dialog
};
// ✅ END

// --- Lifecycle Hooks ---
onMounted(() => {

    // 判斷邏輯：
    // (A) 瀏覽器支援觸控點 (大部分手機/平板)
    // (B) 或者 Vuetify 認為是手機 (保險起見)
    isTouchDevice.value = (navigator.maxTouchPoints > 0) || mobile.value;

    fetchSvgContent();

    if (canvasContainer.value) {
        resizeObserver = new ResizeObserver(resizeCanvas);
        resizeObserver.observe(canvasContainer.value);
    }
});

onBeforeUnmount(() => {
    if (resizeObserver && canvasContainer.value) {
        resizeObserver.unobserve(canvasContainer.value);
    }
    destroyFabric();
});
</script>

<style scoped>
.floorplan-sizing-wrapper { 
  display: flex;
  flex-direction: column;
  width: 100%;
  /* ✅ height: 100vh 改為 100%，以適應 Dialog 容器 */
  height: 100%;
  background-color: #f0f2f5;
}
.loading-container, .error-container { 
  display: flex; 
  flex-direction: column; 
  justify-content: center; 
  align-items: center; 
  height: 100%; 
  padding: 16px; 
  text-align: center; 
}
.toolbar { 
  padding: 8px; 
  background-color: white; 
  border-bottom: 1px solid #ccc; 
  display: flex; 
  align-items: center; 
  flex-wrap: wrap; 
  flex-shrink: 0;
}
.scale-info { 
  font-size: 14px; 
  padding: 0 16px; 
  display: flex; 
  align-items: center; 
  white-space: nowrap; 
}
.action-prompt { 
  background-color: #424242; /* 深灰色背景，類似 Snackbar 風格 */
  color: white; 
  padding: 8px 16px; 
  text-align: center; 
  font-size: 14px; 
  /* 移除絕對定位，讓它自然流動 */
  /* position: absolute; */
  /* top: 48px; */
  /* left: 50%; */
  /* transform: translateX(-50%); */
  width: 100%; /* 佔滿寬度 */
  z-index: 5; 
  display: flex; 
  align-items: center; 
  justify-content: center; /* 內容置中 */
  flex-shrink: 0; /* 防止被壓縮 */
  box-shadow: 0 2px 4px rgba(0,0,0,0.2); /* 加入一點陰影增加層次感 */
}
.canvas-container { 
  position: relative; 
  flex-grow: 1; 
  width: 100%; 
  height: 100%; 
  overflow: hidden;
  touch-action: none; 
  
  /* 🔴原本的設定 (導致深色覆蓋感) */
  /* background-color: #333; */

  /* ✅ 修改為：白色背景 */
  background-color: #ffffff; 
}
</style>