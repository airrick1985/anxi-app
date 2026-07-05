<template>
  <v-container fluid>
    <v-overlay 
      :model-value="isGeneratingPdf" 
      class="align-center justify-center blur-background" 
      persistent
    >
      <div class="d-flex flex-column align-center">
        <v-progress-circular 
          indeterminate 
          size="64" 
          color="#008CFF"  
          class="mb-4"
        ></v-progress-circular>
        <p class="text-h6 text-black">正在產生報價單，請稍候...</p>
      </div>
    </v-overlay>

   <div class="page-header d-flex align-center">
  <!-- 從「列印報價」(?pick=1) 進入時不提供返回（避免回到報價系統銷控模式） -->
  <v-btn v-if="!isPickEntry" variant="outlined" @click="goBack" class="mr-4">返回銷控</v-btn>

  <div class="title-block">
    <h1 class="text-h5 text-md-h4 font-weight-bold text-primary d-flex align-center">
      <v-icon color="primary" class="mr-2">mdi-file-document-edit-outline</v-icon>
      報價單設定
    </h1>
    <v-menu location="bottom start">
      <template #activator="{ props }">
        <v-chip
          v-bind="props"
          class="mt-2 project-chip"
          color="primary"
          variant="flat"
          size="large"
          label
          link
        >
          <v-icon start>mdi-office-building-marker</v-icon>
          建案：{{ projectName }}
          <v-icon end>mdi-chevron-down</v-icon>
        </v-chip>
      </template>
      <v-list density="comfortable" class="project-switch-list" max-height="60vh">
        <v-list-subheader>切換建案</v-list-subheader>
        <v-list-item
          v-for="p in authorizedProjects"
          :key="p.id"
          :active="p.id === projectId"
          :disabled="p.id === projectId"
          @click="switchProject(p)"
        >
          <template #prepend>
            <v-icon :color="p.id === projectId ? 'primary' : undefined">
              {{ p.id === projectId ? 'mdi-check-circle' : 'mdi-office-building-outline' }}
            </v-icon>
          </template>
          <v-list-item-title>{{ p.name }}</v-list-item-title>
        </v-list-item>
        <v-list-item v-if="authorizedProjects.length === 0" disabled>
          <v-list-item-title class="text-grey">無可切換的建案</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>

  <v-spacer></v-spacer>

  <!-- ✅ [新增] 報價單備註編輯器：僅銷控管理權限人員可見 -->
  <v-btn
    v-if="canEditQuoteRemark"
    color="blue-grey-darken-2"
    variant="tonal"
    prepend-icon="mdi-note-edit-outline"
    class="mr-4"
    @click="isRemarkEditorVisible = true"
  >報價單備註</v-btn>

  <v-btn
    color="primary"
    variant="tonal"
    prepend-icon="mdi-home-plus"
    class="mr-4"
    @click="openUnitPicker"
  >新增戶別</v-btn>

  <v-btn
    v-if="quoteStore.items.length > 0"
    color="error"
    variant="tonal"
    prepend-icon="mdi-delete-sweep"
    class="mr-4"
    @click="confirmClearDialog = true"
  >移除全部戶別</v-btn>

<v-tooltip text="活動訊息" location="bottom">
  <template v-slot:activator="{ props }">
    <v-btn
      v-bind="props"
      icon="mdi-bullhorn-outline"
      color="red"
      variant="tonal"
      class="mr-4"
      @click="handleOpenActivityMessage"
    >
    </v-btn>
  </template>
