<template>
  <v-container>
    <v-card class="mx-auto">
      <v-toolbar color="secondary" dark>
        <v-toolbar-title>
          <v-icon left>mdi-email-outline</v-icon>
          訊息中心
        </v-toolbar-title>
        <v-spacer></v-spacer>

        <v-btn
          v-if="canSendMessage"
          prepend-icon="mdi-pencil"
          color="white"
          variant="outlined"
          class="mr-2"
          @click="showComposeDialog = true"
        >
          撰寫新訊息
        </v-btn>

      </v-toolbar>

      <v-card-title>
        <v-row dense class="align-center">
          <v-col cols="12" md="5">
            <v-text-field
              v-model="searchQuery"
              label="搜尋..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              dense
              hide-details
              clearable
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="7">
             <v-chip-group
                v-model="filterStatus"
                mandatory
                class="d-flex justify-md-end"
              >
                <v-chip filter value="all" color="primary" variant="flat">全部</v-chip>
                <v-chip filter value="unread" color="blue" variant="flat">未讀</v-chip>
                <v-chip filter value="important" color="orange" variant="flat">⭐重要</v-chip>
              </v-chip-group>
          </v-col>
        </v-row>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="filteredMessages"
        :loading="loading"
        class="elevation-1"
        item-value="statusId"
        @click:row="handleRowClick"
        hover
        items-per-page-text="每頁顯示："
        :page-text="`第 {0} - {1} 則，共 {2} 則`"
      >
        <template v-slot:item.isImportant="{ item }">
          <v-btn
            icon
            variant="text"
            size="small"
            @click.stop="toggleImportant(item)"
          >
            <v-icon :color="item.isImportant ? 'orange' : 'grey'">
              {{ item.isImportant ? 'mdi-star' : 'mdi-star-outline' }}
            </v-icon>
          </v-btn>
        </template>

        <template v-slot:item.subject="{ item }">
          <span :class="{ 'font-weight-bold': !item.isRead }">
             {{ item.subject }}
          </span>
        </template>

         <template v-slot:item.senderName="{ item }">
          <span :class="{ 'font-weight-bold': !item.isRead }">
             {{ item.senderName }}
          </span>
        </template>

        <template v-slot:item.projectName="{ item }">
          <span :class="{ 'font-weight-bold': !item.isRead }">
             {{ item.projectName }}
          </span>
        </template>

        <template v-slot:item.systemFunction="{ item }">
          <span :class="{ 'font-weight-bold': !item.isRead }">
             {{ item.systemFunction }}
          </span>
        </template>

        <template v-slot:item.sentTimestamp="{ item }">
          <span>{{ formatTimestamp(item.sentTimestamp) }}</span>
        </template>

        <template v-slot:no-data>
          <div class="pa-4 text-center">
            <v-icon size="x-large" class="mb-2">mdi-email-off-outline</v-icon>
            <p>您的收件匣是空的</p>
          </div>
        </template>
         <template v-slot:no-results>
          <div class="pa-4 text-center">
            <p>找不到符合搜尋條件的訊息</p>
          </div>
        </template>

      </v-data-table>
    </v-card>

    <v-dialog
      v-model="showComposeDialog"
      fullscreen
      hide-overlay
      transition="dialog-bottom-transition"
    >
      <SendMessage
        is-dialog
        @close="showComposeDialog = false"
        @sent="handleMessageSent"
      />
    </v-dialog>

  </v-container>
</template>

<script>
import { useUserStore } from '@/store/user';
import { fetchMyMessages, setMessageStatus } from '@/api.js';
import SendMessage from '@/views/SendMessage.vue'; // ✅ 引入 SendMessage

