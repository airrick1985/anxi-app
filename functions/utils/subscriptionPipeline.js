// 訂閱管理「跟進流程」共用邏輯（functions CJS 版本）
// 前端對應檔案：src/utils/subscriptionPipeline.js（請保持一致）
// 規格：docs/SPEC_SubscriptionPipeline.md

const DAY_MS = 86400000;
const LEGACY_NOTE = '舊資料轉換';

// --- 日期 (YYYY-MM-DD 字串，以 UTC 計算避免時區位移) ---
function taiwanToday() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
}

function parseYmd(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return null;
  const [y, m, d] = s.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function formatYmd(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

function addDays(s, n) {
  const ms = parseYmd(s);
  return ms === null ? '' : formatYmd(ms + n * DAY_MS);
}

// 月底對齊：1/31 + 1 個月 = 2/28
function addMonths(s, n) {
  const ms = parseYmd(s);
  if (ms === null) return '';
  const d = new Date(ms);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return formatYmd(d.getTime());
}

// a − b 的日曆天數；任一無效回傳 null
function diffDays(a, b) {
  const x = parseYmd(a);
  const y = parseYmd(b);
  if (x === null || y === null) return null;
  return Math.round((x - y) / DAY_MS);
}

// --- 步驟定義 ---
const STEP_LABELS = {
  quote: '報價',
  signed: '客戶回簽',
  activated: '系統啟用',
  invoice: '開立發票',
  submitted: '請款送件',
  cashed: '款項兌現',
};

const CYCLE_STEP_KEYS = ['quote', 'signed', 'activated'];
const INSTALLMENT_STEP_KEYS = ['invoice', 'submitted', 'cashed'];

const STEP_EXTRAS = {
  quote: {},
  signed: {},
  activated: { startDate: '', endDate: '', userCount: 0 },
  invoice: { invoiceNo: '', invoiceAmount: 0 },
  submitted: {},
  cashed: { method: '', chequeNo: '', chequeDueDate: '', receivedAmount: 0 },
};

// 列表階段（依流程順序）
const STAGES = [
  { key: 'quote', label: '報價中', color: 'blue-grey' },
  { key: 'signed', label: '待回簽', color: 'indigo' },
  { key: 'activated', label: '待啟用', color: 'purple' },
  { key: 'invoice', label: '待開票', color: 'orange-darken-2' },
  { key: 'submitted', label: '待送件', color: 'deep-orange' },
  { key: 'cashed', label: '待兌現', color: 'teal' },
  { key: 'done', label: '已結清', color: 'green' },
];

const PROGRESS_LABELS = ['報價', '回簽', '啟用', '繳款日', '發票', '送件', '兌現'];

const PAYMENT_METHODS = ['匯款', '支票', '現金'];

const PLAN_BASES = [
  { value: 'signed', title: '回簽後' },
  { value: 'activated', title: '啟用後' },
  { value: 'firstAppointment', title: '首次有效預約後' },
  { value: 'date', title: '指定日期' },
];

function newStep(key) {
  return {
    status: 'pending',
    date: '',
    note: '',
    skipReason: '',
    attachments: [],
    by: '',
    byName: '',
    at: '',
    ...(STEP_EXTRAS[key] || {}),
  };
}

function isClosed(step) {
  return !!step && (step.status === 'done' || step.status === 'skipped');
}

function normalizeStep(key, step) {
  return { ...newStep(key), ...(step || {}), attachments: [...((step && step.attachments) || [])] };
}

// --- 輪次 / 款項 ---
function createCycle(no) {
  return {
    id: `CYC-${Date.now()}-${no}`,
    no,
    createdAt: new Date().toISOString(),
    steps: { quote: newStep('quote'), signed: newStep('signed'), activated: newStep('activated') },
    quote: null,
    installments: [],
    reminders: { unsigned: '', renewal: { d60: '', d30: '' } },
  };
}

function createInstallment(index, fields = {}) {
  return {
    id: `INS-${Date.now()}-${index}`,
    no: index + 1,
    label: `第${index + 1}期`,
    amount: 0,
    base: 'activated',
    offset: 0,
    offsetUnit: 'day',
    fixedDate: '',
    dueDate: '',
    note: '',
    ...fields,
    steps: { invoice: newStep('invoice'), submitted: newStep('submitted'), cashed: newStep('cashed') },
    remindersSent: { d30: null, d14: null, d7: null, overdue: '' },
  };
}

function normalizeInstallment(inst, index) {
  const steps = inst.steps || {};
  return {
    ...createInstallment(index),
    ...inst,
    steps: {
      invoice: normalizeStep('invoice', steps.invoice),
      submitted: normalizeStep('submitted', steps.submitted),
      cashed: normalizeStep('cashed', steps.cashed),
    },
    remindersSent: { d30: null, d14: null, d7: null, overdue: '', ...(inst.remindersSent || {}) },
  };
}

function normalizeCycle(cycle) {
  const steps = cycle.steps || {};
  const reminders = cycle.reminders || {};
  return {
    ...cycle,
    steps: {
      quote: normalizeStep('quote', steps.quote),
      signed: normalizeStep('signed', steps.signed),
      activated: normalizeStep('activated', steps.activated),
    },
    quote: cycle.quote || null,
    installments: (cycle.installments || []).map(normalizeInstallment).sort((a, b) => a.no - b.no),
    reminders: {
      unsigned: reminders.unsigned || '',
      renewal: { d60: '', d30: '', ...(reminders.renewal || {}) },
    },
  };
}

// 舊資料 (無 cycles，只有 startDate/endDate/paymentRecords) 轉為第 1 輪；
// sub 的 startDate / endDate 需為 YYYY-MM-DD 字串
function legacyToCycles(sub) {
  if (Array.isArray(sub.cycles) && sub.cycles.length > 0) {
    return sub.cycles.map(normalizeCycle).sort((a, b) => a.no - b.no);
  }
  const records = (sub.paymentRecords || []).filter(r => r && r.agreedDate);
  const start = sub.startDate || '';
  if (!start && records.length === 0) return [];

  const doneStep = (key, date, extra = {}) => ({ ...newStep(key), status: 'done', date: date || '', note: LEGACY_NOTE, ...extra });
  const cycle = createCycle(1);
  cycle.id = 'CYC-legacy-1';
  cycle.createdAt = '';
  cycle.steps = {
    quote: doneStep('quote', start),
    signed: doneStep('signed', start),
    activated: doneStep('activated', start, { startDate: start, endDate: sub.endDate || '' }),
  };
  cycle.installments = records
    .slice()
    .sort((a, b) => a.agreedDate.localeCompare(b.agreedDate))
    .map((r, i) => {
      const amount = Number(r.amount) || 0;
      const paid = !!r.paidDate;
      const inst = createInstallment(i, {
        id: r.id || `INS-legacy-${i}`,
        amount,
        base: 'date',
        fixedDate: r.agreedDate,
        dueDate: r.agreedDate,
        note: r.note || '',
      });
      if (r.invoiceIssued || paid) inst.steps.invoice = doneStep('invoice', '', { invoiceAmount: amount });
      if (paid) {
        inst.steps.submitted = doneStep('submitted', '');
        inst.steps.cashed = doneStep('cashed', r.paidDate, { receivedAmount: amount });
      }
      const sent = r.remindersSent || {};
      inst.remindersSent = { d30: sent.d30 || null, d14: sent.d14 || null, d7: sent.d7 || null, overdue: '' };
      return inst;
    });
  return [cycle];
}

function currentCycleOf(cycles) {
  return cycles && cycles.length ? cycles[cycles.length - 1] : null;
}

// --- 報價金額 ---
function quoteTotals(quote) {
  const items = (quote && quote.items) || [];
  const subtotal = items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  const rate = quote && typeof quote.taxRate === 'number' ? quote.taxRate : 0.05;
  const tax = Math.round(subtotal * rate);
  const total = subtotal + tax;
  const discounted = Number(quote && quote.discountedTotal) || 0;
  return { subtotal, tax, total, discounted, finalAmount: discounted > 0 ? discounted : total };
}

// 依付款條件拆期；全為比例且合計 100% 時，最後一期吸收四捨五入尾差
function buildInstallments(plan, finalAmount) {
  const rows = (plan || []).filter(p => p && (Number(p.value) > 0));
  const allPercent = rows.length > 0 && rows.every(p => p.mode === 'percent');
  const pctSum = rows.reduce((s, p) => s + (p.mode === 'percent' ? Number(p.value) || 0 : 0), 0);
  let allocated = 0;
  return rows.map((p, i) => {
    let amount = p.mode === 'percent'
      ? Math.round(finalAmount * (Number(p.value) || 0) / 100)
      : Number(p.value) || 0;
    if (allPercent && pctSum === 100 && i === rows.length - 1) amount = finalAmount - allocated;
    allocated += amount;
    return createInstallment(i, {
      label: p.label || `第${i + 1}期`,
      amount,
      base: p.base || 'activated',
      offset: Number(p.offset) || 0,
      offsetUnit: p.offsetUnit === 'month' ? 'month' : 'day',
      fixedDate: p.base === 'date' ? (p.fixedDate || '') : '',
    });
  });
}

function planText(inst) {
  if (inst.base === 'date') return inst.fixedDate ? `指定 ${inst.fixedDate}` : '指定日期';
  const base = (PLAN_BASES.find(b => b.value === inst.base) || PLAN_BASES[1]).title;
  const n = Number(inst.offset) || 0;
  if (!n) return base.replace('後', '當日');
  return `${base} ${n} ${inst.offsetUnit === 'month' ? '個月' : '天'}`;
}

// --- 預計繳款日 ---
// ctx: { firstAppointmentDate: 'YYYY-MM-DD' }
function baseDateOf(inst, cycle, ctx = {}) {
  const steps = cycle.steps;
  switch (inst.base) {
    case 'signed':
      return isClosed(steps.signed) ? steps.signed.date || '' : '';
    case 'activated':
      return isClosed(steps.activated) ? steps.activated.startDate || steps.activated.date || '' : '';
    case 'firstAppointment':
      return ctx.firstAppointmentDate || '';
    case 'date':
      return inst.fixedDate || '';
    default:
      return '';
  }
}

function computeDueDate(inst, cycle, ctx = {}) {
  if (inst.base === 'date') return inst.fixedDate || '';
  const base = baseDateOf(inst, cycle, ctx);
  if (!base) return '';
  const n = Number(inst.offset) || 0;
  return inst.offsetUnit === 'month' ? addMonths(base, n) : addDays(base, n);
}

// 補上「基準日已知但尚未帶入」的預計繳款日
function resolveDueDates(cycle, ctx = {}) {
  let changed = false;
  const installments = cycle.installments.map(inst => {
    if (inst.dueDate) return inst;
    const due = computeDueDate(inst, cycle, ctx);
    if (!due) return inst;
    changed = true;
    return { ...inst, dueDate: due };
  });
  return { cycle: changed ? { ...cycle, installments } : cycle, changed };
}

// 已收支票者以票期為準，其餘為預計繳款日
function effectiveDueDate(inst) {
  return (inst.steps && inst.steps.cashed && inst.steps.cashed.chequeDueDate) || inst.dueDate || '';
}

function installmentStage(inst) {
  for (const key of INSTALLMENT_STEP_KEYS) {
    if (!isClosed(inst.steps[key])) return key;
  }
  return 'done';
}

// --- 列表摘要 ---
// 回傳 { stage, progress(0-7), action, installment, date, hint, overdue }
function cycleSummary(cycle, ctx = {}, today = taiwanToday()) {
  if (!cycle) {
    return { stage: 'quote', progress: 0, action: '製作報價', installment: null, date: '', hint: '尚未開始', overdue: false };
  }
  const s = cycle.steps;
  if (!isClosed(s.quote)) {
    return { stage: 'quote', progress: 0, action: '製作報價', installment: null, date: '', hint: cycle.quote ? '報價單草稿' : '尚未報價', overdue: false };
  }
  if (!isClosed(s.signed)) {
    const d = s.quote.date ? diffDays(today, s.quote.date) : null;
    return {
      stage: 'signed', progress: 1, action: '客戶回簽', installment: null, date: '',
      hint: d !== null ? `已報價 ${d} 天` : '', overdue: d !== null && d >= 7,
    };
  }
  if (!isClosed(s.activated)) {
    const d = s.signed.date ? diffDays(today, s.signed.date) : null;
    return {
      stage: 'activated', progress: 2, action: '系統啟用', installment: null, date: '',
      hint: d !== null ? `已回簽 ${d} 天` : '', overdue: false,
    };
  }
  const current = cycle.installments.find(i => !isClosed(i.steps.cashed));
  if (!current) {
    const n = cycle.installments.length;
    return { stage: 'done', progress: 7, action: '', installment: null, date: '', hint: n ? `${n} 期已結清` : '無款項紀錄', overdue: false };
  }
  const stage = installmentStage(current);
  const due = current.dueDate || computeDueDate(current, cycle, ctx);
  const progress = 3 + (due ? 1 : 0)
    + (isClosed(current.steps.invoice) ? 1 : 0)
    + (isClosed(current.steps.submitted) ? 1 : 0);
  const cheque = stage === 'cashed' ? current.steps.cashed.chequeDueDate : '';
  return {
    stage,
    progress,
    action: STEP_LABELS[stage],
    installment: current,
    date: cheque || due,
    hint: cheque ? '支票到期' : (due ? '' : `繳款日待定（${planText(current)}）`),
    overdue: !!(cheque || due) && diffDays(cheque || due, today) < 0,
  };
}

// 可否完成某步驟（依序規則）
function canOperate(cycle, stepKey, inst = null) {
  const s = cycle.steps;
  if (stepKey === 'quote') return true;
  if (stepKey === 'signed') return isClosed(s.quote);
  if (stepKey === 'activated') return isClosed(s.signed);
  if (!isClosed(s.activated) || !inst) return false;
  const idx = INSTALLMENT_STEP_KEYS.indexOf(stepKey);
  return idx === 0 || isClosed(inst.steps[INSTALLMENT_STEP_KEYS[idx - 1]]);
}

// 可否撤銷：其後步驟皆未完成
function canUndo(cycle, stepKey, inst = null) {
  const s = cycle.steps;
  if (stepKey === 'quote') return !isClosed(s.signed);
  if (stepKey === 'signed') return !isClosed(s.activated);
  if (stepKey === 'activated') {
    return !cycle.installments.some(i => INSTALLMENT_STEP_KEYS.some(k => isClosed(i.steps[k])));
  }
  if (!inst) return false;
  const idx = INSTALLMENT_STEP_KEYS.indexOf(stepKey);
  return INSTALLMENT_STEP_KEYS.slice(idx + 1).every(k => !isClosed(inst.steps[k]));
}

function hasInstallmentProgress(cycle) {
  return cycle.installments.some(i => INSTALLMENT_STEP_KEYS.some(k => isClosed(i.steps[k])));
}

// 依各輪「系統啟用」重算訂閱期間
function subscriptionPeriodFromCycles(cycles) {
  let start = '';
  let end = '';
  cycles.forEach(c => {
    const a = c.steps.activated;
    if (!isClosed(a)) return;
    if (a.startDate && (!start || a.startDate < start)) start = a.startDate;
    if (a.endDate && (!end || a.endDate > end)) end = a.endDate;
  });
  return { startDate: start, endDate: end };
}

module.exports = {
  taiwanToday,
  addDays,
  addMonths,
  diffDays,
  STEP_LABELS,
  CYCLE_STEP_KEYS,
  INSTALLMENT_STEP_KEYS,
  STAGES,
  PROGRESS_LABELS,
  PAYMENT_METHODS,
  PLAN_BASES,
  newStep,
  isClosed,
  createCycle,
  createInstallment,
  normalizeCycle,
  legacyToCycles,
  currentCycleOf,
  quoteTotals,
  buildInstallments,
  planText,
  baseDateOf,
  computeDueDate,
  resolveDueDates,
  effectiveDueDate,
  installmentStage,
  cycleSummary,
  canOperate,
  canUndo,
  hasInstallmentProgress,
  subscriptionPeriodFromCycles,
};
