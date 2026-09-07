// 銷控 AI 智能助理：資料讀取、編號正規化、欄位標籤
// Why: 資料改由後端讀（安全、省 token、可套權限），前端不再傳全案 JSON。

const { normalizeSalespersons, formatSalespersons } = require('../utils/salesperson');
const { classifyCommitment, buildCommitmentOverrides, isDealParking } = require('../utils/salesStatusGroups');
const { DateTime } = require('luxon');

// ---- AI 可寫欄位定義（§6.2）----
// Why: AI 是使用者的分身，可改欄位＝使用者本人在「戶別資訊 → 修改銷控」表單能編輯的欄位
//      （UnitDetailModal 價格設定／房土比 + SalesInfoForm 銷售／成交／買方）。
//      面積、戶別基本資料表單本身不可編輯，AI 也不開放；結構型資料（繳款紀錄、圖片、標籤、地號）不適合對話修改。
//      注意：前端「補足日期」實際綁 payment_complete_date；payment_supplement_*／payment_*_amount 是匯出用舊欄位，表單不編輯。
// type: status | salesperson | text | number | date | bool | rocDate
const FIELD_DEFS = {
  // 銷售資訊
  salesStatus_backend: { label: '銷控狀態', type: 'status', section: '銷售資訊', hint: '需在本案狀態清單內；空值＝可售' },
  salesperson: { label: '銷售人員', type: 'salesperson', section: '銷售資訊', hint: '姓名，可多人' },
  contractType: { label: '合約方式', type: 'text', section: '銷售資訊', hint: '需在本案合約方式清單內' },
  payment_deposit_date: { label: '小訂日期', type: 'date', section: '銷售資訊' },
  payment_complete_date: { label: '補足日期', type: 'date', section: '銷售資訊' },
  payment_contract_date: { label: '簽約日期', type: 'date', section: '銷售資訊' },
  // 成交資訊
  price_transaction_house: { label: '房屋成交價（萬）', type: 'number', section: '成交資訊' },
  price_transaction_total: { label: '成交總價含車位（萬）', type: 'number', section: '成交資訊', hint: '未提供會自動計算' },
  // 買方資訊
  buyerName: { label: '買方姓名', type: 'text', section: '買方資訊' },
  buyerPhone: { label: '買方電話', type: 'text', section: '買方資訊', hint: '多筆以逗號分隔' },
  buyerIdNumber: { label: '身分證字號', type: 'text', section: '買方資訊' },
  buyerDateOfBirth: { label: '出生年月日', type: 'rocDate', section: '買方資訊', hint: '民國 65/3/12 或西元 1976-03-12' },
  buyerEmail: { label: 'EMAIL', type: 'text', section: '買方資訊' },
  isFirstTimeBuyer: { label: '是否首購', type: 'bool', section: '買方資訊' },
  buyerMailingAddressCity: { label: '通訊地址_縣市', type: 'text', section: '買方資訊' },
  buyerMailingAddressDistrict: { label: '通訊地址_區域', type: 'text', section: '買方資訊' },
  buyerMailingAddressDetail: { label: '通訊地址_詳細', type: 'text', section: '買方資訊' },
  buyerPermanentAddressCity: { label: '戶籍地址_縣市', type: 'text', section: '買方資訊' },
  buyerPermanentAddressDistrict: { label: '戶籍地址_區域', type: 'text', section: '買方資訊' },
  buyerPermanentAddressDetail: { label: '戶籍地址_詳細', type: 'text', section: '買方資訊' },
  // 價格設定
  // 註：房屋總表價／總底價是衍生欄位（＝房屋＋露臺），模型指定總額時會由 validate 改寫到對應明細欄位
  price_list_house_only: { label: '房屋表價（萬）', type: 'number', section: '價格設定', hint: '不含露臺；調整表價請改這個欄位' },
  price_list_terrace: { label: '露臺表價（萬）', type: 'number', section: '價格設定', hint: '僅有露臺的戶別' },
  price_list_house_total: { label: '房屋總表價（萬）', type: 'number', section: '價格設定', hint: '＝房屋表價＋露臺表價，系統自動計算，不可直接指定' },
  price_floor_house_only: { label: '房屋底價（萬）', type: 'number', section: '價格設定', hint: '不含露臺；調整底價請改這個欄位' },
  price_floor_terrace: { label: '露臺底價（萬）', type: 'number', section: '價格設定', hint: '僅有露臺的戶別' },
  price_floor_house_total: { label: '房屋總底價（萬）', type: 'number', section: '價格設定', hint: '＝房屋底價＋露臺底價，系統自動計算，不可直接指定' },
  price_package_deal: { label: '配套房屋總價（萬）', type: 'number', section: '價格設定', hint: '合約上的房屋總價；配套價格＝成交總價−此值' },
  isPreferredPayment: { label: '優付', type: 'bool', section: '價格設定' },
  priceRemarks: { label: '價格備註', type: 'text', section: '價格設定' },
  // 房土比
  housePriceRatio: { label: '房屋價款比例(%)', type: 'number', section: '房土比', hint: '與土地比例加總須為 100；只給一個會自動補另一個' },
  landPriceRatio: { label: '土地價款比例(%)', type: 'number', section: '房土比', hint: '與房屋比例加總須為 100' },
};

