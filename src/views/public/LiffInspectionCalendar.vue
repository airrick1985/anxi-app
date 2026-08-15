<template>
  <div class="liff-calendar-page">
    <!-- 初始化中 -->
    <div v-if="isLoading" class="text-center pa-10">
      <v-progress-circular indeterminate color="primary" size="50"></v-progress-circular>
      <p class="mt-4 text-grey">{{ loadingText }}</p>
    </div>

    <!-- 尚未綁定 -->
    <v-card v-else-if="!isBound" class="mx-auto my-8 text-center pa-10" max-width="500">
      <v-icon size="60" color="warning" class="mb-4">mdi-account-alert-outline</v-icon>
      <p class="text-h6">無法使用此功能</p>
      <p class="mt-2 text-grey-darken-1">您的 LINE 帳號尚未綁定系統手機，請先完成綁定。</p>
      <v-btn color="primary" class="mt-6" href="/?liff_path=line-binding" variant="elevated">
        前往綁定頁面
      </v-btn>
    </v-card>

    <!-- 已綁定：LIFF 專用工具列（建案切換／驗屋報告入口），時間表本體與主版本共用同一元件 -->
    <template v-else>
      <div class="liff-header d-flex align-center flex-wrap pa-2 ga-2">
        <v-select
          v-model="selectedProject"
          :items="authorizedProjects"
          item-title="projectName"
          item-value="projectId"
          label="選擇建案"
          variant="outlined"
          density="compact"
          hide-details
          class="liff-project-select"
        ></v-select>
        <v-btn
          prepend-icon="mdi-folder-google-drive"
          variant="tonal"
          color="primary"
          :disabled="!selectedProject"
          @click="navigateToReportManager"
        >驗屋報告</v-btn>
        <div class="text-caption text-grey-darken-1 ml-auto d-none d-sm-block">
          {{ userName }}
        </div>
      </div>

      <v-alert
        v-if="authorizedProjects.length === 0"
        type="info"
        variant="tonal"
        class="ma-4"
      >您目前沒有任何建案的查詢權限，請聯絡管理人員。</v-alert>

      <!-- 與主版本「驗屋預約／預約時間表」完全共用的元件：
           樣式、介面、功能一律相同，之後修改主版本即自動同步到 LIFF -->
      <InspectionCalendar
        v-if="selectedProject"
        :key="selectedProject"
        :project-id="selectedProject"
      />

      <div class="text-caption text-grey text-center my-4 d-flex align-center justify-center flex-wrap">
        <span>本服務由</span>
        <v-chip class="mx-2" href="https://anxismart.com/" target="_blank" rel="noopener noreferrer" color="blue-grey" variant="tonal" size="small" label>
          <v-icon start size="x-small">mdi-rocket-launch-outline</v-icon>
          anxismart安熙智慧建案管理系統
        </v-chip>
        <span>提供技術支援</span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStorage } from '@vueuse/core';
import liff from '@line/liff';
import { useUserStore } from '@/store/user';
import InspectionCalendar from '@/views/public/InspectionCalendar.vue';

const router = useRouter();
const userStore = useUserStore();

const isLoading = ref(true);
const loadingText = ref('正在初始化...');
const isBound = ref(false);
const selectedProject = ref(null);

const userName = computed(() => userStore.user?.name || '');

// 可查詢的建案：授權條件與後端 getLiffUserData 一致（驗屋預約管理 或 客資系統 任一權限）
const LIFF_ALLOWED_SYSTEMS = ['驗屋預約管理-檢視', '驗屋預約管理-修改', '客資系統-櫃台', '客資系統-銷售'];
const authorizedProjects = computed(() => {
  const permissions = userStore.user?.permissions || {};
  return Object.entries(permissions)
    .filter(([, perms]) => (perms.systems || []).some(s => LIFF_ALLOWED_SYSTEMS.includes(s)))
    .map(([projectId, perms]) => ({ projectId, projectName: perms.projectName || projectId }))
    .sort((a, b) => a.projectName.localeCompare(b.projectName, 'zh-Hant'));
});

// 記住此裝置上次選擇的建案，下次開啟直接沿用
const lastProjectId = useStorage('liff_inspection_calendar_last_project', '');
watch(selectedProject, (v) => {
  if (v) lastProjectId.value = v;
});

onMounted(async () => {
  try {
    loadingText.value = '正在與 LINE 連接...';
    // 根據環境選擇 LIFF ID
    const isDev = import.meta.env.DEV;
    const liffId = isDev
      ? import.meta.env.VITE_LIFF_ID_DEV    // 測試用: 2008257338-6N3jwqxA
      : import.meta.env.VITE_LIFF_ID_PROD;  // 正式用: 2008257338-o8grV0ZD

    await liff.init({ liffId });

    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    const profile = await liff.getProfile();

    loadingText.value = '正在驗證權限...';
    // 以 LINE ID 載入使用者與完整權限（userStore 會供時間表元件判斷 canEdit）
    const bound = await userStore.fetchUserByLineId(profile.userId);
    isBound.value = !!bound;

    if (isBound.value && authorizedProjects.value.length > 0) {
      const remembered = authorizedProjects.value.find(p => p.projectId === lastProjectId.value);
      selectedProject.value = remembered ? remembered.projectId : authorizedProjects.value[0].projectId;
    }
  } catch (error) {
    console.error('LIFF 頁面初始化失敗:', error);
    loadingText.value = `發生錯誤: ${error.message}`;
  } finally {
    isLoading.value = false;
  }
});

const navigateToReportManager = () => {
  if (userStore.user && userStore.user.key) {
    // 透過 router.push 並帶上 userKey 與 projectId，不經過 LIFF 重新驗證
    router.push({
      name: 'ReportFolderManager',
      params: { projectId: selectedProject.value || '' },
      query: { userKey: userStore.user.key }
    });
  } else {
    // 備用方案：直接導向至驗屋報告管理的 LIFF 頁面
    window.location.href = 'https://liff.line.me/2008257338-gYnbKlpR';
  }
};
</script>

<style scoped>
.liff-calendar-page {
  background-color: #f4f4f7;
  min-height: 100vh;
}
.liff-header {
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
}
.liff-project-select {
  min-width: 180px;
  max-width: 280px;
  flex: 1 1 auto;
}
</style>
