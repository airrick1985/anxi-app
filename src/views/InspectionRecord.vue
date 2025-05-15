<template>
  <!-- 上方選單區 -->
  <v-container class="mb-8" fluid>
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6">
        <h2 class="text-center mb-6">選擇驗屋戶別</h2>

        <v-select
          v-model="selectedBuilding"
          :items="buildingList"
          label="請選擇棟別"
          outlined
          dense
          required
          :loading="loading"
          :error-messages="errorMessage"
        />

        <v-select
          v-model="selectedUnit"
          :items="unitList"
          label="請選擇戶別"
          outlined
          dense
          required
          :disabled="!selectedBuilding"
        />

    <v-btn
          color="primary"
          block
          class="mt-4"
          :disabled="!selectedBuilding || !selectedUnit"
          @click="confirm"
        >
          查詢單一戶別
        </v-btn>

        <v-btn
          color="deep-purple"
          dark
          block
          class="mt-2"
          :loading="loadingAllRecords"
          @click="fetchAllRecordsForProject"
        >
          查詢所有戶別
        </v-btn>

        <v-btn
          color="secondary"
          block
          class="mt-2"
            v-if="selectedUnit && currentDisplayMode === 'singleUnit'"
          @click="showDetail = !showDetail"
        >
          {{ showDetail ? '隱藏戶別資料' : '顯示戶別資料' }}
        </v-btn>
      </v-col>
    </v-row>
  </v-container>

 <!-- 下方：戶別詳細資料卡片 -->
  <!-- 只有在選擇了單一戶別 (selectedUnit 有值) 且用戶想顯示詳細資料時才顯示 -->
  <v-container fluid v-if="selectedUnit && showDetail && Object.keys(currentHouseDetail).length > 0">
    <v-row justify="center">
      <v-col cols="12" sm="10" md="10">
        <InspectionDetailCard :detail="currentHouseDetail" />
      </v-col>
    </v-row>
  </v-container>

<!-- 下方：驗屋紀錄表格 -->
  <!-- 修改 v-if 條件：只要 records 數組中有數據就顯示表格 -->
  <v-container fluid v-if="initialLoadDone">
    <v-row justify="center">
      <v-col cols="12" sm="12" md="12">
        <InspectionRecordTable
          :unit-id="selectedUnit"
          :records="records" 
          :owner="selectedUnit ? (currentHouseDetail.owner || '') : ''"
          :display-mode="currentDisplayMode"
          @records-updated="handleRecordsUpdated"
        />
     </v-col>
    </v-row>
  </v-container>

    <!-- 如果是初始狀態，還未執行任何查詢，可以顯示一個初始提示 -->
  <v-container fluid v-else-if="!loading && !loadingAllRecords && !initialLoadDone">
      <v-row justify="center">
          <v-col cols="12" sm="8" md="6" class="text-center py-5">
              <p>請選擇戶別或點擊按鈕開始查詢驗屋紀錄。</p>
          </v-col>
      </v-row>
  </v-container>

</template>

<script setup>
import { ref, computed, watch } from 'vue';
import InspectionRecordTable from '@/components/InspectionRecordTable.vue';
import InspectionDetailCard from '@/components/InspectionDetailCard.vue';
import { fetchUnitList, fetchInspectionRecords, fetchAllHouseDetails, fetchAllProjectInspectionRecords } from '@/api';
import { useUserStore } from '@/store/user';
import { useToast } from 'vue-toastification';

const currentDisplayMode = ref('singleUnit'); // 初始為單一戶別
const toast = useToast();
// emit 定義移到父組件，如果父組件也需要向上 emit (此組件目前看起來不需要)
// const emit = defineEmits(['startLoading', 'stopLoading', 'notify']);
const userStore = useUserStore();

const unitsData = ref({});
const allHouseDetails = ref({});
const selectedBuilding = ref('');
const selectedUnit = ref('');
const loading = ref(false); // 用於單一戶別查詢的 loading 狀態
const loadingAllRecords = ref(false); // 用於所有戶別查詢的 loading 狀態
const errorMessage = ref('');
const records = ref([]);
const showDetail = ref(false);
const initialLoadDone = ref(false); // 標記是否已執行過至少一次查詢或初始加載

