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
                    :statusOptions="statusOptions"
                    :personnelOptions="personnelOptions"
                    :allSalesImages="allProjectImages"
                    :allParkingData="allData['車位'] || []"
                    :projectName="projectName"
                    :project-id="projectId" 
                    :view-mode="props.viewMode"
                     @request-open-slide="$emit('request-open-slide')"
                    @parking-updated="handleParkingUpdate"
                    :contractTypeOptions="props.contractTypes" :firstPurchaseOptions="firstPurchaseOptions"
                />
            </template>
            <template v-else>
                <div v-if="unitData" class="pa-2">
                    <v-row>
                        <v-col cols="12" md="6">
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

                        <v-col cols="12" md="3">
                            <div class="info-section">
                                <div class="section-title"> {{ unitData.unitId }} 面積資訊</div>
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
                  
          <v-col cols="12" md="3">
                <div class="info-section">
                    <div class="section-title"> {{ unitData.unitId }} 價格資訊</div>
                    <v-row dense>
                        <v-col cols="12"> 
                            <div class="price-block mb-2"> 
                                <div class="price-block-title">房價</div>
                                <template v-if="props.viewMode === 'quote' && unitData.salesStatus_quote === '已售'">
                                    <div class="price-block-value text-grey">
                                        已售不提供報價
                                    </div>
                                    <div class="price-block-unit">&nbsp;</div>
                                </template>
                                <template v-else>
                                    <div class="price-block-value text-red-darken-2">
                                        {{ formatNumber(unitData.price_list_house_total) }} <span class="price-block-currency">萬</span>
                                    </div>
                                    <div class="price-block-unit">({{ calculatedUnitPrice }} 萬/坪)</div>
                                </template>
                            </div>
                        </v-col>
                        <v-col v-if="viewMode === 'sales'" cols="12">
                            <div class="price-block mb-2">
                                <div class="price-block-title">房屋底價</div>
                                <div class="price-block-value text-grey-darken-2">
                                    {{ formatNumber(unitData.price_floor_house_total) }} <span class="price-block-currency">萬</span>
                                </div>
                                <div class="price-block-unit">({{ calculatedBaseUnitPrice }} 萬/坪)</div>
                            </div>
                        </v-col>
                        <v-col v-if="viewMode === 'sales' && unitData.price_transaction_house" cols="12">
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
                                    <div class="section-title"> {{ unitData.unitId }} 成交總覽</div>
                                    <v-list dense>
                                        <v-list-item title="房屋成交" :subtitle="`${formatNumber(houseTransactionPrice)} 萬`"></v-list-item>
                                        <v-list-item title="車位成交" :subtitle="`${formatNumber(parkingTotalTransactionPrice)} 萬`"></v-list-item>
                                        <v-list-item class="font-weight-bold total-price-item"><v-list-item-title>成交總價</v-list-item-title><template v-slot:append><span class="highlight-price-final">{{ formatNumber(grandTotalTransactionPrice) }} 萬</span></template></v-list-item>
                                        <v-list-item class="font-weight-bold total-price-item"><v-list-item-title>合計底價</v-list-item-title><template v-slot:append><span class="highlight-price">{{ formatNumber(totalFloorPrice) }} 萬</span></template></v-list-item>
                                        <v-list-item title="溢差價" class="premium-price-item"><template v-slot:append><span :class="pricePremium >= 0 ? 'text-success' : 'text-error'" style="font-size: 1.1rem; font-weight: 600;">{{ formatNumber(pricePremium, 0) }} 萬</span></template></v-list-item>
                                    </v-list>
                                    <div class="section-subtitle mt-4">持有車位</div>
                                    <v-alert v-if="assignedParkingLots.length === 0" type="info" variant="tonal" dense class="mt-2">此戶別未購買車位</v-alert>
                                    <div v-else class="parking-list"><div v-for="(parking, index) in assignedParkingLots" :key="index" class="parking-item"><p class="parking-title">車位 {{ index + 1 }}: {{ parking['車位編號'] }} ({{ parking['車位尺寸'] }})</p><p>底價: {{ formatNumber(parking['車位底價']) }} 萬</p><p>成交: {{ formatNumber(parking['車位成交價']) }} 萬</p></div></div>
                                </div>
                            </v-col>
                            <v-col cols="12" md="4">
                                <div class="info-section">
                                    <div class="section-title">{{ unitData.unitId }} 銷售資訊</div>
                                    <v-list dense><v-list-item title="銷控狀態" :subtitle="unitData.salesStatus_backend || '-'"></v-list-item><v-list-item title="銷售人員" :subtitle="unitData.salesperson || '-'"></v-list-item><v-list-item title="合約方式" :subtitle="unitData.contractType || '-'"></v-list-item><v-list-item title="是否首購" :subtitle="formatBoolean(unitData.isFirstTimeBuyer)"></v-list-item><v-list-item title="小訂日期" :subtitle="formatDate(unitData.payment_deposit_date)"></v-list-item><v-list-item title="簽約日期" :subtitle="formatDate(unitData.payment_contract_date)"></v-list-item><v-list-item title="備註"><v-list-item-subtitle style="white-space: pre-wrap;">{{ unitData.remarks || '-' }}</v-list-item-subtitle></v-list-item></v-list>
                                </div>
                            </v-col>
                            <v-col cols="12" md="4">
                                <div class="info-section">
                                    <div class="section-title">{{ unitData.unitId }} 買方資訊</div>
                                    <v-list dense><v-list-item title="姓名" :subtitle="unitData.buyerName || '-'"></v-list-item><v-list-item title="電話" :subtitle="unitData.buyerPhone || '-'"></v-list-item><v-list-item title="身分證號" :subtitle="unitData.buyerIdNumber || '-'"></v-list-item><v-list-item title="通訊地址" :subtitle="formatAddress(unitData, 'Mailing')"></v-list-item><v-list-item title="戶籍地址" :subtitle="formatAddress(unitData, 'Permanent')"></v-list-item></v-list>
                                </div>
                            </v-col>
                        </v-row>
                    </div>
                </div>
                <div v-else class="text-center pa-5"><p>沒有可顯示的資料。</p></div>
            </template>
            </v-window-item>
        
            </v-window>
        </v-card-text>
        
        <div class="footer-section custom-footer">

    <v-divider></v-divider>
    
    <v-card-actions>
      
      <template v-if="!isMobile">
        <v-spacer></v-spacer>
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
            color="primary"
            variant="flat"
            :href="unitData.driveFolderUrl"
            target="_blank"
          >
              <v-icon left>mdi-folder-google-drive</v-icon>
              {{ unitData.unitId }} 資料夾
            </v-btn>
            <v-btn color="success" variant="flat" @click="handleAddToQuote" :disabled="!canAddToQuote">
                <v-icon left>mdi-home-plus-outline</v-icon>
                {{ addToQuoteButtonText }}
            </v-btn>
            <v-btn v-if="viewMode === 'sales'" color="secondary" variant="flat" @click="openPaymentSettings">
                <v-icon left>mdi-cash-register</v-icon>
                付款表設定
            </v-btn>
            <v-btn color="primary" variant="text" @click="close">關閉</v-btn>
        </template>
      </template>

      <template v-if="isMobile">
                <div class="d-flex justify-space-around w-100 mobile-actions-container">

          <template v-if="isEditing">
              <v-btn stacked variant="text" @click="cancelEditing" class="flex-grow-1">
                <v-icon>mdi-cancel</v-icon>
                <span class="text-caption">取消</span>
              </v-btn>
              <v-btn stacked variant="text" color="success" @click="saveChanges" :loading="isSaving" class="flex-grow-1">
                <v-icon>mdi-check-circle-outline</v-icon>
                <span class="text-caption">儲存</span>
              </v-btn>
          </template>
          <template v-else>
            <v-btn
              v-if="viewMode === 'sales' && isSold"
              stacked
              variant="text"
              color="error"
              class="flex-grow-1"
              @click="openCancelPurchaseDialog"
            >
              <v-icon>mdi-account-cancel-outline</v-icon>
              <span class="text-caption">退戶</span>
            </v-btn>
            
            <v-btn
              v-if="viewMode === 'sales' && unitData && unitData.driveFolderUrl"
              stacked
              variant="text"
              class="flex-grow-1"
              :href="unitData.driveFolderUrl"
              target="_blank"
            >
              <v-icon>mdi-folder-google-drive</v-icon>
              <span class="text-caption">資料夾</span>
            </v-btn>
            <v-btn
              stacked
              variant="text"
              color="success"
              class="flex-grow-1"
              @click="handleAddToQuote"
              :disabled="!canAddToQuote"
            >
              <v-icon>mdi-plus-box-outline</v-icon>
              <span class="text-caption">{{ addToQuoteButtonText }}</span>
            </v-btn>
            <v-btn
              v-if="viewMode === 'sales'"
              stacked
              variant="text"
              class="flex-grow-1"
              @click="openPaymentSettings"
            >
              <v-icon>mdi-cash-register</v-icon>
              <span class="text-caption">付款表</span>
            </v-btn>
            <v-btn
              stacked
              variant="text"
              class="flex-grow-1"
              @click="close"
            >
              <v-icon>mdi-close</v-icon>
              <span class="text-caption">關閉</span>
            </v-btn>
          </template>
        </div>
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
    :project-id="projectId" 
    :all-data="allData"
    :contract-types="props.contractTypes"
    @request-open-slide="$emit('request-open-slide')"
    @parking-updated="handleParkingUpdate"
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
        @click="openSizingTool"
      >
        <v-icon left>mdi-ruler-square-compass</v-icon>
        開啟測量工具
      </v-btn>
      </v-card>
  </v-dialog>
  
  <v-dialog
    v-model="sizingToolDialog"
    fullscreen
    hide-overlay
    transition="dialog-bottom-transition"
  >
    <FloorplanSizingTool
      v-if="sizingToolDialog && projectId && unitData"
      :project-id="projectId"
      :unit-id="unitData.unitId"
      @close="sizingToolDialog = false"
    />
  </v-dialog>
  
