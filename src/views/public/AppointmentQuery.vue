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
        <v-btn color="primary" class="mt-6" href="/?liff_path=line-binding" variant="elevated">
          前往綁定頁面
        </v-btn>
      </div>

      <div v-else>
        <v-form @submit.prevent="handleSearch">
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
              label="輸入戶別、姓名、電話或預約代碼"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              :disabled="!selectedProject || isSearching"
              class="mt-4"
            ></v-text-field>
          </v-card-text>
          <v-card-actions class="px-4 pb-4">
            <v-spacer></v-spacer>
            <v-btn type="submit" color="primary" variant="elevated" :loading="isSearching" :disabled="!selectedProject" size="large" prepend-icon="mdi-magnify">
              查詢
            </v-btn>
          </v-card-actions>
        </v-form>
        <v-divider></v-divider>

        <div v-if="hasSearched && searchResults.length === 0 && !isSearching" class="text-center pa-8 text-grey">
          <p>找不到符合「{{ lastSearchText }}」的預約紀錄。</p>
        </div>

        <v-list lines="two" class="py-0">
          <template v-for="(item, index) in searchResults" :key="item.id">
            <v-list-item @click="openDetailsDialog(item)">
              <template v-slot:prepend>
                <v-avatar color="primary" class="mr-4">
                  <span class="text-h6">{{ item.unitId ? item.unitId.charAt(0) : '?' }}</span>
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-bold d-flex align-center">
                <span>{{ item.unitId }} - {{ item.bookerName }}</span>
                <v-chip :color="getStatusColor(item.status)" size="x-small" label class="ml-auto">{{ item.status }}</v-chip>
              </v-list-item-title>
              <v-list-item-subtitle class="mt-2 text-body-2">
                <v-row dense>
                  <v-col cols="12" sm="6" class="d-flex align-center">
                    <v-icon size="small" class="mr-2" color="grey-darken-1">mdi-calendar-check</v-icon>
                    <span class="text-grey-darken-3">{{ formatDate(item.appointmentDate) }} {{ item.appointmentTimeSlot }}</span>
                  </v-col>
                  <v-col cols="12" sm="6" class="d-flex align-center">
                    <v-icon size="small" class="mr-2" color="grey-darken-1">mdi-format-list-checks</v-icon>
                    <span class="text-grey-darken-3">{{ item.bookingType }} / {{ item.inspectionMethod }}</span>
                  </v-col>
                </v-row>
              </v-list-item-subtitle>
            </v-list-item>
            <v-divider v-if="index < searchResults.length - 1"></v-divider>
          </template>
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

    <AppointmentDetailsDialog
      v-model="isDialogVisible"
      :appointment="selectedAppointment"
    />
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import liff from '@line/liff';
import { getLiffUserData, liffSearchAppointments } from '@/api';
import { useDate } from 'vuetify';
// ✓ 這裡的 import 保持不變，因為我們需要引入元件
import AppointmentDetailsDialog from '@/components/AppointmentDetailsDialog.vue';


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
const hasSearched = ref(false);
const lastSearchText = ref('');

onMounted(async () => {
  try {
    loadingText.value = '正在與 LINE 連接...';
    await liff.init({ liffId: '2008257338-6N3jwqxA' });

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

const handleSearch = async () => {
  if (!searchText.value || !selectedProject.value) {
    searchResults.value = [];
    hasSearched.value = true;
    lastSearchText.value = searchText.value;
    return;
  }
  
  isSearching.value = true;
  hasSearched.value = true;
  lastSearchText.value = searchText.value;
  searchResults.value = [];

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
};

const openDetailsDialog = (item) => {
  selectedAppointment.value = item;
  isDialogVisible.value = true;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
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