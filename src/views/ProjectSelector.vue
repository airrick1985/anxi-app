<template>
  <v-container fluid class="fill-height" style="background-color: #f5f5f5;">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="10" md="10" lg="8" xl="7">
        <v-card class="elevation-12 rounded-lg">
          <v-toolbar :color="pageColor" dark flat>
            <v-toolbar-title class="font-weight-medium">
              <v-icon start large>{{ pageIcon }}</v-icon>
              {{ pageTitle }}
            </v-toolbar-title>
          </v-toolbar>

          <v-card-text class="pa-5">
            <div v-if="!userStore.user" class="text-center my-5">
              <p class="text-subtitle-1">請先登入以使用{{ pageTitle }}。</p>
              <v-btn :color="pageColor" @click="goToLogin">
                前往登入
              </v-btn>
            </div>

            <div v-else>
              <p class="text-subtitle-1 mb-4">
                歡迎，{{ userStore.user.name || userStore.user.key }}！請選擇您要進入的建案：
              </p>

              <div v-if="loadingProjects" class="text-center pa-5">
                <v-progress-circular indeterminate :color="pageColor" size="64"></v-progress-circular>
                <p class="mt-4 text-grey-darken-1">正在載入建案權限...</p>
              </div>

              <v-alert v-if="error" type="error" density="compact" class="mt-4">{{ error }}</v-alert>

              <v-alert v-if="!loadingProjects && visibleProjects.length === 0 && !error" type="warning" variant="tonal">
                您在「{{ pageTitle }}」中沒有可操作的建案。
              </v-alert>

              <draggable
                v-if="visibleProjects.length > 0"
                v-model="visibleProjects"
                item-key="id"
                class="draggable-container"
                animation="300"
                :delay="200"
                :delay-on-touch-only="true"
                :touch-start-threshold="5"
                :fallback-tolerance="12"
              >
                <template #item="{ element: project }">
                  <IconButton 
                    :icon="project.iconUrl || defaultProjectIcon"
                    :text="project.name"
                    :scale="0.8"
                    @click="enterProject(project)"
                    class="project-button"
                  />
                </template>
              </draggable>

              <v-overlay
                :model-value="isValidating"
                class="align-center justify-center project-entry-overlay"
                persistent
                :opacity="1"
                :no-click-animation="true"
              >
                <section class="project-entry-card" role="status" aria-live="polite" aria-atomic="true">
                  <div class="project-entry-card__project">
                    <span>建案</span><strong>{{ projectToEnterName }}</strong>
                  </div>
                  <div class="project-entry-card__icon" aria-hidden="true">
                    <span class="project-entry-card__orbit"></span>
                    <v-icon size="30">mdi-domain</v-icon>
                  </div>
                  <h2 class="project-entry-card__title">正在進入建案</h2>
                  <p class="project-entry-card__description">正在開啟{{ pageTitle }}，請稍候。</p>
                  <div class="project-entry-card__activity" aria-hidden="true"><i></i><i></i><i></i></div>
                  <p class="project-entry-card__hint">
                    <v-icon size="14" aria-hidden="true">mdi-lock-outline</v-icon>
                    <span>進入期間，請保持此視窗開啟</span>
                  </p>
                </section>
              </v-overlay>

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
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
import { checkInToSystem } from '@/api'; // 引入驗證 API
import { trackTrialEvent } from '@/utils/trialTracking'; // 試用留資事件追蹤
import { prefetchSalesChunks, prefetchSalesData } from '@/utils/salesPrefetch'; // ✅ [效能] 銷控/報價預載
import draggable from 'vuedraggable'; // 引入 draggable
import IconButton from '@/components/IconButton.vue'; // 引入 IconButton
import defaultProjectIcon from '@/assets/icons/property.png'; // 引入一個預設圖示

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const projectStore = useProjectStore();

const visibleProjects = ref([]);
const loadingProjects = ref(true);
const error = ref(null);
const isValidating = ref(false);
const projectToEnterName = ref('');

// --- 動態 UI 邏輯 ---
// 從路由 meta 讀取資訊
const currentViewMode = computed(() => route.query.viewMode);
const requiredSystem = computed(() => route.meta.requiredSystem);
const requiredAnySystem = computed(() => route.meta.requiredAnySystem);
const targetRouteName = computed(() => route.meta.targetRouteName);
const targetRouteParamKey = computed(() => route.meta.paramKey || 'projectId');

