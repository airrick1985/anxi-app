// 量測表格 thead 的實際高度，寫入容器的 CSS 變數，供「凍結在表頭下方」的列（例如合計列）當作 sticky top 使用。
// 用法：
//   const listViewRef = ref(null);
//   useStickyHeaderOffset(listViewRef);           // 預設變數名 --sticky-header-height
//   CSS: td { position: sticky !important; top: var(--sticky-header-height, 44px); }
// 容器可為 v-if 動態掛載；thead 高度改變（欄位換行、密度切換、視窗縮放）時會自動更新。
import { watch, onBeforeUnmount } from 'vue';

export function useStickyHeaderOffset(containerRef, cssVar = '--sticky-header-height') {
  let resizeObserver = null;
  let mutationObserver = null;
  let observedThead = null;

  const apply = () => {
    const el = containerRef.value;
    if (!el) return;
    const thead = el.querySelector('thead');
    const h = thead ? thead.getBoundingClientRect().height : 0;
    el.style.setProperty(cssVar, `${Math.round(h)}px`);
  };

  const observeThead = () => {
    const el = containerRef.value;
    const thead = el ? el.querySelector('thead') : null;
    if (thead === observedThead) return;
    if (resizeObserver) resizeObserver.disconnect();
    observedThead = thead;
    if (thead && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(apply);
      resizeObserver.observe(thead);
    }
    apply();
  };

  const detach = () => {
    if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null; }
    if (mutationObserver) { mutationObserver.disconnect(); mutationObserver = null; }
    observedThead = null;
  };

  const attach = () => {
    detach();
    const el = containerRef.value;
    if (!el) return;
    if (typeof MutationObserver !== 'undefined') {
      // thead 可能在資料載入後才出現、或表格重建時被換掉，用 MutationObserver 追蹤
      mutationObserver = new MutationObserver(observeThead);
      mutationObserver.observe(el, { childList: true, subtree: true });
    }
    observeThead();
  };

  watch(containerRef, attach, { immediate: true, flush: 'post' });
  onBeforeUnmount(detach);

  return { refresh: apply };
}
