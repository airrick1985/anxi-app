<template>
  <v-container>

      <v-row class="mb-4">
      <v-col>
        <v-btn
          @click="goBackToSalesControl"
          color="grey-darken-1"
          variant="outlined"
          prepend-icon="mdi-arrow-left"
        >
          返回銷控系統
        </v-btn>
      </v-col>
    </v-row>
    
    <v-row>
      <v-col cols="12" md="6">
        <v-card class="pa-4" elevation="2">
          <v-card-title class="text-h5 text-primary">
            建案設定
          </v-card-title>
          <v-card-subtitle>管理建案的全域設定資訊</v-card-subtitle>
          <v-divider class="my-4"></v-divider>

          <v-skeleton-loader v-if="projectLoading" type="article"></v-skeleton-loader>

          <v-form v-if="!projectLoading && project" ref="projectForm">
            <v-text-field
              v-model="project.name"
              label="建案名稱"
              variant="outlined"
              density="compact"
              readonly
              class="mb-4"
            ></v-text-field>
            <v-text-field
              v-model="project.parkingSlideId_sales"
              label="銷控模式車位簡報 ID"
              variant="outlined"
              density="compact"
              class="mb-4"
              hint="Google Slide 網址中的 ID"
              persistent-hint
            ></v-text-field>
            <v-text-field
              v-model="project.parkingSlideId_quote"
              label="報價模式車位簡報 ID"
              variant="outlined"
              density="compact"
              class="mb-4"
              hint="Google Slide 網址中的 ID"
              persistent-hint
            ></v-text-field>
            <v-text-field
              v-model="project.activityMessageSlideId"
              label="活動訊息簡報 ID"
              variant="outlined"
              density="compact"
              class="mb-4"
              hint="Google Slide 網址中的 ID"
              persistent-hint
            ></v-text-field>

            <v-divider class="my-4"></v-divider>
            <div class="mb-4">
              <p class="text-subtitle-1 mb-2">合約方式設定</p>
              <div class="mb-2">
                <v-chip
                  v-for="cType in project.contractTypes"
                  :key="cType"
                  class="mr-2 mb-2"
                  :closable="cType !== '一般合約'"
                  @click:close="removeContractType(cType)"
                  label
                >
                  {{ cType }}
                </v-chip>
              </div>
              <div class="d-flex align-center">
                <v-text-field
                  v-model="newContractType"
                  label="新增合約方式"
                  variant="outlined"
                  density="compact"
                  hide-details
                  @keydown.enter.prevent="addContractType"
                ></v-text-field>
                <v-btn
                  class="ml-2"
                  icon="mdi-plus"
                  color="primary"
                  @click="addContractType"
                  variant="tonal"
                ></v-btn>
              </div>
            </div>
            <v-btn
              color="primary"
              @click="saveProjectSettings"
              :loading="isSavingProject"
              block
              class="mt-4"
            >
              儲存專案設定
            </v-btn>
          </v-form>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card class="pa-4" elevation="2">
          <v-card-title class="text-h5 text-teal">
            銷控狀態參數
          </v-card-title>
          <v-card-subtitle>管理銷控狀態的顏色與排序</v-card-subtitle>
          <v-divider class="my-4"></v-divider>
          
          <v-skeleton-loader v-if="paramsLoading" type="list-item-two-line@4"></v-skeleton-loader>

          <div v-if="!paramsLoading">
            <v-list lines="two">
              <v-list-item
                v-for="param in salesParameters"
                :key="param.id"
                class="mb-2"
                elevation="1"
                border
              >
                <template v-slot:prepend>
                  <v-avatar :color="param.colorCode" size="36" class="mr-4 elevation-2"></v-avatar>
                </template>

                <v-list-item-title class="font-weight-bold">{{ param.statusName }}</v-list-item-title>
                <v-list-item-subtitle>
                  排序: {{ param.order }} | 色碼: {{ param.colorCode }}
                </v-list-item-subtitle>
                
                <template v-slot:append>
                  <v-btn icon="mdi-pencil" variant="text" size="small" @click="editParameter(param)"></v-btn>
                  <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click="confirmDelete(param)"></v-btn>
                </template>
              </v-list-item>
            </v-list>

            <v-btn
              color="teal"
              @click="openParameterDialog()"
              prepend-icon="mdi-plus"
              class="mt-4"
              block
            >
              新增狀態
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

       <v-row>
      <v-col cols="12">
        <v-card class="pa-4" elevation="2">
          <v-card-title class="text-h5 text-indigo">
            <v-icon start>mdi-image-multiple</v-icon>
            銷控圖片管理
          </v-card-title>
          <v-card-subtitle>上傳並管理用於銷控系統的共用圖片 (例如：傢配圖、格局圖)
          </v-card-subtitle>
   
          <v-divider class="my-4"></v-divider>

