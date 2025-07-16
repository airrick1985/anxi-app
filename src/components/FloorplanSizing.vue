<template>
  <div class="floorplan-sizing-wrapper fill-height">
    <div v-if="isLoading" class="loading-container">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4 text-grey-darken-1">正在初始化繪圖引擎...</p>
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
import { fetchSalesControlData, fetchSvgFromDrive } from '@/api';

// --- State and Props ---
const props = defineProps({
  unitData: { type: Object, required: true },
  projectName: { type: String, required: true }
});
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

// --- Refs ---
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

watch(() => props.unitData, () => fetchSvgContent(), { immediate: true });


// --- Fabric.js Initialization and Destruction ---
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

    // ✨ 新增：校準模式下的虛線預覽邏輯
    if (isCalibrating.value && calibrationLine) {
        calibrationLine.set({ x2: pos.x, y2: pos.y });
    }

    // --- 距離測量邏輯 (不變) ---
    if (isMeasuringDistance.value && currentDrawingLine) {
        currentDrawingLine.set({ x2: pos.x, y2: pos.y });
    }

    // --- 面積測量邏輯 (全新重寫) ---

    // 1. 先清除上一幀的預覽圖形
    if (previewPolygon) {
        this.remove(previewPolygon);
        previewPolygon = null;
    }
    
    // 2. 如果正在測量面積且至少已點擊一點，則繪製新的預覽圖形
    if (isMeasuringArea.value && currentAreaPoints.value.length > 0) {
        const previewPoints = [...currentAreaPoints.value, pos];

        previewPolygon = new fabric.Polygon(previewPoints, {
            fill: 'rgba(0,170,255,0.2)',
            stroke: '#00aaff',
            strokeWidth: 2,
            selectable: false,
            evented: false,
            excludeFromExport: true, // 確保這個臨時圖形不會被操作
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

onMounted(() => {
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


// --- Measurement Logic ---
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
    // 當使用者點擊第一點時
    if (calibrationPoints.value.length === 0) {
        calibrationPoints.value.push(pos);
        // 建立並顯示預覽用的虛線
        calibrationLine = new fabric.Line([pos.x, pos.y, pos.x, pos.y], {
            stroke: '#00aaff', // 使用與測量時相同的藍色
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
        });
        fabricCanvas.add(calibrationLine);
        return; // 等待使用者點擊第二點
    }

    // 當使用者點擊第二點時
    if (calibrationPoints.value.length === 1) {
        // 在彈出輸入框前，先移除預覽虛線
        if (calibrationLine) {
            fabricCanvas.remove(calibrationLine);
            calibrationLine = null;
            fabricCanvas.renderAll(); // 強制渲染一次，讓虛線消失
        }

        const p1 = calibrationPoints.value[0];
        const pixelDistance = getPixelDistance(p1, pos);

        if (pixelDistance < 1) {
            alert('校準失敗：距離太近！');
            resetCalibration(); // 使用新的重設函數
            return;
        }

        // 彈出輸入框，讓使用者輸入實際距離
        const realDistanceStr = prompt("請輸入這兩點的實際距離 (cm)：", "");

        // 如果使用者點擊「取消」或輸入為空，則中止校準
        if (realDistanceStr === null || realDistanceStr.trim() === "") {
            alert('校準已取消。');
            resetCalibration();
            return;
        }

        const realDistance = parseFloat(realDistanceStr);

        // 驗證輸入是否為有效的正數
        if (isNaN(realDistance) || realDistance <= 0) {
            alert('輸入無效，請輸入一個大於 0 的數字。');
            resetCalibration();
            return;
        }

        // 計算比例尺並完成校準
        scaleRatio.value = realDistance / pixelDistance;
        isCalibrated.value = true;
        alert(`校準成功！比例尺已設定為 1 像素 ≈ ${(scaleRatio.value).toFixed(2)} cm`);
        calibrationPoints.value = []; // 清空紀錄
        tool.value = 'pan'; // 切換回拖曳模式
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
        const group = new fabric.Group([finalLine, text], { 
        selectable: false, 
        evented: false,
        isMeasurement: true
    });
        fabricCanvas.add(group);
        distanceMeasurements.value.push(group);
        resetCurrentDistance();
    }
}

// 找到 handleAreaClick 函數
function handleAreaClick(pos) {
    const startPoint = currentAreaPoints.value[0];
    if (currentAreaPoints.value.length > 2 && getPixelDistance(startPoint, pos) < 10) {
        completeAreaMeasurement();
        return;
    }
    
    // 唯一的任務：將點擊的座標加入陣列
    currentAreaPoints.value.push(pos);
}

function completeAreaMeasurement() {
    // 在完成繪製前，清除最後的預覽圖形
    if (previewPolygon) {
        fabricCanvas.remove(previewPolygon);
        previewPolygon = null;
    }

    const points = currentAreaPoints.value;
    if (points.length < 3) { resetCurrentArea(); return; }
    
    // --- 面積計算邏輯 (不變) ---
    let pixelArea = 0;
    for (let i = 0; i < points.length; i++) {
        const p1 = points[i], p2 = points[(i + 1) % points.length];
        pixelArea += (p1.x * p2.y - p2.x * p1.y);
    }
    pixelArea = Math.abs(pixelArea) / 2;
    const realAreaM2 = (pixelArea * Math.pow(scaleRatio.value, 2)) / 10000;
    const realAreaPing = realAreaM2 * 0.3025;
    
    // --- 建立最終圖形與文字 (主要修改處) ---
    const finalPolygon = new fabric.Polygon(points, { fill: 'rgba(255,0,255,0.2)', stroke: '#ff00ff', strokeWidth: 2.5, selectable: false, evented: false });
    const center = finalPolygon.getCenterPoint();

    // ✨ 關鍵修正 #1: 調整文字內容與格式
    const textContent = `${realAreaM2.toFixed(2)}M²\n約${realAreaPing.toFixed(2)}坪`;

    // ✨ 關鍵修正 #2: 調整 Textbox 屬性以控制排版
    const text = new fabric.Textbox(textContent, { 
        left: center.x, 
        top: center.y, 
        fontSize: 14, 
        originX: 'center', 
        originY: 'center', 
        backgroundColor: 'rgba(255,255,255,0.8)', 
        textAlign: 'center',
        width: 90,      // 設定一個足夠的寬度，防止文字被不當換行
        padding: 5,     // 增加一點內邊距，讓文字更好看
    });

    const group = new fabric.Group([finalPolygon, text], { 
        selectable: false, 
        evented: false,
        isMeasurement: true
    });
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
    // 清除可能殘留的預覽圖形
    if (previewPolygon) {
        fabricCanvas.remove(previewPolygon);
        previewPolygon = null;
    }
    // 清空座標紀錄
    currentAreaPoints.value = [];
    // 舊的 currentDrawingPolygon 相關邏輯已完全移除
}

function clearMeasurements() {
    if (confirm('確定要清除所有測量標記嗎？')) {
        // 直接從畫布上取得所有物件，然後篩選出帶有 isMeasurement 標籤的物件
        // 這是比依賴外部陣列更可靠的方法
        const objectsToRemove = fabricCanvas.getObjects().filter(obj => obj.isMeasurement === true);
        
        // 遍歷篩選出來的物件並將它們從畫布上移除
        objectsToRemove.forEach(obj => fabricCanvas.remove(obj));
        
        // 重設追蹤陣列（這一步仍然重要，為了讓 v-if="hasMeasurements" 生效）
        distanceMeasurements.value = [];
        areaMeasurements.value = [];
        
        // 最後，重新渲染畫布，讓變更生效
        fabricCanvas.renderAll();
    }
}

async function fetchSvgContent() {
  isLoading.value = true;
  error.value = null;
  destroyFabric();
  isCalibrated.value = false;
  
  try {
    const salesControlResponse = await fetchSalesControlData(props.projectName);
    if (salesControlResponse.status !== 'success' || !salesControlResponse.data?.['銷控']) throw new Error('無法獲取銷控資料');
    const unitRow = salesControlResponse.data['銷控'].find(row => row['戶別'] === props.unitData['戶別']);
    if (!unitRow || !unitRow['平面圖SVG資料夾']) throw new Error(`找不到戶別 ${props.unitData['戶別']} 的平面圖資料夾`);
    const svgResponse = await fetchSvgFromDrive(unitRow['平面圖SVG資料夾']);
    if (svgResponse.status !== 'success' || !svgResponse.data?.svgContent) throw new Error(svgResponse.message || '獲取 SVG 內容失敗');
    
    const svgData = svgResponse.data.svgContent;
    const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
    svgUrl.value = URL.createObjectURL(svgBlob);
  } catch (err) {
    error.value = err.message || '發生未知錯誤';
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.floorplan-sizing-wrapper { position: relative; background-color: transparent; }
.loading-container, .error-container { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; padding: 16px; text-align: center; }
.toolbar { padding: 8px; background-color: white; border-bottom: 1px solid #ccc; display: flex; align-items: center; flex-wrap: wrap; }
.scale-info { font-size: 14px; padding: 0 16px; display: flex; align-items: center; white-space: nowrap; }
.action-prompt { background-color: rgba(0, 0, 0, 0.7); color: white; padding: 8px 12px; text-align: center; font-size: 14px; position: absolute; top: 50px; left: 50%; transform: translateX(-50%); border-radius: 4px; z-index: 10; display: flex; align-items: center; }
.canvas-container { position: relative; flex-grow: 1; width: 100%; height: 100%; overflow: hidden; }
</style>