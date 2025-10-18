<template>
  <v-container fluid>
    <div v-if="projectId">
      <v-row>
        <v-col cols="12">
          <v-data-table
            :headers="buildingHeaders"
            :items="buildings"
            :loading="isLoadingBuildings"
            loading-text="正在載入棟別資料..."
            no-data-text="此建案尚無棟別資料"
            class="elevation-1 mb-6"  
            items-per-page="-1"      
            hover                         
            @click:row="handleBuildingRowClick" 
            :row-props="buildingRowProps"
            
          >
            <template v-slot:top>
              <v-toolbar flat color="white">
                <v-toolbar-title>棟別管理</v-toolbar-title>
                <v-divider class="mx-4" inset vertical></v-divider>
                <v-spacer></v-spacer>
            
                <v-btn
                  color="teal"
                  variant="outlined"
                  class="mb-2 mr-2"
                  @click="openImportDialog"
                  prepend-icon="mdi-file-import-outline"
                >
                  匯入棟別/戶別
                </v-btn>

                <v-btn color="primary" variant="outlined"dark class="mb-2" @click="openAddBuildingDialog">
                  手動新增棟別
                </v-btn>
              </v-toolbar>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-icon
                small
                class="mr-2"
                color="blue darken-1"
                @click.stop="openEditBuildingDialog(item)" >
                mdi-pencil
              </v-icon>
              <v-icon
                small
                color="red darken-1"
                @click.stop="openDeleteBuildingDialog(item)" >
                mdi-delete
              </v-icon>
            </template>
          </v-data-table>
        </v-col>
      </v-row>

      <v-expand-transition>
        <div v-if="selectedBuilding">
          <v-row>
            <v-col cols="12">
              <v-data-table
                :headers="unitHeaders"
                :items="unitsOfSelectedBuilding"
                :loading="isLoadingUnits"
                loading-text="正在載入戶別資料..."
                no-data-text="此棟別尚無戶別資料"
                class="elevation-1"
                items-per-page="-1"
              >
                <template v-slot:top>
                  <v-toolbar flat color="white">
                    <v-toolbar-title>戶別管理 ({{ selectedBuilding.name }})</v-toolbar-title>
                    <v-divider class="mx-4" inset vertical></v-divider>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" dark class="mb-2" @click="openAddUnitDialog">
                      手動新增戶別
                    </v-btn>
                  </v-toolbar>
                </template>
                <template v-slot:item.actions="{ item }">
                 <v-icon
                    small
                    class="mr-2"
                    color="blue darken-1"
                    @click.stop="openEditUnitDialog(item)" 
                  >
                    mdi-pencil
                  </v-icon>
                  <v-icon
                    small
                    color="red darken-1"
                    @click.stop="openDeleteUnitDialog(item)" 
                  >
                    mdi-delete
                  </v-icon>
                </template>
              </v-data-table>
            </v-col>
          </v-row>
        </div>
      </v-expand-transition>

      <v-dialog v-model="editBuildingDialogVisible" max-width="500px">
        <v-card>
          <v-card-title><span class="text-h5">編輯棟別</span></v-card-title>
          <v-card-text>
            <v-text-field
              v-model="editedBuildingName"
              label="棟別名稱"
              :rules="requiredRule"
              required variant="outlined" dense
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="closeEditBuildingDialog">取消</v-btn>
            <v-btn color="primary" :loading="isSavingBuildingEdit" @click="saveBuildingEdit">儲存</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="deleteBuildingDialogVisible" max-width="500px">
        <v-card>
          <v-card-title class="text-h5 red--text text--darken-2">確認刪除棟別</v-card-title>
          <v-card-text>
            確定要刪除棟別 "<strong>{{ buildingToDelete?.name }}</strong>" 嗎？<br>
            <span class="text-caption red--text">注意：此操作目前不會刪除其下的戶別資料。</span>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="closeDeleteBuildingDialog">取消</v-btn>
            <v-btn color="red darken-1" :loading="isDeletingBuilding" @click="confirmDeleteBuilding">確認刪除</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="editUnitDialogVisible" max-width="500px">
        <v-card>
          <v-card-title><span class="text-h5">編輯戶別 ({{ selectedBuilding?.name }})</span></v-card-title>
          <v-card-text>
            <v-text-field
              v-model="editedUnitName"
              label="戶別名稱/編號"
              :rules="requiredRule"
              required variant="outlined" dense
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="closeEditUnitDialog">取消</v-btn>
            <v-btn color="primary" :loading="isSavingUnitEdit" @click="saveUnitEdit">儲存</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="deleteUnitDialogVisible" max-width="500px">
    <v-card>
      <v-card-title class="text-h5 red--text text--darken-2">確認刪除戶別</v-card-title>
      <v-card-text>
        確定要刪除棟別 "<strong>{{ selectedBuilding?.name }}</strong>" 下的戶別 "<strong>{{ unitToDelete?.unitId }}</strong>" 嗎？
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="closeDeleteUnitDialog">取消</v-btn>
        <v-btn color="red darken-1" :loading="isDeletingUnit" @click="confirmDeleteUnit">確認刪除</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

      <v-dialog v-model="addBuildingDialogVisible" max-width="500px">
        <v-card>
          <v-card-title>
            <span class="text-h5">新增棟別</span>
          </v-card-title>
          <v-card-text>
            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="newBuildingName"
                    label="棟別名稱"
                    :rules="requiredRule"
                    required
                    variant="outlined"
                    dense
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue darken-1" variant="text" @click="closeAddBuildingDialog">
              取消
            </v-btn>
            <v-btn
              color="blue darken-1"
              variant="text"
              @click="addBuilding"
              :loading="isSavingBuilding"
              :disabled="!newBuildingName || isSavingBuilding"
            >
              儲存
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="addUnitDialogVisible" max-width="500px">
        <v-card>
          <v-card-title>
            <span class="text-h5">新增戶別至 {{ selectedBuilding?.name }}</span>
          </v-card-title>
          <v-card-text>
            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="newUnitName"
                    label="戶別名稱/編號"
                    :rules="requiredRule"
                    required
                    variant="outlined"
                    dense
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue darken-1" variant="text" @click="closeAddUnitDialog">
              取消
            </v-btn>
            <v-btn
              color="blue darken-1"
              variant="text"
              @click="addUnit"
              :loading="isSavingUnit"
              :disabled="!newUnitName || isSavingUnit"
            >
              儲存
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="importDialogVisible" max-width="800px" persistent>
        <v-card>
          <v-card-title class="bg-green-darken-3">
            <span class="text-h5">Excel 匯入棟別與戶別</span>
          </v-card-title>
          <v-card-text class="pt-4">
            <v-alert type="info" variant="tonal" density="compact" class="mb-4">
              請先<strong class="mx-1">下載範本檔案</strong>，依照格式填寫後再選擇檔案上傳。系統將根據檔案內容新增或覆蓋資料。
            </v-alert>

            <div class="mb-4">
               <v-btn
                  color="teal"
                  variant="outlined"
                  @click="downloadTemplate"
                  prepend-icon="mdi-file-excel-outline"
                  block
                >
                  下載 Excel 匯入範本
                </v-btn>
            </div>

            <v-divider class="mb-4"></v-divider>

            <v-file-input
              id="excel-import-input"
              label="選擇已填寫的 Excel 檔案 (.xlsx, .xls)"
              accept=".xlsx, .xls"
              variant="outlined"
              density="compact"
              prepend-icon="mdi-paperclip"
              show-size
              clearable
              @change="handleFileUpload"
              :loading="isParsingExcel"
              class="mb-4"
            ></v-file-input>

            <div v-if="excelError || parsedExcelData.length > 0">
               <p class="text-subtitle-1 mb-2">預覽資料 (前 {{ previewLimit }} 筆)</p>
               <v-alert v-if="excelError" type="error" density="compact" class="mb-2">{{ excelError }}</v-alert>
               <v-data-table
                 :headers="previewHeaders"
                 :items="parsedExcelData"
                 :items-per-page="previewLimit"
                 density="compact"
                 class="elevation-1 mb-4"
                 no-data-text="Excel 中無有效資料或格式錯誤"
               >
                 <template v-slot:bottom>
                   <div class="text-center pa-2 text-caption text-grey" v-if="parsedExcelData.length > previewLimit">
                     ... 以及其他 {{ parsedExcelData.length - previewLimit }} 筆資料
                   </div>
                 </template>
               </v-data-table>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn
              color="grey"
              variant="text"
              @click="clearPreview"
              :disabled="isImporting || isParsingExcel"
            >
              清除重選
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn
              color="grey darken-1"
              variant="text"
              @click="closeImportDialog"
              :disabled="isImporting"
            >
              取消
            </v-btn>
            <v-btn
              color="success"
              variant="flat"
              @click="confirmImport"
              :loading="isImporting"
              :disabled="!parsedExcelData.length || !!excelError || isImporting"
              prepend-icon="mdi-check-circle-outline"
            >
              確認匯入 {{ parsedExcelData.length }} 筆
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>


      

      <v-dialog v-model="addBuildingDialogVisible" max-width="500px">
         <v-card>
           <v-card-title><span class="text-h5">新增棟別</span></v-card-title>
           <v-card-text>
             <v-container> <v-row> <v-col cols="12"> <v-text-field v-model="newBuildingName" label="棟別名稱" :rules="requiredRule" required variant="outlined" dense></v-text-field> </v-col> </v-row> </v-container>
           </v-card-text>
           <v-card-actions>
             <v-spacer></v-spacer>
             <v-btn color="blue darken-1" variant="text" @click="closeAddBuildingDialog">取消</v-btn>
             <v-btn color="blue darken-1" variant="text" @click="addBuilding" :loading="isSavingBuilding" :disabled="!newBuildingName || isSavingBuilding">儲存</v-btn>
           </v-card-actions>
         </v-card>
      </v-dialog>

    </div>
    <div v-else class="text-center text-grey pa-10">
      <p>正在等待建案 ID...</p>
    </div>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" location="top right">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn icon="mdi-close" variant="text" @click="snackbar.show = false"></v-btn>
      </template>
    </v-snackbar>

  </v-container>
