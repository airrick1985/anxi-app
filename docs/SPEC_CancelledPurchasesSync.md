# 功能 Spec：退戶同步至 Google Sheet

**版本**: 1.0  
**建立日期**: 2026-04-13  
**狀態**: 待實施

---

## 1. 功能概述

### 1.1 目標
新增「退戶同步」功能，允許使用者將當前 **projectId** 下的所有退戶（cancelledPurchases 集合中的文件）同步至指定的 Google Sheet，用於追蹤和分析取消交易資料。

### 1.2 使用情景
- 建案銷售團隊需要追蹤已取消的購案資訊
- 統計分析取消原因、取消率
- 導出取消購案資料進行後續跟進
- 與其他系統（CRM、BI工具）集成

### 1.3 與現有功能的關係
- 遵循與「銷控資料同步」（Google Sheet 同步銷控資料）相同的使用者流程
- 使用相同的 Google Sheets API 整合方式
- 類似的配置儲存機制（project 文檔中新增欄位）

---

## 2. 使用者介面 (UI)

### 2.1 頁面位置
在 `SalesSettings.vue` 的 Tab 導航中新增一個新 Tab：
- 位置：在「Google Sheet 同步銷控資料」Tab 之後
- Icon: `mdi-delete-restore` (或 `mdi-close-circle`)
- 標籤: `Google Sheet 同步退戶`

### 2.2 Tab 結構

```
<v-tab value="cancelledSync">
  <v-icon start>mdi-delete-restore</v-icon>
  Google Sheet 同步退戶
</v-tab>

<v-window-item value="cancelledSync">
  <!-- 同步功能界面 -->
</v-window-item>
```

### 2.3 功能區塊設計

#### 2.3.1 標題和說明
```
【卡片標題】退戶同步
【副標題】同步退戶資料至 Google Sheet。系統將自動監聽資料變更並即時更新。
```

#### 2.3.2 Google Sheet 配置區塊
```
┌─────────────────────────────────────────────────────────┐
│ 第一步：Google Sheet 配置                                 │
├─────────────────────────────────────────────────────────┤
│ [Google Sheet 網址或 ID           ] [讀取工作表] 按鈕    │
│ 說明: https://docs.google.com/spreadsheets/d/...       │
│                                                         │
│ ℹ️ 提示訊息 (如果已設定 Service Account):               │
│ 請共用權限給機器人                                       │
│ 為了讓系統能寫入資料，請將您的 Google Sheet 共用給:       │
│ [service-account@example.com] [複製]                   │
└─────────────────────────────────────────────────────────┘
```

#### 2.3.3 工作表選擇區塊
```
┌─────────────────────────────────────────────────────────┐
│ 第二步：選擇目標工作表                                    │
├─────────────────────────────────────────────────────────┤
│ [下拉選單 - 選擇要同步的工作表 (Tab)]                     │
│ (在讀取工作表後展開)                                     │
└─────────────────────────────────────────────────────────┘
```

#### 2.3.4 同步執行區塊
```
┌─────────────────────────────────────────────────────────┐
│ 第三步：同步退戶                                    │
├─────────────────────────────────────────────────────────┤
│ [開始全量同步與儲存設定] 按鈕 (加載狀態、禁用邏輯)       │
│                                                         │
│ ℹ️ 資訊區:                                              │
│ 同步範圍：當前專案 (projectId: fuyu650) 的所有退戶  │
│ - 將包含的欄位見下方「資料欄位對應」                       │
│ - 自動監聽新增/修改/刪除，實時更新                       │
│                                                         │
│ 狀態訊息區 (同步後顯示):                                 │
│ ✓ 同步成功: 已同步 X 筆退戶資料                     │
│ ✗ 同步失敗: 錯誤訊息                                    │
└─────────────────────────────────────────────────────────┘
```

### 2.4 互動流程

```
1. 使用者進入「Google Sheet 同步退戶」Tab
   ↓
2. 輸入 Google Sheet 網址/ID
   ↓
3. 點擊「讀取工作表」
   ↓ 
   ├─ API 呼叫: listGoogleSheets()
   ├─ 返回可用工作表列表
   └─ 顯示 Service Account Email (要求共用權限)
   ↓
4. 在下拉選單選擇目標工作表
   ↓
5. 點擊「開始全量同步與儲存設定」
   ↓
   ├─ API 呼叫: syncCancelledPurchasesToSheet()
   ├─ 後端查詢當前 projectId 的所有 cancelledPurchases
   ├─ 轉換資料格式並寫入 Google Sheet
   ├─ 更新 project.cancelledSyncConfig
   └─ 返回同步結果
   ↓
6. 顯示成功/失敗訊息
   ↓
7. (配置完成後) 系統自動監聽 cancelledPurchases 變更
   └─ 新增/修改/刪除時自動更新 Google Sheet
```

---

## 3. 資料結構

### 3.1 Firestore 資料來源: cancelledPurchases Collection

**來源**: `/projects/{projectId}/cancelledPurchases/{docId}`

**文件結構**（基於現有資料）:

