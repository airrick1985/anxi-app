<template>
  <v-card class="pa-4" elevation="2">
    <v-card-title class="text-h5 text-green-darken-2">
      期款方式範本設定
    </v-card-title>
    <v-card-subtitle>管理不同合約類型的付款期款計算範本</v-card-subtitle>
    
    <div class="d-flex justify-space-between align-center my-4">
      <span class="text-subtitle-1">已建立的期款範本</span>
      <v-btn color="green-darken-2" @click="openTemplateDialog()" prepend-icon="mdi-plus">新增範本</v-btn>
    </div>

    <v-row>
      <v-col
        v-for="template in templates"
        :key="template.id"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card
          :variant="selectedTemplateId === template.id ? 'tonal' : 'outlined'"
          :color="selectedTemplateId === template.id ? 'green-darken-3' : undefined"
          @click="selectedTemplateId = template.id"
          class="template-card"
        >
          <v-card-item>
            <div>
              <div class="text-overline mb-1">
                {{ selectedTemplateId === template.id ? '正在編輯' : '期款範本' }}
              </div>
              <div class="text-h6 mb-1">{{ template.templateName }}</div>
              <div class="d-flex flex-wrap gap-2 mb-1">
                <v-chip size="x-small" :color="getPaymentCategoryColor(template.paymentCategory)" variant="flat">
                  {{ template.paymentCategory || '一般期款' }}
                </v-chip>

              <v-chip size="x-small" color="purple-lighten-2" variant="flat">
                  {{ template.propertyType || '住家' }}
                </v-chip>

                <template v-if="template.minPrice || template.maxPrice">
                  <v-chip size="x-small" color="primary" variant="flat">
                    {{ template.minPrice ? `${template.minPrice}萬` : '0' }} ~ 
                    {{ template.maxPrice ? `${template.maxPrice}萬` : '無上限' }}
                  </v-chip>
                </template>
                <v-chip size="x-small" :color="template.buyerType === '首購' ? 'success' : 'info'" variant="flat">
                  {{ template.buyerType || '非首購' }}
                </v-chip>
              </div>
              <div class="text-caption">{{ template.items?.length || 0 }} 個項目</div>
            </div>
          </v-card-item>

          <v-card-actions>
            <v-btn 
              :prepend-icon="selectedTemplateId === template.id ? 'mdi-pencil-box-multiple-outline' : 'mdi-format-list-bulleted'"
              @click.stop
            >
              {{ selectedTemplateId === template.id ? '編輯中...' : '查看項目' }}
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn size="small" icon="mdi-content-copy" @click.stop="copyTemplate(template)" title="複製範本"></v-btn>
            <v-btn size="small" icon="mdi-pencil" @click.stop="openTemplateDialog(template)" title="修改"></v-btn>
            <v-btn size="small" icon="mdi-delete-outline" @click.stop="confirmDeleteTemplate(template)" title="刪除"></v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-divider class="my-4"></v-divider>

    <v-skeleton-loader v-if="templatesLoading" type="list-item-two-line@5"></v-skeleton-loader>
    
    <div v-else-if="selectedTemplate">
      <!-- 期款總覽區域 -->
      <v-card class="mb-4" variant="outlined">
        <v-card-title class="text-subtitle-1">
          期款項目總覽
          <v-chip
            :color="paymentOverview.isValid ? 'success' : 'warning'"
            class="ml-2"
            size="small"
          >
            總計: {{ paymentOverview.total }}%
          </v-chip>
        </v-card-title>
        
        <v-card-text>
          <v-alert
            v-if="!paymentOverview.isValid"
            density="compact"
            type="warning"
            variant="outlined"
            class="mb-3"
          >
            注意：期款項目總和應為 100%，目前差異為 {{ (100 - paymentOverview.total).toFixed(2) }}%
          </v-alert>

          <div class="d-flex flex-wrap gap-2">
            <template v-for="item in paymentOverview.items" :key="item.name">
              <v-chip
                :color="item.isParent ? 'primary' : 'grey'"
                :variant="item.isParent ? 'flat' : 'outlined'"
                size="small"
                class="ma-1"
              >
                {{ item.name }}: {{ item.value }}%
              </v-chip>
            </template>
          </div>
        </v-card-text>
      </v-card>

      <v-list subheader>
        <v-list-subheader>
          期款項目 (可拖曳排序)
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
              <v-list-item class="mb-2 py-2 list-item-custom" elevation="1" border>
                <template v-slot:prepend>
                  <v-icon class="drag-handle hidden-mobile" style="cursor: move;">mdi-drag-horizontal-variant</v-icon>
                </template>
                <div class="d-flex flex-column w-100">
                  <!-- 標題列 -->
                  <div class="d-flex align-center flex-wrap mb-1">
                    <div class="d-flex align-center">
                      <v-btn
                        v-if="getChildren(item.id).length > 0"
                        icon="mdi-chevron-right"
                        variant="text"
                        size="small"
                        :class="{'rotate-90': isExpanded(item.id)}"
                        @click.stop="toggleExpand(item.id)"
                      ></v-btn>
                      <div class="font-weight-bold text-h6">{{ item.name }}</div>
                    </div>
                    <v-chip size="small" color="primary" class="ml-2">{{ item.conditionalValue }}%</v-chip>
                  </div>
                  
                  <!-- 計算公式與進位設定 -->
                  <div class="d-flex flex-column flex-md-row align-start gap-2">
                    <div class="flex-grow-1">
                      <div class="text-caption text-grey-darken-1">計算公式：</div>
                      <div class="formula-hint text-wrap">{{ item.formula }}</div>
                    </div>
                    <div class="rounding-info">
                      <div class="text-caption text-grey-darken-1">進位設定：</div>
                      <div>{{ item.roundingMethod }} ({{ item.roundingValue }} 位)</div>
                    </div>
                  </div>

                  <!-- 操作按鈕 移動到底部 -->
                  <div class="d-flex flex-wrap gap-2 mt-2">
                    <v-btn size="small" color="blue-grey" variant="tonal" prepend-icon="mdi-plus" @click="openItemDialog(null, item.id)">
                      新增子項目
                    </v-btn>
                    <v-btn size="small" variant="tonal" prepend-icon="mdi-pencil" @click="openItemDialog(item, null)">
                      編輯
                    </v-btn>
                    <v-btn size="small" variant="tonal" color="error" prepend-icon="mdi-delete" @click="deleteItem(item.id)">
                      刪除
                    </v-btn>
                  </div>
                </div>
              </v-list-item>
              
              <draggable
                v-if="getChildren(item.id).length && isExpanded(item.id)"
                :list="getChildren(item.id)"
                item-key="id"
                handle=".drag-handle"
                class="ml-10"
                @end="saveTemplate"
              >
                <template #item="{ element: child }">
                  <v-list-item class="mb-2 py-2 list-item-custom" elevation="0" border>
                     <template v-slot:prepend>
                        <v-icon class="drag-handle hidden-mobile" style="cursor: move;">mdi-drag-horizontal-variant</v-icon>
                     </template>
                    <div class="d-flex flex-column w-100">
                      <!-- 標題列 -->
                      <div class="d-flex align-center flex-wrap mb-1">
                        <div class="font-weight-bold">{{ child.name }}</div>
                        <v-chip size="small" color="primary" variant="outlined" class="ml-2">{{ child.conditionalValue }}%</v-chip>
                      </div>
                      
                      <!-- 計算公式與進位設定 -->
                      <div class="d-flex flex-column flex-md-row align-start gap-2">
                        <div class="flex-grow-1">
                          <div class="text-caption text-grey-darken-1">計算公式：</div>
                          <div class="formula-hint text-wrap">{{ child.formula }}</div>
                        </div>
                        <div class="rounding-info">
                          <div class="text-caption text-grey-darken-1">進位設定：</div>
                          <div>{{ child.roundingMethod }} ({{ child.roundingValue }} 位)</div>
                        </div>
                      </div>

                      <!-- 操作按鈕 -->
                      <div class="d-flex flex-wrap gap-2 mt-2">
                        <v-btn size="small" variant="tonal" prepend-icon="mdi-pencil" @click="openItemDialog(child, item.id)">
                          編輯
                        </v-btn>
                        <v-btn size="small" variant="tonal" color="error" prepend-icon="mdi-delete" @click="deleteItem(child.id)">
                          刪除
                        </v-btn>
                      </div>
                    </div>
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
        <v-card-title>{{ templateDialog.isEditing ? '修改範本' : '新增範本' }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="templateDialog.name"
            label="範本名稱"
            variant="outlined"
            autofocus
            @keydown.enter="handleTemplateSave"
            :rules="[v => !!v || '必填']"
          ></v-text-field>

          
          
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="templateDialog.minPrice"
                label="最低總價 (萬)"
                type="number"
                variant="outlined"
                suffix="萬"
                :rules="[
                  v => !v || v >= 0 || '金額不能為負數',
                  v => !v || !templateDialog.maxPrice || Number(v) <= Number(templateDialog.maxPrice) || '最低價不能大於最高價'
                ]"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="templateDialog.maxPrice"
                label="最高總價 (萬)"
                type="number"
                variant="outlined"
                suffix="萬"
                :rules="[
                  v => !v || v >= 0 || '金額不能為負數',
                  v => !v || !templateDialog.minPrice || Number(v) >= Number(templateDialog.minPrice) || '最高價不能小於最低價'
                ]"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-select
            v-model="templateDialog.propertyType"
            label="物件類型"
            :items="['住家', '店面', '其他']"
            variant="outlined"
            class="mt-4"
            hide-details="auto"
          ></v-select>

          <v-expand-transition>
            <div v-if="templateDialog.propertyType === '其他'">
              <v-text-field
                v-model="templateDialog.customPropertyType"
                label="請輸入物件類型"
                placeholder="例如：事務所、透天..."
                variant="outlined"
                class="mt-4"
               
                :rules="[v => !!v || '請輸入類型名稱']"
              ></v-text-field>
            </div>
          </v-expand-transition>

          <v-select
            v-model="templateDialog.buyerType"
            label="買家類型"
            :items="['首購', '非首購']"
            variant="outlined"
            class="mt-4"
            
            hide-details="auto" 
          ></v-select>

          <v-combobox
            v-model="templateDialog.paymentCategory"
            label="期款類別"
            :items="['一般期款', '配套期款']"
            variant="outlined"
            
            class="mt-4" 
            
            clearable
            hint="可選擇預設選項或輸入自訂類別"
            persistent-hint
          ></v-combobox>
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
          {{ selectedTemplate?.templateName }} - {{ editingItem.isNew ? '新增期款項目' : `編輯: ${editingItem.name}` }}
        </v-card-title>
        <v-card-text class="pt-4">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field v-model="editingItem.name" label="項目名稱" required :rules="[v => !!v || '必填']"></v-text-field>
              <v-text-field v-model.number="editingItem.conditionalValue" label="比例 (%)" type="number" suffix="%"></v-text-field>
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
          
          <div class="d-flex flex-column ga-2 mt-2">
            <div class="d-flex align-center ga-2">
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn v-bind="props" color="primary" prepend-icon="mdi-plus">加入項目</v-btn>
                </template>
                <v-list>
                  <v-list-subheader>基本變數</v-list-subheader>
                  <v-list-item @click="addToken({type: 'variable', value: '總價', text: '總價', color: 'blue'})">
                    <v-list-item-title>總價</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="addToken({type: 'variable', value: '配套金額', text: '配套金額', color: 'blue'})">
                    <v-list-item-title>配套金額</v-list-item-title>
                  </v-list-item>
                  
                  <v-divider></v-divider>
                  <v-list-subheader>已建立的期款項目</v-list-subheader>
                  <v-list-item
                    v-for="item in existingItems"
                    :key="item.id"
                    @click="addToken({
                      type: 'reference',
                      value: item.name,
                      text: item.name,
                      color: 'grey-darken-1'
                    })"
                  >
                    <v-list-item-title>{{ item.name }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item v-if="!existingItems.length" disabled>
                    <v-list-item-title class="text-caption">尚未建立任何期款項目</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>

            <v-text-field
              v-model="formulaInput"
              label="計算公式"
              :rules="[validateFormula]"
              placeholder="可直接輸入數字、%及運算符號 (例如: 總價*10%)"
              @input="handleFormulaInput"
              hide-details="auto"
            ></v-text-field>
          </div>

        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="itemDialog.show = false">取消</v-btn>
          <v-btn color="primary" text @click="handleItemSave">儲存項目</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 複製範本確認對話框 -->
    <v-dialog v-model="copyDialog.show" max-width="400">
      <v-card>
        <v-card-title class="text-h6">
          複製期款範本
        </v-card-title>
        <v-card-text class="pt-4">
          <p class="mb-4">即將複製範本「{{ copyDialog.sourceTemplate?.templateName }}」</p>
          <v-text-field
            v-model="copyDialog.templateName"
            label="新範本名稱"
            variant="outlined"
            :rules="[v => !!v || '請輸入範本名稱']"
            autofocus
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="copyDialog.show = false">取消</v-btn>
          <v-btn
            color="primary"
            text
            :disabled="!copyDialog.templateName"
            @click="handleCopyConfirm"
          >
            確認複製
          </v-btn>
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
const templateDialog = ref({ 
  show: false, 
  name: '', 
  isEditing: false,
  editingTemplateId: null, 
  minPrice: '', 
  maxPrice: '', 
  buyerType: '非首購', 
  paymentCategory: '一般期款', 
  // ✅ [新增] 物件類型相關欄位
  propertyType: '住家', 
  customPropertyType: '' 
});

// --- 複製範本 Dialog State ---
const copyDialog = ref({
  show: false,
  templateName: '',
  sourceTemplate: null
});

// --- 項目管理 Dialog State ---
const itemDialog = ref({ show: false });
const editingItem = ref({});
const formulaTokens = ref([]);
const formulaInput = ref('');

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

// 計算期款項目總覽
const paymentOverview = computed(() => {
  if (!selectedTemplate.value?.items) return { items: [], total: 0, isValid: true };
  
  // 收集所有項目（包括子項目）
  const allItems = selectedTemplate.value.items.map(item => ({
    name: item.name,
    value: Number(item.conditionalValue) || 0,
    isParent: !item.parentId
  }));
  
  // 計算總和
  const total = allItems.reduce((sum, item) => sum + item.value, 0);
  
  return {
    items: allItems,
    total: parseFloat(total.toFixed(2)), // 取到小數點後兩位
    isValid: Math.abs(total - 100) < 0.01 // 允許 0.01% 的誤差
  };
});

const existingItems = computed(() => {
  // 獲取當前範本中的所有期款項目，排除正在編輯的項目
  return selectedTemplate.value?.items?.filter(i => {
    // 如果是編輯模式，排除當前正在編輯的項目
    if (editingItem.value.id) {
      return i.id !== editingItem.value.id;
    }
    return true;
  }) || [];
});

// 獲取期款類別對應的顏色
const getPaymentCategoryColor = (category) => {
  switch(category) {
    case '一般期款':
      return 'blue-grey';
    case '配套期款':
      return 'deep-purple';
    default:
      return 'orange'; // 自訂類別使用橙色
  }
};

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
    // 編輯模式：判斷是否為自訂類型
    const standardTypes = ['住家', '店面'];
    const currentType = template.propertyType || '住家';
    
    // 如果是標準選項，直接選中；否則選「其他」並填入自訂值
    let dialogType = currentType;
    let customType = '';
    
    if (!standardTypes.includes(currentType)) {
        dialogType = '其他';
        customType = currentType;
    }

    templateDialog.value = { 
      show: true, 
      name: template.templateName, 
      isEditing: true,
      editingTemplateId: template.id, 
      minPrice: template.minPrice || '',
      maxPrice: template.maxPrice || '',
      buyerType: template.buyerType || '非首購',
      paymentCategory: template.paymentCategory || '一般期款',
      // ✅ [新增] 載入物件類型
      propertyType: dialogType,
      customPropertyType: customType
    };
  } else {
    // 新增模式
    templateDialog.value = { 
      show: true, 
      name: '', 
      isEditing: false,
      editingTemplateId: null,
      minPrice: '',
      maxPrice: '',
      buyerType: '非首購',
      paymentCategory: '一般期款',
      // ✅ [新增] 初始化物件類型
      propertyType: '住家',
      customPropertyType: ''
    };
  }
};