</template>

<script setup>
import { ref, reactive, watch, defineProps, onMounted } from 'vue';
import {
  fetchBuildingsForProject, addBuildingToProject, fetchUnitsForBuilding, addUnitToBuilding,
  updateBuildingInProject, deleteBuildingFromProject, updateUnitInBuilding, deleteUnitFromBuilding // 新增
} from '@/api';
import * as XLSX from 'xlsx';
import { db } from '@/firebase'; // 引入 db 實例
import { collection, doc, writeBatch, serverTimestamp, getDocs, query, where } from 'firebase/firestore';

// --- Props ---
const props = defineProps({
  projectId: { type: String, required: true }, // 接收父元件傳來的建案 ID
});

// --- 棟別列表相關 ---
const buildings = ref([]); // 棟別列表資料
const isLoadingBuildings = ref(false); // 棟別載入狀態
const buildingHeaders = ref([ // 棟別 DataTable 標頭
  { title: '棟別名稱', key: 'name', sortable: true },
  { title: '操作', key: 'actions', sortable: false, align: 'end' },
]);

// --- 新增棟別 Dialog 相關 ---
const addBuildingDialogVisible = ref(false); // Dialog 可見性
const newBuildingName = ref(''); // Dialog 輸入欄位
const isSavingBuilding = ref(false); // Dialog 儲存按鈕 loading
const requiredRule = [v => !!v || '此欄位為必填']; // Dialog 驗證規則

