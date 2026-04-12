<template>
  <v-dialog :model-value="show" @update:model-value="emit('update:show', $event)" max-width="90vw" fullscreen>
    <v-card class="analytics-dialog">
      <!-- Header -->
      <v-card-title class="d-flex justify-space-between align-center py-4">
        <div class="d-flex align-center">
          <v-icon class="mr-2" size="large" color="primary">mdi-chart-box</v-icon>
          <span class="text-h5">銷控統計分析</span>
        </div>
        <div class="d-flex align-center gap-2">
          <v-btn
            icon="mdi-refresh"
            variant="text"
            size="small"
            @click="loadStatistics"
            :loading="isLoading"
            title="手動刷新"
          ></v-btn>
          <v-btn icon="mdi-close" variant="text" @click="close"></v-btn>
        </div>
      </v-card-title>

      <!-- Project Selector -->
      <div v-if="availableProjects.length > 0" class="px-4 py-3 project-selector-section">
        <v-select
          :model-value="projectId"
          @update:model-value="emit('update:projectId', $event)"
          :items="availableProjects"
          item-title="name"
          item-value="id"
          label="選擇建案"
          variant="outlined"
          density="compact"
          style="max-width: 300px"
          prepend-icon="mdi-home-city"
        />
      </div>

      <v-divider></v-divider>

      <!-- Content -->
      <v-card-text class="analytics-content px-4 py-6">
        <!-- 時間粒度切換 -->
        <div class="period-info mb-4">
          <AnalyticsPeriodToggle
            :period="selectedPeriod"
            :custom-date-range="customDateRange"
            @update:period="handlePeriodChange"
            @update:custom-date-range="handleCustomDateRange"
          />
          <div v-if="statistics" class="date-range-text mt-2" style="margin-left: 0;">
            <template v-if="selectedPeriod === 'all'">
              <v-chip
                label
                color="primary"
                text-color="white"
                prepend-icon="mdi-calendar-multiple"
                style="color: white !important;"
              >
                累計統計（全部資料）
              </v-chip>
            </template>
            <template v-else-if="selectedPeriod === 'custom'">
              <v-chip
                label
                color="white"
                text-color="white"
                prepend-icon="mdi-calendar-range"
              >
                {{ formatDate(customDateRange.start) }} ~ {{ formatDate(customDateRange.end) }}
              </v-chip>
            </template>
            <template v-else-if="statistics.dateRange">
              <v-chip
                label
                color="white"
                text-color="white"
                prepend-icon="mdi-calendar-range"
              >
                {{ formatDate(statistics.dateRange.start) }} ~ {{ formatDate(statistics.dateRange.end) }}
              </v-chip>
            </template>
          </div>
          <div class="copy-buttons mt-3">
            <v-btn
              :text="copyButtonText"
              size="large"
              variant="outlined"
              @click="showCopyDialog('full')"
              class="copy-btn"
            />
            <v-btn
              :text="copySimpleButtonText"
              size="large"
              variant="outlined"
              color="info"
              @click="showCopyDialog('simple')"
              class="copy-btn"
            />
          </div>
        </div>

        <!-- 加載狀態 -->
        <v-overlay v-if="isLoading" contained class="align-center justify-center">
          <v-progress-circular indeterminate size="48" color="primary"></v-progress-circular>
        </v-overlay>

        <!-- 錯誤提示 -->
        <v-alert v-if="error" type="error" class="mb-6" closable @input="error = null">
          {{ error }}
        </v-alert>

        <!-- 統計面板 (無加載時顯示) -->
        <template v-if="statistics && !isLoading">
          <!-- Section 0: 來人概況 -->
          <div v-if="vipGuestStats" class="d-flex align-center justify-space-between mb-6">
            <div class="section-title">👥 來人概況</div>
            <v-btn
              variant="outlined"
              size="small"
              :loading="isAnalyzing"
              :disabled="!vipGuestStats?.details?.length"
              @click="analyzeCustomers"
              class="ml-2"
            >
              <v-icon start>mdi-robot</v-icon>
              AI 狀況彙整
            </v-btn>
          </div>
          <div v-if="vipGuestStats" class="metric-group mb-6">
            <v-row>
              <v-col cols="12" sm="6" md="4">
                <MetricCard
                  title="新客"
                  :value="vipGuestStats.newCustomers"
                  icon="mdi-account-plus"
                  icon-color="success"
                  value-color="h5 text-success"
                />
              </v-col>
              <v-col cols="12" sm="6" md="4">
                <MetricCard
                  title="回訪"
                  :value="vipGuestStats.returningCustomers"
                  icon="mdi-account-check"
                  icon-color="info"
                  value-color="h5 text-info"
                />
              </v-col>
              <v-col cols="12" sm="6" md="4">
                <MetricCard
                  title="總來訪"
                  :value="vipGuestStats.totalVisitors"
                  icon="mdi-account-multiple"
                  icon-color="primary"
                  value-color="h5 text-primary"
                />
              </v-col>
            </v-row>
            <!-- 來訪詳細列表 (外層展開) -->
            <div v-if="vipGuestStats.details.length > 0" class="mt-4">
              <!-- 外層展開按鈕 -->
              <div
                class="d-flex align-center gap-2 pa-3 mb-2"
                style="background: #f8f9fa; border-radius: 8px; cursor: pointer; user-select: none;"
                @click="showVipGuestList = !showVipGuestList"
              >
                <v-icon :icon="showVipGuestList ? 'mdi-chevron-down' : 'mdi-chevron-right'" size="small"></v-icon>
                <span class="text-caption font-weight-500">
                  來訪客戶列表（共 {{ vipGuestStats.details.length }} 人）
                </span>
              </div>

              <!-- 客戶列表（收合時隱藏）-->
              <div v-show="showVipGuestList">
                <v-expansion-panels>
                  <v-expansion-panel
                    v-for="guest in vipGuestStats.details"
                    :key="guest.guestId"
                  >
                  <template #title>
                    <div class="d-flex align-center gap-2 flex-wrap">
                      <v-chip
                        :label="true"
                        :color="guest.type === 'new' ? 'success' : 'info'"
                        size="small"
                        class="flex-shrink-0"
                      >
                        {{ guest.type === 'new' ? '新客' : '回訪' }}
                      </v-chip>
                      <span class="text-body2 font-weight-500">{{ guest.guestName }}</span>
                      <span class="text-caption text-grey">{{ guest.guestPhone }}</span>
                      <v-divider vertical class="mx-1"></v-divider>
                      <span class="text-caption">👨‍💼 {{ guest.salesName }}</span>
                      <v-divider vertical class="mx-1"></v-divider>
                      <span class="text-caption">📅 {{ formatDate(guest.interactionLogs[0].date) }}</span>
                      <v-spacer></v-spacer>
                      <span class="text-caption text-grey">第 {{ guest.visitIndex }} 次現場介紹 (共 {{ guest.interactionLogs.length }} 筆互動)</span>
                    </div>
                  </template>
                  <template #text>
                    <div class="guest-info">
                      <!-- 客戶信息和銷售人員 -->
                      <v-row no-gutters class="mb-4">
                        <v-col cols="12" sm="6">
                          <p class="text-caption mb-2">
                            <strong>👤 客戶信息</strong>
                          </p>
                          <p class="text-caption mb-1">
                            <strong>姓名：</strong>{{ guest.guestName }}
                          </p>
                          <p class="text-caption mb-1">
                            <strong>電話：</strong>{{ guest.guestPhone }}
                          </p>
                          <p class="text-caption">
                            <strong>類型：</strong>
                            <v-chip
                              :color="guest.type === 'new' ? 'success' : 'info'"
                              size="x-small"
                              variant="tonal"
                            >
                              {{ guest.type === 'new' ? '新客' : '回訪客戶' }}
                            </v-chip>
                          </p>
                        </v-col>
                        <v-col cols="12" sm="6">
                          <p class="text-caption mb-2">
                            <strong>👨‍💼 銷售人員</strong>
                          </p>
                          <p class="text-caption mb-1">
                            <strong>姓名：</strong>{{ guest.salesName }}
                          </p>
                          <p class="text-caption">
                            <strong>訪問次數：</strong>第 {{ guest.visitIndex }} 次訪問
                          </p>
                        </v-col>
                      </v-row>

                      <!-- 互動紀錄內容 -->
                      <v-divider class="my-3"></v-divider>
                      <p class="text-caption mb-3">
                        <strong>📝 互動紀錄（共 {{ guest.interactionLogs.length }} 次）</strong>
                      </p>
                      <div class="interaction-history">
                        <div
                          v-for="(log, index) in guest.interactionLogs"
                          :key="index"
                          class="interaction-item mb-4 pa-3"
                          style="background: #f8f9fa; border-radius: 8px; border-left: 3px solid #1976d2;"
                        >
                          <div class="d-flex align-center gap-2 mb-2 flex-wrap">
                            <v-chip
                              :label="true"
                              :color="log.interactionType === '現場介紹' ? 'primary' : 'default'"
                              size="x-small"
                            >
                              {{ log.interactionType }}
                            </v-chip>
                            <span class="text-caption font-weight-500">
                              📅 {{ formatDate(log.date) }}
                            </span>
                            <v-divider vertical class="mx-1"></v-divider>
                            <span class="text-caption">
                              👤 {{ log.recorderName }}
                            </span>
                          </div>
                          <p class="text-caption mb-0" style="white-space: pre-wrap; line-height: 1.6; color: #555;">
                            {{ log.content }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </template>
                </v-expansion-panel>
                </v-expansion-panels>
              </div>
            </div>
            <div v-else class="text-center text-grey py-4">
              (暫無來訪紀錄)
            </div>
          </div>

          <!-- Section 1: 銷售狀況 + 銷況明細 -->
          <v-row class="mb-6" no-gutters>
            <!-- 左側：銷售狀況卡片 -->
            <v-col cols="12" lg="6" class="mb-lg-0 mb-4 pr-lg-2">
              <div class="section-header mb-4">
                <div class="section-title">📊 銷售狀況</div>
              </div>
              <!-- 分組 1: 本日/周/月銷售 (非累計時顯示) -->
              <div v-if="selectedPeriod !== 'all'" class="metric-group mb-6">
                <div class="group-header">✨ {{ getPeriodLabel() }}銷售</div>
                <v-row>
                  <v-col cols="12" sm="6">
                    <MetricCard
                      :title="`${getPeriodLabel()}銷售戶數`"
                      :value="statistics.households.periodSold"
                      :subtitle="`${formatAmount(statistics.households.periodSoldAmount)}萬 (${calculatePercentage(statistics.households.periodSoldAmount, statistics.households.totalAmount)}%)`"
                      icon="mdi-plus-circle"
                      icon-color="info"
                      value-color="h5 text-info"
                    />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <MetricCard
                      :title="`${getPeriodLabel()}銷售車位`"
                      :value="statistics.parkings.periodSold"
                      :subtitle="`${formatAmount(statistics.parkings.periodSoldAmount)}萬 (${calculatePercentage(statistics.parkings.periodSoldAmount, statistics.parkings.totalAmount)}%)`"
                      icon="mdi-plus-circle"
                      icon-color="info"
                      value-color="h5 text-info"
                    />
                  </v-col>
                </v-row>
              </div>

              <!-- 分組 1.5: 本日/周/月退戶 (非累計時顯示) -->
              <div v-if="selectedPeriod !== 'all' && cancelledStats !== null" class="metric-group mb-6">
                <div class="group-header">🚫 {{ getPeriodLabel() }}退戶</div>
                <v-row>
                  <v-col cols="12" sm="6">
                    <MetricCard
                      :title="`${getPeriodLabel()}退戶戶數`"
                      :value="cancelledStats?.count ?? 0"
                      :subtitle="cancelledStats?.amount > 0 ? `成交金額 ${formatAmount(cancelledStats.amount)}萬` : '—'"
                      icon="mdi-account-cancel"
                      icon-color="error"
                      value-color="h5 text-error"
                    />
                  </v-col>
                </v-row>
              </div>

              <!-- 分組 2: 已售 (累計) -->
              <div class="metric-group mb-6">
                <div class="group-header">✅ 已售 (累計)</div>
                <v-row>
                  <v-col cols="12" sm="6">
                    <MetricCard
                      title="已售戶數"
                      :value="statistics.households.sold"
                      :subtitle="`${formatAmount(statistics.households.soldAmount)}萬 (${calculatePercentage(statistics.households.soldAmount, statistics.households.totalAmount)}%)`"
                      icon="mdi-check-circle"
                      icon-color="success"
                      value-color="h5 text-success"
                    />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <MetricCard
                      title="已售車位"
                      :value="statistics.parkings.sold"
                      :subtitle="`${formatAmount(statistics.parkings.soldAmount)}萬 (${calculatePercentage(statistics.parkings.soldAmount, statistics.parkings.totalAmount)}%)`"
                      icon="mdi-check-circle"
                      icon-color="success"
                      value-color="h5 text-success"
                    />
                  </v-col>
                </v-row>
              </div>

              <!-- 分組 3: 未售 -->
              <div class="metric-group mb-6">
                <div class="group-header">⚠️ 未售</div>
                <v-row>
                  <v-col cols="12" sm="6">
                    <MetricCard
                      title="未售戶數"
                      :value="statistics.households.unsold"
                      :subtitle="`${formatAmount(statistics.households.unsoldAmount)}萬 (${calculatePercentage(statistics.households.unsoldAmount, statistics.households.totalAmount)}%)`"
                      icon="mdi-home-outline"
                      icon-color="warning"
                      value-color="h5 text-warning"
                    />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <MetricCard
                      title="未售車位"
                      :value="statistics.parkings.unsold"
                      :subtitle="`${formatAmount(statistics.parkings.unsoldAmount)}萬 (${calculatePercentage(statistics.parkings.unsoldAmount, statistics.parkings.totalAmount)}%)`"
                      icon="mdi-parking"
                      icon-color="error"
                      value-color="h5 text-error"
                    />
                  </v-col>
                </v-row>
              </div>

              <!-- 分組 4: 總數 -->
              <div class="metric-group">
                <div class="group-header">📊 總數</div>
                <v-row>
                  <v-col cols="12" sm="6">
                    <MetricCard
                      title="總戶數"
                      :value="statistics.households.total"
                      :subtitle="`${formatAmount(statistics.households.totalAmount)}萬`"
                      icon="mdi-home"
                      icon-color="primary"
                      value-color="h5 text-primary"
                    />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <MetricCard
                      title="總車位數"
                      :value="statistics.parkings.total"
                      :subtitle="`${formatAmount(statistics.parkings.totalAmount)}萬`"
                      icon="mdi-parking"
                      icon-color="info"
                      value-color="h5 text-info"
                    />
                  </v-col>
                </v-row>
              </div>
            </v-col>

            <!-- 右側：銷況明細 -->
            <v-col cols="12" lg="6" class="pl-lg-2">
              <div class="section-title mb-4">📋 銷況明細</div>
              <v-expansion-panels>
                <v-expansion-panel
                  v-for="(count, status) in getFilteredByStatus()"
                  :key="status"
                  :class="status === '退戶' ? 'cancelled-panel' : ''"
                >
                  <template v-slot:title>
                    <span :class="status === '退戶' ? 'status-detail-text cancelled-status' : 'status-detail-text'">
                      {{ status }} {{ count }}戶 ({{ formatAmount(statistics.households.byStatusAmount[status] || 0) }}萬)
                    </span>
                  </template>

                  <v-card-text>
                    <div class="units-list">
                      <div
                        v-for="unit in statistics.households.byStatusUnits[status]"
                        :key="unit.unitId"
                        :class="status === '退戶' ? 'unit-item cancelled-unit-item' : 'unit-item'"
                        style="cursor: pointer; padding: 8px; border-radius: 4px; transition: background-color 0.2s;"
                        @click="openUnitDetail(unit)"
                        @mouseover="$event.target.style.backgroundColor = status === '退戶' ? '#ffebee' : '#f0f7ff'"
                        @mouseout="$event.target.style.backgroundColor = status === '退戶' ? 'transparent' : 'transparent'"
                      >
                        <span class="unit-info">{{ unit.unitId }}({{ formatAmount(unit.price_transaction_total) }}萬 / {{ calculateUnitPrice(unit.unitId) }}萬/坪)-{{ unit.salesperson }}</span>
                      </div>
                    </div>
                  </v-card-text>
                </v-expansion-panel>
              </v-expansion-panels>
              <div v-if="Object.keys(getFilteredByStatus()).length === 0" class="text-center text-grey py-4">
                (無有效銷售紀錄)
              </div>
            </v-col>
          </v-row>

          <!-- Section 3: 銷售人員排行 -->
          <div class="section-title mb-6">👥 銷售人員排行</div>
          <PersonnelRanking
            v-if="statistics.personnel && statistics.personnel.length > 0"
            :personnel-stats="statistics.personnel"
          />
          <v-alert v-else type="info" class="mb-6">
            暫無銷售人員資料
          </v-alert>
        </template>

        <!-- 無數據提示 -->
        <v-alert v-else-if="!isLoading" type="info">
          暫無統計數據，請確保項目有銷售資料。
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- 複製文本預覽對話框 -->
    <v-dialog v-model="copyPreviewDialog.show" max-width="600">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span>預覽複製內容</span>
          <v-btn icon="mdi-close" variant="text" @click="copyPreviewDialog.show = false"></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="preview-content">
          <pre class="text-body2">{{ copyPreviewDialog.text }}</pre>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="justify-end gap-2">
          <v-btn variant="tonal" @click="copyPreviewDialog.show = false">取消</v-btn>
          <v-btn variant="flat" color="primary" @click="confirmCopy">確認複製</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- UnitDetailModal -->
    <UnitDetailModal
      :show="showUnitModal"
      :unit-data="selectedUnitData"
      :all-data="{
        '戶別': projectData.households || [],
        '車位': projectData.parkings || [],
        '銷控圖片': projectData.images || [],
        '參數': projectData.parameters || [],
        '銷售人員': projectData.personnel || [],
      }"
      :project-name="projectData.project?.name || '專案'"
      :project-id="props.projectId"
      :contract-types="[]"
      @update:show="showUnitModal = $event"
    />

    <!-- 客戶狀況彙整 Dialog -->
    <v-dialog v-model="showAnalysisDialog" max-width="700" scrollable>
      <v-card>
        <v-card-title>客戶狀況彙整報告</v-card-title>
        <v-card-subtitle>{{ getPeriodLabel() }} · AI 生成</v-card-subtitle>
        <v-divider />
        <v-card-text
          ref="reportContentRef"
          style="max-height: 500px; overflow-y: auto; white-space: pre-wrap; font-size: 14px; line-height: 1.8; color: #1a1a1a;"
        >
          {{ analysisReport }}
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-btn
            variant="outlined"
            size="small"
            :loading="isDownloadingPng"
            @click="downloadPng"
          >
            <v-icon start>mdi-image</v-icon>PNG
          </v-btn>
          <v-btn
            variant="outlined"
            size="small"
            :loading="isDownloadingDocx"
            @click="downloadDocx"
          >
            <v-icon start>mdi-file-word</v-icon>WORD
          </v-btn>
          <v-spacer />
          <v-btn variant="text" @click="showAnalysisDialog = false">關閉</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :prepend-icon="analysisCopied ? 'mdi-check' : 'mdi-content-copy'"
            @click="copyAnalysisReport"
          >
            {{ analysisCopied ? '已複製' : '複製報告' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- AI 分析中全屏遮罩 -->
    <Teleport to="body">
      <v-overlay
        :model-value="isAnalyzing"
        persistent
        class="ai-analyzing-overlay"
        style="z-index: 9999 !important; display: flex; align-items: center; justify-content: center;"
      >
        <div class="d-flex flex-column align-center ga-4">
          <v-progress-circular indeterminate size="72" width="6" color="white" />
          <div class="text-white text-h6">AI 分析中...</div>
          <div class="text-white text-body-2 text-center" style="opacity: 0.8; max-width: 300px;">
            正在彙整客戶互動記錄，請稍候
          </div>
        </div>
      </v-overlay>
    </Teleport>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useSalesDataStore } from '@/store/salesDataStore'
import { useAnalyticsStore } from '@/store/analyticsStore'
import {
  calculateHouseholdStats,
  calculateParkingStats,
  calculatePersonnelStats,
  calculateVipGuestStats,
  getDateRange,
} from '@/utils/analyticsCalculations'
import { fetchVipGuests, analyzeCustomerStatus, getCancelledPurchases } from '@/api'
import html2canvas from 'html2canvas'
import { saveAs } from 'file-saver'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import AnalyticsPeriodToggle from './AnalyticsPeriodToggle.vue'
import MetricCard from './MetricCard.vue'
import PersonnelRanking from './PersonnelRanking.vue'
import UnitDetailModal from './UnitDetailModal.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  projectId: {
    type: String,
    required: true,
  },
  availableProjects: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:show', 'update:projectId'])

