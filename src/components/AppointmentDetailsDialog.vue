<template>
  <v-dialog :model-value="modelValue" @update:model-value="closeDialog" max-width="800px" persistent scrollable>
    <v-card v-if="appointment">
      <v-card-title class="text-h6 d-flex align-center bg-blue-lighten-5" style="cursor: move;" v-draggable-dialog>
        <v-icon start color="primary">mdi-calendar-text</v-icon>
        <span>預約詳細資訊</span>
        <v-spacer></v-spacer>
        <v-btn variant="text" icon="mdi-close" density="compact" @click="closeDialog"></v-btn>
      </v-card-title>
      
      <v-card-text>
        <div class="bg-grey-lighten-5 pa-4 rounded">
          <v-row align="center" dense>
            <v-col cols="12" sm="2">
              <div class="text-caption text-grey-darken-1">戶別</div>
              <div class="text-h5 font-weight-bold text-primary">{{ appointment.unitId }}</div>
            </v-col>
            
            <v-col cols="12" sm="6">
              <div class="text-caption text-grey-darken-1">預約日期與時段</div>
              <div v-if="!isEditMode" class="text-body-1 font-weight-medium">
                {{ formatDate(appointment.appointmentDate, 'yyyy-MM-dd') }}
                <v-icon size="small" class="mx-1">mdi-clock-outline</v-icon>
                {{ appointment.appointmentTimeSlot }}
              </div>
              <div v-else>
                <div class="d-flex flex-column flex-sm-row ga-2">
                  <v-text-field
                    v-model="editableEvent.appointmentDate"
                    label="預約日期" type="date" hide-details="auto"
                    variant="outlined" density="compact" style="min-width: 155px;"
                  ></v-text-field>
                  <v-combobox
                    v-model="editableEvent.appointmentTimeSlot"
                    :items="timeSlotOptions" label="預約時段" placeholder="格式 HH:mm"
                    :loading="isTimeSlotLoading" :disabled="!editableEvent.appointmentDate"
                    hide-details="auto" no-data-text="此日期無可用時段"
                    variant="outlined" density="compact" style="min-width: 200px;"
                  ></v-combobox>
                </div>
              </div>
            </v-col>

            <v-col cols="12" sm="4" class="d-flex flex-wrap ga-2 justify-start justify-sm-end">
              <v-chip :color="getStatusColor(appointment.status)" size="small" label>{{ appointment.status }}</v-chip>
              <v-chip v-if="appointment.bookingType" color="teal" variant="tonal" size="small" label>{{ appointment.bookingType }}</v-chip>
            </v-col>
          </v-row>
          
          <v-row dense class="mt-2" v-if="canEdit">
            <v-col cols="12">
              <v-select
                v-model="editableInspectors"
                :items="bookingOptions.inspectionStaff"
                label="驗屋人員 (修改後即時儲存)"
                multiple chips closable-chips clearable
                variant="outlined" density="compact" hide-details
                :loading="isSavingInspectors"
                @update:model-value="handleInspectorsChange"
              ></v-select>
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
                <v-list lines="two" density="compact">
                  <template v-for="(field, index) in panel.fields" :key="field.key">
                    <v-list-item class="py-2">
                      <template v-slot:prepend><v-icon :icon="field.icon" class="mt-n4"></v-icon></template>
                      
                      <div v-if="isEditMode && editableFields.has(field.key)">
                        <v-text-field
                          dense class="mt-2"
                          v-model="editableEvent[field.key]"
                          :label="field.label"
                          density="compact" hide-details="auto" variant="outlined"
                        ></v-text-field>
                      </div>
                      <div v-else>
                        <v-list-item-subtitle>{{ field.label }}</v-list-item-subtitle>
                        <v-list-item-title>
                          <template v-if="field.key === 'inspectionReportUrl'">
                            <span v-if="!inspectionReportFiles || inspectionReportFiles.length === 0">無</span>
                            <v-btn
                              v-else v-for="(file, i) in inspectionReportFiles" :key="i"
                              variant="text" size="small" :href="file.url" target="_blank"
                              class="text-none pa-1" color="primary"
                            >
                              <template v-slot:prepend><v-icon color="red" size="20">mdi-file-pdf-box</v-icon></template>
                              {{ file.name }}
                            </v-btn>
                          </template>
                          <template v-else-if="field.key === 'inspectionDocsUrl'">
                            <v-btn v-if="appointment.inspectionDocsUrl" :href="appointment.inspectionDocsUrl" target="_blank" size="small" variant="tonal" color="indigo">
                              <v-icon start>mdi-folder-google-drive</v-icon> 開啟雲端資料夾
                            </v-btn>
                            <span v-else>無</span>
                          </template>
                          <a v-else-if="field.isTel" :href="`tel:${appointment[field.key]}`" class="text-decoration-none text-primary">{{ appointment[field.key] || '無' }}</a>
                          <a v-else-if="field.isMail" :href="`mailto:${appointment[field.key]}`" class="text-decoration-none text-primary">{{ appointment[field.key] || '無' }}</a>
                          <span v-else>{{ appointment[field.key] || '無' }}</span>
                        </v-list-item-title>
                      </div>
                    </v-list-item>
                    <v-divider v-if="index < panel.fields.length - 1"></v-divider>
                  </template>
                </v-list>
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
          <v-btn v-if="canEdit && appointment.status !== '取消'" color="primary" variant="flat" @click="enterEditMode">編輯</v-btn>
        </div>
        <div v-else class="d-flex w-100">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="isEditMode = false">取消</v-btn>
          <v-btn color="success" variant="flat" :loading="isSaving" @click="saveChanges">儲存</v-btn>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed, nextTick } from 'vue'; // ✅ 引入 nextTick
