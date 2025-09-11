<template>
  <v-card class="pa-4" elevation="2">
    <v-card-title class="text-h5 text-green-darken-2">
      期款方式範本設定
    </v-card-title>
    <v-card-subtitle>管理不同合約類型的付款期款計算範本</v-card-subtitle>
    
    <div class="d-flex align-center my-4 ga-2">
      <v-select
        v-model="selectedTemplateId"
        :items="templates"
        item-title="templateName"
        item-value="id"
        label="選擇要編輯的範本"
        variant="outlined"
        density="compact"
        hide-details
        class="flex-grow-1"
      ></v-select>
      <v-btn color="green-darken-2" @click="openTemplateDialog()" prepend-icon="mdi-plus">新增範本</v-btn>
      <v-btn :disabled="!selectedTemplate" @click="openTemplateDialog(selectedTemplate)" variant="outlined">命名</v-btn>
      <v-btn :disabled="!selectedTemplate" @click="confirmDeleteTemplate" color="error" variant="outlined">刪除</v-btn>
    </div>
    <v-divider></v-divider>

    <v-skeleton-loader v-if="templatesLoading" type="list-item-two-line@5"></v-skeleton-loader>
    
    <div v-else-if="selectedTemplate">
      <v-list subheader>
        <v-list-subheader>
          範本項目 (可拖曳排序)
          <v-btn size="small" class="ml-4" color="primary" @click="openItemDialog(null, null)">新增母項目</v-btn>
        </v-list-subheader>

        <draggable
          v-model="selectedTemplate.items"
          item-key="id"
          handle=".drag-handle"
          @end="saveTemplate"
        >
          <template #item="{ element: item }">
            <div v-if="!item.parentId">
              <v-list-item class="mb-2" elevation="1" border>
                <template v-slot:prepend>
                  <v-icon class="drag-handle" style="cursor: move;">mdi-drag-horizontal-variant</v-icon>
                  <strong class="ml-4 mr-2 text-h6 text-grey-darken-1">{{ item.id }}</strong>
                </template>
                <v-list-item-title class="font-weight-bold">{{ item.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ item.formula }}</v-list-item-subtitle>
                <template v-slot:append>
                  <v-btn size="small" color="blue-grey" variant="tonal" @click="openItemDialog(null, item.id)" class="mr-2">新增子項目</v-btn>
                  <v-btn icon="mdi-pencil" variant="text" size="small" @click="openItemDialog(item, null)"></v-btn>
                  <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click="deleteItem(item.id)"></v-btn>
                </template>
              </v-list-item>
              
              <draggable
                v-if="getChildren(item.id).length"
                :list="getChildren(item.id)"
                item-key="id"
                handle=".drag-handle"
                class="ml-10"
                @end="saveTemplate"
              >
                <template #item="{ element: child }">
                  <v-list-item class="mb-2" elevation="0" border>
                     <template v-slot:prepend>
                        <v-icon class="drag-handle" style="cursor: move;">mdi-drag-horizontal-variant</v-icon>
                        <strong class="ml-4 mr-2 text-grey-darken-1">{{ child.id }}</strong>
                     </template>
                    <v-list-item-title>{{ child.name }}</v-list-item-title>
                    <v-list-item-subtitle>{{ child.formula }}</v-list-item-subtitle>
                    <template v-slot:append>
                      <v-btn icon="mdi-pencil" variant="text" size="small" @click="openItemDialog(child, item.id)"></v-btn>
                      <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click="deleteItem(child.id)"></v-btn>
                    </template>
                  </v-list-item>
                </template>
              </draggable>
            </div>
          </template>
        </draggable>

      </v-list>
    </div>
    
    <v-alert v-else-if="!templatesLoading" type="info" variant="tonal" class="mt-4">
      請先新增或選擇一個範本來進行編輯。
    </v-alert>


    <v-dialog v-model="templateDialog.show" persistent max-width="400px">
      <v-card>
        <v-card-title>{{ templateDialog.isEditing ? '重新命名範本' : '新增範本' }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="templateDialog.name"
            label="範本名稱"
            variant="outlined"
            autofocus
            @keydown.enter="handleTemplateSave"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="templateDialog.show = false">取消</v-btn>
          <v-btn color="primary" text @click="handleTemplateSave">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="itemDialog.show" persistent max-width="800px">
      <v-card v-if="itemDialog.show">
        <v-card-title class="bg-primary">
          {{ editingItem.isNew ? '新增' : '編輯' }}期款項目
        </v-card-title>
        <v-card-text class="pt-4">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field v-model="editingItem.id" label="編號 (A-Z)" :rules="[v => !!v && /^[A-Z]$/.test(v) || '請輸入單一A-Z大寫字母']" :disabled="!editingItem.isNew" required></v-text-field>
              <v-text-field v-model="editingItem.name" label="項目名稱" required :rules="[v => !!v || '必填']"></v-text-field>
              <v-text-field v-model.number="editingItem.conditionalValue" label="條件設定值 (%)" type="number" suffix="%"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-select v-model="editingItem.roundingMethod" :items="['無條件進位', '四捨五入', '無條件捨去']" label="進位方式"></v-select>
              <v-text-field v-model.number="editingItem.roundingValue" label="進位值 (小數位數)" type="number"></v-text-field>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>
          
          <label class="v-label mb-2">計算方式</label>
          <v-sheet border rounded class="pa-2 d-flex flex-wrap align-center ga-1" min-height="56px">
            <v-chip
              v-for="(token, index) in formulaTokens"
              :key="index"
              :color="token.color"
              label
              closable
              @click:close="removeToken(index)"
            >
              {{ token.text }}
            </v-chip>
          </v-sheet>
          
          <div class="d-flex flex-wrap align-center ga-2 mt-2">
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn v-bind="props" color="primary" prepend-icon="mdi-plus">加入項目</v-btn>
              </template>
              <v-list>
                <v-list-item @click="addToken({type: 'variable', value: '總價', text: '總價', color: 'blue'})">
                  <v-list-item-title>總價</v-list-item-title>
                </v-list-item>
                <v-list-item @click="addToken({type: 'variable', value: '條件設定值', text: '條件設定值', color: 'teal'})">
                  <v-list-item-title>條件設定值</v-list-item-title>
                </v-list-item>
                <v-divider></v-divider>
                <v-list-item
                  v-for="item in availableReferenceItems"
                  :key="item.id"
                  @click="addToken({type: 'reference', value: item.id, text: `${item.id}: ${item.name}`, color: 'grey'})"
                >
                  <v-list-item-title>{{ item.id }}: {{ item.name }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>

            <v-text-field v-model="numberInput" label="數字" type="number" density="compact" hide-details style="max-width: 100px;" @keydown.enter="addNumberToken"></v-text-field>
            <v-btn @click="addNumberToken" icon="mdi-plus-box-outline" size="small"></v-btn>
            
            <v-btn-toggle variant="outlined" divided>
              <v-btn @click="addToken({type: 'operator', value: '+', text: '+', color: 'orange'})">+</v-btn>
              <v-btn @click="addToken({type: 'operator', value: '-', text: '-', color: 'orange'})">-</v-btn>
              <v-btn @click="addToken({type: 'operator', value: '*', text: '*', color: 'orange'})">*</v-btn>
              <v-btn @click="addToken({type: 'operator', value: '/', text: '/', color: 'orange'})">/</v-btn>
            </v-btn-toggle>
          </div>

        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="itemDialog.show = false">取消</v-btn>
          <v-btn color="primary" text @click="handleItemSave">儲存項目</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-card>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'vue-toastification';
import draggable from 'vuedraggable';
import {
  listenToPaymentTermTemplates,
  setPaymentTermTemplate,
  updatePaymentTermTemplate,
  deletePaymentTermTemplate,
} from '@/api';

// --- 核心 State ---
const route = useRoute();
const toast = useToast();
const projectId = ref(route.params.projectId);

const templates = ref([]);
const templatesLoading = ref(true);
const selectedTemplateId = ref(null);
let unsubscribeTemplates = null;

// --- 範本管理 Dialog State ---
const templateDialog = ref({ show: false, name: '', isEditing: false });

// --- 項目管理 Dialog State ---
const itemDialog = ref({ show: false });
const editingItem = ref({});
const formulaTokens = ref([]);
const numberInput = ref('');

// --- Computed Properties ---
const selectedTemplate = computed({
  get: () => templates.value.find(t => t.id === selectedTemplateId.value),
  set: (newValue) => {
    const index = templates.value.findIndex(t => t.id === selectedTemplateId.value);
    if (index !== -1) templates.value[index] = newValue;
  }
});

const getChildren = (parentId) => {
  return selectedTemplate.value?.items?.filter(i => i.parentId === parentId) || [];
};

const availableReferenceItems = computed(() => {
  return selectedTemplate.value?.items?.filter(i => i.id !== editingItem.value.id) || [];
});

// --- 範本 CRUD Methods ---
const setupTemplatesListener = () => {
  templatesLoading.value = true;
  unsubscribeTemplates = listenToPaymentTermTemplates(projectId.value, (data) => {
    templates.value = data;
    if (templatesLoading.value) templatesLoading.value = false;
    if (!selectedTemplateId.value && data.length > 0) {
      selectedTemplateId.value = data[0].id;
    }
  });
};

const openTemplateDialog = (template = null) => {
  if (template) {
    templateDialog.value = { show: true, name: template.templateName, isEditing: true };
  } else {
    templateDialog.value = { show: true, name: '', isEditing: false };
  }
};

// ✅ 3. 修改 handleTemplateSave 函式的新增邏輯
const handleTemplateSave = async () => {
  const name = templateDialog.value.name.trim();
  if (!name) {
    toast.error("範本名稱不可為空");
    return;
  }
  
  if (templateDialog.value.isEditing) {
    // 編輯模式維持不變
    await updatePaymentTermTemplate(selectedTemplateId.value, { templateName: name });
    toast.success("範本已重新命名");
  } else {
    // 新增模式
    const timestamp = getTimestampString();
    const docId = `${projectId.value}_${name}_${timestamp}`;

    const newTemplate = {
      projectId: projectId.value,
      templateName: name,
      items: [],
    };
    
    // 呼叫新的 API 函式並傳入自訂 ID
    await setPaymentTermTemplate(docId, newTemplate);
    toast.success("已新增範本");
  }
  templateDialog.value.show = false;
};

const confirmDeleteTemplate = async () => {
  if (confirm(`您確定要刪除範本「${selectedTemplate.value.templateName}」嗎？`)) {
    await deletePaymentTermTemplate(selectedTemplateId.value);
    toast.info("範本已刪除");
    selectedTemplateId.value = null;
  }
};

// --- 項目 CRUD & 公式編輯器 Methods ---

// 將公式字串解析為 token 陣列
const parseFormulaToTokens = (formula) => {
  if (!formula) return [];
  const allItems = selectedTemplate.value?.items || [];
  const regex = /([A-Z])|(總價|條件設定值)|(\d+(\.\d+)?)|([+\-*/()])/g;
  const tokens = [];
  let match;
  while ((match = regex.exec(formula)) !== null) {
    const [fullMatch, ref, variable, number, operator] = match;
    if (ref) {
      const item = allItems.find(i => i.id === ref);
      tokens.push({ type: 'reference', value: ref, text: `${ref}: ${item?.name || '未知'}`, color: 'grey' });
    } else if (variable) {
      tokens.push({ type: 'variable', value: variable, text: variable, color: variable === '總價' ? 'blue' : 'teal' });
    } else if (number) {
      tokens.push({ type: 'number', value: number, text: number, color: 'purple' });
    } else if (operator) {
      tokens.push({ type: 'operator', value: operator, text: operator, color: 'orange' });
    }
  }
  return tokens;
};

const openItemDialog = (item, parentId) => {
  if (item) { // 編輯
    editingItem.value = JSON.parse(JSON.stringify(item));
    editingItem.value.isNew = false;
    formulaTokens.value = parseFormulaToTokens(item.formula);
  } else { // 新增
    editingItem.value = {
      isNew: true,
      id: '', name: '', parentId: parentId || null,
      formula: '', conditionalValue: 0, roundingMethod: '四捨五入', roundingValue: 0,
    };
    formulaTokens.value = [];
  }
  itemDialog.value.show = true;
};

const handleItemSave = async () => {
  // 將 tokens 陣列轉回公式字串
  editingItem.value.formula = formulaTokens.value.map(t => t.value).join('');
  
  const currentItems = selectedTemplate.value.items || [];
  if (editingItem.value.isNew) {
    // 新增
    const newItem = { ...editingItem.value };
    delete newItem.isNew;
    if(!newItem.id || !newItem.name) {
      toast.error("編號和項目名稱為必填");
      return;
    }
    currentItems.push(newItem);
  } else {
    // 編輯
    const index = currentItems.findIndex(i => i.id === editingItem.value.id);
    if (index !== -1) {
      currentItems[index] = { ...editingItem.value };
      delete currentItems[index].isNew;
    }
  }
  selectedTemplate.value.items = currentItems;
  await saveTemplate();
  itemDialog.value.show = false;
};

const deleteItem = async (itemId) => {
  if (confirm("確定要刪除這個項目及其所有子項目嗎？")) {
    const itemsToDelete = [itemId];
    const children = getChildren(itemId);
    children.forEach(c => itemsToDelete.push(c.id));

    selectedTemplate.value.items = selectedTemplate.value.items.filter(i => !itemsToDelete.includes(i.id));
    await saveTemplate();
  }
};

const saveTemplate = async () => {
  try {
    await updatePaymentTermTemplate(selectedTemplate.value.id, { items: selectedTemplate.value.items });
    toast.success("範本已儲存");
  } catch(e) {
    toast.error("儲存失敗：" + e.message);
  }
};

// 公式編輯器 Token 操作
const addToken = (token) => {
  formulaTokens.value.push(token);
};
const removeToken = (index) => {
  formulaTokens.value.splice(index, 1);
};
const addNumberToken = () => {
  if (numberInput.value !== '' && !isNaN(numberInput.value)) {
    addToken({ type: 'number', value: numberInput.value, text: numberInput.value, color: 'purple' });
    numberInput.value = '';
  }
};


/**
 * 獲取 YYYYMMDDHHMMSS 格式的時間字串
 * @returns {string}
 */
function getTimestampString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}



// --- Lifecycle Hooks ---
onMounted(() => {
  if (projectId.value) {
    setupTemplatesListener();
  } else {
    toast.error('錯誤：未提供專案 ID！');
  }
});

onUnmounted(() => {
  if (unsubscribeTemplates) unsubscribeTemplates();
});
</script>

<style scoped>
.drag-handle {
  cursor: move;
}
.ml-10 {
  margin-left: 40px;
}
</style>