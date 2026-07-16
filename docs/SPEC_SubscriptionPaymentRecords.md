# SPEC：訂閱管理 — 繳款紀錄與到期 Email 提醒

> 版本：v1.1
> 日期：2026-07-16（台北時間）
> 狀態：已確認（2026-07-16 與需求方確認 §9 全部事項）

---

## 1. 需求概述

在「訂閱管理」中，每一筆訂閱資料新增「**繳款紀錄**」欄位：

1. 每筆訂閱可新增**無限筆**繳款紀錄，每筆紀錄包含：
   - **約定繳款日期**（必填）
   - **繳款日期**（實際繳款日，選填；填了視為已繳款）
   - **金額**
   - **已開發票請款**（勾選）
2. 系統於**約定繳款日期（台北時間）到期前 30 天、14 天、7 天**，自動寄送 Email 提醒給**具訂閱管理權限的人員**。

---

## 2. 資料模型

### 2.1 儲存位置

沿用既有 Firestore（database：`anxi-app`）`subscriptions` 集合，在訂閱文件內新增內嵌陣列欄位 `paymentRecords`（與既有 `userLimitTiers` 相同模式，日期存 `YYYY-MM-DD` 字串，**不**轉 Firestore Timestamp，避免動到既有 add/updateSubscription 的日期轉換邏輯）。

```jsonc
// subscriptions/{subscriptionId}
{
  // ...既有欄位...
  "paymentRecords": [
    {
      "id": "PAY-1737000000000-0",     // 前端產生，PAY-<timestamp>-<index>，作為提醒去重的 key
      "agreedDate": "2026-08-15",      // 約定繳款日期（必填，YYYY-MM-DD）
      "paidDate": "",                  // 繳款日期（實際繳款日，空字串 = 尚未繳款）
      "amount": 30000,                 // 金額（number）
      "invoiceIssued": false,          // 已開發票請款（boolean）
      "note": "",                      // 備註（選填）
      "remindersSent": {               // 提醒去重紀錄（由排程函式回寫，前端唯讀）
        "d30": "2026-07-16T09:00:12+08:00",
        "d14": null,
        "d7": null
      }
    }
  ]
}
```

### 2.2 欄位規則

| 欄位 | 型別 | 必填 | 說明 |
|---|---|---|---|
| `agreedDate` | string (YYYY-MM-DD) | ✅ | 約定繳款日期；提醒排程依據 |
| `paidDate` | string (YYYY-MM-DD) 或 `""` | — | 有值 = 已繳款，該筆**不再寄提醒** |
| `amount` | number | — | 預設 0；儲存時強制 `Number()` |
| `invoiceIssued` | boolean | — | 預設 `false`；僅記錄用，不影響提醒判斷 |
| `remindersSent` | map | — | 排程回寫；前端儲存時**必須原樣保留**，不可清空 |

---

## 3. 前端 UI（SubscriptionManagement.vue）

### 3.1 新增/編輯訂閱 Modal — 「繳款紀錄」區塊

- 位置：接在「使用者人數方案」區塊之後、「附件資料」之前，UI 樣式比照「使用者人數方案」（卡片式 + 右上「新增繳款紀錄」按鈕）。
- 每張卡片欄位（單列 RWD 排版）：
  - 約定繳款日期（`type="date"`，必填，未填該筆儲存時剔除）
  - 繳款日期（`type="date"`，選填）
  - 金額（`type="number"`）
  - 已開發票請款（`v-checkbox`）
  - 備註（單行文字，選填）
  - 刪除按鈕（`mdi-delete`）
- 「新增繳款紀錄」預設值：約定繳款日期 = 今天（台北時間）、金額 0、未繳款、未開發票。
- 卡片狀態視覺提示（chip）：
  - `paidDate` 有值 → 綠色「已繳款」
  - 未繳且約定日 < 今天 → 紅色「已逾期」
  - 未繳且約定日 ≥ 今天 → 橘色「未繳款（N 天後到期）」

### 3.2 訂閱列表新增欄位「繳款紀錄」

- 顯示**最近一筆未繳款**的約定繳款日期與金額，例如 chip：`8/15 · $30,000`
  - 已逾期 → 紅色；30 天內到期 → 橘色；其餘 → 藍灰色
  - 全部已繳 → 綠色「已繳清」；無紀錄 → 灰色「—」
- 點擊 chip 直接開啟該筆訂閱的編輯 Modal（捲動至繳款紀錄區塊為加分項，非必要）。

### 3.3 儲存邏輯

- 沿用既有 `addSubscription` / `updateSubscription`（`paymentRecords` 為一般陣列欄位，隨文件整包寫入，後端無須改動 CRUD API）。
- 儲存前正規化：`amount` 轉 number、剔除無 `agreedDate` 的紀錄、依 `agreedDate` 升冪排序。
- **保留 `remindersSent`**：編輯既有紀錄時原樣帶回，避免重複寄信。
- 新增訂閱勾選多個系統功能時，各筆訂閱各自複製一份 `paymentRecords`（同附件的現況模式）。

---

## 4. Email 到期提醒（Cloud Function）

### 4.1 排程函式 `subscriptionPaymentReminder`

```js
exports.subscriptionPaymentReminder = onSchedule({
  region: "asia-east1",
  schedule: "every day 09:00",     // 每日台北時間 09:00
  timeZone: "Asia/Taipei",
  memory: "512MiB",
  secrets: ["SENDER_EMAIL", "GMAIL_APP_PASSWORD"],
}, ...)
```

