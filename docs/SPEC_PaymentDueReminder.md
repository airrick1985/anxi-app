# SPEC：繳款紀錄改版、預計繳款與到期通知

> 建立日期：2026-11-06
> 狀態：已實作並通過本機驗證（2026-11-06），待部署與實機驗證
> 前置規格：[SPEC_UnitPaymentRecords.md](./SPEC_UnitPaymentRecords.md)（繳款紀錄）、[SPEC_SalesStatusNotification.md](./SPEC_SalesStatusNotification.md)（LINE／Email 通知）
> 主要檔案：[PaymentRecordsPanel.vue](../src/components/PaymentRecordsPanel.vue)、[UnitDetailModal.vue](../src/components/UnitDetailModal.vue)、[SalesControlSystem.vue](../src/views/SalesControlSystem.vue)、[SalesSettings.vue](../src/views/SalesSettings.vue)、[functions/index.js](../functions/index.js)

## 1. 目標

| 需求 | 做法 |
|---|---|
| 記錄預計繳款日期 | 繳款紀錄新增預計日與預計金額，同一筆可由「預計」轉為「已繳」 |
| 到期通知 | 每日排程檢查，通知銷控管理人員與該戶銷售人員 |
| 建案自訂通知 | 到期前天數、每日發送時間、逾期間隔、Email／LINE，皆依建案設定 |
| 明確區分已繳與預計 | 分區、顏色、圖示、欄位名稱同時區分，不只靠顏色 |
| macOS 風格 | 繳款紀錄全面改用 `macosUi.css` 共用元件 |

### 範圍

**這次要做：**
- 繳款紀錄資料擴充與 macOS 風格改版（檢視、編輯、對話框、列表浮動視窗）
- 建案設定「繳款提醒」分頁
- 每日排程、Email／LINE 彙整通知、測試通知、通知紀錄
- 到期清單頁（含 LINE 入口與標記已繳）
- 銷控列表欄位、逾期標示、資料透視與匯出欄位
- 批次新增預計繳款、從期款範本帶入
- 退戶時清除繳款紀錄（修正現有問題）

**這次不做：**
- 通知買方本人（通知對象僅內部人員）
- 自動比對銀行入帳
- 清理既有退戶戶別遺留的舊紀錄（見 §13）
- 系統身分驗證強化（見 §9.2，建議另案）

## 2. 已確認決策（2026-11-06）

| 議題 | 決議 |
|---|---|
| 預計與已繳的關係 | 同一筆紀錄由預計轉已繳，保留預計日，可看遲繳天數 |
| 繳款比例與請佣 | 只計實繳金額 |
| 提醒時機 | 可設多個到期前天數；每天一個整點發送 |
| 逾期 | 建案自訂間隔（預設每 3 天），可關閉；標記已繳即停止 |
| 訊息形式 | 每人每天彙整一則；管理人員看全案，銷售人員看自己的戶 |
| 管理人員 | 該建案有「銷控系統」權限者預設收，可逐人排除；系統／超級管理員不自動加入 |
| 通知方式 | 管理人員、銷售人員分開勾選 Email／LINE |
| 未綁定 LINE | 有 Email 就改寄，兩者皆無記為未送達 |
| 買方個資 | 通知含買方姓名與電話 |
| 通知連結 | 開啟新增的到期清單頁 |
| 部分繳款 | 實繳少於預計時，詢問是否新增差額的預計繳款 |
| 退戶 | 預計與已繳全部清除，資料保留在退戶備份；Drive 憑證不動 |
| UI/UX | 由設計師決定，見 §6 |

## 3. 使用流程

**建立預計繳款**
1. 在戶別的繳款紀錄按「新增預計繳款」，填預計日、期別，金額選填。
2. 也可從期款範本帶入，或在到期清單頁批次新增。

**收到通知**
1. 建案設定的發送時間一到，系統彙整當天符合條件的項目。
2. 每位收件人收到一則訊息，按鈕開啟到期清單頁。

**收款**
1. 在到期清單或戶別的繳款紀錄按「標記已繳」。
2. 繳款日帶入今天，金額帶入預計金額，可附憑證。
3. 這筆移到「已繳款」區，計入繳款比例，不再提醒。

## 4. 資料模型

資料庫皆為 `anxi-app`。

### 4.1 繳款紀錄

沿用 `salesHouseholds/{projectId}_{unitId}.paymentRecords[]`，舊資料不需轉換。

```js
{
  id: 'pr_1755330000000_ab12',

  // 新增：預計
  expectedDate: '2026-12-20',   // YYYY-MM-DD；舊資料沒有此欄
  expectedAmount: 300000,       // 元，選填
  planSource: 'manual',         // manual | batch | template | balance

  // 沿用：實繳（語意不變）
  date: '',                     // 未繳為空字串
  amount: null,                 // 未繳為 null；預計金額不可寫在這裡
  note: '第 3 期工程款',
  file: null,                   // 僅已繳紀錄可有憑證

  // 新增：標記已繳時寫入
  paidAt: null,
  paidBy: null,

  createdAt: '...',
  updatedAt: '...',
}
```

