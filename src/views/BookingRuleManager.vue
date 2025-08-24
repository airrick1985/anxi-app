<template>
  <v-container fluid>
    <v-card>
      <v-card-title class="d-flex align-center text-h5 text-primary">

        <v-tooltip text="返回預約總表" location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-arrow-left"
              variant="text"
              class="mr-2"
              @click="goBack"
            ></v-btn>
          </template>
        </v-tooltip>

        <v-icon start>mdi-cogs</v-icon>
        <span>預約批次管理：{{ projectName || '讀取中...' }}</span> 
      </v-card-title>
      <v-divider></v-divider>
      
      <div v-if="isLoading" class="text-center pa-10">
        </div>
      <div v-else>
      
        <v-divider></v-divider>
        <v-window v-model="activeTab">
          <v-window-item value="batches" class="pa-4">
            
            <v-toolbar flat color="transparent">
             
              
              <v-text-field
                v-model="searchQuery"
                label="搜尋..."
                prepend-inner-icon="mdi-magnify"
                variant="solo-filled"
                flat
                density="compact"
                hide-details
                clearable
                class="mr-4"
                style="max-width: 350px;"
              ></v-text-field>

              <v-spacer></v-spacer>
              <v-btn color="primary" @click="openBatchDialog()" prepend-icon="mdi-plus">新增批次</v-btn>
            </v-toolbar>

            <v-data-table
        :headers="batchHeaders"
        :items="processedBookingBatches" 
        :loading="isBatchLoading"
        :search="searchQuery"  
        item-value="id"
        class="elevation-1"
        :page-text="`第 {0} - {1} 筆，共 {2} 筆`"
      >
        <template v-slot:item.applicationWindow="{ item }">
          <div v-if="item.applicationStart && item.applicationEnd">
      <div class="d-flex align-center">
            <v-chip size="x-small" color="teal-lighten-3" text-color="teal-darken-3" label class="mr-1 font-weight-bold">起</v-chip>
            <span>{{ formatDisplayDateTime(item.applicationStart) }}</span>
          </div>
          <div class="d-flex align-center mt-1">
            <v-chip size="x-small" color="pink-lighten-3" text-color="pink-darken-3" label class="mr-1 font-weight-bold">迄</v-chip>
            <span>{{ formatDisplayDateTime(item.applicationEnd) }}</span>
          </div>
          </div>
          <span v-else class="text-grey">未設定</span>
        </template>
        <template v-slot:item.bookingWindow="{ item }">
          <div>
              <div class="d-flex align-center">
            <v-chip size="x-small" color="teal-lighten-3" text-color="teal-darken-3" label class="mr-1 font-weight-bold">起</v-chip>
            <span>{{ item.bookingStart }}</span>
          </div>
          <div class="d-flex align-center mt-1">
            <v-chip size="x-small" color="pink-lighten-3" text-color="pink-darken-3" label class="mr-1 font-weight-bold">迄</v-chip>
            <span>{{ item.bookingEnd }}</span>
          </div>
          </div>
        </template>

        <template v-slot:item.statusText="{ item }">
          <v-chip :color="getBatchStatus(item).color" size="small">
            {{ item.statusText }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
            <v-btn
            icon="mdi-eye"
            variant="text"
            color="info"
            size="small"
            class="mr-1"
            @click="openPreviewDialog(item)"
          ></v-btn>
            <v-btn
          icon="mdi-pencil"
          variant="text"
          color="primary"
          size="small"
          class="mr-1"
          @click="openBatchDialog(item)"
        ></v-btn>
        
        <v-btn
          icon="mdi-delete"
          variant="text"
          color="error"
          size="small"
          @click="openDeleteDialog(item)"
        ></v-btn>
        </template>
      </v-data-table>
          </v-window-item>
        </v-window>
      </div>
    </v-card>

      <v-dialog v-model="isPreviewDialogVisible" max-width="800px">
        <v-card v-if="batchToPreview">
          <v-card-title class="d-flex align-center primary-bg">
            <v-icon start>mdi-calendar-search</v-icon>
            <span>預覽批次設定</span>
            <v-spacer></v-spacer>
            <v-btn variant="text" icon="mdi-close" @click="isPreviewDialogVisible = false"></v-btn>
          </v-card-title>
          
          <v-card-subtitle class="pa-3 bg-grey-lighten-4">
      <strong>{{ projectName }}</strong> - 「<strong>{{ batchToPreview.bookingType }}</strong>」批次 - <strong>{{ batchToPreview.batchCode }}</strong>
          </v-card-subtitle>
          
          <v-divider></v-divider>

          <v-card-text style="max-height: 70vh; overflow-y: auto;">
            <div v-if="isPreviewLoading" class="text-center pa-8">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
              <p class="mt-2 text-grey-darken-1">正在讀取規則...</p>
            </div>
            
            <div v-else>
              <div v-if="Object.keys(previewData).length === 0" class="text-center pa-8 text-grey-darken-1">
                <v-icon size="48">mdi-calendar-remove-outline</v-icon>
                <p class="mt-2">此批次未設定「可驗屋區間」。</p>
              </div>

              <v-list v-else lines="two">
                <template v-for="(slots, date) in previewData" :key="date">
                  <v-list-subheader class="font-weight-bold text-primary">{{ formatDateWithWeekday(date) }}</v-list-subheader>
                  <v-list-item>
                    <v-list-item-title>
                      <div v-if="slots.length > 0" class="d-flex flex-wrap ga-2">
                        <v-chip
                          v-for="slot in slots"
                          :key="slot.time"
                          color="indigo"
                          variant="tonal"
                          label
                        >
                          <v-icon start>mdi-clock-time-four-outline</v-icon>
                          <strong>{{ slot.time }}</strong>
                          <v-divider vertical class="mx-2"></v-divider>
                          <span class="font-weight-regular">{{ slot.capacity }} 名</span>
                        </v-chip>
                      </div>
                      <div v-else class="text-grey-darken-1">
                        <v-icon size="small" class="mr-1">mdi-calendar-blank-outline</v-icon>
                        <span>無設定時段</span>
                      </div>
                    </v-list-item-title>
                  </v-list-item>
                  <v-divider class="mt-2"></v-divider>
                </template>
              </v-list>
            </div>
          </v-card-text>
          
          <v-card-actions class="bg-grey-lighten-5 pa-3">
            <v-spacer></v-spacer>
            <v-btn color="primary" variant="tonal" @click="isPreviewDialogVisible = false">關閉</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>                                               

          <v-dialog v-model="isDeleteDialogVisible" max-width="500px" persistent>
        <v-card v-if="batchToDelete">
          <v-card-title class="text-h6 d-flex align-center bg-red-lighten-4">
            <v-icon start color="red-darken-2">mdi-alert-circle-outline</v-icon>
            確認刪除批次
          </v-card-title>
          <v-card-text class="pt-4">
            您確定要永久刪除「<strong>{{ batchToDelete.bookingType }}</strong>」批次「<strong>{{ batchToDelete.batchCode }}</strong>」嗎？
            <br>
            所有與此批次相關的每日規則也將一併被刪除，此操作無法復原。
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey-darken-1" variant="text" @click="closeDeleteDialog">取消</v-btn>
            <v-btn color="error" variant="flat" :loading="isDeleting" @click="handleConfirmDelete">確定刪除</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

    <v-dialog v-model="isBatchDialogVisible" max-width="1200px" persistent>
      <v-card>
        <v-card-title class="primary-bg">
          <span class="text-h6">{{ editedBatch.id ? '編輯' : '新增' }}預約批次</span>
        </v-card-title>
        <v-card-text style="max-height: 80vh; overflow-y: auto;">
          <v-form ref="batchForm">
          <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field 
                    v-model="editedBatch.batchCode" 
                    label="批次代號" 
                    :rules="[v => !!v || '必填', batchUniquenessRule]"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-select 
                    v-model="editedBatch.bookingType" 
                    :items="bookingTypeOptions" 
                    label="預約項目" 
                    :rules="[v => !!v || '必填', batchUniquenessRule]"
                  ></v-select>
                </v-col>
                
                <v-col v-if="editedBatch.bookingType === '其他'" cols="12" sm="6" md="3">
                  <v-text-field
                    v-model="customBookingType"
                    label="請輸入自訂項目名稱"
                    :rules="[v => !!v || '自訂項目為必填', batchUniquenessRule]"
                  ></v-text-field>
                </v-col>
              </v-row>
            <v-divider class="my-2"></v-divider>
            <v-row>
              <v-col cols="12" sm="6" md="3">
                <v-text-field v-model="editedBatch.applicationStart" label="預約開放起始時間" type="datetime-local" :rules="[v => !!v || '必填']"></v-text-field>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-text-field v-model="editedBatch.applicationEnd" label="預約開放結束時間" type="datetime-local" :rules="[v => !!v || '必填']"></v-text-field>
              </v-col>
              <v-col cols="12" sm="6" md="3"><v-text-field v-model="editedBatch.bookingStart" label="可驗屋起始日" type="date" :rules="[v => !!v || '必填']"></v-text-field></v-col>
              <v-col cols="12" sm="6" md="3"><v-text-field v-model="editedBatch.bookingEnd" label="可驗屋結束日" type="date" :rules="[v => !!v || '必填']"></v-text-field></v-col>
            </v-row>
          </v-form>

          <v-divider class="my-4"></v-divider>
          
          <div v-if="!editedBatch.bookingStart || !editedBatch.bookingEnd">
             <p class="text-center text-grey-darken-1 pa-4">請先設定可驗屋的起訖日期</p>
          </div>
          <v-row v-else>
            <v-col cols="12" md="4">
              <v-date-picker
                v-model="selectedDayForEditing"
                :min="editedBatch.bookingStart"
                :max="editedBatch.bookingEnd"
                show-adjacent-months
                hide-header
                color="primary"
                class="w-100"
              ></v-date-picker>
            </v-col>
            <v-col cols="12" md="8">
              <div v-if="!selectedDayForEditing" class="d-flex align-center justify-center h-100 text-grey">
                <div><v-icon size="48">mdi-calendar-cursor</v-icon><p>請從左側日曆選擇一天來設定</p></div>
              </div>
              <div v-else>
                <h3 class="text-h6 mb-4 d-flex justify-space-between align-center">
                  <span>設定 {{ formatDate(selectedDayForEditing) }} 的驗屋時段</span>
                  <v-chip size="small" :color="isDayConfigured(selectedDayForEditing) ? 'green' : 'grey'" variant="tonal">
                    {{ isDayConfigured(selectedDayForEditing) ? '已設定' : '未設定' }}
                  </v-chip>
                </h3>
                
                    <v-combobox
                    v-model="currentDaySlots"
                    :items="timeSlotPresets"
                    :rules="[timeArrayRule]"
                    label="點選選擇或輸入時段 (例如: 09:00)"
                    chips
                    clearable
                    multiple
                    closable-chips  
                    append-icon="mdi-plus-circle-outline"
                    hint="輸入後按 Enter 新增"
                    persistent-hint
                  ></v-combobox>

                      

                <v-divider class="my-4"></v-divider>
                
                <p class="text-subtitle-1 mb-2">設定各時段名額 (0 代表不開放)</p>
                <v-row dense>
                  <v-col v-for="slot in sortedCurrentDaySlots" :key="slot" cols="6" sm="4" md="3">
                    <v-text-field
                      :model-value="getCapacityForSlot(slot)"
                      @update:model-value="setCapacityForSlot(slot, $event)"
                      :label="slot"
                      type="number" min="0"
                      variant="outlined" density="compact"
                    ></v-text-field>
                  </v-col>
                </v-row>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="isBatchDialogVisible = false">取消</v-btn>
          <v-btn color="success" variant="flat" @click="handleSaveBatch" :loading="isSaving">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router'; 
import { useProjectStore } from '@/store/projectStore';
import {
  saveBookingBatch,
  fetchBookingBatches,
  saveDailyRules, 
  fetchDailyRules, 
  deleteBookingBatch, 
} from '@/api';

// --- Component State ---
const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();
const projectId = ref(route.params.projectId);
const isLoading = ref(false);
const isSaving = ref(false); // 新增 saving 狀態
const activeTab = ref('batches');
const snackbar = reactive({ show: false, text: '', color: 'success' });
const isBatchLoading = ref(false);
const isBatchDialogVisible = ref(false);
const batchForm = ref(null);
const bookingBatches = ref([]);
const bookingTypeOptions = ref(['初驗', '複驗', '其他']);
const customBookingType = ref('');
const searchQuery = ref('');
const isDeleteDialogVisible = ref(false);
const batchToDelete = ref(null);
const isDeleting = ref(false);

// ✅ 1. 新增管理「預覽」功能的狀態
const isPreviewDialogVisible = ref(false);
const batchToPreview = ref(null);
const previewData = ref({});
const isPreviewLoading = ref(false);


// ✅ 更新預設資料結構
const defaultBatch = {
  id: null,
  batchCode: '',
  bookingType: null,
  applicationStart: '', // 預約開放起始時間
  applicationEnd: '',   // 預約開放結束時間
  bookingStart: '',     // 可驗屋起始日
  bookingEnd: '',       // 可驗屋結束日
  dailyRules: {}, 
};
const editedBatch = ref({ ...defaultBatch });
const selectedDayForEditing = ref(null); // 日曆上選擇的天

// --- Computed Properties ---
const projectName = computed(() => projectStore.idToNameMap[projectId.value] || '');
const batchHeaders = [
  { title: '批次代號', key: 'batchCode' },
  { title: '預約項目', key: 'bookingType' },
  { title: '預約開放區間', key: 'applicationWindow', sortable: false },
  { title: '可驗屋區間', key: 'bookingWindow', sortable: false },
  { title: '狀態', key: 'statusText', sortable: true }, // <--- 修改點
  { title: '操作', key: 'actions', sortable: false, align: 'end' },
];

// ✅ 【新增】2. 建立一個處理過的列表，為每筆資料加上 statusText 屬性
const processedBookingBatches = computed(() => {
  return bookingBatches.value.map(item => ({
    ...item,
    // 將 getBatchStatus 回傳的文字作為一個新屬性
    statusText: getBatchStatus(item).text 
  }));
});

const timeSlotPresets = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return [`${hour}:00`, `${hour}:30`];
}).flat().slice(16, 36); // 截取 08:00 到 17:30


