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

    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <v-select :model-value="selectedPlanId" :items="plans" item-title="name" item-value="id"
        label="請佣方案" variant="outlined" density="comfortable" hide-details
        style="max-width: 320px" :disabled="isLoading || switchingPlan" @update:model-value="switchPlan" />
      <v-btn variant="text" prepend-icon="mdi-plus" :disabled="isLoading || switchingPlan" @click="openPlanDialog()">新增方案</v-btn>
      <v-btn variant="text" prepend-icon="mdi-pencil-outline" :disabled="isLoading || switchingPlan" @click="openPlanDialog(activePlan, true)">修改名稱</v-btn>
      <v-btn v-if="!isBuiltInPlan(selectedPlanId)" variant="text" :disabled="isLoading || switchingPlan" @click="openPlanDialog(activePlan)">管理方案</v-btn>
      <span class="text-body-2 text-medium-emphasis">{{ activePlan.priceBasis === 'package' ? '配套價格，不計車位' : '房屋價格，含車位' }}｜請佣與獎金獨立計算，額度 100%</span>
    </div>
    <v-dialog v-model="planDialog" max-width="480" :persistent="savingPlan">
      <v-card :title="renameOnly ? '修改方案名稱' : (planForm.id ? '編輯請佣方案' : '新增請佣方案')">
        <v-card-text>
          <v-text-field v-model="planForm.name" label="方案名稱" placeholder="例如：裝修請佣" maxlength="30" counter="30" variant="outlined" :disabled="savingPlan" />
          <v-alert v-if="planForm.id" type="info" variant="tonal" density="compact" class="mb-4">名稱只儲存於「{{ projectName }}」，可隨時再修改。既有請佣、獎金、保留款與額度紀錄保持不變；畫面及重新匯出的報表使用新名稱，歷史紀錄保留建立時的名稱。</v-alert>
          <v-select v-if="!renameOnly" v-model="planForm.priceBasis" label="採用價格" :items="[{ title: '配套價格（不含車位）', value: 'package' }, { title: '房屋價格（含車位）', value: 'house' }]" variant="outlined" :disabled="planLocked" />
          <p v-if="planLocked && !renameOnly" class="text-caption text-medium-emphasis">內建或已使用的方案只能修改名稱，保留價格來源與歷史帳務。</p>
        </v-card-text>
        <v-card-actions>
          <v-btn v-if="!renameOnly && planForm.id && !isBuiltInPlan(planForm.id)" color="error" variant="text" :disabled="savingPlan || planHasData(planForm.id)" :loading="deletingPlan" @click="removePlan">刪除方案</v-btn>
          <v-spacer />
          <v-btn :disabled="savingPlan" @click="planDialog = false">取消</v-btn>
          <v-btn color="primary" :loading="savingPlan" :disabled="!planForm.name.trim()" @click="savePlan">{{ renameOnly ? '儲存名稱' : (planForm.id ? '儲存方案' : '建立方案') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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

    <v-window :class="{ 'workbench-window': tab === 'workbench' }" v-else :key="selectedPlanId + activePlan.priceBasis" v-model="tab" :touch="false">
      <v-window-item value="workbench">
        <CommissionWorkbench
          ref="workbenchRef"
          :project-id="projectId"
          :project-name="projectName"
          :settings="settings"
          :households="households"
          :parkings="parkings"
          :personnel="personnel"
          :ledgers="ledgerMap"
          :next-period="nextPeriod"
          :records="records"
          :bonus-records="bonusRecords"
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
          @refresh="handleSubmitted"
          @export-period="goExportPeriod"
          @reimport-period="goReimportPeriod"
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
          :all-records="allRecords"
          :all-bonus-records="allBonusRecords"
          :plans="plans"
          :project-id="projectId"
          :project-name="projectName"
          :settings="settings"
          :records="records"
          :bonus-records="bonusRecords"
          :personnel="personnel"
          :loading="recordsLoading"
          :preset-period="exportPeriod"
        />
      </v-window-item>

      <v-window-item value="settings">
        <CommissionSettingsTab
          ref="settingsRef"
          :project-id="projectId"
          :settings="settings"
          :personnel="personnel"
          @saved="loadSettings"
        />
      </v-window-item>

      <v-window-item value="import">
        <CommissionHistoryImport
          ref="importRef"
          :project-id="projectId"
          :project-name="projectName"
          :settings="settings"
          :households="households"
          :parkings="parkings"
          :personnel="personnel"
          :ledgers="ledgerMap"
          :records="records"
          @imported="handleSubmitted"
        />
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, defineAsyncComponent, provide } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useUserStore } from '@/store/user';
import { useSalesDataStore } from '@/store/salesDataStore';
import {
  fetchCommissionSettings, fetchCommissionPlans, createCommissionPlan, updateCommissionPlan, deleteCommissionPlan,
  fetchCommissionRecords,
  fetchBonusRecords,
  fetchCommissionLedgers,
} from '@/api';
import { DEFAULT_PLANS, planIdOf, isBuiltInPlan, mergePlans } from '@/utils/commissionPlans';
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
const userStore = useUserStore();
const planOperator = () => ({ operatorKey: userStore.user?.key || userStore.user?.phone || '', operatorName: userStore.user?.name || '' });

