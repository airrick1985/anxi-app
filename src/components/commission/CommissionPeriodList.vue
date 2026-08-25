<template>
  <div>
    <div v-if="loading" class="text-center py-10">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <v-alert v-else-if="!periods.length" type="info" variant="tonal">
      目前沒有任何請佣紀錄。可於「請佣工作台」建立，或用「歷史匯入」銜接舊資料。
    </v-alert>

    <v-expansion-panels v-else variant="accordion" multiple>
      <v-expansion-panel v-for="pd in periods" :key="pd.period">
        <v-expansion-panel-title>
          <div class="d-flex align-center flex-wrap ga-2 w-100">
            <span class="text-subtitle-1 font-weight-bold">第 {{ pd.period }} 期</span>
            <v-chip size="x-small" variant="tonal">{{ pd.requestDate || '—' }}</v-chip>
            <v-chip size="x-small" variant="tonal" color="primary">{{ pd.activeCount }} 戶</v-chip>
            <v-chip v-if="pd.voidedCount" size="x-small" variant="tonal" color="error">作廢 {{ pd.voidedCount }} 戶</v-chip>
            <v-chip v-if="pd.hasImport" size="x-small" variant="tonal" color="grey">含歷史匯入</v-chip>
            <v-spacer></v-spacer>
            <span class="text-body-2 mr-2">實際請領 <b class="text-primary">{{ money(pd.claimSum) }}</b>｜本次請佣 <b class="text-success">{{ money(pd.thisClaimSum) }}</b>｜獎金實發 <b>{{ money(pd.netSum) }}</b></span>
            <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-file-export-outline"
              @click.stop="$emit('export-period', pd.period)">匯出此期</v-btn>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="table-scroll">
            <v-table density="compact">
              <thead>
                <tr>
                  <th>戶別</th><th>買方</th><th>請佣日期</th>
                  <th class="text-right">請佣比例</th><th class="text-right">佣金比例</th>
                  <th class="text-right">折數後總價(萬)</th>
                  <th class="text-right">實際請領(元)</th><th class="text-right">保留款(元)</th><th class="text-right">本次請佣(元)</th>
                  <th class="text-center">人數</th><th>狀態</th><th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in pd.records" :key="r.id" :class="{ 'voided-row': r.status === 'voided' }">
                  <td class="font-weight-medium">{{ r.unitId }}</td>
                  <td>{{ r.snapshot?.buyerName || '—' }}</td>
                  <td>{{ r.requestDate || '—' }}</td>
                  <td class="text-right">{{ r.ratioPct }}%</td>
                  <td class="text-right">{{ (Number(r.commPct) || 0).toFixed(2) }}%</td>
                  <td class="text-right">{{ money(r.calc?.dealAfter || 0) }}</td>
                  <td class="text-right">{{ money(r.calc?.realClaim || 0) }}</td>
                  <td class="text-right">{{ money(r.calc?.claimKeep || 0) }}</td>
                  <td class="text-right font-weight-bold">{{ money(r.calc?.thisClaim || 0) }}</td>
                  <td class="text-center">{{ bonusCountOf(r.id) }}</td>
                  <td>
                    <v-chip v-if="r.status === 'voided'" size="x-small" color="error" variant="tonal">已作廢</v-chip>
                    <v-chip v-else-if="r.source === 'import'" size="x-small" color="grey" variant="tonal">匯入</v-chip>
                    <v-chip v-else size="x-small" color="success" variant="tonal">有效</v-chip>
                  </td>
                  <td>
                    <v-btn v-if="r.status !== 'voided'" size="x-small" variant="text" color="error" @click="openVoid(r)">作廢</v-btn>
                    <span v-else class="text-caption text-medium-emphasis" :title="r.voidReason">{{ r.voidedBy }}</span>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>

          <!-- 每人獎金彙總（該期，僅有效） -->
          <div class="text-caption font-weight-bold mt-3 mb-1">本期每人獎金彙總（有效紀錄）</div>
          <div class="table-scroll">
            <v-table density="compact">
              <thead>
                <tr>
                  <th>人員</th><th>來源</th>
                  <th class="text-right">小計</th><th class="text-right">保留款</th>
                  <th class="text-right">稅金</th><th class="text-right">二代健保</th><th class="text-right">實發</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in pd.people" :key="p.personKey">
                  <td class="font-weight-medium">{{ p.name }}</td>
                  <td>
                    <span v-if="p.sourceProjectId && p.sourceProjectId !== projectId" class="text-caption text-orange-darken-3">{{ p.sourceProjectName || p.sourceProjectId }}</span>
                    <span v-else class="text-caption text-medium-emphasis">本案</span>
                  </td>
                  <td class="text-right">{{ money(p.subtotal) }}</td>
                  <td class="text-right">{{ money(p.keep) }}</td>
                  <td class="text-right">{{ money(p.tax) }}</td>
                  <td class="text-right">{{ money(p.nhi) }}</td>
                  <td class="text-right text-success font-weight-bold">{{ money(p.net) }}</td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- 作廢 dialog -->
    <v-dialog v-model="voidOpen" max-width="460" persistent>
      <v-card>
        <v-card-title class="text-subtitle-1 text-error">
          <v-icon start>mdi-alert-circle-outline</v-icon>作廢請佣紀錄
        </v-card-title>
        <v-card-text>
          <p class="mb-2">
            確定作廢 <b>第 {{ voidTarget?.period }} 期／{{ voidTarget?.unitId }}</b> 的請佣紀錄？
          </p>
          <ul class="text-body-2 mb-3 pl-4">
            <li>該戶「已請比例」將回溯 {{ voidTarget?.ratioPct }}%（可重新請佣）</li>
            <li>關聯的每人獎金明細將一併作廢，不再列入統計與匯出</li>
            <li>作廢紀錄保留完整資料痕跡，不可復原</li>
          </ul>
          <v-text-field v-model="voidReason" label="作廢原因（必填）" variant="outlined" density="compact"
            :rules="[v => !!v || '必填']"></v-text-field>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="voidOpen = false">取消</v-btn>
          <v-btn color="error" variant="flat" :loading="voiding" :disabled="!voidReason" @click="doVoid">確認作廢</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useToast } from 'vue-toastification';
