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

      <!-- 車位編號 -->
      <table class="bd-table bd-parking">
        <colgroup>
          <col style="width:13%" /><col style="width:50%" /><col style="width:10.5%" />
          <col style="width:12%" /><col style="width:10%" /><col style="width:4.5%" />
        </colgroup>
        <tbody>
          <tr v-for="(p, i) in parkingRows" :key="i" class="park-row">
            <td v-if="i === 0" class="label" :rowspan="parkingRows.length">車位編號</td>
            <td>{{ p.label }}</td>
            <td class="small" :class="negCls(p.price)">{{ p.price !== null ? `價款 ${fmtWan(p.price)} 萬` : '' }}</td>
            <td class="label rlabel">{{ i === 0 ? '房地價款' : (i === 1 ? '車位價款' : '') }}</td>
            <td class="mid" :class="i === 0 ? negCls(data.housePlusLandPrice) : (i === 1 ? negCls(data.parkingTotal) : '')">
              <template v-if="i === 0">{{ fmtWan(data.housePlusLandPrice) }}</template>
              <template v-else-if="i === 1">{{ fmtWan(data.parkingTotal) }}</template>
            </td>
            <td class="small">{{ i <= 1 ? '萬' : '' }}</td>
          </tr>
        </tbody>
      </table>

      <!-- 面積（左 1 欄跨 6 列 + 中/右各 3 組） -->
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
            <td class="label" rowspan="2">車位</td>
            <td class="val" :class="negCls(a.parkingAreaSqm)">{{ fmtArea(a.parkingAreaSqm) }}</td>
            <td class="unit">㎡</td>
          </tr>
          <tr class="area-row">
            <td class="val" rowspan="3" :class="negCls(a.houseTotalPing)">{{ fmtArea(a.houseTotalPing) }}</td>
            <td class="unit" rowspan="3">坪</td>
            <td class="val" :class="negCls(a.ancillaryPing)">{{ fmtArea(a.ancillaryPing) }}</td>
            <td class="unit">坪</td>
            <td class="val" :class="negCls(a.parkingAreaPing)">{{ fmtArea(a.parkingAreaPing) }}</td>
            <td class="unit">坪</td>
          </tr>
          <tr class="area-row">
            <td class="label sm" rowspan="2" colspan="2">專有部分(合計)</td>
            <td class="val" :class="negCls(a.exclusiveSqm)">{{ fmtArea(a.exclusiveSqm) }}</td>
            <td class="unit">㎡</td>
            <td class="label sm" rowspan="2">土地持分<br /><span v-if="a.landShareRatio" class="ratio">{{ a.landShareRatio }}/100000</span></td>
            <td class="val" :class="negCls(a.landShareSqm)">{{ fmtArea(a.landShareSqm) }}</td>
            <td class="unit">㎡</td>
          </tr>
          <tr class="area-row">
            <td class="val" :class="negCls(a.exclusivePing)">{{ fmtArea(a.exclusivePing) }}</td>
            <td class="unit">坪</td>
            <td class="val" :class="negCls(a.landSharePing)">{{ fmtArea(a.landSharePing) }}</td>
            <td class="unit">坪</td>
          </tr>
          <tr v-if="hasTerrace" class="area-row">
            <td class="label sm" colspan="4">露臺(不計坪)</td>
            <td class="val" colspan="3" :class="negCls(a.terracePing)">{{ fmtArea(a.terracePing) }} 坪</td>
            <td colspan="3"></td>
          </tr>
        </tbody>
      </table>

      <!-- 價款區 -->
      <table class="bd-table bd-price" v-if="data.priceFields.length">
        <tbody>
          <template v-if="knownLayout">
            <tr>
              <td class="pcell w-22" rowspan="2"><span class="plabel">房屋款：</span><span class="pval" :class="pfNegCls(byKey.houseAmount)">{{ pv(byKey.houseAmount) }}</span></td>
              <td class="pcell w-30"><span class="plabel sm">{{ byKey.mainAmount.label }}：</span><span class="pval" :class="pfNegCls(byKey.mainAmount)">{{ pv(byKey.mainAmount) }}</span></td>
              <td class="pcell w-24" rowspan="2"><span class="plabel sm">{{ byKey.exclusiveAmount.label }}：</span><span class="pval" :class="pfNegCls(byKey.exclusiveAmount)">{{ pv(byKey.exclusiveAmount) }}</span></td>
              <td class="pcell w-24" rowspan="2"><span class="plabel sm">{{ byKey.commonAmount.label }}：</span><span class="pval" :class="pfNegCls(byKey.commonAmount)">{{ pv(byKey.commonAmount) }}</span></td>
            </tr>
            <tr>
              <td class="pcell"><span class="plabel sm">{{ byKey.ancillaryAmount.label }}：</span><span class="pval" :class="pfNegCls(byKey.ancillaryAmount)">{{ pv(byKey.ancillaryAmount) }}</span></td>
            </tr>
            <tr v-if="extraPriceFields.length">
              <td class="pcell" :colspan="4">
                <span v-for="f in extraPriceFields" :key="f.key" class="extra-price" :class="[{ 'error-text': f.error }, pfNegCls(f)]">
                  {{ f.label }}：{{ pv(f) }}
                </span>
              </td>
            </tr>
          </template>
          <template v-else>
            <tr>
              <td class="pcell">
                <span v-for="f in data.priceFields" :key="f.key" class="extra-price" :class="[{ 'error-text': f.error }, pfNegCls(f)]">
                  {{ f.label }}：{{ pv(f) }}
                </span>
              </td>
            </tr>
          </template>
        </tbody>
      </table>

      <!-- 付款明細（橫式、兩層表頭 + 直排標籤） -->
      <table class="bd-table bd-install" v-if="data.installment.columns.length">
        <tbody>
          <tr>
            <td class="vert" :rowspan="6">付<br />款<br />明<br />細</td>
            <td class="label unit-cell" rowspan="2">單位:萬</td>
            <template v-for="col in data.installment.columns" :key="col.name">
              <td v-if="col.type === 'single'" class="label head" rowspan="2">{{ col.name }}</td>
              <td v-else class="label head" :colspan="col.children.length">{{ col.name }}</td>
            </template>
            <td class="label head" rowspan="2">總價</td>
          </tr>
          <tr>
            <template v-for="col in data.installment.columns" :key="col.name">
              <template v-if="col.type === 'group'">
                <td v-for="(c, j) in col.children" :key="c.name" class="seq-cell" :title="c.name">{{ c.seq ?? (j + 1) }}</td>
              </template>
            </template>
          </tr>
          <tr>
            <td class="label rowlabel">房屋 {{ pct(data.housePriceRatio) }}</td>
            <template v-for="col in data.installment.columns" :key="col.name">
              <td v-if="col.type === 'single'" class="num" :class="negCls(col.houseAmount)">{{ fmtWan(col.houseAmount) }}</td>
              <template v-else>
                <td v-for="c in col.children" :key="c.name" class="num" :class="negCls(c.houseAmount)" :title="c.name">{{ fmtWan(c.houseAmount) }}</td>
              </template>
            </template>
            <td class="num strong" :class="negCls(data.installment.houseTotal)">{{ fmtWan(data.installment.houseTotal) }}</td>
          </tr>
          <tr>
            <td class="label rowlabel">土地 {{ pct(data.landPriceRatio) }}</td>
            <template v-for="col in data.installment.columns" :key="col.name">
              <td v-if="col.type === 'single'" class="num" :class="negCls(col.landAmount)">{{ fmtWan(col.landAmount) }}</td>
              <template v-else>
                <td v-for="c in col.children" :key="c.name" class="num" :class="negCls(c.landAmount)">{{ fmtWan(c.landAmount) }}</td>
              </template>
            </template>
            <td class="num strong" :class="negCls(data.installment.landTotal)">{{ fmtWan(data.installment.landTotal) }}</td>
          </tr>
          <tr>
            <td class="label rowlabel">合計</td>
            <template v-for="col in data.installment.columns" :key="col.name">
              <td v-if="col.type === 'single'" class="num strong" :class="negCls(col.amount)">{{ fmtWan(col.amount) }}</td>
              <template v-else>
                <td v-for="c in col.children" :key="c.name" class="num strong" :class="negCls(c.amount)">{{ fmtWan(c.amount) }}</td>
              </template>
            </template>
            <td class="num strong" :class="negCls(data.installment.grandTotal)">{{ fmtWan(data.installment.grandTotal) }}</td>
          </tr>
          <tr>
            <td class="pct-cell"></td>
            <td v-if="leadingSingles.count" class="pct-cell" :colspan="leadingSingles.count">{{ pct(leadingSingles.percent) }}</td>
            <template v-for="col in trailingColumns" :key="col.name">
              <td v-if="col.type === 'single'" class="pct-cell">{{ pct(col.percent) }}</td>
              <td v-else class="pct-cell" :colspan="col.children.length">{{ pct(col.percent) }}</td>
            </template>
            <td class="pct-cell strong">100%</td>
          </tr>
        </tbody>
      </table>

      <!-- 備註 -->
      <table class="bd-table">
        <colgroup><col style="width:13%" /><col /></colgroup>
        <tbody>
          <tr>
            <td class="label">備註</td>
            <td class="remark-head-cell"></td>
          </tr>
          <tr>
            <td class="remark-cell" colspan="2">{{ data.remark }}</td>
          </tr>
        </tbody>
      </table>

      <!-- 磋商條款（彈性區） -->
      <div class="bd-clauses">
        <div v-for="c in data.clauses" :key="c.id" class="bd-clause">{{ c.content }}</div>
      </div>

      <!-- 自由欄位（右半） -->
      <div class="bd-free-wrap" v-if="data.freeFields.length">
        <table class="bd-table bd-free">
          <tbody>
            <tr>
              <td v-for="f in data.freeFields" :key="f.key" class="label free-head">{{ f.label }}</td>
            </tr>
            <tr>
              <td v-for="f in data.freeFields" :key="f.key" class="free-value">
                {{ (f.value === null || f.value === undefined || f.value === '') ? '' : (f.type === 'number' ? fmtWan(f.value) : f.value) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

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
  data: { type: Object, required: true },  // buildBreakdownPageData 輸出
});

