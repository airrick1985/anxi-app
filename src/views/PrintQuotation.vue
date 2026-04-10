<template>
  <v-card height="100vh" class="d-flex">

    <v-layout>

      <v-app-bar  flat border location="top">
        <v-btn icon="mdi-close" @click="$emit('close')"></v-btn>
        
<v-app-bar-title class="text-subtitle-1">{{ props.projectName }} 列印報價單</v-app-bar-title>
        <v-spacer></v-spacer>

      <v-tooltip :text="isEditMode ? '切換檢視' : '切換編輯'" location="bottom">
  <template v-slot:activator="{ props }">
    <v-btn
      v-bind="props"
      variant="tonal"
      color="black"
      @click="toggleEditMode"
      size="large"
      class="mr-2"
      :icon="isEditMode ? 'mdi-eye' : 'mdi-pencil'"
    >
    </v-btn>
  </template>
</v-tooltip>

<v-tooltip text="下載報價單 (PDF)" location="bottom">
  <template v-slot:activator="{ props }">
    <v-btn
      v-bind="props"
      variant="tonal"
      color="black"
      @click="downloadPDF"
      size="large"
      class="mr-2"
      icon="mdi-file-download"
    >
    </v-btn>
  </template>
</v-tooltip>

<v-tooltip text="列印" location="bottom">
  <template v-slot:activator="{ props }">
    <v-btn
      v-bind="props"
      variant="tonal"
      color="black"
      @click="printCanvas"
      size="large"
      class="mr-2"
      icon="mdi-printer"
    >
    </v-btn>
  </template>
</v-tooltip>

<v-tooltip 
  text="儲存版型" 
  location="bottom" 
  v-if="isEditMode && userStore.hasProjectPermission('儲存報價單版型', props.projectName)"
>
  <template v-slot:activator="{ props }">
    <v-btn
      v-bind="props"
      variant="tonal"
      color="black"
      @click="handleSaveTemplate"
      :loading="isSaving"
      size="large"
      class="mr-2"
      icon="mdi-content-save"
    >
    </v-btn>
  </template>
</v-tooltip>

        </v-app-bar>

      <v-navigation-drawer v-model="isEditMode" width="240">
        <v-list density="compact" nav>
          <v-list-subheader>新增元件</v-list-subheader>
          <v-list-item>
            <v-btn @click="addText" block variant="tonal" prepend-icon="mdi-format-text">
              文字
            </v-btn>
          </v-list-item>
          <v-list-item>
            <v-btn @click="triggerImageUpload" block variant="tonal" prepend-icon="mdi-image-plus">
              圖片
            </v-btn>
            <input 
              type="file" 
              ref="imageInputRef" 
              @change="onImageUpload" 
              accept="image/*" 
              style="display: none;" 
            />
          </v-list-item>
          <v-list-item>
            <v-btn @click="addShape" block variant="tonal" prepend-icon="mdi-rectangle-outline">
              矩形
            </v-btn>
          </v-list-item>

          <v-divider class="my-4"></v-divider>
          <v-list-subheader>資料</v-list-subheader>
        
        </v-list>
      </v-navigation-drawer>

      <v-navigation-drawer
        v-model="isEditMode"
        location="right"
        permanent
        width="280"
      >
        <v-list density="compact">
          <v-list-subheader>{{ inspectorTitle }}</v-list-subheader>

          <template v-if="!activeObject">
            <v-list-item>
              <v-btn 
                block 
                variant="tonal" 
                @click="isCanvasSettingsDialog = true"
                prepend-icon="mdi-ruler-square"
              >
                修改畫布設定
              </v-btn>
            </v-list-item>
          </template>

          <template v-if="activeObject">
            <v-list-subheader>通用屬性</v-list-subheader>
            
            <v-list-item 
              v-if="activeObject.type.includes('text') || activeObject.type.includes('rect') || activeObject.type.includes('group') || activeObject.type.includes('Selection')"
              class="d-flex justify-space-between align-center"
            >
              <span class="text-caption mr-2">填充/文字顏色</span>
              <v-menu :close-on-content-click="false" location="bottom end">
                <template v-slot:activator="{ props }">
                  <v-btn v-bind="props" :style="{ backgroundColor: panelState.fill }" size="small" class="color-preview-btn"></v-btn>
                </template>
                <v-color-picker v-model="panelState.fill" hide-inputs show-swatches></v-color-picker>
              </v-menu>
            </v-list-item>

            <v-list-item>
              <v-slider
                v-model.number="panelState.opacity"
                label="透明度"
                min="0"
                max="1"
                step="0.1"
                thumb-label
                density="compact"
                hide-details
              ></v-slider>
            </v-list-item>

            <template v-if="activeObject.type === 'textbox' || activeObject.type === 'activeSelection'">
              <v-divider class="my-2"></v-divider>
              <v-list-subheader>文字樣式</v-list-subheader>
              <v-list-item>
                <v-text-field
                  v-model.number="panelState.fontSize"
                  label="字體大小 (px)"
                  type="number"
                  variant="outlined"
                  density="compact"
                  hide-details
                  min="1"
                ></v-text-field>
              </v-list-item>
              <v-list-item>
                <v-btn-toggle multiple variant="outlined" divided block>
                  <v-btn @click="toggleBold" :active="panelState.fontWeight === 'bold'" class="flex-grow-1" :style="{fontWeight: 'bold'}">B</v-btn>
                  <v-btn @click="toggleItalic" :active="panelState.fontStyle === 'italic'" class="flex-grow-1" :style="{fontStyle: 'italic'}">I</v-btn>
                </v-btn-toggle>
              </v-list-item>
            </template>

            <v-divider class="my-2"></v-divider>
            <v-list-subheader>圖層順序</v-list-subheader>
            <v-list-item>
              <v-row dense>
                <v-col><v-btn @click="bringToFront" block variant="tonal" size="small" prepend-icon="mdi-arrange-bring-to-front">移至頂層</v-btn></v-col>
                <v-col><v-btn @click="sendToBack" block variant="tonal" size="small" prepend-icon="mdi-arrange-send-to-back">移至底層</v-btn></v-col>
              </v-row>
            </v-list-item>

            <v-divider class="my-2"></v-divider>
            <v-list-item>
              <v-btn @click="deleteSelected" block color="error" variant="flat" prepend-icon="mdi-delete">
                刪除
              </v-btn>
            </v-list-item>

          </template>
        </v-list>
      </v-navigation-drawer>

      <v-main class="editor-main-canvas-area" ref="mainAreaRef"> 


        <v-overlay
          :model-value="isLoadingTemplate"
          class="align-center justify-center"
          contained
          persistent
          scrim="#FFFFFF"
        >
          <div class="d-flex flex-column align-center text-center">
            <v-progress-circular
              indeterminate
              size="48"
              color="#008CFF"
              class="mb-4"
            ></v-progress-circular>
            <p class="text-h6" style="color: #008CFF;">正在載入報價單版型...</p>
            <p class="text-caption text-grey-darken-1">正在讀取資料並產製報價單，請稍候</p>
          </div>
        </v-overlay>
        
        
        <div 
          class="page-preview-container" 
          :style="pageContainerStyle" >
          <canvas 
            ref="canvasEl" 
            id="fabric-canvas"
            :width="canvasSettings.width"
            :height="canvasSettings.height"
          ></canvas>
        </div>
      </v-main>

    </v-layout> 
    <v-dialog v-model="isCanvasSettingsDialog" max-width="500">
  <v-card>
    <v-card-title>畫布設定</v-card-title>
    <v-card-text>
      <v-select
        v-model="canvasSettings.preset"
        :items="canvasPresetOptions"
        label="預設尺寸"
        variant="outlined"
        density="compact"
        class="mb-4"
        @update:model-value="onPresetChange"
      ></v-select>
      <v-row dense>
        <v-col>
          <v-text-field
            v-model.number="canvasSettings.width"
            label="寬度 (px)"
            type="number"
            variant="outlined"
            density="compact"
            :disabled="canvasSettings.preset !== 'custom'"
          ></v-text-field>
        </v-col>
        <v-col>
          <v-text-field
            v-model.number="canvasSettings.height"
            label="高度 (px)"
            type="number"
            variant="outlined"
            density="compact"
            :disabled="canvasSettings.preset !== 'custom'"
          ></v-text-field>
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      
      <v-btn 
        variant="text" 
        @click="isCanvasSettingsDialog = false"
      >
        取消
      </v-btn>

      <v-btn @click="applyCanvasSettings">套用</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>
    
  </v-card> </template>

