<template>
  <div class="vre-page">
    <div class="vre-wrap">
      <div v-if="isLoading" class="vre-loading">
        <v-progress-circular indeterminate color="#0071e3" size="36" width="3"></v-progress-circular>
        <p class="vre-status">{{ statusMessage }}</p>
      </div>

      <div v-else-if="errorMessage" class="mac-sheet vre-card vre-error">
        <v-icon size="40" class="vre-error-icon">mdi-alert-circle</v-icon>
        <div class="vre-error-title">驗證失敗</div>
        <div class="vre-error-msg">{{ errorMessage }}</div>
        <button type="button" class="mac-btn mac-btn--primary mac-btn--lg mac-btn--block" @click="retryLogin">重試</button>
      </div>

      <div v-else class="vre-select">
        <div class="vre-heading">
          <div class="vre-title">賞屋預約</div>
          <div class="vre-sub">請選擇建案</div>
        </div>
        <div class="mac-form-group vre-list">
          <button
            v-for="project in availableProjects"
            :key="project.id"
            type="button"
            class="vre-item"
            @click="selectProject(project.id)"
          >
            <span class="vre-item-icon"><v-icon size="18">mdi-calendar-check</v-icon></span>
            <span class="vre-item-name">{{ project.name }}</span>
            <v-icon size="18" class="vre-item-chevron">mdi-chevron-right</v-icon>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
import { initLiffAndEnsureLogin, getLiffProfileOrRelogin } from '@/utils/liffAuth';
import { LIFF_IDS } from '@/utils/liffApps';

const router = useRouter();
const userStore = useUserStore();
const projectStore = useProjectStore();

// UI 狀態
const isLoading = ref(true);
const statusMessage = ref('系統啟動中...');
const errorMessage = ref('');
const availableProjects = ref([]);

// 核心邏輯
onMounted(async () => {
  await initializeAuth();
});

const initializeAuth = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    // 1. 初始化 LIFF (先做這步，確保能拿到 lineId)
    statusMessage.value = '連接 LINE 服務中...';
    // 與 bootstrap 共用同一次初始化（含逾時）；未登入或 token 失效時轉址登入一次
    const loginOptions = {
      redirectUri: window.location.href,
      onBeforeLogin: () => { statusMessage.value = '正在導向 LINE 登入...'; },
    };
    if (!(await initLiffAndEnsureLogin(LIFF_IDS.viewingReservation, loginOptions))) return;

    // 2. 取得 LINE ID
    const profile = await getLiffProfileOrRelogin(loginOptions);
    if (!profile) return;
    const lineId = profile.userId;
    console.log('[Entry] LIFF Profile fetched. User ID:', lineId);

    if (!lineId) throw new Error('無法取得 LINE User ID');

    // ✅ [修改] 強制重新登入/同步資料
    // 即使 userStore.isLoggedIn 為 true，我們也要強制從後端更新權限
    // 因為使用者可能剛被加權限，但前端 Session 還存著舊資料
    
    statusMessage.value = '同步使用者權限...';
    // fetchUserByLineId 會去 Firestore 讀取最新的 userPermissions
    const loginSuccess = await userStore.fetchUserByLineId(lineId); 
    console.log('[Entry] Force sync user data result:', loginSuccess);

    if (!loginSuccess) {
      throw new Error('您的 LINE 帳號尚未綁定或無權限存取此系統。');
    }

    // 3. 處理權限 (現在 userStore 裡的資料一定是最新的)
    await processPermissions();

  } catch (err) {
    console.error('Entry Error:', err);
    errorMessage.value = err.message || '發生未知錯誤';
    isLoading.value = false;
  }
};

