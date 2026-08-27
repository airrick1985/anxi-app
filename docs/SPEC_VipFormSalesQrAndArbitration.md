# SPEC：vip-form 銷售專屬網址/QR Code 與客資重複櫃台裁決

> 建立日期：2026-08-23（Asia/Taipei）
> 狀態：已與需求方確認決策，待實作

---

## 1. 需求總覽

1. **銷售專屬網址 + QR Code**：客資系統-櫃台可在「客戶資料管理」頁為任一銷售人員產生專屬 vip-form 網址與 QR Code（中央文字＝建案名稱＋銷售姓名、可調文字大小、大/中/小尺寸下載 PNG）。
2. **自動歸屬**：客戶掃銷售專屬 QR 填寫 vip-form 後，若該筆客資（同建案同電話＝同一份 `vipGuests` 文件）**尚無歸屬銷售**，自動歸給該銷售。
3. **櫃台裁決通知**：留資後若同一文件的歷次提交出現多位不同銷售人員，除既有重複提醒外，**再發一則 LINE 給客資系統-櫃台**，附連結前往裁決頁，由櫃台決定該筆客資歸屬給哪一位銷售（不重複建立文件）。
4. **裁決紀錄**：每次裁決留痕，前端有 UI 供櫃台查看。

## 2. 決策紀錄（已與需求方確認）

| # | 議題 | 決策 |
|---|------|------|
| Q1 | 網址帶銷售電話的隱私 | 接受。沿用客戶資料表既有 `?sp=銷售電話&sn=銷售姓名` query 慣例 |
| Q2 | 既有文件已歸屬 A、B 掃碼帶入 | **不自動覆蓋（保留 A）**，交由櫃台裁決通知處理，櫃台選誰就歸誰 |
| Q3 | 「重複的銷售人員」範圍 | **(a) 同文件的歷次提交紀錄**（submissions 中不同銷售，去重） |
| Q4 | 裁決時效與暫時歸屬 | 櫃台隨時可再改，只留裁決紀錄。裁決前暫時歸屬規則：**原本無歸屬 → 最新提交的銷售自動成為歸屬**；已歸屬 → 保留原歸屬。裁決頁預設選項＝目前歸屬者 |
| Q5 | 通知開關 | 跟著既有 `reminderSettings.counterDuplicate.lineNotify` 走，不另設開關 |
| Q6 | QR 下載檔名 | `{建案名稱}_{銷售姓名}_貴賓資料表.png` |
| 優化1 | 新貴賓通知收斂 | 一起做：有歸屬銷售時，「✨新貴賓資料」只發給歸屬銷售本人＋櫃台 |
| 優化2 | 功能擺放位置 | 客戶資料管理頁（CustomerManagement.vue）工具列，限櫃台 |
| 優化3 | 裁決紀錄 | `vipGuests.arbitrationLog[]` 留痕，裁決頁提供 UI 查看 |

## 3. 名詞與既有架構對照

- **銷售人員 KEY**：`users` collection 的 doc id ＝ 手機號碼（前端慣稱 `userKey` / `phone`）。
- **客資文件**：`vipGuests/{projectId}_{電話}`（database id：`anxi-app`），docId 規則見 `functions/index.js` `_handleSubmitVipForm`。
- **歸屬欄位**：`latestSalesName`（姓名）、`latestSalesPhone`（＝users doc id）。
- **權限**：Firestore `userPermissions/{電話}`.`permissions[projectId].systems` 含字串 `'客資系統-櫃台'`。前端以 `userStore.hasProjectPermission()`／`CustomerManagement.vue` 的 `isCurrentUserCounter` 檢查；後端以 `where('permissions.${pid}.systems', 'array-contains', '客資系統-櫃台')` 查詢或讀 doc 判斷。
- **專屬網址格式**（沿用 CustomerDataSheet 慣例）：

```
https://anxismart.com/#/vip-form/{projectId}?sp={銷售電話}&sn={銷售姓名(URL encode)}
```

---

## 4. 功能一：銷售專屬網址 + QR Code 產生器（前端）

### 4.1 入口

- 檔案：`src/views/CustomerManagement.vue`
- 位置：`management` tab 工具列（現有「重新整理／新增客戶／AI客資分析」旁）新增按鈕 **「銷售專屬表單連結」**（icon 建議 `mdi-qrcode-plus`）。
- 顯示條件：`isCurrentUserCounter`（既有 computed）為 true 才顯示。

