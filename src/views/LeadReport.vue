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
          <v-toolbar color="indigo-darken-4" density="comfortable" dark>
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
                    <div class="info-label">名單來源</div>
                    <div class="info-value text-truncate">
                      <v-icon size="14" class="me-1">mdi-tray-arrow-down</v-icon>{{ leadData.source || '未註明' }}
                    </div>
                  </v-col>
                  <v-col cols="6" class="ps-2 border-left-custom">
                    <div class="info-label">購屋預算</div>
                    <div class="info-value text-truncate">
                      <v-icon size="14" class="me-1">mdi-currency-usd</v-icon>{{ leadData.budget || '未填寫' }}
                    </div>
                  </v-col>
                  
                  <v-col cols="12"><v-divider class="my-3 opacity-30"></v-divider></v-col>
                  
                  <v-col cols="12">
                    <div class="info-label">填表日期</div>
                    <div class="info-value">
                      <v-icon size="14" class="me-1">mdi-calendar-clock</v-icon>{{ leadData.date || '無日期紀錄' }}
                    </div>
                  </v-col>
                </v-row>
              </div>
            </v-card>

            <div class="section-title mb-3">聯絡狀況紀錄</div>
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

            <v-select
              v-if="form.status === '不考慮'"
              v-model="form.reason"
              :items="reasonOptions"
              label="未約原因 (必填)"
              variant="outlined"
              rounded="lg"
              class="mb-3"
              density="comfortable"
              hide-details
              color="indigo-darken-4"
            ></v-select>

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
              color="indigo-darken-4" 
              size="x-large" 
              rounded="lg"
              elevation="2"
              :disabled="!form.status || (form.status === '不考慮' && !form.reason)"
              @click="submitReport"
              class="font-weight-bold"
            >
              送出回報內容
            </v-btn>

            <div class="section-title mt-8 mb-3 d-flex align-center">
              <v-icon size="20" class="me-2">mdi-history</v-icon>最近聯絡日誌
            </div>
            
            <div v-if="historyLogs.length === 0" class="text-center py-6 text-grey-lighten-1 border-dashed rounded-lg">
              目前暫無歷史紀錄
            </div>

            <div v-else class="history-timeline">
              <v-card
                v-for="(log, idx) in historyLogs"
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
                    {{ formatTime(log.createdAt) }}
                  </span>
                </div>
                <div class="text-body-2 font-weight-bold text-grey-darken-3 mb-1">{{ log.note }}</div>
                <div class="text-caption text-grey-darken-1">回報人：{{ log.createdBy }}</div>
              </v-card>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="2000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';
import { db } from '@/firebase';
import { 
  doc, getDoc, updateDoc, addDoc, collection, serverTimestamp, 
  query, where, getDocs, orderBy 
} from 'firebase/firestore';
import { useUiStore } from '@/store/uiStore';
import { useUserStore } from '@/store/user';
import liff from '@line/liff';

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

const statusOptions = ref(['不考慮', '已約賞屋', '空號', '未接']);
const reasonOptions = ref(['家人討論', '總價太高', '單價太高', '暫不買房', '要找成屋', '號碼錯誤/空號']);

/**
 * 核心權限驗證邏輯
 */
const verifyAccess = async (lineId) => {
  try {
    // 1. 取得名單所屬專案
    const leadSnap = await getDoc(doc(db, 'leads', leadId));
    if (!leadSnap.exists()) throw new Error('名單不存在');
    const leadInfo = leadSnap.data();
    const targetProjectId = leadInfo.projectId;

    // 2. 透過 lineId 查找對應 phone
    const userQuery = query(collection(db, 'users'), where('lineId', '==', lineId));
    const userSnap = await getDocs(userQuery);
    if (userSnap.empty) return false;
    
    const userData = userSnap.docs[0].data();
    const userPhone = userData.phone;

    // 3. 檢查 userPermissions
    const permSnap = await getDoc(doc(db, 'userPermissions', userPhone));
    if (!permSnap.exists()) return false;

    const permissions = permSnap.data().permissions || {};
    const projectPerm = permissions[targetProjectId];

    // 4. 判斷權限與角色
    if (projectPerm && projectPerm.systems) {
      const hasRole = projectPerm.systems.some(s => s.includes('客資系統'));
      if (hasRole) {
        projectName.value = projectPerm.projectName || targetProjectId;
        userStore.user = { name: userData.name, phone: userPhone };
        leadData.value = { id: leadSnap.id, ...leadInfo };
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error('VerifyAccess Error:', err);
    return false;
  }
};

onMounted(async () => {
  console.log('當前讀取的 LIFF ID:', import.meta.env.VITE_LIFF_ID);
  
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
      // 載入紀錄
      const logsSnap = await getDocs(query(
        collection(db, `leads/${leadId}/contactLogs`),
        orderBy('createdAt', 'desc')
      ));
      historyLogs.value = logsSnap.docs.map(d => d.data());
    } else {
      authStatus.value = 'denied';
    }
  } catch (err) {
    console.error('LIFF Init Error:', err);
    authStatus.value = 'denied';
  }
});

/**
 * 送出回報
 */
const submitReport = async () => {
  const currentUserName = userStore.user?.name || '業務人員';
  try {
    uiStore.setLoading(true);
    
    await updateDoc(doc(db, 'leads', leadId), {
      status: form.value.status,
      lastReportedAt: serverTimestamp()
    });

    await addDoc(collection(db, `leads/${leadId}/contactLogs`), {
      ...form.value,
      createdBy: currentUserName,
      createdAt: serverTimestamp()
    });

    showMsg('回報提交成功！', 'success');
    form.value.note = '';
    
    // 重新整理
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
.info-label {
  font-size: 0.75rem;
  color: #5c6bc0;
  font-weight: 800;
  margin-bottom: 2px;
}
.info-value {
  font-size: 0.95rem;
  font-weight: 800;
  color: #1a237e;
  line-height: 1.2;
}
.section-title {
  font-size: 0.9rem;
  font-weight: 800;
  color: #3949ab;
  border-left: 4px solid #3949ab;
  padding-left: 10px;
}
.clickable-phone {
  text-decoration: none;
  transition: opacity 0.2s;
}
.clickable-phone:active {
  opacity: 0.6;
}
.clickable-phone span {
  border-bottom: 2px solid rgba(48, 63, 159, 0.3);
}
.border-left-custom {
  border-left: 1px solid rgba(63, 81, 181, 0.15);
}
.border-dashed {
  border: 2px dashed #e0e0e0;
}
.history-item {
  border-left: 6px solid #bdbdbd;
}
.status-success { border-left-color: #4caf50; }
.status-error { border-left-color: #f44336; }
.status-warning { border-left-color: #ff9800; }

@media (max-width: 360px) {
  .info-value { font-size: 0.85rem; }
}
</style>