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

  server: {
    proxy: {
      // 將 /api-nlsc 的請求代理到國土測繪中心的 API
      '/api-nlsc': {
        target: 'https://api.nlsc.gov.tw',
        changeOrigin: true, // 必須為 true
        rewrite: (path) => path.replace(/^\/api-nlsc/, '') // 移除請求路徑中的 /api-nlsc 前綴
      }
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
        // ✅ 【修改】將 maximumFileSizeToCacheInBytes 移至此處
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 設定為 5 MB
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        // ✅ 【修改】從此處移除 maximumFileSizeToCacheInBytes
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
        enabled: false,
        type: 'module',
      },
      manifest
    })
  ]
});