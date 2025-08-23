<template>
  <v-container fluid>
    <v-card>
      <v-card-title class="d-flex align-center text-h5 text-primary">
        <v-icon start>mdi-cogs</v-icon>
        <span>預約規則設定</span>
        <v-spacer></v-spacer>
        <v-select
          v-model="selectedProject"
          :items="projectOptions"
          item-title="text"
          item-value="value"
          label="請選擇建案"
          density="compact"
          hide-details
          class="flex-grow-0"
          style="max-width: 250px"
          :disabled="isLoading"
        ></v-select>
      </v-card-title>
      <v-divider></v-divider>

      <div v-if="!selectedProject" class="text-center pa-10 text-grey-darken-1">
        <v-icon size="48" class="mb-2">mdi-office-building-cog-outline</v-icon>
        <div>請先從右上角選擇一個建案以開始設定規則。</div>
      </div>
      
      <div v-else-if="isLoading" class="text-center pa-10">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <div class="mt-4">資料載入中...</div>
      </div>

      <div v-else>
        <v-tabs v-model="activeTab" color="primary" grow>
          <v-tab value="batches">
            <v-icon start>mdi-calendar-month</v-icon>
            預約批次管理
          </v-tab>
          <v-tab value="slots">
            <v-icon start>mdi-clock-outline</v-icon>
            時段規則設定
          </v-tab>
          <v-tab value="capacity">
            <v-icon start>mdi-account-group-outline</v-icon>
            每日名額設定
          </v-tab>
        </v-tabs>
        <v-divider></v-divider>

        <v-window v-model="activeTab">
          <v-window-item value="batches" class="pa-4">
            <v-toolbar flat color="transparent">
              <v-toolbar-title>批次列表</v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn color="primary" @click="openBatchDialog()" prepend-icon="mdi-plus">
                新增批次
              </v-btn>
            </v-toolbar>
            <v-data-table
              :headers="batchHeaders"
              :items="bookingBatches"
              :loading="isBatchLoading"
              items-per-page-text="每頁顯示"
            >
              <template v-slot:item.applicationWindow="{ item }">
                {{ formatDate(item.applicationStart) }} ~ {{ formatDate(item.applicationEnd) }}
              </template>
              <template v-slot:item.bookingWindow="{ item }">
                {{ formatDate(item.bookingStart) }} ~ {{ formatDate(item.bookingEnd) }}
              </template>
              <template v-slot:item.status="{ item }">
                <v-chip :color="getBatchStatus(item).color" variant="flat" size="small">
                  {{ getBatchStatus(item).text }}
                </v-chip>
              </template>
              <template v-slot:item.actions="{ item }">
                <v-btn icon="mdi-pencil" variant="text" size="small" @click="openBatchDialog(item)"></v-btn>
                <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="handleDeleteBatch(item)"></v-btn>
              </template>
            </v-data-table>
          </v-window-item>

          <v-window-item value="slots" class="pa-4">
            <v-row>
              <v-col cols="12" md="6">
                <v-sheet border rounded class="pa-4">
                  <h3 class="text-h6 mb-4">設定條件</h3>
                  <v-row dense>
                    <v-col cols="12">
                      <v-select
                        v-model="selectedSlotRule.bookingType"
                        :items="bookingTypeOptions"
                        label="預約項目"
                        hide-details="auto"
                      ></v-select>
                    </v-col>
                    <v-col cols="12">
                      <v-select
                        v-model="selectedSlotRule.inspectionMethod"
                        :items="inspectionMethodOptions"
                        label="驗屋方式"
                        hide-details="auto"
                      ></v-select>
                    </v-col>
                  </v-row>
                  
                  <v-divider class="my-4"></v-divider>
                  
                  <div v-if="selectedSlotRule.bookingType && selectedSlotRule.inspectionMethod">
                    <v-label class="mb-2">可用時段列表</v-label>
                    <v-combobox
                      v-model="selectedSlotRule.timeSlots"
                      label="輸入或選擇時段 (例如: 09:00)"
                      chips
                      clearable
                      multiple
                      append-icon="mdi-plus-circle-outline"
                      hint="輸入後按 Enter 新增"
                      persistent-hint
                    ></v-combobox>

                    <v-card-actions class="mt-4 pa-0">
                      <v-btn
                        variant="tonal"
                        @click="isCopyDialogVisible = true"
                        prepend-icon="mdi-content-copy"
                      >
                        從範本複製...
                      </v-btn>
                      <v-spacer></v-spacer>
                      <v-btn color="success" @click="handleSaveSlotRule" :loading="isSlotSaving">
                        <v-icon start>mdi-content-save</v-icon>
                        儲存此規則
                      </v-btn>
                    </v-card-actions>
                  </div>
                   <div v-else class="text-center pa-6 text-grey">
                    請先選擇預約項目與驗屋方式
                  </div>
                </v-sheet>
              </v-col>
            </v-row>
          </v-window-item>

          <v-window-item value="capacity" class="pa-4">
            <v-row>
              <v-col cols="12" md="4">
                 <v-date-picker
                    v-model="selectedCapacityDate"
                    title="選擇日期"
                    color="primary"
                    show-adjacent-months
                    hide-header
                    class="w-100"
                  ></v-date-picker>
              </v-col>
              <v-col cols="12" md="8">
                <v-sheet border rounded class="pa-4 h-100">
                   <div v-if="!selectedCapacityDate" class="d-flex align-center justify-center h-100 text-grey">
                     <div>
                       <v-icon size="48">mdi-calendar-cursor</v-icon>
                       <p>請從左側日曆選擇一個日期</p>
                     </div>
                   </div>
                   <div v-else>
                     <h3 class="text-h6 mb-4">設定 {{ formatDate(selectedCapacityDate) }} 的名額上限</h3>
                     <v-row v-if="isCapacityLoading" class="mt-5">
                       <v-col v-for="i in 8" :key="i" cols="6" sm="4" md="3">
                         <v-skeleton-loader type="list-item-two-line"></v-skeleton-loader>
                       </v-col>
                     </v-row>
                     <v-row v-else dense>
                       <v-col v-for="slot in timeSlotForCapacity" :key="slot.timeSlot" cols="6" sm="4" md="3">
                         <v-text-field
                           v-model.number="slot.capacity"
                           :label="slot.timeSlot"
                           type="number"
                           min="0"
                           density="compact"
                           variant="outlined"
                         ></v-text-field>
                       </v-col>
                     </v-row>
                     <v-card-actions class="pa-0 mt-4">
                       <v-spacer></v-spacer>
                       <v-btn color="success" @click="handleSaveCapacities" :loading="isCapacitySaving">
                         <v-icon start>mdi-content-save-all</v-icon>
                         儲存當日設定
                       </v-btn>
                     </v-card-actions>
                   </div>
                </v-sheet>
              </v-col>
            </v-row>
          </v-window-item>
        </v-window>
      </div>
    </v-card>

    <v-dialog v-model="isBatchDialogVisible" max-width="700px" persistent>
      <v-card>
        <v-card-title class="primary-bg">
          <span class="text-h6">{{ editedBatch.id ? '編輯' : '新增' }}預約批次</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="batchForm">
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field v-model="editedBatch.batchCode" label="批次代號 (例如: A1批次)" :rules="[v => !!v || '必填']"></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-select v-model="editedBatch.bookingType" :items="bookingTypeOptions" label="預約項目" :rules="[v => !!v || '必填']"></v-select>
              </v-col>
              <v-col cols="12"><v-divider class="my-2"></v-divider></v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="editedBatch.applicationStart" label="預約開放時間" type="date" :rules="[v => !!v || '必填']"></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="editedBatch.applicationEnd" label="預約截止時間" type="date" :rules="[v => !!v || '必填']"></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="editedBatch.bookingStart" label="可驗屋起始日" type="date" :rules="[v => !!v || '必填']"></v-text-field>
              </v-col>
               <v-col cols="12" sm="6">
                <v-text-field v-model="editedBatch.bookingEnd" label="可驗屋結束日" type="date" :rules="[v => !!v || '必填']"></v-text-field>
              </v-col>
              <v-col cols="12">
                 <v-combobox
                    v-model="editedBatch.unavailableDates"
                    label="不可預約日期"
                    chips
                    clearable
                    multiple
                    append-icon=""
                    hint="可手動輸入 YYYY-MM-DD 或從日曆選擇"
                    persistent-hint
                  >
                   <template v-slot:append>
                     <v-menu v-model="unavailableDateMenu" :close-on-content-click="false" location="end">
                       <template v-slot:activator="{ props }">
                         <v-btn v-bind="props" icon="mdi-calendar" variant="text"></v-btn>
                       </template>
                       <v-date-picker v-model="unavailableDatesForPicker" multiple hide-header title="選擇日期"></v-date-picker>
                     </v-menu>
                   </template>
                 </v-combobox>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="isBatchDialogVisible = false">取消</v-btn>
          <v-btn color="success" variant="flat" @click="handleSaveBatch">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isCopyDialogVisible" max-width="500px">
        <v-card>
            <v-card-title>
                <span class="text-h6">複製時段規則</span>
            </v-card-title>
            <v-card-text>
                <p class="mb-4">請選擇要複製的來源規則，其時段將會被填入目前的表單中。</p>
                <v-select
                    v-model="copySource.bookingType"
                    :items="bookingTypeOptions"
                    label="來源預約項目"
                    class="mb-3"
                    hide-details
                ></v-select>
                <v-select
                    v-model="copySource.inspectionMethod"
                    :items="inspectionMethodOptions"
                    label="來源驗屋方式"
                    hide-details
                ></v-select>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="grey-darken-1" variant="text" @click="isCopyDialogVisible = false">取消</v-btn>
                <v-btn color="primary" @click="executeCopy">確認複製</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
    
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>

  </v-container>
