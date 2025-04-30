<template>
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
  
      <!-- 載入中 -->
      <v-dialog v-model="loading" persistent width="300">
        <v-card color="primary" dark>
          <v-card-text>
            資料載入中，請稍候...
            <v-progress-linear indeterminate color="white" class="mt-3" />
          </v-card-text>
        </v-card>
      </v-dialog>
  
      <!-- 錯誤提示 -->
      <v-snackbar v-model="snackbar" :timeout="3000" color="error">
        {{ snackbarMessage }}
      </v-snackbar>
    </v-card>
  </template>
  
  <script setup>
  import { ref, computed, watch } from 'vue';
  import { fetchHouseDetail } from '@/api';
  
  // ✅ 接收 props
  const props = defineProps({
    unitId: String,
    token: {
      type: String,
      default: 'anxi111003'
    }
  });
  
  const houseDetail = ref(null);
  const loading = ref(false);
  const snackbar = ref(false);
  const snackbarMessage = ref('');
  
  const houseDetailFields = computed(() => {
    if (!houseDetail.value) return {};
    return {
      棟別: houseDetail.value.building,
      門牌: houseDetail.value.address,
      戶別: houseDetail.value.unit,
      車位: houseDetail.value.parking,
      屋主: houseDetail.value.owner,
      電話: houseDetail.value.phone
        ? `📞 <a href="tel:${houseDetail.value.phone}">${houseDetail.value.phone}</a>` : '',
      驗屋階段: houseDetail.value.inspectionStage,
      預約日期: houseDetail.value.appointmentDate || '尚未預約',
      預約時段: houseDetail.value.appointmentTime || '尚未預約',
      驗屋文件: houseDetail.value.docUrl
        ? `📄 <a href="${houseDetail.value.docUrl}" target="_blank">點我查看驗屋文件</a>` : '無',
      驗屋報告: houseDetail.value.reportUrl
        ? `📄 <a href="${houseDetail.value.reportUrl}" target="_blank">點我查看驗屋報告</a>` : '無'
    };
  });
  
  // 自動載入資料
  watch(
    () => props.unitId,
    async (newUnitId) => {
      if (!newUnitId) return;
      loading.value = true;
      try {
        const result = await fetchHouseDetail(newUnitId, props.token);
        if (result.status === 'success') {
          houseDetail.value = result.data;
        } else {
          throw new Error(result.message);
        }
      } catch (err) {
        snackbarMessage.value = '載入失敗：' + err.message;
        snackbar.value = true;
      } finally {
        loading.value = false;
      }
    },
    { immediate: true }
  );
  </script>
  
  <style scoped>
  .v-card {
    margin-top: 20px;
  }
  </style>
  