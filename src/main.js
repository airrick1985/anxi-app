// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
// 修改這一行 VVV
// import vuetify, { loadFonts } from './plugins/vuetify' // 移除 loadFonts 的導入
import vuetify from './plugins/vuetify'                     // 只導入 vuetify 實例
import router from './router'
import axios from 'axios'
import VueAxios from 'vue-axios'
import '@mdi/font/css/materialdesignicons.css'
import { createPinia } from 'pinia'

const pinia = createPinia()

// loadFonts() // <--- 刪除或註釋掉這一行，不再需要調用它

createApp(App)
  .use(router)
  .use(vuetify)
  .use(VueAxios, axios)
  .use(pinia)
  .mount('#app')