</template>

<script setup>
import { ref, watch, reactive, computed } from 'vue';

// --- MOCK API Functions ---
// 實際開發時，這些會從 @/api.js 引入並呼叫後端
const mockApi = {
  fetchProjects: async () => {
    console.log('[API] Fetching projects...');
    await new Promise(r => setTimeout(r, 500));
    return [
      { text: '富宇上城', value: 'fuyu56' },
      { text: '富宇富御', value: 'fuyu61' },
    ];
  },
  fetchBookingBatches: async (projectId) => {
    console.log(`[API] Fetching batches for ${projectId}...`);
    await new Promise(r => setTimeout(r, 800));
    return [
      { id: 'fuyu56_初驗_A1批次', projectId: 'fuyu56', bookingType: '初驗', batchCode: 'A1批次', applicationStart: '2025-08-01', applicationEnd: '2025-08-10', bookingStart: '2025-09-01', bookingEnd: '2025-09-15', unavailableDates: ['2025-09-05'] },
      { id: 'fuyu56_複驗_B1批次', projectId: 'fuyu56', bookingType: '複驗', batchCode: 'B1批次', applicationStart: '2025-09-16', applicationEnd: '2025-09-25', bookingStart: '2025-10-01', bookingEnd: '2025-10-15', unavailableDates: [] },
    ];
  },
  saveBookingBatch: async (batchData) => {
    console.log('[API] Saving batch:', batchData);
    await new Promise(r => setTimeout(r, 1000));
    return { status: 'success', data: { ...batchData, id: batchData.id || `new_id_${Date.now()}` } };
  },
  deleteBookingBatch: async (batchId) => {
    console.log('[API] Deleting batch:', batchId);
    await new Promise(r => setTimeout(r, 700));
    return { status: 'success' };
  },
  fetchTimeSlotRules: async (projectId) => {
    console.log(`[API] Fetching all slot rules for ${projectId}...`);
    await new Promise(r => setTimeout(r, 600));
    return [
      { id: 'fuyu56_初驗_自驗', projectId: 'fuyu56', bookingType: '初驗', inspectionMethod: '自驗', timeSlots: ['09:00', '10:00', '11:00', '14:00', '15:00'] },
      { id: 'fuyu56_初驗_代驗', projectId: 'fuyu56', bookingType: '初驗', inspectionMethod: '代驗', timeSlots: ['09:30', '14:30'] },
    ];
  },
  saveTimeSlotRule: async (ruleData) => {
    console.log('[API] Saving slot rule:', ruleData);
    await new Promise(r => setTimeout(r, 1000));
    return { status: 'success' };
  },
  fetchDateCapacities: async (projectId, date) => {
    console.log(`[API] Fetching capacities for ${projectId} on ${date}...`);
    await new Promise(r => setTimeout(r, 900));
    // 模擬返回數據
    const allSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '09:30', '14:30'];
    return allSlots.map(slot => ({
      date: date,
      timeSlot: slot,
      capacity: Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 1 : 0, // 隨機給一些名額
    }));
  },
  saveDateCapacities: async (projectId, date, capacities) => {
     console.log(`[API] Saving capacities for ${projectId} on ${date}:`, capacities);
     await new Promise(r => setTimeout(r, 1200));
     return { status: 'success' };
  }
};