<script setup>
import { jsPDF } from "jspdf";
import { ref, computed, watch, shallowRef, onMounted, onUnmounted, nextTick, watchEffect } from 'vue';
import { fabric } from 'fabric';
import { saveQuotationTemplate, loadQuotationTemplate } from '@/api';
import { useQuoteStore } from '@/store/quoteStore';
import { useUserStore } from '@/store/user'; //  [打勾] 1. 引入 userStore
import { useToast } from 'vue-toastification';

const toast = useToast();

const emit = defineEmits(['close']);

const props = defineProps({
  projectName: { // (用於標題)
    type: String,
    required: true,
  },
  projectId: { // (用於 API)
    type: String,
    required: true,
  },
  personnel: {
    type: Object,
    default: null
  }
});

// ✅ [新增] 取得當前日期格式字串 (YYYY年MM月DD日)
function getCurrentDateFormatted() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `報價日期：${year}年${month}月${day}日`;
}

// ✅ [新增] 插入日期資訊的函數
function addDateInfo(savedOptions = null) {
  const dateString = getCurrentDateFormatted();
  
  // 預設樣式 (放在右上角)
  const defaultOptions = {
    left: canvasSettings.value.width - 250, // 預設靠右
    top: 50,
    width: 200,
    fontSize: textFontSize * 0.8,
    fill: '#000',
    textAlign: 'right',
    fontWeight: 'normal'
  };

  // 如果有儲存的樣式就用儲存的，否則用預設
  const options = savedOptions ? { ...savedOptions, text: dateString } : defaultOptions;

  const dateText = new fabric.Textbox(dateString, options);
  
  // 標記此物件，以便儲存時辨識
  dateText.set('isDateInfo', true);

  return dateText;
}

function formatNumber(val, frac = 0) {
    if (val === null || val === undefined || val === '') return 'N/A';
    const num = parseFloat(val);
    if (isNaN(num)) return 'N/A';
    // 插入表格的數字使用千分位
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: frac });
}

const quoteStore = useQuoteStore();
const userStore = useUserStore(); //  [打勾] 2. 實例化 userStore

// --- 畫布實例 ---
const canvasEl = ref(null);
const fabricCanvas = shallowRef(null);

//  [打勾] 4. 新增用於 ResizeObserver 的 refs
const mainAreaRef = ref(null); // v-main 的 DOM ref
const mainAreaWidth = ref(0); // v-main 的內容寬度


//  修正：新增一個旗標，防止 watch 循環
const isUpdatingFromSelection = ref(false);

//  [新功能] 新增編輯模式狀態
const isEditMode = ref(false); // 預設為檢視模式


// --- 畫布設定 ---
const isCanvasSettingsDialog = ref(false);
const canvasPresetOptions = ref([
  { title: 'A4 直式 (794x1123 px)', value: 'A4p' },
  { title: 'A4 橫式 (1123x794 px)', value: 'A4l' },
  { title: '簡報 16:9 (1280x720 px)', value: '16:9' },
  { title: '簡報 4:3 (1024x768 px)', value: '4:3' },
  { title: '自訂', value: 'custom' },
]);
const CANVAS_PRESETS = {
  'A4p': { w: 794, h: 1123 },
  'A4l': { w: 1123, h: 794 },
  '16:9': { w: 1280, h: 720 },
  '4:3': { w: 1024, h: 768 },
};
const canvasSettings = ref({
  preset: 'A4p',
  width: 794,
  height: 1123,
});

function onPresetChange(preset) {
  if (preset !== 'custom') {
    const dims = CANVAS_PRESETS[preset];
    canvasSettings.value.width = dims.w;
    canvasSettings.value.height = dims.h;
  }
}

function applyCanvasSettings() {
  const { width, height } = canvasSettings.value;
  if (fabricCanvas.value) {
    fabricCanvas.value.setWidth(width);
    fabricCanvas.value.setHeight(height);
    fabricCanvas.value.renderAll();
  }
  isCanvasSettingsDialog.value = false;
}

// --- 屬性面板 ---
const activeObject = shallowRef(null);
const panelState = ref({}); // v-model 綁定

const isSaving = ref(false);
const isLoadingTemplate = ref(true);

const textFontSize = 28;

const pageContainerStyle = computed(() => {
  const canvasWidth = canvasSettings.value.width;
  const containerWidth = mainAreaWidth.value;

  // 留出 10px 的緩衝區，避免貼邊
  const availableWidth = containerWidth - 10;
  
  if (containerWidth === 0 || availableWidth >= canvasWidth) {
    // 尚未渲染完成，或容器寬度足夠，不需要縮放
    return { 
      transform: 'scale(1)',
      transformOrigin: 'top center'
    };
  }

  // 容器寬度 < 畫布寬度，計算縮放比例
  const scale = availableWidth / canvasWidth;
  
  return {
    transform: `scale(${scale})`,
    transformOrigin: 'top center', // 從頂部中心開始縮放
  };
});

