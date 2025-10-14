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
    :can-edit="canEdit"
    :booking-options="bookingOptions"
    :calendar-data="calendarData"
    @save="handleSaveAppointment"
    @cancel-appointment="promptCancelBooking"
    @update-inspectors="handleUpdateInspectors"
  />

    <v-dialog v-model="isCancelConfirmDialogVisible" max-width="500px" persistent>
      <v-card v-if="eventToCancel">
        <v-card-title class="text-h6 d-flex align-center bg-red-lighten-4">
          <v-icon start color="red-darken-2">mdi-alert-circle-outline</v-icon>
          <span>確認取消預約</span>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="py-4">
          <p class="mb-4">您確定要取消以下這筆預約紀錄嗎？</p>
          <v-list density="compact" class="bg-red-lighten-5 rounded">
            <v-list-item :title="`${eventToCancel.unitId} (${eventToCancel.bookerName})`" prepend-icon="mdi-home-account">
              <template v-slot:subtitle>
                <div class="font-weight-medium">{{ eventToCancel.bookingType }}</div>
              </template>
            </v-list-item>
          </v-list>
          <div class="text-red-darken-2 font-weight-bold mt-4">此操作無法復原！</div>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-3">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="isCancelConfirmDialogVisible = false">返回</v-btn>
          <v-btn color="red-darken-1" variant="flat" :loading="isCancelling" @click="handleConfirmCancelBooking">確定取消</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.visible" :timeout="3000" :color="snackbar.color" location="top">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, watch, reactive } from 'vue';
import liff from '@line/liff';
// ✓ 新增：引入所有需要的 API
import { 
  getLiffUserData, 
  liffSearchAppointments, 
  fetchBookingOptions, 
  updateAppointment, 
  cancelAppointment,
  updateAppointmentInspectors 
} from '@/api';
import { useDate } from 'vuetify';
// ✓ 新增：引入 userStore
import { useUserStore } from '@/store/user';
import AppointmentDetailsDialog from '@/components/AppointmentDetailsDialog.vue';

const dateAdapter = useDate();
// ✓ 新增：建立 userStore 實例
const userStore = useUserStore();

// ... (大部分 ref 狀態保持不變) ...
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

// ✓ 新增：編輯功能所需的狀態
const bookingOptions = ref({
  inspectionMethods: [],
  inspectionStaff: [],
  buildingsAndUnits: {}
});
const isCancelConfirmDialogVisible = ref(false);
const eventToCancel = ref(null);
const isCancelling = ref(false);
const snackbar = reactive({
  visible: false,
  text: '',
  color: 'success',
});

// ✓ 新增：權限判斷
const canEdit = computed(() => {
  const projectName = authorizedProjects.value.find(p => p.projectId === selectedProject.value)?.projectName;
  if (!projectName) return false;
  return userStore.hasProjectPermission('驗屋預約管理-修改', projectName);
});

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
      // ✓ 新增：在取得使用者資料後，也從 userStore 讀取詳細權限
      await userStore.fetchUserByLineId(profile.userId);

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

// ✓ 新增：監聽 selectedProject，當建案改變時，重新獲取 bookingOptions
watch(selectedProject, async (newProjectId) => {
  if (newProjectId) {
    try {
      bookingOptions.value = await fetchBookingOptions(newProjectId);
    } catch(err) {
      showSnackbar(`讀取編輯選項失敗: ${err.message}`, 'error');
    }
  }
}, { immediate: true });

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

// ✓ 新增：顯示提示訊息的輔助函式
const showSnackbar = (text, color = 'success') => {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.visible = true;
};

async function handleUpdateInspectors(payload) {
  const { appointmentId, inspectors } = payload;
  try {
    // 呼叫 API 更新後端 (不變)
    await updateAppointmentInspectors(appointmentId, inspectors);

    const index = searchResults.value.findIndex(appt => appt.id === appointmentId);
    if (index !== -1) {
      const updatedAppointment = {
        ...searchResults.value[index],
        inspectors: inspectors.join(',')
      };

      // ✅ 【核心修正】同樣使用 .splice() 來更新搜尋結果陣列
      searchResults.value.splice(index, 1, updatedAppointment);
    }
    
    // 更新彈出視窗內的資料 (不變)
    if (selectedAppointment.value && selectedAppointment.value.id === appointmentId) {
      selectedAppointment.value.inspectors = inspectors.join(',');
    }
    showSnackbar('驗屋人員已更新', 'success');
  } catch (err) {
    showSnackbar(`更新驗屋人員失敗: ${err.message}`, 'error');
  }
}

// ✓ 新增：處理儲存的函式
async function handleSaveAppointment(payload) {
  try {
    const { appointmentId, bookingPayload, householdPayload, householdDocId } = payload;
    await updateAppointment(appointmentId, bookingPayload, householdDocId, householdPayload);
    showSnackbar('儲存成功！', 'success');
    isDialogVisible.value = false;
    // 重新執行一次搜尋以更新列表
    await handleSearch(); 
  } catch (err) {
    showSnackbar(`儲存失敗: ${err.message}`, 'error');
  }
}

// ✓ 新增：處理取消預約的函式
function promptCancelBooking(event) {
  eventToCancel.value = event;
  isCancelConfirmDialogVisible.value = true;
}

async function handleConfirmCancelBooking() {
  if (!eventToCancel.value) return;
  isCancelling.value = true;
  try {
    const { id, projectId, unitId, bookingType } = eventToCancel.value;
    await cancelAppointment(id, projectId, unitId, bookingType);
    showSnackbar('預約已成功取消', 'success');
    isCancelConfirmDialogVisible.value = false;
    isDialogVisible.value = false;
    await handleSearch();
  } catch (err) {
    showSnackbar(`取消失敗: ${err.message}`, 'error');
  } finally {
    isCancelling.value = false;
  }
}

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