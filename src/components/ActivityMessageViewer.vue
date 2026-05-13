<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    fullscreen
    hide-overlay
    transition="dialog-bottom-transition"
  >
    <v-card class="d-flex flex-column" style="background-color: #1a1a1a;">
      <v-toolbar dark color="teal" density="compact">
        <v-btn icon dark @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-toolbar-title>
          活動訊息<span v-if="projectName"> - {{ projectName }}</span>
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn
          v-if="messages.length > 1"
          :icon="isThumbnailVisible ? 'mdi-view-grid' : 'mdi-view-grid-outline'"
          variant="text"
          color="white"
          :title="isThumbnailVisible ? '隱藏縮圖列表' : '顯示縮圖列表'"
          @click="isThumbnailVisible = !isThumbnailVisible"
        />
        <v-btn
          v-if="canUpload"
          color="white"
          variant="outlined"
          prepend-icon="mdi-cloud-upload"
          class="ml-2"
          @click="isUploadDialogOpen = true"
        >
          上傳圖檔
        </v-btn>
      </v-toolbar>

      <div class="flex-grow-1 d-flex" style="position: relative; min-height: 0;">
        <v-overlay
          :model-value="isLoading"
          class="align-center justify-center"
          contained
          persistent
          scrim="rgba(0, 0, 0, 0.6)"
        >
          <div class="text-center">
            <v-progress-circular indeterminate color="#008cff" size="64"></v-progress-circular>
            <p class="mt-4 text-body-1 text-white">正在載入活動訊息...</p>
          </div>
        </v-overlay>

        <template v-if="!isLoading">
          <div
            v-if="messages.length === 0"
            class="flex-grow-1 d-flex flex-column justify-center align-center text-white"
          >
            <v-icon size="80" color="grey-lighten-1">mdi-image-off-outline</v-icon>
            <p class="mt-4 text-h6">目前尚無活動訊息</p>
            <p v-if="canUpload" class="text-body-1 text-grey-lighten-1">
              請點擊右上角「上傳圖檔」開始建立活動訊息。
            </p>
            <p v-else class="text-body-1 text-grey-lighten-1">
              請聯絡有「銷控系統」權限的人員上傳活動圖檔。
            </p>
          </div>

          <template v-else>
            <div class="lightbox-stage flex-grow-1" ref="stageRef">
              <div
                v-if="currentMessage"
                ref="panRef"
                class="lightbox-pan-target"
                @dblclick="toggleZoom"
              >
                <img
                  :key="currentMessage.id"
                  ref="imgRef"
                  :src="currentMessage.downloadURL"
                  :alt="currentMessage.fileName"
                  class="lightbox-image"
                  draggable="false"
                  @load="onImageLoaded"
                />
              </div>

              <!-- 左右切換 -->
              <v-btn
                v-if="messages.length > 1"
                icon="mdi-chevron-left"
                size="large"
                class="nav-btn nav-prev"
                @click="prev"
              />
              <v-btn
                v-if="messages.length > 1"
                icon="mdi-chevron-right"
                size="large"
                class="nav-btn nav-next"
                @click="next"
              />

              <!-- 縮放控制 -->
              <div class="zoom-controls">
                <v-btn
                  icon="mdi-magnify-minus-outline"
                  size="small"
                  variant="text"
                  color="white"
                  @click="zoomOut"
                />
                <span class="scale-label">{{ scalePercent }}%</span>
                <v-btn
                  icon="mdi-magnify-plus-outline"
                  size="small"
                  variant="text"
                  color="white"
                  @click="zoomIn"
                />
                <v-divider vertical class="mx-1" color="white" />
                <v-btn
                  icon="mdi-image-filter-center-focus"
                  size="small"
                  variant="text"
                  color="white"
                  title="復位"
                  @click="resetZoom"
                />
              </div>

              <!-- 計數提示 -->
              <div v-if="messages.length > 1" class="counter-pill">
                {{ currentIndex + 1 }} / {{ messages.length }}
              </div>
            </div>

            <!-- 側邊縮圖列（垂直） -->
            <transition name="slide-panel">
              <div
                v-if="isThumbnailVisible && messages.length > 1"
                class="thumbnail-panel"
              >
                <div
                  v-for="(item, idx) in messages"
                  :key="item.id"
                  class="thumbnail-item"
                  :class="{ 'is-active': idx === currentIndex }"
                  @click="selectThumbnail(idx)"
                >
                  <v-img
                    :src="item.downloadURL"
                    :alt="item.fileName"
                    cover
                    width="80"
                    height="80"
                    class="rounded"
                  ></v-img>
                  <v-btn
                    v-if="canUpload"
                    icon="mdi-close"
                    size="x-small"
                    color="error"
                    class="thumbnail-delete"
                    @click.stop="confirmDelete(item)"
                  ></v-btn>
                </div>
              </div>
            </transition>
          </template>
        </template>
      </div>
    </v-card>

    <!-- 上傳子對話框 -->
    <v-dialog v-model="isUploadDialogOpen" max-width="640px" persistent>
      <v-card>
        <v-card-title class="bg-teal text-white d-flex align-center">
          <v-icon start>mdi-cloud-upload</v-icon>
          上傳活動訊息圖檔
        </v-card-title>
        <v-card-text class="pt-4">
          <v-alert type="info" variant="tonal" density="compact" class="mb-4">
            支援 JPG / PNG / WEBP，單檔最大 2MB。
          </v-alert>

          <v-file-input
            v-model="filePickerModel"
            label="點擊選擇圖檔 (可多選)"
            variant="outlined"
            multiple
            accept="image/jpeg, image/png, image/webp"
            prepend-icon="mdi-image-plus-outline"
            density="compact"
            clearable
            chips
          ></v-file-input>

          <v-sheet
            v-if="stagedFiles.length > 0"
            border
            rounded="lg"
            class="pa-3 mt-2"
            style="max-height: 320px; overflow-y: auto;"
          >
            <div
              v-for="(item, idx) in stagedFiles"
              :key="item.id"
              class="d-flex align-start"
              :class="{ 'mb-3': idx < stagedFiles.length - 1 }"
            >
              <v-avatar rounded="lg" size="56" class="mr-3 elevation-1">
                <v-img :src="item.previewUrl" cover></v-img>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="text-body-2 font-weight-medium">{{ item.file.name }}</div>
                <div class="text-caption text-grey">
                  {{ formatSize(item.file.size) }} | {{ item.file.type || '未知格式' }}
                </div>
                <div v-if="item.error" class="text-caption text-error mt-1">
                  <v-icon size="x-small" color="error">mdi-alert-circle</v-icon>
                  {{ item.error }}
                </div>
              </div>
              <v-btn
                icon="mdi-close"
                variant="text"
                size="small"
                @click="removeStagedFile(item.id)"
              ></v-btn>
            </div>
          </v-sheet>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeUploadDialog" :disabled="isUploading">
            取消
          </v-btn>
          <v-btn
            color="teal"
            variant="flat"
            prepend-icon="mdi-upload"
            :loading="isUploading"
            :disabled="!canSubmitUpload"
            @click="handleUpload"
          >
            上傳 {{ validStagedCount }} 個檔案
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 刪除確認 -->
    <v-dialog v-model="isDeleteDialogOpen" max-width="420px" persistent>
      <v-card>
        <v-card-title class="bg-error text-white">
          <v-icon start>mdi-alert</v-icon>
          確認刪除
        </v-card-title>
        <v-card-text class="pt-4">
          確定要刪除這張活動訊息嗎？此動作無法復原。
          <div v-if="pendingDeleteItem" class="mt-2 text-caption text-grey">
            檔名：{{ pendingDeleteItem.fileName }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="isDeleteDialogOpen = false" :disabled="isDeleting">
            取消
          </v-btn>
          <v-btn color="error" variant="flat" :loading="isDeleting" @click="executeDelete">
            刪除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onUnmounted, nextTick } from 'vue';
