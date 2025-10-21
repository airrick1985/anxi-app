<template>
  <v-dialog
    v-model="dialog"
    persistent
    max-width="800px"
    scrollable
  >
    <v-card>
      <v-toolbar
        color="primary"
        dark
        dense
        flat
      >
        <v-toolbar-title>{{ isEditMode ? '編輯' : '新增' }}驗屋紀錄</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn
          icon
          dark
          @click="closeDialog"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text style="max-height: 75vh;">
        <v-form
          ref="form"
          v-model="valid"
        >
          <v-container>
            <v-row dense>
              <v-col
                cols="12"
                sm="6"
              >
                <v-text-field
                  label="建案"
                  :model-value="projectName"
                  readonly
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>
              <v-col
                cols="12"
                sm="6"
              >
                <v-text-field
                  label="戶別"
                  :model-value="unitId"
                  readonly
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>

              <v-col
                cols="12"
                sm="6"
              >
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
                <div
                  v-if="!formData.inspectionDate"
                  class="text-caption text-error"
                >請選擇日期</div>
              </v-col>

              <v-col cols="12">
                <v-label class="mb-1">驗屋階段 *</v-label>
                <v-chip-group
                  v-model="formData.phase"
                  mandatory
                  column
                  color="primary"
                >
                  <v-chip
                    v-for="option in options.phase"
                    :key="option.id"
                    :value="option.value"
                    filter
                    variant="outlined"
                    size="small"
                  >
                    {{ option.value }}
                  </v-chip>
                </v-chip-group>
                <div
                  v-if="!formData.phase"
                  class="text-caption text-error"
                >請選擇階段</div>
              </v-col>

              <v-col
                cols="12"
                class="mb-2"
              >
                <v-label class="mb-1">照片 (最多 {{ maxPhotos }} 張)</v-label>
                <div class="d-flex flex-wrap ga-2 align-center">
                  <div
                    v-for="(photo, index) in formData.photos"
                    :key="index"
                    class="photo-preview-container"
                  >
                    <v-img
                      :src="photo.previewUrl || photo.url"
                      aspect-ratio="1"
                      cover
                      width="80"
                      class="rounded border"
                    >
                      <v-btn
                        icon="mdi-close-circle"
                        color="red"
                        size="x-small"
                        variant="text"
                        class="photo-delete-btn"
                        @click="removePhoto(index)"
                      ></v-btn>
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
                <input
                  type="file"
                  ref="photoInput"
                  accept="image/*"
                  multiple
                  @change="handlePhotoSelected"
                  style="display: none;"
                />
                <PhotoEditor
                  v-model="showPhotoEditor"
                  :file="photoToEdit"
                  @done="handlePhotoEdited"
                  @cancel="cancelPhotoEdit"
                />
              </v-col>

              <v-col
                cols="12"
                sm="6"
                md="4"
              >
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
              <v-col
                cols="12"
                sm="6"
                md="4"
              >
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
              <v-col
                cols="12"
                md="4"
              >
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
                <v-label class="mb-1">快選回覆 (點擊加入說明)</v-label>
                <div class="d-flex flex-wrap ga-1">
                  <v-chip
                    v-for="option in options.quickReply"
                    :key="option.id"
                    @click="appendToDescription(option.value)"
                    size="small"
                    variant="outlined"
                    color="info"
                  >
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

              <v-col cols="12">
                <v-label class="mb-1">檢查狀態 *</v-label>
                <v-chip-group
                  v-model="formData.status"
                  mandatory
                  column
                  color="primary"
                >
                  <v-chip
                    v-for="option in options.status"
                    :key="option.id"
                    :value="option.value"
                    :color="option.color || 'grey'"
                    filter
                    variant="outlined"
                    size="small"
                  >
                    <v-icon
                      v-if="option.icon"
                      start
                      size="small"
                    >{{ option.icon }}</v-icon>
                    {{ option.value }}
                  </v-chip>
                </v-chip-group>
                <div
                  v-if="!formData.status"
                  class="text-caption text-error"
                >請選擇狀態</div>
              </v-col>

              <v-col cols="12">
                <v-label class="mb-1">缺失等級 *</v-label>
                <v-chip-group
                  v-model="formData.level"
                  mandatory
                  column
                  color="primary"
                >
                  <v-chip
                    v-for="option in options.level"
                    :key="option.id"
                    :value="option.value"
                    :color="option.color || 'grey'"
                    filter
                    variant="outlined"
                    size="small"
                  >
                    {{ option.value }}
                  </v-chip>
                </v-chip-group>
                <div
                  v-if="!formData.level"
                  class="text-caption text-error"
                >請選擇等級</div>
              </v-col>

              <v-col cols="12">
                <v-label class="mb-1">修繕進度 *</v-label>
                <v-chip-group
                  v-model="formData.progress"
                  mandatory
                  column
                  color="primary"
                >
                  <v-chip
                    v-for="option in options.progress"
                    :key="option.id"
                    :value="option.value"
                    :color="option.color || 'grey'"
                    filter
                    variant="outlined"
                    size="small"
                  >
                    <v-icon
                      v-if="option.icon"
                      start
                      size="small"
                    >{{ option.icon }}</v-icon>
                    {{ option.value }}
                  </v-chip>
                </v-chip-group>
                <div
                  v-if="!formData.progress"
                  class="text-caption text-error"
                >請選擇進度</div>
              </v-col>

             
            </v-row>
          </v-container>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions class="pa-3">
        <v-spacer></v-spacer>
        <v-btn
          color="grey"
          variant="text"
          @click="closeDialog"
        >取消</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="isSaving"
          :disabled="!valid"
          @click="saveRecord"
        >儲存紀錄</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