</v-tooltip>
</div>

      <v-dialog
      v-model="isQuoteEditorDialogVisible"
      fullscreen
      persistent
      transition="dialog-bottom-transition"
    >
     <PrintQuotation
        v-if="isQuoteEditorDialogVisible" 
        @close="isQuoteEditorDialogVisible = false"
        :project-name="projectName" :project-id="projectId" :personnel="selectedPersonnel"
      />
    </v-dialog>

      <v-spacer></v-spacer>
     



    <v-card class="mt-4">
      <v-card-text>
        <div v-if="quoteStore.items.length === 0" class="text-center py-10">
          <p>報價單中沒有任何戶別。</p>
          <v-btn
            v-if="isPickEntry"
            color="primary"
            class="mt-4"
            prepend-icon="mdi-home-plus"
            @click="openUnitPicker"
          >新增戶別</v-btn>
          <v-btn v-else color="primary" class="mt-4" @click="goBack">返回銷控表</v-btn>
        </div>
        <div v-else class="quote-list">
          <div class="quote-item-header d-none d-md-flex">
            <div class="item-cell flex-1">戶別</div>
            <div class="item-cell flex-1">物件類型</div>
            <div class="item-cell flex-1">面積(坪)</div>
            <div class="item-cell flex-1">房屋總價</div>
            <div class="item-cell flex-1">房屋單價</div>
            <div class="item-cell flex-2">車位</div>
            <div class="item-cell flex-1">車位價格</div>
            <div class="item-cell flex-1">首購</div>
            
            <div class="item-cell flex-1" v-if="showPreferredPaymentOption">優付</div>

            <div class="item-cell flex-1">總價</div>
            <template v-if="showPackageDealColumns">
              <div class="item-cell flex-1">配套</div>
              <div class="item-cell flex-1">配套價</div>
            </template>
            <div class="item-cell flex-1">付款方式</div>
            <div class="item-cell flex-shrink-0" style="width: 50px;"></div>
          </div>
          <v-card v-for="item in quoteStore.items" :key="item.internalId" class="quote-item-card">
          <QuoteItem 
              :item="item"
              :payment-terms-data="paymentTermsData"
              :package-terms-data="packageTermsData"
              :payment-templates="paymentTemplates"
              :show-package-deal="showPackageDealColumns"
              :is-loading="loading"
              :all-parking-data="parkingStore.parkingData || []"
              :project-id="projectId" 
              @remove="quoteStore.removeItem(item.internalId)"
              
            />
          </v-card>
        </div>
      </v-card-text>
    </v-card>
    
    <v-card class="mt-4" v-if="quoteStore.items.length > 0">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="2">
          <v-select 
                  variant="outlined" 
                  label="報價人員" 
                  :items="personnelOptions" 
                  v-model="selectedPersonnel" 
                  :readonly="!canEditPersonnel" 
                  item-title="name" 
                  return-object
                  :loading="loading"  ></v-select>
          </v-col>

          <v-col cols="12" md="2">
              <v-text-field 
                  variant="outlined" 
                  label="聯絡電話" 
                  :model-value="personnelPhone" 
                  readonly
                  :loading="loading"  ></v-text-field>
          </v-col>
          <v-col cols="12" md="8" class="text-right">
          <!-- ✅ [新增] 列印報價單(含期款)：勾選戶別後每戶產生一頁 A4 報價單 -->
          <v-btn
          color="teal-darken-1"
          size="x-large"
          class="mr-3 mb-2 mb-md-0"
          @click="isQuotePrintDialogVisible = true" prepend-icon="mdi-printer-outline"
        >
          列印報價單(含期款) </v-btn>
          <v-btn
          color="green"
          size="x-large"

          @click="openQuoteEditor" prepend-icon="mdi-printer"
        >
          列印報價單 </v-btn>

          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    


    <v-dialog v-model="isSlideDialogVisible" fullscreen hide-overlay transition="dialog-bottom-transition">
      <v-card class="d-flex flex-column">
        <v-toolbar dark color="primary" density="compact">
          <v-btn icon dark @click="isSlideDialogVisible = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>車位表</v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>

        <div class="flex-grow-1" style="position: relative;">
          <v-overlay
            :model-value="isLoadingSlide"
            class="align-center justify-center"
            persistent
            scrim="rgba(0, 0, 0, 0.6)"
          >
            <div class="text-center">
              <v-progress-circular
                indeterminate
                color="#008CFF"
                size="64"
              ></v-progress-circular>
              <p class="mt-4 text-body-1 text-black">正在載入最新車位表...</p>
            </div>
          </v-overlay>

          <div v-if="isContentLoaded" class="fill-height">
            <iframe
              v-if="slideEmbedUrl"
              :src="slideEmbedUrl"
              frameborder="0"
              width="100%"
              height="100%"
              allowfullscreen="true"
              style="display: block;"
            ></iframe>
            <div v-else class="d-flex flex-column justify-center align-center fill-height">
              <v-icon size="80" color="grey-lighten-1">mdi-alert-circle-outline</v-icon>
              <p class="mt-4 text-h6 text-grey">無法載入車位表</p>
              <p class="text-body-1 text-grey">點擊左上角關閉按鈕，或手動重新整理。</p>
            </div>
          </div>
        </div>
      </v-card>
    </v-dialog>
    
    <!-- 活動訊息彈窗 (圖檔燈箱版) -->
    <ActivityMessageViewer
      v-model="isActivityDialogVisible"
      :project-id="projectId"
      :project-name="projectName"
      :can-upload="canUploadActivityMessage"
    />

    <!-- ✅ [新增] 列印報價單(含期款)：勾選戶別 → 每戶一頁 A4 報價單 -->
    <QuotePrintDialog
      v-model="isQuotePrintDialogVisible"
      :project-id="projectId"
      :project-name="projectName"
      :personnel-name="selectedPersonnel?.name || ''"
      :personnel-phone="personnelPhone"
    />

    <!-- ✅ [新增] 報價單備註富文本編輯器（銷控管理權限） -->
    <QuoteRemarkEditorDialog
      v-model="isRemarkEditorVisible"
      :project-id="projectId"
    />

    <v-dialog v-model="pdfResultDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span>報價單產出成功</span>
          <v-btn icon="mdi-close" variant="text" @click="pdfResultDialog = false"></v-btn>
        </v-card-title>
        <v-card-text class="text-center">
          <p class="mb-4">您可以點擊下方連結查看，或使用手機掃描QR Code。</p>
          <v-btn :href="generatedPdfUrl" target="_blank" color="primary" class="mb-4" prepend-icon="mdi-open-in-new">
            開啟報價單
          </v-btn>
          <div class="d-flex justify-center qr-code-container">
              <qrcode-vue :value="generatedPdfUrl" :size="200" level="H" />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="pdfResultDialog = false">關閉</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- 新增：期款範本選擇對話框 -->
    <v-dialog v-model="templateSelectionDialog" persistent max-width="700px">
      <v-card>
        <v-card-title class="bg-primary text-white d-flex align-center">
          <v-icon start>mdi-format-list-bulleted</v-icon>
          選擇期款範本
        </v-card-title>
        
        <v-card-text class="pt-4">
          <div v-if="currentQuoteItem">
            <v-alert type="info" class="mb-4">
              <div class="font-weight-medium">
                <strong>{{ currentQuoteItem.unitId }}</strong> 有多個適用的期款範本，請選擇一個：
              </div>
              <div class="text-caption mt-1">
                總價：{{ quoteStore.getFinalTotalPrice(currentQuoteItem.internalId).toLocaleString() }}萬 | 
                {{ currentQuoteItem.isFirstTimeBuyer === '是' ? '首購' : '非首購' }}
              </div>
            </v-alert>
            
            <v-radio-group v-model="selectedTemplateId" mandatory class="mt-4">
              <v-radio
                v-for="template in availableTemplates"
                :key="template.id"
                :value="template.id"
                class="mb-3"
              >
                <template v-slot:label>
                  <div class="ml-2">
                    <div class="font-weight-medium text-h6">{{ template.templateName }}</div>
                    <div class="text-caption text-grey-darken-1 mt-1">
                      <v-chip size="small" color="blue" variant="outlined" class="mr-2">
                        {{ template.minPrice.toLocaleString() }}~{{ template.maxPrice.toLocaleString() }}萬
                      </v-chip>
                      <v-chip size="small" color="green" variant="outlined" class="mr-2">
                        {{ template.buyerType }}
                      </v-chip>
                      <v-chip size="small" color="orange" variant="outlined">
                        {{ template.paymentCategory }}
                      </v-chip>
                    </div>
                    <div class="text-caption text-grey mt-1">
                      包含 {{ template.items?.length || 0 }} 個期款項目
                    </div>
                  </div>
                </template>
              </v-radio>
            </v-radio-group>
          </div>
        </v-card-text>
        
        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="cancelTemplateSelection">
            取消
          </v-btn>
          <v-btn 
            color="primary" 
            variant="flat"
            @click="confirmTemplateSelection"
            :disabled="!selectedTemplateId"
          >
            確認選擇
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 走「列印報價」進入時的戶別選擇彈窗（也供報價設定內「新增戶別」重複開啟） -->
    <QuoteUnitPickerDialog
      v-model="unitPickerVisible"
      :units="pickerUnits"
      @confirm="onPickerConfirm"
      @cancel="onPickerCancel"
    />

    <!-- 移除全部戶別 確認 -->
    <v-dialog v-model="confirmClearDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon start color="error">mdi-delete-sweep</v-icon>
          移除全部戶別
        </v-card-title>
        <v-card-text>確定要移除報價單中的全部戶別嗎？此動作無法復原。</v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="confirmClearDialog = false">取消</v-btn>
          <v-btn color="error" variant="flat" @click="removeAllUnits">確定移除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, defineAsyncComponent } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuoteStore } from '@/store/quoteStore';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
