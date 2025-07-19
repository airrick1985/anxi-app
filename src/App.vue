<template>
  <v-app>
 
    <v-app-bar app dark class="custom-app-bar">
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-btn icon @click="goHome" class="me-2">
        <v-icon>mdi-home</v-icon>
      </v-btn>
      <v-spacer />
      <div class="d-flex align-center">
        <v-img src="img/icons/LOGO.svg" max-height="60" contain class="mr-2" style="min-width: 50px; min-height: 50px; border: 1px solid transparent;"></v-img>
        <span class="app-bar-title text-h6 d-none d-sm-inline-block" style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ANXI建案管理系統
        </span>
      </div>
      <v-spacer />

      <template v-if="user">
        <div class="d-flex align-center">
          <v-btn icon @click="toggleFullscreen" class="me-2">
            <v-icon>{{ isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen' }}</v-icon>
          </v-btn>

          <v-btn icon @click="goToMessageCenter" class="me-2">
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
          <v-menu v-model="menu" offset-y :close-on-content-click="false">
            <template v-slot:activator="{ props }">
              <v-btn icon v-bind="props">
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item @click="dialog = true">
                <v-list-item-title>個人資料</v-list-item-title>
              </v-list-item>
              <v-list-item @click="logoutDialog = true">
                <v-list-item-title>登出</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </template>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" width="150" temporary>
      <v-list nav dense>
        <v-list-item 
          prepend-icon="mdi-email" 
          title="訊息中心" 
          v-if="user"
          @click="navigateTo('MessageCenter')">
        </v-list-item>
        <v-list-item 
          prepend-icon="mdi-home-search" 
          title="驗屋系統" 
          v-if="userStore.hasPermission('驗屋系統')"
          @click="navigateTo('InspectionSystem')">
        </v-list-item>
        <v-list-item 
          prepend-icon="mdi-table-large" 
          title="報價系統" 
          v-if="userStore.hasPermission('報價系統')"
          @click="goToEntryPage('quote')">
        </v-list-item>
        <v-list-item 
          prepend-icon="mdi-chart-line" 
          title="銷控系統" 
          v-if="userStore.hasPermission('銷控系統')"
          @click="goToEntryPage('sales')">
        </v-list-item>
        <v-list-item 
          prepend-icon="mdi-account-group" 
          title="客戶管理" 
          v-if="userStore.hasPermission('客戶管理')"
          @click="drawer = false">
        </v-list-item>
        <v-list-item 
          prepend-icon="mdi-floor-plan" 
          title="客變系統" 
          v-if="userStore.hasPermission('客變系統')"
          @click="drawer = false">
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <router-view
        @start-loading="loading = true"
        @stop-loading="loading = false"
        @notify="showSnackbar"
      />
    </v-main>
    
    <v-footer v-if="isLoginPage" color="white" height="80" class="footer-text" padless>
        <v-container class="text-center py-2">
            <div><strong>ANXI建案管理系統</strong> ｜ 版本 v{{ appVersion }}</div>
            <div class="text-caption">&copy; {{ currentYear }} ANXISMART. All rights reserved.</div>
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
  </v-app>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'; // ✅ onUnmounted 已不再需要
import { useFullscreen } from './composables/useFullscreen';
import { storeToRefs } from 'pinia';
import { useUserStore } from './store/user';
import { useRouter, useRoute } from 'vue-router';
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { getLatestRelease, fetchUnreadMessageCount } from '@/api';
import EditProfileDialog from './components/EditProfileDialog.vue';
import BottomNavBar from './components/BottomNavBar.vue';
import UpdateDialog from './components/UpdateDialog.vue';
import manifest from '../public/manifest.json';

const drawer = ref(false);
const userStore = useUserStore();
// ✅ 核心修改：直接從 store 解構出 unreadCount
const { user, unreadCount } = storeToRefs(userStore); 

const dialog = ref(false);
const logoutDialog = ref(false);
const loading = ref(false);
const snackbar = ref(false);
const snackbarMessage = ref('');
const appVersion = manifest.version;
const currentYear = new Date().getFullYear();
const menu = ref(false);
const router = useRouter();
const route = useRoute();
const { isFullscreen, toggleFullscreen } = useFullscreen();
const isLoginPage = computed(() => route.name === 'Login');

const showSnackbar = (message) => {
  snackbarMessage.value = message;
  snackbar.value = true;
};

// --- PWA 更新相關邏輯 (維持不變) ---
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

// --- 登出與導航 (維持不變) ---
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
const navigateTo = (routeName) => {
  if (route.name !== routeName) {
    router.push({ name: routeName });
  }
  drawer.value = false;
};
const goToEntryPage = (mode) => {
  router.push({ name: 'SalesControlSystemEntry', query: { viewMode: mode } });
  drawer.value = false;
};
const goToMessageCenter = () => {
  router.push('/messages');
};

// ✅ 核心修改：簡化後的未讀訊息邏輯
const initializeUnreadCount = async () => {
  if (user.value && user.value.key) {
    try {
      const count = await fetchUnreadMessageCount(user.value.key);
      // 呼叫 store 的 action 來設定初始值
      userStore.setUnreadCount(count);
    } catch (error) {
      console.error('初始化未讀訊息數量失敗:', error);
      userStore.setUnreadCount(0);
    }
  }
};

// --- 生命週期與監聽器 ---
onMounted(() => {
  // 應用程式載入時，如果已登入，就去後端拿一次最新的數字
  if (user.value) {
    initializeUnreadCount();
  }
  window.addEventListener('triggerUpdateDialog', () => {
    showUpdateDialog.value = true;
  });
});

// ✅ 監聽 user 的變化，只在登入時初始化一次
watch(user, (newUser, oldUser) => {
  if (newUser && !oldUser) {
    // 從「未登入」變為「登入」狀態時，初始化未讀計數
    initializeUnreadCount();
  }
  // 登出時，store 的 clearUser action 會自動清空數字，這裡不需處理
});
</script>

<style>
/* 您的全局樣式 */
html {
  overflow-y: auto !important;
}
.v-main::-webkit-scrollbar {
  width: 8px;
}
.v-main::-webkit-scrollbar-thumb {
  background: #90A4AE;
  border-radius: 4px;
}
.v-main::-webkit-scrollbar-track {
  background: #CFD8DC;
}
</style>

<style scoped>
/* 您的 scoped 樣式 */
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
.footer-text {
  font-size: 0.8rem;
  color: #555;
  padding-bottom: 0px;
  flex: 0 0 auto;
  max-height: 60px;
}
body {
  margin: 0;
}
.clickable {
  cursor: pointer;
}
</style>