<template>
  <div class="selector">
    <!-- 未登入 -->
    <div v-if="!userStore.user" class="selector__wrap selector__wrap--center">
      <div class="selector__sys">{{ pageTitle }}</div>
      <h1 class="selector__title">請先登入</h1>
      <v-btn color="#111827" class="text-white" rounded="lg" @click="goToLogin">前往登入</v-btn>
    </div>

    <div v-else class="selector__wrap">
      <div class="selector__sys">{{ pageTitle }}</div>
      <h1 class="selector__title">要進入哪個建案？</h1>

      <!-- 搜尋框 -->
      <label class="selector__search" :class="{ 'is-focus': searchFocused }">
        <v-icon size="22" color="#111827">mdi-magnify</v-icon>
        <input
          ref="searchInput"
          v-model="query"
          type="search"
          placeholder="搜尋建案"
          autocomplete="off"
          enterkeyhint="go"
          @focus="searchFocused = true"
          @blur="searchFocused = false"
          @keydown="onSearchKeydown"
        >
        <button v-if="query" type="button" class="selector__clear" aria-label="清除" @click="clearQuery">
          <v-icon size="18">mdi-close-circle</v-icon>
        </button>
        <kbd v-else class="selector__kbd">{{ metaKeyLabel }} K</kbd>
      </label>

      <!-- 最近進入 -->
      <div v-if="recentProjects.length && !query" class="selector__chips">
        <small>最近</small>
        <button
          v-for="p in recentProjects"
          :key="p.id"
          type="button"
          class="selector__chip"
          @click="enterProject(p)"
        >
          <img :src="p.iconUrl || defaultProjectIcon" alt="">
          <span>{{ p.name }}</span>
        </button>
      </div>

      <!-- 載入中 -->
      <div v-if="loadingProjects" class="selector__loading">
        <v-progress-circular indeterminate color="#111827" size="28" width="3" />
      </div>

      <v-alert v-if="error" type="error" density="compact" variant="tonal" class="mb-4">{{ error }}</v-alert>

      <v-alert
        v-if="!loadingProjects && orderedProjects.length === 0 && !error"
        type="warning"
        variant="tonal"
        density="compact"
      >
        沒有可進入的建案
      </v-alert>

      <!-- 建案列表 -->
      <draggable
        v-if="orderedProjects.length > 0"
        v-model="orderedProjects"
        item-key="id"
        class="selector__list"
        animation="300"
        :delay="200"
        :delay-on-touch-only="true"
        :touch-start-threshold="5"
        :fallback-tolerance="12"
        :disabled="!!query"
        @end="saveOrder"
      >
        <template #item="{ element: project, index }">
          <button
            v-show="!query || matches(project)"
            type="button"
            class="selector__row"
            :class="{ 'is-active': filteredProjects[activeIndex]?.id === project.id }"
            :data-index="index"
            @mouseenter="setActiveById(project.id)"
            @mouseleave="activeIndex = -1"
            @click="enterProject(project)"
          >
            <img :src="project.iconUrl || defaultProjectIcon" alt="" class="selector__row-icon">
            <b>{{ project.name }}</b>
            <span class="selector__enter">↵ 進入</span>
            <v-icon size="18" class="selector__chev">mdi-chevron-right</v-icon>
          </button>
        </template>
      </draggable>

      <p v-if="query && orderedProjects.length > 0 && filteredProjects.length === 0" class="selector__empty">
        找不到建案
      </p>

      <div class="selector__foot">
        <button type="button" class="selector__home" @click="goHome">返回主選單</button>
      </div>
    </div>

    <!-- 進入中遮罩 -->
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
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
import { checkInToSystem } from '@/api'; // 引入驗證 API
import { trackTrialEvent } from '@/utils/trialTracking'; // 試用留資事件追蹤
import { prefetchSalesChunks, prefetchSalesData } from '@/utils/salesPrefetch'; // ✅ [效能] 銷控/報價預載
import draggable from 'vuedraggable'; // 引入 draggable
import defaultProjectIcon from '@/assets/icons/property.png'; // 引入一個預設圖示

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const projectStore = useProjectStore();
const { mobile } = useDisplay();

const orderedProjects = ref([]);
const loadingProjects = ref(true);
const error = ref(null);
const isValidating = ref(false);
const projectToEnterName = ref('');

// --- 搜尋 / 鍵盤 ---
const searchInput = ref(null);
const searchFocused = ref(false);
const query = ref('');
// -1 = 尚未選取；只有用 ↑↓ 或滑鼠指到列後，Enter 才會進入
const activeIndex = ref(-1);
const metaKeyLabel = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘' : 'Ctrl';

const normalize = (s) => String(s || '').trim().toLowerCase();
const matches = (project) => normalize(project.name).includes(normalize(query.value));
const filteredProjects = computed(() => (
  query.value ? orderedProjects.value.filter(matches) : orderedProjects.value
));
watch(filteredProjects, () => { activeIndex.value = -1; });

