<template>
  <div class="parking-canvas-container center-xy" ref="containerRef">

    <div v-if="isCanvasLoading" class="modal-overlay" style="z-index: 100; position: absolute;">
      <div class="modal-content" style="max-width: 300px;">
        <div class="modal-body loading-state">
           <svg-icon type="mdi" :path="mdiLoading" class="icon spin-icon" style="width: 48px; height: 48px; color: #007bff;"></svg-icon>
           <p class="mt-4" style="margin-top: 1rem; font-size: 1.1rem; color: #333; font-weight: 500;">
             正在載入車位資料...
           </p>
        </div>
      </div>
    </div>
    
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
          :class="{ 'clickable-spot': previewMode && spot.parkingData }"
          @click.stop="handleSpotClick(spot)"
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

    <div 
      v-if="selectedSpot" 
      class="spot-properties-panel"
      :style="propertiesPanelStyle"
      @mousedown="onPropertiesPanelDragStart"
    >
      <div class="panel-header" style="cursor: move;">
        <h4 style="margin: 0; pointer-events: none;">車位屬性</h4>
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

    <div 
      class="floor-chip-group" 
      :style="floorChipGroupStyle" 
      @mousedown="onFloorChipGroupDragStart"
    >
      <button
        v-for="plan in availableFloorPlans"
        :key="plan.id"
        @click="switchFloor(plan)"
        :class="['btn', 'btn-sm', { 'btn-active': plan.id === floorPlan.id }]"
      >
        {{ plan.floor }}
      </button>
    </div>

    <!-- 車位詳細資訊 Modal -->
    <div v-if="showDetailModal && selectedDetailSpot" class="modal-overlay detail-modal-overlay" @click.self="closeDetailModal">
      <div class="modal-content detail-modal-content">
        <div class="modal-header detail-header">
          <div class="d-flex align-center" style="gap: 12px;">
            <h3 class="mb-0 text-h5 font-weight-bold">🅿️ {{ selectedDetailSpot.parkingData.number || selectedDetailSpot.spotId }}</h3>
            <span 
              class="status-chip" 
              :style="getDetailStatusStyle(selectedDetailSpot.parkingData)"
            >
              {{ contextMode === 'sales' ? (selectedDetailSpot.parkingData.status_backend || '未設定') : (selectedDetailSpot.parkingData.status || '未設定') }}
            </span>
          </div>
          <button @click="closeDetailModal" class="btn-close detail-close-btn">
            <svg-icon type="mdi" :path="mdiClose"></svg-icon>
          </button>
        </div>
        
        <div class="modal-body detail-body">
          <!-- 報價模式且已售 -->
          <template v-if="contextMode === 'quote' && selectedDetailSpot.parkingData.status === '已售'">
            <div class="info-section">
              <div class="section-title">基本資訊</div>
              <div class="info-row">
                <span class="info-label">樓層</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.floor || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">類型</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.type || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">形式</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.type2 || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">尺寸</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.size || '—' }}</span>
              </div>
            </div>
            <div class="info-section">
              <div class="section-title">價格資訊</div>
              <div class="info-row" style="justify-content: center; padding: 1.5rem 0;">
                <span class="text-h5 font-weight-black" style="color: #dc3545;">已售</span>
              </div>
            </div>
          </template>

          <!-- 報價模式且未售 -->
          <template v-else-if="contextMode === 'quote'">
            <div class="info-section">
              <div class="section-title">基本資訊</div>
              <div class="info-row">
                <span class="info-label">樓層</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.floor || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">類型</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.type || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">形式</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.type2 || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">尺寸</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.size || '—' }}</span>
              </div>
            </div>
            <div class="info-section">
              <div class="section-title">價格資訊</div>
              <div class="info-row">
                <span class="info-label">車位價格</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.price_list ? `${selectedDetailSpot.parkingData.price_list} 萬` : '未設定' }}</span>
              </div>
            </div>
          </template>

          <!-- 銷控模式 -->
          <template v-else-if="contextMode === 'sales'">
            <div class="info-section">
              <div class="section-title">基本資訊</div>
              <div class="info-row">
                <span class="info-label">樓層</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.floor || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">類型</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.type || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">形式</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.type2 || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">尺寸</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.size || '—' }}</span>
              </div>
            </div>
            <div class="info-section">
              <div class="section-title">價格資訊</div>
              <div class="info-row">
                <span class="info-label">表價</span>
                <span class="info-value font-weight-bold">{{ selectedDetailSpot.parkingData.price_list ? `${selectedDetailSpot.parkingData.price_list} 萬` : '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label" style="color: #dc3545;">底價</span>
                <span class="info-value font-weight-bold" style="color: #dc3545;">{{ selectedDetailSpot.parkingData.price_floor ? `${selectedDetailSpot.parkingData.price_floor} 萬` : '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label" style="color: #198754;">成交價</span>
                <span class="info-value font-weight-bold" style="color: #198754;">{{ selectedDetailSpot.parkingData.price_transaction ? `${selectedDetailSpot.parkingData.price_transaction} 萬` : '—' }}</span>
              </div>
            </div>
            <div class="info-section" v-if="selectedDetailSpot.parkingData.status_backend === '已售' || selectedDetailSpot.parkingData.buyerName">
              <div class="section-title">銷售資訊</div>
              <div class="info-row">
                <span class="info-label">買方戶別</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.buyerUnitId || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">買方姓名</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.buyerName || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">銷售人員</span>
                <span class="info-value">{{ selectedDetailSpot.parkingData.salesperson || '—' }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>
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
  mdiMinus, 
  mdiPlus,  
} from '@mdi/js';
import { useToast } from 'vue-toastification';

export default {
  name: 'ParkingCanvas',
  components: {
    SvgIcon,
    VueDragResizeRotate, 
  },
  props: {
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
    allowImport: {
      type: Boolean,
      default: true 
    },
    allowAdjustAll: {
      type: Boolean,
      default: true 
    },
    showStatusToggle: {
      type: Boolean,
      default: true 
    },
    contextMode: {
      type: String,
      default: 'sales',
      validator: (v) => ['sales', 'quote'].includes(v)
    }
  },
  emits: ['spots-changed', 'canvas-ready', 'zoom-changed', 'pan-changed', 'update:displayMode', 'floor-switched'],
  setup(props, { emit }) {
    const toast = useToast(); 

    // 工具列/縮放 拖曳狀態
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

    // 車位屬性面板 拖曳狀態
    const propertiesPanelStyle = ref({
      top: '20px',
      right: '250px',
    });
    const isDraggingPropertiesPanel = ref(false);
    const propertiesDragStartX = ref(0);
    const propertiesDragStartY = ref(0);
    const propertiesInitialX = ref(0);
    const propertiesInitialY = ref(0);

    // Floor-chip-group 拖曳狀態
    const floorChipGroupStyle = ref({
      position: 'absolute',
      top: '80px', 
      right: '20px', 
      zIndex: 10,
      cursor: 'move',
    });
    const isDraggingFloorChipGroup = ref(false);
    const floorChipDragStartX = ref(0);
    const floorChipDragStartY = ref(0);
    const floorChipInitialX = ref(0); 
    const floorChipInitialY = ref(0); 

    // 畫布 DOM ref
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

    // 車位狀態 ref
    const spotLayouts = ref([]) 
    const selectedSpotId = ref(null) 
    const selectedSpot = ref(null) 
    const spotProperties = ref({}) 

    // 背景圖/匯入 ref
    const bgImageUrl = ref(null) 
    const bgImageStyles = ref({}) 
    const importDialog = ref(false)
    const loading = ref(false)
    const importing = ref(false)
    const previewParkings = ref([])
    const totalParkingCount = ref(0)
    const allParkingData = ref([])

    const showAdjustAllPanel = ref(false);
    const adjustAllWidth = ref(100);
    const adjustAllHeight = ref(100);

    const availableFloorPlans = ref([]);
    const isCanvasLoading = ref(true);

    const showDetailModal = ref(false);
    const selectedDetailSpot = ref(null);

    const handleSpotClick = (spot) => {
      if (!props.previewMode || !spot.parkingData) return;
      console.log('[ParkingCanvas] handleSpotClick - contextMode:', props.contextMode, '| displayMode:', props.displayMode);
      selectedDetailSpot.value = spot;
      showDetailModal.value = true;
    };

    const closeDetailModal = () => {
      showDetailModal.value = false;
      selectedDetailSpot.value = null;
    };

    const getDetailStatusStyle = (data) => {
      const statusText = props.contextMode === 'sales' ? (data.status_backend || '預設') : (data.status || '預設');
      const colors = {
        '可售': { bg: '#dcfce7', text: '#166534' },
        '已售': { bg: '#fee2e2', text: '#991b1b' },
        '保留': { bg: '#fef3c7', text: '#92400e' },
        '主管保留': { bg: '#e0e7ff', text: '#3730a3' },
        '預設': { bg: '#f3f4f6', text: '#374151' }
      };
      const cs = colors[statusText] || colors['預設'];
      return {
        backgroundColor: cs.bg,
        color: cs.text,
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '0.8rem',
        fontWeight: 'bold'
      };
    };

    // Methods
    const fitToScreen = () => {
      if (!containerRef.value || !canvasWidth.value || !canvasHeight.value) return;
      const containerW = containerRef.value.clientWidth - 40; 
      const containerH = containerRef.value.clientHeight - 40;
      const naturalW = canvasWidth.value;
      const naturalH = canvasHeight.value;
      const scale = Math.min(containerW / naturalW, containerH / naturalH);
      // 依據容器尺寸自動縮放（不再限制最大為 1）
      canvasScale.value = parseFloat(scale.toFixed(2));
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

    const onPropertiesPanelDragStart = (e) => {
      // 只有按住 panel-header 才能拖曳，避免影響輸入框和滾動條
      if (!e.target.closest('.panel-header') || e.target.closest('button')) return; 
      isDraggingPropertiesPanel.value = true;
      const currentTop = parseInt(propertiesPanelStyle.value.top, 10) || 20;
      const currentRight = parseInt(propertiesPanelStyle.value.right, 10) || 250;
      propertiesInitialY.value = currentTop;
      propertiesInitialX.value = currentRight; 
      propertiesDragStartX.value = e.clientX;
      propertiesDragStartY.value = e.clientY;
      document.addEventListener('mousemove', onPropertiesPanelDragMove);
      document.addEventListener('mouseup', onPropertiesPanelDragEnd);
    };
    const onPropertiesPanelDragMove = (e) => {
      if (!isDraggingPropertiesPanel.value) return;
      const dx = e.clientX - propertiesDragStartX.value;
      const dy = e.clientY - propertiesDragStartY.value;
      propertiesPanelStyle.value.top = `${propertiesInitialY.value + dy}px`;
      propertiesPanelStyle.value.right = `${propertiesInitialX.value - dx}px`; 
    };
    const onPropertiesPanelDragEnd = () => {
      isDraggingPropertiesPanel.value = false;
      document.removeEventListener('mousemove', onPropertiesPanelDragMove);
      document.removeEventListener('mouseup', onPropertiesPanelDragEnd);
    };

    /**
     * [修改] 背景圖載入處理 - 支援 SVG 格式尺寸判定
     */
    const onBgImageLoad = (e) => {
      const img = e.target;
      const isSvg = img.src.toLowerCase().includes('.svg') || img.src.startsWith('data:image/svg+xml');

      if (canvasWidth.value === 1700 && canvasHeight.value === 850) { 
         const noFixedWidth = !bgImageStyles.value.width || bgImageStyles.value.width === '100%' || bgImageStyles.value.width === 'auto';
         const noFixedHeight = !bgImageStyles.value.height || bgImageStyles.value.height === '100%' || bgImageStyles.value.height === 'auto';
         
         if (noFixedWidth && noFixedHeight) {
            let targetWidth = img.naturalWidth;
            let targetHeight = img.naturalHeight;

            // 針對部分無定義寬高的 SVG 進行容錯處理 (瀏覽器預設 naturalWidth 可能為 300)
            if (isSvg && (targetWidth === 0 || targetWidth === 300)) {
               console.log('[Canvas] 偵測到無固定尺寸 SVG，將採用預設畫布寬度或容器比例');
            }

            if (targetWidth > 0) {
              canvasWidth.value = targetWidth;
              canvasHeight.value = targetHeight;
            }
         }
      }
      console.log(`底圖載入完成 (${isSvg ? 'SVG' : 'Bitmap'}): ${canvasWidth.value}x${canvasHeight.value}`);
      nextTick(fitToScreen);
    };

    const handleKeyDown = (event) => {
      if (showDetailModal.value && event.key === 'Escape') {
        closeDetailModal();
        return;
      }
      if (!selectedSpotId.value) return;
      const spot = spotLayouts.value.find(s => s.id === selectedSpotId.value);
      if (!spot) return;
      const nudgeAmount = event.shiftKey ? 10 : 1;
      let dx = 0, dy = 0;
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

    const zoomStep = 0.1;
    const maxZoom = 2.0;
    const minZoom = 0.2;
    const zoomIn = () => {
      canvasScale.value = parseFloat(Math.min(maxZoom, canvasScale.value + zoomStep).toFixed(2));
    };
    const zoomOut = () => {
      canvasScale.value = parseFloat(Math.max(minZoom, canvasScale.value - zoomStep).toFixed(2));
    };

    const onFloorChipGroupDragStart = (e) => {
      if (e.target.closest('button')) return; 
      isDraggingFloorChipGroup.value = true;
      const currentTop = parseInt(floorChipGroupStyle.value.top, 10) || 80;
      const currentRight = parseInt(floorChipGroupStyle.value.right, 10) || 20;
      floorChipInitialY.value = currentTop;
      floorChipInitialX.value = currentRight; 
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

    const fetchAvailableFloors = async () => {
      if (!props.projectId) return;
      try {
        const result = await getFloorPlansAPI(props.projectId);
        if (result.status === 'success' && result.data) {
          result.data.sort((a, b) => 
            (a.floor || '').localeCompare(b.floor || '', 'zh-Hant', { numeric: true })
          );
          availableFloorPlans.value = result.data;
        } else {
          toast.error(result.message || '無法載入樓層列表');
        }
      } catch (error) {
        toast.error(`載入樓層列表失敗: ${error.message}`);
      }
    };

    const switchFloor = (plan) => {
      if (plan.id === props.floorPlan.id) return; 
      emit('floor-switched', plan);
    };

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
          width: width ? `${width}px` : '100%', 
          height: height ? `${height}px` : '100%', 
          transform: `rotate(${angle}deg)`,
          transformOrigin: 'top left',
        };
        if (width) { canvasWidth.value = width; }
        if (height) { canvasHeight.value = height; }
        resolve();
      });
    }

    const loadFloorData = async () => {
      isCanvasLoading.value = true; 
      if (!props.floorPlan || !props.floorPlan.id) {
         isCanvasLoading.value = false;
         return;
      }
      try { 
        if (props.floorPlan.backgroundImageUrl) {
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
        await fetchSalesParkingsForFloor();
        try {
          const layoutResult = await getSpotLayoutsAPI(props.floorPlan.id, props.projectId);
          if (layoutResult.status === 'success') {
            loadSpotLayouts(layoutResult.layouts || []);
          } else {
            throw new Error(layoutResult.message || '獲取佈局失敗');
          }
        } catch (error) {
           console.error('抓取車位佈局時發生錯誤:', error);
           loadSpotLayouts([]); 
        }
        emit('canvas-ready');
      } catch (err) { 
          toast.error(`載入畫布資料時發生錯誤: ${err.message}`);
      } finally {
          isCanvasLoading.value = false;
      }
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
        }
      } finally {
        loading.value = false
      }
    }

    const getStatusColor = (mode, data) => {
      const statusColors = props.statusColors || {};
      const modeColors = statusColors[mode] || {};
      let statusKey = !data ? 'default' : (mode === 'backend' ? (data.status_backend || 'default') : (data.status === '已售' ? '已售' : 'default'));
      const defaultColorSet = { backgroundColor: '#f5f5f5', borderColor: '#000000', textColor: '#000000' };
      return modeColors[statusKey] || modeColors.default || defaultColorSet;
    };

    const getSpotStyle = (spot) => {
      const colorSet = getStatusColor(props.displayMode, spot.parkingData);
      return typeof colorSet === 'string' ? { backgroundColor: colorSet, borderColor: '#000000', color: '#000000' } : { backgroundColor: colorSet.backgroundColor, borderColor: colorSet.borderColor, color: colorSet.textColor };
    };

    const getSpotTextStyle = (fieldKey) => {
      const style = props.textStyles[fieldKey] || {};
      return {
        fontSize: style.fontSize ? `${style.fontSize}px` : '10px',
        color: style.fill || '#000',
        fontWeight: style.fontWeight || 'normal',
        fontFamily: style.fontFamily || 'Arial',
        display: 'block', 
        textAlign: 'center',
      };
    };

    const getDisplayFields = (mode, data) => {
      if (!data) return [{ key: 'number', value: 'N/A' }]; 
      const fields = mode === 'backend' ? [{ key: 'number', value: data.number }, { key: 'price', value: data.price_transaction || data.price_list }, { key: 'buyerUnitId', value: data.buyerUnitId }, { key: 'buyerName', value: data.buyerName }, { key: 'salesperson', value: data.salesperson }, { key: 'size', value: data.size }, { key: 'type', value: data.type }] : data.status === '已售' ? [{ key: 'number', value: data.number }, { key: 'status', value: data.status }] : [{ key: 'number', value: data.number }, { key: 'price', value: data.price_list }, { key: 'size', value: data.size }, { key: 'type', value: data.type }];
      return fields.filter(f => f.value);
    }
    
    const handleSpotActivated = (spot) => {
      if (props.previewMode) return;
      selectedSpotId.value = spot.id; 
      selectSpot(spot);
    };

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
        if (eventType === 'dragging') { spotProperties.value.x = spot.x; spotProperties.value.y = spot.y; }
        if (eventType === 'resizing') { spotProperties.value.width = spot.width; spotProperties.value.height = spot.height; spotProperties.value.x = spot.x; spotProperties.value.y = spot.y; }
        if (eventType === 'rotating') { spotProperties.value.rotation = spot.rotation; }
      }
    };

    const handleTransformStop = (spotId, payload) => {
      const { x, y, w, h, r } = payload; 
      const spot = spotLayouts.value.find(s => s.id === spotId);
      if (spot) {
        if (x !== undefined) spot.x = Math.round(x);
        if (y !== undefined) spot.y = Math.round(y);
        if (w !== undefined) spot.width = Math.round(w);
        if (h !== undefined) spot.height = Math.round(h);
        if (r !== undefined) spot.rotation = Math.round(r);
        emit('spots-changed');
      }
    };

    const selectSpot = (spot) => {
      selectedSpot.value = spot;
      spotProperties.value = { spotId: spot.spotId || '', x: Math.round(spot.x), y: Math.round(spot.y), width: Math.round(spot.width), height: Math.round(spot.height), rotation: Math.round(spot.rotation) };
    }

    const updateSpotProperty = (property, value) => {
      if (!selectedSpot.value) return;
      const spot = spotLayouts.value.find(s => s.id === selectedSpot.value.id);
      if (!spot) return;
      switch (property) {
        case 'spotId': spot.spotId = value; if (spot.parkingData) spot.parkingData.number = value; break;
        case 'x': spot.x = Number(value); break;
        case 'y': spot.y = Number(value); break;
        case 'width': spot.width = Number(value); break;
        case 'height': spot.height = Number(value); break;
        case 'rotation': spot.rotation = Number(value); break;
      }
      spotProperties.value[property] = value;
      emit('spots-changed');
    };

    const deleteSelectedSpot = () => {
      if (!selectedSpot.value) return;
      if (confirm('確定要刪除此車位嗎？')) {
        const index = spotLayouts.value.findIndex(s => s.id === selectedSpot.value.id);
        if (index > -1) { spotLayouts.value.splice(index, 1); selectedSpot.value = null; selectedSpotId.value = null; emit('spots-changed'); }
      }
    }
    
    const loadSpotLayouts = (layouts) => {
      spotLayouts.value = layouts.filter(item => item.type !== 'backgroundImage').map(layout => {
        const fullParkingData = allParkingData.value.find(p => p.id === layout.salesParkingId) || { id: layout.salesParkingId, number: layout.spotId, status_backend: '可售', price_list: null, status: null };
        return { id: layout.id || `layout-${layout.salesParkingId || layout.spotId}-${Math.random()}`, isNew: !layout.id, spotId: layout.spotId, x: layout.x || 0, y: layout.y || 0, width: layout.width || 100, height: layout.height || 100, rotation: layout.rotation || 0, locked: false, parkingData: fullParkingData, displayMode: layout.displayMode || props.displayMode };
      });
    };

    const getSpotLayouts = () => {
      return spotLayouts.value.map(spot => ({ id: spot.isNew ? null : spot.id, spotId: spot.spotId, x: Math.round(spot.x), y: Math.round(spot.y), width: Math.round(spot.width), height: Math.round(spot.height), rotation: Math.round(spot.rotation), type: spot.parkingData.id ? 'imported' : 'manual', salesParkingId: spot.parkingData?.id || null, displayMode: spot.displayMode }));
    }

    const openImportModal = async () => { importDialog.value = true; await fetchSalesParkingsForFloor(); }
    const closeImportModal = () => { importDialog.value = false }
    const confirmImport = async () => {
      importing.value = true;
      try {
        spotLayouts.value = spotLayouts.value.filter(s => s.type !== 'imported'); 
        allParkingData.value.forEach((parkingData, index) => {
          spotLayouts.value.push({ id: `imported-${parkingData.id}-${Math.random()}`, isNew: true, spotId: parkingData.number, x: 100 + (index % 10) * 60, y: 100 + (Math.floor(index / 10) * 200), width: 48, height: 105, rotation: 0, locked: false, parkingData: parkingData, type: 'imported', displayMode: props.displayMode });
        });
        emit('spots-changed');
      } finally { importing.value = false; closeImportModal(); }
    };

    const openAdjustAllPanel = () => {
      if (selectedSpot.value) { adjustAllWidth.value = Math.round(selectedSpot.value.width); adjustAllHeight.value = Math.round(selectedSpot.value.height); }
      else if (spotLayouts.value.length > 0) { adjustAllWidth.value = Math.round(spotLayouts.value[0].width); adjustAllHeight.value = Math.round(spotLayouts.value[0].height); }
      showAdjustAllPanel.value = true;
    };
    const applyAdjustAll = () => {
      const newWidth = Number(adjustAllWidth.value), newHeight = Number(adjustAllHeight.value);
      if (newWidth <= 0 || newHeight <= 0) { toast.error('寬度與高度必須大於 0'); return; }
      spotLayouts.value = spotLayouts.value.map(spot => ({ ...spot, width: newWidth, height: newHeight }));
      if (selectedSpot.value) { spotProperties.value.width = newWidth; spotProperties.value.height = newHeight; }
      emit('spots-changed'); closeAdjustAllPanel();
    };

    const switchDisplayMode = (mode) => {
      emit('update:displayMode', mode);
      spotLayouts.value.forEach(spot => { spot.displayMode = mode; });
    }
  
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
      if (resizeObserver) resizeObserver.disconnect();
      document.removeEventListener('mousemove', onToolbarDragMove);
      document.removeEventListener('mouseup', onToolbarDragEnd);
      document.removeEventListener('mousemove', onZoomControlsDragMove);
      document.removeEventListener('mouseup', onZoomControlsDragEnd);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', onFloorChipGroupDragMove);
      document.removeEventListener('mouseup', onFloorChipGroupDragEnd);
      document.removeEventListener('mousemove', onPropertiesPanelDragMove);
      document.removeEventListener('mouseup', onPropertiesPanelDragEnd);
    });
    
    watch(() => props.floorPlan.id, () => {
      spotLayouts.value = []; bgImageUrl.value = null; canvasScale.value = 1; isCanvasLoading.value = true;
      loadFloorData(); 
    })
    
    watch(() => props.projectId, (newVal, oldVal) => { if (newVal !== oldVal) fetchAvailableFloors(); })

    return {
      containerRef, canvasAreaRef, canvasAreaStyle, bgImageUrl, bgImageStyles, spotLayouts, selectedSpot, selectedSpotId, spotProperties, importDialog, loading, importing, previewParkings, totalParkingCount, displayMode: computed(() => props.displayMode), floorPlan: computed(() => props.floorPlan), previewMode: computed(() => props.previewMode), contextMode: computed(() => props.contextMode),
      getSpotLayouts, loadSpotLayouts, updateSpotProperty, closePropertiesPanel: () => selectedSpot.value = null, deleteSelectedSpot, openImportModal, closeImportModal, confirmImport, switchDisplayMode, handleSpotActivated, onBgImageLoad, getSpotStyle, getDisplayFields, getSpotTextStyle, canvasScale, fitToScreen, handleTransform, handleTransformStop, toolbarStyle, onToolbarDragStart, zoomControlsStyle, onZoomControlsDragStart, showAdjustAllPanel, adjustAllWidth, adjustAllHeight, openAdjustAllPanel, closeAdjustAllPanel: () => showAdjustAllPanel.value = false, applyAdjustAll, availableFloorPlans, switchFloor, floorChipGroupStyle, onFloorChipGroupDragStart, zoomIn, zoomOut, isCanvasLoading, propertiesPanelStyle, onPropertiesPanelDragStart,
      showDetailModal, selectedDetailSpot, handleSpotClick, closeDetailModal, getDetailStatusStyle,
      mdiDownload, mdiLoading, mdiClose, mdiTrashCanOutline, mdiArrowExpandAll, mdiMinus, mdiPlus
    }
  }
}
</script>

