<template>
  <div>
    <!-- 工具列 -->
    <div class="d-flex align-center flex-wrap ga-2 mb-3">
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openPicker">新增戶別</v-btn>
      <span class="text-body-2 text-medium-emphasis">下一期別 {{ nextPeriod }}｜已選 {{ entries.length }} 戶<template v-if="refunds.length">｜退佣 {{ refunds.length }} 戶</template></span>
      <v-spacer></v-spacer>
      <template v-if="entries.length || refunds.length">
        <v-btn size="small" variant="text" @click="setAllCollapsed(false)">全部展開</v-btn>
        <v-btn size="small" variant="text" @click="setAllCollapsed(true)">全部收合</v-btn>
      </template>
    </div>

    <!-- 流程說明 -->
    <div class="flow-strip mb-3">
      <span class="fs-step"><b>1</b> 新增戶別</span>
      <v-icon size="small" class="fs-arrow">mdi-chevron-right</v-icon>
      <span class="fs-step"><b>2</b> 每戶填「本次請佣比例」、點選獎金人員</span>
      <v-icon size="small" class="fs-arrow">mdi-chevron-right</v-icon>
      <span class="fs-step"><b>3</b> 核對底部「本次合計」後送出</span>
      <span class="text-caption text-medium-emphasis ml-auto">卡片標頭顯示「待處理」表示該戶仍有類別未選人或分配有誤</span>
    </div>

    <!-- 快速定位列（置頂跟隨捲動；可跳至各戶別卡片或底部「本次合計」） -->
    <div v-if="entries.length || refunds.length" class="quick-nav d-flex flex-wrap align-center ga-1 mb-3">
      <v-chip
        v-for="e in entries"
        :key="e.id"
        size="small"
        :variant="entryIssueCount(e) ? 'tonal' : 'outlined'"
        :color="entryIssueCount(e) ? 'warning' : 'primary'"
        @click="gotoCard(e)"
      >
        <v-icon v-if="entryIssueCount(e)" start size="x-small">mdi-alert</v-icon>
        {{ e.unitId }}
        <span class="text-caption ml-1 text-medium-emphasis">{{ money(entryResult(e).claim.thisClaim) }}</span>
      </v-chip>
      <v-chip
        v-for="e in refunds"
        :key="e.id"
        size="small"
        :variant="refundIssueCount(e) ? 'tonal' : 'outlined'"
        :color="refundIssueCount(e) ? 'warning' : 'error'"
        @click="gotoCard(e)"
      >
        <v-icon start size="x-small">{{ refundIssueCount(e) ? 'mdi-alert' : 'mdi-cash-refund' }}</v-icon>
        {{ e.unitId }}
        <span class="text-caption ml-1 text-medium-emphasis">{{ money(refundPlan(e).calc.thisClaim) }}</span>
      </v-chip>
      <v-spacer></v-spacer>
      <v-chip v-if="totalIssues" size="small" variant="tonal" color="warning">{{ totalIssues }} 項待處理</v-chip>
      <v-chip size="small" variant="tonal" color="success" prepend-icon="mdi-arrow-down-bold" @click="gotoSummary">
        本次合計 {{ money(summary.thisClaimSum) }} 元
      </v-chip>
    </div>

    <v-alert v-if="!entries.length && !refunds.length" type="info" variant="tonal" class="mb-4">
      尚未選擇戶別，請點「新增戶別」（僅列出已成交且有簽約日期的戶別；已請畢 100% 者不可再選）。買方解約需退回佣金時，切到「退佣」頁籤。
    </v-alert>

    <!-- 上下配置：上＝戶別卡片編輯區（全寬）、下＝本次合計（全寬） -->
    <div class="cards-area">
      <CommissionUnitCard
        v-for="e in entries"
        :key="e.id"
        :entry="e"
        :settings="settings"
        :profiles="personProfiles"
        :project-id="projectId"
        :project-name="projectName"
        :local-personnel="personnel"
        :claimed-pct="claimedPctOf(e.unitId)"
        @remove="removeEntry(e)"
      />
      <CommissionRefundCard
        v-for="e in refunds"
        :key="e.id"
        :entry="e"
        :settings="settings"
        :project-id="projectId"
        :bonus-records="bonusRecords"
        @remove="removeRefund(e)"
      />
    </div>

    <!-- 彙總 -->
    <v-card v-if="entries.length || refunds.length" id="comm-summary" variant="outlined" class="mb-4 summary-card">
      <v-card-title class="text-subtitle-1 bg-green-lighten-5">
        本次合計（{{ entries.length }} 戶<template v-if="refunds.length">、退佣 {{ refunds.length }} 戶</template>）
      </v-card-title>
      <v-card-text>
        <v-row dense class="mb-3">
          <v-col cols="6" md="3"><div class="sum-item"><label>獎金總銷（折數後合計）</label><div>{{ money(summary.grandAfter) }} 元</div></div></v-col>
          <v-col cols="6" md="3"><div class="sum-item"><label>實際請領金額合計</label><div>{{ money(summary.claimSum) }} 元</div></div></v-col>
          <v-col cols="6" md="3"><div class="sum-item"><label>請佣保留款合計</label><div>{{ money(summary.keepSum) }} 元</div></div></v-col>
          <v-col cols="6" md="3"><div class="sum-item highlight"><label>本次請佣合計</label><div>{{ money(summary.thisClaimSum) }} 元</div></div></v-col>
          <v-col v-if="refunds.length" cols="6" md="3"><div class="sum-item refund"><label>退佣合計（已含於本次請佣合計）</label><div>{{ money(summary.refundSum) }} 元</div></div></v-col>
          <v-col v-if="hasHandover" cols="12" md="6">
            <div class="sum-item handover">
              <label>{{ handoverLabel }}暫留（自個獎提撥，本期不發放、不計入下表）</label>
              <div>{{ money(summary.handoverSum) }} 元</div>
            </div>
          </v-col>
        </v-row>
        <div class="text-caption font-weight-bold mb-1">每人獎金彙總（所有戶別加總）</div>
        <div class="table-scroll">
          <v-table density="compact" class="people-table">
            <thead>
              <tr>
                <th class="col-name">人員</th><th class="col-source">來源</th>
                <th class="text-right">小計</th><th class="text-right">保留款</th>
                <th class="text-right">稅金</th><th class="text-right">二代健保</th><th class="text-right">實發</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in summary.people" :key="p.personKey">
                <td class="font-weight-medium">{{ p.name }}</td>
                <td>
                  <v-chip v-if="p.sourceProjectId && p.sourceProjectId !== projectId" size="x-small" color="orange" variant="tonal">{{ p.sourceProjectName || p.sourceProjectId }}</v-chip>
                  <span v-else class="text-caption text-medium-emphasis">本案</span>
                </td>
                <td class="text-right">{{ money(p.subtotal) }}</td>
                <td class="text-right">{{ money(p.keep) }}</td>
                <td class="text-right">{{ money(p.tax) }}</td>
                <td class="text-right">{{ money(p.nhi) }}</td>
                <td class="text-right text-success font-weight-bold">{{ money(p.net) }}</td>
              </tr>
              <tr class="font-weight-bold bg-green-lighten-5">
                <td>合計</td><td></td>
                <td class="text-right">{{ money(summary.totals.subtotal) }}</td>
                <td class="text-right">{{ money(summary.totals.keep) }}</td>
                <td class="text-right">{{ money(summary.totals.tax) }}</td>
                <td class="text-right">{{ money(summary.totals.nhi) }}</td>
                <td class="text-right text-success">{{ money(summary.totals.net) }}</td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" size="large" variant="flat" prepend-icon="mdi-check-bold"
          :loading="submitting" :disabled="!entries.length && !refunds.length" @click="submitAll">確認送出</v-btn>
      </v-card-actions>
    </v-card>

    <!-- 戶別選擇 dialog -->
    <v-dialog v-model="pickerOpen" max-width="520">
      <v-card>
        <v-tabs v-model="pickerTab" color="primary" density="compact">
          <v-tab value="claim">請佣</v-tab>
          <v-tab value="refund">退佣</v-tab>
        </v-tabs>
        <v-divider></v-divider>
        <v-card-title class="text-subtitle-1">
          {{ pickerTab === 'refund' ? '選擇退佣戶別（列出有有效請佣紀錄者）' : '選擇戶別（僅列已成交且有簽約日期）' }}
        </v-card-title>
        <v-card-text class="pt-0">
          <v-text-field v-model="pickerSearch" placeholder="搜尋戶別 / 買方…" density="compact" variant="outlined"
            prepend-inner-icon="mdi-magnify" hide-details clearable class="mb-2"></v-text-field>
          <div v-if="pickerTab === 'refund'" class="picker-list">
            <v-list density="compact">
              <v-list-item
                v-for="u in filteredRefundUnits"
                :key="u.unitId"
                :disabled="u.disabled"
                @click="!u.disabled && togglePick(u.unitId)"
              >
                <template #prepend>
                  <v-checkbox-btn :model-value="!!pickSel[u.unitId]" :disabled="u.disabled" density="compact" color="error"></v-checkbox-btn>
                </template>
                <v-list-item-title>
                  {{ u.unitId }}
                  <v-chip v-if="u.released" size="x-small" color="error" variant="tonal" class="ml-1">{{ u.statusText }}</v-chip>
                  <span v-else class="text-caption ml-1 text-medium-emphasis">{{ u.statusText }}</span>
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  <span v-if="u.buyerName" class="mr-2">{{ u.buyerName }}</span>
                  <span>已請 {{ u.claimedPct }}%・{{ u.count }} 筆紀錄・可退 {{ money(u.thisClaimSum) }} 元</span>
                </v-list-item-subtitle>
                <template #append>
                  <span v-if="u.isAdded" class="text-caption text-medium-emphasis">已加入</span>
                </template>
              </v-list-item>
            </v-list>
            <div v-if="!filteredRefundUnits.length" class="text-center text-medium-emphasis py-6">沒有可退佣的戶別</div>
          </div>
          <div v-else class="picker-list">
            <v-list density="compact">
              <v-list-item
                v-for="u in filteredPickerUnits"
                :key="u.unitId"
                :disabled="u.disabled"
                @click="!u.disabled && togglePick(u.unitId)"
              >
                <template #prepend>
                  <v-checkbox-btn :model-value="!!pickSel[u.unitId]" :disabled="u.disabled" density="compact"></v-checkbox-btn>
                </template>
                <v-list-item-title>
                  {{ u.unitId }}
                  <span v-if="u.claimedPct > 0" class="text-caption ml-1" :class="u.claimedPct >= 100 ? 'text-error' : 'text-orange-darken-3'">
                    （已請佣 {{ u.claimedPct }}%）
                  </span>
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  <span v-if="u.buyerName" class="mr-2">{{ u.buyerName }}</span>
                  <span v-if="u.paymentRatio !== null" class="text-teal font-weight-bold">繳款 {{ u.paymentRatio }}%</span>
                  <span v-else class="text-medium-emphasis">繳款 —</span>
                </v-list-item-subtitle>
                <template #append>
                  <span class="text-caption text-medium-emphasis">{{ u.statusText }}</span>
                </template>
              </v-list-item>
            </v-list>
            <div v-if="!filteredPickerUnits.length" class="text-center text-medium-emphasis py-6">無符合條件的戶別</div>
          </div>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="pickerOpen = false">關閉</v-btn>
          <v-btn :color="pickerTab === 'refund' ? 'error' : 'primary'" variant="flat" :disabled="!pickCount" @click="confirmPick">
            {{ pickerTab === 'refund' ? '加入退佣' : '加入' }}{{ pickCount ? `（${pickCount}）` : '' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 送出前確認 dialog -->
    <v-dialog v-model="confirmOpen" max-width="560" persistent>
      <v-card>
        <v-card-title class="text-subtitle-1" :class="confirmData.blocking ? 'text-error' : 'text-warning'">
          <v-icon start>{{ confirmData.blocking ? 'mdi-close-octagon' : 'mdi-alert' }}</v-icon>
          {{ confirmData.title }}
        </v-card-title>
        <v-card-text style="max-height: 60vh; overflow: auto">
          <div v-for="(sec, i) in confirmData.sections" :key="i" class="mb-3">
            <div class="font-weight-bold mb-1">{{ sec.title }}</div>
            <div class="text-caption text-medium-emphasis mb-1" v-if="sec.subtitle">{{ sec.subtitle }}</div>
            <v-alert v-for="(item, j) in sec.items" :key="j" density="compact" variant="tonal"
              :type="confirmData.blocking ? 'error' : 'warning'" class="mb-1">{{ item }}</v-alert>
          </div>
          <div v-if="!confirmData.blocking" class="text-caption text-medium-emphasis">確認無誤可繼續送出，或返回修改。</div>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="confirmOpen = false">返回修改</v-btn>
          <v-btn v-if="!confirmData.blocking" color="primary" variant="flat" @click="confirmOpen = false; doSubmit()">繼續送出</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { useUserStore } from '@/store/user';
import CommissionUnitCard from './CommissionUnitCard.vue';
import CommissionRefundCard from './CommissionRefundCard.vue';
import { refundableRecordsByUnit, buildRefundEntryPlan } from './refundEntry';
import { submitCommissionEntriesAPI } from '@/api';
import {
  calcUnitBonus, computeUnitFinance, resolveCommPct, formatDateTW,
  money, toNum, evenShares, paymentRatioPct, matchesRolePositions, isHandoverCategory, resolveSplitMode,
} from '@/utils/commissionCalculation';
import { classifySalesStatus } from '@/utils/salesStatusGroups';

const props = defineProps({
  projectId: { type: String, required: true },
  projectName: { type: String, default: '' },
  settings: { type: Object, required: true },
  households: { type: Array, default: () => [] },
  parkings: { type: Array, default: () => [] },
  personnel: { type: Array, default: () => [] },
  ledgers: { type: Object, default: () => ({}) },   // unitId -> claimedRatioPct
  nextPeriod: { type: Number, default: 1 },
  records: { type: Array, default: () => [] },        // 全建案請佣紀錄（退佣來源）
  bonusRecords: { type: Array, default: () => [] },   // 全建案獎金明細（退佣追回原數）
});

const emit = defineEmits(['submitted']);
const toast = useToast();
const userStore = useUserStore();

const entries = ref([]);
const refunds = ref([]);
const personProfiles = reactive({});
let seq = 0;

const pickerOpen = ref(false);
const pickerTab = ref('claim');
const pickerSearch = ref('');
const pickSel = reactive({});
const submitting = ref(false);
const confirmOpen = ref(false);
const confirmData = ref({ title: '', blocking: false, sections: [] });

const enabledCategories = computed(() =>
  (props.settings.bonusCategories || [])
    .filter(c => c.enabled !== false)
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0))
);
const handoverCategories = computed(() => enabledCategories.value.filter(isHandoverCategory));
const hasHandover = computed(() => handoverCategories.value.length > 0);
const handoverLabel = computed(() => handoverCategories.value.map(c => c.label).join('／') || '交屋團獎');

