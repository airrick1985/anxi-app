<template>
  <v-dialog :model-value="modelValue" @update:model-value="v => emit('update:modelValue', v)" fullscreen transition="dialog-bottom-transition">
    <v-card class="bg-grey-lighten-4">
      <v-toolbar color="primary" dark>
        <v-btn icon="mdi-close" @click="close"></v-btn>
        <v-toolbar-title class="text-subtitle-1 font-weight-bold">
          聯絡回報: {{ lead?.name }}
        </v-toolbar-title>
      </v-toolbar>

      <v-container>
        <v-row justify="center">
          <v-col cols="12" md="8" lg="6">

            <v-card class="pa-4 mb-4 rounded-xl elevation-2 bg-indigo-darken-4 text-white">
              <v-row align="center" no-gutters>
                <v-col cols="auto" class="me-4">
                  <v-avatar color="white" size="56">
                    <v-icon color="indigo-darken-4" size="32">mdi-account</v-icon>
                  </v-avatar>
                </v-col>
                <v-col>
                  <div class="text-h6 font-weight-bold">{{ lead?.name }}</div>
                  <div class="text-subtitle-2 opacity-80 d-flex align-center">
                    <v-icon size="16" class="me-1">mdi-phone</v-icon>
                    {{ lead?.phone }}
                  </div>
                </v-col>
              </v-row>

              <v-divider class="my-3 border-opacity-25" color="white"></v-divider>

              <v-row dense>
                <v-col cols="6">
                  <div class="text-caption opacity-70">來源管道</div>
                  <div class="text-body-2 font-weight-bold">{{ lead?.source || '未註明' }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption opacity-70">購屋預算</div>
                  <div class="text-body-2 font-weight-bold">{{ lead?.budget || '未填寫' }}</div>
                </v-col>
                <v-col cols="12" class="mt-2">
                  <div class="text-caption opacity-70">填表日期</div>
                  <div class="text-body-2 font-weight-bold">{{ formatLeadDate(lead?.date) }}</div>
                </v-col>

                <v-col cols="12" class="mt-2" v-if="lead?.note">
                  <v-alert
                    density="compact"
                    color="indigo-lighten-1"
                    icon="mdi-note-text"
                    class="text-caption rounded-lg mt-1"
                  >
                    <div class="font-weight-bold mb-1">備註：</div>
                    {{ lead.note }}
                  </v-alert>
                </v-col>
              </v-row>
            </v-card>

            <!-- 顯示現有預約記錄 -->
            <div v-if="reservations.length > 0" class="mb-6">
              <v-card class="pa-5 rounded-xl elevation-3" style="border-top: 5px solid #4caf50; background: linear-gradient(135deg, #f1f8f4 0%, #e8f5e9 100%);">
                <div class="d-flex align-center mb-4">
                  <v-icon size="28" color="success" class="me-3">mdi-calendar-check</v-icon>
                  <div>
                    <div class="text-h6 font-weight-bold text-success">已預約</div>
                    <div class="text-caption text-grey-darken-1">共 {{ reservations.length }} 筆預約</div>
                  </div>
                </div>

                <v-divider class="my-3"></v-divider>

                <div
                  v-for="(res, idx) in reservations"
                  :key="res.id"
                  class="mb-4"
                  :class="{ 'pb-3 border-bottom': idx < reservations.length - 1 }"
                >
                  <v-row dense align="start">
                    <v-col cols="12" sm="6">
                      <div class="text-caption font-weight-bold text-primary mb-1">預約日期時間</div>
                      <div class="d-flex align-center">
                        <v-icon size="20" color="success" class="me-2">mdi-calendar-clock</v-icon>
                        <span class="text-body-2 font-weight-bold">{{ formatTime(res.reservationTime) }}</span>
                      </div>
                    </v-col>

                    <v-col cols="12" sm="6">
                      <div class="text-caption font-weight-bold text-primary mb-1">預約類型</div>
                      <v-chip size="small" color="primary" variant="flat" class="font-weight-bold">
                        {{ res.type }}
                      </v-chip>
                    </v-col>

                    <v-col cols="12" sm="6">
                      <div class="text-caption font-weight-bold text-primary mb-1">負責銷售</div>
                      <div class="d-flex align-center">
                        <v-icon size="20" color="indigo-darken-4" class="me-2">mdi-badge-account</v-icon>
                        <span class="text-body-2 font-weight-bold text-indigo-darken-4">
                          {{ res.salesName || '未指定' }}
                        </span>
                      </div>
                    </v-col>

                    <v-col cols="12" sm="6">
                      <div class="text-caption font-weight-bold text-primary mb-1">操作人員</div>
                      <div class="text-body-2 text-grey-darken-2">
                        {{ res.operatorName || '不詳' }}
                      </div>
                    </v-col>

                    <v-col v-if="res.note" cols="12">
                      <div class="text-caption font-weight-bold text-primary mb-1">備註</div>
                      <div class="text-body-2 text-grey-darken-2 pa-2 rounded" style="background-color: rgba(255, 255, 255, 0.5);">
                        {{ res.note }}
                      </div>
                    </v-col>
                  </v-row>
                </div>
              </v-card>
            </div>

            <v-card class="pa-5 mb-6 rounded-xl elevation-2">
              <div class="section-title mb-3">聯絡狀況回報</div>

              <v-select
                v-model="reportForm.status"
                :items="statusOptions"
                label="選擇聯絡結果"
                variant="outlined"
                rounded="lg"
                class="mb-3"
                density="comfortable"
                hide-details
                color="indigo-darken-4"
              ></v-select>

              <template v-if="showReasonField">
                <v-text-field
                  v-if="isReasonReadonly"
                  v-model="reportForm.reason"
                  label="未約原因 (系統自動填入)"
                  variant="filled"
                  readonly
                  rounded="lg"
                  class="mb-3"
                  density="comfortable"
                  hide-details
                  bg-color="grey-lighten-3"
                ></v-text-field>

                <v-select
                  v-else
                  v-model="reportForm.reason"
                  :items="reasonOptions"
                  label="請選擇未約原因"
                  variant="outlined"
                  rounded="lg"
                  class="mb-3"
                  density="comfortable"
                  color="indigo-darken-4"
                  hide-details
                ></v-select>
              </template>

              <v-btn
                v-if="reportForm.status === '已約賞屋'"
                block
                :color="isBookingCompleted ? 'success' : 'primary'"
                variant="elevated"
                class="mb-4 font-weight-bold"
                :prepend-icon="isBookingCompleted ? 'mdi-check-circle' : 'mdi-calendar-check'"
                @click="openBookingDialog"
              >
                {{ isBookingCompleted ? '預約已完成 (點擊可修改)' : '開啟預約視窗' }}
              </v-btn>

              <v-textarea
                v-model="reportForm.note"
                label="詳細談話紀錄"
                variant="outlined"
                placeholder="請輸入通話內容摘要..."
                rounded="lg"
                rows="3"
                class="mb-4"
                hide-details
                color="indigo-darken-4"
              ></v-textarea>

              <div class="text-center mt-6">
                <v-btn
                  color="green"
                  size="x-large"
                  rounded="lg"
                  elevation="2"
                  min-width="200"
                  :disabled="isSubmitDisabled"
                  @click="submitReport"
                  class="font-weight-bold"
                >
                  {{ submitBtnText }}
                </v-btn>
              </div>
            </v-card>

            <div class="section-title mt-8 mb-3 d-flex align-center">
              <v-icon size="20" class="me-2">mdi-history</v-icon>回報日誌
            </div>

            <div v-if="logsLoading">
              <v-skeleton-loader type="list-item-three-line" class="rounded-xl mb-3"></v-skeleton-loader>
              <v-skeleton-loader type="list-item-three-line" class="rounded-xl"></v-skeleton-loader>
            </div>

            <div v-else-if="leadLogs.length === 0" class="text-center py-6 text-grey-lighten-1 border-dashed rounded-lg">
              尚無聯絡紀錄
            </div>

            <div v-else class="history-timeline">
              <v-card
                v-for="(log, idx) in leadLogs"
                :key="idx"
                variant="flat"
                class="mb-3 pa-4 rounded-xl history-item shadow-sm"
                :class="`status-${getStatusKey(log.status)}`"
              >
                <div class="d-flex justify-space-between align-start mb-2">
                  <v-chip size="small" :color="getStatusColor(log.status)" class="font-weight-bold" variant="flat">
                    {{ log.status }}
                  </v-chip>
                  <span class="text-caption text-grey-darken-1 font-weight-bold">
                    {{ formatDateTime(log.createdAt) }}
                  </span>
                </div>
                <div v-if="log.reason" class="text-caption text-indigo-darken-4 font-weight-bold mb-1">
                  原因：{{ log.reason }}
                </div>
                <div class="text-body-2 font-weight-bold text-grey-darken-3 mb-1" style="white-space: pre-line;">{{ log.note }}</div>
                <div class="text-caption text-grey-darken-1">回報人：{{ log.createdBy }}</div>
              </v-card>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </v-dialog>

  <ViewingReservationDialog
    v-if="showBookingDialog"
    v-model="showBookingDialog"
    :project-id="projectId"
    :initial-data="bookingInitialData"
    @saved="onBookingSaved"
  />
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { db } from '@/firebase';
import {
  collection, doc, getDocs, addDoc, updateDoc,
  query, orderBy, serverTimestamp
} from 'firebase/firestore';
import { useUserStore } from '@/store/user';
import { useUiStore } from '@/store/uiStore';
import ViewingReservationDialog from '@/components/ViewingReservationDialog.vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  lead: { type: Object, default: null },
  projectId: { type: String, required: true },
  statusOptions: { type: Array, default: () => [] },
  reasonOptions: { type: Array, default: () => [] },
  // 該客戶（依電話）的有效預約清單，由父層傳入
  reservations: { type: Array, default: () => [] }
});

