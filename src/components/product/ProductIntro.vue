<template>
  <!-- 案場痛點 -->
  <section id="pp-sec-pain" data-sec="pain" class="pp-sec pp-intro pp-pain" aria-labelledby="pp-h-pain">
    <div class="pp-wrap">
      <div v-reveal class="pp-head">
        <p class="pp-eyebrow">案場痛點</p>
        <h2 id="pp-h-pain" class="pp-h2">案場每天都在發生的事</h2>
      </div>
      <div v-reveal="{ group: true }" class="pp-pain__grid">
        <button v-for="p in PAINS" :key="p.title" type="button" class="pp-card pp-pain__card" data-reveal-item @click="$emit('go', p.solve)">
          <span class="pp-ibox"><v-icon size="24">{{ p.icon }}</v-icon></span>
          <span class="pp-pain__title">{{ p.title }}</span>
          <span class="pp-pain__desc"><NwText :text="p.desc" /></span>
          <span class="pp-pain__link">看解法<v-icon size="18">mdi-arrow-right</v-icon></span>
        </button>
      </div>
    </div>
  </section>

  <!-- 全流程總覽 -->
  <section id="pp-sec-flow" data-sec="flow" class="pp-sec pp-intro pp-flow" aria-labelledby="pp-h-flow">
    <div class="pp-wrap">
      <div v-reveal class="pp-head">
        <p class="pp-eyebrow">全流程</p>
        <h2 id="pp-h-flow" class="pp-h2"><span class="pp-line">一個平台，</span><span class="pp-line">串起建案每個階段</span></h2>
      </div>
      <ol v-reveal="{ group: true }" class="pp-flow__list">
        <li v-for="(st, k) in STAGES" :key="st.name" data-reveal-item>
          <button type="button" class="pp-flow__item" @click="$emit('go', STAGE_TARGETS[st.name])">
            <span class="pp-flow__no" aria-hidden="true">{{ String(k + 1).padStart(2, '0') }}</span>
            <span class="pp-ibox"><v-icon size="24">{{ st.icon }}</v-icon></span>
            <span class="pp-flow__text">
              <span class="pp-flow__name">{{ st.name }}</span>
              <!-- 項目不拆開，只在「・」後換行 -->
              <span class="pp-flow__items"><template v-for="(it, i) in st.items" :key="it"><span class="pp-nw">{{ it }}</span><template v-if="i < st.items.length - 1">・<wbr /></template></template></span>
            </span>
            <v-icon class="pp-flow__go" size="20">mdi-arrow-right</v-icon>
          </button>
        </li>
      </ol>
    </div>
  </section>

  <!-- 角色捷徑 -->
  <section id="pp-sec-roles" data-sec="roles" class="pp-sec pp-intro pp-roles" aria-labelledby="pp-h-roles">
    <div class="pp-wrap">
      <div v-reveal class="pp-head">
        <p class="pp-eyebrow">角色捷徑</p>
        <h2 id="pp-h-roles" class="pp-h2">從你的角色開始看</h2>
      </div>
    </div>
    <div class="pp-roles__rail">
      <div v-reveal="{ group: true }" class="pp-roles__grid">
        <article v-for="r in ROLE_SHORTCUTS" :key="r.title" class="pp-card pp-roles__card" data-reveal-item>
          <div class="pp-roles__head">
            <span class="pp-ibox"><v-icon size="24">{{ r.icon }}</v-icon></span>
            <h3 class="pp-roles__title">{{ r.title }}</h3>
          </div>
          <ul class="pp-roles__links">
            <li v-for="l in r.links" :key="l[0]">
              <button type="button" class="pp-roles__link" @click="$emit('go', l[1])">
                <span>{{ l[0] }}</span><v-icon size="18">mdi-arrow-right</v-icon>
              </button>
            </li>
          </ul>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { PAINS, STAGES } from '@/constants/productModules';
import { ROLE_SHORTCUTS, STAGE_TARGETS } from '@/constants/productPage';
import { NwText } from './text';

defineEmits(['go']);
</script>

