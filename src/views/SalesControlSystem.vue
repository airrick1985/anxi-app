<template>
  <div class="sales-control-page">
    
    <div class="toolbar">
     <span class="toolbar-title d-none d-sm-inline">{{ pageTitle }} - {{ projectName }}</span>
      <v-spacer></v-spacer>

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
        @click="openSlideViewer(parkingSlideId)"
        :disabled="!parkingSlideId"
        title="車位表"
      >
        車位表
      </v-btn>

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
    </div>

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
              :class="{ 'in-quote': quoteStore.isItemInQuote(item.data['戶別']) }"
              :style="{ backgroundColor: statusColorMap.get(item.data[statusField]) || '#ffffff' }"
              @click="openUnitDetail(item.data)"
            >
              <span class="unit-name">{{ item.data['戶別'] }}</span>
              <template v-if="statusField === '銷控狀態' && item.data['銷控狀態'] === '已售'">
                <span class="unit-total-price sold-text">已售</span>
                <span class="unit-area">{{ item.data['房屋面積(坪)'] }} 坪</span>
                <span class="unit-per-price"></span>
              </template>
              <template v-else>
                <span class="unit-total-price">{{ item.data['房屋總表價'] }} 萬</span>
                <span class="unit-area">{{ item.data['房屋面積(坪)'] }} 坪</span>
                <span class="unit-per-price">{{ item.data['房屋單價(表價)'] }} 萬/坪</span>
              </template>
            </div>
            <div v-else class="unit-card empty"></div>
          </div>
        </div>
      </div>
    </div>

    <UnitDetailModal 
      v-model:show="isModalVisible" 
      :unit-data="selectedUnitData"
      :view-mode="currentViewMode" 
    />

    <QuoteSidebar v-model:isOpen="isQuoteSidebarOpen" />

    <v-dialog v-model="isSlideDialogVisible" fullscreen hide-overlay transition="dialog-bottom-transition">
      <v-card>
        <v-toolbar dark color="primary">
          <v-btn icon dark @click="isSlideDialogVisible = false"><v-icon>mdi-close</v-icon></v-btn>
          <v-toolbar-title>車位表</v-toolbar-title>
        </v-toolbar>
        <div class="iframe-container">
          <iframe :src="slideEmbedUrl" frameborder="0" allowfullscreen></iframe>
        </div>
      </v-card>
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
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { fetchSalesControlData } from '@/api';
import UnitDetailModal from '@/components/UnitDetailModal.vue';
import { useQuoteStore } from '@/store/quoteStore';
import { useSlideViewer } from '@/composables/useSlideViewer';
import QuoteSidebar from '@/components/QuoteSidebar.vue';

const router = useRouter();
const quoteStore = useQuoteStore();
const route = useRoute();
const { isSlideDialogVisible, slideEmbedUrl, openSlideViewer } = useSlideViewer();

// --- 狀態 ---
const loading = ref(true);
const error = ref(null);
const allData = ref({});
const headerTopRef = ref(null);
const headerLeftRef = ref(null);
const mainGridRef = ref(null);
const isModalVisible = ref(false);
const selectedUnitData = ref(null);
const isQuoteSidebarOpen = ref(false);
const displayType = ref('住家');
const parkingSlideId = ref(''); // 本地 ref，用來儲存此頁面對應的 Slide ID

