// src/composables/useOnboardingTour.js
// 共用導覽（shepherd.js 包裝；docs/SPEC_LandingTrialLeadsOnboarding.md §7）
//
// 用法：
//   const tour = useOnboardingTour({ onComplete, onCancel });
//   tour.start([
//     { id: 'welcome', title: '歡迎', text: '…' },                       // 無 attachTo → 置中
//     { id: 'btn', title: '銷控系統', text: '…', attachTo: { element: '[data-tour="home-salesSystem"]', on: 'bottom' } },
//   ]);
//   tour.cancel();  tour.isActive
//
// 各頁只要在元素上加 data-tour 錨點並提供步驟表即可擴充（第二版：系統頁內導覽）。
import { ref, onBeforeUnmount } from 'vue';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';
import '@/assets/tour-theme.css';

const THEME_CLASS = 'anxi-tour';

export function useOnboardingTour(options = {}) {
  const isActive = ref(false);
  let tour = null;

  const destroy = () => {
    if (tour) {
      try { tour.cancel(); } catch (e) { /* ignore */ }
      tour = null;
    }
    isActive.value = false;
  };

  const buildButtons = (index, total) => {
    const buttons = [];
    if (index > 0) {
      buttons.push({ text: '上一步', classes: 'anxi-tour__btn anxi-tour__btn--ghost', action() { this.back(); } });
    }
    if (index < total - 1) {
      buttons.push({ text: '略過', classes: 'anxi-tour__btn anxi-tour__btn--ghost', action() { this.cancel(); } });
      buttons.push({ text: '下一步', classes: 'anxi-tour__btn anxi-tour__btn--primary', action() { this.next(); } });
    } else {
      buttons.push({ text: '完成', classes: 'anxi-tour__btn anxi-tour__btn--primary', action() { this.complete(); } });
    }
    return buttons;
  };

  /**
   * @param {Array<{ id:string, title:string, text:string, attachTo?:{element:string,on?:string} }>} steps
   */
  const start = (steps) => {
    destroy();
    const list = (steps || []).filter((s) => {
      // 有 attachTo 但元素不存在 → 跳過該步（例如按鈕尚未渲染）
      if (!s.attachTo?.element) return true;
      return !!document.querySelector(s.attachTo.element);
    });
    if (list.length === 0) return;

    tour = new Shepherd.Tour({
      useModalOverlay: true,
      exitOnEsc: true,
      keyboardNavigation: true,
      defaultStepOptions: {
        classes: THEME_CLASS,
        cancelIcon: { enabled: true },
        scrollTo: { behavior: 'smooth', block: 'center' },
        modalOverlayOpeningPadding: 8,
        modalOverlayOpeningRadius: 16,
        arrow: true,
      },
    });

    list.forEach((step, index) => {
      tour.addStep({
        id: step.id,
        title: step.title,
        text: `<div class="anxi-tour__text">${step.text}</div><div class="anxi-tour__progress">${index + 1} / ${list.length}</div>`,
        attachTo: step.attachTo,
        buttons: buildButtons(index, list.length),
      });
    });

    tour.on('start', () => { isActive.value = true; options.onStart?.(); });
    tour.on('complete', () => { isActive.value = false; options.onComplete?.(); tour = null; });
    tour.on('cancel', () => { isActive.value = false; options.onCancel?.(); tour = null; });

    tour.start();
  };

  const cancel = () => destroy();

  onBeforeUnmount(destroy);

  return { start, cancel, isActive };
}

export default useOnboardingTour;