```javascript
{
  // 元資料
  id: "fuyu650_A5-2",
  projectId: "fuyu650",
  
  // 取消相關資訊
  _cancellationMeta: {
    cancellationDate: Timestamp,    // 取消日期時間
    lastEditedAt: Timestamp,         // 最後編輯時間
    lastEditedBy: String,            // 編輯者名稱
    operatorName: String,            // 操作人員名稱
    originalDocId: String            // 原始單據號 (單位ID)
  },
  
  // 軟刪除標記
  _isDeleted: Boolean,
  _deletedMeta?: {
    deletedAt: Timestamp,
    deletedBy: String
  },
  
  // 基本資訊
  unitId: "A5-2",                   // 單位編號
  building: "A5",                   // 棟別
  floor: Number,                    // 樓層
  layout: "3房2衛",                 // 格局
  propertyType: "住家",             // 物業類型
  
  // 坪數及面積
  area_house_sqm: Number,           // 室內面積 (平方米)
  area_house_ping: Number,          // 室內面積 (坪)
  area_terrace_sqm: Number,         // 露臺面積 (平方米)
  area_terrace_ping: Number,        // 露臺面積 (坪)
  area_ancillary_sqm: Number,       // 附屬空間面積 (平方米)
  area_ancillary_ping: Number,      // 附屬空間面積 (坪)
  area_common_sqm: Number,          // 公設面積 (平方米)
  area_common_ping: Number,         // 公設面積 (坪)
  common_area_ratio: Number,        // 公設比
  land_share_ping: Number,          // 土地持分 (坪)
  land_share_ratio: Number,         // 土地持分比
  land_share_sqm: Number,           // 土地持分 (平方米)
  
  // 買方資訊
  buyerName: String,                // 買方姓名
  buyerIdNumber: String,            // 身分證號
  buyerPhone: String,               // 電話
  buyerEmail: String,               // 電子信箱
  buyerDateOfBirth: String,         // 生日
  buyerGender: String,              // 性別
  buyerMaritalStatus: String,       // 婚姻狀況
  isFirstTimeBuyer: Boolean,        // 首購
  buyerPermanentAddressCity: String,
  buyerPermanentAddressDistrict: String,
  buyerPermanentAddressDetail: String,
  buyerMailingAddressCity: String,
  buyerMailingAddressDistrict: String,
  buyerMailingAddressDetail: String,
  buyerOccupationIndustry: String,  // 職業產業
  buyerOccupationTitle: String,     // 職位
  buyerPurchasePurpose: String,     // 購買目的
  buyerEmergencyContactName: String,
  buyerEmergencyContactPhone: String,
  buyerEmergencyContactRelationship: String,
  buyerHasPurchasedFuyu: Boolean,   // 是否曾購買本建案
  
  // 價格資訊
  price_list_house_total: Number,   // 列價(含車位)
  price_list_house_only: Number,    // 列價(不含車位)
  price_list_ancillary: Number,     // 列價(附屬)
  price_list_terrace: Number,       // 列價(露臺)
  price_floor_house_total: Number,  // 底價(含車位)
  price_floor_house_only: Number,   // 底價(不含車位)
  price_floor_ancillary: Number,    // 底價(附屬)
  price_floor_terrace: Number,      // 底價(露臺)
  price_transaction_house: Number,  // 成交價(不含車位)
  price_transaction_total: Number,  // 成交價(含車位)
  price_diff: Number,               // 價差
  parking_floor_total: Number,      // 車位底價
  parking_trans_total: Number,      // 車位成交價
  quote_mode_total_price: Number,   // 報價模式總價
  
  // 取消原因
  cancelReasons: [String],          // 取消原因陣列 (如: ["換戶"])
  
  // 銷售狀態
  status: String,                   // 狀態 (如: "補足")
  salesStatus_backend: String,      // 後台銷售狀態
  salesStatus_quote: String,        // 報價狀態
  
  // 銷售人員
  salesperson: String,              // 銷售人員名稱
  referrerName: String,             // 介紹人名稱
  referrerPhone: String,            // 介紹人電話
  remarks: String,                  // 備註
  
  // 合約資訊
  contractType: String,             // 合約類型 (如: "一般合約")
  
  // 款項相關
  payment_deposit_date: Timestamp,
  payment_deposit_amount: Number,
  payment_complete_date: String,
  payment_contract_date: String,
  payment_contract_amount: Number,
  payment_supplement_date: String,
  payment_supplement_amount: Number,
  
  // 銀行帳戶資訊
  houseBankName: String,
  houseBankAccountName: String,
  houseBankAccount: String,
  landBankName: String,
  landBankAccountName: String,
  landBankAccount: String,
  packageBankName: String,
  packageBankAccountName: String,
  packageBankAccount: String,
  
  // 車位資訊
  parkingData: [{
    spotId: String,               // 車位編號 (如: "B3-036")
    floor: String,                // 樓層 (如: "B3")
    number: String,               // 號碼 (如: "036")
    type: String,                 // 類型 (如: "自設")
    type2: String,                // 類型2 (如: "坡道平面")
    size: String,                 // 尺寸 (如: "600＊250")
    price_list: Number,           // 列價
    price_floor: Number,          // 底價
    price_transaction: Number,    // 成交價
    status: String,               // 狀態 (如: "已售")
    status_backend: String,       // 後台狀態
    buyerUnitId: String,
    buyerName: String,
    salesperson: String,
    remarks: String,
    updatedAt: Timestamp,
    projectId: String
  }],
  
  // 檔案和連結
  driveFolderUrl: String,           // Google Drive 資料夾連結
  salesImages: [String],            // 銷售圖片
  svgName: String,                  // SVG 圖片名稱
  
  // 其他資訊
  updatedAt: Timestamp,             // 最後更新時間
  isPreferredPayment: Boolean,      // 是否偏好付款方案
  constructionMethod: String        // 施工方法
}
```

### 3.2 Google Sheet 目標結構

**欄位對應** (推薦的欄位排列順序):

| 欄位標題 | 資料來源 | 資料類型 | 備註 |
|---------|---------|---------|------|
| 單位編號 | unitId | String | 如 A5-2 |
| 棟別 | building | String | 如 A5 |
| 樓層 | floor | Number | |
| 格局 | layout | String | 如 3房2衛 |
| 物業類型 | propertyType | String | |
| 室內面積(坪) | area_house_ping | Number | |
| 室內面積(m²) | area_house_sqm | Number | |
| 露臺面積(坪) | area_terrace_ping | Number | |
| 公設比 | common_area_ratio | Number | 百分比 |
| 列價(含車位) | price_list_house_total | Number | |
| 成交價(含車位) | price_transaction_total | Number | |
| 買方姓名 | buyerName | String | |
| 買方身分證號 | buyerIdNumber | String | |
| 買方電話 | buyerPhone | String | |
| 買方信箱 | buyerEmail | String | |
| 首購 | isFirstTimeBuyer | Boolean | |
| 銷售人員 | salesperson | String | |
| 取消日期 | _cancellationMeta.cancellationDate | Timestamp | 格式: YYYY-MM-DD HH:mm:ss |
| 取消原因 | cancelReasons | Array | 以逗號分隔的字串 |
| 操作人員 | _cancellationMeta.operatorName | String | |
| 最後編輯時間 | _cancellationMeta.lastEditedAt | Timestamp | |
| 原始單據號 | _cancellationMeta.originalDocId | String | |
| 備註 | remarks | String | |
| 介紹人 | referrerName | String | |

