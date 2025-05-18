import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import manifest from './public/manifest.json'; // ✅ 加這行

export default defineConfig({
  base: '/anxi-app/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
       injectManifest: { // VitePWA v0.13.x 及之後推薦使用 injectManifest 對象
         swSrc: 'src/sw.js',      // 你的新 Service Worker 檔案路徑
        swDest: 'dist/sw.js',    // 打包後 Service Worker 的輸出路徑
        globDirectory: 'dist',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
         },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [ // 添加運行時快取規則
      {
        urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i, // 匹配 cdnjs 的 URL
        handler: 'CacheFirst', // 策略：快取優先
        options: {
          cacheName: 'cdnjs-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365 // 一年
          },
          cacheableResponse: {
            statuses: [0, 200] // 0 通常用於不透明響應 (CORS)
          }
        }
      }
      // 你可以添加其他 API 或第三方資源的快取規則
    ]
      },
      devOptions: {
        enabled: true, // 在開發模式下也啟用 PWA 功能 (方便測試)
        type: 'module', // 開發時 Service Worker 類型
      },
      manifest // ✅ 直接使用外部讀進來的 manifest
    })
  ]
});