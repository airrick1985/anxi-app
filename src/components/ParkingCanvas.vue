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
        :is-conflict-check="false" class-name="parking-spot-item"

        @activated="handleSpotActivated(spot)"
        @deactivated="handleSpotDeactivated"

        
        @dragging="(x, y) => handleTransform(spot.id, { x, y }, 'dragging')"
        @resizing="(x, y, w, h) => handleTransform(spot.id, { x, y, w, h }, 'resizing')"
        @rotating="(r) => handleTransform(spot.id, { r }, 'rotating')"
        
        @dragstop="(x, y) => handleTransformStop(spot.id, { x, y }, 'dragstop')"
        @resizestop="(x, y, w, h) => handleTransformStop(spot.id, { x, y, w, h }, 'resizestop')"
        @rotatestop="(r) => handleTransformStop(spot.id, { r }, 'rotatestop')"
   
        :parent="true"
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
    <div v-if="showTools" class="toolbar">
      <button @click="openImportModal" class="btn btn-primary">
        <svg-icon type="mdi" :path="mdiDownload" class="icon"></svg-icon> 匯入車位資料
      </button>

      <div class="test-tool">
        <span>X:</span>
        <input v-model.number="testX" type="number" class="form-input" style="width: 70px;">
        <span>Y:</span>
        <input v-model.number="testY" type="number" class="form-input" style="width: 70px;">
        <button @click="addTestSpot" class="btn btn-secondary btn-sm">加入測試方塊</button>
      </div>
  
      <div class="status-toggle">
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

    <div class="zoom-controls">
      <input 
        type="range" 
        min="0.2" 
        max="2" 
        step="0.05" 
        v-model.number="canvasScale"
      />
      <span>{{ Math.round(canvasScale * 100) }}%</span>
      <button @click="fitToScreen" class="btn btn-sm btn-secondary">
        最適
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
} from '@/api'; 
import { 
  mdiDownload, 
  mdiLoading, 
  mdiClose, 
  mdiTrashCanOutline,
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
    }
  },
  emits: ['spots-changed', 'canvas-ready', 'zoom-changed', 'pan-changed', 'update:displayMode'],
  setup(props, { emit }) {
    const toast = useToast(); 

    // 畫布 DOM
    const canvasWidth = ref(1700) 
    const canvasHeight = ref(850) 
    const canvasAreaRef = ref(null)
    const containerRef = ref(null) // 【新增】對 .parking-canvas-container 的 ref
    const canvasScale = ref(1) // 【新增】畫布縮放比例

    // 【修改】canvasAreaStyle 現在包含 transform
    const canvasAreaStyle = computed(() => ({ 
      width: `${canvasWidth.value}px`,
      height: `${canvasHeight.value}px`,
      transform: `scale(${canvasScale.value})`,
      transformOrigin: 'top left', //  關鍵：確保縮放基準點在左上角
    }));

    // 車位狀態 (不變)
    const spotLayouts = ref([]) 
    const selectedSpotId = ref(null) 
    const selectedSpot = ref(null) 
    const spotProperties = ref({}) 

    // 背景圖狀態 (不變)
    const bgImageUrl = ref(null) 
    const bgImageStyles = ref({}) 
    
    // 匯入車位資料 (不變)
    const importDialog = ref(false)
    const loading = ref(false)
    const importing = ref(false)
    const previewParkings = ref([])
    const totalParkingCount = ref(0)
    const allParkingData = ref([])


// ✓ START: 請加入以下測試用的 ref
    const testX = ref(100);
    const testY = ref(100);
    // ✓ END: 測試用的 ref

    // 【新增】計算並套用最適縮放
    const fitToScreen = () => {
      if (!containerRef.value || !canvasWidth.value || !canvasHeight.value) {
        console.warn('fitToScreen: 缺少容器或畫布尺寸');
        return;
      }
      
      // 容器可視寬高 (減去一些邊距)
      const containerW = containerRef.value.clientWidth - 40; 
      const containerH = containerRef.value.clientHeight - 40;
      
      // 畫布原始寬高
      const naturalW = canvasWidth.value;
      const naturalH = canvasHeight.value;

      // 計算 X 和 Y 的縮放比例
      const scale = Math.min(containerW / naturalW, containerH / naturalH);
      
      // 僅縮小，不放大 (如果原始尺寸就比容器小，保持 1)
      canvasScale.value = scale > 1 ? 1 : scale;
      console.log(`[Canvas] fitToScreen: scale set to ${canvasScale.value}`);
    };

    // ✓ START: 請加入以下測試用的函式
   const addTestSpot = () => {
      // 1. 產生唯一的 ID
      const newId = `test-spot-${Date.now()}`;
      
      // 2. 建立新物件
      const newSpot = {
        id: newId,
        isNew: true,
        spotId: `TEST_${testX.value}_${testY.value}`,
        x: testX.value,
        y: testY.value,
        width: 100,
        height: 100,
        rotation: 0,
        locked: false,
        parkingData: { number: 'TEST' },
        type: 'manual',
        displayMode: props.displayMode
      };
      
      // 3. ✓ 修改：直接修改 .value 陣列，繞過 .push() 可能的副作用
      spotLayouts.value = [
        ...spotLayouts.value,
        newSpot
      ];

      // 4. ✓ 修改：使用 nextTick 確保 DOM 更新後再選中
      nextTick(() => {
        selectedSpotId.value = newId;
        selectSpot(newSpot);
      });
    };
    // ✓ END: 測試用的函式



    // 【修改】DOM 底圖載入完成時
    const onBgImageLoad = (e) => {
      const img = e.target;
      
      // 【修改】如果畫布尺寸尚未由 loadBackgroundImage 設定，則使用圖片原始尺寸
      if (canvasWidth.value === 1700 && canvasHeight.value === 850) { // 檢查是否為預設值
         if (!bgImageStyles.value.width && !bgImageStyles.value.height) {
            console.log(`[Canvas] 底圖載入，使用圖片原始尺寸: ${img.naturalWidth} x ${img.naturalHeight}`);
            canvasWidth.value = img.naturalWidth;
            canvasHeight.value = img.naturalHeight;
         }
      }
      
      console.log('底圖載入完成。');
      
      // 【新增】底圖載入後，計算一次最適尺寸
      nextTick(fitToScreen);
    };
    
    // 初始化資料載入 (不變)
    const loadFloorData = async () => {
      console.log('--- loadFloorData ---');
      if (props.floorPlan && props.floorPlan.backgroundImageUrl) {
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
      
      if (props.floorPlan && props.floorPlan.id) {
        console.log('抓取銷售車位資料...');
        await fetchSalesParkingsForFloor();
      }

      console.log('載入車位佈局...');
      loadSpotLayouts(props.floorPlan.layouts || []);

      console.log('[Canvas] loadFloorData 完成，準備發出 "canvas-ready" 事件。');
      emit('canvas-ready');
    };

    // 抓取車位資料 (不變)
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

    // --- 樣式/顯示 輔助函式 (不變) ---
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

    // 【修改】getSpotStyle 函式
    const getSpotStyle = (spot) => {
      // 1. 取得 colorSet。
      //    它可能是字串 (來自 StatusColorEditor, e.g., '#FF0000')
      //    或一個完整的物件 (來自 getStatusColor 裡的 defaultColorSet)
      const colorSet = getStatusColor(props.displayMode, spot.parkingData);

      // 2. 檢查 colorSet 的類型
      if (typeof colorSet === 'string') {
        //  如果是字串 (來自 StatusColorEditor 的設定)
        // 我們用這個字串同時當作背景和邊框
        // 假設文字顏色永遠是黑色 (未來可再優化)
        return {
          backgroundColor: colorSet,
          borderColor: '#000000', //  使用黑色邊框
          color: '#000000',      //  使用黑色文字
        };
      } else {
        //  如果是物件 (來自 getStatusColor 裡的 defaultColorSet)
        // 照常使用
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
    
    // --- VDR 事件處理 (不變) ---
    const handleSpotActivated = (spot) => {
      if (props.previewMode) return;
      
      console.log(`[ParkingCanvas LOG] handleSpotActivated: Fired for spot.id = ${spot.id}`);
      
      selectedSpotId.value = spot.id; 
      
      selectSpot(spot);
    };

    const handleSpotDeactivated = () => {
      // 目前不需要執行任何動作，但函式必須存在
    };

// START: VDR 即時事件處理 (拖曳中/縮放中/旋轉中)
   const handleTransform = (spotId, payload, eventType) => { 
      
      console.log(`[ParkingCanvas LOG] handleTransform: Event=${eventType}, SpotID=${spotId}, Payload=${JSON.stringify(payload)}`);
      
      const { x, y, w, h, r } = payload;
      
      const spot = spotLayouts.value.find(s => s.id === spotId);
      if (spot) {
        // 1. 即時更新 spotLayouts (canvas)
        // 立即四捨五入，確保 spot.width 永遠是整數
        if (x !== undefined) spot.x = Math.round(x);
        if (y !== undefined) spot.y = Math.round(y);
        if (w !== undefined) spot.width = Math.round(w);
        if (h !== undefined) spot.height = Math.round(h);
        if (r !== undefined) spot.rotation = Math.round(r);

        // 2. 檢查並強制選中
        if (selectedSpotId.value !== spotId) {
            console.log(`[ParkingCanvas LOG]   -> Force activating spot ${spotId} during transform.`);
            selectedSpotId.value = spot.id; 
            selectSpot(spot); // selectSpot 會讀取 spot.width (已四捨五入)
        }
        
       // 3. 更新屬性面板 (spotProperties)
        if (eventType === 'dragging') {
          if (x !== undefined) spotProperties.value.x = spot.x;
          if (y !== undefined) spotProperties.value.y = spot.y;
        }
        if (eventType === 'resizing') {
          if (w !== undefined) spotProperties.value.width = spot.width;
          if (h !== undefined) spotProperties.value.height = spot.height;
          // ✓ 新增：在 resizing 時也必須更新 X 和 Y 座標
          if (x !== undefined) spotProperties.value.x = spot.x;
          if (y !== undefined) spotProperties.value.y = spot.y;
        }
        if (eventType === 'rotating') {
          if (r !== undefined) spotProperties.value.rotation = spot.rotation;
        }
      }
    };
// END

    const handleTransformStop = (spotId, payload, eventType) => {
      console.log(`[ParkingCanvas LOG] handleTransformStop: Event=${eventType}, SpotID=${spotId}, Payload=${JSON.stringify(payload)}`);
      
      const { x, y, w, h, r } = payload; // 現在 payload 是物件了
      
      const spot = spotLayouts.value.find(s => s.id === spotId);
      if (spot) {
        // 【修改】確保最終值也被四捨五入
        if (x !== undefined) spot.x = Math.round(x);
        if (y !== undefined) spot.y = Math.round(y);
        if (w !== undefined) spot.width = Math.round(w);
        if (h !== undefined) spot.height = Math.round(h);
        if (r !== undefined) spot.rotation = Math.round(r);

        // 如果正在編輯的車位被移動，同步更新屬性面板
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

    // --- 屬性面板 (不變) ---
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
      
      console.log(`[ParkingCanvas LOG] selectSpot: Setting spotProperties for ${spot.id}`, newProps);
      
      spotProperties.value = newProps;
    }
    const updateSpotProperty = (property, value) => {
      if (!selectedSpot.value) return;
      const spot = spotLayouts.value.find(s => s.id === selectedSpot.value.id);
      if (!spot) return;
      switch (property) {
        case 'spotId':
          spot.spotId = value;
          if (spot.parkingData) {
            spot.parkingData.number = value;
          }
          break;
        case 'x':
          spot.x = Number(value);
          break;
        case 'y':
          spot.y = Number(value);
          break;
        case 'width':
          spot.width = Number(value);
          break;
        case 'height':
          spot.height = Number(value);
          break;
        case 'rotation':
          spot.rotation = Number(value);
          break;
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
    
    // 【修改】載入背景圖片
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
        
        // 【修改】設定畫布的 "原始" 寬高
        if (width) {
           canvasWidth.value = width;
        }
        if (height) {
           canvasHeight.value = height;
        }
        
        console.log(`[Canvas] 背景圖樣式已設定。畫布原始尺寸: ${canvasWidth.value} x ${canvasHeight.value}`);
        resolve();
      });
    }

    // 載入車位佈局 (不變)
    const loadSpotLayouts = (layouts) => {
      console.log(`[CANVAS LOG] loadSpotLayouts: 準備載入 ${layouts.length} 筆資料。 座標範例 (前3筆):`, JSON.stringify(layouts.slice(0, 3).map(s => ({ id: s.spotId, x: s.x, y: s.y }))));
      const loadedSpots = layouts
        .filter(item => item.type !== 'backgroundImage')
        .map(layout => {
          const fullParkingData = allParkingData.value.find(p => p.id === layout.salesParkingId) || {
              id: layout.salesParkingId, number: layout.spotId, status_backend: '可售', price_list: null, status: null
          };
          return {
            id: layout.id || `layout-${layout.salesParkingId || layout.spotId}-${Math.random()}`,
            isNew: !layout.id, // 【請在此處插入此行】
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

    // 取得車位佈局 (不變)
    const getSpotLayouts = () => {
      return spotLayouts.value.map(spot => ({
        id: spot.isNew ? null : spot.id, // 【請修改此行】
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

    // --- 匯入車位 (不變) ---
    const openImportModal = async () => {
      importDialog.value = true
      await fetchSalesParkingsForFloor(); 
    }
    const closeImportModal = () => { importDialog.value = false }

   const confirmImport = async () => {
      importing.value = true;
      try {
        // 1. 清除所有 "imported" 類型的舊車位
        spotLayouts.value = spotLayouts.value.filter(s => s.type !== 'imported'); 
        
        // 2. 準備好所有車位的 *資料* (但不立即渲染)
        //    (此資料已由後端 'orderBy('number', 'asc')' 排序)
        const spotsData = allParkingData.value.map((parkingData, index) => {
          
          // 3. 根據您的需求定義 X 座標
          //    (index 0 -> 100, index 1 -> 160, ... index 10 -> 100)
          const x = 100 + (index % 10) * 60; 
          
          // 4. 根據您的需求定義 Y 座標
          //    (index 0-9  -> 100 + (0 * 200) = 100) (第一列)
          //    (index 10-19 -> 100 + (1 * 200) = 300) (第二列)
          const y = 100 + (Math.floor(index / 10) * 200); 
          
          return {
            id: `imported-${parkingData.id}-${Math.random()}`,
            isNew: true,
            spotId: parkingData.number,
            x: x, // ✓ 套用 X
            y: y, // ✓ 套用 Y
            width: 48, 
            height: 105,
            rotation: 0,
            locked: false,
            parkingData: parkingData, // (編號、價格、買方姓名...)
            type: 'imported',
            displayMode: props.displayMode
          };
        });

        // ✓ 5. 【核心修改】循序加入車位，強制 DOM 渲染
        //    使用 for...of 迴圈搭配 await
        for (const spot of spotsData) {
          
          // 5.1. 將 *單個* 車位加入陣列，觸發 Vue 渲染
          spotLayouts.value.push(spot);
          
          // 5.2. 等待 Vue 完成 DOM 更新
          //      這會強制 <vue-drag-resize-rotate> 
          //      在下一個車位被加入前，
          //      先將目前這個車位渲染到它*正確*的 (x, y) 位置
          await new Promise(resolve => nextTick(resolve));
        }
        // 迴圈結束時，所有車位都已在正確位置，不會觸發碰撞

        emit('spots-changed');
        
      } catch(error) { 
          toast.error(`匯入車位時發生錯誤: ${error.message}`);
      } finally {
        importing.value = false;
        closeImportModal();
      }
    };

    // 模式切換 (不變)
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
      await loadFloorData(); 
      
      // 【新增】監聽容器尺寸變化，自動重算 'fitToScreen'
      if (containerRef.value) {
        resizeObserver = new ResizeObserver(fitToScreen);
        resizeObserver.observe(containerRef.value);
      }
      
      // 【新增】手動觸發一次 fitToScreen
      fitToScreen();
    });

    onUnmounted(() => {
      // 【新增】移除監聽
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    });
    
    // --- 監聽 props 變化 ---
    watch(() => props.floorPlan.id, () => {
      spotLayouts.value = []; 
      bgImageUrl.value = null; 
      canvasScale.value = 1; // 【新增】重置縮放
      loadFloorData(); 
    })

    return {
      // Refs
      containerRef, // 【新增】
      canvasAreaRef,
      canvasAreaStyle,
      bgImageUrl,
      bgImageStyles,
      spotLayouts,
      selectedSpot,
      selectedSpotId,
      spotProperties,
      importDialog, loading, importing, previewParkings, totalParkingCount,
      
      // Props
      displayMode: computed(() => props.displayMode),
      floorPlan: props.floorPlan,
      previewMode: computed(() => props.previewMode),

      // Functions
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
      
      // 【新增】縮放相關
      canvasScale,
      fitToScreen,
      
      // 【新增】
      handleTransform,

      // ✓ START: 請加入以下匯出
      testX,
      testY,
      addTestSpot,
      // ✓ END: 匯出

      // Icons
      mdiDownload, mdiLoading, mdiClose, mdiTrashCanOutline,
    }
  }
}
</script>

<style scoped>
.parking-canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: auto; /* 保持 auto 以便縮放後仍可滾動 */
  display: flex;
  justify-content: flex-start; /* 保持 flex-start 以便 transform-origin: top left 生效 */
  align-items: flex-start; /* 保持 flex-start */
  background-color: #f0f2f5;
}

/* ✓ 請加入這段 CSS，強制車位使用絕對定位 */
:deep(.parking-spot-item) {
  position: absolute !important;
}

.parking-canvas-area {
  position: relative; 
  background-color: #ffffff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border: 1px solid #d9d9d9;
  flex-shrink: 0; 
  margin: 20px; /* 保留 margin，作為滾動的緩衝區 */
  /* 【修改】寬高和 transform 由 canvasAreaStyle 動態綁定 */
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

/* (以下為保留的樣式) */

canvas {
  border: 1px solid #d9d9d9;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.toolbar {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  gap: 1rem;
  z-index: 10;
  background: white;
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
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
.btn-secondary { background: #6c757d; color: white; }
.btn-secondary:hover:not(:disabled) { background: #5a6268; }
.btn-danger { background: #dc3545; color: white; }
.btn-danger:hover:not(:disabled) { background: #c82333; }
.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
}

/* 【新增】縮放工具列樣式 */
.zoom-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  background: white;
  padding: 8px 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
}
.zoom-controls input[type="range"] {
  width: 120px;
}
.zoom-controls span {
  font-size: 0.9rem;
  width: 40px;
  text-align: right;
  color: #333;
}
</style>