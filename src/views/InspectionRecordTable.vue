<template>
  <v-container>
    <v-card>
      <v-card-title class="text-h6">驗屋紀錄</v-card-title>
      <v-divider></v-divider>

      <v-card-text>
        <v-text-field
          v-model="search"
          label="搜尋"
          prepend-inner-icon="mdi-magnify"
          outlined
          dense
          hide-details
          class="mb-4"
        />

        <v-data-table
          :headers="headers"
          :items="filteredRecords"
          :search="search"
          :sort-by="['createdAt']"
          class="elevation-1"
          :loading="loading"
        >
          <template v-slot:no-data>
            <v-alert type="info" class="mt-4">
              目前尚無驗屋紀錄
            </v-alert>
          </template>

          <template v-slot:item.photos="{ item }">
            <v-btn
              v-if="item.photos && item.photos.length"
              color="primary"
              variant="text"
              size="small"
              @click="openPhotos(item.photos)"
            >
              查看照片
            </v-btn>
            <span v-else>無</span>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- 照片查看 Dialog -->
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
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { fetchInspectionRecords } from '@/api'; // 你自己的API方法

const route = useRoute();
const unitId = route.params.unitId;
const search = ref('');
const loading = ref(false);
const records = ref([]);
const photoDialog = ref(false);
const currentPhotos = ref([]);

// 表格欄位設定
const headers = [
  { text: '建檔時間', value: 'createdAt' },
  { text: '驗屋日期', value: 'inspectionDate' },
  { text: '驗屋階段', value: 'inspectionStage' },
  { text: '驗屋人', value: 'inspector' },
  { text: '產權人', value: 'owner' },
  { text: '戶別', value: 'unit' },
  { text: '檢查區域', value: 'area' },
  { text: '分類', value: 'category' },
  { text: '細項', value: 'subcategory' },
  { text: '檢查狀態', value: 'inspectionStatus' },
  { text: '缺失等級', value: 'defectLevel' },
  { text: '檢查說明', value: 'description' },
  { text: '檢修時間', value: 'repairDate' },
  { text: '檢修狀態', value: 'repairStatus' },
  { text: '照片', value: 'photos', sortable: false },
];

// 篩選處理
const filteredRecords = computed(() => {
  return records.value.map(record => ({
    ...record,
    photos: [record.photo1, record.photo2, record.photo3, record.photo4].filter(url => url)
  }));
});

// 載入資料
const loadRecords = async () => {
  if (!unitId) return;
  loading.value = true;
  try {
    const result = await fetchInspectionRecords(unitId);
    if (result.status === 'success') {
      records.value = result.records;
    } else {
      records.value = [];
    }
  } catch (err) {
    console.error('撈取紀錄失敗', err);
    records.value = [];
  } finally {
    loading.value = false;
  }
};

// 查看照片
const openPhotos = (photos) => {
  currentPhotos.value = photos;
  photoDialog.value = true;
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
