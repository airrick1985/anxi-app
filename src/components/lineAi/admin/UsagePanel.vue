<template>
  <div>
    <div class="lap-bar">
      <div class="lap-title">用量</div>
      <v-spacer />
      <input v-model="from" type="date" class="mac-form-input lap-date" />
      <span class="lap-sub">至</span>
      <input v-model="to" type="date" class="mac-form-input lap-date" />
      <button class="mac-btn mac-btn--sm" :disabled="loading" @click="load">查詢</button>
    </div>

    <div class="lap-stats">
      <div class="lap-stat"><div class="lap-stat__label">呼叫次數</div><div class="lap-stat__value">{{ fmt(total.calls) }}</div></div>
      <div class="lap-stat"><div class="lap-stat__label">Token</div><div class="lap-stat__value">{{ fmt(total.totalTokens) }}</div></div>
      <div class="lap-stat"><div class="lap-stat__label">估計成本</div><div class="lap-stat__value">US$ {{ total.estCost.toFixed(2) }}</div></div>
    </div>

    <div class="mac-form-label">各 Agent</div>
    <v-table density="compact" class="mac-table">
      <thead><tr><th>Agent</th><th class="text-right">次數</th><th class="text-right">Token</th><th class="text-right">估計成本</th></tr></thead>
      <tbody>
        <tr v-if="!byAgent.length"><td colspan="4" class="text-center text-grey py-3">沒有資料</td></tr>
        <tr v-for="a in byAgent" :key="a.id"><td>{{ a.name }}</td><td class="text-right">{{ fmt(a.calls) }}</td><td class="text-right">{{ fmt(a.totalTokens) }}</td><td class="text-right">{{ a.estCost.toFixed(3) }}</td></tr>
      </tbody>
    </v-table>

    <div class="mac-form-label">用途</div>
    <div class="lap-kinds">
      <span v-for="k in byKind" :key="k.key" class="mac-tag">{{ KIND_LABEL[k.key] || k.key }} {{ fmt(k.calls) }} 次</span>
      <span v-if="!byKind.length" class="lap-sub">沒有資料</span>
    </div>

    <div class="mac-form-label">每日</div>
    <v-table density="compact" class="mac-table">
      <thead><tr><th>日期</th><th class="text-right">次數</th><th class="text-right">Token</th><th class="text-right">估計成本</th></tr></thead>
      <tbody>
        <tr v-if="!rows.length"><td colspan="4" class="text-center text-grey py-3">沒有資料</td></tr>
        <tr v-for="r in rows" :key="r.date"><td>{{ r.date.replace(/(\d{4})(\d{2})(\d{2})/, '$1/$2/$3') }}</td><td class="text-right">{{ fmt(r.calls) }}</td><td class="text-right">{{ fmt(r.totalTokens) }}</td><td class="text-right">{{ r.estCost.toFixed(3) }}</td></tr>
      </tbody>
    </v-table>

    <div class="lap-bar mt-6">
      <div class="lap-title">管理紀錄</div>
      <v-spacer />
      <button class="mac-btn mac-btn--sm" @click="loadLogs">重新整理</button>
    </div>
    <v-table density="compact" class="mac-table">
      <thead><tr><th>時間</th><th>操作</th><th>操作者</th></tr></thead>
      <tbody>
        <tr v-if="!logs.length"><td colspan="3" class="text-center text-grey py-3">尚無紀錄</td></tr>
        <tr v-for="l in logs" :key="l.id">
          <td class="lap-sub text-no-wrap">{{ l.createdAt ? new Date(l.createdAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }) : '' }}</td>
          <td><code>{{ l.action }}</code></td>
          <td>{{ l.userName }}</td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useLineAiAdmin } from './useLineAiAdmin';

const { run } = useLineAiAdmin();
const KIND_LABEL = { suggest: '建議回覆', polish: '潤稿', summary: '整理記憶', notify: '來訊草稿' };

const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });
const from = ref(`${today.slice(0, 8)}01`);
const to = ref(today);
const rows = ref([]);
const logs = ref([]);
const loading = ref(false);

const fmt = n => Number(n || 0).toLocaleString('zh-TW');
const total = computed(() => rows.value.reduce((t, r) => ({ calls: t.calls + r.calls, totalTokens: t.totalTokens + r.totalTokens, estCost: t.estCost + r.estCost }), { calls: 0, totalTokens: 0, estCost: 0 }));
const byAgent = computed(() => {
  const map = new Map();
  for (const r of rows.value) {
    for (const [id, a] of Object.entries(r.byAgent || {})) {
      const cur = map.get(id) || { id, name: a.name || id, calls: 0, totalTokens: 0, estCost: 0 };
      cur.calls += a.calls || 0; cur.totalTokens += a.totalTokens || 0; cur.estCost += a.estCost || 0;
      map.set(id, cur);
    }
  }
  return [...map.values()].sort((a, b) => b.totalTokens - a.totalTokens);
});
const byKind = computed(() => {
  const map = new Map();
  for (const r of rows.value) for (const [key, k] of Object.entries(r.byKind || {})) map.set(key, (map.get(key) || 0) + (k.calls || 0));
  return [...map.entries()].map(([key, calls]) => ({ key, calls }));
});

async function load() {
  loading.value = true;
  try { rows.value = (await run('getUsage', { from: from.value, to: to.value })).rows || []; } catch { /* 已提示 */ } finally { loading.value = false; }
}

async function loadLogs() {
  try { logs.value = (await run('listAdminLogs')).logs || []; } catch { /* 已提示 */ }
}

onMounted(() => { load(); loadLogs(); });
</script>

<style scoped src="./adminPanel.css"></style>
<style scoped>
.lap-bar { flex-wrap: wrap; }
.lap-date { width: 150px; flex: 0 0 auto; }
.lap-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-bottom: 4px; }
.lap-stat { padding: 10px 12px; border-radius: 10px; background: #f5f5f7; }
.lap-stat__label { font-size: 12px; color: #6e6e73; }
.lap-stat__value { margin-top: 2px; font-size: 20px; font-weight: 700; font-variant-numeric: tabular-nums; }
.lap-kinds { display: flex; flex-wrap: wrap; gap: 6px; }
@media (max-width: 600px) { .lap-stats { grid-template-columns: minmax(0, 1fr); } }
</style>
