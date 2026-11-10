// 排程調價：計算規則（前端 ESM 版本，供建立排程時即時預覽）
// functions 對應檔案：functions/utils/scheduledPricePlan.js（請保持一致；scripts/tests/scheduledPricePlan.test.mjs 會比對兩份輸出）
//
// 規則：
//   - 套用對象在「執行當下」判斷：狀態在勾選清單內（'' 代表空白狀態），可再限定棟別、手動排除特定戶。
//   - 房屋：每坪加價（金額 × 房屋坪數）、每戶加價、百分比（房屋價 × (1 + %)）→ 調整後總價（含露臺）整萬四捨五入，
//     差額由房屋價吸收，露臺價不動；逐戶填價＝直接填房屋價（不含露臺），照填不取整。
//   - 車位：每個加固定金額（依車位形式分開填）→ 整萬四捨五入；逐個填新價照填。
//     空白狀態但已綁定戶別的車位視為已售（舊資料綁定時未同步狀態）。

import { PRICE_GROUPS, toPriceNumber, deriveTotalPrice } from './priceDerive.js';

const HOUSE_MODES = ['perPing', 'perUnit', 'percent', 'manual'];
const PARKING_MODES = ['fixed', 'manual'];
const PRICE_KINDS = ['list', 'floor'];
const KIND_LABEL = { list: '表價', floor: '底價' };
const PARKING_FIELD = { list: 'price_list', floor: 'price_floor' };
const NO_TYPE_KEY = '未填形式';

const round2 = (n) => Math.round(n * 100) / 100;
// 整萬四捨五入；先收斂浮點誤差（1323.4999999 → 1323.5）
const roundWan = (n) => Math.round(Number(n.toFixed(6)));

const text = (v) => (v === null || v === undefined ? '' : String(v).trim());

function householdStatus(unit) {
  return text(unit ? (unit.salesStatus_backend ?? unit.status) : '');
}

function parkingStatus(spot) {
  return text(spot ? spot.status_backend : '');
}

function parkingTypeKey(spot) {
  return text(spot ? spot.type2 : '') || NO_TYPE_KEY;
}

function uniqueTexts(list) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map(v => (v === null || v === undefined ? '' : String(v).trim())))];
}

function cleanAmountMap(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [key, value] of Object.entries(raw)) {
    const id = text(key);
    if (!id || !value || typeof value !== 'object') continue;
    const entry = {};
    for (const kind of PRICE_KINDS) {
      const n = toPriceNumber(value[kind]);
      if (n !== null) entry[kind] = n;
    }
    if (Object.keys(entry).length) out[id] = entry;
  }
  return out;
}

/** 正規化排程設定（前端送出、後端儲存與執行都經過這裡） */
function normalizePriceConfig(config) {
  const c = config && typeof config === 'object' ? config : {};
  const house = c.house && typeof c.house === 'object' ? c.house : {};
  const parking = c.parking && typeof c.parking === 'object' ? c.parking : {};
  const houseMode = HOUSE_MODES.includes(house.mode) ? house.mode : 'perPing';
  const parkingMode = PARKING_MODES.includes(parking.mode) ? parking.mode : 'fixed';
  return {
    statuses: uniqueTexts(c.statuses),
    buildings: uniqueTexts(c.buildings).filter(Boolean),
    excludedUnitIds: uniqueTexts(c.excludedUnitIds).filter(Boolean),
    house: {
      mode: houseMode,
      list: houseMode === 'manual' ? null : toPriceNumber(house.list),
      floor: houseMode === 'manual' ? null : toPriceNumber(house.floor),
      manual: houseMode === 'manual' ? cleanAmountMap(house.manual) : {},
    },
    parking: {
      enabled: parking.enabled === true,
      mode: parkingMode,
      amounts: parkingMode === 'fixed' ? cleanAmountMap(parking.amounts) : {},
      manual: parkingMode === 'manual' ? cleanAmountMap(parking.manual) : {},
      excludedSpotIds: uniqueTexts(parking.excludedSpotIds).filter(Boolean),
    },
  };
}