// ---  編輯棟別 Dialog ---
const editBuildingDialogVisible = ref(false);
const buildingToEdit = ref(null); // 儲存要編輯的棟別物件 { id, name }
const editedBuildingName = ref('');
const isSavingBuildingEdit = ref(false);

// ---  刪除棟別 Dialog ---
const deleteBuildingDialogVisible = ref(false);
const buildingToDelete = ref(null); // 儲存要刪除的棟別物件 { id, name }
const isDeletingBuilding = ref(false);

// ---  戶別管理相關 ---
const selectedBuilding = ref(null); // 儲存被點擊的棟別物件 { id: 'A1', name: 'A1' }
const unitsOfSelectedBuilding = ref([]); // 儲存該棟別的戶別列表
const isLoadingUnits = ref(false); // 戶別載入狀態
const unitHeaders = ref([
  { title: '戶別名稱/編號', key: 'unitId', sortable: true }, // 顯示 unitId
  { title: '操作', key: 'actions', sortable: false, align: 'end', width: '120px' },
]);

// --- 新增戶別 Dialog ---
const addUnitDialogVisible = ref(false);
const newUnitName = ref('');
const isSavingUnit = ref(false);

// ---  編輯戶別 Dialog ---
const editUnitDialogVisible = ref(false);
const unitToEdit = ref(null); // 儲存要編輯的戶別物件 { id }
const editedUnitName = ref('');
const isSavingUnitEdit = ref(false);

// ---  刪除戶別 Dialog ---
const deleteUnitDialogVisible = ref(false);
const unitToDelete = ref(null); // 儲存要刪除的戶別物件 { id }
const isDeletingUnit = ref(false);


// --- Excel 匯入相關狀態 ---
const parsedExcelData = ref([]); // 儲存從 Excel 解析出的資料陣列
const isPreviewVisible = ref(false); // 控制預覽區塊是否顯示
const isImporting = ref(false); // 控制「確認匯入」按鈕的 loading 狀態
const previewLimit = ref(10); // 預覽表格顯示的最大筆數
const excelError = ref(''); // 顯示 Excel 解析或驗證錯誤訊息
const isParsingExcel = ref(false); // 控制 v-file-input 的 loading 狀態 (解析中)
const previewHeaders = ref([ // 預覽 DataTable 的標頭
  { title: '棟別', key: 'building' },
  { title: '戶別', key: 'unit' },
]);

