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

import { normalizeSalespersons, salespersonsInclude, salespersonShare } from './salespersonUtils'

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
 * 判斷戶別是否已成交
 * 條件：必須有小訂日期(payment_deposit_date)，且狀態為小訂、補足或簽約
 */
const isSoldHousehold = (household) => {
  // 必須有小訂日期
  if (!household.payment_deposit_date) return false

  // 狀態必須是小訂、補足或簽約
  const validStatuses = ['小訂', '補足', '簽約']
  return validStatuses.includes(household.salesStatus_backend)
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
export const getUnitParkings = (household, allParkings) => {
  return allParkings.filter(p => p.buyerUnitId === household.unitId) || []
}

/**
 * 計算單戶車位成交價合計
 */
export const getParkingTransactionTotal = (household, allParkings) => {
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
export const getUnitTotalTransactionPrice = (household, allParkings) => {
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

  const cumulativeSoldSet = new Set() // 累計已售（所有有任何日期的戶別）
  const periodSoldSet = new Set() // 該時間段內的新銷售（只計算該時間段內有成交的戶別）

  households.forEach(h => {
    // 先檢查該戶別的銷售狀態是否有效（必須是小訂、補足或簽約）
    const validStatuses = ['小訂', '補足', '簽約']
    if (!validStatuses.includes(h.salesStatus_backend)) return // 跳過無效狀態（如保留）

    // 獲取該戶別的所有狀態
    const statuses = getHouseholdStatuses(h)
    const transactionAmount = getHouseTransactionPrice(h)

    // 檢查該戶別是否已成交（使用新的已售定義：小訂日期 + 有效狀態）
    if (isSoldHousehold(h)) {
      cumulativeSoldSet.add(h.unitId)
    }

    // 檢查該戶別是否在日期範圍內有任何成交狀態
    let isInDateRange = false

    // 針對每個狀態分別統計（只納入小訂、補足、簽約）
    statuses.forEach(status => {
      // 只統計有效的狀態
      if (!validStatuses.includes(status)) return

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

      const priceTransactionTotal = Number(h.price_transaction_total) || 0
      byStatusAmount[status] = (byStatusAmount[status] || 0) + priceTransactionTotal

      if (!byStatusUnits[status]) byStatusUnits[status] = []
      byStatusUnits[status].push({
        unitId: h.unitId,
        unitName: h.unitName,
        amount: transactionAmount,
        price_transaction_total: Number(h.price_transaction_total) || 0,
        salesperson: h.salesperson,
      })
    })

    // 廢棄：舊邏輯依賴狀態判斷，新邏輯改在下方統一處理
  })

  // 重新計算 periodSoldSet：只根據小訂日期判斷，不考慮狀態
  households.forEach(h => {
    // 只計算有小訂日期的戶別
    if (!h.payment_deposit_date) return

    // 檢查狀態是否為有效狀態（小訂、補足、簽約）
    const validStatuses = ['小訂', '補足', '簽約']
    if (!validStatuses.includes(h.salesStatus_backend)) return

    // 檢查小訂日期是否在時間範圍內
    let isDepositInRange = true
    if (dateRange) {
      isDepositInRange = isDateInRange(h.payment_deposit_date, dateRange.start, dateRange.end)
    }

    // 只要小訂日期在範圍內且狀態有效，就加入 periodSoldSet
    if (isDepositInRange) {
      periodSoldSet.add(h.unitId)
    }
  })

  // 計算累計已售（所有有任何日期的戶別）
  const cumulativeSold = cumulativeSoldSet.size
  const cumulativeSoldAmount = Array.from(cumulativeSoldSet)
    .reduce((sum, unitId) => {
      const household = households.find(h => h.unitId === unitId)
      return sum + getHouseTransactionPrice(household)
    }, 0)

  // 計算該時間段內的新銷售
  const periodSold = periodSoldSet.size
  const periodSoldAmount = Array.from(periodSoldSet)
    .reduce((sum, unitId) => {
      const household = households.find(h => h.unitId === unitId)
      return sum + getHouseTransactionPrice(household)
    }, 0)

  // 計算未售（總數 - 累計已售）
  const unsold = totalUnfiltered - cumulativeSold
  const unsoldAmount = totalAmountUnfiltered - cumulativeSoldAmount

  return {
    // 總計（不受日期過濾）
    total: totalUnfiltered,
    totalAmount: totalAmountUnfiltered,

    // 累計已售（所有有任何日期的戶別）
    sold: cumulativeSold,
    soldAmount: cumulativeSoldAmount,

    // 該時間段內的新銷售
    periodSold,
    periodSoldAmount,

    // 未售（總數 - 累計已售）
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

  // 計算累計已售（關聯到有小訂日期且狀態有效的戶別的車位）
  const cumulativeAssigned = parkings.filter(p => {
    if (!p.buyerUnitId || p.buyerUnitId === '') return false
    const relatedHousehold = households?.find(h => h.unitId === p.buyerUnitId)
    if (!relatedHousehold || !relatedHousehold.payment_deposit_date) return false

    // 檢查狀態是否為有效狀態（小訂、補足、簽約）
    const validStatuses = ['小訂', '補足', '簽約']
    return validStatuses.includes(relatedHousehold.salesStatus_backend)
  })
  const cumulativeSold = cumulativeAssigned.length
  const cumulativeSoldAmount = cumulativeAssigned.reduce((sum, p) => sum + (Number(p.price_transaction) || 0), 0)

  let filtered = parkings

  // 如果提供了日期範圍和戶別數據，只計算該日期範圍內關聯戶別的車位
  if (dateRange && households && households.length > 0) {
    // 篩選日期範圍內有小訂日期且狀態有效的戶別
    const householdsInRange = households.filter(h => {
      if (!h.payment_deposit_date) return false

      // 檢查狀態是否為有效狀態（小訂、補足、簽約）
      const validStatuses = ['小訂', '補足', '簽約']
      if (!validStatuses.includes(h.salesStatus_backend)) return false

      // 檢查小訂日期是否在範圍內
      return isDateInRange(h.payment_deposit_date, dateRange.start, dateRange.end)
    })

    const unitIdsInRange = new Set(householdsInRange.map(h => h.unitId))
    filtered = parkings.filter(p => unitIdsInRange.has(p.buyerUnitId))
  }

  const assigned = filtered.filter(p => p.buyerUnitId && p.buyerUnitId !== '')

  // 計算該時間段內的新銷售
  const periodSold = assigned.length
  const periodSoldAmount = assigned.reduce((sum, p) => sum + (Number(p.price_transaction) || 0), 0)

  // 計算未售（總車位數 - 累計已售車位數）
  const unsold = totalUnfiltered - cumulativeSold
  const unsoldAmount = totalAmountUnfiltered - cumulativeSoldAmount

  return {
    // 總計（不受日期過濾）
    total: totalUnfiltered,
    totalAmount: totalAmountUnfiltered,

    // 累計已售
    sold: cumulativeSold,
    soldAmount: cumulativeSoldAmount,

    // 該時間段內的新銷售
    periodSold,
    periodSoldAmount,

    // 未售（總車位數 - 累計已售）
    unsold,
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
  // 銷售人員（複選）：salesperson 為陣列，至少有一位才納入
  let filtered = households.filter(h => normalizeSalespersons(h.salesperson).length > 0 && isSoldHousehold(h))

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
    const personHouseholds = soldHouseholds.filter(h => salespersonsInclude(h.salesperson, person.name))

    // 按狀態分組（同一戶別可能在多個狀態中出現）
    const byStatus = {}
    const byStatusAmount = {}

    // ✅ 平均分配制：一戶有 N 位銷售人員時，每人各分攤 1/N
    //    確保各人員加總後等於整體實際戶數/金額（不重複計算）

    personHouseholds.forEach(h => {
      const statuses = getHouseholdStatuses(h)
      const totalPrice = getUnitTotalTransactionPrice(h, parkings)
      const share = salespersonShare(h.salesperson) // 1 / 該戶銷售人員數

      // 針對每個狀態分別計算
      statuses.forEach(status => {
        // 檢查日期範圍
        let shouldCount = true
        if (dateRange) {
          const statusDate = getDateByStatus(h, status)
          shouldCount = isDateInRange(statusDate, dateRange.start, dateRange.end)
        }

        if (!shouldCount) return

        byStatus[status] = (byStatus[status] || 0) + share
        byStatusAmount[status] = (byStatusAmount[status] || 0) + totalPrice * share
      })
    })

    // 已售戶數 = 該人員分攤的已售戶數合計（平均分配，可能為小數）
    const soldCount = personHouseholds.reduce(
      (sum, h) => sum + salespersonShare(h.salesperson),
      0
    )

    // 銷售金額 = 該人員所有成交戶別的分攤金額合計
    const totalAmount = personHouseholds.reduce(
      (sum, h) => sum + getUnitTotalTransactionPrice(h, parkings) * salespersonShare(h.salesperson),
      0
    )

    // 溢差價 = 該人員的分攤溢差價合計
    const premiumAmount = personHouseholds.reduce(
      (sum, h) => sum + getUnitPremium(h, parkings) * salespersonShare(h.salesperson),
      0
    )

    return {
      name: person.name,
      soldCount,
      totalAmount,
      premiumAmount,
      householdCount: soldCount,
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
 * 計算VIP客人的來人概況統計
 * @param {Array} vipGuests - VIP客人列表
 * @param {Object} dateRange - {start: Date, end: Date}
 * @returns {Object} {newCustomers: 數字, returningCustomers: 數字, totalVisitors: 數字, details: Array}
 */
export const calculateVipGuestStats = (vipGuests, dateRange) => {
  if (!vipGuests || !Array.isArray(vipGuests)) {
    return {
      newCustomers: 0,
      returningCustomers: 0,
      totalVisitors: 0,
      details: [],
    }
  }

  let newCustomersCount = 0
  let returningCustomersCount = 0
  const details = []

  vipGuests.forEach(guest => {
    if (!guest.interactionLogs || !Array.isArray(guest.interactionLogs)) {
      return
    }

    // 📌 第一步：獲取客人全部歷史中的所有"現場介紹"（不受dateRange限制）
    const allShowingLogs = guest.interactionLogs
      .filter(log => log.tags?.interactionType === '現場介紹')
      .sort((a, b) => {
        const dateA = parseDate(a.date)
        const dateB = parseDate(b.date)
        return dateA - dateB
      })

    if (allShowingLogs.length === 0) {
      return
    }

    // 📌 第二步：根據dateRange過濾時間段內的interactionLogs
    let filteredLogs = guest.interactionLogs
    if (dateRange && dateRange.start && dateRange.end) {
      filteredLogs = guest.interactionLogs.filter(log => {
        const logDate = parseDate(log.date)
        return logDate && isDateInRange(logDate, dateRange.start, dateRange.end)
      })
    }

    if (filteredLogs.length === 0) {
      return
    }

    // 📌 第三步：在該時間段內找出"現場介紹"紀錄
    const timeRangeShowingLogs = filteredLogs
      .filter(log => log.tags?.interactionType === '現場介紹')
      .sort((a, b) => {
        const dateA = parseDate(a.date)
        const dateB = parseDate(b.date)
        return dateA - dateB
      })

    if (timeRangeShowingLogs.length === 0) {
      return
    }

    // 取得銷售人員信息
    const salesName = guest.latestSalesName || '未指定'
    const salesPhone = guest.latestSalesPhone || ''

    // 📌 第四步：構建該客人的全部互動紀錄
    // 將全部interactionLogs按時間排序
    const allInteractionLogs = (guest.interactionLogs || [])
      .sort((a, b) => {
        const dateA = parseDate(a.date)
        const dateB = parseDate(b.date)
        return dateA - dateB
      })
      .map(log => {
        const interactionType = log.tags?.interactionType || '其他'
        const noPurchaseReasonRaw = log.tags?.noPurchaseReason || []
        const noPurchaseReason = Array.isArray(noPurchaseReasonRaw)
          ? noPurchaseReasonRaw.filter(Boolean)
          : (noPurchaseReasonRaw ? [noPurchaseReasonRaw] : [])

        return {
          date: log.date || '未知',
          content: log.content || '(無內容)',
          interactionType: interactionType,
          recorderName: log.recorderName || '未知',
          rating: log.tags?.rating || '',
          noPurchaseReason: noPurchaseReason,
        }
      })

    // 📌 第五步：判定該客人的新客/回訪狀態
    // 基於"現場介紹"紀錄判定
    const firstVisitInRange = timeRangeShowingLogs[0]
    const historyIndexOfFirstVisit = allShowingLogs.findIndex(
      historyLog => historyLog.logId === firstVisitInRange.logId
    )
    const isNewCustomer = historyIndexOfFirstVisit === 0

    if (isNewCustomer) {
      newCustomersCount++
    } else {
      returningCustomersCount++
    }

    // 取得最新一筆互動紀錄的 tags（代表客人目前的等級與未購原因）
    const latestLogWithTags = [...(guest.interactionLogs || [])]
      .sort((a, b) => parseDate(b.date) - parseDate(a.date))
      .find(log => log.tags?.rating || (log.tags?.noPurchaseReason?.length))
    const latestTags = latestLogWithTags?.tags || {}

    const guestLevel = guest.profile?.['等級研判'] || guest.profile?.rating || latestTags.rating || ''
    const noPurchaseReasonRaw = guest.profile?.['未買原因'] || guest.profile?.noPurchaseReason || latestTags.noPurchaseReason || []
    const noPurchaseReasons = Array.isArray(noPurchaseReasonRaw)
      ? noPurchaseReasonRaw.filter(Boolean)
      : (noPurchaseReasonRaw ? [noPurchaseReasonRaw] : [])

    // 添加一個detail項目（代表該客人在該時間段內的訪問）
    details.push({
      guestId: guest.id,
      guestName: guest.latestName || '未知',
      guestPhone: guest.phone || guest.profile?.['電話']?.[0] || '未知',
      salesName: salesName,
      salesPhone: salesPhone,
      type: isNewCustomer ? 'new' : 'returning',
      interactionLogs: allInteractionLogs, // 全部互動紀錄
      visitIndex: historyIndexOfFirstVisit + 1, // 該時間段內首次訪問的全部歷史序號
      guestLevel: guestLevel,
      noPurchaseReasons: noPurchaseReasons,
    })
  })

  return {
    newCustomers: newCustomersCount,
    returningCustomers: returningCustomersCount,
    totalVisitors: newCustomersCount + returningCustomersCount,
    details: details.sort((a, b) => {
      // 按客人ID和訪問順序排序
      if (a.guestId !== b.guestId) {
        return a.guestId.localeCompare(b.guestId)
      }
      return a.visitIndex - b.visitIndex
    }),
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
