<template>
  <v-container fluid class="pa-2 pa-sm-4" style="background-color: #F4F4F7; min-height: 100vh;">
    <v-card class="mx-auto" max-width="1000">
      <v-toolbar color="primary" dark flat>
        <v-toolbar-title class="font-weight-bold">LIFF 驗屋時間表</v-toolbar-title>
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
                density="compact"
                hide-details
              ></v-select>
            </v-col>
            <v-col cols="12" md="8">
              <v-text-field
                v-model="searchQuery"
                label="關鍵字搜尋 (整個建案)"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
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
          <v-list v-else lines="two">
            <template v-for="(item, index) in searchResults" :key="item.id">
              <v-list-item @click="openDetailsDialog(item)">
                <v-list-item-title class="font-weight-bold d-flex align-center">
                  <span>{{ item.unitId }} - {{ item.bookerName }}</span>
                  <v-chip :color="getStatusColor(item.status)" size="x-small" label class="ml-auto">{{ item.status }}</v-chip>
                </v-list-item-title>
                <v-list-item-subtitle class="mt-1">
                    <v-icon size="small" class="mr-1">mdi-calendar-check</v-icon>
                    <span>{{ formatDate(item.appointmentDate) }} {{ item.appointmentTimeSlot }}</span>
                </v-list-item-subtitle>
              </v-list-item>
              <v-divider v-if="index < searchResults.length - 1"></v-divider>
            </template>
          </v-list>
        </div>
        
        <v-row v-else class="ma-0">
          <v-col cols="12" md="4" class="pa-4">
            <VueDatePicker
              v-model="selectedDate"
              inline
              auto-apply
              :enable-time-picker="false"
              locale="zh-TW"
              :disabled="!selectedProject || isFetchingDayData"
            />
            <v-divider class="my-4"></v-divider>
            <div class="d-none d-md-block">
              <h4 class="text-subtitle-1 mb-2">篩選與顯示</h4>
              <FilterCheckboxes />
            </div>
          </v-col>
          
          <v-divider vertical class="d-none d-md-block"></v-divider>

          <v-col cols="12" md="8" class="pa-0">
             <v-toolbar density="compact" flat class="border-b">
                <v-toolbar-title class="text-h6">
                  {{ formattedSelectedDate }} ({{ dayName }})
                </v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn class="d-md-none" icon="mdi-filter-variant" @click="isFilterDrawerVisible = true"></v-btn>
             </v-toolbar>
            
            <div class="calendar-content" style="max-height: 70vh; overflow-y: auto;">
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
                       <v-chip
                          v-for="event in groupedEvents[timeSlot]"
                          :key="event.id"
                          :color="getEventColor(event)"
                          :variant="event.status === '取消' ? 'outlined' : 'flat'"
                          class="event-chip"
                          @click="openDetailsDialog(event)"
                        >
                          <template v-for="(part, partIndex) in event.displayParts" :key="partIndex">
                            <strong v-if="part.isHousehold" class="mr-1">{{ part.text }}</strong>
                            <span v-else>{{ part.text }}</span>
                            <span v-if="partIndex < event.displayParts.length - 1" class="mx-1">-</span>
                          </template>
                       </v-chip>
                    </div>
                  </v-list-item>
                  <v-divider></v-divider>
                </template>
              </v-list>
            </div>
          </v-col>
        </v-row>
      </div>
    </v-card>

    <v-dialog v-model="isDialogVisible" max-width="700px" scrollable>
      <v-card v-if="selectedAppointment">
        <v-toolbar color="primary" density="compact">
          <v-toolbar-title class="font-weight-bold">預約詳細資料</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" @click="isDialogVisible = false"></v-btn>
        </v-toolbar>
        <v-card-text class="pt-4">
          <v-list lines="two" density="compact">
            <v-list-subheader>基本資料</v-list-subheader>
            <v-list-item prepend-icon="mdi-domain" title="建案" :subtitle="selectedAppointment.projectName"></v-list-item>
            <v-list-item prepend-icon="mdi-home-outline" title="戶別" :subtitle="selectedAppointment.unitId"></v-list-item>
            <v-list-item prepend-icon="mdi-map-marker-outline" title="門牌" :subtitle="selectedAppointment.address || '無'"></v-list-item>
            
            <v-list-subheader class="mt-2">預約人資訊</v-list-subheader>
            <v-list-item prepend-icon="mdi-account-outline" title="預約人" :subtitle="selectedAppointment.bookerName"></v-list-item>
            <v-list-item prepend-icon="mdi-phone-outline" title="電話" :subtitle="selectedAppointment.bookerPhone"></v-list-item>

            <v-list-subheader class="mt-2">預約項目詳情</v-list-subheader>
            <v-list-item prepend-icon="mdi-pound" title="預約代碼" :subtitle="selectedAppointment.bookingCode"></v-list-item>
            <v-list-item prepend-icon="mdi-format-list-checks" title="預約項目" :subtitle="selectedAppointment.bookingType"></v-list-item>
            <v-list-item prepend-icon="mdi-calendar-clock" title="預約時程" :subtitle="formatDate(selectedAppointment.appointmentDate) + ' ' + selectedAppointment.appointmentTimeSlot"></v-list-item>
            <v-list-item prepend-icon="mdi-account-search-outline" title="驗屋方式" :subtitle="selectedAppointment.inspectionMethod"></v-list-item>
            <v-list-item v-if="selectedAppointment.inspectionMethod === '代驗公司'" prepend-icon="mdi-office-building-outline" title="代驗公司" :subtitle="selectedAppointment.inspectionCompanyName || '未填寫'"></v-list-item>
            <v-list-item prepend-icon="mdi-list-status" title="狀態">
              <v-list-item-subtitle>
                <v-chip :color="getStatusColor(selectedAppointment.status)" size="small" label>{{ selectedAppointment.status }}</v-chip>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="bg-grey-lighten-5 pa-3">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="tonal" @click="isDialogVisible = false">關閉</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-navigation-drawer v-model="isFilterDrawerVisible" location="right" temporary width="300">
        <v-list-item title="篩選與顯示" class="bg-grey-lighten-3">
            <template v-slot:append>
                <v-btn variant="text" icon="mdi-close" @click="isFilterDrawerVisible = false"></v-btn>
            </template>
        </v-list-item>
        <v-divider></v-divider>
        <div class="pa-4">
            <FilterCheckboxes />
        </div>
    </v-navigation-drawer>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, watch, defineAsyncComponent } from 'vue';