**備註**:
- 可根據實際需求調整欄位
- Timestamp 字段建議輸出為 `YYYY-MM-DD HH:mm:ss` 格式
- 陣列字段（如 cancelReasons、parkingData）轉換為字串格式（以逗號或分號分隔）
- 巢狀物件（如 parkingData）可選擇展開或簡化

---

## 4. 功能流程 (Flow)

### 4.1 初始化流程 (頁面加載)

```
頁面載入 SalesSettings.vue
  ↓
getProject() 取得專案資訊
  ↓
檢查 project.cancelledSyncConfig (如果存在)
  ├─ 存在: 回填 cancelledSyncForm (url, sheetName)
  └─ 不存在: 初始化空表單
  ↓
初始化狀態變數:
  - googleSheetForm (已有，無需更改)
  - loadingSheets (已有，無需更改)
  - sheetNames (已有，無需更改)
  - serviceAccountEmail (已有，無需更改)
  - isSyncing (已有，無需更改)
  - syncResult (已有，無需更改)
```

### 4.2 「讀取工作表」流程

```
使用者點擊「讀取工作表」按鈕
  ↓
fetchCancelledSheetNames()  [新增函式]
  ├─ 驗證 googleSheetForm.url 非空
  ├─ 設置 loadingSheets = true
  ├─ 呼叫 API: listGoogleSheets(url)
  │   └─ 後端整合 Google Sheets API
  │      └─ 讀取指定 Google Sheet 的工作表列表
  ├─ 返回: { status, sheetNames[], agentEmail }
  ├─ 存儲: sheetNames.value = res.sheetNames
  ├─ 存儲: serviceAccountEmail.value = res.agentEmail
  ├─ 顯示成功提示
  └─ 設置 loadingSheets = false
  
失敗情況:
  └─ 顯示錯誤訊息、清空 sheetNames
```

### 4.3 「開始全量同步與儲存設定」流程

```
使用者點擊同步按鈕
  ↓
executeCancelledSync()  [新增函式]
  ├─ 驗證表單 (url, sheetName 非空)
  ├─ 解析 spreadsheetId 從 URL 中
  ├─ 設置 isSyncing = true
  ├─ 組裝 Payload:
  │  {
  │    projectId,
  │    spreadsheetId,
  │    sheetName,
  │    range (optional): 可選範圍,
  │    headerRow (optional): 是否包含標題行
  │  }
  ├─ 呼叫 API: syncCancelledPurchasesToSheet(payload)
  │   └─ 後端 (Cloud Function):
  │      ├─ 查詢 /projects/{projectId}/cancelledPurchases 所有文件
  │      ├─ 轉換資料格式 (Firestore → 平面結構)
  │      ├─ 整合 Google Sheets API
  │      ├─ 清除舊資料或追加 (依據配置)
  │      ├─ 寫入新資料到指定工作表
  │      ├─ 更新 projects/{projectId}.cancelledSyncConfig:
  │      │  {
  │      │    spreadsheetId,
  │      │    sheetName,
  │      │    sheetUrl,
  │      │    lastSyncAt: Timestamp,
  │      │    lastSyncBy: String,
  │      │    syncedCount: Number,
  │      │    status: "success"
  │      │  }
  │      └─ 返回: { status, message, syncedCount, ... }
  ├─ 更新前端狀態:
  │  ├─ project.value.cancelledSyncConfig = {...}
  │  ├─ googleSheetForm 資料保留
  ├─ 顯示成功訊息 (已同步 X 筆)
  └─ 設置 isSyncing = false

失敗情況:
  └─ 顯示錯誤訊息、保持 isSyncing = false
```

### 4.4 自動更新流程 (後端監聽)

```
配置完成後 (每當 cancelledPurchases 變更時):

Firestore Trigger: onWrite(/projects/{projectId}/cancelledPurchases/{docId})
  ↓
Cloud Function: onCancelledPurchasesChange()  [新增]
  ├─ 檢查 project.cancelledSyncConfig 是否存在
  ├─ 如果不存在，退出 (未配置同步)
  ├─ 提取 spreadsheetId, sheetName
  ├─ 判斷變更類型:
  │  ├─ Create: 新增一列
  │  ├─ Update: 更新對應列
  │  └─ Delete: 標記為已刪除 或 刪除列
  ├─ 轉換單一文件資料
  ├─ 整合 Google Sheets API
  ├─ 寫入/更新/刪除 Google Sheet 中的對應行
  └─ 記錄同步日誌
```

---

## 5. 技術實現

### 5.1 前端元件修改

**檔案**: `src/views/SalesSettings.vue`

#### 新增 Tab
```vue
<v-tab value="cancelledSync">
  <v-icon start>mdi-delete-restore</v-icon>
  Google Sheet 同步退戶
</v-tab>

<v-window-item value="cancelledSync">
  <!-- 同步功能界面 -->
  <v-card class="pa-4" elevation="2">
    <v-card-title>退戶同步</v-card-title>
    <!-- 同上述 UI 設計 -->
  </v-card>
</v-window-item>
```

#### 新增 State 變數
```javascript
// 如果需要獨立的表單 (推薦複用現有的 googleSheetForm 結構)
const cancelledSheetForm = reactive({
  url: '',
  sheetName: '',
});

// 同步結果訊息
const cancelledSyncResult = ref(null);
```

#### 新增方法
```javascript
// 讀取工作表
const fetchCancelledSheetNames = async () => {
  // 實現邏輯 (參考 fetchSheetNames)
};

// 執行同步
const executeCancelledSync = async () => {
  // 實現邏輯 (參考 executeSync)
  // 呼叫 syncCancelledPurchasesToSheet(payload)
};
```

