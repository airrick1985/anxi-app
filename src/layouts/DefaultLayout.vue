<template>
  <v-app>
    <!-- ✅ 浮動頂部工具：不再使用固定 v-app-bar 佔用版面空間。
         僅「登入頁」與「登入後的內部頁面」顯示；對外公開頁（未登入）完全隱藏。 -->
    <template v-if="showToolbar">
      <v-btn
        icon
        size="small"
        class="floating-menu-btn"
        :title="drawerOpen ? '關閉選單' : '開啟選單'"
        @click="drawerOpen = !drawerOpen"
      >
        <v-icon>{{ drawerOpen ? 'mdi-close' : 'mdi-menu' }}</v-icon>
      </v-btn>
    </template>

    <v-navigation-drawer
      v-model="drawerOpen"
      temporary
      width="272"
      class="app-drawer"
    >
      <!-- 上方留空給浮動關閉鈕（固定於視窗左上角） -->
      <div class="drawer-top-spacer"></div>
      <v-divider />
      <v-list density="compact" nav>
        <v-list-item v-if="user" prepend-icon="mdi-home" title="首頁" @click="onMenuClick(goHome)" />

        <v-list-subheader>工具</v-list-subheader>
        <v-list-item prepend-icon="mdi-account-group" title="BY序" @click="onMenuClick(openStandbyDialog)" />
        <v-list-item prepend-icon="mdi-clipboard-text-outline" title="貴賓資料表" @click="onMenuClick(() => router.push('/vip-login'))" />
        <v-list-item prepend-icon="mdi-account-details-outline" title="客戶資料表" @click="onMenuClick(() => router.push('/customer-data-sheet'))" />

        <template v-if="user">
          <v-divider class="my-1" />
          <v-list-subheader>功能</v-list-subheader>
          <v-list-item prepend-icon="mdi-calculator-variant-outline" title="房貸試算" @click="onMenuClick(() => mortgageDialog = true)" />
          <v-list-item prepend-icon="mdi-message-question" title="聯絡客服" @click="onMenuClick(() => contactDialog = true)" />
          <v-list-item
            :prepend-icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
            :title="isFullscreen ? '離開全螢幕' : '全螢幕模式'"
            @click="onMenuClick(toggleFullscreen)"
          />
          <v-list-item title="訊息中心" @click="onMenuClick(goToMessageCenter)">
            <template v-slot:prepend>
              <v-badge :content="unreadCount" :model-value="unreadCount > 0" color="red" overlap>
                <v-icon>mdi-email-outline</v-icon>
              </v-badge>
            </template>
          </v-list-item>
          <v-list-item prepend-icon="mdi-account-circle-outline" :title="`個人資料 (${user.name})`" @click="onMenuClick(() => dialog = true)" />

          <!-- ✅ 試用帳號：Home 頁重新開始導覽（docs/SPEC_LandingTrialLeadsOnboarding.md §7.2） -->
          <v-list-item
            v-if="isTrialUser && route.name === 'Home'"
            prepend-icon="mdi-help-circle-outline"
            title="功能導覽"
            @click="onMenuClick(restartTour)"
          />

          <v-divider class="my-1" />
          <v-list-item prepend-icon="mdi-logout" title="登出" base-color="error" @click="onMenuClick(() => logoutDialog = true)" />
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <!-- ✅ 試用帳號提示條 -->
      <v-banner
        v-if="isTrialUser && showTrialBanner"
        density="compact"
        lines="one"
        class="trial-banner"
        icon="mdi-flask-outline"
      >
        <span class="trial-banner__text">測試環境：您正在使用共用測試帳號，系統不會發送真實 LINE／Email／簡訊通知，資料會定期重置。</span>
        <template #actions>
          <v-btn size="small" variant="text" icon="mdi-close" @click="dismissTrialBanner" />
        </template>
      </v-banner>
      <router-view
        @start-loading="loading = true"
        @stop-loading="loading = false"
        @notify="showSnackbar"
      />
    </v-main>

    <v-footer v-if="showFooter" color="white" class="footer-text" padless>
      <v-container class="text-center py-2">
          <div><strong>ANXI建案管理系統</strong> ｜ 版本 v{{ appVersion }}</div>
          <div>&copy; {{ currentYear }} ANXISMART. All rights reserved.</div>
      </v-container>
    </v-footer>
    
    <EditProfileDialog v-model:dialog="dialog" @start-loading="loading = true" @stop-loading="loading = false" @notify="showSnackbar" />

        <v-dialog v-model="logoutDialog" persistent max-width="300">
        <v-card>
            <v-card-title>確定要登出？</v-card-title>
            <v-card-actions>
                <v-spacer />
                <v-btn text @click="logoutDialog = false">取消</v-btn>
                <v-btn color="error" text @click="confirmLogout" :loading="isLoggingOut">登出</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
    <v-snackbar v-model="snackbar" :timeout="3000">{{ snackbarMessage }}</v-snackbar>
    
 <v-dialog v-model="contactDialog" max-width="500px">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon left class="mr-2">mdi-face-agent</v-icon>
          <span class="headline">聯絡客服</span>
          <v-spacer></v-spacer>
          <v-btn icon @click="contactDialog = false" variant="text">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="text-center py-8">
          <p class="mb-4 text-h6">安熙智慧系統 官方LINE</p>
          <a href="https://lin.ee/zC5ANvL" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 24px; background-color: #00B900; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 1rem;">
            加入 LINE 官方好友
          </a>
          <p style="margin-top: 24px;"></p>
          <img src="https://qr-official.line.me/gs/M_749vjisf_GW.png?oat_content=qr" width="150" alt="LINE QR Code" style="margin-top: 8px; border: 1px solid #eee;">
        </v-card-text>
        <v-divider></v-divider>
       </v-card>
    </v-dialog>

    <v-dialog v-model="mortgageDialog" max-width="800px" scrollable>
      <MortgageCalculator @close="mortgageDialog = false" />
    </v-dialog>

   
   <AiAssistant v-if="showAiAssistant" />

    <v-dialog v-model="standbyDialogVisible" max-width="400px" persistent>
      <v-card>
        <v-card-title>輸入建案ID (BY序)</v-card-title>
        <v-card-text class="pt-4">
          <v-text-field
            v-model="standbyProjectId"
            label="建案ID"
            placeholder="請輸入建案ID"
            autofocus
            variant="outlined"
            
            @keyup.enter="navigateToStandby"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="standbyDialogVisible = false">取消</v-btn>
          <v-btn color="primary" variant="flat" @click="navigateToStandby" :disabled="!standbyProjectId">確認</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showIdleWarning" persistent max-width="400">
      <v-card class="text-center pa-4">
        <v-icon size="64" color="warning" class="mb-4">mdi-clock-alert-outline</v-icon>
        <v-card-title class="text-h5 font-weight-bold">
          您已經閒置一段時間
        </v-card-title>
        <v-card-text class="text-body-1 my-2">
          為了您的帳戶安全，系統將在 
          <span class="text-red font-weight-bold text-h5 mx-1">{{ remainingSeconds }}</span> 
          秒後自動登出。
        </v-card-text>
        <v-card-actions class="justify-center mt-2">
          <v-btn 
            color="grey-darken-1" 
            variant="text" 
            @click="performLogout"
          >
            直接登出
          </v-btn>
          <v-btn 
            color="primary" 
            variant="elevated" 
            size="large"
            @click="keepAlive"
            prepend-icon="mdi-account-check"
          >
            保持登入
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>



  </v-app>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useFullscreen } from '../composables/useFullscreen';
