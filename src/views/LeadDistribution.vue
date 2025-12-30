<template>
  <v-container fluid class="pa-4 bg-grey-lighten-4 fill-height align-start">
    <v-row>
      <v-col cols="12" class="d-flex align-center pb-0">
        <v-btn icon="mdi-arrow-left" variant="text" @click="router.back()" class="me-2"></v-btn>
        <div>
          <h2 class="text-h6 font-weight-bold text-primary">聯絡名單管理</h2>
          <div class="text-caption text-grey">{{ projectName }}</div>
        </div>
        <v-spacer></v-spacer>
        <v-btn v-if="isReceptionist" icon="mdi-cog" variant="text" color="grey-darken-1" @click="showSettings = true"></v-btn>
      </v-col>

      <v-col cols="12">
        <v-tabs v-model="activeTab" color="primary" grow density="compact">
          <v-tab v-if="isReceptionist" value="management">
            <v-icon start>mdi-tray-arrow-down</v-icon>名單分配管理
          </v-tab>
          <v-tab value="status">
            <v-icon start>mdi-clipboard-text-clock</v-icon>名單聯絡狀況
          </v-tab>
        </v-tabs>

        <v-window v-model="activeTab" class="mt-4">
          
          <v-window-item value="management" v-if="isReceptionist">
            <v-row>
              <v-col cols="12" md="6">
                <v-card variant="flat" class="rounded-lg pa-4 fill-height">
                  <div class="text-subtitle-2 font-weight-bold mb-4">處理進度統計</div>
                  <div style="height: 200px; position: relative;">
                    <Doughnut :data="progressChartData" :options="chartOptions" />
                    <div class="chart-center-label">
                      <div class="text-h5 font-weight-bold">{{ completionRate }}%</div>
                      <div class="text-caption text-grey">完成率</div>
                    </div>
                  </div>
                </v-card>
              </v-col>
              
              <v-col cols="12" md="6">
                    <v-card variant="flat" class="rounded-lg pa-4">
                        <div class="text-subtitle-2 font-weight-bold mb-4">銷售人員分配量 (負荷監控)</div>
                        <div style="position: relative; height: 200px;">
                        <Bar :data="staffLoadChartData" :options="barOptions" />
                        </div>
                    </v-card>
                    </v-col>

              <v-col cols="12" class="d-flex gap-2">
                <v-btn color="primary" prepend-icon="mdi-text-box-plus" @click="showUploadDialog = true">上傳名單文本</v-btn>
                <v-btn v-if="isAdmin" variant="outlined" color="error" prepend-icon="mdi-trash-can-outline" @click="showRecycleBin = true">回收站</v-btn>
              </v-col>

              <v-col cols="12">
                <v-data-table
                  v-model="selectedLeads"
                  :headers="mgmtHeaders"
                  :items="unassignedLeads"
                  show-select
                  class="rounded-lg elevation-1"
                >
                  <template v-slot:item.phone="{ item }">
                    {{ item.phone }}
                    <v-chip v-if="item.duplicateCount > 0" color="error" size="x-small" class="ms-1" @click="openHistory(item.phone)">
                      重複 {{ item.duplicateCount }}
                    </v-chip>
                  </template>
                </v-data-table>
              </v-col>
            </v-row>

