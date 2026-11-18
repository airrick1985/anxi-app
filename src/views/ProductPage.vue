<template>
  <div class="pp" lang="zh-Hant">
    <!-- 頂欄：≥768px sticky；<768px 隨頁面捲走 -->
    <header class="pp-top" :class="{ 'is-solid': topSolid }">
      <div class="pp-wrap pp-top__in">
        <button type="button" class="pp-brand" aria-label="ANXI 安熙智慧，回到頁首" @click="goSection('top', { focus: true })">
          <img :src="topSolid ? logoUrl : logoWhiteUrl" alt="" width="800" height="576" />
          <span>ANXI 安熙智慧</span>
        </button>
        <nav class="pp-top__acts" aria-label="頁首">
          <a v-if="!isMobile" class="pp-top__link" :href="pricingHref" @click.prevent="goSection('pricing', { focus: true })">方案價格</a>
          <router-link v-if="!isMobile" class="pp-top__link" :to="{ name: 'ProductDeck', query: utmQuery }">簡報模式</router-link>
          <button type="button" class="pp-iconbtn" aria-label="分享" @click="openShare($event.currentTarget)">
            <v-icon size="22">mdi-share-variant-outline</v-icon>
          </button>
          <button type="button" class="pp-btn pp-btn--primary pp-btn--sm" @click="goTrial('product-top')">免費試用</button>
        </nav>
      </div>
    </header>

    <ProductHero :pricing-href="pricingHref" @trial="goTrial" @open-shot="openShot" @pricing="goSection('pricing', { focus: true })" />

    <main class="pp-main">
      <ProductModuleBar
        :groups="barGroups"
        :active-id="activeId"
        :shown="pastHero"
        :mobile="isMobile"
        @go="(id) => goSection(id)"
        @toc="openToc"
        @share="openShare"
      />

      <ProductIntro @go="(id) => goSection(id, { focus: true })" />

      <template v-for="g in groupList" :key="g.id">
        <div class="pp-band">
          <div class="pp-wrap pp-band__in">
            <h2 class="pp-band__name">{{ g.name }}</h2>
            <p class="pp-band__list">{{ g.navs.join('・') }}</p>
          </div>
        </div>
        <ProductModule
          v-for="(id, k) in g.modules"
          :key="id"
          :mod="PRODUCT_MODULES[id]"
          :more="MODULE_MORE[id] || []"
          :visual="MODULE_VISUALS[id]"
          :index="MODULE_ORDER.indexOf(id)"
          :tone="k % 2 ? 'soft' : 'white'"
          :reverse="k % 2 === 1"
          :expanded="!!expanded[id]"
          @toggle="toggleExpand"
          @copy-link="copyModuleLink"
          @open-shot="openShot"
        />
      </template>

      <ProductWhy />
      <ProductPricing @trial="goTrial" />
      <ProductFaq />
      <ProductStart :qr-data-url="trialQr" :mobile="isMobile" @trial="goTrial" />
    </main>

    <ProductFooter :utm-query="utmQuery" />

    <!-- 手機底部 CTA 列：捲過首屏才出現，最終區與頁尾進入畫面時隱藏 -->
    <div v-if="isMobile" class="pp-ctabar" :class="{ 'is-shown': showCtaBar }" :inert="!showCtaBar || undefined">
      <a class="pp-btn pp-btn--ghost" :href="LINE_URL" target="_blank" rel="noopener"><v-icon size="18">mdi-chat-outline</v-icon>LINE 洽詢</a>
      <button type="button" class="pp-btn pp-btn--primary" @click="goTrial('product-bar')">免費試用</button>
    </div>

    <!-- 目錄（<1100px） -->
    <ProductSheet ref="tocSheet" v-model="tocOpen" title="目錄" :return-focus="tocTrigger">
      <nav class="pp-toc" aria-label="目錄">
        <section v-for="g in tocGroups" :key="g.id" class="pp-toc__group">
          <h3 class="pp-toc__gname">{{ g.name }}</h3>
          <ul>
            <li v-for="item in g.items" :key="item.id">
              <button
                type="button"
                class="pp-toc__item"
                :aria-current="activeId === item.id ? 'location' : undefined"
                @click="tocGo(item.id)"
              >
                <span class="pp-toc__no" aria-hidden="true">{{ item.no }}</span>
                <span class="pp-toc__name">{{ item.nav }}</span>
                <v-icon v-if="activeId === item.id" size="20" class="pp-toc__check">mdi-check</v-icon>
              </button>
            </li>
          </ul>
        </section>
      </nav>
    </ProductSheet>

    <!-- 分享 -->
    <ProductSheet v-model="shareOpen" title="分享" :return-focus="shareTrigger">
      <ProductShare :url="shareUrl" :label="SECTION_LABELS[shareId] || ''" />
    </ProductSheet>

    <ProductLightbox :shot-key="lightboxKey" @close="closeShot" />

    <div class="pp-toast" role="status" aria-live="polite">
      <transition name="pp-toast"><span v-if="toast" class="pp-toast__msg">{{ toast }}</span></transition>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { PRODUCT_MODULES, LINE_URL } from '@/constants/productModules';
