<template>
  <v-dialog :model-value="show" @update:model-value="emit('update:show', $event)" max-width="90vw" fullscreen>
    <v-card class="analytics-dialog">
      <!-- Header -->
      <v-card-title class="d-flex justify-space-between align-center py-4">
        <div class="d-flex align-center">
          <v-icon class="mr-2" size="large" color="primary">mdi-chart-box</v-icon>
          <span class="text-h5">銷控統計分析</span>
        </div>
        <v-btn icon="mdi-close" variant="text" @click="close"></v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <!-- Content -->
      <v-card-text class="analytics-content px-4 py-6">
        <!-- 時間粒度切換 -->
        <div class="period-info mb-4">
          <AnalyticsPeriodToggle
            :period="selectedPeriod"
            @update:period="handlePeriodChange"
          />
          <span v-if="statistics" class="date-range-text">
            <template v-if="selectedPeriod === 'all'">
              累計統計（全部資料）
            </template>
            <template v-else-if="statistics.dateRange">
              期間: {{ formatDate(statistics.dateRange.start) }} ~ {{ formatDate(statistics.dateRange.end) }}
            </template>
          </span>
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
          <!-- Section 1: 銷售狀況 + 銷況明細 -->
          <v-row class="mb-6" no-gutters>
            <!-- 左側：銷售狀況卡片 -->
            <v-col cols="12" xl="6" class="pr-2">
              <div class="section-header mb-4">
                <div class="section-title">📊 銷售狀況</div>
                <v-btn
                  :text="copyButtonText"
                  size="small"
                  variant="outlined"
                  @click="copyToClipboard"
                  class="copy-btn"
                />
              </div>
              <v-row>
                <!-- 總戶數 - 只有累計才顯示 -->
                <v-col v-if="selectedPeriod === 'all'" cols="12" sm="6" md="4">
                  <MetricCard
                    title="總戶數"
                    :value="statistics.households.total"
                    :subtitle="`${formatAmount(statistics.households.totalAmount)}萬`"
                    icon="mdi-home"
                    icon-color="primary"
                    value-color="h5 text-primary"
                  />
                </v-col>

                <!-- 已售戶數 -->
                <v-col cols="12" sm="6" md="4">
                  <MetricCard
                    title="已售戶數"
                    :value="statistics.households.sold"
                    :subtitle="`${formatAmount(statistics.households.soldAmount)}萬 (${calculatePercentage(statistics.households.soldAmount, statistics.households.totalAmount)}%)`"
                    icon="mdi-home-check"
                    icon-color="success"
                    value-color="h5 text-success"
                  />
                </v-col>

                <!-- 未售戶數 - 只有累計才顯示 -->
                <v-col v-if="selectedPeriod === 'all'" cols="12" sm="6" md="4">
                  <MetricCard
                    title="未售戶數"
                    :value="statistics.households.unsold"
                    :subtitle="`${formatAmount(statistics.households.unsoldAmount)}萬 (${calculatePercentage(statistics.households.unsoldAmount, statistics.households.totalAmount)}%)`"
                    icon="mdi-home-outline"
                    icon-color="warning"
                    value-color="h5 text-warning"
                  />
                </v-col>

                <!-- 總車位數 - 只有累計才顯示 -->
                <v-col v-if="selectedPeriod === 'all'" cols="12" sm="6" md="4">
                  <MetricCard
                    title="總車位數"
                    :value="statistics.parkings.total"
                    :subtitle="`${formatAmount(statistics.parkings.totalAmount)}萬`"
                    icon="mdi-parking"
                    icon-color="info"
                    value-color="h5 text-info"
                  />
                </v-col>

                <!-- 已售車位 -->
                <v-col cols="12" sm="6" md="4">
                  <MetricCard
                    title="已售車位"
                    :value="statistics.parkings.sold"
                    :subtitle="`${formatAmount(statistics.parkings.soldAmount)}萬 (${calculatePercentage(statistics.parkings.soldAmount, statistics.parkings.totalAmount)}%)`"
                    icon="mdi-parking"
                    icon-color="success"
                    value-color="h5 text-success"
                  />
                </v-col>

                <!-- 未售車位 - 只有累計才顯示 -->
                <v-col v-if="selectedPeriod === 'all'" cols="12" sm="6" md="4">
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
            </v-col>

            <!-- 右側：銷況明細 -->
            <v-col cols="12" xl="6" class="pl-2">
              <div class="section-title mb-4">📋 銷況明細</div>
              <v-expansion-panels>
                <v-expansion-panel v-for="(count, status) in statistics.households.byStatus" :key="status">
                  <template v-slot:title>
                    <div class="status-item-header">
                      <span class="status-name">{{ status || '未售' }}</span>
                      <span class="status-count">{{ count }}戶</span>
                      <span class="status-amount">({{ formatAmount(statistics.households.byStatusAmount[status] || 0) }}萬)</span>
                    </div>
                  </template>

                  <v-card-text>
                    <div class="units-list">
                      <div v-for="unit in statistics.households.byStatusUnits[status]" :key="unit.unitId" class="unit-item">
                        <span class="unit-info">{{ unit.unitId }}({{ formatAmount(unit.amount) }}萬)-{{ unit.salesperson }}</span>
                      </div>
                    </div>
                  </v-card-text>
                </v-expansion-panel>
              </v-expansion-panels>
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
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useSalesDataStore } from '@/store/salesDataStore'
import { useAnalyticsStore } from '@/store/analyticsStore'
import AnalyticsPeriodToggle from './AnalyticsPeriodToggle.vue'
import MetricCard from './MetricCard.vue'
import PersonnelRanking from './PersonnelRanking.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  projectId: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update:show'])

