<template>
  <v-container>
    <v-card class="mx-auto" max-width="600">
      <v-toolbar color="black">
  <v-toolbar-title>
    {{ mobile ? '預約同步 (Sheet)' : '預約同步至 Google Sheet' }}
  </v-toolbar-title>
  
  <v-spacer></v-spacer>
  
  <v-btn icon @click="openVerification">
    <v-icon>mdi-cog</v-icon>
  </v-btn>
</v-toolbar>

      <v-card-text class="pa-6">
        <div class="text-center mb-6">
          <h3 class="text-h5 mb-2">{{ projectName }}</h3>
          <p class="text-grey">請選擇要同步的週次範圍</p>
        </div>

        <VueDatePicker
            v-model="dateRange"
            range
            :enable-time-picker="false"
            format="yyyy/MM/dd"
            auto-apply
            locale="zh-TW"
            :min-date="new Date('2023-01-01')"
            placeholder="點擊選擇日期區間 (週一~週日)"
            :day-class="getDayClass"
            :teleport="true"  ></VueDatePicker>
        
        <v-alert v-if="dateError" type="error" variant="tonal" class="mt-4" density="compact">
            {{ dateError }}
        </v-alert>

        <v-btn
            block
            color="success"
            size="large"
            class="mt-6"
            :disabled="!isValidRange"
            :loading="isSyncing"
            @click="confirmSync"
        >
            同步到 Google Sheet
        </v-btn>
      </v-card-text>
    </v-card>

    <v-dialog v-model="verificationDialog" max-width="400">
      <v-card>
        <v-card-title class="bg-grey-lighten-3">管理員身分驗證</v-card-title>
        <v-card-text class="pt-4">
          <p class="mb-4 text-body-2 text-grey-darken-1">為確保安全，進入設定前請重新輸入您的帳號密碼。</p>
          <v-form @submit.prevent="handleVerification">
            <v-text-field
              v-model="verifyForm.key"
              label="帳號 (手機號碼)"
              prepend-inner-icon="mdi-account"
              variant="outlined"
              density="compact"
              class="mb-2"
            ></v-text-field>
            <v-text-field
              v-model="verifyForm.password"
              label="密碼"
              prepend-inner-icon="mdi-lock"
              type="password"
              variant="outlined"
              density="compact"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="verificationDialog = false">取消</v-btn>
          <v-btn 
            color="indigo" 
            variant="flat" 
            :loading="isVerifying" 
            @click="handleVerification"
            :disabled="!verifyForm.key || !verifyForm.password"
          >
            驗證並進入
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="settingsDialog" max-width="500">
        <v-card>
            <v-card-title>Google Sheet 設定</v-card-title>
            <v-card-text>
                <v-text-field v-model="settingsForm.id" label="Sheet ID" variant="outlined" class="mt-2"></v-text-field>
                <v-text-field v-model="settingsForm.tab" label="工作表名稱 (Tab Name)" variant="outlined"></v-text-field>
                <div class="text-caption text-grey">
                    請確保已將 Sheet 分享給 Service Account Email。<br>
                    範例: firebase-adminsdk-xxxx@....com
                </div>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="settingsDialog = false">取消</v-btn>
                <v-btn color="primary" @click="saveSettings">儲存</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="confirmDialog" max-width="450">
        <v-card>
            <v-card-title class="text-h6 bg-grey-lighten-4">
                <v-icon start color="primary">mdi-help-circle-outline</v-icon>
                確認同步?
            </v-card-title>
            
            <v-card-text class="text-center pt-6 pb-4">
                <div class="text-h5 font-weight-bold text-indigo mb-4">
                    {{ projectName }}
                </div>

                <div class="text-body-1 mb-4" style="line-height: 1.6;">
                    <span class="font-weight-medium">{{ dateText }}</span> 的預約資料<br>
                    將同步到 Google 試算表
                    <span class="font-weight-bold text-black">【{{ settingsForm.tab }}】</span> 頁面。
                </div>

                <div class="mb-2">
                    <span class="text-red font-weight-bold text-h6">
                        <v-icon color="red" class="mb-1">mdi-alert</v-icon>
                        注意：舊資料將被覆蓋！
                    </span>
                </div>

                <div class="text-caption text-grey-darken-1">
                    (手動填寫的備註將會被保留)
                </div>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions class="pa-4">
                <v-spacer></v-spacer>
                <v-btn 
                    variant="outlined" 
                    color="grey-darken-1" 
                    @click="confirmDialog = false"
                >
                    取消
                </v-btn>
                <v-btn 
                    color="success" 
                    variant="flat" 
                    class="px-6"
                    @click="executeSync" 
                    :loading="isSyncing"
                >
                    確認同步
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { useDisplay } from 'vuetify';
import { ref, computed, onMounted, reactive } from 'vue'; // 加入 reactive
import { useRoute } from 'vue-router';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { useUserStore } from '@/store/user';
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { updateProjectSheetSettings, syncToGoogleSheet, loginUser } from '@/api'; // ✅ 引入 loginUser
import { useToast } from 'vue-toastification';

