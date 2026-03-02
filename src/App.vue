<template>
  <component :is="layoutComponent">
    <router-view />
  </component>

  <v-overlay
    :model-value="isUpdating"
    class="align-center justify-center"
    persistent
  >
    <v-progress-circular
      color="white"
      indeterminate
      size="64"
    ></v-progress-circular>
    <div class="text-center mt-4" style="color: white;">應用程式更新中...</div>
  </v-overlay>

  <v-dialog
    v-model="sessionErrorDialog"
    max-width="400"
    persistent
    class="align-center justify-center"
  >
    <v-card class="text-center pa-4">
      <v-icon size="64" color="error" class="mb-4">mdi-alert-circle-outline</v-icon>
      
      <v-card-title class="text-h5 font-weight-bold mb-2">
        帳號已登出
      </v-card-title>
      
      <v-card-text class="text-body-1">
        您的帳號已在另一處登入，為了安全起見，本裝置已登出。
        <br><br>
        請點擊下方按鈕重新整理頁面後再次登入。
      </v-card-text>

      <v-card-actions class="justify-center mt-4">
        <v-btn
          color="primary"
          variant="elevated"
          size="large"
          block
          prepend-icon="mdi-refresh"
          @click="reloadPage"
        >
          重新整理頁面
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 系統問題回報（全域浮動按鈕） -->
  <SystemBugReport />
  </template>

<script setup>
// ✓ 步驟一：在 import 區域加入 useRouter
import { computed, defineAsyncComponent, onMounted, watch, ref } from 'vue'; 
import { useRoute, useRouter } from 'vue-router'; // <--- 修改此行，加入 useRouter
import { useProjectStore } from '@/store/projectStore';
import { useUserStore } from '@/store/user'; 
import { db } from '@/firebase'; 
import { doc, onSnapshot } from 'firebase/firestore'; 
import { useToast } from 'vue-toastification'; 
import DefaultLayout from './layouts/DefaultLayout.vue'; 
import { useRegisterSW } from 'virtual:pwa-register/vue';
import SystemBugReport from '@/components/SystemBugReport.vue';

// ✓ 步驟二：建立 router 實例
const router = useRouter(); // <--- 新增此行
const route = useRoute();
const projectStore = useProjectStore();
const userStore = useUserStore(); 
const toast = useToast(); 

const isUpdating = ref(false);
// ✅ [新增] 控制錯誤 Dialog 的變數
const sessionErrorDialog = ref(false);

// ✅ [新增] 重新整理頁面的函式
const reloadPage = () => {
  window.location.reload();
};

const layoutComponent = computed(() => {
  const layout = route.meta.layout;
  if (layout) {
    // 如果 layout 是一個函式 (代表它是 () => import(...) 的動態引入)，就用 defineAsyncComponent
    if (typeof layout === 'function') {
      return defineAsyncComponent(layout);
    }
    // 如果 layout 不是函式 (代表它是一個 import ... from ... 的靜態引入元件)，就直接使用它
    return layout;
  }
  // 如果路由沒有指定 layout，使用預設的 DefaultLayout (靜態引入)
  return DefaultLayout;
});

const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegistered(r) {
    console.log(`Service Worker registered: ${r}`);
    if (r) {
      setInterval(() => {
        r.update();
      }, 60 * 60 * 1000);
    }
  },
  onRegisterError(error) {
    console.error('Service Worker registration error:', error);
  },
});

watch(needRefresh, (newValue) => {
  if (newValue) {
    console.log('New content available, forcing update.');
    isUpdating.value = true;
    updateServiceWorker();
  }
});

// ✓ 步驟三：修改 onMounted 函式
onMounted(() => {
  // --- 新增的 LIFF 重新導向處理邏輯 START ---
  const params = new URLSearchParams(window.location.search);
  const liffPath = params.get('liff_path');

  if (liffPath) {
    // 如果有路標，就使用 router 導向到正確的 Hash 路徑
    // 使用 replace 可避免在瀏覽歷史中留下帶有 liff_path 的紀錄
    router.replace({ path: `/${liffPath}` });
  }
  // --- 新增的 LIFF 重新導向處理邏輯 END ---

  // 保留您原本的邏輯
  projectStore.fetchProjects();
});

let unsubscribe = null; 

watch(() => userStore.user, (newUser) => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  
  // ✅ 加上本地環境除外判斷，開發時不要檢查 activeSessionId，避免頻繁登出
  if (window.location.hostname === 'localhost') {
    return;
  }

  if (newUser && newUser.key) {
    const userDocRef = doc(db, 'users', newUser.key);
    unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (!userStore.user) {
        if (unsubscribe) unsubscribe();
        return;
      }
      
      // ✅ [修改] 邏輯處理區塊
      if (docSnap.exists()) {
        const serverSessionId = docSnap.data().activeSessionId;
        const clientSessionId = userStore.sessionId;
        
        if (serverSessionId && clientSessionId && serverSessionId !== clientSessionId) {
          console.warn('[Session Check] Session ID mismatch! Forcing logout.');
          
          // 1. 先執行登出清除狀態
          userStore.logoutUser();
          
          // 2. 顯示 Dialog 取代原本的 Toast
          sessionErrorDialog.value = true;
        }
      } else {
        console.warn('[Session Check] User document no longer exists. Forcing logout.');
        // 針對使用者被刪除的情況，也建議一併使用 Dialog
        userStore.logoutUser();
        sessionErrorDialog.value = true;
      }
    });
  }
}, { immediate: true });
</script>

<style>
/* 您原本在 App.vue 中的全局 CSS 樣式可以保留在這裡 */
html {
  overflow-y: auto !important;
}
.v-main::-webkit-scrollbar {
  width: 8px;
}
.v-main::-webkit-scrollbar-thumb {
  background: #F4F4F7;
  border-radius: 4px;
}
.v-main::-webkit-scrollbar-track {
  background: #F4F4F7;
}
</style>