const a = computed(() => props.data.areas || {});

// 車位列：至少顯示兩列（對齊 房地價款 / 車位價款 標籤）
const parkingRows = computed(() => {
  const spots = props.data.parkingSpots || [];
  const rows = spots.map(p => ({ label: p.label, price: p.price }));
  while (rows.length < 2) rows.push({ label: rows.length === 0 ? '無' : '', price: null });
  return rows;
});

const hasTerrace = computed(() => {
  const t = Number(props.data.areas?.terracePing);
  return Number.isFinite(t) && t > 0;
});

// 價款區：標準 5 欄位版面（範本樣式）
const KNOWN_KEYS = ['houseAmount', 'mainAmount', 'ancillaryAmount', 'exclusiveAmount', 'commonAmount'];
const byKey = computed(() => Object.fromEntries((props.data.priceFields || []).map(f => [f.key, f])));
const knownLayout = computed(() => KNOWN_KEYS.every(k => byKey.value[k]));
const extraPriceFields = computed(() => (props.data.priceFields || []).filter(f => !KNOWN_KEYS.includes(f.key)));

// 比例列：前導連續 single 合併（範本：訂金+簽約金 5%）
// 只合併到「第一個有比例的期別」為止，避免全 single 期款方式被整排合併成單一 100%
const leadingSingles = computed(() => {
  const cols = props.data.installment?.columns || [];
  let count = 0, percent = 0;
  for (const col of cols) {
    if (col.type !== 'single') break;
    count += 1;
    percent += Number(col.percent) || 0;
    if (percent > 0) break;
  }
  return { count, percent };
});
const trailingColumns = computed(() => {
  const cols = props.data.installment?.columns || [];
  return cols.slice(leadingSingles.value.count);
});

