import { defineStore } from 'pinia';
import { getProjectStatusColors, updateProjectStatusColors } from '@/api';
import { ref, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';

// 定義預設顏色設定，當後端沒有設定時使用
const defaultColors = {
  backend: {
    '簽約': '#FFFF00',
    '小訂': '#00FF00',
    '補足': '#f8788dff',
    '保留': '#00bfffff',
    '來賓車位': '#87CEFA',
    'default': '#F5F5F5'
  },
  sales: {
    '已售': '#FFFF00',
    '來賓車位': '#87CEFA',
    'default': '#F5F5F5'
  }
};

export const useStatusColorStore = defineStore('statusColors', () => {
  const currentProjectId = ref(null);
  const colors = ref({});
  const isLoading = ref(false);
  const isSaving = ref(false);

  // 從後端獲取顏色設定
  async function fetchColors(projectId) {
    if (!projectId || currentProjectId.value === projectId) return;

    isLoading.value = true;
    try {
      const fetchedColors = await getProjectStatusColors(projectId);
      
      // 將獲取的顏色與預設顏色合併，確保所有狀態都有值
      const mergedColors = {
        backend: { ...defaultColors.backend, ...(fetchedColors.backend || {}) },
        sales: { ...defaultColors.sales, ...(fetchedColors.sales || {}) }
      };
      
      colors.value = mergedColors;
      currentProjectId.value = projectId;
    } catch (error) {
      console.error('Failed to fetch status colors:', error);
      // 即使獲取失敗，也載入預設顏色
      colors.value = JSON.parse(JSON.stringify(defaultColors));
    } finally {
      isLoading.value = false;
    }
  }  // 使用 debounce 避免頻繁儲存
  const debouncedSave = useDebounceFn(async () => {
    if (!currentProjectId.value) return;
    isSaving.value = true;
    try {
      await updateProjectStatusColors(currentProjectId.value, colors.value);
    } catch (error) {
      console.error('Failed to save status colors:', error);
    } finally {
      isSaving.value = false;
    }
  }, 1000); // 停止修改後 1 秒儲存

  // 監聽顏色變化，自動觸發儲存
  watch(colors, (newColors) => {
    if (Object.keys(newColors).length > 0) {
      debouncedSave();
    }
  }, { deep: true });

  return {
    currentProjectId,
    colors,
    isLoading,
    isSaving,
    fetchColors,
  };
});