import liff from '@line/liff';
import { getLiffUserData, liffSearchAppointments, getLiffCalendarDataForDay } from '@/api';
import { useDate } from 'vuetify';
import { watchDebounced } from '@vueuse/core';
import { format, startOfDay } from 'date-fns';
import { zhTW } from 'date-fns/locale';

// Async component for filters to keep initial load small
const FilterCheckboxes = defineAsyncComponent(() => import('@/components/LiffCalendarFilters.vue'));

// LIFF & Auth State
const isLoading = ref(true);
const loadingText = ref('正在初始化...');
const isBound = ref(false);
const userName = ref('');
const lineId = ref('');

// Project & Date State
const authorizedProjects = ref([]);
const selectedProject = ref(null);
const selectedDate = ref(startOfDay(new Date()));

// Data Fetching State
const isFetchingDayData = ref(false);
const dailyAppointments = ref([]);

// Search State
const searchQuery = ref('');
const isSearching = ref(false);
const isSearchActive = ref(false);
const searchResults = ref([]);
const lastSearchText = ref('');

// UI State
const isDialogVisible = ref(false);
const selectedAppointment = ref(null);
const isFilterDrawerVisible = ref(false);

// Filter State
const selectedStatuses = ref(['預約中', '已完成']);
const selectedTypes = ref(['初驗', '複驗']);
const displayFieldOptions = ref([
    { key: 'unitId', label: '戶別' },
    { key: 'bookerName', label: '預約人' },
    { key: 'bookingType', label: '項目' },
    { key: 'inspectionMethod', label: '方式' },
]);
const selectedDisplayFields = ref(['unitId', 'bookerName']);

// Adapters
const dateAdapter = useDate();

// Computed Properties
const formattedSelectedDate = computed(() => dateAdapter.format(selectedDate.value, 'keyboardDate'));
const dayName = computed(() => format(selectedDate.value, 'EEEE', { locale: zhTW }));

const timeSlots = computed(() => 
  Array.from({ length: 21 }, (_, i) => {
    const hour = 8 + Math.floor(i / 2);
    const minute = (i % 2) * 30;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  })
);

const filteredAppointments = computed(() => {
  return dailyAppointments.value.filter(appt => 
    selectedStatuses.value.includes(appt.status) && 
    selectedTypes.value.includes(appt.bookingType)
  ).map(appt => ({
    ...appt,
    displayParts: selectedDisplayFields.value.map(key => ({
      text: appt[key] || '',
      isHousehold: key === 'unitId'
    })).filter(part => part.text)
  }));
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

// Methods
onMounted(async () => {
  try {
    loadingText.value = '正在與 LINE 連接...';
    await liff.init({ liffId: '2008257338-o8grV0ZD' }); //  <-- 請替換成您的 LIFF ID

    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    const profile = await liff.getProfile();
    lineId.value = profile.userId;
    
    loadingText.value = '正在驗證權限...';
    const result = await getLiffUserData({ lineId: lineId.value });

    if (result.status === 'bound') {
      isBound.value = true;
      userName.value = result.userName;
      authorizedProjects.value = result.projects;
      if (result.projects.length > 0) {
        selectedProject.value = result.projects[0].projectId;
      }
    }
  } catch (error) {
    console.error('LIFF 頁面初始化失敗:', error);
    loadingText.value = `發生錯誤: ${error.message}`;
  } finally {
    isLoading.value = false;
  }
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

watch([selectedProject, selectedDate], ([newProject, newDate]) => {
  fetchDayData(newProject, newDate);
}, { immediate: true });

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
  isDialogVisible.value = true;
};

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

const getEventColor = (event) => {
  if (event.status === '取消') return 'grey-lighten-2';
  if (event.bookingType.includes('初驗')) return 'blue-lighten-5';
  if (event.bookingType.includes('複驗')) return 'orange-lighten-5';
  return 'grey-lighten-4';
};

</script>

<style scoped>
.time-slot-item {
  min-height: 80px;
  align-items: flex-start;
}
.time-label {
  font-weight: bold;
  color: #555;
  width: 60px;
  text-align: center;
  padding-top: 8px;
}
.events-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
}
.event-chip {
  cursor: pointer;
  height: auto !important;
  padding: 6px 10px !important;
  white-space: normal;
  text-align: left;
}
.event-chip strong {
  font-size: 1.1em;
}
</style>