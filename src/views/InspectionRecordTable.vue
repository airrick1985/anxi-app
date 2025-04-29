<template>
  <v-container>
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>驗屋紀錄（戶別：{{ unitId }}）</span>
        <div>
          <v-btn icon @click="fetchData"><v-icon>mdi-refresh</v-icon></v-btn>
          <v-btn small @click="exportToExcel">
            <v-icon left>mdi-download</v-icon>匯出 Excel
          </v-btn>
        </div>
      </v-card-title>

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
        <div class="table-wrapper">
          <v-data-table
            :headers="computedHeaders"
            :items="records"
            :search="search"
            class="elevation-1"
          >
            <!-- 照片欄 -->
            <template #item.photos="{ item }">
              <v-btn
                v-if="item.photos.length"
                small
                text
                @click="openPhotos(item.photos)"
              >查看照片</v-btn>
              <span v-else>—</span>
            </template>
            <!-- 操作欄：打開詳細資料 -->
            <template #item.actions="{ item }">
              <v-btn small text @click="viewDetail(item)">詳情</v-btn>
            </template>
            <template #no-data>
              <v-alert type="info">目前尚無驗屋紀錄</v-alert>
            </template>
          </v-data-table>
        </div>
      </v-card-text>
    </v-card>

    <!-- 詳細資料 Dialog -->
    <v-dialog v-model="detailDialog" max-width="500">
      <v-card>
        <v-card-title>詳細資料</v-card-title>
        <v-divider />
        <v-card-text>
          <div v-for="(value, key) in selectedRow" :key="key" class="mb-2">
            <strong>{{ labelMap[key] || key }}：</strong> {{ value }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="detailDialog = false">關閉</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 照片相簿 Dialog -->
    <v-dialog v-model="photoDialog" max-width="600">
      <v-card>
        <v-carousel hide-delimiter-background height="400">
          <v-carousel-item
            v-for="(url, i) in currentPhotos"
            :key="i"
          >
            <v-img :src="url" aspect-ratio="1.6" />
          </v-carousel-item>
        </v-carousel>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { fetchInspectionRecords } from '@/api';
import { utils, writeFile } from 'xlsx';

const route = useRoute();
const unitId = route.params.unitId;

const search = ref('');
const records = ref([]);
const detailDialog = ref(false);
const selectedRow = ref({});
const photoDialog = ref(false);
const currentPhotos = ref([]);

// 完整欄位與手機版要保留的欄位
const allHeaders = [
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
  { text: '操作', value: 'actions', sortable: false }
];
const mobileFields = [
  'unit',
  'area',
  'subcategory',
  'inspectionStatus',
  'defectLevel',
  'photos',
  'actions'
];

const windowWidth = ref(window.innerWidth);
const computedHeaders = computed(() =>
  windowWidth.value <= 768
    ? allHeaders.filter(h => mobileFields.includes(h.value))
    : allHeaders
);

function onResize() {
  windowWidth.value = window.innerWidth;
}

onMounted(() => {
  window.addEventListener('resize', onResize);
  fetchData();
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
});

// 讀取資料並加工 photos 陣列
async function fetchData() {
  const res = await fetchInspectionRecords(unitId);
  if (res.status === 'success') {
    records.value = res.records.map(r => ({
      ...r,
      photos: [r.photo1, r.photo2, r.photo3, r.photo4].filter(Boolean)
    }));
  }
}

// 打開詳細 Dialog
function viewDetail(item) {
  selectedRow.value = item;
  detailDialog.value = true;
}

// 打開照片相簿
function openPhotos(list) {
  currentPhotos.value = list;
  photoDialog.value = true;
}

// 欄位中文對照
const labelMap = allHeaders.reduce((map, h) => {
  map[h.value] = h.text;
  return map;
}, {});

// 匯出 Excel
function exportToExcel() {
  const now = new Date();
  const ts = now
    .toLocaleString('sv-TW', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    })
    .replace(/:/g, '-')
    .replace(' ', '_');

  const data = records.value.map(r => ({
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

  const ws = utils.json_to_sheet(data);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, '驗屋紀錄');
  writeFile(wb, `驗屋紀錄_${unitId}_${ts}.xlsx`);
}
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
