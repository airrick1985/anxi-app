<template>
  <div class="report-upload-checker">
    <!-- 檢查表單 -->
    <v-row class="mb-6">
      <v-col cols="12" md="6">
        <v-text-field
          v-model="projectId"
          label="建案 ID"
          placeholder="例如: fuyu1129"
          prepend-icon="mdi-folder-open"
          hint="輸入要檢查的建案 ID"
          persistent-hint
          @keyup.enter="performCheck"
        />
      </v-col>
      <v-col cols="12" md="6" class="d-flex align-end gap-3">
        <v-btn
          color="primary"
          @click="performCheck"
          :loading="checking"
          prepend-icon="mdi-magnify"
          block
        >
          開始檢查
        </v-btn>
      </v-col>
    </v-row>

    <!-- 檢查結果摘要 -->
    <v-row v-if="checkResult" class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card">
          <v-card-text class="text-center">
            <div class="stat-value text-primary">{{ checkResult.totalHouseholds }}</div>
            <div class="stat-label">總戶別數</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card">
          <v-card-text class="text-center">
            <div class="stat-value text-info">{{ checkResult.householdsWithReports }}</div>
            <div class="stat-label">有報告的戶別</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" :class="{ 'error-bg': checkResult.mismatchCount > 0 }">
          <v-card-text class="text-center">
            <div class="stat-value" :class="checkResult.mismatchCount > 0 ? 'text-error' : 'text-success'">
              {{ checkResult.mismatchCount }}
            </div>
            <div class="stat-label">不匹配項</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card">
          <v-card-text class="text-center">
            <div class="stat-value text-warning">{{ percentage }}%</div>
            <div class="stat-label">完整率</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 警告提示 -->
    <v-row v-if="checkResult && checkResult.mismatchCount > 0" class="mb-6">
      <v-col cols="12">
        <v-alert
          type="warning"
          icon="mdi-alert-circle"
          closable
        >
          <strong>發現 {{ checkResult.mismatchCount }} 筆不一致的預約</strong>
          <br />
          這些預約已完成驗屋且有上傳報告，但 reportUploaded 欄位未標記為 true。
          建議進行修復。
        </v-alert>
      </v-col>
    </v-row>

    <!-- 詳細結果表格 -->
    <v-row v-if="checkResult && checkResult.mismatchDetails.length > 0" class="mb-6">
      <v-col cols="12">
        <v-card>
          <v-card-item>
            <div class="d-flex align-center justify-space-between">
              <v-card-title>不匹配詳細清單</v-card-title>
              <v-chip
                :text="`共 ${checkResult.mismatchDetails.length} 筆`"
                color="warning"
              />
            </div>
          </v-card-item>

          <v-divider />

          <v-data-table
            :headers="tableHeaders"
            :items="checkResult.mismatchDetails"
            class="elevation-0"
            :items-per-page="10"
            :mobile-breakpoint="600"
          >
            <template v-slot:item.bookingType="{ item }">
              <v-chip
                :text="item.bookingType"
                :color="item.bookingType === '初驗' ? 'primary' : 'info'"
                size="small"
              />
            </template>

            <!-- ✅ 新增：預約方式欄位 -->
            <template v-slot:item.inspectionMethod="{ item }">
              <v-chip
                :text="item.inspectionMethod"
                :color="getInspectionMethodColor(item.inspectionMethod)"
                size="small"
                text-color="white"
              />
            </template>

            <template v-slot:item.status="{ item }">
              <v-chip
                text="已完成"
                color="success"
                size="small"
              />
            </template>

            <template v-slot:item.inspectionReportCount="{ item }">
              <v-icon color="success" size="small">mdi-check-circle</v-icon>
              {{ item.inspectionReportCount }}
            </template>

            <template v-slot:item.actions="{ item }">
              <v-tooltip text="複製 Appointment ID">
                <template v-slot:activator="{ props }">
                  <v-btn
                    icon="mdi-content-copy"
                    size="small"
                    variant="text"
                    v-bind="props"
                    @click="copyToClipboard(item.appointmentId)"
                  />
                </template>
              </v-tooltip>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- 修復操作 -->
    <v-row v-if="checkResult && checkResult.mismatchCount > 0" class="mb-6">
      <v-col cols="12">
        <v-card class="bg-warning-light">
          <v-card-item>
            <v-card-title>修復不匹配項</v-card-title>
          </v-card-item>

          <v-divider />

          <v-card-text>
            <p class="mb-4">
              此操作將自動將所有不匹配項的 <code>reportUploaded</code>
              欄位更新為 <code>true</code>。
            </p>

            <v-alert type="info" class="mb-4">
              ℹ️ 修復前請確保已檢查清單中的預約資訊。
            </v-alert>

            <div class="d-flex gap-3">
              <v-btn
                color="error"
                @click="performFix"
                :loading="fixing"
                prepend-icon="mdi-check-all"
              >
                確認修復全部 ({{ checkResult.mismatchCount }})
              </v-btn>

              <v-btn
                variant="outlined"
                @click="checkResult = null"
              >
                取消
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 修復結果 -->
    <v-row v-if="fixResult" class="mb-6">
      <v-col cols="12">
        <v-alert
          :type="fixResult.failureCount === 0 ? 'success' : 'warning'"
          icon="mdi-check-circle"
          closable
        >
          <strong>修復完成！</strong>
          <br />
          成功: <strong>{{ fixResult.successCount }}</strong> 筆
          <span v-if="fixResult.failureCount > 0">
            | 失敗: <strong class="text-error">{{ fixResult.failureCount }}</strong> 筆
          </span>
        </v-alert>
      </v-col>
    </v-row>

    <!-- 檢查歷史 -->
    <v-row v-if="checkHistory.length > 0" class="mt-8">
      <v-col cols="12">
        <v-expansion-panels>
          <v-expansion-panel>
            <template v-slot:title>
              <v-icon>mdi-history</v-icon>
              檢查歷史 ({{ checkHistory.length }})
            </template>

            <v-list>
              <v-list-item
                v-for="(record, index) in checkHistory"
                :key="index"
                class="history-item"
              >
                <template v-slot:prepend>
                  <v-avatar color="primary" size="32">
                    {{ index + 1 }}
                  </v-avatar>
                </template>

                <v-list-item-title>
                  建案: <strong>{{ record.projectId }}</strong>
                </v-list-item-title>

                <v-list-item-subtitle>
                  <div class="mt-2">
                    <span class="mr-4">
                      時間: {{ formatTime(record.timestamp) }}
                    </span>
                    <span>
                      不匹配: {{ record.mismatchCount }}
                    </span>
                  </div>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
    </v-row>

    <!-- 空狀態 -->
    <v-row v-if="!checkResult && !checking" class="mt-8">
      <v-col cols="12" class="text-center">
        <v-icon size="64" color="grey">mdi-file-document-outline</v-icon>
        <p class="text-grey mt-4">輸入建案 ID 開始檢查報告上傳狀態</p>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase';

