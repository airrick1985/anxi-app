// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './router'
import axios from 'axios'
import VueAxios from 'vue-axios'
import '@mdi/font/css/materialdesignicons.css' // 確保 MDI 圖標 CSS 被導入
import VueDraggableResizable from 'vue-draggable-resizable'
import 'vue-draggable-resizable/style.css'

// AG Grid 模組註冊已移至 HouseholdGrid.vue（唯一消費者），首頁不再被迫載入 ag-grid 整包

// ✅ 加入 Toast 套件
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'


// --- Pinia 和 持久化插件 ---
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate' // <--- 1. 導入插件

// PWA 已停用，且不再註冊 Service Worker。
// public/sw.js 仍會被瀏覽器自動更新檢查到 → 跑一次 activate 就會清掉舊快取並自我 unregister，
// 之後新訪客完全不會有 SW 介入網路請求。

// ✅ [新增] Vite 資源預載失敗自救（router.onError 之外的另一條路徑）：
// 發新版後舊 chunk/CSS 已從伺服器消失時觸發 → 自動重新載入一次拿新版。
// 與 router 共用同一組 sessionStorage 保險絲，同一版本只自動 reload 一次。
import { appVersion } from '@/version';
import { forceReloadToLatest } from '@/composables/useVersionCheck';
window.addEventListener('vite:preloadError', (event) => {
  const guardKey = `anxi-chunk-reload-${appVersion}`;
  if (sessionStorage.getItem(guardKey)) return; // 已重載過仍失敗 → 放行原本的錯誤處理
  event.preventDefault();
  sessionStorage.setItem(guardKey, '1');
  forceReloadToLatest();
});

/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core';

/* import font awesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

/* import specific icons */
// 在這裡導入您將要使用的圖標，例如：
import { faHouse, faChartLine, faUsers, faExchangeAlt } from '@fortawesome/free-solid-svg-icons';

// /* add icons to the library */
 library.add(faHouse, faChartLine, faUsers, faExchangeAlt); // 將您選擇的圖標添加到庫中


const pinia = createPinia()
pinia.use(piniaPluginPersistedstate) // <--- 2. 使用插件

const app = createApp(App) // 先創建 app 實例



// SW 註冊已在檔案上方直接透過 navigator.serviceWorker.register 處理，此處不再需要


// --- 使用插件和掛載 Vue 應用 ---
app
  .component('font-awesome-icon', FontAwesomeIcon) // 全局註冊組件
  .component('vue-draggable-resizable', VueDraggableResizable)
  .use(router)
  .use(vuetify)
  .use(VueAxios, axios)
  .use(pinia)
  .use(Toast, { // Toast 插件的註冊可以放在這裡
    timeout: 5000, // Toast 預設超時時間
    position: 'top-right',
    closeOnClick: true,
    pauseOnHover: true
    // 你可能需要確保 Toast 插件的 $toast 實例在 registerSW 回調中可用
    // 如果 registerSW 執行時 Toast 還未完全初始化，直接使用 confirm 可能更可靠
    // 或者將 Toast 實例傳遞給 registerSW
  })
  .mount('#app')