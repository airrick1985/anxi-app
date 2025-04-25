// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import vuetify, { loadFonts } from './plugins/vuetify'
import router from './router'
// import store from './store' // <--- 刪除或註釋掉這一行錯誤的導入
import axios from 'axios'
import VueAxios from 'vue-axios'
import '@mdi/font/css/materialdesignicons.css' // <-- 確保這個導入 MDI 的還在

// 1. 導入 createPinia
import { createPinia } from 'pinia'

// 2. 創建 Pinia 實例
const pinia = createPinia()

loadFonts()

createApp(App)
  .use(router)
  // .use(store) // <--- 刪除或註釋掉這一行
  .use(vuetify)
  .use(VueAxios, axios)
  .use(pinia) // <--- 3. 將 Pinia 實例 use 到 app 中
  .mount('#app')