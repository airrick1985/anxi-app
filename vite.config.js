// /workspaces/anxi-app/vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import manifest from './public/manifest.json';

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
      injectManifest: {
        swSrc: 'src/sw.js',
        swDest: 'dist/sw.js',
        globDirectory: 'dist',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        // 從 injectManifest 中移除 maximumFileSizeToCacheInBytes
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        // 將 maximumFileSizeToCacheInBytes 放在這裡
        // 這與錯誤訊息 "workbox.maximumFileSizeToCacheInBytes" 的提示一致
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 設定為 4MB (4 * 1024 * 1024 bytes)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdnjs-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
      manifest
    })
  ]
});