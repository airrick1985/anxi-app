<template>
  <footer class="pp-foot">
    <div class="pp-wrap pp-foot__grid">
      <div class="pp-foot__brand">
        <img :src="logoWhiteUrl" alt="" width="800" height="576" />
        <span>ANXI 安熙智慧</span>
      </div>
      <nav class="pp-foot__links" aria-label="頁尾">
        <a :href="LINE_URL" target="_blank" rel="noopener"><v-icon size="18">mdi-chat-outline</v-icon>LINE 洽詢</a>
        <a :href="`tel:${PHONE.replace(/-/g, '')}`"><v-icon size="18">mdi-phone-outline</v-icon>{{ PHONE }}</a>
        <router-link :to="{ name: 'ProductDeck', query: utmQuery }"><v-icon size="18">mdi-presentation</v-icon>簡報模式</router-link>
      </nav>
      <div class="pp-foot__legal">
        <router-link :to="{ name: 'PrivacyPolicy' }">隱私權政策</router-link>
        <router-link :to="{ name: 'TermsOfService' }">服務條款</router-link>
        <span>&copy; {{ year }} ANXI Smart System</span>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { LINE_URL, PHONE } from '@/constants/productModules';
import logoWhiteUrl from '@/assets/landing/anxi-logo-white.webp';

defineProps({
  utmQuery: { type: Object, default: () => ({}) },
});

const year = new Date().getFullYear();
</script>

<style scoped>
.pp-foot { padding: 48px 0 40px; background: #04060D; color: rgba(255, 255, 255, 0.78); border-top: 1px solid rgba(255, 255, 255, 0.08); }
.pp-foot__grid { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 20px 40px; align-items: center; }
.pp-foot__brand { display: flex; align-items: center; gap: 10px; color: #fff; font-size: 17px; font-weight: 700; }
.pp-foot__brand img { width: auto; height: 28px; }
.pp-foot__links { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 4px 24px; }
.pp-foot__links a, .pp-foot__legal a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  color: inherit;
  text-decoration: none;
  font-size: 15px;
}
.pp-foot__links a:hover, .pp-foot__legal a:hover { color: #fff; text-decoration: underline; }
.pp-foot__legal {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0 20px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}
.pp-foot__legal a { font-size: 14px; }
.pp-foot__legal span { margin-left: auto; }

@media (max-width: 767.98px) {
  .pp-foot { padding: 36px 0 calc(36px + 56px + env(safe-area-inset-bottom)); }
  .pp-foot__grid { grid-template-columns: minmax(0, 1fr); }
  .pp-foot__links { justify-content: flex-start; }
  .pp-foot__legal span { margin-left: 0; flex-basis: 100%; }
}
</style>
