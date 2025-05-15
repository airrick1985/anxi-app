<template>

  
  <v-container fluid class="pa-0 ma-0">
    <!-- Snackbar -->
    <v-snackbar v-model="showSnackbar" timeout="3000" :color="snackbarColor">
      {{ snackbarMessage }}
    </v-snackbar>

         <!-- 操作區塊 -->
    <v-card style="width: 100%; margin: 0;">
      <v-overlay :model-value="isSaving" persistent class="d-flex justify-center align-center">
        <v-progress-circular indeterminate size="64" color="primary" />
      </v-overlay>

<v-card-title class="d-flex flex-wrap justify-space-between align-center">
  <span class="text-title">{{ tableTitle }}</span>

  <div v-if="!isMobile" class="btn-group">
  
    <v-btn color="success" size="small" class="my-4" @click="openCreateDialog">
      <v-icon left>mdi-plus</v-icon> 新增驗屋紀錄
    </v-btn>
    <v-btn color="primary" size="small" class="ml-2" @click="exportToExcel">
      <v-icon left>mdi-download</v-icon> 匯出 Excel
    </v-btn>
    <v-btn color="red" size="small" class="ml-2" :disabled="selectedKeys.length === 0" @click="confirmBulkDelete">
      <v-icon left>mdi-delete</v-icon> 刪除選取
    </v-btn>
    <v-btn color="grey" size="small" class="ml-2" @click="openTrashDialog">
      <v-icon left>mdi-trash-can-outline</v-icon> 垃圾桶
    </v-btn>
    <v-btn color="teal" size="small" class="ml-2" @click="openShareDialog">
  <v-icon left>mdi-share-variant</v-icon> 產出分享頁
</v-btn>
<v-btn color="purple" size="small" class="ml-2" @click="handleExportPdf">
  <v-icon left>mdi-file-pdf-box</v-icon> 匯出驗屋紀錄PDF
</v-btn>

  </div>

  <!-- ✅ 手機版選單 -->
  <div v-else class="my-2">
    <v-menu>
      <template #activator="{ props }">
        <v-btn v-bind="props" icon>
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
      </template>

      <v-list dense>
        <v-list-item @click="openCreateDialog">
          <v-list-item-title><v-icon left>mdi-plus</v-icon> 新增驗屋紀錄</v-list-item-title>
        </v-list-item>
        <v-list-item @click="exportToExcel">
          <v-list-item-title><v-icon left>mdi-download</v-icon> 匯出 Excel</v-list-item-title>
        </v-list-item>
        <v-list-item @click="confirmBulkDelete" :disabled="selectedKeys.length === 0">
          <v-list-item-title><v-icon left>mdi-delete</v-icon> 刪除選取</v-list-item-title>
        </v-list-item>
        <v-list-item @click="openTrashDialog">
          <v-list-item-title><v-icon left>mdi-trash-can-outline</v-icon> 垃圾桶</v-list-item-title>
        </v-list-item>
        <v-list-item @click="openShareDialog">
        <v-list-item-title>
          <v-icon left>mdi-share-variant</v-icon> 產出分享頁
        </v-list-item-title>
        </v-list-item>
         <v-list-item @click="handleExportPdf">
        <v-list-item-title>
          <v-icon left>mdi-file-pdf-box</v-icon> 匯出驗屋紀錄PDF
        </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</v-card-title>


      <v-card-text>
   <div v-if="displayRecords.length > 0">
        <vue-good-table
          :columns="[{ label: '', field: 'checkbox', width: '30px' }, ...responsiveColumns]"
          :rows="displayRecords"
          :search-options="searchOptions"
          :pagination-options="paginationOptions"
          style="width: 100%"
        >
          <template #table-row="props">
            <template v-if="props.column.field === 'checkbox'">
              <v-checkbox v-model="selectedKeys" :value="props.row.key" hide-details density="compact" class="pa-0 ma-0" />
            </template>
            <template v-else-if="props.column.field === 'photos'">
              <v-btn size="small" color="primary" @click="openPhotos(props.row)">
                缺失照片
              </v-btn>
            </template>
            <template v-else-if="props.column.field === 'repairPhotos'">
              <v-btn size="small" color="indigo" @click="openPhotos(props.row, true)">
                檢修照片
              </v-btn>
            </template>

            <template v-else-if="props.column.field === 'actions'">
              <v-btn size="small" color="secondary" class="mr-1" @click="openDetailDialog(props.row)">
                詳細
              </v-btn>
            </template>
            <template v-else>
              <span class="table-text">{{ props.formattedRow[props.column.field] }}</span>
            </template>
          </template>
        </vue-good-table>
        </div>
        <div v-else class="text-center text-grey py-10 text-subtitle-1">
        <!-- 根據 displayMode 顯示不同的無記錄提示 -->
        <span v-if="props.displayMode === 'allUnits'">此建案尚無任何驗屋紀錄</span>
        <span v-else-if="props.unitId">戶別 {{ props.unitId }} 尚無驗屋紀錄</span>
        <span v-else>無驗屋紀錄</span>
      </div>
    </v-card-text>
    </v-card>




   
