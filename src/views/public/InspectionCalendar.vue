<template>
  <v-container fluid>
    <v-card class="pa-4">
      <v-card-title class="d-flex align-center justify-space-between text-h5 text-primary mb-4">
        {{ pageTitle }}
        <div class="d-flex align-center">
          <v-btn-toggle v-model="currentView" mandatory variant="outlined" density="compact" class="mr-4">
            <v-btn value="fullcalendar">標準日曆</v-btn>
            <v-btn value="customWeek">自訂週視圖</v-btn>
          </v-btn-toggle>

          <v-btn
            color="primary"
            @click="handleDownloadPdf"
            :loading="isDownloadingPdf"
            prepend-icon="mdi-download"
          >
            <span v-if="!isDownloadingPdf">下載時間表 (PDF)</span>
            <span v-else>{{ pdfDownloadProgress }}</span>
          </v-btn>
        </div>
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

      <div v-show="!isLoading && !error && currentView === 'fullcalendar'" id="calendar-container">
        <FullCalendar ref="fullCalendar" :options="calendarOptions" />
      </div>

      <div v-if="!isLoading && !error && currentView === 'customWeek'" >
        <v-row class="mb-4 align-center bg-grey-lighten-4 pa-3 rounded">
          <v-col cols="12" md="4">
             <v-text-field
                v-model="startDateFormatted"
                label="開始日期"
                type="date"
                density="compact"
                hide-details
              ></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
              <v-text-field
                v-model="endDateFormatted"
                label="結束日期"
                type="date"
                density="compact"
                hide-details
              ></v-text-field>
          </v-col>
     
        </v-row>
        
        <div id="custom-calendar-container">
            <div v-for="(chunk, index) in dateChunks" :key="index" class="mb-8 table-chunk">
                 <h3 class="text-h6 mb-2">
                    時間範圍: {{ format(chunk[0].dateObj, 'yyyy/MM/dd') }} - {{ format(chunk[chunk.length - 1].dateObj, 'yyyy/MM/dd') }}
                </h3>
<v-table fixed-header class="custom-calendar-table">
    <thead>
        <tr>
            <th class="time-header">時間</th>
            <th v-for="day in chunk" :key="day.fullDate" class="day-header">
                <div v-if="day.isInRange">
                    <div>{{ day.dayName }}</div>
                    <div>{{ day.date }}</div>
                </div>
            </th>
        </tr>
    </thead>
    <tbody>
        <tr v-for="timeSlot in timeSlots" :key="timeSlot">
            <td class="time-cell">{{ timeSlot }}</td>
            <td v-for="day in chunk" :key="day.fullDate" 
                :class="['event-cell', { 'disabled-cell': !day.isInRange }]">
                <div v-if="day.isInRange" class="event-cell-content">
                    <div v-if="groupedEvents[day.fullDate] && groupedEvents[day.fullDate][timeSlot]">
                        <div
                            v-for="event in groupedEvents[day.fullDate][timeSlot]"
                            :key="event.id"
                            class="event-item"
                            :style="getEventStyle(event)"
                            @click="handleCustomEventClick(event)"
                        >
                            {{ event['戶別'] }} - {{ event.displayText }}
                        </div>
                    </div>
                </div>
            </td>
        </tr>
    </tbody>
</v-table>
            </div>
        </div>
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
                 <v-col v-if="selectedEvent['驗屋人員']" cols="12">
                    <div class="text-caption text-grey-darken-1">驗屋人員</div>
                    <div class="text-body-1">{{ selectedEvent['驗屋人員'] }}</div>
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
import { format, startOfWeek, endOfWeek, addDays, subDays, differenceInDays } from 'date-fns';
import { zhTW } from 'date-fns/locale';
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
const currentView = ref('fullcalendar');

// --- ✅ [新功能] 日期範圍相關狀態 ---
const startDate = ref(startOfWeek(new Date(), { weekStartsOn: 1 }));
const endDate = ref(endOfWeek(new Date(), { weekStartsOn: 1 }));
const pdfDownloadProgress = ref('');

