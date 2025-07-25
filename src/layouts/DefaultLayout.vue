<template>
  <v-app>
    <v-app-bar app dark class="custom-app-bar">

      <v-btn icon @click="goHome" class="me-2" title="首頁">
        <v-icon>mdi-home</v-icon>
      </v-btn>

      <v-spacer />

      <div class="d-flex align-center">
        <v-img :src="logoUrl"
               max-height="60"
               contain class="mr-2"
               style="min-width: 70px; min-height: 50px; border: 1px solid transparent;">
        </v-img>
      </div>

      <v-spacer />

      <template v-if="user">
        <div v-if="display.mdAndUp.value" class="d-flex align-center">
          <v-btn icon @click="mortgageDialog = true" title="房貸試算" class="me-2">
             <v-icon>mdi-calculator-variant-outline</v-icon>
          </v-btn>
           <v-btn icon @click="contactDialog = true" title="聯絡客服" class="me-2">
            <v-icon>mdi-message-question</v-icon>
          </v-btn>
          <v-btn icon @click="toggleFullscreen" class="me-2" title="全螢幕模式">
            <v-icon>{{ isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen' }}</v-icon>
          </v-btn>
          <v-btn icon @click="goToMessageCenter" class="me-2" title="訊息中心">
            <v-badge :content="unreadCount" :model-value="unreadCount > 0" color="red" overlap>
              <v-icon>mdi-email-outline</v-icon>
            </v-badge>
          </v-btn>
          <span class="me-2 clickable" @click="dialog = true" title="個人資料">{{ user.name }}</span>
        </div>

        <v-menu v-if="display.smAndDown.value" offset-y>
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props" title="更多功能">
              <v-icon>mdi-menu</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="mortgageDialog = true">
              <template v-slot:prepend><v-icon>mdi-calculator-variant-outline</v-icon></template>
              <v-list-item-title>房貸試算</v-list-item-title>
            </v-list-item>

             <v-list-item @click="contactDialog = true">
              <template v-slot:prepend><v-icon>mdi-message-question</v-icon></template>
              <v-list-item-title>聯絡客服</v-list-item-title>
            </v-list-item>

            <v-list-item @click="goToMessageCenter">
              <template v-slot:prepend>
              <v-badge :content="unreadCount" :model-value="unreadCount > 0" color="red" overlap>
              <v-icon>mdi-email-outline</v-icon>
                </v-badge>
                </template>
            <v-list-item-title>訊息中心</v-list-item-title>
            </v-list-item>

            <v-list-item @click="dialog = true">
                <template v-slot:prepend><v-icon>mdi-account-circle-outline</v-icon></template>
                <v-list-item-title>個人資料 ({{ user.name }})</v-list-item-title>
            </v-list-item>

          </v-list>
        </v-menu>

        <v-btn icon @click="logoutDialog = true" title="登出">
          <v-icon color="error">mdi-logout</v-icon>
        </v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <router-view
        @start-loading="loading = true"
        @stop-loading="loading = false"
        @notify="showSnackbar"
      />
    </v-main>

     <v-footer v-if="isLoginPage" color="white" class="footer-text" padless>
        <v-container class="text-center py-2">
            <div><strong>ANXI建案管理系統</strong> ｜ 版本 v{{ appVersion }}</div>
            <div>&copy; {{ currentYear }} ANXISMART. All rights reserved.</div>
        </v-container>
    </v-footer>
    
    <EditProfileDialog v-model:dialog="dialog" @start-loading="loading = true" @stop-loading="loading = false" @notify="showSnackbar" />
    <UpdateDialog v-model="showUpdateDialog" :release-version="releaseVersion" :release-notes="releaseNotes" @confirm="doUpdate" />
    <v-dialog v-model="logoutDialog" persistent max-width="300">
        <v-card>
            <v-card-title>確定要登出？</v-card-title>
            <v-card-actions>
                <v-spacer />
                <v-btn text @click="logoutDialog = false">取消</v-btn>
                <v-btn color="error" text @click="confirmLogout">登出</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
    <v-snackbar v-model="snackbar" :timeout="3000">{{ snackbarMessage }}</v-snackbar>
    
 <v-dialog v-model="contactDialog" max-width="500px">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon left class="mr-2">mdi-face-agent</v-icon>
          <span class="headline">聯絡客服</span>
          <v-spacer></v-spacer>
          <v-btn icon @click="contactDialog = false" variant="text">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="text-center py-8">
          <p class="mb-4 text-h6">安熙智慧系統 官方LINE</p>
          <a href="https://lin.ee/zC5ANvL" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 24px; background-color: #00B900; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 1rem;">
            加入 LINE 官方好友
          </a>
          <p style="margin-top: 24px;"></p>
          <img src="https://qr-official.line.me/gs/M_749vjisf_GW.png?oat_content=qr" width="150" alt="LINE QR Code" style="margin-top: 8px; border: 1px solid #eee;">
        </v-card-text>
        <v-divider></v-divider>
       </v-card>
    </v-dialog>

    <v-dialog v-model="mortgageDialog" max-width="800px" scrollable>
      <MortgageCalculator @close="mortgageDialog = false" />
    </v-dialog>

  </v-app>
</template>
<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useFullscreen } from '../composables/useFullscreen';
import { storeToRefs } from 'pinia';
import { useUserStore } from '../store/user';
import { useRouter, useRoute } from 'vue-router';
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { getLatestRelease, fetchUnreadMessageCount } from '@/api';
import EditProfileDialog from '../components/EditProfileDialog.vue';
import UpdateDialog from '../components/UpdateDialog.vue';
import MortgageCalculator from '../components/MortgageCalculator.vue';
import manifest from '../../public/manifest.json';
import { useDisplay } from 'vuetify';

// 【已修正】從新的 src/assets 位置 import 圖片
import logoUrl from '@/assets/images/anxi-logo.png';

const display = useDisplay();

const userStore = useUserStore();
const { user, unreadCount } = storeToRefs(userStore); 

const dialog = ref(false);
const logoutDialog = ref(false);
const loading = ref(false);
const snackbar = ref(false);
const snackbarMessage = ref('');
const router = useRouter();
const route = useRoute();
const { isFullscreen, toggleFullscreen } = useFullscreen();
const contactDialog = ref(false);
const mortgageDialog = ref(false);

const showSnackbar = (message) => {
  snackbarMessage.value = message;
  snackbar.value = true;
};

const appVersion = ref(manifest.version);
const currentYear = ref(new Date().getFullYear());
const isLoginPage = computed(() => route.name === 'Login');

const { needRefresh, updateServiceWorker } = useRegisterSW({ immediate: true });
const showUpdateDialog = ref(false);
const releaseVersion = ref('');
const releaseNotes = ref('');
watch(needRefresh, async (val) => {
  if (val) {
    try {
      const { version, notes } = await getLatestRelease();
      releaseVersion.value = version;
      releaseNotes.value = notes;
      showUpdateDialog.value = true;
    } catch (err) {
      console.error('讀取 Release Notes 錯誤:', err);
      releaseNotes.value = '有新版本可用，請更新應用程式';
      showUpdateDialog.value = true;
    }
  }
});
const doUpdate = async () => {
  userStore.clearUser(); 
  await updateServiceWorker(true);
  showSnackbar('更新完成，請重新登入');
  setTimeout(() => window.location.reload(), 1000);
};

const confirmLogout = async () => {
  logoutDialog.value = false;
  await userStore.clearUser();
  await router.push('/login');
  showSnackbar('已成功登出');
};
const goHome = () => {
  if (route.path !== '/home') {
    router.push('/home');
  }
};
const goToMessageCenter = () => {
  router.push('/messages');
};

const initializeUnreadCount = async () => {
  if (user.value && user.value.key) {
    try {
      const count = await fetchUnreadMessageCount(user.value.key);
      userStore.setUnreadCount(count);
    } catch (error) {
      console.error('初始化未讀訊息數量失敗:', error);
      userStore.setUnreadCount(0);
    }
  }
};

onMounted(() => {
  if (user.value) {
    initializeUnreadCount();
  }
  window.addEventListener('triggerUpdateDialog', () => {
    showUpdateDialog.value = true;
  });
});

watch(user, (newUser, oldUser) => {
  if (newUser && !oldUser) {
    initializeUnreadCount();
  }
});
</script>

<style scoped>
/* 樣式部分保持不變 */
.custom-app-bar {
  background-color: transparent !important;
  background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(195, 195, 195, 0.7) 100%) !important;
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
}
:deep(.custom-app-bar .v-btn--icon .v-icon),
:deep(.custom-app-bar .v-app-bar-nav-icon .v-icon) {
  color: rgb(0, 0, 0) !important;
}
:deep(.custom-app-bar .app-bar-title) {
  color: rgb(0, 0, 0) !important;
}
:deep(.custom-app-bar span.clickable) {
  color: rgb(0, 0, 0) !important;
}
.app-bar-title {
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: clip !important;
  line-height: 1.3;
  flex-grow: 0;
  flex-shrink: 1;
  min-width: 0;
}
@media (max-width: 599px) {
  .app-bar-title {
    font-size: 0.85rem !important;
    line-height: 1.1;
  }
  .v-app-bar .v-btn {
    font-size: 0.8rem;
    max-height: 28px !important;
  }
}
.clickable {
  cursor: pointer;
}

.footer-text {
  font-size: 0.6rem;
  color: #555;
  padding-bottom: 0px;
  flex: 0 0 auto;
  max-height: 40px;
}
</style>