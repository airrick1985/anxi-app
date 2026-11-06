// 繳款紀錄的列表、透視、匯出與銷售圖面計算欄位（銷控頁與 salesDrawing/fieldFormat 共用）
import { summarizePaymentRecords, taipeiToday } from './paymentRecordStatus.js';

export const PAYMENT_DUE_STATE_LABELS = Object.freeze({
  overdue: '逾期',
  today: '今天到期',
  soon: '7 天內',
  upcoming: '未到期',
  none: '',
});

// 依列表資料量重複呼叫，今天的日期只需每分鐘重算一次
let cachedToday = '';
let cachedAt = 0;
function currentToday() {
  const now = Date.now();
  if (!cachedToday || now - cachedAt > 60000) {
    cachedToday = taipeiToday(new Date(now));
    cachedAt = now;
  }
  return cachedToday;
}

const toWan = yuan => Math.round(yuan / 10000 * 100) / 100;

/**
 * @param {Array} records - 戶別 paymentRecords
 * @param {number} totalTransactionWan - 成交總價（含車位，萬）
 * @param {string} [today] - YYYY-MM-DD，預設台北今天
 */
export function paymentRecordColumnFields(records, totalTransactionWan, today = currentToday()) {
  const summary = summarizePaymentRecords(records, today);
  return {
    payment_records_count: summary.paidCount,
    planned_records_count: summary.plannedCount,
    paid_total: toWan(summary.paidYuan),
    payment_ratio: totalTransactionWan > 0
      ? Math.round((summary.paidYuan / (totalTransactionWan * 10000)) * 1000) / 10
      : null,
    next_expected_date: summary.next ? summary.next.record.expectedDate : '',
    next_expected_state: summary.dueState,
    next_expected_label: summary.next ? summary.next.label : '',
    pending_total: summary.plannedCount > 0 ? toWan(summary.pendingYuan) : null,
    overdue_count: summary.overdueCount,
    payment_due_state: PAYMENT_DUE_STATE_LABELS[summary.dueState] || '',
  };
}