// ✅ 【新增】提供給 v-combobox 的預設時間選項
const timeArrayRule = (values) => {
  const pattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
  
  // 檢查陣列中的每一個值是否都通過正則表達式測試
  const isValid = values.every(v => pattern.test(v));
  
  if (!isValid) {
    // 如果有任何一個不符合，就回傳錯誤訊息
    return '格式錯誤，請移除不符合 HH:MM 格式的項目';
  }
  
  // 如果全部都符合，回傳 true
  return true;
};

// --- Functions for Daily Rule Editing ---
const currentDaySlots = computed({
  get() {
    if (!selectedDayForEditing.value) return [];
    const dateKey = formatDate(selectedDayForEditing.value);
    const slots = editedBatch.value.dailyRules[dateKey]?.slots || {};
    return Object.keys(slots);
  },
  set(newSlots) {
    if (!selectedDayForEditing.value) return;
    const dateKey = formatDate(selectedDayForEditing.value);
    if (!editedBatch.value.dailyRules[dateKey]) {
      editedBatch.value.dailyRules[dateKey] = { slots: {} };
    }
    const oldCapacities = editedBatch.value.dailyRules[dateKey].slots;
    const newCapacities = {};
    newSlots.forEach(slot => {
      newCapacities[slot] = oldCapacities[slot] || 0; // 保留舊名額
    });
    editedBatch.value.dailyRules[dateKey].slots = newCapacities;
  }
});
const sortedCurrentDaySlots = computed(() => [...currentDaySlots.value].sort());
function getCapacityForSlot(slot) {
  const dateKey = formatDate(selectedDayForEditing.value);
  return editedBatch.value.dailyRules[dateKey]?.slots?.[slot] || 0;
}
function setCapacityForSlot(slot, capacity) {
  const dateKey = formatDate(selectedDayForEditing.value);
  editedBatch.value.dailyRules[dateKey].slots[slot] = Number(capacity) || 0;
}
const isDayConfigured = (day) => {
    const dateKey = formatDate(day);
    const slots = editedBatch.value.dailyRules[dateKey]?.slots;
    return slots && Object.keys(slots).length > 0;
}

