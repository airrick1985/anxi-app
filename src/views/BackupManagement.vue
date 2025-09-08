<template>
  <v-container>
    <v-card>
      <v-toolbar color="blue-grey" dark>
        <v-toolbar-title>
          <v-icon start>mdi-database-cog-outline</v-icon>
          資料庫備份與維護
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn color="white" variant="outlined" @click="openDialog()" prepend-icon="mdi-plus">
          新增任務
        </v-btn>
      </v-toolbar>

       <v-tabs v-model="currentTab" bg-color="transparent">
  <v-tab value="jobs">任務列表</v-tab>
  <v-tab value="update">欄位批次更新</v-tab> <v-tab value="browser">備份檔案瀏覽</v-tab>
  <v-tab value="history">執行歷史 (待開發)</v-tab>
</v-tabs>
<v-divider></v-divider>

      <v-window v-model="currentTab">
        <v-window-item value="jobs">
          <v-data-table
  :headers="headers"
  :items="jobs"
  :loading="isLoading"
  item-value="id"
  no-data-text="尚未建立任何備份或刪除任務"
  :class="{ 'v-data-table--mobile': mobile }"
>
  <template v-slot:item="{ item, columns }">
    <tr v-if="mobile" class="v-data-table__tr">
      <td :colspan="columns.length" class="pa-0">
        <v-card class="my-2" variant="outlined">
          <v-list-item>
            <v-list-item-title class="text-h6 font-weight-bold mb-2">
              {{ item.jobName }}
            </v-list-item-title>
            <template v-slot:append>
               <v-chip :color="item.status === 'enabled' ? 'green' : 'grey'" size="small">
                {{ item.status === 'enabled' ? '啟用中' : '已停用' }}
              </v-chip>
            </template>
          </v-list-item>

          <v-divider></v-divider>
          
          <div class="mobile-card-content">
            <div>
              <div class="label">類型</div>
              <div class="value">
                <v-chip :color="item.jobType === 'backup' ? 'primary' : 'error'" size="small">
                  {{ item.jobType === 'backup' ? '備份' : '刪除' }}
                </v-chip>
              </div>
            </div>
            <div>
              <div class="label">目標集合</div>
              <div class="value">{{ item.targetCollection }}</div>
            </div>
            <div v-if="item.filters.projectId">
              <div class="label">篩選建案</div>
              <div class="value">{{ projectStore.idToNameMap[item.filters.projectId] || item.filters.projectId }}</div>
            </div>
            <div>
              <div class="label">排程</div>
              <div class="value">
                {{ scheduleLabels[item.scheduleType] || '未知' }}
                <span v-if="item.scheduleType !== 'manual'"> @ {{ item.scheduleTime }}</span>
              </div>
            </div>
             <div>
              <div class="label">上次執行</div>
              <div class="value">
                <div v-if="item.lastRun">
                  <v-chip :color="item.lastRun.status === 'success' ? 'success' : 'error'" size="x-small" class="mb-1">
                    {{ item.lastRun.status === 'success' ? '成功' : '失敗' }}
                  </v-chip>
                  <span class="text-caption ml-2">
                    {{ formatTimestamp(item.lastRun.timestamp) }}
                  </span>
                </div>
                <span v-else class="text-grey">尚未執行</span>
              </div>
            </div>
          </div>

          <v-divider></v-divider>
          <v-card-actions class="d-flex flex-wrap ga-2 pa-3">
             <v-btn
                color="primary"
                size="small"
                variant="flat"
                @click="runJobNow(item)"
                :loading="runningJobs[item.id]"
              > 立即執行
              </v-btn>
              <v-btn size="small" variant="tonal" @click="openDialog(item)">編輯</v-btn>
              <v-btn size="small" variant="tonal" color="error" @click="confirmDelete(item)">刪除</v-btn>
          </v-card-actions>
        </v-card>
      </td>
    </tr>

    <tr v-else>
      <td>{{ item.jobName }}</td>
      <td>
        <v-chip :color="item.jobType === 'backup' ? 'primary' : 'error'" size="small">
          {{ item.jobType === 'backup' ? '備份' : '刪除' }}
        </v-chip>
      </td>
      <td>{{ item.targetCollection }}</td>
      <td>
        <div v-if="item.filters.projectId">
          建案: {{ projectStore.idToNameMap[item.filters.projectId] || item.filters.projectId }}
        </div>
      </td>
      <td>
        {{ scheduleLabels[item.scheduleType] || '未知' }}
        <span v-if="item.scheduleType !== 'manual'"> @ {{ item.scheduleTime }}</span>
      </td>
      <td>
        <div v-if="item.lastRun">
          <v-chip :color="item.lastRun.status === 'success' ? 'success' : 'error'" size="x-small" class="mb-1">
            {{ item.lastRun.status === 'success' ? '成功' : '失敗' }}
          </v-chip>
          <div class="text-caption">
            {{ formatTimestamp(item.lastRun.timestamp) }}
          </div>
        </div>
        <span v-else class="text-grey">尚未執行</span>
      </td>
      <td>
        <v-chip :color="item.status === 'enabled' ? 'green' : 'grey'" size="small">
          {{ item.status === 'enabled' ? '啟用中' : '已停用' }}
        </v-chip>
      </td>
      <td class="text-right">
        <v-btn
            color="primary"
            size="small"
            variant="tonal"
            @click="runJobNow(item)"
            :loading="runningJobs[item.id]"
        >
            立即執行
        </v-btn>
        <v-icon class="mx-1" @click="openDialog(item)">mdi-pencil</v-icon>
        <v-icon color="error" @click="confirmDelete(item)">mdi-delete</v-icon>
      </td>
    </tr>
  </template>

  <template v-if="mobile" v-slot:thead></template>
  <template v-if="mobile" v-slot:tfoot></template>
  <template v-if="mobile" v-slot:bottom></template>
