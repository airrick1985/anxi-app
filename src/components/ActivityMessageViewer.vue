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
            上傳檔案
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
          v-if="currentMessage"
          icon="mdi-printer"
          variant="text"
          color="white"
          class="mr-1"
          :loading="isPrinting"
          :title="currentIsPdf ? '列印這份 PDF' : '列印這張圖'"
          @click="printCurrent"
        />

        <v-btn
          v-if="currentIsPdf && currentMessage"
          icon="mdi-open-in-new"
          variant="text"
          color="white"
          class="mr-1"
          title="在新分頁開啟 PDF"
          :href="currentMessage.downloadURL"
          target="_blank"
          rel="noopener"
        />

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
              請點擊右上角「上傳檔案」開始建立活動訊息。
            </p>
            <p v-else-if="!canUpload" class="text-body-1 text-grey-lighten-1">
              請聯絡有「銷控系統」權限的人員上傳活動圖檔／PDF。
            </p>
          </div>

          <template v-else>
            <div class="lightbox-stage flex-grow-1" ref="stageRef">
              <div
                v-if="currentMessage && !currentIsPdf"
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

              <!-- PDF 分頁瀏覽（vue-pdf-embed 逐頁渲染，寬度符合容器，縮放改變渲染寬度） -->
              <div v-else-if="currentMessage" ref="pdfScrollRef" class="pdf-stage">
                <div v-if="pdfLoadFailed" class="pdf-status-hint">
                  <v-icon size="44" class="mb-2">mdi-file-alert-outline</v-icon>
                  <div class="mb-3">PDF 預覽載入失敗</div>
                  <v-btn
                    color="teal"
                    variant="flat"
                    size="small"
                    prepend-icon="mdi-open-in-new"
                    :href="currentMessage.downloadURL"
                    target="_blank"
                    rel="noopener"
                  >在新分頁開啟</v-btn>
                </div>
                <div v-else-if="isPdfLoading" class="pdf-status-hint">
                  <v-progress-circular indeterminate color="#008cff" size="40" class="mb-3"></v-progress-circular>
                  <div>PDF 載入中...</div>
                </div>
                <VuePdfEmbed
                  v-if="pdfBaseWidth > 0 && !pdfLoadFailed"
                  :key="currentMessage.id"
                  :source="currentMessage.downloadURL"
                  :width="pdfRenderWidth"
                  class="pdf-embed-pages"
                  @rendered="onPdfRendered"
                  @loading-failed="onPdfLoadFailed"
                  @rendering-failed="onPdfLoadFailed"
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
                      <div v-if="isPdfItem(item)" class="thumbnail-pdf rounded">
                        <v-icon size="30" color="red-lighten-1">mdi-file-pdf-box</v-icon>
                        <span class="thumbnail-pdf-name">{{ item.fileName }}</span>
                      </div>
                      <v-img
                        v-else
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
          上傳活動訊息檔案
        </v-card-title>
        <v-card-text class="pt-4">
          <v-alert type="info" variant="tonal" density="compact" class="mb-4">
            支援 JPG / PNG / WEBP（單檔最大 2MB）與 PDF（單檔最大 7MB）。
          </v-alert>

          <v-file-input
            v-model="filePickerModel"
            label="點擊選擇圖檔／PDF (可多選)"
            variant="outlined"
            multiple
            accept="image/jpeg, image/png, image/webp, application/pdf, .pdf"
            prepend-icon="mdi-file-plus-outline"
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
              <v-avatar rounded="lg" size="56" class="mr-3 elevation-1" :color="item.isPdf ? 'red-lighten-5' : undefined">
                <v-icon v-if="item.isPdf" size="32" color="red-darken-1">mdi-file-pdf-box</v-icon>
                <v-img v-else :src="item.previewUrl" cover></v-img>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="text-body-2 font-weight-medium">{{ item.file.name }}</div>
                <div class="text-caption text-grey">
                  {{ formatSize(item.file.size) }} | {{ item.contentType || '未知格式' }}
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
          確定要刪除這則活動訊息嗎？此動作無法復原。
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
import { ref, computed, watch, onMounted, onUnmounted, nextTick, defineAsyncComponent } from 'vue';
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

