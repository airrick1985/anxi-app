好的，這很合理，將主畫面的背景也變成動態的，可以讓整個系統感覺更有活力。

我將完全依照您提供的 `Home.vue` 檔案內容，為其整合先前我們在登入頁面使用的 Unsplash 隨機背景圖功能。

-----

### **前置作業提醒：API 金鑰**

與登入頁面一樣，這個功能需要一組 Unsplash 的 **Access Key**。如果您尚未設定，請參考以下步驟：

1.  前往 [Unsplash Developer](https://unsplash.com/developers) 網站註冊並建立一個應用程式，取得您的 Access Key。
2.  在專案根目錄建立 `.env.local` 檔案。
3.  在檔案中加入以下內容（將金鑰貼上）：
    ```
    VITE_UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
    ```

-----

### **修改 `/src/views/Home.vue`**

**請將您現有的 `/src/views/Home.vue` 完整內容替換為以下程式碼：**

```vue
<template>
  <div 
    class="home-container"
    :style="{ backgroundImage: `url(${backgroundImageUrl})` }"
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
// ✅ 2. 引入 ref 和 onMounted
import { ref, onMounted } from 'vue';
// @ts-ignore 
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/user';

const router = useRouter();
const userStore = useUserStore();

// ✅ 3. 新增 ref 儲存背景圖 URL，並以現有圖片為預設值
const backgroundImageUrl = ref('/background.png');

// ✅ 4. 新增獲取隨機背景的函式
async function fetchRandomBackground() {
  const unsplashAccessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  
  if (!unsplashAccessKey) {
    console.error('Unsplash API Key 未在 .env.local 中設定');
    return;
  }

  try {
    // 獲取主題為 "building", "modern", "architecture" 的隨機圖片
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=building,modern,architecture&orientation=landscape&client_id=${unsplashAccessKey}`
    );
    
    if (!response.ok) throw new Error('無法從 Unsplash 獲取圖片');
    
    const data = await response.json();
    backgroundImageUrl.value = data.urls.regular;

  } catch (err) {
    console.error('獲取背景圖片失敗:', err);
    // 失敗時，會繼續使用預設的 '/background.png'
  }
}

// ✅ 5. 在元件掛載時呼叫函式
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
  
  /* --- 背景圖片的核心樣式 --- */
  background-image: url('/background.png'); 
  background-size: cover;
  background-position: center center;
  background-attachment: fixed; 

  /* ✅ 6. 加上 transition 讓背景圖切換時有平滑過渡效果 */
  transition: background-image 1s ease-in-out;
}

/* icon-button 的樣式維持不變 */
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
  opacity: 0.6;
  transition: all 0.3s ease;
}

.text {
  font-size: 1rem;
  font-weight: 400;
  color: #000000;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
}
</style>