// --- 常數與計算屬性 ---
const PROJECT_NAME_MAP = { fuyu56: '富宇上城', fuyu1750: '富宇首馥' };
const KEYWORD_COLOR_MAP = [
  { keyword: '已撥款', backgroundColor: '#ffc107', textColor: '#212529' },
  { keyword: '初驗', backgroundColor: '#d4edda', textColor: '#155724' },
  { keyword: '複驗', backgroundColor: '#f8d7da', textColor: '#721c24' },
];
const projectId = ref(route.params.projectId);
const projectName = computed(() => PROJECT_NAME_MAP[projectId.value] || '未知建案');
const pageTitle = computed(() => `${projectName.value} - 驗屋預約總表`);

const dateChunks = computed(() => {
    if (!startDate.value || !endDate.value) return [];
    
    const chunks = [];
    // ✅ 核心修改 3: 從選定範圍的第一天的「週一」開始計算
    let current = startOfWeek(new Date(startDate.value), { weekStartsOn: 1 });

    // 迴圈的結束條件是當週的週一已經超過了結束日期
    while (current <= endDate.value) {
        const chunk = [];
        for (let i = 0; i < 7; i++) {
            const date = addDays(current, i);
            // 判斷這一天是否在使用者選擇的範圍內
            const isInRange = date >= startDate.value && date <= endDate.value;
            chunk.push({
                dateObj: date,
                dayName: format(date, 'EEEE', { locale: zhTW }),
                date: format(date, 'M/d'),
                fullDate: format(date, 'yyyy-MM-dd'),
                isInRange: isInRange // 增加一個狀態旗標
            });
        }
        chunks.push(chunk);
        current = addDays(current, 7);
    }
    return chunks;
});

// ✅ [新功能] 為 v-text-field[type=date] 綁定計算屬性
const startDateFormatted = computed({
  get: () => format(startDate.value, 'yyyy-MM-dd'),
  set: (val) => { startDate.value = new Date(val); }
});
const endDateFormatted = computed({
  get: () => format(endDate.value, 'yyyy-MM-dd'),
  set: (val) => { endDate.value = new Date(val); }
});

// 產生時間軸 (維持不變)
const timeSlots = computed(() => {
    const slots = [];
    const min = 8; // 08:00
    const max = 18; // 18:00
    for (let i = min; i < max; i++) {
        slots.push(`${String(i).padStart(2, '0')}:00`);
    }
    return slots;
});

// 組合好的事件，用於 FullCalendar
const calendarEvents = computed(() => {
  return processAppointments(appointments.value).map(event => ({
    id: event.id,
    title: `${event['戶別']} - ${event.displayText}`,
    start: event.start,
    end: event.end,
    allDay: false,
    extendedProps: event,
    ...getEventStyle(event)
  }));
});

// 將事件分組，用於自訂表格視圖
const groupedEvents = computed(() => {
  const grouped = {};
  const processed = processAppointments(appointments.value);
  processed.forEach(event => {
    const dateKey = format(event.start, 'yyyy-MM-dd');
    const timeKey = format(event.start, 'HH:00');
    if (!grouped[dateKey]) grouped[dateKey] = {};
    if (!grouped[dateKey][timeKey]) grouped[dateKey][timeKey] = [];
    grouped[dateKey][timeKey].push(event);
  });
  return grouped;
});


