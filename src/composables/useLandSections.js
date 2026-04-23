// 即時查詢「地段清單」composable
//
// 資料來源（混合策略）：
//   1. 優先：src/constants/landSections/{cityCode}.json 靜態檔（由 fetch-land-sections.mjs 產生）
//   2. Fallback：NLSC API (https://api.nlsc.gov.tw/other/ListLandSection/{cityCode}/{cityCode}{townCode})
//      CORS 全開 (access-control-allow-origin: *)，瀏覽器可直接呼叫。
//      NLSC 回應 Cache-Control: max-age=10800 (3 小時)，瀏覽器 HTTP 快取會自動處理。
//
// 本 composable 再加一層 module-level 記憶體快取，避免同一 session 重複呼叫。

import { ref, computed } from 'vue';

const API_BASE = 'https://api.nlsc.gov.tw/other/ListLandSection';
const REQUEST_TIMEOUT_MS = 15_000;

// 模組層快取：跨元件共用，單頁 session 內不重打
// key = `${cityCode}${townCode}`, value = LandSection[]
const cache = new Map();
// 進行中請求去重：同一 key 同時被多個元件請求時只發一次
const inflight = new Map();
// 靜態 JSON 按縣市快取：載入過的 cityCode 不重複動態 import
// key = cityCode, value = LandSectionRecord[] | null (null 表示檔案不存在)
const staticCityCache = new Map();

/**
 * @typedef {Object} LandSection
 * @property {string} office       地政事務所代碼 (例 "BA")
 * @property {string} officeName   事務所名 (例 "中山")
 * @property {string} sectCode     段代碼 4 碼 (例 "0001")
 * @property {string} section      段小段完整名 (例 "繼光段一小段")
 */

// ---------- XML 解析：回應是固定結構，regex 足夠 ----------
function parseSectItemsXml(xml) {
  const items = [];
  const re = /<sectItem>([\s\S]*?)<\/sectItem>/g;
  const tag = (chunk, t) => {
    const m = chunk.match(new RegExp(`<${t}>([\\s\\S]*?)<\\/${t}>`));
    return m ? m[1].trim() : '';
  };
  let m;
  while ((m = re.exec(xml))) {
    const c = m[1];
    items.push({
      office: tag(c, 'office'),
      officeName: tag(c, 'officestr'),
      sectCode: tag(c, 'sectcode'),
      section: tag(c, 'sectstr'),
    });
  }
  return items;
}

// ---------- 靜態 JSON 優先載入：若 cityCode 對應的 JSON 存在則回傳該鄉鎮的段清單 ----------
// 找不到檔案或該鄉鎮無資料時回傳 null，由呼叫端決定 fallback 策略
async function loadFromStaticJson(cityCode, townCode) {
  if (!cityCode || !townCode) return null;
  let cityData = staticCityCache.get(cityCode);
  if (cityData === undefined) {
    try {
      // Vite 會將每個 cityCode 切成獨立 chunk，首次載入才下載
      const mod = await import(`../constants/landSections/${cityCode}.json`);
      cityData = Array.isArray(mod.default) ? mod.default : [];
    } catch (_) {
      // 檔案不存在（尚未執行 fetch-land-sections 腳本）
      cityData = null;
    }
    staticCityCache.set(cityCode, cityData);
  }
  if (!cityData) return null;
  return cityData
    .filter(r => r.townCode === townCode)
    .map(r => ({
      office: r.office,
      officeName: r.officeName,
      sectCode: r.sectCode,
      section: r.section,
    }));
}

// ---------- 低階 API：回傳指定行政區的段清單 ----------
/**
 * @param {string} cityCode 單碼縣市代碼，例 "B"
 * @param {string} townCode 2 碼鄉鎮代碼，例 "01"
 * @returns {Promise<LandSection[]>}
 */
export async function fetchLandSections(cityCode, townCode) {
  if (!cityCode || !townCode) return [];
  const key = `${cityCode}${townCode}`;
  if (cache.has(key)) return cache.get(key);
  if (inflight.has(key)) return inflight.get(key);

  const promise = (async () => {
    // 1. 先嘗試靜態 JSON
    const staticList = await loadFromStaticJson(cityCode, townCode);
    if (staticList && staticList.length > 0) {
      cache.set(key, staticList);
      return staticList;
    }

    // 2. Fallback: NLSC API
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
    try {
      const url = `${API_BASE}/${cityCode}/${cityCode}${townCode}`;
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`NLSC API ${res.status} ${res.statusText}`);
      const xml = await res.text();
      const items = parseSectItemsXml(xml);
      cache.set(key, items);
      return items;
    } finally {
      clearTimeout(timer);
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

// ---------- 同步取快取：命中時可立即回，避免 loading state 閃爍 ----------
/**
 * @param {string} cityCode
 * @param {string} townCode
 * @returns {LandSection[] | null} 命中回陣列，未命中回 null
 */
export function getCachedLandSections(cityCode, townCode) {
  if (!cityCode || !townCode) return null;
  return cache.get(`${cityCode}${townCode}`) || null;
}

// ---------- 清除快取：資料過久或使用者手動刷新時呼叫 ----------
export function clearLandSectionsCache(cityCode = null, townCode = null) {
  if (!cityCode) { cache.clear(); return; }
  if (!townCode) {
    for (const k of [...cache.keys()]) {
      if (k.startsWith(cityCode)) cache.delete(k);
    }
    return;
  }
  cache.delete(`${cityCode}${townCode}`);
}

// ---------- 反查工具：已知 sectCode，回傳段名（僅查快取，不打 API） ----------
export function findCachedSection(cityCode, townCode, sectCode) {
  const list = cache.get(`${cityCode}${townCode}`);
  if (!list) return null;
  return list.find(s => s.sectCode === sectCode) || null;
}

// ---------- Vue composable：提供 reactive 狀態 ----------
export function useLandSections() {
  const loading = ref(false);
  const error = ref(null);
  const sections = ref([]);
  const currentKey = ref('');

  /**
   * 載入指定 (cityCode, townCode) 的段清單
   */
  async function load(cityCode, townCode) {
    const key = `${cityCode || ''}${townCode || ''}`;
    currentKey.value = key;
    if (!cityCode || !townCode) {
      sections.value = [];
      error.value = null;
      return;
    }
    loading.value = true;
    error.value = null;
    try {
      const list = await fetchLandSections(cityCode, townCode);
      // 若載入期間 key 又變了（使用者連續切換），丟棄舊結果
      if (currentKey.value !== key) return;
      sections.value = list;
    } catch (e) {
      if (currentKey.value !== key) return;
      error.value = e;
      sections.value = [];
    } finally {
      if (currentKey.value === key) loading.value = false;
    }
  }

  function refresh(cityCode, townCode) {
    clearLandSectionsCache(cityCode, townCode);
    return load(cityCode, townCode);
  }

  // 依關鍵字過濾（使用者在 v-autocomplete 輸入時用）
  const filterBy = (keyword) => {
    const kw = (keyword || '').trim();
    if (!kw) return sections.value;
    return sections.value.filter(s =>
      s.section.includes(kw) ||
      s.sectCode.includes(kw) ||
      s.officeName.includes(kw));
  };

  return {
    loading,
    error,
    sections,
    load,
    refresh,
    filterBy,
    isEmpty: computed(() => !loading.value && sections.value.length === 0),
  };
}