// ✅ 【新增】檢查批次唯一性的驗證規則
const batchUniquenessRule = (value) => {
  // value 參數會是批次代號輸入框的目前值
  const currentCode = value;
  // 獲取目前選擇的預約項目
  const currentType = editedBatch.value.bookingType === '其他' 
    ? customBookingType.value 
    : editedBatch.value.bookingType;

  // 如果代號或項目任一為空，暫不驗證
  if (!currentCode || !currentType) {
    return true;
  }
  
  // 在現有的所有批次中查找
  const isDuplicate = bookingBatches.value.some(batch => {
    // 關鍵：在編輯模式下，要排除正在編輯的那一筆資料本身
    if (editedBatch.value.id && batch.id === editedBatch.value.id) {
      return false;
    }
    // 檢查「預約項目」和「批次代號」是否都相同
    return batch.bookingType === currentType && batch.batchCode === currentCode;
  });

  // 如果找到重複的，就回傳錯誤訊息
  if (isDuplicate) {
    return `「${currentType}」項目已存在相同的批次代號`;
  }

  // 如果沒問題，回傳 true
  return true;
};

// --- Main Functions ---
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

// ✅ 1. 【新增】格式化日期為 YYYY-MM-DD (週N) 的輔助函式
function formatDateWithWeekday(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  // 使用 Intl.DateTimeFormat 來獲取符合台灣地區的星期簡稱
  const weekday = new Intl.DateTimeFormat('zh-TW', { weekday: 'short' }).format(date);
  return `${dateString} (${weekday})`;
}


