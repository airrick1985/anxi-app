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
  <span v-if="!isDownloadingPdf" class="btn-text">下載時間表</span>
  <span v-else class="btn-text">{{ pdfDownloadProgress }}</span>
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

      <div v-if="!isLoading && !error">
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
  
  <v-col cols="12" md="4">
    <v-text-field
      v-model="searchQuery"
      label="關鍵字搜尋 (戶別/姓名/電話...)"
      prepend-inner-icon="mdi-magnify"
      density="compact"
      hide-details
      clearable
      flat
      variant="solo-filled"
    ></v-text-field>
  </v-col>
  </v-row>
        
        <div id="custom-calendar-container">
          <div v-for="(chunk, index) in dateChunks" :key="index" class="mb-8 table-chunk">
            <h3 class="text-h6 mb-2">
              　 {{ projectName }} - 驗屋時間表: {{ format(chunk[0].dateObj, 'yyyy/MM/dd') }} - {{ format(chunk[chunk.length - 1].dateObj, 'yyyy/MM/dd') }}
            </h3>
            <v-table class="custom-calendar-table">
              <thead>
                <tr>
                  <th class="time-header" >時間</th>
                    <th v-for="day in chunk" :key="day.fullDate" class="day-header"
                          :class="{ 
                                    'today-column': day.isToday, 
                                    'weekend-column': day.isWeekend 
                             }">
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
    :class="['event-cell', { 
      'disabled-cell': !day.isInRange,
      'today-column': day.isToday,
      'weekend-column': day.isWeekend
    }]">
                    <div v-if="day.isInRange" class="event-cell-content">
                      <div v-if="groupedEvents[day.fullDate] && groupedEvents[day.fullDate][timeSlot]">
                        <div
                          v-for="event in groupedEvents[day.fullDate][timeSlot]"
                          :key="event.id"
                          class="event-item"
                          :style="getEventStyle(event)"
                          @click="handleCustomEventClick(event)"
                        >
                      <strong class="event-household">{{ event['戶別'] }}</strong> - {{ event.displayText }}                        </div>
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
    <v-card-title class="text-h6 primary-bg d-flex align-center">
      <v-icon start>mdi-calendar-text</v-icon>
      <span>預約詳細資訊</span>
      <v-spacer></v-spacer>
      <v-btn
        variant="text"
        icon="mdi-close"
        density="compact"
        @click="isDialogVisible = false"
      ></v-btn>
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
          <div class="text-caption text-grey-darken-1">車位</div>
          <div class="text-body-1">{{ selectedEvent['車位'] || '無' }}</div>
        </v-col>
      </v-row>
        <div v-if="selectedEvent['備註']">
        <v-divider class="my-4"></v-divider>
        <p class="text-subtitle-1 font-weight-bold mb-2">備註</p>
        <div class="remarks-text">{{ selectedEvent['備註'] }}</div>
      </div>
      <v-divider class="my-4"></v-divider>

      <p class="text-subtitle-1 font-weight-bold mb-2">聯絡資訊</p>
      <v-row dense>
        <v-col cols="12" sm="6" md="4">
          <div class="text-caption text-grey-darken-1">姓名</div>
          <div class="text-body-1">{{ selectedEvent['姓名'] }}</div>
        </v-col>
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
        </div>

      <p class="text-subtitle-1 font-weight-bold mb-2">預約詳情</p>
      <v-row dense>
        <v-col cols="12" sm="6" md="4">
          <div class="text-caption text-grey-darken-1">預約項目</div>
          <div>
            <span :style="getAppointmentItemStyle(selectedEvent['預約項目'])">
              {{ selectedEvent['預約項目'] }}
            </span>
          </div>
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
        <v-col v-if="selectedEvent['驗屋人員']" cols="12">
          <div class="text-caption text-grey-darken-1">驗屋人員</div>
          <div class="d-flex flex-wrap ga-2 mt-1">
            <v-chip
              v-for="(person, index) in selectedEvent['驗屋人員'].split(',').filter(p => p.trim())"
              :key="index"
              color="primary"
              variant="elevated"
              size="small"
            >
              <v-icon start icon="mdi-account"></v-icon>
              {{ person.trim() }}
            </v-chip>
          </div>
        </v-col>
      </v-row>
      <v-divider class="my-4"></v-divider>
      
      <div v-if="selectedEvent['委託人姓名']">
         </div>

      <p class="text-subtitle-1 font-weight-bold mb-2">相關文件</p>
      <v-row dense>
        <v-col cols="12" sm="6" md="4">
          <div class="text-caption text-grey-darken-1">驗屋文件</div>
          <div>
            <v-btn
              v-if="selectedEvent['驗屋文件']"
              color="primary"
              size="small"
              variant="tonal"
              prepend-icon="mdi-google-drive"
              @click="openUrl(selectedEvent['驗屋文件'])"
            >
              {{ selectedEvent['戶別'] }}文件
            </v-btn>
            <span v-else class="text-body-1">未提供</span>
          </div>
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <div class="text-caption text-grey-darken-1">驗屋報告</div>
          <div>
            <v-btn
              v-if="selectedEvent['驗屋報告']"
              color="red-darken-4"
              size="small"
              variant="tonal"
              prepend-icon="mdi-google-drive"
              @click="openUrl(selectedEvent['驗屋報告'])"
            >
              {{ selectedEvent['戶別'] }}報告
            </v-btn>
            <span v-else class="text-body-1">未提供</span>
          </div>
        </v-col>
      </v-row>

    

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
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { fetchInspectionAppointments } from '@/api';
import { format, startOfWeek, endOfWeek, addDays, isToday, isSaturday, isSunday } from 'date-fns';import { zhTW } from 'date-fns/locale';
// --- FullCalendar 相關引用已移除 ---
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- 響應式狀態定義 ---
const route = useRoute();
const isLoading = ref(true);
const error = ref(null);
const appointments = ref([]);
const isDialogVisible = ref(false);
const selectedEvent = ref(null);
const isDownloadingPdf = ref(false);
const pdfDownloadProgress = ref('');
const searchQuery = ref(''); 