const projectId = computed(() => route.params.projectId);
const tab = ref('workbench');
const isLoading = ref(true);
const recordsLoading = ref(false);
const exportCenterRef = ref(null);
const importRef = ref(null);
const exportPeriod = ref(null);   // 匯出中心要帶入的期別（歷期總覽「匯出此期」／工作台送出後）

const settings = ref(mergeSettings(null));
const allRecords = ref([]);
const allBonusRecords = ref([]);
const savedPlans = ref([]);
const selectedPlanId = ref('general');
const switchingPlan = ref(false);
const plans = computed(() => mergePlans(savedPlans.value));
const activePlan = computed(() => plans.value.find(p => p.id === selectedPlanId.value) || DEFAULT_PLANS[0]);
provide('commissionPlan', activePlan);
const records = computed(() => allRecords.value.filter(r => planIdOf(r) === selectedPlanId.value));
const bonusRecords = computed(() => allBonusRecords.value.filter(r => planIdOf(r) === selectedPlanId.value));
const workbenchRef = ref(null);
const settingsRef = ref(null);
const planDialog = ref(false);
const renameOnly = ref(false);
const savingPlan = ref(false);
const deletingPlan = ref(false);
const planForm = ref({ id: '', name: '', priceBasis: 'package' });
const planLocked = computed(() => !!planForm.value.id && (isBuiltInPlan(planForm.value.id) || planHasData(planForm.value.id)));

function hasDraft() {
  return !!(workbenchRef.value?.hasDraft || settingsRef.value?.hasDraft || importRef.value?.hasDraft || exportCenterRef.value?.hasDraft);
}
// 有請佣、獎金紀錄或已請額度的方案不可刪除或變更價格來源。
function planHasData(id) {
  return savedPlans.value.some(p => p.id === id && p.used) || allRecords.value.some(r => planIdOf(r) === id)
    || allBonusRecords.value.some(r => planIdOf(r) === id)
    || ledgers.value.some(l => planIdOf(l) === id && toNum(l.claimedRatioPct) > 0);
}
function openPlanDialog(plan = null, nameOnly = false) {
  renameOnly.value = !!plan && nameOnly;
  planForm.value = plan ? { id: plan.id, name: plan.name, priceBasis: plan.priceBasis } : { id: '', name: '', priceBasis: 'package' };
  planDialog.value = true;
}
async function switchPlan(id) {
  if (switchingPlan.value) return false;
  if (id === selectedPlanId.value) return true;
  if (hasDraft() && !window.confirm('切換方案將捨棄尚未儲存的變更，確定切換？')) return false;
  try {
    switchingPlan.value = true;
    const saved = await fetchCommissionSettings(projectId.value, id);
    selectedPlanId.value = id;
    settings.value = mergeSettings(saved);
    return true;
  } catch (e) { toast.error(`切換方案失敗：${e.message}`); return false; }
  finally { switchingPlan.value = false; }
}
function upsertSavedPlan(plan) {
  const i = savedPlans.value.findIndex(p => p.id === plan.id);
  if (i >= 0) savedPlans.value[i] = { ...savedPlans.value[i], ...plan };
  else savedPlans.value.push(plan);
}
async function savePlan() {
  const { id, priceBasis } = planForm.value;
  const name = planForm.value.name.trim();
  if (!name || plans.value.some(p => p.name === name && p.id !== id)) { toast.warning('請使用不同的方案名稱'); return; }
  savingPlan.value = true;
  try {
    if (id) {
      const current = plans.value.find(p => p.id === id);
      const basis = renameOnly.value || planLocked.value ? current.priceBasis : priceBasis;
      if (basis !== current.priceBasis && hasDraft() && !window.confirm('變更價格來源將捨棄尚未儲存的變更，確定變更？')) return;
      const plan = { id, name, priceBasis: basis };
      await updateCommissionPlan(projectId.value, plan, planOperator());
      upsertSavedPlan(plan);
      planDialog.value = false;
      toast.success(`已更新「${name}」`);
    } else {
      const plan = { id: `plan_${crypto.randomUUID()}`, name, priceBasis };
      await createCommissionPlan(projectId.value, plan, planOperator());
      upsertSavedPlan(plan);
      planDialog.value = false;
      if (await switchPlan(plan.id)) tab.value = 'settings';
      toast.success(`已新增「${name}」`);
    }
  } catch (e) { toast.error(`${id ? '更新' : '新增'}方案失敗：${e.message}`); }
  finally { savingPlan.value = false; }
}
async function removePlan() {
  const { id, name } = planForm.value;
  if (!id || isBuiltInPlan(id)) return;
  if (hasDraft() && !window.confirm('刪除方案將捨棄尚未儲存的內容，確定繼續？')) return;
  if (!window.confirm(`確定刪除「${name}」？方案將從清單移除，設定與匯出版型不連帶刪除。`)) return;
  deletingPlan.value = true;
  savingPlan.value = true;
  try {
    await Promise.all([loadLedgers(), loadRecords()]);
    if (planHasData(id)) { toast.warning('此方案已有請佣紀錄，無法刪除'); return; }
    await deleteCommissionPlan(projectId.value, id, planOperator());
    savedPlans.value = savedPlans.value.filter(p => p.id !== id);
    planDialog.value = false;
    if (selectedPlanId.value === id) {
      selectedPlanId.value = 'general';
      await loadSettings();
    }
    toast.success(`已刪除「${name}」`);
  } catch (e) { toast.error(`刪除方案失敗：${e.message}`); }
  finally { deletingPlan.value = false; savingPlan.value = false; }
}
async function loadPlans() { savedPlans.value = await fetchCommissionPlans(projectId.value); }