const inspectorTitle = computed(() => {
  if (!activeObject.value) return '畫布屬性';
  
  if (activeObject.value.type === 'activeSelection') {
    return `已選取 ${activeObject.value.size()} 個元件`;
  }
  if (activeObject.value.type === 'textbox') return '文字屬性';
  if (activeObject.value.type === 'image') return '圖片屬性';
  if (activeObject.value.type === 'rect') return '矩形屬性';
  if (activeObject.value.type === 'group') return '表格屬性';
  return '元件屬性';
});

// ✅ [打勾] 3. 新增 watchEffect (這會取代舊的 onMounted/onUnmounted 中的邏輯)
watchEffect((onCleanup) => {
  
  // ✅ [打勾] 1. 取得 v-main 的 "組件" 實例
  const vMainComponent = mainAreaRef.value;
  
  // ✅ [打勾] 2. 檢查組件實例及其 $el (DOM 元素) 是否都存在
  if (vMainComponent && vMainComponent.$el) {
    
    // ✅ [打勾] 3. 這才是真正的 DOM 元素
    const el = vMainComponent.$el; 

    // 立即獲取初始寬度
    mainAreaWidth.value = el.clientWidth;
    
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        mainAreaWidth.value = entries[0].contentRect.width;
      }
    });
    
    // ✅ [打勾] 4. 監聽 DOM 元素
    resizeObserver.observe(el); 

    // onCleanup 會在 watchEffect 重新執行或元件 unmount 時觸發
    onCleanup(() => {
      resizeObserver.unobserve(el);
      resizeObserver.disconnect();
    });
  }
});


// --- Fabric.js 初始化 ---
onMounted(async () => {
  fabricCanvas.value = new fabric.Canvas(canvasEl.value, {
    backgroundColor: '#ffffff',
    fireRightClick: true,
    stopContextMenu: true,
  });

  //  [打勾] 1. 修正 NUM_FRACTION_DIGITS 問題
  // 根據官方文件，提高 Fabric.js 讀取/寫入 JSON 時的小數點精度
  // 你的資料庫儲存了高精度，讀取時也必須用高精度
  fabric.Object.NUM_FRACTION_DIGITS = 8; // 設定為 8 位精度

  fabricCanvas.value.imageSmoothingEnabled = false;


  // --- 事件監聽 ---
  fabricCanvas.value.on('selection:created', handleSelection);
  fabricCanvas.value.on('selection:updated', handleSelection);
  fabricCanvas.value.on('selection:cleared', handleSelectionCleared);
  
  //  [新功能] 新增鍵盤事件監聽
  window.addEventListener('keydown', handleKeyDown);
  
  // 監聽面板狀態 -> 更新 Fabric 物件
watch(panelState, (newState) => {
    //  修正：如果正在從選取事件更新，則跳過
    if (isUpdatingFromSelection.value) return;
    
    if (!activeObject.value) return;

    //  修正： 定義一個安全的 set function
    const applyTo = (obj) => {
      // 檢查是否為 'fill'（文字/矩形）
      if (newState.fill && (obj.type === 'textbox' || obj.type === 'rect')) {
        obj.set('fill', newState.fill);
      }
      
      // 檢查是否為 'opacity' (所有物件)
      if (newState.opacity !== undefined) {
         obj.set('opacity', newState.opacity);
      }

      // 檢查是否為文字屬性 (僅限 textbox)
      if (obj.type === 'textbox') {
        if (newState.fontSize) obj.set('fontSize', newState.fontSize);
        if (newState.fontWeight) obj.set('fontWeight', newState.fontWeight);
        if (newState.fontStyle) obj.set('fontStyle', newState.fontStyle);
      }
    };

    //  修正： 區分單選、多選、群組
    if (activeObject.value.type === 'activeSelection') {
      // 多選：套用到所有子物件
      activeObject.value.forEachObject(applyTo);
    } else if (activeObject.value.type === 'group') {
      // 表格群組：套用到所有子物件
      activeObject.value.forEachObject(obj => {
         // 只更新文字
        if (obj.type === 'textbox') {
          if (newState.fill) obj.set('fill', newState.fill);
          if (newState.fontSize) obj.set('fontSize', newState.fontSize);
          if (newState.fontWeight) obj.set('fontWeight', newState.fontWeight);
          if (newState.fontStyle) obj.set('fontStyle', newState.fontStyle);
        }
        // (我們暫時不允許從面板修改表格背景)
      });
    } else {
      // 單選：直接套用
      applyTo(activeObject.value);
    }
    
    fabricCanvas.value.renderAll();
  }, { deep: true });

  await loadAndRenderTemplate();
});

onUnmounted(() => {
  //  [新功能] 移除鍵盤事件監聽
  window.removeEventListener('keydown', handleKeyDown);
  
  
  if (fabricCanvas.value) {
    fabricCanvas.value.dispose();
  }
});

// --- Fabric 事件處理 ---

