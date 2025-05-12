<template>
  <v-app>
  
    <!-- 頂部 App Bar -->
    <v-app-bar app color="primary" dark>
  <!-- 🔵 新增：首頁按鈕 -->
  <v-btn icon @click="goHome" class="me-2">
    <v-icon>mdi-home</v-icon>
  </v-btn>
      <v-toolbar-title @mousedown="startForceUpdate" @mouseup="cancelForceUpdate" @mouseleave="cancelForceUpdate">
        ANXI 驗屋系統(富宇富御)
      </v-toolbar-title>
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
      <strong>ANXI 驗屋系統</strong> ｜ 版本 v{{ appVersion }}
    </div>
    <div class="text-caption">
      &copy; {{ currentYear }} ANXI. All rights reserved.
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

</script>

<style scoped>
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
