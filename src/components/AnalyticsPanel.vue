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
          <span v-if="statistics" class="date-range-text">
            <template v-if="selectedPeriod === 'all'">
              累計統計（全部資料）
            </template>
            <template v-else-if="selectedPeriod === 'custom'">
              自訂期間: {{ formatDate(customDateRange.start) }} ~ {{ formatDate(customDateRange.end) }}
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
                <div class="d-flex gap-2">
                  <v-btn
                    :text="copyButtonText"
                    size="small"
                    variant="outlined"
                    @click="copyToClipboard"
                    class="copy-btn"
                  />
                  <v-btn
                    :text="copySimpleButtonText"
                    size="small"
                    variant="outlined"
                    color="info"
                    @click="copySimpleText"
                    class="copy-btn"
                  />
                </div>
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
            <v-col cols="12" xl="6" class="pl-2">
              <div class="section-title mb-4">📋 銷況明細</div>
              <v-expansion-panels>
                <v-expansion-panel
                  v-for="(count, status) in getFilteredByStatus()"
                  :key="status"
                >
                  <template v-slot:title>
                    <span class="status-detail-text">{{ status }} {{ count }}戶 ({{ formatAmount(statistics.households.byStatusAmount[status] || 0) }}萬)</span>
                  </template>

                  <v-card-text>
                    <div class="units-list">
                      <div v-for="unit in statistics.households.byStatusUnits[status]" :key="unit.unitId" class="unit-item">
                        <span class="unit-info">{{ unit.unitId }}({{ formatAmount(unit.total_transaction) }}萬 / {{ calculateUnitPrice(unit.unitId) }}萬/坪)-{{ unit.salesperson }}</span>
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
} from '@/utils/analyticsCalculations'
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

  // 直接使用資料庫的 unit_price_transaction 欄位，並四捨五入到第二位
  const unitPrice = Number(household.unit_price_transaction) || 0

  if (unitPrice === 0) return 'N/A'

  return unitPrice.toFixed(2)
}

/**
 * 獲取時間粒度標籤
 */
const getPeriodLabel = () => {
  if (selectedPeriod.value === 'today') return '本日'
  if (selectedPeriod.value === 'week') return '本週'
  if (selectedPeriod.value === 'month') return '本月'
  if (selectedPeriod.value === 'custom') return '自訂期間'
  return ''
}

/**
 * 過濾銷況明細：只顯示小訂、補足、簽約
 */
const getFilteredByStatus = () => {
  if (!statistics.value?.households?.byStatus) return {}

  const validStatuses = ['小訂', '補足', '簽約']
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
                      selectedPeriod.value === 'month' ? '本月' : '自訂期間'

  let text = `${periodLabel}${projectName}銷況\n`

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

  text += `\n【銷售狀況】\n`

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

  // 總數（第四組）
  text += `\n總戶數：${statistics.value.households.total}戶 (${formatAmount(totalHouseholdAmount)}萬)\n`
  text += `總車位：${statistics.value.parkings.total}個 (${formatAmount(totalParkingAmount)}萬)\n`
  text += `全部總銷：${formatAmount(totalAllAmount)}萬\n`

  text += `\n【銷況明細】\n`
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

        text += `  • ${unit.unitId}(${Math.floor(unit.total_transaction)}萬 / ${unitPrice}萬/坪)${parkingText}-${unit.salesperson}\n`
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

  let text = `${projectName}銷況\n`

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
    text += `${getPeriodLabel()}銷售總銷：${formatAmount(periodTotalAmount)}萬 (${calculatePercentage(periodTotalAmount, totalAllAmount)}%)\n\n`
  }

  // 累積已售
  text += `累積已售戶數：${statistics.value.households.sold}戶 (${formatAmount(soldHouseholdAmount)}萬)\n`
  text += `累積已售車位：${statistics.value.parkings.sold}個 (${formatAmount(soldParkingAmount)}萬)\n`
  text += `累積已售總銷：${formatAmount(totalSoldAmount)}萬 (${calculatePercentage(totalSoldAmount, totalAllAmount)}%)`

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

const copyButtonText = ref('📋 複製完整文本')
const copySimpleButtonText = ref('📝 複製簡易文本')

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
