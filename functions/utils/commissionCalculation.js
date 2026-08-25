/**
 * 請佣獎金 計算引擎（functions CommonJS 版本）
 * 前端對應檔案：src/utils/commissionCalculation.js（請保持一致）
 *
 * 計算規則完整移植自 docs/local/富宇學森-請佣獎金系統.gs，
 * 並擴充「自訂分配比例／鎖定金額」分配機制（docs/請佣獎金系統-spec.md §2）。
 */

function toNum(v) {
  if (v === '' || v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

const DEFAULT_BONUS_CATEGORIES = [
  { key: 'chairman', label: '主委獎金', ratePct: 0.05, mode: 'role', rolePositions: ['主委'], enabled: true, order: 1 },
  { key: 'vp',       label: '副總獎金', ratePct: 0.05, mode: 'role', rolePositions: ['副總'], enabled: true, order: 2 },
  { key: 'coach',    label: '輔導獎金', ratePct: 0.05, mode: 'role', rolePositions: ['輔導專案'], enabled: true, order: 3 },
  { key: 'pm',       label: '專案獎金', ratePct: 0.1,  mode: 'role', rolePositions: ['專案'], enabled: true, order: 4 },
  { key: 'apm',      label: '副專獎金', ratePct: 0.05, mode: 'role', rolePositions: ['副專'], enabled: true, order: 5 },
  { key: 'indiv',    label: '銷售個獎', ratePct: 0.32, mode: 'individual', rolePositions: [], enabled: true, order: 6 },
  { key: 'team',     label: '銷售團獎', ratePct: 0.08, mode: 'team', rolePositions: [], enabled: true, order: 7 },
  { key: 'pmTeam',   label: '專案團獎', ratePct: 0.02, mode: 'role', rolePositions: ['專案團獎'], enabled: true, order: 8 },
];

const DEFAULT_COMMISSION_SETTINGS = {
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

function mergeSettings(saved) {
  const s = Object.assign({}, DEFAULT_COMMISSION_SETTINGS, saved || {});
  if (!Array.isArray(s.bonusCategories) || s.bonusCategories.length === 0) {
    s.bonusCategories = DEFAULT_BONUS_CATEGORIES.map(c => Object.assign({}, c));
  }
  if (!Array.isArray(s.teamGroups)) s.teamGroups = [];
  return s;
}

function computeUnitFinance(unit, parkings) {
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

function resolveCommPct(settings, isPreferred) {
  const base = toNum(settings && settings.defaultCommissionPct);
  if (!isPreferred) return base;
  const factor = (settings && settings.preferredPaymentFactor !== undefined)
    ? toNum(settings.preferredPaymentFactor) : 0.5;
  return round2(base * factor);
}

function calcClaim(finance, input) {
  const comm = toNum(input.commPct) / 100;
  const keepRate = (input.keepPct === undefined || input.keepPct === null || input.keepPct === '')
    ? 0.1 : toNum(input.keepPct) / 100;
  const partyAFee = toNum(input.partyAFee);
  const partyBFee = toNum(input.partyBFee);

  const feeWan = partyBFee / 10000;
  const realSpread = finance.spread - feeWan;
  const baseWan = Math.min(finance.dealTotal - feeWan, finance.totalFloor);
  const realClaim = Math.round(baseWan * comm * 10000);
  const claimKeep = Math.round(realClaim * keepRate);

  const base = Math.min(finance.totalFloor, finance.dealTotal * comm) * 10000;
  let discount = base > 0 ? (base - partyAFee) / base : 0;
  discount = round2(discount);
  const dealAfter = Math.round(finance.dealTotal * discount);

  return {
    feeWan, realSpread, baseWan, realClaim, claimKeep,
    thisClaim: realClaim - claimKeep,
    base, discount, dealAfter,
  };
}

function categoryPool(dealAfter, ratePct, ratioPct) {
  return dealAfter * (toNum(ratePct) / 100) * 10000 * (toNum(ratioPct) / 100);
}

function allocateAmounts(pool, allocations, lockedScale) {
  if (lockedScale === undefined) lockedScale = 1;
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
      amt = remaining - assigned;
    } else {
      amt = Math.round(remaining * toNum(a.sharePct) / 100);
      assigned += amt;
    }
    amounts[a.personKey] = amt;
  });
  return { amounts, total: target, valid: true, diff: 0, error: '' };
}

function calcUnitBonus(finance, input, personProfiles) {
  const claim = calcClaim(finance, input);
  const ratioPct = toNum(input.ratioPct);
  const profiles = personProfiles || {};
  const pools = {};
  const categoryResults = {};
  const errors = [];

  const perPerson = {};
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

function toChineseNum(n) {
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

module.exports = {
  toNum,
  round2,
  DEFAULT_BONUS_CATEGORIES,
  DEFAULT_COMMISSION_SETTINGS,
  mergeSettings,
  computeUnitFinance,
  resolveCommPct,
  calcClaim,
  categoryPool,
  allocateAmounts,
  calcUnitBonus,
  toChineseNum,
};
