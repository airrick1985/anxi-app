<template>
  <v-dialog :model-value="show" @update:model-value="close" max-width="80vw" height="90vh">
    <v-card class="d-flex flex-column" style="height: 100%; overflow: hidden;">
      
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

      <v-card-text class="main-content">
        <v-window v-model="tab">
          <v-window-item value="info">
            <div v-if="unitData" class="pa-2">
              <v-row>
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
              <v-divider class="my-4" v-if="viewMode === 'sales'"></v-divider>
              <SalesInfoSection v-if="viewMode === 'sales'" :sales-data="unitData" />
            </div>
            <div v-else class="text-center pa-5"><p>沒有可顯示的資料。</p></div>
          </v-window-item>

          <v-window-item value="floorplans" class="fill-height">
            <div v-if="hasFloorplans" class="preview-area-full">
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
      
      <div class="footer-section">
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          
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

const emit = defineEmits(['update:show']);

const tab = ref('info');

const hasFloorplans = computed(() => props.unitData?.floorplans && props.unitData.floorplans.length > 0);

const canAddToQuote = computed(() => {
  if (!props.unitData) return false;
  return props.unitData['銷控狀態'] !== '已售';
});

const addToQuoteButtonText = computed(() => {
  return '加入報價';
});

function handleAddToQuote() {
  if (props.unitData && canAddToQuote.value) {
    quoteStore.addItem(props.unitData);
  }
}

const firstPlan = computed(() => {
  return hasFloorplans.value ? props.unitData.floorplans[0] : null;
});

const proxiedFirstImageUrl = computed(() => {
  if (firstPlan.value && firstPlan.value.type === 'image' && firstPlan.value.url) {
    return `${IMAGE_PROXY_BASE_URL}/api/image-proxy?url=${encodeURIComponent(firstPlan.value.url)}`;
  }
  return '';
});

const shouldHidePrice = computed(() => {
  return props.viewMode === 'quote' && props.unitData?.['銷控狀態'] === '已售';
});

watch(() => props.show, (newVal) => {
  if (newVal) {
    tab.value = 'info';
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
  flex-shrink: 0;
  position: relative;
  z-index: 2;
  background-color: white;
  box-shadow: 0 2px 4px -1px rgba(0,0,0,0.2);
}
.header-section .v-card-title {
  background-color: #1a3a6e;
  color: white;
}
.main-content {
  flex-grow: 1;
  overflow-y: auto;
  position: relative;
}
.footer-section {
  flex-shrink: 0;
}
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
.highlight-price {
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  color: #c62828 !important; /* Slightly darker red */
}
/* ✅ 新增底價的樣式 */
.highlight-price-base {
  font-size: 1.5rem !important;
  font-weight: 500 !important;
  color: #455a64 !important; /* Blue Grey Darken-2 */
}
:deep(.v-list-item-title) { font-size: 0.9rem; }
:deep(.v-list-item--density-compact .v-list-item-title) { font-size: 0.85rem; }
:deep(.v-list-item-subtitle) {
  line-height: normal;
  -webkit-line-clamp: unset !important;
  line-clamp: unset !important;
}
.v-window-item[value="floorplans"] {
  position: relative;
  height: auto;
}
.preview-area-full {
  display: flex;
  justify-content: center;
  align-items: center;
  width: auto;
  height: auto;
  padding: 16px;
  box-sizing: border-box;
  background-color: #eceff1;
  overflow: hidden;
}
.preview-content {
  max-width: 100%;
  max-height: 650px;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
  border: none;
}
</style>