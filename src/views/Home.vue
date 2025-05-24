<template>
  <div class="home-container">
    <button class="icon-button" @click="goToInspectionSystem">
      <span class="icon">🏠</span>
      <span class="text">驗屋系統</span>
    </button>
    <button class="icon-button">
      <span class="icon">📊</span>
      <span class="text">銷控系統</span>
    </button>
    <button class="icon-button">
      <span class="icon">👥</span>
      <span class="text">客戶管理系統</span>
    </button>
    <button class="icon-button">
      <span class="icon">🔄</span>
      <span class="text">客變系統</span>
    </button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goToInspectionSystem = () => {
  router.push({ name: 'InspectionSystem' }); // 假設路由名稱將是 'InspectionSystem'
};
</script>

<style scoped>
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
  width: 120px; /* 或適合的寬度 */
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
