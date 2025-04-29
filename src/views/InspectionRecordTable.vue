<template>
  <v-container>
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>驗屋紀錄（戶別：{{ unitId }}）</span>
        <div>
          <v-btn color="primary" size="small" icon @click="loadRecords">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
          <v-btn color="primary" size="small" class="ml-2" @click="exportToExcel">
            <v-icon left>mdi-download</v-icon> 匯出 Excel
          </v-btn>
        </div>
      </v-card-title>

      <v-card-text>
        <div class="table-wrapper">
          <vue-good-table
            :columns="displayColumns"
            :rows="records"
            :search-options="{ enabled: true }"
            :pagination-options="{ enabled: true, perPage: 10 }"
            @on-row-click="viewDetail"
          >
          </vue-good-table>
        </div>
      </v-card-text>
    </v-card>

    <!-- 詳細資料 Dialog -->
    <v-dialog v-model="detailDialog" max-width="600">
      <v-card>
        <v-card-title class="text-h6">詳細資料</v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <div v-for="(value, key) in selectedRow" :key="key" class="mb-2">
            <strong>{{ columnNameMap[key] || key }}：</strong> {{ value }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" text @click="detailDialog = false">關閉</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 照片 Dialog -->
    <v-dialog v-model="photoDialog" max-width="600">
      <v-card>
        <v-carousel hide-delimiter-background height="400">
          <v-carousel-item
            v-for="(photoUrl, index) in currentPhotos"
            :key="index"
          >
            <v-img :src="photoUrl" aspect-ratio="1.6" />
          </v-carousel-item>
        </v-carousel>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { fetchInspectionRecords } from '@/api';
import { utils, writeFile } from 'xlsx';
import { VueGoodTable } from 'vue-good-table-next';
import 'vue-good-table-next/dist/vue-good-table-next.css';

const route = useRoute();
const unitId = route.params.unitId;
const records = ref([]);
const photoDialog = ref(false);
const currentPhotos = ref([]);
const detailDialog = ref(false);
const selectedRow = ref({});

const displayColumns = [
  { label: '戶別', field: 'unit' },
  { label: '檢查區域', field: 'area' },
  { label: '細項', field: 'subcategory' },
  { label: '檢查狀態', field: 'inspectionStatus' },
  { label: '缺失等級', field: 'defectLevel' }
];

// 中文欄位名稱對照表
const columnNameMap = {
  createdAt: '建檔時間',
  inspectionDate: '驗屋日期',
  inspectionStage: '驗屋階段',
  inspector: '驗屋人',
  owner: '產權人',
  unit: '戶別',
  area: '檢查區域',
  category: '分類',
  subcategory: '細項',
  inspectionStatus: '檢查狀態',
  defectLevel: '缺失等級',
  description: '檢查說明',
  repairDate: '檢修時間',
  repairStatus: '檢修狀態'
};

const loadRecords = async () => {
  const result = await fetchInspectionRecords(unitId);
  if (result.status === 'success') {
    records.value = result.records.map(row => ({
      ...row,
      photos: [row.photo1, row.photo2, row.photo3, row.photo4].filter(Boolean),
    }));
  }
};

const openPhotos = (photos) => {
  currentPhotos.value = photos;
  photoDialog.value = true;
};

const viewDetail = (row) => {
  selectedRow.value = row;
  detailDialog.value = true;
};

const exportToExcel = () => {
  const now = new Date();
  const timestamp = now.toLocaleString('sv-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  }).replace(/:/g, '-').replace(' ', '_');

  const exportData = records.value.map(r => ({
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
    '檢修狀態': r.repairStatus
  }));

  const worksheet = utils.json_to_sheet(exportData);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, '驗屋紀錄');

  const filename = `驗屋紀錄_${unitId}_${timestamp}.xlsx`;
  writeFile(workbook, filename);
};

onMounted(() => {
  loadRecords();
});
</script>

<style scoped>
.v-card {
  margin-top: 20px;
}
.v-card-text {
  padding-top: 10px;
}
.table-wrapper {
  overflow-x: auto;
}
</style>
