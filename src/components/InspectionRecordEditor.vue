<template>
  <v-dialog v-model="dialog" persistent max-width="800px" scrollable>
    <v-card>
      <v-toolbar color="primary" dark dense flat>
        <v-toolbar-title>{{ isEditMode ? '編輯' : '新增' }}驗屋紀錄</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon dark @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text style="max-height: 75vh;">
        <v-form ref="form" v-model="valid">
          <v-container>
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field label="建案" :model-value="projectName" readonly variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field label="戶別" :model-value="unitId" readonly variant="outlined" density="compact"></v-text-field>
              </v-col>

              <v-col cols="12" sm="6">
                <VueDatePicker
                  v-model="formData.inspectionDate"
                  locale="zh-tw"
                  auto-apply
                  enable-time-picker:false
                  format="yyyy/MM/dd"
                  placeholder="選擇驗屋日期"
                  :input-class-name="'dp-custom-input'"
                  :clearable="false"
                  required
                />
                 <div v-if="!formData.inspectionDate" class="text-caption text-error">請選擇日期</div>
              </v-col>

              <v-col cols="12">
                <v-label class="mb-1">驗屋階段 *</v-label>
                <v-chip-group v-model="formData.phase" mandatory column color="primary">
                  <v-chip v-for="option in options.phase" :key="option.id" :value="option.value" filter variant="outlined" size="small">
                    {{ option.value }}
                  </v-chip>
                </v-chip-group>
                 <div v-if="!formData.phase" class="text-caption text-error">請選擇階段</div>
              </v-col>

              <v-col cols="12" class="mb-2">
                <v-label class="mb-1">照片 (最多 {{ maxPhotos }} 張)</v-label>
                <div class="d-flex flex-wrap ga-2 align-center">
                   <div v-for="(photo, index) in formData.photos" :key="index" class="photo-preview-container">
                    <v-img :src="photo.previewUrl || photo.url" aspect-ratio="1" cover width="80" class="rounded border">
                       <v-btn icon="mdi-close-circle" color="red" size="x-small" variant="text" class="photo-delete-btn" @click="removePhoto(index)"></v-btn>
                    </v-img>
                  </div>
                  <v-btn
                    v-if="formData.photos.length < maxPhotos"
                    icon="mdi-camera-plus"
                    variant="outlined"
                    color="grey-darken-1"
                    @click="triggerPhotoInput"
                  ></v-btn>
                </div>
                 <input type="file" ref="photoInput" accept="image/*" multiple @change="handlePhotoSelected" style="display: none;" />
                 <PhotoEditor v-model="showPhotoEditor" :file="photoToEdit" @done="handlePhotoEdited" @cancel="cancelPhotoEdit" />
              </v-col>

               <v-col cols="12" sm="6" md="4">
                <v-select
                  v-model="formData.area"
                  :items="options.area"
                  item-title="value"
                  item-value="value"
                  label="檢查區域 *"
                  variant="outlined"
                  density="compact"
                  required
                  :rules="[v => !!v || '必填']"
                ></v-select>
              </v-col>

              <v-col cols="12" sm="6" md="4">
                <v-select
                  v-model="formData.category"
                  :items="options.category"
                  item-title="value"
                  item-value="value"
                  label="工程種類 *"
                  variant="outlined"
                  density="compact"
                  required
                  :rules="[v => !!v || '必填']"
                  @update:model-value="formData.subCategory = null"
                ></v-select>
              </v-col>

              <v-col cols="12" md="4">
                 <v-select
                  v-model="formData.subCategory"
                  :items="filteredSubCategories"
                  item-title="value"
                  item-value="value"
                  label="工程細項 *"
                  variant="outlined"
                  density="compact"
                  required
                  :rules="[v => !!v || '必填']"
                  :disabled="!formData.category"
                  no-data-text="請先選擇工程種類"
                ></v-select>
              </v-col>

              <v-col cols="12">
                <v-label class="mb-1">檢查狀態 *</v-label>
                <v-chip-group v-model="formData.status" mandatory column color="primary">
                  <v-chip v-for="option in options.status" :key="option.id" :value="option.value" :color="option.color || 'grey'" filter variant="outlined" size="small">
                    <v-icon v-if="option.icon" start size="small">{{ option.icon }}</v-icon>
                    {{ option.value }}
                  </v-chip>
                </v-chip-group>
                <div v-if="!formData.status" class="text-caption text-error">請選擇狀態</div>
              </v-col>

              <v-col cols="12">
                <v-label class="mb-1">缺失等級 *</v-label>
                <v-chip-group v-model="formData.level" mandatory column color="primary">
                  <v-chip v-for="option in options.level" :key="option.id" :value="option.value" :color="option.color || 'grey'" filter variant="outlined" size="small">
                    {{ option.value }}
                  </v-chip>
                </v-chip-group>
                 <div v-if="!formData.level" class="text-caption text-error">請選擇等級</div>
              </v-col>

              <v-col cols="12">
                <v-label class="mb-1">修繕進度 *</v-label>
                <v-chip-group v-model="formData.progress" mandatory column color="primary">
                  <v-chip v-for="option in options.progress" :key="option.id" :value="option.value" :color="option.color || 'grey'" filter variant="outlined" size="small">
                    <v-icon v-if="option.icon" start size="small">{{ option.icon }}</v-icon>
                    {{ option.value }}
                  </v-chip>
                </v-chip-group>
                 <div v-if="!formData.progress" class="text-caption text-error">請選擇進度</div>
              </v-col>

              <v-col cols="12">
                 <v-label class="mb-1">快選回覆 (點擊加入說明)</v-label>
                 <div class="d-flex flex-wrap ga-1">
                     <v-chip v-for="option in options.quickReply" :key="option.id" @click="appendToDescription(option.value)" size="small" variant="outlined" color="info">
                        {{ option.value }}
                     </v-chip>
                 </div>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="formData.description"
                  label="說明"
                  rows="3"
                  variant="outlined"
                  density="compact"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions class="pa-3">
        <v-spacer></v-spacer>
        <v-btn color="grey" variant="text" @click="closeDialog">取消</v-btn>
        <v-btn color="primary" variant="flat" @click="saveRecord" :loading="isSaving" :disabled="!valid">儲存紀錄</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed, reactive, nextTick } from 'vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import PhotoEditor from '@/components/PhotoEditor.vue';
