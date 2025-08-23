<template>
  <component :is="layoutComponent">
    <router-view />
  </component>
</template>

<script setup>
import { computed, defineAsyncComponent,onMounted } from 'vue'; // 導入 defineAsyncComponent
import { useRoute } from 'vue-router';
import DefaultLayout from './layouts/DefaultLayout.vue';
import { useProjectStore } from '@/store/projectStore';


const route = useRoute();
const projectStore = useProjectStore();


const layoutComponent = computed(() => {
  const layoutLoader = route.meta.layout;

  // ✅ 核心修正 1:
  // 如果路由的 meta 中有 layout 屬性 (它是一個異步載入函式)
  if (layoutLoader) {
    // 我們使用 defineAsyncComponent 將它包裝起來，
    // Vue 就知道要如何正確地處理這個異步載入的元件。
    return defineAsyncComponent(layoutLoader);
  }
  
  // 如果路由沒有指定 layout，則回傳靜態載入的 DefaultLayout
  return DefaultLayout;
});

onMounted(() => {
  // 當應用程式掛載時，觸發 action 來獲取所有專案資料
  projectStore.fetchProjects();
});

</script>

<style>
/* 您原本在 App.vue 中的全局 CSS 樣式可以保留在這裡 */
html {
  overflow-y: auto !important;
}
.v-main::-webkit-scrollbar {
  width: 8px;
}
.v-main::-webkit-scrollbar-thumb {
  background: #90A4AE;
  border-radius: 4px;
}
.v-main::-webkit-scrollbar-track {
  background: #CFD8DC;
}
</style>