import { useToast } from 'vue-toastification';
import { useUserStore } from '@/store/user';
import {
  listenToActivityMessages,
  uploadActivityMessage,
  addActivityMessageMetadata,
  deleteActivityMessage,
} from '@/api';
import { serverTimestamp } from 'firebase/firestore';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: String, required: true },
  projectName: { type: String, default: '' },
  canUpload: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue']);

const toast = useToast();
const userStore = useUserStore();

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024;

const messages = ref([]);
const isLoading = ref(false);
const currentIndex = ref(0);

// 寬螢幕預設展開側邊縮圖列；窄螢幕（< 768px）預設收合，避免擠壓主圖
const isThumbnailVisible = ref(
  typeof window !== 'undefined' ? window.innerWidth >= 768 : true
);

const isUploadDialogOpen = ref(false);
const filePickerModel = ref([]);
const stagedFiles = ref([]);
const isUploading = ref(false);

const isDeleteDialogOpen = ref(false);
const pendingDeleteItem = ref(null);
const isDeleting = ref(false);

let unsubscribe = null;

// --- 燈箱縮放/拖曳 (panzoom 動態載入) ---
const stageRef = ref(null);
const panRef = ref(null);
const imgRef = ref(null);
const currentScale = ref(1);
const scalePercent = computed(() => Math.round(currentScale.value * 100));
let panzoomInstance = null;
let PanzoomCtor = null;
let wheelBound = null;
let panzoomChangeHandler = null;