import { useParkingStore } from '@/store/parkingStore';
import { useAdminStore } from '@/store/adminStore'; // 1. 引入 adminStore
import {
  generateQuotePdf,
  fetchSalesControlData,
  fetchQuotePersonnelList,
  fetchSalesPersonnelList, // 新增 Firestore 版本
  fetchPaymentTermTemplates, // 新增：期款範本 API
  selectApplicableTemplates, // 新增：範本選擇邏輯
} from '@/api';
import { useSlideViewer } from '@/composables/useSlideViewer';
import QrcodeVue from 'qrcode.vue';
import QuoteItem from '@/components/QuoteItem.vue';
// 改為 async 載入：PrintQuotation 帶入 fabric/jspdf 等大型套件，僅在使用者點「列印報價單」時才下載
const PrintQuotation = defineAsyncComponent(() => import('@/views/PrintQuotation.vue'));
import ActivityMessageViewer from '@/components/ActivityMessageViewer.vue';
import QuoteUnitPickerDialog from '@/components/QuoteUnitPickerDialog.vue';
import QuotePrintDialog from '@/components/QuotePrintDialog.vue';
import QuoteRemarkEditorDialog from '@/components/QuoteRemarkEditorDialog.vue';
import { useSalesDataStore } from '@/store/salesDataStore';