### 4.2 產生器 Dialog（新元件 `src/components/VipFormSalesLinkDialog.vue`）

1. **銷售人員下拉**：資料來源沿用 `CustomerManagement.vue` 既有 `loadProjectStaff()`（回傳 `{ name, phone }` 陣列，為該建案具客資系統權限的人員）。
2. 選定後即時顯示：
   - 專屬網址（唯讀 text field＋複製按鈕，複製沿用既有 clipboard 寫法）。
   - 「產生 QR Code」按鈕 → 開啟 `QrCodeGenerator.vue`。
3. `sn` 以 `encodeURIComponent` 處理中文（vue-router query 物件寫法會自動處理）。

### 4.3 `QrCodeGenerator.vue` 擴充（向下相容，不影響既有呼叫端）

新增兩個選填 props：

| Prop | 型別 | 說明 |
|------|------|------|
| `defaultOverlayText` | String | 有值時，dialog 開啟即 `overlayMode='text'` 並預填 `overlayText`（本功能傳入 `` `${建案名稱}\n${銷售姓名}` `` 兩行） |
| `downloadFileName` | String | 下載檔名基底（不含副檔名），未提供則維持現行 `qrcode` |

- 中央文字大小調整：**已有** fontSize slider（8–32px），不需新做。
- 尺寸大/中/小（400/300/200px）：**已有** `selectedSize` toggle，不需新做。
- QR 容錯等級：維持既有 `errorCorrectionLevel: 'H'`。
- 本功能傳入 `downloadFileName` ＝ `{建案名稱}_{銷售姓名}_貴賓資料表`，下載結果為 `{建案名稱}_{銷售姓名}_貴賓資料表.png`。
- 修改點：`downloadImage()` 內兩處 `qrcode.${extension}` 改為 `${props.downloadFileName || 'qrcode'}.${extension}`；`watch(dialogVisible)` 初始化區塊改為依 `defaultOverlayText` 預設 overlay 狀態。

---

## 5. 功能二：vip-form 帶入銷售歸屬

### 5.1 前端 `src/views/VipForm.vue`

1. 加 `useRoute()`，讀取 `route.query.sp`（銷售電話）與 `route.query.sn`（銷售姓名）。
2. `handleSubmit()` 送出前注入：
   - `formData['銷售人員電話'] = sp`
   - `formData['銷售人員'] = sn`
   - 兩者皆無值時不注入（維持現行行為）。
3. `currentUrl` computed（現行刻意剝掉參數）：**改為保留 `sp`/`sn`**，讓銷售在自己專屬頁面內開分享 QR 時不會掉歸屬；其他參數仍剝除。
4. 客戶端頁面**不顯示**接待銷售資訊（避免干擾客戶填寫）。

### 5.2 後端 `functions/index.js` `_handleSubmitVipForm`

**(1) sp 驗證（transaction 外先做）**：若 `formData['銷售人員電話']` 有值，讀 `users/{sp}`：

- 查無此人 → **忽略** `銷售人員`/`銷售人員電話` 兩欄（視為未帶參數），表單照常送出。
- 查有 → 以 `users.name` **覆蓋** `formData['銷售人員']`（以系統資料為準，防網址竄改 `sn`）。

**(2) 歸屬寫入規則（取代現行第 20646–20655 行的無條件覆蓋）**：

| 情境 | 現有 `latestSalesPhone` | 本次提交 sp | 結果 |
|------|------|------|------|
| 新文件 | — | 有 | 寫入 sp/sn |
| 新文件 | — | 無 | `null`（現行行為） |
| 舊文件 | 空 | 有 | **自動歸給 sp**（更新 `latestSalesName`/`latestSalesPhone`） |
| 舊文件 | ＝sp | 有 | 不變 |
| 舊文件 | ≠sp（已歸屬他人） | 有 | **保留原歸屬，不覆蓋**（submission 照記，裁決通知由 trigger 處理） |
| 舊文件 | 任意 | 無 | 不變（不得清空既有歸屬） |

> 注意：`submissions[]` 的 submissionLog 仍完整記錄本次提交的 `銷售人員`/`銷售人員電話`，作為裁決頁候選清單來源。

---

## 6. 功能三：櫃台裁決 LINE 通知（後端）

### 6.1 位置

`functions/index.js` `exports.onVipGuestDuplicate`（Firestore trigger，`vipGuests/{docId}`，database `anxi-app`）——在既有「任務 B（同文件重複提交）」之後新增「**任務 C：櫃台裁決通知**」。既有任務 A/B 的通知**維持不變**。