### 4.2 判斷邏輯

以台北時間定義「今天」（沿用專案慣例 `new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' })`）。

對所有 `subscriptions` 文件的每筆 `paymentRecords`：

1. 跳過：無 `agreedDate`、或 `paidDate` 有值（已繳款）。
2. 計算 `diffDays = agreedDate - today`（日曆天）。
3. 提醒級距判斷（**區間制**，容忍排程漏跑或事後補建的紀錄，不採「當天整點」制）：

| 級距 | 條件 | 去重欄位 |
|---|---|---|
| 30 天前 | `14 < diffDays <= 30` 且 `remindersSent.d30` 為空 | `d30` |
| 14 天前 | `7 < diffDays <= 14` 且 `remindersSent.d14` 為空 | `d14` |
| 7 天前 | `0 <= diffDays <= 7` 且 `remindersSent.d7` 為空 | `d7` |

   - 同一筆紀錄同一天只落入一個級距（取最小適用級距）。
   - `diffDays < 0`（已逾期）不再寄提醒（逾期通知不在本期範圍，見 §7）。
4. 寄送成功後，將對應 `remindersSent.dXX` 回寫為寄送時間（ISO 字串，台北時區），整包更新該訂閱文件的 `paymentRecords` 陣列。

### 4.3 收件人：「有訂閱管理權限的人員」

與 `/subscription-management` 路由權限一致（`requiredRoles: ['超級管理員', '系統管理員']`）：

- 查詢 `users` 集合 `roles array-contains 超級管理員` ∪ `roles array-contains 系統管理員`
- 取 `email` 欄位有效者，去重後全部列為收件人（比照專案既有做法以 BCC 寄送，避免互相看到地址）。
- 無任何有效收件人時記 log 後結束，不視為錯誤。

### 4.4 信件內容

- 每日**彙整成一封**（非一筆一封）：當天所有落入級距的繳款紀錄合併為一張表格。
- 主旨：`【訂閱管理】繳款到期提醒 — N 筆款項即將到期 (YYYY-MM-DD)`
- 內文表格欄位：建案名稱、系統功能、約定繳款日期、剩餘天數、金額、已開發票請款（✅/—）、訂閱類型、聯絡人。
- 樣式沿用專案既有 email 範本（藍色 header #004383、繁體中文、RWD 700px 容器）。
- 提供「前往訂閱管理」按鈕連結：`https://anxismart.com/#/subscription-management`。

### 4.5 手動觸發（測試用）

比照 `manualTriggerSendReminders` 模式，提供 `manualTriggerSubscriptionPaymentReminder`（onCall、512MiB、同 secrets），核心邏輯抽成共用函式 `executeSubscriptionPaymentReminderLogic()`，供排程與手動共用。

---

## 5. 權限與安全

- 繳款紀錄 CRUD 隨訂閱文件走既有 `isSuperAdmin` 檢查，不新增權限面。
- `remindersSent` 僅由 Cloud Function 回寫；前端不提供編輯 UI（僅在卡片上以小字顯示「已寄送 30/14/7 天提醒」供查核，加分項）。

---

## 6. 部署與發版

| 項目 | 動作 |
|---|---|
| Cloud Functions | `firebase deploy --only functions:subscriptionPaymentReminder,functions:manualTriggerSubscriptionPaymentReminder`（記憶體 512MiB） |
| 前端 | `npm run release:safe` |
| Firestore | 無須新增索引（全集合掃描，訂閱筆數量級小）；無須 migration，舊資料無 `paymentRecords` 視為空陣列 |

---

## 7. 邊界條件與未來擴充（本期不做）

- **逾期未繳催繳通知**（diffDays < 0 每 N 天提醒）— 本期不做，資料結構已可支援。
- 提醒對象擴充為自訂 email 名單（目前固定角色查詢）。
- 繳款紀錄與「使用者人數方案」`paymentAmount` 的關聯／自動帶入 — 本期兩者獨立。
- 匯出報表（Excel）加入繳款紀錄欄位。

---

## 8. 驗收條件

1. 新增/編輯訂閱可新增多筆繳款紀錄，儲存後重開 Modal 資料正確保留（含勾選狀態）。
2. 訂閱列表「繳款紀錄」欄正確顯示最近一筆未繳款摘要，顏色符合 §3.2。
3. 建立一筆約定繳款日期 = 今天+30／+14／+7 天的未繳紀錄，手動觸發 `manualTriggerSubscriptionPaymentReminder`：
   - 超級管理員與系統管理員（有 email 者）收到彙整信，表格內容正確。
   - 對應 `remindersSent.dXX` 已回寫；**再次觸發不重複寄送**。
4. `paidDate` 填入後，該筆不再出現在提醒信中。
5. 編輯訂閱其他欄位並儲存，不會清掉既有 `remindersSent` 紀錄。
6. 台北時間跨日邊界（UTC 與台北差 8 小時）計算天數正確。

---

## 9. 已確認事項（2026-07-16）

1. **寄送時間**：每日台北時間 **09:00**。
2. **收件人範圍**：`超級管理員 + 系統管理員`（與訂閱管理頁面路由權限一致）。
3. **已開發票請款**：勾選後**仍要提醒**；只有「繳款日期」填入（已繳款）才停止提醒。
4. **逾期通知**：本期不做，僅於列表以紅色標示逾期（未來擴充見 §7）。
