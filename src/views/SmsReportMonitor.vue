<template>
  <v-container fluid class="bg-grey-lighten-4 pa-0 pa-sm-4 monitor-wrapper">
    
    <v-toolbar color="white" flat border="bottom">
      <v-btn icon="mdi-arrow-left" @click="$router.back()"></v-btn>
      <v-toolbar-title class="font-weight-bold text-subtitle-1 text-sm-h6">
        簡訊發送回報監控
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-chip v-if="!$vuetify.display.xs" color="primary" variant="tonal" size="small" class="mr-4">
        測試白名單模式：0980371014
      </v-chip>
    </v-toolbar>

    <v-container class="mt-4 px-2 px-sm-4">
      <v-card class="rounded-lg elevation-1 mb-6">
        <v-card-text>
          <v-row dense align="center">
            <v-col cols="12" sm="6" md="3">
              <v-select
                v-model="filterProject"
                :items="projectOptions"
                label="依建案篩選"
                variant="outlined"
                density="comfortable"
                hide-details
                prepend-inner-icon="mdi-office-building"
              ></v-select>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-select
                v-model="filterStatus"
                :items="['全部', '成功送達', '發送失敗', '客戶回覆']"
                label="訊息狀態"
                variant="outlined"
                density="comfortable"
                hide-details
                prepend-inner-icon="mdi-filter-variant"
              ></v-select>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="search"
                label="搜尋姓名或手機..."
                variant="outlined"
                density="comfortable"
                hide-details
                prepend-inner-icon="mdi-magnify"
                clearable
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-card class="rounded-lg elevation-2 overflow-hidden">
        
        <v-data-table
          v-if="$vuetify.display.smAndUp"
          :headers="headers"
          :items="filteredReports"
          :loading="reportStore.isLoading"
          hover
          class="sms-monitor-table"
        >
          <template v-slot:item.reportTime="{ item }">
            <div class="text-caption font-mono text-grey-darken-2">
              {{ formatRT(item.reportTime) }}
            </div>
          </template>

          <template v-slot:item.status="{ item }">
            <v-chip :color="getStatusConfig(item.status).color" size="x-small" label class="font-weight-bold px-2">
              {{ getStatusConfig(item.status).text }}
            </v-chip>
          </template>

          <template v-slot:item.sentContent="{ item }">
            <div class="content-display-box my-2 pa-2 rounded-lg text-body-2">
              {{ item.sentContent || '（無發送記錄）' }}
            </div>
          </template>

          <template v-slot:item.replyMsg="{ item }">
            <div v-if="item.status === '999'" class="reply-msg-box pa-2 rounded-lg text-body-2 font-weight-bold">
              <v-icon size="x-small" color="primary" class="mr-1">mdi-reply</v-icon>
              {{ item.replyMsg }}
            </div>
            <div v-else class="text-caption text-grey-lighten-1 px-2">無回覆</div>
          </template>

          <template v-slot:item.charge="{ item }">
            <span class="font-weight-bold text-grey-darken-1">{{ item.charge }}</span>
          </template>
        </v-data-table>

        <v-list v-else class="pa-0">
          <v-list-item v-for="report in filteredReports" :key="report.id" class="px-4 py-4 border-b">
            <div class="d-flex justify-space-between align-center mb-2">
              <span class="text-subtitle-1 font-weight-bold">{{ report.name || '客戶' }}</span>
              <v-chip :color="getStatusConfig(report.status).color" size="x-small">
                {{ getStatusConfig(report.status).text }}
              </v-chip>
            </div>
            
            <div class="text-body-2 mb-2">
              <v-icon size="x-small" color="grey">mdi-phone</v-icon> {{ report.mobile }}
            </div>

            <div class="content-display-box pa-3 rounded-lg mb-2">
              <span class="text-caption text-grey-darken-2 d-block mb-1 font-weight-bold">發送原文：</span>
              <p class="text-body-2 text-grey-darken-4 mb-0">{{ report.sentContent }}</p>
            </div>

            <div v-if="report.status === '999'" class="reply-msg-box pa-3 rounded-lg mt-2">
              <span class="text-caption text-primary d-block mb-1 font-weight-bold">客戶回信：</span>
              <p class="text-body-2 text-primary mb-0">{{ report.replyMsg }}</p>
            </div>

            <div class="text-right text-grey-lighten-2 mt-2" style="font-size: 10px;">
              {{ formatRT(report.reportTime) }} | Batch: {{ report.batchId }}
            </div>
          </v-list-item>
        </v-list>
      </v-card>
    </v-container>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useSmsReportStore } from '@/store/smsReportStore';
