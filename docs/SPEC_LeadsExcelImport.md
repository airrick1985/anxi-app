# SPEC：聯絡名單管理 — Excel 批次匯入（資料移轉強化版）

> 版本：v1.4（2026-08-09，已依實作結果修訂）
> 實作狀態：✅ 已完成（前後端，`batchImportLeadsV2`、`clearProjectLeads` 已部署）
> 相關頁面：`src/views/LeadDistribution.vue`（聯絡名單管理）
> 相關後端：`functions/index.js`（`batchImportAndAssignLeads`、`checkLeadDuplicates`、`onLeadWriteSheetSync`）

## 1. 目標

讓用戶（櫃台／系統管理員）能以 **上傳 Excel 檔案** 的方式，將既有的名單資料**批次移轉**到本系統的 `leads` 資料庫中。

現行系統已有基本的 Excel 匯入（新增名單對話框 → EXCEL 模式），但其定位是「日常小量匯入」；本次目標是強化為可承載**資料移轉等級（數百～數千筆）**的匯入流程，重點包括：

1. 欄位驗證與錯誤阻擋（現況完全無驗證）
2. 大批量寫入效能（現況後端逐筆 `add`，量大時緩慢）
3. 歷史資料欄位支援（移轉時可帶入名單狀態、不考慮原因等回報結果）
4. 匯入結果報告（成功／跳過／失敗明細，可下載）
5. 後端權限驗證補強（現況 callable 未檢查 `request.auth`）

## 2. 範圍

### In scope
- 強化「新增名單」對話框中的 **EXCEL 模式**（不新增獨立頁面）
- 匯入範本下載（擴充欄位 + 範例列 + 填寫說明工作表）
- 前端解析、驗證、預覽、查重、指派、分批上傳、進度顯示
- 後端新版 callable `batchImportLeadsV2`：權限驗證、伺服器端再驗證、批次寫入、結果回傳
- 匯入結果報告（畫面摘要 + 失敗明細 Excel 下載）
- 沿用既有 Google Sheet 自動同步（`onLeadWriteSheetSync`，8 秒防抖）

### Out of scope
- CSV / Google Sheet 直接讀取匯入（僅支援 `.xlsx` / `.xls`）
- `leads.assignedTo` 改為多人陣列（名單歸屬維持單一字串，與銷控 `salesperson` 陣列化無關）
- 匯入 `contactLogs` 洽談歷程子集合（僅匯入名單主檔欄位）
- 文本模式（AI regex 解析）與手動輸入模式的變更
- 匯入客資（`vipGuests`）——本 SPEC 僅處理 `leads`

## 3. 現況盤點（As-Is）

| 項目 | 現況 | 位置 |
|---|---|---|
| 範本下載 | `exportLeadsForImport()`：7 欄（客戶姓名、聯絡電話、來源管道、購屋預算、填表日期、指派銷售、備註） | `LeadDistribution.vue:3443` |
| Excel 解析 | `handleExcelFileSelect()`：XLSX sheet_to_json、欄位別名對應、`normalizePhone/Date/Source` | `LeadDistribution.vue:3783` |
| 欄位驗證 | **無**。電話長度異常僅顯示 hint，不阻擋送出 | `LeadDistribution.vue:982` |
| 查重 | `checkLeadDuplicates`：比對 `vipGuests` / `leads` / `viewing_reservations` 三來源 | `functions/index.js:23206` |
| 既有名單重複 | 前端以 `allLeads` 電話比對 → Dialog 選「跳過／覆蓋」 | `LeadDistribution.vue:1946` |
| 寫入 | `batchImportAndAssignLeads`：**逐筆 `db.collection("leads").add()`**，無 auth 檢查 | `functions/index.js:23441` |
| 指派 | 每筆必須指派銷售，否則中止匯入 | `LeadDistribution.vue:2952` |
| LINE 通知 | `sendLineNotify` 開關已存在（業務＋主管＋系統管理員） | `functions/index.js:23441` |
| Sheet 同步 | `onLeadWriteSheetSync` onDocumentWritten + 8 秒防抖全量覆蓋 | `functions/index.js:25996` |

