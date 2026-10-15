<template>
  <div class="mac-page ur-page">
    <div class="mac-page-bar">
      <div class="mac-page-title">
        <button type="button" class="mac-icon-btn" title="返回訂閱管理" @click="router.push({ name: 'SubscriptionManagement' })">
          <v-icon size="20">mdi-chevron-left</v-icon>
        </button>
        <span class="mac-page-title-main">使用狀況報表</span>
      </div>
      <div class="mac-page-actions">
        <button type="button" class="mac-btn" :disabled="!report || !!busy" @click="downloadPdf">
          <v-progress-circular v-if="busy === 'pdf'" indeterminate size="14" width="2"></v-progress-circular>
          <v-icon v-else size="16">mdi-file-pdf-box</v-icon>
          <span>PDF</span>
        </button>
        <button type="button" class="mac-btn" :disabled="!report || !!busy" @click="downloadExcel">
          <v-progress-circular v-if="busy === 'excel'" indeterminate size="14" width="2"></v-progress-circular>
          <v-icon v-else size="16">mdi-microsoft-excel</v-icon>
          <span>Excel</span>
        </button>
        <button type="button" class="mac-btn" :disabled="!report || !!busy" @click="print">
          <v-progress-circular v-if="busy === 'print'" indeterminate size="14" width="2"></v-progress-circular>
          <v-icon v-else size="16">mdi-printer-outline</v-icon>
          <span>列印</span>
        </button>
      </div>
    </div>

    <div class="ur-pickers">
      <label class="ur-picker">
        <span>建案</span>
        <select v-model="projectId" class="mac-form-input mac-form-select" :disabled="loadingSubs">
          <option value="" disabled>{{ loadingSubs ? '載入中…' : '選擇建案' }}</option>
          <option v-for="p in projectOptions" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </label>
      <label class="ur-picker">
        <span>功能</span>
        <select v-model="systemFunction" class="mac-form-input mac-form-select" :disabled="!projectId">
          <option v-for="f in functionOptions" :key="f" :value="f">{{ f }}</option>
        </select>
      </label>
    </div>

    <div ref="previewPane" class="ur-preview">
      <div v-if="loadingReport" class="ur-state">
        <v-progress-circular indeterminate size="24" width="2" color="grey"></v-progress-circular>
        <span>統計中…</span>
      </div>
      <div v-else-if="errorText" class="ur-state is-error">{{ errorText }}</div>
      <div v-else-if="!projectId" class="ur-state">請選擇建案</div>
      <div v-else-if="!isSupported" class="ur-state">「{{ systemFunction }}」尚未提供報表</div>
      <div
        v-else-if="report"
        class="ur-frame"
        :style="{ width: `${794 * scale}px`, height: `${sheetHeight * scale}px` }"
      >
        <div ref="previewInner" :style="{ transform: `scale(${scale})`, transformOrigin: 'top left' }">
          <BookingUsageReportSheet :report="report" :meta="meta" />
        </div>
      </div>
    </div>

    <!-- 匯出用：原尺寸渲染 -->
    <div v-if="report" class="ur-export-host" aria-hidden="true">
      <BookingUsageReportSheet ref="exportSheet" :report="report" :meta="meta" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useUserStore } from '@/store/user';
import {
  fetchAllSubscriptions,
  fetchSubscriptionQuoteSettings,
  fetchBookingUsageReportData,
  fetchQuotaSummaryForReport,
} from '@/api.js';
import { taiwanToday } from '@/utils/subscriptionPipeline';
import { mergeQuoteSettings } from '@/components/subscription/quoteDefaults';
import { buildBookingUsageReport, reportPeriod, maskName, sourceLabel, REPORT_UPLOAD_TYPES, VALID_STATUSES } from '@/utils/bookingUsageReport';
import { printImage } from '@/utils/printImageA3';
import BookingUsageReportSheet from '@/components/subscription/BookingUsageReportSheet.vue';

const SUPPORTED_FUNCTION = '預約驗屋系統';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const loadingSubs = ref(true);
const subscriptions = ref([]);
const quoteSettings = ref(mergeQuoteSettings(null));

