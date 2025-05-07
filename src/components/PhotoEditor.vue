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
    <v-toolbar flat color="primary" dark density="comfortable" ref="toolbarRef">
        <!-- 工具欄 -->
        <v-btn icon @click="selectTool('rect')">
          <v-icon :color="currentTool === 'rect' ? 'yellow lighten-3' : ''">mdi-rectangle-outline</v-icon>
        </v-btn>
        <v-btn icon @click="selectTool('circle')">
          <v-icon :color="currentTool === 'circle' ? 'yellow lighten-3' : ''">mdi-circle-outline</v-icon>
        </v-btn>
        <v-btn icon @click="selectTool('line')">
          <v-icon :color="currentTool === 'line' ? 'yellow lighten-3' : ''">mdi-minus</v-icon>
        </v-btn>
        
   
        <v-btn icon @click="selectTool('pencil')">
          <v-icon :color="currentTool === 'pencil' ? 'yellow lighten-3' : ''">mdi-pencil</v-icon>
        </v-btn>

        
        <v-btn icon @click="selectTool('text')">
          <v-icon :color="currentTool === 'text' ? 'yellow lighten-3' : ''">mdi-format-text</v-icon>
        </v-btn>
        <v-menu>
  <template #activator="{ props }">
    <v-btn icon v-bind="props"><v-icon>mdi-emoticon-outline</v-icon></v-btn>
  </template>
  <v-list>
    <v-list-item
      v-for="emoji in ['➡︎','⭥','⚠️','⚡','❌','⭕']"
      :key="emoji"
      @click="selectEmoji(emoji)"
    >
      <v-list-item-title>{{ emoji }}</v-list-item-title>
    </v-list-item>
  </v-list>
</v-menu>

        <v-menu>
          <template #activator="{ props }">
            <v-btn icon v-bind="props"><v-icon>mdi-palette</v-icon></v-btn>
          </template>
          <v-color-picker v-model="strokeColor" hide-inputs hide-mode-switch />
        </v-menu>

        

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
        <v-btn text @click="$emit('cancel')">取消</v-btn>
        <v-btn text @click="exportImage">確定</v-btn>
      </v-toolbar>

      <div class="editor-wrapper" ref="editorWrapperRef">
        <canvas ref="canvasEl" class="editor-canvas" />
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup lang="js">
import { ref, onMounted, nextTick, watch, onUnmounted, computed } from 'vue'
import { fabric } from 'fabric'

const props = defineProps(['file', 'modelValue'])
const emit = defineEmits(['update:modelValue', 'done', 'cancel'])

const open = ref(props.modelValue)
watch(() => props.modelValue, v => (open.value = v))
watch(open, v => emit('update:modelValue', v))

const canvasEl = ref(null)
let canvas = null
const strokeColor = ref('#f00')
const strokeWidth = ref(3)
const currentTool = ref(null)
let startX = 0
let startY = 0
let tempObject = null

const toolbarRef = ref(null) // 引用工具欄
const editorWrapperRef = ref(null) // 引用 editor-wrapper

// 判斷是否為移動設備 (簡易判斷，可根據需求調整)
const isMobile = computed(() => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768; // 例如小於 768px 視為手機
  }
  return false;
});