**主要缺口**：無驗證、無失敗報告、逐筆寫入效能差、歷史狀態欄位無法移轉、後端無權限檢查。

## 4. 使用者流程（To-Be）

```
① 下載匯入範本 → ② 離線填寫 Excel → ③ 上傳檔案
→ ④ 前端解析 + 逐列驗證（錯誤列標紅、可下載錯誤明細）
→ ⑤ 查重（既有 checkLeadDuplicates + 檔案內部重複）
→ ⑥ 預覽表格：確認/調整指派銷售、選擇重複處理策略
→ ⑦ 分批上傳（顯示進度條：n / N 筆）
→ ⑧ 結果報告：成功 X 筆、跳過 Y 筆、失敗 Z 筆（可下載失敗明細 Excel）
```

步驟 ④ 驗證不通過的列**不進入預覽**，於上傳區顯示「有 N 列格式錯誤，請下載錯誤明細修正後重新上傳」；使用者也可選「忽略錯誤列，僅匯入有效列」。

## 5. Excel 範本格式

檔名：`{建案名稱}_名單匯入範本.xlsx`，含兩個工作表：

### 工作表 1「名單資料」

| # | 欄位（表頭） | 別名（相容） | 必填 | 驗證規則 | 寫入欄位 |
|---|---|---|---|---|---|
| 1 | 客戶姓名 | 姓名 | ▲(註1) | 去除前後空白 | `name` |
| 2 | 聯絡電話 | 電話 | ▲(註1) | `normalizePhone()` 後須為 09 開頭 10 碼；市話（0X 開頭 9–10 碼）允許但標黃提示 | `phone` |
| 3 | 來源管道 | 來源 | 否 | 空值 → `未註明`；`normalizeSource()` 正規化 | `source` |
| 4 | 購屋預算 | 預算 | 否 | 自由文字 | `budget` |
| 5 | 填表日期 | 日期 | 否 | `normalizeDate()`：支援 Excel 序號、`YYYY/MM/DD`、`YYYY-MM-DD`；解析失敗 → 該列錯誤；空值 → 匯入當日 | `date` |
| 6 | 指派銷售 | 銷售人員、業務 | 否(註2) | 姓名須能比對到該建案 `salesStaff` 名單，比對不到 → 預覽中列為「待指派」 | `assignedTo` / `assignedName` |
| 7 | 備註 | 備註事項 | 否 | 自由文字 | `note` |
| 8 | 名單狀態 (新增) | 聯絡狀況 | 否 | 僅接受該建案 `projectSettings.statusOptions` 中的值（預設：`不考慮`/`已約賞屋`/`空號`/`未接`）；空值 → `""`（未回報）；非法值 → 該列錯誤 | `status` |
| 9 | 不考慮原因 (新增) | 原因 | 否 | 僅當名單狀態 = `不考慮` 時有效，值須在 `reasonOptions` 內或自由文字（見 §15 未決事項） | `reason` |
| 10 | 最後回報時間 (新增) | — | 否 | 日期格式同填表日期；僅當名單狀態非空時有效 | `lastReportedAt`（轉 Timestamp，Asia/Taipei UTC+8） |

- **註1**：`客戶姓名` 與 `聯絡電話` **至少一項必填**（沿用現行 `name || phone` 邏輯）；電話為空的列無法查重，標黃提示。
- **註2**：「指派銷售」欄可空，但**匯入前每筆仍須完成指派**（於預覽步驟指定，沿用現行強制檢查）。資料移轉時建議在 Excel 直接填妥以免逐筆點選。
- 欄位順序不限，以表頭文字（含別名）比對；未知表頭欄位忽略。
- 第 2 列起為資料列。（實作修訂：範例資料改放在「填寫說明」工作表，不插入資料列，避免「下載目前名單再編輯」情境被範例列污染。）

