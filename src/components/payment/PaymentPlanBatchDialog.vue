<template>
  <v-dialog
    :model-value="modelValue"
    max-width="720"
    scrollable
    persistent
    content-class="mac-dialog-fit"
    @update:model-value="v => !v && close()"
  >
    <v-card class="mac-sheet ppb">
      <div class="mac-sheet-head">
        <v-icon size="18">mdi-playlist-plus</v-icon>
        <span>批次新增預計繳款</span>
        <span class="mac-page-count">{{ step }}／3</span>
        <button type="button" class="mac-sheet-close" title="關閉" :disabled="saving" @click="close">
          <v-icon size="18">mdi-close</v-icon>
        </button>
      </div>

      <v-card-text class="pa-0 mac-form ppb-body">
        <!-- 1. 內容 -->
        <div v-if="step === 1" class="mac-form-group ppb-group">
          <div class="mac-form-pad">
            <div class="mac-sheet-label">期別</div>
            <v-text-field
              v-model="content.note"
              class="mac-vfield"
              variant="solo"
              flat
              density="compact"
              hide-details
              placeholder="例：第 3 期工程款"
            ></v-text-field>
          </div>
          <div class="mac-form-pad">
            <div class="mac-sheet-label">預計日</div>
            <v-text-field
              v-model="content.expectedDate"
              class="mac-vfield"
              type="date"
              variant="solo"
              flat
              density="compact"
              hide-details
            ></v-text-field>
          </div>
          <div class="mac-form-pad">
            <div class="mac-sheet-label">金額方式</div>
            <div class="mac-form-seg mac-form-seg--block">
              <button
                v-for="mode in AMOUNT_MODES"
                :key="mode.value"
                type="button"
                class="mac-form-seg-btn"
                :class="{ 'is-active': content.amountMode === mode.value }"
                @click="content.amountMode = mode.value"
              >{{ mode.label }}</button>
            </div>
            <div v-if="content.amountMode === 'fixed'" class="ppb-amount-field">
              <div class="mac-sheet-label">金額(元)</div>
              <v-text-field
                v-model="content.fixedAmount"
                class="mac-vfield"
                type="number"
                min="1"
                variant="solo"
                flat
                density="compact"
                hide-details
              ></v-text-field>
            </div>
            <div v-else-if="content.amountMode === 'ratio'" class="ppb-amount-field">
              <div class="mac-sheet-label">成交總價比例(%)</div>
              <v-text-field
                v-model="content.ratioPercent"
                class="mac-vfield"
                type="number"
                min="0"
                max="100"
                step="0.01"
                variant="solo"
                flat
                density="compact"
                hide-details
              ></v-text-field>
            </div>
          </div>
        </div>

        <!-- 2. 選戶 -->
        <template v-else-if="step === 2">
          <div v-if="unitsLoading" class="ppb-state">
            <v-progress-circular indeterminate size="24" width="2" color="grey"></v-progress-circular>
          </div>
          <div v-else-if="unitsError" class="ppb-state ppb-state--error">
            <div class="mac-callout mac-callout--error">
              <v-icon size="16">mdi-alert-circle-outline</v-icon><span>{{ unitsError }}</span>
            </div>
            <button type="button" class="mac-btn" @click="loadUnits">重試</button>
          </div>
          <template v-else>
            <div class="ppb-filters">
              <select v-model="buildingFilter" class="mac-form-input mac-form-select ppb-building" aria-label="棟別">
                <option value="">全部棟別</option>
                <option v-for="building in buildingOptions" :key="building" :value="building">{{ building }}</option>
              </select>
              <v-text-field
                v-model="unitSearch"
                class="mac-vfield mac-vfield--search ppb-search"
                variant="solo"
                flat
                density="compact"
                hide-details
                clearable
                prepend-inner-icon="mdi-magnify"
                placeholder="戶別、買方"
              ></v-text-field>
            </div>
            <div class="ppb-statuses">
              <label v-for="status in statusOptions" :key="status" class="ppb-status">
                <input
                  type="checkbox"
                  class="mac-check"
                  :checked="statusFilter.includes(status)"
                  @change="e => toggleStatus(status, e.target.checked)"
                />
                {{ status }}
              </label>
            </div>

            <div class="mac-form-group ppb-group">
              <label class="mac-form-row ppb-all">
                <input
                  type="checkbox"
                  class="mac-check"
                  :checked="allVisibleSelected"
                  :disabled="!visibleUnits.length"
                  @change="e => toggleAllVisible(e.target.checked)"
                />
                <span class="mac-form-row-title">全選</span>
                <span class="ppb-count">已選 {{ selectedIds.size }} 戶</span>
              </label>
              <label v-for="unit in visibleUnits" :key="unit.unitId" class="mac-form-row ppb-unit">
                <input
                  type="checkbox"
                  class="mac-check"
                  :checked="selectedIds.has(unit.unitId)"
                  @change="e => toggleUnit(unit.unitId, e.target.checked)"
                />
                <span class="ppb-unit-id">{{ unit.unitId }}</span>
                <span class="ppb-unit-buyer">{{ unit.buyerName || '未填買方' }}</span>
                <span class="mac-tag">{{ unit.salesStatus_backend }}</span>
                <span class="ppb-unit-total">{{ unit.dealTotalWan ? `${formatMoney(unit.dealTotalWan)} 萬` : '—' }}</span>
              </label>
              <div v-if="!visibleUnits.length" class="mac-form-row mac-form-empty">沒有符合的戶別</div>
            </div>
          </template>
        </template>

        <!-- 3. 預覽確認 -->
        <template v-else>
          <div class="ppb-review-head">
            <div class="ppb-review-title">{{ content.note.trim() }}・{{ content.expectedDate }}</div>
            <div class="ppb-review-sum">
              新增 {{ newRows.length }} 戶<template v-if="addedCount">・已新增 {{ addedCount }} 戶</template><template v-if="existingCount">・略過 {{ existingCount }} 戶</template><template v-if="totalAmount">・合計 {{ formatMoney(totalAmount) }} 元</template>
            </div>
          </div>
          <div class="mac-form-group ppb-group">
            <div
              v-for="row in reviewRows"
              :key="row.unitId"
              class="mac-form-row ppb-unit"
              :class="{ 'is-skip': !['new', 'failed'].includes(row.status) }"
            >
              <span class="ppb-unit-id">{{ row.unitId }}</span>
              <span class="ppb-unit-buyer">{{ row.buyerName || '未填買方' }}</span>
              <span class="ppb-unit-total">{{ row.expectedAmount ? `${formatMoney(row.expectedAmount)} 元` : '未填金額' }}</span>
              <span class="mac-tag" :class="REVIEW_STATUS[row.status].tag">{{ REVIEW_STATUS[row.status].label }}</span>
              <span v-if="row.reason" class="ppb-unit-reason">{{ row.reason }}</span>
            </div>
          </div>
          <div v-if="saveError" class="mac-callout mac-callout--error ppb-error">
            <v-icon size="16">mdi-alert-circle-outline</v-icon><span>{{ saveError }}</span>
          </div>
          <div v-if="sheetSyncWarning" class="mac-callout mac-callout--warning ppb-error ppb-sheet-warning">
            <v-icon size="16">mdi-alert-outline</v-icon><span>{{ sheetSyncWarning }}</span>
          </div>
        </template>
      </v-card-text>

      <div class="mac-sheet-foot">
        <button v-if="step > 1 && !finished" type="button" class="mac-btn" :disabled="saving" @click="step -= 1">上一步</button>
        <span class="mac-spacer"></span>
        <button v-if="!finished" type="button" class="mac-btn" :disabled="saving" @click="close">取消</button>
        <button v-if="finished" type="button" class="mac-btn mac-btn--primary" @click="close">完成</button>
        <button v-else-if="step < 3" type="button" class="mac-btn mac-btn--primary" :disabled="!canNext" @click="next">下一步</button>
        <button v-else type="button" class="mac-btn mac-btn--primary" :disabled="saving || !newRows.length" @click="submit">
          <v-progress-circular v-if="saving" indeterminate size="14" width="2" color="white"></v-progress-circular>
          <span>確認新增</span>
        </button>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
