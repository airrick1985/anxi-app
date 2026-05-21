<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    fullscreen
    hide-overlay
    transition="dialog-bottom-transition"
  >
    <v-card class="d-flex flex-column" style="background-color: #1a1a1a;">
      <v-toolbar
        dark
        density="comfortable"
        flat
        class="lightbox-toolbar"
        :class="{ 'is-manage': canUpload && manageMode }"
      >
        <v-btn icon variant="text" color="white" class="ml-1" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>

        <div class="d-flex align-center toolbar-title-wrap">
          <div class="title-badge mr-3">
            <v-icon size="20" color="white">mdi-image-multiple-outline</v-icon>
          </div>
          <div class="d-flex flex-column toolbar-title-text">
            <span class="title-main">活動訊息</span>
            <span v-if="projectName" class="title-sub">{{ projectName }}</span>
          </div>
        </div>

        <v-spacer></v-spacer>

        <!-- 管理工具：預設隱藏，需透過隱藏解鎖碼（連續輸入 aaaaaaaa）進入管理模式 -->
        <template v-if="canUpload && manageMode">
          <v-chip
            color="amber-lighten-1"
            variant="flat"
            size="small"
            prepend-icon="mdi-cog"
            class="mr-2 d-none d-sm-flex font-weight-medium"
          >
            管理模式
          </v-chip>
          <v-btn
            variant="flat"
            color="white"
            class="mr-2 upload-btn text-teal-darken-2"
            prepend-icon="mdi-cloud-upload"
            rounded="pill"
            @click="isUploadDialogOpen = true"
          >
            上傳圖檔
          </v-btn>
          <v-btn
            variant="text"
            color="white"
            prepend-icon="mdi-check"
            title="退出管理模式"
            @click="exitManageMode"
          >
            完成
          </v-btn>
        </template>

        <v-btn
          v-if="thumbnailAvailable"
          :icon="isThumbnailVisible ? 'mdi-view-grid' : 'mdi-view-grid-outline'"
          variant="text"
          color="white"
          class="mr-1"
          :title="isThumbnailVisible ? '隱藏縮圖列表' : '顯示縮圖列表'"
          @click="isThumbnailVisible = !isThumbnailVisible"
        />
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
            v-if="displayMessages.length === 0"
            class="flex-grow-1 d-flex flex-column justify-center align-center text-white"
          >
            <v-icon size="80" color="grey-lighten-1">mdi-image-off-outline</v-icon>
            <p class="mt-4 text-h6">目前尚無活動訊息</p>
            <p v-if="canUpload && manageMode" class="text-body-1 text-grey-lighten-1">
              請點擊右上角「上傳圖檔」開始建立活動訊息。
            </p>
            <p v-else-if="!canUpload" class="text-body-1 text-grey-lighten-1">
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

              <!-- 已隱藏標示（管理模式下檢視到被隱藏的圖時提示） -->
              <div v-if="manageMode && currentMessage?.hidden" class="hidden-badge">
                <v-icon size="small" start>mdi-eye-off</v-icon>
                此圖已隱藏（一般人員看不到）
              </div>

              <!-- 左右切換 -->
              <v-btn
                v-if="displayMessages.length > 1"
                icon="mdi-chevron-left"
                size="large"
                class="nav-btn nav-prev"
                @click="prev"
              />
              <v-btn
                v-if="displayMessages.length > 1"
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
              <div v-if="displayMessages.length > 1" class="counter-pill">
                {{ currentIndex + 1 }} / {{ displayMessages.length }}
              </div>
            </div>

            <!-- 側邊縮圖列（垂直，管理模式下可拖曳排序；管理模式即使只有一張也顯示，方便刪除/隱藏） -->
            <transition name="slide-panel">
              <div
                v-if="showThumbnailPanel"
                class="thumbnail-panel"
              >
                <draggable
                  v-model="displayMessages"
                  item-key="id"
                  class="thumbnail-list"
                  :disabled="!canUpload || !manageMode"
                  handle=".thumb-drag-handle"
                  animation="200"
                  @change="onThumbnailReorder"
                >
                  <template #item="{ element: item, index: idx }">
                    <div
                      class="thumbnail-item"
                      :class="{ 'is-active': idx === currentIndex, 'is-hidden': item.hidden }"
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
                      <div v-if="item.hidden" class="thumbnail-hidden-tag">已隱藏</div>
                      <template v-if="canUpload && manageMode">
                        <v-btn
                          icon="mdi-drag"
                          size="x-small"
                          color="grey-darken-3"
                          class="thumb-drag-handle"
                          title="拖曳調整順序"
                          @click.stop
                        ></v-btn>
                        <v-btn
                          :icon="item.hidden ? 'mdi-eye-off' : 'mdi-eye'"
                          size="x-small"
                          :color="item.hidden ? 'grey-darken-2' : 'teal'"
                          class="thumbnail-visibility"
                          :loading="visibilityBusyId === item.id"
                          :title="item.hidden ? '點擊改為顯示' : '點擊改為隱藏'"
                          @click.stop="toggleVisibility(item)"
                        ></v-btn>
                        <v-btn
                          icon="mdi-close"
                          size="x-small"
                          color="error"
                          class="thumbnail-delete"
                          @click.stop="confirmDelete(item)"
                        ></v-btn>
                      </template>
                    </div>
                  </template>
                </draggable>
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
import draggable from 'vuedraggable';
import { useUserStore } from '@/store/user';
import {
  listenToActivityMessages,
  uploadActivityMessage,
  addActivityMessageMetadata,
  deleteActivityMessage,
  updateActivityMessagesOrder,
  updateActivityMessageVisibility,
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

// 管理模式：預設關閉，純為瀏覽燈箱；連續輸入解鎖碼後才顯示上傳/刪除/排序工具
const manageMode = ref(false);
const UNLOCK_CODE = 'aaaaaaaa';
let keyBuffer = '';

const isUploadDialogOpen = ref(false);
const filePickerModel = ref([]);
const stagedFiles = ref([]);
const isUploading = ref(false);

const isDeleteDialogOpen = ref(false);
const pendingDeleteItem = ref(null);
const isDeleting = ref(false);

const visibilityBusyId = ref(null);

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

// 顯示用清單：一般瀏覽只顯示未隱藏的圖；管理模式顯示全部（含已隱藏，供切換）
// 可寫：拖曳排序時 vuedraggable 會在管理模式下回寫整份清單
const displayMessages = computed({
  get() {
    return manageMode.value ? messages.value : messages.value.filter(m => !m.hidden);
  },
  set(val) {
    messages.value = val;
  },
});

const currentMessage = computed(() => displayMessages.value[currentIndex.value] || null);

// 縮圖列：一般情況超過 1 張才出現；管理模式下只要有 1 張就出現（才能刪除/隱藏唯一一張）
const hasManageTools = computed(() => props.canUpload && manageMode.value);
const thumbnailAvailable = computed(() =>
  displayMessages.value.length > 1 ||
  (hasManageTools.value && displayMessages.value.length >= 1)
);
const showThumbnailPanel = computed(() => isThumbnailVisible.value && thumbnailAvailable.value);

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
  const len = displayMessages.value.length;
  if (len === 0) return;
  resetZoom();
  currentIndex.value = (currentIndex.value - 1 + len) % len;
}
function next() {
  const len = displayMessages.value.length;
  if (len === 0) return;
  resetZoom();
  currentIndex.value = (currentIndex.value + 1) % len;
}

