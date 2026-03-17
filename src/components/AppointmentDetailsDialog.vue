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
        <!-- 頂部摘要 (檢視/編輯模式共用版面) -->
        <div :class="['pa-4 rounded', isEditMode ? 'edit-mode-header' : 'bg-grey-lighten-5']">
          <v-row align="center" dense>
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
                <v-chip v-if="isEditMode" size="x-small" color="info" variant="tonal" class="ml-2">
                  <v-icon start size="x-small">mdi-pencil</v-icon>可在下方面板修改
                </v-chip>
              </div>
            </v-col>

            <v-col cols="12" sm="4" class="d-flex flex-wrap ga-2 justify-start justify-sm-end">
              <v-chip :color="getStatusColor(appointment?.status)" size="small" label>{{ appointment?.status }}</v-chip>
              <v-chip v-if="appointment?.bookingType" color="teal" variant="tonal" size="small" label>{{ appointment?.bookingType }}</v-chip>
              <v-chip v-if="isEditMode" color="warning" size="small" variant="flat" label>
                <v-icon start size="small">mdi-pencil-outline</v-icon>編輯中
              </v-chip>
            </v-col>
          </v-row>

          <!-- 驗屋人員 -->
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
        
        <!-- 重要備註 -->
        <v-alert
          v-if="!isEditMode && !isEditingImportantRemarks && appointment.remarks"
          variant="tonal" color="error" icon="mdi-alert-circle-outline"
          border="start" class="mt-4 mb-2 cursor-pointer"
          style="white-space: pre-wrap; word-wrap: break-word;"
          @click="canEdit ? startInlineEdit('importantRemarks') : null"
          :title="canEdit ? '點擊即可編輯重要備註' : ''"
        >
          <template v-slot:title><div class="font-weight-bold">重要備註 <v-icon v-if="canEdit" size="x-small" color="grey-darken-1">mdi-pencil</v-icon></div></template>
          {{ appointment.remarks }}
        </v-alert>
        
        <div v-else-if="!isEditMode && canEdit && (!appointment.remarks || isEditingImportantRemarks)" class="mt-4 mb-2">
           <v-textarea
            v-if="isEditingImportantRemarks"
            v-model="inlineEditingValues.remarks"
            label="重要備註"
            variant="outlined"
            density="compact"
            auto-grow
            rows="2"
            hide-details="auto"
            bg-color="red-lighten-5"
            color="error"
            prepend-inner-icon="mdi-alert-circle-outline"
            autofocus
            :loading="isSavingInline"
            @blur="saveInlineRemark('remarks')"
          ></v-textarea>
          <v-btn v-else-if="!appointment.remarks" variant="text" color="error" prepend-icon="mdi-plus" @click="startInlineEdit('importantRemarks')" size="small">新增重要備註</v-btn>
        </div>

        <div v-if="isEditMode && editableEvent" class="mt-4 mb-2">
          <v-textarea
            v-model="editableEvent.remarks"
            label="重要備註"
            variant="outlined"
            density="compact"
            auto-grow
            rows="2"
            hide-details="auto"
            bg-color="red-lighten-5"
            color="error"
            prepend-inner-icon="mdi-alert-circle-outline"
          ></v-textarea>
        </div>


        <!-- 預約備註 (獨立顯眼區塊) -->
        <div v-if="isEditMode && editableEvent" :class="['mb-4', !appointment.remarks ? 'mt-4' : '']">
          <v-textarea
            v-model="editableEvent.bookingRemarks"
            label="預約備註"
            variant="outlined"
            density="compact"
            auto-grow
            rows="2"
            hide-details="auto"
            bg-color="amber-lighten-5"
            color="warning"
            prepend-inner-icon="mdi-note-text-outline"
          ></v-textarea>
        </div>
        <v-alert
          v-else-if="!isEditMode && !isEditingBookingRemarks && appointment.bookingRemarks"
          variant="tonal" color="warning" icon="mdi-note-text-outline"
          border="start" :class="['mb-4', !appointment.remarks ? 'mt-4' : 'mt-2', 'cursor-pointer']"
          style="white-space: pre-wrap; word-wrap: break-word;"
          @click="canEdit ? startInlineEdit('bookingRemarks') : null"
          :title="canEdit ? '點擊即可編輯預約備註' : ''"
        >
          <template v-slot:title><div class="font-weight-bold">預約備註 <v-icon v-if="canEdit" size="x-small" color="grey-darken-1">mdi-pencil</v-icon></div></template>
          {{ appointment.bookingRemarks }}
        </v-alert>

        <div v-else-if="!isEditMode && canEdit && (!appointment.bookingRemarks || isEditingBookingRemarks)" :class="['mb-4', !appointment.remarks ? 'mt-4' : 'mt-2']">
           <v-textarea
            v-if="isEditingBookingRemarks"
            v-model="inlineEditingValues.bookingRemarks"
            label="預約備註"
            variant="outlined"
            density="compact"
            auto-grow
            rows="2"
            hide-details="auto"
            bg-color="amber-lighten-5"
            color="warning"
            prepend-inner-icon="mdi-note-text-outline"
            autofocus
            :loading="isSavingInline"
            @blur="saveInlineRemark('bookingRemarks')"
          ></v-textarea>
          <v-btn v-else-if="!appointment.bookingRemarks" variant="text" color="warning" prepend-icon="mdi-plus" @click="startInlineEdit('bookingRemarks')" size="small">新增預約備註</v-btn>
        </div>

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
                  <!-- 編輯模式：日期/時段選擇器 (僅在驗屋與預約詳情面板中顯示) -->
                  <template v-if="isEditMode && editableEvent && panel.title === '驗屋與預約詳情'">
                    <v-row dense>
                      <v-col cols="12" md="auto">
                        <div class="text-caption text-grey-darken-1 mb-1">
                          <v-icon size="small" start>mdi-calendar-edit</v-icon>修改預約日期
                        </div>
                        <div class="position-relative">
                          <VueDatePicker
                            v-model="editableEvent.appointmentDate"
                            auto-apply locale="zh-TW" format="yyyy-MM-dd"
                            :enable-time-picker="false" :month-change-on-scroll="false"
                            @update:model-value="handleDateChange" :min-date="new Date()"
                          >
                            <template #day="{ date }">
                              <div class="custom-day-cell">
                                <div class="date-number">{{ date.getDate() }}</div>
                                <div v-if="dateMarkers[format(date, 'yyyy-MM-dd')]" class="date-marker">
                                  <v-icon :icon="dateMarkers[format(date, 'yyyy-MM-dd')].icon" :color="dateMarkers[format(date, 'yyyy-MM-dd')].color" size="x-small"></v-icon>
                                </div>
                              </div>
                            </template>
                          </VueDatePicker>
                          <v-overlay :model-value="isFetchingCalendarData" contained class="align-center justify-center">
                            <v-progress-circular indeterminate color="white"></v-progress-circular>
                          </v-overlay>
                        </div>
                        <div class="d-flex align-center justify-start ga-4 mt-2 text-caption text-medium-emphasis">
                          <div class="d-flex align-center ga-1"><v-icon icon="mdi-circle-outline" color="green" size="small"></v-icon><span>本戶批次</span></div>
                          <div class="d-flex align-center ga-1"><v-icon icon="mdi-triangle-outline" color="blue" size="small"></v-icon><span>其他批次</span></div>
                        </div>
                      </v-col>
                      <v-col cols="12" md>
                        <div class="text-caption text-grey-darken-1 mb-1">
                          <v-icon size="small" start>mdi-clock-edit-outline</v-icon>修改預約時段
                        </div>
                        <div v-if="isFetchingSlots" class="text-center pa-4 border rounded">
                          <v-progress-circular indeterminate color="primary" size="24" class="mb-2"></v-progress-circular>
                          <div class="text-caption text-grey">查詢可預約時段...</div>
                        </div>
                        <div v-else-if="!editableEvent.appointmentDate" class="text-caption text-grey pa-4 border rounded">請先選擇預約日期</div>
                        <div v-else-if="availableTimeSlots.length === 0" class="text-caption text-grey pa-4 border rounded">此日期無可預約時段，請手動輸入</div>
                        <v-chip-group v-else v-model="editableEvent.appointmentTimeSlot" column mandatory filter>
                          <v-chip v-for="slot in availableTimeSlots" :key="slot.value" :value="slot.value" variant="outlined" color="blue" label size="large" class="ma-1">{{ slot.title }}</v-chip>
                        </v-chip-group>
                        <v-text-field v-model="editableEvent.manualTimeSlot" label="手動輸入時段" placeholder="HH:MM" variant="outlined" density="compact" class="mt-4" :rules="[manualTimeRule]" persistent-hint hint="若無可用時段，請手動輸入 24 小時制時間"></v-text-field>
                        <div v-if="timeSlotError" class="v-input__details text-error px-2 pt-1"><div class="v-messages__message">{{ timeSlotError }}</div></div>
                      </v-col>
                    </v-row>
                    <v-divider class="my-3"></v-divider>
                  </template>

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

                  <!-- 額外預約資訊 (動態 customFields) -->
                  <template v-if="panel.title === '驗屋與預約詳情' && additionalFields.length > 0">
                    <v-divider class="my-3" color="primary"></v-divider>
                    <div class="d-flex align-center text-subtitle-2 text-primary font-weight-bold mb-2">
                       <v-icon start size="small">mdi-playlist-plus</v-icon>
                       額外預約資訊 ({{ editableEvent?.inspectionMethod || appointment.inspectionMethod || appointment.bookingMethod }})
                    </div>
                    <div class="bg-blue-grey-lighten-5 rounded pa-3">
                        <v-row v-for="item in additionalFields" :key="item.key || item.label" dense class="mb-1" align="center">
                          <v-col cols="12" sm="4" class="text-caption text-grey-darken-2 font-weight-bold">{{ item.label }}</v-col>
                          <v-col cols="12" sm="8">
                            <!-- 編輯模式：顯示可輸入欄位 -->
                            <v-text-field
                              v-if="isEditMode && editableEvent && item.key"
                              v-model="editableEvent._bookingMethodDetails[item.key]"
                              :placeholder="item.label"
                              density="compact"
                              hide-details="auto"
                              variant="outlined"
                            ></v-text-field>
                            <!-- 檢視模式：顯示文字 -->
                            <span v-else class="text-body-2">{{ item.value || '-' }}</span>
                          </v-col>
                        </v-row>
                    </div>
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

