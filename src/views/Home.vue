<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center" class="mb-4">
      <v-col cols="12" sm="8" md="6">
        <v-select
          v-model="selectedProject"
          :items="projectOptions"
          label="請選擇建案"
          item-title="text" 
          item-value="value"
          :loading="loadingProjectList"
          :disabled="loadingProjectList || projectOptions.length === 0"
          placeholder="載入中或無可用建案"
          clearable
          required
          :rules="[v => !!v || '建案為必選欄位']"
        />
        <v-alert v-if="error" type="error" dense class="mt-2">{{ error }}</v-alert>
      </v-col>
    </v-row>
    <v-row align="center" justify="center" class="text-center">
      <v-col cols="12" sm="6" md="4">
        <v-btn
          class="feature-button"
          color="primary"
          block
          large
          @click="goTo('inspection')"
        >
          <v-icon start size="28">mdi-home-search</v-icon>
          查看戶別
        </v-btn>
      </v-col>

      <v-col cols="12" sm="6" md="4">
      
        <!--驗屋紀錄總覽停用  
        <v-btn
          class="feature-button"
          color="success"
          block
          large
          @click="goTo('overview')"
        >
         <v-icon start size="28">mdi-view-list</v-icon>
         驗屋紀錄總覽
        </v-btn>
        !-->

      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'; // 新增 watch
import { useUserStore } from '../store/user';
import { getProjectList } from '../api';
import { useRouter } from 'vue-router';

const userStore = useUserStore();
const router = useRouter();

const projectOptions = ref([]);
const selectedProject = computed({
  get: () => userStore.user?.projectName,
  set: (value) => {
    if (value) {
      userStore.setProjectName(value);
      console.log('Home.vue: 已在 store 中設定選取的建案:', value);
    } else if (userStore.user && userStore.user.projectName) {
      userStore.setProjectName(null);
      console.log('Home.vue: 已在 store 中清除選取的建案');
    }
  }
});
const error = ref('');
const loadingProjectList = ref(false);

const fetchProjects = async () => {
  // 確認 user 和 user.key 存在
  if (!userStore.user || !userStore.user.key) {
    error.value = '使用者未登入或資訊不完整，無法載入建案清單。';
    projectOptions.value = [];
    loadingProjectList.value = false;
    console.warn('Home.vue: User or user key not available for getProjectList');
    return;
  }

  loadingProjectList.value = true;
  error.value = '';
  try {
    // 傳遞 userStore.user.key
    const result = await getProjectList(userStore.user.key);
    console.log('Home.vue: 建案清單 API 結果:', result);
    if (result.status === 'success') {
      projectOptions.value = result.projects || []; // 確保 projects 是陣列
      if (projectOptions.value.length === 0) {
        error.value = '您目前沒有任何建案權限。';
      }

      const currentPersistedProject = userStore.user?.projectName;
      const isValidPersistedProject = projectOptions.value.some(p => p.value === currentPersistedProject);

      if (currentPersistedProject && !isValidPersistedProject) {
        console.log(`Home.vue: 持久化的建案 "${currentPersistedProject}" 不在獲取的選項中。將從 store 清除。`);
        userStore.setProjectName(null);
      } else if (!currentPersistedProject && projectOptions.value.length === 1) {
        console.log('Home.vue: 只有一個建案選項，自動選取:', projectOptions.value[0].value);
        userStore.setProjectName(projectOptions.value[0].value);
      }

    } else {
      error.value = result.message || '無法載入建案清單';
      projectOptions.value = [];
      console.error('Home.vue: 獲取建案清單錯誤:', error.value);
    }
  } catch (err) {
    error.value = err.message || '載入建案清單失敗，請檢查網路或聯繫管理員。';
    projectOptions.value = [];
    console.error('Home.vue: 獲取建案清單時發生例外:', err);
  } finally {
    loadingProjectList.value = false;
  }
};

onMounted(() => {
  fetchProjects();
});

// 監聽使用者變化 (例如登入/登出) 以重新獲取建案
watch(() => userStore.user?.key, (newKey, oldKey) => {
  if (newKey && newKey !== oldKey) {
    console.log('Home.vue: 使用者金鑰變更，重新獲取建案。');
    fetchProjects();
  } else if (!newKey && oldKey) {
    // 使用者登出
    projectOptions.value = [];
    selectedProject.value = null; // 這也會透過 computed setter 從 store 中清除
    error.value = ''; // 清除先前的錯誤
  }
});

const goTo = (page) => {
  if (!selectedProject.value && page === 'inspection') {
    error.value = "請先選擇一個建案才能查看戶別。";
    return;
  }
  if (page === 'inspection') {
    router.push('/inspection-record');
  } else if (page === 'overview') {
    // router.push('/inspection-overview'); // 在你的模板中這部分被註解掉了
  }
};
</script>

<style scoped>
.feature-button {
  transition: transform 0.2s, box-shadow 0.2s;
  font-size: 1.2rem;
  padding: 1.5rem;
}
.feature-button:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
}
</style>
