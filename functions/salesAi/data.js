// 銷控 AI 智能助理：資料讀取、編號正規化、欄位標籤
// Why: 資料改由後端讀（安全、省 token、可套權限），前端不再傳全案 JSON。

const { normalizeSalespersons, formatSalespersons } = require('../utils/salesperson');
const { classifyCommitment, buildCommitmentOverrides, isDealParking } = require('../utils/salesStatusGroups');
const { DateTime } = require('luxon');

// ---- 欄位標籤（草案卡顯示、工具輸出）----
const FIELD_LABELS = {
  salesStatus_backend: '銷控狀態',
  price_transaction_house: '房屋成交價（萬）',
  price_transaction_total: '成交總價含車位（萬）',
  buyerName: '買方姓名',
  buyerPhone: '買方電話',
  salesperson: '銷售人員',
  salespersonUserKey: '銷售人員帳號',
  contractType: '契約類型',
  payment_deposit_date: '小訂日期',
  payment_deposit_amount: '小訂金額（萬）',
  payment_supplement_date: '補足日期',
  payment_supplement_amount: '補足金額（萬）',
  payment_contract_date: '簽約日期',
  payment_contract_amount: '簽約金額（萬）',
  payment_complete_date: '付清日期',
  remarkNotes: '備註留言',
  '持有車位': '持有車位',
  price_list_house_total: '房屋總表價（萬）',
  price_floor_house_total: '房屋總底價（萬）',
};

// AI 可寫欄位白名單（§6.2）
const WRITABLE_FIELDS = new Set([
  'salesStatus_backend', 'price_transaction_house', 'price_transaction_total',
  'buyerName', 'buyerPhone', 'salesperson', 'contractType',
  'payment_deposit_date', 'payment_deposit_amount',
  'payment_supplement_date', 'payment_supplement_amount',
  'payment_contract_date', 'payment_contract_amount', 'payment_complete_date',
]);
const NUMERIC_FIELDS = new Set(['price_transaction_house', 'price_transaction_total', 'payment_deposit_amount', 'payment_supplement_amount', 'payment_contract_amount']);
const DATE_FIELDS = new Set(['payment_deposit_date', 'payment_supplement_date', 'payment_contract_date', 'payment_complete_date']);
const FORBIDDEN_HINT = {
  price_list_house_total: '表價', price_floor_house_total: '底價', price_list_house_only: '表價', price_floor_house_only: '底價',
  unit_price_list: '表價', unit_price_floor: '底價', area_house_ping: '面積', area_main_ping: '面積',
  housePriceRatio: '房土比', landPriceRatio: '房土比', salesStatus_quote: '報價狀態',
};

// ---- 日期 ----
function todayTaipei() { return DateTime.now().setZone('Asia/Taipei').toFormat('yyyy-MM-dd'); }
function nowTaipeiText() { return DateTime.now().setZone('Asia/Taipei').toFormat('yyyy-MM-dd HH:mm'); }

function toDateStr(v) {
  if (!v) return null;
  try {
    let d;
    if (typeof v.toDate === 'function') d = v.toDate();
    else if (typeof v.seconds === 'number') d = new Date(v.seconds * 1000);
    else if (typeof v._seconds === 'number') d = new Date(v._seconds * 1000);
    else d = new Date(v);
    if (isNaN(d.getTime())) return null;
    return DateTime.fromJSDate(d).setZone('Asia/Taipei').toFormat('yyyy-MM-dd');
  } catch { return null; }
}

function toDateTimeStr(v) {
  if (!v) return null;
  try {
    let d;
    if (typeof v.toDate === 'function') d = v.toDate();
    else if (typeof v.seconds === 'number') d = new Date(v.seconds * 1000);
    else if (typeof v._seconds === 'number') d = new Date(v._seconds * 1000);
    else d = new Date(v);
    if (isNaN(d.getTime())) return null;
    return DateTime.fromJSDate(d).setZone('Asia/Taipei').toFormat('yyyy-MM-dd HH:mm');
  } catch { return null; }
}