function fmtWan(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function fmtWan1(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function pv(f) {
  if (!f) return '';
  return f.error ? '公式錯誤' : `${fmtWan1(f.value)}萬`;
}

function fmtArea(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n === 0) return '-';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pct(v) {
  const n = Number(v) || 0;
  return `${Number.isInteger(n) ? n : Math.round(n * 100) / 100}%`;
}

// 負數欄位標示：面積/價款/付款明細不得為負（與 collectBreakdownNegatives 同判定）
function negCls(v) {
  const n = Number(v);
  return (Number.isFinite(n) && n < 0) ? 'neg-cell' : '';
}
// 價款項目：label 含「溢差」者可為負，不標示
function pfNegCls(f) {
  if (!f || String(f.label || '').includes('溢差')) return '';
  return negCls(f.value);
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
.bd-table {
  width: 100%; border-collapse: collapse; table-layout: fixed;
}
.bd-table td {
  border: 1px solid #000; padding: 2px 4px;
  vertical-align: middle; text-align: center; overflow: hidden;
}
.bd-table .label { font-weight: 700; }
.bd-table .label.sm { font-size: 10px; }
.info-row td { height: 30px; }
.info-row .big { font-size: 14px; }
.info-row .mid { font-size: 12px; }
.park-row td { height: 25px; }
.park-row .small { font-size: 9.5px; }
.park-row .rlabel { font-size: 9.5px; }
.park-row .mid { font-size: 12px; }
.area-row td { height: 24px; }
.area-row .val { font-size: 11.5px; }
.area-row .unit { font-size: 9px; padding: 0 1px; }
.area-row .sub-cell { font-size: 9.5px; }
.area-row .ratio { font-weight: 700; font-size: 9.5px; }
.bd-price .pcell { height: 25px; text-align: left; padding: 2px 6px; position: relative; }
.bd-price .plabel { font-weight: 700; font-size: 10.5px; }
.bd-price .plabel.sm { font-size: 9.5px; }
.bd-price .pval { float: right; font-size: 11px; }
.bd-price .extra-price { margin-right: 18px; font-size: 10.5px; }
.w-22 { width: 22%; } .w-30 { width: 30%; } .w-24 { width: 24%; }
.error-text { color: #c00000; }
/* 負數異常欄位：明顯標紅（此狀態下無法下載，見 ContractDocDialog 攔截） */
.bd-table td.neg-cell,
.bd-price span.neg-cell {
  background: #ffe0e0;
  color: #c00000 !important;
  font-weight: 700;
  box-shadow: inset 0 0 0 2px #c00000;
}
.bd-price span.neg-cell { padding: 0 3px; border-radius: 2px; }
.bd-install td { padding: 1px 2px; font-size: 9.5px; height: 20px; }
.bd-install .vert { width: 20px; font-weight: 700; font-size: 11px; line-height: 1.6; }
.bd-install .unit-cell { width: 46px; font-size: 8.5px; }
.bd-install .head { font-size: 9.5px; padding: 1px 1px; }
.bd-install .seq-cell { font-weight: 700; font-size: 8.5px; height: 14px; }
.bd-install .rowlabel { font-size: 9px; white-space: nowrap; }
.bd-install .num { text-align: center; }
.bd-install .strong { font-weight: 700; }
.bd-install .pct-cell { font-size: 9px; height: 15px; }
.remark-head-cell { height: 22px; }
.remark-cell { height: 22px; text-align: left !important; vertical-align: top; white-space: pre-wrap; line-height: 1.35; padding: 3px 5px; }
.bd-clauses { flex: 1 1 auto; padding: 5px 8px; min-height: 40px; }
.bd-clause { white-space: pre-wrap; font-size: 10px; margin-bottom: 8px; text-align: left; }
.bd-clause:last-child { margin-bottom: 0; }
.bd-free-wrap { display: flex; justify-content: flex-end; }
.bd-free { width: 55%; }
.bd-free .free-head { height: 18px; font-size: 10px; }
.bd-free .free-value { height: 20px; }
.sign-head { height: 20px; }
.sign-value { height: 34px; font-size: 12px; }
</style>
