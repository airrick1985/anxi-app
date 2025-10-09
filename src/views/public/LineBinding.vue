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
                <v-btn
                  :loading="isVerifying"
                  :disabled="isVerifying"
                  color="primary"
                  block
                  size="large"
                  class="mt-4"
                  type="submit"
                >
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
                <v-col>
                  <v-btn @click="resetProcess" block size="large" variant="outlined">這不是我</v-btn>
                </v-col>
                <v-col>
                  <v-btn
                    @click="confirmAndBind"
                    :loading="isBinding"
                    :disabled="isBinding"
                    color="success"
                    block
                    size="large"
                    variant="elevated"
                  >
                    是的，確認綁定
                  </v-btn>
                </v-col>
              </v-row>
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
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import liff from '@line/liff';
// ✓ 假設您的 API 函式都放在 @/api 中
import { verifyUserByPhone, bindLineIdToUser } from '@/api'; 

// --- Component State ---
const isLoading = ref(true);
const loadingText = ref('正在初始化...');
const isVerifying = ref(false);
const isBinding = ref(false);
const pageStep = ref(1); // 1: 輸入手機, 2: 確認姓名, 3: 成功
const errorMessage = ref('');

const phoneForm = ref(null);
const phoneNumber = ref('');
const foundUserName = ref('');
const lineUserId = ref('');

// --- LIFF Initialization ---
onMounted(async () => {
  try {
    loadingText.value = '正在與 LINE 連接...';
    // ✓ 請將 'YOUR_LIFF_ID' 替換為您在第一步取得的 LIFF ID
    await liff.init({ liffId: '2008257338-vZNMxJr0' });

    if (!liff.isLoggedIn()) {
      loadingText.value = '需要您的授權，將您導向登入頁面...';
      liff.login(); // 如果使用者沒登入，導向 LINE 的登入/授權頁面
      return;
    }

    loadingText.value = '正在獲取您的 LINE 帳號資訊...';
    const profile = await liff.getProfile();
    lineUserId.value = profile.userId;

    // 一切就緒
    isLoading.value = false;

  } catch (error) {
    console.error('LIFF 初始化失敗:', error);
    errorMessage.value = `與 LINE 的連接初始化失敗：${error.message}`;
    isLoading.value = false;
  }
});

// --- Methods ---
const verifyPhoneNumber = async () => {
  const { valid } = await phoneForm.value.validate();
  if (!valid) return;

  isVerifying.value = true;
  errorMessage.value = '';
  try {
    const result = await verifyUserByPhone({ phone: phoneNumber.value });
    if (result.status === 'success') {
      foundUserName.value = result.name;
      pageStep.value = 2; // 進入確認步驟
    } else {
      throw new Error(result.message || '發生未知錯誤');
    }
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isVerifying.value = false;
  }
};

const confirmAndBind = async () => {
  isBinding.value = true;
  errorMessage.value = '';
  try {
    const result = await bindLineIdToUser({
      phone: phoneNumber.value,
      lineId: lineUserId.value,
    });

    if (result.status === 'success') {
      pageStep.value = 3; // 顯示成功畫面
    } else {
      throw new Error(result.message || '綁定時發生未知錯誤');
    }
  } catch (error) {
    errorMessage.value = error.message;
    // 如果出錯，退回確認步驟，讓使用者可以重試
    pageStep.value = 2; 
  } finally {
    isBinding.value = false;
  }
};

const resetProcess = () => {
  pageStep.value = 1;
  phoneNumber.value = '';
  foundUserName.value = '';
  errorMessage.value = '';
};

</script>