### 工作表 2「填寫說明」
- 各欄位規則說明、名單狀態合法值與本建案銷售人員清單（產生範本時動態帶入）、填寫範例。
- 工作表名稱：資料表為「名單資料」；解析時相容「名單資料」→「聯絡名單」→ 第一張工作表。

## 6. 前端規格

位置：`LeadDistribution.vue` 新增名單對話框 EXCEL 模式（Tab 2），改造 `handleExcelFileSelect` 與新增子流程。

### 6.1 解析與驗證
- 沿用 `XLSX.read` + `sheet_to_json`，擴充別名表（§5）。
- 新增 `validateImportRow(row, ctx)`：回傳 `{ valid, errors: [{ field, message }] }`；`ctx` 帶入 `statusOptions`、`reasonOptions`、`salesStaff`。
- 解析結果分三類：
  - **有效列** → 進入預覽
  - **錯誤列** → 匯總顯示，可下載「錯誤明細.xlsx」（原始列內容 + `錯誤原因` 欄）
  - **警告列**（市話、電話為空、銷售姓名比對不到）→ 進入預覽但標黃
- 單檔上限 **3,000 列**，超過即拒收並提示分檔（避免前端記憶體與 callable payload 風險）。

### 6.2 查重與重複處理策略
- 沿用 `checkLeadDuplicates`（vip / lead / reservation）＋檔案內部重複標示（`internalDuplicateMap`）。
- 與既有 `leads` 電話重複時，重複處理 Dialog 提供三種策略（現行僅前兩種）：
  1. **跳過**：不匯入該列（計入「跳過」）
  2. **覆蓋**：更新既有名單文件（沿用現行 `resolveExcelDuplicates` 覆蓋邏輯，寫 `updatedAt/updatedBy`）
  3. **仍新增**（新增）：照常建立新文件，`statusText` 標記 `⚠️ 重複名單`（資料移轉時同一人多筆名單屬正常情境）
- 提供「全部套用同一策略」快速鍵，避免大量資料逐筆選擇。
- 檔案內部電話重複：僅標示不阻擋，全數照策略處理。

### 6.3 上傳與進度
- 呼叫新 callable `batchImportLeadsV2`（§7），前端以 **每 200 筆一個 chunk** 依序送出。
- 對話框顯示線性進度條與「已匯入 n / N 筆」；任何 chunk 失敗即中止後續 chunk，已成功的 chunk 不回滾，失敗與未送出的列進入失敗明細。
- 匯入期間鎖定對話框（disable 關閉鈕），完成後顯示結果報告。

### 6.4 結果報告
- 摘要卡片：成功 / 覆蓋 / 跳過 / 失敗 各筆數。
- 「下載失敗明細」按鈕：失敗＋跳過列匯出 Excel（原始欄位 + `結果` + `原因` 欄），供修正後重傳。
- 完成後重新載入名單列表（`fetchLeads`）。

### 6.5 LINE 通知
- 匯入對話框已有「發送 LINE 通知」開關；**EXCEL 模式預設為關閉**（資料移轉不應轟炸業務），文本／手動模式維持現行預設。

## 7. 後端規格

### 7.1 新 callable：`batchImportLeadsV2`
- 位置：`functions/index.js`（或新檔 `functions/leadsImport.js` 後於 index.js re-export）
- 設定：`onCall`、region `asia-east1`、**memory 512MiB**、timeout 300s
- 部署：`firebase deploy --only functions:batchImportLeadsV2`

