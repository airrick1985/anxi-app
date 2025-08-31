<template>
  <div class="sales-control-page">
    
    <div class="toolbar d-none d-md-flex">
      <span class="toolbar-title d-none d-sm-inline">{{ pageTitle }} - {{ projectName }}</span>
       <v-btn-toggle
        v-model="displayType"
        color="primary"
        variant="outlined"
        density="compact"
        mandatory
        class="ml-4"
      >
        <v-btn value="住家">住家</v-btn>
        <v-btn value="店面">店面</v-btn>
      </v-btn-toggle>
      
      <v-spacer></v-spacer>

      <v-btn-toggle
        v-if="currentViewMode === 'sales'"
        v-model="priceDisplayMode"
        color="info"
        variant="outlined"
        density="compact"
        mandatory
        class="mr-4"
      >
        <v-btn value="list" size="small">表價</v-btn>
        <v-btn value="floor" size="small">底價</v-btn>
        <v-btn value="transaction" size="small">成交價</v-btn>
      </v-btn-toggle>

      <v-badge
        :content="itemCount"
        :model-value="itemCount > 0"
        color="error"
      >
        <v-btn 
          icon="mdi-file-document-outline"
          @click="isQuoteSidebarOpen = true"
          title="查看報價單"
        ></v-btn>
      </v-badge>
      
      <v-btn
        color="info"
        variant="tonal"
        class="ml-4"
        @click="handleOpenSlideViewer" 
        :loading="false" title="車位銷控管理"
      >
        車位銷控管理
      </v-btn>

            <v-btn
        color="info"
        variant="tonal"
        class="ml-4"
        @click="handleOpenActivityMessage"
        title="最新活動訊息"
      >
        活動訊息
      </v-btn>
      
      <v-btn
        v-if="currentViewMode === 'sales'"
        color="deep-purple"
        variant="tonal"
        class="ml-4"
        @click="navigateToSalesSettings"
        title="銷控設定"
        prepend-icon="mdi-cog"
      >
        銷控設定
      </v-btn>
      
        <v-btn
        v-if="currentViewMode === 'sales'"
        color="teal"
        variant="tonal"
        class="ml-4"
        @click="isUpdateControlDialogVisible = true"
        title="修改面積底價資料"
      >
        修改資料
      </v-btn>
      
    </div>

   <div class="grid-wrapper">
    <div class="layout-grid">
      <div class="header-top-left"></div>
      <div ref="headerTopRef" class="header-top-container">
        <div v-for="building in buildingHeaders" :key="building" class="header-cell">
          {{ building }}
        </div>
      </div>

      <div ref="headerLeftRef" class="header-left-container">
        <div v-for="floor in floorHeaders" :key="floor" class="header-cell">
          {{ floor }}F
        </div>
      </div>

      <div ref="mainGridRef" @scroll="handleScroll" class="main-grid-container">
        <div class="grid-table">
          <div v-for="item in flatGridData" :key="item.key" class="data-cell">
            <div v-if="item.data"
              class="unit-card"
              :class="{ 'in-quote': quoteStore.isItemInQuote(item.data.unitId) }"
              :style="{ backgroundColor: statusColorMap.get(item.data[statusField]) || '#ffffff' }"
              @click="openUnitDetail(item.data)"
            >
              <span class="unit-name">{{ item.data.unitId }}</span>
              <template v-if="statusField === 'salesStatus_quote' && item.data.salesStatus_quote === '已售'">
                <span class="unit-total-price sold-text">已售</span>
                <span class="unit-area">{{ item.data.area_house_ping }} 坪</span>
                <span class="unit-per-price"></span>
              </template>
              <template v-else>
                <span class="unit-total-price">{{ getDisplayTotalPrice(item.data) }} 萬</span>
                <span class="unit-area">{{ item.data.area_house_ping }} 坪</span>
                <span class="unit-per-price">{{ calculateUnitPrice(item.data) }} 萬/坪</span>
              </template>
            </div>
            <div v-else class="unit-card empty"></div>
          </div>
        </div>
      </div>
    </div>
     </div>

   <v-bottom-navigation
      v-if="isMobile"
      :active="true"
      color="primary"
      app
    >
      <v-btn @click="isQuoteSidebarOpen = true">
        <v-badge
          :content="itemCount"
          :model-value="itemCount > 0"
          color="error"
        >
          <v-icon>mdi-file-document-outline</v-icon>
        </v-badge>
        <span>報價單</span>
      </v-btn>

      <v-btn 
        @click="handleOpenSlideViewer" 
        :loading="isLoadingSlide"> 
        <v-icon>mdi-parking</v-icon>
        <span>車位表</span>
      </v-btn>

      <v-menu top>
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props">
            <v-icon>mdi-home-city-outline</v-icon>
            <span>{{ displayType }}</span>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="displayType = '住家'">
            <v-list-item-title>住家</v-list-item-title>
          </v-list-item>
          <v-list-item @click="displayType = '店面'">
            <v-list-item-title>店面</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      
      <v-menu top v-if="currentViewMode === 'sales'">
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props">
            <v-icon>mdi-currency-usd</v-icon>
            <span>{{ priceDisplayLabel }}</span>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="priceDisplayMode = 'list'">
            <v-list-item-title>顯示表價</v-list-item-title>
          </v-list-item>
          <v-list-item @click="priceDisplayMode = 'floor'">
            <v-list-item-title>顯示底價</v-list-item-title>
          </v-list-item>
          <v-list-item @click="priceDisplayMode = 'transaction'">
            <v-list-item-title>顯示成交價</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-menu top v-if="currentViewMode === 'sales'">
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props">
            <v-icon>mdi-dots-vertical</v-icon>
            <span>更多</span>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="handleOpenActivityMessage">
            <template v-slot:prepend>
              <v-icon>mdi-bullhorn-outline</v-icon>
            </template>
            <v-list-item-title>活動訊息</v-list-item-title>
          </v-list-item>
          <v-list-item @click="isUpdateControlDialogVisible = true">
            <template v-slot:prepend>
              <v-icon>mdi-database-refresh-outline</v-icon>
            </template>
            <v-list-item-title>修改資料</v-list-item-title>
          </v-list-item>
          <v-list-item @click="navigateToSalesSettings">
            <template v-slot:prepend>
              <v-icon>mdi-cog-outline</v-icon>
            </template>
            <v-list-item-title>銷控設定</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

    </v-bottom-navigation>

    <UnitDetailModal 
      v-if="isModalVisible"
      v-model:show="isModalVisible" 
      :unit-data="selectedUnitData"
      :view-mode="currentViewMode"
      :project-name="project.name"
      @request-open-slide="handleOpenSlideViewer" />

    <QuoteSidebar v-model:isOpen="isQuoteSidebarOpen" />

    <v-dialog v-model="isSlideDialogVisible" fullscreen hide-overlay transition="dialog-bottom-transition">
      <v-card class="d-flex flex-column">
        <v-toolbar dark color="primary" density="compact">
          <v-btn icon dark @click="isSlideDialogVisible = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>車位表</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn 
            v-if="currentViewMode === 'sales'"
            prepend-icon="mdi-table-edit"
            @click="isParkingControlDialogVisible = true"
            variant="tonal"
          >
            車位銷控管理
          </v-btn>
          <v-btn 
            icon 
            dark 
            @click="handleRefreshSlide"
            :disabled="isLoadingSlide"
          >
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </v-toolbar>
        <div class="flex-grow-1" style="position: relative;">
          <v-overlay
            :model-value="isLoadingSlide"
            class="align-center justify-center"
            persistent
            scrim="rgba(0, 0, 0, 0.6)"
          >
            <div class="text-center">
              <v-progress-circular indeterminate color="#008cff" size="64"></v-progress-circular>
              <p class="mt-4 text-body-1 text-blcak">正在載入最新車位表...</p>
            </div>
          </v-overlay>
          <div v-if="isContentLoaded" class="fill-height">
            <iframe
              v-if="slideEmbedUrl"
              :src="slideEmbedUrl"
              frameborder="0"
              width="100%"
              height="100%"
              allowfullscreen="true"
              style="display: block;"
            ></iframe>
            <div v-else class="d-flex flex-column justify-center align-center fill-height">
              <v-icon size="80" color="grey-lighten-1">mdi-alert-circle-outline</v-icon>
              <p class="mt-4 text-h6 text-grey">無法載入車位表</p>
              <p class="text-body-1 text-grey">點擊右上角關閉按鈕，或手動重新整理。</p>
            </div>
          </div>
        </div>
      </v-card>
    </v-dialog>
    
    <v-dialog v-model="isActivityDialogVisible" fullscreen hide-overlay transition="dialog-bottom-transition">
      <v-card class="d-flex flex-column">
        <v-toolbar dark color="teal" density="compact">
          <v-btn icon dark @click="isActivityDialogVisible = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>活動訊息</v-toolbar-title>
        </v-toolbar>
        <div class="flex-grow-1" style="position: relative;">
          <v-overlay
            :model-value="isActivityLoading"
            class="align-center justify-center"
            persistent
            scrim="rgba(0, 0, 0, 0.6)"
          >
            <div class="text-center">
              <v-progress-circular indeterminate color="#008cff" size="64"></v-progress-circular>
              <p class="mt-4 text-body-1">正在載入活動訊息...</p>
            </div>
          </v-overlay>
          <div v-if="!isActivityLoading" class="fill-height">
            <iframe
              v-if="activitySlideEmbedUrl"
              :src="activitySlideEmbedUrl"
              frameborder="0"
              width="100%"
              height="100%"
              allowfullscreen="true"
              style="display: block;"
            ></iframe>
            <div v-else class="d-flex flex-column justify-center align-center fill-height">
              <v-icon size="80" color="grey-lighten-1">mdi-alert-circle-outline</v-icon>
              <p class="mt-4 text-h6 text-grey">無法載入活動訊息</p>
              <p class="text-body-1 text-grey">請確認後台是否已設定活動訊息 SLIDE ID。</p>
            </div>
          </div>
        </div>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isParkingControlDialogVisible" fullscreen hide-overlay transition="dialog-bottom-transition">
        <ParkingControl @close="isParkingControlDialogVisible = false" />
    </v-dialog>

    <v-dialog v-model="isUpdateControlDialogVisible" fullscreen hide-overlay transition="dialog-bottom-transition">
        <UpdateControl @close="isUpdateControlDialogVisible = false" />
    </v-dialog>

    <div v-if="loading || error" class="status-overlay">
      <div v-if="loading" class="loading-container">
        <span class="loader"></span>
        <p class="loading-text">正在載入銷控資料...</p>
      </div>
      <p v-if="error" class="error-text">錯誤: {{ error }}</p>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { listenToSalesControlData } from '@/api';
