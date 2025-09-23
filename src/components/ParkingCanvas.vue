<template>
  <div class="parking-canvas-container center-xy">
    <div v-if="showTools" class="toolbar">
      <button @click="openImportModal" class="btn btn-primary">
        <svg-icon type="mdi" :path="mdiDownload" class="icon"></svg-icon> 匯入車位資料
      </button>
  
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

    <canvas ref="fabricCanvas" :width="canvasWidth" :height="canvasHeight"></canvas>

  <div v-if="activeSelection && !previewMode" class="edit-toolbar">
      <div class="toolbar-group">
        <button @click="bringToFront" class="toolbar-btn" title="移到最上層">
          <svg-icon type="mdi" :path="mdiArrowUpBoldBoxOutline"></svg-icon>
        </button>
        <button @click="sendToBack" class="toolbar-btn" title="移到最下層">
          <svg-icon type="mdi" :path="mdiArrowDownBoldBoxOutline"></svg-icon>
        </button>
      </div>

      <div class="toolbar-group">
        <button @click="toggleLock" class="toolbar-btn" :title="isSelectionLocked ? '解鎖' : '鎖定'">
          <svg-icon type="mdi" :path="isSelectionLocked ? mdiLockOpenVariant : mdiLock"></svg-icon>
        </button>
      </div>

      <div class="toolbar-group">
        <button @click="alignObjects('left')" :disabled="!isMultiSelection" class="toolbar-btn" title="靠左對齊">
          <svg-icon type="mdi" :path="mdiAlignHorizontalLeft"></svg-icon>
        </button>
        <button @click="alignObjects('h-center')" :disabled="!isMultiSelection" class="toolbar-btn" title="水平置中">
          <svg-icon type="mdi" :path="mdiAlignHorizontalCenter"></svg-icon>
        </button>
        <button @click="alignObjects('right')" :disabled="!isMultiSelection" class="toolbar-btn" title="靠右對齊">
          <svg-icon type="mdi" :path="mdiAlignHorizontalRight"></svg-icon>
        </button>
        <button @click="alignObjects('top')" :disabled="!isMultiSelection" class="toolbar-btn" title="靠上對齊">
          <svg-icon type="mdi" :path="mdiAlignVerticalTop"></svg-icon>
        </button>
        <button @click="alignObjects('v-center')" :disabled="!isMultiSelection" class="toolbar-btn" title="垂直置中">
          <svg-icon type="mdi" :path="mdiAlignVerticalCenter"></svg-icon>
        </button>
        <button @click="alignObjects('bottom')" :disabled="!isMultiSelection" class="toolbar-btn" title="靠下對齊">
          <svg-icon type="mdi" :path="mdiAlignVerticalBottom"></svg-icon>
        </button>
      </div>

      <div class="toolbar-group">
        <button @click="distributeObjects('horizontal')" :disabled="!isMultiSelection" class="toolbar-btn" title="水平均分">
          <svg-icon type="mdi" :path="mdiDistributeHorizontalLeft"></svg-icon>
        </button>
        <button @click="distributeObjects('vertical')" :disabled="!isMultiSelection" class="toolbar-btn" title="垂直均分">
          <svg-icon type="mdi" :path="mdiDistributeVerticalTop"></svg-icon>
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
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
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
            <v-progress-circular
              v-if="importing"
              indeterminate
              size="20"
              width="2"
              class="mr-2"
            ></v-progress-circular>
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
            v-model="spotProperties.spotId" 
            @input="updateSpotProperty('spotId', $event.target.value)"
            type="text" 
            class="form-input"
          />
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>寬度</label>
            <input 
              v-model.number="spotProperties.width" 
              @input="updateSpotProperty('width', Number($event.target.value))"
              type="number" 
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label>高度</label>
            <input 
              v-model="spotProperties.height" 
              @input="updateSpotProperty('height', Number($event.target.value))"
              type="number" 
              class="form-input"
            />
          </div>
        </div>
        
        <div class="form-group">
          <label>旋轉角度</label>
          <input 
            v-model="spotProperties.rotation" 
            @input="updateSpotProperty('rotation', Number($event.target.value))"
            type="number" 
            step="1"
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label>顏色</label>
          <input 
            v-model="spotProperties.fill" 
            @input="updateSpotProperty('fill', $event.target.value)"
            type="color" 
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
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue' 
import { fabric } from 'fabric'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { getFirestore, onSnapshot, query, where, collection } from 'firebase/firestore' 
import { db } from '@/firebase'
import SvgIcon from '@jamescoyle/vue-icon';
import { 
  mdiDownload, 
  mdiLoading, 
  mdiClose, 
  mdiTrashCanOutline,
  mdiArrowUpBoldBoxOutline,  
  mdiArrowDownBoldBoxOutline, 
  mdiLock,                    
  mdiLockOpenVariant,         
  mdiAlignVerticalTop,
  mdiAlignVerticalBottom,
  mdiAlignVerticalCenter,
  mdiAlignHorizontalLeft,
  mdiAlignHorizontalRight,
  mdiAlignHorizontalCenter,
  mdiDistributeHorizontalLeft,
  mdiDistributeVerticalTop,
} from '@mdi/js';

