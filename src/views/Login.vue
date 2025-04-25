// src/views/Login.vue
<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="pa-4">
          <v-card-title>登入</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="submit">
              <v-text-field v-model="name" label="姓名" required />
              <v-text-field v-model="password" label="密碼" type="password" required />
              <v-alert v-if="error" type="error" class="mt-2" dense>{{ error }}</v-alert>
              <v-btn :loading="loading" type="submit" color="primary" block class="mt-4">登入</v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/user';
import { loginUser } from '../api';

const emit = defineEmits(['start-loading', 'stop-loading', 'notify']);
const name = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const router = useRouter();
const userStore = useUserStore();

const submit = async () => {
  error.value = '';
  loading.value = true;
  emit('start-loading');

  const result = await loginUser(name.value, password.value);

  loading.value = false;
  emit('stop-loading');

  if (result.status === 'success') {
    userStore.setUser(result.user);
    emit('notify', '登入成功');
    router.push('/home');
  } else if (result.status === 'wrong_password') {
    error.value = '密碼錯誤，請重新輸入';
  } else if (result.status === 'not_found') {
    error.value = '您的姓名不可使用，請與管理人員聯繫';
  } else {
    error.value = result.message || '登入失敗';
  }
};
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>
