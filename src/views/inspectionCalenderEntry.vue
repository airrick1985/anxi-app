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
                class="font-weight-bold"
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

const router = useRouter();
const userStore = useUserStore();

// --- 頁面基本資訊 ---
const pageTitle = ref('驗屋時間表');
const pageIcon = ref('mdi-calendar-check');

// --- 響應式狀態 ---
const selectedProject = ref(null);
const projectOptions = ref([]);
const loadingProjects = ref(true);
const error = ref(null);

// --- 靜態資料 ---
const PROJECT_ID_MAP = {
  '富宇上城': 'fuyu56',
  '富宇富御': 'fuyu61',
    // 如果有其他建案，請在此處添加
};

// --- 計算屬性 ---
const selectedProjectDisplayName = computed(() => {
  if (!selectedProject.value) return '...';
  const found = projectOptions.value.find(p => p.value === selectedProject.value);
  return found ? found.text : '...';
});

// --- 生命週期鉤子 ---
onMounted(() => {
  if (!userStore.user) {
    loadingProjects.value = false;
    return;
  }
  
  try {
 
    const accessibleProjects = userStore.detailedPermissions
      // 篩選出系統為「修改」或「檢視」，且權限為 'Y' 的項目
      .filter(perm => 
        ['驗屋時間表-修改', '驗屋時間表-檢視'].includes(perm.system) && perm.access === 'Y'
      )
      // 接下來的 .map() 和 .filter(Boolean) 邏輯不變
      .map(perm => {
        const projectName = perm.projectName;
        const projectId = PROJECT_ID_MAP[projectName];
        if (projectId) {
          return { text: projectName, value: projectId };
        }
        return null;
      })
      .filter(Boolean);


    // 使用 Set 來確保建案列表不重複 (以防同一個建案同時有修改和檢視權限)
    const uniqueProjects = [...new Map(accessibleProjects.map(item => [item.value, item])).values()];

    projectOptions.value = uniqueProjects;

    if (uniqueProjects.length === 1) {
      selectedProject.value = uniqueProjects[0].value;
    }

  } catch (e) {
    error.value = '讀取建案權限時發生錯誤。';
    console.error(e);
  } finally {
    loadingProjects.value = false;
  }
});

// --- 方法 ---
const enterProject = () => {
  if (selectedProject.value) {
    router.push({ 
      name: 'InternalInspectionCalendar', 
      params: { projectId: selectedProject.value } 
    });
  }
};

const goHome = () => {
  router.push({ name: 'Home' });
};

const goToLogin = () => {
  router.push({ name: 'Login' });
};
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