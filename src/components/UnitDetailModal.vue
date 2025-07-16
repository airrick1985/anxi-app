<template>
  <v-dialog
    :model-value="show"
    @update:model-value="close"
    :fullscreen="isMobile"
    :max-width="isMobile ? '100%' : '80vw'"
    :transition="isMobile ? 'dialog-bottom-transition' : 'dialog-transition'"
  >
    <v-card class="d-flex flex-column" style="height: 100%; overflow: hidden;">
        
        <v-overlay :model-value="isSaving" class="align-center justify-center blur-background" persistent scrim="grey-darken-3">
          <div class="d-flex flex-column align-center">
              <v-progress-circular indeterminate size="48" color="#008cff" class="mb-4"></v-progress-circular>
              <p class="text-h6 text-black">{{ savingText }}</p>
          </div>
        </v-overlay>
        
        <div class="header-section">
            <v-card-title class="d-flex justify-space-between align-center text-h5">
                <span>{{ unitData ? unitData['戶別'] : '詳細資訊' }}</span>
                <div>
                    <v-btn v-if="viewMode === 'sales' && !isEditing" color="white" variant="text" @click="startEditing">
                        <v-icon left>mdi-pencil</v-icon>
                        修改銷控
                    </v-btn>
                    <v-btn v-if="isEditing" variant="text" @click="cancelEditing">取消編輯</v-btn>
                    <v-btn icon="mdi-close" variant="text" @click="close"></v-btn>
                </div>
            </v-card-title>
            <v-divider></v-divider>
            <v-tabs v-model="tab" color="primary" grow :disabled="isEditing">
                <v-tab value="info">詳細資訊</v-tab>
                <v-tab value="floorplans" :disabled="!hasFloorplans">平面圖</v-tab>
            </v-tabs>
            <v-divider></v-divider>
        </div>

        <v-card-text class="main-content">
            <v-window v-model="tab">
                <v-window-item value="info">
                    <template v-if="isEditing">
                        <SalesInfoForm 
                            v-if="editingData"
                            v-model="editingData"
                            :status-options="statusOptions"
                            :personnel-options="personnelOptions"
                            :buyer-info-options="buyerInfoOptions"
                            :project-name="projectName"
                            :all-parking-data="allData['車位'] || []"
                            @request-open-slide="$emit('request-open-slide')"
                        />
                    </template>
                    <template v-else>
                        <div v-if="unitData" class="pa-2">
                            <v-row class="top-info-row">
                                <v-col cols="12" md="6">
                                    <div class="info-section">
                                        <div class="section-title">價格資訊</div>
                                        <template v-if="shouldHidePrice">
                                            <div class="pa-4 text-center">
                                                <v-icon size="x-large" color="grey">mdi-currency-usd-off</v-icon>
                                                <p class="text-grey mt-2">此戶別已售，價格不顯示</p>
                                            </div>
                                        </template>
                                        <template v-else>
                                            <v-list lines="two" dense>
                                                <v-list-item title="房價">
                                                    <template v-slot:subtitle><span class="highlight-price">{{ formatNumber(unitData['房屋總表價']) }} 萬</span></template>
                                                    <template v-slot:prepend><v-icon>mdi-cash-multiple</v-icon></template>
                                                </v-list-item>
                                                <v-list-item title="單價">
                                                    <template v-slot:subtitle><span class="highlight-price">{{ calculatedUnitPrice }} 萬/坪</span></template>
                                                    <template v-slot:prepend><v-icon>mdi-chart-line</v-icon></template>
                                                </v-list-item>
                                                
                                                <template v-if="viewMode === 'sales'">
                                                    <v-divider class="my-2"></v-divider>
                                                    <v-list-item title="房價 (底價)" class="mt-2">
                                                        <template v-slot:subtitle><span class="highlight-price-base">{{ formatNumber(unitData['房屋總底價']) }} 萬</span></template>
                                                        <template v-slot:prepend><v-icon color="grey-darken-1">mdi-alpha-b-box-outline</v-icon></template>
                                                    </v-list-item>
                                                    <v-list-item title="單價 (底價)">
                                                        <template v-slot:subtitle><span class="highlight-price-base">{{ calculatedBaseUnitPrice }} 萬/坪</span></template>
                                                        <template v-slot:prepend><v-icon color="grey-darken-1">mdi-chart-line-variant</v-icon></template>
                                                    </v-list-item>

                                                    <template v-if="unitData['房屋成交價']">
                                                        <v-divider class="my-2"></v-divider>
                                                        <v-list-item title="房價 (成交價)" class="mt-2">
                                                            <template v-slot:subtitle><span class="highlight-price-final">{{ formatNumber(unitData['房屋成交價']) }} 萬</span></template>
                                                            <template v-slot:prepend><v-icon color="success">mdi-check-decagram-outline</v-icon></template>
                                                        </v-list-item>
                                                        <v-list-item title="單價 (成交價)">
                                                            <template v-slot:subtitle><span class="highlight-price-final">{{ calculatedTransactionUnitPrice }} 萬/坪</span></template>
                                                            <template v-slot:prepend><v-icon color="success">mdi-calculator-variant-outline</v-icon></template>
                                                        </v-list-item>
                                                    </template>
                                                </template>
                                            </v-list>
                                        </template>
                                    </div>
                                </v-col>

                                <v-col cols="12" md="6">
                                    <div class="info-section">
                                       <div class="section-title">面積資訊</div>
                                       <div class="total-area-card">
                                          <div class="area-summary-item">
                                             <div>
                                                <div class="total-area-title">房屋總面積</div>
                                                <div class="total-area-value">{{ formatNumber(unitData['房屋面積(坪)'], 2) }} 坪</div>
                                                <div class="total-area-subtitle">{{ formatNumber(unitData['房屋面積(平方公尺)'], 2) }} m²</div>
                                             </div>
                                          </div>
                                          <v-divider vertical class="mx-4"></v-divider>
                                          <div class="area-summary-item">
                                             <div>
                                                <div class="total-area-title">公設比</div>
                                                <div class="total-area-value">{{ formatPercentage(unitData['公設比']) }}</div>
                                                <div class="total-area-subtitle">&nbsp;</div>
                                             </div>
                                          </div>
                                       </div>
                                       <div class="area-details mt-3">
                                          <div class="area-group">
                                             <div class="area-group-title"> <v-icon size="small" class="mr-1">mdi-home</v-icon>
                                                建物面積明細</div>
                                             <div class="area-item-header">
                                                <span>項目</span>
                                                <span>坪數</span>
                                                <span>m²</span>
                                             </div>
                                             <div class="area-item">
                                                <span>主建物 (室內)</span>
                                                <span class="area-ping-value">{{ formatNumber(unitData['主建物面積(坪)'], 2) }}</span>
                                                <span>{{ formatNumber(unitData['主建物面積(平方公尺)'], 2) }}</span>
                                             </div>
                                             <div class="area-item">
                                                <span>附屬建物 (陽台)</span>
                                                <span class="area-ping-value">{{ formatNumber(unitData['附屬建物面積(坪)'], 2) }}</span>
                                                <span>{{ formatNumber(unitData['附屬建物面積(平方公尺)'], 2) }}</span>
                                             </div>
                                             <div class="area-item">
                                                <span>共用部分 (公設)</span>
                                                <span class="area-ping-value">{{ formatNumber(unitData['共用部分面積(坪)'], 2) }}</span>
                                                <span>{{ formatNumber(unitData['共用部分面積(平方公尺)'], 2) }}</span>
                                             </div>
                                             <div class="area-item">
                                                <span>露臺 (不計坪)</span>
                                                <span class="area-ping-value">{{ formatNumber(unitData['露臺(坪)'], 2) }}</span>
                                                <span>-</span>
                                             </div>
                                          </div>
                                       </div>
                                       <div class="area-details mt-2">
                                          <div class="area-group">
                                             <div class="area-group-title">
                                                <v-icon size="small" class="mr-1">mdi-earth</v-icon>
                                                土地持分資訊
                                             </div>
                                             <div class="area-item-header">
                                                <span>項目</span>
                                                <span>坪數</span>
                                                <span>m²</span>
                                             </div>
                                             <div class="area-item">
                                                <span>土地持分面積</span>
                                                <span class="area-ping-value">{{ formatNumber(unitData['土地持分面積(坪)'], 2) }}</span>
                                                <span>{{ formatNumber(unitData['土地持分面積(平方公尺)'], 2) }}</span>
                                             </div>
                                             <div class="area-item">
                                                <span>土地持分</span>
                                                <span class="font-weight-medium">十萬分之 {{ unitData['土地持分'] || 'N/A' }}</span>
                                                <span>-</span>
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                </v-col>
                            </v-row>

                            <div v-if="viewMode === 'sales'">
                                <v-divider class="my-4"></v-divider>
                                <SalesInfoSection
                                    :sales-data="unitData"
                                    :all-parking-data="allData['車位'] || []"
                                />
                            </div>
                        </div>
                        <div v-else class="text-center pa-5"><p>沒有可顯示的資料。</p></div>
                    </template>
                </v-window-item>

                <v-window-item value="floorplans" class="fill-height pa-0">
                    <div v-if="hasFloorplans" class="preview-area-full">
                        <img v-if="firstPlan.type === 'image'" :src="proxiedFirstImageUrl" class="preview-content" alt="平面圖預覽" />
                        <a v-if="firstPlan.type === 'pdf'" :href="firstPlan.url" target="_blank" class="pdf-link">在新分頁中打開 PDF: {{ firstPlan.name }}</a>
                        
                        <v-btn
                          color="blue-darken-2"
                          variant="flat"
                          @click="openSizingTool"
                          class="sizing-tool-btn"
                          elevation="4"
                        >
                            <v-icon left>mdi-ruler-square-compass</v-icon>
                            測量工具
                        </v-btn>
                    </div>
                    <div v-else class="text-center pa-5 text-grey d-flex flex-column justify-center align-center fill-height">
                        <v-icon size="x-large">mdi-image-off</v-icon>
                        <p class="mt-2">此戶別尚無平面圖資料</p>
                    </div>
                </v-window-item>
            </v-window>
        </v-card-text>
        
        <div class="footer-section">
            <v-divider></v-divider>
             <v-card-actions :class="{ 'flex-column align-stretch pa-4 ga-3': isMobile, 'mb-0': !isMobile }">
              <v-spacer v-if="!isMobile"></v-spacer>
              <template v-if="isEditing">
                  <v-btn color="grey-darken-1" variant="text" @click="cancelEditing">取消</v-btn>
                  <v-btn color="success" variant="flat" @click="saveChanges" :loading="isSaving" size="large">儲存變更</v-btn>
              </template>
              <template v-else>
                <v-btn
                  v-if="viewMode === 'sales' && isSold" 
                  color="error"
                  variant="outlined"
                  @click="openCancelPurchaseDialog"
                >
                  <v-icon left>mdi-account-cancel-outline</v-icon>
                  辦理退戶
                </v-btn>
                <v-btn
                  v-if="viewMode === 'sales' && unitData && unitData['資料夾URL']"
                  color="teal"
                  variant="flat"
                  :href="unitData['資料夾URL']"
                  target="_blank"
                >
                    <v-icon left>mdi-folder-google-drive</v-icon>
                    {{ unitData['戶別'] }} 資料夾
                  </v-btn>
                  <v-btn color="success" variant="flat" @click="handleAddToQuote" :disabled="!canAddToQuote">
                      <v-icon left>mdi-plus-box-outline</v-icon>
                      {{ addToQuoteButtonText }}
                  </v-btn>
                  <v-btn v-if="viewMode === 'sales'" color="secondary" variant="flat" @click="openPaymentSettings">
                      <v-icon left>mdi-cash-register</v-icon>
                      付款表設定
                  </v-btn>
                  <v-btn color="primary" variant="text" @click="close">關閉</v-btn>
              </template>
            </v-card-actions>
        </div>
    </v-card>
  </v-dialog>

  <ConfirmationDialog
    :show="showCancelDialog"
    @update:show="showCancelDialog = $event"
    title="確認辦理退戶"
    :message="cancelDialogMessage"
    confirm-text="確認退戶"
    confirm-color="error"
    :loading="isSaving"
    @confirm="handleConfirmCancelPurchase"
    @cancel="showCancelDialog = false"
  />

  <PaymentSettings
    v-if="paymentSettingsDialog"
    :show="paymentSettingsDialog"
    @update:show="paymentSettingsDialog = $event"
    :unit-data="enrichedUnitData"
    :project-name="projectName"
    :all-data="allData"
    @request-open-slide="$emit('request-open-slide')"
  />

  <v-dialog
    v-model="sizingToolDialog"
    fullscreen
    hide-overlay
    transition="dialog-bottom-transition"
    scrim="false"
  >
    <v-card class="d-flex flex-column" style="height:100vh; width:100vw;">
      <v-toolbar dark color="primary" density="compact">
        <v-toolbar-title>平面圖測量工具 - {{ unitData ? unitData['戶別'] : '' }}</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon dark @click="sizingToolDialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      <div style="flex-grow: 1; position: relative; height: calc(100vh - 48px);">
        <FloorplanSizing 
          v-if="sizingToolDialog"
          :unit-data="unitData"
          :project-name="props.projectName"
        />
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
// ✅ (2/2) Script 區塊 (合併後的版本)
import { useRouter } from 'vue-router'; 
import { ref, watch, computed, defineProps, defineEmits } from 'vue';
import { useDisplay } from 'vuetify';
import { useUserStore } from '@/store/user'; // 引入 userStore
import { IMAGE_PROXY_BASE_URL, updateSalesData, cancelPurchase } from '@/api'; // 引入 cancelPurchase
import SalesInfoSection from './SalesInfoSection.vue';
import SalesInfoForm from './SalesInfoForm.vue';
import { useQuoteStore } from '@/store/quoteStore'; 
import PaymentSettings from '@/views/PaymentSettings.vue'; 
import FloorplanSizing from './FloorplanSizing.vue';
import ConfirmationDialog from './ConfirmationDialog.vue'; // 引入確認對話框

