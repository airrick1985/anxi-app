# 📊 銷控系統 - 統計分析功能 SPEC

**版本**: v1.0  
**日期**: 2026-04-03  
**負責人**: [Team]

---

## 一、功能概述

在 SalesControlSystem.vue 中新增**統計分析面板**，提供多維度、多時間粒度的銷售數據分析，幫助管理層快速了解項目銷售進度。

---

## 二、數據模型確認

### 2.1 關鍵字段來源 (來自 `households` 陣列)

```javascript
{
  // 基本資訊
  unitId: string,                    // 戶別編號
  
  // 銷售狀態
  salesStatus_backend: string,       // 銷控狀態 (來自參數.statusName)
                                     // 可能值: "已售", "議價", "待訂", "退戶" 等
                                     // 空值 "" = 未售
  
  // 銷售人員
  salesperson: string,               // 銷售人員姓名
  
  // 價格信息
  price_list_house_total: number,    // 房屋表價 (萬元)
  price_transaction_house: number,   // 房屋成交價 (萬元) - 實際成交額
  
  // 日期信息
  payment_deposit_date: Date|string, // 小訂日期
  payment_contract_date: Date|string,// 簽約日期
}
```

### 2.2 關聯車位信息

```javascript
// 來自 parkings 陣列，通過 buyerUnitId 與 households 關聯
{
  spotId: string,                    // 車位編號
  buyerUnitId: string,               // 關聯的戶別編號
  price_list: number,                // 車位表價 (萬元)
  price_floor: number,               // 車位底價 (萬元)
  price_transaction: number,         // 車位成交價 (萬元)
}
```

### 2.3 銷售人員信息

```javascript
// 來自 personnel 陣列
{
  name: string,                      // 銷售人員姓名
  // 其他欄位...
}
```

---

## 三、統計指標定義

### 3.1 戶別統計

| 指標 | 計算邏輯 | 備註 |
|------|--------|------|
| **總戶數** | `households.length` | - |
| **各狀態戶數** | 按 `salesStatus_backend` 分組計數 | 需列出所有狀態 |
| **未售戶數** | `salesStatus_backend === ""` | - |
| **已售戶數** | `salesStatus_backend !== "" && salesStatus_backend !== "待訂"` | 排除待訂、未售 |

### 3.2 車位統計

| 指標 | 計算邏輯 | 備註 |
|------|--------|------|
| **總車位數** | `parkings.length` | - |
| **已售車位數** | `buyerUnitId !== null && buyerUnitId !== ""` | 有關聯戶別即為已售 |
| **未售車位數** | `buyerUnitId === null \|\| buyerUnitId === ""` | - |

### 3.3 銷售人員統計

| 指標 | 計算邏輯 | 備註 |
|------|--------|------|
| **個人成交戶數** | 計數 `salesStatus_backend !== ""` 且 `salesperson === [姓名]` | 排除未售 |
| **個人總金額** | **房價 + 車位價 + 溢差價** | 見 3.4 |

### 3.4 金額計算公式

**單戶成交總價** = 房屋成交價 + 該戶關聯車位的成交價合計

**溢差價** = 成交總價 - 底價合計
- 其中底價合計 = 房屋底價 + 該戶關聯車位底價合計

**個人銷售總金額** = ∑(該銷售人員關聯的所有已售戶的成交總價)

**個人溢差價** = ∑(該銷售人員關聯的所有已售戶的溢差價)

---

## 四、時間粒度定義

### 4.1 時間範圍

| 粒度 | 計算範圍 | 依據字段 |
|------|---------|---------|
| **本日** | 00:00 ~ 23:59 (今天) | `payment_contract_date` (簽約日期) |
| **本週** | 週一 ~ 週日 (當週) | `payment_contract_date` |
| **本月** | 1日 ~ 月末 (當月) | `payment_contract_date` |

> **注意**: 使用 `payment_contract_date`（簽約日期）而非 `payment_deposit_date`（小訂日期），因為簽約才代表實際成交。

### 4.2 日期處理

```javascript
// 週一為第一天，週日為第七天
const getWeekRange = (date) => {
  const d = new Date(date)
  const day = d.getDay() // 0 = 周日, 1 = 周一
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  return { start: monday, end: sunday }
}
```

---