import { useDate } from 'vuetify';
import { format } from 'date-fns';
import { getSlotsForAdmin } from '@/api';
import { vDraggableDialog } from '@/directives/vDraggableDialog';

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  appointment: { type: Object, default: null },
  canEdit: { type: Boolean, default: false },
  bookingOptions: { type: Object, default: () => ({}) },
  bookingHistory: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:modelValue', 'save', 'cancel-appointment', 'update-inspectors']);

const dateAdapter = useDate();
const isEditMode = ref(false);
const editableEvent = ref(null);
const editableInspectors = ref([]);
const isSaving = ref(false);
const isSavingInspectors = ref(false);
const timeSlotOptions = ref([]);
const isTimeSlotLoading = ref(false);
const panels = ref([]);

// ✓ 修改：使用完整的 fieldConfig
const fieldConfig = [
  { title: '基本資料', fields: [ { key: 'address', label: '門牌', icon: 'mdi-map-marker-outline' }, { key: 'parkingLots', label: '車位', icon: 'mdi-car-outline' }, { key: 'buyerName', label: '買方姓名', icon: 'mdi-account-star-outline' }, { key: 'buyerPhone', label: '買方電話', icon: 'mdi-phone-outline', isTel: true }, { key: 'buyerEmail', label: '買方EMAIL', icon: 'mdi-email-outline', isMail: true }, { key: 'buyerIdNumber', label: '買方身分證', icon: 'mdi-card-account-details-outline' } ]},
  { title: '預約人資料', fields: [ { key: 'bookerName', label: '預約人姓名', icon: 'mdi-account-outline' }, { key: 'bookerPhone', label: '預約人電話', icon: 'mdi-cellphone', isTel: true }, { key: 'bookerEmail', label: '預約人EMAIL', icon: 'mdi-email-outline', isMail: true }, { key: 'bookerIdNumber', label: '預約人身分證', icon: 'mdi-card-account-details-outline' } ]},
  { title: '驗屋與預約詳情', fields: [ { key: 'bookingType', label: '預約項目', icon: 'mdi-format-list-checks' }, { key: 'inspectionMethod', label: '驗屋方式', icon: 'mdi-cog-outline' }, { key: 'inspectionCompanyName', label: '代驗公司', icon: 'mdi-domain' }, { key: 'agentName', label: '受託人姓名', icon: 'mdi-account-tie-outline' }, { key: 'agentPhone', label: '受託人電話', icon: 'mdi-phone-in-talk-outline', isTel: true }, { key: 'bookingRemarks', label: '預約備註', icon: 'mdi-note-text-outline' }, ]},
  { title: '相關文件與批次', fields: [ { key: 'appropriationDate', label: '撥款日期', icon: 'mdi-cash-check' }, { key: 'bank', label: '銀行', icon: 'mdi-bank-outline' }, { key: 'bankContact', label: '銀行窗口', icon: 'mdi-account-tie-outline' }, { key: 'inspectionDocsUrl', label: '驗屋文件', icon: 'mdi-file-document-outline' }, { key: 'inspectionReportUrl', label: '驗屋報告', icon: 'mdi-file-chart-outline' }, { key: 'initialInspectionBatch', label: '初驗批次', icon: 'mdi-numeric-1-box-multiple-outline' }, { key: 'reInspectionBatch', label: '複驗批次', icon: 'mdi-numeric-2-box-multiple-outline' }, ]}
];