const emit = defineEmits(['update:modelValue', 'saved', 'notify']);

const userStore = useUserStore();
const uiStore = useUiStore();

const reportForm = ref({ status: '', reason: '', note: '' });
const leadLogs = ref([]);
const logsLoading = ref(false);
const isBookingCompleted = ref(false);
const isReasonReadonly = ref(false);
const showBookingDialog = ref(false);
const bookingInitialData = ref({});

const close = () => emit('update:modelValue', false);

// 開啟時初始化表單，並「非同步」載入回報日誌（不阻塞 Dialog 顯示）
watch(() => props.modelValue, (open) => {
  if (!open || !props.lead) return;
  reportForm.value = { status: props.lead.status || '', reason: props.lead.reason || '', note: '' };
  isBookingCompleted.value = false;
  loadLogs(props.lead.id);
});

const loadLogs = async (leadId) => {
  logsLoading.value = true;
  leadLogs.value = [];
  try {
    const logsSnap = await getDocs(query(
      collection(db, `leads/${leadId}/contactLogs`),
      orderBy('createdAt', 'desc')
    ));
    // 避免使用者已切換到別筆名單時覆蓋
    if (props.lead?.id === leadId) {
      leadLogs.value = logsSnap.docs.map(d => d.data());
    }
  } catch (err) {
    console.error('載入回報日誌失敗', err);
  } finally {
    logsLoading.value = false;
  }
};

