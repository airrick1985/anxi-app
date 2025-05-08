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
    <v-menu>
  <template #activator="{ props }">
    <v-btn icon v-bind="props" :title="'畫筆粗細'">
      <v-icon>mdi-pencil</v-icon>
    </v-btn>
  </template>
  <div class="custom-slider-popup">
    <span class="text-caption text-white">筆刷粗細：{{ strokeWidth }}</span>
    <v-slider
      v-model="strokeWidth"
      min="1"
      max="20"
      step="1"
      hide-details
      density="compact"
      track-color="white"
      track-fill-color="white"
      thumb-color="white"
    />
  </div>
</v-menu>

  <v-menu>
  <template #activator="{ props }">
    <v-btn icon v-bind="props" :title="'縮放畫布'">
      <v-icon>mdi-magnify-plus</v-icon>
    </v-btn>
  </template>
  <div class="custom-slider-popup">
    <span class="text-caption text-white">縮放：x{{ canvasZoom.toFixed(1) }}</span>
    <v-slider
      v-model="canvasZoom"
      :min="1"
      :max="3"
      :step="0.1"
      hide-details
      density="compact"
      track-color="white"
      track-fill-color="white"
      thumb-color="white"
      @update:model-value="updateZoom"
    />
  </div>
</v-menu>

<span class="text-white">x{{ canvasZoom.toFixed(1) }}</span>

<v-btn icon @click="selectTool('move')" :title="'移動畫布'">
  <v-icon :color="currentTool === 'move' ? 'yellow lighten-3' : ''">mdi-hand-back-left</v-icon>
</v-btn>

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

const isPanning = ref(false); // 是否正在拖動畫布

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
  if (!canvas || !canvas.backgroundImage || !editorWrapperRef.value) return;

  // ✅ 若使用者已手動調整 zoom，則不自動 resize（保留畫面狀態）
  if (canvas.getZoom() !== 1) return;

  const fabricImage = canvas.backgroundImage;
  const imageOriginalWidth = fabricImage.width;
  const imageOriginalHeight = fabricImage.height;
  const wrapper = editorWrapperRef.value;
  const availableWidth = wrapper.clientWidth;
  const availableHeight = wrapper.clientHeight;
  const scaleX = availableWidth / imageOriginalWidth;
  const scaleY = availableHeight / imageOriginalHeight;
  const scale = Math.min(scaleX, scaleY);

  const newCanvasWidth = imageOriginalWidth * scale;
  const newCanvasHeight = imageOriginalHeight * scale;

  canvas.setWidth(newCanvasWidth);
  canvas.setHeight(newCanvasHeight);
  fabricImage.scale(scale);
  canvas.renderAll();
}


onMounted(() => nextTick(initCanvas))

