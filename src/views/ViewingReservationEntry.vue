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
            驗證失敗
          </v-card-title>
          <v-card-text>
            {{ errorMessage }}
          </v-card-text>
          <v-card-actions>
            <v-btn block variant="outlined" @click="retryLogin">重試</v-btn>
          </v-card-actions>
        </v-card>

        <v-card v-else class="elevation-2 rounded-lg">
          <v-toolbar color="primary" density="compact">
            <v-toolbar-title class="text-subtitle-1 font-weight-bold">
              請選擇建案
            </v-toolbar-title>
          </v-toolbar>
          
          <v-list lines="two">
            <v-list-item
              v-for="project in availableProjects"
              :key="project.id"
              @click="selectProject(project.id)"
              prepend-icon="mdi-calendar-check"
              :title="project.name"
              subtitle="點擊進入預約系統"
              append-icon="mdi-chevron-right"
              class="py-3"
            ></v-list-item>
          </v-list>
        </v-card>

      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
import liff from '@line/liff';

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
    await liff.init({ liffId: '2008257338-FCbKJ8bB' }); //2008257338-6N3jwqxA 測試 2008257338-FCbKJ8bB 正式

    if (!liff.isLoggedIn()) {
      console.log('[Entry] LIFF not logged in, redirecting...');
      statusMessage.value = '正在導向 LINE 登入...';
      liff.login({ redirectUri: window.location.href });
      return; 
    }

    // 2. 取得 LINE ID
    const profile = await liff.getProfile();
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