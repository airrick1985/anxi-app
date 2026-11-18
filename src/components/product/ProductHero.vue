<template>
  <section id="pp-sec-top" data-sec="top" class="pp-hero" aria-labelledby="pp-h-top">
    <div class="pp-wrap pp-hero__grid">
      <div class="pp-hero__text">
        <p class="pp-hero__eyebrow">產品介紹</p>
        <h1 id="pp-h-top" class="pp-hero__title">
          <span class="pp-line">從案場銷控到</span><span class="pp-line">交屋驗屋，</span><span class="pp-line">一個平台全部搞定</span>
        </h1>
        <p class="pp-hero__sub">專為建設公司與代銷團隊打造的雲端建案管理平台</p>
        <div class="pp-hero__cta">
          <button type="button" class="pp-btn pp-btn--primary pp-btn--lg" @click="$emit('trial', 'product-hero')">
            免費試用<v-icon size="20">mdi-arrow-right</v-icon>
          </button>
          <a class="pp-btn pp-btn--outline-light pp-btn--lg" :href="LINE_URL" target="_blank" rel="noopener">
            <v-icon size="20">mdi-chat-outline</v-icon>LINE 洽詢
          </a>
        </div>
        <a class="pp-hero__pricing" :href="pricingHref" @click.prevent="$emit('pricing')">看方案價格<v-icon size="18">mdi-arrow-right</v-icon></a>
      </div>

      <dl class="pp-hero__stats">
        <div v-for="s in stats" :key="s.label" class="pp-hero__stat">
          <dt>{{ s.label }}</dt>
          <dd><b>{{ s.value }}</b><small>{{ s.unit }}</small></dd>
        </div>
      </dl>

      <div class="pp-hero__visual">
        <div class="pp-hero__desk">
          <ProductShot shot-key="sales-grid" eager @open="(k, el) => $emit('open-shot', k, el)" />
        </div>
        <div class="pp-hero__phone">
          <ProductShot shot-key="booking-page-mobile" eager @open="(k, el) => $emit('open-shot', k, el)" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { LINE_URL } from '@/constants/productModules';
import { COMPANY_PROFILE } from '@/constants/companyProfile';
import { appVersion } from '@/version';
import ProductShot from './ProductShot.vue';

defineProps({
  pricingHref: { type: String, default: '' },
});
defineEmits(['trial', 'open-shot', 'pricing']);

// 同 deck：合作建案、管理戶數取自 COMPANY_PROFILE，版本數取自 appVersion 最後一段
const versionCount = Number(String(appVersion).split('.').pop()) || 0;
const fmt = (n) => n.toLocaleString('en-US');
const stats = [
  { value: `${fmt(COMPANY_PROFILE.partnerProjects)}+`, unit: '個', label: '累計合作建案' },
  { value: `${fmt(COMPANY_PROFILE.managedUnits)}+`, unit: '戶', label: '系統管理戶數' },
  { value: fmt(versionCount), unit: '個', label: '已發布版本' },
];
</script>

<style scoped>
.pp-hero {
  position: relative;
  display: flex;
  align-items: center;
  min-height: calc(100vh - 96px);
  min-height: calc(100dvh - 96px); /* 頂欄 56＋露出下一區約 40px */
  padding: clamp(32px, 5vh, 56px) 0 clamp(36px, 6vh, 64px);
  overflow: clip;
  background:
    radial-gradient(900px 520px at 85% 0%, rgba(47, 107, 255, 0.28), transparent 60%),
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px) 0 0 / 40px 40px,
    linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px) 0 0 / 40px 40px,
    #070A14;
  color: #fff;
}
.pp-hero__grid {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  grid-template-areas: 'text visual' 'stats stats';
  column-gap: 48px;
  row-gap: clamp(32px, 6vh, 56px);
  align-items: center;
}
.pp-hero__text { grid-area: text; min-width: 0; }
.pp-hero__visual {
  grid-area: visual;
  position: relative;
  justify-self: end;
  width: 100%;
  min-width: 0;
  /* 矮螢幕（筆電 720–768 高）縮小示意，讓首屏不超過一個視窗 */
  max-width: calc((100vh - 360px) * 1.58);
  max-width: calc((100dvh - 360px) * 1.58);
  padding: 0 0 7% 0;
}
.pp-hero__stats { grid-area: stats; }