// --- 日期範圍相關狀態 ---
const startDate = ref(startOfWeek(new Date(), { weekStartsOn: 1 }));
const endDate = ref(endOfWeek(new Date(), { weekStartsOn: 1 }));

// --- 常數與計算屬性 ---
const PROJECT_NAME_MAP = { fuyu56: '富宇上城', fuyu1750: '富宇首馥' };
const KEYWORD_COLOR_MAP = [
  { keyword: '已撥款', backgroundColor: '#ffc107', textColor: '#212529', borderColor: '#e0a800' }, // 稍深的黃色
  { keyword: '初驗', backgroundColor: '#d4edda', textColor: '#155724', borderColor: '#b1dfbb' }, // 稍深的綠色
  { keyword: '複驗', backgroundColor: '#f8d7da', textColor: '#721c24', borderColor: '#f1b0b7' }, // 稍深的紅色
];
const projectId = ref(route.params.projectId);
const projectName = computed(() => PROJECT_NAME_MAP[projectId.value] || '未知建案');
const pageTitle = computed(() => `${projectName.value} - 驗屋預約總表`);


const filteredAppointments = computed(() => {
  // 先執行 processAppointments，確保所有欄位 (包含合併來的) 都已存在
  const allProcessedAppointments = processAppointments(appointments.value);

  const query = searchQuery.value ? searchQuery.value.toLowerCase().trim() : '';
  if (!query) {
    // 如果沒有搜尋文字，回傳處理過的完整列表
    return allProcessedAppointments;
  }

  // 如果有搜尋文字，則過濾處理過的列表
  return allProcessedAppointments.filter(appt => {
    const fieldsToSearch = [
      appt['戶別'],
      appt['門牌'],
      appt['姓名'],
      appt['電話'],
      appt['預約項目'],
      appt['驗屋方式'],
      appt['代驗公司名稱'],
      appt['驗屋人員'],
      appt['備註'],
      appt['車位'],
      appt['銀行'],
      appt['銀行窗口']
    ];

    return fieldsToSearch.some(field => 
      field && String(field).toLowerCase().includes(query)
    );
  });
});


const foundDates = computed(() => {
  // 只有在有搜尋文字時才執行
  if (!searchQuery.value) return [];
  // 從過濾後的預約中，提取所有不重複的日期
  const dates = filteredAppointments.value.map(appt => format(appt.start, 'yyyy-MM-dd'));
  return [...new Set(dates)];
});

