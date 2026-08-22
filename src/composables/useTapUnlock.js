import { ref } from 'vue';

/**
 * 連續點按解鎖（手機版無鍵盤時替代連打 aaaaaaaa 解鎖碼）
 * 在指定元素上連續點按 N 次（預設 8 次，每次間隔須在 timeout 內）即觸發 onUnlock。
 *
 * @param {Function} onUnlock 達成點按次數時觸發
 * @param {object} [opts]
 * @param {number} [opts.taps=8]      需要的連續點按次數
 * @param {number} [opts.timeout=1500] 兩次點按的最大間隔（ms），逾時歸零重數
 * @returns {{ tap: Function, reset: Function, count: import('vue').Ref<number> }}
 */
export function useTapUnlock(onUnlock, { taps = 8, timeout = 1500 } = {}) {
  const count = ref(0);
  let timer = null;

  function reset() {
    count.value = 0;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function tap() {
    count.value += 1;
    if (timer) clearTimeout(timer);
    if (count.value >= taps) {
      reset();
      onUnlock();
      return;
    }
    timer = setTimeout(reset, timeout);
  }

  return { tap, reset, count };
}
