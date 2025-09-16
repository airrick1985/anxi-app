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