const userStore = useUserStore(); // 建立 userStore 實例

// ✅ 新增：退戶相關的狀態
const showCancelDialog = ref(false);
const savingText = ref('儲存中，請稍候...');

// ✅ 新增：計算屬性，判斷此戶是否已售
const isSold = computed(() => {
  return props.unitData && props.unitData['銷控後台狀態'];
});

// ✅ 新增：動態產生確認對話框的訊息
const cancelDialogMessage = computed(() => {
  const unitId = props.unitData ? `【${props.unitData['戶別']}】` : '';
  return `您確定要為 ${unitId} 辦理退戶嗎？<br><br>此操作將會清除所有相關的銷售、客戶資料，並將車位釋出。<b>此動作無法復原。</b>`;
});

// ✅ 新增：打開確認對話框的函式
function openCancelPurchaseDialog() {
  showCancelDialog.value = true;
}

// ✅ 新增：使用者確認後，執行退戶的函式
async function handleConfirmCancelPurchase() {
  if (!props.unitData || !userStore.user) {
    alert('缺少必要資訊，無法執行退戶。');
    return;
  }

  isSaving.value = true;
  savingText.value = '正在辦理退戶...';
  showCancelDialog.value = false;

  try {
    const result = await cancelPurchase(
      props.projectName,
      props.unitData['戶別'],
      userStore.user.name // 操作人員名稱
    );

    if (result.status !== 'success') {
      throw new Error(result.message);
    }
    
    alert('退戶成功！'); // 或使用您的 Toast 通知
    emit('data-updated');
    close();

  } catch (error) {
    console.error('退戶失敗:', error);
    alert(`退戶失敗: ${error.message}`);
  } finally {
    isSaving.value = false;
    savingText.value = '儲存中，請稍候...';
  }
}

