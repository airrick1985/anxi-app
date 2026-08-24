# 付款表產製功能 Spec（預覽 + PDF/EXCEL 下載）

> 版本：v1.0（2026-08-12）
> 狀態：待確認
> 範本依據：`docs/付款表範本.pdf`

## 1. 目標與範圍

將現有「製作付款表」（複製 Google Sheet 模板 → 寫入資料 → 開啟 Sheet）**整段取代**為：

1. 在系統內直接**生成付款表預覽**（HTML 排版，仿範本樣式）
2. 期款比例套用「期款方式範本」後，**可手動微調比例與金額**（雙向連動 + 驗證）
3. 用戶確認後**下載 PDF 或 EXCEL**（後端統一產出，僅本機下載、不做雲端留存）

### 已確認的關鍵決策

| 決策點 | 結論 |
|---|---|
| PDF 生成方式 | 後端 pdfkit 向量 PDF（文字可選取、檔案小） |
| PDF 中文字型 | Noto Serif TC（思源宋體，開源可嵌入），Regular + Bold |
| EXCEL 生成方式 | 後端 exceljs 統一產出（與 PDF 同一資料流） |
| 比例/金額手動修改 | 雙向連動（改比例→重算金額；改金額→反算比例） |
| 與舊 Google Sheet 流程 | 取代（移除舊按鈕與相關 UI） |
| 合約書範本 QR code | 後台只存網址；前端以 `qrcode` 套件即時生成，隨 payload 傳給後端嵌入 |
| 繳款銀行資訊 | 列出所有非空帳戶（房屋款/土地款/配套款） |
| 檔案保存 | 僅本機下載，不存 Storage / 不留 Firestore 記錄 |

## 2. 後台設定（建案層級）

### 2.1 位置

`SalesSettings.vue` 建案設定內新增「**付款表設定**」區塊（沿用現有權限 gate）。

### 2.2 設定項目

Firestore `projects/{projectId}` 新增欄位（nested object）：

```js
paymentDocSettings: {
  logoUrl: string,              // 建案 logo（Firebase Storage 下載 URL）
  logoPath: string,             // Storage 路徑（供刪除/更換用）
  contractTemplateUrl: string,  // 合約書範本網址（QR code 來源）
  loanWarningText: string,      // 貸款警語（紅字），預設範本文字
  remitNoteText: string,        // 匯款提醒（紅字），預設範本文字
}
```

| 項目 | UI | 說明 |
|---|---|---|
| 建案 logo 上傳 | 圖片上傳（含預覽、更換、刪除） | 接受 png / jpg / jpeg / webp / svg / gif；**上傳時前端以 canvas 統一轉存 PNG**（pdfkit 僅支援 PNG/JPEG），限制最長邊 1200px、檔案 ≤ 2MB。Storage 路徑：`projects/{projectId}/paymentDoc/logo.png`。上傳機制沿用 `FloorManager.vue` 模式（`uploadBytes` + `getDownloadURL`） |
| 合約書範本網址 | 文字輸入 + 即時 QR 預覽 | 存純網址；輸入時前端用 `qrcode` 套件即時渲染 QR 預覽供確認 |
| 貸款警語 | 文字輸入 | 預設：`＊銀行貸款成數依個人信用狀況並由銀行審核，如有差額無法貸款時則由買方自行補足差額＊` |
| 匯款提醒 | 文字輸入 | 預設：`＊請於匯款時備註【購買戶別】、【買方姓名】` |

### 2.3 移除項目（取代舊流程）

- `SalesSettings.vue`：移除「付款表模板 SHEET ID」（`paymentScheduleTemplateId`）與「付款表儲存位置」（`paymentScheduleFolderUrl`）兩個設定欄位 UI
- `PaymentSettings.vue`：移除「付款表資料夾」按鈕（`paymentScheduleFolderUrl` 連結）
- `SalesControlSystem.vue`：移除兩處「付款表資料夾」連結按鈕（約 L265、L1094）
- 後端 `generatePaymentSheet`（functions/index.js:18632）：前端不再呼叫；函式本體先保留一版標記棄用，穩定後刪除
- Firestore 舊欄位 `paymentScheduleTemplateId` / `paymentScheduleFolderUrl` 不主動刪除（無害），僅停用

## 3. 前端：付款表預覽流程

### 3.1 入口

`PaymentSettings.vue` 底部「製作付款表」按鈕改為開啟新元件 **`PaymentSchedulePreviewDialog.vue`**（fullscreen on mobile），移除原「製作付款表確認」對話框與 Google Sheet 產製邏輯（`handleGenerateDocument` / `showGeneratedLinkDialog` 等）。

帶入資料（自 `formData` / `calculated` / `props`）：

