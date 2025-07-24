<template>
  <v-app>
    <v-app-bar app dark class="custom-app-bar">
      
      <v-menu offset-y>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props" class="me-2" title="小工具">
            <v-icon>mdi-menu</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="mortgageDialog = true">
            <template v-slot:prepend>
              <v-icon>mdi-calculator-variant-outline</v-icon>
            </template>
            <v-list-item-title>房貸試算機</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-btn icon @click="goHome" class="me-2" title="功能選單">
        <v-icon>mdi-home</v-icon>
      </v-btn>
      <v-btn icon @click="contactDialog = true" title="聯絡客服">
        <v-icon>mdi-message-question</v-icon>
      </v-btn>

      <v-spacer />
      <div class="d-flex align-center">
        <v-img src="public/img/icons/LOGO.svg" max-height="60" contain class="mr-2" style="min-width: 50px; min-height: 50px; border: 1px solid transparent;"></v-img>
        <span class="app-bar-title text-h6 d-none d-sm-inline-block" style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ANXI建案管理系統
        </span>
      </div>
      <v-spacer />

      <template v-if="user">
        <div class="d-flex align-center">
          <v-btn icon @click="toggleFullscreen" class="me-2" title="全螢幕模式">
            <v-icon>{{ isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen' }}</v-icon>
          </v-btn>

          <v-btn icon @click="goToMessageCenter" class="me-2" title="訊息中心">
            <v-badge
              :content="unreadCount"
              :model-value="unreadCount > 0"
              color="red"
              overlap
            >
              <v-icon>mdi-email-outline</v-icon>
            </v-badge>
          </v-btn>
          
          <span class="me-2 clickable" @click="dialog = true" title="個人資料">{{ user.name }}</span>
          
          <v-btn icon @click="logoutDialog = true" title="登出">
            <v-icon color="error">mdi-logout</v-icon>
          </v-btn>
        </div>
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
      </v-dialog>

    <v-dialog v-model="mortgageDialog" max-width="800px" scrollable>
      <MortgageCalculator @close="mortgageDialog = false" />
    </v-dialog>

  </v-app>
</template>

<script setup>
// 4. 所有相關的 script 內容也都移到這裡
import { ref, computed, watch, onMounted } from 'vue'; // 確保 computed 被導入
import { useFullscreen } from '../composables/useFullscreen'; // 注意路徑變化
import { storeToRefs } from 'pinia';
import { useUserStore } from '../store/user'; // 注意路徑變化
import { useRouter, useRoute } from 'vue-router';
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { getLatestRelease, fetchUnreadMessageCount } from '@/api';
import EditProfileDialog from '../components/EditProfileDialog.vue'; // 注意路徑變化
import UpdateDialog from '../components/UpdateDialog.vue'; // 注意路徑變化
import MortgageCalculator from '../components/MortgageCalculator.vue'; // 注意路徑變化
import manifest from '../../public/manifest.json'; // 注意路徑變化



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

// --- Footer 相關邏輯 ---
const appVersion = ref(manifest.version);
const currentYear = ref(new Date().getFullYear());
// 判斷是否為登入頁，以決定是否顯示 Footer
const isLoginPage = computed(() => route.name === 'Login');

// PWA 更新相關邏輯
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

// 登出與導航
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

// 生命週期與監聽器
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
/* 5. 所有相關的 scoped 樣式也都移到這裡 */
.custom-app-bar {
  background-image: linear-gradient(135deg, #ffffff 0%, #c3c3c3 100%) !important;
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