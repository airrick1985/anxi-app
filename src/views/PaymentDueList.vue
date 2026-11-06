<template>
  <div class="mac-page pd-page">
    <div class="mac-page-bar">
      <div class="mac-page-title pd-title">
        <button type="button" class="mac-icon-btn" :title="canManage ? '返回銷控系統' : '返回首頁'" @click="goBack">
          <v-icon size="20">mdi-chevron-left</v-icon>
        </button>
        <span class="mac-page-title-main">繳款到期</span>
        <span v-if="projectName" class="pd-project">{{ projectName }}</span>
      </div>
      <div class="mac-page-actions">
        <button type="button" class="mac-icon-btn" title="重新整理" :disabled="refreshing" @click="load({ silent: true })">
          <v-icon size="18" :class="{ 'pd-spin': refreshing }">mdi-refresh</v-icon>
        </button>
        <button v-if="canManage" type="button" class="mac-btn mac-btn--primary" @click="batchOpen = true">
          <v-icon size="16">mdi-playlist-plus</v-icon><span>批次新增</span>
        </button>
      </div>
    </div>

    <div v-if="viewState === 'loading'" class="mac-list-loading">
      <v-progress-circular indeterminate size="24" width="2" color="grey"></v-progress-circular>
    </div>

    <div v-else-if="viewState === 'denied'" class="pd-state">
      <div class="mac-callout mac-callout--warning">
        <v-icon size="16">mdi-lock-outline</v-icon><span>{{ errorText }}</span>
      </div>
      <button type="button" class="mac-btn" @click="router.push({ name: 'Home' })">回首頁</button>
    </div>

    <div v-else-if="viewState === 'error'" class="pd-state">
      <div class="mac-callout mac-callout--error">
        <v-icon size="16">mdi-alert-circle-outline</v-icon><span>{{ errorText }}</span>
      </div>
      <button type="button" class="mac-btn" @click="load()">重試</button>
    </div>

    <template v-else>
      <div class="pd-summary">
        <button type="button" class="pd-stat is-red" :class="{ 'is-active': filter === 'overdue' }" @click="toggleFilter('overdue')">
          <span class="pd-stat-label">逾期</span>
          <span class="pd-stat-value">{{ overdueItems.length }} 筆</span>
          <span class="pd-stat-amount">{{ formatMoney(sumAmount(overdueItems)) }} 元</span>
        </button>
        <button type="button" class="pd-stat is-orange" :class="{ 'is-active': filter === 'soon' }" @click="toggleFilter('soon')">
          <span class="pd-stat-label">7 天內</span>
          <span class="pd-stat-value">{{ soonItems.length }} 筆</span>
          <span class="pd-stat-amount">{{ formatMoney(sumAmount(soonItems)) }} 元</span>
        </button>
      </div>

      <div class="pd-toolbar">
        <div class="mac-form-seg" :class="{ 'mac-form-seg--block': smAndDown }">
          <button
            v-for="f in filterOptions"
            :key="f.value"
            type="button"
            class="mac-form-seg-btn"
            :class="{ 'is-active': filter === f.value }"
            @click="filter = f.value"
          >{{ f.label }} {{ f.count }}</button>
        </div>
        <v-text-field
          v-model="searchText"
          class="mac-vfield mac-vfield--search pd-search"
          variant="solo"
          flat
          density="compact"
          hide-details
          clearable
          prepend-inner-icon="mdi-magnify"
          placeholder="戶別、期別、買方、電話"
        ></v-text-field>
      </div>

      <div v-if="!visibleItems.length" class="mac-list-empty">
        {{ items.length ? '沒有符合的項目' : '目前沒有待繳項目' }}
      </div>

      <!-- 手機：清單列 -->
      <div v-else-if="smAndDown" class="mac-list">
        <div
          v-for="item in visibleItems"
          :key="`${item.unitId}_${item.recordId}`"
          class="mac-list-row"
          role="button"
          tabindex="0"
          :style="{ '--mac-row-accent': rowAccent(item.state) }"
          @click="openUnit(item)"
          @keydown.enter.self="openUnit(item)"
        >
          <div class="mac-list-main">
            <div class="mac-list-line1">
              <span class="mac-list-title">{{ item.unitId }} <small>{{ paymentPeriodLabel(item) }}</small></span>
              <span v-if="item.mine && canManage" class="mac-tag mac-tag--blue">我的</span>
              <span class="mac-tag" :class="tagClass(item.state)">{{ item.label }}</span>
            </div>
            <div class="mac-list-meta">預計 {{ displayDate(item.expectedDate) }}・{{ amountText(item.expectedAmount) }}</div>
            <div class="mac-list-meta">
              {{ item.buyerName || '未填買方' }}
              <a v-if="item.buyerPhone" class="pd-tel" :href="`tel:${item.buyerPhone}`" @click.stop>{{ item.buyerPhone }}</a>
            </div>
            <div v-if="salesText(item)" class="mac-list-meta">銷售 {{ salesText(item) }}</div>
            <div v-if="canManage" class="pd-row-actions">
              <button type="button" class="mac-btn mac-btn--sm" @click.stop="openMarkPaid(item)">
                <v-icon size="14">mdi-check-circle-outline</v-icon><span>標記已繳</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 桌機：表格 -->
      <v-table v-else class="mac-table pd-table">
        <thead>
          <tr>
            <th>狀態</th>
            <th>戶別</th>
            <th>期別</th>
            <th>預計日</th>
            <th class="text-right">金額(元)</th>
            <th>買方</th>
            <th>電話</th>
            <th>銷售人員</th>
            <th v-if="canManage">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in visibleItems"
            :key="`${item.unitId}_${item.recordId}`"
            class="pd-row"
            @click="openUnit(item)"
          >
            <td class="pd-nowrap"><span class="mac-tag" :class="tagClass(item.state)">{{ item.label }}</span></td>
            <td class="pd-nowrap pd-unit">
              {{ item.unitId }}
              <span v-if="item.mine && canManage" class="mac-tag mac-tag--blue">我的</span>
            </td>
            <td>{{ paymentPeriodLabel(item) || '—' }}</td>
            <td class="pd-nowrap">{{ displayDate(item.expectedDate) }}</td>
            <td class="text-right pd-amount">{{ item.expectedAmount ? formatMoney(item.expectedAmount) : '未填' }}</td>
            <td>{{ item.buyerName || '—' }}</td>
            <td class="pd-nowrap">
              <a v-if="item.buyerPhone" class="pd-tel" :href="`tel:${item.buyerPhone}`" @click.stop>{{ item.buyerPhone }}</a>
              <span v-else>—</span>
            </td>
            <td>{{ salesText(item) || '—' }}</td>
            <td v-if="canManage" class="pd-nowrap">
              <button type="button" class="mac-btn mac-btn--sm" @click.stop="openMarkPaid(item)">標記已繳</button>
            </td>
          </tr>
        </tbody>
      </v-table>
    </template>

    <!-- 點戶別：該戶繳款紀錄 -->
    <v-dialog v-model="unitDialog.open" max-width="680" scrollable content-class="mac-dialog-fit">
      <v-card class="mac-sheet pd-sheet">
        <div class="mac-sheet-head">
          <v-icon size="18">mdi-cash-multiple</v-icon>
          <span>{{ unitDialog.unitId }} 繳款紀錄</span>
          <button type="button" class="mac-sheet-close" title="關閉" @click="unitDialog.open = false">
            <v-icon size="18">mdi-close</v-icon>
          </button>
        </div>
        <v-card-text class="pa-3">
          <PaymentRecordsPanel
            v-if="unitDialog.open"
            :model-value="unitDialog.records"
            :editable="false"
            :default-expanded="true"
            :show-ratio="false"
            :allow-quick-add="canManage"
            :quick-add-handler="canManage ? quickAdd : null"
            :quick-update-handler="canManage ? quickUpdate : null"
            :quick-delete-handler="canManage ? quickDelete : null"
            :unit-id="unitDialog.unitId"
            :drive-folder-url="unitDialog.driveFolderUrl"
            :project-id="projectId"
            @plans-saved="load({ silent: true })"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <MarkPaidDialog
      v-model="markDialog.open"
      :record="markDialog.record"
      :unit-id="markDialog.unitId"
      :drive-folder-url="markDialog.driveFolderUrl"
      :submit-handler="submitMarkPaid"
    />

    <PaymentPlanBatchDialog
      v-if="canManage"
      v-model="batchOpen"
      :project-id="projectId"
      @saved="load({ silent: true })"
    />
  </div>