import UnitDetailModal from '@/components/UnitDetailModal.vue';
import { useQuoteStore } from '@/store/quoteStore';
import { useSlideViewer } from '@/composables/useSlideViewer';
import QuoteSidebar from '@/components/QuoteSidebar.vue';
import { useDisplay } from 'vuetify';
import ParkingControl from './ParkingControl.vue'; 
import UpdateControl from './UpdateControl.vue'; 

const isParkingControlDialogVisible = ref(false);
const isUpdateControlDialogVisible = ref(false);
const { mobile: isMobile } = useDisplay();
const router = useRouter();
const quoteStore = useQuoteStore();
const route = useRoute();

const { 
  isSlideDialogVisible, 
  slideEmbedUrl, 
  isLoadingSlide,
  isContentLoaded,
  openSlideViewer, 
  refreshSlide
} = useSlideViewer();

// --- State ---
const loading = ref(true);
const error = ref(null);
let unsubscribe = null;

const project = ref({ name: '讀取中...' });
const salesParameters = ref([]);
const salesHouseholds = ref([]);

const headerTopRef = ref(null);
const headerLeftRef = ref(null);
const mainGridRef = ref(null);
const isModalVisible = ref(false);
const selectedUnitData = ref(null);
const isQuoteSidebarOpen = ref(false);
const displayType = ref('住家');
const priceDisplayMode = ref('list');

