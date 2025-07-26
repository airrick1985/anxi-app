<template>
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
          查詢 {{ buttonText }} 驗屋紀錄
        </v-btn>

        <v-btn
          color="deep-purple"
          dark
          block
          class="mt-2"
          :loading="loadingAllRecords"
          @click="fetchAllRecordsForProject"
        >
          查詢所有戶別驗屋紀錄
        </v-btn>

        <v-btn
          color="secondary"
          block
          class="mt-2"
            v-if="selectedUnit && currentDisplayMode === 'singleUnit'"
          @click="showDetail = !showDetail"
        >
          {{ showDetail ? `隱藏 ${selectedUnit} 資料` : `顯示 ${selectedUnit} 資料` }}
        </v-btn>
      </v-col>
    </v-row>
  </v-container>

  <v-container fluid v-if="selectedUnit && showDetail && Object.keys(currentHouseDetail).length > 0">
    <v-row justify="center">
      <v-col cols="12" sm="10" md="10">
        <InspectionDetailCard :detail="currentHouseDetail" />
      </v-col>
    </v-row>
  </v-container>

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

// --- 新增的 Computed Property ---
const buttonText = computed(() => {
  if (selectedUnit.value) {
    return `${selectedUnit.value}`;
  }
  return '查詢單一戶別';
});
// ---------------------------------

// --- 統一的刷新記錄函數 ---
const refreshRecords = async () => {
  const currentProjectName = userStore.user?.projectName;
  if (!currentProjectName) {
    toast.error("無法獲取建案資訊，無法刷新記錄。");
    records.value = [];
    initialLoadDone.value = true;
    loading.value = false;
    loadingAllRecords.value = false;
    return;
  }

  records.value = [];
  let result;

  if (currentDisplayMode.value === 'allUnits') {
    loadingAllRecords.value = true;
    try {
      result = await fetchAllProjectInspectionRecords(currentProjectName);
      if (result.status === 'success') {
        records.value = result.records || [];
        if (records.value.length === 0) {
          toast.info(`建案 ${currentProjectName} 尚無任何驗屋紀錄。`);
        }
      } else {
        toast.error(`查詢所有記錄失敗：${result.message || '未知錯誤'}`);
      }
    } catch (err) {
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
        toast.error(`查詢失敗：${result.message || '未知錯誤'}`);
      }
    } catch (err) {
      console.error(`❌ 查詢戶別 ${selectedUnit.value} 驗屋紀錄失敗:`, err);
      toast.error('伺服器錯誤，刷新失敗');
    } finally {
      loading.value = false;
    }
  } else {
      if (currentDisplayMode.value === 'singleUnit' && !selectedUnit.value) {
          console.log("[InspectionRecord.vue] refreshRecords: Mode is singleUnit but no unit selected. Records cleared.");
      } else {
          console.warn("[InspectionRecord.vue] refreshRecords: Cannot refresh due to invalid state (currentDisplayMode or selectedUnit). Records cleared.");
      }
  }
  initialLoadDone.value = true;
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
    return;
  }
  currentDisplayMode.value = 'singleUnit';
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
  loading.value = true;
  errorMessage.value = '';
  try {
    const projectName = userStore.user?.projectName;
    if (!projectName) {
        errorMessage.value = '無法獲取建案資訊 (projectName missing from store)';
        unitsData.value = {};
        allHouseDetails.value = {};
        loading.value = false;
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
    }
  } catch (e) {
    errorMessage.value = '伺服器錯誤，無法載入棟別與戶別資料';
  } finally {
    loading.value = false;
  }
};

// --- 監聽用戶登入狀態 ---
watch(() => userStore.user, (newUser) => {
    if (newUser && newUser.key && newUser.projectName) {
        initialLoadDone.value = false;
        records.value = [];
        selectedBuilding.value = '';
        selectedUnit.value = '';
        showDetail.value = false;
        currentDisplayMode.value = 'singleUnit';
        loadUnits();
    } else {
        unitsData.value = {};
        allHouseDetails.value = {};
        records.value = [];
        selectedBuilding.value = '';
        selectedUnit.value = '';
        showDetail.value = false;
        initialLoadDone.value = false;
        currentDisplayMode.value = 'singleUnit';
    }
}, { immediate: true });

// --- 監聽戶別選擇變化 ---
watch(selectedUnit, (newUnit, oldUnit) => {
  if (newUnit && newUnit !== oldUnit) {
    records.value = [];
    initialLoadDone.value = false;
    currentDisplayMode.value = 'singleUnit';
    showDetail.value = false;
  }
});

</script>

<style scoped>
.mb-6 {
  margin-bottom: 1.5rem;
}
</style>