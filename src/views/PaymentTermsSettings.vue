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
          :variant="isActiveTemplate(template.id) ? 'elevated' : 'outlined'"
          :elevation="isActiveTemplate(template.id) ? 8 : 0"
          :class="['template-card', isActiveTemplate(template.id) ? 'template-card--active' : 'template-card--inactive']"
          @click="selectedTemplateId = template.id"
        >
          <!-- 卡片狀態列：編輯中 / 未編輯 -->
          <div v-if="isActiveTemplate(template.id)" class="card-status-bar card-status-bar--active">
            <span class="editing-dot mr-2"></span>
            <v-icon size="14" class="mr-1">mdi-pencil</v-icon>
            正在編輯此範本
          </div>
          <div v-else class="card-status-bar card-status-bar--idle">
            <v-icon size="14" class="mr-1">mdi-file-document-outline</v-icon>
            期款範本
          </div>

          <v-card-item>
            <div>
              <div class="text-h6 mb-2">{{ template.templateName }}</div>
              <div class="d-flex flex-wrap gap-2 mb-1">
                <v-chip size="small" :color="getPaymentCategoryColor(template.paymentCategory)" variant="flat">
                  {{ template.paymentCategory || '一般期款' }}
                </v-chip>

              <v-chip size="small" color="purple-lighten-2" variant="flat">
                  {{ template.propertyType || '住家' }}
                </v-chip>

                <template v-if="template.minPrice || template.maxPrice">
                  <v-chip size="small" color="primary" variant="flat">
                    {{ template.minPrice ? `${template.minPrice}萬` : '0' }} ~ 
                    {{ template.maxPrice ? `${template.maxPrice}萬` : '無上限' }}
                  </v-chip>
                </template>
                <v-chip size="small" :color="template.buyerType === '首購' ? 'success' : 'info'" variant="flat">
                  {{ template.buyerType || '非首購' }}
                </v-chip>
              </div>
              <div class="text-caption text-grey-darken-1">{{ template.items?.length || 0 }} 個期款項目</div>
            </div>
          </v-card-item>

          <v-card-actions>
            <v-chip
              v-if="isActiveTemplate(template.id)"
              size="small"
              color="green-darken-2"
              variant="flat"
              prepend-icon="mdi-check-circle"
            >
              編輯中
            </v-chip>
            <v-btn
              v-else
              size="small"
              variant="tonal"
              color="green-darken-2"
              prepend-icon="mdi-pencil-outline"
              @click.stop="selectedTemplateId = template.id"
            >
              切換編輯
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
      <!-- 編輯區識別標頭：與上方「編輯中」卡片視覺連貫 -->
      <div class="editing-header d-flex align-center flex-wrap mb-4">
        <v-icon class="mr-2" color="green-darken-3">mdi-pencil-box-multiple</v-icon>
        <span class="text-subtitle-1 font-weight-bold mr-3">
          正在編輯：{{ selectedTemplate.templateName }}
        </span>
        <span class="text-caption text-grey-darken-1">以下期款項目的變更會即時儲存至此範本</span>
      </div>

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

      <v-row>
        <!-- 左：期款項目排序清單 -->
        <v-col cols="12" md="5" lg="4">
          <v-card variant="outlined" class="item-list-panel">
            <v-card-title class="d-flex align-center text-subtitle-1 py-2">
              期款項目
              <v-spacer></v-spacer>
              <v-btn size="small" color="primary" prepend-icon="mdi-plus" @click="openItemEditor(null, null)">
                新增母項目
              </v-btn>
            </v-card-title>
            <v-divider></v-divider>
            <div class="text-caption text-grey-darken-1 px-4 py-2 d-flex align-center">
              <v-icon size="14" class="mr-1">mdi-drag-horizontal-variant</v-icon>
              拖曳調整順序，點擊項目進行編輯
            </div>
            <v-divider></v-divider>

            <draggable
              v-model="selectedTemplate.items"
              item-key="id"
              handle=".drag-handle"
              @end="saveTemplate"
            >
              <template #item="{ element: item }">
                <div v-if="!item.parentId">
                  <div
                    :class="['item-row', isEditingItem(item.id) && 'item-row--active']"
                    @click="openItemEditor(item, null)"
                  >
                    <v-icon class="drag-handle" size="18" color="grey">mdi-drag-horizontal-variant</v-icon>
                    <span class="order-badge">{{ parentOrder(item.id) }}</span>
                    <div class="item-row-main">
                      <div class="item-row-name">{{ item.name }}</div>
                      <div v-if="getChildren(item.id).length" class="text-caption text-grey">
                        含 {{ getChildren(item.id).length }} 個子項目
                      </div>
                    </div>
                    <v-chip size="small" color="primary" variant="flat">{{ item.conditionalValue }}%</v-chip>
                    <v-btn
                      icon="mdi-plus"
                      size="x-small"
                      variant="text"
                      title="新增子項目"
                      @click.stop="openItemEditor(null, item.id)"
                    ></v-btn>
                    <v-btn
                      icon="mdi-delete-outline"
                      size="x-small"
                      variant="text"
                      color="error"
                      title="刪除"
                      @click.stop="deleteItem(item.id)"
                    ></v-btn>
                  </div>

                  <draggable
                    v-if="getChildren(item.id).length"
                    :list="getChildren(item.id)"
                    item-key="id"
                    handle=".drag-handle"
                    @end="saveTemplate"
                  >
                    <template #item="{ element: child }">
                      <div
                        :class="['item-row', 'item-row--child', isEditingItem(child.id) && 'item-row--active']"
                        @click="openItemEditor(child, item.id)"
                      >
                        <v-icon class="drag-handle" size="16" color="grey">mdi-drag-horizontal-variant</v-icon>
                        <v-icon size="14" color="grey-lighten-1">mdi-subdirectory-arrow-right</v-icon>
                        <div class="item-row-main">
                          <div class="item-row-name">{{ child.name }}</div>
                        </div>
                        <v-chip size="small" color="primary" variant="outlined">{{ child.conditionalValue }}%</v-chip>
                        <v-btn
                          icon="mdi-delete-outline"
                          size="x-small"
                          variant="text"
                          color="error"
                          title="刪除"
                          @click.stop="deleteItem(child.id)"
                        ></v-btn>
                      </div>
                    </template>
                  </draggable>
                </div>
              </template>
            </draggable>

            <div v-if="!selectedTemplate.items?.length" class="pa-6 text-center text-grey">
              尚未建立期款項目<br>
              <span class="text-caption">點擊上方「新增母項目」開始建立</span>
            </div>
          </v-card>
        </v-col>

        <!-- 右：編輯區（桌機內嵌） -->
        <v-col v-if="mdAndUp" cols="12" md="7" lg="8">
          <div class="editor-sticky">
            <PaymentItemEditor
              v-if="editorVisible"
              :item="editingItem"
              :existing-items="existingItems"
              @save="handleItemSave"
              @cancel="closeEditor"
            />
            <v-card v-else variant="outlined" class="editor-placeholder">
              <div class="text-center text-grey">
                <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-cursor-default-click-outline</v-icon>
                <div>點擊左側期款項目進行編輯</div>
                <div class="text-caption">或點擊「新增母項目」建立新的期款</div>
              </div>
            </v-card>
          </div>
        </v-col>
      </v-row>
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
            :items="['一般期款', '優付期款', '配套期款']"
            variant="outlined"

            class="mt-4"

            clearable
            hint="可選擇預設選項或輸入自訂類別"
            persistent-hint
          ></v-combobox>

          <!-- ✅ [新增] 套用期款時的說明：報價單套用此範本時，會在表格下方顯示這排小字；留空則不顯示 -->
          <v-textarea
            v-model="templateDialog.applyNote"
            label="套用期款時的說明"
            variant="outlined"
            class="mt-4"
            rows="2"
            auto-grow
            clearable
            counter
            placeholder="例如：本期款方式之金額為預估值，實際以簽約合約為準。"
            hint="報價單套用此範本時，會顯示於表格下方；留空則不顯示。"
            persistent-hint
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="templateDialog.show = false">取消</v-btn>
          <v-btn color="primary" text @click="handleTemplateSave">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 手機版：由下往上滑出的全螢幕編輯頁 -->
    <v-dialog
      :model-value="!mdAndUp && editorVisible"
      fullscreen
      transition="dialog-bottom-transition"
      @update:model-value="val => !val && closeEditor()"
    >
      <PaymentItemEditor
        v-if="editingItem"
        :item="editingItem"
        :existing-items="existingItems"
        @save="handleItemSave"
        @cancel="closeEditor"
      />
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

    <v-dialog v-model="duplicateDialog.show" max-width="500px" persistent>
      <v-card class="rounded-lg">
        <v-card-title class="d-flex align-center bg-amber-lighten-5 text-amber-darken-4 py-3">
          <v-icon icon="mdi-alert" class="mr-2"></v-icon>
          重複範本提醒
        </v-card-title>
        
        <v-card-text class="pt-4">
          <p class="text-body-1 mb-4">
            系統檢測到已存在屬性完全相同的範本。
          </p>

          <v-sheet border rounded class="bg-grey-lighten-5 pa-3 mb-4">
            <div class="text-caption text-grey-darken-1 mb-2">已存在的範本資訊：</div>
            <div class="d-flex flex-column gap-2">
               <div class="d-flex align-center">
                <v-icon size="small" color="grey" class="mr-2">mdi-file-document-outline</v-icon>
                <span class="font-weight-bold mr-2">範本名稱：</span>
                <span>{{ duplicateDialog.existingTemplate?.templateName }}</span>
              </div>
              <div class="d-flex align-center">
                <v-icon size="small" color="grey" class="mr-2">mdi-home-city-outline</v-icon>
                <span class="font-weight-bold mr-2">物件類型：</span>
                <v-chip size="small" density="comfortable" class="mr-1">{{ duplicateDialog.existingTemplate?.propertyType }}</v-chip>
              </div>
              
              <div class="d-flex align-center">
                <v-icon size="small" color="grey" class="mr-2">mdi-currency-usd</v-icon>
                <span class="font-weight-bold mr-2">總價區間：</span>
                <span>
                  {{ duplicateDialog.existingTemplate?.minPrice ? `${duplicateDialog.existingTemplate?.minPrice}萬` : '0' }} ~ 
                  {{ duplicateDialog.existingTemplate?.maxPrice ? `${duplicateDialog.existingTemplate?.maxPrice}萬` : '無上限' }}
                </span>
              </div>

              <div class="d-flex align-center">
                <v-icon size="small" color="grey" class="mr-2">mdi-account-outline</v-icon>
                <span class="font-weight-bold mr-2">買家類型：</span>
                <v-chip size="small" density="comfortable" :color="duplicateDialog.existingTemplate?.buyerType === '首購' ? 'success' : 'info'" variant="flat" class="mr-1">
                  {{ duplicateDialog.existingTemplate?.buyerType }}
                </v-chip>
              </div>
              <div class="d-flex align-center">
                <v-icon size="small" color="grey" class="mr-2">mdi-tag-outline</v-icon>
                <span class="font-weight-bold mr-2">期款類別：</span>
                <v-chip size="small" density="comfortable" :color="getPaymentCategoryColor(duplicateDialog.existingTemplate?.paymentCategory)" variant="flat">
                  {{ duplicateDialog.existingTemplate?.paymentCategory }}
                </v-chip>
              </div>
            </div>
          </v-sheet>

          <p class="text-body-2 text-grey-darken-2">
            建議您確認是否需要建立重複設定？若您是為了區分不同總價區間，請點擊「確認建立」。
          </p>
        </v-card-text>

        <v-card-actions class="pb-4 px-4">
          <v-spacer></v-spacer>
          <v-btn
            variant="outlined"
            color="grey-darken-1"
            @click="duplicateDialog.show = false"
          >
            取消
          </v-btn>
          <v-btn
            color="amber-darken-4"
            variant="flat"
            class="px-4"
            @click="handleDuplicateConfirm"
          >
            確認建立
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
import { useDisplay } from 'vuetify';
import draggable from 'vuedraggable';
import PaymentItemEditor from '@/components/PaymentItemEditor.vue';
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
  customPropertyType: '',
  // ✅ [新增] 套用期款時的說明
  applyNote: ''
});

