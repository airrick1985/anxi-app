<template>
<v-container fluid>
<v-card class="pa-4">
<v-card-title class="d-flex align-center justify-space-between text-h6 text-primary" >
  <span>{{ pageTitle }}</span>
  <div class="d-flex align-center ga-2">


    <v-tooltip text="新增資料欄位" location="bottom">

  <template v-slot:activator="{ props }">
    <v-btn 
      v-bind="props"
      color="black" 
      variant="text" 
      icon="mdi-table-column-plus-after"
      @click="openFieldDefinitionDialog"
    ></v-btn>
  </template>
</v-tooltip>

<v-tooltip text="下載戶別資料" location="bottom">
  <template v-slot:activator="{ props }">
    <v-btn 
      v-bind="props"
      color="black" 
      variant="text" 
      icon="mdi-download"
      @click="exportToExcel"
    ></v-btn>
  </template>
</v-tooltip>

<v-tooltip text="上傳戶別資料" location="bottom">
  <template v-slot:activator="{ props }">
    <v-btn 
      v-bind="props"
      color="black" 
      variant="text" 
      icon="mdi-upload"
      @click="uploadDialog = true"
    ></v-btn>
  </template>
</v-tooltip>
  </div>
</v-card-title>

<v-alert v-if="error" type="error" variant="tonal" class="mb-4" :text="error"></v-alert>

<div v-if="isLoading" class="text-center pa-10">
  <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
  <div class="mt-4">戶別資料載入中...</div>
</div>

<div v-if="!isLoading && !error" style="height: 75vh;">
  <ag-grid-vue
    v-if="hasInitialDataLoaded"
    class="ag-theme-alpine"
    style="width: 100%; height: 100%;"
    :columnDefs="finalColDefs"
    :rowData="rowData"
    :defaultColDef="defaultColDef"
    :sideBar="sideBarConfig"
    :localeText="AG_GRID_LOCALE_TW"
    @grid-ready="onGridReady"
    @cell-value-changed="onCellValueChanged"
    :getRowId="getRowId"
  >
  </ag-grid-vue>
</div>