import { MODULE_GROUPS, MODULE_ORDER, MODULE_MORE, MODULE_VISUALS, EXTRA_NAV, SECTION_IDS } from '@/constants/productPage';
import { copyText } from '@/utils/copyText';
import ProductHero from '@/components/product/ProductHero.vue';
import ProductModuleBar from '@/components/product/ProductModuleBar.vue';
import ProductIntro from '@/components/product/ProductIntro.vue';
import ProductModule from '@/components/product/ProductModule.vue';
import ProductWhy from '@/components/product/ProductWhy.vue';
import ProductPricing from '@/components/product/ProductPricing.vue';
import ProductFaq from '@/components/product/ProductFaq.vue';
import ProductStart from '@/components/product/ProductStart.vue';
import ProductFooter from '@/components/product/ProductFooter.vue';
import ProductSheet from '@/components/product/ProductSheet.vue';
import ProductShare from '@/components/product/ProductShare.vue';
import ProductLightbox from '@/components/product/ProductLightbox.vue';
import { makeQr } from '@/components/product/qr';
import '@/components/product/productBase.css'; // 本頁共用樣式（含 PublicLayout sticky 修正）
import logoUrl from '@/assets/landing/anxi-logo.webp';
import logoWhiteUrl from '@/assets/landing/anxi-logo-white.webp';

const route = useRoute();
const router = useRouter();

const pad = (n) => String(n).padStart(2, '0');

// ---------------------------------------------------------------
// 斷點：手機 <768、平板 768–1099、桌機 ≥1100
// ---------------------------------------------------------------
const mqMobile = window.matchMedia('(max-width: 767.98px)');
const mqShort = window.matchMedia('(max-height: 500px)'); // 手機橫拿：頂欄不 sticky
const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const isMobile = ref(mqMobile.matches);
const isShort = ref(mqShort.matches);
const reduceMotion = ref(mqReduce.matches);
const onMediaChange = () => {
  isMobile.value = mqMobile.matches;
  isShort.value = mqShort.matches;
  reduceMotion.value = mqReduce.matches;
  measure();
};

// ---------------------------------------------------------------
// 章節資料
// ---------------------------------------------------------------
const groupList = MODULE_GROUPS.map((g) => ({ ...g, navs: g.modules.map((id) => PRODUCT_MODULES[id].nav) }));
const barGroups = [
  ...MODULE_GROUPS.map((g) => ({ id: g.id, items: g.modules.map((id) => ({ id, nav: PRODUCT_MODULES[id].nav })) })),
  { id: 'extra', items: EXTRA_NAV },
];
const tocGroups = [
  ...MODULE_GROUPS.map((g) => ({
    id: g.id,
    name: g.name,
    items: g.modules.map((id) => ({ id, nav: PRODUCT_MODULES[id].nav, no: pad(MODULE_ORDER.indexOf(id) + 1) })),
  })),
  { id: 'extra', name: '方案與問題', items: EXTRA_NAV.map((x) => ({ ...x, no: '' })) },
];
const SECTION_LABELS = {
  top: '產品介紹',
  pain: '案場痛點',
  flow: '全流程總覽',
  roles: '角色捷徑',
  why: '為什麼選 ANXI',
  pricing: '方案價格',
  faq: '常見問題',
  start: '開始試用',
  ...Object.fromEntries(MODULE_ORDER.map((id) => [id, PRODUCT_MODULES[id].nav])),
};
const isSection = (id) => typeof id === 'string' && SECTION_IDS.includes(id);
const sectionEl = (id) => document.getElementById(`pp-sec-${id}`);

