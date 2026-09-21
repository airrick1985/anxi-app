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
      // 專案同時裝了 xlsx 與 xlsx-js-style（前者的加樣式分支，API 相同）；
      // 統一導向 xlsx-js-style，避免打包兩份約 900KB 的 SheetJS。
      xlsx: 'xlsx-js-style',
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
          // Vite／Rollup 的共用 helper 虛擬模組（preload helper、CommonJS 互通 helper、Node 內建模組空殼等）
          // 被幾乎所有 chunk 共用；若不獨立出來，Rollup 會塞進第一個用到的 vendor chunk，
          // 造成入口頁預載 jspdf、exceljs 連帶下載整包 xlsx 之類的誤傷。
          // 只比對這幾個 helper，不可用「所有 \0 開頭」：套件的 ?commonjs-proxy 也是虛擬模組，會把整包套件拉進來。
          if (/^\0(?:vite\/|commonjsHelpers|commonjs-dynamic-modules|plugin-vue:export-helper)/.test(id)
            || id.includes('__vite-browser-external')) return 'shims';
          if (!id.includes('/node_modules/')) return;
          if (id.includes('/firebase/') || id.includes('/@firebase/')) return 'firebase';
          if (/\/node_modules\/(?:@vue\/|vue\/|vue-router\/|pinia\/)/.test(id)) return 'framework';
          // 大型第三方套件各自獨立成 vendor chunk：少變動、可長期快取，
          // 且頁面程式改動時不必重新下載整包套件。只有實際 import 的頁面才會載入。
          if (/\/node_modules\/ag-grid-/.test(id)) return 'ag-grid';
          if (/\/node_modules\/(?:vue-pdf-embed|pdfjs-dist)\//.test(id)) return 'pdfjs';
          if (/\/node_modules\/(?:xlsx|xlsx-js-style)\//.test(id)) return 'xlsx';
          if (id.includes('/node_modules/exceljs/')) return 'exceljs';
          if (/\/node_modules\/(?:jspdf|jspdf-autotable)\//.test(id)) return 'jspdf';
          if (id.includes('/node_modules/html2canvas/')) return 'html2canvas';
          if (id.includes('/node_modules/fabric/')) return 'fabric';
          if (id.includes('/node_modules/docx/')) return 'docx';
          if (/\/node_modules\/(?:@tiptap\/|prosemirror-|linkifyjs\/)/.test(id)) return 'tiptap';
          // 其餘交給 Rollup 依使用頁面拆分，包含 Vuetify。
        }
      }
    },
    // 上述 vendor chunk（ag-grid、pdfjs）本身就超過 1MB 且屬延遲載入，提高門檻讓警告只針對真正異常的增長
    chunkSizeWarningLimit: 1500
  }
});