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
        <span class="text-title">驗屋紀錄（戶別：{{ unitId }}）</span>
        <div class="btn-group">
          <v-btn color="success" class="my-4" @click="openCreateDialog">
            <v-icon left>mdi-plus</v-icon> 新增驗屋紀錄
          </v-btn>

          <v-btn color="primary" size="small" class="ml-2" @click="exportToExcel">
            <v-icon left>mdi-download</v-icon> 匯出 Excel
          </v-btn>

          <!-- ✅ 多筆刪除按鈕 -->
          <v-btn color="red" size="small" class="ml-2" :disabled="selectedKeys.length === 0" @click="confirmBulkDelete">
            <v-icon left>mdi-delete</v-icon> 刪除選取
          </v-btn>
        </div>
      </v-card-title>
      <v-card-text>
        <vue-good-table
          v-if="displayRecords.length > 0"
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
                查看照片
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

        <div v-else class="text-center text-grey py-10 text-subtitle-1">
          無驗屋紀錄
        </div>
      </v-card-text>
    </v-card>



    <!-- 新增驗屋紀錄按鈕 -->
    <v-btn color="success" class="my-4" @click="openCreateDialog">
      <v-icon left>mdi-plus</v-icon> 新增驗屋紀錄
    </v-btn>

    <!-- ✅ 新增驗屋紀錄 Dialog -->
<!-- 新增驗屋紀錄 Dialog -->
<v-dialog v-model="createDialog" max-width="800">
      <v-card>
        <v-card-title>新增驗屋紀錄</v-card-title>
        <v-card-text>
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
  :label="`照片${n}`"
  accept="image/*"
  prepend-icon="mdi-camera"
  :model-value="newRecord[`photo${n}`]"
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
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="createDialog = false">取消</v-btn>
          <v-btn color="primary" text @click="submitRecord">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


<!-- 詳細 Dialog -->
<v-dialog v-model="detailDialog" max-width="800">
  <v-card>
    <v-card-title>
      詳細資料
      <v-spacer></v-spacer>
    </v-card-title>

    <v-card-text>
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
  <div class="section-title">檢查內容</div>
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

<v-btn color="info" text @click="openPhotos(selectedRecord)">查看照片</v-btn>


<!-- ✅ 區塊三：檢修處理 -->
<v-col cols="12">
  <div class="section-title">檢修處理</div>
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

      </v-row>
    </v-card-text>

    <v-card-actions class="d-flex justify-space-between">
  <v-btn v-if="!editMode" color="primary" text @click="editMode = true">編輯</v-btn>
  <div>
    <!-- ✅ 新增：單筆刪除按鈕 -->
    <v-btn color="error" text @click="confirmDeleteRecord(selectedRecord)">刪除</v-btn>
    <v-btn color="primary" text v-if="editMode" @click="saveRecord">儲存</v-btn>
    <v-btn color="secondary" text @click="closeDetailDialog">關閉</v-btn>
  </div>
</v-card-actions>
  </v-card>
</v-dialog>


<!-- 查看照片 Dialog -->
<v-dialog v-model="photoDialog" max-width="800">
    <v-card>
      <v-card-title>查看照片</v-card-title>
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
        <v-toolbar-title>{{ zoomImageCaption }}</v-toolbar-title>
        <v-spacer></v-spacer>
      </v-toolbar>
      <v-card-text class="d-flex justify-center align-center" style="height: 100%;">
        <img :src="zoomImageUrl" style="max-width: 90vw; max-height: 90vh; object-fit: contain;" />
      </v-card-text>
    </v-card>
  </v-dialog>


<v-btn color="red" class="mb-2" @click="openTrashDialog">
      🗑️ 垃圾桶
    </v-btn>

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



  </v-container>


</template>


<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { 
  fetchInspectionRecords, 
  getRepairStatusOptions, 
  deleteInspectionRecord, 
  uploadPhotoToDrive, 
  addInspectionRecord, 
  fetchDropdownOptions, 
  fetchInspectionUpdate,
  fetchAllSubcategories,
  fetchDeletedInspectionRecords, 
  restoreInspectionRecord,
  deletePhotoFromRecord
} from '@/api';
// ✅ fetchPost 原本就已定義於 '@/api'

import { useToast } from 'vue-toastification';

const toast = useToast();
const trashDialog = ref(false);
const deletedRecords = ref([]);


import { utils, writeFile } from 'xlsx';
import { VueGoodTable } from 'vue-good-table-next';
import 'vue-good-table-next/dist/vue-good-table-next.css';
import { useUserStore } from '@/store/user';

const user = useUserStore();

const createDialog = ref(false);
const newRecord = ref({});
const formRef = ref(null);