import { storeToRefs } from 'pinia';
import { useUserStore } from '../store/user';
import { useUiStore } from '../store/uiStore';
import { useRouter, useRoute } from 'vue-router';
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { getLatestRelease, fetchUnreadMessageCount } from '@/api';
import EditProfileDialog from '../components/EditProfileDialog.vue';
import MortgageCalculator from '../components/MortgageCalculator.vue';
import { appVersion as versionString } from '@/version';
import { useAutoLogout } from '../composables/useAutoLogout';

// 引入我們的新元件
import AiAssistant from '../components/AiAssistant.vue';

// 只要這行程式碼執行，就會開始監聽並計時
const { showIdleWarning, remainingSeconds, keepAlive, performLogout } = useAutoLogout();

const userStore = useUserStore();
const uiStore = useUiStore();
const { user, unreadCount } = storeToRefs(userStore);
const isTrialUser = computed(() => userStore.isTrialUser);

// 試用提示條（sessionStorage 記住已關閉）
const TRIAL_BANNER_KEY = 'anxi-trial-banner-dismissed';
const showTrialBanner = ref(sessionStorage.getItem(TRIAL_BANNER_KEY) !== '1');
const dismissTrialBanner = () => {
  showTrialBanner.value = false;
  try { sessionStorage.setItem(TRIAL_BANNER_KEY, '1'); } catch (e) { /* ignore */ }
};
// 重新開始導覽：以全域事件通知 Home.vue
const restartTour = () => window.dispatchEvent(new CustomEvent('anxi:restart-tour'));
const { showAppToolbar } = storeToRefs(uiStore);

// ✅ 漢堡選單抽屜開關
const drawerOpen = ref(false);

