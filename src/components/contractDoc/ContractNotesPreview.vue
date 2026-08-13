<template>
  <div class="notes-page">
    <div v-for="n in data.notes" :key="n.id" class="note-block" :style="{ fontSize: `${n.fontSize}pt` }">
      {{ n.content }}
    </div>
    <div v-if="!data.notes.length" class="text-grey empty-hint">（尚無加註內容）</div>
    <div v-if="data.showBuyerSignLine && data.notes.length" class="buyer-sign">
      買方簽名：＿＿＿＿＿＿＿＿＿
    </div>
    <div v-if="(data.repeatCount || 1) > 1" class="repeat-hint">
      ✂ 匯出時本頁將重複 {{ data.repeatCount }} 份（等分裁切）
    </div>
  </div>
</template>

<script setup>
defineProps({
  data: { type: Object, required: true },  // buildContractNotesPageData 輸出
});
</script>

<style scoped>
.notes-page {
  font-family: 'Noto Serif TC', 'PMingLiU', serif;
  color: #000;
  border: 1px dashed #bbb;
  padding: 14px 16px;
  min-height: 96%;
}
.note-block {
  white-space: pre-wrap;
  line-height: 1.75;
  margin-bottom: 16px;
}
.buyer-sign {
  text-align: right;
  margin-top: 24px;
  padding-right: 28px;
  font-size: 12pt;
}
.empty-hint { font-size: 11px; }
.repeat-hint { margin-top: 20px; font-size: 10px; color: #888; border-top: 1px dashed #aaa; padding-top: 4px; }
</style>