const setActiveById = (id) => {
  const idx = filteredProjects.value.findIndex(p => p.id === id);
  if (idx >= 0) activeIndex.value = idx;
};
const clearQuery = () => {
  query.value = '';
  searchInput.value?.focus();
};
const onSearchKeydown = (e) => {
  const list = filteredProjects.value;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (list.length) activeIndex.value = activeIndex.value < 0 ? 0 : (activeIndex.value + 1) % list.length;
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (list.length) activeIndex.value = activeIndex.value < 0 ? list.length - 1 : (activeIndex.value - 1 + list.length) % list.length;
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (activeIndex.value < 0) return; // 尚未選取任何建案，Enter 不動作
    const target = list[activeIndex.value];
    if (target) enterProject(target);
  } else if (e.key === 'Escape' && query.value) {
    query.value = '';
  }
};
const onGlobalKeydown = (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    searchInput.value?.focus();
    searchInput.value?.select();
  }
};

// --- 動態 UI 邏輯 ---
// 從路由 meta 讀取資訊
const currentViewMode = computed(() => route.query.viewMode);
const requiredSystem = computed(() => route.meta.requiredSystem);
const requiredAnySystem = computed(() => route.meta.requiredAnySystem);
const targetRouteName = computed(() => route.meta.targetRouteName);
const targetRouteParamKey = computed(() => route.meta.paramKey || 'projectId');

// 動態決定標題
const pageTitle = computed(() => {
  if (currentViewMode.value === 'quote') return '報價系統';
  if (requiredSystem.value === '銷控系統') return '銷控系統';
  if (requiredAnySystem.value?.includes('驗屋預約管理-修改')) return '驗屋預約管理';
  return '選擇建案';
});

// --- 排序 / 最近進入（localStorage，依使用者 + 系統分開） ---
const RECENT_LIMIT = 3;
const storageKey = computed(() => {
  const sys = currentViewMode.value === 'quote'
    ? '報價系統'
    : (requiredSystem.value || requiredAnySystem.value?.[0] || 'default');
  return `anxi-project-selector:${sys}:${userStore.user?.key || 'anon'}`;
});
const readPrefs = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey.value) || '{}');
    return {
      order: Array.isArray(raw.order) ? raw.order : [],
      recent: Array.isArray(raw.recent) ? raw.recent : [],
    };
  } catch (e) {
    return { order: [], recent: [] };
  }
};
const writePrefs = (prefs) => {
  try { localStorage.setItem(storageKey.value, JSON.stringify(prefs)); } catch (e) { /* ignore */ }
};
const recentIds = ref([]);
const recentProjects = computed(() => (
  recentIds.value
    .map(id => orderedProjects.value.find(p => p.id === id))
    .filter(Boolean)
    .slice(0, RECENT_LIMIT)
));
const applySavedOrder = (projects) => {
  const { order } = readPrefs();
  if (!order.length) return projects;
  const byId = new Map(projects.map(p => [p.id, p]));
  const sorted = order.map(id => byId.get(id)).filter(Boolean);
  const seen = new Set(sorted.map(p => p.id));
  return [...sorted, ...projects.filter(p => !seen.has(p.id))];
};
const saveOrder = () => {
  writePrefs({ ...readPrefs(), order: orderedProjects.value.map(p => p.id) });
};
const pushRecent = (projectId) => {
  const next = [projectId, ...recentIds.value.filter(id => id !== projectId)].slice(0, RECENT_LIMIT);
  recentIds.value = next;
  writePrefs({ ...readPrefs(), recent: next });
};

// --- 核心邏輯 ---