// 動態決定標題、圖示和顏色
const pageTitle = computed(() => {
  if (currentViewMode.value === 'quote') return '報價系統';
  if (requiredSystem.value === '銷控系統') return '銷控系統';
  if (requiredAnySystem.value?.includes('驗屋預約管理-修改')) return '驗屋預約管理';
  return '選擇建案';
});

const pageIcon = computed(() => {
  if (currentViewMode.value === 'quote') return 'mdi-currency-usd';
  if (requiredSystem.value === '銷控系統') return 'mdi-table-edit';
  if (requiredAnySystem.value?.includes('驗屋預約管理-修改')) return 'mdi-calendar-check';
  return 'mdi-domain';
});

const pageColor = computed(() => {
  if (currentViewMode.value === 'quote' || requiredSystem.value === '銷控系統') return '#f5f5f7';
  if (requiredAnySystem.value?.includes('驗屋預約管理-修改')) return '#f5f5f7';
  return '#f5f5f7';
});

// --- 核心邏輯 ---

onMounted(async () => {
  if (!userStore.user) {
    loadingProjects.value = false;
    return;
  }
  
  try {
    // 1. 確保 Pinia 中有所有建案的列表 (ID, Name, iconUrl)
    await projectStore.fetchProjects(); //
    const allProjects = projectStore.projectsList;

    let authorizedProjects = [];

    // 2. 根據 meta 資訊決定如何篩選權限
    if (requiredAnySystem.value) {
      // 適用於「驗屋預約」 (檢查多個權限)
      authorizedProjects = allProjects.filter(project =>
        requiredAnySystem.value.some(sysName => 
          userStore.hasProjectPermission(sysName, project.name) //
        )
      );
    } else if (requiredSystem.value) {
      // 適用於「銷控系統」、「報價系統」
      const systemName = currentViewMode.value === 'quote' ? '報價系統' : '銷控系統';
      authorizedProjects = allProjects.filter(project =>
        userStore.hasProjectPermission(systemName, project.name) //
      );
    } else {
      throw new Error('路由 meta 未設定權限 (requiredSystem 或 requiredAnySystem)');
    }

    visibleProjects.value = authorizedProjects;

    // ✅ [效能] 使用者還在挑建案時，先把銷控 / 報價頁的 JS chunk 下載好
    if (requiredSystem.value === '銷控系統' || requiredSystem.value === '報價系統') {
      prefetchSalesChunks(currentViewMode.value === 'quote' || requiredSystem.value === '報價系統' ? 'quote' : 'sales');
    }

  } catch (e) {
    error.value = '讀取建案權限時發生錯誤。';
    console.error('[ProjectSelector] Error:', e);
  } finally {
    loadingProjects.value = false;
  }
});

