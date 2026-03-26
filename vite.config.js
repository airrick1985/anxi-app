// /workspaces/anxi-app/vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import manifest from './public/manifest.json';

// 修正 injectManifest 策略的設定
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
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'prompt',
      manifest,

      // --- 【關鍵修改】 ---
      // 根據錯誤訊息，將大小限制設定放在 injectManifest 物件中
      injectManifest: {
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024, // 設定為 8 MB
      },
      // --- 【修改結束】 ---

      devOptions: {
        enabled: false,
        type: 'module',
      },
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