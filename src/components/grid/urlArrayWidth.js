/**
 * UrlArrayRenderer 欄寬：依最長檔名計算，讓檔名完整顯示不截斷
 * 只有單一檔案時檔名直接顯示在格子裡（多個檔案是「查看報告」下拉選單）。
 */

// 檔名以外的寬度：PDF 圖示、按鈕內距、已下載／刪除按鈕、儲存格左右內距
const EXTRA_WIDTH = 170;

// 與格子內檔名相同：v-btn size="small" 12px、字重 500，字型沿用 ag-theme-alpine
const NAME_FONT = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Oxygen-Sans", Ubuntu, Cantarell, "Helvetica Neue", sans-serif';

let ctx = null;

function measure(text) {
  if (typeof document === 'undefined') return String(text).length * 12;
  if (!ctx) {
    ctx = document.createElement('canvas').getContext('2d');
    ctx.font = NAME_FONT;
  }
  return ctx.measureText(String(text)).width;
}

const validFiles = (value) => (Array.isArray(value)
  ? value.filter(f => f && typeof f.name === 'string' && typeof f.url === 'string')
  : []);

/**
 * @param {object[]} rows
 * @param {string} field 檔案陣列欄位
 * @param {number} minWidth
 */
export function urlArrayColumnWidth(rows, field, minWidth) {
  let longest = 0;
  const seen = new Set();
  for (const row of Array.isArray(rows) ? rows : []) {
    const files = validFiles(row?.[field]);
    if (files.length !== 1 || seen.has(files[0].name)) continue;
    seen.add(files[0].name);
    longest = Math.max(longest, measure(files[0].name));
  }
  return Math.max(minWidth, Math.ceil(longest * 1.04) + EXTRA_WIDTH);
}
