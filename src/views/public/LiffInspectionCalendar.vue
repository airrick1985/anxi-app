<template>
  <v-container fluid class="pa-2 pa-sm-4" style="background-color: #F4F4F7; min-height: 100vh;">
    <v-card class="mx-auto" max-width="1000">
      <v-toolbar color="primary" dark flat>
        <v-toolbar-title class="font-weight-bold">預約時間表</v-toolbar-title>
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

                      <!-- ✅ 新增：時段設定按鈕 -->
                      <v-tooltip location="bottom">
                        <template v-slot:activator="{ props }">
                          <v-btn v-bind="props" icon="mdi-clock-outline" @click="isTimeSlotDialogVisible = true"></v-btn>
                        </template>
                        <span>時段設定</span>
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
          v-model:selectedMethods="selectedMethods"
          v-model:selectedDisplayFields="selectedDisplayFields"
          :displayFieldOptions="displayFieldOptions"
          :availableTypes="currentTypeOptions"
          :availableMethods="currentMethodOptions"
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

    <!-- ✅ 新增：時段設定對話框 -->
    <v-dialog v-model="isTimeSlotDialogVisible" max-width="500px" scrollable>
      <v-card>
        <v-card-title class="pa-4 bg-grey-lighten-3">
          <span class="text-h6">時段設定</span>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <!-- 自動/手動切換按鈕 -->
          <v-label class="text-subtitle-1 font-weight-bold mb-2 d-block">顯示模式</v-label>
          <v-btn-toggle v-model="autoTimeSlotMode" mandatory density="compact" color="primary" variant="outlined" class="flex-grow-1 mb-3 d-flex">
            <v-btn :value="true" size="small" prepend-icon="mdi-auto-fix" class="flex-grow-1">自動顯示</v-btn>
            <v-btn :value="false" size="small" prepend-icon="mdi-tune-variant" class="flex-grow-1">手動選擇</v-btn>
          </v-btn-toggle>

          <div class="text-caption text-grey-darken-1 mb-4">
            {{ autoTimeSlotMode ? '根據當天預約資料自動顯示有資料的時段' : '自行勾選要顯示的時段' }}
          </div>

          <!-- 手動模式：checkbox 列表 -->
          <v-expand-transition>
            <div v-if="!autoTimeSlotMode">
              <v-label class="text-subtitle-1 font-weight-bold mb-2 d-block">選擇時段</v-label>
              <div class="d-flex justify-space-between mb-2">
                <v-btn size="small" variant="text" @click="selectAllTimeSlots">全選</v-btn>
                <v-btn size="small" variant="text" @click="clearAllTimeSlots">清空</v-btn>
              </div>
              <v-row no-gutters style="max-height: 300px; overflow-y: auto;">
                <v-col v-for="time in allPossibleTimeSlots" :key="time" cols="6">
                  <v-checkbox
                    v-model="selectedTimeSlots"
                    :label="time"
                    :value="time"
                    density="compact"
                    hide-details
                    class="pa-1"
                  ></v-checkbox>
                </v-col>
              </v-row>
            </div>
          </v-expand-transition>

          <!-- 自動模式：顯示偵測到的時段 -->
          <v-expand-transition>
            <div v-if="autoTimeSlotMode">
              <v-label class="text-subtitle-1 font-weight-bold mb-2 d-block">偵測到的時段</v-label>
              <v-alert v-if="dataBasedTimeSlots.length === 0" type="info" variant="tonal" density="compact">
                當天無預約資料，將顯示預設 08:00-18:00
              </v-alert>
              <div v-else>
                <div class="text-caption text-grey-darken-1 mb-2">
                  偵測到 {{ dataBasedTimeSlots.length }} 個時段有預約資料：
                </div>
                <v-chip-group column>
                  <v-chip v-for="slot in dataBasedTimeSlots" :key="slot" size="small" variant="tonal" color="primary">
                    <v-icon start size="x-small">mdi-clock-outline</v-icon>
                    {{ slot }}
                  </v-chip>
                </v-chip-group>
              </div>
            </div>
          </v-expand-transition>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-3 bg-grey-lighten-4">
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="flat"
            @click="isTimeSlotDialogVisible = false"
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
      <v-chip class="ml-2" href="https://anxismart.com/" target="_blank" rel="noopener noreferrer" color="blue-grey" variant="tonal" size="small" label>
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
import { useStorage } from '@vueuse/core';
import liff from '@line/liff';
import html2canvas from 'html2canvas';
import {
  getLiffUserData,
  liffSearchAppointments,
  getLiffCalendarDataForDay,
  getAllLiffAppointmentsForProject, // ✓ 引入新函式
  liffFetchBookingOptions,
  liffUpdateAppointment,
  liffCancelAppointment,
  liffUpdateAppointmentInspectors,
  liffGetAdminBookingCalendarData,
  fetchAllHouseholdsForLiff, // ✓ 加上這個 import
  fetchProjectConfig, // ✓ 新增：獲取完整的項目配置（包含 bookingMenu）

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

const selectedProject = ref(null);

const FilterCheckboxes = defineAsyncComponent(() => import('@/components/LiffCalendarFilters.vue'));

// 動態計算顯示欄位選項（與 InspectionCalendar 邏輯一致）
const displayFieldOptions = computed(() => {
  const baseFields = [
    { key: 'unitId', label: '戶別' },
    { key: 'bookerName', label: '預約人姓名' },
    { key: 'bookingType', label: '預約項目' },
    { key: 'inspectionMethod', label: '選擇方式' },
    { key: 'inspectionCompanyName', label: '代驗公司名稱' },
    { key: 'bookingRemarks', label: '預約備註' },
    { key: 'inspectors', label: '驗屋人員', formatter: (val) => val ? `【${val}】` : null },
  ];

  // 動態掃描 bookingMenu 中所有 methods 的 customFields，篩選 expanded === true
  const dynamicFields = [];
  if (!selectedProject.value) return baseFields;

  const projectData = liffProjects.value.find(p => p.projectId === selectedProject.value);
  const menu = projectData?.bookingMenu;

  if (Array.isArray(menu)) {
    const seenLabels = new Set(baseFields.map(f => f.label));
    for (const item of menu) {
      if (!Array.isArray(item.methods)) continue;
      for (const method of item.methods) {
        if (method.deleted) continue;
        if (!Array.isArray(method.customFields)) continue;
        for (const cf of method.customFields) {
          if (cf.expanded && cf.label && !seenLabels.has(cf.label)) {
            seenLabels.add(cf.label);
            // isDynamic 標記為動態欄位，取值時從 bookingMethodDetails[key] 讀取
            dynamicFields.push({ key: cf.id, label: cf.label, isDynamic: true });
          }
        }
      }
    }
  }

  // 將動態欄位插入到「選擇方式」之後
  const insertIndex = baseFields.findIndex(f => f.key === 'inspectionMethod') + 1;
  const result = [...baseFields];
  result.splice(insertIndex, 0, ...dynamicFields);
  return result;
});

// 使用 useStorage 記住使用者的篩選設定（與 InspectionCalendar 邏輯一致，key 包含 projectId）
const selectedStatuses = useStorage(
  computed(() => `liff_inspection_calendar_selected_statuses_${selectedProject.value}`),
  ['預約中', '取消', '已完成']
);
const selectedTypes = useStorage(
  computed(() => `liff_inspection_calendar_selected_types_${selectedProject.value}`),
  []
);
const selectedMethods = useStorage(
  computed(() => `liff_inspection_calendar_selected_methods_${selectedProject.value}`),
  []
);
const selectedDisplayFields = useStorage(
  computed(() => `liff_inspection_calendar_display_fields_${selectedProject.value}`),
  []
);







const calendarContentRef = ref(null);
const isSharing = ref(false);
const isAdminAddDialogVisible = ref(false);







const dateAdapter = useDate();

const isLoading = ref(true);
const loadingText = ref('正在初始化...');
const isBound = ref(false);
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
// ✅ 新增：時段設定對話框的可見性
const isTimeSlotDialogVisible = ref(false);
// [新增] 用來儲存從後端獲取的詳細專案資訊 (包含 bookingTypes)
const liffProjects = ref([]);

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

const projectHouseholds = ref(new Map()); // ✓ 新增此行，用 Map 來快速查找

const userName = computed(() => userStore.user?.name || '');

const navigateToReportManager = () => {
  if (userStore.user && userStore.user.key) {
    // 透過 router.push 並帶上 userKey 與 projectId，不經過 LIFF 重新驗證
    router.push({
      name: 'ReportFolderManager',
      params: { projectId: selectedProject.value || '' },
      query: { userKey: userStore.user.key }
    });
  } else {
    // 備用方案：直接導向至驗屋報告管理的 LIFF 頁面
    window.location.href = 'https://liff.line.me/2008257338-gYnbKlpR';
  }
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


/**
 * ✓ 新增：獲取建案的所有戶別資料並存入 Map
 */
const fetchProjectHouseholds = async (projectId) => {
  if (!projectId) {
    projectHouseholds.value = new Map();
    return;
  }
  try {
    // 呼叫我們在 api.js 中為 LIFF 建立的專用函數
    const householdsArray = await fetchAllHouseholdsForLiff(projectId);
    
    const householdMap = new Map();
    householdsArray.forEach(hh => {
      // 使用 unitId 作為 key
      householdMap.set(hh.unitId, hh);
    });
    projectHouseholds.value = householdMap;
    
  } catch (error) {
    console.error('獲取戶別資料失敗:', error);
    projectHouseholds.value = new Map(); // 發生錯誤時清空
  }
};

// [修改] authorizedProjects 改為從 liffProjects 產生
// 這樣可以確保下拉選單的資料源與我們儲存詳細設定的地方一致
const authorizedProjects = computed(() => {
  return liffProjects.value.map(p => ({
    projectId: p.projectId,
    projectName: p.projectName,
  })).sort((a, b) => a.projectName.localeCompare(b.projectName, 'zh-Hant'));
});

// [修改] currentTypeOptions - 從 bookingMenu 取用 title 欄位（與 InspectionCalendar 邏輯一致）
const currentTypeOptions = computed(() => {
  if (!selectedProject.value) return [];

  const projectData = liffProjects.value.find(p => p.projectId === selectedProject.value);

  // 從 bookingMenu 陣列取用 title 欄位
  if (projectData && Array.isArray(projectData.bookingMenu) && projectData.bookingMenu.length > 0) {
    return projectData.bookingMenu.map(item => item.title).filter(Boolean);
  }

  // 若無 bookingMenu，回傳預設值
  return [];
});

// [新增] 監聽 selectedProject 的變化
watch(selectedProject, (newProjectId) => {
  if (newProjectId) {
    const projectData = liffProjects.value.find(p => p.projectId === newProjectId);
    console.log('[watch selectedProject] loaded bookingMenu for', newProjectId, ':', projectData?.bookingMenu?.length || 0, 'items');
  }
}, { immediate: true });

// [修改] 監聽 currentTypeOptions 的變化 (與 InspectionCalendar 邏輯一致)
watch(currentTypeOptions, (newOptions) => {
  selectedTypes.value = [...newOptions];
});

// [修改] currentMethodOptions - 從 bookingMenu 的 methods 取用（與 InspectionCalendar 邏輯一致）
const currentMethodOptions = computed(() => {
  if (!selectedProject.value) return [];

  const projectData = liffProjects.value.find(p => p.projectId === selectedProject.value);
  const menu = projectData?.bookingMenu;

  if (!Array.isArray(menu)) return [];

  const methods = new Set();
  for (const item of menu) {
    if (!Array.isArray(item.methods)) continue;
    for (const m of item.methods) {
      if (m.title && !m.deleted) methods.add(m.title);
    }
  }
  return [...methods];
});

// [新增] 監聽 currentMethodOptions 的變化，初始化 selectedMethods（與 InspectionCalendar 邏輯一致）
watch(currentMethodOptions, (newOptions) => {
  if (selectedMethods.value.length === 0 && newOptions.length > 0) {
    selectedMethods.value = [...newOptions];
  }
});

// 從事件資料中取得欄位值的輔助函式（與 InspectionCalendar 邏輯一致）
// 靜態欄位直接從 event[key] 讀取，動態欄位從 event.bookingMethodDetails[key] 讀取
function getFieldValue(eventData, fieldOption) {
  if (fieldOption.isDynamic) {
    return eventData.bookingMethodDetails?.[fieldOption.key] ?? null;
  }
  return eventData[fieldOption.key] ?? null;
}

// 當 displayFieldOptions 變化時，同步更新 selectedDisplayFields
// - 若快取為空：全選
// - 若已有快取：清除已不存在的 key，並自動加入新出現的動態欄位
watch(displayFieldOptions, (newOptions) => {
  const validKeys = new Set(newOptions.map(f => f.key));
  if (selectedDisplayFields.value.length === 0 && newOptions.length > 0) {
    // 首次使用或快取為空，預設全選
    selectedDisplayFields.value = newOptions.map(f => f.key);
  } else if (newOptions.length > 0) {
    // 清除已不存在的舊 key
    const cleaned = selectedDisplayFields.value.filter(k => validKeys.has(k));
    // 找出新出現的動態欄位 key，自動加入
    const existingKeys = new Set(selectedDisplayFields.value);
    const newDynamicKeys = newOptions
      .filter(f => f.isDynamic && !existingKeys.has(f.key))
      .map(f => f.key);
    selectedDisplayFields.value = [...cleaned, ...newDynamicKeys];
  }
}, { immediate: true });

const canEdit = computed(() => {
  const projectName = authorizedProjects.value.find(p => p.projectId === selectedProject.value)?.projectName;
  if (!projectName) return false;
  return userStore.hasProjectPermission('驗屋預約管理-修改', projectName);
});


// [修改] onMounted 邏輯
onMounted(async () => {
  try {
    loadingText.value = '正在與 LINE 連接...';
    // 根據環境選擇 LIFF ID
    const isDev = import.meta.env.DEV;
    const liffId = isDev
      ? import.meta.env.VITE_LIFF_ID_DEV    // 測試用: 2008257338-6N3jwqxA
      : import.meta.env.VITE_LIFF_ID_PROD;  // 正式用: 2008257338-o8grV0ZD

    await liff.init({ liffId });

    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    const profile = await liff.getProfile();
    
    loadingText.value = '正在驗證權限...';
    
    // 1. 直接呼叫 API 獲取包含 bookingTypes 的詳細資料
    const userData = await getLiffUserData({ lineId: profile.userId });

    if (userData.status === 'bound') {
      isBound.value = true;

      // 2. 將 API 回傳的 projects (包含 bookingTypes) 存入本地變數
      liffProjects.value = userData.projects || [];


      // 2.5. ✓ 新增：為每個項目獲取完整的項目配置（包含 bookingMenu）
      console.log('📋 [LIFF] 開始為所有項目獲取完整配置...');
      for (let i = 0; i < liffProjects.value.length; i++) {
        const projectId = liffProjects.value[i].projectId;
        try {
          console.log(`📋 [LIFF] 正在為 ${projectId} 獲取完整配置...`);
          const fullConfig = await fetchProjectConfig(projectId);
          if (fullConfig && fullConfig.bookingMenu) {
            // 將完整的 bookingMenu 添加到對應的項目
            liffProjects.value[i].bookingMenu = fullConfig.bookingMenu;
            console.log(`✅ [LIFF] ${projectId} 的 bookingMenu 已加載:`, fullConfig.bookingMenu);
          } else {
            console.warn(`⚠️ [LIFF] ${projectId} 沒有 bookingMenu 數據`);
          }
        } catch (configError) {
          console.error(`❌ [LIFF] 獲取 ${projectId} 配置失敗:`, configError);
        }
      }
      console.log('📋 [LIFF] 所有項目配置加載完成:', liffProjects.value);

      // 3. 同步呼叫 userStore 以確保全域權限狀態 (如 canEdit) 正確更新
      // (雖然 getLiffUserData 已經拿了資料，但為了讓 userStore 狀態同步，我們仍執行此動作)
      await userStore.fetchUserByLineId(profile.userId);

      // 4. 預設選取第一個建案
      if (liffProjects.value.length > 0) {
        selectedProject.value = liffProjects.value[0].projectId;
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

// ✅ 新增：完整時段列表（00:00 ~ 23:30，共 48 個）
const allPossibleTimeSlots = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2).toString().padStart(2, '0');
  const minute = (i % 2 === 0) ? '00' : '30';
  return `${hour}:${minute}`;
});

// ✅ 新增：用户手动勾选的时段（useStorage，key绑定 selectedProject）
const selectedTimeSlots = useStorage(
  computed(() => `liff_inspection_calendar_time_slots_${selectedProject.value}`),
  [...allPossibleTimeSlots]
);

// ✅ 新增：自动/手动模式切换（useStorage，key绑定 selectedProject）
const autoTimeSlotMode = useStorage(
  computed(() => `liff_inspection_calendar_auto_time_mode_${selectedProject.value}`),
  true  // 预设：自动模式
);

// ✅ 新增：从当天预约资料中提取有资料的时段
const dataBasedTimeSlots = computed(() => {
  const timeSet = new Set();
  dailyAppointments.value.forEach(appt => {
    if (!appt.appointmentTimeSlot) return;
    const timeSlotStr = String(appt.appointmentTimeSlot);
    const timeMatch = timeSlotStr.match(/(\d{1,2}[:：]\d{2})/);
    if (timeMatch) {
      const normalizedTime = timeMatch[0].replace(/：/g, ':');
      const [h, m] = normalizedTime.split(':').map(Number);
      timeSet.add(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  });
  return [...timeSet].sort();
});

// ✅ 修改：timeSlots 计算属性，支持自动/手动模式
const timeSlots = computed(() => {
  if (autoTimeSlotMode.value) {
    // 自动模式：优先使用当天有预约的时段
    if (dataBasedTimeSlots.value.length > 0) {
      return dataBasedTimeSlots.value;
    }
    // 无数据时回退：显示默认工作时段 08:00 ~ 18:00
    return allPossibleTimeSlots.filter(t => t >= '08:00' && t <= '18:00');
  }
  // 手动模式：使用者自选（排序后输出）
  return [...selectedTimeSlots.value].sort();
});

// ✅ 新增：全选/清空时段的辅助函数
function selectAllTimeSlots() {
  selectedTimeSlots.value = [...allPossibleTimeSlots];
}
function clearAllTimeSlots() {
  selectedTimeSlots.value = [];
}

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
          const value = getFieldValue(appt, option);  // ✅ 使用輔助函式取值（支援動態欄位）
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
  const appointmentsToProcess = dailyAppointments.value.filter(appt => {
    const statusMatch = selectedStatuses.value.includes(appt.status);
    const typeMatch = selectedTypes.value.includes(appt.bookingType);
    const methodMatch = selectedMethods.value.length === 0 || selectedMethods.value.includes(appt.inspectionMethod);
    return statusMatch && typeMatch && methodMatch;
  });
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
    fetchProjectHouseholds(newProjectId); // ✓ 新增此行
    try {
      bookingOptions.value = await liffFetchBookingOptions(newProjectId);
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
  // ✓ 1. (item) 是點擊的預約(appointment)資料
  // ✓ 2. 從我們緩存的 Map 中，根據 unitId 找出對應的戶別(household)資料
  const householdData = projectHouseholds.value.get(item.unitId) || {};

  // ✓ 3. 合併兩個物件
  //    將 householdData 放前面, item 放後面
  //    這樣 item 的欄位 (如 id, status) 會覆蓋 householdData 的同名欄位
  const mergedAppointment = {
    ...householdData, // 包含: address, buyerName, inspectionDocsUrl...
    ...item           // 包含: id, status, appointmentDate, bookerName...
  };

  // ✓ 4. 將「合併後」的物件傳遞給 Dialog
  selectedAppointment.value = mergedAppointment;
  
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
    const calendarResult = await liffGetAdminBookingCalendarData({  
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
    await liffUpdateAppointmentInspectors(appointmentId, inspectors);

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
    await liffUpdateAppointment(appointmentId, bookingPayload, householdDocId, householdPayload);
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
   await liffCancelAppointment(id, projectId, unitId, bookingType);
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