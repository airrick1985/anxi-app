<template>
  <div>
    <div v-if="loading" class="text-center py-10">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <v-alert v-else-if="!availablePeriods.length" type="info" variant="tonal">
      尚無可匯出的請佣紀錄。請先於「請佣工作台」送出或用「歷史匯入」銜接舊資料。
    </v-alert>

    <template v-else>
      <!-- 設定列 -->
      <v-card variant="outlined" class="mb-3">
        <v-card-text class="pb-2">
          <v-row dense align="center">
            <v-col cols="12" sm="3" md="2">
              <v-btn-toggle v-model="docType" mandatory color="primary" variant="outlined" divided density="comfortable">
                <v-btn value="claim" size="small">請佣總表</v-btn>
                <v-btn value="bonus" size="small">獎金表</v-btn>
              </v-btn-toggle>
            </v-col>
            <v-col cols="6" sm="3" md="2">
              <v-select v-model="period" :items="availablePeriods" label="期別" variant="outlined" density="compact" hide-details>
                <template #selection="{ item }">第 {{ item.value }} 期</template>
                <template #item="{ item, props: p }"><v-list-item v-bind="p" :title="`第 ${item.value} 期`"></v-list-item></template>
              </v-select>
            </v-col>
            <v-col cols="6" sm="4" md="3">
              <v-select v-model="selectedConfigId" :items="configOptions" item-title="name" item-value="id"
                label="欄位版型" variant="outlined" density="compact" hide-details></v-select>
            </v-col>
            <v-col cols="12" sm="auto" class="d-flex ga-1 flex-wrap">
              <v-btn size="small" variant="tonal" prepend-icon="mdi-pencil" @click="editTemplate">
                {{ selectedConfigId === '__default' ? '以此為底新增版型' : '編輯版型' }}
              </v-btn>
              <v-menu>
                <template #activator="{ props: p }">
                  <v-btn v-bind="p" size="small" variant="tonal" prepend-icon="mdi-dots-vertical">更多</v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item prepend-icon="mdi-import" title="套用全域範本…" @click="openGlobalPicker"></v-list-item>
                  <v-list-item v-if="isAdmin" prepend-icon="mdi-folder-cog-outline" title="全域範本管理頁" @click="goTemplateManager"></v-list-item>
                  <v-list-item v-if="isAdmin && selectedConfigId !== '__default'" prepend-icon="mdi-export" title="另存為全域範本" @click="saveAsGlobal"></v-list-item>
                  <v-list-item v-if="selectedConfigId !== '__default'" prepend-icon="mdi-star-outline" title="設為預設版型" @click="setAsDefault"></v-list-item>
                  <v-list-item v-if="selectedConfigId !== '__default'" prepend-icon="mdi-delete-outline" title="刪除此版型" class="text-error" @click="deleteConfig"></v-list-item>
                </v-list>
              </v-menu>
            </v-col>
            <v-spacer></v-spacer>
            <v-col cols="12" sm="4" md="3">
              <v-text-field v-model="fileName" label="下載檔名（免副檔名）" variant="outlined" density="compact" hide-details
                prepend-inner-icon="mdi-file-document-outline"></v-text-field>
            </v-col>
            <v-col cols="12" sm="auto" class="d-flex ga-2">
              <v-btn color="success" variant="flat" prepend-icon="mdi-microsoft-excel" :disabled="!grids.length" @click="downloadExcel">Excel</v-btn>
              <v-btn color="error" variant="flat" prepend-icon="mdi-file-pdf-box" :loading="pdfLoading" :disabled="!grids.length" @click="downloadPdf">PDF</v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-alert v-if="!activeRecords.length" type="warning" variant="tonal" class="mb-3">
        第 {{ period }} 期沒有有效（未作廢）的請佣紀錄。
      </v-alert>

      <!-- 預覽 -->
      <v-card v-else variant="outlined">
        <v-card-title class="text-subtitle-2 d-flex align-center">
          <v-icon start size="small">mdi-eye-outline</v-icon>即時預覽
          <span class="text-caption text-medium-emphasis ml-2">（與下載之 Excel / PDF 同一版面模型）</span>
          <v-spacer></v-spacer>
          <v-chip size="x-small" variant="tonal">{{ grids.length }} 張分頁</v-chip>
        </v-card-title>
        <v-tabs v-model="previewTab" density="compact" color="primary" show-arrows v-if="grids.length > 1">
          <v-tab v-for="(gr, i) in grids" :key="i" :value="i">{{ gr.name }}</v-tab>
        </v-tabs>
        <v-divider></v-divider>
        <v-card-text class="preview-wrap">
          <div v-if="grids[previewTab]" v-html="previewHtml"></div>
        </v-card-text>
      </v-card>
    </template>

    <!-- 版型編輯 -->
    <CommissionTemplateEditor
      v-model="editorOpen"
      :doc-type="docType"
      :editing="editorTarget"
      :settings="settings"
      @save="saveConfig"
    />

    <!-- 全域範本選擇 -->
    <v-dialog v-model="globalPickerOpen" max-width="480">
      <v-card>
        <v-card-title class="text-subtitle-1">套用全域範本（{{ docType === 'claim' ? '請佣總表' : '獎金表' }}）</v-card-title>
        <v-card-text>
          <div v-if="globalLoading" class="text-center py-4"><v-progress-circular indeterminate size="28"></v-progress-circular></div>
          <v-list v-else density="compact">
            <v-list-item v-for="t in globalTemplatesOfType" :key="t.id" :title="t.name" :subtitle="t.description || ''"
              @click="applyGlobal(t)">
              <template #append><v-icon color="primary">mdi-import</v-icon></template>
            </v-list-item>
          </v-list>
          <v-alert v-if="!globalLoading && !globalTemplatesOfType.length" type="info" variant="tonal" density="compact">
            尚無全域範本。超管/系管可於「請佣獎金版型範本管理」建立，或在此用「另存為全域範本」上傳。
          </v-alert>
        </v-card-text>
        <v-card-actions><v-spacer></v-spacer><v-btn variant="text" @click="globalPickerOpen = false">關閉</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useUserStore } from '@/store/user';
