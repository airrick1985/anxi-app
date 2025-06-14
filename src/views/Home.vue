<template>
  <div class="home-container">
    <button class="icon-button" v-if="userStore.hasPermission('驗屋系統')" @click="goToInspectionSystem">
      <img src="/img/icons/property.svg" alt="驗屋系統圖標" class="icon" />
       <span class="text">驗屋系統</span>
    </button>
    
     <!-- ✅ 修改：報價系統按鈕 -->
    <button class="icon-button" v-if="userStore.hasPermission('報價系統')" @click="goToEntryPage('quote')">
       <img src="/img/icons/tablet.svg" alt="報價系統圖標" class="icon" />
      <span class="text">報價系統</span>
    </button>

     <!-- ✅ 修改：銷控系統按鈕 -->
     <button class="icon-button" v-if="userStore.hasPermission('銷控系統')" @click="goToEntryPage('sales')">
      <img src="/img/icons/sales.svg" alt="銷控系統圖標" class="icon" /> 
      <span class="text">銷控系統</span>
    </button>
    <button class="icon-button" v-if="userStore.hasPermission('客戶管理')">
      <img src="/img/icons/customer.svg" alt="客戶管理圖標" class="icon" />
      <span class="text">客戶管理</span>
    </button>
    <button class="icon-button" v-if="userStore.hasPermission('客變系統')">
      <img src="/img/icons/blueprint.svg" alt="客變系統圖標" class="icon" />
      <span class="text">客變系統</span>
    </button>
  </div>
</template>

<script setup>
// @ts-ignore 
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/user';

const router = useRouter();
const userStore = useUserStore();

const goToInspectionSystem = () => {
  router.push({ name: 'InspectionSystem' }); 
};

// ✅ 修改：讓這個函數更通用
const goToEntryPage = (mode) => {
  console.log(`[Home.vue] Navigating to entry page with mode: ${mode}`); 
  router.push({ 
    name: 'SalesControlSystemEntry',
    // ✅ 關鍵：附加查詢參數
    query: { viewMode: mode } 
  });
};
</script>

<style scoped>

.icon{
  width: 50px; /* 圖標寬度 */
  height: 50px; /* 圖標高度 */
  display: flex;
  align-items: center;
  justify-content: center;
}


.home-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  padding: 40px;
  gap: 30px;
  min-height: 100vh;
  box-sizing: border-box; /* 確保 padding 不會讓容器超出 100vh */

  /* ✅ --- 背景圖片的核心樣式 --- ✅ */
  
  /* 1. 設置背景圖片的路徑 */
  /* URL 相對於 public 文件夾的根路徑 */
  background-image: url('/background.png'); 
  
  /* 2. 讓背景圖片覆蓋整個容器 */
  background-size: cover;
  
  /* 3. 將背景圖片居中顯示 */
  background-position: center center;
  
  /* 4. (可選但推薦) 固定背景，使其在滾動時不移動，產生視差效果 */
  background-attachment: fixed; 
}


/* ✅ 應用液態玻璃風格 */
.icon-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 150px;   /* 稍微加大尺寸 */
  height: 150px;
  padding: 20px;
  text-align: center;
  
  /* 核心樣式 */
  background: rgba(255, 255, 255, 0.3); /* 半透明背景 */
  backdrop-filter: blur(15px); /* 背景模糊，實現磨砂玻璃效果 */
  border: 2px solid rgba(255, 255, 255, 0.2); /* 邊緣高光 */
  border-radius: 20px; /* 更大的圓角 */
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15); /* 更柔和的陰影 */
  
  cursor: pointer;
  /* 關鍵：使用 all 來讓所有屬性（包括 box-shadow, transform）都平滑過渡 */
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.icon-button:hover {
  /* 互動時「浮起」，並增加光暈效果 */
  transform: translateY(-8px) scale(1.05);
  box-shadow: 0 16px 40px 0 rgba(31, 38, 135, 0.2), 
              0 0 20px rgba(255, 255, 255, 0.6); /* 增加白色光暈 */
  background: rgba(255, 255, 255, 0.7);
}

.icon {
  width: 60px;
  height: 60px;
  margin-bottom: 12px;

  /* ✅ 關鍵修改：使用 drop-shadow 和透明度 */

  /* 1. 使用 drop-shadow 創建一個向下的、深色的內陰影，模擬蝕刻感 */
  /* 參數: [x-offset] [y-offset] [blur-radius] [color] */
  filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.2));
  
  /* 2. 降低圖標自身的不透明度，讓它更好地融入玻璃背景 */
  opacity: 0.8;

  transition: all 0.3s ease;
}

.text {
  font-size: 1rem;
  font-weight: 600;
  color: #1a237e;
  /* 給文字也加上一點陰影，增加可讀性 */
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
}
</style>