// ---------------------------------------------------------------
// 試用連結與分享網址：一律保留目前網址上的 utm_*
// ---------------------------------------------------------------
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign'];
const utmQuery = computed(() => {
  const q = {};
  UTM_KEYS.forEach((k) => {
    const v = route.query[k];
    const s = Array.isArray(v) ? v[0] : v;
    if (s) q[k] = String(s);
  });
  return q;
});
const goTrial = (source) => router.push({ name: 'TrialSignup', query: { source, ...utmQuery.value } });
const absUrl = (to) => new URL(router.resolve(to).href, window.location.href).href;
const sectionUrl = (id) => absUrl({ name: 'ProductPage', params: id && id !== 'top' ? { section: id } : {}, query: utmQuery.value });
const pricingHref = computed(() => router.resolve({ name: 'ProductPage', params: { section: 'pricing' }, query: utmQuery.value }).href);

// ---------------------------------------------------------------
// 看全部（<1100px 預設只顯示前 4 項）
// ---------------------------------------------------------------
const expanded = reactive({});
const toggleExpand = (id) => { expanded[id] = !expanded[id]; };

// ---------------------------------------------------------------
// 捲動狀態：頂欄底色、模組列與底部列顯示
// ---------------------------------------------------------------
const scrolled = ref(false);
const pastHero = ref(false);
const endVisible = ref(false);
const topSticky = computed(() => !isMobile.value && !isShort.value);
const topSolid = computed(() => scrolled.value && topSticky.value);
const showCtaBar = computed(() => pastHero.value && !endVisible.value);

const measure = () => {
  scrolled.value = window.scrollY > 8;
  const hero = sectionEl('top');
  if (hero) pastHero.value = hero.getBoundingClientRect().bottom <= (topSticky.value ? 56 : 0) + 1;
};
let measureRaf = 0;
const onScroll = () => {
  if (measureRaf) return;
  measureRaf = requestAnimationFrame(() => { measureRaf = 0; measure(); });
};

// ---------------------------------------------------------------
// scrollspy 與網址（docs/SPEC_ProductPage.md §6）
// spy 先設 activeId，再防抖 250ms 以 router.replace 同步網址；
// 網址監聽只在「新值不是 spy 自己寫的、且 ≠ activeId」時才捲動，避免把使用者拉回章節頂。
// ---------------------------------------------------------------
const activeId = ref('top');
const intersecting = new Set();
let spyPaused = false;
let spyIo = null;

const pickActive = () => {
  const id = SECTION_IDS.find((s) => intersecting.has(s));
  if (id && id !== activeId.value) activeId.value = id;
};

const setupSpy = () => {
  spyIo = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const id = e.target.dataset.sec;
      if (e.isIntersecting) intersecting.add(id);
      else intersecting.delete(id);
    });
    if (!spyPaused) pickActive();
  }, { rootMargin: '-35% 0px -64% 0px' });
  document.querySelectorAll('.pp [data-sec]').forEach((el) => spyIo.observe(el));
};

let urlTimer = 0;
let spyWrote = null; // spy 最近一次寫進網址的 section（'' 代表首屏）
const currentParam = () => {
  const v = route.params.section;
  return typeof v === 'string' ? v : '';
};
const syncUrl = () => {
  const want = activeId.value === 'top' ? '' : activeId.value;
  if (want === currentParam()) return;
  spyWrote = want;
  router.replace({ name: 'ProductPage', params: want ? { section: want } : {}, query: route.query }).catch(() => {});
};
watch(activeId, () => {
  clearTimeout(urlTimer);
  urlTimer = setTimeout(syncUrl, 250);
});

// 只處理手改網址、上一頁／下一頁；不可每次網址變動都捲動（spy 寫網址也會觸發）
watch(() => route.params.section, (sec) => {
  if (route.name !== 'ProductPage') return;
  const val = typeof sec === 'string' ? sec : '';
  if (val === spyWrote) return;
  spyWrote = null;
  const id = isSection(val) ? val : 'top';
  if (id !== activeId.value) goSection(id, { smooth: !reduceMotion.value });
});