/**
 * 批次新增預計繳款，規格：docs/SPEC_PaymentDueReminder.md §6.8
 * 金額由前端用 computeUnitFinance（即時成交總價，含 salesParkings）算好後送出；不用過時的 price_transaction_total。
 */
import { computed, reactive, ref, watch } from 'vue';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useToast } from 'vue-toastification';
import { db } from '@/firebase';
import { useUserStore } from '@/store/user';
import { fetchSalesHouseholdsOnce, paymentReminderApi } from '@/api';
import { computeUnitFinance } from '@/utils/commissionCalculation';
import { isValidYmd } from '@/utils/paymentRecordStatus';
import { classifySalesStatus } from '@/utils/salesStatusGroups';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: String, required: true },
});
const emit = defineEmits(['update:modelValue', 'saved']);

const AMOUNT_MODES = [
  { value: 'none', label: '不填' },
  { value: 'fixed', label: '固定金額' },
  { value: 'ratio', label: '成交總價比例' },
];
const API_BATCH_SIZE = 500;
const REVIEW_STATUS = {
  new: { label: '新增', tag: 'mac-tag--blue' },
  added: { label: '已新增', tag: 'mac-tag--green' },
  exists: { label: '已存在，略過', tag: '' },
  missing: { label: '找不到戶別', tag: 'mac-tag--orange' },
  failed: { label: '失敗', tag: 'mac-tag--red' },
};