</template>

<script setup>
import FloorplanSizingTool from '@/views/FloorplanSizingTool.vue'; 
import { ref, watch, computed, defineProps, defineEmits, onUnmounted } from 'vue';
import { useDisplay } from 'vuetify';
import { useUserStore } from '@/store/user';
import { IMAGE_PROXY_BASE_URL, updateSalesData, cancelPurchase, updateParkingLot } from '@/api';
import SalesInfoForm from './SalesInfoForm.vue';
import { useQuoteStore } from '@/store/quoteStore'; 
import PaymentSettings from '@/views/PaymentSettings.vue'; 
import ConfirmationDialog from './ConfirmationDialog.vue';
import { useToast } from 'vue-toastification'; // ✅ [打勾] 1. 導入 useToast

const userStore = useUserStore();
const showCancelDialog = ref(false);
const savingText = ref('儲存中，請稍候...');
const toast = useToast(); // ✅ [打勾] 2. 實例化 toast

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
    console.log('🔍 [UnitDetailModal] 準備執行退戶:', {
      projectName: props.projectName,
      
      // 🔴 錯誤 (原本的寫法)：projectId 變數未定義
      // projectId: projectId.value, 
      
      // ✅ 正確修正：從 props 讀取
      projectId: props.projectId, 
      
      unitId: props.unitData.unitId,
      operatorName: userStore.user.name
    });
    
    const result = await cancelPurchase(
      props.projectName,
      
      // 🔴 錯誤 (原本的寫法)
      // projectId.value, 
      
      // ✅ 正確修正：
      props.projectId, 
      
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

const { mobile: isMobile } = useDisplay();
const quoteStore = useQuoteStore();

const props = defineProps({
  show: { type: Boolean, required: true },
  unitData: { type: Object, default: () => null },
  viewMode: { type: String, default: 'sales' },
  allData: { type: Object, default: () => ({}) },
  projectName: { type: String, required: true }, 
  contractTypes: { type: Array, default: () => [] },
  projectId: { type: String, required: true }, // ✅ 修正：新增這一行
  contractTypes: { type: Array, default: () => [] }
});

const emit = defineEmits(['update:show', 'data-updated', 'request-open-slide']);

const sizingToolDialog = ref(false);




const currentImageIndex = ref(0);
const fullscreenViewerDialog = ref(false);
const allProjectImages = computed(() => props.allData['銷控圖片'] || []);

const householdImages = computed(() => {
  // 🛠️ DEBUG: 添加調試信息
  if (import.meta.env.DEV) {
    console.log('🖼️ [UnitDetailModal] 圖片調試信息:', {
      unitId: props.unitData?.unitId,
      unitSalesImages: props.unitData?.salesImages,
      allProjectImagesCount: allProjectImages.value.length,
      allProjectImagesSample: allProjectImages.value.slice(0, 3).map(img => ({
        imageName: img.imageName,
        hasDownloadURL: !!img.downloadURL
      }))
    });
  }

  if (!props.unitData?.salesImages?.length || !allProjectImages.value.length) {
    if (import.meta.env.DEV) {
      console.log('🖼️ [UnitDetailModal] 圖片載入條件不滿足:', {
        hasSalesImages: !!props.unitData?.salesImages?.length,
        hasAllProjectImages: !!allProjectImages.value.length
      });
    }
    return [];
  }
  
  const imageMap = new Map(allProjectImages.value.map(img => [img.imageName, img]));
  const matchedImages = props.unitData.salesImages
    .map(name => imageMap.get(name))
    .filter(Boolean);
  
  // 🛠️ DEBUG: 記錄匹配結果
  if (import.meta.env.DEV) {
    console.log('🖼️ [UnitDetailModal] 圖片匹配結果:', {
      requestedImages: props.unitData.salesImages,
      matchedCount: matchedImages.length,
      matchedImages: matchedImages.map(img => img.imageName)
    });
  }
  
  return matchedImages;
});

const currentImage = computed(() => {
  if (householdImages.value.length === 0) return null;
  return householdImages.value[currentImageIndex.value];
});



const tab = ref('info');
const isEditing = ref(false);
const isSaving = ref(false);
const editingData = ref(null);
const paymentSettingsDialog = ref(false);

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

const personnelOptions = computed(() => {
    const list = props.allData['銷售人員'] || [];
    
    // 複製並排序
    return [...list].sort((a, b) => {
        // 確保 order 為數字，若無 order 則給予極大值排在最後
        const orderA = (a.order !== undefined && a.order !== null) ? Number(a.order) : 999999;
        const orderB = (b.order !== undefined && b.order !== null) ? Number(b.order) : 999999;
        
        // 升序排列
        if (orderA !== orderB) {
            return orderA - orderB;
        }
        // 若 order 相同，則依姓名排序
        return (a.name || '').localeCompare(b.name || '', 'zh-Hant');
    });
});

const contractTypeOptionsFromDB = computed(() => {
  if (props.projectSettings && Array.isArray(props.projectSettings.contractTypes)) {
    return props.projectSettings.contractTypes; 
  }
  return [];
});

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
          projectId: props.projectId, // ✅ 修正：改成讀取 props.projectId
          unitId: props.unitData.unitId, 
          data: data 
      };
      console.log('🔍 [UnitDetailModal] 準備儲存的資料:', {
          projectName: payload.projectName,
          projectId: payload.projectId,
          unitId: payload.unitId,
          dataFields: Object.keys(data)
      });
      
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

