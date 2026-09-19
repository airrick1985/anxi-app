<template>
  <div>
    <div v-if="loading" class="text-center py-10">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <template v-else>
      <!-- 人員獎金累計 -->
      <v-card variant="outlined" class="mb-4">
        <v-card-title class="text-subtitle-1 d-flex align-center flex-wrap ga-2">
          <v-icon start size="small">mdi-account-cash-outline</v-icon>人員獎金累計
          <v-btn-toggle v-model="scope" mandatory color="primary" variant="outlined" divided density="comfortable" class="ml-2">
            <v-btn value="project" size="small">本建案</v-btn>
            <v-btn value="cross" size="small">跨建案</v-btn>
          </v-btn-toggle>
          <v-spacer></v-spacer>
          <v-btn v-if="scope === 'cross'" size="small" variant="tonal" prepend-icon="mdi-refresh"
            :loading="crossLoading" @click="loadCross">重新載入跨案資料</v-btn>
        </v-card-title>
        <v-card-text>
          <v-alert v-if="scope === 'cross' && !crossLoaded && !crossLoading" type="info" variant="tonal" density="compact" class="mb-3">
            跨建案彙總限相同方案識別的紀錄，並以「電話」識別同一人，僅涵蓋您具「請佣獎金」權限的建案（{{ permittedProjects.length }} 個）。
            <template #append><v-btn size="small" color="primary" variant="flat" @click="loadCross">載入</v-btn></template>
          </v-alert>
          <div class="table-scroll">
            <v-table density="compact">
              <thead>
                <tr>
                  <th style="width:32px"></th>
                  <th>人員</th>
                  <th v-if="scope === 'cross'">建案數</th>
                  <th class="text-right">筆數</th>
                  <th class="text-right">獎金小計</th>
                  <th class="text-right">保留款</th>
                  <th class="text-right">稅金</th>
                  <th class="text-right">二代健保</th>
                  <th class="text-right">實發</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="p in statRows" :key="p.personKey">
                  <tr>
                    <td>
                      <v-btn :icon="expanded === p.personKey ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="x-small" variant="text"
                        @click="expanded = expanded === p.personKey ? '' : p.personKey"></v-btn>
                    </td>
                    <td class="font-weight-medium">{{ p.name }}<span class="text-caption text-medium-emphasis ml-1">{{ p.personKey.startsWith('ext:') ? '' : p.personKey }}</span></td>
                    <td v-if="scope === 'cross'">{{ Object.keys(p.byProject).length }}</td>
                    <td class="text-right">{{ p.count }}</td>
                    <td class="text-right">{{ money(p.subtotal) }}</td>
                    <td class="text-right">{{ money(p.keep) }}</td>
                    <td class="text-right">{{ money(p.tax) }}</td>
                    <td class="text-right">{{ money(p.nhi) }}</td>
                    <td class="text-right text-success font-weight-bold">{{ money(p.net) }}</td>
                  </tr>
                  <tr v-if="expanded === p.personKey">
                    <td :colspan="scope === 'cross' ? 9 : 8" class="pa-0">
                      <v-table density="compact" class="inner-table">
                        <thead>
                          <tr><th>{{ scope === 'cross' ? '建案' : '期別' }}</th><th class="text-right">筆數</th><th class="text-right">小計</th><th class="text-right">實發</th></tr>
                        </thead>
                        <tbody>
                          <tr v-for="(d, k) in (scope === 'cross' ? p.byProject : p.byPeriod)" :key="k">
                            <td>{{ scope === 'cross' ? (d.projectName || k) : `第 ${k} 期` }}</td>
                            <td class="text-right">{{ d.count }}</td>
                            <td class="text-right">{{ money(d.subtotal) }}</td>
                            <td class="text-right">{{ money(d.net) }}</td>
                          </tr>
                        </tbody>
                      </v-table>
                    </td>
                  </tr>
                </template>
                <tr v-if="!statRows.length"><td colspan="9" class="text-center text-medium-emphasis">尚無資料</td></tr>
                <tr v-if="statRows.length" class="font-weight-bold bg-green-lighten-5">
                  <td></td><td>合計</td>
                  <td v-if="scope === 'cross'"></td>
                  <td class="text-right">{{ statTotal.count }}</td>
                  <td class="text-right">{{ money(statTotal.subtotal) }}</td>
                  <td class="text-right">{{ money(statTotal.keep) }}</td>
                  <td class="text-right">{{ money(statTotal.tax) }}</td>
                  <td class="text-right">{{ money(statTotal.nhi) }}</td>
                  <td class="text-right text-success">{{ money(statTotal.net) }}</td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-card-text>
      </v-card>

      <!-- 交屋團獎累積（自個獎提撥、本期不發放） -->
      <v-card variant="outlined" class="mb-4">
        <v-card-title class="text-subtitle-1 d-flex align-center flex-wrap ga-2">
          <v-icon start size="small">mdi-home-clock-outline</v-icon>交屋團獎累積（本建案，暫留未發放）
          <v-spacer></v-spacer>
          <v-chip size="small" color="orange-darken-3" variant="tonal">累積 {{ money(handoverTotal) }} 元</v-chip>
        </v-card-title>
        <v-card-text>
          <div class="text-caption text-medium-emphasis mb-2">
            每期請佣時自「銷售個獎」提撥的交屋團獎（依請佣紀錄快照；作廢紀錄不計）。此金額尚未發放給任何人員，供日後製作交屋獎金時查閱。
          </div>
          <div v-if="!handoverPeriods.length" class="text-center text-medium-emphasis py-4">尚無交屋團獎暫留紀錄</div>
          <div v-else class="table-scroll">
            <v-table density="compact">
              <thead>
                <tr>
                  <th style="width:32px"></th>
                  <th>期別</th><th>請佣日期</th>
                  <th class="text-right">戶數</th>
                  <th class="text-right">本期暫留</th>
                  <th class="text-right">累積至本期</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="pd in handoverPeriods" :key="pd.period">
                  <tr>
                    <td>
                      <v-btn :icon="handoverExpanded === pd.period ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="x-small" variant="text"
                        @click="handoverExpanded = handoverExpanded === pd.period ? null : pd.period"></v-btn>
                    </td>
                    <td class="font-weight-medium">第 {{ pd.period }} 期</td>
                    <td>{{ pd.requestDate || '—' }}</td>
                    <td class="text-right">{{ pd.count }}</td>
                    <td class="text-right font-weight-bold text-orange-darken-3">{{ money(pd.total) }}</td>
                    <td class="text-right">{{ money(pd.cumulative) }}</td>
                  </tr>
                  <tr v-if="handoverExpanded === pd.period">
                    <td colspan="6" class="pa-0">
                      <v-table density="compact" class="inner-table">
                        <thead>
                          <tr>
                            <th>戶別</th><th>買方</th>
                            <th class="text-right">請佣比例</th><th class="text-right">提撥比例</th>
                            <th class="text-right">個獎池(元)</th><th class="text-right">暫留(元)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="u in pd.units" :key="u.id">
                            <td class="font-weight-medium">{{ u.unitId }}</td>
                            <td>{{ u.buyerName || '—' }}</td>
                            <td class="text-right">{{ u.ratioPct }}%</td>
                            <td class="text-right">{{ u.rateText }}</td>
                            <td class="text-right">{{ money(u.sourcePool) }}</td>
                            <td class="text-right font-weight-medium">{{ money(u.amount) }}</td>
                          </tr>
                        </tbody>
                      </v-table>
                    </td>
                  </tr>
                </template>
                <tr class="font-weight-bold bg-orange-lighten-5">
                  <td></td><td>合計</td><td></td>
                  <td class="text-right">{{ handoverUnitCount }}</td>
                  <td class="text-right text-orange-darken-3">{{ money(handoverTotal) }}</td>
                  <td></td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-card-text>
      </v-card>

      <!-- 保留款追蹤 -->
      <v-card variant="outlined">
        <v-card-title class="text-subtitle-1">
          <v-icon start size="small">mdi-safe</v-icon>保留款追蹤（本建案）
        </v-card-title>
        <v-card-text>
          <RetentionTracker :project-id="projectId" :records="records" :bonus-records="bonusRecords" />
        </v-card-text>
      </v-card>
    </template>
  </div>