const showReasonField = computed(() => {
  return ['還在討論', '空號', '未接', '不考慮'].includes(reportForm.value.status);
});

watch(() => reportForm.value.status, (newStatus) => {
  isBookingCompleted.value = false;

  if (newStatus === '還在討論') {
    reportForm.value.reason = '家人討論';
    isReasonReadonly.value = true;
  } else if (newStatus === '空號') {
    reportForm.value.reason = '號碼錯誤/空號';
    isReasonReadonly.value = true;
  } else if (newStatus === '未接') {
    reportForm.value.reason = '未接電話';
    isReasonReadonly.value = true;
  } else if (newStatus === '不考慮') {
    reportForm.value.reason = '';
    isReasonReadonly.value = false;
  } else {
    reportForm.value.reason = '';
    isReasonReadonly.value = false;
  }
});

const openBookingDialog = () => {
  bookingInitialData.value = {
    customerName: props.lead.name,
    customerPhone: props.lead.phone,
    source: props.lead.source,
    note: ''
  };
  showBookingDialog.value = true;
};

const onBookingSaved = (bookingData) => {
  const rawDate = bookingData.reservationTime;
  const timeStr = rawDate?.toDate ? formatDateTime(rawDate) : new Date(rawDate).toLocaleString('zh-TW', { hour12: false });

  const summary = `【已約賞屋】\n時間：${timeStr}\n類型：${bookingData.type}\n姓名：${bookingData.customerName}\n電話：${bookingData.customerPhone}\n銷售：${bookingData.salesName || '不指定'}\n備註：${bookingData.note || '無'}`;

  reportForm.value.note = summary;
  isBookingCompleted.value = true;
  emit('notify', '預約成功，已自動帶入談話紀錄', 'success');
};