const projectId = ref(String(route.query.projectId || ''));
const systemFunction = ref(String(route.query.system || ''));

const loadingReport = ref(false);
const errorText = ref('');
const report = ref(null);
const generatedAt = ref('');
const busy = ref('');

const functionsOf = (sub) => [].concat(sub.systemFunction || []);

// 有建案 ID 的訂閱才列入（尚未啟用的報價中建案沒有資料）
const projectOptions = computed(() => {
  const map = new Map();
  subscriptions.value.forEach((s) => {
    if (s.projectId && !map.has(s.projectId)) map.set(s.projectId, { id: s.projectId, name: s.projectName || s.projectId });
  });
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));
});

const projectSubs = computed(() => subscriptions.value.filter(s => s.projectId === projectId.value));

const functionOptions = computed(() => [...new Set(projectSubs.value.flatMap(functionsOf))]);

const isSupported = computed(() => systemFunction.value === SUPPORTED_FUNCTION);

const meta = computed(() => {
  const subs = projectSubs.value;
  const sub = subs.find(s => functionsOf(s).includes(systemFunction.value) && s.billTo?.name)
    || subs.find(s => s.billTo?.name) || subs[0] || {};
  return {
    company: { name: quoteSettings.value.companyName, nameEn: quoteSettings.value.companyNameEn },
    projectName: sub.projectName || '',
    systemFunction: systemFunction.value,
    billTo: sub.billTo || {},
    generatedAt: generatedAt.value,
  };
});

async function loadSubscriptions() {
  loadingSubs.value = true;
  try {
    const [subs, settings] = await Promise.all([
      fetchAllSubscriptions(userStore.user?.key),
      fetchSubscriptionQuoteSettings().catch(() => null),
    ]);
    subscriptions.value = subs;
    quoteSettings.value = mergeQuoteSettings(settings);
  } catch (e) {
    console.error('載入訂閱資料失敗:', e);
    errorText.value = `載入失敗：${e.message}`;
  } finally {
    loadingSubs.value = false;
  }
}

// 選建案後自動帶入功能：優先「預約驗屋系統」
watch([projectId, functionOptions], () => {
  if (!projectId.value || functionOptions.value.includes(systemFunction.value)) return;
  systemFunction.value = functionOptions.value.includes(SUPPORTED_FUNCTION) ? SUPPORTED_FUNCTION : (functionOptions.value[0] || '');
});

watch([projectId, systemFunction], () => {
  router.replace({ query: { ...route.query, projectId: projectId.value || undefined, system: systemFunction.value || undefined } });
  loadReport();
});

let loadToken = 0;
async function loadReport() {
  const token = ++loadToken;
  report.value = null;
  errorText.value = '';
  if (!projectId.value || !isSupported.value || loadingSubs.value) return;
  loadingReport.value = true;
  try {
    const today = taiwanToday();
    const data = await fetchBookingUsageReportData(projectId.value);
    const period = reportPeriod(data.batches, today);
    const quota = period.start && !period.notStarted
      ? await fetchQuotaSummaryForReport(projectId.value, period.start, today).catch((e) => {
        console.warn('名額摘要載入失敗:', e);
        return {};
      })
      : {};
    if (token !== loadToken) return;
    report.value = buildBookingUsageReport(data, quota, today);
    generatedAt.value = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Taipei' }).slice(0, 16);
    await nextTick();
    observePreview();
  } catch (e) {
    if (token !== loadToken) return;
    console.error('使用狀況報表載入失敗:', e);
    errorText.value = `統計失敗：${e.message}`;
  } finally {
    if (token === loadToken) loadingReport.value = false;
  }
}

onMounted(async () => {
  await loadSubscriptions();
  loadReport();
});

// --- 預覽縮放 ---
const previewPane = ref(null);
const previewInner = ref(null);
const exportSheet = ref(null);
const scale = ref(1);
const sheetHeight = ref(1123);
let resizeObserver = null;

