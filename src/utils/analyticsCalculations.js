/**
 * ===============================================
 * 銷控統計分析 - 計算函數模塊
 * ===============================================
 *
 * 提供所有統計數據的計算邏輯，包括：
 * - 戶別統計 (總數、狀態分布、未售)
 * - 車位統計 (總數、已售、未售)
 * - 銷售人員統計 (成交戶數、銷售金額、溢差價)
 * - 趨勢數據 (按日期分組)
 *
 * @author Claude AI
 * @created 2026-04-03
 */

/**
 * 將各種日期格式轉換為 Date 對象
 */
const parseDate = (dateValue) => {
  if (!dateValue) return null
  try {
    // 處理 Firestore Timestamp 對象
    if (dateValue && typeof dateValue.toDate === 'function') {
      return dateValue.toDate()
    } else if (typeof dateValue === 'string') {
      return new Date(dateValue)
    } else if (dateValue instanceof Date) {
      return dateValue
    } else if (typeof dateValue === 'number') {
      return new Date(dateValue)
    }
    return null
  } catch (e) {
    console.warn('[parseDate] 日期解析失敗:', dateValue, e)
    return null
  }
}

/**
 * 檢查日期是否在指定時間範圍內
 */
const isDateInRange = (dateValue, startDate, endDate) => {
  const date = parseDate(dateValue)
  if (!date) return false

  try {
    return date >= startDate && date <= endDate
  } catch (e) {
    console.warn('[isDateInRange] 日期比較失敗:', dateValue, e)
    return false
  }
}

/**
 * 判斷戶別是否已成交（有任何日期）
 */
const isSoldHousehold = (household) => {
  return !!(household.payment_deposit_date || household.payment_complete_date || household.payment_contract_date)
}

/**
 * 獲取戶別的所有成交狀態（可能有多個）
 * 返回數組，例如：['小訂', '補足'] 表示既有小訂又有補足
 */
const getHouseholdStatuses = (household) => {
  const statuses = []

  if (household.payment_deposit_date) {
    statuses.push('小訂')
  }
  if (household.payment_complete_date) {
    statuses.push('補足')
  }
  if (household.payment_contract_date) {
    statuses.push('簽約')
  }

  return statuses
}

/**
 * 根據狀態獲取對應的日期字段
 */
const getDateByStatus = (household, status) => {
  if (status === '簽約') {
    return household.payment_contract_date
  } else if (status === '補足') {
    return household.payment_complete_date
  } else if (status === '小訂') {
    return household.payment_deposit_date
  }
  return null
}

/**
 * 獲取指定時間粒度的日期範圍
 * @param {string} period - 'today' | 'week' | 'month' | 'all'
 * @returns {{start: Date, end: Date}} 或 null (如果是 'all')
 */
export const getDateRange = (period = 'month') => {
  const now = new Date()

  switch (period) {
    case 'today': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      return { start, end }
    }

    case 'week': {
      const currentDate = now.getDate()
      const currentDay = now.getDay()
      // 週一為 1，週日為 0 -> 轉為週一為起點
      const diff = currentDate - currentDay + (currentDay === 0 ? -6 : 1)
      const start = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      end.setHours(23, 59, 59)
      return { start, end }
    }

    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      return { start, end }
    }

    case 'all':
      // 返回 null 表示不過濾
      return null

    default:
      return { start: new Date(0), end: new Date() }
  }
}

/**
 * 按銷售狀態分組戶別
 */
const groupHouseholdsByStatus = (households) => {
  const grouped = {}

  households.forEach(h => {
    const status = h.salesStatus_backend || '未售'
    if (!grouped[status]) {
      grouped[status] = []
    }
    grouped[status].push(h)
  })

  return grouped
}

/**
 * 計算單戶房屋成交總價
 */
const getHouseTransactionPrice = (household) => {
  const price = Number(household.price_transaction_house) || 0

  // DEBUG: 顯示價格計算
  if (price > 0 && household.unitId === household.unitId) {
    // 只在有效價格時記錄
  }

  return price
}

/**
 * 計算單戶房屋底價
 */
