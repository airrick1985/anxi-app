<template>
  <v-card class="mb-3 refund-card" :id="`comm-card-${entry.id}`" variant="outlined" :class="{ 'has-issue': issueCount > 0, 'is-expanded': isOpen, 'is-split': split }">
    <!-- 標頭 -->
    <div class="card-head d-flex align-center flex-wrap ga-2 px-4 py-2" :role="split ? undefined : 'button'" :tabindex="split ? undefined : 0" :aria-expanded="isOpen"
      @keydown.enter.self="!split && $emit('toggle')" @keydown.space.prevent.self="!split && $emit('toggle')" @click="!split && $emit('toggle')">
      <v-icon v-if="!split" size="small" :class="{ 'rotate-collapsed': entry.collapsed }">mdi-chevron-down</v-icon>
      <v-chip size="x-small" color="error" variant="flat">{{ isBonus ? '退獎金' : '退佣' }}</v-chip>
      <span class="text-subtitle-1 font-weight-bold text-error">{{ entry.unitId }}</span>
      <span class="text-body-2">{{ buyerName || '—' }}</span>
      <v-chip size="x-small" :color="isReleased ? 'error' : 'default'" variant="tonal">{{ statusText || '—' }}</v-chip>
      <v-chip size="x-small" variant="tonal" :color="contractTypeColor(entry.unit?.contractType)">{{ entry.unit?.contractType || '未設定合約方式' }}</v-chip>
      <v-spacer></v-spacer>
      <strong v-if="!isBonus" class="text-body-1">退回 {{ money(plan.calc.thisClaim) }} 元</strong>
      <strong v-else class="text-body-1">追回獎金 {{ money(peopleTotals.net) }} 元</strong>
      <v-chip v-if="entry.refundBonus && !isBonus" size="x-small" variant="tonal" color="default">追回獎金 {{ money(peopleTotals.net) }} 元</v-chip>
      <v-chip v-if="issueCount" size="x-small" color="warning" variant="flat">
        <v-icon start size="x-small">mdi-alert</v-icon>{{ issueCount }} 項待處理
      </v-chip>
      <v-btn icon="mdi-close" size="small" variant="text" color="error" title="移除此戶" @click.stop="$emit('remove')"></v-btn>
    </div>

    <v-expand-transition>
      <div v-show="isOpen">
        <v-divider></v-divider>
        <v-card-text class="pt-3">
          <!-- ① 退佣來源 -->
          <div class="step-h">
            <span class="step-no">1</span>
            <span class="step-title">{{ isBonus ? '退獎金來源' : '退佣來源' }}</span>
          </div>
          <div class="step-body">
            <v-row dense align="start" class="mb-1">
              <v-col cols="12" sm="6" md="4" lg="3">
                <v-text-field v-model="entry.reason" :label="isBonus ? '退獎金原因' : '退佣原因'" variant="outlined" density="compact" hide-details></v-text-field>
              </v-col>
              <v-col cols="12" sm="6" md="4" lg="3">
                <v-text-field v-model="entry.note" label="備註" maxlength="200" variant="outlined" density="compact" hide-details clearable
                  class="claim-note-field" prepend-inner-icon="mdi-note-edit-outline" :aria-label="`${entry.unitId} 備註`" />
              </v-col>
              <v-col v-if="!isBonus" cols="12" sm="6" md="3" lg="3" class="d-flex align-center">
                <v-switch v-model="entry.includeKeep" color="error" density="compact" hide-details
                  :label="entry.includeKeep ? '含保留款（退實際請領）' : '不含保留款（退本次請佣）'"></v-switch>
              </v-col>
            </v-row>

            <div class="table-scroll">
              <v-table density="compact" class="src-table">
                <thead>
                  <tr>
                    <th style="width:40px"></th>
                    <th>期別</th><th>{{ isBonus ? '獎金日期' : '請佣日期' }}</th>
                    <th class="text-right">{{ isBonus ? '獎金比例' : '請佣比例' }}</th>
                    <template v-if="!isBonus"><th class="text-right">實際請領(元)</th><th class="text-right">保留款(元)</th><th class="text-right">本次請佣(元)</th></template>
                    <th v-else class="text-right">獎金實發(元)</th>
                    <th class="text-right">獎金明細</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in entry.candidates" :key="r.id" :class="{ 'row-off': !isSelected(r.id) }" @click="toggleSource(r.id)">
                    <td><v-checkbox-btn :model-value="isSelected(r.id)" density="compact" @click.stop="toggleSource(r.id)"></v-checkbox-btn></td>
                    <td>第 {{ r.period }} 期</td>
                    <td>{{ r.requestDate || '—' }}</td>
                    <td class="text-right">{{ r.ratioPct }}%</td>
                    <template v-if="!isBonus">
                      <td class="text-right">{{ money(r.calc?.realClaim || 0) }}</td>
                      <td class="text-right">{{ money(r.calc?.claimKeep || 0) }}</td>
                      <td class="text-right">{{ money(r.calc?.thisClaim || 0) }}</td>
                    </template>
                    <td v-else class="text-right">{{ money(bonusNetOf(r.id)) }}</td>
                    <td class="text-right">{{ bonusCountOf(r.id) }} 筆</td>
                  </tr>
                  <tr v-if="!entry.candidates.length">
                    <td colspan="8" class="text-center text-medium-emphasis">此戶沒有可退回的{{ isBonus ? '獎金' : '請佣' }}紀錄</td>
                  </tr>
                </tbody>
              </v-table>
            </div>

            <div class="result-strip mt-2">
              <div class="rs-item"><label>退回比例</label><div>{{ plan.refundRatioPct }}%</div></div>
              <template v-if="!isBonus">
                <div class="rs-item"><label>實際請領反向</label><div>{{ money(plan.calc.realClaim) }}</div></div>
                <div class="rs-item"><label>保留款抵銷</label><div>{{ money(plan.calc.claimKeep) }}</div></div>
                <div class="rs-item hl"><label>退回業主</label><div>{{ money(plan.calc.thisClaim) }}</div></div>
              </template>
              <div v-else class="rs-item hl"><label>追回獎金實發</label><div>{{ money(peopleTotals.net) }}</div></div>
              <div v-if="plan.handover.total" class="rs-item"><label>{{ handoverLabel }}沖回</label><div>{{ money(plan.handover.total) }}</div></div>
            </div>
          </div>

          <!-- ② 獎金追回 -->
          <div class="step-h mt-4">
            <span class="step-no">2</span>
            <span class="step-title">獎金追回</span>

            <v-spacer></v-spacer>
            <v-btn v-if="entry.refundBonus && entry.people" size="small" variant="text" prepend-icon="mdi-restore" @click="entry.people = null">恢復原數</v-btn>
          </div>
          <div v-if="entry.refundBonus" class="step-body">
            <div class="table-scroll">
              <v-table density="compact" class="matrix-table">
                <thead>
                  <tr>
                    <th style="width:56px"></th><th>人員</th><th>職務/來源</th>
                    <th v-for="cat in catColumns" :key="cat.key" class="text-right">{{ cat.label }}</th>
                    <th class="text-right">小計</th>
                    <th class="text-right">保留款</th><th class="text-right">稅金</th><th class="text-right">二代健保</th>
                    <th class="text-right">實發</th><th class="col-remark">備註</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!plan.people.length">
                    <td :colspan="catColumns.length + 9" class="text-center text-medium-emphasis">
                      {{ plan.originalPeople.length ? '已移除全部人員，不追回獎金' : '原紀錄沒有獎金明細' }}
                    </td>
                  </tr>
                  <tr v-for="p in plan.people" :key="p.personKey" :class="{ 'adjusted-row': p.adjusted }">
                    <td><v-btn size="x-small" variant="text" color="error" @click="removePerson(p.personKey)">移除</v-btn></td>
                    <td class="font-weight-medium">{{ p.name }}</td>
                    <td>
                      {{ p.role || '—' }}
                      <v-chip v-if="p.sourceProjectId && p.sourceProjectId !== projectId" size="x-small" color="orange" variant="tonal">{{ p.sourceProjectName || p.sourceProjectId }}</v-chip>
                    </td>
                    <td v-for="cat in catColumns" :key="cat.key" class="text-right">
                      <template v-if="p.originalAmounts[cat.key] !== undefined">
                        <input class="amt-input" type="number" min="0" :max="p.originalAmounts[cat.key]" step="1"
                          :value="p.original[cat.key]" @change="e => setAmount(p.personKey, cat.key, e.target.value)">
                        <div class="text-caption text-medium-emphasis">原 {{ money(p.originalAmounts[cat.key]) }}</div>
                      </template>
                      <span v-else class="text-disabled">—</span>
                    </td>
                    <td class="text-right font-weight-medium">{{ money(p.subtotal) }}</td>
                    <td class="text-right">{{ money(p.keep) }}<div class="text-caption text-medium-emphasis">{{ p.keepPct }}%</div></td>
                    <td class="text-right">{{ money(p.tax) }}<div class="text-caption text-medium-emphasis">{{ p.taxPct }}%</div></td>
                    <td class="text-right">{{ money(p.nhi) }}<div class="text-caption text-medium-emphasis">{{ p.nhiPct }}%</div></td>
                    <td class="text-right text-error font-weight-bold">{{ money(p.net) }}</td>
                    <td class="col-remark">
                      <input class="rmk-input" type="text" :value="p.remark" @change="e => setRemark(p.personKey, e.target.value)">
                    </td>
                  </tr>
                  <tr v-if="plan.people.length" class="font-weight-bold bg-red-lighten-5">
                    <td></td><td>合計</td><td></td>
                    <td v-for="cat in catColumns" :key="cat.key" class="text-right">{{ money(peopleTotals.amounts[cat.key] || 0) }}</td>
                    <td class="text-right">{{ money(peopleTotals.subtotal) }}</td>
                    <td class="text-right">{{ money(peopleTotals.keep) }}</td>
                    <td class="text-right">{{ money(peopleTotals.tax) }}</td>
                    <td class="text-right">{{ money(peopleTotals.nhi) }}</td>
                    <td class="text-right text-error">{{ money(peopleTotals.net) }}</td>
                    <td></td>
                  </tr>
                </tbody>
              </v-table>
            </div>
            <div v-if="removedPeople.length" class="text-caption text-medium-emphasis mt-1">
              不追回：{{ removedPeople.map(p => p.name).join('、') }}
              <v-btn size="x-small" variant="text" @click="entry.people = null">全部恢復</v-btn>
            </div>
          </div>
        </v-card-text>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<script setup>