<!-- 新增驗屋紀錄 Dialog -->
<v-dialog v-model="createDialog" max-width="800">
  <v-card class="d-flex flex-column" style="height: 90vh;">
    <v-card-title>新增驗屋紀錄</v-card-title>

    <v-card-text class="flex-grow-1 overflow-y-auto" style="padding-bottom: 100px;">
      <v-form ref="formRef" lazy-validation>
        <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field label="驗屋人" v-model="newRecord.inspector" readonly required></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field label="戶別" v-model="newRecord.unit" readonly></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field label="產權人" v-model="newRecord.owner" readonly></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field label="建檔時間" v-model="newRecord.createdAt" readonly></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field label="驗屋日期" v-model="newRecord.inspectionDate" type="date" required></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-select label="驗屋階段" v-model="newRecord.inspectionStage" :items="['初驗','複驗']" required></v-select>
              </v-col>
              <v-col cols="12" sm="6">
                <v-select label="檢查區域" v-model="newRecord.area" :items="areaOptions" required></v-select>
              </v-col>
              <v-col cols="12" sm="6">
                <v-select label="分類" v-model="newRecord.category" :items="categoryOptions" required></v-select>
              </v-col>
              <v-col cols="12" sm="6">
                <v-select label="細項" v-model="newRecord.subcategory" :items="subcategoryOptions" required></v-select>

              </v-col>
              <v-col cols="12" sm="6">
                <v-select label="檢查狀態" v-model="newRecord.inspectionStatus" :items="statusOptions" required></v-select>
              </v-col>
              <v-col cols="12" sm="6">
                <v-select label="缺失等級" v-model="newRecord.defectLevel" :items="levelOptions" required></v-select>
              </v-col>
              <v-col cols="12">
                <v-textarea label="檢查說明" v-model="newRecord.description" rows="3"></v-textarea>
              </v-col>
<!-- 照片上傳與預覽縮圖 -->
<v-col cols="12" sm="3" v-for="n in 4" :key="n">
  <v-file-input
  v-model="newRecord[`photo${n}`]"
  :label="`照片${n}`"
  accept="image/*"
  prepend-icon="mdi-camera"
  @update:model-value="file => handleFileChange(file, n)"
/>


  <div v-if="previewUrls[n]" class="mt-2 text-center">
    <img
      :src="previewUrls[n]"
      style="max-width: 100%; max-height: 100px; object-fit: contain; border: 1px solid #ccc; border-radius: 4px;"
    />
  </div>
</v-col>
            </v-row>
          </v-form>
        </v-card-text>
      <v-card-actions
      class="justify-end px-4 py-3"
      style="position: sticky; bottom: 0; background: white; border-top: 1px solid #ddd; z-index: 2;"
    >
      <v-btn text @click="createDialog = false">取消</v-btn>
      <v-btn color="primary" text @click="submitRecord">儲存</v-btn>
    </v-card-actions>
      </v-card>
    </v-dialog>


<!-- 詳細 Dialog -->
<v-dialog v-model="detailDialog" max-width="800">
  <v-card class="d-flex flex-column" style="height: 90vh;">
    <v-card-title>
      詳細資料
      <v-spacer></v-spacer>
    </v-card-title>

    <v-card-text class="flex-grow-1 overflow-y-auto" style="padding-bottom: 100px;">
      <v-row dense>

        <!-- ✅ 區塊一：基本資料 -->
<v-col cols="12">
  <div class="section-title">基本資料</div>
</v-col>
<v-col cols="12" sm="6" v-for="field in ['createdAt', 'inspectionDate', 'inspectionStage', 'inspector', 'owner']" :key="field">
  <template v-if="editMode">
    <v-select
      v-if="field === 'inspectionStage'"
      v-model="selectedRecord[field]"
      :items="['初驗','複驗']"
      :label="formatLabel(field)"
      dense
    />
    <v-text-field
      v-else
      v-model="selectedRecord[field]"
      :label="formatLabel(field)"
      :readonly="['createdAt', 'inspector', 'owner'].includes(field)"
      :type="field.includes('Date') ? 'date' : 'text'"
      dense
    />
  </template>
  <template v-else>
    <div><strong>{{ formatLabel(field) }}：</strong> {{ selectedRecord[field] || '—' }}</div>
  </template>
</v-col>



<!-- ✅ 區塊二：檢查內容 -->
<v-col cols="12">
  <div class="section-title">檢查內容</div><v-btn color="info" text @click="openPhotos(selectedRecord)">缺失照片</v-btn>

</v-col>
<v-col cols="12" sm="6" v-for="field in ['unit', 'area', 'category', 'subcategory', 'inspectionStatus', 'defectLevel', 'description']" :key="field">
  <template v-if="editMode">
    <v-select
      v-if="['area', 'category', 'subcategory', 'inspectionStatus', 'defectLevel'].includes(field)"
      v-model="selectedRecord[field]"
      :items="getOptionsForField(field)"
      :label="formatLabel(field)"
      :readonly="['unit'].includes(field)"
      dense
    />
    <v-textarea
      v-else-if="field === 'description'"
      v-model="selectedRecord[field]"
      :label="formatLabel(field)"
      rows="2"
      dense
    />
    <v-text-field
      v-else
      v-model="selectedRecord[field]"
      :label="formatLabel(field)"
      :readonly="['unit'].includes(field)"
      dense
    />
  </template>
  <template v-else>
    <div><strong>{{ formatLabel(field) }}：</strong> {{ selectedRecord[field] || '—' }}</div>
  </template>
</v-col>


<!-- ✅ 新增缺失照片（僅編輯模式下顯示） -->
<template v-if="editMode">
  <v-col cols="12">
    <div class="section-title">新增缺失照片</div>
  </v-col>

  <v-col cols="12" sm="3" v-for="n in 4" :key="'detail-photo-' + n">
    <v-file-input
      :label="`上傳缺失照片${n}`"
      v-model="selectedRecord[`newPhoto${n}`]"
      accept="image/*"
      prepend-icon="mdi-camera"
      @update:model-value="file => handleFileChange(file, n)"
    />
    <div v-if="previewUrls[n]" class="mt-2 text-center">
      <img
        :src="previewUrls[n]"
        style="max-width: 100%; max-height: 100px; object-fit: contain; border: 1px solid #ccc; border-radius: 4px;"
      />
    </div>
  </v-col>
</template>


