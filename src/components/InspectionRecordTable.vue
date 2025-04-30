<template>
  <v-container>
    <v-card>
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
              <v-btn size="x-small" color="primary" @click="openPhotos(props.row.photos)">
                查看照片
              </v-btn>
            </template>
            <template v-else-if="props.column.field === 'actions'">
              <v-btn size="x-small" color="secondary" @click="openDetailDialog(props.row)">
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

    <v-dialog v-model="photoDialog" max-width="600">
      <v-card>
        <v-carousel hide-delimiter-background height="400">
          <v-carousel-item v-for="(photoUrl, index) in currentPhotos" :key="index">
            <v-img :src="photoUrl" aspect-ratio="1.6" />
          </v-carousel-item>
        </v-carousel>
      </v-card>
    </v-dialog>

    <v-dialog v-model="detailDialog" max-width="600">
      <v-card>
        <v-card-title class="justify-space-between">
          <span>詳細資料</span>
          <v-btn icon @click="toggleEditMode">
            <v-icon>{{ isEditing ? 'mdi-close' : 'mdi-pencil' }}</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text>
          <v-list dense v-if="!isEditing">
            <v-list-item v-for="field in columnFields" :key="field">
              <v-list-item-title>
                <strong>{{ formatLabel(field) }}：</strong> {{ selectedRecord[field] || '—' }}
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <div v-else>
            <v-text-field label="檢修時間" v-model="editForm.repairDate" type="date" clearable></v-text-field>
            <v-select label="檢修狀態" v-model="editForm.repairStatus" :items="repairStatusOptions" clearable></v-select>
            <v-textarea label="檢修說明" v-model="editForm.repairDescription" rows="3" auto-grow></v-textarea>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-btn color="primary" text @click="openPhotos(selectedRecord.photos)">查看照片</v-btn>
          <v-spacer></v-spacer>
          <v-btn v-if="isEditing" color="success" text @click="saveEdit">儲存</v-btn>
          <v-btn v-if="isEditing" color="grey" text @click="cancelEdit">取消</v-btn>
          <v-btn v-else color="secondary" text @click="detailDialog = false">關閉</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { fetchInspectionRecords } from '@/api';
import { utils, writeFile } from 'xlsx';
import { VueGoodTable } from 'vue-good-table-next';
import 'vue-good-table-next/dist/vue-good-table-next.css';

const props = defineProps({
  unitId: String,
  records: { type: Array, default: () => [] }
});

const displayRecords = ref([]);
const photoDialog = ref(false);
const detailDialog = ref(false);
const currentPhotos = ref([]);
const selectedRecord = ref({});
const windowWidth = ref(window.innerWidth);
const isEditing = ref(false);
const editForm = ref({ repairDate: '', repairStatus: '', repairDescription: '' });
const repairStatusOptions = ref([]); // 待串接 SHEET 資料

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
  { label: '照片', field: 'photos' }
];

const columnFields = baseColumns.map(col => col.field).filter(f => f !== 'photos');

const responsiveColumns = computed(() => {
  return isMobile.value
    ? [
        { label: '驗屋日期', field: 'inspectionDate' },
        { label: '檢查區域', field: 'area' },
        { label: '分類', field: 'category' },
        { label: '細項', field: 'subcategory' },
        { label: '檢查狀態', field: 'inspectionStatus' },
        { label: '操作', field: 'actions' }
      ]
    : [...baseColumns];
});

onMounted(() => window.addEventListener('resize', updateWindowWidth));
onUnmounted(() => window.removeEventListener('resize', updateWindowWidth));
const updateWindowWidth = () => (windowWidth.value = window.innerWidth);

watch(
  () => props.records,
  newVal => {
    displayRecords.value = newVal.map(row => ({
      ...row,
      photos: [row.photo1, row.photo2, row.photo3, row.photo4].filter(Boolean)
    }));
  },
  { immediate: true }
);

const openPhotos = photos => {
  currentPhotos.value = photos;
  photoDialog.value = true;
};

const openDetailDialog = row => {
  selectedRecord.value = row;
  detailDialog.value = true;
};

const toggleEditMode = () => {
  if (isEditing.value) cancelEdit();
  else {
    isEditing.value = true;
    editForm.value.repairDate = selectedRecord.value.repairDate || '';
    editForm.value.repairStatus = selectedRecord.value.repairStatus || '';
    editForm.value.repairDescription = selectedRecord.value.repairDescription || '';
  }
};

const cancelEdit = () => (isEditing.value = false);

const saveEdit = () => {
  selectedRecord.value.repairDate = editForm.value.repairDate;
  selectedRecord.value.repairStatus = editForm.value.repairStatus;
  selectedRecord.value.repairDescription = editForm.value.repairDescription;
  isEditing.value = false;
  console.log('儲存成功：', selectedRecord.value);
};

const formatLabel = key => {
  const labels = {
    createdAt: '建檔時間', inspectionDate: '驗屋日期', inspectionStage: '驗屋階段',
    inspector: '驗屋人', owner: '產權人', unit: '戶別', area: '檢查區域',
    category: '分類', subcategory: '細項', inspectionStatus: '檢查狀態',
    defectLevel: '缺失等級', description: '檢查說明', repairDate: '檢修時間',
    repairStatus: '檢修狀態', repairDescription: '檢修說明'
  };
  return labels[key] || key;
};

const exportToExcel = () => {
  const now = new Date();
  const timestamp = now.toLocaleString('sv-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  }).replace(/:/g, '-').replace(' ', '_');

  const exportData = displayRecords.value.map(r => ({
    '建檔時間': r.createdAt, '驗屋日期': r.inspectionDate, '驗屋階段': r.inspectionStage,
    '驗屋人': r.inspector, '產權人': r.owner, '戶別': r.unit, '檢查區域': r.area,
    '分類': r.category, '細項': r.subcategory, '檢查狀態': r.inspectionStatus,
    '缺失等級': r.defectLevel, '檢查說明': r.description,
    '檢修時間': r.repairDate, '檢修狀態': r.repairStatus,
    '檢修說明': r.repairDescription
  }));

  const worksheet = utils.json_to_sheet(exportData);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, '驗屋紀錄');

  const filename = `驗屋紀錄_${props.unitId}_${timestamp}.xlsx`;
  writeFile(workbook, filename);
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
</script>

<style scoped>
.v-card {
  margin-top: 20px;
}
.v-card-text {
  padding-top: 10px;
}
.v-list-item {
  padding-top: 2px !important;
  padding-bottom: 2px !important;
  min-height: unset !important;
}
.v-list-item-title {
  font-size: 0.9em;
  line-height: 1.4;
  white-space: pre-line;
}
</style>