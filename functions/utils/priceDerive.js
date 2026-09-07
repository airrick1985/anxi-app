// 表價／底價「總額」衍生規則（functions CJS 版本）
// 前端對應檔案：src/utils/priceDerive.js（請保持一致）
//
// 規則（2026-09 起）：明細為權威，總額一律計算產生
//   房屋總表價 price_list_house_total  = 房屋表價 price_list_house_only  + 露臺表價 price_list_terrace
//   房屋總底價 price_floor_house_total = 房屋底價 price_floor_house_only + 露臺底價 price_floor_terrace
//   露臺單價(表價) price_list_terrace_unit = 露臺表價 ÷ 露臺坪數
//
// Why: 房屋價格經常調整、露臺價格幾乎不動，讓使用者只維護明細，總額不會再與明細打架。
// 註：「其他附屬表價／底價」(price_*_ancillary) 全庫無任何資料，屬歷史孤兒欄位，不納入公式。

const PRICE_GROUPS = [
  { only: 'price_list_house_only', terrace: 'price_list_terrace', total: 'price_list_house_total', label: '表價' },
  { only: 'price_floor_house_only', terrace: 'price_floor_terrace', total: 'price_floor_house_total', label: '底價' },
];

const DERIVED_TOTAL_KEYS = PRICE_GROUPS.map(g => g.total);

function toPriceNumber(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const round2 = (n) => Math.round(n * 100) / 100;

function deriveTotalPrice(only, terrace) {
  const o = toPriceNumber(only);
  const t = toPriceNumber(terrace);
  if (o === null && t === null) return null;
  return round2((o || 0) + (t || 0));
}

function deriveOnlyFromTotal(total, terrace) {
  const T = toPriceNumber(total);
  if (T === null) return null;
  return round2(T - (toPriceNumber(terrace) || 0));
}

function deriveTerraceUnitPrice(terracePrice, terracePing) {
  const ping = toPriceNumber(terracePing);
  const price = toPriceNumber(terracePrice);
  if (ping === null || ping <= 0) return null;
  return Number(((price || 0) / ping).toFixed(2));
}

/**
 * 就地套用衍生欄位。參數與行為與前端版本相同。
 * @returns {{ data: object, changed: string[] }}
 */
function applyDerivedPrices(data, base = {}, options = {}) {
  const changed = [];
  if (!data || typeof data !== 'object') return { data, changed };
  const pick = (key) => (key in data ? data[key] : (base ? base[key] : undefined));

  for (const g of PRICE_GROUPS) {
    const hasDetail = (g.only in data) || (g.terrace in data);
    if (hasDetail) {
      const next = deriveTotalPrice(pick(g.only), pick(g.terrace));
      if (data[g.total] !== next) changed.push(g.total);
      data[g.total] = next;
    } else if (options.backfillFromTotal && (g.total in data)) {
      const next = deriveOnlyFromTotal(data[g.total], pick(g.terrace));
      if (data[g.only] !== next) changed.push(g.only);
      data[g.only] = next;
      data[g.total] = deriveTotalPrice(next, pick(g.terrace));
    } else if (g.total in data) {
      const next = deriveTotalPrice(pick(g.only), pick(g.terrace));
      if (next !== null && data[g.total] !== next) changed.push(g.total);
      if (next !== null) data[g.total] = next;
    }
  }

  if ('price_list_terrace' in data || 'area_terrace_ping' in data) {
    const next = deriveTerraceUnitPrice(pick('price_list_terrace'), pick('area_terrace_ping'));
    if (next !== null && data.price_list_terrace_unit !== next) {
      data.price_list_terrace_unit = next;
      changed.push('price_list_terrace_unit');
    }
  }

  return { data, changed };
}

module.exports = {
  PRICE_GROUPS,
  DERIVED_TOTAL_KEYS,
  toPriceNumber,
  deriveTotalPrice,
  deriveOnlyFromTotal,
  deriveTerraceUnitPrice,
  applyDerivedPrices,
};