<!-- ✅ 區塊三：檢修處理 -->
<v-col cols="12">
  <div class="section-title">檢修處理</div>      <v-btn color="indigo" text @click="openPhotos(selectedRecord, true)">檢修照片</v-btn>

</v-col>

<v-col cols="12" sm="6" v-for="field in ['repairDate', 'repairStatus', 'repairDescription']" :key="field">
  <template v-if="editMode">
    <v-text-field
      v-if="field === 'repairDate'"
      v-model="selectedRecord[field]"
      :label="formatLabel(field)"
      type="date"
      dense
    />
    <v-select
      v-else-if="field === 'repairStatus'"
      v-model="selectedRecord[field]"
      :items="repairStatusOptions"
      :label="formatLabel(field)"
      dense
    />
    <v-textarea
      v-else
      v-model="selectedRecord[field]"
      :label="formatLabel(field)"
      rows="2"
      dense
    />
  </template>
  <template v-else>
    <div><strong>{{ formatLabel(field) }}：</strong> {{ selectedRecord[field] || '—' }}</div>
  </template>
</v-col>
    
      


<!-- ✅ 區塊四：新增檢修照片（editMode 時可見） -->
<template v-if="editMode">
  <v-col cols="12">
    <div class="section-title">新增檢修照片</div>
  </v-col>

  <v-col cols="12" sm="3" v-for="n in 4" :key="'repair-photo-' + n">
    <v-file-input
      v-model="selectedRecord[`repairPhoto${n}`]"
      :label="`上傳檢修照片${n}`"
      accept="image/*"
      prepend-icon="mdi-camera"
      @update:model-value="file => handleRepairPhotoChange(file, n)"
    />
    <div v-if="previewRepairUrls[n]" class="mt-2 text-center">
      <img
        :src="previewRepairUrls[n]"
        style="max-width: 100%; max-height: 100px; object-fit: contain; border: 1px solid #ccc; border-radius: 4px;"
      />
    </div>
  </v-col>
</template>

  </v-row>
      
    </v-card-text>
<v-card-actions
  class="px-4 py-3"
  style="position: sticky; bottom: 0; background: white; border-top: 1px solid #ddd; z-index: 2; justify-content: flex-end;"
>
  <v-btn v-if="!editMode" color="primary" text @click="editMode = true">編輯</v-btn>
  <v-btn v-if="!editMode" color="error" text @click="confirmDeleteRecord(selectedRecord)">刪除</v-btn>
  <v-btn text @click="closeDetailDialog">關閉</v-btn>
  <v-btn v-if="editMode" color="primary" text @click="saveRecord">儲存</v-btn>

</v-card-actions>

  </v-card>
</v-dialog>


<!-- 缺失照片 Dialog -->
<v-dialog v-model="photoDialog" max-width="800">
    <v-card>
      <v-card-title>{{ isRepairView ? '檢修照片' : '缺失照片' }}</v-card-title>
      <v-card-text>
        <v-carousel
  v-if="currentPhotos.length"
  hide-delimiters
  height="400"
  show-arrows
>
  <v-carousel-item
    v-for="(photo, idx) in currentPhotos"
    :key="idx"
  >
    <div class="d-flex flex-column align-center justify-center" style="height:100%">
      <img
        :src="photo.preview"
        style="max-height:300px;width:100%;object-fit:contain;cursor:zoom-in"
        @click="zoomImageUrl = photo.preview; zoomImageDialog = true"
      />
      <v-btn
        color="error"
        class="mt-2"
        size="small"
        @click="deletePhoto(photo)"     
      >
        <v-icon left>mdi-delete</v-icon> 刪除照片
      </v-btn>
    </div>
  </v-carousel-item>
</v-carousel>

        <div v-else class="text-center py-5 text-subtitle-1">
          無照片可顯示
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text color="primary" @click="photoDialog = false">關閉</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- //加入全螢幕 Dialog 來顯示放大圖片 -->
  <v-dialog v-model="zoomImageDialog" fullscreen hide-overlay transition="dialog-bottom-transition">
    <v-card>
      <v-toolbar dark color="primary">
        <v-btn icon @click="zoomImageDialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
<div
  class="custom-toolbar-title"
  :style="{ fontSize: isMobile.value ? '0.8rem' : '1.2rem' }"
>
  {{ zoomImageCaption }}
</div>


        <v-spacer></v-spacer>
      </v-toolbar>
      <v-card-text class="d-flex justify-center align-center" style="height: 100%;">
        <img :src="zoomImageUrl" style="max-width: 90vw; max-height: 90vh; object-fit: contain;" />
      </v-card-text>
    </v-card>
  </v-dialog>




    <v-dialog v-model="trashDialog" max-width="800px">
  <v-card>
    <v-card-title>
      <div class="d-flex justify-space-between align-center w-100">
        <span>已刪除紀錄</span>
        <v-btn icon @click="trashDialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>
    </v-card-title>
    <v-card-text>
      <v-data-table :headers="trashHeaders" :items="deletedRecords" dense>
        <template v-slot:item.action="{ item }">
          <v-btn color="primary" @click="restoreRecord(item.key)">復原</v-btn>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</v-dialog>

<!-- ✅ 右下角浮動 + 按鈕 -->
<v-btn
  v-if="props.unitId && !createDialog && !detailDialog"
  icon
  color="success"
  class="fab"
  @click="openCreateDialog"
>
  <v-icon>mdi-plus</v-icon>
</v-btn>

<!-- ✅ PDF產出中提示 -->
<v-dialog v-model="pdfGenerating" persistent max-width="300px">
  <v-card class="pa-4 d-flex flex-column align-center justify-center">
    <v-progress-circular indeterminate color="primary" size="48" />
    <div class="mt-4 text-center">產出中，請稍候...</div>
  </v-card>