function initCanvas() {
  if (canvas) {
    canvas.dispose();
    canvas = null;
  }

  canvas = new fabric.Canvas(canvasEl.value, {
    selection: true,
    fireRightClick: true,
    stopContextMenu: true
  });

  canvas.upperCanvasEl.removeAttribute('tabindex');

  const url = URL.createObjectURL(props.file);
  fabric.Image.fromURL(url, (img) => {
    img.set({
  selectable: false,
  evented: false,
  hasBorders: false,
  hasControls: false,
  hoverCursor: 'default'
});

    canvas.setBackgroundImage(img, () => {
      nextTick(() => resizeCanvasAndBackground());
      canvas.renderAll();
    });
  }, { crossOrigin: 'anonymous' });

  // ResizeObserver
  let resizeObserver = null;
  onMounted(() => {
    if (editorWrapperRef.value) {
      resizeObserver = new ResizeObserver(() => resizeCanvasAndBackground());
      resizeObserver.observe(editorWrapperRef.value);
    }
  });
  onUnmounted(() => {
    if (canvas) canvas.dispose();
    if (resizeObserver && editorWrapperRef.value) resizeObserver.unobserve(editorWrapperRef.value);
    if (resizeObserver) resizeObserver.disconnect();
  });

  // 修正文字編輯焦點問題
  const originalEnterEditing = fabric.IText.prototype.enterEditing;
  fabric.IText.prototype.enterEditing = function (e) {
    const result = originalEnterEditing.call(this, e);
    if (this.hiddenTextarea) {
      this.hiddenTextarea.style.zIndex = '9999';
      setTimeout(() => this.hiddenTextarea.focus(), 50);
    }
    return result;
  };

  canvas.on('mouse:down', (e) => {
  const pointer = canvas.getPointer(e.e);

  // ✋【平移模式（手工具 或 Alt 鍵）】
  if (currentTool.value === 'move' || e.e.altKey) {
    isPanning.value = true;
    canvas.setCursor('grab');
    canvas.renderAll();
    return;
  }

  // 🔧【刪除單一物件（橡皮擦工具）】
  if (currentTool.value === 'removeOne') {
    if (
      e.target &&
      e.target !== canvas.backgroundImage &&
      e.target.type !== 'backgroundImage'
    ) {
      canvas.remove(e.target);
      canvas.renderAll();
      toast.success('已刪除選取物件');
    }
    return;
  }

  // 😊【插入 Emoji】
  if (currentTool.value === 'emoji' && selectedEmoji.value) {
    const fontSize = selectedEmoji.value === '➡︎' ? 120 : 60;
    const t = new fabric.IText(selectedEmoji.value, {
      left: pointer.x,
      top: pointer.y,
      fill: strokeColor.value,
      fontSize,
      editable: true,
      selectable: true
    });
    canvas.add(t).setActiveObject(t);
    canvas.renderAll();
    selectedEmoji.value = null;
    currentTool.value = null;
    return;
  }

  // ✍️【插入文字】
  if (currentTool.value === 'text') {
    const t = new fabric.IText('請輸入文字', {
      left: pointer.x,
      top: pointer.y,
      fill: strokeColor.value,
      fontSize: 36,
      editable: true,
      selectable: true
    });
    canvas.add(t).setActiveObject(t);
    document.activeElement?.blur();
    setTimeout(() => {
      t.enterEditing();
      canvas.renderAll();
    }, 100);
    currentTool.value = null;
    return;
  }

  // 🖌️【繪製圖形】
  if (!currentTool.value || currentTool.value === 'pencil') return;

  startX = pointer.x;
  startY = pointer.y;

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
      });
      break;
    case 'circle':
      tempObject = new fabric.Ellipse({
        left: startX,
        top: startY,
        rx: 1,
        ry: 1,
        stroke: strokeColor.value,
        strokeWidth: strokeWidth.value,
        fill: 'transparent'
      });
      break;
    case 'line':
      tempObject = new fabric.Line([startX, startY, startX, startY], {
        stroke: strokeColor.value,
        strokeWidth: strokeWidth.value
      });
      break;
  }

  if (tempObject) canvas.add(tempObject);
});



  // 🖱️ mouse:move
  canvas.on('mouse:move', (e) => {
    // 平移中
    if (isPanning.value && e.e) {
      const delta = new fabric.Point(e.e.movementX, e.e.movementY);
      canvas.relativePan(delta);
      return;
    }

    if (!tempObject) return;

    const pointer = canvas.getPointer(e.e);
    const w = pointer.x - startX;
    const h = pointer.y - startY;

    if (tempObject.type === 'rect') {
      tempObject.set({
        width: Math.abs(w),
        height: Math.abs(h),
        left: w < 0 ? pointer.x : startX,
        top: h < 0 ? pointer.y : startY
      });
    } else if (tempObject.type === 'ellipse') {
      tempObject.set({
        rx: Math.abs(w) / 2,
        ry: Math.abs(h) / 2,
        left: Math.min(startX, pointer.x),
        top: Math.min(startY, pointer.y)
      });
    } else if (tempObject.type === 'line') {
      tempObject.set({ x2: pointer.x, y2: pointer.y });
    }

    canvas.renderAll();
  });

  // 🖱️ mouse:up
  canvas.on('mouse:up', () => {
    tempObject = null;
    isPanning.value = false;
    canvas.setCursor('default');
  });

  // 🔍 滾輪縮放
  canvas.on('mouse:wheel', function (opt) {
    const delta = opt.e.deltaY;
    let zoom = canvas.getZoom();
    zoom *= 0.999 ** delta;
    zoom = Math.max(1, Math.min(3, zoom));
    canvas.setZoom(zoom);
    limitViewportWithinCanvas();
    canvasZoom.value = zoom;
    opt.e.preventDefault();
    opt.e.stopPropagation();
  });

  canvas.on('mouse:move', function (opt) {
  if (isPanning.value && opt.e) {
    const delta = new fabric.Point(opt.e.movementX, opt.e.movementY);
    canvas.relativePan(delta);

    // ⚠️ 限制邊界（防止拖到空白）
    limitViewportWithinCanvas();
  }
});


  // 文字雙擊進入編輯
  canvas.on('mouse:dblclick', function (e) {
    if (e.target && e.target.type === 'i-text') {
      if (e.e) e.e.stopPropagation();
      document.activeElement?.blur();
      e.target.enterEditing();
      canvas.renderAll();
    }
  });


}

function limitViewportWithinCanvas() {
  const zoom = canvas.getZoom();
  const vp = canvas.viewportTransform;

  // 畫布實際尺寸
  const canvasWidth = canvas.getWidth();
  const canvasHeight = canvas.getHeight();

  // 背景圖尺寸（未縮放）
  const bgWidth = canvas.backgroundImage.width * zoom;
  const bgHeight = canvas.backgroundImage.height * zoom;

  // 邊界限制：最遠不能超出畫布太多
  const maxPanX = 0;
  const maxPanY = 0;
  const minPanX = canvasWidth - bgWidth;
  const minPanY = canvasHeight - bgHeight;

  if (vp[4] > maxPanX) vp[4] = maxPanX;
  if (vp[5] > maxPanY) vp[5] = maxPanY;
  if (vp[4] < minPanX) vp[4] = minPanX;
  if (vp[5] < minPanY) vp[5] = minPanY;

  canvas.setViewportTransform(vp);
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

const canvasZoom = ref(1); // 預設倍率為1

function updateZoom(value) {
  if (canvas) {
    canvas.setZoom(value);
    limitViewportWithinCanvas(); // ✅ 保持畫面視角合理
    // 若有位移需求也可以加入 panning 控制
    // canvas.viewportTransform = [value, 0, 0, value, 0, 0];
  }
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


.custom-slider-popup {
  background-color: rgba(0, 0, 0, 0.6); /* 60% 黑底 */
  padding: 12px;
  border-radius: 8px;
  width: 180px;
}

</style>