### 6.2 觸發條件（全部成立才發送）

1. 本次事件為 submissions 新增（`after.submissions.length > before.submissions.length`；新建文件視 before 為空）。
2. 非 Excel 匯入（沿用既有 `importSource` 提前退出）。
3. 從 `after.submissions[]` 收集所有非空的 `(銷售人員電話, 銷售人員)`，以電話去重後 ≥ 2 位 ⇒ 存在歸屬衝突。
4. `reminderSettings.counterDuplicate.lineNotify === true`（沿用既有開關，Q5 決策）。

> 防重發：只在「本次新增的 submission 使去重後銷售數量首次達到新組合」時發送——實作上比較 before/after 的去重銷售集合，**集合有變化（新增了一位新銷售）才發**；同一位銷售重複提交不再發。

### 6.3 訊息格式（純文字，發送對象：僅該建案「客資系統-櫃台」）

```
🔔 客資歸屬裁決通知
建案：{建案名稱}
客戶：{latestName}（{phone}）{－目前歸屬銷售姓名，若有}
該筆資料與以下銷售人員重複：
・王小明
・李小花
請前往選擇歸屬人員：
https://anxismart.com/#/vip-guest-arbitration/{projectId}/{docId}
```

### 6.4 發送實作

- 既有 `sendLineNotification()` 會同時依開關發櫃台＋銷售，本通知**僅發櫃台**：擴充該函式加選填參數 `options = { audience: 'both' | 'counterOnly' }`（預設 `'both'`，既有呼叫端不受影響），`counterOnly` 時只跑櫃台收件者查詢、只看 `counterDuplicate.lineNotify` 開關。
- 電話→LINE ID 轉換、`multicast`、429 重試皆沿用既有邏輯。

---

## 7. 功能四：裁決頁（前端新頁 + 後端 API）

### 7.1 路由

```js
// src/router/index.js
path: '/vip-guest-arbitration/:projectId/:docId',
name: 'VipGuestArbitration',
component: () => import('@/views/VipGuestArbitration.vue'),
props: true,
meta: { layout: DefaultLayout, title: '客資歸屬裁決', requiredAnySystem: ['客資系統-櫃台'] }
```

未登入者由既有路由守衛導向登入；無櫃台權限者阻擋（沿用既有 `requiredAnySystem` 機制）。

### 7.2 頁面 `src/views/VipGuestArbitration.vue`

**載入**：呼叫 `customerApi` 新 action `fetchVipGuestArbitration`（見 7.3），顯示：

1. **客戶資訊卡**：客戶姓名、電話、建案名稱、目前歸屬（`latestSalesName` 或「未歸屬」）。
2. **候選銷售清單**（radio list）：
   - 來源＝submissions 去重後的銷售人員（Q3 決策 (a)）。
   - 每位候選附註：最近一次提交時間（台灣時間格式）。
   - **預設選中＝目前 `latestSalesPhone`**；若文件無歸屬，預設＝最新一筆有銷售的 submission 的銷售。
   - 下方另提供「選擇其他銷售人員」展開下拉（該建案全部具客資權限人員），涵蓋例外狀況。
3. **確認按鈕**：呼叫 `arbitrateVipGuestSales`（見 7.3），成功後顯示結果並刷新。
4. **裁決紀錄區**（timeline，倒序）：`{裁決人姓名} 於 {時間} 將歸屬由 {原銷售或未歸屬} 改為 {新銷售}`。已有裁決時頁面頂部顯示「最近裁決：已由○○○於{時間}裁決給{銷售}」，**仍可再次裁決**（Q4 決策）。
5. 排序一律前端處理（勿在 Firestore 查詢用 where+orderBy）。

### 7.3 後端 API（掛在 `customerApi`，需登入；`vipFormApi` 為公開端點，不可放這裡）

**action `fetchVipGuestArbitration`**

- 參數：`{ projectId, docId, operatorKey }`
- 權限：operator 需具該建案 `客資系統-櫃台`，或 roles 含 `系統管理員`/`超級管理員`（比照既有 Excel 匯入 gate 寫法）。
- 回傳：

```js
{
  projectName,
  customer: { latestName, phone, latestSalesName, latestSalesPhone },
  candidates: [ { phone, name, lastSubmittedAt } ],   // submissions 去重
  allSalesOptions: [ { phone, name } ],               // 該建案具客資權限人員
  arbitrationLog: [ ... ]                             // 見 8.
}
```

