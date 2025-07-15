// /src/composables/useSlideViewer.js (V4 - 最終防閃爍版)

import { ref, computed, nextTick } from 'vue';
import { updateAndGetParkingSlide } from '@/api';
import { useUserStore } from '@/store/user';
import { useToast } from 'vue-toastification';

const toast = useToast();

export function useSlideViewer() {
  const isSlideDialogVisible = ref(false);
  const currentSlideId = ref('');
  const isLoadingSlide = ref(false);
  // ✅ 新增一個狀態，專門用來控制內容的顯示
  const isContentLoaded = ref(false);

  const slideEmbedUrl = computed(() => {
    if (!currentSlideId.value) return '';
    return `https://docs.google.com/presentation/d/${currentSlideId.value}/embed?start=false&loop=false&delayms=3000`;
  });

  async function openSlideViewer(initialSlideId, viewMode) {
    // 1. 重設所有狀態
    isSlideDialogVisible.value = true;
    isLoadingSlide.value = true;
    isContentLoaded.value = false; // ✅ 每次打開都重設為 false
    currentSlideId.value = '';

    const userStore = useUserStore();
    const projectName = userStore.user?.projectName;
    
    if (!projectName || !viewMode) {
      // ... 錯誤處理 ...
      toast.error('無法啟動車位表：缺少建案名稱或模式。');
      isSlideDialogVisible.value = false;
      isLoadingSlide.value = false;
      return;
    }

    toast.info('正在更新車位表，請稍候...');

    try {
      const response = await updateAndGetParkingSlide(projectName, viewMode);
      if (response && response.status === 'success' && response.slideId) {
        toast.success('車位表已更新！');
        currentSlideId.value = response.slideId;
      } else {
        throw new Error(response.message || '後端未返回有效的 Slide ID。');
      }
    } catch (err) {
      console.error('更新車位表失敗:', err);
      toast.error(`無法更新車位表: ${err.message}`);
      currentSlideId.value = ''; 
    } finally {
      // 2. 載入流程結束
      isLoadingSlide.value = false;
      // ✅ 在載入動畫消失後，才允許內容區塊被渲染
      isContentLoaded.value = true;
    }
  }

  return {
    isSlideDialogVisible,
    slideEmbedUrl,
    isLoadingSlide,
    isContentLoaded,
    openSlideViewer,
  };
}