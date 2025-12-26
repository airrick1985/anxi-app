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
              請選擇進入的建案 (客資管理)
            </v-toolbar-title>
          </v-toolbar>
          
          <v-list lines="two">
            <v-list-item
              v-for="project in availableProjects"
              :key="project.id"
              @click="selectProject(project.id)"
              prepend-icon="mdi-account-multiple-check"
              :title="project.name"
              subtitle="點擊進入客資管理系統"
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

// UI 狀態監控
const isLoading = ref(true);
const statusMessage = ref('系統啟動中...');
const errorMessage = ref('');
const availableProjects = ref([]);

onMounted(async () => {
  await initializeAuth();
});

/**
 * 核心邏輯 1：LIFF 初始化與身分同步
 */
const initializeAuth = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    statusMessage.value = '連接 LINE 服務中...';
    // 注意：請確保此 LIFF ID 已在 LINE Developers 後台正確設定 Endpoint URL
    await liff.init({ liffId: '2008257338-n5Gp6pT3' }); //2008257338-n5Gp6pT3 正式 2008257338-6N3jwqxA 

    if (!liff.isLoggedIn()) {
      statusMessage.value = '正在導向 LINE 登入...';
      liff.login({ redirectUri: window.location.href });
      return; 
    }

    const profile = await liff.getProfile();
    const lineId = profile.userId;

    if (!lineId) throw new Error('無法取得 LINE User ID');

    statusMessage.value = '同步使用者權限...';
    // 強制從 Firestore 讀取最新的權限物件
    const loginSuccess = await userStore.fetchUserByLineId(lineId); 

    if (!loginSuccess) {
      throw new Error('您的 LINE 帳號尚未綁定或無權限存取此系統。');
    }

    // 進入權限與建案過濾流程
    await processPermissions();

  } catch (err) {
    console.error('Customer Management Entry Error:', err);
    errorMessage.value = err.message || '發生未知錯誤';
    isLoading.value = false;
  }
};

/**
 * 核心邏輯 2：權限分流處理 (參考 ViewingReservationEntry 實作)
 */
const processPermissions = async () => {
  statusMessage.value = '檢查系統權限...';
  
  // 1. 確保基礎建案資料已載入
  if (projectStore.projectsList.length === 0) {
    await projectStore.fetchProjects();
  }

  const allowedProjects = [];
  // ✅ 針對客資管理系統的目標權限
  const targetSystems = ['客資系統-櫃台', '客資系統-銷售']; 
  const userPermissions = userStore.user?.permissions || {}; 

  // 2. 遍歷權限表進行比對
  Object.keys(userPermissions).forEach(projectId => {
      const projectPerm = userPermissions[projectId];
      const systems = projectPerm.systems || [];
      
      // 檢查此建案下是否擁有客資相關權限
      const hasAccess = targetSystems.some(sys => systems.includes(sys));

      if (hasAccess) {
          // 取得完整建案名稱
          const fullProjectData = projectStore.projectsList.find(p => p.id === projectId);
          const name = fullProjectData ? fullProjectData.name : (projectPerm.projectName || projectId);

          allowedProjects.push({
              id: projectId,
              name: name
          });
      }
  });

  // 3. 根據結果進行跳轉或顯示選單
  if (allowedProjects.length === 0) {
    errorMessage.value = '您目前沒有任何建案的「客資系統」存取權限。';
    isLoading.value = false;
    return;
  }

  if (allowedProjects.length === 1) {
    // 只有一個建案 -> 自動跳轉至主系統
    statusMessage.value = `正在進入 ${allowedProjects[0].name}...`;
    selectProject(allowedProjects[0].id);
  } else {
    // 多個建案 -> 停止 Loading，顯示列表選單
    availableProjects.value = allowedProjects;
    isLoading.value = false;
  }
};

/**
 * 執行頁面跳轉
 */
const selectProject = (projectId) => {
  router.replace({
    name: 'CustomerManagementSystem', // 導向客資管理主頁面
    params: { projectId }
  });
};

const retryLogin = () => {
  window.location.reload();
};
</script>