**action `arbitrateVipGuestSales`**

- 參數：`{ projectId, docId, targetSalesPhone, operatorKey }`
- 權限：同上。
- Transaction 內：
  1. 讀 `vipGuests/{docId}`，不存在 → error。
  2. 讀 `users/{targetSalesPhone}` 取 `name`，查無 → error。
  3. 更新 `latestSalesName`/`latestSalesPhone`、`updatedAt`。
  4. **歸屬唯一化**：客戶列表依 submissions 的銷售人員分組、每位銷售各一列，因此裁決同時把「非目標銷售」全部加入既有冷刪除欄位 `deletedSales`（目標銷售若曾被冷刪除則移除恢復），使該筆客資只顯示於目標銷售名下；誤裁可用既有還原功能或再次裁決復原。
  5. `arbitrationLog` 以 `FieldValue.arrayUnion` 追加一筆（結構見 8.）。**不建立新文件**（Q4/需求原文）。
- 併發：後裁決者覆蓋前者，全部留痕即可（Q4 決策）。
- ⚠️ 裁決造成的文件更新**不得觸發**任務 A/B/C 重發通知：裁決只改 `latestSales*` 與 `arbitrationLog`，不動 `submissions` 與電話欄位，依 6.2 條件 1（submissions 長度未增加）自然不會觸發，實作時以此驗證。

## 8. 資料結構變更

`vipGuests` 文件新增欄位（舊文件無此欄位視為空陣列，讀取端須容忍 undefined）：

```js
arbitrationLog: [
  {
    decidedByKey: '0987654321',      // 裁決人 userKey（電話）
    decidedByName: '櫃台小姐',
    decidedAt: Timestamp,             // Timestamp.now()（arrayUnion 內不可用 serverTimestamp）
    fromSalesPhone: '0911111111' | null,
    fromSalesName: '李小花' | null,
    toSalesPhone: '0912222222',
    toSalesName: '王小明',
    removedSales: ['李小花']       // 本次裁決移入 deletedSales 的其他銷售
  }
]
```

無新增 collection、無新增複合索引需求。

---

## 9. 功能五：新貴賓通知收斂（優化 1）

`functions/index.js` `exports.onVipGuestSubmission` 情境 A（`submissionSource === 'public_form'`）：

- 若最新 submission 含 `銷售人員電話` → 收件者改為**當前建案「客資系統-櫃台」＋該銷售本人**（比照既有情境 B `internal_sheet` 的寫法）。
- 若無 `銷售人員電話` → 維持現行廣播（該建案所有櫃台＋銷售）。
- 訊息內容不變。

---

## 10. 修改檔案清單

### 前端

| 檔案 | 動作 |
|------|------|
| `src/views/CustomerManagement.vue` | 工具列新增「銷售專屬表單連結」按鈕（限櫃台）＋掛 dialog |
| `src/components/VipFormSalesLinkDialog.vue` | **新增**：選銷售 → 網址/複製/QR |
| `src/components/QrCodeGenerator.vue` | 加 `defaultOverlayText`、`downloadFileName` props（向下相容） |
| `src/views/VipForm.vue` | 讀 `sp`/`sn` query 注入 formData；`currentUrl` 保留 sp/sn |
| `src/views/VipGuestArbitration.vue` | **新增**：裁決頁（含裁決紀錄 UI） |
| `src/router/index.js` | 新增 `/vip-guest-arbitration/:projectId/:docId` 路由 |
| `src/api.js` | 新增 `fetchVipGuestArbitration`、`arbitrateVipGuestSales`（走 `customerApiRouter`） |

### 後端（`functions/index.js`）

| 函式 | 動作 |
|------|------|
| `_handleSubmitVipForm` | sp 驗證＋歸屬寫入規則（5.2），移除合併路徑的無條件覆蓋 |
| `onVipGuestDuplicate` | 新增任務 C 櫃台裁決通知（6.） |
| `sendLineNotification` | 加 `options.audience` 參數（6.4） |
| `customerApi` | 新增 `fetchVipGuestArbitration` / `arbitrateVipGuestSales` 兩個 action（7.3） |
| `onVipGuestSubmission` | 情境 A 收斂收件者（9.） |

## 11. 部署

- 受影響 functions：`vipFormApi`、`customerApi`、`onVipGuestDuplicate`、`onVipGuestSubmission`。
- 修改到的 function **記憶體一律設 512MB**。
- 部署指令（必要時加 `FUNCTIONS_DISCOVERY_TIMEOUT=120`）：

