# SPEC：戶別資訊「上傳文件」至戶別 Drive 資料夾

> 建立日期：2026-09-05
> 狀態：已實作（2026-09-05，待確認事項全部採建議預設；unitDocumentApi 已部署，Storage rules 與 GCS lifecycle 待人工確認）
> 相關檔案：`src/components/UnitDetailModal.vue`、`src/views/SalesControlSystem.vue`、`src/api.js`、`functions/index.js`
> 參考樣板：[SPEC_UnitPaymentRecords.md](./SPEC_UnitPaymentRecords.md)（內嵌陣列 + Panel 元件 + Drive 上傳 API 模式）

## 1. 目標

在銷控系統「戶別資訊」（`UnitDetailModal.vue` 檢視模式）新增「上傳文件」功能：

- 使用者選擇**文件種類**（合約書／身分證／客戶資料卡／訂單／其他（可手動自訂））與**任意格式**檔案。
- 系統依 `{YYYYMMDD}-{戶別}-{文件種類}` 自動產生文件名稱（台北時間），使用者可修改；副檔名沿用原檔自動補上。
- 檔案上傳到該戶別的 Google Drive 資料夾（銷控欄位「戶別資料夾位置」`driveFolderUrl`）。
- 上傳後在戶別資訊中列出已上傳文件（種類、名稱、大小、上傳人、時間），可點開 Drive 檢視、改名／改種類、刪除。

文件 metadata 存於既有 `salesHouseholds/{projectId}_{unitId}` 文件（database：**`anxi-app`**），**不新建 collection**。

## 2. 範圍

### In scope
- 新元件 `src/components/UnitDocumentsPanel.vue`：文件列表 + 「上傳文件」對話框（多檔選取、每檔可獨立設定種類與名稱、逐檔進度條）。
- `UnitDetailModal.vue` 檢視模式掛載面板（緊接繳款紀錄之後）；電腦版頁尾與手機版「更多功能」面板新增「上傳文件」入口。
- 銷控網格快速選單（右鍵／長按）新增「上傳文件」動作（開啟戶別資訊並自動打開上傳對話框）。
- 新 Cloud Function `unitDocumentApi`（action：`commit` / `rename` / `delete`），負責 Storage → Drive 轉存、metadata 寫入、Drive 改名與刪除。
- 上傳走 **Firebase Storage 中繼**（前端 `uploadBytesResumable` 直傳暫存路徑，後端串流轉存 Drive），突破 callable 10MB 上限並提供進度。

### Out of scope
- 不自動建立戶別 Drive 資料夾；未設定 `driveFolderUrl` 時停用上傳（見 §6）。
- 不掃描 Drive 資料夾既有檔案回填列表（列表僅顯示經本功能上傳的文件；資料夾內其他檔案仍可由「戶別資料夾」按鈕開啟查看）。
- 不做檔案內容預覽（點擊一律開 Drive `webViewLink` 新分頁）。
- 不納入銷控列表欄位／匯出／資料透視（後續可比照繳款紀錄加 `document_count` 計算欄位）。
- 不做版本控管（同名檔案 Drive 允許並存，不覆蓋、不加流水號）。

## 3. 資料模型（Firestore）

### 3.1 文件路徑

沿用 `salesHouseholds/{projectId}_{unitId}`，由後端 transaction 寫入 `unitDocuments` 陣列。

### 3.2 新增欄位

```js
{
  // ── 既有欄位完全保留（driveFolderUrl、paymentRecords 等）──

  // ✅ 新增：已上傳文件（內嵌陣列，比照 paymentRecords[]）
  unitDocuments: [
    {
      id: 'ud_1757040000000_ab12',        // 後端產生：ud_{timestamp}_{rand}
      docType: 'contract',                // 種類 key，見 §3.3；自訂為 'other'
      docTypeLabel: '合約書',              // 顯示用文字；docType='other' 時為使用者輸入的自訂文字
      fileName: '20260905-A1-合約書.pdf',  // Drive 實際檔名（含副檔名）
      originalName: 'scan_0001.pdf',      // 使用者原始檔名（僅供追溯）
      mimeType: 'application/pdf',
      size: 2345678,                      // bytes
      fileId: '1AbC...',                  // Drive fileId
      webViewLink: 'https://drive.google.com/file/d/.../view',
      uploadedBy: { userKey: '0912xxxxxx', name: '王小明' },
      uploadedAt: '2026-09-05T02:00:00.000Z',
      updatedAt: '2026-09-05T02:00:00.000Z'
    }
  ]
}
```