const areaOptions = ref([]);
const categoryOptions = ref([]);
const statusOptions = ref([]);
const levelOptions = ref([]);
const subcategoryOptions = ref([]);
const allSubcategoryMap = ref({}); // ✅ 新增快取物件

const isSaving = ref(false);
const showSnackbar = ref(false);
const snackbarMessage = ref('');
const snackbarColor = ref('green');

const selectedSubcategoryOptions = ref([]);

const props = defineProps({
  unitId: String,
  records: { type: Array, default: () => [] },
  owner: String // 👈 新增這行
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
  { label: '建檔時間', field: 'createdAt' },
  { label: '驗屋日期', field: 'inspectionDate' },
  { label: '驗屋階段', field: 'inspectionStage' },
  { label: '驗屋人', field: 'inspector' },
  { label: '產權人', field: 'owner' },
  { label: '戶別', field: 'unit' },
  { label: '檢查區域', field: 'area' },
  { label: '分類', field: 'category' },
  { label: '細項', field: 'subcategory' },
  { label: '檢查狀態', field: 'inspectionStatus' },
  { label: '缺失等級', field: 'defectLevel' },
  { label: '檢查說明', field: 'description' },
  { label: '檢修時間', field: 'repairDate' },
  { label: '檢修狀態', field: 'repairStatus' },
  { label: '檢修說明', field: 'repairDescription' },
  { label: '照片', field: 'photos' },
  { label: '操作', field: 'actions' }
];

const detailFields = baseColumns.map(col => col.field).filter(f => f !== 'photos' && f !== 'actions');

const responsiveColumns = computed(() => isMobile.value
  ? [
      { label: '驗屋日期', field: 'inspectionDate' },
      { label: '檢查區域', field: 'area' },
      { label: '分類', field: 'category' },
      { label: '細項', field: 'subcategory' },
      { label: '檢查狀態', field: 'inspectionStatus' },
      { label: '操作', field: 'actions' }
    ]
  : baseColumns
);

onMounted(() => {
  window.addEventListener('resize', updateWindowWidth);
  loadRepairStatusOptions();
  loadDropdownOptions();
});
onUnmounted(() => window.removeEventListener('resize', updateWindowWidth));
const updateWindowWidth = () => windowWidth.value = window.innerWidth;

watch(() => props.records, (newVal) => {
  displayRecords.value = newVal
  .filter(r => r.deleted !== 'Y') 
  .map(row => ({
    ...row,
    photos: [row.photo1, row.photo2, row.photo3, row.photo4].filter(Boolean)
  }));
}, { immediate: true });


watch(() => newRecord.value.category, (val) => {
  if (!val) {
    subcategoryOptions.value = [];
    return;
  }
  subcategoryOptions.value = allSubcategoryMap.value[val] || [];
});


// ✅ 改成使用快取載入細項資料
watch(() => selectedRecord.value.category, (val) => {
  if (!val) {
    selectedSubcategoryOptions.value = [];
    return;
  }
  selectedSubcategoryOptions.value = allSubcategoryMap.value[val] || [];
});


const loadDropdownOptions = async () => {
  const result = await fetchDropdownOptions();
  const subResult = await fetchAllSubcategories(); // 取得細項對應表

  if (result.status === 'success') {
    areaOptions.value = result.data.areaOptions;
    categoryOptions.value = result.data.categoryOptions;
    statusOptions.value = result.data.statusOptions;
    levelOptions.value = result.data.levelOptions;
  }

  if (subResult.status === 'success') {
    allSubcategoryMap.value = subResult.data || {}; // ✅ 這才正確
  }
};


const zoomImageDialog = ref(false);
const zoomImageUrl = ref('');
const zoomImageCaption = ref(''); // 新增：顯示檢查說明


const openPhotos = (row) => {
  currentPhotos.value = ['photo1', 'photo2', 'photo3', 'photo4']
    .map(field => {
      const originalUrl = row[field];
      if (!originalUrl) return null;

      // 取出 fileId
      const m = originalUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || originalUrl.match(/\/d=([a-zA-Z0-9_-]+)/);
      if (!m) return null;

      return {
        preview: `https://lh3.googleusercontent.com/d/${m[1]}=w800`,
        fileId : m[1],        // ⭐ 之後要靠它比對
        field  : field        // ⭐ photo1~4
      };
    })
    .filter(Boolean);

  zoomImageCaption.value = row.description || '放大檢視';
  photoDialog.value = true;
};






const openDetailDialog = (row) => {
  selectedRecord.value = { ...row };
  editMode.value = false;
  detailDialog.value = true;
};

const closeDetailDialog = () => {
  detailDialog.value = false;
  editMode.value = false;
};

const saveRecord = async () => {
  isSaving.value = true;

  const res = await fetchInspectionUpdate(selectedRecord.value); // ✅ 改成這行

  if (res.status === 'success') {
    await loadRecords();
    snackbarMessage.value = '儲存成功！';
    snackbarColor.value = 'green';
    showSnackbar.value = true;
    detailDialog.value = false;
  } else {
    snackbarMessage.value = '儲存失敗：' + res.message;
    snackbarColor.value = 'red';
    showSnackbar.value = true;
  }

  isSaving.value = false;
};



const loadRecords = async () => {
  const result = await fetchInspectionRecords(props.unitId);
  if (result.status === 'success') {
    displayRecords.value = result.records
    .filter(r => r.deleted !== 'Y') 
    .map(row => ({
      ...row,
      photos: [row.photo1, row.photo2, row.photo3, row.photo4].filter(Boolean)
    }));
  }
};

const loadRepairStatusOptions = async () => {
  repairStatusOptions.value = await getRepairStatusOptions();
};

const formatLabel = (key) => {
  const labels = {
    createdAt: '建檔時間', inspectionDate: '驗屋日期', inspectionStage: '驗屋階段',
    inspector: '驗屋人', owner: '產權人', unit: '戶別', area: '檢查區域',
    category: '分類', subcategory: '細項', inspectionStatus: '檢查狀態',
    defectLevel: '缺失等級', description: '檢查說明', repairDate: '檢修時間',
    repairStatus: '檢修狀態', repairDescription: '檢修說明'
  };
  return labels[key] || key;
};

const paginationOptions = {
  enabled: true,
  perPage: 10,
  perPageDropdown: [10, 20, 50],
  dropdownAllowAll: false,
  nextLabel: '下一頁',
  prevLabel: '上一頁',
  rowsPerPageLabel: '每頁筆數',
  ofLabel: '共',
  allLabel: '全部',
  pageLabel: '頁碼'
};

const searchOptions = {
  enabled: true,
  placeholder: '搜尋表格內容...'
};

const exportToExcel = () => {
  const now = new Date();
  const timestamp = now.toLocaleString('sv-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  }).replace(/:/g, '-').replace(' ', '_');

  const exportData = displayRecords.value.map(r => ({
    '建檔時間': r.createdAt,
    '驗屋日期': r.inspectionDate,
    '驗屋階段': r.inspectionStage,
    '驗屋人': r.inspector,
    '產權人': r.owner,
    '戶別': r.unit,
    '檢查區域': r.area,
    '分類': r.category,
    '細項': r.subcategory,
    '檢查狀態': r.inspectionStatus,
    '缺失等級': r.defectLevel,
    '檢查說明': r.description,
    '檢修時間': r.repairDate,
    '檢修狀態': r.repairStatus,
    '檢修說明': r.repairDescription
  }));

  const worksheet = utils.json_to_sheet(exportData);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, '驗屋紀錄');

  const filename = `驗屋紀錄_${props.unitId}_${timestamp}.xlsx`;
  writeFile(workbook, filename);
};

const openCreateDialog = () => {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('sv-TW').replace(/:/g, '');
  const dateStr = now.toISOString().slice(0, 10);

  newRecord.value = {
    key: `${props.unitId}_${dateStr}_${timeStr}`,
    inspector: user.user?.name || '', // ✅ 修正這一行
    unit: props.unitId,
    owner: props.owner || '',
    createdAt: now.toLocaleString('sv-TW').replace(' ', ' '),
    inspectionDate: dateStr,
    inspectionStage: '',
    area: '',
    category: '',
    subcategory: '',
    inspectionStatus: '',
    defectLevel: '',
    description: '',
    photo1: null,
    photo2: null,
    photo3: null,
    photo4: null
  };

  createDialog.value = true;
};


const submitRecord = async () => {
  if (!(formRef.value?.validate())) return;

  isSaving.value = true;

  try {
    const photos = [];

    for (let i = 1; i <= 4; i++) {
      const file = newRecord.value[`photo${i}`];
      if (!file) {
        photos.push('');
        continue;
      }

      const readerResult = await readFileAsBase64(file);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${newRecord.value.key}_照片${i}.jpg`;

      const res = await uploadPhotoToDrive(filename, readerResult);
      photos.push(res.status === 'success' ? res.url : '');
    }

    const payload = {
      ...newRecord.value,
      photo1: photos[0],
      photo2: photos[1],
      photo3: photos[2],
      photo4: photos[3]
    };

    const res = await addInspectionRecord(payload);
console.log('🔍 新增 API 回傳結果:', res);

if (res?.status?.toLowerCase() === 'success') {
  snackbarMessage.value = '新增驗屋紀錄成功！';
  snackbarColor.value = 'green';
  createDialog.value = false;
  await loadRecords();
} else {
  snackbarMessage.value = `新增失敗：${res.message || '未知錯誤'}`;
  snackbarColor.value = 'red';
}
  } catch (e) {
    console.error('submitRecord 錯誤:', e);
    snackbarMessage.value = '新增時發生錯誤';
    snackbarColor.value = 'red';
  }

  showSnackbar.value = true;
  isSaving.value = false;
};

const readFileAsBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const getOptionsForField = (field) => {
  if (field === 'area') return areaOptions.value;
  if (field === 'category') return categoryOptions.value;
  if (field === 'subcategory') return editMode.value ? selectedSubcategoryOptions.value : subcategoryOptions.value;
  if (field === 'inspectionStatus') return statusOptions.value;
  if (field === 'defectLevel') return levelOptions.value;
  return [];
};
const previewUrls = ref({});

const previewImage = (file, index) => {
  if (!file) {
    previewUrls.value[index] = null;
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    previewUrls.value[index] = reader.result;
  };
  reader.readAsDataURL(file);
};

const handleFileChange = (file, index) => {
  newRecord.value[`photo${index}`] = file;

  if (!(file instanceof Blob)) {
    previewUrls.value[index] = null;
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    previewUrls.value[index] = reader.result;
  };
  reader.readAsDataURL(file);
};

// ✅ 新增多筆選取用 state
const selectedKeys = ref([]);

// ✅ 新增多筆刪除函數
const confirmBulkDelete = async () => {
  if (selectedKeys.value.length === 0) return;
  const confirmDelete = window.confirm(`確定要刪除 ${selectedKeys.value.length} 筆紀錄嗎？`);
  if (!confirmDelete) return;

  isSaving.value = true;

  for (const key of selectedKeys.value) {
    await deleteInspectionRecord(key);
  }

  selectedKeys.value = [];
  await loadRecords();

  snackbarMessage.value = '刪除完成';
  snackbarColor.value = 'green';
  showSnackbar.value = true;
  isSaving.value = false;
};

const confirmDeleteRecord = async (record) => {
  if (!record?.key) return;
  const confirmed = window.confirm('確定要刪除此紀錄嗎？');
  if (!confirmed) return;

  isSaving.value = true;
  await deleteInspectionRecord(record.key);
  await loadRecords();

  snackbarMessage.value = '已刪除此筆紀錄';
  snackbarColor.value = 'green';
  showSnackbar.value = true;
  detailDialog.value = false;
  isSaving.value = false;
};

const trashHeaders = [
  { text: '建檔時間', value: 'createdAt' },
  { text: '戶別', value: 'unit' },
  { text: '分類', value: 'category' },
  { text: '細項', value: 'subcategory' },
  { text: '檢查說明', value: 'description' },
  { text: '動作', value: 'action', sortable: false },
];

const openTrashDialog = async () => {
  trashDialog.value = true;
  await loadDeletedRecords();
};

const loadDeletedRecords = async () => {
  const res = await fetchDeletedInspectionRecords();
  if (res.status === 'success') {
    deletedRecords.value = res.data;
  } else {
    toast.error(res.message || '無法取得刪除紀錄');
  }
};

const restoreRecord = async (key) => {
  try {
    const res = await restoreInspectionRecord(key);
    if (res.status === 'success') {
      toast.success('已復原');
      await loadDeletedRecords();
    } else {
      toast.error(res.message || '復原失敗');
    }
  } catch (err) {
    toast.error('復原失敗');
  }
};

const deletePhoto = async (photoObj) => {
  if (!window.confirm('確定要刪除此照片嗎？')) return;

  const { fileId, field } = photoObj;
  const key = selectedRecord.value.key;

  // 雙保險：確認欄位真的含這個 fileId
  if (!selectedRecord.value[field] || !selectedRecord.value[field].includes(fileId)) {
    alert('找不到對應欄位，無法刪除');
    return;
  }

  try {
    // ✔ 用已經封裝好的函式，才會打到 vercel‐proxy 的網址
    const res = await deletePhotoFromRecord(key, field);

    if (res.status === 'success') {
      // 移除 carousel 中的圖
      currentPhotos.value = currentPhotos.value.filter(p => p.fileId !== fileId);
      await loadRecords();            // 重新抓最新資料
      alert(res.message || '照片已刪除');
    } else {
      alert(res.message || '刪除失敗');
    }
  } catch (e) {
    console.error(e);
    alert('刪除過程出錯');
  }
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


</style>