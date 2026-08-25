<template>
  <div>
    <v-row dense class="mb-2">
      <!-- 業主請佣保留款 -->
      <v-col cols="12" md="4">
        <v-card variant="tonal" color="indigo">
          <v-card-text>
            <div class="text-caption">業主請佣保留款（有效紀錄累計）</div>
            <div class="text-h6 font-weight-bold">{{ money(ownerKeepTotal) }} 元</div>
            <div class="text-caption">已發還 {{ money(ownerPaidTotal) }} 元｜<b>未發還 {{ money(ownerKeepTotal - ownerPaidTotal) }} 元</b></div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card variant="tonal" color="teal">
          <v-card-text>
            <div class="text-caption">人員獎金保留款（有效明細累計）</div>
            <div class="text-h6 font-weight-bold">{{ money(personKeepTotal) }} 元</div>
            <div class="text-caption">已發還 {{ money(personPaidTotal) }} 元｜<b>未發還 {{ money(personKeepTotal - personPaidTotal) }} 元</b></div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4" class="d-flex align-center">
        <v-btn color="primary" variant="flat" prepend-icon="mdi-cash-refund" @click="openPayout">登記保留款發還</v-btn>
      </v-col>
    </v-row>

    <!-- 每人保留款餘額 -->
    <div class="text-caption font-weight-bold mb-1">每人獎金保留款餘額</div>
    <div class="table-scroll mb-4">
      <v-table density="compact">
        <thead>
          <tr><th>人員</th><th class="text-right">累計保留款</th><th class="text-right">已發還</th><th class="text-right">未發還餘額</th></tr>
        </thead>
        <tbody>
          <tr v-for="p in personKeepRows" :key="p.personKey">
            <td class="font-weight-medium">{{ p.name }}</td>
            <td class="text-right">{{ money(p.keep) }}</td>
            <td class="text-right">{{ money(p.paid) }}</td>
            <td class="text-right" :class="p.keep - p.paid > 0 ? 'text-orange-darken-3 font-weight-bold' : 'text-success'">{{ money(p.keep - p.paid) }}</td>
          </tr>
          <tr v-if="!personKeepRows.length"><td colspan="4" class="text-center text-medium-emphasis">尚無資料</td></tr>
        </tbody>
      </v-table>
    </div>

    <!-- 發還紀錄 -->
    <div class="text-caption font-weight-bold mb-1">發還紀錄</div>
    <div class="table-scroll">
      <v-table density="compact">
        <thead>
          <tr><th>類型</th><th>對象</th><th>期別</th><th class="text-right">金額</th><th>發還日期</th><th>備註</th><th style="width:48px"></th></tr>
        </thead>
        <tbody>
          <tr v-for="p in sortedPayouts" :key="p.id">
            <td><v-chip size="x-small" :color="p.type === 'owner' ? 'indigo' : 'teal'" variant="tonal">{{ p.type === 'owner' ? '業主請佣' : '人員獎金' }}</v-chip></td>
            <td>{{ p.type === 'owner' ? '業主' : (p.name || p.personKey) }}</td>
            <td>{{ (p.periods || []).map(x => `第${x}期`).join('、') || '—' }}</td>
            <td class="text-right font-weight-medium">{{ money(p.amount) }}</td>
            <td>{{ p.payoutDate || '—' }}</td>
            <td class="text-medium-emphasis">{{ p.note || '' }}</td>
            <td><v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error" @click="removePayout(p)"></v-btn></td>
          </tr>
          <tr v-if="!sortedPayouts.length"><td colspan="7" class="text-center text-medium-emphasis">尚無發還紀錄</td></tr>
        </tbody>
      </v-table>
    </div>

    <!-- 登記發還 dialog -->
    <v-dialog v-model="payoutOpen" max-width="480">
      <v-card>
        <v-card-title class="text-subtitle-1">登記保留款發還</v-card-title>
        <v-card-text>
          <v-btn-toggle v-model="payoutForm.type" mandatory color="primary" variant="outlined" divided density="comfortable" class="mb-3">
            <v-btn value="owner" size="small">業主請佣保留款</v-btn>
            <v-btn value="person" size="small">人員獎金保留款</v-btn>
          </v-btn-toggle>
          <v-select
            v-if="payoutForm.type === 'person'"
            v-model="payoutForm.personKey"
            :items="personOptions"
            item-title="label" item-value="personKey"
            label="人員 *" variant="outlined" density="compact" class="mb-2"
          ></v-select>
          <v-select v-model="payoutForm.periods" :items="availablePeriods" label="對應期別（可多選）" multiple chips
            variant="outlined" density="compact" class="mb-2"></v-select>
          <v-text-field v-model.number="payoutForm.amount" label="發還金額(元) *" type="number" variant="outlined" density="compact" class="mb-2"></v-text-field>
          <v-text-field v-model="payoutForm.payoutDate" label="發還日期 (yyyy/mm/dd)" variant="outlined" density="compact" class="mb-2"></v-text-field>
          <v-text-field v-model="payoutForm.note" label="備註" variant="outlined" density="compact"></v-text-field>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="payoutOpen = false">取消</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving"
            :disabled="!payoutForm.amount || (payoutForm.type === 'person' && !payoutForm.personKey)" @click="savePayout">登記</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'vue-toastification';