const currentMessage = computed(() => messages.value[currentIndex.value] || null);

async function ensurePanzoom() {
  if (PanzoomCtor) return PanzoomCtor;
  const mod = await import('@panzoom/panzoom');
  PanzoomCtor = mod.default;
  return PanzoomCtor;
}

async function initPanzoom() {
  await nextTick();
  if (!panRef.value || !stageRef.value) return;
  const Panzoom = await ensurePanzoom();

  destroyPanzoom();

  // 將 panzoom 套用在「包住 img 的 wrapper div」而非 img 本身：
  // panzoom 以 CSS transform 縮放/平移，wrapper 沒有 max-width 干擾，scale 行為才會直觀
  const targetEl = panRef.value;
  panzoomInstance = Panzoom(targetEl, {
    maxScale: 6,
    minScale: 1,
    step: 0.5,
    cursor: 'grab',
    startScale: 1,
    animate: true,
    // 預設禁止拖移：scale=1 時不能拖（圖片本來就 fit 容器，拖移無意義）
    // 在 panzoomchange 事件中根據縮放程度動態開關
    disablePan: true,
  });
  currentScale.value = 1;

  wheelBound = (e) => panzoomInstance.zoomWithWheel(e);
  stageRef.value.addEventListener('wheel', wheelBound, { passive: false });

  panzoomChangeHandler = (e) => {
    currentScale.value = e.detail.scale;
    // 只有放大後才允許拖移
    panzoomInstance?.setOptions({
      disablePan: e.detail.scale <= 1.01,
    });
  };
  targetEl.addEventListener('panzoomchange', panzoomChangeHandler);
}

function destroyPanzoom() {
  if (panzoomInstance) {
    if (wheelBound && stageRef.value) {
      stageRef.value.removeEventListener('wheel', wheelBound);
    }
    if (panzoomChangeHandler && panRef.value) {
      panRef.value.removeEventListener('panzoomchange', panzoomChangeHandler);
    }
    panzoomInstance.destroy();
    panzoomInstance = null;
    wheelBound = null;
    panzoomChangeHandler = null;
  }
}

function onImageLoaded() {
  initPanzoom();
}

