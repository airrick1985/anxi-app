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
    <v-card class="d-flex flex-column" style="overflow: hidden; position: relative;">
      
      <!-- 操作按鈕放右上角 -->
      <div style="position: absolute; top: 8px; right: 8px; z-index: 10;">
        <v-btn icon @click="$emit('cancel')">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-btn icon color="primary" @click="exportImage">
          <v-icon>mdi-check</v-icon>
        </v-btn>
      </div>

      <!-- 編輯畫布 -->
      <div class="editor-wrapper" ref="editorWrapperRef">
        <canvas ref="canvasEl" class="editor-canvas" />
      </div>

      <!-- 工具列重新佈局 -->
      <v-toolbar
        flat
        color="primary"
        dark
        density="compact"
        class="editor-toolbar-bottom"
      >
        <div class="toolbar-row d-flex align-center flex-wrap w-100">
          <!-- 區塊1: 操作 (復原/重做) -->
          <v-btn icon density="compact" @click="undo" :disabled="history.length === 0" title="復原">
            <v-icon small>mdi-undo</v-icon>
          </v-btn>
          <v-btn icon density="compact" @click="redo" :disabled="redoStack.length === 0" title="重做">
            <v-icon small>mdi-redo</v-icon>
          </v-btn>

          <v-divider vertical class="mx-2" />

          <!-- 區塊2: 主要工具 -->
          <v-menu>
            <template #activator="{ props }">
              <v-btn icon density="compact" v-bind="props" title="形狀工具">
                <v-icon small>mdi-shape-outline</v-icon>
              </v-btn>
            </template>
            <v-list dense>
              <v-list-item
                v-for="t in shapeTools"
                :key="t.tool"
                @click="selectTool(t.tool)"
              >
                <v-list-item-title>
                  <v-icon small :color="currentTool === t.tool ? 'yellow lighten-3' : ''" class="mr-2">
                    {{ t.icon }}
                  </v-icon>
                  {{ t.name }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <v-btn icon density="compact" @click="selectTool('pencil')" title="畫筆">
            <v-icon small :color="currentTool === 'pencil' ? strokeColor : ''">mdi-pencil</v-icon>
          </v-btn>
          <v-btn icon density="compact" @click="selectTool('text')" title="文字">
            <v-icon small :color="currentTool === 'text' ? 'yellow lighten-3' : ''">mdi-format-text</v-icon>
          </v-btn>
           <v-btn icon density="compact" @click="selectTool('removeOne')" :title="'橡皮擦（刪除物件）'">
            <v-icon small :color="currentTool === 'removeOne' ? 'yellow lighten-3' : ''">mdi-eraser</v-icon>
          </v-btn>

          <v-divider vertical class="mx-2" />
          
          <!-- 區塊3: 屬性調整 -->
          <v-menu>
            <template #activator="{ props }">
              <v-btn icon density="compact" v-bind="props" title="顏色">
                <v-icon small :color="strokeColor">mdi-palette</v-icon>
              </v-btn>
            </template>
            <v-color-picker
              v-model="strokeColor"
              hide-inputs
              hide-mode-switch
              style="max-width: 250px"
            />
          </v-menu>

          <v-menu>
            <template #activator="{ props }">
              <v-btn icon density="compact" v-bind="props" title="畫筆粗細">
                <v-icon small>mdi-format-line-weight</v-icon>
              </v-btn>
            </template>
            <div class="custom-slider-popup">
              <span class="text-caption text-white">筆刷粗細：{{ strokeWidth }}</span>
              <v-slider
                v-model="strokeWidth"
                min="1"
                max="30"
                step="1"
                hide-details
                density="compact"
                track-color="white"
                track-fill-color="white"
                thumb-color="white"
              />
            </div>
          </v-menu>

          <v-menu v-if="isTextTargetSelected">
            <template #activator="{ props }">
              <v-btn icon density="compact" v-bind="props" title="字型大小">
                <v-icon small>mdi-format-font-size-increase</v-icon>
              </v-btn>
            </template>
            <div class="custom-slider-popup">
              <span class="text-caption text-white">字型大小：{{ fontSize }}</span>
              <v-slider
                v-model="fontSize"
                min="12"
                max="120"
                step="1"
                hide-details
                density="compact"
                track-color="white"
                track-fill-color="white"
                thumb-color="white"
              />
            </div>
          </v-menu>

          <v-spacer></v-spacer>

          <v-menu>
            <template #activator="{ props }">
              <v-btn icon density="compact" v-bind="props" title="清除">
                <v-icon small>mdi-delete</v-icon>
              </v-btn>
            </template>
            <v-list dense>
              <v-list-item @click="clearSelected">
                <v-list-item-title>清除選取</v-list-item-title>
              </v-list-item>
              <v-list-item @click="clearAllObjects">
                <v-list-item-title>全部清空</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </v-toolbar>
    </v-card>
  </v-dialog>
</template>

<script setup lang="js">
import { ref, onMounted, nextTick, watch, onUnmounted, computed } from 'vue'
import { fabric } from 'fabric'
import { compressToFile } from '@/utils/canvasCompress';

const history = ref([]);
const redoStack = ref([]);
let historyLock = false;

const isPanning = ref(false);

const props = defineProps(['file', 'modelValue'])
const emit = defineEmits(['update:modelValue', 'done', 'cancel'])

const open = ref(props.modelValue)
watch(() => props.modelValue, v => (open.value = v))
watch(open, v => emit('update:modelValue', v))

const canvasEl = ref(null)
let canvas = null
const strokeColor = ref('#f00')
const strokeWidth = ref(5)
const fontSize = ref(48)
const currentTool = ref(null)
const activeObjectType = ref(null)
let startX = 0
let startY = 0
let tempObject = null

const editorWrapperRef = ref(null)

const isMobile = computed(() => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768
  }
  return false
})

