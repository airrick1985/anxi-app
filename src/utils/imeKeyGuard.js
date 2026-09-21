// 中文輸入法（IME）組字期間的按鍵保護（全站共用）。
//
// 問題：Vuetify 的 VMenu 會在啟動元素（v-combobox／v-autocomplete／v-select 的輸入框）上攔截
// ArrowUp／ArrowDown 並 preventDefault + stopImmediatePropagation，且未判斷 e.isComposing，
// 導致注音／拼音組字中按「上／下」選字時，變成展開下拉選單、無法選字；
// Safari 在 compositionend 之後才送出的 Enter（keyCode 229）也會被當成一般 Enter 觸發選取。
//
// 做法：在 document 捕獲階段（早於任何元素上的監聽器）攔截「組字中」的導覽鍵，
// 只 stopPropagation、不 preventDefault，讓瀏覽器與輸入法照常處理，Vuetify／頁面的 keydown 監聽器則收不到。
// 僅作用於文字輸入元素（input／textarea／contenteditable）。

const GUARDED_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', 'Tab', ' ']);

function isTextTarget(el) {
  if (!el || typeof el.closest !== 'function') return false;
  if (el.isContentEditable) return true;
  const tag = String(el.tagName || '').toLowerCase();
  return tag === 'textarea' || tag === 'input';
}

/** 是否為輸入法組字中的按鍵（含 Safari 組字結束後 keyCode 229 的 Enter） */
export function isImeComposingKey(e) {
  return !!(e && (e.isComposing || e.keyCode === 229) && GUARDED_KEYS.has(e.key));
}

let installed = false;
export function installImeKeyGuard(target = typeof document !== 'undefined' ? document : null) {
  if (installed || !target) return;
  installed = true;
  const guard = (e) => {
    if (isImeComposingKey(e) && isTextTarget(e.target)) e.stopPropagation();
  };
  target.addEventListener('keydown', guard, true);
  target.addEventListener('keyup', guard, true);
}
