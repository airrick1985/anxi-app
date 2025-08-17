// src/store/aiStore.js

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { postToAiAssistant } from '@/api';

export const useAiStore = defineStore('ai', () => {
  // --- State (狀態) ---
  const messages = ref([]); // 聊天訊息紀錄 { role: 'user' | 'model', content: string }
  const isLoading = ref(false); // 是否正在等待 AI 回應
  const error = ref(null); // 錯誤訊息
  const isOpen = ref(false); // 聊天視窗是否開啟

  // --- Actions (操作) ---

  /**
   * 切換聊天室的開關狀態
   */
  function toggleChat() {
    isOpen.value = !isOpen.value;
    if (isOpen.value && messages.value.length === 0) {
        // 第一次打開時，顯示歡迎訊息
        messages.value.push({
            role: 'model',
            content: '您好！我是您的數據分析助理，請問有什麼可以協助您的嗎？'
        });
    }
  }

  /**
   * 發送訊息給 AI
   * @param {string} prompt - 使用者輸入的訊息
   * @param {object} projectData - 要一起傳送給 AI 的相關數據
   */
  async function sendMessage(prompt, projectData = {}) {
    if (!prompt || isLoading.value) return;

    isLoading.value = true;
    error.value = null;

    // 1. 將使用者訊息加入對話紀錄
    messages.value.push({ role: 'user', content: prompt });

    // 2. 準備 API 需要的歷史訊息格式
    const history = messages.value
      .slice(0, -1) // 不包含當前使用者最新的問題
      .map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      }));

    try {
      // 3. 呼叫後端 API
      const result = await postToAiAssistant({
        prompt: prompt,
        history: history,
        projectData: projectData, // 將額外數據傳給後端
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // 4. 將 AI 的回應加入對話紀錄
      messages.value.push({ role: 'model', content: result.response });

    } catch (e) {
      const errorMessage = e.message || '發生未知錯誤';
      error.value = errorMessage;
      messages.value.push({ role: 'model', content: `抱歉，發生錯誤：${errorMessage}` });
    } finally {
      isLoading.value = false;
    }
  }

  return {
    messages,
    isLoading,
    error,
    isOpen,
    toggleChat,
    sendMessage,
  };
});