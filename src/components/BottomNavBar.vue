<template>
  <div class="bottom-nav-wrapper">
    <v-bottom-navigation
      app
      color="white"
      grow
      height="65"
      class="bottom-nav-float"
      elevation="12"
    >
      <v-btn
        :class="{ 'active-btn': isActive('/home') }"
        stacked
        :ripple="true"
        @click="handleHomeClick"
      >
        <v-icon>mdi-home</v-icon>
        首頁
      </v-btn>

      <v-btn
        :class="{ 'active-btn': isActive('/inspection-record') }"
        stacked
        :ripple="true"
        @click="navigate('/inspection-record')"
      >
        <v-icon>mdi-clipboard-text</v-icon>
        查看戶別
      </v-btn>

      <v-btn
        :class="{ 'active-btn': isActive('/inspection-overview') }"
        stacked
        :ripple="true"
        @click="navigate('/inspection-overview')"
      >
        <v-icon>mdi-file-document-multiple</v-icon>
        驗屋總覽
      </v-btn>
    </v-bottom-navigation>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useRegisterSW } from 'virtual:pwa-register/vue';

const router = useRouter();
const route = useRoute();
const { updateServiceWorker } = useRegisterSW({ immediate: true });

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
    if (route.path !== '/home') {
      router.push('/home');
    }
    if (clickTimer) clearTimeout(clickTimer);
    clickTimer = setTimeout(() => {
      homeClickCount.value = 0;
    }, 3000);
  }
};

const navigate = (path) => {
  if (route.path !== path) {
    router.push(path);
  } else {
    const navBtn = document.querySelector(`a[href='${path}']`)?.parentElement;
    if (navBtn) {
      navBtn.classList.add('bounce');
      setTimeout(() => navBtn.classList.remove('bounce'), 400);
    }
  }
};

const isActive = (path) => route.path === path;
</script>

<style scoped>
.bottom-nav-wrapper {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 95%;
  max-width: 500px;
  z-index: 99;
}

.bottom-nav-float {
  border-radius: 20px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.active-btn {
  color: #1976d2 !important;
}

@keyframes bounce {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

.bounce {
  animation: bounce 0.4s ease;
}
</style>
