// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path'; // ✅ 要加這行才能設定 alias

export default defineConfig({
  base: '/anxi-app/', // ✅ 你的 GitHub Pages 項目目錄
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'ANXI 驗屋系統',
        short_name: 'ANXI驗屋系統',
        start_url: '/anxi-app/',
        display: 'standalone',
        background_color: '#1976D2',
        theme_color: '#1976D2',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src') // ✅ 加上 alias 設定，讓 @ 指向 src
    }
  }
});
