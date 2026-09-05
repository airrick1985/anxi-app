<template>
  <div class="bd-page">
    <div class="bd-frame">
      <div class="bd-title">{{ data.headerTitle }}</div>

      <!-- 基本資訊 -->
      <table class="bd-table bd-info">
        <colgroup>
          <col style="width:13%" /><col style="width:19%" /><col style="width:11.5%" />
          <col style="width:17%" /><col style="width:13.5%" /><col style="width:26%" />
        </colgroup>
        <tbody>
          <tr class="info-row">
            <td class="label">個案名稱</td>
            <td class="big">{{ data.projectName }}</td>
            <td class="label">客戶姓名</td>
            <td class="mid">{{ data.buyerName }}</td>
            <td class="label">身分證字號</td>
            <td class="mid">{{ data.buyerIdNumber }}</td>
          </tr>
          <tr class="info-row">
            <td class="label">房屋編號</td>
            <td class="big">{{ data.unitId }}</td>
            <td class="label">總　價</td>
            <td class="big" :class="negCls(data.totalPrice)">{{ fmtWan(data.totalPrice) }}</td>
            <td class="label">聯絡電話</td>
            <td class="mid">{{ data.buyerPhone }}</td>
          </tr>
          <tr class="info-row">
            <td class="label">地　址</td>
            <td colspan="3">{{ data.address }}</td>
            <td class="label">簽約日期</td>
            <td>{{ data.signDate }}</td>
          </tr>
        </tbody>
      </table>

      <!-- 面積（無車位/土地持分） -->
      <table class="bd-table bd-area">
        <colgroup>
          <col style="width:13%" /><col style="width:10.5%" /><col style="width:4%" />
          <col style="width:11.5%" /><col style="width:8.5%" /><col style="width:10.5%" /><col style="width:4%" />
          <col style="width:15%" /><col style="width:19%" /><col style="width:4%" />
        </colgroup>
        <tbody>
          <tr class="area-row">
            <td class="label" rowspan="6">房屋總面積</td>
            <td class="val" rowspan="3" :class="negCls(a.houseTotalSqm)">{{ fmtArea(a.houseTotalSqm) }}</td>
            <td class="unit" rowspan="3">㎡</td>
            <td class="label" rowspan="2">主建物</td>
            <td class="sub-cell">占比</td>
            <td class="val" :class="negCls(a.mainSqm)">{{ fmtArea(a.mainSqm) }}</td>
            <td class="unit">㎡</td>
            <td class="label" rowspan="2">共有部份</td>
            <td class="val" :class="negCls(a.commonSqm)">{{ fmtArea(a.commonSqm) }}</td>
            <td class="unit">㎡</td>
          </tr>
          <tr class="area-row">
            <td class="sub-cell">{{ a.mainRatioText }}</td>
            <td class="val" :class="negCls(a.mainPing)">{{ fmtArea(a.mainPing) }}</td>
            <td class="unit">坪</td>
            <td class="val" :class="negCls(a.commonPing)">{{ fmtArea(a.commonPing) }}</td>
            <td class="unit">坪</td>
          </tr>
          <tr class="area-row">
            <td class="label sm" rowspan="2" colspan="2">附屬建物(陽台)</td>
            <td class="val" :class="negCls(a.ancillarySqm)">{{ fmtArea(a.ancillarySqm) }}</td>
            <td class="unit">㎡</td>
            <td rowspan="4" colspan="3" class="blank-cell"></td>
          </tr>
          <tr class="area-row">
            <td class="val" rowspan="3" :class="negCls(a.houseTotalPing)">{{ fmtArea(a.houseTotalPing) }}</td>
            <td class="unit" rowspan="3">坪</td>
            <td class="val" :class="negCls(a.ancillaryPing)">{{ fmtArea(a.ancillaryPing) }}</td>
            <td class="unit">坪</td>
          </tr>
          <tr class="area-row">
            <td class="label sm" rowspan="2" colspan="2">專有部分(合計)</td>
            <td class="val" :class="negCls(a.exclusiveSqm)">{{ fmtArea(a.exclusiveSqm) }}</td>
            <td class="unit">㎡</td>
          </tr>
          <tr class="area-row">
            <td class="val" :class="negCls(a.exclusivePing)">{{ fmtArea(a.exclusivePing) }}</td>
            <td class="unit">坪</td>
          </tr>
        </tbody>
      </table>

      <!-- 付款明細（單列「裝修工程款」＋備註併入同一區塊，直排標籤跨全區） -->
      <table class="bd-table bd-install" v-if="columns.length">
        <tbody>
          <tr>
            <td class="vert" :rowspan="4">付<br />款<br />明<br />細</td>
            <td class="label unit-cell" rowspan="2">單位:萬</td>
            <template v-for="col in columns" :key="col.name">
              <td v-if="col.type === 'single'" class="label head" rowspan="2">{{ col.name }}</td>
              <td v-else class="label head" :colspan="col.children.length">{{ col.name }}</td>
            </template>
            <td class="label head" rowspan="2">總價</td>
          </tr>
          <tr>
            <template v-for="col in columns" :key="col.name">
              <template v-if="col.type === 'group'">
                <td v-for="(c, j) in col.children" :key="c.name" class="seq-cell" :title="c.name">{{ c.seq ?? (j + 1) }}</td>
              </template>
            </template>
          </tr>
          <tr>
            <td class="label rowlabel">{{ data.installment.rowLabel }}</td>
            <template v-for="col in columns" :key="col.name">
              <td v-if="col.type === 'single'" class="num" :class="negCls(col.amount)">{{ fmtWan(col.amount) }}</td>
              <template v-else>
                <td v-for="c in col.children" :key="c.name" class="num" :class="negCls(c.amount)" :title="c.name">{{ fmtWan(c.amount) }}</td>
              </template>
            </template>
            <td class="num strong" :class="negCls(data.installment.grandTotal) || mismatchCls(data.installment.grandTotal, data.totalPrice)"
              :title="mismatchCls(data.installment.grandTotal, data.totalPrice) ? `各期合計 ${fmtWan(data.installment.grandTotal)} 萬 ≠ 配套價格 ${fmtWan(data.totalPrice)} 萬` : ''">{{ fmtWan(data.installment.grandTotal) }}</td>
          </tr>
          <tr>
            <td class="label rowlabel">備註</td>
            <td class="remark-cell" :colspan="leafCount + 1">{{ data.remark }}</td>
          </tr>
        </tbody>
      </table>

      <!-- 無期款資料時的備註（獨立列） -->
      <table class="bd-table bd-remark" v-else>
        <colgroup><col style="width:13%" /><col /></colgroup>
        <tbody>
          <tr>
            <td class="label">備註</td>
            <td class="remark-cell">{{ data.remark }}</td>
          </tr>
        </tbody>
      </table>
      <div class="bd-spacer"></div>

      <!-- 簽核欄 -->
      <table class="bd-table" v-if="data.signFields.length">
        <tbody>
          <tr>
            <td v-for="(f, i) in data.signFields" :key="i" class="label sign-head">{{ f.label }}</td>
          </tr>
          <tr>
            <td v-for="(f, i) in data.signFields" :key="i" class="sign-value">{{ f.value }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  data: { type: Object, required: true },  // buildDecorationBreakdownPageData 輸出
});

