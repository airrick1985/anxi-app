<template>
<v-container fluid>
<v-card class="pa-4">
<v-card-title class="d-flex align-center justify-space-between text-h5 text-primary mb-4">
<span>{{ pageTitle }}</span>

    <div class="d-flex align-center ga-2">
      <v-btn color="grey-darken-1" variant="outlined" @click="navigateBackToCalendar" prepend-icon="mdi-calendar-month-outline">
        返回時間表
      </v-btn>
      <v-btn icon="mdi-refresh" variant="text" @click="fetchData" :loading="isLoading"></v-btn>
    </div>
  </v-card-title>

  <v-alert v-if="error" type="error" variant="tonal" class="mb-4" :text="error"></v-alert>

  <div v-if="isLoading" class="text-center pa-10">
    <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    <div class="mt-4">戶別資料載入中...</div>
  </div>

  <div v-if="!isLoading && !error" style="height: 75vh;">
    <ag-grid-vue
      class="ag-theme-alpine"
      style="width: 100%; height: 100%;"
      :columnDefs="colDefs"
      :rowData="rowData"
      :defaultColDef="defaultColDef"
      :sideBar="true"
      :localeText="AG_GRID_LOCALE_TW"
      @grid-ready="onGridReady"
      @cell-value-changed="onCellValueChanged"
    >
    </ag-grid-vue>
  </div>
</v-card>
<v-snackbar v-model="snackbar.show" :timeout="2000" :color="snackbar.color">
  {{ snackbar.text }}
</v-snackbar>

</v-container>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue';
// ✅ 【修改】引入 useRouter
import { useRoute, useRouter } from 'vue-router';
import { useProjectStore } from '@/store/projectStore';
import { fetchAllHouseholds, updateHouseholdData, batchUpdateHouseholds } from '@/api';

import "ag-grid-community/styles/ag-theme-alpine.css";
import "ag-grid-enterprise";
import { AgGridVue } from "ag-grid-vue3";
import { AG_GRID_LOCALE_TW } from '@/utils/agGridLocale';
import { format } from 'date-fns';

// --- Store 和路由 ---
const route = useRoute();
const router = useRouter(); // ✅ 【修改】建立 router 實例
const projectStore = useProjectStore();
const projectId = ref(route.params.projectId);

// --- AG Grid 狀態 ---
const gridApi = ref(null);
const rowData = ref([]);
const colDefs = ref([]);

// --- 頁面狀態 ---
const isLoading = ref(true);
const error = ref(null);
const snackbar = reactive({ show: false, text: '', color: 'success' });

// --- 計算屬性 ---
const projectName = computed(() => projectStore.idToNameMap[projectId.value] || '讀取中...');
const pageTitle = computed(() => `${projectName.value} - 戶別資料總表`);

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
try {
return format(new Date(params.value), 'yyyy/MM/dd');
} catch (e) {
return '';
}
};

const linkRenderer = (params) => {
  if (!params.value) return '<span>-</span>';
  return `<a href="${params.value}" target="_blank" rel="noopener noreferrer">開啟連結</a>`;
};



// ✓ 新版：表頭全選 Switch 組件 (兩行顯示)
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

// ✓ 新版：v-switch 顯示組件 (可直接互動)
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




// ✅ 【新增】導航函式
function navigateBackToCalendar() {
router.push({
name: 'InternalInspectionCalendar',
params: { projectId: projectId.value }
});
}

// 載入資料
async function fetchData() {
  isLoading.value = true;
  error.value = null;
  try {
    await projectStore.fetchProjects();
    const data = await fetchAllHouseholds(projectId.value);
    rowData.value = data;
  } catch (err) {
    error.value = `資料載入失敗: ${err.message}`;
  } finally {
    isLoading.value = false;
  }
}

// Grid 準備就緒
const onGridReady = (params) => {
gridApi.value = params.api;
};