**Request**
```js
{
  projectId: string,
  operator: string,            // 操作者姓名
  sendLineNotify: boolean,     // 預設 false
  chunkIndex: number,          // 第幾個 chunk（0 起算），僅供 log
  leads: [{
    name, phone, source, budget, date, note,
    assignedTo, assignedName,           // 必填（每筆皆已指派）
    status: string,                      // "" 或 statusOptions 內合法值
    reason: string,                      // status === '不考慮' 時有效
    lastReportedAt: string|null,         // 'YYYY/MM/DD'，後端轉 Timestamp（Asia/Taipei）
    statusText: string,                  // 查重標記
    duplicateAction: 'create'|'overwrite'|'skip',
    overwriteLeadId: string|null         // duplicateAction==='overwrite' 時的目標文件 ID
  }]
}
```

**Response**
```js
{
  success: true,
  results: [{ index, action: 'created'|'overwritten'|'skipped'|'failed', leadId, error }],
  summary: { created, overwritten, skipped, failed }
}
```

### 7.2 後端處理邏輯
1. **權限驗證（新增，現行缺失）**：
   - ⚠️ 實作修訂：本 App **未使用 Firebase Auth**（全站無 signIn），`request.auth` 恆為空，故改採專案既有模式（同 `unbindLineIdByAdmin`）：前端傳 `operatorKey`（= userStore.user.key），後端查 `users/{operatorKey}` 與 `userPermissions/{operatorKey}` 驗證
   - roles 含 `系統管理員`/`超級管理員`，或該 `projectId` 之 systems 含 `客資系統-櫃台`；否則 throw `permission-denied`
2. **伺服器端再驗證**（不信任前端）：逐筆重跑 phone 正規化、status 合法值、單 chunk ≤ 200 筆；非法列標記 `failed` 不寫入。
3. **批次寫入**：改用 `db.batch()`（每 batch ≤ 500 個操作）或 `BulkWriter`，取代逐筆 `add`：
   - `create`：`batch.set(newRef, payload)`
   - `overwrite`：`batch.update(existingRef, {...欄位, updatedAt, updatedBy: operator})`
   - `skip`：不寫入，直接記入 results
4. **寫入 payload**：沿用現行欄位（§3 探索之 `leads` 結構），差異：
   - `rawText: 'EXCEL匯入'`
   - `status` / `reason` / `lastReportedAt` 依 request 帶入（歷史資料移轉）；`lastReportedAt` 以 Asia/Taipei 時區解析為當日 12:00 Timestamp
   - `importedBy: operator`、`createdAt: now`、`isDeleted: false`
5. **LINE 通知**：`sendLineNotify === true` 時沿用現行通知邏輯，但**依業務分組彙總為一則**（「您有 N 筆新名單」Flex），不逐筆發送。
6. **既有 `batchImportAndAssignLeads` 保留**供文本／手動模式沿用；後續可擇期收斂到 V2（記入 §15）。

### 7.3 Google Sheet 同步
- 無需變更：批次寫入仍逐文件觸發 `onLeadWriteSheetSync`，8 秒防抖確保只在最後執行一次全量覆蓋。
- 驗收時需確認 3,000 筆等級寫入後同步僅執行一次且成功。

## 8. 權限

| 動作 | 允許角色 |
|---|---|
| 看見「新增名單」按鈕、進入 EXCEL 模式 | `isAdmin`（系統管理員/超級管理員）或 `isReceptionist`（客資系統-櫃台）＝現行 |
| 呼叫 `batchImportLeadsV2` | 同上（**後端實際驗證**，見 §7.2-1） |

## 9. 效能與限制

| 項目 | 限制 |
|---|---|
| 單檔列數上限 | 3,000 列 |
| 前端 chunk 大小 | 200 筆／次 callable |
| 後端 batch 大小 | ≤ 500 操作／batch |
| 查重 `in` 查詢 | 沿用現行 10/30 筆分批 |
| 業務名單 `__name__ in` 30 人上限 | 現行 `fetchProjectStaff` 限制，若建案人員 > 30 需改為分批查詢（同場修復） |
| Callable timeout | 300s（200 筆遠低於此） |

## 10. 錯誤處理

