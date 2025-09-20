<template>
  <div class="parking-canvas-container center-xy">
    <canvas ref="fabricCanvas" :width="canvasWidth" :height="canvasHeight"></canvas>
    
    <!-- 車位屬性編輯面板 -->
    <div v-if="selectedSpot" class="spot-properties-panel">
      <div class="panel-header">
        <h4>車位屬性</h4>
        <button @click="closePropertiesPanel" class="btn-close">
          <i class="fas fa-times"></i>
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
        
        <div class="form-group">
          <label>顯示文字</label>
          <input 
            v-model="spotProperties.text" 
            @input="updateSpotProperty('text', $event.target.value)"
            type="text" 
            class="form-input"
          />
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>寬度</label>
            <input 
              v-model="spotProperties.width" 
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
          <label>背景顏色</label>
          <input 
            v-model="spotProperties.backgroundColor" 
            @input="updateSpotProperty('backgroundColor', $event.target.value)"
            type="color" 
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label>邊框顏色</label>
          <input 
            v-model="spotProperties.borderColor" 
            @input="updateSpotProperty('borderColor', $event.target.value)"
            type="color" 
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label>文字顏色</label>
          <input 
            v-model="spotProperties.textColor" 
            @input="updateSpotProperty('textColor', $event.target.value)"
            type="color" 
            class="form-input"
          />
        </div>
        
        <div class="panel-actions">
          <button @click="deleteSelectedSpot" class="btn btn-danger btn-sm">
            <i class="fas fa-trash"></i> 刪除車位
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { fabric } from 'fabric'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { getFirestore } from 'firebase/firestore' 
import { db } from '@/firebase'

import { serverTimestamp } from 'firebase/firestore'

