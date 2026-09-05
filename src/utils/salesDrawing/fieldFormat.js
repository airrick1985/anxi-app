/**
 * 銷售圖面編輯器：戶別欄位值格式化與資訊卡列建立／重新整理
 * 規格：docs/銷售圖面編輯器-spec.md §3.5
 *
 * - 價格欄位（salesHouseholds）單位為「萬」；priceUnit 'wan' 顯示萬、'yuan' 換算成元
 * - 公設比／土地持分儲存為小數（0.32），顯示時 ×100
 * - 日期一律以台灣時間顯示 YYYY/MM/DD
 */
import { COLUMN_DEFINITIONS, UNIT_EXPORT_COMPUTED_COLUMNS, DRAWING_SHORT_LABELS } from '@/constants/householdColumns';
import { normalizeSalespersons } from '@/utils/salespersonUtils';

const TITLE_MAP = new Map([...COLUMN_DEFINITIONS, ...UNIT_EXPORT_COMPUTED_COLUMNS].map(c => [c.key, c.title]));

const BOOL_KEYS = new Set(['isPreferredPayment', 'isFirstTimeBuyer', 'buyerHasPurchasedFuyu']);
const DATE_KEYS = new Set(['payment_deposit_date', 'payment_supplement_date', 'payment_contract_date', 'buyerDateOfBirth']);
const RATIO_DECIMAL_KEYS = new Set(['common_area_ratio', 'land_share_ratio']);       // 儲存 0~1
const RATIO_PERCENT_KEYS = new Set(['housePriceRatio', 'landPriceRatio', 'payment_ratio']); // 已是百分數
const UNIT_PRICE_KEYS = new Set(['unit_price_list', 'unit_price_floor', 'unit_price_transaction']);
const YUAN_AMOUNT_KEYS = new Set(['payment_deposit_amount', 'payment_supplement_amount', 'payment_contract_amount']);
const WAN_PRICE_KEYS = new Set([
  'price_list_house_only', 'price_list_terrace', 'price_list_terrace_unit', 'price_list_ancillary', 'price_list_house_total',
  'price_floor_house_only', 'price_floor_terrace', 'price_floor_ancillary', 'price_floor_house_total',
  'price_transaction_house', 'price_package_deal', 'price_package',
  'parking_trans_total', 'parking_floor_total', 'total_transaction', 'total_floor', 'price_diff', 'paid_total',
]);
const COUNT_KEYS = new Set(['parking_count']);

function fmtNumber(num, decimals = 0) {
  return Number(num).toLocaleString('zh-TW', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtDate(val) {
  if (!val) return '';
  let d = null;
  if (val instanceof Date) d = val;
  else if (val && typeof val.toDate === 'function') d = val.toDate();
  else {
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) d = parsed;
  }
  if (!d) return String(val);
  const parts = new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(d).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});
  return `${parts.year}/${parts.month}/${parts.day}`;
}

/**
 * 欄位顯示標籤
 * @param {string} fieldKey
 * @param {boolean} short - 使用簡短名稱
 */
export function getFieldLabel(fieldKey, short = true) {
  if (short && DRAWING_SHORT_LABELS[fieldKey]) return DRAWING_SHORT_LABELS[fieldKey];
  return TITLE_MAP.get(fieldKey) || fieldKey;
}

/**
 * 依欄位 key 取得原始值（含特殊映射欄位：unitTags_text → unitTags）
 */
export function getRawFieldValue(unit, fieldKey) {
  if (!unit) return undefined;
  if (fieldKey === 'unitTags_text') {
    const tags = Array.isArray(unit.unitTags) ? unit.unitTags : [];
    return tags.map(t => (typeof t === 'string' ? t : t?.text)).filter(Boolean);
  }
  return unit[fieldKey];
}

/**
 * 格式化欄位值為顯示字串
 * @param {string} fieldKey
 * @param {*} raw
 * @param {{ priceUnit?: 'wan'|'yuan', planIdToName?: Map<string,string> }} [opts]
 */
