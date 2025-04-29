<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center" class="text-center">
      <v-col cols="12" sm="6" md="4">
        <v-btn
          class="feature-button"
          color="primary"
          block
          large
          @click="goTo('inspection')"
        >
          <v-icon start size="28">mdi-home-search</v-icon>
          查看戶別
        </v-btn>
      </v-col>

      <v-col cols="12" sm="6" md="4">
        <v-btn
          class="feature-button"
          color="success"
          block
          large
          @click="goTo('overview')"
        >
          <v-icon start size="28">mdi-view-list</v-icon>
          驗屋紀錄總覽
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goTo = (page) => {
  if (page === 'inspection') {
    router.push('/inspection-record'); // ✅ 記得這裡是你的驗屋紀錄路由
  } else if (page === 'overview') {
    router.push('/inspection-overview'); // ✅ 記得這裡是你的總覽頁路由
  }
};
</script>

<style scoped>
.feature-button {
  transition: transform 0.2s, box-shadow 0.2s;
  font-size: 1.2rem;
  padding: 1.5rem;
}
.feature-button:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
}
</style>
