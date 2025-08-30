<template>
  <v-container fluid class="fill-height primary lighten-4">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="10" md="8" lg="5" xl="4">
        <v-card class="elevation-12 rounded-lg">
          <v-toolbar color="deep-purple" dark flat>
            <v-toolbar-title class="font-weight-medium">
              <v-icon start large>{{ pageIcon }}</v-icon>
              {{ pageTitle }}
            </v-toolbar-title>
          </v-toolbar>

          <v-card-text class="pa-5">
            <div v-if="!userStore.user" class="text-center my-5">
              <p class="text-subtitle-1">請先登入以使用{{ pageTitle }}。</p>
              <v-btn color="deep-purple" @click="goToLogin">
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
                variant="outlined"
                density="compact"
                :loading="loadingProjects"
                :disabled="loadingProjects || projectOptions.length === 0"
                :no-data-text="`您在 ${pageTitle} 無可用建案或載入失敗`"
                class="mb-4"
                hide-details="auto"
                item-title="text"
                item-value="value"
              >
                <template v-slot:prepend-item v-if="loadingProjects">
                  <v-list-item>
                    <v-list-item-title class="text-center">
                      <v-progress-circular indeterminate color="deep-purple" size="24"></v-progress-circular>
                      <span class="ml-2">載入建案中...</span>
                    </v-list-item-title>
                  </v-list-item>
                </template>
              </v-select>

              <v-btn
                color="deep-purple"
                block
                size="large"
                @click="enterProject"
                :disabled="!selectedProject || loadingProjects"
                :loading="isValidating"
                class="font-weight-bold"
              >
                <template v-if="!isValidating">
                  <v-icon start>mdi-arrow-right-bold-circle-outline</v-icon>
                  進入 {{ selectedProjectDisplayName }} 的{{ pageTitle }}
                </template>

                <template v-slot:loader>
                  <v-progress-circular
                    indeterminate
                    size="24"
                    width="2"
                    class="me-2"
                  ></v-progress-circular>
                  <span>載入中...</span>
                </template>
              </v-btn>

              <v-alert v-if="error" type="error" density="compact" class="mt-4">{{ error }}</v-alert>
            </div>
          </v-card-text>

          <v-divider v-if="userStore.user"></v-divider>
          <v-card-actions v-if="userStore.user" class="pa-3" style="background-color: #f5f5f5;">
            <v-spacer></v-spacer>
            <v-btn variant="text" color="secondary" @click="goHome">
              <v-icon start>mdi-home</v-icon>
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
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
// ✓ 【修改】引入 projectStore，我們需要用它來獲取所有建案的列表
import { useProjectStore } from '@/store/projectStore';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const projectStore = useProjectStore(); // ✓ 建立 projectStore 實例

const selectedProject = ref(null);
const projectOptions = ref([]);
const loadingProjects = ref(false);
const error = ref('');
const isValidating = ref(false);

const currentViewMode = computed(() => route.query.viewMode || 'sales');
const pageTitle = computed(() => currentViewMode.value === 'quote' ? '報價系統' : '銷控系統');
const pageIcon = computed(() => currentViewMode.value === 'quote' ? 'mdi-currency-usd' : 'mdi-table-edit');

const selectedProjectDisplayName = computed(() => {
  const project = projectOptions.value.find(p => p.value === selectedProject.value);
  return project ? project.text : '建案';
});

// ✓ 【核心修改】直接從 Store 過濾權限，不再呼叫 API
async function loadProjectsForSystem() {
  if (!userStore.user || !userStore.user.key) {
    error.value = '無法獲取用戶資訊，請重新登入。';
    return;
  }
  loadingProjects.value = true;
  error.value = '';
  projectOptions.value = [];
  selectedProject.value = null;

  try {
    // 1. 確保 Pinia 中有所有建案的列表 (ID 對照名稱)
    await projectStore.fetchProjects();

    const systemNameForPermission = pageTitle.value;
    const allProjects = projectStore.projectsList; // 獲取所有建案

    // 2. 過濾出用戶有權限的建案
    const authorizedProjects = allProjects.filter(project =>
      userStore.hasProjectPermission(systemNameForPermission, project.name)
    );

    // 3. 將有權限的建案轉換為下拉選單格式
    projectOptions.value = authorizedProjects.map(p => ({
      text: p.name,   // 建案名稱，例如 "富宇富御"
      value: p.id,    // 建案 ID，例如 "fuyu61"
    }));

    if (projectOptions.value.length > 0) {
      const lastSelectedProjectName = userStore.user.projectName;
      if (lastSelectedProjectName && projectOptions.value.some(p => p.value === lastSelectedProjectName)) {
        selectedProject.value = lastSelectedProjectName;
      } else {
        selectedProject.value = projectOptions.value[0].value;
      }
    } else {
      error.value = `您在 "${systemNameForPermission}" 中沒有可操作的建案。`;
    }
  } catch (err) {
    error.value = `載入建案列表時發生錯誤。`;
    console.error(`[SalesControlSystemEntry] Error loading projects for ${pageTitle.value}:`, err);
  } finally {
    loadingProjects.value = false;
  }
}

// ✓ 【確認】此函式維持不變，因為二次驗證已被移除
function enterProject() {
  if (!selectedProject.value) {
    error.value = '請先選擇一個建案。';
    return;
  }
  isValidating.value = true;
  
  userStore.setProjectName(selectedProject.value);
  const targetRouteName = currentViewMode.value === 'quote' ? 'QuoteSystem' : 'SalesControlSystem';
  
  router.push({
    name: targetRouteName,
    params: {
      projectName: selectedProject.value
    }
  }).finally(() => {
      isValidating.value = false;
  });
}

function goToLogin() {
  router.push({ name: 'Login' });
}

function goHome() {
  router.push({ name: 'Home' });
}

onMounted(() => {
  if (userStore.user && userStore.user.key) {
    loadProjectsForSystem();
  }
});

watch(() => userStore.user, (newUser, oldUser) => {
  if (newUser && newUser.key) {
    if (!oldUser || newUser.key !== oldUser.key) {
      loadProjectsForSystem();
    }
  } else {
    projectOptions.value = [];
    selectedProject.value = null;
    error.value = '';
  }
}, { deep: true });
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