</v-data-table>
        </v-window-item>

<v-window-item value="update">
  <v-card-text>
    <v-card v-if="batchUpdate.step === 1" variant="outlined">
      <v-card-title class="text-h6">步驟一：選擇範圍並下載範本</v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        <div v-if="!collectionsLoaded" class="text-center pa-8 text-grey">
            <v-progress-circular indeterminate color="primary" class="mb-4"></v-progress-circular>
            <div>正在讀取資料庫集合列表...</div>
        </div>
        <div v-else>
          <v-select v-model="batchUpdate.targetCollection" :items="collectionItems" label="目標集合" class="mb-4" hide-details></v-select>
          <v-select v-model="batchUpdate.projectId" :items="projectOptions" label="篩選建案" class="mb-4" hide-details :disabled="!batchUpdate.targetCollection"></v-select>
          <v-autocomplete
            v-model="batchUpdate.selectedFields"
            :items="batchUpdate.availableFields"
            label="選擇要匯出/更新的欄位"
            multiple chips closable-chips
            :disabled="!batchUpdate.projectId"
            :loading="batchUpdate.isLoadingFields"
            no-data-text="請先選擇集合與建案"
          ></v-autocomplete>
        </div>
      </v-card-text>
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          @click="handleDownloadTemplate"
          :loading="batchUpdate.isDownloading"
          :disabled="!collectionsLoaded || batchUpdate.selectedFields.length === 0"
          variant="elevated"
          size="large"
        >
          <v-icon start>mdi-download</v-icon>
          下載 Excel 範本
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-card v-if="batchUpdate.step === 2" variant="outlined">
      <v-card-title class="text-h6">步驟二：上傳修改後的檔案並預覽</v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        <p class="mb-4">請上傳您已修改完成的 Excel 檔案。系統將會進行預覽。</p>
        <v-file-input
          v-model="batchUpdate.uploadedFile"
          label="點擊或拖曳 Excel 檔案至此"
          accept=".xlsx, .xls"
          variant="outlined"
        ></v-file-input>
      </v-card-text>
      <v-card-actions class="pa-4">
        <v-btn @click="batchUpdate.step = 1">返回上一步</v-btn>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          @click="handleUploadAndPreview"
          :loading="batchUpdate.isPreviewing"
          :disabled="!batchUpdate.uploadedFile"
          variant="elevated"
          size="large"
        >
          <v-icon start>mdi-cloud-upload</v-icon>
          上傳並預覽
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-card v-if="batchUpdate.step === 3" variant="outlined">
      <v-card-title class="text-h6">步驟三：預覽與最終確認</v-card-title>
      <v-divider></v-divider>
      <v-card-text v-if="batchUpdate.previewResult">
        <v-alert type="info" variant="tonal" class="mb-4">
          <h4 class="mb-2">預覽報告</h4>
          <p>檔案解析成功，共偵測到 **{{ batchUpdate.previewResult.totalDocs }}** 筆資料。</p>
          <div v-if="batchUpdate.previewResult.newFields.length > 0" class="mt-2">
            <p class="font-weight-bold text-amber-darken-3">警告：偵測到 {{ batchUpdate.previewResult.newFields.length }} 個新欄位將被建立：</p>
            <v-chip v-for="field in batchUpdate.previewResult.newFields" :key="field" size="small" color="warning" class="mr-1 mt-1">{{ field }}</v-chip>
          </div>
        </v-alert>

        <v-alert
            v-if="batchUpdate.previewResult.duplicateIds && batchUpdate.previewResult.duplicateIds.length > 0"
            type="error"
            variant="outlined"
            class="mb-4"
            title="偵測到重複 ID"
          >
            <p>警告：您的 Excel 檔案中包含以下重複的 `_id`，執行更新後，只有每個 ID 的最後一筆資料會生效。</p>
            <div class="mt-2">
                <v-chip
                    v-for="id in batchUpdate.previewResult.duplicateIds"
                    :key="id"
                    size="small"
                    color="error"
                    class="mr-1 mt-1"
                >
                    {{ id }}
                </v-chip>
            </div>
          </v-alert>
          <v-alert type="warning" variant="tonal" class="mb-4" title="變更範例">
            </v-alert>

        <v-alert type="warning" variant="tonal" class="mb-4" title="變更範例">
          將更新文件 **{{ batchUpdate.previewResult.previewDocId }}** 的以下欄位：
          <v-table density="compact" class="mt-2">
              <thead><tr><th>欄位</th><th>舊值</th><th>新值</th></tr></thead>
              <tbody>
                  <tr v-for="change in batchUpdate.previewResult.previewChanges" :key="change.field">
                      <td>{{ change.field }}</td>
                      <td>{{ change.oldValue }}</td>
                      <td class="font-weight-bold text-primary">{{ change.newValue }}</td>
                  </tr>
              </tbody>
          </v-table>
        </v-alert>
      </v-card-text>
      <v-card-actions class="pa-4">
        <v-btn @click="batchUpdate.step = 2">返回上一步</v-btn>
        <v-spacer></v-spacer>
        <v-btn
          color="error"
          @click="handleExecuteUpdate"
          :loading="batchUpdate.isExecuting"
          variant="elevated"
          size="large"
        >
          <v-icon start>mdi-database-check</v-icon>
          確認執行更新
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-card-text>
</v-window-item>

        <v-window-item value="browser">
      <v-card-text>
        <v-toolbar density="compact" flat class="mb-2">
          <v-breadcrumbs :items="breadcrumbs"></v-breadcrumbs>
        </v-toolbar>

        <v-list v-if="!isLoadingFiles">
          <v-list-item
            v-if="currentPath !== ''"
            @click="navigate(parentPath)"
            prepend-icon="mdi-arrow-up-left"
            title="...返回上一層"
          ></v-list-item>

          <v-list-item
            v-for="dir in directories"
            :key="dir"
            @click="navigate(dir)"
            prepend-icon="mdi-folder-outline"
            :title="getDisplayName(dir)"
          ></v-list-item>

          <v-list-item
            v-for="file in files"
            :key="file.name"
            @click="openPreview(file)"
            prepend-icon="mdi-file-outline"
          >
            <v-list-item-title>{{ getDisplayName(file.name) }}</v-list-item-title>
            <v-list-item-subtitle>
              大小: {{ (file.size / 1024).toFixed(2) }} KB | 時間: {{ new Date(file.timeCreated).toLocaleString('zh-TW') }}
            </v-list-item-subtitle>

            <template v-slot:append>
              <v-btn
                color="red-lighten-2"
                icon="mdi-delete-outline"
                variant="text"
                @click.stop="promptDeleteFile(file)"
              ></v-btn>
            </template>
            </v-list-item>
        </v-list>
         <div v-else class="text-center pa-10">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
         </div>
      </v-card-text>
    </v-window-item>
        </v-window>
    </v-card>

    <v-dialog v-model="dialogVisible" persistent max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ isEditing ? '編輯任務' : '新增任務' }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-text-field v-model="editedItem.jobName" label="任務名稱*" :rules="[v => !!v || '必填']"></v-text-field>
            <v-select v-model="editedItem.jobType" :items="[{title: '備份', value: 'backup'}, {title: '刪除', value: 'delete'}]" label="任務類型*" :rules="[v => !!v || '必填']"></v-select>
           <v-select v-model="editedItem.targetCollection" :items="collectionItems" label="目標集合*" :rules="[v => !!v || '必填']"></v-select>
          <v-select v-model="editedItem.filters.projectId" :items="projectOptions" label="篩選建案 (可選)" clearable></v-select>
          <v-select v-model="editedItem.scheduleType" :items="scheduleOptions" label="排程類型*" :rules="[v => !!v || '必填']"></v-select>
            <v-text-field v-if="editedItem.scheduleType !== 'manual'" v-model="editedItem.scheduleTime" label="執行時間 (24小時制)*" type="time" :rules="[v => !!v || '必填']"></v-text-field>
            <v-select v-model="editedItem.status" :items="[{title: '啟用中', value: 'enabled'}, {title: '已停用', value: 'disabled'}]" label="任務狀態*" :rules="[v => !!v || '必填']"></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" text @click="closeDialog">取消</v-btn>
          <v-btn color="blue-darken-1" text @click="saveJob" :loading="isSaving">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>

