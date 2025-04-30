<template>
  <v-card class="pa-4">
    <v-card-title class="text-h6 text-primary">
      🏠 驗屋戶別資料
    </v-card-title>

    <v-divider class="mb-3" />

    <v-list dense>
      <v-list-item
        v-for="(value, label) in houseDetailFields"
        :key="label"
        class="info-row"
      >
        <span class="label-box">{{ label }}</span>
        <span class="value" v-html="value"></span>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  detail: Object
});

const houseDetailFields = computed(() => {
  const d = props.detail || {};
  return {
    棟別: d.building,
    門牌: d.address,
    戶別: d.unit,
    車位: d.parking,
    產權人: d.owner,
    電話: d.phone
      ? `📞 <a href="tel:${d.phone}">${d.phone}</a>`
      : '',
    驗屋階段: d.inspectionStage,
    預約日期: d.appointmentDate || '尚未預約',
    預約時段: d.appointmentTime || '尚未預約',
    驗屋文件: d.docUrl
      ? `📄 <a href="${d.docUrl}" target="_blank">點我查看驗屋文件</a>`
      : '無',
    驗屋報告: d.reportUrl
      ? `📄 <a href="${d.reportUrl}" target="_blank">點我查看驗屋報告</a>`
      : '無'
  };
});
</script>

<style scoped>
.v-card {
  margin-top: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.04);
}

/* 每列橫向排版：label 左、value 右 */
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 6px 8px;
  border-bottom: 1px dashed #eee;
  gap: 10px;
}

/* 左側 Label */
.label-box {
  color: #212121;
  font-weight: 500;
  font-size: 0.95rem;
  margin-right: 12px; /* ✅ 加這行讓 LABEL 與 VALUE 有間距 */
}

/* 右側 Value：灰底圓角 */
.value {
  background-color: #f5f5f5;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.95rem;
  color: #212121;
  text-align: right;
  word-break: break-word;
  max-width: 60%;
}

.value a {
  color: #1976D2;
  text-decoration: none;
}
</style>