// --- Snackbar 提示 ---
const snackbar = reactive({ show: false, text: '', color: 'success' });
function showSnackbar(text, color = 'success') {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
}
// --- 函數 ---

//  --- 新增：控制匯入 Dialog 的狀態 ---
const importDialogVisible = ref(false);

//  --- 新增：打開匯入 Dialog 的函數 ---
function openImportDialog() {
  // 打開前先清除上次的狀態
  clearPreview(); // 確保清除預覽狀態
  importDialogVisible.value = true;
}

//  --- 新增：關閉匯入 Dialog 的函數 ---
function closeImportDialog() {
  importDialogVisible.value = false;
  // 關閉時也清除狀態，避免下次打開殘留
  clearPreview();
}

/**
 * 讀取指定建案的棟別列表 (呼叫 API)
 * @param {string} pId - 建案 ID
 */
async function fetchManagedBuildings(pId) {
  if (!pId) { buildings.value = []; return; }
  isLoadingBuildings.value = true;
  selectedBuilding.value = null; //  重新載入棟別時，清除已選棟別
  unitsOfSelectedBuilding.value = []; //  清空戶別列表
  try {
    const buildingsData = await fetchBuildingsForProject(pId);
    buildings.value = buildingsData;
    console.log(`InspProjectSettings: Fetched buildings for ${pId}:`, buildingsData);
  } catch (error) {
    console.error(`InspProjectSettings: Error fetching buildings for ${pId}: `, error.message);
    buildings.value = [];
    showSnackbar(`讀取棟別列表失敗: ${error.message}`, 'error');
  } finally { isLoadingBuildings.value = false; }
}

/**
 * 打開「新增棟別」的彈出視窗 (Dialog)
 */
function openAddBuildingDialog() {
  newBuildingName.value = '';
  addBuildingDialogVisible.value = true;
}

/**
 * 關閉「新增棟別」的彈出視窗 (Dialog)
 */
function closeAddBuildingDialog() {
  addBuildingDialogVisible.value = false;
}

/**
 * 儲存新的棟別 (呼叫 API)
 */
async function addBuilding() {
  if (!newBuildingName.value || !props.projectId) {
     showSnackbar('請輸入棟別名稱', 'warning'); return;
  }
  //  檢查棟別名稱是否已存在
  if (buildings.value.some(b => b.name === newBuildingName.value)) {
    showSnackbar(`棟別 "${newBuildingName.value}" 已存在`, 'warning');
    return;
  }
  isSavingBuilding.value = true;
  try {
    const buildingData = { buildingName: newBuildingName.value };
    await addBuildingToProject(props.projectId, buildingData);
    showSnackbar('棟別新增成功', 'success');
    closeAddBuildingDialog();
    await fetchManagedBuildings(props.projectId);
  } catch (error) {
    console.error("InspProjectSettings: Error adding building: ", error.message);
    showSnackbar(`新增棟別失敗: ${error.message}`, 'error');
  } finally { isSavingBuilding.value = false; }
}

// --- ✅ 編輯棟別函數 ---
function openEditBuildingDialog(item) {
  // ✅ 直接使用 item，它應包含 { id, name }
  console.log("Opening edit dialog for:", item); // 加入 Log 確認
  if (!item) {
      showSnackbar('無法編輯：找不到棟別資料', 'error');
      return;
  }
  buildingToEdit.value = item;
  editedBuildingName.value = item.name; // ✅ 直接讀取 item.name
  editBuildingDialogVisible.value = true;
}

function closeEditBuildingDialog() {
  editBuildingDialogVisible.value = false;
  buildingToEdit.value = null;
  editedBuildingName.value = '';
}

async function saveBuildingEdit() {
  if (!editedBuildingName.value || !buildingToEdit.value) return;
  // 檢查新名稱是否與其他現有棟別重複 (排除自己)
  const isDuplicate = buildings.value.some(b => b.id !== buildingToEdit.value.id && b.name === editedBuildingName.value);
  if (isDuplicate) {
    showSnackbar(`棟別名稱 "${editedBuildingName.value}" 已存在`, 'warning');
    return;
  }
  isSavingBuildingEdit.value = true;
  try {
    await updateBuildingInProject(props.projectId, buildingToEdit.value.id, editedBuildingName.value);
    showSnackbar('棟別名稱更新成功', 'success');
    closeEditBuildingDialog();
    await fetchManagedBuildings(props.projectId); // 重新載入列表
  } catch (error) {
    showSnackbar(`更新棟別失敗: ${error.message}`, 'error');
  } finally {
    isSavingBuildingEdit.value = false;
  }
}

