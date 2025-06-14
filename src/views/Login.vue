<!-- /src/views/Login.vue -->
<template>
  <v-container class="login-container fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <!-- ✅ 給 v-card 添加 glass-card class -->
        <v-card class="glass-card"> <!-- 移除了 pa-4，讓 padding 由 style 控制 -->
          <v-card-title class="text-center card-title">
            登入
          </v-card-title>

          <v-card-text>
            <v-form @submit.prevent="submit">
              
              <v-text-field
                v-model="key"
                label="手機號碼"
                required
                placeholder="請輸入註冊的手機號碼"
                type="tel"
                :rules="[v => !!v || '手機號碼為必填欄位']"
                class="mb-4" 
                variant="solo"
                
                density="comfortable"
                hide-details="auto"
              />

              <v-text-field
                v-model="password"
                label="密碼"
                type="password"
                required
                placeholder="請輸入密碼"
                :rules="[v => !!v || '密碼為必填欄位']"
                variant="solo"
               
                density="comfortable"
                hide-details="auto"
              />

              <v-alert v-if="error" type="error" class="mt-4" dense>{{ error }}</v-alert>

              <v-btn :loading="loading" type="submit" block class="mt-6 login-btn">登入</v-btn>
            
            </v-form>
            
            <div class="text-center mt-4">
              <v-btn variant="text" class="forgot-password-btn" @click="forgotDialog = true">
                忘記密碼？
              </v-btn>
            </div>

          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 忘記密碼 Dialog -->
    <v-dialog v-model="forgotDialog" max-width="400px" persistent> <!-- 建議加上 persistent -->
      <v-card>
        <v-card-title>忘記密碼</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="submitForgotPassword">
            <v-text-field
              v-model="forgotKey"
              label="手機號碼"
              placeholder="請輸入註冊手機號碼"
              type="tel"
              :rules="[v => !!v || '手機號碼必填']"
              hide-details="auto"
            />
          </v-form>
          <v-alert v-if="forgotError" type="error" dense class="mt-3">{{ forgotError }}</v-alert>
          <v-alert v-if="forgotSuccess" type="success" dense class="mt-3">{{ forgotSuccess }}</v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="forgotDialog = false">取消</v-btn>
          <v-btn color="primary" :loading="forgotLoading" @click="submitForgotPassword">送出</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/user';
import { loginUser } from '../api'; 
import { forgotPasswordUser } from '../api'; 
import { checkUpdate } from '@/utils/swHelper'; // ✅ 加這行

const emit = defineEmits(['start-loading', 'stop-loading', 'notify']);
const key = ref(''); 
const password = ref('');
const error = ref('');
const loading = ref(false);
const router = useRouter();
const userStore = useUserStore();
const submit = async () => {
  error.value = ''; 

  if (!key.value || !password.value) { // Removed projectName validation
    error.value = '手機號碼和密碼皆須輸入';
    return;
  }

  loading.value = true;
  emit('start-loading');

  try {
   
    const result = await loginUser(key.value, password.value); // Removed projectName.value
  

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
/* ✅ 1. 設置背景圖片 */
.login-container {
  background-image: url('/background.png');
  background-size: cover;
  background-position: center center;
  background-attachment: fixed;
}

/* ✅ 2. 應用液態玻璃風格到卡片 */
.glass-card {
  background: rgba(255, 255, 255, 0.4); /* 更透明一些，讓背景更明顯 */
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px); /* 兼容 Safari */
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  padding: 24px !important;
}

/* ✅ 3. 調整內部元素樣式 */

/* 卡片標題 */
.card-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1a237e;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.7);
  padding-bottom: 20px;
}

/* 登入按鈕 */
.login-btn {
  height: 50px !important;
  font-size: 1.1rem;
  font-weight: bold;
  border-radius: 10px;
  background-image: linear-gradient(135deg, #4a6a8a, #2a4a7e);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  color: white;
}
.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}

/* 忘記密碼按鈕 */
.forgot-password-btn {
  color: #3f51b5;
  font-weight: 500;
  text-transform: none; /* 移除 Vuetify 的預設大寫 */
}

.v-text-field {
  margin-bottom: 16px;
}

/* 基礎樣式：應用於 v-field，這是輸入框的核心可見部分 */
:deep(.v-text-field .v-field) {
  background-color: rgba(255, 255, 255, 0.3) !important; /* 預設半透明背景 */
  border: 1px solid rgba(255, 255, 255, 0.4) !important; /* 預設半透明邊框 */
  box-shadow: none !important; /* 移除 Vuetify 的預設陰影 */
  border-radius: 12px !important; /* 我們的圓角 */
  transition: background-color 0.3s ease, border-color 0.3s ease !important; /* 平滑過渡 */
}

/* 狀態一：聚焦時的樣式 */
:deep(.v-text-field .v-field--focused) {
  background-color: rgba(255, 255, 255, 0.6) !important; /* 背景更實一點 */
  border-color: #6a8ab0 !important; /* 高亮邊框 */
}

/* 狀態二：有值但未聚焦時 (Vuetify 會添加 v-field--dirty) */
:deep(.v-text-field:not(.v-field--focused) .v-field--dirty) {
  background-color: rgba(255, 255, 255, 0.45) !important; /* 一個中間狀態的背景色 */
}

/* 狀態三：有值且被聚焦時 */
:deep(.v-text-field.v-field--focused .v-field--dirty) {
  /* 樣式會繼承 .v-field--focused，所以這裡不需要額外寫，除非你想讓它更特別 */
}

/* 清理 Vuetify 可能添加的內部覆蓋層顏色 */
:deep(.v-text-field .v-field__overlay) {
  background-color: transparent !important;
}

/* 調整標籤 (Label) 和輸入文字的顏色 */
:deep(.v-text-field .v-label) {
  color: #1a237e !important;
  opacity: 1 !important;
  font-weight: 500;
}

/* 當標籤上浮時的樣式 */
:deep(.v-text-field .v-label.v-field-label--floating) {
  color: #3f51b5 !important;
}

/* 輸入的文字顏色 */
:deep(.v-text-field input) {
  color: #000000 !important;
  font-weight: 500;
}


</style>