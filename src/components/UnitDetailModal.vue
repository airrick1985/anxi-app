<!-- /src/components/UnitDetailModal.vue -->
<template>
  <v-dialog :model-value="show" @update:model-value="close" max-width="80vw" height="90vh">
    <v-card class="d-flex flex-column" style="height: 100%; overflow: hidden;">
      
      <!-- 1. 固定的頭部區域 -->
      <div class="header-section">
        <v-card-title class="d-flex justify-space-between align-center text-h5">
          <span>{{ unitData ? unitData['戶別'] : '詳細資訊' }}</span>
          <v-btn icon="mdi-close" variant="text" @click="close"></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-tabs v-model="tab" color="primary" grow>
          <v-tab value="info">詳細資訊</v-tab>
          <v-tab value="floorplans" :disabled="!hasFloorplans">平面圖</v-tab>
        </v-tabs>
        <v-divider></v-divider>
      </div>

      <!-- 2. 主要內容區域 (唯一可滾動的區域) -->
      <v-card-text class="main-content">
        <v-window v-model="tab">
          <!-- 詳細資訊分頁 -->
          <v-window-item value="info">
        <div v-if="unitData" class="pa-2">
          <v-row>
            <!-- 左側：價格資訊 -->
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
            <v-list-item title="房價">
              <template v-slot:subtitle><span class="highlight-price">{{ formatNumber(unitData['房屋總表價']) }} 萬</span></template>
                          <template v-slot:prepend><v-icon>mdi-cash-multiple</v-icon></template>
                        </v-list-item>
                        <v-list-item title="單價">
                          <template v-slot:subtitle><span class="highlight-price">{{ formatNumber(unitData['房屋單價(表價)']) }} 萬/坪</span></template>
                          <template v-slot:prepend><v-icon>mdi-chart-line</v-icon></template>
                        </v-list-item>
                      </v-list>
                    </template>
                  </div>
                </v-col>
                <!-- 右側：面積資訊 -->
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
              <v-divider class="my-4" v-if="viewMode === 'sales'"></v-divider>
              <SalesInfoSection v-if="viewMode === 'sales'" :sales-data="unitData" />
            </div>
            <div v-else class="text-center pa-5"><p>沒有可顯示的資料。</p></div>
          </v-window-item>

         <!-- ✅ --- 平面圖分頁 (結構簡化) --- ✅ -->
          <v-window-item value="floorplans" class="fill-height">
            <div v-if="hasFloorplans" class="preview-area-full">
              <!-- 直接顯示第一張圖 -->
              <img 
                v-if="firstPlan.type === 'image'" 
                :src="proxiedFirstImageUrl" 
                class="preview-content" 
                alt="平面圖預覽"
              />
              <a v-if="firstPlan.type === 'pdf'" :href="firstPlan.url" target="_blank" class="pdf-link">
                在新分頁中打開 PDF: {{ firstPlan.name }}
              </a>
            </div>
            <div v-else class="text-center pa-5 text-grey d-flex flex-column justify-center align-center fill-height">
              <v-icon size="x-large">mdi-image-off</v-icon>
              <p class="mt-2">此戶別尚無平面圖資料</p>
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>
      
 <!-- 3. 固定的底部區域 -->
      <div class="footer-section">
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          
          <!-- ✅ 6. 新增「加入報價」按鈕 -->
          <v-btn 
            v-if="viewMode === 'quote'" 
            color="success" 
            variant="flat" 
            @click="handleAddToQuote"
            :disabled="!canAddToQuote"
          >
            <v-icon left>mdi-plus-box-outline</v-icon>
            {{ addToQuoteButtonText }}
          </v-btn>

          <v-btn color="primary" variant="text" @click="close">關閉</v-btn>
        </v-card-actions>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed, defineProps, defineEmits } from 'vue';
import SalesInfoSection from './SalesInfoSection.vue';
import { IMAGE_PROXY_BASE_URL } from '@/api';
import { useQuoteStore } from '@/store/quoteStore'; 
const quoteStore = useQuoteStore();

const props = defineProps({
  show: { type: Boolean, required: true },
  unitData: { type: Object, default: () => null },
  viewMode: { type: String, default: 'sales' }
});

// ✅ 3. 新增計算屬性，判斷此戶別能否被加入報價
const canAddToQuote = computed(() => {
  if (!props.unitData) return false;
  
  // 檢查是否已在報價單中
  if (quoteStore.isItemInQuote(props.unitData['戶別'])) {
    return false;
  }

  // 檢查銷控狀態
  const salesStatus = props.unitData['銷控狀態'] || '';
  const backendStatus = props.unitData['銷控後台狀態'] || '';
  
  return salesStatus === '' && backendStatus === '';
});

// ✅ 4. 新增一個計算屬性，用於按鈕文本
const addToQuoteButtonText = computed(() => {
    if (!props.unitData) return '';
    return quoteStore.isItemInQuote(props.unitData['戶別']) ? '已在報價單中' : '加入報價';
});