const shapeTools = [
  { name: '矩形', icon: 'mdi-rectangle-outline', tool: 'rect' },
  { name: '圓形', icon: 'mdi-circle-outline', tool: 'circle' },
  { name: '直線', icon: 'mdi-minus', tool: 'line' },
  { name: '箭頭', icon: 'mdi-arrow-right-thin', tool: 'arrow' },
]

const isTextTargetSelected = computed(() => {
  return currentTool.value === 'text' || activeObjectType.value === 'i-text';
});

watch(() => props.modelValue, (isOpen) => {
  if (isOpen && props.file) {
    nextTick(initCanvas);
  }
});

function selectTool(tool) {
  const activeObj = canvas?.getActiveObject();
  if (activeObj && activeObj.type === 'i-text' && activeObj.isEditing) return;
  document.activeElement?.blur();

  currentTool.value = tool;

  if (canvas) {
    canvas.isDrawingMode = tool === 'pencil';
    if (tool === 'pencil') {
      canvas.freeDrawingBrush.color = strokeColor.value;
      canvas.freeDrawingBrush.width = parseInt(strokeWidth.value, 10);
    }
    canvas.selection = !['pencil', 'removeOne'].includes(tool);
    canvas.defaultCursor = 'default';
    canvas.forEachObject(obj => {
      obj.selectable = true;
      obj.evented = true;
    });
    updateCursor();
  }
}