// 建立 router 和 display 實例
const router = useRouter();
const { mobile: isMobile } = useDisplay();
const quoteStore = useQuoteStore();

// 定義 props 和 emits
const props = defineProps({
  show: { type: Boolean, required: true },
  unitData: { type: Object, default: () => null },
  viewMode: { type: String, default: 'sales' },
  allData: { type: Object, default: () => ({}) },
  projectName: { type: String, required: true }, 
});
const emit = defineEmits(['update:show', 'data-updated', 'request-open-slide']);

// 定義所有 ref 狀態
const tab = ref('info');
const isEditing = ref(false);
const isSaving = ref(false);
const editingData = ref(null);
const paymentSettingsDialog = ref(false); // 付款表設定 Dialog
const sizingToolDialog = ref(false);      // 測量工具 Dialog

// 價格計算屬性
const calculatedUnitPrice = computed(() => {
  const price = props.unitData?.['房屋總表價'];
  const area = props.unitData?.['房屋面積(坪)'];
  if (price && area > 0) {
    return formatNumber(price / area, 2);
  }
  return 'N/A';
});

const calculatedBaseUnitPrice = computed(() => {
  const price = props.unitData?.['房屋總底價'];
  const area = props.unitData?.['房屋面積(坪)'];
  if (price && area > 0) {
    return formatNumber(price / area, 2);
  }
  return 'N/A';
});