const toast = useToast();
const userStore = useUserStore();

const step = ref(1);
const content = reactive({ note: '', expectedDate: '', amountMode: 'none', fixedAmount: '', ratioPercent: '' });

const units = ref([]);
const unitsLoaded = ref(false);
const unitsLoading = ref(false);
const unitsError = ref('');
const buildingFilter = ref('');
const statusFilter = ref([]);
const unitSearch = ref('');
const selectedIds = ref(new Set());

const saving = ref(false);
const saveError = ref('');
// 本次送出的結果 Map<unitId, { status, reason? }>；重送時已完成的戶別不再送出
const outcomes = ref(new Map());
// 批次已成功但 Sheet 同步失敗：不算失敗，留在結果畫面讓使用者看到提醒
const sheetSyncWarning = ref('');
const finished = ref(false);

const formatMoney = value => (Number(value) || 0).toLocaleString('zh-TW');
const compareNumeric = (a, b) => String(a || '').localeCompare(String(b || ''), 'zh-Hant', { numeric: true });

const fixedAmountValue = computed(() => Number(content.fixedAmount));
const ratioValue = computed(() => Number(content.ratioPercent));
const amountValid = computed(() => {
  if (content.amountMode === 'fixed') return Number.isInteger(fixedAmountValue.value) && fixedAmountValue.value > 0;
  if (content.amountMode === 'ratio') return ratioValue.value > 0 && ratioValue.value <= 100;
  return true;
});
const contentValid = computed(() => !!content.note.trim() && isValidYmd(content.expectedDate) && amountValid.value);

const canNext = computed(() => (step.value === 1 ? contentValid.value : selectedIds.value.size > 0));

const buildingOptions = computed(() => [...new Set(units.value.map(u => u.building).filter(Boolean))].sort(compareNumeric));
const statusOptions = computed(() => [...new Set(units.value.map(u => u.salesStatus_backend))].sort(compareNumeric));

const visibleUnits = computed(() => {
  const keyword = String(unitSearch.value || '').trim().toLowerCase();
  return units.value.filter(u => {
    if (buildingFilter.value && u.building !== buildingFilter.value) return false;
    if (!statusFilter.value.includes(u.salesStatus_backend)) return false;
    if (!keyword) return true;
    return [u.unitId, u.buyerName].some(v => String(v || '').toLowerCase().includes(keyword));
  });
});
const allVisibleSelected = computed(() => visibleUnits.value.length > 0
  && visibleUnits.value.every(u => selectedIds.value.has(u.unitId)));

function amountForUnit(unit) {
  if (content.amountMode === 'fixed') return fixedAmountValue.value;
  if (content.amountMode === 'ratio') return Math.round(unit.dealTotalWan * 100 * ratioValue.value);
  return null;
}

