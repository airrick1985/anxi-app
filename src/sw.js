// /workspaces/anxi-app/src/sw.js

// 導入 Workbox 模組
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync'; // Workbox 提供的背景同步輔助插件
import { openDB } from 'idb'; // 或者 Dexie

// 1. 預快取 (由 VitePWA 的 injectManifest 處理)
// Workbox 會將需要預快取的檔案列表注入到 self.__WB_MANIFEST
// cleanupOutdatedCaches(); // 清理舊版本快取 (Workbox 6+ 會自動處理大部分情況)
precacheAndRoute(self.__WB_MANIFEST || []); // 使用 self.__WB_MANIFEST，如果不存在則用空陣列避免錯誤

// 2. 運行時快取策略 (可選，但推薦用於 API GET 請求和第三方資源)
registerRoute(
  ({request}) => request.destination === 'image', // 快取圖片
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 }), // 30 天
    ],
  })
);

// 快取來自特定 API 的 GET 請求 (例如 /api/readonly-data)
registerRoute(
  ({url}) => url.origin === self.location.origin && url.pathname.startsWith('/api/readonly-data'),
  new NetworkFirst({ // 網路優先，網路失敗則從快取讀取
    cacheName: 'api-readonly-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 5 * 60 }) // 5 分鐘
    ]
  })
);

// 快取 Fabric.js CDN (或其他第三方)
registerRoute(
  ({url}) => url.hostname === 'cdnjs.cloudflare.com',
  new CacheFirst({
    cacheName: 'cdnjs-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 }), // 1 年
    ],
  })
);


// --- 背景同步邏輯 ---
const DB_NAME = 'anxi-offline-db';
const SYNC_STORE_NAME = 'sync-queue';
const SYNC_TAG_NAME = 'sync-anxi-data'; // 統一的同步標籤

// 初始化 IndexedDB 的輔助函數
async function getDb() {
  return openDB(DB_NAME, 1, { // 版本號為 1
    upgrade(db, oldVersion, newVersion, transaction) {
      if (!db.objectStoreNames.contains(SYNC_STORE_NAME)) {
        db.createObjectStore(SYNC_STORE_NAME, { keyPath: 'id' });
      }
      // 如果未來需要升級資料庫結構，可以在這裡根據 oldVersion 和 newVersion 處理
    },
  });
}


// 核心的同步函數：從 IndexedDB 讀取並嘗試發送請求
async function replayRequests() {
  const db = await getDb();
  const tx = db.transaction(SYNC_STORE_NAME, 'readwrite');
  let cursor = await tx.store.openCursor();
  let successfulSyncs = 0;

  while (cursor) {
    const operation = cursor.value;
    try {
      console.log('[SW] Attempting to sync operation:', operation);
      const response = await fetch(operation.url, {
        method: operation.method,
        headers: operation.headers || { 'Content-Type': 'application/json' },
        body: JSON.stringify(operation.payload),
      });

      if (response.ok) {
        console.log('[SW] Operation synced successfully:', operation.id);
        await cursor.delete();
        successfulSyncs++;

        // --- 修改開始 ---
        // 為了在 postMessage 中使用 responseData，先異步獲取它
        let responseData = null;
        try {
          responseData = await response.clone().json();
        } catch (e) {
          console.warn('[SW] Could not parse JSON from response for success message.', e);
          // responseData 保持為 null
        }

        self.clients.matchAll().then(clients => {
          clients.forEach(client => client.postMessage({
            type: 'SYNC_OPERATION_SUCCESS',
            payload: { id: operation.id, responseData: responseData } // 使用已獲取的 responseData
          }));
        });
        // --- 修改結束 ---

      } else {
        console.error('[SW] Failed to sync operation:', operation.id, response.status);
        // --- 修改開始 (為了安全地讀取 response text) ---
        let errorText = 'Could not read error response body';
        try {
            errorText = await response.text();
        } catch (e) {
            console.warn('[SW] Could not read text from error response.', e);
        }
        console.error('[SW] Error response body:', errorText);
        // --- 修改結束 ---

        if (response.status >= 400 && response.status < 500) {
          console.warn('[SW] Unrecoverable error for operation:', operation.id, '. Deleting from queue.');
          await cursor.delete();
          self.clients.matchAll().then(clients => {
            clients.forEach(client => client.postMessage({
              type: 'SYNC_OPERATION_FAILURE',
              payload: { id: operation.id, status: response.status, error: 'Client error, not retrying.', errorDetail: errorText }
            }));
          });
        } else {
          console.log('[SW] Server error or network issue for operation:', operation.id, '. Will retry later.');
        }
      }
    } catch (error) {
      console.error('[SW] Network error during sync operation:', operation.id, error);
    }
    try {
        cursor = await cursor.continue();
    } catch (e) {
        console.warn("[SW] Error continuing cursor, likely store modified during iteration or iteration finished.");
        break;
    }
  }
  await tx.done;
  console.log(`[SW] Sync replay finished. ${successfulSyncs} operations synced.`);
  if (successfulSyncs > 0) {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => client.postMessage({ type: 'SYNC_BATCH_COMPLETED', count: successfulSyncs }));
    });
  }
}


// 監聽 sync 事件
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG_NAME) {
    console.log(`[SW] Sync event triggered for tag: ${event.tag}`);
    event.waitUntil(replayRequests());
  }
});

// 可選：用於立即激活新的 Service Worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING message, activating new SW.');
    self.skipWaiting();
  }
});

// 可選：在 activate 事件中，確保新的 SW 立即控制所有客戶端
self.addEventListener('activate', (event) => {
  console.log('[SW] Activated. Claiming clients.');
  event.waitUntil(self.clients.claim());
});