const calculatedTransactionUnitPrice = computed(() => {
  const price = props.unitData?.['房屋成交價'];
  const area = props.unitData?.['房屋面積(坪)'];
  if (price && area > 0) {
    return formatNumber(price / area, 2);
  }
  return 'N/A';
});

// ✅ 這是從舊版複製過來的、正確的 enrichedUnitData
const enrichedUnitData = computed(() => {
  if (!props.unitData) return null;
  const enriched = JSON.parse(JSON.stringify(props.unitData));
  const allParkingLotsForProject = props.allData?.['車位'] || [];
  const currentUnitId = props.unitData['戶別'];
  if (currentUnitId && allParkingLotsForProject.length > 0) {
    const assignedParkings = allParkingLotsForProject
      .filter(parkingLot => parkingLot['購買戶別'] === currentUnitId)
      .map(parkingLot => ({
        '車位編號': parkingLot['車位編號'],
        '車位尺寸': parkingLot['車位尺寸'],
        '車位類別': parkingLot['車位類別'],
        '車位坪數': parkingLot['車位坪數'],
        '車位總價': parkingLot['車位總價'],
        '車位底價': parkingLot['車位底價'],
        '車位狀態': parkingLot['銷控狀態'],
        '車位成交價': parkingLot['車位成交價'] !== undefined ? parkingLot['車位成交價'] : (parkingLot['車位總價'] || 0),
      }));
    enriched['持有車位'] = assignedParkings;
  } else if (!enriched['持有車位']) {
    enriched['持有車位'] = [];
  }
  return enriched;
});