const isActivityDialogVisible = ref(false);
const isActivityLoading = ref(false);

const activitySlideEmbedUrl = computed(() => {
  const slideId = project.value.activityMessageSlideId;
  if (!slideId) return '';
  return `https://docs.google.com/presentation/d/${slideId}/embed?start=true&loop=true&delayms=3000`;
});

// --- Computed Properties ---
const projectId = computed(() => route.params.projectName);
const currentViewMode = computed(() => route.meta.viewMode || 'sales');
const pageTitle = computed(() => (currentViewMode.value === 'quote' ? '報價系統' : '銷控系統') + ` (${displayType.value})`);
const itemCount = computed(() => quoteStore.itemCount);
const projectName = computed(() => project.value.name);

// ✓ 【核心修改】修正篩選邏輯，使用 `layout` 欄位
const filteredHouseholds = computed(() => {
  if (displayType.value === '店面') {
    return salesHouseholds.value.filter(item => item.layout === '店面');
  }
  // 其他所有 layout 不等於 '店面' 的都視為 '住家'
  return salesHouseholds.value.filter(item => item.layout !== '店面');
});

const buildingHeaders = computed(() => {
  const buildings = new Set(filteredHouseholds.value.map(item => item.building));
  return Array.from(buildings).sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }));
});

const floorHeaders = computed(() => {
  const floors = new Set(filteredHouseholds.value.map(item => parseInt(item.floor, 10)));
  return Array.from(floors).sort((a, b) => b - a);
});

