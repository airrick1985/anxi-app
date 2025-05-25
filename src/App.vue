<template>
  <v-app>
  
    <!-- 頂部 App Bar -->
    <v-app-bar app color="black" dark>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
  <!-- 🔵 新增：首頁按鈕 -->
  <v-btn icon @click="goHome" class="me-2">
    <v-icon>mdi-home</v-icon>
  </v-btn>
<v-spacer />
      <div class="d-flex align-center">
        <!-- 使用修正後的 src 路徑 -->
        <v-img src="public/icons/LOGO.svg"
       max-height="60"
       contain
       class="mr-2"
       style="min-width: 50px; min-height: 50px; border: 1px solid transparent;" >
</v-img>

     <span class="app-bar-title text-h6 d-none d-sm-inline-block" 
              style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          安熙智慧建案管理系統
        </span>
      </div>
      <v-spacer />

      <template v-if="user">
        <v-menu
  offset-y
  :close-on-content-click="false"
  v-model="menu"
  :activator="menuActivator"
>
  <v-list>
    <v-list-item @click="dialog = true">
      <v-list-item-title>個人資料</v-list-item-title>
    </v-list-item>
    <v-list-item @click="logoutDialog = true">
      <v-list-item-title>登出</v-list-item-title>
    </v-list-item>
  </v-list>
</v-menu>

<v-btn icon ref="menuActivator">
  <v-icon>mdi-dots-vertical</v-icon>
</v-btn>


        <span class="me-4 clickable" @click="dialog = true">{{ user.name }}</span>
      </template>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" width="150" temporary>
      <v-list nav dense>
        <v-list-item 
          prepend-icon="mdi-home-search" 
          title="驗屋系統" 
          v-if="userStore.hasPermission('驗屋系統')"
          @click="navigateTo('InspectionSystem')">
        </v-list-item>
        <v-list-item 
          prepend-icon="mdi-table-large" 
          title="銷控系統" 
          v-if="userStore.hasPermission('銷控系統')"
          @click="drawer = false">
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

    <!-- 主要頁面 -->
    <v-main>
      <router-view
        @start-loading="loading = true"
        @stop-loading="loading = false"
        @notify="showSnackbar"
      />
<!-- 浮動式 BottomNavBar -->
<//BottomNavBar v-if="showBottomNav" />
      
      <!-- Footer -->
<v-footer
  v-if="isLoginPage"
  color="grey lighten-4"
  height="80"
  class="footer-text"
  padless
>
  <v-container class="text-center py-2">
    <div>
      <strong>安熙智慧建案管理系統</strong> ｜ 版本 v{{ appVersion }}
    </div>
    <div class="text-caption">
      &copy; {{ currentYear }} ANXISMART. All rights reserved.
    </div>
  </v-container>
</v-footer>


    </v-main>

    <!-- 個人資料 Dialog -->
    <EditProfileDialog
      v-model:dialog="dialog"
      @start-loading="loading = true"
      @stop-loading="loading = false"
      @notify="showSnackbar"
    />

    <!-- 更新版 Dialog -->
    <UpdateDialog
      v-model="showUpdateDialog"
      :release-version="releaseVersion"
      :release-notes="releaseNotes"
      @confirm="doUpdate"
    />

    <!-- 登出確認 Dialog -->
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

    <!-- 系統通知 Snackbar -->
    <v-snackbar v-model="snackbar" :timeout="3000">{{ snackbarMessage }}</v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
const drawer = ref(false);
import { storeToRefs } from 'pinia';
import { useUserStore } from './store/user';
import { useRouter, useRoute } from 'vue-router';
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { getLatestRelease } from '@/api';
import EditProfileDialog from './components/EditProfileDialog.vue';
import BottomNavBar from './components/BottomNavBar.vue';
import UpdateDialog from './components/UpdateDialog.vue';
import manifest from '../public/manifest.json';

const isLoginPage = computed(() => route.name === 'Login');


