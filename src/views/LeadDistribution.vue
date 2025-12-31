<template>
  <v-container fluid class="pa-4 bg-grey-lighten-4 fill-height align-start">
    <v-row>
      <v-col cols="12" class="d-flex align-center pb-0">
        <v-btn icon="mdi-arrow-left" variant="text" @click="router.push({ name: 'LeadDistributionEntry' })" class="me-2"></v-btn>
        <div>
          <h2 class="text-h6 font-weight-bold text-primary">聯絡名單管理</h2>
          <div class="text-caption text-grey">{{ projectName }}</div>
        </div>
        <v-spacer></v-spacer>
        <v-btn v-if="isReceptionist" icon="mdi-cog" variant="text" color="grey-darken-1" @click="showSettings = true"></v-btn>
      </v-col>

      <v-col cols="12">
        <v-tabs v-model="activeTab" color="primary" grow density="compact">
          <v-tab v-if="isReceptionist || isAdmin" value="management">
            <v-icon start>mdi-tray-arrow-down</v-icon>名單分配管理
          </v-tab>
          <v-tab value="status">
            <v-icon start>mdi-clipboard-text-clock</v-icon>名單聯絡狀況
          </v-tab>
        </v-tabs>

        <v-window v-model="activeTab" class="mt-4">
          <v-window-item value="management" v-if="isReceptionist || isAdmin">
            <v-row>
              <v-col cols="12" md="6">
                <v-card variant="flat" class="rounded-lg pa-4 fill-height">
                  <div class="text-subtitle-2 font-weight-bold mb-4">處理進度統計</div>
                  <div style="height: 200px; position: relative;" class="d-flex justify-center">
                    <Doughnut :data="progressChartData" :options="chartOptions" />
                    <div class="chart-center-label">
                      <div class="text-h5 font-weight-bold">{{ completionRate }}%</div>
                      <div class="text-caption text-grey">總計 {{ allLeads.length }} 筆</div> 
                    </div>
                  </div>
                  <div class="d-flex justify-space-between mt-4 px-4 text-center"> 
                    <div class="text-left">
                      <div class="text-caption text-grey">已完成</div>
                      <div class="font-weight-bold text-success">{{ leadStats.done }}</div>
                    </div>
                    <div class="text-right">
                      <div class="text-caption text-grey">未處理</div>
                      <div class="font-weight-bold text-error">{{ leadStats.pending }}</div>
                    </div>
                  </div>
                </v-card>
              </v-col>
              <v-col cols="12" md="6">
                <v-card variant="flat" class="rounded-lg pa-4">
                  <div class="text-subtitle-2 font-weight-bold mb-4">人員處理狀況 (含全案總計)</div> 
                  <div style="position: relative; height: 250px;">
                    <Bar :data="staffLoadChartData" :options="barOptions" />
                  </div>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card variant="flat" class="rounded-lg pa-4 fill-height">
                  <div class="text-subtitle-2 font-weight-bold mb-4">預算佔比統計</div>
                  <div style="height: 250px;">
                    <Pie :data="budgetChartData" :options="pieOptions" />
                  </div>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card variant="flat" class="rounded-lg pa-4 fill-height">
                  <div class="text-subtitle-2 font-weight-bold mb-4">來源管道統計</div>
                  <div style="height: 250px;">
                    <Pie :data="sourceChartData" :options="pieOptions" />
                  </div>
                </v-card>
              </v-col>
              <v-col cols="12" class="d-flex gap-2">
                <v-btn color="primary" prepend-icon="mdi-text-box-plus" @click="showUploadDialog = true">上傳名單文本</v-btn>
                <v-btn v-if="isAdmin" variant="outlined" color="error" prepend-icon="mdi-trash-can-outline" @click="showRecycleBin = true">回收站</v-btn>
              </v-col>
            </v-row>
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
            
            <div class="mt-4">
              <LeadReport :project-id="projectId" />
            </div>
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

    <v-dialog v-model="showRecycleBin" max-width="900" scrollable>
      <v-card class="rounded-xl">
        <v-toolbar color="error" density="compact" class="px-4">
          <v-icon start>mdi-trash-can-outline</v-icon>
          <v-toolbar-title class="text-subtitle-1 font-weight-bold">回收站 (僅管理員可見)</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="showRecycleBin = false"></v-btn>
        </v-toolbar>
        
        <v-card-text class="pa-0">
          <v-data-table
            :headers="recycleHeaders"
            :items="deletedLeads"
            density="comfortable"
            no-data-text="回收站目前沒有任何名單"
          >
            <template v-slot:item.deletedAt="{ item }">
              <div class="text-caption text-grey">{{ formatDateTime(item.deletedAt) }}</div>
            </template>
            <template v-slot:item.actions="{ item }">
              <div class="d-flex gap-1">
                <v-btn size="x-small" color="success" variant="tonal" @click="restoreLead(item)">還原</v-btn>
                <v-btn size="x-small" color="error" variant="text" @click="permanentlyDeleteLead(item)">永久刪除</v-btn>
              </div>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-dialog>

    <LeadSettingsDialog 
      v-model="showSettings" 
      :project-id="projectId" 
      @settings-updated="onSettingsUpdated"
    />

    <v-dialog v-model="showUploadDialog" max-width="1200" persistent scrollable>
      <v-card class="rounded-xl overflow-hidden">
        <v-toolbar color="primary" density="compact" class="px-4">
          <v-icon start>mdi-auto-fix</v-icon>
          <v-toolbar-title class="text-subtitle-1 font-weight-bold">
            {{ uploadStep === 1 ? '第一步：貼入名單文本' : '第二步：解析與預約分配' }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="closeUploadDialog"></v-btn>
        </v-toolbar>

        <v-card-text v-if="uploadStep === 1" class="pa-6 bg-grey-lighten-4">
          <div v-for="(input, index) in uploadInputs" :key="index" class="mb-3">
            <v-textarea
              v-model="uploadInputs[index]"
              label="請貼入完整的客戶訊息 (系統將自動解析)"
              variant="flat"
              bg-color="white"
              rounded="lg"
              rows="3"
              density="comfortable"
              prepend-inner-icon="mdi-card-text-outline"
              persistent-placeholder
              hide-details
            ></v-textarea>
          </div>
          <v-btn variant="dashed" color="primary" block class="mt-2 rounded-lg" prepend-icon="mdi-plus" @click="uploadInputs.push('')">
            新增另一組文本內容
          </v-btn>
        </v-card-text>

        <v-card-text v-if="uploadStep === 2" class="pa-0">
          <div class="bg-primary-lighten-5 pa-3 d-flex align-center gap-4 border-bottom">
            <span class="text-caption font-weight-bold text-primary">解析摘要：</span>
            <v-chip size="x-small" color="primary" variant="flat">總計 {{ previewLeads.length }} 筆</v-chip>
            <v-chip size="x-small" color="orange-darken-2" variant="flat" v-if="summaryCount.vip">🚩 已有客資 {{ summaryCount.vip }} 筆</v-chip>
            <v-chip size="x-small" color="blue-grey-darken-1" variant="flat" v-if="summaryCount.lead">⚠️ 重複名單 {{ summaryCount.lead }} 筆</v-chip>
            <v-spacer></v-spacer>
            <v-progress-circular v-if="isCheckingDuplicates" indeterminate size="16" width="2" color="primary" class="me-2"></v-progress-circular>
            <span v-if="isCheckingDuplicates" class="text-caption text-primary">系統檢查重複中...</span>
          </div>

          <v-table density="comfortable" fixed-header height="500px" class="preview-table">
            <thead>
              <tr class="bg-grey-lighten-4">
                <th class="text-left" width="220">客戶資訊</th>
                <th class="text-center" width="160">檢查狀態與日期</th>
                <th class="text-left" width="180">指派銷售人員</th>
                <th class="text-left">名單屬性</th>
                <th class="text-center" width="60">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(lead, idx) in previewLeads" :key="idx" :class="getRowClass(lead.phone)">
                <td class="pa-4">
                  <v-text-field
                    v-model="lead.name"
                    variant="underlined"
                    density="compact"
                    hide-details
                    prepend-inner-icon="mdi-account"
                    class="font-weight-bold mb-1"
                  ></v-text-field>
                  <v-text-field
                    v-model="lead.phone"
                    variant="underlined"
                    density="compact"
                    hide-details
                    prepend-inner-icon="mdi-phone"
                    :color="!lead.phone ? 'error' : ''"
                  ></v-text-field>
                </td>

                <td class="text-center">
                  <div v-if="duplicateResults[lead.phone]">
                    <div v-if="duplicateResults[lead.phone].type === 'vip'" class="d-flex flex-column align-center">
                      <v-chip color="orange-darken-2" size="x-small" class="font-weight-bold mb-1">🚩 已有客資</v-chip>
                      <div class="text-caption font-weight-bold text-orange-darken-4">{{ duplicateResults[lead.phone].data.latestSalesName }}</div>
                      <div class="text-grey text-caption" style="font-size: 10px !important;">
                        {{ duplicateResults[lead.phone].data.visitDate || '無日期' }}
                      </div>
                      <v-btn size="x-small" color="orange-darken-2" variant="tonal" class="mt-1" @click="quickAssignInPreview(lead, duplicateResults[lead.phone].data.latestSalesPhone)">選擇</v-btn>
                    </div>

                    <div v-else-if="duplicateResults[lead.phone].type === 'lead'" class="d-flex flex-column align-center">
                      <v-chip color="blue-grey-darken-1" size="x-small" class="mb-1">⚠️ 重複</v-chip>
                      <div class="text-caption font-weight-bold">{{ duplicateResults[lead.phone].data.assignedName }}</div>
                      <div class="text-grey text-caption" style="font-size: 10px !important;">
                        {{ duplicateResults[lead.phone].data.assignedAt }}
                      </div>
                      <v-btn size="x-small" color="blue-grey-darken-1" variant="tonal" class="mt-1" @click="quickAssignInPreview(lead, duplicateResults[lead.phone].data.assignedTo)">選擇</v-btn>
                    </div>

                    <v-chip v-else color="success" size="small" variant="outlined">✨ 全新名單</v-chip>
                  </div>
                  <v-progress-circular v-else indeterminate size="14" width="2" color="grey"></v-progress-circular>
                </td>

                <td>
                  <v-select
                  v-model="lead.assignedTo"
                  :items="salesStaffWithCounts"
                  item-title="displayName"
                  item-value="id"
                  label="選擇業務員"
                  density="compact"
                  hide-details
                  variant="outlined"
                  class="mt-1"
                  @update:model-value="(val) => updateAssignedInfo(lead, val)"
                ></v-select>
                </td>

                <td class="pa-4">
                  <v-row dense>
                    <v-col cols="6">
                      <v-text-field v-model="lead.source" label="來源" variant="underlined" density="compact" hide-details></v-text-field>
                    </v-col>
                    <v-col cols="6">
                      <v-text-field v-model="lead.budget" label="預算" variant="underlined" density="compact" hide-details></v-text-field>
                    </v-col>
                    <v-col cols="12">
                      <v-text-field v-model="lead.date" label="提交日期" variant="underlined" density="compact" hide-details prepend-inner-icon="mdi-calendar-clock"></v-text-field>
                    </v-col>
                  </v-row>
                </td>

                <td class="text-center">
                  <v-btn icon="mdi-trash-can-outline" variant="text" color="grey-lighten-1" size="small" @click="previewLeads.splice(idx, 1)"></v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-4 bg-white">
          <v-btn v-if="uploadStep === 2" variant="text" color="grey-darken-1" prepend-icon="mdi-arrow-left" @click="uploadStep = 1">返回修改文本</v-btn>
          <v-spacer></v-spacer>
          <v-btn 
            v-if="uploadStep === 1" 
            color="primary" 
            variant="elevated" 
            min-width="150" 
            rounded="lg"
            @click="handleParsing"
          >開始解析文本</v-btn>
          <v-btn 
            v-if="uploadStep === 2" 
            color="success" 
            variant="elevated" 
            min-width="250" 
            rounded="lg"
            :disabled="isCheckingDuplicates"
            @click="executeBatchImportAndAssign"
          >確認無誤並執行分配 ({{ previewLeads.length }}筆)</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { useUiStore } from '@/store/uiStore';
import { db } from '@/firebase';
import { 
  collection, query, where, onSnapshot, orderBy, doc, 
  getDoc, getDocs, updateDoc, deleteDoc, serverTimestamp, addDoc 
} from 'firebase/firestore';

import { checkLeadDuplicates, batchImportAndAssignLeadsAPI } from '@/api'; 

// 修改項目：新增 Pie 圖表註冊
import { Doughnut, Bar, Pie } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement } from 'chart.js';
import LeadSettingsDialog from '@/components/LeadSettingsDialog.vue';
import LeadReport from './LeadReport.vue';

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement);