const gridData = computed(() => {
  const dataMap = {};
  for (const household of filteredHouseholds.value) {
    const floor = household.floor;
    const building = household.building;
    if (!dataMap[floor]) dataMap[floor] = {};
    dataMap[floor][building] = household;
  }
  return dataMap;
});

const flatGridData = computed(() => {
  const items = [];
  floorHeaders.value.forEach(floor => {
    buildingHeaders.value.forEach(building => {
      items.push({
        key: `${floor}-${building}`,
        data: gridData.value[floor]?.[building] || null,
      });
    });
  });
  return items;
});

const statusField = computed(() => currentViewMode.value === 'quote' ? 'salesStatus_quote' : 'salesStatus_backend');

const statusColorMap = computed(() => {
  const map = new Map();
  salesParameters.value.forEach(item => {
    map.set(item.statusName, item.colorCode);
  });
  return map;
});

const priceDisplayLabel = computed(() => {
  if (priceDisplayMode.value === 'list') return '表價';
  if (priceDisplayMode.value === 'floor') return '底價';
  if (priceDisplayMode.value === 'transaction') return '成交價';
  return '價格';
});

// --- Methods ---
const getDisplayTotalPrice = (itemData) => {
  // ✓ 【修改】priceInWan 輔助函式現在只做格式化，不再除以 10000
  const formatPrice = (price) => Math.round(price || 0);

  // ✓ 【修改】對應新的 Firestore 欄位名稱
  if (currentViewMode.value !== 'sales') {
    return formatPrice(itemData.price_list_house_total);
  }
  switch (priceDisplayMode.value) {
    case 'floor':
      return formatPrice(itemData.price_floor_house_total || itemData.price_list_house_total);
    case 'transaction':
      const canShow = ['小訂', '補足', '簽約'].includes(itemData.salesStatus_backend) && itemData.price_transaction_house;
      return canShow ? formatPrice(itemData.price_transaction_house) : formatPrice(itemData.price_list_house_total);
    default: // list
      return formatPrice(itemData.price_list_house_total);
  }
};

const calculateUnitPrice = (itemData) => {
  const totalPriceInWan = parseFloat(getDisplayTotalPrice(itemData));
  // ✓ 【修改】對應新的 Firestore 欄位名稱
  const area = parseFloat(itemData.area_house_ping);
  if (isNaN(totalPriceInWan) || isNaN(area) || area === 0) return '-';
  return (totalPriceInWan / area).toFixed(1);
};

function handleScroll(event) {
  if (headerTopRef.value) headerTopRef.value.scrollLeft = event.target.scrollLeft;
  if (headerLeftRef.value) headerLeftRef.value.scrollTop = event.target.scrollTop;
}

function openUnitDetail(unitData) {
  if (unitData) {
    selectedUnitData.value = { ...unitData };
    isModalVisible.value = true;
  }
}

function handleOpenSlideViewer() {
  const slideId = currentViewMode.value === 'quote' ? project.value.parkingSlideId_quote : project.value.parkingSlideId_sales;
  openSlideViewer(slideId);
}

function handleRefreshSlide() {
  // ✓ 【修正】確保傳遞的是 'sales' 或 'quote'，而不是 Slide ID
  refreshSlide(currentViewMode.value);
}

function handleOpenActivityMessage() {
  isActivityLoading.value = true;
  isActivityDialogVisible.value = true;
  
  // 模擬載入時間，讓使用者看到 progress circle
  setTimeout(() => {
    isActivityLoading.value = false;
  }, 1200);
}

function navigateToSalesSettings() {
  if (projectId.value) {
    router.push({
      name: 'SalesSettings',
      params: { projectId: projectId.value }
    });
  }
}

// --- Lifecycle Hooks ---
onMounted(() => {
  quoteStore.clearQuote();
  loading.value = true;
  
  unsubscribe = listenToSalesControlData(
    projectId.value,
    (data) => {
      project.value = data.project || { name: '專案資料載入失敗' };
      salesParameters.value = data.parameters || [];
      salesHouseholds.value = data.households || [];
      if(loading.value) loading.value = false;
    },
    (err) => {
      error.value = `讀取銷控資料時發生錯誤: ${err.message}`;
      loading.value = false;
      console.error('銷控資料監聽失敗:', err);
    }
  );
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});

