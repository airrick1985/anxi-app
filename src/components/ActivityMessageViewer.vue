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
          v-if="canUpload"
          color="white"
          variant="outlined"
          prepend-icon="mdi-cloud-upload"
          @click="isUploadDialogOpen = true"
        >
          上傳圖檔
        </v-btn>
      </v-toolbar>

      <div class="flex-grow-1 d-flex flex-column" style="position: relative; min-height: 0;">
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
            <div class="flex-grow-1 d-flex justify-center align-center pa-4" style="min-height: 0;">
              <v-carousel
                v-model="currentIndex"
                :show-arrows="messages.length > 1 ? 'hover' : false"
                :cycle="false"
                hide-delimiters
                height="100%"
                class="fill-height"
                style="width: 100%;"
              >
                <v-carousel-item
                  v-for="(item, idx) in messages"
                  :key="item.id"
                  :value="idx"
                >
                  <div class="d-flex justify-center align-center fill-height">
                    <v-img
                      :src="item.downloadURL"
                      :alt="item.fileName"
                      contain
                      max-height="100%"
                      max-width="100%"
                    >
                      <template v-slot:placeholder>
                        <div class="d-flex justify-center align-center fill-height">
                          <v-progress-circular indeterminate color="white"></v-progress-circular>
                        </div>
                      </template>
                    </v-img>
                  </div>
                </v-carousel-item>
              </v-carousel>
            </div>

            <div
              class="thumbnail-bar d-flex align-center px-4 py-3"
              style="background-color: rgba(0, 0, 0, 0.6); overflow-x: auto; flex-shrink: 0;"
            >
              <div
                v-for="(item, idx) in messages"
                :key="item.id"
                class="thumbnail-item mr-3 flex-shrink-0"
                :class="{ 'is-active': idx === currentIndex }"
                @click="currentIndex = idx"
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
import { ref, computed, watch, onUnmounted } from 'vue';
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

const isUploadDialogOpen = ref(false);
const filePickerModel = ref([]);
const stagedFiles = ref([]);
const isUploading = ref(false);

const isDeleteDialogOpen = ref(false);
const pendingDeleteItem = ref(null);
const isDeleting = ref(false);

let unsubscribe = null;

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
    } else {
      stopListening();
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  stopListening();
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
.thumbnail-bar {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
}
.thumbnail-bar::-webkit-scrollbar {
  height: 8px;
}
.thumbnail-bar::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.thumbnail-item {
  position: relative;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 6px;
  transition: border-color 0.15s ease;
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
</style>
