// Self-destructing Service Worker.
// WHY：本 app 採用後端驗證 + 線上即時資料，PWA 離線快取反而造成舊版卡住。本檔案的
// 唯一任務是：讓舊用戶瀏覽器裡已註冊的舊 SW 自毀並清空所有 Cache Storage，之後該裝置
// 就完全不再受 SW 攔截，每次進站都直接打網路。新用戶的 app bundle 不會註冊任何 SW，
// 所以這檔案只對「以前裝過 SW 的裝置」有效。
//
// 觸發時機：當舊 SW 做自己的 update check 時，會 fetch /sw.js，byte diff 偵測到新內
// 容 → 安裝本 SW → skipWaiting → activate → 清 cache + unregister + 強制 reload 所有 tab。

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      try { client.navigate(client.url); } catch (_) { /* 部分瀏覽器不允許 */ }
    }
  })());
});
