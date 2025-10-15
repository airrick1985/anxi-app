<template>
  <v-container fluid class="pa-2 pa-sm-4" style="background-color: #F4F4F7; min-height: 100vh;">
    <v-card class="mx-auto" max-width="1200">
      <v-toolbar color="primary" dark flat>
        <v-toolbar-title class="font-weight-bold">驗屋報告資料夾管理</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="goHome">
          <v-icon>mdi-home</v-icon>
        </v-btn>
      </v-toolbar>

      <div v-if="isLoading" class="text-center pa-10">
        <v-progress-circular indeterminate color="primary" size="50"></v-progress-circular>
        <p class="mt-4 text-grey">{{ loadingText }}</p>
      </div>

      <div v-else>
        <v-sheet class="pa-3 border-b">
          <v-breadcrumbs :items="breadcrumbs" class="pa-0 mb-3">
            <template v-slot:divider>
              <v-icon>mdi-chevron-right</v-icon>
            </template>
          </v-breadcrumbs>
          <v-row dense>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="searchTerm"
                label="搜尋目前資料夾"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                hide-details
                clearable
                @click:clear="refresh(false)"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="8" class="d-flex align-center ga-2">
               <v-btn-toggle v-model="statusFilter" multiple color="blue-darken-2" variant="outlined" density="comfortable">
                <v-btn value="已下載">已下載</v-btn>
                <v-btn value="作廢">作廢</v-btn>
              </v-btn-toggle>
              <v-spacer></v-spacer>
              <v-btn @click="refresh(true)" :loading="isRefreshing" icon="mdi-refresh" variant="tonal"></v-btn>
              <v-btn 
                color="blue-darken-2" 
                @click="openDownloadDialog" 
                :disabled="selected.length === 0"
                prepend-icon="mdi-download"
                class="d-none d-sm-flex"
              >
                下載 ({{ selected.length }})
              </v-btn>
              <v-btn 
                color="orange-darken-3" 
                @click="openRenameDialog" 
                :disabled="selected.length === 0"
                prepend-icon="mdi-form-textbox"
                class="d-none d-sm-flex"
              >
                加註 ({{ selected.length }})
              </v-btn>
            </v-col>
          </v-row>
        </v-sheet>
        
        <v-data-table
          v-model="selected"
          :headers="headers"
          :items="filteredFiles"
          :loading="isFetchingFiles"
          item-value="id"
          show-select
          class="elevation-0"
          @click:row="handleRowClick"
        >
          <template v-slot:item.name="{ item }">
            <div @contextmenu.prevent="showContextMenu($event, item)" style="cursor: pointer;" class="d-flex align-center">
              <v-icon :icon="item.isFolder ? 'mdi-folder' : 'mdi-file-outline'" start></v-icon>
              <span>{{ item.name }}</span>
            </div>
          </template>

          <template v-slot:item.modifiedTime="{ item }">
            {{ formatDateTime(item.modifiedTime) }}
          </template>

          <template v-slot:item.size="{ item }">
            {{ item.isFolder ? '-' : formatBytes(item.size) }}
          </template>
        </v-data-table>
      </div>
    </v-card>
    
    <v-menu
      v-model="contextMenu.visible"
      :style="{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }"
      absolute
      offset-y
    >
      <v-list density="compact">
        <v-list-item @click="handleContextAction('download')" v-if="contextMenu.item && contextMenu.item.isFolder">
          <template v-slot:prepend><v-icon>mdi-download</v-icon></template>
          <v-list-item-title>下載</v-list-item-title>
        </v-list-item>
        <v-list-item @click="handleContextAction('rename')" v-if="contextMenu.item && contextMenu.item.isFolder">
          <template v-slot:prepend><v-icon>mdi-form-textbox</v-icon></template>
          <v-list-item-title>加註</v-list-item-title>
        </v-list-item>
        <v-list-item @click="handleContextAction('preview')" v-if="contextMenu.item && !contextMenu.item.isFolder">
          <template v-slot:prepend><v-icon>mdi-eye</v-icon></template>
          <v-list-item-title>預覽</v-list-item-title>
        </v-list-item>
         <v-list-item :href="contextMenu.item.url" target="_blank">
          <template v-slot:prepend><v-icon>mdi-open-in-new</v-icon></template>
          <v-list-item-title>在新分頁中開啟</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-dialog v-model="dialog.visible" max-width="600px" persistent>
      <v-card>
        <v-card-title class="text-h6 d-flex align-center">
          <v-icon :icon="dialog.icon" :color="dialog.color" start></v-icon>
          確認{{ dialog.title }}
        </v-card-title>
        <v-card-text>
          <p class="mb-3">您確定要對以下 {{ dialog.items.length }} 個項目執行「{{ dialog.title }}」嗎？</p>
          <v-list dense max-height="200" class="overflow-y-auto border rounded">
            <v-list-item v-for="item in dialog.items" :key="item.id" :title="item.name"></v-list-item>
          </v-list>
          <v-select
            v-if="dialog.type === 'rename'"
            v-model="renameSuffix"
            :items="['(已下載)', '(作廢)']"
            label="選擇要加註的後綴"
            variant="outlined"
            density="compact"
            class="mt-4"
            hide-details
          ></v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="dialog.visible = false">取消</v-btn>
          <v-btn :color="dialog.color" variant="flat" @click="confirmDialogAction">確定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

     <v-dialog v-model="previewDialog.visible" max-width="90vw" max-height="90vh">
      <v-card>
        <v-toolbar dense flat>
          <v-toolbar-title>{{ previewDialog.item?.name }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="previewDialog.visible = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>
        <v-card-text class="pa-0 d-flex justify-center align-center" style="height: calc(90vh - 48px);">
          <iframe v-if="previewDialog.item?.url" :src="previewDialog.item.url.replace('/view', '/preview')" width="100%" height="100%" frameborder="0"></iframe>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-for="task in activeTasks"
      :key="task.id"
      :model-value="true"
      location="bottom right"
      multi-line
      vertical
      :timeout="-1"
      :color="task.status === 'error' ? 'error' : 'blue-grey'"
    >
      <div class="d-flex align-center">
        <v-progress-circular v-if="task.status === 'processing'" indeterminate size="24" class="mr-3"></v-progress-circular>
        <v-icon v-else-if="task.status === 'completed'" color="success" class="mr-3">mdi-check-circle</v-icon>
        <v-icon v-else-if="task.status === 'error'" color="white" class="mr-3">mdi-alert-circle</v-icon>
        <div>
          <div class="font-weight-bold">{{ task.taskType === 'download' ? '下載任務' : '更名任務' }}</div>
          <div class="text-caption">{{ task.details }}</div>
          <div v-if="task.status === 'processing'" class="text-caption">進度: {{ task.progress }}</div>
          <v-btn v-if="task.resultUrl" :href="task.resultUrl" size="small" color="white" variant="outlined" class="mt-2">下載檔案</v-btn>
        </div>
      </div>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import liff from '@line/liff';
import { useRouter } from 'vue-router';
import { useDriveStore } from '@/store/driveStore';
import { getProjectSettings } from '@/api';

const props = defineProps({
  projectId: { type: String, required: true }
});

// --- Store, Router, State ---
const router = useRouter();
const driveStore = useDriveStore();
const isLoading = ref(true);
const loadingText = ref('正在初始化...');
const isRefreshing = ref(false);
const isFetchingFiles = ref(false);
const username = ref('User');
const rootFolderId = ref(null);

const currentPath = ref([]); // [{ name: 'Root', id: '...' }, { name: 'A', id: '...' }]
const files = ref([]);
const selected = ref([]);
const searchTerm = ref('');
const statusFilter = ref([]);

const headers = [
  { title: '名稱', key: 'name', sortable: true },
  { title: '上次修改時間', key: 'modifiedTime', sortable: true },
  { title: '大小', key: 'size', sortable: true },
];

const dialog = ref({ visible: false, type: '', title: '', items: [], icon: '', color: '' });
const renameSuffix = ref('(已下載)');

const contextMenu = ref({ visible: false, x: 0, y: 0, item: null });
const previewDialog = ref({ visible: false, item: null });

// --- Computed Properties ---
const currentFolderId = computed(() => {
  if (currentPath.value.length === 0) return rootFolderId.value;
  return currentPath.value[currentPath.value.length - 1].id;
});

const breadcrumbs = computed(() => {
  return [{ title: '根目錄', disabled: false, data: { id: rootFolderId.value, name: 'Root' } }]
    .concat(currentPath.value.map((p, i) => ({
      title: p.name,
      disabled: i === currentPath.value.length - 1,
      data: p,
    })));
});

const filteredFiles = computed(() => {
  let items = [...files.value];
  
  if (searchTerm.value) {
    items = items.filter(file => file.name.toLowerCase().includes(searchTerm.value.toLowerCase()));
  }

  if (statusFilter.value.length > 0) {
    items = items.filter(file => {
      return statusFilter.value.some(status => file.name.includes(status));
    });
  }
  
  return items;
});

const activeTasks = computed(() => {
  return Object.values(driveStore.tasks).filter(
    task => task.projectId === props.projectId && task.status !== 'completed' && task.status !== 'error'
  );
});

// --- Methods ---
onMounted(async () => {
  try {
    loadingText.value = '正在與 LINE 連接...';
    await liff.init({ liffId: '2008257338-6N3jwqxA' });
    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }
    const profile = await liff.getProfile();
    username.value = profile.displayName || 'User';

    loadingText.value = '正在讀取建案設定...';
    const settings = await getProjectSettings(props.projectId);
    const folderUrl = settings?.reportSettings?.reportDataFolderUrl;
    
    if (!folderUrl) throw new Error('找不到建案的報告資料夾設定');
    
    const folderIdMatch = folderUrl.match(/[-\w]{25,}/);
    if (!folderIdMatch) throw new Error('無效的 Drive 資料夾連結');
    
    rootFolderId.value = folderIdMatch[0];
    await loadFolderContent(rootFolderId.value);
    
  } catch (error) {
    console.error('頁面初始化失敗:', error);
    loadingText.value = `初始化失敗: ${error.message}`;
  } finally {
    isLoading.value = false;
  }
});

