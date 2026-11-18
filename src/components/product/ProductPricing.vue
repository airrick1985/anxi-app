<template>
  <section id="pp-sec-pricing" data-sec="pricing" class="pp-sec pp-pricing" aria-labelledby="pp-h-pricing">
    <div class="pp-wrap">
      <div v-reveal class="pp-head pp-head--center">
        <p class="pp-eyebrow">方案價格</p>
        <h2 id="pp-h-pricing" class="pp-h2"><span class="pp-line">依需求選擇，</span><span class="pp-line">先試用再決定</span></h2>
      </div>

      <div class="pp-tabs" role="tablist" aria-label="系統" @keydown="onTabKey">
        <button
          v-for="t in PLAN_TABS"
          :id="`pp-tab-${t.id}`"
          :key="t.id"
          type="button"
          role="tab"
          class="pp-tab"
          :aria-selected="active === t.id ? 'true' : 'false'"
          :aria-controls="`pp-tabpanel-${t.id}`"
          :tabindex="active === t.id ? 0 : -1"
          @click="active = t.id"
        >
          <v-icon size="18">{{ t.icon }}</v-icon>{{ t.name }}
        </button>
      </div>

      <div
        :id="`pp-tabpanel-${active}`"
        class="pp-tabpanel"
        role="tabpanel"
        :aria-labelledby="`pp-tab-${active}`"
      >
        <div class="pp-plans" :class="`pp-plans--${plan.pricing.length}`">
          <article v-for="p in plan.pricing" :key="p.name" class="pp-card pp-plan" :class="{ 'is-hot': p.isRecommended }">
            <span v-if="p.badge" class="pp-plan__badge">{{ p.badge }}</span>
            <h3 class="pp-plan__name">{{ p.name }}</h3>
            <p class="pp-plan__sub">{{ p.subName }}</p>
            <p class="pp-plan__price"><b>{{ p.price }}</b><small v-if="p.unit"> / {{ p.unit }}</small></p>
            <p v-if="p.priceNote" class="pp-plan__note">{{ p.priceNote }}</p>
            <p class="pp-plan__desc"><NwText :text="p.desc" /></p>
            <a
              v-if="askLine(p)"
              class="pp-btn pp-btn--block"
              :class="p.isRecommended ? 'pp-btn--primary' : 'pp-btn--ghost'"
              :href="LINE_URL"
              target="_blank"
              rel="noopener"
            ><v-icon size="18">mdi-chat-outline</v-icon>LINE 洽詢</a>
            <button
              v-else
              type="button"
              class="pp-btn pp-btn--block"
              :class="p.isRecommended ? 'pp-btn--primary' : 'pp-btn--ghost'"
              @click="$emit('trial', 'product-pricing')"
            >免費試用</button>
          </article>
        </div>
        <div class="pp-notes" :class="`pp-notes--${plan.pricing.length}`">
          <p class="pp-notes__title"><v-icon size="18">mdi-information-outline</v-icon>備註</p>
          <ul>
            <li v-for="n in plan.notes" :key="n">{{ n }}</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue';
import { PRODUCT_PLANS } from '@/constants/productPlans';
import { PLAN_TABS, LINE_URL } from '@/constants/productModules';
import { NwText } from './text';

defineEmits(['trial']);

const active = ref(PLAN_TABS[0].id);
const plan = computed(() => PRODUCT_PLANS[active.value]);
// 形象網站（客製設計）與「請洽詢報價」的方案，按鈕改 LINE 洽詢
const askLine = (p) => active.value === 'website' || p.price === '請洽詢報價';

// 分頁鍵盤操作：左右鍵切換
const onTabKey = async (e) => {
  const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
  let i = PLAN_TABS.findIndex((t) => t.id === active.value);
  if (keys[e.key]) i = (i + keys[e.key] + PLAN_TABS.length) % PLAN_TABS.length;
  else if (e.key === 'Home') i = 0;
  else if (e.key === 'End') i = PLAN_TABS.length - 1;
  else return;
  e.preventDefault();
  active.value = PLAN_TABS[i].id;
  await nextTick();
  document.getElementById(`pp-tab-${active.value}`)?.focus();
};
</script>

<style scoped>
.pp-pricing { background: #F5F6F8; }
.pp-tabs {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin: 0 0 32px;
}
.pp-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 18px;
  border: 1px solid #E5E7EB;
  border-radius: 999px;
  background: #fff;
  color: #4B5563;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
.pp-tab:hover { color: #111827; border-color: #C7CBD3; }
.pp-tab[aria-selected='true'] { background: #111827; border-color: #111827; color: #fff; }

.pp-plans {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  max-width: 1000px;
  margin: 0 auto;
}
.pp-plans--2 { grid-template-columns: repeat(2, minmax(0, 1fr)); max-width: 760px; }
.pp-plans--1 { grid-template-columns: minmax(0, 1fr); max-width: 420px; }
.pp-plan {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 32px 28px 28px;
}
.pp-plan.is-hot { border: 2px solid #2F6BFF; padding: 31px 27px 27px; }
.pp-plan__badge {
  position: absolute;
  top: -13px;
  left: 26px;
  padding: 3px 12px;
  border-radius: 999px;
  background: #2F6BFF;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.6;
}
.pp-plan__name { margin: 0; font-size: 22px; font-weight: 700; line-height: 1.4; }
.pp-plan__sub { margin: 2px 0 0; font-size: 14px; line-height: 1.6; color: #4B5563; }
.pp-plan__price { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px; margin: 20px 0 0; }
.pp-plan__price b { font-size: 34px; font-weight: 700; line-height: 1.2; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.pp-plan__price small { font-size: 16px; color: #4B5563; }
.pp-plan__note { margin: 4px 0 0; font-size: 14px; font-weight: 600; line-height: 1.6; color: #1F4FD1; }
.pp-plan__desc { flex: 1; margin: 14px 0 24px; font-size: 16px; line-height: 1.8; color: #4B5563; }

.pp-notes {
  max-width: 1000px;
  margin: 28px auto 0;
  padding: 20px 24px;
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  background: #fff;
}
.pp-notes--2 { max-width: 760px; }
.pp-notes__title { display: flex; align-items: center; gap: 6px; margin: 0 0 6px; font-size: 15px; font-weight: 700; color: #111827; }
.pp-notes ul { margin: 0; padding-left: 20px; font-size: 15px; line-height: 1.8; color: #4B5563; }

@media (max-width: 1099.98px) {
  .pp-plans, .pp-plans--2 { grid-template-columns: minmax(0, 1fr); max-width: 520px; }
  .pp-notes, .pp-notes--2 { max-width: 520px; }
}
@media (max-width: 767.98px) {
  .pp-tabs { gap: 8px; margin-bottom: 28px; }
  .pp-tab { padding: 0 14px; font-size: 14px; }
  .pp-plan { padding: 28px 20px 20px; }
  .pp-plan.is-hot { padding: 27px 19px 19px; }
  .pp-notes { padding: 16px 18px; }
  .pp-notes ul { font-size: 14px; }
}
</style>
