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
          <p class="text-h6 text-black">儲存中，請稍候...</p>
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
                          <v-icon size="x-large" color="grey">mdi-currency-off</v-icon>
                          <p class="text-grey mt-2">此戶別已售，價格不顯示</p>
                        </div>
                      </template>
                      <template v-else>
                        <v-list lines="two" dense>
                          <v-list-item title="房價 (表價)">
                            <template v-slot:subtitle><span class="highlight-price">{{ formatNumber(unitData['房屋總表價']) }} 萬</span></template>
                            <template v-slot:prepend><v-icon>mdi-cash-multiple</v-icon></template>
                          </v-list-item>
                          <v-list-item title="單價 (表價)">
                            <template v-slot:subtitle><span class="highlight-price">{{ formatNumber(unitData['房屋單價(表價)']) }} 萬/坪</span></template>
                            <template v-slot:prepend><v-icon>mdi-chart-line</v-icon></template>
                          </v-list-item>
                          <template v-if="viewMode === 'sales'">
                            <v-divider class="my-2"></v-divider>
                            <v-list-item title="房價 (底價)" class="mt-2">
                              <template v-slot:subtitle><span class="highlight-price-base">{{ formatNumber(unitData['房屋總底價']) }} 萬</span></template>
                              <template v-slot:prepend><v-icon color="grey-darken-1">mdi-alpha-b-box-outline</v-icon></template>
                            </v-list-item>
                            <v-list-item title="單價 (底價)">
                              <template v-slot:subtitle><span class="highlight-price-base">{{ formatNumber(unitData['房屋單價(底價)']) }} 萬/坪</span></template>
                              <template v-slot:prepend><v-icon color="grey-darken-1">mdi-chart-line-variant</v-icon></template>
                            </v-list-item>
                          </template>
                        </v-list>
                      </template>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-section">
                      <div class="section-title">面積資訊</div>
                      <div class="total-area-card">
                        <v-icon size="large" class="mr-3">mdi-texture-box</v-icon>
                        <div>
                          <div class="total-area-title">房屋總面積</div>
                          <div class="total-area-value">{{ formatNumber(unitData['房屋面積(坪)']) }} 坪</div>
                        </div>
                      </div>
                      <v-list lines="one" dense class="mt-2">
                        <v-list-item><v-list-item-title>主建物(室內)</v-list-item-title><template v-slot:append><span>{{ formatNumber(unitData['主建物面積(坪)']) }} 坪</span></template></v-list-item>
                        <v-list-item><v-list-item-title>附屬建物(陽台)</v-list-item-title><template v-slot:append><span>{{ formatNumber(unitData['附屬建物面積(坪)']) }} 坪</span></template></v-list-item>
                        <v-list-item><v-list-item-title>共用部分(公設)</v-list-item-title><template v-slot:append><span>{{ formatNumber(unitData['共用部分面積(坪)']) }} 坪</span></template></v-list-item>
                        <v-list-item><v-list-item-title>露臺(不計坪)</v-list-item-title><template v-slot:append><span>{{ formatNumber(unitData['露臺(坪)']) }} 坪</span></template></v-list-item>
                        <v-list-item><v-list-item-title class="font-weight-bold">公設比</v-list-item-title><template v-slot:append><span class="font-weight-bold">{{ formatPercentage(unitData['公設比']) }}</span></template></v-list-item>
                      </v-list>
                    </div>
                  </v-col>
                </v-row>
                <div v-if="viewMode === 'sales'">
                  <v-divider class="my-4"></v-divider>
                <SalesInfoSection
                  v-if="viewMode === 'sales'"
                  :sales-data="unitData"
                  :all-parking-data="allData['車位'] || []"
                />
                </div>
              </div>
              <div v-else class="text-center pa-5"><p>沒有可顯示的資料。</p></div>
            </template>
          </v-window-item>

          <v-window-item value="floorplans" class="fill-height">
            <div v-if="hasFloorplans" class="preview-area-full">
              <img v-if="firstPlan.type === 'image'" :src="proxiedFirstImageUrl" class="preview-content" alt="平面圖預覽" />
              <a v-if="firstPlan.type === 'pdf'" :href="firstPlan.url" target="_blank" class="pdf-link">在新分頁中打開 PDF: {{ firstPlan.name }}</a>
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
        <v-card-actions>
          <v-spacer></v-spacer>
          <template v-if="isEditing">
            <v-btn color="grey-darken-1" variant="text" @click="cancelEditing">取消</v-btn>
            <v-btn color="success" variant="flat" @click="saveChanges" :loading="isSaving">儲存變更</v-btn>
          </template>
          <template v-else>
            <v-btn v-if="viewMode === 'quote'" color="success" variant="flat" @click="handleAddToQuote" :disabled="!canAddToQuote">
              <v-icon left>mdi-plus-box-outline</v-icon>
              {{ addToQuoteButtonText }}
            </v-btn>
            <v-btn color="primary" variant="text" @click="close">關閉</v-btn>
          </template>
        </v-card-actions>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed, defineProps, defineEmits } from 'vue';