const salesDataStore = useSalesDataStore()
const analyticsStore = useAnalyticsStore()

/**
 * 格式化日期為 YYYY-MM-DD 格式（用於日期輸入）
 */
const formatDateToInput = (date) => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const selectedPeriod = ref('today')
const isLoading = ref(false)
const error = ref(null)
const statistics = ref(null)
const vipGuestStats = ref(null)
const cancelledStats = ref(null)
const showVipGuestList = ref(false)
const showUnitModal = ref(false)
const isAnalyzing = ref(false)
const showAnalysisDialog = ref(false)
const analysisReport = ref('')
const analysisCopied = ref(false)
const isDownloadingPng = ref(false)
const isDownloadingDocx = ref(false)
const reportContentRef = ref(null)
const selectedUnitData = ref(null)
const customDateRange = ref({
  start: formatDateToInput(new Date()),
  end: formatDateToInput(new Date()),
})

/**
 * 格式化金額為千位符
 */
const formatAmount = (amount) => {
  if (!amount) return '0'
  return Math.floor(amount).toLocaleString('zh-TW')
}

/**
 * 格式化日期
 */
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

/**
 * 計算百分比
 */
const calculatePercentage = (part, total) => {
  if (!total || total === 0) return '0.0'
  return ((part / total) * 100).toFixed(1)
}

