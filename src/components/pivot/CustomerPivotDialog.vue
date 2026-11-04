<template>
  <DataPivotDialog
    v-model="isOpen"
    :project-id="projectId"
    :project-name="projectName"
    title="客戶資料透視"
    storage-key="customerPivotSettings"
    preset-collection="customerPivotPresets"
    :datasets="datasets"
    :can-manage-presets="canSeeAll"
    :can-export="canSeeAll"
    @load-dataset="loadLogs"
    @open-item="onOpenItem"
  />
</template>

<script setup>
/**
 * 客戶資料透視：客戶（列表資料，立即開啟）／洽談紀錄（切換時才載入完整客資）
 * 銷售只統計自己的客戶：列表由後端依權限回傳，洽談紀錄與儀表板相同由前端再過濾
 */
import { computed, ref, shallowRef } from 'vue';
import { fetchFullCustomersForExport } from '@/api';
import { useUserStore } from '@/store/user';
import { buildCustomerDataset, buildLogDataset, buildLogRows } from '@/utils/customerPivotConfig';
import DataPivotDialog from './DataPivotDialog.vue';

const LOGS_TTL_MS = 5 * 60 * 1000;

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: String, default: '' },
  projectName: { type: String, default: '' },
  customerList: { type: Array, default: () => [] },
  listLoading: { type: Boolean, default: false },
  settings: { type: Object, default: null },
  canSeeAll: { type: Boolean, default: false }, // 櫃台／管理員：全案、可匯出、可存方案
  systems: { type: Array, default: () => [] },
  projectNames: { type: Object, default: null }, // 建案 id → 名稱（來源建案、關聯建案）
});
const emit = defineEmits(['update:modelValue', 'open-customer']);

const userStore = useUserStore();
const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const logRows = shallowRef([]);
const logsLoading = ref(false);
const logsError = ref('');
let logsLoadedAt = 0;

async function loadLogs() {
  if (logsLoading.value) return;
  if (logsLoadedAt && Date.now() - logsLoadedAt < LOGS_TTL_MS) return;
  logsLoading.value = true;
  logsError.value = '';
  try {
    const raw = await fetchFullCustomersForExport(props.projectId, userStore.user?.key, props.systems);
    logRows.value = buildLogRows(raw, props.projectId, { canSeeAll: props.canSeeAll, user: userStore.user });
    logsLoadedAt = Date.now();
  } catch (e) {
    console.error('載入洽談紀錄失敗:', e);
    logsError.value = '洽談紀錄載入失敗';
  } finally {
    logsLoading.value = false;
  }
}

const customersDataset = computed(() => buildCustomerDataset({
  list: props.customerList, settings: props.settings, loading: props.listLoading, projectNames: props.projectNames,
}));
const logsDataset = computed(() => buildLogDataset({
  rows: logRows.value, settings: props.settings, loading: logsLoading.value, error: logsError.value, projectNames: props.projectNames,
}));
const datasets = computed(() => [customersDataset.value, logsDataset.value]);

function onOpenItem({ dataset, item }) {
  if (dataset === 'logs') emit('open-customer', { docId: item.customerId, salesName: item.sales });
  else emit('open-customer', { docId: item.docId, salesName: item['銷售人員'] });
}
</script>