function zoomIn() { panzoomInstance?.zoomIn(); }
function zoomOut() { panzoomInstance?.zoomOut(); }
function resetZoom() { panzoomInstance?.reset(); }
function toggleZoom() {
  if (!panzoomInstance) return;
  if (currentScale.value > 1.05) panzoomInstance.reset();
  else panzoomInstance.zoom(2.5, { animate: true });
}

function prev() {
  if (messages.value.length === 0) return;
  resetZoom();
  currentIndex.value = (currentIndex.value - 1 + messages.value.length) % messages.value.length;
}
function next() {
  if (messages.value.length === 0) return;
  resetZoom();
  currentIndex.value = (currentIndex.value + 1) % messages.value.length;
}

function selectThumbnail(idx) {
  if (idx === currentIndex.value) return;
  resetZoom();
  currentIndex.value = idx;
}

// 切換縮圖列可見性後，主圖區寬度會變 → 重新初始化 panzoom 邊界
watch(isThumbnailVisible, async () => {
  await nextTick();
  if (panzoomInstance) initPanzoom();
});

function onKeydown(e) {
  if (!props.modelValue) return;
  if (e.key === 'ArrowLeft') prev();
  else if (e.key === 'ArrowRight') next();
  else if (e.key === '+' || e.key === '=') zoomIn();
  else if (e.key === '-' || e.key === '_') zoomOut();
  else if (e.key === '0') resetZoom();
}

function startListening() {
  if (!props.projectId) return;
  isLoading.value = true;
  unsubscribe = listenToActivityMessages(
    props.projectId,
    (items) => {
      messages.value = items;
      if (currentIndex.value >= items.length) currentIndex.value = 0;
      isLoading.value = false;
    },
    (error) => {
      toast.error(`載入活動訊息失敗：${error.message}`);
      isLoading.value = false;
    }
  );
}

function stopListening() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  messages.value = [];
  currentIndex.value = 0;
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      startListening();
      document.addEventListener('keydown', onKeydown);
    } else {
      stopListening();
      destroyPanzoom();
      document.removeEventListener('keydown', onKeydown);
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  stopListening();
  destroyPanzoom();
  document.removeEventListener('keydown', onKeydown);
});

function close() {
  emit('update:modelValue', false);
}

// ---------- 上傳 ----------
watch(filePickerModel, (newFiles) => {
  if (newFiles && newFiles.length > 0) {
    addStagedFiles(newFiles);
    filePickerModel.value = [];
  }
});

