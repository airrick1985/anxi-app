// /workspaces/anxi-app/vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

// 已停用 PWA：改用 public/sw.js 作為「自毀 SW」清理舊用戶，新 bundle 不再註冊 SW
export default defineConfig({
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // 將舊 code 中的 virtual:pwa-register 匯入導向本地 no-op stub，讓既有呼叫全部失效
      'virtual:pwa-register/vue': path.resolve(__dirname, './src/stubs/pwa-register-vue.js'),
      'virtual:pwa-register': path.resolve(__dirname, './src/stubs/pwa-register.js'),
    }
  },
  server: {
    allowedHosts: [
      'localhost',
      'localhost:5173',
      '127.0.0.1',
      'shirt-material-decade-numerical.trycloudflare.com',
      'worthy-programs-reality-runner.trycloudflare.com',
      'undergraduate-economy-ours-genesis.trycloudflare.com'
    ],
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
    vuetify({ autoImport: true }),
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
    })
  ],

  // 保留已優化的程式碼分割設定
  build: {
    rollupOptions: {
      output: {
        // 不把功能頁的相依套件合併進啟動共用包；只有實際 import 時才載入。
        manualChunks(id) {
          if (!id.includes('/node_modules/')) return;
          if (id.includes('/firebase/') || id.includes('/@firebase/')) return 'firebase';
          if (/\/node_modules\/(?:@vue\/|vue\/|vue-router\/|pinia\/)/.test(id)) return 'framework';
          // 其餘交給 Rollup 依使用頁面拆分，包含 Vuetify 與 Excel。
        }
      }
    }
  }
});