<v-dialog v-model="isForceConfirmVisible" max-width="500px" persistent>
      <v-card>
        <v-card-title class="text-h6 d-flex align-center bg-error">
          <v-icon start>mdi-alert-outline</v-icon>
          <span>確認強制儲存</span>
        </v-card-title>
        <v-card-text class="pt-4">
          <p class="mb-2">請再次確認：</p>
          <v-alert type="error" variant="tonal" density="compact" class="mb-4">
            {{ forceErrorMessage }}
          </v-alert>
          <p>選擇日期或時段不在規則內，您確定要強制儲存變更嗎？</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="isForceConfirmVisible = false; payloadToForce = null;">取消</v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="handleForceSave"
            :loading="isForcingSave"
          >
            是，強制儲存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

</template>

<script setup>
import { ref, watch, computed, nextTick, reactive } from 'vue'; 
import { useDate } from 'vuetify';
import { format } from 'date-fns';
import { getSlotsForAdmin, fetchProjectConfig,updateAppointment } from '@/api';
import { vDraggableDialog } from '@/directives/vDraggableDialog';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

const isForceConfirmVisible = ref(false); // 控制強制儲存確認對話框的顯示
const payloadToForce = ref(null); // 用於儲存要強制儲存的 payload { appointmentId, householdDocId, bookingPayload, householdPayload }
const forceErrorMessage = ref(''); // 顯示給使用者的錯誤訊息
const isForcingSave = ref(false); // 強制儲存按鈕的 loading 狀態

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