// ✅ 3. 修改 handleTemplateSave 函式的新增邏輯
// 開啟複製範本對話框
const copyTemplate = (template) => {
  copyDialog.value = {
    show: true,
    templateName: `${template.templateName} - 複製`,
    sourceTemplate: template
  };
};

// 處理複製確認
const handleCopyConfirm = async () => {
  try {
    if (!copyDialog.value.templateName.trim()) {
      toast.error("請輸入範本名稱");
      return;
    }

    const timestamp = getTimestampString();
    const docId = `${projectId.value}_${copyDialog.value.templateName}_${timestamp}`;

    // 創建新範本對象，包含原範本的所有項目和屬性
    const newTemplate = {
      projectId: projectId.value,
      templateName: copyDialog.value.templateName.trim(),
      items: JSON.parse(JSON.stringify(copyDialog.value.sourceTemplate.items || [])), // 深拷貝項目數組
      minPrice: copyDialog.value.sourceTemplate.minPrice,
      maxPrice: copyDialog.value.sourceTemplate.maxPrice,
      buyerType: copyDialog.value.sourceTemplate.buyerType || '非首購',
      paymentCategory: copyDialog.value.sourceTemplate.paymentCategory || '一般期款',
      // ✅ [新增] 複製物件類型
      propertyType: copyDialog.value.sourceTemplate.propertyType || '住家',
    };
    // 儲存新範本
    await setPaymentTermTemplate(docId, newTemplate);
    toast.success("範本複製成功");
    copyDialog.value.show = false;
  } catch (error) {
    toast.error(`複製範本失敗: ${error.message}`);
  }
};

