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

              <v-text-field v-model="key" label="手機號碼" required placeholder="請輸入註冊的手機號碼" type="text"
                :rules="[v => !!v || '手機號碼為必填欄位']" class="mb-4" variant="solo" density="comfortable"
                hide-details="auto" />

              <v-text-field v-model="password" label="密碼" type="password" required placeholder="請輸入密碼"
                :rules="[v => !!v || '密碼為必填欄位']" variant="solo" density="comfortable" hide-details="auto" />

              <v-alert v-if="error" type="error" class="mt-4" dense>{{ error }}</v-alert>

              <v-btn :loading="loading" type="submit" block class="mt-6 login-btn">登入</v-btn>

            </v-form>

           <div class="text-center mt-4 d-flex flex-column align-center">
              <v-btn variant="text" class="forgot-password-btn" @click="forgotDialog = true">
                忘記密碼？
              </v-btn>
              <v-btn 
                variant="outlined"
                class="add-shortcut-btn mt-2" 
                @click="shortcutDialog = true"
              >
                建立APP捷徑
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
          <v-text-field
  v-model="forgotKey"
  label="手機號碼"
  placeholder="請輸入註冊手機號碼"
  type="text"
  hide-details="auto"
  variant="solo"
  density="comfortable"
  class="mb-2"
/>
          </v-form>
          
          <v-alert v-if="forgotError" type="error" dense class="mt-3">{{ forgotError }}</v-alert>
          <v-alert v-if="forgotSuccess" type="success" dense class="mt-3">{{ forgotSuccess }}</v-alert>
        </v-card-text>
        <v-card-actions class="border-0">
          <v-spacer />
          <v-btn text @click="forgotDialog = false">取消</v-btn>
          <v-btn color="primary" :loading="forgotLoading" @click="submitForgotPassword">送出</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

             <v-dialog v-model="shortcutDialog" max-width="500px">
      <v-card class="pa-4 text-center">
        <v-card-title class="justify-center text-h5 font-weight-bold">
          安裝應用程式
        </v-card-title>
        <v-card-text>
          <v-row justify="center">
            <v-col cols="12" class="d-flex flex-column align-center">
              <img src="/icons/icon-192x192.png" alt="ANXI App Icon" class="app-icon my-4">
              <span class="app-name font-weight-bold">ANXI</span>
            </v-col>

            <v-col cols="12" class="mt-4">
              <div v-if="deviceType === 'iOS'">
                <p class="instruction-text">請點擊螢幕底部的 <v-icon size="small">mdi-export-variant</v-icon> 圖示</p>
                <p class="instruction-text">然後選擇「加入主畫面」</p>
                <p class="instruction-text">請設定Safari為預設瀏覽器才可設定功能捷徑</p>
              </div>
              <div v-else-if="deviceType === 'Android'">
                <p class="instruction-text">請點擊瀏覽器右上角的 <v-icon size="small">mdi-dots-vertical</v-icon> 選單</p>
                <p class="instruction-text">然後選擇「安裝應用程式」或「新增至主畫面」</p>
              </div>
              <div v-else>
                <p class="instruction-text">請點擊網址列右側的 <v-icon size="small">mdi-monitor-arrow-down</v-icon> 圖示</p>
                <p class="instruction-text">或透過瀏覽器選單找到並點擊「安裝 ANXI」</p>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" text @click="shortcutDialog = false">關閉</v-btn>
          <v-spacer />
        </v-card-actions>
      </v-card>
    </v-dialog>


         <v-dialog v-model="shortcutDialog" max-width="500px">
      <v-card class="pa-4 text-center">
        <v-card-title class="justify-center text-h5 font-weight-bold">
          安裝應用程式
        </v-card-title>
        <v-card-text>
          <v-row justify="center">
            <v-col cols="12" class="d-flex flex-column align-center">
              <img src="/icons/icon-192x192.png" alt="ANXI App Icon" class="app-icon my-4">
              <span class="app-name font-weight-bold">ANXI</span>
            </v-col>

            <v-col cols="12" class="mt-4">
              <div v-if="deviceType === 'iOS'">
                <p class="instruction-text">請點擊螢幕底部的 <v-icon size="small">mdi-export-variant</v-icon> 圖示</p>
                <p class="instruction-text">然後選擇「加入主畫面」</p>
                <p class="instruction-text">請設定Safari為預設瀏覽器才可設定功能捷徑</p>
              </div>
              <div v-else-if="deviceType === 'Android'">
                <p class="instruction-text">請點擊瀏覽器右上角的 <v-icon size="small">mdi-dots-vertical</v-icon> 選單</p>
                <p class="instruction-text">然後選擇「安裝應用程式」或「新增至主畫面」</p>
              </div>
              <div v-else>
                <p class="instruction-text">請點擊網址列右側的 <v-icon size="small">mdi-monitor-arrow-down</v-icon> 圖示</p>
                <p class="instruction-text">或透過瀏覽器選單找到並點擊「安裝 ANXI」</p>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" text @click="shortcutDialog = false">關閉</v-btn>
          <v-spacer />
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'; 
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/user';
import { loginUser, forgotPasswordUser } from '../api';