</v-card>
<v-dialog v-model="uploadDialog" max-width="600px" persistent>
   <v-card>
     <v-card-title class="bg-red-darken-2">
       <span class="text-h5">上傳 Excel 更新戶別資料</span>
     </v-card-title>
     <v-card-text class="pt-4">
       <v-alert
         type="warning"
         color="error"
         variant="tonal"
         class="mb-4"
         title="重要提示"
         text="此操作將根據「文件ID」覆蓋現有資料，或根據「戶別」建立新資料。為避免資料遺失，強烈建議您先下載目前的資料作為備份與範本。"
       ></v-alert>

       <v-file-input
         v-model="uploadedFile"
         label="選擇 Excel 檔案"
         accept=".xlsx, .xls"
         variant="outlined"
         density="compact"
         :loading="isParsing"
          @change="handleFileChange"
         @click:clear="closeUploadDialog(false)"
       ></v-file-input>

       <v-alert
         v-if="uploadMessage"
         :type="uploadMessageType"
         variant="tonal"
         class="mt-4"
         style="white-space: pre-wrap;"
         density="compact"
       >
         {{ uploadMessage }}
       </v-alert>
     </v-card-text>
     <v-card-actions>
       <v-spacer></v-spacer>
       <v-btn color="grey" variant="text" @click="closeUploadDialog(true)">取消</v-btn>
       <v-btn
         color="red"
         variant="flat"
         @click="uploadData"
         :loading="isUploading"
         :disabled="parsedData.length === 0"
       >
         確認上傳
       </v-btn>
     </v-card-actions>
   </v-card>
 </v-dialog>

 <v-dialog v-model="fieldDialog.show" max-width="500px" persistent>
   <v-card>
          <v-form ref="fieldForm" @submit.prevent="handleSaveFieldDefinition">
       <v-card-title class="bg-blue-darken-2">
         <span class="text-h5">新增自訂欄位</span>
       </v-card-title>
       <v-card-text class="pt-4">
         <v-text-field
           v-model="fieldDialog.data.fieldName"
           label="欄位顯示名稱"
           :rules="[v => !!v || '此為必填欄位']"
           required
           variant="outlined"
           density="compact"
         ></v-text-field>

         <v-select
           v-model="fieldDialog.data.fieldType"
           :items="fieldDialogItems"
           label="欄位格式"
           item-title="title"
           item-value="value"
           :rules="[v => !!v || '請選擇一種格式']"
           required
           variant="outlined"
           density="compact"
         ></v-select>

         <v-combobox
           v-if="fieldDialog.data.fieldType === 'select'"
           v-model="fieldDialog.data.options"
           label="請輸入下拉選單的選項 (按 Enter 新增)"
           multiple
           chips
           variant="outlined"
           density="compact"
                      :rules="[v => (v && v.length > 0) || '請至少輸入一個選項']"
           required
         ></v-combobox>

         <v-alert v-if="fieldDialog.error" type="error" variant="tonal" density="compact" class="mt-2">
           {{ fieldDialog.error }}
         </v-alert>

       </v-card-text>
       <v-card-actions>
         <v-spacer></v-spacer>
         <v-btn color="grey" variant="text" @click="fieldDialog.show = false">取消</v-btn>
         <v-btn
           type="submit"
           color="blue"
           variant="flat"
           :loading="fieldDialog.loading"
         >
           儲存
         </v-btn>
       </v-card-actions>
     </v-form>
   </v-card>
 </v-dialog>


 <!-- Customer Message View Dialog -->
 <v-dialog v-model="isMessageDialogVisible" max-width="800px">
    <v-card>
       <v-card-title class="bg-info text-white d-flex justify-space-between align-center">
          <span>戶別 {{ selectedHouseholdUnit }} - 客戶回傳訊息 ({{ selectedHouseholdMessages.length }})</span>
          <v-btn icon="mdi-close" variant="text" color="white" @click="isMessageDialogVisible = false"></v-btn>
       </v-card-title>
       <v-card-text class="pa-0" style="max-height: 80vh; overflow-y: auto; background-color: #f5f5f5;">
          <v-container>
             <v-card v-for="msg in selectedHouseholdMessages" :key="msg.id" class="mb-4" border variant="outlined">
                <v-card-header>
                   <v-card-header-text>
                      <v-card-title class="text-subtitle-1 font-weight-bold text-primary">
                         {{ msg.functionName || '未命名功能' }}
                      </v-card-title>
                      <v-card-subtitle>
                         {{ formatMessageDate(msg.createdAt) }}
                      </v-card-subtitle>
                   </v-card-header-text>
                   <template v-slot:append>
                      <v-chip v-if="msg.status === 'new'" color="error" size="small" class="mr-2">新訊息</v-chip>
                   </template>
                </v-card-header>
                <v-divider></v-divider>
                
                <v-card-text class="pt-3">
                   <!-- Dynamic Data Key-Values -->
                   <v-table density="compact" class="mb-3 border rounded">
                      <tbody>
                         <tr v-for="(value, key) in msg.data" :key="key">
                            <td class="bg-grey-lighten-4 font-weight-bold" style="width: 150px;">{{ getFieldLabel(msg, key) }}</td>
                            <td>{{ value }}</td>
                         </tr>
                      </tbody>
                   </v-table>

                   <!-- Attachments -->
                   <div v-if="msg.attachments && msg.attachments.length > 0">
                      <div class="text-subtitle-2 font-weight-bold mb-1">附件 ({{ msg.attachments.length }})</div>
                      <div class="d-flex flex-wrap gap-2">
                         <v-chip
                            v-for="file in msg.attachments"
                            :key="file.path"
                            prepend-icon="mdi-paperclip"
                            :href="file.url"
                            target="_blank"
                            color="primary"
                            variant="outlined"
                            label
                         >
                            {{ file.name }}
                         </v-chip>
                      </div>
                   </div>
                </v-card-text>
             </v-card>
          </v-container>
       </v-card-text>
    </v-card>
 </v-dialog>

  <v-dialog v-model="isConfirmingSave" width="auto" persistent>
   <v-card>
     <v-card-title class="text-h5">
       ⚠️ 請注意
     </v-card-title>
     <v-card-text>
       新增欄位後不可刪除或修改欄位名稱，確定要繼續嗎？
     </v-card-text>
     <v-card-actions>
       <v-spacer></v-spacer>
       <v-btn color="grey-darken-1" variant="text" @click="isConfirmingSave = false">取消</v-btn>
       <v-btn color="warning" variant="flat" @click="confirmAndSave">確認新增</v-btn>
     </v-card-actions>
   </v-card>
 </v-dialog>


  <v-dialog v-model="isConfirmingDeleteReport" width="auto" persistent>
   <v-card>
     <v-card-title class="text-h5 text-error">
       ⚠️ 確認刪除驗屋報告
     </v-card-title>
     <v-card-text>
       您確定要將戶別 <strong>{{ deleteReportRowData?.unitId }}</strong> 的驗屋報告「{{ deleteReportTarget?.name }}」作廢嗎？<br><br>
       此操作會：<br>
       1. 將 Google Drive 上的資料夾名稱加上(作廢)標記以保留檔案。<br>
       2. 報告將從清單中移除，無法復原。
     </v-card-text>
     <v-card-actions>
       <v-spacer></v-spacer>
       <v-btn color="grey-darken-1" variant="text" @click="isConfirmingDeleteReport = false" :disabled="isDeletingReport">取消</v-btn>
       <v-btn color="error" variant="flat" @click="executeDeleteReport" :loading="isDeletingReport">確認作廢</v-btn>
     </v-card-actions>
   </v-card>
 </v-dialog>

  <v-dialog v-model="isConfirmingMarkDownloaded" width="auto" persistent>
   <v-card>
     <v-card-title class="text-h5 text-success">
       ✅ 標記驗屋報告為已下載
     </v-card-title>
     <v-card-text>
       您確定要將戶別 <strong>{{ markDownloadedRowData?.unitId }}</strong> 的驗屋報告「{{ markDownloadedTarget?.name }}」標記為已下載嗎？<br><br>
       此操作會：<br>
       1. 將 Google Drive 上的檔案加註(已下載)。<br>
       2. LINE小助理將不再提醒未下載<br>
     </v-card-text>
     <v-card-actions>
       <v-spacer></v-spacer>
       <v-btn color="grey-darken-1" variant="text" @click="isConfirmingMarkDownloaded = false" :disabled="isMarkingDownloaded">取消</v-btn>
       <v-btn color="success" variant="flat" @click="executeMarkDownloaded" :loading="isMarkingDownloaded">確認標記</v-btn>
     </v-card-actions>
   </v-card>
 </v-dialog>

 <v-snackbar v-model="snackbar.show" :timeout="2000" :color="snackbar.color">
  {{ snackbar.text }}
