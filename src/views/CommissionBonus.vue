<template>
  <v-container fluid class="commission-bonus-page pa-4">
    <div class="d-flex align-center mb-3 flex-wrap ga-2">
      <v-btn icon="mdi-arrow-left" variant="text" @click="goBack"></v-btn>
      <h1 class="text-h5 font-weight-bold mr-2">請佣獎金</h1>
      <v-chip color="primary" variant="tonal" v-if="projectName">{{ projectName }}</v-chip>
      <v-spacer></v-spacer>
      <v-btn
        variant="text"
        prepend-icon="mdi-refresh"
        :loading="isLoading"
        @click="reloadAll"
      >重新載入</v-btn>
    </div>

    <v-tabs v-model="tab" color="primary" density="comfortable" show-arrows>
      <v-tab value="workbench" prepend-icon="mdi-briefcase-edit-outline">請佣工作台</v-tab>
      <v-tab value="periods" prepend-icon="mdi-history">歷期總覽</v-tab>
      <v-tab value="stats" prepend-icon="mdi-chart-bar">累計統計</v-tab>
      <v-tab value="export" prepend-icon="mdi-file-export-outline">匯出中心</v-tab>
      <v-tab value="settings" prepend-icon="mdi-cog-outline">設定</v-tab>
      <v-tab value="import" prepend-icon="mdi-database-import-outline">歷史匯入</v-tab>
    </v-tabs>
    <v-divider class="mb-4"></v-divider>

    <div v-if="isLoading" class="text-center py-16">
      <v-progress-circular indeterminate color="primary" size="56"></v-progress-circular>
      <div class="text-body-2 text-medium-emphasis mt-4">載入建案與請佣資料中…</div>
    </div>

    <v-window v-else v-model="tab" :touch="false">
      <v-window-item value="workbench">
        <CommissionWorkbench
          :project-id="projectId"
          :project-name="projectName"
          :settings="settings"
          :households="households"
          :parkings="parkings"
          :personnel="personnel"
          :ledgers="ledgerMap"
          :next-period="nextPeriod"
          @submitted="handleSubmitted"
        />
      </v-window-item>

      <v-window-item value="periods">
        <CommissionPeriodList
          :project-id="projectId"
          :project-name="projectName"
          :settings="settings"
          :records="records"
          :bonus-records="bonusRecords"
          :loading="recordsLoading"
          @refresh="loadRecords"
          @export-period="goExportPeriod"
        />
      </v-window-item>

      <v-window-item value="stats">
        <CommissionStats
          :project-id="projectId"
          :project-name="projectName"
          :records="records"
          :bonus-records="bonusRecords"
          :loading="recordsLoading"
        />
      </v-window-item>

      <v-window-item value="export">
        <CommissionExportCenter
          ref="exportCenterRef"
          :project-id="projectId"
          :project-name="projectName"
          :settings="settings"
          :records="records"
          :bonus-records="bonusRecords"
          :personnel="personnel"
          :loading="recordsLoading"
        />
      </v-window-item>

      <v-window-item value="settings">
        <CommissionSettingsTab
          :project-id="projectId"
          :settings="settings"
          @saved="loadSettings"
        />
      </v-window-item>

      <v-window-item value="import">
        <CommissionHistoryImport
          :project-id="projectId"
          :project-name="projectName"
          :settings="settings"
          :households="households"
          :parkings="parkings"
          :personnel="personnel"
          :ledgers="ledgerMap"
          @imported="handleSubmitted"
        />
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, defineAsyncComponent } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useSalesDataStore } from '@/store/salesDataStore';
import {
  fetchCommissionSettings,
  fetchCommissionRecords,
  fetchBonusRecords,
  fetchCommissionLedgers,
} from '@/api';
import { mergeSettings, toNum } from '@/utils/commissionCalculation';