import { useProjectStore } from '@/store/projectStore';

const reportStore = useSmsReportStore();
const projectStore = useProjectStore();

const search = ref('');
const filterProject = ref('全部');
const filterStatus = ref('全部');

/**
 * 欄位尺寸優化
 * 將大部分空間留給內容欄位
 */
const headers = [
  { title: '時間', key: 'reportTime', width: '130px', sortable: true },
  { title: '狀態', key: 'status', width: '95px', align: 'center' },
  { title: '姓名', key: 'name', width: '90px' },
  { title: '手機', key: 'mobile', width: '125px' },
  { title: '發送內容原文', key: 'sentContent', sortable: false, align: 'start' },
  { title: '客戶回覆', key: 'replyMsg', width: '180px', sortable: false },
  { title: '點數', key: 'charge', width: '60px', align: 'end' },
];

const getStatusConfig = (code) => {
  const map = {
    '100': { text: '成功送達', color: 'success' }, // 已成功送達手機
    '999': { text: '客戶回覆', color: 'primary' }, // 回覆簡訊
    '0':   { text: '處理中', color: 'warning' },
    '301': { text: '額度不足', color: 'error' }
  };
  return map[code] || { text: `錯誤(${code})`, color: 'grey' };
};

const projectOptions = computed(() => ['全部', ...Object.values(projectStore.idToNameMap)]);

const formatRT = (rt) => {
  if (!rt || rt.length < 12) return rt;
  return `${rt.substring(4, 6)}/${rt.substring(6, 8)} ${rt.substring(8, 10)}:${rt.substring(10, 12)}`;
};

const filteredReports = computed(() => {
  return reportStore.reports.filter(r => {
    const s = search.value?.toLowerCase();
    const matchSearch = !s || r.mobile.includes(s) || (r.name && r.name.toLowerCase().includes(s));
    const matchProject = filterProject.value === '全部' || (r.subject && r.subject.includes(filterProject.value));
    
    let matchStatus = true;
    if (filterStatus.value === '成功送達') matchStatus = r.status === '100';
    if (filterStatus.value === '發送失敗') matchStatus = !['100', '999', '0'].includes(r.status);
    if (filterStatus.value === '客戶回覆') matchStatus = r.status === '999';

    return matchSearch && matchProject && matchStatus;
  });
});

onMounted(() => reportStore.fetchReports());
</script>

<style scoped>
.monitor-wrapper {
  max-width: 1600px; /* 寬螢幕適配 */
  margin: 0 auto;
}

/* 核心優化：發送內容顯示區塊 */
.content-display-box {
  background-color: #fdfdfd;
  border: 1px solid #e0e0e0;
  white-space: pre-wrap; /* 🔴 關鍵：允許換行 */
  word-break: break-all;
  line-height: 1.5;
  color: #424242;
  min-width: 250px;
}

/* 回覆簡訊顯示區塊 */
.reply-msg-box {
  background-color: #E3F2FD;
  border: 1px solid #BBDEFB;
  color: #1565C0;
  white-space: pre-wrap;
}

.font-mono {
  font-family: 'Roboto Mono', monospace;
}

/* 移除 Table 的強制橫向捲軸，改為自動高度 */
:deep(.v-data-table__td) {
  padding-top: 8px !important;
  padding-bottom: 8px !important;
  height: auto !important;
}

.border-b {
  border-bottom: 1px solid #eeeeee;
}
</style>