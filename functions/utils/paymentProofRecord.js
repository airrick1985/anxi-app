// paymentProofApi 的紀錄驗證與組裝（純函式），規格：docs/SPEC_PaymentDueReminder.md §8.1
//
// 預計繳款（未繳）以 date:'' 且 amount:null 表示，只適用 addRecord／updateRecord。
// 預計欄位在 updateRecord 未帶時保留原值、帶 null 時清除；舊呼叫方式不帶新欄位，紀錄內容維持原樣。
// 期別（period）與備註（note）分開存，規則同預計欄位；舊資料只有 note。

const { isValidYmd, isPaidRecord, isPlannedRecord } = require('./paymentRecordStatus');

// template 是改版前「範本帶入」留下的舊值，現在由 contract（帶入合約期款資料）取代
const PAYMENT_PLAN_SOURCES = ['manual', 'batch', 'template', 'contract', 'balance'];

function isUnpaidPaymentPayload({ action, date, amount }) {
  return (action === 'addRecord' || action === 'updateRecord')
    && !date && (amount === null || amount === undefined || amount === '');
}

// 回傳錯誤訊息；沒有問題回傳 null
function paymentPayloadError(payload) {
  const { action, date, amount, base64, expectedDate, expectedAmount, planSource, period } = payload;
  // deleteRecord 只需 recordId、trashFile 只需 fileId，不驗證內容
  if (action === 'deleteRecord' || action === 'trashFile') return null;

  const isUnpaid = isUnpaidPaymentPayload(payload);
  if (!isUnpaid) {
    if (!isValidYmd(date)) return '繳款日期格式必須為 YYYY-MM-DD。';
    const amountNum = Number(amount);
    if (!Number.isInteger(amountNum) || amountNum <= 0) return '繳款金額必須為大於 0 的整數（元）。';
  }
  if (expectedDate !== undefined && expectedDate !== null && !isValidYmd(expectedDate)) {
    return '預計繳款日格式必須為 YYYY-MM-DD。';
  }
  if (expectedAmount !== undefined && expectedAmount !== null
    && (!Number.isInteger(Number(expectedAmount)) || Number(expectedAmount) <= 0)) {
    return '預計金額必須為大於 0 的整數（元）。';
  }
  if (planSource !== undefined && planSource !== null && !PAYMENT_PLAN_SOURCES.includes(planSource)) {
    return `未知的預計繳款來源: ${planSource}`;
  }
  if (period !== undefined && period !== null && typeof period !== 'string') {
    return '期別格式不正確。';
  }
  if (isUnpaid && base64) return '尚未繳款的紀錄不可上傳憑證。';
  if (action === 'addRecord' && isUnpaid && !isValidYmd(expectedDate)) return '預計繳款日格式必須為 YYYY-MM-DD。';
  return null;
}

// updateRecord 讀到既有紀錄後才能判斷的條件；沒有問題回傳 null
function unpaidUpdateError(current, { expectedDate, removeFile }) {
  const finalExpectedDate = expectedDate === undefined ? current?.expectedDate : expectedDate;
  if (!isValidYmd(finalExpectedDate)) return '尚未繳款的紀錄必須有預計繳款日。';
  if (current?.file && !removeFile) return '改回預計繳款前必須先移除憑證。';
  return null;
}

