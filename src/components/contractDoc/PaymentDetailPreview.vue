<template>
  <div class="pd-page">
    <div class="pd-head">
      <div class="pd-head-row">
        <span class="label">工地名稱：</span>
        <span class="value">{{ data.projectName }}</span>
        <span class="pd-title">{{ pageTitle }}</span>
      </div>
      <div class="pd-head-row">
        <span class="label">房屋代號：</span>
        <span class="value">{{ data.unitId }}</span>
        <span class="unit-note">單位:元</span>
      </div>
    </div>

    <table class="pd-table">
      <colgroup>
        <col style="width:26px" />
        <col style="width:34px" />
        <col />
        <col v-if="showHouse" style="width:24%" />
        <col v-if="showLand" style="width:24%" />
        <col v-if="data.showSignColumn" style="width:23%" />
      </colgroup>
      <thead>
        <tr>
          <th :colspan="3">期別名稱</th>
          <th v-if="showHouse">房屋款</th>
          <th v-if="showLand">土地款</th>
          <th v-if="data.showSignColumn">收款人簽章</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, idx) in data.rows" :key="idx">
          <td v-if="row.groupName && row.groupIndex === 0" class="vert-cell" :rowspan="row.groupSize">
            {{ verticalText(row.groupName) }}
          </td>
          <template v-if="row.groupName">
            <td class="seq">{{ row.seq }}</td>
            <td class="name">{{ row.name }}</td>
          </template>
          <td v-else colspan="3" class="name">{{ row.name }}</td>
          <td v-if="showHouse" class="num">{{ fmtYuan(row.houseAmount) }}</td>
          <td v-if="showLand" class="num">{{ fmtYuan(row.landAmount) }}</td>
          <td v-if="data.showSignColumn"></td>
        </tr>

        <template v-if="data.mode === 'combined'">
          <tr class="sum-row">
            <td colspan="3" class="name">加總</td>
            <td v-if="showHouse" class="num">{{ fmtYuan(data.houseTotal, true) }}</td>
            <td v-if="showLand" class="num">{{ fmtYuan(data.landTotal, true) }}</td>
            <td v-if="data.showSignColumn"></td>
          </tr>
          <tr class="sum-row">
            <td colspan="3" class="name">合計總價</td>
            <td :colspan="(showHouse ? 1 : 0) + (showLand ? 1 : 0)" class="num">
              {{ fmtYuan(data.pageTotal, true) }}
            </td>
            <td v-if="data.showSignColumn"></td>
          </tr>
        </template>
        <tr v-else class="sum-row">
          <td colspan="3" class="name">{{ data.mode === 'house' ? '房屋總價' : '土地總價' }}</td>
          <td class="num">{{ fmtYuan(data.pageTotal, true) }}</td>
          <td v-if="data.showSignColumn"></td>
        </tr>
      </tbody>
    </table>

    <div class="pd-note" v-if="data.noteText">{{ data.noteText }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  data: { type: Object, required: true },  // buildPaymentDetailPageData 輸出
});

const showHouse = computed(() => props.data.mode !== 'land');
const showLand = computed(() => props.data.mode !== 'house');

const pageTitle = computed(() => {
  if (props.data.mode === 'house') return '房屋付款明細表';
  if (props.data.mode === 'land') return '土地付款明細表';
  return '付款明細表';
});

function verticalText(text) {
  return String(text || '').split('').join('\n');
}

// 萬 → 元；0 顯示 '-'（總價列 keepZero 顯示 0）
function fmtYuan(wan, keepZero = false) {
  const n = Math.round((Number(wan) || 0) * 10000);
  if (n === 0 && !keepZero) return '-';
  return n.toLocaleString('en-US');
}
</script>

<style scoped>
.pd-page {
  font-family: 'Noto Serif TC', 'PMingLiU', serif;
  font-size: 13px; color: #000; max-width: 78%;
}
.pd-head { margin-bottom: 10px; padding-left: 6px; }
.pd-head-row { display: flex; align-items: baseline; padding: 3px 0; }
.pd-head .label { white-space: nowrap; }
.pd-head .value { margin-left: 4px; min-width: 110px; }
.pd-title { font-size: 15px; letter-spacing: 3px; margin-left: 36px; }
.pd-head .unit-note { font-size: 11px; margin-left: auto; padding-right: 24px; }
.pd-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.pd-table th, .pd-table td { border: 1px solid #000; padding: 4px 6px; height: 30px; }
.pd-table th { font-weight: 400; text-align: center; }
.pd-table .vert-cell {
  text-align: center; white-space: pre-line; line-height: 1.35; padding: 2px;
}
.pd-table .seq { text-align: center; }
.pd-table .name { text-align: center; }
.pd-table .num { text-align: right; white-space: nowrap; padding-right: 10px; }
.pd-table .sum-row td { height: 30px; }
.pd-note { margin-top: 10px; font-size: 9.5px; }
</style>