// 程式捲動期間暫停 spy：直到 scrollend 或連續 150ms 沒有 scroll，上限 2.5 秒
let resumeCleanup = null;
const pauseSpy = () => {
  resumeCleanup?.();
  spyPaused = true;
  let idleTimer = 0;
  const resume = () => { resumeCleanup?.(); spyPaused = false; };
  const onAnyScroll = () => { clearTimeout(idleTimer); idleTimer = setTimeout(resume, 150); };
  const capTimer = setTimeout(resume, 2500);
  window.addEventListener('scroll', onAnyScroll, { passive: true });
  window.addEventListener('scrollend', resume);
  idleTimer = setTimeout(resume, 150);
  resumeCleanup = () => {
    clearTimeout(idleTimer);
    clearTimeout(capTimer);
    window.removeEventListener('scroll', onAnyScroll);
    window.removeEventListener('scrollend', resume);
    resumeCleanup = null;
  };
};

/**
 * 頁內跳轉：先捲動，網址交給 spy 同步（不用 router.push，按一次返回就離開本頁）
 * @param {string} id 章節 id
 * @param {{ smooth?: boolean, focus?: boolean }} opts focus：跳完把焦點移到該章節標題（鍵盤操作）
 */
function goSection(id, { smooth = !reduceMotion.value, focus = false } = {}) {
  const target = isSection(id) ? id : 'top';
  const el = sectionEl(target);
  if (!el) return;
  const margin = target === 'top' ? 0 : parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  const top = target === 'top' ? 0 : Math.max(0, el.getBoundingClientRect().top + window.scrollY - margin);
  activeId.value = target;
  pauseSpy();
  window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
  if (focus) {
    const heading = document.getElementById(`pp-h-${target}`);
    if (heading) {
      if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  }
}

// ---------------------------------------------------------------
// 視窗寬度改變（旋轉、拖拉視窗）：版面高度會變，依改變前的章節重新定位，期間暫停 spy
// ---------------------------------------------------------------
let lastWidth = window.innerWidth;
let resizeAnchor = null;
let resizeTimer = 0;
let lastUserScrollAt = 0;
const onUserScrollInput = () => { lastUserScrollAt = Date.now(); };
const onResize = () => {
  onScroll();
  if (window.innerWidth === lastWidth) return; // 只有高度變（手機網址列伸縮）不處理
  lastWidth = window.innerWidth;
  if (resizeAnchor === null) {
    resizeAnchor = activeId.value;
    resumeCleanup?.();
    spyPaused = true;
  }
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const id = resizeAnchor;
    resizeAnchor = null;
    if (id && id !== 'top' && Date.now() - lastUserScrollAt > 400) {
      goSection(id, { smooth: false });
    } else {
      spyPaused = false;
      pickActive();
    }
  }, 200);
};

// ---------------------------------------------------------------
// 目錄、分享、燈箱、短訊息
// ---------------------------------------------------------------
const tocOpen = ref(false);
const tocTrigger = ref(null);
const tocSheet = ref(null);
const openToc = (trigger) => { tocTrigger.value = trigger || null; tocOpen.value = true; };
const tocGo = async (id) => {
  tocSheet.value?.closeWithoutFocus();
  await nextTick();
  goSection(id, { focus: true });
};

const shareOpen = ref(false);
const shareTrigger = ref(null);
const shareId = ref('top');
const shareUrl = computed(() => sectionUrl(shareId.value));
const openShare = (trigger) => {
  shareTrigger.value = trigger || null;
  shareId.value = activeId.value;
  shareOpen.value = true;
};

const toast = ref('');
let toastTimer = 0;
const showToast = (text) => {
  toast.value = text;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.value = ''; }, 2000);
};
const copyModuleLink = async (id) => {
  const ok = await copyText(sectionUrl(id));
  showToast(ok ? '已複製連結' : '無法複製，請改用分享');
};

const lightboxKey = ref(null);
let lightboxTrigger = null;
const openShot = (key, el) => { lightboxTrigger = el || null; lightboxKey.value = key; };
const closeShot = async () => {
  lightboxKey.value = null;
  await nextTick();
  lightboxTrigger?.focus({ preventScroll: true });
};

