<template>
  <v-container fluid>
    <v-card class="pa-4">
      <v-card-title class="d-flex align-center justify-space-between text-h5 text-primary mb-4">
        {{ pageTitle }}
        <v-btn
          color="primary"
          @click="handleDownloadPdf"
          :loading="isDownloadingPdf"
          prepend-icon="mdi-download"
        >
          下載時間表 (PDF)
        </v-btn>
      </v-card-title>

      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        class="mb-4"
        :text="error"
      ></v-alert>

      <div v-if="isLoading" class="text-center pa-10">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <div class="mt-4">資料載入中...</div>
      </div>

      <div v-show="!isLoading && !error" id="calendar-container">
        <FullCalendar ref="fullCalendar" :options="calendarOptions" />
      </div>
    </v-card>

    <v-dialog v-model="isDialogVisible" max-width="800px">
    <v-card>
      <v-card-title class="text-h6 primary-bg">
        <v-icon start>mdi-calendar-text</v-icon>
        預約詳細資訊
      </v-card-title>
      <v-divider></v-divider>

      <v-card-text v-if="selectedEvent" class="py-4 px-5">
        
        <p class="text-subtitle-1 font-weight-bold mb-2">基本資料</p>
        <v-row dense>
          <v-col cols="12" sm="6" md="4">
            <div class="text-caption text-grey-darken-1">戶別</div>
            <div class="text-body-1">{{ selectedEvent['戶別'] }}</div>
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <div class="text-caption text-grey-darken-1">門牌</div>
            <div class="text-body-1">{{ selectedEvent['門牌'] }}</div>
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <div class="text-caption text-grey-darken-1">姓名</div>
            <div class="text-body-1">{{ selectedEvent['姓名'] }}</div>
          </v-col>
        </v-row>
        <v-divider class="my-4"></v-divider>

        <p class="text-subtitle-1 font-weight-bold mb-2">聯絡資訊</p>
        <v-row dense>
          <v-col cols="12" sm="6" md="4">
            <div class="text-caption text-grey-darken-1">電話</div>
            <div class="text-body-1">{{ selectedEvent['電話'] }}</div>
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <div class="text-caption text-grey-darken-1">EMAIL</div>
            <div class="text-body-1">{{ selectedEvent['EMAIL'] || 'N/A' }}</div>
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <div class="text-caption text-grey-darken-1">身分證</div>
            <div class="text-body-1">{{ selectedEvent['身分證'] }}</div>
          </v-col>
        </v-row>
        <v-divider class="my-4"></v-divider>
        
        <div v-if="selectedEvent['撥款日期']">
          <p class="text-subtitle-1 font-weight-bold mb-2">撥款資訊</p>
          <v-row dense>
            <v-col cols="12" sm="6" md="4">
              <div class="text-caption text-grey-darken-1">撥款日期</div>
              <div class="text-body-1">{{ format(new Date(selectedEvent['撥款日期']), 'yyyy-MM-dd') }}</div>
            </v-col>
            <v-col cols="12" sm="6" md="4">
              <div class="text-caption text-grey-darken-1">銀行</div>
              <div class="text-body-1">{{ selectedEvent['銀行'] }}</div>
            </v-col>
            <v-col cols="12" sm="6" md="4">
              <div class="text-caption text-grey-darken-1">銀行窗口</div>
              <div class="text-body-1">{{ selectedEvent['銀行窗口'] }}</div>
            </v-col>
          </v-row>
          <v-divider class="my-4"></v-divider>
        </div>

        <p class="text-subtitle-1 font-weight-bold mb-2">預約詳情</p>
        <v-row dense>
          <v-col cols="12" sm="6" md="4">
            <div class="text-caption text-grey-darken-1">預約項目</div>
            <div class="text-body-1">{{ selectedEvent['預約項目'] }}</div>
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <div class="text-caption text-grey-darken-1">預約日期</div>
            <div class="text-body-1">{{ selectedEvent['預約日期'] ? format(new Date(selectedEvent['預約日期']), 'yyyy-MM-dd') : 'N/A' }}</div>
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <div class="text-caption text-grey-darken-1">預約時段</div>
            <div class="text-body-1">{{ selectedEvent['預約時段'] }}</div>
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <div class="text-caption text-grey-darken-1">驗屋方式</div>
            <div class="text-body-1">{{ selectedEvent['驗屋方式'] }}</div>
          </v-col>
          <v-col v-if="selectedEvent['代驗公司名稱']" cols="12" sm="6" md="4">
            <div class="text-caption text-grey-darken-1">代驗公司</div>
            <div class="text-body-1">{{ selectedEvent['代驗公司名稱'] }}</div>
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <div class="text-caption text-grey-darken-1">預約狀態</div>
            <div><v-chip color="success" size="small">{{ selectedEvent['預約狀態'] }}</v-chip></div>
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <div class="text-caption text-grey-darken-1">填表時間</div>
            <div class="text-body-1">{{ selectedEvent['填表時間'] ? format(new Date(selectedEvent['填表時間']), 'yyyy-MM-dd HH:mm:ss') : 'N/A' }}</div>
          </v-col>
          <v-col v-if="selectedEvent['備註']" cols="12">
            <div class="text-caption text-grey-darken-1">備註</div>
            <div class="text-body-1">{{ selectedEvent['備註'] }}</div>
          </v-col>
        </v-row>
        <v-divider class="my-4"></v-divider>

        <div v-if="selectedEvent['委託人姓名']">
          <p class="text-subtitle-1 font-weight-bold mb-2">授權委託資料</p>
          <v-row dense>
            <v-col cols="12" sm="6" md="4">
              <div class="text-caption text-grey-darken-1">委託人姓名</div>
              <div class="text-body-1">{{ selectedEvent['委託人姓名'] }}</div>
            </v-col>
            <v-col cols="12" sm="6" md="4">
              <div class="text-caption text-grey-darken-1">委託人身分證</div>
              <div class="text-body-1">{{ selectedEvent['委託人身分證'] }}</div>
            </v-col>
             <v-col cols="12" sm="6" md="4">
              <div class="text-caption text-grey-darken-1">受託人姓名</div>
              <div class="text-body-1">{{ selectedEvent['受託人姓名'] }}</div>
            </v-col>
            <v-col cols="12" sm="6" md="4">
              <div class="text-caption text-grey-darken-1">受託人身分證</div>
              <div class="text-body-1">{{ selectedEvent['受託人身分證'] }}</div>
            </v-col>
            <v-col cols="12" sm="6" md="4">
              <div class="text-caption text-grey-darken-1">授權書</div>
              <div>
                <v-btn v-if="selectedEvent['驗屋授權書url']" color="primary" size="small" variant="tonal" @click="() => openUrl(selectedEvent['驗屋授權書url'])">
                  查看授權書
                </v-btn>
                <span v-else>未提供</span>
              </div>
            </v-col>
          </v-row>
        </div>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey-darken-1" variant="text" @click="isDialogVisible = false">關閉</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { fetchInspectionAppointments } from '@/api';