</v-dialog>

  </v-container>

  <PhotoEditor
  v-if="showEditor"       
  v-model="showEditor"
  :file="tempFile"
  @done="onEditorDone"
  @cancel="showEditor = false"
/>

<v-dialog v-model="shareDialog" max-width="500px">
  <v-card>
    <v-card-title class="text-h6">驗屋分享頁面</v-card-title>
    <v-card-text>
      <p class="mb-2">請掃描 QR Code 或複製網址分享給客戶：</p>
      <div class="text-center mb-4">
        <img :src="qrCodeDataUrl" alt="QR Code" style="width: 200px;" />
      </div>
      <v-text-field v-model="shareUrl" readonly append-icon="mdi-content-copy" @click:append="copyShareUrl" />
    </v-card-text>
    <v-card-actions class="justify-end">
      <v-btn text @click="shareDialog = false">關閉</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>


</template>



<script setup>
import PhotoEditor from '@/components/PhotoEditor.vue';
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import {
  getRepairStatusOptions,
  deleteInspectionRecord,
  uploadPhotoToDrive,
  addInspectionRecord,
  fetchDropdownOptions,
  fetchAllSubcategories,
  fetchDeletedInspectionRecords,
  restoreInspectionRecord,
  deletePhotoFromRecord,
  fetchInspectionUpdateWithPhotos,
  fetchGenerateInspectionPdf,
  generateShareUrl
} from '@/api';

import { useToast } from 'vue-toastification';
import { utils, writeFile } from 'xlsx';
import { VueGoodTable } from 'vue-good-table-next';
import 'vue-good-table-next/dist/vue-good-table-next.css';
import { useUserStore } from '@/store/user';
import QRCode from 'qrcode';

const toast = useToast();
const userStore = useUserStore();
const emit = defineEmits(['records-updated']); // ✅ 定義 emit

const trashDialog = ref(false);
const deletedRecords = ref([]);
const showEditor = ref(false);
const editingIdx = ref(null);
const tempFile = ref(null);
const previewRepairUrls = ref({});
const isRepairPhoto = ref(false);
const pdfGenerating = ref(false);
const shareDialog = ref(false);
const shareUrl = ref('');
const qrCodeDataUrl = ref('');

const createDialog = ref(false);
const newRecord = ref({});
const formRef = ref(null);

const areaOptions = ref([]);
const categoryOptions = ref([]);
const statusOptions = ref([]);
const levelOptions = ref([]);
const subcategoryOptions = ref([]);
const allSubcategoryMap = ref({});
const isRepairView = ref(false);

const isSaving = ref(false);
// const showSnackbar = ref(false); // Snackbar 的 v-model 在 template 中，這裡不需要重複定義
// const snackbarMessage = ref('');
// const snackbarColor = ref('green');

const selectedSubcategoryOptions = ref([]);

const props = defineProps({
  unitId: String,
  records: { type: Array, default: () => [] },
  owner: String,
  displayMode: { type: String, default: 'singleUnit' }
});

const tableTitle = computed(() => {
  if (props.displayMode === 'allUnits') {
    const projectName = userStore.user?.projectName || '所有';
    return `驗屋紀錄 (${projectName}建案 - 所有戶別)`;
  } else if (props.unitId) {
    return `驗屋紀錄（戶別：${props.unitId}）`;
  } else {
    return '驗屋紀錄';
  }
});

const displayRecords = ref([]);
const photoDialog = ref(false);
const detailDialog = ref(false);
const currentPhotos = ref([]);
const selectedRecord = ref({});
const repairStatusOptions = ref([]);
const editMode = ref(false);
const windowWidth = ref(window.innerWidth);
const isMobile = computed(() => windowWidth.value < 600);

const baseColumns = [
  { label: '建檔時間', field: 'createdAt', width: '150px' },
  { label: '驗屋日期', field: 'inspectionDate', width: '120px' },
  { label: '驗屋階段', field: 'inspectionStage', width: '100px' },
  { label: '驗屋人', field: 'inspector', width: '100px' },
  { label: '產權人', field: 'owner', width: '100px' },
  { label: '戶別', field: 'unit', width: '100px' },
  { label: '檢查區域', field: 'area', width: '120px' },
  { label: '分類', field: 'category', width: '120px' },
  { label: '細項', field: 'subcategory', width: '120px' },
  { label: '檢查狀態', field: 'inspectionStatus', width: '100px' },
  { label: '缺失等級', field: 'defectLevel', width: '100px' },
  { label: '檢查說明', field: 'description', width: '200px' },
  { label: '檢修時間', field: 'repairDate', width: '120px' },
  { label: '檢修狀態', field: 'repairStatus', width: '100px' },
  { label: '檢修說明', field: 'repairDescription', width: '200px' },
  { label: '缺失照片', field: 'photos', sortable: false, width: '120px' },
  { label: '檢修照片', field: 'repairPhotos', sortable: false, width: '120px' },
  { label: '操作', field: 'actions', sortable: false, width: '100px' }
];

const responsiveColumns = computed(() => isMobile.value
  ? [
      { label: '驗屋日期', field: 'inspectionDate' },
      { label: '檢查區域', field: 'area' },
      { label: '分類', field: 'category' },
      { label: '細項', field: 'subcategory' },
      { label: '檢查狀態', field: 'inspectionStatus' },
      { label: '操作', field: 'actions', sortable: false }
    ]
  : baseColumns
);

const updateWindowWidth = () => windowWidth.value = window.innerWidth;

onMounted(() => {
  window.addEventListener('resize', updateWindowWidth);
  loadRepairStatusOptions();
  loadDropdownOptions();
});

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth);
});

