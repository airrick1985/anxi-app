// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './router'
import axios from 'axios'
import VueAxios from 'vue-axios'
import '@mdi/font/css/materialdesignicons.css' // 確保 MDI 圖標 CSS 被導入

// ✅ 加入 Toast 套件
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'


// --- Pinia 和 持久化插件 ---
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate' // <--- 1. 導入插件

// 2. 導入 vite-plugin-pwa 提供的註冊模組
import { registerSW } from 'virtual:pwa-register' // <--- 添加這一行

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

// 3. 註冊 Service Worker (通常在創建 app 之後，掛載之前)
registerSW({
  onNeedRefresh() {
    // 這裡可以彈出一個 Toast 通知用戶有新版本
    const toast = app.config.globalProperties.$toast; // 假設 Toast 被正確註冊到全局
    if (toast && typeof toast.info === 'function') {
      toast.info('New content available. Please reload.', {
        timeout: 0, // 永不自動關閉
        closeButton: 'button',
        icon: true,
        actions: [
          {
            text: 'Reload',
            onClick: (e, toastObject) => {
              toastObject.goAway(0); // 立即關閉 toast
              window.location.reload();
            }
          }
        ]
      });
    } else {
      // 降級處理，如果 Toast 無法使用
      if (confirm('New content available. Reload?')) {
        window.location.reload();
      }
    }
    console.log('New content available, please refresh.');
  },
  onOfflineReady() {
    // 這裡可以彈出一個 Toast 通知用戶應用已可離線使用
    const toast = app.config.globalProperties.$toast;
    if (toast && typeof toast.success === 'function') {
      toast.success('App is ready to work offline!', {
        timeout: 5000
      });
    }
    console.log('App is ready to work offline.');
  }
})

// --- 使用插件和掛載 Vue 應用 ---
app
  .component('font-awesome-icon', FontAwesomeIcon) // 全局註冊組件
  .use(router)
  .use(vuetify)
  .use(VueAxios, axios)
  .use(pinia)
  .use(Toast, { // Toast 插件的註冊可以放在這裡
    timeout: 10000, // Toast 預設超時時間
    position: 'top-right',
    closeOnClick: true,
    pauseOnHover: true
    // 你可能需要確保 Toast 插件的 $toast 實例在 registerSW 回調中可用
    // 如果 registerSW 執行時 Toast 還未完全初始化，直接使用 confirm 可能更可靠
    // 或者將 Toast 實例傳遞給 registerSW
  })
  .mount('#app')