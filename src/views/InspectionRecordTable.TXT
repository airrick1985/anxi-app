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
        <vue-good-table
          :columns="columns"
          :rows="records"
          :search-options="{ enabled: true }"
          :pagination-options="{ enabled: true, perPage: 10 }"
        >
          <template #table-row="props">
            <span v-if="props.column.field === 'photos'">
              <v-btn size="x-small" color="primary" @click="openPhotos(props.row.photos)">
                查看照片
              </v-btn>
            </span>
            <span v-else>
              {{ props.formattedRow[props.column.field] }}
            </span>
          </template>
        </vue-good-table>
      </v-card-text>
    </v-card>

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
import 'vue-good-table-next/dist/vue-good-table-next.css'; // 記得要引入CSS

const route = useRoute();
const unitId = route.params.unitId;
const records = ref([]);
const photoDialog = ref(false);
const currentPhotos = ref([]);

const columns = [
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
  { label: '照片', field: 'photos' }
];

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
</style>
