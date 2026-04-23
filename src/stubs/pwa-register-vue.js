import { ref } from 'vue';

// No-op stub for `virtual:pwa-register/vue` (原本由 vite-plugin-pwa 提供)。
// 停用 PWA 後，useRegisterSW 固定回 needRefresh=false、updateServiceWorker 無作用，
// 讓 App.vue / DefaultLayout / UpdateDialog 等檔案的現有呼叫都變 no-op 不需改。
export function useRegisterSW() {
  return {
    needRefresh: ref(false),
    offlineReady: ref(false),
    updateServiceWorker: async () => {},
  };
}
