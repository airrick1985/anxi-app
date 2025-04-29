<template>
  <v-container>
    <v-card>
      <v-card-title class="text-h6">驗屋戶別資料</v-card-title>
      <v-divider></v-divider>
      <v-list two-line>
        <v-list-item v-for="(value, label) in houseDetailFields" :key="label">
          <v-list-item-title>{{ label }}</v-list-item-title>
          <v-list-item-subtitle>
            <span v-html="value"></span>
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
      <v-card-actions class="button-group">
        <v-btn
          color="primary"
          variant="elevated"
          size="large"
          rounded
          :loading="viewRecordLoading"
          @click="handleViewRecord"
        >
          <v-icon left>mdi-file-document-outline</v-icon>
          查看驗屋紀錄
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- 資料載入中 Loading Spinner -->
    <v-dialog v-model="loading" persistent width="300">
      <v-card color="primary" dark>
        <v-card-text>
          資料載入中，請稍候...
          <v-progress-linear indeterminate color="white" class="mt-3"></v-progress-linear>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 錯誤通知 -->
    <v-snackbar v-model="snackbar" :timeout="3000" color="error">
      {{ snackbarMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchHouseDetail } from '@/api';

const route = useRoute();
const router = useRouter();

const unitId = route.params.unitId;
const token = route.query.token;
console.log('✅ route params:', route.params);
console.log('✅ route query:', route.query);

const houseDetail = ref(null);
const loading = ref(false);
const viewRecordLoading = ref(false);

// Snackbar 錯誤提示
const snackbar = ref(false);
const snackbarMessage = ref('');

// 顯示的欄位
const houseDetailFields = computed(() => {
  if (!houseDetail.value) return {};

  return {
    棟別: houseDetail.value.building,
    門牌: houseDetail.value.address,
    戶別: houseDetail.value.unit,
    車位: houseDetail.value.parking,
    屋主: houseDetail.value.owner,
    電話: houseDetail.value.phone 
      ? `📞 <a href=\"tel:${houseDetail.value.phone}\">${houseDetail.value.phone}</a>` 
      : '',
    驗屋階段: houseDetail.value.inspectionStage,
    預約日期: houseDetail.value.appointmentDate || '尚未預約',
    預約時段: houseDetail.value.appointmentTime || '尚未預約',
    驗屋文件: houseDetail.value.docUrl 
      ? `📄 <a href=\"${houseDetail.value.docUrl}\" target=\"_blank\">點我查看驗屋文件</a>` 
      : '無',
    驗屋報告: houseDetail.value.reportUrl 
      ? `📄 <a href=\"${houseDetail.value.reportUrl}\" target=\"_blank\">點我查看驗屋報告</a>` 
      : '無'
  };
});

// 載入戶別資料
const loadHouseDetail = async () => {
  if (!unitId || !token) {
    console.error('❌ 缺少 unit 或 token');
    snackbarMessage.value = '查詢失敗，缺少必要資訊';
    snackbar.value = true;
    router.replace({ name: 'InspectionRecord' });
    return;
  }

  loading.value = true;
  try {
    const result = await fetchHouseDetail(unitId, token);
    console.log('✅ 查詢結果:', result);

    if (result.status === 'success') {
      houseDetail.value = result.data;
    } else {
      throw new Error(result.message || '資料取得失敗');
    }
  } catch (err) {
    console.error('❌ 查詢失敗:', err.message);
    snackbarMessage.value = '查詢失敗：' + err.message;
    snackbar.value = true;
    setTimeout(() => {
      router.replace({ name: 'InspectionRecord' });
    }, 2000);
  } finally {
    loading.value = false;
  }
};

// 查看驗屋紀錄按鈕動作
const handleViewRecord = async () => {
  if (!unitId) {
    snackbarMessage.value = '查無戶別資訊，無法查看驗屋紀錄';
    snackbar.value = true;
    return;
  }

  viewRecordLoading.value = true;
  try {
    await router.push({
      name: 'InspectionRecordTable',  // ⚡ 請確保 router 有這個 name
      params: { unitId }
    });
  } catch (err) {
    console.error('❌ 跳轉失敗:', err);
    snackbarMessage.value = '跳轉驗屋紀錄失敗';
    snackbar.value = true;
  } finally {
    viewRecordLoading.value = false;
  }
};


onMounted(() => {
  loadHouseDetail();
});
</script>

<style scoped>
.v-card {
  margin-top: 20px;
}
.button-group {
  justify-content: center;
  gap: 1rem;
  margin-top: 20px;
}
</style>
