<template>
  <v-app>
    <!-- 更新版本通知 Dialog -->
    <v-dialog v-model="showUpdateDialog" persistent max-width="400">
      <v-card>
        <v-card-title>新版本 {{ releaseVersion }} 已推出</v-card-title>
        <v-card-text>
          <div v-html="formattedNotes"></div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="doUpdate">立即更新</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Loading 遮罩 -->
    <v-overlay :model-value="loading" class="d-flex align-center justify-center" persistent>
      <v-progress-circular indeterminate size="64" color="primary" />
    </v-overlay>

    <!-- 通知訊息 -->
    <v-snackbar v-model="snackbar" :timeout="3000">{{ snackbarMessage }}</v-snackbar>

    <!-- 頂部 App Bar -->
    <v-app-bar app color="primary" dark>
      <v-toolbar-title @mousedown="startForceUpdate" @mouseup="cancelForceUpdate" @mouseleave="cancelForceUpdate">
        ANXI 驗屋系統
      </v-toolbar-title>

      <v-spacer />
      <template v-if="user">
        <v-btn icon @click="dialog = true">
          <v-icon>mdi-account</v-icon>
        </v-btn>
        <span class="me-4 clickable" @click="dialog = true">{{ user.name }}</span>
      </template>
    </v-app-bar>

    <!-- 主要頁面內容 -->
    <v-main>
      <router-view
        @start-loading="loading = true"
        @stop-loading="loading = false"
        @notify="showSnackbar"
      />
    </v-main>

    <!-- 底部快捷選單 -->
    <BottomNavBar v-if="showBottomNav" />

    <EditProfileDialog
      v-model:dialog="dialog"
      @start-loading="loading = true"
      @stop-loading="loading = false"
      @notify="showSnackbar"
    />

    <!-- 底部 Footer -->
    <v-footer app color="grey lighten-4" height="60" class="footer-text">
      <v-container class="text-center">
        <div>
          <strong>ANXI 驗屋系統</strong> ｜ 版本 v{{ appVersion }}
        </div>
        <div class="text-caption">
          &copy; {{ currentYear }} ANXI. All rights reserved.
        </div>
      </v-container>
    </v-footer>
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
import manifest from '../public/manifest.json'; // 讀取版本

// 版本與年份
const appVersion = manifest.version;
const currentYear = new Date().getFullYear();

// 狀態管理
const userStore = useUserStore();
const { user } = storeToRefs(userStore);
const dialog = ref(false);
const loading = ref(false);
const snackbar = ref(false);
const snackbarMessage = ref('');

// Router
const router = useRouter();
const route = useRoute();

// 底部導航列顯示條件
const showBottomNav = computed(() =>
  user.value && ['Home', 'InspectionRecord', 'InspectionOverview'].includes(route.name)
);

// 顯示 Snackbar
const showSnackbar = (message) => {
  snackbarMessage.value = message;
  snackbar.value = true;
};

// 未登入自動跳 login
onMounted(() => {
  if (!user.value && route.name !== 'Login') {
    router.replace({ name: 'Login' });
  }
});

// PWA 監聽
const { needRefresh, updateServiceWorker } = useRegisterSW({ immediate: true });
const showUpdateDialog = ref(false);
const releaseVersion = ref('');
const releaseNotes = ref('');

// 更新版本提示
watch(needRefresh, async (val) => {
  if (val) {
    try {
      const { version, notes } = await getLatestRelease();
      releaseVersion.value = version;
      releaseNotes.value = notes;
      showUpdateDialog.value = true;
    } catch (err) {
      console.error('讀取 release notes 錯誤:', err);
      releaseVersion.value = '';
      releaseNotes.value = '有新版本可用，請更新應用程式';
      showUpdateDialog.value = true;
    }
  }
});

// 格式化更新內容
const formattedNotes = computed(() => {
  if (Array.isArray(releaseNotes.value)) {
    return releaseNotes.value.map(note => `• ${note}`).join('<br/>');
  } else if (typeof releaseNotes.value === 'string') {
    return releaseNotes.value.replace(/\n/g, '<br/>');
  }
  return '';
});

// 點擊更新按鈕
const doUpdate = async () => {
  userStore.clearUser(); // 登出
  await updateServiceWorker(true); // 更新 SW
  showSnackbar('更新完成，請重新登入');
  setTimeout(() => window.location.reload(), 1000);
};

// 長按標題強制更新
let forceUpdateTimer = null;

const startForceUpdate = () => {
  forceUpdateTimer = setTimeout(async () => {
    console.log('⏰ 偵測到長按 3 秒，強制更新 Service Worker');
    await updateServiceWorker(true);
    window.location.reload();
  }, 3000);
};

const cancelForceUpdate = () => {
  clearTimeout(forceUpdateTimer);
  forceUpdateTimer = null;
};
</script>

<style scoped>
body {
  margin: 0;
}
.clickable {
  cursor: pointer;
}
.footer-text {
  font-size: 0.8rem;
  color: #555;
}
</style>
