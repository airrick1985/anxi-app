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
                <v-tab value="floorplans" :disabled="!unitData || !unitData.svgName">平面圖</v-tab>
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
                    :all-sales-images="allProjectImages"
                    :all-parking-data="allData['車位'] || []"
                    @request-open-slide="$emit('request-open-slide')"
                    :contract-type-options="contractTypeOptions"
                    :first-purchase-options="firstPurchaseOptions"
                />
            </template>
            <template v-else>
                <div v-if="unitData" class="pa-2">
                    <v-row>
                        <v-col cols="12" md="7">
                            <div v-if="householdImages.length > 0" class="carousel-viewer-container">
                                <v-carousel v-model="currentImageIndex" height="auto" hide-delimiters show-arrows="hover">
                                    <v-carousel-item v-for="image in householdImages" :key="image.id">
                                        <v-img :src="image.downloadURL" class="main-carousel-image" contain @click="openFullscreenViewer" style="cursor: zoom-in;"></v-img>
                                    </v-carousel-item>
                                </v-carousel>
                                <div class="small-thumbnails-strip">
                                    <div v-for="(image, index) in householdImages" :key="image.id" class="small-thumbnail-wrapper" :class="{ 'thumbnail-active': index === currentImageIndex }" @click="currentImageIndex = index">
                                        <v-img :src="image.downloadURL" aspect-ratio="16/9" cover></v-img>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="info-section d-flex align-center justify-center text-grey-darken-1" style="height: 100%; min-height: 250px;">
                                <span><v-icon class="mr-2">mdi-image-multiple-outline</v-icon>此戶別尚無圖片</span>
                            </div>
                        </v-col>

                        <v-col cols="12" md="5">
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
                                        <div class="area-group-title"> <v-icon size="small" class="mr-1">mdi-home</v-icon>建物面積明細</div>
                                        <div class="area-item-header"><span>項目</span><span>坪數</span><span>m²</span></div>
                                        <div class="area-item"><span>主建物 (室內)</span><span class="area-ping-value">{{ formatNumber(unitData.area_main_ping, 2) }}</span><span>{{ formatNumber(unitData.area_main_sqm, 2) }}</span></div>
                                        <div class="area-item"><span>附屬建物 (陽台)</span><span class="area-ping-value">{{ formatNumber(unitData.area_ancillary_ping, 2) }}</span><span>{{ formatNumber(unitData.area_ancillary_sqm, 2) }}</span></div>
                                        <div class="area-item"><span>共用部分 (公設)</span><span class="area-ping-value">{{ formatNumber(unitData.area_common_ping, 2) }}</span><span>{{ formatNumber(unitData.area_common_sqm, 2) }}</span></div>
                                        <div class="area-item"><span>露臺 (不計坪)</span><span class="area-ping-value">{{ formatNumber(unitData.area_terrace_ping, 2) }}</span></div>
                                    </div>
                                </div> <div class="area-details mt-2">
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

                    <v-row class="mt-2">
                        <v-col cols="12">
                            <div class="info-section">
                                <div class="section-title">價格資訊</div>
                                <v-row dense>
                                    <v-col cols="12" sm="4">
                                        <div class="price-block">
                                            <div class="price-block-title">房屋表價</div>
                                            <div class="price-block-value text-red-darken-2">
                                                {{ formatNumber(unitData.price_list_house_total) }} <span class="price-block-currency">萬</span>
                                            </div>
                                            <div class="price-block-unit">({{ calculatedUnitPrice }} 萬/坪)</div>
                                        </div>
                                    </v-col>
                                    <v-col v-if="viewMode === 'sales'" cols="12" sm="4">
                                        <div class="price-block">
                                            <div class="price-block-title">房屋底價</div>
                                            <div class="price-block-value text-grey-darken-2">
                                                {{ formatNumber(unitData.price_floor_house_total) }} <span class="price-block-currency">萬</span>
                                            </div>
                                            <div class="price-block-unit">({{ calculatedBaseUnitPrice }} 萬/坪)</div>
                                        </div>
                                    </v-col>
                                    <v-col v-if="viewMode === 'sales' && unitData.price_transaction_house" cols="12" sm="4">
                                        <div class="price-block">
                                            <div class="price-block-title">房屋成交價</div>
                                            <div class="price-block-value text-green-darken-2">
                                                {{ formatNumber(unitData.price_transaction_house) }} <span class="price-block-currency">萬</span>
                                            </div>
                                            <div class="price-block-unit">({{ calculatedTransactionUnitPrice }} 萬/坪)</div>
                                        </div>
                                    </v-col>
                                </v-row>
                            </div>
                        </v-col>
                    </v-row>
                    
                    <div v-if="viewMode === 'sales'">
                        <v-divider class="my-4"></v-divider>
                        <v-row>
                            <v-col cols="12" md="4">
                                <div class="info-section">
                                    <div class="section-title">成交總覽</div>
                                    <v-list dense>
                                        <v-list-item title="房屋成交價" :subtitle="`${formatNumber(houseTransactionPrice)} 萬`"></v-list-item>
                                        <v-list-item title="車位總價(成交)" :subtitle="`${formatNumber(parkingTotalTransactionPrice)} 萬`"></v-list-item>
                                        <v-list-item class="font-weight-bold total-price-item"><v-list-item-title>最終成交總價</v-list-item-title><template v-slot:append><span class="highlight-price-final">{{ formatNumber(grandTotalTransactionPrice) }} 萬</span></template></v-list-item>
                                        <v-list-item class="font-weight-bold total-price-item"><v-list-item-title>合計底價</v-list-item-title><template v-slot:append><span class="highlight-price">{{ formatNumber(totalFloorPrice) }} 萬</span></template></v-list-item>
                                        <v-list-item title="溢差價" class="premium-price-item"><template v-slot:append><span :class="pricePremium >= 0 ? 'text-success' : 'text-error'" style="font-size: 1.1rem; font-weight: 600;">{{ formatNumber(pricePremium, 0) }} 萬</span></template></v-list-item>
                                    </v-list>
                                    <div class="section-subtitle mt-4">持有車位詳情</div>
                                    <v-alert v-if="assignedParkingLots.length === 0" type="info" variant="tonal" dense class="mt-2">此戶別未購買車位</v-alert>
                                    <div v-else class="parking-list"><div v-for="(parking, index) in assignedParkingLots" :key="index" class="parking-item"><p class="parking-title">車位 {{ index + 1 }}: {{ parking['車位編號'] }} ({{ parking['車位尺寸'] }})</p><p>底價: {{ formatNumber(parking['車位底價']) }} 萬</p><p>成交價: {{ formatNumber(parking['車位成交價']) }} 萬</p></div></div>
                                </div>
                            </v-col>
                            <v-col cols="12" md="4">
                                <div class="info-section">
                                    <div class="section-title">銷售資訊</div>
                                    <v-list dense><v-list-item title="銷控狀態" :subtitle="unitData.salesStatus_backend || '-'"></v-list-item><v-list-item title="銷售人員" :subtitle="unitData.salesperson || '-'"></v-list-item><v-list-item title="合約方式" :subtitle="unitData.contractType || '-'"></v-list-item><v-list-item title="是否首購" :subtitle="formatBoolean(unitData.isFirstTimeBuyer)"></v-list-item><v-list-item title="小訂日期" :subtitle="formatDate(unitData.payment_deposit_date)"></v-list-item><v-list-item title="簽約日期" :subtitle="formatDate(unitData.payment_contract_date)"></v-list-item><v-list-item title="備註"><v-list-item-subtitle style="white-space: pre-wrap;">{{ unitData.remarks || '-' }}</v-list-item-subtitle></v-list-item></v-list>
                                </div>
                            </v-col>
                            <v-col cols="12" md="4">
                                <div class="info-section">
                                    <div class="section-title">買方資訊</div>
                                    <v-list dense><v-list-item title="姓名" :subtitle="unitData.buyerName || '-'"></v-list-item><v-list-item title="電話" :subtitle="unitData.buyerPhone || '-'"></v-list-item><v-list-item title="身分證號" :subtitle="unitData.buyerIdNumber || '-'"></v-list-item><v-list-item title="通訊地址" :subtitle="formatAddress(unitData, 'Mailing')"></v-list-item><v-list-item title="戶籍地址" :subtitle="formatAddress(unitData, 'Permanent')"></v-list-item></v-list>
                                </div>
                            </v-col>
                        </v-row>
                    </div>
                </div>
                <div v-else class="text-center pa-5"><p>沒有可顯示的資料。</p></div>
            </template>
            </v-window-item>
         <v-window-item value="floorplans" class="fill-height pa-0">
                <div class="d-flex flex-column justify-center align-center fill-height text-center pa-4" style="background-color: #eceff1;">
                    <v-icon size="64" color="grey-darken-1">mdi-ruler-square-compass</v-icon>
                    <p class="text-h6 my-4">戶別平面圖測量</p>
                    <p class="text-grey-darken-2 mb-6">
                      此戶別已設定 SVG 平面圖。<br>
                      點擊下方按鈕以在新頁面中開啟測量工具。
                    </p>
                    <v-btn
                      v-if="unitData && unitData.unitId && projectName"
                      color="blue-darken-2"
                      variant="flat"
                      size="large"
                      :to="`/sizing-tool/${projectName}/${unitData.unitId}`"
                      target="_blank" 
                      elevation="4"
                      prepend-icon="mdi-launch"
                    >
                        開啟測量工具
                    </v-btn>
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

  <v-dialog v-model="fullscreenViewerDialog" fullscreen hide-overlay>
    <v-card color="black" class="fullscreen-viewer">
      <v-img
        v-if="currentImage"
        :src="currentImage.downloadURL"
        contain
        class="fullscreen-image"
        aspect-ratio="16/9"
      ></v-img>
      <template v-if="householdImages.length > 1">
        <v-btn
          class="image-nav-btn prev"
          icon="mdi-chevron-left"
          variant="flat"
          size="large"
          @click.stop="prevImage"
        ></v-btn>
        <v-btn
          class="image-nav-btn next"
          icon="mdi-chevron-right"
          variant="flat"
          size="large"
          @click.stop="nextImage"
        ></v-btn>
      </template>
      <v-btn
        class="close-btn"
        icon="mdi-close"
        variant="flat"
        @click="fullscreenViewerDialog = false"
      ></v-btn>

      <v-btn
        v-if="unitData && unitData.svgName"
        class="sizing-tool-btn"
        color="blue-darken-2"
        variant="flat"
        elevation="4"
        :to="`/sizing-tool/${projectName}/${unitData.unitId}`"
        target="_blank"
      >
        <v-icon left>mdi-ruler-square-compass</v-icon>
        開啟測量工具
      </v-btn>
      </v-card>
  </v-dialog>
  