- 戶別（unitId、棟別/樓層若可取得）、合約方式、是否首購、優付
- 成交總價 `grandTotalSalePrice`（房屋成交價 + 車位成交價合計）
- 車位清單（spotId、price_transaction）
- 面積資訊（房屋總面積坪/m²、主建物、附屬建物(陽台)、共用部分、土地持分面積、土地持分、車位面積合計坪/m²）
- 三組銀行帳戶（房屋款/土地款/配套款：銀行名稱、戶名、帳號）
- 銷售人員（複選，逗號串接）與聯絡電話
- 建案 `paymentDocSettings`（logo、合約網址、警語文字）

### 3.2 Dialog 版面（上下兩區）

#### 上區：期款編輯器

1. **範本選擇器**：沿用 `QuoteItem.vue` 的模式 —
   - 自動預選：依 paymentCategory（合約方式為毛胚合約→另有配套邏輯不在此表、勾優付→優付期款）、成交總價落在 minPrice~maxPrice、buyerType（首購/非首購）、propertyType 篩選 `paymentTermTemplates`
   - 手動覆蓋：兩層連動選擇器（類別 → 範本），可還原自動
   - 套用範本或切換範本時，**重置**所有手動調整
2. **期款明細編輯表格**，欄位：`比例(%) | 期別名稱 | 金額(萬) | 備註`
   - 結構沿用範本 items 母子階層：母項目顯示合併比例（如「工程期款 5%」），子項目顯示序號與名稱
   - 初始值：以現有公式引擎計算（`evaluateFormula` + `applyNewRounding`，自 `QuoteItem.vue` 抽出為共用模組 `src/utils/paymentCalculation.js`，報價單與付款表共用）
   - **比例欄**（母項目層級）可編輯；**金額欄**可編輯（有子項的母項目金額 = 子項合計，唯讀；子項金額可編輯）
   - **備註欄**：自由輸入文字，僅存在於本次產製（不回寫範本）
3. **雙向連動規則**：
   - 改「比例」→ 該期金額 = 比例 × 成交總價，套用該期進位設定（無設定則四捨五入至整數萬）；有子項的母項目改比例時，差額按子項原金額比重分攤後進位，尾差歸入最後一個子項
   - 改「金額」→ 該期（或其母項目）比例 = 金額合計 ÷ 成交總價 × 100，顯示至小數 2 位
4. **驗證（不通過則下載按鈕 disabled + 紅色提示）**：
   - 母項目比例合計 = 100%（容差 0.01%）
   - 全部期款金額合計 = 成交總價（整數萬精確相等）
5. **尾差一鍵補正**：顯示目前差額（比例差 / 金額差），按鈕「差額歸入交屋款」（預設最後一期，可下拉改選其他期別）—— 將金額差額加到該期並反算比例

#### 下區：付款表即時預覽

- HTML/CSS 仿範本排版（見 §5 版面規格），資料與上區編輯即時連動
- 手機版可捲動縮放；預覽僅供確認，最終下載檔以後端產出為準（後端排版邏輯與預覽對齊）

#### 底部動作列

- `下載 PDF`、`下載 EXCEL`（驗證通過才可按；呼叫後端，回傳後以 `file-saver` 存檔）
- 檔名：`{yyyyMMdd}-{建案名}-付款表-{戶別}-{銷售人員}.pdf/.xlsx`（沿用舊命名慣例，台灣時間）
- `關閉`

### 3.3 QR code 資料流

前端以 `qrcode` 套件將 `contractTemplateUrl` 轉為 PNG dataURL（約 300×300），隨下載 payload 傳給後端嵌入 PDF/EXCEL；預覽區直接用同一 dataURL 顯示。未設定網址時，QR 區塊整塊不顯示（含「合約範本 QR CODE」標籤）。

## 4. 後端：`generatePaymentDocument` Cloud Function

```
exports.generatePaymentDocument = onCall({
  region: "asia-east1",
  timeoutSeconds: 120,
  memory: "512MiB",   // 依專案規範
})
```

- **不需 Drive secrets**（不再走 Google API）
- 新增依賴：`exceljs`（functions/package.json）；`pdfkit` 已存在
- 字型檔：`functions/assets/fonts/NotoSerifTC-Regular.otf`、`NotoSerifTC-Bold.otf`（隨部署打包）

### 4.1 Request payload

```js
{
  projectId: string,
  format: 'pdf' | 'excel',
  doc: {
    projectName, unitId, unitLabel,        // unitLabel: "A 棟 8 樓" 顯示字串（前端組好）
    listDate: string,                       // "2026年8月12日"（前端以台灣時間組好）
    logoUrl: string | null,                 // 後端 axios 抓圖（arraybuffer）
    qrDataUrl: string | null,               // 前端生成的 QR PNG dataURL
    parkingText: string,                    // "B5-40 (225萬)"；多車位逗號串接
    areas: { houseTotalPing, houseTotalSqm, mainPing, mainSqm,
             ancillaryPing, ancillarySqm, commonPing, commonSqm,
             terracePing,                   // 露臺(不計坪)，僅坪數；空白/0 不顯示該列
             landSharePing, landShareSqm, landShareRatio },
    rows: [                                 // 期款列（依畫面最終值，含手動調整）
      { type: 'group', name, percent, children: [
          { seq, name, amount, note } ] },
      { type: 'single', name, percent, amount, note },
      ...
    ],
    totalPrice: number,                     // 成交總價（萬）
    banks: [ { title, bankName, accountName, account } ],  // 僅非空帳戶
    loanWarningText, remitNoteText,
    salesperson, salesPhone
  }
}
```