#### 初始化邏輯 (loadProjectSettings)
```javascript
// 在現有的 project 初始化中，新增:
if (project.value.cancelledSyncConfig) {
  cancelledSheetForm.url = project.value.cancelledSyncConfig.sheetUrl;
  cancelledSheetForm.sheetName = project.value.cancelledSyncConfig.sheetName;
}
```

### 5.2 API 層修改

**檔案**: `src/api/firebaseService.js` (或相應的 API 模組)

#### 新增 API 呼叫
```javascript
// 同步退戶到 Google Sheet
export const syncCancelledPurchasesToSheet = async (payload) => {
  // payload: {
  //   projectId,
  //   spreadsheetId,
  //   sheetName,
  //   range (optional),
  //   headerRow (optional)
  // }
  
  const response = await fetch('/api/sync-cancelled-purchases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  return response.json();
};
```

### 5.3 後端 (Cloud Functions)

**函式 1**: `syncCancelledPurchases`

```javascript
/**
 * 同步退戶到 Google Sheet
 * 觸發: POST /api/sync-cancelled-purchases
 */
exports.syncCancelledPurchases = functions.https.onCall(
  async (data, context) => {
    const { projectId, spreadsheetId, sheetName } = data;

    // 1. 認證檢查 (確保有權限)
    // 2. 驗證 projectId 和使用者權限

    // 3. 查詢 cancelledPurchases 資料
    const snapshot = await admin
      .firestore()
      .collection(`projects/${projectId}/cancelledPurchases`)
      .get();

    const documents = snapshot.docs.map(doc => doc.data());

    // 4. 轉換資料格式 (Firestore → 平面結構)
    const rows = transformCancelledPurchasesToSheetRows(documents);

    // 5. 整合 Google Sheets API 寫入
    const sheets = google.sheets({ version: 'v4', auth: getGoogleAuth() });
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${sheetName}'!A1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          // 標題行
          [
            '單位編號',
            '棟別',
            '樓層',
            '買方姓名',
            '取消日期',
            '取消原因',
            // ... 其他欄位
          ],
          // 資料行
          ...rows
        ]
      }
    });

    // 6. 更新 project 文檔
    await admin
      .firestore()
      .doc(`projects/${projectId}`)
      .update({
        'cancelledSyncConfig.spreadsheetId': spreadsheetId,
        'cancelledSyncConfig.sheetName': sheetName,
        'cancelledSyncConfig.sheetUrl': `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
        'cancelledSyncConfig.lastSyncAt': admin.firestore.FieldValue.serverTimestamp(),
        'cancelledSyncConfig.lastSyncBy': context.auth.uid,
        'cancelledSyncConfig.syncedCount': documents.length,
        'cancelledSyncConfig.status': 'success'
      });

    return {
      status: 'success',
      message: `已同步 ${documents.length} 筆退戶資料`,
      syncedCount: documents.length
    };
  }
);
```

**函式 2**: `onCancelledPurchasesChange` (自動更新監聽)

```javascript
/**
 * 監聽 cancelledPurchases 變更，自動同步到 Google Sheet
 * 觸發: Firestore 寫入 /projects/{projectId}/cancelledPurchases/{docId}
 */
exports.onCancelledPurchasesChange = functions.firestore
  .document('projects/{projectId}/cancelledPurchases/{docId}')
  .onWrite(async (change, context) => {
    const { projectId } = context.params;

    // 1. 檢查同步配置是否存在
    const projectDoc = await admin
      .firestore()
      .doc(`projects/${projectId}`)
      .get();

    if (!projectDoc.data().cancelledSyncConfig) {
      // 未配置同步，退出
      return;
    }

    const { spreadsheetId, sheetName } = projectDoc.data().cancelledSyncConfig;

    // 2. 判斷變更類型
    const newData = change.after.data();
    const oldData = change.before.data();

    if (!change.before.exists) {
      // 新增 (Create)
      // 新增一列到 Google Sheet
    } else if (!change.after.exists) {
      // 刪除 (Delete)
      // 刪除或標記 Google Sheet 中的對應行
    } else {
      // 修改 (Update)
      // 更新 Google Sheet 中的對應行
    }

    // 3. 轉換資料
    const row = transformCancelledPurchaseToSheetRow(newData);

    // 4. 寫入 Google Sheet
    const sheets = google.sheets({ version: 'v4', auth: getGoogleAuth() });

    // 根據 newData.id 尋找或新增行
    // (簡化版：每次整個重新寫入，或維護一個 index)

    // 5. 記錄日誌
    console.log(`Synced cancelled purchase: ${change.after.id}`);
  });
```

**輔助函式**: `transformCancelledPurchasesToSheetRows`

```javascript
function transformCancelledPurchasesToSheetRows(documents) {
  return documents.map(doc => [
    doc.unitId || '',                                    // 單位編號
    doc.building || '',                                  // 棟別
    doc.floor || '',                                     // 樓層
    doc.layout || '',                                    // 格局
    doc.propertyType || '',                              // 物業類型
    doc.area_house_ping || '',                           // 室內面積(坪)
    doc.area_house_sqm || '',                            // 室內面積(m²)
    doc.price_list_house_total || '',                    // 列價
    doc.price_transaction_total || '',                   // 成交價
    doc.buyerName || '',                                 // 買方姓名
    doc.buyerIdNumber || '',                             // 買方身分證號
    doc.buyerPhone || '',                                // 買方電話
    doc.isFirstTimeBuyer ? '是' : '否',                  // 首購
    doc.salesperson || '',                               // 銷售人員
    formatTimestamp(doc._cancellationMeta?.cancellationDate),  // 取消日期
    (doc.cancelReasons || []).join(', '),               // 取消原因
    doc._cancellationMeta?.operatorName || '',          // 操作人員
    doc.remarks || ''                                    // 備註
  ]);
}

