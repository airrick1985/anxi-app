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

      <v-card-text style="max-height: 85vh;">
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
                <v-label class="mb-1">驗屋階段</v-label>
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
                  label="檢查區域"
                  variant="outlined"
                  class="large-text-select"
                  :menu-props="{ class: 'large-select-menu' }"
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
                  label="工程種類"
                  variant="outlined"
                  class="large-text-select"
                  :menu-props="{ class: 'large-select-menu' }"
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
                  label="工程細項"
                  variant="outlined"
                  class="large-text-select"
                  :menu-props="{ class: 'large-select-menu' }"
                  required
                  :rules="[v => !!v || '必填']"
                  :disabled="!formData.category"
                  no-data-text="請先選擇工程種類"
                ></v-select>
              </v-col>

               <v-col cols="12">
                <v-label class="mb-1">快選說明 (點擊加入)</v-label>
                <div class="d-flex flex-wrap ga-1">
                  <v-chip
                    v-for="option in options.quickReply"
                    :key="option.id"
                    @click="appendToDescription(option.value)"
               
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
                  label="說明狀況"
                  rows="3"
                  variant="outlined"
            
                ></v-textarea>
              </v-col>

              <v-col cols="12">
                <v-label class="mb-1">檢查狀態</v-label>
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
                <v-label class="mb-1">缺失等級(客戶無法查看)</v-label>
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
                <v-label class="mb-1">修繕進度(客戶無法查看)</v-label>
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

             <v-col cols="12">
                <v-label class="mb-1">客戶檢視此筆紀錄？</v-label>
                <div class="d-flex align-center ga-2">
                  <v-tooltip location="top" :text="formData.customerView ? '驗屋報告將顯示此紀錄' : '驗屋報告不顯示此紀錄'">
                    <template v-slot:activator="{ props }">
                      <v-btn
                        v-bind="props"
                        :icon="formData.customerView ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
                        :color="formData.customerView ? 'primary' : 'grey'"
                        variant="outlined"
                     
                        @click="formData.customerView = !formData.customerView"
                        aria-label="切換客戶檢視狀態"
                      ></v-btn>
                    </template>
                  </v-tooltip>
                  <span class="text-caption text-medium-emphasis">
                    {{ formData.customerView ? '顯示於驗屋報告' : '不顯示於驗屋報告' }}
                  </span>
                </div>
              </v-col>

              <v-col cols="12" v-if="isEditMode"> <div class="mt-4">
                     <v-label class="mb-1">買方確認狀態</v-label>
                     <div class="mb-2"> <v-chip
                           v-if="!formData.customerConfirmedAt"
                           color="red"
                           text-color="white"
                           size="small"
                           label
                         >
                           買方未確認
                         </v-chip>
                         <span v-else class="text-body-2 text-success-darken-1">
                             {{ formatDate(formData.customerConfirmedAt) }}
                             <span v-if="formData.confirmationBatchId" class="text-caption text-grey-darken-1 ml-1">
                                 (批次: {{ formData.confirmationBatchId }})
                             </span>
                         </span>
                     </div>
                     <div>
                         <v-btn
                           v-if="formData.customerConfirmedAt"
                           color="error"
                           variant="outlined"
                           size="small"
                           @click="clearBuyerConfirmation"
                           :disabled="isSaving || isClearingConfirmation"
                           :loading="isClearingConfirmation"
                           prepend-icon="mdi-eraser"
                         >
                           清除買方確認
                         </v-btn>
                     </div>
                 </div>
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
          :disabled="isSaving || isClearingConfirmation"
        >取消</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="isSaving"
          :disabled="!valid || isClearingConfirmation"
          @click="saveRecord"
        >儲存紀錄</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed, reactive, nextTick } from 'vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import PhotoEditor from '@/components/PhotoEditor.vue';
import {
  getInspectionOptionsForProjectFB,
  uploadInspectionPhotoFB,
  addInspectionRecordFB,
  updateInspectionRecordFB,
  updateInspectionRecordFieldFB // ✅ 引入 API
} from '@/api';
import { useUserStore } from '@/store/user';
// ✅ 引入 date-fns
import { format, parseISO } from 'date-fns';
import { zhTW } from 'date-fns/locale';

const props = defineProps({
  modelValue: Boolean,
  projectId: String,
  projectName: String,
  unitId: String,
  recordToEdit: Object
});

