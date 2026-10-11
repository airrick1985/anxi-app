<template>
  <div class="mac-form cep">
    <div class="mac-form-label">下載 EXCEL</div>
    <div class="mac-form-group">
      <div class="mac-form-row">
        <span class="mac-form-row-label">拜訪日期</span>
        <div class="cep-range">
          <input v-model="startDate" type="date" class="mac-form-input" aria-label="起">
          <span class="cep-sep">～</span>
          <input v-model="endDate" type="date" class="mac-form-input" :min="startDate || undefined" aria-label="迄">
        </div>
      </div>
      <div class="mac-form-pad">
        <div class="cep-sales-head">
          <span class="cep-sales-title">銷售人員</span>
          <span class="cep-muted">{{ selectedSales.length ? `已選 ${selectedSales.length} 位` : '全部' }}</span>
          <span class="mac-spacer"></span>
          <button v-if="salesNames.length" type="button" class="mac-link-btn" @click="toggleAll">{{ isAllSelected ? '清除' : '全選' }}</button>
        </div>
        <div v-if="salesNames.length" class="cep-sales">
          <label v-for="name in salesNames" :key="name" class="cep-check">
            <input v-model="selectedSales" type="checkbox" class="mac-check" :value="name">
            <span>{{ name }}</span>
          </label>
        </div>
        <div v-else class="cep-muted">尚無銷售人員</div>
      </div>
    </div>
    <div class="cep-actions">
      <span class="cep-muted">{{ scopeText }}</span>
      <span class="mac-spacer"></span>
      <button type="button" class="mac-btn mac-btn--primary" :disabled="isExporting" @click="download">
        <v-progress-circular v-if="isExporting" indeterminate size="14" width="2"></v-progress-circular>
        <v-icon v-else size="16">mdi-microsoft-excel</v-icon>下載 EXCEL
      </button>
    </div>
    <div v-if="message" class="mac-callout cep-gap" :class="{ 'mac-callout--error': messageIsError }">
      <v-icon size="16">{{ messageIsError ? 'mdi-alert-circle' : 'mdi-information' }}</v-icon><span>{{ message }}</span>
    </div>

    <div class="mac-form-label">同步到 Google Sheet</div>
    <GoogleSheetSyncCard :project-id="projectId" target="customers" />
  </div>
</template>

<script setup>
// 客資報表匯出（「下載客資」頁籤與客戶資料「匯出」視窗共用）
// 下載 EXCEL 套用日期／銷售篩選；Google Sheet 一律全量，由 GoogleSheetSyncCard 處理
import { ref, computed } from 'vue';
import * as XLSX from 'xlsx-js-style';
import { useUserStore } from '@/store/user';
import { fetchFullCustomersForExport } from '@/api';
import GoogleSheetSyncCard from '@/components/GoogleSheetSyncCard.vue';

const props = defineProps({
  projectId: { type: String, required: true },
  projectName: { type: String, default: '' },
  salesNames: { type: Array, default: () => [] },
  initialStartDate: { type: String, default: '' },
  initialEndDate: { type: String, default: '' },
  initialSales: { type: Array, default: () => [] },
});

const userStore = useUserStore();

const startDate = ref(props.initialStartDate || '');
const endDate = ref(props.initialEndDate || '');
const selectedSales = ref(props.initialSales.filter(n => props.salesNames.includes(n)));

const isAllSelected = computed(() =>
  props.salesNames.length > 0 && selectedSales.value.length === props.salesNames.length
);
const toggleAll = () => {
  selectedSales.value = isAllSelected.value ? [] : [...props.salesNames];
};

const scopeText = computed(() => {
  const f = startDate.value ? startDate.value.replace(/-/g, '/') : '';
  const t = endDate.value ? endDate.value.replace(/-/g, '/') : '';
  const range = f && t ? `${f}～${t}` : f ? `${f} 起` : t ? `${t} 止` : '全部日期';
  return `${range}・${selectedSales.value.length ? `${selectedSales.value.length} 位銷售` : '全部銷售'}`;
});

const isExporting = ref(false);
const message = ref('');
const messageIsError = ref(false);

// 洽談時間：最後一筆 log 的持續分鐘數（與後端 _calcInteractionLogDuration 一致）
const calculateLogDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return '';
  try {
    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    const diff = (eH * 60 + eM) - (sH * 60 + sM);
    return diff > 0 ? `${diff} 分鐘` : '';
  } catch (e) { return ''; }
};

