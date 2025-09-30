import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUpdateStore = defineStore('update', () => {
  // 狀態：是否需要更新
  const needRefresh = ref(false);
  // 狀態：儲存 PWA 提供的更新函式
  const updateServiceWorker = ref(() => {});

  /**
   * 設定更新狀態，由 App.vue 呼叫
   * @param {Function} reloadSW - PWA 插件提供的更新函式
   */
  function setUpdate(reloadSW) {
    needRefresh.value = true;
    updateServiceWorker.value = reloadSW;
  }

  /**
   * 執行更新，由更新提示元件呼叫
   */
  function applyUpdate() {
    if (updateServiceWorker.value) {
      updateServiceWorker.value();
    }
  }

  return { needRefresh, setUpdate, applyUpdate };
});