const emit = defineEmits(['update:modelValue', 'saved']);

const userStore = useUserStore();
const form = ref(null);

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

const createDefaultFormData = () => ({
  inspectionDate: new Date(),
  phase: null,
  photos: [],
  area: null,
  category: null,
  subCategory: null,
  status: null,
  level: null,
  progress: null,
  description: '',
  customerView: true,
  // ✅ 新增買方確認相關欄位，預設 null
  customerConfirmedAt: null,
  confirmationBatchId: null
});
const formData = reactive(createDefaultFormData());

const photoInput = ref(null);
const showPhotoEditor = ref(false);
const photoToEdit = ref(null);
const currentPhotoIndex = ref(-1);

// ✅ START: 新增清除確認狀態的 ref
const isClearingConfirmation = ref(false);
// ✅ END: 新增 ref

const isEditMode = computed(() => !!props.recordToEdit);

const filteredSubCategories = computed(() => {
  if (!formData.category || !options.category.length) return [];
  const mainCategory = options.category.find(cat => cat.value === formData.category);
  return mainCategory?.subItems || [];
});

watch(() => props.modelValue, (newVal) => {
  dialog.value = newVal;
  if (newVal) {
    initializeComponent();
  }
});

watch(dialog, (newVal) => {
  emit('update:modelValue', newVal);
});

async function initializeComponent() {
  await loadOptions();
  resetForm();

  if (props.recordToEdit) {
    Object.assign(formData, {
      ...props.recordToEdit,
      inspectionDate: props.recordToEdit.inspectionDate ? new Date(props.recordToEdit.inspectionDate) : new Date(),
      photos: props.recordToEdit.photos || [],
      customerView: props.recordToEdit.customerView === false ? false : true,
      // ✅ 載入買方確認欄位
      customerConfirmedAt: props.recordToEdit.customerConfirmedAt || null,
      confirmationBatchId: props.recordToEdit.confirmationBatchId || null
    });
  } else {
    formData.inspectionDate = new Date();
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

  if (options.phase.length > 0) formData.phase = options.phase[0].value;
  if (options.status.length > 0) formData.status = options.status[0].value;
  if (options.level.length > 0) formData.level = options.level[0].value;
  if (options.progress.length > 0) formData.progress = options.progress[0].value;

  photoToEdit.value = null;
  currentPhotoIndex.value = -1;
  isClearingConfirmation.value = false; // ✅ 重置清除狀態
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
        file: file,
        url: null,
        path: null
      });

      if (!showPhotoEditor.value) {
        const firstIndex = formData.photos.length - filesToProcess.length;
        editNextPendingPhoto(firstIndex - 1);
      }
    };
    reader.readAsDataURL(file);
  });

  event.target.value = null;
}

function handlePhotoEdited(editedFile) {
  if (currentPhotoIndex.value !== -1 && formData.photos[currentPhotoIndex.value]) {
    const photo = formData.photos[currentPhotoIndex.value];
    photo.file = editedFile;
    const reader = new FileReader();
    reader.onload = (e) => {
      photo.previewUrl = e.target.result;
    };
    reader.readAsDataURL(editedFile);
  }
  editNextPendingPhoto(currentPhotoIndex.value);
}

function cancelPhotoEdit() {
  editNextPendingPhoto(currentPhotoIndex.value);
}