| 欄位 | 型別 | 必填 | 說明 |
|---|---|---|---|
| `id` | string | ✅ | 後端產生，供 `v-for :key`（key 只綁 id，不綁名稱等動態值）與定位 |
| `docType` | string | ✅ | `contract` / `idCard` / `customerCard` / `order` / `other` |
| `docTypeLabel` | string | ✅ | 顯示文字；`other` 時為自訂文字（去頭尾空白、最長 20 字） |
| `fileName` | string | ✅ | Drive 上的最終檔名（含副檔名），與 Drive 同步 |
| `originalName` | string | ✅ | 原始上傳檔名 |
| `mimeType` | string | ✅ | 前端 `File.type`，空值時由後端依副檔名推斷，最後 fallback `application/octet-stream` |
| `size` | number | ✅ | bytes，用於列表顯示與上限檢查 |
| `fileId` / `webViewLink` | string | ✅ | Drive 資訊 |
| `uploadedBy` | object | ✅ | 前端由 `userStore` 帶入（現有 callable 不驗 `request.auth`，比照既有慣例信賴前端） |
| `uploadedAt` / `updatedAt` | string(ISO) | ✅ | 後端寫入 |

### 3.3 文件種類常數（前後端共用定義，各自維護一份）

```js
export const UNIT_DOCUMENT_TYPES = [
  { key: 'contract',     label: '合約書',     icon: 'mdi-file-sign' },
  { key: 'idCard',       label: '身分證',     icon: 'mdi-card-account-details-outline' },
  { key: 'customerCard', label: '客戶資料卡', icon: 'mdi-account-box-outline' },
  { key: 'order',        label: '訂單',       icon: 'mdi-receipt-text-outline' },
  { key: 'other',        label: '其他',       icon: 'mdi-file-outline', custom: true },
];
```

前端放 `src/utils/unitDocuments.js`（同時提供 `buildUnitDocumentBaseName()` 與 `sanitizeFileNameSegment()`）；後端於 `functions/index.js` 以同名常數定義並用 `key` 驗證。

## 4. 前端 UI

### 4.1 新元件 `src/components/UnitDocumentsPanel.vue`

介面契約比照 `PaymentRecordsPanel.vue` 檢視模式：

- Props：`modelValue`（`unitDocuments` 陣列）、`projectId`、`unitId`、`driveFolderUrl`、`uploadHandler`（async）、`renameHandler`（async）、`deleteHandler`（async）、`defaultExpanded`、`autoOpenUpload`（開面板即彈出上傳對話框，供快速選單使用）。
- 不直接 mutate `modelValue`；所有異動由父層 handler 完成後更新本地列表。
- 標題列常駐顯示：`已上傳文件 N 份`；右側「上傳文件」按鈕 + 「開啟資料夾」icon（`driveFolderUrl` 新分頁）。
- 預設收合（與繳款紀錄一致），有文件時標題顯示件數 chip。

**列表**（電腦版表格／手機版卡片）：

| 欄位 | 內容 |
|---|---|
| 圖示 | 依 `mimeType` 對應：PDF `mdi-file-pdf-box`、圖片 `mdi-file-image`、Word `mdi-file-word`、Excel `mdi-file-excel`、其他 `mdi-file-outline` |
| 種類 | `docTypeLabel` chip（依 `docType` 固定色，`other` 灰） |
| 文件名稱 | `fileName`，點擊開 `webViewLink` 新分頁 |
| 大小 | 人類可讀（KB／MB，1 位小數） |
| 上傳 | `uploadedBy.name`＋`uploadedAt`（台北時間 `MM/DD HH:mm`） |
| 操作 | ✏️ 編輯（改種類／名稱）、🗑️ 刪除 |

排序：`uploadedAt` 新→舊（前端排序，不用 Firestore orderBy）。

### 4.2 上傳對話框（`UnitDocumentsPanel` 內部）

手機全螢幕、電腦 `max-width: 720px`。