**關鍵設計：** 預計金額放在獨立的 `expectedAmount`，`amount` 只存實繳。現有加總都只讀 `amount`，所以繳款比例、透視、銷售圖面、請佣不會把預計算成已繳；尚未更新版本的前端在金額計算上也一樣安全。

### 4.2 狀態判定

新增共用工具 `src/utils/paymentRecordStatus.js`，後端對應 `functions/utils/paymentRecordStatus.js`（比照 `salesStatusGroups` 前後端各一份）。

```js
isPaidRecord(r)    = 日期格式有效 && Number(r.amount) > 0
isPlannedRecord(r) = !!r.expectedDate && !isPaidRecord(r)
```

- 預計區：`isPlannedRecord` 為真。
- 已繳區：其餘全部，包含舊資料。

| 顯示狀態 | 條件（台北時間） | 文字 | 顏色 |
|---|---|---|---|
| `upcoming` | 剩 8 天以上 | 剩 N 天 | 灰 |
| `soon` | 剩 1–7 天 | 剩 N 天 | 橘 |
| `today` | 當天 | 今天到期 | 橘底 |
| `overdue` | 已過預計日 | 逾期 N 天 | 紅 |
| `paid` | 已繳 | 已繳 | 綠 |

已繳且有預計日的紀錄，附註「預計 MM/DD・遲 N 天」或「提前 N 天」；同日不顯示。

### 4.3 建案設定

`projects/{projectId}.paymentReminderSettings`，由 `updateProjectSalesSettings` 寫入。

```js
{
  enabled: false,                 // 預設關閉，建案啟用後才發送
  offsetDays: [7, 3, 1, 0],       // 0 = 到期當天；整數 0–90，最多 6 個
  sendHour: 9,                    // 台北時間整點，06–22
  overdue: { enabled: true, intervalDays: 3 },  // 間隔 1–30 天
  managers: { channels: ['email', 'line'], excludedUserKeys: [] },
  salespersons: { channels: ['line'] },
  updatedAt: '...',
  updatedBy: '...',
}
```

某角色的 `channels` 全部取消時，該角色不收通知。

### 4.4 通知紀錄

沿用 `projects/{projectId}/notificationLogs`。

排程以 `paymentDue_{YYYYMMDD}` 為文件 ID，同時作為當日防重複鎖；測試通知使用自動 ID 與 `type: 'paymentDueTest'`。

```js
{
  type: 'paymentDue',
  date: '2026-12-17',
  trigger: 'schedule',             // schedule | manual
  status: 'running',               // running | done | partial | empty | blocked
  leaseUntil: Timestamp,
  itemCount: 12,
  overdueCount: 3,
  attempts: [{
    userKey, name, role,           // role: manager | salesperson | both
    channel,                       // email | line
    fallbackFrom: null,            // LINE 改寄 Email 時為 'line'
    status,                        // sent | failed | skipped
    error,
  }],
  sent: 0, failed: 0, skipped: 0,
  noRecipients: false,             // 有到期項目，但沒有任何收件人
  lastError: null,                 // 整次失敗原因（不含買方資料）
  createdAt, updatedAt,
}
```

`attempts[].error` 的代碼：

| 狀態 | 代碼 | 意思 |
|---|---|---|
| `skipped` | `user-not-found` | 找不到使用者帳號（含不合法的 userKey） |
| `skipped` | `no-permission` | 銷售人員已無該建案權限 |
| `skipped` | `no-contact` | 沒有 LINE 也沒有 Email |
| `skipped` | `no-email` | 只勾 Email 但沒有 Email，不會反向改用 LINE |
| `skipped` | `no-user-key` | 戶別只有銷售姓名，沒有 userKey |
| `skipped` | `no-longer-applicable` | 上次失敗，這次已不需發送 |
| `failed` | `missing-line-token`、`no-line-id`、`no-email`、`unknown-channel` | 設定或資料問題 |
| `failed` | 其他文字 | LINE 或寄信的錯誤原文，最多 300 字 |

紀錄不存買方姓名與電話。

## 5. 通知規則

### 5.1 哪些項目要提醒

計算無狀態，不寫回戶別。改預計日會自動重算，標記已繳會自動停止，也不會與修改銷控的整包儲存互相覆蓋。

```
daysLeft = expectedDate - 今天（台北時間）

daysLeft >= 0：offsetDays 包含 daysLeft 才提醒
daysLeft < 0 ：overdue.enabled 且 (-daysLeft) % intervalDays === 0 才提醒
```

略過條件：
- 紀錄已繳。
- 戶別後台狀態為空，或屬於退戶類（`classifySalesStatus` 回傳 `released`）。建案自訂狀態照常提醒。
- 試用建案（`shouldBlockOutbound`），紀錄為 `blocked`。