<v-dialog v-model="isPreviewDialogVisible" fullscreen transition="dialog-bottom-transition">
  <v-card>
    <v-toolbar color="primary" dark>
      <v-toolbar-title>預覽備份檔: {{ previewFileName }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon dark @click="isPreviewDialogVisible = false">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>
    <v-card-text style="background-color: #f5f5f5; padding: 0;">
      <pre style="white-space: pre-wrap; word-wrap: break-word; padding: 16px; margin: 0; font-family: monospace;">{{ previewContent }}</pre>
    </v-card-text>
  </v-card>
</v-dialog>

<v-dialog v-model="isDeleteConfirmDialogVisible" persistent max-width="500px">
  <v-card v-if="fileToDelete">
    <v-card-title class="text-h6 d-flex align-center bg-red-lighten-4">
      <v-icon start color="red-darken-2">mdi-alert-circle-outline</v-icon>
      確認刪除備份檔案？
    </v-card-title>
    <v-divider></v-divider>
    <v-card-text class="py-4">
      <p class="mb-4">您確定要永久刪除以下這個備份檔案嗎？</p>
      <v-sheet color="grey-lighten-4" class="pa-3 rounded-lg border">
        <div class="font-weight-bold">
          <v-icon start>mdi-file-outline</v-icon>
          {{ getDisplayName(fileToDelete.name) }}
        </div>
        <div class="text-caption text-grey-darken-1 mt-1">
          完整路徑: {{ fileToDelete.name }}
        </div>
      </v-sheet>
      <p class="font-weight-bold text-red-darken-2 mt-4">
        此操作無法復原！
      </p>
    </v-card-text>
    <v-divider></v-divider>
    <v-card-actions class="pa-3">
      <v-spacer></v-spacer>
      <v-btn variant="text" @click="isDeleteConfirmDialogVisible = false">取消</v-btn>
      <v-btn
        color="red-darken-1"
        variant="flat"
        :loading="isDeletingFile"
        @click="handleConfirmDeleteFile"
      >
        確定刪除
      </v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>

</template>

<script setup>
// 1. Imports (匯入)
import { ref, onMounted, onUnmounted, computed, reactive, watch } from 'vue';
import { useDisplay } from 'vuetify';
import { useProjectStore } from '@/store/projectStore';
import { useToast } from 'vue-toastification';
import {
  listenToBackupJobs, createBackupJob, updateBackupJob, deleteBackupJob, triggerBackupJob,
  fetchBackupFiles, fetchBackupFileContent, triggerDeleteBackupFile,
  fetchFirestoreCollections, fetchAvailableFields,
  triggerGenerateExcelTemplate, triggerUpdateFromExcel
} from '@/api';

// 2. Component Definitions (元件定義)
const emit = defineEmits(['startLoading', 'stopLoading', 'notify']);

// 3. Core Instances (核心實例)
const projectStore = useProjectStore();
const toast = useToast();
const { mobile } = useDisplay();

// 4. State (響應式狀態)
// --- General State ---
const currentTab = ref('jobs');
const isLoading = ref(true);
const collectionItems = ref([]);
const collectionsLoaded = ref(false); // ✅ 新增一個旗標，判斷集合是否已載入


// --- Job List & Dialog State ---
const jobs = ref([]);
const dialogVisible = ref(false);
const isEditing = ref(false);
const isSaving = ref(false);
const runningJobs = reactive({});
const defaultItem = {
  jobName: '', jobType: 'backup', status: 'enabled', targetCollection: null,
  filters: { projectId: null }, scheduleType: 'manual', scheduleTime: '03:00',
};
const editedItem = ref({ ...defaultItem });

// --- File Browser State ---
const currentPath = ref('');
const files = ref([]);
const directories = ref([]);
const isLoadingFiles = ref(false);
const isPreviewDialogVisible = ref(false);
const previewContent = ref('');
const previewFileName = ref('');

// --- File Delete State ---
const isDeleteConfirmDialogVisible = ref(false);
const fileToDelete = ref(null);
const isDeletingFile = ref(false);

// --- Batch Update State ---
const batchUpdate = reactive({
  step: 1, targetCollection: null, projectId: null, availableFields: [],
  selectedFields: [], uploadedFile: null, uploadedFilePathGCS: null,
  previewResult: null, isLoadingFields: false, isDownloading: false,
  isPreviewing: false, isExecuting: false,
});

// 5. Computed Properties (計算屬性)
const headers = computed(() => {
  if (mobile.value) {
    return [{ key: 'data', sortable: false, title: '' }];
  } else {
    return [
      { title: '任務名稱', key: 'jobName', minWidth: '200px' },
      { title: '類型', key: 'jobType' },
      { title: '目標集合', key: 'targetCollection' },
      { title: '篩選條件', key: 'filters' },
      { title: '排程', key: 'scheduleType' },
      { title: '上次執行', key: 'lastRun', minWidth: '180px' },
      { title: '狀態', key: 'status' },
      { title: '操作', key: 'actions', sortable: false, align: 'end', minWidth: '200px' },
    ];
  }
});

const scheduleLabels = { manual: '僅手動', daily: '每日', weekly: '每週' };
const scheduleOptions = [ { title: '僅手動', value: 'manual' }, { title: '每日', value: 'daily' }, { title: '每週', value: 'weekly' }];
const projectOptions = computed(() => projectStore.projectsList.map(p => ({ title: p.name, value: p.id })));

const breadcrumbs = computed(() => {
  const parts = currentPath.value.split('/').filter(Boolean);
  const internalCrumbs = [{ title: '根目錄', disabled: false, path: '' }];
  let currentBuildPath = '';
  for (const part of parts) {
    currentBuildPath += `${part}/`;
    internalCrumbs.push({ title: part, disabled: false, path: currentBuildPath });
  }
  if (internalCrumbs.length > 0) {
    internalCrumbs[internalCrumbs.length - 1].disabled = true;
  }
  return internalCrumbs.map(crumb => ({
    title: crumb.title,
    disabled: crumb.disabled,
    onClick: () => {
      if (!crumb.disabled) navigate(crumb.path);
    }
  }));
});

const parentPath = computed(() => {
    const parts = currentPath.value.split('/').filter(Boolean);
    parts.pop();
    if (parts.length === 0) return '';
    return parts.join('/') + '/';
});


// 6. Watchers (監聽器)
// ✅ START: 核心修正 - 使用 watch 監聽 Tab 切換來載入資料
watch(currentTab, async (newTab) => {
  // 當使用者點擊到需要集合列表的 Tab (`jobs` 或 `update`)，且資料尚未載入時
  if (['jobs', 'update'].includes(newTab) && !collectionsLoaded.value) {
    try {
      isLoading.value = true; // 顯示載入中
      const collections = await fetchFirestoreCollections();
      collectionItems.value = collections;
      collectionsLoaded.value = true; // 標記為已載入，避免重複請求
    } catch (error) {
      toast.error(`讀取集合列表失敗: ${error.message}`);
    } finally {
      isLoading.value = false;
    }
  }

  // 檔案瀏覽器的邏輯維持不變
  if (newTab === 'browser' && files.value.length === 0 && directories.value.length === 0) {
      loadFiles(currentPath.value);
  }
}, { immediate: true }); // immediate: true 確保元件初次載入時就會為預設的 'jobs' Tab 執行一次
// ✅ END: 核心修正

watch([() => batchUpdate.targetCollection, () => batchUpdate.projectId], async ([collection, projectId]) => {
  if (collection && projectId) {
    batchUpdate.isLoadingFields = true;
    batchUpdate.availableFields = await fetchAvailableFields(collection, projectId);
    batchUpdate.isLoadingFields = false;
  } else {
    batchUpdate.availableFields = [];
    batchUpdate.selectedFields = [];
  }
});


// 7. Lifecycle Hooks (生命週期鉤子)
let unsubscribe = null;

// 在 setup 階段立即開始非同步獲取集合列表
(async () => {
  try {
    const collections = await fetchFirestoreCollections();
    collectionItems.value = collections;
  } catch (error) {
    toast.error(`讀取集合列表失敗: ${error.message}`);
    console.error("讀取集合列表失敗:", error);
  }
})();

onMounted(() => {
  projectStore.fetchProjects();
  unsubscribe = listenToBackupJobs((data) => {
    jobs.value = data;
    isLoading.value = false;
  });
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
});


// 8. Methods (方法)
// --- General Helper Methods ---
function formatTimestamp(timestamp) {
  if (!timestamp) return 'N/A';
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toLocaleString('zh-TW');
  }
  const date = new Date(timestamp);
  if (!isNaN(date.getTime())) {
    return date.toLocaleString('zh-TW');
  }
  return '無效日期';
}

