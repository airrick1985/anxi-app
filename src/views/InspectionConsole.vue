<template>
  <v-container fluid class="pa-2 pa-sm-4" style="background-color: #F4F4F7; min-height: 100vh;">
    <v-card class="mx-auto" max-width="1600">
      <v-toolbar color="primary" dark flat>
        <v-toolbar-title class="font-weight-bold">{{ projectName }} 驗屋紀錄</v-toolbar-title>
        <v-spacer></v-spacer>
        </v-toolbar>

      <div v-if="isLoading" class="text-center pa-10">
        <v-progress-circular indeterminate color="primary" size="50"></v-progress-circular>
        <p class="mt-4 text-grey">{{ loadingText }}</p>
      </div>

      <div v-else-if="!isBound" class="text-center pa-10">
        <v-icon size="60" color="warning" class="mb-4">mdi-account-alert-outline</v-icon>
        <p class="text-h6">無法使用此功能</p>
        <p class="mt-2 text-grey-darken-1">您的 LINE 帳號尚未綁定系統手機，請先完成綁定。</p>
        <v-btn color="primary" class="mt-6" href="/?liff_path=line-binding" variant="elevated">
          前往綁定頁面
        </v-btn>
      </div>

      <div v-else>
        <v-sheet class="pa-3 border-b">
          <v-row dense align="center">
            <v-col cols="12" md="3">
              <v-select
                v-model="selectedBuilding"
                :items="buildingItems"
                label="選擇棟別"
                variant="outlined"
                density="compact"
                hide-details
                clearable
                @update:model-value="selectedUnit = null; loadRecords()"
                :loading="isLoadingStructure"
              ></v-select>
            </v-col>
            <v-col cols="12" md="3">
              <v-select
                v-model="selectedUnit"
                :items="unitItems"
                label="選擇戶別"
                variant="outlined"
                density="compact"
                hide-details
                clearable
                :disabled="!selectedBuilding"
                @update:model-value="loadRecords()"
              ></v-select>
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model="searchFilter"
                label="搜尋所有欄位"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                hide-details
                clearable
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="2" class="d-flex justify-end">
              <v-btn
                color="primary"
                @click="openAddDialog"
                prepend-icon="mdi-plus"
                :disabled="!selectedUnit || !selectedBuilding"
              >
                新增紀錄
              </v-btn>
            </v-col>
          </v-row>
        </v-sheet>

        <v-data-table
          :headers="headers"
          :items="filteredRecords"
          :loading="isLoadingRecords"
          :search="searchFilter"
          item-value="id"
          class="elevation-0"
          :items-per-page="10"
         :items-per-page-options="[
           { value: 10, title: '10' },
           { value: 25, title: '25' },
           { value: 50, title: '50' },
           { value: 100, title: '100' },
           { value: -1, title: '全部顯示' }
         ]"
        >
          <template v-slot:item.photos="{ item }">
              <div class="d-flex ga-1 pa-1">
                 <v-img
                    v-for="(photo, index) in item.photos.slice(0, 4)" :key="index"
                    :src="photo.url"
                    aspect-ratio="1"
                    cover
                    width="40"
                    class="rounded border cursor-pointer"
                    @click="showImagePreview(photo.url)"
                 >
                    <template v-slot:placeholder>
                        <div class="d-flex align-center justify-center fill-height">
                        <v-progress-circular indeterminate color="grey-lighten-4"></v-progress-circular>
                        </div>
                    </template>
                 </v-img>
              </div>
          </template>

          <template v-slot:item.status="{ item }">
              <ChipRenderer :value="item.status" type="status" :options="optionsForChips.status" />
          </template>
           <template v-slot:item.level="{ item }">
              <ChipRenderer :value="item.level" type="level" :options="optionsForChips.level" />
          </template>
           <template v-slot:item.progress="{ item }">
              <ChipRenderer :value="item.progress" type="progress" :options="optionsForChips.progress" />
          </template>

          <template v-slot:item.inspectionDate="{ item }">
              {{ formatDate(item.inspectionDate) }}
           </template>
            <template v-slot:item.createdAt="{ item }">
                {{ formatDateTime(item.createdAt) }}
            </template>


          <template v-slot:item.actions="{ item }">
            <v-icon small class="mr-2" @click="openEditDialog(item)">mdi-pencil</v-icon>
            </template>

          <template v-slot:no-data>
             <div class="pa-4 text-center text-grey">
                {{ selectedUnit ? '此戶別尚無驗屋紀錄' : '請先選擇棟別與戶別' }}
             </div>
          </template>
        </v-data-table>
      </div>
    </v-card>

    <InspectionRecordEditor
      v-model="showEditorDialog"
      :project-id="projectId"
      :project-name="projectName"
      :unit-id="selectedUnit"
      :record-to-edit="recordBeingEdited"
      @saved="handleRecordSaved"
    />

    <v-dialog v-model="showPreviewDialog" max-width="80vw" max-height="90vh">
        <v-card>
             <v-toolbar dense flat class="border-b">
                <v-spacer></v-spacer>
                <v-btn icon="mdi-close" @click="showPreviewDialog = false"></v-btn>
            </v-toolbar>
            <v-card-text class="pa-0">
                <v-img :src="previewImageUrl" contain max-height="calc(90vh - 48px)"></v-img>
            </v-card-text>
        </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue';