function selectThumbnail(idx) {
  if (idx === currentIndex.value) return;
  resetZoom();
  currentIndex.value = idx;
}

// 拖曳排序：vuedraggable 已就地更新 messages 順序，這裡同步 currentIndex 並持久化
async function onThumbnailReorder(evt) {
  const moved = evt?.moved;
  if (moved) {
    const { oldIndex, newIndex } = moved;
    if (currentIndex.value === oldIndex) {
      currentIndex.value = newIndex;
    } else if (oldIndex < currentIndex.value && currentIndex.value <= newIndex) {
      currentIndex.value -= 1;
    } else if (newIndex <= currentIndex.value && currentIndex.value < oldIndex) {
      currentIndex.value += 1;
    }
  }
  try {
    await updateActivityMessagesOrder(messages.value.map(m => m.id));
  } catch (err) {
    toast.error(`排序儲存失敗：${err.message}`);
    // 失敗時 Firestore 順序未變，下一次快照會還原本地順序
  }
}

// 切換單張圖片的隱藏／顯示
async function toggleVisibility(item) {
  if (!item || visibilityBusyId.value) return;
  const nextHidden = !item.hidden;
  visibilityBusyId.value = item.id;
  try {
    await updateActivityMessageVisibility(item.id, nextHidden);
    toast.success(nextHidden ? '已設為隱藏（一般人員看不到）' : '已設為顯示', { timeout: 1500 });
  } catch (err) {
    toast.error(`更新顯示狀態失敗：${err.message}`);
  } finally {
    visibilityBusyId.value = null;
  }
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

// --- 隱藏解鎖碼：連續輸入 aaaaaaaa 切換管理模式（僅具上傳權限者有效）---
// 將輸入正規化為半形小寫，支援大小寫與全形（aaaaaaaa / AAAAAAAA / ａａａａａａａａ 皆可）。
function normalizeChar(ch) {
  const code = ch.charCodeAt(0);
  const half = (code >= 0xff01 && code <= 0xff5e)
    ? String.fromCharCode(code - 0xfee0)
    : ch;
  return half.toLowerCase();
}

// 切換管理模式：保留目前檢視的圖片（依 id 重新定位），進入時自動展開縮圖列以便操作
function applyManageMode(next) {
  const keepId = currentMessage.value?.id;
  manageMode.value = next;
  if (next) isThumbnailVisible.value = true;
  const idx = keepId ? displayMessages.value.findIndex(m => m.id === keepId) : -1;
  currentIndex.value = idx >= 0 ? idx : 0;
}

// 以 keyup 偵測（避免按鍵被其他元件的 keydown 攔截）
function onUnlockKeyup(e) {
  if (!props.canUpload) return;
  if (typeof e.key !== 'string' || e.key.length !== 1) return;
  keyBuffer = (keyBuffer + normalizeChar(e.key)).slice(-UNLOCK_CODE.length);
  if (keyBuffer === UNLOCK_CODE) {
    keyBuffer = '';
    applyManageMode(!manageMode.value);
    toast.success(manageMode.value ? '已進入管理模式' : '已退出管理模式', { timeout: 1500 });
  }
}

function exitManageMode() {
  applyManageMode(false);
  toast.info('已退出管理模式', { timeout: 1500 });
}

function startListening() {
  if (!props.projectId) return;
  isLoading.value = true;
  unsubscribe = listenToActivityMessages(
    props.projectId,
    (items) => {
      messages.value = items;
      if (currentIndex.value >= displayMessages.value.length) currentIndex.value = 0;
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
      manageMode.value = false;
      keyBuffer = '';
      startListening();
      document.addEventListener('keydown', onKeydown);
      window.addEventListener('keyup', onUnlockKeyup, true);
    } else {
      manageMode.value = false;
      stopListening();
      destroyPanzoom();
      document.removeEventListener('keydown', onKeydown);
      window.removeEventListener('keyup', onUnlockKeyup, true);
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  stopListening();
  destroyPanzoom();
  document.removeEventListener('keydown', onKeydown);
  window.removeEventListener('keyup', onUnlockKeyup, true);
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
/* ---------- 標題列（質感漸層 + 圖示徽章 + 兩行標題） ---------- */
.lightbox-toolbar {
  /* 深淺 teal 漸層，營造層次與質感 */
  background: linear-gradient(120deg, #0b3b39 0%, #0f766e 55%, #14a89a 100%) !important;
  color: #fff !important;
  border-bottom: 1px solid rgba(45, 212, 191, 0.35);
  box-shadow: 0 6px 22px rgba(0, 0, 0, 0.45);
}
/* 管理模式：底線改琥珀色，強化「正在編輯」的狀態提示 */
.lightbox-toolbar.is-manage {
  border-bottom-color: rgba(255, 193, 7, 0.7);
  box-shadow: 0 6px 22px rgba(0, 0, 0, 0.5), inset 0 -2px 0 rgba(255, 193, 7, 0.3);
}

.toolbar-title-wrap {
  min-width: 0; /* 允許長建案名以省略號收尾 */
}

.title-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28);
  flex-shrink: 0;
}

.toolbar-title-text {
  min-width: 0;
  line-height: 1.18;
}
.title-main {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: #fff;
}
.title-sub {
  font-size: 12px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 42vw;
}

.upload-btn {
  font-weight: 600;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.28);
}

.lightbox-stage {
  position: relative;
  overflow: hidden;
  background-color: #0d0d0d;
  min-height: 0;
}

/* 重點：pan-target 以 absolute 鋪滿 stage（貼齊父層左上角），圖片改在其內部置中。
   panzoom 的滾輪焦點計算是相對「父層左上角 + 元素 margin + 元素中心」，
   若改用 stage 的 flex 置中，會讓元素實際位置偏移而 panzoom 無從得知，
   造成滾輪縮放焦點對不到滑鼠。鋪滿父層後 transform-origin(50% 50%) 即為 stage 中心，焦點才會跟隨滑鼠。 */
.lightbox-pan-target {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
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

.thumbnail-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.thumb-drag-handle {
  position: absolute;
  top: -8px;
  left: -8px;
  cursor: grab;
  touch-action: none;
}
.thumb-drag-handle:active {
  cursor: grabbing;
}

.thumbnail-visibility {
  position: absolute;
  bottom: -8px;
  right: -8px;
}

/* 已隱藏縮圖：圖片變淡，並在左下角標示 */
.thumbnail-item.is-hidden :deep(.v-img) {
  opacity: 0.4;
}
.thumbnail-hidden-tag {
  position: absolute;
  bottom: 2px;
  left: 2px;
  background-color: rgba(0, 0, 0, 0.72);
  color: #ffca28;
  font-size: 10px;
  line-height: 1;
  padding: 2px 5px;
  border-radius: 4px;
  pointer-events: none;
}

/* 主圖：管理模式檢視到已隱藏圖片的提示 */
.hidden-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.7);
  color: #ffca28;
  padding: 4px 12px;
  border-radius: 14px;
  font-size: 13px;
  z-index: 5;
  pointer-events: none;
}

/* 拖曳排序時的占位/拖曳樣式 */
.thumbnail-list .sortable-ghost {
  opacity: 0.4;
}
.thumbnail-list .sortable-chosen {
  border-color: #ffca28 !important;
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