import { jsPDF } from 'jspdf';

export default {
  name: 'ParkingCanvas',
  components: {
    SvgIcon
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
    }
  },
  emits: ['spots-changed', 'canvas-ready', 'zoom-changed', 'pan-changed', 'update:displayMode'], // ✓ 新增 emit
  setup(props, { emit }) {
    // Refs
    const fabricCanvas = ref(null)
    const canvas = ref(null)
    const canvasWidth = ref(1700)
    const canvasHeight = ref(850)
    const selectedSpot = ref(null)
    const spotProperties = ref({})
    const spotLayouts = ref([])
    const backgroundImage = ref(null)

    // 匯入車位資料相關
    const importDialog = ref(false)
    const loading = ref(false)
    const importing = ref(false)
    const previewParkings = ref([])
    const totalParkingCount = ref(0)
    const allParkingData = ref([])

    // 即時同步相關
    const salesParkingsListener = ref(null)

    // Zoom / Pan 狀態與參數
    const zoomLevel = ref(1)
    const minZoom = 0.2
    const maxZoom = 4
    const isPanning = ref(false)
    const spacePressed = ref(false)
    const lastPanPoint = ref({ x: 0, y: 0 })
    const baseCornerSize = 12

    // ✓ START: 新增狀態與計算屬性
    const activeSelection = ref(null) // 儲存當前選取的物件/群組
    const isMultiSelection = computed(() => activeSelection.value && activeSelection.value.type === 'activeSelection')
    const isSelectionLocked = computed(() => {
      if (!activeSelection.value) return false
      // 如果是單一物件，直接檢查。如果是群組，檢查群組中的任何一個物件。
      if (activeSelection.value.type !== 'activeSelection') {
        return activeSelection.value.lockMovementX
      }
      return activeSelection.value.getObjects().some(obj => obj.lockMovementX)
    })
    // ✓ END: 新增狀態與計算屬性

    // Functions
    const functions = getFunctions()
    const getSpotLayoutsAPI = httpsCallable(functions, 'getSpotLayouts')
    const getSalesParkingsByFloorAPI = httpsCallable(functions, 'getSalesParkingsByFloor')
    const saveSpotLayouts = httpsCallable(functions, 'saveSpotLayouts')

     // ✓ START: 新增圖層、鎖定、對齊、均分功能函式
    const bringToFront = () => {
      if (!activeSelection.value) return
      canvas.value.bringToFront(activeSelection.value)
      canvas.value.renderAll()
      emit('spots-changed')
    }

    const sendToBack = () => {
      if (!activeSelection.value) return
      canvas.value.sendToBack(activeSelection.value)
      canvas.value.renderAll()
      emit('spots-changed')
    }

    const toggleLock = () => {
      if (!activeSelection.value) return
      const newState = !isSelectionLocked.value
      const objects = activeSelection.value.type === 'activeSelection' 
        ? activeSelection.value.getObjects() 
        : [activeSelection.value]
      
      objects.forEach(obj => {
        obj.set({
          lockMovementX: newState,
          lockMovementY: newState,
          hasControls: !newState,
          hasBorders: !newState,
        })
      })
      canvas.value.renderAll()
      emit('spots-changed')
    }
    
     const alignObjects = (alignment) => {
      // ✓【修改】替換整個函式的邏輯
      if (!isMultiSelection.value) return
      
      const selection = activeSelection.value
      const objects = selection.getObjects()
      
      // 1. 根據物件本身的座標，找出對齊的目標基準線
      let target;
      switch(alignment) {
        case 'left':
          target = Math.min(...objects.map(obj => obj.left));
          break;
        case 'right':
          target = Math.max(...objects.map(obj => obj.left + obj.getScaledWidth()));
          break;
        case 'top':
          target = Math.min(...objects.map(obj => obj.top));
          break;
        case 'bottom':
          target = Math.max(...objects.map(obj => obj.top + obj.getScaledHeight()));
          break;
        case 'h-center': {
          const minLeft = Math.min(...objects.map(obj => obj.left));
          const maxRight = Math.max(...objects.map(obj => obj.left + obj.getScaledWidth()));
          target = minLeft + (maxRight - minLeft) / 2;
          break;
        }
        case 'v-center': {
          const minTop = Math.min(...objects.map(obj => obj.top));
          const maxBottom = Math.max(...objects.map(obj => obj.top + obj.getScaledHeight()));
          target = minTop + (maxBottom - minTop) / 2;
          break;
        }
      }

      // 2. 根據目標基準線，設定每一個物件的新位置
      objects.forEach(obj => {
        switch(alignment) {
          case 'left':
            obj.set('left', target);
            break;
          case 'right':
            obj.set('left', target - obj.getScaledWidth());
            break;
          case 'top':
            obj.set('top', target);
            break;
          case 'bottom':
            obj.set('top', target - obj.getScaledHeight());
            break;
          case 'h-center':
            obj.set('left', target - (obj.getScaledWidth() / 2));
            break;
        case 'v-center':
            obj.set('top', target - (obj.getScaledHeight() / 2));
            break;
        }
        obj.setCoords();
      });

      // 3. 重新計算選取框並渲染畫布
      selection.addWithUpdate();
      canvas.value.renderAll();
      emit('spots-changed');
    }

    const distributeObjects = (direction) => {
      if (!isMultiSelection.value || activeSelection.value.size() < 3) return
      const selection = activeSelection.value
      const objects = selection.getObjects()
      
      if (direction === 'horizontal') {
        objects.sort((a, b) => a.left - b.left)
        const totalWidth = objects.reduce((sum, obj) => sum + obj.getScaledWidth(), 0)
        const spacing = (selection.width - totalWidth) / (objects.length - 1)
        let currentLeft = objects[0].left
        objects.forEach(obj => {
          obj.set('left', currentLeft)
          currentLeft += obj.getScaledWidth() + spacing
          obj.setCoords()
        })
      } else { // vertical
        objects.sort((a, b) => a.top - b.top)
        const totalHeight = objects.reduce((sum, obj) => sum + obj.getScaledHeight(), 0)
        const spacing = (selection.height - totalHeight) / (objects.length - 1)
        let currentTop = objects[0].top
        objects.forEach(obj => {
          obj.set('top', currentTop)
          currentTop += obj.getScaledHeight() + spacing
          obj.setCoords()
        })
      }
      canvas.value.renderAll()
      emit('spots-changed')
    }
    // ✓ END: 新增功能函式

    // 初始化 Canvas
    const initCanvas = async () => {
      if (!fabricCanvas.value) return

      canvas.value = new fabric.Canvas(fabricCanvas.value, {
        width: canvasWidth.value,
        height: canvasHeight.value,
        backgroundColor: '#ffffff',
        selection: !props.previewMode,
        // ✓ 新增此行設定
        preserveObjectStacking: true 
      })

      setupCanvasEvents()
      
      if (props.floorPlan.backgroundImageUrl) {
        await loadBackgroundImage(props.floorPlan.backgroundImageUrl)
      }
      
      centerContent()
      emit('canvas-ready')
    }

    // 設置 Canvas 事件
    const setupCanvasEvents = () => {
      if (!canvas.value) return

      // ✓ 修改 selection 事件以更新 activeSelection 狀態
      const updateSelection = (e) => {
        activeSelection.value = e.selected.length > 0 ? canvas.value.getActiveObject() : null
        if (e.selected.length === 1 && (e.selected[0].type === 'parkingSpot' || e.selected[0].type === 'importedParkingSpot')) {
          selectSpot(e.selected[0])
        }
      }
      
      canvas.value.on('selection:created', updateSelection)
      canvas.value.on('selection:updated', updateSelection)
      canvas.value.on('selection:cleared', () => {
        activeSelection.value = null
        selectedSpot.value = null
      })

      const handleObjectModified = (e) => {
            const spot = e.target;
            if (!spot || (spot.type !== 'parkingSpot' && spot.type !== 'importedParkingSpot')) return;

            // 如果被修改的物件是當前選中的物件，則更新屬性面板的值
            // 使用 getScaledWidth/Height() 來取得縮放後實際的寬高
            if (selectedSpot.value === spot) {
              spotProperties.value.width = Math.round(spot.getScaledWidth());
              spotProperties.value.height = Math.round(spot.getScaledHeight());
              spotProperties.value.rotation = Math.round(spot.angle);
            }
            emit('spots-changed');
          }

      canvas.value.on('object:modified', handleObjectModified)
      canvas.value.on('object:moving', () => emit('spots-changed'))
      canvas.value.on('object:scaling', () => emit('spots-changed'))
      canvas.value.on('object:rotating', () => emit('spots-changed'))

      canvas.value.on('mouse:wheel', (opt) => {
        const e = opt.e
        if (!e.ctrlKey && !e.metaKey) return
        e.preventDefault()
        e.stopPropagation()

        const delta = e.deltaY
        let zoom = canvas.value.getZoom()
        const zoomFactor = 0.999 ** delta
        zoom *= zoomFactor
        zoom = Math.min(maxZoom, Math.max(minZoom, zoom))

        const point = new fabric.Point(e.offsetX, e.offsetY)
        canvas.value.zoomToPoint(point, zoom)
        zoomLevel.value = zoom
        adjustControlCornerSize()
        emit('zoom-changed', { zoom })
      })

      canvas.value.on('mouse:down', (opt) => {
        const e = opt.e
        if ((spacePressed.value && e.button === 0) || e.button === 1) {
          isPanning.value = true
          canvas.value.setCursor('grabbing')
          canvas.value.selection = false
          lastPanPoint.value = { x: e.clientX, y: e.clientY }
        }
      })

      canvas.value.on('mouse:move', (opt) => {
        if (!isPanning.value) return
        const e = opt.e
        const vpt = canvas.value.viewportTransform
        vpt[4] += e.clientX - lastPanPoint.value.x
        vpt[5] += e.clientY - lastPanPoint.value.y
        lastPanPoint.value = { x: e.clientX, y: e.clientY }
        emit('pan-changed', { x: vpt[4], y: vpt[5] })
        canvas.value.requestRenderAll()
      })

      canvas.value.on('mouse:up', () => {
        if (isPanning.value) {
          isPanning.value = false
          canvas.value.setCursor('default')
          canvas.value.selection = !props.previewMode
        }
      })
    }
    
     // 創建從 salesParkings 資料來的車位物件
    const createParkingSpotFromData = (options = {}) => {
      const { x = 100, y = 100, parkingData, displayMode = props.displayMode, textStyles = props.textStyles } = options

      // 定義預設樣式，以防萬一 textStyles 未傳入
       const defaultStyles = {
        number: { fontSize: 10, fontWeight: 'bold', fill: '#000000', fontFamily: 'Arial' },
        price: { fontSize: 8, fontWeight: 'normal', fill: '#000000', fontFamily: 'Arial' },
        buyerUnitId: { fontSize: 8, fontWeight: 'normal', fill: '#000000', fontFamily: 'Arial' },
        buyerName: { fontSize: 8, fontWeight: 'normal', fill: '#000000', fontFamily: 'Arial' },
        salesperson: { fontSize: 8, fontWeight: 'normal', fill: '#000000', fontFamily: 'Arial' },
        size: { fontSize: 8, fontWeight: 'normal', fill: '#000000', fontFamily: 'Arial' },
        type: { fontSize: 8, fontWeight: 'normal', fill: '#000000', fontFamily: 'Arial' },
        status: { fontSize: 9, fontWeight: 'bold', fill: '#D32F2F', fontFamily: 'Arial' },
      };

      // 合併傳入的樣式與預設樣式
       const finalStyles = Object.keys(defaultStyles).reduce((acc, key) => {
        acc[key] = { ...defaultStyles[key], ...(textStyles[key] || {}) };
        return acc;
      }, {});


             // ✓【修改】使用動態顏色設定，而不是寫死的 switch
      const getStatusColor = (mode, data) => {
        const statusColors = props.statusColors || {};
        const modeColors = statusColors[mode] || {};
        
        let statusKey;
        if (mode === 'backend') {
          statusKey = data.status_backend;
        } else { // sales mode
          statusKey = data.status === '已售' ? '已售' : null;
        }
        
        // 如果找到了對應的狀態顏色，就使用它；否則使用預設顏色
        return modeColors[statusKey] || modeColors.default || '#F5F5F5';
      };

      // 此函式現在回傳一個包含 {key, value} 的物件陣列
      const getDisplayFields = (mode, data) => {
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

      const fillColor = getStatusColor(displayMode, parkingData);
      const displayFields = getDisplayFields(displayMode, parkingData);

      const rect = new fabric.Rect({ width: 48, height: 105, fill: fillColor, stroke: '#000000', strokeWidth: 2, originX: 'center', originY: 'center', evented: false });
      
      const groupItems = [rect];
      let currentY = -rect.height / 2 + 5; // 起始 Y 座標

      // 為每個欄位建立獨立的 Text 物件
      displayFields.forEach(field => {
        const style = finalStyles[field.key];
        const textObj = new fabric.Text(String(field.value), {
          fontSize: style.fontSize,
          fill: style.fill,
          fontWeight: style.fontWeight,
          fontFamily: style.fontFamily,
          textAlign: 'center',
          originX: 'center',
          originY: 'top', // 從頂部對齊
          top: currentY,
          evented: false
        });
        groupItems.push(textObj);
        currentY += textObj.height + 2; // 更新下一個文字的 Y 座標
      });

      const group = new fabric.Group(groupItems, {
        left: x, top: y,
        selectable: !props.previewMode, hasControls: !props.previewMode, hasBorders: !props.previewMode,
        cornerSize: baseCornerSize / zoomLevel.value
      });

      group.type = 'importedParkingSpot';
      group.parkingData = parkingData;
      group.currentDisplayMode = displayMode;
      return group;
    }

    // 選擇車位
    const selectSpot = (spot) => {
      selectedSpot.value = spot
      spotProperties.value = {
        spotId: spot.parkingData?.number || '',
        width: Math.round(spot.getScaledWidth()),
        height: Math.round(spot.getScaledHeight()),
        rotation: Math.round(spot.angle || 0),
        fill: spot._objects[0].fill,
      }
    }

    // 更新車位屬性
    const updateSpotProperty = (property, value) => {
      if (!selectedSpot.value) return
      const spot = selectedSpot.value
      
      switch (property) {
        case 'spotId': 
          // 更新 parkingData 中的 number，讓文字可以同步更新
          if (spot.parkingData) spot.parkingData.number = value
          updateAllSpots(props.displayMode, props.textStyles) // 強制重繪以更新文字
          break
        case 'width': 
          spot.scaleToWidth(value); 
          break
        case 'height': 
          spot.scaleToHeight(value); 
          break
        case 'rotation': spot.set('angle', value); break
        case 'fill': 
          const rect = spot._objects.find(o => o.type === 'rect')
          if (rect) rect.set('fill', value)
          break
      }

      // 重新渲染並觸發變更事件
      canvas.value.renderAll()
      emit('spots-changed')
    }

    // 關閉屬性面板
    const closePropertiesPanel = () => {
      selectedSpot.value = null
      canvas.value.discardActiveObject()
      canvas.value.renderAll()
    }

    // 刪除選中的車位
    const deleteSelectedSpot = () => {
      if (!selectedSpot.value) return
      if (confirm('確定要刪除此車位嗎？')) {
        canvas.value.remove(selectedSpot.value)
        selectedSpot.value = null
        emit('spots-changed')
      }
    }
    
    // 載入背景圖片
    const loadBackgroundImage = (url) => {
      return new Promise((resolve) => {
        fabric.Image.fromURL(url, (img) => {
          // ✓【修改】讓背景圖可以被拖曳
          img.set({
            selectable: true,
            evented: true,
            hasControls: false,
            hasBorders: false,
            type: 'backgroundImage'
          })
          if (backgroundImage.value) canvas.value.remove(backgroundImage.value)
          backgroundImage.value = img
          canvas.value.add(img)
          canvas.value.sendToBack(img)
          resolve()
        }, { crossOrigin: 'anonymous' })
      })
    }
    
    // 獲取車位佈局資料
    const getSpotLayouts = () => {
  if (!canvas.value) return []
  return canvas.value.getObjects()
    .filter(obj => obj.type === 'importedParkingSpot' || obj.type === 'parkingSpot')
    .map(spot => ({
      id: spot.layoutId || null,
      spotId: spot.parkingData?.number || spot.spotId || '',
      x: Math.round(spot.left),
      y: Math.round(spot.top),
      width: Math.round(spot.width),
      height: Math.round(spot.height),
      rotation: Math.round(spot.angle),
      type: spot.type === 'importedParkingSpot' ? 'imported' : 'manual',
      salesParkingId: spot.parkingData?.id || null,
      displayMode: spot.currentDisplayMode || 'backend'
    }))
}

    // 匯入車位資料相關方法
    const openImportModal = async () => {
      importDialog.value = true
      loading.value = true
      try {
        // ✓【修改】在呼叫 API 前，先確保 floor 的值是單純的字串
        const floorValue = (typeof props.floorPlan.floor === 'object' && props.floorPlan.floor !== null)
          ? props.floorPlan.floor.value 
          : props.floorPlan.floor;

        // ✓【修改】在 API 呼叫中使用處理過的 floorValue
        const result = await getSalesParkingsByFloorAPI({ projectId: props.projectId, floor: floorValue })
        
        if (result.data.success) {
          allParkingData.value = result.data.allData || []
          previewParkings.value = result.data.preview || []
          totalParkingCount.value = result.data.total || 0
        }
      } finally {
        loading.value = false
      }
    }

    const closeImportModal = () => { importDialog.value = false }

    const confirmImport = async () => {
  importing.value = true
  try {
    const importedSpots = canvas.value.getObjects().filter(obj => obj.type === 'importedParkingSpot')
    importedSpots.forEach(spot => canvas.value.remove(spot))
    
    // ✓【新增】建立一個陣列來收集新建立的物件
    const newSpots = []

    allParkingData.value.forEach((parkingData, index) => {
      const spot = createParkingSpotFromData({
        x: 100 + (index % 10) * 60,
        y: 100 + Math.floor(index / 10) * 120,
        parkingData: parkingData,
        displayMode: props.displayMode 
      })
      canvas.value.add(spot)
      newSpots.push(spot)
    })
    
    // 在全部加入畫布後，遍歷所有新物件並呼叫 setCoords()
    // 這一步是解決問題的關鍵，它會強制更新每個物件的控制點使其可互動
    newSpots.forEach(spot => spot.setCoords())

    canvas.value.renderAll()
    emit('spots-changed')
    
    // const layouts = getSpotLayouts()
    // await saveSpotLayouts({ floorPlanId: props.floorPlan.id, layouts })

  } finally {
    importing.value = false
    closeImportModal()
  }
}

   const switchDisplayMode = (mode) => {
      // ✓【修改】發出事件通知父元件更新狀態
      emit('update:displayMode', mode)
    }
    
  
    const updateAllSpots = (mode, styles) => {
      if (!canvas.value) return;
      
      const spotsToUpdate = canvas.value.getObjects().filter(obj => obj.type === 'importedParkingSpot');

      spotsToUpdate.forEach(spot => {
        if (spot.parkingData) {
          const newSpot = createParkingSpotFromData({
            x: spot.left,
            y: spot.top,
            parkingData: spot.parkingData,
            displayMode: mode,
            textStyles: styles
          });
          
          newSpot.scaleX = spot.scaleX;
          newSpot.scaleY = spot.scaleY;
          newSpot.angle = spot.angle;

          canvas.value.remove(spot);
          canvas.value.add(newSpot);
        }
      });
      canvas.value.renderAll();
    };
  
    // 調整控制點大小
    const adjustControlCornerSize = () => {
      if (!canvas.value) return
      const size = baseCornerSize / canvas.value.getZoom()
      canvas.value.getObjects().forEach(obj => obj.set({ cornerSize: size }))
    }

    // 鍵盤事件
    const handleKeyDown = (e) => { if (e.code === 'Space') { spacePressed.value = true; canvas.value.setCursor('grab'); } }
    const handleKeyUp = (e) => { if (e.code === 'Space') { spacePressed.value = false; if (!isPanning.value) canvas.value.setCursor('default'); } }
    
    // 將內容置中
    const centerContent = () => {
      if (!canvas.value) return
      const obj = backgroundImage.value
      if (!obj) return
      canvas.value.centerObject(obj)
      obj.setCoords()
      canvas.value.renderAll()
    }
    
    // 匯出/列印
    const downloadImage = (filename = 'floorplan', format = 'png') => {
      const dataURL = canvas.value.toDataURL({ format, multiplier: 2 })
      const link = document.createElement('a');
      link.download = `${filename}.${format}`;
      link.href = dataURL;
      link.click();
    }
    
    const printFloorplan = () => {
      const dataURL = canvas.value.toDataURL({ format: 'png', multiplier: 2 });
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html><head><title>列印平面圖</title></head>
        <body style="margin:0;"><img src="${dataURL}" style="width:100%;" onload="window.print();window.close();"></body>
        </html>`);
      printWindow.document.close();
    }
    
    const exportAsPDF = async (filename = 'floorplan') => {
      const dataURL = canvas.value.toDataURL({ format: 'jpeg', quality: 0.9, multiplier: 2 });
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataURL);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
      pdf.addImage(dataURL, 'JPEG', 0, 0, imgProps.width * ratio, imgProps.height * ratio);
      pdf.save(`${filename}.pdf`);
    }

    // 生命週期
    onMounted(async () => {
      await nextTick()
      await initCanvas()
      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('keyup', handleKeyUp)
    })

    onUnmounted(() => {
      if (salesParkingsListener.value) salesParkingsListener.value()
      if (canvas.value) canvas.value.dispose()
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    })
    
    // 監聽 props 變化
    watch(() => props.floorPlan.id, () => {
      initCanvas()
    })
    
     watch(() => props.previewMode, (is_preview) => {
      if (!canvas.value) return
      canvas.value.selection = !is_preview
      canvas.value.getObjects().forEach(obj => obj.set({ selectable: !is_preview, hasControls: !is_preview, hasBorders: !is_preview }))
      canvas.value.renderAll()
    })

    watch(() => props.displayMode, (newMode) => {
      updateAllSpots(newMode, props.textStyles);
    });

     watch(() => props.textStyles, (newStyles) => {
      updateAllSpots(props.displayMode, newStyles);
    }, { deep: true });

    watch(() => props.statusColors, () => {
      updateAllSpots(props.displayMode, props.textStyles);
    }, { deep: true });

    return {
      fabricCanvas, canvasWidth, canvasHeight,
      selectedSpot, spotProperties,
      importDialog, loading, importing, previewParkings, totalParkingCount, 
      displayMode: computed(() => props.displayMode), 
      floorPlan: props.floorPlan,
      
      getSpotLayouts,
      updateSpotProperty,
      closePropertiesPanel,
      deleteSelectedSpot,
      
      openImportModal,
      closeImportModal,
      confirmImport,
      switchDisplayMode,
      
      downloadImage, printFloorplan, exportAsPDF,
      
      mdiDownload, mdiLoading, mdiClose, mdiTrashCanOutline,
      activeSelection,
      isMultiSelection,
      isSelectionLocked,
      bringToFront,
      sendToBack,
      toggleLock,
      alignObjects,
      distributeObjects,
      
      // ✓ 導出新圖示
      mdiArrowUpBoldBoxOutline,
      mdiArrowDownBoldBoxOutline,
      mdiLock,
      mdiLockOpenVariant,
      mdiAlignVerticalTop,
      mdiAlignVerticalBottom,
      mdiAlignVerticalCenter,
      mdiAlignHorizontalLeft,
      mdiAlignHorizontalRight,
      mdiAlignHorizontalCenter,
      mdiDistributeHorizontalLeft,
      mdiDistributeVerticalTop,

    }
  }
}
</script>

<style scoped>
.parking-canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5;
}

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

/* ✓ START: 新增編輯工具列樣式 */
.edit-toolbar {
  position: absolute;
  top: 80px;
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: white;
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 10;
}

.toolbar-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 8px;
}
.toolbar-group:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.toolbar-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.toolbar-btn:hover:not(:disabled) {
  background-color: #f0f2f5;
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-btn svg {
  width: 24px;
  height: 24px;
}
/* ✓ END: 新增編輯工具列樣式 */
</style>