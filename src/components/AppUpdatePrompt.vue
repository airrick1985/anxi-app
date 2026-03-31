<template>
  <v-overlay :model-value="updateStore.needRefresh" class="d-flex align-center justify-center" persistent scrim="black"
    z-index="9999">
    <v-card class="pa-6 text-center" elevation="12" max-width="400" rounded="lg" title="發現新版本！">
      <v-card-text class="text-h6 my-4">
        為了確保最佳體驗與功能正常，請立即更新應用程式。
      </v-card-text>

      <v-card-actions class="justify-center">
        <v-btn color="primary" variant="elevated" size="large" @click="handleUpdate">
          立即更新
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-overlay>
</template>

<script setup>
import { useUpdateStore } from '@/store/updateStore';

const updateStore = useUpdateStore();

function handleUpdate() {
  updateStore.applyUpdate();
}
</script>