const getHouseFloorPrice = (household) => {
  return Number(household.price_floor_house_total) || 0
}

/**
 * 獲取單戶關聯的車位
 */
const getUnitParkings = (household, allParkings) => {
  return allParkings.filter(p => p.buyerUnitId === household.unitId) || []
}

/**
 * 計算單戶車位成交價合計
 */
const getParkingTransactionTotal = (household, allParkings) => {
  const parkings = getUnitParkings(household, allParkings)
  return parkings.reduce((sum, p) => sum + (Number(p.price_transaction) || 0), 0)
}

/**
 * 計算單戶車位底價合計
 */
const getParkingFloorTotal = (household, allParkings) => {
  const parkings = getUnitParkings(household, allParkings)
  return parkings.reduce((sum, p) => sum + (Number(p.price_floor) || 0), 0)
}

/**
 * 計算單戶成交總價 (房 + 車位)
 */
const getUnitTotalTransactionPrice = (household, allParkings) => {
  const housePrice = getHouseTransactionPrice(household)
  const parkingPrice = getParkingTransactionTotal(household, allParkings)
  const total = housePrice + parkingPrice

  // DEBUG: 記錄第一個成交記錄的價格
  if (household.salesStatus_backend && household.unitId) {
    const debugLog = window.__priceDebug = window.__priceDebug || {}
    if (!debugLog[household.unitId]) {
      debugLog[household.unitId] = {
        unitId: household.unitId,
        name: household.unitName,
        housePrice,
        parkingPrice,
        total,
        housePriceField: household.price_transaction_house,
      }
    }
  }

  return total
}

/**
 * 計算單戶底價合計 (房 + 車位)
 */
const getUnitTotalFloorPrice = (household, allParkings) => {
  const housePrice = getHouseFloorPrice(household)
  const parkingPrice = getParkingFloorTotal(household, allParkings)
  return housePrice + parkingPrice
}

/**
 * 計算單戶溢差價
 */
const getUnitPremium = (household, allParkings) => {
  const transaction = getUnitTotalTransactionPrice(household, allParkings)
  const floor = getUnitTotalFloorPrice(household, allParkings)
  return transaction - floor
}

/**
 * 計算戶別統計
 * @param {Array} households - 戶別陣列
 * @param {{start: Date, end: Date}} dateRange - 日期範圍
 * @returns {Object} 統計結果
 */
/**
 * 計算戶別統計
 * 成交狀態：根據日期欄位判斷（小訂、補足、簽約）
 * 一個戶別可能有多個狀態（如果有多個日期）
 * 已售 = 有任何日期的戶別總數
 * 銷況明細 = 按各自日期分別統計（可重複計算同一戶別）
 * 註：總戶數/總金額永遠基於全部數據
 */