/** 解析使用者／模型給的日期（YYYY-MM-DD、YYYY/M/D、民國 115/9/6、今天／明天） */
function parseDateInput(v) {
  if (v === null || v === undefined || v === '') return null;
  const s = String(v).trim();
  if (s === '今天' || s.toLowerCase() === 'today') return todayTaipei();
  if (s === '明天') return DateTime.now().setZone('Asia/Taipei').plus({ days: 1 }).toFormat('yyyy-MM-dd');
  if (s === '昨天') return DateTime.now().setZone('Asia/Taipei').minus({ days: 1 }).toFormat('yyyy-MM-dd');
  let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(s);
  if (m) return DateTime.fromObject({ year: +m[1], month: +m[2], day: +m[3] }, { zone: 'Asia/Taipei' }).toFormat('yyyy-MM-dd');
  m = /^(?:民國)?(\d{2,3})[-/.年](\d{1,2})[-/.月](\d{1,2})日?$/.exec(s);
  if (m && +m[1] < 200) return DateTime.fromObject({ year: +m[1] + 1911, month: +m[2], day: +m[3] }, { zone: 'Asia/Taipei' }).toFormat('yyyy-MM-dd');
  m = /^(\d{1,2})[-/.月](\d{1,2})日?$/.exec(s);
  if (m) return DateTime.fromObject({ year: DateTime.now().setZone('Asia/Taipei').year, month: +m[1], day: +m[2] }, { zone: 'Asia/Taipei' }).toFormat('yyyy-MM-dd');
  const d = new Date(s);
  if (!isNaN(d.getTime())) return DateTime.fromJSDate(d).setZone('Asia/Taipei').toFormat('yyyy-MM-dd');
  return undefined; // 無法解析
}

// ---- 編號正規化 ----
const FULL_TO_HALF = s => s.replace(/[！-～]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)).replace(/　/g, ' ');
function normalizeId(raw) {
  if (raw === null || raw === undefined) return '';
  return FULL_TO_HALF(String(raw)).trim().toUpperCase().replace(/\s+/g, '').replace(/[－—–]/g, '-');
}
/** 「A3」「A棟3」「A-3」→ 候選鍵集合 */
function idKeys(raw) {
  const n = normalizeId(raw).replace(/棟|戶|號|樓/g, '');
  const keys = new Set([n]);
  keys.add(n.replace(/-/g, ''));
  const m = /^([A-Z]+)(\d+[A-Z]?)$/.exec(n.replace(/-/g, ''));
  if (m) keys.add(`${m[1]}-${m[2]}`);
  return keys;
}

/** 在清單中找戶別／車位：回 { exact, candidates } */
function findById(list, raw, idField) {
  const keys = idKeys(raw);
  const exact = list.filter(x => keys.has(normalizeId(x[idField]).replace(/-/g, '')) || keys.has(normalizeId(x[idField])));
  if (exact.length === 1) return { exact: exact[0], candidates: [] };
  if (exact.length > 1) return { exact: null, candidates: exact };
  // 模糊：包含關係
  const n = normalizeId(raw);
  const fuzzy = n.length >= 2 ? list.filter(x => normalizeId(x[idField]).includes(n)) : [];
  return { exact: null, candidates: fuzzy.slice(0, 8) };
}

// ---- 讀取 ----
async function loadProjectData(db, projectId) {
  const [units, parkings, personnel, parameters] = await Promise.all([
    db.collection('salesHouseholds').where('projectId', '==', projectId).get(),
    db.collection('salesParkings').where('projectId', '==', projectId).get(),
    db.collection('salesPersonnel').where('projectId', '==', projectId).get(),
    db.collection('salesParameters').where('projectId', '==', projectId).get(),
  ]);
  const toArr = snap => snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const params = toArr(parameters).sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  return {
    units: toArr(units).filter(u => u.unitId),
    parkings: toArr(parkings).filter(p => p.spotId),
    personnel: toArr(personnel).filter(p => p.name).sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)),
    parameters: params,
    statusNames: params.map(p => p.statusName).filter(Boolean),
    tierOverrides: buildCommitmentOverrides(params),
  };
}

// ---- 精簡輸出（給模型）----
const num = v => (v === null || v === undefined || v === '' ? null : (Number.isFinite(Number(v)) ? Number(v) : null));
const stripEmpty = obj => {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined || v === '' || v === '-') continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
};

