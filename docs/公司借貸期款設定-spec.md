# 公司借貸期款設定 SPEC

> 狀態：規格已與需求方確認，待實作
> 相關草稿：`docs/local/公司借貸期款設定.md`
> 關聯功能：期款方式範本設定（`src/views/PaymentTermsSettings.vue`）、報價設定（`src/views/QuoteSettings.vue`）、期款計算引擎（`src/utils/paymentCalculation.js`）

---

## 1. 需求背景與目標

建案常提供「公司借貸」付款方案（例如公司借貸總價 15%，3 年 12 期攤還）。目前期款範本只能表達一次性期款項目，無法表達分期攤還的本金／利息。

目標：

1. 新增「公司借貸範本」編輯器，可持續建立多種借貸方案（類似房貸試算的參數設定）。
2. 既有期款範本可「附掛」一個公司借貸範本（例：範本「方案A-公司借貸15%」附掛「公司借貸15%-3年12期」）。
3. 報價設定選擇該期款範本後，付款方式顯示借貸攤還表：各期本金、利息、每期金額與各項合計；並可於報價當下臨時調整參數（不回存範本）。
4. 列印報價單(含期款) 加印攤還表區塊。

### 已確認的規格決策（與需求方確認）

| 議題 | 決策 |
|---|---|
| 攤還方式 | 每個借貸範本可選「本金平均攤還」或「本息平均攤還」，預設本金平均 |
| 年與期數關係 | 「3年、12期」＝3 年內分 12 期，每期間隔＝年數×12÷期數 個月（例：每 3 個月一期） |
| 期款 100% 檢核 | 期款範本自身仍須 100%；借貸為額外付款來源，不計入期款項目總和檢核 |
| 附掛數量 | 一個期款範本最多附掛 1 個借貸範本 |
| 成數基準 | 借貸金額＝報價總價×成數%，進位方式與精度由範本設定（同期款項目的進位規則） |
| 每期進位與尾差 | 每期本金／利息四捨五入到「元」，累計尾差併入最後一期，確保本金合計＝借貸金額 |
| 利率預設 | 範本儲存預設利率／年數／期數；報價設定時可臨時修改重算，**不回存**範本預設值 |
| 顯示範圍 | 報價設定畫面預覽 ＋ 列印報價單(含期款)；**本次不含**付款表產製 PDF/Excel（Cloud Functions 不動） |

---

## 2. 資料結構（Firestore）

### 2.1 新集合 `companyLoanTemplates`

前端直連 Firestore（同 `paymentTermTemplates` 模式），docId 建議 `${projectId}_${loanName}_${timestamp}`。

```js
{
  projectId: string,          // 所屬專案
  loanName: string,           // 範本名稱，例：「公司借貸15%-3年12期」
  ratioPercent: number,       // 借貸成數 %，例：15（借貸金額＝總價×15%）
  years: number,              // 年數，例：3
  periods: number,            // 期數，例：12（每期間隔 = years*12/periods 個月）
  annualRate: number,         // 年利率 %，例：2.5；允許 0（無息）
  amortizationType: string,   // '本金平均攤還' | '本息平均攤還'
  roundingMethod: string,     // 借貸金額進位：'四捨五入' | '無條件進位' | '無條件捨去'
  roundingValue: number,      // 借貸金額進位精度（元），例：1 / 100 / 1000 / 10000
  note: string,               // 備註說明（選填，報價攤還表下方小字，留空不顯示）
  createdAt / updatedAt: serverTimestamp
}
```

### 2.2 `paymentTermTemplates` 增加欄位

```js
{
  // ...既有欄位不變
  companyLoanTemplateId: string | null,  // 附掛的借貸範本 docId；null＝不附掛
}
```

- 舊資料無此欄位，讀取時視同 `null`（容忍 undefined）。
- 期款項目 100% 檢核邏輯**不變**，不計入借貸成數。

### 2.3 報價項目儲存借貸「快照」

報價設定選定範本後，將借貸參數**快照**存入報價項目資料（QuoteSettings 既有的報價儲存結構內新增欄位），列印與重開報價時以快照計算，避免範本事後異動影響已出報價：

