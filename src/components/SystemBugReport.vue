<template>
  <!-- FAB 浮動按鈕 -->
  <v-btn
    v-if="showFab"
    icon
    color="red-darken-1"
    size="small"
    class="bug-report-fab"
    elevation="6"
    @click="openDialog"
  >
    <v-icon>mdi-help</v-icon>
    <v-tooltip activator="parent" location="start">
      系統問題回報
    </v-tooltip>
  </v-btn>

  <!-- 回報 Dialog -->
  <v-dialog v-model="dialogVisible" max-width="650" persistent scrollable>
    <v-card>
      <!-- 標題列 -->
      <v-card-title class="d-flex align-center bg-red-darken-1 text-white pa-4">
        <v-icon start color="white">mdi-help</v-icon>
        <span class="text-h6 font-weight-bold">系統問題回報</span>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" color="white" @click="closeDialog" />
      </v-card-title>

      <v-card-text class="pa-4">
        <v-form ref="formRef" v-model="formValid" lazy-validation>
          <!-- 回報者資訊 -->
          <div class="text-subtitle-2 font-weight-bold text-grey-darken-2 mb-2">
            <v-icon size="small" class="mr-1">mdi-account</v-icon>
            回報者資訊
          </div>
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.reporterName"
                label="姓名"
                prepend-inner-icon="mdi-account-outline"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
                :readonly="!!userStore.user?.name"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.reporterPhone"
                label="電話"
                prepend-inner-icon="mdi-phone-outline"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
                :readonly="!!userStore.user?.key"
              />
            </v-col>
          </v-row>

          <v-divider class="my-3" />

          <!-- 問題環境 -->
          <div class="text-subtitle-2 font-weight-bold text-grey-darken-2 mb-2">
            <v-icon size="small" class="mr-1">mdi-map-marker</v-icon>
            問題環境
          </div>
          <v-row dense>
            <!-- 頁面路徑與建案 ID 在背景自動蒐集，不在 UI 顯示 -->
            <v-col cols="12" v-if="formData.projectName">
              <v-text-field
                v-model="formData.projectName"
                label="建案名稱"
                prepend-inner-icon="mdi-domain"
                variant="outlined"
                density="compact"
                readonly
                bg-color="grey-lighten-4"
              />
            </v-col>
          </v-row>

          <v-divider class="my-3" />

          <!-- 問題描述 -->
          <div class="text-subtitle-2 font-weight-bold text-grey-darken-2 mb-2">
            <v-icon size="small" class="mr-1">mdi-text-box-outline</v-icon>
            問題描述
          </div>
          <v-textarea
            v-model="formData.description"
            label="請詳細描述遇到的問題..."
            :rules="[rules.required]"
            variant="outlined"
            density="compact"
            rows="4"
            auto-grow
            counter
          />

          <v-divider class="my-3" />

          <!-- 附件圖片 -->
          <div class="text-subtitle-2 font-weight-bold text-grey-darken-2 mb-2">
            <v-icon size="small" class="mr-1">mdi-paperclip</v-icon>
            附件圖片（選填，最多 5 張）
          </div>
          <v-file-input
            v-model="attachmentFiles"
            label="點擊上傳截圖或照片"
            prepend-icon=""
            prepend-inner-icon="mdi-camera-plus"
            variant="outlined"
            density="compact"
            accept="image/jpeg,image/png,image/webp"
            multiple
            :rules="[rules.maxFiles, rules.maxFileSize]"
            show-size
            counter
            chips
            @update:modelValue="onFilesChange"
          />

          <!-- 圖片預覽 -->
          <v-row v-if="previewUrls.length > 0" dense class="mt-2">
            <v-col
              v-for="(url, index) in previewUrls"
              :key="index"
              cols="4"
              sm="3"
            >
              <v-card variant="outlined" class="pa-1 position-relative">
                <v-img :src="url" aspect-ratio="1" cover class="rounded" />
                <v-btn
                  icon="mdi-close-circle"
                  size="x-small"
                  color="error"
                  variant="flat"
                  class="position-absolute"
                  style="top: 2px; right: 2px; z-index: 1;"
                  @click="removeFile(index)"
                />
              </v-card>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <!-- 底部操作列 -->
      <v-divider />
      <v-card-actions class="pa-4">
        <v-chip size="small" variant="tonal" color="grey">
          <v-icon start size="small">mdi-information-outline</v-icon>
          回報後將通知系統管理員
        </v-chip>
        <v-spacer />
        <v-btn variant="text" color="grey" @click="closeDialog">取消</v-btn>
        <v-btn
          color="red-darken-1"
          variant="elevated"
          :loading="submitting"
          :disabled="!formValid"
          prepend-icon="mdi-send"
          @click="handleSubmit"
        >
          送出回報
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 成功提示 -->
  <v-snackbar v-model="successSnackbar" color="success" timeout="4000" location="top">
    <v-icon start>mdi-check-circle</v-icon>
    問題回報已送出，感謝您的回饋！系統管理員將盡快處理。
  </v-snackbar>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
import { functions } from '@/firebase';
import { httpsCallable } from 'firebase/functions';
import { useToast } from 'vue-toastification';

const route = useRoute();
const userStore = useUserStore();
const projectStore = useProjectStore();
const toast = useToast();