export function formatFieldValue(fieldKey, raw, opts = {}) {
  const priceUnit = opts.priceUnit || 'wan';
  if (raw === null || raw === undefined || raw === '') return '';

  if (BOOL_KEYS.has(fieldKey)) {
    if (typeof raw === 'boolean') return raw ? '是' : '否';
    const s = String(raw).trim().toLowerCase();
    if (['true', 'yes', 'y', '1', '是', 'on'].includes(s)) return '是';
    if (['false', 'no', 'n', '0', '否', 'off', ''].includes(s)) return '否';
    return String(raw);
  }
  if (DATE_KEYS.has(fieldKey)) return fmtDate(raw);

  if (fieldKey === 'salesperson') return normalizeSalespersons(raw).join('、');
  if (fieldKey === 'unitTags_text') return (Array.isArray(raw) ? raw : [raw]).filter(Boolean).join('、');
  if (fieldKey === 'availablePlans') {
    const ids = Array.isArray(raw) ? raw : [raw];
    const map = opts.planIdToName;
    return ids.map(id => (map && map.get(id)) || (map ? null : id)).filter(Boolean).join('、');
  }

  const num = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/,/g, ''));
  const isNum = !isNaN(num) && isFinite(num);

  if (fieldKey.endsWith('_ping')) return isNum ? `${fmtNumber(num, 2)} 坪` : String(raw);
  if (fieldKey.endsWith('_sqm')) return isNum ? `${fmtNumber(num, 2)} m²` : String(raw);
  if (RATIO_DECIMAL_KEYS.has(fieldKey)) {
    if (!isNum) return String(raw);
    const pct = num <= 1 ? num * 100 : num;
    return `${fmtNumber(pct, 2)}%`;
  }
  if (RATIO_PERCENT_KEYS.has(fieldKey)) return isNum ? `${fmtNumber(num, 1)}%` : String(raw);
  if (UNIT_PRICE_KEYS.has(fieldKey)) return isNum ? `${fmtNumber(num, 1)} 萬/坪` : String(raw);
  if (YUAN_AMOUNT_KEYS.has(fieldKey)) return isNum ? `${fmtNumber(num, 0)} 元` : String(raw);
  if (WAN_PRICE_KEYS.has(fieldKey) || fieldKey.startsWith('price_')) {
    if (!isNum) return String(raw);
    if (priceUnit === 'yuan') return `${fmtNumber(Math.round(num * 10000), 0)} 元`;
    return `${fmtNumber(num, Number.isInteger(num) ? 0 : 1)} 萬`;
  }
  if (COUNT_KEYS.has(fieldKey)) return isNum ? `${fmtNumber(num, 0)}` : String(raw);

  if (Array.isArray(raw)) return raw.filter(v => v !== null && v !== undefined && v !== '').join('、');
  if (typeof raw === 'object') return '';
  return String(raw);
}

/**
 * 補齊前端計算欄位（與銷控頁 enrichUnitItem 對齊：車位、成交總價、單價、繳款）
 * @param {object} unit - salesHouseholds 原始資料
 * @param {Array} parkings - 建案車位（p.buyerUnitId 對應 unitId）
 */
export function withDerivedFields(unit, parkings = []) {
  const item = { ...unit };
  const mySpots = (parkings || []).filter(p => p && p.buyerUnitId === unit.unitId);
  const parkingTransTotal = mySpots.reduce((s, p) => s + (Number(p.price_transaction) || 0), 0);
  const parkingFloorTotal = mySpots.reduce((s, p) => s + (Number(p.price_floor) || 0), 0);
  item.parking_trans_total = parkingTransTotal;
  item.parking_floor_total = parkingFloorTotal;
  item.parking_spots = mySpots.map(p => p.spotId ?? '').filter(Boolean)
    .sort((a, b) => String(a).localeCompare(String(b), 'zh-Hant', { numeric: true })).join(',');
  item.parking_count = mySpots.length;

  const houseTrans = Number(unit.price_transaction_house) || 0;
  const houseFloor = Number(unit.price_floor_house_total) || 0;
  item.total_transaction = houseTrans + parkingTransTotal;
  item.total_floor = houseFloor + parkingFloorTotal;
  item.price_diff = houseTrans > 0 ? item.total_transaction - item.total_floor : null;

  const paymentRecords = Array.isArray(unit.paymentRecords) ? unit.paymentRecords : [];
  const paidYuan = paymentRecords.reduce((s, r) => s + (Number(r?.amount) || 0), 0);
  item.paid_total = Math.round(paidYuan / 10000 * 100) / 100;
  item.payment_ratio = item.total_transaction > 0 ? Math.round((paidYuan / (item.total_transaction * 10000)) * 1000) / 10 : null;

  const areaVal = Number(item.area_house_ping) || 0;
  const calcUnit = (total) => {
    const price = Number(total) || 0;
    if (price <= 0 || areaVal === 0) return null;
    return Math.round((price / areaVal) * 10) / 10;
  };
  item.unit_price_list = calcUnit(item.price_list_house_total);
  item.unit_price_floor = calcUnit(item.price_floor_house_total);
  item.unit_price_transaction = calcUnit(item.price_transaction_house);
  return item;
}

/**
 * 依欄位清單建立資訊卡列
 * @param {object} unit - 已含計算欄位的戶別資料
 * @param {string[]} fieldKeys
 * @param {{ shortLabel?: boolean, priceUnit?: string, planIdToName?: Map }} opts
 */
export function buildInfoCardRows(unit, fieldKeys, opts = {}) {
  const shortLabel = opts.shortLabel !== false;
  return fieldKeys.map(key => ({
    fieldKey: key,
    label: getFieldLabel(key, shortLabel),
    value: formatFieldValue(key, getRawFieldValue(unit, key), opts),
    labelOverridden: false,
    valueOverridden: false,
  }));
}

/**
 * 重新整理資訊卡列：只更新未覆寫的值／標籤；手動列（fieldKey null）原樣保留
 */
export function refreshInfoCardRows(rows, unit, opts = {}) {
  const shortLabel = opts.shortLabel !== false;
  return (rows || []).map(row => {
    if (!row.fieldKey) return { ...row };
    const next = { ...row };
    if (!row.valueOverridden) next.value = formatFieldValue(row.fieldKey, getRawFieldValue(unit, row.fieldKey), opts);
    if (!row.labelOverridden) next.label = getFieldLabel(row.fieldKey, shortLabel);
    return next;
  });
}
