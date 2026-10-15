<template>
  <div class="usage-sheet">
    <header class="us-header">
      <div>
        <div class="us-company">{{ meta.company?.name }}</div>
        <div class="us-company-en">{{ meta.company?.nameEn }}</div>
      </div>
      <div class="us-title-block">
        <div class="us-title">使用狀況報表</div>
        <div class="us-subtitle">SYSTEM USAGE REPORT</div>
      </div>
    </header>
    <div class="us-rule-thick"></div>

    <section class="us-info">
      <div class="us-info-row"><span>建案</span><b>{{ meta.projectName || '—' }}</b></div>
      <div class="us-info-row"><span>系統功能</span><b>{{ meta.systemFunction }}</b></div>
      <div class="us-info-row">
        <span>買受人</span>
        <b>{{ meta.billTo?.name || '—' }}<small v-if="meta.billTo?.taxId">（統編 {{ meta.billTo.taxId }}）</small></b>
      </div>
      <div class="us-info-row">
        <span>統計期間</span>
        <b v-if="report.period.start">
          {{ slash(report.period.start) }} ～ {{ slash(report.period.end) }}
          <small v-if="report.period.notStarted">（尚未開始）</small>
          <small v-else>（共 {{ num(report.period.days) }} 天）</small>
        </b>
        <b v-else>—</b>
      </div>
    </section>

    <!-- ① 預約概況 -->
    <section class="us-section">
      <div class="us-section-head"><span class="us-no">1</span>預約概況</div>
      <div class="us-kpis">
        <div v-for="k in overviewKpis" :key="k.label" class="us-kpi" :class="{ 'is-main': k.main }">
          <div class="us-kpi-label">{{ k.label }}</div>
          <div class="us-kpi-value">{{ k.value }}<small v-if="k.unit">{{ k.unit }}</small></div>
          <div class="us-kpi-sub">{{ k.sub || '' }}</div>
        </div>
      </div>
    </section>

    <!-- ② 各預約項目明細 -->
    <section class="us-section">
      <div class="us-section-head"><span class="us-no">2</span>各預約項目明細</div>
      <table class="us-table">
        <thead>
          <tr>
            <th class="is-left">預約項目</th>
            <th>批次</th>
            <th class="is-left">開放期間</th>
            <th>預約筆數</th>
            <th>預約戶數</th>
            <th>已完成</th>
            <th>取消</th>
            <th class="is-left">戶數覆蓋率</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in report.items" :key="item.type">
            <td class="is-left us-strong">{{ item.type }}</td>
            <td>{{ item.batchCount || '—' }}</td>
            <td class="is-left us-mono">{{ rangeText(item.openStart, item.openEnd) }}</td>
            <td class="us-strong">{{ num(item.total) }}</td>
            <td>{{ num(item.units) }}</td>
            <td>{{ num(item.completed) }}</td>
            <td>{{ num(item.cancelled) }}</td>
            <td class="is-left">
              <div class="us-cov">
                <div class="us-cov-track"><div class="us-cov-fill" :style="{ width: `${Math.min(item.coverage || 0, 100)}%` }"></div></div>
                <span>{{ pct(item.coverage) }}</span>
              </div>
            </td>
          </tr>
          <tr v-if="!report.items.length">
            <td colspan="8" class="us-empty">尚無預約項目資料</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- ③ 預約來源與預約方式 -->
    <section class="us-section">
      <div class="us-section-head">
        <span class="us-no">3</span>預約來源與預約方式
        <span class="us-section-note">依有效預約 {{ num(report.validCount) }} 筆</span>
      </div>
      <div v-for="bar in shareBars" :key="bar.key" class="us-share">
        <div class="us-share-title">
          {{ bar.title }}<span v-if="bar.showCount" class="us-share-count">{{ num(bar.total) }} 筆</span>
        </div>
        <div class="us-share-track">
          <template v-for="seg in bar.segments" :key="seg.label">
            <div v-if="seg.count > 0" class="us-share-seg" :style="{ flexGrow: seg.count, background: seg.color }"></div>
          </template>
          <div v-if="!bar.total" class="us-share-seg is-empty"></div>
        </div>
        <div class="us-legend">
          <span v-for="seg in bar.segments" :key="seg.label" class="us-legend-item">
            <i :style="{ background: seg.color }"></i>{{ seg.label }}
            <b>{{ num(seg.count) }}</b>
            <em>{{ pct(percentOf(seg.count, bar.total)) }}</em>
          </span>
        </div>
        <div v-if="bar.key === 'source' && report.methodsByItem.length" class="us-share-sub">預約方式（依預約項目）</div>
      </div>
    </section>

    <!-- ④ 名額與報告提醒 -->
    <section class="us-section">
      <div class="us-section-head"><span class="us-no">4</span>名額與報告提醒</div>
      <div class="us-kpis is-split">
        <div v-for="k in quotaKpis" :key="k.label" class="us-kpi">
          <div class="us-kpi-label">{{ k.label }}</div>
          <div class="us-kpi-value">{{ k.value }}<small v-if="k.unit">{{ k.unit }}</small></div>
          <div class="us-kpi-sub">{{ k.sub || '' }}</div>
        </div>
      </div>
      <div class="us-kpis is-split mt">
        <div v-for="k in reportKpis" :key="k.label" class="us-kpi">
          <div class="us-kpi-label">{{ k.label }}</div>
          <div class="us-kpi-value">{{ k.value }}<small v-if="k.unit">{{ k.unit }}</small></div>
          <div class="us-kpi-sub">{{ k.sub || '' }}</div>
        </div>
      </div>
    </section>

    <div class="us-spacer"></div>

    <footer class="us-footer">
      <span>不含測試預約；改期以舊單取消、新單重建計為「改期」；名額依統計期間內已開放日期計算。</span>
      <span class="us-footer-time">產製 {{ meta.generatedAt }}</span>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { percent } from '@/utils/bookingUsageReport';

