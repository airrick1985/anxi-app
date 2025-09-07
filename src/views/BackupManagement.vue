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
    <v-tab value="browser">備份檔案瀏覽</v-tab> 
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
          >
            <template v-slot:item.jobType="{ item }">
              <v-chip :color="item.jobType === 'backup' ? 'primary' : 'error'" size="small">
                {{ item.jobType === 'backup' ? '備份' : '刪除' }}
              </v-chip>
            </template>
            <template v-slot:item.filters="{ item }">
              <div v-if="item.filters.projectId">
                建案: {{ projectStore.idToNameMap[item.filters.projectId] || item.filters.projectId }}
              </div>
            </template>
            <template v-slot:item.scheduleType="{ item }">
              {{ scheduleLabels[item.scheduleType] || '未知' }}
              <span v-if="item.scheduleType !== 'manual'"> @ {{ item.scheduleTime }}</span>
            </template>
            <template v-slot:item.lastRun="{ item }">
              <div v-if="item.lastRun">
                <v-chip :color="item.lastRun.status === 'success' ? 'success' : 'error'" size="x-small" class="mb-1">
                  {{ item.lastRun.status === 'success' ? '成功' : '失敗' }}
                </v-chip>
                <div class="text-caption">
                  {{ formatTimestamp(item.lastRun.timestamp) }}
                </div>
              </div>
              <span v-else class="text-grey">尚未執行</span>
            </template>
            <template v-slot:item.status="{ item }">
              <v-chip :color="item.status === 'enabled' ? 'green' : 'grey'" size="small">
                {{ item.status === 'enabled' ? '啟用中' : '已停用' }}
              </v-chip>
            </template>
            <template v-slot:item.actions="{ item }">
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
            </template>
          </v-data-table>
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
            <v-select v-model="editedItem.targetCollection" :items="collectionItems" label="目標集合*" :rules="[v => !!v || '必填']"></v-select>            <v-select v-model="editedItem.filters.projectId" :items="projectOptions" label="篩選建案 (可選)" clearable></v-select>
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

</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, reactive, watch } from 'vue';
import { useProjectStore } from '@/store/projectStore';
import { useToast } from 'vue-toastification';
import {
  listenToBackupJobs,
  createBackupJob,
  updateBackupJob,
  deleteBackupJob,
  triggerBackupJob,
  fetchBackupFiles,
  fetchBackupFileContent,
  fetchFirestoreCollections 
} from '@/api';

const projectStore = useProjectStore();
const toast = useToast();
const emit = defineEmits(['startLoading', 'stopLoading', 'notify']);


const isLoading = ref(true);
const isSaving = ref(false);
const jobs = ref([]);
const currentTab = ref('jobs');
const dialogVisible = ref(false);
const isEditing = ref(false);
const runningJobs = reactive({});
const collectionItems = ref([]); 

// START: 新增檔案瀏覽器需要的狀態
const currentPath = ref('');
const files = ref([]);
const directories = ref([]);
const isLoadingFiles = ref(false);
const isPreviewDialogVisible = ref(false);
const previewContent = ref('');
const previewFileName = ref('');
// END: 新增檔案瀏覽器需要的狀態


const breadcrumbs = computed(() => {
  const parts = currentPath.value.split('/').filter(Boolean);
  // 1. 我們先建立一個內部用的路徑資料結構
  const internalCrumbs = [{ title: '根目錄', disabled: false, path: '' }];
  let currentBuildPath = '';
  for (const part of parts) {
    currentBuildPath += `${part}/`;
    internalCrumbs.push({ title: part, disabled: false, path: currentBuildPath });
  }

  // 2. 將最後一個項目設為不可點擊
  if (internalCrumbs.length > 0) {
    internalCrumbs[internalCrumbs.length - 1].disabled = true;
  }

  // 3. ✅ 最終只回傳 <v-breadcrumbs> 需要的屬性，移除了 href
  return internalCrumbs.map(crumb => ({
    title: crumb.title,
    disabled: crumb.disabled,
    onClick: () => {
      // 只有在項目不是 disabled 的情況下才執行導航
      if (!crumb.disabled) {
        navigate(crumb.path);
      }
    }
  }));
});

const parentPath = computed(() => {
    const parts = currentPath.value.split('/').filter(Boolean);
    parts.pop();
    if (parts.length === 0) {
        return ''; // 根目錄的路徑是空字串
    }
    return parts.join('/') + '/';
});