import { useRoute } from 'vue-router';
import liff from '@line/liff';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
import { getProjectStructureFB, getInspectionRecordsFB, getInspectionOptionsForProjectFB } from '@/api';
import { VDataTable } from 'vuetify/components/VDataTable' 
import InspectionRecordEditor from '@/components/InspectionRecordEditor.vue';
import ChipRenderer from '@/components/ChipRenderer.vue'; // 假設有一個 Chip 渲染元件
import { format, parseISO } from 'date-fns';
import { zhTW } from 'date-fns/locale';

const route = useRoute();
const userStore = useUserStore();
const projectStore = useProjectStore();

const projectId = computed(() => route.params.projectId);
const projectName = computed(() => projectStore.idToNameMap[projectId.value] || '建案');

const isLoading = ref(true);
const loadingText = ref('正在初始化...');
const isBound = ref(false);
const isLoadingStructure = ref(false);
const isLoadingRecords = ref(false);

const projectStructure = ref({}); // { "A棟": ["A1-01"], ... }
const selectedBuilding = ref(null);
const selectedUnit = ref(null);
const allRecords = ref([]);
const searchFilter = ref('');

const showEditorDialog = ref(false);
const recordBeingEdited = ref(null);

const showPreviewDialog = ref(false);
const previewImageUrl = ref('');

// 用於 Chip 渲染的選項緩存
const optionsForChips = reactive({ status: [], level: [], progress: [] });


// --- Computed ---
const buildingItems = computed(() => Object.keys(projectStructure.value));
const unitItems = computed(() => projectStructure.value[selectedBuilding.value] || []);
// 前端簡單過濾 (VDataTable 也有內建搜尋)
const filteredRecords = computed(() => {
    if (!searchFilter.value) return allRecords.value;
    const lowerSearch = searchFilter.value.toLowerCase();
    return allRecords.value.filter(record =>
        Object.values(record).some(val =>
            String(val).toLowerCase().includes(lowerSearch)
        )
    );
});

// --- Data Table Headers ---
const headers = ref([
  { title: '日期', key: 'inspectionDate', sortable: true },
  { title: '階段', key: 'phase', sortable: true },
  { title: '照片', key: 'photos', sortable: false },
  { title: '區域', key: 'area', sortable: true },
  { title: '種類', key: 'category', sortable: true },
  { title: '細項', key: 'subCategory', sortable: true },
  { title: '狀態', key: 'status', sortable: true },
  { title: '等級', key: 'level', sortable: true },
  { title: '進度', key: 'progress', sortable: true },
  { title: '說明', key: 'description', sortable: false },
  { title: '人員', key: 'inspectorName', sortable: true },
  { title: '時間', key: 'createdAt', sortable: true },
  { title: '操作', key: 'actions', sortable: false },
]);

