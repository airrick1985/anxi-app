<template>
  <v-bottom-navigation
    v-model="current"
    app
    grow
    background-color="white"
    color="grey darken-1"
    active-color="primary"
    height="64"
  >
    <v-btn
      value="home"
      @click="handleHomeClick"
      :active="current === 'home'"
    >
      <v-icon>mdi-home</v-icon>
      <span class="tab-label">首頁</span>
    </v-btn>

    <v-btn
      value="inspection-record"
      @click="goTo('/inspection-record')"
      :active="current === 'inspection-record'"
    >
      <v-icon>mdi-home-search</v-icon>
      <span class="tab-label">驗屋紀錄</span>
    </v-btn>

    <v-btn
      value="inspection-overview"
      @click="goTo('/inspection-overview')"
      :active="current === 'inspection-overview'"
    >
      <v-icon>mdi-view-list</v-icon>
      <span class="tab-label">驗屋總覽</span>
    </v-btn>
  </v-bottom-navigation>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useRegisterSW } from 'virtual:pwa-register/vue';

const router = useRouter();
const route = useRoute();
const current = ref('');

const { updateServiceWorker } = useRegisterSW({ immediate: true });

const setCurrentTab = () => {
  if (route.path.startsWith('/home')) {
    current.value = 'home';
  } else if (route.path.startsWith('/inspection-record')) {
    current.value = 'inspection-record';
  } else if (route.path.startsWith('/inspection-overview')) {
    current.value = 'inspection-overview';
  } else {
    current.value = '';
  }
};

setCurrentTab();

watch(() => route.path, () => {
  setCurrentTab();
});

const goTo = (path) => {
  if (router.currentRoute.value.path !== path) {
    router.push(path);
  }
};

// === 加上連點 5 下更新功能 ===
const homeClickCount = ref(0);
let clickTimer = null;

const handleHomeClick = () => {
  homeClickCount.value++;
  if (homeClickCount.value >= 5) {
    console.log('🔄 觸發強制更新');
    updateServiceWorker(true).then(() => {
      window.location.reload();
    });
    homeClickCount.value = 0;
    clearTimeout(clickTimer);
  } else {
    if (clickTimer) clearTimeout(clickTimer);
    clickTimer = setTimeout(() => {
      homeClickCount.value = 0;
    }, 3000); // 3 秒內沒連點就重置
  }
};
</script>

<style scoped>
.tab-label {
  font-size: 0.7rem;
}
</style>