1. **文件種類**：`v-chip-group`（單選）列出 §3.3 五種；選「其他」時展開必填文字欄「自訂種類名稱」（最長 20 字，即時去除 `\ / : * ? " < > |`）。此為**批次預設種類**。
2. **選擇檔案**：`<input type="file" multiple>`，`accept` 不設限（任何格式）；手機可從相機／相簿／檔案 App 選取。加入後每檔一列。
3. **每檔一列**可獨立編輯：
   - 種類（下拉，預設批次種類；選「其他」再出現自訂欄）。
   - 文件名稱（文字欄，**不含副檔名**）：預設 `{YYYYMMDD}-{戶別}-{種類文字}`；同批次同種類第 2 檔起自動補 `-2`、`-3`。副檔名以唯讀 suffix 顯示（例：`.pdf`），由原檔名取得；原檔無副檔名時 suffix 空白。
   - 原始檔名、大小（唯讀）；移除鈕。
   - 上傳中顯示進度條（0–100%）與狀態 chip（等待／上傳中／轉存 Drive／完成／失敗＋錯誤訊息）。
4. **限制**：單檔 ≤ 100MB、單批 ≤ 10 檔；副檔名黑名單（`exe bat cmd com msi scr ps1 vbs jar`）直接標記不可上傳。超限在選檔時立即以紅字提示，該列停用。
5. **按「開始上傳」**：逐檔（同時最多 2 檔）執行 §4.4 流程；全部完成後對話框顯示結果摘要（成功 N／失敗 M），失敗列可「重試」；成功列不重傳。按「完成」關閉並刷新列表。
6. 上傳進行中禁止關閉對話框（顯示「上傳中，請勿關閉」）；使用者切換分頁不影響（`uploadBytesResumable` 續傳由 SDK 處理）。

日期 `YYYYMMDD` 一律以 `Asia/Taipei` 取當天（`Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', ... })`），不可用 `new Date().toISOString()` 直接切字串。

### 4.3 編輯（改名／改種類）與刪除

- **編輯**：對話框可改「種類」與「文件名稱（不含副檔名）」，儲存呼叫 `unitDocumentApi(action:'rename')`；後端同步 Drive 檔名並回傳更新後紀錄。Drive 改名失敗 → 回 `renameWarning`，前端 toast 警告但紀錄仍更新（比照繳款紀錄）。
- **刪除**：`confirm` 對話框含一個勾選「同時將 Drive 檔案移至垃圾桶」（預設**不勾**，保留存檔，比照繳款憑證不刪圖的慣例）；呼叫 `unitDocumentApi(action:'delete', trashDriveFile)`。

### 4.4 上傳流程（Storage 中繼 → Drive）

```
前端                                   Firebase Storage              Cloud Function unitDocumentApi        Google Drive
 │ 1. uploadBytesResumable(file) ─────▶ unitDocuments/temp/…             │                                   │
 │    (進度回報 0–100%)                   │                               │                                   │
 │ 2. commit({storagePath, fileName, …}) ─────────────────────────────▶  │                                   │
 │                                        │  3. 讀 salesHouseholds 取 folderId                                │
 │                                        │◀─ 4. createReadStream ────────│── 5. drive.files.create(stream) ─▶│
 │                                        │                               │◀──── fileId / webViewLink ────────│
 │                                        │  6. transaction 附加 unitDocuments[]                              │
 │                                        │◀─ 7. 刪除暫存檔 ──────────────│                                   │
 │◀── { status, record } ────────────────────────────────────────────────│                                   │
```

1. 前端組暫存路徑：`unitDocuments/temp/{projectId}/{unitId}/{uploadId}/{safeOriginalName}`（`uploadId = Date.now()_rand`，`safeOriginalName` 比照 `uploadPriceRemarkPendingImages()` 以 `[^\w.\-]` → `_`），以 `uploadBytesResumable` 上傳，`contentType` 帶 `file.type`。
2. 完成後呼叫 `unitDocumentApi({ action: 'commit', projectId, unitId, storagePath, fileName, docType, docTypeLabel, originalName, mimeType, size, uploadedBy })`。
3. 成功 → 將回傳 `record` 併入本地列表並 emit `data-updated`（`SalesControlSystem` 已接 `handleRefreshData` 背景刷新）。
4. 失敗 → 前端顯示錯誤；若 Storage 上傳成功但 `commit` 失敗，前端呼叫 `deleteObject(storageRef)` 清理暫存（失敗忽略，另有 §5.4 生命週期兜底）。