// 核心：調整 Canvas 尺寸的函數
function resizeCanvasAndBackground() {
  if (!canvas || !canvas.backgroundImage || !editorWrapperRef.value) {
    // console.warn('Resize prerequisites not met:', { canvas, bg: canvas?.backgroundImage, wrapper: editorWrapperRef.value });
    return;
  }

  const fabricImage = canvas.backgroundImage;
  const imageOriginalWidth = fabricImage.width;
  const imageOriginalHeight = fabricImage.height;

  const wrapper = editorWrapperRef.value;
  const availableWidth = wrapper.clientWidth;
  const availableHeight = wrapper.clientHeight;

  if (availableWidth <= 0 || availableHeight <= 0 || imageOriginalWidth <= 0 || imageOriginalHeight <= 0) {
    // console.warn('Cannot resize, invalid dimensions:', { availableWidth, availableHeight, imageOriginalWidth, imageOriginalHeight });
    return;
  }

  // 計算縮放比例以適應容器，保持圖片原始比例
  const scaleX = availableWidth / imageOriginalWidth;
  const scaleY = availableHeight / imageOriginalHeight;
  const scale = Math.min(scaleX, scaleY); // 取較小的縮放比，確保完全可見 (contain)

  const newCanvasWidth = imageOriginalWidth * scale;
  const newCanvasHeight = imageOriginalHeight * scale;

  canvas.setWidth(newCanvasWidth);
  canvas.setHeight(newCanvasHeight);
  fabricImage.scale(scale); // 縮放背景圖

  // 重新定位背景圖使其在 Canvas 中居中 (Fabric.js 通常會自動處理，但以防萬一)
  // canvas.centerObject(fabricImage); // 如果背景圖不是 canvas.backgroundImage，則需要這樣
  // 對於 canvas.backgroundImage，它通常會填滿或根據其 originX/Y 定位

  canvas.renderAll();
  // console.log('Canvas resized:', { newCanvasWidth, newCanvasHeight, scale });
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
  

  
  // 設置背景圖片
  const url = URL.createObjectURL(props.file);
  fabric.Image.fromURL(url, (img) => {
    img.set({ selectable: false, evented: false });
    canvas.setBackgroundImage(img, () => {
      // 背景圖設置完成後，立即調整一次尺寸
      nextTick(() => { // 確保 DOM 元素尺寸已就緒
         resizeCanvasAndBackground();
      });
      canvas.renderAll();
    });
  }, { crossOrigin: 'anonymous' }); // 處理 crossOrigin 問題

// 監聽對話框開啟狀態，開啟時調整尺寸
watch(open, (isOpen) => {
  if (isOpen) {
    nextTick(() => { // 確保對話框和其內容已渲染並可見
      // console.log('Dialog opened, attempting resize.');
      resizeCanvasAndBackground();
    });
  }
});

// 使用 ResizeObserver 監聽 .editor-wrapper 尺寸變化
let resizeObserver = null;
onMounted(() => {
  // nextTick(initCanvas); // initCanvas 會在 open 變化時或首次 modelValue 為 true 時觸發
  if (editorWrapperRef.value) {
    resizeObserver = new ResizeObserver(() => {
      // console.log('Editor wrapper resized by ResizeObserver, attempting canvas resize.');
      resizeCanvasAndBackground();
    });
    resizeObserver.observe(editorWrapperRef.value);
  }
});

onUnmounted(() => {
  if (canvas) {
    canvas.dispose();
    canvas = null;
  }
  if (resizeObserver && editorWrapperRef.value) {
    resizeObserver.unobserve(editorWrapperRef.value);
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});

  
  // 重寫文字編輯處理函數以確保焦點
  const originalEnterEditing = fabric.IText.prototype.enterEditing;
  fabric.IText.prototype.enterEditing = function(e) {
    const result = originalEnterEditing.call(this, e);
    
    if (this.hiddenTextarea) {
      // 設置一個更高的 z-index 確保文字輸入區域在最上層
      this.hiddenTextarea.style.zIndex = '9999';
      

      
      // 強制設置焦點
      setTimeout(() => {
        this.hiddenTextarea.focus();
      }, 50);
    }
    
    return result;
  };

  // 雙擊事件處理
  canvas.on('mouse:dblclick', function(e) {
    if (e.target && e.target.type === 'i-text') {
      // 阻止事件冒泡
      if (e.e) {
       
        e.e.stopPropagation();
      }
      
      // 確保所有其他元素失去焦點
      document.activeElement?.blur();
      
      // 進入編輯模式
      e.target.enterEditing();
      canvas.renderAll();
    }
  });

  // 文字創建處理
  canvas.on('mouse:down', e => {
    if (currentTool.value === 'emoji' && selectedEmoji.value) {
  if (e.e) e.e.stopPropagation();

  const pointer = canvas.getPointer(e.e);
  const t = new fabric.IText(selectedEmoji.value, {
    left: pointer.x,
    top: pointer.y,
    fill: strokeColor.value,
    fontSize: 36,
    editable: true,
    selectable: true
  });

  canvas.add(t).setActiveObject(t);
  canvas.renderAll();

  selectedEmoji.value = null;
  currentTool.value = null;
  return;
}

    if (currentTool.value === 'text') {
      // 阻止事件冒泡
      if (e.e) {
       
        e.e.stopPropagation();
      }
      
      const pointer = canvas.getPointer(e.e);
      const t = new fabric.IText('請輸入文字', {
        left: pointer.x,
        top: pointer.y,
        fill: strokeColor.value,
        fontSize: 24,
        editable: true,
        selectable: true
      });
      
      canvas.add(t).setActiveObject(t);
      
      // 確保所有其他元素失去焦點
      document.activeElement?.blur();
      
      // 延遲進入編輯模式，確保 DOM 已更新
      setTimeout(() => {
        t.enterEditing();
        canvas.renderAll();
      }, 100);
      
      currentTool.value = null;
      return;
    }

    if (!currentTool.value || currentTool.value === 'pencil') return;

    const pointer = canvas.getPointer(e.e);
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
      case 'arrow':
        tempObject = new fabric.Line([startX, startY, startX, startY], {
          stroke: strokeColor.value,
          strokeWidth: strokeWidth.value
        });
        break;
    }
    canvas.add(tempObject);
  });

  // 滑鼠移動事件處理
  canvas.on('mouse:move', e => {
    if (!tempObject) return;
    const pointer = canvas.getPointer(e.e);
    const w = pointer.x - startX;
    const h = pointer.y - startY;

    if (tempObject.type === 'rect') {
      tempObject.set({ width: Math.abs(w), height: Math.abs(h), left: w < 0 ? pointer.x : startX, top: h < 0 ? pointer.y : startY });
    } else if (tempObject.type === 'ellipse') {
      tempObject.set({ rx: Math.abs(w) / 2, ry: Math.abs(h) / 2, left: Math.min(startX, pointer.x), top: Math.min(startY, pointer.y) });
    } else if (tempObject.type === 'line') {
      tempObject.set({ x2: pointer.x, y2: pointer.y });
    }
    canvas.renderAll();
  });

  // 滑鼠放開事件處理
  canvas.on('mouse:up', () => {
    tempObject = null;
    if (currentTool.value !== 'pencil') {
      currentTool.value = null;
    }
  });

  // 文字編輯結束處理
  canvas.on('text:editing:exited', function(e) {
    // 不做任何焦點回到畫布的操作，讓自然焦點流程處理
  });
}