// --- Component State ---
const isLoading = ref(false);
const selectedProject = ref(null);
const projectOptions = ref([]);
const activeTab = ref('batches');

// --- Snackbar ---
const snackbar = reactive({ show: false, text: '', color: 'success' });
function showSnackbar(text, color = 'success') {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
}

// --- Tab 1: Batch Management ---
const isBatchLoading = ref(false);
const isBatchDialogVisible = ref(false);
const batchForm = ref(null);
const bookingBatches = ref([]);
const defaultBatch = {
  id: null,
  batchCode: '',
  bookingType: null,
  applicationStart: '',
  applicationEnd: '',
  bookingStart: '',
  bookingEnd: '',
  unavailableDates: [],
};
const editedBatch = ref({ ...defaultBatch });
const unavailableDateMenu = ref(false);

const batchHeaders = [
  { title: '批次代號', key: 'batchCode' },
  { title: '預約項目', key: 'bookingType' },
  { title: '預約開放區間', key: 'applicationWindow', sortable: false },
  { title: '可驗屋區間', key: 'bookingWindow', sortable: false },
  { title: '狀態', key: 'status', sortable: false },
  { title: '操作', key: 'actions', sortable: false, align: 'end' },
];

const bookingTypeOptions = ref(['初驗', '複驗', '其他']);
const inspectionMethodOptions = ref(['自驗', '代驗']);