import { format } from 'date-fns';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- 響應式狀態定義 ---
const route = useRoute();
const isLoading = ref(true);
const error = ref(null);
const appointments = ref([]);
const fullCalendar = ref(null);
const isDialogVisible = ref(false);
const selectedEvent = ref(null);
const isDownloadingPdf = ref(false);

// --- 常數與計算屬性 ---
const PROJECT_NAME_MAP = {
  fuyu56: '富宇上城',
  fuyu1750: '富宇首馥',
};

const KEYWORD_COLOR_MAP = [
  { keyword: '已撥款', backgroundColor: '#ffc107', textColor: '#212529' },
  { keyword: '初驗', backgroundColor: '#d4edda', textColor: '#155724' },
  { keyword: '複驗', backgroundColor: '#f8d7da', textColor: '#721c24' },
];

const projectId = ref(route.params.projectId);
const projectName = computed(() => PROJECT_NAME_MAP[projectId.value] || '未知建案');
const pageTitle = computed(() => `${projectName.value} - 驗屋預約總表`);

const calendarEvents = computed(() => {
  return appointments.value
    .filter(appt => appt['預約狀態'] === '預約中')
    .map(appt => {
      try {
        const rawDateObject = new Date(appt['預約日期']);
        if (isNaN(rawDateObject.getTime())) throw new Error('無效的預約日期格式');
        
        const date = format(rawDateObject, 'yyyy-MM-dd');
        const timeSlot = appt['預約時段'] ? String(appt['預約時段']).replace(/：/g, ':') : '00:00';
        const times = timeSlot.split('-').map(t => t.trim());
        const startTime = times[0];
        const endTime = times.length > 1 ? times[1] : `${parseInt(startTime.split(':')[0]) + 1}:00`;
        const startDateTime = new Date(`${date}T${startTime}`);
        const endDateTime = new Date(`${date}T${endTime}`);

        const bookingDate = new Date(appt['預約日期']);
        const allocationDate = appt['撥款日期'] ? new Date(appt['撥款日期']) : null;
        let isAllocated = false;
        if (allocationDate && !isNaN(bookingDate.getTime()) && !isNaN(allocationDate.getTime())) {
            bookingDate.setHours(0, 0, 0, 0);
            allocationDate.setHours(0, 0, 0, 0);
            isAllocated = bookingDate.getTime() >= allocationDate.getTime();
        }
        
        let itemText = appt['預約項目'];
        let fullTextForSearch = itemText;
        if (isAllocated) {
            itemText += ' (已撥款)';
            fullTextForSearch += ' 已撥款';
        }
        
        let eventColors = {};
        for (const config of KEYWORD_COLOR_MAP) {
            if (fullTextForSearch.includes(config.keyword)) {
                eventColors = {
                    backgroundColor: config.backgroundColor,
                    borderColor: config.backgroundColor,
                    textColor: config.textColor
                };
                break;
            }
        }
        
        const extendedProps = { ...appt,displayText: itemText };

        return {
          id: `${appt['填表時間']}_${appt['戶別']}`,
          title: `${appt['戶別']} - ${itemText}`,
          start: startDateTime,
          end: endDateTime,
          allDay: false,
          extendedProps: extendedProps,
          ...eventColors
        };
      } catch (e) {
        console.warn(`處理預約資料時發生錯誤: ${e.message}`, appt);
        return null;
      }
    }).filter(event => event !== null);
});

