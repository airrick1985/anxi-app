import { defineAsyncComponent } from 'vue';

// 共用同一個非同步元件，避免公開頁下載管理介面，也避免換頁重建 layout。
export const DefaultLayout = defineAsyncComponent(() => import('./DefaultLayout.vue'));
export const PublicLayout = defineAsyncComponent(() => import('./PublicLayout.vue'));