## 五、UI 組件設計

### 5.1 面板佈局

```
┌─────────────────────────────────────────┐
│  統計分析 Panel Header                   │
│  [今日] [本週] [本月] 按鈕切換           │
├─────────────────────────────────────────┤
│  上半部：關鍵數字卡片（響應式 4 列）      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ 總戶數  │ │ 已售戶數│ │ 未售戶數│   │
│  │   58    │ │   23    │ │   35    │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ 車位總數│ │ 已售車位│ │ 未售車位│   │
│  │   80    │ │   28    │ │   52    │   │
│  └─────────┘ └─────────┘ └─────────┘   │
├─────────────────────────────────────────┤
│  中部：狀態分布 + 金額趨勢               │
│  ┌──────────────────┐ ┌───────────────┐│
│  │ 狀態分布圖表     │ │  銷售金額趨勢 ││
│  │ (Pie/Donut)      │ │  (Line/Bar)   ││
│  └──────────────────┘ └───────────────┘│
├─────────────────────────────────────────┤
│  下部：銷售人員排行榜（Table）           │
│  ┌────┬────────┬────────┬────────┐     │
│  │名次│銷售人員│成交戶數│銷售金額│     │
│  ├────┼────────┼────────┼────────┤     │
│  │ 1  │ 王小明 │   6    │ 1,200萬│     │
│  │ 2  │ 李美玲 │   5    │ 980萬  │     │
│  └────┴────────┴────────┴────────┘     │
│  可scroll，顯示全部銷售人員              │
└─────────────────────────────────────────┘
```

### 5.2 組件結構

```
SalesControlSystem.vue
├── AnalyticsPanel.vue (新增)
│   ├── AnalyticsPeriodToggle (子組件)
│   ├── MetricsCards (子組件)
│   │   ├── MetricCard (可複用)
│   │   └── MetricCard
│   │   └── ...
│   ├── StatusDistributionChart (子組件)
│   ├── SalesAmountTrend (子組件)
│   └── PersonnelRanking (子組件)
```

---

## 六、數據共用策略

### 6.1 現狀

- `SalesControlSystem.vue` 已透過 `useSalesDataStore()` 獲取：
  - `salesDataStore.getProjectData(projectId)` 
  - 回傳: `{ project, parameters, households, parkings, personnel, images }`

### 6.2 優化方案

**方案 A: 擴展 `useSalesDataStore` (推薦)**

在 `salesDataStore.js` 中新增 computed 方法：

```javascript
// 新增計算方法
const getAnalyticsData = (projectId, period = 'month') => {
  const projectData = getProjectData(projectId)
  return {
    households: projectData.households,
    parkings: projectData.parkings,
    personnel: projectData.personnel,
    parameters: projectData.parameters,
    // ...
  }
}

const getStatistics = (projectId, period = 'month') => {
  const data = getAnalyticsData(projectId, period)
  const dateRange = getDateRange(period)
  
  return {
    households: calculateHouseholdStats(data.households, dateRange),
    parkings: calculateParkingStats(data.parkings, dateRange),
    personnel: calculatePersonnelStats(data.households, data.parkings, data.personnel, dateRange),
  }
}
```

**優點**：
- 复用現有緩存機制
- 統計邏輯集中管理
- 單一數據源，避免重複計算

### 6.3 計算邏輯獨立模塊

新增文件：`src/utils/analyticsCalculations.js`

```javascript
/**
 * 計算戶別統計
 */
export const calculateHouseholdStats = (households, dateRange) => {
  return {
    total: households.length,
    byStatus: groupByStatus(households),
    unsold: households.filter(h => !h.salesStatus_backend).length,
    // ...
  }
}

/**
 * 計算車位統計
 */
export const calculateParkingStats = (parkings, dateRange) => {
  const assigned = parkings.filter(p => p.buyerUnitId)
  return {
    total: parkings.length,
    sold: assigned.length,
    unsold: parkings.length - assigned.length,
  }
}

/**
 * 計算銷售人員統計
 */
export const calculatePersonnelStats = (households, parkings, personnel, dateRange) => {
  return personnel.map(person => ({
    name: person.name,
    soldCount: countSoldByPerson(households, person.name, dateRange),
    totalAmount: calculatePersonTotalAmount(households, parkings, person.name, dateRange),
    premiumAmount: calculatePersonPremium(households, parkings, person.name, dateRange),
  }))
  .sort((a, b) => b.totalAmount - a.totalAmount) // 按金額降序
}
```

