/**
 * 報價系統可見欄位：專案預設 + 戶別覆寫
 *
 * 資料位置
 *  - projects/{id}.quoteFieldDefaults            { [key]: boolean }   專案預設（缺省時用 BUILTIN_DEFAULTS）
 *  - salesHouseholds/{id}.quoteFieldOverrides    { [key]: boolean }   只存與專案預設不同的鍵
 *
 * 生效值 = BUILTIN_DEFAULTS → 專案預設 → 戶別覆寫
 * 底價／成交／買方／繳款／銀行等內部欄位不在清單內，報價模式永遠不會顯示。
 */

export const QUOTE_FIELD_GROUPS = [
  {
    key: 'price',
    title: '價格',
    icon: 'mdi-cash-multiple',
    items: [
      { key: 'priceTotal', label: '房屋總價', hint: '隱藏時顯示「面議」，並不可加入報價單' },
      { key: 'unitPrice', label: '房屋單價' },
      { key: 'priceSplit', label: '露臺拆分明細' },
      { key: 'priceRemarks', label: '價格備註' },
    ],
  },
  {
    key: 'area',
    title: '面積',
    icon: 'mdi-floor-plan',
    items: [
      { key: 'areaTotal', label: '房屋總面積' },
      { key: 'areaTerrace', label: '露臺坪數' },
      { key: 'areaDetail', label: '面積明細', hint: '主建物／附屬／共用／公設比' },
      { key: 'landShare', label: '土地持分' },
    ],
  },
  {
    key: 'other',
    title: '其他',
    icon: 'mdi-dots-horizontal-circle-outline',
    items: [
      { key: 'preferredPayment', label: '優付' },
      { key: 'unitTags', label: '文字標籤' },
      { key: 'layoutType', label: '格局／類型' },
      { key: 'images', label: '戶別圖片' },
      { key: 'plans', label: '可選方案' },
    ],
  },
];

export const QUOTE_FIELD_ITEMS = QUOTE_FIELD_GROUPS.flatMap(g => g.items);
export const QUOTE_FIELD_KEYS = QUOTE_FIELD_ITEMS.map(i => i.key);

/** 內建預設：除「優付」沿用舊行為（預設關閉）外，其餘皆顯示 */
export const BUILTIN_DEFAULTS = Object.freeze(
  Object.fromEntries(QUOTE_FIELD_KEYS.map(k => [k, k !== 'preferredPayment']))
);

const pickBooleans = (obj) => {
  const out = {};
  if (!obj || typeof obj !== 'object') return out;
  for (const k of QUOTE_FIELD_KEYS) {
    if (typeof obj[k] === 'boolean') out[k] = obj[k];
  }
  return out;
};

/**
 * 專案預設（完整鍵值）。舊欄位 showPreferredPaymentInQuote 仍作為「優付」的後備來源。
 * @param {object|null} project projects/{id} 文件
 */
export function getProjectQuoteDefaults(project) {
  const base = { ...BUILTIN_DEFAULTS };
  if (project && typeof project.showPreferredPaymentInQuote === 'boolean') {
    base.preferredPayment = project.showPreferredPaymentInQuote;
  }
  return { ...base, ...pickBooleans(project?.quoteFieldDefaults) };
}

/** 戶別覆寫（只含合法鍵） */
export function getUnitQuoteOverrides(unit) {
  return pickBooleans(unit?.quoteFieldOverrides);
}

/** 戶別是否有任何與專案預設不同的覆寫 */
export function hasQuoteOverrides(unit, project) {
  const defaults = getProjectQuoteDefaults(project);
  const ov = getUnitQuoteOverrides(unit);
  return Object.keys(ov).some(k => ov[k] !== defaults[k]);
}

/**
 * 生效的可見性（完整鍵值）
 * @returns {{[key:string]: boolean}}
 */
export function getEffectiveQuoteFields(unit, project) {
  return { ...getProjectQuoteDefaults(project), ...getUnitQuoteOverrides(unit) };
}

export function isQuoteFieldVisible(unit, project, key) {
  return getEffectiveQuoteFields(unit, project)[key] !== false;
}

/**
 * 由「完整生效值」算回應存進戶別的覆寫物件：只留與專案預設不同的鍵。
 */
export function diffOverrides(effective, project) {
  const defaults = getProjectQuoteDefaults(project);
  const out = {};
  for (const k of QUOTE_FIELD_KEYS) {
    if (typeof effective[k] === 'boolean' && effective[k] !== defaults[k]) out[k] = effective[k];
  }
  return out;
}

/* ----------------------------------------------------------
 * 報價單資料投影：只保留報價系統需要的欄位，並依可見性清空
 * ---------------------------------------------------------- */

/** 報價單（quoteStore.item.unitDetails）允許攜帶的原始欄位 */
export const QUOTE_UNIT_WHITELIST = [
  'id', 'projectId', 'unitId', 'building', 'floor',
  'propertyType', 'layout',
  'salesStatus_quote',
  'isPreferredPayment', 'isFirstTimeBuyer', 'contractType',
  'area_house_ping', 'area_house_sqm',
  'area_main_ping', 'area_main_sqm',
  'area_ancillary_ping', 'area_ancillary_sqm',
  'area_common_ping', 'area_common_sqm',
  'area_terrace_ping', 'common_area_ratio',
  'land_share_ping', 'land_share_sqm', 'land_share_ratio',
  'price_list_house_total', 'price_list_house_only', 'price_list_terrace', 'price_list_terrace_unit', 'price_list_ancillary',
  'price_package_deal', 'price_package',
  'priceRemarks', 'priceRemarkImages',
  'unitTags', 'unitEffect', 'salesImages', 'availablePlans', 'svgName',
  '配套價格', '配套價',
];

/** 各可見性鍵對應要清空的原始欄位 */
const FIELD_KEYS_BY_TOGGLE = {
  priceTotal: ['price_list_house_total', 'price_list_house_only', 'price_list_terrace', 'price_list_terrace_unit', 'price_list_ancillary', 'price_package_deal', 'price_package', '配套價格', '配套價'],
  priceSplit: ['price_list_house_only', 'price_list_terrace', 'price_list_terrace_unit'],
  priceRemarks: ['priceRemarks', 'priceRemarkImages'],
  areaTotal: ['area_house_ping', 'area_house_sqm'],
  areaTerrace: ['area_terrace_ping'],
  areaDetail: ['area_main_ping', 'area_main_sqm', 'area_ancillary_ping', 'area_ancillary_sqm', 'area_common_ping', 'area_common_sqm', 'common_area_ratio'],
  landShare: ['land_share_ping', 'land_share_sqm', 'land_share_ratio'],
  preferredPayment: ['isPreferredPayment'],
  unitTags: ['unitTags', 'unitEffect'],
  layoutType: ['layout', 'propertyType'],
  images: ['salesImages', 'svgName'],
  plans: ['availablePlans'],
};

/**
 * 把戶別文件投影成報價系統可攜帶的物件：白名單 + 依可見性清空。
 * 未傳 project 時只做白名單（不做可見性判斷）。
 */
export function projectUnitForQuote(unit, project) {
  if (!unit) return unit;
  const out = {};
  for (const k of QUOTE_UNIT_WHITELIST) {
    if (unit[k] !== undefined) out[k] = unit[k];
  }
  if (project !== undefined) {
    const eff = getEffectiveQuoteFields(unit, project);
    for (const [toggle, keys] of Object.entries(FIELD_KEYS_BY_TOGGLE)) {
      if (eff[toggle] === false) keys.forEach(k => { delete out[k]; });
    }
    out.quoteFieldsEffective = eff;
  }
  return out;
}
