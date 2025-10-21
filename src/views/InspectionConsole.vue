<template>
  <v-container fluid class="pa-2 pa-sm-4" style="background-color: #F4F4F7; min-height: 100vh;">
    <v-card class="mx-auto" max-width="1600">
      <v-toolbar color="primary" dark flat>
        <v-toolbar-title class="font-weight-bold">
          {{ projectId ? `${projectName} 驗屋紀錄` : '驗屋系統 (選擇建案)' }}
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <template v-if="projectId && otherProjects.length > 0">
          <v-menu offset-y>
             <template v-slot:activator="{ props: menuProps }">
              <v-btn v-bind="menuProps" variant="text" class="pa-1" style="text-transform: none; letter-spacing: normal;" aria-label="切換建案">
                <v-avatar size="32" class="mr-2"><v-img :src="currentProject?.iconUrl || defaultProjectIcon" :alt="currentProject?.name"></v-img></v-avatar>
                <v-icon size="small">mdi-chevron-down</v-icon>
              </v-btn>
            </template>
            <v-list density="compact" class="pa-0">
               <v-list-item v-if="currentProject" :title="currentProject.name" subtitle="目前建案" disabled class="bg-grey-lighten-4">
                 <template v-slot:prepend><v-avatar size="32" class="mr-3"><v-img :src="currentProject.iconUrl || defaultProjectIcon" :alt="currentProject.name"></v-img></v-avatar></template>
               </v-list-item>
              <v-divider v-if="currentProject"></v-divider>
              <v-list-item v-for="project in otherProjects" :key="project.id" @click="enterProject(project)" link>
                <template v-slot:prepend><v-avatar size="32" class="mr-3"><v-img :src="project.iconUrl || defaultProjectIcon" :alt="project.name"></v-img></v-avatar></template>
                <v-list-item-title>{{ project.name }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-toolbar>

      <div v-if="isLoading" class="text-center pa-10"> <v-progress-circular indeterminate color="primary" size="50"></v-progress-circular> <p class="mt-4 text-grey">{{ loadingText }}</p> </div>
      <div v-else-if="!isBound" class="text-center pa-10"> <v-icon size="60" color="warning" class="mb-4">mdi-account-alert-outline</v-icon> <p class="text-h6">無法使用此功能</p> <p class="mt-2 text-grey-darken-1">您的 LINE 帳號尚未綁定系統手機，請先完成綁定。</p> <v-btn color="primary" class="mt-6" href="/?liff_path=line-binding" variant="elevated"> 前往綁定頁面 </v-btn> </div>


      <div v-else-if="isBound && projectId">
        <v-sheet class="pa-3 border-b">
          <v-row dense align="center">
            <v-col cols="12" sm="6" md="3"><v-select v-model="selectedBuilding" :items="buildingItems" label="選擇棟別" variant="outlined" density="compact" hide-details clearable @update:model-value="selectedUnit = null; loadRecords()" :loading="isLoadingStructure"></v-select></v-col>
            <v-col cols="12" sm="6" md="3"><v-select v-model="selectedUnit" :items="unitItems" label="選擇戶別" variant="outlined" density="compact" hide-details clearable :disabled="!selectedBuilding" @update:model-value="loadRecords()"></v-select></v-col>
            <v-col cols="12" md="4"><v-text-field v-model="searchFilter" label="搜尋所有欄位" prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details clearable></v-text-field></v-col>
            <v-col cols="12" md="2" class="d-flex justify-end align-center mt-2 mt-md-0 ga-2">
              <v-btn-toggle v-model="viewMode" mandatory density="compact" variant="outlined" divided><v-btn value="table" icon="mdi-table" aria-label="表格視圖"></v-btn><v-btn value="card" icon="mdi-view-dashboard" aria-label="卡片視圖"></v-btn></v-btn-toggle>
              <v-btn color="primary" @click="openAddDialog" prepend-icon="mdi-plus" :disabled="!selectedUnit || !selectedBuilding" size="small"> 新增 </v-btn>
            </v-col>
          </v-row>
        </v-sheet>


        <div v-if="isLoadingRecords" class="text-center pa-10">
          <v-progress-circular indeterminate color="primary" size="40"></v-progress-circular>
          <p class="mt-4 text-grey">正在載入紀錄...</p>
        </div>
        <div v-else-if="filteredRecords.length > 0">
           <div v-if="viewMode === 'table'">
              <v-data-table :headers="headers" :items="filteredRecords" :loading="isLoadingRecords" :search="searchFilter" item-value="id" class="elevation-0" :items-per-page="10" :items-per-page-options="[{ value: 10, title: '10' },{ value: 25, title: '25' },{ value: 50, title: '50' },{ value: 100, title: '100' },{ value: -1, title: '全部顯示' }]">
                <template v-slot:item.photos="{ item }"> <div class="d-flex ga-1 pa-1"> <v-img v-for="(photo, index) in item.photos.slice(0, 4)" :key="index" :src="photo.url" aspect-ratio="1" cover width="40" class="rounded border cursor-pointer" @click="showImagePreview(photo.url)"> <template v-slot:placeholder> <div class="d-flex align-center justify-center fill-height"> <v-progress-circular indeterminate color="grey-lighten-4"></v-progress-circular> </div> </template> </v-img> </div> </template>
                  <template v-slot:item.status="{ item }"> <div class="position-relative"> <v-fade-transition> <v-overlay v-if="updatingRecord.id === item.id && updatingRecord.field === 'status'" contained persistent class="align-center justify-center"><v-progress-circular indeterminate size="20"></v-progress-circular></v-overlay> </v-fade-transition> <v-menu offset-y> <template v-slot:activator="{ props: menuProps }"> <ChipRenderer v-bind="menuProps" :value="item.status" type="status" :options="optionsForChips.status" style="cursor: pointer;"/> </template> <v-sheet class="pa-2"> <v-chip-group column :model-value="item.status" @update:model-value="(newValue) => { handleFieldUpdate(item, 'status', newValue); }"> <v-chip v-for="option in optionsForChips.status" :key="option.id" :value="option.value" :color="option.color || 'grey'" filter variant="outlined" size="small"> <v-icon v-if="option.icon" start size="small">{{ option.icon }}</v-icon> {{ option.value }} </v-chip> </v-chip-group> </v-sheet> </v-menu> </div> </template>
                  <template v-slot:item.level="{ item }"> <div class="position-relative"> <v-fade-transition> <v-overlay v-if="updatingRecord.id === item.id && updatingRecord.field === 'level'" contained persistent class="align-center justify-center"><v-progress-circular indeterminate size="20"></v-progress-circular></v-overlay> </v-fade-transition> <v-menu offset-y> <template v-slot:activator="{ props: menuProps }"> <ChipRenderer v-bind="menuProps" :value="item.level" type="level" :options="optionsForChips.level" style="cursor: pointer;"/> </template> <v-sheet class="pa-2"> <v-chip-group column :model-value="item.level" @update:model-value="(newValue) => { handleFieldUpdate(item, 'level', newValue); }"> <v-chip v-for="option in optionsForChips.level" :key="option.id" :value="option.value" :color="option.color || 'grey'" filter variant="outlined" size="small">{{ option.value }}</v-chip> </v-chip-group> </v-sheet> </v-menu> </div> </template>
                  <template v-slot:item.progress="{ item }"> <div class="position-relative"> <v-fade-transition> <v-overlay v-if="updatingRecord.id === item.id && updatingRecord.field === 'progress'" contained persistent class="align-center justify-center"><v-progress-circular indeterminate size="20"></v-progress-circular></v-overlay> </v-fade-transition> <v-menu offset-y> <template v-slot:activator="{ props: menuProps }"> <ChipRenderer v-bind="menuProps" :value="item.progress" type="progress" :options="optionsForChips.progress" style="cursor: pointer;"/> </template> <v-sheet class="pa-2"> <v-chip-group column :model-value="item.progress" @update:model-value="(newValue) => { handleFieldUpdate(item, 'progress', newValue); }"> <v-chip v-for="option in optionsForChips.progress" :key="option.id" :value="option.value" :color="option.color || 'grey'" filter variant="outlined" size="small"> <v-icon v-if="option.icon" start size="small">{{ option.icon }}</v-icon> {{ option.value }} </v-chip> </v-chip-group> </v-sheet> </v-menu> </div> </template>
                  <template v-slot:item.inspectionDate="{ item }"> {{ formatDate(item.inspectionDate) }} </template>
                  <template v-slot:item.createdAt="{ item }"> {{ formatDateTime(item.createdAt) }} </template>

                <template v-slot:item.actions="{ item }">
                  <v-icon small class="mr-2" @click="openEditDialog(item)" color="primary">mdi-pencil</v-icon>
                  <v-icon small @click="openDeleteDialog(item)" color="error">mdi-delete</v-icon> </template>
                <template v-slot:no-data>
                   <div class="pa-4 text-center text-grey">
                      {{ selectedUnit ? '此戶別尚無驗屋紀錄' : '請先選擇棟別與戶別' }}
                   </div>
                </template>
              </v-data-table>
           </div>
           <div v-if="viewMode === 'card'" class="pa-2 pa-sm-4">
              <v-row dense>
                <v-col v-for="item in filteredRecords" :key="item.id" cols="12" sm="6" md="4" lg="3">
                  <v-card class="mb-3 record-card" variant="outlined">
                    <div v-if="item.photos && item.photos.length > 0" class="d-flex ga-1 pa-2 border-b photo-strip"> <v-img v-for="(photo, index) in item.photos.slice(0, 5)" :key="index" :src="photo.url" aspect-ratio="1" cover height="50" class="rounded border cursor-pointer" @click="showImagePreview(photo.url)"> <template v-slot:placeholder> <div class="d-flex align-center justify-center fill-height"> <v-progress-circular indeterminate size="20" color="grey-lighten-2"></v-progress-circular> </div> </template> <div v-if="index === 4 && item.photos.length > 5" class="photo-overlay d-flex align-center justify-center"> +{{ item.photos.length - 5 }} </div> </v-img> </div>
                      <v-card-item class="pb-1 pt-2"> <div> <span class="text-subtitle-1 font-weight-bold mr-2">{{ item.area }}</span> <span class="text-caption text-grey">{{ formatDate(item.inspectionDate) }} - {{ item.phase }}</span> </div> <p class="text-body-2 text-medium-emphasis mt-1"> {{ item.category }} / {{ item.subCategory }} </p> </v-card-item>
                      <v-card-text class="py-2"> <div class="d-flex ga-2 flex-wrap mb-1"> <ChipRenderer size="small" :value="item.status" type="status" :options="optionsForChips.status" /> <ChipRenderer size="small" :value="item.level" type="level" :options="optionsForChips.level" /> <ChipRenderer size="small" :value="item.progress" type="progress" :options="optionsForChips.progress" /> </div> <p v-if="item.description" class="text-caption text-medium-emphasis description-truncate"> {{ item.description }} </p> </v-card-text>
                      <v-divider></v-divider>

                    <v-card-actions class="px-3 py-1">
                       <span class="text-caption text-grey">
                         {{ item.inspectorName }} @ {{ formatDateTime(item.createdAt) }}
                       </span>
                       <v-spacer></v-spacer>
                       <v-btn icon="mdi-pencil" variant="text" size="small" @click="openEditDialog(item)" color="primary" aria-label="編輯紀錄"></v-btn>
                       <v-btn icon="mdi-delete" variant="text" size="small" @click="openDeleteDialog(item)" color="error" aria-label="刪除紀錄"></v-btn> </v-card-actions>
                    </v-card>
                </v-col>
              </v-row>
           </div>
           </div>
        <div v-else class="pa-10 text-center text-grey">
           {{ selectedUnit ? '此戶別尚無驗屋紀錄' : '請先選擇棟別與戶別' }}
        </div>
      </div>

      <div v-else-if="isBound && !projectId" class="pa-6"> <p class="text-h6 text-center mb-6"> 歡迎，{{ userStore.user?.name }}！<br>請選擇您要進入的驗屋系統建案： </p> <div v-if="authorizedProjects.length > 0" class="d-flex flex-wrap justify-center ga-4"> <IconButton v-for="project in authorizedProjects" :key="project.id" :icon="project.iconUrl || defaultProjectIcon" :text="project.name" :scale="0.8" @click="enterProject(project)" /> </div> <v-alert v-else type="warning" variant="tonal" class="mt-4"> 您目前沒有任何建案的「驗屋系統」權限。 </v-alert> </div>

    </v-card>

    <InspectionRecordEditor v-model="showEditorDialog" :project-id="projectId" :project-name="projectName" :unit-id="selectedUnit" :record-to-edit="recordBeingEdited" @saved="handleRecordSaved"/>

    <v-dialog v-model="showPreviewDialog" max-width="80vw" max-height="90vh"> <v-card> <v-toolbar dense flat class="border-b"> <v-spacer></v-spacer> <v-btn icon="mdi-close" @click="showPreviewDialog = false"></v-btn> </v-toolbar> <v-card-text class="pa-0"> <v-img :src="previewImageUrl" contain max-height="calc(90vh - 48px)"></v-img> </v-card-text> </v-card> </v-dialog>

    <v-dialog v-model="showDeleteDialog" persistent max-width="400px">
      <v-card>
        <v-card-title class="text-h6 text-error">
          <v-icon start>mdi-alert-circle-outline</v-icon>
          確認刪除紀錄
        </v-card-title>
        <v-card-text>
          您確定要永久刪除這筆驗屋紀錄嗎？
          <div v-if="recordToDelete" class="mt-2 text-caption text-medium-emphasis">
            日期: {{ formatDate(recordToDelete.inspectionDate) }} <br>
            區域: {{ recordToDelete.area }} <br>
            種類: {{ recordToDelete.category }} / {{ recordToDelete.subCategory }}
          </div>
          <br>
          <strong class="text-error">此操作無法復原。</strong>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" text @click="showDeleteDialog = false" :disabled="isDeleting">取消</v-btn>
          <v-btn color="error" variant="flat" @click="confirmDeleteRecord" :loading="isDeleting">確認刪除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    </v-container>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue'; // ✓ 移除 watch
import { useRoute, useRouter } from 'vue-router';
import liff from '@line/liff';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
import {
  getProjectStructureFB,
  getInspectionRecordsFB,
  getInspectionOptionsForProjectFB,
  updateInspectionRecordFieldFB,
  deleteInspectionRecordFB 
} from '@/api';
import { VDataTable } from 'vuetify/components/VDataTable'; // ✓ 恢復 VDataTable import
import { useDisplay } from 'vuetify'; // ✓ 新增 useDisplay import
import InspectionRecordEditor from '@/components/InspectionRecordEditor.vue';
import ChipRenderer from '@/components/ChipRenderer.vue';
import { format, parseISO } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import IconButton from '@/components/IconButton.vue';
import defaultProjectIcon from '@/assets/icons/property.png';

const route = useRoute();
const userStore = useUserStore();
const projectStore = useProjectStore();
const router = useRouter();
const { mobile } = useDisplay(); // ✓ 使用 useDisplay 獲取 mobile 狀態

const props = defineProps({
  projectId: {
    type: String,
    default: null
  }
});

// ✓ 新增：viewMode 狀態，預設為 'table'
const viewMode = ref('table');

const projectName = computed(() => projectStore.idToNameMap[props.projectId] || '建案');

const isLoading = ref(true);
const loadingText = ref('正在初始化...');
const isBound = ref(false);
const isLoadingStructure = ref(false);
const isLoadingRecords = ref(false);

const projectStructure = ref({});
const selectedBuilding = ref(null);
const selectedUnit = ref(null);
const allRecords = ref([]);
const searchFilter = ref('');

const showEditorDialog = ref(false);
const recordBeingEdited = ref(null);

const showPreviewDialog = ref(false);
const previewImageUrl = ref('');

const optionsForChips = reactive({ status: [], level: [], progress: [] });
const authorizedProjects = ref([]);
const updatingRecord = reactive({ id: null, field: null }); // ✓ 恢復 updatingRecord

// ✓ START: 新增 - 刪除 Dialog 相關狀態
const showDeleteDialog = ref(false);
const recordToDelete = ref(null);
const isDeleting = ref(false);
// ✓ END: 新增

// --- Computed ---
const buildingItems = computed(() => {
  // 1. 取得所有棟別名稱 (keys)
  const keys = Object.keys(projectStructure.value);
  // 2. 使用 localeCompare 進行排序 (支援中文、數字、英文)
  keys.sort((a, b) => a.localeCompare(b, 'zh-Hant-TW', { numeric: true }));
  // 3. 回傳排序後的陣列
  return keys;
});
const unitItems = computed(() => projectStructure.value[selectedBuilding.value] || []);
const filteredRecords = computed(() => {
    if (!searchFilter.value) return allRecords.value;
    const lowerSearch = searchFilter.value.toLowerCase();
    return allRecords.value.filter(record => {
      const searchableValues = [
        record.inspectionDate, record.phase, record.area, record.category,
        record.subCategory, record.status, record.level, record.progress,
        record.description, record.inspectorName, record.createdAt
      ];
      return searchableValues.some(val => val && String(val).toLowerCase().includes(lowerSearch));
    });
});

const currentProject = computed(() => {
  return authorizedProjects.value.find(p => p.id === props.projectId);
});

const otherProjects = computed(() => {
  return authorizedProjects.value.filter(p => p.id !== props.projectId);
});

// ✓ 恢復 headers ref
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
    await liff.init({ liffId: '2008257338-QV34v0pb' });
    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    loadingText.value = '正在驗證使用者權限...';
    const profile = await liff.getProfile();
    const success = await userStore.fetchUserByLineId(profile.userId);

    if (success) {
      isBound.value = true;

      loadingText.value = '正在載入建案權限...';
      await projectStore.fetchProjects();
      const allProjects = projectStore.projectsList;
      authorizedProjects.value = allProjects.filter(project =>
        userStore.hasProjectPermission('驗屋系統', project.name)
      );

      if (props.projectId) {
        loadingText.value = '正在載入建案資料...';

        if (!userStore.hasProjectPermission('驗屋系統', projectName.value)) {
            loadingText.value = '權限不足，無法訪問此建案的驗屋系統。';
            isBound.value = true;
            isLoading.value = false;
            alert('權限不足');
            return;
        }

        await loadProjectStructure();
        await loadOptionsForChips();
        if (selectedUnit.value) await loadRecords();

      } else {
        loadingText.value = '請選擇建案';
      }

    } else {
      isBound.value = false;
    }
  } catch (error) {
    console.error('頁面初始化失敗:', error);
    loadingText.value = `初始化失敗: ${error.message}`;
  } finally {
    isLoading.value = false;
    // ✓ 設定預設視圖模式
    viewMode.value = mobile.value ? 'card' : 'table';
  }
});