function handleSelection(e) {
  console.log('➡️ handleSelection: Started.', { e: e });

  // (1) 找出真正的目標物件
  let targetObject = null;
  if (e.target) {
   
    targetObject = e.target;
    console.log('➡️ handleSelection: Found object in e.target');
  } else if (e.selected && e.selected.length > 0) {
    // 情況 B: 是一個 'selection:created' 事件，物件在 e.selected 陣列中
    // (如果是多選，我們也只取第一個來顯示屬性)
    targetObject = e.selected[0];
    console.log('➡️ handleSelection: Found object in e.selected[0]');
  }
  
  // (2) 安全檢查
  if (!targetObject) {
    console.warn('➡️ handleSelection: NO TARGET found in e.target or e.selected! Clearing.');
    handleSelectionCleared();
    return;
  }
  
  console.log('➡️ handleSelection: Setting flag to true.');
  isUpdatingFromSelection.value = true;

  //  唯一的修正 
  const obj = targetObject; // 錯誤：const obj = e.target;
  activeObject.value = obj;
  
  // 建立一個乾淨的預設狀態
  let newPanelState = {
    opacity: obj.get('opacity') || 1, // 現在 'obj' 是 'targetObject'，不再是 undefined
    fill: '#000000', // 預設 (用於文字)
    fontSize: 16,
    fontWeight: 'normal',
    fontStyle: 'normal',
  };

  if (obj.type === 'textbox') {
    // 單一文字
    newPanelState.fill = obj.get('fill') || '#000000';
    newPanelState.fontSize = obj.get('fontSize') || 16;
    newPanelState.fontWeight = obj.get('fontWeight') || 'normal';
    newPanelState.fontStyle = obj.get('fontStyle') || 'normal';
  } 
  else if (obj.type === 'rect' || obj.type === 'image') {
    // 單一矩形或圖片 (矩形有 fill, 圖片沒有)
    newPanelState.fill = obj.get('fill') || '#BDBDBD'; 
  }
  else if (obj.type === 'group') {
    // 表格群組 - 嘗試從第一個文字物件讀取
    const firstText = obj.getObjects().find(o => o.type === 'textbox');
    if (firstText) {
        newPanelState.fill = firstText.get('fill') || '#000000';
        newPanelState.fontSize = firstText.get('fontSize') || 16;
    }
  }
  else if (obj.type === 'activeSelection') {
    // 多選 - 嘗試從第一個物件讀取
    const firstObj = obj.getObjects()[0];
    if (firstObj) {
       newPanelState.fill = firstObj.get('fill') || '#000000';
       newPanelState.opacity = firstObj.get('opacity') || 1;
       if (firstObj.type === 'textbox') {
         newPanelState.fontSize = firstObj.get('fontSize') || 16;
         newPanelState.fontWeight = firstObj.get('fontWeight') || 'normal';
         newPanelState.fontStyle = firstObj.get('fontStyle') || 'normal';
       }
    }
  }
  
  console.log('➡️ handleSelection: Updating panelState.', newPanelState);
  panelState.value = newPanelState;
  
  // (4) 使用 nextTick 重設旗標 (保持不變)
  nextTick(() => {
    // console.log('⏰ nextTick: Resetting flag to false.');
    isUpdatingFromSelection.value = false;
  });
}

function handleSelectionCleared() {
  console.log('➡️ handleSelectionCleared: Clearing activeObject and panelState.');
  activeObject.value = null;
  panelState.value = {};
}

//  [新功能] 新增鍵盤處理函數
function handleKeyDown(e) {
  // 檢查是否正在輸入框中 (例如右側面板的 "字體大小")
  const activeEl = document.activeElement;
  if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
    return; // 如果是，則不觸發快捷鍵
  }

  const activeObj = fabricCanvas.value?.getActiveObject();
  
  // 如果沒有選取物件，則不執行
  if (!activeObj) return;

  // 檢查是否正在畫布上編輯文字 (雙擊文字時)
  if (activeObj.isEditing) {
    // 如果正在編輯文字，則不觸發 "移動" 或 "刪除物件"
    // 讓按鍵 (上下左右/Delete) 保持原生行為 (移動游標/刪除文字)
    return;
  }

  let needsRender = false;

  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault(); // 防止頁面滾動
      activeObj.set('top', activeObj.top - 1);
      needsRender = true;
      break;
    case 'ArrowDown':
      e.preventDefault();
      activeObj.set('top', activeObj.top + 1);
      needsRender = true;
      break;
    case 'ArrowLeft':
      e.preventDefault();
      activeObj.set('left', activeObj.left - 1);
      needsRender = true;
      break;
    case 'ArrowRight':
      e.preventDefault();
      activeObj.set('left', activeObj.left + 1);
      needsRender = true;
      break;
    
    case 'Delete':
    case 'Backspace':
      e.preventDefault(); // 防止 Backspace 觸發瀏覽器 "上一頁"
      deleteSelected(); // 呼叫您現有的刪除函數
      break;
  }

  if (needsRender) {
    activeObj.setCoords(); // 更新物件的控制項位置
    fabricCanvas.value.renderAll();
  }
}

// --- 左側工具列功能 ---
// (addText, onImageUpload, addShape, addQuoteTable 保持不變)

function addText() {
  const text = new fabric.Textbox('點此編輯', {
    left: 50,
    top: 50,
    width: 150,
    fontSize: 20,
    fill: '#000000',
    textAlign: 'left',
  });
  fabricCanvas.value.add(text);
  
  //  附註：
  // setCountFrequency(0) 是一個小技巧，
  // 它可以"可能"阻止 setActiveObject 觸發那個 "壞" 的 'selection:created' 事件
  // 但我們的主要修復是在 handleSelection 中，所以這行不是必須的
  // fabricCanvas.value.setCountFrequency(0); 
  
  fabricCanvas.value.setActiveObject(text);
  console.log('--- addText: Manually calling handleSelection ---');
  handleSelection({ target: text });
  
  // fabricCanvas.value.setCountFrequency(1); // 恢復
}

const imageInputRef = ref(null);
const triggerImageUpload = () => imageInputRef.value.click();

function onImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (f) => {
    fabric.Image.fromURL(f.target.result, (img) => {
      img.set({ left: 50, top: 50, scaleX: 0.5, scaleY: 0.5 });
      fabricCanvas.value.add(img);
      fabricCanvas.value.setActiveObject(img);
   //  修正：手動觸發選取狀態更新
      handleSelection({ target: img });
    });
  };
  reader.readAsDataURL(file);
  event.target.value = null;
}


function addShape() {
  const rect = new fabric.Rect({
    left: 50,
    top: 50,
    width: 100,
    height: 100,
    fill: '#BDBDBD',
  });
  fabricCanvas.value.add(rect);
  fabricCanvas.value.setActiveObject(rect);
//  修正：手動觸發選取狀態更新
  handleSelection({ target: rect });
}