// ✅ 5. 創建處理點擊事件的函數
function handleAddToQuote() {
  if (props.unitData) {
    quoteStore.addItem(props.unitData);
  }
}

const emit = defineEmits(['update:show']);

const tab = ref('info');
const selectedPlanIndex = ref(0);

const hasFloorplans = computed(() => props.unitData?.floorplans && props.unitData.floorplans.length > 0);

// 1. 新增：直接獲取第一張平面圖的數據
const firstPlan = computed(() => {
  const plan = hasFloorplans.value ? props.unitData.floorplans[0] : null;
  // ✅ 關鍵偵錯：打印第一張圖的詳細資訊
  console.log('--- Modal 內部 ---');
  console.log('第一張平面圖數據 (firstPlan):', JSON.parse(JSON.stringify(plan)));
  return plan;
});

// 2. 新增：為第一張圖生成代理 URL
const proxiedFirstImageUrl = computed(() => {
  if (firstPlan.value && firstPlan.value.type === 'image' && firstPlan.value.url) {
    const finalUrl = `${IMAGE_PROXY_BASE_URL}/api/image-proxy?url=${encodeURIComponent(firstPlan.value.url)}`;
    // ✅ 關鍵偵錯：打印最終生成的 URL
    console.log('最終生成的代理 URL (proxiedFirstImageUrl):', finalUrl);
    return finalUrl;
  }
  return '';
});

// `selectedPlanIndex` 和 `selectedPlan` 不再需要，可以刪除

const shouldHidePrice = computed(() => {
  return props.viewMode === 'quote' && props.unitData?.['銷控狀態'] === '已售';
});

watch(() => props.show, (newVal) => {
  if (newVal) {
    tab.value = 'info';
    // selectedPlanIndex.value = 0; <-- 也不再需要
  }
});

function close() { emit('update:show', false); }
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
/* 固定的頭部 */
.header-section {
  flex-shrink: 0; /* 防止被壓縮 */
  position: relative;
  z-index: 2;
  background-color: white;
  box-shadow: 0 2px 4px -1px rgba(0,0,0,0.2);
}
.header-section .v-card-title {
  background-color: #1a3a6e;
  color: white;
}

/* 主要內容區域 */
.main-content {
  flex-grow: 1;
  overflow-y: auto;
  position: relative; /* ✅ 關鍵：為絕對定位的子元素提供定位的「邊界」*/
}

/* 固定的底部 */
.footer-section {
  flex-shrink: 0; /* 防止被壓縮 */
}

/* 資訊區塊樣式 */
.info-section {
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  height: 100%;
}
.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a3a6e;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #1a3a6e;
}

/* 總面積卡片樣式 */
.total-area-card {
  display: flex;
  align-items: center;
  background-color: #e8eaf6;
  padding: 16px;
  border-radius: 6px;
  border-left: 5px solid #3f51b5;
}
.total-area-title { font-size: 0.9rem; color: #5c6bc0; }
.total-area-value { font-size: 1.8rem; font-weight: 700; color: #1a237e; }

/* 價格突出顯示樣式 */
.highlight-price {
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  color: #ff0000 !important;
}

/* Vuetify 列表微調 */
:deep(.v-list-item-title) { font-size: 0.9rem; }
:deep(.v-list-item--density-compact .v-list-item-title) { font-size: 0.85rem; }
:deep(.v-list-item-subtitle) {
  line-height: normal;
  -webkit-line-clamp: unset !important;
  line-clamp: unset !important;
}

/* 平面圖分頁的容器 */
.v-window-item[value="floorplans"] {
  /* 讓它可以作為絕對定位元素的容器 */
  position: relative;
  height: auto;
}

/* 預覽區域的容器 */
.preview-area-full {
  display: flex; /* 使用 Flexbox 進行居中 */
  justify-content: center;
  align-items: center;
  
  width: auto;; /* 寬度佔滿 */
  height: auto; /* 高度佔滿 */
  
  padding: 16px; /* 內邊距，讓圖片與邊框有間距 */
  box-sizing: border-box; /* 確保 padding 不會讓容器超出 100% */
  
  background-color: #eceff1;
  overflow: hidden; /* 關鍵：絕對不允許這個容器自己產生滾動條 */
}

/* 預覽的圖片本身 */
.preview-content {
  /* 關鍵 1：限制最大尺寸為其父容器的 100% */
  max-width: 100%;
  max-height: 650px;

  /* 關鍵 2：移除固定的 width 和 height，讓其自由縮放 */
  width: auto;
  height: auto;
  
  /* 關鍵 3：確保圖片保持比例並完整顯示 */
  object-fit: contain;

  /* 其他樣式 */
  display: block; /* 確保 img 是塊級元素，避免下方有不明間隙 */
  border: none;
}

/* 手機響應式 */
@media (max-width: 768px) {
  .floorplan-viewer { flex-direction: column; }
  .floorplan-list {
    width: 100%;
    height: auto;
    max-height: 150px;
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
  }
}
</style>