function formatTimestamp(ts) {
  if (!ts) return '';
  const date = ts.toDate();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
}
```

### 5.4 Firestore 資料模型更新

**collection**: `projects/{projectId}`

新增欄位:
```javascript
{
  // ... 現有欄位 ...
  
  // 銷控資料同步設定 (現有)
  salesSheetId?: String,
  salesSheetTabName?: String,
  salesSheetUrl?: String,
  
  // 退戶同步設定 (新增)
  cancelledSyncConfig?: {
    spreadsheetId: String,        // Google Sheet ID
    sheetName: String,            // 工作表名稱
    sheetUrl: String,             // 完整 URL
    lastSyncAt: Timestamp,        // 最後同步時間
    lastSyncBy: String,           // 最後同步者 UID
    syncedCount: Number,          // 最後同步數量
    status: String                // "success" | "error"
  }
}
```

---

## 6. 視覺設計細節

### 6.1 Icon 和顏色配置
- Icon: `mdi-delete-restore` (復原圖示) 或 `mdi-close-circle` (取消圖示)
- 主題色: `text-orange-darken-2` 或 `text-red-darken-1` (與銷控藍色區分)
- 同步按鈕色: `color="success"` (綠色)

### 6.2 加載和禁用狀態
- 「讀取工作表」按鈕:
  - 禁用: `disabled` 當 URL 為空
  - 加載: `:loading="loadingSheets"`
  
- 「開始全量同步」按鈕:
  - 禁用: 當工作表未選擇
  - 加載: `:loading="isSyncing"`

### 6.3 響應式設計
- 手機 (xs): 單列佈局
- 平板 (md): 雙列 (URL 佔 8 格，按鈕佔 4 格)
- 桌機 (lg+): 同上或三列

---

## 7. 錯誤處理與失敗通知

### 7.0 統一通知框架（重要）

⚠️ **關鍵原則**：
- 只有當使用者已經**配置並啟用**了同步功能時，才發送失敗通知
- 若同步配置為空（用戶沒有設置 Google Sheet URL），則同步功能不啟動，**不發送通知**
- 兩個同步功能（銷控資料、退戶）共用同一套通知框架

**配置檢查邏輯**：

```javascript
// 銲控資料同步的配置檢查
const salesConfig = project.data().salesSheetId && project.data().salesSheetTabName;
if (!salesConfig) {
  return; // 未配置，不進行同步，也不發送通知
}

// 退戶同步的配置檢查
const cancelledConfig = project.data().cancelledSyncConfig?.spreadsheetId 
                        && project.data().cancelledSyncConfig?.sheetName;
if (!cancelledConfig) {
  return; // 未配置，不進行同步，也不發送通知
}
```

### 7.1 常見錯誤場景

| 錯誤 | 處理方式 | 發送通知 |
|-----|--------|--------|
| URL 格式錯誤 | 驗證並顯示「請輸入有效的 Google Sheet 網址」 | ✗ |
| 無法存取 Google Sheet | 檢查權限或提供診斷訊息 | ✓ |
| 工作表不存在 | 提示「選定的工作表已刪除，請重新選擇」 | ✗ |
| 資料轉換錯誤 | 記錄詳細錯誤日誌，顯示「同步失敗：資料格式錯誤」 | ✓ |
| Firestore 查詢失敗 | 顯示「無法讀取退戶資料」 | ✓ |
| Service Account 無權限 | 提示「機器人帳戶無編輯權限，請共用 Google Sheet」 | ✓ |
| Google Sheets API 配額超限 | 顯示「API 呼叫次數超限，請稍後再試」 | ✓ |
| 網路連線錯誤 | 顯示「連線失敗，請檢查網路連線」 | ✗ |

### 7.2 失敗通知機制

#### 7.2.1 通知觸發條件

同步失敗時（狀態碼為 PERMISSION_DENIED、QUOTA_EXCEEDED、FIRESTORE_ERROR、DATA_FORMAT_ERROR 等），自動發送通知郵件給以下使用者：

**收件人篩選邏輯**（聯集，滿足任一條件即可）:

```javascript
// 條件 A: 擁有該 projectId 的 "銷控系統" 權限的使用者
// userPermissions/{userKey}.permissions[projectId].systems 包含 "銷控系統"

// OR

// 條件 B: 角色為 "系統管理員" 或 "超級管理員" 的使用者  
// users/{userKey}.roles 包含 "系統管理員" 或 "超級管理員"
```

#### 7.2.2 收件人查詢實現

**查詢邏輯**:
```javascript
async function getFailureNotificationRecipients(projectId) {
  const recipients = new Map(); // 使用 Map 去重
  
  // 1️⃣ 查詢有該 projectId "銷控系統" 權限的使用者
  const permSnapshot = await db
    .collection('userPermissions')
    .where(`permissions.${projectId}.systems`, 'array-contains', '銷控系統')
    .get();

  permSnapshot.docs.forEach(doc => {
    recipients.set(doc.id, { userKey: doc.id, reason: 'sales_permission' });
  });

  // 2️⃣ 查詢擁有系統管理員角色的使用者
  const adminSnapshot = await db
    .collection('users')
    .where('roles', 'array-contains-any', ['系統管理員', '超級管理員'])
    .get();

  adminSnapshot.docs.forEach(doc => {
    if (!recipients.has(doc.id)) {
      recipients.set(doc.id, { userKey: doc.id, reason: 'admin_role' });
    }
  });

  // 3️⃣ 補充詳細資訊
  const result = [];
  for (const [userKey, _] of recipients) {
    const userDoc = await db.collection('users').doc(userKey).get();
    if (userDoc.exists && userDoc.data().email) {
      result.push({
        userKey,
        name: userDoc.data().name || userKey,
        email: userDoc.data().email,
        roles: userDoc.data().roles || []
      });
    }
  }
  
  return result;
}
```

#### 7.2.3 郵件內容

**郵件主旨**:
```
⚠️ [警告通知] {projectName} - 退戶同步失敗
```

**郵件內容重點**:
- 使用者個人化問候 (含名稱)
- 清晰的錯誤訊息和失敗時間
- 詳細的失敗原因 (errorMessage)
- 根據錯誤類型提供動態建議 (如何解決)
- 快速操作連結 (進入設定頁面)
- 補充提醒和聯絡資訊

**變數對照**:

| 變數 | 來源 | 範例 |
|-----|------|------|
| {projectName} | `projects/{projectId}.name` | 富裕 650 |
| {userName} | `users/{userKey}.name` | 陳文賢 |
| {errorMessage} | Cloud Function 錯誤訊息 | Permission denied: Service account lacks access |
| {failureTime} | 伺服器時間 | 2026-04-13 16:54:30 |
| {projectId} | 同步配置 | fuyu650 |
| {spreadsheetId} | 同步配置 | 1a2b3c4d5e6f... |
| {sheetName} | 同步配置 | 退戶 |
| {attemptedCount} | 查詢結果 | 25 |
| {serviceAccountEmail} | 環境變數 | service@project.iam.gserviceaccount.com |
| {systemLink} | 前端路由 | https://system.com/settings/sync-cancelled?projectId=fuyu650 |

#### 7.2.4 動態建議範例

根據 `errorCode` 動態生成解決建議：

```
PERMISSION_DENIED:
  ❌ 機器人帳戶無編輯權限
  → 請將 Google Sheet 共用給: {serviceAccountEmail} (編輯者權限)