</v-snackbar>
</v-container>
</template>


<script setup>
import { ref, onMounted, onUnmounted, computed, reactive, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProjectStore } from '@/store/projectStore';
import { useUserStore } from '@/store/user';
import { listenToAllHouseholds, updateHouseholdData, batchUpdateHouseholds, uploadInspectionHouseholds, listenToFieldDefinitions, saveFieldDefinition, deprecateInspectionReport, markInspectionReportDownloaded } from '@/api';
import * as XLSX from 'xlsx-js-style';
import "ag-grid-community/styles/ag-theme-alpine.css";
import "ag-grid-enterprise";
import { AgGridVue } from "ag-grid-vue3";
import { AG_GRID_LOCALE_TW } from '@/utils/agGridLocale';
import { format } from 'date-fns';
import UrlArrayRenderer from '@/components/grid/UrlArrayRenderer.vue';


// --- Store 和路由 ---
const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();
const userStore = useUserStore(); // Initialize User Store
const projectId = ref(route.params.projectId);

// --- AG Grid 狀態 ---
const gridApi = ref(null);
const rowData = ref([]);
const hasInitialDataLoaded = ref(false); // ✓ 用此旗標控制 Grid 的渲染

// --- 頁面狀態 ---
const isLoading = ref(true);
const error = ref(null);
const snackbar = reactive({ show: false, text: '', color: 'success' });
let unsubscribeHouseholds = null;
let unsubscribeFields = null;

// --- 權限與 Grid 設定 ---
const isAdmin = computed(() => {
  const adminRoles = ['超級管理員', '系統管理員'];
  return userStore.currentUserRoles.some(role => adminRoles.includes(role));
});

const sideBarConfig = ref(true); // Maintain default sidebar as requested, visibility controlled by render

// 上傳功能狀態 ---
const uploadDialog = ref(false);
const uploadedFile = ref(null);// v-file-input v-model 建議使用陣列
const parsedData = ref([]);
const isParsing = ref(false);
const isUploading = ref(false);
const uploadMessage = ref('');
const uploadMessageType = ref('success');

// --- 作廢驗屋報告狀態 ---
const isConfirmingDeleteReport = ref(false);
const isDeletingReport = ref(false);
const deleteReportTarget = ref(null);
const deleteReportRowData = ref(null);

const confirmDeleteReport = (file, rowData) => {
  deleteReportTarget.value = file;
  deleteReportRowData.value = rowData;
  isConfirmingDeleteReport.value = true;
};

const executeDeleteReport = async () => {
  if (!deleteReportTarget.value || !deleteReportRowData.value) return;
  isDeletingReport.value = true;
  
  try {
    const operatorName = userStore.user?.name || '未知使用者';
    const response = await deprecateInspectionReport({
      projectId: projectId.value,
      unitId: deleteReportRowData.value._docId,
      fileUrl: deleteReportTarget.value.url,
      operatorName: operatorName
    });
    
    if (response.status === 'success') {
      snackbar.text = '報告已成功作廢並移除';
      snackbar.color = 'success';
      snackbar.show = true;
    } else {
      throw new Error(response.message || '作廢失敗');
    }
  } catch (err) {
    console.error(err);
    snackbar.text = `作廢報告失敗: ${err.message}`;
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    isDeletingReport.value = false;
    isConfirmingDeleteReport.value = false;
    deleteReportTarget.value = null;
    deleteReportRowData.value = null;
  }
};

// --- 標記已下載狀態 ---
const isConfirmingMarkDownloaded = ref(false);
const isMarkingDownloaded = ref(false);
const markDownloadedTarget = ref(null);
const markDownloadedRowData = ref(null);

const confirmMarkDownloaded = (file, rowData) => {
  markDownloadedTarget.value = file;
  markDownloadedRowData.value = rowData;
  isConfirmingMarkDownloaded.value = true;
};