function updateCursor() {
  if (!canvas) return;

  const pencilSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24'><path fill='rgba(255,255,255,0.9)' stroke='rgba(0,0,0,0.8)' stroke-width='1' d='M17.8,2.8L21.2,6.2L7,20.4l-4.2,1.4l1.4-4.2L17.8,2.8z M20.5,3.5l-2.1,2.1l-2.8-2.8l2.1-2.1C18.1,0.3,18.8,0,19.5,0s1.4,0.3,1.9,0.8C21.9,2.1,21.9,3.1,20.5,3.5z'/><path fill='rgba(0,0,0,0.5)' d='M17.1,4.2L5.6,15.7l-1.4,4.2l4.2-1.4L19.9,7L17.1,4.2z'/></svg>`;
  const eraserSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24'><path fill='rgba(255,255,255,0.9)' stroke='rgba(0,0,0,0.8)' stroke-width='1' d='M7.2,20.7l13.5-13.5c1-1,1-2.6,0-3.5l-2.1-2.1c-1-1-2.6-1-3.5,0L1.5,15.1v5.6H7.2z M18.4,4.9l2.1,2.1c0.2,0.2,0.2,0.5,0,0.7l-1,1l-2.8-2.8l1-1C17.9,4.7,18.2,4.7,18.4,4.9z M2.9,16.5l11-11l2.8,2.8l-11,11H2.9V16.5z'/></svg>`;

  const cursorMap = {
    rect: 'crosshair',
    circle: 'crosshair',
    line: 'crosshair',
    arrow: 'crosshair',
    text: 'text',
    pencil: `url("data:image/svg+xml;base64,${btoa(pencilSvg)}") 4 24, crosshair`,
    removeOne: `url("data:image/svg+xml;base64,${btoa(eraserSvg)}") 4 4, crosshair`,
  };

  const newCursor = cursorMap[currentTool.value] || 'default';

  canvas.defaultCursor = newCursor;
  if (currentTool.value === 'pencil') {
    canvas.freeDrawingCursor = newCursor;
  }
  canvas.setCursor(canvas.defaultCursor);
}

function undo() {
  if (history.value.length > 0) {
    historyLock = true;
    const lastState = history.value.pop();
    redoStack.value.push(canvas.toJSON());
    canvas.loadFromJSON(lastState, () => {
      canvas.renderAll();
      historyLock = false;
    });
  }
}

function redo() {
  if (redoStack.value.length > 0) {
    historyLock = true;
    const nextState = redoStack.value.pop();
    history.value.push(canvas.toJSON());
    canvas.loadFromJSON(nextState, () => {
      canvas.renderAll();
      historyLock = false;
    });
  }
}

function saveState() {
  if (!historyLock) {
    redoStack.value = [];
    history.value.push(canvas.toJSON());
  }
}

watch(strokeColor, (newColor) => {
  if (canvas && currentTool.value === 'pencil') {
    canvas.freeDrawingBrush.color = newColor
  }
  const activeObj = canvas?.getActiveObject()
  if (activeObj && activeObj.set && activeObj.type !== 'image') {
    if (activeObj.type === 'group') {
      activeObj.forEachObject(obj => {
        obj.set('stroke', newColor);
      });
    } else {
      activeObj.set('stroke', newColor);
      activeObj.set('fill', activeObj.type === 'i-text' ? newColor : 'transparent');
    }
    canvas.renderAll();
    saveState();
  }
})

watch(strokeWidth, (newWidth) => {
  const width = parseInt(newWidth, 10);
  if (canvas && currentTool.value === 'pencil') {
    canvas.freeDrawingBrush.width = width;
  }
  const activeObj = canvas?.getActiveObject()
  if (activeObj && activeObj.set && activeObj.type !== 'image') {
    activeObj.set('strokeWidth', width);
    canvas.renderAll();
    saveState();
  }
})

watch(fontSize, (newSize) => {
  const size = parseInt(newSize, 10);
  const activeObj = canvas?.getActiveObject();
  if (!activeObj) return;

  const applyFontSize = (obj) => {
    if (obj.type === 'i-text') {
      obj.set('fontSize', size);
    }
  };

  if (activeObj.type === 'activeSelection') {
    activeObj.forEachObject(applyFontSize);
  } else {
    applyFontSize(activeObj);
  }
  
  canvas.renderAll();
  saveState();
});

function resizeCanvasAndBackground() {
  if (!canvas || !canvas.backgroundImage || !editorWrapperRef.value) return;
  if (canvas.getZoom() !== 1) return;

  const fabricImage = canvas.backgroundImage;
  const wrapper = editorWrapperRef.value;
  const scale = Math.min(wrapper.clientWidth / fabricImage.width, wrapper.clientHeight / fabricImage.height);

  canvas.setWidth(fabricImage.width * scale);
  canvas.setHeight(fabricImage.height * scale);
  fabricImage.scale(scale);
  canvas.renderAll();
}

