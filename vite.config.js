//vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/anxi-app/',    // ← 加上這一行
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
  ]
});