async function loadFolderContent(folderId, pathItem = null) {
  isFetchingFiles.value = true;
  selected.value = []; // 切換資料夾時清空選取
  try {
    files.value = await driveStore.fetchFiles(folderId);
    if (pathItem) {
      const existingIndex = currentPath.value.findIndex(p => p.id === pathItem.id);
      if (existingIndex !== -1) {
        currentPath.value.splice(existingIndex + 1);
      } else {
        currentPath.value.push(pathItem);
      }
    } else {
      currentPath.value = [];
    }
  } catch (error) {
    alert(`讀取資料夾內容失敗: ${error.message}`);
  } finally {
    isFetchingFiles.value = false;
  }
}

async function refresh(force = false) {
  isRefreshing.value = true;
  await driveStore.fetchFiles(currentFolderId.value, force);
  files.value = driveStore.cache[currentFolderId.value];
  isRefreshing.value = false;
}

function handleRowClick(event, { item }) {
  if (item.isFolder) {
    loadFolderContent(item.id, { id: item.id, name: item.name });
  } else {
    previewDialog.value = { visible: true, item };
  }
}

watch(breadcrumbs, (newVal) => {
    if (newVal.length > 0) {
        const newFolderId = newVal[newVal.length - 1].data.id;
        if (newFolderId !== currentFolderId.value) {
            loadFolderContent(newFolderId);
        }
    }
}, { deep: true });