const emit = defineEmits(['update:modelValue', 'save', 'inline-save', 'cancel-appointment', 'update-inspectors', 'request-calendar-data']);

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

// 快速編輯狀態
const isEditingImportantRemarks = ref(false);
const isEditingBookingRemarks = ref(false);
const isSavingInline = ref(false);
const inlineEditingValues = reactive({ remarks: '', bookingRemarks: '' });

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
  { title: '系統功能', fields: [ { key: 'showInMenu', label: '預約系統', icon: 'mdi-calendar-sync', isSwitch: true }, { key: 'allowMultipleBookings', label: '允許重複預約', icon: 'mdi-account-multiple-check-outline', isSwitch: true }, { key: 'initialReportUploadSwitch', label: '初驗報告上傳', icon: 'mdi-upload-network-outline', isSwitch: true }, { key: 'reInspectionReportUploadSwitch', label: '複驗報告上傳', icon: 'mdi-upload-network', isSwitch: true }, { key: 'initialInspectionBatch', label: '初驗批次', icon: 'mdi-numeric-1-box-multiple-outline' }, { key: 'reInspectionBatch', label: '複驗批次', icon: 'mdi-numeric-2-box-multiple-outline' }, ]},
  { title: '基本資料', fields: [ { key: 'address', label: '門牌', icon: 'mdi-map-marker-outline' }, { key: 'parkingLots', label: '車位', icon: 'mdi-car-outline' }, { key: 'buyerName', label: '買方姓名', icon: 'mdi-account-star-outline' }, { key: 'buyerPhone', label: '買方電話', icon: 'mdi-phone-outline', isTel: true }, { key: 'buyerEmail', label: '買方EMAIL', icon: 'mdi-email-outline', isMail: true }, { key: 'buyerIdNumber', label: '買方身分證', icon: 'mdi-card-account-details-outline' },{ key: 'appropriationDate', label: '撥款日期', icon: 'mdi-cash-check', isDate: true }, { key: 'bank', label: '銀行', icon: 'mdi-bank-outline' } ]},
  { title: '預約人資料', fields: [ { key: 'bookerName', label: '預約人姓名', icon: 'mdi-account-outline' }, { key: 'bookerPhone', label: '預約人電話', icon: 'mdi-cellphone', isTel: true }, { key: 'bookerEmail', label: '預約人EMAIL', icon: 'mdi-email-outline', isMail: true }, { key: 'bookerIdNumber', label: '預約人身分證', icon: 'mdi-card-account-details-outline' } ]},
  { title: '驗屋與預約詳情', fields: [ { key: 'bookingType', label: '預約項目', icon: 'mdi-format-list-checks' }, { key: 'inspectionMethod', label: '選擇方式', icon: 'mdi-cog-outline' }, { key: 'agentName', label: '受託人姓名', icon: 'mdi-account-tie-outline' }, { key: 'agentPhone', label: '受託人電話', icon: 'mdi-phone-in-talk-outline', isTel: true } ]},
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

