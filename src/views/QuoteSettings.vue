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
      <v-btn icon="mdi-arrow-left" variant="text" @click="goBack" class="mr-4"></v-btn>
      <div>
        <h1 class="text-h4 font-weight-bold text-primary">報價單設定</h1>
        <p class="text-grey-darken-1">建案: {{ projectName }}</p>
      </div>
      <v-spacer></v-spacer>
      <v-btn
        color="info" variant="tonal"
        @click="openSlideViewer(quoteParkingSlideId)"
        :disabled="!quoteParkingSlideId" title="車位表">
        車位表
      </v-btn>
    </div>

    <v-card class="mt-4">
      <v-card-text>
        <div v-if="quoteStore.items.length === 0" class="text-center py-10">
          <p>報價單中沒有任何戶別。</p>
          <v-btn color="primary" class="mt-4" @click="goBack">返回銷控表</v-btn>
        </div>
        <div v-else class="quote-list">
          <div class="quote-item-header d-none d-md-flex">
            <div class="item-cell flex-1">戶別</div>
            <div class="item-cell flex-1">面積(坪)</div>
            <div class="item-cell flex-1">房屋總價</div>
            <div class="item-cell flex-1">房屋單價</div>
            <div class="item-cell flex-2">車位</div>
            <div class="item-cell flex-1">車位價格</div>
            <div class="item-cell flex-1">首購</div>
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
      :show-package-deal="showPackageDealColumns"
      :is-loading="loading" 
      @remove="quoteStore.removeItem(item.internalId)"
      @open-parking-modal="openParkingModal(item.internalId)"
    />
          </v-card>
        </div>
      </v-card-text>
    </v-card>
    
    <v-card class="mt-4" v-if="quoteStore.items.length > 0">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="2">
            <v-select label="報價人員" :items="personnelOptions" v-model="selectedPersonnel" :readonly="!canEditPersonnel" item-title="name" return-object></v-select>
          </v-col>
          <v-col cols="12" md="2">
            <v-text-field label="聯絡電話" :model-value="personnelPhone" readonly></v-text-field>
          </v-col>
          <v-col cols="12" md="8" class="text-right">
            <v-btn 
              color="success" size="large"
              @click="handleGenerateQuote"
              :loading="isGeneratingPdf"
              :disabled="!selectedPersonnel">
              產生報價單
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <ParkingSelectionModal v-model:show="isParkingModalVisible" :unit-id="currentEditingInternalId" :all-parking-data="allParkingData" :initial-selected-parking="currentInitialParking" @confirm="handleParkingConfirm" @request-open-slide="openSlideViewer(quoteParkingSlideId)" />
    <v-dialog v-model="isSlideDialogVisible" fullscreen hide-overlay transition="dialog-bottom-transition"><v-card><v-toolbar dark color="primary"><v-btn icon dark @click="isSlideDialogVisible = false"><v-icon>mdi-close</v-icon></v-btn><v-toolbar-title>車位表</v-toolbar-title></v-toolbar><div class="iframe-container"><iframe v-if="slideEmbedUrl" :src="slideEmbedUrl" frameborder="0" allowfullscreen></iframe></div></v-card></v-dialog>
    
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
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuoteStore } from '@/store/quoteStore';
import { useUserStore } from '@/store/user';
import { generateQuotePdf, fetchSalesControlData, fetchParkingList, fetchQuotePersonnelList } from '@/api';
import { useSlideViewer } from '@/composables/useSlideViewer';
import QrcodeVue from 'qrcode.vue';
import QuoteItem from '@/components/QuoteItem.vue';
import ParkingSelectionModal from '@/components/ParkingSelectionModal.vue';

const route = useRoute();
const router = useRouter();
const quoteStore = useQuoteStore();
const userStore = useUserStore();
const { isSlideDialogVisible, slideEmbedUrl, openSlideViewer } = useSlideViewer();

const loading = ref(true);
const error = ref(null);
const projectName = route.params.projectName;
const allParkingData = ref([]);
const personnelOptions = ref([]);
const canEditPersonnel = ref(false);
const selectedPersonnel = ref(null);
const quoteParkingSlideId = ref('');
const isParkingModalVisible = ref(false);
const currentEditingInternalId = ref(null);
const paymentTermsData = ref([]);
const packageTermsData = ref([]); 
const isGeneratingPdf = ref(false);
const pdfResultDialog = ref(false);
const generatedPdfUrl = ref('');



// =======================================================
// ✅ 核心修正：從 PaymentDetails.vue 複製過來的完整計算引擎
// =======================================================

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

