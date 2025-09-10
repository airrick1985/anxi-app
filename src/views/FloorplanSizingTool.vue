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
            <v-icon color="white" class="mr-2">mdi-gesture-tap</v-icon>
            <span v-if="tool === 'pan'">(按住 Alt 鍵可拖曳平移，滾輪可縮放)</span>
            <span v-if="isCalibrating">請點擊圖面上有標記距離線段的【起點】{{ calibrationPoints.length > 0 ? '和【終點】' : '' }} ({{ calibrationPoints.length }}/2)</span>
            <span v-if="isMeasuringDistance">請點擊測量距離的【起點】{{ currentDistance.p1 ? '和【終點】' : '' }}</span>
            <span v-if="isMeasuringArea">請依序點擊測量區域的【頂點】，點擊起點或雙擊可封閉圖形</span>
            <v-btn v-if="isCalibrating && calibrationPoints.length > 0" size="small" variant="text" @click="resetCalibration" class="ml-4">重設</v-btn>
            <v-btn v-if="isMeasuringDistance && currentDistance.p1" size="small" variant="text" @click="resetCurrentDistance" class="ml-4">取消本次</v-btn>
            <v-btn v-if="isMeasuringArea && currentAreaPoints.length > 0" size="small" variant="text" @click="resetCurrentArea" class="ml-4">取消本次</v-btn>
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
// ✅ START: 引入路由功能和新的 API
import { useRoute, useRouter } from 'vue-router';
import { getHouseholdByUnitId, getSvgBySvgName } from '@/api';
// ✅ END: 引入

// --- State and Refs ---
// ✅ START: 移除 props，改用 route 來取得參數
const route = useRoute();
const router = useRouter();
const projectId = ref(null);
const unitId = ref(null);
// ✅ END: 移除 props

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

// ✅ START: 新的資料載入邏輯
async function fetchSvgContent() {
  isLoading.value = true;
  error.value = null;
  destroyFabric();
  isCalibrated.value = false;

  try {
    const pId = route.params.projectId;
    const uId = route.params.unitId;

    if (!pId || !uId) throw new Error("缺少專案或戶別 ID。");
    
    projectId.value = pId;
    unitId.value = uId;

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
// ✅ END: 新的資料載入邏輯

// --- Fabric.js and Measurement Logic (您原有的成熟邏輯，保持不變) ---
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

function setupFabricEvents() {
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

    fabricCanvas.on('mouse:down', function(opt) {
      const evt = opt.e;
      if (evt.altKey === true || tool.value === 'pan') {
        this.isDragging = true;
        this.selection = false;
        this.lastPosX = evt.clientX;
        this.lastPosY = evt.clientY;
      } else {
        const pos = this.getPointer(evt);
        if (isCalibrating.value) handleCalibrationClick(pos);
        else if (isMeasuringDistance.value) handleDistanceClick(pos);
        else if (isMeasuringArea.value) handleAreaClick(pos);
      }
    });

    fabricCanvas.on('mouse:move', function(opt) {
        if (this.isDragging) {
            const e = opt.e;
            const vpt = this.viewportTransform;
            vpt[4] += e.clientX - this.lastPosX;
            vpt[5] += e.clientY - this.lastPosY;
            this.requestRenderAll();
            this.lastPosX = e.clientX;
            this.lastPosY = e.clientY;
            return;
        }
        const pos = this.getPointer(opt.e);
        if (isCalibrating.value && calibrationLine) {
            calibrationLine.set({ x2: pos.x, y2: pos.y });
        }
        if (isMeasuringDistance.value && currentDrawingLine) {
            currentDrawingLine.set({ x2: pos.x, y2: pos.y });
        }
        if (previewPolygon) {
            this.remove(previewPolygon);
            previewPolygon = null;
        }
        if (isMeasuringArea.value && currentAreaPoints.value.length > 0) {
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
    });

    fabricCanvas.on('mouse:up', function() {
      this.setViewportTransform(this.viewportTransform);
      this.isDragging = false;
      this.selection = tool.value === 'pan';
    });

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

// ✅ 新增 goBack 方法
const goBack = () => {
  router.back();
};

// --- Lifecycle Hooks ---
onMounted(() => {
    // ✅ 在元件掛載時，直接觸發新的資料載入函式
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
/* ✅ 調整樣式以適應全頁面佈局 */
.floorplan-sizing-wrapper { 
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
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
  background-color: rgba(0, 0, 0, 0.7); 
  color: white; 
  padding: 8px 12px; 
  text-align: center; 
  font-size: 14px; 
  position: absolute; 
  top: 50px; /* 根據 toolbar 高度微調 */
  left: 50%; 
  transform: translateX(-50%); 
  border-radius: 4px; 
  z-index: 10; 
  display: flex; 
  align-items: center; 
}
.canvas-container { 
  position: relative; 
  flex-grow: 1; 
  width: 100%; 
  height: 100%; 
  overflow: hidden; 
}
</style>