const projectId = ref('');
const checking = ref(false);
const fixing = ref(false);
const checkResult = ref(null);
const fixResult = ref(null);
const checkHistory = ref([]);

const tableHeaders = [
  { key: 'unitId', title: '戶別', width: 100 },
  { key: 'bookingCode', title: '預約代碼', width: 120 },
  { key: 'bookingType', title: '預約類型', width: 100 },
  { key: 'inspectionMethod', title: '預約方式', width: 120 }, // ✅ 新增：預約方式
  { key: 'bookerName', title: '預約人', width: 120 },
  { key: 'inspectionReportCount', title: '報告數', width: 80, align: 'center' },
  { key: 'actions', title: '操作', width: 60, align: 'center', sortable: false },
];

// 計算完整率
const percentage = computed(() => {
  if (!checkResult.value) return 0;
  const { householdsWithReports, mismatchCount } = checkResult.value;
  if (householdsWithReports === 0) return 100;
  return Math.round(((householdsWithReports - mismatchCount) / householdsWithReports) * 100);
});

// 執行檢查
async function performCheck() {
  if (!projectId.value.trim()) {
    alert('請輸入建案 ID');
    return;
  }

  checking.value = true;
  fixResult.value = null;

  try {
    const checkFn = httpsCallable(functions, 'checkReportUploadMismatch');
    const result = await checkFn({
      projectId: projectId.value,
    });

    checkResult.value = result.data;

    // 添加到歷史記錄
    checkHistory.value.unshift({
      projectId: projectId.value,
      timestamp: new Date(),
      mismatchCount: result.data.mismatchCount,
    });

    console.log('檢查完成:', result.data);
  } catch (error) {
    console.error('檢查失敗:', error);
    alert('檢查失敗: ' + error.message);
  } finally {
    checking.value = false;
  }
}

// 執行修復
async function performFix() {
  if (!checkResult.value || checkResult.value.mismatchCount === 0) {
    alert('沒有需要修復的項目');
    return;
  }

  if (!confirm(`確定要修復 ${checkResult.value.mismatchCount} 筆預約嗎？此操作不可撤銷。`)) {
    return;
  }

  fixing.value = true;

  try {
    const appointmentIds = checkResult.value.mismatchDetails.map(
      (item) => item.appointmentId
    );

    const fixFn = httpsCallable(functions, 'fixReportUploadMismatch');
    const result = await fixFn({
      appointmentIds: appointmentIds,
    });

    fixResult.value = result.data;
    console.log('修復完成:', result.data);

    // 修復完成後，重新檢查
    if (result.data.successCount > 0) {
      setTimeout(() => {
        performCheck();
      }, 1500);
    }
  } catch (error) {
    console.error('修復失敗:', error);
    alert('修復失敗: ' + error.message);
  } finally {
    fixing.value = false;
  }
}

// 複製到剪貼板
function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
  // 可以添加 toast 通知
  console.log('已複製:', text);
}

// ✅ 新增：根據預約方式返回對應的顏色
function getInspectionMethodColor(method) {
  const colorMap = {
    '屋主自驗': '#FF6B6B',      // 紅色
    '代驗公司': '#4ECDC4',      // 青色
    '授權驗屋': '#45B7D1',      // 藍色
    '驗屋公司': '#96CEB4',      // 綠色
  };
  return colorMap[method] || '#9B9B9B'; // 預設灰色
}

// 格式化時間
function formatTime(date) {
  return new Date(date).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
</script>

<style scoped>
.report-upload-checker {
  padding: 0;
}

.stat-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.error-bg {
  background-color: rgba(244, 67, 54, 0.05);
}

code {
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 12px;
}

.bg-warning-light {
  background-color: rgba(255, 193, 7, 0.05);
}

.gap-3 {
  gap: 12px;
}

.history-item {
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.d-flex {
  display: flex;
}

.align-center {
  align-items: center;
}

.justify-space-between {
  justify-content: space-between;
}

.mt-2 {
  margin-top: 8px;
}

.mt-4 {
  margin-top: 16px;
}

.mt-8 {
  margin-top: 32px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mr-4 {
  margin-right: 16px;
}

.text-center {
  text-align: center;
}

.text-grey {
  color: #999;
}

.text-error {
  color: #f44336;
}

.text-success {
  color: #4caf50;
}

.text-warning {
  color: #ff9800;
}

.text-info {
  color: #2196f3;
}

.text-primary {
  color: #1976d2;
}
</style>