**已知取捨：** 較晚才建立的預計繳款，只會收到之後符合的天數，不補發已錯過的天數；到期清單一律看得到。

### 5.2 收件人

| 角色 | 來源 | 看到的項目 |
|---|---|---|
| 管理人員 | `userPermissions` 含該建案「銷控系統」，扣除 `excludedUserKeys`；排除系統／超級管理員（同 `formSubmissionNotifier`） | 全案 |
| 銷售人員 | 戶別 `salespersonUserKey`（用 `normalizeSalespersons` 正規化） | 自己的戶 |

- **同時是兩種角色：** 只收一則全案清單，自己的戶標「我的」，管道取兩個角色的聯集。
- **被排除的管理人員：** 若同時是該戶銷售人員，仍收到自己的戶（同表單通知規則）。
- **銷售人員權限檢查：** 必須仍有該建案「銷控系統」或「報價系統」權限，否則略過並記錄 `no-permission`。因通知含買方電話，避免離職或調案人員繼續收到。

### 5.3 發送與備援

1. LINE 有勾但沒綁定：改寄 Email，並記 `fallbackFrom: 'line'`。
2. 同一人同一次只寄一封 Email，不因備援重複。
3. 兩者都無法送達：記 `skipped`，原因 `no-contact`。
4. 發送失敗：記 `failed`，在補發時段內重試失敗項目，已成功的不重送。
5. 當天沒有項目：不發送，紀錄為 `empty`。

### 5.4 訊息內容

**LINE Flex**
- 標題：`[建案名稱] 繳款提醒`；有逾期時標題列用紅色。
- 摘要：逾期 X 筆、今天 Y 筆、即將到期 Z 筆。
- 排序：逾期、今天、即將到期，再依日期。
- 每筆：戶別、狀態、期別、預計日、金額、買方姓名、電話。
- 最多列 10 筆，其餘顯示「另有 N 筆」，避免超過 Flex 大小上限。
- 按鈕：「查看到期清單」。
- `altText` 不放買方資料，因為它會出現在手機通知預覽。

**Email**
- 主旨：`[建案名稱] 繳款到期提醒 N 筆（逾期 X 筆）`，主旨不放買方資料。
- 內容：完整表格，不限筆數；電話可點擊撥號；每位收件人分開寄送。
- 按鈕：「查看到期清單」。

### 5.5 連結

| 來源 | 網址 |
|---|---|
| LINE | `https://liff.line.me/{customerManagement LIFF ID}?paymentDueProjectId={projectId}` |
| Email | `https://anxismart.com/#/payment-due-entry/{projectId}` |

- 正式主機是 GitHub Pages（`anxismart.com`），沒有 SPA rewrite，也沒有 `404.html`；`firebase.json` 的 rewrite 不適用。
- LINE 連結不可寫成 `liff.line.me/{ID}/路徑`：LIFF SDK 會轉成實體路徑 `anxismart.com/路徑`，主機回 404。
- `customerManagement` 的 Endpoint 固定為 `?liff_path=customer-management-entry`，目標放 query。SDK 轉址後是 `/?liff_path=customer-management-entry&paymentDueProjectId={projectId}`，仍在根目錄。`findLiffLaunch` 依參數對到 `/payment-due-entry/{projectId}`，優先於 Endpoint 的 `liff_path`。
- LINE 登入回跳同樣用這個 query，由 `paymentDueLoginRedirectUri` 產生。
- Email 連結不走 LIFF，hash 路由由根目錄載入。LINE 內要用 LIFF 網址才能自動登入：一般網址在 LINE 內建瀏覽器的 `liff.isInClient()` 為 false，會轉到帳密登入。

## 6. UI/UX 設計

### 6.1 設計原則

- 使用 `src/styles/macosUi.css`：`mac-page`、`mac-list`、`mac-tag`、`mac-sheet`、`mac-form-*`、`mac-form-seg`、`mac-btn`、`mac-vfield`、`mac-menu`、`mac-callout`、`mac-dialog-fit`。
- Vuetify 欄位用 `variant="solo" flat density="compact" class="mac-vfield"`，標籤放在欄位上方，手機輸入字級 16px。
- 文字簡短，不加說明段落；手機與桌機的標題、標籤、按鈕文字不可截斷。
- 新頁面避開左上角全站漢堡鈕（預留 44–58px）。
- 狀態標籤沿用 `mac-tag`，若缺顏色就在 `macosUi.css` 新增共用變體（灰／藍／綠／橘／紅），不在各頁重寫。

### 6.2 區分已繳與預計

| 維度 | 預計繳款 | 已繳款 |
|---|---|---|
| 位置 | 上方區塊 | 下方區塊 |
| 主色 | 藍 `#0071e3` | 綠 `#248a3d` |
| 圖示 | `mdi-calendar-clock` | `mdi-check-circle` |
| 日期標籤 | 預計日 | 繳款日 |
| 金額標籤與字重 | 預計金額，一般字重 | 實繳金額，粗體 |
| 主要操作 | 標記已繳 | 查看憑證 |