import { contractTypeColor } from '@/utils/contractTypeColor';
import { computed, watch } from 'vue';
import { money, toNum, isHandoverCategory } from '@/utils/commissionCalculation';
import { classifySalesStatus } from '@/utils/salesStatusGroups';
import { buildRefundEntryPlan } from './refundEntry';

const props = defineProps({
  entry: { type: Object, required: true },        // 退佣 entry（reactive）
  settings: { type: Object, required: true },
  projectId: { type: String, required: true },
  bonusRecords: { type: Array, default: () => [] },
  mode: { type: String, default: 'claim' },   // 'bonus'＝退獎金：來源為獎金紀錄，只追回獎金
  split: { type: Boolean, default: false },   // 左右分欄：由工作台選取顯示，永遠展開、不可收合
});
defineEmits(['remove', 'toggle']);
const isBonus = computed(() => props.mode === 'bonus');
const isOpen = computed(() => props.split || !props.entry.collapsed);

const buyerName = computed(() => props.entry.unit?.buyerName || props.entry.candidates[0]?.snapshot?.buyerName || '');
const statusText = computed(() => props.entry.unit?.salesStatus_backend || '');
const isReleased = computed(() => classifySalesStatus(statusText.value) === 'released');

const plan = computed(() => buildRefundEntryPlan(props.entry, props.bonusRecords));