const props = defineProps({
  report: { type: Object, required: true },
  // { company: { name, nameEn }, projectName, systemFunction, billTo: { name, taxId }, generatedAt }
  meta: { type: Object, required: true },
});

// 類別色（固定順序）＋中性灰給「未記錄／未填」
const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];
const NEUTRAL = '#b4b2ab';
const UNNAMED = ['未記錄', '未填'];

const num = (n) => (Number(n) || 0).toLocaleString();
const pct = (v) => (v === null || v === undefined ? '—' : `${v}%`);
const slash = (d) => (d ? d.replace(/-/g, '/') : '');
const percentOf = percent;

function rangeText(start, end) {
  if (!start && !end) return '—';
  return `${slash(start) || '?'} ～ ${slash(end) || '?'}`;
}

const overviewKpis = computed(() => {
  const o = props.report.overview;
  return [
    { label: '預約總筆數', value: num(o.total), main: true },
    { label: '預約中', value: num(o.active) },
    { label: '已完成', value: num(o.completed) },
    { label: '取消', value: num(o.cancelled) },
    { label: '改期', value: num(o.rescheduled) },
    {
      label: '預約戶數',
      value: num(o.units),
      unit: ` / ${num(props.report.householdCount)} 戶`,
      sub: o.coverage === null ? '' : `覆蓋率 ${o.coverage}%`,
    },
  ];
});

// 預約方式的顏色跟著方式名稱走：同一方式在各預約項目同色
const methodColors = computed(() => {
  const map = new Map();
  props.report.methodsByItem.forEach(item => item.methods.forEach(({ label }) => {
    if (map.has(label)) return;
    const named = [...map.keys()].filter(k => !UNNAMED.includes(k)).length;
    map.set(label, UNNAMED.includes(label) ? NEUTRAL : (SERIES[named] || NEUTRAL));
  }));
  return map;
});

const shareBars = computed(() => {
  const r = props.report;
  const sourceSegments = r.sources.map((s, i) => ({ ...s, color: UNNAMED.includes(s.label) ? NEUTRAL : SERIES[i] }));
  return [
    { key: 'source', title: '預約來源', total: r.validCount, segments: sourceSegments },
    ...r.methodsByItem.map(item => ({
      key: `method-${item.type}`,
      title: item.type,
      showCount: true,
      total: item.total,
      segments: item.methods.map(m => ({ ...m, color: methodColors.value.get(m.label) })),
    })),
  ];
});

const quotaKpis = computed(() => {
  const q = props.report.quota;
  return [
    { label: '開放天數', value: num(q.days), unit: ' 天' },
    { label: '開放名額', value: num(q.capacity) },
    { label: '已約名額', value: num(q.booked) },
    { label: '名額使用率', value: q.rate === null ? '—' : `${q.rate}`, unit: q.rate === null ? '' : '%' },
  ];
});

const reportKpis = computed(() => {
  const r = props.report.reports;
  return [
    { label: '應上傳驗屋報告', value: num(r.required), unit: ' 份', sub: '初驗／複驗／驗屋' },
    { label: '已上傳報告', value: num(r.uploaded), unit: ' 份', sub: r.rate === null ? '' : `上傳率 ${r.rate}%` },
    { label: '上傳戶數', value: num(r.units), unit: ' 戶' },
    { label: '提醒信寄送', value: num(r.reminders), unit: ' 封', sub: '未上傳報告提醒' },
  ];
});
</script>

