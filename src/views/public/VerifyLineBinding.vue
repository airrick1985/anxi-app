<template>
  <v-container fluid class="fill-height" style="background-color: #F4F4F7;">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12 text-center pa-8">
          <div v-if="isLoading">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
            <p class="text-h6 mt-4">正在驗證您的連結...</p>
          </div>
          <div v-else-if="message">
            <v-icon :color="isSuccess ? 'success' : 'error'" size="80" class="mb-4">
              {{ isSuccess ? 'mdi-check-circle-outline' : 'mdi-alert-circle-outline' }}
            </v-icon>
            <p class="text-h5 font-weight-bold">{{ message }}</p>
            <p class="text-caption text-grey mt-4">您可以關閉此頁面了。</p>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { finalizeLineBinding } from '@/api';

const route = useRoute();
const isLoading = ref(true);
const isSuccess = ref(false);
const message = ref('');

onMounted(async () => {
  const token = route.query.token;

  if (!token) {
    message.value = '驗證連結無效，缺少 Token。';
    isLoading.value = false;
    return;
  }

  try {
    const result = await finalizeLineBinding({ token });
    if (result.status === 'success') {
      message.value = result.message || '綁定成功！';
      isSuccess.value = true;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    message.value = error.message || '驗證失敗，請重新操作。';
    isSuccess.value = false;
  } finally {
    isLoading.value = false;
  }
});
</script>