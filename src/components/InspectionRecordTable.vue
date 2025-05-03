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
        </div>
      </v-card-title>

      <v-card-text>
        <vue-good-table
          v-if="displayRecords.length > 0"
          :columns="responsiveColumns"
          :rows="displayRecords"
          :search-options="{ enabled: true }"
          :pagination-options="paginationOptions"
          style="width: 100%"
        >
          <template #table-row="props">
            <template v-if="props.column.field === 'photos'">
              <v-btn size="small" color="primary" @click="openPhotos(props.row.photos)">
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

  <!-- 詳細 Dialog -->
<v-dialog v-model="detailDialog" max-width="800">
  <v-card>
    <v-card-title>
      詳細資料
      <v-spacer></v-spacer>
    </v-card-title>

    <v-card-text>
      <v-row dense>
        <v-col cols="12" sm="6" v-for="field in detailFields" :key="field">
          <template v-if="editMode">
            <v-text-field
              v-if="['createdAt', 'inspectionDate', 'inspector', 'owner', 'unit'].includes(field)"
              v-model="selectedRecord[field]"
              :label="formatLabel(field)"
              :readonly="['createdAt', 'inspector', 'owner', 'unit'].includes(field)"
              type="date"
            />
            <v-select
              v-else-if="field === 'inspectionStage'"
              v-model="selectedRecord.inspectionStage"
              :items="['初驗','複驗']"
              label="驗屋階段"
            />
            <v-select
              v-else-if="field === 'area'"
              v-model="selectedRecord.area"
              :items="areaOptions"
              label="檢查區域"
            />
            <v-select
              v-else-if="field === 'category'"
              v-model="selectedRecord.category"
              :items="categoryOptions"
              label="分類"
            />
            <v-select
              v-else-if="field === 'subcategory'"
              v-model="selectedRecord.subcategory"
              :items="subcategoryOptions"
              label="細項"
            />
            <v-select
              v-else-if="field === 'inspectionStatus'"
              v-model="selectedRecord.inspectionStatus"
              :items="statusOptions"
              label="檢查狀態"
            />
            <v-select
              v-else-if="field === 'defectLevel'"
              v-model="selectedRecord.defectLevel"
              :items="levelOptions"
              label="缺失等級"
            />
            <v-select
              v-else-if="field === 'repairStatus'"
              v-model="selectedRecord.repairStatus"
              :items="repairStatusOptions"
              label="檢修狀態"
            />
            <v-text-field
              v-else-if="field === 'repairDate'"
              v-model="selectedRecord.repairDate"
              label="檢修時間"
              type="date"
            />
            <v-textarea
              v-else-if="field === 'repairDescription' || field === 'description'"
              v-model="selectedRecord[field]"
              :label="formatLabel(field)"
              rows="2"
            />
            <v-text-field
              v-else
              v-model="selectedRecord[field]"
              :label="formatLabel(field)"
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
        <v-btn color="primary" text v-if="editMode" @click="saveRecord">儲存</v-btn>
        <v-btn color="secondary" text @click="closeDetailDialog">關閉</v-btn>
      </div>
    </v-card-actions>
  </v-card>
</v-dialog>

    <!-- 新增驗屋紀錄按鈕 -->
    <v-btn color="success" class="my-4" @click="openCreateDialog">
      <v-icon left>mdi-plus</v-icon> 新增驗屋紀錄
    </v-btn>

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
              <v-col cols="12" sm="3" v-for="n in 4" :key="n">
                <v-file-input v-model="newRecord[`photo${n}`]" label="照片{{n}}" accept="image/*" prepend-icon="mdi-camera"></v-file-input>
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
  </v-container>
</template>


<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { fetchInspectionRecords, updateInspectionRecord, getRepairStatusOptions, uploadPhotoToDrive, addInspectionRecord, fetchDropdownOptions, fetchSubcategories } from '@/api';
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

const isSaving = ref(false);
const showSnackbar = ref(false);
const snackbarMessage = ref('');
const snackbarColor = ref('green');

const props = defineProps({
  unitId: String,
  records: { type: Array, default: () => [] }
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
  displayRecords.value = newVal.map(row => ({
    ...row,
    photos: [row.photo1, row.photo2, row.photo3, row.photo4].filter(Boolean)
  }));
}, { immediate: true });

watch(() => newRecord.value.category, async (val) => {
  if (!val) {
    subcategoryOptions.value = [];
    return;
  }
  const res = await fetchSubcategories(val);
  subcategoryOptions.value = res.status === 'success' ? res.subcategories : [];
});

const loadDropdownOptions = async () => {
  const result = await fetchDropdownOptions();
  if (result.status === 'success') {
    areaOptions.value = result.data.areaOptions;
    categoryOptions.value = result.data.categoryOptions;
    statusOptions.value = result.data.statusOptions;
    levelOptions.value = result.data.levelOptions;
  }
};

const openPhotos = (photos) => {
  currentPhotos.value = photos;
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
  const { key, repairDate, repairStatus, repairDescription } = selectedRecord.value;
  const payload = {
    action: 'update_inspection_record',
    key,
    repairDate,
    repairStatus,
    repairDescription
  };
  const res = await updateInspectionRecord(payload);
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
    displayRecords.value = result.records.map(row => ({
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
    owner: props.records[0]?.owner || '',
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
      const filename = `${newRecord.value.unit}_${newRecord.value.inspectionStage}_${newRecord.value.area}_${newRecord.value.category}_${newRecord.value.subcategory}_${newRecord.value.inspectionStatus}_${newRecord.value.defectLevel}_照片${i}_${newRecord.value.inspector}_${timestamp}.jpg`;

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
    if (res.status === 'success') {
      snackbarMessage.value = '新增驗屋紀錄成功！';
      snackbarColor.value = 'green';
      createDialog.value = false;
      await loadRecords();
    } else {
      snackbarMessage.value = `新增失敗：${res.message}`;
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
</style>