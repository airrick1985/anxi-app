# SPEC：戶別繳款紀錄（修改銷控）

> 建立日期：2026-08-16
> 狀態：已確認，待實作
> 相關檔案：`src/components/UnitDetailModal.vue`、`src/components/SalesInfoForm.vue`、`functions/index.js`
> 參考樣板：[SPEC_LandParcelsInventory.md](./SPEC_LandParcelsInventory.md)（內嵌陣列 + Panel 元件模式）

## 1. 目標

在銷控系統「修改銷控」（`UnitDetailModal.vue`）中新增「戶別繳款紀錄」功能：

- 可新增／編輯／刪除該戶別的繳款紀錄（日期、金額、備註、繳款憑證圖檔）。
- 自動計算並顯示**繳款比例 = 已繳款金額合計 ÷ 成交總價（含車位）**，四捨五入顯示到小數一位（如 `35.7%`）。
- 憑證圖檔上傳至**該戶別的 Drive 資料夾**（銷控欄位「戶別資料夾位置」`driveFolderUrl`），檔名規則 `{YYYYMMDD}-{戶別}-{金額}-{備註}`。
- 圖檔可在紀錄列表中點縮圖預覽（開啟 Drive 檢視頁）。

資料儲存於既有 `salesHouseholds/{projectId}_{unitId}` 文件（database：**`anxi-app`**），**不新建 collection**。

## 2. 範圍

### In scope
- `UnitDetailModal.vue` 檢視模式：唯讀繳款紀錄列表 + 繳款比例 + **快速新增**（免進修改銷控，對話框輸入後即時儲存，可附憑證圖檔）。
- `UnitDetailModal.vue` 編輯模式：新增／編輯／刪除紀錄、選擇／更換圖檔（延遲提交，按「儲存」才生效）。
- 新元件 `src/components/PaymentRecordsPanel.vue`（`v-model` + `:editable`，比照 `LandParcelsPanel.vue`）。
- 新 Cloud Function `paymentProofApi`（action：`upload` / `rename` / `addRecord`），負責 Drive 圖檔上傳、改名同步與快速新增寫入。
- 編輯模式的紀錄隨既有 `updateSalesData` 整包儲存；快速新增由 `addRecord` 以 transaction 直接附加。
- 銷控系統整合（2026-08-16 追加）：`enrichUnitItem` 新增計算欄位 `paid_total`（已繳款金額(萬)，元÷10000 取 2 位）與 `payment_ratio`（繳款比例(%)，取 0.1%），自動納入**資料透視**（維度區間分組＋值加總/平均等）與**匯出欄位**；**列表模式**新增「繳款比例」欄（手機/電腦皆有，加總列顯示整體比例＝Σ已繳÷Σ成交總價），點比例 chip 浮動開啟該戶繳款紀錄一覽（複用 `PaymentRecordsPanel` 唯讀＋`defaultExpanded`，手機全螢幕、電腦置中視窗）。

### Out of scope
- 刪除紀錄時**不刪除** Drive 上的圖檔（憑證保留存檔）。
- 不提供批次匯入／匯出繳款紀錄（後續 SPEC 擴充）。
- 不自動建立戶別 Drive 資料夾；未設定 `driveFolderUrl` 時僅停用圖檔欄位（見 §6）。
- 銷控列表／匯出不顯示繳款比例欄位（後續視需求擴充）。

## 3. 資料模型（Firestore）

### 3.1 文件路徑

沿用既有 `salesHouseholds/{projectId}_{unitId}`，經 `updateSalesData` 以 `set(..., { merge: true })` 寫入。

### 3.2 新增欄位

```js
{
  // ── 既有欄位完全保留（price_transaction_total、driveFolderUrl 等）──

  // ✅ 新增：繳款紀錄（內嵌陣列，比照 landParcels[]）
  paymentRecords: [
    {
      id: 'pr_1755330000000_ab12',   // 前端產生：pr_{timestamp}_{rand}
      date: '2026-08-16',            // 繳款日期 YYYY-MM-DD（台北時間）
      amount: 1500000,               // 金額，單位「元」，正整數
      note: '簽約款',                 // 備註，可空
      file: {                        // 憑證圖檔，無圖為 null
        fileId: '1AbC...',           // Drive fileId
        fileName: '20260816-A1-1500000-簽約款.jpg',
        webViewLink: 'https://drive.google.com/file/d/.../view',
        uploadedAt: '2026-08-16T10:00:00.000Z'
      },
      createdAt: '2026-08-16T10:00:00.000Z',
      updatedAt: '2026-08-16T10:00:00.000Z'
    }
  ]
}
```