// --- Job List & Dialog Methods ---
function openDialog(item = null) {
  if (item) {
    isEditing.value = true;
    editedItem.value = JSON.parse(JSON.stringify(item));
    if (!editedItem.value.filters) editedItem.value.filters = { projectId: null };
  } else {
    isEditing.value = false;
    editedItem.value = { ...defaultItem, filters: { ...defaultItem.filters } };
  }
  dialogVisible.value = true;
}

function closeDialog() {
  dialogVisible.value = false;
}

async function saveJob() {
  isSaving.value = true;
  try {
    const payload = { ...editedItem.value };
    if (payload.scheduleType === 'manual') delete payload.scheduleTime;
    if (isEditing.value) {
      await updateBackupJob(payload.id, payload);
      toast.success('任務已更新');
    } else {
      await createBackupJob(payload);
      toast.success('任務已建立');
    }
    closeDialog();
  } catch (error) {
    toast.error(`儲存失敗: ${error.message}`);
  } finally {
    isSaving.value = false;
  }
}

async function runJobNow(item) {
    if (!confirm(`確定要立即執行 "${item.jobName}" 這個任務嗎？`)) return;
    runningJobs[item.id] = true;
    try {
        let result;
        if (item.jobType === 'backup') {
            result = await triggerBackupJob(item.id, item);
        } else if (item.jobType === 'delete') {
            const previewResult = await triggerDeleteJob(item.id, item, true);
            if (previewResult.status !== 'success') throw new Error(previewResult.message);
            if (previewResult.docsAffected === 0) {
                toast.info("預覽完成，沒有找到任何可刪除的文件。");
                runningJobs[item.id] = false;
                return;
            }
            const confirmMsg = `預覽完成！\n\n共找到 ${previewResult.docsAffected} 份可刪除的文件。\n\n您確定要永久刪除這些文件嗎？此操作無法復原！`;
            if (confirm(confirmMsg)) {
                result = await triggerDeleteJob(item.id, item, false);
            } else {
                toast.info("使用者取消了刪除操作。");
                runningJobs[item.id] = false;
                return;
            }
        }
        if (result && result.status === 'success') {
            toast.success(result.message);
        } else {
            throw new Error(result.message || '發生未知錯誤');
        }
    } catch (error) {
        toast.error(`執行失敗: ${error.message}`);
    } finally {
        runningJobs[item.id] = false;
    }
}

