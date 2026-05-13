// /workspaces/anxi-app/vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
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
        manualChunks(id) {
          // 多消費者套件 → 強制獨立 chunk（提升跨頁快取命中）
          if (id.includes('ag-grid')) return 'ag-grid';
          if (id.includes('firebase')) return 'firebase';
          if (id.includes('vuetify')) return 'vuetify';
          if (id.includes('date-fns')) return 'date-fns';
          if (id.includes('xlsx')) return 'xlsx';
          if (id.includes('html2canvas')) return 'html2canvas';
          if (id.includes('fabric')) return 'fabric';
          if (id.includes('@fullcalendar')) return 'fullcalendar';
          if (id.includes('@tiptap') || id.includes('prosemirror')) return 'tiptap';
          if (id.includes('chart.js') || id.includes('vue-chartjs') || id.includes('chartjs-plugin')) return 'chart';

          // 單一/少數消費者大套件 → 明確 return undefined，跳過下方 vendor catch-all
          // 強制 named chunk 會讓 rollup 在 entry 加 side-effect import，造成首頁強制 preload
          // 改交給 rollup 自動處理 → 走 dynamic import 路徑，只有對應頁面才會載入
          //   - exceljs (InspectionConsole)
          //   - jspdf (PrintQuotation / InspectionCalendar)
          //   - docx (CustomerManagement / AnalyticsPanel)
          //   - vue-pdf-embed / pdfjs-dist (InspectionConsole，2.4MB 大頭)
          //   - shepherd (InspectionCalendar)
          if (
            id.includes('exceljs') ||
            id.includes('jspdf') ||
            id.includes('docx') ||
            id.includes('vue-pdf-embed') ||
            id.includes('pdfjs-dist') ||
            id.includes('shepherd')
          ) {
            return undefined;
          }

          // 其他 node_modules → vendor
          if (id.includes('node_modules')) return 'vendor';
        }
      }
    }
  }
});