import { getInspectionOptionsForProjectFB, uploadInspectionPhotoFB, addInspectionRecordFB, updateInspectionRecordFB } from '@/api';
import { useUserStore } from '@/store/user';

const props = defineProps({
  modelValue: Boolean, // 控制 dialog 開關
  projectId: String,
  projectName: String,
  unitId: String,
  recordToEdit: Object // 編輯模式下傳入的紀錄物件
});

const emit = defineEmits(['update:modelValue', 'saved']);

const userStore = useUserStore();
const dialog = ref(props.modelValue);
const form = ref(null);
const valid = ref(false);
const isSaving = ref(false);
const options = reactive({ phase: [], area: [], category: [], status: [], level: [], progress: [], quickReply: [] });
const isOptionsLoading = ref(true);
const maxPhotos = 4;

const formData = reactive({
  inspectionDate: new Date(),
  phase: null,
  photos: [], // 儲存 { name, url, path, previewUrl?, file? }
  area: null,
  category: null,
  subCategory: null,
  status: null,
  level: null,
  progress: null,
  description: ''
});

// Photo Editor相關
const photoInput = ref(null);
const showPhotoEditor = ref(false);
const photoToEdit = ref(null);
const currentPhotoIndex = ref(-1); // 記錄正在編輯哪張照片

const isEditMode = computed(() => !!props.recordToEdit);

// --- Watchers ---
watch(() => props.modelValue, (newVal) => {
  dialog.value = newVal;
  if (newVal) {
    loadOptions();
    resetForm();
    if (props.recordToEdit) {
      // 載入編輯資料 (需要轉換格式)
      Object.assign(formData, {
        ...props.recordToEdit,
        inspectionDate: props.recordToEdit.inspectionDate ? new Date(props.recordToEdit.inspectionDate) : new Date(),
        // photos 可能需要特殊處理，如果後端只存 url/path
        photos: props.recordToEdit.photos || [],
      });
      // 確保 category 載入後觸發 subCategory 的過濾
       nextTick(() => {
        if (formData.category) {
            // Force re-computation if needed, though computed should handle it
        }
       });
    } else {
        formData.inspectionDate = new Date(); // 新增時預設今天
    }
  }
});

watch(dialog, (newVal) => {
  emit('update:modelValue', newVal);
});