<style scoped>
.usage-sheet {
  position: relative;
  width: 794px;
  min-height: 1123px;
  box-sizing: border-box;
  padding: 48px 60px 36px;
  background: #ffffff;
  color: #111827;
  font-family: 'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', 'Helvetica Neue', Arial, sans-serif;
  display: flex;
  flex-direction: column;
  text-align: left;
}
.us-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.us-company {
  font-size: 26px;
  font-weight: 900;
  letter-spacing: 1px;
  line-height: 1.2;
}
.us-company-en {
  margin-top: 5px;
  font-size: 12px;
  color: #6b7280;
  letter-spacing: 0.8px;
}
.us-title-block {
  text-align: right;
}
.us-title {
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0.25em;
  margin-right: -0.25em;
}
.us-subtitle {
  margin-top: 5px;
  font-size: 10px;
  color: #9ca3af;
  letter-spacing: 1.5px;
}
.us-rule-thick {
  margin-top: 18px;
  height: 4px;
  background: #111827;
}
.us-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 32px;
  margin-top: 16px;
}
.us-info-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  font-size: 13px;
  line-height: 1.5;
  min-width: 0;
}
.us-info-row span {
  flex-shrink: 0;
  width: 56px;
  color: #6b7280;
}
.us-info-row b {
  font-weight: 700;
  overflow-wrap: anywhere;
}
.us-info-row small {
  font-size: 11.5px;
  font-weight: 500;
  color: #6b7280;
}
.us-section {
  margin-top: 22px;
}
.us-section-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 900;
  padding-bottom: 7px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 10px;
}
.us-no {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #111827;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}
.us-section-note {
  margin-left: auto;
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
}
.us-kpis {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr)) minmax(0, 1.6fr);
  gap: 8px;
}
.us-kpis.is-split {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.us-kpis.mt {
  margin-top: 8px;
}
.us-kpi {
  padding: 8px 10px 6px;
  border-radius: 6px;
  background: #f5f6f8;
  min-width: 0;
}
.us-kpi.is-main {
  background: #111827;
  color: #fff;
}
.us-kpi-label {
  font-size: 11px;
  color: #6b7280;
  white-space: nowrap;
}
.us-kpi.is-main .us-kpi-label {
  color: #d1d5db;
}
.us-kpi-value {
  margin-top: 1px;
  font-size: 20px;
  font-weight: 800;
  line-height: 1.25;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.us-kpi-value small {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
}
.us-kpi-sub {
  min-height: 15px;
  font-size: 10.5px;
  color: #6b7280;
  white-space: nowrap;
}
.us-kpi.is-main .us-kpi-sub {
  color: #d1d5db;
}
.us-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.us-table th {
  background: #111827;
  color: #fff;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 8px 8px;
  text-align: right;
  white-space: nowrap;
}
.us-table td {
  padding: 6px 8px;
  text-align: right;
  border-bottom: 1px solid #eef0f3;
  white-space: nowrap;
}
.us-table .is-left {
  text-align: left;
}
.us-strong {
  font-weight: 700;
}
.us-mono {
  font-size: 11px;
  color: #374151;
}
.us-empty {
  text-align: center !important;
  color: #9ca3af;
}
.us-cov {
  display: flex;
  align-items: center;
  gap: 6px;
}
.us-cov-track {
  flex: 1;
  min-width: 40px;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  overflow: hidden;
}
.us-cov-fill {
  height: 100%;
  border-radius: 3px;
  background: #2a78d6;
}
.us-cov span {
  width: 42px;
  text-align: right;
}
.us-share {
  display: grid;
  grid-template-columns: 96px 210px minmax(0, 1fr);
  column-gap: 14px;
  align-items: center;
}
.us-share + .us-share {
  margin-top: 8px;
}
.us-share-title {
  font-size: 12px;
  font-weight: 700;
  line-height: 1.3;
}
.us-share-count {
  margin-left: 6px;
  font-size: 10.5px;
  font-weight: 500;
  color: #6b7280;
  white-space: nowrap;
}
.us-share-sub {
  grid-column: 1 / -1;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed #e5e7eb;
  font-size: 11px;
  font-weight: 700;
  color: #6b7280;
}
.us-share-track {
  display: flex;
  gap: 2px;
  height: 12px;
}
.us-share-seg {
  flex-basis: 0;
  min-width: 4px;
  border-radius: 4px;
}
.us-share-seg.is-empty {
  flex-grow: 1;
  background: #e5e7eb;
}
.us-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 14px;
  font-size: 11px;
  color: #374151;
}
.us-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}
.us-legend-item i {
  width: 9px;
  height: 9px;
  border-radius: 2px;
}
.us-legend-item b {
  font-weight: 700;
  color: #111827;
}
.us-legend-item em {
  font-style: normal;
  color: #6b7280;
}
.us-spacer {
  flex: 1;
  min-height: 24px;
}
.us-footer {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding-top: 10px;
  border-top: 1px solid #e5e7eb;
  font-size: 10px;
  color: #9ca3af;
}
.us-footer-time {
  flex-shrink: 0;
}
</style>
