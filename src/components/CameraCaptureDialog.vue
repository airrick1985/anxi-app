<template>
  <v-dialog :model-value="modelValue" max-width="720" @update:model-value="v => !v && close()">
    <v-card class="mac-sheet">
      <div class="mac-sheet-head">
        <v-icon size="18">mdi-camera-outline</v-icon>
        <span>拍照</span>
        <button type="button" class="mac-sheet-close" aria-label="關閉" @click="close"><v-icon size="18">mdi-close</v-icon></button>
      </div>

      <div class="cam-stage">
        <video v-show="!shot && !error" ref="videoEl" autoplay playsinline muted></video>
        <img v-if="shot" :src="shot.url" alt="拍攝結果" />
        <div v-if="error" class="cam-msg">{{ error }}</div>
        <v-progress-circular v-else-if="!ready && !shot" class="cam-msg" indeterminate size="32" width="3" color="white"></v-progress-circular>
      </div>

      <div class="mac-sheet-foot">
        <button v-if="devices.length > 1 && !shot" type="button" class="mac-btn" :disabled="!ready" @click="switchCamera">
          <v-icon size="15">mdi-camera-flip-outline</v-icon><span>切換鏡頭</span>
        </button>
        <span class="mac-spacer"></span>
        <template v-if="shot">
          <button type="button" class="mac-btn" @click="retake">重拍</button>
          <button type="button" class="mac-btn mac-btn--primary" @click="use">使用</button>
        </template>
        <button v-else type="button" class="mac-btn mac-btn--primary" :disabled="!ready" @click="capture">
          <v-icon size="15">mdi-camera</v-icon><span>拍照</span>
        </button>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
// 桌機視訊鏡頭拍照（手機請改用 <input capture>，直接開系統相機）
import { ref, watch, nextTick, onBeforeUnmount } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue', 'capture']);

const videoEl = ref(null);
const ready = ref(false);
const error = ref('');
const shot = ref(null); // { blob, url }
const devices = ref([]);
let stream = null;
let deviceId = '';

function stopStream() {
  stream?.getTracks().forEach(t => t.stop());
  stream = null;
  ready.value = false;
}

function clearShot() {
  if (shot.value) URL.revokeObjectURL(shot.value.url);
  shot.value = null;
}

async function start(id = '') {
  stopStream();
  error.value = '';
  try {
    const video = id
      ? { deviceId: { exact: id }, width: { ideal: 1920 }, height: { ideal: 1080 } }
      : { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } };
    stream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
    if (!props.modelValue) { stopStream(); return; } // 等待授權時已關閉
    deviceId = stream.getVideoTracks()[0]?.getSettings().deviceId || id;
    await nextTick();
    videoEl.value.srcObject = stream;
    await videoEl.value.play().catch(() => {});
    ready.value = true;
    const list = await navigator.mediaDevices.enumerateDevices();
    devices.value = list.filter(d => d.kind === 'videoinput');
  } catch (err) {
    stopStream();
    error.value = err?.name === 'NotAllowedError' ? '未允許使用相機'
      : err?.name === 'NotFoundError' ? '找不到相機'
      : '無法開啟相機';
  }
}

function switchCamera() {
  const ids = devices.value.map(d => d.deviceId);
  const next = ids[(ids.indexOf(deviceId) + 1) % ids.length];
  start(next);
}

function capture() {
  const video = videoEl.value;
  if (!video?.videoWidth) return;
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  canvas.toBlob((blob) => {
    if (blob) shot.value = { blob, url: URL.createObjectURL(blob) };
  }, 'image/jpeg', 0.9);
}

function retake() {
  clearShot();
}

function use() {
  emit('capture', new File([shot.value.blob], 'camera.jpg', { type: 'image/jpeg', lastModified: Date.now() }));
  close();
}

function close() {
  emit('update:modelValue', false);
}

watch(() => props.modelValue, (open) => {
  if (open) {
    start();
  } else {
    stopStream();
    clearShot();
    error.value = '';
  }
}, { immediate: true });

onBeforeUnmount(() => {
  stopStream();
  clearShot();
});
</script>

<style scoped>
.cam-stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 16 / 9;
  max-height: 70vh;
  background: #111;
}
.cam-stage video,
.cam-stage img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.cam-msg {
  position: absolute;
  color: #fff;
  font-size: 14px;
}
</style>
