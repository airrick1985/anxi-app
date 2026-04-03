/**
 * ===============================================
 * 銷控統計分析 Store
 * ===============================================
 *
 * 職責：
 * 1. 管理統計數據的緩存 (避免重複計算)
 * 2. 提供各種統計數據的訪問接口
 * 3. 處理時間粒度切換
 * 4. 監聽數據變更並更新統計
 *
 * @author Claude AI
 * @created 2026-04-03
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  calculateAllStatistics,
  calculateHouseholdStats,
  calculateParkingStats,
  calculatePersonnelStats,
  getDateRange,
} from '@/utils/analyticsCalculations'

export const useAnalyticsStore = defineStore('analytics', () => {
  // ===============================================
  // 1. 狀態管理
  // ===============================================

  /**
   * 統計數據緩存
   * Key: `${projectId}:${period}`
   * Value: { data: 統計結果物件, timestamp: 時間戳 }
   */
  const statisticsCache = ref(new Map())

  /**
   * 緩存配置
   */
  const cacheConfig = {
    expiration: 5 * 60 * 1000, // 5 分鐘緩存
  }

  // ===============================================
  // 2. 緩存管理
  // ===============================================

  /**
   * 檢查指定 key 的緩存是否有效
   */
  const isCacheValid = (cacheKey) => {
    const cached = statisticsCache.value.get(cacheKey)
    if (!cached) return false
    return Date.now() - cached.timestamp < cacheConfig.expiration
  }

  /**
   * 清除指定項目的緩存
   */
  const clearCache = (projectId) => {
    // 清除該項目的所有時間粒度的統計
    const keysToDelete = Array.from(statisticsCache.value.keys()).filter(
      key => key.startsWith(`${projectId}:`)
    )
    keysToDelete.forEach(key => statisticsCache.value.delete(key))
  }

  /**
   * 清除所有緩存
   */
  const clearAllCache = () => {
    statisticsCache.value.clear()
    lastUpdateTime.value.clear()
  }

  // ===============================================
  // 3. 統計數據訪問接口
  // ===============================================

  /**
   * 獲取完整統計數據 (包含戶別、車位、人員、趨勢)
   * @param {string} projectId - 項目ID
   * @param {Object} projectData - {households, parkings, personnel, parameters}
   * @param {string} period - 'today' | 'week' | 'month'
   * @returns {Object} 統計結果
   */
  const getStatistics = (projectId, projectData, period = 'month') => {
    const cacheKey = `${projectId}:${period}`

    // 檢查緩存
    if (isCacheValid(cacheKey)) {
      if (import.meta.env.DEV) {
        console.log(`[AnalyticsStore] 使用緩存: ${cacheKey}`)
      }
      return statisticsCache.value.get(cacheKey).data
    }

    // 計算統計數據
    if (import.meta.env.DEV) {
      console.log(`[AnalyticsStore] 計算統計: ${cacheKey}`)
    }

    const statistics = calculateAllStatistics(projectData, period)

    // 緩存結果
    statisticsCache.value.set(cacheKey, {
      data: statistics,
      timestamp: Date.now(),
    })

    return statistics
  }

  /**
   * 僅獲取戶別統計
   */
  const getHouseholdStats = (projectData, period = 'month') => {
    const dateRange = getDateRange(period)
    return calculateHouseholdStats(projectData.households || [], dateRange)
  }

  /**
   * 僅獲取車位統計
   */
  const getParkingStats = (projectData, period = 'month') => {
    const dateRange = getDateRange(period)
    return calculateParkingStats(projectData.parkings || [], projectData.households || [], dateRange)
  }

  /**
   * 僅獲取銷售人員統計
   */
  const getPersonnelStats = (projectData, period = 'month') => {
    const dateRange = getDateRange(period)
    return calculatePersonnelStats(
      projectData.households || [],
      projectData.parkings || [],
      projectData.personnel || [],
      dateRange
    )
  }

  /**
   * 獲取銷售人員詳細資訊 (包含該人員的所有成交戶別)
   */
  const getPersonnelDetail = (projectData, personName, period = 'month') => {
    const dateRange = getDateRange(period)
    const households = projectData.households || []
    const parkings = projectData.parkings || []

    // 篩選該銷售人員的已售戶別
    const filtered = households.filter(
      h =>
        h.salesperson === personName &&
        h.salesStatus_backend &&
        h.salesStatus_backend !== '' &&
        (!dateRange || new Date(h.payment_contract_date) >= dateRange.start)
    )

    return {
      personName,
      soldHouseholds: filtered,
      totalCount: filtered.length,
      period,
    }
  }

  // ===============================================
  // 4. 導出統計數據 (用於報表)
  // ===============================================

  /**
   * 導出統計數據為物件 (用於 Excel / PDF)
   */
  const exportStatisticsData = (statistics) => {
    if (!statistics) return null

    return {
      period: statistics.period,
      dateRange: {
        start: statistics.dateRange.start.toLocaleDateString('zh-TW'),
        end: statistics.dateRange.end.toLocaleDateString('zh-TW'),
      },
      households: {
        total: statistics.households.total,
        totalAmount: statistics.households.totalAmount,
        byStatus: statistics.households.byStatus,
        byStatusAmount: statistics.households.byStatusAmount,
        unsold: statistics.households.unsold,
        unsoldAmount: statistics.households.unsoldAmount,
        sold: statistics.households.sold,
        soldAmount: statistics.households.soldAmount,
      },
      parkings: {
        total: statistics.parkings.total,
        totalAmount: statistics.parkings.totalAmount,
        sold: statistics.parkings.sold,
        soldAmount: statistics.parkings.soldAmount,
        unsold: statistics.parkings.unsold,
        unsoldAmount: statistics.parkings.unsoldAmount,
      },
      personnel: statistics.personnel.map(p => ({
        name: p.name,
        soldCount: p.soldCount,
        totalAmount: p.totalAmount,
        premiumAmount: p.premiumAmount,
        byStatus: p.byStatus,
        byStatusAmount: p.byStatusAmount,
      })),
    }
  }

  // ===============================================
  // 5. 計算輔助方法
  // ===============================================

  /**
   * 格式化金額
   */
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  /**
   * 獲取百分比
   */
  const getPercentage = (part, total) => {
    if (total === 0) return 0
    return ((part / total) * 100).toFixed(1)
  }

  return {
    // 狀態
    statisticsCache,

    // 方法
    getStatistics,
    getHouseholdStats,
    getParkingStats,
    getPersonnelStats,
    getPersonnelDetail,
    clearCache,
    clearAllCache,
    exportStatisticsData,
    formatAmount,
    getPercentage,
  }
})