export const calculateHouseholdStats = (households, dateRange = null) => {
  // 計算全部戶別的總數和金額（不受日期過濾）
  const totalUnfiltered = households.length
  const totalAmountUnfiltered = households.reduce((sum, h) => sum + getHouseFloorPrice(h), 0)

  const byStatus = {}
  const byStatusAmount = {} // 按狀態統計金額
  const byStatusUnits = {} // 按狀態統計戶別列表

  const soldHouseholdSet = new Set() // 用於計算不重複的已售戶別（考慮日期範圍）

  households.forEach(h => {
    // 獲取該戶別的所有狀態
    const statuses = getHouseholdStatuses(h)
    const transactionAmount = getHouseTransactionPrice(h)

    // 檢查該戶別是否在日期範圍內有任何成交狀態
    let isInDateRange = false

    // 針對每個狀態分別統計
    statuses.forEach(status => {
      // 檢查該狀態的日期是否在範圍內
      let shouldCount = true
      if (dateRange) {
        const statusDate = getDateByStatus(h, status)
        shouldCount = isDateInRange(statusDate, dateRange.start, dateRange.end)
      }

      if (!shouldCount) return

      isInDateRange = true // 標記該戶別在日期範圍內有成交

      // 更新統計
      if (!byStatus[status]) byStatus[status] = 0
      byStatus[status]++

      byStatusAmount[status] = (byStatusAmount[status] || 0) + transactionAmount

      if (!byStatusUnits[status]) byStatusUnits[status] = []
      byStatusUnits[status].push({
        unitId: h.unitId,
        unitName: h.unitName,
        amount: transactionAmount,
        salesperson: h.salesperson,
      })
    })

    // 只有在日期範圍內有成交時才加入已售集合
    if (isInDateRange) {
      soldHouseholdSet.add(h.unitId)
    }
  })

  // 計算已售（不重複計算，只計入日期範圍內的戶別）
  const sold = soldHouseholdSet.size
  const soldAmount = Array.from(soldHouseholdSet)
    .reduce((sum, unitId) => {
      const household = households.find(h => h.unitId === unitId)
      return sum + getHouseTransactionPrice(household)
    }, 0)

  // 計算未售（累計視圖才會有未售）
  let unsold = 0
  let unsoldAmount = 0
  if (!dateRange) {
    // 累計視圖：計算沒有任何日期的戶別
    unsold = households.filter(h => !isSoldHousehold(h)).length
    unsoldAmount = households
      .filter(h => !isSoldHousehold(h))
      .reduce((sum, h) => sum + getHouseFloorPrice(h), 0)
  }

  return {
    // 總計（不受日期過濾）
    total: totalUnfiltered,
    totalAmount: totalAmountUnfiltered,

    // 已售（不重複計算）
    sold,
    soldAmount,

    // 未售（只在累計視圖顯示）
    unsold,
    unsoldAmount,

    // 銷況明細（可重複計算同一戶別）
    byStatus,
    byStatusAmount,
    byStatusUnits,
    dataPoints: households,
  }
}

/**
 * 計算戶別統計 (使用簽約日期) - 備用版本
 * 注：payment_contract_date 目前為 null，此版本供未來使用
 */
export const calculateHouseholdStatsByContract = (households, dateRange = null) => {
  // 如果提供了日期範圍，只計算該範圍內簽約的
  let filtered = households
  if (dateRange) {
    filtered = households.filter(h => {
      // 使用 payment_contract_date (簽約日期)
      return isDateInRange(h.payment_contract_date, dateRange.start, dateRange.end)
    })
  }

  const byStatus = {}
  filtered.forEach(h => {
    const status = h.salesStatus_backend || '未售'
    byStatus[status] = (byStatus[status] || 0) + 1
  })

  const unsold = filtered.filter(h => !h.salesStatus_backend || h.salesStatus_backend === '').length
  const sold = filtered.filter(h => h.salesStatus_backend && h.salesStatus_backend !== '').length

  return {
    total: filtered.length,
    byStatus,
    unsold,
    sold,
    dataPoints: filtered,
  }
}

/**
 * 計算車位統計
 * @param {Array} parkings - 車位陣列
 * @param {Array} households - 戶別陣列 (用於日期過濾)
 * @param {{start: Date, end: Date}} dateRange - 日期範圍
 * @returns {Object} 統計結果
 * 注：總車位數永遠基於全部數據，已售/未售根據日期範圍過濾
 */
export const calculateParkingStats = (parkings, households = null, dateRange = null) => {
  // 計算全部車位的總數和金額（不受日期過濾）
  const totalUnfiltered = parkings.length
  const totalAmountUnfiltered = parkings.reduce((sum, p) => sum + (Number(p.price_floor) || 0), 0)

  let filtered = parkings

  // 如果提供了日期範圍和戶別數據，只計算該日期範圍內關聯戶別的車位
  if (dateRange && households && households.length > 0) {
    // 篩選日期範圍內有任何成交的戶別
    const householdsInRange = households.filter(h => {
      if (!isSoldHousehold(h)) return false

      const statuses = getHouseholdStatuses(h)
      // 如果任何一個狀態的日期在範圍內，就計入
      return statuses.some(status => {
        const statusDate = getDateByStatus(h, status)
        return isDateInRange(statusDate, dateRange.start, dateRange.end)
      })
    })

    const unitIdsInRange = new Set(householdsInRange.map(h => h.unitId))
    filtered = parkings.filter(p => unitIdsInRange.has(p.buyerUnitId))
  }

  const assigned = filtered.filter(p => p.buyerUnitId && p.buyerUnitId !== '')
  const unassigned = filtered.filter(p => !p.buyerUnitId || p.buyerUnitId === '')

  // 計算金額
  const unsoldAmount = unassigned.reduce((sum, p) => sum + (Number(p.price_floor) || 0), 0) // 未售車位底價
  const soldAmount = assigned.reduce((sum, p) => sum + (Number(p.price_transaction) || 0), 0) // 已售車位成交價

  return {
    // 總計（不受日期過濾）
    total: totalUnfiltered,
    totalAmount: totalAmountUnfiltered,

    // 已售/未售（受日期過濾）
    sold: assigned.length,
    soldAmount,
    unsold: unassigned.length,
    unsoldAmount,
    dataPoints: filtered,
  }
}