</template>

<script setup>
/**
 * 繳款到期清單（通知連結與銷控工具列入口），規格：docs/SPEC_PaymentDueReminder.md §6.6
 * 有銷控權限看全案、可標記已繳；只有報價權限的銷售人員看自己的戶、唯讀（由 listDue 過濾）。
 */
import { computed, defineAsyncComponent, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { useToast } from 'vue-toastification';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
import { paymentProofApi, paymentReminderApi } from '@/api';
import { markPaymentRecordPaid, paymentProofFileToBase64 } from '@/utils/paymentRecordActions';
import { formatMonthDay, paymentPeriodLabel, taipeiToday } from '@/utils/paymentRecordStatus';
import MarkPaidDialog from '@/components/payment/MarkPaidDialog.vue';

const PaymentRecordsPanel = defineAsyncComponent(() => import('@/components/PaymentRecordsPanel.vue'));
const PaymentPlanBatchDialog = defineAsyncComponent(() => import('@/components/payment/PaymentPlanBatchDialog.vue'));

const props = defineProps({
  projectId: { type: String, required: true },
});

const router = useRouter();
const toast = useToast();
const userStore = useUserStore();
const projectStore = useProjectStore();
const { smAndDown } = useDisplay();

const viewState = ref('loading'); // loading | ready | denied | error
const errorText = ref('');
const refreshing = ref(false);
const items = ref([]);
const units = ref({});
const canManage = ref(false);
const today = ref(taipeiToday());
const filter = ref('all');
const searchText = ref('');
const batchOpen = ref(false);

const unitDialog = reactive({ open: false, unitId: '', records: [], driveFolderUrl: '' });
const markDialog = reactive({ open: false, unitId: '', record: null, driveFolderUrl: '' });

const operatorName = computed(() => userStore.user?.name || '');
const projectName = computed(() => projectStore.idToNameMap?.[props.projectId] || '');

const hasLocalAccess = computed(() => {
  const roles = userStore.user?.roles || [];
  const systems = userStore.user?.permissions?.[props.projectId]?.systems || [];
  return roles.includes('系統管理員') || roles.includes('超級管理員')
    || systems.includes('銷控系統') || systems.includes('報價系統');
});

const isWithin = (item, days) => Number.isInteger(item.daysLeft) && item.daysLeft >= 0 && item.daysLeft <= days;
const overdueItems = computed(() => items.value.filter(i => i.state === 'overdue'));
const soonItems = computed(() => items.value.filter(i => isWithin(i, 7)));
const within30Items = computed(() => items.value.filter(i => isWithin(i, 30)));

const filterOptions = computed(() => [
  { value: 'all', label: '全部', count: items.value.length },
  { value: 'overdue', label: '逾期', count: overdueItems.value.length },
  { value: 'soon', label: '7 天內', count: soonItems.value.length },
  { value: 'month', label: '30 天內', count: within30Items.value.length },
]);

const visibleItems = computed(() => {
  const source = {
    all: items.value,
    overdue: overdueItems.value,
    soon: soonItems.value,
    month: within30Items.value,
  }[filter.value] || items.value;
  const keyword = String(searchText.value || '').trim().toLowerCase();
  if (!keyword) return source;
  return source.filter(i => [i.unitId, i.period, i.note, i.buyerName, i.buyerPhone, ...(i.salesperson || [])]
    .some(v => String(v || '').toLowerCase().includes(keyword)));
});

const TAG_CLASS = { overdue: 'mac-tag--red', today: 'mac-tag--orange-fill', soon: 'mac-tag--orange' };
const ROW_ACCENT = { overdue: '#d62d20', today: '#c27400', soon: '#ff9f0a' };
const tagClass = state => TAG_CLASS[state] || '';
const rowAccent = state => ROW_ACCENT[state] || 'rgba(142, 142, 147, 0.45)';

function formatMoney(value) {
  return (Number(value) || 0).toLocaleString('zh-TW');
}
function amountText(value) {
  return value ? `${formatMoney(value)} 元` : '未填金額';
}
function sumAmount(list) {
  return list.reduce((sum, i) => sum + (Number(i.expectedAmount) || 0), 0);
}
function salesText(item) {
  return (item.salesperson || []).join('、');
}
// 跨年才顯示年份，避免 01/05 看不出是哪一年
function displayDate(ymd) {
  if (!ymd) return '未定';
  return String(ymd).slice(0, 4) === String(today.value).slice(0, 4)
    ? formatMonthDay(ymd)
    : String(ymd).replace(/-/g, '/');
}
function toggleFilter(value) {
  filter.value = filter.value === value ? 'all' : value;
}
function goBack() {
  if (canManage.value) {
    router.push({ name: 'SalesControlSystem', params: { projectName: props.projectId } });
  } else {
    router.push({ name: 'Home' });
  }
}

function sortItems(list) {
  // 未定日期排最後
  const dateKey = item => item.expectedDate || '9999-99-99';
  return [...list].sort((a, b) => dateKey(a).localeCompare(dateKey(b))
    || String(a.unitId).localeCompare(String(b.unitId), 'zh-Hant', { numeric: true }));
}

async function load({ silent = false } = {}) {
  if (!hasLocalAccess.value) {
    errorText.value = '權限不足：您沒有此建案的銷控系統或報價系統權限。';
    viewState.value = 'denied';
    return;
  }
  if (!silent) viewState.value = 'loading';
  refreshing.value = true;
  const res = await paymentReminderApi({ action: 'listDue', projectId: props.projectId, userKey: userStore.user?.key });
  refreshing.value = false;

  if (res?.status !== 'success') {
    const message = res?.message || '載入失敗，請稍後再試。';
    if (silent && viewState.value === 'ready') {
      toast.warning(`清單更新失敗：${message}`);
      return;
    }
    errorText.value = message;
    viewState.value = res?.code === 'functions/permission-denied' ? 'denied' : 'error';
    return;
  }

  items.value = sortItems(res.items || []);
  units.value = res.units || {};
  canManage.value = res.canManage === true;
  today.value = res.today || taipeiToday();
  viewState.value = 'ready';

  // 紀錄全部繳清後該戶會從 units 消失，視窗內保留本地資料
  const openUnitData = unitDialog.open ? units.value[unitDialog.unitId] : null;
  if (openUnitData) unitDialog.records = openUnitData.paymentRecords || [];
}

function openUnit(item) {
  const unit = units.value[item.unitId] || {};
  unitDialog.unitId = item.unitId;
  unitDialog.records = unit.paymentRecords || [];
  unitDialog.driveFolderUrl = unit.driveFolderUrl || '';
  unitDialog.open = true;
}

function openMarkPaid(item) {
  const unit = units.value[item.unitId] || {};
  markDialog.unitId = item.unitId;
  markDialog.driveFolderUrl = unit.driveFolderUrl || '';
  markDialog.record = (unit.paymentRecords || []).find(r => r.id === item.recordId) || {
    id: item.recordId,
    expectedDate: item.expectedDate,
    expectedAmount: item.expectedAmount,
    period: item.period,
    note: item.note,
    date: '',
    amount: null,
  };
  markDialog.open = true;
}

async function submitMarkPaid({ record, date, amount, note, file, balancePlan }) {
  const result = await markPaymentRecordPaid({
    projectId: props.projectId,
    unitId: markDialog.unitId,
    record,
    date,
    amount,
    note,
    file,
    paidBy: operatorName.value,
    balancePlan,
  });
  toast.success('已標記已繳');
  if (result.renameWarning) toast.warning('憑證 Drive 檔名同步失敗，紀錄內容仍已更新');
  if (result.balanceError) toast.error(`已標記已繳，但差額新增失敗：${result.balanceError}`);
  await load({ silent: true });
}

function assertRecord(res) {
  if (res?.status !== 'success' || !res.record) throw new Error(res?.message || '請稍後再試');
  return res;
}

// silent：面板連續操作（標記已繳＋差額）時由面板統一提示，完成後發 plans-saved 才重抓清單
async function quickAdd({ file, silent = false, ...fields }) {
  const base64 = file ? await paymentProofFileToBase64(file) : null;
  const res = assertRecord(await paymentProofApi({
    action: 'addRecord',
    projectId: props.projectId,
    unitId: unitDialog.unitId,
    base64,
    paidBy: operatorName.value,
    ...fields,
  }));
  unitDialog.records = [...unitDialog.records, res.record];
  if (silent) return;
  toast.success('繳款紀錄已新增');
  await load({ silent: true });
}

async function quickUpdate({ file, silent = false, ...fields }) {
  const base64 = file ? await paymentProofFileToBase64(file) : null;
  const res = assertRecord(await paymentProofApi({
    action: 'updateRecord',
    projectId: props.projectId,
    unitId: unitDialog.unitId,
    base64,
    paidBy: operatorName.value,
    ...fields,
  }));
  unitDialog.records = unitDialog.records.map(r => (r.id === res.record.id ? res.record : r));
  if (res.renameWarning) toast.warning('憑證 Drive 檔名同步失敗，紀錄內容仍已更新');
  if (res.trashWarning) toast.warning('憑證已移除，但 Drive 檔案移至垃圾桶失敗');
  if (silent) return;
  toast.success('繳款紀錄已更新');
  await load({ silent: true });
}

async function quickDelete({ recordId }) {
  const res = await paymentProofApi({
    action: 'deleteRecord',
    projectId: props.projectId,
    unitId: unitDialog.unitId,
    recordId,
  });
  if (res?.status !== 'success') throw new Error(res?.message || '請稍後再試');
  unitDialog.records = unitDialog.records.filter(r => r.id !== recordId);
  if (res.trashWarning) toast.warning('紀錄已刪除，但 Drive 憑證檔案移至垃圾桶失敗');
  toast.success('繳款紀錄已刪除');
  await load({ silent: true });
}

watch(() => props.projectId, () => load());
onMounted(() => load());
</script>

<style scoped>
.pd-page { min-height: 100%; padding-bottom: 24px; }
/* 避開左上角全站漢堡鈕 */
.pd-page .mac-page-bar { padding-left: 58px; }
.pd-title { flex-wrap: wrap; }
.pd-project { font-size: 12.5px; font-weight: 500; color: #6e6e73; overflow-wrap: anywhere; }
.pd-spin { animation: pd-spin 0.9s linear infinite; }
@keyframes pd-spin { to { transform: rotate(360deg); } }

.pd-state {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  max-width: 560px;
  padding: 16px;
}

.pd-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  max-width: 560px;
  padding: 0 16px 12px;
}
.pd-stat {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2px 8px;
  padding: 10px 12px;
  border: 0;
  border-radius: 10px;
  background: var(--pd-stat-bg);
  color: #1d1d1f;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: box-shadow 0.12s;
}
.pd-stat.is-red { --pd-stat-bg: rgba(214, 45, 32, 0.08); --pd-stat-color: #b3261b; }
.pd-stat.is-orange { --pd-stat-bg: rgba(255, 159, 10, 0.13); --pd-stat-color: #9a5b00; }
.pd-stat.is-active { box-shadow: inset 0 0 0 1.5px var(--pd-stat-color); }
.pd-stat-label { font-size: 12.5px; font-weight: 600; color: var(--pd-stat-color); }
.pd-stat-value { font-size: 13px; font-weight: 600; color: var(--pd-stat-color); text-align: right; white-space: nowrap; }
.pd-stat-amount { grid-column: 1 / -1; font-size: 16px; font-weight: 700; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }

.pd-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  padding: 0 16px 12px;
}
.pd-search { flex: 1 1 240px; max-width: 360px; }

.pd-table { font-variant-numeric: tabular-nums; }
.pd-row { cursor: pointer; }
.pd-nowrap { white-space: nowrap; }
.pd-unit { font-weight: 600; }
.pd-amount { white-space: nowrap; font-weight: 500; }
.pd-tel { color: #0071e3; text-decoration: none; white-space: nowrap; }
.pd-tel:hover { text-decoration: underline; }
.pd-row-actions { display: flex; justify-content: flex-end; margin-top: 4px; }

@media (max-width: 959.98px) {
  .pd-search { flex: 1 1 100%; max-width: none; }
  .pd-summary { max-width: none; }
}
@media (max-width: 600px) {
  .pd-summary { padding: 0 12px 10px; }
  .pd-toolbar { padding: 0 12px 10px; }
  .pd-toolbar .mac-form-seg-btn { padding: 0 2px; font-size: 12.5px; }
}
</style>