function buildPaymentRecord(payload, { id, nowIso, file = null }) {
  const { date, amount, note, expectedDate, expectedAmount, planSource, paidBy, period } = payload;
  const isUnpaid = isUnpaidPaymentPayload({ ...payload, action: 'addRecord' });
  const record = {
    id,
    date: isUnpaid ? '' : String(date),
    amount: isUnpaid ? null : Number(amount),
    note: String(note || ''),
    file,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  const periodText = String(period || '').trim();
  if (periodText) record.period = periodText;
  if (expectedDate) record.expectedDate = String(expectedDate);
  if (expectedDate || expectedAmount !== undefined) {
    record.expectedAmount = expectedAmount === null || expectedAmount === undefined ? null : Number(expectedAmount);
  }
  if (planSource || isUnpaid) record.planSource = planSource || 'manual';
  if (isUnpaid) {
    record.paidAt = null;
    record.paidBy = null;
  } else if (paidBy) {
    record.paidAt = nowIso;
    record.paidBy = String(paidBy);
  }
  return record;
}

function applyPaymentRecordUpdate(current, payload, { nowIso, file }) {
  const { date, amount, note, expectedDate, expectedAmount, planSource, paidBy, period } = payload;
  const isUnpaid = isUnpaidPaymentPayload({ ...payload, action: 'updateRecord' });
  const wasPaid = isPaidRecord(current);
  const wasPlanned = isPlannedRecord(current);
  const updated = {
    ...current,
    date: isUnpaid ? '' : String(date),
    amount: isUnpaid ? null : Number(amount),
    note: String(note || ''),
    file,
    updatedAt: nowIso,
  };
  if (period !== undefined) updated.period = String(period || '').trim();
  if (expectedDate !== undefined) updated.expectedDate = expectedDate === null ? null : String(expectedDate);
  if (expectedAmount !== undefined) updated.expectedAmount = expectedAmount === null ? null : Number(expectedAmount);
  if (planSource !== undefined) updated.planSource = planSource;
  // 只有預計轉已繳、已繳改回預計才動 paidAt／paidBy；舊紀錄（含日期有值但金額空白）修改內容不新增這兩欄
  if (wasPlanned && !isUnpaid) {
    updated.paidAt = nowIso;
    updated.paidBy = String(paidBy || '');
  } else if (wasPaid && isUnpaid) {
    updated.paidAt = null;
    updated.paidBy = null;
  }
  return updated;
}

// 憑證檔名用的文字：期別加備註
function paymentProofFileLabel(period, note) {
  return [period, note].map(text => String(text || '').trim()).filter(Boolean).join(' ');
}

function toMillis(value) {
  if (!value) return null;
  if (typeof value.toMillis === 'function') return value.toMillis();
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

// 退戶實際發生的時間：文件 ID 結尾的時間（UTC）建立後不會變；
// 退戶日期可由人工回填或修改，只作為沒有時間的舊文件的退路
function cancellationEventMillis({ id, data }) {
  const match = String(id || '').match(/_(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (match) {
    const [year, month, day, hour, minute, second] = match.slice(1).map(Number);
    return Date.UTC(year, month - 1, day, hour, minute, second);
  }
  return toMillis(data?._cancellationMeta?.cancellationDate) ?? toMillis(data?.cancellationDate);
}

function latestCancellationMillis(cancellations) {
  const times = (cancellations || []).map(cancellationEventMillis).filter(ms => ms !== null);
  return times.length > 0 ? Math.max(...times) : null;
}

/**
 * 復原退戶：以備份為主，只補上該戶最近一次退戶之後才新增的紀錄。
 * 舊版退戶沒有清除繳款紀錄，戶別上可能留有其他買方的金額；沒有 createdAt 的紀錄無法判斷歸屬，一律不保留。
 */
function mergeRestoredPaymentRecords(backupRecords, currentRecords, latestCancellationMs) {
  const backup = Array.isArray(backupRecords) ? backupRecords.filter(Boolean) : [];
  const current = Array.isArray(currentRecords) ? currentRecords.filter(Boolean) : [];
  const backupIds = new Set(backup.map(r => r.id));
  const addedAfterCancellation = current.filter((record) => {
    if (backupIds.has(record.id)) return false;
    const createdMs = toMillis(record.createdAt);
    return createdMs !== null && latestCancellationMs != null && createdMs > latestCancellationMs;
  });
  return [...backup, ...addedAfterCancellation];
}

module.exports = {
  PAYMENT_PLAN_SOURCES,
  isUnpaidPaymentPayload,
  paymentPayloadError,
  unpaidUpdateError,
  buildPaymentRecord,
  applyPaymentRecordUpdate,
  paymentProofFileLabel,
  cancellationEventMillis,
  latestCancellationMillis,
  mergeRestoredPaymentRecords,
};
