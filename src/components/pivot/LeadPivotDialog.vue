<template>
  <DataPivotDialog
    v-model="isOpen"
    :project-id="projectId"
    :project-name="projectName"
    title="聯絡名單透視"
    storage-key="leadPivotSettings"
    preset-collection="leadPivotPresets"
    :datasets="datasets"
    :can-manage-presets="canManagePresets"
    :can-export="true"
    @load-dataset="emit('load-reports')"
    @open-item="onOpenItem"
  />
</template>

<script setup>
/**
 * 聯絡名單透視：名單／回報紀錄（切換時才訂閱 contactLogs）
 * leads 由外層依權限傳入：櫃台／管理員為全案，銷售只有自己被分配的名單；回報紀錄只算這些名單
 */
import { computed } from 'vue';
import { buildLeadDataset, buildReportDataset } from '@/utils/leadPivotConfig';
import DataPivotDialog from './DataPivotDialog.vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: String, default: '' },
  projectName: { type: String, default: '' },
  leads: { type: Array, default: () => [] },
  reportLogs: { type: Array, default: () => [] },
  reportsLoading: { type: Boolean, default: false },
  reportsError: { type: String, default: '' },
  statusOptions: { type: Array, default: () => [] },
  reservationsByPhone: { type: Map, default: null }, // 電話 → 有效賞屋預約
  canManagePresets: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue', 'load-reports', 'open-lead']);

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const leadsDataset = computed(() => buildLeadDataset({
  leads: props.leads, projectName: props.projectName, statusOptions: props.statusOptions, reservationsByPhone: props.reservationsByPhone,
}));
const reportsDataset = computed(() => buildReportDataset({
  logs: props.reportLogs,
  leads: props.leads,
  projectName: props.projectName,
  statusOptions: props.statusOptions,
  reservationsByPhone: props.reservationsByPhone,
  loading: props.reportsLoading,
  error: props.reportsError,
}));
const datasets = computed(() => [leadsDataset.value, reportsDataset.value]);

function onOpenItem({ dataset, item }) {
  const target = datasets.value.find(d => d.key === dataset)?.openTarget?.(item);
  if (target) emit('open-lead', target);
}
</script>