const handleTemplateSave = async () => {
  const name = templateDialog.value.name.trim();
  if (!name) {
    toast.error("範本名稱不可為空");
    return;
  }

  // 檢查價格區間合法性
  const minPrice = templateDialog.value.minPrice ? Number(templateDialog.value.minPrice) : null;
  const maxPrice = templateDialog.value.maxPrice ? Number(templateDialog.value.maxPrice) : null;
  
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    toast.error("最低價不能大於最高價");
    return;
  }
  
 // ✅ [新增] 處理物件類型邏輯
  let finalPropertyType = templateDialog.value.propertyType;
  
  if (finalPropertyType === '其他') {
      const customVal = templateDialog.value.customPropertyType.trim();
      if (!customVal) {
          toast.error("請輸入自訂物件類型");
          return;
      }
      finalPropertyType = customVal;
  }
  
  const templateData = {
    templateName: name,
    minPrice: minPrice,
    maxPrice: maxPrice,
    buyerType: templateDialog.value.buyerType,
    paymentCategory: templateDialog.value.paymentCategory,
    // ✅ [新增] 寫入物件類型
    propertyType: finalPropertyType,
  };
  
  if (templateDialog.value.isEditing) {
    // 編輯模式 - 使用正在編輯的範本 ID
    await updatePaymentTermTemplate(templateDialog.value.editingTemplateId, templateData);
    toast.success("範本已更新");
  } else {
    // 新增模式
    const timestamp = getTimestampString();
    const docId = `${projectId.value}_${name}_${timestamp}`;

    const newTemplate = {
      projectId: projectId.value,
      ...templateData,
      items: [],
    };
    
    await setPaymentTermTemplate(docId, newTemplate);
    toast.success("已新增範本");
  }
  templateDialog.value.show = false;
};