function addQuoteTable() {
  // (1) 檢查資料 (保持不變)
  if (quoteStore.items.length === 0) {
    toast.error('報價單中沒有項目，無法插入表格。', { timeout: false });
    return null; 
  }
  if (!quoteStore.items[0].calculatedPayments || quoteStore.items[0].calculatedPayments.length === 0) {
    toast.error('資料還沒準備好，請關閉重試。', { timeout: false });
    return null; 
  }

  // (2) 動態建立欄位標頭 (Headers)
  const headers = [];
  headers.push('戶別');
  headers.push('面積');
  headers.push('房屋總價');
  headers.push('房屋單價');
  headers.push('車位');
  headers.push('車位價格');
  
  const dynamicPaymentHeaders = quoteStore.items[0].calculatedPayments.map(p => p.name);
  headers.push(...dynamicPaymentHeaders);
  
  const showPackage = quoteStore.items.some(item => 
    quoteStore.getPackagePrice(item.internalId) > 0
  );
  if (showPackage) {
    headers.push('配套價');
  }
  headers.push('總價');
  
  // ✅ 新增需求 1：最後一欄固定為 "備註"
  headers.push('備註');

  // (3) 準備每一列 (Rows) 的資料
  const rows = quoteStore.items.map(item => {
    const row = {};
    const paymentMap = new Map((item.calculatedPayments || []).map(p => 
      [p.name, { value: p.value, percentage: p.percentage }]
    ));

    row['戶別'] = item.unitId;
    
    // ✅ 新增需求 2：露臺資訊顯示在面積下方
    let areaVal = formatNumber(item.unitDetails?.area_house_ping, 2) + ' 坪';
    const terracePing = Number(item.unitDetails?.area_terrace_ping) || 0;
    if (terracePing > 0) {
      areaVal += `\n(露臺${formatNumber(terracePing, 2)}坪)`;
    }
    row['面積'] = areaVal;

    row['房屋總價'] = formatNumber(quoteStore.getRawDisplayHousePrice(item.internalId)) + ' 萬';
    row['房屋單價'] = formatNumber(quoteStore.getDisplayUnitPrice(item.internalId), 2) + ' 萬/坪';
    row['車位'] = (item.selectedParking || []).map(p => p['車位編號']).join(', ') || '-';
    row['車位價格'] = formatNumber(quoteStore.getParkingTotalPrice(item.internalId)) + ' 萬';
    
    dynamicPaymentHeaders.forEach(header => {
      const payment = paymentMap.get(header) || { value: 0 };
      const amountStr = formatNumber(payment.value || 0) + ' 萬';
      let percentStr = '';
      if (payment.percentage) {
         percentStr = `\n(${payment.percentage}%)`;
      }
      row[header] = amountStr + percentStr;
    });

    if (showPackage) {
      row['配套價'] = formatNumber(quoteStore.getPackagePrice(item.internalId)) + ' 萬';
    }

    row['總價'] = formatNumber(quoteStore.getFinalTotalPrice(item.internalId)) + ' 萬';
    
    // ✅ 新增需求 1 資料：首購/非首購判斷
  row['備註'] = (item.isFirstTimeBuyer === '是') ? '首購' : '非首購'; //
  
  return row;
});

  // (4) 渲染 Fabric.js 物件
  
  // (4a) 欄寬定義
  const colWidths = headers.map(header => {
    if (header === '戶別') return 150;
    if (header === '車位') return 150;
    if (header === '備註') return 120; // ✅ 為備註設定適當欄寬
    if (header.includes('價') || header.includes('款') || header.includes('訂金')) return 150;
    if (header === '面積') return 180; // 面積因為有露臺資訊，建議稍微加寬
    return 150;
  });
  
  // (4b) 基礎樣式 (保持不變)
  const padding = 15; 
  const verticalPadding = 25; 
  const headerFill = '#f5f5f7';
  const rowFill = '#ffffff';
  const stroke = '#cccccc';

  const tableObjects = [];
  let currentY = 0;

  // (4c) 渲染標頭列 (邏輯保持不變)
  let currentX = 0;
  let headerTextBoxes = [];
  let maxHeaderHeight = 0;
  headers.forEach((header, colIndex) => {
    const tb = new fabric.Textbox(header, {
      left: currentX + padding, 
      top: currentY + verticalPadding, 
      width: colWidths[colIndex] - (padding * 2),
      fontSize: textFontSize, 
      fontWeight: 'bold', 
      fill: '#000',
      textAlign: 'center'
    });
    headerTextBoxes.push(tb);
    maxHeaderHeight = Math.max(maxHeaderHeight, tb.height);
    currentX += colWidths[colIndex];
  });

  const headerRowHeight = maxHeaderHeight + (verticalPadding * 2); 
  currentX = 0;
  headerTextBoxes.forEach((tb, colIndex) => {
    tableObjects.push(new fabric.Rect({
      left: currentX, top: currentY,
      width: colWidths[colIndex], height: headerRowHeight,
      fill: headerFill, stroke: stroke,
    }));
    tb.set('top', currentY + (headerRowHeight - tb.height) / 2);
    tableObjects.push(tb);
    currentX += colWidths[colIndex];
  });
  currentY += headerRowHeight;

  // (4d) 渲染資料列
  rows.forEach((row) => {
    currentX = 0;
    let rowTextBoxes = [];
    let maxRowHeight = 0;

    headers.forEach((key, colIndex) => {
      let currentFontSize = textFontSize;
      let currentFill = '#333';
      let currentFontWeight = 'normal';
      let cellStyles = {}; // 用於存放單一 Cell 內部的多重樣式

      // 總價樣式
      if (key === '總價') {
        currentFontSize = textFontSize * 1.2; 
        currentFill = '#C62828'; 
        currentFontWeight = 'bold'; 
      }

      // ✅ 新增需求 2 樣式：處理面積欄位的露臺紅字
      const cellText = String(row[key]);
      if (key === '面積' && cellText.includes('\n')) {
        const lines = cellText.split('\n');
        // lines[0] 為坪數，lines[1] 為 (露臺:XX.00坪)
        // Fabric styles 格式為 { 行索引: { 字元索引: { 屬性 } } }
        cellStyles[1] = {}; 
        for (let i = 0; i < lines[1].length; i++) {
          cellStyles[1][i] = {
            fontSize: textFontSize * 0.8, // 縮小字體
            fill: '#C62828',             // 紅字
            fontWeight: 'bold'            // 粗體
          };
        }
      }
      
      const tb = new fabric.Textbox(cellText, {
        left: currentX + padding,
        top: currentY + verticalPadding,
        width: colWidths[colIndex] - (padding * 2),
        fontSize: currentFontSize, 
        fill: currentFill,
        fontWeight: currentFontWeight,
        textAlign: 'center',
        styles: cellStyles // ✅ 套用進階樣式
      });
      
      rowTextBoxes.push(tb);
      maxRowHeight = Math.max(maxRowHeight, tb.height);
      currentX += colWidths[colIndex];
    });

    const dataRowHeight = maxRowHeight + (verticalPadding * 2);
    currentX = 0;
    rowTextBoxes.forEach((tb, colIndex) => {
      tableObjects.push(new fabric.Rect({
        left: currentX, top: currentY,
        width: colWidths[colIndex], height: dataRowHeight,
        fill: rowFill, stroke: stroke,
      }));
      tb.set('top', currentY + (dataRowHeight - tb.height) / 2);
      tableObjects.push(tb);
      currentX += colWidths[colIndex];
    });
    currentY += dataRowHeight;
  });

  // (4e) 建立群組 (保持不變)
  const tableGroup = new fabric.Group(tableObjects, {
    left: 0, top: 0,
    lockUniScaling: true,
    objectCaching: false 
  });
  tableGroup.set('isQuoteTable', true);

  return tableGroup;
}

