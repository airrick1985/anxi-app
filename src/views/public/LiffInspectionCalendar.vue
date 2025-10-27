<template>
  <v-container fluid class="pa-2 pa-sm-4" style="background-color: #F4F4F7; min-height: 100vh;">
    <v-card class="mx-auto" max-width="1000">
      <v-toolbar color="primary" dark flat>
        <v-toolbar-title class="font-weight-bold">驗屋時間表</v-toolbar-title>
      </v-toolbar>

      <div v-if="isLoading" class="text-center pa-10">
        <v-progress-circular indeterminate color="primary" size="50"></v-progress-circular>
        <p class="mt-4 text-grey">{{ loadingText }}</p>
      </div>

      <div v-else-if="!isBound" class="text-center pa-10">
        <v-icon size="60" color="warning" class="mb-4">mdi-account-alert-outline</v-icon>
        <p class="text-h6">無法使用此功能</p>
        <p class="mt-2 text-grey-darken-1">您的 LINE 帳號尚未綁定系統手機，請先完成綁定。</p>
        <v-btn color="primary" class="mt-6" href="/?liff_path=line-binding" variant="elevated">
          前往綁定頁面
        </v-btn>
      </div>

      <div v-else>
        <Transition name="fade" appear>
          <div>
            <div class="pa-4">
              <p class="mb-4">歡迎，{{ userName }}！請選擇建案與日期進行查詢。</p>
              <v-row dense>
                <v-col cols="12" md="4">
                  <v-select
                    v-model="selectedProject"
                    :items="authorizedProjects"
                    item-title="projectName"
                    item-value="projectId"
                    label="選擇建案"
                    variant="outlined"
                    
                    hide-details
                  ></v-select>
                </v-col>
                <v-col cols="12" md="8">
                  <v-text-field
                    v-model="searchQuery"
                    label="輸入戶別、姓名、電話或預約代碼"
                    prepend-inner-icon="mdi-magnify"
                    variant="outlined"
                   
                    clearable
                    hide-details
                    :loading="isSearching"
                    
                    :disabled="!selectedProject"
                  ></v-text-field>
                </v-col>
              </v-row>
            </div>
            <v-divider></v-divider>

            <div v-if="isSearchActive">
              <div v-if="isSearching" class="text-center pa-8">
                 <v-progress-circular indeterminate color="primary"></v-progress-circular>
              </div>
              <div v-else-if="searchResults.length === 0" class="text-center pa-8 text-grey">
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


  <v-row v-else class="ma-0">
               <v-col cols="12" md="4" class="pa-4">
                <VueDatePicker
                  auto-apply
                  v-model="selectedDate"
                  inline
                  no-swipe
                  :action-row="{ showNow: true, showPreview: false }"
                  locale="zh-TW"
                  select-text="選取"
                  now-button-label="今天"
                  :month-change-on-scroll="false"
                  :enable-time-picker="false"
                  :disabled="!selectedProject || isFetchingDayData"
       
                   > <template #day="{ date }">
                    <div class="custom-day-cell">
                      <div class="date-number">{{ date.getDate() }}</div>

                      <div v-if="getEventCountsForDay(date)" class="event-counts">
                        <span v-if="getEventCountsForDay(date).booked > 0" class="count-booked">
                          {{ getEventCountsForDay(date).booked }}
                        </span>
                        <span v-if="getEventCountsForDay(date).completed > 0" class="count-completed">
                          {{ getEventCountsForDay(date).completed }}
                        </span>
                      </div>
                    </div>
                  </template>
                </VueDatePicker>          
              </v-col>

              
              <v-divider vertical class="d-none d-md-block"></v-divider>

              <v-col cols="12" md="8" class="pa-0">
                 <v-toolbar density="compact" flat class="border-b">
                    <v-toolbar-title class="text-subtitle-2">
                     {{ responsiveToolbarTitle }}
                    </v-toolbar-title>

                    <v-tooltip location="bottom" v-if="canEdit">
                      <template v-slot:activator="{ props }">
                        <v-btn
                          v-bind="props"
                          icon="mdi-table-large-plus"
                          @click="isAdminAddDialogVisible = true"
                          :disabled="!selectedProject"
                        ></v-btn>
                      </template>
                      <span>新增預約</span>
                    </v-tooltip>
                    
                    
                    <v-tooltip location="bottom">
                      <template v-slot:activator="{ props }">
                        <v-btn v-bind="props" icon="mdi-share-variant" @click="handleShare" :loading="isSharing" :disabled="isFetchingDayData"></v-btn>
                      </template>
                      <span>分享時間表</span>
                    </v-tooltip>
                    
                    <v-tooltip location="bottom">
                        <template v-slot:activator="{ props }">
                          <v-btn
                            v-bind="props"
                            icon="mdi-folder-google-drive"
                            @click="navigateToReportManager"
                            :disabled="!selectedProject"
                          ></v-btn>
                        </template>
                        <span>驗屋報告</span>
                      </v-tooltip>
                      <v-tooltip location="bottom">
                        <template v-slot:activator="{ props }">
                          <v-btn v-bind="props" icon="mdi-cog" @click="isFilterDialogVisible = true"></v-btn>
                        </template>
                        <span>顯示設定</span>
                      </v-tooltip>
                 </v-toolbar>                 
                
                <div
                  ref="calendarContentRef"
                  class="calendar-content"
                  style="background-color: white;"
                >
                  <div v-if="isFetchingDayData" class="text-center pa-10">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                    <p class="mt-2 text-grey">正在載入 {{ formattedSelectedDate }} 的資料...</p>
                  </div>
                  <v-list v-else lines="three" class="py-0">
                    <template v-for="timeSlot in timeSlots" :key="timeSlot">
                      <v-list-item class="time-slot-item">
                        <template v-slot:prepend>
                          <div class="time-label">{{ timeSlot }}</div>
                        </template>
                        <div class="events-container">
                           <p v-if="!groupedEvents[timeSlot]" class="text-grey-lighten-1 text-center text-caption ma-2">無預約</p>
                           
                           <TransitionGroup name="event-pop">
                             <div
                                v-for="event in groupedEvents[timeSlot]"
                                :key="event.id"
                                :class="['event-item', { 'cancelled-event': event.status === '取消' }]"
                                :style="getEventStyle(event)"
                                @click="openDetailsDialog(event)"
                              >
                                <v-icon v-if="event.status === '取消'" color="red-darken-1" size="small" class="mr-1">mdi-close-circle-outline</v-icon>
                                <v-icon v-if="event.status === '已完成'" color="blue-grey" size="small" class="mr-1">mdi-check-all</v-icon>
                                
                                <span style="display: inline-block; text-align: left;">
                                  <template v-for="(part, partIndex) in event.displayParts" :key="partIndex">
                                    <strong v-if="part.isHousehold" class="event-household">{{ part.text }}</strong>
                                    <span v-else>{{ part.text }}</span>
                                    <span v-if="partIndex < event.displayParts.length - 1"> - </span>
                                  </template>
                                </span>
                             </div>
                           </TransitionGroup>
                        </div>
                      </v-list-item>
                      <v-divider></v-divider>
                    </template>
                  </v-list>
                </div>
              </v-col>
            </v-row>
          </div>
        </Transition>
      </div>
    </v-card>

 
    <v-dialog v-model="isFilterDialogVisible" max-width="500px" scrollable>
      <v-card>
        <v-card-title class="pa-4 bg-grey-lighten-3">
          <span class="text-h6">篩選與顯示</span>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <FilterCheckboxes
            v-model:selectedStatuses="selectedStatuses"
            v-model:selectedTypes="selectedTypes"
            v-model:selectedDisplayFields="selectedDisplayFields"
            :displayFieldOptions="displayFieldOptions"
          />
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-3 bg-grey-lighten-4">
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="flat"
            @click="isFilterDialogVisible = false"
          >
            完成
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

      <AppointmentDetailsDialog
      v-model="isDialogVisible"
      :appointment="selectedAppointment"
      :can-edit="canEdit"
      :booking-options="bookingOptions"
      :booking-history="appointmentHistory"
      :calendar-data="calendarData" 
      @save="handleSaveAppointment"
      @cancel-appointment="promptCancelBooking"
      @update-inspectors="handleUpdateInspectors"
      @request-calendar-data="handleRequestCalendarData"
    />

        <AdminAddBookingDialog
          v-if="selectedProject"
          v-model="isAdminAddDialogVisible"
          :project-id="selectedProject"
          @booking-success="handleBookingSuccess"
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

    <div class="text-caption text-grey text-center mt-6 d-flex align-center justify-center">
      <span>本服務由</span>
      <v-chip class="ml-2" href="https://airrick1985.wixsite.com/anxi" target="_blank" rel="noopener noreferrer" color="blue-grey" variant="tonal" size="small" label>
        <v-icon start size="x-small">mdi-rocket-launch-outline</v-icon>
        anxismart安熙智慧建案管理系統
      </v-chip>
      <span>提供技術支援</span>
    </div>
    
  </v-container>