// --- Tab 2: Time Slot Rules ---
const allSlotRules = ref([]);
const isSlotLoading = ref(false);
const isSlotSaving = ref(false);
const isCopyDialogVisible = ref(false);
const selectedSlotRule = reactive({
  bookingType: null,
  inspectionMethod: null,
  timeSlots: [],
});
const copySource = reactive({
  bookingType: null,
  inspectionMethod: null,
});

// --- Tab 3: Capacity Management ---
const isCapacityLoading = ref(false);
const isCapacitySaving = ref(false);
const selectedCapacityDate = ref(null);
const timeSlotForCapacity = ref([]);

// --- Computed Properties ---
const unavailableDatesForPicker = computed({
    get() {
        return editedBatch.value.unavailableDates.map(d => new Date(d));
    },
    set(values) {
        editedBatch.value.unavailableDates = values.map(d => formatDate(d));
    }
});


// --- Functions ---
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; // 如果格式不對就返回原值
  return date.toISOString().split('T')[0];
}

function getBatchStatus(item) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(item.applicationStart);
  const end = new Date(item.applicationEnd);
  if (now < start) return { text: '尚未開放', color: 'grey' };
  if (now > end) return { text: '已截止', color: 'red' };
  return { text: '開放中', color: 'green' };
}

async function loadInitialData() {
  projectOptions.value = await mockApi.fetchProjects();
}

async function loadDataForProject(projectId) {
  if (!projectId) return;
  isLoading.value = true;
  try {
    await Promise.all([
      loadBatches(projectId),
      loadAllSlotRules(projectId),
    ]);
    // Resetting states for other tabs
    selectedCapacityDate.value = null;
    timeSlotForCapacity.value = [];
    Object.assign(selectedSlotRule, { bookingType: null, inspectionMethod: null, timeSlots: [] });
  } catch (error) {
    showSnackbar(`載入建案資料失敗: ${error.message}`, 'error');
  } finally {
    isLoading.value = false;
  }
}

// Batch Management Functions
async function loadBatches(projectId) {
  isBatchLoading.value = true;
  bookingBatches.value = await mockApi.fetchBookingBatches(projectId);
  isBatchLoading.value = false;
}

function openBatchDialog(item = null) {
  if (item) {
    editedBatch.value = JSON.parse(JSON.stringify(item));
  } else {
    editedBatch.value = { ...defaultBatch };
  }
  isBatchDialogVisible.value = true;
}

