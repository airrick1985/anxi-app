<template>
  <v-container fluid class="fill-height primary lighten-4">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="10" md="8" lg="5" xl="4">
        <v-card class="elevation-12 rounded-lg">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title class="font-weight-medium">
              <v-icon left large>mdi-home-search</v-icon>
              驗屋系統
            </v-toolbar-title>
          </v-toolbar>

          <v-card-text class="pa-5">
            <div v-if="!userStore.user" class="text-center my-5">
              <p class="text-subtitle-1">請先登入以使用驗屋系統。</p>
              <v-btn color="primary" @click="goToLogin">
                前往登入
              </v-btn>
            </div>

            <div v-else>
              <p class="text-subtitle-1 mb-4">
                歡迎，{{ userStore.user.name || userStore.user.key }}！請選擇您要進入的建案：
              </p>
               <v-select
                  v-model="selectedProject"
                  :items="projectOptions"
                  label="選擇建案"
                  outlined
                  dense
                  :loading="loadingProjects"
                  :disabled="loadingProjects || projectOptions.length === 0"
                  no-data-text="您在此系統無可用建案或載入失敗"
                  class="mb-4"
                  hide-details="auto"
                  item-title="text"  
                  item-value="value" 
                >
                <template v-slot:prepend-item v-if="loadingProjects">
                  <v-list-item>
                    <v-list-item-title class="text-center">
                      <v-progress-circular indeterminate color="primary" size="24"></v-progress-circular>
                      <span class="ml-2">載入建案中...</span>
                    </v-list-item-title>
                  </v-list-item>
                </template>
              </v-select>

              <v-btn
                color="primary"
                block
                x-large
                @click="enterProject"
                :disabled="!selectedProject || loadingProjects"
                :loading="isValidating"
                class="font-weight-bold"
              >
                <v-icon left>mdi-arrow-right-bold-circle-outline</v-icon>
                進入 {{ selectedProjectDisplayName }}
              </v-btn>

              <v-alert v-if="error" type="error" dense class="mt-4" prominent border="left">
                {{ error }}
              </v-alert>
            </div>
          </v-card-text>

          <v-divider v-if="userStore.user"></v-divider>
          <v-card-actions v-if="userStore.user" class="pa-3 grey lighten-4">
            <v-spacer></v-spacer>
            <v-btn text color="secondary" @click="goHome">
              <v-icon left>mdi-home</v-icon>
              返回主選單
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { getProjectsBySystemPermission, fetchAllHouseDetails } from '@/api';


const router = useRouter();
const userStore = useUserStore();

const selectedProject = ref(null); // 存儲選中的建案 value
const projectOptions = ref([]); // 存儲 v-select 的 items [{ text: '建案A', value: '建案A' }, ...]
const loadingProjects = ref(false);
const error = ref('');
const isValidating = ref(false); // ✅ 新增：用於進入按鈕的 loading 狀態


const SYSTEM_NAME = '驗屋系統'; // 定義當前系統的名稱

// 計算屬性，用於按鈕上顯示的建案名稱 (如果 selectedProject 存的是 ID，而顯示需要名稱)
// 在這個例子中，text 和 value 相同，所以可以直接用 selectedProject
const selectedProjectDisplayName = computed(() => {
  const project = projectOptions.value.find(p => p.value === selectedProject.value);
  return project ? project.text : '建案';
});