/** 模型可能沿用的舊欄位名 → 實際欄位 */
const FIELD_ALIASES = {
  payment_supplement_date: 'payment_complete_date',
  payment_top_up_date: 'payment_complete_date',
  buyer_name: 'buyerName', buyer_phone: 'buyerPhone',
};

// ---- 欄位標籤（草案卡顯示、工具輸出）----
const FIELD_LABELS = {
  ...Object.fromEntries(Object.entries(FIELD_DEFS).map(([k, d]) => [k, d.label])),
  salespersonUserKey: '銷售人員帳號',
  remarkNotes: '備註留言',
  '持有車位': '持有車位',
  salesStatus_quote: '銷售狀態',
  price_list_terrace_unit: '露臺單價（表價）',
  payment_supplement_date: '補足日期',
};

const fieldsOfType = t => new Set(Object.keys(FIELD_DEFS).filter(k => FIELD_DEFS[k].type === t));
const WRITABLE_FIELDS = new Set(Object.keys(FIELD_DEFS));
const NUMERIC_FIELDS = fieldsOfType('number');
const DATE_FIELDS = fieldsOfType('date');
const BOOL_FIELDS = fieldsOfType('bool');
const TEXT_FIELDS = fieldsOfType('text');
// 只有「有露臺面積」的戶別才有的欄位（與編輯表單 v-if 一致）。
// 註：price_*_house_only 已改為所有戶別都要維護的主要欄位（總額由它衍生），故不在此列。
const TERRACE_ONLY_FIELDS = new Set(['price_list_terrace', 'price_floor_terrace']);

/** 由明細衍生、不接受直接指定的總額欄位 → 對應的明細欄位 */
const DERIVED_TOTAL_TO_DETAIL = {
  price_list_house_total: { only: 'price_list_house_only', terrace: 'price_list_terrace' },
  price_floor_house_total: { only: 'price_floor_house_only', terrace: 'price_floor_terrace' },
};

/**
 * 依能力回傳本次可寫欄位。
 * 現行銷控系統沒有欄位層級權限：有「銷控系統」權限即可編輯表單全部欄位，AI 比照；
 * 日後若系統加入欄位權限，只需在此依 caps 過濾。
 */
function writableFieldsFor(caps) {
  if (!caps || !caps.has('sales.write')) return new Set();
  return new Set(WRITABLE_FIELDS);
}

// 表單本身不可編輯（或由系統衍生）的欄位：模型送來一律擋下並說明
const FORBIDDEN_HINT = {
  area_house_ping: '面積不可由 AI 修改（戶別資訊表單亦不可編輯）', area_main_ping: '面積不可由 AI 修改（戶別資訊表單亦不可編輯）',
  area_ancillary_ping: '面積不可由 AI 修改（戶別資訊表單亦不可編輯）', area_common_ping: '面積不可由 AI 修改（戶別資訊表單亦不可編輯）',
  area_terrace_ping: '面積不可由 AI 修改（戶別資訊表單亦不可編輯）', area_house_sqm: '面積不可由 AI 修改（戶別資訊表單亦不可編輯）',
  unitId: '戶別編號不可修改', building: '棟別不可修改', floor: '樓層不可修改', layout: '格局不可由 AI 修改', propertyType: '物件類型不可由 AI 修改',
  salesStatus_quote: '銷售狀態由銷控狀態自動衍生，請改「銷控狀態」',
  price_list_terrace_unit: '露臺單價由露臺表價自動計算，請改「露臺表價」',
  payment_deposit_amount: '小訂金額請至戶別資訊的「繳款紀錄」登錄，AI 目前無法代填',
  payment_supplement_amount: '補足金額請至戶別資訊的「繳款紀錄」登錄，AI 目前無法代填',
  payment_contract_amount: '簽約金額請至戶別資訊的「繳款紀錄」登錄，AI 目前無法代填',
  paymentRecords: '繳款紀錄請至戶別資訊操作', landParcels: '土地標的清冊請至戶別資訊操作',
  salesImages: '戶別圖片請至戶別資訊操作', unitTags: '文字標籤請至戶別資訊操作', availablePlans: '可選方案請至戶別資訊操作',
  remarks: '備註請用 addRemark 新增留言', remarkNotes: '備註請用 addRemark 新增留言',
};

// ---- 值解析／顯示 ----
/** 是／否、true／false、1／0 → boolean；無法辨識回 undefined；空值回 null */
function parseBool(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'boolean') return v;
  const s = String(v).trim().toLowerCase();
  if (['是', '有', 'true', 'yes', 'y', '1', '優付', '首購', '要', '開', '開啟'].includes(s)) return true;
  if (['否', '無', 'false', 'no', 'n', '0', '非', '不是', '取消', '關', '關閉', '非優付', '非首購'].includes(s)) return false;
  return undefined;
}