const reviewRows = computed(() => {
  const note = content.note.trim();
  return units.value
    .filter(u => selectedIds.value.has(u.unitId))
    .map(u => {
      const amount = amountForUnit(u);
      const outcome = outcomes.value.get(u.unitId);
      const exists = (u.paymentRecords || []).some(r => r
        && String(r.note || '').trim() === note
        && r.expectedDate === content.expectedDate);
      return {
        unitId: u.unitId,
        buyerName: u.buyerName,
        expectedAmount: amount > 0 ? amount : null,
        status: outcome?.status || (exists ? 'exists' : 'new'),
        reason: outcome?.reason || '',
      };
    });
});
const countByStatus = status => reviewRows.value.filter(r => r.status === status).length;
const newRows = computed(() => reviewRows.value.filter(r => r.status === 'new' || r.status === 'failed'));
const addedCount = computed(() => countByStatus('added'));
const existingCount = computed(() => countByStatus('exists'));
const totalAmount = computed(() => newRows.value.reduce((sum, r) => sum + (r.expectedAmount || 0), 0));

function toggleStatus(status, checked) {
  statusFilter.value = checked
    ? [...statusFilter.value, status]
    : statusFilter.value.filter(s => s !== status);
}
function toggleUnit(unitId, checked) {
  const next = new Set(selectedIds.value);
  if (checked) next.add(unitId);
  else next.delete(unitId);
  selectedIds.value = next;
}
function toggleAllVisible(checked) {
  const next = new Set(selectedIds.value);
  visibleUnits.value.forEach(u => (checked ? next.add(u.unitId) : next.delete(u.unitId)));
  selectedIds.value = next;
}

async function loadUnits() {
  unitsLoading.value = true;
  unitsError.value = '';
  try {
    const [households, parkingSnapshot] = await Promise.all([
      fetchSalesHouseholdsOnce(props.projectId),
      getDocs(query(collection(db, 'salesParkings'), where('projectId', '==', props.projectId))),
    ]);
    const parkings = parkingSnapshot.docs.map(d => d.data());
    // 未售與退戶類的戶別不會提醒，不列入
    units.value = households
      .filter(h => h.unitId && h.salesStatus_backend && classifySalesStatus(h.salesStatus_backend) !== 'released')
      .map(h => ({
        unitId: h.unitId,
        building: h.building || '',
        buyerName: h.buyerName || '',
        salesStatus_backend: h.salesStatus_backend,
        paymentRecords: Array.isArray(h.paymentRecords) ? h.paymentRecords : [],
        dealTotalWan: computeUnitFinance(h, parkings).dealTotal,
      }))
      .sort((a, b) => compareNumeric(a.building, b.building) || compareNumeric(a.unitId, b.unitId));
    statusFilter.value = statusOptions.value.filter(s => classifySalesStatus(s) === 'deal');
    unitsLoaded.value = true;
  } catch (error) {
    unitsError.value = `載入戶別失敗：${error.message}`;
  } finally {
    unitsLoading.value = false;
  }
}

function next() {
  if (!canNext.value) return;
  saveError.value = '';
  step.value += 1;
  if (step.value === 2 && !unitsLoaded.value) loadUnits();
}

function close() {
  if (saving.value) return;
  emit('update:modelValue', false);
}

async function submit() {
  saving.value = true;
  saveError.value = '';
  const entries = newRows.value.map(r => ({ unitId: r.unitId, expectedAmount: r.expectedAmount }));
  const results = new Map(outcomes.value);
  const sheetWarnings = new Set();
  const failedNow = [];
  let addedNow = 0;
  let requestError = '';

  for (let i = 0; i < entries.length; i += API_BATCH_SIZE) {
    const res = await paymentReminderApi({
      action: 'batchAddPlans',
      projectId: props.projectId,
      userKey: userStore.user?.key,
      expectedDate: content.expectedDate,
      note: content.note.trim(),
      entries: entries.slice(i, i + API_BATCH_SIZE),
    });
    if (res?.status !== 'success') {
      requestError = res?.message || '請稍後再試';
      break;
    }
    (res.added || []).forEach(unitId => {
      results.set(unitId, { status: 'added' });
      addedNow += 1;
    });
    (res.skipped || []).forEach(({ unitId, reason }) => {
      results.set(unitId, { status: reason === 'exists' ? 'exists' : 'missing' });
    });
    (res.failed || []).forEach(({ unitId, reason }) => {
      results.set(unitId, { status: 'failed', reason });
      failedNow.push(unitId);
    });
    if (res.sheetSyncWarning) sheetWarnings.add(res.sheetSyncWarning);
  }

  outcomes.value = results;
  // 這次沒有新增就不會同步，上次的同步失敗仍未解決，提醒要留著
  if (sheetWarnings.size) sheetSyncWarning.value = [...sheetWarnings].join('；');
  else if (addedNow > 0) sheetSyncWarning.value = '';
  saving.value = false;
  if (addedNow > 0) emit('saved');

  if (failedNow.length || requestError) {
    // 已成功的戶別不會再送；就算重送，後端也會以「已存在」略過
    const parts = [];
    if (addedCount.value) parts.push(`已新增 ${addedCount.value} 戶`);
    if (failedNow.length) parts.push(`${failedNow.length} 戶失敗：${failedNow.join('、')}`);
    if (requestError) parts.push(addedCount.value || failedNow.length ? `其餘未完成：${requestError}` : `新增失敗：${requestError}`);
    saveError.value = parts.join('，');
    return;
  }

  const summary = existingCount.value
    ? `已新增 ${addedCount.value} 戶，略過 ${existingCount.value} 戶`
    : `已新增 ${addedCount.value} 戶`;
  if (addedCount.value) toast.success(summary);
  else toast.warning(summary);
  const missing = reviewRows.value.filter(r => r.status === 'missing').map(r => r.unitId);
  if (missing.length) toast.warning(`找不到戶別：${missing.join('、')}`);
  if (sheetSyncWarning.value) {
    finished.value = true;
    return;
  }
  close();
}

