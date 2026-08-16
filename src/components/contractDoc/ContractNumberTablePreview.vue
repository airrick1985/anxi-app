<template>
  <div class="cnt-page">
    <!-- 資料警示（僅預覽顯示，不進 PDF/EXCEL） -->
    <div v-if="(data.warnings || []).length" class="cnt-warnings">
      <div v-for="(w, i) in data.warnings" :key="i">⚠ {{ w }}</div>
    </div>

    <template v-for="(sec, si) in sections" :key="si">
      <div class="cnt-title" :class="{ mt: si > 0 }">{{ sec.title }}</div>
      <div class="cnt-table">
        <div v-for="(row, ri) in sec.rows" :key="ri" class="cnt-row">
          <div v-for="(c, ci) in row.cells" :key="ci" class="cnt-cell"
            :class="{ 'is-blue': c.blue, 'is-bold': c.bold }"
            :style="{ flexGrow: c.w || 1 }">{{ c.t }}</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  data: { type: Object, required: true },   // buildContractNumberTable(Combined)PageData 輸出
});

const sections = computed(() => props.data.sections || []);
</script>

<style scoped>
/* 印泥藍：與後端 contractDocument.js STAMP_BLUE 同值 */
.cnt-page {
  font-family: var(--doc-font, 'DFKai-SB', '標楷體', 'BiauKai', 'TW-Kai', 'KaiTi', serif);
  font-size: 11.5px;
  line-height: 1.35;
  color: #000;
}
.cnt-warnings {
  border: 1px solid #f5c2c7;
  background: #fdf3f4;
  color: #b02a37;
  font-size: 11px;
  font-family: 'Noto Sans TC', 'Microsoft JhengHei', sans-serif;
  padding: 6px 10px;
  margin-bottom: 8px;
  border-radius: 4px;
}
.cnt-title {
  text-align: center;
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 2px;
  padding: 4px 0;
}
.cnt-title.mt { margin-top: 12px; }
.cnt-table {
  border: 2px solid #000;
}
.cnt-row {
  display: flex;
  border-bottom: 1px solid #000;
  min-height: 27px;
}
.cnt-row:last-child { border-bottom: none; }
.cnt-cell {
  flex-basis: 0;
  flex-shrink: 0;
  border-right: 1px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1px 2px;
  overflow: hidden;
  white-space: nowrap;
}
.cnt-cell:last-child { border-right: none; }
.cnt-cell.is-bold { font-weight: 700; }
.cnt-cell.is-blue {
  color: #1E50A2;
  font-weight: 700;
  font-size: 16px;
}
</style>