const dateChunks = computed(() => {
  const query = searchQuery.value ? searchQuery.value.trim() : '';

  // 判斷是否處於搜尋模式
  if (query && foundDates.value.length > 0) {
    // --- 搜尋模式 ---
    // 1. 取得所有包含搜尋結果的「週一」日期
    const startOfWeeks = [...new Set(foundDates.value.map(dateStr => {
      const date = new Date(dateStr);
      return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    }))].sort();

    // 2. 根據這些「週一」來產生週視圖區塊
    return startOfWeeks.map(weekStartStr => {
      const chunk = [];
      const current = new Date(weekStartStr);
      for (let i = 0; i < 7; i++) {
        const date = addDays(current, i);
        chunk.push({
          dateObj: date,
          dayName: format(date, 'EEEE', { locale: zhTW }),
          date: format(date, 'M/d'),
          fullDate: format(date, 'yyyy-MM-dd'),
          isInRange: true, // 在搜尋模式下，所有顯示的日期都視為在範圍內
          isToday: isToday(date),
          isWeekend: isSaturday(date) || isSunday(date)
        });
      }
      return chunk;
    });

  } else {
    // --- 正常模式 (無搜尋文字或無結果) ---
    if (!startDate.value || !endDate.value) return [];

    const chunks = [];
    let current = startOfWeek(new Date(startDate.value), { weekStartsOn: 1 });

    while (current <= endDate.value) {
      const chunk = [];
      for (let i = 0; i < 7; i++) {
        const date = addDays(current, i);
        const isInRange = date >= startDate.value && date <= endDate.value;
        chunk.push({
          dateObj: date,
          dayName: format(date, 'EEEE', { locale: zhTW }),
          date: format(date, 'M/d'),
          fullDate: format(date, 'yyyy-MM-dd'),
          isInRange: isInRange,
          isToday: isToday(date),
          isWeekend: isSaturday(date) || isSunday(date)
        });
      }
      chunks.push(chunk);
      current = addDays(current, 7);
    }
    return chunks;
  }
});


const startDateFormatted = computed({
  get: () => format(startDate.value, 'yyyy-MM-dd'),
  set: (val) => { 
    const [year, month, day] = val.split('-').map(Number);
    startDate.value = new Date(year, month - 1, day); 
  }
});
const endDateFormatted = computed({
  get: () => format(endDate.value, 'yyyy-MM-dd'),
  set: (val) => { 
    const [year, month, day] = val.split('-').map(Number);
    endDate.value = new Date(year, month - 1, day);
  }
});

const timeSlots = computed(() => {
    const slots = [];
    const min = 8;
    const max = 18;
    for (let i = min; i < max; i++) {
        slots.push(`${String(i).padStart(2, '0')}:00`);
    }
    return slots;
});

// --- 為 FullCalendar 準備的 calendarEvents 已移除 ---

const groupedEvents = computed(() => {
  const grouped = {};
const processed = filteredAppointments.value;
  processed.forEach(event => {
    const dateKey = format(event.start, 'yyyy-MM-dd');
    const timeKey = format(event.start, 'HH:00');
    if (!grouped[dateKey]) grouped[dateKey] = {};
    if (!grouped[dateKey][timeKey]) grouped[dateKey][timeKey] = [];
    grouped[dateKey][timeKey].push(event);
  });
  return grouped;
});

// --- FullCalendar 的 calendarOptions 物件已完全移除 ---

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

                const titleParts = [
                    appt['預約項目'],
                    appt['驗屋方式'],
                    appt['代驗公司名稱'],
                    appt['驗屋人員'] ? `(${appt['驗屋人員']})` : null 
                ].filter(Boolean);
                
                let itemText = titleParts.join(' - ');
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
      return {
        backgroundColor: config.backgroundColor,
        color: config.textColor,
        borderColor: config.borderColor, 
        borderWidth: '2px',
        borderStyle: 'solid'
      };
    }
  }
  
  // 預設樣式 
  return {
    backgroundColor: '#EEEEEE',
    color: '#212121',
    borderColor: '#E0E0E0',
    borderWidth: '2px',
    borderStyle: 'solid'
  };
}


function handleCustomEventClick(event) {
  selectedEvent.value = event;
  isDialogVisible.value = true;
}

