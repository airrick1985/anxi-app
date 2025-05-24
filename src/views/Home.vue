<template>
  <div class="home-container">
    <button class="icon-button" v-if="userStore.hasPermission('驗屋系統')" @click="goToInspectionSystem">
      <img src="/img/icons/property.svg" alt="驗屋系統圖標" class="icon" />
       <span class="text">驗屋系統</span>
    </button>
    <button class="icon-button" v-if="userStore.hasPermission('銷控系統')">
       <img src="/img/icons/tablet.svg" alt="銷控系統圖標" class="icon" />
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
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/user';

const router = useRouter();
const userStore = useUserStore();

const goToInspectionSystem = () => {
  router.push({ name: 'InspectionSystem' }); 
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
  align-items: flex-start; /* 或者 center，根據視覺需求調整 */
  padding: 20px;
  gap: 20px; /* 按鈕之間的間距 */
}
.icon-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100px; /* 或適合的寬度 */
  height: 100px; /* 或適合的高度 */
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
  cursor: pointer;
  text-align: center;
}
.icon-button:hover {
  background-color: #e9e9e9;
}
.icon-button .icon {
  font-size: 2em; /* 圖標大小 */
  margin-bottom: 8px;
}
.icon-button .text {
  font-size: 0.9em; /* 文字大小 */
}
</style>
