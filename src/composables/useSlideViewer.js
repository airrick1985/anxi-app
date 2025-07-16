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

 function openSlideViewer(initialSlideId) {
    if (!initialSlideId) {
      toast.error('無法開啟車位表：未提供 Slide ID。');
      return;
    }
    
    // 重設狀態並立即開啟
    isLoadingSlide.value = false; // 一開始不載入
    isContentLoaded.value = true;   // 直接顯示內容
    currentSlideId.value = initialSlideId;
    isSlideDialogVisible.value = true;
  }

  // 這個函式專門負責「手動刷新」，它包含了完整的後端更新與載入流程
  async function refreshSlide(viewMode) {
    const userStore = useUserStore();
    const projectName = userStore.user?.projectName;

    if (!projectName || !viewMode) {
      toast.error('無法刷新：缺少建案名稱或模式。');
      return;
    }

    isLoadingSlide.value = true;
    isContentLoaded.value = false; // 先隱藏內容，準備顯示載入動畫
    
    // 使用 nextTick 確保畫面已更新
    await nextTick();

    try {
      const response = await updateAndGetParkingSlide(projectName, viewMode);
      if (response && response.status === 'success' && response.slideId) {
        toast.success('車位表已更新！');
        currentSlideId.value = response.slideId;
      } else {
        throw new Error(response.message || '後端未返回有效的 Slide ID。');
      }
    } catch (err) {
      console.error('刷新車位表失敗:', err);
      toast.error(`刷新失敗: ${err.message}`);
      // 失敗時，可以選擇關閉視窗或顯示舊的 ID
      // isSlideDialogVisible.value = false; 
    } finally {
      isLoadingSlide.value = false;
      isContentLoaded.value = true; // 重新顯示內容區塊
    }
  }

  return {
    isSlideDialogVisible,
    slideEmbedUrl,
    isLoadingSlide,
    isContentLoaded,
    openSlideViewer, 
    refreshSlide,   
  };
}