const executeMarkDownloaded = async () => {
  if (!markDownloadedTarget.value || !markDownloadedRowData.value) return;
  isMarkingDownloaded.value = true;
  
  try {
    const operatorName = userStore.user?.name || '未知使用者';
    let fileUrl = markDownloadedTarget.value.url;
    
    // 如果網址沒有附帶協議，預防性補上
    if (!fileUrl.startsWith('http')) {
        fileUrl = 'https://' + fileUrl;
    }
    
    const response = await markInspectionReportDownloaded({
      projectId: projectId.value,
      unitId: markDownloadedRowData.value._docId,
      fileUrl: fileUrl,
      operatorName: operatorName
    });
    
    if (response.status === 'success') {
      snackbar.text = '報告已成功標記為已下載';
      snackbar.color = 'success';
      snackbar.show = true;
    } else {
      throw new Error(response.message || '標記失敗');
    }
  } catch (err) {
    console.error(err);
    snackbar.text = `標記報告失敗: ${err.message}`;
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    isMarkingDownloaded.value = false;
    isConfirmingMarkDownloaded.value = false;
    markDownloadedTarget.value = null;
    markDownloadedRowData.value = null;
  }
};

// 動態欄位相關狀態 ---
const projectConfig = ref(null); // [新增] 用於查找客戶回傳功能的設定
const customFieldDefs = ref([]);
const hasFieldsLoaded = ref(false);
const fieldDialog = reactive({
  show: false,
  loading: false,
  error: '',
  data: {
    fieldName: '',
    fieldType: 'checkbox',
    options: []
  }
});

// 1. 新增一個靜態陣列來定義選項，取代 fieldTypeLabels
const fieldDialogItems = [
  { value: 'checkbox', title: '核取/開關' },
  { value: 'text', title: '純文字' },
  { value: 'select', title: '下拉選單' },
];

// 用於表單驗證與確認對話框
const fieldForm = ref(null);
const isConfirmingSave = ref(false);



// --- 計算屬性 ---
const projectName = computed(() => projectStore.idToNameMap[projectId.value] || '讀取中...');
const pageTitle = computed(() => `${projectName.value} - 戶別資料總表`);
const getRowId = (params) => params.data._docId;

// --- AG Grid 設定 ---
const defaultColDef = {
  sortable: true,
  resizable: true,
  filter: true,
  floatingFilter: true,
  flex: 1,
  minWidth: 150,
};
const dateFormatter = (params) => {
  if (!params.value) return '';
  try { return format(new Date(params.value), 'yyyy/MM/dd'); }
  catch (e) { return ''; }
};
const linkRenderer = (params) => {
  if (!params.value) return '<span>-</span>';
  // 將文字替換為 Material Design Icon 的 HTML 標籤
  return `<a href="${params.value}" target="_blank" rel="noopener noreferrer" style="color: #1976D2; font-size: 1.2rem; text-decoration: none;">
            <i class="mdi mdi-folder"></i>
          </a>`;
};
const SwitchHeaderRenderer = {
  template: `
    <div class="d-flex flex-column align-center justify-center w-100 h-100">
      <span>{{ params.displayName }}</span>
      <div class="d-flex align-center mt-n2">
        <span class="mr-1 text-caption">全選</span>
        <v-switch
          v-model="checked"
          :indeterminate="indeterminate"
          @update:modelValue="onToggle"
          color="success"
          hide-details
          density="compact"
        ></v-switch>
      </div>
    </div>
  `,
  data() {
    return {
      checked: false,
      indeterminate: false,
    };
  },
  methods: {
    async onToggle(newValue) {
      const field = this.params.column.getColDef().field;
      const updates = [];
      
      this.params.api.forEachNode(node => {
        if (node.data) {
          updates.push({
            docId: node.data._docId,
            data: { [field]: newValue }
          });
        }
      });

      if (updates.length > 0) {
        try {
          await batchUpdateHouseholds(updates);
          this.params.api.forEachNode(node => {
            node.setDataValue(field, newValue);
          });
          this.updateHeaderState();
        } catch (e) {
          console.error('批次更新失敗', e);
        }
      }
    },
    updateHeaderState() {
      const field = this.params.column.getColDef().field;
      let trueCount = 0;
      let totalCount = 0;
      this.params.api.forEachNode(node => {
        if (node.data) {
          if (node.data[field] === true) {
            trueCount++;
          }
          totalCount++;
        }
      });

      if (totalCount === 0) {
        this.checked = false;
        this.indeterminate = false;
      } else if (trueCount === totalCount) {
        this.checked = true;
        this.indeterminate = false;
      } else if (trueCount === 0) {
        this.checked = false;
        this.indeterminate = false;
      } else {
        this.checked = false;
        this.indeterminate = true;
      }
    },
  },
  onModelUpdated() {
    this.updateHeaderState();
  },
  mounted() {
    this.params.api.addEventListener('modelUpdated', this.onModelUpdated);
    this.updateHeaderState();
  },
  beforeUnmount() {
    this.params.api.removeEventListener('modelUpdated', this.onModelUpdated);
  }
};

