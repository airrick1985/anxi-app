<template>
  <div class="cd" :class="{ 'is-refreshing': isLoading && loaded }">
    <!-- 篩選列：期間＋銷售人員（櫃台），範圍套用到下方所有區塊 -->
    <div class="cd-filters">
      <v-menu location="bottom start" content-class="mac-menu">
        <template #activator="{ props: menuProps }">
          <button type="button" class="mac-btn" v-bind="menuProps">
            <v-icon size="16">mdi-calendar-range</v-icon>{{ periodLabel }}
            <span class="cd-filter-range">{{ rangeText(range.from, range.to) }}</span>
            <v-icon size="14" class="mac-btn-chevron">mdi-chevron-down</v-icon>
          </button>
        </template>
        <v-list density="compact">
          <v-list-item v-for="p in PERIODS" :key="p.value" :title="p.label" :active="period === p.value" @click="period = p.value">
            <template #append><v-icon v-if="period === p.value" size="16">mdi-check</v-icon></template>
          </v-list-item>
        </v-list>
      </v-menu>
      <div v-if="period === 'custom'" class="cd-custom">
        <input v-model="custom.from" type="date" class="mac-form-input" aria-label="起">
        <span>～</span>
        <input v-model="custom.to" type="date" class="mac-form-input" aria-label="迄">
      </div>
      <v-menu v-if="canSeeAll && salesOptions.length" location="bottom start" content-class="mac-menu">
        <template #activator="{ props: menuProps }">
          <button type="button" class="mac-btn" :class="{ 'is-active': !!salesFilter }" v-bind="menuProps">
            <v-icon size="16">mdi-account-tie-outline</v-icon>{{ salesFilter || '全部銷售' }}
            <v-icon size="14" class="mac-btn-chevron">mdi-chevron-down</v-icon>
          </button>
        </template>
        <v-list density="compact" max-height="360">
          <v-list-item title="全部銷售" :active="!salesFilter" @click="salesFilter = ''"></v-list-item>
          <v-list-item v-for="name in salesOptions" :key="name" :title="name" :active="salesFilter === name" @click="salesFilter = name"></v-list-item>
        </v-list>
      </v-menu>
      <span class="cd-compare">對照 {{ rangeText(range.prevFrom, range.prevTo) }}</span>
      <span class="mac-spacer"></span>
      <span v-if="loadedAt" class="cd-updated">更新於 {{ loadedAt }}</span>
    </div>

    <div v-if="error" class="mac-callout mac-callout--error cd-gap"><v-icon size="16">mdi-alert-circle</v-icon><span>{{ error }}</span></div>

    <div v-if="isLoading && !loaded" class="mac-list-loading">
      <v-progress-circular indeterminate color="primary" size="28" width="3"></v-progress-circular>
      <div class="mt-2">正在統計客資…</div>
    </div>

    <template v-else-if="loaded">
      <!-- 指標 -->
      <div class="cd-kpis">
        <div v-for="k in kpis" :key="k.key" class="cd-kpi">
          <div class="cd-kpi-label">{{ k.label }}</div>
          <div class="cd-kpi-value">{{ k.value }}<small v-if="k.unit">{{ k.unit }}</small></div>
          <div class="cd-kpi-foot">
            <span class="cd-delta" :class="`is-${k.delta.dir}`" :title="`上期 ${k.prevText}`">
              <v-icon v-if="k.delta.dir !== 'flat'" size="13">{{ k.delta.dir === 'up' ? 'mdi-arrow-up' : 'mdi-arrow-down' }}</v-icon>{{ k.delta.text }}
            </span>
            <span v-if="k.sub" class="cd-kpi-sub">{{ k.sub }}</span>
          </div>
        </div>
      </div>

      <div class="cd-row">
        <!-- 來訪趨勢 -->
        <section class="cd-card cd-card--wide">
          <header class="cd-card-head">
            <div class="cd-card-titles">
              <div class="cd-card-title">來訪趨勢</div>
              <div class="cd-card-sub">按{{ trend.unit === 'day' ? '日' : trend.unit === 'week' ? '週' : '月' }}・現場介紹</div>
            </div>
            <div class="cd-legend">
              <span><i :style="{ background: COLORS.new }"></i>新客 {{ summary.newVisits }}</span>
              <span><i :style="{ background: COLORS.return }"></i>回訪 {{ summary.returnVisits }}</span>
            </div>
            <button type="button" class="mac-icon-btn" :title="showTrendTable ? '圖表' : '表格'" @click="showTrendTable = !showTrendTable">
              <v-icon size="17">{{ showTrendTable ? 'mdi-chart-bar' : 'mdi-table' }}</v-icon>
            </button>
          </header>
          <div v-if="!summary.visits" class="cd-empty">此期間沒有來訪紀錄</div>
          <div v-else-if="!showTrendTable" class="cd-trend-chart">
            <Bar :data="trendChartData" :options="trendChartOptions" />
          </div>
          <div v-else class="cd-table-wrap cd-trend-table">
            <table class="cd-table">
              <thead><tr><th>{{ trend.unit === 'day' ? '日期' : trend.unit === 'week' ? '週（起）' : '月份' }}</th><th>新客</th><th>回訪</th><th>合計</th></tr></thead>
              <tbody>
                <tr v-for="r in trend.rows" :key="r.key">
                  <td>{{ r.label }}</td><td>{{ r.newVisits }}</td><td>{{ r.returnVisits }}</td><td>{{ r.newVisits + r.returnVisits }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- 等級分布 -->
        <section class="cd-card">
          <header class="cd-card-head">
            <div class="cd-card-titles">
              <div class="cd-card-title">客戶等級</div>
              <div class="cd-card-sub">期間有互動 {{ ratings.total }} 位</div>
            </div>
          </header>
          <div v-if="!ratings.total" class="cd-empty">此期間沒有互動紀錄</div>
          <template v-else>
            <div class="cd-stack" role="img" :aria-label="ratings.rows.map(r => `${ratingLabel(r.key)} ${r.count} 位`).join('、')">
              <span
                v-for="r in ratings.rows.filter(x => x.count)"
                :key="r.key"
                :style="{ flexGrow: r.count, background: RATING_COLORS[r.key] }"
                :title="`${ratingLabel(r.key)}：${r.count} 位（${pct(r.share)}）`"
              ></span>
            </div>
            <ul class="cd-rating-rows">
              <li v-for="r in ratings.rows" :key="r.key">
                <i :style="{ background: RATING_COLORS[r.key] }"></i>
                <span class="cd-rating-label">{{ ratingLabel(r.key) }}</span>
                <b>{{ r.count }}</b>
                <span class="cd-muted">{{ pct(r.share) }}</span>
              </li>
            </ul>
          </template>
        </section>
      </div>

      <div class="cd-row">
        <!-- 銷售人員排行（櫃台） -->
        <section v-if="canSeeAll" class="cd-card cd-card--wide">
          <header class="cd-card-head">
            <div class="cd-card-titles">
              <div class="cd-card-title">銷售人員</div>
              <div class="cd-card-sub">依來訪組數排序</div>
            </div>
          </header>
          <div v-if="!ranking.length" class="cd-empty">此期間沒有互動紀錄</div>
          <div v-else class="cd-table-wrap">
            <table class="cd-table cd-rank">
              <thead>
                <tr><th>銷售</th><th class="cd-rank-visits">來訪</th><th>新客</th><th>回訪</th><th>回訪率</th><th>追蹤</th><th>A/B 級</th><th>平均洽談</th></tr>
              </thead>
              <tbody>
                <tr v-for="r in ranking" :key="r.name">
                  <td class="cd-rank-name">{{ r.name }}</td>
                  <td class="cd-rank-visits">
                    <div class="cd-rank-cell"><span class="cd-rank-bar"><span :style="{ width: barWidth(r.visits, rankingMax) }"></span></span>{{ r.visits }}</div>
                  </td>
                  <td>{{ r.newVisits }}</td>
                  <td>{{ r.returnVisits }}</td>
                  <td>{{ r.visits ? pct(r.returnRate) : '—' }}</td>
                  <td>{{ r.followUps }}</td>
                  <td>{{ r.hotCustomers }}</td>
                  <td>{{ r.avgDuration ? `${r.avgDuration} 分` : '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- 未買原因 -->
        <section class="cd-card">
          <header class="cd-card-head">
            <div class="cd-card-titles">
              <div class="cd-card-title">未買原因</div>
              <div class="cd-card-sub">期間來訪 {{ reasons.base }} 位・每位同一原因計一次</div>
            </div>
          </header>
          <div v-if="!reasons.rows.length" class="cd-empty">此期間沒有填寫未買原因</div>
          <div v-else class="cd-bars">
            <div v-for="r in reasons.rows" :key="r.label" class="cd-bar-row" :title="`${r.label}：${r.count} 位（${pct(r.share)}）`">
              <div class="cd-bar-label">{{ r.label }}</div>
              <div class="cd-bar-track"><span :style="{ width: barWidth(r.count, reasonsMax) }"></span></div>
              <div class="cd-bar-value">{{ r.count }}<small>{{ pct(r.share) }}</small></div>
            </div>
            <div v-if="reasons.more" class="cd-card-foot">另有 {{ reasons.more }} 種原因</div>
          </div>
        </section>
      </div>

      <div class="cd-row">
        <!-- 來客輪廓 -->
        <section class="cd-card">
          <header class="cd-card-head">
            <div class="cd-card-titles">
              <div class="cd-card-title">來客輪廓</div>
              <div class="cd-card-sub">期間來訪 {{ profile.base }} 位</div>
            </div>
            <v-menu location="bottom end" content-class="mac-menu">
              <template #activator="{ props: menuProps }">
                <button type="button" class="mac-btn mac-btn--sm" v-bind="menuProps">
                  {{ profileDim.label }}<v-icon size="14" class="mac-btn-chevron">mdi-chevron-down</v-icon>
                </button>
              </template>
              <v-list density="compact">
                <v-list-item v-for="d in PROFILE_DIMENSIONS" :key="d.key" :title="d.label" :active="profileKey === d.key" @click="profileKey = d.key">
                  <template #append><v-icon v-if="profileKey === d.key" size="16">mdi-check</v-icon></template>
                </v-list-item>
              </v-list>
            </v-menu>
          </header>
          <div v-if="!profile.rows.length" class="cd-empty">此期間來訪客戶未填{{ profileDim.label }}</div>
          <div v-else class="cd-bars">
            <div v-for="r in profile.rows" :key="r.label" class="cd-bar-row" :class="{ 'is-other': r.isOther }" :title="`${r.label}：${r.count} 位（${pct(r.share)}）`">
              <div class="cd-bar-label">{{ r.label }}</div>
              <div class="cd-bar-track"><span :style="{ width: barWidth(r.count, profileMax) }"></span></div>
              <div class="cd-bar-value">{{ r.count }}<small>{{ pct(r.share) }}</small></div>
            </div>
          </div>
          <div v-if="profile.missing" class="cd-card-foot">未填 {{ profile.missing }} 位</div>
        </section>

        <!-- 來訪時段熱度 -->
        <section class="cd-card cd-card--wide">
          <header class="cd-card-head">
            <div class="cd-card-titles">
              <div class="cd-card-title">來訪時段</div>
              <div class="cd-card-sub">星期 × 開始時間</div>
            </div>
            <div class="cd-heat-scale" aria-hidden="true">
              <span>少</span><i v-for="c in HEAT_STEPS" :key="c" :style="{ background: c }"></i><span>多</span>
            </div>
          </header>
          <div v-if="!heatmap.max" class="cd-empty">此期間沒有填寫來訪時間</div>
          <div v-else class="cd-heat-wrap">
            <div class="cd-heat" :style="{ gridTemplateColumns: `var(--cd-heat-day, 28px) repeat(${heatmap.hours.length}, minmax(var(--cd-heat-min, 24px), 1fr))` }">
              <span></span>
              <span v-for="h in heatmap.hours" :key="`h${h}`" class="cd-heat-hour">{{ h }}</span>
              <template v-for="row in heatmap.rows" :key="row.label">
                <span class="cd-heat-day">{{ row.label }}</span>
                <span
                  v-for="cell in row.cells"
                  :key="`${row.label}${cell.hour}`"
                  class="cd-heat-cell"
                  :style="heatStyle(cell.count)"
                  :title="`週${row.label} ${cell.hour}:00：${cell.count} 組`"
                >{{ cell.count || '' }}</span>
              </template>
            </div>
          </div>
          <div v-if="heatmap.noTime" class="cd-card-foot">未填時間 {{ heatmap.noTime }} 組</div>
        </section>
      </div>

      <!-- 待追蹤：A／B 級久未聯絡（不受期間影響） -->
      <section class="cd-card cd-card--full">
        <header class="cd-card-head">
          <div class="cd-card-titles">
            <div class="cd-card-title">待追蹤</div>
            <div class="cd-card-sub">A／B 級、超過 {{ staleDays }} 天沒有洽談紀錄・{{ stale.length }} 位</div>
          </div>
          <div class="mac-form-seg" role="tablist">
            <button v-for="d in [7, 14, 30]" :key="d" type="button" class="mac-form-seg-btn" :class="{ 'is-active': staleDays === d }" @click="staleDays = d">{{ d }} 天</button>
          </div>
        </header>
        <div v-if="!stale.length" class="cd-empty">沒有久未聯絡的 A／B 級客戶</div>
        <div v-else class="cd-stale">
          <button
            v-for="c in staleVisible"
            :key="c.id"
            type="button"
            class="cd-stale-row"
            @click="$emit('open-customer', { docId: c.id, salesName: c.sales })"
          >
            <span class="mac-tag" :style="ratingTagStyle(c.bucket)">{{ c.rating || c.bucket }}</span>
            <span class="cd-stale-main">
              <span class="cd-stale-name">{{ c.name }}</span>
              <span class="cd-muted">{{ c.sales || '未指派' }}・最後 {{ c.lastContact.replace(/-/g, '/') }}</span>
            </span>
            <span class="cd-stale-days">{{ c.idleDays }} 天</span>
            <v-icon size="16" class="cd-stale-chev">mdi-chevron-right</v-icon>
          </button>
        </div>
        <div v-if="stale.length > staleVisible.length" class="cd-card-foot">
          <button type="button" class="mac-link-btn" @click="staleLimit += 20">再顯示 {{ Math.min(20, stale.length - staleVisible.length) }} 位（還有 {{ stale.length - staleVisible.length }} 位）</button>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
// 客戶資料儀表板：期間來訪／新客／回訪指標、趨勢、銷售排行、等級、未買原因、來客輪廓、來訪時段、待追蹤
// 計算邏輯見 utils/customerDashboardStats.js；櫃台看全案，銷售只看自己負責的客戶
import { ref, reactive, computed, watch } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js';
import { useUserStore } from '@/store/user';
import { fetchFullCustomersForExport } from '@/api';
import { hexToRgba } from '@/utils/leadStatusColors';
import {
  PERIODS, PROFILE_DIMENSIONS, prepareCustomers, resolveRange, summarize, visitTrend, salesRanking,
  ratingDistribution, noPurchaseReasons, profileBreakdown, visitHeatmap, staleHotCustomers, filterOwnCustomers,
} from '@/utils/customerDashboardStats';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

const props = defineProps({
  projectId: { type: String, required: true },
  settings: { type: Object, default: () => ({}) },
  canSeeAll: { type: Boolean, default: false },  // 櫃台／超級管理員：全案
  systems: { type: Array, default: () => [] },   // 呼叫完整客資 API 的權限
});
defineEmits(['open-customer']);

const userStore = useUserStore();

// 新客／回訪：分類色第 1、2 格（已驗證色覺辨識）；等級沿用客戶列表色條
const COLORS = { new: '#2a78d6', return: '#eb6834' };
const RATING_COLORS = { A: '#D32F2F', B: '#F57C00', C: '#388E3C', D: '#616161', 未定級: '#C7C7CC' };
const HEAT_STEPS = ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95'];

// --- 資料 ---
const customers = ref([]);
const isLoading = ref(false);
const loaded = ref(false);
const loadedAt = ref('');
const error = ref('');

async function reload() {
  if (!props.projectId || !userStore.user?.key) return;
  isLoading.value = true;
  error.value = '';
  try {
    const raw = await fetchFullCustomersForExport(props.projectId, userStore.user.key, props.systems);
    const prepared = prepareCustomers(raw, props.projectId);
    customers.value = props.canSeeAll ? prepared : filterOwnCustomers(prepared, userStore.user);
    const now = new Date();
    loadedAt.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    loaded.value = true;
  } catch (e) {
    error.value = '讀取客資失敗：' + (e.message || e);
  } finally {
    isLoading.value = false;
  }
}
defineExpose({ reload });

// --- 篩選 ---
const period = ref('month');
const custom = reactive({ from: '', to: '' });
const salesFilter = ref('');
const periodLabel = computed(() => PERIODS.find(p => p.value === period.value)?.label || '');
const range = computed(() => resolveRange(period.value, custom));
watch(period, (p) => {
  if (p === 'custom' && !custom.from) { custom.from = range.value.from; custom.to = range.value.to; }
});

const salesOptions = computed(() =>
  [...new Set(customers.value.map(c => c.sales).filter(Boolean))].sort((a, b) => a.localeCompare(b))
);
const scoped = computed(() =>
  salesFilter.value ? customers.value.filter(c => c.sales === salesFilter.value) : customers.value
);

// 切換建案：重新讀取並清除銷售篩選（宣告於篩選狀態之後，immediate 才不會取到未初始化的變數）
watch(() => props.projectId, () => { loaded.value = false; salesFilter.value = ''; reload(); }, { immediate: true });

// --- 統計 ---
const summary = computed(() => summarize(scoped.value, range.value.from, range.value.to));
const prevSummary = computed(() => summarize(scoped.value, range.value.prevFrom, range.value.prevTo));
const trend = computed(() => visitTrend(scoped.value, range.value.from, range.value.to));
const ranking = computed(() => salesRanking(scoped.value, range.value.from, range.value.to));
const ratings = computed(() => ratingDistribution(scoped.value, range.value.from, range.value.to));
const reasons = computed(() => noPurchaseReasons(scoped.value, range.value.from, range.value.to));
const profileKey = ref('source');
const profileDim = computed(() => PROFILE_DIMENSIONS.find(d => d.key === profileKey.value) || PROFILE_DIMENSIONS[0]);
const profile = computed(() => profileBreakdown(scoped.value, range.value.from, range.value.to, profileDim.value, props.settings));
const heatmap = computed(() => visitHeatmap(scoped.value, range.value.from, range.value.to));
const staleDays = ref(14);
const staleLimit = ref(20);
const stale = computed(() => staleHotCustomers(scoped.value, staleDays.value));
const staleVisible = computed(() => stale.value.slice(0, staleLimit.value));
watch([staleDays, salesFilter], () => { staleLimit.value = 20; });

const rankingMax = computed(() => Math.max(1, ...ranking.value.map(r => r.visits)));
const reasonsMax = computed(() => Math.max(1, ...reasons.value.rows.map(r => r.count)));
const profileMax = computed(() => Math.max(1, ...profile.value.rows.map(r => r.count)));

// --- 顯示 ---
const pct = (v) => `${Math.round((v || 0) * 100)}%`;
const barWidth = (n, max) => `${Math.max(n ? 2 : 0, Math.round((n / max) * 100))}%`;
const rangeText = (from, to) => {
  const fmt = (s) => { const [, m, d] = s.split('-'); return `${Number(m)}/${Number(d)}`; };
  return from === to ? fmt(from) : `${fmt(from)}–${fmt(to)}`;
};
const ratingLabel = (key) => {
  if (key === '未定級') return '未定級';
  const opts = props.settings?.fields?.rating?.options || [];
  return opts.find(o => String(o).startsWith(key)) || key;
};
const ratingTagStyle = (key) => {
  const hex = RATING_COLORS[key] || RATING_COLORS['未定級'];
  return { '--mac-tag-color': hex, '--mac-tag-bg': hexToRgba(hex, 0.12) };
};
const heatStyle = (count) => {
  if (!count) return { background: '#f2f2f5' };
  const step = Math.min(HEAT_STEPS.length - 1, Math.floor((count / heatmap.value.max) * (HEAT_STEPS.length - 1) + 0.0001));
  return { background: HEAT_STEPS[step], color: step >= 3 ? '#fff' : '#1d1d1f' };
};

// 與上期比較：上升為好（綠）、下降為差（紅）；上期為 0 時顯示增加量
const delta = (cur, prev, unit = '') => {
  if (cur === prev) return { dir: 'flat', text: '持平' };
  const dir = cur > prev ? 'up' : 'down';
  if (unit) return { dir, text: `${Math.abs(cur - prev)} ${unit}` };
  if (!prev) return { dir, text: `+${cur}` };
  return { dir, text: `${Math.round(Math.abs(cur - prev) / prev * 100)}%` };
};
const kpis = computed(() => {
  const s = summary.value;
  const p = prevSummary.value;
  return [
    { key: 'visits', label: '來訪組數', value: s.visits, sub: s.visitors ? `共 ${s.visitors} 人` : '', delta: delta(s.visits, p.visits), prevText: `${p.visits} 組` },
    { key: 'new', label: '新客', value: s.newVisits, delta: delta(s.newVisits, p.newVisits), prevText: `${p.newVisits} 組` },
    { key: 'return', label: '回訪', value: s.returnVisits, sub: s.visits ? `回訪率 ${pct(s.returnRate)}` : '', delta: delta(s.returnVisits, p.returnVisits), prevText: `${p.returnVisits} 組` },
    { key: 'follow', label: '追蹤互動', value: s.followUps, sub: '電話、LINE 等', delta: delta(s.followUps, p.followUps), prevText: `${p.followUps} 次` },
    { key: 'hot', label: 'A/B 級客戶', value: s.hotCustomers, sub: `互動 ${s.activeCustomers} 位`, delta: delta(s.hotCustomers, p.hotCustomers), prevText: `${p.hotCustomers} 位` },
    { key: 'duration', label: '平均洽談', value: s.avgDuration || '—', unit: s.avgDuration ? ' 分' : '', delta: delta(s.avgDuration, p.avgDuration, '分'), prevText: p.avgDuration ? `${p.avgDuration} 分` : '無' },
  ];
});

// --- 趨勢圖（堆疊直條：2px 間隔、頂端 4px 圓角、柱寬上限 24px） ---
const showTrendTable = ref(false);
const trendChartData = computed(() => {
  const rows = trend.value.rows;
  const isTop = (ctx) => ctx.datasetIndex === 1 || !rows[ctx.dataIndex]?.returnVisits;
  const common = { maxBarThickness: 24, borderSkipped: false, borderColor: '#fff' };
  return {
    labels: rows.map(r => r.label),
    datasets: [
      { ...common, label: '新客', data: rows.map(r => r.newVisits), backgroundColor: COLORS.new, borderWidth: 0,
        borderRadius: (ctx) => (isTop(ctx) ? { topLeft: 4, topRight: 4 } : 0) },
      { ...common, label: '回訪', data: rows.map(r => r.returnVisits), backgroundColor: COLORS.return,
        borderWidth: (ctx) => (rows[ctx.dataIndex]?.newVisits ? { bottom: 2 } : 0),
        borderRadius: { topLeft: 4, topRight: 4 } },
    ],
  };
});
const trendChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 250 },
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    datalabels: { display: false },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      titleColor: '#1d1d1f',
      bodyColor: '#3a3a3c',
      footerColor: '#1d1d1f',
      borderColor: 'rgba(0, 0, 0, 0.12)',
      borderWidth: 1,
      padding: 10,
      boxWidth: 12,
      boxHeight: 2,
      titleFont: { weight: '600' },
      callbacks: {
        label: (ctx) => ` ${ctx.dataset.label}  ${ctx.parsed.y} 組`,
        footer: (items) => `合計 ${items.reduce((s, i) => s + i.parsed.y, 0)} 組`,
      },
    },
  },
  scales: {
    x: {
      stacked: true,
      grid: { display: false },
      border: { color: '#e5e5ea' },
      ticks: { color: '#6e6e73', font: { size: 11 }, maxRotation: 0, autoSkip: true, autoSkipPadding: 10 },
    },
    y: {
      stacked: true,
      beginAtZero: true,
      grid: { color: '#f0f0f3' },
      border: { display: false },
      ticks: { color: '#8e8e93', font: { size: 11 }, precision: 0, maxTicksLimit: 5 },
    },
  },
};
</script>

