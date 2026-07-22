// src/composables/useVersionCheck.js
// ✅ 前端版本檢查器：定期比對「打包進 bundle 的版本」與「線上 manifest.json 的版本」。
// 發現新版本時：
//   - 分頁在背景 → 靜默重新載入（同一版本最多自動 reload 一次，物理上杜絕循環）
//   - 分頁在前景 → 由 App.vue 顯示強制更新對話框（UpdateDialog）
// 任何 fetch 失敗一律視為「沒有新版本」，絕不在錯誤狀態下 reload。
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { appVersion } from '@/version';

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 每 5 分鐘檢查一次

/**
 * 強制重新載入到最新版：帶時間戳 query 突破 index.html 的 HTTP 快取
 * （GitHub Pages 全站 max-age=600，單純 location.reload() 可能仍拿到快取的舊 index.html）。
 * Hash router：query 放在 # 之前，reload 後仍停留在原頁面路徑。
 */
export function forceReloadToLatest() {
  const { origin, pathname, hash } = window.location;
  window.location.replace(`${origin}${pathname}?_v=${Date.now()}${hash}`);
}

/** 抓取線上 manifest.json 的版本號；失敗回傳 null（視為無新版本） */
async function fetchLatestVersion() {
  try {
    const url = `${import.meta.env.BASE_URL}manifest.json?_t=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.version || null;
  } catch {
    return null;
  }
}

export function useVersionCheck() {
  const needUpdate = ref(false);   // 前景：顯示強制更新對話框
  const latestVersion = ref('');   // 偵測到的新版本號（顯示用）
  let timer = null;

  async function check() {
    try {
      if (import.meta.env.DEV) return; // 開發模式不檢查
      const latest = await fetchLatestVersion();
      if (!latest || latest === appVersion) return;

      latestVersion.value = latest;

      // 背景分頁 → 靜默 reload（sessionStorage 保險絲：同一版本只自動 reload 一次）
      const guardKey = `anxi-auto-reloaded-${latest}`;
      if (document.hidden && !sessionStorage.getItem(guardKey)) {
        sessionStorage.setItem(guardKey, '1');
        forceReloadToLatest();
        return;
      }

      // 前景（或已自動 reload 過仍不合）→ 交給對話框強制更新
      needUpdate.value = true;
    } catch (e) {
      // 檢查器本身出錯只記 log，不影響主功能
      console.warn('[VersionCheck] 檢查失敗:', e);
    }
  }

  function onVisibilityChange() {
    // 分頁回到前景時立即檢查一次（長開分頁的主要更新時機）
    if (!document.hidden) check();
  }

  onMounted(() => {
    check();
    timer = setInterval(check, CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', onVisibilityChange);
  });

  onBeforeUnmount(() => {
    if (timer) clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  });

  return { needUpdate, latestVersion };
}
