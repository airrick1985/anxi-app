<template>
  <v-container>
  <v-snackbar v-model="showSnackbar" timeout="3000" color="green">
    儲存成功！
  </v-snackbar>
    <v-card>
        <v-overlay :model-value="isSaving" persistent class="d-flex justify-center align-center">
          <v-progress-circular indeterminate size="64" color="primary" />
        </v-overlay>
      <v-card-title class="d-flex flex-wrap justify-space-between align-center">
        <span class="text-title">驗屋紀錄（戶別：{{ unitId }}）</span>
        <div class="btn-group">
          <v-btn color="primary" size="small" icon @click="loadRecords">
            <v-icon>mdi-refresh</v-icon>
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
              {{ props.formattedRow[props.column.field] }}
            </template>
          </template>
        </vue-good-table>

        <div v-else class="text-center text-grey py-10 text-subtitle-1">
          無驗屋紀錄
        </div>
      </v-card-text>
    </v-card>

    <!-- 詳細 Dialog -->
    <v-dialog v-model="detailDialog" max-width="600">
      <v-card>
        <v-card-title>
          詳細資料
          <v-spacer></v-spacer>
          
        </v-card-title>

        <v-card-text>
          <div v-for="field in detailFields" :key="field" class="py-1">
            <template v-if="editMode && ['repairDate', 'repairStatus', 'repairDescription'].includes(field)">
              <v-text-field
                v-if="field === 'repairDate'"
                v-model="selectedRecord.repairDate"
                label="檢修時間"
                type="date"
                dense
              />
              <v-select
                v-else-if="field === 'repairStatus'"
                v-model="selectedRecord.repairStatus"
                :items="repairStatusOptions"
                label="檢修狀態"
                dense
              />
              <v-textarea
                v-else-if="field === 'repairDescription'"
                v-model="selectedRecord.repairDescription"
                label="檢修說明"
                rows="3"
              />
            </template>
            <template v-else>
              <div><strong>{{ formatLabel(field) }}：</strong> {{ selectedRecord[field] || '—' }}</div>
            </template>
          </div>
        </v-card-text>

        <v-card-actions class="d-flex justify-space-between">
  <v-btn v-if="!editMode" color="primary" text @click="editMode = true">
    填寫檢修狀況
  </v-btn>
  <div>
    <v-btn color="primary" text v-if="editMode" @click="saveRecord">儲存</v-btn>
    <v-btn color="secondary" text @click="closeDetailDialog">關閉</v-btn>
  </div>
</v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { fetchInspectionRecords, updateInspectionRecord, getRepairStatusOptions } from '@/api';
import { utils, writeFile } from 'xlsx';
import { VueGoodTable } from 'vue-good-table-next';
import 'vue-good-table-next/dist/vue-good-table-next.css';

const isSaving = ref(false);
const showSnackbar = ref(false);

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
});
onUnmounted(() => window.removeEventListener('resize', updateWindowWidth));
const updateWindowWidth = () => windowWidth.value = window.innerWidth;

watch(() => props.records, (newVal) => {
  displayRecords.value = newVal.map(row => ({
    ...row,
    photos: [row.photo1, row.photo2, row.photo3, row.photo4].filter(Boolean)
  }));
}, { immediate: true });

const openPhotos = (photos) => {
  currentPhotos.value = photos;
  photoDialog.value = true;
};

const openDetailDialog = (row) => {
  selectedRecord.value = { ...row }; // 保留 key
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
    showSnackbar.value = true;
    detailDialog.value = false;
  } else {
    alert('儲存失敗：' + res.message);
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
</script>

<style scoped>
.v-card { margin-top: 20px; }
.v-card-text { padding-top: 10px; }
.v-list-item { padding-top: 2px !important; padding-bottom: 2px !important; min-height: unset !important; }
.v-list-item-title { font-size: 0.9em; line-height: 1.4; white-space: pre-line; }
</style>