/**
 * 計算銷售人員統計
 * @param {Array} households - 戶別陣列
 * @param {Array} parkings - 車位陣列
 * @param {Array} personnel - 銷售人員陣列
 * @param {{start: Date, end: Date}} dateRange - 日期範圍
 * @returns {Array} 銷售人員統計 (已排序)
 */
export const calculatePersonnelStats = (households, parkings, personnel, dateRange = null) => {
  // 篩選已售狀態的戶別（根據日期欄位判斷）
  let filtered = households.filter(h => h.salesperson && isSoldHousehold(h))

  // 如果有日期範圍，進一步篩選該範圍內有成交的戶別
  if (dateRange) {
    filtered = filtered.filter(h => {
      const statuses = getHouseholdStatuses(h)
      // 如果任何一個狀態的日期在範圍內，就保留該戶別
      return statuses.some(status => {
        const statusDate = getDateByStatus(h, status)
        return isDateInRange(statusDate, dateRange.start, dateRange.end)
      })
    })
  }

  console.log('[calculatePersonnelStats] 開始計算', {
    totalSold: filtered.length,
    dateRange: dateRange ? {
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
    } : 'null (全部)',
  })

  const soldHouseholds = filtered

  const stats = personnel.map(person => {
    const personHouseholds = soldHouseholds.filter(h => h.salesperson === person.name)

    // 按狀態分組（同一戶別可能在多個狀態中出現）
    const byStatus = {}
    const byStatusAmount = {}

    personHouseholds.forEach(h => {
      const statuses = getHouseholdStatuses(h)
      const totalPrice = getUnitTotalTransactionPrice(h, parkings)

      // 針對每個狀態分別計算
      statuses.forEach(status => {
        // 檢查日期範圍
        let shouldCount = true
        if (dateRange) {
          const statusDate = getDateByStatus(h, status)
          shouldCount = isDateInRange(statusDate, dateRange.start, dateRange.end)
        }

        if (!shouldCount) return

        byStatus[status] = (byStatus[status] || 0) + 1
        byStatusAmount[status] = (byStatusAmount[status] || 0) + totalPrice
      })
    })

    // 已售戶數 = 該人員的不重複已售戶別數（已在上面依日期範圍篩選）
    const soldCount = personHouseholds.length

    // 銷售金額 = 該人員所有成交戶別的總金額（去重，已在上面依日期範圍篩選）
    const totalAmount = personHouseholds.reduce(
      (sum, h) => sum + getUnitTotalTransactionPrice(h, parkings),
      0
    )

    // 溢差價 = 該人員的溢差價合計（已在上面依日期範圍篩選）
    const premiumAmount = personHouseholds.reduce(
      (sum, h) => sum + getUnitPremium(h, parkings),
      0
    )

    return {
      name: person.name,
      soldCount,
      totalAmount,
      premiumAmount,
      householdCount: personHouseholds.length,
      byStatus,
      byStatusAmount,
    }
  })

  // 按銷售金額降序排序
  return stats.sort((a, b) => b.totalAmount - a.totalAmount)
}

/**
 * 計算每日銷售趨勢
 * @param {Array} households - 戶別陣列
 * @param {Array} parkings - 車位陣列
 * @param {{start: Date, end: Date}} dateRange - 日期範圍
 * @returns {Array} 每日統計 [{ date, amount, count, premium }]
 */