<style scoped>
.cd {
  padding: 4px 16px 24px;
  background: #f5f5f7;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  min-height: calc(100vh - 130px);
  color: #1d1d1f;
  transition: opacity 0.2s;
}
.cd.is-refreshing .cd-kpis,
.cd.is-refreshing .cd-row,
.cd.is-refreshing .cd-card--full { opacity: 0.55; }
.cd-gap { margin-top: 10px; }
.cd-muted { color: #6e6e73; font-size: 12.5px; }

.cd-filters { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; padding: 12px 0; }
.cd-filters .mac-spacer { flex: 1 1 auto; }
.cd-filter-range { margin-left: 2px; color: #6e6e73; font-weight: 400; }
.cd-custom { display: flex; align-items: center; gap: 6px; color: #8e8e93; }
.cd-custom .mac-form-input { width: 150px; height: 30px; }
.cd-compare, .cd-updated { font-size: 12px; color: #8e8e93; white-space: nowrap; }

/* 指標 */
.cd-kpis { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 10px; }
.cd-kpi {
  padding: 12px 14px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.08), 0 0.5px 1.5px rgba(0, 0, 0, 0.05);
}
.cd-kpi-label { font-size: 12px; font-weight: 600; color: #6e6e73; }
.cd-kpi-value { margin-top: 4px; font-size: 26px; font-weight: 700; line-height: 1.15; letter-spacing: -0.01em; }
.cd-kpi-value small { font-size: 14px; font-weight: 600; color: #6e6e73; }
.cd-kpi-foot { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 8px; margin-top: 6px; font-size: 12px; }
.cd-kpi-sub { color: #8e8e93; }
.cd-delta { display: inline-flex; align-items: center; gap: 1px; font-weight: 600; white-space: nowrap; }
.cd-delta.is-up { color: #248a3d; }
.cd-delta.is-down { color: #d70015; }
.cd-delta.is-flat { color: #8e8e93; font-weight: 500; }
.cd-delta .v-icon { color: inherit; }

/* 卡片 */
.cd-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px; }
.cd-card {
  flex: 1 1 300px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 14px 16px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.08), 0 0.5px 1.5px rgba(0, 0, 0, 0.05);
}
.cd-card--wide { flex: 2 1 520px; }
.cd-card--full { margin-top: 12px; }
.cd-card-head { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
.cd-card-titles { flex: 1 1 auto; min-width: 0; }
.cd-card-title { font-size: 14px; font-weight: 600; }
.cd-card-sub { margin-top: 1px; font-size: 12px; color: #8e8e93; overflow-wrap: anywhere; }
.cd-card-foot { margin-top: 10px; font-size: 12px; color: #8e8e93; }
.cd-empty { display: flex; align-items: center; justify-content: center; min-height: 120px; color: #8e8e93; font-size: 13px; text-align: center; }

.cd-legend { display: flex; align-items: center; gap: 12px; font-size: 12.5px; color: #3a3a3c; white-space: nowrap; }
.cd-legend span { display: inline-flex; align-items: center; gap: 5px; }
.cd-legend i { width: 10px; height: 10px; border-radius: 2px; }
.cd-trend-chart { position: relative; height: 240px; }

/* 表格（趨勢表格檢視、銷售排行） */
.cd-table-wrap { overflow-x: auto; margin: 0 -4px; }
.cd-trend-table { max-height: 260px; overflow-y: auto; }
.cd-table { width: 100%; border-collapse: collapse; font-size: 13px; font-variant-numeric: tabular-nums; }
.cd-table th {
  position: sticky;
  top: 0;
  padding: 6px 8px;
  background: #f6f6f8;
  color: #6e6e73;
  font-size: 12px;
  font-weight: 600;
  text-align: right;
  white-space: nowrap;
}
.cd-table td { padding: 8px; border-bottom: 1px solid #f0f0f3; text-align: right; white-space: nowrap; }
.cd-table th:first-child, .cd-table td:first-child { text-align: left; }
.cd-rank-name { font-weight: 600; }
.cd-rank-visits { min-width: 120px; }
.cd-rank-cell { display: flex; align-items: center; justify-content: flex-end; gap: 8px; font-weight: 600; }
.cd-rank-bar { flex: 1 1 auto; max-width: 90px; height: 8px; }
.cd-rank-bar span { display: block; height: 100%; margin-left: auto; border-radius: 4px 0 0 4px; background: #2a78d6; }

/* 等級分布 */
.cd-stack { display: flex; gap: 2px; height: 14px; margin: 2px 0 14px; }
.cd-stack span { min-width: 4px; }
.cd-stack span:first-child { border-radius: 4px 0 0 4px; }
.cd-stack span:last-child { border-radius: 0 4px 4px 0; }
.cd-stack span:only-child { border-radius: 4px; }
.cd-rating-rows { list-style: none; margin: 0; padding: 0; }
.cd-rating-rows li { display: flex; align-items: center; gap: 8px; min-height: 30px; font-size: 13px; font-variant-numeric: tabular-nums; }
.cd-rating-rows li + li { border-top: 1px solid #f0f0f3; }
.cd-rating-rows i { flex-shrink: 0; width: 10px; height: 10px; border-radius: 2px; }
.cd-rating-label { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; }
.cd-rating-rows b { font-weight: 600; }
.cd-rating-rows .cd-muted { width: 38px; text-align: right; }

/* 橫條排行（未買原因、來客輪廓）：單一系列一色，數值在條末 */
.cd-bars { display: flex; flex-direction: column; gap: 7px; }
.cd-bar-row { display: grid; grid-template-columns: minmax(72px, 36%) minmax(0, 1fr) auto; align-items: center; gap: 10px; font-size: 13px; }
.cd-bar-label { line-height: 1.35; overflow-wrap: anywhere; }
.cd-bar-track { height: 12px; }
.cd-bar-track span { display: block; height: 100%; border-radius: 0 4px 4px 0; background: #2a78d6; }
.cd-bar-row.is-other .cd-bar-track span { background: #aeaeb2; }
.cd-bar-value { min-width: 64px; text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }
.cd-bar-value small { margin-left: 6px; font-size: 12px; font-weight: 400; color: #8e8e93; }

/* 來訪時段熱度 */
.cd-heat-scale { display: flex; align-items: center; gap: 2px; font-size: 11px; color: #8e8e93; }
.cd-heat-scale span { margin: 0 3px; }
.cd-heat-scale i { width: 12px; height: 12px; border-radius: 3px; }
.cd-heat-wrap { overflow-x: auto; }
.cd-heat { display: grid; gap: 2px; min-width: 360px; font-variant-numeric: tabular-nums; }
.cd-heat-hour { padding-bottom: 2px; font-size: 11px; color: #8e8e93; text-align: center; }
.cd-heat-day { display: flex; align-items: center; font-size: 12px; color: #6e6e73; }
.cd-heat-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  border-radius: 4px;
  font-size: 11.5px;
  font-weight: 600;
}

/* 待追蹤 */
.cd-stale { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0 16px; }
.cd-stale-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 52px;
  padding: 8px 4px;
  border: 0;
  border-bottom: 1px solid #f0f0f3;
  background: transparent;
  color: #1d1d1f;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  border-radius: 0;
}
.cd-stale-row:hover { background: #f7f7f9; }
.cd-stale-main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.cd-stale-name { font-size: 14px; font-weight: 600; overflow-wrap: anywhere; }
.cd-stale-days { font-size: 13px; font-weight: 600; color: #c93400; white-space: nowrap; font-variant-numeric: tabular-nums; }
.cd-stale-chev { color: #c7c7cc; }

@media (max-width: 1180px) {
  .cd-kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 600px) {
  .cd { padding: 0 12px 20px; }
  .cd-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .cd-kpi { padding: 10px 12px; }
  .cd-kpi-value { font-size: 24px; }
  .cd-card { padding: 12px; }
  .cd-card-head { flex-wrap: wrap; }
  .cd-legend { order: 3; flex-basis: 100%; }
  .cd-custom { flex-basis: 100%; }
  .cd-custom .mac-form-input { flex: 1 1 0; min-width: 0; width: auto; height: 38px; font-size: 16px; }
  .cd-compare { order: 4; }
  .cd-trend-chart { height: 210px; }
  .cd-stale { grid-template-columns: minmax(0, 1fr); }
  /* 手機：12 個時段直接放進卡片寬度，不必左右捲 */
  .cd-heat { --cd-heat-day: 18px; --cd-heat-min: 16px; min-width: 0; }
  .cd-heat-hour { font-size: 10px; }
  .cd-heat-cell { height: 26px; font-size: 11px; }
}
</style>
