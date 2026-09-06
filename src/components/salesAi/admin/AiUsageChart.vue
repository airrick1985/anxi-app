<template>
  <div>
    <div class="d-flex align-center flex-wrap ga-2 mb-3">
      <div>
        <div class="text-subtitle-1 font-weight-bold">用量與成本</div>
        <div class="text-caption text-grey">依日彙總；費用 = token × 各 Profile 單價（估算）。</div>
      </div>
      <v-spacer></v-spacer>
      <v-text-field v-model="from" type="date" variant="outlined" density="compact" hide-details label="從" style="max-width:160px"></v-text-field>
      <v-text-field v-model="to" type="date" variant="outlined" density="compact" hide-details label="到" style="max-width:160px"></v-text-field>
      <v-btn size="small" color="primary" :loading="loading" @click="load">查詢</v-btn>
      <v-btn size="small" variant="text" prepend-icon="mdi-download" :disabled="!rows.length" @click="exportCsv">CSV</v-btn>
    </div>

    <v-row dense class="mb-3">
      <v-col v-for="t in tiles" :key="t.label" cols="6" md="3">
        <div class="tile"><div class="tile__label">{{ t.label }}</div><div class="tile__value">{{ t.value }}</div></div>
      </v-col>
    </v-row>

    <div v-if="daily.length" class="chart">
      <div v-for="d in daily" :key="d.date" class="chart__col" :title="`${d.date}：${d.totalTokens.toLocaleString()} tokens，$${d.estCost.toFixed(3)}`">
        <div class="chart__bar" :style="{ height: `${Math.max(2, (d.totalTokens / maxTokens) * 100)}%` }"></div>
        <div class="chart__x">{{ d.date.slice(4, 6) }}/{{ d.date.slice(6, 8) }}</div>
      </div>
    </div>

    <v-table density="compact" class="mt-3">
      <thead><tr><th>日期</th><th>建案</th><th class="text-right">呼叫</th><th class="text-right">輸入 tokens</th><th class="text-right">輸出 tokens</th><th class="text-right">草案</th><th class="text-right">已執行</th><th class="text-right">估算費用</th><th>Profile</th></tr></thead>
      <tbody>
        <tr v-if="!rows.length"><td colspan="9" class="text-center text-grey py-3">此區間沒有用量</td></tr>
        <tr v-for="r in rows" :key="`${r.date}-${r.projectId}`">
          <td>{{ r.date }}</td><td>{{ r.projectId }}</td>
          <td class="text-right">{{ r.calls }}</td><td class="text-right">{{ r.inputTokens.toLocaleString() }}</td><td class="text-right">{{ r.outputTokens.toLocaleString() }}</td>
          <td class="text-right">{{ r.proposals }}</td><td class="text-right">{{ r.executed }}</td><td class="text-right">${{ r.estCost.toFixed(3) }}</td>
          <td class="text-caption">{{ Object.entries(r.byProfile).map(([k, v]) => `${k} ${v.calls || 0}`).join('、') }}</td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAiAdmin } from './useAiAdmin';

const { run } = useAiAdmin();
const today = new Date();
const pad = n => String(n).padStart(2, '0');
const from = ref(`${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`);
const to = ref(`${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`);
const rows = ref([]);
const loading = ref(false);

async function load() {
  loading.value = true;
  try { const r = await run('getUsage', { from: from.value, to: to.value }); rows.value = r.rows || []; } catch { /* ignore */ } finally { loading.value = false; }
}
onMounted(load);

const sum = k => rows.value.reduce((s, r) => s + (Number(r[k]) || 0), 0);
const tiles = computed(() => [
  { label: '呼叫次數', value: sum('calls').toLocaleString() },
  { label: 'Tokens', value: sum('totalTokens').toLocaleString() },
  { label: '草案／已執行', value: `${sum('proposals')} / ${sum('executed')}` },
  { label: '估算費用', value: `$${sum('estCost').toFixed(2)}` },
]);
const daily = computed(() => {
  const m = {};
  for (const r of rows.value) { const d = (m[r.date] = m[r.date] || { date: r.date, totalTokens: 0, estCost: 0 }); d.totalTokens += r.totalTokens; d.estCost += r.estCost; }
  return Object.values(m).sort((a, b) => a.date.localeCompare(b.date));
});
const maxTokens = computed(() => Math.max(1, ...daily.value.map(d => d.totalTokens)));
function exportCsv() {
  const head = ['date', 'projectId', 'calls', 'inputTokens', 'outputTokens', 'totalTokens', 'proposals', 'executed', 'estCost'];
  const lines = [head.join(','), ...rows.value.map(r => head.map(k => r[k]).join(','))];
  const blob = new Blob([`﻿${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `ai-usage-${from.value}_${to.value}.csv`; a.click(); URL.revokeObjectURL(a.href);
}
</script>

<style scoped>
.tile { background: #F4F6FA; border-radius: 10px; padding: 10px 12px; }
.tile__label { font-size: 12px; color: #78909C; }
.tile__value { font-size: 20px; font-weight: 700; color: #1A2B4C; font-variant-numeric: tabular-nums; }
.chart { display: flex; align-items: flex-end; gap: 4px; height: 140px; padding: 8px; background: #FAFBFD; border: 1px solid #E3E8F0; border-radius: 10px; overflow-x: auto; }
.chart__col { flex: 1 0 22px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; }
.chart__bar { width: 100%; max-width: 28px; background: linear-gradient(180deg, #2F6BFF, #7C4DFF); border-radius: 4px 4px 0 0; }
.chart__x { font-size: 10px; color: #90A4AE; margin-top: 2px; }
</style>