```js
quoteItem.companyLoan = {
  templateId: string,        // 來源範本
  loanName: string,
  ratioPercent: number,      // 以下皆為「當下生效值」（可能被臨時修改過）
  years: number,
  periods: number,
  annualRate: number,
  amortizationType: string,
  roundingMethod: string,
  roundingValue: number,
} | null
```

---

## 3. 計算規格（共用模組）

新增 `src/utils/companyLoanCalculation.js`，純函式、無 UI 依賴：

```js
/**
 * 產生公司借貸攤還表
 * @param {number} totalPrice  報價總價（元）
 * @param {object} loanConfig  同 2.3 快照結構
 * @returns {{
 *   loanAmount: number,            // 借貸金額（總價×成數，套用範本進位）
 *   intervalMonths: number,        // 每期間隔月數 = years*12/periods
 *   periodRate: number,            // 單期利率 = annualRate% × years / periods
 *   rows: Array<{ period, principal, interest, payment, remaining }>,
 *   totals: { principal, interest, payment }   // 本金合計＝loanAmount
 * }}
 */
export function buildCompanyLoanSchedule(totalPrice, loanConfig)
```

### 3.1 借貸金額

`loanAmount = rounding(totalPrice × ratioPercent / 100, roundingMethod, roundingValue)`，進位使用既有 `applyNewRounding()`。

### 3.2 期間與單期利率

- `intervalMonths = years × 12 / periods`（允許非整數，僅作顯示參考）
- `periodRate = (annualRate / 100) × years / periods`（單期利率按年利率×實際期間換算；annualRate=0 時利息全為 0）

### 3.3 本金平均攤還

- 每期本金 `basePrincipal = round(loanAmount / periods)`（四捨五入到元）
- 第 k 期利息 `interest_k = round(remaining_k × periodRate)`（remaining_k 為該期期初剩餘本金）
- 每期金額 `payment_k = principal_k + interest_k`
- **末期本金 = loanAmount − 前面各期本金合計**（吸收尾差，保證本金合計＝借貸金額）

### 3.4 本息平均攤還（年金法）

- `periodRate > 0`：`PMT = loanAmount × i / (1 − (1+i)^−n)`，i=periodRate、n=periods，round 到元
- `periodRate = 0`：`PMT = round(loanAmount / periods)`
- 第 k 期利息 `interest_k = round(remaining_k × i)`；本金 `principal_k = PMT − interest_k`
- **末期本金吸收尾差**（同 3.3），末期每期金額 = 末期本金 + 末期利息（可能與 PMT 略有出入，屬正常）

### 3.5 合計

- 本金合計 ＝ loanAmount（恆等）
- 利息合計 ＝ Σ interest_k
- 本利合計 ＝ loanAmount ＋ 利息合計

---

## 4. UI 規格

### 4.1 期款方式範本設定頁（PaymentTermsSettings.vue）

頁面頂部改為兩個分頁（v-tabs）：

- **Tab 1「期款範本」**：現有內容不變（卡片＋左右編輯配置）。
- **Tab 2「公司借貸範本」**：新的管理區。

#### 公司借貸範本管理區

- 卡片列表（沿用期款範本卡片的視覺語言：編輯中綠色狀態列強化／未編輯淡化），卡片顯示：範本名稱、成數 chip、`年數/期數` chip、年利率 chip、攤還方式 chip、被幾個期款範本附掛（例：「2 個範本使用中」）。
- 卡片操作：編輯、複製、刪除。
- **借貸範本編輯器**（左右配置，同期款項目編輯模式；手機為底部滑出全螢幕）欄位：
  - 範本名稱（必填）
  - 借貸成數 %（必填，>0）
  - 年數（必填，>0，可小數）
  - 期數（必填，正整數）
  - 年利率 %（預設值欄位，允許 0）
  - 攤還方式（本金平均攤還／本息平均攤還，預設本金平均）
  - 借貸金額進位（進位方式＋精度：元/百元/千元/萬元）
  - 備註說明（選填）
- **即時試算預覽**：編輯器內提供「試算總價」輸入框（僅供預覽，不儲存），輸入後即時顯示攤還表（期別／本金／利息／每期金額／剩餘本金＋合計列），讓管理者存檔前確認參數正確。

#### 期款範本附掛設定

