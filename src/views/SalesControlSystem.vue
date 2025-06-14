<!-- /src/views/SalesControlSystem.vue -->
<template>
  <div class="sales-control-page">
    
    <!-- ✅ 新增：工具欄區域 -->
    <div class="toolbar">
      <span class="toolbar-title">{{ pageTitle }} - {{ projectName }}</span>
      <v-spacer></v-spacer>
      <v-btn-toggle
        v-model="displayType"
        color="primary"
        variant="outlined"
        density="compact"
        mandatory
      >
        <v-btn value="住家">住家</v-btn>
        <v-btn value="店面">店面</v-btn>
      </v-btn-toggle>
    </div>

    <!-- 手動四區域佈局容器 -->
    <div class="layout-grid">
      <!-- 1. 左上角空白格 -->
      <div class="header-top-left"></div>

      <!-- 2. 頂部棟別表頭容器 -->
      <div ref="headerTopRef" class="header-top-container">
        <div v-for="building in buildingHeaders" :key="building" class="header-cell">
          {{ building }}
        </div>
      </div>

      <!-- 3. 左側樓層表頭容器 -->
      <div ref="headerLeftRef" class="header-left-container">
        <div v-for="floor in floorHeaders" :key="floor" class="header-cell">
          {{ floor }}F
        </div>
      </div>

      <!-- 4. 主要數據滾動區域 -->
      <div ref="mainGridRef" @scroll="handleScroll" class="main-grid-container">
        <div class="grid-table">
          <div v-for="item in flatGridData" :key="item.key" class="data-cell">
            <div v-if="item.data" 
                 class="unit-card" 
                 :style="{ backgroundColor: statusColorMap.get(item.data[statusField]) || '#ffffff' }"
                 @click="openUnitDetail(item.data)">
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

    <!-- Modal 組件 -->
    <UnitDetailModal 
      v-model:show="isModalVisible" 
      :unit-data="selectedUnitData"
      :view-mode="currentViewMode" 
    />

    <!-- 加載和錯誤狀態遮罩層 -->
    <div v-if="loading || error" class="status-overlay">
      <p v-if="loading">正在載入銷控資料...</p>
      <p v-if="error">錯誤: {{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { fetchSalesControlData } from '@/api';
import UnitDetailModal from '@/components/UnitDetailModal.vue';

const route = useRoute();
const loading = ref(true);
const error = ref(null);
const allData = ref({});

const headerTopRef = ref(null);
const headerLeftRef = ref(null);
const mainGridRef = ref(null);

const isModalVisible = ref(false);
const selectedUnitData = ref(null);

// ✅ --- 新增和修改的狀態與計算屬性 ---

// 1. 新增狀態，用於控制顯示類型，預設為 '住家'
const displayType = ref('住家');

// 2. 獲取路由參數和元信息
const projectName = computed(() => route.params.projectName);
const currentViewMode = computed(() => route.meta.viewMode || 'sales');

// 3. 頁面標題，現在也依賴於 displayType
const pageTitle = computed(() => {
  const baseTitle = currentViewMode.value === 'quote' ? '報價系統' : '銷控系統';
  return `${baseTitle} (${displayType.value})`; // 例如: "銷控系統 (店面)"
});

// --- 數據處理 ---
const salesRawData = computed(() => allData.value['銷控'] || []);

// 4. ✅ 修改 filteredSalesData 的過濾邏輯
const filteredSalesData = computed(() => {
  if (displayType.value === '店面') {
    return salesRawData.value.filter(item => item['房型'] === '店面');
  }
  return salesRawData.value.filter(item => item['房型'] !== '店面');
});

// 後續所有計算屬性都無需修改，它們會自動響應 filteredSalesData 的變化
const buildingHeaders = computed(() => {
  if (filteredSalesData.value.length === 0) return [];
  
  const buildings = new Set(filteredSalesData.value.map(item => item['棟別']));
  
  // ✅ 關鍵修改：使用帶有 localeCompare 的自定義排序函數
  return Array.from(buildings).sort((a, b) => {
    // localeCompare 是處理包含數字的字符串排序的最佳方式
    // 'kn' (numeric) 選項會讓它將字符串中的數字當作數值來比較
    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
  }); 
});

const floorHeaders = computed(() => {
  if (filteredSalesData.value.length === 0) return [];
  const floors = new Set(filteredSalesData.value.map(item => parseInt(item['樓層'], 10)));
  return Array.from(floors).sort((a, b) => b - a);
});

const gridData = computed(() => {
  // 1. 獲取所有需要的數據源
  const priceData = allData.value['價格'] || [];
  const areaData = allData.value['面積'] || [];
  const floorplanData = allData.value['平面圖'] || []; // 這是從 '平面圖' sheet 來的數據

  // 2. 提前創建好所有映射表，提高效能
  const priceMap = new Map(priceData.map(item => [item['戶別'], item]));
  const areaMap = new Map(areaData.map(item => [item['戶別'], item]));
  
  // ✅ 新增：為平面圖數據也創建一個映射表
  const floorplanMap = new Map(floorplanData.map(item => [item['戶別'], item]));

  const dataMap = {};
  
  // 3. 遍歷銷控數據，開始合併
  for (const record of filteredSalesData.value) {
    const floor = record['樓層'];
    const building = record['棟別'];
    const unitId = record['戶別'];

    if (!dataMap[floor]) {
      dataMap[floor] = {};
    }
    
    // ✅ 4. 從映射表中獲取對應的平面圖記錄
    const floorplanItem = floorplanMap.get(unitId);
    let parsedFloorplans = []; // 預設為空陣列
    
    // ✅ 5. 解析 JSON 字符串
    if (floorplanItem && floorplanItem['平面圖URL列表']) {
      try {
        // 確保解析出來的是一個陣列
        const parsed = JSON.parse(floorplanItem['平面圖URL列表']);
        if (Array.isArray(parsed)) {
          parsedFloorplans = parsed;
        }
      } catch (e) {
        console.error(`解析戶別 ${unitId} 的平面圖URL列表時失敗:`, e);
      }
    }
    
    // 6. 合併所有數據
    dataMap[floor][building] = {
      ...record,
      ...(priceMap.get(unitId) || {}),
      ...(areaMap.get(unitId) || {}),
      floorplans: parsedFloorplans // 使用解析後的、保證是陣列的數據
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

// --- 函數 ---
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
    selectedUnitData.value = unitData;
    isModalVisible.value = true;
  }
}

// --- 生命週期鉤子 ---
onMounted(async () => {
  if (!projectName.value) {
    error.value = '未指定建案名稱。';
    loading.value = false;
    return;
  }

  try {
    const response = await fetchSalesControlData(projectName.value);
    if (response.status === 'success') {
      allData.value = response.data;
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
/* ✅ 修改：頁面主容器使用 Flexbox */
.sales-control-page {
  height: calc(100vh - 56px);
  background-color: #f0f2f5;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ✅ 新增：工具欄樣式 */
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

/* ✅ 修改：四區域佈局容器，讓其佔滿剩餘空間 */
.layout-grid {
  flex-grow: 1; /* 關鍵 */
  display: grid;
  grid-template-columns: 20px 70px 1fr;
  grid-template-rows: 50px 1fr;
  overflow: hidden;
}

/* 1. 左上角空白格 */
.header-top-left {
  grid-column: 2;
  grid-row: 1;
  background-color: #f0f2f5;
  z-index: 3;
}

/* 2. 頂部棟別表頭容器 */
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

/* 3. 左側樓層表頭容器 */
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

/* 4. 主要數據滾動區域 */
.main-grid-container {
  grid-column: 3;
  grid-row: 2;
  overflow: auto;
  z-index: 1;
}

/* --- 內部元素樣式 (無變動) --- */

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
  width: 60px;
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
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 6px 4px;
  box-sizing: border-box;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  text-align: center;
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
  font-size: 1.2rem;
  background-color: rgba(240, 242, 245, 0.8);
  z-index: 10;
}
</style>