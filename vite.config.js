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
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      workbox: {
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

    // 【關鍵】請確保這段 build 設定存在且位置正確
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('ag-grid-enterprise')) {
              return 'ag-grid';
            }
            if (id.includes('xlsx-js-style')) {
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