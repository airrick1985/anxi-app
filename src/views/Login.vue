<template>
  <v-container 
    class="login-container fill-height" 
    fluid 
    :style="containerStyle"
  >
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="glass-card">
          <v-card-title class="text-center card-title">
            登入
          </v-card-title>

          <v-card-text>
            <v-form @submit.prevent="submit">

              <v-text-field v-model="key" label="手機號碼" required placeholder="請輸入註冊的手機號碼" type="tel"
                :rules="[v => !!v || '手機號碼為必填欄位']" class="mb-4" variant="solo" density="comfortable"
                hide-details="auto" />

              <v-text-field v-model="password" label="密碼" type="password" required placeholder="請輸入密碼"
                :rules="[v => !!v || '密碼為必填欄位']" variant="solo" density="comfortable" hide-details="auto" />

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

    <v-dialog v-model="forgotDialog" max-width="400px" persistent>
      <v-card>
        <v-card-title>忘記密碼</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="submitForgotPassword">
            <v-text-field v-model="forgotKey" label="手機號碼" placeholder="請輸入註冊手機號碼" type="tel"
              :rules="[v => !!v || '手機號碼必填']" hide-details="auto" />
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
// ✅ 核心修改：Script 變得非常乾淨
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/user';
import { loginUser, forgotPasswordUser } from '../api';
import { checkUpdate } from '@/utils/swHelper';

const emit = defineEmits(['start-loading', 'stop-loading', 'notify']);
const key = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const router = useRouter();
const userStore = useUserStore();

// 1. 直接將圖片路徑寫在這裡
// 這個路徑是相對於 public 資料夾的根目錄
// 如果您的檔名是 login-bg.jpg，就寫 '/login-bg.jpg'
const backgroundImageUrl = ref('/login-bg.jpg'); 

// 2. containerStyle 的邏輯完全不變，它會將上面的路徑設定到 CSS 變數中
const containerStyle = computed(() => ({
  '--bg-image-url': `url(${backgroundImageUrl.value})`
}));

// 3. 原本的 fetchRandomBackground 和 onMounted 已被移除

const submit = async () => {
  error.value = '';
  if (!key.value || !password.value) {
    error.value = '手機號碼和密碼皆須輸入';
    return;
  }
  loading.value = true;
  emit('start-loading');
  try {
    const result = await loginUser(key.value, password.value);
    if (result && result.status === 'success' && result.user) {
      userStore.setUser(result.user);
      emit('notify', '登入成功');
      await checkUpdate();
      router.push('/home');
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
    if (result.status === 'success') {
      forgotSuccess.value = result.message || '密碼已寄到您的Email，請查收';
      forgotKey.value = '';
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
.login-container {
  /* ✅ 核心修改：CSS var() 的第二個參數是備用圖片 */
  /* 當 JS 還沒載入完成時，會先顯示這個備用圖 */
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)),
    var(--bg-image-url, url('/background.png')); /* 這裡的 background.png 是舊的備用圖 */
  
  background-size: cover;
  background-position: center center;
  background-attachment: fixed;
  transition: background-image 1s ease-in-out;
}

/* --- 其他所有 style 內容維持原樣即可 --- */

.glass-card {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(7px);
  -webkit-backdrop-filter: blur(7px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  padding: 24px !important;
}

.card-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1a237e;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.7);
  padding-bottom: 20px;
}

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

.forgot-password-btn {
  color: #3f51b5;
  font-weight: 500;
  text-transform: none;
}

.v-text-field {
  margin-bottom: 16px;
}

:deep(.v-text-field .v-field) {
  background-color: rgba(255, 255, 255, 0.3) !important;
  border: 1px solid rgba(255, 255, 255, 0.4) !important;
  box-shadow: none !important;
  border-radius: 12px !important;
  transition: background-color 0.3s ease, border-color 0.3s ease !important;
}

:deep(.v-text-field .v-field--focused) {
  background-color: rgba(255, 255, 255, 0.6) !important;
  border-color: #6a8ab0 !important;
}

:deep(.v-text-field:not(.v-field--focused) .v-field--dirty) {
  background-color: rgba(255, 255, 255, 0.45) !important;
}

:deep(.v-text-field .v-field__overlay) {
  background-color: transparent !important;
}

:deep(.v-text-field .v-label) {
  color: #1a237e !important;
  opacity: 1 !important;
  font-weight: 500;
}

:deep(.v-text-field .v-label.v-field-label--floating) {
  color: #3f51b5 !important;
}

:deep(.v-text-field input) {
  color: #000000 !important;
  font-weight: 500;
}
</style>