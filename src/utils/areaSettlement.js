/**
 * 面積找補（驗屋預約 › 戶別資料管理 › 面積找補）
 *
 * 算法移植自 Google Apps Script「面積找補」（富宇天雋分戶坪數表，同 Excel「面積找補A2」）：
 *   房屋價款(萬) = (房地總價 − 車位價) ÷ 10000 × 房屋價款比例
 *   陽台價款     = 房屋價款 × 折算 ÷ 合約總面積 × 合約陽台
 *   公設價款     = 房屋價款 × 折算 ÷ 合約總面積 × 合約公設
 *   主建物價款   = 房屋價款 − 陽台價款 − 公設價款
 *   每項：差異 = 權狀 − 合約；單價 = 價款 ÷ 合約；上限 = 合約 × 上限%
 *         找補面積：差異 ≤ 上限 時用差異（不足全額找補），超過以上限為準
 *         找補金額 = 單價 × 找補面積
 *   實收 = 找補合計 × 實收比例
 * 四捨五入一律同 Excel ROUND（遠離零）。
 */

/** 戶別資料（households）上的面積找補欄位；label 同時是總表欄名與 Excel 上傳表頭 */
export const AREA_FIELDS = [
  { key: 'areaSettleContractMain', label: '合約主建物(㎡)', kind: 'sqm' },
  { key: 'areaSettleContractBalcony', label: '合約陽台(㎡)', kind: 'sqm' },
  { key: 'areaSettleContractCommon', label: '合約公設(㎡)', kind: 'sqm' },
  { key: 'areaSettleDeedMain', label: '權狀主建物(㎡)', kind: 'sqm' },
  { key: 'areaSettleDeedBalcony', label: '權狀陽台(㎡)', kind: 'sqm' },
  { key: 'areaSettleDeedCommon', label: '權狀公設(㎡)', kind: 'sqm' },
  { key: 'areaSettleBuildNo', label: '建號', kind: 'text' },
  { key: 'areaSettleShare', label: '公設持分', kind: 'number' },
  { key: 'areaSettleTotalPrice', label: '房地總價(元)', kind: 'money' },
  { key: 'areaSettleParkingPrice', label: '車位價(元)', kind: 'money' },
  { key: 'areaSettleNote', label: '找補備註', kind: 'text' },
];
export const AREA_FIELD_MAP = Object.fromEntries(AREA_FIELDS.map(f => [f.key, f]));
export const isAreaNumberField = (key) => ['sqm', 'number', 'money'].includes(AREA_FIELD_MAP[key]?.kind);

/** 建案設定預設值（projects/{id}.areaSettlement） */
export const DEFAULT_AREA_SETTINGS = Object.freeze({
  title: '',          // 空白 = 建案名稱＋「分戶坪數」
  buildingPct: 52,    // 房屋價款 = 房地總價(扣車位) × 52%
  sideRatio: 0.95,    // 陽台、公設價款折算
  capPct: 2,          // 找補上限：合約面積 2%
  payPct: 60,         // 實收比例
  publicArea: null,   // 大公面積(㎡)
  shareDen: 999999,   // 公設持分分母
});

export const PING_PER_SQM = 0.3025;

/** 同 Excel ROUND（四捨五入、遠離零）；非有限數字回傳 0 */
export function excelRound(x, d = 0) {
  if (!Number.isFinite(x)) return 0;
  const a = Number(Math.abs(x).toPrecision(15)).toExponential().split('e');
  const r = Number(`${Math.round(Number(`${a[0]}e${Number(a[1]) + d}`))}e-${d}`);
  return r === 0 ? 0 : (x < 0 ? -r : r);
}

/** 數字欄位解析：數字直接用；字串去掉千分位與空白；空白或非數字回傳 null */
export function toNumber(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v ?? '').replace(/[,，\s]/g, '');
  if (s === '' || Number.isNaN(Number(s))) return null;
  return Number(s);
}

const text = (v) => String(v ?? '').trim();

const numOr = (v, fallback) => {
  const n = toNumber(v);
  return n === null ? fallback : n;
};

/** 合併建案設定與預設值（數字不合理時退回預設） */
export function resolveAreaSettings(saved = {}, projectName = '') {
  const s = saved || {};
  const positive = (v, d) => {
    const n = toNumber(v);
    return n !== null && n > 0 ? n : d;
  };
  const publicArea = toNumber(s.publicArea);
  return {
    title: text(s.title),
    displayTitle: text(s.title) || `${text(projectName)}分戶坪數`,
    buildingPct: positive(s.buildingPct, DEFAULT_AREA_SETTINGS.buildingPct),
    sideRatio: positive(s.sideRatio, DEFAULT_AREA_SETTINGS.sideRatio),
    capPct: numOr(s.capPct, DEFAULT_AREA_SETTINGS.capPct),
    payPct: numOr(s.payPct, DEFAULT_AREA_SETTINGS.payPct),
    publicArea: publicArea !== null && publicArea > 0 ? publicArea : null,
    shareDen: Math.round(positive(s.shareDen, DEFAULT_AREA_SETTINGS.shareDen)),
  };
}

