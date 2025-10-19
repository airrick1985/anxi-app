
<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="3">
        <v-list density="compact" nav v-model:selected="selectedCategory">
          <v-list-subheader>選項類別</v-list-subheader>
          <v-list-item
            v-for="category in categories"
            :key="category.value"
            :value="category.value"
            :title="category.title"
            :prepend-icon="category.icon"
            color="primary"
          ></v-list-item>
        </v-list>
      </v-col>

      <v-col cols="12" md="9">
        <div v-if="isLoading" class="text-center pa-10">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <p class="mt-4 text-grey-darken-1">正在載入設定...</p>
        </div>
        <v-window v-model="selectedCategory[0]" v-else>
          <v-window-item value="phase">
            <v-card variant="outlined">
              <v-toolbar flat color="white" density="compact">
                <v-card-title class="text-subtitle-1 font-weight-bold">驗屋階段</v-card-title>
                <v-spacer></v-spacer>
                <v-btn color="primary" variant="outlined" size="small" @click="openAddItemDialog('phase')" prepend-icon="mdi-plus">
                  新增階段
                </v-btn>
              </v-toolbar>
              <v-divider></v-divider>
              <v-card-text>
                <v-data-table
                  :headers="simpleHeaders"
                  :items="inspectionOptions.phase"
                  :loading="isLoading"
                  items-per-page="-1" hover no-data-text="尚無驗屋階段" density="compact"
                >
                  <template v-slot:item.actions="{ item }">
                    <v-icon size="small" class="mr-2" color="primary" @click="openEditItemDialog(item)">mdi-pencil</v-icon>
                    <v-icon size="small" color="error" @click="openDeleteItemDialog(item)">mdi-delete</v-icon>
                  </template>
                  <template v-slot:bottom></template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-window-item>

          <v-window-item value="area">
             <v-card variant="outlined">
              <v-toolbar flat color="white" density="compact">
                <v-card-title class="text-subtitle-1 font-weight-bold">檢查區域</v-card-title>
                <v-spacer></v-spacer>
                <v-btn color="primary" variant="outlined" size="small" @click="openAddItemDialog('area')" prepend-icon="mdi-plus">
                  新增區域
                </v-btn>
              </v-toolbar>
              <v-divider></v-divider>
               <v-card-text>
                <v-data-table
                  :headers="simpleHeaders"
                  :items="inspectionOptions.area"
                  :loading="isLoading"
                  items-per-page="-1"
                  hover
                  no-data-text="尚無檢查區域"
                  density="compact"
                >
                  <template v-slot:item.actions="{ item }">
                    <v-icon size="small" class="mr-2" color="primary" @click="openEditItemDialog(item)">mdi-pencil</v-icon>
                    <v-icon size="small" color="error" @click="openDeleteItemDialog(item)">mdi-delete</v-icon>
                  </template>
                  <template v-slot:bottom></template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-window-item>

          <v-window-item value="quickReply">
             <v-card variant="outlined">
              <v-toolbar flat color="white" density="compact">
                <v-card-title class="text-subtitle-1 font-weight-bold">快選回覆</v-card-title>
                <v-spacer></v-spacer>
                <v-btn color="primary" variant="outlined" size="small" @click="openAddItemDialog('quickReply')" prepend-icon="mdi-plus">
                  新增回覆
                </v-btn>
              </v-toolbar>
              <v-divider></v-divider>
              <v-card-text>
                <v-data-table
                  :headers="simpleHeaders"
                  :items="inspectionOptions.quickReply"
                  :loading="isLoading"
                  items-per-page="-1" hover no-data-text="尚無快選回覆" density="compact"
                >
                  <template v-slot:item.actions="{ item }">
                    <v-icon size="small" class="mr-2" color="primary" @click="openEditItemDialog(item)">mdi-pencil</v-icon>
                    <v-icon size="small" color="error" @click="openDeleteItemDialog(item)">mdi-delete</v-icon>
                  </template>
                  <template v-slot:bottom></template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-window-item>

          <v-window-item value="category"> ... </v-window-item>
          <v-window-item value="status"> ... </v-window-item>
          <v-window-item value="level"> ... </v-window-item>
          <v-window-item value="progress"> ... </v-window-item>

        </v-window>
      </v-col>
    </v-row>

      <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" location="top right">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn icon="mdi-close" variant="text" @click="snackbar.show = false"></v-btn>
      </template>
      </v-snackbar>

    <v-dialog v-model="editDialog.visible" max-width="500px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ editDialog.isEdit ? '編輯' : '新增' }}項目</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="editFormRef">
             <v-text-field
                v-model="editDialog.item.value"
                :label="`項目名稱 (${editDialog.typeName})`"
                :rules="[v => !!v || '項目名稱為必填']"
                required
                variant="outlined"
                density="compact"
                autofocus
              ></v-text-field>
              </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeEditDialog">取消</v-btn>
          <v-btn color="primary" variant="flat" @click="saveItem" :loading="editDialog.loading">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog.visible" max-width="500px" persistent>
      <v-card v-if="deleteDialog.item">
        <v-card-title class="text-h6 d-flex align-center bg-red-lighten-4">
          <v-icon start color="red-darken-2">mdi-alert-circle-outline</v-icon>
          確認刪除
        </v-card-title>
        <v-card-text class="pt-4">
          您確定要永久刪除「<strong>{{ deleteDialog.typeName }}</strong>」分類下的項目「<strong>{{ deleteDialog.item.value }}</strong>」嗎？
          <p v-if="deleteDialog.item.type === 'category' && !deleteDialog.item.parentValue" class="text-caption text-error mt-2">
            注意：刪除工程主分類將一併刪除其下的所有子項目。
          </p>
          <p class="mt-4">此操作無法復原。</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeDeleteDialog">取消</v-btn>
          <v-btn color="error" variant="flat" :loading="deleteDialog.loading" @click="confirmDeleteItem">確定刪除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useProjectStore } from '@/store/projectStore';
