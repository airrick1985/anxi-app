<template>
  <v-dialog
    v-model="open"
    scrollable
    persistent
    no-click-animation
    :close-on-back="false"
    :attach="'body'"
    :retain-focus="false"
    content-class="image-editor-dialog-content"
    :max-width="isMobile ? '95vw' : '1000px'"
    :fullscreen="isMobile"
  >
    <v-card class="d-flex flex-column" style="overflow: hidden;">
      <!-- 第一排工具列 -->
<!-- 第一排工具列 -->
<v-toolbar flat color="primary" dark density="comfortable" ref="toolbarRef">
  <div class="toolbar-row d-flex flex-wrap align-center">
    <!-- 工具選單 -->
    <v-menu>
      <template #activator="{ props }">
        <v-btn icon v-bind="props"><v-icon>mdi-wrench</v-icon></v-btn>
      </template>
      <v-list dense>
        <v-list-item
          v-for="t in tools"
          :key="t.tool"
          @click="t.isEmoji ? selectEmoji(t.tool) : selectTool(t.tool)"
        >
          <v-list-item-title>
            <v-icon :color="currentTool === t.tool ? 'yellow lighten-3' : ''" class="mr-2">{{ t.icon }}</v-icon>
            {{ t.name }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <!-- 🔥 獨立刪除物件工具按鈕 -->
    <v-btn icon @click="selectTool('removeOne')" :title="'橡皮擦（刪除物件）'">
  <v-icon :color="currentTool === 'removeOne' ? 'yellow lighten-3' : ''">mdi-eraser</v-icon>
</v-btn>



    <!-- 刪除選單 -->
    <v-menu>
      <template #activator="{ props }">
        <v-btn icon v-bind="props"><v-icon>mdi-delete</v-icon></v-btn>
      </template>
      <v-list dense>
        <v-list-item @click="clearSelected">
          <v-list-item-title>清除選取物件</v-list-item-title>
        </v-list-item>
        <v-list-item @click="clearAllObjects">
          <v-list-item-title>清除所有物件</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <!-- Undo -->
    <v-btn icon @click="undo">
      <v-icon>mdi-undo</v-icon>
    </v-btn>
  </div>
</v-toolbar>

<!-- 第二排工具列 -->
<v-toolbar flat color="primary" dark density="comfortable">
  <div class="toolbar-row d-flex flex-wrap align-center w-100">
    <!-- 顏色選擇 -->
    <v-menu>
      <template #activator="{ props }">
        <v-btn icon v-bind="props"><v-icon>mdi-palette</v-icon></v-btn>
      </template>
      <v-color-picker
        v-model="strokeColor"
        hide-inputs
        hide-mode-switch
        style="max-width: 250px"
      />
    </v-menu>

    <!-- 筆刷粗細 -->
    <v-slider
      v-model="strokeWidth"
      min="1"
      max="20"
      step="1"
      class="mx-3"
      style="max-width:120px"
      hide-details
      track-color="white"
      track-fill-color="white"
      thumb-color="white"
    />

    <v-spacer></v-spacer>

    <!-- 操作按鈕靠右 -->
    <v-btn text @click="$emit('cancel')">取消</v-btn>
    <v-btn text @click="exportImage">確定</v-btn>
  </div>
</v-toolbar>


      <!-- 編輯畫布 -->
      <div class="editor-wrapper" ref="editorWrapperRef">
        <canvas ref="canvasEl" class="editor-canvas" />
      </div>
    </v-card>
  </v-dialog>
</template>


<script setup lang="js">
import { ref, onMounted, nextTick, watch, onUnmounted, computed } from 'vue'
import { fabric } from 'fabric'
import { compressToFile } from '@/utils/canvasCompress';

const props = defineProps(['file', 'modelValue'])
const emit = defineEmits(['update:modelValue', 'done', 'cancel'])

const open = ref(props.modelValue)
watch(() => props.modelValue, v => (open.value = v))
watch(open, v => emit('update:modelValue', v))

const canvasEl = ref(null)
let canvas = null
const strokeColor = ref('#f00')
strokeColor.value = '#f00'
const strokeWidth = ref(3)
const currentTool = ref(null)
let startX = 0
let startY = 0
let tempObject = null

const toolbarRef = ref(null)
const editorWrapperRef = ref(null)

const isMobile = computed(() => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768
  }
  return false
})