onMounted(async () => {
  window.addEventListener('keydown', onGlobalKeydown);

  if (!userStore.user) {
    loadingProjects.value = false;
    return;
  }

  try {
    // 1. 確保 Pinia 中有所有建案的列表 (ID, Name, iconUrl)
    await projectStore.fetchProjects();
    const allProjects = projectStore.projectsList;

    let authorizedProjects = [];

    // 2. 根據 meta 資訊決定如何篩選權限
    if (requiredAnySystem.value) {
      // 適用於「驗屋預約」 (檢查多個權限)
      authorizedProjects = allProjects.filter(project =>
        requiredAnySystem.value.some(sysName =>
          userStore.hasProjectPermission(sysName, project.name)
        )
      );
    } else if (requiredSystem.value) {
      // 適用於「銷控系統」、「報價系統」
      const systemName = currentViewMode.value === 'quote' ? '報價系統' : '銷控系統';
      authorizedProjects = allProjects.filter(project =>
        userStore.hasProjectPermission(systemName, project.name)
      );
    } else {
      throw new Error('路由 meta 未設定權限 (requiredSystem 或 requiredAnySystem)');
    }

    orderedProjects.value = applySavedOrder(authorizedProjects);
    recentIds.value = readPrefs().recent;

    // ✅ [效能] 使用者還在挑建案時，先把銷控 / 報價頁的 JS chunk 下載好
    if (requiredSystem.value === '銷控系統' || requiredSystem.value === '報價系統') {
      prefetchSalesChunks(currentViewMode.value === 'quote' || requiredSystem.value === '報價系統' ? 'quote' : 'sales');
    }

  } catch (e) {
    error.value = '讀取建案權限時發生錯誤。';
    console.error('[ProjectSelector] Error:', e);
  } finally {
    loadingProjects.value = false;
    // 電腦版進頁即可打字；手機不自動聚焦，避免鍵盤彈出遮住列表
    if (!mobile.value) {
      await nextTick();
      searchInput.value?.focus();
    }
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown);
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
    // 從 meta 獲取正確的系統名稱
    let systemName = requiredSystem.value;
    if (!systemName && requiredAnySystem.value && requiredAnySystem.value.length > 0) {
      // (例如 "客資系統-櫃台" 或 "驗屋預約管理-修改")
      systemName = requiredAnySystem.value[0];
    }
    if (!systemName) {
      throw new Error('路由 meta 未設定 requiredSystem 或 requiredAnySystem');
    }

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

    // 3. 執行後端驗證 (systemName 會是 "客資系統-櫃台" 或 "驗屋預約管理-修改" 等)
    const result = await checkInToSystem(project.id, systemName, userKey, userName);

    if (result.status === 'success') {
      pushRecent(project.id);

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
/* ===== 指令面板版面 ===== */
.selector {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 74px 24px 40px;
  background: #fff;
  color: #111827;
  box-sizing: border-box;
}

.selector__wrap {
  width: 100%;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.selector__wrap--center {
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.selector__sys {
  font-size: 12px;
  letter-spacing: 0.25em;
  color: #9ca3af;
  text-align: center;
}

.selector__title {
  margin: 8px 0 26px;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.01em;
  line-height: 1.3;
  text-align: center;
}

.selector__search {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border: 2px solid #111827;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 12px 30px rgba(17, 24, 39, 0.10);
  transition: box-shadow 0.15s ease;
  cursor: text;
}

.selector__search.is-focus {
  box-shadow: 0 12px 30px rgba(17, 24, 39, 0.16), 0 0 0 4px rgba(17, 24, 39, 0.08);
}

.selector__search input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  font: inherit;
  font-size: 17px;
  color: #111827;
}

.selector__search input::placeholder {
  color: #9ca3af;
}

.selector__search input::-webkit-search-cancel-button {
  display: none;
}

.selector__kbd {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 2px 7px;
  white-space: nowrap;
}

.selector__clear {
  display: grid;
  place-items: center;
  border: 0;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
}

.selector__chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 16px 0 10px;
}

.selector__chips small {
  font-size: 12px;
  color: #9ca3af;
  margin-right: 4px;
}

.selector__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px 5px 6px;
  border: 0;
  border-radius: 999px;
  background: #f3f4f6;
  color: #111827;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.12s ease;
}

.selector__chip:hover {
  background: #e5e7eb;
}

.selector__chip img {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.selector__loading {
  display: flex;
  justify-content: center;
  padding: 32px 0;
}

.selector__list {
  display: flex;
  flex-direction: column;
  margin-top: 8px;
}

.selector__row {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 12px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: #111827;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.12s ease;
  -webkit-tap-highlight-color: transparent;
  touch-action: pan-y;
}

.selector__row.is-active {
  background: #f3f4f6;
}

.selector__row:active {
  background: #e5e7eb;
}

.selector__row-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
  flex: none;
}

.selector__row b {
  font-size: 16px;
  font-weight: 600;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selector__enter {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  color: #9ca3af;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 2px 7px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.12s ease;
}

.selector__row.is-active .selector__enter {
  opacity: 1;
}

.selector__chev {
  color: #9ca3af;
}

.selector__row.is-active .selector__chev {
  display: none;
}

.selector__empty {
  margin: 24px 0;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
}

.selector__foot {
  margin-top: auto;
  padding-top: 24px;
  display: flex;
  justify-content: center;
}

.selector__home {
  border: 0;
  border-bottom: 1px dashed #9ca3af;
  background: transparent;
  color: #6b7280;
  font: inherit;
  font-size: 13px;
  padding: 0 0 1px;
  cursor: pointer;
}

.selector__home:hover {
  color: #111827;
  border-bottom-color: #111827;
}

/* 拖曳中 */
.selector__list :deep(.sortable-ghost) {
  opacity: 0.4;
}

.selector__list :deep(.sortable-chosen) {
  background: #f3f4f6;
  box-shadow: 0 8px 20px rgba(17, 24, 39, 0.12);
}

/* 手機版：頂部避開左上角漢堡鈕，隱藏鍵盤提示 */
@media (max-width: 600px) {
  .selector {
    padding: 88px 16px 32px;
  }

  .selector__title {
    font-size: 26px;
    margin-bottom: 18px;
  }

  .selector__search {
    padding: 10px 14px;
    border-radius: 14px;
  }

  .selector__search input {
    font-size: 16px; /* 避免 iOS 自動縮放 */
  }

  .selector__kbd,
  .selector__enter {
    display: none;
  }

  .selector__row {
    padding: 11px 8px;
  }

  .selector__row.is-active .selector__chev {
    display: inline-flex;
  }
}

/* ===== 進入中遮罩（沿用） ===== */
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
</style>
