// src/composables/useSystemPresence.js

import { onMounted, onUnmounted, ref } from 'vue';
import { useUserStore } from '@/store/user';
import { setUserOnlineStatus, removeUserOnlineStatus } from '@/api'; // 我們稍後會建立這些 API 函式
import { useRouter } from 'vue-router';

// 設定閒置超時時間 (30分鐘)
const IDLE_TIMEOUT = 30 * 60 * 1000;

export function useSystemPresence(projectId, systemName) {
  const userStore = useUserStore();
  const router = useRouter();
  let idleTimer = null;

  const userKey = userStore.user?.key;
  const userName = userStore.user?.name;

  // 重置閒置計時器的函式
  const resetIdleTimer = () => {
    // console.log('[Presence] User activity detected. Resetting idle timer.');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      console.warn(`[Presence] User has been idle for ${IDLE_TIMEOUT / 60000} minutes. Releasing system spot.`);
      // 閒置時間到了，導航回首頁，這會觸發 onUnmounted 中的清理邏輯
      router.push('/home'); 
    }, IDLE_TIMEOUT);
  };

  // 監聽使用者活動的事件
  const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

  // 元件掛載時 (使用者進入頁面)
  onMounted(() => {
    if (!userKey || !projectId || !systemName) {
      console.error('[Presence] Missing userKey, projectId, or systemName. Cannot set online status.');
      return;
    }

    console.log(`[Presence] User ${userName} entering system ${systemName} for project ${projectId}.`);
    
    // 1. 設定 Firebase Realtime Database 或 Firestore 的 onDisconnect 事件
    //    這是為了處理使用者直接關閉瀏覽器或斷線的情況
    setUserOnlineStatus(userKey, userName, projectId, systemName, true); // true 代表設定 onDisconnect

    // 2. 啟動閒置計時器
    resetIdleTimer();
    activityEvents.forEach(event => window.addEventListener(event, resetIdleTimer));
  });

  // 元件卸載時 (使用者離開頁面)
  onUnmounted(() => {
    if (!userKey) return;

    console.log(`[Presence] User ${userName} leaving system.`);

    // 1. 主動、立即地從 onlineStatus 移除使用者紀錄
    removeUserOnlineStatus(userKey);

    // 2. 清理閒置計時器和事件監聽
    clearTimeout(idleTimer);
    activityEvents.forEach(event => window.removeEventListener(event, resetIdleTimer));
  });
}