<v-footer v-if="selectedLeads?.length > 0" app color="white" border class="pa-4">
              <v-row align="center" no-gutters>
                <v-col>已選 {{ selectedLeads.length }} 筆名單</v-col>
                <v-col cols="6" md="3">
                  <v-select
                    v-model="selectedSalesId"
                    :items="salesStaff"
                    item-title="name"
                    item-value="id"
                    label="指派給銷售人員"
                    density="compact"
                    hide-details
                  ></v-select>
                </v-col>
                <v-col class="text-end">
                  <v-btn color="success" :disabled="!selectedSalesId" @click="confirmAssignment">執行分配</v-btn>
                </v-col>
              </v-row>
            </v-footer>
          </v-window-item>

          <v-window-item value="status">
            <v-data-table
              :headers="statusHeaders"
              :items="filteredLeads"
              class="rounded-lg elevation-1"
            >
              <template v-slot:item.status="{ item }">
                <v-chip :color="getStatusColor(item.status)" size="small">
                  {{ item.status || '未處理' }}
                </v-chip>
              </template>
              <template v-slot:item.actions="{ item }">
                <v-btn icon="mdi-comment-edit" variant="text" color="primary" @click="openReport(item)"></v-btn>
                <v-btn v-if="isReceptionist" icon="mdi-delete" variant="text" color="error" @click="handleSoftDelete(item)"></v-btn>
              </template>
            </v-data-table>
          </v-window-item>

        </v-window>
      </v-col>
    </v-row>

    <v-dialog v-model="showReportDialog" fullscreen transition="dialog-bottom-transition">
      <v-card class="bg-grey-lighten-4">
        <v-toolbar color="primary">
          <v-btn icon="mdi-close" @click="showReportDialog = false"></v-btn>
          <v-toolbar-title>聯絡回報: {{ currentLead?.name }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="submitReport">送出回報</v-btn>
        </v-toolbar>
        
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-card class="pa-4 mb-4">
                <v-select v-model="reportForm.status" :items="statusOptions" label="聯絡狀況"></v-select>
                <v-select v-if="reportForm.status === '不考慮'" v-model="reportForm.reason" :items="reasonOptions" label="未約原因 (必填)"></v-select>
                <v-textarea v-model="reportForm.note" label="備註內容" variant="outlined" placeholder="輸入詳細通話內容..."></v-textarea>
              </v-card>

              <div class="text-subtitle-2 mb-2">歷史回報日誌</div>
              <v-card v-for="(log, idx) in leadLogs" :key="idx" class="mb-2 pa-3" variant="outlined">
                <div class="d-flex justify-space-between align-center">
                  <v-chip size="x-small" :color="getStatusColor(log.status)">{{ log.status }}</v-chip>
                  <span class="text-caption text-grey">{{ formatDateTime(log.createdAt) }}</span>
                </div>
                <div class="text-body-2 mt-1">{{ log.note }}</div>
                <div class="text-caption text-primary">回報人：{{ log.createdBy }}</div>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-card>
    </v-dialog>


<LeadSettingsDialog 
      v-model="showSettings" 
      :project-id="projectId" 
      @settings-updated="onSettingsUpdated"
    />

    <v-dialog v-model="showUploadDialog" max-width="900" persistent>
  <v-card class="rounded-lg">
    <v-toolbar color="primary" density="compact">
      <v-toolbar-title>{{ uploadStep === 1 ? '第一步：貼入名單文本' : '第二步：解析結果確認' }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon="mdi-close" @click="closeUploadDialog"></v-btn>
    </v-toolbar>

    <v-card-text v-if="uploadStep === 1" class="pa-4">
      <div v-for="(input, index) in uploadInputs" :key="index" class="mb-2">
        <v-textarea
          v-model="uploadInputs[index]"
          label="貼入名單文本 (每筆一行)"
          variant="outlined"
          rows="3"
          density="compact"
          prepend-inner-icon="mdi-text-box-outline"
          append-inner-icon="mdi-delete"
          @click:append-inner="removeUploadRow(index)"
          hide-details
          class="mb-2"
        ></v-textarea>
      </div>
      <v-btn variant="text" color="primary" prepend-icon="mdi-plus" @click="uploadInputs.push('')">新增下一筆欄位</v-btn>
    </v-card-text>

    <v-card-text v-if="uploadStep === 2" class="pa-0">
      <v-table density="compact" fixed-header height="400px">
        <thead class="bg-grey-lighten-4">
          <tr>
            <th width="120">姓名</th>
            <th width="150">電話</th>
            <th width="130">日期</th>
            <th width="150">來源</th>
            <th>預算/諮詢物件</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(lead, idx) in previewLeads" :key="idx">
            <td><v-text-field v-model="lead.name" variant="underlined" density="compact" hide-details></v-text-field></td>
            <td><v-text-field v-model="lead.phone" variant="underlined" density="compact" hide-details></v-text-field></td>
            <td><v-text-field v-model="lead.date" variant="underlined" density="compact" hide-details></v-text-field></td>
            <td><v-text-field v-model="lead.source" variant="underlined" density="compact" hide-details></v-text-field></td>
            <td><v-text-field v-model="lead.budget" variant="underlined" density="compact" hide-details></v-text-field></td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>

    <v-divider></v-divider>
    <v-card-actions class="pa-4">
      <v-spacer></v-spacer>
      <v-btn v-if="uploadStep === 2" variant="text" @click="uploadStep = 1">返回修改文本</v-btn>
      <v-btn v-if="uploadStep === 1" color="primary" variant="elevated" @click="handleParsing">開始解析文本</v-btn>
      <v-btn v-if="uploadStep === 2" color="success" variant="elevated" @click="saveParsedLeads">確認無誤並匯入</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>



  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { useUiStore } from '@/store/uiStore';
import { db } from '@/firebase';
// 1. 補齊 Firebase 所有需要的模組
import { 
  collection, query, where, onSnapshot, orderBy, doc, 
  getDoc, getDocs, addDoc, updateDoc, serverTimestamp 
} from 'firebase/firestore';

import { processAndAssignLeadAPI } from '@/api';

// 2. 補齊圖表與組件匯入
import { Doughnut, Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement } from 'chart.js';
import LeadSettingsDialog from '@/components/LeadSettingsDialog.vue';

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement);

// --- 基礎定義 ---
const props = defineProps(['projectId']);
const router = useRouter();
const userStore = useUserStore();
const uiStore = useUiStore();

// --- 權限邏輯 ---
const userUid = computed(() => userStore.user?.phone || '');
const projectName = computed(() => userStore.user?.permissions?.[props.projectId]?.projectName || props.projectId);
const userSystems = computed(() => userStore.user?.permissions?.[props.projectId]?.systems || []);

const isReceptionist = computed(() => userSystems.value.includes('客資系統-櫃台'));
const isSales = computed(() => userSystems.value.includes('客資系統-銷售'));
const isAdmin = computed(() => userStore.roles?.includes('系統管理員') || userStore.roles?.includes('超級管理員'));

// --- 響應式資料狀態 ---
const activeTab = ref(isReceptionist.value ? 'management' : 'status');
const allLeads = ref([]);
const salesStaff = ref([]);
const leadLogs = ref([]);
const currentLead = ref(null);
const selectedLeads = ref([]);
const selectedSalesId = ref(null);

// --- 彈窗控制開關 ---
const showSettings = ref(false);
const showUploadDialog = ref(false);
const showReportDialog = ref(false);

// --- 解析預覽相關狀態 (關鍵遺漏處) ---
const uploadStep = ref(1);
const uploadInputs = ref(['']); // 原始貼入的文本陣列
const previewLeads = ref([]);   // 系統解析後的暫存資料

// --- 表單選項 (由設定檔驅動) ---
const reportForm = ref({ status: '', reason: '', note: '' });
const statusOptions = ref(['不考慮', '已約賞屋', '空號', '未接']);
const reasonOptions = ref(['家人討論', '總價太高', '單價太高', '暫不買房', '要找成屋', '號碼錯誤/空號']);

// ==========================================
// 1. 解析引擎與上傳邏輯
// ==========================================

/**
 * 核心解析引擎：精準化版本
 */
const parseLeadText = (text) => {
  let result = { name: '', phone: '', date: '', source: '', budget: '', rawText: text };
  const cleanText = text.trim();

  // --- 格式一：廠商提供名單 (偵測關鍵字 【新名單】) ---
  if (cleanText.includes('【新名單】')) {
    result.name = cleanText.match(/^姓名：(.*?)$/m)?.[1]?.trim() || '';
    result.phone = cleanText.match(/^連絡電話：(.*?)$/m)?.[1]?.replace('+886', '0').replace(/\s/g, '').replace(/-/g, '').trim() || '';
    result.date = cleanText.match(/^日期：(\d{4}年\d{2}月\d{2}日)/m)?.[1]?.replace(/年|月/g, '/').replace('日', '').trim() || '';
    
    const platform = cleanText.match(/^平台途徑：(.*?)$/m)?.[1]?.trim();
    const sourceDetail = cleanText.match(/^名單來源：(.*?)$/m)?.[1]?.trim();
    // 修改點：直接顯示平台名稱
    result.source = platform || sourceDetail || '廠商提供';
  } 
  
  // --- 格式二：首馥官網 (偵測特定文字樣式) ---
  else if (cleanText.includes('官網 提交了「預約賞屋」')) {
    // 處理換行格式：標籤在上一行，內容在下一行
    result.name = cleanText.match(/姓名：\s*\n\s*(.*)/)?.[1]?.trim() || '';
    result.phone = cleanText.match(/電話：\s*\n\s*(.*)/)?.[1]?.replace('+886', '0').replace(/\s/g, '').replace(/-/g, '').trim() || '';
    result.budget = cleanText.match(/購屋預算：\s*\n\s*(.*)/)?.[1]?.trim() || '';
    
    const dateMatch = cleanText.match(/提交時間:\s*(\d{4})年(\d{2})月(\d{2})日/);
    if (dateMatch) {
      result.date = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;
    }
    result.source = '首馥官網';
  }
  
  // --- 格式三：591 提供名單 (偵測關鍵字 【591】) ---
  else if (cleanText.includes('【591】')) {
    result.name = cleanText.match(/^顧客姓名：(.*?)$/m)?.[1]?.trim() || '';
    result.phone = cleanText.match(/^行動電話：(.*?)$/m)?.[1]?.replace(/\s/g, '').replace(/-/g, '').trim() || '';
    result.date = cleanText.match(/^提交時間：(.*?)$/m)?.[1]?.trim() || '';
    result.source = '591平台';
    // 忽略諮詢物件，預算留給下方的通用萬字檢查
  }

  // 【預算精準化】：若上方未抓到預算，則全文本搜尋包含「萬」字樣的金額描述
  if (!result.budget) {
    const budgetMatch = cleanText.match(/(\d+[-~、\d]*萬[以上下]*)/);
    if (budgetMatch) {
      result.budget = budgetMatch[1];
    }
  }

  return result;
};

const handleParsing = () => {
  previewLeads.value = uploadInputs.value
    .filter(txt => txt && txt.trim() !== '')
    .map(txt => parseLeadText(txt));
  
  if (previewLeads.value.length === 0) {
    uiStore.showSnackbar('請先貼入有效的名單文本', 'warning');
    return;
  }
  uploadStep.value = 2; // 切換至預覽確認表格
};

const saveParsedLeads = async () => {
  try {
    // ✅ 嘗試修改為 setIsLoading，若報錯請改為 uiStore.loading = true
    if (typeof uiStore.setIsLoading === 'function') {
      uiStore.setIsLoading(true);
    } else {
      uiStore.loading = true;
    }

    const batchPromises = previewLeads.value.map(lead => {
      return addDoc(collection(db, 'leads'), {
        ...lead,
        projectId: props.projectId,
        status: '',
        isDeleted: false,
        createdAt: serverTimestamp(),
      });
    });
    
    await Promise.all(batchPromises);
    uiStore.showSnackbar(`成功匯入 ${previewLeads.value.length} 筆名單`, 'success');
    closeUploadDialog();
  } catch (err) {
    uiStore.showSnackbar('儲存失敗：' + err.message, 'error');
  } finally {
    // ✅ 同步修改關閉 Loading 的地方
    if (typeof uiStore.setIsLoading === 'function') {
      uiStore.setIsLoading(false);
    } else {
      uiStore.loading = false;
    }
  }
};

const removeUploadRow = (index) => {
  if (uploadInputs.value.length > 1) {
    uploadInputs.value.splice(index, 1);
  } else {
    uploadInputs.value = [''];
  }
};

const closeUploadDialog = () => {
  showUploadDialog.value = false;
  uploadStep.value = 1;
  uploadInputs.value = [''];
  previewLeads.value = [];
};

// ==========================================
// 2. 統計圖表計算
// ==========================================

const completionRate = computed(() => {
  const total = allLeads.value.length;
  if (total === 0) return 0;
  const done = allLeads.value.filter(l => l.status && l.status !== '').length;
  return Math.round((done / total) * 100);
});

const progressChartData = computed(() => ({
  labels: ['已完成', '未處理'],
  datasets: [{
    data: [
      allLeads.value.filter(l => l.status && l.status !== '').length, 
      allLeads.value.filter(l => !l.status || l.status === '').length
    ],
    backgroundColor: ['#4CAF50', '#E0E0E0'],
    borderWidth: 0
  }]
}));

const staffLoadChartData = computed(() => {
  const labels = salesStaff.value.map(s => s.name);
  const data = salesStaff.value.map(s => {
    return allLeads.value.filter(l => l.assignedTo === s.id && (!l.status || l.status === '')).length;
  });
  return {
    labels,
    datasets: [{ label: '未完成件數', data, backgroundColor: '#1A237E' }]
  };
});

// ==========================================
// 3. 名單管理與回報邏輯
// ==========================================

const unassignedLeads = computed(() => allLeads.value.filter(l => !l.assignedTo));
const filteredLeads = computed(() => {
  if (isReceptionist.value) return allLeads.value;
  return allLeads.value.filter(l => l.assignedTo === userUid.value);
});

const openReport = async (item) => {
  currentLead.value = item;
  reportForm.value = { status: item.status || '', reason: item.reason || '', note: '' };
  
  // 撈取該名單的多次歷史日誌
  const logsSnap = await getDocs(query(
    collection(db, `leads/${item.id}/contactLogs`),
    orderBy('createdAt', 'desc')
  ));
  leadLogs.value = logsSnap.docs.map(d => d.data());
  showReportDialog.value = true;
};

const submitReport = async () => {
  if (reportForm.value.status === '不考慮' && !reportForm.value.reason) {
    uiStore.showSnackbar('請選擇未約原因', 'error');
    return;
  }
  try {
    uiStore.setLoading(true);
    const leadRef = doc(db, 'leads', currentLead.value.id);
    await updateDoc(leadRef, {
      status: reportForm.value.status,
      lastReportedAt: serverTimestamp()
    });
    await addDoc(collection(db, `leads/${currentLead.value.id}/contactLogs`), {
      ...reportForm.value,
      createdBy: userStore.user?.name,
      createdAt: serverTimestamp()
    });
    uiStore.showSnackbar('回報成功', 'success');
    showReportDialog.value = false;
  } catch (err) {
    uiStore.showSnackbar(err.message, 'error');
  } finally {
    uiStore.setLoading(false);
  }
};

// 請在 LeadDistribution.vue 中替換此函式
const confirmAssignment = async () => {
  if (!selectedSalesId.value || selectedLeads.value.length === 0) return;
  
  try {
    uiStore.setLoading(true); // 使用修正後的 uiStore
    
    const targetSales = salesStaff.value.find(s => s.id === selectedSalesId.value);

    // ✅ 修改點：傳送 leadId 而非 rawText
    const promises = selectedLeads.value.map(leadId => {
      return processAndAssignLeadAPI({
        leadId: leadId,      // 傳送文件原始 ID
        projectId: props.projectId,
        salesId: targetSales.id,
        salesName: targetSales.name
      });
    });

    await Promise.all(promises);
    
    uiStore.showSnackbar(`成功指派 ${selectedLeads.value.length} 筆名單並發送 LINE`, 'success');
    selectedLeads.value = []; // 清空選取項
  } catch (err) {
    console.error("分配失敗:", err);
    uiStore.showSnackbar('指派失敗: ' + (err.message || '連線錯誤'), 'error');
  } finally {
    uiStore.setLoading(false);
  }
};

const handleSoftDelete = async (item) => {
  if (!confirm('確定要移至回收站嗎？')) return;
  try {
    await updateDoc(doc(db, 'leads', item.id), {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: userStore.user?.name
    });
    uiStore.showSnackbar('已移至回收站', 'success');
  } catch (err) {
    uiStore.showSnackbar('刪除失敗', 'error');
  }
};

// ==========================================
// 4. 初始化與輔助工具
// ==========================================

const formatDateTime = (timestamp) => {
  if (!timestamp) return '-';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('zh-TW', { hour12: false });
};

const getStatusColor = (status) => {
  const colors = { '已約賞屋': 'success', '不考慮': 'error', '未接': 'warning', '空號': 'grey' };
  return colors[status] || 'primary';
};

const fetchProjectStaff = async () => {
  try {
    // 1. 先從 userPermissions 找出具備此專案權限的人員手機號碼 (ID)
    const permSnap = await getDocs(query(collection(db, "userPermissions")));
    const authorizedIds = [];
    
    permSnap.forEach(d => {
      const data = d.data();
      const p = data.permissions?.[props.projectId];
      if (p?.systems?.some(s => s.includes('客資系統'))) {
        authorizedIds.push(d.id);
      }
    });

    if (authorizedIds.length === 0) return;

    // 2. 根據 ID 列表，去 users 集合抓取真正的姓名與 lineId
    // (Firebase 'in' 查詢一次最多支援 30 筆 ID)
    const staff = [];
    const userSnap = await getDocs(query(
      collection(db, "users"),
      where("__name__", "in", authorizedIds.slice(0, 30))
    ));

    userSnap.forEach(uDoc => {
      const uData = uDoc.data();
      staff.push({ 
        id: uDoc.id, 
        name: uData.name || uDoc.id, // 使用 users 集合中的 name
        lineId: uData.lineId || '' 
      });
    });

    salesStaff.value = staff.sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error("抓取人員清單失敗:", err);
  }
};

const onSettingsUpdated = (newSettings) => {
  statusOptions.value = newSettings.statusOptions;
  reasonOptions.value = newSettings.reasonOptions;
};

onMounted(async () => {
  // 監聽名單
  onSnapshot(query(
    collection(db, 'leads'),
    where('projectId', '==', props.projectId),
    where('isDeleted', '==', false),
    orderBy('createdAt', 'desc')
  ), (snap) => {
    allLeads.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  });

  await fetchProjectStaff();

  // 讀取設定
  const setSnap = await getDoc(doc(db, 'projectSettings', props.projectId));
  if (setSnap.exists()) {
    const d = setSnap.data();
    statusOptions.value = d.statusOptions || statusOptions.value;
    reasonOptions.value = d.reasonOptions || reasonOptions.value;
  }
});

// 圖表設定
const chartOptions = { cutout: '80%', plugins: { legend: { display: false } } };
const barOptions = { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }, plugins: { legend: { display: false } } };

</script>

<style scoped>
.chart-center-label {
  position: absolute;
  top: 55%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}
.gap-2 { gap: 8px; }
</style>