// src/directives/vReveal.js
// 捲動進入視窗時「模糊 → 清晰」浮現特效（docs/SPEC_LandingTrialLeadsOnboarding.md §2.4）
//
// 用法：
//   <h2 v-reveal>標題</h2>                       進視窗後淡入＋去模糊
//   <p v-reveal="{ delay: 120 }">文案</p>         延遲 120ms
//   <div v-reveal="{ group: true }">              子元素帶 data-reveal-item 者依序 +80ms 錯開
//     <div data-reveal-item>…</div>
//   </div>
//
// 只觸發一次；prefers-reduced-motion 時只做短淡入（CSS 端處理）。

const DEFAULT_STAGGER = 80;
const ROOT_MARGIN = '0px 0px -10% 0px';

let sharedObserver = null;
const pendingHandlers = new WeakMap();

function getObserver() {
  if (sharedObserver) return sharedObserver;
  if (typeof IntersectionObserver === 'undefined') return null;
  sharedObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const handler = pendingHandlers.get(entry.target);
      if (handler) handler();
      sharedObserver.unobserve(entry.target);
      pendingHandlers.delete(entry.target);
    });
  }, { threshold: 0.15, rootMargin: ROOT_MARGIN });
  return sharedObserver;
}

function normalizeOptions(value) {
  if (!value || typeof value !== 'object') return { delay: 0, group: false, stagger: DEFAULT_STAGGER };
  return {
    delay: Number(value.delay) || 0,
    group: value.group === true,
    stagger: Number(value.stagger) || DEFAULT_STAGGER,
  };
}

function prepare(el, options) {
  el.classList.add('reveal');
  if (options.delay) el.style.transitionDelay = `${options.delay}ms`;
  if (options.group) {
    const items = el.querySelectorAll('[data-reveal-item]');
    items.forEach((item, index) => {
      item.classList.add('reveal');
      item.style.transitionDelay = `${options.delay + index * options.stagger}ms`;
    });
  }
}

function show(el, options) {
  el.classList.add('is-visible');
  if (options.group) {
    el.querySelectorAll('[data-reveal-item]').forEach((item) => item.classList.add('is-visible'));
  }
}

export const vReveal = {
  mounted(el, binding) {
    const options = normalizeOptions(binding.value);
    prepare(el, options);

    const observer = getObserver();
    if (!observer) {
      show(el, options);
      return;
    }
    pendingHandlers.set(el, () => show(el, options));
    observer.observe(el);
  },
  unmounted(el) {
    if (sharedObserver) sharedObserver.unobserve(el);
    pendingHandlers.delete(el);
  },
};

export default vReveal;