import { useDisplay } from 'vuetify'; // 匯入 useDisplay
import SalesInfoSection from './SalesInfoSection.vue';
import SalesInfoForm from './SalesInfoForm.vue';
import { IMAGE_PROXY_BASE_URL, updateSalesData } from '@/api';
import { useQuoteStore } from '@/store/quoteStore'; 

const { mobile: isMobile } = useDisplay(); // 設置 isMobile 變數

const quoteStore = useQuoteStore();

const props = defineProps({
  show: { type: Boolean, required: true },
  unitData: { type: Object, default: () => null },
  viewMode: { type: String, default: 'sales' },
  allData: { type: Object, default: () => ({}) },
  projectName: { type: String, required: true }, 
});


const emit = defineEmits(['update:show', 'data-updated', 'request-open-slide']);

const tab = ref('info');
const isEditing = ref(false);
const isSaving = ref(false);
const editingData = ref(null);

// 從 allData prop 中解析出下拉選單需要的選項
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


function startEditing() {
  //待刪
  console.log('傳入 UnitDetailModal 的 unitData:', props.unitData);
  // 深拷貝一份 unitData 到 editingData，這是表單操作的基礎
  editingData.value = JSON.parse(JSON.stringify(props.unitData || {}));

  // 確保 editingData.value 不是 null
  if (!editingData.value) {
    editingData.value = {};
  }

  // 獲取當前戶別ID
  const currentUnitId = props.unitData ? props.unitData['戶別'] : null;
  
  // 獲取建案的所有車位資料
  const allParkingLotsForProject = props.allData && props.allData['車位'] ? props.allData['車位'] : [];

  // 檢查 props.unitData 中是否已存在 '持有車位' 且不為空
  // 這是為了尊重可能已經在「銷控」表中手動維護的車位數據
  const hasExistingParkingInUnitData = props.unitData && props.unitData['持有車位'] && Array.isArray(props.unitData['持有車位']) && props.unitData['持有車位'].length > 0;

  if (currentUnitId && allParkingLotsForProject.length > 0 && !hasExistingParkingInUnitData) {
    const assignedParkings = allParkingLotsForProject
      .filter(parkingLot => parkingLot['購買戶別'] === currentUnitId)
      .map(parkingLot => {
        // 確保返回的物件結構與 ParkingEditModal 和 SalesInfoForm 期望的一致
        // ParkingEditModal 需要 '車位編號', '車位坪數', '車位總價'(表價), '車位狀態', '車位底價' (用於計算), '車位成交價' (用於編輯)
        // SalesInfoForm 的計算依賴 '車位編號', '車位成交價', '車位底價'
        return {
          '車位編號': parkingLot['車位編號'],
          '車位區域': parkingLot['車位區域'],
          '車位類別': parkingLot['車位類別'],
          '車位坪數': parkingLot['車位坪數'],
          '車位總價': parkingLot['車位總價'], // 假設這是表價
          '車位底價': parkingLot['車位底價'], // 用於計算溢差價
          '車位狀態': parkingLot['銷控狀態'], // 假設車位表中的銷控狀態就是車位本身的狀態
          '車位成交價': parkingLot['車位成交價'] || parkingLot['車位總價'] || 0, // 初始化成交價，若無則用表價，再無則0
          // 其他可能需要的欄位，可以從 parkingLot 添加
          // ...parkingLot // 如果 parkingLot 的其他欄位也需要，可以展開
        };
      });
    
    // 賦值給 editingData.value['持有車位']
    // 如果 editingData.value['持有車位'] 之前不存在，這會創建它
    editingData.value['持有車位'] = assignedParkings;
    
  } else if (hasExistingParkingInUnitData) {
    // 如果 props.unitData 中已有 '持有車位'，則 editingData.value['持有車位'] 應該已經從深拷貝中獲得了
    // 但我們需要確保這些已有的車位數據也包含所有必要欄位，特別是那些可能不存在於原始 '銷控' 表 '車位' 欄位中的詳細車位屬性
    // 例如，銷控表的 '車位' 可能只存了車位編號，但我們需要從 allParkingLotsForProject 補充其他信息
    const enrichedExistingParkings = (props.unitData['持有車位'] || []).map(existingParking => {
      const fullParkingData = allParkingLotsForProject.find(p => p['車位編號'] === existingParking['車位編號']);
      if (fullParkingData) {
        return {
          ...fullParkingData, // 從車位總表獲取完整資訊
          ...existingParking, // 用已有的 (可能包含成交價等) 覆蓋
          '車位成交價': existingParking['車位成交價'] !== undefined ? existingParking['車位成交價'] : (fullParkingData['車位總價'] || 0),
        };
      }
      return existingParking; // 如果在總表中找不到，則保留原樣
    });
    editingData.value['持有車位'] = enrichedExistingParkings;

  } else if (!editingData.value['持有車位']) {
    // 如果上述條件都不滿足 (例如沒有 currentUnitId，或沒有車位總表數據，或銷控表也沒有車位數據)，
    // 確保 '持有車位' 至少是一個空陣列，以避免後續操作出錯
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

    // ▼▼▼ 【主要修改區域】 ▼▼▼
    // 準備要發送的 payload
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
      },
      buyerData: {
        // --- 基本買方資料 ---
        '買方姓名': data['買方姓名'], '身分證字號': data['身分證字號'], '出生年月日': data['出生年月日'],
        '電話': data['電話'], 'EMAIL': data['EMAIL'],
        
        // --- 【修正】地址欄位：將拆分的欄位全部發送 ---
        '通訊地址_縣市': data['通訊地址_縣市'] || '',
        '通訊地址_區域': data['通訊地址_區域'] || '',
        '通訊地址_詳細': data['通訊地址_詳細'] || '',
        '戶籍地址_縣市': data['戶籍地址_縣市'] || '',
        '戶籍地址_區域': data['戶籍地址_區域'] || '',
        '戶籍地址_詳細': data['戶籍地址_詳細'] || '',
        
        // --- 為了安全起見，也保留合併後的欄位 ---
        '通訊地址': `${data['通訊地址_縣市'] || ''}${data['通訊地址_區域'] || ''}${data['通訊地址_詳細'] || ''}`,
        '戶籍地址': `${data['戶籍地址_縣市'] || ''}${data['戶籍地址_區域'] || ''}${data['戶籍地址_詳細'] || ''}`,
        
        // --- 其他買方資料 ---
        '性別': data['性別'], '婚姻狀況': data['婚姻狀況'], '行業別': data['行業別'], '職務': data['職務'],
        '購買用途': data['購買用途'], '已購買富宇房子': data['已購買富宇房子'],
        '緊急聯絡人': data['緊急聯絡人'], '緊急聯絡人電話': data['緊急聯絡人電話'], '緊急聯絡人關係': data['緊急聯絡人關係'],
        '介紹人姓名': data['介紹人姓名'], '介紹人電話': data['介紹人電話']
      },
      parkingData: data['持有車位'] || []
    };
    // ▲▲▲ 【主要修改區域】 ▲▲▲
    
    const result = await updateSalesData(payload); //
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
function formatNumber(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return 'N/A';
  if (num % 1 === 0) return num.toLocaleString();
  return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
function formatPercentage(value) {
  const num = parseFloat(value);
  return isNaN(num) ? 'N/A' : `${(num * 100).toFixed(2)} %`;
}
</script>

<style scoped>
/* style 內容維持不變 */
.header-section { flex-shrink: 0; position: relative; z-index: 2; background-color: white; box-shadow: 0 2px 4px -1px rgba(0,0,0,0.2); }
.header-section .v-card-title { background-color: #1a3a6e; color: white; }
.main-content { flex-grow: 1; overflow-y: auto; position: relative; }
.footer-section { flex-shrink: 0; }
.info-section { padding: 8px; border: 1px solid #e0e0e0; border-radius: 8px; }
.top-info-row .info-section { height: 100%; }
.section-title { font-size: 1.1rem; font-weight: 600; color: #1a3a6e; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #1a3a6e; }
.total-area-card { display: flex; align-items: center; background-color: #e8eaf6; padding: 16px; border-radius: 6px; border-left: 5px solid #3f51b5; }
.total-area-title { font-size: 0.9rem; color: #5c6bc0; }
.total-area-value { font-size: 1.8rem; font-weight: 700; color: #1a237e; }
.highlight-price { font-size: 1.8rem !important; font-weight: 700 !important; color: #c62828 !important; }
.highlight-price-base { font-size: 1.5rem !important; font-weight: 500 !important; color: #455a64 !important; }
:deep(.v-list-item-title) { font-size: 0.9rem; }
:deep(.v-list-item--density-compact .v-list-item-title) { font-size: 0.85rem; }
:deep(.v-list-item-subtitle) { line-height: normal; -webkit-line-clamp: unset !important; line-clamp: unset !important; }
.preview-area-full { display: flex; justify-content: center; align-items: center; padding: 16px; box-sizing: border-box; background-color: #eceff1; }
.preview-content { max-width: 100%; max-height: 650px; object-fit: contain; display: block; border: none; }
.blur-background :deep(.v-overlay__scrim) {
  background: rgba(30, 30, 30, 0.5) !important;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
</style>