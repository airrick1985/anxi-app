// 銷售人員（salesperson / salespersonUserKey）複選共用工具
// Why: salesHouseholds.salesperson 由「單一字串」優化為「可複選陣列」。
//      舊資料是字串、新資料是陣列，所有讀取端需先 normalize 成陣列再處理，
//      確保資料遷移前後皆相容，不會因型別不一致而出錯。

/**
 * 將 salesperson / salespersonUserKey 正規化為字串陣列。
 * 相容：null/undefined → []、字串「張三」→ ["張三"]、
 *       逗號分隔字串「張三,李四」→ ["張三","李四"]、陣列原樣去空白去重。
 * @param {*} value
 * @returns {string[]}
 */
export function normalizeSalespersons(value) {
  if (value === null || value === undefined || value === '') return [];
  let arr;
  if (Array.isArray(value)) {
    arr = value;
  } else {
    // 字串：以逗號（半形/全形）分隔，相容舊單人字串與可能的多人字串
    arr = String(value).split(/[,，]/);
  }
  const cleaned = arr
    .map(v => (v === null || v === undefined ? '' : String(v).trim()))
    .filter(Boolean);
  // 去重（保留順序）
  return [...new Set(cleaned)];
}

/**
 * 將 salesperson 陣列格式化為顯示字串（逗號分隔全部）。
 * @param {*} value
 * @param {string} sep 分隔符，預設「、」
 * @param {string} emptyText 空值顯示，預設 '-'
 * @returns {string}
 */
export function formatSalespersons(value, sep = '、', emptyText = '-') {
  const arr = normalizeSalespersons(value);
  return arr.length ? arr.join(sep) : emptyText;
}

/**
 * 判斷某戶的 salesperson 是否與所選篩選人員有交集。
 * 用於銷控/分析的多選篩選。
 * @param {*} value 該戶 salesperson（字串或陣列）
 * @param {string[]} selected 已選篩選人員名稱陣列
 * @returns {boolean}
 */
export function salespersonsIntersect(value, selected) {
  if (!Array.isArray(selected) || selected.length === 0) return true;
  const arr = normalizeSalespersons(value);
  if (arr.length === 0) return false;
  return arr.some(name => selected.includes(name));
}

/**
 * 判斷某戶 salesperson 是否包含指定人員（單人比對用）。
 * 取代舊有的 `h.salesperson === person.name`。
 * @param {*} value
 * @param {string} name
 * @returns {boolean}
 */
export function salespersonsInclude(value, name) {
  if (!name) return false;
  return normalizeSalespersons(value).includes(name);
}

/**
 * 一戶平均分配給每位 salesperson 的戶數權重 = 1 / 人數。
 * 用於「按業務統計戶數」採平均分配制。
 * 無業務時回傳 0。
 * @param {*} value
 * @returns {number}
 */
export function salespersonShare(value) {
  const n = normalizeSalespersons(value).length;
  return n > 0 ? 1 / n : 0;
}