const props = defineProps(['projectId']);
const router = useRouter();
const userStore = useUserStore();
const uiStore = useUiStore();

// --- 狀態定義 ---
const activeTab = ref('management');
const allLeads = ref([]);
const deletedLeads = ref([]);
const salesStaff = ref([]);
const leadLogs = ref([]);
const currentLead = ref(null);

const showSettings = ref(false);
const showUploadDialog = ref(false);
const showRecycleBin = ref(false);
const showReportDialog = ref(false);

const uploadStep = ref(1);
const uploadInputs = ref(['']); 
const previewLeads = ref([]);   
const duplicateResults = ref({}); 
const isCheckingDuplicates = ref(false);

const reportForm = ref({ status: '', reason: '', note: '' });
const statusOptions = ref(['不考慮', '已約賞屋', '空號', '未接']);
const reasonOptions = ref(['家人討論', '總價太高', '單價太高', '暫不買房', '要找成屋', '號碼錯誤/空號']);

const snackbar = reactive({ show: false, text: '', color: '' });

// --- 計算屬性 ---
const userUid = computed(() => userStore.user?.phone || '');
const projectName = computed(() => userStore.user?.permissions?.[props.projectId]?.projectName || props.projectId);
const userSystems = computed(() => userStore.user?.permissions?.[props.projectId]?.systems || []);

