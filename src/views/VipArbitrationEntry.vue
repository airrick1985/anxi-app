<template>
  <v-container fluid class="fill-height bg-grey-lighten-4">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" lg="4">

        <div v-if="isLoading" class="text-center">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
          ></v-progress-circular>
          <p class="mt-4 text-grey-darken-1 font-weight-medium">{{ statusMessage }}</p>
        </div>

        <v-card v-else-if="errorMessage" color="error" variant="tonal" class="mx-auto">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-alert-circle" start></v-icon>
            無法進入裁決頁
          </v-card-title>
          <v-card-text>
            {{ errorMessage }}
          </v-card-text>
          <v-card-actions class="flex-column align-stretch pa-4">
            <v-btn
              v-if="showBindingButton"
              color="primary"
              variant="elevated"
              block
              class="mb-2"
              href="/?liff_path=line-binding"
            >
              前往 LINE 綁定
            </v-btn>
            <v-btn variant="outlined" block class="mb-2" @click="goManualLogin">
              改用帳號密碼登入
            </v-btn>
            <v-btn variant="text" block @click="retry">重試</v-btn>
          </v-card-actions>
        </v-card>

      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import liff from '@line/liff';

const props = defineProps({
  projectId: { type: String, required: true },
  docId: { type: String, required: true }
});

const router = useRouter();
const userStore = useUserStore();

const isLoading = ref(true);
const statusMessage = ref('系統啟動中...');
const errorMessage = ref('');
const showBindingButton = ref(false);

const arbitrationRoute = () => ({
  name: 'VipGuestArbitration',
  params: { projectId: props.projectId, docId: props.docId }
});

onMounted(async () => {
  await initializeAuth();
});

const initializeAuth = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  showBindingButton.value = false;

  // 已登入（如電腦瀏覽器既有 session）直接進裁決頁
  if (userStore.isLoggedIn) {
    router.replace(arbitrationRoute());
    return;
  }

  try {
    statusMessage.value = '連接 LINE 服務中...';
    // 共用客資系統入口的 LIFF ID
    await liff.init({ liffId: '2008257338-n5Gp6pT3' });

    // ✅ LIFF 自動登入僅限 LINE 內建瀏覽器（isInClient）：
    //    外部瀏覽器（電腦/一般手機瀏覽器）的 liff.login 跳轉回跳會遺失 hash 路徑，
    //    導致落在首頁，因此改走一般登入（帶 redirect，登入後自動回裁決頁）。
    if (!liff.isInClient()) {
      statusMessage.value = '正在導向登入頁...';
      goManualLogin();
      return;
    }

    if (!liff.isLoggedIn()) {
      statusMessage.value = '正在導向 LINE 登入...';
      liff.login({ redirectUri: window.location.href });
      return;
    }

    const profile = await liff.getProfile();
    const lineId = profile.userId;
    if (!lineId) throw new Error('無法取得 LINE User ID');

    statusMessage.value = '同步使用者權限...';
    const loginSuccess = await userStore.fetchUserByLineId(lineId);

    if (!loginSuccess) {
      showBindingButton.value = true;
      throw new Error('您的 LINE 帳號尚未綁定系統帳號，請先完成綁定，或改用帳號密碼登入。');
    }

    // 權限檢查：系統/超級管理員，或該建案「客資系統-櫃台」
    statusMessage.value = '檢查裁決權限...';
    const roles = userStore.user?.roles || [];
    const isAdmin = roles.includes('系統管理員') || roles.includes('超級管理員');
    const systems = userStore.user?.permissions?.[props.projectId]?.systems || [];
    if (!isAdmin && !systems.includes('客資系統-櫃台')) {
      throw new Error('權限不足：客資歸屬裁決僅限該建案「客資系統-櫃台」人員使用。');
    }

    statusMessage.value = '正在進入裁決頁...';
    router.replace(arbitrationRoute());

  } catch (err) {
    console.error('Vip Arbitration Entry Error:', err);
    errorMessage.value = err.message || '發生未知錯誤';
    isLoading.value = false;
  }
};

// 外部瀏覽器 / LIFF 失敗時的後路：帶 redirect 走一般登入，登入後自動回裁決頁
const goManualLogin = () => {
  const target = router.resolve(arbitrationRoute());
  router.replace({ name: 'Login', query: { redirect: target.fullPath } });
};

const retry = () => {
  window.location.reload();
};
</script>
