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
                <span>{{ unitData ? unitData.unitId : '詳細資訊' }}</span>
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
                            :contract-type-options="contractTypeOptions"
                            :first-purchase-options="firstPurchaseOptions"
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
                                                    <template v-slot:subtitle><span class="highlight-price">{{ formatNumber(unitData.price_list_house_total) }} 萬</span></template>
                                                    <template v-slot:prepend><v-icon>mdi-cash-multiple</v-icon></template>
                                                </v-list-item>
                                                <v-list-item title="單價">
                                                    <template v-slot:subtitle><span class="highlight-price">{{ calculatedUnitPrice }} 萬/坪</span></template>
                                                    <template v-slot:prepend><v-icon>mdi-chart-line</v-icon></template>
                                                </v-list-item>
                                                
                                                <template v-if="viewMode === 'sales'">
                                                    <v-divider class="my-2"></v-divider>
                                                    <v-list-item title="房價 (底價)" class="mt-2">
                                                        <template v-slot:subtitle><span class="highlight-price-base">{{ formatNumber(unitData.price_floor_house_total) }} 萬</span></template>
                                                        <template v-slot:prepend><v-icon color="grey-darken-1">mdi-alpha-b-box-outline</v-icon></template>
                                                    </v-list-item>
                                                    <v-list-item title="單價 (底價)">
                                                        <template v-slot:subtitle><span class="highlight-price-base">{{ calculatedBaseUnitPrice }} 萬/坪</span></template>
                                                        <template v-slot:prepend><v-icon color="grey-darken-1">mdi-chart-line-variant</v-icon></template>
                                                    </v-list-item>

                                                    <template v-if="unitData.price_transaction_house">
                                                        <v-divider class="my-2"></v-divider>
                                                        <v-list-item title="房價 (成交價)" class="mt-2">
                                                            <template v-slot:subtitle><span class="highlight-price-final">{{ formatNumber(unitData.price_transaction_house) }} 萬</span></template>
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
                                                <div class="total-area-value">{{ formatNumber(unitData.area_house_ping, 2) }} 坪</div>
                                                <div class="total-area-subtitle">{{ formatNumber(unitData.area_house_sqm, 2) }} m²</div>
                                             </div>
                                          </div>
                                          <v-divider vertical class="mx-4"></v-divider>
                                          <div class="area-summary-item">
                                             <div>
                                                <div class="total-area-title">公設比</div>
                                                <div class="total-area-value">{{ formatPercentage(unitData.common_area_ratio) }}</div>
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
                                                <span class="area-ping-value">{{ formatNumber(unitData.area_main_ping, 2) }}</span>
                                                <span>{{ formatNumber(unitData.area_main_sqm, 2) }}</span>
                                             </div>
                                             <div class="area-item">
                                                <span>附屬建物 (陽台)</span>
                                                <span class="area-ping-value">{{ formatNumber(totalAncillaryAreaPing, 2) }}</span>
                                                <span>{{ formatNumber(totalAncillaryAreaSqm, 2) }}</span>
                                             </div>
                                             <div class="area-item">
                                                <span>共用部分 (公設)</span>
                                                <span class="area-ping-value">{{ formatNumber(unitData.area_common_ping, 2) }}</span>
                                                <span>{{ formatNumber(unitData.area_common_sqm, 2) }}</span>
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
                                                 <span class="area-ping-value">{{ formatNumber(unitData.land_share_ping, 2) }}</span>
                                                <span>{{ formatNumber(unitData.land_share_sqm, 2) }}</span>
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
                  v-if="viewMode === 'sales' && unitData && unitData.driveFolderUrl"
                  color="teal"
                  variant="flat"
                  :href="unitData.driveFolderUrl"
                  target="_blank"
                >
                    <v-icon left>mdi-folder-google-drive</v-icon>
                    {{ unitData.unitId }} 資料夾
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
         <v-toolbar-title>平面圖測量工具 - {{ unitData ? unitData.unitId : '' }}</v-toolbar-title>
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
import { useRouter } from 'vue-router'; 
import { ref, watch, computed, defineProps, defineEmits } from 'vue';
import { useDisplay } from 'vuetify';
import { useUserStore } from '@/store/user';
// ✅【待辦】下一步我們將會修改 updateSalesData 和 cancelPurchase
import { IMAGE_PROXY_BASE_URL, updateSalesData, cancelPurchase } from '@/api'; 
import SalesInfoSection from './SalesInfoSection.vue';
import SalesInfoForm from './SalesInfoForm.vue';
import { useQuoteStore } from '@/store/quoteStore'; 
import PaymentSettings from '@/views/PaymentSettings.vue'; 
import FloorplanSizing from './FloorplanSizing.vue';
import ConfirmationDialog from './ConfirmationDialog.vue';