const isReceptionist = computed(() => userSystems.value.includes('客資系統-櫃台'));
const isAdmin = computed(() => userStore.user?.roles?.includes('系統管理員') || userStore.user?.roles?.includes('超級管理員'));
const leadStats = computed(() => { 
  const done = allLeads.value.filter(l => l.status && l.status !== '').length;
  const pending = allLeads.value.length - done;
  return { total: allLeads.value.length, done, pending };
});

const completionRate = computed(() => {
  if (leadStats.value.total === 0) return 0;
  return Math.round((leadStats.value.done / leadStats.value.total) * 100);
});

const progressChartData = computed(() => ({
  labels: ['已完成', '未處理'],
  datasets: [{
    data: [leadStats.value.done, leadStats.value.pending],
    backgroundColor: ['#4CAF50', '#F44336'], 
    borderWidth: 0
  }]
}));

// 修改項目：新增 Budget 與 Source 統計邏輯
const budgetChartData = computed(() => {
  const counts = {};
  allLeads.value.forEach(l => {
    const key = l.budget || '未填寫';
    counts[key] = (counts[key] || 0) + 1;
  });
  return {
    labels: Object.keys(counts),
    datasets: [{
      data: Object.values(counts),
      backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726', '#EF5350', '#AB47BC', '#26A69A', '#78909C']
    }]
  };
});

