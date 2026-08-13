// 戶別文件資料組裝（合約製作資料範本用）
// 自 salesHouseholds 戶別資料（英文 key，含 持有車位）組出文件產製所需的 context。
// 見 docs/合約製作資料範本-spec.md §3.4
//
// 注意：付款表（PaymentSettings.vue）的 context 建立在「對話框內可編輯的 formData」上，
// 行為不同，維持原狀；本模組為合約製作 Dialog 專用的純函式版本。

import { normalizeSalespersons, formatSalespersons } from '@/utils/salespersonUtils';

/** Firestore Timestamp / Date / 字串 → Date（無效回 null） */
export function toDateSafe(value) {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value === 'object' && Number.isFinite(value.seconds)) return new Date(value.seconds * 1000);
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/** 該戶持有車位（優先 unitData['持有車位']，備援 allParkings 過濾 buyerUnitId） */
export function getOwnedParkingSpots(unitData, allParkings = []) {
  if (unitData && Array.isArray(unitData['持有車位'])) return unitData['持有車位'];
  const unitId = unitData?.unitId;
  if (!unitId || !Array.isArray(allParkings)) return [];
  return allParkings.filter(p => p.buyerUnitId === unitId);
}

/** 車位顯示字串：B2-058(法定/坡道平面/550*250) */
export function formatParkingSpotLabel(p) {
  if (!p) return '';
  const spotId = p.spotId ?? p['車位編號'] ?? '';
  const parts = [p.type ?? p['車位類型'], p.type2 ?? p['車位形式'], p.size ?? p['車位尺寸']]
    .map(v => (v === null || v === undefined ? '' : String(v).trim()))
    .filter(Boolean);
  return parts.length ? `${spotId}(${parts.join('/')})` : String(spotId);
}

export function parkingTransactionPrice(p) {
  return Number(p?.['車位成交價'] ?? p?.price_transaction) || 0;
}

/** 戶別 9 個銀行欄位 → 段落陣列（全空的組別自動剔除，同 PaymentSettings accountSections 行為） */
export function buildAccountSections(unitData) {
  const d = unitData || {};
  const sections = [
    { key: 'unit-house', title: '房屋款', bank: d.houseBankName, name: d.houseBankAccountName, number: d.houseBankAccount },
    { key: 'unit-land', title: '土地款', bank: d.landBankName, name: d.landBankAccountName, number: d.landBankAccount },
    { key: 'unit-package', title: '配套款', bank: d.packageBankName, name: d.packageBankAccountName, number: d.packageBankAccount },
  ];
  return sections.filter(s =>
    (s.bank && String(s.bank).trim() !== '') ||
    (s.name && String(s.name).trim() !== '') ||
    (s.number && String(s.number).trim() !== ''));
}

/**
 * 依 config.bankSets 解析實際銀行資料。
 * unit-house / unit-land / unit-package 取戶別欄位；custom 取 set 自身欄位。
 * 回傳僅含有資料的組別：[{ id, label, bankName, accountName, account }]
 */
export function resolveBankSets(bankSets = [], unitData = {}) {
  const sections = buildAccountSections(unitData);
  const bySource = Object.fromEntries(sections.map(s => [s.key, s]));
  return (bankSets || []).map(set => {
    if (set.source === 'custom') {
      return { id: set.id, label: set.label, bankName: set.bankName || '', accountName: set.accountName || '', account: set.account || '' };
    }
    const s = bySource[set.source];
    if (!s) return null;
    return { id: set.id, label: set.label || s.title, bankName: s.bank || '', accountName: s.name || '', account: s.number || '' };
  }).filter(set => set && (set.bankName || set.accountName || set.account));
}

/** 買方通訊地址（三欄串接） */
export function buildBuyerMailingAddress(unitData) {
  const d = unitData || {};
  return [d.buyerMailingAddressCity, d.buyerMailingAddressDistrict, d.buyerMailingAddressDetail]
    .map(v => (v === null || v === undefined ? '' : String(v).trim()))
    .filter(Boolean)
    .join('');
}