const route = useRoute();
const router = useRouter();
const quoteStore = useQuoteStore();
const userStore = useUserStore();
const projectStore = useProjectStore();
const parkingStore = useParkingStore();
const adminStore = useAdminStore();
const salesDataStore = useSalesDataStore();

onUnmounted(() => {
    parkingStore.cleanup();
});

const { 
  isSlideDialogVisible,
  slideEmbedUrl,
  openSlideViewer,
  isLoadingSlide,
  isContentLoaded
} = useSlideViewer();

const loading = ref(true);
const error = ref(null);
const projectId = computed(() => route.params.projectName);
const projectName = computed(() => {
  if (!projectStore.idToNameMap || !projectId.value) {
    return '載入中...';
  }
  return projectStore.idToNameMap[projectId.value] || '載入中...';
});

// 是否由「列印報價」入口進入（?pick=1）→ 不提供返回功能
const isPickEntry = computed(() => route.query.pick === '1');
const confirmClearDialog = ref(false);

// 可切換的建案：使用者於「報價系統」有權限的建案（供標題切換建案，免回入口頁）
const authorizedProjects = computed(() =>
  (projectStore.projectsList || []).filter(p =>
    userStore.hasProjectPermission('報價系統', p.name)
  )
);

const personnelOptions = ref([]);
const canEditPersonnel = ref(false);
const selectedPersonnel = ref(null);
const quoteParkingSlideId = ref('');
const paymentTermsData = ref([]); // 保留向後相容性
const packageTermsData = ref([]); 
const isGeneratingPdf = ref(false);
const pdfResultDialog = ref(false);
const generatedPdfUrl = ref('');
const isQuoteEditorDialogVisible = ref(false);

// ✅ [新增] 走「列印報價」(?pick=1) 進入時的戶別選擇彈窗
const unitPickerVisible = ref(false);
const pickerUnits = ref([]);

// --- 新增：期款範本選擇相關狀態 ---
const paymentTemplates = ref([]); // 存放所有期款範本
const templateSelectionDialog = ref(false); // 範本選擇對話框
const availableTemplates = ref([]); // 符合條件的範本列表
const selectedTemplateId = ref(''); // 使用者選擇的範本ID
const currentQuoteItem = ref(null); // 目前處理的報價項目

// --- 活動訊息相關狀態 ---
const isActivityDialogVisible = ref(false);

// ✅ [新增] 列印報價單(含期款) 對話框
const isQuotePrintDialogVisible = ref(false);

// ✅ [新增] 報價單備註編輯器對話框
const isRemarkEditorVisible = ref(false);

// ✅ [新增] 報價單備註編輯權限：系統/超級管理員或具該案「銷控系統」權限（與活動訊息管理相同標準）
const canEditQuoteRemark = computed(() => {
  const roles = userStore.user?.roles || [];
  if (roles.includes('超級管理員') || roles.includes('系統管理員')) return true;
  return userStore.hasProjectPermission('銷控系統', projectName.value);
});

const canUploadActivityMessage = computed(() => {
  const roles = userStore.user?.roles || [];
  if (roles.includes('超級管理員') || roles.includes('系統管理員')) return true;
  return userStore.hasProjectPermission('銷控系統', projectName.value);
});

// ✅ [新增] 判斷是否顯示優付欄位 (與 PaymentSettings.vue 邏輯一致)
const showPreferredPaymentOption = computed(() => {
    return projectStore.currentProject?.showPreferredPaymentInQuote === true;
});