const confirmDeleteTemplate = async (template) => {
  if (confirm(`您確定要刪除範本「${template.templateName}」嗎？`)) {
    try {
      await deletePaymentTermTemplate(template.id);
      toast.info("範本已刪除");
      // 如果被刪除的是當前選中的範本，則清空選項
      if (selectedTemplateId.value === template.id) {
        selectedTemplateId.value = null;
      }
    } catch(e) {
      toast.error(`刪除失敗: ${e.message}`);
    }
  }
};

// --- 項目 CRUD & 公式編輯器 Methods ---

// 將公式字串解析為 token 陣列
const parseFormulaToTokens = (formula) => {
  if (!formula) return [];
  
  // 先分隔運算符和括號，保持項目名稱的完整性
  const parts = formula.split(/([+\-*/()])/);
  const tokens = [];
  
  parts.forEach(part => {
    part = part.trim();
    if (!part) return;
    
    if (/^[+\-*/()]$/.test(part)) {
      // 運算符和括號
      const color = /^[()]$/.test(part) ? 'indigo' : 'orange'; // 括號用靛藍色，運算符用橙色
      tokens.push({ type: 'operator', value: part, text: part, color: color });
    } else if (part === '總價' || part === '配套金額') {
      // 基本變數
      tokens.push({ type: 'variable', value: part, text: part, color: 'blue' });
    } else if (/^\d+(\.\d+)?$/.test(part)) {
      // 純數字（包含小數）
      tokens.push({ type: 'number', value: part, text: part, color: 'purple' });
    } else {
      // 項目名稱（包含帶序號的名稱）
      tokens.push({ type: 'reference', value: part, text: part, color: 'grey-darken-1' });
    }
  });
  
  return tokens;
};

