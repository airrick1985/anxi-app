<template>
  <v-layout>
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      permanent
      @click="rail = false"
    >
      <v-list-item
        prepend-icon="mdi-folder-wrench-outline"
        :title="projectName || '預約管理系統'"
        class="pt-2 pb-1"
        nav
      >
        <template v-slot:append>
          <v-btn
            icon="mdi-chevron-left"
            variant="text"
            @click.stop="rail = !rail"
          ></v-btn>
        </template>
      </v-list-item>

      <v-divider></v-divider>

      <v-list density="compact" nav>
       <v-tooltip
  location="end"
  text="預約時間表"
>
  <template v-slot:activator="{ props }">
    <v-list-item
      v-bind="props"
      prepend-icon="mdi-calendar-month"
      title="預約時間表"
      :to="{ name: 'InternalInspectionCalendar', params: { projectId: projectId } }"
      exact-path
    ></v-list-item>
  </template>
</v-tooltip>

<v-tooltip
  location="end"
  text="戶別資料管理"
>
  <template v-slot:activator="{ props }">
    <v-list-item
      v-bind="props"
      prepend-icon="mdi-table-large"
      title="戶別資料管理"
      :to="{ name: 'HouseholdGrid', params: { projectId: projectId } }"
      exact-path
    ></v-list-item>
  </template>
</v-tooltip>

<v-tooltip
  location="end"
  text="驗屋報告管理"
>
  <template v-slot:activator="{ props }">
    <v-list-item
      v-bind="props"
      prepend-icon="mdi-folder-google-drive"
      title="驗屋報告管理"
      :to="{ name: 'InternalReportFolderManager', params: { projectId: projectId } }"
      exact-path
    ></v-list-item>
  </template>
</v-tooltip>

<v-tooltip
  location="end"
  text="批次及系統管理"
>
  <template v-slot:activator="{ props }">
    <v-list-item
      v-bind="props"
      v-if="canEdit"
      prepend-icon="mdi-cogs"
      title="批次及系統管理"
      :to="{ name: 'BookingRuleManager', params: { projectId: projectId } }"
      exact-path
    ></v-list-item>
  </template>
</v-tooltip>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <router-view v-slot="{ Component }">
        <v-fade-transition leave-absolute>
          <component :is="Component" />
        </v-fade-transition>
      </router-view>
    </v-main>
  </v-layout>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';

const route = useRoute();
const userStore = useUserStore();
const projectStore = useProjectStore();

const drawer = ref(true);
const rail = ref(true);

const projectId = computed(() => route.params.projectId);
const projectName = computed(() => projectStore.idToNameMap[projectId.value] || '');

// 根據權限決定是否顯示「批次及系統管理」
const canEdit = computed(() => userStore.hasProjectPermission('驗屋預約管理-修改', projectName.value));
</script>

<style scoped>
/* 讓 v-main 內容不會被 footer 遮擋 */
.v-main {
  padding-bottom: 60px; /* 根據您的 footer 高度調整 */
}
</style>