import myBackgroundImage from '@/assets/login-bg.webp';

import { v4 as uuidv4 } from 'uuid';

const emit = defineEmits(['start-loading', 'stop-loading', 'notify']);
const key = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const router = useRouter();
const userStore = useUserStore();

const backgroundImageUrl = ref(myBackgroundImage);

const containerStyle = computed(() => ({
  '--bg-image-url': `url(${backgroundImageUrl.value})`
}));


const submit = async () => {
  error.value = '';
  if (!key.value || !password.value) {
    error.value = '手機號碼和密碼皆須輸入';
    return;
  }
  loading.value = true;
  emit('start-loading');
  try {
    // 步驟 A: 在點擊登入時，產生一個新的、唯一的 sessionId
    const sessionId = uuidv4();

    // 步驟 B: 將 sessionId 一同傳遞給後端
    const result = await loginUser(key.value, password.value, sessionId);

    if (result && result.status === 'success' && result.user) {
      // 步驟 C: 登入成功後，將使用者資料和 sessionId 一同存入 store
      userStore.setUser(result.user, sessionId);
      emit('notify', '登入成功');
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

// ---- 建立 APP 捷徑功能 ----
const shortcutDialog = ref(false);

const getDeviceType = () => {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) {
    return "Android";
  }
  // 偵測 iPhone, iPad, iPod，並且不是 Windows Phone
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
    // 檢查是否已在 PWA 獨立模式下運行
    if (('standalone' in window.navigator) && (window.navigator.standalone)) {
      return "Desktop"; // 如果已是 PWA，則顯示桌面版提示
    }
    return "iOS";
  }
  return "Desktop"; // 其他皆歸類為桌面版
};

const deviceType = computed(getDeviceType);
// ---- ---------------- ----

</script>

<style scoped>
.login-container {
  /* ✅ CSS 的部分完全不需要修改 */
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0)),
    var(--bg-image-url); 
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
  color: #000000;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.7);
  padding-bottom: 20px;
}

.login-btn {
  height: 50px !important;
  font-size: 1.1rem;
  font-weight: bold;
  border-radius: 10px;
  background-image: linear-gradient(135deg, #000000, #000000);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  color: white;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}

.forgot-password-btn,
.add-shortcut-btn {
  color: #000000;
  font-weight: 500;
  text-transform: none;
}

.v-text-field {
  margin-bottom: 16px;
}

:deep(.v-text-field .v-field) {
  background-color: rgba(255, 255, 255, 0.3) !important;
  border: 1px solid rgba(0, 0, 0, 0.4) !important;
  box-shadow: none !important;
  border-radius: 12px !important;
  transition: background-color 0.3s ease, border-color 0.3s ease !important;
}

:deep(.v-text-field .v-field--focused) {
  background-color: rgba(255, 255, 255, 0.6) !important;
  border-color: #6a8ab0 !important;
}

:deep(.v-text-field:not(.v-field--focused) .v-field--dirty) {
  background-color: rgba(255, 255, 255, 0) !important;
}

:deep(.v-text-field .v-field__overlay) {
  background-color: transparent !important;
}

:deep(.v-text-field .v-label) {
  color: #6c6c6c !important;
  opacity: 1 !important;
  font-weight: 500;
}

:deep(.v-text-field .v-label.v-field-label--floating) {
  color: #6c6c6c !important;
}

:deep(.v-text-field input) {
  color: #000000 !important;
  font-weight: 500;
}

/* 新增 APP 捷徑 Dialog 樣式 ---- */
.app-icon {
  width: 96px;
  height: 96px;
  border-radius: 22.5%; /* iOS 風格的圓角 */
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.app-name {
  font-size: 1.25rem;
  color: #333;
}

.instruction-text {
  font-size: 0.8rem;
  line-height: 1.6;
  color: #555;
  margin-bottom: 8px;
}

.instruction-text .v-icon {
  vertical-align: middle;
  margin: 0 4px;
}
/* ---- -------------------- ---- */
</style>