// --- ✅ 刪除棟別函數 ---
function openDeleteBuildingDialog(item) {
  // ✅ 直接使用 item
  console.log("Opening delete dialog for:", item); // 加入 Log 確認
  if (!item) {
      showSnackbar('無法刪除：找不到棟別資料', 'error');
      return;
  }
  buildingToDelete.value = item;
  deleteBuildingDialogVisible.value = true;
}

function closeDeleteBuildingDialog() {
  deleteBuildingDialogVisible.value = false;
  // 延遲一點重置，避免 Dialog 關閉動畫期間內容消失
  setTimeout(() => {
     buildingToDelete.value = null;
  }, 300); // 300 毫秒延遲
}

async function confirmDeleteBuilding() {
  if (!buildingToDelete.value) return;
  isDeletingBuilding.value = true;
  try {
    await deleteBuildingFromProject(props.projectId, buildingToDelete.value.id);
    showSnackbar(`棟別 "${buildingToDelete.value.name}" 刪除成功`, 'success');
    closeDeleteBuildingDialog();
    await fetchManagedBuildings(props.projectId); // 重新載入列表
    // 如果刪除的是當前選中的棟別，則清空戶別區
    if (selectedBuilding.value?.id === buildingToDelete.value.id) {
        selectedBuilding.value = null;
        unitsOfSelectedBuilding.value = [];
    }
  } catch (error) {
    showSnackbar(`刪除棟別失敗: ${error.message}`, 'error');
  } finally {
    isDeletingBuilding.value = false;
  }
}


/**
 * 下載 Excel 匯入範本
 */
