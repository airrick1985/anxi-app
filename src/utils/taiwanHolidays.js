// src/utils/taiwanHolidays.js
// 台灣國定假日（含補假、小年夜、春節）：讀人事行政總處行事曆的開源整理檔
// （github.com/ruyut/TaiwanCalendar，經 jsDelivr），依年份載入、瀏覽器快取 7 天。
// 讀不到時（離線、尚未公告的年度）就當作沒有假日，不影響其他功能。
import { reactive, ref } from 'vue';

const SOURCE_URL = (year) => `https://cdn.jsdelivr.net/gh/ruyut/TaiwanCalendar/data/${year}.json`;
const CACHE_PREFIX = 'anxi-tw-holidays-';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

// 'YYYY-MM-DD' → 假日名稱（跨元件共用）
const holidays = reactive({});
// 每載入一個年度就 +1；FullCalendar 這類非 Vue 響應式的畫面靠它重繪
export const holidaysRevision = ref(0);
const requested = new Set();

const pad = (n) => String(n).padStart(2, '0');
const toDateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function readCache(year) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + year);
    if (!raw) return null;
    const { savedAt, days } = JSON.parse(raw);
    return Date.now() - savedAt < CACHE_TTL ? days : null;
  } catch {
    return null;
  }
}

function writeCache(year, days) {
  try {
    localStorage.setItem(CACHE_PREFIX + year, JSON.stringify({ savedAt: Date.now(), days }));
  } catch { /* 無痕模式或空間不足：不快取 */ }
}

async function fetchYear(year) {
  const res = await fetch(SOURCE_URL(year));
  if (!res.ok) throw new Error(`holidays ${year}: HTTP ${res.status}`);
  const list = await res.json();
  const days = {};
  // 只取有名稱的放假日；一般週六日 description 為空
  for (const d of list) {
    if (d.isHoliday && d.description) {
      days[`${d.date.slice(0, 4)}-${d.date.slice(4, 6)}-${d.date.slice(6, 8)}`] = d.description;
    }
  }
  return days;
}

// 每個年度只請求一次（同一次開頁內不重試）；一律非同步寫入，避免在畫面渲染途中改動狀態
export function loadTaiwanHolidays(year) {
  if (requested.has(year)) return;
  requested.add(year);
  const cached = readCache(year);
  const pending = cached
    ? Promise.resolve(cached)
    : fetchYear(year).then((days) => { writeCache(year, days); return days; });
  pending
    .then((days) => {
      Object.assign(holidays, days);
      holidaysRevision.value++;
    })
    .catch((err) => console.warn('[taiwanHolidays]', err.message));
}

// 回傳該日假日名稱（非假日回傳 ''）；該年度尚未載入時會順便開始載入
export function getTaiwanHoliday(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  loadTaiwanHolidays(d.getFullYear());
  return holidays[toDateKey(d)] || '';
}