// --- Methods ---
onMounted(async () => {
  try {
    loadingText.value = '正在與 LINE 連接...';
    // ✅ 您的 LIFF ID
    await liff.init({ liffId: '2008257338-QV34v0pb' }); // LIFF驗屋系統
    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    loadingText.value = '正在驗證使用者權限...';
    const profile = await liff.getProfile();
    const success = await userStore.fetchUserByLineId(profile.userId);

    if (success) {
      // 權限檢查 (確保使用者有此建案的 '驗屋系統' 權限)
       if (!userStore.hasProjectPermission('驗屋系統', projectName.value)) {
           loadingText.value = '權限不足，無法訪問此建案的驗屋系統。';
           isBound.value = true; // 雖然已綁定，但權限不足
           isLoading.value = false;
           alert('權限不足');
           // 可以導向回 Home 或 ProjectSelector
           // router.push({ name: 'Home' });
           return;
       }

      isBound.value = true;
      await loadProjectStructure();
      await loadOptionsForChips(); // 載入 Chip 選項緩存
    } else {
      isBound.value = false;
    }
  } catch (error) {
    console.error('頁面初始化失敗:', error);
    loadingText.value = `初始化失敗: ${error.message}`;
  } finally {
    isLoading.value = false;
  }
});

async function loadProjectStructure() {
  if (!projectId.value) return;
  isLoadingStructure.value = true;
  const result = await getProjectStructureFB(projectId.value);
  if (result.status === 'success') {
    projectStructure.value = result.data;
  } else {
    console.error("載入建案結構失敗:", result.message);
    // 顯示錯誤訊息
  }
  isLoadingStructure.value = false;
}

async function loadRecords() {
  if (!selectedUnit.value) {
    allRecords.value = [];
    return;
  }
  isLoadingRecords.value = true;
  const result = await getInspectionRecordsFB(projectId.value, selectedUnit.value);
  if (result.status === 'success') {
    allRecords.value = result.data;
  } else {
    console.error("載入驗屋紀錄失敗:", result.message);
    allRecords.value = [];
    // 顯示錯誤訊息
  }
  isLoadingRecords.value = false;
}

// 載入用於渲染 Chip 的選項資料
async function loadOptionsForChips() {
    if (!projectId.value) return;
    const result = await getInspectionOptionsForProjectFB(projectId.value);
    if (result.status === 'success') {
        optionsForChips.status = result.data.status || [];
        optionsForChips.level = result.data.level || [];
        optionsForChips.progress = result.data.progress || [];
    } else {
        console.error("載入 Chip 選項失敗:", result.message);
    }
}


function openAddDialog() {
  recordBeingEdited.value = null; // 清空編輯對象
  showEditorDialog.value = true;
}

function openEditDialog(record) {
    // 編輯功能暫未實現完整，先提供入口
    alert('編輯功能尚未開放');
    // recordBeingEdited.value = record;
    // showEditorDialog.value = true;
}

function handleRecordSaved() {
  showEditorDialog.value = false;
  loadRecords(); // 儲存成功後重新載入列表
}

function showImagePreview(url) {
    previewImageUrl.value = url;
    showPreviewDialog.value = true;
}

function formatDate(dateString) {
    if (!dateString) return '';
    try {
        return format(parseISO(dateString), 'yyyy/MM/dd', { locale: zhTW });
    } catch (e) {
        return dateString; // 如果格式錯誤，返回原始字串
    }
}

function formatDateTime(dateString) {
     if (!dateString) return '';
     try {
         return format(parseISO(dateString), 'yyyy/MM/dd HH:mm', { locale: zhTW });
     } catch (e) {
         return dateString;
     }
}

// 可以加入刪除紀錄的函數
// async function deleteRecord(record) {
//   if (confirm(`確定要刪除這筆紀錄嗎？`)) {
//     // 呼叫後端刪除 API
//   }
// }

</script>

<style scoped>
/* 可以加入一些 Console 特有的樣式 */
.cursor-pointer {
    cursor: pointer;
}
</style>