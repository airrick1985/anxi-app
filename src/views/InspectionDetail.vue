<template>
  <v-card class="pa-4">
    <v-card-title class="text-h6 text-primary">
      🏠 驗屋戶別資料
    </v-card-title>

    <v-divider class="mb-3" />

    <div class="info-grid">
      <div v-for="(value, label) in houseDetailFields" :key="label" class="info-row">
        <span class="label">{{ label }}</span>
        <span class="colon">：</span>
<!-- 驗屋文件 -->
<span class="value" v-if="label === '驗屋文件' && detail.docUrl">
          📄 <span class="link" @click="openLink(detail.docUrl)">點我查看驗屋文件</span>
        </span>
        <span class="value" v-else-if="label === '驗屋文件'">無</span>

        <!-- 驗屋報告 -->
        <span class="value" v-else-if="label === '驗屋報告' && detail.reportUrl">
          📄 <span class="link" @click="openLink(detail.reportUrl)">點我查看驗屋報告</span>
        </span>
        <span class="value" v-else-if="label === '驗屋報告'">無</span>

        <span class="value" v-html="value" />
      </div>
    </div>
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
      ? `📞 <a href="tel:${d.phone}" style="color: inherit; text-decoration: none;">${d.phone}</a>`
      : '',
    驗屋階段: d.inspectionStage,
    預約日期: d.appointmentDate || '尚未預約',
    預約時段: d.appointmentTime || '尚未預約',
    驗屋文件: d.docUrl,
    驗屋報告: d.reportUrl
  };
});

const openLink = (url) => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (isStandalone) {
    window.location.href = url;
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
</script>

<style scoped>
.v-card {
  margin-top: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.04);
}

/* Grid container */
.info-grid {
  display: grid;
  row-gap: 12px;
  column-gap: 8px;
  grid-template-columns: auto auto 1fr;
  font-size: 15px;
  line-height: 1.5;
}

/* 每一列項目 */
.info-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap; /* ✅ 小螢幕可自動換行 */
}

/* Label 欄位樣式 */
.label {
  font-weight: bold;
  color: #333;
  background-color: #f5f5f5;
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 0.95rem;
}

/* 分隔符號樣式 */
.colon {
  color: #aaa;
  margin: 0 4px;
}

/* Value 內容樣式 */
.value {
  color: #212121;
  word-break: break-word;
}

.value a {
  color: #1976D2;
  text-decoration: none;
}

.link {
  color: #1976D2;
  text-decoration: underline;
  cursor: pointer;
}
</style>
