// 產品介紹頁的燈箱、面板共用：鎖住背景捲動、Tab 焦點留在面板內

let lockCount = 0;
let saved = null;

export function lockScroll() {
  lockCount += 1;
  if (lockCount > 1) return;
  const html = document.documentElement;
  const scrollbar = window.innerWidth - html.clientWidth; // 隱藏捲軸前補上寬度，版面不跳
  saved = { overflow: html.style.overflow, paddingRight: html.style.paddingRight };
  html.style.overflow = 'hidden';
  if (scrollbar > 0) html.style.paddingRight = `${scrollbar}px`;
}

export function unlockScroll() {
  if (lockCount === 0) return;
  lockCount -= 1;
  if (lockCount > 0 || !saved) return;
  const html = document.documentElement;
  html.style.overflow = saved.overflow;
  html.style.paddingRight = saved.paddingRight;
  saved = null;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])';

/** 在 keydown 呼叫：Tab／Shift+Tab 在 root 內循環 */
export function trapTab(e, root) {
  if (e.key !== 'Tab' || !root) return;
  const list = [...root.querySelectorAll(FOCUSABLE)].filter((el) => el.getClientRects().length > 0); // 含 position:fixed 的關閉鈕
  if (list.length === 0) { e.preventDefault(); return; }
  const first = list[0];
  const last = list[list.length - 1];
  // Safari 點按鈕不會讓按鈕取得焦點，焦點可能落在 body：一律拉回面板內
  if (!root.contains(document.activeElement)) {
    e.preventDefault();
    (e.shiftKey ? last : first).focus();
  } else if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