const processPermissions = async () => {
  console.log('>>> [Entry] processPermissions START <<<'); // Log Start
  statusMessage.value = '檢查系統權限...';
  
  // 1. 確保 ProjectStore 已載入
  if (projectStore.projectsList.length === 0) {
    console.log('[Entry] Project list empty, fetching from backend...');
    await projectStore.fetchProjects();
  }
  console.log('[Entry] Project list loaded. Count:', projectStore.projectsList.length);

  const allowedProjects = [];
  const targetSystems = ['客資系統-櫃台', '客資系統-銷售'];  
  const userPermissions = userStore.user?.permissions || {}; // 取得使用者權限物件

  console.log('[Entry] Target Systems:', targetSystems);
  console.log('[Entry] User Permissions Object:', userPermissions); 

  // 2. 直接遍歷使用者的權限表
  Object.keys(userPermissions).forEach(projectId => {
      const projectPerm = userPermissions[projectId];
      const systems = projectPerm.systems || [];
      
      console.log(`--- Checking Project: ${projectId} ---`);
      console.log(`    Systems:`, systems);

      // 檢查此建案下是否有目標權限
      const hasAccess = targetSystems.some(sys => systems.includes(sys));
      console.log(`    Has Access?`, hasAccess);

      if (hasAccess) {
          // 嘗試從 projectStore 取得最新名稱，若無則使用權限檔中的備份名稱
          const fullProjectData = projectStore.projectsList.find(p => p.id === projectId);
          const name = fullProjectData ? fullProjectData.name : (projectPerm.projectName || projectId);

          allowedProjects.push({
              id: projectId,
              name: name
          });
      }
  });

  console.log('[Entry] Final Allowed Projects:', allowedProjects);

  // 3. 判斷結果
  if (allowedProjects.length === 0) {
    console.warn('[Entry] No allowed projects found. Showing error.');
    errorMessage.value = '您目前沒有任何建案的「報價系統」或「銷控系統」權限。';
    isLoading.value = false;
    return;
  }

  // 分流邏輯
  if (allowedProjects.length === 1) {
    console.log('[Entry] Only 1 project found. Auto-redirecting to:', allowedProjects[0].name);
    // 只有一個建案 -> 自動跳轉
    statusMessage.value = `正在進入 ${allowedProjects[0].name}...`;
    selectProject(allowedProjects[0].id);
  } else {
    console.log('[Entry] Multiple projects found. Showing selection menu.');
    // 多個建案 -> 顯示選單
    availableProjects.value = allowedProjects;
    isLoading.value = false; // 停止 Loading，顯示選單 UI
  }
  console.log('>>> [Entry] processPermissions END <<<');
};

const selectProject = (projectId) => {
  console.log('[Entry] Selecting project:', projectId);
  router.replace({
    name: 'ViewingReservationCalendar',
    params: { projectId }
  });
};

const retryLogin = () => {
  window.location.reload();
};



</script>

<style scoped>
.vre-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  min-height: 100dvh;
  padding: 24px 16px;
  background: #f5f5f7;
  color: #1d1d1f;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang TC", "Noto Sans TC", sans-serif;
}
.vre-wrap { width: 100%; max-width: 420px; }

.vre-loading { text-align: center; }
.vre-status { margin-top: 14px; font-size: 14px; color: #6e6e73; }

.vre-card {
  padding: 28px 22px 20px;
  background: #fff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08), 0 0 0 0.5px rgba(0, 0, 0, 0.08);
  text-align: center;
}
.vre-error-icon { color: #ff3b30 !important; }
.vre-error-title { margin-top: 10px; font-size: 17px; font-weight: 700; }
.vre-error-msg { margin: 6px 0 20px; font-size: 14px; line-height: 1.6; color: #3a3a3c; overflow-wrap: anywhere; }

.vre-heading { margin: 0 4px 12px; }
.vre-title { font-size: 22px; font-weight: 700; letter-spacing: -0.01em; }
.vre-sub { margin-top: 2px; font-size: 13px; color: #6e6e73; }

.vre-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 52px;
  padding: 10px 14px;
  border: 0;
  background: #fff;
  color: #1d1d1f;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.12s;
}
.vre-item + .vre-item { border-top: 1px solid #ececf0; }
.vre-item:hover { background: #f7f7f9; }
.vre-item:active { background: #ececf0; }
.vre-item-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 7px;
  background: linear-gradient(180deg, #2b8cf2, #0a6fdc);
  color: #fff;
}
.vre-item-name { flex: 1 1 auto; min-width: 0; font-size: 15px; font-weight: 500; line-height: 1.4; overflow-wrap: anywhere; }
.vre-item-chevron { flex-shrink: 0; color: #c7c7cc; }
</style>
