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
    <div class="text-center mt-4 text-white">更新中...</div>
  </v-overlay>
</template>

<script setup>
import { ref } from 'vue';
import { useRegisterSW } from 'virtual:pwa-register/vue';

const isUpdating = ref(false);

const { updateServiceWorker } = useRegisterSW({
  onRegistered(r) {
    console.log(`Service Worker registered: ${r}`);
  },
  onRegisterError(error) {
    console.error('Service Worker registration error:', error);
  },
  onNeedRefresh() {
    console.log('Update required. Refreshing...');
    // 偵測到需要更新時，直接顯示遮罩並執行更新
    isUpdating.value = true;
    updateServiceWorker();
  },
  onOfflineReady() {
    console.log('App is ready to work offline.');
  },
});

</script>

<style scoped>
.text-white {
  color: white;
}
</style>