// --- 計算引擎 (維持不變) ---
function applyRounding(value, method, precisionSpec) {
    const precision = String(precisionSpec).includes('.') ? String(precisionSpec).split('.')[1].length : 0;
    if (!method) return Number(value.toFixed(precision));
    const multiplier = Math.pow(10, precision);
    let roundedValue;
    switch (method) {
          case '無條件進位': roundedValue = Math.ceil(value * multiplier) / multiplier; break;
          case '四捨五入': roundedValue = Math.round(value * multiplier) / multiplier; break;
          case '無條件捨去': roundedValue = Math.floor(value * multiplier) / multiplier; break;
          default: roundedValue = value;
    }
    return Number(roundedValue.toFixed(precision));
}
function parseFormula(formula, context) {
    let expression = String(formula);
    expression = expression.replace(/(\d+(\.\d+)?)%/g, (match, number) => `(${number}/100)`);
    expression = expression.replace(new RegExp(context.priceKeyword, 'g'), context.priceValue);
    if (expression.includes('條件設定值')) {
       expression = expression.replace(/條件設定值/g, context.currentTermValue);
    }
    const references = expression.match(/[A-Z]/g) || [];
    for (const refId of references) {
       if (context.results[refId] === undefined) {
          throw new Error(`公式無法計算，因為參照的項目 '${refId}' 尚未被計算。`);
       }
       expression = expression.replace(new RegExp(refId, 'g'), context.results[refId]);
    }
    try {
       return new Function(`return ${expression}`)();
    } catch (e) {
       throw new Error(`公式錯誤 "${formula}" -> 最終表達式 "${expression}": ${e.message}`);
    }
}
function runCalculationEngine(terms, priceValue, priceKeyword, conditionContext = null) {
    const results = {};
    if (!terms || terms.length === 0) return results;
    const pendingTerms = new Map(terms.map(t => [t['編號'], t]));
    let calculationMadeInLoop = true;
    let loops = 0;
    while (pendingTerms.size > 0 && calculationMadeInLoop && loops < terms.length + 5) {
       calculationMadeInLoop = false;
       loops++;
       pendingTerms.forEach((term, id) => {
          if (!term['計算方式']) return;
          try {
             let currentTermValue = 0;
             if (conditionContext && term[conditionContext.conditionCol]) {
                currentTermValue = parseFloat(term[conditionContext.conditionCol]) || 0;
             }
             const context = { priceValue, priceKeyword, currentTermValue, results };
             const amount = parseFormula(term['計算方式'], context);
             results[id] = applyRounding(amount, term['進位方式'], term['進位值']);
             pendingTerms.delete(id);
             calculationMadeInLoop = true;
          } catch (e) {
         // Silent catch
          }
       });
    }
    if (pendingTerms.size > 0) {
       const unresolvedIds = Array.from(pendingTerms.keys()).join(', ');
       throw new Error(`項目 ${unresolvedIds} 可能存在循環依賴或公式錯誤。`);
    }
    return results;
}

// --- 新增：適用於新資料格式的計算引擎 ---

// 新的計算引擎，適用於 Firestore 期款範本格式
function runNewCalculationEngine(templateItems, totalPrice) {
    const results = {};
    const calculations = {};
    
    // 第一步：設定基本變數
    calculations['總價'] = totalPrice;
    calculations['配套金額'] = 0; // 如果需要配套金額變數
    
    // 第二步：處理所有項目（按依賴順序）
    const processedItems = new Set();
    let maxIterations = templateItems.length * 3; // 防止無限循環
    
    while (processedItems.size < templateItems.length && maxIterations > 0) {
        maxIterations--;
        
        for (const item of templateItems) {
            if (processedItems.has(item.id)) continue;
            
            try {
                // 嘗試計算這個項目
                const result = evaluateFormula(item.formula, calculations);
                
                // 應用四捨五入規則
                const roundedResult = applyNewRounding(
                    result, 
                    item.roundingMethod, 
                    item.roundingValue
                );
                
                calculations[item.name] = roundedResult;
                results[item.id] = {
                    name: item.name,
                    value: roundedResult,
                    formula: item.formula,
                    parentId: item.parentId
                };
                
                processedItems.add(item.id);
                
            } catch (error) {
                // 如果計算失敗，可能是因為依賴項目還未計算
                // 在下一輪迭代中再試
                continue;
            }
        }
    }
    
    // 檢查是否還有未處理的項目
    if (processedItems.size < templateItems.length) {
        const unprocessed = templateItems
            .filter(item => !processedItems.has(item.id))
            .map(item => item.name)
            .join(', ');
        throw new Error(`無法計算期款項目: ${unprocessed}。可能存在循環依賴或公式錯誤。`);
    }
    
    return results;
}

