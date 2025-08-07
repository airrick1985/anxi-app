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
                        <strong class="event-household">{{ event['戶別'] }}</strong> - {{ event.displayText }}
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

    <v-snackbar v-model="snackbar" :timeout="2000" color="success">
      {{ snackbarText }}
    </v-snackbar>

    <v-dialog v-model="isDialogVisible" max-width="800px" persistent>
      <v-card v-if="selectedEvent">
        <v-card-title class="text-h6 primary-bg d-flex align-center">
          <v-icon start>mdi-calendar-text</v-icon>
          <span>預約詳細資訊</span>
          <v-spacer></v-spacer>
          <v-btn variant="text" icon="mdi-close" density="compact" @click="isDialogVisible = false"></v-btn>
        </v-card-title>
        
        <template v-if="!isEditMode">
          <v-card-text class="bg-grey-lighten-5 pa-4">
            <v-row align="center">
              <v-col cols="12" sm="4">
                <div class="text-caption text-grey-darken-1">戶別</div>
                <div class="text-h5 font-weight-bold text-primary">{{ selectedEvent['戶別'] }}</div>
              </v-col>
              <v-col cols="12" sm="4">
                <div class="text-caption text-grey-darken-1">預約日期與時段</div>
                <div class="text-body-1 font-weight-medium">
                  {{ selectedEvent['預約日期'] ? format(new Date(selectedEvent['預約日期']), 'yyyy-MM-dd') : '' }}
                  {{ selectedEvent['預約時段'] }}
                </div>
              </v-col>
              <v-col cols="12" sm="4" class="d-flex flex-wrap ga-2">
                 <v-chip :style="getAppointmentItemStyle(selectedEvent['預約項目'])" size="small" label>
                    {{ selectedEvent['預約項目'] }}
                 </v-chip>
                 <v-chip color="success" size="small" label>
                    <v-icon start icon="mdi-check-circle-outline"></v-icon>
                    {{ selectedEvent['預約狀態'] }}
                 </v-chip>
              </v-col>
            </v-row>
          </v-card-text>
          <v-divider></v-divider>

          <v-card-text class="pa-0">
            <v-expansion-panels v-model="panels" multiple variant="accordion">
              <v-expansion-panel v-for="group in projectFieldConfig" :key="group.title">
                <v-expansion-panel-title class="font-weight-bold">{{ group.title }}</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-list lines="two" density="compact">
                    <template v-for="(field, index) in group.fields" :key="field.key">
                       <div v-if="field.type === 'remark' && selectedEvent[field.key]" class="remarks-text ma-2 pa-3">
                         <p class="font-weight-bold mb-1">{{ field.label }}</p>
                         {{ selectedEvent[field.key] }}
                      </div>

                       <v-list-item v-else-if="field.type === 'chips'">
                        <template v-slot:prepend><v-icon :icon="field.icon"></v-icon></template>
                        <v-list-item-title class="font-weight-medium">{{ field.label }}</v-list-item-title>
                        <v-list-item-subtitle>
                          <div v-if="selectedEvent[field.key]" class="d-flex flex-wrap ga-1 mt-1">
                             <v-chip v-for="item in String(selectedEvent[field.key]).split(',').filter(i=>i.trim())" :key="item" size="small" color="primary" variant="elevated">
                                {{ item.trim() }}
                             </v-chip>
                          </div>
                          <span v-else>無</span>
                        </v-list-item-subtitle>
                      </v-list-item>

                       <v-list-item v-else-if="field.type !== 'remark'">
                        <template v-slot:prepend><v-icon :icon="field.icon"></v-icon></template>
                        <v-list-item-subtitle>{{ field.label }}</v-list-item-subtitle>
                        
                        <v-list-item-title>
                           <template v-if="field.type === 'button'">
                              <v-btn v-if="selectedEvent[field.key]" :color="field.key === '驗屋報告' ? 'red-darken-4' : 'primary'" size="small" variant="tonal" @click="openUrl(selectedEvent[field.key])">
                                 <v-icon start icon="mdi-launch"></v-icon>
                                 開啟{{ field.label }}
                              </v-btn>
                              <span v-else>未提供</span>
                           </template>
                           <template v-else-if="(field.type === 'date' || field.type === 'datetime') && selectedEvent[field.key]">
                              {{ format(new Date(selectedEvent[field.key]), field.type === 'date' ? 'yyyy-MM-dd' : 'yyyy-MM-dd HH:mm:ss') }}
                           </template>
                           <template v-else>
                              {{ selectedEvent[field.key] || '無' }}
                           </template>
                        </v-list-item-title>

                        <template v-if="field.copyable && selectedEvent[field.key]" v-slot:append>
                           <v-btn icon="mdi-content-copy" variant="text" size="x-small" @click="handleCopy(selectedEvent[field.key])"></v-btn>
                        </template>
                      </v-list-item>
                      <v-divider v-if="index < group.fields.length -1"></v-divider>
                    </template>
                  </v-list>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </template>
        
        <v-card-text v-else-if="editableEvent" class="py-4 px-5">
           <v-alert v-if="error" type="error" density="compact" class="mb-4">{{ error }}</v-alert>
          
          <p class="text-subtitle-1 font-weight-bold mb-2">聯絡資訊</p>
          <v-row dense>
            <v-col cols="12" md="6"><v-text-field v-model="editableEvent['姓名']" label="姓名" density="default"></v-text-field></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="editableEvent['電話']" label="電話" density="default"></v-text-field></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="editableEvent['EMAIL']" label="EMAIL" density="default"></v-text-field></v-col>
          </v-row>
          
          <v-divider class="my-4"></v-divider>
          
          <p class="text-subtitle-1 font-weight-bold mb-2">預約詳情</p>
          <v-row dense>
            <v-col cols="12" md="6"><v-text-field v-model="editableEvent['預約日期']" label="預約日期" type="date" density="default"></v-text-field></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="editableEvent['預約時段']" label="預約時段" density="default" hint="格式範例: 09:00-10:00"></v-text-field></v-col>
            <v-col cols="12" md="6"><v-select v-model="editableEvent['驗屋方式']" :items="bookingOptions.inspectionMethods" label="驗屋方式" density="default"></v-select></v-col>
            <v-col v-if="editableEvent['驗屋方式'] === '代驗公司'" cols="12" md="6"><v-text-field v-model="editableEvent['代驗公司名稱']" label="代驗公司名稱" density="default"></v-text-field></v-col>
            <v-col cols="12" md="6">
              <v-select 
                v-model="editableEvent['驗屋人員']" 
                :items="bookingOptions.inspectionStaff" 
                label="驗屋人員" 
                density="default" 
                multiple 
                chips 
                clearable>
              </v-select>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>
          
          <p class="text-subtitle-1 font-weight-bold mb-2">本次預約備註</p>
          <v-row dense>
            <v-col cols="12">
              <v-textarea
                v-model="editableEvent['預約備註']"
                label="備註內容"
                variant="outlined"
                rows="4"
                auto-grow
                clearable
              ></v-textarea>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-3">
          <div v-if="!isEditMode" class="d-flex w-100">
            <v-btn v-if="canEdit" color="red" variant="tonal" @click="promptCancelBooking(selectedEvent)">取消此預約</v-btn>
            <v-spacer></v-spacer>
            <v-btn color="grey-darken-1" variant="text" @click="isDialogVisible = false">關閉</v-btn>
            <v-btn v-if="canEdit" color="primary" variant="flat" @click="enterEditMode">編輯</v-btn>
          </div>
          <div v-else class="d-flex w-100">
            <v-spacer></v-spacer>
            <v-btn color="grey-darken-1" variant="text" @click="isEditMode = false">取消</v-btn>
            <v-btn color="success" variant="flat" :loading="isSaving" @click="saveChanges">儲存</v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
            <v-list-item
              :title="`${eventToCancel['戶別']} (${eventToCancel['姓名']})`"
              prepend-icon="mdi-home-account"
            >
              <template v-slot:subtitle>
                <div class="font-weight-medium">{{ eventToCancel['預約項目'] }}</div>
              </template>
            </v-list-item>
            <v-list-item
              prepend-icon="mdi-calendar-clock-outline"
            >
              <template v-slot:title>
                <div>{{ format(new Date(eventToCancel['預約日期']), 'yyyy-MM-dd') }}</div>
              </template>
              <template v-slot:subtitle>
                <div class="font-weight-medium">{{ eventToCancel['預約時段'] }}</div>
              </template>
            </v-list-item>
        </v-list>
          
          <div class="text-red-darken-2 font-weight-bold mt-4">
            此操作無法復原！
          </div>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions class="pa-3">
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="isCancelConfirmDialogVisible = false"
          >
            返回
          </v-btn>
          <v-btn
            color="red-darken-1"
            variant="flat"
            :loading="isCancelling"
            @click="handleCancelBooking"
          >
            確定取消
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/store/user';
import { fetchInspectionAppointments, getBookingInitialData, updateBooking, cancelBooking } from '@/api';
import { format, startOfWeek, endOfWeek, addDays, isToday, isSaturday, isSunday } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useClipboard } from '@vueuse/core'; // 導入 useClipboard

