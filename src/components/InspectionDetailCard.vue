<template>
  <v-card class="pa-4">
    <v-card-title class="text-h6 text-primary">
      🏠 驗屋戶別資料
    </v-card-title>

    <v-divider class="mb-3" />

    <v-list dense>
      <v-list-item v-for="(value, label) in houseDetailFields" :key="label">
        <v-list-item-title>
          <span class="label-box">{{ label }}</span>
        </v-list-item-title>
        <v-list-item-subtitle>
          <span class="value" v-html="value"></span>
        </v-list-item-subtitle>
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
    屋主: d.owner,
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

/* Label 樣式：灰底、圓角、強調 */
.label-box {
  display: inline-block;
  background-color: #f5f5f5;
  color: #555;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.95rem;
}

/* Value 樣式：黑字、清晰可讀 */
.value {
  color: #212121;
  font-size: 0.95rem;
  word-break: break-word;
}

.value a {
  color: #1976D2;
  text-decoration: none;
}
</style>