// --- 計算屬性 ---
const itemCount = computed(() => quoteStore.itemCount);
const projectName = computed(() => route.params.projectName);
const currentViewMode = computed(() => route.meta.viewMode || 'sales');
const pageTitle = computed(() => {
  const baseTitle = currentViewMode.value === 'quote' ? '報價系統' : '銷控系統';
  return `${baseTitle} (${displayType.value})`;
});
// ... 其餘計算屬性維持不變 ...
const salesRawData = computed(() => allData.value['銷控'] || []);
const filteredSalesData = computed(() => {
  if (displayType.value === '店面') {
    return salesRawData.value.filter(item => item['房型'] === '店面');
  }
  return salesRawData.value.filter(item => item['房型'] !== '店面');
});
const buildingHeaders = computed(() => {
  if (filteredSalesData.value.length === 0) return [];
  const buildings = new Set(filteredSalesData.value.map(item => item['棟別']));
  return Array.from(buildings).sort((a, b) => {
    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
  });
});
const floorHeaders = computed(() => {
  if (filteredSalesData.value.length === 0) return [];
  const floors = new Set(filteredSalesData.value.map(item => parseInt(item['樓層'], 10)));
  return Array.from(floors).sort((a, b) => b - a);
});
const gridData = computed(() => {
  const priceData = allData.value['價格'] || [];
  const areaData = allData.value['面積'] || [];
  const floorplanData = allData.value['平面圖'] || [];
  const buyerData = allData.value['買方資料'] || [];
  const priceMap = new Map(priceData.map(item => [item['戶別'], item]));
  const areaMap = new Map(areaData.map(item => [item['戶別'], item]));
  const floorplanMap = new Map(floorplanData.map(item => [item['戶別'], item]));
  const buyerMap = new Map(buyerData.map(item => [item['戶別'], item]));

  const dataMap = {};
  for (const record of filteredSalesData.value) {
    const floor = record['樓層'];
    const building = record['棟別'];
    const unitId = record['戶別'];
    if (!dataMap[floor]) {
      dataMap[floor] = {};
    }
    const floorplanItem = floorplanMap.get(unitId);
    let parsedFloorplans = [];
    if (floorplanItem && floorplanItem['平面圖URL列表']) {
      try {
        const parsed = JSON.parse(floorplanItem['平面圖URL列表']);
        if (Array.isArray(parsed)) {
          parsedFloorplans = parsed;
        }
      } catch (e) {
        console.error(`解析戶別 ${unitId} 的平面圖URL列表時失敗:`, e);
      }
    }
    dataMap[floor][building] = {
      ...record,
      ...(priceMap.get(unitId) || {}),
      ...(areaMap.get(unitId) || {}),
      floorplans: parsedFloorplans,
      ...(buyerMap.get(unitId) || {})
    };
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
const statusField = computed(() => {
  return route.meta.viewMode === 'quote' ? '銷控狀態' : '銷控後台狀態';
});
const statusColorMap = computed(() => {
  const paramsData = allData.value['參數'] || [];
  const map = new Map();
  for (const item of paramsData) {
    const status = item['銷控狀態'];
    const color = item['色碼'];
    if (status && color) {
      map.set(status, color);
    }
  }
  return map;
});


// --- 方法 ---
function handleScroll(event) {
  if (headerTopRef.value) {
    headerTopRef.value.scrollLeft = event.target.scrollLeft;
  }
  if (headerLeftRef.value) {
    headerLeftRef.value.scrollTop = event.target.scrollTop;
  }
}
function openUnitDetail(unitData) {
  if (unitData) {
    console.log('--- 準備打開 Modal，傳遞的數據 (unitData): ---', JSON.parse(JSON.stringify(unitData)));
    selectedUnitData.value = unitData;
    isModalVisible.value = true;
  }
}

// --- 生命週期鉤子 ---
onMounted(async () => {
  console.log('[SalesControlSystem] Component mounted. Clearing quote store...');
  quoteStore.clearQuote();
  const projectNameParam = route.params.projectName;
  if (!projectNameParam) {
    error.value = '未指定建案名稱。';
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const response = await fetchSalesControlData(projectNameParam);
    if (response.status === 'success') {
      allData.value = response.data;
      
      const slideSheetData = response.data['車位SLIDE'];
      if (slideSheetData && slideSheetData.length > 0) {
        const slideInfo = slideSheetData[0];
        
        const targetKeyName = currentViewMode.value === 'quote' 
          ? '報價車位SLIDEID' 
          : '銷控車位SLIDEID';
        
        // ✅ 唯一的修改在這裡：優化讀取邏輯
        // 1. 取得 API 回傳物件的所有 keys
        const actualKeys = Object.keys(slideInfo);
        // 2. 找到 trimming (去除前後空白) 後與目標 key 相同的那個 key
        const foundKey = actualKeys.find(k => k.trim() === targetKeyName);

        if (foundKey) {
          // 3. 使用找到的、正確的 key 來取值
          parkingSlideId.value = slideInfo[foundKey] || '';
        }

        if (!parkingSlideId.value) {
          console.warn(`在 '車位SLIDE' 工作表中，欄位 '${targetKeyName}' 不存在或其值為空。`);
        }
      } else {
        console.warn("API 回應中未包含 '車位SLIDE' 資料或該工作表為空。");
      }

    } else {
      throw new Error(response.message || '無法獲取銷控資料。');
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
/* 原有樣式保持不變 */
.sales-control-page {
  height: calc(100vh - 56px);
  background-color: #f0f2f5;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  flex-grow: 1;
  display: grid;
  grid-template-columns: 0px 40px 1fr;
  grid-template-rows: 50px 1fr;
  overflow: hidden;
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
  padding: 5px 0 5px 12px;
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

/* ✅ 新增 #6: Iframe 容器樣式 */
.iframe-container {
  width: 100%;
  height: calc(100vh - 48px); /* 48px 是 v-toolbar 的常見高度 */
  overflow: hidden;
}
.iframe-container iframe {
  width: 100%;
  height: 100%;
  border: none; /* 移除 iframe 預設邊框 */
}
</style>