function downloadTemplate() {
  const link = document.createElement('a');
  link.href = '/excel-templates/棟別戶別上傳範本.xlsx';
  link.setAttribute('download', '棟別戶別上傳範本.xlsx');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// --- 恢復並修改 handleFileUpload 函數 ---
function handleFileUpload(event) {
  console.log('--- handleFileUpload triggered via @change ---'); // Log 1: 確認 @change 觸發

  // 從事件物件中取得檔案列表
  const files = event.target.files;
  const file = files && files.length > 0 ? files[0] : null;

  console.log('File from event.target.files:', file); // Log 2: 顯示從事件取得的檔案

  // 重置狀態
  parsedExcelData.value = [];
  isPreviewVisible.value = false;
  excelError.value = '';

  if (!file) {
    console.log('No file selected in event.'); // Log 3: 確認沒有檔案
    isPreviewVisible.value = false; // 確保預覽區消失
    // 清除 <v-file-input> 顯示的值 (如果需要) - Vuetify 可能會自動處理
    // event.target.value = null; // 可選
    return;
  }

  // --- 開始解析邏輯 (與之前的 watch 內部邏輯相同) ---
  isParsingExcel.value = true;
  const reader = new FileReader();

  reader.onload = (e) => {
    console.log('FileReader onload triggered.'); // Log 4
    try {
      console.log('Attempting to parse Excel...'); // Log 5
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      console.log("Raw Excel Data:", jsonData);

      if (!jsonData || jsonData.length < 2) {
        throw new Error('Excel 檔案為空或缺少標頭行。');
      }

      const headerRow = jsonData[0].map(h => String(h).trim());
      const buildingIndex = headerRow.indexOf('棟別');
      const unitIndex = headerRow.indexOf('戶別');

      if (buildingIndex === -1 || unitIndex === -1) {
        throw new Error('Excel 缺少必要的標頭："棟別" 和 "戶別"。');
      }

      const parsed = jsonData.slice(1)
        .map(row => ({
          building: String(row[buildingIndex]).trim(),
          unit: String(row[unitIndex]).trim(),
        }))
        .filter(item => item.building && item.unit);

      console.log("Parsed Data:", parsed);

      if (parsed.length === 0) {
         excelError.value = '在 Excel 中找不到有效的棟別與戶別資料。請檢查內容或標頭。';
         isPreviewVisible.value = true; // 顯示提示
      } else {
         console.log('Parsing successful, setting preview visibility.'); // Log 6
         parsedExcelData.value = parsed;
         isPreviewVisible.value = true; // 顯示預覽
      }

    } catch (error) {
      console.error("Error parsing Excel file:", error); // Log 7
      excelError.value = `解析 Excel 失敗: ${error.message}`;
      isPreviewVisible.value = true; // 顯示錯誤
      // 清除 <v-file-input> 顯示的值
      if (event && event.target) { event.target.value = null; }
    } finally {
       console.log('Parsing finished.'); // Log 8
       isParsingExcel.value = false;
    }
  };

  reader.onerror = (error) => {
     console.error("File reading error:", error); // Log 9
     excelError.value = '讀取檔案時發生錯誤。';
     isPreviewVisible.value = true; // 顯示錯誤
     // 清除 <v-file-input> 顯示的值
     if (event && event.target) { event.target.value = null; }
     isParsingExcel.value = false;
  };

  console.log('Calling reader.readAsArrayBuffer...'); // Log 10
  reader.readAsArrayBuffer(file);
}

//  --- 修改 clearPreview ---
// 移除 isPreviewVisible 的操作，因為現在由 Dialog 控制
function clearPreview() {
  parsedExcelData.value = [];
  excelError.value = '';
  // 手動重置 file input 的值 (這部分比較 tricky，可能需要在 Dialog 關閉時做)
  // 暫時先這樣，如果再次選擇相同檔案有問題再調整
  const fileInput = document.querySelector('#excel-import-input input[type="file"]'); // 給 input 一個 ID
  if (fileInput) {
    fileInput.value = null;
  }
  // isPreviewVisible.value = false; // <--- 移除這行
}


/**
 *  確認匯入 Excel 資料到 Firestore (使用 Batch Write) - 修改版
 */
async function confirmImport() {
  if (!parsedExcelData.value.length || !props.projectId) return;
  isImporting.value = true;
  showSnackbar('開始匯入資料，請稍候...', 'info');
  try {
    const batch = writeBatch(db); // 建立一個 Firestore 批次寫入物件
    let writeCounter = 0; // 寫入計數器，Firestore Batch 有 500 次操作上限

    // --- 處理棟別 ---
    // 1. 獲取當前建案已存在的棟別，建立 Map (棟別名稱 -> 棟別ID - ID 現在就是名稱)
    const existingBuildingsMap = new Map();
    //  直接使用 collection 參考
    const buildingsColRef = collection(db, 'projects', props.projectId, 'buildings');
    const buildingsSnapshot = await getDocs(buildingsColRef);
    buildingsSnapshot.forEach(doc => {
      // ❗ Key 和 Value 現在都是棟別名稱 (文件 ID)
      existingBuildingsMap.set(doc.id, doc.id);
    });
    console.log("Existing buildings map (Name -> Name):", existingBuildingsMap);

    // 2. 找出 Excel 中需要新建的棟別 (不重複)
    const buildingsToCreate = new Map(); // 儲存 { buildingName: { ref: DocumentReference, data: object } }
    parsedExcelData.value.forEach(item => {
      // 如果 棟別名稱有效 且 在現有Map中不存在 且 在待建立Map中也不存在
      if (item.building && !existingBuildingsMap.has(item.building) && !buildingsToCreate.has(item.building)) {
        //  修改: 使用 item.building 作為文件 ID
        const newBuildingRef = doc(buildingsColRef, item.building);
        buildingsToCreate.set(item.building, {
          ref: newBuildingRef,
          data: {
             // ❗ 確認欄位名 'buildingName'，並儲存棟別名稱
             buildingName: item.building,
             createdAt: serverTimestamp() // 加入建立時間
          }
        });
      }
    });
    console.log("Buildings to create:", buildingsToCreate);

    // 3. 將 "新增棟別" 操作加入 Batch
    for (const [name, buildingInfo] of buildingsToCreate.entries()) {
       if (writeCounter >= 499) throw new Error("資料量過大，單次匯入超過 Firestore 操作上限(500)，請減少 Excel 行數後分批匯入。");
       batch.set(buildingInfo.ref, buildingInfo.data); // 加入 set 操作
       writeCounter++;
       //  將新建立的棟別 (名稱) 加入 existingBuildingsMap
       existingBuildingsMap.set(name, name); // Key 和 Value 都是名稱
    }

    // --- 處理戶別 ---
    // 4. 遍歷 Excel 資料，準備 "新增/覆蓋戶別" 操作
    for (const item of parsedExcelData.value) {
        if (writeCounter >= 500) throw new Error("資料量過大，單次匯入超過 Firestore 操作上限(500)，請減少 Excel 行數後分批匯入。");

        //  根據 Excel 中的棟別名稱，直接從 Map 中取得棟別名稱 (現在 ID 就是名稱)
        const buildingDocId = existingBuildingsMap.get(item.building);

        // 如果找到了棟別文件 ID
        if (buildingDocId) {
           //  修改: 子集合名稱改為 'unitId'
           //  修改: 戶別文件 ID 仍然使用 item.unit
           const unitRef = doc(db, 'projects', props.projectId, 'buildings', buildingDocId, 'unitId', item.unit);
           //  修改: 欄位名稱改為 'unitId'，值為 item.unit
           batch.set(unitRef, { unitId: item.unit });
           writeCounter++;
        } else {
           // 如果找不到棟別 ID (理論上不應發生)，記錄警告
           console.warn(`找不到棟別 "${item.building}" 的文件 ID，無法新增戶別 "${item.unit}"`);
        }
    }

    console.log(`Committing batch with ${writeCounter} writes.`); // Debug: 顯示操作次數
    // 5. 提交所有批次操作到 Firestore
await batch.commit();
    showSnackbar(`成功匯入 ${buildingsToCreate.size} 個新棟別和 ${parsedExcelData.value.length} 筆戶別資料！`, 'success');
    await fetchManagedBuildings(props.projectId);
    closeImportDialog(); //  成功後關閉 Dialog
  } catch (error) {
    console.error("Error importing data via batch:", error);
    showSnackbar(`匯入失敗: ${error.message}`, 'error');
    // isImporting.value = false; // finally 中會處理
    //  失敗時 Dialog 保持開啟，讓使用者看到錯誤
  } finally {
    isImporting.value = false;
  }
}

/**
 * 處理棟別列點擊事件
 * @param {Event} event - 點擊事件
 * @param {object} payload - 包含 { item: DataTableItem }
 */
function handleBuildingRowClick(event, { item }) {
  //  直接從 item 讀取資料，item 本身就是 { id: 'A1', name: 'A1' }
  console.log("Clicked building item:", item);

  //  移除對 item.raw 的檢查，因為 item 本身就有資料
  // if (!item.raw) { ... } // <--- 移除這段檢查

  //  直接比較 item.id
  if (selectedBuilding.value?.id === item.id) {
    // 如果點擊的是已經選中的棟別，取消選中
    selectedBuilding.value = null;
    unitsOfSelectedBuilding.value = [];
  } else {
    // 否則，選中新的棟別並載入戶別
    //  儲存 item 物件本身
    selectedBuilding.value = item;
    //  使用 item.id 去讀取戶別
    fetchUnits(item.id);
  }
}

/**
 * 根據 Vuetify DataTable 的 row props 給選中的行加上樣式
 */
const buildingRowProps = ({ item }) => {
  //  新增檢查：確保 selectedBuilding.value 和 item.raw 都存在
  const isSelected = selectedBuilding.value && item.raw && selectedBuilding.value.id === item.raw.id;
  return {
    class: isSelected ? 'selected-row' : '', // 如果 isSelected 為 true 才套用 class
    style: 'cursor: pointer;' // 保持 cursor 樣式
  }
}

/**
 * 讀取指定棟別的戶別列表 (呼叫 API)
 * @param {string} buildingId - 棟別 ID (名稱)
 */
async function fetchUnits(buildingId) {
  if (!props.projectId || !buildingId) return;
  isLoadingUnits.value = true;
  unitsOfSelectedBuilding.value = [];
  try {
    const unitsData = await fetchUnitsForBuilding(props.projectId, buildingId);
    unitsOfSelectedBuilding.value = unitsData; // unitsData 現在是 [{ id: '...', unitId: '...' }, ...]
    console.log(`Fetched units for building ${buildingId}:`, unitsOfSelectedBuilding.value);
  } catch (error) {
    console.error(`Error fetching units for building ${buildingId}: `, error.message);
    showSnackbar(`讀取戶別列表失敗: ${error.message}`, 'error');
  } finally {
    isLoadingUnits.value = false;
  }
}

/**
 * 打開「新增戶別」Dialog
 */
function openAddUnitDialog() {
  if (!selectedBuilding.value) return; // 防呆
  newUnitName.value = '';
  addUnitDialogVisible.value = true;
}

/**
 * 關閉「新增戶別」Dialog
 */
function closeAddUnitDialog() {
  addUnitDialogVisible.value = false;
}

/**
 * 新增戶別到 Firestore (呼叫 API)
 */
async function addUnit() {
  if (!selectedBuilding.value || !newUnitName.value || !props.projectId) return;
  // ✅ 檢查 unitId 欄位值是否重複
  if (unitsOfSelectedBuilding.value.some(u => u.unitId === newUnitName.value)) {
    showSnackbar(`戶別 "${newUnitName.value}" 已存在於棟別 "${selectedBuilding.value.name}" (根據顯示名稱)`, 'warning');
    return;
  }
  isSavingUnit.value = true;
  try {
    // ✅ API 的第三個參數是文件 ID 和欄位值，所以傳 newUnitName
    await addUnitToBuilding(props.projectId, selectedBuilding.value.id, newUnitName.value);
    showSnackbar('戶別新增成功', 'success');
    closeAddUnitDialog();
    await fetchUnits(selectedBuilding.value.id);
  } catch (error) {
    console.error("Error adding unit:", error.message);
    showSnackbar(`新增戶別失敗: ${error.message}`, 'error');
  } finally {
    isSavingUnit.value = false;
  }
}

// --- ✅ 編輯戶別函數 ---
function openEditUnitDialog(item) { // item 現在是 { id, unitId }
  console.log("Opening edit unit dialog for:", item);
  if (!item) {
      showSnackbar('無法編輯：找不到戶別資料', 'error');
      return;
  }
  unitToEdit.value = item; // 儲存完整物件
  editedUnitName.value = item.unitId; // 編輯 input 顯示 unitId 欄位值
  editUnitDialogVisible.value = true;
}

function closeEditUnitDialog() {
  editUnitDialogVisible.value = false;
  // 延遲重置以優化視覺效果
  setTimeout(() => {
    unitToEdit.value = null;
    editedUnitName.value = '';
  }, 300);
}

async function saveUnitEdit() {
  // 檢查是否有正在編輯的戶別、新的名稱以及選中的棟別
  if (!editedUnitName.value || !unitToEdit.value || !selectedBuilding.value) return;

  // 檢查新輸入的戶別名稱/編號 (editedUnitName) 是否與
  // 當前棟別下其他戶別的 unitId 欄位值重複 (需要排除正在編輯的這一筆)
  const isDuplicate = unitsOfSelectedBuilding.value.some(u =>
    u.id !== unitToEdit.value.id && // 排除自己 (比較文件 ID)
    u.unitId === editedUnitName.value // 比較 unitId 欄位值
  );

  if (isDuplicate) {
    showSnackbar(`戶別名稱/編號 "${editedUnitName.value}" 已存在於棟別 "${selectedBuilding.value.name}"`, 'warning');
    return; // 如果重複，停止執行
  }

  // 設定儲存中的狀態
  isSavingUnitEdit.value = true;
  try {
    // 呼叫 API 進行更新
    // 參數：建案ID, 棟別ID(名稱), 戶別文件ID(原始名稱), 新的戶別欄位值
    await updateUnitInBuilding(props.projectId, selectedBuilding.value.id, unitToEdit.value.id, editedUnitName.value);

    // 更新成功
    showSnackbar('戶別更新成功', 'success');
    closeEditUnitDialog(); // 關閉編輯對話框
    await fetchUnits(selectedBuilding.value.id); // 重新載入戶別列表以顯示更新
  } catch (error) {
    // 更新失敗
    showSnackbar(`更新戶別失敗: ${error.message}`, 'error');
  } finally {
    // 無論成功或失敗，結束儲存中的狀態
    isSavingUnitEdit.value = false;
  }
}

// ✅ 修改刪除戶別函數
function openDeleteUnitDialog(item) { // item 現在是 { id, unitId }
  console.log("Opening delete unit dialog for:", item);
  if (!item) {
      showSnackbar('無法刪除：找不到戶別資料', 'error');
      return;
  }
  unitToDelete.value = item; // 儲存完整物件
  deleteUnitDialogVisible.value = true;
}



function closeDeleteUnitDialog() {
  deleteUnitDialogVisible.value = false;
  unitToDelete.value = null;
}

async function confirmDeleteUnit() {
  if (!unitToDelete.value || !selectedBuilding.value) return;
  isDeletingUnit.value = true;
  try {
    // ✅ API 需要 projectId, buildingId, 文件ID(unitToDelete.value.id)
    await deleteUnitFromBuilding(props.projectId, selectedBuilding.value.id, unitToDelete.value.id);
    // ✅ Dialog 顯示 unitId 欄位值
    showSnackbar(`戶別 "${unitToDelete.value.unitId}" 刪除成功`, 'success');
    closeDeleteUnitDialog();
    await fetchUnits(selectedBuilding.value.id);
  } catch (error) {
    showSnackbar(`刪除戶別失敗: ${error.message}`, 'error');
  } finally {
    isDeletingUnit.value = false;
  }
}



// --- Watchers ---
/**
 * 監聽 projectId Prop 的變化，當父元件傳來的 projectId 改變時，
 * 重新載入該建案的棟別列表。
 */
watch(() => props.projectId, (newProjectId, oldProjectId) => {
  console.log(`InspProjectSettings: Project ID prop changed from ${oldProjectId} to ${newProjectId}`);
  if (newProjectId) {
    fetchManagedBuildings(newProjectId);
  } else {
    buildings.value = [];
    selectedBuilding.value = null; //  清除選中棟別
    unitsOfSelectedBuilding.value = []; //  清空戶別列表
  }
}, { immediate: true });

</script>

<style scoped>
/*  新增選中行的樣式 */
.selected-row {
  background-color: #E3F2FD !important; /* Vuetify 藍色 50 */
  font-weight: bold;
}
</style>