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

  <!-- 主要數據滾動區域 -->
    <div ref="mainGridRef" @scroll="handleScroll" class="main-grid-container">
      <div class="grid-table">
        <div v-for="item in flatGridData" :key="item.key" class="data-cell">
          <div v-if="item.data" 
               class="unit-card" 
               :style="{ backgroundColor: statusColorMap.get(item.data['銷控後台狀態']) || '#ffffff' }">
            <!-- ✅ 修改：顯示三行資訊 -->
            <span class="unit-name">{{ item.data['戶別'] }}</span>
            <span class="unit-total-price">{{ item.data['房屋總表價'] }}萬</span>
            <span class="unit-area">{{ item.data['房屋面積(坪)'] }}坪</span>
            <span class="unit-per-price">{{ item.data['房屋單價(表價)'] }}萬/坪</span>
              
          </div>
          <div v-else class="unit-card empty"></div>
        </div>
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
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { fetchSalesControlData } from '@/api';

const route = useRoute();
const loading = ref(true);
const error = ref(null);
const allData = ref({});

// --- Refs for DOM elements ---
const headerTopRef = ref(null);
const headerLeftRef = ref(null);
const mainGridRef = ref(null);

// --- 數據處理 (與之前類似) ---
const filteredSalesData = computed(() => {
  const data = allData.value['銷控'] || [];
  return data.filter(item => item['房型'] !== '店面');
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

// ✅ 修改：重構 gridData，將面積資訊也合併進來
const gridData = computed(() => {
  const dataMap = {};
  for (const record of filteredSalesData.value) {
    const floor = record['樓層'];
    const building = record['棟別'];
    const unitId = record['戶別'];

    // 分別獲取對應的價格和面積資訊
    const priceInfo = priceMap.value.get(unitId) || {};
    const areaInfo = areaMap.value.get(unitId) || {};

    if (!dataMap[floor]) {
      dataMap[floor] = {};
    }
    
    // 將三份數據合併成一個完整的物件
    dataMap[floor][building] = {
      ...record,    // 銷控資訊
      ...priceInfo, // 價格資訊
      ...areaInfo   // 面積資訊
    };
  }
  return dataMap;
});

// ✅ 新增：將二維數據扁平化以適應 CSS Grid 的自動流動佈局
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


// ✅ 核心：滾動同步函數
function handleScroll(event) {
  if (headerTopRef.value) {
    headerTopRef.value.scrollLeft = event.target.scrollLeft;
  }
  if (headerLeftRef.value) {
    headerLeftRef.value.scrollTop = event.target.scrollTop;
  }
}

// ✅ 新增：創建一個以「戶別」為 key 的價格映射表，方便快速查找
const priceMap = computed(() => {
  const priceData = allData.value['價格'] || [];
  const map = new Map();
  for (const item of priceData) {
    if (item['戶別']) {
      map.set(item['戶別'], item);
    }
  }
  return map;
});

// ✅ 新增：創建一個以「戶別」為 key 的面積映射表
const areaMap = computed(() => {
  const areaData = allData.value['面積'] || [];
  const map = new Map();
  for (const item of areaData) {
    if (item['戶別']) {
      map.set(item['戶別'], item);
    }
  }
  return map;
});

// ✅ 新增：創建一個「銷控後台狀態」到「色碼」的映射表
const statusColorMap = computed(() => {
  // 數據源來自 '參數' 工作表
  const paramsData = allData.value['參數'] || [];
  const map = new Map();
  for (const item of paramsData) {
    // 確保欄位名與你的 Sheet 完全一致
    const status = item['銷控狀態']; 
    const color = item['色碼'];
    if (status && color) {
      map.set(status, color);
    }
  }
  return map;
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
/* 頁面主容器：使用 Grid 佈局來劃分四個區域 */
.sales-control-page {
  height: 100vh;
  background-color: #f0f2f5;
  display: grid;
  /* 定義左側表頭寬度和主內容區域 */
  grid-template-columns: 20px 40px 1fr; 
  /* 定義頂部表頭高度和主內容區域 */
  grid-template-rows: 40px 1fr;
  overflow: hidden; /* 禁止頁面本身滾動 */
}

/* 1. 左上角空白格 */
.header-top-left {
  grid-column: 2;
  grid-row: 1;
  
  z-index: 3;
}

/* 2. 頂部棟別表頭容器 */
.header-top-container {
  grid-column: 3;
  grid-row: 1;
  
  overflow: hidden; /* 隱藏自己的滾動條 */
  z-index: 2;
  display: flex; /* 讓內部元素水平排列 */
}

/* 3. 左側樓層表頭容器 */
.header-left-container {
  grid-column: 2;
  grid-row: 2;
  background-color: #f0f2f5;
  overflow: hidden;
  z-index: 2;
  padding-bottom: 20px;
  box-sizing: border-box;

  /* 新增：將其變為 Flexbox 容器 */
  display: flex;
  flex-direction: column; /* 讓子元素垂直排列 */
  gap: 10px; /* 關鍵：在子元素之間創建 10px 的間距 */
  padding-top: 5px;
}


/* 4. 主要數據滾動區域 */
.main-grid-container {
  grid-column: 3;
  grid-row: 2;
  overflow: auto; /* ✅ 只有這個容器可以滾動 */
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
  /* 移除通用的 margin */
  /* margin: 5px; <-- 刪除或註釋掉這一行 */
}
/* 頂部棟別表頭儲存格 (給它自己的 margin) */
.header-top-container .header-cell {
  width: 120px;
  height: 30px;
  margin: 5px; /* 只給頂部表頭保留 margin */
}
/* 左側樓層表頭儲存格 (不需要 margin，由 gap 控制) */
.header-left-container .header-cell {
  width: 40px;
  height: 90px;
  /* margin 在通用 .header-cell 中已被移除 */
}

/* 數據網格 */
.grid-table {
  display: grid;
  gap: 10px;
  padding: 5px; /* 給網格內容一點內邊距 */
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
  padding: 6px 4px; /* 稍微減小垂直 padding */
  box-sizing: border-box;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  text-align: center;
}


.unit-card.empty {
  background-color: #e9ecef;
  box-shadow: none;
}
/* 戶別名稱 (最重要，字體最大最粗) */
.unit-name {
  font-size: 0.95rem; /* 17-18px */
  font-weight: 600; /* 半粗體 */
  color: #1a237e; /* 深藍色，與表頭呼應 */
  margin-bottom: 0px;
}

/* 房屋總表價 (次要資訊，字體中等) */
.unit-total-price {
  font-size: 0.95rem; /* 14-15px */
  font-weight: 700;
  color: #d81b60; /* 醒目的桃紅色 */
  margin-bottom: 0px;
}

/* 房屋單價(表價) (輔助資訊，字體最小) */
.unit-per-price {
  font-size: 0.8rem; /* 12-13px */
  font-weight: 400;
  color: #546e7a; /* 穩重的灰藍色 */
}

/* ✅ 新增：房屋面積的樣式 */
.unit-area {
  font-size: 0.8rem; /* 13px */
  font-weight: 700; /* 正常粗細 */
  color: #37474f; /* 中性的灰藍色 */
  margin-bottom: 0px;
}

/* 加載和錯誤狀態 */
.status-container {
  /* 使用絕對定位來脫離 Grid 佈局流 */
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  /* 使用 Flexbox 讓內部文字完美居中 */
  display: flex;
  justify-content: center;
  align-items: center;
  
  font-size: 1.2rem;
  background-color: rgba(240, 242, 245, 0.8); /* 半透明背景，體驗更好 */
  z-index: 10; /* 確保在最上層 */
}
</style>