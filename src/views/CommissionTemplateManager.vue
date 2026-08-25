<template>
  <v-container class="pa-4" style="max-width: 1100px">
    <div class="d-flex align-center mb-4">
      <v-btn icon="mdi-arrow-left" variant="text" @click="$router.back()"></v-btn>
      <h1 class="text-h5 font-weight-bold">請佣獎金版型範本管理</h1>
      <v-spacer></v-spacer>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openCreate('claim')">新增請佣總表範本</v-btn>
      <v-btn color="primary" variant="tonal" prepend-icon="mdi-plus" class="ml-2" @click="openCreate('bonus')">新增獎金表範本</v-btn>
    </div>

    <v-alert type="info" variant="tonal" density="compact" class="mb-4">
      全域範本供所有建案「套用即複製」為建案版型；修改範本不影響已套用的建案。各建案也可在匯出中心「另存為全域範本」上傳。
    </v-alert>

    <div v-if="loadingList" class="text-center py-10">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <template v-else>
      <v-card v-for="type in ['claim', 'bonus']" :key="type" variant="outlined" class="mb-4">
        <v-card-title class="text-subtitle-1">
          <v-icon start size="small">{{ type === 'claim' ? 'mdi-file-table-outline' : 'mdi-cash-multiple' }}</v-icon>
          {{ type === 'claim' ? '請佣總表範本' : '獎金表範本' }}
        </v-card-title>
        <v-card-text>
          <v-table density="comfortable" v-if="byType(type).length">
            <thead>
              <tr><th>名稱</th><th>說明</th><th>建立者</th><th style="width:140px"></th></tr>
            </thead>
            <tbody>
              <tr v-for="t in byType(type)" :key="t.id">
                <td class="font-weight-medium">{{ t.name }}</td>
                <td class="text-medium-emphasis">{{ t.description || '—' }}</td>
                <td>{{ t.createdBy || '—' }}</td>
                <td>
                  <v-btn size="small" variant="text" icon="mdi-pencil" @click="openEdit(t)"></v-btn>
                  <v-btn size="small" variant="text" icon="mdi-delete-outline" color="error" @click="remove(t)"></v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
          <div v-else class="text-medium-emphasis text-body-2">尚無範本。</div>
        </v-card-text>
      </v-card>
    </template>

    <CommissionTemplateEditor
      v-model="editorOpen"
      :doc-type="editorDocType"
      :editing="editorTarget"
      :settings="{}"
      @save="save"
    />
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'vue-toastification';
import { useUserStore } from '@/store/user';
import CommissionTemplateEditor from '@/components/commission/CommissionTemplateEditor.vue';
import {
  fetchCommissionExportTemplates, setCommissionExportTemplate, deleteCommissionExportTemplate,
} from '@/api';

const toast = useToast();
const userStore = useUserStore();

const loadingList = ref(true);
const templates = ref([]);
const editorOpen = ref(false);
const editorDocType = ref('claim');
const editorTarget = ref(null);

function byType(type) {
  return templates.value
    .filter(t => t.docType === type)
    .sort((a, b) => String(a.name).localeCompare(String(b.name), 'zh-Hant'));
}

async function load() {
  loadingList.value = true;
  try {
    templates.value = await fetchCommissionExportTemplates();
  } catch (e) {
    toast.error(`載入失敗：${e.message}`);
  } finally {
    loadingList.value = false;
  }
}
onMounted(load);

function openCreate(docType) {
  editorDocType.value = docType;
  editorTarget.value = null;
  editorOpen.value = true;
}

function openEdit(t) {
  editorDocType.value = t.docType;
  editorTarget.value = { id: t.id, name: t.name, isDefault: false, config: t.config };
  editorOpen.value = true;
}

async function save(data) {
  try {
    const docId = data.id || `${editorDocType.value}_${Date.now()}`;
    await setCommissionExportTemplate(docId, {
      docType: editorDocType.value,
      name: data.name,
      config: data.config,
      createdBy: userStore.user?.name || '',
    });
    toast.success(`範本「${data.name}」已儲存`);
    await load();
  } catch (e) {
    toast.error(`儲存失敗：${e.message}`);
  }
}

async function remove(t) {
  if (!window.confirm(`確定刪除範本「${t.name}」？（不影響已套用此範本的建案版型）`)) return;
  try {
    await deleteCommissionExportTemplate(t.id);
    toast.success('已刪除');
    await load();
  } catch (e) {
    toast.error(`刪除失敗：${e.message}`);
  }
}
</script>