async function handleSaveBatch() {
  const { valid } = await batchForm.value.validate();
  if (!valid) return;
  
  const payload = { ...editedBatch.value, projectId: selectedProject.value };
  const res = await mockApi.saveBookingBatch(payload);
  if (res.status === 'success') {
    showSnackbar('儲存成功！');
    isBatchDialogVisible.value = false;
    loadBatches(selectedProject.value);
  } else {
    showSnackbar('儲存失敗', 'error');
  }
}

function handleDeleteBatch(item) {
    if(confirm(`確定要刪除「${item.batchCode}」這個批次嗎？`)){
        mockApi.deleteBookingBatch(item.id).then(res => {
            if (res.status === 'success') {
                showSnackbar('刪除成功');
                loadBatches(selectedProject.value);
            } else {
                showSnackbar('刪除失敗', 'error');
            }
        });
    }
}

// Slot Rule Functions
async function loadAllSlotRules(projectId) {
  isSlotLoading.value = true;
  allSlotRules.value = await mockApi.fetchTimeSlotRules(projectId);
  isSlotLoading.value = false;
}

function updateSelectedSlotRule() {
  const { bookingType, inspectionMethod } = selectedSlotRule;
  if (bookingType && inspectionMethod) {
    const foundRule = allSlotRules.value.find(
      (r) => r.bookingType === bookingType && r.inspectionMethod === inspectionMethod
    );
    selectedSlotRule.timeSlots = foundRule ? [...foundRule.timeSlots] : [];
  } else {
    selectedSlotRule.timeSlots = [];
  }
}

async function handleSaveSlotRule() {
  isSlotSaving.value = true;
  const payload = {
    ...selectedSlotRule,
    projectId: selectedProject.value,
  };
  const res = await mockApi.saveTimeSlotRule(payload);
  if (res.status === 'success') {
    showSnackbar('時段規則儲存成功');
    // Reload all rules to reflect the change
    await loadAllSlotRules(selectedProject.value);
  } else {
    showSnackbar('儲存失敗', 'error');
  }
  isSlotSaving.value = false;
}

function executeCopy() {
    const { bookingType, inspectionMethod } = copySource;
    if (!bookingType || !inspectionMethod) {
        showSnackbar('請選擇來源項目和方式', 'warning');
        return;
    }
    const sourceRule = allSlotRules.value.find(
      (r) => r.bookingType === bookingType && r.inspectionMethod === inspectionMethod
    );

    if (sourceRule && sourceRule.timeSlots.length > 0) {
        selectedSlotRule.timeSlots = [...sourceRule.timeSlots];
        showSnackbar('時段已成功複製');
        isCopyDialogVisible.value = false;
    } else {
        showSnackbar('來源規則沒有設定任何時段', 'warning');
    }
}

// Capacity Functions
async function loadCapacitiesForDate(date) {
  if (!date || !selectedProject.value) return;
  isCapacityLoading.value = true;
  timeSlotForCapacity.value = await mockApi.fetchDateCapacities(selectedProject.value, formatDate(date));
  isCapacityLoading.value = false;
}

async function handleSaveCapacities() {
  if (!selectedCapacityDate.value) return;
  isCapacitySaving.value = true;
  const dateStr = formatDate(selectedCapacityDate.value);
  const res = await mockApi.saveDateCapacities(selectedProject.value, dateStr, timeSlotForCapacity.value);
  if (res.status === 'success') {
      showSnackbar(`${dateStr} 的名額設定已儲存`);
  } else {
      showSnackbar('儲存失敗', 'error');
  }
  isCapacitySaving.value = false;
}


// --- Watchers ---
watch(selectedProject, (newProjectId) => {
  loadDataForProject(newProjectId);
});

watch([() => selectedSlotRule.bookingType, () => selectedSlotRule.inspectionMethod], () => {
  updateSelectedSlotRule();
});

watch(selectedCapacityDate, (newDate) => {
    loadCapacitiesForDate(newDate);
})


// --- Lifecycle ---
loadInitialData();

</script>

<style scoped>
.primary-bg {
  background-color: #1a73e8;
  color: white;
}
.v-data-table-header__cell {
    background-color: #f5f5f5;
}
</style>
