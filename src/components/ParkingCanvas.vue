<template>
  <div class="parking-canvas-container center-xy" ref="containerRef">
    
    <div 
      class="parking-canvas-area" 
      ref="canvasAreaRef" 
      :style="canvasAreaStyle" >
      <img 
        v-if="bgImageUrl"
        :src="bgImageUrl" 
        class="background-image" 
        :style="bgImageStyles"
        @load="onBgImageLoad"
        draggable="false"
      />
      
     <vue-drag-resize-rotate
        v-for="spot in spotLayouts"
        class-name="parking-spot-item"
        :key="spot.id"
        :x="spot.x"
        :y="spot.y"
        :w="spot.width"
        :h="spot.height"
        :r="spot.rotation"
        :active="spot.id === selectedSpotId"
        :draggable="!previewMode && !spot.locked"
        :resizable="!previewMode && !spot.locked"
        :rotatable="!previewMode && !spot.locked"
        :is-conflict-check="false" 
        @activated="handleSpotActivated(spot)"
        @deactivated="handleSpotDeactivated"    
        @dragging="(x, y) => handleTransform(spot.id, { x, y }, 'dragging')"
        @resizing="(x, y, w, h) => handleTransform(spot.id, { x, y, w, h }, 'resizing')"
        @rotating="(r) => handleTransform(spot.id, { r }, 'rotating')"       
        @dragstop="(x, y) => handleTransformStop(spot.id, { x, y }, 'dragstop')"
        @resizestop="(x, y, w, h) => handleTransformStop(spot.id, { x, y, w, h }, 'resizestop')"
        @rotatestop="(r) => handleTransformStop(spot.id, { r }, 'rotatestop')"
        :snap="true"
        :snapTolerance="5"
        >
        <div 
          class="spot-content" 
          :style="getSpotStyle(spot)"
        >
          <span 
            v-for="field in getDisplayFields(displayMode, spot.parkingData)"
            :key="field.key"
            :style="getSpotTextStyle(field.key)"
          >
            {{ field.value }}
          </span>
        </div>
      </vue-drag-resize-rotate>
    </div>
    
   <div 
      v-if="showTools" 
      class="toolbar" 
      :style="toolbarStyle" 
      @mousedown="onToolbarDragStart"
    >
      <button v-if="allowImport" @click="openImportModal" class="btn btn-primary">
        <svg-icon type="mdi" :path="mdiDownload" class="icon"></svg-icon> 匯入車位資料
      </button>

      <button v-if="allowAdjustAll" @click="openAdjustAllPanel" class="btn btn-secondary">
        <svg-icon type="mdi" :path="mdiArrowExpandAll" class="icon"></svg-icon> 調整所有車位
      </button>
       
      <div v-if="showStatusToggle" class="status-toggle">
        <button 
          @click="switchDisplayMode('backend')"
          :class="['btn', 'btn-sm', { 'btn-active': displayMode === 'backend' }]"
        >
          後台狀態
        </button>
        <button 
          @click="switchDisplayMode('sales')"
          :class="['btn', 'btn-sm', { 'btn-active': displayMode === 'sales' }]"
        >
          銷售狀態
        </button>
      </div>
    </div>
    
    <!-- 匯入車位 Modal -->
    <div v-if="importDialog" class="modal-overlay" @click.self="closeImportModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>匯入車位資料</h3>
          <button @click="closeImportModal" class="btn-close">
            <svg-icon type="mdi" :path="mdiClose"></svg-icon>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="loading" class="loading-state">
            <p class="mt-4">正在載入車位資料...</p>
          </div>
          <div v-else-if="previewParkings.length > 0" class="import-preview">
            <p><strong>已取得車位編號如下</strong></p>
            <div class="parking-numbers">
              {{ previewParkings.map(p => p.number).join('、') }}
              <span v-if="totalParkingCount > 10">...等共 {{ totalParkingCount }} 個車位</span>
            </div>
            <p class="confirm-text">您是否要匯入以上車位？</p>
          </div>
          <div v-else class="no-data">
            <p>未找到符合條件的車位資料</p>
            <p>請檢查 projectId: <strong>{{ floorPlan.projectId }}</strong> 和 floor: <strong>{{ floorPlan.floor }}</strong></p>
          </div>
        </div>
        <div class="modal-footer">
          <button 
            v-if="previewParkings.length > 0" 
            @click="confirmImport" 
            class="btn btn-primary"
            :disabled="importing"
          >
            {{ importing ? '匯入中...' : '確認' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- 調整所有車位 Modal -->
    <div v-if="showAdjustAllPanel" class="modal-overlay" @click.self="closeAdjustAllPanel">
      <div class="modal-content" style="max-width: 350px;">
        <div class="modal-header">
          <h3>調整所有車位尺寸</h3>
          <button @click="closeAdjustAllPanel" class="btn-close">
            <svg-icon type="mdi" :path="mdiClose"></svg-icon>
          </button>
        </div>
        
        <div class="modal-body adjust-all-form">
          <div class="form-group">
            <label>寬度 (width)</label>
            <input 
              v-model.number="adjustAllWidth"
              type="number" 
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>高度 (height)</label>
            <input 
              v-model.number="adjustAllHeight"
              type="number" 
              class="form-input"
            />
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="applyAdjustAll" class="btn btn-primary">
            套用
          </button>
        </div>
      </div>
    </div>

    <!-- 屬性面板 -->
    <div v-if="selectedSpot" class="spot-properties-panel">
      <div class="panel-header">
        <h4>車位屬性</h4>
        <button @click="closePropertiesPanel" class="btn-close">
          <svg-icon type="mdi" :path="mdiClose"></svg-icon>
        </button>
      </div>
      <div class="panel-content">
        <div class="form-group">
          <label>車位編號</label>
          <input 
             :value="spotProperties.spotId" 
            @input="updateSpotProperty('spotId', $event.target.value)"
            type="text" 
            class="form-input"
          />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>X 座標</label>
            <input 
               :value="spotProperties.x" 
              @input="updateSpotProperty('x', Number($event.target.value))"
              type="number" 
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>Y 座標</label>
            <input 
               :value="spotProperties.y" 
              @input="updateSpotProperty('y', Number($event.target.value))"
              type="number" 
              class="form-input"
            />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>寬度</label>
            <input 
               :value="spotProperties.width" 
              @input="updateSpotProperty('width', Number($event.target.value))"
              type="number" 
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>高度</label>
            <input 
               :value="spotProperties.height" 
              @input="updateSpotProperty('height', Number($event.target.value))"
              type="number" 
              class="form-input"
            />
          </div>
        </div>
        <div class="form-group">
          <label>旋轉角度</label>
          <input 
             :value="spotProperties.rotation" 
            @input="updateSpotProperty('rotation', Number($event.target.value))"
            type="number" 
            step="1"
            class="form-input"
          />
        </div>
        <div class="panel-actions">
          <button @click="deleteSelectedSpot" class="btn btn-danger btn-sm">
            <svg-icon type="mdi" :path="mdiTrashCanOutline" class="icon"></svg-icon> 刪除車位
          </button>
        </div>
      </div>
    </div>

    <!-- 縮放工具 -->
    <div 
      class="zoom-controls"
      :style="zoomControlsStyle"
      @mousedown="onZoomControlsDragStart"
    >
      <button @click="zoomOut" class="btn btn-sm btn-secondary btn-icon" :disabled="canvasScale <= 0.2">
        <svg-icon type="mdi" :path="mdiMinus"></svg-icon>
      </button>
      <span>{{ Math.round(canvasScale * 100) }}%</span>
      <button @click="zoomIn" class="btn btn-sm btn-secondary btn-icon" :disabled="canvasScale >= 2">
        <svg-icon type="mdi" :path="mdiPlus"></svg-icon>
      </button>
      <button @click="fitToScreen" class="btn btn-sm btn-secondary">
        最適
      </button>
    </div>

    <!-- ✓ START: 修改樓層 Chip Group (加入 style 和 mousedown) -->
    <div 
      class="floor-chip-group" 
      :style="floorChipGroupStyle" 
      @mousedown="onFloorChipGroupDragStart"
    >
    <!-- ✓ END: 修改 -->
      <button
        v-for="plan in availableFloorPlans"
        :key="plan.id"
        @click="switchFloor(plan)"
        :class="['btn', 'btn-sm', { 'btn-active': plan.id === floorPlan.id }]"
      >
        {{ plan.floor }}
      </button>
    </div>

  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue' 
import VueDragResizeRotate from '@gausszhou/vue3-drag-resize-rotate'
import { db } from '@/firebase' 
import SvgIcon from '@jamescoyle/vue-icon';
import {
   getSalesParkingsByFloorForManager, 
   getSpotLayoutsAPI,
   getFloorPlansAPI,
} from '@/api'; 
import { 
  mdiDownload, 
  mdiLoading, 
  mdiClose, 
  mdiTrashCanOutline,
  mdiArrowExpandAll,
  mdiMinus, // ✓ 新增
  mdiPlus,  // ✓ 新增
} from '@mdi/js';
import { useToast } from 'vue-toastification';

export default {
  name: 'ParkingCanvas',
  components: {
    SvgIcon,
    VueDragResizeRotate, 
  },
  props: {
    // ... (props 不變)
    floorPlan: {
      type: Object,
      required: true
    },
    projectId: {
      type: String,
      required: true
    },
    previewMode: {
      type: Boolean,
      default: false
    },
    displayMode: {
      type: String,
      default: 'backend'
    },
    textStyles: {
      type: Object,
      default: () => ({})
    },
    statusColors: {
      type: Object,
      default: () => ({})
    },
    showTools: {
      type: Boolean,
      default: true
    },
    // ✅ START: 新增 props 以實現精細控制
    allowImport: {
      type: Boolean,
      default: true // 預設顯示「匯入」
    },
    allowAdjustAll: {
      type: Boolean,
      default: true // 預設顯示「調整所有」
    },
    showStatusToggle: {
      type: Boolean,
      default: true // 預設顯示「狀態切換」
    }
  },
  emits: ['spots-changed', 'canvas-ready', 'zoom-changed', 'pan-changed', 'update:displayMode', 'floor-switched'],
  setup(props, { emit }) {
    const toast = useToast(); 

    // ... (工具列/縮放 拖曳狀態 ref 保持不變) ...
    const toolbarStyle = ref({
      position: 'absolute',
      top: '20px',
      left: '20px',
      zIndex: 10,
      cursor: 'move',
    });
    const isDraggingToolbar = ref(false);
    const dragStartX = ref(0);
    const dragStartY = ref(0);
    const toolbarInitialX = ref(0);
    const toolbarInitialY = ref(0);
    const zoomControlsStyle = ref({
      position: 'absolute',
      top: '20px',
      right: '20px',
      zIndex: 10,
      cursor: 'move',
    });
    const isDraggingZoomControls = ref(false);
    const zoomDragStartX = ref(0);
    const zoomDragStartY = ref(0);
    const zoomInitialX = ref(0);
    const zoomInitialY = ref(0);

    // ✓ START: Floor-chip-group 拖曳狀態
    const floorChipGroupStyle = ref({
      position: 'absolute',
      top: '80px', // 預設位置
      right: '20px', // 預設位置
      zIndex: 10,
      cursor: 'move',
    });
    const isDraggingFloorChipGroup = ref(false);
    const floorChipDragStartX = ref(0);
    const floorChipDragStartY = ref(0);
    const floorChipInitialX = ref(0); // 將儲存 'right'
    const floorChipInitialY = ref(0); // 將儲存 'top'
    // ✓ END: Floor-chip-group 拖曳狀態

    // ... (畫布 DOM ref 保持不變) ...
    const canvasWidth = ref(1700) 
    const canvasHeight = ref(850) 
    const canvasAreaRef = ref(null)
    const containerRef = ref(null) 
    const canvasScale = ref(1) 
    const canvasAreaStyle = computed(() => ({ 
      width: `${canvasWidth.value}px`,
      height: `${canvasHeight.value}px`,
      transform: `scale(${canvasScale.value})`,
      transformOrigin: 'top left', 
    }));

    // ... (車位狀態 ref 保持不變) ...
    const spotLayouts = ref([]) 
    const selectedSpotId = ref(null) 
    const selectedSpot = ref(null) 
    const spotProperties = ref({}) 

    // ... (背景圖/匯入 ref 保持不變) ...
    const bgImageUrl = ref(null) 
    const bgImageStyles = ref({}) 
    const importDialog = ref(false)
    const loading = ref(false)
    const importing = ref(false)
    const previewParkings = ref([])
    const totalParkingCount = ref(0)
    const allParkingData = ref([])

    // ... (測試用 ref 保持不變) ...
    const testX = ref(100);
    const testY = ref(100);

    // ... (調整所有車位 ref 保持不變) ...
    const showAdjustAllPanel = ref(false);
    const adjustAllWidth = ref(100);
    const adjustAllHeight = ref(100);

    // ... (樓層列表 ref 保持不變) ...
    const availableFloorPlans = ref([]);

    // ... (fitToScreen, 拖曳函式, addTestSpot 保持不變) ...
    const fitToScreen = () => {
      if (!containerRef.value || !canvasWidth.value || !canvasHeight.value) return;
      const containerW = containerRef.value.clientWidth - 40; 
      const containerH = containerRef.value.clientHeight - 40;
      const naturalW = canvasWidth.value;
      const naturalH = canvasHeight.value;
      const scale = Math.min(containerW / naturalW, containerH / naturalH);
      canvasScale.value = scale > 1 ? 1 : scale;
    };
    const onToolbarDragStart = (e) => {
      if (e.target.closest('button') || e.target.closest('input')) return; 
      isDraggingToolbar.value = true;
      const currentTop = parseInt(toolbarStyle.value.top, 10) || 20;
      const currentLeft = parseInt(toolbarStyle.value.left, 10) || 20;
      toolbarInitialX.value = currentLeft;
      toolbarInitialY.value = currentTop;
      dragStartX.value = e.clientX;
      dragStartY.value = e.clientY;
      document.addEventListener('mousemove', onToolbarDragMove);
      document.addEventListener('mouseup', onToolbarDragEnd);
    };
    const onToolbarDragMove = (e) => {
      if (!isDraggingToolbar.value) return;
      const dx = e.clientX - dragStartX.value;
      const dy = e.clientY - dragStartY.value;
      toolbarStyle.value.left = `${toolbarInitialX.value + dx}px`;
      toolbarStyle.value.top = `${toolbarInitialY.value + dy}px`;
    };
    const onToolbarDragEnd = () => {
      isDraggingToolbar.value = false;
      document.removeEventListener('mousemove', onToolbarDragMove);
      document.removeEventListener('mouseup', onToolbarDragEnd);
    };
    const onZoomControlsDragStart = (e) => {
      if (e.target.closest('button') || e.target.closest('input')) return; 
      isDraggingZoomControls.value = true;
      const currentTop = parseInt(zoomControlsStyle.value.top, 10) || 20;
      const currentRight = parseInt(zoomControlsStyle.value.right, 10) || 20;
      zoomInitialY.value = currentTop;
      zoomInitialX.value = currentRight;
      zoomDragStartX.value = e.clientX;
      zoomDragStartY.value = e.clientY;
      document.addEventListener('mousemove', onZoomControlsDragMove);
      document.addEventListener('mouseup', onZoomControlsDragEnd);
    };
    const onZoomControlsDragMove = (e) => {
      if (!isDraggingZoomControls.value) return;
      const dx = e.clientX - zoomDragStartX.value;
      const dy = e.clientY - zoomDragStartY.value;
      zoomControlsStyle.value.top = `${zoomInitialY.value + dy}px`;
      zoomControlsStyle.value.right = `${zoomInitialX.value - dx}px`; 
    };
    const onZoomControlsDragEnd = () => {
      isDraggingZoomControls.value = false;
      document.removeEventListener('mousemove', onZoomControlsDragMove);
      document.removeEventListener('mouseup', onZoomControlsDragEnd);
    };
    const addTestSpot = () => {
      const newId = `test-spot-${Date.now()}`;
      const newSpot = {
        id: newId, isNew: true, spotId: `TEST_${testX.value}_${testY.value}`,
        x: testX.value, y: testY.value, width: 100, height: 100, rotation: 0,
        locked: false, parkingData: { number: 'TEST' }, type: 'manual',
        displayMode: props.displayMode
      };
      spotLayouts.value = [ ...spotLayouts.value, newSpot ];
      nextTick(() => {
        selectedSpotId.value = newId;
        selectSpot(newSpot);
      });
    };
    const onBgImageLoad = (e) => {
      const img = e.target;
      if (canvasWidth.value === 1700 && canvasHeight.value === 850) { 
         if (!bgImageStyles.value.width && !bgImageStyles.value.height) {
            canvasWidth.value = img.naturalWidth;
            canvasHeight.value = img.naturalHeight;
         }
      }
      console.log('底圖載入完成。');
      nextTick(fitToScreen);
    };

    // ... (鍵盤微調函式 保持不變) ...
    const handleKeyDown = (event) => {
      if (!selectedSpotId.value) return;
      const spot = spotLayouts.value.find(s => s.id === selectedSpotId.value);
      if (!spot) return;
      const nudgeAmount = event.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;
      switch (event.key) {
        case 'ArrowUp': dy = -nudgeAmount; break;
        case 'ArrowDown': dy = nudgeAmount; break;
        case 'ArrowLeft': dx = -nudgeAmount; break;
        case 'ArrowRight': dx = nudgeAmount; break;
        default: return; 
      }
      event.preventDefault();
      spot.x = Math.round(spot.x + dx);
      spot.y = Math.round(spot.y + dy);
      if (spotProperties.value) {
        spotProperties.value.x = spot.x;
        spotProperties.value.y = spot.y;
      }
      emit('spots-changed');
    };

    // ✓ START: 新增縮放函式
    const zoomStep = 0.1;
    const maxZoom = 2.0;
    const minZoom = 0.2;

    const zoomIn = () => {
      // 使用 toFixed 避免浮點數精度問題
      canvasScale.value = parseFloat(Math.min(maxZoom, canvasScale.value + zoomStep).toFixed(2));
    };

    const zoomOut = () => {
      canvasScale.value = parseFloat(Math.max(minZoom, canvasScale.value - zoomStep).toFixed(2));
    };
    // ✓ END: 新增縮放函式

    // ✓ START: 新增 Floor-chip-group 拖曳函式
    const onFloorChipGroupDragStart = (e) => {
      // 檢查是否點擊在可互動元素 (按鈕) 上
      if (e.target.closest('button')) {
        return; 
      }
      isDraggingFloorChipGroup.value = true;
      const currentTop = parseInt(floorChipGroupStyle.value.top, 10) || 80;
      const currentRight = parseInt(floorChipGroupStyle.value.right, 10) || 20;
      floorChipInitialY.value = currentTop;
      floorChipInitialX.value = currentRight; // 儲存 'right'
      floorChipDragStartX.value = e.clientX;
      floorChipDragStartY.value = e.clientY;
      document.addEventListener('mousemove', onFloorChipGroupDragMove);
      document.addEventListener('mouseup', onFloorChipGroupDragEnd);
    };

    const onFloorChipGroupDragMove = (e) => {
      if (!isDraggingFloorChipGroup.value) return;
      const dx = e.clientX - floorChipDragStartX.value;
      const dy = e.clientY - floorChipDragStartY.value;
      floorChipGroupStyle.value.top = `${floorChipInitialY.value + dy}px`;
      floorChipGroupStyle.value.right = `${floorChipInitialX.value - dx}px`; 
    };

    const onFloorChipGroupDragEnd = () => {
      isDraggingFloorChipGroup.value = false;
      document.removeEventListener('mousemove', onFloorChipGroupDragMove);
      document.removeEventListener('mouseup', onFloorChipGroupDragEnd);
    };
    // ✓ END: 新增函式

    // ... (fetchAvailableFloors, switchFloor 保持不變) ...
    const fetchAvailableFloors = async () => {
      if (!props.projectId) return;
      try {
        const result = await getFloorPlansAPI(props.projectId);
        if (result.status === 'success' && result.data) {
          result.data.sort((a, b) => 
            (a.floor || '').localeCompare(b.floor || '', 'zh-Hant', { numeric: true })
          );
          availableFloorPlans.value = result.data;
          console.log('[Canvas] 成功載入樓層列表:', availableFloorPlans.value.map(p => p.floor));
        } else {
          toast.error(result.message || '無法載入樓層列表');
          availableFloorPlans.value = [];
        }
      } catch (error) {
        toast.error(`載入樓層列表失敗: ${error.message}`);
        availableFloorPlans.value = [];
      }
    };
    const switchFloor = (plan) => {
      if (plan.id === props.floorPlan.id) return; 
      emit('floor-switched', plan);
    };

    // ... (loadBackgroundImage, loadFloorData, fetchSalesParkingsForFloor 保持不變) ...
    const loadBackgroundImage = (url, options = {}) => {
      return new Promise((resolve) => {
        bgImageUrl.value = url;
        const left = options.left ?? 0;
        const top = options.top ?? 0;
        const width = options.width;
        const height = options.height;
        const angle = options.angle ?? 0;
        bgImageStyles.value = {
          left: `${left}px`,
          top: `${top}px`,
          width: width ? `${width}px` : 'auto', 
          height: height ? `${height}px` : 'auto', 
          transform: `rotate(${angle}deg)`,
          transformOrigin: 'top left',
        };
        if (width) { canvasWidth.value = width; }
        if (height) { canvasHeight.value = height; }
        console.log(`[Canvas] 背景圖樣式已設定。畫布原始尺寸: ${canvasWidth.value} x ${canvasHeight.value}`);
        resolve();
      });
    }
    const loadFloorData = async () => {
      console.log('--- loadFloorData ---');
      if (!props.floorPlan || !props.floorPlan.id) {
         console.log('loadFloorData 中止：缺少 floorPlan 或 floorPlan.id。');
         return;
      }
      if (props.floorPlan.backgroundImageUrl) {
        console.log('載入背景圖...');
        await loadBackgroundImage(props.floorPlan.backgroundImageUrl, {
          left: props.floorPlan.backgroundImageX,
          top: props.floorPlan.backgroundImageY,
          scaleX: props.floorPlan.backgroundImageScaleX,
          scaleY: props.floorPlan.backgroundImageScaleY,
          angle: props.floorPlan.backgroundImageRotation,
          width: props.floorPlan.backgroundImageWidth, 
          height: props.floorPlan.backgroundImageHeight,
        });
      }
      console.log('抓取銷售車位資料 (for data)...');
      await fetchSalesParkingsForFloor();
      console.log('抓取車位佈局 (for positions)...');
      try {
        const layoutResult = await getSpotLayoutsAPI(props.floorPlan.id, props.projectId);
        if (layoutResult.status === 'success') {
          console.log(`[Canvas] 成功獲取 ${layoutResult.layouts.length} 筆佈局資料。`);
          loadSpotLayouts(layoutResult.layouts || []);
        } else {
          throw new Error(layoutResult.message || '獲取佈局失敗');
        }
      } catch (error) {
         console.error('抓取車位佈局時發生錯誤:', error);
         toast.error(`抓取車位佈局失敗: ${error.message}`);
         loadSpotLayouts([]); 
      }
      console.log('[Canvas] loadFloorData 完成，準備發出 "canvas-ready" 事件。');
      emit('canvas-ready');
    };
    const fetchSalesParkingsForFloor = async () => {
      if (!props.floorPlan || !props.floorPlan.id) return
      loading.value = true
      try {
        const floorValue = (typeof props.floorPlan.floor === 'object' && props.floorPlan.floor !== null)
          ? props.floorPlan.floor.value
          : props.floorPlan.floor;
        const resultData = await getSalesParkingsByFloorForManager(
          props.projectId,
          floorValue
        );
        if (resultData.success) {
          allParkingData.value = resultData.allData || []
          previewParkings.value = resultData.preview || []
          totalParkingCount.value = resultData.total || 0
        } else {
          throw new Error(resultData.message || '後端查詢車位資料失敗');
        }
      } catch(error) {
          console.error(`查詢樓層 ${props.floorPlan.floor} 的車位資料失敗:`, error);
          toast.error(`查詢車位資料失敗: ${error.message}`);
          allParkingData.value = [];
          previewParkings.value = [];
          totalParkingCount.value = 0;
      } finally {
        loading.value = false
      }
    }

    // ... (樣式/顯示 輔助函式 保持不變) ...
    const getStatusColor = (mode, data) => {
      const statusColors = props.statusColors || {};
      const modeColors = statusColors[mode] || {};
      let statusKey;
      if (!data) {
        statusKey = 'default';
      } else if (mode === 'backend') {
        statusKey = data.status_backend || 'default';
      } else {
        statusKey = data.status === '已售' ? '已售' : 'default';
      }
      const defaultColorSet = { 
        backgroundColor: '#f5f5f5', 
        borderColor: '#000000', 
        textColor: '#000000' 
      };
      return modeColors[statusKey] || modeColors.default || defaultColorSet;
    };
    const getSpotStyle = (spot) => {
      const colorSet = getStatusColor(props.displayMode, spot.parkingData);
      if (typeof colorSet === 'string') {
        return {
          backgroundColor: colorSet,
          borderColor: '#000000', 
          color: '#000000',      
        };
      } else {
        return {
          backgroundColor: colorSet.backgroundColor,
          borderColor: colorSet.borderColor,
          color: colorSet.textColor,
        };
      }
    };
    const getSpotTextStyle = (fieldKey) => {
      const defaultStyles = { fontSize: '10px', fill: '#000' };
      const style = props.textStyles[fieldKey] || {};
      return {
        fontSize: style.fontSize ? `${style.fontSize}px` : defaultStyles.fontSize,
        color: style.fill || defaultStyles.fill,
        fontWeight: style.fontWeight || 'normal',
        fontFamily: style.fontFamily || 'Arial',
        display: 'block', 
        textAlign: 'center',
      };
    };
    const getDisplayFields = (mode, data) => {
      if (!data) return [{ key: 'number', value: 'N/A' }]; 
      const fields = mode === 'backend' 
        ? [
            { key: 'number', value: data.number },
            { key: 'price', value: data.price_transaction || data.price_list },
            { key: 'buyerUnitId', value: data.buyerUnitId },
            { key: 'buyerName', value: data.buyerName },
            { key: 'salesperson', value: data.salesperson },
            { key: 'size', value: data.size },
            { key: 'type', value: data.type }
          ]
        : data.status === '已售'
          ? [
              { key: 'number', value: data.number },
              { key: 'status', value: data.status }
            ]
          : [
              { key: 'number', value: data.number },
              { key: 'price', value: data.price_list },
              { key: 'size', value: data.size },
              { key: 'type', value: data.type }
            ]
      return fields.filter(f => f.value);
    }
    
    // ... (VDR 事件處理, 屬性面板函式 保持不變) ...
    const handleSpotActivated = (spot) => {
      if (props.previewMode) return;
      selectedSpotId.value = spot.id; 
      selectSpot(spot);
    };
    const handleSpotDeactivated = () => { };
    const handleTransform = (spotId, payload, eventType) => { 
      const { x, y, w, h, r } = payload;
      const spot = spotLayouts.value.find(s => s.id === spotId);
      if (spot) {
        if (x !== undefined) spot.x = Math.round(x);
        if (y !== undefined) spot.y = Math.round(y);
        if (w !== undefined) spot.width = Math.round(w);
        if (h !== undefined) spot.height = Math.round(h);
        if (r !== undefined) spot.rotation = Math.round(r);
        if (selectedSpotId.value !== spotId) {
            selectedSpotId.value = spot.id; 
            selectSpot(spot); 
        }
        if (eventType === 'dragging') {
          if (x !== undefined) spotProperties.value.x = spot.x;
          if (y !== undefined) spotProperties.value.y = spot.y;
        }
        if (eventType === 'resizing') {
          if (w !== undefined) spotProperties.value.width = spot.width;
          if (h !== undefined) spotProperties.value.height = spot.height;
          if (x !== undefined) spotProperties.value.x = spot.x;
          if (y !== undefined) spotProperties.value.y = spot.y;
        }
        if (eventType === 'rotating') {
          if (r !== undefined) spotProperties.value.rotation = spot.rotation;
        }
      }
    };
    const handleTransformStop = (spotId, payload, eventType) => {
      const { x, y, w, h, r } = payload; 
      const spot = spotLayouts.value.find(s => s.id === spotId);
      if (spot) {
        if (x !== undefined) spot.x = Math.round(x);
        if (y !== undefined) spot.y = Math.round(y);
        if (w !== undefined) spot.width = Math.round(w);
        if (h !== undefined) spot.height = Math.round(h);
        if (r !== undefined) spot.rotation = Math.round(r);
       if (selectedSpotId.value === spotId) {
          if (x !== undefined) spotProperties.value.x = spot.x;
          if (y !== undefined) spotProperties.value.y = spot.y;
          if (w !== undefined) spotProperties.value.width = spot.width;
          if (h !== undefined) spotProperties.value.height = spot.height;
          if (r !== undefined) spotProperties.value.rotation = spot.rotation;
        }
        emit('spots-changed');
      }
    };
    const selectSpot = (spot) => {
      selectedSpot.value = spot;
      const newProps = {
        spotId: spot.spotId || '',
        x: Math.round(spot.x),
        y: Math.round(spot.y),
        width: Math.round(spot.width),
        height: Math.round(spot.height),
        rotation: Math.round(spot.rotation),
      };
      spotProperties.value = newProps;
    }
    const updateSpotProperty = (property, value) => {
      if (!selectedSpot.value) return;
      const spot = spotLayouts.value.find(s => s.id === selectedSpot.value.id);
      if (!spot) return;
      switch (property) {
        case 'spotId':
          spot.spotId = value;
          if (spot.parkingData) spot.parkingData.number = value;
          break;
        case 'x': spot.x = Number(value); break;
        case 'y': spot.y = Number(value); break;
        case 'width': spot.width = Number(value); break;
        case 'height': spot.height = Number(value); break;
        case 'rotation': spot.rotation = Number(value); break;
      }
      if (spotProperties.value[property] !== value) {
        spotProperties.value[property] = value;
      }
      emit('spots-changed');
    };
    const closePropertiesPanel = () => {
      selectedSpot.value = null
      selectedSpotId.value = null
    }
    const deleteSelectedSpot = () => {
      if (!selectedSpot.value) return;
      if (confirm('確定要刪除此車位嗎？')) {
        const index = spotLayouts.value.findIndex(s => s.id === selectedSpot.value.id);
        if (index > -1) {
          spotLayouts.value.splice(index, 1);
          closePropertiesPanel();
          emit('spots-changed');
        }
      }
    }
    
    // ... (loadSpotLayouts, getSpotLayouts 保持不變) ...
    const loadSpotLayouts = (layouts) => {
      console.log(`[CANVAS LOG] loadSpotLayouts: 準備載入 ${layouts.length} 筆資料。`);
      const loadedSpots = layouts
        .filter(item => item.type !== 'backgroundImage') 
        .map(layout => {
          const fullParkingData = allParkingData.value.find(p => p.id === layout.salesParkingId) || {
              id: layout.salesParkingId, number: layout.spotId, status_backend: '可售', price_list: null, status: null
          };
          return {
            id: layout.id || `layout-${layout.salesParkingId || layout.spotId}-${Math.random()}`,
            isNew: !layout.id, 
            spotId: layout.spotId,
            x: layout.x || 0,
            y: layout.y || 0,
            width: layout.width || 100,
            height: layout.height || 100, 
            rotation: layout.rotation || 0,
            locked: false, 
            parkingData: fullParkingData,
            displayMode: layout.displayMode || props.displayMode
          };
        });
      spotLayouts.value = loadedSpots;
      console.log(`[Canvas] 已載入 ${loadedSpots.length} 個車位佈局到 DOM。`);
    };
    const getSpotLayouts = () => {
      return spotLayouts.value.map(spot => ({
        id: spot.isNew ? null : spot.id, 
        spotId: spot.spotId,
        x: Math.round(spot.x),
        y: Math.round(spot.y),
        width: Math.round(spot.width),
        height: Math.round(spot.height),
        rotation: Math.round(spot.rotation),
        type: spot.parkingData.id ? 'imported' : 'manual',
        salesParkingId: spot.parkingData?.id || null,
        displayMode: spot.displayMode
      }));
    }

    // ... (匯入車位 Modal 函式 保持不變) ...
    const openImportModal = async () => {
      importDialog.value = true
      await fetchSalesParkingsForFloor(); 
    }
    const closeImportModal = () => { importDialog.value = false }
    const confirmImport = async () => {
      importing.value = true;
      try {
        spotLayouts.value = spotLayouts.value.filter(s => s.type !== 'imported'); 
        const spotsData = allParkingData.value.map((parkingData, index) => {
          const x = 100 + (index % 10) * 60; 
          const y = 100 + (Math.floor(index / 10) * 200); 
          return {
            id: `imported-${parkingData.id}-${Math.random()}`,
            isNew: true,
            spotId: parkingData.number,
            x: x, y: y, width: 48, height: 105, rotation: 0,
            locked: false, parkingData: parkingData, 
            type: 'imported', displayMode: props.displayMode
          };
        });
        for (const spot of spotsData) {
          spotLayouts.value.push(spot);
          await new Promise(resolve => nextTick(resolve));
        }
        emit('spots-changed');
      } catch(error) { 
          toast.error(`匯入車位時發生錯誤: ${error.message}`);
      } finally {
        importing.value = false;
        closeImportModal();
      }
    };

    // ... (調整所有車位函式 保持不變) ...
    const openAdjustAllPanel = () => {
      if (selectedSpot.value) {
        adjustAllWidth.value = Math.round(selectedSpot.value.width);
        adjustAllHeight.value = Math.round(selectedSpot.value.height);
      } else if (spotLayouts.value.length > 0) {
        adjustAllWidth.value = Math.round(spotLayouts.value[0].width);
        adjustAllHeight.value = Math.round(spotLayouts.value[0].height);
      } else {
        adjustAllWidth.value = adjustAllWidth.value || 100;
        adjustAllHeight.value = adjustAllHeight.value || 100;
      }
      showAdjustAllPanel.value = true;
    };
    const closeAdjustAllPanel = () => {
      showAdjustAllPanel.value = false;
    };
    const applyAdjustAll = () => {
      const newWidth = Number(adjustAllWidth.value);
      const newHeight = Number(adjustAllHeight.value);
      if (newWidth <= 0 || newHeight <= 0) {
        toast.error('寬度與高度必須大於 0');
        return;
      }
      spotLayouts.value = spotLayouts.value.map(spot => {
        return { ...spot, width: newWidth, height: newHeight };
      });
      if (selectedSpot.value) {
        spotProperties.value.width = newWidth;
        spotProperties.value.height = newHeight;
      }
      emit('spots-changed');
      closeAdjustAllPanel();
    };

    // ... (模式切換 保持不變) ...
    const switchDisplayMode = (mode) => {
      emit('update:displayMode', mode)
      spotLayouts.value.forEach(spot => {
        spot.displayMode = mode;
      });
    }
  
    // --- 【修改】生命週期 ---
    let resizeObserver = null;
    onMounted(async () => {
      await nextTick();
      await fetchAvailableFloors(); 
      await loadFloorData(); 
      if (containerRef.value) {
        resizeObserver = new ResizeObserver(fitToScreen);
        resizeObserver.observe(containerRef.value);
      }
      fitToScreen();
      window.addEventListener('keydown', handleKeyDown);
    });

    onUnmounted(() => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      document.removeEventListener('mousemove', onToolbarDragMove);
      document.removeEventListener('mouseup', onToolbarDragEnd);
      document.removeEventListener('mousemove', onZoomControlsDragMove);
      document.removeEventListener('mouseup', onZoomControlsDragEnd);
      window.removeEventListener('keydown', handleKeyDown);
      // ✓ START: 移除 floor-chip-group 拖曳監聽
      document.removeEventListener('mousemove', onFloorChipGroupDragMove);
      document.removeEventListener('mouseup', onFloorChipGroupDragEnd);
      // ✓ END: 移除監聽
    });
    
    // --- 監聽 props 變化 ---
    watch(() => props.floorPlan.id, () => {
      spotLayouts.value = []; 
      bgImageUrl.value = null; 
      canvasScale.value = 1; 
      loadFloorData(); 
    })
    
    watch(() => props.projectId, (newVal, oldVal) => {
      if (newVal !== oldVal) {
        fetchAvailableFloors();
      }
    })

    return {
      // ... (原有 return 內容) ...
      containerRef, 
      canvasAreaRef,
      canvasAreaStyle,
      bgImageUrl,
      bgImageStyles,
      spotLayouts,
      selectedSpot,
      selectedSpotId,
      spotProperties,
      importDialog, loading, importing, previewParkings, totalParkingCount,
      displayMode: computed(() => props.displayMode),
      floorPlan: computed(() => props.floorPlan), // ✓ 已修改
      previewMode: computed(() => props.previewMode),
      getSpotLayouts,
      loadSpotLayouts, 
      updateSpotProperty,
      closePropertiesPanel,
      deleteSelectedSpot,
      openImportModal,
      closeImportModal,
      confirmImport,
      switchDisplayMode,
      handleSpotActivated,
      handleSpotDeactivated,
      handleTransformStop,
      onBgImageLoad,
      getSpotStyle,
      getDisplayFields,
      getSpotTextStyle,
      canvasScale,
      fitToScreen,
      handleTransform,
      testX,
      testY,
      addTestSpot,
      toolbarStyle,
      onToolbarDragStart,
      zoomControlsStyle,
      onZoomControlsDragStart,
      showAdjustAllPanel,
      adjustAllWidth,
      adjustAllHeight,
      openAdjustAllPanel,
      closeAdjustAllPanel,
      applyAdjustAll,
      availableFloorPlans,
      switchFloor,
      
      // ✓ START: 匯出 floor-chip-group 拖曳功能
      floorChipGroupStyle,
      onFloorChipGroupDragStart,

// ✓ START: 匯出縮放函式
      zoomIn,
      zoomOut,



      // Icons
      mdiDownload, mdiLoading, mdiClose, mdiTrashCanOutline,
      mdiArrowExpandAll,mdiMinus,mdiPlus
    }
  }
}
</script>

<style scoped>
/* ... (原有 .parking-canvas-container, :deep(.parking-spot-item), .parking-canvas-area, .background-image, .spot-content, canvas, .toolbar, .status-toggle, .spot-properties-panel, .panel-header, .btn-close, .panel-content, .form-group, .form-row, .form-input, .panel-actions, .modal-overlay, .modal-content, .modal-header, .modal-footer, .modal-body, .loading-state, .no-data, .parking-numbers, .adjust-all-form, .btn, .zoom-controls 樣式保持不變) ... */
.parking-canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: auto; 
  display: flex;
  justify-content: flex-start; 
  align-items: flex-start; 
  background-color: #f0f2f5;
}

