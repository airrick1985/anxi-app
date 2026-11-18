<template>
  <section id="pp-sec-why" data-sec="why" class="pp-sec pp-why" aria-labelledby="pp-h-why">
    <div class="pp-wrap">
      <div v-reveal class="pp-head">
        <p class="pp-eyebrow">為什麼選 ANXI</p>
        <h2 id="pp-h-why" class="pp-h2">好導入、好上手、持續進化</h2>
      </div>
      <div v-reveal="{ group: true }" class="pp-why__grid">
        <article v-for="r in REASONS" :key="r.title" class="pp-card pp-why__card" data-reveal-item>
          <span class="pp-ibox"><v-icon size="24">{{ r.icon }}</v-icon></span>
          <h3 class="pp-why__title">{{ r.title }}</h3>
          <p class="pp-why__desc"><NwText :text="r.desc" /></p>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { REASONS } from '@/constants/productModules';
import { NwText } from './text';
</script>

<style scoped>
.pp-why { border-top: 1px solid #E5E7EB; }
.pp-why__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}
.pp-why__card { display: flex; flex-direction: column; gap: 12px; padding: 28px; }
.pp-why__title { margin: 4px 0 0; font-size: 22px; font-weight: 700; line-height: 1.4; }
.pp-why__desc { margin: 0; font-size: 17px; line-height: 1.8; color: #4B5563; }

@media (max-width: 1099.98px) {
  .pp-why__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 767.98px) {
  .pp-why__grid { grid-template-columns: minmax(0, 1fr); gap: 12px; }
  .pp-why__card { display: grid; grid-template-columns: 44px minmax(0, 1fr); column-gap: 14px; row-gap: 2px; padding: 18px; }
  .pp-why__card .pp-ibox { grid-row: span 2; }
  .pp-why__title { margin: 0; font-size: 19px; }
  .pp-why__desc { font-size: 16px; }
}
</style>