const a = computed(() => props.data.areas || {});
const columns = computed(() => props.data.installment?.columns || []);
const leafCount = computed(() =>
  columns.value.reduce((s, c) => s + (c.type === 'group' ? c.children.length : 1), 0));

function fmtWan(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function fmtArea(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n === 0) return '-';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// 負數欄位標示：配套價格/面積/裝修期款不得為負（與 collectDecorationBreakdownNegatives 同判定）
function negCls(v) {
  const n = Number(v);
  return (Number.isFinite(n) && n < 0) ? 'neg-cell' : '';
}
// 裝修期款合計與配套價格不符（手動調整後未補正）：標紅提醒，此狀態下同樣無法下載
function mismatchCls(sum, total) {
  const s = Number(sum); const t = Number(total);
  if (!Number.isFinite(s) || !Number.isFinite(t) || t === 0) return '';
  return Math.abs(s - t) >= 0.5 ? 'neg-cell' : '';
}
</script>

<style scoped>
.bd-page {
  font-family: var(--doc-font, 'Noto Sans TC', 'Microsoft JhengHei', sans-serif);
  font-size: 11px; line-height: 1.45; color: #000;
}
.bd-frame { border: 2px solid #000; display: flex; flex-direction: column; min-height: 100%; }
.bd-title {
  text-align: center; font-size: 19px; font-weight: 700;
  letter-spacing: 10px; padding: 6px 0; border-bottom: 1px solid #000;
}
.bd-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.bd-table td {
  border: 1px solid #000; padding: 2px 4px;
  vertical-align: middle; text-align: center; overflow: hidden;
}
.bd-table .label { font-weight: 700; }
.bd-table .label.sm { font-size: 10px; }
.info-row td { height: 30px; }
.info-row .big { font-size: 14px; }
.info-row .mid { font-size: 12px; }
.area-row td { height: 24px; }
.area-row .val { font-size: 11.5px; }
.area-row .unit { font-size: 9px; padding: 0 1px; }
.area-row .sub-cell { font-size: 9.5px; }
/* 負數異常欄位：明顯標紅（此狀態下無法下載，見 ContractDocDialog 攔截） */
.bd-table td.neg-cell {
  background: #ffe0e0;
  color: #c00000 !important;
  font-weight: 700;
  box-shadow: inset 0 0 0 2px #c00000;
}
.bd-install td { padding: 1px 2px; font-size: 9.5px; height: 20px; }
.bd-install .vert { width: 20px; font-weight: 700; font-size: 11px; line-height: 1.6; }
.bd-install .unit-cell { width: 46px; font-size: 8.5px; }
.bd-install .head { font-size: 9.5px; padding: 1px 1px; }
.bd-install .seq-cell { font-weight: 700; font-size: 8.5px; height: 14px; }
.bd-install .rowlabel { font-size: 9px; white-space: nowrap; }
.bd-install .num { text-align: center; }
.bd-install .strong { font-weight: 700; }
.remark-cell { height: 60px; text-align: left !important; vertical-align: top !important; white-space: pre-wrap; }
.bd-spacer { flex: 1 1 auto; min-height: 20px; }
.sign-head { height: 20px; }
.sign-value { height: 34px; font-size: 12px; }
</style>