// --- Store 和路由 ---
const route = useRoute();
const userStore = useUserStore();

// --- 響應式狀態 ---
const isLoading = ref(true);
const error = ref(null);
const appointments = ref([]);
const isDialogVisible = ref(false);
const selectedEvent = ref(null);
const isDownloadingPdf = ref(false);
const pdfDownloadProgress = ref('');
const searchQuery = ref('');
const startDate = ref(startOfWeek(new Date(), { weekStartsOn: 1 }));
const endDate = ref(endOfWeek(new Date(), { weekStartsOn: 1 }));
const isCancelConfirmDialogVisible = ref(false);
const eventToCancel = ref(null); 

// --- Dialog UI 優化相關狀態 ---
const snackbar = ref(false);
const snackbarText = ref('');
const panels = ref([0, 1]); // 預設展開第一個和第二個面板

// --- 編輯模式相關狀態 ---
const isEditMode = ref(false);
const editableEvent = ref(null);
const isSaving = ref(false);
const isCancelling = ref(false);
const bookingOptions = ref({
  inspectionMethods: [],
  inspectionStaff: []
});

// --- 常數與計算屬性 ---
const PROJECT_NAME_MAP = { fuyu56: '富宇上城', fuyu61: '富宇富御', fuyu1750: '富宇首馥' };
const KEYWORD_COLOR_MAP = [
  { keyword: '已撥款', backgroundColor: '#ffc107', textColor: '#212529', borderColor: '#e0a800' },
  { keyword: '初驗', backgroundColor: '#d4edda', textColor: '#155724', borderColor: '#b1dfbb' },
  { keyword: '複驗', backgroundColor: '#f8d7da', textColor: '#721c24', borderColor: '#f1b0b7' },
];
const projectId = ref(route.params.projectId);
const projectName = computed(() => PROJECT_NAME_MAP[projectId.value] || '未知建案');
const pageTitle = computed(() => `${projectName.value} - 驗屋預約總表`);