import { getInspectionOptions, saveInspectionOption, deleteInspectionOption } from '@/api'; // ✓ 引入 API

// --- Component State ---
const route = useRoute();
const projectStore = useProjectStore();
const isLoading = ref(true);
const snackbar = reactive({ show: false, text: '', color: 'success' });

const categories = ref([
  { title: '驗屋階段', value: 'phase', icon: 'mdi-format-list-numbered' },
  { title: '檢查區域', value: 'area', icon: 'mdi-home-search' },
  { title: '工程種類', value: 'category', icon: 'mdi-toolbox-outline' },
  { title: '檢查狀態', value: 'status', icon: 'mdi-list-status' },
  { title: '缺失等級', value: 'level', icon: 'mdi-alert-decagram-outline' },
  { title: '修繕進度', value: 'progress', icon: 'mdi-progress-wrench' },
  { title: '快選回覆', value: 'quickReply', icon: 'mdi-comment-quote-outline' },
]);
const selectedCategory = ref(['phase']);
// ✓ 用於儲存從後端獲取的選項資料
const inspectionOptions = reactive({
  phase: [],
  area: [],
  category: [], // 包含主分類和子項目
  status: [],
  level: [],
  progress: [],
  quickReply: [],
});

// ✓ 簡單列表的 DataTable Header
const simpleHeaders = ref([
  { title: '項目名稱', key: 'value', sortable: true },
  { title: '排序', key: 'order', sortable: true, width: '100px' }, // 可選
  { title: '操作', key: 'actions', sortable: false, align: 'end', width: '100px' },
]);


// --- Props & Project Info (保持不變) ---
const props = defineProps({ projectId: { type: String } });
const currentProjectId = ref(route.params.projectId || props.projectId);
const projectName = computed(() => projectStore.idToNameMap[currentProjectId.value] || '');

// --- ✓ 新增/編輯 Dialog State ---
const editFormRef = ref(null); // ✓ Form 引用
const editDialog = reactive({
  visible: false,
  isEdit: false,
  loading: false,
  item: { id: null, type: '', value: '', order: 100 }, // ✓ 預設 item 結構
  typeName: '', // ✓ 顯示中文類別名稱
});

// --- ✓ 刪除 Dialog State ---
const deleteDialog = reactive({
  visible: false,
  loading: false,
  item: null, // 儲存要刪除的完整 item 物件 { id, type, value, ... }
  typeName: '',
});

// --- Helper Functions ---
function showSnackbar(text, color = 'success') {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
}

// --- ✓ Dialog 開啟/關閉 函數 ---
function getCategoryNameByType(type) {
  const category = categories.value.find(c => c.value === type);
  return category ? category.title : '項目';
}

function openAddItemDialog(type) {
  editDialog.item = { id: null, type: type, value: '', order: 100 }; // ✓ 重置 item
  editDialog.typeName = getCategoryNameByType(type);
  editDialog.isEdit = false;
  editDialog.visible = true;
}

function openEditItemDialog(item) {
  editDialog.item = { ...item }; // ✓ 複製一份 item 資料
  editDialog.typeName = getCategoryNameByType(item.type);
  editDialog.isEdit = true;
  editDialog.visible = true;
}

