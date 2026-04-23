// /workspaces/anxi-app/src/sw.js

// --- 【修改】只導入有用到的 Workbox 模組 ---
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { openDB } from 'idb';

// 1. 預快取（排除 index.html；它改走 NetworkFirst 以確保每次開啟網站拿到最新版本）
// WHY：純 precache 會讓使用者開啟網站時先吃舊 HTML，必須等 SW 背景偵測到新版本才 reload。
// 改 navigation 為 NetworkFirst 後，每次進站直接打網路要最新 index.html，斷網才 fallback cache。
const manifest = self.__WB_MANIFEST || [];
const precacheManifest = manifest.filter(entry => {
  const url = typeof entry === 'string' ? entry : entry.url;
  return !/(^|\/)index\.html$/.test(url);
});
precacheAndRoute(precacheManifest);

// SPA 頁面請求走 NetworkFirst：3 秒內有網路回應就用最新，否則 fallback 快取版本
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: 'html-cache',
      networkTimeoutSeconds: 3,
      plugins: [
        new ExpirationPlugin({ maxEntries: 1, maxAgeSeconds: 24 * 60 * 60 }),
      ],
    })
  )
);

// 2. 運行時快取策略
registerRoute(
  ({request}) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 }), // 30 天
    ],
  })
);

registerRoute(
  ({url}) => url.origin === self.location.origin && url.pathname.startsWith('/api/readonly-data'),
  new NetworkFirst({
    cacheName: 'api-readonly-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 5 * 60 }) // 5 分鐘
    ]
  })
);

registerRoute(
  ({url}) => url.hostname === 'cdnjs.cloudflare.com',
  new CacheFirst({
    cacheName: 'cdnjs-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 }), // 1 年
    ],
  })
);


// --- 背景同步邏輯 (維持不變) ---
const DB_NAME = 'anxi-offline-db';
const SYNC_STORE_NAME = 'sync-queue';
const SYNC_TAG_NAME = 'sync-anxi-data';

async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(SYNC_STORE_NAME)) {
        db.createObjectStore(SYNC_STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

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

        let responseData = null;
        try {
          responseData = await response.clone().json();
        } catch (e) {
          console.warn('[SW] Could not parse JSON from response for success message.', e);
        }

        self.clients.matchAll().then(clients => {
          clients.forEach(client => client.postMessage({
            type: 'SYNC_OPERATION_SUCCESS',
            payload: { id: operation.id, responseData: responseData }
          }));
        });

      } else {
        console.error('[SW] Failed to sync operation:', operation.id, response.status);
        let errorText = 'Could not read error response body';
        try {
            errorText = await response.text();
        } catch (e) {
            console.warn('[SW] Could not read text from error response.', e);
        }
        console.error('[SW] Error response body:', errorText);

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

self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG_NAME) {
    console.log(`[SW] Sync event triggered for tag: ${event.tag}`);
    event.waitUntil(replayRequests());
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING message, activating new SW.');
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated. Claiming clients.');
  event.waitUntil(self.clients.claim());
});