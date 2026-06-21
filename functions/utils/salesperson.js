// 銷售人員（salesperson / salespersonUserKey）複選共用工具（functions CJS 版本）
// 前端對應檔案：src/utils/salespersonUtils.js（請保持一致）
// Why: salesHouseholds.salesperson 由「單一字串」優化為「可複選陣列」。
//      舊資料是字串、新資料是陣列，後端讀寫需先 normalize 成陣列，確保相容。

/**
 * 正規化為字串陣列。null/字串/逗號分隔字串/陣列皆轉成乾淨陣列（去空白、去重）。
 */
function normalizeSalespersons(value) {
  if (value === null || value === undefined || value === '') return [];
  let arr;
  if (Array.isArray(value)) {
    arr = value;
  } else {
    arr = String(value).split(/[,，]/);
  }
  const cleaned = arr
    .map(v => (v === null || v === undefined ? '' : String(v).trim()))
    .filter(Boolean);
  return [...new Set(cleaned)];
}

/**
 * 格式化為顯示/匯出字串（逗號分隔全部）。
 */
function formatSalespersons(value, sep = '、', emptyText = '') {
  const arr = normalizeSalespersons(value);
  return arr.length ? arr.join(sep) : emptyText;
}

module.exports = { normalizeSalespersons, formatSalespersons };