// 存儲項目展開狀態
const expandedItems = ref(new Set());

// 切換項目展開狀態
const toggleExpand = (itemId) => {
  if (expandedItems.value.has(itemId)) {
    expandedItems.value.delete(itemId);
  } else {
    expandedItems.value.add(itemId);
  }
};

// 檢查項目是否展開
const isExpanded = (itemId) => {
  return expandedItems.value.has(itemId);
};

const openItemDialog = (item, parentId) => {
  if (item) { // 編輯
    editingItem.value = JSON.parse(JSON.stringify(item));
    editingItem.value.isNew = false;
    formulaTokens.value = parseFormulaToTokens(item.formula);
    formulaInput.value = item.formula || ''; // 設置編輯時的公式
  } else { // 新增
    editingItem.value = {
      isNew: true,
      name: '', 
      parentId: parentId || null,
      formula: '', 
      conditionalValue: 0, 
      roundingMethod: '四捨五入', 
      roundingValue: 0
    };
    formulaTokens.value = [];
    formulaInput.value = ''; // 清空公式輸入欄位
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
    if(!newItem.name) {
      toast.error("項目名稱為必填");
      return;
    }
    // 生成隨機id
    newItem.id = Date.now().toString();
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

// 公式編輯器操作
const addToken = (token) => {
  let currentFormula = (formulaInput.value || '').trim();
  
  if (currentFormula) {
    // 檢查是否以運算符結尾
    if (/[+\-*/]$/.test(currentFormula)) {
      // 如果以運算符結尾，直接添加新值
      formulaInput.value = `${currentFormula}${token.value}`;
    } else {
      // 如果不以運算符結尾，添加運算符和新值
      formulaInput.value = `${currentFormula}-${token.value}`;
    }
  } else {
    // 如果公式為空，直接設置新值
    formulaInput.value = token.value;
  }

  // 觸發輸入處理
  handleFormulaInput();
};

const removeToken = (index) => {
  if (index >= 0 && index < formulaTokens.value.length) {
    const tokensArray = [...formulaTokens.value];
    tokensArray.splice(index, 1);
    
    // 重建公式字串
    let newFormula = tokensArray.map(t => t.value).join('');
    
    // 如果需要，修正連續的運算符
    newFormula = newFormula.replace(/[+\-*/]{2,}/g, '-');
    
    formulaInput.value = newFormula;
    handleFormulaInput();
  }
};

const validateFormula = (value) => {
  if (!value) return true;
  
  // 修正連續的運算符
  value = value.replace(/[+\-*/]{2,}/g, '-');
  
  // 基本語法檢查：允許總價、運算符、數字、項目名稱和括號
  const parts = value.split(/([+\-*/()])/);
  
  for (let part of parts) {
    part = part.trim();
    if (!part) continue;
    
    // 如果是運算符或括號，跳過
    if (/^[+\-*/()]$/.test(part)) continue;
    
    // 檢查運算元
    const isValid = 
      part === '總價' || 
      part === '配套金額' ||
      /^\d+(\.\d+)?%?$/.test(part) ||  // 數字（可能帶有百分比）
      /^\d+\.[^+\-*/()]+$/.test(part) ||  // 帶序號的項目名稱
      existingItems.value.some(item => item.name === part); // 一般項目名稱
    
    if (!isValid) {
      return `運算元「${part}」不是有效的值或期款項目名稱`;
    }
  }
  
  // 簡單的括號配對檢查
  const openBrackets = (value.match(/\(/g) || []).length;
  const closeBrackets = (value.match(/\)/g) || []).length;
  if (openBrackets !== closeBrackets) {
    return '括號不配對，請檢查公式';
  }
  
  return true;
};

const handleFormulaInput = () => {
  let value = formulaInput.value.trim();
  if (!value) {
    formulaTokens.value = [];
    return;
  }

  // 修正連續的運算符
  value = value.replace(/[+\-*/]{2,}/g, '-');
  formulaInput.value = value;

  // 使用相同的解析邏輯
  formulaTokens.value = parseFormulaToTokens(value);
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
.template-card {
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.template-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
}

.drag-handle {
  cursor: move;
}

.ml-10 {
  margin-left: 40px;
}

.formula-hint {
  white-space: normal !important;
  overflow-wrap: break-word !important;
  word-break: break-word !important;
  line-height: 1.4;
  min-height: 1.4em;
  padding-top: 4px;
  padding-bottom: 4px;
  background-color: rgba(0,0,0,0.03);
  border-radius: 4px;
  padding: 8px;
}

.list-item-custom {
  min-height: 80px !important;
  height: auto !important;
  align-items: flex-start !important;
}

.rounding-info {
  min-width: 150px;
  background-color: rgba(0,0,0,0.03);
  border-radius: 4px;
  padding: 8px;
}

.gap-2 {
  gap: 8px;
}

.rotate-90 {
  transform: rotate(90deg);
  transition: transform 0.3s ease;
}

/* 手機版特定樣式 */
@media (max-width: 600px) {
  .hidden-mobile {
    display: none !important;
  }
  
  .list-item-custom {
    padding: 12px !important;
  }

  .rounding-info {
    width: 100%;
    margin-top: 8px;
  }
}
</style>