// ---------- 已請比例（ledger + 本場已送出即時更新由父層 refresh） ----------
function claimedPctOf(unitId) {
  return Math.round(toNum(props.ledgers[unitId]) * 10) / 10;
}

// ---------- 戶別選擇 ----------
const eligibleUnits = computed(() =>
  props.households.filter(u =>
    classifySalesStatus(u.salesStatus_backend) === 'deal' && u.payment_contract_date
  )
);

const pickerUnits = computed(() => {
  const added = new Set(entries.value.map(e => e.unitId));
  return eligibleUnits.value.map(u => {
    const claimed = claimedPctOf(u.unitId);
    const full = claimed >= 100;
    const isAdded = added.has(u.unitId);
    return {
      unitId: u.unitId,
      buyerName: u.buyerName || '',
      claimedPct: claimed,
      paymentRatio: paymentRatioPct(u, computeUnitFinance(u, props.parkings).dealTotal),
      disabled: full || isAdded,
      statusText: isAdded ? '已加入' : (full ? '已請畢' : (claimed > 0 ? `尚餘 ${Math.round((100 - claimed) * 10) / 10}%` : '')),
      _raw: u,
    };
  });
});

const filteredPickerUnits = computed(() => {
  const f = String(pickerSearch.value || '').trim().toLowerCase();
  if (!f) return pickerUnits.value;
  return pickerUnits.value.filter(u =>
    String(u.unitId).toLowerCase().includes(f) || String(u._raw.buyerName || '').toLowerCase().includes(f)
  );
});