const tools = [
  { name: '矩形', icon: 'mdi-rectangle-outline', tool: 'rect' },
  { name: '圓形', icon: 'mdi-circle-outline', tool: 'circle' },
  { name: '直線', icon: 'mdi-minus', tool: 'line' },
  { name: '畫筆', icon: 'mdi-pencil', tool: 'pencil' },
  { name: '文字', icon: 'mdi-format-text', tool: 'text' },
  { name: '箭頭', icon: 'mdi-arrow-right-bold', tool: '➡︎', isEmoji: true }
]

const selectedEmoji = ref(null)
function selectEmoji(emoji) {
  selectedEmoji.value = emoji
  currentTool.value = 'emoji'
  updateCursor()
}

function selectTool(tool) {
  const activeObj = canvas?.getActiveObject()
  if (activeObj && activeObj.type === 'i-text' && activeObj.isEditing) return
  document.activeElement?.blur()

  if (canvas) {
    canvas.isDrawingMode = tool === 'pencil'
    if (tool === 'pencil') {
      canvas.freeDrawingBrush.color = strokeColor.value
      canvas.freeDrawingBrush.width = parseInt(strokeWidth.value, 10)
    }
  }
  currentTool.value = tool
  updateCursor()
}

function updateCursor() {
  if (!canvasEl.value) return
  const cursorMap = {
    rect: 'crosshair',
    circle: 'crosshair',
    line: 'crosshair',
    pencil: 'url("https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.4/svgs/solid/pen.svg") 2 32, auto',
    text: 'text',
    emoji: 'crosshair'
  }
  canvasEl.value.style.cursor = cursorMap[currentTool.value] || 'default'
}


watch(strokeColor, (newColor) => {
  if (canvas && currentTool.value === 'pencil') {
    canvas.freeDrawingBrush.color = newColor
  }

  const activeObj = canvas?.getActiveObject()
  if (activeObj && activeObj.set && activeObj.type !== 'image') {
    activeObj.set('stroke', newColor)
    canvas.renderAll()
  }
})

watch(strokeWidth, (newWidth) => {
  if (canvas && currentTool.value === 'pencil') {
    canvas.freeDrawingBrush.width = parseInt(newWidth, 10)
  }

  const activeObj = canvas?.getActiveObject()
  if (activeObj && activeObj.set && activeObj.type !== 'image') {
    activeObj.set('strokeWidth', parseInt(newWidth, 10))
    canvas.renderAll()
  }
})


function resizeCanvasAndBackground() {
  if (!canvas || !canvas.backgroundImage || !editorWrapperRef.value) return
  const fabricImage = canvas.backgroundImage
  const imageOriginalWidth = fabricImage.width
  const imageOriginalHeight = fabricImage.height
  const wrapper = editorWrapperRef.value
  const availableWidth = wrapper.clientWidth
  const availableHeight = wrapper.clientHeight
  const scaleX = availableWidth / imageOriginalWidth
  const scaleY = availableHeight / imageOriginalHeight
  const scale = Math.min(scaleX, scaleY)
  const newCanvasWidth = imageOriginalWidth * scale
  const newCanvasHeight = imageOriginalHeight * scale
  canvas.setWidth(newCanvasWidth)
  canvas.setHeight(newCanvasHeight)
  fabricImage.scale(scale)
  canvas.renderAll()
}

onMounted(() => nextTick(initCanvas))