// 當儲存格資料被修改時觸發
async function onCellValueChanged(event) {
  const { data, colDef, newValue, oldValue } = event;
  const field = colDef.field;

  if (oldValue === newValue) {
    return;
  }

  // 增加 ID 檢查，確保 _docId 存在
  if (!data || !data._docId) {
    console.error("更新失敗：找不到該行的 document ID (_docId)。", data);
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
    console.error("更新戶別資料時發生錯誤:", err); // 在 console 印出完整錯誤
    snackbar.text = `更新失敗: ${err.message}`;
    snackbar.color = 'error';
    snackbar.show = true;
    
    // 更新失敗時，將資料還原
    data[field] = oldValue;
    gridApi.value.applyTransaction({ update: [data] });
  }
}

onMounted(() => {
  colDefs.value = [
   { 
      headerName: '預約系統開關', 
      pinned: 'left',
      field: 'showInMenu', 
      editable: true,
      width: 180,
      cellRenderer: SwitchRenderer, 
      headerComponent: SwitchHeaderRenderer,
    },
    { headerName: '棟別', field: 'building', width: 100, enableRowGroup: true },
    { headerName: '戶號', field: 'unitId', pinned: 'left', width: 120, filter: 'agTextColumnFilter' },
    { headerName: '目前狀態', field: 'currentStatus', width: 130, editable: true },
    { headerName: '買方姓名', field: 'buyerName', editable: true },
    { headerName: '買方電話', field: 'buyerPhone', editable: true, minWidth: 160 },
    { headerName: '買方Email', field: 'buyerEmail', editable: true, minWidth: 200 },
    { headerName: '買方身分證', field: 'buyerIdNumber', editable: true },
    { headerName: '車位', field: 'parkingLots', editable: true },
    { headerName: '門牌', field: 'address', editable: true, minWidth: 250 },
    { 
      headerName: '撥款日', 
      field: 'appropriationDate', 
      filter: 'agDateColumnFilter', 
      valueFormatter: dateFormatter, 
      editable: true,
      cellEditor: 'agDateCellEditor' 
    },
    { headerName: '銀行', field: 'bank', editable: true },
    { headerName: '初驗批次', field: 'initialInspectionBatch', editable: true },
    { headerName: '初驗日期', field: 'initialInspectionDate', filter: 'agDateColumnFilter', valueFormatter: dateFormatter },
    { headerName: '初驗方式', field: 'initialInspectionMethod' },
    { headerName: '複驗批次', field: 'reInspectionBatch', editable: true },
    { headerName: '複驗日期', field: 'reInspectionDate', filter: 'agDateColumnFilter', valueFormatter: dateFormatter },
    { headerName: '複驗方式', field: 'reInspectionMethod' },
    { 
      headerName: '初驗報告上傳開關', 
      field: 'initialReportUploadSwitch', 
      editable: true,
      width: 180,
      cellRenderer: SwitchRenderer, 
      headerComponent: SwitchHeaderRenderer, 
    },
    { 
      headerName: '複驗報告上傳開關', 
      field: 'reInspectionReportUploadSwitch', 
      editable: true,
      width: 180,
      cellRenderer: SwitchRenderer, 
      headerComponent: SwitchHeaderRenderer, 
    },
    { headerName: '驗屋文件', field: 'inspectionDocsUrl', cellRenderer: linkRenderer, flex: 1.5 },
    { headerName: '驗屋報告', field: 'inspectionReportUrl', cellRenderer: linkRenderer, flex: 1.5 },
    { headerName: '備註', field: 'remarks', editable: true, minWidth: 250 },
  ];

  if (projectId.value) {
    fetchData();
  } else {
    error.value = "未提供建案 ID";
    isLoading.value = false;
  }
});

</script>

<style>

.ag-input-field-input {
  padding-left: 25px !important;
}


.ag-input-field-input[aria-label="戶號 Filter Input"] {
  padding-left: 5px !important;
}

</style>