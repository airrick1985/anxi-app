<template>
  <div 
    class="home-container"
    :style="containerStyle"
  >
    <button class="icon-button" v-if="userStore.hasPermission('驗屋系統')" @click="goToInspectionSystem">
      <img src="/img/icons/property.svg" alt="驗屋系統圖標" class="icon" />
      <span class="text">驗屋系統</span>
    </button>
    
    <button class="icon-button" v-if="userStore.hasPermission('報價系統')" @click="goToEntryPage('quote')">
      <img src="/img/icons/tablet.svg" alt="報價系統圖標" class="icon" />
      <span class="text">報價系統</span>
    </button>

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
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/user';

const router = useRouter();
const userStore = useUserStore();

// ✅ 2. 新增背景圖相關邏輯
const backgroundImageUrl = ref('/background.png');

const containerStyle = computed(() => ({
  '--bg-image-url': `url(${backgroundImageUrl.value})`
}));

async function fetchRandomBackground() {
  const unsplashAccessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  if (!unsplashAccessKey) {
    console.error('Unsplash API Key 未在 .env.local 中設定');
    return;
  }
  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=building,modern,architecture&orientation=landscape&client_id=${unsplashAccessKey}`
    );
    if (!response.ok) throw new Error('無法從 Unsplash 獲取圖片');
    const data = await response.json();
    backgroundImageUrl.value = data.urls.full;
  } catch (err) {
    console.error('獲取背景圖片失敗:', err);
  }
}

onMounted(() => {
  fetchRandomBackground();
});

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

  /* ✅ 3. 修改 background-image，使用漸層遮罩 + CSS 變數 */
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
    var(--bg-image-url, url('/background.png'));
  
  background-size: cover;
  background-position: center center;
  background-attachment: fixed;
  transition: background-image 1s ease-in-out;
}

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
  /* ✅ 4. 將文字改為白色並加強陰影，以適應變暗的背景 */
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}
</style>