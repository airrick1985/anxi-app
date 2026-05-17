<template>
  <v-card class="d-flex flex-column" style="height: 100vh; overflow: hidden;">
    <v-card-title class="d-flex align-center pe-2 flex-shrink-0">
       <template v-if="!mdAndUp && isSearching">
        <v-text-field
          v-model="search"
          density="compact"
          placeholder="搜尋 (可搜號碼、戶別、買方...)"
          prepend-inner-icon="mdi-arrow-left"
          @click:prepend-inner="isSearching = false"
          variant="solo-filled"
          autofocus
          flat
          hide-details
          single-line
        ></v-text-field>
      </template>
      
       <template v-else>
        <v-btn @click="goToSalesControlSystem" variant="outlined" prepend-icon="mdi-arrow-left" class="mr-4">
            返回銷控系統
          </v-btn>
         
        <v-icon icon="mdi-car-cog"></v-icon> &nbsp;
        <span class="font-weight-bold text-primary">{{ projectName }}</span>
        <span class="mx-2 d-none d-sm-inline">|</span>
        <span class="d-none d-sm-inline">車位銷控管理</span>

        <v-spacer></v-spacer>

        <template v-if="mdAndUp">
           <v-text-field
            v-model="search"
            density="compact"
            label="搜尋 (可搜號碼、戶別、買方...)"
            prepend-inner-icon="mdi-magnify"
            variant="solo-filled"
            flat
            hide-details
            single-line
            class="ms-4"
            style="max-width: 350px;"
          ></v-text-field>
        <v-tooltip location="bottom">
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            color="black"
            variant="text"
            icon="mdi-map-legend"
            class="me-2"
            @click="goToFloorplanManager"
          ></v-btn>
        </template>
        <span>車位圖管理</span>
      </v-tooltip>
      
      <v-tooltip location="bottom">
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            color="black"
            variant="text"
            icon="mdi-tray-arrow-down"
            class="me-2"
            @click="exportToExcel"
          ></v-btn>
        </template>
        <span>下載車位EXCEL資料</span>
      </v-tooltip>

     
      <v-tooltip location="bottom">
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            color="black"
            variant="text"
            icon="mdi-tray-arrow-up"
            @click="uploadDialog = true"
          ></v-btn>
        </template>
        <span>上傳車位EXCEL資料</span>
      </v-tooltip>

       <v-tooltip location="bottom">
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            v-if="isSystemAdmin"
            color="black"
            variant="text"
            icon="mdi-file-excel-outline"
            class="me-2"
            @click="exportAdminExcel"
           
          ></v-btn>
        </template>
        <span>匯出EXCEL(限系管)</span>
      </v-tooltip>
   
        </template>

        <template v-else>
          <!-- <v-btn icon="mdi-magnify" variant="text" @click="isSearching = true"></v-btn> -->
          <v-menu location="bottom end">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="mdi-dots-vertical" variant="text"></v-btn>
            </template>
            <v-list density="compact">
              <v-list-item @click="exportToExcel">
                <template v-slot:prepend>
                  <v-icon icon="mdi-file-excel" color="teal"></v-icon>
                </template>
                <v-list-item-title>匯出 EXCEL</v-list-item-title>
              </v-list-item>
              <v-list-item v-if="isSystemAdmin" @click="exportAdminExcel">
                <template v-slot:prepend>
                  <v-icon icon="mdi-file-excel-outline" color="orange"></v-icon>
                </template>
                <v-list-item-title>匯出EXCEL(管理員)</v-list-item-title>
              </v-list-item>
              <v-list-item @click="uploadDialog = true">
                <template v-slot:prepend>
                  <v-icon icon="mdi-upload" color="red-darken-2"></v-icon>
                </template>
                <v-list-item-title>上傳車位資料</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>
        
        
      </template>
    </v-card-title>

    <v-divider></v-divider>
    
    <div class="table-container flex-grow-1 pa-10">
      <v-data-table
         v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items="allItems"
        :search="search"
        :loading="loading"
        class="elevation-1"
        item-value="docId"
        density="compact"
        hover
        :sort-by="[{ key: 'number', order: 'asc' }]"
        fixed-header
        height="calc(85vh - 60px)" 
        items-per-page-text="每頁數量："
        :page-text="'{0}-{1} 共 {2} 車'"
        :items-per-page-options="[{value: 10, title: '10'}, {value: 25, title: '25'}, {value: 50, title: '50'},{value: 100, title: '100'}, {value: -1, title: '全部'}]"
      >
        <template v-slot:item.price_list="{ value }">
          {{ formatPrice(value) }}
        </template>
        <template v-slot:item.price_floor="{ value }">
          {{ formatPrice(value) }}
        </template>
        <template v-slot:item.price_transaction="{ value }">
          {{ formatPrice(value) }}
        </template>
        <template v-slot:item.status_backend="{ value }">
          <v-chip :color="getStatusColor(value)" size="small">{{ value || '可售' }}</v-chip>
        </template>
        <template v-slot:item.actions="{ item }">
          <v-icon size="small" @click="editItem(item)">mdi-pencil</v-icon>
        </template>
      </v-data-table>
    </div>

    <!-- Mobile Floating Search Bar -->
    <div v-if="!mdAndUp" class="floating-search-container">
      <v-slide-y-reverse-transition>
        <v-text-field
          v-show="isSearching"
          v-model="search"
          placeholder="搜尋車位..."
          variant="solo"
          rounded="pill"
          density="default"
          hide-details
          prepend-inner-icon="mdi-magnify"
          clearable
          class="floating-search-field"
        >
          <template v-slot:append-inner>
            <v-btn icon="mdi-close" variant="text" size="small" @click="isSearching = false"></v-btn>
          </template>
        </v-text-field>
      </v-slide-y-reverse-transition>

      <v-fab
        v-show="!isSearching"
        icon="mdi-magnify"
        location="bottom end"
        size="large"
        app
        appear
        @click="isSearching = true"
      ></v-fab>
    </div>

     <v-dialog v-model="dialog" max-width="700px" persistent>
      <v-card>
        <v-card-title class="bg-primary">
          <span class="text-h5">編輯車位資訊 ({{ editedItem.spotId }})</span>
        </v-card-title>

        <v-card-text class="pt-4">
          <v-container>
            <v-row>
              <v-col cols="12" sm="6">
                <div class="form-section-title">基本資料</div>
                <v-text-field v-model="editedItem.spotId" label="車位編號" readonly variant="outlined" density="compact" class="readonly-field"></v-text-field>
                <v-combobox v-model="editedItem.type" :items="['法定', '增設', '獎勵']" label="車位類型 (法定/增設...)" variant="outlined" density="compact" clearable></v-combobox>
                <v-combobox v-model="editedItem.type2" :items="['坡道平面', '坡道機械', '升降平面', '升降機械', '機械平面', '機械升降', '塔式車位']" label="車位形式 (坡平/機升...)" variant="outlined" density="compact" clearable></v-combobox>
                <v-text-field v-model="editedItem.size" label="車位尺寸"  variant="outlined" density="compact" ></v-text-field>
                <v-text-field v-model.number="editedItem.area" label="車位面積" suffix="m²" type="number" step="0.01" min="0" variant="outlined" density="compact"></v-text-field>
                <v-text-field v-model.number="editedItem.area_ping" label="車位面積" suffix="坪" type="number" step="0.01" min="0" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="form-section-title">價格資訊</div>
                <v-text-field v-model.number="editedItem.price_list" label="車位表價" type="number"  variant="outlined" density="compact" ></v-text-field>
                <v-text-field v-model.number="editedItem.price_floor" label="車位底價" type="number"  variant="outlined" density="compact" ></v-text-field>
                <v-text-field v-model.number="editedItem.price_transaction" label="車位成交價" type="number" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-divider class="my-2"></v-divider>
                <div class="form-section-title">銷控資訊</div>
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field v-model="editedItem.buyerUnitId" label="購買戶別" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field v-model="editedItem.buyerName" label="買方姓名" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field v-model="editedItem.salesperson" label="銷售人員" variant="outlined" density="compact"></v-text-field>
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-select
                  v-model="editedItem.status"
                  :items="['已售']"
                  label="銷控狀態 (報價系統)"
                  variant="outlined"
                  density="compact"
                  readonly
                  class="readonly-field"
                  hint="此欄位會根據後台狀態自動變更"
                  persistent-hint
                ></v-select>
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="editedItem.status_backend"
                  :items="backendStatusOptions"
                  label="銷控後台狀態"
                  variant="outlined"
                  density="compact"
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="editedItem.remarks" label="備註" variant="outlined" rows="3"></v-textarea>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="close">取消</v-btn>
          <v-btn color="primary" variant="flat" @click="saveItem" :loading="isSaving">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <v-dialog v-model="uploadDialog" max-width="600px" persistent>
        <v-card>
            <v-card-title class="bg-red-darken-2">
                <span class="text-h5">上傳 Excel 更新車位資料</span>
            </v-card-title>
            <v-card-text class="pt-4">

                <v-alert
                  type="warning"
                  color="error"
                  variant="tonal"
                  class="mb-4"
                  title="重要提示"
                  text="上傳的 Excel 將會根據「車位編號」覆蓋現有資料。為避免資料遺失，強烈建議您先匯出目前的資料作為備份。"
                ></v-alert>

                <v-btn 
                  color="teal" 
                  @click="exportToExcel" 
                  block 
                  class="mb-6"
                  prepend-icon="mdi-download"
                >
                  匯出目前車位資料 (備份)
                </v-btn>

                <v-file-input
                    v-model="uploadedFile"
                    label="選擇 Excel 檔案"
                    accept=".xlsx, .xls"
                    variant="outlined"
                    density="compact"
                    :loading="isParsing"
                    @change="handleFileChange"
                ></v-file-input>

             <v-alert
             v-if="uploadMessage"
             :type="uploadMessageType"
             variant="tonal"
             class="mt-4 pre-wrap-alert" 
             density="compact"
           
           >
             {{ uploadMessage }}
           </v-alert>


            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="grey" variant="text" @click="closeUploadDialog">取消</v-btn>
                <v-btn 
                  color="error" 
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

  </v-card>
