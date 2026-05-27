<template>
  <v-layout class="inspection-layout">
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      :width="260"
      permanent
      class="inspection-drawer"
    >
      <v-menu
        v-model="projectMenuOpen"
        :close-on-content-click="false"
        location="end"
        offset="8"
      >
        <template v-slot:activator="{ props: menuProps }">
          <div
            v-bind="menuProps"
            class="project-switcher d-flex align-center"
            :class="{ 'is-rail': rail }"
          >
            <v-avatar
              size="36"
              color="primary"
              variant="tonal"
              class="flex-shrink-0"
            >
              <v-icon>mdi-home-city-outline</v-icon>
            </v-avatar>
            <div v-if="!rail" class="ms-3 flex-grow-1 overflow-hidden">
              <div class="text-subtitle-2 font-weight-bold text-truncate">
                {{ projectName || '預約管理系統' }}
              </div>
              <div class="text-caption text-medium-emphasis">驗屋預約管理</div>
            </div>
            <v-icon
              v-if="!rail"
              size="18"
              class="ms-2 flex-shrink-0 text-medium-emphasis"
            >mdi-unfold-more-horizontal</v-icon>
          </div>
        </template>

        <v-card min-width="260" max-width="320" elevation="6" rounded="lg">
          <div v-if="loadingProjectList" class="text-center pa-4">
            <v-progress-circular indeterminate size="28" color="primary"></v-progress-circular>
            <div class="text-caption mt-2 text-grey-darken-1">建案列表載入中...</div>
          </div>

          <v-list
            v-else-if="authorizedProjects.length > 0"
            density="compact"
            max-height="360"
            class="overflow-y-auto py-1"
          >
            <v-list-item
              v-for="p in authorizedProjects"
              :key="p.id"
              :active="p.id === projectId"
              :disabled="isSwitching"
              color="primary"
              rounded="lg"
              class="mx-1"
              @click="switchProject(p)"
            >
              <template v-slot:prepend>
                <v-icon :color="p.id === projectId ? 'primary' : undefined">
                  {{ p.id === projectId ? 'mdi-check-circle' : 'mdi-folder-outline' }}
                </v-icon>
              </template>
              <v-list-item-title>{{ p.name }}</v-list-item-title>
            </v-list-item>
          </v-list>

          <div v-else class="text-center pa-4 text-grey-darken-1 text-caption">
            查無其他可使用的建案
          </div>

          <v-overlay
            v-model="isSwitching"
            contained
            class="align-center justify-center"
            persistent
          >
            <v-progress-circular indeterminate color="primary" size="40" width="3"></v-progress-circular>
            <div class="mt-2 text-white text-caption">正在切換至 {{ switchingTargetName }}...</div>
          </v-overlay>

          <v-alert
            v-if="switchError"
            type="error"
            density="compact"
            class="ma-2"
            closable
            @click:close="switchError = ''"
          >
            {{ switchError }}
          </v-alert>
        </v-card>
      </v-menu>

      <v-divider></v-divider>

      <v-list density="comfortable" nav class="px-2 py-3">
        <v-list-subheader v-if="!rail" class="text-caption font-weight-medium ps-2">
          預約管理
        </v-list-subheader>

        <template v-for="item in primaryNav" :key="item.name">
          <v-tooltip location="end" :text="item.title" :disabled="!rail">
            <template v-slot:activator="{ props }">
              <v-list-item
                v-bind="props"
                :prepend-icon="item.icon"
                :title="item.title"
                :to="{ name: item.name, params: { projectId } }"
                exact-path
                color="primary"
                rounded="lg"
                class="mb-1"
              ></v-list-item>
            </template>
          </v-tooltip>
        </template>

        <template v-if="canEdit">
          <v-list-subheader v-if="!rail" class="text-caption font-weight-medium ps-2 mt-2">
            系統
          </v-list-subheader>

          <v-tooltip location="end" text="批次及系統管理" :disabled="!rail">
            <template v-slot:activator="{ props }">
              <v-list-item
                v-bind="props"
                prepend-icon="mdi-cog-outline"
                title="批次及系統管理"
                :to="{ name: 'BookingRuleManager', params: { projectId } }"
                exact-path
                color="primary"
                rounded="lg"
              ></v-list-item>
            </template>
          </v-tooltip>
        </template>
      </v-list>

    </v-navigation-drawer>

    <v-btn
      class="drawer-edge-toggle"
      :style="{ left: `${rail ? 44 : 248}px` }"
      :icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
      :title="rail ? '展開選單' : '收合選單'"
      color="surface"
      size="x-small"
      elevation="3"
      @click="rail = !rail"
    ></v-btn>

    <v-main>
      <router-view v-slot="{ Component }">
        <v-fade-transition leave-absolute>
          <component :is="Component" :key="projectId" />
        </v-fade-transition>
      </router-view>
    </v-main>
  </v-layout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
