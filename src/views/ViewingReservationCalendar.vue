<template>
  <v-container fluid class="fill-height bg-white pa-0 d-flex flex-column">
    <v-toolbar density="compact" color="white" elevation="1">
      <v-btn icon="mdi-arrow-left" variant="text" @click="goBack"></v-btn>
      <v-toolbar-title class="text-subtitle-1 font-weight-bold">
        {{ projectName }} - 賞屋預約
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon="mdi-refresh" @click="fetchData"></v-btn>
    </v-toolbar>

    <div class="flex-grow-1 w-100 position-relative">
      <FullCalendar 
        ref="calendarRef"
        :options="calendarOptions" 
        class="fill-height"
      />
      
      <v-overlay :model-value="reservationStore.loading" contained class="align-center justify-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-overlay>
    </div>

    <v-btn
        position="fixed"
        location="bottom right"
        icon="mdi-plus"
        color="secondary"
        size="large"
        class="ma-4 mb-6 elevation-4"
        style="z-index: 100;"
        @click="openAddDialog"
    ></v-btn>

    <ViewingReservationDialog
        v-model="showDialog"
        :projectId="projectId"
        :initialData="selectedReservation"
        :initialDate="selectedDate" 
        @saved="fetchData"
        @deleted="fetchData"
    />

  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
import { useReservationStore } from '@/store/reservationStore';

// FullCalendar Imports
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import zhTwLocale from '@fullcalendar/core/locales/zh-tw';

import ViewingReservationDialog from '@/components/ViewingReservationDialog.vue';

const props = defineProps({
  projectId: { type: String, required: true }
});

const router = useRouter();
const userStore = useUserStore();
const projectStore = useProjectStore();
const reservationStore = useReservationStore();

const calendarRef = ref(null);
const showDialog = ref(false);
const selectedReservation = ref(null);
const selectedDate = ref(new Date()); // ✅ [新增] 暫存選取的日期

// 取得建案名稱
const projectName = computed(() => projectStore.idToNameMap[props.projectId] || props.projectId);

// 轉換 Firestore 資料為 Calendar Events
const calendarEvents = computed(() => {
    return reservationStore.activeReservations.map(res => {
        // 計算結束時間 (預設賞屋 1.5 小時，僅供顯示用)
        const start = res.reservationTime.toDate();
        const end = new Date(start.getTime() + 90 * 60000); 

        return {
            id: res.id,
            title: `[${res.type}] ${res.customerName} (${res.salesName || '未定'})`,
            start: start,
            end: end,
            // 根據類型給不同顏色
            backgroundColor: res.type === '新客' ? 'light-blue' : 'red',
            borderColor: res.type === '新客' ? 'light-blue' : 'red',
            extendedProps: { ...res }
        };
    });
});

// Calendar 設定
const calendarOptions = ref({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
    initialView: 'dayGridMonth', // 手機上可能需要改為 listWeek 或 timeGridDay
    locale: zhTwLocale,
   headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        // ✅ [修改] 在 right 加入 'timeGridDay'
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' 
    },
    
    buttonText: {
        today: '今天',
        month: '月',
        week: '週',
        day: '日',     // ✅ [新增] 日視圖按鈕文字
        list: '列表'
    },
    height: '100%',
    events: calendarEvents, // 綁定 computed
    eventClick: handleEventClick,
    dateClick: handleDateClick,
    nowIndicator: true,
    slotMinTime: '08:00:00',
    slotMaxTime: '23:00:00',
    allDaySlot: false,
    slotDuration: '00:30:00',
});

onMounted(async () => {
    // 安全檢查 (Phase 1 已做，這裡再次確保)
    if (!userStore.isLoggedIn) {
        router.replace({ name: 'ViewingReservationEntry' });
        return;
    }
    // 載入資料
    await fetchData();
});

async function fetchData() {
    await reservationStore.fetchReservations(props.projectId);
}

function handleEventClick(info) {
    // 點擊事件 -> 編輯
    selectedReservation.value = info.event.extendedProps;
    showDialog.value = true;
}

function handleDateClick(info) {
    selectedReservation.value = null; // 設定為新增模式
    selectedDate.value = info.date;   // 捕捉點擊的日期/時間
    showDialog.value = true;          // 開啟視窗
}

// ✅ [修改] FAB 按鈕點擊 (右下角懸浮按鈕)
function openAddDialog() {
    selectedReservation.value = null;
    selectedDate.value = new Date();  // 若按鈕新增，預設為「現在」
    showDialog.value = true;
}

const goBack = () => {
    router.push({ name: 'ViewingReservationEntry' });
};
</script>

<style>
/* FullCalendar 自訂樣式微調 */
.fc .fc-toolbar-title {
    font-size: 1.1rem !important;
}
.fc .fc-button {
    font-size: 0.8rem !important;
}
/* 讓行事曆填滿容器 */
.fc {
    height: 100%;
    background-color: white;
}
</style>