為何不用 base64 callable：callable 請求上限 10MB，base64 再膨脹 33%，實際只能傳約 7MB；合約書掃描 PDF 常見 20–50MB，且 base64 無進度回報。Storage 中繼一條路徑同時解決大小、進度與續傳。

### 4.5 `UnitDetailModal.vue` 掛載與入口

- **檢視模式**：`PaymentRecordsPanel` 之後新增 `<UnitDocumentsPanel>`；本地狀態 `viewUnitDocuments`（比照 `viewPaymentRecords`，開 Modal 時由 `unitData.unitDocuments` 初始化，異動後即時更新並 emit `data-updated`）。
- **電腦版頁尾**：「{{unitId}} 資料夾」按鈕旁新增「上傳文件」（`mdi-cloud-upload-outline`，僅 `viewMode === 'sales'`）；點擊捲動至面板並展開、打開上傳對話框。無 `driveFolderUrl` 時按鈕仍顯示但 `disabled` 並有 tooltip「請先設定戶別資料夾位置」。
- **手機版更多功能面板**：`unitToolGroups` 的「文件與下載」群組新增 `{ icon:'mdi-cloud-upload-outline', label:'上傳文件' }`，行為同上。
- **銷控網格快速選單**（`SalesControlSystem.vue` 快速選單 actions）：在「戶別資料夾」前新增 `{ key:'documents', icon:'mdi-cloud-upload-outline', label:'上傳文件', subtitle: N 份文件 / '尚無文件', badge: N, disabled: !u.driveFolderUrl }`，`run` 為 `openUnitDetail(unit, { tab:'info', openDocumentsUpload:true })`；`openUnitDetail` 新增該選項並由 Modal 以 prop `autoOpenDocumentsUpload` 接收。
- 修改銷控（編輯模式）**不**放上傳文件（文件即時上傳，與延遲提交模型不相容），面板在編輯模式隱藏。
- 權限：與修改銷控相同（`viewMode === 'sales'` 才顯示），**不**新增 `systemFunctions` 權限。若日後要獨立權限，新增 systemFunctions 後必須同步 arrayUnion 授權所有超級管理員的全部建案。

### 4.6 `src/api.js`

```js
export async function unitDocumentApi(payload) {
  const fn = httpsCallable(functions, 'unitDocumentApi', { timeout: 300000 });
  const result = await fn(payload);
  return result.data;
}
```

`timeout` 拉長至 5 分鐘：大檔 Storage → Drive 串流轉存需要時間。

## 5. 後端 / Cloud Function

### 5.1 新增 `unitDocumentApi`

```js
exports.unitDocumentApi = onCall({
  region: "asia-east1",
  memory: "512MiB",          // 依專案規範
  timeoutSeconds: 300,
  cors: true,
  secrets: driveSecrets
}, async (request) => { /* action: 'commit' | 'rename' | 'delete' */ });
```

骨架複用 `paymentProofApi`：`getAuthenticatedDriveClient()`、`invalid_grant` 錯誤處理、`new Firestore({ databaseId: 'anxi-app' })`、`driveFolderUrl` → `url.match(/[-\w]{25,}/)[0]` 解析 folderId。

**共同驗證**：`projectId`、`unitId` 必填；`docType` 須在 §3.3 key 清單內；`docType === 'other'` 時 `docTypeLabel` 必填。

**action: `commit`**
- 入參：`{ projectId, unitId, storagePath, fileName, docType, docTypeLabel, originalName, mimeType, size, uploadedBy }`
- 驗證：
  - `storagePath` 必須以 `unitDocuments/temp/{projectId}/{unitId}/` 開頭（防止讀取其他路徑）。
  - 檔案存在（`bucket.file(path).exists()`），實際 `size` ≤ 100MB（以 GCS metadata 為準，不信前端）。
  - 副檔名黑名單同前端；`fileName` 經 §5.2 sanitize 後非空。