/** 戶別顯示標籤（如 "A 棟 8 樓"），無棟/樓資訊時回退 unitId */
export function buildUnitLabel(unitData) {
  const u = unitData || {};
  if (u.building && u.floor) {
    const floorNum = parseInt(u.floor, 10);
    return `${u.building} 棟 ${isNaN(floorNum) ? u.floor : floorNum} 樓`;
  }
  return u.unitId || '';
}

/**
 * 組出合約製作 Dialog 所需的完整戶別 context。
 * @param {object} unitData salesHouseholds 戶別資料（含 持有車位 enrich）
 * @param {object} opts { personnelList: 銷售人員清單（含 name/phone/order）, allParkings: 車位備援 }
 */
export function buildUnitDocContext(unitData, opts = {}) {
  const d = unitData || {};
  const personnelList = opts.personnelList || [];
  const parkingSpots = getOwnedParkingSpots(d, opts.allParkings || []);
  const parkingTotal = parkingSpots.reduce((s, p) => s + parkingTransactionPrice(p), 0);

  const housePrice = Number(d.price_transaction_house) || 0;
  // 成交總價（含車位）：優先即時計算（房屋成交價 + 車位成交價合計），備援 price_transaction_total
  const grandTotal = housePrice > 0 || parkingTotal > 0
    ? housePrice + parkingTotal
    : (Number(d.price_transaction_total) || 0);

  const salespersonNames = normalizeSalespersons(d.salesperson);
  const salesPhone = salespersonNames
    .map(name => personnelList.find(p => p.name === name)?.phone || '')
    .filter(Boolean)
    .join(',');

  return {
    unitId: d.unitId || '',
    unitLabel: buildUnitLabel(d),
    contractType: d.contractType || '',
    isFirstTimeBuyer: d.isFirstTimeBuyer !== false,
    usePreferredPayment: d.usePreferredPayment === true,
    propertyType: d.propertyType || d.layout || '住家',

    buyerName: d.buyerName || '',
    buyerPhone: d.buyerPhone || '',
    buyerIdNumber: d.buyerIdNumber || '',
    buyerMailingAddress: buildBuyerMailingAddress(d),
    contractDate: toDateSafe(d.payment_contract_date),

    totalPrice: grandTotal,                 // 成交總價（含車位，萬）
    houseTransactionPrice: housePrice,      // 房屋成交價（不含車位，萬）
    packageDealPrice: Number(d.price_package_deal) || 0,
    housePriceRatio: Number(d.housePriceRatio) || 0,
    landPriceRatio: Number(d.landPriceRatio) || 0,

    parkingSpots: parkingSpots.map(p => ({
      spotId: p.spotId ?? p['車位編號'] ?? '',
      label: formatParkingSpotLabel(p),
      price: parkingTransactionPrice(p),
      areaSqm: Number(p.area) || 0,
    })),
    parkingTotal,
    parkingAreaSqm: parkingSpots.reduce((s, p) => s + (Number(p.area) || 0), 0),

    areas: {
      houseTotalPing: d.area_house_ping,
      houseTotalSqm: d.area_house_sqm,
      mainPing: d.area_main_ping,
      mainSqm: d.area_main_sqm,
      ancillaryPing: d.area_ancillary_ping,
      ancillarySqm: d.area_ancillary_sqm,
      commonPing: d.area_common_ping,
      commonSqm: d.area_common_sqm,
      terracePing: d.area_terrace_ping,
      landSharePing: d.land_share_ping,
      landShareSqm: d.land_share_sqm,
      landShareRatio: d.land_share_ratio,
      commonAreaRatio: d.common_area_ratio,
    },

    salesperson: salespersonNames,
    salespersonText: formatSalespersons(d.salesperson),
    salesPhone,

    accountSections: buildAccountSections(d),
    contractDrawingFolderUrl: d.contractDrawingFolderUrl || '',
  };
}
