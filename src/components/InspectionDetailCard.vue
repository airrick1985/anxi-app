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
    電話: d.phone ? `📞 <a href="tel:${d.phone}">${d.phone}</a>` : '',
    驗屋階段: d.inspectionStage,
    預約日期: d.appointmentDate || '尚未預約',
    預約時段: d.appointmentTime || '尚未預約',
    驗屋文件: d.docUrl
      ? `📄 <a href="${d.docUrl}" target="_blank">點我查看驗屋文件</a>` : '無',
    驗屋報告: d.reportUrl
      ? `📄 <a href="${d.reportUrl}" target="_blank">點我查看驗屋報告</a>` : '無'
  };
});
</script>

<style scoped>
.v-card {
  margin-top: 20px;
}
</style>