const dialog = ref(false);
const logoutDialog = ref(false);
const loading = ref(false);
const snackbar = ref(false);
const snackbarMessage = ref('');
const router = useRouter();
const route = useRoute();
const { isFullscreen, toggleFullscreen } = useFullscreen();
const contactDialog = ref(false);
const mortgageDialog = ref(false);
const showAiAssistant = ref(false); // AI助理false=隱藏
const isLoggingOut = ref(false); // ✅ 新增此行

// ✅ [新增] BY序 Dialog 相關狀態
const standbyDialogVisible = ref(false);
const standbyProjectId = ref('');


const showSnackbar = (message) => {
  snackbarMessage.value = message;
  snackbar.value = true;
};

// ✅ 頂部工具顯示條件：登入頁 或 已登入的內部頁面才顯示；
//    對外公開頁（未登入的一般客戶）完全不顯示。
//    showAppToolbar 沿用車位編輯模式的隱藏機制（進入編輯時整組隱藏）。
const showToolbar = computed(() => showAppToolbar.value && (!!user.value || route.name === 'Login'));

// 點選抽屜項目：先關閉抽屜再執行動作
const onMenuClick = (action) => {
  drawerOpen.value = false;
  action();
};

const appVersion = ref(versionString);

const currentYear = ref(new Date().getFullYear());
const showFooter = computed(() => {
  const targetRoutes = ['Login', 'Home'];
  return targetRoutes.includes(route.name);
});

const { needRefresh, updateServiceWorker } = useRegisterSW({ immediate: true });
// Update logic removed as requested

async function confirmLogout() {
  logoutDialog.value = false;
  isLoggingOut.value = true;
  console.log('嘗試登出...');
  try {
    await userStore.logoutUser();
    console.log('登出成功 (UI)'); // 可選 Log
    showSnackbar('已成功登出');
  } catch (error) {
    console.error("登出時發生錯誤 (UI):", error);
    showSnackbar('登出失敗，請稍後再試');
  } finally {
    // **** 👇👇👇 在這裡加入 Log 👇👇👇 ****
    console.log('>>> confirmLogout: Entering finally block <<<');
    // **** 👆👆👆 加入 Log 結束 👆👆👆 ****
    isLoggingOut.value = false;
  }
}

const goHome = () => {
  if (route.path !== '/home') {
    router.push('/home');
  }
};
const goToMessageCenter = () => {
  router.push('/messages');
};

// ✅ [新增] 開啟 BY序 Dialog
function openStandbyDialog() {
  standbyProjectId.value = '';
  standbyDialogVisible.value = true;
}

// ✅ [新增] 導航至 BY序 頁面
function navigateToStandby() {
  if (standbyProjectId.value.trim()) {
    // 根據 router index.js，使用 'Standby' 路由名稱和 'projectId' 參數
    router.push({ 
      name: 'Standby', 
      params: { projectId: standbyProjectId.value.trim() } 
    });
    standbyDialogVisible.value = false;
  }
}

const initializeUnreadCount = async () => {
  if (user.value && user.value.key) {
    try {
      const count = await fetchUnreadMessageCount(user.value.key);
      userStore.setUnreadCount(count);
    } catch (error) {
      console.error('初始化未讀訊息數量失敗:', error);
      userStore.setUnreadCount(0);
    }
  }
};

onMounted(() => {
  if (user.value) {
    initializeUnreadCount();
  }
});

watch(user, (newUser, oldUser) => {
  if (newUser && !oldUser) {
    initializeUnreadCount();
  }
});
</script>

<style scoped>
.trial-banner {
  background: #2F6BFF !important;
  color: #fff !important;
}
.trial-banner :deep(.v-banner__prepend .v-icon),
.trial-banner :deep(.v-btn) { color: #fff !important; }
.trial-banner :deep(.v-avatar) { background: transparent !important; }
.trial-banner__text { font-size: .85rem; }

/* ✅ 浮動漢堡按鈕：毛玻璃底，任何背景上都清楚可見；
   z-index 高於 temporary drawer（~1008），開啟時變成關閉鈕 */
.floating-menu-btn {
  position: fixed !important;
  top: 10px;
  left: 10px;
  z-index: 1500;
  background: rgba(255, 255, 255, 0.6) !important;
  color: #000 !important;
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.2);
}

/* 抽屜上緣留空，避免被浮動關閉鈕（fixed 於視窗左上）壓到第一個項目 */
.drawer-top-spacer {
  height: 52px;
}

.clickable {
  cursor: pointer;
}

.footer-text {
  font-size: 0.6rem;
  color: #555;
  padding-bottom: 0px;
  flex: 0 0 auto;
  max-height: 40px;
}
</style>