function settleLine(pre, deed, price, capPct) {
  const diff = excelRound(deed - pre, 2);
  const k = pre ? excelRound(price / pre, 4) : 0; // 萬/㎡
  const cap = excelRound(pre * capPct / 100, 2);
  const qty = cap > diff ? diff : cap; // 不足全額找補，超過以上限為準
  return {
    pre,
    deed,
    diff,
    price,
    unit: excelRound(k * 10000, 0),
    cap,
    amount: excelRound(k * qty * 10000, 0),
  };
}

/**
 * 單戶找補計算（與原 GAS calcAreaSettlement_ 結果逐項相同）
 * @param {{main:number,balcony:number,common:number}} contract 合約面積(㎡)
 * @param {{main:number,balcony:number,common:number}} deed 權狀面積(㎡)
 * @param {number} house 房地總價扣除車位價(元)
 * @param {object} settings resolveAreaSettings() 結果
 */
export function calcAreaSettlement(contract, deed, house, settings = resolveAreaSettings()) {
  const c = contract;
  const d = deed;
  if (!(house > 0) || !(c.main > 0) || !(d.main > 0)) return null;

  const pre = c.main + c.balcony + c.common;
  const building = excelRound(house / 10000 * settings.buildingPct / 100, 1);
  const balcony = excelRound(building * settings.sideRatio / pre * c.balcony, 1);
  const common = excelRound(building * settings.sideRatio / pre * c.common, 1);
  const main = excelRound(building - balcony - common, 1);

  const rows = [
    settleLine(c.main, d.main, main, settings.capPct),
    settleLine(c.balcony, d.balcony, balcony, settings.capPct),
    settleLine(c.common, d.common, common, settings.capPct),
  ];
  const amount = rows.reduce((s, r) => s + r.amount, 0);
  const own = excelRound(d.main + d.balcony, 2);
  const total = excelRound(own + d.common, 2);

  return {
    rows,
    sum: {
      pre: excelRound(pre, 2),
      deed: excelRound(d.main + d.balcony + d.common, 2),
      price: building,
      amount,
    },
    pay: excelRound(amount * settings.payPct / 100, 0),
    own,
    total,
    ping: excelRound(total * PING_PER_SQM, 2),
  };
}

// ───────────── 戶別整理 ─────────────

const SHOP_BUILDING_RE = /^S\d*$/i;
const SHOP_UNIT_RE = /^S([-_\s]|\d)/i;
export const SHOP_GROUP = '店面';
export const OTHER_GROUP = '其他';

const natural = (a, b) => String(a).localeCompare(String(b), 'en', { numeric: true, sensitivity: 'base' });

/** 由戶號推樓層（A1-03、A1-2F、2F-A3、2A2）；其次看「樓層」欄 */
export function parseFloor(household) {
  const unitId = text(household?.unitId);
  let m = unitId.match(/^(\d{1,3})F[-_\s]*\S/i) || unitId.match(/^(\d{1,3})[A-Z]\d+$/i);
  if (m) return Number(m[1]);
  m = unitId.match(/[-_\s](\d{1,3})F?$/i);
  if (m) return Number(m[1]);
  const f = text(household?.['樓層'] ?? household?.floor).match(/^(\d{1,3})\s*F?$/i);
  return f ? Number(f[1]) : null;
}

/** 戶別所屬群組（清單分組）：店面 → 棟別欄 → 戶號前段 → 其他 */
export function unitGroup(household) {
  const unitId = text(household?.unitId);
  const building = text(household?.building);
  if (SHOP_BUILDING_RE.test(building) || SHOP_UNIT_RE.test(unitId)) return SHOP_GROUP;
  if (building) return building;
  const m = unitId.match(/^(\d{1,3})F[-_\s]*(.+)$/i) || unitId.match(/^()([A-Z]+\d*)[-_\s]/i);
  return m && m[2] ? m[2] : OTHER_GROUP;
}

const groupOrder = (g) => (g === SHOP_GROUP ? 1 : g === OTHER_GROUP ? 2 : 0);

/**
 * 將戶別資料整理成找補清單（含計算結果與缺少的欄位）
 * @param {Array} households 戶別資料（_docId、unitId、building、buyerName、address 與面積找補欄位）
 * @param {object} settings resolveAreaSettings() 結果
 */