import { checkInToSystem } from '@/api';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const projectStore = useProjectStore();

const drawer = ref(true);
const rail = ref(true);

const projectId = computed(() => route.params.projectId);
const projectName = computed(() => projectStore.idToNameMap[projectId.value] || '');

const canEdit = computed(() => userStore.hasProjectPermission('驗屋預約管理-修改', projectName.value));

const primaryNav = [
  { name: 'HouseholdGrid',              title: '戶別資料管理', icon: 'mdi-table-large' },
  { name: 'InternalInspectionCalendar', title: '預約時間表', icon: 'mdi-calendar-month-outline' },
  { name: 'InternalReportFolderManager',title: '驗屋報告管理', icon: 'mdi-folder-outline' },
];

const REQUIRED_SYSTEMS = ['驗屋預約管理-修改', '驗屋預約管理-檢視'];

const projectMenuOpen = ref(false);
const loadingProjectList = ref(false);
const isSwitching = ref(false);
const switchingTargetName = ref('');
const switchError = ref('');

const authorizedProjects = computed(() => {
  const all = projectStore.projectsList || [];
  return all.filter(project =>
    REQUIRED_SYSTEMS.some(sys => userStore.hasProjectPermission(sys, project.name))
  );
});

async function ensureProjectsLoaded() {
  if (projectStore.projectsList.length > 0) return;
  loadingProjectList.value = true;
  try {
    await projectStore.fetchProjects();
  } catch (e) {
    console.error('[InspectionManagement] 載入建案列表失敗', e);
  } finally {
    loadingProjectList.value = false;
  }
}

async function switchProject(target) {
  if (!target || !target.id) return;
  if (target.id === projectId.value) {
    projectMenuOpen.value = false;
    return;
  }

  const userKey = userStore.user?.key;
  const userName = userStore.user?.name;
  if (!userKey || !userName) {
    switchError.value = '無法取得使用者資訊，請重新登入。';
    return;
  }

  const systemName = REQUIRED_SYSTEMS.find(sys =>
    userStore.hasProjectPermission(sys, target.name)
  );
  if (!systemName) {
    switchError.value = '您沒有此建案的驗屋預約管理權限。';
    return;
  }

  isSwitching.value = true;
  switchingTargetName.value = target.name;
  switchError.value = '';

  try {
    const result = await checkInToSystem(target.id, systemName, userKey, userName);
    if (result.status !== 'success') {
      throw new Error(result.message || '進入系統失敗。');
    }

    userStore.setProjectName?.(target.name);
    projectStore.setCurrentProject(target.id);

    const currentRouteName = route.name || 'HouseholdGrid';
    await router.push({
      name: currentRouteName,
      params: { ...route.params, projectId: target.id },
      query: route.query
    });

    projectMenuOpen.value = false;
  } catch (err) {
    console.error('[InspectionManagement] 切換建案失敗:', err);
    switchError.value = err.message || '切換建案時發生錯誤。';
  } finally {
    isSwitching.value = false;
    switchingTargetName.value = '';
  }
}

watch(projectMenuOpen, (open) => {
  if (open) ensureProjectsLoaded();
});

onMounted(() => {
  ensureProjectsLoaded();
});
</script>

<style scoped>
.v-main {
  padding-bottom: 60px;
}

.inspection-layout {
  position: relative;
}

.inspection-drawer :deep(.v-list-item--active) {
  font-weight: 600;
}

.project-switcher {
  cursor: pointer;
  padding: 14px 16px;
  margin: 8px;
  border-radius: 10px;
  transition: background-color .15s ease;
}
.project-switcher:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.06);
}
.project-switcher.is-rail {
  margin: 8px 6px;
  padding: 8px 0;
  justify-content: center;
}

.drawer-edge-toggle {
  position: absolute !important;
  top: 76px;
  z-index: 1010;
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: left .25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow .2s ease, transform .15s ease;
}
.drawer-edge-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}
</style>