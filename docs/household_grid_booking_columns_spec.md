# 戶別資料總表：預約項目欄位擴充規格

## 1. 需求概述

在 **HouseholdGrid.vue**（戶別資料總表）中，針對專案設定中每一個**預約項目**（來自 `projectConfig.bookingMenu`），動態新增以下三個唯讀欄位：

| 欄位名稱格式          | 資料來源 (appointments)    | 範例（預約項目=對保）            |
|-----------------------|---------------------------|--------------------------------|
| `{項目名}(預約日期)`   | `appointmentDate`         | 對保(預約日期) → 2026/04/01    |
| `{項目名}(時段)`      | `appointmentTimeSlot`     | 對保(時段) → 09:00             |
| `{項目名}(選擇方式)`   | `inspectionMethod`        | 對保(選擇方式) → 台灣銀行      |

- 若該預約項目有子選項 (`bookingSubOption`)，選擇方式欄位應顯示完整路徑，例如：`需貸款-台灣銀行`。
- 欄位為 **唯讀**（`editable: false`），僅供檢視。

---

## 2. 資料過濾條件

只顯示 **有效預約** 的資料。須排除以下狀態的 appointment 文件：

| 排除條件                | 說明                                      |
|------------------------|------------------------------------------|
| `status === "已取消"`   | 使用者或管理員已取消的預約                   |
| `status === "取消"`     | 系統取消的預約                              |
| 文件已被刪除（不存在）    | 已從 Firestore 中被移除的文件               |

**有效狀態**：`status === "預約中"` 或 `status === "已完成"` 的預約文件。

---

## 3. 資料來源與匹配邏輯

### 3.1 資料源
- **Collection**: `appointments`
- **查詢條件**:
  - `projectId == 當前專案 ID`
  - `unitId == 該戶別的 unitId`
  - `status != "取消"` (Firestore `!=` 查詢會同時排除 "已取消" 和 "取消")

### 3.2 匹配邏輯
- 每個戶別 × 每個預約項目，取 **最新一筆有效預約**（依 `appointmentDate` 降冪排序取第一筆）。
- 若同一戶別對同一預約項目有多筆有效預約（`allowMultipleBookings = true`），仍只顯示最新一筆。

---

## 4. 實作方案

### 方案選擇：前端即時查詢（推薦）

#### 理由
- 現有的 `updateHouseholdBookingSummary` Cloud Function 僅處理「初驗」和「複驗」兩種硬編碼類型，擴充到所有動態預約項目需修改後端。
- 但為保持一致性與即時性，**建議採用前端方案**：在 HouseholdGrid 載入時，額外監聽 appointments 集合，將預約資料合併到 rowData 中。

### 4.1 資料載入流程

```
HouseholdGrid onMounted
  ├── listenToAllHouseholds()        ← 既有：監聽 households 集合
  ├── listenToFieldDefinitions()     ← 既有：監聽自訂欄位定義
  └── [新增] listenToAppointments()  ← 新增：監聽 appointments 集合
```

#### `listenToAppointments()` 邏輯
1. 查詢 `appointments` 集合，條件：
   - `projectId == 當前專案 ID`
   - `status` 為 "預約中" 或 "已完成"
2. 使用 `onSnapshot` 即時監聽。
3. 將結果按 `unitId` + `bookingType` 分組，每組取 `appointmentDate` 最新的一筆。
4. 建立一個 Map：`appointmentMap[unitId][bookingType] = { date, timeSlot, method }`。
5. 當 appointments 或 households 資料更新時，合併資料到 `rowData`。

### 4.2 欄位定義生成

在 `dynamicColDefs` computed 中，於現有的 `_customBatchCols` 邏輯之後，新增 **預約資訊欄位**：