export function buildAreaUnits(households = [], settings = resolveAreaSettings()) {
  const units = households
    .filter(h => h && text(h.unitId))
    .map((h) => {
      const raw = (key) => toNumber(h[key]);
      const contract = {
        main: raw('areaSettleContractMain'),
        balcony: raw('areaSettleContractBalcony'),
        common: raw('areaSettleContractCommon'),
      };
      const deed = {
        main: raw('areaSettleDeedMain'),
        balcony: raw('areaSettleDeedBalcony'),
        common: raw('areaSettleDeedCommon'),
      };
      const totalPrice = raw('areaSettleTotalPrice');
      const parkingPrice = raw('areaSettleParkingPrice');
      const house = totalPrice === null ? null : totalPrice - (parkingPrice || 0);

      // 必填：房地總價、合約主建物、權狀主建物；合約有陽台／公設時，權狀也要填（避免空白被當 0 全額找補）
      const missing = [];
      if (!(totalPrice > 0)) missing.push('房地總價');
      if (!(contract.main > 0)) missing.push('合約主建物');
      if (!(deed.main > 0)) missing.push('權狀主建物');
      if (contract.balcony > 0 && deed.balcony === null) missing.push('權狀陽台');
      if (contract.common > 0 && deed.common === null) missing.push('權狀公設');
      if (deed.balcony > 0 && contract.balcony === null) missing.push('合約陽台');
      if (deed.common > 0 && contract.common === null) missing.push('合約公設');
      if (totalPrice > 0 && !(house > 0)) missing.push('房屋價款（車位價大於總價）');

      const zero = (o) => ({ main: o.main || 0, balcony: o.balcony || 0, common: o.common || 0 });
      const calc = missing.length === 0 ? calcAreaSettlement(zero(contract), zero(deed), house, settings) : null;

      return {
        docId: h._docId || h.id || '',
        unitId: text(h.unitId),
        group: unitGroup(h),
        floor: parseFloor(h),
        name: text(h.buyerName),
        address: text(h.address),
        buildNo: text(h.areaSettleBuildNo),
        share: raw('areaSettleShare'),
        note: text(h.areaSettleNote),
        contract,
        deed,
        totalPrice,
        parkingPrice,
        house,
        calc,
        missing,
        household: h,
      };
    });

  units.sort((a, b) =>
    groupOrder(a.group) - groupOrder(b.group)
    || (a.group !== b.group ? natural(a.group, b.group) : 0)
    || ((a.floor ?? 9999) - (b.floor ?? 9999))
    || natural(a.unitId, b.unitId));
  return units;
}

/** 依群組分段（清單用） */
export function groupAreaUnits(units) {
  const groups = [];
  for (const u of units) {
    let g = groups[groups.length - 1];
    if (!g || g.name !== u.group) {
      g = { name: u.group, units: [] };
      groups.push(g);
    }
    g.units.push(u);
  }
  return groups;
}

/** 全部可計算戶的合計 */
export function summarizeAreaUnits(units) {
  const ready = units.filter(u => u.calc);
  return {
    total: units.length,
    ready: ready.length,
    missing: units.length - ready.length,
    amount: ready.reduce((s, u) => s + u.calc.sum.amount, 0),
    pay: ready.reduce((s, u) => s + u.calc.pay, 0),
  };
}

// ───────────── 顯示格式 ─────────────

/** 固定小數位數（單據用）；空值回傳空字串 */
export function fmtFixed(x, d) {
  if (x === null || x === undefined || x === '' || !Number.isFinite(Number(x))) return '';
  const v = excelRound(Number(x), d);
  return (v === 0 ? 0 : v).toFixed(d);
}

/** 千分位整數（元） */
export function fmtMoney(x) {
  if (x === null || x === undefined || x === '' || !Number.isFinite(Number(x))) return '';
  const v = excelRound(Number(x), 0);
  return (v === 0 ? 0 : v).toLocaleString('en-US');
}

/** 千分位、固定小數（萬） */
export function fmtWan(x, d = 1) {
  if (x === null || x === undefined || x === '' || !Number.isFinite(Number(x))) return '';
  const v = excelRound(Number(x), d);
  return (v === 0 ? 0 : v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

/** 百分比顯示：60 → 60%、2.5 → 2.5% */
export const fmtPct = (n) => `${excelRound(Number(n) || 0, 4)}%`;

const pad2 = (n) => String(n).padStart(2, '0');
export function dateStamp(d = new Date()) {
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
}

const safeName = (s) => text(s).replace(/[\\/:*?"<>|]/g, '_');
export function areaFileName(projectName, unit, ext) {
  const parts = [safeName(projectName), '面積找補'];
  if (unit) parts.push(safeName(unit.unitId), safeName(unit.name));
  else parts.push(dateStamp());
  return `${parts.filter(Boolean).join('_')}.${ext}`;
}
