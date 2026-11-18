/**
 * 複製文字到剪貼簿：先用 Clipboard API，失敗（LINE 內建瀏覽器、非安全來源常擋）再退回 execCommand('copy')。
 * @returns {Promise<boolean>} 是否成功
 */
export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 交給下方的退回做法
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;';
  document.body.appendChild(ta);
  const prevFocus = document.activeElement;
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  prevFocus?.focus?.({ preventScroll: true });
  return ok;
}