</template>

<script setup>
// ✅ 移除 FloorplanSizing 的 import
import { useRouter } from 'vue-router'; 
import { ref, watch, computed, defineProps, defineEmits } from 'vue';
import { useDisplay } from 'vuetify';
import { useUserStore } from '@/store/user';
import { IMAGE_PROXY_BASE_URL, updateSalesData, cancelPurchase } from '@/api'; 
import SalesInfoForm from './SalesInfoForm.vue';
import { useQuoteStore } from '@/store/quoteStore'; 
import PaymentSettings from '@/views/PaymentSettings.vue'; 
import ConfirmationDialog from './ConfirmationDialog.vue';

// ... (所有 props, emits, computed, methods 等邏輯維持不變) ...

const userStore = useUserStore();
const showCancelDialog = ref(false);
const savingText = ref('儲存中，請稍候...');

const isSold = computed(() => {
  return props.unitData && props.unitData.salesStatus_backend;
});

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

const currentImageIndex = ref(0);
const fullscreenViewerDialog = ref(false);
const allProjectImages = computed(() => props.allData['銷控圖片'] || []);

const householdImages = computed(() => {
  if (!props.unitData?.salesImages?.length || !allProjectImages.value.length) {
    return [];
  }
  const imageMap = new Map(allProjectImages.value.map(img => [img.imageName, img]));
  return props.unitData.salesImages
    .map(name => imageMap.get(name))
    .filter(Boolean);
});

