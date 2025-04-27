<template>
  <v-bottom-navigation
    v-model="active"
    grow
    app
  >
    <!-- 首頁 -->
    <v-btn
      :value="0"
      :to="{ name: 'Home' }"
      replace
    >
      <v-icon size="24">mdi-home</v-icon>
      <small>首頁</small>
    </v-btn>

    <!-- 驗屋紀錄 -->
    <v-btn
      :value="1"
      :to="{ name: 'InspectionRecord' }"
      replace
    >
      <v-icon size="24">mdi-home-search</v-icon>
      <small>驗屋紀錄</small>
    </v-btn>

    <!-- 紀錄總覽 -->
    <v-btn
      :value="2"
      :to="{ name: 'InspectionOverview' }"
      replace
    >
      <v-icon size="24">mdi-view-list</v-icon>
      <small>紀錄總覽</small>
    </v-btn>
  </v-bottom-navigation>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const active = ref(0);

// 當路由切換時，更新 Tab 選取狀態
watch(
  () => route.name,
  (name) => {
    if (name === 'Home') active.value = 0;
    else if (name === 'InspectionRecord') active.value = 1;
    else if (name === 'InspectionOverview') active.value = 2;
  }
);
</script>

<style scoped>
.v-bottom-navigation {
  position: fixed;
  bottom: 0;
  width: 100%;
}
</style>