| 欄位 | 型別 | 必填 | 說明 |
|---|---|---|---|
| `id` | string | ✅ | 前端產生的唯一 id，供 `v-for :key` 與定位 |
| `date` | string | ✅ | `YYYY-MM-DD`，選擇日期 |
| `amount` | number | ✅ | 單位「元」，> 0 的整數 |
| `note` | string | — | 備註 |
| `file` | object \| null | — | Drive 圖檔資訊，一筆紀錄最多 1 張圖 |
| `createdAt` / `updatedAt` | string(ISO) | ✅ | 前端寫入 |

### 3.3 繳款比例（不落庫，即時計算）

```
繳款比例 = Σ paymentRecords[].amount ÷ (price_transaction_total × 10000)
```

- `price_transaction_total` 單位為「萬」（= 房屋成交價 + Σ 車位成交價，`SalesInfoForm.vue` 自動計算），故 ×10000 換算為元。
- 顯示格式：`(ratio × 100)` 四捨五入到小數一位 + `%`（如 `35.7%`）；比例可超過 100%（照實顯示）。
- 分母無效（成交總價為 0 / null）時顯示 `—` 並提示「尚未填寫成交總價」。
- 編輯模式中未儲存的異動也即時反映在試算比例上。

## 4. 前端 UI

### 4.1 新元件 `src/components/PaymentRecordsPanel.vue`

介面契約比照 `LandParcelsPanel.vue`：

- Props：`modelValue`（`paymentRecords` 陣列）、`editable`（boolean）、`totalPriceWan`（成交總價，萬）、`unitId`、`driveFolderUrl`。
- 所有變更走不可變更新 emit `update:modelValue`，不直接 mutate。
- 標題列常駐顯示：`已繳款合計 N,NNN,NNN 元 ｜ 繳款比例 35.7%`。

**檢視模式**（`editable=false`）：表格列出 日期／金額（千分位）／備註／憑證縮圖；點縮圖開燈箱放大，燈箱內提供「在 Drive 開啟」按鈕（`webViewLink` 新分頁）。

**快速新增**（`allowQuickAdd=true`，檢視模式限定）：右上「新增繳款紀錄」按鈕開啟對話框（日期／金額／備註／圖檔，選檔後縮圖＋燈箱確認），按「儲存」即呼叫 `paymentProofApi(action: 'addRecord')` 一趟完成上傳＋寫入，成功後即時更新列表（`UnitDetailModal` 以本地 `viewPaymentRecords` 維護，並 emit `data-updated` 讓父層背景刷新）；進入修改銷控時以此本地列表為編輯初始值，避免吃到未刷新的舊資料。權限同修改銷控（`viewMode === 'sales'`）。

**編輯模式**（`editable=true`）：
- 右上「新增繳款紀錄」按鈕；每筆卡片含：日期（date picker）、金額（元，數字欄）、備註（文字欄）、圖檔選擇區、右上刪除鈕（`confirm` 確認）。
- 圖檔選擇：接受 JPG／PNG／WEBP，單檔 ≤ 10MB，每筆 1 張；選擇後以 `URL.createObjectURL` 產生**本地小縮圖**（標示「待上傳」chip），可移除重選。
- **燈箱放大確認**：點擊縮圖（無論待上傳或已上傳）開啟燈箱（`v-dialog` + 滿版圖片，點背景或 ✕ 關閉），讓使用者確認照片內容無誤後再儲存；待上傳圖用本地 ObjectURL，已上傳圖用 Drive 縮圖大圖（`thumbnail?id={fileId}&sz=w1600`，失敗 fallback 開 `webViewLink` 新分頁）。
- 已上傳圖檔顯示縮圖 + 檔名，可「更換圖檔」（舊圖不刪，僅 file 欄位換新）。
- 未設定 `driveFolderUrl` 時：圖檔區停用並顯示提示「請先於銷控設定此戶別的『戶別資料夾位置』」；日期／金額／備註仍可正常新增。

縮圖來源：`https://drive.google.com/thumbnail?id={fileId}`，載入失敗 fallback 為 `mdi-file-image` icon（仍可點開連結）。

### 4.2 `UnitDetailModal.vue` 掛載位置

- 編輯模式：`<SalesInfoForm>` 之後新增一張 `v-card variant="outlined"` 卡片放 `<PaymentRecordsPanel :editable="true">`。
- 檢視模式：價格資訊區塊之後新增唯讀區塊 `<PaymentRecordsPanel :editable="false">`（RWD 比照既有 info-section）。
- 權限：與修改銷控完全相同——能進入編輯模式即可操作，不另設權限。

### 4.3 儲存流程（延遲提交，整合進 `executeSaveChanges()`）