const salesDataStore = useSalesDataStore()
const analyticsStore = useAnalyticsStore()

const selectedPeriod = ref('month')
const isLoading = ref(false)
const error = ref(null)
const statistics = ref(null)

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
 * 生成統計數據的純文本格式
 */
const generateStatisticsText = () => {
  if (!statistics.value) return ''

  const projectName = projectData.value.project?.name || '專案'
  const periodLabel = selectedPeriod.value === 'all' ? '累計' :
                      selectedPeriod.value === 'today' ? '本日' :
                      selectedPeriod.value === 'week' ? '本週' : '本月'

  let text = `${periodLabel}${projectName}銷況\n`

  // 日期或期間信息
  if (selectedPeriod.value === 'today' && statistics.value.dateRange) {
    text += `${formatDate(statistics.value.dateRange.start)}\n`
  } else if ((selectedPeriod.value === 'week' || selectedPeriod.value === 'month') && statistics.value.dateRange) {
    text += `期間：${formatDate(statistics.value.dateRange.start)} ~ ${formatDate(statistics.value.dateRange.end)}\n`
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

  text += `\n【銷售狀況】\n`

  // 只有累計模式顯示總戶數
  if (selectedPeriod.value === 'all') {
    text += `總戶數：${statistics.value.households.total}戶 (${formatAmount(totalHouseholdAmount)}萬) \n`
  }

  text += `總車位：${statistics.value.parkings.total}個 (${formatAmount(totalParkingAmount)}萬)\n`
  text += `全部總銷：${formatAmount(totalAllAmount)}萬\n`
  text += `\n`

  text += `已售戶數：${statistics.value.households.sold}戶 (${formatAmount(soldHouseholdAmount)}萬 | ${calculatePercentage(soldHouseholdAmount, totalHouseholdAmount)}%)\n`
  text += `已售車位：${statistics.value.parkings.sold}個 (${formatAmount(soldParkingAmount)}萬 | ${calculatePercentage(soldParkingAmount, totalParkingAmount)}%)\n`
  text += `已售總銷：${formatAmount(totalSoldAmount)}萬 (${calculatePercentage(totalSoldAmount, totalAllAmount)}%)\n`

  // 只有累計模式顯示未售
  if (selectedPeriod.value === 'all') {
    text += `\n`
    text += `未售戶數：${statistics.value.households.unsold}戶 (${formatAmount(unsoldHouseholdAmount)}萬 | ${calculatePercentage(unsoldHouseholdAmount, totalHouseholdAmount)}%)\n`
    text += `未售車位：${statistics.value.parkings.unsold}個 (${formatAmount(unsoldParkingAmount)}萬 | ${calculatePercentage(unsoldParkingAmount, totalParkingAmount)}%)\n`
  }

  text += `\n【銷況明細】\n`
  Object.entries(statistics.value.households.byStatus).forEach(([status, count]) => {
    const amount = statistics.value.households.byStatusAmount[status] || 0
    text += `${status}：${count}戶 (${formatAmount(amount)}萬)\n`

    const units = statistics.value.households.byStatusUnits[status] || []
    units.forEach(unit => {
      text += `  • ${unit.unitId}(${formatAmount(unit.amount)}萬)-${unit.salesperson}\n`
    })
  })

  return text
}

/**
 * 複製文本到剪貼板
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

const copyButtonText = ref('📋 複製為文本')

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
    statistics.value = analyticsStore.getStatistics(
      props.projectId,
      projectData.value,
      selectedPeriod.value
    )

    // DEBUG: 輸出統計詳細信息
    if (statistics.value) {
      console.log('[AnalyticsPanel] 統計數據:', {
        households: statistics.value.households,
        parkings: statistics.value.parkings,
        personnelCount: statistics.value.personnel?.length,
      })
    }
  } catch (err) {
    console.error('[AnalyticsPanel] 統計計算失敗:', err)
    error.value = err.message || '統計計算失敗'
    statistics.value = null
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
 * 關閉對話框
 */
const close = () => {
  emit('update:show', false)
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
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
  padding-bottom: 8px;
  border-bottom: 3px solid #1976d2;
  flex: 1;
}

.copy-btn {
  font-size: 12px !important;
  height: 28px !important;
  margin-bottom: 8px;
}

.period-info {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.date-range-text {
  font-size: 12px;
  color: white;
  font-weight: 600;
  margin-left: auto;
  padding: 4px 12px;
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(25, 118, 210, 0.2);
}

.status-item-header {
  display: flex;
  gap: 20px;
  align-items: center;
  flex: 1;
  width: 100%;
}

.status-name {
  font-weight: 700;
  font-size: 14px;
  color: #1a1a1a;
  min-width: 100px;
}

.status-count {
  font-size: 18px;
  font-weight: 800;
  color: #1976d2;
  min-width: 70px;
}

.status-amount {
  font-size: 13px;
  color: #666;
  margin-left: auto;
  font-weight: 600;
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
