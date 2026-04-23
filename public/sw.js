// Minimal Service Worker — 用途僅為滿足瀏覽器的 PWA 可安裝條件（需要註冊 SW 且有 fetch handler）。
// 本 SW 完全不做快取，所有 fetch 直通網路；同時在第一次 activate 時清掉舊 PWA 版本留下的 Cache Storage。
// WHY：app 資料依賴後端驗證 + 線上即時同步，離線快取反而造成舊版卡住無法自動更新。

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // 清掉 workbox-precache / images-cache / html-cache 等舊 SW 遺留
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// 必須存在 fetch listener 才滿足 Chrome 的 PWA 可安裝條件；不呼叫 respondWith，瀏覽器 fallback 走預設網路行為
self.addEventListener('fetch', () => {});