// --- Computed ---
const filteredSubCategories = computed(() => {
  if (!formData.category || !options.category.length) return [];
  const mainCategory = options.category.find(cat => cat.value === formData.category);
  return mainCategory?.subItems || [];
});

// --- Methods ---
async function loadOptions() {
  if (!props.projectId) return;
  isOptionsLoading.value = true;
  const result = await getInspectionOptionsForProjectFB(props.projectId);
  if (result.status === 'success') {
    Object.assign(options, result.data);
     // 為 category 設定預設的 subItems
    options.category.forEach(cat => {
        cat.subItems = cat.subItems || [];
    });
  } else {
    console.error("載入選項失敗:", result.message);
    // 可加入錯誤提示
  }
  isOptionsLoading.value = false;
}

function resetForm() {
    formData.inspectionDate = new Date();
    formData.phase = options.phase.length > 0 ? options.phase[0].value : null; // 預設選第一個
    formData.photos = [];
    formData.area = null;
    formData.category = null;
    formData.subCategory = null;
    formData.status = options.status.length > 0 ? options.status[0].value : null; // 預設選第一個
    formData.level = options.level.length > 0 ? options.level[0].value : null; // 預設選第一個
    formData.progress = options.progress.length > 0 ? options.progress[0].value : null; // 預設選第一個
    formData.description = '';
    photoToEdit.value = null;
    currentPhotoIndex.value = -1;
    nextTick(() => {
        form.value?.resetValidation();
    });
}


function closeDialog() {
  dialog.value = false;
}

function triggerPhotoInput() {
  photoInput.value?.click();
}

function handlePhotoSelected(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  const filesToProcess = Array.from(files).slice(0, maxPhotos - formData.photos.length);

  filesToProcess.forEach((file, index) => {
      // 暫存檔案並顯示預覽
      const reader = new FileReader();
      reader.onload = (e) => {
          formData.photos.push({
              name: file.name,
              previewUrl: e.target.result,
              file: file, // 暫存 File 物件
              url: null, // 尚未上傳
              path: null
          });
          // 處理第一張圖片
          if (index === 0) {
              photoToEdit.value = file;
              currentPhotoIndex.value = formData.photos.length - filesToProcess.length; // 設定當前編輯索引
              showPhotoEditor.value = true;
          }
      };
      reader.readAsDataURL(file);
  });


  // 清空 input，以便下次選擇同一個檔案也能觸發 change 事件
  event.target.value = null;
}

function handlePhotoEdited(editedFile) {
    if (currentPhotoIndex.value !== -1 && formData.photos[currentPhotoIndex.value]) {
        // 更新對應索引的照片 File 物件和預覽
        formData.photos[currentPhotoIndex.value].file = editedFile;
        const reader = new FileReader();
        reader.onload = (e) => {
            formData.photos[currentPhotoIndex.value].previewUrl = e.target.result;
        };
        reader.readAsDataURL(editedFile);
    }
    showPhotoEditor.value = false;
    photoToEdit.value = null;

    // 檢查是否有下一張未編輯的照片
    const nextIndex = formData.photos.findIndex((p, idx) => idx > currentPhotoIndex.value && p.file && !p.url);
    if (nextIndex !== -1) {
        photoToEdit.value = formData.photos[nextIndex].file;
        currentPhotoIndex.value = nextIndex;
        showPhotoEditor.value = true;
    } else {
        currentPhotoIndex.value = -1; // 所有照片都處理完畢
    }
}

function cancelPhotoEdit() {
  showPhotoEditor.value = false;
  photoToEdit.value = null;
   // 檢查是否有下一張未編輯的照片 (邏輯同 handlePhotoEdited)
    const nextIndex = formData.photos.findIndex((p, idx) => idx > currentPhotoIndex.value && p.file && !p.url);
    if (nextIndex !== -1) {
        photoToEdit.value = formData.photos[nextIndex].file;
        currentPhotoIndex.value = nextIndex;
        showPhotoEditor.value = true;
    } else {
        currentPhotoIndex.value = -1;
    }
}

function removePhoto(index) {
  formData.photos.splice(index, 1);
}

function appendToDescription(text) {
  if (formData.description) {
    formData.description += `\n${text}`;
  } else {
    formData.description = text;
  }
}

