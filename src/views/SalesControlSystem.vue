<!-- /src/views/SalesControlSystem.vue -->
<template>
  <div class="sales-control-page">
    
    <!-- 滾動按鈕 -->
    <button @click="scrollGrid('left')" class="scroll-button left-scroll-button" v-if="!loading && !error"><</button>
    <button @click="scrollGrid('right')" class="scroll-button right-scroll-button" v-if="!loading && !error">></button>

    <!-- ✅ 恢復 .grid-container 作為滾動容器 -->
    <div ref="gridContainerRef" v-if="!loading && !error" class="grid-container">
      <!-- ✅ .grid-table 只負責網格佈局 -->
      <div class="grid-table">
        <!-- 左上角空白格 -->
        <div class="header-top-left"></div>

        <!-- 頂部棟別表頭 (X-axis) -->
        <div v-for="building in buildingHeaders" :key="building" class="header-cell header-top">
          {{ building }}
        </div>

        <!-- 遍歷樓層 (Y-axis) -->
        <template v-for="floor in floorHeaders" :key="floor">
          <!-- 側邊樓層表頭 -->
          <div class="header-cell header-left">
            {{ floor }}F
          </div>

          <!-- 數據格 -->
          <div v-for="building in buildingHeaders" :key="`${floor}-${building}`" class="data-cell">
            <div v-if="gridData[floor]?.[building]" class="unit-card">
              <span class="unit-name">{{ gridData[floor][building]['戶別'] }}</span>
            </div>
            <div v-else class="unit-card empty"></div>
          </div>
        </template>
      </div>
    </div>

    <!-- 加載和錯誤狀態 ) -->
    <div v-if="loading" class="status-container">
      <p>正在載入銷控資料...</p>
    </div>
    <div v-if="error" class="status-container">
      <p>錯誤: {{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'; // ref 已被使用，無需額外引入
import { useRoute } from 'vue-router';
import { fetchSalesControlData } from '@/api';

// ... (現有的 const 定義保持不變) ...
const route = useRoute();
const loading = ref(true);
const error = ref(null);
const allData = ref({});

// ✅ 更新 ref 名稱
const gridContainerRef = ref(null);


 //✅ 更新函數以使用正確的 ref
function scrollGrid(direction) {
  if (!gridContainerRef.value) return;
  const scrollAmount = 300; 

  if (direction === 'left') {
    gridContainerRef.value.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  } else {
    gridContainerRef.value.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }
}


// 原始銷控數據 (過濾前)
const salesRawData = computed(() => allData.value['銷控'] || []);


// 過濾掉 '店面' 的數據
const filteredSalesData = computed(() => {
  return salesRawData.value.filter(item => item['房型'] !== '店面');
});

// 計算 X 軸表頭 (棟別)
const buildingHeaders = computed(() => {
  if (filteredSalesData.value.length === 0) return [];
  const buildings = new Set(filteredSalesData.value.map(item => item['棟別']));
  // 可以進行自定義排序，如果需要的話
  return Array.from(buildings).sort(); 
});

// 計算 Y 軸表頭 (樓層)
const floorHeaders = computed(() => {
  if (filteredSalesData.value.length === 0) return [];
  const floors = new Set(filteredSalesData.value.map(item => parseInt(item['樓層'], 10)));
  // 降序排列
  return Array.from(floors).sort((a, b) => b - a);
});

// 生成二維網格數據結構，方便渲染時查找
// 結構: { 樓層: { 棟別: { 整筆銷控紀錄 } } }
const gridData = computed(() => {
  const dataMap = {};
  for (const record of filteredSalesData.value) {
    const floor = record['樓層'];
    const building = record['棟別'];
    if (!dataMap[floor]) {
      dataMap[floor] = {};
    }
    dataMap[floor][building] = record;
  }
  return dataMap;
});

// 動態計算 CSS Grid 樣式
const gridStyle = computed(() => {
  return {
    'grid-template-columns': `auto repeat(${buildingHeaders.value.length}, 1fr)`
  };
});


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
/* ... (sales-control-page, scroll-button 樣式保持不變) ... */
.sales-control-page {
  background-color: #f0f2f5;
  height: 100vh; /* 使用 height 而不是 min-height */
  box-sizing: border-box;
  position: relative;
  overflow: hidden; /* 關鍵：禁止這個元素產生任何滾動條 */
  /* padding: 16px; <-- 從這裡移除 padding */
}
.scroll-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  background-color: rgba(0, 0, 0, 0.4);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 24px;
  line-height: 40px;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.2s;
}


.scroll-button:hover {
  background-color: rgba(0, 0, 0, 0.6);
}
.left-scroll-button {
  left: 25px;
}
.right-scroll-button {
  right: 25px;
}

/* ✅ 關鍵修改：調整滾動容器的尺寸和 padding */
.grid-container {
  /* 將 padding 從父容器移到這裡 */
  padding: 16px; 
  box-sizing: border-box; /* 確保 padding 包含在 width/height 內 */
  
  width: 100%;
  height: 100%; /* 高度 100% 填充父容器 .sales-control-page */
  overflow: auto;
  position: relative;
  z-index: 1;

  display: flex;
  justify-content: center;
  align-items: flex-start;
}

/* 網格佈局的樣式 */
.grid-table {
  display: grid;
  gap: 10px 12px;
  width: max-content; 
  
  /* 移除 margin-top，因為現在由 padding 控制間距 */
  /* margin-top: 8px; */

  grid-template-columns: 60px repeat(v-bind('buildingHeaders.length'), 120px);
  grid-template-rows: 50px;
  grid-auto-rows: 90px;
}

/* 所有表頭儲存格的通用樣式 */
.header-cell {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #1a3a6e;
  color: white;
  font-weight: bold;
  padding: 8px;
  border-radius: 6px;
  box-sizing: border-box;
}

/* 左上角空白格樣式 */
.header-top-left {
  position: sticky;
  top: 0;
  left: 0;
  z-index: 3;
  background-color: transparent !important;
  border: none;
}


/* 固定表頭的樣式 */
.header-top {
  position: sticky;
  top: 0;
  z-index: 2;
}
.header-left {
  position: sticky;
  left: 0;
  z-index: 1;
}

/* 數據儲存格的容器 (現在寬度由 grid-template-columns 全局控制) */
.data-cell {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 戶別卡片樣式 */
.unit-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 8px;
  box-sizing: border-box;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.unit-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* 戶別名稱的字體 */
.unit-name {
  font-size: 1rem;
  font-weight: 500;
  color: #333;
}

/* 空儲存格的樣式 */
.unit-card.empty {
  background-color: #e9ecef;
  box-shadow: none;
  cursor: default;
}
.unit-card.empty:hover {
  transform: none;
}

/* 加載和錯誤狀態 */
.status-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.2rem;
  color: #555;
}
</style>