const defaultItem = {
  jobName: '',
  jobType: 'backup',
  status: 'enabled',
  targetCollection: null,
  filters: { projectId: null },
  scheduleType: 'manual',
  scheduleTime: '03:00',
};
const editedItem = ref({ ...defaultItem });

const headers = [
  { title: '任務名稱', key: 'jobName' },
  { title: '類型', key: 'jobType' },
  { title: '目標集合', key: 'targetCollection' },
  { title: '篩選條件', key: 'filters' },
  { title: '排程', key: 'scheduleType' },
  { title: '上次執行', key: 'lastRun' },
  { title: '狀態', key: 'status' },
  { title: '操作', key: 'actions', sortable: false },
];

const scheduleLabels = {
  manual: '僅手動',
  daily: '每日',
  weekly: '每週',
};

const scheduleOptions = [
  { title: '僅手動', value: 'manual' },
  { title: '每日', value: 'daily' },
  { title: '每週', value: 'weekly' },
];

const projectOptions = computed(() => 
  projectStore.projectsList.map(p => ({ title: p.name, value: p.id }))
);

let unsubscribe = null;
onMounted(() => {
  projectStore.fetchProjects();

  // 獲取集合列表
  fetchFirestoreCollections().then(collections => {
    collectionItems.value = collections;
  });

  unsubscribe = listenToBackupJobs((data) => {
    jobs.value = data;
    isLoading.value = false;
  });
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
});

function openDialog(item = null) {
  if (item) {
    isEditing.value = true;
    editedItem.value = JSON.parse(JSON.stringify(item));
    // 確保 filters 物件存在
    if (!editedItem.value.filters) {
        editedItem.value.filters = { projectId: null };
    }
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
    // 簡單清理
    if (payload.scheduleType === 'manual') {
      delete payload.scheduleTime;
    }

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

// ✓ 【替換】 runJobNow 整個函式
async function runJobNow(item) {
    if (!confirm(`確定要立即執行 "${item.jobName}" 這個任務嗎？`)) return;
    
    runningJobs[item.id] = true;
    try {
        let result;
        if (item.jobType === 'backup') {
            result = await triggerBackupJob(item.id, item);
        } else if (item.jobType === 'delete') {
            // 刪除任務：第一步，先執行預覽
            const previewResult = await triggerDeleteJob(item.id, item, true); // isDryRun = true
            if (previewResult.status !== 'success') throw new Error(previewResult.message);

            if (previewResult.docsAffected === 0) {
                toast.info("預覽完成，沒有找到任何可刪除的文件。");
                runningJobs[item.id] = false;
                return;
            }

            // 第二步，彈出確認框，讓使用者確認
            const confirmMsg = `預覽完成！\n\n共找到 ${previewResult.docsAffected} 份可刪除的文件。\n\n您確定要永久刪除這些文件嗎？此操作無法復原！`;
            if (confirm(confirmMsg)) {
                // 第三步，使用者確認後，執行真實刪除
                result = await triggerDeleteJob(item.id, item, false); // isDryRun = false
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

// ✅ START: 新增一個更安全的日期格式化函式
function formatTimestamp(timestamp) {
  if (!timestamp) return 'N/A';
  
  // 情況 A: 如果是 Firestore 的 Timestamp 物件
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toLocaleString('zh-TW');
  }
  
  // 情況 B: 如果是日期字串或已經是 Date 物件
  const date = new Date(timestamp);
  if (!isNaN(date.getTime())) {
    return date.toLocaleString('zh-TW');
  }

  // 其他無法解析的情況
  return '無效日期';
}
// ✅ END: 新增一個更安全的日期格式化函式

// START: 新增檔案瀏覽器需要的函式
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
    
    const lines = await fetchBackupFileContent(file.name, 100); // 讀取前 100 行
    
    try {
        // 嘗試將每一行都格式化為美觀的 JSON
        const formattedLines = lines.map(line => JSON.stringify(JSON.parse(line), null, 2));
        previewContent.value = formattedLines.join('\n\n');
    } catch (e) {
        // 如果解析失敗，就直接顯示純文字
        previewContent.value = lines.join('\n');
    }
}
// END: 新增檔案瀏覽器需要的函式

// 新增：監聽 currentTab，當切換到瀏覽器 Tab 時，才載入初始資料
watch(currentTab, (newTab) => {
    if (newTab === 'browser' && files.value.length === 0 && directories.value.length === 0) {
        loadFiles(currentPath.value);
    }
});

</script>

<style scoped>
/* 針對 v-breadcrumbs 元件進行樣式覆寫 */
/* 使用 :deep() 選擇器來穿透到 Vuetify 子元件的樣式 */

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