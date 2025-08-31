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
        <v-icon icon="mdi-car-brake-parking"></v-icon> &nbsp;
        <span class="font-weight-bold text-primary">{{ projectName }}</span>
        <span class="mx-2 d-none d-sm-inline">|</span>
        <span class="d-none d-sm-inline">車位銷控管理</span>
        <v-spacer></v-spacer>

        <template v-if="mdAndUp">
          <v-btn
            color="teal"
            variant="outlined"
            class="me-2"
            @click="exportToExcel"
            prepend-icon="mdi-file-excel"
          >
            匯出 EXCEL
          </v-btn>
          <v-btn
            color="red-darken-2"
            variant="outlined"
            @click="uploadDialog = true"
            prepend-icon="mdi-upload"
          >
            上傳車位資料
          </v-btn>
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
        </template>

        <template v-else>
          <v-btn icon="mdi-magnify" variant="text" @click="isSearching = true"></v-btn>
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
              <v-list-item @click="uploadDialog = true">
                <template v-slot:prepend>
                  <v-icon icon="mdi-upload" color="red-darken-2"></v-icon>
                </template>
                <v-list-item-title>上傳車位資料</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>
        
        <v-btn class="ml-2" icon="mdi-close" @click="$emit('close')"></v-btn>
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
                <v-text-field v-model="editedItem.type" label="類型" readonly variant="outlined" density="compact" class="readonly-field"></v-text-field>
                <v-text-field v-model="editedItem.size" label="車位尺寸" readonly variant="outlined" density="compact" class="readonly-field"></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="form-section-title">價格資訊</div>
                <v-text-field v-model.number="editedItem.price_list" label="車位表價" type="number" readonly variant="outlined" density="compact" class="readonly-field"></v-text-field>
                <v-text-field v-model.number="editedItem.price_floor" label="車位底價" type="number" readonly variant="outlined" density="compact" class="readonly-field"></v-text-field>
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
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
import { useToast } from 'vue-toastification';
import { listenToParkingLots, updateParkingLot, uploadParkingLots } from '@/api';
import * as XLSX from 'xlsx-js-style';

const emit = defineEmits(['close']);
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
    { key: 'size', title: '車位尺寸' },
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


// =================================================================
// / Vue 相關 state
// =================================================================
const projectName = computed(() => {
  const projectId = userStore.user?.projectName;
  return projectStore.idToNameMap[projectId] || '';
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
  const projectId = userStore.user?.projectName;
  if (projectId) {
    loading.value = true;
    unsubscribe = listenToParkingLots(
      projectId,
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
    toast.error('無法獲取建案資訊，請重新登入。');
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
            
            const dataAsArrays = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 1 });

            // 至少要有一行標頭，如果沒有則 dataAsArrays 會是空陣列
            if (dataAsArrays.length < 1) {
                 // 直接拋出所有必要標頭，因為檔案是空的
                 throw new Error(`檔案缺少所有必要標頭: ${chineseHeaders.value.join('、')}`);
            }
            
             // ========================================================
             // 4.【核心修改】統一的、更詳細的標頭驗證邏輯
             // ========================================================
            const uploadedHeaders = dataAsArrays[0].map(h => String(h || '').trim());
            const requiredHeaders = chineseHeaders.value;

            // 找出所有「缺少」的標頭
            const missingHeaders = requiredHeaders.filter(h => !uploadedHeaders.includes(h));
            // 找出所有「多餘」的標頭 (過濾掉空字串)
            const extraHeaders = uploadedHeaders.filter(h => h && !requiredHeaders.includes(h));

            // 只要有任何缺少或多餘的標頭，就組合詳細錯誤訊息並拋出
            if (missingHeaders.length > 0 || extraHeaders.length > 0) {
                let errorMessage = '檔案標頭不符。';
                if (missingHeaders.length > 0) {
                    errorMessage += `\n缺少必要標頭: ${missingHeaders.join('、')}`;
                }
                if (extraHeaders.length > 0) {
                    errorMessage += `\n發現非預期標頭: ${extraHeaders.join('、')}`;
                }
                throw new Error(errorMessage);
            }

            const dataRows = dataAsArrays.slice(1);

            const nonEmptyRows = dataRows.filter(row => 
                row.some(cell => cell !== null && cell !== undefined && cell !== '')
            );


          const jsonDataWithEnglishKeys = nonEmptyRows.map(rowArray => {
                const newRow = {};
                exportOrder.value.forEach((key, index) => {
                    // 增加保護：如果 excel 的 cell 是空的，給定一個 null 值
                    newRow[key] = rowArray[index] ?? null;
                });
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

const uploadData = async () => {
    if (parsedData.value.length === 0) {
        uploadMessageType.value = 'warning';
        uploadMessage.value = '沒有可上傳的資料。';
        return;
    }
    isUploading.value = true;
    uploadMessage.value = '';
    try {
        const projectId = userStore.user?.projectName;
        const result = await uploadParkingLots(projectId, parsedData.value);
        
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
</style>