function initCanvas() {
  if (!canvasEl.value || !props.file) return;
  if (canvas) canvas.dispose();
  
  history.value = [];
  redoStack.value = [];

  canvas = new fabric.Canvas(canvasEl.value, { selection: true, stopContextMenu: true, fireRightClick: true });
  canvas.upperCanvasEl.removeAttribute('tabindex');

  const url = URL.createObjectURL(props.file);
  fabric.Image.fromURL(url, (img) => {
    img.set({ selectable: false, evented: false, hasBorders: false, hasControls: false, hoverCursor: 'default' });
    canvas.setBackgroundImage(img, () => {
      nextTick(() => {
        resizeCanvasAndBackground();
        saveState();
      });
      canvas.renderAll();
    });
  }, { crossOrigin: 'anonymous' });

  canvas.on('mouse:down', (e) => {
    const pointer = canvas.getPointer(e.e);
    if (!pointer || isNaN(pointer.x) || isNaN(pointer.y)) return;
    const target = e.target;

    if (e.e.altKey) {
      isPanning.value = true;
      canvas.setCursor('grab');
      return;
    }

    if (currentTool.value === 'removeOne') {
      if (target && target !== canvas.backgroundImage) canvas.remove(target);
      return;
    }

    if (currentTool.value === 'text') {
      const text = new fabric.IText('', {
        left: pointer.x,
        top: pointer.y,
        fill: strokeColor.value,
        fontSize: fontSize.value,
        editable: true,
        selectable: true,
        padding: 5,
      });
      canvas.add(text).setActiveObject(text);
      text.enterEditing();
      currentTool.value = null;
      return;
    }
    
    if (!currentTool.value || currentTool.value === 'pencil') return;

    startX = pointer.x;
    startY = pointer.y;
    const commonProps = {
      stroke: strokeColor.value,
      strokeWidth: strokeWidth.value,
      fill: 'transparent'
    };

    switch (currentTool.value) {
      case 'rect':
        tempObject = new fabric.Rect({ left: startX, top: startY, width: 1, height: 1, ...commonProps });
        break;
      case 'circle':
        tempObject = new fabric.Ellipse({ left: startX, top: startY, rx: 1, ry: 1, ...commonProps });
        break;
      case 'line':
        tempObject = new fabric.Line([startX, startY, startX, startY], { ...commonProps });
        break;
      case 'arrow':
        tempObject = new fabric.Line([startX, startY, startX, startY], { ...commonProps });
        break;
    }
    if (tempObject) canvas.add(tempObject);
  });

  canvas.on('mouse:move', (e) => {
    if (isPanning.value && e.e) {
      canvas.relativePan(new fabric.Point(e.e.movementX, e.e.movementY));
      return;
    }
    if (!tempObject) return;

    const pointer = canvas.getPointer(e.e);
    const w = pointer.x - startX;
    const h = pointer.y - startY;

    if (tempObject.type === 'rect') {
      tempObject.set({ width: Math.abs(w), height: Math.abs(h), left: w < 0 ? pointer.x : startX, top: h < 0 ? pointer.y : startY });
    } else if (tempObject.type === 'ellipse') {
      tempObject.set({ rx: Math.abs(w) / 2, ry: Math.abs(h) / 2, left: Math.min(startX, pointer.x), top: Math.min(startY, pointer.y) });
    } else if (tempObject.type === 'line' || currentTool.value === 'arrow') {
      tempObject.set({ x2: pointer.x, y2: pointer.y });
    }
    canvas.renderAll();
  });

  canvas.on('mouse:up', (e) => {
    isPanning.value = false;
    canvas.setCursor('default');

    if (tempObject && currentTool.value === 'arrow') {
      const pointer = canvas.getPointer(e.e);
      const from = { x: startX, y: startY };
      const to = { x: pointer.x, y: pointer.y };
      if (from.x !== to.x || from.y !== to.y) {
        const arrow = createArrow(from, to, strokeColor.value, strokeWidth.value);
        canvas.add(arrow);
      }
      canvas.remove(tempObject);
    }

    tempObject = null;
    if (currentTool.value && !['pencil', 'removeOne'].includes(currentTool.value)) {
      currentTool.value = null;
    }
  });
  
  canvas.on({
    'object:added': saveState,
    'object:removed': saveState,
    'object:modified': saveState,
    'selection:created': updateSelection,
    'selection:updated': updateSelection,
    'selection:cleared': updateSelection,
  });
}