function addStagedFiles(files) {
  for (const file of files) {
    const error = validateFile(file);
    stagedFiles.value.push({
      id: `${Date.now()}_${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      error,
    });
  }
}

function validateFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `不支援的格式（${file.type || '未知'}），僅允許 JPG / PNG / WEBP`;
  }
  if (file.size > MAX_SIZE) {
    return `檔案大小 ${formatSize(file.size)} 超過 2MB 上限`;
  }
  return null;
}

function removeStagedFile(id) {
  const target = stagedFiles.value.find(f => f.id === id);
  if (target) URL.revokeObjectURL(target.previewUrl);
  stagedFiles.value = stagedFiles.value.filter(f => f.id !== id);
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

const validStagedCount = computed(() => stagedFiles.value.filter(i => !i.error).length);
const canSubmitUpload = computed(() => validStagedCount.value > 0 && !isUploading.value);

function closeUploadDialog() {
  if (isUploading.value) return;
  stagedFiles.value.forEach(item => URL.revokeObjectURL(item.previewUrl));
  stagedFiles.value = [];
  isUploadDialogOpen.value = false;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result.toString();
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
  });
}

async function handleUpload() {
  if (!canSubmitUpload.value) return;
  isUploading.value = true;

  const userKey = userStore.user?.key;
  const userName = userStore.user?.name || '';
  const validItems = stagedFiles.value.filter(i => !i.error);
  let successCount = 0;
  const failures = [];

  for (const item of validItems) {
    try {
      const base64 = await fileToBase64(item.file);
      const { downloadURL, storagePath } = await uploadActivityMessage({
        projectId: props.projectId,
        userKey,
        fileName: item.file.name,
        fileBase64: base64,
        contentType: item.file.type,
      });

      await addActivityMessageMetadata({
        projectId: props.projectId,
        fileName: item.file.name,
        downloadURL,
        storagePath,
        contentType: item.file.type,
        fileSize: item.file.size,
        sortOrder: Date.now(),
        uploadedBy: userKey || '',
        uploadedByName: userName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      successCount++;
    } catch (err) {
      failures.push(`${item.file.name}：${err.message}`);
    }
  }

  isUploading.value = false;

  if (successCount > 0) toast.success(`成功上傳 ${successCount} 個檔案`);
  failures.forEach(msg => toast.error(msg));

  if (failures.length === 0) closeUploadDialog();
}

// ---------- 刪除 ----------
function confirmDelete(item) {
  pendingDeleteItem.value = item;
  isDeleteDialogOpen.value = true;
}

async function executeDelete() {
  if (!pendingDeleteItem.value) return;
  isDeleting.value = true;
  try {
    await deleteActivityMessage({
      projectId: props.projectId,
      userKey: userStore.user?.key,
      docId: pendingDeleteItem.value.id,
      storagePath: pendingDeleteItem.value.storagePath,
    });
    toast.success('已刪除');
    isDeleteDialogOpen.value = false;
    pendingDeleteItem.value = null;
  } catch (err) {
    toast.error(`刪除失敗：${err.message}`);
  } finally {
    isDeleting.value = false;
  }
}
</script>

<style scoped>
.lightbox-stage {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #0d0d0d;
  min-height: 0;
}

.lightbox-pan-target {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  max-width: 100%;
  /* 預設游標：fit 時 default、放大後變 grab（panzoom 套件會自動切換） */
  touch-action: none;
}

.lightbox-image {
  /* 預設以視窗高度為基準，寬度由比例自動決定；超出容器寬度時由 max-width 縮回 */
  height: 100%;
  width: auto;
  max-width: 100%;
  user-select: none;
  -webkit-user-drag: none;
  display: block;
  /* 若圖片較寬：max-width 100% 會把它縮回，仍維持 contain 行為，但相比原本「兩維 max-100%」更偏好用滿高度 */
  object-fit: contain;
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 5;
  background-color: rgba(0, 0, 0, 0.5) !important;
  color: white !important;
}

.nav-prev { left: 16px; }
.nav-next { right: 16px; }

.zoom-controls {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: rgba(0, 0, 0, 0.65);
  padding: 4px 8px;
  border-radius: 24px;
  z-index: 5;
  color: white;
}

.scale-label {
  color: white;
  font-size: 13px;
  min-width: 44px;
  text-align: center;
}

.counter-pill {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 12px;
  border-radius: 14px;
  font-size: 13px;
  z-index: 5;
  pointer-events: none;
}

.thumbnail-panel {
  width: 104px;
  flex-shrink: 0;
  background-color: rgba(0, 0, 0, 0.6);
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
}
.thumbnail-panel::-webkit-scrollbar {
  width: 6px;
}
.thumbnail-panel::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.thumbnail-item {
  position: relative;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 6px;
  transition: border-color 0.15s ease;
  flex-shrink: 0;
}
.thumbnail-item.is-active {
  border-color: #26a69a;
}
.thumbnail-item:hover {
  border-color: rgba(255, 255, 255, 0.6);
}

.thumbnail-delete {
  position: absolute;
  top: -8px;
  right: -8px;
}

/* 縮圖面板進場 / 離場滑動動畫 */
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: transform 0.25s ease, opacity 0.2s ease;
}
.slide-panel-enter-from,
.slide-panel-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