async function confirmDelete(item) {
    if(confirm(`確定要刪除 "${item.jobName}" 這個任務設定嗎？此操作無法復原。`)) {
        try {
            await deleteBackupJob(item.id);
            toast.success('任務已刪除');
        } catch (error) {
            toast.error(`刪除失敗: ${error.message}`);
        }
    }
}

// --- File Browser Methods ---
function getDisplayName(fullPath) {
    return fullPath.replace(currentPath.value, '').replace('/', '');
}

async function loadFiles(path) {
    isLoadingFiles.value = true;
    const { files: loadedFiles, directories: loadedDirs } = await fetchBackupFiles(path);
    files.value = loadedFiles;
    directories.value = loadedDirs;
    isLoadingFiles.value = false;
}

function navigate(path) {
    currentPath.value = path;
    loadFiles(path);
}

async function openPreview(file) {
    previewFileName.value = getDisplayName(file.name);
    isPreviewDialogVisible.value = true;
    previewContent.value = '讀取中...';
    const lines = await fetchBackupFileContent(file.name, 100);
    try {
        const formattedLines = lines.map(line => JSON.stringify(JSON.parse(line), null, 2));
        previewContent.value = formattedLines.join('\n\n');
    } catch (e) {
        previewContent.value = lines.join('\n');
    }
}