// 其他選項計算屬性
const statusOptions = computed(() => (props.allData['參數'] || []).map(p => p['銷控狀態']));
const personnelOptions = computed(() => (props.allData['銷售人員'] || []).map(p => p['銷售人員']));
const buyerInfoOptions = computed(() => {
    const options = {};
    const buyerInfoSheet = props.allData['買方其他資訊'] || [];
    if (buyerInfoSheet.length > 0) {
        const headers = Object.keys(buyerInfoSheet[0]);
        headers.forEach(key => {
            options[key] = [...new Set(buyerInfoSheet.map(row => row[key]).filter(Boolean))];
        });
    }
    return options;
});

// ✅ 函式區
function openSizingTool() {
  sizingToolDialog.value = true;
}

function openPaymentSettings() {
  // 舊版是直接打開 Dialog，這是比較好的作法，因為 PaymentSettings 本身就是一個 Dialog 元件
  paymentSettingsDialog.value = true;
}

function startEditing() {
  editingData.value = JSON.parse(JSON.stringify(props.unitData || {}));
  if (!editingData.value) {
      editingData.value = {};
  }
  const currentUnitId = props.unitData ? props.unitData['戶別'] : null;
  const allParkingLotsForProject = props.allData && props.allData['車位'] ? props.allData['車位'] : [];
  const hasExistingParkingInUnitData = props.unitData && props.unitData['持有車位'] && Array.isArray(props.unitData['持有車位']) && props.unitData['持有車位'].length > 0;
  if (currentUnitId && allParkingLotsForProject.length > 0 && !hasExistingParkingInUnitData) {
      const assignedParkings = allParkingLotsForProject
          .filter(parkingLot => parkingLot['購買戶別'] === currentUnitId)
          .map(parkingLot => {
              return {
                  '車位編號': parkingLot['車位編號'],
                  '車位尺寸': parkingLot['車位尺寸'],
                  '車位類別': parkingLot['車位類別'],
                  '車位坪數': parkingLot['車位坪數'],
                  '車位總價': parkingLot['車位總價'],
                  '車位底價': parkingLot['車位底價'],
                  '車位狀態': parkingLot['銷控狀態'],
                  '車位成交價': parkingLot['車位成交價'] || parkingLot['車位總價'] || 0,
              };
          });
      editingData.value['持有車位'] = assignedParkings;
  } else if (hasExistingParkingInUnitData) {
      const enrichedExistingParkings = (props.unitData['持有車位'] || []).map(existingParking => {
          const fullParkingData = allParkingLotsForProject.find(p => p['車位編號'] === existingParking['車位編號']);
          if (fullParkingData) {
              return {
                  ...fullParkingData,
                  ...existingParking,
                  '車位成交價': existingParking['車位成交價'] !== undefined ? existingParking['車位成交價'] : (fullParkingData['車位總價'] || 0),
              };
          }
          return existingParking;
      });
      editingData.value['持有車位'] = enrichedExistingParkings;
  } else if (!editingData.value['持有車位']) {
      editingData.value['持有車位'] = [];
  }
  isEditing.value = true;
}

