<template>
  <v-container fluid class="fill-height" style="background-color: #F4F4F7;">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title class="text-center">綁定 LINE 帳號</v-toolbar-title>
          </v-toolbar>

          <v-card-text class="pa-6">
            <div v-if="isLoading" class="text-center">
              <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
              <p class="mt-4">{{ loadingText }}</p>
            </div>

            <div v-else-if="pageStep === 0" class="text-center">
              <v-icon size="80" color="primary" class="mb-4">mdi-account-check-outline</v-icon>
              <p class="text-h6 mb-2">綁定狀態確認</p>
              <p>您的 LINE 帳號目前已綁定至用戶：</p>
              <p class="text-h5 font-weight-bold text-primary my-4">{{ foundUserName }}</p>
              <v-btn @click="pageStep = 1" color="primary" block size="large" variant="outlined" class="mt-6">
                綁定其他手機號碼
              </v-btn>
            </div>

            <div v-else-if="pageStep === 1">
              <p class="text-subtitle-1 mb-4">請輸入您在系統中登記的手機號碼，以進行身分驗證。</p>
              <v-form ref="phoneForm" @submit.prevent="verifyPhoneNumber">
                <v-text-field
                  v-model="phoneNumber"
                  label="手機號碼"
                  prepend-inner-icon="mdi-phone"
                  variant="outlined"
                  :rules="[v => !!v || '手機號碼為必填']"
                  autofocus
                ></v-text-field>
                <v-btn :loading="isVerifying" :disabled="isVerifying" color="primary" block size="large" class="mt-4" type="submit">
                  驗證手機號碼
                </v-btn>
              </v-form>
            </div>

            <div v-else-if="pageStep === 2" class="text-center">
              <p class="text-h6 mb-2">請確認您的身分</p>
              <p>我們在系統中找到的使用者是：</p>
              <p class="text-h5 font-weight-bold text-primary my-4">{{ foundUserName }}</p>
              <p>請問這是您本人嗎？</p>
              <v-row class="mt-4">
                <v-col><v-btn @click="resetProcess" block size="large" variant="outlined">這不是我</v-btn></v-col>
                <v-col>
                  <v-btn @click="initiateBinding" :loading="isBinding" :disabled="isBinding" color="success" block size="large" variant="elevated">
                    是的，發送驗證信
                  </v-btn>
                </v-col>
              </v-row>
            </div>
            
            <div v-else-if="pageStep === 4" class="text-center">
              <v-icon size="80" color="info" class="mb-4">mdi-email-fast-outline</v-icon>
              <p class="text-h5 font-weight-bold">請至您的信箱收信</p>
              <p class="mt-2">一封驗證信已寄出，請點擊信中的連結以完成綁定。</p>
              <p class="text-caption text-grey mt-4">此驗證連結將於 15 分鐘後失效。</p>
            </div>
            <div v-else-if="pageStep === 3" class="text-center">
              <v-icon size="80" color="success" class="mb-4">mdi-check-circle-outline</v-icon>
              <p class="text-h5 font-weight-bold">綁定成功！</p>
              <p class="mt-2">您的 LINE 帳號已成功綁定至 {{ foundUserName }}。</p>
              <p class="text-caption text-grey mt-4">您可以關閉此頁面了。</p>
            </div>
            
            <v-alert v-if="errorMessage" type="error" class="mt-4" prominent border="start">
              {{ errorMessage }}
            </v-alert>

          </v-card-text>
        </v-card>

        <div class="text-caption text-grey text-center mt-6 d-flex align-center justify-center">
          <span>本服務由</span>
          <v-chip class="ml-2" href="https://airrick1985.wixsite.com/anxi" target="_blank" rel="noopener noreferrer" color="blue-grey" variant="tonal" size="small" label>
            <v-icon start size="x-small">mdi-rocket-launch-outline</v-icon>
            anxismart安熙智慧建案管理系統
          </v-chip>
          <span>提供技術支援</span>
        </div>
        
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import liff from '@line/liff';
// ✓ 匯入新的 API 函式
import { verifyUserByPhone, initiateLineBindingVerification, checkLineBindingStatus } from '@/api'; 

const isLoading = ref(true);
const loadingText = ref('正在初始化...');
const isVerifying = ref(false);
const isBinding = ref(false);
const pageStep = ref(1);
const errorMessage = ref('');

const phoneForm = ref(null);
const phoneNumber = ref('');
const foundUserName = ref('');
const lineUserId = ref('');

onMounted(async () => {
  try {
    loadingText.value = '正在與 LINE 連接...';
    await liff.init({ liffId: '2008257338-vZNMxJr0' });

    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    const profile = await liff.getProfile();
    lineUserId.value = profile.userId;

    loadingText.value = '正在檢查綁定狀態...';
    const statusResult = await checkLineBindingStatus({ lineId: lineUserId.value });

    if (statusResult.status === 'found') {
      foundUserName.value = statusResult.name;
      pageStep.value = 0;
    } else {
      pageStep.value = 1;
    }

    isLoading.value = false;

  } catch (error) {
    console.error('LIFF 初始化或狀態檢查失敗:', error);
    errorMessage.value = `初始化失敗：${error.message}`;
    isLoading.value = false;
  }
});

const verifyPhoneNumber = async () => {
  const { valid } = await phoneForm.value.validate();
  if (!valid) return;

  isVerifying.value = true;
  errorMessage.value = '';
  try {
    const result = await verifyUserByPhone({ phone: phoneNumber.value });
    if (result.status === 'success') {
      foundUserName.value = result.name;
      pageStep.value = 2;
    } else {
      throw new Error(result.message || '發生未知錯誤');
    }
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isVerifying.value = false;
  }
};

// ✓ START: 修改 - 將 confirmAndBind 改名為 initiateBinding 並更新邏輯
const initiateBinding = async () => {
  isBinding.value = true;
  errorMessage.value = '';
  try {
    // 現在呼叫發起驗證的 API
    const result = await initiateLineBindingVerification({
      phone: phoneNumber.value,
      lineId: lineUserId.value,
    });

    if (result.status === 'success') {
      // 不再直接跳到成功頁，而是跳到「請檢查信箱」的頁面
      pageStep.value = 4; 
    } else {
      throw new Error(result.message || '發送驗證信時發生未知錯誤');
    }
  } catch (error) {
    errorMessage.value = error.message;
    pageStep.value = 2; 
  } finally {
    isBinding.value = false;
  }
};
// ✓ END

const resetProcess = () => {
  pageStep.value = 1;
  phoneNumber.value = '';
  foundUserName.value = '';
  errorMessage.value = '';
};

</script>