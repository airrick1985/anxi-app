/**
 * 鍵盤隱藏解鎖碼偵測（預設連按 8 次 a → aaaaaaaa）
 *
 * - 以 window capture 階段的 keyup 偵測：v-select 展開選單時 typeahead 只攔 keydown，keyup 不會被吃掉
 * - 支援半形/全形、大小寫（aaaaaaaa / AAAAAAAA / ａａａａａａａａ / ＡＡＡＡＡＡＡＡ 皆可）
 * - 不自動掛載：呼叫端自行決定 attach/detach 時機（彈窗開啟期間、頁面存活期間…）
 *
 * @param {Function} onUnlock 比對成功時觸發
 * @param {object} [opts]
 * @param {string} [opts.code='aaaaaaaa'] 解鎖碼（半形小寫）
 * @param {() => boolean} [opts.isPaused] 回傳 true 時暫停偵測（例如另一層彈窗正在用同一組解鎖碼）
 * @returns {{ attach: Function, detach: Function, reset: Function }}
 */
export function useKeyUnlock(onUnlock, { code = 'aaaaaaaa', isPaused = null } = {}) {
  let buffer = '';
  let attached = false;

  // 全形 ASCII 區（U+FF01–U+FF5E）對應半形為 code - 0xFEE0
  function normalizeChar(ch) {
    const c = ch.charCodeAt(0);
    const half = (c >= 0xff01 && c <= 0xff5e) ? String.fromCharCode(c - 0xfee0) : ch;
    return half.toLowerCase();
  }

  function onKeyup(e) {
    if (typeof e.key !== 'string' || e.key.length !== 1) return;
    if (typeof isPaused === 'function' && isPaused()) {
      buffer = '';
      return;
    }
    buffer = (buffer + normalizeChar(e.key)).slice(-code.length);
    if (buffer === code) {
      buffer = '';
      onUnlock();
    }
  }

  function reset() {
    buffer = '';
  }

  function attach() {
    if (attached) return;
    attached = true;
    buffer = '';
    window.addEventListener('keyup', onKeyup, true);
  }

  function detach() {
    if (!attached) return;
    attached = false;
    buffer = '';
    window.removeEventListener('keyup', onKeyup, true);
  }

  return { attach, detach, reset };
}
