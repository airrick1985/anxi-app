// 訂閱管理「跟進流程」共用邏輯（前端 ESM 版本）
// 後端對應檔案：functions/utils/subscriptionPipeline.js（請保持一致）
// 規格：docs/SPEC_SubscriptionPipeline.md

const DAY_MS = 86400000;
const LEGACY_NOTE = '舊資料轉換';

// --- 日期 (YYYY-MM-DD 字串，以 UTC 計算避免時區位移) ---
export function taiwanToday() {
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

export function addDays(s, n) {
  const ms = parseYmd(s);
  return ms === null ? '' : formatYmd(ms + n * DAY_MS);
}

// 月底對齊：1/31 + 1 個月 = 2/28
export function addMonths(s, n) {
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
export function diffDays(a, b) {
  const x = parseYmd(a);
  const y = parseYmd(b);
  if (x === null || y === null) return null;
  return Math.round((x - y) / DAY_MS);
}

// --- 步驟定義 ---
export const STEP_LABELS = {
  quote: '報價',
  signed: '客戶回簽',
  activated: '系統啟用',
  invoice: '開立發票',
  submitted: '請款送件',
  cashed: '款項兌現',
};

export const CYCLE_STEP_KEYS = ['quote', 'signed', 'activated'];
export const INSTALLMENT_STEP_KEYS = ['invoice', 'submitted', 'cashed'];

const STEP_EXTRAS = {
  quote: {},
  signed: {},
  activated: { startDate: '', endDate: '', userCount: 0 },
  invoice: { invoiceNo: '', invoiceAmount: 0 },
  submitted: { expectedPayDate: '' },
  cashed: { method: '', chequeNo: '', chequeDueDate: '', receivedAmount: 0 },
};

// 列表階段（依流程順序）
export const STAGES = [
  { key: 'quote', label: '報價中', color: 'blue-grey' },
  { key: 'signed', label: '待回簽', color: 'indigo' },
  { key: 'activated', label: '待啟用', color: 'purple' },
  { key: 'request', label: '待請款', color: 'cyan-darken-2' },
  { key: 'invoice', label: '待開票', color: 'orange-darken-2' },
  { key: 'submitted', label: '待送件', color: 'deep-orange' },
  { key: 'cashed', label: '待兌現', color: 'teal' },
  { key: 'done', label: '已結清', color: 'green' },
];

// 款項階段：待請款（未到請款日）→ 待開票 → 待送件 → 待兌現 → 已結清
export const INSTALLMENT_STAGE_KEYS = ['request', 'invoice', 'submitted', 'cashed', 'done'];

// 進度條 7 格；「請款日」於到達請款日（或已提早開票）時亮起
export const PROGRESS_LABELS = ['報價', '回簽', '啟用', '請款日', '開票', '送件', '兌現'];

export const PAYMENT_METHODS = ['匯款', '支票', '現金'];

export const PLAN_BASES = [
  { value: 'signed', title: '回簽後' },
  { value: 'activated', title: '啟用後' },
  { value: 'firstAppointment', title: '首次有效預約後' },
  { value: 'date', title: '指定日期' },
];

export function newStep(key) {
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

export function isClosed(step) {
  return !!step && (step.status === 'done' || step.status === 'skipped');
}

function normalizeStep(key, step) {
  return { ...newStep(key), ...(step || {}), attachments: [...((step && step.attachments) || [])] };
}

// --- 輪次 / 款項 ---
export function createCycle(no) {
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

export function createInstallment(index, fields = {}) {
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
    remindersSent: newRemindersSent(),
  };
}

// 提醒去重：request7／request0 即將請款（前 7 天內／當天）、late 已過請款日未送件、
// overdue 逾期未兌現；requestFor／overdueFor 記錄當時的請款日／撥款日（票期），日期改了重新計算
function newRemindersSent() {
  return { request7: '', request0: '', requestFor: '', late: '', overdue: '', overdueFor: '' };
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
    remindersSent: { ...newRemindersSent(), ...(inst.remindersSent || {}) },
  };
}

export function normalizeCycle(cycle) {
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
export function legacyToCycles(sub) {
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
      return inst;
    });
  return [cycle];
}

export function currentCycleOf(cycles) {
  return cycles && cycles.length ? cycles[cycles.length - 1] : null;
}

// --- 報價金額 ---
export function quoteTotals(quote) {
  const items = (quote && quote.items) || [];
  const subtotal = items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  const rate = quote && typeof quote.taxRate === 'number' ? quote.taxRate : 0.05;
  const tax = Math.round(subtotal * rate);
  const total = subtotal + tax;
  const discounted = Number(quote && quote.discountedTotal) || 0;
  return { subtotal, tax, total, discounted, finalAmount: discounted > 0 ? discounted : total };
}

// 依付款條件拆期；全為比例且合計 100% 時，最後一期吸收四捨五入尾差
export function buildInstallments(plan, finalAmount) {
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

export function planText(inst) {
  if (inst.base === 'date') return inst.fixedDate ? `指定 ${inst.fixedDate}` : '指定日期';
  const base = (PLAN_BASES.find(b => b.value === inst.base) || PLAN_BASES[1]).title;
  const n = Number(inst.offset) || 0;
  if (!n) return base.replace('後', '當日');
  return `${base} ${n} ${inst.offsetUnit === 'month' ? '個月' : '天'}`;
}

// --- 預計請款日 ---
// ctx: { firstAppointmentDate: 'YYYY-MM-DD' }
export function baseDateOf(inst, cycle, ctx = {}) {
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

export function computeDueDate(inst, cycle, ctx = {}) {
  if (inst.base === 'date') return inst.fixedDate || '';
  const base = baseDateOf(inst, cycle, ctx);
  if (!base) return '';
  const n = Number(inst.offset) || 0;
  return inst.offsetUnit === 'month' ? addMonths(base, n) : addDays(base, n);
}

// 補上「基準日已知但尚未帶入」的預計請款日
export function resolveDueDates(cycle, ctx = {}) {
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

// 款項目前階段（due 傳入已推算的預計請款日）；發票可提早開，開了就往下走
export function installmentStage(inst, due = inst.dueDate, today = taiwanToday()) {
  const s = inst.steps;
  if (!isClosed(s.invoice)) return due && diffDays(today, due) >= 0 ? 'invoice' : 'request';
  if (!isClosed(s.submitted)) return 'submitted';
  if (!isClosed(s.cashed)) return 'cashed';
  return 'done';
}

// 款項目前要對照的日期與天數：
// 送件前看預計請款日（到了／過了 → late）；送件後看票期（已收支票）或預計撥款日（過了 → overdue），
// 兩者皆無則顯示已送件天數
// 回傳 { stage, kind, date, days, text, tone: 'grey'|'orange'|'red', late, overdue }
export function installmentTiming(inst, cycle, ctx = {}, today = taiwanToday()) {
  const due = inst.dueDate || computeDueDate(inst, cycle, ctx);
  const stage = installmentStage(inst, due, today);
  const t = { stage, kind: '', date: '', days: null, text: '', tone: 'grey', late: false, overdue: false };
  if (stage === 'done') return t;

  if (stage === 'cashed') {
    const { cashed, submitted } = inst.steps;
    t.date = cashed.chequeDueDate || submitted.expectedPayDate || '';
    if (!t.date) {
      const sentDays = diffDays(today, submitted.date);
      t.text = sentDays !== null ? `已送件 ${sentDays} 天` : '撥款日待定';
      return t;
    }
    t.kind = cashed.chequeDueDate ? '票期' : '預計撥款';
    t.days = diffDays(t.date, today);
    t.text = t.days < 0 ? `逾期 ${-t.days} 天` : (t.days === 0 ? '今天' : `${t.days} 天後`);
    t.overdue = t.days < 0;
    t.tone = t.overdue ? 'red' : (t.days === 0 ? 'orange' : 'grey');
    return t;
  }

  if (!due) {
    t.text = `請款日待定（${planText(inst)}）`;
    return t;
  }
  t.kind = '請款日';
  t.date = due;
  t.days = diffDays(due, today);
  t.text = t.days < 0 ? `已過 ${-t.days} 天` : (t.days === 0 ? '今天' : `${t.days} 天後`);
  t.late = t.days <= 0;
  t.tone = t.late ? 'orange' : 'grey';
  return t;
}

export function timingLabel(t) {
  return t.date ? `${t.kind} ${t.date} · ${t.text}` : t.text;
}

// --- 列表摘要 ---
// 回傳 { stage, progress(0-7), action, installment, installmentNo, installmentCount, date, hint, tone, overdue }
export function cycleSummary(cycle, ctx = {}, today = taiwanToday()) {
  const base = { installment: null, installmentNo: 0, installmentCount: 0, date: '', tone: 'grey', overdue: false };
  if (!cycle) {
    return { ...base, stage: 'quote', progress: 0, action: '製作報價', hint: '尚未開始' };
  }
  const s = cycle.steps;
  if (!isClosed(s.quote)) {
    return { ...base, stage: 'quote', progress: 0, action: '製作報價', hint: cycle.quote ? '報價單草稿' : '尚未報價' };
  }
  if (!isClosed(s.signed)) {
    const d = s.quote.date ? diffDays(today, s.quote.date) : null;
    const overdue = d !== null && d >= 7;
    return {
      ...base, stage: 'signed', progress: 1, action: '客戶回簽',
      hint: d !== null ? `已報價 ${d} 天` : '', tone: overdue ? 'red' : 'grey', overdue,
    };
  }
  if (!isClosed(s.activated)) {
    const d = s.signed.date ? diffDays(today, s.signed.date) : null;
    return { ...base, stage: 'activated', progress: 2, action: '系統啟用', hint: d !== null ? `已回簽 ${d} 天` : '' };
  }
  const list = cycle.installments;
  const current = list.find(i => !isClosed(i.steps.cashed));
  if (!current) {
    return { ...base, stage: 'done', progress: 7, action: '', hint: list.length ? `${list.length} 期已結清` : '無款項紀錄' };
  }
  const t = installmentTiming(current, cycle, ctx, today);
  return {
    stage: t.stage,
    progress: 3 + INSTALLMENT_STAGE_KEYS.indexOf(t.stage),
    action: STEP_LABELS[t.stage === 'request' ? 'invoice' : t.stage],
    installment: current,
    installmentNo: list.indexOf(current) + 1,
    installmentCount: list.length,
    date: t.date,
    hint: timingLabel(t),
    tone: t.tone,
    overdue: t.overdue,
  };
}

// 可否完成某步驟（依序規則）
export function canOperate(cycle, stepKey, inst = null) {
  const s = cycle.steps;
  if (stepKey === 'quote') return true;
  if (stepKey === 'signed') return isClosed(s.quote);
  if (stepKey === 'activated') return isClosed(s.signed);
  if (!isClosed(s.activated) || !inst) return false;
  const idx = INSTALLMENT_STEP_KEYS.indexOf(stepKey);
  return idx === 0 || isClosed(inst.steps[INSTALLMENT_STEP_KEYS[idx - 1]]);
}

// 可否撤銷：其後步驟皆未完成
export function canUndo(cycle, stepKey, inst = null) {
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

export function hasInstallmentProgress(cycle) {
  return cycle.installments.some(i => INSTALLMENT_STEP_KEYS.some(k => isClosed(i.steps[k])));
}

// 依各輪「系統啟用」重算訂閱期間
export function subscriptionPeriodFromCycles(cycles) {
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