// ✅ 新增：格式化日期時間以供顯示
function formatDisplayDateTime(dateTimeString) {
  if (!dateTimeString) return '';
  return dateTimeString.replace('T', ' ');
}

function getBatchStatus(item) {
  // 如果沒有設定預約開放區間，則顯示特定狀態
  if (!item.applicationStart || !item.applicationEnd) {
    return { text: '時間未設定', color: 'grey-darken-2' };
  }
  
  // 直接使用當前台灣時間進行比較 (new Date() 會依據瀏覽器時區)
  const now = new Date(); 
  const start = new Date(item.applicationStart);
  const end = new Date(item.applicationEnd);

  // 檢查日期是否有效
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { text: '日期格式錯誤', color: 'orange' };
  }

  if (now < start) return { text: '尚未開放', color: 'blue-grey' };
  if (now > end) return { text: '已截止', color: 'red-darken-1' };
  return { text: '開放中', color: 'green' };
}

function showSnackbar(text, color = 'success') {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
}

async function openBatchDialog(item = null) {
  customBookingType.value = ''; // 每次打開都先清空
  if (item) {
    // 編輯模式
    const dailyRules = await fetchDailyRules(item.id);
    editedBatch.value = { ...JSON.parse(JSON.stringify(item)), dailyRules };
    
    // 檢查載入的 bookingType 是否為預設選項之一
    const isStandardType = bookingTypeOptions.value.includes(item.bookingType);
    if (!isStandardType) {
      // 如果不是，代表它是自訂項目
      editedBatch.value.bookingType = '其他';
      customBookingType.value = item.bookingType; // 將原有的值填入自訂輸入框
    }
  } else {
    // 新增模式
    editedBatch.value = { ...defaultBatch, dailyRules: {} };
  }
  selectedDayForEditing.value = null;
  isBatchDialogVisible.value = true;
}