| 情境 | 行為 |
|---|---|
| 檔案非 .xlsx/.xls、無法解析、無可辨識表頭 | 上傳區錯誤提示，不進入預覽 |
| 部分列驗證失敗 | 顯示錯誤列數＋下載錯誤明細；可選擇僅匯入有效列 |
| chunk 呼叫失敗（網路/後端錯誤） | 重試 1 次，仍失敗則中止後續 chunk；已成功不回滾；未完成列進失敗明細 |
| 後端單筆寫入失敗 | 該筆 `failed` 記入 results，不影響同 chunk 其他筆 |
| 權限不足 | 前端 toast「無匯入權限」，記錄 console |

## 11. 驗收條件

1. 下載範本含「名單資料」＋「填寫說明」兩工作表，狀態合法值隨建案設定動態產生。
2. 上傳含錯誤列（非法日期、非法狀態值、電話 8 碼）的檔案 → 錯誤列被擋下且可下載錯誤明細；有效列可續行。
3. 匯入 1,000 筆全新名單：全數成功、進度條正確、完成時間 < 60 秒、Google Sheet 僅同步一次且內容一致。
4. 含既有電話重複的檔案：三種策略（跳過／覆蓋／仍新增）行為正確，覆蓋後 `updatedAt/updatedBy` 正確。
5. 帶「名單狀態＝不考慮＋原因」的歷史資料匯入後，列表統計、狀態篩選、Sheet 匯出的「聯絡狀況／不考慮原因」欄位皆正確顯示。
6. `sendLineNotify` 關閉時不發送任何 LINE 訊息；開啟時每位業務僅收到一則彙總通知。
7. 未登入或非櫃台/管理員直接呼叫 `batchImportLeadsV2` → 後端回 `unauthenticated`/`permission-denied`。
8. 一般業務（客資系統-銷售）登入時看不到匯入入口。

## 12. 部署

- 後端：`firebase deploy --only functions:batchImportLeadsV2`（memory 512MiB）
- 前端：`npm run release:safe`
- 發版前依 commit-notes 流程更新 `CHANGELOG.md`

## 13. 檔案異動清單（預估）

| 檔案 | 異動 |
|---|---|
| `src/views/LeadDistribution.vue` | EXCEL 模式 UI/驗證/進度/結果報告、範本下載擴充、重複策略第三選項 |
| `src/api.js` | 新增 `batchImportLeadsV2API()` |
| `functions/index.js`（或 `functions/leadsImport.js`） | 新增 `batchImportLeadsV2`、通知彙總 |
| `docs/SPEC_LeadsExcelImport.md` | 本文件 |

## 14. 風險與注意事項

1. 任何 `leads` 寫入都觸發 Sheet 全量同步——防抖已保護，但覆蓋策略走前端 `updateDoc` 的舊路徑需一併改走 V2 後端，避免權限與同步行為不一致。
2. `lastReportedAt` 轉 Timestamp 一律以 **Asia/Taipei (UTC+8)** 解析，避免日期偏移一天。
3. 前端 `type === 'purchased'`（本案已購戶）分支為死碼（後端從未回傳），本次不處理，勿依賴。
4. 移轉大量資料時 LINE 通知務必預設關閉，防止誤發轟炸。

## 15. 未決事項（已定案，依建議實作）

1. 「不考慮原因」：✅ 不限制在 `reasonOptions` 內——合法值直接採用，其他值照存為自由文字（歷史資料原因選項可能與現行設定不同）
2. 匯入「已刪除／無效名單」：✅ 不支援，移轉時直接不放入檔案
3. 既有 `batchImportAndAssignLeads`：✅ 保留供文本／手動模式使用，V2 僅用於 EXCEL 模式（收斂列為第二階段）
4. 覆蓋策略：✅ Excel 有填指派銷售（且比對成功）才覆蓋歸屬（`overwriteAssigned` 旗標），空值保留原歸屬

## 16. 實作備註（v1.1，含 code review 修正）