</template>
<script setup>
import { useRouter } from 'vue-router'; 
import { ref, onMounted, computed, watch, defineAsyncComponent, reactive } from 'vue';
import liff from '@line/liff';
import html2canvas from 'html2canvas';
import { 
  getLiffUserData, 
  liffSearchAppointments, 
  getLiffCalendarDataForDay, 
  getAllLiffAppointmentsForProject, // ✓ 引入新函式
  fetchBookingOptions, 
  updateAppointment, 
  cancelAppointment,
  updateAppointmentInspectors,
getAdminBookingCalendarData
} from '@/api';
import { useDate, useDisplay } from 'vuetify';
import { watchDebounced } from '@vueuse/core';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { format, startOfDay } from 'date-fns'; // ✓ 移除不再需要的 date-fns 函式
import { zhTW } from 'date-fns/locale';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/store/user';
import AppointmentDetailsDialog from '@/components/AppointmentDetailsDialog.vue';
import AdminAddBookingDialog from '@/components/AdminAddBookingDialog.vue';

const router = useRouter(); 
const { smAndDown, mobile } = useDisplay(); 
const userStore = useUserStore();

const calendarContentRef = ref(null);
const isSharing = ref(false);
const isAdminAddDialogVisible = ref(false);

const FilterCheckboxes = defineAsyncComponent(() => import('@/components/LiffCalendarFilters.vue'));
const dateAdapter = useDate();