function initCanvas() {
  if (canvas) {
    canvas.dispose()
    canvas = null
  }
  canvas = new fabric.Canvas(canvasEl.value, { 
    selection: true,
    fireRightClick: true,  
    stopContextMenu: true  
  })
  canvas.upperCanvasEl.removeAttribute('tabindex')
  const url = URL.createObjectURL(props.file)
  fabric.Image.fromURL(url, (img) => {
    img.set({ selectable: false, evented: false })
    canvas.setBackgroundImage(img, () => {
      nextTick(() => resizeCanvasAndBackground())
      canvas.renderAll()
    })
  }, { crossOrigin: 'anonymous' })
  watch(open, (isOpen) => {
    if (isOpen) {
      nextTick(() => resizeCanvasAndBackground())
    }
  })
  let resizeObserver = null
  onMounted(() => {
    if (editorWrapperRef.value) {
      resizeObserver = new ResizeObserver(() => resizeCanvasAndBackground())
      resizeObserver.observe(editorWrapperRef.value)
    }
  })
  onUnmounted(() => {
    if (canvas) {
      canvas.dispose()
      canvas = null
    }
    if (resizeObserver && editorWrapperRef.value) {
      resizeObserver.unobserve(editorWrapperRef.value)
    }
    if (resizeObserver) {
      resizeObserver.disconnect()
    }
  })
  const originalEnterEditing = fabric.IText.prototype.enterEditing
  fabric.IText.prototype.enterEditing = function(e) {
    const result = originalEnterEditing.call(this, e)
    if (this.hiddenTextarea) {
      this.hiddenTextarea.style.zIndex = '9999'
      setTimeout(() => this.hiddenTextarea.focus(), 50)
    }
    return result
  }
  canvas.on('mouse:dblclick', function(e) {
    if (e.target && e.target.type === 'i-text') {
      if (e.e) e.e.stopPropagation()
      document.activeElement?.blur()
      e.target.enterEditing()
      canvas.renderAll()
    }
  })
  canvas.on('mouse:down', e => {
    if (currentTool.value === 'removeOne') {
  if (e.target && e.target !== canvas.backgroundImage) {
    canvas.remove(e.target);
    canvas.renderAll();
    //currentTool.value = null;
    toast.success('已刪除選取物件');
  }
  return;
}


    if (currentTool.value === 'emoji' && selectedEmoji.value) {
      if (e.e) e.e.stopPropagation()
      const pointer = canvas.getPointer(e.e)
      const fontSize = selectedEmoji.value === '➡︎' ? 120 : 60

const t = new fabric.IText(selectedEmoji.value, {
  left: pointer.x,
  top: pointer.y,
  fill: strokeColor.value,
  fontSize,
  editable: true,
  selectable: true
})

      canvas.add(t).setActiveObject(t)
      canvas.renderAll()
      selectedEmoji.value = null
      currentTool.value = null
      return
    }
    if (currentTool.value === 'text') {
      if (e.e) e.e.stopPropagation()
      const pointer = canvas.getPointer(e.e)
      const t = new fabric.IText('請輸入文字', {
        left: pointer.x,
        top: pointer.y,
        fill: strokeColor.value,
        fontSize: 36,
        editable: true,
        selectable: true
      })
      canvas.add(t).setActiveObject(t)
      document.activeElement?.blur()
      setTimeout(() => {
        t.enterEditing()
        canvas.renderAll()
      }, 100)
      currentTool.value = null
      return
    }
    if (!currentTool.value || currentTool.value === 'pencil') return
    const pointer = canvas.getPointer(e.e)
    startX = pointer.x
    startY = pointer.y
    switch (currentTool.value) {
      case 'rect':
        tempObject = new fabric.Rect({
          left: startX,
          top: startY,
          width: 1,
          height: 1,
          stroke: strokeColor.value,
          strokeWidth: strokeWidth.value,
          fill: 'transparent'
        })
        break
      case 'circle':
        tempObject = new fabric.Ellipse({
          left: startX,
          top: startY,
          rx: 1,
          ry: 1,
          stroke: strokeColor.value,
          strokeWidth: strokeWidth.value,
          fill: 'transparent'
        })
        break
      case 'line':
        tempObject = new fabric.Line([startX, startY, startX, startY], {
          stroke: strokeColor.value,
          strokeWidth: strokeWidth.value
        })
        break
    }
    canvas.add(tempObject)
  })
  canvas.on('mouse:move', e => {
    if (!tempObject) return
    const pointer = canvas.getPointer(e.e)
    const w = pointer.x - startX
    const h = pointer.y - startY
    if (tempObject.type === 'rect') {
      tempObject.set({ width: Math.abs(w), height: Math.abs(h), left: w < 0 ? pointer.x : startX, top: h < 0 ? pointer.y : startY })
    } else if (tempObject.type === 'ellipse') {
      tempObject.set({ rx: Math.abs(w) / 2, ry: Math.abs(h) / 2, left: Math.min(startX, pointer.x), top: Math.min(startY, pointer.y) })
    } else if (tempObject.type === 'line') {
      tempObject.set({ x2: pointer.x, y2: pointer.y })
    }
    canvas.renderAll()
  })
  canvas.on('mouse:up', () => {
    tempObject = null
    //if (currentTool.value !== 'pencil') currentTool.value = null
  })
  canvas.on('text:editing:exited', function(e) {})
}

