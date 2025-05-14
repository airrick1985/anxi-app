// src/views/Login.vue

<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="pa-4">
          <v-card-title class="text-center">選擇您要登入的建案</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="submit">

              <v-select
  v-model="projectName"
  :items="projectOptions"
  label="請選擇建案"
  item-title="text"
  item-value="value"
  required
  :rules="[v => !!v || '建案為必選欄位']"
  class="mb-2"
/>

              <!-- **** 修改這裡：使用手機號碼登入 **** -->
              <v-text-field
                v-model="key"
                label="手機號碼"
                required
                placeholder="請輸入註冊的手機號碼"
                type="tel"
                :rules="[v => !!v || '手機號碼為必填欄位']"
                class="mb-2"
              />
              <!-- **** 修改結束 **** -->
              <v-text-field
                v-model="password"
                label="密碼"
                type="password"
                required
                placeholder="請輸入密碼"
                :rules="[v => !!v || '密碼為必填欄位']"
              />
              <v-alert v-if="error" type="error" class="mt-3" dense>{{ error }}</v-alert>
              <v-btn :loading="loading" type="submit" color="primary" block class="mt-4">登入</v-btn>
            </v-form>
            <v-btn text block class="mt-2" color="secondary" @click="forgotDialog = true">
  忘記密碼？
</v-btn>

<!-- 忘記密碼 Dialog -->
<v-dialog v-model="forgotDialog" max-width="400px">
  <v-card>
    <v-card-title>忘記密碼</v-card-title>
    <v-card-text>
      <v-text-field
        v-model="forgotKey"
        label="手機號碼"
        placeholder="請輸入註冊手機號碼"
        type="tel"
        :rules="[v => !!v || '手機號碼必填']"
      />
      <v-alert v-if="forgotError" type="error" dense>{{ forgotError }}</v-alert>
      <v-alert v-if="forgotSuccess" type="success" dense>{{ forgotSuccess }}</v-alert>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn text @click="forgotDialog = false">取消</v-btn>
      <v-btn color="primary" :loading="forgotLoading" @click="submitForgotPassword">送出</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>


          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { getProjectList } from '../api'; 

onMounted(async () => {
  const result = await getProjectList();
  if (result.status === 'success') {
    projectOptions.value = result.projects;
  } else {
    error.value = result.message || '無法載入建案清單';
  }
});

import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/user';
import { loginUser } from '../api'; 
import { forgotPasswordUser } from '../api'; 
import { checkUpdate } from '@/utils/swHelper'; // ✅ 加這行

const emit = defineEmits(['start-loading', 'stop-loading', 'notify']);
const key = ref(''); 
const password = ref('');
const projectName = ref('');            
const projectOptions = ref([]);         
const error = ref('');
const loading = ref(false);
const router = useRouter();
const userStore = useUserStore();
const submit = async () => {
  error.value = ''; 

  if (!key.value || !password.value) {
    error.value = '手機號碼和密碼皆須輸入';
    return;
  }

  loading.value = true;
  emit('start-loading');

  try {
   
    const result = await loginUser(key.value, password.value, projectName.value);
  

    console.log("Login API Result:", result); 

   
    if (result && result.status === 'success' && result.user) {
      console.log("User data received for store:", result.user); 
      
      userStore.setUser(result.user);
      emit('notify', '登入成功'); 
      
      await checkUpdate(); // ✅ 登入成功後先檢查更新

      router.push('/home'); 

    } else if (result && result.status === 'wrong_password') {
      error.value = result.message || '密碼錯誤，請重新輸入';
    } else if (result && result.status === 'not_found') {
 
      error.value = result.message || '手機號碼不存在或錯誤';

    } else {

      error.value = (result && result.message) || '登入失敗，請稍後再試';
    }

  } catch (err) {

    console.error("登入過程中發生錯誤:", err);
    error.value = '無法連接伺服器或發生錯誤，請檢查網路連線';
  } finally {

    loading.value = false;
    emit('stop-loading');
  }
};

// === 忘記密碼相關 ===
const forgotDialog = ref(false);
const forgotKey = ref('');
const forgotError = ref('');
const forgotSuccess = ref('');
const forgotLoading = ref(false);

const submitForgotPassword = async () => {
  forgotError.value = '';
  forgotSuccess.value = '';

  if (!forgotKey.value) {
    forgotError.value = '請輸入手機號碼';
    return;
  }

  forgotLoading.value = true;

  try {
    const result = await forgotPasswordUser(forgotKey.value);
    console.log('忘記密碼 API 回傳:', result);

    if (result.status === 'success') {
      forgotSuccess.value = result.message || '密碼已寄到您的Email，請查收';
      forgotKey.value = '';

      // ✨ 自動3秒後關閉Dialog
      setTimeout(() => {
        forgotDialog.value = false;
        forgotSuccess.value = '';
      }, 3000);

    } else {
      forgotError.value = result.message || '無法找回密碼，請聯絡管理員';
    }
  } catch (err) {
    console.error('忘記密碼錯誤:', err);
    forgotError.value = '伺服器錯誤，請稍後再試';
  } finally {
    forgotLoading.value = false;
  }
};

</script>

<style scoped>
.fill-height {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
}
.v-card {
  width: 100%;
}
.mb-2 {
  margin-bottom: 8px; /* 微調間距 */
}
</style>