後端**信任前端計算結果**（僅做基本 schema 驗證 + 比例合計/金額合計複核，不符回 `invalid-argument`），排版渲染不重算。

### 4.2 Response

```js
{ status: 'success', fileName, mimeType, base64 }   // 前端 file-saver 下載
```

（PDF 預估數百 KB、EXCEL 更小，onCall 10MB 回應上限安全）

## 5. 版面規格（PDF 與 EXCEL 一致，依範本 PDF）

A4 直式，單頁為原則（期款列數過多時 PDF 自動縮小列高，EXCEL 設定列印縮放為一頁寬）。

1. **表頭**：左上 logo（等比縮放，最大高約 60pt；未設定則留白）；中央標題「付款明細表」（Bold、大字）；右上「合約範本 QR CODE」標籤 + QR 圖（未設定則整塊省略）
2. **基本資訊區**（雙欄）：
   - 左欄：`戶別：`（灰底框）、`車位：`（灰底框，含各車位成交價）
   - 右欄：`房屋買賣面積：`（坪 / m²，灰底）、`主建物 / 陽台 / 共用部分`（各坪 / m²）、`土地持分：十萬分之N`、`土地買賣面積：`（坪 / m²，灰底）、`車位持分面積：`（坪 / m²，灰底；車位面積合計，無資料時整列不顯示）
3. **列表日期**：表格左上方 `列表日期：{listDate}`
4. **期款表格**：欄位 `比例 | 期別名稱 | 金額(萬) | 備註`
   - 母項目比例欄**跨列合併**（如訂金+簽約金合併 10%、工程期款 1~10 合併 5%）
   - 工程期款母項名稱直排於名稱欄左側子欄（仿範本「工程期款」直書），子項顯示序號 + 名稱
   - 金額千分位、整數萬
   - 末列 `100% | 總價 | {成交總價} |`（Bold）
5. **警語**：紅字置中 `loanWarningText`
6. **繳款銀行區**：框線區塊，每組非空帳戶一段（`{title}繳款銀行名稱 / 戶名 / 帳號`），下方紅字 `remitNoteText`
7. **表尾**：框線列 `銷售顧問 {姓名} | 聯絡電話 {電話}`

## 6. 檔案異動清單

### 新增
| 檔案 | 內容 |
|---|---|
| `src/components/PaymentSchedulePreviewDialog.vue` | 預覽 + 期款編輯 + 下載 |
| `src/utils/paymentCalculation.js` | 自 QuoteItem.vue 抽出 `evaluateFormula` / `applyNewRounding` 等共用計算 |
| `functions/assets/fonts/NotoSerifTC-*.otf` | PDF 字型 |
| functions 內新模組（建議獨立檔案再由 index.js 掛載） | `generatePaymentDocument`：pdfkit / exceljs 渲染 |

### 修改
| 檔案 | 內容 |
|---|---|
| `src/views/SalesSettings.vue` | 新增「付款表設定」區塊（logo 上傳、合約網址+QR 預覽、警語文字）；移除模板 SHEET ID / 儲存位置欄位 |
| `src/views/PaymentSettings.vue` | 「製作付款表」改開新 Dialog；移除確認框、Google Sheet 產製、「付款表資料夾」按鈕 |
| `src/views/SalesControlSystem.vue` | 移除付款表資料夾連結 ×2 |
| `src/components/QuoteItem.vue` | 改 import 共用計算模組（行為不變） |
| `src/api.js` | 新增 `generatePaymentDocument` 呼叫；`generatePaymentSheet` / `exportSheetToPdf` 相關移除 |
| `functions/package.json` | 加 `exceljs` |
| `firestore.rules`（如需要） | `projects.paymentDocSettings` 走既有 projects 寫入規則，預期不需改 |

## 7. 邊界情況

- **無適用範本**：期款表格空白，提示「無適用期款範本，請至期款方式範本設定建立」，仍可全手動輸入列？→ **否**，本版必須套範本後才能編輯（避免全手動易錯），僅提示引導
- **無車位**：車位欄顯示「無」
- **配套（毛胚合約）**：本版付款表以**成交總價單一期款表**呈現（同範本）；配套期款拆表不在本版範圍，如有需求另開需求
- **成交總價為 0 或未設定房屋成交價**：下載按鈕 disabled，提示先填成交價
- **logo/QR 皆未設定**：仍可產製，對應區塊留白/省略
- **期款列超過一頁**：PDF 縮小列高與字級（下限 8pt），仍超出則分頁（表頭重複）

## 8. 部署

- 前端照常 `npm run release:safe`
- 後端：`cd functions && npm install`，`firebase deploy --only functions:generatePaymentDocument`
