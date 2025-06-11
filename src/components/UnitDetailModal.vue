<!-- /src/components/UnitDetailModal.vue -->
<template>
  <v-dialog :model-value="show" @update:model-value="close" max-width="80vw" height="90vh" scrollable>
    <v-card class="d-flex flex-column" style="height: 100%;">
      <v-card-title class="d-flex justify-space-between align-center text-h5 sticky-top">
        <span>{{ unitData ? unitData['戶別'] : '詳細資訊' }}</span>
        <v-btn icon="mdi-close" variant="text" @click="close"></v-btn>
      </v-card-title>
      
      <v-divider></v-divider>

      <v-tabs v-model="tab" color="primary" grow>
        <v-tab value="info">詳細資訊</v-tab>
        <v-tab value="floorplans" :disabled="!hasFloorplans">平面圖</v-tab>
      </v-tabs>

      <v-divider></v-divider>

      <v-card-text class="flex-grow-1" style="overflow-y: auto;">
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
                          <template v-slot:subtitle>
                            <span class="highlight-price">{{ formatNumber(unitData['房屋總表價']) }} 萬</span>
                          </template>
                          <template v-slot:prepend><v-icon>mdi-cash-multiple</v-icon></template>
                        </v-list-item>
                        <v-list-item title="單價(表價)">
                          <template v-slot:subtitle>
                            <span class="highlight-price">{{ formatNumber(unitData['房屋單價(表價)']) }} 萬/坪</span>
                          </template>
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
                      <v-list-item>
                        <v-list-item-title>主建物(室內)</v-list-item-title>
                        <template v-slot:append><span>{{ formatNumber(unitData['主建物面積(坪)']) }} 坪</span></template>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>附屬建物(陽台)</v-list-item-title>
                        <template v-slot:append><span>{{ formatNumber(unitData['附屬建物面積(坪)']) }} 坪</span></template>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>共用部分(公設)</v-list-item-title>
                        <template v-slot:append><span>{{ formatNumber(unitData['共用部分面積(坪)']) }} 坪</span></template>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title>露臺(不計坪)</v-list-item-title>
                        <template v-slot:append><span>{{ formatNumber(unitData['露臺(坪)']) }} 坪</span></template>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title class="font-weight-bold">公設比</v-list-item-title>
                        <template v-slot:append><span class="font-weight-bold">{{ formatPercentage(unitData['公設比']) }}</span></template>
                      </v-list-item>
                    </v-list>
                  </div>
                </v-col>
              </v-row>
            </div>
            <div v-else class="text-center pa-5">
              <p>沒有可顯示的資料。</p>
            </div>
          </v-window-item>

          <!-- 平面圖分頁 -->
          <v-window-item value="floorplans">
            <div v-if="hasFloorplans" class="floorplan-viewer">
             

              <!-- 右側：預覽區域 -->
<div class="preview-area">
  <template v-if="selectedPlan">
    
    <!-- ✅ 3. 將 img 的 src 綁定到新的計算屬性 -->
    <img 
      v-if="selectedPlan.type === 'image'" 
      :src="proxiedImageUrl" 
      class="preview-content" 
      alt="平面圖預覽"
    />

    <!-- PDF 的 a 標籤保持不變，因為它不需要通過代理 -->
    <a v-if="selectedPlan.type === 'pdf'" :href="selectedPlan.url" target="_blank" class="pdf-link">
      在新分頁中打開 PDF: {{ selectedPlan.name }}
    </a>
  </template>
                <div v-else class="text-center text-grey">
                  <v-icon size="large">mdi-selection-search</v-icon>
                  <p>請從左側選擇要預覽的圖檔</p>
                </div>
              </div>
            </div>
             <div v-else class="text-center pa-5 text-grey">
                <v-icon size="x-large">mdi-image-off</v-icon>
                <p class="mt-2">此戶別尚無平面圖資料</p>
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="sticky-bottom">
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="text" @click="close">關閉</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed, defineProps, defineEmits } from 'vue';
// ✅ 1. 從 api.js 導入我們新定義的常量
import { IMAGE_PROXY_BASE_URL } from '@/api';

