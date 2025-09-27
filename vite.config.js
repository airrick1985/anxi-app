// /workspaces/anxi-app/vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import manifest from './public/manifest.json';

// 最終修正的設定
export default defineConfig({
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    proxy: {
      '/api-nlsc': {
        target: 'https://api.nlsc.gov.tw',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-nlsc/, '')
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
        //  根據文件，保留此處設定
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      workbox: {
        //  【關鍵修改】根據錯誤訊息，也在此處加入設定
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        skipWaiting: true,
        clientsClaim: true,
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
  ],

  // 保留已優化的程式碼分割設定
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('ag-grid')) {
            return 'ag-grid';
          }
          if (id.includes('firebase')) {
            return 'firebase';
          }
          if (id.includes('date-fns')) {
            return 'date-fns';
          }
          if (id.includes('xlsx')) {
            return 'xlsx';
          }
          if (id.includes('vuetify')) {
            return 'vuetify';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
});