import { useUserStore } from '@/store/user';
import { fetchRetentionPayouts, addRetentionPayout, deleteRetentionPayout } from '@/api';
import { money, toNum, formatDateTW } from '@/utils/commissionCalculation';

const props = defineProps({
  projectId: { type: String, required: true },
  records: { type: Array, default: () => [] },       // commissionRecords
  bonusRecords: { type: Array, default: () => [] },
});

const toast = useToast();
const userStore = useUserStore();

const payouts = ref([]);
const payoutOpen = ref(false);
const saving = ref(false);
const payoutForm = ref(newForm());

function newForm() {
  return { type: 'owner', personKey: '', periods: [], amount: null, payoutDate: formatDateTW(new Date()), note: '' };
}

const activeRecords = computed(() => props.records.filter(r => r.status !== 'voided'));
const activeBonus = computed(() => props.bonusRecords.filter(b => b.status !== 'voided'));

const ownerKeepTotal = computed(() => activeRecords.value.reduce((s, r) => s + toNum(r.calc?.claimKeep), 0));
const personKeepTotal = computed(() => activeBonus.value.reduce((s, b) => s + toNum(b.keep), 0));
const ownerPaidTotal = computed(() => payouts.value.filter(p => p.type === 'owner').reduce((s, p) => s + toNum(p.amount), 0));
const personPaidTotal = computed(() => payouts.value.filter(p => p.type === 'person').reduce((s, p) => s + toNum(p.amount), 0));

const personKeepRows = computed(() => {
  const map = {};
  activeBonus.value.forEach(b => {
    if (!map[b.personKey]) map[b.personKey] = { personKey: b.personKey, name: b.name, keep: 0, paid: 0 };
    map[b.personKey].keep += toNum(b.keep);
  });
  payouts.value.filter(p => p.type === 'person').forEach(p => {
    if (map[p.personKey]) map[p.personKey].paid += toNum(p.amount);
  });
  return Object.values(map)
    .filter(p => p.keep > 0 || p.paid > 0)
    .sort((a, b) => (b.keep - b.paid) - (a.keep - a.paid));
});

const personOptions = computed(() =>
  personKeepRows.value.map(p => ({
    personKey: p.personKey,
    label: `${p.name}（未發還 ${money(p.keep - p.paid)} 元）`,
  }))
);

const availablePeriods = computed(() => {
  const set = new Set();
  activeRecords.value.forEach(r => set.add(toNum(r.period)));
  return [...set].sort((a, b) => b - a);
});

const sortedPayouts = computed(() =>
  payouts.value.slice().sort((a, b) => String(b.payoutDate || '').localeCompare(String(a.payoutDate || '')))
);

async function load() {
  try {
    payouts.value = await fetchRetentionPayouts(props.projectId);
  } catch (e) {
    console.error('[RetentionTracker] 載入失敗:', e);
  }
}
onMounted(load);

function openPayout() {
  payoutForm.value = newForm();
  payoutOpen.value = true;
}

async function savePayout() {
  saving.value = true;
  try {
    const f = payoutForm.value;
    const person = personKeepRows.value.find(p => p.personKey === f.personKey);
    await addRetentionPayout({
      projectId: props.projectId,
      type: f.type,
      personKey: f.type === 'person' ? f.personKey : '',
      name: f.type === 'person' ? (person?.name || '') : '',
      periods: f.periods,
      amount: toNum(f.amount),
      payoutDate: f.payoutDate,
      note: f.note,
      createdBy: userStore.user?.name || '',
    });
    toast.success('發還紀錄已登記');
    payoutOpen.value = false;
    await load();
  } catch (e) {
    toast.error(`登記失敗：${e.message}`);
  } finally {
    saving.value = false;
  }
}

async function removePayout(p) {
  if (!window.confirm(`確定刪除此筆發還紀錄（${money(p.amount)} 元）？`)) return;
  try {
    await deleteRetentionPayout(p.id);
    await load();
    toast.success('已刪除');
  } catch (e) {
    toast.error(`刪除失敗：${e.message}`);
  }
}
</script>

<style scoped>
.table-scroll { overflow-x: auto; }
</style>
