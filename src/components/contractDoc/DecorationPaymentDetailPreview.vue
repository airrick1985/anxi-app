<template>
  <div class="dpd-page">
    <div class="dpd-header">
      <div class="dpd-header-row">
        <span class="dpd-site">{{ data.siteLabel }}：</span>
        <span class="dpd-site-value">{{ data.projectName }}</span>
        <span class="dpd-title">{{ data.headerTitle }}</span>
      </div>
      <div class="dpd-header-row">
        <span class="dpd-site">{{ data.unitLabel }}：</span>
        <span class="dpd-site-value">{{ data.unitId }}</span>
      </div>
    </div>

    <div class="dpd-total">
      <span class="dpd-total-label">工程總價</span>
      <span class="dpd-total-value">計新臺幣 {{ data.zhTotal }}</span>
    </div>

    <div class="dpd-rows">
      <div v-for="row in data.rows" :key="row.seq" class="dpd-row">
        <span class="dpd-seq">{{ row.zhSeq }}、</span>
        <span class="dpd-name">{{ row.name }}</span>
        <span class="dpd-colon">：</span>
        <span class="dpd-amount">新台幣：{{ row.zhAmount }}</span>
      </div>
    </div>

    <div v-if="data.noteText" class="dpd-note">{{ data.noteText }}</div>
  </div>
</template>

<script setup>
defineProps({
  data: { type: Object, required: true },  // buildDecorationPaymentDetailPageData 輸出
});
</script>

<style scoped>
.dpd-page {
  font-family: var(--doc-font, 'Noto Serif TC', 'PMingLiU', serif);
  font-size: 13px; line-height: 1.7; color: #000;
  padding: 10px 14px;
}
.dpd-header { margin-bottom: 12px; }
.dpd-header-row { display: flex; align-items: baseline; }
.dpd-site { font-weight: 700; }
.dpd-site-value { min-width: 120px; }
.dpd-title { flex: 1; text-align: center; font-size: 17px; font-weight: 700; letter-spacing: 6px; }
.dpd-total {
  display: flex; align-items: baseline; gap: 16px;
  font-size: 14px; font-weight: 700; margin-bottom: 10px;
}
.dpd-rows { display: flex; flex-direction: column; gap: 4px; }
.dpd-row { display: flex; align-items: baseline; }
.dpd-seq { min-width: 42px; text-align: right; }
.dpd-name { min-width: 130px; }
.dpd-amount { margin-left: 8px; }
.dpd-note { margin-top: 14px; font-size: 11px; }
</style>