### 6.3 繳款紀錄面板

```
已繳 1,500,000      繳款比例 25.0%
待繳 1,200,000      下次到期 12/20（剩 3 天）
                 [＋預計繳款]  [＋已繳款]  [範本帶入]

▌預計繳款  2 筆
  12/20   第 3 期工程款            預計 300,000
  [剩 3 天]                       [標記已繳]  ⋯
  ─────────────────────────────────────────
  11/30   第 2 期工程款            預計 300,000
  [逾期 7 天]                     [標記已繳]  ⋯

▌已繳款  3 筆
  11/18   簽約款              ✓ 實繳 600,000  [憑證]
  預計 11/15・遲 3 天                          ⋯
```

- 卡片式列表，桌機與手機共用，不需橫向捲動。
- 預計區依日期由近到遠，逾期在最前；已繳區由新到舊。
- `⋯` 選單：編輯、刪除；已繳且有預計日的紀錄多一個「改回預計」。
- 只有一區有資料時，另一區只顯示一行空狀態，不佔版面。
- 修改銷控（編輯模式）使用相同分區，預設收合；Tab 與浮動視窗預設展開。
- 列表浮動視窗改用 `mac-sheet`，移除青色工具列。
- 燈箱保留縮放、旋轉、PDF 預覽功能，只調整按鈕外觀。

### 6.4 新增與編輯對話框

使用 `mac-sheet` ＋ `mac-dialog-fit`，上方用 `mac-form-seg` 切換「預計繳款｜已繳款」，由入口按鈕預先選好。

| 類型 | 欄位 |
|---|---|
| 預計繳款 | 預計日*、預計金額、期別／備註 |
| 已繳款 | 繳款日*、實繳金額*、期別／備註、憑證、預計日（選填，可補登） |

### 6.5 標記已繳

```
標記已繳                                      ✕
第 3 期工程款・預計 12/20・300,000

繳款日 [今天]        實繳金額 [300,000]
憑證   [選擇檔案]

（實繳少於預計時才出現）
差額 100,000 元
[開關] 新增預計繳款    預計日 [        ]

                         [取消]  [確認已繳]
```

差額開關預設開啟，開啟時預計日必填。新紀錄的備註為「{原備註} 尾款」、`planSource: 'balance'`。

### 6.6 到期清單頁

路由 `/payment-due/:projectId`，手機版為清單列、桌機版為表格，沿用客戶資料與聯絡名單的 `mac-page`、`mac-list` 樣式。

```
繳款到期                               [批次新增]
逾期 3 筆 900,000      7 天內 5 筆 1,500,000

[全部 24] [逾期 3] [7 天內 5] [30 天內 12]   🔍

狀態       戶別  期別        預計日   金額     買方  電話   操作
逾期 7 天  A1   第2期工程款  11/30   300,000  王○○  09..  [標記已繳]
```

- 依預設排序：逾期、今天、即將到期，再依日期。
- 電話可點擊撥號；點戶別開啟該戶繳款紀錄。
- 只有報價權限的銷售人員：只看自己的戶，沒有「標記已繳」與「批次新增」。
- 入口：銷控系統工具列「繳款到期」按鈕；LINE 與 Email 通知按鈕。

### 6.7 建案設定：繳款提醒

`SalesSettings.vue` 在「期款設定」後新增分頁。

```
繳款提醒                                 [啟用 ●]

提醒時機
  到期前    [7 天 ×] [3 天 ×] [1 天 ×] [當天 ×] [＋]
  發送時間  [09:00 ▾]
  逾期提醒  [開關]  每 [3] 天

通知對象
  管理人員  ☑ Email  ☑ LINE        8 位 ›
  銷售人員  ☐ Email  ☑ LINE        該戶銷售人員

  ⚠ 2 人未綁 LINE，改寄 Email；1 人無法通知  ›

測試與紀錄
  [寄測試通知給我]                  通知紀錄 ›

                                       [儲存]
```

- 「8 位 ›」開啟人員清單，可逐人取消，並標示 LINE／Email 綁定狀態。
- 通知紀錄列最近 30 次：日期、項目數、成功、失敗；點開看每位收件人結果與原因。

### 6.8 批次新增

從到期清單頁開啟，三步驟在同一對話框內完成：
1. **內容：** 期別、預計日、金額方式（不填／固定金額／成交總價比例 %）。
2. **選戶：** 依棟別與狀態篩選後勾選；預設只列已成交類狀態。
3. **預覽確認：** 列出每戶金額；已有相同期別與預計日的戶別標示「已存在，略過」。

金額由前端用 `computeUnitFinance`（即時成交總價，含 `salesParkings` 車位）計算後送出，不使用可能過時的 `price_transaction_total`。

### 6.9 從期款範本帶入