// --- FullCalendar 設定 ---
const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
  initialView: 'dayGridMonth',
  locale: 'zh-tw',
  firstDay: 1,
  weekends: true,
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek,listDay'
  },
buttonText: { 
    today: '今天', 
    month: '月', 
    week: '週', 
    day: '日', 
    listWeek: '週列表', 
    listDay: '日列表' 
  },
    slotMinTime: '08:00:00',
  slotMaxTime: '18:00:00',
  events: [],
  eventClick: handleEventClick,
  height: '80vh',
  allDaySlot: false,
  
  slotLabelFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  },
  eventTimeFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  },
  
  eventContent: function(arg) {
    const props = arg.event.extendedProps;
    const itemText = props.displayText;
    let timeText = arg.timeText;
    let htmlContent = '';

    if (arg.view.type === 'dayGridMonth') {
      htmlContent = `
        <div class="fc-event-main-custom">
          <div class="fc-event-time">${timeText}</div>
          <div class="fc-event-title">${props['戶別']} ${itemText}</div>
        </div>
      `;
    } else if (arg.view.type === 'timeGridWeek') {
      htmlContent = `
        <div class="fc-event-main-custom">
          <div class="fc-event-title-full">${props['戶別']}</div>
          <div class="fc-event-title-full">${itemText}</div>
        </div>
      `;
    } else if (arg.view.type === 'timeGridDay') {
      const mainInfoParts = [
        props['戶別'],
        props['姓名'],
        props['預約項目'],
        props['驗屋方式'],
        props['代驗公司名稱']
      ].filter(Boolean);

      htmlContent = `
        <div class="fc-event-main-custom">
          <div class="fc-event-title-full">${mainInfoParts.join(' - ')}</div>
      `;
      if (props['備註']) {
        htmlContent += `<div class="fc-event-title-full">備註：${props['備註']}</div>`;
      }
      htmlContent += '</div>';

    } else {
       htmlContent = `
        <div class="fc-event-main-custom">
           <div class="fc-event-title-full"><b>${timeText}</b> ${props['戶別']} ${props['姓名']}</div>
           <div class="fc-event-title-full">${itemText}</div>
        </div>
      `;
    }
    
    return { html: htmlContent };
  }
});

