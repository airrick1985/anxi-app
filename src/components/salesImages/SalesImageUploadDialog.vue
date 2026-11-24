<template>
  <v-dialog
    :model-value="modelValue"
    max-width="760"
    scrollable
    :persistent="isUploading"
    content-class="mac-dialog-fit"
    @update:model-value="v => !v && close()"
  >
    <v-card class="mac-sheet siu">
      <div class="mac-sheet-head">
        <v-icon size="18">mdi-tray-arrow-up</v-icon>{{ title }}
        <span v-if="items.length" class="mac-page-count">{{ items.length }} 張</span>
        <button type="button" class="mac-sheet-close" title="關閉" :disabled="isUploading" @click="close">
          <v-icon size="18">mdi-close</v-icon>
        </button>
      </div>

      <v-card-text class="pa-0">
        <div class="mac-sheet-section">
          <UploadDropZone :accept="SALES_IMAGE_ACCEPT" :disabled="isUploading" :camera="false" mac block @files="files => addFiles(files)" />
        </div>

        <div v-if="items.length" class="siu-list">
          <div v-for="item in items" :key="item.id" class="siu-row" :class="`is-${item.status}`">
            <div class="siu-thumb">
              <img v-if="item.previewUrl" :src="item.previewUrl" alt="" />
              <div v-if="item.status === 'processing' || item.status === 'uploading'" class="siu-mask">
                <v-progress-circular indeterminate size="20" width="2" color="white"></v-progress-circular>
              </div>
              <div v-else-if="item.status === 'done'" class="siu-mask">
                <v-icon size="22" color="white">mdi-check-circle</v-icon>
              </div>
            </div>
            <div class="siu-main">
              <div class="siu-name-line">
                <input
                  v-model="item.name"
                  type="text"
                  class="mac-form-input siu-name"
                  :class="{ 'is-invalid': !!nameErrors[item.id] }"
                  placeholder="圖片名稱"
                  :disabled="isUploading || item.status === 'done' || item.status === 'invalid'"
                  :maxlength="SALES_IMAGE_NAME_MAX"
                />
                <span v-if="replaceTargets.has(item.id)" class="mac-tag siu-tag-replace">取代</span>
                <v-menu v-if="item.wide && item.status !== 'invalid'" location="bottom end" content-class="mac-menu">
                  <template #activator="{ props: menuProps }">
                    <button
                      type="button"
                      class="mac-tag siu-pano"
                      :class="{ 'is-on': isPanoramaType(item.panorama) }"
                      title="全景類型"
                      :disabled="isUploading || item.status !== 'ready'"
                      v-bind="menuProps"
                    >
                      <v-icon size="12">{{ panoramaOption(item.panorama).icon }}</v-icon>{{ panoramaOption(item.panorama).label }}
                      <v-icon size="12">mdi-chevron-down</v-icon>
                    </button>
                  </template>
                  <v-list density="compact">
                    <v-list-item
                      v-for="opt in PANORAMA_OPTIONS"
                      :key="opt.value"
                      :prepend-icon="opt.icon"
                      :title="opt.label"
                      :active="item.panorama === opt.value"
                      @click="setPanorama(item, opt.value)"
                    ></v-list-item>
                  </v-list>
                </v-menu>
                <span v-if="item.compressed" class="mac-tag">已壓縮</span>
              </div>
              <div class="siu-meta">
                {{ item.file.name }}<template v-if="item.width"> · {{ item.width }}×{{ item.height }}</template> · {{ formatBytes(item.upload?.size || item.file.size) }}
              </div>
              <div v-if="item.error || nameErrors[item.id]" class="siu-error">
                <v-icon size="13">mdi-alert-circle</v-icon>{{ item.error || nameErrors[item.id] }}
              </div>
            </div>
            <button
              type="button"
              class="mac-icon-btn"
              title="移除"
              :disabled="isUploading && item.status === 'uploading'"
              @click="removeItem(item.id)"
            >
              <v-icon size="18">mdi-close</v-icon>
            </button>
          </div>
        </div>
      </v-card-text>

      <div class="mac-sheet-foot">
        <label v-if="allowReplace" class="siu-switch">
          <input v-model="replaceExisting" type="checkbox" class="mac-switch" :disabled="isUploading" />同名時取代
        </label>
        <span class="mac-spacer"></span>
        <button type="button" class="mac-btn" :disabled="isUploading" @click="close">取消</button>
        <button type="button" class="mac-btn mac-btn--primary" :disabled="!canUpload" @click="uploadAll">
          <v-progress-circular v-if="isUploading" indeterminate size="14" width="2"></v-progress-circular>
          {{ uploadLabel }}
        </button>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue';
