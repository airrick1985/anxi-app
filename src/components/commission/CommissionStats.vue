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
            跨建案彙總以「電話」識別同一人，僅涵蓋您具「請佣獎金」權限的建案（{{ permittedProjects.length }} 個）。
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
        return rows.map(r => ({ ...r, _projectName: p.projectName }));
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
</script>

<style scoped>
.table-scroll { overflow-x: auto; }
.inner-table { background: #f8fafc; }
</style>