// pdfjs 體積大（約 2.4MB），改為動態載入：只有真的瀏覽／上傳 PDF 時才會下載
const VuePdfEmbed = defineAsyncComponent(() => import('vue-pdf-embed'));

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: String, required: true },
  projectName: { type: String, default: '' },
  canUpload: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue']);

const toast = useToast();
const userStore = useUserStore();

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PDF_TYPE = 'application/pdf';
const MAX_SIZE = 2 * 1024 * 1024;        // 圖檔上限 2MB
const PDF_MAX_SIZE = 7 * 1024 * 1024;    // PDF 上限 7MB（base64 後約 9.4MB，不超過 onCall 10MB 請求上限）

// 判斷一則活動訊息是否為 PDF（優先看 contentType，舊資料則退回副檔名）
function isPdfItem(item) {
  if (!item) return false;
  return item.contentType === PDF_TYPE || /\.pdf$/i.test(item.fileName || '');
}

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

// --- PDF 檢視狀態（vue-pdf-embed 以「渲染寬度」表現縮放，與 panzoom 各走各的）---
const pdfScrollRef = ref(null);
const pdfBaseWidth = ref(0);
const pdfScale = ref(1);
const isPdfLoading = ref(false);
const pdfLoadFailed = ref(false);
const PDF_SCALE_MIN = 0.5;
const PDF_SCALE_MAX = 4;
const pdfRenderWidth = computed(() =>
  pdfBaseWidth.value > 0 ? Math.round(pdfBaseWidth.value * pdfScale.value) : undefined
);

const scalePercent = computed(() =>
  Math.round((currentIsPdf.value ? pdfScale.value : currentScale.value) * 100)
);
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
const currentIsPdf = computed(() => isPdfItem(currentMessage.value));

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

function setPdfScale(next) {
  pdfScale.value = Math.min(PDF_SCALE_MAX, Math.max(PDF_SCALE_MIN, next));
}

function zoomIn() {
  if (currentIsPdf.value) setPdfScale(pdfScale.value * 1.25);
  else panzoomInstance?.zoomIn();
}
function zoomOut() {
  if (currentIsPdf.value) setPdfScale(pdfScale.value / 1.25);
  else panzoomInstance?.zoomOut();
}
function resetZoom() {
  if (currentIsPdf.value) pdfScale.value = 1;
  else panzoomInstance?.reset();
}
function toggleZoom() {
  if (!panzoomInstance) return;
  if (currentScale.value > 1.05) panzoomInstance.reset();
  else panzoomInstance.zoom(2.5, { animate: true });
}

// --- PDF 量測與載入狀態 ---
function onPdfRendered() {
  isPdfLoading.value = false;
}
function onPdfLoadFailed() {
  isPdfLoading.value = false;
  pdfLoadFailed.value = true;
}

// Dialog 有開場動畫，容器寬度可能一開始量不到，需重試
function measurePdfBaseWidth() {
  const attempt = (retries) => {
    const w = pdfScrollRef.value?.clientWidth || 0;
    if (w > 0) {
      pdfBaseWidth.value = Math.max(280, w - 32); // 扣除左右內距
    } else if (retries > 0) {
      setTimeout(() => attempt(retries - 1), 100);
    }
  };
  nextTick(() => attempt(10));
}

// 切換到 PDF 時：關閉 panzoom、重置縮放與載入狀態並重新量測容器寬度
watch(
  () => currentMessage.value?.id,
  () => {
    if (!currentIsPdf.value) return;
    destroyPanzoom();
    pdfScale.value = 1;
    isPdfLoading.value = true;
    pdfLoadFailed.value = false;
    // 不歸零 pdfBaseWidth：沿用上次量到的寬度可避免切頁時空白閃爍，量到新值後再更新
    measurePdfBaseWidth();
  },
  { immediate: true }
);

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