---

## 七、技術實現細節

### 7.1 趨勢圖表 (Line Chart)

**數據準備**: 按日期分組統計

```javascript
// 本月銷售趨勢 (按日)
const getDailySalesData = (households, parkings, period) => {
  const dateMap = new Map()
  
  households.forEach(h => {
    if (!h.payment_contract_date) return
    const date = new Date(h.payment_contract_date).toISOString().split('T')[0]
    if (!isInDateRange(date, period)) return
    
    if (!dateMap.has(date)) dateMap.set(date, [])
    dateMap.get(date).push(h)
  })
  
  return Array.from(dateMap.entries())
    .sort(([d1], [d2]) => new Date(d1) - new Date(d2))
    .map(([date, units]) => ({
      date,
      amount: calculateTotalAmount(units, parkings),
      count: units.length,
    }))
}
```

**圖表庫**: 使用 `Chart.js` + `vue-chartjs`

### 7.2 狀態分布圖

**圖表類型**: Pie / Donut

```javascript
const getStatusDistribution = (households) => {
  const grouped = groupByStatus(households)
  return {
    labels: Object.keys(grouped),
    datasets: [{
      data: Object.values(grouped),
      backgroundColor: [...] // 來自 statusColorStore
    }]
  }
}
```

### 7.3 銷售人員排行

**排序**: 按 totalAmount 降序  
**顯示**: 全部人員  
**可選功能**: 
- 搜索 / 篩選人員
- 點擊人員查看詳細成交記錄

---

## 八、狀態管理

### 8.1 AnalyticsPanel 內部狀態

```javascript
const selectedPeriod = ref('month') // 'today' | 'week' | 'month'
const analyticsData = ref(null)
const isLoading = ref(false)

const statistics = computed(() => {
  return analyticsStore.getStatistics(projectId, selectedPeriod.value)
})

const dailyTrend = computed(() => {
  return analyticsStore.getDailySalesData(projectId, selectedPeriod.value)
})

watch(selectedPeriod, async (newPeriod) => {
  isLoading.value = true
  // 重新計算（由於 computed 自動依賴，實際上不需要 watch）
  isLoading.value = false
})
```

---

## 九、API 集成

**無需新增 API**：所有數據來自現有的 `listenToSalesControlData`

**數據流**:
```
Firestore
    ↓
useSalesDataStore (緩存)
    ↓
useAnalyticsStore (統計計算)
    ↓
AnalyticsPanel.vue (UI 展示)
```

---

## 十、測試用例

| 測試項目 | 預期結果 |
|---------|---------|
| 未售戶數 = 總戶數 - 各狀態戶數 | ✅ 驗證 |
| 車位已售數 + 未售數 = 總車位數 | ✅ 驗證 |
| 個人成交金額 = ∑(房價 + 車位價 + 溢差價) | ✅ 驗證 |
| 時間粒度切換無誤 | ✅ 驗證 |
| 圖表渲染正確 | ✅ 驗證 |
| 行動裝置響應式 | ✅ 驗證 |

---

## 十一、實現順序

1. **Phase 1**: 建立 `useAnalyticsStore()` + 計算函數
2. **Phase 2**: 新建 `AnalyticsPanel.vue` 及子組件架構
3. **Phase 3**: 實現 MetricsCards (關鍵數字卡片)
4. **Phase 4**: 實現 StatusDistributionChart (Pie 圖)
5. **Phase 5**: 實現 SalesAmountTrend (Line 圖)
6. **Phase 6**: 實現 PersonnelRanking (表格)
7. **Phase 7**: 集成到 SalesControlSystem.vue，添加工具欄按鈕
8. **Phase 8**: 測試 + 優化

---

## 十二、後續優化空間

- [ ] 匯出分析報告 (PDF / Excel)
- [ ] 按銷售人員篩選統計
- [ ] 按戶別類型篩選 (住家/店面)
- [ ] 對比分析 (月 vs 月、週 vs 週)
- [ ] 預測未來銷售 (AI)
- [ ] 車位銷售效率分析

---

