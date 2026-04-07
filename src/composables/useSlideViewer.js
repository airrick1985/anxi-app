// /src/composables/useSlideViewer.js 

import { ref, computed } from 'vue';
import { useToast } from 'vue-toastification';

const toast = useToast();

export function useSlideViewer() {
  const isSlideDialogVisible = ref(false);
  const currentSlideId = ref('');
  const isLoadingSlide = ref(false);
  const isContentLoaded = ref(false);

  const slideEmbedUrl = computed(() => {
    if (!currentSlideId.value) return '';
    return `https://docs.google.com/presentation/d/${currentSlideId.value}/embed?start=false&loop=false&delayms=3000`;
  });

  function openSlideViewer(initialSlideId) {
    if (!initialSlideId) {
      toast.error('無法開啟車位表：未提供 Slide ID。');
      return;
    }

    isLoadingSlide.value = false;
    isContentLoaded.value = true;
    currentSlideId.value = initialSlideId;
    isSlideDialogVisible.value = true;
  }

  return {
    isSlideDialogVisible,
    slideEmbedUrl,
    isLoadingSlide,
    isContentLoaded,
    openSlideViewer,
  };
}