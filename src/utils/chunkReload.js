// 發新版後，長開／安裝版（加到主畫面）的舊頁面去載已不存在的 chunk 會失敗。
// 這裡集中處理：判斷是否為 chunk 載入錯誤、找出載不到的資源、繞過快取重抓，以及
// 「清掉舊 Service Worker／快取後重新載入」。
// 保險絲：同一版本只自動 reload 一次；若 reload 後仍失敗，改比對線上 manifest 版本，
// 線上確定有新版才再 reload 一次（安裝版殼層常因舊 SW／快取讓第一次 reload 仍拿到舊 index.html）。
//
// 為什麼要「繞過快取重抓」：Safari 的 module map 對抓失敗的模組會記成失敗，同一頁再 import
// 會立刻失敗且不重抓；安裝版又有獨立的 HTTP 快取，壞掉／截斷的 chunk 會跨 reload 一直存在。
// 用 fetch(cache:'reload') 重抓可覆寫該快取項目，reload 後才拿得到完整檔案。
import { ref } from 'vue';
import { appVersion } from '@/version';
import { fetchLatestVersion, forceReloadToLatest } from '@/composables/useVersionCheck';

export const CHUNK_ERROR_PATTERN = /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS|Loading chunk .* failed|Loading CSS chunk/i;

