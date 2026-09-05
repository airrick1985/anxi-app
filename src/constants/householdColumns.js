/**
 * 戶別資料欄位權威定義（自 SalesControlSystem.vue 抽出，供銷控頁匯出／資料透視／指定戶別下載
 * 與「銷售圖面編輯器」資訊卡欄位選擇共用）。
 *
 * - COLUMN_DEFINITIONS：salesHouseholds 原始欄位（Excel 上傳／下載欄位順序即此順序）
 * - UNIT_EXPORT_COMPUTED_COLUMNS：前端計算欄位（tableItems 加算的值）
 */
export const COLUMN_DEFINITIONS = [
    { key: 'building', title: '棟別' },
    { key: 'floor', title: '樓層' },
    { key: 'unitId', title: '戶別' },
    { key: 'propertyType', title: '物件類型' },
    { key: 'layout', title: '格局' },
    { key: 'isPreferredPayment', title: '優付' },
    { key: 'salesStatus_backend', title: '銷控後台狀態' },
    { key: 'salesStatus_quote', title: '報價系統狀態' },
    { key: 'buyerName', title: '買方姓名' },
    { key: 'buyerPhone', title: '買方電話' },
    { key: 'buyerIdNumber', title: '身分證(驗證碼)' },
    { key: 'buyerDateOfBirth', title: '出生年月日' },
    { key: 'buyerEmail', title: 'EMAIL' },
    { key: 'buyerMailingAddressCity', title: '通訊地址_縣市' },
    { key: 'buyerMailingAddressDistrict', title: '通訊地址_區域' },
    { key: 'buyerMailingAddressDetail', title: '通訊地址_詳細' },
    { key: 'buyerPermanentAddressCity', title: '戶籍地址_縣市' },
    { key: 'buyerPermanentAddressDistrict', title: '戶籍地址_區域' },
    { key: 'buyerPermanentAddressDetail', title: '戶籍地址_詳細' },
    { key: 'buyerGender', title: '性別' },
    { key: 'buyerMaritalStatus', title: '婚姻狀況' },
    { key: 'buyerOccupationIndustry', title: '行業別' },
    { key: 'buyerOccupationTitle', title: '職務' },
    { key: 'buyerPurchasePurpose', title: '購買用途' },
    { key: 'buyerHasPurchasedFuyu', title: '已購買富宇房子' },
    { key: 'buyerEmergencyContactName', title: '緊急聯絡人' },
    { key: 'buyerEmergencyContactPhone', title: '緊急聯絡人電話' },
    { key: 'buyerEmergencyContactRelationship', title: '緊急聯絡人關係' },
    { key: 'referrerName', title: '介紹人姓名' },
    { key: 'referrerPhone', title: '介紹人電話' },
    { key: 'salesperson', title: '銷售人員' },
    { key: 'salespersonUserKey', title: '銷售人員userKey' },
    { key: 'contractType', title: '合約方式' },
    { key: 'isFirstTimeBuyer', title: '是否首購' },
    { key: 'area_house_sqm', title: '房屋面積(平方公尺)' },
    { key: 'area_house_ping', title: '房屋面積(坪)' },
    { key: 'area_main_sqm', title: '主建物面積(平方公尺)' },
    { key: 'area_main_ping', title: '主建物面積(坪)' },
    { key: 'area_ancillary_sqm', title: '附屬建物面積(平方公尺)' },
    { key: 'area_ancillary_ping', title: '附屬建物面積(坪)' },
    { key: 'area_common_sqm', title: '共用部分面積(平方公尺)' },
    { key: 'area_common_ping', title: '共用部分面積(坪)' },
    { key: 'area_terrace_ping', title: '露臺(坪)' },
    { key: 'common_area_ratio', title: '公設比' },
    { key: 'land_share_sqm', title: '土地持分面積(平方公尺)' },
    { key: 'land_share_ping', title: '土地持分面積(坪)' },
    { key: 'land_share_ratio', title: '土地持分' },
    { key: 'price_list_house_only', title: '房屋表價' },
    { key: 'price_list_terrace', title: '露臺表價' },
    { key: 'price_list_terrace_unit', title: '露臺單價(表價)' },
    { key: 'price_list_ancillary', title: '其他附屬表價' },
    { key: 'price_list_house_total', title: '房屋總表價' },
    { key: 'price_floor_house_only', title: '房屋底價' },
    { key: 'price_floor_terrace', title: '露臺底價' },
    { key: 'price_floor_ancillary', title: '其他附屬底價' },
    { key: 'price_floor_house_total', title: '房屋總底價' },
    { key: 'price_transaction_house', title: '房屋成交價' },
    { key: 'housePriceRatio', title: '房屋價款比例(%)' },
    { key: 'landPriceRatio', title: '土地價款比例(%)' },
    { key: 'price_package_deal', title: '配套房屋總價' },
    { key: 'price_package', title: '配套價格' },
   { key: 'landBankName', title: '土地款匯款銀行' },
    { key: 'landBankAccount', title: '土地款匯款帳號' },
    { key: 'landBankAccountName', title: '土地款戶名' },
    { key: 'houseBankName', title: '房屋款匯款銀行' },
    { key: 'houseBankAccount', title: '房屋款匯款帳號' },
    { key: 'houseBankAccountName', title: '房屋款戶名' },
    { key: 'packageBankName', title: '配套款匯款銀行' },
    { key: 'packageBankAccount', title: '配套款匯款帳號' },
    { key: 'packageBankAccountName', title: '配套款戶名' },
    { key: 'constructionMethod', title: '興建方式' },
    
    { key: 'payment_deposit_date', title: '小訂日期' },
    { key: 'payment_supplement_date', title: '補足日期' },
    { key: 'payment_contract_date', title: '簽約日期' },
    { key: 'payment_deposit_amount', title: '小訂金額' },
    { key: 'payment_supplement_amount', title: '補足金額' },
    { key: 'payment_contract_amount', title: '簽約金額' },
    { key: 'reportNo', title: '申報書序號' },
    { key: 'remarks', title: '備註' },
    // ✅ [新增] 文字標籤：Firestore 存 unitTags 陣列，Excel 拆成三欄逗號分隔、依索引對齊
    { key: 'unitTags_text', title: '文字標籤' },
    { key: 'unitTags_bgColor', title: '標籤顏色' },
    { key: 'unitTags_textColor', title: '文字顏色' },
    { key: 'availablePlans', title: '可選方案' },
    { key: 'salesImages', title: '戶別圖片' },
    { key: 'svgName', title: 'SVG圖檔' },
    { key: 'driveFolderUrl', title: '戶別資料夾位置' },
    { key: 'contractDrawingFolderUrl', title: '合約分戶圖位置' },
];

