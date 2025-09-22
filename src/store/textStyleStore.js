import { defineStore } from 'pinia';
import { getProjectTextStyle, updateProjectTextStyle } from '@/api';
import { ref, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';

// 定義預設樣式，當後端沒有設定時使用
const defaultStyles = {
  number: { fontSize: 10, fontWeight: 'bold', fill: '#000000', fontFamily: 'Arial' },
  price: { fontSize: 8, fontWeight: 'normal', fill: '#000000', fontFamily: 'Arial' },
  buyerUnitId: { fontSize: 8, fontWeight: 'normal', fill: '#000000', fontFamily: 'Arial' },
  buyerName: { fontSize: 8, fontWeight: 'normal', fill: '#000000', fontFamily: 'Arial' },
  salesperson: { fontSize: 8, fontWeight: 'normal', fill: '#000000', fontFamily: 'Arial' },
  size: { fontSize: 8, fontWeight: 'normal', fill: '#000000', fontFamily: 'Arial' },
  type: { fontSize: 8, fontWeight: 'normal', fill: '#000000', fontFamily: 'Arial' },
  status: { fontSize: 9, fontWeight: 'bold', fill: '#D32F2F', fontFamily: 'Arial' },
};

export const useTextStyleStore = defineStore('textStyles', () => {
  const currentProjectId = ref(null);
  const styles = ref({});
  const isLoading = ref(false);
  const isSaving = ref(false);

  // 從後端獲取樣式
  async function fetchStyles(projectId) {
    if (!projectId || currentProjectId.value === projectId) return;

    isLoading.value = true;
    try {
      const fetchedStyles = await getProjectTextStyle(projectId);
      // 將獲取的樣式與預設樣式合併，確保所有欄位都有值
      const mergedStyles = Object.keys(defaultStyles).reduce((acc, key) => {
        acc[key] = { ...defaultStyles[key], ...(fetchedStyles[key] || {}) };
        return acc;
      }, {});
      styles.value = mergedStyles;
      currentProjectId.value = projectId;
    } catch (error) {
      console.error('Failed to fetch text styles:', error);
      // 即使獲取失敗，也載入預設樣式
      styles.value = JSON.parse(JSON.stringify(defaultStyles));
    } finally {
      isLoading.value = false;
    }
  }

  // 使用 debounce 避免頻繁儲存
  const debouncedSave = useDebounceFn(async () => {
    if (!currentProjectId.value) return;
    isSaving.value = true;
    try {
      await updateProjectTextStyle(currentProjectId.value, styles.value);
    } catch (error) {
      console.error('Failed to save text styles:', error);
    } finally {
      isSaving.value = false;
    }
  }, 1000); // 停止修改後 1 秒儲存

  // 監聽樣式變化，自動觸發儲存
  watch(styles, (newStyles) => {
    if (Object.keys(newStyles).length > 0) {
      debouncedSave();
    }
  }, { deep: true });

  return {
    currentProjectId,
    styles,
    isLoading,
    isSaving,
    fetchStyles,
  };
});