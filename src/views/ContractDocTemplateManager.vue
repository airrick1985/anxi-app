<template>
  <v-container>
    <v-card elevation="2" class="pa-4">
      <div class="d-flex align-center flex-wrap ga-2 mb-4">
        <div class="text-h5">
          <v-icon class="mr-1">mdi-file-document-multiple-outline</v-icon>
          合約製作範本管理（全域）
        </div>
        <v-spacer />
        <v-btn color="primary" variant="tonal" prepend-icon="mdi-plus" @click="createFromDefault">
          從預設建立範本
        </v-btn>
      </div>

      <v-alert type="info" variant="tonal" density="compact" class="mb-4">
        範本內容（頁面組合 / 價款公式 / 條款庫 / 銀行組）的細部編輯方式：至任一建案「銷控設定 → 合約製作範本」
        套用範本並調整後，按「另存為全域範本」回存。套用採複製，修改範本不影響已套用的建案。
      </v-alert>

      <v-data-table :items="templates" :headers="headers" :loading="loading" item-value="id"
        density="comfortable" :items-per-page="25">
        <template #item.pagesCount="{ item }">
          {{ (item.config?.pages || []).length }} 頁
        </template>
        <template #item.updatedAt="{ item }">
          {{ formatDate(item.updatedAt) }}
        </template>
        <template #item.actions="{ item }">
          <v-btn size="small" variant="text" icon @click="openRename(item)">
            <v-icon>mdi-pencil</v-icon>
            <v-tooltip activator="parent" location="top">重新命名 / 描述</v-tooltip>
          </v-btn>
          <v-btn size="small" variant="text" icon @click="duplicateTemplate(item)">
            <v-icon>mdi-content-copy</v-icon>
            <v-tooltip activator="parent" location="top">複製範本</v-tooltip>
          </v-btn>
          <v-btn size="small" variant="text" icon color="error" @click="removeTemplate(item)">
            <v-icon>mdi-delete-outline</v-icon>
            <v-tooltip activator="parent" location="top">刪除範本</v-tooltip>
          </v-btn>
        </template>
        <template #no-data>
          <div class="text-center pa-6 text-grey">
            尚無全域範本。可「從預設建立範本」，或於建案設定中「另存為全域範本」。
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- 重新命名 -->
    <v-dialog v-model="renameDialog.show" max-width="480">
      <v-card>
        <v-card-title>編輯範本資訊</v-card-title>
        <v-card-text>
          <v-text-field v-model="renameDialog.name" label="範本名稱" variant="outlined" density="compact" class="mb-2" />
          <v-textarea v-model="renameDialog.description" label="描述" variant="outlined" density="compact" rows="2" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="renameDialog.show = false">取消</v-btn>
          <v-btn color="primary" variant="flat" :loading="renameDialog.saving" @click="commitRename">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useToast } from 'vue-toastification';
import { fetchContractDocTemplates, setContractDocTemplate, deleteContractDocTemplate } from '@/api';
import { buildDefaultContractDocConfig } from '@/utils/contractDocDefaults';

const toast = useToast();

const loading = ref(true);
const templates = ref([]);

const headers = [
  { title: '範本名稱', key: 'name' },
  { title: '描述', key: 'description' },
  { title: '頁面數', key: 'pagesCount', sortable: false },
  { title: '最後更新', key: 'updatedAt' },
  { title: '操作', key: 'actions', sortable: false, align: 'end' },
];

async function load() {
  loading.value = true;
  try {
    templates.value = await fetchContractDocTemplates();
  } catch (e) {
    console.error('讀取全域範本失敗:', e);
    toast.error(`讀取全域範本失敗：${e.message}`);
  } finally {
    loading.value = false;
  }
}

onMounted(load);

function newTemplateId() {
  return `tpl_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

async function createFromDefault() {
  const name = window.prompt('請輸入範本名稱：', '新合約製作範本');
  if (!name) return;
  try {
    const config = buildDefaultContractDocConfig(null);
    delete config.projectId;
    await setContractDocTemplate(newTemplateId(), {
      name,
      description: '',
      config,
      createdAt: new Date(),
    });
    toast.success('範本已建立');
    await load();
  } catch (e) {
    toast.error(`建立失敗：${e.message}`);
  }
}

async function duplicateTemplate(item) {
  try {
    await setContractDocTemplate(newTemplateId(), {
      name: `${item.name} (複製)`,
      description: item.description || '',
      config: JSON.parse(JSON.stringify(item.config || {})),
      createdAt: new Date(),
    });
    toast.success('範本已複製');
    await load();
  } catch (e) {
    toast.error(`複製失敗：${e.message}`);
  }
}

async function removeTemplate(item) {
  if (!window.confirm(`確認刪除範本「${item.name}」？已套用此範本的建案不受影響。`)) return;
  try {
    await deleteContractDocTemplate(item.id);
    toast.success('範本已刪除');
    await load();
  } catch (e) {
    toast.error(`刪除失敗：${e.message}`);
  }
}

const renameDialog = reactive({ show: false, id: null, name: '', description: '', saving: false, item: null });

function openRename(item) {
  renameDialog.id = item.id;
  renameDialog.name = item.name;
  renameDialog.description = item.description || '';
  renameDialog.item = item;
  renameDialog.show = true;
}

async function commitRename() {
  renameDialog.saving = true;
  try {
    await setContractDocTemplate(renameDialog.id, {
      name: renameDialog.name,
      description: renameDialog.description,
      config: JSON.parse(JSON.stringify(renameDialog.item.config || {})),
      createdAt: renameDialog.item.createdAt || new Date(),
    });
    toast.success('已更新範本資訊');
    renameDialog.show = false;
    await load();
  } catch (e) {
    toast.error(`更新失敗：${e.message}`);
  } finally {
    renameDialog.saving = false;
  }
}

function formatDate(ts) {
  if (!ts) return '';
  const d = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts.seconds ? ts.seconds * 1000 : ts);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false });
}
</script>
