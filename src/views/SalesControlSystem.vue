<!-- /src/views/SalesControlSystem.vue -->
<template>
  <div class="sales-control-page">
    
    <!-- 1. 左上角空白格 -->
    <div class="header-top-left"></div>

    <!-- 2. 頂部棟別表頭容器 (只水平滾動) -->
    <div ref="headerTopRef" class="header-top-container">
      <div v-for="building in buildingHeaders" :key="building" class="header-cell">
        {{ building }}
      </div>
    </div>

    <!-- 3. 左側樓層表頭容器 (只垂直滾動) -->
    <div ref="headerLeftRef" class="header-left-container">
      <div v-for="floor in floorHeaders" :key="floor" class="header-cell">
        {{ floor }}F
      </div>
    </div>

    <!-- 4. 主要數據滾動區域 -->
    <div ref="mainGridRef" @scroll="handleScroll" class="main-grid-container">
      <div class="grid-table">
        <div v-for="item in flatGridData" :key="item.key" class="data-cell">
          
          
          
       <!-- ✅ 關鍵修改：將寫死的欄位名替換為動態的 statusField 變數 -->
          <div v-if="item.data" 
               class="unit-card" 
               :style="{ backgroundColor: statusColorMap.get(item.data[statusField]) || '#ffffff' }"
               @click="openUnitDetail(item.data)">
            <span class="unit-name">{{ item.data['戶別'] }}</span>
            <!-- ✅ 關鍵修改：使用 v-if 進行條件渲染 -->
            <template v-if="statusField === '銷控狀態' && item.data['銷控狀態'] === '已售'">
              <span class="unit-total-price sold-text">已售</span>
              <span class="unit-area">{{ item.data['房屋面積(坪)'] }} 坪</span>
              <span class="unit-per-price"></span> <!-- 顯示一個空的 span 來佔位 -->
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

 <!-- ✅ 5. 在頁面底部放置 Modal 組件 -->
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
const currentViewMode = computed(() => route.meta.viewMode || 'sales');

const headerTopRef = ref(null);
const headerLeftRef = ref(null);
const mainGridRef = ref(null);
const isModalVisible = ref(false);
const selectedUnitData = ref(null);

// --- 數據處理 (已修正) ---
const salesRawData = computed(() => allData.value['銷控'] || []);

const filteredSalesData = computed(() => {
  return salesRawData.value.filter(item => item['房型'] !== '店面');
});

const buildingHeaders = computed(() => {
  if (filteredSalesData.value.length === 0) return [];
  const buildings = new Set(filteredSalesData.value.map(item => item['棟別']));
  return Array.from(buildings).sort(); 
});

const floorHeaders = computed(() => {
  if (filteredSalesData.value.length === 0) return [];
  const floors = new Set(filteredSalesData.value.map(item => parseInt(item['樓層'], 10)));
  return Array.from(floors).sort((a, b) => b - a);
});

// ✅ 修正後的 gridData 計算屬性
const gridData = computed(() => {
  // 1. 先獲取所有需要的數據源
  const priceData = allData.value['價格'] || [];
  const areaData = allData.value['面積'] || [];
  const floorplanData = allData.value['平面圖'] || [];

  // 2. 提前創建好所有映射表，提高效能
  const priceMap = new Map(priceData.map(item => [item['戶別'], item]));
  const areaMap = new Map(areaData.map(item => [item['戶別'], item]));
  const floorplanMap = new Map(floorplanData.map(item => [item['戶別'], item]));

  const dataMap = {};
  
  // 3. 遍歷銷控數據，開始合併
  for (const record of filteredSalesData.value) {
    const floor = record['樓層'];
    const building = record['棟別'];
    const unitId = record['戶別']; // 在這裡獲取 unitId

    // ✅ 4. 將解析邏輯移到循環內部
    const floorplanItem = floorplanMap.get(unitId);
    let parsedFloorplans = [];
    if (floorplanItem && floorplanItem['平面圖URL列表']) {
      try {
        parsedFloorplans = JSON.parse(floorplanItem['平面圖URL列表']);
      } catch (e) {
        console.error(`解析戶別 ${unitId} 的平面圖URL列表時失敗:`, e);
      }
    }

    if (!dataMap[floor]) {
      dataMap[floor] = {};
    }
    
    // 5. 合併所有數據
    dataMap[floor][building] = {
      ...record,
      ...(priceMap.get(unitId) || {}),
      ...(areaMap.get(unitId) || {}),
      floorplans: parsedFloorplans // 使用解析後的數據
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

// --- 函數 (不變) ---
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
    console.log('Opening details for:', unitData['戶別']);
  }
}

// --- 生命週期鉤子 (不變) ---
onMounted(async () => {
  const projectName = route.params.projectName;
  if (!projectName) {
    error.value = '未指定建案名稱。';
    loading.value = false;
    return;
  }

  try {
    const response = await fetchSalesControlData(projectName);
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
/* 頁面主容器：使用 Grid 佈局來劃分四個區域 */
.sales-control-page {
  /* 關鍵：高度計算為 100vh 減去你的 App Bar 的確切或估計高度 */
  height: calc(100vh - 56px); /* 假設 App Bar 高度為 56px，請根據實際情況微調 */
  background-color: #f0f2f5;
  display: grid;
  
  /* [左間距] [樓層表頭] [主要內容] */
  grid-template-columns: 20px 40px 1fr; 
  /* [棟別表頭] [主要內容] */
  grid-template-rows: 50px 1fr;
  
  overflow: hidden; /* 禁止頁面本身滾動 */
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
  align-items: center; /* 讓表頭垂直居中 */
  padding-right: 17px; /* 為滾動條預留空間，防止遮擋 */
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
  padding-bottom: 17px; /* 為滾動條預留空間 */

  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 5px; /* 與右側數據網格對齊 */
}


/* 4. 主要數據滾動區域 */
.main-grid-container {
  grid-column: 3;
  grid-row: 2;
  overflow: auto; /* 只有這個容器可以滾動 */
  z-index: 1;
}

/* --- 內部元素樣式 --- */

/* 頂部和左側的表頭儲存格 */
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
  height: 40px; /* 頂部表頭高度 */
  margin-left: 12px; /* 水平間距 */
}
.header-left-container .header-cell {
  width: 40px; /* 左側表頭寬度 */
  height: 90px;
}

/* 數據網格 */
.grid-table {
  display: grid;
  gap: 10px 12px; /* 垂直間距 10px, 水平 12px */
  padding: 5px 0 5px 12px; /* 上下5, 左12, 右0 */
  width: max-content;
  grid-template-columns: repeat(v-bind('buildingHeaders.length'), 120px);
  grid-auto-rows: 90px;
}

/* 戶別卡片樣式 */
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

/* 文字樣式 */
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

/* 加載和錯誤狀態遮罩層 */
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

/* 新增：已售文字的樣式 */
.sold-text {
  font-weight: 700;
  color: #ff0000; /* 深灰色 */
  letter-spacing: 2px; /* 增加字間距 */
}

</style>