function slimUnit(u, parkings, { includeFloor = true } = {}) {
  const owned = (parkings || []).filter(p => isDealParking(p, u.unitId)).map(p => ({
    車位編號: p.spotId, 成交價_萬: num(p.price_transaction), 狀態: p.status_backend || null,
  }));
  return stripEmpty({
    戶別: u.unitId, 棟別: u.building, 樓層: u.floor, 格局: u.layout, 物件類型: u.propertyType,
    主建坪數: num(u.area_main_ping), 房屋總面積_坪: num(u.area_house_ping),
    銷控狀態: u.salesStatus_backend || '可售',
    房屋總表價_萬: num(u.price_list_house_total),
    房屋總底價_萬: includeFloor ? num(u.price_floor_house_total) : undefined,
    房屋成交價_萬: num(u.price_transaction_house),
    成交總價含車_萬: num(u.price_transaction_total),
    買方姓名: u.buyerName, 買方電話: u.buyerPhone,
    銷售人員: formatSalespersons(u.salesperson, '、', ''),
    契約類型: u.contractType,
    小訂日期: toDateStr(u.payment_deposit_date), 小訂金額: num(u.payment_deposit_amount),
    補足日期: toDateStr(u.payment_supplement_date), 補足金額: num(u.payment_supplement_amount),
    簽約日期: toDateStr(u.payment_contract_date), 簽約金額: num(u.payment_contract_amount),
    持有車位: owned,
    標籤: Array.isArray(u.tags) ? u.tags.map(t => (typeof t === 'string' ? t : t?.text)).filter(Boolean) : undefined,
    備註: typeof u.remarks === 'string' ? u.remarks.slice(0, 300) : undefined,
    狀態異動日: toDateStr(u.salesStatusChangedAt),
    資料最後修改日_非成交日: toDateStr(u.updatedAt),
  });
}

function slimParking(p, tierOverrides, { includeFloor = true } = {}) {
  const tier = classifyCommitment(p.status_backend, tierOverrides);
  return stripEmpty({
    車位編號: p.spotId, 樓層: p.floor, 類型: p.type, 尺寸: p.size,
    狀態: p.status_backend || '可售', 確定度: tier,
    底價_萬: includeFloor ? num(p.price_floor) : undefined, 表價_萬: num(p.price_list), 成交價_萬: num(p.price_transaction),
    買方姓名: p.buyerName, 對應戶別: p.buyerUnitId,
    銷售人員: formatSalespersons(p.salesperson, '、', ''),
    備註: typeof p.remarks === 'string' ? p.remarks.slice(0, 200) : undefined,
  });
}

/** 車位是否可配置給某戶（可售、或已是本戶） */
function parkingAvailability(p, unitId, tierOverrides) {
  const bound = p.buyerUnitId && String(p.buyerUnitId).trim() !== '';
  if (bound && p.buyerUnitId === unitId) return { ok: true, reason: 'own' };
  if (bound && isDealParking(p, p.buyerUnitId)) return { ok: false, reason: `已配置給 ${p.buyerUnitId}` };
  const tier = classifyCommitment(p.status_backend, tierOverrides);
  if (bound) return { ok: true, warn: `目前為「${p.status_backend}」（準備購買，綁定 ${p.buyerUnitId}）` };
  if (tier === 'guest') return { ok: false, reason: '非銷售用車位' };
  if (tier === 'held' || tier === 'booked' || tier === 'signed') return { ok: true, warn: `目前狀態為「${p.status_backend}」` };
  return { ok: true };
}

/** 銷售人員名稱比對：回 { exact, candidates } */
function matchSalesperson(personnel, raw) {
  const s = String(raw || '').trim();
  if (!s) return { exact: null, candidates: [] };
  const exact = personnel.filter(p => String(p.name).trim() === s);
  if (exact.length === 1) return { exact: exact[0], candidates: [] };
  const fuzzy = personnel.filter(p => String(p.name).includes(s) || s.includes(String(p.name)));
  if (fuzzy.length === 1) return { exact: fuzzy[0], candidates: [] };
  return { exact: null, candidates: fuzzy };
}

module.exports = {
  FIELD_LABELS, WRITABLE_FIELDS, NUMERIC_FIELDS, DATE_FIELDS, FORBIDDEN_HINT,
  todayTaipei, nowTaipeiText, toDateStr, toDateTimeStr, parseDateInput,
  normalizeId, idKeys, findById, loadProjectData, slimUnit, slimParking, parkingAvailability, matchSalesperson,
  normalizeSalespersons, formatSalespersons, isDealParking, classifyCommitment, num, stripEmpty,
};