```bash
firebase deploy --only functions:vipFormApi,functions:customerApi,functions:onVipGuestDuplicate,functions:onVipGuestSubmission
```

## 12. 邊界情況與測試要點

1. **sp 查無 users** → 忽略歸屬，表單照常送出、不報錯。
2. **sn 與 users.name 不符**（網址被改）→ 以 `users.name` 為準寫入。
3. **舊客戶已歸屬 A、掃 B 的 QR** → 歸屬仍為 A；櫃台收到裁決通知；裁決頁預設選 A。
4. **舊客戶無歸屬、掃 B 的 QR** → 自動歸 B；若 submissions 去重後只有 B 一位 → 不發裁決通知。
5. **同一銷售重複掃碼提交** → 不重發裁決通知（去重集合未變化）。
6. **無 sp 的一般公開連結填表** → 行為與現行完全相同（含既有任務 A/B 通知、廣播式新貴賓通知）。
7. **裁決 API 併發** → 後者覆蓋，`arbitrationLog` 兩筆都在。
8. **裁決寫入不觸發重複通知**（submissions 未增加）。
9. **無櫃台權限者開裁決頁** → 路由守衛阻擋；直接呼叫 API → permission-denied。
10. **`counterDuplicate.lineNotify` 關閉** → 不發裁決通知（既有任務 A/B 通知也依原開關邏輯）。
11. **QR 下載檔名**含中文與空白 → 確認瀏覽器下載正常（`{建案名稱}_{銷售姓名}_貴賓資料表.png`）。
12. **既有呼叫 `QrCodeGenerator` 的頁面**（如 BookingRuleManager）行為不變。
13. **vip-form 頁內分享 QR**（currentUrl）在帶 sp/sn 進頁時保留參數；一般進頁時維持乾淨網址。
14. 裁決頁時間顯示一律台灣時間（Asia/Taipei）。

---

## 13. 追加優化：接續填寫 QR Flex（2026-08-27）

> 需求：客戶填完 vip-form 後，除既有 LINE 文字通知外，加發一則 Flex Message，內含「接續完成客戶資料表（步驟 4）」的永久連結與其 QR Code；QR 中央顯示建案名稱＋客資姓名，供現場辨識該筆資料由何人接續完成。

### 決策紀錄

| 議題 | 決策 |
|------|------|
| QR 中央文字 | Flex 絕對定位疊圖（白底框，建案名稱＋姓名置中）。不用 sharp/canvas 燒圖——Functions 環境無中文字型，有豆腐字風險 |
| 觸發範圍 | 僅情境 A（public_form）且文件有歸屬銷售（`latestSalesPhone` 有值）才發；情境 B／Excel 匯入不發 |
| 連結格式 | 沿用客戶模式既有格式，不做短網址：`/#/customer-data-sheet/{projectId}/{docId}?sp={歸屬銷售電話}&sn={姓名}`（docId 固定 → 永久有效） |
| Flex 內容 | 完整卡片：建案標題＋客戶姓名/電話＋歸屬銷售＋QR（中央疊字）＋「開啟客戶資料表」uri 按鈕＋「複製連結」clipboard 按鈕 |
| 收件者 | 與既有「✨新貴賓資料」同一批（該建案客資系統-櫃台＋歸屬銷售本人），同一次 multicast 加一則訊息 |
| 歸屬來源 | 以文件層級 `latestSalesPhone/latestSalesName` 為準（非本次 submission 的 sp），已歸屬他人時 QR 帶原歸屬 |

### 實作

- `functions/index.js` 新增 `_buildVipContinueSheetFlex()`：`qrcode` 套件（純 JS）產 PNG（容錯 H、600px、margin 2）→ 上傳 Storage `vipFormContinueQr/{projectId}/{docId}_{urlHash}.png`（makePublic）→ 組 Flex bubble。
- 冪等：檔名帶連結內容 md5 前 10 碼，同內容重用不重產；歸屬變動 → hash 變 → 自動產新圖。
- `onVipGuestSubmission` 情境 A 內產生 Flex，失敗僅略過 Flex 不阻擋文字通知；multicast 改送 `[text, flex?]`。
- 客戶掃 QR 完成後走既有情境 B「✅客戶資料完成」通知（`submitCustomerSheet` 預設 `internal_sheet`），無需改動。
- 前端無改動。依賴新增：`qrcode@^1.5.4`。部署：`firebase deploy --only functions:onVipGuestSubmission`。