</template>

<script setup>
import { useDisplay } from 'vuetify';
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router'; // 引入 useRoute
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
import { useToast } from 'vue-toastification';
import { listenToParkingLots, updateParkingLot, uploadParkingLots } from '@/api';
import * as XLSX from 'xlsx-js-style';

// 接收 projectId 作為 prop
const props = defineProps({
  projectId: {
    type: String,
    required: true
  }
});

const router = useRouter();
// const emit = defineEmits(['close']); // 不再需要 emit
const { mdAndUp } = useDisplay();
const isSearching = ref(false);
const userStore = useUserStore();
const projectStore = useProjectStore(); 
const toast = useToast();

//  =================================================================
// /  1.【核心修改】建立唯一的標頭定義來源 (Single Source of Truth)
//  =================================================================
const COLUMN_DEFINITIONS = [
    { key: 'floor', title: '樓層' },
     { 
        key: 'number', 
        title: '號碼',
        // 【新增】自訂排序函式，啟用數字感知排序 (Natural Sort)
        sort: (a, b) => String(a ?? '').localeCompare(String(b ?? ''), 'zh-TW', { numeric: true, sensitivity: 'base' })
    },
    { key: 'spotId', title: '車位編號' },
    { key: 'type', title: '車位類型' },
    { key: 'type2', title: '車位形式' },
    { key: 'size', title: '車位尺寸' },
    { key: 'area', title: '車位面積(m²)', align: 'end' },
    { key: 'area_ping', title: '車位面積_坪', align: 'end' },
    { key: 'price_list', title: '車位表價', align: 'end' },
    { key: 'price_floor', title: '車位底價', align: 'end' },   
    { key: 'price_transaction', title: '車位成交價', align: 'end' },
    { key: 'status_backend', title: '銷控後台狀態' },
    { key: 'status', title: '銷控狀態(報價系統)' },
    { key: 'buyerUnitId', title: '購買戶別' },
    { key: 'buyerName', title: '買方姓名' },
    { key: 'salesperson', title: '銷售人員' },
    { key: 'remarks', title: '備註', cellClass: 'text-truncate' },
    { key: 'actions', title: '操作', sortable: false, width: '80px', align: 'center', exportable: false },
];