const sourceChartData = computed(() => {
  const counts = {};
  allLeads.value.forEach(l => {
    const key = l.source || '未知來源';
    counts[key] = (counts[key] || 0) + 1;
  });
  return {
    labels: Object.keys(counts),
    datasets: [{
      data: Object.values(counts),
      backgroundColor: ['#EC407A', '#5C6BC0', '#26C6DA', '#9CCC65', '#FFEE58', '#FF7043', '#8D6E63']
    }]
  };
});
// 修改項目結束

const staffLoadChartData = computed(() => { 
  const labels = ['全案總計', ...salesStaff.value.map(s => s.name)];
  
  const getCounts = (staffId = null) => {
    const leads = staffId ? allLeads.value.filter(l => l.assignedTo === staffId) : allLeads.value;
    const total = leads.length;
    const done = leads.filter(l => l.status && l.status !== '').length;
    const pending = total - done;
    return { total, done, pending };
  };

  const stats = [getCounts(), ...salesStaff.value.map(s => getCounts(s.id))];

  return {
    labels,
    datasets: [
      { label: '總名單', data: stats.map(s => s.total), backgroundColor: '#9E9E9E' },
      { label: '已完成', data: stats.map(s => s.done), backgroundColor: 'green' },
      { label: '未處理', data: stats.map(s => s.pending), backgroundColor: 'red' }
    ]
  };
});