watch(() => props.records, (newVal) => {
  displayRecords.value = (newVal || [])
    .filter(r => r.deleted !== 'Y')
    .map(row => ({
      ...row,
      photos: [row.photo1, row.photo2, row.photo3, row.photo4].filter(Boolean),
      repairPhotos: [row.defectPhoto1, row.defectPhoto2, row.defectPhoto3, row.defectPhoto4].filter(Boolean)
    }));
}, { immediate: true, deep: true });

watch(() => newRecord.value.category, (val) => {
  if (!val || !allSubcategoryMap.value) {
    subcategoryOptions.value = []; return;
  }
  subcategoryOptions.value = allSubcategoryMap.value[val] || [];
});

watch(() => selectedRecord.value.category, (val) => {
  if (!val || !allSubcategoryMap.value) {
    selectedSubcategoryOptions.value = []; return;
  }
  selectedSubcategoryOptions.value = allSubcategoryMap.value[val] || [];
});

const loadDropdownOptions = async () => {
  const currentProjectName = userStore.user?.projectName;
  if (!currentProjectName) {
    toast.error("無法獲取建案資訊，下拉選單可能不完整。");
    return;
  }
  const result = await fetchDropdownOptions(currentProjectName);
  const subResult = await fetchAllSubcategories(currentProjectName);
  if (result.status === 'success' && result.data) {
    areaOptions.value = result.data.areaOptions || [];
    categoryOptions.value = result.data.categoryOptions || [];
    statusOptions.value = result.data.statusOptions || [];
    levelOptions.value = result.data.levelOptions || [];
  } else if (result.status !== 'success') {
    toast.error(result.message || '載入下拉選單失敗');
  }
  if (subResult.status === 'success' && subResult.data) {
    allSubcategoryMap.value = subResult.data || {};
  } else if (subResult.status !== 'success') {
    toast.error(subResult.message || '載入細項資料失敗');
  }
};

const zoomImageDialog = ref(false);
const zoomImageUrl = ref('');
const zoomImageCaption = ref('');
// const isRepairView = ref(false); // 已在頂部定義