// 「下載指定戶別資料」對話框：前端計算欄位（tableItems 加算的值）
export const UNIT_EXPORT_COMPUTED_COLUMNS = [
    { key: 'parking_spots', title: '車位編號' },
    { key: 'parking_count', title: '車位數量' },
    { key: 'parking_trans_total', title: '車位成交合計' },
    { key: 'parking_floor_total', title: '車位底價合計' },
    { key: 'total_transaction', title: '成交總價(含車位)' },
    { key: 'total_floor', title: '合計底價(含車位)' },
    { key: 'price_diff', title: '溢差價' },
    { key: 'unit_price_list', title: '表價單價' },
    { key: 'unit_price_floor', title: '底價單價' },
    { key: 'unit_price_transaction', title: '成交單價' },
    { key: 'paid_total', title: '已繳款金額(萬)' },
    { key: 'payment_ratio', title: '繳款比例(%)' },
];

/* ==========================================================
 * 銷售圖面編輯器：資訊卡欄位選擇用的分群／排除／簡短標籤定義
 * ========================================================== */

/** 不適合顯示在圖面上的欄位（系統用途／檔案位置／顏色碼） */
export const DRAWING_EXCLUDED_FIELD_KEYS = new Set([
  'salespersonUserKey', 'salesImages', 'svgName', 'driveFolderUrl', 'contractDrawingFolderUrl',
  'unitTags_bgColor', 'unitTags_textColor',
]);

/**
 * 欄位分群（依序顯示）。internal=true 的群組預設收合並標示「內部資料」。
 * 未列入任何群組的欄位自動歸入「其他」。
 */
