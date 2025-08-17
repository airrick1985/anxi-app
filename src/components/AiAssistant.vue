<template>
  <div class="ai-assistant-container">
    <v-btn
      class="chat-fab"
      icon
      color="primary"
      size="x-large"
      @click="aiStore.toggleChat"
    >
      <v-icon>mdi-robot-happy-outline</v-icon>
    </v-btn>

    <v-card v-if="aiStore.isOpen" class="chat-window">
      <v-card-title class="d-flex align-center bg-primary">
        AI 數據助理
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" @click="aiStore.toggleChat"></v-btn>
      </v-card-title>
      
      <v-divider></v-divider>

      <v-card-text ref="chatMessages" class="chat-messages">
        <div v-for="(msg, index) in aiStore.messages" :key="index" :class="['message', msg.role]">
          <v-avatar size="32" class="mr-3">
            <v-icon>{{ msg.role === 'user' ? 'mdi-account-circle' : 'mdi-robot-happy' }}</v-icon>
          </v-avatar>
          <div class="message-content" v-html="formatMessage(msg.content)"></div>
        </div>
        <div v-if="aiStore.isLoading" class="message model">
          <v-avatar size="32" class="mr-3">
            <v-icon>mdi-robot-happy</v-icon>
          </v-avatar>
          <div class="message-content">
             <v-progress-circular indeterminate color="primary" size="20"></v-progress-circular>
          </div>
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="chat-input-area">
        <v-text-field
          v-model="userInput"
          label="請輸入您的問題..."
          variant="solo"
          hide-details
          dense
          @keydown.enter="handleSendMessage"
        ></v-text-field>
        <v-btn icon="mdi-send" color="primary" @click="handleSendMessage" :disabled="aiStore.isLoading"></v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { useAiStore } from '@/store/aiStore';
import { useUserStore } from '@/store/user';
import { usePageContextStore } from '@/store/pageContextStore'; // 
import DOMPurify from 'dompurify';
import { marked } from 'marked';

const aiStore = useAiStore();
const userStore = useUserStore();
const pageContextStore = usePageContextStore(); // 2. 初始化 store
const userInput = ref('');
const chatMessages = ref(null);

const handleSendMessage = () => {
  if (!userInput.value.trim()) return;

  // 3. 組合要傳送給 AI 的所有情境數據
  const contextData = {
    currentUser: userStore.user?.name,
    currentProject: userStore.user?.projectName,
    // 從 pageContextStore 讀取當前頁面的情境
    currentPage: pageContextStore.contextName,
    pageData: pageContextStore.contextData,
  };

  aiStore.sendMessage(userInput.value, contextData);
  userInput.value = '';
};

// 監聽訊息變化，自動滾動到底部
watch(
  () => aiStore.messages,
  async () => {
    await nextTick();
    if (chatMessages.value) {
      chatMessages.value.scrollTop = chatMessages.value.scrollHeight;
    }
  },
  { deep: true }
);

// 格式化訊息，支援 Markdown
const formatMessage = (content) => {
  if (!content) return '';
  // 先用 marked 轉換 Markdown，再用 DOMPurify 清理，防止 XSS 攻擊
  const rawHtml = marked.parse(content);
  return DOMPurify.sanitize(rawHtml);
};
</script>

<style scoped>
.ai-assistant-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.chat-fab {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.chat-window {
  position: fixed;
  bottom: 100px;
  right: 20px;
  width: 400px;
  height: 600px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  border-radius: 12px !important;
  overflow: hidden;
}

.chat-messages {
  flex-grow: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  align-items: flex-start;
  max-width: 90%;
}

.message-content {
  padding: 10px 14px;
  border-radius: 18px;
  background-color: #f0f2f5;
  color: #050505;
  line-height: 1.5;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message.user .message-content {
  background-color: #007bff;
  color: white;
}

.message.user .v-avatar {
  margin-left: 12px;
  margin-right: 0;
}

.chat-input-area {
  padding: 12px;
}
</style>