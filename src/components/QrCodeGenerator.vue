<template>
  <v-dialog v-model="dialogVisible" max-width="700px" persistent scrollable>
    <v-card>
      <v-card-title class="bg-primary text-white d-flex align-center">
        <v-icon start>mdi-qrcode</v-icon>
        產生 QR Code
        <v-spacer></v-spacer>
        <v-btn icon variant="text" color="white" @click="dialogVisible = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-4" style="max-height: 75vh; overflow-y: auto;">
        <!-- 目標網址 -->
        <v-text-field
          v-model="url"
          label="目標網址 (URL)"
          variant="outlined"
          density="compact"
          prepend-inner-icon="mdi-link"
          class="mb-4"
        ></v-text-field>

        <!-- QR Code 尺寸 -->
        <div class="mb-4">
          <div class="text-subtitle-2 font-weight-bold mb-2">QR Code 尺寸</div>
          <v-btn-toggle v-model="selectedSize" mandatory color="primary" density="compact">
            <v-btn value="small">小 (200px)</v-btn>
            <v-btn value="medium">中 (300px)</v-btn>
            <v-btn value="large">大 (400px)</v-btn>
          </v-btn-toggle>
        </div>

        <!-- 顏色設定 -->
        <v-row class="mb-2">
          <v-col cols="12" sm="6">
            <div class="text-subtitle-2 font-weight-bold mb-2">QR 顏色</div>
            <v-menu :close-on-content-click="false" location="bottom">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  variant="outlined"
                  size="small"
                  class="text-none"
                >
                  <div
                    class="color-preview mr-2"
                    :style="{ backgroundColor: qrColor }"
                  ></div>
                  {{ qrColor }}
                </v-btn>
              </template>
              <v-color-picker v-model="qrColor" mode="hex" hide-inputs></v-color-picker>
            </v-menu>
          </v-col>
          <v-col cols="12" sm="6">
            <div class="text-subtitle-2 font-weight-bold mb-2">背景顏色</div>
            <v-menu :close-on-content-click="false" location="bottom">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  variant="outlined"
                  size="small"
                  class="text-none"
                >
                  <div
                    class="color-preview mr-2"
                    :style="{ backgroundColor: bgColor }"
                  ></div>
                  {{ bgColor }}
                </v-btn>
              </template>
              <v-color-picker v-model="bgColor" mode="hex" hide-inputs></v-color-picker>
            </v-menu>
          </v-col>
        </v-row>

        <v-divider class="my-4"></v-divider>

        <!-- 中央覆蓋設定 -->
        <div class="text-subtitle-2 font-weight-bold mb-2">QR Code 中央內容（選填）</div>
        <v-btn-toggle v-model="overlayMode" color="primary" density="compact" class="mb-3">
          <v-btn value="none">無</v-btn>
          <v-btn value="text">文字</v-btn>
          <v-btn value="image">圖片</v-btn>
        </v-btn-toggle>

        <!-- 文字模式 -->
        <div v-if="overlayMode === 'text'" class="mb-4">
          <v-textarea
            v-model="overlayText"
            label="中央文字（支援多行）"
            variant="outlined"
            density="compact"
            rows="3"
            auto-grow
            class="mb-2"
          ></v-textarea>
          <div class="d-flex align-center">
            <span class="text-caption mr-3">字體大小：{{ fontSize }}px</span>
            <v-slider
              v-model="fontSize"
              :min="8"
              :max="32"
              :step="1"
              density="compact"
              hide-details
              style="max-width: 250px;"
              color="primary"
            ></v-slider>
          </div>
        </div>

        <!-- 圖片模式 -->
        <div v-if="overlayMode === 'image'" class="mb-4">
          <v-file-input
            label="選擇中央圖片"
            accept="image/*"
            variant="outlined"
            density="compact"
            prepend-icon="mdi-image"
            hide-details
            @change="handleImageUpload"
          ></v-file-input>
          <div v-if="overlayImagePreview" class="mt-2 text-center">
            <v-img :src="overlayImagePreview" max-height="80" max-width="80" class="mx-auto border rounded"></v-img>
          </div>
        </div>

        <v-divider class="my-4"></v-divider>

        <!-- QR Code 預覽 -->
        <div class="text-subtitle-2 font-weight-bold mb-2">預覽</div>
        <div class="d-flex justify-center pa-4 bg-grey-lighten-4 rounded" ref="previewContainer">
          <canvas ref="qrCanvas" :width="sizeMap[selectedSize]" :height="sizeMap[selectedSize]" style="image-rendering: pixelated;"></canvas>
        </div>
      </v-card-text>

      <v-card-actions class="pa-4 border-t">
        <v-btn
          variant="outlined"
          color="primary"
          prepend-icon="mdi-refresh"
          @click="generateQrCode"
          :loading="isGenerating"
        >
          重新產生
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          color="success"
          variant="elevated"
          prepend-icon="mdi-download"
          @click="downloadImage('png')"
          :disabled="!isGenerated"
        >
          下載 PNG
        </v-btn>
        <v-btn
          color="info"
          variant="elevated"
          prepend-icon="mdi-download"
          @click="downloadImage('jpg')"
          :disabled="!isGenerated"
        >
          下載 JPG
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import QRCode from 'qrcode';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  targetUrl: { type: String, default: '' }
});

const emit = defineEmits(['update:modelValue']);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

// --- 狀態 ---
const url = ref('');
const selectedSize = ref('medium');
const qrColor = ref('#000000');
const bgColor = ref('#FFFFFF');
const overlayMode = ref('none');
const overlayText = ref('');
const fontSize = ref(14);
const overlayImagePreview = ref(null);
const overlayImageElement = ref(null);
const qrCanvas = ref(null);
const isGenerating = ref(false);
const isGenerated = ref(false);

