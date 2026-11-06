// 繳款紀錄狀態判定與到期提醒規則（functions CJS 版本），規格：docs/SPEC_PaymentDueReminder.md
// 前端對應檔案：src/utils/paymentRecordStatus.js（請保持一致）
//
// date／amount 只存實繳，預計金額放 expectedAmount，所以既有的已繳加總不會把預計算進去。

const YMD_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

const SOON_DAYS = 7;
const REMINDER_CHANNELS = ['email', 'line'];
const MAX_OFFSET_DAYS = 90;
const MAX_OFFSET_COUNT = 6;
const MIN_SEND_HOUR = 6;
const MAX_SEND_HOUR = 22;
const MAX_OVERDUE_INTERVAL_DAYS = 30;

const DEFAULT_PAYMENT_REMINDER_SETTINGS = Object.freeze({
  enabled: false,
  offsetDays: Object.freeze([7, 3, 1, 0]),
  sendHour: 9,
  overdue: Object.freeze({ enabled: true, intervalDays: 3 }),
  managers: Object.freeze({ channels: Object.freeze(['email', 'line']), excludedUserKeys: Object.freeze([]) }),
  salespersons: Object.freeze({ channels: Object.freeze(['line']) }),
});

function ymdToUtc(value) {
  if (!YMD_PATTERN.test(String(value || ''))) return null;
  const [y, m, d] = String(value).split('-').map(Number);
  const ms = Date.UTC(y, m - 1, d);
  const date = new Date(ms);
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return ms;
}

function isValidYmd(value) {
  return ymdToUtc(value) !== null;
}

function taipeiToday(now = new Date()) {
  return new Date(now).toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
}

// a − b 的天數；任一日期無效回傳 null
function diffDays(a, b) {
  const x = ymdToUtc(a);
  const y = ymdToUtc(b);
  if (x === null || y === null) return null;
  return Math.round((x - y) / DAY_MS);
}

function formatMonthDay(ymd) {
  if (!isValidYmd(ymd)) return '';
  const [, m, d] = String(ymd).split('-');
  return `${m}/${d}`;
}

function isPaidRecord(record) {
  return !!record && isValidYmd(record.date) && Number(record.amount) > 0;
}

function isPlannedRecord(record) {
  return !!record && isValidYmd(record.expectedDate) && !isPaidRecord(record);
}

// 預計：依預計日由近到遠（逾期自然排最前）；已繳：依繳款日由新到舊，沒有日期的舊資料排最後
function splitPaymentRecords(records) {
  const list = Array.isArray(records) ? records.filter(Boolean) : [];
  const planned = list.filter(isPlannedRecord)
    .sort((a, b) => String(a.expectedDate).localeCompare(String(b.expectedDate)));
  const paid = list.filter(r => !isPlannedRecord(r))
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  return { planned, paid };
}

// state：paid | overdue | today | soon | upcoming | none
function recordDueState(record, today = taipeiToday()) {
  if (isPaidRecord(record)) return { state: 'paid', daysLeft: null, label: '已繳' };
  if (!isPlannedRecord(record)) return { state: 'none', daysLeft: null, label: '' };
  const daysLeft = diffDays(record.expectedDate, today);
  if (daysLeft < 0) return { state: 'overdue', daysLeft, label: `逾期 ${-daysLeft} 天` };
  if (daysLeft === 0) return { state: 'today', daysLeft, label: '今天到期' };
  return { state: daysLeft <= SOON_DAYS ? 'soon' : 'upcoming', daysLeft, label: `剩 ${daysLeft} 天` };
}

// 已繳且有預計日：預計 MM/DD・遲 N 天／提前 N 天；同日或沒有預計日回傳空字串
function paidTimingNote(record) {
  if (!isPaidRecord(record) || !isValidYmd(record.expectedDate)) return '';
  const late = diffDays(record.date, record.expectedDate);
  if (!late) return '';
  const timing = late > 0 ? `遲 ${late} 天` : `提前 ${-late} 天`;
  return `預計 ${formatMonthDay(record.expectedDate)}・${timing}`;
}

