// 戶別車位加算欄位（銷控列表、匯出、資料透視、銷售圖面共用）
// - 成交車位：綁定本戶且後台狀態為小訂／補足／簽約（或空白），計入成交總價／合計底價
// - 加購或保留車位：綁定本戶但後台狀態為保留等準備購買狀態，獨立成 held_parking_* 欄位，不計入成交金額
import { isPreparatoryParkingStatus } from '@/utils/salesStatusGroups';
import { toDateKey } from '@/composables/useParkingRatio';

const spotIdOf = (p) => String(p?.spotId ?? '').trim();
const naturalCompare = (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
const sumOf = (list, pick) => list.reduce((s, p) => s + (Number(pick(p)) || 0), 0);
const uniqueJoin = (values) => [...new Set(values.map(v => String(v ?? '').trim()).filter(Boolean))].join(',');

/** 取綁定某戶的所有車位（不分成交／準備購買；戶別比對忽略前後空白） */
export function getUnitBoundParkings(unitId, parkings) {
  const key = String(unitId ?? '').trim();
  if (!key) return [];
  return (Array.isArray(parkings) ? parkings : []).filter((p) => p && String(p.buyerUnitId ?? '').trim() === key);
}

/**
 * @param {Array} dealSpots - 本戶成交車位
 * @param {Array} boundSpots - 綁定本戶的所有車位（從中取出加購或保留車位）
 */
export function unitParkingFields(dealSpots, boundSpots) {
  const deal = Array.isArray(dealSpots) ? dealSpots : [];
  const held = (Array.isArray(boundSpots) ? boundSpots : [])
    .filter(p => p && isPreparatoryParkingStatus(p.status_backend))
    .sort((a, b) => naturalCompare(spotIdOf(a), spotIdOf(b)));
  return {
    parking_spots: deal.map(spotIdOf).filter(Boolean).sort(naturalCompare).join(','),
    parking_count: deal.length,
    parking_trans_total: sumOf(deal, p => p.price_transaction),
    parking_floor_total: sumOf(deal, p => p.price_floor),
    // 加購或保留車位：編號加註銷控後台狀態（如 B6-28(保留)）；底價／成交與戶別資訊「加購或保留車位」區塊同口徑
    held_parking_spots: held.filter(spotIdOf).map(p => `${spotIdOf(p)}(${String(p.status_backend).trim()})`).join(','),
    held_parking_count: held.length,
    held_parking_list_total: sumOf(held, p => p.price_list),
    held_parking_floor_total: sumOf(held, p => p.price_floor || p['底價'] || p['車位底價']),
    held_parking_trans_total: sumOf(held, p => p.price_transaction ?? (p.price_list || p['表價'])),
    held_parking_reserved_by: uniqueJoin(held.map(p => p.reservedBy)),
    held_parking_reserved_until: uniqueJoin(held.map(p => toDateKey(p.reservedUntil)).sort()),
  };
}