const enabledCategories = computed(() =>
  (props.settings.bonusCategories || []).filter(c => c.enabled !== false && !isHandoverCategory(c))
    .slice().sort((a, b) => (a.order || 0) - (b.order || 0))
);
const handoverLabel = computed(() =>
  (props.settings.bonusCategories || []).filter(c => c.enabled !== false && isHandoverCategory(c)).map(c => c.label).join('／') || '交屋團獎'
);
/** 類別欄：建案設定啟用類別 ＋ 原明細中存在但設定已無的 key */
const catColumns = computed(() => {
  const cols = enabledCategories.value.map(c => ({ key: c.key, label: c.label }));
  const known = new Set(cols.map(c => c.key));
  plan.value.originalPeople.forEach(p => {
    Object.keys(p.amounts || {}).forEach(k => { if (!known.has(k)) { known.add(k); cols.push({ key: k, label: k }); } });
  });
  return cols.filter(c => plan.value.originalPeople.some(p => p.amounts?.[c.key] !== undefined));
});

const peopleTotals = computed(() => {
  const t = { amounts: {}, subtotal: 0, keep: 0, tax: 0, nhi: 0, net: 0 };
  plan.value.people.forEach(p => {
    Object.keys(p.amounts).forEach(k => { t.amounts[k] = (t.amounts[k] || 0) + toNum(p.amounts[k]); });
    t.subtotal += p.subtotal; t.keep += p.keep; t.tax += p.tax; t.nhi += p.nhi; t.net += p.net;
  });
  return t;
});

const removedPeople = computed(() => {
  if (!props.entry.people) return [];
  const kept = new Set(props.entry.people.map(p => p.personKey));
  return plan.value.originalPeople.filter(p => !kept.has(p.personKey));
});

const issueCount = computed(() => {
  let n = 0;
  if (!props.entry.selectedIds.length) n++;
  if (!(toNum(props.entry.period) > 0)) n++;
  return n;
});