// 切換縮圖列可見性後，主圖區寬度會變 → 重新初始化 panzoom 邊界 / 重新量測 PDF 寬度
watch(isThumbnailVisible, async () => {
  await nextTick();
  if (currentIsPdf.value) measurePdfBaseWidth();
  else if (panzoomInstance) initPanzoom();
});

// 視窗尺寸變動時同步重算 PDF 渲染寬度
function onWindowResize() {
  if (props.modelValue && currentIsPdf.value) measurePdfBaseWidth();
}
onMounted(() => window.addEventListener('resize', onWindowResize));

function onKeydown(e) {
  if (!props.modelValue) return;
  // 燈箱是 fullscreen dialog，原生 Ctrl/Cmd+P 會把整個系統介面一起印出來，攔下來只印目前這則
  if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
    e.preventDefault();
    printCurrent();
    return;
  }
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
  window.removeEventListener('resize', onWindowResize);
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

// 部分瀏覽器選 PDF 時 file.type 可能為空字串，改以副檔名補判，避免後端因 contentType 缺失而退件
function resolveFileType(file) {
  if (file.type) return file.type;
  return /\.pdf$/i.test(file.name) ? PDF_TYPE : '';
}

function addStagedFiles(files) {
  for (const file of files) {
    const contentType = resolveFileType(file);
    const isPdf = contentType === PDF_TYPE;
    stagedFiles.value.push({
      id: `${Date.now()}_${Math.random()}`,
      file,
      contentType,
      isPdf,
      // PDF 無縮圖，不建立 objectURL（避免無謂佔用記憶體）
      previewUrl: isPdf ? '' : URL.createObjectURL(file),
      error: validateFile(file, contentType),
    });
  }
}

function validateFile(file, contentType) {
  if (contentType === PDF_TYPE) {
    if (file.size > PDF_MAX_SIZE) {
      return `PDF 大小 ${formatSize(file.size)} 超過 7MB 上限`;
    }
    return null;
  }
  if (!IMAGE_TYPES.includes(contentType)) {
    return `不支援的格式（${contentType || '未知'}），僅允許 JPG / PNG / WEBP / PDF`;
  }
  if (file.size > MAX_SIZE) {
    return `檔案大小 ${formatSize(file.size)} 超過 2MB 上限`;
  }
  return null;
}