const submitBtnText = computed(() => {
  if (reportForm.value.status === '已約賞屋' && !isBookingCompleted.value) {
    return '請確認已完成預約';
  }
  return '完成回報';
});

const isSubmitDisabled = computed(() => {
  return !reportForm.value.status || (showReasonField.value && !reportForm.value.reason);
});

const submitReport = async () => {
  if (reportForm.value.status === '不考慮' && !reportForm.value.reason) {
    emit('notify', '請選擇未約原因', 'error');
    return;
  }
  try {
    uiStore.setLoading(true);
    await updateDoc(doc(db, 'leads', props.lead.id), {
      status: reportForm.value.status,
      reason: reportForm.value.reason,
      lastReportedAt: serverTimestamp()
    });

    // 存入 contactLogs 時務必帶 projectId，供 collectionGroup 統計使用
    await addDoc(collection(db, `leads/${props.lead.id}/contactLogs`), {
      ...reportForm.value,
      projectId: props.projectId,
      createdBy: userStore.user?.name || '系統人員',
      createdAt: serverTimestamp()
    });

    emit('notify', '回報成功', 'success');
    emit('saved');
    close();
    reportForm.value = { status: '', reason: '', note: '' };
  } catch (err) {
    emit('notify', err.message, 'error');
  } finally {
    uiStore.setLoading(false);
  }
};

const getStatusKey = (s) => ({ '已約賞屋': 'success', '不考慮': 'error', '未接': 'warning' }[s] || 'default');

const getStatusColor = (s) => {
  const colors = {
    '已約賞屋': '#4CAF50',
    '不考慮': '#F44336',
    '未接': '#FF9800',
    '空號': '#9E9E9E',
    '未處理': '#FF5722'
  };
  if (!s) return colors['未處理'];
  return colors[s] || '#3949AB';
};

const formatTime = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const formatDateTime = (ts) => {
  if (!ts) return '-';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(date.getTime())) return '-';

  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

const formatLeadDate = (raw) => {
  if (!raw) return '無日期';
  const str = raw.toString().trim();

  const zh = str.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (zh) {
    return `${zh[1]}/${zh[2].padStart(2, '0')}/${zh[3].padStart(2, '0')}`;
  }

  const ymd = str.match(/(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
  if (ymd) {
    return `${ymd[1]}/${ymd[2].padStart(2, '0')}/${ymd[3].padStart(2, '0')}`;
  }

  const d = new Date(str.replace(/-/g, '/'));
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}/${m}/${day}`;
  }

  return str;
};
</script>

<style scoped>
.section-title {
  font-size: 0.9rem;
  font-weight: 800;
  color: #3949ab;
  border-left: 4px solid #3949ab;
  padding-left: 10px;
}

.history-item {
  border-left: 6px solid #bdbdbd;
  border: 1px solid #e0e0e0 !important;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05) !important;
  transition: transform 0.2s ease-in-out;
}

.history-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1) !important;
}

.status-success { border-left-color: #4caf50 !important; }
.status-error { border-left-color: #f44336 !important; }
.status-warning { border-left-color: #ff9800 !important; }

.border-dashed { border: 2px dashed #e0e0e0; }

.border-bottom {
  border-bottom: 1px solid #e0e0e0;
}
</style>
