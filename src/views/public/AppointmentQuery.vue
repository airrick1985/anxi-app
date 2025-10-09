<template>
  <v-container fluid class="pa-4" style="background-color: #F4F4F7; min-height: 100vh;">
    <v-card class="mx-auto" max-width="800">
      <v-toolbar color="primary" dark flat>
        <v-toolbar-title class="font-weight-bold">查詢驗屋預約</v-toolbar-title>
      </v-toolbar>

      <div v-if="isLoading" class="text-center pa-10">
        <v-progress-circular indeterminate color="primary" size="50"></v-progress-circular>
        <p class="mt-4 text-grey">{{ loadingText }}</p>
      </div>
      
      <div v-else-if="!isBound" class="text-center pa-10">
        <v-icon size="60" color="warning" class="mb-4">mdi-account-alert-outline</v-icon>
        <p class="text-h6">無法使用此功能</p>
        <p class="mt-2 text-grey-darken-1">您的 LINE 帳號尚未綁定系統手機，請先完成綁定後再使用。</p>
        <v-btn color="primary" class="mt-6" href="/#/line-binding" variant="elevated">
          前往綁定頁面
        </v-btn>
      </div>

      <div v-else>
        <v-card-text>
          <p class="mb-4">歡迎，{{ userName }}！請選擇建案並輸入關鍵字進行查詢。</p>
          <v-select
            v-model="selectedProject"
            :items="authorizedProjects"
            item-title="projectName"
            item-value="projectId"
            label="選擇要查詢的建案"
            variant="outlined"
            density="compact"
            :disabled="isSearching"
          ></v-select>
          <v-text-field
            v-model="searchText"
            label="輸入戶別、姓名、電話或預約代碼查詢"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            clearable
            :disabled="!selectedProject || isSearching"
            :loading="isSearching"
            class="mt-4"
          ></v-text-field>
        </v-card-text>
        <v-divider></v-divider>

        <div v-if="searchText && searchResults.length === 0 && !isSearching" class="text-center pa-8 text-grey">
          <p>找不到符合「{{ searchText }}」的預約紀錄。</p>
        </div>

        <v-list lines="three">
          <v-list-item v-for="item in searchResults" :key="item.id" @click="openDetailsDialog(item)">
            <v-list-item-title class="font-weight-bold">
              {{ item.unitId }} - {{ item.bookerName }}
            </v-list-item-title>
            <v-list-item-subtitle class="mt-1">
              <div><strong>預約項目：</strong>{{ item.bookingType }}</div>
              <div><strong>預約日期：</strong>{{ formatDate(item.appointmentDate) }} {{ item.appointmentTimeSlot }}</div>
              <div><strong>驗屋方式：</strong>{{ item.inspectionMethod }}</div>
              <div v-if="item.inspectionMethod === '代驗公司'"><strong>代驗公司：</strong>{{ item.inspectionCompanyName || '未填寫' }}</div>
            </v-list-item-subtitle>
            <template v-slot:append>
              <v-chip :color="getStatusColor(item.status)" size="small" label>{{ item.status }}</v-chip>
            </template>
          </v-list-item>
        </v-list>
      </div>
    </v-card>
    
    <div class="text-caption text-grey text-center mt-6 d-flex align-center justify-center">
      <span>本服務由</span>
      <v-chip class="ml-2" href="https://airrick1985.wixsite.com/anxi" target="_blank" rel="noopener noreferrer" color="blue-grey" variant="tonal" size="small" label>
        <v-icon start size="x-small">mdi-rocket-launch-outline</v-icon>
        anxismart安熙智慧建案管理系統
      </v-chip>
      <span>提供技術支援</span>
    </div>

    <v-dialog v-model="isDialogVisible" max-width="600px">
      <v-card v-if="selectedAppointment">
        <v-card-title class="text-h5 primary-bg text-white">
          預約詳細資料
        </v-card-title>
        <v-list density="compact" class="py-2">
            <v-list-item title="建案" :subtitle="selectedAppointment.projectName"></v-list-item>
            <v-list-item title="戶別" :subtitle="selectedAppointment.unitId"></v-list-item>
            <v-list-item title="門牌" :subtitle="selectedAppointment.address"></v-list-item>
            <v-divider class="my-2"></v-divider>
            <v-list-item title="預約人" :subtitle="selectedAppointment.bookerName"></v-list-item>
            <v-list-item title="電話" :subtitle="selectedAppointment.bookerPhone"></v-list-item>
            <v-list-item title="Email" :subtitle="selectedAppointment.bookerEmail"></v-list-item>
            <v-list-item title="身分證" :subtitle="selectedAppointment.bookerIdNumber"></v-list-item>
            <v-divider class="my-2"></v-divider>
            <v-list-item title="預約項目" :subtitle="selectedAppointment.bookingType"></v-list-item>
            <v-list-item title="預約日期" :subtitle="formatDate(selectedAppointment.appointmentDate)"></v-list-item>
            <v-list-item title="預約時段" :subtitle="selectedAppointment.appointmentTimeSlot"></v-list-item>
            <v-list-item title="預約代碼" :subtitle="selectedAppointment.bookingCode"></v-list-item>
            <v-divider class="my-2"></v-divider>
            <v-list-item title="驗屋方式" :subtitle="selectedAppointment.inspectionMethod"></v-list-item>
            <v-list-item v-if="selectedAppointment.inspectionMethod === '代驗公司'" title="代驗公司" :subtitle="selectedAppointment.inspectionCompanyName || '未填寫'"></v-list-item>
            <v-list-item title="狀態" :subtitle="selectedAppointment.status">
                <template v-slot:subtitle="{ subtitle }">
                    <v-chip :color="getStatusColor(subtitle)" size="x-small" label>{{ subtitle }}</v-chip>
                </template>
            </v-list-item>
        </v-list>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="isDialogVisible = false">關閉</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import liff from '@line/liff';
