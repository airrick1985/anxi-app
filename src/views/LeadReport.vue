<template>
  <v-container class="fill-height bg-grey-lighten-4 align-start pa-2 pa-sm-4">
    <v-row justify="center" no-gutters>
      <v-col cols="12" sm="10" md="8" lg="6" xl="4">
        
        <div v-if="authStatus === 'loading'" class="text-center pa-10 mt-10">
          <v-progress-circular indeterminate color="indigo" size="50"></v-progress-circular>
          <p class="mt-4 text-grey-darken-1 font-weight-bold">{{ authMessage }}</p>
        </div>

        <v-card v-else-if="authStatus === 'denied'" class="rounded-xl pa-6 text-center elevation-3 border-0">
          <v-icon color="error" size="64">mdi-lock-alert</v-icon>
          <div class="text-h6 font-weight-bold mt-4 text-error">用戶無檢視資料權限</div>
          <p class="text-body-2 text-grey-darken-1 mt-2">
            {{ errorDetail || '您的 LINE 尚未綁定，或這筆名單已重新分配，請聯絡管理員確認。' }}
          </p>

          <v-divider class="my-6"></v-divider>
          
          <div class="text-subtitle-2 mb-3 text-primary font-weight-bold">ANXI 官方客服</div>
          <v-img 
            src="https://qr-official.line.me/gs/M_749vjisf_GW.png?oat_content=qr" 
            width="180" 
            class="mx-auto rounded-lg mb-4 shadow-sm"
          ></v-img>
          
          <v-btn 
            color="success" 
            block 
            rounded="pill" 
            prepend-icon="mdi-whatsapp"
            href="https://lin.ee/iPDcDsz5"
            target="_blank"
            elevation="2"
          >
            點我加入客服 LINE
          </v-btn>
        </v-card>

        <v-card v-else-if="authStatus === 'error'" class="rounded-xl pa-6 text-center elevation-3 border-0">
          <v-icon color="warning" size="64">mdi-alert-circle-outline</v-icon>
          <div class="text-h6 font-weight-bold mt-4">驗證失敗</div>
          <p class="text-body-2 text-grey-darken-1 mt-2">{{ errorDetail || '請重新整理後再試' }}</p>
          <v-btn color="primary" block rounded="pill" class="mt-4" prepend-icon="mdi-refresh" @click="retryAuth">重試</v-btn>
          <v-btn :href="lineEntryUrl" color="success" block variant="tonal" rounded="pill" class="mt-3">從 LINE 重新開啟</v-btn>
        </v-card>

        <v-card v-else-if="authStatus === 'granted'" class="rounded-xl elevation-3 overflow-hidden border-0">
          <v-toolbar color="primary" density="comfortable" dark>
            <v-toolbar-title class="text-subtitle-2 font-weight-bold">
              {{ projectName }} - 名單回報
            </v-toolbar-title>
          </v-toolbar>

          <v-card-text class="pa-4 bg-grey-lighten-4">
            <v-card class="pa-4 mb-4 rounded-xl elevation-2 bg-indigo-darken-4 text-white">
              <v-row align="center" no-gutters>
                <v-col cols="auto" class="me-4">
                  <v-avatar color="white" size="56">
                    <v-icon color="indigo-darken-4" size="32">mdi-account</v-icon>
                  </v-avatar>
                </v-col>
                <v-col>
                  <div class="text-h6 font-weight-bold">{{ leadData?.name }}</div>
                  <a
                    :href="`tel:${leadData?.phone ? leadData.phone.replace(/\\D/g, '') : ''}`"
                    class="text-h6 font-weight-bold d-flex align-center text-white text-decoration-none mt-1"
                  >
                    <v-icon size="20" class="me-1">mdi-phone</v-icon>
                    <span>{{ leadData?.phone }}</span>
                    <v-chip size="small" color="white" variant="flat" class="ms-2 text-indigo-darken-4 font-weight-bold">撥打</v-chip>
                  </a>
                </v-col>
              </v-row>

              <v-divider class="my-3 border-opacity-25" color="white"></v-divider>

              <v-row dense>
                <v-col cols="6">
                  <div class="text-caption opacity-70">來源管道</div>
                  <div class="text-body-2 font-weight-bold">{{ leadData?.source || '未註明' }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption opacity-70">購屋預算</div>
                  <div class="text-body-2 font-weight-bold">{{ leadData?.budget || '未填寫' }}</div>
                </v-col>
                <v-col cols="12" class="mt-2">
                  <div class="text-caption opacity-70">填表日期</div>
                  <div class="text-body-2 font-weight-bold">{{ leadData?.date || '無日期' }}</div>
                </v-col>
                
                <v-col cols="12" class="mt-2" v-if="leadData?.note">
                  <v-alert
                    density="compact"
                    color="indigo-lighten-1"
                    icon="mdi-note-text"
                    class="text-caption rounded-lg mt-1"
                  >
                    <div class="font-weight-bold mb-1">備註：</div>
                    {{ leadData.note }}
                  </v-alert>
                </v-col>
              </v-row>
            </v-card>

            <!-- ✅ 新增：明顯位置顯示現有預約記錄 -->
            <div v-if="existingReservations.length > 0" class="mb-6">
              <v-card class="pa-5 rounded-xl elevation-3" style="border-top: 5px solid #4caf50; background: linear-gradient(135deg, #f1f8f4 0%, #e8f5e9 100%);">
                <div class="d-flex align-center mb-4">
                  <v-icon size="28" color="success" class="me-3">mdi-calendar-check</v-icon>
                  <div>
                    <div class="text-h6 font-weight-bold text-success">現有預約紀錄</div>
                    <div class="text-caption text-grey-darken-1">共 {{ existingReservations.length }} 筆有效預約</div>
                  </div>
                </div>

                <v-divider class="my-3"></v-divider>

                <div
                  v-for="(res, idx) in existingReservations"
                  :key="res.id"
                  class="mb-4"
                  :class="{ 'pb-3 border-bottom': idx < existingReservations.length - 1 }"
                >
                  <v-row dense align="start">
                    <v-col cols="12" sm="6">
                      <div class="text-caption font-weight-bold text-primary mb-1">預約日期時間</div>
                      <div class="d-flex align-center">
                        <v-icon size="20" color="success" class="me-2">mdi-calendar-clock</v-icon>
                        <span class="text-body-1 font-weight-bold">{{ formatTime(res.reservationTime) }}</span>
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
              v-model="form.status"
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
                v-model="form.reason"
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
                v-model="form.reason"
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
              v-if="form.status === '已約賞屋'"
              block
              color="primary"
              variant="elevated"
              class="mb-4 font-weight-bold"
              prepend-icon="mdi-calendar-check"
              @click="openBookingDialog"
            >
              開啟預約視窗
            </v-btn>

            <v-textarea
              v-model="form.note"
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
                  :color="form.status === '已約賞屋' && !hasBooking ? 'grey-darken-1' : 'green'"
                  size="x-large" 
                  rounded="lg"
                  elevation="2"
                  min-width="200"
                  :disabled="isSubmitDisabled || isSubmitting"
                  :loading="isSubmitting"
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
            
            <div v-if="historyLogs.length === 0" class="text-center py-6 text-grey-lighten-1 border-dashed rounded-lg">
              無紀錄
            </div>

            <div v-else class="history-timeline">
              <v-card
                v-for="(log, idx) in historyLogs"
              :key="idx"
              variant="flat" 
              class="mb-3 pa-4 rounded-xl history-item custom-shadow"
              :class="`status-${getStatusKey(log.status)}`"
              >
                <div class="d-flex justify-space-between align-start mb-2">
                  <v-chip size="small" :color="getStatusColor(log.status)" class="font-weight-bold" variant="flat">
                    {{ log.status }}
                  </v-chip>
                  <span class="text-caption text-grey-darken-1 font-weight-bold">
                    {{ formatTime(log.createdAt) }}
                  </span>
                </div>
                <div v-if="log.reason" class="text-caption text-indigo-darken-4 font-weight-bold mb-1">
                  原因：{{ log.reason }}
                </div>
                <div class="text-body-2 font-weight-bold text-grey-darken-3 mb-1">{{ log.note }}</div>
                <div class="text-caption text-grey-darken-1">回報人：{{ log.createdBy }}</div>
              </v-card>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <ViewingReservationDialog 
      v-if="showBookingDialog"
      v-model="showBookingDialog"
      :project-id="leadData.projectId"
      :initial-data="bookingInitialData"
      @saved="onBookingSaved"
    />

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="2000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, reactive, watch, computed, defineAsyncComponent } from 'vue';
import { useRoute } from 'vue-router';
import { functions } from '@/firebase';
import { httpsCallable } from 'firebase/functions';
import { useUserStore } from '@/store/user';
import { initLiffAndEnsureLogin, getLiffProfileOrRelogin, getLiffAccessToken, buildLiffRedirectUri } from '@/utils/liffAuth';
import { leadReportLiffUrl, LEAD_REPORT_LIFF_ID } from '@/utils/leadReportLink';
// 回報表單不等待賞屋預約的大型相依套件。
const ViewingReservationDialog = defineAsyncComponent(() => import('@/components/ViewingReservationDialog.vue'));

const route = useRoute();
const userStore = useUserStore();

const leadId = typeof route.query.id === 'string' ? route.query.id : '';
const lineEntryUrl = leadReportLiffUrl(leadId);
const authMessage = ref('正在確認 LINE 身分…');
const isSubmitting = ref(false);
const callLeadReport = httpsCallable(functions, 'lineLeadReport', { timeout: 40000 });
// loading | granted | denied（未綁定／無權限）| error（驗證過程失敗，可重試）
const authStatus = ref('loading');
const errorDetail = ref('');
const readableError = (err) => ({
  'functions/deadline-exceeded': '連線逾時，請確認網路後重試。',
  'functions/unavailable': '服務暫時無法連線，請稍後重試。',
  'functions/unauthenticated': 'LINE 登入已失效，請從 LINE 重新開啟此名單。',
}[err?.code] || err?.message || '連線失敗，請確認網路後重試。');
const retryAuth = () => window.location.reload();
let authTimer;
let disposed = false;
onBeforeUnmount(() => { disposed = true; clearTimeout(authTimer); });
const PENDING_LEAD_KEY = 'pendingLeadReportId';
const projectName = ref('');
const leadData = ref({ name: '', phone: '', projectId: '', source: '', budget: '', date: '', note: '' });
const form = ref({ status: '', reason: '', note: '' });
const historyLogs = ref([]);
const snackbar = reactive({ show: false, text: '', color: '' });

// 預約連動相關
const showBookingDialog = ref(false);
const bookingInitialData = ref({});
const existingReservations = ref([]); // ✅ 新增：存儲現有預約記錄

const statusOptions = ref(['不考慮', '已約賞屋', '還在討論', '空號', '未接']);
const reasonOptions = ref([]);

/**
 * 邏輯連動
 */
const isReasonReadonly = ref(false);
const showReasonField = computed(() => {
  return ['還在討論', '空號', '未接', '不考慮'].includes(form.value.status);
});

// ✅ 新增：追蹤預約是否完成
const isBookingCompleted = ref(false);

watch(() => form.value.status, (newStatus) => {
  // ✅ 每次切換狀態時，重置預約完成標記
  isBookingCompleted.value = false;

  if (newStatus === '還在討論') {
    form.value.reason = '家人討論';
    isReasonReadonly.value = true;
  } else if (newStatus === '空號') {
    form.value.reason = '號碼錯誤/空號';
    isReasonReadonly.value = true;
  } else if (newStatus === '未接') {
    form.value.reason = '未接電話';
    isReasonReadonly.value = true;
  } else if (newStatus === '不考慮') {
    form.value.reason = '';
    isReasonReadonly.value = false;
  } else {
    form.value.reason = '';
    isReasonReadonly.value = false;
  }
});

// 所有權限與資料讀取由後端使用 LINE token 驗證，不依賴 ANXI 登入或 WebView 的 Firestore 快取。
const fetchReport = async () => {
  const { data } = await callLeadReport({ leadId, accessToken: getLiffAccessToken() });
  return data;
};
const applyReport = (data) => {
  leadData.value = data.lead;
  projectName.value = data.projectName;
  statusOptions.value = data.statusOptions;
  reasonOptions.value = data.reasonOptions;
  historyLogs.value = data.logs;
  existingReservations.value = data.reservations
    .map(item => ({ ...item, reservationTime: new Date(item.reservationTime) }))
    .filter(item => item.reservationTime > new Date())
    .sort((a, b) => a.reservationTime - b.reservationTime);
  // 預約對話框使用同一份員工資料；不同身分不能沿用前一次 ANXI session。
  if (userStore.user?.key !== data.user.key) userStore.sessionId = null;
  userStore.user = data.user;
  if (data.detailsIncomplete) showMsg('部分歷史或預約資料暫時無法載入，可重新整理再試。', 'warning');
};

onMounted(async () => {
  if (!leadId) {
    authStatus.value = 'error';
    errorDetail.value = '名單連結不完整，請重新點選 LINE 通知中的「回報聯絡狀況」。';
    return;
  }
  // 包含 LINE 跳轉未發生的情況：任何一步都不會永久停留在驗證中。
  authTimer = setTimeout(() => {
    if (authStatus.value === 'loading') {
      authStatus.value = 'error';
      errorDetail.value = '連線時間較久，請確認網路後重試，或從 LINE 重新開啟。';
    }
  }, 45000);
  try {
    const loginOpts = {
      redirectUri: buildLiffRedirectUri(`contact?id=${encodeURIComponent(leadId)}`),
      onBeforeLogin: () => {
        authMessage.value = '正在連接 LINE，完成授權後會自動回到此名單…';
        try { localStorage.setItem(PENDING_LEAD_KEY, JSON.stringify({ id: leadId, ts: Date.now() })); } catch { /* ignore */ }
      },
    };
    const ready = await initLiffAndEnsureLogin(import.meta.env.VITE_LIFF_ID_LEAD_REPORT || LEAD_REPORT_LIFF_ID, loginOpts);
    if (!ready) return;
    const profile = await getLiffProfileOrRelogin(loginOpts);
    if (!profile) return;
    authMessage.value = '正在確認名單權限並載入回報表單…';
    const data = await fetchReport();
    if (disposed || authStatus.value !== 'loading') return;
    applyReport(data);
    try { localStorage.removeItem(PENDING_LEAD_KEY); } catch { /* ignore */ }
    authStatus.value = 'granted';
  } catch (err) {
    if (disposed || authStatus.value !== 'loading') return;
    errorDetail.value = readableError(err);
    authStatus.value = err?.code === 'functions/permission-denied' ? 'denied' : 'error';
  } finally {
    if (authStatus.value !== 'loading') clearTimeout(authTimer);
  }
});

const openBookingDialog = () => {
  bookingInitialData.value = {
    customerName: leadData.value.name,
    customerPhone: leadData.value.phone,
    source: leadData.value.source,
    note: ''
  };
  showBookingDialog.value = true;
};

/**
 * 當預約儲存成功後的處理
 * @param {Object} bookingData 來自 Dialog 的預約資料
 */
const onBookingSaved = async (bookingData) => {
  // 1. 格式化時間 (處理 Timestamp 或 Date 物件)
  const rawDate = bookingData.reservationTime;
  const timeStr = rawDate?.toDate ? formatTime(rawDate) : new Date(rawDate).toLocaleString('zh-TW', { hour12: false });

  // 2. 整理易讀的談話紀錄格式
  const summary = `【已約賞屋】
時間：${timeStr}
類型：${bookingData.type}
姓名：${bookingData.customerName}
電話：${bookingData.customerPhone}
銷售：${bookingData.salesName || '不指定'}
備註：${bookingData.note || '無'}`;

  // 3. 填入詳細談話紀錄 TEXTAREA
  form.value.note = summary;

  // ✅ 4. 標記預約已完成
  isBookingCompleted.value = true;

  // ✅ 5. 預約成功後「自動送出回報」，避免業務忘記手動按送出，
  //    導致名單明明已聯絡並完成預約，卻仍停留在「未處理」狀態
  await submitReport('預約已建立，並已自動完成回報 ✅');
};

// ✅ 新增：計算按鈕文字
const hasBooking = computed(() => isBookingCompleted.value || existingReservations.value.length > 0);

const submitBtnText = computed(() => {
  if (form.value.status === '已約賞屋' && !hasBooking.value) {
    return '請先完成賞屋預約';
  }
  return '送出回報內容';
});

// ✅ 新增：計算按鈕是否禁用
const isSubmitDisabled = computed(() => {
  const baseValidation = !form.value.status || (showReasonField.value && !form.value.reason);
  const bookingValidation = (form.value.status === '已約賞屋' && !hasBooking.value);
  return baseValidation || bookingValidation;
});

let pendingSubmission;
const submitReport = async (successMsg = '回報成功') => {
  if (isSubmitting.value || isSubmitDisabled.value) return;
  isSubmitting.value = true;
  const report = { ...form.value };
  const fingerprint = JSON.stringify(report);
  if (pendingSubmission?.fingerprint !== fingerprint) {
    pendingSubmission = { fingerprint, requestId: crypto.randomUUID() };
  }
  try {
    await callLeadReport({ leadId, accessToken: getLiffAccessToken(), action: 'submit', report, requestId: pendingSubmission.requestId });
    historyLogs.value.unshift({ ...report, createdBy: userStore.user?.name || '業務人員', createdAt: new Date().toISOString() });
    pendingSubmission = null;
    showMsg(typeof successMsg === 'string' ? successMsg : '回報成功', 'success');
    form.value = { status: '', reason: '', note: '' };
    isBookingCompleted.value = false;
  } catch (err) {
    showMsg(readableError(err), 'error');
  } finally {
    isSubmitting.value = false;
  }
};

const showMsg = (t, c) => { snackbar.text = t; snackbar.color = c; snackbar.show = true; };
const formatTime = (ts) => ts ? (ts.toDate ? ts.toDate() : new Date(ts)).toLocaleString('zh-TW', { hour12: false }) : '';
const getStatusColor = (s) => ({ '已約賞屋': 'success', '不考慮': 'error', '未接': 'warning' }[s] || 'indigo');
const getStatusKey = (s) => ({ '已約賞屋': 'success', '不考慮': 'error', '未接': 'warning' }[s] || 'default');
</script>

<style scoped>
.info-label { font-size: 0.75rem; color: #5c6bc0; font-weight: 800; margin-bottom: 2px; }
.info-value { font-size: 0.95rem; font-weight: 800; color: #1a237e; line-height: 1.2; }
.section-title { font-size: 0.9rem; font-weight: 800; color: #3949ab; border-left: 4px solid #3949ab; padding-left: 10px; }
.clickable-phone { text-decoration: none; }
.clickable-phone span { border-bottom: 2px solid rgba(48, 63, 159, 0.3); }
.border-left-custom { border-left: 1px solid rgba(63, 81, 181, 0.15); }
.border-dashed { border: 2px dashed #e0e0e0; }
.history-item { border-left: 6px solid #bdbdbd; }
.status-success { border-left-color: #4caf50; }
.status-error { border-left-color: #f44336; }
.status-warning { border-left-color: #ff9800; }

.history-item {
  /* 基礎側邊粗線 (您目前的樣式) */
  border-left: 6px solid #bdbdbd; 
  
  /* ✅ 加入全框線：淡灰色 */
  border: 1px solid #e0e0e0 !important; 
  
  /* ✅ 加入細緻陰影 */
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05) !important;
  
  transition: transform 0.2s ease-in-out;
}

/* 滑鼠經過或點擊時的微互動 (選配) */
.history-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1) !important;
}

</style>