// v-switch 顯示組件 (可直接互動)
const SwitchRenderer = {
  template: `
    <div class="d-flex justify-center align-center w-100 h-100" @click.stop>
      <v-switch
        :model-value="params.value"
        @update:modelValue="toggleValue"
        color="success"
        inset
        hide-details
        density="compact"
      ></v-switch>
    </div>
  `,
  methods: {
    // 當 switch 被點擊時，直接更新 AG Grid 的資料
    toggleValue(newValue) {
      // 呼叫 AG Grid 的 API 來設定新值，這會觸發 onCellValueChanged
      this.params.setValue(newValue);
    },
  },
};

// --- Customer Message Renderer ---
const CustomerMessageRenderer = {
  template: `
    <div class="d-flex justify-center align-center h-100">
       <v-btn v-if="messageCount > 0"
          color="info" size="small" variant="tonal"
          @click.stop="onClick"
          class="px-2"
          style="min-width: 60px;"
       >
          {{ messageCount }} 則
       </v-btn>
       <span v-else class="text-grey-lighten-1">-</span>
    </div>
  `,
  setup(props) {
     const messageCount = computed(() => {
        const msgs = props.params.value;
        return Array.isArray(msgs) ? msgs.length : 0;
     });
     const onClick = () => {
        if (props.params.colDef.cellRendererParams && props.params.colDef.cellRendererParams.onClick) {
           props.params.colDef.cellRendererParams.onClick(props.params.data);
        }
     };
     return { messageCount, onClick };
  }
};

// --- Customer Message Dialog Logic ---
const isMessageDialogVisible = ref(false);
const selectedHouseholdMessages = ref([]); // Array of messages
const selectedHouseholdUnit = ref('');

const openMessageDialog = (householdData) => {
   const msgs = householdData.customerMessages || [];
   if (msgs.length === 0) return;
   
   // Sort by date desc
   selectedHouseholdMessages.value = [...msgs].sort((a, b) => {
      const tA = a.createdAt?.seconds || 0;
      const tB = b.createdAt?.seconds || 0;
      return tB - tA;
   });
   selectedHouseholdUnit.value = householdData.unitId;
   isMessageDialogVisible.value = true;
};

const formatMessageDate = (timestamp) => {
   if (!timestamp) return '';
   // Firestore Timestamp to JS Date
   const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
   return format(date, 'yyyy/MM/dd HH:mm');
};

// --- 動態欄位相關方法 ---
// [新增] 取得欄位顯示名稱 (將 ID 轉為 Label)
const getFieldLabel = (msg, fieldKey) => {
   // 如果還沒載入設定，直接回傳 key
   if (!projectConfig.value || !projectConfig.value.customerMessageConfigs) return fieldKey;
   
   // 1. 找到對應的功能設定
   const config = projectConfig.value.customerMessageConfigs.find(c => c.id === msg.configId);
   if (!config || !config.customFields) return fieldKey;
   
   // 2. 找到對應的欄位定義
   const field = config.customFields.find(f => f.id === fieldKey);
   return field ? field.label : fieldKey;
};

