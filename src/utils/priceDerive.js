// 表價／底價「總額」衍生規則（單一真相）
// functions 對應檔案：functions/utils/priceDerive.js（請保持一致）
//
// 規則（2026-09 起）：明細為權威，總額一律計算產生
//   房屋總表價 price_list_house_total  = 房屋表價 price_list_house_only  + 露臺表價 price_list_terrace
//   房屋總底價 price_floor_house_total = 房屋底價 price_floor_house_only + 露臺底價 price_floor_terrace
//   露臺單價(表價) price_list_terrace_unit = 露臺表價 ÷ 露臺坪數
//
// Why: 房屋價格經常調整、露臺價格幾乎不動，讓使用者只維護明細，總額不會再與明細打架。
// 註：「其他附屬表價／底價」(price_*_ancillary) 全庫無任何資料，屬歷史孤兒欄位，不納入公式；
//     欄位本身保留（匯入匯出相容），若日後啟用需同步修改本檔與 functions 版本。

/** 表價／底價兩組欄位對應 */
export const PRICE_GROUPS = [
  { only: 'price_list_house_only', terrace: 'price_list_terrace', total: 'price_list_house_total', label: '表價' },
  { only: 'price_floor_house_only', terrace: 'price_floor_terrace', total: 'price_floor_house_total', label: '底價' },
];

/** 由明細衍生總額的欄位（這些欄位不應該再由使用者直接輸入） */
export const DERIVED_TOTAL_KEYS = PRICE_GROUPS.map(g => g.total);

/** 空值（null / undefined / '' / 非數字）一律回 null，其餘回 Number */
export function toPriceNumber(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * 總額 = 房屋 + 露臺。兩者皆空 → null（代表未設定，不要寫成 0）。
 */
export function deriveTotalPrice(only, terrace) {
  const o = toPriceNumber(only);
  const t = toPriceNumber(terrace);
  if (o === null && t === null) return null;
  return round2((o || 0) + (t || 0));
}

/**
 * 反推：已知總額與露臺價，回推房屋價。
 * 供「Excel 只提供總表價、未提供房屋表價」與既有資料回填腳本使用。
 */
export function deriveOnlyFromTotal(total, terrace) {
  const T = toPriceNumber(total);
  if (T === null) return null;
  return round2(T - (toPriceNumber(terrace) || 0));
}

/** 露臺單價(表價) = 露臺表價 ÷ 露臺坪數；無露臺坪數回 null */
export function deriveTerraceUnitPrice(terracePrice, terracePing) {
  const ping = toPriceNumber(terracePing);
  const price = toPriceNumber(terracePrice);
  if (ping === null || ping <= 0) return null;
  return Number(((price || 0) / ping).toFixed(2));
}

/**
 * 就地套用衍生欄位到一份戶別資料。
 *
 * @param {object} data  要寫入 Firestore 的資料（可為部分欄位）
 * @param {object} base  該戶既有資料（部分欄位更新時用來補齊未提供的明細）
 * @param {object} options
 *   - backfillFromTotal: 只提供總額、未提供明細時，反推房屋價（Excel 匯入用；表單不需要）
 * @returns {{ data: object, changed: string[] }} changed = 本次被系統改寫的欄位
 */
export function applyDerivedPrices(data, base = {}, options = {}) {
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
      // 檔案只給總額 → 視為要調整房屋價，回推明細後總額維持不變
      const next = deriveOnlyFromTotal(data[g.total], pick(g.terrace));
      if (data[g.only] !== next) changed.push(g.only);
      data[g.only] = next;
      data[g.total] = deriveTotalPrice(next, pick(g.terrace));
    } else if (g.total in data) {
      // 沒有明細可依據（也未開啟反推）：總額不是可信輸入，改以既有明細重算，避免寫入手打的總額
      const next = deriveTotalPrice(pick(g.only), pick(g.terrace));
      if (next !== null && data[g.total] !== next) changed.push(g.total);
      if (next !== null) data[g.total] = next;
    }
  }

  // 露臺單價(表價)：露臺表價或露臺坪數任一異動就重算
  if ('price_list_terrace' in data || 'area_terrace_ping' in data) {
    const next = deriveTerraceUnitPrice(pick('price_list_terrace'), pick('area_terrace_ping'));
    if (next !== null && data.price_list_terrace_unit !== next) {
      data.price_list_terrace_unit = next;
      changed.push('price_list_terrace_unit');
    }
  }

  return { data, changed };
}