import CommissionTemplateEditor from './CommissionTemplateEditor.vue';
import {
  fetchCommissionExportConfigs, setCommissionExportConfig, deleteCommissionExportConfig,
  fetchCommissionExportTemplates, setCommissionExportTemplate,
  generateCommissionPdfAPI,
} from '@/api';
import { buildClaimModel, buildBonusModel, defaultClaimConfig, defaultBonusConfig } from '@/utils/commissionExportModel';
import { buildClaimGrid, buildBonusGrids, exportGridsToExcel, gridToHtml } from '@/services/commissionExcelService';
import { toNum } from '@/utils/commissionCalculation';

const props = defineProps({
  projectId: { type: String, required: true },
  projectName: { type: String, default: '' },
  settings: { type: Object, required: true },
  records: { type: Array, default: () => [] },
  bonusRecords: { type: Array, default: () => [] },
  personnel: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

const router = useRouter();
const toast = useToast();
const userStore = useUserStore();

function goTemplateManager() {
  router.push({ name: 'CommissionTemplateManager' });
}

const docType = ref('claim');
const period = ref(null);
const previewTab = ref(0);
const fileName = ref('');
const pdfLoading = ref(false);

const configs = ref([]);          // 建案版型
const selectedConfigId = ref('__default');
const editorOpen = ref(false);
const editorTarget = ref(null);
const globalPickerOpen = ref(false);
const globalLoading = ref(false);
const globalTemplates = ref([]);

const isAdmin = computed(() => {
  const roles = userStore.user?.roles || [];
  return roles.includes('超級管理員') || roles.includes('系統管理員');
});

const availablePeriods = computed(() => {
  const set = new Set();
  props.records.forEach(r => { if (r.status !== 'voided') set.add(toNum(r.period)); });
  return [...set].sort((a, b) => b - a);
});

watch(availablePeriods, (list) => {
  if (list.length && (period.value === null || !list.includes(period.value))) period.value = list[0];
}, { immediate: true });

const activeRecords = computed(() =>
  props.records.filter(r => r.status !== 'voided' && toNum(r.period) === toNum(period.value))
);
const activeBonusRows = computed(() =>
  props.bonusRecords.filter(b => b.status !== 'voided' && toNum(b.period) === toNum(period.value))
);

// ---------- 版型 ----------
const typeConfigs = computed(() => configs.value.filter(c => c.docType === docType.value));
const configOptions = computed(() => ([
  { id: '__default', name: '系統預設版型（重現舊表格式）' },
  ...typeConfigs.value.map(c => ({ id: c.id, name: c.isDefault ? `★ ${c.name}` : c.name })),
]));

const currentConfig = computed(() => {
  if (selectedConfigId.value === '__default') {
    return docType.value === 'claim' ? defaultClaimConfig(props.settings) : defaultBonusConfig(props.settings);
  }
  const found = configs.value.find(c => c.id === selectedConfigId.value);
  return found?.config || (docType.value === 'claim' ? defaultClaimConfig(props.settings) : defaultBonusConfig(props.settings));
});

// 切換文件類型時：優先選該類型的預設版型
watch(docType, () => {
  const def = typeConfigs.value.find(c => c.isDefault);
  selectedConfigId.value = def ? def.id : '__default';
  previewTab.value = 0;
});

async function loadConfigs() {
  try {
    configs.value = await fetchCommissionExportConfigs(props.projectId);
    const def = typeConfigs.value.find(c => c.isDefault);
    if (def) selectedConfigId.value = def.id;
  } catch (e) {
    console.error('[CommissionExportCenter] 載入版型失敗:', e);
  }
}
onMounted(loadConfigs);

// ---------- model / grids ----------
const personnelOrder = computed(() => props.personnel.map(p => p.name));

const claimModel = computed(() => {
  if (!activeRecords.value.length) return null;
  const cfg = docType.value === 'claim' ? currentConfig.value : projectDefaultClaimConfig();
  return buildClaimModel(activeRecords.value, {
    settings: props.settings, config: cfg, period: period.value, projectName: props.projectName,
  });
});

function projectDefaultClaimConfig() {
  const def = configs.value.find(c => c.docType === 'claim' && c.isDefault);
  return def?.config || defaultClaimConfig(props.settings);
}

const bonusModel = computed(() => {
  if (docType.value !== 'bonus' || !activeRecords.value.length) return null;
  return buildBonusModel({
    records: activeRecords.value,
    bonusRecords: activeBonusRows.value,
    settings: props.settings,
    config: currentConfig.value,
    period: period.value,
    projectName: props.projectName,
    projectId: props.projectId,
    personnelOrder: personnelOrder.value,
  });
});

const grids = computed(() => {
  try {
    if (!activeRecords.value.length) return [];
    if (docType.value === 'claim') {
      return claimModel.value ? [buildClaimGrid(claimModel.value)] : [];
    }
    if (!bonusModel.value) return [];
    const list = [];
    if (bonusModel.value.includeClaimSheet && claimModel.value) list.push(buildClaimGrid(claimModel.value));
    list.push(...buildBonusGrids(bonusModel.value));
    return list;
  } catch (e) {
    console.error('[CommissionExportCenter] 版面產生失敗:', e);
    return [];
  }
});

watch(grids, (g) => { if (previewTab.value >= g.length) previewTab.value = 0; });

const previewHtml = computed(() => {
  const grid = grids.value[previewTab.value];
  return grid ? gridToHtml(grid) : '';
});

// 檔名：依文件/期別/版型自動帶入，可改
watch([docType, period, claimModel, bonusModel], () => {
  const model = docType.value === 'claim' ? claimModel.value : bonusModel.value;
  if (model) fileName.value = model.fileName || '';
}, { immediate: true });

// ---------- 下載 ----------
function downloadExcel() {
  try {
    exportGridsToExcel(grids.value, fileName.value || 'export');
    toast.success('Excel 已下載');
  } catch (e) {
    console.error('[CommissionExportCenter] Excel 匯出失敗:', e);
    toast.error(`Excel 匯出失敗：${e.message}`);
  }
}

async function downloadPdf() {
  pdfLoading.value = true;
  try {
    const model = docType.value === 'claim' ? claimModel.value : bonusModel.value;
    const res = await generateCommissionPdfAPI({
      projectId: props.projectId,
      docType: docType.value,
      payload: {
        fileName: fileName.value || 'export',
        paper: model?.paper || 'A4',
        orientation: model?.orientation || 'landscape',
        grids: grids.value,
      },
    });
    if (res?.ok) {
      const bin = atob(res.base64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      const blob = new Blob([arr], { type: res.mimeType || 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.fileName || `${fileName.value}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast.success('PDF 已下載');
    }
  } catch (e) {
    console.error('[CommissionExportCenter] PDF 產製失敗:', e);
    toast.error(`PDF 產製失敗：${e.message}`);
  } finally {
    pdfLoading.value = false;
  }
}

// ---------- 版型 CRUD ----------
function editTemplate() {
  if (selectedConfigId.value === '__default') {
    editorTarget.value = null;   // 以預設為底新增
  } else {
    editorTarget.value = configs.value.find(c => c.id === selectedConfigId.value) || null;
  }
  editorOpen.value = true;
}

async function saveConfig(data) {
  try {
    const docId = data.id || `${props.projectId}_${docType.value}_${Date.now()}`;
    // 同 docType 只能有一個預設
    if (data.isDefault) {
      for (const c of typeConfigs.value) {
        if (c.isDefault && c.id !== docId) {
          await setCommissionExportConfig(c.id, { isDefault: false });
        }
      }
    }
    await setCommissionExportConfig(docId, {
      projectId: props.projectId,
      docType: docType.value,
      name: data.name,
      isDefault: !!data.isDefault,
      config: data.config,
    });
    await loadConfigs();
    selectedConfigId.value = docId;
    toast.success(`版型「${data.name}」已儲存`);
  } catch (e) {
    console.error('[CommissionExportCenter] 版型儲存失敗:', e);
    toast.error(`版型儲存失敗：${e.message}`);
  }
}

async function setAsDefault() {
  const target = configs.value.find(c => c.id === selectedConfigId.value);
  if (!target) return;
  await saveConfig({ id: target.id, name: target.name, isDefault: true, config: target.config });
}

async function deleteConfig() {
  const target = configs.value.find(c => c.id === selectedConfigId.value);
  if (!target) return;
  if (!window.confirm(`確定刪除版型「${target.name}」？`)) return;
  try {
    await deleteCommissionExportConfig(target.id);
    await loadConfigs();
    selectedConfigId.value = '__default';
    toast.success('版型已刪除');
  } catch (e) {
    toast.error(`刪除失敗：${e.message}`);
  }
}

// ---------- 全域範本 ----------
const globalTemplatesOfType = computed(() => globalTemplates.value.filter(t => t.docType === docType.value));

async function openGlobalPicker() {
  globalPickerOpen.value = true;
  globalLoading.value = true;
  try {
    globalTemplates.value = await fetchCommissionExportTemplates();
  } catch (e) {
    toast.error(`載入全域範本失敗：${e.message}`);
  } finally {
    globalLoading.value = false;
  }
}

/** 套用即複製：以範本 config 建立一組新的建案版型 */
async function applyGlobal(template) {
  globalPickerOpen.value = false;
  await saveConfig({
    id: null,
    name: template.name,
    isDefault: false,
    config: JSON.parse(JSON.stringify(template.config || {})),
  });
}

async function saveAsGlobal() {
  const target = configs.value.find(c => c.id === selectedConfigId.value);
  if (!target) return;
  const name = window.prompt('全域範本名稱：', target.name);
  if (!name) return;
  try {
    await setCommissionExportTemplate(`${docType.value}_${Date.now()}`, {
      docType: docType.value,
      name,
      description: `由「${props.projectName}」上傳`,
      config: JSON.parse(JSON.stringify(target.config)),
      createdBy: userStore.user?.name || '',
    });
    toast.success(`已另存為全域範本「${name}」`);
  } catch (e) {
    toast.error(`另存失敗：${e.message}`);
  }
}

// ---------- 對外 ----------
function selectPeriod(p) {
  if (availablePeriods.value.includes(toNum(p))) period.value = toNum(p);
}
defineExpose({ selectPeriod });
</script>

<style scoped>
.preview-wrap {
  overflow: auto;
  max-height: 70vh;
  background: #eceff4;
  padding: 16px;
}
.preview-wrap :deep(table.comm-grid) {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  margin: 0 auto;
}
</style>