// ---------- 退佣戶別（有有效請佣紀錄者；解約／退戶排前） ----------
const refundableByUnit = computed(() => refundableRecordsByUnit(props.records));

const refundUnits = computed(() => {
  const added = new Set(refunds.value.map(e => e.unitId));
  return Object.keys(refundableByUnit.value).map(unitId => {
    const recs = refundableByUnit.value[unitId];
    const unit = props.households.find(u => u.unitId === unitId) || null;
    const statusText = unit?.salesStatus_backend || '';
    const released = classifySalesStatus(statusText) === 'released';
    const isAdded = added.has(unitId);
    return {
      unitId,
      buyerName: unit?.buyerName || recs[recs.length - 1]?.snapshot?.buyerName || '',
      statusText: statusText || '—',
      released,
      claimedPct: claimedPctOf(unitId),
      count: recs.length,
      thisClaimSum: recs.reduce((s, r) => s + toNum(r.calc?.thisClaim), 0),
      isAdded,
      disabled: isAdded,
    };
  }).sort((a, b) => (Number(b.released) - Number(a.released))
    || String(a.unitId).localeCompare(String(b.unitId), 'zh-Hant', { numeric: true }));
});

const filteredRefundUnits = computed(() => {
  const f = String(pickerSearch.value || '').trim().toLowerCase();
  if (!f) return refundUnits.value;
  return refundUnits.value.filter(u =>
    String(u.unitId).toLowerCase().includes(f) || String(u.buyerName || '').toLowerCase().includes(f)
  );
});

