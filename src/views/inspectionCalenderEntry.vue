<template>
  <v-container fluid class="fill-height" style="background-color: #f5f5f5;">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="10" md="8" lg="5" xl="4">
        <v-card class="elevation-12 rounded-lg">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title class="font-weight-medium">
              <v-icon start large>{{ pageIcon }}</v-icon>
              {{ pageTitle }}
            </v-toolbar-title>
          </v-toolbar>

         <v-card-text class="pa-5">
            <div v-if="!userStore.user" class="text-center my-5">
              <p class="text-subtitle-1">請先登入以使用{{ pageTitle }}。</p>
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
                variant="outlined"
                density="default"
                :loading="loadingProjects"
                :disabled="loadingProjects || projectOptions.length === 0"
                :no-data-text="`您無權訪問任何建案的${pageTitle}`"
                class="mb-4"
                hide-details="auto"
                item-title="text"
                item-value="value"
              >
              </v-select>

              <v-btn
                color="primary" 
                block
                size="x-large"
                @click="enterProject"
                :disabled="!selectedProject || loadingProjects"
                :loading="isValidating" class="font-weight-bold"
              >
                <v-icon start>mdi-arrow-right-bold-circle-outline</v-icon>
                進入 {{ selectedProjectDisplayName }} 的{{ pageTitle }}
              </v-btn>

              <v-alert v-if="error" type="error" density="compact" class="mt-4">{{ error }}</v-alert>
            </div>
          </v-card-text>

          <v-divider v-if="userStore.user"></v-divider>
          <v-card-actions v-if="userStore.user" class="pa-3" style="background-color: #fafafa;">
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
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { getProjectsForInspectionCalendar, checkInToSystem } from '@/api';

const router = useRouter();
const userStore = useUserStore();

const pageTitle = ref('驗屋時間表');
const pageIcon = ref('mdi-calendar-check');

const selectedProject = ref(null);
const projectOptions = ref([]);
const loadingProjects = ref(true);
const error = ref(null);
const isValidating = ref(false);

const selectedProjectDisplayName = computed(() => {
  if (!selectedProject.value) return '...';
  const found = projectOptions.value.find(p => p.value === selectedProject.value);
  return found ? found.text : '...';
});

onMounted(async () => {
  if (!userStore.user) {
    loadingProjects.value = false;
    return;
  }
  
  try {
    const projects = await getProjectsForInspectionCalendar(userStore.user.key);
    projectOptions.value = projects;

    if (projects.length === 1) {
      selectedProject.value = projects[0].value;
    }
  } catch (e) {
    error.value = '讀取建案權限時發生錯誤。';
    console.error(e);
  } finally {
    loadingProjects.value = false;
  }
});

const enterProject = async () => {
  if (!selectedProject.value) {
    error.value = '請先選擇一個建案。';
    return;
  }
  
  isValidating.value = true;
  error.value = null;

  try {
    const projectId = selectedProject.value;
    const system = pageTitle.value; // "驗屋時間表"
    const userKey = userStore.user?.key;
    const userName = userStore.user?.name;

    if (!userKey || !userName) {
      throw new Error('無法獲取使用者資訊，請重新登入。');
    }

    const result = await checkInToSystem(projectId, system, userKey, userName);

    if (result.status === 'success') {
      router.push({ 
        name: 'InternalInspectionCalendar', 
        params: { projectId: projectId } 
      });
    } else {
      error.value = result.message || '進入系統失敗。';
    }
  } catch (err) {
    console.error('進入專案時發生錯誤:', err);
    error.value = `客戶端錯誤: ${err.message}`;
  } finally {
    isValidating.value = false;
  }
};

const goHome = () => router.push({ name: 'Home' });
const goToLogin = () => router.push({ name: 'Login' });
</script>

<style scoped>
.fill-height {
  min-height: calc(100vh - 64px); 
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