</script>

<style scoped>
/* (您的 CSS 樣式維持不變) */
.sales-control-page {
  height: calc(100vh - 56px);
  background-color: #f0f2f5;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 20px; 
}
.grid-wrapper {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  overflow: hidden;
}
.toolbar {
  display: flex;
  align-items: center;
  padding: 0 8px;
  flex-shrink: 0;
}
.toolbar-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #37474f;
}
.layout-grid {
  display: grid;
  grid-template-columns: 0px 40px 1fr;
  grid-template-rows: 50px 1fr;
  overflow: hidden;
  max-width: 95vw;
}
.header-top-left {
  grid-column: 2;
  grid-row: 1;
  background-color: #f0f2f5;
  z-index: 3;
}
.header-top-container {
  grid-column: 3;
  grid-row: 1;
  background-color: #f0f2f5;
  overflow: hidden;
  z-index: 2;
  display: flex;
  align-items: center;
  padding-right: 17px;
  box-sizing: content-box;
}
.header-left-container {
  grid-column: 2;
  grid-row: 2;
  background-color: #f0f2f5;
  overflow: hidden;
  z-index: 2;
  box-sizing: border-box;
  padding-bottom: 17px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 5px;
}
.main-grid-container {
  grid-column: 3;
  grid-row: 2;
  overflow: auto;
  z-index: 1;
}
.header-cell {
  background-color: #1a3a6e;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  border-radius: 6px;
  flex-shrink: 0;
}
.header-top-container .header-cell {
  width: 120px;
  height: 40px;
  margin-left: 12px;
}
.header-left-container .header-cell {
  width: 40px;
  height: 90px;
}
.grid-table {
  display: grid;
  gap: 10px 12px;
  padding: 5px 16px 5px 12px;
  width: max-content;
  grid-template-columns: repeat(v-bind('buildingHeaders.length'), 120px);
  grid-auto-rows: 90px;
}
.unit-card {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  border-radius: 6px;
  border: 2px solid transparent;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 6px 4px;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  text-align: center;
}
.unit-card.in-quote {
  border-color: #ff9800;
  box-shadow: 0 0 10px rgba(255, 152, 0, 0.5);
}
.unit-card.in-quote::after {
  content: '✔';
  position: absolute;
  top: 2px;
  right: 5px;
  color: white;
  background-color: #ff9800;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
  font-weight: bold;
}
.unit-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}
.unit-card.empty {
  background-color: #e9ecef;
  box-shadow: none;
  cursor: default;
}
.unit-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1a237e;
}
.unit-total-price {
  font-size: 0.95rem;
  font-weight: 700;
  color: #d81b60;
}
.unit-area {
  font-size: 0.8rem;
  font-weight: 700;
  color: #37474f;
}
.unit-per-price {
  font-size: 0.8rem;
  font-weight: 400;
  color: #546e7a;
}
.sold-text {
  font-weight: 700;
  color: #424242;
  letter-spacing: 2px;
}
.status-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(240, 242, 245, 0.9);
  z-index: 10;
  transition: opacity 0.3s ease;
}
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.loading-text {
  font-size: 1rem;
  font-weight: 500;
  color: #37474f;
}
.error-text {
  font-size: 1.2rem;
  color: #d32f2f;
  font-weight: bold;
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.loader {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  position: relative;
  animation: rotate 1s linear infinite
}
.loader::before {
  content: "";
  box-sizing: border-box;
  position: absolute;
  inset: 0px;
  border-radius: 50%;
  border: 5px solid #008cff;
  animation: prixClipFix 2s linear infinite ;
}
@keyframes rotate {
  100% {transform: rotate(360deg)}
}
@keyframes prixClipFix {
  0% {clip-path:polygon(50% 50%,0 0,0 0,0 0,0 0,0 0)}
  25% {clip-path:polygon(50% 50%,0 0,100% 0,100% 0,100% 0,100% 0)}
  50% {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,100% 100%,100% 100%)}
  75% {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,0 100%,0 100%)}
  100% {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,0 100%,0 0)}
}

.iframe-container {
  width: 100%;
  height: calc(100vh - 48px);
  overflow: hidden;
}
.iframe-container iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.v-bottom-navigation {
  background-color: rgba(255, 255, 255, 0.75) !important;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  height: calc(56px + 20px) !important; 
  padding-bottom: 20px !important; 
}

.v-bottom-navigation .v-btn > .v-btn__content > span {
    font-size: 0.8rem;
}
</style>