const currentImage = computed(() => {
  if (householdImages.value.length === 0) return null;
  return householdImages.value[currentImageIndex.value];
});

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
// ✅ 移除 sizingToolDialog
// const sizingToolDialog = ref(false); 

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

const enrichedUnitData = computed(() => {
  if (!props.unitData) return null;
  const enriched = JSON.parse(JSON.stringify(props.unitData));
  const allParkingLotsForProject = props.allData?.['車位'] || [];
  const currentUnitId = props.unitData.unitId;

  const assignedParkings = allParkingLotsForProject
    .filter(parkingLot => parkingLot.buyerUnitId === currentUnitId)
    .map(parkingLot => ({
      '車位編號': parkingLot.spotId,
      '車位尺寸': parkingLot.size,
      '車位類別': parkingLot.type,
      '車位坪數': parkingLot.area_ping || 'N/A',
      '車位總價': parkingLot.price_list,
      '車位底價': parkingLot.price_floor,
      '車位狀態': parkingLot.status,
      '車位成交價': parkingLot.price_transaction !== undefined && parkingLot.price_transaction !== null 
                    ? parkingLot.price_transaction 
                    : (parkingLot.price_list || 0),
    }));

  enriched['持有車位'] = assignedParkings;
  return enriched;
});

const assignedParkingLots = computed(() => enrichedUnitData.value?.['持有車位'] || []);
const houseTransactionPrice = computed(() => Number(props.unitData?.price_transaction_house) || 0);
const parkingTotalTransactionPrice = computed(() => {
  if (!assignedParkingLots.value || assignedParkingLots.value.length === 0) return 0;
  return assignedParkingLots.value.reduce((total, parking) => total + (Number(parking['車位成交價']) || 0), 0);
});
const grandTotalTransactionPrice = computed(() => houseTransactionPrice.value + parkingTotalTransactionPrice.value);
const houseFloorPrice = computed(() => Number(props.unitData?.price_floor_house_total) || 0);
const parkingTotalFloorPrice = computed(() => {
  if (!assignedParkingLots.value || assignedParkingLots.value.length === 0) return 0;
  return assignedParkingLots.value.reduce((total, parking) => total + (Number(parking['車位底價']) || 0), 0);
});
const totalFloorPrice = computed(() => houseFloorPrice.value + parkingTotalFloorPrice.value);
const pricePremium = computed(() => {
  if (grandTotalTransactionPrice.value > 0 && totalFloorPrice.value > 0) {
    return grandTotalTransactionPrice.value - totalFloorPrice.value;
  }
  return 0;
});

