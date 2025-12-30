<template>
  <v-container class="fill-height bg-grey-lighten-4 align-start pa-4">
    <v-row justify="center">
      <v-col cols="12" max-width="500">
        
        <div v-if="isLoading" class="text-center pa-10 mt-10">
          <v-progress-circular indeterminate color="primary" size="50"></v-progress-circular>
          <p class="mt-4 text-grey-darken-1">正在讀取客戶資料...</p>
        </div>

        <v-alert v-else-if="!leadData" type="error" variant="tonal" class="rounded-lg">
          找不到該筆名單，請確認連結是否正確。
        </v-alert>

        <v-card v-else class="rounded-xl elevation-3 overflow-hidden">
          <v-toolbar color="indigo-darken-4" density="comfortable">
            <v-toolbar-title class="text-subtitle-1 font-weight-bold">
              🏠 名單進度回報
            </v-toolbar-title>
          </v-toolbar>

          <v-card-text class="pa-5">
            <div class="d-flex align-center mb-4">
              <v-avatar color="indigo-lighten-5" size="48" class="me-3">
                <v-icon color="indigo">mdi-account</v-icon>
              </v-avatar>
              <div>
                <div class="text-h6 font-weight-bold">{{ leadData.name }}</div>
                <div class="text-body-2 text-indigo-darken-2 font-weight-medium">
                  {{ leadData.phone }}
                </div>
              </div>
              <v-spacer></v-spacer>
              <v-chip size="x-small" color="grey-lighten-2" variant="flat">
                {{ leadData.source }}
              </v-chip>
            </div>

            <v-divider class="mb-5"></v-divider>

            <div class="text-subtitle-2 mb-2 grey--text">聯絡進度</div>
            <v-select
              v-model="form.status"
              :items="statusOptions"
              label="選擇目前狀況"
              variant="outlined"
              color="primary"
              density="comfortable"
              class="mb-2"
              rounded="lg"
            ></v-select>

            <v-expand-transition>
              <div v-if="form.status === '不考慮'">
                <v-select
                  v-model="form.reason"
                  :items="reasonOptions"
                  label="請選擇未約原因"
                  variant="outlined"
                  color="error"
                  density="comfortable"
                  class="mb-2"
                  rounded="lg"
                ></v-select>
              </div>
            </v-expand-transition>

            <div class="text-subtitle-2 mb-2 mt-2 grey--text">詳細備註</div>
            <v-textarea
              v-model="form.note"
              label="輸入聯絡細節..."
              variant="outlined"
              color="primary"
              rows="4"
              rounded="lg"
              persistent-placeholder
              placeholder="例如：客戶目前在出國，約下週三再聯繫。"
            ></v-textarea>
          </v-card-text>

          <v-card-actions class="pa-5 pt-0">
            <v-btn 
              block 
              color="indigo-darken-4" 
              size="x-large" 
              variant="elevated" 
              rounded="pill"
              class="font-weight-bold"
              :disabled="!form.status"
              @click="submitReport"
            >
              送出回報
            </v-btn>
          </v-card-actions>
        </v-card>

        <v-card v-if="historyLogs.length > 0" class="mt-6 rounded-xl" variant="flat" border>
          <v-card-title class="text-subtitle-2 d-flex align-center">
            <v-icon start size="18">mdi-history</v-icon>
            最近回報軌跡
          </v-card-title>
          <v-card-text class="pa-0">
            <v-list lines="three" density="compact" bg-color="transparent">
              <v-list-item v-for="(log, idx) in historyLogs" :key="idx" :border="idx !== historyLogs.length - 1">
                <v-list-item-title class="text-caption font-weight-bold d-flex align-center">
                  <v-chip size="x-small" :color="getStatusColor(log.status)" class="me-2" variant="flat">
                    {{ log.status }}
                  </v-chip>
                  <span v-if="log.reason" class="text-error">[{{ log.reason }}]</span>
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption mt-1">
                  {{ log.note || '(無備註)' }}
                </v-list-item-subtitle>
                <template v-slot:append>
                  <div class="text-right">
                    <div class="text-caption text-grey">{{ formatTime(log.createdAt) }}</div>
                    <div class="text-caption text-grey-lighten-1">{{ log.createdBy }}</div>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <div class="text-center mt-6 text-caption text-grey-lighten-1">
          ANXI Smart System v1.0
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { db } from '@/firebase';
import { 
  doc, getDoc, updateDoc, collection, addDoc, 
  serverTimestamp, query, orderBy, getDocs 
} from 'firebase/firestore';
import { useUserStore } from '@/store/user';
import { useUiStore } from '@/store/uiStore';
import liff from '@line/liff';