</template>

<script setup>
import { useCommissionPlan } from '@/composables/useCommissionPlan';
const { belongsToPlan } = useCommissionPlan();
import { ref, computed } from 'vue';
import { useToast } from 'vue-toastification';
import { useUserStore } from '@/store/user';
import RetentionTracker from './RetentionTracker.vue';
import { fetchBonusRecords } from '@/api';
import { money, toNum } from '@/utils/commissionCalculation';

const props = defineProps({
  projectId: { type: String, required: true },
  projectName: { type: String, default: '' },
  records: { type: Array, default: () => [] },
  bonusRecords: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

const toast = useToast();
const userStore = useUserStore();

const scope = ref('project');
const expanded = ref('');
const crossLoading = ref(false);
const crossLoaded = ref(false);
const crossRows = ref([]);   // 其他建案的 bonusRecords

/** 具「請佣獎金」權限的建案清單（含本案） */
const permittedProjects = computed(() => {
  const perms = userStore.user?.permissions || {};
  const list = [];
  Object.keys(perms).forEach(pid => {
    if ((perms[pid].systems || []).includes('請佣獎金')) {
      list.push({ projectId: pid, projectName: perms[pid].projectName || pid });
    }
  });
  if (!list.some(p => p.projectId === props.projectId)) {
    list.push({ projectId: props.projectId, projectName: props.projectName });
  }
  return list;
});

async function loadCross() {
  crossLoading.value = true;
  try {
    const others = permittedProjects.value.filter(p => p.projectId !== props.projectId);
    const results = await Promise.all(others.map(async p => {
      try {
        const rows = await fetchBonusRecords(p.projectId);
        return rows.filter(belongsToPlan).map(r => ({ ...r, _projectName: p.projectName }));
      } catch {
        return [];
      }
    }));
    crossRows.value = results.flat();
    crossLoaded.value = true;
  } catch (e) {
    toast.error(`載入跨案資料失敗：${e.message}`);
  } finally {
    crossLoading.value = false;
  }
}

const sourceRows = computed(() => {
  const own = props.bonusRecords
    .filter(b => b.status !== 'voided')
    .map(b => ({ ...b, _projectName: props.projectName }));
  if (scope.value === 'project') return own;
  return own.concat(crossRows.value.filter(b => b.status !== 'voided'));
});

const statRows = computed(() => {
  const map = {};
  sourceRows.value.forEach(b => {
    const key = b.personKey || b.name;
    if (!map[key]) {
      map[key] = {
        personKey: key, name: b.name,
        count: 0, subtotal: 0, keep: 0, tax: 0, nhi: 0, net: 0,
        byPeriod: {}, byProject: {},
      };
    }
    const p = map[key];
    p.count++;
    p.subtotal += toNum(b.subtotal); p.keep += toNum(b.keep);
    p.tax += toNum(b.tax); p.nhi += toNum(b.nhi); p.net += toNum(b.net);
    const periodKey = String(toNum(b.period));
    if (!p.byPeriod[periodKey]) p.byPeriod[periodKey] = { count: 0, subtotal: 0, net: 0 };
    p.byPeriod[periodKey].count++;
    p.byPeriod[periodKey].subtotal += toNum(b.subtotal);
    p.byPeriod[periodKey].net += toNum(b.net);
    const projKey = b.projectId || 'unknown';
    if (!p.byProject[projKey]) p.byProject[projKey] = { count: 0, subtotal: 0, net: 0, projectName: b._projectName || projKey };
    p.byProject[projKey].count++;
    p.byProject[projKey].subtotal += toNum(b.subtotal);
    p.byProject[projKey].net += toNum(b.net);
  });
  return Object.values(map).sort((a, b) => b.net - a.net);
});

const statTotal = computed(() => statRows.value.reduce((t, p) => ({
  count: t.count + p.count, subtotal: t.subtotal + p.subtotal, keep: t.keep + p.keep,
  tax: t.tax + p.tax, nhi: t.nhi + p.nhi, net: t.net + p.net,
}), { count: 0, subtotal: 0, keep: 0, tax: 0, nhi: 0, net: 0 }));

// ---------- 交屋團獎累積（本建案；依 commissionRecords.handover 快照，作廢不計） ----------
const handoverExpanded = ref(null);

const handoverPeriods = computed(() => {
  const byPeriod = {};
  props.records
    .filter(r => r.status !== 'voided' && toNum(r.handover?.total) !== 0)
    .forEach(r => {
      const p = toNum(r.period);
      if (!byPeriod[p]) byPeriod[p] = { period: p, requestDate: r.requestDate || '', count: 0, total: 0, cumulative: 0, units: [] };
      const pd = byPeriod[p];
      const cats = Object.values(r.handover?.byCat || {});
      pd.count++;
      pd.total += toNum(r.handover.total);
      pd.units.push({
        id: r.id,
        unitId: r.unitId,
        buyerName: r.snapshot?.buyerName || '',
        ratioPct: toNum(r.ratioPct),
        rateText: cats.length ? cats.map(c => `${toNum(c.ratePct)}%`).join('＋') : '—',
        sourcePool: cats.reduce((s, c) => s + toNum(c.sourcePool), 0),
        amount: toNum(r.handover.total),
      });
    });
  const list = Object.values(byPeriod).sort((a, b) => a.period - b.period);
  let cum = 0;
  list.forEach(pd => {
    cum += pd.total;
    pd.cumulative = cum;
    pd.units.sort((a, b) => String(a.unitId).localeCompare(String(b.unitId), 'zh-Hant', { numeric: true }));
  });
  return list.reverse();   // 新 → 舊
});

const handoverTotal = computed(() => handoverPeriods.value.reduce((s, pd) => s + pd.total, 0));
const handoverUnitCount = computed(() => handoverPeriods.value.reduce((s, pd) => s + pd.count, 0));
</script>

<style scoped>
.table-scroll { overflow-x: auto; }
.inner-table { background: #f8fafc; }
</style>
