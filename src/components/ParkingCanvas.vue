<template>
  <div class="parking-canvas-container">
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
      default: true
    },
    previewMode: {
      type: Boolean,
      default: false
    }
  },
  emits: ['spots-changed', 'canvas-ready'],
  setup(props, { emit }) {
    // Refs
    const fabricCanvas = ref(null)
    const canvas = ref(null)
    const canvasWidth = ref(1200)
    const canvasHeight = ref(800)
    const selectedSpot = ref(null)
    const spotProperties = ref({})
    const spotLayouts = ref([])
    const backgroundImage = ref(null)
    const lastUpdateTime = ref(Date.now())

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
      
      // 設置網格
      updateGrid()
      
      // 載入背景圖片
      if (props.floorPlan.backgroundImageUrl) {
        await loadBackgroundImage(props.floorPlan.backgroundImageUrl)
      }
      
      // 載入車位佈局
      await loadSpotLayouts()
      
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
      canvas.value.on('object:modified', () => {
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
        left: x,
        top: y,
        width: width,
        height: height,
        fill: styles.backgroundColor || '#e8f5e8',
        stroke: styles.borderColor || '#4caf50',
        strokeWidth: 2,
        rx: 4,
        ry: 4,
        selectable: !props.previewMode,
        hasControls: !props.previewMode,
        hasBorders: !props.previewMode
      })

      // 創建文字
      const textObj = new fabric.Text(text || spotId || 'P1', {
        left: x + width / 2,
        top: y + height / 2,
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
        hasBorders: !props.previewMode
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
          if (spot._objects && spot._objects[1]) {
            spot._objects[1].set('left', value / 2)
          }
          break
        case 'height':
          spot.set('height', value)
          if (spot._objects && spot._objects[0]) {
            spot._objects[0].set('height', value)
          }
          if (spot._objects && spot._objects[1]) {
            spot._objects[1].set('top', value / 2)
          }
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

    // 更新網格
    const updateGrid = () => {
      if (!canvas.value) return

      // 清除現有網格
      const gridObjects = canvas.value.getObjects().filter(obj => obj.type === 'gridLine')
      gridObjects.forEach(obj => canvas.value.remove(obj))

      if (!props.showGrid) {
        canvas.value.renderAll()
        return
      }

      const gridSize = 20
      const width = canvasWidth.value
      const height = canvasHeight.value

      // 垂直線
      for (let i = 0; i <= width; i += gridSize) {
        const line = new fabric.Line([i, 0, i, height], {
          stroke: '#e0e0e0',
          strokeWidth: 1,
          selectable: false,
          evented: false,
          type: 'gridLine'
        })
        canvas.value.add(line)
        canvas.value.sendToBack(line)
      }

      // 水平線
      for (let i = 0; i <= height; i += gridSize) {
        const line = new fabric.Line([0, i, width, i], {
          stroke: '#e0e0e0',
          strokeWidth: 1,
          selectable: false,
          evented: false,
          type: 'gridLine'
        })
        canvas.value.add(line)
        canvas.value.sendToBack(line)
      }

      canvas.value.renderAll()
    }

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

      updateGrid()
    }

    // 監聽屬性變化
    watch(() => props.floorPlan, (newPlan, oldPlan) => {
      if (newPlan && oldPlan && newPlan.id !== oldPlan.id) {
        console.log('Floor plan changed, re-initializing canvas...');
        initCanvas();
      }
    }, { deep: true });

    watch(() => props.showGrid, updateGrid)
    
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

    // 生命週期
    onMounted(async () => {
      await nextTick()
      await initCanvas()
      
      // 監聽視窗大小變化
      window.addEventListener('resize', resizeCanvas)
      
      // 初始化時調整一次尺寸
      setTimeout(resizeCanvas, 100)
    })

    onUnmounted(() => {
      if (canvas.value) {
        canvas.value.dispose()
      }
      window.removeEventListener('resize', resizeCanvas)
    })

    // 更新樣式
    const updateStyles = (styles) => {
      console.log('更新樣式:', styles)
      // 這裡可以根據需要更新 Canvas 中的樣式
      // 例如更新網格、預設車位樣式等
      if (styles.gridSettings) {
        // 更新網格設定
        updateGrid()
      }
      
      canvas.value.renderAll()
    }

    // 匯出為圖片
    const exportAsImage = (format = 'png', quality = 1.0) => {
      if (!canvas.value) return null

      // 取消選擇所有物件以避免控制點出現在匯出圖片中
      canvas.value.discardActiveObject()
      canvas.value.renderAll()

      // 匯出為 Data URL
      const dataURL = canvas.value.toDataURL({
        format: format,
        quality: quality,
        multiplier: 2 // 提高解析度
      })

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
      exportAsPDF
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
}

.parking-canvas-container canvas {
  border: 1px solid #e0e0e0;
  display: block;
  margin: 10px auto;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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