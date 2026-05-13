// Self-destructing Service Worker
// 用途：清除舊 PWA 版本留下的 Cache Storage，然後把自己 unregister 掉。
// 一旦這個 SW 跑過一次 activate，這個瀏覽器就再也不會有 SW 介入網路請求。
// PWA 早已停用，App 資料依賴後端驗證 + 線上即時同步，不需要 SW。

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // 1. 清掉所有舊 Cache Storage（workbox-precache / images-cache / html-cache 等）
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));

    // 2. 自我 unregister
    await self.registration.unregister();

    // 3. 讓所有已開啟的分頁立即脫離 SW 控制；重新整理一次以走純網路路徑
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      try {
        client.navigate(client.url);
      } catch (_) {
        // 部分瀏覽器在 unregister 後 client.navigate 會 throw，忽略
      }
    }
  })());
});

// 故意不註冊 fetch listener — 沒有 fetch handler 的 SW，瀏覽器不會把網路請求繞進來，
// 在 activate 完成前的短暫期間也能保持效能。