/**
 * 計算單價（萬/坪）
 */
const calculateUnitPrice = (unitId) => {
  // 從 projectData 中找到該戶別
  const household = projectData.value.households?.find(h => h.unitId === unitId)

  if (!household) return 'N/A'

  // 使用房屋成交價 / 坪數計算單價
  const housePrice = Number(household.price_transaction_house) || 0
  const areaPing = Number(household.area_house_ping) || 0

  if (areaPing === 0 || housePrice === 0) return 'N/A'

  const unitPrice = (housePrice / areaPing).toFixed(2)
  return unitPrice
}

/**
 * 獲取時間粒度標籤
 */
const getPeriodLabel = () => {
  if (selectedPeriod.value === 'today') return '本日'
  if (selectedPeriod.value === 'week') return '本週'
  if (selectedPeriod.value === 'month') return '本月'
  if (selectedPeriod.value === 'custom') return '期間'
  return ''
}

/**
 * 過濾銷況明細：顯示小訂、補足、簽約、退戶
 */
const getFilteredByStatus = () => {
  if (!statistics.value?.households?.byStatus) return {}

  const validStatuses = ['小訂', '補足', '簽約', '退戶']
  const filtered = {}

  Object.entries(statistics.value.households.byStatus).forEach(([status, count]) => {
    if (validStatuses.includes(status)) {
      filtered[status] = count
    }
  })

  return filtered
}

