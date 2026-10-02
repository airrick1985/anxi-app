# SPEC：訂閱管理 — 跟進流程（報價 → 兌現）

> 版本：v1.0
> 日期：2026-10-02（台北時間）
> 狀態：已確認（2026-10-02 與需求方逐輪確認）
> 取代：`SPEC_SubscriptionPaymentRecords.md` 的 `paymentRecords`（舊資料經 §8 轉換後改走本規格）

---

## 1. 流程

每筆訂閱（建案 × 單一系統）各自跟進；續約時在同一筆訂閱「開新一輪」，舊輪保留為歷史。

| 層級 | 步驟 key | 名稱 | 額外欄位 |
|---|---|---|---|
| 輪次 | `quote` | 報價 | 系統內報價單（§4）；下載 PDF 自動存為本步附件 |
| 輪次 | `signed` | 客戶回簽 | — |
| 輪次 | `activated` | 系統啟用 | `startDate`、`endDate`、`userCount` → 寫回訂閱期間與人數方案 |
| 每期款 | （欄位）`dueDate` | 預計繳款日 | 依付款條件自動計算，可手動改 |
| 每期款 | `invoice` | 開立發票 | `invoiceNo`、`invoiceAmount` |
| 每期款 | `submitted` | 請款送件 | — |
| 每期款 | `cashed` | 款項兌現 | `method`（匯款／支票／現金）、`chequeNo`、`chequeDueDate`、`receivedAmount` |

- 每步共通：`date`、`note`、`attachments[]`、`by`／`byName`／`at`（操作人與時間）。
- 依序完成；可「略過」（必填原因，`status: 'skipped'`）；可撤銷「其後步驟皆未完成」的步驟。
- 款項步驟需本輪「系統啟用」已完成或略過。
- 完成／略過／撤銷皆自動寫一筆系統跟進紀錄。

## 2. 資料模型（Firestore `anxi-app`）

### 2.1 `subscriptions/{subId}` 新增欄位

```jsonc
{
  "billTo": { "name": "", "taxId": "", "contactName": "", "phone": "" }, // 買受人
  "projectIconUrl": "",          // 建案尚未建立前暫存的圖示
  "cycles": [Cycle],             // 依 no 升冪；最後一筆為目前輪次
  "nextFollowUpDate": "",        // 最新一筆「非系統」跟進的下次跟進日
  "lastFollowUpAt": "", "lastFollowUpText": ""
}
```

```jsonc
// Cycle
{
  "id": "CYC-<ts>", "no": 1, "createdAt": "ISO",
  "steps": { "quote": Step, "signed": Step, "activated": Step },
  "quote": Quote | null,
  "installments": [Installment],
  "reminders": { "unsigned": "YYYY-MM-DD", "renewal": { "d60": "", "d30": "" } }
}
// Step
{ "status": "pending|done|skipped", "date": "", "note": "", "skipReason": "",
  "attachments": [], "by": "", "byName": "", "at": "", /* 步驟額外欄位 */ }
// Installment
{ "id": "INS-<ts>-<i>", "no": 1, "label": "第1期", "amount": 0,
  "base": "signed|activated|firstAppointment|date", "offset": 0, "offsetUnit": "day|month", "fixedDate": "",
  "dueDate": "",
  "steps": { "invoice": Step, "submitted": Step, "cashed": Step },
  "remindersSent": { "d30": null, "d14": null, "d7": null, "overdue": "" } }
```

- 報價儲存時，若本輪所有款項皆無進度 → 依付款條件重建 `installments`。
- `dueDate` 為空且基準日已知時自動帶入（前端儲存、後端提醒皆會解析）。

### 2.2 `subscriptions/{subId}/followups/{autoId}`

`{ type: 電話|拜訪|Email|LINE|其他|系統, content, attachments[], nextFollowUpDate, cycleNo, createdAt, createdBy, createdByName }`

### 2.3 `subscriptionSettings/quote`（報價單設定）

`{ companyName, companyNameEn, from: { contactName, phone, taxId }, defaultNotes, defaultItems[{name, desc, amount}], seals[{url, storagePath}], validDays, taxRate, planTemplates[{ name, plan[] }], noteTemplates[{ name, content }] }`

## 3. 列表

