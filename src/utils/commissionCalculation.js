/**
 * 請佣獎金 計算引擎（前端 ESM 版本）
 * functions 端對應檔案：functions/utils/commissionCalculation.js（請保持一致）
 *
 * 計算規則完整移植自 docs/local/富宇學森-請佣獎金系統.gs，
 * 並擴充「自訂分配比例／鎖定金額」分配機制（docs/請佣獎金系統-spec.md §2）。
 *
 * 金額單位慣例：salesHouseholds 價格欄位為「萬」，請佣/獎金金額為「元」。
 */

import { isDealParking } from './salesStatusGroups';

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
  // 交屋團獎：自「銷售個獎」獎金池提撥 ratePct%（此處 ratePct 為提撥比例，非總價比例），本期不發放、不分配給人員
  { key: 'handover', label: '交屋團獎', ratePct: 5, mode: 'handover', sourceCatKey: 'indiv', rolePositions: [], enabled: true, order: 7 },
  { key: 'team',     label: '銷售團獎', ratePct: 0.08, mode: 'team', rolePositions: [], enabled: true, order: 8 },
  { key: 'pmTeam',   label: '專案團獎', ratePct: 0.02, mode: 'role', rolePositions: ['專案團獎'], enabled: true, order: 9 },
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
  teamSplitMode: 'lastAbsorb',    // 均分尾差處理（見 SPLIT_MODES）
  equalSplitScope: 'team',        // 'team'＝僅團隊類別套用；'all'＝所有類別的均分皆套用
  teamGroups: [],
  personDetailShowAllRoles: [],   // 個人明細：職務含這些關鍵字者，每戶明細顯示全部戶別（含非本人銷售）
};

/** 均分尾差處理方式（建案設定 teamSplitMode） */
export const SPLIT_MODES = [
  { value: 'lastAbsorb',   label: '最後一人吸收尾差', desc: '每人＝池×比例四捨五入，最後一人拿剩餘金額；合計恰等於獎金池，但金額可能差 1～數元。' },
  { value: 'equalFloor',   label: '每人相同（捨去至元）', desc: '每人＝池÷人數無條件捨去到元；所有人金額一致，尾差不發放。' },
  { value: 'equalRound',   label: '每人相同（四捨五入至元）', desc: '每人＝池÷人數四捨五入到元；所有人金額一致，合計可能比獎金池多或少幾元。' },
  { value: 'equalFloor10', label: '每人相同（捨去至十元）', desc: '每人＝池÷人數捨去到十元；所有人金額一致，尾差不發放。' },
  { value: 'equalFloor100', label: '每人相同（捨去至百元）', desc: '每人＝池÷人數捨去到百元；所有人金額一致，尾差不發放。' },
];

/** 依建案設定決定某類別的均分尾差處理方式 */
export function resolveSplitMode(settings, cat) {
  const mode = settings?.teamSplitMode || 'lastAbsorb';
  if (mode === 'lastAbsorb') return 'lastAbsorb';
  const scope = settings?.equalSplitScope || 'team';
  return (scope === 'all' || cat?.mode === 'team') ? mode : 'lastAbsorb';
}

/** 合併建案設定與預設值（缺欄補預設） */
export function mergeSettings(saved) {
  const s = { ...DEFAULT_COMMISSION_SETTINGS, ...(saved || {}) };
  if (!Array.isArray(s.bonusCategories) || s.bonusCategories.length === 0) {
    s.bonusCategories = DEFAULT_BONUS_CATEGORIES.map(c => ({ ...c }));
  }
  if (!Array.isArray(s.teamGroups)) s.teamGroups = [];
  if (!Array.isArray(s.personDetailShowAllRoles)) s.personDetailShowAllRoles = [];
  return s;
}

/**
 * 人員職務是否符合獎金類別的「對應職務」（rolePositions）。
 * 類別對應職務由設定分頁自本建案人員實際設定的職務多選而來，故採精確比對（忽略前後空白），
 * 不再做關鍵字包含比對（避免「專案」誤中「輔導專案／專案團獎」）。
 */
export function matchesRolePositions(personPositions, rolePositions) {
  const roles = (rolePositions || []).map(r => String(r || '').trim()).filter(Boolean);
  if (!roles.length) return false;
  return (personPositions || []).some(pos => roles.includes(String(pos || '').trim()));
}