//  =================================================================
// /  2. 從唯一定義來源，動態產生所有需要的變數
//  =================================================================

// 用於 v-data-table 的標頭
const headers = computed(() => COLUMN_DEFINITIONS);

// 過濾掉不需匯出/匯入的欄位 (例如 "操作")
const exportableColumns = COLUMN_DEFINITIONS.filter(c => c.exportable !== false);

// 用於中英文轉換的 mapping 物件
const fieldMapping = computed(() => Object.fromEntries(
    exportableColumns.map(col => [col.key, col.title])
));

// 用於匯出的中文標頭陣列
const chineseHeaders = computed(() => exportableColumns.map(c => c.title));

// 用於匯出的資料排序鍵名陣列
const exportOrder = computed(() => exportableColumns.map(c => c.key));


const projectName = computed(() => {
  return projectStore.idToNameMap[props.projectId] || '載入中...';
});

// 檢查是否為系統管理員或超級管理員
const isSystemAdmin = computed(() => {
  return userStore.user?.roles?.includes('系統管理員') || 
         userStore.user?.roles?.includes('超級管理員');
});

const search = ref('');
const itemsPerPage = ref(-1);
const loading = ref(true);
const allItems = ref([]);
let unsubscribe = null;
const dialog = ref(false);
const isSaving = ref(false);
const editedItem = ref({});
const originalItem = ref({});
const uploadDialog = ref(false);
const uploadedFile = ref(null);
const parsedData = ref([]);
const isParsing = ref(false);
const isUploading = ref(false);
const uploadMessage = ref('');
const uploadMessageType = ref('success');
const backendStatusOptions = ['小訂', '補足', '簽約', '保留'];