function cancelEditing() {
  isEditing.value = false;
  editingData.value = null;
}

async function saveChanges() {
  if (!editingData.value) return;
  isSaving.value = true;
  savingText.value = '儲存中，請稍候...';
  try {
      const data = editingData.value;
      const parkingSalePrice = (data['持有車位'] || []).reduce((sum, p) => sum + (Number(p.車位成交價) || 0), 0);
      const totalSalePrice = (Number(data['房屋成交價']) || 0) + parkingSalePrice;
      const houseArea = Number(props.unitData['房屋面積(坪)']);
      const unitSalePrice = houseArea > 0 ? ((Number(data['房屋成交價']) || 0) / houseArea) : 0;
      const baseHousePrice = Number(props.unitData['房屋總底價']) || 0;
      const baseParkingPrice = (data['持有車位'] || []).reduce((sum, p) => {
          const originalSpot = props.allData['車位'].find(op => op['車位編號'] === p['車位編號']);
          return sum + (Number(originalSpot?.['車位底價']) || 0);
      }, 0);
      const priceDifference = totalSalePrice - (baseHousePrice + baseParkingPrice);
      const payload = {
          projectName: props.projectName,
          unitId: props.unitData['戶別'],
          salesData: {
              '銷控後台狀態': data['銷控後台狀態'], '銷售': data['銷售'],
              '小訂日期': data['小訂日期'], '補足日期': data['補足日期'], '簽約日期': data['簽約日期'],
              '小訂金額': data['小訂金額'], '補足金額': data['補足金額'], '簽約金額': data['簽約金額'],
              '房屋成交價': data['房屋成交價'], '備註': data['備註'],
              '車位': (data['持有車位'] || []).map(p => p.車位編號).join(','),
              '車位成交價': parkingSalePrice,
              '成交總價': totalSalePrice,
              '房屋成交單價': unitSalePrice,
              '溢差價': priceDifference,
              '合約方式': data['合約方式'],
              '是否首購': data['是否首購'],
          },
          buyerData: {
              '買方姓名': data['買方姓名'], '身分證字號': data['身分證字號'], '出生年月日': data['出生年月日'],
              '電話': data['電話'], 'EMAIL': data['EMAIL'],
              '通訊地址_縣市': data['通訊地址_縣市'] || '', '通訊地址_區域': data['通訊地址_區域'] || '', '通訊地址_詳細': data['通訊地址_詳細'] || '',
              '戶籍地址_縣市': data['戶籍地址_縣市'] || '', '戶籍地址_區域': data['戶籍地址_區域'] || '', '戶籍地址_詳細': data['戶籍地址_詳細'] || '',
              '通訊地址': `${data['通訊地址_縣市'] || ''}${data['通訊地址_區域'] || ''}${data['通訊地址_詳細'] || ''}`,
              '戶籍地址': `${data['戶籍地址_縣市'] || ''}${data['戶籍地址_區域'] || ''}${data['戶籍地址_詳細'] || ''}`,
              '性別': data['性別'], '婚姻狀況': data['婚姻狀況'], '行業別': data['行業別'], '職務': data['職務'],
              '購買用途': data['購買用途'], '已購買富宇房子': data['已購買富宇房子'],
              '緊急聯絡人': data['緊急聯絡人'], '緊急聯絡人電話': data['緊急聯絡人電話'], '緊急聯絡人關係': data['緊急聯絡人關係'],
              '介紹人姓名': data['介紹人姓名'], '介紹人電話': data['介紹人電話']
          },
          parkingData: data['持有車位'] || []
      };
      
      const result = await updateSalesData(payload);
      if (result.status !== 'success') throw new Error(result.message);
      
      alert('儲存成功！');
      emit('data-updated');
      close();
  } catch (error) {
      console.error('儲存失敗:', error);
      alert(`儲存失敗: ${error.message}`);
  } finally {
      isSaving.value = false;
  }
}