async function handleSaveBatch() {
  const { valid } = await batchForm.value.validate();
  if (!valid) return;
  isSaving.value = true;

  const batchPayload = { ...editedBatch.value };
  
  // 如果選擇了「其他」，則使用自訂輸入框的值
  if (batchPayload.bookingType === '其他') {
    batchPayload.bookingType = customBookingType.value;
  }

  batchPayload.projectId = projectId.value;
  batchPayload.projectName = projectName.value;
  
  try {
    const batchRes = await saveBookingBatch(batchPayload);
    if (batchRes.status !== 'success') throw new Error(batchRes.message);
    const batchId = batchRes.id;

    const rulesRes = await saveDailyRules(batchId, batchPayload.dailyRules);
    if (rulesRes.status !== 'success') throw new Error(rulesRes.message);

    showSnackbar('儲存成功！');
    isBatchDialogVisible.value = false;
    bookingBatches.value = await fetchBookingBatches(projectId.value);
  } catch(error) {
    showSnackbar(`儲存失敗: ${error.message}`, 'error');
  } finally {
    isSaving.value = false;
  }
}


async function loadDataForProject() {
  isLoading.value = true;
    await projectStore.fetchProjects();
  if (projectName.value) {
    bookingBatches.value = await fetchBookingBatches(projectId.value);
  } else {
    showSnackbar(`錯誤：找不到建案 ID ${projectId.value}`, 'error');
  }
  isLoading.value = false;
}