/**
 * 生成統計數據的純文本格式
 */
const generateStatisticsText = () => {
  if (!statistics.value) return ''

  const projectName = projectData.value.project?.name || '專案'
  const periodLabel = selectedPeriod.value === 'all' ? '累計' :
                      selectedPeriod.value === 'today' ? '本日' :
                      selectedPeriod.value === 'week' ? '本週' :
                      selectedPeriod.value === 'month' ? '本月' : '期間'

  let text = `${periodLabel}【${projectName}】銷況\n`

  // 日期或期間信息
  if (selectedPeriod.value === 'today' && statistics.value.dateRange) {
    text += `${formatDate(statistics.value.dateRange.start)}\n`
  } else if (selectedPeriod.value === 'custom' && statistics.value.dateRange) {
    text += `${formatDate(statistics.value.dateRange.start)} ~ ${formatDate(statistics.value.dateRange.end)}\n`
  } else if ((selectedPeriod.value === 'week' || selectedPeriod.value === 'month') && statistics.value.dateRange) {
    text += `${formatDate(statistics.value.dateRange.start)} ~ ${formatDate(statistics.value.dateRange.end)}\n`
  }

  // 計算總金額和已售金額
  const totalHouseholdAmount = statistics.value.households.totalAmount
  const totalParkingAmount = statistics.value.parkings.totalAmount
  const totalAllAmount = totalHouseholdAmount + totalParkingAmount

  const soldHouseholdAmount = statistics.value.households.soldAmount
  const soldParkingAmount = statistics.value.parkings.soldAmount
  const totalSoldAmount = soldHouseholdAmount + soldParkingAmount

  const unsoldHouseholdAmount = statistics.value.households.unsoldAmount
  const unsoldParkingAmount = statistics.value.parkings.unsoldAmount
  const totalUnsoldAmount = unsoldHouseholdAmount + unsoldParkingAmount

  // 如果不是累計，顯示該時間段的新銷售（第一組）
  if (selectedPeriod.value !== 'all') {
    const periodHouseholdAmount = statistics.value.households.periodSoldAmount || 0
    const periodParkingAmount = statistics.value.parkings.periodSoldAmount || 0
    const periodTotalAmount = periodHouseholdAmount + periodParkingAmount

    text += `\n${getPeriodLabel()}銷售戶數：${statistics.value.households.periodSold}戶 (${formatAmount(periodHouseholdAmount)}萬)\n`
    text += `${getPeriodLabel()}銷售車位：${statistics.value.parkings.periodSold}個 (${formatAmount(periodParkingAmount)}萬)\n`
    text += `${getPeriodLabel()}銷售總銷：${formatAmount(periodTotalAmount)}萬 (${calculatePercentage(periodTotalAmount, totalAllAmount)}%)\n`
  }

  // 已售（第二組）
  text += `\n已售戶數：${statistics.value.households.sold}戶 (${formatAmount(soldHouseholdAmount)}萬)\n`
  text += `已售車位：${statistics.value.parkings.sold}個 (${formatAmount(soldParkingAmount)}萬)\n`
  text += `已售總銷：${formatAmount(totalSoldAmount)}萬 (${calculatePercentage(totalSoldAmount, totalAllAmount)}%)\n`

  // 未售（第三組）
  text += `\n未售戶數：${statistics.value.households.unsold}戶 (${formatAmount(unsoldHouseholdAmount)}萬)\n`
  text += `未售車位：${statistics.value.parkings.unsold}個 (${formatAmount(unsoldParkingAmount)}萬)\n`
  text += `未售總銷：${formatAmount(totalUnsoldAmount)}萬 (${calculatePercentage(totalUnsoldAmount, totalAllAmount)}%)\n`

  // 退戶（新增）
  if (cancelledStats.value !== null && cancelledStats.value.count > 0) {
    const label = selectedPeriod.value === 'all' ? '累計' : getPeriodLabel()
    text += `\n${label}退戶戶數：${cancelledStats.value.count}戶`
    if (cancelledStats.value.amount > 0) {
      text += ` (成交金額 ${formatAmount(cancelledStats.value.amount)}萬)`
    }
    text += '\n'
  }

  // 總數（第四組）
  text += `\n總戶數：${statistics.value.households.total}戶 (${formatAmount(totalHouseholdAmount)}萬)\n`
  text += `總車位：${statistics.value.parkings.total}個 (${formatAmount(totalParkingAmount)}萬)\n`
  text += `總銷：${formatAmount(totalAllAmount)}萬\n`

  text += `\n【戶別明細】\n`
  const validStatuses = ['小訂', '補足', '簽約']
  const byStatusEntries = Object.entries(statistics.value.households.byStatus).filter(
    ([status]) => validStatuses.includes(status)
  )

  if (byStatusEntries.length === 0) {
    text += `(無)\n`
  } else {
    byStatusEntries.forEach(([status, count]) => {
      const amount = statistics.value.households.byStatusAmount[status] || 0
      text += `${status}：${count}戶 (${formatAmount(amount)}萬)\n`

      const units = statistics.value.households.byStatusUnits[status] || []
      units.forEach(unit => {
        // 使用資料庫的 total_transaction 和 unit_price_transaction
        const unitPrice = calculateUnitPrice(unit.unitId)

        // 找到該戶對應的所有車位
        const parkings = projectData.value.parkings?.filter(p => p.buyerUnitId === unit.unitId) || []

        // 生成車位信息文本
        let parkingText = ''
        if (parkings.length > 0) {
          parkingText = parkings.map(p => `-${p.spotId}(${Math.floor(p.price_transaction)}萬)`).join('')
        }

        text += `  • ${unit.unitId}(${Math.floor(unit.price_transaction_total)}萬 / ${unitPrice}萬/坪)${parkingText}-${unit.salesperson}\n`
      })
    })
  }

  return text
}