// =================================================================
// / 生命週期鉤子
// =================================================================
onMounted(() => {
  projectStore.fetchProjects();
  if (props.projectId) {
    loading.value = true;
    unsubscribe = listenToParkingLots(
      props.projectId,
      (data) => {
        allItems.value = data;
        if (loading.value) loading.value = false;
      },
      (error) => {
        toast.error(`讀取車位資料失敗: ${error.message}`);
        loading.value = false;
      }
    );
  } else {
    toast.error('無法獲取建案資訊，請返回上一頁。');
    loading.value = false;
  }
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});

// =================================================================
// / 方法
// =================================================================
// 新增：返回銷控系統的方法
const goToSalesControlSystem = () => {
  if (props.projectId) {
    router.push({
      name: 'SalesControlSystem',
      params: { projectName: props.projectId }
    });
  } else {
    router.back(); // 作為備用方案
  }
};

watch(() => editedItem.value.status_backend, (newValue) => {
  if (editedItem.value) {
    editedItem.value.status = newValue ? '已售' : '';
  }
});

const editItem = (item) => {
  originalItem.value = item;
  editedItem.value = { ...item };
  dialog.value = true;
};

const close = () => {
  dialog.value = false;
};

const saveItem = async () => {
  isSaving.value = true;
  try {
    const { docId, ...dataToUpdate } = editedItem.value;
    await updateParkingLot(docId, dataToUpdate);
    toast.success(`車位 ${editedItem.value.spotId} 的資料已更新`);
    close();
  } catch (err) {
    toast.error(`更新失敗: ${err.message}`);
  } finally {
    isSaving.value = false;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case '小訂': case '補足': case '簽約': return '#c0392b';
    case '保留': case '現場銷控': return '#b4a7d6';
    case '已售': return 'grey';
    default: return '#239b56';
  }
};