// ---------------------------------------------------------------
// 最終區：底部列隱藏、試用 QR Code（接近時才載入 qrcode）
// ---------------------------------------------------------------
const trialQr = ref('');
const nearEnd = ref(false);
// 手機不顯示 QR（客戶掃不到自己的螢幕），平板以上捲近最終區才產生
watch([nearEnd, isMobile], async ([near, mobile]) => {
  if (!near || mobile || trialQr.value) return;
  trialQr.value = await makeQr(absUrl({ name: 'TrialSignup', query: { source: 'product-qr', ...utmQuery.value } }), 400);
});
let endIo = null;
let qrIo = null;
const endSeen = new Set();
const setupEndObservers = () => {
  const start = sectionEl('start');
  const foot = document.querySelector('.pp .pp-foot');
  endIo = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? endSeen.add(e.target) : endSeen.delete(e.target)));
    endVisible.value = endSeen.size > 0;
  });
  [start, foot].forEach((el) => el && endIo.observe(el));
  qrIo = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    qrIo?.disconnect();
    qrIo = null;
    nearEnd.value = true;
  }, { rootMargin: '0px 0px 800px 0px' });
  if (start) qrIo.observe(start);
};

// ---------------------------------------------------------------
// 進站：深連結直接定位（不做動畫）、該模組展開「看全部」
// ---------------------------------------------------------------
const prevTitle = document.title;
let userScrolled = false;
const markUserScroll = () => { userScrolled = true; };
const USER_EVENTS = ['wheel', 'touchstart', 'keydown', 'mousedown'];
const SCROLL_INPUTS = ['wheel', 'touchmove', 'keydown'];

onMounted(async () => {
  document.title = '產品介紹｜ANXI 安熙智慧';
  [mqMobile, mqShort, mqReduce].forEach((mq) => mq.addEventListener('change', onMediaChange));
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  USER_EVENTS.forEach((t) => window.addEventListener(t, markUserScroll, { passive: true, once: true }));
  SCROLL_INPUTS.forEach((t) => window.addEventListener(t, onUserScrollInput, { passive: true }));

  const initial = currentParam();
  const valid = isSection(initial) && initial !== 'top';
  if (valid && MODULE_ORDER.includes(initial)) expanded[initial] = true;

  await nextTick();
  // 從其他頁（例如首頁捲到一半）進來時視窗會保留原捲動位置：沒有深連結一律從首屏開始
  if (!valid) window.scrollTo(0, 0);
  setupSpy();
  setupEndObservers();
  if (valid) {
    goSection(initial, { smooth: false });
    // 網路字型晚到會改變行高；使用者還沒動過就再定位一次
    document.fonts?.ready?.then(() => {
      if (!userScrolled && activeId.value === initial) goSection(initial, { smooth: false });
    });
  } else if (initial) {
    syncUrl(); // 未知 id：網址改回 /product
  }
  measure();
});

onBeforeUnmount(() => {
  document.title = prevTitle;
  [mqMobile, mqShort, mqReduce].forEach((mq) => mq.removeEventListener('change', onMediaChange));
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('resize', onResize);
  USER_EVENTS.forEach((t) => window.removeEventListener(t, markUserScroll));
  SCROLL_INPUTS.forEach((t) => window.removeEventListener(t, onUserScrollInput));
  clearTimeout(resizeTimer);
  cancelAnimationFrame(measureRaf);
  clearTimeout(urlTimer);
  clearTimeout(toastTimer);
  resumeCleanup?.();
  spyIo?.disconnect();
  endIo?.disconnect();
  qrIo?.disconnect();
});
</script>

<style scoped>
.pp {
  position: relative;
  min-height: 100vh;
  background: #fff;
  color: #111827;
  font-family: 'Inter', 'Noto Sans TC', system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-size: 17px;
  line-height: 1.8;
  -webkit-font-smoothing: antialiased;
  overflow-x: clip; /* 不用 hidden：hidden 會讓 sticky 失效 */
}