/**
 * 生成簡易文本格式
 */
const generateSimpleText = () => {
  if (!statistics.value) return ''

  const projectName = projectData.value.project?.name || '專案'

  let text = `【${projectName}】銷況\n`

  // 添加日期
  if (selectedPeriod.value === 'today' && statistics.value.dateRange) {
    text += `${formatDate(statistics.value.dateRange.start)}\n`
  } else if (selectedPeriod.value === 'custom' && statistics.value.dateRange) {
    text += `${formatDate(statistics.value.dateRange.start)} ~ ${formatDate(statistics.value.dateRange.end)}\n`
  } else if ((selectedPeriod.value === 'week' || selectedPeriod.value === 'month') && statistics.value.dateRange) {
    text += `${formatDate(statistics.value.dateRange.start)} ~ ${formatDate(statistics.value.dateRange.end)}\n`
  } else if (selectedPeriod.value === 'all') {
    text += `累計統計\n`
  }

  text += `\n`

  // 📌 新增：來人概況段落
  if (vipGuestStats.value) {
    text += `來人概況\n`
    text += `新客：${vipGuestStats.value.newCustomers}\n`
    text += `回訪：${vipGuestStats.value.returningCustomers}\n`
    text += `\n`
  }

  // 計算金額
  const totalHouseholdAmount = statistics.value.households.totalAmount
  const totalParkingAmount = statistics.value.parkings.totalAmount
  const totalAllAmount = totalHouseholdAmount + totalParkingAmount

  const soldHouseholdAmount = statistics.value.households.soldAmount
  const soldParkingAmount = statistics.value.parkings.soldAmount
  const totalSoldAmount = soldHouseholdAmount + soldParkingAmount

  // 本日/周/月銷售
  if (selectedPeriod.value !== 'all') {
    const periodHouseholdAmount = statistics.value.households.periodSoldAmount || 0
    const periodParkingAmount = statistics.value.parkings.periodSoldAmount || 0
    const periodTotalAmount = periodHouseholdAmount + periodParkingAmount

    text += `${getPeriodLabel()}銷售戶數：${statistics.value.households.periodSold}戶 (${formatAmount(periodHouseholdAmount)}萬)\n`
    text += `${getPeriodLabel()}銷售車位：${statistics.value.parkings.periodSold}個 (${formatAmount(periodParkingAmount)}萬)\n`
    text += `${getPeriodLabel()}銷售總銷：${formatAmount(periodTotalAmount)}萬 (${calculatePercentage(periodTotalAmount, totalAllAmount)}%)\n`

    // 📌 新增：成交戶別詳情（包含銷售人員）
    if (statistics.value.households.byStatusUnits) {
      // 檢查是否有任何成交戶別
      const statusOrder = ['小訂', '補足', '簽約']
      let hasUnits = false

      statusOrder.forEach(status => {
        const units = statistics.value.households.byStatusUnits[status]
        if (units && units.length > 0) {
          hasUnits = true
        }
      })

      if (hasUnits) {
        text += `戶別狀況\n`
        // 遍歷所有狀態，並列出該狀態下的戶別及其銷售人員
        statusOrder.forEach(status => {
          const units = statistics.value.households.byStatusUnits[status]
          if (units && units.length > 0) {
            // 為每個戶別添加銷售人員信息
            const unitDetails = units.map(u => {
              const salesperson = u.salesperson || '未知'
              return `${u.unitId}(${salesperson})`
            }).join('、')
            text += `${status}:${unitDetails}\n`
          }
        })
      } else {
        // 若無成交戶別，顯示(無)
        text += `戶別狀況(無)\n`
      }
      text += `\n`
    }
  }

  // 累計已售
  text += `累計已售戶數：${statistics.value.households.sold}戶 (${formatAmount(soldHouseholdAmount)}萬)\n`
  text += `累計已售車位：${statistics.value.parkings.sold}個 (${formatAmount(soldParkingAmount)}萬)\n`
  text += `累計已售總銷：${formatAmount(totalSoldAmount)}萬 (${calculatePercentage(totalSoldAmount, totalAllAmount)}%)\n`

  // 總數
  text += `\n總戶數：${statistics.value.households.total}戶 (${formatAmount(totalHouseholdAmount)}萬)\n`
  text += `總車位：${statistics.value.parkings.total}個 (${formatAmount(totalParkingAmount)}萬)\n`
  text += `總銷：${formatAmount(totalAllAmount)}萬`

  return text
}

/**
 * 複製完整文本到剪貼板
 */
const copyToClipboard = async () => {
  try {
    const text = generateStatisticsText()
    await navigator.clipboard.writeText(text)

    // 顯示複製成功提示
    const originalText = copyButtonText.value
    copyButtonText.value = '已複製！'
    setTimeout(() => {
      copyButtonText.value = originalText
    }, 2000)
  } catch (err) {
    console.error('複製失敗:', err)
  }
}

/**
 * 複製簡易文本到剪貼板
 */
