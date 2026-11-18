<template>
  <section id="pp-sec-faq" data-sec="faq" class="pp-sec pp-faq" aria-labelledby="pp-h-faq">
    <div class="pp-wrap pp-faq__wrap">
      <div v-reveal class="pp-head">
        <p class="pp-eyebrow">常見問題</p>
        <h2 id="pp-h-faq" class="pp-h2">導入前，大家常問</h2>
      </div>
      <ul class="pp-faq__list">
        <li v-for="(f, k) in FAQS" :key="f.q" class="pp-faq__item" :class="{ 'is-open': open[k] }">
          <h3 class="pp-faq__q">
            <button
              :id="`pp-faq-q-${k}`"
              type="button"
              :aria-expanded="open[k] ? 'true' : 'false'"
              :aria-controls="`pp-faq-a-${k}`"
              @click="open[k] = !open[k]"
            >
              <span>{{ f.q }}</span>
              <v-icon size="22" class="pp-faq__icon">mdi-plus</v-icon>
            </button>
          </h3>
          <div v-show="open[k]" :id="`pp-faq-a-${k}`" class="pp-faq__a" role="region" :aria-labelledby="`pp-faq-q-${k}`">
            <p><NwText :text="f.a" /></p>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup>
import { reactive } from 'vue';
import { FAQS } from '@/constants/productPage';
import { NwText } from './text';

// 可同時開多題，預設全收
const open = reactive(FAQS.map(() => false));
</script>

<style scoped>
.pp-faq__wrap { display: grid; grid-template-columns: minmax(0, 4fr) minmax(0, 8fr); gap: 64px; align-items: start; }
.pp-faq__wrap > .pp-head { position: sticky; top: 136px; }
.pp-faq__list { margin: 0; padding: 0; list-style: none; border-top: 1px solid #E5E7EB; }
.pp-faq__item { border-bottom: 1px solid #E5E7EB; }
.pp-faq__q { margin: 0; }
.pp-faq__q button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  min-height: 64px;
  padding: 14px 0;
  border: 0;
  background: transparent;
  color: #111827;
  font-size: 19px;
  font-weight: 700;
  line-height: 1.5;
  text-align: left;
  cursor: pointer;
}
.pp-faq__q button:hover { color: #1F4FD1; }
.pp-faq__icon { flex: none; color: #4B5563; transition: transform 0.2s ease; }
.pp-faq__item.is-open .pp-faq__icon { transform: rotate(45deg); color: #1F4FD1; }
.pp-faq__a p { margin: 0; padding: 0 40px 20px 0; font-size: 17px; line-height: 1.8; color: #4B5563; }

@media (max-width: 1099.98px) {
  .pp-faq__wrap { grid-template-columns: minmax(0, 1fr); gap: 0; }
  .pp-faq__wrap > .pp-head { position: static; }
}
@media (max-width: 767.98px) {
  .pp-faq__q button { min-height: 56px; font-size: 17px; }
  .pp-faq__a p { padding-right: 0; font-size: 16px; }
}
@media print {
  .pp-faq__a { display: block !important; }
  .pp-faq__icon { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .pp-faq__icon { transition: none; }
}
</style>
