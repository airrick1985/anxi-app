<template>
  <v-bottom-navigation app color="primary" grow>
    <!-- 首頁 -->
    <v-btn @click="handleHomeClick" stacked>
      <v-icon>mdi-home</v-icon>
      首頁
    </v-btn>

    <!-- 驗屋紀錄 -->
    <v-btn @click="router.push('/inspection-record')" stacked>
      <v-icon>mdi-clipboard-text</v-icon>
      驗屋紀錄
    </v-btn>

    <!-- 驗屋總覽 -->
    <v-btn @click="router.push('/inspection-overview')" stacked>
      <v-icon>mdi-file-document-multiple</v-icon>
      驗屋總覽
    </v-btn>
  </v-bottom-navigation>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useRegisterSW } from 'virtual:pwa-register/vue';

const router = useRouter();
const { updateServiceWorker } = useRegisterSW({ immediate: true });

// === 連點 Home 按鈕 5次快速觸發更新 ===
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
    // 正常跳回首頁
    router.push('/home');

    if (clickTimer) clearTimeout(clickTimer);
    clickTimer = setTimeout(() => {
      homeClickCount.value = 0;
    }, 3000); // 3秒沒連點自動重置
  }
};
</script>

<style scoped>
.v-bottom-navigation {
  height: 60px;
}
</style>