const isLoading = ref(true);
const loadingText = ref('正在初始化...');
const isBound = ref(false);
const selectedProject = ref(null);
const selectedDate = ref(startOfDay(new Date()));
const isFetchingDayData = ref(false);
const dailyAppointments = ref([]);
const allProjectAppointments = ref([]); // ✓ 用於存放所選建案的「所有」預約資料
const calendarData = ref([]); // <--- ★ 2. 在這裡新增 ref
const searchQuery = ref('');
const isSearching = ref(false);
const isSearchActive = ref(false);
const searchResults = ref([]);
const lastSearchText = ref('');
const isDialogVisible = ref(false);
const selectedAppointment = ref(null);
const isFilterDialogVisible = ref(false);

const displayFieldOptions = ref([
  { key: 'unitId', label: '戶別' },
  { key: 'bookingType', label: '預約項目' },
  { key: 'bookerName', label: '預約人姓名' },
  { key: 'inspectionMethod', label: '驗屋方式' },
  { key: 'inspectionCompanyName', label: '代驗公司名稱' },
  { key: 'bookingRemarks', label: '預約備註' },
  { key: 'inspectors', label: '驗屋人員', formatter: (val) => val ? `【${val}】` : null },
]);

const selectedStatuses = ref(['預約中', '已完成', '取消']);
const selectedTypes = ref(['初驗', '複驗', '交屋']);
const selectedDisplayFields = ref(displayFieldOptions.value.map(opt => opt.key));

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

const userName = computed(() => userStore.user?.name || '');

const navigateToReportManager = () => {
  // 直接導向至驗屋報告管理的 LIFF 頁面
  window.location.href = 'https://liff.line.me/2008257338-gYnbKlpR';
};


const getEventCountsForDay = (dateObj) => {
  // ✓ START: 修改數據源
  if (!dateObj || allProjectAppointments.value.length === 0) return null;
  // ✓ END: 修改數據源

  const dateString = format(dateObj, 'yyyy-MM-dd');
  
  let bookedCount = 0;
  let completedCount = 0;

  // ✓ START: 修改數據源
  for (const appt of allProjectAppointments.value) {
  // ✓ END: 修改數據源
    if (format(new Date(appt.appointmentDate), 'yyyy-MM-dd') === dateString) {
      if (appt.status === '預約中') {
        bookedCount++;
      } else if (appt.status === '已完成') {
        completedCount++;
      }
    }
  }

  if (bookedCount === 0 && completedCount === 0) return null;
  
  return {
    booked: bookedCount,
    completed: completedCount,
  };
};