const userStore = useUserStore();

const showCancelDialog = ref(false);
const savingText = ref('儲存中，請稍候...');

// ✅ 修改：使用 salesStatus_backend
const isSold = computed(() => {
  return props.unitData && props.unitData.salesStatus_backend;
});

// ✅ 修改：使用 unitId
const cancelDialogMessage = computed(() => {
  const unitId = props.unitData ? `【${props.unitData.unitId}】` : '';
  return `您確定要為 ${unitId} 辦理退戶嗎？<br><br>此操作將會清除所有相關的銷售、客戶資料，並將車位釋出。<b>此動作無法復原。</b>`;
});

function openCancelPurchaseDialog() {
  showCancelDialog.value = true;
}

async function handleConfirmCancelPurchase() {
  if (!props.unitData || !userStore.user) {
    alert('缺少必要資訊，無法執行退戶。');
    return;
  }
  isSaving.value = true;
  savingText.value = '正在辦理退戶...';
  showCancelDialog.value = false;
  try {
    // ✅ 修改：使用 unitId
    const result = await cancelPurchase(
      props.projectName,
      props.unitData.unitId,
      userStore.user.name
    );
    if (result.status !== 'success') {
      throw new Error(result.message);
    }
    alert('退戶成功！');
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

const router = useRouter();
const { mobile: isMobile } = useDisplay();
const quoteStore = useQuoteStore();

const props = defineProps({
  show: { type: Boolean, required: true },
  unitData: { type: Object, default: () => null },
  viewMode: { type: String, default: 'sales' },
  allData: { type: Object, default: () => ({}) },
  projectName: { type: String, required: true }, 
});
const emit = defineEmits(['update:show', 'data-updated', 'request-open-slide']);

// ✅【注意】這裡的 '合約方式及是否首購' 來源於 allData，其結構可能也需要調整
const salesOptionsData = computed(() => props.allData['合約方式及是否首購'] || []);
const contractTypeOptions = computed(() => {
    return [...new Set(salesOptionsData.value.map(item => item['合約方式']).filter(Boolean))]
});
const firstPurchaseOptions = computed(() => {
    return [...new Set(salesOptionsData.value.map(item => item['是否首購']).filter(Boolean))]
});

const tab = ref('info');
const isEditing = ref(false);
const isSaving = ref(false);
const editingData = ref(null);
const paymentSettingsDialog = ref(false);
const sizingToolDialog = ref(false);

// ✅ 修改：更新價格計算屬性
const calculatedUnitPrice = computed(() => {
  const price = props.unitData?.price_list_house_total;
  const area = props.unitData?.area_house_ping;
  if (price && area > 0) {
    return formatNumber(price / area, 2);
  }
  return 'N/A';
});

const calculatedBaseUnitPrice = computed(() => {
  const price = props.unitData?.price_floor_house_total;
  const area = props.unitData?.area_house_ping;
  if (price && area > 0) {
    return formatNumber(price / area, 2);
  }
  return 'N/A';
});

const calculatedTransactionUnitPrice = computed(() => {
  const price = props.unitData?.price_transaction_house;
  const area = props.unitData?.area_house_ping;
  if (price && area > 0) {
    return formatNumber(price / area, 2);
  }
  return 'N/A';
});

// ✅ 新增：計算附屬建物總面積 (陽台+其他)
const totalAncillaryAreaPing = computed(() => {
    if (!props.unitData) return 0;
    return (props.unitData.area_terrace_ping || 0) + (props.unitData.area_ancillary_ping || 0);
});
const totalAncillaryAreaSqm = computed(() => {
    if (!props.unitData) return 0;
    return (props.unitData.area_terrace_sqm || 0) + (props.unitData.area_ancillary_sqm || 0);
});


// ✅ 修改：更新 enrichedUnitData 以匹配 salesParkings 結構
const enrichedUnitData = computed(() => {
  if (!props.unitData) return null;
  const enriched = JSON.parse(JSON.stringify(props.unitData));
  const allParkingLotsForProject = props.allData?.['車位'] || [];
  const currentUnitId = props.unitData.unitId;
  if (currentUnitId && allParkingLotsForProject.length > 0) {
    const assignedParkings = allParkingLotsForProject
      .filter(parkingLot => parkingLot.buyerUnitId === currentUnitId)
      .map(parkingLot => ({
        '車位編號': parkingLot.spotId,
        '車位尺寸': parkingLot.size,
        '車位類別': parkingLot.type,
        '車位坪數': parkingLot.area_ping || 'N/A', // 注意：新結構中無坪數，暫時替代
        '車位總價': parkingLot.price_list,
        '車位底價': parkingLot.price_floor,
        '車位狀態': parkingLot.status,
        '車位成交價': parkingLot.price_transaction !== undefined ? parkingLot.price_transaction : (parkingLot.price_list || 0),
      }));
    enriched['持有車位'] = assignedParkings;
  } else if (!enriched.parkingSpots) { // 使用 Firestore 的 parkingSpots 陣列作為後備
    enriched['持有車位'] = enriched.parkingSpots || [];
  }
  return enriched;
});

// ✅ 修改：更新 statusOptions 以匹配 salesParameters 結構
const statusOptions = computed(() => (props.allData['參數'] || []).map(p => p.statusName));
// ✅【待辦】銷售人員資料來源待確認，暫時維持舊邏輯
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

function openSizingTool() {
  sizingToolDialog.value = true;
}

function openPaymentSettings() {
  paymentSettingsDialog.value = true;
}

// ✅ 修改：更新 startEditing 以匹配新欄位
function startEditing() {
  editingData.value = JSON.parse(JSON.stringify(props.unitData || {}));
  if (!editingData.value) {
      editingData.value = {};
  }
  const currentUnitId = props.unitData ? props.unitData.unitId : null;
  const allParkingLotsForProject = props.allData && props.allData['車位'] ? props.allData['車位'] : [];
  
  // 檢查 enrichedUnitData 是否已經有車位資料
  const existingParkings = enrichedUnitData.value ? enrichedUnitData.value['持有車位'] : [];
  
  if (existingParkings && existingParkings.length > 0) {
      editingData.value['持有車位'] = JSON.parse(JSON.stringify(existingParkings));
  } else if (!editingData.value['持有車位']) {
      editingData.value['持有車位'] = [];
  }

  isEditing.value = true;
}


function cancelEditing() {
  isEditing.value = false;
  editingData.value = null;
}

// ✅【待辦】此函式將在下一步驟中被重構，以串接新的後端 API
async function saveChanges() {
  if (!editingData.value) return;
  isSaving.value = true;
  savingText.value = '儲存中，請稍候...';
  try {
      const data = editingData.value;
      // ... 舊的 payload 組合邏輯暫時保留 ...
      // 我們會在下一步驟完全替換掉這裡的 payload 和 API call
      const payload = {
          projectName: props.projectName,
          unitId: props.unitData.unitId, 
          // ... 其他舊資料 ...
      };
      
      const result = await updateSalesData(payload); // 呼叫舊 API (下一步會換掉)
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

// ✅ 修改：hasFloorplans 的來源可能也需要更新
const hasFloorplans = computed(() => props.unitData?.floorplans && props.unitData.floorplans.length > 0);
// ✅ 修改：使用 salesStatus_quote
const canAddToQuote = computed(() => (props.unitData && props.unitData.salesStatus_quote !== '已售'));
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

// ✅ 修改：使用 salesStatus_quote
const shouldHidePrice = computed(() => props.viewMode === 'quote' && props.unitData?.salesStatus_quote === '已售');

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
    // ✅ 修改：百分比欄位現在是字串，需先轉換為數字
  const num = parseFloat(value);
  if (isNaN(num)) {
      return 'N/A';
  }
  return `${(num * 100).toFixed(2)}%`;
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