// ✅ [新增] 議價調整提醒渲染函數
function addNegotiationNotes(tableGroup) {
  // 1. 過濾有議價調整的 items
  const adjustedItems = quoteStore.items.filter(item =>
    item.negotiationState?.originalPrice !== null &&
    item.negotiationState?.originalPrice !== undefined
  );

  // 2. 無調整 → 不渲染
  if (adjustedItems.length === 0) return null;

  // 3. 建立文字內容
  const lines = ['★ 議價調整提醒：'];
  adjustedItems.forEach(item => {
    const originalPrice = item.negotiationState.originalPrice;
    const currentPrice = Number(item.unitDetails.price_list_house_total) || 0;
    const totalDelta = currentPrice - originalPrice;
    const area = Number(item.unitDetails.area_house_ping) || 1;
    const perTsuboDelta = totalDelta / area;

    const sign = totalDelta > 0 ? '+' : '';
    const tsSign = perTsuboDelta > 0 ? '+' : '';

    lines.push(
      `${item.unitId}　｜　` +
      `原始房屋總價 ${formatNumber(originalPrice)} 萬 → 調整後 ${formatNumber(currentPrice)} 萬　` +
      `｜　調整 ${sign}${formatNumber(totalDelta)} 萬（每坪 ${tsSign}${perTsuboDelta.toFixed(1)} 萬）`
    );
  });

  // ✅ [新增] 最後一列：主管確認提醒
  lines.push('⚠️ 議價後價格請經由專案主管確認，若無主管確認報價無效。');

  // 4. 建立 Fabric.Textbox
  const textboxOptions = {
    left: tableGroup.left + 10,
    top: tableGroup.top + tableGroup.getScaledHeight() + 12,
    width: tableGroup.getScaledWidth() - 20,
    fontSize: 13,
    fontWeight: 'bold',
    fill: '#d32f2f',
    lineHeight: 1.6,
    editable: false,
    hasControls: false,
    selectable: false
  };

  const notesBox = new fabric.Textbox(lines.join('\n'), textboxOptions);
  notesBox.set('isNegotiationNote', true);
  return notesBox;
}

// --- 右側面板功能 ---

function deleteSelected() {
  const activeObj = fabricCanvas.value.getActiveObject();
  if (!activeObj) return;

  if (activeObj.type === 'activeSelection') {
    activeObj.forEachObject(obj => fabricCanvas.value.remove(obj));
  } else {
    fabricCanvas.value.remove(activeObj);
  }
  fabricCanvas.value.discardActiveObject();
  fabricCanvas.value.renderAll();
}

function bringToFront() {
  if (activeObject.value) {
    fabricCanvas.value.bringToFront(activeObject.value);
  }
}

function sendToBack() {
  if (activeObject.value) {
    fabricCanvas.value.sendToBack(activeObject.value);
  }
}

function toggleBold() {
  panelState.value.fontWeight = panelState.value.fontWeight === 'bold' ? 'normal' : 'bold';
}

function toggleItalic() {
  panelState.value.fontStyle = panelState.value.fontStyle === 'italic' ? 'normal' : 'italic';
}

//  [新功能] 列印畫布
function printCanvas() {
  if (!fabricCanvas.value) return;

  // 1. 取得畫布的 Data URL (PNG 格式)
  const dataUrl = fabricCanvas.value.toDataURL({
    format: 'png',
    quality: 1.0, // 使用最高品質
    multiplier: 2
    
  });

  // 2. 開啟一個新的空白視窗
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    // 如果瀏覽器阻擋了彈出視窗
    alert('請允許彈出式視窗來進行列印。');
    return;
  }

  // 3. 準備要列印的 HTML 內容
  printWindow.document.write(`
    <html>
      <head>
        <title>列印畫布</title>
        <style>
          /* 移除瀏覽器預設的頁首、頁尾和邊距 */
          @page {
            size: auto; /* 自動調整紙張大小 */
            margin: 0;  /* 移除邊距 */
          }
          body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center; /* 水平置中 (可選) */
            align-items: center;   /* 垂直置中 (可選) */
          }
          img {
            /* 確保圖片不會超出頁面 */
            max-width: 100%;
            max-height: 100vh;
            display: block;
          }
        </style>
      </head>
      <body>
        <img id="printImage" src="${dataUrl}">
      </body>
    </html>
  `);
  printWindow.document.close();

  // 4. 等待圖片完全載入後，再觸發列印
  const img = printWindow.document.getElementById('printImage');
  
  img.onload = () => {
    printWindow.focus(); // 確保視窗在最上層
    printWindow.print(); // 觸發列印對話框
  };
  
  // 5. (可選) 監聽 'afterprint' 事件，在列印後自動關閉視窗
  printWindow.onafterprint = () => {
    printWindow.close();
  };
}


//  [新功能] 新增切換模式的函數
/**
 * 更新 Fabric 畫布的可編輯狀態
 */
function updateCanvasMode(isEdit) {
  if (!fabricCanvas.value) return;

  if (isEdit) {
    // --- 切換到 編輯模式 ---
    // 1. 啟用畫布選取 (框選)
    fabricCanvas.value.selection = true;
    // 2. 讓所有物件可選
    fabricCanvas.value.getObjects().forEach(obj => {
      obj.set('selectable', true);
    });
  } else {
    // --- 切換到 檢視模式 ---
    // 1. 取消目前選取的物件
    fabricCanvas.value.discardActiveObject();
    // 2. 停用畫布選取 (框選)
    fabricCanvas.value.selection = false;
    // 3. 讓所有物件不可選
    fabricCanvas.value.getObjects().forEach(obj => {
      obj.set('selectable', false);
    });
    // 4. (重要) 觸發一次 renderAll 來隱藏選取框
    fabricCanvas.value.renderAll();
  }
}

/**
 * 按鈕點擊時的觸發函數
 */
function toggleEditMode() {
  isEditMode.value = !isEditMode.value;
  updateCanvasMode(isEditMode.value);
}

//  [新功能] 新增下載 PDF 函數
function downloadPDF() {
  if (!fabricCanvas.value) return;

  // 1. 取得畫布的 Data URL (圖片)
  const dataUrl = fabricCanvas.value.toDataURL({
    format: 'png',
    quality: 1.0,
    multiplier: 2
  });

  // 2. 取得畫布的尺寸
  const width = fabricCanvas.value.width;
  const height = fabricCanvas.value.height;
  
  // 3. 判斷 PDF 應為 'p' (直式) 還是 'l' (橫式)
  const orientation = width > height ? 'l' : 'p';

  // 4. 建立 jsPDF 實例
  // 我們使用 'px' (像素) 作為單位，並將格式設定為畫布的實際尺寸
  const pdf = new jsPDF({
    orientation: orientation,
    unit: 'px',
    format: [width, height],
   hotfixes: ['px_scaling'], // (可選) 處理高DPI的縮放
  });

  // 5. 將圖片加入 PDF
  // (x:0, y:0, 寬:width, 高:height)
  pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);

  // 6. 觸發下載
  pdf.save(`${props.projectName} 報價單.pdf`);
}