const bookingTypeOptions = computed(() => {
  const menu = projectConfig.value?.bookingMenu;
  if (Array.isArray(menu)) {
    return menu.filter(item => !item.deleted).map(item => item.title);
  }
  return projectConfig.value?.bookingTypes || [];
});

// 根據選中的 bookingType 動態取得對應的選擇方式
const bookingMethodOptions = computed(() => {
  const menu = projectConfig.value?.bookingMenu;
  const selectedType = editableEvent.value?.bookingType || props.appointment?.bookingType;
  if (Array.isArray(menu) && selectedType) {
    const matchedItem = menu.find(item => item.title === selectedType && !item.deleted);
    if (matchedItem && Array.isArray(matchedItem.methods)) {
      return matchedItem.methods.filter(m => !m.deleted).map(m => m.title);
    }
  }
  return projectConfig.value?.bookingMethodOptions || [];
});

// 當 bookingType 變更時，清空 inspectionMethod（因為方式已不對應）
watch(() => editableEvent.value?.bookingType, (newType, oldType) => {
  if (isEditMode.value && oldType && newType !== oldType) {
    editableEvent.value.inspectionMethod = '';
    // 同時清空動態欄位（不同預約項目的 customFields 不同）
    editableEvent.value._bookingMethodDetails = {};
  }
});



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
    // 3. 獲取建案設定 (例如：預約類型、選擇方式等下拉選單)
    const config = await fetchProjectConfig(props.appointment.projectId);
    projectConfig.value = config;

    // 4. 建立一個乾淨的資料複本以供編輯
    const cleanCopy = {};
    const allKeys = new Set();
    fieldConfig.forEach(panel => panel.fields.forEach(field => allKeys.add(field.key)));
    allKeys.add('appointmentDate');
    allKeys.add('appointmentTimeSlot');
    allKeys.add('bookingRemarks');
    
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

    // 複製 bookingMethodDetails 到可編輯物件中（用於動態 customFields 編輯）
    const originalDetails = props.appointment.bookingMethodDetails || {};
    cleanCopy._bookingMethodDetails = { ...originalDetails };

    editableEvent.value = cleanCopy;

    // 5. 切換到編輯模式，僅展開「驗屋與預約詳情」面板方便用戶聚焦
    isEditMode.value = true;
    panels.value = [3];

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