const copySimpleText = async () => {
  try {
    const text = generateSimpleText()
    await navigator.clipboard.writeText(text)

    // 顯示複製成功提示
    const originalText = copySimpleButtonText.value
    copySimpleButtonText.value = '已複製！'
    setTimeout(() => {
      copySimpleButtonText.value = originalText
    }, 2000)
  } catch (err) {
    console.error('複製失敗:', err)
  }
}

const copyButtonText = ref('📋 複製銷況完整文本')
const copySimpleButtonText = ref('📝 複製銷況簡易文本')

/**
 * 複製預覽對話框
 */
const copyPreviewDialog = ref({
  show: false,
  text: '',
  type: '', // 'full' or 'simple'
})

/**
 * 顯示複製預覽對話框
 */
const showCopyDialog = (type) => {
  if (type === 'full') {
    copyPreviewDialog.value.text = generateStatisticsText()
  } else {
    copyPreviewDialog.value.text = generateSimpleText()
  }
  copyPreviewDialog.value.type = type
  copyPreviewDialog.value.show = true
}

/**
 * 確認並複製文本
 */
const confirmCopy = async () => {
  try {
    await navigator.clipboard.writeText(copyPreviewDialog.value.text)

    // 顯示複製成功提示
    const originalText = copyPreviewDialog.value.type === 'full' ? copyButtonText.value : copySimpleButtonText.value
    if (copyPreviewDialog.value.type === 'full') {
      copyButtonText.value = '已複製！'
      setTimeout(() => {
        copyButtonText.value = originalText
      }, 2000)
    } else {
      copySimpleButtonText.value = '已複製！'
      setTimeout(() => {
        copySimpleButtonText.value = originalText
      }, 2000)
    }

    // 關閉預覽對話框
    copyPreviewDialog.value.show = false
  } catch (err) {
    console.error('複製失敗:', err)
  }
}

const projectData = computed(() => {
  return salesDataStore.getProjectData(props.projectId)
})

/**
 * 狀態顏色對應表（來自參數或預設值）
 */
const statusColorMap = computed(() => {
  const map = {}
  const parameters = projectData.value.parameters || []

  parameters.forEach(p => {
    if (p.statusName && p.colorCode) {
      map[p.statusName] = p.colorCode
    }
  })

  return map
})

/**
 * 載入統計數據
 */
const loadStatistics = async () => {
  try {
    isLoading.value = true
    error.value = null
    vipGuestStats.value = null

    // 🔄 清除統計緩存，強制重新計算
    console.log('[AnalyticsPanel] 清除緩存並重新加載統計...')
    analyticsStore.clearCache(props.projectId)

    // 🔍 DEBUG: 輸出數據檢查
    console.log('[AnalyticsPanel DEBUG]', {
      projectId: props.projectId,
      householdsCount: projectData.value.households?.length,
      householdsData: projectData.value.households?.slice(0, 2), // 顯示前2個
      parkingsCount: projectData.value.parkings?.length,
      personnelCount: projectData.value.personnel?.length,
      parametersCount: projectData.value.parameters?.length,
      fullProjectData: projectData.value
    })

    // 檢查數據完整性
    if (!projectData.value.households || projectData.value.households.length === 0) {
      error.value = '尚無戶別資料'
      statistics.value = null
      console.warn('[AnalyticsPanel] 沒有戶別數據:', projectData.value)
      return
    }

    // 計算統計
    if (selectedPeriod.value === 'custom') {
      // 自訂日期範圍
      const customDateRangeObj = {
        start: new Date(customDateRange.value.start),
        end: new Date(customDateRange.value.end),
      }
      // 設置結束時間為當天的 23:59:59
      customDateRangeObj.end.setHours(23, 59, 59)

      statistics.value = {
        period: 'custom',
        dateRange: customDateRangeObj,
        households: calculateHouseholdStats(projectData.value.households || [], customDateRangeObj),
        parkings: calculateParkingStats(projectData.value.parkings || [], projectData.value.households || [], customDateRangeObj),
        personnel: calculatePersonnelStats(
          projectData.value.households || [],
          projectData.value.parkings || [],
          projectData.value.personnel || [],
          customDateRangeObj
        ),
      }
    } else {
      // 預定義粒度
      statistics.value = analyticsStore.getStatistics(
        props.projectId,
        projectData.value,
        selectedPeriod.value
      )
    }

    // DEBUG: 輸出統計詳細信息
    if (statistics.value) {
      console.log('[AnalyticsPanel] 統計數據:', {
        households: statistics.value.households,
        parkings: statistics.value.parkings,
        personnelCount: statistics.value.personnel?.length,
      })

      // 追踪已售車位的詳細信息
      console.log('[AnalyticsPanel] 車位詳細分析:')
      const allParkings = projectData.value.parkings || []
      console.log('  總車位數:', allParkings.length)
      console.log('  統計中的已售車位數:', statistics.value.parkings.sold)

      // 分析每個車位的狀態
      const soldParkings = []
      const unsoldParkings = []

      allParkings.forEach(p => {
        const relatedHousehold = projectData.value.households?.find(h => h.unitId === p.buyerUnitId)
        const hasBuyerUnitId = !!(p.buyerUnitId && p.buyerUnitId !== '')
        const isRelatedHouseholdSold = relatedHousehold && (relatedHousehold.payment_deposit_date !== null && ['小訂', '補足', '簽約'].includes(relatedHousehold.salesStatus_backend))
        const status = !hasBuyerUnitId ? '未分配' : !relatedHousehold ? '戶別不存在' : !isRelatedHouseholdSold ? '戶別未小訂' : '已售'

        const parkingInfo = {
          spotId: p.spotId,
          buyerUnitId: p.buyerUnitId,
          status,
          householdInfo: relatedHousehold ? {
            payment_deposit_date: relatedHousehold.payment_deposit_date,
            salesStatus_backend: relatedHousehold.salesStatus_backend,
            unitId: relatedHousehold.unitId
          } : null
        }

        if (status === '已售') {
          soldParkings.push(parkingInfo)
        } else {
          unsoldParkings.push(parkingInfo)
        }
      })

      console.log(`  ✓ 已售車位 (${soldParkings.length}):`, soldParkings)
      console.log(`  ✗ 未售車位 (${unsoldParkings.length}):`, unsoldParkings)
    }

    // 🔍 查詢並計算VIP客人的來人概況統計
    try {
      const vipGuests = await fetchVipGuests(props.projectId)
      if (vipGuests && Array.isArray(vipGuests)) {
        // 計算日期範圍
        const dateRange = selectedPeriod.value === 'custom'
          ? {
              start: new Date(customDateRange.value.start),
              end: new Date(customDateRange.value.end),
            }
          : getDateRange(selectedPeriod.value)

        if (dateRange && dateRange.end) {
          dateRange.end.setHours(23, 59, 59)
        }

        vipGuestStats.value = calculateVipGuestStats(vipGuests, dateRange)
        console.log('[AnalyticsPanel] VIP客人統計:', vipGuestStats.value)
      }
    } catch (err) {
      console.error('[AnalyticsPanel] VIP客人統計失敗:', err)
      // 不影響主要統計，只記錄錯誤
      vipGuestStats.value = null
    }

    // 🔍 查詢退戶統計
    try {
      const result = await getCancelledPurchases(props.projectId)
      if (result.status === 'success' && Array.isArray(result.data)) {
        const cancelledList = result.data

        // 根據 selectedPeriod 建立 dateRange
        const dateRange = selectedPeriod.value === 'custom'
          ? {
              start: new Date(customDateRange.value.start),
              end: new Date(customDateRange.value.end),
            }
          : getDateRange(selectedPeriod.value)

        if (dateRange && dateRange.end) {
          dateRange.end.setHours(23, 59, 59)
        }

        // 過濾落在 dateRange 內的退戶（cancellationDate 格式：{ _seconds, _nanoseconds }）
        const filtered = (dateRange == null)
          ? cancelledList
          : cancelledList.filter(item => {
              if (!item.cancellationDate?._seconds) return false
              const d = new Date(item.cancellationDate._seconds * 1000)
              return d >= dateRange.start && d <= dateRange.end
            })

        // 計算成交總金額（房屋成交價 + 各車位成交價）
        const totalAmount = filtered.reduce((sum, item) => {
          const housePrice = Number(item.price_transaction_house) || 0
          const parkingSum = (item.parkingDetails || []).reduce(
            (s, p) => s + (Number(p.price_transaction) || 0), 0
          )
          return sum + housePrice + parkingSum
        }, 0)

        // 按業務員分組計算退戶數
        const byPersonnel = {}
        filtered.forEach(item => {
          const salesperson = item.salesperson || '未知'
          if (!byPersonnel[salesperson]) {
            byPersonnel[salesperson] = 0
          }
          byPersonnel[salesperson]++
        })

        cancelledStats.value = { count: filtered.length, amount: totalAmount, byPersonnel }

        // 將退戶數據添加到 statistics.personnel 中
        if (statistics.value?.personnel && Array.isArray(statistics.value.personnel)) {
          statistics.value.personnel = statistics.value.personnel.map(personnel => ({
            ...personnel,
            cancelledCount: byPersonnel[personnel.name] || 0
          }))
        }

        // 將退戶數據添加到 statistics.households 的 byStatus 中（銷況明細）
        if (statistics.value?.households) {
          statistics.value.households.byStatus['退戶'] = filtered.length
          statistics.value.households.byStatusAmount['退戶'] = totalAmount

          // 準備退戶單位列表
          statistics.value.households.byStatusUnits['退戶'] = filtered.map(item => ({
            unitId: item.unitId,
            unitName: item.unitName || item.unitId,
            price_transaction_total: (Number(item.price_transaction_house) || 0) +
                                     ((item.parkingDetails || []).reduce((s, p) => s + (Number(p.price_transaction) || 0), 0)),
            salesperson: item.salesperson || '—'
          }))
        }

        console.log('[AnalyticsPanel] 退戶統計:', cancelledStats.value)
      }
    } catch (err) {
      console.error('[AnalyticsPanel] 退戶統計失敗:', err)
      cancelledStats.value = null
    }
  } catch (err) {
    console.error('[AnalyticsPanel] 統計計算失敗:', err)
    error.value = err.message || '統計計算失敗'
    statistics.value = null
    vipGuestStats.value = null
  } finally {
    isLoading.value = false
  }
}

