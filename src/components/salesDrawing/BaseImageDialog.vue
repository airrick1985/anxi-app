<template>
  <v-dialog v-model="open" max-width="560" persistent>
    <v-card>
      <v-card-title class="d-flex align-center bg-primary text-white py-3">
        <v-icon start>mdi-image-outline</v-icon>
        <span>{{ hasExisting ? '更換底圖' : '上傳底圖' }}</span>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" :disabled="processing" @click="close" />
      </v-card-title>
      <v-card-text class="pt-4">
        <div
          class="bid-drop"
          :class="{ 'is-over': dragOver, 'is-disabled': processing }"
          @dragover.prevent="dragOver = true"
          @dragleave.prevent="dragOver = false"
          @drop.prevent="onDrop"
          @click="!processing && fileInput?.click()"
        >
          <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp" class="d-none" @change="onPick" />
          <template v-if="!preview">
            <v-icon size="40" color="grey">mdi-cloud-upload-outline</v-icon>
            <div class="mt-2">拖放圖片到此處，或點擊選擇檔案</div>
            <div class="text-caption text-grey mt-1">支援 PNG／JPG／WebP，原檔上限 {{ maxMb }}MB；最長邊超過 {{ maxEdge }}px 會自動縮小</div>
          </template>
          <template v-else>
            <img :src="preview.url" class="bid-preview" alt="底圖預覽" />
            <div class="text-caption mt-2">
              {{ preview.originalName }} ・ {{ preview.width }} × {{ preview.height }} px ・ {{ formatSize(preview.size) }}
              <span v-if="preview.resized" class="text-grey">（已自動縮小）</span>
            </div>
          </template>
        </div>
        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-3">{{ error }}</v-alert>
        <v-alert v-if="hasExisting && preview && sizeChanged" type="info" variant="tonal" density="compact" class="mt-3">
          新底圖尺寸與原底圖不同，既有元素將依比例換算位置。
        </v-alert>
        <v-progress-linear v-if="processing" indeterminate color="primary" class="mt-3" />
      </v-card-text>
      <v-card-actions class="px-4 pb-4">
        <v-btn v-if="!hasExisting" variant="text" :disabled="processing" @click="emit('skip'); close()">先不上傳（白底畫布）</v-btn>
        <v-spacer />
        <v-btn variant="text" :disabled="processing" @click="close">取消</v-btn>
        <v-btn color="primary" variant="flat" :disabled="!preview || processing" @click="confirm">使用此底圖</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  hasExisting: { type: Boolean, default: false },
  existingSize: { type: Object, default: null }, // { width, height }
});
const emit = defineEmits(['update:modelValue', 'select', 'skip']);

const maxMb = 30;
const maxEdge = 4000;
const open = computed({ get: () => props.modelValue, set: v => emit('update:modelValue', v) });
const fileInput = ref(null);
const dragOver = ref(false);
const processing = ref(false);
const error = ref('');
const preview = ref(null);

const sizeChanged = computed(() => {
  if (!preview.value || !props.existingSize) return false;
  return preview.value.width !== props.existingSize.width || preview.value.height !== props.existingSize.height;
});

function formatSize(bytes) {
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

function onPick(e) {
  const f = e.target.files?.[0];
  e.target.value = '';
  if (f) handleFile(f);
}
function onDrop(e) {
  dragOver.value = false;
  const f = e.dataTransfer?.files?.[0];
  if (f) handleFile(f);
}

/** 抽樣檢查 PNG 是否含透明像素 */
function hasAlpha(ctx, w, h) {
  try {
    const data = ctx.getImageData(0, 0, w, h).data;
    const step = Math.max(4, Math.floor(data.length / 4 / 20000)) * 4;
    for (let i = 3; i < data.length; i += step) if (data[i] < 250) return true;
  } catch { /* ignore */ }
  return false;
}

async function handleFile(file) {
  error.value = '';
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { error.value = '僅支援 PNG／JPG／WebP 圖片'; return; }
  if (file.size > maxMb * 1024 * 1024) { error.value = `檔案超過 ${maxMb}MB`; return; }
  processing.value = true;
  try {
    const bmp = await createImageBitmap(file);
    const ratio = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * ratio), h = Math.round(bmp.height * ratio);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close?.();
    const keepPng = file.type === 'image/png' && hasAlpha(ctx, w, h);
    const type = keepPng ? 'image/png' : 'image/jpeg';
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, 0.9));
    if (!blob) throw new Error('影像處理失敗');
    if (preview.value?.url) URL.revokeObjectURL(preview.value.url);
    preview.value = {
      blob, url: URL.createObjectURL(blob), width: w, height: h,
      contentType: type, originalName: file.name, size: blob.size, resized: ratio < 1,
    };
  } catch (e) {
    console.error('[BaseImageDialog] 處理圖片失敗:', e);
    error.value = '圖片處理失敗，請改用其他檔案';
  } finally {
    processing.value = false;
  }
}

function confirm() {
  if (!preview.value) return;
  const { url, ...rest } = preview.value;
  emit('select', { ...rest, previewUrl: url });
  preview.value = null;
  open.value = false;
}

function close() {
  if (preview.value?.url) URL.revokeObjectURL(preview.value.url);
  preview.value = null;
  error.value = '';
  open.value = false;
}

watch(() => props.modelValue, (v) => { if (!v) { preview.value = null; error.value = ''; } });
</script>

<style scoped>
.bid-drop { border: 2px dashed #cbd5e1; border-radius: 10px; padding: 24px; text-align: center; cursor: pointer; transition: border-color .15s, background .15s; }
.bid-drop:hover, .bid-drop.is-over { border-color: #2563eb; background: #eff6ff; }
.bid-drop.is-disabled { pointer-events: none; opacity: .7; }
.bid-preview { max-width: 100%; max-height: 260px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,.15); }
</style>