async function loadProjectsForSystem() {
  if (!userStore.user || !userStore.user.key) {
    error.value = '無法獲取用戶資訊，請重新登入。';
    projectOptions.value = [];
    selectedProject.value = null;
    return;
  }

  loadingProjects.value = true;
  error.value = '';
  projectOptions.value = []; // 清空舊選項
  selectedProject.value = null; // 清空已選項目

  try {
    console.log(`[InspectionSystem] Loading projects for user: ${userStore.user.key}, system: ${SYSTEM_NAME}`);
    const response = await getProjectsBySystemPermission(userStore.user.key, SYSTEM_NAME);
    console.log('[InspectionSystem] API response for projects:', response);

    if (response.status === 'success' && Array.isArray(response.projects)) {
      projectOptions.value = response.projects.map(p => ({
        text: p.text || p.value, // 確保有 text 和 value
        value: p.value
      }));

      if (projectOptions.value.length > 0) {
        // 嘗試恢復上次選擇的建案，或選擇第一個
        const lastSelectedProjectName = userStore.user.projectName; // 從 store 讀取上次選擇的建案
        if (lastSelectedProjectName && projectOptions.value.some(p => p.value === lastSelectedProjectName)) {
          selectedProject.value = lastSelectedProjectName;
          console.log(`[InspectionSystem] Restored last selected project: ${lastSelectedProjectName}`);
        } else {
          selectedProject.value = projectOptions.value[0].value;
          console.log(`[InspectionSystem] Selected first available project: ${selectedProject.value}`);
        }
      } else {
        error.value = `您在 "${SYSTEM_NAME}" 中沒有可操作的建案。`;
        console.log(`[InspectionSystem] No projects available for user ${userStore.user.key} in ${SYSTEM_NAME}.`);
      }
    } else {
      error.value = response.message || `載入建案列表失敗 (${SYSTEM_NAME})。`;
      console.error('[InspectionSystem] Failed to load projects:', response.message);
    }
  } catch (err) {
    error.value = `載入建案列表時發生網路或系統錯誤 (${SYSTEM_NAME})。`;
    console.error('[InspectionSystem] Error loading projects:', err);
  } finally {
    loadingProjects.value = false;
  }
}

// ✅ 核心修改：更新 enterProject 函式
async function enterProject() {
  if (!selectedProject.value) {
    error.value = '請先選擇一個建案。';
    return;
  }
  
  isValidating.value = true;
  error.value = ''; // 清除舊的錯誤訊息

  try {
    // 試探性地呼叫一個需要該建案 SheetID 的 API
    // fetchAllHouseDetails 是一個很好的選擇
    const response = await fetchAllHouseDetails(selectedProject.value);

    // 檢查 API 回傳的結果，如果 status 不是 success，代表有問題
    // (api.js 的 fetchPost 已經處理了網路錯誤，這裡處理的是 GAS 回傳的業務邏輯錯誤)
    if (response.status !== 'success') {
      // 將後端回傳的錯誤訊息顯示出來
      throw new Error(response.message);
    }
    
    // 驗證成功，執行跳轉
    userStore.setProjectName(selectedProject.value);
    router.push({ name: 'InspectionRecord' });

  } catch (err) {
    // 捕捉所有錯誤，包括服務到期的特定錯誤
    error.value = err.message || '無法進入建案，請稍後再試。';
    console.error(`[InspectionSystem] Error entering project:`, err);
  } finally {
    isValidating.value = false;
  }
}

function goToLogin() {
  router.push({ name: 'Login' });
}

function goHome() {
  router.push({ name: 'Home' });
}

onMounted(() => {
  console.log('[InspectionSystem] Component mounted.');
  if (userStore.user && userStore.user.key) {
    loadProjectsForSystem();
  } else {
    console.log('[InspectionSystem] User not logged in on mount, redirecting to Login may be needed or handled by router guard.');
    // 可以選擇在這裡強制跳轉，或者依賴路由守衛
    // goToLogin();
  }
});

// 監聽 userStore.user 的變化 (例如，用戶登入/登出後)
watch(() => userStore.user, (newUser, oldUser) => {
  console.log('[InspectionSystem] User store changed:', newUser);
  if (newUser && newUser.key) {
    // 如果是新用戶登入，或者用戶信息發生了有意義的變化
    if (!oldUser || newUser.key !== oldUser.key) {
      loadProjectsForSystem();
    }
  } else {
    // 用戶已登出
    projectOptions.value = [];
    selectedProject.value = null;
    error.value = ''; // 清除可能存在的錯誤信息
    console.log('[InspectionSystem] User logged out, cleared project options.');
  }
}, { deep: true }); // deep watch 可能不是必須的，如果只關心 user 對象本身是否改變

</script>

<style scoped>
.fill-height {
  min-height: 100%;
}
.v-card {
  transition: box-shadow .3s ease-in-out;
}
.v-card:hover {
  box-shadow: 0px 10px 20px -5px rgba(0,0,0,0.2) !important;
}
.v-toolbar-title {
  font-size: 1.3rem;
}
</style>