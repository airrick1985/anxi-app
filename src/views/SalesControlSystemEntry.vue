// src/views/SalesControlSystemEntry.vue
<template>
  <v-container fluid class="fill-height primary lighten-4">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="10" md="8" lg="5" xl="4">
        <v-card class="elevation-12 rounded-lg">
          <v-toolbar color="deep-purple" dark flat>
            <v-toolbar-title class="font-weight-medium">
              <v-icon left large>mdi-chart-line</v-icon>
              銷控系統
            </v-toolbar-title>
          </v-toolbar>
         <v-card-text class="pa-5">
            <div v-if="!userStore.user" class="text-center my-5">
              <p class="text-subtitle-1">請先登入以使用銷控系統。</p>
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
                      <v-progress-circular indeterminate color="deep-purple" size="24"></v-progress-circular>
                      <span class="ml-2">載入建案中...</span>
                    </v-list-item-title>
                  </v-list-item>
                </template>
              </v-select>

                   <v-btn
                color="deep-purple" 
                block
                x-large
                @click="enterProject"
                :disabled="!selectedProject || loadingProjects"
                class="font-weight-bold"
              >
                <v-icon left>mdi-arrow-right-bold-circle-outline</v-icon>
                進入 {{ selectedProjectDisplayName }}
              </v-btn>
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
import { useUserStore } from '@/store/user'; // 確保路徑正確
import { getProjectsBySystemPermission } from '@/api'; // 確保路徑正確

const router = useRouter();
const userStore = useUserStore();

const selectedProject = ref(null);
const projectOptions = ref([]);
const loadingProjects = ref(false);
const error = ref('');

// 🔴 關鍵修改：定義當前系統的名稱
const SYSTEM_NAME = '銷控系統'; 

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
  projectOptions.value = [];
  selectedProject.value = null;

  try {
    console.log(`[SalesControlSystemEntry] Loading projects for user: ${userStore.user.key}, system: ${SYSTEM_NAME}`);
    const response = await getProjectsBySystemPermission(userStore.user.key, SYSTEM_NAME);
    console.log('[SalesControlSystemEntry] API response for projects:', response);

    if (response.status === 'success' && Array.isArray(response.projects)) {
      projectOptions.value = response.projects.map(p => ({
        text: p.text || p.value,
        value: p.value
      }));

      if (projectOptions.value.length > 0) {
        const lastSelectedProjectName = userStore.user.projectName;
        if (lastSelectedProjectName && projectOptions.value.some(p => p.value === lastSelectedProjectName)) {
          selectedProject.value = lastSelectedProjectName;
        } else {
          selectedProject.value = projectOptions.value[0].value;
        }
        console.log(`[SalesControlSystemEntry] Selected project: ${selectedProject.value}`);
      } else {
        error.value = `您在 "${SYSTEM_NAME}" 中沒有可操作的建案。`;
      }
    } else {
      error.value = response.message || `載入建案列表失敗 (${SYSTEM_NAME})。`;
    }
  } catch (err) {
    error.value = `載入建案列表時發生網路或系統錯誤 (${SYSTEM_NAME})。`;
    console.error('[SalesControlSystemEntry] Error loading projects:', err);
  } finally {
    loadingProjects.value = false;
  }
}

function enterProject() {
  if (selectedProject.value) {
    // 雖然也更新了 Pinia store，但路由跳轉更依賴直接傳遞的參數
    userStore.setProjectName(selectedProject.value);
    console.log(`[SalesControlSystemEntry] Navigating to SalesControlSystem with projectName: ${selectedProject.value}`);

    // ✅ 關鍵修改：使用 params 將 projectName 傳遞給路由
    router.push({
      name: 'SalesControlSystem',
      params: {
        projectName: selectedProject.value
      }
    });
  }
}

function goToLogin() {
  router.push({ name: 'Login' });
}

function goHome() {
  router.push({ name: 'Home' });
}

onMounted(() => {
  console.log('[SalesControlSystemEntry] Component mounted. User:', JSON.parse(JSON.stringify(userStore.user)));
  if (userStore.user && userStore.user.key) {
    loadProjectsForSystem();
  }
});

watch(() => userStore.user, (newUser, oldUser) => {
  console.log('[SalesControlSystemEntry] User store changed. New User:', JSON.parse(JSON.stringify(newUser)));
  if (newUser && newUser.key) {
    if (!oldUser || newUser.key !== oldUser.key || newUser.projectName !== oldUser?.projectName) { // 也監聽 projectName 變化，雖然此頁面主要由 user key 觸發
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