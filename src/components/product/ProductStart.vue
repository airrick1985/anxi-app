<template>
  <!-- 開始試用（深色） -->
  <section id="pp-sec-start" data-sec="start" class="pp-sec pp-start" aria-labelledby="pp-h-start">
    <div class="pp-wrap pp-start__grid">
      <div v-reveal="{ group: true }" class="pp-start__text">
        <p class="pp-eyebrow pp-eyebrow--light" data-reveal-item>免費試用</p>
        <h2 id="pp-h-start" class="pp-h2" data-reveal-item>現在就親自操作看看</h2>
        <p class="pp-start__lead" data-reveal-item>{{ mobile ? '點下方按鈕，留下基本資料' : '掃描 QR Code 留下基本資料，立即進入範例建案' }}</p>
        <ol class="pp-steps" data-reveal-item>
          <li v-for="(st, k) in steps" :key="st.title">
            <span class="pp-steps__no">{{ k + 1 }}</span>
            <span class="pp-steps__text"><strong>{{ st.title }}</strong><span><NwText :text="st.desc" /></span></span>
          </li>
        </ol>
        <div class="pp-start__cta" data-reveal-item>
          <button type="button" class="pp-btn pp-btn--primary pp-btn--lg" @click="$emit('trial', 'product-start')">
            免費試用<v-icon size="20">mdi-arrow-right</v-icon>
          </button>
          <a class="pp-btn pp-btn--outline-light pp-btn--lg" :href="LINE_URL" target="_blank" rel="noopener">
            <v-icon size="20">mdi-chat-outline</v-icon>LINE 洽詢
          </a>
          <a class="pp-start__tel" :href="`tel:${PHONE.replace(/-/g, '')}`"><v-icon size="20">mdi-phone-outline</v-icon>{{ PHONE }}</a>
        </div>
      </div>
      <div v-if="!mobile" v-reveal="{ delay: 120 }" class="pp-qr">
        <img v-if="qrDataUrl" :src="qrDataUrl" alt="免費試用 QR Code" width="200" height="200" />
        <span v-else class="pp-qr__ph" aria-hidden="true"></span>
        <strong>掃描開始試用</strong>
      </div>
    </div>
  </section>
</template>

<script setup>
import { LINE_URL, PHONE, TRIAL_STEPS } from '@/constants/productModules';
import { PAGE_TRIAL_STEP_FIRST } from '@/constants/productPage';
import { NwText } from './text';

defineProps({
  qrDataUrl: { type: String, default: '' },
  mobile: { type: Boolean, default: false }, // <768px：客戶掃不到自己螢幕上的 QR，改用按鈕
});

// 第一步改用本頁文字（共用的 TRIAL_STEPS 給 deck 用，不改）
const steps = [PAGE_TRIAL_STEP_FIRST, ...TRIAL_STEPS.slice(1)];
defineEmits(['trial']);
</script>

<style scoped>
.pp-start {
  position: relative;
  overflow: clip;
  background:
    radial-gradient(900px 520px at 85% 0%, rgba(47, 107, 255, 0.28), transparent 60%),
    #070A14;
  color: #fff;
}
.pp-start__grid { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: 64px; align-items: center; }
.pp-start .pp-h2 { color: #fff; margin-bottom: 12px; }
.pp-start__lead { margin: 0 0 32px; font-size: 17px; line-height: 1.8; color: rgba(255, 255, 255, 0.78); }
.pp-steps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin: 0 0 36px; padding: 0; list-style: none; }
.pp-steps li { display: flex; gap: 12px; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.16); }
.pp-steps__no {
  flex: none;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #2F6BFF;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.pp-steps__text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.pp-steps__text strong { font-size: 17px; font-weight: 700; line-height: 1.5; }
.pp-steps__text span { font-size: 15px; line-height: 1.6; color: rgba(255, 255, 255, 0.72); }
.pp-start__cta { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 16px; }
.pp-start__tel {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 4px;
  color: #fff;
  font-size: 17px;
  font-weight: 600;
  text-decoration: none;
  font-variant-numeric: tabular-nums;
}
.pp-start__tel:hover { text-decoration: underline; }

.pp-qr {
  justify-self: end;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: min(280px, 100%);
  padding: 24px 24px 20px;
  border-radius: 20px;
  background: #fff;
  color: #111827;
}
.pp-qr img, .pp-qr__ph { display: block; width: 100%; height: auto; aspect-ratio: 1; border-radius: 8px; }
.pp-qr__ph { background: #F5F6F8; }
.pp-qr strong { font-size: 16px; font-weight: 700; }

@media (max-width: 1099.98px) {
  .pp-start__grid { grid-template-columns: minmax(0, 1fr) 240px; gap: 40px; }
  .pp-steps { grid-template-columns: minmax(0, 1fr); gap: 12px; }
}
@media (max-width: 767.98px) {
  .pp-start__grid { grid-template-columns: minmax(0, 1fr); gap: 36px; }
  .pp-start__lead { margin-bottom: 24px; font-size: 16px; }
  .pp-steps { margin-bottom: 28px; }
  .pp-start__cta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .pp-start__cta .pp-btn { width: 100%; padding: 0 12px; }
  .pp-start__tel { grid-column: 1 / -1; justify-content: center; }
}
</style>