/**
 * 時間粒度變更
 */
const handlePeriodChange = (newPeriod) => {
  selectedPeriod.value = newPeriod
  loadStatistics()
}

/**
 * 自訂日期範圍變更
 */
const handleCustomDateRange = (dateRange) => {
  customDateRange.value = dateRange
  loadStatistics()
}

/**
 * 關閉對話框
 */
const close = () => {
  emit('update:show', false)
}

/**
 * 打開單位詳細信息modal
 */
const openUnitDetail = (unit) => {
  // 📌 從projectData.households中查找完整的單位數據
  const completeUnitData = projectData.value.households?.find(h => h.unitId === unit.unitId)

  if (completeUnitData) {
    selectedUnitData.value = completeUnitData
    console.log('[AnalyticsPanel] 打開UnitDetailModal:', {
      unitId: completeUnitData.unitId,
      hasData: !!completeUnitData,
      dataKeys: Object.keys(completeUnitData).slice(0, 10),
    })
  } else {
    console.warn('[AnalyticsPanel] 未找到完整的單位數據:', unit.unitId)
  }

  showUnitModal.value = true
}

/**
 * 分析客戶狀況
 */
const analyzeCustomers = async () => {
  if (!vipGuestStats.value?.details?.length) return

  isAnalyzing.value = true
  try {
    const guests = vipGuestStats.value.details
    const currentProject = props.availableProjects.find(p => p.id === props.projectId)
    const projectName = currentProject?.name || ''

    const result = await analyzeCustomerStatus({
      guests,
      periodLabel: getPeriodLabel(),
      projectName,
      projectId: props.projectId,  // ← 傳入 projectId，讓 CF 讀取知識庫
    })
    analysisReport.value = result.data.report
    showAnalysisDialog.value = true
  } catch (e) {
    console.error('[分析失敗]', e)
    error.value = '客戶狀況分析失敗，請稍後再試'
  } finally {
    isAnalyzing.value = false
  }
}

/**
 * 複製分析報告
 */
const copyAnalysisReport = async () => {
  try {
    await navigator.clipboard.writeText(analysisReport.value)
    analysisCopied.value = true
    setTimeout(() => {
      analysisCopied.value = false
    }, 2000)
  } catch (e) {
    console.error('[複製失敗]', e)
  }
}

/**
 * 解析報告文本，轉換為 HTML 格式（用於 PNG）
 */
const renderReportHtml = (reportText) => {
  const lines = reportText.split('\n')
  const html = lines.map(line => {
    const trimmed = line.trim()
    if (!trimmed) return '<br />'

    // 大標題：以「一、」「二、」等開頭
    if (/^[一二三四五六七八九十]+[、]/.test(trimmed)) {
      return `<h2 style="font-size: 16px; font-weight: bold; margin-top: 16px; margin-bottom: 8px; color: #1a1a1a;">${trimmed}</h2>`
    }

    // 條列：以數字或 ･ 開頭
    if (/^\d+[.]/.test(trimmed) || /^[･]/.test(trimmed)) {
      return `<p style="margin-left: 24px; margin-bottom: 4px; line-height: 1.6;">${trimmed}</p>`
    }

    // 一般段落
    return `<p style="margin-bottom: 4px; line-height: 1.6;">${trimmed}</p>`
  }).join('')

  return html
}

/**
 * 解析報告文本為 docx Paragraph 陣列
 */