const historyStack = ref([])

function pushHistory() {
  if (canvas) {
    historyStack.value.push(JSON.stringify(canvas.toDatalessJSON()))
    if (historyStack.value.length > 20) historyStack.value.shift()
  }
}

function undo() {
  if (!canvas || historyStack.value.length === 0) return
  const lastState = historyStack.value.pop()
  canvas.loadFromJSON(lastState, () => canvas.renderAll())
}

function clearSelected() {
  const activeObject = canvas?.getActiveObject()
  if (activeObject) {
    pushHistory()
    canvas.remove(activeObject)
    canvas.renderAll()
  }
}

function clearAllObjects() {
  if (!canvas) return
  pushHistory()
  canvas.getObjects().forEach(obj => {
    if (obj !== canvas.backgroundImage) canvas.remove(obj)
  })
  canvas.renderAll()
}

// 鍵盤刪除快捷鍵
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

function handleKeydown(e) {
  // Ctrl+Z 或 Cmd+Z 執行 Undo
  const isUndo = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z'
  if (isUndo) {
    e.preventDefault()
    undo()
    return
  }

  // Delete 鍵刪除選取物件
  if (e.key === 'Delete' && canvas?.getActiveObject()) {
    e.preventDefault()
    clearSelected()
  }
}

async function exportImage() {
  if (!canvas) return

  canvas.discardActiveObject().renderAll()
  await new Promise(resolve => setTimeout(resolve, 50))

  const dataURL = canvas.toDataURL({ format: 'image/jpeg', quality: 0.92 })
  const blob = await (await fetch(dataURL)).blob()

  // ✅ 轉成 File 才能傳給 compressToFile
  const originalFile = new File([blob], props.file?.name || 'annotated.jpg', { type: 'image/jpeg' })

  // ✅ 傳入正確類型
  const compressed = await compressToFile(originalFile, 1024, 0.85); // ✅ 修正傳參數方式
console.log('[📤 emit] done:', compressed); // ✅ debug 訊息
emit('done', compressed);
open.value = false;
}

</script>

<style scoped>
.editor-wrapper {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: auto;
  min-height: 0;
  background-color: #f0f0f0;
  padding: 10px;
}
.editor-canvas {
  box-shadow: 0 0 5px rgba(0,0,0,0.2);
}
:global(.image-editor-dialog-content) {
  margin: 0 !important;
  height: 100% !important;
  max-height: 100% !important;
  overflow-y: hidden;
}
:global(.image-editor-dialog-content > .v-card) {
  height: 100%;
  border-radius: 0 !important;
}

.toolbar-row {
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

</style>
