<template>
  <div class="cfr" role="status" aria-live="polite">
    <div class="cfr__env" aria-hidden="true">
      <span class="cfr__ripple"></span>
      <svg class="cfr__back" viewBox="0 0 200 120"><path d="M1 1 L199 1 L199 107 Q199 119 187 119 L13 119 Q1 119 1 107 Z" fill="#e4ddc6" stroke="#304c40" stroke-width="2.2" stroke-linejoin="round" /></svg>
      <div class="cfr__letter"><i></i><i></i><i></i><i></i></div>
      <svg class="cfr__front" viewBox="0 0 200 120">
        <path d="M1 1 L100 82 L199 1 L199 107 Q199 119 187 119 L13 119 Q1 119 1 107 Z" fill="#f3eedb" stroke="#304c40" stroke-width="2.2" stroke-linejoin="round" />
        <path d="M1 107 L74 66 M199 107 L126 66" fill="none" stroke="#304c40" stroke-width="2.2" stroke-linecap="round" />
      </svg>
      <div class="cfr__flap"><svg viewBox="0 0 200 82"><path d="M1 1 L199 1 L100 82 Z" fill="#ded7c0" stroke="#304c40" stroke-width="2.2" stroke-linejoin="round" /></svg></div>
      <span class="cfr__badge"><v-icon size="24" color="white">mdi-check-bold</v-icon></span>
    </div>
    <div class="cfr__text">
      <h2>{{ title }}</h2>
      <p>{{ subtitle }}</p>
    </div>
    <button type="button" class="cfr__action" @click="$emit('action')">
      {{ actionLabel }}
      <v-icon size="18">{{ actionIcon }}</v-icon>
    </button>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: '已收到您的資料' },
  subtitle: { type: String, default: '感謝您的填寫' },
  actionLabel: { type: String, default: '關閉視窗' },
  actionIcon: { type: String, default: 'mdi-close' },
});
defineEmits(['action']);
</script>

<style scoped>
.cfr { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 26px 22px 24px; text-align: center; color: #304c40; }
.cfr__env { position: relative; width: 220px; height: 200px; perspective: 700px; }
.cfr__env svg { position: absolute; left: 10px; width: 200px; overflow: visible; display: block; }
.cfr__back { top: 70px; height: 120px; z-index: 0; }
.cfr__letter { position: absolute; left: 32px; right: 32px; top: 84px; height: 98px; border-radius: 8px; background: #fffefa; border: 2px solid #304c40; padding: 14px; display: flex; flex-direction: column; gap: 9px; transform: translateY(-92px); box-shadow: 0 6px 20px #46664f1a; z-index: 2; }
.cfr__letter i { display: block; height: 6px; border-radius: 3px; background: #dfe3d8; }
.cfr__letter i:nth-child(1) { width: 40%; background: #a9c4a0; }
.cfr__letter i:nth-child(3) { width: 70%; }
.cfr__letter i:nth-child(4) { width: 55%; }
.cfr__front { top: 70px; height: 120px; z-index: 3; }
.cfr__flap { position: absolute; left: 10px; width: 200px; top: 70px; height: 82px; transform-origin: top center; transform: rotateX(180deg); z-index: 1; }
.cfr__flap svg { left: 0; top: 0; height: 82px; }
.cfr__badge { position: absolute; right: 0; top: 56px; width: 46px; height: 46px; border-radius: 50%; background: #46664f; display: grid; place-items: center; border: 3px solid #fffefa; box-shadow: 0 6px 16px #46664f33; transform: scale(0); z-index: 5; }
.cfr__ripple { position: absolute; left: 50%; top: 130px; width: 170px; height: 170px; margin: -85px 0 0 -85px; border-radius: 50%; border: 2px solid #a9c4a0; transform: scale(.2); opacity: 0; z-index: 0; }
.cfr__text { display: flex; flex-direction: column; gap: 6px; align-items: center; animation: cfr-rise .7s 2.3s both; }
.cfr__text h2 { margin: 14px 0 0; font-size: 22px; letter-spacing: 2px; font-weight: 700; line-height: 1.5; }
.cfr__text p { margin: 0; font-size: 13px; color: #748175; letter-spacing: .5px; }
.cfr__action { display: flex; align-items: center; justify-content: center; gap: 10px; width: min(280px, 100%); min-height: 46px; margin-top: 22px; padding: 12px 18px; border: 0; border-radius: 12px; background: #46664f; color: #fff; font: inherit; font-size: 14px; font-weight: 600; letter-spacing: 1px; cursor: pointer; box-shadow: 0 8px 20px #46664f26; transition: background .2s, transform .15s, box-shadow .2s; animation: cfr-rise .7s 2.5s both; }
.cfr__action:hover { background: #36543f; box-shadow: 0 10px 24px #46664f33; }
.cfr__action:active { transform: translateY(1px); box-shadow: 0 4px 12px #46664f26; }
.cfr__action:focus-visible { outline: 2px solid #54715d; outline-offset: 4px; }
.cfr__letter { animation: cfr-slidein 1s .2s cubic-bezier(.4, 0, .2, 1) forwards; }
.cfr__flap { animation: cfr-close .7s 1.2s cubic-bezier(.5, 0, .3, 1) forwards; }
.cfr__env { animation: cfr-settle .4s 1.85s ease-out; }
.cfr__badge { animation: cfr-pop .5s 2s cubic-bezier(.2, 1.4, .4, 1) forwards; }
.cfr__ripple { animation: cfr-ripple 1.2s 2s ease-out forwards; }
@keyframes cfr-slidein { to { transform: translateY(0); } }
@keyframes cfr-close { 0% { transform: rotateX(180deg); z-index: 1; } 49% { z-index: 1; } 50% { z-index: 4; } 100% { transform: rotateX(0); z-index: 4; } }
@keyframes cfr-settle { 0% { transform: translateY(0); } 40% { transform: translateY(4px); } 100% { transform: translateY(0); } }
@keyframes cfr-pop { to { transform: scale(1); } }
@keyframes cfr-ripple { 0% { opacity: .7; transform: scale(.3); } 100% { opacity: 0; transform: scale(1.1); } }
@keyframes cfr-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .cfr__letter, .cfr__flap, .cfr__env, .cfr__badge, .cfr__ripple, .cfr__text, .cfr__action { animation: none; }
  .cfr__letter { transform: translateY(0); }
  .cfr__flap { transform: rotateX(0); z-index: 4; }
  .cfr__badge { transform: scale(1); }
}
</style>