// 公式計算函數
function evaluateFormula(formula, variables) {
    let expression = String(formula);
    
    console.log(`[DEBUG] 開始計算公式: ${formula}`);
    console.log(`[DEBUG] 可用變數:`, variables);
    
    // 按變數名稱長度排序（長的先替換，避免部分匹配問題）
    const sortedVars = Object.entries(variables).sort((a, b) => b[0].length - a[0].length);
    
    // 替換變數
    for (const [varName, value] of sortedVars) {
        if (typeof value === 'number' && !isNaN(value)) {
            // 使用全域替換，但要確保變數名稱的完整匹配
            const escapedVarName = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escapedVarName}\\b`, 'g');
            expression = expression.replace(regex, value.toString());
        }
    }
    
    console.log(`[DEBUG] 變數替換後: ${expression}`);
    
    // 處理百分比（5% -> 0.05）
    expression = expression.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
    
    console.log(`[DEBUG] 百分比處理後: ${expression}`);
    
    // 驗證表達式只包含安全字符
    if (!/^[0-9+\-*/.() ]+$/.test(expression)) {
        console.warn(`[DEBUG] 表達式包含非安全字符: ${expression}`);
        throw new Error(`公式包含不支援的字符: ${expression}`);
    }
    
    try {
        const result = Function('"use strict"; return (' + expression + ')')();
        console.log(`[DEBUG] 計算結果: ${result}`);
        
        if (typeof result !== 'number' || isNaN(result)) {
            throw new Error('計算結果不是有效數字');
        }
        
        return result;
    } catch (error) {
        console.error(`[DEBUG] 計算錯誤:`, error);
        throw new Error(`公式計算錯誤: "${formula}" -> "${expression}": ${error.message}`);
    }
}

// 四捨五入規則應用（新版本）
function applyNewRounding(value, method, roundingValue = 1) {
    const divisor = roundingValue || 1;
    
    switch (method) {
        case '四捨五入':
            return Math.round(value / divisor) * divisor;
        case '無條件進位':
            return Math.ceil(value / divisor) * divisor;
        case '無條件捨去':
            return Math.floor(value / divisor) * divisor;
        default:
            return Math.round(value); // 預設四捨五入到整數
    }
}





// --- 其他所有函式 ---


// --- 處理活動訊息點擊事件 ---
function handleOpenActivityMessage() {
  isActivityDialogVisible.value = true;
}

const showPackageDealColumns = computed(() => {
    if (quoteStore.items.length === 0) return false;
    return quoteStore.items.some(item => item.unitDetails && item.unitDetails.price_package_deal);
});
const personnelPhone = computed(() => selectedPersonnel.value?.phone || '');
const formatNumber = (val, frac = 2) => {
    if (val === null || val === undefined || val === '') return 'N/A';
    const num = parseFloat(val);
    if (isNaN(num)) return 'N/A';
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: frac });
};
async function loadPageData() {
    loading.value = true;

    // ✅ [新增] 進入報價頁正規化：所有戶別（含 persist 還原的舊資料）首購狀態一律重設為「首購」
    quoteStore.resetAllToFirstTimeBuyer();

    projectStore.setCurrentProject(projectId.value);
    
    // 確保 projectStore 已初始化
    if (!projectStore.idToNameMap || Object.keys(projectStore.idToNameMap).length === 0) {
        await projectStore.fetchProjects();
    }
    
    const actualProjectName = projectId.value;
    
    // 初始化車位資料監聽
    parkingStore.initializeParkingData(actualProjectName);
    
    // 並行載入必要資料
    try {
        const [salesControlRes, templatesRes] = await Promise.all([
            fetchSalesControlData(actualProjectName), // 載入戶別資料
            fetchPaymentTermTemplates(projectId.value) // 載入期款範本
        ]);
        
        // 處理銷控資料 - 更新 unitDetails
        if (salesControlRes.status === 'success') {
            const allUnitData = salesControlRes.data.戶別;
            
            // 更新 quoteStore 中每個 item 的 unitDetails
            quoteStore.items.forEach(item => {
                const matchedUnit = allUnitData.find(unit => unit.戶別 === item.unitId);
                if (matchedUnit) {
                    // 確保 price_package_deal 正確對應
                    item.unitDetails = {
                        ...item.unitDetails,
                        ...matchedUnit,
                        price_package_deal: matchedUnit.price_package_deal || matchedUnit['配套價格'] || matchedUnit['配套價']
                    };
                }
            });
            
            // 保留配套期款範本（如果仍需要）
            packageTermsData.value = salesControlRes.data.配套期款範本 || [];
        }
        
        // 處理期款範本資料
        if (templatesRes.status === 'success') {
            paymentTemplates.value = templatesRes.data;
            console.log(`載入了 ${templatesRes.data.length} 個期款範本`);
        } else {
            throw new Error(`載入期款範本失敗: ${templatesRes.message}`);
        }
        
    } catch (err) {
        console.error('載入資料失敗:', err);
        error.value = err.message;
    }

  try {
        // 使用新的 Firestore API 獲取報價人員
        const personnelRes = await fetchSalesPersonnelList(projectId.value);
        
        if (personnelRes.status === 'success') {
            const allPersonnelList = personnelRes.data.personnelList;

            // 排序邏輯 (維持不變)
            allPersonnelList.sort((a, b) => {
                const orderA = (a.order !== undefined && a.order !== null) ? Number(a.order) : 999999;
                const orderB = (b.order !== undefined && b.order !== null) ? Number(b.order) : 999999;
                return orderA !== orderB ? orderA - orderB : (a.name || '').localeCompare(b.name || '', 'zh-Hant');
            });

            // --- 2. 新增：載入並檢查使用者權限邏輯 ---
            // 確保權限資料已載入 (使用當前用戶的 key)
            await adminStore.loadAdminData(userStore.user.key);

            // 檢查該用戶在「當前建案」下，是否擁有「報價系統銷售選單」權限
            // ✅ 使用 userStore 自身綁定的權限，避免使用 adminStore 導致一般用戶誤判
            const userPermissions = userStore.user?.permissions || {};
            const hasMenuPermission = userPermissions[projectId.value]?.systems?.includes('報價系統銷售選單');

            // 權限判斷：
            // 只要擁有「報價系統銷售選單」權限，或者本身是系統管理員/超級管理員，即可選擇其他人員
            const isSalesManager = hasMenuPermission || 
                                   userStore.user.roles?.includes('系統管理員') || 
                                   userStore.user.roles?.includes('超級管理員');
            
            if (isSalesManager) {
                // 管理權限：可選擇所有人員
                personnelOptions.value = allPersonnelList;
                canEditPersonnel.value = true;
                
                const currentUser = allPersonnelList.find(p => p.phone === userStore.user.key);
                if (currentUser) {
                    selectedPersonnel.value = currentUser;
                } else if (allPersonnelList.length > 0) {
                    selectedPersonnel.value = allPersonnelList[0];
                }
            } else {
                // 一般用戶：只能使用自己的資料
                const currentUserData = {
                    name: userStore.user.name,
                    phone: userStore.user.key
                };
                personnelOptions.value = [currentUserData];
                selectedPersonnel.value = currentUserData;
                canEditPersonnel.value = false;
            }
        } else {
            throw new Error('無法獲取報價人員列表: ' + personnelRes.message);
        }
    } catch (err) {
        console.error('載入權限或報價人員失敗:', err);
        error.value = err.message;
    } finally {
        loading.value = false;
    }
}
onMounted(loadPageData);

// --- 新增：範本選擇邏輯函數 ---

// 檢查並選擇期款範本的函數
function checkAndSelectPaymentTemplate(item) {
    const finalTotal = quoteStore.getFinalTotalPrice(item.internalId);
    const buyerType = item.isFirstTimeBuyer === '是' ? '首購' : '非首購';
    
    // ✅ [新增] 取得物件類型 (優先讀取 propertyType，若無則讀取 layout 或預設 '住家')
    // 注意：這裡必須從 item.unitDetails 讀取，因為 item 本身可能沒有這個欄位
    const propertyType = item.unitDetails?.propertyType || item.unitDetails?.layout || '住家';
    
    // 找出符合條件的範本
    const applicableTemplates = selectApplicableTemplates(
        paymentTemplates.value, 
        finalTotal, 
        buyerType,
        propertyType // ✅ [修改] 將物件類型傳入 API
    );
    
    if (applicableTemplates.length === 0) {
        throw new Error(
            `找不到適用於「${item.unitId}」的期款範本。\n` +
            `條件：${propertyType}、總價 ${finalTotal.toLocaleString()}萬、${buyerType}`
        );
    } else if (applicableTemplates.length === 1) {
        // 只有一個符合的範本，直接使用
        return applicableTemplates[0];
    } else {
        // 多個符合的範本，需要讓使用者選擇
        currentQuoteItem.value = item;
        availableTemplates.value = applicableTemplates;
        templateSelectionDialog.value = true;
        return null; // 等待使用者選擇
    }
}

// 確認範本選擇的函數
function confirmTemplateSelection() {
    const selectedTemplate = availableTemplates.value.find(
        t => t.id === selectedTemplateId.value
    );
    
    if (selectedTemplate) {
        templateSelectionDialog.value = false;
        // 繼續生成報價單，使用選中的範本
        continueGenerateQuote(currentQuoteItem.value, selectedTemplate);
    }
}

// 取消範本選擇的函數
function cancelTemplateSelection() {
    templateSelectionDialog.value = false;
    selectedTemplateId.value = '';
    currentQuoteItem.value = null;
    availableTemplates.value = [];
    isGeneratingPdf.value = false; // 停止生成流程
}

// 繼續生成報價單（使用者選擇範本後）
async function continueGenerateQuote(item, selectedTemplate) {
    item.selectedPaymentTemplate = selectedTemplate;
    
    // 檢查是否所有項目都已選擇範本
    const allHaveTemplates = quoteStore.items.every(i => i.selectedPaymentTemplate);
    
    if (allHaveTemplates) {
        await generateQuoteWithTemplates();
    }
}

function goBack() {
    const sourceMode = route.query.viewMode;
    const backRouteName = sourceMode === 'quote' ? 'QuoteSystem' : 'SalesControlSystem';
    
    // 修改：保留 query 參數，確保返回上一頁時狀態 (viewMode) 能被正確識別，
    // 避免上一頁誤判為新進入而清空 store 中的資料。
    router.push({ 
        name: backRouteName, 
        params: { projectName: projectId.value },
        query: { ...route.query } 
    });
}

function openQuoteEditor() {
  isQuoteEditorDialogVisible.value = true;
}

// ✅ [新增] 走「列印報價」進入（?pick=1）且報價單為空 → 開戶別選擇彈窗
async function maybeOpenPickerOnEntry() {
  if (route.query.pick === '1' && quoteStore.items.length === 0) {
    try {
      await salesDataStore.loadProjectData(projectId.value);
      pickerUnits.value = salesDataStore.getProjectData(projectId.value).households || [];
    } catch (e) {
      console.error('[QuoteSettings] 載入戶別清單失敗:', e);
      pickerUnits.value = [];
    }
    unitPickerVisible.value = true;
  }
}
onMounted(maybeOpenPickerOnEntry);

// 切換建案（SPA 內，不 full reload，避免冷啟動時路由守衛建案資料未就緒）：
// route param 變更 → 就地清空並重載本頁資料
watch(projectId, async (newId, oldId) => {
  if (!newId || newId === oldId) return;
  parkingStore.cleanup();
  error.value = null;
  unitPickerVisible.value = false;
  pickerUnits.value = [];
  quoteStore.clearAllNegotiations();
  quoteStore.clearQuote();
  await loadPageData();
  await maybeOpenPickerOnEntry();
});

// 報價設定內「新增戶別」：載入戶別清單（快取）後開啟選擇彈窗
async function openUnitPicker() {
  if (!pickerUnits.value || pickerUnits.value.length === 0) {
    try {
      await salesDataStore.loadProjectData(projectId.value);
      pickerUnits.value = salesDataStore.getProjectData(projectId.value).households || [];
    } catch (e) {
      console.error('[QuoteSettings] 載入戶別清單失敗:', e);
      pickerUnits.value = [];
    }
  }
  unitPickerVisible.value = true;
}

// 移除全部戶別
function removeAllUnits() {
  quoteStore.clearQuote();
  confirmClearDialog.value = false;
}

// 切換建案（免回入口頁；SPA 內導向，watch(projectId) 會就地清空並重載資料，
// 不做 window.location.reload 以免冷啟動時路由守衛建案資料未就緒被踢回 Home）
async function switchProject(p) {
  if (!p || p.id === projectId.value) return;
  await router.push({
    name: 'QuoteSettings',
    params: { projectName: p.id },
    query: { ...route.query },
  });
}

// 戶別選擇彈窗：確認 → 逐筆加入 quoteStore（沿用允許重複）
function onPickerConfirm(unitDataArr) {
  (unitDataArr || []).forEach(u => quoteStore.addItem(u));
  unitPickerVisible.value = false;
}

// 戶別選擇彈窗：取消 → 僅關閉彈窗（不提供返回，停留在報價設定）
function onPickerCancel() {
  unitPickerVisible.value = false;
}


</script>

<style scoped>

.page-header { padding: 4px 0 16px; border-bottom: 2px solid #e0e0e0; gap: 8px; flex-wrap: wrap; }
.title-block { min-width: 0; }
.project-chip {
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding-inline: 14px;
  box-shadow: 0 2px 6px rgba(25, 118, 210, 0.25);
}
.project-chip :deep(.v-chip__content) { line-height: 1.4; }
.quote-item-header { font-weight: bold; padding: 8px 16px; background-color: #f5f5f5; border-radius: 4px; margin-bottom: 8px; }
.quote-item-header .item-cell { display: flex; justify-content: center; align-items: center; text-align: center; }
.flex-1 { flex: 1; }
.flex-2 { flex: 2; }
.flex-shrink-0 { flex-shrink: 0; }
.quote-item-card { margin-bottom: 12px; transition: box-shadow 0.2s ease-in-out; }
.quote-item-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.iframe-container { width: 100%; height: calc(100vh - 48px); overflow: hidden; }
.iframe-container iframe { width: 100%; height: 100%; border: none; }
.qr-code-container { border: 1px solid #e0e0e0; padding: 16px; border-radius: 8px; background-color: white; }
.blur-background :deep(.v-overlay__scrim) {
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
</style>
