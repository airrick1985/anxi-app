import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi';
import '@mdi/font/css/materialdesignicons.css';


// ✅ 步驟 1：從 vuetify/locale 導入繁體中文語系檔
import { zhHant } from 'vuetify/locale';

export default createVuetify({
  // 元件與指令由 vite-plugin-vuetify 按各頁面模板自動匯入。
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi }
  },
  locale: {
    locale: 'zhHant',
    fallback: 'en',
    messages: { zhHant },
  },
});