<template>
  <v-layout class="fill-height bg-white">
    <v-navigation-drawer
      v-model="drawer"
      :permanent="$vuetify.display.mdAndUp"
      :temporary="$vuetify.display.smAndDown"
      width="320"
      border="right"
      class="pa-3"
    >
      <div class="text-subtitle-2 font-weight-bold mb-2 text-grey-darken-2">視圖切換</div>
      <v-list density="compact" nav class="pa-0 mb-2">
        <v-list-item 
          v-for="(label, view) in viewLabelMap" 
          :key="view"
          :active="currentView === view"
          color="primary"
          variant="tonal"
          @click="changeView(view); if($vuetify.display.xs) drawer = false"
          class="mb-1"
        >
          <template v-slot:prepend>
            <v-icon :icon="getViewIcon(view)" size="small"></v-icon>
          </template>
          <v-list-item-title class="font-weight-bold">{{ label }}</v-list-item-title>
        </v-list-item>
      </v-list>

      <div v-if="mdAndUp">
        <v-divider class="mb-4"></v-divider>
        <div class="text-subtitle-2 font-weight-bold mb-2 text-grey-darken-2">快速跳轉</div>
        <v-date-picker
          v-model="miniCalendarDate"
          hide-header
          flat
          density="compact"
          color="primary"
          class="border rounded-lg mb-6 calendar-mini"
          @update:model-value="syncCalendarDate"
        ></v-date-picker>
      </div>

      <v-divider class="mb-4"></v-divider>

      <div class="text-subtitle-2 font-weight-bold mb-2 text-grey-darken-2">預約類型</div>
      <v-checkbox v-model="filters.type" label="新客預約" value="新客" color="light-blue-darken-1" density="compact" hide-details></v-checkbox>
      <v-checkbox v-model="filters.type" label="回訪/其他" value="回訪" color="red-darken-1" density="compact" hide-details></v-checkbox>

      <v-divider class="my-4"></v-divider>

      <div class="text-subtitle-2 font-weight-bold mb-2 text-grey-darken-2 d-flex align-center">
        銷售人員 
        <v-chip size="x-small" class="ml-2" variant="tonal" @click="filters.salesNames = []">清除</v-chip>
      </div>
      <div style="max-height: 200px; overflow-y: auto;">
        <v-checkbox v-for="name in allSalesPeople" :key="name" v-model="filters.salesNames" :label="name || '未指派'" :value="name" color="primary" density="compact" hide-details></v-checkbox>
      </div>
    </v-navigation-drawer>

    <v-main class="d-flex flex-column fill-height">
      <v-toolbar v-if="$vuetify.display.xs" color="white" border="bottom" density="comfortable">
        <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
        <v-btn variant="text" @click="showMobileMiniCalendar = !showMobileMiniCalendar" class="text-h6 font-weight-bold px-2" color="primary">
          {{ currentTitle }}
          <v-icon right>{{ showMobileMiniCalendar ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-refresh" @click="fetchData"></v-btn>
      </v-toolbar>

      <v-toolbar v-else color="white" border="bottom" density="comfortable">
        <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
        <v-toolbar-title class="text-h6 font-weight-bold">{{ projectName }}</v-toolbar-title>
        <v-btn variant="outlined" class="ml-4" @click="goToday">今天</v-btn>
        <div class="d-flex align-center ml-2">
          <v-btn icon="mdi-chevron-left" variant="text" @click="goPrev"></v-btn>
          <v-btn icon="mdi-chevron-right" variant="text" @click="goNext"></v-btn>
        </div>
        <span class="text-h6 ml-2 font-weight-regular">{{ currentTitle }}</span>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-refresh" @click="fetchData"></v-btn>
      </v-toolbar>

      <v-expand-transition v-if="$vuetify.display.xs">
        <div v-show="showMobileMiniCalendar" class="bg-grey-lighten-5 border-b">
          <v-date-picker v-model="miniCalendarDate" hide-header flat density="compact" color="primary" class="w-100 calendar-mini" @update:model-value="onMobileDateSelect"></v-date-picker>
        </div>
      </v-expand-transition>

      <div 
        class="flex-grow-1 w-100 position-relative calendar-wrapper"
        :class="transitionClass"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
      >
        <FullCalendar ref="calendarRef" :options="calendarOptions" class="calendar-container" />
        <v-overlay :model-value="reservationStore.loading" contained class="align-center justify-center">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </v-overlay>
      </div>
    </v-main>

    <v-btn position="fixed" location="bottom right" icon="mdi-plus" color="primary" size="x-large" class="ma-6 elevation-8 fab-btn" @click="openAddDialog"></v-btn>

    <v-snackbar v-model="conflictWarning.show" color="warning" location="top" timeout="4000">
      <v-icon start>mdi-alert</v-icon>
      注意：{{ conflictWarning.time }} 該時段已有 {{ conflictWarning.count }} 筆預約，建議錯開時段。
    </v-snackbar>

    <ViewingReservationDialog v-model="showDialog" :projectId="projectId" :initialData="selectedReservation" :initialDate="selectedDate" @saved="fetchData" @deleted="fetchData" />
  </v-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
import { useReservationStore } from '@/store/reservationStore';
import { useDisplay } from 'vuetify';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import zhTwLocale from '@fullcalendar/core/locales/zh-tw';
import ViewingReservationDialog from '@/components/ViewingReservationDialog.vue';

const props = defineProps({ projectId: { type: String, required: true } });
const router = useRouter();
const userStore = useUserStore();
const projectStore = useProjectStore();
const reservationStore = useReservationStore();
const { xs, mdAndUp } = useDisplay();

const calendarRef = ref(null);
const drawer = ref(mdAndUp.value);
const showDialog = ref(false);
const showMobileMiniCalendar = ref(false); 
const selectedReservation = ref(null);
const selectedDate = ref(new Date());
const miniCalendarDate = ref(new Date());
const currentTitle = ref('');
const currentView = ref('dayGridMonth');

// ✅ [打勾] 動畫與觸控變數
const transitionClass = ref('');
let touchstartX = 0;
let touchstartY = 0;

const MAX_CONCURRENT_RESERVATIONS = 3;
const conflictWarning = ref({ show: false, count: 0, time: '' });
const filters = ref({ type: ['新客', '回訪'], salesNames: [] });
const viewLabelMap = { dayGridMonth: '月', timeGridWeek: '週', timeGridDay: '日', listWeek: '列表' };

const getViewIcon = (view) => {
    const icons = { dayGridMonth: 'mdi-calendar-month', timeGridWeek: 'mdi-calendar-week', timeGridDay: 'mdi-calendar', listWeek: 'mdi-format-list-bulleted' };
    return icons[view] || 'mdi-calendar';
};

const projectName = computed(() => projectStore.idToNameMap[props.projectId] || props.projectId);
const allSalesPeople = computed(() => {
    const names = reservationStore.activeReservations.map(res => res.salesName);
    return Array.from(new Set(names)).sort();
});

const calendarEvents = computed(() => {
    return reservationStore.activeReservations
        .filter(res => {
            const typeMatch = filters.value.type.includes(res.type);
            const salesMatch = filters.value.salesNames.length === 0 || filters.value.salesNames.includes(res.salesName);
            return typeMatch && salesMatch;
        })
        .map(res => {
            const start = res.reservationTime.toDate();
            return {
                id: res.id,
                title: `${res.customerName} (${res.salesName || '未定'})`,
                start: start,
                end: new Date(start.getTime() + 90 * 60000),
                backgroundColor: res.type === '新客' ? '#e1f5fe' : '#ffebee',
                borderColor: res.type === '新客' ? '#039be5' : '#e53935',
                textColor: res.type === '新客' ? '#01579b' : '#b71c1c',
                extendedProps: { ...res }
            };
        });
});

function getConflictCount(dateTime) {
    if (!dateTime) return 0;
    const checkTime = dateTime.getTime();
    return reservationStore.activeReservations.filter(res => {
        const resTime = res.reservationTime.toDate().getTime();
        return Math.abs(resTime - checkTime) / 60000 < 60;
    }).length;
}

const calendarOptions = ref({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
    initialView: xs.value ? 'timeGridDay' : 'dayGridMonth',
    locale: zhTwLocale,
    headerToolbar: false,
    height: '100%',
    events: calendarEvents,
    eventClick: handleEventClick,
    dateClick: handleDateClick,
    nowIndicator: true,
    slotMinTime: '08:00:00',
    slotMaxTime: '22:00:00',
    allDaySlot: false,
    dayMaxEvents: true,
    stickyHeaderDates: true,
    eventClassNames: 'google-style-event',
    datesSet: (info) => {
        currentTitle.value = info.view.title;
        currentView.value = info.view.type;
    }
});

// ✅ [打勾] 手勢處理與動畫邏輯
const handleTouchStart = (e) => {
    touchstartX = e.changedTouches[0].screenX;
    touchstartY = e.changedTouches[0].screenY;
};

const handleTouchEnd = (e) => {
    const touchendX = e.changedTouches[0].screenX;
    const touchendY = e.changedTouches[0].screenY;
    const dx = touchendX - touchstartX;
    const dy = touchendY - touchstartY;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 70) {
        if (dx > 0) {
            triggerTransition('prev');
        } else {
            triggerTransition('next');
        }
    }
};

const triggerTransition = (direction) => {
    transitionClass.value = direction === 'next' ? 'slide-next' : 'slide-prev';
    if (direction === 'next') goNext();
    else goPrev();
    
    setTimeout(() => {
        transitionClass.value = '';
    }, 300);
};

const syncCalendarDate = (date) => {
    const api = calendarRef.value.getApi();
    api.gotoDate(date);
    api.changeView('timeGridDay');
    currentView.value = 'timeGridDay';
};

const onMobileDateSelect = (date) => {
    syncCalendarDate(date);
    showMobileMiniCalendar.value = false;
};

const goToday = () => calendarRef.value.getApi().today();
const goPrev = () => calendarRef.value.getApi().prev();
const goNext = () => calendarRef.value.getApi().next();
const changeView = (view) => calendarRef.value.getApi().changeView(view);
const fetchData = () => reservationStore.fetchReservations(props.projectId);

onMounted(async () => {
    if (!userStore.isLoggedIn) {
        router.replace({ name: 'ViewingReservationEntry' });
        return;
    }
    await fetchData();
});

function handleEventClick(info) {
    const resDate = info.event.start;
    const count = getConflictCount(resDate);
    if (count > MAX_CONCURRENT_RESERVATIONS) {
        conflictWarning.value = { show: true, count, time: resDate.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) };
    }
    selectedReservation.value = info.event.extendedProps;
    showDialog.value = true;
}

