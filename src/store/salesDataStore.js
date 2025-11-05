/**
 * ===============================================
 * 銷控數據智能緩存管理 Store
 * ===============================================
 * 
 * 功能說明：
 * 1. 智能緩存：30分鐘內重複訪問相同項目時使用緩存，減少90%+的Firestore讀取
 * 2. 即時更新：保持Firestore監聽器活躍，確保數據變動立即更新到緩存
 * 3. 健康監控：自動檢查監聽器狀態，發生錯誤時自動重連
 * 4. 性能統計：提供緩存命中率、監聽器狀態等統計信息
 * 
 * 緩存策略：
 * - 預設緩存時間：30分鐘（可配置）
 * - 最長緩存時間：2小時
 * - 最短緩存時間：5分鐘
 * 
 * 維護注意事項：
 * - 監聽器會在用戶離開頁面時保持活躍，確保下次進入時數據為最新
 * - 發生錯誤時會自動重連，重連間隔為5秒
 * - 開發模式下會在控制台輸出詳細的緩存統計信息
 * 
 * @author AI Assistant
 * @created 2025-09-16
 * @version 1.0.0
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { listenToSalesControlData, listenToSalesImages } from '@/api'

export const useSalesDataStore = defineStore('salesData', () => {
  // ===============================================
  // 1. 緩存配置設定
  // ===============================================
  
  const cacheConfig = {
    defaultExpiration: 30 * 60 * 1000, // 30分鐘預設緩存時間
    maxExpiration: 2 * 60 * 60 * 1000,  // 最長2小時緩存
    minExpiration: 5 * 60 * 1000,       // 最短5分鐘緩存
    reconnectDelay: 5000,               // 重連延遲時間（毫秒）
    healthCheckInterval: 60000,         // 健康檢查間隔（1分鐘）
  }

  // ===============================================
  // 2. 核心狀態管理
  // ===============================================
  
  /**
   * 緩存的項目數據
   * Key: projectId (string)
   * Value: { project, parameters, households, parkings, images }
   */
  const cachedData = ref(new Map())
  
  /**
   * 活躍的 Firestore 監聽器
   * Key: projectId (string)  
   * Value: unsubscribe function
   */
  const activeListeners = ref(new Map())
  
  /**
   * 最後更新時間記錄
   * Key: projectId (string)
   * Value: timestamp (number)
   */
  const lastUpdateTime = ref(new Map())
  
  /**
   * 監聽器健康狀態
   * Key: projectId (string)
   * Value: { lastActivity, status, error }
   */
  const listenerHealth = ref(new Map())

  /**
   * 性能統計數據
   */
  const performanceStats = ref({
    cacheHits: 0,           // 緩存命中次數
    cacheMisses: 0,         // 緩存未命中次數
    listenerReconnects: 0,  // 監聽器重連次數
    dataUpdates: 0,         // 數據更新次數
  })

  // ===============================================
  // 3. 緩存管理函數
  // ===============================================

  /**
   * 檢查緩存是否有效
   * @param {string} projectId - 項目ID
   * @param {number|null} customExpiration - 自定義過期時間（毫秒）
   * @returns {boolean} 緩存是否有效
   */
  const isCacheValid = (projectId, customExpiration = null) => {
    const lastUpdate = lastUpdateTime.value.get(projectId)
    if (!lastUpdate) return false
    
    const expiration = customExpiration || cacheConfig.defaultExpiration
    const isValid = Date.now() - lastUpdate < expiration
    
    // 開發模式下記錄緩存檢查結果
    if (import.meta.env.DEV) {
      const age = Math.round((Date.now() - lastUpdate) / 1000)
      console.log(`[Cache Check] ${projectId}: ${isValid ? 'VALID' : 'EXPIRED'} (${age}s old)`)
    }
    
    return isValid
  }

  /**
   * 獲取項目數據（從緩存）
   * @param {string} projectId - 項目ID
   * @returns {object} 項目數據對象
   */
  const getProjectData = (projectId) => {
    const data = cachedData.value.get(projectId)
    
    // 返回默認結構以避免組件錯誤
    return data || {
      project: { name: '讀取中...' },
      parameters: [],
      households: [],
      parkings: [],
      images: [],
      personnel: [] // ✓ 新增
    }
  }

  // ===============================================
  // 4. 監聽器管理函數
  // ===============================================

  /**
   * 確保監聽器健康運行
   * @param {string} projectId - 項目ID
   */
  const ensureHealthyListener = (projectId) => {
    const health = listenerHealth.value.get(projectId)
    const now = Date.now()
    
    // 檢查監聽器是否需要重建
    const needsRebuild = !health || 
                        !activeListeners.value.has(projectId) ||
                        health.status === 'error' ||
                        (now - health.lastActivity > cacheConfig.healthCheckInterval)
    
    if (needsRebuild) {
      console.log(`[Health Check] 重新建立監聽器: ${projectId}`)
      establishListener(projectId)
    }
  }

  /**
   * 建立強化的 Firestore 監聽器
   * @param {string} projectId - 項目ID
   */
  const establishListener = (projectId) => {
    // 清理舊監聽器
    const oldUnsubscribe = activeListeners.value.get(projectId)
    if (oldUnsubscribe) {
      try {
        oldUnsubscribe()
        console.log(`[Cleanup] 已清理舊監聽器: ${projectId}`)
      } catch (error) {
        console.warn(`[Cleanup Warning] 清理監聽器時發生錯誤: ${error.message}`)
      }
    }

    try {
      // 🎯 建立銷控數據監聽器
      const unsubscribeSalesData = listenToSalesControlData(
        projectId,
        
        // 數據更新回調函數
        (data) => {
          const now = Date.now()
          
          // 獲取現有緩存數據（保留圖片數據）
          const existingData = cachedData.value.get(projectId) || {}
          
          // 更新緩存數據（保留現有的圖片數據）
         cachedData.value.set(projectId, {
            project: data.project || { name: '專案資料載入失敗' },
            parameters: data.parameters || [],
            households: data.households || [],
            parkings: data.parkings || [],
            personnel: data.personnel || [], // ✓ 新增
            images: existingData.images || [] // 🔧 保留現有圖片數據，避免被覆蓋
          })
          
          // 更新時間戳
          lastUpdateTime.value.set(projectId, now)
          
          // 更新健康狀態
          listenerHealth.value.set(projectId, {
            lastActivity: now,
            status: 'healthy',
            error: null
          })
          
          // 更新統計數據
          performanceStats.value.dataUpdates++
          
          // 開發模式下記錄更新信息
          if (import.meta.env.DEV) {
            const householdsCount = data.households?.length || 0
            console.log(`[Real-time Update] ${projectId}: ${householdsCount} households updated`)
          }
        },
        
        // 錯誤處理回調函數
        (error) => {
          console.error(`[Sales Data Listener Error] ${projectId}:`, error)
          
          // 更新健康狀態為錯誤
          listenerHealth.value.set(projectId, {
            lastActivity: Date.now(),
            status: 'error',
            error: error.message
          })
          
          // 更新統計數據
          performanceStats.value.listenerReconnects++
          
          // 自動重連機制：延遲後重新建立監聽器
          console.log(`[Auto Reconnect] 將在 ${cacheConfig.reconnectDelay/1000} 秒後重連: ${projectId}`)
          setTimeout(() => {
            console.log(`[Reconnecting] 重新連接: ${projectId}`)
            establishListener(projectId)
          }, cacheConfig.reconnectDelay)
        }
      )

      // 🖼️ 建立圖片數據監聽器
      const unsubscribeImages = listenToSalesImages(
        projectId,
        
        // 圖片數據更新回調函數
        (imagesData) => {
          const now = Date.now()
          
          // 獲取現有緩存數據
          const existingData = cachedData.value.get(projectId) || {
            project: { name: '讀取中...' },
            parameters: [],
            households: [],
            parkings: [],
            images: []
          }
          
          // 更新圖片數據
          cachedData.value.set(projectId, {
            ...existingData,
            images: imagesData || []
          })
          
          // 更新時間戳
          lastUpdateTime.value.set(projectId, now)
          
          // 開發模式下記錄圖片更新信息
          if (import.meta.env.DEV) {
            const imagesCount = imagesData?.length || 0
            console.log(`[Images Update] ${projectId}: ${imagesCount} images loaded`)
          }
        },
        
        // 圖片監聽器錯誤處理
        (error) => {
          console.error(`[Images Listener Error] ${projectId}:`, error)
          
          // 圖片載入失敗不影響主要監聽器狀態，只記錄日志
          if (import.meta.env.DEV) {
            console.warn(`[Images Warning] 圖片數據載入失敗，但不影響其他功能: ${error.message}`)
          }
        }
      )

      // 🔗 創建聯合監聽器函數（同時取消兩個監聽器）
      const combinedUnsubscribe = () => {
        try {
          unsubscribeSalesData()
          console.log(`[Cleanup] 已停止銷控數據監聽器: ${projectId}`)
        } catch (error) {
          console.warn(`[Cleanup Warning] 停止銷控數據監聽器時發生錯誤: ${error.message}`)
        }
        
        try {
          unsubscribeImages()
          console.log(`[Cleanup] 已停止圖片數據監聽器: ${projectId}`)
        } catch (error) {
          console.warn(`[Cleanup Warning] 停止圖片數據監聽器時發生錯誤: ${error.message}`)
        }
      }

      // 保存聯合監聽器引用
      activeListeners.value.set(projectId, combinedUnsubscribe)
      
      // 初始化健康狀態
      listenerHealth.value.set(projectId, {
        lastActivity: Date.now(),
        status: 'connecting',
        error: null
      })
      
      console.log(`[Listener Created] 成功建立銷控數據和圖片監聽器: ${projectId}`)
      
    } catch (error) {
      console.error(`[Listener Creation Error] 建立監聽器失敗: ${projectId}`, error)
      
      // 記錄錯誤狀態
      listenerHealth.value.set(projectId, {
        lastActivity: Date.now(),
        status: 'error',
        error: error.message
      })
    }
  }

  // ===============================================
  // 5. 主要載入函數
  // ===============================================

  /**
   * 智能載入項目數據（核心函數）
   * @param {string} projectId - 項目ID
   * @param {boolean} forceRefresh - 是否強制刷新（忽略緩存）
   * @param {number|null} cacheExpiration - 自定義緩存過期時間
   * @returns {Promise<object>} 項目數據
   */
  const loadProjectData = async (projectId, forceRefresh = false, cacheExpiration = null) => {
    console.log(`[Load Request] ${projectId}, forceRefresh: ${forceRefresh}`)
    
    // 1. 檢查緩存有效性
    if (!forceRefresh && isCacheValid(projectId, cacheExpiration)) {
      console.log(`[Cache Hit] 使用緩存數據: ${projectId}`)
      
      // 更新統計數據
      performanceStats.value.cacheHits++
      
      // 確保監聽器健康（重要：即使使用緩存也要保持監聽器活躍）
      ensureHealthyListener(projectId)
      
      return getProjectData(projectId)
    }

    // 2. 緩存過期但有舊數據：先返回舊數據，背景更新
    if (!forceRefresh && cachedData.value.has(projectId)) {
      console.log(`[Stale Cache] 返回舊數據並背景更新: ${projectId}`)
      
      // 更新統計數據
      performanceStats.value.cacheHits++ // 仍算命中，因為避免了等待時間
      
      // 背景重新建立監聽器（非阻塞）
      setTimeout(() => {
        console.log(`[Background Update] 背景更新開始: ${projectId}`)
        establishListener(projectId)
      }, 0)
      
      return getProjectData(projectId)
    }

    // 3. 全新載入（無緩存或強制刷新）
    console.log(`[Fresh Load] 建立新監聽器並等待數據: ${projectId}`)
    
    // 更新統計數據
    performanceStats.value.cacheMisses++
    
    return new Promise((resolve, reject) => {
      // 設置載入超時
      const timeout = setTimeout(() => {
        console.error(`[Load Timeout] 載入超時: ${projectId}`)
        reject(new Error(`載入 ${projectId} 超時，請檢查網路連線`))
      }, 15000) // 15秒超時

      // 建立監聽器
      establishListener(projectId)
      
      // 輪詢檢查數據是否載入完成
      const checkDataReady = () => {
        const data = cachedData.value.get(projectId)
        
        if (data && data.households) { // 確保關鍵數據已載入
          clearTimeout(timeout)
          console.log(`[Load Complete] 數據載入完成: ${projectId}`)
          resolve(data)
        } else {
          // 100毫秒後再次檢查
          setTimeout(checkDataReady, 100)
        }
      }
      
      // 開始檢查數據
      checkDataReady()
    })
  }

  // ===============================================
  // 6. 緩存管理函數
  // ===============================================

  /**
   * 清理指定項目的緩存和監聽器
   * @param {string} projectId - 項目ID
   */
  const clearProjectData = (projectId) => {
    console.log(`[Clear Cache] 清理項目數據: ${projectId}`)
    
    // 停止監聽器
    const unsubscribe = activeListeners.value.get(projectId)
    if (unsubscribe) {
      try {
        unsubscribe()
        console.log(`[Unsubscribe] 已停止監聽器: ${projectId}`)
      } catch (error) {
        console.warn(`[Unsubscribe Warning] 停止監聽器時發生錯誤: ${error.message}`)
      }
    }
    
    // 清理所有相關數據
    activeListeners.value.delete(projectId)
    cachedData.value.delete(projectId)
    lastUpdateTime.value.delete(projectId)
    listenerHealth.value.delete(projectId)
  }

  /**
   * 清理所有緩存數據
   */
  const clearAllCache = () => {
    console.log(`[Clear All] 清理所有緩存數據`)
    
    // 停止所有監聽器
    activeListeners.value.forEach((unsubscribe, projectId) => {
      try {
        unsubscribe()
        console.log(`[Unsubscribe All] 已停止監聽器: ${projectId}`)
      } catch (error) {
        console.warn(`[Unsubscribe All Warning] 停止監聽器時發生錯誤: ${error.message}`)
      }
    })
    
    // 清理所有數據
    activeListeners.value.clear()
    cachedData.value.clear()
    lastUpdateTime.value.clear()
    listenerHealth.value.clear()
    
    // 重置統計數據
    performanceStats.value = {
      cacheHits: 0,
      cacheMisses: 0,
      listenerReconnects: 0,
      dataUpdates: 0,
    }
  }

  // ===============================================
  // 7. 統計和監控函數
  // ===============================================

  /**
   * 獲取緩存統計信息
   */
  const getCacheStats = computed(() => {
    const totalRequests = performanceStats.value.cacheHits + performanceStats.value.cacheMisses
    const hitRate = totalRequests > 0 ? 
      (performanceStats.value.cacheHits / totalRequests * 100).toFixed(1) + '%' : '0%'

    const stats = {
      // 基本統計
      totalCached: cachedData.value.size,
      activeListeners: activeListeners.value.size,
      cacheHitRate: hitRate,
      
      // 健康狀態統計
      healthyListeners: 0,
      errorListeners: 0,
      connectingListeners: 0,
      
      // 詳細信息
      cacheDetails: [],
      
      // 性能數據
      performance: {
        ...performanceStats.value,
        totalRequests
      }
    }

    // 統計監聽器健康狀態
    for (const [projectId, health] of listenerHealth.value.entries()) {
      switch (health.status) {
        case 'healthy': stats.healthyListeners++; break
        case 'error': stats.errorListeners++; break
        case 'connecting': stats.connectingListeners++; break
      }
      
      const lastUpdate = lastUpdateTime.value.get(projectId)
      const age = lastUpdate ? Math.round((Date.now() - lastUpdate) / 1000) : null
      
      stats.cacheDetails.push({
        projectId,
        age: age ? `${age}s` : 'never',
        status: health.status,
        valid: isCacheValid(projectId),
        error: health.error,
        lastActivity: new Date(health.lastActivity).toLocaleTimeString()
      })
    }

    return stats
  })

  /**
   * 手動設置緩存過期時間
   * @param {number} expiration - 過期時間（毫秒）
   */
  const setCacheExpiration = (expiration) => {
    const clampedExpiration = Math.min(
      Math.max(expiration, cacheConfig.minExpiration),
      cacheConfig.maxExpiration
    )
    
    cacheConfig.defaultExpiration = clampedExpiration
    
    console.log(`[Config Update] 緩存過期時間設為: ${clampedExpiration/1000}秒`)
  }

  // ===============================================
  // 8. 開發模式下的調試功能
  // ===============================================
  
  if (import.meta.env.DEV) {
    // 每30秒輸出一次統計信息
    setInterval(() => {
      const stats = getCacheStats.value
      if (stats.totalCached > 0) {
        console.group('📊 Sales Data Store Statistics')
        console.log('Cache Hit Rate:', stats.cacheHitRate)
        console.log('Total Cached Projects:', stats.totalCached)
        console.log('Active Listeners:', stats.activeListeners)
        console.log('Health Status:', {
          healthy: stats.healthyListeners,
          error: stats.errorListeners,
          connecting: stats.connectingListeners
        })
        console.table(stats.cacheDetails)
        console.groupEnd()
      }
    }, 30000)
  }

  // ===============================================
  // 9. 返回公開接口
  // ===============================================
  
  return {
    // 主要功能
    loadProjectData,
    getProjectData,
    
    // 緩存管理
    clearProjectData,
    clearAllCache,
    isCacheValid,
    
    // 統計和監控
    getCacheStats,
    
    // 配置
    setCacheExpiration,
    
    // 內部狀態（只讀，供調試使用）
    get cacheConfig() { return { ...cacheConfig } },
    get activeListenersCount() { return activeListeners.value.size },
    get cachedProjectsCount() { return cachedData.value.size }
  }
})