const formatPrice = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  if(isNaN(value)) return '-';
  return `${new Intl.NumberFormat().format(value)} 萬`;
};

const exportToExcel = () => {
    if (allItems.value.length === 0) {
        toast.info('目前沒有資料可匯出。');
        return;
    }
    const sortedItems = [...allItems.value].sort((a, b) => {
        return String(a.number ?? '').localeCompare(String(b.number ?? ''), 'zh-TW', { numeric: true, sensitivity: 'base' });
    });

    const dataAsArray = sortedItems.map(item => {
        return exportOrder.value.map(key => item[key]);
    });

    const warningRow = ['注意：為確保資料能正確重新上傳，請勿修改第二列的標頭名稱。'];
    const dataWithHeader = [warningRow, chineseHeaders.value, ...dataAsArray];
    const ws = XLSX.utils.aoa_to_sheet(dataWithHeader);

    const warningStyle = { font: { color: { rgb: "FFFF0000" }, bold: true }, fill: { fgColor: { rgb: "FFFFFF00" } } };
    ws['A1'].s = warningStyle;
    
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: exportOrder.value.length - 1 } });

    const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: "FFD3D3D3" } } };
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: 1, c: C });
        if(ws[address]) {
            ws[address].s = headerStyle;
        }
    }
    ws['!freeze'] = { ySplit: 2 };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '車位資料');
    const exportFileName = projectName.value || 'unknown-project';
    XLSX.writeFile(wb, `${exportFileName}_車位資料備份_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

// 管理員專用：匯出所有原始欄位的 Excel
const exportAdminExcel = () => {
    if (allItems.value.length === 0) {
        toast.info('目前沒有資料可匯出。');
        return;
    }

    // 取得第一個項目的所有欄位作為標頭（使用英文原始欄位名）
    const firstItem = allItems.value[0];
    const allFields = Object.keys(firstItem);
    
    // 按車位編號排序
    const sortedItems = [...allItems.value].sort((a, b) => {
        return String(a.number ?? '').localeCompare(String(b.number ?? ''), 'zh-TW', { numeric: true, sensitivity: 'base' });
    });

    // 將資料轉換為二維陣列，保持原始格式
    const dataAsArray = sortedItems.map(item => {
        return allFields.map(field => {
            const value = item[field];
            // 保持原始格式：數字保持數字，空值保持空值，布林值保持布林值
            if (value === null || value === undefined) {
                return '';  // 空值顯示為空白
            }
            return value;  // 其他值保持原樣
        });
    });

    // 建立 Excel 工作表
    const dataWithHeader = [allFields, ...dataAsArray];  // 使用英文欄位名作為標頭
    const ws = XLSX.utils.aoa_to_sheet(dataWithHeader);

    // 設定標頭樣式
    const headerStyle = { 
        font: { bold: true, color: { rgb: "FFFFFF" } }, 
        fill: { fgColor: { rgb: "FF4472C4" } }  // 藍色背景
    };
    
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: 0, c: C });
        if(ws[address]) {
            ws[address].s = headerStyle;
        }
    }

    // 凍結第一列標頭
    ws['!freeze'] = { ySplit: 1 };
    
    // 建立工作簿並匯出
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'salesParkings_Raw_Data');
    
    const exportFileName = projectName.value || 'unknown-project';
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '_');
    XLSX.writeFile(wb, `${exportFileName}_管理員原始資料_${timestamp}.xlsx`);
    
    toast.success(`已匯出 ${sortedItems.length} 筆原始資料`);
};

const closeUploadDialog = () => {
    uploadDialog.value = false;
    uploadedFile.value = null;
    parsedData.value = [];
    uploadMessage.value = '';
};

const handleFileChange = () => {
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
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // ========================================================
            // 智能檔案格式檢測：支援一般匯出和管理員匯出兩種格式
            // ========================================================
            
            let dataAsArrays, isAdminFormat = false;
            
            // 先嘗試從第一行讀取（管理員格式）
            const adminFormatData = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 0 });
            
            // 再嘗試從第二行讀取（一般格式，跳過警告行）
            const normalFormatData = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 1 });
            
            // 檢測是否為管理員格式
            if (adminFormatData.length > 0) {
                const firstRowHeaders = adminFormatData[0].map(h => String(h || '').trim());
                const englishFieldsCount = exportOrder.value.filter(field => firstRowHeaders.includes(field)).length;
                
                // 如果第一行包含一定數量的英文欄位名，判定為管理員格式
                if (englishFieldsCount >= Math.min(5, exportOrder.value.length * 0.5)) {
                    dataAsArrays = adminFormatData;
                    isAdminFormat = true;
                    console.log('檢測到管理員格式 Excel 檔案');
                } else {
                    dataAsArrays = normalFormatData;
                    console.log('檢測到一般格式 Excel 檔案');
                }
            } else {
                dataAsArrays = normalFormatData;
            }

            // 至少要有一行標頭
            if (dataAsArrays.length < 1) {
                throw new Error(`檔案格式錯誤或為空檔案`);
            }
            
            // 根據檔案格式進行不同的標頭驗證
            const uploadedHeaders = dataAsArrays[0].map(h => String(h || '').trim());
            let requiredHeaders, headerMapping;
            
            if (isAdminFormat) {
                // 管理員格式：只驗證核心必要欄位，允許額外欄位
                const coreRequiredFields = ['spotId', 'number', 'floor', 'size'];
                requiredHeaders = coreRequiredFields;
                headerMapping = {}; // 管理員格式不需要固定的 mapping
                
                console.log('使用管理員格式驗證，核心必要欄位:', requiredHeaders);
                console.log('檢測到的所有欄位:', uploadedHeaders);
            } else {
                // 一般格式：使用中文標頭驗證
                requiredHeaders = chineseHeaders.value;
                headerMapping = exportOrder.value.reduce((map, field, index) => {
                    map[chineseHeaders.value[index]] = index;
                    return map;
                }, {});
                
                console.log('使用一般格式驗證，必要欄位:', requiredHeaders);
            }

            // 找出缺少的標頭
            const missingHeaders = requiredHeaders.filter(h => !uploadedHeaders.includes(h));
            
            // 標頭驗證
            if (isAdminFormat) {
                // 管理員格式：只檢查必要欄位是否存在，允許額外欄位
                if (missingHeaders.length > 0) {
                    let errorMessage = `檔案標頭不符（檢測為管理員格式）。`;
                    errorMessage += `\n缺少核心必要標頭: ${missingHeaders.join('、')}`;
                    errorMessage += `\n\n建議解決方案:`;
                    errorMessage += `\n1. 確認檔案包含核心欄位: ${requiredHeaders.join('、')}`;
                    errorMessage += `\n2. 使用系統管理員匯出功能重新產生範本`;
                    throw new Error(errorMessage);
                }
                console.log(`✓ 管理員格式驗證通過，包含 ${uploadedHeaders.length} 個欄位`);
            } else {
                // 一般格式：嚴格檢查標頭完全匹配
                const extraHeaders = uploadedHeaders.filter(h => h && !requiredHeaders.includes(h));
                
                if (missingHeaders.length > 0 || extraHeaders.length > 0) {
                    let errorMessage = `檔案標頭不符（檢測為一般格式）。`;
                    if (missingHeaders.length > 0) {
                        errorMessage += `\n缺少必要標頭: ${missingHeaders.join('、')}`;
                    }
                    if (extraHeaders.length > 0) {
                        errorMessage += `\n發現非預期標頭: ${extraHeaders.join('、')}`;
                    }
                    errorMessage += `\n\n建議解決方案:`;
                    errorMessage += `\n1. 使用系統一般匯出功能重新產生範本`;
                    errorMessage += `\n2. 確認標頭格式與系統要求一致`;
                    throw new Error(errorMessage);
                }
                console.log(`✓ 一般格式驗證通過，標頭完全符合要求`);
            }

            const dataRows = dataAsArrays.slice(1);

            const nonEmptyRows = dataRows.filter(row => 
                row.some(cell => cell !== null && cell !== undefined && cell !== '')
            );

            // 根據檔案格式進行不同的資料解析
            let jsonDataWithEnglishKeys;
            
            if (isAdminFormat) {
                // 管理員格式：接受所有欄位，直接按英文欄位名對應
                jsonDataWithEnglishKeys = nonEmptyRows.map(rowArray => {
                    const newRow = {};
                    uploadedHeaders.forEach((header, index) => {
                        // 管理員格式接受所有欄位，不進行篩選
                        newRow[header] = rowArray[index] ?? null;
                    });
                    return newRow;
                });
                
                console.log(`管理員格式解析完成，共 ${jsonDataWithEnglishKeys.length} 筆資料，包含 ${uploadedHeaders.length} 個欄位`);
            } else {
                // 一般格式：中文標頭轉英文欄位名
                jsonDataWithEnglishKeys = nonEmptyRows.map(rowArray => {
                    const newRow = {};
                    exportOrder.value.forEach((englishKey, index) => {
                        // 使用中文標頭的索引來取得對應的資料
                        newRow[englishKey] = rowArray[index] ?? null;
                    });
                    return newRow;
                });
                
                console.log(`一般格式解析完成，共 ${jsonDataWithEnglishKeys.length} 筆資料`);
            }

            parsedData.value = jsonDataWithEnglishKeys;
            uploadMessageType.value = 'success';
            uploadMessage.value = `成功解析 ${jsonDataWithEnglishKeys.length} 筆資料（${isAdminFormat ? '管理員格式' : '一般格式'}），可以開始上傳。`;
            
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

const uploadData = async () => {
    if (parsedData.value.length === 0) {
        uploadMessageType.value = 'warning';
        uploadMessage.value = '沒有可上傳的資料。';
        return;
    }
    isUploading.value = true;
    uploadMessage.value = '';
    try {
        const result = await uploadParkingLots(props.projectId, parsedData.value);
        
        if (result.status === 'success') {
          uploadMessageType.value = 'success';
          uploadMessage.value = result.message || '車位資料已成功上傳更新！';
          setTimeout(() => {
            closeUploadDialog();
          }, 2000); 
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

// 新增方法：前往車位圖管理頁面
const goToFloorplanManager = () => {
  if (props.projectId) {
    router.push({ name: 'ParkingFloorplanManager', params: { projectId: props.projectId } });
  } else {
    toast.error('無法獲取建案ID，無法跳轉頁面');
  }
};

</script>


<style scoped>
.table-container {
  overflow-y: auto;
}
:deep(tbody tr:hover) {
    background-color: #E3F2FD !important;
}
.text-truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.form-section-title {
    font-size: 1rem;
    font-weight: 600;
    color: #0D47A1;
    border-left: 4px solid #0D47A1;
    padding-left: 8px;
    margin-bottom: 12px;
}
:deep(.readonly-field .v-field) {
  background-color: #f5f5f5 !important;
  color: #757575 !important;
}

.pre-wrap-alert {
   white-space: pre-wrap;
}

/* Floating Search for Mobile */
.floating-search-container {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 500px;
  z-index: 100;
  pointer-events: none; /* Allow clicks to pass through container */
}

.floating-search-field {
  pointer-events: auto; /* Enable clicks on the text field */
  box-shadow: 0 8px 20px rgba(0,0,0,0.2);
}
</style>