export const DRAWING_FIELD_GROUPS = [
  { key: 'basic', title: '基本', expanded: true, keys: [
    'building', 'floor', 'unitId', 'propertyType', 'layout', 'salesStatus_backend', 'salesStatus_quote',
  ] },
  { key: 'area', title: '面積', expanded: true, keys: [
    'area_house_ping', 'area_house_sqm', 'area_main_ping', 'area_main_sqm', 'area_ancillary_ping', 'area_ancillary_sqm',
    'area_common_ping', 'area_common_sqm', 'area_terrace_ping', 'common_area_ratio',
    'land_share_ping', 'land_share_sqm', 'land_share_ratio',
  ] },
  { key: 'listPrice', title: '表價', expanded: true, keys: [
    'price_list_house_total', 'price_list_house_only', 'price_list_terrace', 'price_list_terrace_unit',
    'price_list_ancillary', 'price_package', 'unit_price_list',
  ] },
  { key: 'floorPrice', title: '內部：底價／成交', expanded: false, internal: true, keys: [
    'price_floor_house_total', 'price_floor_house_only', 'price_floor_terrace', 'price_floor_ancillary',
    'price_transaction_house', 'price_package_deal', 'housePriceRatio', 'landPriceRatio',
    'unit_price_floor', 'unit_price_transaction', 'parking_trans_total', 'parking_floor_total',
    'total_transaction', 'total_floor', 'price_diff',
  ] },
  { key: 'buyer', title: '內部：買方資料', expanded: false, internal: true, keys: [
    'buyerName', 'buyerPhone', 'buyerIdNumber', 'buyerDateOfBirth', 'buyerEmail',
    'buyerMailingAddressCity', 'buyerMailingAddressDistrict', 'buyerMailingAddressDetail',
    'buyerPermanentAddressCity', 'buyerPermanentAddressDistrict', 'buyerPermanentAddressDetail',
    'buyerGender', 'buyerMaritalStatus', 'buyerOccupationIndustry', 'buyerOccupationTitle',
    'buyerPurchasePurpose', 'buyerHasPurchasedFuyu', 'buyerEmergencyContactName',
    'buyerEmergencyContactPhone', 'buyerEmergencyContactRelationship', 'referrerName', 'referrerPhone',
  ] },
  { key: 'payment', title: '內部：付款／銀行', expanded: false, internal: true, keys: [
    'payment_deposit_date', 'payment_supplement_date', 'payment_contract_date',
    'payment_deposit_amount', 'payment_supplement_amount', 'payment_contract_amount',
    'paid_total', 'payment_ratio',
    'landBankName', 'landBankAccount', 'landBankAccountName', 'houseBankName', 'houseBankAccount',
    'houseBankAccountName', 'packageBankName', 'packageBankAccount', 'packageBankAccountName',
  ] },
  { key: 'other', title: '其他', expanded: false, keys: [] },
];

/** 圖面上常用的簡短標籤（預設開啟「使用簡短名稱」時取代欄位 title） */
export const DRAWING_SHORT_LABELS = {
  area_house_ping: '房屋面積',
  area_house_sqm: '房屋面積(m²)',
  area_main_ping: '主建物',
  area_main_sqm: '主建物(m²)',
  area_ancillary_ping: '附屬建物',
  area_ancillary_sqm: '附屬建物(m²)',
  area_common_ping: '共用部分',
  area_common_sqm: '共用部分(m²)',
  area_terrace_ping: '露臺',
  land_share_ping: '土地持分',
  land_share_sqm: '土地持分(m²)',
  price_list_house_total: '房屋總價',
  price_list_house_only: '房屋表價',
  price_list_terrace: '露臺表價',
  price_list_terrace_unit: '露臺單價',
  price_list_ancillary: '附屬表價',
  price_floor_house_total: '房屋總底價',
  price_transaction_house: '成交價',
  salesStatus_backend: '狀態',
  salesStatus_quote: '報價狀態',
  unit_price_list: '單價',
  payment_contract_date: '簽約日',
  payment_deposit_date: '小訂日',
  payment_supplement_date: '補足日',
};

/** 圖面欄位選擇器用：所有可選欄位（原始 + 計算）依群組整理 */
export function buildDrawingFieldGroups() {
  const all = [...COLUMN_DEFINITIONS, ...UNIT_EXPORT_COMPUTED_COLUMNS]
    .filter(c => !DRAWING_EXCLUDED_FIELD_KEYS.has(c.key));
  const byKey = new Map(all.map(c => [c.key, c]));
  const used = new Set();
  const groups = DRAWING_FIELD_GROUPS.map(g => {
    const fields = g.keys.map(k => byKey.get(k)).filter(Boolean);
    fields.forEach(f => used.add(f.key));
    return { ...g, fields };
  });
  const other = groups.find(g => g.key === 'other');
  other.fields = all.filter(c => !used.has(c.key));
  return groups.filter(g => g.fields.length > 0);
}

/** 圖面上是否屬於「內部資料」欄位（匯出前提示用） */
export function isDrawingInternalField(fieldKey) {
  return DRAWING_FIELD_GROUPS.some(g => g.internal && g.keys.includes(fieldKey));
}
