<template>
  <component :is="layoutComponent">
    <router-view />
  </component>

  <!-- 新增：PWA 強制更新遮罩 -->
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

// ✓ 步驟二：建立 router 實例
const router = useRouter(); // <--- 新增此行
const route = useRoute();
const projectStore = useProjectStore();
const userStore = useUserStore(); 
const toast = useToast(); 

const isUpdating = ref(false);

const layoutComponent = computed(() => {
  const layoutLoader = route.meta.layout;
  if (layoutLoader) {
    return defineAsyncComponent(layoutLoader);
  }
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
  if (newUser && newUser.key) {
    const userDocRef = doc(db, 'users', newUser.key);
    unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (!userStore.user) {
        if (unsubscribe) unsubscribe();
        return;
      }
      if (docSnap.exists()) {
        const serverSessionId = docSnap.data().activeSessionId;
        const clientSessionId = userStore.sessionId;
        if (serverSessionId && clientSessionId && serverSessionId !== clientSessionId) {
          console.warn('[Session Check] Session ID mismatch! Forcing logout.');
          toast.error("您的帳號已在另一處登入，此處連線已中斷。", {
            timeout: 5000,
          });
          userStore.logoutUser();
        }
      } else {
        console.warn('[Session Check] User document no longer exists. Forcing logout.');
        toast.error("使用者資料異常，請重新登入。", { timeout: 5000 });
        userStore.logoutUser();
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