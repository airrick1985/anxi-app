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
            查詢驗屋紀錄
          </v-btn>
  
          <v-btn
            color="secondary"
            block
            class="mt-2"
            v-if="selectedUnit"
            @click="showDetail = !showDetail"
          >
            {{ showDetail ? '隱藏戶別資料' : '顯示戶別資料' }}
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  
    <!-- 下方：戶別詳細資料卡片 -->
    <v-container fluid v-if="showDetail">
      <v-row justify="center">
        <v-col cols="12" sm="10" md="10">
          <InspectionDetailCard :detail="currentHouseDetail" />
        </v-col>
      </v-row>
    </v-container>
  
    <!-- 下方：驗屋紀錄表格 -->
    <v-container fluid v-if="selectedUnit">
      <v-row justify="center">
        <v-col cols="12" sm="12" md="12">
          <InspectionRecordTable :unit-id="selectedUnit" :records="records" />
        </v-col>
      </v-row>
    </v-container>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  import InspectionRecordTable from '@/components/InspectionRecordTable.vue';
  import InspectionDetailCard from '@/components/InspectionDetailCard.vue';
  import { fetchUnitList, fetchInspectionRecords, fetchAllHouseDetails } from '@/api';
  
  const emit = defineEmits(['startLoading', 'stopLoading', 'notify']);



  const unitsData = ref({});
  const allHouseDetails = ref({}); // ✅ 所有戶別詳細資料快取
  const selectedBuilding = ref('');
  const selectedUnit = ref('');
  const loading = ref(false);
  const errorMessage = ref('');
  const records = ref([]);
  const showDetail = ref(false);
  
  // ✅ 回傳目前選擇的戶別詳細資料
  const currentHouseDetail = computed(() => allHouseDetails.value[selectedUnit.value] || {});
  
  // 棟別與戶別選單資料
  const buildingList = computed(() => Object.keys(unitsData.value));
  const unitList = computed(() => unitsData.value[selectedBuilding.value] || []);
  
  // 撈取驗屋紀錄資料
  const confirm = async () => {
    if (!selectedUnit.value) return;
  
    loading.value = true;
    try {
      const result = await fetchInspectionRecords(selectedUnit.value);
      if (result.status === 'success') {
        records.value = result.records;
      } else {
        records.value = [];
        alert('查詢失敗：' + result.message);
      }
    } catch (err) {
      console.error('❌ 查詢驗屋紀錄失敗:', err);
      alert('伺服器錯誤，請稍後再試');
    } finally {
      loading.value = false;
    }
  };
  
  // 載入所有棟別與戶別資料（含戶別詳細）
  const loadUnits = async () => {
    loading.value = true;
    errorMessage.value = '';
    try {
      const [unitResult, detailResult] = await Promise.all([
        fetchUnitList(),
        fetchAllHouseDetails()
      ]);
  
      if (unitResult.status === 'success') {
        unitsData.value = unitResult.units || {};
      } else {
        errorMessage.value = unitResult.message || '取得棟別戶別資料失敗';
      }
  
      if (detailResult.status === 'success') {
        allHouseDetails.value = detailResult.data || {};
      } else {
        console.warn('⚠️ 未能載入全部戶別詳細資料:', detailResult.message);
      }
    } catch (e) {
      errorMessage.value = '伺服器錯誤，無法載入棟別與戶別資料';
    } finally {
      loading.value = false;
    }
  };
  
  onMounted(() => {
    loadUnits();
  });
  </script>
  
  <style scoped>
  .mb-6 {
    margin-bottom: 1.5rem;
  }
  </style>
  