- 後端：`functions/index.js` 新增 `batchImportLeadsV2`（onCall、asia-east1、512MiB、timeout 300s）與 `_sendLeadBatchSummaryText`（彙總通知，文字訊息，multicast）
- 前端：`src/api.js` 新增 `batchImportLeadsV2API`；`LeadDistribution.vue` 新增驗證錯誤 Dialog、進度 Dialog、結果報告 Dialog，重複策略新增「仍新增」，覆蓋不再走前端 `updateDoc`
- EXCEL 模式解析成功時自動將 LINE 通知開關預設為關閉（文本／手動模式維持預設開啟）
- 預覽表格新增「📋 歷史回報」chip 顯示移轉資料的狀態/原因

### Code review 後的強化（8 角度審查）

1. **冪等保護**：前端每場匯入產生 `importSessionId`，建立的名單寫入 `importSessionId/importChunk/importRowIndex` 標記；chunk 重試時後端先查詢已寫入的列並跳過，避免 timeout 重試造成重複建立
2. **覆蓋安全**：後端驗證覆蓋目標的 `projectId` 歸屬與 `isDeleted` 狀態；同批重複目標去重（同電話多列只覆蓋一次，避免 db.batch 對同文件寫兩次整批失敗）
3. **覆蓋欄位保護**：只覆蓋 Excel 實際有填的欄位（`_has*` 旗標），空欄位保留既有資料，避免預設值（今日/未註明）洗掉原始資料；狀態變更時一併重設 `reason`/`lastReportedAt`，避免殘留前一狀態的不考慮原因
4. **重複比對取最新**：同電話多筆既有名單時，以最新一筆（createdAt desc 第一筆）作為覆蓋目標（修正原程式取到最舊一筆的問題）
5. **contactLogs 一致性**：移轉的歷史狀態同步寫入 `leads/{id}/contactLogs`（note 標記「歷史資料移轉匯入」），維持統計圖表（collectionGroup）與名單狀態一致
6. **通知終場彙總**：chunk 呼叫一律 `sendLineNotify:false`，全部完成後由前端帶 `notifyStats`（整場統計）做最後一次通知呼叫——每位業務一則、主管/管理員一則總結；單一收件人失敗不影響其他人（Promise.allSettled）
7. **查重分批**：`checkLeadDuplicates` 改每 300 支電話一批呼叫（避免 3000 筆單次呼叫超過 60 秒限制）；查重缺漏時顯示明確警告
8. **日期強化**：Excel 序號日期限制 1990–2100 範圍（防止 20260115 被當序號產生荒謬日期）、2/31 進位防呆、序號用 UTC 取值避免時區偏移；檔名日期與 Timestamp 轉字串一律以 Asia/Taipei 取值
9. **批次寫入**：每批 100 列（每列最多 2 個操作：名單＋contactLog），單 chunk 200 列
10. **已知未處理**（列為第二階段）：V1 `batchImportAndAssignLeads`（文本/手動模式）仍無後端權限驗證；大量寫入時 `onLeadWriteSheetSync` 觸發的 debounce 文件短暫爭用（不影響最終同步結果）

## 17. 快速匯入模式（v1.2）

實測 1,400+ 筆資料在步驟二（預覽表格）嚴重卡頓——預覽將每列渲染為多個可編輯 Vuetify 元件（數千個元件），非資料處理瓶頸。新增「快速匯入模式」跳過預覽直接寫入：