//  [打勾] 新增：插入銷售人員資訊的函數
/**
 * @param {number} startY 插入的起始 Y 座標
 */
function addPersonnelInfo(options = null, defaultStartY = 100) {
  if (!props.personnel || !props.personnel.name) {
    console.warn("缺少銷售人員資訊，不插入。");
    return [];
  }

  const personnelFontSize = textFontSize * 0.8;
  const personnelWidth = 400;

  // 預設值 (使用傳入的 defaultStartY)
  const defaultOptions = {
    name: {
      left: 50,
      top: defaultStartY, //  [打勾] 修正：現在 defaultStartY 已定義
      width: personnelWidth,
      fontSize: personnelFontSize,
      fill: '#000',
      fontWeight: 'bold',
      textAlign: 'left',
    },
    phone: {
      left: 50,
      top: defaultStartY + (personnelFontSize * 1.5), //  [打勾] 修正：現在 defaultStartY 已定義
      width: personnelWidth,
      fontSize: personnelFontSize,
      fill: '#000',
      textAlign: 'left',
    }
  };
  
  const nameOptions = options?.name ? options.name : defaultOptions.name;
  const phoneOptions = options?.phone ? options.phone : defaultOptions.phone;

  // (移除錯誤的 'if (!options)' 區塊)

  const nameText = new fabric.Textbox(
    `銷售顧問：${props.personnel.name}`, 
    nameOptions
  );

  const phoneText = new fabric.Textbox(
    `聯絡電話：${props.personnel.phone}`, 
    phoneOptions
  );

  nameText.set('isPersonnelInfo', 'name');
  phoneText.set('isPersonnelInfo', 'phone');

  return [nameText, phoneText];
}

//   -----------------------------------------------
//  儲存版型相關函數 (共 3 個)
//  -----------------------------------------------

/**
 * (輔助函數 1) 將 Fabric 物件序列化為乾淨的 JSON
 */
function serializeFabricObject(obj) {
  // 1. 通用屬性
  const commonProps = {
    type: obj.type,
    left: obj.left,
    top: obj.top,
    scaleX: obj.scaleX,
    scaleY: obj.scaleY,
    angle: obj.angle, // 即 rotation
    originX: obj.originX,
    originY: obj.originY,
    opacity: obj.opacity,
  };

  // 2. 根據類型添加特定屬性
  if (obj.type === 'textbox') {
    return {
      ...commonProps,
      text: obj.text,
      fontSize: obj.fontSize,
      fill: obj.fill,
      fontWeight: obj.fontWeight,
      fontStyle: obj.fontStyle,
      textAlign: obj.textAlign,
      width: obj.width, // Textbox 需要寬度
    };
  } else if (obj.type === 'image') {
    return {
      ...commonProps,
      src: obj.getSrc(), // 儲存圖片來源 (可能是 data:url)
    };
  } else if (obj.type === 'rect') {
    return {
      ...commonProps,
      width: obj.width,
      height: obj.height,
      fill: obj.fill,
      stroke: obj.stroke,
      strokeWidth: obj.strokeWidth,
    };
  }
  
  // (未來可以擴展支援 'line', 'circle' 等)
  return null; // 忽略不支援的物件類型
}

/**
 * (輔助函數 2) 序列化整個畫布
 */
function serializeCanvas() {
  const templateData = {
    canvas: {
      width: canvasSettings.value.width,
      height: canvasSettings.value.height,
    },
    tablePlaceholder: null,
    //  [打勾] 修改：從陣列改為物件，方便讀取
    personnelPlaceholders: {
      name: null,
      phone: null
   },
    datePlaceholder: null, // ✅ [新增] 初始化日期欄位
    objects: []
  };

  const objects = fabricCanvas.value.getObjects();

  for (const obj of objects) {
    if (obj.isQuoteTable) { // 儲存表格
      templateData.tablePlaceholder = {
        left: obj.left,
        top: obj.top,
        scaleX: obj.scaleX,
        scaleY: obj.scaleY,
        width: obj.width,
        height: obj.height,
        scaledWidth: obj.getScaledWidth(),
        scaledHeight: obj.getScaledHeight(),
      };
      continue;
    }

    //  [打勾] 修改：儲存銷售人員資訊
    if (obj.isPersonnelInfo === 'name') {
      // 我們不儲存 text 內容 (因為是動態的)，只儲存樣式
      const nameData = serializeFabricObject(obj);
      delete nameData.text; // 移除動態文字
      templateData.personnelPlaceholders.name = nameData;
      continue;
    }
    if (obj.isPersonnelInfo === 'phone') {
      const phoneData = serializeFabricObject(obj);
      delete phoneData.text; // 移除動態文字
      templateData.personnelPlaceholders.phone = phoneData;
      continue;
    }

// ✅ [新增] 儲存日期物件
    if (obj.isDateInfo) {
      const dateData = serializeFabricObject(obj);
      delete dateData.text; // 移除文字內容 (因為日期是動態的)
      templateData.datePlaceholder = dateData;
      continue;
    }


    // 儲存靜態物件
    const serializedObj = serializeFabricObject(obj);
    if (serializedObj) {
      templateData.objects.push(serializedObj);
    }
  }
  
  return templateData;
}

/**
 * (主函數) 按鈕點擊事件：儲存版型
 */
async function handleSaveTemplate() {
  //  [打勾] 修正：使用 props.projectId
  if (!props.projectId) { 
    toast.error('缺少建案 ID，無法儲存');
    return;
  }
  
  isSaving.value = true;
  try {
    const templateData = serializeCanvas();
    //  [打勾] 修正：使用 props.projectId
    const result = await saveQuotationTemplate(props.projectId, templateData); 
    
    if (result.status === 'success') {
      toast.success('版型已成功儲存！');
    } else {
      throw new Error(result.message || '儲存失敗');
    }
  } catch (error) {
    console.error("儲存版型失敗:", error);
    toast.error(`儲存失敗: ${error.message}`);
  } finally {
    isSaving.value = false;
  }
}

