<!-- /src/components/UnitDetailModal.vue -->
<template>
  <v-dialog :model-value="show" @update:model-value="close" max-width="700px" scrollable>
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center text-h5 sticky-top">
        <!-- 標題顯示戶別 -->
        <span>{{ unitData ? unitData['戶別'] : '詳細資訊' }}</span>
        <v-btn icon="mdi-close" variant="text" @click="close"></v-btn>
      </v-card-title>
      
      <v-divider></v-divider>

      <v-card-text>
        <div v-if="unitData">
          <v-row>
            <!-- 左側：價格資訊 -->
            <v-col cols="12" md="6">
              <div class="info-section">
                <div class="section-title">價格資訊</div>
                <v-list lines="two" dense>
                  
                  <!-- ✅ 房價修改 -->
                  <v-list-item title="房價">
                    <!-- 使用 subtitle 插槽來自定義樣式 -->
                    <template v-slot:subtitle>
                      <span class="highlight-price">
                        {{ formatNumber(unitData['房屋總表價']) }} 萬
                      </span>
                    </template>
                    <template v-slot:prepend>
                      <v-icon>mdi-cash-multiple</v-icon>
                    </template>
                  </v-list-item>

                  <!-- ✅ 單價修改 -->
                  <v-list-item title="單價">
                    <template v-slot:subtitle>
                      <span class="highlight-price">
                        {{ formatNumber(unitData['房屋單價(表價)']) }} 萬/坪
                      </span>
                    </template>
                    <template v-slot:prepend>
                      <v-icon>mdi-chart-line</v-icon>
                    </template>
                  </v-list-item>

                </v-list>
              </div>
            </v-col>

            <!-- 右側：面積資訊 -->
            <v-col cols="12" md="6">
              <div class="info-section">
                <div class="section-title">面積資訊</div>
                
                <!-- 總面積，樣式突出 -->
                <div class="total-area-card">
                  <v-icon size="large" class="mr-3">mdi-texture-box</v-icon>
                  <div>
                    <div class="total-area-title">房屋面積</div>
                    <div class="total-area-value">{{ formatNumber(unitData['房屋面積(坪)']) }} 坪</div>
                  </div>
                </div>

                <!-- 細部面積 -->
                <v-list lines="one" dense class="mt-2">
                  <v-list-item>
                    <v-list-item-title>主建物(室內)</v-list-item-title>
                    <template v-slot:append>
                      <span>{{ formatNumber(unitData['主建物面積(坪)']) }} 坪</span>
                    </template>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>附屬建物(陽台)</v-list-item-title>
                    <template v-slot:append>
                      <span>{{ formatNumber(unitData['附屬建物面積(坪)']) }} 坪</span>
                    </template>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>共用部分(公設)</v-list-item-title>
                    <template v-slot:append>
                      <span>{{ formatNumber(unitData['共用部分面積(坪)']) }} 坪</span>
                    </template>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>露臺(不計坪)</v-list-item-title>
                    <template v-slot:append>
                      <span>{{ formatNumber(unitData['露臺(坪)']) }} 坪</span>
                    </template>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title class="font-weight-bold">公設比</v-list-item-title>
                    <template v-slot:append>
                      <span class="font-weight-bold">{{ formatPercentage(unitData['公設比']) }}</span>
                    </template>
                  </v-list-item>
                </v-list>
              </div>
            </v-col>
          </v-row>
        </div>
        <div v-else>
          <p>沒有可顯示的資料。</p>
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="sticky-bottom">
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="text" @click="close">
          關閉
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  show: { type: Boolean, required: true },
  unitData: { type: Object, default: () => null },
});

const emit = defineEmits(['update:show']);

function close() {
  emit('update:show', false);
}

// 輔助函數：格式化數字，處理空值或非數字
function formatNumber(value) {
  const num = parseFloat(value);
  return isNaN(num) ? 'N/A' : num.toLocaleString();
}

// 輔助函數：格式化百分比
function formatPercentage(value) {
  const num = parseFloat(value);
  // 假設傳入的值是 0.35 這樣的數字
  return isNaN(num) ? 'N/A' : `${(num * 100).toFixed(2)} %`;
}
</script>

<style scoped>
/* 讓標題和底部操作欄在內容滾動時固定 */
.sticky-top {
  position: sticky;
  top: 0;
  z-index: 2;
  background-color: #1a3a6e; /* 確保有背景色遮擋 */
  color: white;
}
.sticky-bottom {
  position: sticky;
  bottom: 0;
  z-index: 2;
  background-color: white; /* 確保有背景色遮擋 */
}

/* 資訊區塊的通用樣式 */
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

/* 總面積卡片的特殊樣式 */
.total-area-card {
  display: flex;
  align-items: center;
  background-color: #e8eaf6; /* 淡藍色背景，突出顯示 */
  padding: 16px;
  border-radius: 6px;
  border-left: 5px solid #3f51b5; /* 左側有強調色條 */
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

/* ✅ 新增：用於突出顯示價格數字的樣式 */
.highlight-price {
  font-size: 1.5rem !important;  /* 加大字體 */
  font-weight: 700 !important;   /* 粗體 */
  color: rgb(255, 0, 0) !important;     /* 紅字 (Material Design 的紅色) */
  /* !important 用於確保能覆蓋 Vuetify 的預設 subtitle 樣式 */
}


/* 微調 v-list-item 的樣式 */
:deep(.v-list-item-title) {
  font-size: 0.9rem;
  margin-bottom: 4px; /* 增加 title 和 subtitle 之間的距離 */
}

/* 移除預設 subtitle 的樣式，讓我們的 class 完全控制 */
:deep(.v-list-item-subtitle) {
  font-size: inherit;
  font-weight: inherit;
  color: inherit;
  /* 如果需要，可以移除 line-height 或其他繼承的樣式 */
  line-height: normal;
 
}
</style>