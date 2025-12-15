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
              prepend-icon="mdi-building"
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
    // 1. 檢查是否已經在 Store 中登入
    if (userStore.isLoggedIn) {
      statusMessage.value = '已登入，正在載入建案...';
      await processPermissions();
      return;
    }

    // 2. 初始化 LIFF
    statusMessage.value = '連接 LINE 服務中...';
    
    // ✅ [修改] 填入您剛取得的 LIFF ID (2008257338-FCbKJ8bB)
    await liff.init({ liffId: '2008257338-FCbKJ8bB' }); //賞屋預約系統 LIFF ID=2008257338-FCbKJ8bB

    // 檢查是否已登入 LINE
    if (!liff.isLoggedIn()) {
      statusMessage.value = '正在導向 LINE 登入...';
      // ✅ [說明] redirectUri 設為當前頁面，這樣登入後會帶回原本的 liff_path 參數
      liff.login({ redirectUri: window.location.href });
      return; // 中斷執行，等待重導向
    }

    // 3. 取得 LINE Profile 並進行後端登入
    statusMessage.value = '驗證使用者身分...';
    const profile = await liff.getProfile();
    const lineId = profile.userId;

    if (!lineId) throw new Error('無法取得 LINE User ID');

    // 使用 userStore 的 action 進行登入 (此函數需存在於 userStore)
    const loginSuccess = await userStore.fetchUserByLineId(lineId);

    if (!loginSuccess) {
      throw new Error('您的 LINE 帳號尚未綁定或無權限存取此系統。');
    }

    // 4. 登入成功，處理權限
    await processPermissions();

  } catch (err) {
    console.error('Entry Error:', err);
    errorMessage.value = err.message || '發生未知錯誤';
    isLoading.value = false;
  }
};

const processPermissions = async () => {
  statusMessage.value = '檢查系統權限...';
  
  // 確保建案列表已載入
  if (projectStore.projectsList.length === 0) {
    await projectStore.fetchProjects();
  }

  const allowedProjects = [];
  const targetSystems = ['報價系統', '銷控系統']; // 允許的權限系統

  // 遍歷所有建案，檢查是否有任一目標權限
  projectStore.projectsList.forEach(project => {
    // 檢查使用者在該建案是否擁有 targetSystems 中的任一權限
    const hasAccess = targetSystems.some(sys => 
      userStore.hasProjectPermission(sys, project.name)
    );

    if (hasAccess) {
      allowedProjects.push({
        id: project.id,
        name: project.name
      });
    }
  });

  if (allowedProjects.length === 0) {
    errorMessage.value = '您目前沒有任何建案的「報價系統」或「銷控系統」權限。';
    isLoading.value = false;
    return;
  }

  // 分流邏輯
  if (allowedProjects.length === 1) {
    statusMessage.value = `正在進入 ${allowedProjects[0].name}...`;
    selectProject(allowedProjects[0].id);
  } else {
    // 多個建案，顯示選單
    availableProjects.value = allowedProjects;
    isLoading.value = false;
  }
};

const selectProject = (projectId) => {
  router.replace({
    name: 'ViewingReservationCalendar',
    params: { projectId }
  });
};

const retryLogin = () => {
  window.location.reload();
};
</script>