// --- 新增：業務員選單內容與排序邏輯 ---
const salesStaffWithCounts = computed(() => {
  return salesStaff.value.map(staff => {
    // 從 allLeads 中計算該人員目前被指派的名單數量 (排除已刪除的)
    const count = allLeads.value.filter(l => l.assignedTo === staff.id).length;
    return {
      ...staff,
      displayName: `${staff.name} (${count})`, // 選單顯示的名稱後綴數量
      leadCount: count
    };
  }).sort((a, b) => b.leadCount - a.leadCount); // 依照數量 多 > 少 排序
});


const filteredLeads = computed(() => {
  if (isReceptionist.value) return allLeads.value;
  return allLeads.value.filter(l => l.assignedTo === userUid.value);
});

const statusHeaders = [
  { title: '姓名', key: 'name' },
  { title: '電話', key: 'phone' },
  { title: '指派給', key: 'assignedName' },
  { title: '狀態', key: 'status' },
  { title: '動作', key: 'actions', sortable: false }
];

const recycleHeaders = [
  { title: '客戶姓名', key: 'name' },
  { title: '電話', key: 'phone' },
  { title: '刪除人', key: 'deletedBy' },
  { title: '刪除時間', key: 'deletedAt' },
  { title: '操作', key: 'actions', sortable: false }
];

// --- 回收站邏輯 ---

const fetchDeletedLeads = () => {
  const q = query(
    collection(db, 'leads'),
    where('projectId', '==', props.projectId),
    where('isDeleted', '==', true), 
    orderBy('deletedAt', 'desc')     
  );
  
  onSnapshot(q, (snap) => {
    deletedLeads.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  });
};

const restoreLead = async (item) => {
  try {
    uiStore.setLoading(true);
    await updateDoc(doc(db, 'leads', item.id), {
      isDeleted: false,
      restoredAt: serverTimestamp(),
      restoredBy: userStore.user?.name
    });
    showMsg('名單已還原', 'success');
  } catch (err) {
    showMsg('還原失敗：' + err.message, 'error');
  } finally {
    uiStore.setLoading(false);
  }
};

const permanentlyDeleteLead = async (item) => {
  if (!confirm(`確定要永久刪除「${item.name}」嗎？此操作無法復原。`)) return;
  try {
    uiStore.setLoading(true);
    await deleteDoc(doc(db, 'leads', item.id));
    showMsg('已永久刪除名單', 'info');
  } catch (err) {
    showMsg('刪除失敗：' + err.message, 'error');
  } finally {
    uiStore.setLoading(false);
  }
};

// --- 核心方法 ---

const runCheck = async (phones) => {
  if (phones.length === 0) return;
  isCheckingDuplicates.value = true;
  try {
    const res = await checkLeadDuplicates(props.projectId, phones);
    duplicateResults.value = { ...duplicateResults.value, ...res.results };
  } catch (err) {
    console.error("查重 API 異常:", err);
  } finally {
    isCheckingDuplicates.value = false;
  }
};