<style scoped>
/* ───── 痛點 ───── */
.pp-pain__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}
.pp-pain__card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 28px;
  text-align: left;
  cursor: pointer;
}
.pp-pain__title { font-size: 22px; font-weight: 700; line-height: 1.4; color: #111827; }
.pp-pain__desc { flex: 1; font-size: 17px; line-height: 1.8; color: #4B5563; text-wrap: wrap; line-break: strict; }
.pp-pain__link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 15px;
  font-weight: 600;
  color: #1F4FD1;
}
.pp-pain__card:hover .pp-pain__link { text-decoration: underline; }

/* ───── 全流程 ───── */
.pp-flow { background: #F5F6F8; }
.pp-flow__list {
  position: relative;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.pp-flow__list li { display: flex; min-width: 0; }
.pp-flow__item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  width: 100%;
  padding: 24px 20px;
  border: 1px solid #E5E7EB;
  border-radius: 20px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 32px rgba(15, 23, 42, 0.06);
  transition: transform 0.2s ease, border-color 0.2s ease;
}
.pp-flow__item:hover { transform: translateY(-2px); border-color: #2F6BFF; }
.pp-flow__no {
  position: absolute;
  top: 20px;
  right: 20px;
  font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;
  font-size: 14px;
  font-weight: 600;
  color: #4B5563;
  font-variant-numeric: tabular-nums;
}
.pp-flow__text { display: flex; flex-direction: column; gap: 8px; }
.pp-flow__name { font-size: 22px; font-weight: 700; line-height: 1.4; color: #111827; }
.pp-flow__items { font-size: 15px; line-height: 1.7; color: #4B5563; text-wrap: wrap; }
.pp-flow__go { margin-top: auto; color: #1F4FD1; }

/* ───── 角色捷徑 ───── */
.pp-roles__rail { width: min(1200px, 100% - 48px); margin: 0 auto; }
.pp-roles__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}
.pp-roles__card { display: flex; flex-direction: column; gap: 16px; padding: 24px; }
.pp-roles__head { display: flex; align-items: center; gap: 12px; }
.pp-roles__title { margin: 0; font-size: 20px; font-weight: 700; line-height: 1.4; }
.pp-roles__links { display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none; border-top: 1px solid #E5E7EB; }
.pp-roles__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-height: 48px;
  padding: 8px 0;
  border: 0;
  border-bottom: 1px solid #E5E7EB;
  background: transparent;
  color: #111827;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
  text-align: left;
  cursor: pointer;
}
.pp-roles__link .v-icon { flex: none; color: #1F4FD1; transition: transform 0.2s ease; }
.pp-roles__link:hover { color: #1F4FD1; }
.pp-roles__link:hover .v-icon { transform: translateX(2px); }
.pp-roles__links li:last-child .pp-roles__link { border-bottom: 0; }

/* ───── 平板 ───── */
@media (max-width: 1099.98px) {
  .pp-pain__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .pp-flow__list { grid-template-columns: minmax(0, 1fr); gap: 12px; }
  .pp-flow__item { flex-direction: row; align-items: center; gap: 16px; padding: 16px 20px; }
  .pp-flow__no { position: static; order: -1; }
  .pp-flow__text { flex: 1; min-width: 0; gap: 2px; }
  .pp-flow__name { font-size: 19px; }
  .pp-flow__go { margin-top: 0; }
  .pp-roles__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .pp-roles__rail { width: min(1200px, 100% - 64px); }
}

/* ───── 手機：三段合計壓在 1,900px 內 ───── */
@media (max-width: 767.98px) {
  .pp-intro { padding: 48px 0; }
  .pp-intro :deep(.pp-head) { margin-bottom: 24px; }
  .pp-pain__grid { gap: 12px; }
  .pp-pain__card { gap: 8px; padding: 16px 14px 10px; border-radius: 16px; }
  .pp-pain__title { font-size: 16px; line-height: 1.45; }
  .pp-pain__desc { display: none; }
  .pp-pain__link { min-height: 32px; margin-top: auto; font-size: 14px; }

  .pp-flow__list { gap: 8px; }
  .pp-flow__item { gap: 12px; min-height: 64px; padding: 10px 12px; border-radius: 14px; box-shadow: none; }
  .pp-flow__no { display: none; }
  .pp-flow__name { font-size: 16px; line-height: 1.4; }
  .pp-flow__items { font-size: 13px; line-height: 1.5; }

  .pp-roles__rail { width: 100%; }
  .pp-roles__grid {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-padding: 0 20px;
    padding: 4px 20px 12px;
    scrollbar-width: none;
  }
  .pp-roles__grid::-webkit-scrollbar { display: none; }
  .pp-roles__card { flex: 0 0 78vw; scroll-snap-align: start; gap: 8px; padding: 16px; }
  .pp-roles__title { font-size: 17px; }
  .pp-roles__link { min-height: 44px; padding: 6px 0; font-size: 15px; }
}
/* 小手機：痛點標題 8 字要放得下一行（不讓最後一個字單獨換行） */
@media (max-width: 379.98px) {
  .pp-pain__title { font-size: 15px; letter-spacing: -0.01em; }
}
</style>
