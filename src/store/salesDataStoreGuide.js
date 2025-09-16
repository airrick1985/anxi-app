/**
 * ===============================================
 * 銷控系統智能緩存 - 快速使用指南
 * ===============================================
 */

import { useSalesDataStore } from '@/store/salesDataStore'

// ===============================================
// 基本使用方式
// ===============================================

const salesDataStore = useSalesDataStore()

// 1. 載入項目數據（自動使用緩存）
await salesDataStore.loadProjectData('fuyu1750')

// 2. 獲取緩存的數據
const projectData = salesDataStore.getProjectData('fuyu1750')
console.log('Households:', projectData.households.length)

// 3. 強制刷新（忽略緩存）
await salesDataStore.loadProjectData('fuyu1750', true)

// 4. 自定義緩存時間（1小時）
await salesDataStore.loadProjectData('fuyu1750', false, 60 * 60 * 1000)

// ===============================================
// 緩存管理
// ===============================================

// 檢查緩存是否有效
const isValid = salesDataStore.isCacheValid('fuyu1750')

// 查看緩存統計
const stats = salesDataStore.getCacheStats
console.log('Cache Hit Rate:', stats.cacheHitRate)

// 清理特定項目緩存
salesDataStore.clearProjectData('fuyu1750')

// 清理所有緩存
salesDataStore.clearAllCache()

// ===============================================
// 配置緩存過期時間
// ===============================================

// 設置為1小時
salesDataStore.setCacheExpiration(60 * 60 * 1000)

// 設置為10分鐘  
salesDataStore.setCacheExpiration(10 * 60 * 1000)

// ===============================================
// 在 Vue 組件中的完整使用示例
// ===============================================

/*
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSalesDataStore } from '@/store/salesDataStore'

const salesDataStore = useSalesDataStore()
const loading = ref(true)
const projectId = 'fuyu1750'

// 使用 computed 響應式獲取數據
const projectData = computed(() => salesDataStore.getProjectData(projectId))
const households = computed(() => projectData.value.households)
const project = computed(() => projectData.value.project)

// 載入數據
onMounted(async () => {
  try {
    await salesDataStore.loadProjectData(projectId)
    console.log(`載入完成：${households.value.length} 個戶別`)
  } catch (error) {
    console.error('載入失敗:', error)
  } finally {
    loading.value = false
  }
})

// 手動刷新
const refreshData = async () => {
  loading.value = true
  try {
    await salesDataStore.loadProjectData(projectId, true) // 強制刷新
    console.log('刷新完成')
  } finally {
    loading.value = false  
  }
}
</script>
*/

export {
  // 重新導出以便其他組件使用
  useSalesDataStore
}