從繳款紀錄面板開啟：
1. 選範本，依 `paymentTemplateMatch` 預先選符合條件的範本，規則與付款表、合約製作共用：戶別優付開關（`isPreferredPayment`）決定優付期款或一般期款，建案隱藏優付選項時一律一般期款；該類別沒有符合條件的範本時不預選，提示手動選擇。
2. 用 `runNewCalculationEngine` 依即時成交總價算出各期金額，尾數依範本的餘額項，不另做調整。
3. 勾選要帶入的期別並填預計日；已有相同備註的期別預設不勾。

範本本身沒有日期，所以預計日仍需人工填寫。實作前要先查 `paymentTermTemplates` 的實際公式與子項結構，再決定列出母項或子項。

### 6.10 銷控列表與統計欄位

| 欄位 | 鍵值 | 列表 | 透視／匯出 |
|---|---|---|---|
| 下次預計繳款日 | `next_expected_date` | ✅ 含狀態標籤，可排序 | ✅ |
| 待繳金額(萬) | `pending_total` | ✅ | ✅ |
| 逾期筆數 | `overdue_count` | — | ✅ |
| 到期狀態 | `payment_due_state` | — | ✅ |

手機快速選單的繳款紀錄副標顯示「已繳 25%・下次 12/20」。

## 7. 前端變更

| 檔案 | 變更 |
|---|---|
| `src/utils/paymentRecordStatus.js`（新） | 狀態判定、天數、顯示文字 |
| `src/components/PaymentRecordsPanel.vue` | 依 §6 改版；傳入新欄位給 handler |
| `src/components/payment/MarkPaidDialog.vue`（新） | 標記已繳，面板與到期清單共用 |
| `src/components/payment/PaymentReminderSettings.vue`（新） | 建案設定分頁 |
| `src/components/payment/PaymentPlanBatchDialog.vue`（新） | 批次新增 |
| `src/components/payment/PaymentTemplateImportDialog.vue`（新） | 範本帶入 |
| `src/views/PaymentDueList.vue`（新） | 到期清單頁 |
| `src/views/PaymentDueEntry.vue`（新） | LINE／Email 入口，流程比照 `CustomerLogEntry.vue` |
| `src/utils/liffApps.js` | `customerManagement` 的路由加入 `payment-due-entry/[^/]+`，並支援 `paymentDueProjectId` 參數（§5.5），不新增 LIFF ID |
| `src/router/index.js` | 新增上述兩條路由 |
| `src/components/UnitDetailModal.vue` | 拆分驗證（見下）；badge 與摘要只算已繳；避免覆寫（§8.5） |
| `src/views/SalesControlSystem.vue` | 新增欄位與工具列入口；`payment_records_count` 只算已繳；浮動視窗改版 |
| `src/constants/householdColumns.js`、`src/utils/salesDrawing/fieldFormat.js` | 新增計算欄位，避免可選欄位卻空白 |
| `src/views/SalesSettings.vue` | 新增「繳款提醒」分頁 |
| `src/views/ProductDeck.vue` | 同步產品簡報 |

**一定要改的相容點：**
- `UnitDetailModal.vue` 的 `preparePaymentRecordsForSave` 目前強制每筆都要日期與金額，未改會導致有預計紀錄的戶別無法儲存。改為：預計紀錄驗證 `expectedDate`，已繳紀錄維持原驗證，預計紀錄不做 Drive 改名與上傳。
- `SalesInfoForm.vue` 的狀態金額提示依備註比對現有紀錄。比對到預計紀錄時寫入日期與金額，會自然轉為已繳，保留此行為並加入測試。

## 8. 後端變更

### 8.1 擴充 `paymentProofApi`

- `addRecord`、`updateRecord` 接受 `expectedDate`、`expectedAmount`、`planSource`、`paidBy`。
- 驗證改為：已繳內容（日期＋金額）或 `expectedDate` 至少一組有效；有 `date` 就必須有正整數 `amount`。
- 未繳紀錄不接受 `base64`。
- `addRecord` 目前只保留固定欄位，需加入新欄位，否則會被丟棄。
- 由預計轉已繳時寫入 `paidAt`、`paidBy`。
- 改回預計：`date: ''`、`amount: null`、`removeFile: true`；憑證移至垃圾桶並清空 `paidAt`、`paidBy`。前端先確認。
- `upload`、`rename`、`deleteRecord`、`trashFile` 不變。

### 8.2 新增 `paymentReminderApi`

新檔 `functions/paymentDueReminder.js`，`onCall`、`asia-east1`、`512MiB`。