async function saveRecord() {
    const validationResult = await form.value?.validate();
    if (!validationResult?.valid) {
        alert('請檢查表單必填欄位。');
        return;
    }
    if (!formData.inspectionDate || !formData.phase || !formData.status || !formData.level || !formData.progress) {
        alert('請檢查日期與所有 Chip Group 必選項。');
        return;
    }

    isSaving.value = true;

    try {
        // --- 照片上傳邏輯 (不變) ---
        const uploadedPhotosInfo = [];
        for (const photo of formData.photos) {
            if (photo.file && !photo.url) {
                const uploadResult = await uploadInspectionPhotoFB(props.projectId, props.unitId, photo.file);
                if (uploadResult.status === 'success') {
                    uploadedPhotosInfo.push({ name: uploadResult.name, url: uploadResult.url, path: uploadResult.path });
                } else {
                    throw new Error(`照片 ${photo.name} 上傳失敗: ${uploadResult.message}`);
                }
            } else if (photo.url) {
                uploadedPhotosInfo.push({ name: photo.name, url: photo.url, path: photo.path });
            }
        }

        // --- 準備 Payload (通用) ---
        const recordPayload = {
            // projectId 和 unitId 由後端 Cloud Function 從參數獲取，這裡不需要重複加入 payload
            inspectionDate: formData.inspectionDate.toISOString(),
            phase: formData.phase,
            photos: uploadedPhotosInfo,
            area: formData.area,
            category: formData.category,
            subCategory: formData.subCategory,
            status: formData.status,
            level: formData.level,
            progress: formData.progress,
            description: formData.description,
            inspectorName: userStore.user?.name || '未知',
            inspectorPhone: userStore.user?.key || '未知',
            // 注意：updatedAt 由後端 Cloud Function 自動處理
        };

        // ✓ START: 修改 - 根據模式呼叫不同 API
        let saveResult;
        if (isEditMode.value) {
            // --- 編輯模式 ---
            if (!props.recordToEdit?.id) { // ✓ 增加檢查，確保有 record ID
                 throw new Error("編輯模式下找不到紀錄 ID。");
            }
            console.log(`編輯模式：準備更新紀錄 ID ${props.recordToEdit.id}`);
            // ✓ 呼叫新的 update API
            saveResult = await updateInspectionRecordFB(props.recordToEdit.id, recordPayload);
        } else {
            // --- 新增模式 ---
            console.log("新增模式：準備新增紀錄");
             // ✓ 將 projectId 和 unitId 加入 payload (addInspectionRecordFB 可能需要)
             recordPayload.projectId = props.projectId;
             recordPayload.unitId = props.unitId;
            // ✓ 呼叫舊的 add API (保持不變)
            saveResult = await addInspectionRecordFB(recordPayload);
        }
        // ✓ END: 修改

        if (saveResult.status === 'success') {
            alert('儲存成功！');
            emit('saved');
            closeDialog();
        } else {
            throw new Error(saveResult.message || (isEditMode.value ? '更新失敗' : '新增失敗'));
        }

    } catch (error) {
        console.error("儲存驗屋紀錄時發生錯誤:", error);
        alert(`儲存失敗: ${error.message}`);
    } finally {
        isSaving.value = false;
    }
}
</script>

<style>
/* 讓 DatePicker 輸入框看起來像 Vuetify 的 outlined */
.dp-custom-input {
  border: 1px solid rgba(0, 0, 0, 0.38) !important;
  border-radius: 4px !important;
  padding: 8px 12px !important; /* 調整 padding 使其接近 density="compact" */
  font-size: 16px !important; /* Vuetify 預設字體大小 */
  min-height: 40px; /* Vuetify density="compact" 的高度 */
  line-height: 1.5;
   background-color: transparent !important; /* 確保背景透明 */
}
.dp-custom-input:hover {
   border-color: rgba(0, 0, 0, 0.87) !important; /* Hover 時的邊框顏色 */
}
.dp-custom-input:focus {
   border-color: rgb(var(--v-theme-primary)) !important; /* Focus 時使用主題色 */
   box-shadow: none !important; /* 移除預設的 focus 效果 */
   outline: none !important;
}
.dp__input_invalid {
  border-color: rgb(var(--v-theme-error)) !important; /* 驗證失敗時的顏色 */
}
.dp__input_icon {
    line-height: 1 !important; /* 讓清除圖標垂直居中 */
    right: 8px;
    left: auto;
}
.dp__clear_icon {
    padding: 0 !important;
}

/* 照片預覽 */
.photo-preview-container {
  position: relative;
}
.photo-delete-btn {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: rgba(255, 255, 255, 0.7);
}
</style>