export default {
  name: 'ParkingCanvas',
  props: {
    floorPlan: {
      type: Object,
      required: true
    },
    showGrid: {
      type: Boolean,
      default: true // deprecated: 網格功能已移除，僅保留相容性
    },
    previewMode: {
      type: Boolean,
      default: false
    }
  },
  emits: ['spots-changed', 'canvas-ready', 'zoom-changed', 'pan-changed'],
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
  const lastUpdateTime = ref(Date.now())

  // Zoom / Pan 狀態與參數
  const zoomLevel = ref(1)
  const minZoom = 0.2
  const maxZoom = 4
  const zoomStep = 0.1
  const isPanning = ref(false)
  const spacePressed = ref(false)
  const lastPanPoint = ref({ x: 0, y: 0 })
  const baseCornerSize = 12

    // Functions
    const functions = getFunctions()
    const db = getFirestore()
    const getSpotLayoutsAPI = httpsCallable(functions, 'getSpotLayouts')

    // 初始化 Canvas
    const initCanvas = async () => {
      if (!fabricCanvas.value) return

      canvas.value = new fabric.Canvas(fabricCanvas.value, {
        width: canvasWidth.value,
        height: canvasHeight.value,
        backgroundColor: '#ffffff',
        selection: !props.previewMode
      })

      // 設置 Canvas 事件
      setupCanvasEvents()
      
      // 載入背景圖片
      if (props.floorPlan.backgroundImageUrl) {
        await loadBackgroundImage(props.floorPlan.backgroundImageUrl)
      }
      
      // 載入車位佈局
      await loadSpotLayouts()
      
  // 初始置中目前內容
  centerContent()
      
      // 即時同步功能已暫時移除
      // setupRealtimeSync()
      
      emit('canvas-ready')
    }

    // 設置 Canvas 事件
    const setupCanvasEvents = () => {
      if (!canvas.value) return

      // 選擇物件事件
      canvas.value.on('selection:created', (e) => {
        if (e.selected && e.selected.length === 1 && e.selected[0].type === 'parkingSpot') {
          selectSpot(e.selected[0])
        }
      })

      canvas.value.on('selection:updated', (e) => {
        if (e.selected && e.selected.length === 1 && e.selected[0].type === 'parkingSpot') {
          selectSpot(e.selected[0])
        } else {
          selectedSpot.value = null
        }
      })

      canvas.value.on('selection:cleared', () => {
        selectedSpot.value = null
      })

      // 物件修改事件
      canvas.value.on('object:modified', (e) => {
        const spot = e.target
        if (spot && spot.type === 'parkingSpot') {
          // 從 Group 更新內部 Rect 的尺寸
          const rect = spot._objects[0]
          rect.set({
            width: spot.width * spot.scaleX,
            height: spot.height * spot.scaleY
          })
          
          // 重設 Group 的 scale，將縮放轉換為尺寸
          spot.set({
            width: spot.width * spot.scaleX,
            height: spot.height * spot.scaleY,
            scaleX: 1,
            scaleY: 1
          })

          // 如果選中的是目前物件，則更新屬性面板
          if (selectedSpot.value === spot) {
            spotProperties.value.width = Math.round(spot.width)
            spotProperties.value.height = Math.round(spot.height)
            spotProperties.value.rotation = Math.round(spot.angle)
          }
        }
        emit('spots-changed')
        saveSpotLayoutsToFirestore()
      })

      canvas.value.on('object:moving', () => {
        emit('spots-changed')
      })

      canvas.value.on('object:scaling', () => {
        emit('spots-changed')
      })

      canvas.value.on('object:rotating', () => {
        emit('spots-changed')
      })

      // 滾輪縮放（需按住 Ctrl/⌘）
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
        canvas.value.perPixelTargetFind = zoom > 1.5
        adjustControlCornerSize()
        emit('zoom-changed', { zoom })
        canvas.value.requestRenderAll()
      })

      // 平移（空白鍵+左鍵 或 中鍵）
      canvas.value.on('mouse:down', (opt) => {
        const e = opt.e
        const isMiddle = e.button === 1
        const isSpaceLeft = spacePressed.value && e.button === 0
        if (isMiddle || isSpaceLeft) {
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
        if (!vpt) return
        const dx = e.clientX - lastPanPoint.value.x
        const dy = e.clientY - lastPanPoint.value.y
        vpt[4] += dx
        vpt[5] += dy
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

    // 載入車位佈局
    const loadSpotLayouts = async () => {
      try {
        const result = await getSpotLayoutsAPI({ floorPlanId: props.floorPlan.id })
        spotLayouts.value = result.data.data || []
        
        // 清除現有車位
        clearSpots()
        
        // 渲染車位
        for (const layout of spotLayouts.value) {
          createSpotFromLayout(layout)
        }
        
        canvas.value.renderAll()
      } catch (error) {
        console.error('載入車位佈局失敗:', error)
      }
    }

    // 從佈局資料創建車位
    const createSpotFromLayout = (layout) => {
      const spot = createParkingSpot({
        x: layout.x,
        y: layout.y,
        width: layout.width,
        height: layout.height,
        rotation: layout.rotation,
        spotId: layout.spotId,
        text: layout.text,
        styles: layout.styles || {}
      })
      
      spot.layoutId = layout.id
      canvas.value.add(spot)
    }

 
    // 創建車位物件
    const createParkingSpot = (options = {}) => {
      const {
        x = 100,
        y = 100,
        width = 60,
        height = 40,
        rotation = 0,
        spotId = '',
        text = '',
        styles = {}
      } = options

      // 創建車位矩形
      const rect = new fabric.Rect({
        left: 0,
        top: 0,
        width: width,
        height: height,
        fill: styles.backgroundColor || '#e8f5e8',
        stroke: styles.borderColor || '#4caf50',
        strokeWidth: 2,
        strokeUniform: true,
        rx: 0,
        ry: 0,
        originX: 'center',
        originY: 'center',
        // 設為 false，因為互動應該由 Group 控制
        selectable: false,
        hasControls: false,
        hasBorders: false,
        evented: false
      })

      // 創建文字
      const textObj = new fabric.Text(text || spotId || 'P1', {
        left: 0,
        top: 0,
        fontSize: 12,
        fill: styles.textColor || '#000000',
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false
      })

      // 創建群組
      const group = new fabric.Group([rect, textObj], {
        left: x,
        top: y,
        angle: rotation,
        selectable: !props.previewMode,
        hasControls: !props.previewMode,
        hasBorders: !props.previewMode,
        cornerSize: baseCornerSize / (zoomLevel.value || 1)
      })

      // 設置自定義屬性
      group.type = 'parkingSpot'
      group.spotId = spotId
      group.spotText = text
      group.spotStyles = styles

      return group
    }

    // 選擇車位
    const selectSpot = (spot) => {
      selectedSpot.value = spot
      spotProperties.value = {
        spotId: spot.spotId || '',
        text: spot.spotText || '',
        width: Math.round(spot.width || 60),
        height: Math.round(spot.height || 40),
        rotation: Math.round(spot.angle || 0),
        backgroundColor: spot.spotStyles?.backgroundColor || '#e8f5e8',
        borderColor: spot.spotStyles?.borderColor || '#4caf50',
        textColor: spot.spotStyles?.textColor || '#000000'
      }
    }

    // 更新車位屬性
    const updateSpotProperty = (property, value) => {
      if (!selectedSpot.value) return

      const spot = selectedSpot.value
      
      switch (property) {
        case 'spotId':
          spot.spotId = value
          break
        case 'text':
          spot.spotText = value
          // 更新文字物件
          if (spot._objects && spot._objects[1] && spot._objects[1].type === 'text') {
            spot._objects[1].set('text', value || spot.spotId || 'P1')
          }
          break
        case 'width':
          spot.set('width', value)
          if (spot._objects && spot._objects[0]) {
            spot._objects[0].set('width', value)
          }
          // 文字物件因為 originX/Y 都是 center，所以不需要調整 left/top
          break
        case 'height':
          spot.set('height', value)
          if (spot._objects && spot._objects[0]) {
            spot._objects[0].set('height', value)
          }
          // 文字物件因為 originX/Y 都是 center，所以不需要調整 left/top
          break
        case 'rotation':
          spot.set('angle', value)
          break
        case 'backgroundColor':
          if (spot._objects && spot._objects[0]) {
            spot._objects[0].set('fill', value)
          }
          spot.spotStyles = { ...spot.spotStyles, backgroundColor: value }
          break
        case 'borderColor':
          if (spot._objects && spot._objects[0]) {
            spot._objects[0].set('stroke', value)
          }
          spot.spotStyles = { ...spot.spotStyles, borderColor: value }
          break
        case 'textColor':
          if (spot._objects && spot._objects[1]) {
            spot._objects[1].set('fill', value)
          }
          spot.spotStyles = { ...spot.spotStyles, textColor: value }
          break
      }
      
      canvas.value.renderAll()
      emit('spots-changed')
      saveSpotLayoutsToFirestore()
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
        canvas.value.renderAll()
        emit('spots-changed')
        saveSpotLayoutsToFirestore()
      }
    }

    // 新增車位
    const addSpot = () => {
      const spot = createParkingSpot({
        x: 100,
        y: 100,
        spotId: `P${Date.now()}`,
        text: '新車位'
      })
      
      canvas.value.add(spot)
      canvas.value.setActiveObject(spot)
      canvas.value.renderAll()
      emit('spots-changed')
      saveSpotLayoutsToFirestore()
    }

    // 清除所有車位
    const clearSpots = () => {
      const objects = canvas.value.getObjects().filter(obj => obj.type === 'parkingSpot')
      objects.forEach(obj => canvas.value.remove(obj))
    }

    // 網格功能已移除

    // 載入背景圖片
    const loadBackgroundImage = (url) => {
      return new Promise((resolve) => {
        fabric.Image.fromURL(url, (img) => {
          // 計算適合的尺寸
          const canvasAspect = canvasWidth.value / canvasHeight.value
          const imgAspect = img.width / img.height

          let scale = 1
          if (imgAspect > canvasAspect) {
            scale = canvasWidth.value / img.width
          } else {
            scale = canvasHeight.value / img.height
          }

          img.set({
            scaleX: scale * 0.8,
            scaleY: scale * 0.8,
            left: canvasWidth.value / 2,
            top: canvasHeight.value / 2,
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
            type: 'backgroundImage'
          })

          // 移除舊的背景圖片
          if (backgroundImage.value) {
            canvas.value.remove(backgroundImage.value)
          }

          backgroundImage.value = img
          canvas.value.add(img)
          canvas.value.sendToBack(img)
          canvas.value.renderAll()
          resolve()
        })
      })
    }


    // 更新平面圖背景 URL 到 Firestore


    // 即時同步功能已移除
    // const setupRealtimeSync = () => { ... }

    // 儲存車位佈局到 Firestore
    const saveSpotLayoutsToFirestore = async () => {
      try {
        const layouts = getSpotLayouts()
        const saveSpotLayouts = httpsCallable(functions, 'saveSpotLayouts')
        
        await saveSpotLayouts({
          floorPlanId: props.floorPlan.id,
          layouts: layouts
        })
        
        lastUpdateTime.value = Date.now()
      } catch (error) {
        console.error('儲存車位佈局失敗:', error)
      }
    }

    // 獲取車位佈局資料
    const getSpotLayouts = () => {
      if (!canvas.value) return []

      const spots = canvas.value.getObjects().filter(obj => obj.type === 'parkingSpot')
      return spots.map(spot => ({
        id: spot.layoutId || null,
        spotId: spot.spotId || '',
        x: Math.round(spot.left || 0),
        y: Math.round(spot.top || 0),
        width: Math.round(spot.width || 60),
        height: Math.round(spot.height || 40),
        rotation: Math.round(spot.angle || 0),
        text: spot.spotText || '',
        styles: spot.spotStyles || {}
      }))
    }

    // 調整 Canvas 尺寸
    const resizeCanvas = () => {
      if (!canvas.value) return

      const container = fabricCanvas.value.parentElement
      if (!container) return

      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight

      canvasWidth.value = Math.max(containerWidth - 20, 800)
      canvasHeight.value = Math.max(containerHeight - 20, 600)

      canvas.value.setDimensions({
        width: canvasWidth.value,
        height: canvasHeight.value
      })
    }

    // 監聽屬性變化
    watch(() => props.floorPlan, (newPlan, oldPlan) => {
      if (newPlan && oldPlan && newPlan.id !== oldPlan.id) {
        console.log('Floor plan changed, re-initializing canvas...');
        initCanvas();
      }
    }, { deep: true });

  // 網格相關監聽已移除
    
    watch(() => props.previewMode, (newValue) => {
      if (!canvas.value) return
      
      canvas.value.selection = !newValue
      const objects = canvas.value.getObjects()
      objects.forEach(obj => {
        if (obj.type === 'parkingSpot') {
          obj.set({
            selectable: !newValue,
            hasControls: !newValue,
            hasBorders: !newValue
          })
        }
      })
      canvas.value.renderAll()
    })

    // 鍵盤事件：空白鍵切換 Pan 模式
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        spacePressed.value = true
        if (canvas.value) canvas.value.setCursor('grab')
      }
    }
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        spacePressed.value = false
        if (canvas.value && !isPanning.value) canvas.value.setCursor('default')
      }
    }

    // 生命週期
    onMounted(async () => {
      await nextTick()
      await initCanvas()
      
      // 監聽視窗大小變化
      window.addEventListener('resize', resizeCanvas)
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
      
      // 初始化時調整一次尺寸
      setTimeout(resizeCanvas, 100)
    })

    onUnmounted(() => {
      if (canvas.value) {
        canvas.value.dispose()
      }
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    })

    // 更新樣式
    const updateStyles = (styles) => {
      console.log('更新樣式:', styles)
      // 這裡可以根據需要更新 Canvas 中的樣式
      // 例如更新預設車位樣式等（網格功能已移除）
      
      canvas.value.renderAll()
    }

    // 調整控制點大小（隨縮放）
    const adjustControlCornerSize = () => {
      if (!canvas.value) return
      const size = baseCornerSize / (canvas.value.getZoom() || 1)
      canvas.value.getObjects().forEach(obj => {
        if (obj.type === 'parkingSpot') obj.set({ cornerSize: size })
      })
    }

    // Zoom/Pan API
    const getZoom = () => (canvas.value ? canvas.value.getZoom() : 1)
    const setZoom = (value, point = null) => {
      if (!canvas.value) return
      const clamped = Math.min(maxZoom, Math.max(minZoom, value))
      const p = point || new fabric.Point(canvas.value.getWidth() / 2, canvas.value.getHeight() / 2)
      canvas.value.zoomToPoint(p, clamped)
      zoomLevel.value = clamped
      canvas.value.perPixelTargetFind = clamped > 1.5
      adjustControlCornerSize()
      emit('zoom-changed', { zoom: clamped })
      canvas.value.requestRenderAll()
    }
    const zoomIn = () => setZoom(getZoom() + zoomStep)
    const zoomOut = () => setZoom(getZoom() - zoomStep)
    const resetZoom = () => {
      if (!canvas.value) return
      canvas.value.setViewportTransform([1, 0, 0, 1, 0, 0])
      zoomLevel.value = 1
      adjustControlCornerSize()
      emit('zoom-changed', { zoom: 1 })
      emit('pan-changed', { x: 0, y: 0 })
      canvas.value.requestRenderAll()
    }
    const getPan = () => {
      if (!canvas.value || !canvas.value.viewportTransform) return { x: 0, y: 0 }
      const vpt = canvas.value.viewportTransform
      return { x: vpt[4], y: vpt[5] }
    }
    const setPan = ({ x = 0, y = 0 }) => {
      if (!canvas.value || !canvas.value.viewportTransform) return
      const vpt = canvas.value.viewportTransform
      vpt[4] = x
      vpt[5] = y
      emit('pan-changed', { x, y })
      canvas.value.requestRenderAll()
    }

    const fitToScreen = () => {
      if (!canvas.value) return
      const objs = canvas.value.getObjects().filter(o => ['parkingSpot', 'backgroundImage'].includes(o.type))
      if (objs.length === 0) {
        resetZoom()
        return
      }
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      objs.forEach(o => {
        const r = o.getBoundingRect(true, true)
        minX = Math.min(minX, r.left)
        minY = Math.min(minY, r.top)
        maxX = Math.max(maxX, r.left + r.width)
        maxY = Math.max(maxY, r.top + r.height)
      })
      const contentW = maxX - minX
      const contentH = maxY - minY
      if (contentW <= 0 || contentH <= 0) {
        resetZoom()
        return
      }
      const padding = 40
      const scaleX = (canvas.value.getWidth() - padding) / contentW
      const scaleY = (canvas.value.getHeight() - padding) / contentH
      const nextZoom = Math.min(maxZoom, Math.max(minZoom, Math.min(scaleX, scaleY)))
      const centerX = minX + contentW / 2
      const centerY = minY + contentH / 2
      setZoom(nextZoom, new fabric.Point(centerX, centerY))
      const vpt = canvas.value.viewportTransform
      if (vpt) {
        const canvasCenter = new fabric.Point(canvas.value.getWidth() / 2, canvas.value.getHeight() / 2)
        const transformedCenter = fabric.util.transformPoint(new fabric.Point(centerX, centerY), vpt)
        vpt[4] += canvasCenter.x - transformedCenter.x
        vpt[5] += canvasCenter.y - transformedCenter.y
        emit('pan-changed', { x: vpt[4], y: vpt[5] })
        canvas.value.requestRenderAll()
      }
    }

    const zoomToSelection = () => {
      if (!canvas.value) return
      const obj = canvas.value.getActiveObject()
      if (!obj) return
      const r = obj.getBoundingRect(true, true)
      const padding = 40
      const scaleX = (canvas.value.getWidth() - padding) / r.width
      const scaleY = (canvas.value.getHeight() - padding) / r.height
      const nextZoom = Math.min(maxZoom, Math.max(minZoom, Math.min(scaleX, scaleY)))
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      setZoom(nextZoom, new fabric.Point(cx, cy))
      const vpt = canvas.value.viewportTransform
      if (vpt) {
        const canvasCenter = new fabric.Point(canvas.value.getWidth() / 2, canvas.value.getHeight() / 2)
        const transformedCenter = fabric.util.transformPoint(new fabric.Point(cx, cy), vpt)
        vpt[4] += canvasCenter.x - transformedCenter.x
        vpt[5] += canvasCenter.y - transformedCenter.y
        emit('pan-changed', { x: vpt[4], y: vpt[5] })
        canvas.value.requestRenderAll()
      }
    }

    // 將目前內容（背景圖 + 車位）置中到畫布視窗
    const centerContent = () => {
      if (!canvas.value) return
      const objs = canvas.value.getObjects().filter(o => ['parkingSpot', 'backgroundImage'].includes(o.type))
      if (objs.length === 0) return

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      objs.forEach(o => {
        const r = o.getBoundingRect(true, true)
        minX = Math.min(minX, r.left)
        minY = Math.min(minY, r.top)
        maxX = Math.max(maxX, r.left + r.width)
        maxY = Math.max(maxY, r.top + r.height)
      })
      const cx = minX + (maxX - minX) / 2
      const cy = minY + (maxY - minY) / 2

      const vpt = canvas.value.viewportTransform
      if (!vpt) return
      const canvasCenter = new fabric.Point(canvas.value.getWidth() / 2, canvas.value.getHeight() / 2)
      const transformedCenter = fabric.util.transformPoint(new fabric.Point(cx, cy), vpt)
      vpt[4] += canvasCenter.x - transformedCenter.x
      vpt[5] += canvasCenter.y - transformedCenter.y
      emit('pan-changed', { x: vpt[4], y: vpt[5] })
      canvas.value.requestRenderAll()
    }

    // 匯出為圖片
    const exportAsImage = (format = 'png', quality = 1.0) => {
      if (!canvas.value) return null

      // 取消選擇所有物件以避免控制點出現在匯出圖片中
      canvas.value.discardActiveObject()
      canvas.value.renderAll()

      // 暫時重置視圖，避免縮放/平移影響輸出
      const originalVpt = canvas.value.viewportTransform ? [...canvas.value.viewportTransform] : null
      const originalZoom = canvas.value.getZoom()
      canvas.value.setViewportTransform([1, 0, 0, 1, 0, 0])
      canvas.value.renderAll()

      // 匯出為 Data URL
      const dataURL = canvas.value.toDataURL({
        format: format,
        quality: quality,
        multiplier: 2 // 提高解析度
      })

      // 還原視圖
      if (originalVpt) {
        canvas.value.setViewportTransform(originalVpt)
        canvas.value.setZoom(originalZoom || 1)
        canvas.value.renderAll()
      }

      return dataURL
    }

    // 下載圖片
    const downloadImage = (filename = 'parking-floorplan', format = 'png') => {
      const dataURL = exportAsImage(format, 1.0)
      if (!dataURL) return

      // 創建下載連結
      const link = document.createElement('a')
      link.download = `${filename}.${format}`
      link.href = dataURL
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }

    // 列印平面圖
    const printFloorplan = () => {
      if (!canvas.value) return

      // 取消選擇所有物件
      canvas.value.discardActiveObject()
      canvas.value.renderAll()

      // 創建新視窗用於列印
      const printWindow = window.open('', '_blank')
      const dataURL = exportAsImage('png', 1.0)

      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>車位平面圖 - ${props.floorPlan.name || '平面圖'}</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 1cm;
            }
            body {
              margin: 0;
              padding: 20px;
              font-family: 'Microsoft JhengHei', sans-serif;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .floorplan-image {
              width: 100%;
              max-width: 100%;
              height: auto;
              display: block;
              margin: 0 auto;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            @media print {
              body { print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${props.floorPlan.name || '車位平面圖'}</h1>
            <p>列印時間: ${new Date().toLocaleString('zh-TW')}</p>
          </div>
          <img src="${dataURL}" alt="車位平面圖" class="floorplan-image" />
          <div class="footer">
            <p>© 安喜建設 車位管理系統</p>
          </div>
        </body>
        </html>
      `

      printWindow.document.write(printContent)
      printWindow.document.close()

      // 等待圖片載入後列印
      printWindow.addEventListener('load', () => {
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 500)
      })
    }

    // 匯出為 PDF (使用 jsPDF)
    const exportAsPDF = async (filename = 'parking-floorplan') => {
      try {
        // 動態載入 jsPDF
        const { jsPDF } = await import('jspdf')
        
        const dataURL = exportAsImage('jpeg', 0.9)
        if (!dataURL) return

        // 創建 PDF (A4 橫向)
        const pdf = new jsPDF('landscape', 'mm', 'a4')
        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()

        // 添加標題
        pdf.setFontSize(20)
        pdf.text(props.floorPlan.name || '車位平面圖', pageWidth / 2, 20, { align: 'center' })

        // 計算圖片尺寸 (保持長寬比)
        const img = new Image()
        img.onload = () => {
          const imgAspectRatio = img.width / img.height
          const availableWidth = pageWidth - 40 // 左右邊距各 20mm
          const availableHeight = pageHeight - 60 // 上下邊距，留空間給標題和頁腳

          let imgWidth = availableWidth
          let imgHeight = availableWidth / imgAspectRatio

          if (imgHeight > availableHeight) {
            imgHeight = availableHeight
            imgWidth = availableHeight * imgAspectRatio
          }

          const x = (pageWidth - imgWidth) / 2
          const y = 30

          // 添加圖片
          pdf.addImage(dataURL, 'JPEG', x, y, imgWidth, imgHeight)

          // 添加頁腳
          pdf.setFontSize(10)
          pdf.text(`列印時間: ${new Date().toLocaleString('zh-TW')}`, 20, pageHeight - 10)
          pdf.text('© 安喜建設 車位管理系統', pageWidth - 20, pageHeight - 10, { align: 'right' })

          // 儲存 PDF
          pdf.save(`${filename}.pdf`)
        }
        img.src = dataURL
      } catch (error) {
        console.error('匯出 PDF 失敗:', error)
        // 如果 jsPDF 載入失敗，改用圖片下載
        downloadImage(filename, 'png')
      }
    }

    // 導出方法供父組件使用
    return {
      fabricCanvas,
      canvasWidth,
      canvasHeight,
      selectedSpot,
      spotProperties,
      addSpot,
      getSpotLayouts,
      updateSpotProperty,
      closePropertiesPanel,
      deleteSelectedSpot,
      updateStyles,
      exportAsImage,
      downloadImage,
      printFloorplan,
      exportAsPDF,
      // Zoom/Pan 公開方法
      getZoom,
      setZoom,
      zoomIn,
      zoomOut,
      resetZoom,
      fitToScreen,
      zoomToSelection,
      getPan,
      setPan,
      centerContent
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
  justify-content: center;   /* 水平置中畫布 */
  align-items: flex-start;   /* 需要垂直置中可改為 center */
  padding: 10px;

  /* 限制容器最大寬度並在頁面置中 */
   /*max-width: 1280px;*/
  /*m margin: 0 auto;*/

}

.parking-canvas-container canvas {
  border: 1px solid #e0e0e0;
  display: block;
  margin: 0;  
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.center-xy {
  align-items: center;
}

.spot-properties-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 280px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  z-index: 100;
  max-height: calc(100% - 40px);
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
}

.panel-header h4 {
  margin: 0;
  color: #2c3e50;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0.25rem;
}

.btn-close:hover {
  color: #495057;
}

.panel-content {
  padding: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: #2c3e50;
}

.form-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
}

.panel-actions {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8rem;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .spot-properties-panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 320px;
    border-radius: 0;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  }
  
  .spot-properties-panel.show {
    transform: translateX(0);
  }
}
</style>