// --- Dialog & Action Methods ---
function openDownloadDialog() {
  dialog.value = {
    visible: true,
    type: 'download',
    title: '下載',
    items: selected.value.map(id => files.value.find(f => f.id === id)).filter(Boolean),
    icon: 'mdi-download',
    color: 'blue-darken-2'
  };
}

function openRenameDialog() {
  dialog.value = {
    visible: true,
    type: 'rename',
    title: '加註',
    items: selected.value.map(id => files.value.find(f => f.id === id)).filter(Boolean),
    icon: 'mdi-form-textbox',
    color: 'orange-darken-3'
  };
}

async function confirmDialogAction() {
  const payload = {
    taskType: dialog.value.type,
    items: dialog.value.items.map(i => ({ id: i.id, name: i.name })),
    projectId: props.projectId,
  };
  if (dialog.value.type === 'rename') {
    if (!renameSuffix.value) {
      alert('請選擇一個後綴');
      return;
    }
    payload.suffixOptions = {
      suffix: renameSuffix.value,
      username: username.value
    };
  }
  
  try {
    await driveStore.startTask(payload);
  } catch(error) {
    alert(`啟動任務失敗: ${error.message}`);
  }
  
  dialog.value.visible = false;
}

// --- Context Menu Methods ---
function showContextMenu(event, item) {
  contextMenu.value.visible = false; // 先關閉以觸發更新
  contextMenu.value.item = item;
  contextMenu.value.x = event.clientX;
  contextMenu.value.y = event.clientY;
  // 使用 nextTick 確保 DOM 更新後再顯示
  nextTick(() => {
    contextMenu.value.visible = true;
  });
}

function handleContextAction(action) {
  const item = contextMenu.value.item;
  if (!item) return;

  if(action === 'preview') {
      previewDialog.value = { visible: true, item };
      return;
  }
  
  dialog.value = {
    visible: true,
    type: action,
    title: action === 'download' ? '下載' : '加註',
    items: [item],
    icon: action === 'download' ? 'mdi-download' : 'mdi-form-textbox',
    color: action === 'download' ? 'blue-darken-2' : 'orange-darken-3'
  };
}

// --- Helper & Formatting ---
function formatDateTime(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString('zh-TW', { hour12: false });
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function goHome() {
  router.push({ name: 'Home' });
}
</script>

<style>
.v-data-table__tr:hover {
  cursor: pointer;
}
</style>