function observePreview() {
  resizeObserver?.disconnect();
  if (!previewPane.value) return;
  resizeObserver = new ResizeObserver(() => {
    const w = previewPane.value?.clientWidth || 0;
    if (w < 100) return;
    scale.value = Math.min(1, (w - 32) / 794);
    sheetHeight.value = previewInner.value?.firstElementChild?.offsetHeight || 1123;
  });
  resizeObserver.observe(previewPane.value);
  if (previewInner.value) resizeObserver.observe(previewInner.value);
}
onBeforeUnmount(() => resizeObserver?.disconnect());

// --- 匯出 ---
const fileBase = computed(() => `${meta.value.projectName || projectId.value}_${systemFunction.value}使用報表_${taiwanToday()}`);

async function renderCanvas() {
  await nextTick();
  if (document.fonts?.ready) await document.fonts.ready;
  return html2canvas(exportSheet.value.$el, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
}

function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function downloadPdf() {
  busy.value = 'pdf';
  try {
    const canvas = await renderCanvas();
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    let w = 210;
    let h = canvas.height * 210 / canvas.width;
    if (h > 297) {
      h = 297;
      w = canvas.width * 297 / canvas.height;
    }
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', (210 - w) / 2, 0, w, h);
    triggerDownload(pdf.output('blob'), `${fileBase.value}.pdf`);
  } catch (e) {
    console.error('報表 PDF 產生失敗:', e);
    alert('PDF 產生失敗：' + e.message);
  } finally {
    busy.value = '';
  }
}

async function print() {
  busy.value = 'print';
  try {
    const canvas = await renderCanvas();
    printImage(canvas.toDataURL('image/png'), {
      page: 'A4 portrait',
      area: { w: 210, h: 296 },
      align: 'top',
      title: fileBase.value,
      onError: () => alert('列印失敗'),
    });
  } catch (e) {
    console.error('報表列印失敗:', e);
    alert('列印失敗：' + e.message);
  } finally {
    busy.value = '';
  }
}

const formatTime = (ms) => (ms ? new Date(ms).toLocaleString('sv-SE', { timeZone: 'Asia/Taipei' }).slice(0, 16) : '');

function styleHeader(row) {
  row.height = 22;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111827' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
}

async function downloadExcel() {
  busy.value = 'excel';
  try {
    const ExcelJS = await import('exceljs');
    const r = report.value;
    const m = meta.value;
    const workbook = new ExcelJS.Workbook();

    // 摘要
    const summary = workbook.addWorksheet('摘要');
    summary.columns = [{ width: 18 }, { width: 14 }, { width: 24 }, { width: 10 }, { width: 10 }, { width: 10 }, { width: 10 }, { width: 12 }];
    const info = [
      ['建案', m.projectName],
      ['系統功能', m.systemFunction],
      ['買受人', [m.billTo?.name, m.billTo?.taxId && `統編 ${m.billTo.taxId}`].filter(Boolean).join('　')],
      ['統計期間', r.period.start ? `${r.period.start} ～ ${r.period.end}` : '—'],
      ['產製時間', m.generatedAt],
      [],
      ['預約總筆數', r.overview.total],
      ['預約中', r.overview.active],
      ['已完成', r.overview.completed],
      ['取消', r.overview.cancelled],
      ['改期', r.overview.rescheduled],
      ['預約戶數', r.overview.units],
      ['總戶數', r.householdCount],
      ['戶數覆蓋率 (%)', r.overview.coverage ?? '—'],
      ['開放天數', r.quota.days],
      ['開放名額', r.quota.capacity],
      ['已約名額', r.quota.booked],
      ['名額使用率 (%)', r.quota.rate ?? '—'],
      ['應上傳驗屋報告', r.reports.required],
      ['已上傳報告', r.reports.uploaded],
      ['上傳戶數', r.reports.units],
      ['提醒信寄送', r.reports.reminders],
      [],
    ];
    info.forEach((row) => {
      const added = summary.addRow(row);
      if (row.length) added.getCell(1).font = { bold: true };
    });
    styleHeader(summary.addRow(['預約項目', '批次', '開放期間', '預約筆數', '預約戶數', '已完成', '取消', '戶數覆蓋率 (%)']));
    r.items.forEach((item) => {
      summary.addRow([
        item.type, item.batchCount,
        item.openStart || item.openEnd ? `${item.openStart} ～ ${item.openEnd}` : '—',
        item.total, item.units, item.completed, item.cancelled, item.coverage ?? '—',
      ]);
    });
    summary.addRow([]);
    styleHeader(summary.addRow(['預約項目', '預約方式', '有效預約筆數', '佔比 (%)']));
    r.methodsByItem.forEach((item) => {
      item.methods.forEach((m) => {
        summary.addRow([item.type, m.label, m.count, Math.round((m.count / item.total) * 1000) / 10]);
      });
    });

    // 預約明細（姓名遮罩，不含電話與身分證）
    const detail = workbook.addWorksheet('預約明細');
    detail.columns = [
      { header: '預約項目', key: 'type', width: 12 },
      { header: '戶別', key: 'unitId', width: 12 },
      { header: '預約人', key: 'name', width: 10 },
      { header: '預約日', key: 'date', width: 12 },
      { header: '時段', key: 'slot', width: 14 },
      { header: '預約方式', key: 'method', width: 12 },
      { header: '驗屋公司', key: 'company', width: 16 },
      { header: '狀態', key: 'status', width: 8 },
      { header: '來源', key: 'source', width: 10 },
      { header: '建立時間', key: 'createdAt', width: 18 },
      { header: '取消時間', key: 'cancelledAt', width: 18 },
      { header: '報告上傳', key: 'report', width: 10 },
      { header: '提醒信', key: 'reminders', width: 8 },
    ];
    styleHeader(detail.getRow(1));
    [...r.appointments]
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
      .forEach((a) => {
        const needsReport = REPORT_UPLOAD_TYPES.includes(a.bookingType) && VALID_STATUSES.includes(a.reportStatus);
        detail.addRow({
          type: a.bookingType,
          unitId: a.unitId,
          name: maskName(a.bookerName),
          date: a.appointmentDate,
          slot: a.timeSlot,
          method: a.method,
          company: a.companyName,
          status: a.reportStatus,
          source: sourceLabel(a.source),
          createdAt: formatTime(a.createdAt),
          cancelledAt: formatTime(a.cancelledAt),
          report: needsReport ? (a.reportUploaded ? '已上傳' : '未上傳') : '—',
          reminders: a.reminderCount || '',
        });
      });
    detail.views = [{ state: 'frozen', ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    triggerDownload(
      new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `${fileBase.value}.xlsx`,
    );
  } catch (e) {
    console.error('報表 Excel 產生失敗:', e);
    alert('Excel 產生失敗：' + e.message);
  } finally {
    busy.value = '';
  }
}
</script>

<style scoped>
.ur-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
/* 避開全站左上角漢堡鈕 */
.ur-page .mac-page-bar {
  padding-left: 58px;
}
.ur-page .mac-page-title {
  align-items: center;
  gap: 4px;
}
.ur-page .mac-btn span {
  white-space: nowrap;
}
.ur-pickers {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  padding: 4px 16px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.ur-picker {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6e6e73;
}
.ur-picker span {
  flex-shrink: 0;
}
.ur-picker .mac-form-input {
  width: 220px;
  height: 30px;
}
.ur-preview {
  flex: 1;
  overflow: auto;
  background: #e8e8ed;
  padding: 24px 16px;
}
.ur-frame {
  margin: 0 auto;
  overflow: hidden;
  border-radius: 2px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.14), 0 0 0 0.5px rgba(0, 0, 0, 0.08);
}
.ur-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 80px 16px;
  font-size: 14px;
  color: #6e6e73;
}
.ur-state.is-error {
  color: #d62d20;
}
.ur-export-host {
  position: fixed;
  left: -10000px;
  top: 0;
  pointer-events: none;
}

@media (max-width: 959.98px) {
  .ur-picker {
    flex: 1 1 100%;
  }
  .ur-picker .mac-form-input {
    flex: 1;
    width: auto;
    font-size: 16px;
  }
  .ur-preview {
    padding: 16px 8px;
  }
}
</style>