async function loadProjectStructure() {
   if (!props.projectId) return;
  isLoadingStructure.value = true;
  const result = await getProjectStructureFB(props.projectId);
  if (result.status === 'success') {
    projectStructure.value = result.data;
  } else {
    console.error("載入建案結構失敗:", result.message);
  }
  isLoadingStructure.value = false;
}

async function loadRecords() {
   if (!selectedUnit.value || !props.projectId) {
    allRecords.value = [];
    return;
  }
  isLoadingRecords.value = true;
  const result = await getInspectionRecordsFB(props.projectId, selectedUnit.value);
  if (result.status === 'success') {
    allRecords.value = result.data;
  } else {
    console.error("載入驗屋紀錄失敗:", result.message);
    allRecords.value = [];
  }
  isLoadingRecords.value = false;
}

async function loadOptionsForChips() {
     if (!props.projectId) return;
    const result = await getInspectionOptionsForProjectFB(props.projectId);
    if (result.status === 'success') {
        optionsForChips.status = result.data.status || [];
        optionsForChips.level = result.data.level || [];
        optionsForChips.progress = result.data.progress || [];
    } else {
        console.error("載入 Chip 選項失敗:", result.message);
    }
}

function enterProject(project) {
   if (project && project.id && project.id !== props.projectId) {
    router.push({
      name: 'InspectionConsole',
      params: { projectId: project.id }
    });
  }
}

