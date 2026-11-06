<template>
  <div class="pde-page">
    <div v-if="isLoading" class="pde-loading">
      <v-progress-circular indeterminate size="28" width="3" color="grey"></v-progress-circular>
      <span>{{ statusMessage }}</span>
    </div>

    <v-card v-else class="mac-sheet pde-card" elevation="2">
      <div class="mac-sheet-head">
        <v-icon size="18">mdi-alert-circle-outline</v-icon>無法開啟繳款到期
      </div>
      <div class="mac-sheet-section pde-message">{{ errorMessage }}</div>
      <div class="mac-sheet-foot pde-actions">
        <a v-if="errorKind === 'binding'" class="mac-btn mac-btn--primary mac-btn--lg mac-btn--block" href="/?liff_path=line-binding">前往 LINE 綁定</a>
        <button v-if="errorKind === 'failed'" type="button" class="mac-btn mac-btn--primary mac-btn--lg mac-btn--block" @click="retry">重試</button>
        <button type="button" class="mac-btn mac-btn--lg mac-btn--block" @click="goManualLogin">改用帳號密碼登入</button>
      </div>
    </v-card>
  </div>
</template>

<script setup>
/**
 * 繳款到期入口頁（LINE／Email 通知連結導向），規格：docs/SPEC_PaymentDueReminder.md §5.5
 * 流程比照 CustomerLogEntry：LINE 內建瀏覽器走 LIFF 自動登入；外部瀏覽器帶 redirect 走一般登入。
 */
import { nextTick, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import liff from '@line/liff';
import { useUserStore } from '@/store/user';
import { initializeLiff } from '@/utils/liffAuth';
import { LIFF_IDS, paymentDueLoginRedirectUri } from '@/utils/liffApps';

const props = defineProps({
  projectId: { type: String, required: true },
});

const router = useRouter();
const userStore = useUserStore();

const isLoading = ref(true);
const statusMessage = ref('系統啟動中...');
const errorMessage = ref('');
const errorKind = ref('failed'); // failed：可重試；binding：未綁定 LINE；denied：權限不足

const targetRoute = () => ({ name: 'PaymentDueList', params: { projectId: props.projectId } });

function fail(kind, message) {
  errorKind.value = kind;
  errorMessage.value = message;
  isLoading.value = false;
}

async function initializeAuth() {
  isLoading.value = true;
  errorMessage.value = '';

  // App.vue 的 onMounted 會依 liff_path 再導到本頁（子元件先掛載），等它跑完，否則下面的導頁會被取消而卡在載入中
  await nextTick();

  // 已登入（如電腦瀏覽器既有 session）直接進入，權限由清單頁與 API 判定
  if (userStore.isLoggedIn) {
    router.replace(targetRoute());
    return;
  }

  try {
    statusMessage.value = '連接 LINE 服務中...';
    await initializeLiff(LIFF_IDS.customerManagement);

    // LIFF 自動登入僅限 LINE 內建瀏覽器；外部瀏覽器的 liff.login 回跳會遺失 hash 路徑
    if (!liff.isInClient()) {
      statusMessage.value = '正在導向登入頁...';
      goManualLogin();
      return;
    }

    if (!liff.isLoggedIn()) {
      statusMessage.value = '正在導向 LINE 登入...';
      // 目前網址的 liff_path 已被改寫，不符合 Endpoint 前綴，不能用 window.location.href
      liff.login({ redirectUri: paymentDueLoginRedirectUri(window.location.origin, props.projectId) });
      return;
    }

    const profile = await liff.getProfile();
    if (!profile.userId) throw new Error('無法取得 LINE User ID');

    statusMessage.value = '同步使用者權限...';
    const loginSuccess = await userStore.fetchUserByLineId(profile.userId);
    if (!loginSuccess) {
      fail('binding', '您的 LINE 帳號尚未綁定系統帳號，請先完成綁定，或改用帳號密碼登入。');
      return;
    }

    const roles = userStore.user?.roles || [];
    const systems = userStore.user?.permissions?.[props.projectId]?.systems || [];
    const hasAccess = roles.includes('系統管理員') || roles.includes('超級管理員')
      || systems.includes('銷控系統') || systems.includes('報價系統');
    if (!hasAccess) {
      fail('denied', '權限不足：您沒有此建案的銷控系統或報價系統權限。');
      return;
    }

    statusMessage.value = '正在開啟繳款到期...';
    router.replace(targetRoute());
  } catch (err) {
    console.error('Payment Due Entry Error:', err);
    fail('failed', err.message || '發生未知錯誤');
  }
}

// 外部瀏覽器／LIFF 失敗時的後路：帶 redirect 走一般登入，登入後回到到期清單
function goManualLogin() {
  const target = router.resolve(targetRoute());
  router.replace({ name: 'Login', query: { redirect: target.fullPath } });
}

function retry() {
  window.location.reload();
}

onMounted(initializeAuth);
</script>

<style scoped>
.pde-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px 16px;
  background: #f5f5f7;
}
.pde-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #6e6e73;
  font-size: 14px;
}
.pde-card { width: 100%; max-width: 420px; }
.pde-message { font-size: 14px; line-height: 1.6; overflow-wrap: anywhere; }
.pde-actions { flex-direction: column; align-items: stretch; }
</style>