export default {
  name: 'MessageCenter',
  components: {
    SendMessage // ✅ 註冊子元件
  },
  data() {
    return {
      loading: true,
      showComposeDialog: false, // ✅ 控制 Dialog 顯示的變數
      messages: [], // 從 API 獲取的原始訊息列表
      searchQuery: '', // 綁定搜尋框
      filterStatus: 'all', // 綁定篩選器: 'all', 'unread', 'important'
      
      headers: [
        { title: '標註', key: 'isImportant', sortable: false, width: '5%' },
        { title: '寄件人', key: 'senderName', width: '15%' },
        { title: '建案', key: 'projectName', width: '15%' },
        { title: '功能', key: 'systemFunction', width: '10%' },
        { title: '主旨', key: 'subject', width: '40%' },
        { title: '日期', key: 'sentTimestamp', width: '15%' },
      ],
    };
  },
  computed: {
    userStore() {
      return useUserStore();
    },
    user() {
      return this.userStore.user;
    },
    canSendMessage() {
      return this.userStore.canSendMessage;
    },
    /**
     * 根據搜尋和篩選條件，動態產生要顯示的訊息列表
     */
    filteredMessages() {
      let tempMessages = this.messages;

      // 1. 根據狀態篩選
      if (this.filterStatus === 'unread') {
        tempMessages = tempMessages.filter(m => !m.isRead);
      } else if (this.filterStatus === 'important') {
        tempMessages = tempMessages.filter(m => m.isImportant);
      }

      // 2. 根據關鍵字搜尋
      if (this.searchQuery && this.searchQuery.trim() !== '') {
          const lowerQuery = this.searchQuery.toLowerCase();
          tempMessages = tempMessages.filter(m =>
              (m.senderName && m.senderName.toLowerCase().includes(lowerQuery)) ||
              (String(m.subject).toLowerCase().includes(lowerQuery))||
              (m.projectName && m.projectName.toLowerCase().includes(lowerQuery)) ||
              (m.systemFunction && m.systemFunction.toLowerCase().includes(lowerQuery))
          );
      }
      
      return tempMessages;
    }
  },
  async created() {
    await this.loadMessages();
  },
  methods: {
    async loadMessages() {
      this.loading = true;
      if (this.user && this.user.key) {
        try {
          this.messages = await fetchMyMessages(this.user.key);
        } catch (error) {
          console.error('[MessageCenter] 載入訊息失敗', {
            userKey: this.user.key,
            timestamp: new Date().toISOString(),
            errorMessage: error?.message,
            errorStack: error?.stack,
            errorResponse: error?.response?.data || error?.response
          });
          alert('載入訊息失敗，請稍後再試。');
          console.error(error);
        } finally {
          this.loading = false;
        }
      } else {
          this.loading = false;
      }
    },
    /**
     * 點擊任一列時觸發
     */
    handleRowClick(event, { item }) {
      this.$router.push({ name: 'MessageDetail', params: { statusId: item.statusId } });
    },
    /**
     * 切換星號標記
     */
    async toggleImportant(item) {
      // 立即在前端更新狀態，提升使用者體驗
      item.isImportant = !item.isImportant;
      try {
        await setMessageStatus(item.statusId, 'toggleImportant');
      } catch (error) {
        // 如果 API 呼叫失敗，則復原前端的狀態
        item.isImportant = !item.isImportant;
        alert('標記重要訊息失敗，請稍後再試。');
        console.error(error);
      }
    },
    /**
     * 格式化日期時間
     */
    formatTimestamp(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();

        if (isToday) {
            return date.toLocaleTimeString('zh-TW', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
        } else {
            return date.toLocaleDateString('zh-TW', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
        }
     },
    getSystemChipColor(system) {
        switch(system) {
            case '銷控': return 'cyan';
            case '驗屋': return 'teal';
            case '報價': return 'indigo';
            default: return 'grey';
        }
    },
    // ✅ 新增：處理訊息發送完成後的動作
    handleMessageSent() {
      this.showComposeDialog = false; // 關閉 Dialog
      this.loadMessages(); // 重新載入列表 (如果是寄給自己，或者單純刷新狀態)
      // 您也可以在這裡加入一個 Snackbar 提示
    }
  }
};
</script>

<style scoped>
.v-data-table :deep(tbody tr) {
  cursor: pointer;
}

.font-weight-bold {
    color: #000; /* 讓未讀的黑色更明顯 */
}
</style>