// --- 優化後的 Field Config ---
const fieldConfig = {
  default: [
    { title: '基本資料', fields: [
      { key: '門牌', label: '門牌', icon: 'mdi-map-marker-outline' },
      { key: '車位', label: '車位', icon: 'mdi-car-outline' },
      { key: '買方姓名', label: '買方姓名', icon: 'mdi-account-star-outline' },
      { key: '買方電話', label: '買方電話', icon: 'mdi-phone-outline', copyable: true },
    ]},
    { title: '預約人資料', fields: [
      { key: '姓名', label: '姓名', icon: 'mdi-account-outline' },
      { key: '電話', label: '電話', icon: 'mdi-cellphone', copyable: true },
      { key: 'EMAIL', label: 'EMAIL', icon: 'mdi-email-outline', copyable: true },
      { key: '身分證', label: '身分證', icon: 'mdi-card-account-details-outline' },
    ]},
    { title: '驗屋與預約詳情', fields: [
      { key: '初驗批次', label: '初驗批次', icon: 'mdi-numeric-1-box-multiple-outline' },
      { key: '複驗批次', label: '複驗批次', icon: 'mdi-numeric-2-box-multiple-outline' },
      { key: '驗屋方式', label: '驗屋方式', icon: 'mdi-cog-outline' },
      { key: '代驗公司名稱', label: '代驗公司', icon: 'mdi-domain' },
      { key: '預約代碼', label: '預約代碼', icon: 'mdi-barcode-scan', copyable: true },
      { key: '填表時間', label: '填表時間', icon: 'mdi-calendar-edit', type: 'datetime' },
      { key: '驗屋人員', label: '驗屋人員', icon: 'mdi-account-group-outline', type: 'chips' },
    ]},
    { title: '相關文件', fields: [
      { key: '撥款日期', label: '撥款日期', icon: 'mdi-cash-check', type: 'date' },
      { key: '驗屋文件', label: '驗屋文件', icon: 'mdi-file-document-outline', type: 'button' },
      { key: '驗屋報告', label: '驗屋報告', icon: 'mdi-file-chart-outline', type: 'button' },
    ]},
    { title: '備註事項', fields: [
      { key: '備註', label: '重要備註', type: 'remark' },
      { key: '預約備註', label: '本次預約備註', type: 'remark' },
    ]},
  ],
  // 可以為特定專案覆寫設定
  '富宇富御': [
     { title: '基本資料', fields: [
      { key: '門牌', label: '門牌', icon: 'mdi-map-marker-outline' },
      { key: '買方姓名', label: '買方姓名', icon: 'mdi-account-star-outline' },
      { key: '買方電話', label: '買方電話', icon: 'mdi-phone-outline', copyable: true },
    ]},
     { title: '預約人資料', fields: [
      { key: '姓名', label: '姓名', icon: 'mdi-account-outline' },
      { key: '電話', label: '電話', icon: 'mdi-cellphone', copyable: true },
    ]},
     { title: '驗屋與預約詳情', fields: [
      { key: '預約代碼', label: '預約代碼', icon: 'mdi-barcode-scan', copyable: true },
      { key: '填表時間', label: '填表時間', icon: 'mdi-calendar-edit', type: 'datetime' },
    ]},
  ],
};

