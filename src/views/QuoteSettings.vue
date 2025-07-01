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
      :package-terms-data="packageTermsData"  :show-package-deal="showPackageDealColumns"
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
          <v-col cols="12" md="5">
            <v-select label="報價人員" :items="personnelOptions" v-model="selectedPersonnel" :readonly="!canEditPersonnel" item-title="name" return-object></v-select>
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field label="聯絡電話" :model-value="personnelPhone" readonly></v-text-field>
          </v-col>
          <v-col cols="12" md="4" class="text-right">
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

// ... 所有 ref, computed, function 的定義保持不變 ...
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

// =======================================================
// ✅ 重構核心：handleGenerateQuote
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
        // --- 開始與 PaymentDetails 同步的動態計算 ---
        const finalTotal = quoteStore.getFinalTotalPrice(item.internalId);
        
        // 1. 決定趴數欄位
        const pricePart = finalTotal >= 4000 ? 'gte4000' : 'lt4000';
        const buyerPart = item.isFirstTimeBuyer ? 'first' : 'not_first';
        const valueKey = `${pricePart}_${buyerPart}`;

        const paymentCalculations = {};
        let totalSelfPayment = 0;
        let depositAmount = 0;

        // 2. 遍歷規則，計算每一項的金額 (單位：萬)
        paymentTermsData.value.forEach(term => {
          if (!term.item_name) return;
          
          const value = Number(term[valueKey]) || 0;
          if (value === 0 && term.item_name !== '銀行貸款') return;

          let amount = 0;
          if (term.type === '固定金額') {
            amount = value;
          } else if (term.type === '百分比') {
            // 注意：PDF Payload 需要以「萬」為單位
            amount = finalTotal * value;
          }

          if (term.item_name === '訂金') {
            depositAmount = amount;
          }
          if (term.item_name === '簽約金') {
            amount -= depositAmount;
          }
          
          // 處理取整
          if (term.item_name === '簽約金') {
             paymentCalculations[term.item_name] = { amount: Math.ceil(amount), percent: value };
          } else {
             paymentCalculations[term.item_name] = { amount: Math.round(amount), percent: value };
          }
          
          if (term.item_name !== '銀行貸款') {
            totalSelfPayment += paymentCalculations[term.item_name].amount;
          }
        });

        // 3. 計算銀行貸款
        const loanAmount = finalTotal - totalSelfPayment;
        if(paymentCalculations['銀行貸款']) {
          paymentCalculations['銀行貸款'].amount = loanAmount;
        }
        // --- 動態計算結束 ---
        
        // 4. 組合最終給 PDF 的 payload
        const formatPercent = (val) => `${Math.round((Number(val) || 0) * 100)}%`;
        const getPaymentValue = (name, key) => {
            if (!paymentCalculations[name]) return key === 'amount' ? '0' : '0%';
            return key === 'amount' 
                ? paymentCalculations[name].amount.toLocaleString()
                : formatPercent(paymentCalculations[name].percent);
        };

        return {
          '戶別': item.unitId,
          '是否首購': item.isFirstTimeBuyer ? '是' : '否',
          '房屋總面積': formatNumber(item.unitDetails['房屋面積(坪)']),
          '房屋總價': formatNumber(quoteStore.getRawDisplayHousePrice(item.internalId)),
          '單價': formatNumber(quoteStore.getDisplayUnitPrice(item.internalId), 2),
          '車位編號': item.selectedParking.map(p => p['車位編號']).join(', '),
          '車位價格': quoteStore.getParkingTotalPrice(item.internalId).toLocaleString(),
          '配套價': quoteStore.getPackagePrice(item.internalId).toLocaleString(),
          '總價': finalTotal.toLocaleString(),
          
          // 動態生成付款項目
          '訂金%': getPaymentValue('訂金', 'percent'), // 訂金的 percent 欄位比較特殊
          '訂金金額': getPaymentValue('訂金', 'amount'),
          '簽約金%': getPaymentValue('簽約金', 'percent'),
          '簽約金金額': getPaymentValue('簽約金', 'amount'),
          '工程期款%': getPaymentValue('工程期款', 'percent'),
          '工程期款金額': getPaymentValue('工程期款', 'amount'),
          '使照取得款%': getPaymentValue('使照取得款', 'percent'),
          '使照取得款金額': getPaymentValue('使照取得款', 'amount'),
          '交屋款%': getPaymentValue('交屋款', 'percent'),
          '交屋款金額': getPaymentValue('交屋款', 'amount'),
          '銀行貸款%': getPaymentValue('銀行貸款', 'percent'),
          '銀行貸款金額': getPaymentValue('銀行貸款', 'amount'),
          // 如果有其他款項，也可以用同樣方式加入
          '開工款%': getPaymentValue('開工款', 'percent'),
          '開工款金額': getPaymentValue('開工款', 'amount'),
        };
      })
    };

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