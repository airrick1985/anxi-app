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
          確認
        </v-btn>

        <!-- ✅ 戶別資料開關按鈕 -->
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
        <InspectionDetailCard :unit-id="selectedUnit" />
      </v-col>
    </v-row>
  </v-container>

  <!-- 下方：驗屋紀錄表格 -->
  <v-container fluid v-if="selectedUnit">
    <v-row justify="center">
      <v-col cols="12" sm="10" md="10">
        <InspectionRecordTable :unit-id="selectedUnit" :records="records" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import InspectionRecordTable from '@/components/InspectionRecordTable.vue';
import InspectionDetailCard from '@/components/InspectionDetailCard.vue';
import { fetchUnitList, fetchInspectionRecords } from '@/api';

const unitsData = ref({});
const selectedBuilding = ref('');
const selectedUnit = ref('');
const loading = ref(false);
const errorMessage = ref('');
const records = ref([]);
const showDetail = ref(false); // ✅ 控制戶別資料卡片顯示

const buildingList = computed(() => Object.keys(unitsData.value));
const unitList = computed(() => unitsData.value[selectedBuilding.value] || []);

const confirm = async () => {
  if (!selectedBuilding.value || !selectedUnit.value) return;

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

const loadUnits = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const result = await fetchUnitList();
    if (result.status === 'success') {
      unitsData.value = result.units || {};
    } else {
      errorMessage.value = result.message || '取得棟別戶別資料失敗';
    }
  } catch (e) {
    errorMessage.value = '伺服器錯誤，無法載入棟別資料';
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