/* ───── 頂欄 ───── */
.pp-top {
  position: sticky;
  top: 0;
  z-index: 30;
  height: 56px;
  background: #070A14;
  color: #fff;
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}
.pp-top.is-solid {
  background: #fff;
  background: rgba(255, 255, 255, 0.9);
  -webkit-backdrop-filter: saturate(180%) blur(14px);
  backdrop-filter: saturate(180%) blur(14px);
  color: #111827;
  box-shadow: 0 1px 0 #E5E7EB;
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .pp-top.is-solid { background: #fff; }
}
.pp-top__in { display: flex; align-items: center; justify-content: space-between; gap: 12px; height: 100%; }
.pp-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;
  cursor: pointer;
}
.pp-brand img { width: auto; height: 26px; }
.pp-top__acts { display: flex; align-items: center; gap: 6px; }
.pp-top__link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 10px;
  color: inherit;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  opacity: 0.86;
}
.pp-top__link:hover { opacity: 1; text-decoration: underline; }
.pp-iconbtn {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.pp-iconbtn:hover { background: rgba(127, 127, 127, 0.14); }

/* ───── 群標題帶 ───── */
.pp-band {
  padding: 40px 0;
  border-top: 1px solid #E5E7EB;
  border-bottom: 1px solid #E5E7EB;
  background:
    linear-gradient(rgba(17, 24, 39, 0.035) 1px, transparent 1px) 0 0 / 32px 32px,
    linear-gradient(90deg, rgba(17, 24, 39, 0.035) 1px, transparent 1px) 0 0 / 32px 32px,
    #F5F6F8;
}
.pp-band__in { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px 20px; }
.pp-band__name { margin: 0; font-size: 32px; font-weight: 700; line-height: 1.3; letter-spacing: -0.02em; }
.pp-band__list { margin: 0 0 0 auto; font-size: 15px; line-height: 1.7; color: #4B5563; }

/* ───── 手機底部列 ───── */
.pp-ctabar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  height: calc(56px + env(safe-area-inset-bottom));
  padding: 6px 20px calc(6px + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1px solid #E5E7EB;
  box-shadow: 0 -8px 24px rgba(15, 23, 42, 0.06);
  transform: translateY(100%);
  visibility: hidden;
  transition: transform 0.25s cubic-bezier(0.2, 0.7, 0.2, 1), visibility 0s linear 0.25s;
}
.pp-ctabar.is-shown { transform: none; visibility: visible; transition: transform 0.25s cubic-bezier(0.2, 0.7, 0.2, 1), visibility 0s; }
.pp-ctabar .pp-btn { min-height: 44px; padding: 0 12px; font-size: 16px; }

/* ───── 目錄 ───── */
.pp-toc { padding: 0 8px; }
.pp-toc__group + .pp-toc__group { margin-top: 4px; padding-top: 4px; border-top: 1px solid #E5E7EB; }
.pp-toc__gname { margin: 0; padding: 12px 12px 4px; font-size: 13px; font-weight: 600; letter-spacing: 0.04em; color: #4B5563; }
.pp-toc ul { margin: 0; padding: 0; list-style: none; }
.pp-toc__item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 48px;
  padding: 0 12px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: #111827;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
  text-align: left;
  cursor: pointer;
}
.pp-toc__item:hover { background: #F5F6F8; }
.pp-toc__item[aria-current] { background: rgba(47, 107, 255, 0.08); color: #1F4FD1; font-weight: 700; }
.pp-toc__no {
  width: 22px;
  font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;
  font-size: 13px;
  color: #4B5563;
  font-variant-numeric: tabular-nums;
}
.pp-toc__name { flex: 1; }
.pp-toc__check { color: #1F4FD1; }

/* ───── 短訊息 ───── */
.pp-toast {
  position: fixed;
  left: 50%;
  bottom: 32px;
  z-index: 60;
  transform: translateX(-50%);
  pointer-events: none;
}
.pp-toast__msg {
  display: inline-block;
  padding: 10px 18px;
  border-radius: 999px;
  background: #111827;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
  white-space: nowrap;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.2);
}
.pp-toast-enter-active, .pp-toast-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.pp-toast-enter-from, .pp-toast-leave-to { opacity: 0; transform: translateY(6px); }

@media (max-width: 767.98px) {
  .pp-top { position: relative; }
  .pp-brand { font-size: 16px; gap: 8px; }
  .pp-brand img { height: 24px; }
  .pp-top__acts { gap: 2px; }
  .pp-band { padding: 28px 0; }
  .pp-band__name { font-size: 24px; }
  .pp-band__list { flex-basis: 100%; margin-left: 0; font-size: 14px; }
  .pp-toast { bottom: calc(76px + env(safe-area-inset-bottom)); }
}
/* 手機橫拿（矮螢幕）：頂欄不 sticky，只留模組列 */
@media (max-height: 500px) {
  .pp-top { position: relative; }
}
@media (prefers-reduced-motion: reduce) {
  .pp-top, .pp-ctabar, .pp-ctabar.is-shown { transition: none; }
  .pp-toast-enter-active, .pp-toast-leave-active { transition: none; }
}
@media print {
  .pp-top, .pp-ctabar, .pp-toast { display: none !important; }
  .pp { overflow: visible; }
}
</style>