function summarizePaymentRecords(records, today = taipeiToday()) {
  const { planned, paid } = splitPaymentRecords(records);
  const next = planned[0] || null;
  return {
    paidYuan: paid.reduce((sum, r) => sum + (Number(r.amount) || 0), 0),
    paidCount: paid.length,
    plannedCount: planned.length,
    pendingYuan: planned.reduce((sum, r) => sum + (Number(r.expectedAmount) || 0), 0),
    overdueCount: planned.filter(r => recordDueState(r, today).state === 'overdue').length,
    next: next ? { record: next, ...recordDueState(next, today) } : null,
    dueState: next ? recordDueState(next, today).state : 'none',
  };
}

// 實繳少於預計時的差額（元）；沒有預計金額或已繳足回傳 0
function paymentBalance(record, paidAmount) {
  const expected = Number(record?.expectedAmount) || 0;
  const paid = Number(paidAmount) || 0;
  return expected > paid && paid > 0 ? expected - paid : 0;
}

// 期別與備註合併顯示：「期別（備註）」；舊資料只有備註
function paymentPeriodLabel(record) {
  const period = String(record?.period || '').trim();
  const note = String(record?.note || '').trim();
  if (period && note) return `${period}（${note}）`;
  return period || note;
}

function balanceNote(note) {
  const text = String(note || '').trim();
  if (!text) return '尾款';
  return text.endsWith('尾款') ? text : `${text} 尾款`;
}

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max ? n : fallback;
}

function normalizeChannels(value, fallback) {
  if (!Array.isArray(value)) return [...fallback];
  return REMINDER_CHANNELS.filter(channel => value.includes(channel));
}

function normalizePaymentReminderSettings(raw) {
  const defaults = DEFAULT_PAYMENT_REMINDER_SETTINGS;
  const offsetDays = Array.isArray(raw?.offsetDays)
    ? [...new Set(raw.offsetDays.map(Number))]
      .filter(n => Number.isInteger(n) && n >= 0 && n <= MAX_OFFSET_DAYS)
      .sort((a, b) => b - a)
      .slice(0, MAX_OFFSET_COUNT)
    : [...defaults.offsetDays];
  return {
    enabled: raw?.enabled === true,
    offsetDays,
    sendHour: clampInt(raw?.sendHour, MIN_SEND_HOUR, MAX_SEND_HOUR, defaults.sendHour),
    overdue: {
      enabled: raw?.overdue?.enabled !== false,
      intervalDays: clampInt(raw?.overdue?.intervalDays, 1, MAX_OVERDUE_INTERVAL_DAYS, defaults.overdue.intervalDays),
    },
    managers: {
      channels: normalizeChannels(raw?.managers?.channels, defaults.managers.channels),
      excludedUserKeys: Array.isArray(raw?.managers?.excludedUserKeys)
        ? [...new Set(raw.managers.excludedUserKeys.map(String).filter(Boolean))]
        : [],
    },
    salespersons: {
      channels: normalizeChannels(raw?.salespersons?.channels, defaults.salespersons.channels),
    },
  };
}

// settings 須先經 normalizePaymentReminderSettings
function shouldRemind(daysLeft, settings) {
  if (!Number.isInteger(daysLeft)) return false;
  if (daysLeft >= 0) return settings.offsetDays.includes(daysLeft);
  return settings.overdue.enabled && (-daysLeft) % settings.overdue.intervalDays === 0;
}

module.exports = {
  SOON_DAYS,
  REMINDER_CHANNELS,
  MAX_OFFSET_DAYS,
  MAX_OFFSET_COUNT,
  MIN_SEND_HOUR,
  MAX_SEND_HOUR,
  MAX_OVERDUE_INTERVAL_DAYS,
  DEFAULT_PAYMENT_REMINDER_SETTINGS,
  isValidYmd,
  taipeiToday,
  diffDays,
  formatMonthDay,
  isPaidRecord,
  isPlannedRecord,
  splitPaymentRecords,
  recordDueState,
  paidTimingNote,
  summarizePaymentRecords,
  paymentBalance,
  paymentPeriodLabel,
  balanceNote,
  normalizePaymentReminderSettings,
  shouldRemind,
};