async function saveChanges() {
  // 1. 開始 loading (初次嘗試儲存)
  isSaving.value = true;
  payloadToForce.value = null; // 清除之前的強制儲存 payload
  forceErrorMessage.value = '';

  // --- 計算 bookingPayload 和 householdPayload (保留現有邏輯) ---
  const bookingPayload = {};
  const householdPayload = {};
  const householdKeys = new Set([ /* ... 您的戶別欄位鍵名 ... */
    'address', 'parkingLots', 'buyerName', 'buyerPhone', 'buyerEmail', 'buyerIdNumber',
    'appropriationDate', 'bank', 'initialInspectionBatch', 'reInspectionBatch',
    'showInMenu', 'allowMultipleBookings', 'initialReportUploadSwitch', 'reInspectionReportUploadSwitch'
  ]);
  const dateKeys = new Set(
    fieldConfig.flatMap(p => p.fields).filter(f => f.isDate).map(f => f.key)
  );
const allFieldKeys = fieldConfig.flatMap(panel => panel.fields.map(field => field.key));
  const keysToCompare = [...new Set([...allFieldKeys, 'appointmentDate', 'appointmentTimeSlot', 'manualTimeSlot', 'bookingRemarks'])];

  keysToCompare.forEach(key => {
    // ... (比較原始值和編輯後的值，填充 payload 的邏輯) ...
        if (key === 'inspectionDocsUrl' || key === 'inspectionReportUrl') return;
    const originalValue = props.appointment[key];
    const editedValue = editableEvent.value[key];
    let changeDetected = false;
    if (key === 'appointmentDate' || dateKeys.has(key)) {
      let originalStr = '';
      let editedStr = '';

      if (originalValue) {
        const oDate = (typeof originalValue.toDate === 'function') ? originalValue.toDate() : new Date(originalValue);
        if (!isNaN(oDate.getTime())) {
          originalStr = format(oDate, 'yyyy-MM-dd');
        }
      }

      if (editedValue) {
        // 如果是字串格式 yyyy-MM-dd，Date 建構在不同瀏覽器可能轉為 UTC，改以穩定方式處理
        const eDate = typeof editedValue === 'string' && editedValue.includes('-') 
                      ? new Date(editedValue.split('-').join('/')) 
                      : new Date(editedValue);
        if (!isNaN(eDate.getTime())) {
          editedStr = format(eDate, 'yyyy-MM-dd');
        }
      }

      if (originalStr !== editedStr) {
        changeDetected = true;
      }
    } else {
      if (String(originalValue ?? '') !== String(editedValue ?? '')) {
        changeDetected = true;
      }
    }
    if (changeDetected) {
      let valueToSave = editedValue;
      if ((key === 'appointmentDate' || dateKeys.has(key)) && editedValue) {
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

  // --- 動態 customFields (bookingMethodDetails) 變更偵測 ---
  const originalDetails = props.appointment.bookingMethodDetails || {};
  const editedDetails = editableEvent.value._bookingMethodDetails || {};
  const updatedDetails = {};
  let detailsChanged = false;
  for (const [uuid, editedVal] of Object.entries(editedDetails)) {
    const originalVal = originalDetails[uuid] ?? '';
    if (String(originalVal) !== String(editedVal ?? '')) {
      detailsChanged = true;
    }
    updatedDetails[uuid] = editedVal;
  }
  if (detailsChanged) {
    bookingPayload.bookingMethodDetails = updatedDetails;
    // 同步更新 bookingMethodDetailsDisplay 陣列
    const labelMap = buildCustomFieldLabelMap(projectConfig.value?.bookingMenu);
    bookingPayload.bookingMethodDetailsDisplay = Object.entries(updatedDetails).map(([uuid, val]) => ({
      label: labelMap[uuid] || uuid,
      value: val
    }));
  }
  // --- Payload 計算結束 ---

  if (Object.keys(bookingPayload).length === 0 && Object.keys(householdPayload).length === 0) {
    console.log('No changes detected.');
    isEditMode.value = false;
    isSaving.value = false;
    return;
  }

  // 3. 執行初次儲存嘗試
  try {
    const currentPayload = {
      appointmentId: props.appointment.id,
      householdDocId: props.appointment.householdDocId || `${props.appointment.projectId}_${props.appointment.unitId}`,
      bookingPayload,
      householdPayload,
    };
    console.log('Attempting initial save with payload:', currentPayload);
    await updateAppointment(currentPayload.appointmentId, currentPayload.bookingPayload, currentPayload.householdDocId, currentPayload.householdPayload);

    console.log('Initial save successful.');
    emit('save', currentPayload);
    isEditMode.value = false;

  } catch (error) {
  console.error("Initial save failed:", error);
  const errorMessage = error.message || '儲存失敗';

  console.log('--- Debugging Force Dialog Condition ---');
  console.log('Error Message:', errorMessage);

  const isRuleError = errorMessage.includes('不在可預約範圍內') || errorMessage.includes('規則已被刪除');
  const isSlotFullError = errorMessage.startsWith('SLOT_FULL:');
  const isMethodError = errorMessage.includes('不適用於選擇方式');

  // ✅【修改】放寬判斷條件，只要包含 "時段" 和 "不存在" 即可
  const isSlotNotFoundError = errorMessage.includes('時段') && errorMessage.includes('不存在'); // <-- ✅ 修改這行

  console.log('isRuleError:', isRuleError);
  console.log('isSlotFullError:', isSlotFullError);
  console.log('isMethodError:', isMethodError);
  console.log('isSlotNotFoundError:', isSlotNotFoundError); // <-- 檢查這次是否變為 true
  const combinedErrorCheck = (isRuleError || isSlotFullError || isMethodError || isSlotNotFoundError);
  console.log('Combined Error Check:', combinedErrorCheck);
  console.log('props.canEdit:', props.canEdit);
  console.log('--- End Debugging ---');


  if (combinedErrorCheck && props.canEdit) {
    console.log('✅ Condition met, should show dialog now! Error:', errorMessage);
    forceErrorMessage.value = errorMessage;
    payloadToForce.value = {
      appointmentId: props.appointment.id,
      householdDocId: props.appointment.householdDocId || `${props.appointment.projectId}_${props.appointment.unitId}`,
      bookingPayload,
      householdPayload,
    };
    console.log('Setting isForceConfirmVisible to true');
    isForceConfirmVisible.value = true;
  } else {
     console.log('Condition NOT met for showing dialog.');
     console.error(`儲存預約失敗 (Dialog condition not met): ${errorMessage}`);
     // 在此顯示 Snackbar 錯誤提示
  }
} finally {
  isSaving.value = false;
}
}

// ✅ handleForceSave 函數保持不變 (它已經會傳遞 force: true)
async function handleForceSave() {
  if (!payloadToForce.value) return;
  isForcingSave.value = true;
  try {
    const forcePayload = { ...payloadToForce.value };
    console.log('Attempting force save with payload:', forcePayload);
    // ✓ 呼叫 API 並明確傳遞 force: true
    await updateAppointment(forcePayload.appointmentId, forcePayload.bookingPayload, forcePayload.householdDocId, forcePayload.householdPayload, true);

    console.log('Force save successful.');
    emit('save', forcePayload);
    isForceConfirmVisible.value = false;
    isEditMode.value = false;
  } catch (error) {
    console.error("Force save failed:", error);
    forceErrorMessage.value = `強制儲存失敗：${error.message || '未知錯誤'}`;
    console.error(`強制儲存預約失敗: ${error.message}`);
  } finally {
    isForcingSave.value = false;
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

// 快速編輯處理
function startInlineEdit(field) {
  if (field === 'importantRemarks') {
    inlineEditingValues.remarks = props.appointment?.remarks || '';
    isEditingImportantRemarks.value = true;
  } else if (field === 'bookingRemarks') {
    inlineEditingValues.bookingRemarks = props.appointment?.bookingRemarks || '';
    isEditingBookingRemarks.value = true;
  }
}

async function saveInlineRemark(field) {
  const originalValue = field === 'remarks' ? props.appointment?.remarks : props.appointment?.bookingRemarks;
  const newValue = inlineEditingValues[field];
  
  if (originalValue === newValue) {
    // 沒變動直接關閉編輯狀態
    if (field === 'remarks') isEditingImportantRemarks.value = false;
    else isEditingBookingRemarks.value = false;
    return;
  }

  isSavingInline.value = true;
  try {
    const bookingPayload = {};
    const householdPayload = {};
    const householdDocId = props.appointment.householdDocId || `${props.appointment.projectId}_${props.appointment.unitId}`;

    if (field === 'remarks') {
      householdPayload['remarks'] = newValue; // 重要備註存於戶別
    } else {
      bookingPayload['bookingRemarks'] = newValue; // 預約備註存於預約
    }

    await updateAppointment(
      props.appointment.id, 
      bookingPayload, 
      householdDocId, 
      householdPayload
    );

    // 成功後直接修改本地 reference 以達到即時渲染的效果
    if (field === 'remarks') {
      props.appointment.remarks = newValue;
    } else {
      props.appointment.bookingRemarks = newValue;
    }

    // 發射專屬於 inline-edit 的事件，避免觸發父層監聽的 'save' 導致對話框自動關閉
    const savedPayload = {
      appointmentId: props.appointment.id,
      householdDocId: householdDocId,
      bookingPayload,
      householdPayload
    };
    emit('inline-save', savedPayload);

  } catch (error) {
    console.error(`快速儲存備註失敗:`, error);
    // 可加入全域錯誤提示，例如使用 Snackbar
  } finally {
    isSavingInline.value = false;
    if (field === 'remarks') isEditingImportantRemarks.value = false;
    else isEditingBookingRemarks.value = false;
  }
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

    // [New] Fetch project config to decode dynamic fields
    if (!projectConfig.value) { // Or check ID if you handle multiple projects switch
         fetchProjectConfig(props.appointment.projectId).then(config => {
             projectConfig.value = config;
         });
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

// 從 bookingMenu 中所有 methods 的 customFields 建立 UUID → label 映射表
function buildCustomFieldLabelMap(bookingMenu) {
  const map = {};
  if (!Array.isArray(bookingMenu)) return map;
  for (const item of bookingMenu) {
    if (!Array.isArray(item.methods)) continue;
    for (const method of item.methods) {
      if (method.deleted) continue;
      if (!Array.isArray(method.customFields)) continue;
      for (const cf of method.customFields) {
        if (cf.id && cf.label) {
          map[cf.id] = cf.label;
        }
      }
    }
  }
  return map;
}

// 根據 bookingType + inspectionMethod 從 bookingMenu 取得該方式的 customFields 定義
function getMethodCustomFields(bookingMenu, bookingType, methodName) {
  if (!Array.isArray(bookingMenu) || !bookingType || !methodName) return [];
  const menuItem = bookingMenu.find(item => item.title === bookingType && !item.deleted);
  if (!menuItem || !Array.isArray(menuItem.methods)) return [];
  const method = menuItem.methods.find(m => m.title === methodName && !m.deleted);
  if (!method || !Array.isArray(method.customFields)) return [];
  return method.customFields;
}

// 動態顯示 customFields 額外欄位
const additionalFields = computed(() => {
    if (!props.appointment) return [];

    const menu = projectConfig.value?.bookingMenu;

    // ===== 編輯模式：根據 bookingMenu 定義產生所有 customFields =====
    if (isEditMode.value && editableEvent.value && menu) {
      const selectedType = editableEvent.value.bookingType || props.appointment.bookingType;
      const selectedMethod = editableEvent.value.inspectionMethod || props.appointment.inspectionMethod;
      const customFields = getMethodCustomFields(menu, selectedType, selectedMethod);
      if (customFields.length === 0) return [];

      // 確保 _bookingMethodDetails 中每個欄位都有初始值
      if (!editableEvent.value._bookingMethodDetails) {
        editableEvent.value._bookingMethodDetails = {};
      }
      return customFields.map(cf => {
        // 若 _bookingMethodDetails 中尚無此 key，初始化為空字串
        if (editableEvent.value._bookingMethodDetails[cf.id] === undefined) {
          editableEvent.value._bookingMethodDetails[cf.id] = '';
        }
        return {
          key: cf.id,
          label: cf.label,
          value: editableEvent.value._bookingMethodDetails[cf.id] || '-'
        };
      });
    }

    // ===== 檢視模式：從 appointment 資料讀取 =====
    const details = props.appointment.bookingMethodDetails;

    // 優先使用 bookingMethodDetailsDisplay + 配合 bookingMethodDetails 的 UUID key
    if (Array.isArray(props.appointment.bookingMethodDetailsDisplay) && props.appointment.bookingMethodDetailsDisplay.length > 0) {
      const labelToKey = {};
      if (details) {
        const labelMap = buildCustomFieldLabelMap(menu);
        for (const [uuid, _] of Object.entries(details)) {
          const label = labelMap[uuid];
          if (label) labelToKey[label] = uuid;
        }
      }
      return props.appointment.bookingMethodDetailsDisplay.map(item => ({
        key: labelToKey[item.label] || null,
        label: item.label || '未知欄位',
        value: Array.isArray(item.value) ? item.value.join(', ') : (item.value || '-')
      }));
    }

    // 備用：從 bookingMethodDetails (UUID map) + bookingMenu customFields 映射 label
    if (!details || !menu) return [];
    const labelMap = buildCustomFieldLabelMap(menu);
    const result = [];
    for (const [key, value] of Object.entries(details)) {
      const label = labelMap[key];
      if (label) {
        const formattedValue = Array.isArray(value) ? value.join(', ') : value;
        result.push({ key, label, value: formattedValue || '-' });
      }
    }
    return result;
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

.edit-mode-header {
  background-color: #e3f2fd;
  border-left: 4px solid #1976d2;
}
</style>