const openPhotos = (row, isRepair = false) => {
  selectedRecord.value = { ...row };
  isRepairView.value = isRepair;
  let photoFields;
  if (isRepair) {
    photoFields = ['defectPhoto1', 'defectPhoto2', 'defectPhoto3', 'defectPhoto4'];
    zoomImageCaption.value = row.repairDescription || row.description || '檢修照片';
  } else {
    photoFields = ['photo1', 'photo2', 'photo3', 'photo4'];
    zoomImageCaption.value = row.description || '缺失照片';
  }
  currentPhotos.value = photoFields.map(field => {
    const originalUrl = row[field];
    if (!originalUrl) return null;
    const patterns = [ /\/file\/d\/([a-zA-Z0-9_-]+)\//, /id=([a-zA-Z0-9_-]+)/, /\/d\/([a-zA-Z0-9_-]+)/ ];
    let fileIdMatch = null;
    for (const pattern of patterns) {
      const match = originalUrl.match(pattern);
      if (match && match[1]) { fileIdMatch = match[1]; break; }
    }
    if (!fileIdMatch) { console.warn(`[openPhotos] Could not extract file ID from URL: ${originalUrl} for field: ${field}`); return null; }
    return { preview: `https://lh3.googleusercontent.com/d/${fileIdMatch}=w800`, fileId: fileIdMatch, field: field };
  }).filter(Boolean);
  photoDialog.value = true;
};

const openDetailDialog = (row) => {
  selectedRecord.value = { ...row };
  editMode.value = false;
  detailDialog.value = true;
};

const closeDetailDialog = () => {
  for (let i = 1; i <= 4; i++) {
    delete selectedRecord.value[`newPhoto${i}`];
    if (previewUrls.value[i]) { URL.revokeObjectURL(previewUrls.value[i]); delete previewUrls.value[i]; }
    delete selectedRecord.value[`repairPhoto${i}`];
    if (previewRepairUrls.value[i]) { URL.revokeObjectURL(previewRepairUrls.value[i]); delete previewRepairUrls.value[i]; }
  }
  detailDialog.value = false; editMode.value = false;
};

const saveRecord = async () => {
  const currentProjectName = userStore.user?.projectName;
  if (!currentProjectName) { toast.error("無法獲取建案資訊，儲存失敗。"); return; }
  isSaving.value = true;
  try {
    const record = { ...selectedRecord.value };
    const photos = []; const repairPhotos = [];
    for (let i = 1; i <= 4; i++) {
      const newFile = record[`newPhoto${i}`];
      if (!newFile) { photos.push(record[`photo${i}`] || ''); }
      else { const base64 = await readFileAsBase64(newFile); const filename = `${record.key}_照片${i}.jpg`; const res = await uploadPhotoToDrive(filename, base64); photos.push(res.status === 'success' ? res.url : ''); }
      const repairFile = record[`repairPhoto${i}`];
      if (!repairFile) { repairPhotos.push(record[`defectPhoto${i}`] || ''); }
      else { const base64 = await readFileAsBase64(repairFile); const filename = `${record.key}_缺失照片${i}.jpg`; const res = await uploadPhotoToDrive(filename, base64); repairPhotos.push(res.status === 'success' ? res.url : ''); }
    }
    const payload = { ...record, photo1: photos[0], photo2: photos[1], photo3: photos[2], photo4: photos[3], defectPhoto1: repairPhotos[0], defectPhoto2: repairPhotos[1], defectPhoto3: repairPhotos[2], defectPhoto4: repairPhotos[3] };
    const res = await fetchInspectionUpdateWithPhotos(payload, currentProjectName);
    for (let i = 1; i <= 4; i++) {
      delete selectedRecord.value[`newPhoto${i}`]; if (previewUrls.value[i]) { URL.revokeObjectURL(previewUrls.value[i]); delete previewUrls.value[i]; }
      delete selectedRecord.value[`repairPhoto${i}`]; if (previewRepairUrls.value[i]) { URL.revokeObjectURL(previewRepairUrls.value[i]); delete previewRepairUrls.value[i]; }
    }
    if (res.status === 'success') {
      emit('records-updated'); // ✅ Emit event
      toast.success('儲存成功！');
      detailDialog.value = false;
    } else { toast.error(`儲存失敗：${res.message || '未知錯誤'}`); }
  } catch (err) { console.error("saveRecord error:", err); toast.error('儲存時發生錯誤'); }
  isSaving.value = false;
};

const loadRecords = async () => { // This function's role is now primarily to signal parent or for internal state if not fully prop-driven
  console.log("[InspectionRecordTable] loadRecords called. Relies on parent to update props.records or emit event if self-fetching.");
  // If this component were to fetch its own data (not recommended with current props structure):
  // const currentProjectName = userStore.user?.projectName;
  // if (!props.unitId || !currentProjectName) { return; }
  // const result = await fetchInspectionRecords(props.unitId, currentProjectName); // Assuming fetchInspectionRecords is imported
  // if (result.status === 'success') { /* update local displayRecords if not relying on prop watcher */ }
  // else { toast.error('Failed to reload records'); }
};

const loadRepairStatusOptions = async () => {
  const currentProjectName = userStore.user?.projectName;
  if (!currentProjectName) { console.warn("[InspectionRecordTable] loadRepairStatusOptions: projectName is missing."); }
  repairStatusOptions.value = await getRepairStatusOptions(currentProjectName);
};

const formatLabel = (key) => {
  const labels = { createdAt: '建檔時間', inspectionDate: '驗屋日期', inspectionStage: '驗屋階段', inspector: '驗屋人', owner: '產權人', unit: '戶別', area: '檢查區域', category: '分類', subcategory: '細項', inspectionStatus: '檢查狀態', defectLevel: '缺失等級', description: '檢查說明', repairDate: '檢修時間', repairStatus: '檢修狀態', repairDescription: '檢修說明' };
  return labels[key] || key;
};

const paginationOptions = { enabled: true, perPage: 10, perPageDropdown: [10, 20, 50], dropdownAllowAll: false, nextLabel: '下一頁', prevLabel: '上一頁', rowsPerPageLabel: '每頁筆數', ofLabel: '共', allLabel: '全部', pageLabel: '頁碼' };
const searchOptions = { enabled: true, placeholder: '搜尋表格內容...' };

const exportToExcel = () => {
  const now = new Date(); const timestamp = now.toLocaleString('sv-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/:/g, '-').replace(' ', '_');
  const exportData = (displayRecords.value || []).map(r => ({ '建檔時間': r.createdAt, '驗屋日期': r.inspectionDate, '驗屋階段': r.inspectionStage, '驗屋人': r.inspector, '產權人': r.owner, '戶別': r.unit, '檢查區域': r.area, '分類': r.category, '細項': r.subcategory, '檢查狀態': r.inspectionStatus, '缺失等級': r.defectLevel, '檢查說明': r.description, '檢修時間': r.repairDate, '檢修狀態': r.repairStatus, '檢修說明': r.repairDescription }));
  const worksheet = utils.json_to_sheet(exportData); const workbook = utils.book_new(); utils.book_append_sheet(workbook, worksheet, '驗屋紀錄');
  const filename = `驗屋紀錄_${props.unitId || '所有戶別'}_${timestamp}.xlsx`; writeFile(workbook, filename);
};

const openCreateDialog = () => {
  if (!props.unitId && props.displayMode === 'singleUnit') {
    toast.error("請先從上方選擇一個戶別以新增記錄。");
    return;
  }
  const now = new Date(); const timeStr = now.toLocaleTimeString('sv-TW', { hour12: false }).replace(/:/g, ''); const dateStr = now.toISOString().slice(0, 10);
  newRecord.value = {
    key: `${props.unitId || 'ALL'}_${dateStr}_${timeStr}`, // 如果 unitId 為空，可能需要不同 key 生成策略
    inspector: userStore.user?.name || '',
    unit: props.unitId || '', // 如果是所有戶別模式下新增，這裡需要用戶選擇或填寫
    owner: props.owner || '', // 同上，owner 可能需要根據選擇的 unit 動態獲取
    createdAt: now.toLocaleString('sv-TW').replace('T', ' ').substring(0, 19),
    inspectionDate: dateStr, inspectionStage: '', area: '', category: '', subcategory: '',
    inspectionStatus: '', defectLevel: '', description: '',
    photo1: null, photo2: null, photo3: null, photo4: null
  };
  Object.keys(previewUrls.value).forEach(key => URL.revokeObjectURL(previewUrls.value[key])); previewUrls.value = {};
  createDialog.value = true;
};

const submitRecord = async () => {
  const currentProjectName = userStore.user?.projectName;
  if (!currentProjectName) { toast.error("無法獲取建案資訊，新增失敗。"); return; }
  if (!formRef.value) return;
  const { valid } = await formRef.value.validate(); // 解構 valid
  if (!valid) { toast.error("請檢查表單必填欄位！"); return; }

  isSaving.value = true;
  let apiResponseStatus = 'error'; // 用於判斷是否 emit
  try {
    const photos = [];
    for (let i = 1; i <= 4; i++) {
      const file = newRecord.value[`photo${i}`];
      if (!file) { photos.push(''); continue; }
      const base64 = await readFileAsBase64(file); const filename = `${newRecord.value.key}_照片${i}.jpg`;
      const res = await uploadPhotoToDrive(filename, base64); photos.push(res.status === 'success' ? res.url : '');
    }
    const payload = { ...newRecord.value, photo1: photos[0], photo2: photos[1], photo3: photos[2], photo4: photos[3] };
    const res = await addInspectionRecord(payload, currentProjectName);
    if (res?.status?.toLowerCase() === 'success') {
      toast.success('新增驗屋紀錄成功！');
      createDialog.value = false;
      apiResponseStatus = 'success'; // 標記成功
    } else {
      toast.error(`新增失敗：${res.message || '未知錯誤'}`);
    }
  } catch (e) { console.error('submitRecord 錯誤:', e); toast.error('新增時發生錯誤'); }
  isSaving.value = false;
  if (apiResponseStatus === 'success') {
    emit('records-updated'); // ✅ Emit event
  }
};

const readFileAsBase64 = (file) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = reject; reader.readAsDataURL(file); });
const getOptionsForField = (field) => { if (field === 'area') return areaOptions.value; if (field === 'category') return categoryOptions.value; if (field === 'subcategory') return editMode.value ? selectedSubcategoryOptions.value : subcategoryOptions.value; if (field === 'inspectionStatus') return statusOptions.value; if (field === 'defectLevel') return levelOptions.value; return []; };