| action | 權限 | 說明 |
|---|---|---|
| `listDue` | 銷控、報價權限或系統／超級管理員 | 回傳 `canManage` 與項目；無銷控權限者只回自己的戶 |
| `batchAddPlans` | 銷控或管理員 | `{ expectedDate, note, entries: [{ unitId, expectedAmount }] }`，上限 500 戶，逐戶 transaction；相同期別與預計日略過，回傳 `added`、`skipped`、`failed`。單戶失敗不影響其他戶，前端要讀 `failed`，不能只看 `status` |
| `previewRecipients` | 銷控或管理員 | 回傳人員與 `hasLine`／`hasEmail`，不回傳實際 LINE ID 與 Email |
| `sendTest` | 銷控或管理員 | 只寄給操作者，使用假資料，不含真實買方 |
| `listLogs` | 銷控或管理員 | 最近 30 筆紀錄 |
| `runNow` | 系統／超級管理員 | 立即執行當日排程，同樣受防重複鎖保護，供驗收使用。建案未啟用時拒絕；已啟用時不受發送時段限制 |

### 8.3 新增排程 `paymentDueReminder`

```js
onSchedule({
  schedule: '0 * * * *',
  timeZone: 'Asia/Taipei',
  region: 'asia-east1',
  memory: '512MiB',
  timeoutSeconds: 540,
  secrets: ['SENDER_EMAIL', 'GMAIL_APP_PASSWORD', 'ANXISMART_LINE_CRM_TOKEN'],
}, handler)
```

流程：
1. 查 `projects` 中 `paymentReminderSettings.enabled == true` 的建案。
2. 只處理 `sendHour <= 現在時數 <= sendHour + 3` 的建案。超過 3 小時不補發，避免深夜發送。
3. 以 transaction 取得 `paymentDue_{YYYYMMDD}` 租約：
   - `done`、`empty`、`blocked`：略過。
   - `running` 且租約未過期：略過。
   - `partial`：只重試失敗項目。
4. 試用建案寫 `blocked` 後結束。
5. 查 `salesHouseholds where projectId == X`，依 §5.1 篩選。
6. 依 §5.2 組收件人，每人各自組清單。
7. 依 §5.3 發送，單一收件人失敗不影響其他人。每完成一人更新紀錄，逾時中斷時下次只補未完成的部分。
8. 寫入最終狀態。

讀取量約為每個啟用建案每天一次全案戶數，不寫回戶別，不會觸發 `salesHouseholds` 的寫入事件。

### 8.4 通知模組

新檔 `functions/notifications/paymentDueNotifier.js`，純函式 `buildLineFlex`、`buildEmailHtml` 與 `sendDigest`。Email、LINE 比照 `salesStatusNotifier.js`；LINE Token 重用 `viewingReservationReminder.js` 的 `resolveChannelToken`（改為匯出）。

### 8.5 防止修改銷控覆蓋

修改銷控會整包覆寫 `paymentRecords`。有了到期清單後，可能發生：A 開著編輯畫面，B 標記已繳，A 儲存後已繳狀態被蓋回，提醒繼續發送。

做法：
1. `UnitDetailModal` 比對編輯前快照，**繳款紀錄沒變就不送這個欄位**。
2. 有變更時，儲存前重讀戶別；若其他人已改過繳款紀錄（比對各筆 `updatedAt`），中止儲存並提示重新載入。

### 8.6 退戶

- `performCancelPurchase` 的 `householdResetData` 加入 `paymentRecords: []`。
- `cancelledPurchases` 備份已展開完整戶別資料，舊紀錄會保留在備份中。
- `restoreCancelledPurchase` 由備份回寫繳款紀錄，並保留該戶最近一次退戶之後新增、備份沒有的紀錄；舊版程式留下的其他買方紀錄不會併入。`parkingDetails` 不寫回戶別；回傳的 `restoredParkingCount` 只算實際寫入的車位，車位文件一律帶 `projectId`。
- Drive 憑證不動。
- `salesAiAgent` 共用同一函式，一併生效。

## 9. 權限與個資

### 9.1 權限

| 操作 | 條件 |
|---|---|
| 新增／編輯預計、標記已繳 | 同現行繳款紀錄：銷控模式 |
| 批次新增、建案提醒設定 | 銷控系統權限，或系統／超級管理員 |
| 到期清單（全案） | 銷控系統權限，或系統／超級管理員 |
| 到期清單（自己的戶，唯讀） | 報價系統權限且為該戶銷售人員 |

### 9.2 風險提醒

- **買方電話會留在收件人的 LINE 與信箱。** 這是已確認的決策；本規格以 `altText` 與主旨不含個資、銷售人員權限檢查、紀錄不存個資來降低外洩面。
- **現有 callable 沒有伺服器端身分驗證。** 專案未使用 Firebase Auth 權杖，`userKey` 由前端傳入，`paymentProofApi` 目前甚至沒有權限檢查。本功能沿用 `userKey` 權限判斷，並未解決根本問題。因標記已繳影響財務資料、`listDue` 回傳買方個資，建議另案強化。

## 10. 部署與發版

