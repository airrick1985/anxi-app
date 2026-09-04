/**
 * 報價系統共用：把 Firestore salesHouseholds 戶別文件轉成 quoteStore.addItem / item.unitDetails 所需結構。
 * 對齊 UnitDetailModal.handleAddToQuote 與 QuoteUnitPickerDialog 的欄位映射，三處共用同一份。
 * @param {object} u salesHouseholds 文件（含 unitId、price_list_house_total、area_* 等）
 * @returns {object}
 */
export function toQuoteUnitData(u) {
  if (!u) return u;
  return {
    ...u,
    房屋總表價: u.price_list_house_total,
    戶別: u.unitId,
    area_house_ping: Number(u.area_house_ping),
    area_main_ping: u.area_main_ping,
    area_ancillary_ping: u.area_ancillary_ping,
    area_common_ping: u.area_common_ping,
    area_terrace_ping: u.area_terrace_ping,
    common_area_ratio: u.common_area_ratio,
    area_main_sqm: u.area_main_sqm,
    area_ancillary_sqm: u.area_ancillary_sqm,
    area_common_sqm: u.area_common_sqm,
  };
}
