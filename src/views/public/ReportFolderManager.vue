<template>
  <v-container fluid class="pa-2 pa-sm-4" style="background-color: #F4F4F7; min-height: 100vh;">
    <v-card class="mx-auto" max-width="1600">
      <v-toolbar color="primary" dark flat>
        <v-toolbar-title class="font-weight-bold">驗屋報告管理</v-toolbar-title>
        <v-spacer></v-spacer>
       <v-btn
          variant="outlined"
          @click="goBack"
          prepend-icon="mdi-arrow-left"
        >
          返回時間表
        </v-btn>
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
              <v-select v-model="selectedProject" :items="authorizedProjects" item-title="title" item-value="value" label="切換建案" variant="outlined" hide-details></v-select>
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field v-model="searchFilter" label="搜尋所有欄位" prepend-inner-icon="mdi-magnify" variant="outlined"  hide-details clearable></v-text-field>
            </v-col>
            <v-col cols="12" md="3">
              <v-select v-model="statusFilter" :items="['未下載', '已下載', '作廢']" label="篩選狀態" variant="outlined"  hide-details clearable multiple chips></v-select>
            </v-col>
            <v-col cols="12" md="3" class="d-flex align-center ga-2 justify-end">
              <v-btn @click="loadProjectData(selectedProject, true)" :loading="isRefreshing" icon="mdi-refresh" variant="tonal" :disabled="!selectedProject"></v-btn>
              <v-menu offset-y>
                <template v-slot:activator="{ props }">
                  <v-btn color="blue-darken-3" :disabled="selected.length === 0" v-bind="props" append-icon="mdi-chevron-down">加註</v-btn>
                </template>
                <v-list>
                  <v-list-item @click="handleRename('已下載')"><v-list-item-title>加註 (已下載)</v-list-item-title></v-list-item>
                  <v-list-item @click="handleRename('作廢')"><v-list-item-title>加註 (作廢)</v-list-item-title></v-list-item>
                </v-list>
              </v-menu>
            </v-col>
          </v-row>
        </v-sheet>
        
        <div v-if="!selectedProject" class="text-center pa-16 text-grey">
          <v-icon size="x-large" class="mb-4">mdi-folder-search-outline</v-icon>
          <p>請從上方的下拉選單選擇一個建案以開始管理。</p>
        </div>
        
        <v-data-table
          v-else
          v-model="selected"
          v-model:expanded="expanded"
          v-model:sort-by="sortBy"
          @update:expanded="onUpdateExpanded"
          :headers="headers"
          :items="filteredTableData"
          :loading="isFetchingFiles"
          item-value="rowId"
          show-select
          :row-props="getRowProps"
          class="elevation-0"
          :items-per-page="-1"
         :items-per-page-options="[
           { value: 10, title: '10' },
           { value: 25, title: '25' },
           { value: 50, title: '50' },
           { value: 100, title: '100' },
           { value: -1, title: '全部顯示' }
         ]"
        >

        
          <template v-slot:item.reportFolder.name="{ item, internalItem, toggleExpand, isExpanded }">
            <div @click.stop="toggleExpand(internalItem)" style="cursor: pointer; user-select: none;" class="d-flex align-center">
              <v-icon :icon="isExpanded ? 'mdi-chevron-down' : 'mdi-chevron-right'" size="small" class="mr-1"></v-icon>
              <span>{{ item.reportFolder.name }}</span>
            </div>
          </template>
          <template v-slot:item.status="{ item }">
            <v-chip :color="getStatusChipColor(item.status)" variant="tonal" size="small" label>{{ item.status }}</v-chip>
          </template>
          <template v-slot:item.modifiedTime="{ item }">
            <div style="white-space: pre-line;">{{ formatDateTime(item.modifiedTime) }}</div>
          </template>
          <template v-slot:expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length">
                <v-sheet class="pa-4 bg-blue-grey-lighten-5">
                  <div v-if="expandedPdfFiles[item.rowId] === undefined || expandedPdfFiles[item.rowId] === 'loading'" class="text-center">
                    <v-progress-circular indeterminate size="24"></v-progress-circular>
                  </div>
                  <div v-else-if="expandedPdfFiles[item.rowId].length === 0" class="text-grey">此資料夾內沒有檔案。</div>
                  <div v-else class="d-flex flex-column align-start ga-2">
                  <v-btn v-for="pdf in expandedPdfFiles[item.rowId]" :key="pdf.id" @click="previewDialog = { visible: true, item: pdf }" variant="tonal" size="small" prepend-icon="mdi-file-pdf-box">{{ pdf.name }}</v-btn>
                  </div>
                </v-sheet>
              </td>
            </tr>
          </template>
        </v-data-table>

        
        </div>
    </v-card>

     <div class="text-caption text-grey text-center mt-6 d-flex align-center justify-center">
      <span>本服務由</span>
      <v-chip class="ml-2" href="https://airrick1985.wixsite.com/anxi" target="_blank" rel="noopener noreferrer" color="blue-grey" variant="tonal" size="small" label>
        <v-icon start size="x-small">mdi-rocket-launch-outline</v-icon>
        anxismart安熙智慧建案管理系統
      </v-chip>
      <span>提供技術支援</span>
    </div>
    
    <v-dialog v-model="dialog.visible" max-width="600px" persistent>
       <v-card>
        <v-card-title class="text-h6 d-flex align-center">
          <v-icon :icon="dialog.icon" :color="dialog.color" start></v-icon>
          確認{{ dialog.title }}
        </v-card-title>
        <v-card-text>
          <p class="mb-3">您確定要對以下 {{ dialog.items?.length || 0 }} 個項目執行「{{ dialog.title }}」嗎？</p>
          <v-list dense max-height="200" class="overflow-y-auto border rounded">
            <v-list-item v-for="item in dialog.items" :key="item.id" :title="item.name"></v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="dialog.visible = false">取消</v-btn>
          <v-btn :color="dialog.color" variant="flat" @click="confirmDialogAction" :loading="isStartingTask">確定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
   <v-dialog v-model="previewDialog.visible" max-width="90vw" max-height="90vh">
      <v-card>
        <v-toolbar dense flat class="border-b">
          <v-toolbar-title class="text-subtitle-1">{{ previewDialog.item?.name }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-download" @click="downloadPreviewFile"></v-btn>
          <v-btn icon="mdi-close" @click="previewDialog.visible = false"></v-btn>
        </v-toolbar>
        <v-card-text class="pa-0 d-flex justify-center align-center" style="height: calc(90vh - 48px);">
          <iframe v-if="previewDialog.item?.url" :src="previewDialog.item.url.replace('/view', '/preview')" width="100%" height="100%" frameborder="0"></iframe>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-snackbar v-for="task in activeTasks" :key="task.id" :model-value="true" location="bottom right" multi-line vertical :timeout="-1" :color="task.status === 'error' ? 'error' : 'blue-grey'">
       <div class="d-flex align-center">
        <v-progress-circular v-if="task.status === 'processing'" indeterminate size="24" class="mr-3"></v-progress-circular>
        <v-icon v-else-if="task.status === 'completed'" color="success" class="mr-3">mdi-check-circle</v-icon>
        <v-icon v-else-if="task.status === 'error'" color="white" class="mr-3">mdi-alert-circle</v-icon>
        <div>
          <div class="font-weight-bold">更名任務</div>
          <div class="text-caption">{{ task.details }}</div>
          <div v-if="task.status === 'processing'" class="text-caption">進度: {{ task.progress }}</div>
        </div>
      </div>
    </v-snackbar>
    <v-snackbar v-model="refreshSnackbar.visible" location="bottom left" multi-line :timeout="-1" color="info" variant="elevated">
      {{ refreshSnackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="() => { refreshSnackbar.visible = false; loadProjectData(selectedProject, true); }">立即刷新</v-btn>
        <v-btn icon="mdi-close" variant="text" @click="refreshSnackbar.visible = false"></v-btn>
      </template>
    </v-snackbar>
    </v-container>
</template>

<script setup>
import { ref, onMounted, computed, watch, reactive } from 'vue';
import liff from '@line/liff';
import { useRouter } from 'vue-router';
import { useDriveStore } from '@/store/driveStore';
import { getProjectSettings, getReportFolderStructure, driveProxyList } from '@/api';
import { useUserStore } from '@/store/user';
import { VDataTable } from 'vuetify/components/VDataTable';

// ✓ START: 修改 - 將 projectId 不再設為 required
const props = defineProps({
  projectId: {
    type: String,
    default: null // 預設為 null
  }
});
// ✓ END: 修改

const router = useRouter();
const driveStore = useDriveStore();
const userStore = useUserStore();
const isLoading = ref(true);
const loadingText = ref('正在初始化...');
const isBound = ref(false);
const isRefreshing = ref(false);
const isFetchingFiles = ref(false);
const username = ref('User');
const rootFolderId = ref(null);
const allReportData = ref([]);
const selected = ref([]);
const searchFilter = ref('');
const statusFilter = ref(['未下載']);
const selectedProject = ref(null);
const expanded = ref([]);
const expandedPdfFiles = ref({});
const previewDialog = ref({ visible: false, item: null });
const isStartingTask = ref(false);
const dialog = ref({ visible: false, type: '', title: '', items: [], icon: '', color: '' });
const activeTasks = computed(() => Object.values(driveStore.tasks).filter(task => task.status !== 'completed' && task.status !== 'error'));
const refreshSnackbar = reactive({ visible: false, message: '', });
const completedRenameTaskIds = computed(() => { return Object.values(driveStore.tasks).filter(task => task.taskType === 'rename' && task.status === 'completed').map(task => task.id); });
watch(completedRenameTaskIds, (newIds, oldIds) => { if (newIds.length > (oldIds?.length || 0)) { const newlyCompletedId = newIds.find(id => !(oldIds || []).includes(id)); if (newlyCompletedId) { refreshSnackbar.message = '資料夾加註完成，建議重新整理列表以查看最新狀態。'; refreshSnackbar.visible = true; } } });
const headers = [ { title: '棟別', key: 'building' }, { title: '棟號', key: 'unitNumber' }, { title: '驗屋報告', key: 'reportFolder.name', sortable: false }, { title: '狀態', key: 'status' }, { title: '修改時間', key: 'modifiedTime' }, ];
const sortBy = ref([{ key: 'modifiedTime', order: 'asc' }]);
const authorizedProjects = computed(() => { const permissions = userStore.user?.permissions; if (!permissions) return []; const projects = []; for (const projectId in permissions) { const p = permissions[projectId]; if (p.systems?.includes('驗屋預約管理-檢視') || p.systems?.includes('驗屋預約管理-修改')) { projects.push({ title: p.projectName, value: projectId }); } } return projects.sort((a, b) => a.title.localeCompare(b.title, 'zh-Hant')); });
const tableData = computed(() => { return allReportData.value.map(item => { const name = item.reportFolder.name; let status = '未下載'; let statusOrder = 1; const hasDownloaded = name.includes('已下載'); const hasInvalidated = name.includes('作廢'); if (hasInvalidated) { status = '作廢'; statusOrder = 3; } if (hasDownloaded) { status = hasInvalidated ? '已下載, 作廢' : '已下載'; statusOrder = 2; } if(status === '作廢') statusOrder = 3; return { ...item, status, statusOrder }; }); });
const filteredTableData = computed(() => { return tableData.value.filter(item => { const statusMatch = statusFilter.value.length === 0 || statusFilter.value.some(s => item.status.includes(s)); const searchMatch = !searchFilter.value || Object.values(item).some(val => String(val).toLowerCase().includes(searchFilter.value.toLowerCase()) || String(val.name)?.toLowerCase().includes(searchFilter.value.toLowerCase()) ); return statusMatch && searchMatch; }); });
const getRowProps = ({ item }) => { if (item.status.includes('作廢')) return { class: 'bg-grey-lighten-3 text-medium-emphasis' }; if (item.status.includes('已下載')) return { class: 'bg-green-lighten-5' }; return { class: 'font-weight-bold' }; };
const getStatusChipColor = (status) => { if (status.includes('作廢')) return 'grey'; if (status.includes('已下載')) return 'success'; return 'error'; };

// ✓ START: 修改 - 處理有/無 projectId 的不同載入邏輯
onMounted(async () => {
  try {
    loadingText.value = '正在與 LINE 連接...';
    await liff.init({ liffId: '2008257338-gYnbKlpR' });  //正式 2008257338-gYnbKlpR      測試 2008257338-6N3jwqxA
    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    loadingText.value = '正在驗證使用者權限...';
    const profile = await liff.getProfile();
    const success = await userStore.fetchUserByLineId(profile.userId);

    if (success) {
      isBound.value = true;
      username.value = userStore.user?.name || 'User';
      
      // 核心邏輯：判斷 URL 是否帶有 projectId
      if (props.projectId) {
        //情況 A: URL 帶有 projectId，直接載入該建案
        selectedProject.value = props.projectId;
        await loadProjectData(selectedProject.value);
      } else {
        //情況 B: URL 沒有 projectId
        if (authorizedProjects.value.length === 1) {
          // 如果使用者只有一個建案的權限，自動為他選取並載入
          selectedProject.value = authorizedProjects.value[0].value;
          await loadProjectData(selectedProject.value);
        }
        // 如果使用者有多個建案權限，則不自動載入，等待使用者從下拉選單選擇。
        // `selectedProject` 保持為 null，模板會顯示提示訊息。
      }

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
// ✓ END: 修改

watch(selectedProject, (newProjectId, oldProjectId) => { if (newProjectId && newProjectId !== oldProjectId) { loadProjectData(newProjectId); } });
async function onUpdateExpanded(newExpandedIds) { const newlyExpandedId = newExpandedIds.find(id => expandedPdfFiles.value[id] === undefined); if (!newlyExpandedId) { return; } const item = tableData.value.find(i => i.rowId === newlyExpandedId); if (item) { try { expandedPdfFiles.value[newlyExpandedId] = 'loading'; const res = await driveProxyList({ folderId: item.reportFolder.id }); expandedPdfFiles.value[newlyExpandedId] = res.files.filter(f => !f.isFolder); } catch (e) { console.error(`獲取資料夾 ${item.reportFolder.name} 內容失敗:`, e); expandedPdfFiles.value[newlyExpandedId] = []; } } }
async function loadProjectData(pId, forceRefresh = false) { if (!pId) return; isFetchingFiles.value = true; isRefreshing.value = forceRefresh; try { const settings = await getProjectSettings(pId); const folderUrl = settings?.reportSettings?.reportDataFolderUrl; if (!folderUrl) throw new Error('找不到報告資料夾設定'); rootFolderId.value = folderUrl.match(/[-\w]{25,}/)?.[0]; if (!rootFolderId.value) throw new Error('無效的 Drive 資料夾連結'); const response = await getReportFolderStructure({ rootFolderId: rootFolderId.value }); if (response.status === 'success') { allReportData.value = response.files; } else { throw new Error(response.message); } } catch (error) { alert(`載入資料失敗: ${error.message}`); } finally { isFetchingFiles.value = false; isRefreshing.value = false; } }
function downloadPreviewFile() { const item = previewDialog.value.item; if (!item || !item.url) return; const link = document.createElement('a'); link.href = item.url; link.setAttribute('download', item.name); document.body.appendChild(link); link.click(); document.body.removeChild(link); }
async function startRenameTask(suffix) {
  isStartingTask.value = true;
  const selectedItems = selected.value.map(rowId => tableData.value.find(i => i.rowId === rowId)).filter(Boolean);
  const payload = {
    taskType: 'rename',
    items: selectedItems.map(i => i.reportFolder),
    projectId: selectedProject.value,
    suffixOptions: { 
      suffix: suffix,
      username: username.value 
    }
  };
  try {
    await driveStore.startTask(payload);
    dialog.value.visible = false;
    selected.value = [];
  } catch(error) {
    alert(`啟動任務失敗: ${error.message}`);
  } finally {
    isStartingTask.value = false;
  }
}
const handleRename = (type) => { const itemsToProcess = selected.value.map(id => tableData.value.find(i => i.rowId === id)?.reportFolder).filter(Boolean); dialog.value = { visible: true, type: 'rename', title: `加註 (${type})`, items: itemsToProcess, icon: 'mdi-form-textbox', color: 'orange-darken-3', renameType: type }; };
async function confirmDialogAction() { if (dialog.value.type === 'rename') { await startRenameTask(dialog.value.renameType); } }
const formatDateTime = (isoString) => isoString ? new Date(isoString).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit' }).replace(' ', '\n') : '';

//返回 LIFF時間表頁面
const goBack = () => {
  window.location.href = 'https://liff.line.me/2008257338-o8grV0ZD';
};
</script>

<style>
.bg-green-lighten-5 { background-color: #E8F5E9 !important; }
.bg-grey-lighten-3 { background-color: #F5F5F5 !important; }
.v-data-table__tr { transition: background-color 0.3s; }
</style>