<template>
  <v-container class="fill-height" fluid>
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="4">
        <v-card elevation="6">
          <v-card-title class="text-h6 text-center">登入 ANXI 驗屋 APP</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="handleLogin">
              <v-text-field
                v-model="username"
                label="姓名"
                prepend-icon="mdi-account"
                required
              />
              <v-text-field
                v-model="password"
                label="密碼"
                type="password"
                prepend-icon="mdi-lock"
                required
              />
              <v-alert
                v-if="errorMsg"
                type="error"
                dense
                class="mt-2"
              >{{ errorMsg }}</v-alert>
              <v-btn
                type="submit"
                color="primary"
                class="mt-4"
                block
              >登入</v-btn>
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

const username = ref('');
const password = ref('');
const errorMsg = ref('');
const router = useRouter();
const userStore = useUserStore();

const handleLogin = async () => {
  errorMsg.value = '';
  const result = await loginUser(username.value, password.value);

  if (result.status === 'not_found') {
    errorMsg.value = '您的姓名不可使用，請與管理人員聯繫';
  } else if (result.status === 'wrong_password') {
    errorMsg.value = '密碼錯誤，請重新輸入';
  } else if (result.status === 'success') {
    userStore.setUser(result.user);
    router.push('/home');
  } else {
    errorMsg.value = '登入失敗，請稍後再試';
  }
};
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>