<template>
  <v-container class="fill-height bg-grey-lighten-4 align-start pa-2 pa-sm-4">
    <v-row justify="center" no-gutters>
      <v-col cols="12" sm="10" md="8" lg="6" xl="4">
        
        <div v-if="authStatus === 'loading'" class="text-center pa-10 mt-10">
          <v-progress-circular indeterminate color="indigo" size="50"></v-progress-circular>
          <p class="mt-4 text-grey-darken-1 font-weight-bold">安全驗證中，請稍候...</p>
        </div>

        <v-card v-else-if="authStatus === 'denied'" class="rounded-xl pa-6 text-center elevation-3 border-0">
          <v-icon color="error" size="64">mdi-lock-alert</v-icon>
          <div class="text-h6 font-weight-bold mt-4 text-error">用戶無檢視資料權限</div>
          <p class="text-body-2 text-grey-darken-1 mt-2">
            您的身份尚未綁定或無此項目的作業權限，<br>請聯絡 ANXI 客服進行開通。
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

        <v-card v-else-if="authStatus === 'granted'" class="rounded-xl elevation-3 overflow-hidden border-0">
          <v-toolbar color="primary" density="comfortable" dark>
            <v-toolbar-title class="text-subtitle-2 font-weight-bold">
              {{ projectName }} - 名單回報
            </v-toolbar-title>
          </v-toolbar>

          <v-card-text class="pa-4">
            <div class="d-flex align-center mb-5">
              <v-avatar color="indigo-darken-4" size="60" class="elevation-2 me-4">
                <v-icon color="white" size="36">mdi-account</v-icon>
              </v-avatar>
              <div>
                <div class="text-h5 font-weight-bold indigo--text text--darken-4">{{ leadData.name }}</div>
                <a 
                  :href="`tel:${leadData.phone ? leadData.phone.replace(/\D/g, '') : ''}`"
                  class="text-subtitle-1 text-indigo-darken-2 font-weight-bold clickable-phone d-flex align-center mt-1"
                >
                  <v-icon size="20" class="me-1">mdi-phone-outgoing</v-icon>
                  <span>{{ leadData.phone }}</span>
                  <v-chip size="x-small" color="indigo-lighten-4" variant="flat" class="ms-2 text-indigo-darken-4">撥打</v-chip>
                </a>
              </div>
            </div>

            <v-card variant="flat" class="bg-indigo-lighten-5 rounded-lg mb-6 border-indigo-lighten-4 border">
              <div class="pa-3">
                <v-row no-gutters>
                  <v-col cols="6" class="pe-2">
                    <div class="info-label">來源</div>
                    <div class="info-value text-truncate">
                      <v-icon size="14" class="me-1">mdi-tray-arrow-down</v-icon>{{ leadData.source || '未註明' }}
                    </div>
                  </v-col>
                  <v-col cols="6" class="ps-2 border-left-custom">
                    <div class="info-label">預算</div>
                    <div class="info-value text-truncate">
                      <v-icon size="14" class="me-1">mdi-currency-usd</v-icon>{{ leadData.budget || '未填寫' }}
                    </div>
                  </v-col>
                  
                  <v-col cols="12"><v-divider class="my-3 opacity-30"></v-divider></v-col>
                  
                  <v-col cols="12">
                    <div class="info-label">填表日期</div>
                    <div class="info-value">
                      <v-icon size="14" class="me-1">mdi-calendar-clock</v-icon>{{ leadData.date || '無日期' }}
                    </div>
                  </v-col>
                </v-row>
              </div>
            </v-card>

            <div class="section-title mb-3">聯絡狀況</div>
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

              <v-btn 
                block 
                :color="form.status === '已約賞屋' && !isBookingCompleted ? 'grey-darken-1' : 'green'" 
                size="x-large" 
                rounded="lg"
                elevation="2"
                :disabled="isSubmitDisabled"
                @click="submitReport"
                class="font-weight-bold"
              >
                {{ submitBtnText }}
              </v-btn>

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
import { ref, onMounted, reactive, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { db } from '@/firebase';
import { 
  doc, getDoc, updateDoc, addDoc, collection, serverTimestamp, 
  query, where, getDocs, orderBy 
} from 'firebase/firestore';
import { useUiStore } from '@/store/uiStore';
import { useUserStore } from '@/store/user';
import liff from '@line/liff';
import ViewingReservationDialog from '@/components/ViewingReservationDialog.vue';

const route = useRoute();
const uiStore = useUiStore();
const userStore = useUserStore();

const leadId = route.query.id;
const authStatus = ref('loading');
const projectName = ref('');
const leadData = ref({ name: '', phone: '', projectId: '', source: '', budget: '', date: '' });
const form = ref({ status: '', reason: '', note: '' });
const historyLogs = ref([]);
const snackbar = reactive({ show: false, text: '', color: '' });

// 預約連動相關
const showBookingDialog = ref(false);
const bookingInitialData = ref({});

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

/**
 * 權限與設定驗證
 */
const verifyAccess = async (lineId) => {
  try {
    const leadSnap = await getDoc(doc(db, 'leads', leadId));
    if (!leadSnap.exists()) throw new Error('名單不存在');
    const leadInfo = leadSnap.data();
    const targetProjectId = leadInfo.projectId;

    const setSnap = await getDoc(doc(db, 'projectSettings', targetProjectId));
    if (setSnap.exists()) {
      const settings = setSnap.data();
      if (settings.statusOptions?.length > 0) statusOptions.value = settings.statusOptions;
      if (settings.reasonOptions?.length > 0) reasonOptions.value = settings.reasonOptions;
    }

    const userQuery = query(collection(db, 'users'), where('lineId', '==', lineId));
    const userSnap = await getDocs(userQuery);
    if (userSnap.empty) return false;
    
    const userData = userSnap.docs[0].data();
    const userPhone = userData.phone;

    const permSnap = await getDoc(doc(db, 'userPermissions', userPhone));
    if (!permSnap.exists()) return false;

    const permissions = permSnap.data().permissions || {};
    const projectPerm = permissions[targetProjectId];

    if (projectPerm && projectPerm.systems) {
      const hasRole = projectPerm.systems.some(s => s.includes('客資系統'));
      if (hasRole) {
        projectName.value = projectPerm.projectName || targetProjectId;
        // ✅ 修正點：加入 key 屬性，避免預約組件 operatorId 報錯
        userStore.user = { 
            name: userData.name, 
            phone: userPhone, 
            key: userPhone 
        };
        leadData.value = { id: leadSnap.id, ...leadInfo };
        return true;
      }
    }
    return false;
  } catch (err) {
    return false;
  }
};

onMounted(async () => {
  if (!leadId) { authStatus.value = 'denied'; return; }
  try {
    await liff.init({ liffId: import.meta.env.VITE_LIFF_ID });
    if (!liff.isLoggedIn()) {
      liff.login({ redirectUri: window.location.href });
      return;
    }
    const profile = await liff.getProfile();
    const isGranted = await verifyAccess(profile.userId);
    if (isGranted) {
      authStatus.value = 'granted';
      const logsSnap = await getDocs(query(
        collection(db, `leads/${leadId}/contactLogs`),
        orderBy('createdAt', 'desc')
      ));
      historyLogs.value = logsSnap.docs.map(d => d.data());
    } else {
      authStatus.value = 'denied';
    }
  } catch (err) {
    authStatus.value = 'denied';
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
const onBookingSaved = (bookingData) => {
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

  showMsg('預約成功，已自動帶入談話紀錄', 'success');
};

// ✅ 新增：計算按鈕文字
const submitBtnText = computed(() => {
  if (form.value.status === '已約賞屋' && !isBookingCompleted.value) {
    return '請先完成賞屋預約';
  }
  return '送出回報內容';
});

// ✅ 新增：計算按鈕是否禁用
const isSubmitDisabled = computed(() => {
  const baseValidation = !form.value.status || (showReasonField.value && !form.value.reason);
  const bookingValidation = (form.value.status === '已約賞屋' && !isBookingCompleted.value);
  return baseValidation || bookingValidation;
});

const submitReport = async () => {
  const currentUserName = userStore.user?.name || '業務人員';
  try {
    uiStore.setLoading(true);
    await updateDoc(doc(db, 'leads', leadId), {
      status: form.value.status,
      reason: form.value.reason,
      lastReportedAt: serverTimestamp()
    });
    await addDoc(collection(db, `leads/${leadId}/contactLogs`), {
      ...form.value,
      createdBy: currentUserName,
      createdAt: serverTimestamp()
    });
    showMsg('回報成功', 'success');
    form.value.note = '';
    const logsSnap = await getDocs(query(collection(db, `leads/${leadId}/contactLogs`), orderBy('createdAt', 'desc')));
    historyLogs.value = logsSnap.docs.map(d => d.data());
  } catch (err) {
    showMsg('提交失敗', 'error');
  } finally {
    uiStore.setLoading(false);
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