const CommissionWorkbench = defineAsyncComponent(() => import('@/components/commission/CommissionWorkbench.vue'));
const CommissionPeriodList = defineAsyncComponent(() => import('@/components/commission/CommissionPeriodList.vue'));
const CommissionSettingsTab = defineAsyncComponent(() => import('@/components/commission/CommissionSettingsTab.vue'));
const CommissionStats = defineAsyncComponent(() => import('@/components/commission/CommissionStats.vue'));
const CommissionExportCenter = defineAsyncComponent(() => import('@/components/commission/CommissionExportCenter.vue'));
const CommissionHistoryImport = defineAsyncComponent(() => import('@/components/commission/CommissionHistoryImport.vue'));

const route = useRoute();
const router = useRouter();
const toast = useToast();
const salesDataStore = useSalesDataStore();

const projectId = computed(() => route.params.projectId);
const tab = ref('workbench');
const isLoading = ref(true);
const recordsLoading = ref(false);
const exportCenterRef = ref(null);

const settings = ref(mergeSettings(null));
const records = ref([]);
const bonusRecords = ref([]);
const ledgers = ref([]);

const projectData = computed(() => salesDataStore.getProjectData(projectId.value));
const projectName = computed(() => projectData.value?.project?.name || '');
const households = computed(() => projectData.value?.households || []);
const parkings = computed(() => projectData.value?.parkings || []);
const personnel = computed(() => projectData.value?.personnel || []);

const ledgerMap = computed(() => {
  const map = {};
  ledgers.value.forEach(l => { map[l.unitId] = toNum(l.claimedRatioPct); });
  return map;
});

// 下一期別：全建案（含作廢與匯入）最大期別 + 1
const nextPeriod = computed(() => {
  let max = 0;
  records.value.forEach(r => {
    const p = toNum(r.period);
    if (p > max) max = p;
  });
  return max + 1;
});

async function loadSettings() {
  const saved = await fetchCommissionSettings(projectId.value);
  settings.value = mergeSettings(saved);
}

async function loadLedgers() {
  ledgers.value = await fetchCommissionLedgers(projectId.value);
}

async function loadRecords() {
  recordsLoading.value = true;
  try {
    const [recs, bonuses] = await Promise.all([
      fetchCommissionRecords(projectId.value),
      fetchBonusRecords(projectId.value),
    ]);
    records.value = recs;
    bonusRecords.value = bonuses;
  } catch (e) {
    console.error('[CommissionBonus] 載入請佣紀錄失敗:', e);
    toast.error(`載入請佣紀錄失敗：${e.message}`);
  } finally {
    recordsLoading.value = false;
  }
}

async function reloadAll() {
  isLoading.value = true;
  try {
    await salesDataStore.loadProjectData(projectId.value, true);
    await Promise.all([loadSettings(), loadLedgers(), loadRecords()]);
  } catch (e) {
    console.error('[CommissionBonus] 載入失敗:', e);
    toast.error(`載入失敗：${e.message}`);
  } finally {
    isLoading.value = false;
  }
}

/** 送出/匯入完成後：刷新 ledger 與紀錄 */
async function handleSubmitted() {
  await Promise.all([loadLedgers(), loadRecords()]);
}

function goExportPeriod(period) {
  tab.value = 'export';
  // 讓匯出中心帶入指定期別
  requestAnimationFrame(() => {
    exportCenterRef.value?.selectPeriod?.(period);
  });
}

function goBack() {
  router.push({ name: 'SalesControlSystem', params: { projectName: projectId.value } });
}

onMounted(async () => {
  isLoading.value = true;
  try {
    await salesDataStore.loadProjectData(projectId.value);
    await Promise.all([loadSettings(), loadLedgers(), loadRecords()]);
  } catch (e) {
    console.error('[CommissionBonus] 初始化失敗:', e);
    toast.error(`初始化失敗：${e.message}`);
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.commission-bonus-page {
  max-width: 1600px;
  margin: 0 auto;
}
</style>