```javascript
// 根據 bookingMenu 動態產生預約資訊欄位
const _bookingInfoCols = [];
if (projectConfig.value) {
  let availableTypes = [];
  if (Array.isArray(projectConfig.value.bookingMenu) && projectConfig.value.bookingMenu.length > 0) {
    availableTypes = projectConfig.value.bookingMenu.map(item => item.title);
  }

  availableTypes.forEach(type => {
    // 預約日期欄位
    _bookingInfoCols.push({
      headerName: `${type}(預約日期)`,
      field: `_booking_${type}_date`,
      width: 140,
      editable: false,
      valueGetter: params => {
        return params.data?._bookingInfo?.[type]?.date || '';
      },
      valueFormatter: dateFormatter, // 使用既有的 dateFormatter
      filter: 'agDateColumnFilter',
    });

    // 時段欄位
    _bookingInfoCols.push({
      headerName: `${type}(時段)`,
      field: `_booking_${type}_timeSlot`,
      width: 120,
      editable: false,
      valueGetter: params => {
        return params.data?._bookingInfo?.[type]?.timeSlot || '';
      },
    });

    // 選擇方式欄位
    _bookingInfoCols.push({
      headerName: `${type}(選擇方式)`,
      field: `_booking_${type}_method`,
      width: 160,
      editable: false,
      valueGetter: params => {
        return params.data?._bookingInfo?.[type]?.method || '';
      },
    });
  });
}
```

### 4.3 資料合併

```javascript
// 將 appointments 資料合併至 rowData
const mergedRowData = computed(() => {
  return rawHouseholds.value.map(household => {
    const unitBookings = appointmentMap.value[household.unitId] || {};
    return {
      ...household,
      _bookingInfo: unitBookings  // 掛載在 _bookingInfo 命名空間，避免欄位衝突
    };
  });
});
```

### 4.4 選擇方式顯示邏輯

```javascript
// 組合選擇方式的顯示文字
function formatMethod(appointment) {
  const method = appointment.inspectionMethod || '';
  const subOption = appointment.bookingSubOption || '';
  if (subOption) {
    return `${method}-${subOption}`;
  }
  return method;
}
```

---

## 5. 欄位插入位置

新增的預約資訊欄位應插入在 **批次欄位之後**、**報告上傳開關之前**。

最終欄位順序：
```
... 基礎欄位 ...
├── 初驗批次、初驗日期、初驗方式     ← 既有
├── 複驗批次、複驗日期、複驗方式     ← 既有
├── [自訂批次欄位]                   ← 既有動態欄位
├── [預約資訊欄位] ← 新增          
│   ├── 對保(預約日期)
│   ├── 對保(時段)
│   ├── 對保(選擇方式)
│   ├── 驗屋(預約日期)
│   ├── 驗屋(時段)
│   ├── 驗屋(選擇方式)
│   └── ...（其他預約項目）
├── [自訂欄位]                       ← 既有動態欄位
├── 初驗報告上傳開關                  ← 既有
├── 複驗報告上傳開關                  ← 既有
└── ... 其他欄位 ...
```

---

## 6. Excel 匯出支援

新增的欄位應自動包含在 Excel 匯出中：
- `finalColDefs` 已被匯出邏輯使用（`exportFields` 和 `chineseHeaders`），動態欄位會自動被納入。
- 日期欄位匯出時需格式化為 `YYYY/MM/DD` 字串（避免 Excel 時間戳問題）。

---

## 7. 效能考量

| 項目                  | 方案                                          |
|----------------------|----------------------------------------------|
| 查詢範圍              | 只查 status="預約中" 的文件，減少資料量          |
| 監聽方式              | 使用 `onSnapshot` 即時同步，無需手動刷新         |
| 資料結構              | 使用 Map 索引 (unitId → bookingType → data)   |
| 記憶體                | appointments 數據掛載在 `_bookingInfo` 命名空間  |
| 卸載                  | `onUnmounted` 時取消 appointments 監聽器        |

---

## 8. 影響範圍

| 檔案                              | 變更內容                                    |
|-----------------------------------|-------------------------------------------|
| `src/views/HouseholdGrid.vue`     | 新增 appointments 監聯、動態欄位、資料合併     |
| `src/api.js`                      | 新增 `listenToAppointments` API 函式（若需要）|
| `functions/index.js`              | 本階段不需修改                               |

---

## 9. 驗收標準

1. 戶別資料總表中，依照專案 bookingMenu 設定，動態顯示每個預約項目的三個欄位。
2. 欄位僅顯示 `status === "預約中"` 或 `status === "已完成"` 的有效預約資料。
3. 同一戶別同一預約項目有多筆有效預約時，顯示最新一筆。
4. 預約被取消後，欄位即時更新（透過 onSnapshot）。
5. 選擇方式含子選項時，顯示格式為 `{方式}-{子選項}`（無空格）。
6. 所有新增欄位可正常匯出至 Excel。
7. 新增欄位為唯讀，不可編輯。
