<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="8" sm="8" md="8" lg="4" xl="3">

        <!-- 1. 請選擇建案 -->
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
          hide-details="auto"
          dense
          class="mb-6"
        />

        <!-- 2. 查看戶別按鈕 -->
        <v-btn
          class="feature-button"
          color="primary"
          large
          block
          @click="goToInspectionPage"
        >
          <v-icon start size="28">mdi-home-search</v-icon>
          進入驗屋系統
        </v-btn>

        <!-- 3. 錯誤提示訊息 (如果有的話) -->
        <v-alert v-if="error" type="error" dense class="mt-6">
          {{ error }}
        </v-alert>

      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useUserStore } from '../store/user';
import { getProjectList } from '../api';
import { useRouter } from 'vue-router';

const userStore = useUserStore();
const router = useRouter();

const projectOptions = ref([]);
const error = ref('');
const loadingProjectList = ref(false);

const selectedProject = computed({
  get: () => userStore.user?.projectName,
  set: (value) => {
    if (value) {
      userStore.setProjectName(value);
      console.log('Home.vue: 已在 store 中設定選取的建案:', value);
      if (error.value === "請先選擇一個建案才能查看戶別。") {
        error.value = '';
      }
    } else if (userStore.user && userStore.user.projectName) {
      userStore.setProjectName(null);
      console.log('Home.vue: 已在 store 中清除選取的建案');
    }
  }
});

const fetchProjects = async () => {
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
    const result = await getProjectList(userStore.user.key);
    console.log('Home.vue: 建案清單 API 結果:', result);
    if (result.status === 'success') {
      projectOptions.value = result.projects || [];
      if (projectOptions.value.length === 0) {
        error.value = '您目前沒有任何建案權限。';
      } else {
         if (error.value && projectOptions.value.length > 0) error.value = '';
      }

      const currentPersistedProject = userStore.user?.projectName;
      const isValidPersistedProject = projectOptions.value.some(p => p.value === currentPersistedProject);

      if (currentPersistedProject && !isValidPersistedProject) {
        console.log(`Home.vue: 持久化的建案 "${currentPersistedProject}" 不在獲取的選項中。將從 store 清除。`);
        selectedProject.value = null;
      } else if (!currentPersistedProject && projectOptions.value.length === 1) {
        console.log('Home.vue: 只有一個建案選項，自動選取:', projectOptions.value[0].value);
        selectedProject.value = projectOptions.value[0].value;
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

watch(() => userStore.user?.key, (newKey, oldKey) => {
  if (newKey && newKey !== oldKey) {
    console.log('Home.vue: 使用者金鑰變更，重新獲取建案。');
    fetchProjects();
  } else if (!newKey && oldKey) {
    projectOptions.value = [];
    selectedProject.value = null;
    error.value = '';
  }
});

watch(selectedProject, (newValue, oldValue) => {
    if (newValue === null && oldValue !== null && userStore.user?.projectName !== null) {
        console.log('Home.vue: 使用者手動清除建案選擇，從 store 清除。');
        userStore.setProjectName(null);
    }
});

const goToInspectionPage = () => {
  if (!selectedProject.value) {
    error.value = "請先選擇一個建案才能查看戶別。";
    return;
  }
  error.value = '';
  router.push('/inspection-record');
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