// =======================================================
// ✅ 最終修正版：handleGenerateQuote
// =======================================================
async function handleGenerateQuote() {
    if (!selectedPersonnel.value) {
       alert('請先選擇報價人員');
       return;
    }
    isGeneratingPdf.value = true;
    
    try {
       const payload = {
           projectName: projectName,
           personnelName: selectedPersonnel.value.name,
           personnelPhone: selectedPersonnel.value.phone,
           items: quoteStore.items.map(item => {
      // --- 1. 使用與 PaymentDetails.vue 完全相同的計算引擎 ---
            const finalTotal = quoteStore.getFinalTotalPrice(item.internalId);
      
      // ★★★【BUG 已修正】★★★
      // 明確判斷 isFirstTimeBuyer 是否等於 "是"
      const conditionCol = item.isFirstTimeBuyer === '是' ?
                (finalTotal >= 4000 ? '>=4000首購' : '<4000首購') :
                (finalTotal >= 4000 ? '>=4000非首購' : '<4000非首購');
            const conditionContext = { conditionCol };

            // 執行真正的公式引擎，獲取每個項目編號對應的金額
            const calculatedAmounts = runCalculationEngine(paymentTermsData.value, finalTotal, '總價', conditionContext);

      // --- 2. 組合 Payload ---
            const fixedPayload = {
                   '戶別': item.unitId,
          // ★★★【BUG 已修正】★★★
          // 直接使用 isFirstTimeBuyer 的值
                   '是否首購': item.isFirstTimeBuyer, 
                   '房屋總面積': formatNumber(item.unitDetails['房屋面積(坪)']),
                   '房屋總價': formatNumber(quoteStore.getRawDisplayHousePrice(item.internalId)),
                   '單價': formatNumber(quoteStore.getDisplayUnitPrice(item.internalId), 2),
                   '車位編號': item.selectedParking.map(p => p['車位編號']).join(', '),
                   '車位價格': quoteStore.getParkingTotalPrice(item.internalId).toLocaleString(),
                   '配套價': quoteStore.getPackagePrice(item.internalId).toLocaleString(),
                   '總價': finalTotal.toLocaleString(),
            };

            const dynamicPayments = paymentTermsData.value.reduce((acc, term) => {
              const termName = term['項目名稱'];
              const termId = term['編號'];
            
              if (termName && calculatedAmounts[termId] !== undefined) {
                  const amount = calculatedAmounts[termId];
                  let percentDisplay = '0%'; // Default
                
                  if (term['類型'] === '百分比') {
                          const termValue = parseFloat(term[conditionCol]) || 0;
                          percentDisplay = `${Math.round(termValue * 100)}%`;
                  }

                  acc[`${termName}%`] = percentDisplay;
                  acc[`${termName}金額`] = amount.toLocaleString();
              }
              return acc;
          }, {});

            return {
                   ...fixedPayload,
                   ...dynamicPayments,
            };
         })
     };

    console.log("準備發送到後端的最終 Payload:", JSON.stringify(payload, null, 2));

    const result = await generateQuotePdf(payload);
    if (result.status === 'success' && result.url) {
        generatedPdfUrl.value = result.url;
        pdfResultDialog.value = true;
    } else {
        throw new Error(result.message || '後端未返回有效的URL');
    }
   } catch (err) {
       console.error('產生報價單失敗:', err);
       alert(`產生報價單失敗: ${err.message}`);
   } finally {
       isGeneratingPdf.value = false;
   }
}

// =================================================================
// 其他既有程式碼 (保持不變)
// =================================================================
const showPackageDealColumns = computed(() => {
   if (quoteStore.items.length === 0) return false;
   return quoteStore.items.some(item => item.unitDetails && item.unitDetails['配套房屋總價']);
});

const personnelPhone = computed(() => selectedPersonnel.value?.phone || '');
const currentInitialParking = computed(() => {
   if (!currentEditingInternalId.value) return [];
   const item = quoteStore.items.find(i => i.internalId === currentEditingInternalId.value);
   return item ? item.selectedParking : [];
});

function openParkingModal(internalId) {
   currentEditingInternalId.value = internalId;
   isParkingModalVisible.value = true;
}

function handleParkingConfirm(parkingList) {
   quoteStore.updateParking(currentEditingInternalId.value, parkingList);
   isParkingModalVisible.value = false;
}

const formatNumber = (val, frac = 2) => {
      const num = parseFloat(val);
      if (isNaN(num)) return '';
      return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: frac });
};

onMounted(async () => {
      loading.value = true;
      try {
            const [salesControlRes, parkingRes, personnelRes] = await Promise.all([
                  fetchSalesControlData(projectName),
                  fetchParkingList(projectName),
                  fetchQuotePersonnelList(projectName, userStore.user.key)
            ]);
            if (salesControlRes.status === 'success' && salesControlRes.data) {
                  paymentTermsData.value = salesControlRes.data.期款比例 || [];
                  packageTermsData.value = salesControlRes.data.配套期款 || []; 
                  if (salesControlRes.data.車位SLIDE?.length > 0) {
                        const slideInfo = salesControlRes.data.車位SLIDE[0];
                        quoteParkingSlideId.value = slideInfo['報價車位SLIDEID'] || '';
                  }
            }
            if (parkingRes.status === 'success') allParkingData.value = parkingRes.data;
            else throw new Error('無法獲取車位列表: ' + parkingRes.message);
            if (personnelRes.status === 'success') {
                  personnelOptions.value = personnelRes.data.personnelList;
                  canEditPersonnel.value = personnelRes.data.canEdit;
                  const currentUser = personnelRes.data.personnelList.find(p => p.phone === userStore.user.key);
                  if (currentUser) selectedPersonnel.value = currentUser;
            } else {
                  throw new Error('無法獲取報價人員列表: ' + personnelRes.message);
            }
      } catch (err) {
            error.value = err.message;
      } finally {
            loading.value = false;
      }
});

function goBack() {
   const sourceMode = route.query.viewMode;
   const backRouteName = sourceMode === 'quote' ? 'QuoteSystem' : 'SalesControlSystem';
   router.push({ name: backRouteName, params: { projectName } });
}
</script>

<style scoped>
/* 您的 style 內容維持原樣即可 */
.page-header { padding-bottom: 16px; border-bottom: 2px solid #e0e0e0; }
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