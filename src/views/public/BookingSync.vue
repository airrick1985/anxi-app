<template>
  <v-container>
    <v-card class="mx-auto" max-width="600">
      <v-toolbar color="indigo" dark>
        <v-toolbar-title>預約同步至 Google Sheet</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn v-if="isAdmin" icon @click="openSettings">
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
        ></VueDatePicker>
        
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

    <v-dialog v-model="settingsDialog" max-width="500">
        <v-card>
            <v-card-title>Google Sheet 設定</v-card-title>
            <v-card-text>
                <v-text-field v-model="settingsForm.id" label="Sheet ID" variant="outlined"></v-text-field>
                <v-text-field v-model="settingsForm.tab" label="工作表名稱 (Tab Name)" variant="outlined"></v-text-field>
                <div class="text-caption text-grey">
                    請確保已將 Sheet 分享給 Service Account Email。
                </div>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="settingsDialog = false">取消</v-btn>
                <v-btn color="primary" @click="saveSettings">儲存</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="confirmDialog" max-width="400">
        <v-card>
            <v-card-title class="text-h5">確認同步?</v-card-title>
            <v-card-text>
                {{ dateText }} 的預約資料將同步到 Google 試算表。<br>
                <span class="text-red font-weight-bold">注意：舊資料將被覆蓋！</span><br>
                (手動填寫的備註將會被保留)
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="confirmDialog = false">取消</v-btn>
                <v-btn color="success" @click="executeSync" :loading="isSyncing">確認同步</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { useUserStore } from '@/store/user';
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { updateProjectSheetSettings, syncToGoogleSheet } from '@/api';
import { useToast } from 'vue-toastification';

const route = useRoute();
const userStore = useUserStore();
const toast = useToast();
const projectId = route.params.projectId;

const projectName = ref('');
const dateRange = ref(null);
const dateError = ref('');
const isSyncing = ref(false);

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
    
    // 檢查是否為週一
    if (start.getDay() !== 1) {
        dateError.value = "起始日必須是星期一";
        return false;
    }
    // 檢查是否為週日
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

// 樣式：讓週六日變色 (選用)
const getDayClass = (date) => {
    const day = date.getDay();
    if (day === 6) return 'text-blue';
    if (day === 0) return 'text-red';
    return '';
};

onMounted(async () => {
    const docRef = doc(db, 'projects', projectId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        const data = snap.data();
        projectName.value = data.name;
        settingsForm.value.id = data.googleSheetId || '';
        settingsForm.value.tab = data.googleSheetTabName || '';
    }
});

const openSettings = () => {
    settingsDialog.value = true;
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