//  [打勾] 新增：載入並渲染版型 (或預設)
async function loadAndRenderTemplate() {
  isLoadingTemplate.value = true;
  
  try {
    const result = await loadQuotationTemplate(props.projectId);
    
    let templateCanvasSettings = null; // 暫存畫布設定

    // 情況 A：成功載入版型
    if (result.status === 'success' && result.data) {
      const template = result.data;
      
      // A.1: 載入畫布尺寸
      if (template.canvas) {
        // [修改] 只更新 ref，"不要" 在這裡呼叫 applyCanvasSettings()
        canvasSettings.value.width = template.canvas.width;
        canvasSettings.value.height = template.canvas.height;
      }
      
      // A.2: 載入靜態物件
      if (template.objects && template.objects.length > 0) {
        await new Promise((resolve) => {
          fabric.util.enlivenObjects(template.objects, (enlivenedObjects) => {
            
            enlivenedObjects.forEach(obj => {
              fabricCanvas.value.add(obj);
              obj.setCoords(); // (保留 setCoords)
            });
            
            resolve();
          }, '');
        });
      }

      // A.3: 載入動態表格 (保持不變)
      const tableGroup = addQuoteTable();
      if (tableGroup) {
        if (template.tablePlaceholder) {
          tableGroup.set({
            left: template.tablePlaceholder.left,
            top: template.tablePlaceholder.top,
            scaleX: template.tablePlaceholder.scaleX,
            scaleY: template.tablePlaceholder.scaleY,
          });
          tableGroup.setCoords();
        } else {
          applyDefaultTableLayout(tableGroup);
        }
        fabricCanvas.value.add(tableGroup);
        // (移除 setActiveObject 和 handleSelection，載入時不需要預選)
      }

      // ✅ [新增] A.3.5: 議價調整提醒 (在表格下方)
      let notesEndY = null;
      if (tableGroup) {
        const notesBox = addNegotiationNotes(tableGroup);
        if (notesBox) {
          fabricCanvas.value.add(notesBox);
          notesBox.setCoords();
          notesEndY = notesBox.top + notesBox.height + 20;
        }
      }

      // A.4: 載入銷售人員 (注意 Y 偏移)
      const personnelStartY = notesEndY
        ?? (tableGroup ? tableGroup.top + tableGroup.getScaledHeight() + 40 : 100);

      const [nameText, phoneText] = addPersonnelInfo(
        template.personnelPlaceholders,
        personnelStartY
      );
      if (nameText) {
        fabricCanvas.value.add(nameText);
        nameText.setCoords();
      }
      if (phoneText) {
        fabricCanvas.value.add(phoneText);
        phoneText.setCoords();
      }

      // ✅ [新增] A.5: 載入日期
      const dateText = addDateInfo(template.datePlaceholder); // 傳入儲存的設定(若有)
      if (dateText) {
        fabricCanvas.value.add(dateText);
        dateText.setCoords();
      }

    } else {
      // 情況 B：找不到版型 (保持不變)
      await renderDefaultItems();
    }

  } catch (error) {
    console.error("載入版型失敗:", error);
    toast.error(`載入版型失敗: ${error.message}`);
    await renderDefaultItems(); // 載入失敗時也使用預設值
  } finally {
    isLoadingTemplate.value = false;
    
    //  [打勾] 2. 關鍵修正：
    // 使用 nextTick 等待 Vue 完成 DOM 更新 (更新 <canvas> 標籤的 width/height 屬性)
    await nextTick(); 
    
    if (fabricCanvas.value) {
      const { width, height } = canvasSettings.value;
      
      //  [打勾] 3. 執行你手動修復時的關鍵動作：
      // 在所有物件都 add() 之後，再次設定 Fabric.js 的內部寬高
      fabricCanvas.value.setWidth(width);
      fabricCanvas.value.setHeight(height);
      
      //  [打勾] 4. (保險) 再次為所有物件更新座標
      // 雖然理論上 setCoords 已經在 add 時做過，
      // 但在 setWidth/Height 之後再做一次，確保它們的邊界是最終正確的
      fabricCanvas.value.getObjects().forEach(obj => {
        obj.setCoords();
      });
      
      //  [打勾] 5. 執行 "立即" 渲染 (renderAll)，而不是 "請求" 渲染 (requestRenderAll)
      fabricCanvas.value.renderAll();
    }
  }
}


//  [打勾] 新增：渲染預設項目 (Fallback)
async function renderDefaultItems() {
  // B.1: 插入表格 (使用預設位置)
  const tableGroup = addQuoteTable(); //  [打勾] 拿到乾淨的表格
  if (tableGroup) {
    applyDefaultTableLayout(tableGroup); //  [打勾] 套用預設排版 (此函數已包含 setCoords)
    fabricCanvas.value.add(tableGroup);
    fabricCanvas.value.setActiveObject(tableGroup);
    handleSelection({ target: tableGroup });
  }

  // ✅ [新增] B.1.5: 議價調整提醒
  let notesEndY = null;
  if (tableGroup) {
    const notesBox = addNegotiationNotes(tableGroup);
    if (notesBox) {
      fabricCanvas.value.add(notesBox);
      notesEndY = notesBox.top + notesBox.height + 20;
    }
  }

  // B.2: 插入銷售人員 (注意 Y 偏移)
  const startY = notesEndY
    ?? (tableGroup ? (tableGroup.top + tableGroup.getScaledHeight() + 40) : 100);
  const [nameText, phoneText] = addPersonnelInfo(null, startY);
  if (nameText) fabricCanvas.value.add(nameText);
  if (phoneText) fabricCanvas.value.add(phoneText);
// ✅ [新增] B.3: 插入預設日期
  const dateText = addDateInfo(null); // 傳入 null 使用預設位置
  if (dateText) {
    fabricCanvas.value.add(dateText);
  }
}

//  [打勾] 新增：套用預設表格佈局 (抽出共用)
function applyDefaultTableLayout(tableGroup) {
  const margin = 25;
  const canvasWidth = fabricCanvas.value.width;
  const targetWidth = canvasWidth - (margin * 2);
  const originalWidth = tableGroup.width;

  //  [打勾] 執行縮放邏輯
  if (originalWidth > targetWidth) {
    const scale = targetWidth / originalWidth;
    tableGroup.scale(scale);
  }

  //  [打勾] 執行定位邏輯
  tableGroup.set({
    left: margin,
    top: 100 
  });

  //  [打勾] 關鍵：在所有轉換完成後，呼叫 setCoords()
  tableGroup.setCoords();
}

</script>

<style scoped>
.editor-main-canvas-area {
  margin-top: 48px;
  background-color: #f0f2f5;
  width: 100%;
  height: calc(100vh - 48px);
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 24px;
  box-sizing: border-box;
}

.page-preview-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100%;
  transition: transform 0.2s ease-out;
}

#fabric-canvas {
  background-color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.color-preview-btn {
  min-width: 40px !important;
  border: 1px solid #ccc;
}
</style>