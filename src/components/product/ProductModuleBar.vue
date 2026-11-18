<template>
  <!-- 模組列：捲過首屏才顯示；外層高度 0 的 sticky 容器，列本身疊在內容上（scroll-margin-top 已預留） -->
  <div class="pp-mbar-holder">
    <nav ref="navEl" class="pp-mbar" :class="{ 'is-shown': shown }" aria-label="功能模組" :inert="!shown || undefined">
      <!-- 膠囊放不下（要橫捲）時才出現目錄鈕 -->
      <button v-if="needToc" type="button" class="pp-mbar__side pp-mbar__toc" @click="$emit('toc', $event.currentTarget)">
        <v-icon size="20">mdi-format-list-bulleted</v-icon><span>目錄</span>
      </button>
      <div class="pp-mbar__mid">
        <div ref="scrollEl" class="pp-mbar__scroll" @scroll.passive="updateFade">
          <ul ref="trackEl" class="pp-mbar__track">
            <template v-for="(g, gi) in groups" :key="g.id">
              <li v-if="gi > 0" class="pp-mbar__sep" aria-hidden="true"></li>
              <li v-for="item in g.items" :key="item.id">
                <button
                  type="button"
                  class="pp-pill"
                  :data-pill="item.id"
                  :aria-current="activeId === item.id ? 'location' : undefined"
                  @click="$emit('go', item.id)"
                ><span>{{ item.nav }}</span></button>
              </li>
            </template>
          </ul>
        </div>
        <span v-show="fadeLeft" class="pp-mbar__fade is-left" aria-hidden="true"></span>
        <span v-show="fadeRight" class="pp-mbar__fade" aria-hidden="true"></span>
      </div>
      <button v-if="mobile" type="button" class="pp-mbar__side pp-mbar__share" aria-label="分享" @click="$emit('share', $event.currentTarget)">
        <v-icon size="22">mdi-share-variant-outline</v-icon>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps({
  groups: { type: Array, required: true }, // [{ id, items: [{ id, nav }] }]
  activeId: { type: String, default: '' },
  shown: { type: Boolean, default: false },
  mobile: { type: Boolean, default: false }, // <768px：右側分享鈕
});
defineEmits(['go', 'toc', 'share']);

const navEl = ref(null);
const scrollEl = ref(null);
const trackEl = ref(null);
const fadeRight = ref(false);
const fadeLeft = ref(false);
const needToc = ref(false);
const SHARE_W = 44;

// 比較膠囊列原本寬度與可用寬度（扣掉手機的分享鈕；目錄鈕本身不影響判斷，避免出現又消失）
const updateToc = () => {
  const nav = navEl.value;
  const track = trackEl.value;
  if (!nav || !track) return;
  const available = nav.clientWidth - (props.mobile ? SHARE_W : 0);
  needToc.value = track.scrollWidth > available + 1;
};
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const updateFade = () => {
  const el = scrollEl.value;
  if (!el) return;
  fadeRight.value = el.scrollWidth - el.clientWidth - el.scrollLeft > 2;
  fadeLeft.value = el.scrollLeft > 2;
};

// 目前項目置中：只改容器的 scrollLeft，不對膠囊呼叫 scrollIntoView（會打斷頁面本身的捲動）
const centerActive = async (smooth = true) => {
  await nextTick();
  const bar = scrollEl.value;
  const pill = bar?.querySelector(`[data-pill="${props.activeId}"]`);
  if (!bar || !pill || bar.scrollWidth <= bar.clientWidth) return;
  const left = pill.offsetLeft - (bar.clientWidth - pill.offsetWidth) / 2;
  bar.scrollTo({ left, behavior: smooth && !reducedMotion ? 'smooth' : 'auto' });
};

watch(() => props.activeId, () => centerActive());
watch(() => props.shown, (v) => { if (v) centerActive(false); });
watch(() => props.mobile, () => nextTick(() => { updateToc(); updateFade(); }));
watch(needToc, () => nextTick(() => { updateFade(); centerActive(false); }));

let ro = null;
onMounted(() => {
  updateToc();
  updateFade();
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => { updateToc(); updateFade(); });
    [navEl.value, scrollEl.value, trackEl.value].forEach((el) => el && ro.observe(el));
  }
});
onBeforeUnmount(() => ro?.disconnect());
</script>

<style scoped>
.pp-mbar-holder {
  position: sticky;
  top: 56px;
  z-index: 20;
  height: 0;
}
.pp-mbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: stretch;
  box-sizing: border-box;
  height: 48px;
  background: #fff;
  border-bottom: 1px solid #E5E7EB;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-6px);
  transition: opacity 0.2s ease, transform 0.2s ease, visibility 0s linear 0.2s;
}
.pp-mbar.is-shown {
  opacity: 1;
  visibility: visible;
  transform: none;
  transition: opacity 0.2s ease, transform 0.2s ease, visibility 0s;
}
.pp-mbar__mid { position: relative; display: flex; flex: 1; min-width: 0; }
.pp-mbar__scroll {
  position: relative; /* 膠囊 offsetLeft 以此為準 */
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.pp-mbar__scroll::-webkit-scrollbar { display: none; }
.pp-mbar__track {
  display: flex;
  align-items: center;
  width: max-content;
  height: 100%;
  margin: 0 auto; /* 放得下就置中，放不下從左開始捲 */
  padding: 0 12px;
  list-style: none;
}
.pp-mbar__track li { display: flex; height: 100%; }
.pp-mbar__sep {
  align-self: center;
  width: 1px;
  height: 20px !important;
  margin: 0 8px;
  background: #E5E7EB;
}
.pp-pill {
  display: flex;
  align-items: center;
  height: 47px; /* 點擊範圍吃滿列高（扣底線） */
  padding: 0 3px;
  border: 0;
  background: transparent;
  color: #4B5563;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}
.pp-pill span {
  display: inline-flex;
  align-items: center;
  height: 34px;
  padding: 0 11px;
  border-radius: 999px;
  transition: background-color 0.2s ease, color 0.2s ease;
}
.pp-pill:hover span { background: #F5F6F8; color: #111827; }
.pp-pill[aria-current] span { background: #111827; color: #fff; }
.pp-pill:focus-visible { outline: none; }
.pp-pill:focus-visible span { outline: 2px solid #2F6BFF; outline-offset: 2px; }
.pp-mbar__side {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 44px;
  height: 100%;
  padding: 0;
  border: 0;
  background: #fff;
  color: #111827;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}
.pp-mbar__toc { padding: 0 12px 0 10px; border-right: 1px solid #E5E7EB; }
.pp-mbar__toc:hover, .pp-mbar__share:hover { background: #F5F6F8; }
.pp-mbar__share { border-left: 1px solid #E5E7EB; }
.pp-mbar__side:focus-visible { outline: 2px solid #2F6BFF; outline-offset: -4px; }
.pp-mbar__fade {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 48px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), #fff 85%);
  pointer-events: none;
}
.pp-mbar__fade.is-left { right: auto; left: 0; width: 32px; background: linear-gradient(270deg, rgba(255, 255, 255, 0), #fff 85%); }

@media (max-width: 767.98px) {
  .pp-mbar-holder { top: 0; }
  .pp-mbar__track { padding: 0 6px; }
  .pp-mbar__toc { padding: 0 10px 0 8px; }
}
/* 手機橫拿：頂欄不 sticky，模組列貼頂 */
@media (max-height: 500px) {
  .pp-mbar-holder { top: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .pp-mbar, .pp-mbar.is-shown { transition: none; transform: none; }
}
@media print {
  .pp-mbar-holder { display: none; }
}
</style>
