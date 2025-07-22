<template>
  <v-card class="d-flex flex-column" style="height: 100vh;">
    <v-toolbar color="primary" density="compact" dark>
      <v-toolbar-title>{{ title }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="$emit('close')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>

    <v-card-text class="flex-grow-1 pa-6">
      <v-container fluid>
        <v-row>
          <v-col cols="12">
            <div class="section-container">
              <h2 class="section-title">1. 下載現有資料範本</h2>
              <p class="section-subtitle">
                勾選您想更新的資料表，下載目前的資料作為編輯範本。 <strong class="text-red">請勿修改檔案中的分頁名稱及欄位標題。</strong>
              </p>
              
              <div class="checkbox-group my-4">
                <v-checkbox
                  v-for="item in availableSheets"
                  :key="item.value"
                  v-model="selectedSheets"
                  :label="item.label"
                  :value="item.value"
                  density="compact"
                  hide-details
                ></v-checkbox>
              </div>

              <v-btn
                color="blue"
                variant="tonal"
                prepend-icon="mdi-download"
                :disabled="selectedSheets.length === 0 || isDownloading"
                :loading="isDownloading"
                @click="handleDownload"
              >
                下載 EXCEL
              </v-btn>
            </div>
          </v-col>
        </v-row>

        <v-divider class="my-8"></v-divider>

        <v-row>
          <v-col cols="12">
            <div class="section-container">
              <h2 class="section-title">2. 上傳已修改的 Excel 檔案</h2>
              <p class="section-subtitle">
                選擇您已編輯完成的 Excel 檔案。系統將會根據檔案中的分頁名稱與欄位標題，覆蓋線上對應的資料。
              </p>

       <v-row class="my-4">
    <v-col cols="12" md="4" class="pa-0">
      <v-file-input
        v-model="fileToUpload"
        label="點擊此處選擇檔案"
        accept=".xlsx, .xls"
        variant="outlined"
        density="compact"
        hide-details
      ></v-file-input>
    </v-col>
  </v-row>

              <v-btn
                color="primary"
                variant="elevated"
                prepend-icon="mdi-upload"
                :disabled="!fileToUpload || isUploading"
                :loading="isUploading"
                @click="confirmUpload"
              >
                確認更新
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>
    
    <v-dialog v-model="confirmDialog" max-width="500px" persistent>
      <v-card>
        <v-card-title class="text-h5 d-flex align-center">
          <v-icon color="red" class="mr-3">mdi-alert</v-icon>請再次確認
        </v-card-title>
        <v-card-text class="py-4">
        <strong class="text-red">
          新資料將會完全覆蓋線上的舊資料，此操作無法復原。
          <br><br>
          請確認您已備份或不再需要舊資料。
          </strong>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="confirmDialog = false" :disabled="isUploading">取消</v-btn>
          <v-btn color="red" variant="elevated" @click="handleUpload" :loading="isUploading">繼續更新</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
<v-overlay v-model="isUploading" class="align-center justify-center" persistent>
    <div class="d-flex flex-column align-center">
        <v-progress-circular indeterminate color="blue" size="64"></v-progress-circular>
        <p class="mt-4 text-h6 progress-text">
          {{ snackbar.text }}
        </p>
    </div>
</v-overlay>

    <v-snackbar v-model="resultSnackbar.visible" :color="resultSnackbar.color" :timeout="4000">
      {{ resultSnackbar.text }}
    </v-snackbar>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { downloadSheetsAsExcel, uploadFile, uploadExcelToOverwrite, backupSpreadsheet } from '@/api';

const emit = defineEmits(['close']);
const route = useRoute();
const projectName = computed(() => route.params.projectName);
const title = computed(() => `${projectName.value} | 更新銷控資訊`);

const availableSheets = ref([
  { label: '面積', value: '面積' },
  { label: '價格', value: '價格' },
  { label: '車位', value: '車位' },
  { label: '匯款帳號', value: '匯款帳號' },
]);
const selectedSheets = ref([]);
// ✅ 核心修正 #3: 將 ref 的初始值改回 null
const fileToUpload = ref(null);

const isDownloading = ref(false);
const isUploading = ref(false);
const confirmDialog = ref(false);
const snackbar = ref({ text: '' });
const resultSnackbar = ref({ visible: false, text: '', color: 'success' });

const handleDownload = async () => {
  isDownloading.value = true;
  try {
    const response = await downloadSheetsAsExcel(projectName.value, selectedSheets.value);
    if (response.status !== 'success') throw new Error(response.message);

    const byteCharacters = atob(response.file);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = response.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showResultSnackbar('檔案下載成功', 'success');
  } catch (error) {
    console.error('Download failed:', error);
    showResultSnackbar(`下載失敗: ${error.message}`, 'error');
  } finally {
    isDownloading.value = false;
  }
};

const confirmUpload = () => {
  // ✅ 核心修正 #4: 判斷式改回檢查 value 是否為 truthy (不為 null)
  if (fileToUpload.value) {
    confirmDialog.value = true;
  }
};

const handleUpload = async () => {
  // ✅ 核心修正 #5: 直接使用 fileToUpload.value
  const file = fileToUpload.value;
  if (!file) return;

  isUploading.value = true;
  confirmDialog.value = false;
  let uploadedFileId = null;

  try {
    snackbar.value.text = '1/4 正在上傳檔案...';
    const base64 = await fileToBase64(file);
    const uploadResponse = await uploadFile(file.name, base64);
    if (uploadResponse.status !== 'success' || !uploadResponse.data.fileId) {
        throw new Error(uploadResponse.message || '上傳檔案至暫存區失敗');
    }
    uploadedFileId = uploadResponse.data.fileId;
    
    snackbar.value.text = '2/4 正在備份線上資料...';
    const backupResponse = await backupSpreadsheet(projectName.value);
    if (backupResponse.status !== 'success') {
        throw new Error(backupResponse.message || '備份線上資料失敗');
    }
    
    snackbar.value.text = '3/4 正在驗證與更新資料...';
    const overwriteResponse = await uploadExcelToOverwrite(projectName.value, uploadedFileId);
    if (overwriteResponse.status !== 'success') {
        throw new Error(overwriteResponse.message || '後端更新資料時發生錯誤');
    }
    
    snackbar.value.text = '4/4 更新完成！';
    showResultSnackbar(overwriteResponse.message, 'success');
    fileToUpload.value = null; // 清空選擇的檔案

  } catch (error) {
    console.error('Upload process failed:', error);
    showResultSnackbar(`更新失敗: ${error.message}`, 'error');
  } finally {
    isUploading.value = false;
  }
};

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

const showResultSnackbar = (text, color) => {
  resultSnackbar.value.text = text;
  resultSnackbar.value.color = color;
  resultSnackbar.value.visible = true;
};
</script>

<style scoped>
.section-container {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 24px;
  background-color: #fafafa;
}
.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}
.section-subtitle {
  font-size: 0.9rem;
  color: #666;
  margin-top: 4px;
}
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-text {
  background-color: rgba(0, 0, 0, 0.3); /* 半透明的黑色背景 */
  padding: 8px 16px; /* 增加文字的上下和左右內邊距 */
  border-radius: 8px; /* 設定圓角 */
  margin-top: 24px !important; /* 稍微增加與上方讀取動畫的距離 */
  display: inline-block; /* 讓背景寬度自適應文字長度 */
}
</style>