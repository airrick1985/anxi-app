// public/service-worker.js
const CACHE_NAME = 'anxi-app-cache-v1';
const ASSETS = [
  './',              // 等同 /anxi-app/，缓存首页
  './index.html',    // 等同 /anxi-app/index.html
  './manifest.json', // 等同 /anxi-app/manifest.json
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  // 其他静态资源，例如 JS、CSS bundle，也都可以加上 './你的路径'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
});
