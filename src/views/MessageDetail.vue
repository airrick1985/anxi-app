<template>
  <v-container>
    <v-card class="mx-auto" max-width="900">
      <div v-if="loading" class="text-center pa-10">
        <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
        <p class="mt-4">訊息載入中...</p>
      </div>

      <div v-else-if="!message">
         <v-toolbar color="warning" dark>
            <v-toolbar-title>錯誤</v-toolbar-title>
         </v-toolbar>
         <v-card-text class="text-center pa-10">
            <v-icon size="x-large" class="mb-2">mdi-alert-circle-outline</v-icon>
            <p>無法載入訊息內容，或訊息不存在。</p>
            <v-btn color="primary" class="mt-6" @click="goBack">返回訊息中心</v-btn>
         </v-card-text>
      </div>

      <div v-else>
        <v-toolbar flat color="grey-lighten-3">
          <v-btn icon @click="goBack">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <v-toolbar-title class="font-weight-bold text-truncate">{{ message.subject }}</v-toolbar-title>
          <v-spacer></v-spacer>
          
          <v-tooltip location="bottom">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon @click="markAsUnread">
                <v-icon>mdi-email-mark-as-unread</v-icon>
              </v-btn>
            </template>
            <span>標示為未讀</span>
          </v-tooltip>
          
          <v-tooltip location="bottom">
             <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon @click="handleDelete">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
            <span>刪除</span>
          </v-tooltip>
        </v-toolbar>

        <v-divider></v-divider>

        <v-card-text>
          <div class="d-flex align-center">
            <v-avatar color="primary" size="large">
              <span class="white--text text-h5">{{ message.senderName ? message.senderName.charAt(0) : '?' }}</span>
            </v-avatar>
            <div class="ml-4">
              <div class="text-subtitle-1 font-weight-bold">{{ message.senderName }}</div>
              <div class="text-caption text-grey">{{ formatTimestamp(message.sentTimestamp) }}</div>
            </div>
          </div>
        </v-card-text>
        
        <v-divider></v-divider>

        <v-card-text>
          <div v-html="message.body" class="message-body"></div>
        </v-card-text>

        <div v-if="message.attachments && message.attachments.length > 0">
          <v-divider></v-divider>
          <v-card-text>
            <div class="text-subtitle-2 mb-2">附件 ({{ message.attachments.length }})</div>
            <v-chip
              v-for="(file, index) in message.attachments"
              :key="index"
              class="ma-1"
              color="primary"
              label
              :href="file.url"
              target="_blank"
              link
            >
              <v-icon start icon="mdi-paperclip"></v-icon>
              {{ file.name }}
            </v-chip>
          </v-card-text>
        </div>
      </div>
    </v-card>
  </v-container>
</template>

<script>
import { useUserStore } from '@/store/user';
import { fetchMessageDetail, setMessageStatus } from '@/api.js';

export default {
  name: 'MessageDetail',
  props: {
    // 從路由接收 statusId
    statusId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      loading: true,
      message: null, // 存放從 API 獲取的完整訊息物件
    };
  },
  computed: {
    userStore() {
      return useUserStore();
    },
    user() {
      return this.userStore.user;
    },
  },
  async created() {
    await this.loadMessageDetail();
  },
  methods: {
    async loadMessageDetail() {
      this.loading = true;
      try {
        const messageData = await fetchMessageDetail(this.statusId, this.user.key);
        this.message = messageData;

        // 成功載入後，立即在背景將其標示為已讀
        // 這是一個 "fire-and-forget" 操作，不需要等待它完成
        setMessageStatus(this.statusId, 'markRead').catch(err => {
            console.error("標示為已讀失敗:", err);
        });

      } catch (error) {
        console.error('載入訊息詳情失敗:', error);
        this.message = null; // 載入失敗時清空
      } finally {
        this.loading = false;
      }
    },
    goBack() {
      // 優先返回上一頁，如果無法返回，則跳到訊息中心
      if (window.history.length > 2) {
        this.$router.go(-1);
      } else {
        this.$router.push({ name: 'MessageCenter' });
      }
    },
    async markAsUnread() {
        try {
            await setMessageStatus(this.statusId, 'markUnread');
            alert('已標示為未讀');
            this.goBack();
        } catch (error) {
            alert('操作失敗，請稍後再試');
        }
    },
    async handleDelete() {
        if(confirm('您確定要刪除這封訊息嗎？此操作無法復原。')){
            try {
                await setMessageStatus(this.statusId, 'delete');
                alert('訊息已刪除');
                this.goBack();
            } catch (error) {
                alert('刪除失敗，請稍後再試');
            }
        }
    },
    formatTimestamp(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
};
</script>

<style scoped>
.message-body {
  /* 設定基本樣式，讓 v-html 的內容看起來不會太奇怪 */
  line-height: 1.6;
}

/* 讓 v-html 裡面的元素可以被 Vuetify 主題影響 (可選) */
.message-body :deep(p) {
  margin-bottom: 1rem;
}
.message-body :deep(h1), .message-body :deep(h2), .message-body :deep(h3) {
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  font-weight: bold;
}
</style>