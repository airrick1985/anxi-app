import { ref, watch } from 'vue';

/**
 * 對話框型大元件「首次開啟才掛載、之後常駐」
 *
 * 搭配 defineAsyncComponent 使用：模板寫 `v-if="mounted" ref="compRef"`。
 * 很多對話框的開啟初始化掛在「非 immediate」的 watch(props.show / modelValue) 上，
 * 若直接以 show=true 首次掛載會漏掉初始化；因此第一次要開啟時：
 *   先退回關閉 → v-if 掛載（非同步元件開始下載）→ 等內層元件 ref 就緒 → 再真正打開。
 * 之後保持掛載，行為與原本常駐時完全相同（關閉不重置內部狀態）。
 *
 * 注意：在 <script setup> 要解構成頂層變數（const { mounted: xMounted, compRef: xRef } = useLazyDialog(isX)），
 * 模板才會自動 unwrap。
 *
 * @param {import('vue').Ref<boolean>} visibleRef 對話框可見狀態（v-model 綁的那個 ref）
 * @param {number} timeoutMs 等待內層元件掛載的上限，逾時仍會嘗試開啟
 */
export function useLazyDialog(visibleRef, timeoutMs = 8000) {
  const mounted = ref(false);
  const compRef = ref(null);

  watch(visibleRef, async (v) => {
    if (!v || mounted.value) return;
    visibleRef.value = false;
    mounted.value = true;
    const start = Date.now();
    // 非同步元件的 template ref 會在「內層元件」掛載後才有值（wrapper 階段為 null）
    while (!compRef.value && Date.now() - start < timeoutMs) {
      await new Promise(r => setTimeout(r, 16));
    }
    visibleRef.value = true;
  });

  return { mounted, compRef };
}