- 階段卡：全部／報價中／待回簽／待啟用／待開票／待送件／待兌現／已結清；顯示數量與逾期數，點選即篩選。
- 新欄位：進度（7 段進度條＋階段）、下一步（文字＋日期，逾期紅字）、下次跟進。
- 點列開右側抽屜（手機全寬）：「流程」「跟進紀錄」兩頁籤，頂部可開「訂閱資料」編輯。

## 4. 報價單

- 版型：`docs/富宇地產股份有限公司-線上預約系統(曙光之森64戶)-報價單-2026-08-27.jpg`。
- 品項：品名＋說明＋金額；小計、營業稅（預設 5%，四捨五入）、總計；優惠價（含稅最終價，選填，填了總計劃線、紅字顯示）。
- 實收基準 `finalAmount` = 優惠價 || 總計；付款條件以此拆期，比例制最後一期吸收尾差。
- 付款條件基準：回簽後／啟用後／首次有效預約後（N 天或 N 個月）／指定日期；可存為範本。
- 下載 PDF／PNG，檔名 `{買受人}-{第一品項}-報價單-{YYYY-MM-DD}`。
- 報價內容變更後 `version + 1`；下載 PDF 時若此版未存檔 → 上傳並加入「報價」步驟附件（檔名加 `-v{n}`）。
- 不印報價編號。
- 備註說明可套用範本（取代目前內容）；範本於「報價單設定 › 範本」新增／編輯／刪除，編輯器可「存範本」。
- 圖片：自圖片庫插入，疊在最上層自由擺放；預覽上拖曳移動、拖角落等比縮放、拖把手旋轉（15° 吸附），Delete 移除。
  `quote.images[{ id, imageId, name, url, x, y, w, h, rotate }]`，座標以 A4 794px 為基準，超出紙張部分匯出時裁切。
- 圖片庫 `subscriptionQuoteImages/{id}`：`{ name, url, storagePath, contentType, width, height, createdAt }`，全站共用；
  刪除／替換只影響圖片庫，已插入報價單的圖片保留原檔。

## 5. 系統啟用連動

- 完成 `activated`：重算訂閱 `startDate` = 各輪已啟用最小值、`endDate` = 最大值；`userLimitTiers` 加一筆 `{ count, startDate, endDate, cycleId }`。
- 撤銷：移除該輪 tier 並重算期間（無任何已啟用輪 → `null`）。
- 建案（`projects/{projectId}`）於首次啟用時才建立；超級管理員授權改由 `startDate` 由空變有值時觸發。
- 新建案的建案 ID 新增時可留空，可隨時於「訂閱資料」補填；完成「系統啟用」時若仍未設定則必填（與啟用日同一次寫入）。
  設定後同建案名稱、尚未啟用且未設 ID 的其他訂閱一起套用。未設 ID 時建案圖示暫存於 `subscriptions/pending/`。
- 未啟用（`startDate` 為空）的訂閱不出現在客戶「訂閱查詢」。

## 6. Email 提醒（每日 09:00 彙整一封，分區塊）

| 區塊 | 條件 | 去重 |
|---|---|---|
| 繳款即將到期 | 未兌現、`0 ≤ dueDate − today ≤ 30`，級距 30/14/7 | `remindersSent.d30/d14/d7` |
| 逾期未兌現 | 未兌現、`dueDate < today` | `remindersSent.overdue` 距今 ≥ 7 天才再寄 |
| 報價未回簽 | 報價完成 ≥ 7 天、未回簽 | `reminders.unsigned` 距今 ≥ 7 天才再寄 |
| 續約提醒 | 目前輪已啟用、`endDate − today` 於 (30,60] / [0,30] | `reminders.renewal.d60/d30` |
| 今日待跟進 | `nextFollowUpDate ≤ today` | 不去重（新增跟進後自動消失） |

## 7. 權限

沿用 `超級管理員`、`系統管理員`。附件單檔上限 7MB。

## 8. 舊資料轉換

`scripts/migrateSubscriptionPipeline.mjs`（dry-run 預設，`--apply` 寫入）：
- 無 `cycles` 的訂閱 → 第 1 輪；報價／回簽／啟用標 `done`（日期 = 啟用日，備註「舊資料轉換」）。
- `paymentRecords` → 各期款：`agreedDate` → `dueDate`（base `date`）；`invoiceIssued` → 發票 done；`paidDate` → 兌現 done（發票、送件未記錄者標 done 無日期）；`remindersSent` 沿用。
- 前後端另有相同的即時轉換（`legacyToCycles`），未跑腳本也能正確顯示與提醒。
