// 發新版後，長開／安裝版（加到主畫面）的舊頁面去載已不存在的 chunk 會失敗。
// 這裡集中處理：判斷是否為 chunk 載入錯誤，以及「清掉舊 Service Worker／快取後重新載入」。
// 保險絲：同一版本只自動 reload 一次；若 reload 後仍失敗，改比對線上 manifest 版本，
// 線上確定有新版才再 reload 一次（安裝版殼層常因舊 SW／快取讓第一次 reload 仍拿到舊 index.html）。
import { appVersion } from '@/version';
import { fetchLatestVersion, forceReloadToLatest } from '@/composables/useVersionCheck';

export const CHUNK_ERROR_PATTERN = /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS|Loading chunk .* failed|Loading CSS chunk/i;

const GUARD_KEY = `anxi-chunk-reload-${appVersion}`;

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
export async function reloadToLatest() {
  await purgeServiceWorkers();
  forceReloadToLatest();
}

/**
 * chunk 載入失敗自救。回傳 true 表示已觸發 reload；false 表示放棄（純網路問題或線上沒有新版）。
 * @param {string} [targetPath] 目標路由 fullPath；reload 後直接落在使用者要去的頁面（hash router）
 */
let pendingRecovery = null;
export function recoverFromChunkError(targetPath) {
  // 同一次失敗會同時觸發 router.onError 與呼叫端 catch，共用同一個處理避免重複 reload／重複消耗保險絲
  if (!pendingRecovery) {
    pendingRecovery = doRecover(targetPath).finally(() => { pendingRecovery = null; });
  }
  return pendingRecovery;
}

async function doRecover(targetPath) {
  let shouldReload = false;
  if (!guardGet(GUARD_KEY)) {
    guardSet(GUARD_KEY);
    shouldReload = true;
  } else {
    const latest = await fetchLatestVersion();
    if (latest && latest !== appVersion) {
      const retryKey = `${GUARD_KEY}-to-${latest}`;
      if (!guardGet(retryKey)) {
        guardSet(retryKey);
        shouldReload = true;
      }
    }
  }
  if (!shouldReload) return false;
  if (targetPath) window.location.hash = '#' + targetPath;
  await reloadToLatest();
  return true;
}