function isHouseholdTargeted(unit, cfg) {
  if (!unit || !text(unit.unitId)) return false;
  if (!cfg.statuses.includes(householdStatus(unit))) return false;
  if (cfg.buildings.length && !cfg.buildings.includes(text(unit.building))) return false;
  return true;
}

function isParkingTargeted(spot, cfg) {
  if (!spot || !text(spot.spotId)) return false;
  const status = parkingStatus(spot);
  if (!cfg.statuses.includes(status)) return false;
  if (status === '' && text(spot.buyerUnitId)) return false;
  return true;
}

/**
 * 計算單一戶別某一組價格（表價或底價）的新值。
 * @returns {{ change?: object, skip?: string }}
 */
function computeHouseChange(unit, house, kind, unitId) {
  const g = PRICE_GROUPS[kind === 'list' ? 0 : 1];
  const label = KIND_LABEL[kind];
  const current = toPriceNumber(unit[g.only]);
  const terrace = toPriceNumber(unit[g.terrace]) || 0;
  let nextOnly;

  if (house.mode === 'manual') {
    const typed = toPriceNumber(house.manual[unitId] && house.manual[unitId][kind]);
    if (typed === null) return {};
    nextOnly = round2(typed);
  } else {
    const amount = house[kind];
    if (amount === null) return {};
    if (current === null) return { skip: `${label}無原價` };
    let rawTotal;
    if (house.mode === 'perPing') {
      const ping = toPriceNumber(unit.area_house_ping);
      if (ping === null || ping <= 0) return { skip: '無房屋坪數' };
      rawTotal = current + terrace + amount * ping;
    } else if (house.mode === 'perUnit') {
      rawTotal = current + terrace + amount;
    } else {
      rawTotal = current * (1 + amount / 100) + terrace;
    }
    nextOnly = round2(roundWan(rawTotal) - terrace);
  }

  if (nextOnly === current) return {};
  if (nextOnly < 0) return { skip: `${label}調整後小於 0` };
  return {
    change: {
      [g.only]: { from: current, to: nextOnly },
      [g.total]: { from: toPriceNumber(unit[g.total]), to: deriveTotalPrice(nextOnly, unit[g.terrace]) },
    },
  };
}

function computeParkingChange(spot, parking, kind, spotId) {
  const field = PARKING_FIELD[kind];
  const label = KIND_LABEL[kind];
  const current = toPriceNumber(spot[field]);
  let next;
  if (parking.mode === 'manual') {
    const typed = toPriceNumber(parking.manual[spotId] && parking.manual[spotId][kind]);
    if (typed === null) return {};
    next = round2(typed);
  } else {
    const entry = parking.amounts[parkingTypeKey(spot)];
    const amount = entry ? toPriceNumber(entry[kind]) : null;
    if (amount === null) return {};
    if (current === null) return { skip: `${label}無原價` };
    next = roundWan(current + amount);
  }
  if (next === current) return {};
  if (next < 0) return { skip: `${label}調整後小於 0` };
  return { change: { [field]: { from: current, to: next } } };
}

const naturalCompare = (a, b) => String(a).localeCompare(String(b), 'zh-Hant', { numeric: true });

/**
 * 依目前資料計算調價結果（預覽與執行共用）。
 * @returns {{ households: object[], parkings: object[], summary: object }}
 *   households/parkings 每列：{ id, excluded, changes: { 欄位: { from, to } }, skips: string[], ... }
 */