import { useUserStore } from '@/store/user';
import { voidCommissionRecordAPI } from '@/api';
import { money, toNum } from '@/utils/commissionCalculation';

const props = defineProps({
  projectId: { type: String, required: true },
  projectName: { type: String, default: '' },
  settings: { type: Object, required: true },
  records: { type: Array, default: () => [] },
  bonusRecords: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['refresh', 'export-period']);
const toast = useToast();
const userStore = useUserStore();

const voidOpen = ref(false);
const voidTarget = ref(null);
const voidReason = ref('');
const voiding = ref(false);

const bonusByRecord = computed(() => {
  const map = {};
  props.bonusRecords.forEach(b => {
    if (!map[b.commissionRecordId]) map[b.commissionRecordId] = [];
    map[b.commissionRecordId].push(b);
  });
  return map;
});

function bonusCountOf(recordId) {
  return (bonusByRecord.value[recordId] || []).length;
}

const periods = computed(() => {
  const byPeriod = {};
  props.records.forEach(r => {
    const p = toNum(r.period);
    if (!byPeriod[p]) byPeriod[p] = [];
    byPeriod[p].push(r);
  });
  return Object.keys(byPeriod)
    .sort((a, b) => Number(b) - Number(a))
    .map(p => {
      const recs = byPeriod[p].slice().sort((a, b) => String(a.unitId).localeCompare(String(b.unitId), 'zh-Hant'));
      const active = recs.filter(r => r.status !== 'voided');
      const claimSum = active.reduce((s, r) => s + toNum(r.calc?.realClaim), 0);
      const thisClaimSum = active.reduce((s, r) => s + toNum(r.calc?.thisClaim), 0);

      // 該期每人彙總（有效獎金明細）
      const byPerson = {};
      const order = [];
      props.bonusRecords
        .filter(b => toNum(b.period) === Number(p) && b.status !== 'voided')
        .forEach(b => {
          if (!byPerson[b.personKey]) {
            byPerson[b.personKey] = {
              personKey: b.personKey, name: b.name,
              sourceProjectId: b.sourceProjectId, sourceProjectName: b.sourceProjectName,
              subtotal: 0, keep: 0, tax: 0, nhi: 0, net: 0,
            };
            order.push(b.personKey);
          }
          const agg = byPerson[b.personKey];
          agg.subtotal += toNum(b.subtotal); agg.keep += toNum(b.keep);
          agg.tax += toNum(b.tax); agg.nhi += toNum(b.nhi); agg.net += toNum(b.net);
        });
      const people = order.map(k => byPerson[k]);
      const netSum = people.reduce((s, x) => s + x.net, 0);

      return {
        period: Number(p),
        records: recs,
        activeCount: active.length,
        voidedCount: recs.length - active.length,
        hasImport: recs.some(r => r.source === 'import'),
        requestDate: (active[0] || recs[0])?.requestDate || '',
        claimSum, thisClaimSum, netSum, people,
      };
    });
});

function openVoid(record) {
  voidTarget.value = record;
  voidReason.value = '';
  voidOpen.value = true;
}

async function doVoid() {
  if (!voidTarget.value || !voidReason.value) return;
  voiding.value = true;
  try {
    const res = await voidCommissionRecordAPI({
      projectId: props.projectId,
      recordId: voidTarget.value.id,
      voidReason: voidReason.value,
      voidedBy: userStore.user?.name || '',
    });
    if (res?.ok) {
      toast.success(`已作廢 ${voidTarget.value.unitId} 的請佣紀錄（連同 ${res.bonusVoided} 筆獎金明細）`);
      voidOpen.value = false;
      emit('refresh');
    }
  } catch (e) {
    console.error('[CommissionPeriodList] 作廢失敗:', e);
    toast.error(`作廢失敗：${e.message}`);
  } finally {
    voiding.value = false;
  }
}
</script>

<style scoped>
.table-scroll { overflow-x: auto; }
.voided-row td { color: #aaa; text-decoration: line-through; }
.voided-row td:last-child, .voided-row td:nth-last-child(2) { text-decoration: none; }
</style>
