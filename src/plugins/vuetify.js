import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import '@mdi/font/css/materialdesignicons.css';

// ✅ 步驟 1：從 vuetify/locale 導入繁體中文語系檔
import { zhHant } from 'vuetify/locale';

export default createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi }
  },
  // ✅ 步驟 2：加入 locale 設定，將預設語言設為繁體中文
  locale: {
    locale: 'zhHant',
    fallback: 'en',
    messages: { zhHant },
  },
});