// --- 狀態 ---
const dialogVisible = ref(false);
const formRef = ref(null);
const formValid = ref(false);
const submitting = ref(false);
const successSnackbar = ref(false);
const attachmentFiles = ref([]);
const previewUrls = ref([]);

// 防濫用：記錄最近回報時間
const recentSubmissions = ref([]);

// --- 表單資料 ---
const formData = ref({
  reporterName: '',
  reporterPhone: '',
  description: '',
  pagePath: '',
  pageName: '',
  projectId: '',
  projectName: '',
});

// --- FAB 顯示條件 ---
// 所有頁面都顯示（含公開頁面），讓未登入的使用者也能回報問題
const showFab = computed(() => {
  return true;
});

// --- 驗證規則 ---
const rules = {
  required: (v) => !!v || '此欄位為必填',
  maxFiles: (files) => {
    if (!files || !Array.isArray(files)) return true;
    return files.length <= 5 || '最多上傳 5 張圖片';
  },
  maxFileSize: (files) => {
    if (!files || !Array.isArray(files)) return true;
    const oversized = files.some(f => f.size > 5 * 1024 * 1024);
    return !oversized || '單張圖片不可超過 5MB';
  },
};

// --- 方法 ---

/**
 * 開啟回報 Dialog，自動帶入上下文
 */
const openDialog = () => {
  // 自動帶入已登入用戶資訊
  formData.value.reporterName = userStore.user?.name || '';
  formData.value.reporterPhone = userStore.user?.key || '';

  // 自動帶入當前頁面資訊
  formData.value.pagePath = route.fullPath || '';
  formData.value.pageName = String(route.name || '');

  // 自動帶入建案資訊（若有）
  const currentProject = projectStore.currentProject;
  formData.value.projectId = projectStore.currentProjectId || route.params?.projectId || '';
  formData.value.projectName = currentProject?.name || projectStore.idToNameMap?.[formData.value.projectId] || '';

  // 重置附件
  attachmentFiles.value = [];
  previewUrls.value = [];

  dialogVisible.value = true;
};

/**
 * 關閉 Dialog
 */
const closeDialog = () => {
  dialogVisible.value = false;
  // 清除圖片預覽 URL
  previewUrls.value.forEach(url => URL.revokeObjectURL(url));
  previewUrls.value = [];
};

/**
 * 檔案選擇變更時產生預覽
 */
const onFilesChange = (files) => {
  // 先釋放舊的 URL
  previewUrls.value.forEach(url => URL.revokeObjectURL(url));
  previewUrls.value = [];

  if (files && Array.isArray(files)) {
    previewUrls.value = files.map(f => URL.createObjectURL(f));
  }
};

/**
 * 移除已選擇的附件
 */
const removeFile = (index) => {
  URL.revokeObjectURL(previewUrls.value[index]);
  previewUrls.value.splice(index, 1);
  attachmentFiles.value.splice(index, 1);
};

/**
 * 防濫用檢查：每小時限制 5 次
 */
const checkRateLimit = () => {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  // 清除過期的記錄
  recentSubmissions.value = recentSubmissions.value.filter(t => t > oneHourAgo);
  if (recentSubmissions.value.length >= 5) {
    return false;
  }
  return true;
};

/**
 * 將檔案轉為 Base64
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Content = reader.result.split(',')[1];
      resolve({
        filename: file.name,
        content: base64Content,
        contentType: file.type,
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * 提交回報
 */
const handleSubmit = async () => {
  // 表單驗證
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  // 防濫用檢查
  if (!checkRateLimit()) {
    toast.error('您的回報過於頻繁，請稍後再試（每小時限制 5 次）');
    return;
  }

  submitting.value = true;
  try {
    // 處理附件 Base64 編碼
    const processedAttachments = await Promise.all(
      (attachmentFiles.value || []).map(file => fileToBase64(file))
    );

    // 呼叫 Cloud Function
    const submitBugReport = httpsCallable(functions, 'submitBugReport');
    const result = await submitBugReport({
      reporterName: formData.value.reporterName,
      reporterPhone: formData.value.reporterPhone,
      description: formData.value.description,
      pagePath: formData.value.pagePath,
      pageName: formData.value.pageName,
      projectId: formData.value.projectId || null,
      projectName: formData.value.projectName || null,
      userKey: userStore.user?.key || null,
      userAgent: navigator.userAgent,
      attachments: processedAttachments,
    });

    if (result.data.status === 'success') {
      // 記錄提交時間（防濫用）
      recentSubmissions.value.push(Date.now());
      successSnackbar.value = true;
      closeDialog();
    } else {
      throw new Error(result.data.message || '送出失敗');
    }
  } catch (error) {
    console.error('[SystemBugReport] 送出失敗:', error);
    toast.error('問題回報送出失敗：' + (error.message || '未知錯誤'));
  } finally {
    submitting.value = false;
  }
};

// 清理預覽 URL
onBeforeUnmount(() => {
  previewUrls.value.forEach(url => URL.revokeObjectURL(url));
});
</script>

<style scoped>
.bug-report-fab {
  position: fixed !important;
  bottom: 80px;
  right: 20px;
  z-index: 1000;
  transition: transform 0.2s ease;
}

.bug-report-fab:hover {
  transform: scale(1.1);
}

/* 行動裝置位置調整 */
@media (max-width: 600px) {
  .bug-report-fab {
    bottom: 72px;
    right: 12px;
  }
}
</style>
