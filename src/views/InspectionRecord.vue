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
import { fetchUnitList, fetchInspectionRecords, fetchAllHouseDetails,fetchAllProjectInspectionRecords } from '@/api';
import { useUserStore } from '@/store/user';
import { useToast } from 'vue-toastification'; // 假設你使用 toast

const currentDisplayMode = ref('singleUnit'); // 初始為單一戶別
const toast = useToast(); // 假設你使用 toast
const emit = defineEmits(['startLoading', 'stopLoading', 'notify']);
const userStore = useUserStore();

const unitsData = ref({});
const allHouseDetails = ref({});
const selectedBuilding = ref('');
const selectedUnit = ref('');
const loading = ref(false);
const loadingAllRecords = ref(false); // 新增：用於查詢所有記錄
const errorMessage = ref('');
const records = ref([]);
const showDetail = ref(false);
const initialLoadDone = ref(false); // 新增：用於初始提示

const currentHouseDetail = computed(() => allHouseDetails.value[selectedUnit.value] || {});
const buildingList = computed(() => Object.keys(unitsData.value));
const unitList = computed(() => unitsData.value[selectedBuilding.value] || []);

// 查詢單一戶別驗屋紀錄 (原 confirm 函數)
const confirm = async () => {
  
  if (!selectedUnit.value) return;
  loading.value = true;
  records.value = []; // 清空之前的記錄
  currentDisplayMode.value = 'singleUnit'; // 查詢單一戶別時設置
  try {
    const currentProjectName = userStore.user?.projectName;
    if (!currentProjectName) {
      toast.error("無法獲取建案資訊。");
      loading.value = false;
      initialLoadDone.value = true; // 即使失敗也標記查詢已執行
      return;
    }
    const result = await fetchInspectionRecords(selectedUnit.value, currentProjectName);
    if (result.status === 'success') {
      records.value = result.records || [];
      if (records.value.length === 0) {
        toast.info(`戶別 ${selectedUnit.value} 尚無驗屋紀錄。`);
      }
    } else {
      toast.error(`查詢失敗：${result.message || '未知錯誤'}`);
    }
  } catch (err) {
    console.error('❌ 查詢單一戶別驗屋紀錄失敗:', err);
    toast.error('伺服器錯誤，請稍後再試');
  } finally {
    loading.value = false;
    initialLoadDone.value = true; // 標記查詢已執行
  }
};

// 新增：查詢該建案所有戶別的驗屋紀錄
const fetchAllRecordsForProject = async () => {
  
  loadingAllRecords.value = true;
  records.value = []; // 清空之前的記錄
  currentDisplayMode.value = 'allUnits'; // 查詢所有戶別時設置
  try {
    const currentProjectName = userStore.user?.projectName;
    if (!currentProjectName) {
      toast.error("無法獲取建案資訊。");
      loadingAllRecords.value = false;
      initialLoadDone.value = true; // 即使失敗也標記查詢已執行
      return;
    }
    const result = await fetchAllProjectInspectionRecords(currentProjectName);
    if (result.status === 'success') {
      records.value = result.records || [];
      selectedUnit.value = ''; // 清空單一戶別選擇
      showDetail.value = false; // 隱藏單一戶別的詳細資料
      if (records.value.length === 0) {
        toast.info(`建案 ${currentProjectName} 尚無任何驗屋紀錄。`);
      } else {
        toast.success(`已載入建案 ${currentProjectName} 的 ${records.value.length} 筆驗屋紀錄。`);
      }
  
    } else {
      toast.error(`查詢所有記錄失敗：${result.message || '未知錯誤'}`);
    }
  } catch (err) {
    console.error('❌ 查詢所有戶別驗屋紀錄失敗:', err);
    toast.error('伺服器錯誤，請稍後再試');
  } finally {
    loadingAllRecords.value = false;
    initialLoadDone.value = true; // 標記查詢已執行
  }
};

// 載入棟別與戶別資料
const loadUnits = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const projectName = userStore.user.projectName; // ✅ 從登入資料取出 projectName

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
    initialLoadDone.value = true; // 確保在初始加載棟別/戶別後也標記
  }
};


// ✅ 等待 user 登入完成才載入資料
watch(() => userStore.user, (newUser) => {
    if (newUser && newUser.key && newUser.projectName) { // 確保 projectName 也存在
        initialLoadDone.value = false; // 用戶切換或登入時，重置查詢狀態
        records.value = []; // 清空舊記錄
        loadUnits();
    } else {
        unitsData.value = {};
        allHouseDetails.value = {};
        records.value = [];
        selectedBuilding.value = '';
        selectedUnit.value = '';
        initialLoadDone.value = false; // 沒有用戶，不應顯示表格
    }
}, { immediate: true });

</script>

<style scoped>
.mb-6 {
  margin-bottom: 1.5rem;
}
</style>
