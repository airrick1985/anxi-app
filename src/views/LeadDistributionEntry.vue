<template>
  <v-container fluid class="fill-height bg-grey-lighten-4">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        
        <div v-if="isLoading" class="text-center">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <p class="mt-4 text-grey-darken-1 font-weight-medium">{{ statusMessage }}</p>
        </div>

        <v-card v-else-if="errorMessage" color="error" variant="tonal" class="mx-auto">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-alert-circle" start></v-icon>
            驗證失敗
          </v-card-title>
          <v-card-text>{{ errorMessage }}</v-card-text>
          <v-card-actions>
            <v-btn block variant="outlined" @click="retryLogin">重試</v-btn>
          </v-card-actions>
        </v-card>

        <v-card v-else class="elevation-2 rounded-lg">
          <v-toolbar color="primary" density="compact">
            <v-toolbar-title class="text-subtitle-1 font-weight-bold">
              聯絡名單分配 - 請選擇建案
            </v-toolbar-title>
          </v-toolbar>
          <v-list lines="two">
            <v-list-item
              v-for="project in availableProjects"
              :key="project.id"
              @click="selectProject(project.id)"
              prepend-icon="mdi-list-box"
              :title="project.name"
              subtitle="點擊進入名單管理系統"
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
const statusMessage = ref('客資系統啟動中...');
const errorMessage = ref('');
const availableProjects = ref([]);

onMounted(async () => {
  await initializeAuth();
});

const initializeAuth = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    // 1. 初始化 LIFF
    statusMessage.value = '連接 LINE 服務中...';
    // 請將此處 ID 替換為您的 LIFF ID
    await liff.init({ liffId: '2008257338-FSWtfaEM' }); //2008257338-FSWtfaEM 正式 2008257338-6N3jwqxA 測試

    if (!liff.isLoggedIn()) {
      statusMessage.value = '正在導向 LINE 登入...';
      liff.login({ redirectUri: window.location.href });
      return; 
    }

    // 2. 取得 LINE ID 並同步權限
    const profile = await liff.getProfile();
    const lineId = profile.userId;

    if (!lineId) throw new Error('無法取得 LINE User ID');

    statusMessage.value = '同步使用者權限...';
    // 強制從後端讀取最新權限資料
    const loginSuccess = await userStore.fetchUserByLineId(lineId); 

    if (!loginSuccess) {
      throw new Error('您的 LINE 帳號尚未綁定，或無權限存取此系統。');
    }

    // 3. 處理客資系統專屬權限過濾
    await processLeadPermissions();

  } catch (err) {
    console.error('[LeadEntry] Error:', err);
    errorMessage.value = err.message || '發生未知錯誤';
    isLoading.value = false;
  }
};

const processLeadPermissions = async () => {
  statusMessage.value = '檢查系統權限...';
  
  // 確保專案清單已載入
  if (projectStore.projectsList.length === 0) {
    await projectStore.fetchProjects();
  }

  const allowedProjects = [];
  // 定義客資系統目標權限
  const targetSystems = ['客資系統-櫃台', '客資系統-銷售']; 
  const userPermissions = userStore.user?.permissions || {};

  // 遍歷使用者權限表，篩選符合客資系統權限的建案
  Object.keys(userPermissions).forEach(projectId => {
      const projectPerm = userPermissions[projectId];
      const systems = projectPerm.systems || [];
      
      const hasAccess = targetSystems.some(sys => systems.includes(sys));

      if (hasAccess) {
          const fullProjectData = projectStore.projectsList.find(p => p.id === projectId);
          const name = fullProjectData ? fullProjectData.name : (projectPerm.projectName || projectId);

          allowedProjects.push({ id: projectId, name: name });
      }
  });

  if (allowedProjects.length === 0) {
    errorMessage.value = '您目前沒有任何建案的「客資系統」權限。';
    isLoading.value = false;
    return;
  }

  // 自動導向或顯示選單
  if (allowedProjects.length === 1) {
    statusMessage.value = `正在進入 ${allowedProjects[0].name}...`;
    selectProject(allowedProjects[0].id);
  } else {
    availableProjects.value = allowedProjects;
    isLoading.value = false;
  }
};

const selectProject = (projectId) => {
  // 跳轉至統一的名單管理頁面
  router.replace({
    name: 'LeadDistribution',
    params: { projectId }
  });
};

const retryLogin = () => {
  window.location.reload();
};
</script>