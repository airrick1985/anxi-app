<template>
  <div
    ref="rootEl"
    v-file-drop="disabled ? false : { accept, multiple, onFiles: emitFiles }"
    class="udz"
    :class="{ 'udz--block': block, 'is-disabled': disabled }"
    :tabindex="disabled ? -1 : 0"
    @click="onZoneClick"
    @keydown.enter.self.prevent="pick(fileInput)"
  >
    <template v-if="mac">
      <button v-if="showCamera" type="button" class="mac-btn mac-btn--sm" :disabled="disabled" @click="openCamera">
        <v-icon size="15">mdi-camera-outline</v-icon><span>拍照</span>
      </button>
      <button v-if="acceptsImages" type="button" class="mac-btn mac-btn--sm" :disabled="disabled" @click="pick(imageInput)">
        <v-icon size="15">mdi-image-outline</v-icon><span>圖片</span>
      </button>
      <button v-if="!imageOnly" type="button" class="mac-btn mac-btn--sm" :disabled="disabled" @click="pick(fileInput)">
        <v-icon size="15">mdi-paperclip</v-icon><span>檔案</span>
      </button>
    </template>
    <template v-else>
      <v-btn v-if="showCamera" variant="tonal" size="small" prepend-icon="mdi-camera-outline" :disabled="disabled" @click="openCamera">拍照</v-btn>
      <v-btn v-if="acceptsImages" variant="tonal" size="small" prepend-icon="mdi-image-outline" :disabled="disabled" @click="pick(imageInput)">圖片</v-btn>
      <v-btn v-if="!imageOnly" variant="tonal" size="small" prepend-icon="mdi-paperclip" :disabled="disabled" @click="pick(fileInput)">檔案</v-btn>
    </template>
    <span v-if="!isTouch" class="udz-hint">拖曳或貼上</span>

    <input ref="fileInput" type="file" class="d-none" :accept="accept" :multiple="multiple" @change="onInput($event)" />
    <input ref="imageInput" type="file" class="d-none" :accept="imageAccept" :multiple="multiple" @change="onInput($event)" />
    <input ref="captureInput" type="file" class="d-none" accept="image/*" capture="environment" @change="onInput($event, '拍照')" />
    <CameraCaptureDialog v-model="cameraOpen" @capture="file => emitFiles([rename(file, '拍照')])" />
  </div>
</template>

<script setup>
// 上傳放置框：拍照／圖片／檔案按鈕＋拖曳＋貼上截圖（Ctrl/⌘+V），統一 emit('files', File[])
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import CameraCaptureDialog from '@/components/CameraCaptureDialog.vue';
import { parseAccept, fileMatches } from '@/directives/vFileDrop';

const props = defineProps({
  accept: { type: String, default: 'image/*,application/pdf,.doc,.docx,.xls,.xlsx' },
  multiple: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  mac: { type: Boolean, default: false }, // macOS 風格按鈕
  block: { type: Boolean, default: false }, // 佔滿整列
});
const emit = defineEmits(['files']);

const IMAGE_EXT = /^\.(png|jpe?g|gif|webp|heic|heif|bmp|svg)$/;
const isTouch = typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;

const rootEl = ref(null);
const fileInput = ref(null);
const imageInput = ref(null);
const captureInput = ref(null);
const cameraOpen = ref(false);
const hasWebcam = ref(false);

const acceptTokens = computed(() => parseAccept(props.accept));
const isImageToken = t => t.startsWith('image/') || IMAGE_EXT.test(t);
const acceptsImages = computed(() => acceptTokens.value.length === 0 || acceptTokens.value.some(isImageToken));
const imageOnly = computed(() => acceptTokens.value.length > 0 && acceptTokens.value.every(isImageToken));
const imageAccept = computed(() => (imageOnly.value ? props.accept : 'image/*'));
const showCamera = computed(() => acceptsImages.value && (isTouch || hasWebcam.value));

function stamp() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function rename(file, prefix) {
  const ext = file.name?.match(/\.[^.]+$/)?.[0] || `.${(file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')}`;
  return new File([file], `${prefix}_${stamp()}${ext}`, { type: file.type, lastModified: file.lastModified });
}

function emitFiles(files) {
  const list = props.multiple ? files : files.slice(0, 1);
  if (list.length && !props.disabled) emit('files', list);
}

function pick(input) {
  if (!props.disabled) input?.click();
}

function onZoneClick(e) {
  // 按鈕與隱藏 input 的 click 也會冒泡到這裡，只處理框內空白處
  if (e.target.closest('button, input')) return;
  pick(fileInput.value);
}

function onInput(e, prefix) {
  const files = Array.from(e.target.files || []);
  e.target.value = '';
  emitFiles(prefix ? files.map(f => rename(f, prefix)) : files);
}

function openCamera() {
  if (props.disabled) return;
  if (isTouch) captureInput.value?.click();
  else cameraOpen.value = true;
}

function isEditable(el) {
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
}

// 滑鼠停在框上、或焦點在框內時，貼上剪貼簿的檔案／截圖
function onPaste(e) {
  const el = rootEl.value;
  if (props.disabled || !el || el.getClientRects().length === 0) return; // 已關閉的對話框內不處理
  const active = document.activeElement;
  const focused = el.contains(active);
  if (!focused && !el.matches(':hover')) return;
  const data = e.clipboardData;
  if (!data) return;
  // 焦點在其他輸入框且剪貼簿有文字 → 視為貼文字，不攔截
  if (!focused && isEditable(active) && data.types?.includes('text/plain')) return;
  const files = Array.from(data.files || []);
  if (files.length === 0) return;
  const accepted = files
    .filter(f => fileMatches(f, acceptTokens.value))
    .map(f => (!f.name || /^image\.\w+$/i.test(f.name) ? rename(f, '截圖') : f));
  if (accepted.length === 0) return;
  e.preventDefault();
  emitFiles(accepted);
}

function detectWebcam() {
  const md = navigator.mediaDevices;
  if (!md?.getUserMedia || !md.enumerateDevices) return Promise.resolve(false);
  return md.enumerateDevices()
    .then(list => list.some(d => d.kind === 'videoinput'))
    .catch(() => false);
}

onMounted(() => {
  document.addEventListener('paste', onPaste);
  if (!isTouch) detectWebcam().then((v) => { hasWebcam.value = v; });
});

onBeforeUnmount(() => {
  document.removeEventListener('paste', onPaste);
});
</script>

<style scoped>
.udz {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-height: 56px;
  padding: 8px 10px;
  border: 1.5px dashed #c7c7cc;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.015);
  cursor: pointer;
  outline: none;
}
.udz:hover,
.udz:focus-visible {
  border-color: rgb(var(--v-theme-primary));
}
.udz--block {
  display: flex;
  width: 100%;
}
.udz.is-disabled {
  opacity: 0.5;
  cursor: default;
  pointer-events: none;
}
.udz-hint {
  font-size: 12px;
  color: #8e8e93;
  white-space: nowrap;
  padding: 0 2px;
}
</style>