const sizeMap = { small: 200, medium: 300, large: 400 };

// 監聽 dialog 開啟，初始化 URL 並自動產生
watch(dialogVisible, async (val) => {
  if (val) {
    url.value = props.targetUrl || '';
    // 重置狀態
    overlayMode.value = 'none';
    overlayText.value = '';
    overlayImagePreview.value = null;
    overlayImageElement.value = null;
    isGenerated.value = false;
    await nextTick();
    generateQrCode();
  }
});

// 防抖計時器
let debounceTimer = null;
const debouncedGenerate = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    // 等待 DOM 更新（canvas 尺寸變更後需要等待）
    await nextTick();
    generateQrCode();
  }, 150);
};

// 監聽參數變化，自動重新產生（使用防抖）
watch([url, selectedSize, qrColor, bgColor, overlayMode, overlayText, fontSize, overlayImageElement], () => {
  if (dialogVisible.value && url.value) {
    debouncedGenerate();
  }
});

// 處理圖片上傳
const handleImageUpload = (event) => {
  const file = event.target?.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    overlayImagePreview.value = e.target.result;
    const img = new Image();
    img.onload = () => {
      overlayImageElement.value = img;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

// 產生 QR Code
const generateQrCode = async () => {
  if (!url.value || !qrCanvas.value) return;

  isGenerating.value = true;
  try {
    const size = sizeMap[selectedSize.value];
    const canvas = qrCanvas.value;

    // 確保 canvas 實際尺寸與目標尺寸一致
    canvas.width = size;
    canvas.height = size;

    // 先用 qrcode 套件產生基本 QR Code
    await QRCode.toCanvas(canvas, url.value, {
      width: size,
      margin: 2,
      color: {
        dark: qrColor.value,
        light: bgColor.value
      },
      errorCorrectionLevel: 'H' // 高容錯率，以支援中央覆蓋
    });

    const ctx = canvas.getContext('2d');

    // 繪製中央覆蓋內容
    if (overlayMode.value === 'text' && overlayText.value.trim()) {
      drawCenterText(ctx, size);
    } else if (overlayMode.value === 'image' && overlayImageElement.value) {
      drawCenterImage(ctx, size);
    }

    isGenerated.value = true;
  } catch (err) {
    console.error('QR Code 產生失敗:', err);
  } finally {
    isGenerating.value = false;
  }
};

// 繪製中央文字
const drawCenterText = (ctx, size) => {
  const lines = overlayText.value.split('\n');
  const lineHeight = fontSize.value * 1.3;
  const totalTextHeight = lines.length * lineHeight;
  
  // 計算文字最大寬度
  ctx.font = `bold ${fontSize.value}px "Microsoft JhengHei", "PingFang TC", sans-serif`;
  let maxWidth = 0;
  lines.forEach(line => {
    const w = ctx.measureText(line).width;
    if (w > maxWidth) maxWidth = w;
  });

  const padding = 8;
  const boxW = Math.min(maxWidth + padding * 2, size * 0.4);
  const boxH = Math.min(totalTextHeight + padding * 2, size * 0.4);
  const x = (size - boxW) / 2;
  const y = (size - boxH) / 2;

  // 繪製白色背景
  ctx.fillStyle = bgColor.value;
  ctx.fillRect(x, y, boxW, boxH);

  // 繪製文字
  ctx.fillStyle = qrColor.value;
  ctx.font = `bold ${fontSize.value}px "Microsoft JhengHei", "PingFang TC", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const textStartY = y + padding;
  lines.forEach((line, i) => {
    ctx.fillText(line, size / 2, textStartY + i * lineHeight, boxW - padding * 2);
  });
};

// 繪製中央圖片
const drawCenterImage = (ctx, size) => {
  const img = overlayImageElement.value;
  if (!img) return;

  const maxOverlaySize = size * 0.25;
  const imgRatio = img.width / img.height;
  let drawW, drawH;

  if (imgRatio > 1) {
    drawW = maxOverlaySize;
    drawH = maxOverlaySize / imgRatio;
  } else {
    drawH = maxOverlaySize;
    drawW = maxOverlaySize * imgRatio;
  }

  const x = (size - drawW) / 2;
  const y = (size - drawH) / 2;
  const padding = 4;

  // 繪製白色背景邊框
  ctx.fillStyle = bgColor.value;
  ctx.fillRect(x - padding, y - padding, drawW + padding * 2, drawH + padding * 2);

  // 繪製圖片
  ctx.drawImage(img, x, y, drawW, drawH);
};

// 下載圖片
const downloadImage = (format) => {
  if (!qrCanvas.value) return;

  const canvas = qrCanvas.value;
  let mimeType, extension;

  if (format === 'jpg') {
    mimeType = 'image/jpeg';
    extension = 'jpg';
    // JPG 不支援透明，需先填充背景
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.fillStyle = bgColor.value;
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0);
    
    const dataUrl = tempCanvas.toDataURL(mimeType, 0.95);
    triggerDownload(dataUrl, `qrcode.${extension}`);
  } else {
    mimeType = 'image/png';
    extension = 'png';
    const dataUrl = canvas.toDataURL(mimeType);
    triggerDownload(dataUrl, `qrcode.${extension}`);
  }
};

const triggerDownload = (dataUrl, filename) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<style scoped>
.color-preview {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid #ccc;
  display: inline-block;
}
</style>