function handleDateClick(info) {
    if (currentView.value === 'dayGridMonth') {
        syncCalendarDate(info.date);
        return;
    }
    const count = getConflictCount(info.date);
    if (count >= MAX_CONCURRENT_RESERVATIONS) {
        conflictWarning.value = { show: true, count, time: info.date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) };
    }
    selectedReservation.value = null;
    selectedDate.value = info.date;
    showDialog.value = true;
}

function openAddDialog() {
    selectedReservation.value = null;
    selectedDate.value = new Date();
    showDialog.value = true;
}
</script>

<style lang="scss" scoped>
/* ✅ [打勾] 封裝於 :deep(.fc) 確保手機版樣式生效 */
:deep(.fc.calendar-container) {
  font-family: 'Roboto', sans-serif;
  
  .fc-view-harness { background-color: #ffffff; }
  .fc-timegrid-slot, .fc-daygrid-day { border-color: #f1f3f4 !important; }

  .google-style-event {
    border-left-width: 4px !important;
    border-radius: 4px !important;
    font-size: 0.85rem !important;
    font-weight: 500 !important;
    cursor: pointer;
  }

  @media (max-width: 600px) {
    /* 週/日視圖頂部日期縮小 */
    .fc-col-header-cell .fc-col-header-cell-cushion {
      font-size: 0.7rem !important;
      padding: 2px 0 !important;
    }

    /* 左側時間軸縮小 */
    .fc-timegrid-slot-label-cushion {
      font-size: 0.65rem !important;
    }

    /* 月視圖優化 */
    .fc-view-dayGridMonth {
      .fc-event-time { display: none !important; }
      .fc-event-title {
        font-size: 10px !important;
        line-height: 1.1 !important;
      }
      .fc-daygrid-event {
        margin: 1px 0 !important;
        min-height: 14px !important;
      }
    }
  }
}

/* ✅ [打勾] 滑動動畫效果 */
.calendar-wrapper {
  transition: transform 0.3s ease-out, opacity 0.3s ease-out;
  &.slide-next {
    animation: slideNext 0.3s ease-out;
  }
  &.slide-prev {
    animation: slidePrev 0.3s ease-out;
  }
}

@keyframes slideNext {
  0% { transform: translateX(0); opacity: 1; }
  50% { transform: translateX(-20px); opacity: 0.6; }
  100% { transform: translateX(0); opacity: 1; }
}

@keyframes slidePrev {
  0% { transform: translateX(0); opacity: 1; }
  50% { transform: translateX(20px); opacity: 0.6; }
  100% { transform: translateX(0); opacity: 1; }
}

.calendar-mini {
  width: 100% !important;
  :deep(.v-btn--icon) { width: 32px !important; height: 32px !important; }
}

.fab-btn { z-index: 1000; transition: transform 0.2s; &:hover { transform: rotate(90deg); } }
</style>