const pickCount = computed(() => Object.keys(pickSel).filter(k => pickSel[k]).length);

function openPicker() {
  Object.keys(pickSel).forEach(k => delete pickSel[k]);
  pickerSearch.value = '';
  pickerOpen.value = true;
}
watch(pickerTab, () => { Object.keys(pickSel).forEach(k => delete pickSel[k]); });

function togglePick(unitId) {
  if (pickSel[unitId]) delete pickSel[unitId];
  else pickSel[unitId] = true;
}

function confirmPick() {
  if (pickerTab.value === 'refund') {
    const before = refunds.value.length;
    Object.keys(pickSel).forEach(unitId => {
      if (pickSel[unitId] && !refunds.value.some(e => e.unitId === unitId)) addRefund(unitId);
    });
    if (refunds.value.length - before === 1) refunds.value[refunds.value.length - 1].collapsed = false;
  } else {
    const before = entries.value.length;
    Object.keys(pickSel).forEach(unitId => {
      if (pickSel[unitId] && !entries.value.some(e => e.unitId === unitId)) addUnit(unitId);
    });
    // 只加入一戶時直接展開
    if (entries.value.length - before === 1) entries.value[entries.value.length - 1].collapsed = false;
  }
  Object.keys(pickSel).forEach(k => delete pickSel[k]);
  pickerOpen.value = false;
}