// 取得手機狀態
const { mobile } = useDisplay();

const route = useRoute();
const userStore = useUserStore();
const toast = useToast();
const projectId = route.params.projectId;

const projectName = ref('');
const dateRange = ref(null);
const dateError = ref('');
const isSyncing = ref(false);

// ✅ 新增驗證相關狀態
const verificationDialog = ref(false);
const isVerifying = ref(false);
const verifyForm = reactive({ key: '', password: '' });

const settingsDialog = ref(false);
const confirmDialog = ref(false);
const settingsForm = ref({ id: '', tab: '' });

const isAdmin = computed(() => 
    userStore.currentUserRoles.includes('超級管理員') || 
    userStore.currentUserRoles.includes('系統管理員')
);

const isValidRange = computed(() => {
    if (!dateRange.value || dateRange.value.length !== 2) return false;
    const start = new Date(dateRange.value[0]);
    const end = new Date(dateRange.value[1]);
    
    if (start.getDay() !== 1) {
        dateError.value = "起始日必須是星期一";
        return false;
    }
    if (end.getDay() !== 0) {
        dateError.value = "迄日必須是星期日";
        return false;
    }
    dateError.value = '';
    return true;
});

const dateText = computed(() => {
    if (!dateRange.value) return '';
    const s = dateRange.value[0].toLocaleDateString();
    const e = dateRange.value[1].toLocaleDateString();
    return `${s} ~ ${e}`;
});

const getDayClass = (date) => {
    const day = date.getDay();
    if (day === 6) return 'text-blue';
    if (day === 0) return 'text-red';
    return '';
};

onMounted(async () => {
    // 預填當前使用者的帳號 (方便操作)
    if (userStore.user && userStore.user.key) {
        verifyForm.key = userStore.user.key;
    }

    const docRef = doc(db, 'projects', projectId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        const data = snap.data();
        projectName.value = data.name;
        settingsForm.value.id = data.googleSheetId || '';
        settingsForm.value.tab = data.googleSheetTabName || '';
    }
});

// ✅ 修改：打開驗證視窗，而非直接打開設定
const openVerification = () => {
    verifyForm.password = ''; // 清空密碼
    verificationDialog.value = true;
};

// ✅ [修改] 執行驗證邏輯 (包含角色檢查)
const handleVerification = async () => {
    if (!verifyForm.key || !verifyForm.password) return;
    
    isVerifying.value = true;
    try {
        // 1. 呼叫 API 驗證帳號密碼
        const result = await loginUser(verifyForm.key, verifyForm.password, "verify-session");
        
        if (result && result.status === 'success') {
            // 2. 檢查角色權限
            const userRoles = result.user.roles || [];
            const hasAdminRole = userRoles.includes('超級管理員') || userRoles.includes('系統管理員');

            if (hasAdminRole) {
                // 驗證成功且權限符合
                verificationDialog.value = false;
                settingsDialog.value = true; // 打開設定視窗
            } else {
                // 帳密正確但權限不足
                toast.error("驗證失敗：您的帳號權限不足 (非管理員)");
            }
        } else {
            toast.error("驗證失敗：帳號或密碼錯誤");
        }
    } catch (error) {
        console.error("驗證錯誤:", error);
        toast.error("驗證過程發生錯誤");
    } finally {
        isVerifying.value = false;
    }
};

const saveSettings = async () => {
    await updateProjectSheetSettings(projectId, settingsForm.value.id, settingsForm.value.tab);
    settingsDialog.value = false;
    toast.success("設定已儲存");
};

const confirmSync = () => {
    if (!settingsForm.value.id || !settingsForm.value.tab) {
        alert("Google Sheet 未設定，請洽系統維護人員");
        return;
    }
    confirmDialog.value = true;
};

const executeSync = async () => {
    confirmDialog.value = false;
    isSyncing.value = true;
    try {
        await syncToGoogleSheet(projectId, dateRange.value[0], dateRange.value[1]);
        toast.success("同步成功！");
    } catch (e) {
        console.error(e);
        toast.error("同步失敗：" + e.message);
    } finally {
        isSyncing.value = false;
    }
};
</script>

<style scope>
/* 在 style 區塊加入 */
:deep(.dp__outer_menu_wrap) {
  z-index: 9999 !important; /* 確保高於 Vuetify 的 Dialog (通常是 2400) */
}
</style>