function closeEditDialog() {
  editDialog.visible = false;
  // ✓ 延遲重置表單，避免動畫問題
  setTimeout(() => {
    if (editFormRef.value) editFormRef.value.resetValidation();
    editDialog.item = { id: null, type: '', value: '', order: 100 };
  }, 300);
}

function openDeleteItemDialog(item) {
  deleteDialog.item = item;
  deleteDialog.typeName = getCategoryNameByType(item.type);
  deleteDialog.visible = true;
}

function closeDeleteDialog() {
  deleteDialog.visible = false;
  // ✓ 延遲重置
  setTimeout(() => deleteDialog.item = null, 300);
}

// --- Data Loading ---
async function loadInitialData() {
  isLoading.value = true;
  // 清空舊資料
  Object.keys(inspectionOptions).forEach(key => inspectionOptions[key] = []);

  if (projectStore.projectsList.length === 0) {
    await projectStore.fetchProjects();
  }

  if (!currentProjectId.value) {
    showSnackbar('錯誤：缺少建案 ID', 'error');
    isLoading.value = false;
    return;
  }

  console.log(`載入建案 ${currentProjectId.value} (${projectName.value}) 的驗屋選項...`);

  try {
    // ✓ 呼叫 API 獲取資料
    const result = await getInspectionOptions({ projectId: currentProjectId.value });
    if (result.status === 'success') {
      // ✓ 將獲取的資料存入 reactive state
      Object.assign(inspectionOptions, result.data);
      console.log('Inspection options loaded:', inspectionOptions);
    } else {
      throw new Error(result.message || '無法載入選項資料');
    }
  } catch (error) {
    showSnackbar(`載入選項失敗: ${error.message}`, 'error');
  } finally {
    isLoading.value = false;
  }
}

async function saveItem() {
  if (!editFormRef.value) return;
  const { valid } = await editFormRef.value.validate(); // ✓ 驗證表單
  if (!valid) return;

  editDialog.loading = true;
  try {
    const payload = {
      projectId: currentProjectId.value,
      optionData: { // ✓ 傳送 optionData 物件
        type: editDialog.item.type,
        value: editDialog.item.value,
        order: editDialog.item.order,
        // parentValue, color, icon 等之後加入
      },
    };
    if (editDialog.isEdit) {
      payload.optionId = editDialog.item.id; // ✓ 更新時傳入 optionId
    }

    const result = await saveInspectionOption(payload); // ✓ 呼叫 API

    if (result.status === 'success') {
      showSnackbar(editDialog.isEdit ? '更新成功' : '新增成功');
      closeEditDialog();
      // ✓ 重新載入該類別的資料 (或直接更新本地列表)
      await loadInitialData(); // 重新載入所有資料是較簡單的做法
    } else {
      throw new Error(result.message || '儲存失敗');
    }
  } catch (error) {
    showSnackbar(`儲存失敗: ${error.message}`, 'error');
  } finally {
    editDialog.loading = false;
  }
}

async function confirmDeleteItem() {
  if (!deleteDialog.item?.id) return;
  deleteDialog.loading = true;
  try {
    const result = await deleteInspectionOption({ optionId: deleteDialog.item.id }); // ✓ 呼叫 API
    if (result.status === 'success') {
      showSnackbar('刪除成功');
      closeDeleteDialog();
      // ✓ 重新載入資料
      await loadInitialData();
    } else {
      throw new Error(result.message || '刪除失敗');
    }
  } catch (error) {
    showSnackbar(`刪除失敗: ${error.message}`, 'error');
  } finally {
    deleteDialog.loading = false;
  }
}


// --- Lifecycle Hooks & Watchers (保持不變) ---
onMounted(() => {
  if (route.params.projectId) currentProjectId.value = route.params.projectId;
  loadInitialData();
});
watch(() => props.projectId, (newVal) => {
  if (newVal && newVal !== currentProjectId.value) {
    currentProjectId.value = newVal;
    loadInitialData();
  }
});
watch(() => route.params.projectId, (newVal) => {
  if (newVal && newVal !== currentProjectId.value) {
    currentProjectId.value = newVal;
    loadInitialData();
  }
});


</script>

<style scoped>
.v-list-item--active {
  background-color: rgba(var(--v-theme-primary), 0.1);
}
.v-window-item {
  min-height: 300px; /* 維持最小高度 */
}
/* 讓 DataTable 的 actions 垂直居中 */
:deep(.v-data-table td:last-child) {
  vertical-align: middle;
}
</style>