let resizeObserver = null;
onMounted(() => {
  if (editorWrapperRef.value) {
    resizeObserver = new ResizeObserver(() => resizeCanvasAndBackground());
    resizeObserver.observe(editorWrapperRef.value);
  }
  window.addEventListener('keydown', handleKeydown);
});
onUnmounted(() => {
  if (canvas) canvas.dispose();
  if (resizeObserver && editorWrapperRef.value) resizeObserver.unobserve(editorWrapperRef.value);
  if (resizeObserver) resizeObserver.disconnect();
  window.removeEventListener('keydown', handleKeydown);
});


function updateSelection(e) {
  const target = e.target || canvas.getActiveObject();
  if (!target) {
    activeObjectType.value = null;
    return;
  }

  let textObject = null;
  
  if (target.type === 'activeSelection') {
    const textObjects = target.getObjects().filter(obj => obj.type === 'i-text');
    if (textObjects.length > 0) {
      activeObjectType.value = 'i-text';
      textObject = textObjects[0];
    } else {
      activeObjectType.value = 'other';
    }
  } else {
    activeObjectType.value = target.type;
    if (target.type === 'i-text') {
      textObject = target;
    }
  }

  if (textObject) {
    fontSize.value = textObject.fontSize;
  }
}


function createArrow(from, to, color, width) {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const headLength = width * 4;

    const line = new fabric.Line([from.x, from.y, to.x, to.y], {
      stroke: color,
      strokeWidth: width,
    });

    const arrowhead = new fabric.Triangle({
      left: to.x,
      top: to.y,
      originX: 'center',
      originY: 'center',
      width: headLength,
      height: headLength,
      fill: color,
      angle: angle * (180 / Math.PI) + 90,
    });

    return new fabric.Group([line, arrowhead], {
      selectable: true,
      evented: true,
    });
}

function clearAllObjects() {
  if (!canvas) return;
  canvas.getObjects().forEach(obj => canvas.remove(obj));
  canvas.renderAll();
}

function clearSelected() {
  if (!canvas) return;
  const activeObjects = canvas.getActiveObjects();
  if (!activeObjects.length) return;
  activeObjects.forEach(obj => canvas.remove(obj));
  canvas.discardActiveObject().renderAll();
}

function handleKeydown(e) {
  if ((e.key === 'Delete' || e.key === 'Backspace')) {
    const activeObject = canvas?.getActiveObject();

    if (activeObject && !activeObject.isEditing) {
      e.preventDefault();
      clearSelected();
    }
  }
}

async function exportImage() {
  if (!canvas) return;
  canvas.discardActiveObject().renderAll();
  await new Promise(resolve => setTimeout(resolve, 50));
  const dataURL = canvas.toDataURL({ format: 'image/jpeg', quality: 0.92 });
  const blob = await (await fetch(dataURL)).blob();
  const originalFile = new File([blob], props.file?.name || 'annotated.jpg', { type: 'image/jpeg' });
  const compressed = await compressToFile(originalFile, 1024, 0.85);
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
  overflow: hidden;
  min-height: 0;
  background-color: #333;
}

.editor-canvas {
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
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
  gap: 4px;
  flex-wrap: nowrap;
  align-items: center;
  width: 100%;
  overflow-x: auto;
}

.custom-slider-popup {
  background-color: rgba(0, 0, 0, 0.7);
  padding: 12px;
  border-radius: 8px;
  width: 200px;
}

/* ✅ 修改此處以適應手機安全區域 */
:deep(.editor-toolbar-bottom) {
  padding-left: 12px !important;
  padding-right: 12px !important;
  padding-top: 6px !important;
  /* 使用 CSS 變數 env(safe-area-inset-bottom) 來自動獲取底部安全距離 */
  padding-bottom: calc(6px + env(safe-area-inset-bottom));
  height: auto !important; /* 高度改為自動以容納 padding */
  min-height: 48px !important;
  flex: 0 0 auto;
}
</style>

