好的，收到您提供的 `Login.vue` 檔案。

我將依據我們先前的討論，將「隨機背景圖」功能整合到您現有的登入頁面程式碼中，並提供您可以直接複製貼上的完整版本。

-----

### **前置作業：取得 API 金鑰**

在貼上程式碼之前，請先確保您已經前往 [Unsplash Developer](https://unsplash.com/developers) 網站註冊並取得一組 **Access Key**（API 金鑰）。

**⚠️ 安全性提醒：** 為了安全起見，強烈建議您將這組 Key 存放在專案根目錄的 `.env.local` 檔案中，而不是直接寫在程式碼裡。

1.  **建立檔案**：在專案根目錄（與 `package.json` 同層）建立一個名為 `.env.local` 的檔案。
2.  **填入內容**：
    ```
    VITE_UNSPLASH_ACCESS_KEY=在這裡貼上您從Unsplash獲取的AccessKey
    ```
3.  這樣設定後，在程式碼中就可以透過 `import.meta.env.VITE_UNSPLASH_ACCESS_KEY` 來安全地讀取它。

-----

### **修改 `/src/views/Login.vue`**

**請將您現有的 `/src/views/Login.vue` 完整內容替換為以下程式碼：**

```vue
<template>
  <v-container 
    class="login-container fill-height" 
    fluid 
    :style="{ backgroundImage: `url(${backgroundImageUrl})` }"
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
// ✅ 2. 引入 onMounted
import { ref, onMounted } from 'vue';
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

// ✅ 3. 新增 ref 來儲存背景圖片 URL，並給定一個預設值
const backgroundImageUrl = ref('/background.png'); // 使用您現有的圖片作為預設

// ✅ 4. 新增一個非同步函式來獲取隨機背景
async function fetchRandomBackground() {
  // 從環境變數讀取您的 API Key
  const unsplashAccessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  
  if (!unsplashAccessKey) {
    console.error('Unsplash API Key 未設定，請檢查您的 .env.local 檔案');
    return;
  }

  try {
    // 獲取一張橫向的、主題為 "architecture" 或 "wallpaper" 的隨機圖片
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=architecture,wallpaper&orientation=landscape&client_id=${unsplashAccessKey}`
    );
    
    if (!response.ok) throw new Error('無法從 Unsplash 獲取圖片');
    
    const data = await response.json();
    
    // 將獲取到的圖片 URL 賦值給 ref，觸發模板更新
    backgroundImageUrl.value = data.urls.regular;

  } catch (err) {
    console.error('獲取背景圖片失敗:', err);
    // 如果失敗，則會繼續使用預設的背景圖
  }
}

// ✅ 5. 在元件掛載時，呼叫此函式
onMounted(() => {
  fetchRandomBackground();
});


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
    console.log("Login API Result:", result);
    
    if (result && result.status === 'success' && result.user) {
      console.log("User data received for store:", result.user);
      userStore.setUser(result.user);
      emit('notify', '登入成功');
      await checkUpdate();
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
  /* 預設背景圖仍然保留，作為 API 失敗或載入時的備案 */
  background-image: url('/background.png'); 
  background-size: cover;
  background-position: center center;
  background-attachment: fixed;
  /* ✅ 6. 加上 transition 讓背景圖切換時有淡入淡出效果 */
  transition: background-image 1s ease-in-out;
}

.glass-card {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(7px);
  -webkit-backdrop-filter: blur(20px);
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
