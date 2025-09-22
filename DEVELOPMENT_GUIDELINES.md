# 開發規範與架構指南 (Development Guidelines & Architecture)

本文件旨在記錄專案的核心架構決策與開發規範，以確保程式碼的一致性、可維護性，並加速未來的功能開發。

## 核心原則

### 1. 專案 ID (`projectId`) 處理原則

系統的核心原則是：**前端全權負責 `projectId` 的管理與傳遞，後端完全信賴前端提供的 `projectId`。**

#### Frontend (前端) 職責

1.  **單一真實來源 (Single Source of Truth)**：
    *   `src/store/projectStore.js` 是管理所有專案資訊的唯一來源。
    *   應用程式啟動時，`projectStore` 會從 Firestore 獲取專案列表，並建立 `nameToIdMap` (名稱對應 ID) 和 `idToNameMap` (ID 對應名稱) 的映射表。

2.  **從路由獲取 `projectId`**：
    *   所有與特定專案相關的頁面，都應從 URL 路由參數中獲取 `projectId` (例如 `/sales/fuyu1750` 中的 `fuyu1750`)。

3.  **顯示名稱**：
    *   當需要在介面上顯示專案的中文名稱時，應使用 `projectStore` 中的 `idToNameMap` 進行轉換。

4.  **API 呼叫**：
    *   所有需要與後端互動的 API 請求 (例如呼叫 Cloud Function)，**必須**明確地將 `projectId` 作為參數傳遞。

#### Backend (後端) 職責

1.  **信賴前端**：
    *   Cloud Function **不應**包含任何從專案名稱 (`projectName`) 轉換到 `projectId` 的邏輯（例如 `projectNameToIdMap`）。

2.  **強制參數**：
    *   Cloud Function 應將 `projectId` 視為必要參數。如果請求中缺少 `projectId`，應立即拋出 `invalid-argument` 錯誤，以強制前端遵循規範。

3.  **直接使用**：
    *   後端應直接使用前端傳遞過來的 `projectId` 來執行所有資料庫操作（例如查詢、更新、建立文件 ID）。

---

## 2. 車位平面圖管理系統 (Parking Floor Plan Management System)

### 系統概述

車位平面圖管理系統是一個完整的視覺化車位管理解決方案，提供直覺的拖拉式編輯界面、即時協作功能、以及專業的匯出列印功能。

### 技術架構

#### 前端技術棧
- **Framework**: Vue.js 3 + Composition API
- **UI Library**: Vuetify 3 (Material Design)
- **Canvas Library**: Fabric.js (互動式圖形編輯)
- **Icons**: Material Design Icons (MDI)
- **State Management**: Pinia
- **Routing**: Vue Router 4

#### 後端技術棧
- **Backend**: Firebase Cloud Functions
- **Database**: Firestore (即時資料庫)
- **Storage**: Firebase Storage (圖片儲存)
- **Authentication**: Firebase Auth
- **Real-time Sync**: Firestore onSnapshot listeners

#### 核心組件架構

```
src/views/ParkingFloorplanManager.vue    # 主管理界面
├── src/components/ParkingCanvas.vue      # Fabric.js 畫布組件
├── src/components/StyleEditor.vue       # 樣式編輯器
└── src/components/FloorManager.vue      # 樓層管理組件
```

### 資料庫結構


### Cloud Functions API

#### 1. 平面圖管理 API

```javascript
// 獲取專案的所有平面圖
exports.getFloorPlans = functions.https.onCall(async (data, context) => {
  const { projectId } = data;
  // 返回平面圖列表
});

// 創建新平面圖
exports.createFloorPlan = functions.https.onCall(async (data, context) => {
  const { projectId, name, description, isActive } = data;
  // 創建並返回新平面圖資料
});

// 更新平面圖
exports.updateFloorPlan = functions.https.onCall(async (data, context) => {
  const { floorPlanId, projectId, ...updateData } = data;
  // 更新並返回平面圖資料
});

// 刪除平面圖
exports.deleteFloorPlan = functions.https.onCall(async (data, context) => {
  const { floorPlanId, projectId } = data;
  // 刪除平面圖及相關資料
});
```


```

### 前端開發規範

#### 1. 組件設計原則

- **單一職責**: 每個組件只負責一個特定功能
- **可重用性**: 組件應該能在不同場景下重複使用
- **props 驗證**: 所有 props 都應該有類型驗證和預設值
- **事件命名**: 使用 kebab-case 命名自定義事件


#### 3. 圖示使用規範

**統一使用 Material Design Icons (MDI)**

| 功能 | MDI 圖示 | 舊 FA 圖示 |
|------|----------|------------|
| 新增 | `mdi-plus` | `fas fa-plus` |
| 編輯 | `mdi-pencil` | `fas fa-edit` |
| 刪除 | `mdi-delete` | `fas fa-trash` |
| 儲存 | `mdi-content-save` | `fas fa-save` |
| 重新整理 | `mdi-refresh` | `fas fa-sync-alt` |
| 檢視 | `mdi-eye` | `fas fa-eye` |
| 下載 | `mdi-download` | `fas fa-download` |
| 列印 | `mdi-printer` | `fas fa-print` |
| 圖片 | `mdi-image` | `fas fa-image` |
| PDF | `mdi-file-pdf-box` | `fas fa-file-pdf` |
| 網格 | `mdi-grid` | `fas fa-th` |
| 樣式 | `mdi-palette` | `fas fa-palette` |
| 關閉 | `mdi-close` | `fas fa-times` |


### 效能優化指南

#### 1. Canvas 渲染優化

- 使用 `requestAnimationFrame` 控制渲染頻率
- 實作物件快取機制
- 避免頻繁的 `renderAll()` 呼叫

#### 2. 即時同步優化

- 使用 debounce 控制儲存頻率
- 實作樂觀更新策略
- 處理網路斷線情況

#### 3. 記憶體管理

- 及時清理 Canvas 物件
- 取消訂閱 Firestore 監聽器
- 清理事件監聽器

### 測試策略

#### 1. 單元測試

- 測試 Fabric.js 物件創建
- 測試 API 呼叫函數
- 測試狀態管理邏輯

#### 2. 整合測試

- 測試即時同步功能
- 測試多使用者協作
- 測試匯出功能

#### 3. E2E 測試

- 測試完整的使用者流程
- 測試跨瀏覽器相容性
- 測試響應式設計

### 部署與維護

#### 1. Cloud Functions 部署

```bash
# 部署所有函數
firebase deploy --only functions

# 部署特定函數
firebase deploy --only functions:getFloorPlans
```

#### 2. 前端部署

```bash
# 建置生產版本
npm run build

# 部署到 Firebase Hosting
firebase deploy --only hosting
```

#### 3. 監控與日誌

- 使用 Firebase Performance Monitoring
- 設置 Cloud Functions 日誌監控
- 實作錯誤追蹤機制