// ✅ [新增] 重複檢查 Dialog State
const duplicateDialog = ref({
  show: false,
  existingTemplate: null, // 查到的重複範本
  pendingData: null       // 準備要儲存的資料
});

// --- 複製範本 Dialog State ---
const copyDialog = ref({
  show: false,
  templateName: '',
  sourceTemplate: null
});

// --- 項目編輯區 State ---
// 桌機顯示於右側面板；手機以全螢幕 dialog 呈現
const { mdAndUp } = useDisplay();
const editorVisible = ref(false);
const editingItem = ref(null);

// 判斷卡片是否為目前編輯中的範本
const isActiveTemplate = (templateId) => selectedTemplateId.value === templateId;

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
    if (editingItem.value?.id) {
      return i.id !== editingItem.value.id;
    }
    return true;
  }) || [];
});

// 母項目在清單中的順序（1 起算）
const parentOrder = (itemId) => {
  const parents = selectedTemplate.value?.items?.filter(i => !i.parentId) || [];
  return parents.findIndex(i => i.id === itemId) + 1;
};

// 該項目是否正在右側編輯區編輯中
const isEditingItem = (itemId) => editorVisible.value && editingItem.value?.id === itemId;

// 獲取期款類別對應的顏色
const getPaymentCategoryColor = (category) => {
  switch(category) {
    case '一般期款':
      return 'blue-grey';
    case '配套期款':
      return 'deep-purple';
   
    case '優付期款':
      return 'cyan-darken-1'; 
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
      customPropertyType: customType,
      // ✅ [新增] 載入套用期款時的說明
      applyNote: template.applyNote || ''
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
      customPropertyType: '',
      // ✅ [新增] 初始化套用期款時的說明
      applyNote: ''
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
      // ✅ [新增] 複製套用期款時的說明
      applyNote: copyDialog.value.sourceTemplate.applyNote || '',
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
  
  // 處理物件類型邏輯
  let finalPropertyType = templateDialog.value.propertyType;
  if (finalPropertyType === '其他') {
      const customVal = templateDialog.value.customPropertyType.trim();
      if (!customVal) {
          toast.error("請輸入自訂物件類型");
          return;
      }
      finalPropertyType = customVal;
  }
  
  // 準備要儲存的資料物件
  const templateData = {
    templateName: name,
    minPrice: minPrice,
    maxPrice: maxPrice,
    buyerType: templateDialog.value.buyerType,
    paymentCategory: templateDialog.value.paymentCategory,
    propertyType: finalPropertyType,
    // ✅ [新增] 套用期款時的說明（trim 後存；空字串代表不顯示）
    applyNote: (templateDialog.value.applyNote || '').trim(),
  };

  // ✅ [新增] 重複檢查邏輯
  const checkPropertyType = finalPropertyType;
  const checkBuyerType = templateDialog.value.buyerType;
  const checkPaymentCategory = templateDialog.value.paymentCategory;

  const duplicateTemplate = templates.value.find(t => {
    // 編輯模式排除自己
    if (templateDialog.value.isEditing && t.id === templateDialog.value.editingTemplateId) {
      return false;
    }
    // 比對三個關鍵欄位
    return t.propertyType === checkPropertyType &&
           t.buyerType === checkBuyerType &&
           t.paymentCategory === checkPaymentCategory;
  });

  if (duplicateTemplate) {
    // 發現重複，開啟 Dialog
    duplicateDialog.value = {
      show: true,
      existingTemplate: duplicateTemplate,
      pendingData: templateData
    };
  } else {
    // 無重複，直接儲存
    await executeTemplateSave(templateData);
  }
};

// ✅ [新增] 執行實際儲存的函式 (從 handleTemplateSave 拆分出來)
const executeTemplateSave = async (templateData) => {
  try {
    if (templateDialog.value.isEditing) {
      // 編輯模式
      await updatePaymentTermTemplate(templateDialog.value.editingTemplateId, templateData);
      toast.success("範本已更新");
    } else {
      // 新增模式
      const timestamp = getTimestampString();
      const docId = `${projectId.value}_${templateData.templateName}_${timestamp}`;

      const newTemplate = {
        projectId: projectId.value,
        ...templateData,
        items: [],
      };
      
      await setPaymentTermTemplate(docId, newTemplate);
      toast.success("已新增範本");
    }
    
    // 關閉所有相關視窗
    templateDialog.value.show = false;
    duplicateDialog.value.show = false;
    
  } catch (error) {
    console.error(error);
    toast.error("儲存失敗");
  }
};

// ✅ [新增] Dialog 確認按鈕的處理函式
const handleDuplicateConfirm = async () => {
  if (duplicateDialog.value.pendingData) {
    await executeTemplateSave(duplicateDialog.value.pendingData);
  }
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

// --- 項目 CRUD Methods ---

// 開啟編輯區：傳給編輯器的是深拷貝副本，編輯過程不影響左側清單
const openItemEditor = (item, parentId) => {
  if (item) { // 編輯
    editingItem.value = { ...JSON.parse(JSON.stringify(item)), isNew: false };
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
  }
  editorVisible.value = true;
};

const closeEditor = () => {
  editorVisible.value = false;
  editingItem.value = null;
};

// 接收編輯器回傳的資料並寫回範本
const handleItemSave = async (itemData) => {
  const currentItems = selectedTemplate.value.items || [];
  if (itemData.isNew) {
    // 新增
    const newItem = { ...itemData };
    delete newItem.isNew;
    // 生成隨機id
    newItem.id = Date.now().toString();
    currentItems.push(newItem);
  } else {
    // 編輯
    const index = currentItems.findIndex(i => i.id === itemData.id);
    if (index !== -1) {
      currentItems[index] = { ...itemData };
      delete currentItems[index].isNew;
    }
  }
  selectedTemplate.value.items = currentItems;
  await saveTemplate();
  closeEditor();
};

const deleteItem = async (itemId) => {
  if (confirm("確定要刪除這個項目及其所有子項目嗎？")) {
    const itemsToDelete = [itemId];
    const children = getChildren(itemId);
    children.forEach(c => itemsToDelete.push(c.id));

    selectedTemplate.value.items = selectedTemplate.value.items.filter(i => !itemsToDelete.includes(i.id));
    // 若刪除的是編輯中的項目，一併關閉編輯區
    if (editingItem.value && itemsToDelete.includes(editingItem.value.id)) {
      closeEditor();
    }
    await saveTemplate();
  }
};

// 切換範本時關閉編輯區，避免編輯到錯誤範本的項目
watch(selectedTemplateId, () => {
  closeEditor();
});

const saveTemplate = async () => {
  try {
    await updatePaymentTermTemplate(selectedTemplate.value.id, { items: selectedTemplate.value.items });
    toast.success("範本已儲存");
  } catch(e) {
    toast.error("儲存失敗：" + e.message);
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
.template-card {
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  overflow: hidden;
}

/* 編輯中：綠色粗邊框 + 陰影強化 */
.template-card--active {
  border: 2px solid #2E7D32;
  box-shadow: 0 4px 16px rgba(46, 125, 50, 0.25) !important;
}

/* 未編輯：降低不透明度與彩度弱化，hover 時恢復 */
.template-card--inactive {
  opacity: 0.6;
  filter: grayscale(0.35);
}

.template-card--inactive:hover {
  opacity: 1;
  filter: none;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
}

/* 卡片頂部狀態列 */
.card-status-bar {
  display: flex;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
  padding: 5px 14px;
}

.card-status-bar--active {
  background: linear-gradient(90deg, #1B5E20, #43A047);
  color: #fff;
}

.card-status-bar--idle {
  background: rgba(0,0,0,0.04);
  color: rgba(0,0,0,0.45);
}

/* 編輯中呼吸燈 */
.editing-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #B9F6CA;
  flex-shrink: 0;
  animation: editing-pulse 1.4s ease-in-out infinite;
}

@keyframes editing-pulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(185, 246, 202, 0.6);
  }
  50% {
    opacity: 0.6;
    box-shadow: 0 0 0 5px rgba(185, 246, 202, 0);
  }
}

/* 下方編輯區識別標頭 */
.editing-header {
  background: rgba(46, 125, 50, 0.08);
  border-left: 4px solid #2E7D32;
  border-radius: 4px;
  padding: 10px 16px;
  color: #1B5E20;
}

.drag-handle {
  cursor: move;
}

.gap-2 {
  gap: 8px;
}

/* --- 左側期款項目清單 --- */
.item-list-panel {
  overflow: hidden;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  transition: background 0.15s ease;
}

.item-row:hover {
  background: rgba(0, 0, 0, 0.03);
}

/* 正在右側編輯的項目：綠底 + 左側綠條 */
.item-row--active {
  background: rgba(46, 125, 50, 0.10);
  border-left: 3px solid #2E7D32;
  padding-left: 9px;
}

.item-row--active:hover {
  background: rgba(46, 125, 50, 0.14);
}

.item-row--child {
  padding-left: 36px;
  background: rgba(0, 0, 0, 0.015);
}

.item-row--child.item-row--active {
  padding-left: 33px;
  background: rgba(46, 125, 50, 0.10);
}

.order-badge {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #E8F5E9;
  color: #2E7D32;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-row-main {
  flex: 1;
  min-width: 0;
}

.item-row-name {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* --- 右側編輯區（桌機） --- */
.editor-sticky {
  position: sticky;
  top: 16px;
}

.editor-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  border-style: dashed;
}
</style>