:deep(.parking-spot-item) {
  position: absolute !important;
}

.parking-canvas-area {
  position: relative; 
  background-color: #ffffff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border: 1px solid #d9d9d9;
  flex-shrink: 0; 
  margin: 20px; 
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0; 
  pointer-events: none; 
}

.spot-content {
  width: 100%;
  height: 100%;
  border: 2px solid; 
  background-color: #fff; 
  color: #000; 
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 4px;
  box-sizing: border-box;
  overflow: hidden;
  font-family: Arial, sans-serif;
  user-select: none; 
}

canvas {
  border: 1px solid #d9d9d9;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.toolbar {
  display: flex;
  gap: 1rem;
  background: white;
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  user-select: none; 
}

.status-toggle {
  display: flex;
  background: #e9ecef;
  border-radius: 6px;
  padding: 4px;
}

.status-toggle .btn {
  background: transparent;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  transition: all 0.2s;
}

.status-toggle .btn.btn-active {
  background: white;
  color: #007bff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.spot-properties-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 280px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  z-index: 10;
  max-height: calc(100% - 40px);
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.panel-header h4 { margin: 0; }

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
}

.panel-content { padding: 1rem; }
.form-group { margin-bottom: 1rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
.form-group label { display: block; margin-bottom: 0.25rem; font-size: 0.9rem; }
.form-input { width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; }
.panel-actions { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e9ecef; }

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
}

