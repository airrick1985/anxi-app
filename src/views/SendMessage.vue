<template>
  <v-container>
    <v-card class="mx-auto" max-width="900">
      <v-toolbar color="primary" dark>
        <v-btn icon @click="$router.go(-1)">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <v-toolbar-title>撰寫新訊息</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn :loading="loading" :disabled="!isFormValid" @click="handleSendMessage">
          <v-icon left>mdi-send</v-icon>
          發送
        </v-btn>
      </v-toolbar>

      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-select v-model="selectedProject" :items="availableProjects" label="選擇建案" @update:model-value="handleProjectChange" outlined dense></v-select>
          </v-col>
          <v-col cols="12" md="6">
            <v-select v-model="selectedSystem" :items="availableSystems" label="選擇系統分類" :disabled="!selectedProject" @update:model-value="fetchRecipients" outlined dense></v-select>
          </v-col>
        </v-row>
        <div v-if="recipients.length > 0">
          <v-checkbox v-model="isAllSelected" label="全選收件人" @change="toggleSelectAll"></v-checkbox>
          <v-chip-group v-model="selectedRecipients" column multiple>
            <v-chip v-for="recipient in recipients" :key="recipient.phone" :value="recipient.phone" filter outlined>
              {{ recipient.name }}
            </v-chip>
          </v-chip-group>
        </div>
        <div v-if="loadingRecipients" class="d-flex justify-center my-4">
            <v-progress-circular indeterminate color="blue"></v-progress-circular>
            <div class="mt-4 text-subtitle-2" style="color: blcak;">載入收件人...</div>
        </div>
        <v-text-field v-model="subject" label="主旨" outlined dense class="mt-4"></v-text-field>

        <p class="mb-2">訊息內容</p>
        <TiptapEditor v-model="body" />

        <v-file-input v-model="filesToUpload" label="上傳附件" multiple outlined dense class="mt-4" prepend-icon="mdi-paperclip" :loading="isUploading" @update:model-value="handleFileUpload"></v-file-input>
        <v-list v-if="attachments.length > 0" dense>
            <v-list-subheader>已上傳的附件</v-list-subheader>
            <v-list-item v-for="(file, index) in attachments" :key="index">
                <v-list-item-title>{{ file.name }}</v-list-item-title>
                <template v-slot:append>
                    <v-btn icon="mdi-close" size="x-small" @click="removeAttachment(index)"></v-btn>
                </template>
            </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
<v-overlay v-model="loading" class="align-center justify-center">
  <div class="d-flex flex-column align-center">
    <v-progress-circular
      indeterminate
      size="64"
      color="blue" 
    ></v-progress-circular>
    
    <div class="mt-4 text-h6" style="color: white;">訊息發送中...</div>
  </div>
</v-overlay>
  </v-container>
</template>


<script>
import { useUserStore } from '@/store/user';
import { 
    fetchMessagePermissionOptions, 
    fetchRecipientList, 
    uploadMessageAttachment,
    sendMessage 
} from '@/api.js';

import TiptapEditor from '@/components/TiptapEditor.vue';

export default {
  name: 'SendMessage',
  components: {
    TiptapEditor
  },
  data() {
    return {
      loading: false,
      loadingRecipients: false,
      isUploading: false,
      permissionOptions: {},
      recipients: [],
      selectedProject: null,
      selectedSystem: null,
      selectedRecipients: [],
      isAllSelected: false,
      subject: '',
      body: '',
      filesToUpload: [], // 用於 v-file-input
      attachments: [],   // 儲存已上傳成功的檔案資訊
    };
  },
  computed: {
    userStore() {
      return useUserStore();
    },
    user() {
      return this.userStore.user;
    },
    availableProjects() {
      return Object.keys(this.permissionOptions);
    },
    availableSystems() {
      return this.selectedProject ? (this.permissionOptions[this.selectedProject] || []) : [];
    },
    isFormValid() {
      return (
        this.selectedProject &&
        this.selectedSystem &&
        this.selectedRecipients.length > 0 &&
        this.subject.trim() !== '' &&
        this.body.trim() !== '<p></p>' && // Tiptap 空白時的內容
        !this.isUploading
      );
    }
  },
  async created() {
    await this.loadPermissionOptions();
  },
  methods: {
    async loadPermissionOptions() {
      if (this.user && this.user.key) {
        try {
          this.permissionOptions = await fetchMessagePermissionOptions(this.user.key);
        } catch (error) {
          alert('載入發信權限失敗，請稍後再試。');
          console.error(error);
        }
      }
    },
    handleProjectChange() {
      this.selectedSystem = null;
      this.recipients = [];
      this.selectedRecipients = [];
      this.isAllSelected = false;
    },
    async fetchRecipients() {
        if (!this.selectedProject || !this.selectedSystem) return;
        this.loadingRecipients = true;
        this.recipients = [];
        this.selectedRecipients = [];
        this.isAllSelected = false;
        try {
            this.recipients = await fetchRecipientList(this.selectedProject, this.selectedSystem);
        } catch (error) {
            alert('載入收件人列表失敗，請稍後再試。');
            console.error(error);
        } finally {
            this.loadingRecipients = false;
        }
    },
    toggleSelectAll() {
      this.selectedRecipients = this.isAllSelected ? this.recipients.map(r => r.phone) : [];
    },
    async handleFileUpload(files) {
        if (!files || files.length === 0) return;
        this.isUploading = true;
        try {
            // 使用 Promise.all 來並行上傳所有檔案
            const uploadPromises = files.map(file => uploadMessageAttachment(file));
            const uploadedFiles = await Promise.all(uploadPromises);
            // 將所有成功上傳的檔案資訊加入 attachments 陣列
            this.attachments.push(...uploadedFiles);
        } catch (error) {
            alert('部分或全部檔案上傳失敗，請檢查網路連線並重試。');
            console.error(error);
        } finally {
            this.isUploading = false;
            this.filesToUpload = []; // 清空 v-file-input
        }
    },
    removeAttachment(index) {
      // 這裡未來可以加上從 Firebase Storage 刪除檔案的邏輯
      this.attachments.splice(index, 1);
    },
    async handleSendMessage() {
        if (!this.isFormValid) {
            alert('請填寫所有必填欄位！');
            return;
        }
        if (!confirm(`確定要將此訊息發送給 ${this.selectedRecipients.length} 位收件人嗎？`)) {
            return;
        }

        this.loading = true;
        try {
            const messageData = {
                senderKey: this.user.key,
                senderName: this.user.name,
                projectName: this.selectedProject,
                systemFunction: this.selectedSystem,
                subject: this.subject,
                body: this.body,
                recipientPhones: [...this.selectedRecipients], // 確保傳入的是一個陣列
                attachments: this.attachments // 傳入已上傳的檔案資訊陣列
            };
            
            // ✅ 新的 sendMessage 函式在成功時不會回傳任何東西，失敗時會拋出錯誤
            await sendMessage(messageData);
            
            alert('訊息已成功發送！');
            this.$router.push({ name: 'MessageCenter' }); // 建議使用具名路由跳轉

        } catch (error) {
            alert(`訊息發送失敗: ${error.message}`);
            console.error(error);
        } finally {
            this.loading = false;
        }
    },
    // toBase64 函式已不再需要，可以刪除
  },
  watch: {
    selectedRecipients(newValue) {
      this.isAllSelected = this.recipients.length > 0 && newValue.length === this.recipients.length;
    }
  }
};
</script>

<style scoped>
.v-card {
  overflow: visible;
}
</style>