比照「房價備註圖片」的 pending 模式（`UnitDetailModal.vue` 既有機制）：

1. 按「儲存」時，先對每筆**有待上傳圖檔**的紀錄呼叫 `paymentProofApi(action: 'upload')`，以**最終的日期／金額／備註**命名；成功後將回傳的 `file` 資訊併入該筆紀錄。任一上傳失敗 → 中止儲存並提示，已上傳成功的檔案資訊保留在編輯狀態（重試不重傳）。
2. 呼叫既有 `updateSalesData` 將 `paymentRecords` 隨整包資料寫入。
3. 寫入成功後，對「已有圖檔且日期／金額／備註有變更」的紀錄呼叫 `paymentProofApi(action: 'rename')` 同步 Drive 檔名；rename 失敗僅 toast 警告，不影響已儲存資料。
4. 取消編輯：釋放 ObjectURL、丟棄所有 pending 狀態，不動 Drive。

## 5. 後端 / Cloud Function

### 5.1 新增 `paymentProofApi`

```js
exports.paymentProofApi = onCall({
  region: "asia-east1",
  memory: "512MiB",
  secrets: driveSecrets,
  cors: true
}, async (request) => { /* action: 'upload' | 'rename' */ });
```

骨架複用 `uploadAuthLetter`（`functions/index.js` L5987 起），差異三處：collection 改 `salesHouseholds`、欄位改 `driveFolderUrl`、mimeType 由 base64 magic number 嗅探（抄 `handleAttachmentUpload` 的 `sniffContentType()`）。Drive client 用 `getAuthenticatedDriveClient()`，並沿用 `invalid_grant` 錯誤處理慣例。

**action: `upload`**
- 入參：`{ projectId, unitId, base64, date, amount, note }`
- 流程：讀 `salesHouseholds/{projectId}_{unitId}` → 取 `driveFolderUrl` → `url.match(/[-\w]{25,}/)[0]` 解析 folderId（無值或解析失敗丟 `failed-precondition`）→ 組檔名 → `drive.files.create`（`fields: 'id, name, webViewLink'`）→ 回傳 `{ status: 'success', file: { fileId, fileName, webViewLink } }`。
- 驗證：`amount` 為正整數、`date` 格式 `YYYY-MM-DD`、圖檔限 JPG/PNG/WEBP、base64 解碼後 ≤ 10MB。

**action: `rename`**
- 入參：`{ projectId, unitId, fileId, date, amount, note }`
- 流程：依相同規則組新檔名 → `drive.files.update({ fileId, requestBody: { name } })` → 回傳新檔名。

**action: `addRecord`**（快速新增）
- 入參：`{ projectId, unitId, base64?, date, amount, note }`（`base64` 選填）
- 流程：有 `base64` 先走與 `upload` 相同的上傳流程取得 file 資訊 → 以 Firestore transaction 讀取 `paymentRecords` 陣列並附加新紀錄（id 由後端產生 `pr_{ts}_{rand}`）→ 回傳 `{ status, record }`。

### 5.2 檔名規則

```
{YYYYMMDD}-{戶別}-{金額}-{備註}.{副檔名}
例：20260816-A1-1500000-簽約款.jpg
```

- 日期取紀錄的 `date`（去除 `-`）；金額為元的整數字串（不加千分位）；副檔名依嗅探結果（jpg/png/webp）。
- 備註 sanitize：移除 `\ / : * ? " < > |` 與換行，去頭尾空白，最長 30 字；備註為空時省略末段 → `{YYYYMMDD}-{戶別}-{金額}.jpg`。
- Drive 允許同名檔案並存，同名不另加流水號。

### 5.3 `updateSalesData` 配合

`paymentRecords` 為陣列欄位，隨既有 `set(..., { merge: true })` 整包覆蓋寫入，**後端不需改動**（不在數值欄位白名單，不受 `Number()` 轉型影響）。

## 6. 權限與安全

- 前端：功能僅存在於「修改銷控」Modal 內，權限完全沿用修改銷控（能開編輯即能操作）。
- 後端：`paymentProofApi` 的登入／權限檢查比照 `updateSalesData` 現況。
- 未設定 `driveFolderUrl`：前端停用圖檔欄位；後端仍做防禦性檢查（`failed-precondition`）。

## 7. 部署與發版

| 項目 | 指令 |
|---|---|
| Cloud Functions | `firebase deploy --only functions:paymentProofApi`（必要時加 `FUNCTIONS_DISCOVERY_TIMEOUT=120`） |
| 前端 | 依 commit-notes 流程更新 CHANGELOG 後 `npm run release:safe` |
| Firestore 索引 | 不需要（內嵌陣列，無新查詢） |