const baseColDefs = computed(() => {
  const isUserAdmin = isAdmin.value;

  const cols = [
    { headerName: '預約系統開關', field: 'showInMenu', pinned: 'left', width: 180, editable: true, cellRenderer: SwitchRenderer, headerComponent: SwitchHeaderRenderer },
    { headerName: '交屋', field: '交屋', pinned: 'left', width: 180, editable: true, cellRenderer: SwitchRenderer, headerComponent: SwitchHeaderRenderer },
    { headerName: '棟別', field: 'building', width: 100, enableRowGroup: true },
    { headerName: '戶號', field: 'unitId', pinned: 'left', width: 120, filter: 'agTextColumnFilter' },
    { headerName: '目前狀態', field: 'currentStatus', width: 130, editable: true },
    { headerName: '買方姓名', field: 'buyerName', editable: true },
     { headerName: '備註', field: 'remarks', editable: true, minWidth: 250 },
    { headerName: '買方電話', field: 'buyerPhone', editable: true, minWidth: 160 },
    { headerName: '買方Email', field: 'buyerEmail', editable: true, minWidth: 200 },
    { headerName: '買方身分證', field: 'buyerIdNumber', editable: true },
    { headerName: '車位', field: 'parkingLots', editable: true },
    { headerName: '門牌', field: 'address', editable: true, minWidth: 250 },
    { headerName: '撥款日', field: 'appropriationDate', filter: 'agDateColumnFilter', valueFormatter: dateFormatter, editable: true, cellEditor: 'agDateCellEditor' },
    { headerName: '銀行', field: 'bank', editable: true },
    { headerName: '初驗批次', field: 'initialInspectionBatch', editable: true },
    { headerName: '初驗日期', field: 'initialInspectionDate', filter: 'agDateColumnFilter', valueFormatter: dateFormatter },
    { headerName: '初驗方式', field: 'initialInspectionMethod' },
    { headerName: '複驗批次', field: 'reInspectionBatch', editable: true },
    { headerName: '複驗日期', field: 'reInspectionDate', filter: 'agDateColumnFilter', valueFormatter: dateFormatter },
    { headerName: '複驗方式', field: 'reInspectionMethod' },
    { headerName: '初驗報告上傳開關', field: 'initialReportUploadSwitch', editable: true, width: 180, cellRenderer: SwitchRenderer, headerComponent: SwitchHeaderRenderer },
    { headerName: '複驗報告上傳開關', field: 'reInspectionReportUploadSwitch', editable: true, width: 180, cellRenderer: SwitchRenderer, headerComponent: SwitchHeaderRenderer },
     { headerName: '驗屋報告', field: 'inspectionReportUrl', cellRenderer: UrlArrayRenderer, minWidth: 500, flex: 3, editable: false, cellRendererParams: { onDelete: confirmDeleteReport, onDownloadMark: confirmMarkDownloaded } } ,
    { headerName: '驗屋報告資料夾', field: 'inspectionReportFolderUrl', cellRenderer: linkRenderer, minWidth: 150, flex: 1.5, editable: false },
    { headerName: '驗屋文件', field: 'inspectionDocsUrl', cellRenderer: linkRenderer, minWidth: 150, flex: 1.5, editable: false },
    { 
       headerName: '客戶回傳', 
       field: 'customerMessages', 
       width: 130, 
       cellRenderer: CustomerMessageRenderer,
       cellRendererParams: { onClick: (data) => openMessageDialog(data) },
       editable: false
    },

    { headerName: '允許重複預約', field: 'allowMultipleBookings', width: 140, editable: true, cellRenderer: SwitchRenderer, headerComponent: SwitchHeaderRenderer },
  ];

  return cols;
});

// 2. 根據從 Firestore 獲取的自訂欄位定義，動態生成 AG-Grid 欄位
const dynamicColDefs = computed(() => {
  return customFieldDefs.value.map(def => {
    const colDef = {
      headerName: def.fieldName,
      field: def.fieldName, // 直接使用中文欄位名作為 field key
      editable: true,
      valueGetter: params => { // 「延遲更新」策略核心
        if (params.data && params.data.hasOwnProperty(def.fieldName)) {
          return params.data[def.fieldName];
        }
        return def.fieldType === 'checkbox' ? false : ""; // 提供預設值
      }
    };

    switch (def.fieldType) {
      case 'checkbox':
        colDef.cellRenderer = SwitchRenderer;
        break;
      case 'select':
        colDef.cellEditor = 'agSelectCellEditor';
        colDef.cellEditorParams = {
          values: def.options || [],
        };
        break;
      case 'text':
      default:
        // 使用預設的文字編輯器
        break;
    }
    return colDef;
  });
});

// 3. 組合基礎欄位和動態欄位，成為最終要在 Grid 中顯示的欄位
const finalColDefs = computed(() => {
  return [...baseColDefs.value, ...dynamicColDefs.value];
});