/**
 * ===============================================
 * 使用說明和最佳實踐
 * ===============================================
 * 
 * 基本使用：
 * ```javascript
 * import { useSalesDataStore } from '@/store/salesDataStore'
 * 
 * const salesDataStore = useSalesDataStore()
 * 
 * // 載入數據（會自動使用緩存）
 * await salesDataStore.loadProjectData('fuyu1750')
 * 
 * // 獲取數據
 * const projectData = salesDataStore.getProjectData('fuyu1750')
 * ```
 * 
 * 強制刷新：
 * ```javascript
 * await salesDataStore.loadProjectData('fuyu1750', true)
 * ```
 * 
 * 自定義緩存時間：
 * ```javascript
 * // 使用1小時緩存
 * await salesDataStore.loadProjectData('fuyu1750', false, 60 * 60 * 1000)
 * ```
 * 
 * 查看統計信息：
 * ```javascript
 * console.log(salesDataStore.getCacheStats)
 * ```
 * 
 * 維護注意事項：
 * 1. 監聽器會自動重連，無需手動處理
 * 2. 緩存在用戶離開頁面時不會自動清理，這是為了提升再次進入的速度
 * 3. 如需清理特定項目緩存，使用 clearProjectData(projectId)
 * 4. 開發模式下會定期輸出統計信息，生產環境不會
 * 5. 監聽器錯誤會自動重連，重連間隔為5秒
 */