<v-row>
  <v-col cols="12" md="5">
    <v-file-input
      v-model="stagedFilesModel"
      label="點擊選擇圖片 (可多選)"
      variant="outlined"
      multiple
      accept="image/png, image/jpeg"
      prepend-icon="mdi-camera"
      :loading="isReadingFiles"
      clearable
      chips
    ></v-file-input>
    <v-btn
      @click="uploadAllStagedFiles"
      :loading="isUploading"
      :disabled="stagedFiles.length === 0"
      color="indigo"
      block
      size="large"
      prepend-icon="mdi-upload"
    >
      上傳 {{ stagedFiles.length }} 個已選檔案
    </v-btn>
    <v-alert
      v-if="uploadErrors.length > 0"
      type="error"
      variant="tonal"
      class="mt-4"
      density="compact"
    >
      <p v-for="(error, i) in uploadErrors" :key="i">{{ error }}</p>
    </v-alert>
  </v-col>

  <v-col cols="12" md="7">
    <v-sheet
      border
      rounded="lg"
      class="pa-4"
      style="max-height: 400px; overflow-y: auto;"
      v-if="stagedFiles.length > 0"
    >
      <div v-for="(item, index) in stagedFiles" :key="item.id" class="mb-4">
        <div class="d-flex align-start">
          <v-avatar rounded="lg" size="80" class="mr-4 elevation-1">
            <v-img :src="item.previewUrl" cover></v-img>
          </v-avatar>
          <div class="flex-grow-1">
            <v-text-field
              v-model="item.imageName"
              label="圖片名稱"
              variant="outlined"
              density="compact"
              hide-details="auto"
              :disabled="item.useFilename"
              :rules="[v => !item.useFilename ? !!v || '名稱為必填' : true]"
            ></v-text-field>
            <v-checkbox
              v-model="item.useFilename"
              label="使用原始檔名作為圖片名稱"
              density="compact"
              hide-details
            ></v-checkbox>
            <div class="text-caption text-grey mt-1">
              {{ (item.file.size / 1024).toFixed(1) }} KB | {{ item.width }}x{{ item.height }}px
            </div>
            <v-alert
              v-if="item.error"
              type="warning"
              variant="tonal"
              density="compact"
              class="mt-2 text-caption"
            >
              {{ item.error }}
            </v-alert>
          </div>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="removeStagedFile(item.id)"
          ></v-btn>
        </div>
        <v-divider v-if="index < stagedFiles.length - 1" class="mt-4"></v-divider>
      </div>
    </v-sheet>
    <v-sheet
      v-else
      border
      rounded="lg"
      class="pa-4 d-flex justify-center align-center text-center"
      height="100%"
      min-height="200"
    >
      <div class="text-grey">
        <v-icon size="48">mdi-image-plus-outline</v-icon>
        <p>請從左側選擇要上傳的圖片</p>
      </div>
    </v-sheet>
  </v-col>