// ✓ 1. Imports (依賴引入)
import { ref, watch, computed, reactive, nextTick } from 'vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import PhotoEditor from '@/components/PhotoEditor.vue';
import {
  getInspectionOptionsForProjectFB,
  uploadInspectionPhotoFB,
  addInspectionRecordFB,
  updateInspectionRecordFB
} from '@/api';
import { useUserStore } from '@/store/user';

// ✓ 2. Props / Emits (組件接口)
const props = defineProps({
  modelValue: Boolean, // 控制 dialog 開關
  projectId: String,
  projectName: String,
  unitId: String,
  recordToEdit: Object // 編輯模式下傳入的紀錄物件
});

const emit = defineEmits(['update:modelValue', 'saved']);

// ✓ 3. Instances (實例化)
const userStore = useUserStore();
const form = ref(null);

// ✓ 4. Reactive State (響應式狀態 - 核心)
const dialog = ref(props.modelValue);
const valid = ref(false);
const isSaving = ref(false);
const isOptionsLoading = ref(true);
const maxPhotos = 4;
const options = reactive({
  phase: [],
  area: [],
  category: [],
  status: [],
  level: [],
  progress: [],
  quickReply: []
});

// ✓ 5. Reactive State (表單資料)
const createDefaultFormData = () => ({
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
const formData = reactive(createDefaultFormData());

// ✓ 6. Reactive State (照片編輯器)
const photoInput = ref(null);
const showPhotoEditor = ref(false);
const photoToEdit = ref(null);
const currentPhotoIndex = ref(-1); // 記錄正在編輯哪張照片

// ✓ 7. Computed (計算屬性)
const isEditMode = computed(() => !!props.recordToEdit);

const filteredSubCategories = computed(() => {
  if (!formData.category || !options.category.length) return [];
  const mainCategory = options.category.find(cat => cat.value === formData.category);
  return mainCategory?.subItems || [];
});

// ✓ 8. Watchers (監聽器)
watch(() => props.modelValue, (newVal) => {
  dialog.value = newVal;
  if (newVal) {
    // ✓ 提取邏輯到 initializeComponent
    initializeComponent();
  }
});

watch(dialog, (newVal) => {
  emit('update:modelValue', newVal);
});

// ✓ 9. Lifecycle Hooks (生命週期 - 此處無)

// ✓ 10. Methods (組件 & 表單邏輯)
async function initializeComponent() {
  await loadOptions();
  resetForm();

  if (props.recordToEdit) {
    // 編輯模式：載入資料
    Object.assign(formData, {
      ...props.recordToEdit,
      inspectionDate: props.recordToEdit.inspectionDate ? new Date(props.recordToEdit.inspectionDate) : new Date(),
      photos: props.recordToEdit.photos || [],
    });
  } else {
    // 新增模式：設定預設值
    formData.inspectionDate = new Date();
    // ✓ 確保預設值在 options 載入後設定
    formData.phase = options.phase.length > 0 ? options.phase[0].value : null;
    formData.status = options.status.length > 0 ? options.status[0].value : null;
    formData.level = options.level.length > 0 ? options.level[0].value : null;
    formData.progress = options.progress.length > 0 ? options.progress[0].value : null;
  }
}

async function loadOptions() {
  if (!props.projectId) return;
  isOptionsLoading.value = true;
  try {
    const result = await getInspectionOptionsForProjectFB(props.projectId);
    if (result.status === 'success') {
      Object.assign(options, result.data);
      // 確保 category 有 subItems 陣列
      options.category.forEach(cat => {
        cat.subItems = cat.subItems || [];
      });
    } else {
      console.error("載入選項失敗:", result.message);
    }
  } catch (error) {
    console.error("載入選項時發生錯誤:", error);
  } finally {
    isOptionsLoading.value = false;
  }
}

function resetForm() {
  Object.assign(formData, createDefaultFormData());
  
  // ✓ 設定預設值 (如果 options 已載入)
  if (options.phase.length > 0) formData.phase = options.phase[0].value;
  if (options.status.length > 0) formData.status = options.status[0].value;
  if (options.level.length > 0) formData.level = options.level[0].value;
  if (options.progress.length > 0) formData.progress = options.progress[0].value;
  
  photoToEdit.value = null;
  currentPhotoIndex.value = -1;
  nextTick(() => {
    form.value?.resetValidation();
  });
}

function closeDialog() {
  dialog.value = false;
}

function appendToDescription(text) {
  if (formData.description) {
    formData.description += `\n${text}`;
  } else {
    formData.description = text;
  }
}

// ✓ 11. Methods (照片處理邏輯)
function triggerPhotoInput() {
  photoInput.value?.click();
}

function handlePhotoSelected(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  const filesToProcess = Array.from(files).slice(0, maxPhotos - formData.photos.length);

  filesToProcess.forEach((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      formData.photos.push({
        name: file.name,
        previewUrl: e.target.result,
        file: file, // 暫存 File 物件
        url: null,
        path: null
      });

      // ✓ 僅在第一張照片加入後，且編輯器未開啟時，觸發編輯
      if (!showPhotoEditor.value) {
        const firstIndex = formData.photos.length - filesToProcess.length;
        editNextPendingPhoto(firstIndex - 1); // 傳入 -1，使其自動找到第一個
      }
    };
    reader.readAsDataURL(file);
  });

  event.target.value = null; // 清空 input
}

function handlePhotoEdited(editedFile) {
  if (currentPhotoIndex.value !== -1 && formData.photos[currentPhotoIndex.value]) {
    const photo = formData.photos[currentPhotoIndex.value];
    photo.file = editedFile;
    // 更新預覽
    const reader = new FileReader();
    reader.onload = (e) => {
      photo.previewUrl = e.target.result;
    };
    reader.readAsDataURL(editedFile);
  }
  // ✓ 提取自動接續編輯的邏輯
  editNextPendingPhoto(currentPhotoIndex.value);
}

function cancelPhotoEdit() {
  // ✓ 提取自動接續編輯的邏輯
  editNextPendingPhoto(currentPhotoIndex.value);
}

/**
 * ✓ 新增: 提取 "編輯下一張照片" 的邏輯，避免重複
 * @param {number} lastIndex - 上一張編輯完成的索引
 */
function editNextPendingPhoto(lastIndex) {
  showPhotoEditor.value = false;
  photoToEdit.value = null;

  // 尋找下一張待處理的照片 (有 file 物件但沒有 url)
  const nextIndex = formData.photos.findIndex((p, idx) => idx > lastIndex && p.file && !p.url);

  if (nextIndex !== -1) {
    photoToEdit.value = formData.photos[nextIndex].file;
    currentPhotoIndex.value = nextIndex;
    showPhotoEditor.value = true;
  } else {
    currentPhotoIndex.value = -1; // 全部處理完畢
  }
}

function removePhoto(index) {
  formData.photos.splice(index, 1);
}

// ✓ 12. Methods (儲存邏輯)
/**
 * ✓ 重構: 儲存主函式，簡化流程
 */
async function saveRecord() {
  const isValid = await validateForm();
  if (!isValid) return;

  isSaving.value = true;
  try {
    // 1. 上傳照片
    const uploadedPhotosInfo = await uploadPendingPhotos();

    // 2. 準備 Payload
    const recordPayload = buildPayload(uploadedPhotosInfo);

    // 3. 執行儲存 (新增或更新)
    let saveResult;
    if (isEditMode.value) {
      if (!props.recordToEdit?.id) throw new Error("編輯模式下找不到紀錄 ID。");
      saveResult = await updateInspectionRecordFB(props.recordToEdit.id, recordPayload);
    } else {
      recordPayload.projectId = props.projectId; // 新增時才需要
      recordPayload.unitId = props.unitId;       // 新增時才需要
      saveResult = await addInspectionRecordFB(recordPayload);
    }

    // 4. 處理結果
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

/**
 * ✓ 新增: 提取表單驗證邏輯
 */
async function validateForm() {
  const validationResult = await form.value?.validate();
  if (!validationResult?.valid) {
    alert('請檢查表單必填欄位。');
    return false;
  }
  // 檢查自訂的必填項 (Chip groups 和 DatePicker)
  if (!formData.inspectionDate || !formData.phase || !formData.status || !formData.level || !formData.progress) {
    alert('請檢查日期與所有 Chip Group 必選項。');
    return false;
  }
  return true;
}

/**
 * ✓ 新增: 提取照片上傳邏輯
 */
async function uploadPendingPhotos() {
  const uploadedPhotosInfo = [];
  for (const photo of formData.photos) {
    if (photo.file && !photo.url) {
      // 這是一張新照片，需要上傳
      const uploadResult = await uploadInspectionPhotoFB(props.projectId, props.unitId, photo.file);
      if (uploadResult.status === 'success') {
        uploadedPhotosInfo.push({ name: uploadResult.name, url: uploadResult.url, path: uploadResult.path });
      } else {
        throw new Error(`照片 ${photo.name} 上傳失敗: ${uploadResult.message}`);
      }
    } else if (photo.url) {
      // 這是已存在的照片，直接保留
      uploadedPhotosInfo.push({ name: photo.name, url: photo.url, path: photo.path });
    }
  }
  return uploadedPhotosInfo;
}

/**
 * ✓ 新增: 提取 Payload 建構邏輯
 */
function buildPayload(uploadedPhotosInfo) {
  return {
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
    // createdAt / updatedAt 由後端 Cloud Function 自動處理
  };
}
</script>

<style>
/* 讓 DatePicker 輸入框看起來像 Vuetify 的 outlined (樣式不變) */
.dp-custom-input {
  border: 1px solid rgba(0, 0, 0, 0.38) !important;
  border-radius: 4px !important;
  padding: 8px 12px !important;
  font-size: 16px !important;
  min-height: 40px;
  line-height: 1.5;
  background-color: transparent !important;
}
.dp-custom-input:hover {
  border-color: rgba(0, 0, 0, 0.87) !important;
}
.dp-custom-input:focus {
  border-color: rgb(var(--v-theme-primary)) !important;
  box-shadow: none !important;
  outline: none !important;
}
.dp__input_invalid {
  border-color: rgb(var(--v-theme-error)) !important;
}
.dp__input_icon {
  line-height: 1 !important;
  right: 8px;
  left: auto;
}
.dp__clear_icon {
  padding: 0 !important;
}

/* 照片預覽 (樣式不變) */
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