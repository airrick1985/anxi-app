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
              >
                <template v-slot:prepend-item v-if="loadingProjects">
                  <v-list-item>
                    <v-list-item-content>
                      <v-list-item-title class="text-center">
                        <v-progress-circular indeterminate color="primary" size="24"></v-progress-circular>
                        <span class="ml-2">載入建案中...</span>
                      </v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                </template>
              </v-select>

              <v-btn
                color="primary"
                block
                x-large
                @click="enterProject"
                :disabled="!selectedProject || loadingProjects"
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
import { useUserStore } from '@/stores/user';
import { getProjectsBySystemPermission } from '@/api'; // 確保路徑正確

const router = useRouter();
const userStore = useUserStore();

const selectedProject = ref(null); // 存儲選中的建案 value
const projectOptions = ref([]); // 存儲 v-select 的 items [{ text: '建案A', value: '建案A' }, ...]
const loadingProjects = ref(false);
const error = ref('');

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

function enterProject() {
  if (selectedProject.value) {
    userStore.setProjectName(selectedProject.value); // 更新 Pinia store 中的當前建案名稱
    console.log(`[InspectionSystem] Entering project: ${selectedProject.value} for ${SYSTEM_NAME}. Stored in Pinia.`);
    // 導航到該建案的驗屋主頁面或儀表板
    // 假設 'Dashboard' 路由會根據 userStore.user.projectName 顯示對應建案的內容
    router.push({ name: 'Dashboard' });
  } else {
    error.value = '請先選擇一個建案。';
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
  min-height: 100vh;
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