const parseReportToParagraphs = (reportText) => {
  const lines = reportText.split('\n')
  const paragraphs = []

  lines.forEach(line => {
    const trimmed = line.trim()
    if (!trimmed) {
      paragraphs.push(new Paragraph({ text: '' }))
      return
    }

    // 大標題：以「一、」「二、」等開頭
    if (/^[一二三四五六七八九十]+[、]/.test(trimmed)) {
      paragraphs.push(new Paragraph({
        text: trimmed,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 100 }
      }))
      return
    }

    // 條列：以數字或 ･ 開頭
    if (/^\d+[.]/.test(trimmed) || /^[･]/.test(trimmed)) {
      paragraphs.push(new Paragraph({
        text: trimmed,
        indent: { firstLine: 0, left: 360 },
        spacing: { after: 50 }
      }))
      return
    }

    // 一般段落
    paragraphs.push(new Paragraph({
      text: trimmed,
      spacing: { after: 50 }
    }))
  })

  return paragraphs
}

/**
 * 下載報告為 PNG
 */
const downloadPng = async () => {
  isDownloadingPng.value = true
  try {
    // 建立 A4 容器（794px × 1123px @ 96dpi）
    const container = document.createElement('div')
    container.style.cssText = `
      width: 794px;
      min-height: 1123px;
      padding: 60px;
      background: white;
      font-family: 'Noto Sans TC', 'Microsoft JhengHei', sans-serif;
      font-size: 14px;
      line-height: 1.8;
      color: #1a1a1a;
      position: fixed;
      left: -9999px;
      top: 0;
      box-sizing: border-box;
    `
    container.innerHTML = renderReportHtml(analysisReport.value)
    document.body.appendChild(container)

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    })
    document.body.removeChild(container)

    canvas.toBlob(blob => {
      saveAs(blob, `客戶狀況彙整_${getPeriodLabel()}_${new Date().toISOString().slice(0, 10)}.png`)
    })
  } catch (e) {
    console.error('[PNG 下載失敗]', e)
    error.value = 'PNG 下載失敗，請稍後再試'
  } finally {
    isDownloadingPng.value = false
  }
}

/**
 * 下載報告為 DOCX
 */
const downloadDocx = async () => {
  isDownloadingDocx.value = true
  try {
    const paragraphs = parseReportToParagraphs(analysisReport.value)

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: {
              width: 11906,  // A4 寬度（1/20mm）
              height: 16838  // A4 高度（1/20mm）
            }
          },
          margin: {
            top: 1134,      // 2cm
            bottom: 1134,
            left: 1134,
            right: 1134
          }
        },
        children: paragraphs
      }]
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `客戶狀況彙整_${getPeriodLabel()}_${new Date().toISOString().slice(0, 10)}.docx`)
  } catch (e) {
    console.error('[DOCX 下載失敗]', e)
    error.value = 'DOCX 下載失敗，請稍後再試'
  } finally {
    isDownloadingDocx.value = false
  }
}

/**
 * 監聽 show 變化
 */
watch(
  () => props.show,
  (newVal) => {
    console.log('[AnalyticsPanel] show changed:', newVal, 'projectId:', props.projectId)
    if (newVal) {
      loadStatistics()
    }
  }
)

// 組件掛載時
onMounted(() => {
  console.log('[AnalyticsPanel] Component mounted, projectId:', props.projectId)
})

/**
 * 監聽項目變化
 */
watch(
  () => props.projectId,
  () => {
    if (props.show) {
      loadStatistics()
    }
  }
)
</script>

<style scoped>
.analytics-dialog {
  max-height: 100vh;
  overflow-y: auto;
}

.analytics-content {
  background: #f5f7fa;
  min-height: 80vh;
  padding: 16px 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

@media (max-width: 599px) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
  padding-bottom: 8px;
  border-bottom: 3px solid #1976d2;
  flex: 1;
}

.copy-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

@media (max-width: 599px) {
  .copy-buttons {
    flex-direction: column;
    width: 100%;
  }
}

.copy-btn {
  font-size: 14px !important;
  min-width: fit-content;
}

@media (max-width: 599px) {
  .copy-btn {
    width: 100%;
  }
}

.preview-content {
  background: #f5f5f5;
  border-radius: 6px;
  padding: 12px;
  max-height: 60vh;
  overflow-y: auto;
}

.preview-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #333;
}

.period-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

@media (min-width: 600px) {
  .period-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

.date-range-text {
  font-size: 12px;
  color: white;
  font-weight: 600;
  padding: 8px 12px;
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(25, 118, 210, 0.2);
  width: 100%;
}

@media (min-width: 600px) {
  .date-range-text {
    margin-left: 0;
    width: auto;
  }
}

.metric-group {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-left: 4px solid #1976d2;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.metric-group:nth-of-type(1) {
  border-left-color: #1565c0; /* 本日銷售 - 深藍 */
}

.metric-group:nth-of-type(2) {
  border-left-color: #00bcd4; /* 已售 - 青 */
}

.metric-group:nth-of-type(3) {
  border-left-color: #ff9800; /* 未售 - 橙 */
}

.metric-group:nth-of-type(4) {
  border-left-color: #1976d2; /* 總數 - 藍 */
}

.metric-group:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.group-header {
  font-size: 14px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: 0.5px;
}

.status-detail-text {
  font-weight: 600;
  font-size: 14px;
  color: #1a1a1a;
}

.status-detail-text.cancelled-status {
  color: #d32f2f;
}

:deep(.cancelled-panel) {
  border-left: 4px solid #d32f2f;
}

:deep(.cancelled-panel .v-expansion-panel__header) {
  background-color: #fff5f5 !important;
}

:deep(.cancelled-panel:hover .v-expansion-panel__header) {
  background-color: #ffebee !important;
}

.cancelled-unit-item {
  background: linear-gradient(135deg, #fff5f5 0%, #ffebee 100%);
  border-color: #ef9a9a;
}

.cancelled-unit-item:hover {
  background: linear-gradient(135deg, #ffcdd2 0%, #ffebee 100%);
  border-color: #d32f2f;
  box-shadow: 0 4px 12px rgba(211, 47, 47, 0.2);
}

.units-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.unit-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
  border: 1.5px solid #e8eaed;
  border-radius: 6px;
  font-size: 13px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.unit-item:hover {
  background: linear-gradient(135deg, #e3f2fd 0%, #f0f8ff 100%);
  border-color: #1976d2;
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.2);
  transform: translateY(-2px);
}

.unit-info {
  font-weight: 600;
  color: #1a1a1a;
  word-break: break-word;
}

:deep(.v-expansion-panels) {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

:deep(.v-expansion-panel) {
  border: none;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.v-expansion-panel:last-child) {
  border-bottom: none;
}

:deep(.v-expansion-panel__header) {
  padding: 12px 16px;
  background: white;
  font-weight: 600;
  font-size: 14px;
}

:deep(.v-expansion-panel__header:hover) {
  background: #f8f9fa;
}

:deep(.v-expansion-panel--active .v-expansion-panel__header) {
  background: #f0f7ff;
  border-bottom: 2px solid #1976d2;
}

:deep(.v-expansion-panel__content__wrapper) {
  padding: 12px 16px;
  background: #fafbfc;
}

.chart-placeholder {
  border: 1px dashed #bdbdbd;
  background-color: #fafafa;
}
</style>
