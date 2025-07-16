<template>
  <div 
    class="home-container"
    :style="containerStyle"
  >
    <button class="icon-button" v-if="userStore.hasPermission('驗屋系統')" @click="goToInspectionSystem">
      <img src="/img/icons/property.png" alt="驗屋系統圖標" class="icon" />
      <span class="text">驗屋系統</span>
    </button>
    
    <button class="icon-button" v-if="userStore.hasPermission('報價系統')" @click="goToEntryPage('quote')">
      <img src="/img/icons/price.png" alt="報價系統圖標" class="icon" />
      <span class="text">報價系統</span>
    </button>

    <button class="icon-button" v-if="userStore.hasPermission('銷控系統')" @click="goToEntryPage('sales')">
      <img src="/img/icons/table.png" alt="銷控系統圖標" class="icon" /> 
      <span class="text">銷控系統</span>
    </button>
    <button class="icon-button" v-if="userStore.hasPermission('客戶管理')">
      <img src="/img/icons/customer.png" alt="客戶管理圖標" class="icon" />
      <span class="text">客戶管理</span>
    </button>
    <button class="icon-button" v-if="userStore.hasPermission('客變系統')">
      <img src="/img/icons/blueprint.png" alt="客變系統圖標" class="icon" />
      <span class="text">客變系統</span>
    </button>
  </div>
</template>

<script setup>
// ✅ 核心修改：Script 變得非常乾淨
import { ref, computed } from 'vue'; // 移除了 onMounted
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/user';

const router = useRouter();
const userStore = useUserStore();

// 1. 直接將圖片路徑寫在這裡
// 這個路徑是相對於 public 資料夾的根目錄
const backgroundImageUrl = ref('login-bg.jpg'); // 使用我們修正過的相對路徑

// 2. containerStyle 的邏輯完全不變
const containerStyle = computed(() => ({
  '--bg-image-url': `url(${backgroundImageUrl.value})`
}));

// 3. 原本的 fetchRandomBackground 和 onMounted 已被移除

const goToInspectionSystem = () => {
  router.push({ name: 'InspectionSystem' }); 
};

const goToEntryPage = (mode) => {
  console.log(`[Home.vue] Navigating to entry page with mode: ${mode}`); 
  router.push({ 
    name: 'SalesControlSystemEntry',
    query: { viewMode: mode } 
  });
};
</script>

<style scoped>
.home-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  padding: 40px;
  gap: 30px;
  min-height: 100vh;
  box-sizing: border-box;

  /* ✅ CSS 的部分完全不需要修改，它會自動讀取 JS 中的變數 */
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)),
    var(--bg-image-url, url('/background.png')); /* background.png 是備用圖 */
  
  background-size: cover;
  background-position: center center;
  background-attachment: fixed;
  transition: background-image 1s ease-in-out;
}

/* --- 其他所有 style 內容維持原樣即可 --- */

.icon-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  padding: 10px;
  text-align: center;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.icon-button:hover {
  transform: translateY(-8px) scale(1.05);
  box-shadow: 0 16px 40px 0 rgba(31, 38, 135, 0.2), 
              0 0 20px rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.496);
}

.icon {
  width: 60px;
  height: 60px;
  margin-bottom: 12px;
  filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.2));
  opacity: 0.8;
  transition: all 0.3s ease;
}

.text {
  font-size: 1rem;
  font-weight: 400;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}
</style>