const currentHouseDetail = computed(() => allHouseDetails.value[selectedUnit.value] || {});
const buildingList = computed(() => Object.keys(unitsData.value));
const unitList = computed(() => unitsData.value[selectedBuilding.value] || []);

// --- 統一的刷新記錄函數 ---
const refreshRecords = async () => {
  const currentProjectName = userStore.user?.projectName;
  if (!currentProjectName) {
    toast.error("無法獲取建案資訊，無法刷新記錄。");
    records.value = []; // 清空記錄
    initialLoadDone.value = true; // 標記為已嘗試加載，即使失敗
    // 確保 loading 狀態被重置
    loading.value = false;
    loadingAllRecords.value = false;
    return;
  }

  let result;
  // 在請求前清空當前記錄，避免看到舊數據閃爍
  records.value = [];

  if (currentDisplayMode.value === 'allUnits') {
    loadingAllRecords.value = true;
    try {
      result = await fetchAllProjectInspectionRecords(currentProjectName);
      if (result.status === 'success') {
        records.value = result.records || [];
        if (records.value.length === 0) {
          toast.info(`建案 ${currentProjectName} 尚無任何驗屋紀錄。`);
        } else {
          // 刷新成功後可以不顯示 toast，避免過多提示
          // toast.success(`已刷新建案 ${currentProjectName} 的 ${records.value.length} 筆驗屋紀錄。`);
        }
      } else {
        // records.value = []; // 已在 try 之前清空
        toast.error(`查詢所有記錄失敗：${result.message || '未知錯誤'}`);
      }
    } catch (err) {
      // records.value = []; // 已在 try 之前清空
      console.error('❌ 刷新所有戶別驗屋紀錄失敗:', err);
      toast.error('伺服器錯誤，刷新失敗');
    } finally {
      loadingAllRecords.value = false;
    }
  } else if (currentDisplayMode.value === 'singleUnit' && selectedUnit.value) {
    loading.value = true;
    try {
      result = await fetchInspectionRecords(selectedUnit.value, currentProjectName);
      if (result.status === 'success') {
        records.value = result.records || [];
        if (records.value.length === 0) {
          toast.info(`戶別 ${selectedUnit.value} 尚無驗屋紀錄。`);
        }
      } else {
        // records.value = []; // 已在 try 之前清空
        toast.error(`查詢失敗：${result.message || '未知錯誤'}`);
      }
    } catch (err) {
      // records.value = []; // 已在 try 之前清空
      console.error(`❌ 查詢戶別 ${selectedUnit.value} 驗屋紀錄失敗:`, err);
      toast.error('伺服器錯誤，刷新失敗');
    } finally {
      loading.value = false;
    }
  } else {
    // 如果模式是 singleUnit 但 selectedUnit 為空，或未知模式，則確保 records 為空
    // records.value = []; // 已在 try 之前清空
    if (currentDisplayMode.value === 'singleUnit' && !selectedUnit.value) {
        console.log("[InspectionRecord.vue] refreshRecords: Mode is singleUnit but no unit selected. Records cleared.");
    } else {
        console.warn("[InspectionRecord.vue] refreshRecords: Cannot refresh due to invalid state (currentDisplayMode or selectedUnit). Records cleared.");
    }
  }
  initialLoadDone.value = true; // 無論結果如何，都標記查詢已執行過
};

// --- 事件處理函數，由子組件 InspectionRecordTable 觸發 ---
const handleRecordsUpdated = () => {
  console.log('[InspectionRecord.vue] Received records-updated event, refreshing records...');
  refreshRecords();
};

// --- 修改後的查詢函數 ---
const confirm = async () => {
  if (!selectedUnit.value) {
    toast.info("請先選擇一個戶別。");
    // 如果希望即使未選擇戶別也觸發 "無記錄" 狀態的顯示，可以這樣做：
    // records.value = [];
    // currentDisplayMode.value = 'singleUnit'; // 保持模式
    // initialLoadDone.value = true;
    return;
  }
  currentDisplayMode.value = 'singleUnit';
  // showDetail.value = false; // 可選：每次查詢單一戶別時，先隱藏詳細資料
  await refreshRecords();
};

