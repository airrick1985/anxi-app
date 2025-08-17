// src/store/pageContextStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const usePageContextStore = defineStore('pageContext', () => {
  // --- State ---
  const contextData = ref(null); // 儲存當前頁面的主要數據
  const contextName = ref(''); // 儲存當前頁面的名稱 (例如: '驗屋行事曆')

  /**
   * 讓頁面元件設定當前的上下文數據
   * @param {string} name - 頁面或元件的名稱
   * @param {any} data - 頁面的核心數據 (例如預約列表)
   */
  function setContext(name, data) {
    contextName.value = name;
    // 使用 JSON 序列化來建立一個深拷貝，避免直接引用大型響應式物件
    contextData.value = JSON.parse(JSON.stringify(data));
    console.log(`[Page Context] 已設定情境: ${name}`, contextData.value);
  }

  /**
   * 清除上下文數據 (當元件卸載時呼叫)
   */
  function clearContext() {
    contextName.value = '';
    contextData.value = null;
    console.log('[Page Context] 情境已清除');
  }

  return {
    contextData,
    contextName,
    setContext,
    clearContext,
  };
});