// ---------- 建立退佣卡片 ----------
function addRefund(unitId) {
  const candidates = (refundableByUnit.value[unitId] || []).slice();
  if (!candidates.length) return;
  refunds.value.push({
    id: `r${seq++}`,
    kind: 'refund',
    unitId,
    unit: props.households.find(u => u.unitId === unitId) || null,
    period: props.nextPeriod,
    requestDate: formatDateTW(new Date()),
    reason: '買方解約',
    includeKeep: false,
    refundBonus: true,
    candidates,
    selectedIds: candidates.map(r => r.id),
    people: null,           // 逐人調整（null＝原數反向）
    collapsed: true,
  });
}

function removeRefund(e) {
  refunds.value = refunds.value.filter(x => x !== e);
}

function refundPlan(e) {
  return buildRefundEntryPlan(e, props.bonusRecords);
}

function refundIssueCount(e) {
  return (e.selectedIds.length ? 0 : 1) + (toNum(e.period) > 0 ? 0 : 1);
}

// ---------- 建立戶別卡片 ----------
function personKeyOf(p) { return p.phone || `ext:${p.name}`; }

function ensureProfile(personKey, name) {
  if (personProfiles[personKey]) return;
  const p = props.personnel.find(x => personKeyOf(x) === personKey || x.name === name);
  const bc = p?.bonusConfig || {};
  personProfiles[personKey] = {
    name: p?.name || name,
    role: (p?.positions || []).join('、'),
    keepPct: toNum(bc.keepPct),
    taxPct: toNum(bc.taxPct),
    nhiPct: toNum(bc.nhiPct),
    remark: bc.remark || '',
    sourceProjectId: props.projectId,
    sourceProjectName: props.projectName,
  };
}

function normalizeNames(v) {
  if (Array.isArray(v)) return v.map(s => String(s).trim()).filter(Boolean);
  if (typeof v === 'string') return v.split(/[、,，\/\s]+/).map(s => s.trim()).filter(Boolean);
  return [];
}

function evenAlloc(persons) {
  const allocations = persons.map(p => ({
    personKey: p.personKey,
    name: p.name,
    sourceProjectId: props.projectId,
    sourceProjectName: props.projectName,
    isExternal: !!p.isExternal,
    mode: 'pct',
    sharePct: 0,
    lockedAmount: null,
  }));
  const shares = evenShares(allocations.length);
  allocations.forEach((a, i) => { a.sharePct = shares[i]; });
  return allocations;
}

