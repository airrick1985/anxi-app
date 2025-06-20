// /src/composables/useSlideViewer.js
import { ref, computed } from 'vue';

export function useSlideViewer() {
  // 彈出視窗的開關狀態
  const isSlideDialogVisible = ref(false);
  
  // 要顯示的 Slide ID
  const currentSlideId = ref('');

  // 根據 ID 計算出嵌入網址
  const slideEmbedUrl = computed(() => {
    if (!currentSlideId.value) return '';
    return `https://docs.google.com/presentation/d/${currentSlideId.value}/embed?start=false&loop=false&delayms=3000`;
  });

  // 開啟視窗的函式，需要傳入要顯示的 ID
  function openSlideViewer(slideId) {
    if (slideId) {
      currentSlideId.value = slideId;
      isSlideDialogVisible.value = true;
    } else {
      // 可以在這裡加一個提示，例如用 toast
      console.warn('無法開啟車位表，因為未提供 Slide ID。');
    }
  }

  return {
    isSlideDialogVisible,
    slideEmbedUrl,
    openSlideViewer,
  };
}