const editableFields = new Set([
  'bookerName', 'bookerPhone', 'bookerEmail', 'bookerIdNumber', 
  'bookingType', 'inspectionMethod', 'inspectionCompanyName', 
  'agentName', 'agentPhone', 'bookingRemarks'
]);

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

function enterEditMode() {
  const cleanCopy = {};
  const allKeys = new Set();
  fieldConfig.forEach(panel => panel.fields.forEach(field => allKeys.add(field.key)));
  allKeys.add('appointmentDate');
  allKeys.add('appointmentTimeSlot');
  
  allKeys.forEach(key => {
    const value = props.appointment[key];
    if (key === 'appointmentDate') {
      cleanCopy[key] = formatDate(value, 'yyyy-MM-dd');
    } else {
      cleanCopy[key] = value ?? '';
    }
  });

  editableEvent.value = cleanCopy;
  isEditMode.value = true;
  panels.value = [0, 1, 2, 3];
}

function saveChanges() {
  isSaving.value = true;
  const bookingPayload = {};
  const keysToCompare = [...editableFields, 'appointmentDate', 'appointmentTimeSlot'];

  keysToCompare.forEach(key => {
    let originalValue = props.appointment[key];
    let editedValue = editableEvent.value[key];

    if (key === 'appointmentDate') {
      originalValue = formatDate(originalValue, 'yyyy-MM-dd');
    }

    if (String(originalValue ?? '') !== String(editedValue ?? '')) {
      bookingPayload[key] = editedValue;
    }
  });
  
  if (Object.keys(bookingPayload).length > 0) {
    emit('save', {
      appointmentId: props.appointment.id,
      householdDocId: `${props.appointment.projectId}_${props.appointment.unitId}`,
      bookingPayload,
      householdPayload: {},
    });
  } else {
    isEditMode.value = false;
  }
  isSaving.value = false;
}

async function handleInspectorsChange(newInspectors) {
  if (!props.appointment) return;
  
  // 這裡不再呼叫 API，而是發出一個事件通知父組件
  emit('update-inspectors', {
    appointmentId: props.appointment.id,
    inspectors: newInspectors
  });
}

watch(() => editableEvent.value?.appointmentDate, async (newDate) => {
  if (!isEditMode.value || !newDate || !props.appointment?.projectId) {
    timeSlotOptions.value = [];
    return;
  }
  isTimeSlotLoading.value = true;
  try {
    const slots = await getSlotsForAdmin(props.appointment.projectId, newDate);
    timeSlotOptions.value = slots.map(s => s.split(' ')[0]);
  } catch (error) {
    console.error("獲取時段失敗:", error);
    timeSlotOptions.value = [];
  } finally {
    isTimeSlotLoading.value = false;
  }
});

watch(() => props.modelValue, (isOpen) => {
  if (isOpen && props.appointment) {
    isEditMode.value = false;
    panels.value = [];
    const inspectors = props.appointment.inspectors;
    if (typeof inspectors === 'string' && inspectors) {
      editableInspectors.value = inspectors.split(',').map(name => name.trim()).filter(Boolean);
    } else {
      editableInspectors.value = [];
    }
  }
});

const closeDialog = () => {
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