// --- 方法與生命週期 ---

function handleEventClick(clickInfo) {
  selectedEvent.value = clickInfo.event.extendedProps;
  isDialogVisible.value = true;
}

async function handleDownloadPdf() {
  isDownloadingPdf.value = true;
  const calendarApi = fullCalendar.value.getApi();
  const calendarEl = document.getElementById('calendar-container');

  if (!calendarEl || !calendarApi) {
      isDownloadingPdf.value = false;
      return;
  }
  const originalWidth = calendarEl.style.width;
  try {
      calendarEl.style.width = '1200px';
      calendarApi.updateSize();
      await new Promise(resolve => setTimeout(resolve, 200));
      const canvas = await html2canvas(calendarEl, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a3');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
      while (heightLeft > 0) {
          position -= pdfHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
          heightLeft -= pdfHeight;
      }
      const fileName = `${projectName.value}_驗屋預約表_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);
  } catch(err) {
      console.error("PDF 產生失敗:", err);
      error.value = "產生 PDF 失敗，請稍後再試。";
  } finally {
      calendarEl.style.width = originalWidth;
      calendarApi.updateSize();
      isDownloadingPdf.value = false;
  }
}

function openUrl(url) {
    if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
}

async function fetchData() {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await fetchInspectionAppointments(projectName.value);
    if (response.status === 'success') {
      appointments.value = response.data;
    } else {
      throw new Error(response.message || '無法獲取預約資料');
    }
  } catch (err) {
    console.error('獲取預約資料失敗:', err);
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

watch(calendarEvents, (newEvents) => {
    calendarOptions.value.events = newEvents;
});

onMounted(() => {
  if (PROJECT_NAME_MAP[projectId.value]) {
    fetchData();
  } else {
    error.value = `無效的建案ID: ${projectId.value}`;
    isLoading.value = false;
  }
});
</script>

<style>
.fc .fc-button-primary {
 background-color: #1a73e8;
 border-color: #1a73e8;
}
.fc .fc-button-primary:hover {
 background-color: #1765c6;
 border-color: #1765c6;
}
.fc-event {
 cursor: pointer;
 font-size: 0.8rem;
 padding: 2px 4px;
}
.primary-bg {
  background-color: #1a73e8;
  color: white;
}
.fc-event-main-custom {
 overflow: hidden;
 text-overflow: ellipsis;
 white-space: nowrap;
}
.fc-event-main-custom .fc-event-time {
 font-weight: bold;
 margin-right: 5px;
}
.fc-event-main-custom .fc-event-title {
 display: inline;
 vertical-align: top;
}

/* 分別設定日、週視圖的高度 */
.fc-timeGridWeek-view .fc-timegrid-slot-lane {
 height: 4.5em;
}
.fc-timeGridDay-view .fc-timegrid-slot-lane {
 height: 2.5em;
}
/* ⭐ [核心修改] 最終版：指定外層容器滾動，並強制撐開日曆寬度 */

/* 1. 讓您自訂的 #calendar-container 容器負責水平滾動 */
#calendar-container {
  overflow-x: auto;
  overflow-y: hidden; 
}

/* 2. 強制將日曆的寬度撐開，使其內容寬度"超出" #calendar-container */
.fc-timeGridWeek-view .fc-scrollgrid,
.fc-timeGridDay-view .fc-scrollgrid {
  width: 2000px; 
}
</style>