export const calculateDailySalesTrend = (households, parkings, dateRange) => {
  // 簡化邏輯：計算全部已售戶別，不用日期過濾
  const soldHouseholds = households.filter(h => h.salesStatus_backend && h.salesStatus_backend !== '')

  // 按日期分組（如果有日期）
  const dateMap = new Map()
  soldHouseholds.forEach(h => {
    let dateStr = '未訂'

    if (h.payment_deposit_date) {
      try {
        // 處理 Firestore Timestamp 對象
        let dateObj = h.payment_deposit_date

        // 如果是 Firestore Timestamp 對象，調用 toDate() 方法
        if (dateObj && typeof dateObj.toDate === 'function') {
          dateObj = dateObj.toDate()
        } else if (typeof dateObj === 'string') {
          dateObj = new Date(dateObj)
        } else if (!(dateObj instanceof Date)) {
          // 如果是數字時間戳
          dateObj = new Date(dateObj)
        }

        // 轉換為台灣時區的日期字符串
        const year = dateObj.getFullYear()
        const month = String(dateObj.getMonth() + 1).padStart(2, '0')
        const date = String(dateObj.getDate()).padStart(2, '0')
        dateStr = `${year}-${month}-${date}`

        // DEBUG: 顯示前2筆的轉換結果
        if (soldHouseholds.indexOf(h) < 2) {
          console.log('[calculateDailySalesTrend DEBUG] 日期轉換', {
            原始: h.payment_deposit_date,
            轉換後: dateStr,
            對應房價: h.price_transaction_house,
          })
        }
      } catch (e) {
        console.warn('[calculateDailySalesTrend] 日期解析失敗:', h.payment_deposit_date, e)
      }
    }

    if (!dateMap.has(dateStr)) {
      dateMap.set(dateStr, [])
    }
    dateMap.get(dateStr).push(h)
  })

  // 生成結果
  let isFirstEntry = true
  const result = Array.from(dateMap.entries())
    .sort(([d1], [d2]) => d1.localeCompare(d2))
    .map(([dateStr, units]) => {
      const amount = units.reduce((sum, h) => sum + getUnitTotalTransactionPrice(h, parkings), 0)
      const premium = units.reduce((sum, h) => sum + getUnitPremium(h, parkings), 0)

      // DEBUG: 記錄第一筆日期的詳細信息
      if (isFirstEntry) {
        console.log('[calculateDailySalesTrend DEBUG] 結果日期', {
          date: dateStr,
          recordCount: units.length,
          firstRecord: units[0],
          amount,
          premium,
        })
        isFirstEntry = false
      }

      return {
        date: dateStr,
        amount,
        count: units.length,
        premium,
      }
    })

  console.log('[calculateDailySalesTrend] 完整趨勢結果:', result)
  return result
}

/**
 * 計算狀態分布 (用於圖表)
 * @param {Object} byStatus - 按狀態分組的計數
 * @returns {{labels: Array, data: Array}}
 */
export const getStatusDistributionData = (byStatus) => {
  const labels = Object.keys(byStatus).filter(k => k !== '未售')
  const data = labels.map(label => byStatus[label])

  return {
    labels,
    data,
  }
}

/**
 * 綜合統計接口 - 一次性獲取所有統計數據
 * @param {Object} projectData - {households, parkings, personnel, parameters}
 * @param {string} period - 'today' | 'week' | 'month'
 * @returns {Object} 完整統計結果
 */
export const calculateAllStatistics = (projectData, period = 'month') => {
  const { households, parkings, personnel } = projectData

  if (!households || !parkings || !personnel) {
    console.warn('[Analytics] 缺少必要數據')
    return null
  }

  const dateRange = getDateRange(period)

  console.log('[calculateAllStatistics] 日期範圍:', {
    period,
    dateRange: dateRange ? {
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
    } : 'null (全部數據)',
  })

  return {
    period,
    dateRange,
    households: calculateHouseholdStats(households, dateRange),
    parkings: calculateParkingStats(parkings, households, dateRange),
    personnel: calculatePersonnelStats(households, parkings, personnel, dateRange),
  }
}