import { useToast } from 'vue-toastification';
import UploadDropZone from '@/components/subscription/UploadDropZone.vue';
import { saveSalesImage } from '@/api.js';
import {
  SALES_IMAGE_ACCEPT, SALES_IMAGE_NAME_MAX,
  normalizeImageName, imageNameError, fileBaseName, formatBytes, fileToBase64, uniqueImageName, prepareSalesImageUpload,
} from '@/utils/salesImages';
import { PANORAMA_OPTIONS, PANORAMA_NONE, isPanoramaType } from '@/utils/panorama';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: String, required: true },
  existingNames: { type: Array, default: () => [] },
  title: { type: String, default: '上傳圖片' },
  // 戶別圖片區：不提供「同名時取代」（會改到其他戶的圖），預設名稱自動避開重複
  allowReplace: { type: Boolean, default: true },
});
const emit = defineEmits(['update:modelValue', 'uploaded']);

const toast = useToast();
const UPLOAD_CONCURRENCY = 3;
const ACCEPTED_TYPES = SALES_IMAGE_ACCEPT.split(',');

const items = ref([]);
const replaceExisting = ref(false);
const isUploading = ref(false);
let seq = 0;

const existingSet = computed(() => new Set(props.existingNames));

// 依列表順序檢查名稱：與既有圖片同名（未開啟取代）或與前面的列重複都算錯
const nameCheck = computed(() => {
  const errors = {};
  const replace = new Set();
  const used = new Set();
  for (const item of items.value) {
    if (item.status === 'done' || item.status === 'invalid') continue;
    const name = normalizeImageName(item.name);
    const error = used.has(name) ? '與其他檔案重複' : imageNameError(name, replaceExisting.value ? new Set() : existingSet.value);
    if (error) errors[item.id] = error;
    else if (existingSet.value.has(name)) replace.add(item.id);
    used.add(name);
  }
  return { errors, replace };
});
const nameErrors = computed(() => nameCheck.value.errors);
const replaceTargets = computed(() => nameCheck.value.replace);

// 無法讀取的檔案（invalid）不上傳；上傳失敗的（error）可重試
const pending = computed(() => items.value.filter(i => i.status === 'ready' || i.status === 'error'));
const canUpload = computed(() => !isUploading.value
  && pending.value.length > 0
  && !items.value.some(i => i.status === 'processing')
  && pending.value.every(i => !nameErrors.value[i.id]));
const uploadLabel = computed(() => {
  if (isUploading.value) return '上傳中…';
  const retry = items.value.some(i => i.status === 'error');
  return `${retry ? '重試' : '上傳'} ${pending.value.length} 張`;
});

// panorama：指定全景類型；不給則自動辨識
async function prepare(item, panorama) {
  try {
    if (!ACCEPTED_TYPES.includes(item.file.type)) throw new Error('僅支援 PNG、JPG、WEBP');
    const result = await prepareSalesImageUpload(item.file, { panorama });
    Object.assign(item, { ...result, status: 'ready', error: '' });
  } catch (e) {
    Object.assign(item, { status: 'invalid', error: e.message || '無法讀取這張圖片' });
  }
}

const panoramaOption = value => PANORAMA_OPTIONS.find(o => o.value === value) || PANORAMA_OPTIONS[PANORAMA_OPTIONS.length - 1];

// 手動改判：全景與一般圖片的大小上限不同，要重新整理檔案
function setPanorama(item, value) {
  if (item.panorama === value || item.status !== 'ready') return;
  item.status = 'processing';
  prepare(item, value);
}

function defaultName(file) {
  const base = fileBaseName(file.name);
  if (props.allowReplace) return base;
  const taken = new Set(props.existingNames);
  items.value.forEach(i => taken.add(normalizeImageName(i.name)));
  return uniqueImageName(base, taken);
}