.pp-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 20px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.72);
}
.pp-hero__eyebrow::before { content: ''; width: 24px; height: 1px; background: #2F6BFF; }
.pp-hero__title {
  /* 最長一行 8 字；字級隨欄寬縮放，最大 64px（可略伸入欄間距） */
  width: calc(100% + 32px);
  margin: 0 0 20px;
  font-size: clamp(34px, calc(5vw - 8px), 64px);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
}
.pp-hero__sub { margin: 0 0 32px; max-width: 30em; font-size: 17px; line-height: 1.8; color: rgba(255, 255, 255, 0.78); text-wrap: balance; }
.pp-hero__pricing {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 44px;
  margin-top: 8px;
  padding: 0 2px;
  color: rgba(255, 255, 255, 0.86);
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
}
.pp-hero__pricing:hover { color: #fff; text-decoration: underline; }
.pp-hero__cta { display: flex; flex-wrap: wrap; gap: 12px; }
.pp-hero__cta .pp-btn { flex: 0 1 auto; }
@media (max-width: 1099.98px) {
  .pp-hero__cta .pp-btn { flex: 1 1 150px; padding: 0 16px; }
}
/* 平板：不強制撐滿視窗，高度由內距決定 */
@media (min-width: 768px) and (max-width: 1099.98px) {
  .pp-hero { min-height: 0; padding: 64px 0 56px; }
}

.pp-hero__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
}
.pp-hero__stat {
  display: flex;
  flex-direction: column-reverse;
  gap: 4px;
  padding: 20px 24px 0;
  border-left: 1px solid rgba(255, 255, 255, 0.14);
}
.pp-hero__stat:first-child { padding-left: 0; border-left: 0; }
.pp-hero__stat dt { font-size: 14px; line-height: 1.6; color: rgba(255, 255, 255, 0.72); }
.pp-hero__stat dd { display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px; margin: 0; }
.pp-hero__stat b { font-size: clamp(36px, 4.4vw, 56px); font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.pp-hero__stat small { font-size: 18px; color: rgba(255, 255, 255, 0.6); }

.pp-hero__desk { width: 100%; }
.pp-hero__phone {
  position: absolute;
  left: 3%;
  bottom: 0;
  width: 22%;
  min-width: 96px;
}
.pp-hero__visual :deep(.pp-shot) { box-shadow: 0 30px 70px rgba(0, 0, 0, 0.45); }
.pp-hero__visual :deep(.pp-shot--browser) { border-color: rgba(255, 255, 255, 0.1); }

/* ───── 手機 ───── */
@media (max-width: 767.98px) {
  .pp-hero {
    display: block;
    min-height: 0;
    max-height: max(560px, calc(100vh - 56px));
    max-height: max(560px, calc(100svh - 56px));
    padding: 28px 0 32px;
  }
  .pp-hero__grid {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas: 'text' 'stats' 'visual';
    row-gap: 28px;
  }
  .pp-hero__eyebrow { margin-bottom: 14px; font-size: 13px; }
  .pp-hero__title { width: 100%; margin-bottom: 14px; font-size: 36px; }
  .pp-hero__sub { margin-bottom: 24px; font-size: 16px; }
  .pp-hero__cta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .pp-hero__cta .pp-btn { width: 100%; padding: 0 12px; }
  .pp-hero__stat { padding: 14px 0 0 10px; gap: 2px; }
  .pp-hero__stat dt { font-size: 13px; line-height: 1.45; }
  .pp-hero__stat dd { flex-wrap: nowrap; gap: 2px; }
  .pp-hero__stat b { font-size: 26px; }
  .pp-hero__stat small { font-size: 13px; }
  .pp-hero__visual { max-width: none; padding: 0; }
  .pp-hero__phone { display: none; }
  .pp-hero__pricing { margin-top: 4px; }
}
/* 小手機：數字縮小，與分隔線保持距離 */
@media (max-width: 379.98px) {
  .pp-hero__stat { padding: 14px 8px 0 8px; }
  .pp-hero__stat:first-child { padding-left: 0; }
  .pp-hero__stat b { font-size: 22px; }
  .pp-hero__stat small { font-size: 13px; }
}
/* 手機橫拿（矮螢幕）：不疊手機框，示意圖保留可辨識的寬度 */
@media (max-height: 500px) {
  .pp-hero { min-height: 0; padding: 32px 0 40px; }
  .pp-hero__visual { max-width: none; min-width: 280px; padding: 0; }
  .pp-hero__phone { display: none; }
}
</style>
