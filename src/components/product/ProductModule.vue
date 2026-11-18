<template>
  <section
    :id="`pp-sec-${mod.id}`"
    :data-sec="mod.id"
    class="pp-mod"
    :class="[`is-${tone}`, { 'is-reverse': reverse, 'is-compact': !visual }]"
    :aria-labelledby="`pp-h-${mod.id}`"
  >
    <div class="pp-wrap pp-mod__grid">
      <div v-reveal="{ group: true }" class="pp-mod__text">
        <div class="pp-mod__no" aria-hidden="true" data-reveal-item>{{ number }}</div>
        <div class="pp-mod__eyebrow" data-reveal-item>
          <p class="pp-mod__eyebrow-text"><span class="pp-ibox"><v-icon size="24">{{ mod.icon }}</v-icon></span>{{ mod.eyebrow }}</p>
          <button type="button" class="pp-mod__link" :aria-label="`複製「${mod.nav}」連結`" title="複製連結" @click="$emit('copy-link', mod.id)">
            <v-icon size="20">mdi-link-variant</v-icon>
          </button>
        </div>
        <h3 :id="`pp-h-${mod.id}`" class="pp-h2 pp-mod__title" data-reveal-item>
          <span v-for="line in titleLines(mod.title)" :key="line" class="pp-line">{{ line }}</span>
        </h3>
        <ul :id="listId" class="pp-points" :class="{ 'is-open': expanded }" data-reveal-item>
          <li v-for="(pt, k) in points" :key="pt[0]" class="pp-point" :class="{ 'is-extra': k >= PREVIEW_COUNT }">
            <v-icon class="pp-point__icon" size="22">mdi-check-circle-outline</v-icon>
            <div>
              <h4 class="pp-point__title">{{ pt[0] }}</h4>
              <p class="pp-point__desc"><NwText :text="pt[1]" /></p>
            </div>
          </li>
        </ul>
        <button
          v-if="points.length > PREVIEW_COUNT"
          type="button"
          class="pp-more"
          :aria-expanded="expanded ? 'true' : 'false'"
          :aria-controls="listId"
          data-reveal-item
          @click="$emit('toggle', mod.id)"
        >
          {{ expanded ? '收合' : `看全部 ${points.length} 項` }}
          <v-icon size="20">{{ expanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
        </button>
      </div>

      <div v-if="visual" v-reveal="{ delay: 120 }" class="pp-mod__visual" :class="`pp-vis--${layout}`">
        <template v-if="layout === 'pair'">
          <ProductMock :kind="visual.mock" class="pp-vis__mock" />
          <div class="pp-vis__phone">
            <ProductShot :shot-key="visual.shots[0]" @open="(k, el) => $emit('open-shot', k, el)" />
          </div>
        </template>
        <template v-else-if="layout === 'mock'">
          <ProductMock :kind="visual.mock" />
        </template>
        <div v-else-if="layout === 'duo'" class="pp-duo">
          <div class="pp-duo__back"><ProductShot :shot-key="visual.shots[0]" @open="(k, el) => $emit('open-shot', k, el)" /></div>
          <div class="pp-duo__front"><ProductShot :shot-key="visual.shots[1]" @open="(k, el) => $emit('open-shot', k, el)" /></div>
        </div>
        <template v-else>
          <ProductShot :shot-key="visual.shots[0]" @open="(k, el) => $emit('open-shot', k, el)" />
        </template>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import ProductMock from './ProductMock.vue';
import ProductShot from './ProductShot.vue';
import { NwText } from './text';

const PREVIEW_COUNT = 4; // <1100px 預設顯示前 4 項

const props = defineProps({
  mod: { type: Object, required: true },
  more: { type: Array, default: () => [] },
  visual: { type: Object, default: null },
  index: { type: Number, required: true },
  tone: { type: String, default: 'white' },
  reverse: { type: Boolean, default: false },
  expanded: { type: Boolean, default: false },
});
defineEmits(['toggle', 'copy-link', 'open-shot']);

const number = computed(() => String(props.index + 1).padStart(2, '0'));
const points = computed(() => [...props.mod.points, ...props.more]);
const listId = computed(() => `pp-points-${props.mod.id}`);
const layout = computed(() => {
  const v = props.visual;
  if (!v) return '';
  if (v.mock && v.shots?.length) return 'pair';
  if (v.mock) return 'mock';
  if (v.shots?.length > 1) return 'duo';
  return 'shot';
});
const titleLines = (t) => t.replace(/，/g, '，\n').split('\n'); // 中文標題在逗號後斷行
</script>

<style scoped>
.pp-mod {
  padding: 112px 0;
  scroll-margin-top: 112px;
}
.pp-mod.is-soft { background: #F5F6F8; }
.pp-mod__grid {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  gap: 64px;
  align-items: start;
}
.pp-mod.is-reverse .pp-mod__grid { grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); }
.pp-mod.is-reverse .pp-mod__text { order: 2; }
.pp-mod.is-reverse .pp-mod__visual { order: 1; }
.pp-mod__text { min-width: 0; }
.pp-mod__visual {
  position: sticky; /* 長模組時示意圖跟著讀者往下走（祖先只有 overflow: clip，不影響 sticky） */
  top: 136px; /* 頂欄 56＋模組列 48＋留白 */
  align-self: start;
  min-width: 0;
}

.pp-mod__no {
  margin-bottom: 12px;
  font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;
  font-size: 64px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.04em;
  color: rgba(17, 24, 39, 0.08);
  font-variant-numeric: tabular-nums;
  user-select: none;
}
.pp-mod__eyebrow {
  display: flex;
  align-items: center;
  gap: 0; /* 連結圖示緊接在眉標文字後，視覺間距約 8px（按鈕本身 44px 點擊範圍） */
  margin: 0 0 16px;
}
.pp-mod__eyebrow-text {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  color: #1F4FD1;
}
.pp-mod__title { margin: 0 0 28px; color: #111827; }
.pp-mod__link {
  flex: none;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-left: -4px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: #4B5563;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}
.pp-mod__link:hover { background: rgba(47, 107, 255, 0.08); color: #1F4FD1; }

.pp-points { list-style: none; margin: 0; padding: 0; border-top: 1px solid #E5E7EB; }
.pp-point {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  gap: 14px;
  padding: 18px 0;
  border-bottom: 1px solid #E5E7EB;
}
.pp-point__icon { margin-top: 3px; color: #2F6BFF; }
.pp-point__title { margin: 0 0 4px; font-size: 22px; font-weight: 700; line-height: 1.4; letter-spacing: -0.01em; }
.pp-point__desc { margin: 0; font-size: 17px; line-height: 1.8; color: #4B5563; text-wrap: wrap; line-break: strict; word-break: auto-phrase; }

.pp-more {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 44px;
  margin-top: 12px;
  padding: 0 12px 0 0;
  border: 0;
  background: transparent;
  color: #1F4FD1;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.pp-more:hover { text-decoration: underline; }

/* 示意圖排列 */
.pp-vis--pair {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(150px, 30%);
  gap: 24px;
  align-items: center;
}
.pp-duo { position: relative; padding-bottom: 18%; }
.pp-duo__back { width: 80%; }
.pp-duo__front { position: absolute; right: 0; bottom: 0; width: 72%; }

/* 精簡版型（無示意圖） */
.pp-mod.is-compact { padding: 96px 0; }
.pp-mod.is-compact .pp-mod__grid { grid-template-columns: minmax(0, 1fr); }
.pp-mod.is-compact .pp-points { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0 32px; border-top: 0; }
.pp-mod.is-compact .pp-point { border-top: 1px solid #E5E7EB; border-bottom: 0; }

@media (min-width: 1100px) {
  .pp-more { display: none; }
}
@media (max-width: 1099.98px) {
  .pp-mod__grid, .pp-mod.is-reverse .pp-mod__grid { grid-template-columns: minmax(0, 1fr); gap: 48px; }
  .pp-mod.is-reverse .pp-mod__text, .pp-mod.is-reverse .pp-mod__visual { order: 0; }
  .pp-mod__visual { position: static; width: 100%; max-width: 720px; margin: 0 auto; }
  .pp-points:not(.is-open) .is-extra { display: none; }
  .pp-mod.is-compact .pp-points { grid-template-columns: minmax(0, 1fr); }
  .pp-mod.is-compact .pp-point:last-child { border-bottom: 1px solid #E5E7EB; }
}
@media (max-width: 767.98px) {
  .pp-mod { padding: 64px 0; scroll-margin-top: 64px; }
  .pp-mod.is-compact { padding: 64px 0; }
  .pp-mod__grid { gap: 36px; }
  .pp-mod__no { font-size: 44px; margin-bottom: 8px; }
  .pp-mod__title { margin-bottom: 20px; }
  .pp-point { gap: 12px; padding: 16px 0; }
  .pp-point__icon { margin-top: 2px; }
  .pp-point__title { font-size: 19px; }
  .pp-point__desc { font-size: 16px; }
  .pp-vis--pair { grid-template-columns: minmax(0, 1fr); gap: 24px; }
  .pp-vis__phone { width: min(220px, 62%); margin: 0 auto; }
}
/* 手機橫拿（矮螢幕）：頂欄不 sticky，深連結時標題要落在畫面上半部 */
@media (max-height: 500px) {
  .pp-mod { padding-top: 20px; scroll-margin-top: 48px; }
  .pp-mod__no { font-size: 32px; margin-bottom: 2px; }
  .pp-mod__eyebrow { margin-bottom: 8px; }
}
@media print {
  .pp-mod { padding: 32px 0; break-inside: avoid-page; }
  .pp-mod__visual { position: static; }
  .pp-mod__link, .pp-more { display: none !important; }
  .pp-points .is-extra { display: grid !important; }
}
</style>