function removeStagedFile(id) {
  const target = stagedFiles.value.find(f => f.id === id);
  if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
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
  stagedFiles.value.forEach(item => { if (item.previewUrl) URL.revokeObjectURL(item.previewUrl); });
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
        contentType: item.contentType,
      });

      await addActivityMessageMetadata({
        projectId: props.projectId,
        fileName: item.file.name,
        downloadURL,
        storagePath,
        contentType: item.contentType,
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

// ---------- 列印 ----------
// 一律以隱藏 iframe 列印，避免 window.open 被彈窗阻擋、也不會把整個燈箱介面印進去。
const isPrinting = ref(false);

function escapeHtml(text) {
  return String(text || '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

function createPrintFrame() {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
  document.body.appendChild(frame);
  return frame;
}

// 列印對話框是同步阻塞的，關掉後才會回來；延遲移除 iframe 以免 Safari 印到一半就被抽掉
function disposePrintFrame(frame, delay = 1000) {
  setTimeout(() => frame.remove(), delay);
}

function triggerPrint(frame) {
  const win = frame.contentWindow;
  if (!win) throw new Error('無法建立列印視窗');
  win.focus();
  win.print();
}

// 圖檔：把圖寫進 iframe 文件後列印（img 不需 CORS，直接吃公開網址即可）
function printImage(item) {
  return new Promise((resolve, reject) => {
    const frame = createPrintFrame();
    const doc = frame.contentDocument;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(item.fileName || '活動訊息')}</title>
<style>
  @page { margin: 10mm; }
  html, body { margin: 0; padding: 0; }
  img { display: block; margin: 0 auto; max-width: 100%; max-height: 100vh; }
</style>
</head><body><img src="${escapeHtml(item.downloadURL)}" alt=""></body></html>`);
    doc.close();

    const img = doc.querySelector('img');
    const done = (err) => {
      disposePrintFrame(frame);
      if (err) reject(err); else resolve();
    };
    // 圖已在燈箱顯示過，通常已在快取中；仍需等 iframe 內的 img 解碼完成才印，否則會印出空白
    if (img.complete && img.naturalWidth > 0) {
      try { triggerPrint(frame); done(); } catch (e) { done(e); }
      return;
    }
    img.onload = () => {
      try { triggerPrint(frame); done(); } catch (e) { done(e); }
    };
    img.onerror = () => done(new Error('圖檔載入失敗'));
  });
}

// PDF：先取回 blob（token 網址自帶 CORS），再以同源 blob URL 載入 iframe 列印
async function printPdf(item) {
  const res = await fetch(item.downloadURL);
  if (!res.ok) throw new Error(`取得 PDF 失敗（HTTP ${res.status}）`);
  const blobUrl = URL.createObjectURL(await res.blob());

  await new Promise((resolve, reject) => {
    const frame = createPrintFrame();
    // 部分瀏覽器（如 iOS Safari）不支援 iframe 內嵌 PDF 列印，逾時就走另開分頁的退路
    const timer = setTimeout(() => {
      frame.remove();
      URL.revokeObjectURL(blobUrl);
      reject(new Error('此瀏覽器不支援直接列印 PDF'));
    }, 8000);

    frame.onload = () => {
      clearTimeout(timer);
      try {
        triggerPrint(frame);
        resolve();
      } catch (e) {
        reject(e);
      } finally {
        // PDF 需保留較久，列印預覽是由外掛非同步接手渲染的
        setTimeout(() => { frame.remove(); URL.revokeObjectURL(blobUrl); }, 60000);
      }
    };
    frame.src = blobUrl;
  });
}

async function printCurrent() {
  const item = currentMessage.value;
  if (!item || isPrinting.value) return;
  isPrinting.value = true;
  try {
    if (isPdfItem(item)) await printPdf(item);
    else await printImage(item);
  } catch (err) {
    // 退路：直接開新分頁，讓使用者用瀏覽器內建檢視器列印
    toast.warning(`${err.message}，已改為另開分頁，請於該分頁列印。`, { timeout: 4000 });
    window.open(item.downloadURL, '_blank', 'noopener');
  } finally {
    isPrinting.value = false;
  }
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

/* ---------- PDF 檢視區（逐頁垂直捲動） ---------- */
.pdf-stage {
  position: absolute;
  inset: 0;
  overflow: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  -webkit-overflow-scrolling: touch;
}

.pdf-status-hint {
  margin: auto;
  color: rgba(255, 255, 255, 0.85);
  text-align: center;
  font-size: 14px;
}

.pdf-embed-pages :deep(.vue-pdf-embed__page) {
  margin-bottom: 12px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.6);
}
.pdf-embed-pages :deep(.vue-pdf-embed__page canvas) {
  display: block;
  max-width: none; /* 放大時允許超出容器寬度，由外層捲動 */
}

/* PDF 縮圖：無預覽圖，以圖示 + 檔名呈現 */
.thumbnail-pdf {
  width: 80px;
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 4px;
  background: #2b2b2b;
  border: 1px solid rgba(255, 255, 255, 0.12);
}
.thumbnail-pdf-name {
  font-size: 9px;
  line-height: 1.1;
  color: rgba(255, 255, 255, 0.75);
  text-align: center;
  width: 100%;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-all;
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
