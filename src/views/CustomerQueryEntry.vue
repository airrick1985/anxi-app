<template>
  <v-container class="fill-height bg-grey-lighten-5">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        
        <v-card v-if="isLoading" class="text-center pa-10" elevation="2">
          <v-progress-circular indeterminate color="primary" size="64" class="mb-4"></v-progress-circular>
          <div class="text-h6 text-grey-darken-1">{{ statusMessage }}</div>
          <div class="text-caption text-grey mt-2">客資查詢系統</div>
        </v-card>

        <v-card v-else-if="errorState" class="pa-6 text-center" elevation="2">
          <v-icon :icon="errorIcon" size="64" color="error" class="mb-4"></v-icon>
          <h3 class="text-h5 font-weight-bold mb-2">{{ errorTitle }}</h3>
          <p class="text-body-1 text-grey-darken-1 mb-6">{{ errorMessage }}</p>
          
          <v-btn 
            v-if="showBindButton"
            color="success" 
            block 
            size="large" 
            @click="goToBinding"
            prepend-icon="mdi-link-variant"
          >
            前往帳號綁定
          </v-btn>
          <v-btn 
            v-else
            color="primary" 
            block 
            variant="outlined"
            @click="initializeLiff"
          >
            重試
          </v-btn>
        </v-card>

        <v-card v-else class="pa-0" elevation="2">
          <v-toolbar color="#1976D2" density="comfortable">
            <v-toolbar-title class="text-white font-weight-bold">
              選擇查詢建案
            </v-toolbar-title>
            <template v-slot:append>
               <span class="text-white text-caption mr-4">Hi, {{ userName }}</span>
            </template>
          </v-toolbar>

          <v-list lines="two" class="pa-2">
            <template v-if="availableProjects.length > 0">
              <v-list-item
                v-for="project in availableProjects"
                :key="project.id"
                @click="selectProject(project.id)"
                rounded="lg"
                class="mb-2 border"
                hover
              >
                <template v-slot:prepend>
                  <v-avatar color="blue-lighten-4" variant="flat" class="text-blue-darken-2">
                    <v-icon>mdi-database-search</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-bold text-h6">
                  {{ project.name }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  點擊進入查詢客戶
                </v-list-item-subtitle>
                <template v-slot:append>
                  <v-icon color="grey">mdi-chevron-right</v-icon>
                </template>
              </v-list-item>
            </template>
            
            <div v-else class="text-center pa-8 text-grey">
              <v-icon size="48" class="mb-2">mdi-folder-remove-outline</v-icon>
              <div>您目前沒有任何建案的查詢權限</div>
            </div>
          </v-list>
        </v-card>

      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user'; // ✅ 引入 userStore
import { useProjectStore } from '@/store/projectStore'; // ✅ 引入 projectStore 用於顯示建案名稱
import liff from '@line/liff';

// LIFF ID
const LIFF_ID = '2008257338-G2EJPAda'; 

const router = useRouter();
const userStore = useUserStore();
const projectStore = useProjectStore();

// State
const isLoading = ref(true);
const statusMessage = ref('系統初始化...');
const userName = ref('');
const availableProjects = ref([]);

// Error State
const errorState = ref(false);
const errorTitle = ref('');
const errorMessage = ref('');
const errorIcon = ref('mdi-alert-circle');
const showBindButton = ref(false);

// Methods
const initializeLiff = async () => {
  isLoading.value = true;
  errorState.value = false;
  statusMessage.value = '正在連接 LINE...';

  try {
    await liff.init({ liffId: LIFF_ID });

    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    const profile = await liff.getProfile();
    const lineId = profile.userId;

    statusMessage.value = '驗證使用者權限...';

    // ✅ 關鍵修正：使用 store 的 fetchUserByLineId
    // 這會呼叫後端 API，並且將使用者資料寫入 Pinia Store (isLoggedIn 變為 true)
    const isBound = await userStore.fetchUserByLineId(lineId);

    if (!isBound) {
      setError('帳號未綁定', '您的 LINE 帳號尚未綁定系統，請先進行綁定。', 'mdi-account-off', true);
    } else {
      // 驗證成功 (Store 已更新)
      userName.value = userStore.user?.name || '使用者';
      
      // 確保建案名稱列表已載入
      if (projectStore.projectsList.length === 0) {
          statusMessage.value = '讀取建案資料...';
          await projectStore.fetchProjects();
      }

      // 從 Store 的權限中篩選
      const perms = userStore.user?.permissions || {};
      const validProjects = [];

      for (const [projectId, pData] of Object.entries(perms)) {
        if (pData.systems && (
            pData.systems.includes('客資系統-櫃台') || 
            pData.systems.includes('客資系統-銷售') ||
            pData.systems.includes('超級管理員')
        )) {
          // 嘗試從 projectStore 獲取正確名稱 (如果權限裡的名稱是舊的)
          const storeProjectName = projectStore.idToNameMap[projectId];
          
          validProjects.push({
            id: projectId,
            name: storeProjectName || pData.projectName || projectId
          });
        }
      }

      availableProjects.value = validProjects;

      // 自動跳轉邏輯
      if (availableProjects.value.length === 1) {
        selectProject(availableProjects.value[0].id);
        return;
      }
      
      isLoading.value = false;
    }

  } catch (error) {
    console.error('LIFF Init Error:', error);
    setError('登入失敗', error.message || '初始化過程發生錯誤，請稍後再試。');
  } finally {
    if (availableProjects.value.length !== 1) {
        isLoading.value = false;
    }
  }
};

const setError = (title, msg, icon = 'mdi-alert-circle', allowBind = false) => {
  errorState.value = true;
  errorTitle.value = title;
  errorMessage.value = msg;
  errorIcon.value = icon;
  showBindButton.value = allowBind;
  isLoading.value = false;
};

const goToBinding = () => {
  window.location.href = 'https://anxismart.com/#/line-binding';
};

const selectProject = (projectId) => {
  // ✅ 此時 userStore.isLoggedIn 為 true，路由守衛會放行
  router.push({
    name: 'CustomerQuery',
    params: { projectId: projectId }
  });
};

onMounted(() => {
  initializeLiff();
});
</script>