| 步驟 | 內容 |
|---|---|
| 1. Cloud Functions | `FUNCTIONS_DISCOVERY_TIMEOUT=120 firebase deploy --only functions:paymentProofApi,functions:paymentReminderApi,functions:paymentDueReminder,functions:cancelPurchase,functions:salesAiAgent,functions:restoreCancelledPurchase,functions:syncSalesHouseholdsToSheet,functions:onSalesHouseholdWrite,functions:syncCancelledPurchasesToSheet,functions:onCancelledPurchasesWrite` |
| 2. 前端 | 依 commit-notes 更新 CHANGELOG 後 `npm run release:safe` |
| 3. 啟用 | 先在測試建案啟用並驗收，再由各建案自行開啟 |

- 順序必須先後端再前端。舊前端搭配新後端，金額計算不受影響；但舊分頁重新整理前，無法儲存含預計紀錄的戶別。
- 不需新增 Firestore 複合索引，舊資料不需轉換。
- 建案預設關閉，部署後不會自動發送。
- 前端不新增 `VITE_*`，LIFF ID 留在 `liffApps.js`；後端比照 `viewingReservationReminder.js` 寫成常數。
- LINE 連結的訊息一送出就固定（§5.5）。部署後才發送的訊息用新格式；在前端發布前點開會進客資系統入口，發布後進到期清單。部署前已送出的訊息是舊路徑格式（`liff.line.me/{ID}/payment-due-entry/…`），前端發布後仍是 404，驗收要用部署後新發送的訊息。

## 11. 測試計畫

### 11.1 自動化

**`functions/tests/paymentDueReminder.test.cjs`（`node:test`）**
- 狀態判定：舊資料、純預計、預計轉已繳、改回預計、日期有值但金額空白。
- 台北時區邊界：UTC 15:59 與 16:00 的「今天」不同。
- 提醒矩陣：前 7／3／1／0 天、不在清單的天數、逾期整除與不整除、逾期關閉。
- 發送時段：整點、補發時段內、超過補發時段。
- 防重複：`done` 不重發、`partial` 只重試失敗項目、未過期租約不重入。
- 收件人：排除名單、管理員角色過濾、雙重身分合併、被排除的管理人員仍收自己的戶、失去權限的銷售人員被略過。
- 備援：未綁 LINE 改 Email、已勾 Email 不重複寄、都沒有記 `no-contact`。
- 訊息：超過 10 筆的截斷、Flex 大小未超過上限、`altText` 與主旨不含姓名電話。
- 略過：退戶狀態、空狀態、試用建案。

**`scripts/tests/paymentRecordStatus.test.mjs`**
- 預計紀錄不影響 `paidYuan`、`paymentRatioPct`（請佣）、`fieldFormat`。
- `SalesInfoForm` 狀態提示比對到預計紀錄時轉為已繳。

**`scripts/tests/liffApps.test.mjs`**
- `payment-due-entry` 路由與 `paymentDueProjectId` 參數（primary／secondary redirect、登入回跳）都對應到 `customerManagement` 與入口頁。

**`scripts/tests/payment-records-browser.mjs`**
- 依本機 harness 做法，獨立 `cacheDir` 並攔截所有雲端請求。
- 390／820／1440 寬度截圖，檢查文字不截斷、不被漢堡鈕遮住、沒有橫向捲動。

### 11.2 手動（測試建案）

| 情境 | 確認 |
|---|---|
| iOS、Android 的 LINE 點通知按鈕 | 自動登入並進入到期清單，未綁定時顯示綁定提示 |
| 外部瀏覽器點 Email 按鈕 | 導向登入，登入後回到到期清單 |
| Gmail、Outlook、手機信箱 | 表格與按鈕顯示正常 |
| 銷售人員身分 | 只看到自己的戶，無法標記已繳 |
| 實際排程 | 到達設定整點後收到一則，不重複 |
| 試用建案 | 不發送，紀錄為 `blocked` |

**驗收注意：** LINE 重送金鑰以建案、日期、收件人組成，有效 24 小時。同一天刪掉 `paymentDue_YYYYMMDD` 後重跑，LINE 會回 409 不送達，紀錄卻顯示 `sent`。要重測 LINE 請隔天再測。

### 11.3 回歸

繳款比例、列表合計、資料透視、匯出、銷控表 PDF、銷售圖面、請佣工作台、憑證上傳（圖片與 PDF）、拖放上傳、燈箱、刪除時憑證移至垃圾桶、Drive 改名、狀態金額提示、退戶與復原。

## 12. 驗收條件

**資料與計算**
1. 新增預計繳款後，已繳合計、繳款比例、請佣比例皆不變。
2. 標記已繳後，該筆移至已繳區並計入比例，不再提醒，且保留預計日與遲繳天數。
3. 舊繳款紀錄全部出現在已繳區，內容與比例不變。
4. 有預計紀錄的戶別，在修改銷控可正常儲存。

