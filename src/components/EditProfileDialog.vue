<template>
  <!-- **** 修改這裡：將 v-model 從 prop 'dialog' 改為本地 ref 'internalDialog' **** -->
  <v-dialog v-model="internalDialog" max-width="500px" persistent> 
    <v-card>
      <v-card-title>修改個人資料</v-card-title>
      <v-card-text>
        <!-- ... 表單內容保持不變 ... -->
         <v-text-field 
          :model-value="userStore.user?.key" 
          label="手機號碼 (識別碼)" 
          readonly 
          disabled 
          class="mb-2"
        />
        <v-form @submit.prevent="submit" ref="profileForm">
          <v-text-field 
            v-model="newName" 
            label="姓名" 
            required 
            :rules="[v => !!v || '姓名為必填欄位']"
          />
          <v-text-field 
            v-model="newEmail" 
            label="Email" 
            required 
            type="email" 
            :rules="[v => !!v || 'Email 為必填欄位', v => /.+@.+\..+/.test(v) || 'Email 格式不正確']" 
          /> 
          <v-text-field 
            v-model="oldPassword" 
            label="原密碼 (必填以驗證身份)" 
            type="password" 
            required 
            :rules="[v => !!v || '必須輸入原密碼以進行修改']"
          />
          <v-text-field 
            v-model="newPassword" 
            label="新密碼 (若不修改請留空)" 
            type="password" 
          />
          <v-alert v-if="errorMsg" type="error" dense class="mt-3">{{ errorMsg }}</v-alert>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text @click="closeDialog">取消</v-btn>
        <v-btn color="primary" :loading="saving" @click="submit">儲存</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { useUserStore } from '../store/user'; // 假設 store 路徑
import { updateUserProfile } from '../api'; // 假設 api 呼叫函數

const props = defineProps({
  dialog: Boolean // 控制對話框顯示/隱藏的 prop
});
const emit = defineEmits([
  'update:dialog', // 更新 dialog 狀態的事件
  'start-loading', // 開始全局 loading 的事件 (如果有的話)
  'stop-loading',  // 停止全局 loading 的事件 (如果有的話)
  'notify'         // 顯示通知/提示的事件
]);

// --- 本地狀態 ---
const internalDialog = ref(false); // 使用 internalDialog 控制內部顯示
const newName = ref('');
const newEmail = ref(''); // ++ 新增 Email 的 ref ++
const oldPassword = ref('');
const newPassword = ref('');
const errorMsg = ref('');
const saving = ref(false);
const profileForm = ref(null); // 用於訪問 v-form 的 ref

// --- 從 Pinia Store 獲取用戶信息 ---
const userStore = useUserStore();

// --- 同步 Prop 到本地狀態，並在打開時初始化表單 ---
watch(() => props.dialog, (newVal) => {
  internalDialog.value = newVal;
  if (newVal) {
    // 當對話框打開時，從 userStore 初始化表單欄位
    // 使用 nextTick 確保 DOM 更新後再訪問 userStore (如果 userStore 是異步載入)
    nextTick(() => {
      newName.value = userStore.user?.name || '';
      newEmail.value = userStore.user?.email || ''; // ++ 初始化 Email ++
      oldPassword.value = ''; // 清空密碼欄位
      newPassword.value = '';
      errorMsg.value = ''; // 清空錯誤訊息
    });
  }
}, { immediate: true }); // immediate: true 確保初始加載時也能執行一次

// --- 監聽本地狀態變化，通知父組件關閉 ---
// watch(internalDialog, (newVal) => {
//   if (!newVal) { // 如果 internalDialog 變為 false (例如點擊取消)
//     emit('update:dialog', false); 
//   }
// });
// 改用 closeDialog 函數更明確

// --- 關閉對話框的函數 ---
const closeDialog = () => {
  internalDialog.value = false; // 關閉內部狀態
  emit('update:dialog', false); // 通知父組件
}

// --- 提交表單的函數 ---
const submit = async () => {
  // 1. 清除舊錯誤
  errorMsg.value = '';

  // 2. 執行 Vuetify 表單驗證
  const { valid } = await profileForm.value?.validate(); // 使用 ?. 避免 form 不存在時報錯
  if (!valid) {
    errorMsg.value = '請檢查輸入欄位是否有誤';
    return; // 驗證失敗，停止提交
  }

  // 3. 檢查用戶 Key 是否存在
  const userKey = userStore.user?.key;
  if (!userKey) {
    errorMsg.value = '無法獲取用戶識別碼，請重新登入';
    return;
  }

  // 4. 進入 Loading 狀態
  saving.value = true;
  emit('start-loading'); // 通知父組件開始 Loading (如果需要全局 Loading)

  try {
    // 5. 準備要發送到 API 的資料
   const payload = {
  key: userKey,
  oldPassword: oldPassword.value, 
  name: newName.value,            
  email: newEmail.value,          
  newPassword: newPassword.value  
};


    // 6. 呼叫 API 函數
    const result = await updateUserProfile(payload);

    // 7. 處理 API 回應
    if (result.status === 'success') {
      // 成功：更新本地 Store
      userStore.setUser({ 
        key: userKey,         // <--- **更新 Store 時也包含 Key**
        name: newName.value,  // <--- **更新 Name**
        email: newEmail.value // <--- **更新 Email**
        // 注意：如果後端沒更新密碼，這裡不需要傳密碼
        // 如果 userStore.user 還有其他欄位，可能需要這樣寫:
        // ...userStore.user, name: newName.value, email: newEmail.value 
      }); 
      
      emit('notify', '個人資料修改成功'); // 通知成功
      closeDialog(); // 關閉對話框

    } else {
      // 失敗：顯示後端回傳的錯誤訊息
      errorMsg.value = result.message || '修改失敗，請稍後再試';
    }

  } catch (err) {
    // 捕捉網路錯誤或其他意外錯誤
    console.error("更新個人資料時發生錯誤:", err); // 在 console 紀錄詳細錯誤
    errorMsg.value = '發生網路或未預期的錯誤，請稍後再試';
  } finally {
    // 8. 無論成功或失敗，都結束 Loading 狀態
    saving.value = false;
    emit('stop-loading'); // 通知父組件停止 Loading
  }
};
</script>

<style scoped>
/* 可選：增加一些間距 */
.v-text-field {
  margin-bottom: 8px;
}
.mb-2 {
  margin-bottom: 16px !important; /* 增加識別碼和表單間的距離 */
}
</style>