const hasFloorplans = computed(() => props.unitData?.floorplans && props.unitData.floorplans.length > 0);
const canAddToQuote = computed(() => (props.unitData && props.unitData['銷控狀態'] !== '已售'));
const addToQuoteButtonText = computed(() => '加入報價');

function handleAddToQuote() {
  if (props.unitData && canAddToQuote.value) quoteStore.addItem(props.unitData);
}

const firstPlan = computed(() => hasFloorplans.value ? props.unitData.floorplans[0] : null);
const proxiedFirstImageUrl = computed(() => {
  if (firstPlan.value && firstPlan.value.type === 'image' && firstPlan.value.url) {
      return `${IMAGE_PROXY_BASE_URL}/api/image-proxy?url=${encodeURIComponent(firstPlan.value.url)}`;
  }
  return '';
});

const shouldHidePrice = computed(() => props.viewMode === 'quote' && props.unitData?.['銷控狀態'] === '已售');

watch(() => props.show, (newVal) => {
  if (newVal) {
      tab.value = 'info';
      if (isEditing.value) cancelEditing();
  }
});

function close() {
  if (isEditing.value) cancelEditing();
  emit('update:show', false);
}

function formatNumber(value, frac = 0) {
  if (value === null || value === undefined || String(value).trim() === '') {
      return frac > 0 ? (0).toFixed(frac) : '0';
  }
  const num = Number(value);
  if (isNaN(num)) return 'N/A';
  return num.toLocaleString('en-US', {
      minimumFractionDigits: frac,
      maximumFractionDigits: frac
  });
}