**介面**
5. 預計與已繳在分區、顏色、圖示、欄位名稱上皆可區分，灰階截圖下仍可分辨。
6. 面板、對話框、設定頁、到期清單皆為 macOS 風格，390／820／1440 寬度文字不截斷。
7. 實繳少於預計時可一步新增差額；實繳等於或大於預計時不詢問。
8. 紀錄可改回預計，憑證依提示移至垃圾桶。

**通知**
9. 建案可設定多個到期前天數、發送整點、逾期間隔與開關；管理與銷售的管道可分開設定。
10. 預設關閉；啟用後每人每個通知方式每天最多一則彙整訊息。
11. 管理人員收到全案，銷售人員只收到自己的戶，被排除者不收全案清單。
12. 未綁 LINE 改寄 Email；都沒有時紀錄顯示未送達，設定頁可看到人員。
13. 訊息含買方姓名與電話；LINE 預覽文字與 Email 主旨不含。
14. 改預計日後依新日期提醒；標記已繳或刪除後不再提醒。
15. 重複觸發或部分失敗重試時，已成功的人不會重複收到。
16. 試用建案不發送。
17. 測試通知只寄給操作者且不含真實買方；通知紀錄可看到每人結果與原因。

**到期清單與批次**
18. LINE 與 Email 的連結都能開啟到期清單。
19. 批次新增可依三種金額方式建立，重複送出不會產生重複項目。
20. 範本帶入的金額與付款表相同，負數不會寫入。

**退戶**
21. 退戶後戶別的繳款紀錄清空且不再提醒；退戶備份仍保留。
22. 復原退戶後繳款紀錄回復。

**列表**
23. 銷控列表可依下次預計繳款日排序，逾期有紅色標示；透視與匯出可使用新欄位。

## 13. 預設值與待處理

以下預設值已於 2026-11-06 由需求方確認：

| # | 項目 | 預設 |
|---|---|---|
| 1 | 建案預設值 | 關閉；到期前 7、3、1 天與當天；09:00；逾期每 3 天；管理人員 Email＋LINE；銷售人員 LINE |
| 2 | 發送時間範圍 | 06:00–22:00 |
| 3 | 標記已繳權限 | 只有銷控系統權限者；只有報價權限的銷售人員唯讀 |
| 4 | 提醒的戶別 | 後台狀態非空且非退戶類 |
| 5 | 補發 | 排程失敗最多補 3 小時；已錯過的天數不補發 |
| 6 | 操作紀錄 | 標記已繳時記錄 `paidAt`、`paidBy` |

**已知限制：**
- 修改銷控在第二次檢查到寫入之間仍有短暫時間窗，要完全消除需後端比對；檢查到他人修改而中止時，已上傳的憑證會留在 Drive。
- 退戶在交易外讀取戶別，讀取到寫入之間新增的紀錄會被清除且不在備份內，機率極低。
- Email 沒有重送金鑰，送達但回應逾時時，重試可能重複寄一封。
- 有 Sheet 同步的建案，批次新增後改做一次全量同步，不再逐戶觸發。銷控 Sheet 的全量同步已改為先寫入，成功後才清除多出來的舊列與舊欄，寫入失敗時 Sheet 維持原資料（批次結果會顯示警告，可手動同步）；清除失敗時新資料已寫入，多出來的舊列留到下次同步。使用者在 Sheet 手動加的欄位與列順序仍會被覆蓋。退戶 Sheet 的全量同步是獨立流程，仍先清空再寫入。
- 批次新增同步失敗後重送，若這次沒有新增任何戶別就不會補同步，同步提醒會留在畫面，要到建案設定手動同步。
- 全量同步期間的併發更新可能被蓋掉或被清除，要等該戶下次異動才會更新。
- 舊版復原退戶可能把含他案買方姓名的 `parkingDetails` 留在戶別上。現在復原不再寫回、再次復原時會清掉，Sheet 也不輸出；但已留在戶別文件上的資料沒有另外清理，舊 Sheet 的這一欄要手動全量同步一次才會消失。
- 銷控列表依下次預計繳款日遞減排序時，沒有預計的戶別排最前，與其他欄位行為一致。

**既有退戶戶別的舊紀錄：** 程式碼顯示過去退戶沒有清除繳款紀錄，因此部分戶別可能混有舊買方的金額，繳款比例也可能不正確。這次只修正之後的退戶。正式資料尚未統計，建議另外跑唯讀比對（退戶日之前的紀錄且戶別仍有資料），列出受影響戶別後再決定是否清理。

## 14. 開發順序

| 階段 | 內容 | 可驗收的成果 |
|---|---|---|
| 1 | 資料模型、API、面板與對話框改版、退戶修正、防覆蓋 | 可記錄預計繳款與標記已繳 |
| 2 | 建案設定、排程、通知、測試通知、通知紀錄 | 可收到通知 |
| 3 | 到期清單頁、LINE 入口、列表欄位 | 可從通知直接處理 |
| 4 | 批次新增、範本帶入、產品簡報同步 | 大量建立預計繳款 |

同一版本發布或分批發布皆可；階段 1 可獨立上線。