const previewUrls = ref({});
const previewImage = (file, index) => { if (previewUrls.value[index]) { URL.revokeObjectURL(previewUrls.value[index]); } previewUrls.value[index] = file ? URL.createObjectURL(file) : null; };

const handleFileChange = (file, idx) => {
  if (!file) {
    previewUrls.value[idx] = null;
    if (createDialog.value) { newRecord.value[`photo${idx}`] = null; }
    else if (detailDialog.value) { selectedRecord.value[`newPhoto${idx}`] = null; }
    return;
  }
  editingIdx.value = idx; tempFile.value = file; isRepairPhoto.value = false; showEditor.value = true;
};

const selectedKeys = ref([]);
const confirmBulkDelete = async () => {
  const currentProjectName = userStore.user?.projectName;
  if (!currentProjectName) { toast.error("無法獲取建案資訊，刪除失敗。"); return; }
  if (selectedKeys.value.length === 0) return;
  if (!window.confirm(`確定要刪除 ${selectedKeys.value.length} 筆紀錄嗎？`)) return;
  isSaving.value = true;
  let allSucceeded = true;
  for (const key of selectedKeys.value) { const res = await deleteInspectionRecord(key, currentProjectName); if (res.status !== 'success') allSucceeded = false; }
  selectedKeys.value = [];
  isSaving.value = false;
  if (allSucceeded) { toast.success('選取紀錄已刪除'); emit('records-updated'); } // ✅ Emit event
  else { toast.error('部分紀錄刪除失敗，請重試'); emit('records-updated'); /*即使部分失敗也刷新*/ }
};

const confirmDeleteRecord = async (record) => {
  const currentProjectName = userStore.user?.projectName;
  if (!currentProjectName) { toast.error("無法獲取建案資訊，刪除失敗。"); return; }
  if (!record?.key) return;
  if (!window.confirm('確定要刪除此紀錄嗎？')) return;
  isSaving.value = true;
  const res = await deleteInspectionRecord(record.key, currentProjectName);
  isSaving.value = false;
  if (res.status === 'success') {
    toast.success('已刪除此筆紀錄');
    detailDialog.value = false;
    emit('records-updated'); // ✅ Emit event
  } else {
    toast.error(res.message || '刪除失敗');
  }
};

const trashHeaders = ref([ { title: '建檔時間', key: 'createdAt', value: 'createdAt' }, { title: '戶別', key: 'unit', value: 'unit' }, { title: '分類', key: 'category', value: 'category' }, { title: '細項', key: 'subcategory', value: 'subcategory' }, { title: '檢查說明', key: 'description', value: 'description' }, { title: '動作', key: 'action', value: 'action', sortable: false }, ]);
const openTrashDialog = async () => { trashDialog.value = true; await loadDeletedRecords(); };

const loadDeletedRecords = async () => {
  const currentProjectName = userStore.user?.projectName;
  if (!currentProjectName) { toast.error("無法獲取建案資訊，無法載入已刪除紀錄。"); deletedRecords.value = []; return; }
  const res = await fetchDeletedInspectionRecords(currentProjectName);
  if (res.status === 'success') { deletedRecords.value = res.data || []; }
  else { toast.error(res.message || '無法取得刪除紀錄'); }
};

const restoreRecord = async (key) => {
  const currentProjectName = userStore.user?.projectName;
  if (!currentProjectName) { toast.error("無法獲取建案資訊，復原失敗。"); return; }
  try {
    const res = await restoreInspectionRecord(key, currentProjectName);
    if (res.status === 'success') {
      toast.success('已復原');
      await loadDeletedRecords();
      emit('records-updated'); // ✅ Emit event
    } else { toast.error(res.message || '復原失敗'); }
  } catch (err) { toast.error('復原失敗'); }
};

const deletePhoto = async (photoObj) => {
  const currentProjectName = userStore.user?.projectName;
  if (!currentProjectName) { toast.error("無法獲取建案資訊，刪除照片失敗。"); return; }
  if (!window.confirm('確定要刪除此照片嗎？')) return;
  const { fileId, field } = photoObj; const key = selectedRecord.value.key;
  if (!selectedRecord.value[field] || !selectedRecord.value[field].includes(fileId)) { toast.error('找不到對應欄位，無法刪除'); return; }
  isSaving.value = true;
  try {
    const res = await deletePhotoFromRecord(key, field, currentProjectName);
    if (res.status === 'success') {
      currentPhotos.value = currentPhotos.value.filter(p => p.fileId !== fileId);
      selectedRecord.value[field] = '';
      const idx = field.replace(/[^\d]/g, '');
      if (isRepairView.value) { delete previewRepairUrls.value[idx]; } else { delete previewUrls.value[idx]; }
      toast.success('照片已刪除');
      emit('records-updated'); // ✅ Emit event
    } else { toast.error(res.message || '刪除失敗'); }
  } catch (e) { console.error(e); toast.error('刪除過程出錯'); }
  isSaving.value = false;
};