// ✓ START: 新增一個函式來獲取所有專案資料
const fetchAllProjectData = async (projectId) => {
  if (!projectId) return;

  isFetchingDayData.value = true; // 可以共用 loading 狀態
  allProjectAppointments.value = [];
  try {
    const result = await getAllLiffAppointmentsForProject({ projectId });
    if (result.status === 'success' && Array.isArray(result.data)) {
      allProjectAppointments.value = result.data;
    } else {
       showSnackbar('載入所有預約資料失敗', 'error');
    }
  } catch (error) {
    console.error(`獲取建案 ${projectId} 所有預約資料失敗:`, error);
    showSnackbar(`載入所有預約資料失敗`, 'error');
  } finally {
    isFetchingDayData.value = false;
  }
};
// ✓ END: 新增函式

const handleBookingSuccess = () => {
  showSnackbar('預約已成功新增！', 'success');
  // 重新載入當日資料以顯示最新預約
  fetchDayData(selectedProject.value, selectedDate.value);
  // ✓ 同時重新載入所有資料以更新日曆上的計數
  fetchAllProjectData(selectedProject.value);
};


const authorizedProjects = computed(() => {
  const permissions = userStore.user?.permissions;
  if (!permissions) return [];

  const projects = [];
  for (const projectId in permissions) {
    const project = permissions[projectId];

    if (project.systems && 
       (project.systems.includes('驗屋預約管理-檢視') || project.systems.includes('驗屋預約管理-修改'))) 
    {
      projects.push({
        projectId: projectId,
        projectName: project.projectName,
      });
    }
  }

  return projects.sort((a, b) => a.projectName.localeCompare(b.projectName, 'zh-Hant'));
});

const canEdit = computed(() => {
  const projectName = authorizedProjects.value.find(p => p.projectId === selectedProject.value)?.projectName;
  if (!projectName) return false;
  return userStore.hasProjectPermission('驗屋預約管理-修改', projectName);
});


onMounted(async () => {
  try {
    loadingText.value = '正在與 LINE 連接...';
    await liff.init({ liffId: '2008257338-6N3jwqxA' });//2008257338-o8grV0ZD(正式發布id)     2008257338-6N3jwqxA(測試用)

    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    const profile = await liff.getProfile();
    
    loadingText.value = '正在驗證權限...';
    const success = await userStore.fetchUserByLineId(profile.userId);

    if (success) {
      isBound.value = true;
      if (authorizedProjects.value.length > 0) {
        selectedProject.value = authorizedProjects.value[0].projectId;
      }
    } else {
      isBound.value = false;
    }
  } catch (error) {
    console.error('LIFF 頁面初始化失敗:', error);
    loadingText.value = `發生錯誤: ${error.message}`;
  } finally {
    isLoading.value = false;
  }
});

const formattedSelectedDate = computed(() => dateAdapter.format(selectedDate.value, 'keyboardDate'));
const dayName = computed(() => format(selectedDate.value, 'EEEE', { locale: zhTW }));

const responsiveToolbarTitle = computed(() => {
  const projectName = authorizedProjects.value.find(p => p.projectId === selectedProject.value)?.projectName || '';
  if (smAndDown.value) {
    const shortDate = format(selectedDate.value, 'M/d');
    const shortDay = dayName.value.replace('星期', '');
    return `${projectName} - ${shortDate} (${shortDay})`;
  } else {
    return `${projectName} - ${formattedSelectedDate.value} (${dayName.value})`;
  }
});

const timeSlots = computed(() => 
  Array.from({ length: 21 }, (_, i) => {
    const hour = 8 + Math.floor(i / 2);
    const minute = (i % 2) * 30;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  })
);

