// src/composables/useAutoLogout.js
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';

export function useAutoLogout() {
  const router = useRouter();
  const userStore = useUserStore();

  // --- 設定參數 (單位: 毫秒) ---
  // 正式環境：總共 10 分鐘 (9分鐘閒置 + 1分鐘倒數)
  const IDLE_TIME = 14 * 60 * 1000;      // 閒置多久後跳出提醒
  const COUNTDOWN_TIME = 60 * 1000;     // 提醒對話框倒數多久



  // --- 狀態 ---
  const showIdleWarning = ref(false); // 控制對話框顯示
  const remainingSeconds = ref(0);    // 倒數秒數

  let idleTimer = null;      // 閒置計時器
  let countdownInterval = null; // 倒數計時器

  // --- 登出邏輯 ---
  const performLogout = async () => {
    stopMonitoring(); // 停止所有計時與監聽
    showIdleWarning.value = false;
    
    try {
      // 呼叫 Store 的登出清除狀態
      await userStore.logoutUser();
      // 強制導向登入頁
      router.replace('/login');
    } catch (error) {
      console.error('自動登出時發生錯誤:', error);
      // 即使 API 失敗也要強制導向
      router.replace('/login');
    }
  };

  // --- 倒數計時邏輯 ---
  const startCountdown = () => {
    // 移除監聽器 (避免滑鼠晃動就關閉視窗，強制使用者點擊按鈕)
    removeListeners();
    
    showIdleWarning.value = true;
    let timeLeft = COUNTDOWN_TIME;
    remainingSeconds.value = Math.ceil(timeLeft / 1000);

    countdownInterval = setInterval(() => {
      timeLeft -= 1000;
      remainingSeconds.value = Math.ceil(timeLeft / 1000);

      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
        performLogout();
      }
    }, 1000);
  };

  // --- 重置閒置計時器 ---
  const resetIdleTimer = () => {
    // 如果正在倒數中(對話框已開啟)，則不重置 (除非使用者點擊保持登入)
    if (showIdleWarning.value) return;

    // 清除舊的計時器
    if (idleTimer) clearTimeout(idleTimer);
    if (countdownInterval) clearInterval(countdownInterval);

    // 設定新的閒置計時器
    idleTimer = setTimeout(() => {
      startCountdown();
    }, IDLE_TIME);
  };

  // --- 使用者點擊「保持登入」 ---
  const keepAlive = () => {
    showIdleWarning.value = false;
    if (countdownInterval) clearInterval(countdownInterval);
    
    // 重新開始監聽與計時
    startMonitoring();
  };

  // --- 事件監聽 ---
  const events = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];
  
  const addListeners = () => {
    events.forEach(event => {
      window.addEventListener(event, resetIdleTimer);
    });
  };

  const removeListeners = () => {
    events.forEach(event => {
      window.removeEventListener(event, resetIdleTimer);
    });
  };

  // --- 啟動與停止 ---
  const startMonitoring = () => {
    // 只有已登入才啟動
    if (userStore.isLoggedIn) {
      resetIdleTimer();
      addListeners();
    }
  };

  const stopMonitoring = () => {
    if (idleTimer) clearTimeout(idleTimer);
    if (countdownInterval) clearInterval(countdownInterval);
    removeListeners();
  };

  // --- 生命週期 ---
  onMounted(() => {
    startMonitoring();
  });

  onUnmounted(() => {
    stopMonitoring();
  });

  return {
    showIdleWarning,
    remainingSeconds,
    keepAlive,
    performLogout // 雖然主要由內部觸發，但也可暴露出去
  };
}