function promptDeleteFile(file) {
  fileToDelete.value = file;
  isDeleteConfirmDialogVisible.value = true;
}

async function handleConfirmDeleteFile() {
  if (!fileToDelete.value) return;
  isDeletingFile.value = true;
  try {
    const result = await triggerDeleteBackupFile(fileToDelete.value.name);
    if (result.status === 'success') {
      toast.success('檔案已成功刪除！');
      await loadFiles(currentPath.value);
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    toast.error(`刪除失敗: ${error.message}`);
  } finally {
    isDeletingFile.value = false;
    isDeleteConfirmDialogVisible.value = false;
  }
}

// --- Batch Update Methods ---
async function handleDownloadTemplate() {
  batchUpdate.isDownloading = true;
  try {
    const result = await triggerGenerateExcelTemplate({
      targetCollection: batchUpdate.targetCollection,
      projectId: batchUpdate.projectId,
      fields: batchUpdate.selectedFields.filter(f => f !== '_id'),
    });
    if (result.status === 'success' && result.downloadUrl) {
      window.open(result.downloadUrl, '_blank');
      toast.success('Excel 範本已開始下載！');
      batchUpdate.step = 2;
    } else {
      throw new Error(result.message || '找不到可下載的資料。');
    }
  } catch (error) {
    toast.error(`下載失敗: ${error.message}`);
  } finally {
    batchUpdate.isDownloading = false;
  }
}

async function handleUploadAndPreview() {
  batchUpdate.isPreviewing = true;
  batchUpdate.previewResult = null;
  try {
    const file = batchUpdate.uploadedFile;
    if (!file) {
      toast.error("請先選擇一個檔案再上傳。");
      return;
    }

    // ✅ 核心修正：使用 FileReader 在前端讀取檔案為 Base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    // 建立一個 Promise 來等待 FileReader 完成
    const fileContent = await new Promise((resolve, reject) => {
      reader.onload = () => {
        // 去除 Base64 URL 的前綴 (e.g., "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,")
        resolve(reader.result.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });

    // 直接將檔案內容傳送到後端進行預覽
    const result = await triggerUpdateFromExcel(fileContent, batchUpdate.targetCollection, true); // DryRun = true
    
    if (result.status === 'success') {
      batchUpdate.previewResult = result.data;
      batchUpdate.step = 3;
      toast.success('預覽成功！請確認變更內容。');
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    toast.error(`預覽失敗: ${error.message}`);
  } finally {
    batchUpdate.isPreviewing = false;
  }
}

async function handleExecuteUpdate() {
  if (!confirm("請再次確認，此操作將會覆寫資料庫中的資料，是否確定要執行？")) return;
  
  batchUpdate.isExecuting = true;
  try {
    // 與預覽函式一樣，再次從 uploadedFile 讀取內容
    const file = batchUpdate.uploadedFile;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    const fileContent = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = (error) => reject(error);
    });

    const result = await triggerUpdateFromExcel(fileContent, batchUpdate.targetCollection, false); // DryRun = false
    
    if (result.status === 'success') {
      toast.success(result.message);
      // 重置流程
      batchUpdate.step = 1;
      batchUpdate.previewResult = null;
      batchUpdate.uploadedFile = null;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    toast.error(`更新失敗: ${error.message}`);
  } finally {
    batchUpdate.isExecuting = false;
  }
}

</script>

<style scoped>
/* 移除手機版表格的內部邊框 */
.v-data-table--mobile .v-table__wrapper > table > tbody > tr > td {
  border-bottom: none !important;
}

.mobile-card-content {
  padding: 12px 16px;
  display: grid;
  gap: 12px;
}

.mobile-card-content > div {
  display: flex;
  align-items: center;
}

.mobile-card-content .label {
  font-size: 0.8rem;
  color: #616161;
  width: 80px;
  flex-shrink: 0;
}

.mobile-card-content .value {
  font-weight: 500;
}


/* 當滑鼠移到「可點擊」的麵包屑項目上時 */
:deep(.v-breadcrumbs-item:not(.v-breadcrumbs-item--disabled)) {
  cursor: pointer; /* 讓滑鼠指標變成手指形狀 */
  transition: all 0.2s ease-in-out;
}

/* 當滑鼠移到「可點擊」的麵包屑項目上時，為其加上底線並稍微改變顏色 */
:deep(.v-breadcrumbs-item:not(.v-breadcrumbs-item--disabled):hover) {
  text-decoration: underline;
  color: #1976D2; /* Vuetify 預設的 primary 藍色 */
}
</style>