.modal-header, .modal-footer {
  padding: 1.5rem;
  display: flex;
  align-items: center;
}

.modal-header { justify-content: space-between; border-bottom: 1px solid #e9ecef; }
.modal-header h3 { margin: 0; }
.modal-body { padding: 1.5rem; max-height: 60vh; overflow-y: auto; }
.modal-footer { justify-content: flex-end; gap: 0.75rem; border-top: 1px solid #e9ecef; }

.loading-state, .no-data { text-align: center; padding: 2rem; }
.parking-numbers { background: #f8f9fa; padding: 1rem; border-radius: 6px; margin: 1rem 0; }

.adjust-all-form .form-group {
  margin-bottom: 1rem;
}
.adjust-all-form .form-group label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
}
.adjust-all-form .form-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  font-weight: 500;
}
.btn .icon { margin-right: 4px; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-primary { background: #007bff; color: white; }
.btn-primary:hover:not(:disabled) { background: #0056b3; }
.btn-secondary { background: #000000; color: white; }
.btn-secondary:hover:not(:disabled) { background: #5a6268; }
.btn-danger { background: #dc3545; color: white; }
.btn-danger:hover:not(:disabled) { background: #c82333; }
.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
}

.zoom-controls {
  background: white;
  padding: 8px 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  gap: 8px;
  user-select: none; 
}


.zoom-controls span {
  font-size: 0.9rem;
  width: 40px;
  text-align: right;
  color: #333;
}

/* ✓ START: 新增 icon button 樣式 */
.btn.btn-icon {
  padding: 0.25rem; /* 移除左右 padding */
  width: 30px; /* 固定寬度 */
  height: 30px; /* 固定高度 */
  justify-content: center; /* 圖示居中 */
  border-radius: 50%; /* 圓形按鈕 */
  gap: 0; /* 移除 gap */
}

/* ✓ START: 修改 chip group 樣式 (移除定位，加入 user-select) */
.floor-chip-group {
  /* position: absolute; (由 style 動態綁定) */
  /* top: 80px; (由 style 動態綁定) */
  /* right: 20px; (由 style 動態綁定) */
  display: flex;
  flex-direction: column; 
  gap: 10px; 
  background: white;
  padding: 10px; 
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 10;
  user-select: none; /* ✓ 新增：防止拖曳時選取文字 */
}

.floor-chip-group .btn {
  background-color: #f8f9fa;
  color: #333;
  border: 1px solid #dee2e6;
  font-weight: 600;
  justify-content: center; 
  font-size: 1rem; 
  padding: 0.6rem 1.1rem; 
}

.floor-chip-group .btn.btn-active {
  background-color: #000000; 
  color: white;
  border-color: #f5f5f7;
}
/* ✓ END: 修改樣式 */
</style>