function planPriceUpdate(households, parkings, config) {
  const cfg = normalizePriceConfig(config);
  const excludedUnits = new Set(cfg.excludedUnitIds);
  const excludedSpots = new Set(cfg.parking.excludedSpotIds);

  const houseRows = (Array.isArray(households) ? households : [])
    .filter(unit => isHouseholdTargeted(unit, cfg))
    .map(unit => {
      const unitId = text(unit.unitId);
      const row = {
        id: unitId,
        building: text(unit.building),
        floor: text(unit.floor),
        status: householdStatus(unit),
        area: toPriceNumber(unit.area_house_ping),
        excluded: excludedUnits.has(unitId),
        changes: {},
        skips: [],
      };
      if (!row.excluded) {
        for (const kind of PRICE_KINDS) {
          const r = computeHouseChange(unit, cfg.house, kind, unitId);
          if (r.change) Object.assign(row.changes, r.change);
          if (r.skip) row.skips.push(r.skip);
        }
      }
      return row;
    })
    .sort((a, b) => naturalCompare(a.building, b.building) || naturalCompare(a.id, b.id));

  const parkingRows = !cfg.parking.enabled ? [] : (Array.isArray(parkings) ? parkings : [])
    .filter(spot => isParkingTargeted(spot, cfg))
    .map(spot => {
      const spotId = text(spot.spotId);
      const row = {
        id: spotId,
        type: parkingTypeKey(spot),
        floor: text(spot.floor),
        status: parkingStatus(spot),
        excluded: excludedSpots.has(spotId),
        changes: {},
        skips: [],
      };
      if (!row.excluded) {
        for (const kind of PRICE_KINDS) {
          const r = computeParkingChange(spot, cfg.parking, kind, spotId);
          if (r.change) Object.assign(row.changes, r.change);
          if (r.skip) row.skips.push(r.skip);
        }
      }
      return row;
    })
    .sort((a, b) => naturalCompare(a.id, b.id));

  const changed = rows => rows.filter(r => !r.excluded && Object.keys(r.changes).length > 0).length;
  return {
    households: houseRows,
    parkings: parkingRows,
    summary: {
      unitCount: changed(houseRows),
      parkingCount: changed(parkingRows),
      skipCount: [...houseRows, ...parkingRows].filter(r => r.skips.length > 0).length,
    },
  };
}

function formatAmount(n) {
  const v = round2(n);
  return `${v > 0 ? '+' : ''}${v}`;
}

/** 排程內容一句話摘要（清單、通知共用） */
function describePriceConfig(config) {
  const cfg = normalizePriceConfig(config);
  const parts = [];
  const h = cfg.house;
  if (h.mode === 'manual') {
    const count = Object.keys(h.manual).length;
    if (count) parts.push(`房屋逐戶填價 ${count} 戶`);
  } else {
    const unit = h.mode === 'perPing' ? '萬/坪' : (h.mode === 'perUnit' ? '萬/戶' : '%');
    const kinds = PRICE_KINDS.filter(k => h[k] !== null).map(k => `${KIND_LABEL[k]} ${formatAmount(h[k])}${unit}`);
    if (kinds.length) parts.push(`房屋 ${kinds.join('、')}`);
  }
  const p = cfg.parking;
  if (p.enabled) {
    if (p.mode === 'manual') {
      const count = Object.keys(p.manual).length;
      if (count) parts.push(`車位逐個填價 ${count} 個`);
    } else {
      const amounts = Object.values(p.amounts);
      const kinds = PRICE_KINDS.filter(k => amounts.some(a => a[k] !== undefined)).map(k => {
        const values = [...new Set(amounts.filter(a => a[k] !== undefined).map(a => a[k]))];
        return values.length === 1 ? `${KIND_LABEL[k]} ${formatAmount(values[0])}萬` : `${KIND_LABEL[k]}依形式調整`;
      });
      if (kinds.length) parts.push(`車位 ${kinds.join('、')}`);
    }
  }
  return parts.join('；');
}

/** 設定是否有任何調整內容（全部留空就不能建立排程） */
function hasPriceAdjustment(config) {
  const cfg = normalizePriceConfig(config);
  const h = cfg.house;
  const houseAny = h.mode === 'manual' ? Object.keys(h.manual).length > 0 : (h.list !== null || h.floor !== null);
  const p = cfg.parking;
  const parkingAny = p.enabled && Object.keys(p.mode === 'manual' ? p.manual : p.amounts).length > 0;
  return houseAny || parkingAny;
}

export {
  HOUSE_MODES,
  PARKING_MODES,
  PRICE_KINDS,
  KIND_LABEL,
  PARKING_FIELD,
  NO_TYPE_KEY,
  roundWan,
  householdStatus,
  parkingStatus,
  parkingTypeKey,
  normalizePriceConfig,
  isHouseholdTargeted,
  isParkingTargeted,
  planPriceUpdate,
  describePriceConfig,
  hasPriceAdjustment,
};
