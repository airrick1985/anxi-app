<template>
  <v-container>
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>驗屋紀錄（戶別：{{ unitId }}）</span>
        <v-btn color="primary" @click="exportToExcel">匯出 Excel</v-btn>
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
  { label: '照片', field: 'photos' },
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
  const data = records.value.map(({ photo1, photo2, photo3, photo4, ...rest }) => rest);
  const worksheet = utils.json_to_sheet(data);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, '驗屋紀錄');
  writeFile(workbook, `驗屋紀錄_${unitId}.xlsx`);
};

onMounted(() => {
  loadRecords();
});
</script>

<style scoped>
.v-card {
  margin-top: 20px;
}
</style>