- 期款範本「修改範本」dialog 新增下拉：「附掛公司借貸範本」（選項＝該專案的借貸範本＋「不附掛」，單選）。
- 期款範本卡片顯示附掛 chip（例：`🏦 公司借貸15%-3年12期`）。
- **刪除借貸範本防呆**：若被任何期款範本附掛，刪除時警示「此範本已被 N 個期款範本附掛，刪除後該些範本將解除附掛」，確認後一併把引用的 `companyLoanTemplateId` 清為 null。

### 4.2 報價設定（QuoteSettings.vue）

- 選擇期款範本時（含多範本選擇 dialog），若該範本有附掛借貸，載入借貸範本並生成快照。
- 付款方式區塊下方新增「**公司借貸攤還表**」卡片：
  - 標頭：借貸範本名稱＋借貸金額（總價×成數）
  - 可編輯參數列：**年利率、年數、期數**（帶入範本預設值，可臨時修改，修改即重算；不回存範本）。成數不開放修改。提供「還原預設」按鈕。
  - 表格欄位：期別｜本金｜利息｜每期金額｜剩餘本金
  - 合計列:本金合計（＝借貸金額）、利息合計、本利合計
  - 範本備註（note）以小字顯示於表格下方
- 快照（含臨時修改後的值）隨報價項目儲存（2.3）。

### 4.3 列印報價單(含期款)

- 每戶 A4 頁的期款表之後，若該戶報價有 `companyLoan` 快照，加印「公司借貸攤還表」區塊（同 4.2 表格欄位＋合計列＋備註），以快照參數計算。
- 版面：表格緊湊字級，超過一頁時允許自然換頁。

---

## 5. API（src/api.js 新增）

沿用 `paymentTermTemplates` 的同款模式：

| 函式 | 說明 |
|---|---|
| `listenToCompanyLoanTemplates(projectId, cb)` | onSnapshot 監聽，依 loanName 排序 |
| `setCompanyLoanTemplate(docId, data)` | 新增/覆蓋（自訂 docId，含 serverTimestamp） |
| `updateCompanyLoanTemplate(docId, data)` | 更新 |
| `deleteCompanyLoanTemplate(docId)` | 刪除（呼叫端先處理附掛解除，見 4.1 防呆） |

Firestore 安全規則：比照 `paymentTermTemplates` 現行規則新增 `companyLoanTemplates` 集合權限。

---

## 6. 邊界與檢核

1. 期款項目 100% 檢核不含借貸成數（已確認）。
2. `annualRate = 0`：利息全為 0，攤還表僅本金分期。
3. `periods = 1`：一次清償，本金＝借貸金額、利息＝loanAmount×periodRate。
4. 期款範本附掛的借貸範本已被刪除（資料異常）：報價端視同不附掛，console.warn，不阻斷報價。
5. 舊報價資料無 `companyLoan` 欄位：一律視同 null，不顯示攤還表。
6. 總價變動（報價金額調整）時，借貸金額與攤還表須即時重算（成數不變）。
7. 讀取 `paymentTermTemplates` 時容忍 `companyLoanTemplateId === undefined`。

---

## 7. 非本次範圍

- 付款表產製（系統內預覽＋後端 PDF/Excel、Cloud Functions）不納入攤還表 — 未來需求另開 spec。
- 借貸的實際撥款／還款紀錄管理（本功能僅為報價試算層）。
- 寬限期（只繳息不還本）設定 — 如未來需要再擴充 `gracePeriods` 欄位。

---

## 8. 驗收條件

1. 可於「公司借貸範本」分頁新增／編輯／複製／刪除範本，編輯器輸入試算總價可即時看到正確攤還表。
2. 本金平均：15,000,000×15%＝2,250,000，3年12期、年利率2.5% → 每期本金 187,500、首期利息 round(2,250,000×0.625%)＝14,063、末期本金吸尾差、本金合計恆等 2,250,000。
3. 本息平均：同參數 → 每期金額固定（PMT），利息逐期遞減，末期調整後本金合計恆等借貸金額。
4. 期款範本附掛後，卡片顯示附掛 chip；期款 100% 檢核不受影響。
5. 報價設定選擇附掛範本 → 顯示攤還表；臨時修改利率/年數/期數即時重算且不影響範本預設值；重新載入報價時以快照重現。
6. 列印報價單(含期款) 正確加印攤還表與合計。
7. 刪除被附掛的借貸範本時出現警示，確認後期款範本自動解除附掛。