- 流程：
  1. 讀 `salesHouseholds/{projectId}_{unitId}` → `driveFolderUrl` → folderId（無值／解析失敗丟 `failed-precondition`）。
  2. `mimeType` 決定順序：GCS metadata `contentType` → 入參 `mimeType` → 依副檔名對照表 → `application/octet-stream`。
  3. `drive.files.create({ resource:{ name, parents:[folderId] }, media:{ mimeType, body: bucket.file(path).createReadStream() }, fields:'id, name, webViewLink, size', supportsAllDrives:true })`。
  4. transaction 讀 `unitDocuments`（容忍不存在），附加新紀錄（`id = ud_{ts}_{rand}`，`uploadedAt`/`updatedAt` 後端時間）。
  5. `bucket.file(path).delete({ ignoreNotFound: true })` 清暫存；刪除失敗僅 `console.warn`。
  6. 回傳 `{ status:'success', record }`。
- 錯誤處理：Drive 上傳成功但 Firestore 寫入失敗 → 嘗試 `drive.files.update({ fileId, requestBody:{ trashed:true } })` 回滾後再拋錯，避免 Drive 產生孤兒檔。

**action: `rename`**
- 入參：`{ projectId, unitId, docId, fileName, docType, docTypeLabel }`（`fileName` 不含副檔名）
- 流程：讀紀錄 → 由既有 `fileName` 取副檔名 → 組新檔名 → `drive.files.update({ fileId, requestBody:{ name } })`（失敗設 `renameWarning=true`，不中斷）→ transaction 覆寫該筆（`fileName`、`docType`、`docTypeLabel`、`updatedAt`）→ 回 `{ status, record, renameWarning }`。

**action: `delete`**
- 入參：`{ projectId, unitId, docId, trashDriveFile }`
- 流程：transaction 過濾移除該筆（找不到丟 `not-found`）→ `trashDriveFile === true` 時 `drive.files.update({ fileId, requestBody:{ trashed:true } })`（失敗僅回 `trashWarning`，紀錄已刪）→ 回 `{ status, removedId, trashWarning }`。

### 5.2 檔名規則

```
{YYYYMMDD}-{戶別}-{文件種類}.{副檔名}
例：20260905-A1-合約書.pdf
    種類「其他」自訂「戶籍謄本」→ 20260905-A1-戶籍謄本.pdf（不出現「其他」字樣）
```

- 預設名稱由**前端**產生（使用者可改），後端只做 sanitize 與補副檔名，不重組。
- sanitize：移除 `\ / : * ? " < > |` 與控制字元／換行，去頭尾空白與句點，最長 80 字；為空時 fallback `{YYYYMMDD}-{戶別}-{docTypeLabel}`。
- 副檔名：取 `originalName` 最後一個 `.` 之後（小寫，≤ 10 字元）；無副檔名則不補。
- Drive 允許同名並存，不加流水號（同批次前端已預補 `-2`、`-3`）。

### 5.3 Storage 暫存路徑與規則

- 路徑：`unitDocuments/temp/{projectId}/{unitId}/{uploadId}/{safeOriginalName}`。
- **Storage Security Rules**：需確認現行規則允許已登入用戶對 `unitDocuments/temp/**` 寫入（既有 `unitDetails/**` 備註圖片為前端直傳，可比照）。若規則採白名單，需新增：

```
match /unitDocuments/temp/{projectId}/{unitId}/{uploadId}/{fileName} {
  allow write: if request.auth != null && request.resource.size < 100 * 1024 * 1024;
  allow read, delete: if request.auth != null;
}
```

### 5.4 暫存檔兜底清理

- 正常流程 `commit` 完成即刪。
- 兜底：於 GCS bucket 設定 **Lifecycle rule**：prefix `unitDocuments/temp/`、age 1 天自動刪除（Console 或 `gsutil lifecycle set`，一次性設定）。避免使用者中途關頁面留下孤兒檔。

### 5.5 `updateSalesData` 配合

`unitDocuments` 為陣列欄位，不在數值／日期白名單，隨既有 `set(..., { merge: true })` 整包寫入時**原樣保留**（前端整包送出時須帶原陣列，比照 `paymentRecords` 現況）；後端不需改動。

## 6. 權限與安全

