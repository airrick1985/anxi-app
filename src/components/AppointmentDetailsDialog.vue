<template>
  <v-dialog :model-value="modelValue" @update:model-value="closeDialog" max-width="800px" persistent scrollable>
    <v-card v-if="appointment">
      <v-card-title class="text-h6 d-flex align-center bg-blue-lighten-5" style="cursor: move;" v-draggable-dialog>
        <v-icon start color="primary">mdi-calendar-text</v-icon>
        <span>預約詳細資訊</span>
        <v-spacer></v-spacer>
        <v-btn variant="text" icon="mdi-close" density="compact" @click="closeDialog"></v-btn>
      </v-card-title>
      
      <v-card-text v-if="appointment">
        <div class="bg-grey-lighten-5 pa-4 rounded">
          <v-row v-if="!isEditMode" align="center" dense>
            <v-col cols="12" sm="2">
              <div class="text-caption text-grey-darken-1">戶別</div>
              <div class="text-h5 font-weight-bold text-primary">{{ appointment?.unitId }}</div>
            </v-col>
            
            <v-col cols="12" sm="6">
              <div class="text-caption text-grey-darken-1">預約日期與時段</div>
              <div class="text-body-1 font-weight-medium">
                {{ formatDate(appointment?.appointmentDate, 'yyyy-MM-dd') }}
                <v-icon size="small" class="mx-1">mdi-clock-outline</v-icon>
                {{ appointment?.appointmentTimeSlot }}
              </div>
            </v-col>

            <v-col cols="12" sm="4" class="d-flex flex-wrap ga-2 justify-start justify-sm-end">
              <v-chip :color="getStatusColor(appointment?.status)" size="small" label>{{ appointment?.status }}</v-chip>
              <v-chip v-if="appointment?.bookingType" color="teal" variant="tonal" size="small" label>{{ appointment?.bookingType }}</v-chip>
            </v-col>
          </v-row>

          <div v-else-if="editableEvent">
            <v-row dense align="center">
              <v-col cols="12" sm="2">
                <div class="text-caption text-grey-darken-1">戶別</div>
                <div class="text-h5 font-weight-bold text-primary">{{ editableEvent?.unitId }}</div>
              </v-col>
              <v-col cols="12" sm="10" class="d-flex flex-wrap ga-2 justify-start justify-sm-end">
                <v-chip :color="getStatusColor(appointment.status)" size="small" label>{{ appointment.status }}</v-chip>
                <v-chip v-if="appointment.bookingType" color="teal" variant="tonal" size="small" label>{{ appointment.bookingType }}</v-chip>
              </v-col>
            </v-row>
            <v-divider class="my-3"></v-divider>
            <v-row dense>
              <v-col cols="12" md="auto">
                 <div class="text-caption text-grey-darken-1 mb-1">預約日期</div>
                <div class="position-relative">
                <VueDatePicker
                  v-model="editableEvent.appointmentDate"
                  auto-apply
                  locale="zh-TW"
                  format="yyyy-MM-dd"
                  :enable-time-picker="false"
                  :month-change-on-scroll="false"
                  @update:model-value="handleDateChange"
                  :min-date="new Date()"
                >
                  <template #day="{ date }">
                    <div class="custom-day-cell">
                      <div class="date-number">{{ date.getDate() }}</div>
                      <div v-if="dateMarkers[format(date, 'yyyy-MM-dd')]" class="date-marker">
                        <v-icon
                          :icon="dateMarkers[format(date, 'yyyy-MM-dd')].icon"
                          :color="dateMarkers[format(date, 'yyyy-MM-dd')].color"
                          size="x-small"
                        ></v-icon>
                      </div>
                    </div>
                  </template>
                 </VueDatePicker>
                  <v-overlay
                    :model-value="isFetchingCalendarData"
                    contained
                    class="align-center justify-center"
                  >
                    <v-progress-circular indeterminate color="white"></v-progress-circular>
                  </v-overlay>
                </div>
                <div class="d-flex align-center justify-start ga-4 mt-2 text-caption text-medium-emphasis">
                  <div class="d-flex align-center ga-1">
                    <v-icon icon="mdi-circle-outline" color="green" size="small"></v-icon>
                    <span>本戶批次</span>
                  </div>
                  <div class="d-flex align-center ga-1">
                    <v-icon icon="mdi-triangle-outline" color="blue" size="small"></v-icon>
                    <span>其他批次</span>
                  </div>
                </div>
              </v-col>
              <v-col cols="12" md>
                <div class="text-caption text-grey-darken-1 mb-1">預約時段</div>
                <div v-if="isFetchingSlots" class="text-center pa-4 border rounded">
                  <v-progress-circular indeterminate color="primary" size="24" class="mb-2"></v-progress-circular>
                  <div class="text-caption text-grey">查詢可預約時段...</div>
                </div>
                <div v-else-if="!editableEvent.appointmentDate" class="text-caption text-grey pa-4 border rounded">
                  請先選擇預約日期
                </div>
                <div v-else-if="availableTimeSlots.length === 0" class="text-caption text-grey pa-4 border rounded">
                  此日期無可預約時段，請手動輸入
                </div>
                <v-chip-group
                  v-else
                  v-model="editableEvent.appointmentTimeSlot"
                  column
                  mandatory
                  filter
                >
                  <v-chip
                    v-for="slot in availableTimeSlots"
                    :key="slot.value"
                    :value="slot.value"
                    variant="outlined"
                    color="blue"
                    label
                    size="large"
                    class="ma-1"
                  >
                    {{ slot.title }}
                  </v-chip>
                </v-chip-group>

                <v-text-field
                  v-model="editableEvent.manualTimeSlot"
                  label="手動輸入時段"
                  placeholder="HH:MM"
                  variant="outlined"
                  density="compact"
                  class="mt-4"
                  :rules="[manualTimeRule]"
                  persistent-hint
                  hint="若無可用時段，請手動輸入 24 小時制時間"
                ></v-text-field>

                <div v-if="timeSlotError" class="v-input__details text-error px-2 pt-1">
                  <div class="v-messages__message">{{ timeSlotError }}</div>
                </div>
              </v-col>
            </v-row>
          </div>
          
          <v-row dense class="mt-2" v-if="canEdit">
            <v-col cols="12">
              <v-combobox
                v-model="editableInspectors"
                :items="bookingOptions.inspectionStaff"
                label="驗屋人員 (可手動輸入，修改後即時儲存)"
                multiple chips closable-chips clearable
                variant="outlined" density="compact" hide-details
                :loading="isSavingInspectors"
                @update:model-value="handleInspectorsChange"
              ></v-combobox>
            </v-col>
          </v-row>
        </div>
        
        <v-alert
          v-if="appointment.remarks"
          variant="tonal" color="error" icon="mdi-alert-circle-outline"
          border="start" class="my-4"
          style="white-space: pre-wrap; word-wrap: break-word;"
        >
          <template v-slot:title><div class="font-weight-bold">重要備註</div></template>
          {{ appointment.remarks }}
        </v-alert>
        <v-divider class="my-4"></v-divider>
        
        <v-expansion-panels v-model="panels" multiple variant="accordion">
          <v-expansion-panel v-for="panel in displayPanels" :key="panel.title">
            <template v-if="panel.isHistoryPanel">
              <v-expansion-panel-title class="font-weight-bold">
                <v-icon start color="grey-darken-1">mdi-history</v-icon>
                歷次預約紀錄
                <v-chip size="small" color="blue-grey" class="ml-2">{{ bookingHistory.length }}</v-chip>
              </v-expansion-panel-title>
              <v-expansion-panel-text class="pa-0">
                <v-list lines="one" density="compact">
                  <template v-for="(item, index) in bookingHistory" :key="item.id">
                    <v-list-item :class="{ 'bg-blue-lighten-5': item.id === appointment.id }" class="py-2">
                      <v-list-item-title class="font-weight-medium">
                        {{ formatDate(item.appointmentDate, 'yyyy-MM-dd') }}
                        <span class="text-caption text-grey-darken-1 ml-2">{{ item.appointmentTimeSlot }}</span>
                      </v-list-item-title>
                      <v-list-item-subtitle>{{ item.bookingType }}</v-list-item-subtitle>
                      <template v-slot:append>
                        <v-chip :color="getStatusColor(item.status)" size="x-small" label>{{ item.status }}</v-chip>
                      </template>
                    </v-list-item>
                    <v-divider v-if="index < bookingHistory.length - 1"></v-divider>
                  </template>
                </v-list>
              </v-expansion-panel-text>
            </template>
            <template v-else>
              <v-expansion-panel-title class="font-weight-bold">{{ panel.title }}</v-expansion-panel-title>
              <v-expansion-panel-text class="pa-0">
                <div class="px-4">
                  <template v-for="(field, index) in panel.fields" :key="field.key">
                    <v-row dense align="center" class="py-3">
                      <v-col cols="12" sm="4" class="d-flex align-center text-grey-darken-2 text-subtitle-2">
                        <v-icon :icon="field.icon" start size="small"></v-icon>
                        <span>{{ field.label }}</span>
                      </v-col>
                      
                      <v-col cols="12" sm="8">
                        <div v-if="isEditMode && editableEvent && editableFields.has(field.key)">
                          <v-select
                            v-if="field.key === 'bookingType'"
                            v-model="editableEvent.bookingType"
                            
                            :items="bookingTypeOptions"
                            density="compact" hide-details="auto" variant="outlined"
                          ></v-select>
                          <v-select
                            v-else-if="field.key === 'inspectionMethod'"
                            v-model="editableEvent.inspectionMethod"
                            :items="bookingMethodOptions"
                            density="compact" hide-details="auto" variant="outlined"
                          ></v-select>
                          <v-switch
                            v-else-if="field.isSwitch"
                            v-model="editableEvent[field.key]"
                            color="green darken-2"
                            hide-details
                            density="compact"
                          ></v-switch>
                          <v-text-field
                            v-else-if="field.isDate"
                            v-model="editableEvent[field.key]"
                            type="date"
                            :placeholder="field.label" density="compact" hide-details="auto" variant="outlined"
                          ></v-text-field>
                           <v-text-field
                            v-else
                            dense
                            v-model="editableEvent[field.key]"
                            :placeholder="field.label" density="compact" hide-details="auto" variant="outlined"
                          ></v-text-field>
                        </div>
                        <div v-else class="text-body-1">
                          <template v-if="field.isSwitch">
                            <v-chip :color="appointment[field.key] ? 'success' : 'grey'" size="small" label>
                              {{ appointment[field.key] ? '開啟' : '關閉' }}
                            </v-chip>
                          </template>
                          <template v-else-if="field.key === 'inspectionDocsUrl'"> 
                          <v-btn v-if="appointment.inspectionDocsUrl" :href="appointment.inspectionDocsUrl" target="_blank" size="small" variant="tonal" color="blue-darken-2">
                              <v-icon start>mdi-folder-google-drive</v-icon> {{ appointment.unitId }}資料夾
                            </v-btn>
                            <span v-else>無</span>
                          </template>
                          <template v-else-if="field.key === 'inspectionReportUrl'">
                            <div v-if="inspectionReportFiles.length > 0" class="d-flex flex-column align-start ga-1">
                              <v-btn
                                v-for="file in inspectionReportFiles"
                                :key="file.url"
                                :href="file.url"
                                target="_blank"
                                variant="text"
                                size="small"
                                color="blue-darken-2"
                                class="justify-start text-none pa-1"
                                style="height: auto; min-height: 28px;"
                              >
                                <span class="text-body-2" style="white-space: normal; text-align: left; line-height: 1.2;">
                                  {{ file.name }}
                                </span>
                              </v-btn>
                            </div>
                            <span v-else>無</span>
                          </template>
                          <template v-else-if="field.isDate">
                            {{ formatDate(appointment[field.key], 'yyyy-MM-dd') || '無' }}
                          </template>
                          
                          <a v-else-if="field.isTel" :href="`tel:${appointment[field.key]}`" class="text-decoration-none text-primary">{{ appointment[field.key] || '無' }}</a>
                          <a v-else-if="field.isMail" :href="`mailto:${appointment[field.key]}`" class="text-decoration-none text-primary">{{ appointment[field.key] || '無' }}</a>
                          <span v-else style="word-break: break-all; white-space: normal;">{{ appointment[field.key] || '無' }}</span>
                        </div>
                      </v-col>
                    </v-row>
                    <v-divider v-if="index < panel.fields.length - 1"></v-divider>
                  </template>
                </div>
              </v-expansion-panel-text>
            </template>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>
      
      <v-divider></v-divider>
      <v-card-actions class="pa-3">
        <div v-if="!isEditMode" class="d-flex w-100">
          <v-btn v-if="canEdit && appointment.status !== '取消'" color="red" variant="tonal" @click="emit('cancel-appointment', appointment)">取消此預約</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeDialog">關閉</v-btn>
          <v-btn v-if="canEdit && appointment.status !== '取消'" color="primary" variant="flat" @click="enterEditMode" :loading="isEnteringEditMode">編輯</v-btn>
        </div>
        <div v-else class="d-flex w-100">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="isEditMode = false">取消</v-btn>
          <v-btn color="success" variant="flat" :loading="isSaving" @click="saveChanges">儲存</v-btn>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="isOverbookingConfirmDialogVisible" max-width="500px" persistent>
    <v-card>
        <v-card-title class="text-h6 d-flex align-center bg-error">
            <v-icon start>mdi-alert-circle-outline</v-icon>
            <span>確認超額預約</span>
        </v-card-title>
        <v-card-text class="pt-4">
            您選擇的時段 <strong>{{ overbookingDetails.date }} {{ overbookingDetails.time }}</strong> 名額已超出限制，要繼續預約嗎？
        </v-card-text>
        <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="text" @click="cancelOverbooking">取消</v-btn>
            <v-btn color="error" variant="flat" @click="confirmOverbooking">是，繼續預約</v-btn>
        </v-card-actions>
    </v-card>
