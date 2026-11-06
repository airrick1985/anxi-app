// 退戶紀錄的車位清單
// 後端對應檔案：functions/utils/cancelledParking.js（請保持一致）
import { isDealParking } from './salesStatusGroups.js';

const asArray = value => (Array.isArray(value) ? value : []);
const isBlank = value => value === undefined || value === null || String(value).trim() === '';

function pick(source, ...keys) {
  for (const key of keys) {
    if (!isBlank(source[key])) return source[key];
  }
  return null;
}

// 車位文件用英文欄位，「持有車位」快照可能只有中文別名，舊快照甚至只存編號字串
export function normalizeParking(raw) {
  const source = typeof raw === 'string' ? { spotId: raw } : (raw || {});
  return {
    spotId: String(pick(source, 'spotId', '車位編號') ?? '').trim(),
    floor: pick(source, 'floor') ?? '',
    type: pick(source, 'type', '車位類型') ?? '',
    type2: pick(source, 'type2', '車位形式') ?? '',
    size: pick(source, 'size', '車位尺寸') ?? '',
    price_list: pick(source, 'price_list', '車位表價'),
    price_floor: pick(source, 'price_floor', '車位底價'),
    price_transaction: pick(source, 'price_transaction', '車位成交價'),
    status: pick(source, 'status') ?? '',
    status_backend: pick(source, 'status_backend') ?? '',
  };
}

/**
 * 退戶紀錄要顯示的車位。
 * parkingData：退戶時還綁在本戶，也是復原時寫回的來源。
 * parkingMovedOut：退戶前已轉到別戶（換戶），只留紀錄，復原時不搶回；舊紀錄沒有這個欄位，改用「持有車位」快照補。
 * countsToDeal：是否計入成交總價。快照上的車位是當時儲存的成交車位，原成交總價含這些車位，一律計入（車位狀態可能事後才改）；
 * 其餘依銷控的成交車位規則，準備購買的車位只列出不計入。
 */
export function resolveCancelledParkings(doc) {
  if (!doc) return [];
  const { projectId, unitId, salesStatus_backend: unitStatus } = doc;
  const snapshot = asArray(doc['持有車位']);
  const snapshotSpots = new Set(snapshot.map(raw => normalizeParking(raw).spotId));
  const seen = new Set();
  const list = [];
  const add = (raw, movedOut) => {
    // 舊版退戶查詢沒有限定建案，備份可能含其他建案的車位
    if (raw?.projectId && projectId && raw.projectId !== projectId) return;
    const parking = normalizeParking(raw);
    if (!parking.spotId || seen.has(parking.spotId)) return;
    seen.add(parking.spotId);
    list.push({
      ...parking,
      movedOut,
      movedToUnitId: (movedOut && raw?.movedToUnitId) || '',
      countsToDeal: snapshotSpots.has(parking.spotId) || isDealParking({ ...parking, buyerUnitId: unitId }, unitId, unitStatus),
    });
  };
  asArray(doc.parkingData).forEach(raw => add(raw, false));
  const movedOut = Array.isArray(doc.parkingMovedOut) ? doc.parkingMovedOut : snapshot;
  movedOut.forEach(raw => add(raw, true));
  return list;
}