// ✅ 3. 新增刪除相關的函式
function openDeleteDialog(item) {
  batchToDelete.value = item;
  isDeleteDialogVisible.value = true;
}

function closeDeleteDialog() {
  batchToDelete.value = null;
  isDeleteDialogVisible.value = false;
}

async function handleConfirmDelete() {
  if (!batchToDelete.value) return;
  isDeleting.value = true;
  try {
    const res = await deleteBookingBatch(batchToDelete.value.id);
    if (res.status !== 'success') throw new Error(res.message);

    // 從前端列表中直接移除，避免重新 call API，體驗更好
    const index = bookingBatches.value.findIndex(b => b.id === batchToDelete.value.id);
    if (index > -1) {
      bookingBatches.value.splice(index, 1);
    }
    
    showSnackbar('批次已成功刪除');
    closeDeleteDialog();
  } catch (error) {
    showSnackbar(`刪除失敗: ${error.message}`, 'error');
  } finally {
    isDeleting.value = false;
  }
}

// ✅ 2. 【修改】更新 openPreviewDialog 函式以符合新需求
async function openPreviewDialog(item) {
  batchToPreview.value = item;
  isPreviewDialogVisible.value = true;
  isPreviewLoading.value = true;
  try {
    const dailyRules = await fetchDailyRules(item.id);
    
    const formattedData = {};
    if (item.bookingStart && item.bookingEnd) {
      const start = new Date(item.bookingStart);
      const end = new Date(item.bookingEnd);
      
      // 使用 new Date(start) 避免修改原始日期物件
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        const ruleForDay = dailyRules[dateKey];
        
        // **核心修改點**：無論有無設定，都為該日期建立一個項目
        if (ruleForDay && ruleForDay.slots && Object.keys(ruleForDay.slots).length > 0) {
          // 如果有設定，則整理時段資料
          formattedData[dateKey] = Object.entries(ruleForDay.slots)
            .map(([time, capacity]) => ({ time, capacity }))
            .sort((a, b) => a.time.localeCompare(b.time));
        } else {
          // 如果沒有設定，則給一個空陣列
          formattedData[dateKey] = [];
        }
      }
    }
    previewData.value = formattedData;

  } catch (error) {
    showSnackbar(`讀取預覽資料失敗: ${error.message}`, 'error');
  } finally {
    isPreviewLoading.value = false;
  }
}
function goBack() {
  router.back();
}

onMounted(loadDataForProject);

// 當起訖日期變更時，清空已選擇的日期
watch(() => [editedBatch.value.bookingStart, editedBatch.value.bookingEnd], () => {
    selectedDayForEditing.value = null;
});

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