// --- FullCalendar 設定 (維持不變) ---
const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
  initialView: 'dayGridMonth', locale: 'zh-tw', firstDay: 1, weekends: true,
  headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek,listDay' },
  buttonText: { today: '今天', month: '月', week: '週', day: '日', listWeek: '週列表', listDay: '日列表' },
  slotMinTime: '08:00:00', slotMaxTime: '18:00:00', events: [],
  eventClick: handleEventClick, height: '80vh', allDaySlot: false,
  slotLabelFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
  eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
  eventContent: (arg) => { /* ... 內容不變 ... */ 
    const props = arg.event.extendedProps;
    const itemText = props.displayText;
    let timeText = arg.timeText;
    let htmlContent = '';
    if (arg.view.type === 'dayGridMonth') {
      htmlContent = `<div class="fc-event-main-custom"><div class="fc-event-time">${timeText}</div> <div class="fc-event-title">${props['戶別']} ${itemText}</div></div>`;
    } else if (arg.view.type === 'timeGridWeek') {
      htmlContent = `<div class="fc-event-main-custom"><div class="fc-event-title-full">${props['戶別']}</div><div class="fc-event-title-full">${itemText}</div></div>`;
    } else if (arg.view.type === 'timeGridDay') {
      const mainInfoParts = [ props['戶別'], props['姓名'], props['預約項目'], props['驗屋方式'], props['代驗公司名稱']].filter(Boolean);
      htmlContent = `<div class="fc-event-main-custom"><div class="fc-event-title-full">${mainInfoParts.join(' - ')}</div>`;
      if (props['備註']) { htmlContent += `<div class="fc-event-title-full">備註：${props['備註']}</div>`; }
      htmlContent += '</div>';
    } else {
      htmlContent = `<div class="fc-event-main-custom"><div class="fc-event-title-full"><b>${timeText}</b> ${props['戶別']} ${props['姓名']}</div><div class="fc-event-title-full">${itemText}</div></div>`;
    }
    return { html: htmlContent };
  }
});

// --- 方法 ---

function processAppointments(rawAppointments) {
    return rawAppointments
        .filter(appt => appt['預約狀態'] === '預約中')
        .map(appt => {
            try {
                const rawDateObject = new Date(appt['預約日期']);
                if (isNaN(rawDateObject.getTime())) throw new Error('無效的預約日期格式');
                const date = format(rawDateObject, 'yyyy-MM-dd');
                const timeSlot = appt['預約時段'] ? String(appt['預約時段']).replace(/：/g, ':') : '00:00';
                const times = timeSlot.split('-').map(t => t.trim());
                const startTime = times[0];
                const endTime = times.length > 1 ? times[1] : `${String(parseInt(startTime.split(':')[0]) + 1).padStart(2, '0')}:00`;
                const bookingDate = new Date(appt['預約日期']);
                const allocationDate = appt['撥款日期'] ? new Date(appt['撥款日期']) : null;
                let isAllocated = false;
                if (allocationDate && !isNaN(bookingDate.getTime()) && !isNaN(allocationDate.getTime())) {
                    bookingDate.setHours(0, 0, 0, 0);
                    allocationDate.setHours(0, 0, 0, 0);
                    isAllocated = bookingDate.getTime() >= allocationDate.getTime();
                }
                 // 組合事件標題文字
                const titleParts = [
                    appt['預約項目'],
                    appt['驗屋方式'],
                    appt['代驗公司名稱'],
                    // 如果有驗屋人員，就加上括號
                    appt['驗屋人員'] ? `(${appt['驗屋人員']})` : null 
                ].filter(Boolean); // 過濾掉 null 或空字串的項目
                
                let itemText = titleParts.join(' - '); // 用 ' - ' 連接
                let fullTextForSearch = itemText;
                if (isAllocated) {
                    itemText += ' (已撥款)';
                    fullTextForSearch += ' 已撥款';
                }
                return { ...appt, id: `${appt['填表時間']}_${appt['戶別']}`, start: new Date(`${date}T${startTime}`), end: new Date(`${date}T${endTime}`), displayText: itemText, fullTextForSearch: fullTextForSearch };
            } catch (e) {
                console.warn(`處理預約資料時發生錯誤: ${e.message}`, appt);
                return null;
            }
        }).filter(event => event !== null);
}