- 前端：功能僅存在銷控模式戶別資訊，權限沿用修改銷控（能看到戶別資訊銷控模式即能上傳）。
- 後端：與 `paymentProofApi` 一致，不驗 `request.auth`（現有慣例）；但 `storagePath` 前綴檢查、大小以 GCS metadata 為準、副檔名黑名單、folderId 僅由 Firestore 取得（不接受前端傳 folderId）。
- 未設定 `driveFolderUrl`：前端停用上傳入口並提示「請先於修改銷控設定此戶別的『戶別資料夾位置』」；後端仍做 `failed-precondition` 防禦。
- 文件（合約、身分證）屬個資：Drive 檔案權限沿用資料夾既有分享設定，系統**不**額外呼叫 permissions API 開放連結；`webViewLink` 需有資料夾權限才能開啟。

## 7. 部署與發版

| 項目 | 指令／動作 |
|---|---|
| Cloud Functions | `FUNCTIONS_DISCOVERY_TIMEOUT=120 firebase deploy --only functions:unitDocumentApi` |
| Storage Rules | 確認／新增 §5.3 規則後 `firebase deploy --only storage`（若 rules 由 Console 管理則手動更新） |
| GCS Lifecycle | 一次性設定 `unitDocuments/temp/` 1 天自動刪除（§5.4） |
| 前端 | 依 commit-notes 流程更新 CHANGELOG 後 `npm run release:safe` |
| Firestore 索引 | 不需要（內嵌陣列，無新查詢） |

## 8. 驗收條件

1. 銷控模式戶別資訊可見「已上傳文件」面板與「上傳文件」入口（電腦頁尾按鈕、手機更多功能、網格快速選單三處）；報價模式與修改銷控編輯模式不顯示。
2. 上傳對話框可選五種文件種類；選「其他」必須輸入自訂名稱才能上傳。
3. 選擇任意格式檔案（PDF／JPG／DOCX／XLSX／ZIP…）皆可加入；黑名單副檔名、>100MB、單批 >10 檔立即提示且無法上傳。
4. 每檔預設名稱為 `YYYYMMDD-{戶別}-{種類}`（台北日期；「其他」用自訂文字；同批同種類自動 `-2`、`-3`），可修改，副檔名自動補上；含 `\ / : * ? " < > |` 會被清洗。
5. 上傳過程顯示逐檔進度；30MB 以上檔案可成功上傳並出現在該戶 Drive 資料夾，檔名與列表一致。
6. 上傳完成後列表即時顯示（種類 chip、名稱、大小、上傳人、時間），點名稱開啟 Drive 檢視頁；重新整理銷控後資料仍在。
7. 編輯種類／名稱後 Drive 檔名同步更新；Drive 改名失敗僅 toast 警告，紀錄仍更新。
8. 刪除預設保留 Drive 檔案；勾選「移至垃圾桶」則 Drive 檔案進垃圾桶。
9. 未設定 `driveFolderUrl` 的戶別：入口停用並提示；直接呼叫 API 回 `failed-precondition`。
10. `commit` 途中 Firestore 寫入失敗時，Drive 不留孤兒檔；Storage 暫存檔在成功後被刪除，中途放棄的暫存檔 1 天內自動清理。
11. 上傳文件後進入修改銷控並儲存其他欄位，`unitDocuments` 不會遺失。

## 9. 待確認事項

| 議題 | 建議預設 | 說明 |
|---|---|---|
| 單檔上限 | 100MB | 合約掃描檔常見 20–50MB；如需更大可調 Storage rules 與後端常數 |
| 副檔名黑名單 | `exe bat cmd com msi scr ps1 vbs jar` | 「各種格式」仍排除可執行檔；若要完全不限可移除 |
| 刪除是否動 Drive | 預設保留、可勾選移垃圾桶 | 比照繳款憑證「刪紀錄不刪圖」慣例，但給使用者選擇 |
| 多檔上傳 | 支援，單批 ≤ 10 | 若只要單檔可簡化對話框 |
| 是否獨立權限 | 否，沿用修改銷控 | 若要限制特定人員上傳，需新增 systemFunctions 並同步超管 |
| 列表是否納入銷控列表／匯出 | 否 | 後續可加 `document_count` 計算欄位與快速選單 badge |
| 是否掃描 Drive 既有檔案 | 否 | 若需要可加 `action:'sync'` 用 `drive.files.list` 回填 |
