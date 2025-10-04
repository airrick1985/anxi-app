<template>
  <v-overlay
    :model-value="isUpdating"
    class="align-center justify-center"
    persistent
  >
    <v-progress-circular
      color="white"
      indeterminate
      size="64"
    ></v-progress-circular>
    <div class="text-center mt-4 text-white">應用程式更新中...</div>
  </v-overlay>
</template>

<script setup>
import { ref } from 'vue';
import { registerSW } from 'virtual:pwa-register';

const isUpdating = ref(false);

registerSW({
  onRegistered(r) {
    console.log(`Service Worker registered: ${r}`);
  },
  onRegisterError(error) {
    console.error('Service Worker registration error:', error);
  },
  onNeedRefresh() {
    // 偵測到需要更新時，直接顯示遮罩並執行更新
    isUpdating.value = true;
    updateServiceWorker();
  },
  onOfflineReady() {
    console.log('App is ready to work offline.');
  },
});

// updateServiceWorker 會在 onNeedRefresh 內部被呼叫，但我們需要從 registerSW 返回值中獲取它
const { updateServiceWorker } = registerSW();

</script>

<style scoped>
.text-white {
  color: white;
}
</style>