const enterProject = async (project) => {
  if (isValidating.value) return;
  if (!project || !project.id) {
    error.value = '無效的建案。';
    return;
  }
  
  isValidating.value = true;
  projectToEnterName.value = project.name;
  error.value = null;

  try {
    // ✓ START: 修正點
    // 不再使用 pageTitle.value
    // 而是從 meta 獲取正確的系統名稱
    let systemName = requiredSystem.value; 
    if (!systemName && requiredAnySystem.value && requiredAnySystem.value.length > 0) {
      // (例如 "客資系統-櫃台" 或 "驗屋預約管理-修改")
      systemName = requiredAnySystem.value[0]; 
    }
    if (!systemName) {
        throw new Error('路由 meta 未設定 requiredSystem 或 requiredAnySystem');
    }
    // ✓ END: 修正點

    const userKey = userStore.user?.key;
    const userName = userStore.user?.name;

    if (!userKey || !userName) {
      throw new Error('無法獲取使用者資訊，請重新登入。');
    }

    // ✅ [效能] 簽到（Cloud Function，可能冷啟動）期間同步預載建案資料：
    // Firestore 監聽先建立、戶別/車位/樣式/顏色先灌進 store 快取，進頁時直接命中，
    // 總等待從「簽到 + 載資料」變成兩者取大。簽到失敗只是多讀了一次資料，不影響流程。
    if (systemName === '銷控系統' || systemName === '報價系統') {
      prefetchSalesData(project.id);
    }

    // 3. 執行後端驗證 (現在 systemName 會是 "客資系統-櫃台" 或 "驗屋預約管理-修改" 等)
    const result = await checkInToSystem(project.id, systemName, userKey, userName);

    if (result.status === 'success') {
      // 試用帳號：記錄進入系統事件（非試用為 no-op）
      if (userStore.isTrialUser) trackTrialEvent('enter_system', { system: systemName, projectId: project.id });

      // 4. 動態跳轉
      const routeName = targetRouteName.value;
      const paramKey = targetRouteParamKey.value;
      
      if (!routeName) {
        throw new Error('路由 meta 未設定 targetRouteName');
      }

      await router.push({
        name: routeName, 
        params: { [paramKey]: project.id } // 動態使用 paramKey
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
.project-entry-overlay :deep(.v-overlay__scrim) {
  background: rgba(63, 76, 100, 0.24);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.project-entry-overlay :deep(.v-overlay__content) {
  max-width: calc(100vw - 32px);
}

.project-entry-card {
  box-sizing: border-box;
  width: 345px;
  max-width: 100%;
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  padding: 29px 24px 22px;
  border: 1px solid rgba(255, 255, 255, 0.88);
  border-radius: 24px;
  background: linear-gradient(140deg, rgba(255, 255, 255, 0.92), rgba(245, 246, 251, 0.84));
  backdrop-filter: blur(26px) saturate(140%);
  -webkit-backdrop-filter: blur(26px) saturate(140%);
  box-shadow: 0 24px 48px rgba(44, 57, 83, 0.18), inset 0 1px 0 #fff;
  color: #243249;
  text-align: center;
}

.project-entry-card__project {
  display: inline-flex;
  align-items: baseline;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px 8px;
  max-width: 100%;
  padding: 5px 12px;
  border: 1px solid rgba(255, 255, 255, 0.65);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.4);
  color: #68768b;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.project-entry-card__project strong {
  color: #4b5a6f;
  font-weight: 600;
}

.project-entry-card__icon {
  position: relative;
  display: grid;
  place-items: center;
  width: 62px;
  height: 62px;
  margin: 27px auto;
  border-radius: 20px;
  background: linear-gradient(155deg, #68b2ff, #0877f3);
  box-shadow: 0 9px 19px rgba(22, 130, 251, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.65);
  color: #fff;
}

.project-entry-card__orbit {
  position: absolute;
  inset: -7px;
  border: 1.5px solid rgba(59, 131, 204, 0.1);
  border-top-color: #5396e5;
  border-radius: 25px;
  animation: project-entry-orbit 2.4s linear infinite;
}

.project-entry-card__title {
  margin: 0 0 10px;
  font-size: 21px;
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: 0.3px;
}

.project-entry-card__description {
  margin: 0;
  color: #66758a;
  font-size: 13px;
  line-height: 1.8;
}

.project-entry-card__activity {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  height: 8px;
  margin-top: 23px;
}

.project-entry-card__activity i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #4589e3;
  animation: project-entry-pulse 1.4s ease-in-out infinite;
}

.project-entry-card__activity i:nth-child(2) { animation-delay: 0.2s; }
.project-entry-card__activity i:nth-child(3) { animation-delay: 0.4s; }

.project-entry-card__hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 22px 0 0;
  padding-top: 16px;
  border-top: 1px solid rgba(174, 188, 210, 0.25);
  color: #68768b;
  font-size: 11px;
  line-height: 1.6;
}

@keyframes project-entry-orbit {
  to { transform: rotate(360deg); }
}

@keyframes project-entry-pulse {
  0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-3px); }
}

@media (prefers-reduced-motion: reduce) {
  .project-entry-card__orbit,
  .project-entry-card__activity i {
    animation: none;
  }
}

.fill-height {
  min-height: calc(100vh - 64px); 
}
.v-card {
  transition: box-shadow .3s ease-in-out;
}
.v-toolbar-title {
  font-size: 1.3rem;
}

/* 沿用 Home.vue 的 draggable 容器樣式 */
.draggable-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 20px; /* 縮小間距 */
  padding: 20px 0;
}

/* 專門用於此頁面的按鈕微調 */
.project-button {
  /* 確保按鈕不會被外層的 flex 容器壓縮 */
  flex-shrink: 0;
}
</style>
