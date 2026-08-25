/**
 * 請佣獎金 計算引擎（前端 ESM 版本）
 * functions 端對應檔案：functions/utils/commissionCalculation.js（請保持一致）
 *
 * 計算規則完整移植自 docs/local/富宇學森-請佣獎金系統.gs，
 * 並擴充「自訂分配比例／鎖定金額」分配機制（docs/請佣獎金系統-spec.md §2）。
 *
 * 金額單位慣例：salesHouseholds 價格欄位為「萬」，請佣/獎金金額為「元」。
 */

// ---------- 基本工具 ----------
export function toNum(v) {
  if (v === '' || v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

export function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

// ---------- 預設設定 ----------
export const DEFAULT_BONUS_CATEGORIES = [
  { key: 'chairman', label: '主委獎金', ratePct: 0.05, mode: 'role', rolePositions: ['主委'], enabled: true, order: 1 },
  { key: 'vp',       label: '副總獎金', ratePct: 0.05, mode: 'role', rolePositions: ['副總'], enabled: true, order: 2 },
  { key: 'coach',    label: '輔導獎金', ratePct: 0.05, mode: 'role', rolePositions: ['輔導專案'], enabled: true, order: 3 },
  { key: 'pm',       label: '專案獎金', ratePct: 0.1,  mode: 'role', rolePositions: ['專案'], enabled: true, order: 4 },
  { key: 'apm',      label: '副專獎金', ratePct: 0.05, mode: 'role', rolePositions: ['副專'], enabled: true, order: 5 },
  { key: 'indiv',    label: '銷售個獎', ratePct: 0.32, mode: 'individual', rolePositions: [], enabled: true, order: 6 },
  { key: 'team',     label: '銷售團獎', ratePct: 0.08, mode: 'team', rolePositions: [], enabled: true, order: 7 },
  { key: 'pmTeam',   label: '專案團獎', ratePct: 0.02, mode: 'role', rolePositions: ['專案團獎'], enabled: true, order: 8 },
];

export const DEFAULT_COMMISSION_SETTINGS = {
  defaultCommissionPct: 2.2,
  preferredPaymentFactor: 0.5,
  defaultKeepPct: 10,
  defaultCashPct: 50,
  partyALabel: '一研九鼎負擔介紹費/贈品',
  partyBLabel: '富宇負擔介紹費/贈品',
  kiloLabel: '千4',
  youfuLabelPattern: '優付方案請款{pct}%',
  claimTitlePattern: '{建案名}－業務服務佣金第{期別中文}次請款',
  claimFileNamePattern: '{簡稱}NO.{期別}請款-{民國年月}',
  bonusFileNamePattern: '{簡稱}NO.{期別}獎金-{民國年月}',
  projectShortName: '',
  note1: '1、本次請領按委託銷售契約第六條，請領佣金計銷售實際請款按2.2%，請領本次佣金費用',
  note2: '2、請領費用按合約第7條分別以50%匯款或現金票給付，另50%開立45天期票支付。',
  bonusCategories: DEFAULT_BONUS_CATEGORIES,
  teamGroups: [],
};

/** 合併建案設定與預設值（缺欄補預設） */
export function mergeSettings(saved) {
  const s = { ...DEFAULT_COMMISSION_SETTINGS, ...(saved || {}) };
  if (!Array.isArray(s.bonusCategories) || s.bonusCategories.length === 0) {
    s.bonusCategories = DEFAULT_BONUS_CATEGORIES.map(c => ({ ...c }));
  }
  if (!Array.isArray(s.teamGroups)) s.teamGroups = [];
  return s;
}

// ---------- 戶別財務數字 ----------
/**
 * 由戶別 + 車位資料計算請佣所需財務數字（單位：萬）。
 * 與 SalesControlSystem enrichUnitItem 的計算一致。
 */
export function computeUnitFinance(unit, parkings) {
  const myParkings = (parkings || []).filter(p => p.buyerUnitId === unit.unitId);
  const parkDeal = myParkings.reduce((s, p) => s + toNum(p.price_transaction), 0);
  const parkFloor = myParkings.reduce((s, p) => s + toNum(p.price_floor), 0);
  const houseDeal = toNum(unit.price_transaction_house);
  const houseFloor = toNum(unit.price_floor_house_total);
  const dealTotal = houseDeal + parkDeal;
  const totalFloor = houseFloor + parkFloor;
  return {
    houseDeal, parkDeal, houseFloor, parkFloor,
    dealTotal, totalFloor,
    spread: dealTotal - totalFloor,
    parkingSpots: myParkings.map(p => p.spotId || p.number || '').filter(Boolean).join('、'),
  };
}

/** 繳款比例（%）：已繳合計(元) ÷ 成交總價(含車位, 萬)×10000，四捨五入至 0.1；無成交總價回傳 null（與 SalesControlSystem payment_ratio 一致） */
export function paymentRatioPct(unit, dealTotalWan) {
  const records = Array.isArray(unit?.paymentRecords) ? unit.paymentRecords : [];
  const paidYuan = records.reduce((s, r) => s + toNum(r?.amount), 0);
  const totalYuan = toNum(dealTotalWan) * 10000;
  if (!(totalYuan > 0)) return null;
  return Math.round((paidYuan / totalYuan) * 1000) / 10;
}

/** 佣金比例預設值（%）：優付戶套用倍率 */
export function resolveCommPct(settings, isPreferred) {
  const base = toNum(settings?.defaultCommissionPct);
  if (!isPreferred) return base;
  const factor = settings?.preferredPaymentFactor === undefined ? 0.5 : toNum(settings.preferredPaymentFactor);
  return round2(base * factor);
}

// ---------- 請佣計算 ----------
/**
 * 請佣試算（同舊系統 computeComm / buildCommission_）。
 * @param {object} finance - computeUnitFinance 結果
 * @param {object} input - { commPct, partyAFee, partyBFee, keepPct }
 */
export function calcClaim(finance, input) {
  const comm = toNum(input.commPct) / 100;
  const keepRate = (input.keepPct === undefined || input.keepPct === null || input.keepPct === '')
    ? 0.1 : toNum(input.keepPct) / 100;
  const partyAFee = toNum(input.partyAFee);   // 計入折數（元）
  const partyBFee = toNum(input.partyBFee);   // 計入請佣基準（元）

  const feeWan = partyBFee / 10000;
  const realSpread = finance.spread - feeWan;
  const baseWan = Math.min(finance.dealTotal - feeWan, finance.totalFloor);
  const realClaim = Math.round(baseWan * comm * 10000);
  const claimKeep = Math.round(realClaim * keepRate);

  // 獎金折數（partyAFee 參與）
  const base = Math.min(finance.totalFloor, finance.dealTotal * comm) * 10000;
  let discount = base > 0 ? (base - partyAFee) / base : 0;
  discount = round2(discount);
  const dealAfter = Math.round(finance.dealTotal * discount);   // 折數後總價（萬）

  return {
    feeWan, realSpread, baseWan, realClaim, claimKeep,
    thisClaim: realClaim - claimKeep,
    base, discount, dealAfter,
  };
}

// ---------- 獎金分配 ----------
/** 獎金池（元）：折數後總價 × 類別比例 × 請佣比例 */
export function categoryPool(dealAfter, ratePct, ratioPct) {
  return dealAfter * (toNum(ratePct) / 100) * 10000 * (toNum(ratioPct) / 100);
}

/**
 * 依分配設定將池金額分給人員。
 * @param {number} pool - 池金額（元，可含小數）
 * @param {Array} allocations - [{ personKey, mode:'pct'|'locked', sharePct, lockedAmount }]
 * @param {number} lockedScale - 鎖定金額縮放倍率（100% 重算時傳 100/ratioPct）
 * @returns {{ amounts: Object, total: number, valid: boolean, error: string, diff: number }}
 */
export function allocateAmounts(pool, allocations, lockedScale = 1) {
  const target = Math.round(toNum(pool));
  const amounts = {};
  const list = Array.isArray(allocations) ? allocations : [];
  if (list.length === 0) {
    return { amounts, total: 0, valid: true, error: '', diff: 0 };
  }

  const locked = list.filter(a => a.mode === 'locked');
  const pcts = list.filter(a => a.mode !== 'locked');
  let lockedSum = 0;
  locked.forEach(a => {
    const amt = Math.round(toNum(a.lockedAmount) * lockedScale);
    amounts[a.personKey] = amt;
    lockedSum += amt;
  });

  if (lockedSum > target + 0.5) {
    return { amounts, total: lockedSum, valid: false, diff: lockedSum - target, error: '鎖定金額合計超過該類獎金池' };
  }

  if (pcts.length === 0) {
    const diff = target - lockedSum;
    return {
      amounts, total: lockedSum,
      valid: Math.abs(diff) < 0.5,
      diff,
      error: Math.abs(diff) < 0.5 ? '' : '鎖定金額合計須等於該類獎金池',
    };
  }

  const pctSum = pcts.reduce((s, a) => s + toNum(a.sharePct), 0);
  if (Math.abs(pctSum - 100) > 0.01) {
    // 仍計算金額供畫面顯示，但標記無效
    const remaining = target - lockedSum;
    pcts.forEach(a => { amounts[a.personKey] = Math.round(remaining * toNum(a.sharePct) / 100); });
    const total = Object.values(amounts).reduce((s, v) => s + v, 0);
    return { amounts, total, valid: false, diff: pctSum - 100, error: `比例合計須為 100%（目前 ${round2(pctSum)}%）` };
  }

  const remaining = target - lockedSum;
  let assigned = 0;
  pcts.forEach((a, i) => {
    let amt;
    if (i === pcts.length - 1) {
      amt = remaining - assigned;   // 最後一人吃差額，確保合計 = 池
    } else {
      amt = Math.round(remaining * toNum(a.sharePct) / 100);
      assigned += amt;
    }
    amounts[a.personKey] = amt;
  });
  return { amounts, total: target, valid: true, diff: 0, error: '' };
}

/** 產生 n 人均分的預設 sharePct 陣列（合計恰為 100） */
export function evenShares(n) {
  if (!n) return [];
  const base = Math.floor((100 / n) * 100) / 100;
  const shares = new Array(n).fill(base);
  shares[n - 1] = round2(100 - base * (n - 1));
  return shares;
}

// ---------- 整戶獎金計算 ----------
/**
 * 計算一戶的完整請佣＋獎金結果。
 * @param {object} finance - computeUnitFinance 結果
 * @param {object} input - {
 *   ratioPct, commPct, partyAFee, partyBFee, keepPct,
 *   categories: { [catKey]: { ratePct, allocations: [{ personKey, name, sourceProjectId, sourceProjectName, mode, sharePct, lockedAmount }] } }
 * }
 * @param {object} personProfiles - { [personKey]: { name, role, keepPct, taxPct, nhiPct, remark } }（覆寫已套用）
 * @returns {{ claim, pools, categoryResults, people, errors }}
 */
export function calcUnitBonus(finance, input, personProfiles) {
  const claim = calcClaim(finance, input);
  const ratioPct = toNum(input.ratioPct);
  const profiles = personProfiles || {};
  const pools = {};
  const categoryResults = {};
  const errors = [];

  const perPerson = {};   // personKey -> { amounts:{}, amountsFull:{} }
  const cats = input.categories || {};
  Object.keys(cats).forEach(catKey => {
    const cat = cats[catKey] || {};
    const allocations = Array.isArray(cat.allocations) ? cat.allocations : [];
    const pool = categoryPool(claim.dealAfter, cat.ratePct, ratioPct);
    const fullPool = categoryPool(claim.dealAfter, cat.ratePct, 100);
    pools[catKey] = pool;

    const res = allocateAmounts(pool, allocations, 1);
    const lockedScale = ratioPct > 0 ? 100 / ratioPct : 0;
    const resFull = allocateAmounts(fullPool, allocations, lockedScale);
    categoryResults[catKey] = res;
    if (allocations.length > 0 && !res.valid) {
      errors.push({ catKey, error: res.error });
    }
    allocations.forEach(a => {
      if (!perPerson[a.personKey]) perPerson[a.personKey] = { amounts: {}, amountsFull: {}, alloc: a };
      perPerson[a.personKey].amounts[catKey] = (perPerson[a.personKey].amounts[catKey] || 0) + (res.amounts[a.personKey] || 0);
      perPerson[a.personKey].amountsFull[catKey] = (perPerson[a.personKey].amountsFull[catKey] || 0) + (resFull.amounts[a.personKey] || 0);
    });
  });

  const people = Object.keys(perPerson).map(personKey => {
    const rec = perPerson[personKey];
    const p = profiles[personKey] || {};
    let subtotal = 0;
    Object.values(rec.amounts).forEach(v => { subtotal += v; });
    const keepPct = toNum(p.keepPct);
    const taxPct = toNum(p.taxPct);
    const nhiPct = toNum(p.nhiPct);
    const keep = Math.round(subtotal * keepPct / 100);
    const tax = Math.round(subtotal * taxPct / 100);
    const nhi = Math.round(subtotal * nhiPct / 100);
    return {
      personKey,
      name: p.name || rec.alloc.name || personKey,
      role: p.role || '',
      sourceProjectId: rec.alloc.sourceProjectId || '',
      sourceProjectName: rec.alloc.sourceProjectName || '',
      isExternal: !!rec.alloc.isExternal,
      amounts: rec.amounts,
      amountsFull: rec.amountsFull,
      subtotal,
      keepPct, taxPct, nhiPct,
      keep, tax, nhi,
      net: subtotal - keep - tax - nhi,
      remark: p.remark || '',
    };
  });

  return { claim, pools, categoryResults, people, errors };
}

// ---------- 日期 / 文字工具 ----------
/** Date | Timestamp | 字串 → Date | null */
export function toDateValue(v) {
  if (!v) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v.toDate === 'function') {
    const d = v.toDate();
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof v === 'object' && v.seconds !== undefined) {
    return new Date(v.seconds * 1000);
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** 以台灣時區輸出 yyyy/MM/dd */
export function formatDateTW(v) {
  const d = toDateValue(v);
  if (!d) return '';
  const parts = new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(d);
  const get = t => (parts.find(p => p.type === t) || {}).value || '';
  return `${get('year')}/${get('month')}/${get('day')}`;
}

/** yyyy/MM/dd（或可解析日期）→ 民國 yyy/M/d */
export function toMinguo(v) {
  const s = typeof v === 'string' ? v : formatDateTW(v);
  if (!s) return '';
  const m = String(s).match(/(\d{4})\D(\d{1,2})\D(\d{1,2})/);
  if (!m) return String(s);
  return `${Number(m[1]) - 1911}/${Number(m[2])}/${Number(m[3])}`;
}

/** yyyy/MM/dd → 民國年月 yyy/MM（例：2026/06/22 → 115/06） */
export function toMinguoYM(v) {
  const s = typeof v === 'string' ? v : formatDateTW(v);
  if (!s) return '';
  const m = String(s).match(/(\d{4})\D(\d{1,2})/);
  if (!m) return '';
  const mm = Number(m[2]);
  return `${Number(m[1]) - 1911}/${mm < 10 ? '0' + mm : mm}`;
}

/** 數字 → 中文（1→一、11→十一、23→二十三），供「第X次請款」 */
export function toChineseNum(n) {
  n = Math.floor(Number(n) || 0);
  if (n <= 0) return '零';
  const d = '零一二三四五六七八九';
  if (n < 10) return d.charAt(n);
  if (n < 20) return '十' + (n % 10 ? d.charAt(n % 10) : '');
  if (n < 100) {
    const t = Math.floor(n / 10);
    const o = n % 10;
    return d.charAt(t) + '十' + (o ? d.charAt(o) : '');
  }
  return String(n);
}

/** pattern 置換：{建案名} {簡稱} {期別} {期別中文} {民國年月} {pct} */
export function fillPattern(pattern, ctx) {
  return String(pattern || '')
    .replace(/\{建案名\}/g, ctx.projectName || '')
    .replace(/\{簡稱\}/g, ctx.shortName || '')
    .replace(/\{期別\}/g, ctx.period !== undefined ? String(ctx.period) : '')
    .replace(/\{期別中文\}/g, ctx.period !== undefined ? toChineseNum(ctx.period) : '')
    .replace(/\{民國年月\}/g, ctx.minguoYM || '')
    .replace(/\{pct\}/g, ctx.pct !== undefined ? String(ctx.pct) : '');
}

/** 金額千分位 */
export function money(n) {
  return Math.round(Number(n) || 0).toLocaleString('en-US');
}
