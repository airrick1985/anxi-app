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

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate) // <--- 2. 使用插件

// --- 創建和掛載 Vue 應用 ---
createApp(App)
  .use(router)       // 使用路由
  .use(vuetify)      // 使用 Vuetify
  .use(VueAxios, axios) // 使用 VueAxios (如果你的 API 調用依賴它)
  .use(pinia)        // <--- 3. 使用配置好插件的 Pinia 實例
  
  // ✅ 加入 Toast 註冊
.use(Toast, {
  timeout: 10000,
  position: 'top-right',
  closeOnClick: true,
  pauseOnHover: true
})
  
  .mount('#app')

// 注意：你之前註釋掉的 loadFonts() 是正確的，如果 vuetify 插件內部處理了字體加載。