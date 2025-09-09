<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <v-card v-if="isLoading || error" :loading="isLoading" class="pa-4">
          <v-card-text>
            <div v-if="isLoading" class="text-center">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
              <p class="mt-3">正在讀取建案設定...</p>
            </div>
            <v-alert v-if="error" type="error" :text="error"></v-alert>
          </v-card-text>
        </v-card>

        <v-card v-else-if="uploadSuccess">
          <v-card-text class="text-center py-12">
            <v-icon size="80" color="success" class="mb-4">mdi-check-circle-outline</v-icon>
            <h2 class="text-h4 mb-4">上傳成功！</h2>
            <p class="text-body-1 mb-6">您的驗屋報告已成功提交處理，一封包含詳細上傳紀錄的確認信，將在幾分鐘內寄送至您的電子信箱。</p>
            <v-btn color="primary" size="large" @click="resetPage" variant="elevated">返回上傳頁面</v-btn>
          </v-card-text>
        </v-card>
        
        <v-card v-else>
             <div class="text-center mb-6"> <v-img 
                :src="fuyuLogo"
                max-width="200"
                class="mx-auto"
                alt="建案 Logo"
              ></v-img>
            </div>
          <v-card-title class="text-h5 text-center font-weight-bold py-3 bg-blue-grey-lighten-5">
            {{ config.projectName }} - 驗屋報告上傳(致茂專用)
          </v-card-title>
          <v-divider></v-divider>

           <v-card-text>

            <v-alert
              variant="tonal"
              color="error"
              icon="mdi-information-outline"
              density="compact"
              class="mb-6"
            >
              <p class="text-subtitle-2 font-weight-bold">上傳提醒</p>
              <p class="text-body-2">
                檔案名稱需與戶別名稱一致（例如 A1-02），並請注意英文字母大小寫需完全相符。
              </p>
            </v-alert>
           
          <label for="file-upload-input">
              <div
                class="file-drop-zone"
                :class="{ 'is-active': isDragActive }"
                @dragover.prevent="isDragActive = true"
                @dragleave.prevent="isDragActive = false"
                @drop.prevent="handleFileDrop"
              >
                <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-cloud-upload-outline</v-icon>
                <p class="text-grey">將 PDF 檔案拖曳至此，或點擊上傳</p>
                <p class="text-caption text-grey mt-2">（可一次選取多個檔案，單檔大小限制 30MB）</p>
              </div>
            </label>
             <input
              id="file-upload-input"
              ref="fileInputRef"
              type="file"
              accept=".pdf"
              hidden
              multiple
              @change="handleFileSelect"
            >
            <div v-if="allFiles.length > 0" class="mt-6">
              <v-alert v-if="matchedFiles.length > 0" type="success" variant="tonal" class="mb-4">
                <template v-slot:title><div class="font-weight-bold">符合的檔案 ({{ matchedFiles.length }} 筆)</div></template>
                <v-list density="compact" bg-color="transparent">
                  <v-list-item v-for="file in matchedFiles" :key="file.name" :title="file.name" prepend-icon="mdi-check"></v-list-item>
                </v-list>
              </v-alert>
              
              <v-alert v-if="mismatchedFiles.length > 0" type="error" variant="tonal">
                <template v-slot:title><div class="font-weight-bold">不符合的檔案 ({{ mismatchedFiles.length }} 筆)</div></template>
                <v-list density="compact" bg-color="transparent">
                  <v-list-item v-for="file in mismatchedFiles" :key="file.name" prepend-icon="mdi-close">
                    <v-list-item-title>{{ file.name }}</v-list-item-title>
                    <v-list-item-subtitle>{{ file.reason }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-alert>
            </div>

            <v-form ref="formRef" class="mt-6">
              <v-text-field
                v-model="email"
                label="您的 EMAIL"
                variant="outlined"
                placeholder="請輸入 EMAIL 以接收上傳紀錄"
                :rules="[v => !!v || '必填', v => /.+@.+\..+/.test(v) || 'E-mail 格式不正確']"
                @update:modelValue="formRef.validate()"
              ></v-text-field>
            </v-form>
            </v-card-text>
          
          <v-divider></v-divider>
          <v-card-actions class="pa-4">
            <v-spacer></v-spacer>
            
            <v-btn
              color="success"
              size="x-large"
              @click="handleSubmit"
              :loading="isUploading"
              :disabled="matchedFiles.length === 0 || !isEmailValid"
              variant="elevated"
              min-width="150"
            >
              <v-icon start>mdi-upload</v-icon>
              確認上傳
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { projectUploadConfig } from '@/config/projectUploadData.js';
import { triggerSpecialReportUpload } from '@/api';
import { useToast } from 'vue-toastification';
import fuyuLogo from '@/assets/fuyuLogo.png';


// --- 核心狀態 ---
const route = useRoute();
const toast = useToast();
const isLoading = ref(true);
const error = ref(null);
const projectId = ref(null);
const config = ref(null);
const validUnitIds = ref(new Set()); // 使用 Set 提升查找效能

// --- 表單與檔案狀態 ---
const formRef = ref(null);
const email = ref('');
const isEmailValid = ref(false);
const fileInputRef = ref(null);
const isDragActive = ref(false);
const allFiles = ref([]);
const matchedFiles = ref([]);
const mismatchedFiles = ref([]);

// --- 流程控制狀態 ---
const isUploading = ref(false);
const uploadSuccess = ref(false);

// --- 初始化 ---
onMounted(() => {
  projectId.value = route.params.projectId;
  const projectConfig = projectUploadConfig[projectId.value];
  
  if (projectConfig) {
    config.value = projectConfig;
    validUnitIds.value = new Set(projectConfig.unitIdList);
  } else {
    error.value = `找不到建案 ID [${projectId.value}] 的設定資料。請確認網址或設定檔是否正確。`;
  }
  isLoading.value = false;
});

// --- 監聽 Email 表單的驗證狀態 ---
watch(email, async () => {
    if (formRef.value) {
        const { valid } = await formRef.value.validate();
        // ✅ 在這裡加入一行 console.log，用來在主控台觀察驗證結果
        console.log('Email validation result is:', valid);
        isEmailValid.value = valid;
    }
});


function handleFileDrop(event) {
  isDragActive.value = false;
  processFileList(event.dataTransfer.files);
}

function handleFileSelect(event) {
  processFileList(event.target.files);
}

function processFileList(fileList) {
  allFiles.value = Array.from(fileList);
  matchedFiles.value = [];
  mismatchedFiles.value = [];

  allFiles.value.forEach(file => {
    const { isValid, reason } = validateFile(file);
    if (isValid) {
      matchedFiles.value.push(file);
    } else {
      mismatchedFiles.value.push({ name: file.name, reason });
    }
  });
}

function validateFile(file) {
  // 1. 檢查格式
  if (file.type !== 'application/pdf') {
    return { isValid: false, reason: '格式錯誤，僅限 PDF' };
  }
  // 2. 檢查大小
  if (file.size > 30 * 1024 * 1024) {
    return { isValid: false, reason: '檔案過大，超過 30MB' };
  }
  // 3. 檢查檔名
  const fileNameWithoutExt = file.name.replace(/\.pdf$/i, '');
  if (!validUnitIds.value.has(fileNameWithoutExt)) {
    return { isValid: false, reason: '檔案名稱與戶別不符' };
  }
  return { isValid: true, reason: '' };
}

// --- 核心上傳邏輯 ---
async function handleSubmit() {
  isUploading.value = true;
  try {
    // 將檔案轉換為 Base64
    const filePromises = matchedFiles.value.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({
          name: file.name,
          base64: reader.result.split(',')[1] // 只取 Base64 內容
        });
        reader.onerror = (error) => reject(error);
      });
    });
    const filesAsBase64 = await Promise.all(filePromises);
    
    // 準備 payload
    const payload = {
      projectId: projectId.value,
      email: email.value,
      files: filesAsBase64,
      mismatchedFiles: mismatchedFiles.value.map(f => f.name),
      projectName: config.value.projectName,
      senderName: config.value.senderName,
      driveUrlMap: config.value.driveUrlMap,
    };

    // 呼叫後端
    const result = await triggerSpecialReportUpload(payload);

    if (result.status === 'success') {
      uploadSuccess.value = true;
      toast.success('上傳成功！');
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    toast.error(`上傳失敗: ${error.message}`);
  } finally {
    isUploading.value = false;
  }
}

// --- 重置頁面 ---
function resetPage() {
  uploadSuccess.value = false;
  email.value = '';
  allFiles.value = [];
  matchedFiles.value = [];
  mismatchedFiles.value = [];
  if (formRef.value) formRef.value.resetValidation();
}
</script>

<style scoped>
.file-drop-zone {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;
}
.file-drop-zone:hover, .file-drop-zone.is-active {
  background-color: #f8f9fa;
  border-color: #1a73e8; /* Vuetify primary color */
}
</style>