// --- 匯出 Excel 功能 ---
const exportToExcel = () => {
  // 1. 從 colDefs 提取欄位和標頭，並在開頭加入 _docId
   const exportFields = ['_docId', ...finalColDefs.value.map(def => def.field)];
   const chineseHeaders = ['文件ID', ...finalColDefs.value.map(def => def.headerName)];


  // 2. 排序資料
  const sortedItems = [...rowData.value].sort((a, b) => {
    const buildingCompare = String(a.building).localeCompare(String(b.building), 'zh-TW', { numeric: true });
    if (buildingCompare !== 0) return buildingCompare;
    return String(a.unitId).localeCompare(String(b.unitId), 'zh-TW', { numeric: true });
  });

  // 3. 轉換資料格式
  const dataAsArray = sortedItems.map(item => {
    return exportFields.map(key => {
      const value = item[key];
      if (value instanceof Date) {
        return format(value, 'yyyy/MM/dd');
      }
      //  修正：確保 item[key] 存在才進行判斷
      if (typeof value === 'boolean') {
        return value ? 'TRUE' : 'FALSE';
      }
      if (value && typeof value.toDate === 'function') {
        return format(value.toDate(), 'yyyy/MM/dd');
      }
      return value ?? ''; // 使用空值合併運算符處理 null 和 undefined
    });
  });

  // 4. 建立 Excel 工作表
  const warningRow = ['注意：為確保資料能正確重新上傳，請勿修改第二列的標頭名稱 (特別是第一欄的 文件ID)。'];
  const dataWithHeader = [warningRow, chineseHeaders, ...dataAsArray];
  const ws = XLSX.utils.aoa_to_sheet(dataWithHeader);

  // 5. 設定樣式與格式
  const warningStyle = { font: { color: { rgb: "FFFF0000" }, bold: true }, fill: { fgColor: { rgb: "FFFFFF00" } } };
  ws['A1'].s = warningStyle;
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: exportFields.length - 1 } });

  const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: "FFD3D3D3" } } };
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_cell({ r: 1, c: C });
    if(ws[address]) ws[address].s = headerStyle;
  }
  ws['!freeze'] = { ySplit: 2 };

  // 6. 產生並下載檔案
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '戶別資料總表');
  const exportFileName = `${projectName.value || '建案'}_戶別資料總表_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, exportFileName);
};

//  --- START: 上傳功能方法 ---

// 關閉並重置上傳對話框
const closeUploadDialog = (isManualClose = true) => {
  uploadDialog.value = false;
  if (isManualClose) {
      uploadedFile.value = null; 
      parsedData.value = [];
      uploadMessage.value = '';
  }
};


// 處理檔案選擇與解析
// 處理檔案選擇與解析
const handleFileChange = () => {
  console.log('handleFileChange triggered.');
  uploadMessage.value = '';
  const file = uploadedFile.value;
  if (!file) {
    parsedData.value = [];
    return;
  }
  isParsing.value = true;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const dataAsArrays = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 1 });

      if (dataAsArrays.length < 1) {
        throw new Error(`檔案缺少標頭列。`);
      }

      // 建立標頭對應表
      const uploadedHeaders = dataAsArrays[0].map(h => String(h || '').trim());
       const requiredHeaders = ['文件ID', ...finalColDefs.value.map(def => def.headerName)];
      const headerMap = new Map();
       finalColDefs.value.forEach(def => headerMap.set(def.headerName, def.field));
      headerMap.set('文件ID', '_docId');

      // 驗證標頭
      const missingHeaders = requiredHeaders.filter(h => !uploadedHeaders.includes(h));
      if (missingHeaders.length > 0) {
        throw new Error(`檔案標頭不符，缺少必要欄位: \n${missingHeaders.join('、')}`);
      }

      const dataRows = dataAsArrays.slice(1);
      const nonEmptyRows = dataRows.filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''));

      const jsonDataWithEnglishKeys = nonEmptyRows.map(rowArray => {
        const newRow = {};
        uploadedHeaders.forEach((header, index) => {
          const key = headerMap.get(header);
          if (key) {
            let val = rowArray[index] ?? null;

            if (key === 'allowMultipleBookings' || key === 'showInMenu' || key === 'initialReportUploadSwitch' || key === 'reInspectionReportUploadSwitch') {
              if (typeof val === 'string') {
                const upperVal = val.toUpperCase().trim();
                if (upperVal === 'TRUE') val = true;
                if (upperVal === 'FALSE') val = false;
              }
            }

            if (key === '_docId' && (val === null || val === undefined || val === '')) {
                 newRow[key] = null;
            } else {
                 newRow[key] = val;
            }
          }
        });
        if (!newRow._docId && !newRow.unitId) {
            throw new Error("資料驗證失敗：新增的資料行必須包含『戶號』。請檢查上傳的檔案。");
        }
        return newRow;
      });

      parsedData.value = jsonDataWithEnglishKeys;
      uploadMessageType.value = 'success';
      uploadMessage.value = `成功解析 ${jsonDataWithEnglishKeys.length} 筆資料，可以開始上傳。`;
    } catch (err) {
      uploadMessageType.value = 'error';
      uploadMessage.value = err.message || '解析檔案失敗，請使用系統匯出的範本。';
      parsedData.value = [];
    } finally {
      isParsing.value = false;
    }
  };
  reader.readAsArrayBuffer(file);
};

// 執行上傳
const uploadData = async () => {
  if (parsedData.value.length === 0) {
    uploadMessageType.value = 'warning';
    uploadMessage.value = '沒有可上傳的資料。';
    return;
  }
  isUploading.value = true;
  uploadMessage.value = '';
  try {
    const result = await uploadInspectionHouseholds(projectId.value, parsedData.value);
    if (result.status === 'success') {
      uploadMessageType.value = 'success';
      uploadMessage.value = result.message || '戶別資料已成功上傳更新！';
      setTimeout(() => closeUploadDialog(true), 2000);
      snackbar.text = '資料上傳成功！畫面將自動更新。';
      snackbar.color = 'success';
      snackbar.show = true;
    } else {
      throw new Error(result.message || '發生未知錯誤');
    }
  } catch (err) {
    uploadMessageType.value = 'error';
    uploadMessage.value = `上傳失敗: ${err.message}`;
  } finally {
    isUploading.value = false;
  }
};

// 「動態欄位」相關方法 ---
const openFieldDefinitionDialog = () => {
  // 重置對話框狀態
  fieldDialog.data.fieldName = '';
  fieldDialog.data.fieldType = 'checkbox';
  fieldDialog.data.options = [];
  fieldDialog.error = '';
  fieldDialog.loading = false;
  fieldDialog.show = true;
};

const handleSaveFieldDefinition = async () => {
  if (!fieldForm.value) return;

  const { valid } = await fieldForm.value.validate();
  if (valid) {
    // 表單驗證通過後，開啟確認對話框
    isConfirmingSave.value = true;
  }
};

 // 3. 新增一個函式，用於處理使用者確認後真正的儲存邏輯
const confirmAndSave = async () => {
  isConfirmingSave.value = false; // 先關閉確認框
  fieldDialog.loading = true;
  fieldDialog.error = '';
  
  try {
    const payload = {
      ...fieldDialog.data,
      projectId: projectId.value,
      collectionName: 'households',
      order: 100 + (customFieldDefs.value.length || 0),
    };
    const result = await saveFieldDefinition(payload);

    if (result.status === 'success') {
      snackbar.text = result.message;
      snackbar.color = 'success';
      snackbar.show = true;
      fieldDialog.show = false; // 成功後關閉主對話框
    } else {
      throw new Error(result.message);
    }
  } catch (err) {
    fieldDialog.error = err.message || '儲存失敗，請重試。';
  } finally {
    fieldDialog.loading = false;
  }
};


// ✓ 【修改】簡化 onGridReady，只用來獲取 gridApi
const onGridReady = (params) => {
  console.log("AG Grid 已就緒");
  gridApi.value = params.api;
};

// 當儲存格資料被修改時觸發
async function onCellValueChanged(event) {
  // ✓ 【新增】最重要的偵錯日誌，用來確認此事件是否有被觸發
  console.log('onCellValueChanged 事件已觸發!', event);
  const { data, colDef, newValue, oldValue } = event;
  const field = colDef.field;
  if (oldValue === newValue) return;

  if (!data || !data._docId) {
    snackbar.text = `更新失敗：內部錯誤，找不到行資料 ID。`;
    snackbar.color = 'error';
    snackbar.show = true;
    return;
  }
  const householdDocId = data._docId;
  const updatePayload = { [field]: newValue };
  try {
    await updateHouseholdData(householdDocId, updatePayload);
    snackbar.text = `戶別 [${data.unitId}] 的 [${colDef.headerName}] 已更新成功！`;
    snackbar.color = 'success';
    snackbar.show = true;
  } catch (err) {
    console.error("更新戶別資料時發生錯誤:", err);
    snackbar.text = `更新失敗: ${err.message}`;
    snackbar.color = 'error';
     snackbar.show = true;
    // 更新失敗時，讓監聽器自動從 Firestore 把值還原回來，無需手動操作
  }
}

// 修改生命週期鉤子以載入兩種資料 ---
onMounted(async () => {
  if (projectId.value) {
    await projectStore.fetchProjects();

    // [新增] 載入專案設定以取得客戶回傳功能的欄位定義
    try {
      projectConfig.value = await projectStore.fetchProjectSettings(projectId.value);
    } catch (e) {
      console.error("Failed to load project settings:", e);
    }

    // 1. 監聽戶別資料
    unsubscribeHouseholds = listenToAllHouseholds(
      projectId.value,
      (households) => {
        console.log('接收到 Firestore 戶別資料更新...');
        rowData.value = households;
      },
      (err) => {
        error.value = `戶別資料監聽失敗: ${err.message}`;
      }
    );

    // 2. 監聽自訂欄位定義
    unsubscribeFields = listenToFieldDefinitions(
      projectId.value,
      'households',
      (definitions) => {
        console.log('接收到 Firestore 欄位定義更新...');
        customFieldDefs.value = definitions;
        if (!hasFieldsLoaded.value) hasFieldsLoaded.value = true;
      },
      (err) => {
        error.value = `欄位定義監聽失敗: ${err.message}`;
      }
    );


  } else {
    error.value = "未提供建案 ID";
    isLoading.value = false;
  }
});

// 監聽 isLoading 狀態，當所有資料都載入完畢時才停止
watch([rowData, hasFieldsLoaded], ([newRowData, newFieldsLoaded]) => {
  if (newRowData.length > 0 && newFieldsLoaded && !hasInitialDataLoaded.value) {
    hasInitialDataLoaded.value = true;
    isLoading.value = false;
  } else if (newRowData.length === 0 && newFieldsLoaded && isLoading.value) {
    // 處理沒有戶別資料但欄位定義已載入的情況
    hasInitialDataLoaded.value = true;
    isLoading.value = false;
  }
});


onUnmounted(() => {
  if (unsubscribeHouseholds) {
    console.log('停止監聽戶別總表');
    unsubscribeHouseholds();
  }
  if (unsubscribeFields) {
    console.log('停止監聽欄位定義');
    unsubscribeFields();
  }

});

</script>