const quickAssignInPreview = (lead, salesId) => {
  if (!salesId) return;
  lead.assignedTo = salesId;
  updateAssignedInfo(lead, salesId);
};

const updateAssignedInfo = (lead, salesId) => {
  const staff = salesStaff.value.find(s => s.id === salesId);
  lead.assignedName = staff ? staff.name : '';
};

const summaryCount = computed(() => {
  const counts = { vip: 0, lead: 0, none: 0 };
  previewLeads.value.forEach(l => {
    const res = duplicateResults.value[l.phone];
    if (res?.type === 'vip') counts.vip++;
    else if (res?.type === 'lead') counts.lead++;
    else counts.none++;
  });
  return counts;
});

const getRowClass = (phone) => {
  const res = duplicateResults.value[phone];
  if (res?.type === 'vip') return 'bg-orange-lighten-5';
  if (res?.type === 'lead') return 'bg-blue-grey-lighten-5';
  return '';
};

const normalizePhone = (p) => {
  if (!p) return '';
  let clean = p.toString().replace(/[\s-()]/g, '');
  if (clean.startsWith('+886')) clean = '0' + clean.slice(4);
  else if (clean.startsWith('886')) clean = '0' + clean.slice(3);
  return clean.replace(/\D/g, ''); 
};

const parseLeadText = (text) => {
  let result = { 
    name: '', phone: '', date: '', source: '', budget: '', rawText: text, 
    assignedTo: null, assignedName: '' 
  };
  const cleanText = text.trim();

  // 內部輔助函式：標準化日期為 yyyy/mm/dd
  const formatDate = (y, m, d) => `${y}/${m.toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}`;

  // 1. 解析 【新名單】 格式
  if (cleanText.includes('【新名單】')) {
    result.name = cleanText.match(/^姓名：(.*?)$/m)?.[1]?.trim() || '';
    result.phone = normalizePhone(cleanText.match(/^連絡電話：(.*?)$/m)?.[1]);
    result.source = cleanText.match(/^平台途徑：(.*?)$/m)?.[1]?.trim() || '廠商名單';
    
    // 擷取日期: 2025年12月29日
    const dateMatch = cleanText.match(/^日期：(\d{4})年(\d{1,2})月(\d{1,2})日/m);
    if (dateMatch) result.date = formatDate(dateMatch[1], dateMatch[2], dateMatch[3]);
  } 
  
  // 2. 解析 富宇首馥官網 格式 (包含多行內容)
  else if (cleanText.includes('官網 提交了「預約賞屋」')) {
    // 針對多行格式，擷取標籤下一行的內容
    result.name = cleanText.match(/姓名：\s*\n\s*([^\n\r]+)/)?.[1]?.trim() || '';
    result.phone = normalizePhone(cleanText.match(/電話：\s*\n\s*([^\n\r]+)/)?.[1]);
    result.source = '首馥官網';
    
    // 擷取提交時間: 2025年12月29日
    const dateMatch = cleanText.match(/提交時間:\s*(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (dateMatch) result.date = formatDate(dateMatch[1], dateMatch[2], dateMatch[3]);

    // 擷取預算 (優先從多行欄位中擷取)
    const budgetMatch = cleanText.match(/購屋預算：\s*\n\s*([^\n\r]+)/);
    if (budgetMatch) result.budget = budgetMatch[1].trim();
  } 
  
  // 3. 解析 【591】 格式
  else if (cleanText.includes('【591】')) {
    result.name = cleanText.match(/^顧客姓名：(.*?)$/m)?.[1]?.trim() || '';
    result.phone = normalizePhone(cleanText.match(/^行動電話：(.*?)$/m)?.[1]);
    result.source = '591平台';
    
    // 擷取提交時間: 2025/12/27
    const dateMatch = cleanText.match(/提交時間：(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
    if (dateMatch) result.date = formatDate(dateMatch[1], dateMatch[2], dateMatch[3]);
  }

  // 通用邏輯：若特定格式未抓到預算，則嘗試從全文本搜尋「xx萬」關鍵字
  if (!result.budget) {
    const budgetMatch = cleanText.match(/(\d+[-~、\d]*萬[以上下]*)/);
    if (budgetMatch) result.budget = budgetMatch[1];
  }
  
  return result;
};

const handleParsing = async () => {
  const leads = uploadInputs.value
    .filter(txt => txt && txt.trim() !== '')
    .map(txt => parseLeadText(txt));
  
  if (leads.length === 0) {
    showMsg('請先貼入有效的名單文本', 'warning');
    return;
  }
  previewLeads.value = leads;
  uploadStep.value = 2;
  const phones = leads.map(l => l.phone).filter(p => p);
  
  // 執行查重 API
  await runCheck(phones);

  // --- 修改段落：查重後自動指派業務人員 ---
  previewLeads.value.forEach(lead => {
    const res = duplicateResults.value[lead.phone];
    if (res) {
      if (res.type === 'vip' && res.data.latestSalesPhone) {
        // 情況 A：成交客戶，自動選擇「原成交業務」(對應 latestSalesPhone)
        quickAssignInPreview(lead, res.data.latestSalesPhone);
      } else if (res.type === 'lead' && res.data.assignedTo) {
        // 情況 B：重複名單，自動選擇「最後指派業務」(對應 assignedTo)
        quickAssignInPreview(lead, res.data.assignedTo);
      }
    }
  });
  // --- 修改結束 ---
};

const executeBatchImportAndAssign = async () => {
  try {
    uiStore.setLoading(true);

    const leadsWithStatus = previewLeads.value.map(l => {
      const res = duplicateResults.value[l.phone];
      let statusText = "✨ 全新名單"; 
      if (res?.type === 'vip') {
        statusText = `🚩 已有客資 (來客: ${res.data.name})`; 
      } else if (res?.type === 'lead') {
        statusText = `⚠️ 重複名單 (共 ${res.data.count} 筆)`;
      }
      return { ...l, statusText }; 
    });

    const res = await batchImportAndAssignLeadsAPI({
      projectId: props.projectId,
      leads: leadsWithStatus, 
      operator: userStore.user?.name || "櫃檯人員"
    });

    if (res.status === 'success') {
      showMsg(`成功匯入並指派 ${previewLeads.value.length} 筆名單`, 'success');
      closeUploadDialog();
    } else {
      throw new Error(res.message);
    }
  } catch (err) {
    showMsg('執行失敗：' + err.message, 'error');
  } finally {
    uiStore.setLoading(false);
  }
};

const closeUploadDialog = () => {
  showUploadDialog.value = false;
  uploadStep.value = 1;
  uploadInputs.value = [''];
  previewLeads.value = [];
};

const openReport = async (item) => {
  currentLead.value = item;
  reportForm.value = { status: item.status || '', reason: item.reason || '', note: '' };
  const logsSnap = await getDocs(query(
    collection(db, `leads/${item.id}/contactLogs`),
    orderBy('createdAt', 'desc')
  ));
  leadLogs.value = logsSnap.docs.map(d => d.data());
  showReportDialog.value = true;
};

const submitReport = async () => {
  if (reportForm.value.status === '不考慮' && !reportForm.value.reason) {
    showMsg('請選擇未約原因', 'error');
    return;
  }
  try {
    uiStore.setLoading(true);
    await updateDoc(doc(db, 'leads', currentLead.value.id), {
      status: reportForm.value.status,
      lastReportedAt: serverTimestamp()
    });
    await addDoc(collection(db, `leads/${currentLead.value.id}/contactLogs`), {
      ...reportForm.value,
      createdBy: userStore.user?.name,
      createdAt: serverTimestamp()
    });
    showMsg('回報成功', 'success');
    showReportDialog.value = false;
  } catch (err) {
    showMsg(err.message, 'error');
  } finally {
    uiStore.setLoading(false);
  }
};

const handleSoftDelete = async (item) => {
  if (!confirm('將此名單移至回收站？')) return;
  try {
    await updateDoc(doc(db, 'leads', item.id), {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: userStore.user?.name
    });
    showMsg('已移至回收站', 'info');
  } catch (err) {
    showMsg('操作失敗', 'error');
  }
};

const formatDateTime = (ts) => ts ? (ts.toDate ? ts.toDate() : new Date(ts)).toLocaleString('zh-TW', { hour12: false }) : '-';
const getStatusColor = (s) => ({ '已約賞屋': 'success', '不考慮': 'error', '未接': 'warning', '空號': 'grey' }[s] || 'primary');
const showMsg = (t, c = 'info') => { snackbar.text = t; snackbar.color = c; snackbar.show = true; };

const fetchProjectStaff = async () => {
  try {
    const permSnap = await getDocs(query(collection(db, "userPermissions")));
    const authorizedIds = [];
    permSnap.forEach(d => {
      if (d.data().permissions?.[props.projectId]?.systems?.some(s => s.includes('客資系統'))) {
        authorizedIds.push(d.id);
      }
    });
    
    if (authorizedIds.length === 0) return;
    
    const staff = [];
    const userSnap = await getDocs(query(collection(db, "users"), where("__name__", "in", authorizedIds.slice(0, 30))));
    
    userSnap.forEach(uDoc => {
      const userData = uDoc.data();
      if (!userData.roles?.includes('超級管理員')) {
        staff.push({ 
          id: uDoc.id, 
          name: userData.name || uDoc.id, 
          lineId: userData.lineId || '' 
        });
      }
    });
    
    salesStaff.value = staff.sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) { 
    console.error(err); 
  }
};
const onSettingsUpdated = (s) => {
  statusOptions.value = s.statusOptions;
  reasonOptions.value = s.reasonOptions;
};

onMounted(async () => {
  onSnapshot(query(collection(db, 'leads'), where('projectId', '==', props.projectId), where('isDeleted', '==', false), orderBy('createdAt', 'desc')), (snap) => {
    allLeads.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  });

  if (isAdmin.value) {
    fetchDeletedLeads(); 
  }

  await fetchProjectStaff();
  const setSnap = await getDoc(doc(db, 'projectSettings', props.projectId));
  if (setSnap.exists()) {
    statusOptions.value = setSnap.data().statusOptions || statusOptions.value;
    reasonOptions.value = setSnap.data().reasonOptions || reasonOptions.value;
  }
  
});

// 修改項目：圖表設定優化
const chartOptions = { 
  cutout: '80%', 
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } } 
};

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { 
    legend: { 
      display: true, 
      position: 'right',
      labels: { boxWidth: 12, font: { size: 11 } }
    } 
  }
};
// 修改項目結束

const barOptions = { 
  responsive: true, 
  maintainAspectRatio: false, 
  scales: { 
    x: { stacked: false }, 
    y: { beginAtZero: true, ticks: { precision: 0 } } 
  },
  plugins: { legend: { display: true, position: 'bottom' } } 
};

</script>

<style scoped>
.chart-center-label {
  position: absolute;
  top: 50%; /* 修改：精準置中 */
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}
.gap-2 { gap: 8px; }
.border-s-lg { border-left: 6px solid !important; }

.v-btn--variant-dashed {
  border: 2px dashed rgba(var(--v-theme-primary), 0.3);
  background: transparent;
}

.preview-table :deep(table) {
  border-spacing: 0;
}
.preview-table :deep(tbody tr) {
  transition: background-color 0.2s;
}
.preview-table :deep(tbody tr:hover) {
  background-color: #f5f5f5 !important;
}

.border-bottom {
  border-bottom: 1px solid #e0e0e0;
}

.bg-orange-lighten-5 {
  background-color: #FFF3E0 !important;
}
.bg-blue-grey-lighten-5 {
  background-color: #ECEFF1 !important;
}
</style>