/** 獎金類別設定的預設人員姓名清單（新版 defaultPersonNames 陣列；相容舊版 defaultPersonName 單一字串） */
export function categoryDefaultPersonNames(cat) {
  const raw = Array.isArray(cat?.defaultPersonNames) ? cat.defaultPersonNames
    : (cat?.defaultPersonName ? [cat.defaultPersonName] : []);
  return Array.from(new Set(raw.map(n => String(n || '').trim()).filter(Boolean)));
}

/**
 * 獎金類別的「預設人員」：設定頁若填了預設人員姓名，則不看對應職務，直接以這些人為該類別的預設請佣人員（均分）。
 * 僅 role／team 類別適用。以姓名比對本建案人員；不在名單者視為臨時人員（key 為 ext:姓名）。
 * @returns {Array<{ personKey:string, name:string, isExternal:boolean }>} 無設定時為空陣列
 */
export function categoryDefaultPersons(cat, personnel) {
  if (cat?.mode !== 'role' && cat?.mode !== 'team') return [];
  return categoryDefaultPersonNames(cat).map(name => {
    const p = (personnel || []).find(x => String(x?.name || '').trim() === name);
    return {
      personKey: p ? (p.phone || `ext:${p.name}`) : `ext:${name}`,
      name: p?.name || name,
      isExternal: !p,
    };
  });
}

/**
 * 類別是否為「自個獎提撥」（交屋團獎）：
 * 自來源類別（預設銷售個獎）的獎金池提撥 ratePct%，本期不發放、不分配給人員，暫留待日後另製交屋獎金。
 */
export function isHandoverCategory(cat) {
  return !!cat && cat.mode === 'handover';
}

/** 類別清單正規化：陣列直接用；物件（entry.categories）轉為含 key 的陣列 */
function categoryList(categories) {
  if (Array.isArray(categories)) return categories.filter(Boolean);
  return Object.keys(categories || {}).map(k => ({ key: k, ...(categories[k] || {}) }));
}

/** 提撥類別的來源類別 key：設定的 sourceCatKey 優先（須存在且非提撥類別），否則取第一個「個人」類別；找不到回傳 '' */
export function resolveHandoverSourceKey(cat, categories) {
  const list = categoryList(categories);
  const wanted = String(cat?.sourceCatKey || '').trim();
  if (wanted && list.some(c => c.key === wanted && !isHandoverCategory(c))) return wanted;
  const indiv = list.find(c => c.mode === 'individual');
  return indiv ? indiv.key : '';
}

// ---------- 戶別財務數字 ----------
/**
 * 由戶別 + 車位資料計算請佣所需財務數字（單位：萬）。
 * 與 SalesControlSystem enrichUnitItem 的計算一致。
 */