const props = defineProps({
  show: { type: Boolean, required: true },
  unitData: { type: Object, default: () => null },
  viewMode: { type: String, default: 'sales' }
});

const emit = defineEmits(['update:show']);

const tab = ref('info');
const selectedPlanIndex = ref(0);

const hasFloorplans = computed(() => props.unitData?.floorplans && props.unitData.floorplans.length > 0);

const selectedPlan = computed(() => {
  if (hasFloorplans.value) {
    return props.unitData.floorplans[selectedPlanIndex.value];
  }
  return null;
});

const shouldHidePrice = computed(() => {
  return props.viewMode === 'quote' && props.unitData?.['銷控狀態'] === '已售';
});

watch(() => props.show, (newVal) => {
  if (newVal) {
    tab.value = 'info';
    selectedPlanIndex.value = 0;
  }
});

// ✅ 2. 創建一個計算屬性來生成完整的代理 URL
const proxiedImageUrl = computed(() => {
  if (props.unitData && selectedPlan.value && selectedPlan.value.type === 'image') {
    // 確保 selectedPlan.value.url 存在
    if (selectedPlan.value.url) {
      return `${IMAGE_PROXY_BASE_URL}/image-proxy?url=${encodeURIComponent(selectedPlan.value.url)}`;
    }
  }
  return ''; // 如果沒有圖片或 URL，返回空字符串
});

function close() {
  emit('update:show', false);
}

function formatNumber(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return 'N/A';
  // 如果是整數，就不顯示小數點
  if (num % 1 === 0) {
    return num.toLocaleString();
  }
  // 如果是小數，最多顯示兩位
  return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatPercentage(value) {
  const num = parseFloat(value);
  return isNaN(num) ? 'N/A' : `${(num * 100).toFixed(2)} %`;
}
</script>

<style scoped>
/* 固定標題和底部 */
.sticky-top {
  position: sticky;
  top: 0;
  z-index: 2;
  background-color: #1a3a6e;
  color: white;
}
.sticky-bottom {
  position: sticky;
  bottom: 0;
  z-index: 2;
  background-color: white;
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
.total-area-title {
  font-size: 0.9rem;
  color: #5c6bc0;
}
.total-area-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1a237e;
}

/* 價格突出顯示樣式 */
.highlight-price {
  font-size: 1.5rem !important;
  font-weight: 700 !important;
  color: #D32F2F !important;
}

/* Vuetify 列表微調 */
:deep(.v-list-item-title) {
  font-size: 0.9rem;
}
:deep(.v-list-item--density-compact .v-list-item-title) {
  font-size: 0.85rem;
}
:deep(.v-list-item-subtitle) {
  line-height: normal;
   line-clamp: unset !important;
}

/* 平面圖查看器佈局 */
.floorplan-viewer {
  display: flex;
  /* 高度由外層容器的 flex-grow-1 和 overflow: auto 來控制 */
  height: 100%;
  max-height: calc(90vh - 180px); /* 提供一個最大高度參考 */
}
.floorplan-list {
  width: 250px;
  flex-shrink: 0;
  border-right: 1px solid #e0e0e0;
  overflow-y: auto;
}
.preview-area {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px;
  background-color: #eceff1;
}
.preview-content {
  max-width: 100%;
  max-height: 100%;
  width: 100%;
  height: 100%;
  border: none;
  object-fit: contain;
}

@media (max-width: 768px) {
  /* 讓查看器變成垂直佈局 */
  .floorplan-viewer {
    flex-direction: column;
  }

  /* 隱藏左側列表 (即使有多張圖) */
  .floorplan-list {
    display: none; 
    /* 或者如果你想在頂部顯示一個下拉選單，可以保留它但修改樣式 */
  }

  /* 讓預覽區域佔滿全部空間 */
  .preview-area {
    width: 100%;
    height: 100%;
    padding: 0; /* 移除邊距以獲得最大空間 */
  }
}
</style>