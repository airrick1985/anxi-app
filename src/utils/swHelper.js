// --- 新增：src/utils/swHelper.js ---
import { useRegisterSW } from 'virtual:pwa-register/vue';

const { updateServiceWorker, needRefresh } = useRegisterSW({ immediate: true });

export async function checkUpdate() {
  if (needRefresh.value) {
    console.log('✅ 檢測到有新版，觸發更新彈窗');
    const event = new CustomEvent('triggerUpdateDialog');
    window.dispatchEvent(event);
  }
}