</v-row>

          <v-divider class="my-4"></v-divider>
          <h3 class="text-subtitle-1 mb-2">已上傳圖片列表</h3>
          
          <div v-if="!imagesLoading">
            <v-list v-if="salesImages.length > 0" lines="two">
              <v-list-item
                v-for="image in salesImages"
                :key="image.id"
                class="mb-2"
                elevation="1"
                border
              >
                <template v-slot:prepend>
                <v-avatar
                  rounded="lg"
                  size="64"
                  class="mr-4 elevation-1"
                  @click="openImageViewer(image)"
                  style="cursor: pointer;"
                >
                  <v-img :src="image.downloadURL" cover>
                    </v-img>
                </v-avatar>
              </template>

                <v-list-item-title class="font-weight-bold">{{ image.imageName }}</v-list-item-title>
                <v-list-item-subtitle>
                  檔名: {{ image.fileName }}
                  <span class="d-none d-sm-inline"> | 上傳於: 
                    {{ image.createdAt ? new Date(image.createdAt.seconds * 1000).toLocaleDateString() : 'N/A' }}
                  </span>
                </v-list-item-subtitle>
                
                <template v-slot:append>
                  <v-btn
                      icon="mdi-upload"
                      variant="text"
                      size="small"
                      title="重新上傳"
                      @click="triggerReupload(image)"
                    ></v-btn>
                    <v-btn
                      icon="mdi-delete"
                      variant="text"
                      color="error"
                      size="small"
                      title="刪除"
                      @click="confirmImageDelete(image)"
                    ></v-btn>
                  </template>
              </v-list-item>
            </v-list>
             
            <v-alert
              v-else
              type="info"
              variant="tonal"
              border="start"
              density="compact"
            >
              目前尚無圖片，請使用上方功能上傳。
            </v-alert>
          </div>

          <input
            type="file"
            ref="reuploadInput"
            @change="handleReuploadFile"
            accept="image/png, image/jpeg"
            style="display: none"
          />

          </v-card>
      </v-col>
      
    </v-row>

   <v-dialog v-model="parameterDialog" persistent max-width="500px">
  <v-card>
    <v-card-title class="bg-primary text-white">
      <span class="text-h5">{{ editingParameter.id ? '編輯' : '新增' }}銷控狀態</span>
    </v-card-title>
    
    <v-card-text class="pt-4">
      <v-form ref="parameterForm">
        <v-text-field
          v-model="editingParameter.statusName"
          label="狀態名稱"
          variant="outlined"
          density="compact"
          :rules="[v => !!v || '此為必填欄位']"
          required
          class="mb-4"
        ></v-text-field>

        <div class="mb-4">
          <p class="text-subtitle-1 mb-2">狀態顏色</p>
          <v-color-picker
            v-model="editingParameter.colorCode"
            show-swatches
            swatches-max-height="100"
            hide-inputs
            width="100%"
            elevation="1"
          ></v-color-picker>
            <v-text-field
              v-model="editingParameter.colorCode"
              label="色碼 (Hex)"
              variant="outlined"
              density="compact"
              class="mt-2"
              :rules="[v => !!v || '此為必填欄位']"
              required
            >
            <template v-slot:prepend-inner>
                <div 
                    :style="{ 
                        backgroundColor: editingParameter.colorCode, 
                        width: '24px', 
                        height: '24px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        cursor: 'pointer'
                    }"
                 ></div>
            </template>
           </v-text-field>
        </div>

        <v-text-field
          v-model.number="editingParameter.order"
          label="排序"
          type="number"
          variant="outlined"
          density="compact"
          :rules="[v => v !== null && v !== '' || '此為必填欄位']"
          required
        >
    </v-text-field>
      </v-form>
    </v-card-text>
    
    <v-divider></v-divider>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="grey" variant="text" @click="closeParameterDialog">取消</v-btn>
      <v-btn color="primary" variant="flat" @click="saveParameter" :loading="isSavingParameter">儲存</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>

    <v-dialog v-model="deleteDialog" persistent max-width="400px">
        <v-card>
            <v-card-title class="text-h6 d-flex align-center bg-red-lighten-4">
          <v-icon start color="red-darken-2">mdi-alert-circle-outline</v-icon>
          確認刪除
        </v-card-title>
            <v-card-text>
                您確定要刪除「{{ parameterToDelete.statusName }}」這個銷控狀態嗎？此操作無法復原。
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="grey" text @click="deleteDialog = false">取消</v-btn>
                <v-btn color="error" text @click="executeDelete" :loading="isDeleting">確認刪除</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
        {{ snackbar.text }}
    </v-snackbar>

    <!-- 隱藏的 input 用於重新上傳圖片 -->

    <v-dialog v-model="deleteImageDialog" persistent max-width="450px">
      <v-card>
        <v-card-title class="text-h6 d-flex align-center bg-red-lighten-4">
          <v-icon start color="red-darken-2">mdi-alert-circle-outline</v-icon>
          確認刪除圖片
        </v-card-title>
        <v-card-text class="pt-4">
          您確定要刪除圖片
          <strong class="text-red-darken-2 mx-1">「{{ imageToDelete.imageName }}」</strong>
          嗎？
          <br>
          <br>
          此操作將會從資料庫和儲存空間中永久移除檔案，無法復原。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="deleteImageDialog = false">取消</v-btn>
          <v-btn color="error" text @click="executeImageDelete" :loading="isDeletingImage">
            確認刪除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

     <v-dialog
      v-model="imageViewerDialog"
      max-width="90vw"
      max-height="90vh"
    >
      <v-card class="d-flex flex-column">
        <v-toolbar density="compact" color="primary" dark>
          <v-toolbar-title class="text-white">{{ viewingImage?.imageName }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="imageViewerDialog = false" class="text-white">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <div class="flex-grow-1 d-flex justify-center align-center pa-2" style="background-color: rgba(0,0,0,0.7);">
          <v-img
            v-if="viewingImage"
            :src="viewingImage.downloadURL"
            contain
            max-height="calc(90vh - 48px)"
            max-width="90vw"
          ></v-img>
        </div>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
        {{ snackbar.text }}
    </v-snackbar>

    
    
  </v-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'; 
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import {
  getProjectSettings, 
  updateProjectSalesSettings, 
  listenToSalesParameters,
  addSalesParameter,
  updateSalesParameter,
  deleteSalesParameter,
  listenToSalesImages,
  uploadSalesImage,
  setSalesImageMetadata,
  deleteSalesImage,
} from '@/api';
import { serverTimestamp } from 'firebase/firestore';


const route = useRoute();
const router = useRouter(); 
const toast = useToast();
const projectId = ref(route.params.projectId);

// Project Settings State
const project = ref(null);
const projectLoading = ref(true);
const isSavingProject = ref(false);
const newContractType = ref(''); //  新增 contract type 輸入框的狀態


// Sales Parameters State
const salesParameters = ref([]);
const paramsLoading = ref(true);
let unsubscribeParams = null;

// Dialog State
const parameterDialog = ref(false);
const editingParameter = ref({});
const isSavingParameter = ref(false);
const parameterForm = ref(null);

// Delete Confirmation State
const deleteDialog = ref(false);
const parameterToDelete = ref({});
const isDeleting = ref(false);

// Snackbar State
const snackbar = ref({ show: false, text: '', color: 'success' });

//  START: 新增圖片管理相關 State
const salesImages = ref([]);
const imagesLoading = ref(true);
let unsubscribeImages = null;
const filesToUpload = ref([]);
const uploadQueue = ref([]); // { file, preview, imageName, useFilename, dimensions, progress, isUploading, nameError }
const isParsingFiles = ref(false);
const uploadQueueErrors = ref('');
const deleteImageDialog = ref(false);
const imageToDelete = ref({});
const isDeletingImage = ref(false);
const replaceFileInput = ref(null); // 用於觸發隱藏的 input
const imageToReplace = ref(null);

// 新增上傳功能需要的所有狀態
const stagedFilesModel = ref([]); // v-file-input 的 model
const stagedFiles = ref([]); // 存放處理過、待上傳的檔案
const isReadingFiles = ref(false); // 正在讀取檔案中的旗標
const isUploading = ref(false);
const uploadErrors = ref([]); // 上傳過程中的錯誤訊息

const reuploadInput = ref(null); // 對應到隱藏的 input
const reuploadTarget = ref(null); // 存放要被覆蓋的圖片物件
const isReuploading = ref(false); // 重新上傳的 loading 狀態
const imageViewerDialog = ref(false);
const viewingImage = ref(null); // 存放正在檢視的圖片物件


// --- Methods ---

const goBackToSalesControl = () => {
  if (projectId.value) {
    router.push({
      name: 'SalesControlSystem',
      params: {
        projectName: projectId.value
      }
    });
  }
};

const loadProjectSettings = async () => {
  projectLoading.value = true;
  try {
    project.value = await getProjectSettings(projectId.value);
    //  初始化或確保 contractTypes 陣列及預設值存在
    if (project.value && (!project.value.contractTypes || !Array.isArray(project.value.contractTypes))) {
      project.value.contractTypes = ['一般合約'];
    } else if (project.value) {
      const uniqueTypes = new Set(['一般合約', ...project.value.contractTypes]);
      project.value.contractTypes = Array.from(uniqueTypes);
    }
  } catch (error) {
    toast.error(`載入專案設定失敗: ${error.message}`);
  } finally {
    projectLoading.value = false;
  }
};

const saveProjectSettings = async () => {
  isSavingProject.value = true;
  try {
    const { id, ...dataToUpdate } = project.value;
    await updateProjectSalesSettings(id, dataToUpdate);
    toast.success('專案設定已成功儲存！');
  } catch (error) {
    toast.error(`儲存專案設定失敗: ${error.message}`);
  } finally {
    isSavingProject.value = false;
  }
};

//  START: 新增合約方式的處理函式
const addContractType = () => {
  const value = newContractType.value.trim();
  if (value && !project.value.contractTypes.includes(value)) {
    project.value.contractTypes.push(value);
    newContractType.value = ''; // 清空輸入框
  } else if (value) {
    toast.warning(`「${value}」已存在`);
  }
};

const removeContractType = (typeToRemove) => {
  if (typeToRemove === '一般合約') {
    toast.error('「一般合約」為預設項目，不可刪除');
    return;
  }
  project.value.contractTypes = project.value.contractTypes.filter(t => t !== typeToRemove);
};
//  END: 新增合約方式的處理函式

const setupParamsListener = () => {
  paramsLoading.value = true;
  unsubscribeParams = listenToSalesParameters(projectId.value, (data) => {
    salesParameters.value = data;
    if(paramsLoading.value) paramsLoading.value = false;
  });
};


// 新增圖片管理相關 Computed Properties
const existingImageNames = computed(() => new Set(salesImages.value.map(img => img.imageName)));
const isQueueValid = computed(() => {
    if (uploadQueue.value.length === 0) return false;
    // 檢查是否有檔名錯誤，或正在上傳中
    return !uploadQueue.value.some(item => item.nameError || item.isUploading);
});
// END: 新增圖片管理相關 Computed Properties

const openParameterDialog = () => {
  editingParameter.value = {
    statusName: '',
    colorCode: '#FFFFFF',
    order: (salesParameters.value.length + 1) * 10,
  };
  parameterDialog.value = true;
};

const editParameter = (param) => {
  editingParameter.value = { ...param };
  parameterDialog.value = true;
};

const closeParameterDialog = () => {
  parameterDialog.value = false;
  editingParameter.value = {};
};

const saveParameter = async () => {
  const { valid } = await parameterForm.value.validate();
  if (!valid) return;

  isSavingParameter.value = true;
  try {
    const { id, ...data } = editingParameter.value;
    if (id) {
      await updateSalesParameter(id, data);
      toast.success('狀態已成功更新！');
    } else {
      await addSalesParameter(projectId.value, data);
      toast.success('已成功新增狀態！');
    }
    closeParameterDialog();
  } catch (error) {
    toast.error(`儲存失敗: ${error.message}`);
  } finally {
    isSavingParameter.value = false;
  }
};

const confirmDelete = (param) => {
    parameterToDelete.value = param;
    deleteDialog.value = true;
};

const executeDelete = async () => {
    isDeleting.value = true;
    try {
        await deleteSalesParameter(parameterToDelete.value.id);
        toast.info('狀態已刪除');
        deleteDialog.value = false;
    } catch (error) {
        toast.error(`刪除失敗: ${error.message}`);
    } finally {
        isDeleting.value = false;
    }
};

const setupImagesListener = () => {
  imagesLoading.value = true;
  unsubscribeImages = listenToSalesImages(
    projectId.value,
    (data) => {
      salesImages.value = data;
      if (imagesLoading.value) imagesLoading.value = false;
    },
    (error) => {
      toast.error(`載入圖片列表失敗: ${error.message}`);
      imagesLoading.value = false;
    }
  );
};

// 監聽 v-file-input 的變化
watch(stagedFilesModel, (newFiles) => {
  if (newFiles && newFiles.length > 0) {
    processFiles(newFiles);
    stagedFilesModel.value = []; // 清空 model 以允許重複選擇相同檔案
  }
});

const processFiles = async (files) => {
  isReadingFiles.value = true;
  for (const file of files) {
    const { valid, error, width, height } = await validateImage(file);
    
    // 從檔名中移除副檔名
    const nameWithoutExtension = file.name.split('.').slice(0, -1).join('.');

    stagedFiles.value.push({
      id: Date.now() + Math.random(),
      file,
      previewUrl: URL.createObjectURL(file),
      imageName: nameWithoutExtension, // 預設名稱
      useFilename: false,
      error: valid ? null : error,
      width,
      height,
    });
  }
  isReadingFiles.value = false;
};

// 驗證單一圖片的尺寸和大小
const validateImage = (file) => {
  return new Promise((resolve) => {
    if (file.size > 2 * 1024 * 1024) { // 2MB
      resolve({ valid: false, error: '檔案大小超過 2MB' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (img.width > 3840 || img.height > 2160) {
          resolve({ valid: false, error: '圖片尺寸超過 3840x2160', width: img.width, height: img.height });
        } else {
          resolve({ valid: true, error: null, width: img.width, height: img.height });
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

const removeStagedFile = (id) => {
  const fileToRemove = stagedFiles.value.find(f => f.id === id);
  if (fileToRemove) {
    URL.revokeObjectURL(fileToRemove.previewUrl); // 釋放記憶體
  }
  stagedFiles.value = stagedFiles.value.filter(f => f.id !== id);
};

const uploadAllStagedFiles = async () => {
  isUploading.value = true;
  uploadErrors.value = [];
  
  const existingNames = new Set(salesImages.value.map(img => img.imageName));
  const stagedNames = new Set();
  
  // 前端驗證
  for (const item of stagedFiles.value) {
    const finalName = item.useFilename ? item.file.name.split('.').slice(0, -1).join('.') : item.imageName;
    if (!finalName) {
      toast.error('錯誤：有圖片未填寫「圖片名稱」。');
      isUploading.value = false;
      return;
    }
    if (existingNames.has(finalName) || stagedNames.has(finalName)) {
      toast.error(`錯誤：圖片名稱 "${finalName}" 已存在或在本次上傳中重複。`);
      isUploading.value = false;
      return;
    }
    if (item.error) {
       toast.error(`錯誤：檔案 "${item.file.name}" 未通過驗證。`);
       isUploading.value = false;
       return;
    }
    stagedNames.add(finalName);
  }

  // 開始上傳
  for (const item of stagedFiles.value) {
    const finalName = item.useFilename ? item.file.name.split('.').slice(0, -1).join('.') : item.imageName;
    
    try {
      const docId = `${projectId.value}_${finalName}`;
      const storagePath = `projects/${projectId.value}/salesImages/${item.file.name}`;
      
      toast.info(`正在上傳 ${finalName}...`);
      const downloadURL = await uploadSalesImage(storagePath, item.file);

      const metadata = {
        projectId: projectId.value,
        imageName: finalName,
        fileName: item.file.name,
        downloadURL,
        storagePath,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setSalesImageMetadata(docId, metadata);
      toast.success(`"${finalName}" 上傳成功！`);

    } catch (err) {
      toast.error(`"${finalName}" 上傳失敗: ${err.message}`);
      uploadErrors.value.push(`"${finalName}": ${err.message}`);
    }
  }

  stagedFiles.value = []; // 清空待上傳區
  isUploading.value = false;
};

const confirmImageDelete = (image) => {
  imageToDelete.value = image;
  deleteImageDialog.value = true;
};

const executeImageDelete = async () => {
  isDeletingImage.value = true;
  try {
    toast.info(`正在刪除 ${imageToDelete.value.imageName}...`);
    await deleteSalesImage(imageToDelete.value.id, imageToDelete.value.storagePath);
    toast.success(`圖片 "${imageToDelete.value.imageName}" 已成功刪除！`);
    deleteImageDialog.value = false;
  } catch (error) {
    toast.error(`刪除失敗: ${error.message}`);
  } finally {
    isDeletingImage.value = false;
  }
};


const triggerReupload = (image) => {
  reuploadTarget.value = image;
  
  // 在點擊前，先確認 reuploadInput.value 是否真的存在
  if (reuploadInput.value) {
    reuploadInput.value.click();
  } else {
    // 如果不存在，就在 console 顯示錯誤，並提示使用者
    console.error('程式無法找到 reuploadInput 元素，請檢查 template 中的 ref 是否正確。');
    toast.error('無法觸發檔案上傳，請刷新頁面後再試一次。');
  }
};

const handleReuploadFile = async (event) => {
  const file = event.target.files[0];
  if (!file || !reuploadTarget.value) return;

  isReuploading.value = true; // 可以在此處加上一個全域的 loading 覆蓋層
  toast.info(`正在驗證並重新上傳 "${reuploadTarget.value.imageName}"...`);

  // 1. 驗證新檔案
  const { valid, error } = await validateImage(file);
  if (!valid) {
    toast.error(`驗證失敗: ${error}`);
    isReuploading.value = false;
    reuploadInput.value.value = ''; // 清空 input，以便下次觸發
    return;
  }

  try {
    // 2. 使用原路徑上傳，覆蓋舊檔案
    const downloadURL = await uploadSalesImage(reuploadTarget.value.storagePath, file);

    // 3. 更新 Firestore 中的 metadata
    const metadataUpdate = {
      downloadURL,
      fileName: file.name, // 更新為新檔名
      updatedAt: serverTimestamp(),
    };
    await setSalesImageMetadata(reuploadTarget.value.id, metadataUpdate);

    toast.success(`圖片 "${reuploadTarget.value.imageName}" 已成功更新！`);

  } catch (err) {
    toast.error(`重新上傳失敗: ${err.message}`);
  } finally {
    isReuploading.value = false;
    reuploadInput.value.value = ''; // 清空 input
    reuploadTarget.value = null;
  }
};

const openImageViewer = (image) => {
  viewingImage.value = image;
  imageViewerDialog.value = true;
};



// ✅ (函式結束)

onMounted(() => {
  if (projectId.value) {
    loadProjectSettings();
    setupParamsListener();
    setupImagesListener();
  } else {
    toast.error('錯誤：未提供專案 ID！');
  }
});

onUnmounted(() => {
  if (unsubscribeParams) {
    unsubscribeParams();
  }
  if (unsubscribeImages) {
    unsubscribeImages();
  }
});

</script>