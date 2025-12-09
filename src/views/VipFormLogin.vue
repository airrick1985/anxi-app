<template>
  <v-container class="fill-height bg-grey-lighten-5">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        
        <v-card v-if="isLoading" class="text-center pa-10" elevation="2">
          <v-progress-circular indeterminate color="primary" size="64" class="mb-4"></v-progress-circular>
          <div class="text-h6 text-grey-darken-1">正在驗證身份...</div>
          <div class="text-caption text-grey mt-2">請稍候，正在連接 LINE 帳號</div>
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
          <v-toolbar color="primary" density="comfortable">
            <v-toolbar-title class="text-white font-weight-bold">
              選擇建案
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
                  <v-avatar color="primary" variant="tonal">
                    <v-icon>mdi-domain</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-bold text-h6">
                  {{ project.name }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  點擊進入填寫表單
                </v-list-item-subtitle>
                <template v-slot:append>
                  <v-icon color="grey">mdi-chevron-right</v-icon>
                </template>
              </v-list-item>
            </template>
            
            <div v-else class="text-center pa-8 text-grey">
              <v-icon size="48" class="mb-2">mdi-folder-remove-outline</v-icon>
              <div>您目前沒有任何可填寫表單的建案權限</div>
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
import liff from '@line/liff';
import { getLiffUserData } from '@/api';

// ✅ [打勾] 請在此填入第一步取得的 LIFF ID
const LIFF_ID = '2008257338-REkEX9xD'; 

const router = useRouter();

// State
const isLoading = ref(true);
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

  try {
    await liff.init({ liffId: LIFF_ID });

    // 1. 檢查是否在 LINE 環境或已登入
    if (!liff.isLoggedIn()) {
      liff.login();
      return; // login 會重導向，這裡中止執行
    }

    // 2. 獲取 LINE 使用者資訊
    const profile = await liff.getProfile();
    const lineId = profile.userId;

    // 3. 呼叫後端 API 驗證綁定與權限
    const response = await getLiffUserData({ lineId });

    if (response.status === 'not_bound') {
      setError('帳號未綁定', '您的 LINE 帳號尚未綁定系統，請先進行綁定。', 'mdi-account-off', true);
    } else if (response.status === 'bound') {
      userName.value = response.userName;
      
      // 4. 篩選有「客資系統」相關權限的建案
      // (雖然 API 已經改過會回傳，但前端再濾一次更保險)
      const validProjects = (response.projects || []).filter(p => {
        const systems = p.systems || [];
        return systems.includes('客資系統-銷售') || systems.includes('客資系統-櫃台') || systems.includes('超級管理員');
      });

      availableProjects.value = validProjects.map(p => ({
        id: p.projectId,
        name: p.projectName
      }));

      // 如果只有一個專案，直接跳轉 (優化體驗)
      if (availableProjects.value.length === 1) {
        selectProject(availableProjects.value[0].id);
        return;
      }
      
      isLoading.value = false;
    } else {
      throw new Error('未知的回應狀態');
    }

  } catch (error) {
    console.error('LIFF Init Error:', error);
    setError('登入失敗', error.message || '初始化過程發生錯誤，請稍後再試。');
  } finally {
    if (!availableProjects.value.length === 1) { 
        // 只有在不是自動跳轉的情況下才關閉 Loading，避免畫面閃爍
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
  // 導向綁定頁面 (假設您的綁定頁面路由是 /line-binding)
  window.location.href = 'https://anxismart.com/#/line-binding';
};

const selectProject = (projectId) => {
  router.push({
    name: 'VipForm',
    params: { projectId: projectId }
  });
};

onMounted(() => {
  initializeLiff();
});
</script>