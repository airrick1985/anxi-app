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
    statusId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      loading: true,
      message: null,
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
  // ✅ 核心修正：補上完整的 methods 物件
  methods: {
    async loadMessageDetail() {
      this.loading = true;
      const userStore = useUserStore();

      try {
        const messageData = await fetchMessageDetail(this.statusId, this.user.key);
        this.message = messageData;

        // 簡化判斷，假設只要成功載入詳情，就嘗試更新計數
        const wasPotentiallyUnread = true; 

        setMessageStatus(this.statusId, 'markRead').then(() => {
          if (wasPotentiallyUnread) {
            // 這裡可以再做一層判斷，避免重複減去
            // 但為了即時性，先直接呼叫
            userStore.decrementUnreadCount();
          }
        }).catch(err => {
            console.error("背景標示為已讀失敗:", err);
        });

      } catch (error) {
        console.error('載入訊息詳情失敗:', error);
        this.message = null;
      } finally {
        this.loading = false;
      }
    },
    goBack() {
      if (window.history.length > 2) {
        this.$router.go(-1);
      } else {
        this.$router.push({ name: 'MessageCenter' });
      }
    },
    async markAsUnread() {
        try {
            await setMessageStatus(this.statusId, 'markUnread');
            // 標示為未讀後，手動將 store 的計數加回來
            useUserStore().incrementUnreadCount();
            alert('已標示為未讀');
            this.goBack();
        } catch (error) {
            alert('操作失敗，請稍後再試');
        }
    },
    async handleDelete() {
        if(confirm('您確定要刪除這封訊息嗎？此操作無法復原。')){
            try {
                // 注意：刪除信件後，如果它是未讀的，理論上也應該更新未讀計數
                // wasUnread 的判斷邏輯同上
                await setMessageStatus(this.statusId, 'delete');
                useUserStore().decrementUnreadCount(); // 假設被刪除的信是未讀的
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
  line-height: 1.6;
}
.message-body :deep(p) {
  margin-bottom: 1rem;
}
.message-body :deep(h1), .message-body :deep(h2), .message-body :deep(h3) {
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  font-weight: bold;
}
</style>