const processAppointments = (rawAppointments) => {
  if (!Array.isArray(rawAppointments)) return [];

  return rawAppointments.map(appt => {
    try {
      const date = new Date(appt.appointmentDate);
      if (isNaN(date.getTime())) return null;

      const dateStr = format(date, 'yyyy-MM-dd');
      
      const timeSlotString = appt.appointmentTimeSlot ? String(appt.appointmentTimeSlot) : '';
      const timeMatch = timeSlotString.match(/(\d{1,2}[:：]\d{2})/);
      const startTime = timeMatch ? timeMatch[0].replace(/：/g, ':') : '00:00';

      const displayParts = displayFieldOptions.value
        .filter(option => selectedDisplayFields.value.includes(option.key))
        .map(option => {
          const value = appt[option.key];
          if (!value) return null;
          const formattedValue = option.formatter ? option.formatter(value) : String(value);
          return { text: formattedValue, isHousehold: option.key === 'unitId' };
        }).filter(Boolean);
      
      const finalStartObject = new Date(`${dateStr}T${startTime}`);

      if (isNaN(finalStartObject.getTime())) {
        return null;
      }
      
      return { ...appt, start: finalStartObject, displayParts };

    } catch (e) {
      console.warn(`處理預約資料時發生錯誤: ${e.message}`, appt);
      return null;
    }
  }).filter(Boolean);
};

const filteredAppointments = computed(() => {
  const appointmentsToProcess = dailyAppointments.value.filter(appt => 
    selectedStatuses.value.includes(appt.status) && 
    selectedTypes.value.includes(appt.bookingType)
  );
  return processAppointments(appointmentsToProcess);
});

const groupedEvents = computed(() => {
  const grouped = {};
  filteredAppointments.value.forEach(event => {
    const timeKey = event.appointmentTimeSlot.substring(0, 5);
    if (!grouped[timeKey]) {
      grouped[timeKey] = [];
    }
    grouped[timeKey].push(event);
  });
  return grouped;
});

const fetchDayData = async (projectId, date) => {
  if (!projectId || !date) return;
  isFetchingDayData.value = true;
  dailyAppointments.value = [];
  try {
    const dateString = format(date, 'yyyy-MM-dd');
    const result = await getLiffCalendarDataForDay({ projectId, date: dateString });
    if (result.status === 'success') {
      dailyAppointments.value = result.data;
    }
  } catch (error) {
    console.error('獲取單日資料失敗:', error);
  } finally {
    isFetchingDayData.value = false;
  }
};

watch(selectedProject, async (newProjectId) => {
  if (newProjectId) {
    fetchDayData(newProjectId, selectedDate.value);
    fetchAllProjectData(newProjectId);
    try {
      bookingOptions.value = await fetchBookingOptions(newProjectId);
    } catch(err) {
      showSnackbar(`讀取編輯選項失敗: ${err.message}`, 'error');
    }
  }
}, { immediate: true });



watch(selectedDate, (newDate) => {
  // ✓ 當日期改變時，只須要獲取當日的詳細資料列表
  fetchDayData(selectedProject.value, newDate);
});

watchDebounced(searchQuery, (newQuery) => {
  if (newQuery && newQuery.length > 1) {
    isSearchActive.value = true;
    isSearching.value = true;
    lastSearchText.value = newQuery;
    liffSearchAppointments({ projectId: selectedProject.value, searchText: newQuery })
      .then(result => {
        if (result.status === 'success') {
          searchResults.value = result.data.map(d => ({...d, appointmentDate: new Date(d.appointmentDate)}));
        }
      })
      .finally(() => isSearching.value = false);
  } else {
    isSearchActive.value = false;
    searchResults.value = [];
  }
}, { debounce: 500 });

const openDetailsDialog = (item) => {
  selectedAppointment.value = item;
  // 重設 calendarData，確保每次打開編輯都是乾淨的狀態
  calendarData.value = []; 
  isDialogVisible.value = true;
};

// ★ 2. 新增一個處理函式，用來接收子元件的請求並呼叫 API
const handleRequestCalendarData = async (payload) => {
  const { unitId } = payload;
  if (!selectedProject.value || !unitId) {
    showSnackbar('缺少專案或戶別資訊，無法載入行事曆標記', 'error');
    return;
  }

  try {
    const calendarResult = await getAdminBookingCalendarData({ 
      projectId: selectedProject.value,
      unitId: unitId 
    });
    if (calendarResult.status === 'success') {
      calendarData.value = calendarResult.data;
    }
  } catch (err) {
    console.error('獲取行事曆標記失敗:', err);
    showSnackbar(`讀取行事曆標記失敗: ${err.message}`, 'error');
  }
};

