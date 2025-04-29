<template>
  <v-container class="fill-height" fluid>
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6">
        <h2 class="text-center mb-6">選擇驗屋戶別</h2>

        <!-- 棟別選單 -->
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

        <!-- 戶別選單 -->
        <v-select
          v-model="selectedUnit"
          :items="unitList"
          label="請選擇戶別"
          outlined
          dense
          required
          :disabled="!selectedBuilding"
        />

        <!-- 確認按鈕 -->
        <v-btn
          color="primary"
          block
          class="mt-6"
          :disabled="!selectedBuilding || !selectedUnit"
          @click="confirm"
        >
          確認
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { fetchUnitList } from '@/api'; // ✅ 請確保有這支 API 函式

const router = useRouter();

// 狀態變數
const unitsData = ref({});
const selectedBuilding = ref('');
const selectedUnit = ref('');
const loading = ref(false);
const errorMessage = ref('');

// 計算棟別、戶別選項
const buildingList = computed(() => Object.keys(unitsData.value));
const unitList = computed(() => unitsData.value[selectedBuilding.value] || []);

// 送出
const confirm = () => {
  if (!selectedBuilding.value || !selectedUnit.value) {
    console.error('請選擇棟別與戶別');
    return;
  }
  const token = 'anxi111003'; // ✅ 固定密碼
  const unit = selectedUnit.value; // ✅ 取得選中的戶別

  console.log('✅ 選擇棟別戶別:', selectedBuilding.value, unit);

  router.push(`/inspection-detail/${unit}?token=${token}`);
};

// 載入棟別+戶別資料
const loadUnits = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const result = await fetchUnitList();
    console.log('📦 戶別資料回傳:', result);

    if (result.status === 'success') {
      unitsData.value = result.units || {};
    } else {
      errorMessage.value = result.message || '取得棟別戶別資料失敗';
    }
  } catch (e) {
    console.error('❌ 載入戶別失敗:', e);
    errorMessage.value = '伺服器錯誤，無法載入棟別資料';
  } finally {
    loading.value = false;
  }
};

// 頁面初始化就載入
onMounted(() => {
  loadUnits();
});
</script>

<style scoped>
.mb-6 {
  margin-bottom: 1.5rem;
}
</style>