/** 加入待上傳檔案；presetName：缺圖補上傳時指定名稱 */
function addFiles(files, presetName = '') {
  const added = [];
  Array.from(files || []).forEach((file, i) => {
    const item = {
      id: ++seq,
      file,
      upload: null,
      previewUrl: URL.createObjectURL(file),
      name: i === 0 && presetName ? presetName : defaultName(file),
      compressed: false,
      width: 0,
      height: 0,
      panorama: PANORAMA_NONE,
      wide: false,
      status: 'processing',
      error: '',
    };
    added.push(item);
    items.value.push(item);
  });
  // 取 reactive proxy 再處理，狀態變更才會反映到畫面
  added.forEach(a => prepare(items.value.find(i => i.id === a.id)));
}

function removeItem(id) {
  const item = items.value.find(i => i.id === id);
  if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
  items.value = items.value.filter(i => i.id !== id);
}

function reset() {
  items.value.forEach(i => i.previewUrl && URL.revokeObjectURL(i.previewUrl));
  items.value = [];
  replaceExisting.value = false;
}

function close() {
  if (isUploading.value) return;
  emit('update:modelValue', false);
  reset();
}

async function uploadOne(item) {
  item.status = 'uploading';
  item.error = '';
  try {
    await saveSalesImage({
      projectId: props.projectId,
      imageName: normalizeImageName(item.name),
      replace: replaceExisting.value,
      fileName: item.upload.name,
      contentType: item.upload.type,
      fileBase64: await fileToBase64(item.upload),
      width: item.width,
      height: item.height,
      panorama: item.panorama,
    });
    item.status = 'done';
  } catch (e) {
    item.status = 'error';
    item.error = e.message || '上傳失敗';
  }
}

async function uploadAll() {
  if (!canUpload.value) return;
  isUploading.value = true;
  const queue = [...pending.value];
  const worker = async () => {
    while (queue.length) await uploadOne(queue.shift());
  };
  await Promise.all(Array.from({ length: Math.min(UPLOAD_CONCURRENCY, queue.length) }, worker));
  isUploading.value = false;

  const done = items.value.filter(i => i.status === 'done');
  const failed = items.value.filter(i => i.status === 'error');
  if (done.length) emit('uploaded', done.length, done.map(i => normalizeImageName(i.name)));
  if (failed.length) {
    toast.error(`${failed.length} 張上傳失敗`);
    done.forEach(i => removeItem(i.id));
  } else {
    toast.success(`已上傳 ${done.length} 張圖片`);
    close();
  }
}

onBeforeUnmount(reset);

defineExpose({ addFiles });
</script>

<style scoped>
.siu-list {
  border-top: 1px solid #f0f0f3;
}
.siu-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid #f0f0f3;
}
.siu-row.is-done,
.siu-row.is-invalid { opacity: 0.6; }
.siu-thumb {
  position: relative;
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 8px;
  overflow: hidden;
  background: #f2f2f5;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.1);
}
.siu-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.siu-mask {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  background: rgba(0, 0, 0, 0.42);
}
.siu-main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.siu-name-line { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.siu-name { flex: 1 1 200px; max-width: 360px; }
.siu-name.is-invalid { border-color: #d62d20; box-shadow: 0 0 0 3px rgba(214, 45, 32, 0.14); }
.siu-tag-replace { --mac-tag-bg: rgba(255, 159, 10, 0.16); --mac-tag-color: #b25e00; }
.siu-pano {
  border: 0;
  font-family: inherit;
  cursor: pointer;
}
.siu-pano.is-on { --mac-tag-bg: rgba(0, 113, 227, 0.12); --mac-tag-color: #0058b0; }
.siu-pano:disabled { opacity: 0.5; cursor: default; }
.siu-meta { font-size: 12px; color: #6e6e73; overflow-wrap: anywhere; }
.siu-error { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #d62d20; }
.siu-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

@media (max-width: 600px) {
  .siu-row { padding: 10px 12px; }
  .siu-name { max-width: none; font-size: 16px; height: 34px; }
}
</style>