const userStore = useUserStore();
const { user } = storeToRefs(userStore);
const dialog = ref(false);
const logoutDialog = ref(false); // 登出對話框
const loading = ref(false);
const snackbar = ref(false);
const snackbarMessage = ref('');
const appVersion = manifest.version;
const currentYear = new Date().getFullYear();

const menu = ref(false);          // 控制 menu 打開
const menuActivator = ref(null);  // 綁定 activator


// Router
const router = useRouter();
const route = useRoute();

// 底部導航顯示條件
const showBottomNav = computed(() => 
  user.value && route.name !== 'Login'
);


// 強制更新連點
const homeClickCount = ref(0);
let clickTimer = null;
const startForceUpdate = () => {
  homeClickCount.value++;
  if (homeClickCount.value >= 5) {
    console.log('🔄 手動觸發更新');
    updateServiceWorker(true).then(() => window.location.reload());
    homeClickCount.value = 0;
    clearTimeout(clickTimer);
  } else {
    if (clickTimer) clearTimeout(clickTimer);
    clickTimer = setTimeout(() => homeClickCount.value = 0, 3000);
  }
};
const cancelForceUpdate = () => {
  if (clickTimer) clearTimeout(clickTimer);
  homeClickCount.value = 0;
};

// Snackbar
const showSnackbar = (message) => {
  snackbarMessage.value = message;
  snackbar.value = true;
};

// PWA 更新管理
const { needRefresh, updateServiceWorker } = useRegisterSW({ immediate: true });
const showUpdateDialog = ref(false);
const releaseVersion = ref('');
const releaseNotes = ref('');

// 用戶登入後也檢查更新
onMounted(() => {
  if (!user.value && route.name !== 'Login') {
    router.replace({ name: 'Login' });
  }
  window.addEventListener('triggerUpdateDialog', () => {
    showUpdateDialog.value = true;
  });
});

// 監聽更新
watch(needRefresh, async (val) => {
  if (val) {
    try {
      const { version, notes } = await getLatestRelease();
      releaseVersion.value = version;
      releaseNotes.value = notes;
      showUpdateDialog.value = true;
    } catch (err) {
      console.error('讀取 Release Notes 錯誤:', err);
      releaseVersion.value = '';
      releaseNotes.value = '有新版本可用，請更新應用程式';
      showUpdateDialog.value = true;
    }
  }
});

// 確認更新
const doUpdate = async () => {
  userStore.clearUser(); 
  await updateServiceWorker(true);
  showSnackbar('更新完成，請重新登入');
  setTimeout(() => window.location.reload(), 1000);
};


// 登出流程
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
  drawer.value = false; // drawer is already defined
};

</script>

<style scoped>

.app-bar-title {
  /* 確保文字可以換行並完整顯示 */
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: clip !important; /* 或者 initial/unset */
  line-height: 1.3; /* 調整行高以適應可能的換行 */
  /* 確保標題不會被 flex item 的默認行為壓縮 */
  flex-grow: 0; /* 讓標題嘗試佔據可用空間 */
  flex-shrink: 1; /* 允許標題在空間不足時收縮（但配合換行） */
  min-width: 0; /* 允許 flex item 收縮到其內容大小以下 */
}

/* 針對手機屏幕調整字體大小 */
@media (max-width: 599px) { /* 假設手機屏幕寬度小於 600px */
  .app-bar-title {
    font-size: 0.85rem !important; /* 調整為適合手機的字體大小 */
    line-height: 1.1;
  }
  /* 你可能還需要調整 v-app-bar 的 padding 或按鈕的大小來騰出更多空間 */

  .v-app-bar .v-btn {
    font-size: 0.8rem;
    max-height: 28px !important;
  }

}

.footer-text {
  font-size: 0.8rem;
  color: #555;
  padding-bottom: 20px;
}

body {
  margin: 0;
}

.clickable {
  cursor: pointer;
}



</style>
