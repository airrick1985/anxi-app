import { projectUnitForQuote } from '@/utils/quoteFieldVisibility';

/**
 * 報價系統共用：把 Firestore salesHouseholds 戶別文件轉成 quoteStore.addItem / item.unitDetails 所需結構。
 * 對齊 UnitDetailModal.handleAddToQuote 與 QuoteUnitPickerDialog 的欄位映射，三處共用同一份。
 *
 * 只保留報價系統需要的欄位（白名單），底價／買方等內部資料不會進入報價單或 sessionStorage；
 * 傳入 project 時再依「報價系統可見欄位」設定（專案預設 + 戶別覆寫）清空被隱藏的欄位。
 *
 * @param {object} u salesHouseholds 文件（含 unitId、price_list_house_total、area_* 等）
 * @param {object} [project] projects/{id} 文件（含 quoteFieldDefaults）
 * @returns {object}
 */
export function toQuoteUnitData(u, project) {
  if (!u) return u;
  const p = projectUnitForQuote(u, project);
  return {
    ...p,
    房屋總表價: p.price_list_house_total,
    戶別: u.unitId,
    area_house_ping: p.area_house_ping === undefined ? undefined : Number(p.area_house_ping),
    area_main_ping: p.area_main_ping,
    area_ancillary_ping: p.area_ancillary_ping,
    area_common_ping: p.area_common_ping,
    area_terrace_ping: p.area_terrace_ping,
    common_area_ratio: p.common_area_ratio,
    area_main_sqm: p.area_main_sqm,
    area_ancillary_sqm: p.area_ancillary_sqm,
    area_common_sqm: p.area_common_sqm,
  };
}
