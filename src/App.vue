<template>
  <component :is="layoutComponent">
    <router-view />
  </component>
</template>

<script setup>
import { computed, defineAsyncComponent, onMounted, watch } from 'vue'; // ✅ 1. 引入 watch
import { useRoute } from 'vue-router';
import { useProjectStore } from '@/store/projectStore';
import { useUserStore } from '@/store/user'; // ✅ 2. 引入 userStore
import { db } from '@/firebase'; // ✅ 3. 引入 db (Firestore 實例)
import { doc, onSnapshot } from 'firebase/firestore'; // ✅ 4. 引入 Firestore 監聽器相關函式
import { useToast } from 'vue-toastification'; // ✅ 5. 引入 toast 以便提示使用者

const route = useRoute();
const projectStore = useProjectStore();
const userStore = useUserStore(); // 建立 userStore 實例
const toast = useToast(); // 建立 toast 實例

const layoutComponent = computed(() => {
  const layoutLoader = route.meta.layout;
  if (layoutLoader) {
    return defineAsyncComponent(layoutLoader);
  }
  // 改為動態導入以避免衝突
  return defineAsyncComponent(() => import('./layouts/DefaultLayout.vue'));
});

onMounted(() => {
  projectStore.fetchProjects();
});

// ✅ START: 新增 activeSessionId 的即時監聽器
let unsubscribe = null; // 用來存放取消監聽的函式

watch(() => userStore.user, (newUser) => {
  // 先確保舊的監聽器被清除
  if (unsubscribe) {
    console.log('[Session Check] User logged out or changed, stopping previous listener.');
    unsubscribe();
    unsubscribe = null;
  }

  // 如果有新使用者登入 (newUser 不是 null)
  if (newUser && newUser.key) {
    console.log(`[Session Check] User ${newUser.key} logged in. Starting to watch session ID.`);
    const userDocRef = doc(db, 'users', newUser.key);

    // 啟動對使用者文件的即時監聽
    unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (!userStore.user) {
        console.log('[Session Check] Listener fired, but user is already logged out. Stopping.');
        if (unsubscribe) unsubscribe();
        return;
      }
    
      if (docSnap.exists()) {
        const serverSessionId = docSnap.data().activeSessionId;
        const clientSessionId = userStore.sessionId;

        console.log(`[Session Check] Server Session ID: ${serverSessionId}`);
        console.log(`[Session Check] Client Session ID: ${clientSessionId}`);

        // 核心邏輯：如果 server 上的 ID 存在，且與 client 的 ID 不符
        if (serverSessionId && clientSessionId && serverSessionId !== clientSessionId) {
          console.warn('[Session Check] Session ID mismatch! Forcing logout.');
          
          // 顯示提示訊息
          toast.error("您的帳號已在另一處登入，此處連線已中斷。", {
            timeout: 5000, // 顯示 5 秒
          });

          // 執行強制登出
          userStore.logoutUser();
        }
      } else {
        // 如果遠端文件被刪除，也強制登出
        console.warn('[Session Check] User document no longer exists. Forcing logout.');
        toast.error("使用者資料異常，請重新登入。", { timeout: 5000 });
        userStore.logoutUser();
      }
    });
  }
}, { immediate: true }); // immediate: true 確保頁面重整時也能立刻觸發一次
// ✅ END: 新增 activeSessionId 的即時監聽器
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
  background: #90A4AE;
  border-radius: 4px;
}
.v-main::-webkit-scrollbar-track {
  background: #CFD8DC;
}
</style>