const GUARD_KEY = `anxi-chunk-reload-${appVersion}`;
const DIAG_KEY = 'anxi-chunk-diag';
const ASSET_RE = /\/assets\/[^?#]+\.(?:js|css)$/;
const REFRESH_TIMEOUT_MS = 10000;

function guardGet(key) {
  try { return !!sessionStorage.getItem(key); } catch { return true; } // 無法存取 storage 時視為已重載，避免循環
}
function guardSet(key) {
  try { sessionStorage.setItem(key, '1'); } catch { /* ignore */ }
}

export function isChunkLoadError(err) {
  return CHUNK_ERROR_PATTERN.test(String(err?.message || err || ''));
}

/** 本版本是否已因 chunk 失敗自動 reload 過 */
export function chunkReloadAttempted() {
  return guardGet(GUARD_KEY);
}

/**
 * 自救放棄後給頁面顯示的訊息（入口頁的警示框用）。
 * message：一句話；detail：載不到的檔名與狀態，沒有就是空字串。
 */
export const chunkFailure = ref({ message: '', detail: '' });

// ---- 找出載不到的資源 ----
const failedAssetUrls = new Set();

/** 由 main.js 以 capture 監聽 window 'error'：modulepreload / stylesheet / script 元素載入失敗時記下 URL */
export function recordAssetLoadError(event) {
  const el = event?.target;
  const url = el?.tagName === 'LINK' ? el.href : el?.tagName === 'SCRIPT' ? el.src : '';
  if (url && ASSET_RE.test(url)) failedAssetUrls.add(url);
}

/** 目前頁面用到（或嘗試載入）的所有 /assets/*.js|css，載入失敗過的排最前 */
export function collectAssetUrls() {
  const urls = new Set(failedAssetUrls);
  try {
    const origin = window.location.origin;
    for (const el of document.querySelectorAll('link[rel="modulepreload"][href], link[rel="stylesheet"][href], script[src]')) {
      const url = el.href || el.src;
      if (url && url.startsWith(origin) && ASSET_RE.test(url)) urls.add(url);
    }
    for (const entry of performance.getEntriesByType?.('resource') || []) {
      if (entry.name.startsWith(origin) && ASSET_RE.test(entry.name)) urls.add(entry.name);
    }
  } catch { /* ignore */ }
  return [...urls];
}

/**
 * 繞過 HTTP 快取重抓資源，並回報抓不到的項目。
 * 完整讀完 body 才能覆寫快取項目；有 content-length 時順便比對長度，抓出被截斷的檔案。
 */
export async function refreshAssets(urls, { concurrency = 3 } = {}) {
  const failures = [];
  const queue = [...urls];
  async function worker() {
    while (queue.length) {
      const url = queue.shift();
      try {
        const res = await fetch(url, { cache: 'reload', credentials: 'same-origin' });
        if (!res.ok) { failures.push({ url, status: res.status }); continue; }
        const body = await res.arrayBuffer();
        const declared = Number(res.headers.get('content-length'));
        if (declared && !res.headers.get('content-encoding') && declared !== body.byteLength) {
          failures.push({ url, status: res.status, reason: '檔案不完整' });
        }
      } catch (e) {
        failures.push({ url, status: 0, reason: e?.message || '網路錯誤' });
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker));
  return failures;
}

function withTimeout(promise, ms, fallback) {
  let timer;
  return Promise.race([
    promise,
    new Promise((resolve) => { timer = setTimeout(() => resolve(fallback), ms); }),
  ]).finally(() => clearTimeout(timer));
}

function saveDiag(failures) {
  try { sessionStorage.setItem(DIAG_KEY, JSON.stringify({ at: Date.now(), failures })); } catch { /* ignore */ }
}
function loadDiag() {
  try { return JSON.parse(sessionStorage.getItem(DIAG_KEY) || 'null')?.failures || []; } catch { return []; }
}

function describeFailure(f) {
  const name = f.url.split('/').pop();
  const state = f.status ? `HTTP ${f.status}` : (f.reason || '網路錯誤');
  return `${name}（${state}）`;
}

/** 解除所有 Service Worker 並清空 Cache Storage，讓 reload 走純網路拿新版 index.html */
export async function purgeServiceWorkers() {
  try {
    const regs = (await navigator.serviceWorker?.getRegistrations?.()) || [];
    await Promise.all(regs.map((r) => r.unregister()));
  } catch { /* ignore */ }
  try {
    if (window.caches) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch { /* ignore */ }
}

/** 清掉舊 SW／快取後強制重新載入到最新版 */
let pendingReload = null;
let recoveryTargetPath;
export function reloadToLatest() {
  if (!pendingReload) {
    pendingReload = (async () => {
      // iOS 安裝版的 SW / Cache Storage API 可能永遠不 resolve。
      // 清理是盡力而為，不能讓使用者按下重新載入後永遠停在原頁。
      await withTimeout(purgeServiceWorkers(), 2000);
      forceReloadToLatest(recoveryTargetPath);
    })().finally(() => { pendingReload = null; });
  }
  return pendingReload;
}

/**
 * chunk 載入失敗自救。回傳 true 表示已觸發 reload；false 表示放棄（純網路問題或線上沒有新版）。
 * @param {string} [targetPath] 目標路由 fullPath；reload 後直接落在使用者要去的頁面（hash router）
 */
let pendingRecovery = null;
export function recoverFromChunkError(targetPath) {
  if (typeof targetPath === 'string' && targetPath.startsWith('/')) {
    recoveryTargetPath = targetPath;
  }
  // 同一次失敗會同時觸發 router.onError 與呼叫端 catch，共用同一個處理避免重複 reload／重複消耗保險絲
  if (!pendingRecovery) {
    pendingRecovery = doRecover().finally(() => { pendingRecovery = null; });
  }
  return pendingRecovery;
}

async function doRecover() {
  // 1. 不論之後要不要 reload，先繞過快取重抓本頁資源：修掉壞快取，並找出真正載不到的檔案
  const failures = await withTimeout(refreshAssets(collectAssetUrls()), REFRESH_TIMEOUT_MS, []);
  if (failures.length) console.error('[chunkReload] 資源載入失敗:', failures);
  saveDiag(failures);

  // 2. 保險絲
  let shouldReload = false;
  let latest = null;
  if (!guardGet(GUARD_KEY)) {
    guardSet(GUARD_KEY);
    shouldReload = true;
  } else {
    latest = await fetchLatestVersion();
    if (latest && latest !== appVersion) {
      const retryKey = `${GUARD_KEY}-to-${latest}`;
      if (!guardGet(retryKey)) {
        guardSet(retryKey);
        shouldReload = true;
      }
    }
  }
  if (shouldReload) {
    await reloadToLatest();
    return true;
  }

  // 3. 放棄自動處理 → 準備給入口頁顯示的訊息
  const known = failures.length ? failures : loadDiag();
  chunkFailure.value = {
    message: latest && latest !== appVersion
      ? '有新版本，請重新載入'
      : (navigator.onLine === false ? '目前離線，請確認網路後重新載入' : '頁面載入失敗，請重新載入'),
    detail: known.length ? `無法載入 ${describeFailure(known[0])}` : '',
  };
  return false;
}
