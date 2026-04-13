<template>
  <v-container fluid class="admin-tools-center">
    <!-- 標題 -->
    <v-row class="mb-4">
      <v-col>
        <div class="d-flex align-center gap-2">
          <v-icon size="large" color="error">mdi-toolbox</v-icon>
          <h1>管理員工具中心</h1>
        </div>
        <p class="text-caption text-grey">用於系統資料檢查和維護的工具集</p>
      </v-col>
    </v-row>

    <!-- 權限檢查 -->
    <v-alert
      v-if="!hasAdminAccess"
      type="error"
      class="mb-4"
    >
      ❌ 您沒有權限訪問此頁面。只有系統管理員或超級管理員可以使用此工具。
    </v-alert>

    <!-- 工具卡片網格 -->
    <v-row class="mb-4">
      <!-- 報告上傳檢查工具 -->
      <v-col cols="12" md="6" lg="4">
        <v-card
          class="tool-card"
          @click="selectTool('reportUploadChecker')"
          :class="{ 'selected': selectedTool === 'reportUploadChecker' }"
        >
          <v-card-item>
            <div class="d-flex align-center gap-3">
              <v-icon size="40" color="info">mdi-file-document-check</v-icon>
              <div>
                <v-card-title class="pa-0">報告上傳檢查</v-card-title>
                <p class="text-caption text-grey">檢查報告上傳狀態一致性</p>
              </div>
            </div>
          </v-card-item>
        </v-card>
      </v-col>

      <!-- 預留位置：數據恢復工具 -->
      <v-col cols="12" md="6" lg="4">
        <v-card
          class="tool-card opacity-50"
          disabled
        >
          <v-card-item>
            <div class="d-flex align-center gap-3">
              <v-icon size="40" color="grey">mdi-database-refresh</v-icon>
              <div>
                <v-card-title class="pa-0">數據恢復工具</v-card-title>
                <p class="text-caption text-grey">即將推出</p>
              </div>
            </div>
          </v-card-item>
        </v-card>
      </v-col>

      <!-- 預留位置：批量操作工具 -->
      <v-col cols="12" md="6" lg="4">
        <v-card
          class="tool-card opacity-50"
          disabled
        >
          <v-card-item>
            <div class="d-flex align-center gap-3">
              <v-icon size="40" color="grey">mdi-folder-multiple</v-icon>
              <div>
                <v-card-title class="pa-0">批量操作工具</v-card-title>
                <p class="text-caption text-grey">即將推出</p>
              </div>
            </div>
          </v-card-item>
        </v-card>
      </v-col>
    </v-row>

    <!-- 選中工具的詳細視圖 -->
    <v-row v-if="hasAdminAccess && selectedTool" class="mt-6">
      <v-col cols="12">
        <v-card>
          <v-card-item>
            <div class="d-flex align-center justify-space-between">
              <v-card-title>{{ getToolTitle(selectedTool) }}</v-card-title>
              <v-btn
                icon="mdi-close"
                size="small"
                variant="text"
                @click="selectedTool = null"
              />
            </div>
          </v-card-item>

          <v-divider />

          <v-card-text>
            <!-- 報告上傳檢查工具 -->
            <ReportUploadChecker
              v-if="selectedTool === 'reportUploadChecker'"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useUserStore } from '@/store/user';
import ReportUploadChecker from '@/components/AdminTools/ReportUploadChecker.vue';

const userStore = useUserStore();
const selectedTool = ref(null);

// 檢查是否有管理員權限
const hasAdminAccess = computed(() => {
  const userRoles = userStore.currentUserRoles;
  return userRoles?.includes('系統管理員') || userRoles?.includes('超級管理員');
});

// 選擇工具
const selectTool = (toolName) => {
  selectedTool.value = toolName;
};

// 獲取工具標題
const getToolTitle = (toolName) => {
  const titles = {
    reportUploadChecker: '報告上傳狀態檢查工具',
    dataRecovery: '數據恢復工具',
    batchOperations: '批量操作工具',
  };
  return titles[toolName] || '工具';
};
</script>

<style scoped>
.admin-tools-center {
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

h1 {
  font-size: 28px;
  font-weight: 600;
  margin: 0;
}

.tool-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;

  &:hover:not(:disabled) {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
    border-color: #1976d2;
  }

  &.selected {
    border-color: #1976d2;
    background-color: rgba(25, 118, 210, 0.04);
  }

  &:disabled {
    cursor: not-allowed;
  }
}

.opacity-50 {
  opacity: 0.5;
}

.gap-2 {
  gap: 8px;
}

.gap-3 {
  gap: 12px;
}
</style>