// 以「現場介紹」每筆 log 各為一列，並依序標示 新客/回訪（欄位與後端 _syncVipCustomersToSheetFull 一致）
const buildRows = async () => {
  const allData = await fetchFullCustomersForExport(
    props.projectId,
    userStore.user.key,
    userStore.user?.permissions?.[props.projectId]?.systems || []
  );

  // 有效銷售：後端已排除冷刪除 (deletedSales) 的銷售；舊版後端無此欄位時退回主歸屬
  const salesOf = (item) => item.activeSalesName ?? item.latestSalesName ?? '';
  const sales = selectedSales.value;
  const from = startDate.value;
  const to = endDate.value;
  const isOnSite = (l) => l && l.tags && l.tags.interactionType === '現場介紹' && l.date;

  const rows = [];
  allData.forEach(item => {
    if (item.isAllSalesDeleted) return; // 所有銷售皆已冷刪除，與客資列表一致不列入
    if (sales.length && !sales.includes(salesOf(item))) return;

    const p = item.profile || {};
    const getP = (key) => Array.isArray(p[key]) ? p[key][p[key].length - 1] : (p[key] || '');

    // 依日期升冪排序，用以判定新客/回訪順序（區間篩選在判定之後，回訪不會被誤標為新客）
    const onSiteLogs = (item.interactionLogs || [])
      .filter(isOnSite)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    onSiteLogs.forEach((log, idx) => {
      if (from && log.date < from) return;
      if (to && log.date > to) return;
      rows.push({
        'UID': item.id || '',
        '日期': log.date ? log.date.replace(/-/g, '/') : '',
        '新客/回訪': idx === 0 ? '新客' : '回訪',
        '銷售人員': salesOf(item),
        '客戶姓名': item.latestName || '',
        '來人（位）': log.tags?.visitors || '',
        '年齡': getP('年齡'),
        '性別': getP('性別'),
        '職業': getP('職業'),
        '動機': Array.isArray(p['購屋動機']) ? p['購屋動機'].join(',') : '',
        '媒體': Array.isArray(p['從何得知本建案']) ? p['從何得知本建案'].join(',') : '',
        '區域': getP('居住城市'),
        '洽談時間': calculateLogDuration(log.startTime, log.endTime),
        '行動電話': item.phone || '',
        '未買原因': Array.isArray(log.tags?.noPurchaseReason)
          ? log.tags.noPurchaseReason.join(',')
          : (log.tags?.noPurchaseReason || ''),
        '洽談紀錄': log.content || ''
      });
    });
  });

  // 依日期遞減排序 (最新在上) 並編入順序
  rows.sort((a, b) => (b['日期'] || '').localeCompare(a['日期'] || ''));
  return rows.map((r, index) => ({ 'UID': r['UID'], '順序': index + 1, ...r }));
};

const download = async () => {
  isExporting.value = true;
  message.value = '';
  try {
    const rows = await buildRows();
    if (rows.length === 0) {
      messageIsError.value = false;
      message.value = '沒有符合條件的資料';
      return;
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), '客資資料');
    const dateTag = (startDate.value && endDate.value)
      ? `${startDate.value}_${endDate.value}`
      : (startDate.value || endDate.value || '全部');
    XLSX.writeFile(wb, `${props.projectName || props.projectId}_客資資料_${dateTag}.xlsx`);
  } catch (err) {
    console.error('匯出失敗:', err);
    messageIsError.value = true;
    message.value = '下載失敗：' + (err.message || err);
  } finally {
    isExporting.value = false;
  }
};
</script>

<style scoped>
.cep { padding: 2px 16px 18px; }
.cep > .mac-form-label:first-child { margin-top: 10px; }
.cep-range { display: flex; align-items: center; gap: 6px; flex: 1 1 auto; min-width: 0; justify-content: flex-end; }
.cep-range .mac-form-input { flex: 0 1 170px; height: 30px; }
.cep-sep { color: #8e8e93; flex-shrink: 0; }
.cep-sales-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.cep-sales-head .mac-spacer { flex: 1 1 auto; }
.cep-sales-title { font-weight: 500; }
.cep-muted { font-size: 12.5px; color: #6e6e73; }
.cep-sales { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 2px 8px; }
.cep-check {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  padding: 4px 6px;
  border-radius: 6px;
  font-size: 13.5px;
  line-height: 1.35;
  cursor: pointer;
  overflow-wrap: anywhere;
}
.cep-check:hover { background: rgba(0, 0, 0, 0.04); }
.cep-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.cep-actions .mac-spacer { flex: 1 1 auto; }
.cep-gap { margin-top: 10px; }
@media (max-width: 600px) {
  .cep { padding: 2px 12px 16px; }
  .cep-range { justify-content: flex-start; flex-basis: 100%; }
  .cep-range .mac-form-input { flex: 1 1 0; min-width: 0; height: 38px; font-size: 16px; }
  .cep-sales { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .cep-check { min-height: 40px; font-size: 15px; }
  .cep-actions .mac-btn--primary { flex: 1 1 100%; height: 40px; }
}
</style>
