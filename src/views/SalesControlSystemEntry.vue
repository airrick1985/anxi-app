<template>
  <v-container fluid class="fill-height primary lighten-4">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="10" md="8" lg="5" xl="4">
        <v-card class="elevation-12 rounded-lg">
          <v-toolbar color="deep-purple" dark flat>
            <v-toolbar-title class="font-weight-medium">
              <v-icon left large>{{ pageIcon }}</v-icon>
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
                outlined
                dense
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
                x-large
                @click="enterProject"
                :disabled="!selectedProject || loadingProjects"
                :loading="isValidating"
                class="font-weight-bold"
              >
                <v-icon left>mdi-arrow-right-bold-circle-outline</v-icon>
                進入 {{ selectedProjectDisplayName }} 的{{ pageTitle }}
              </v-btn>

              <v-alert v-if="error" type="error" dense class="mt-4">{{ error }}</v-alert>
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
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { getProjectsBySystemPermission, fetchSalesControlData } from '@/api';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const selectedProject = ref(null);
const projectOptions = ref([]);
const loadingProjects = ref(false);
const error = ref('');
const isValidating = ref(false); // 這個 ref 已經存在，我們只需要在 template 中使用它

// --- 動態內容的核心邏輯 (維持不變) ---
const currentViewMode = computed(() => route.query.viewMode || 'sales');
const pageTitle = computed(() => currentViewMode.value === 'quote' ? '報價系統' : '銷控系統');
const pageIcon = computed(() => currentViewMode.value === 'quote' ? 'mdi-currency-usd' : 'mdi-table-edit');

const selectedProjectDisplayName = computed(() => {
  const project = projectOptions.value.find(p => p.value === selectedProject.value);
  return project ? project.text : '建案';
});

// --- 函式邏輯維持不變 ---
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
    const systemNameForPermission = pageTitle.value;
    const response = await getProjectsBySystemPermission(userStore.user.key, systemNameForPermission);
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
      } else {
        error.value = `您在 "${systemNameForPermission}" 中沒有可操作的建案。`;
      }
    } else {
      error.value = response.message || `載入建案列表失敗 (${systemNameForPermission})。`;
    }
  } catch (err) {
    error.value = `載入建案列表時發生網路或系統錯誤 (${systemNameForPermission})。`;
  } finally {
    loadingProjects.value = false;
  }
}

async function enterProject() {
  if (!selectedProject.value) {
    error.value = '請先選擇一個建案。';
    return;
  }
  isValidating.value = true;
  error.value = '';
  try {
    const response = await fetchSalesControlData(selectedProject.value);
    if (response.status !== 'success') {
      throw new Error(response.message);
    }
    userStore.setProjectName(selectedProject.value);
    const targetRouteName = currentViewMode.value === 'quote' ? 'QuoteSystem' : 'SalesControlSystem';
    router.push({
      name: targetRouteName,
      params: {
        projectName: selectedProject.value
      }
    });
  } catch (err) {
    error.value = err.message || '無法進入建案，請稍後再試。';
    console.error('[SalesControlSystemEntry] Error entering project:', err);
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