const showSnackbar = (text, color = 'success') => {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.visible = true;
};

async function handleUpdateInspectors(payload) {
  const { appointmentId, inspectors } = payload;
  try {
    await updateAppointmentInspectors(appointmentId, inspectors);

    if (isSearchActive.value) {
      const index = searchResults.value.findIndex(appt => appt.id === appointmentId);
      if (index !== -1) {
        const updatedAppointment = {
          ...searchResults.value[index],
          inspectors: inspectors.join(',')
        };
        searchResults.value.splice(index, 1, updatedAppointment);
      }
    } else {
      const index = dailyAppointments.value.findIndex(appt => appt.id === appointmentId);
      if (index !== -1) {
        const tempUpdatedAppointment = {
          ...dailyAppointments.value[index],
          inspectors: inspectors.join(',')
        };
        const fullyProcessedAppointment = processAppointments([tempUpdatedAppointment])[0];
        if (fullyProcessedAppointment) {
          dailyAppointments.value.splice(index, 1, fullyProcessedAppointment);
        }
      }
    }
    
    if (selectedAppointment.value && selectedAppointment.value.id === appointmentId) {
      selectedAppointment.value.inspectors = inspectors.join(',');
    }

    showSnackbar('驗屋人員已更新', 'success');
  } catch (err) {
    showSnackbar(`更新驗屋人員失敗: ${err.message}`, 'error');
  }
}

async function handleSaveAppointment(payload) {
  try {
    const { appointmentId, bookingPayload, householdPayload, householdDocId } = payload;
    await updateAppointment(appointmentId, bookingPayload, householdDocId, householdPayload);
    showSnackbar('儲存成功！', 'success');
    
    // 同步更新當日列表與日曆計數
    await fetchDayData(selectedProject.value, selectedDate.value); 
    await fetchAllProjectData(selectedProject.value);

  } catch (err) {
    showSnackbar(`儲存失敗: ${err.message}`, 'error');
  } finally {
      // ✅ 新增：無論成功或失敗，都在這裡關閉對話框
      isDialogVisible.value = false;
  }
}

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
    await fetchDayData(selectedProject.value, selectedDate.value);
    await fetchAllProjectData(selectedProject.value); // ✓ 取消後也更新計數
  } catch (err) {
    showSnackbar(`取消失敗: ${err.message}`, 'error');
  } finally {
    isCancelling.value = false;
  }
}

const formatDate = (date) => {
  if (!date) return 'N/A';
  return dateAdapter.format(new Date(date), 'keyboardDate');
};

const getStatusColor = (status) => {
  switch (status) {
    case '預約中': return 'blue';
    case '已完成': return 'green';
    case '取消': return 'red';
    default: return 'grey';
  }
};

const CSS_KEYWORD_COLOR_MAP = [
  { keyword: '已撥款', backgroundColor: '#ffc107', color: '#212529' },
  { keyword: '交屋', backgroundColor: '#ffc107', color: '#212529' },
  { keyword: '初驗', backgroundColor: '#d4edda', color: '#155724' },
  { keyword: '複驗', backgroundColor: '#f8d7da', color: '#721c24' },
];

const getEventStyle = (event) => {
  if (!event || Object.keys(event).length === 0) return { backgroundColor: '#FFFFFF', color: '#000000' };
  if (event.status === '取消') return { backgroundColor: '#F5F5F5', color: '#9E9E9E' };
  if (event.status === '已完成') return { backgroundColor: '#ECEFF1', color: '#546E7A' };
  
  const textToSearch = [ event.bookingType, event.inspectionMethod ].join(' ');
  for (const config of CSS_KEYWORD_COLOR_MAP) {
    if (config.keyword && textToSearch.includes(config.keyword)) {
      return { backgroundColor: config.backgroundColor, color: config.color };
    }
  }
  return { backgroundColor: '#EEEEEE', color: '#212121' };
};