function addUnit(unitId) {
  const unit = props.households.find(u => u.unitId === unitId);
  if (!unit) return;
  const finance = computeUnitFinance(unit, props.parkings);
  const claimed = claimedPctOf(unitId);

  const categories = {};
  enabledCategories.value.forEach(cat => {
    let allocations = [];
    if (cat.mode === 'individual') {
      const names = normalizeNames(unit.salesperson);
      const persons = names.map(nm => {
        const p = props.personnel.find(x => x.name === nm);
        const personKey = p ? personKeyOf(p) : `ext:${nm}`;
        ensureProfile(personKey, nm);
        return { personKey, name: nm, isExternal: !p };
      });
      allocations = evenAlloc(persons);
    } else if (cat.mode === 'role') {
      const pool = props.personnel.filter(p => matchesRolePositions(p.positions, cat.rolePositions));
      if (pool.length === 1) {
        const personKey = personKeyOf(pool[0]);
        ensureProfile(personKey, pool[0].name);
        allocations = evenAlloc([{ personKey, name: pool[0].name }]);
      }
    }
    categories[cat.key] = {
      key: cat.key,
      label: cat.label,
      mode: cat.mode,
      ratePct: toNum(cat.ratePct),
      sourceCatKey: cat.sourceCatKey || '',   // 提撥類別的來源類別（其他類別為空）
      enabled: true,                          // 提撥類別：本戶是否提撥（工作台可關閉）
      splitMode: resolveSplitMode(props.settings, cat),   // 均分尾差處理（建案設定；隨紀錄快照）
      allocations,                            // 提撥類別不分配人員，恆為空
    };
  });

  entries.value.push({
    id: `e${seq++}`,
    unitId,
    unit,
    finance,
    period: props.nextPeriod,
    requestDate: formatDateTW(new Date()),
    ratioPct: Math.max(0, Math.round((100 - claimed) * 10) / 10),
    commPct: resolveCommPct(props.settings, !!unit.isPreferredPayment),
    keepPct: toNum(props.settings.defaultKeepPct),
    partyAFee: 0,
    partyBFee: 0,
    teamSiteKeys: [],
    categories,
    collapsed: true,
  });
}

function removeEntry(e) {
  entries.value = entries.value.filter(x => x !== e);
}

function setAllCollapsed(v) {
  entries.value.forEach(e => { e.collapsed = v; });
  refunds.value.forEach(e => { e.collapsed = v; });
}