/** 民國／西元生日 → { year(民國), month, day }；空值 null；無法辨識 undefined */
function parseRocDate(v) {
  if (v === null || v === undefined || v === '') return null;
  const toObj = (y, m, d) => {
    const year = y > 1911 ? y - 1911 : y;
    if (year < 1 || year > 200 || m < 1 || m > 12 || d < 1 || d > 31) return undefined;
    return { year, month: m, day: d };
  };
  if (typeof v === 'object') {
    const y = Number(v.year), m = Number(v.month), d = Number(v.day);
    return [y, m, d].every(Number.isFinite) ? toObj(y, m, d) : undefined;
  }
  const s = FULL_TO_HALF(String(v)).trim().replace(/^民國/, '').replace(/\s+/g, '');
  const m = /^(\d{2,4})[-/.年](\d{1,2})[-/.月](\d{1,2})日?$/.exec(s);
  if (!m) return undefined;
  return toObj(+m[1], +m[2], +m[3]);
}
function formatRocDate(v) {
  if (!v || typeof v !== 'object' || !v.year) return null;
  return `民國${v.year}年${v.month}月${v.day}日`;
}

/** 草案卡／摘要用的顯示值 */
function displayValue(field, v) {
  if (v === null || v === undefined || v === '') return null;
  if (field === 'salesperson') return formatSalespersons(v, '、', '') || null;
  if (field === 'buyerDateOfBirth') return formatRocDate(v);
  if (DATE_FIELDS.has(field)) return toDateStr(v);
  if (BOOL_FIELDS.has(field) || typeof v === 'boolean') return v === true ? '是' : '否';
  if (Array.isArray(v)) return v.join('、');
  return v;
}

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

function slimUnit(u, parkings, { includeFloor = true, full = false } = {}) {
  const owned = (parkings || []).filter(p => isDealParking(p, u.unitId)).map(p => ({
    車位編號: p.spotId, 成交價_萬: num(p.price_transaction), 狀態: p.status_backend || null,
  }));
  const terrace = num(u.area_terrace_ping) || 0;
  // full：get_unit 單戶查詢時回傳可編輯的完整欄位（讓模型知道現值，才能正確產生草案）
  const extra = full ? {
    露臺面積_坪: terrace > 0 ? terrace : undefined,
    // 表價／底價的可編輯明細：總額由「房屋＋露臺」自動計算，模型要調價請改這兩個欄位
    房屋表價_萬: num(u.price_list_house_only),
    露臺表價_萬: terrace > 0 ? num(u.price_list_terrace) : undefined,
    房屋底價_萬: includeFloor ? num(u.price_floor_house_only) : undefined,
    露臺底價_萬: includeFloor && terrace > 0 ? num(u.price_floor_terrace) : undefined,
    配套房屋總價_萬: num(u.price_package_deal),
    優付: u.isPreferredPayment === true ? '是' : undefined,
    價格備註: typeof u.priceRemarks === 'string' ? u.priceRemarks.slice(0, 200) : undefined,
    房屋價款比例_百分比: num(u.housePriceRatio), 土地價款比例_百分比: num(u.landPriceRatio),
    身分證字號: u.buyerIdNumber, EMAIL: u.buyerEmail, 出生年月日: formatRocDate(u.buyerDateOfBirth),
    是否首購: u.isFirstTimeBuyer === false ? '否' : (u.isFirstTimeBuyer === true ? '是' : undefined),
    通訊地址: [u.buyerMailingAddressCity, u.buyerMailingAddressDistrict, u.buyerMailingAddressDetail].filter(Boolean).join('') || undefined,
    戶籍地址: [u.buyerPermanentAddressCity, u.buyerPermanentAddressDistrict, u.buyerPermanentAddressDetail].filter(Boolean).join('') || undefined,
  } : {};
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
    合約方式: u.contractType,
    小訂日期: toDateStr(u.payment_deposit_date),
    補足日期: toDateStr(u.payment_complete_date),
    簽約日期: toDateStr(u.payment_contract_date),
    ...extra,
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
  FIELD_DEFS, FIELD_ALIASES, FIELD_LABELS, WRITABLE_FIELDS, NUMERIC_FIELDS, DATE_FIELDS, BOOL_FIELDS, TEXT_FIELDS, TERRACE_ONLY_FIELDS, FORBIDDEN_HINT,
  DERIVED_TOTAL_TO_DETAIL,
  writableFieldsFor, parseBool, parseRocDate, formatRocDate, displayValue,
  todayTaipei, nowTaipeiText, toDateStr, toDateTimeStr, parseDateInput,
  normalizeId, idKeys, findById, loadProjectData, slimUnit, slimParking, parkingAvailability, matchSalesperson,
  normalizeSalespersons, formatSalespersons, isDealParking, classifyCommitment, num, stripEmpty,
};
