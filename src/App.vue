<template>
  <component :is="layoutComponent">
    <router-view />
  </component>

  <!-- ✅ [新增] 版本強制更新對話框：useVersionCheck 偵測到新版本（前景）時開啟 -->
  <UpdateDialog :model-value="needUpdate" :latest-version="latestVersion" />

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

  <!-- 系統問題回報（全域浮動按鈕，不顯示於 Landing Page） -->
  <SystemBugReport v-if="showBugReport" />
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
import SystemBugReport from '@/components/SystemBugReport.vue';
import UpdateDialog from '@/components/UpdateDialog.vue';
import { useVersionCheck } from '@/composables/useVersionCheck';

// ✓ 步驟二：建立 router 實例
const router = useRouter(); // <--- 新增此行
const route = useRoute();
const projectStore = useProjectStore();
const userStore = useUserStore(); 
const toast = useToast(); 

// ✅ [新增] 版本檢查器：每 5 分鐘 + 分頁回前景時比對線上版本，
// 背景分頁靜默更新、前景跳強制更新對話框（UpdateDialog）
const { needUpdate, latestVersion } = useVersionCheck();

// ✅ [新增] 控制錯誤 Dialog 的變數
const sessionErrorDialog = ref(false);

// ✅ [新增] 重新整理頁面的函式
const reloadPage = () => {
  window.location.reload();
};

// 系統問題回報浮動按鈕：不顯示於 Landing Page（首頁）
const showBugReport = computed(() => route.name !== 'LandingPage');

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

// PWA 已停用：原本的 useRegisterSW / needRefresh 邏輯（stub no-op、永不觸發）已移除，
// 版本更新改由上方 useVersionCheck 負責。

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
        // ✅ 指定帳號可不受重複登入限制（多裝置同時在線），跳過 Session 比對
        if (docSnap.data().allowMultiLogin === true) {
          return;
        }

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