function gotoCard(e) {
  e.collapsed = false;
  requestAnimationFrame(() => {
    const el = document.getElementById(`comm-card-${e.id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function gotoSummary() {
  const el = document.getElementById('comm-summary');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------- 計算 ----------
function entryInput(e) {
  return {
    ratioPct: toNum(e.ratioPct),
    commPct: toNum(e.commPct),
    keepPct: toNum(e.keepPct),
    partyAFee: toNum(e.partyAFee),
    partyBFee: toNum(e.partyBFee),
    categories: e.categories,
  };
}

function entryResult(e) {
  return calcUnitBonus(e.finance, entryInput(e), personProfiles);
}

/** 該戶待處理項目數（與卡片標頭一致）：未選人類別 + 分配錯誤 + 比例問題 */
function entryIssueCount(e) {
  const r = entryResult(e);
  const claimed = claimedPctOf(e.unitId);
  const missing = enabledCategories.value.filter(cat => {
    if (isHandoverCategory(cat)) return false;
    const c = e.categories[cat.key];
    return c && toNum(c.ratePct) > 0 && c.allocations.length === 0;
  }).length;
  const ratioBad = (claimed + toNum(e.ratioPct) > 100.0001) || !(toNum(e.ratioPct) > 0);
  return missing + r.errors.length + (ratioBad ? 1 : 0);
}
const totalIssues = computed(() =>
  entries.value.reduce((s, e) => s + entryIssueCount(e), 0) + refunds.value.reduce((s, e) => s + refundIssueCount(e), 0)
);

const summary = computed(() => {
  let grandAfter = 0, claimSum = 0, keepSum = 0, thisClaimSum = 0, handoverSum = 0, refundSum = 0;
  const byPerson = {};
  const order = [];
  const addPerson = p => {
    if (!byPerson[p.personKey]) {
      byPerson[p.personKey] = {
        personKey: p.personKey, name: p.name,
        sourceProjectId: p.sourceProjectId, sourceProjectName: p.sourceProjectName,
        subtotal: 0, keep: 0, tax: 0, nhi: 0, net: 0,
      };
      order.push(p.personKey);
    }
    const b = byPerson[p.personKey];
    b.subtotal += p.subtotal; b.keep += p.keep; b.tax += p.tax; b.nhi += p.nhi; b.net += p.net;
  };
  entries.value.forEach(e => {
    const r = entryResult(e);
    grandAfter += r.claim.dealAfter * 10000;
    claimSum += r.claim.realClaim;
    keepSum += r.claim.claimKeep;
    thisClaimSum += r.claim.thisClaim;
    handoverSum += toNum(r.handoverTotal);
    r.people.forEach(addPerson);
  });
  // 退佣：金額為負值，直接併入合計
  refunds.value.forEach(e => {
    const pl = refundPlan(e);
    grandAfter += pl.calc.dealAfter * 10000;
    claimSum += pl.calc.realClaim;
    keepSum += pl.calc.claimKeep;
    thisClaimSum += pl.calc.thisClaim;
    refundSum += pl.calc.thisClaim;
    handoverSum += toNum(pl.handover.total);
    pl.people.forEach(addPerson);
  });
  const people = order.map(k => byPerson[k]);
  const totals = people.reduce((t, p) => ({
    subtotal: t.subtotal + p.subtotal, keep: t.keep + p.keep,
    tax: t.tax + p.tax, nhi: t.nhi + p.nhi, net: t.net + p.net,
  }), { subtotal: 0, keep: 0, tax: 0, nhi: 0, net: 0 });
  return { grandAfter, claimSum, keepSum, thisClaimSum, handoverSum, refundSum, people, totals };
});

// ---------- 送出 ----------
function collectIssues() {
  const blocking = [];
  const warnings = [];
  const feeMiss = [];

  entries.value.forEach(e => {
    const claimed = claimedPctOf(e.unitId);
    if (claimed + toNum(e.ratioPct) > 100.0001) {
      blocking.push(`${e.unitId}：已請 ${claimed}% ＋ 本次 ${e.ratioPct}% 超過 100%`);
    }
    if (!(toNum(e.ratioPct) > 0)) {
      blocking.push(`${e.unitId}：本次請佣比例須大於 0`);
    }
    const r = entryResult(e);
    r.errors.forEach(err => {
      const label = e.categories[err.catKey]?.label || err.catKey;
      blocking.push(`${e.unitId}／${label}：${err.error}`);
    });

    // 提醒：類別無人勾選（僅提醒有候選人的類別）
    const missCats = [];
    enabledCategories.value.forEach(cat => {
      if (isHandoverCategory(cat)) return;   // 提撥類別不勾人
      const c = e.categories[cat.key];
      if (c && c.allocations.length === 0 && toNum(c.ratePct) > 0) missCats.push(cat.label);
    });
    if (missCats.length) warnings.push(`${e.unitId}：${missCats.join('、')} 尚未勾選人員`);
    if (props.settings.teamGroups.length && e.teamSiteKeys.length === 0) {
      const hasTeamCat = enabledCategories.value.some(c => c.mode === 'team');
      if (hasTeamCat) warnings.push(`${e.unitId}：未勾選團獎案場`);
    }

    const note = String(e.unit.remarks || '');
    if (/介紹|贈品/.test(note) && toNum(e.partyAFee) === 0 && toNum(e.partyBFee) === 0) {
      feeMiss.push(`${e.unitId}：${note}`);
    }
  });

  const refundNotes = [];
  refunds.value.forEach(e => {
    if (!e.selectedIds.length) blocking.push(`退佣 ${e.unitId}：未勾選要退回的原請佣紀錄`);
    if (!(toNum(e.period) > 0)) blocking.push(`退佣 ${e.unitId}：期別須為正整數`);
    const pl = refundPlan(e);
    const status = e.unit?.salesStatus_backend || '';
    const released = classifySalesStatus(status) === 'released';
    const bonusText = e.refundBonus ? `追回獎金 ${money(pl.people.reduce((s, p) => s + p.net, 0))} 元` : '不追回獎金';
    refundNotes.push(`${e.unitId}（${status || '狀態不明'}）：退回 ${money(pl.calc.thisClaim)} 元、${bonusText}${released ? '' : '；⚠ 銷控狀態非解約／退戶'}`);
  });

  return { blocking, warnings, feeMiss, refundNotes };
}

async function submitAll() {
  const { blocking, warnings, feeMiss, refundNotes } = collectIssues();
  if (blocking.length) {
    confirmData.value = {
      title: '無法送出，請先修正',
      blocking: true,
      sections: [{ title: '以下問題需修正：', items: blocking }],
    };
    confirmOpen.value = true;
    return;
  }
  if (warnings.length || feeMiss.length || refundNotes.length) {
    const sections = [];
    if (refundNotes.length) sections.push({ title: '↩ 退佣戶別', subtitle: '送出後原紀錄標記「已退佣」、已請比例回溯，可於歷期總覽作廢退佣紀錄還原：', items: refundNotes });
    if (warnings.length) sections.push({ title: '⚠ 有項目尚未勾選人員', subtitle: '確認是否刻意留空：', items: warnings });
    if (feeMiss.length) sections.push({ title: '🎁 可能有介紹費/贈品尚未填寫', subtitle: '備註提到介紹/贈品但金額為 0：', items: feeMiss });
    confirmData.value = { title: '送出前確認', blocking: false, sections };
    confirmOpen.value = true;
    return;
  }
  doSubmit();
}

async function doSubmit() {
  submitting.value = true;
  try {
    const payloadEntries = entries.value.map(e => {
      // 只帶本戶有參與的人員 profile
      const involved = new Set();
      Object.values(e.categories).forEach(c => c.allocations.forEach(a => involved.add(a.personKey)));
      const profiles = {};
      involved.forEach(k => { if (personProfiles[k]) profiles[k] = { ...personProfiles[k] }; });
      return {
        unitId: e.unitId,
        period: Number(e.period) || 0,
        requestDate: e.requestDate,
        ratioPct: toNum(e.ratioPct),
        commPct: toNum(e.commPct),
        keepPct: toNum(e.keepPct),
        partyAFee: toNum(e.partyAFee),
        partyBFee: toNum(e.partyBFee),
        teamSiteKeys: [...e.teamSiteKeys],
        categories: JSON.parse(JSON.stringify(e.categories)),
        personProfiles: profiles,
      };
    });

    const payloadRefunds = refunds.value.map(e => ({
      unitId: e.unitId,
      period: Number(e.period) || 0,
      requestDate: e.requestDate,
      reason: String(e.reason || ''),
      includeKeep: !!e.includeKeep,
      refundBonus: e.refundBonus !== false,
      sourceRecordIds: [...e.selectedIds],
      people: e.people ? JSON.parse(JSON.stringify(e.people)) : null,
    }));

    const res = await submitCommissionEntriesAPI({
      projectId: props.projectId,
      createdBy: userStore.user?.name || userStore.user?.phone || '',
      entries: payloadEntries,
      refunds: payloadRefunds,
    });
    if (res?.ok) {
      const nRefund = res.results.filter(r => r.refund).length;
      const nClaim = res.results.length - nRefund;
      toast.success(`已寫入 ${nClaim} 戶請佣紀錄${nRefund ? `、${nRefund} 戶退佣紀錄` : ''}`);
      entries.value = [];
      refunds.value = [];
      emit('submitted');
    } else {
      toast.error('寫入失敗，請重試');
    }
  } catch (e) {
    console.error('[CommissionWorkbench] 送出失敗:', e);
    toast.error(`送出失敗：${e.message}`);
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.flow-strip {
  display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px;
  background: #f4f6fb; border-radius: 8px; padding: 6px 12px; font-size: 13px;
}
.fs-step b {
  display: inline-flex; width: 18px; height: 18px; border-radius: 50%; align-items: center; justify-content: center;
  background: rgb(var(--v-theme-primary)); color: #fff; font-size: 11px; margin-right: 4px;
}
.fs-arrow { color: #9aa; }
.quick-nav {
  position: sticky;
  top: 0;
  z-index: 5;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  padding: 6px 0;
}
.picker-list { max-height: 50vh; overflow-y: auto; border: 1px solid rgba(0,0,0,.08); border-radius: 8px; }
.sum-item { background: #f4f8f6; border-radius: 8px; padding: 8px 12px; }
.sum-item label { font-size: 11px; color: #789; display: block; }
.sum-item div { font-size: 17px; font-weight: 700; color: #1a4; }
.sum-item.highlight div { color: #087f23; }
.sum-item.handover { background: #fff7ed; }
.sum-item.handover div { color: #c2410c; }
.sum-item.refund { background: #fdecea; }
.sum-item.refund div { color: #c62828; }
.table-scroll { overflow-x: auto; }
/* 每人彙總表：人員／來源欄固定合理寬度，其餘金額欄平均分配 */
.people-table th, .people-table td { white-space: nowrap; }
.people-table .col-name { min-width: 110px; }
.people-table .col-source { min-width: 90px; }
</style>