const route = useRoute();
const userStore = useUserStore();
const uiStore = useUiStore();

// --- 狀態定義 ---
const leadId = route.query.id; // 從 URL 獲取 ?id=xxx
const isLoading = ref(true);
const leadData = ref(null);
const historyLogs = ref([]);

const form = ref({ status: '', reason: '', note: '' });
const statusOptions = ref(['不考慮', '已約賞屋', '空號', '未接']);
const reasonOptions = ref(['家人討論', '總價太高', '單價太高', '暫不買房', '號碼錯誤/空號']);

// --- LIFF 與資料初始化 ---
onMounted(async () => {
  try {
    // 1. LIFF 初始化 (請替換為您的正式 LIFF ID)
    await liff.init({ liffId: '2006718044-XXXXXX' });

    // 2. 自動登入檢查
    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    if (!leadId) {
      isLoading.value = false;
      return;
    }

    // 3. 讀取 Firebase 資料
    const leadSnap = await getDoc(doc(db, 'leads', leadId));
    if (leadSnap.exists()) {
      leadData.value = leadSnap.data();
      
      // 讀取該專案的自訂選項設定
      const setSnap = await getDoc(doc(db, 'projectSettings', leadData.value.projectId));
      if (setSnap.exists()) {
        const settings = setSnap.data();
        if (settings.statusOptions) statusOptions.value = settings.statusOptions;
        if (settings.reasonOptions) reasonOptions.value = settings.reasonOptions;
      }

      // 讀取歷史回報
      const logsSnap = await getDocs(query(
        collection(db, `leads/${leadId}/contactLogs`),
        orderBy('createdAt', 'desc')
      ));
      historyLogs.value = logsSnap.docs.map(d => d.data());
    }
  } catch (err) {
    console.error("初始化失敗:", err);
  } finally {
    isLoading.value = false;
  }
});

// --- 送出回報 ---
const submitReport = async () => {
  if (!form.value.status) return;

  try {
    uiStore.setLoading(true);

    // A. 更新名單主檔狀態
    await updateDoc(doc(db, 'leads', leadId), {
      status: form.value.status,
      lastReportedAt: serverTimestamp()
    });

    // B. 新增一筆聯絡日誌
    await addDoc(collection(db, `leads/${leadId}/contactLogs`), {
      ...form.value,
      createdBy: userStore.user?.name || '業務人員',
      createdAt: serverTimestamp()
    });

    uiStore.showSnackbar('回報提交成功！', 'success');

    // C. 成功後延遲 1.5 秒自動關閉 LIFF 視窗
    setTimeout(() => {
      if (liff.isInClient()) {
        liff.closeWindow();
      }
    }, 1500);

  } catch (err) {
    console.error("提交失敗:", err);
    uiStore.showSnackbar('提交失敗，請檢查網路連線', 'error');
  } finally {
    uiStore.setLoading(false);
  }
};

// --- 輔助函式 ---
const formatTime = (ts) => {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleString('zh-TW', { 
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false 
  });
};

const getStatusColor = (status) => {
  const map = { '已約賞屋': 'success', '不考慮': 'error', '未接': 'warning', '空號': 'grey' };
  return map[status] || 'indigo';
};
</script>

<style scoped>
/* 讓手機版介面更有質感 */
.v-container {
  max-width: 600px;
  margin: 0 auto;
}
</style>