function getEventStyle(event) {
    for (const config of KEYWORD_COLOR_MAP) {
        if (event.fullTextForSearch.includes(config.keyword)) {
            return { backgroundColor: config.backgroundColor, color: config.textColor, borderColor: config.backgroundColor };
        }
    }
    return {};
}

function handleEventClick(clickInfo) {
  selectedEvent.value = clickInfo.event.extendedProps;
  isDialogVisible.value = true;
}

function handleCustomEventClick(event) {
  selectedEvent.value = event;
  isDialogVisible.value = true;
}

// ✅ [新功能] 套用日期範圍 (此函式是為了確保響應性，實際上計算屬性已處理)
function applyDateRange() {
  // 觸發響應式更新
  startDate.value = new Date(startDate.value);
  endDate.value = new Date(endDate.value);
}


// ✅ [核心修改] 全新優化的 PDF 下載邏輯
async function handleDownloadPdf() {
  isDownloadingPdf.value = true;
  pdfDownloadProgress.value = '準備中...';

  // 根據當前視圖選擇要列印的容器ID
  const containerId = currentView.value === 'fullcalendar' ? 'calendar-container' : 'custom-calendar-container';
  
  // 如果是標準日曆，使用單頁下載邏輯
  if (currentView.value === 'fullcalendar') {
    await downloadSingleElementPdf(containerId);
    isDownloadingPdf.value = false;
    pdfDownloadProgress.value = '';
    return;
  }

  // 如果是自訂視圖，使用新的多頁下載邏輯
  const tableChunks = document.querySelectorAll('#custom-calendar-container .table-chunk');
  if (!tableChunks || tableChunks.length === 0) {
    isDownloadingPdf.value = false;
    pdfDownloadProgress.value = '';
    return;
  }

  const pdf = new jsPDF('landscape', 'mm', 'a4');

  try {
    for (let i = 0; i < tableChunks.length; i++) {
      const element = tableChunks[i];
      pdfDownloadProgress.value = `正在產生第 ${i + 1} / ${tableChunks.length} 頁...`;
      
      // 儲存原始樣式
      const originalStyle = {
        width: element.style.width,
        height: element.style.height,
        position: element.style.position,
        left: element.style.left,
        top: element.style.top,
      };

      // 為了完整擷取，暫時將元素移到左上角並給予超大寬度
      element.style.position = 'absolute';
      element.style.left = '0px';
      element.style.top = '0px';
      element.style.width = '3000px'; 
      element.style.height = 'auto';

      await new Promise(resolve => setTimeout(resolve, 100)); // 等待DOM渲染

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        // 關鍵：讓 canvas 根據內容的實際寬度來決定大小
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      // 擷取完畢後立刻恢復原始樣式
      element.style.width = originalStyle.width;
      element.style.height = originalStyle.height;
      element.style.position = originalStyle.position;
      element.style.left = originalStyle.left;
      element.style.top = originalStyle.top;

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      if (i > 0) {
        pdf.addPage();
      }
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
    }
    
    const fileName = `${projectName.value}_驗屋預約表_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    pdf.save(fileName);

  } catch (err) {
      console.error("PDF 產生失敗:", err);
      error.value = "產生 PDF 失敗，請稍後再試。";
  } finally {
      isDownloadingPdf.value = false;
      pdfDownloadProgress.value = '';
  }
}

// 單頁下載邏輯也一併優化
async function downloadSingleElementPdf(elementId) {
    const elementToPrint = document.getElementById(elementId);
    if (!elementToPrint) return;
    
    const originalStyle = { width: elementToPrint.style.width, height: elementToPrint.style.height };
    try {
        // 同樣給予超大寬度以確保擷取完整
        elementToPrint.style.width = '3000px';
        elementToPrint.style.height = 'auto';

        if (fullCalendar.value) { fullCalendar.value.getApi().updateSize(); }
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const canvas = await html2canvas(elementToPrint, { 
            scale: 2, 
            useCORS: true, 
            width: elementToPrint.scrollWidth, 
            height: elementToPrint.scrollHeight 
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('landscape', 'mm', 'a3');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        let heightLeft = imgHeight, position = 0;
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
        
        while (heightLeft > 0) {
            position -= pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;
        }
        pdf.save(`${projectName.value}_驗屋預約表_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch(err) {
      console.error("PDF 產生失敗:", err);
      error.value = "產生 PDF 失敗，請稍後再試。"
    } finally {
        elementToPrint.style.width = originalStyle.width;
        elementToPrint.style.height = originalStyle.height;
        if (fullCalendar.value) { fullCalendar.value.getApi().updateSize(); }
    }
}


function openUrl(url) {
  if (url) window.open(url, '_blank', 'noopener,noreferrer');
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
  if (fullCalendar.value) calendarOptions.value.events = newEvents;
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
/* 原始樣式 (標準日曆) */
.fc .fc-button-primary { background-color: #1a73e8; border-color: #1a73e8; }
.fc .fc-button-primary:hover { background-color: #1765c6; border-color: #1765c6; }
.fc-event { cursor: pointer; font-size: 0.8rem; padding: 2px 4px; }
.primary-bg { background-color: #1a73e8; color: white; }
.fc-event-main-custom { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fc-event-main-custom .fc-event-time { font-weight: bold; margin-right: 5px; }
.fc-event-main-custom .fc-event-title { display: inline; vertical-align: top; }
.fc-timeGridWeek-view .fc-timegrid-slot-lane { height: 4.5em; }
.fc-timeGridDay-view .fc-timegrid-slot-lane { height: 2.5em; }
#calendar-container { overflow-x: auto; overflow-y: hidden; }
.fc-timeGridWeek-view .fc-scrollgrid, .fc-timeGridDay-view .fc-scrollgrid { width: 2000px; }

/* --- ✅ 全新、最終版的自訂週視圖樣式 --- */

/* 1. 在這裡調整寬度 */
:root {
  --day-column-width: 220px;  /* ⭐ 在這裡調整每日欄位的寬度 ⭐ */
}

/* 2. 容器：負責產生滾動條 */
#custom-calendar-container {
  overflow-x: auto;
  border: 1px solid #e0e0e8;
  border-radius: 4px;
}

/* 3. 表格：寬度由內容決定，不再設定 100% */
.custom-calendar-table {
  table-layout: fixed;
  border-collapse: collapse;
}

/* 4. 表頭與儲存格 */
.custom-calendar-table th, 
.custom-calendar-table td {
  border: 1px solid #e0e0e0;
  vertical-align: top;
  padding: 4px;
}

.time-header, .time-cell {
  width: 100px; /* 固定時間欄寬度 */
  min-width: 100px; /* 確保最小寬度 */
}

.day-header, .event-cell {
  width: var(--day-column-width); /* ⭐ 直接使用變數設定固定寬度 */
  min-width: var(--day-column-width); /* 確保最小寬度 */
}

.time-header, .day-header {
  text-align: center;
  background-color: #f5f5f5;
  font-weight: bold;
}
.day-header div:last-child {
  font-size: 0.9em;
  font-weight: normal;
}
.time-cell {
  text-align: center;
  font-weight: bold;
  font-size: 0.9em;
  background-color: #f9f9f9;
}

.event-cell {
  height: 120px;
}

/* 5. 事件項目：負責換行 */
.event-item {
  white-space: normal;
  word-wrap: break-word; /* 允許長單字換行 */
  padding: 4px 6px;
  margin-bottom: 4px;
  border-radius: 4px;
  font-size: 0.85em;
  cursor: pointer;
  transition: opacity 0.2s;
}
.event-item:hover {
  opacity: 0.8;
}
.table-chunk {
  page-break-inside: avoid;
}

.disabled-cell {
  background-color: #fafafa; /* 給予一個淺灰色背景 */
}

</style>