const openShareDialog = async () => {
  const currentProjectName = userStore.user?.projectName;
  if (!props.unitId && props.displayMode === 'singleUnit') { // 只有單一戶別模式且選了戶別才產出
      toast.error("請先選擇一個戶別以產生分享頁面。");
      return;
  }
  if (props.displayMode === 'allUnits') {
      toast.info("分享功能僅適用於單一戶別檢視模式。");
      return;
  }
  if (!currentProjectName) { toast.error("缺少建案資訊，無法產生分享頁。"); return; }

  isSaving.value = true;
  try {
    const res = await generateShareUrl(props.unitId, currentProjectName);
    if (res.status === 'success' && res.url) {
      shareUrl.value = res.url; qrCodeDataUrl.value = await QRCode.toDataURL(res.url); shareDialog.value = true;
    } else { toast.error(res.message || '產生分享頁失敗'); }
  } catch (e) { console.error(e); toast.error('產出分享頁錯誤'); }
  isSaving.value = false;
};

const copyShareUrl = async () => { try { await navigator.clipboard.writeText(shareUrl.value); toast.success('已複製分享連結'); } catch (e) { toast.error('複製失敗，請手動複製'); } };
const handleRepairPhotoChange = (file, idx) => { if (!file) { previewRepairUrls.value[idx] = null; selectedRecord.value[`repairPhoto${idx}`] = null; return; } isRepairPhoto.value = true; editingIdx.value = idx; tempFile.value = file; showEditor.value = true; };

const onEditorDone = async (annotatedFile) => {
  if (!annotatedFile || !(annotatedFile instanceof File)) { toast.error('編輯後的圖片無效'); showEditor.value = false; return; }
  const idx = editingIdx.value; if (!idx) { showEditor.value = false; return; }
  if (createDialog.value) { newRecord.value[`photo${idx}`] = annotatedFile; previewImage(annotatedFile, idx); }
  else if (detailDialog.value) {
    if (isRepairPhoto.value) { selectedRecord.value[`repairPhoto${idx}`] = annotatedFile; previewRepairUrls.value[idx] = URL.createObjectURL(annotatedFile); }
    else { selectedRecord.value[`newPhoto${idx}`] = annotatedFile; previewImage(annotatedFile, idx); }
  }
  showEditor.value = false;
};

const handleExportPdf = async () => {
  const currentProjectName = userStore.user?.projectName;
   if (!props.unitId && props.displayMode === 'singleUnit') {
      toast.error("請先選擇一個戶別以匯出 PDF。");
      return;
  }
  if (props.displayMode === 'allUnits') {
      toast.info("PDF 匯出功能僅適用於單一戶別檢視模式。");
      return;
  }
  if (!currentProjectName) { toast.error("缺少建案資訊，無法匯出 PDF。"); return; }

  pdfGenerating.value = true;
  const res = await fetchGenerateInspectionPdf(props.unitId, currentProjectName);
  if (res.status === 'exists') {
    if (!window.confirm(res.message + '\n\n是否要覆蓋？')) { pdfGenerating.value = false; return; }
    const overwriteRes = await fetchGenerateInspectionPdf(props.unitId, currentProjectName, true);
    if (overwriteRes.status === 'success' && overwriteRes.url) { window.open(overwriteRes.url, '_blank'); }
    else { toast.error(overwriteRes.message || '覆蓋產生 PDF 失敗'); }
  } else if (res.status === 'success' && res.url) { window.open(res.url, '_blank'); }
  else { toast.error(res.message || '產出 PDF 失敗'); }
  pdfGenerating.value = false;
};

</script>

<style scoped>
.v-card { margin-top: 20px; }
.v-card-text { padding-top: 10px; }
.v-list-item { padding-top: 2px !important; padding-bottom: 2px !important; min-height: unset !important; }
.v-list-item-title { font-size: 0.9em; line-height: 1.4; white-space: pre-line; }
.v-btn + .v-btn { margin-left: 8px; }

/* ✅ 表格字體大小設定為 12px */
::v-deep(.vue-good-table .vgt-table) {
  font-size: 14px !important;
  line-height: 1.5;
}
::v-deep(.vue-good-table .vgt-table td) {
  font-size: 12px !important;
  padding: 8px 6px;
}
.table-text {
  font-size: 14px;
}

/* 加強表單欄位排版可讀性 */
.v-card-text .v-col {
  margin-bottom: 8px;
}

.v-card-text .v-input {
  font-size: 14px;
}
.v-card-text .v-label {
  font-weight: 500;
}

.section-title {
  font-weight: bold;
  font-size: 1.2rem;
  margin: 24px 0 8px;
  padding-left: 12px;
  border-left: 4px solid #1976d2;
  color: #1976d2;
}

@media (max-width: 600px) {
  .v-card-actions.sticky-actions {
    padding-bottom: env(safe-area-inset-bottom);
  }
}

::v-deep(.v-data-table thead th) {
  background-color: #f5f5f5;
  font-weight: bold;
}


.fab {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

::v-deep(.v-toolbar-title) {
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: unset !important;
  display: block !important; /* 有助於換行顯示 */
  line-height: 1.4 !important;
}

.zoom-title-mobile {
  font-size: 0.8rem;
  white-space: normal;
  line-height: 1.4;
}

.zoom-title-desktop {
  font-size: 1.2rem;
  white-space: normal;
  line-height: 1.4;
}

.custom-toolbar-title {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.4;
  max-width: 80vw;
}

/* 示例：調整標題行高 */
.v-list-item-title {
  line-height: 2.5; /* 增加行高 */
}



</style>