</v-dialog>
</template>

<script setup>
import { ref, watch, computed, nextTick, reactive } from 'vue'; 
import { useDate } from 'vuetify';
import { format } from 'date-fns';
import { getSlotsForAdmin, fetchProjectConfig } from '@/api';
import { vDraggableDialog } from '@/directives/vDraggableDialog';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';


const props = defineProps({
  modelValue: { type: Boolean, required: true },
  appointment: { type: Object, default: null },
  canEdit: { type: Boolean, default: false },
  bookingOptions: {
    type: Object,
    default: () => ({ bookingTypes: [], inspectionMethods: [] })
  },
  bookingHistory: {
    type: Array,
    default: () => []
  },
  calendarData: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue', 'save', 'cancel-appointment', 'update-inspectors', 'request-calendar-data']);

const dateAdapter = useDate();
const isEditMode = ref(false);
const isEditing = ref(false);
const editableEvent = ref(null);
const editableInspectors = ref([]);
const isSaving = ref(false);
const isEnteringEditMode = ref(false);
const isSavingInspectors = ref(false);

const isFetchingCalendarData = ref(false); // ★ 1. 新增一個載入狀態
const availableTimeSlots = ref([]);
const isFetchingSlots = ref(false);
const timeSlotError = ref('');
const isOverbooking = ref(false);
const isOverbookingConfirmDialogVisible = ref(false);
const overbookingDetails = reactive({ date: '', time: '' });


const panels = ref([]);
const projectConfig = ref(null);




const dateMarkers = computed(() => {
  const markers = {};
  if (!props.calendarData) {
    return markers;
  }

  for (const event of props.calendarData) {
    if (event.type === 'own_batch') {
      markers[event.date] = { icon: 'mdi-circle-outline', color: 'green' };
    } else if (event.type === 'other_batch') {
      markers[event.date] = { icon: 'mdi-triangle-outline', color: 'blue' };
    }
  }
  
  return markers;
});


// ★ 5. 監聽 prop 的變化，當資料抵達時，結束載入狀態
watch(() => props.calendarData, (newData) => {
  if (newData && newData.length > 0) {
    isFetchingCalendarData.value = false;
  }
});


const timeFormatRules = [
  v => !!v || '時段為必填項',
  v => /^([01]\d|2[0-3]):([0-5]\d)$/.test(v) || '格式必須為 HH:mm (例如 09:30)',
];


const fieldConfig = [
  { title: '系統功能', fields: [ { key: 'showInMenu', label: '預約系統', icon: 'mdi-calendar-sync', isSwitch: true }, { key: 'initialReportUploadSwitch', label: '初驗報告上傳', icon: 'mdi-upload-network-outline', isSwitch: true }, { key: 'reInspectionReportUploadSwitch', label: '複驗報告上傳', icon: 'mdi-upload-network', isSwitch: true }, { key: 'initialInspectionBatch', label: '初驗批次', icon: 'mdi-numeric-1-box-multiple-outline' }, { key: 'reInspectionBatch', label: '複驗批次', icon: 'mdi-numeric-2-box-multiple-outline' }, ]},
  { title: '基本資料', fields: [ { key: 'address', label: '門牌', icon: 'mdi-map-marker-outline' }, { key: 'parkingLots', label: '車位', icon: 'mdi-car-outline' }, { key: 'buyerName', label: '買方姓名', icon: 'mdi-account-star-outline' }, { key: 'buyerPhone', label: '買方電話', icon: 'mdi-phone-outline', isTel: true }, { key: 'buyerEmail', label: '買方EMAIL', icon: 'mdi-email-outline', isMail: true }, { key: 'buyerIdNumber', label: '買方身分證', icon: 'mdi-card-account-details-outline' },{ key: 'appropriationDate', label: '撥款日期', icon: 'mdi-cash-check', isDate: true }, { key: 'bank', label: '銀行', icon: 'mdi-bank-outline' } ]},
  { title: '預約人資料', fields: [ { key: 'bookerName', label: '預約人姓名', icon: 'mdi-account-outline' }, { key: 'bookerPhone', label: '預約人電話', icon: 'mdi-cellphone', isTel: true }, { key: 'bookerEmail', label: '預約人EMAIL', icon: 'mdi-email-outline', isMail: true }, { key: 'bookerIdNumber', label: '預約人身分證', icon: 'mdi-card-account-details-outline' } ]},
  { title: '驗屋與預約詳情', fields: [ { key: 'bookingType', label: '預約項目', icon: 'mdi-format-list-checks' }, { key: 'inspectionMethod', label: '驗屋方式', icon: 'mdi-cog-outline' }, { key: 'inspectionCompanyName', label: '代驗公司', icon: 'mdi-domain' }, { key: 'agentName', label: '受託人姓名', icon: 'mdi-account-tie-outline' }, { key: 'agentPhone', label: '受託人電話', icon: 'mdi-phone-in-talk-outline', isTel: true }, { key: 'bookingRemarks', label: '預約備註', icon: 'mdi-note-text-outline' }, ]},
  { title: '驗屋文件及報告', fields: [  { key: 'inspectionDocsUrl', label: '驗屋文件', icon: 'mdi-file-document-outline' }, { key: 'inspectionReportUrl', label: '驗屋報告', icon: 'mdi-file-chart-outline' }, ]}
];


// 這次使用 computed 屬性，它會從 fieldConfig 動態產生可編輯欄位的 Set
const editableFields = computed(() => {
  const fields = new Set(
    fieldConfig.flatMap(panel => panel.fields.map(field => field.key))
  );
  // 排除掉唯讀的欄位
  fields.delete('inspectionDocsUrl');
  fields.delete('inspectionReportUrl');
  return fields;
});

const bookingTypeOptions = computed(() => projectConfig.value?.bookingTypes || []);
const bookingMethodOptions = computed(() => projectConfig.value?.bookingMethodOptions || []);



// ✓ 新增：動態面板
const displayPanels = computed(() => {
  const panels = [...fieldConfig];
  if (props.bookingHistory && props.bookingHistory.length > 0) {
    panels.push({ title: '歷次預約紀錄', isHistoryPanel: true });
  }
  return panels;
});

const inspectionReportFiles = computed(() => {
  const value = props.appointment?.inspectionReportUrl;
  if (Array.isArray(value)) {
    return value.filter(item => item && typeof item.name === 'string' && typeof item.url === 'string');
  }
  return [];
});

async function enterEditMode() {
  if (!props.appointment?.projectId) return;

  // 1. 開始載入狀態
  isEnteringEditMode.value = true;
  isFetchingCalendarData.value = true;

  // 2. 向父元件發出事件，請求行事曆標記資料 (此為非同步，不阻塞 UI)
  emit('request-calendar-data', { unitId: props.appointment.unitId });

  try {
    // 3. 獲取建案設定 (例如：預約類型、驗屋方式等下拉選單)
    const config = await fetchProjectConfig(props.appointment.projectId);
    projectConfig.value = config;

    // 4. 建立一個乾淨的資料複本以供編輯
    const cleanCopy = {};
    const allKeys = new Set();
    fieldConfig.forEach(panel => panel.fields.forEach(field => allKeys.add(field.key)));
    allKeys.add('appointmentDate');
    allKeys.add('appointmentTimeSlot');
    
    allKeys.forEach(key => {
      const value = props.appointment[key];
      const fieldDef = fieldConfig.flatMap(p => p.fields).find(f => f.key === key);

      //  修改：將日期欄位直接轉換為 Date 物件，而不是字串
  if ((key === 'appointmentDate' || fieldDef?.isDate) && value) {
      const dateObj = (typeof value.toDate === 'function') ? value.toDate() : new Date(value);
      // 檢查是否為有效日期
      if (!isNaN(dateObj.getTime())) {
        // 將 Date 物件格式化為 'yyyy-MM-dd' 字串
        cleanCopy[key] = format(dateObj, 'yyyy-MM-dd');
      } else {
        cleanCopy[key] = ''; // 如果日期無效，則清空
      }
    } else if (fieldDef?.isSwitch) {
      cleanCopy[key] = value === true;
    } else {
      cleanCopy[key] = value ?? '';
    }
  });
    
    cleanCopy.manualTimeSlot = ''; 

    editableEvent.value = cleanCopy;

    // 5. 切換到編輯模式，並展開所有面板
    // isEditMode 設為 true 後，會自動觸發 watch 來獲取可用時段
    isEditMode.value = true;
    panels.value = [0, 1, 2, 3, 4];

  } catch (error) {
    console.error("進入編輯模式失敗:", error);
    // 如果出錯，重設載入狀態
    isFetchingCalendarData.value = false;
  } finally {
    // 6. 結束主要的進入編輯模式的載入狀態
    isEnteringEditMode.value = false;
    // isFetchingCalendarData 的結束由 watch(() => props.calendarData, ...) 控制
  }
};



function saveChanges() {
  // 1. 開始 loading
  isSaving.value = true;

  const bookingPayload = {};
  const householdPayload = {};
  const householdKeys = new Set([
    'address', 'parkingLots', 'buyerName', 'buyerPhone', 'buyerEmail', 'buyerIdNumber',
    'appropriationDate', 'bank', 'initialInspectionBatch', 'reInspectionBatch',
    'showInMenu', 'initialReportUploadSwitch', 'reInspectionReportUploadSwitch'
  ]);
  const dateKeys = new Set(
    fieldConfig.flatMap(p => p.fields).filter(f => f.isDate).map(f => f.key)
  );
  const allFieldKeys = fieldConfig.flatMap(panel => panel.fields.map(field => field.key));
  const keysToCompare = [...new Set([...allFieldKeys, 'appointmentDate', 'appointmentTimeSlot', 'manualTimeSlot'])];

  keysToCompare.forEach(key => {
    if (key === 'inspectionDocsUrl' || key === 'inspectionReportUrl') return;
    const originalValue = props.appointment[key];
    const editedValue = editableEvent.value[key];
    let changeDetected = false;
    if (key === 'appointmentDate' || dateKeys.has(key)) {
      const originalTime = originalValue ? ((typeof originalValue.toDate === 'function') ? originalValue.toDate() : new Date(originalValue)).getTime() : null;
      const editedTime = editedValue ? new Date(editedValue).getTime() : null;
      if (originalTime !== editedTime) {
        changeDetected = true;
      }
    } else {
      if (String(originalValue ?? '') !== String(editedValue ?? '')) {
        changeDetected = true;
      }
    }
    if (changeDetected) {
      let valueToSave = editedValue;
      if ((dateKeys.has(key) || key === 'appointmentDate') && editedValue) {
        valueToSave = new Date(editedValue);
      }
      if (key !== 'appointmentTimeSlot' && key !== 'manualTimeSlot') {
        if (householdKeys.has(key)) {
          householdPayload[key] = valueToSave;
        } else {
          bookingPayload[key] = valueToSave;
        }
      }
    }
  });

  const originalTimeSlot = props.appointment.appointmentTimeSlot || '';
  const finalTimeSlot = (editableEvent.value.manualTimeSlot && /^([01]\d|2[0-3]):([0-5]\d)$/.test(editableEvent.value.manualTimeSlot))
    ? editableEvent.value.manualTimeSlot
    : editableEvent.value.appointmentTimeSlot;
  if (String(originalTimeSlot) !== String(finalTimeSlot ?? '')) {
      bookingPayload.appointmentTimeSlot = finalTimeSlot;
  }
  
  // 2. 判斷是否有變更
  if (Object.keys(bookingPayload).length > 0 || Object.keys(householdPayload).length > 0) {
    // 3. 如果有變更，發出事件，但 **不再** 關閉 loading
    emit('save', {
      appointmentId: props.appointment.id,
      householdDocId: props.appointment.householdDocId || `${props.appointment.projectId}_${props.appointment.unitId}`,
      bookingPayload,
      householdPayload,
    });
  } else {
    // 4. 如果沒有變更，直接結束編輯並關閉 loading
    isEditMode.value = false;
    isSaving.value = false;
  }
}


async function handleInspectorsChange(newInspectors) {
  if (!props.appointment) return;
  
  // 這裡不再呼叫 API，而是發出一個事件通知父組件
  emit('update-inspectors', {
    appointmentId: props.appointment.id,
    inspectors: newInspectors
  });
}

//  新增：當日期變更時，重新獲取可用時段
watch(() => editableEvent.value?.appointmentDate, async (newDate) => {
  if (!isEditMode.value || !newDate || !props.appointment?.projectId) {
    availableTimeSlots.value = [];
    return;
  }
  isFetchingSlots.value = true;
  availableTimeSlots.value = [];
  try {
    //  【核心修正】確保傳遞給 API 的是 'yyyy-MM-dd' 字串
    // newDate 此時是一個 Date 物件
    const dateStr = format(newDate, 'yyyy-MM-dd');
    const slots = await getSlotsForAdmin(props.appointment.projectId, dateStr);
    
    availableTimeSlots.value = slots.map(s => ({ title: s, value: s.split(' ')[0] }));
  } catch (error) {
    console.error("獲取時段失敗:", error);
    availableTimeSlots.value = [];
  } finally {
    isFetchingSlots.value = false;
  }
});

//  新增：監聽 Chip Group 的選擇
watch(() => editableEvent.value?.appointmentTimeSlot, (newSlotValue) => {
  timeSlotError.value = '';
  if (newSlotValue) {
    editableEvent.value.manualTimeSlot = ''; // 清空手動輸入
    onTimeSlotChange(newSlotValue); // 觸發超額檢查
  }
});

//  新增：監聽手動輸入欄位
watch(() => editableEvent.value?.manualTimeSlot, (newManualTime) => {
    if (newManualTime) {
        editableEvent.value.appointmentTimeSlot = null; // 清空 chip 選擇
        isOverbooking.value = false; // 手動輸入不觸發超額檢查
        timeSlotError.value = '';
    }
});

//  新增：手動輸入的驗證規則
const manualTimeRule = (v) => {
    if (!v) return true; // 允許為空 (如果選擇了 chip)
    return /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(v) || '格式不正確，請輸入 HH:MM';
};

//  新增：選擇時段後的處理函式 (檢查超額)
const onTimeSlotChange = (selectedSlot) => {
    isOverbooking.value = false;
    if (!selectedSlot) return;

    const foundSlot = availableTimeSlots.value.find(s => s.value === selectedSlot);
    const titleString = foundSlot ? foundSlot.title : String(selectedSlot);

    if (titleString && (titleString.includes('已額滿') || titleString.includes('尚餘 0 位'))) {
        overbookingDetails.date = dateAdapter.format(editableEvent.value.appointmentDate, 'keyboardDate');
        overbookingDetails.time = titleString;
        isOverbookingConfirmDialogVisible.value = true;
    }
};

//  新增：處理超額預約確認的函式
const confirmOverbooking = () => {
    isOverbooking.value = true;
    isOverbookingConfirmDialogVisible.value = false;
};

const cancelOverbooking = () => {
    editableEvent.value.appointmentTimeSlot = null;
    isOverbooking.value = false;
    isOverbookingConfirmDialogVisible.value = false;
};

watch(() => props.modelValue, (isOpen) => {
  // 條件一：當對話框打開時，執行「初始化」
  if (isOpen && props.appointment) {
    isEditMode.value = false;
    panels.value = []; // 預設關閉所有摺疊面板

    // 解析驗屋人員字串為陣列
    const inspectors = props.appointment.inspectors;
    if (typeof inspectors === 'string' && inspectors) {
      editableInspectors.value = inspectors.split(',').map(name => name.trim()).filter(Boolean);
    } else {
      editableInspectors.value = [];
    }
  } 
  // 條件二：當對話框關閉時，執行「清理與重置」
  else {
    isSaving.value = false; // 關鍵：重置儲存狀態，確保下次 loading 效果正常
    projectConfig.value = null;
    editableEvent.value = null;
    isOverbooking.value = false;
  }
});

const handleDateChange = (newDate) => {
  // 當日期改變時，清空已選的時段，讓使用者重新選擇
  editableEvent.value.appointmentTimeSlot = null; //  修改：設為 null
  editableEvent.value.manualTimeSlot = ''; //  新增：一併清空手動輸入欄位
};

const closeDialog = () => {
   isEditMode.value = false; // 修正：使用 isEditMode
  emit('update:modelValue', false);
};

const formatDate = (dateString, formatStr = 'keyboardDate') => {
  if (!dateString) return '';
  try {
    const date = (typeof dateString?.toDate === 'function') ? dateString.toDate() : new Date(dateString);
    if (isNaN(date.getTime())) return '';
    if (formatStr !== 'keyboardDate') {
      return format(date, formatStr);
    }
    return dateAdapter.format(date, 'keyboardDate');
  } catch {
    return String(dateString);
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case '預約中': return 'success';
    case '已完成': return 'blue-grey';
    case '取消': return 'error';
    default: return 'grey';
  }
};

</script>

<style scoped>
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

.date-marker {
  position: absolute;
  bottom: -12px;
  line-height: 1;
}
</style>