function formatPercentage(value) {
  if (typeof value !== 'number' || isNaN(value)) {
      return 'N/A';
  }
  return `${(value * 100).toFixed(2)}%`;
}
</script>

<style scoped>
.header-section { flex-shrink: 0; position: relative; z-index: 2; background-color: white; box-shadow: 0 2px 4px -1px rgba(0,0,0,0.2); }
.header-section .v-card-title { background-color: #1a3a6e; color: white; }
.main-content { flex-grow: 1; overflow-y: auto; position: relative; }
.footer-section { flex-shrink: 0; }
.info-section { padding: 8px; border: 1px solid #e0e0e0; border-radius: 8px; height: 100%; }
.top-info-row .info-section { height: 100%; }
.section-title { font-size: 1.1rem; font-weight: 600; color: #1a3a6e; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #1a3a6e; }
.highlight-price { font-size: 1.8rem !important; font-weight: 700 !important; color: #c62828 !important; }
.highlight-price-base { font-size: 1.5rem !important; font-weight: 500 !important; color: #455a64 !important; }
/* ✅ 新增：成交價的 CSS 樣式 */
.highlight-price-final { 
  font-size: 1.5rem !important; 
  font-weight: 700 !important; 
  color: #2E7D32 !important; 
}


:deep(.v-list-item-title) { font-size: 0.9rem; }
:deep(.v-list-item--density-compact .v-list-item-title) { font-size: 0.85rem; }
:deep(.v-list-item-subtitle) { line-height: normal; -webkit-line-clamp: unset !important; line-clamp: unset !important; }
.preview-area-full { 
  position: relative;
  width: 100%;
  height: 100%;
  display: flex; 
  justify-content: center; 
  align-items: center; 
  padding: 16px; 
  box-sizing: border-box; 
  background-color: #eceff1; 
}
.preview-content { 
  max-width: 100%; 
  max-height: 75vh; 
  object-fit: contain; 
  display: block; 
  border: none; 
}
.blur-background :deep(.v-overlay__scrim) {
  background: rgba(30, 30, 30, 0.5) !important;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.total-area-card { display: flex; align-items: center; background-color: #F5F5F5; padding: 12px 16px; border-radius: 8px; }
.area-summary-item { display: flex; align-items: center; flex: 1; }
.total-area-title { font-size: 0.9rem; color: #555; }
.total-area-value { font-size: 1.5rem; font-weight: 700; color: #1A237E; line-height: 1.2; }
.total-area-subtitle { font-size: 0.8rem; color: #777; }
.area-details { font-size: 0.9rem; }
.area-group { border: 1px solid #ECEFF1; border-radius: 6px; padding: 8px; height: 100%; }
.area-group-title { font-weight: 600; color: #37474F; margin-bottom: 8px; }
.area-item-header { display: grid; grid-template-columns: 2fr 1fr 1fr; font-weight: 500; color: #78909C; padding: 2px 4px; border-bottom: 1px solid #CFD8DC; font-size: 0.8rem; }
.area-item-header span:not(:first-child),
.area-item span:not(:first-child) { text-align: right; }
.area-item { display: grid; grid-template-columns: 2fr 1fr 1fr; padding: 4px; border-bottom: 1px solid #f0f0f0; }
.area-item:last-child { border-bottom: none; }
.area-ping-value { font-weight: 600 !important; font-size: 1.2em; color: #1A237E; }

.sizing-tool-btn {
  position: absolute;
  bottom: 24px;
  right: 24px;
  z-index: 1;
}
</style>