const projectFieldConfig = computed(() => {
  return fieldConfig[projectName.value] || fieldConfig.default;
});


// --- 權限計算屬性 ---
const canEdit = computed(() => {
  return userStore.hasProjectPermission('驗屋時間表-修改', projectName.value);
});

// --- 一鍵複製功能 ---
function handleCopy(value) {
  const { copy } = useClipboard({ source: value });
  copy(value);
  snackbarText.value = '已複製到剪貼簿！';
  snackbar.value = true;
}

const filteredAppointments = computed(() => {
  
  const allProcessedAppointments = processAppointments(appointments.value);
  const query = searchQuery.value ? searchQuery.value.toLowerCase().trim() : '';
  if (!query) return allProcessedAppointments;
  return allProcessedAppointments.filter(appt => {
    const fieldsToSearch = [
      appt['戶別'], appt['門牌'], appt['姓名'], appt['電話'], appt['預約項目'],
      appt['驗屋方式'], appt['代驗公司名稱'], appt['驗屋人員'], appt['備註'],
      appt['車位'], appt['銀行'], appt['銀行窗口'],appt['預約代碼'],appt['預約日期']
    ];
    return fieldsToSearch.some(field => field && String(field).toLowerCase().includes(query));
  });
});

const foundDates = computed(() => {
  
  if (!searchQuery.value) return [];
  const dates = filteredAppointments.value.map(appt => format(appt.start, 'yyyy-MM-dd'));
  return [...new Set(dates)];
});