async function handleShare() {
  const captureTarget = calendarContentRef.value;
  if (!captureTarget) {
    showSnackbar('找不到日曆內容，無法分享。', 'error');
    return;
  }

  isSharing.value = true;
  showSnackbar('正在產生分享圖片...', 'info');

  const projectName = authorizedProjects.value.find(p => p.projectId === selectedProject.value)?.projectName || '';
  const dateStr = format(selectedDate.value, 'yyyy-MM-dd');
  const nowStr = format(new Date(), 'yyyy/MM/dd HH:mm:ss');
  
  const dayOfWeek = format(selectedDate.value, 'EEEE', { locale: zhTW });

  const headerElement = document.createElement('div');
  headerElement.textContent = `${projectName}_${dateStr} (${dayOfWeek})`;
  Object.assign(headerElement.style, {
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'left',
    padding: '20px 10px 10px 10px',
    color: '#1A237E',
  });

  const timestampElement = document.createElement('div');
  timestampElement.textContent = `資料更新：${nowStr}`;
  Object.assign(timestampElement.style, {
    position: 'absolute',
    top: '10px',
    right: '10px',
    fontSize: '12px',
    color: '#555',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: '2px 5px',
    borderRadius: '3px',
  });
  
  try {
    const originalPosition = captureTarget.style.position;
    captureTarget.style.position = 'relative';
    captureTarget.prepend(headerElement, timestampElement);

    await new Promise(resolve => setTimeout(resolve, 50));

    const canvas = await html2canvas(captureTarget, {
      useCORS: true,
      scale: 2,
    });

    canvas.toBlob(async (blob) => {
      if (!blob) throw new Error('無法產生圖片 Blob。');
      
      const fileName = `${projectName}_${dateStr}_時間表.jpg`;
      const downloadFile = () => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      };

      if (mobile.value) {
        const file = new File([blob], fileName, { type: 'image/jpeg' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `${projectName} - ${format(selectedDate.value, 'yyyy/MM/dd')} 時間表`,
            });
          } catch (err) {
            if (err.name !== 'AbortError') {
              console.warn("手機分享失敗，退回至下載:", err);
              downloadFile();
            } else {
              console.log("使用者取消了分享操作。");
            }
          }
        } else {
          downloadFile();
        }
        } else {
        console.log("偵測到為桌面裝置，直接執行下載。");
        downloadFile();
      }
    }, 'image/jpeg', 0.9);

  } catch (err) {
    console.error('分享圖片產生失敗:', err);
    showSnackbar(`產生圖片失敗: ${err.message}`, 'error');
  } finally {
    if (captureTarget.contains(headerElement)) {
      captureTarget.removeChild(headerElement);
    }
    if (captureTarget.contains(timestampElement)) {
      captureTarget.removeChild(timestampElement);
    }
    isSharing.value = false;
  }
}
</script>

<style scoped>
/* (所有樣式保持不變) */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}
.event-pop-enter-active,
.event-pop-leave-active {
  transition: all 0.4s cubic-bezier(0.55, 0, 0.1, 1);
}
.event-pop-enter-from,
.event-pop-leave-to {
  opacity: 0;
  transform: scale(0.5);
}
.event-pop-leave-active {
  position: absolute;
}
.event-pop-move {
  transition: transform 0.5s ease;
}
.time-slot-item {
  min-height: 10px;
  align-items: flex-start;
}
.time-label {
  font-weight: bold;
  color: #555;
  width: 60px;
  text-align: center;
  padding-top: 0px;
}
.events-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1px;
  width: 100%;
}
.event-item {
  white-space: normal;
  word-wrap: break-word;
  padding: 4px 8px;
  margin: 2px 0;
  border-radius: 4px;
  font-size: 0.85em;
  cursor: pointer;
  transition: opacity 0.2s;
  width: 100%;
  display: flex;
  align-items: center;
}
.event-item:hover {
  opacity: 0.8;
}
.cancelled-event {
  text-decoration: line-through;
  opacity: 0.8;
}
.event-household {
  font-size: 1.2em;
}



/* 自訂日期單元格樣式 */
.custom-day-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}

.date-number {
  line-height: 1;
}

.event-counts {
  position: absolute;
  bottom: -12px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px; /* 在數字之間增加間距 */
  line-height: 1;
  pointer-events: none;
}

.event-counts span {
  font-size: 0.8em;
  font-weight: bold;
  padding: 0 3px;
  border-radius: 4px;
}

.count-booked {
  color: #1B5E20; /* 深綠色 */
  background-color: #E8F5E9; /* 淡綠色背景 */
}

.count-completed {
  color: #37474F; /* 深灰色 */
  background-color: #ECEFF1; /* 淡灰色背景 */
}
</style>