QUOTA_EXCEEDED:
  ❌ API 配額超限
  → 請等待 24 小時後重試，或升級 Google Cloud 配額

SHEET_NOT_FOUND:
  ❌ 工作表不存在
  → 檢查工作表名稱，或在 Google Sheet 中新建相同名稱工作表

DATA_FORMAT_ERROR:
  ❌ 資料格式錯誤
  → 可能包含特殊字符或超長字段，請聯絡技術團隊

FIRESTORE_ERROR:
  ❌ 資料庫查詢失敗
  → 系統將自動重試，或請稍後手動重新嘗試
```

#### 7.2.5 郵件發送流程

```
同步失敗 (拋出例外)
  ↓
捕捉並記錄錯誤
  ↓
檢查是否需要發送通知 (根據 errorCode)
  ↓
如需通知，觸發: sendSyncFailureNotification()
  ├─ 查詢專案資訊 (projectName)
  ├─ 查詢收件人清單 (getFailureNotificationRecipients)
  ├─ 為每位收件人生成個性化郵件
  │  ├─ 填充變數
  │  ├─ 生成動態建議
  │  └─ 轉換為 HTML 格式
  ├─ 非同步發送郵件 (不阻塞主流程)
  │  └─ 失敗時重試 3 次 (指數退避)
  └─ 記錄發送結果到 Firestore
```

### 7.3 日誌記錄

```javascript
// 同步操作日誌
const syncLog = {
  timestamp: new Date().toISOString(),
  projectId,
  action: 'sync_cancelled_purchases',
  status: 'success' | 'error',
  syncedCount: Number,        // 成功同步筆數
  attemptedCount: Number,     // 嘗試同步筆數
  errorCode: String,          // 錯誤碼 (如: PERMISSION_DENIED)
  errorMessage: String,       // 詳細錯誤訊息
  spreadsheetId: String,
  sheetName: String,
  notificationSent: Boolean,  // 是否已發送失敗通知
  notificationRecipients: [String], // 通知收件人清單
  duration: Number            // 執行時間 (毫秒)
};

// 存儲到 Firestore
await db
  .collection(`projects/${projectId}/syncLogs`)
  .add(syncLog);
```

---

### 7.4 統一失敗通知實現（銷控資料同步 + 退戶同步）

此通知框架同時服務於：
- **銷控資料同步** (既有功能，需新增通知能力)
- **退戶同步** (新功能)

#### 7.4.1 共用的通知發送函數

```javascript
/**
 * 通知該專案的管理員和權限擁有者 - 同步失敗
 * 
 * @param {string} projectId - 建案 ID
 * @param {string} syncType - 同步類型: 'sales' (銷控資料) | 'cancelled' (退戶)
 * @param {string} errorCode - 錯誤代碼: PERMISSION_DENIED, QUOTA_EXCEEDED, etc.
 * @param {string} errorMessage - 詳細錯誤訊息
 * @param {object} details - 額外詳情: { spreadsheetId, sheetName, attemptedCount, ... }
 */
async function sendSyncFailureNotification(
  projectId,
  syncType,
  errorCode,
  errorMessage,
  details = {}
) {
  const db = new Firestore({ databaseId: 'anxi-app' });
  const functionName = 'sendSyncFailureNotification';
  
  try {
    // 1️⃣ 檢查同步配置是否存在
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) return;
    
    const project = projectDoc.data();
    
    // 根據 syncType 檢查配置是否存在
    let hasConfig = false;
    if (syncType === 'sales') {
      // 銷控資料同步：檢查 salesSheetId 和 salesSheetTabName
      hasConfig = !!(project.salesSheetId && project.salesSheetTabName);
    } else if (syncType === 'cancelled') {
      // 退戶同步：檢查 cancelledSyncConfig
      hasConfig = !!(
        project.cancelledSyncConfig?.spreadsheetId 
        && project.cancelledSyncConfig?.sheetName
      );
    }
    
    // ⚠️ 關鍵：若未配置，則不發送通知
    if (!hasConfig) {
      console.log(`[${functionName}] ${syncType} 未配置，不發送通知`);
      return;
    }

    // 2️⃣ 查詢收件人清單
    const recipients = await getFailureNotificationRecipients(projectId);
    if (recipients.length === 0) {
      console.log(`[${functionName}] 找不到符合條件的收件人`);
      return;
    }

    // 3️⃣ 為每位收件人發送郵件（非同步，不阻塞主流程）
    const promises = recipients.map(recipient =>
      sendSyncFailureEmail(
        recipient,
        projectId,
        syncType,
        errorCode,
        errorMessage,
        details,
        project.name
      ).catch(err => {
        console.error(`[${functionName}] 發送郵件給 ${recipient.email} 失敗`, err);
      })
    );
    
    await Promise.allSettled(promises);

    // 4️⃣ 記錄通知日誌
    await db.collection(`projects/${projectId}/syncLogs`).add({
      timestamp: new Date().toISOString(),
      syncType,
      action: 'send_failure_notification',
      errorCode,
      errorMessage,
      recipientCount: recipients.length,
      recipientEmails: recipients.map(r => r.email),
      status: 'completed'
    });

    console.log(`[${functionName}] 成功發送 ${recipients.length} 封通知郵件`);
    
  } catch (error) {
    console.error(`[${functionName}] 發送通知時出錯`, error);
    // 不中斷主流程
  }
}