## 8. 驗收條件

1. 修改銷控編輯模式可新增繳款紀錄（日期、金額（元）、備註），按「儲存」後寫入 Firestore；取消編輯不留痕跡。
2. 檢視模式顯示唯讀紀錄列表與「已繳款合計／繳款比例」；比例 = 合計(元) ÷ 成交總價(萬)×10000，四捨五入到 0.1%。
3. 成交總價未填時比例顯示 `—` 並有提示，不報錯。
4. 選擇圖檔後立即顯示本地小縮圖並標示「待上傳」，點縮圖可開燈箱放大確認照片內容；按「儲存」才上傳至該戶別 `driveFolderUrl` 資料夾，檔名符合 `{YYYYMMDD}-{戶別}-{金額}-{備註}` 規則（備註含特殊字元會被清洗）。
5. 上傳失敗時中止儲存並提示，資料不會寫入一半。
6. 列表縮圖可點開 Drive 檢視頁；縮圖載入失敗時顯示 icon 仍可點開。
7. 事後修改紀錄的日期／金額／備註並儲存後，Drive 檔案自動改名同步；刪除紀錄後 Drive 圖檔仍保留。
8. 未設定 `driveFolderUrl` 的戶別：可新增純文字紀錄，圖檔欄位停用並提示。
9. 編輯模式中調整金額，試算比例即時更新。
10. 檢視模式（不進修改銷控）可直接「新增繳款紀錄」：對話框輸入日期／金額／備註、選附憑證圖檔（縮圖＋燈箱確認），儲存後立即寫入並反映在列表與繳款比例；隨後進入修改銷控也能看到該筆紀錄。

## 9. 已確認事項（2026-08-16）

| 議題 | 決議 |
|---|---|
| 編輯權限 | 與修改銷控相同，不另設限制 |
| 比例分母 | 成交總價含車位（`price_transaction_total`） |
| 圖檔回看 | 要，列表縮圖可點開預覽 |
| 金額單位 | 元（比例計算時將成交總價萬→元換算） |
| 儲存時機 | 隨修改銷控一起儲存（延遲提交） |
| 圖檔同步 | 改紀錄自動改名 Drive 檔案；刪紀錄不刪圖 |
| 無 `driveFolderUrl` | 停用圖檔欄位並提示，純文字紀錄仍可新增 |
| 快速新增（2026-08-16 追加） | 檢視模式免進修改銷控即可直接新增（即時儲存）；編輯／刪除仍在修改銷控內 |

## 10. 檢視模式完整 CRUD（2026-08-22 追加）

檢視模式（戶別整合 Modal 與列表模式「繳款紀錄一覽」浮動視窗）免進修改銷控即可完整 CRUD，逐筆即時儲存：

- **列表操作欄**：`PaymentRecordsPanel` 檢視模式新增「操作」欄（編輯 ✏️／刪除 🗑️），僅在父層傳入 `quickUpdateHandler` / `quickDeleteHandler` 時顯示；手機版操作鈕靠右整列顯示。
- **編輯**：複用快速新增對話框（`mode: 'add' | 'edit'`），可改日期／金額／備註，憑證支援「更換圖檔」（舊圖保留於 Drive，僅換 `file` 欄位）與「移除憑證」（`file` 設 null，Drive 圖檔保留，標記後可復原）；無換圖時內容異動由後端自動同步 Drive 檔名（失敗回 `renameWarning`，僅 toast 警告）。
- **刪除**：`confirm` 確認後即時刪除該筆，Drive 憑證圖檔保留。
- **新後端 action**（`paymentProofApi`）：
  - `updateRecord`：`{ projectId, unitId, recordId, base64?, removeFile?, date, amount, note }`，先處理圖檔（上傳新圖／移除標記／自動改名），再以 transaction 依 `recordId` 覆寫該筆，回 `{ status, record, renameWarning }`。
  - `deleteRecord`：`{ projectId, unitId, recordId }`，transaction 過濾移除該筆（不驗證日期／金額），回 `{ status, removedId }`。
- **同步機制**：
  - 戶別 Modal：本地 `viewPaymentRecords` 即時更新並 emit `data-updated`；`SalesControlSystem` 已接 `@data-updated="handleRefreshData"` 背景刷新列表。
  - 列表浮動視窗：CRUD 後同步更新 store 原始戶別的 `paymentRecords`（`applyPaymentRecordsLocally`），列表「繳款比例」chip 與資料透視即時重算，免重新載入。
- **權限**：與快速新增相同，限銷控模式（`viewMode === 'sales'`）；報價模式浮動視窗維持唯讀。