function isSelected(id) { return props.entry.selectedIds.includes(id); }
function toggleSource(id) {
  const i = props.entry.selectedIds.indexOf(id);
  if (i >= 0) props.entry.selectedIds.splice(i, 1);
  else props.entry.selectedIds.push(id);
}
function bonusCountOf(recordId) {
  return props.bonusRecords.filter(b => b.commissionRecordId === recordId && b.status !== 'voided').length;
}
function bonusNetOf(recordId) {
  return props.bonusRecords.filter(b => b.commissionRecordId === recordId && b.status !== 'voided').reduce((s, b) => s + toNum(b.net), 0);
}

// 來源變動 → 逐人調整重置為原數
watch(() => props.entry.selectedIds.slice(), () => { props.entry.people = null; });

/** 逐人調整：第一次修改時由原數具體化 */
function materialize() {
  if (props.entry.people) return;
  props.entry.people = plan.value.originalPeople.map(p => ({
    personKey: p.personKey,
    amounts: Object.fromEntries(Object.keys(p.amounts).map(k => [k, Math.round(toNum(p.amounts[k]))])),
    remark: p.remark || '',
  }));
}
function setAmount(personKey, catKey, val) {
  materialize();
  const p = props.entry.people.find(x => x.personKey === personKey);
  if (!p) return;
  const orig = plan.value.originalPeople.find(x => x.personKey === personKey);
  const max = Math.round(toNum(orig?.amounts?.[catKey]));
  let v = Math.round(toNum(val));
  if (v < 0) v = 0;
  if (v > max) v = max;
  p.amounts[catKey] = v;
}
function setRemark(personKey, val) {
  materialize();
  const p = props.entry.people.find(x => x.personKey === personKey);
  if (p) p.remark = String(val || '');
}
function removePerson(personKey) {
  materialize();
  props.entry.people = props.entry.people.filter(x => x.personKey !== personKey);
}
</script>

<style scoped>
.claim-note-field :deep(.v-field) { background: #fffbea; }
.claim-note-field :deep(.v-field__outline) { color: #e0b64a; }
.claim-note-field :deep(.v-field--focused .v-field__outline) { color: rgb(var(--v-theme-primary)); }
.claim-note-field :deep(.v-field__prepend-inner .v-icon) { color: #b8860b; opacity: 1; }
.refund-card { border-radius: 12px; overflow: visible; scroll-margin-top: 80px; border-color: #ddd; }
.refund-card.has-issue { border-color: #fb8c00; }
.card-head { cursor: pointer; background: #fff; border-radius: 12px 12px 0 0; }
.refund-card.is-split .card-head { cursor: default; }
.refund-card.is-split { margin-bottom: 0 !important; }
.step-h { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
.step-no {
  width: 22px; height: 22px; border-radius: 50%; background: #eee; color: #555;
  font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center;
}
.step-title { font-size: 14px; font-weight: 700; color: #334; }
.step-body { padding-left: 30px; }
@media (max-width: 600px) { .step-body { padding-left: 0; } }
.result-strip { display: flex; flex-wrap: wrap; gap: 6px; }
.rs-item { background: #f4f6fb; border-radius: 6px; padding: 4px 10px; min-width: 120px; }
.rs-item label { display: block; font-size: 11px; color: #789; }
.rs-item div { font-weight: 700; font-size: 13px; font-variant-numeric: tabular-nums; color: #263238; }
.rs-item.hl { background: #f5f5f5; }
.rotate-collapsed { transform: rotate(-90deg); }
.table-scroll { overflow-x: auto; }
.src-table tbody tr { cursor: pointer; }
.src-table th, .src-table td { white-space: nowrap; }
.row-off td { color: #aaa; }
.matrix-table th, .matrix-table td { white-space: nowrap; }
.matrix-table .col-remark { width: 100%; min-width: 160px; }
.adjusted-row td { background: #fffaf3; }
.amt-input { width: 84px; border: 1px solid #cdd8ec; border-radius: 4px; padding: 1px 4px; text-align: right; font-size: 12px; }
.rmk-input { width: 100%; min-width: 130px; border: 1px solid #cdd8ec; border-radius: 4px; padding: 1px 6px; font-size: 12px; }
/* 留出浮動選單按鈕的空間；標頭只在本戶卡片範圍內固定。 */
.refund-card.is-expanded > .card-head {
  position: sticky;
  top: calc(var(--v-layout-top, 0px) + 56px);
  z-index: 5;
  box-shadow: 0 1px 0 #ddd, 0 3px 8px #0000000a;
}
</style>
