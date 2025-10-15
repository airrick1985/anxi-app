import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import '@mdi/font/css/materialdesignicons.css';
import { VDataTable } from 'vuetify/components/VDataTable' 


// ✅ 步驟 1：從 vuetify/locale 導入繁體中文語系檔
import { zhHant } from 'vuetify/locale';

export default createVuetify({
  // ✓ 將 VDataTable 移入 components 物件中
  components: {
    ...components,
    VDataTable,
  },
  directives,
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