const statusOptions = computed(() => (props.allData['參數'] || []).map(p => p.statusName));
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



function openPaymentSettings() {
  paymentSettingsDialog.value = true;
}

function startEditing() {
  editingData.value = JSON.parse(JSON.stringify(props.unitData || {}));
  if (!editingData.value) {
      editingData.value = {};
  }
  const currentUnitId = props.unitData ? props.unitData.unitId : null;
  const allParkingLotsForProject = props.allData && props.allData['車位'] ? props.allData['車位'] : [];
  
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

async function saveChanges() {
  if (!editingData.value) return;
  isSaving.value = true;
  savingText.value = '儲存中，請稍候...';
  try {
      const data = editingData.value;
      const payload = {
          projectName: props.projectName,
          unitId: props.unitData.unitId, 
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

const shouldHidePrice = computed(() => props.viewMode === 'quote' && props.unitData?.salesStatus_quote === '已售');

const nextImage = () => {
  if (householdImages.value.length > 1) {
    currentImageIndex.value = (currentImageIndex.value + 1) % householdImages.value.length;
  }
};

const prevImage = () => {
  if (householdImages.value.length > 1) {
    currentImageIndex.value = (currentImageIndex.value - 1 + householdImages.value.length) % householdImages.value.length;
  }
};

const openFullscreenViewer = () => {
  if (currentImage.value) {
    fullscreenViewerDialog.value = true;
  }
};

watch(() => props.show, (newVal) => {
  if (newVal) {
      tab.value = 'info';
      currentImageIndex.value = 0; 
      if (isEditing.value) cancelEditing();
  }
});

function close() {
  if (isEditing.value) cancelEditing();
  emit('update:show', false);
}

function formatNumber(value, frac = 0) {
  if (value === null || value === undefined || String(value).trim() === '') return frac > 0 ? (0).toFixed(frac) : '0';
  const num = Number(value);
  if (isNaN(num)) return 'N/A';
  return num.toLocaleString('en-US', { minimumFractionDigits: frac, maximumFractionDigits: frac });
}

function formatPercentage(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return 'N/A';
  return `${(num * 100).toFixed(2)}%`;
}

function formatBoolean(value) {
  if (value === true) return '是';
  if (value === false) return '否';
  return '-';
}

function formatDate(timestamp) {
  if (!timestamp || typeof timestamp.toDate !== 'function') return '-';
  try {
    return timestamp.toDate().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch (e) {
    return '無效日期';
  }
}

function formatAddress(data, type) {
    if (!data) return '-';
    const city = data[`buyer${type}AddressCity`] || '';
    const district = data[`buyer${type}AddressDistrict`] || '';
    const detail = data[`buyer${type}AddressDetail`] || '';
    const fullAddress = `${city}${district}${detail}`;
    return fullAddress || '-';
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
.section-subtitle { font-size: 1rem; font-weight: 500; color: #37474f; margin-bottom: 8px; }
.highlight-price { font-size: 1.8rem !important; font-weight: 700 !important; color: #c62828 !important; }
.highlight-price-base { font-size: 1.5rem !important; font-weight: 500 !important; color: #455a64 !important; }
.highlight-price-final { 
  font-size: 1.8rem !important; 
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

.total-price-item {
  border-top: 1px solid #e0e0e0;
  margin-top: 8px;
  padding-top: 8px;
}

.parking-list {
  max-height: 150px;
  overflow-y: auto;
  padding-right: 8px;
}

.parking-item {
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 8px;
  margin-top: 8px;
  font-size: 0.85rem;
}

.parking-item p {
  margin: 0;
  line-height: 1.5;
}

.parking-title {
  font-weight: 600;
  color: #1a3a6e;
}
/*  START: 新增樣式 */
.base-price-item, .premium-price-item {
  border-top: 1px solid #eee;
  margin-top: 4px;
  padding-top: 4px;
}
/*  END: 新增樣式 */



/*  START: 新增圖片瀏覽器樣式 */
.image-viewer-container {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.main-image-wrapper {
  background-color: #212121;
  position: relative;
}

.main-image {
  width: 100%;
  height: 45vh; /* 給定一個相對視窗的高度 */
  min-height: 300px;
}

.thumbnail-strip {
  background-color: #f5f5f5;
  padding: 8px;
}

thumbnail-image {
  /* ✅ 將寬度從 120px 修改為 90px */
  width: 90px;
  margin: 0 4px;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.2s ease-in-out;
}

.thumbnail-image:hover {
  border-color: #90caf9; /* Vuetify blue lighten-2 */
}

.thumbnail-active {
  border-color: #1976D2; /* Vuetify primary blue */
}
/*  END: 新增圖片瀏覽器樣式 */

/* ✅ 新增這個容器樣式 */
.fullscreen-image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
}

/* ✅ 修改 fullscreen-image 樣式 */
.fullscreen-image {
  width: 100%;
  max-width: 100%;
  height: 100%;
  max-height: 100%;
  object-fit: contain;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background-color: rgba(0, 0, 0, 0.4) !important;
  color: white !important;
  z-index: 10; /* 確保按鈕在最上層 */
}

/* ✅ START: 使用全新的圖片瀏覽器樣式 */
.carousel-viewer-container {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f5f5f5;
}

.main-carousel-image {
  height: 40vh; /* 主圖高度 */
  min-height: 250px;
  background-color: #212121;
}

.small-thumbnails-strip {
  display: flex;
  overflow-x: auto;
  padding: 8px;
  gap: 8px; /* 縮圖之間的間距 */
}

/* 讓捲動條更好看 (可選) */
.small-thumbnails-strip::-webkit-scrollbar {
  height: 6px;
}
.small-thumbnails-strip::-webkit-scrollbar-thumb {
  background-color: #ccc;
  border-radius: 3px;
}

.small-thumbnail-wrapper {
  /* ✅ 這裡控制小縮圖的大小 */
  width: 80px; 
  height: 45px; /* 維持 16:9 比例 */
  flex-shrink: 0; /* 避免縮圖被壓縮 */
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.2s ease-in-out;
  overflow: hidden; /* 確保圖片圓角 */
}

.small-thumbnail-wrapper:hover {
  border-color: #90caf9;
}

.thumbnail-active {
  border-color: #1976D2;
}

/* 輪播圖左右按鈕的樣式 (與之前相同) */
.image-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(0, 0, 0, 0.4) !important;
  color: white !important;
}
.image-nav-btn.prev {
  left: 16px;
}
.image-nav-btn.next {
  right: 16px;
}
/* ✅ END: 樣式取代結束 */

/* ✅ START: 新增價格區塊樣式 */
.price-block {
  padding: 12px;
  text-align: center;
  border: 1px solid #eee;
  border-radius: 8px;
  height: 100%;
}

.price-block-title {
  font-size: 0.9rem;
  color: #555;
  font-weight: 500;
  margin-bottom: 4px;
}

.price-block-value {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
}

.price-block-currency {
  font-size: 1rem;
  font-weight: 500;
  margin-left: 4px;
}

.price-block-unit {
  font-size: 0.9rem;
  color: #757575;
}
/* ✅ END: 新增樣式結束 */


</style>