// 改了期別或預計日就是另一筆預計繳款，先前的結果不再適用
watch(() => [content.note, content.expectedDate].join('|'), () => {
  outcomes.value = new Map();
  saveError.value = '';
  sheetSyncWarning.value = '';
});

watch(() => props.modelValue, open => {
  if (!open) return;
  step.value = 1;
  Object.assign(content, { note: '', expectedDate: '', amountMode: 'none', fixedAmount: '', ratioPercent: '' });
  selectedIds.value = new Set();
  buildingFilter.value = '';
  unitSearch.value = '';
  saveError.value = '';
  sheetSyncWarning.value = '';
  finished.value = false;
  outcomes.value = new Map();
  unitsLoaded.value = false; // 每次開啟重抓，已存在判斷才會是最新資料
});
</script>

<style scoped>
.ppb-body { padding: 14px !important; }
.ppb-group { margin-bottom: 4px; }
.ppb-amount-field { margin-top: 10px; }
.ppb-state { display: flex; justify-content: center; padding: 40px 16px; }
.ppb-state--error { flex-direction: column; align-items: flex-start; gap: 12px; padding: 4px 0; }

.ppb-filters { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.ppb-building { flex: 0 1 160px; height: 32px; }
.ppb-search { flex: 1 1 200px; }
.ppb-statuses { display: flex; flex-wrap: wrap; gap: 6px 14px; margin: 0 2px 10px; }
.ppb-status { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }

.ppb-all { cursor: pointer; background: #fafafb; }
.ppb-count { margin-left: auto; color: #6e6e73; font-size: 12.5px; white-space: nowrap; }
.ppb-unit { flex-wrap: wrap; gap: 4px 10px; }
label.ppb-unit { cursor: pointer; }
.ppb-unit.is-skip { color: #8e8e93; }
.ppb-unit-id { font-weight: 600; white-space: nowrap; }
.ppb-unit-buyer { flex: 1 1 80px; min-width: 0; color: #3a3a3c; overflow-wrap: anywhere; }
.ppb-unit.is-skip .ppb-unit-buyer { color: inherit; }
.ppb-unit-total { font-variant-numeric: tabular-nums; white-space: nowrap; }
.ppb-unit-reason { flex: 1 1 100%; color: #b3261b; font-size: 12.5px; overflow-wrap: anywhere; }

.ppb-review-head { margin: 0 2px 10px; }
.ppb-review-title { font-size: 15px; font-weight: 600; overflow-wrap: anywhere; }
.ppb-review-sum { margin-top: 2px; color: #6e6e73; font-size: 12.5px; }
.ppb-error { margin-top: 12px; }
.ppb-sheet-warning span { min-width: 0; overflow-wrap: anywhere; }

@media (max-width: 600px) {
  .ppb-body { padding: 12px !important; }
  .ppb-building { flex: 1 1 100%; height: 36px; font-size: 16px; }
  .ppb-search { flex: 1 1 100%; }
  .ppb .mac-form-seg-btn { font-size: 12.5px; }
}
</style>