const dateChunks = computed(() => {
  
  const query = searchQuery.value ? searchQuery.value.trim() : '';
  if (query && foundDates.value.length > 0) {
    const startOfWeeks = [...new Set(foundDates.value.map(dateStr => format(startOfWeek(new Date(dateStr), { weekStartsOn: 1 }), 'yyyy-MM-dd')))].sort();
    return startOfWeeks.map(weekStartStr => {
      const chunk = [];
      const current = new Date(weekStartStr);
      for (let i = 0; i < 7; i++) {
        const date = addDays(current, i);
        chunk.push({
          dateObj: date, dayName: format(date, 'EEEE', { locale: zhTW }),
          date: format(date, 'M/d'), fullDate: format(date, 'yyyy-MM-dd'),
          isInRange: true, isToday: isToday(date), isWeekend: isSaturday(date) || isSunday(date)
        });
      }
      return chunk;
    });
  } else {
    if (!startDate.value || !endDate.value) return [];
    const chunks = [];
    let current = startOfWeek(new Date(startDate.value), { weekStartsOn: 1 });
    while (current <= endDate.value) {
      const chunk = [];
      for (let i = 0; i < 7; i++) {
        const date = addDays(current, i);
        const isInRange = date >= startDate.value && date <= endDate.value;
        chunk.push({
          dateObj: date, dayName: format(date, 'EEEE', { locale: zhTW }),
          date: format(date, 'M/d'), fullDate: format(date, 'yyyy-MM-dd'),
          isInRange: isInRange, isToday: isToday(date), isWeekend: isSaturday(date) || isSunday(date)
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
  set: (val) => { const [y, m, d] = val.split('-').map(Number); startDate.value = new Date(y, m - 1, d); }
});

const endDateFormatted = computed({
  
  get: () => format(endDate.value, 'yyyy-MM-dd'),
  set: (val) => { const [y, m, d] = val.split('-').map(Number); endDate.value = new Date(y, m - 1, d); }
});

const timeSlots = computed(() => {
  
  const slots = [];
  for (let i = 8; i < 18; i++) { slots.push(`${String(i).padStart(2, '0')}:00`); }
  return slots;
});

const groupedEvents = computed(() => {
  
  const grouped = {};
  filteredAppointments.value.forEach(event => {
    const dateKey = format(event.start, 'yyyy-MM-dd');
    const timeKey = format(event.start, 'HH:00');
    if (!grouped[dateKey]) grouped[dateKey] = {};
    if (!grouped[dateKey][timeKey]) grouped[dateKey][timeKey] = [];
    grouped[dateKey][timeKey].push(event);
  });
  return grouped;
});

// --- 方法 ---
// ... 此處省略所有未變更的方法，如 processAppointments, getEventStyle, enterEditMode, saveChanges, handleCancelBooking, handleDownloadPdf, fetchData 等...
// 只需要保留 handleCustomEventClick 和 openUrl
function promptCancelBooking(event) {
  eventToCancel.value = event;
  isCancelConfirmDialogVisible.value = true;
}

function processAppointments(rawAppointments) {
  return rawAppointments
      .filter(appt => appt['預約狀態'] === '預約中')
      .map(appt => {
          try {
              const rawDateObject = new Date(appt['預約日期']);
              if (isNaN(rawDateObject.getTime())) return null;
              const date = format(rawDateObject, 'yyyy-MM-dd');
              const timeSlot = appt['預約時段'] ? String(appt['預約時段']).replace(/：/g, ':') : '00:00';
              const times = timeSlot.split('-').map(t => t.trim());
              const startTime = times[0] || '00:00';
              const endTime = times.length > 1 ? (times[1] || `${String(parseInt(startTime.split(':')[0]) + 1).padStart(2, '0')}:00`) : `${String(parseInt(startTime.split(':')[0]) + 1).padStart(2, '0')}:00`;
              
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
        backgroundColor: config.backgroundColor, color: config.textColor, borderColor: config.borderColor, 
        borderWidth: '2px', borderStyle: 'solid'
      };
    }
  }
  return {
    backgroundColor: '#EEEEEE', color: '#212121', borderColor: '#E0E0E0',
    borderWidth: '2px', borderStyle: 'solid'
  };
}

function handleCustomEventClick(event) {
  selectedEvent.value = event;
  isEditMode.value = false;
  isDialogVisible.value = true;
}

function enterEditMode() {
  const eventCopy = JSON.parse(JSON.stringify(selectedEvent.value));
  if (eventCopy['預約日期']) {
    eventCopy['預約日期'] = format(new Date(eventCopy['預約日期']), 'yyyy-MM-dd');
  }
  if (eventCopy['驗屋人員'] && typeof eventCopy['驗屋人員'] === 'string') {
    eventCopy['驗屋人員'] = eventCopy['驗屋人員'].split(',').map(name => name.trim()).filter(Boolean);
  } else {
    eventCopy['驗屋人員'] = [];
  }
  editableEvent.value = eventCopy;
  isEditMode.value = true;
}

async function saveChanges() {
  isSaving.value = true;
  error.value = null;
  try {
    if (!editableEvent.value['預約日期']) {
        throw new Error('預約日期為必填欄位。');
    }

    const staff = Array.isArray(editableEvent.value['驗屋人員'])
      ? editableEvent.value['驗屋人員'].join(',')
      : editableEvent.value['驗屋人員'];

    const updatedData = {
        '姓名': editableEvent.value['姓名'],
        '電話': editableEvent.value['電話'],
        'EMAIL': editableEvent.value['EMAIL'],
        '驗屋方式': editableEvent.value['驗屋方式'],
        '代驗公司名稱': editableEvent.value['代驗公司名稱'],
        '驗屋人員': staff,
        '預約日期': format(new Date(editableEvent.value['預約日期']), 'yyyy-MM-dd'),
        '預約時段': editableEvent.value['預約時段'],
        '預約備註': editableEvent.value['預約備註'],
    };

    const response = await updateBooking(
        projectName.value, 
        editableEvent.value['預約代碼'],
        updatedData
    );

    if (response.status === 'success') {
      alert('儲存成功！');
      isDialogVisible.value = false;
      await fetchData();
    } else {
      throw new Error(response.message || '更新失敗');
    }
  } catch (err) {
    error.value = `儲存失敗: ${err.message}`;
    alert(`儲存失敗: ${err.message}`);
  } finally {
    isSaving.value = false;
  }
}

async function handleCancelBooking() {
  if (!eventToCancel.value) return;

  isCancelling.value = true;
  error.value = null;
  
  try {
    const response = await cancelBooking(
      projectName.value, 
      eventToCancel.value['預約代碼']
    );

    if (response.status === 'success') {
      alert('預約已成功取消！');
      isDialogVisible.value = false;
      isCancelConfirmDialogVisible.value = false;
      await fetchData();
    } else {
      throw new Error(response.message || '取消失敗');
    }
  } catch (err) {
    error.value = `取消預約失敗: ${err.message}`;
    alert(`取消預約失敗: ${err.message}`);
  } finally {
    isCancelling.value = false;
    eventToCancel.value = null;
  }
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
  const margin = 5; 
  try {
    for (let i = 0; i < tableChunks.length; i++) {
      const element = tableChunks[i];
      pdfDownloadProgress.value = `正在產生第 ${i + 1} / ${tableChunks.length} 頁...`;
      const originalStyle = { width: element.style.width, height: element.style.height, position: element.style.position, left: element.style.left, top: element.style.top, };
      element.style.position = 'absolute';
      element.style.left = '0px';
      element.style.top = '0px';
      element.style.width = '3000px'; 
      element.style.height = 'auto';
      await new Promise(resolve => setTimeout(resolve, 100));
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, width: element.scrollWidth, height: element.scrollHeight, windowWidth: element.scrollWidth, windowHeight: element.scrollHeight });
      element.style.width = originalStyle.width;
      element.style.height = originalStyle.height;
      element.style.position = originalStyle.position;
      element.style.left = originalStyle.left;
      element.style.top = originalStyle.top;
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


function openUrl(url) {
  if (url) window.open(url, '_blank', 'noopener,noreferrer');
}

async function fetchData() {
  isLoading.value = true;
  error.value = null;
  try {
    const [appointmentsResponse, optionsResponse] = await Promise.all([
      fetchInspectionAppointments(projectName.value),
      getBookingInitialData(projectName.value)
    ]);

    if (appointmentsResponse.status === 'success') {
      appointments.value = appointmentsResponse.data;
    } else {
      throw new Error(appointmentsResponse.message || '無法獲取預約資料');
    }

    if (optionsResponse.status === 'success') {
      bookingOptions.value.inspectionMethods = optionsResponse.data.inspectionMethods || [];
      bookingOptions.value.inspectionStaff = optionsResponse.data.inspectionStaff || [];
    } else {
      console.warn('無法獲取表單選項資料:', optionsResponse.message);
    }
  } catch (err) {
    console.error('獲取資料失敗:', err);
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

function getAppointmentItemStyle(itemText) {
  if (!itemText) return {};
  const found = KEYWORD_COLOR_MAP.find(config => itemText.includes(config.keyword));
  if (found) {
    return {
      backgroundColor: found.backgroundColor,
      color: found.textColor,
      padding: '4px 10px',
      borderRadius: '16px',
      fontSize: '0.875rem',
      fontWeight: 'bold',
      display: 'inline-block'
    };
  }
  return {
    backgroundColor: '#E0E0E0',
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