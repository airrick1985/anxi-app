/**
 * 日期輸入框用的解析／格式化（文字輸入＋日曆，取代瀏覽器原生 input type=date）
 *
 * 為什麼不用原生 date input：Safari 空白時以灰字顯示今天日期，看起來像有值；
 * 直接打數字常只填進年份格，月、日仍是灰字，值其實是空的，存檔後什麼都沒有。
 */

const pad = (n) => String(n).padStart(2, '0');

/** 年月日 → 當地午夜 Date；年份 3 位數視為民國；不存在的日期（2/30）回 undefined */
function makeDate(yearText, m, d) {
  const y = Number(yearText);
  const year = yearText.length === 3 ? y + 1911 : y;
  if (year < 1900) return undefined;
  const date = new Date(year, m - 1, d);
  if (date.getFullYear() !== year || date.getMonth() !== m - 1 || date.getDate() !== d) return undefined;
  return date;
}

/**
 * 解析使用者輸入的日期文字
 * 支援 2026/11/20、2026-11-20、2026.11.20、2026年11月20日、20261120，以及民國 115/11/20、1151120
 * @returns {Date|null|undefined} Date＝有效日期；null＝空白（清除）；undefined＝無法辨識
 */
export function parseDateInput(text) {
  const s = String(text ?? '').trim();
  if (!s) return null;
  let m = s.match(/^(\d{3,4})\s*[/.\-年]\s*(\d{1,2})\s*[/.\-月]\s*(\d{1,2})\s*日?$/);
  if (m) return makeDate(m[1], Number(m[2]), Number(m[3]));
  m = s.match(/^(\d{3,4})(\d{2})(\d{2})$/);
  if (m) return makeDate(m[1], Number(m[2]), Number(m[3]));
  return undefined;
}

/** Date | Firestore Timestamp | 字串 → Date | null（yyyy-MM-dd 字串視為當地日期，不受時區位移） */
export function toDateOrNull(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (typeof value?.seconds === 'number') return new Date(value.seconds * 1000);
  const s = String(value).trim();
  const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) return makeDate(ymd[1], Number(ymd[2]), Number(ymd[3])) || null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** 顯示用 yyyy/MM/dd */
export function formatDateSlash(value) {
  const d = toDateOrNull(value);
  return d ? `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}` : '';
}

/** 儲存用 yyyy-MM-dd */
export function formatDateIso(value) {
  const d = toDateOrNull(value);
  return d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : '';
}