const fetchAllRecordsForProject = async () => {
  currentDisplayMode.value = 'allUnits';
  selectedUnit.value = ''; // 清空單一戶別選擇
  showDetail.value = false; // 隱藏單一戶別的詳細資料
  await refreshRecords();
};

// --- 載入棟別與戶別資料 ---
const loadUnits = async () => {
  loading.value = true; // 可以共用 loading 狀態
  errorMessage.value = '';
  // initialLoadDone.value = false; // 在開始加載時重置
  try {
    const projectName = userStore.user?.projectName;
    if (!projectName) {
        errorMessage.value = '無法獲取建案資訊 (projectName missing from store)';
        unitsData.value = {};
        allHouseDetails.value = {};
        loading.value = false; // 確保重置 loading
        // initialLoadDone.value = true; // 如果希望此時也標記為已嘗試加載
        return;
    }
    const [unitResult, detailResult] = await Promise.all([
      fetchUnitList(projectName),
      fetchAllHouseDetails(projectName)
    ]);

    if (unitResult.status === 'success') {
      unitsData.value = unitResult.units || {};
    } else {
      errorMessage.value = unitResult.message || '取得棟別戶別資料失敗';
    }

    if (detailResult.status === 'success') {
      allHouseDetails.value = detailResult.data || {};
    } else {
      console.warn('⚠️ 未能載入戶別詳細資料:', detailResult.message);
      // 即使戶別詳細資料加載失敗，也可能希望戶別選單能用
    }
  } catch (e) {
    errorMessage.value = '伺服器錯誤，無法載入棟別與戶別資料';
  } finally {
    loading.value = false;
    // 不在這裡設置 initialLoadDone，讓它由明確的查詢操作觸發
    // 或者，如果希望 loadUnits 完成後就認為初始加載完成（即使還沒有記錄），則設置：
    // initialLoadDone.value = true;
  }
};

// --- 監聽用戶登入狀態 ---
watch(() => userStore.user, (newUser) => {
    if (newUser && newUser.key && newUser.projectName) {
        initialLoadDone.value = false; // 重置查詢完成狀態
        records.value = []; // 清空舊記錄
        selectedBuilding.value = ''; // 重置棟別選擇
        selectedUnit.value = '';   // 重置戶別選擇
        showDetail.value = false;   // 隱藏詳細資料
        currentDisplayMode.value = 'singleUnit'; // 重置顯示模式
        loadUnits(); // 加載新的建案相關資料
    } else {
        // 用戶登出或信息不完整
        unitsData.value = {};
        allHouseDetails.value = {};
        records.value = [];
        selectedBuilding.value = '';
        selectedUnit.value = '';
        showDetail.value = false;
        initialLoadDone.value = false; // 沒有用戶，不應顯示表格或“無記錄”
        currentDisplayMode.value = 'singleUnit';
    }
}, { immediate: true });

// --- 監聽戶別選擇變化 ---
watch(selectedUnit, (newUnit, oldUnit) => {
  if (newUnit && newUnit !== oldUnit) {
    // 當用戶手動選擇了一個新的戶別時
    records.value = []; // 清空當前記錄，因為它們屬於舊戶別或所有戶別
    initialLoadDone.value = false; // 需要用戶點擊查詢按鈕來加載新戶別的記錄
    currentDisplayMode.value = 'singleUnit'; // 默認為單一戶別查詢模式
    showDetail.value = false; // 隱藏可能來自舊戶別的詳細資料
  } else if (!newUnit && oldUnit && currentDisplayMode.value === 'singleUnit') {
    // 如果戶別被清空 (例如，如果下拉選單允許)，並且之前是單一戶別模式
    // records.value = []; // 可以選擇清空記錄
    // initialLoadDone.value = false; // 可能需要重置
  }
  // 如果是從 "查詢所有戶別" 後 selectedUnit 被程序設為 ''，則不需要額外操作
});

</script>

<style scoped>
.mb-6 {
  margin-bottom: 1.5rem;
}
</style>