import { getLiffUserData, liffSearchAppointments } from '@/api';
import { useDate } from 'vuetify';

const dateAdapter = useDate();

const isLoading = ref(true);
const loadingText = ref('正在初始化...');
const isBound = ref(false);
const userName = ref('');
const authorizedProjects = ref([]);
const selectedProject = ref(null);
const searchText = ref('');
const isSearching = ref(false);
const searchResults = ref([]);
const isDialogVisible = ref(false);
const selectedAppointment = ref(null);
let searchTimeout = null;

onMounted(async () => {
  try {
    loadingText.value = '正在與 LINE 連接...';
    await liff.init({ liffId: '2008257338-6N3jwqxA' }); // ✓ 請記得替換您的 LIFF ID

    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    const profile = await liff.getProfile();
    
    loadingText.value = '正在驗證您的身分與權限...';
    const result = await getLiffUserData({ lineId: profile.userId });

    if (result.status === 'bound') {
      isBound.value = true;
      userName.value = result.userName;
      authorizedProjects.value = result.projects;
      // 如果只有一個建案權限，就自動選取
      if (result.projects.length === 1) {
        selectedProject.value = result.projects[0].projectId;
      }
    } else {
      isBound.value = false;
    }
    
    isLoading.value = false;
  } catch (error) {
    console.error('LIFF 頁面初始化失敗:', error);
    loadingText.value = `發生錯誤: ${error.message}`;
  }
});

watch([searchText, selectedProject], () => {
  clearTimeout(searchTimeout);
  if (!searchText.value || !selectedProject.value) {
    searchResults.value = [];
    return;
  }
  
  isSearching.value = true;
  searchTimeout = setTimeout(async () => {
    try {
    const result = await liffSearchAppointments({
        projectId: selectedProject.value,
        searchText: searchText.value,
      });
      if (result.status === 'success') {
        searchResults.value = result.data;
      }
    } catch (error) {
      console.error('搜尋失敗:', error);
    } finally {
      isSearching.value = false;
    }
  }, 500); // 延遲 500 毫秒執行，避免使用者每打一個字就搜尋一次
});

const openDetailsDialog = (item) => {
  selectedAppointment.value = item;
  isDialogVisible.value = true;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    // 後端回傳的是 ISO 格式字串，vuetify 的 date adapter 可以處理
    return dateAdapter.format(new Date(dateString), 'keyboardDate');
  } catch {
    return dateString;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case '預約中': return 'blue';
    case '已完成': return 'green';
    case '取消': return 'red';
    default: return 'grey';
  }
};
</script>

<style scoped>
.primary-bg {
  background-color: #1a73e8;
}
</style>