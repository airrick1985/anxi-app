import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: '/anxi-app/', // ⬅ 加上這個
  plugins: [vue()]
});
