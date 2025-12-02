<template>
  <v-card class="d-flex flex-column fill-height">
    <v-toolbar color="primary" dark elevation="2">
      <v-btn icon @click="handleClose">
        <v-icon>mdi-close</v-icon>
      </v-btn>
      <v-toolbar-title>撰寫新訊息</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn 
        :loading="loading" 
        :disabled="!isFormValid" 
        @click="handleSendMessage"
        variant="text"
      >
        <v-icon left>mdi-send</v-icon>
        發送
      </v-btn>
    </v-toolbar>

    <v-card-text class="flex-grow-1 overflow-y-auto pa-0">
      <v-container>
        <v-row class="mt-2">
          <v-col cols="12" md="6">
            <v-select 
              v-model="selectedProject" 
              :items="availableProjects" 
              label="選擇建案" 
              @update:model-value="handleProjectChange" 
              outlined 
              dense
            ></v-select>
          </v-col>
          <v-col cols="12" md="6">
            <v-select 
              v-model="selectedSystem" 
              :items="availableSystems" 
              label="選擇系統分類" 
              :disabled="!selectedProject" 
              @update:model-value="fetchRecipients" 
              outlined 
              dense
            ></v-select>
          </v-col>
        </v-row>

        <div v-if="recipients.length > 0" class="mb-4">
          <v-checkbox 
            v-model="isAllSelected" 
            label="全選收件人" 
            @change="toggleSelectAll"
            hide-details
            class="mb-2"
          ></v-checkbox>
          <v-chip-group v-model="selectedRecipients" column multiple>
            <v-chip 
              v-for="recipient in recipients" 
              :key="recipient.phone" 
              :value="recipient.phone" 
              filter 
              outlined
            >
              {{ recipient.name }}
            </v-chip>
          </v-chip-group>
        </div>

        <div v-if="loadingRecipients" class="d-flex justify-center my-4">
            <v-progress-circular indeterminate color="blue"></v-progress-circular>
            <div class="mt-4 text-subtitle-2 ml-2" style="color: black;">載入收件人...</div>
        </div>

        <v-text-field 
          v-model="subject" 
          label="主旨" 
          outlined 
          dense 
          class="mt-2"
        ></v-text-field>

        <p class="mb-2 text-subtitle-1">訊息內容</p>
        <TiptapEditor v-model="body" />

        <v-file-input 
          v-model="filesToUpload" 
          label="上傳附件" 
          multiple 
          outlined 
          dense 
          class="mt-4" 
          prepend-icon="mdi-paperclip" 
          :loading="isUploading" 
          @update:model-value="handleFileUpload"
        ></v-file-input>

        <v-list v-if="attachments.length > 0" dense border class="rounded-lg mb-4">
            <v-list-subheader>已上傳的附件</v-list-subheader>
            <v-list-item v-for="(file, index) in attachments" :key="index">
                <template v-slot:prepend>
                  <v-icon color="grey">mdi-file-document-outline</v-icon>
                </template>
                <v-list-item-title>{{ file.name }}</v-list-item-title>
                <template v-slot:append>
                    <v-btn icon="mdi-close" size="small" variant="text" color="grey" @click="removeAttachment(index)"></v-btn>
                </template>
            </v-list-item>
        </v-list>
      </v-container>
    </v-card-text>

    <v-overlay v-model="loading" class="align-center justify-center" persistent>
      <div class="d-flex flex-column align-center">
        <v-progress-circular
          indeterminate
          size="64"
          color="white" 
        ></v-progress-circular>
        <div class="mt-4 text-h6 text-white">訊息發送中...</div>
      </div>
    </v-overlay>
  </v-card>
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
  // ✅ 新增 props 與 emits 設定
  props: {
    isDialog: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'sent'],
  
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
      filesToUpload: [],
      attachments: [],
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
        this.body.trim() !== '<p></p>' &&
        !this.isUploading
      );
    }
  },
  async created() {
    await this.loadPermissionOptions();
  },
  methods: {
    // ✅ 新增：統一處理關閉/返回邏輯
    handleClose() {
      if (this.isDialog) {
        this.$emit('close');
      } else {
        this.$router.go(-1);
      }
    },

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
            const uploadPromises = files.map(file => uploadMessageAttachment(file));
            const uploadedFiles = await Promise.all(uploadPromises);
            this.attachments.push(...uploadedFiles);
        } catch (error) {
            alert('部分或全部檔案上傳失敗，請檢查網路連線並重試。');
            console.error(error);
        } finally {
            this.isUploading = false;
            this.filesToUpload = [];
        }
    },
    removeAttachment(index) {
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
                recipientPhones: [...this.selectedRecipients],
                attachments: this.attachments
            };
            
            await sendMessage(messageData);
            
            // ✅ 修改：成功後根據模式決定行為
            if (this.isDialog) {
              // Dialog 模式：發送事件通知父層，父層負責關閉與刷新
              this.$emit('sent');
              // 選擇性：可以在這裡先清空表單，以便下次打開是空的
              this.resetForm(); 
            } else {
              // 路由模式：跳轉回列表
              alert('訊息已成功發送！');
              this.$router.push({ name: 'MessageCenter' });
            }

        } catch (error) {
            alert(`訊息發送失敗: ${error.message}`);
            console.error(error);
        } finally {
            this.loading = false;
        }
    },
    resetForm() {
      this.selectedProject = null;
      this.selectedSystem = null;
      this.selectedRecipients = [];
      this.isAllSelected = false;
      this.subject = '';
      this.body = '';
      this.attachments = [];
      this.filesToUpload = [];
    }
  },
  watch: {
    selectedRecipients(newValue) {
      this.isAllSelected = this.recipients.length > 0 && newValue.length === this.recipients.length;
    }
  }
};
</script>

<style scoped>
/* 確保在 Dialog 中內容不被遮擋 */
.v-card {
  overflow: hidden;
}
</style>