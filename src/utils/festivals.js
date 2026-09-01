// src/utils/festivals.js
// ─────────────────────────────────────────────────────────────
// 節日特效「日期設定檔」：Login 與 Home 的 <FestivalEffect /> 依此判斷
// 今天要不要顯示特效、顯示哪一種。
//
// ✅ 如何新增／維護節日：
//   1. 在下方 FESTIVALS 陣列加一筆設定：
//      - id      ：唯一代號（也可用於 ?festival=<id> 預覽）
//      - name    ：顯示名稱（目前僅供維護辨識）
//      - effect  ：特效代號，對應 src/utils/festivalEffects.js 的 EFFECTS 註冊表
//      - recurring：每年固定的國曆節日，寫 { start: 'MM-DD', end: 'MM-DD' }
//      - ranges  ：農曆節日每年日期不同，逐年列出 { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }
//   2. 若需要新特效，到 festivalEffects.js 依說明實作並註冊 effect 代號。
//   3. 多個節日重疊時，取陣列中排前面的那一個。
//
// ✅ 測試／關閉：
//   - 網址加 ?festival=<id> 可強制預覽任一節日特效（不限日期）
//   - localStorage 設 anxi-festival-off = '1' 可整個停用（使用者層級開關）
// ─────────────────────────────────────────────────────────────

export const FESTIVALS = [
  {
    id: 'midAutumn',
    name: '中秋節',
    effect: 'midautumn',
    // 農曆八月十五：2026/09/25、2027/09/15、2028/10/03（前後各展示幾天）
    ranges: [
      { start: '2026-09-22', end: '2026-09-26' },
      { start: '2027-09-12', end: '2027-09-16' },
      { start: '2028-09-30', end: '2028-10-04' },
    ],
  },
  {
    id: 'christmas',
    name: '聖誕節',
    effect: 'snow',
    recurring: { start: '12-18', end: '12-26' },
  },
];

/** 以本地時間（台灣使用情境）取得 YYYY-MM-DD / MM-DD */
const pad = (n) => String(n).padStart(2, '0');
const toYmd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toMd = (d) => `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const isInFestival = (festival, now) => {
  const ymd = toYmd(now);
  const md = toMd(now);
  if (Array.isArray(festival.ranges)) {
    if (festival.ranges.some(r => ymd >= r.start && ymd <= r.end)) return true;
  }
  if (festival.recurring) {
    const { start, end } = festival.recurring;
    // 支援跨年區間（如 12-28 ~ 01-03）
    if (start <= end ? (md >= start && md <= end) : (md >= start || md <= end)) return true;
  }
  return false;
};

/**
 * 取得目前應顯示的節日設定；無則回傳 null。
 * - ?festival=<id> 強制預覽（方便平常維護時檢視效果）
 * - localStorage anxi-festival-off = '1' 停用
 */
export function getActiveFestival(now = new Date()) {
  try {
    if (localStorage.getItem('anxi-festival-off') === '1') return null;
  } catch (e) { /* ignore */ }

  try {
    // 專案使用 hash 路由（/#/login?festival=xxx），query 在 hash 內，
    // window.location.search 讀不到 → 兩處都解析
    const { search, hash } = window.location;
    const hashQuery = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
    const previewId = new URLSearchParams(search).get('festival')
      || new URLSearchParams(hashQuery).get('festival');
    if (previewId) {
      const preview = FESTIVALS.find(f => f.id === previewId || f.effect === previewId);
      if (preview) return preview;
    }
  } catch (e) { /* ignore */ }

  return FESTIVALS.find(f => isInFestival(f, now)) || null;
}