// 修改工具選擇函數
function selectTool(tool) {
  const activeObj = canvas?.getActiveObject();
  if (activeObj && activeObj.type === 'i-text' && activeObj.isEditing) {
    return;
  }
  document.activeElement?.blur();

  if (canvas) {
    canvas.isDrawingMode = tool === 'pencil';
    if (tool === 'pencil') {
      // 配置自由繪製畫筆
      canvas.freeDrawingBrush.color = strokeColor.value;
      canvas.freeDrawingBrush.width = parseInt(strokeWidth.value, 10); // 確保是數字
    }
  }
  currentTool.value = tool;
}

watch(strokeColor, (newColor) => {
  if (canvas && currentTool.value === 'pencil') {
    canvas.freeDrawingBrush.color = newColor;
  }
});

// 監聽粗細變化，如果當前是鉛筆工具，則更新畫筆粗細
watch(strokeWidth, (newWidth) => {
  if (canvas && currentTool.value === 'pencil') {
    canvas.freeDrawingBrush.width = parseInt(newWidth, 10); // 確保是數字
  }
});

// 導出圖片函數
async function exportImage() {
  if (!canvas) return;
  
  // 在導出前，確保所有活動對象被清除
  canvas.discardActiveObject().renderAll();
  
  // 短暫延遲確保 Canvas 已更新
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // 導出圖片
  const dataURL = canvas.toDataURL({ format: 'jpeg', quality: 0.92 });
  const blob = await (await fetch(dataURL)).blob();
  emit('done', new File([blob], props.file.name, { type: 'image/jpeg' }));
  open.value = false;
}

// 添加生命週期鉤子確保正確清理
onUnmounted(() => {
  if (canvas) {
    canvas.dispose();
    canvas = null;
  }
});

const selectedEmoji = ref(null); // 儲存使用者選擇的 emoji

function selectEmoji(emoji) {
  selectedEmoji.value = emoji;
  currentTool.value = 'emoji';
}

</script>

<style scoped>
.editor-wrapper {
  flex-grow: 1; /* 佔據 v-card 中剩餘的垂直空間 */
  display: flex;
  justify-content: center; /* 水平居中 canvas */
  align-items: center;   /* 垂直居中 canvas */
  overflow: auto; /* 如果 canvas 意外過大，允許 wrapper 滾動 (理論上不應發生) */
  min-height: 0; /* 解決 flex item 在某些情況下的溢出問題 */
  background-color: #f0f0f0; /* 給 wrapper一個背景色，方便觀察佈局 */
  padding: 10px; /* 給一點內邊距 */
}

.editor-canvas {
  /* width 和 height 由 JS 控制 */
  /* max-width: 100%; */ /* 移除，由JS精確控制 */
  /* max-height: 100%; */ /* 移除，由JS精確控制 */
  box-shadow: 0 0 5px rgba(0,0,0,0.2); /* 給 canvas 一點陰影，使其突出 */
}

/* 如果需要在手機上對話框全螢幕，可能需要這個 */
:global(.image-editor-dialog-content) {
  /* 如果 v-dialog fullscreen，它的 margin 可能需要調整 */
  margin: 0 !important;
  height: 100% !important;
  max-height: 100% !important;
  overflow-y: hidden; /* 防止對話框本身出現滾動條 */
}
:global(.image-editor-dialog-content > .v-card) {
  height: 100%;
  border-radius: 0 !important; /* 全螢幕時移除圓角 */
}
</style>