/**
 * 查詢應接收失敗通知的用戶
 * 條件聯集：
 * - (1) 擁有該 projectId 的 "銷控系統" 權限
 * - OR (2) 角色為 "系統管理員" 或 "超級管理員"
 */
async function getFailureNotificationRecipients(projectId) {
  const db = new Firestore({ databaseId: 'anxi-app' });
  const recipients = new Map();
  
  try {
    // 條件 A: 查詢擁有 "銷控系統" 權限的使用者
    const permSnapshot = await db
      .collection('userPermissions')
      .where(`permissions.${projectId}.systems`, 'array-contains', '銷控系統')
      .get();
    
    permSnapshot.forEach(doc => {
      recipients.set(doc.id, { userKey: doc.id, reason: 'sales_permission' });
    });

    // 條件 B: 查詢系統管理員和超級管理員
    const adminSnapshot = await db
      .collection('users')
      .where('roles', 'array-contains-any', ['系統管理員', '超級管理員'])
      .get();
    
    adminSnapshot.forEach(doc => {
      if (!recipients.has(doc.id)) {
        recipients.set(doc.id, { userKey: doc.id, reason: 'admin_role' });
      }
    });

    // 補充用戶詳細資訊 (name, email)
    const result = [];
    for (const [userKey, _] of recipients) {
      const userDoc = await db.collection('users').doc(userKey).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData.email) { // 只有有 email 才納入
          result.push({
            userKey,
            name: userData.name || userKey,
            email: userData.email,
            roles: userData.roles || []
          });
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('getFailureNotificationRecipients 錯誤', error);
    return [];
  }
}

/**
 * 發送郵件給單個收件人
 */
async function sendSyncFailureEmail(
  recipient,
  projectId,
  syncType,
  errorCode,
  errorMessage,
  details,
  projectName
) {
  const syncTypeDisplay = syncType === 'sales' ? '銷控資料' : '退戶';
  
  const subject = `⚠️ [警告通知] ${projectName} - ${syncTypeDisplay}同步失敗`;
  
  const htmlContent = generateFailureEmailHTML(
    recipient.name,
    projectName,
    syncType,
    errorCode,
    errorMessage,
    details
  );
  
  // 使用 nodemailer 發送
  const transporter = getEmailTransporter();
  
  await transporter.sendMail({
    from: process.env.SENDER_EMAIL,
    to: recipient.email,
    subject,
    html: htmlContent,
    replyTo: 'noreply@system.local'
  });
  
  return { success: true, email: recipient.email };
}

/**
 * 生成郵件 HTML 內容
 */
function generateFailureEmailHTML(
  userName,
  projectName,
  syncType,
  errorCode,
  errorMessage,
  details
) {
  const syncTypeDisplay = syncType === 'sales' ? '銷控資料' : '退戶';
  const suggestion = generateDynamicSuggestion(errorCode, details.serviceAccountEmail);
  
  return `
    <html>
      <body style="font-family: 'Microsoft JhengHei', Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #d32f2f 0%, #f44336 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">⚠️ 同步失敗警告</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px;">${syncTypeDisplay} Google Sheet 同步出現問題</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
            <p>尊敬的 <strong>${userName}</strong>，</p>
            <p>您好！您的專案「<strong>${projectName}</strong>」在同步${syncTypeDisplay}到 Google Sheet 時發生錯誤。</p>
            
            <div style="background: white; border-left: 4px solid #d32f2f; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #d32f2f;">❌ 錯誤詳情</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 8px; font-weight: bold; width: 100px;">失敗原因：</td>
                  <td style="padding: 8px; color: #d32f2f; word-break: break-word;">${errorMessage}</td>
                </tr>
                <tr style="background: #f5f5f5;">
                  <td style="padding: 8px; font-weight: bold;">失敗時間：</td>
                  <td style="padding: 8px;">${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">同步類型：</td>
                  <td style="padding: 8px;">${syncTypeDisplay}</td>
                </tr>
                <tr style="background: #f5f5f5;">
                  <td style="padding: 8px; font-weight: bold;">專案 ID：</td>
                  <td style="padding: 8px;">${projectId}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #e3f2fd; border-left: 4px solid #1976d2; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #1976d2;">💡 建議解決步驟</h3>
              <div style="font-size: 13px; line-height: 1.6;">
                ${suggestion}
              </div>
            </div>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 15px 0; border-radius: 4px; font-size: 12px;">
              <strong>📌 提醒：</strong> 若問題持續，請聯絡系統管理員。此為自動郵件，請勿回覆。
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * 根據錯誤代碼生成動態建議 HTML
 */
function generateDynamicSuggestion(errorCode, serviceAccountEmail) {
  const suggestions = {
    'PERMISSION_DENIED': `
      <p><strong>❌ 機器人帳戶無編輯權限</strong></p>
      <p>請將 Google Sheet 共用給此機器人帳戶（編輯者權限）：</p>
      <p style="background: #f5f5f5; padding: 8px; border-radius: 3px; font-family: monospace; word-break: break-all; margin: 10px 0;">
        ${serviceAccountEmail || 'service-account@project.iam.gserviceaccount.com'}
      </p>
    `,
    'QUOTA_EXCEEDED': `
      <p><strong>❌ Google Sheets API 配額超限</strong></p>
      <p>⏳ 請等待 24 小時後重試，或升級 Google Cloud 配額。</p>
    `,
    'SHEET_NOT_FOUND': `
      <p><strong>❌ 工作表不存在</strong></p>
      <p>指定的工作表在 Google Sheet 中不存在。請檢查工作表名稱，或在 Google Sheet 中新建相同名稱的工作表。</p>
    `,
    'FIRESTORE_ERROR': `
      <p><strong>❌ 資料庫查詢失敗</strong></p>
      <p>系統無法從資料庫讀取資料。⏳ 系統將自動重試，或請稍後手動重試同步。</p>
    `,
    'DATA_FORMAT_ERROR': `
      <p><strong>❌ 資料格式錯誤</strong></p>
      <p>同步過程中發現資料格式問題（如特殊字符或超長字段）。請聯絡技術團隊進行檢查。</p>
    `
  };
  
  return suggestions[errorCode] || `
    <p><strong>❌ 發生預期外的錯誤</strong></p>
    <p>請聯絡系統管理員尋求協助。</p>
  `;
}

/**
 * 根據錯誤訊息識別錯誤代碼
 */
function identifyErrorCode(error) {
  const msg = (error.message || '').toLowerCase();
  
  if (msg.includes('permission') || msg.includes('denied')) {
    return 'PERMISSION_DENIED';
  } else if (msg.includes('quota') || msg.includes('exceeded')) {
    return 'QUOTA_EXCEEDED';
  } else if (msg.includes('not found') || msg.includes('does not exist')) {
    return 'SHEET_NOT_FOUND';
  } else if (msg.includes('firestore') || msg.includes('database')) {
    return 'FIRESTORE_ERROR';
  } else if (msg.includes('format') || msg.includes('json')) {
    return 'DATA_FORMAT_ERROR';
  }
  
  return 'UNKNOWN_ERROR';
}
```

#### 7.4.2 在銷控資料同步中集成通知

修改現有的 `syncSalesHouseholdsToSheet` 函數的錯誤處理：

```javascript
// 修改現有的錯誤 catch 塊
catch (error) {
  console.error(`[${functionName}] 失敗:`, error);
  
  // 非同步發送失敗通知（不阻塞）
  sendSyncFailureNotification(
    projectId,
    'sales',  // syncType
    identifyErrorCode(error),
    error.message,
    {
      spreadsheetId,
      sheetName,
      serviceAccountEmail: process.env.SERVICE_ACCOUNT_EMAIL
    }
  ).catch(err => console.error('通知發送失敗:', err));
  
  // 返回錯誤給前端
  throw new HttpsError('internal', `銷控資料同步失敗: ${error.message}`);
}
```

#### 7.4.3 在退戶同步中集成通知

修改新的 `syncCancelledPurchasesToSheet` 函數的錯誤處理：

```javascript
// 修改錯誤 catch 塊
catch (error) {
  console.error(`[${functionName}] 失敗:`, error);
  
  // 非同步發送失敗通知
  sendSyncFailureNotification(
    projectId,
    'cancelled',  // syncType
    identifyErrorCode(error),
    error.message,
    {
      spreadsheetId,
      sheetName,
      attemptedCount: documents?.length || 0,
      serviceAccountEmail: process.env.SERVICE_ACCOUNT_EMAIL
    }
  ).catch(err => console.error('通知發送失敗:', err));
  
  // 返回錯誤給前端
  throw new HttpsError('internal', `退戶同步失敗: ${error.message}`);
}
```

#### 7.4.4 監聽器中的自動同步失敗通知

對於自動監聽器（`onSalesHouseholdWrite` 和 `onCancelledPurchasesChange`），在失敗時也應發送通知：

```javascript
// 在 onSalesHouseholdWrite 的 catch 塊中
catch (error) {
  console.error(`[${functionName}] 監聽器同步失敗:`, error);
  
  // 發送失敗通知
  sendSyncFailureNotification(
    projectId,
    'sales',
    identifyErrorCode(error),
    `自動同步失敗: ${error.message}`,
    { 
      spreadsheetId,
      sheetName,
      serviceAccountEmail: process.env.SERVICE_ACCOUNT_EMAIL 
    }
  ).catch(err => console.error('通知發送失敗:', err));
}
```

## 8. 測試計畫

### 8.1 單元測試
- [ ] `transformCancelledPurchasesToSheetRows()` - 資料轉換正確性
- [ ] URL 解析 (提取 spreadsheetId)
- [ ] 欄位驗證

### 8.2 整合測試
- [ ] 端對端同步流程 (UI → API → Firestore → Google Sheet)
- [ ] 自動更新監聽 (新增/修改/刪除)
- [ ] 權限檢查

### 8.3 使用者驗收測試 (UAT)
- [ ] 同步成功後資料完整性
- [ ] Google Sheet 格式正確
- [ ] 大量資料同步性能 (1000+ 筆)
- [ ] 錯誤提示清晰

---

## 9. 安全考量

### 9.1 認證和授權
- 確保只有有權限的使用者可配置同步
- 驗證 `projectId` 和使用者關聯

### 9.2 資料隱私
- Google Sheet Service Account 憑證應存儲在 Firebase 環境變數中
- 不在前端暴露敏感資訊

### 9.3 API 速率限制
- Google Sheets API 有速率限制，應實現重試邏輯和指數退避

---

## 10. 後續擴展計畫

1. **排程同步**: 定期自動同步（如每天午夜）
2. **雙向同步**: 允許在 Google Sheet 修改資料後回寫到 Firestore
3. **多工作表同步**: 同一個專案可同步到多個工作表
4. **自訂欄位對應**: 使用者可自行選擇要同步的欄位
5. **篩選條件**: 支援按日期範圍、銷售人員等篩選同步的資料
6. **版本控制**: 記錄同步歷史，支援回復

---

## 11. 相關文檔和資源

- [Google Sheets API 文檔](https://developers.google.com/sheets/api)
- [Firebase Cloud Functions 文檔](https://firebase.google.com/docs/functions)
- [Firestore 安全規則](https://firebase.google.com/docs/firestore/security/get-started)
- 現有「銷控資料同步」實現 (參考):
  - `src/views/SalesSettings.vue` (UI)
  - `src/api/firebaseService.js` (API)
  - `functions/` (Cloud Functions 實現)

---

## 12. 版本歷史

| 版本 | 日期 | 異動 |
|-----|------|------|
| 1.0 | 2026-04-13 | 初稿 |