export function computeUnitFinance(unit, parkings) {
  // 準備購買（保留等）的車位不計入請佣金額
  const myParkings = (parkings || []).filter(p => isDealParking(p, unit.unitId));
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
 * @param {string} splitMode - 均分尾差處理（SPLIT_MODES.value；預設 lastAbsorb）
 * @returns {{ amounts: Object, total: number, valid: boolean, error: string, diff: number, remainder?: number, perHead?: number }}
 */
export function allocateAmounts(pool, allocations, lockedScale = 1, splitMode = 'lastAbsorb') {
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

  // 均分尾差處理（建案設定 teamSplitMode）：非「最後一人吸收」且目前為均分比例時，每人金額完全相同、尾差不發放
  if (splitMode && splitMode !== 'lastAbsorb' && isEvenShares(pcts)) {
    const n = pcts.length;
    const per = remaining / n;
    let amt;
    if (splitMode === 'equalRound') amt = Math.round(per);
    else if (splitMode === 'equalFloor10') amt = Math.floor(per / 10) * 10;
    else if (splitMode === 'equalFloor100') amt = Math.floor(per / 100) * 100;
    else amt = Math.floor(per);   // equalFloor
    pcts.forEach(a => { amounts[a.personKey] = amt; });
    const total = lockedSum + amt * n;
    return { amounts, total, valid: true, diff: target - total, remainder: target - total, perHead: amt, splitMode, error: '' };
  }

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

/** 這組 % 模式分配是否為預設均分（比例與 evenShares 一致，容差 0.011） */
export function isEvenShares(pctAllocations) {
  const list = Array.isArray(pctAllocations) ? pctAllocations : [];
  if (!list.length) return false;
  const shares = evenShares(list.length);
  return list.every((a, i) => Math.abs(toNum(a.sharePct) - shares[i]) < 0.011);
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
 * @returns {{ claim, pools, categoryResults, people, errors, handover, handoverTotal, handoverTotalFull }}
 *   handover: { [catKey]: { sourceCatKey, ratePct, sourcePool, sourcePoolFull, amount, amountFull } }（提撥類別，本期不發放）
 *   pools[來源類別] 為「提撥後」的實際分配池；pools[提撥類別] 為提撥金額
 */
export function calcUnitBonus(finance, input, personProfiles) {
  const claim = calcClaim(finance, input);
  const ratioPct = toNum(input.ratioPct);
  const profiles = personProfiles || {};
  const pools = {};
  const categoryResults = {};
  const errors = [];
  const handover = {};
  let handoverTotal = 0;
  let handoverTotalFull = 0;

  const perPerson = {};   // personKey -> { amounts:{}, amountsFull:{} }
  const cats = input.categories || {};
  const catList = categoryList(cats);
  const payKeys = catList.filter(c => !isHandoverCategory(c)).map(c => c.key);
  const handoverKeys = catList.filter(c => isHandoverCategory(c)).map(c => c.key);

  // 1) 各發放類別原始獎金池
  const rawPools = {};
  const rawPoolsFull = {};
  payKeys.forEach(catKey => {
    const cat = cats[catKey] || {};
    rawPools[catKey] = categoryPool(claim.dealAfter, cat.ratePct, ratioPct);
    rawPoolsFull[catKey] = categoryPool(claim.dealAfter, cat.ratePct, 100);
  });

  // 2) 提撥類別（交屋團獎）：自來源類別池先提撥 ratePct%，來源池扣除後再分配；提撥金額不分配給人員
  const deduct = {};
  const deductFull = {};
  handoverKeys.forEach(catKey => {
    const cat = cats[catKey] || {};
    const enabled = cat.enabled !== false;   // 逐戶可關閉提撥（工作台開關）
    const rate = enabled ? toNum(cat.ratePct) : 0;
    const sourceCatKey = resolveHandoverSourceKey({ ...cat, key: catKey }, catList);
    if (rate < 0 || rate > 100) errors.push({ catKey, error: '提撥比例須介於 0～100%' });
    const sourcePool = sourceCatKey ? toNum(rawPools[sourceCatKey]) : 0;
    const sourcePoolFull = sourceCatKey ? toNum(rawPoolsFull[sourceCatKey]) : 0;
    const amount = Math.round(sourcePool * rate / 100);
    const amountFull = Math.round(sourcePoolFull * rate / 100);
    if (sourceCatKey) {
      deduct[sourceCatKey] = (deduct[sourceCatKey] || 0) + amount;
      deductFull[sourceCatKey] = (deductFull[sourceCatKey] || 0) + amountFull;
    }
    handover[catKey] = { sourceCatKey, enabled, ratePct: rate, sourcePool, sourcePoolFull, amount, amountFull };
    handoverTotal += amount;
    handoverTotalFull += amountFull;
    pools[catKey] = amount;
    categoryResults[catKey] = { amounts: {}, total: amount, valid: true, error: '', diff: 0 };
  });

  // 3) 發放類別分配（來源類別以提撥後的池分配）
  payKeys.forEach(catKey => {
    const cat = cats[catKey] || {};
    const allocations = Array.isArray(cat.allocations) ? cat.allocations : [];
    const pool = rawPools[catKey] - (deduct[catKey] || 0);
    const fullPool = rawPoolsFull[catKey] - (deductFull[catKey] || 0);
    pools[catKey] = pool;

    const splitMode = cat.splitMode || 'lastAbsorb';
    const res = allocateAmounts(pool, allocations, 1, splitMode);
    const lockedScale = ratioPct > 0 ? 100 / ratioPct : 0;
    const resFull = allocateAmounts(fullPool, allocations, lockedScale, splitMode);
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

  return { claim, pools, categoryResults, people, errors, handover, handoverTotal, handoverTotalFull };
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

// ---------- 退佣（買方解約）試算 ----------
const REFUND_SNAPSHOT_NUM_KEYS = ['dealTotal', 'totalFloor', 'spread', 'houseDeal', 'parkDeal', 'houseFloor', 'parkFloor'];
const REFUND_CALC_NUM_KEYS = ['feeWan', 'realSpread', 'baseWan', 'base', 'dealAfter'];

/**
 * 退佣試算（前後端同構；後端以 DB 現值重算，不信任前端數值）。
 * 以「原請佣紀錄原數反向」為原則：金額取負值，讓歷期／統計／匯出的加總自然相減。
 *
 * @param {object} opts
 *   sources        原請佣紀錄（active、非退佣、未被退佣），需含 id
 *   sourceBonuses  原紀錄關聯的 active 獎金明細
 *   includeKeep    true＝退「實際請領」（含保留款）；false＝退「本次請佣」（保留款自動抵銷）
 *   refundBonus    是否連動追回獎金
 *   people         逐人調整（null＝原數）：[{ personKey, amounts: { [catKey]: 正數 }, remark }]，
 *                  未列出的人員視為不追回；金額鉗制於 0～原數
 * @returns {{ refundRatioPct, sources, snapshot, commPct, keepPct, calc, handover, people, errors }}
 */
export function buildRefundPlan(opts) {
  const sources = (opts.sources || []).slice();
  const sourceBonuses = opts.sourceBonuses || [];
  const includeKeep = !!opts.includeKeep;
  const refundBonus = opts.refundBonus !== false;
  const overrides = Array.isArray(opts.people) ? opts.people : null;
  const errors = [];
  if (!sources.length) errors.push('未選擇任何原請佣紀錄');

  const byPeriod = (a, b) => (toNum(a.period) - toNum(b.period)) || String(a.id || '').localeCompare(String(b.id || ''));
  sources.sort(byPeriod);
  const latest = sources[sources.length - 1] || {};

  // 來源摘要
  const sourceList = sources.map(s => ({
    id: s.id || '',
    period: toNum(s.period),
    ratioPct: toNum(s.ratioPct),
    requestDate: s.requestDate || '',
    realClaim: toNum(s.calc && s.calc.realClaim),
    claimKeep: toNum(s.calc && s.calc.claimKeep),
    thisClaim: toNum(s.calc && s.calc.thisClaim),
  }));
  const refundRatioPct = Math.round(sourceList.reduce((s, x) => s + x.ratioPct, 0) * 1000) / 1000;
  const sumR = sourceList.reduce((s, x) => s + x.realClaim, 0);
  const sumK = sourceList.reduce((s, x) => s + x.claimKeep, 0);
  const sumT = sourceList.reduce((s, x) => s + x.thisClaim, 0);

  // 戶別快照：文字取最新一筆、數值取負向加總
  const ls = latest.snapshot || {};
  const snapshot = {
    buyerName: ls.buyerName || '',
    salesperson: Array.isArray(ls.salesperson) ? ls.salesperson.slice() : [],
    parkingSpots: ls.parkingSpots || '',
    isPreferredPayment: !!ls.isPreferredPayment,
    contractDate: ls.contractDate || '',
    depositDate: ls.depositDate || '',
    salesStatus: ls.salesStatus || '',
    remarks: ls.remarks || '',
  };
  REFUND_SNAPSHOT_NUM_KEYS.forEach(k => {
    snapshot[k] = -sources.reduce((s, x) => s + toNum(x.snapshot && x.snapshot[k]), 0);
  });

  const calc = {};
  REFUND_CALC_NUM_KEYS.forEach(k => {
    calc[k] = -sources.reduce((s, x) => s + toNum(x.calc && x.calc[k]), 0);
  });
  calc.discount = toNum(latest.calc && latest.calc.discount);
  calc.realClaim = -sumR;
  calc.claimKeep = -sumK;
  calc.thisClaim = includeKeep ? -sumR : -sumT;
  calc.refundAmount = includeKeep ? sumR : sumT;

  // 交屋團獎暫留：反向沖回（僅在追回獎金時）
  const byCat = {};
  let hTotal = 0, hTotalFull = 0;
  if (refundBonus) {
    sources.forEach(s => {
      const h = (s.handover && s.handover.byCat) || {};
      Object.keys(h).forEach(k => {
        if (!byCat[k]) byCat[k] = { sourceCatKey: h[k].sourceCatKey || '', ratePct: toNum(h[k].ratePct), sourcePool: 0, sourcePoolFull: 0, amount: 0, amountFull: 0 };
        byCat[k].sourcePool -= toNum(h[k].sourcePool);
        byCat[k].sourcePoolFull -= toNum(h[k].sourcePoolFull);
        byCat[k].amount -= toNum(h[k].amount);
        byCat[k].amountFull -= toNum(h[k].amountFull);
      });
      hTotal -= toNum(s.handover && s.handover.total);
      hTotalFull -= toNum(s.handover && s.handover.totalFull);
    });
  }
  const handover = { total: hTotal, totalFull: hTotalFull, byCat };

  // 獎金：每人原數（正數）彙總
  const orig = {};
  const order = [];
  sourceBonuses.forEach(b => {
    const key = b.personKey || b.name;
    if (!key) return;
    if (!orig[key]) {
      orig[key] = {
        personKey: key, name: b.name || '', role: b.role || '',
        sourceProjectId: b.sourceProjectId || '', sourceProjectName: b.sourceProjectName || '',
        isExternal: !!b.isExternal, remark: b.remark || '',
        amounts: {}, subtotal: 0, keep: 0, tax: 0, nhi: 0,
        keepPct: toNum(b.keepPct), taxPct: toNum(b.taxPct), nhiPct: toNum(b.nhiPct),
      };
      order.push(key);
    }
    const o = orig[key];
    Object.keys(b.amounts || {}).forEach(k => { o.amounts[k] = (o.amounts[k] || 0) + toNum(b.amounts[k]); });
    o.subtotal += toNum(b.subtotal); o.keep += toNum(b.keep); o.tax += toNum(b.tax); o.nhi += toNum(b.nhi);
  });
  // 有效扣款比例：以原明細加總回推（多筆比例不同時取加權結果）
  order.forEach(key => {
    const o = orig[key];
    if (o.subtotal) {
      o.keepPct = round2(o.keep / o.subtotal * 100);
      o.taxPct = round2(o.tax / o.subtotal * 100);
      o.nhiPct = round2(o.nhi / o.subtotal * 100);
    }
  });

  const people = [];
  if (refundBonus) {
    const keys = overrides ? overrides.map(p => p.personKey).filter(k => orig[k]) : order;
    keys.forEach(key => {
      const o = orig[key];
      const ov = overrides ? overrides.find(p => p.personKey === key) : null;
      const amounts = {};
      const amountsPos = {};
      let subtotal = 0;
      let adjusted = false;
      Object.keys(o.amounts).forEach(k => {
        const max = Math.round(toNum(o.amounts[k]));
        let v = ov && ov.amounts && ov.amounts[k] !== undefined ? Math.round(toNum(ov.amounts[k])) : max;
        if (v < 0) v = 0;
        if (v > max) v = max;
        if (v !== max) adjusted = true;
        amountsPos[k] = v;
        amounts[k] = -v;
        subtotal += v;
      });
      // 未調整＝原數反向（扣款直接取原值，確保完全對沖）；有調整＝依原比例重算
      const keep = adjusted ? Math.round(subtotal * o.keepPct / 100) : Math.round(o.keep);
      const tax = adjusted ? Math.round(subtotal * o.taxPct / 100) : Math.round(o.tax);
      const nhi = adjusted ? Math.round(subtotal * o.nhiPct / 100) : Math.round(o.nhi);
      people.push({
        personKey: key, name: o.name, role: o.role,
        sourceProjectId: o.sourceProjectId, sourceProjectName: o.sourceProjectName, isExternal: o.isExternal,
        amounts, amountsFull: Object.assign({}, amounts),
        original: amountsPos, originalAmounts: o.amounts, adjusted,
        subtotal: -subtotal,
        keepPct: o.keepPct, taxPct: o.taxPct, nhiPct: o.nhiPct,
        keep: -keep, tax: -tax, nhi: -nhi,
        net: -(subtotal - keep - tax - nhi),
        remark: ov && ov.remark !== undefined ? String(ov.remark || '') : (o.remark || ''),
      });
    });
  }

  return {
    refundRatioPct,
    sources: sourceList,
    snapshot,
    commPct: toNum(latest.commPct),
    keepPct: toNum(latest.keepPct),
    calc, handover, people, errors,
    originalPeople: order.map(k => orig[k]),
  };
}