<style scoped>
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
  width: 100%;
  height: 100%;
  object-fit: contain;
  z-index: 0; 
  pointer-events: none; 
  /* 確保 SVG 縮放時銳利不模糊 */
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
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

.modal-header, .modal-footer { padding: 1.5rem; display: flex; align-items: center; }
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
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-primary { background: #007bff; color: white; }
.btn-secondary { background: #000000; color: white; }
.btn-danger { background: #dc3545; color: white; }

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

.btn.btn-icon {
  padding: 0.25rem;
  width: 30px;
  height: 30px;
  justify-content: center;
  border-radius: 50%;
  gap: 0;
}

.floor-chip-group {
  display: flex;
  flex-direction: column; 
  gap: 10px; 
  background: white;
  padding: 10px; 
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 10;
  user-select: none; 
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

.spin-icon {
  animation: spin 1.5s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 新增的 Modal 樣式 */
.detail-modal-overlay {
  background: rgba(0, 0, 0, 0.6) !important;
  backdrop-filter: blur(4px);
}

.detail-modal-content {
  max-width: 420px !important;
  border-radius: 16px !important;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.25) !important;
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(12px) !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  animation: modal-enter 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modal-enter {
  0% { opacity: 0; transform: translateY(24px) scale(0.96); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

.detail-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08) !important;
  padding: 1.25rem 1.5rem !important;
}

.detail-body {
  padding: 0 !important;
  max-height: calc(90vh - 80px);
  overflow-y: auto;
}

.detail-close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.detail-close-btn:hover {
  background: rgba(0, 0, 0, 0.12);
}

.info-section {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.info-section:last-child {
  border-bottom: none;
}

.section-title {
  color: #6b7280;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0;
}

.info-label {
  color: #6b7280;
  font-size: 0.9rem;
}

.info-value {
  font-weight: 600;
  font-size: 0.95rem;
  color: #111827;
  text-align: right;
}

/* 車位按鈕化效果 */
.clickable-spot {
  cursor: pointer;
  transition: all 0.2s ease;
}

.clickable-spot:hover {
  filter: brightness(1.08);
  transform: scale(1.03);
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  z-index: 20;
}

.clickable-spot:active {
  transform: scale(0.97);
}

</style>