// ✓ 恢復 handleFieldUpdate 函數
async function handleFieldUpdate(item, field, newValue) {
  if (item[field] === newValue || (updatingRecord.id === item.id && updatingRecord.field === field)) {
    return;
  }

  updatingRecord.id = item.id;
  updatingRecord.field = field;

  const payload = {
    [field]: newValue,
    inspectorName: userStore.user?.name || '未知',
    inspectorPhone: userStore.user?.key || '未知',
  };

  const result = await updateInspectionRecordFieldFB(props.projectId, selectedUnit.value, item.id, payload);

  if (result.status === 'success') {
    const localRecord = allRecords.value.find(r => r.id === item.id);
    if (localRecord) {
      localRecord[field] = newValue;
      localRecord.inspectorName = payload.inspectorName;
    }
  } else {
    alert(`更新失敗: ${result.message}`);
  }

  updatingRecord.id = null;
  updatingRecord.field = null;
}


function openAddDialog() {
  recordBeingEdited.value = null;
  showEditorDialog.value = true;
}

function openEditDialog(record) {
    recordBeingEdited.value = record;
    showEditorDialog.value = true;
}

function handleRecordSaved() {
  showEditorDialog.value = false;
  loadRecords();
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
        return dateString;
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

// ✓ START: 新增 - 刪除相關函數
function openDeleteDialog(item) {
  recordToDelete.value = item;
  showDeleteDialog.value = true;
}

async function confirmDeleteRecord() {
  if (!recordToDelete.value || !recordToDelete.value.id) return;

  isDeleting.value = true;
  try {
    // 呼叫後端 API 執行刪除
    const result = await deleteInspectionRecordFB(recordToDelete.value.id);

    if (result.status === 'success') {
      // 從前端列表中移除該筆紀錄
      allRecords.value = allRecords.value.filter(record => record.id !== recordToDelete.value.id);
      showDeleteDialog.value = false; // 關閉對話框
      alert('紀錄已成功刪除。');
    } else {
      throw new Error(result.message || '刪除失敗');
    }
  } catch (error) {
    console.error("刪除紀錄時發生錯誤:", error);
    alert(`刪除失敗: ${error.message}`);
  } finally {
    isDeleting.value = false;
    recordToDelete.value = null; // 清除待刪除紀錄
  }
}


</script>

<style scoped>
.cursor-pointer {
    cursor: pointer;
}

/* ✓ START: 卡片樣式 (來自 CARDS版) */
.record-card {
  transition: box-shadow 0.2s ease-in-out;
}
.record-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.photo-strip .v-img {
  max-width: calc(20% - 4px); /* 最多顯示 5 張照片，留點間隙 */
  flex-basis: calc(20% - 4px);
}

.description-truncate {
  display: -webkit-box;
  -webkit-line-clamp: 2; /* 最多顯示 2 行 */
  line-clamp: 2; /* ✓ 標準語法 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 1.5em; /* 至少保留一行的高度 */
}

.border-b {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 0.9rem;
  font-weight: bold;
}
/* ✓ END: 卡片樣式 */

/* ✓ 表格 Chip 編輯需要的樣式 (來自 DATA-TABLE版) */
.position-relative {
  position: relative;
}
</style>