const ledgers = ref([]);

const projectData = computed(() => salesDataStore.getProjectData(projectId.value));
const projectName = computed(() => projectData.value?.project?.name || '');
const households = computed(() => projectData.value?.households || []);
const parkings = computed(() => projectData.value?.parkings || []);
const personnel = computed(() => projectData.value?.personnel || []);

const ledgerMap = computed(() => {
  const map = {};
  ledgers.value.filter(l => planIdOf(l) === selectedPlanId.value).forEach(l => { map[l.unitId] = toNum(l.claimedRatioPct); });
  return map;
});

// 下一期別：目前方案（含作廢與匯入）最大期別 + 1
const nextPeriod = computed(() => {
  let max = 0;
  records.value.forEach(r => {
    const p = toNum(r.period);
    if (p > max) max = p;
  });
  return max + 1;
});

async function loadSettings() {
  const saved = await fetchCommissionSettings(projectId.value, selectedPlanId.value);
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
    allRecords.value = recs;
    allBonusRecords.value = bonuses;
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
    await Promise.all([loadPlans(), loadSettings(), loadLedgers(), loadRecords()]);
  } catch (e) {
    console.error('[CommissionBonus] 載入失敗:', e);
    toast.error(`載入失敗：${e.message}`);
  } finally {
    isLoading.value = false;
  }
}

/** 送出/匯入完成後：刷新 ledger 與紀錄；工作台送出帶期別時直接跳到匯出中心該期 */
async function handleSubmitted(payload = null) {
  await Promise.all([loadLedgers(), loadRecords()]);
  if (payload?.period) goExportPeriod(payload.period);
}

/** 歷期總覽「重新匯入此期」：切到歷史匯入並預帶期別（自動勾選覆蓋） */
function goReimportPeriod(period) {
  tab.value = 'import';
  requestAnimationFrame(() => {
    importRef.value?.presetPeriod?.(period);
  });
}

function goExportPeriod(period) {
  exportPeriod.value = toNum(period);
  tab.value = 'export';
  // 匯出中心已掛載時直接選取（同一期別再次點選也能生效）；尚未掛載則由 preset-period 帶入
  exportCenterRef.value?.selectPeriod?.(toNum(period));
}

function goBack() {
  router.push({ name: 'SalesControlSystem', params: { projectName: projectId.value } });
}

onMounted(async () => {
  isLoading.value = true;
  try {
    await salesDataStore.loadProjectData(projectId.value);
    await Promise.all([loadPlans(), loadSettings(), loadLedgers(), loadRecords()]);
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

<style scoped>
.workbench-window { overflow: visible; }
</style>