- **入口**：EXCEL 分頁新增快速模式開關（**預設開啟**）＋整批重複策略選單（跳過／覆蓋／仍新增）；關閉開關即回到原預覽流程
- **流程**：解析＋逐列驗證（不變）→ 以電話比對既有名單分類 → **輕量確認摘要 Dialog**（總數、全新/重複筆數、指派分佈、策略、LINE 通知開關）→ 直接走共用分批上傳流程（進度條、冪等重試、結果報告）
- **限制與規則**：
  - 每列「指派銷售」必填且須比對到本建案人員，否則列為錯誤列（無預覽可補指派）
  - 僅以電話比對既有聯絡名單，**不做客資（vipGuests）／賞屋預約交叉查重**（避免 3,000 筆呼叫 `checkLeadDuplicates` 逾時）；statusText 僅標記「✨ 全新名單」或「⚠️ 重複名單 (快速匯入)」
  - 重複策略為整批套用（不逐筆選擇）；覆蓋時同電話多列僅第一列生效，其餘計入跳過
  - 大量資料緩衝存於非 reactive 變數（避免上千列深層代理造成卡頓）
- **後端**：無需變更，沿用 `batchImportLeadsV2`（含冪等、覆蓋欄位保護、contactLogs、終場彙總通知）

## 18. 「舊資料上傳」特殊狀態（v1.3）

**問題**：移轉的舊名單若「名單狀態」空白（`status: ""`），會被 `scheduledLeadReminder`（查詢條件 `status == ""`）視為未處理，定時 LINE 提醒會持續通知被指派的業務。

**解法**：新增系統特殊狀態 **`舊資料上傳`**（非 `projectSettings.statusOptions` 選項）：

- **EXCEL 分頁新增開關**（預設開啟）：「未填名單狀態的列自動標記為『舊資料上傳』」，於解析時套用；關閉則維持原行為（空白＝未處理）
- Excel 也可直接在「名單狀態」欄填 `舊資料上傳`，前後端驗證均接受
- **提醒排程免改**：`scheduledLeadReminder` 只查 `status == ""`，非空狀態自動排除
- **不寫 contactLogs**：`舊資料上傳` 僅為移轉標記、非實際洽談回報（後端跳過該狀態的 log 寫入）
- **UI 支援**：狀態篩選器加入「舊資料上傳」選項；狀態分佈圖與 chip 顏色使用藍灰 `#607D8B` 區隔
- **後續回報**：業務透過回報 Dialog 回報時會以實際狀態（statusOptions）覆蓋，行為不變
- 統計影響：`leadStats` 的「已完成」以 `status !== ''` 計算，故舊資料上傳計入已完成（符合「非待辦」語意）

## 19. 清除建案全部名單（v1.4，危險操作）

**用途**：資料移轉測試或重置時，一鍵永久刪除「目前建案」的全部聯絡名單。

**權限**：僅限**超級管理員**（前端按鈕僅超管可見；後端 `clearProjectLeads` 以 operatorKey 查 `users.roles` 驗證，非超管一律 `permission-denied`）。

**防呆機制（四層）**：
1. 確認 Dialog 明列影響範圍：目前名單＋垃圾桶已刪除名單＋全部 contactLogs、Google Sheet 同步清空、無法復原
2. 必須勾選「我了解…無法復原」核取方塊
3. 必須逐字輸入建案正式名稱（取自 `projects/{id}.name`，前後端使用同一來源比對，不符即 `failed-precondition` 拒絕）
4. 後端查詢嚴格限定 `where("projectId", "==", projectId)`——**絕不可能影響其他建案**

**實作**：
- 後端 `clearProjectLeads`（onCall、asia-east1、512MiB、timeout 540s）：分頁 300 筆撈取（含 `isDeleted` 名單）→ `recursiveDelete` 逐文件刪除（連同 contactLogs 子集合，併發 20）→ 寫入 `leadsClearLogs` 稽核紀錄（projectId、projectName、operator、deletedCount、clearedAt）
- 前端：標題列新增紅色 `mdi-delete-forever` 按鈕（僅超管可見）→ 開啟 Dialog 時即時讀取 `projects/{id}.name` 作為輸入比對目標
- Sheet 同步：刪除觸發既有 `onLeadWriteSheetSync` 防抖，最後全量同步一次（工作表清空，狀態一致）
- `api.js`：`clearProjectLeadsAPI`（callable timeout 540s，配合大量刪除）