function editNextPendingPhoto(lastIndex) {
  showPhotoEditor.value = false;
  photoToEdit.value = null;
  const nextIndex = formData.photos.findIndex((p, idx) => idx > lastIndex && p.file && !p.url);
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

async function saveRecord() {
  const isValid = await validateForm();
  if (!isValid) return;

  isSaving.value = true;
  try {
    const uploadedPhotosInfo = await uploadPendingPhotos();
    const recordPayload = buildPayload(uploadedPhotosInfo);

    let saveResult;
    if (isEditMode.value) {
      if (!props.recordToEdit?.id) throw new Error("編輯模式下找不到紀錄 ID。");
      saveResult = await updateInspectionRecordFB(props.recordToEdit.id, recordPayload);
    } else {
      recordPayload.projectId = props.projectId;
      recordPayload.unitId = props.unitId;
      saveResult = await addInspectionRecordFB(recordPayload);
    }

    if (saveResult.status === 'success') {
      alert('儲存成功！');
      emit('saved'); // ✅ 通知父組件刷新
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

async function validateForm() {
  const validationResult = await form.value?.validate();
  if (!validationResult?.valid) {
    alert('請檢查表單必填欄位。');
    return false;
  }
  if (!formData.inspectionDate || !formData.phase || !formData.status || !formData.level || !formData.progress) {
    alert('請檢查日期與所有 Chip Group 必選項。');
    return false;
  }
  return true;
}

async function uploadPendingPhotos() {
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
  return uploadedPhotosInfo;
}

function buildPayload(uploadedPhotosInfo) {
  // ✅ 在 buildPayload 中排除買方確認欄位，避免覆蓋
  const payload = {
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
    customerView: formData.customerView,
  };
   // 如果是編輯模式，則保留原有的 customerConfirmedAt 和 confirmationBatchId
  if (isEditMode.value) {
      payload.customerConfirmedAt = formData.customerConfirmedAt;
      payload.confirmationBatchId = formData.confirmationBatchId;
  }
  return payload;
}

// ✅ START: 新增清除買方確認的方法
async function clearBuyerConfirmation() {
  if (!isEditMode.value || !props.recordToEdit?.id) {
    alert('錯誤：無法清除確認，找不到紀錄 ID。');
    return;
  }
  if (!confirm('您確定要清除此紀錄的買方確認狀態嗎？此操作無法復原。')) {
      return;
  }

  isClearingConfirmation.value = true;
  try {
    const payload = {
      customerConfirmedAt: null,
      confirmationBatchId: null,
      // 記錄清除操作的人員信息
      inspectorName: userStore.user?.name || '系統清除',
      inspectorPhone: userStore.user?.key || '系統清除'
    };
    const recordUnitId = props.recordToEdit.unitId || props.unitId; // 確保有 unitId

    // 使用 updateInspectionRecordFieldFB API
    const result = await updateInspectionRecordFieldFB(
      props.projectId,
      recordUnitId, // 確保傳遞了 unitId
      props.recordToEdit.id,
      payload
    );

    if (result.status === 'success') {
      // 本地同步更新 formData
      formData.customerConfirmedAt = null;
      formData.confirmationBatchId = null;
      alert('買方確認狀態已清除。');
      // 可以考慮 emit 事件通知父組件刷新列表的顯示狀態
      emit('saved');
    } else {
      throw new Error(result.message || '清除失敗');
    }
  } catch (error) {
    console.error("清除買方確認時發生錯誤:", error);
    alert(`清除失敗: ${error.message}`);
  } finally {
    isClearingConfirmation.value = false;
  }
}
// ✅ END: 新增清除買方確認的方法

// ✅ START: 新增 formatDate 函數 (如果父組件沒傳遞)
function formatDate(dateInput) {
  if (!dateInput) return '';
  try {
    let dateToFormat;
    if (typeof dateInput === 'string' && dateInput.includes('T') && dateInput.includes('Z')) {
       dateToFormat = parseISO(dateInput);
    } else {
       dateToFormat = new Date(dateInput);
    }
    if (isNaN(dateToFormat.getTime())) throw new Error("Invalid date value");
    return format(dateToFormat, 'yyyy/MM/dd HH:mm', { locale: zhTW }); // 包含時間
  } catch (e) {
    console.error("無法格式化日期:", dateInput, e);
    return String(dateInput);
  }
}
// ✅ END: 新增 formatDate 函數

</script>

<style>
/* ... (樣式保持不變) ... */
.dp-custom-input {
  border: 1px solid rgba(0, 0, 0, 0.38) !important;
  border-radius: 4px !important;
  padding: 8px 12px !important;
  font-size: 18px !important;
  font-weight: 500 !important;
  min-height: 56px;
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

.photo-preview-container {
  position: relative;
}
.photo-delete-btn {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: rgba(255, 255, 255, 0.7);
}

/* 1. 變更選中後顯示在輸入框內的文字 */
.large-text-select .v-select__selection-text,
.large-text-select .v-field__input {
  font-size: 25px !important;
  font-weight: 500 !important;
}

/* 2. 變更下拉選單展開後的選項文字 */
.large-select-menu .v-list-item-title {
  font-size: 25px !important;
  font-weight: 500 !important;
}
</style>