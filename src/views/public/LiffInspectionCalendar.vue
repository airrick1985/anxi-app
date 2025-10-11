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
            <v-date-picker
              v-model="selectedDate"
              show-adjacent-months
              hide-header
              color="primary"
              width="100%"
              :disabled="!selectedProject || isFetchingDayData"
            ></v-date-picker>
            
            </v-col>
          
          <v-divider vertical class="d-none d-md-block"></v-divider>

          <v-col cols="12" md="8" class="pa-0">
             <v-toolbar density="compact" flat class="border-b">
                <v-toolbar-title class="text-subtitle-2">
                 {{ responsiveToolbarTitle }}
                </v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn icon="mdi-cog" @click="isFilterDialogVisible = true"></v-btn>
             </v-toolbar>
            
            <div class="calendar-content" style="max-height: 150vh; overflow-y: auto;">
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

    <AppointmentDetailsDialog
      v-model="isDialogVisible"
      :appointment="selectedAppointment"
    />

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
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, watch, defineAsyncComponent } from 'vue';
import liff from '@line/liff';
import { getLiffUserData, liffSearchAppointments, getLiffCalendarDataForDay } from '@/api';
import { useDate, useDisplay } from 'vuetify';
import { watchDebounced } from '@vueuse/core';
import { format, startOfDay } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { useRoute } from 'vue-router';
import AppointmentDetailsDialog from '@/components/AppointmentDetailsDialog.vue';

const { smAndDown } = useDisplay();

const FilterCheckboxes = defineAsyncComponent(() => import('@/components/LiffCalendarFilters.vue'));
const dateAdapter = useDate();

const isLoading = ref(true);
const loadingText = ref('正在初始化...');
const isBound = ref(false);
const userName = ref('');
const lineId = ref('');
const authorizedProjects = ref([]);
const selectedProject = ref(null);
const selectedDate = ref(startOfDay(new Date()));
const isFetchingDayData = ref(false);
const dailyAppointments = ref([]);
const searchQuery = ref('');
const isSearching = ref(false);
const isSearchActive = ref(false);
const searchResults = ref([]);
const lastSearchText = ref('');
const isDialogVisible = ref(false);
const selectedAppointment = ref(null);
const isFilterDialogVisible = ref(false);
const selectedStatuses = ref([]);
const selectedTypes = ref([]);
const selectedDisplayFields = ref([]);
const displayFieldOptions = ref([
  { key: 'unitId', label: '戶別' },
  { key: 'bookingType', label: '預約項目' },
  { key: 'bookerName', label: '預約人姓名' },
  { key: 'inspectionMethod', label: '驗屋方式' },
  { key: 'inspectionCompanyName', label: '代驗公司名稱' },
  { key: 'bookingRemarks', label: '預約備註' },
  { key: 'inspectors', label: '驗屋人員', formatter: (val) => val ? `【${val}】` : null },
]);

const initializeFilters = (options) => {
  selectedStatuses.value = options.statuses;
  selectedTypes.value = options.types;
  selectedDisplayFields.value = options.displayFields;
};

onMounted(async () => {
  try {
    loadingText.value = '正在與 LINE 連接...';
    await liff.init({ liffId: '2008257338-o8grV0ZD' });

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

const filteredAppointments = computed(() => {
  return dailyAppointments.value.filter(appt => 
    selectedStatuses.value.includes(appt.status) && 
    selectedTypes.value.includes(appt.bookingType)
  ).map(appt => ({
    ...appt,
    displayParts: selectedDisplayFields.value.map(key => {
      const value = appt[key];
      const formattedValue = (displayFieldOptions.value.find(o => o.key === key)?.formatter || ((v) => v))(value);
      return {
        text: formattedValue || '',
        isHousehold: key === 'unitId'
      };
    }).filter(part => part.text)
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
</style>