// 取得目前單位的銷控狀態
const currentSalesStatus = computed(() => {
  if (!props.unitData) return '';
  // 直接返回 backend 的銷控狀態，不設置預設值
  return props.unitData.salesStatus_backend || '';
});

// 檢查單位是否可以加入報價
const canAddToQuote = computed(() => {
  if (!props.unitData) return false;
  
  // 在報價模式下檢查銷售狀態
  if (props.viewMode === 'quote' && props.unitData.salesStatus_quote === '已售') {
    return false;
  }
  
  // 檢查必要的價格資訊
  const hasValidPrice = props.unitData.price_list_house_total > 0;
  
  return hasValidPrice;
});

// 動態計算加入報價按鈕的文字
const addToQuoteButtonText = computed(() => {
  if (!props.unitData) return '加入報價';
  
  // 在銷控模式下，只有當有狀態時才顯示
  if (props.viewMode === 'sales' && currentSalesStatus.value) {
    return `加入報價 (${currentSalesStatus.value})`;
  }
  
  return '加入報價';
});

// 處理加入報價
function handleAddToQuote() {
  if (!props.unitData) {
    toast.error('無法加入報價：缺少單位資料');
    return;
  }
  
  if (!canAddToQuote.value) {
    if (props.viewMode === 'quote' && props.unitData.salesStatus_quote === '已售') {
      toast.error('報價模式下無法加入已售出的單位');
    } else {
      toast.error('此單位目前無法加入報價');
    }
    return;
  }

  // 確保必要資料的完整性
  console.log('Adding unit with area:', props.unitData.area_house_ping);
  const unitData = {
    ...props.unitData,
    房屋總表價: props.unitData.price_list_house_total,
    戶別: props.unitData.unitId,
    area_house_ping: Number(props.unitData.area_house_ping),  // 主要面積，確保轉換為數字
    area_main_ping: props.unitData.area_main_ping,  // 主建物面積
    area_ancillary_ping: props.unitData.area_ancillary_ping,  // 附屬建物面積
    area_common_ping: props.unitData.area_common_ping,  // 共用部分面積
    area_terrace_ping: props.unitData.area_terrace_ping,  // 露臺面積
    common_area_ratio: props.unitData.common_area_ratio,  // 公設比
    area_main_sqm: props.unitData.area_main_sqm,  // 主建物平方公尺
    area_ancillary_sqm: props.unitData.area_ancillary_sqm,  // 附屬建物平方公尺
    area_common_sqm: props.unitData.area_common_sqm,  // 共用部分平方公尺
  };

  // ✅ [打勾] 3. 捕捉 addItem 的回傳值
  const success = quoteStore.addItem(unitData);

  // ✅ [打勾] 4. 根據回傳值顯示 toast
  if (success) {
    toast.success(`戶別 ${unitData.戶別} 成功加入報價`);
  }
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

const openSizingTool = () => {
  if (fullscreenViewerDialog.value) {
    fullscreenViewerDialog.value = false;
  }
  sizingToolDialog.value = true;
};

watch(() => props.show, (newVal) => {
  if (newVal) {
      tab.value = 'info';
      currentImageIndex.value = 0; 
      if (isEditing.value) cancelEditing();
  } else {
      sizingToolDialog.value = false;
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

// 📋 處理車位更新事件
async function handleParkingUpdate(parkingUpdateData) {
    try {
        console.log('🚗 [UnitDetailModal] 處理車位更新:', parkingUpdateData);
        
        const { unitId, parkingList } = parkingUpdateData;
        const allParkingData = props.allData?.['車位'] || [];
        
        // 🔄 步驟1：清除該戶別原有的車位關聯
        const currentOwnedParkings = allParkingData.filter(p => p.buyerUnitId === unitId);
        
        for (const parking of currentOwnedParkings) {
            const docId = parking.id; // Firestore 文件 ID
            if (docId) {
                // ✅ 【修正】僅更新銷售相關欄位，不影響管理員控制的欄位
                await updateParkingLot(docId, {
                    buyerUnitId: null,
                    buyerName: null,
                    price_transaction: null,
                    status: null,
                    status_backend: null,
                    salesperson: null,
                    remarks: null,
                    updatedAt: new Date()
                    // 🔒 不更新以下管理員欄位：floor, number, price_floor, price_list, projectId, size, slidePosition, spotId, type
                });
                console.log(`🚗 清除車位 ${parking.spotId} 的買方關聯`);
            }
        }
        
        // 🔄 步驟2：設定新的車位關聯
        for (const newParking of parkingList) {
            // 找到對應的車位文件
            const existingParking = allParkingData.find(p => p.spotId === newParking.spotId);
            if (existingParking && existingParking.id) {
                // ✅ 【修正】僅更新銷售相關欄位，不影響管理員控制的欄位
                await updateParkingLot(existingParking.id, {
                    buyerUnitId: unitId,
                    buyerName: editingData.value?.buyerName || null,
                    price_transaction: newParking.price_transaction || null,
                    status: '已售',
                    status_backend: editingData.value?.salesStatus_backend || null,
                    salesperson: editingData.value?.salesperson || null,
                    remarks: newParking.remarks || null,
                    updatedAt: new Date()
                    // 🔒 不更新以下管理員欄位：floor, number, price_floor, price_list, projectId, size, slidePosition, spotId, type
                });
                console.log(`🚗 設定車位 ${newParking.spotId} 給戶別 ${unitId}`);
            }
        }
        
        console.log('🚗 車位更新完成，資料將透過 Firestore 監聽器自動同步');
    } catch (error) {
        console.error('🚗 處理車位更新失敗:', error);
        alert(`車位更新失敗: ${error.message}`);
    }
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
.base-price-item, .premium-price-item {
  border-top: 1px solid #eee;
  margin-top: 4px;
  padding-top: 4px;
}



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
  height: 45vh; 
  min-height: 300px;
}

.thumbnail-strip {
  background-color: #f5f5f5;
  padding: 8px;
}

.thumbnail-image {
  width: 90px;
  margin: 0 4px;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.2s ease-in-out;
}

.thumbnail-image:hover {
  border-color: #90caf9;
}

.thumbnail-active {
  border-color: #1976D2;
}

.fullscreen-image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
}

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
  z-index: 10;
}

.carousel-viewer-container {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f5f5f5;
}

.main-carousel-image {
  height: 40vh; 
  min-height: 250px;
  background-color: #212121;
}

.small-thumbnails-strip {
  display: flex;
  overflow-x: auto;
  padding: 8px;
  gap: 8px;
}

.small-thumbnails-strip::-webkit-scrollbar {
  height: 6px;
}
.small-thumbnails-strip::-webkit-scrollbar-thumb {
  background-color: #ccc;
  border-radius: 3px;
}

.small-thumbnail-wrapper {
  width: 80px; 
  height: 45px; 
  flex-shrink: 0; 
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.2s ease-in-out;
  overflow: hidden; 
}

.small-thumbnail-wrapper:hover {
  border-color: #90caf9;
}

.thumbnail-active {
  border-color: #1976D2;
}

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

.custom-footer {
  padding-top: 5px;
  padding-bottom: 5px;
  min-height: 30px; 
  display: flex;
  flex-direction: column;
  justify-content: center;
}

</style>