async function handleDownloadPdf() {
  isDownloadingPdf.value = true;
  pdfDownloadProgress.value = '準備中...';

  const tableChunks = document.querySelectorAll('#custom-calendar-container .table-chunk');
  if (!tableChunks || tableChunks.length === 0) {
    isDownloadingPdf.value = false;
    pdfDownloadProgress.value = '';
    return;
  }

  const pdf = new jsPDF('landscape', 'mm', 'a4');
  
  // 您可以在這裡自由調整邊界大小，單位是 mm
  const margin = 5; 

  try {
    for (let i = 0; i < tableChunks.length; i++) {
      const element = tableChunks[i];
      pdfDownloadProgress.value = `正在產生第 ${i + 1} / ${tableChunks.length} 頁...`;
      
      const originalStyle = {
        width: element.style.width,
        height: element.style.height,
        position: element.style.position,
        left: element.style.left,
        top: element.style.top,
      };

      element.style.position = 'absolute';
      element.style.left = '0px';
      element.style.top = '0px';
      element.style.width = '3000px'; 
      element.style.height = 'auto';

      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      element.style.width = originalStyle.width;
      element.style.height = originalStyle.height;
      element.style.position = originalStyle.position;
      element.style.left = originalStyle.left;
      element.style.top = originalStyle.top;

      // 👇 這就是之前遺漏的關鍵行
      const imgData = canvas.toDataURL('image/png');

      const pdfPageWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      
      const imageWidth = pdfPageWidth - (margin * 2);
      const imageHeight = (imgProps.height * imageWidth) / imgProps.width;

      if (i > 0) {
        pdf.addPage();
      }
      
      pdf.addImage(imgData, 'PNG', margin, margin, imageWidth, imageHeight);
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

// --- downloadSingleElementPdf (FullCalendar用) 已移除 ---

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

// 請將此函式加入到 <script setup> 的方法區塊
function getAppointmentItemStyle(itemText) {
  if (!itemText) return {};
  const found = KEYWORD_COLOR_MAP.find(config => itemText.includes(config.keyword));
  if (found) {
    return {
      backgroundColor: found.backgroundColor,
      color: found.textColor,
      padding: '4px 10px',
      borderRadius: '16px', // 膠囊形狀
      fontSize: '0.875rem',
      fontWeight: 'bold',
      display: 'inline-block'
    };
  }
  // 如果不是關鍵字，也給一個預設樣式
  return {
    backgroundColor: '#E0E0E0', // 灰色
    color: '#212121',
    padding: '4px 10px',
    borderRadius: '16px',
    fontSize: '0.875rem',
    fontWeight: 'bold',
    display: 'inline-block'
  };
}

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
/* --- 全局樣式 --- */
.primary-bg { background-color: #1a73e8; color: white; }

/* --- 自訂週視圖樣式 (手動實現凍結版) --- */

:root {
  --day-column-width: 220px;
  --header-bg-color: #f5f5f5;
  --time-col-bg-color: #f9f9f9;
  --today-highlight-bg: #e3f2fd;
  --today-highlight-text: #1976d2;
  --weekend-bg-color: #fc6a6a;
  --border-color: #e0e0e0;
}

/* 1. 建立滾動容器 */
#custom-calendar-container {
  overflow: auto;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  max-height: 75vh; 
}

.custom-calendar-table {
  table-layout: fixed;
  border-collapse: collapse;
}

/* 基礎儲存格 */
.custom-calendar-table th, 
.custom-calendar-table td {
  border: 1px solid var(--border-color);
  padding: 4px;
}
.time-header, .time-cell, .day-header {
  vertical-align: middle;
  
}
.time-header, .time-cell {
  width: 100px;
  min-width: 100px;
  text-align: center;
  font-weight: bold;
}
.day-header, .event-cell {
  width: var(--day-column-width);
  min-width: var(--day-column-width);
}

/* --- 手動實現凍結窗格 --- */

/* 2. 凍結上方日期列 */
.custom-calendar-table thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background-color: var(--header-bg-color);
  box-shadow: 0 2px 5px -2px rgba(0,0,0,0.1);
}

/* 3. 凍結左側整個時間欄 */
.custom-calendar-table th:first-child,
.custom-calendar-table td:first-child {
  position: sticky;
  left: 0;
  z-index: 3;
  background-color: var(--time-col-bg-color);
  box-shadow: 2px 0 5px -2px rgba(0,0,0,0.1);
}

/* 4. 將左上角"時間"格的層級設為最高 */
.custom-calendar-table thead th:first-child {
  z-index: 4;
  box-shadow: 2px 2px 5px -2px rgba(0,0,0,0.15);
}

/* --- 視覺優化樣式 (維持不變) --- */
.event-cell {
  height: 120px;
  vertical-align: top;
}
.day-header.weekend-column {
  background-color: var(--weekend-bg-color) !important;
}
.day-header.today-column {
  background-color: var(--today-highlight-bg) !important;
}
.day-header.today-column div {
  color: var(--today-highlight-text);
  font-weight: 900;
}
.event-item {
  white-space: normal;
  word-wrap: break-word;
  padding: 4px 6px;
  margin-top: 4px;
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
  background-color: #f8f9fa;
}

/* --- 文字置中最終修正 --- */
/* 透過提高 CSS Selector 的優先級，強制覆蓋 Vuetify 的預設靠左對齊 */
.custom-calendar-table .time-header,
.custom-calendar-table .day-header {
  text-align: center !important;
}

.event-household {
  font-size: 1.2em; /* 讓字體比周圍文字大 10% */
}

/* 請將此段 CSS 加入到 <style> 區塊 */
.remarks-text {
  color: #C62828; /* 深紅色文字 */
  background-color: #FFEBEE; /* 淡紅色背景 */
  padding: 12px;
  border-radius: 4px;
  font-weight: 500;
  border-left: 5px solid #D32F2F; /* 左側加上紅色粗線，更醒目 */
  line-height: 1.6;
}

/* --- 手機版按鈕響應式優化 --- */
/* 當螢幕寬度小於 600px 時 (Vuetify 的 xs 尺寸) */
@media (max-width: 599px) {
  .btn-text {
    display: none; /* 隱藏按鈕內的文字 */
  }
}

</style>