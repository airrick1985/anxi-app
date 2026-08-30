# 銷控網格下載 PDF 功能 Spec（預覽 + 分頁參數 + 後端向量 PDF）

> 版本：v1.0（2026-08-22）
> 狀態：待確認
> 適用：銷控系統（viewMode=sales）＋ 報價系統（viewMode=quote），共用 [SalesControlSystem.vue](../src/views/SalesControlSystem.vue)

## 1. 目標與範圍

在銷控系統／報價系統的網格畫面新增「**下載銷控表**」功能：

1. 開啟**下載預覽對話框**，選擇紙張尺寸（A4 / A3）與方向（直式 / 橫式）
2. 系統**預設把全部棟別 × 全部樓層等比縮放塞進一頁**自動預排
3. 用戶可微調「**每頁樓層數（列）**」與「**每頁棟別數（欄）**」，超出即自動分頁，格子隨之等比放大
4. 預覽確認後下載 **PDF**（後端 pdfkit 向量產出，僅本機下載、不做雲端留存）

### 已確認的關鍵決策

| 決策點 | 結論 |
|---|---|
| PDF 生成方式 | 後端 pdfkit 向量 PDF（照付款表模式：onCall 回 base64 → `file-saver` 下載） |
| 中文字型 | Noto Sans TC（黑體，`functions/assets/fonts/NotoSansTC-*.otf` 已存在，適合網格數字） |
| 一頁塞不下的處理 | 預設單頁等比縮放；用戶可設「每頁樓層數 / 每頁棟別數」自動分頁，每頁重複棟別與樓層表頭 |
| 頁面附加內容 | 頁首（建案名稱＋台灣時間產製時間＋頁碼）、頁尾狀態顏色圖例、價格顯示模式標註 |
| 格子內容 | 戶別編號必顯；總價 / 坪數 / 單價 / 露台標示 / 文字標籤可個別勾選 |
| 功能範圍 | 銷控＋報價都加，資料跟隨當前模式（報價模式已售戶隱藏價格只印「已售」、永遠用表價） |
| 匯出範圍 | 匯出**當前住家/店面分頁**的全部戶別，**不受畫面篩選影響**（篩選淡化不反映到 PDF） |
| 版面一致性 | 前端計算完整版面（page plan，以 pt 為單位）傳給後端，後端**照畫不重算**，確保預覽＝PDF |

## 2. 範圍

### In scope
- `SalesControlSystem.vue` 網格工具列新增「下載銷控表」按鈕（格狀模式）
- 新增元件 `src/components/SalesGridDownloadDialog.vue`（參數設定 + 分頁預覽 + 下載）
- 新增共用版面計算模組 `src/utils/salesGridLayout.js`
- 新增後端模組 `functions/salesGridDocument.js` 與 Cloud Function `generateSalesGridPdf`
- `src/api.js` 新增 `generateSalesGridPdf` httpsCallable 封裝

### Out of scope
- 不動既有網格畫面的呈現邏輯（`flatGridData` / `statusColorMap` 等 computed 只讀取複用）
- 不做 Excel 版（既有 `exportToExcel` 已涵蓋資料匯出需求）
- 不做雲端留存（Storage / Drive / Firestore 記錄）
- 列表模式（`viewFormat === 'list'`）不提供此功能
- 車位圖、銷控圖片不在此表範圍

## 3. 前端

### 3.1 入口

`SalesControlSystem.vue` 網格工具列（住家/店面分頁切換附近）新增按鈕「**下載銷控表**」（icon：`mdi-file-pdf-box` 或 `mdi-download`）：

- 僅在 `viewFormat === 'grid'` 顯示；`filteredHouseholds` 為空時 disabled
- 點擊開啟 `SalesGridDownloadDialog.vue`，傳入 props：
  - `buildings`（= `buildingHeaders`）、`floors`（= `floorHeaders`，高樓在上）
  - `gridData`（floor × building 對照表）
  - `statusColorMap`、`salesParameters`（圖例用，依 `order` 排序）
  - `viewMode`（sales / quote）、`priceDisplayMode`（表價/底價/成交價）
  - `projectName`、`displayType`（住家/店面）
  - 價格函式沿用主畫面：`getDisplayTotalPrice` / `calculateUnitPrice`（抽出或以 props 傳入，確保與畫面一致）

### 3.2 Dialog 版面（fullscreen on mobile）

**上區：參數列**

| 參數 | UI | 預設值 |
|---|---|---|
| 紙張尺寸 | toggle：A4 / A3 | A4 |
| 方向 | toggle：直式 / 橫式 | 橫式（銷控表通常橫寬） |
| 每頁樓層數 | number input + slider，範圍 1 ~ 全部樓層數 | 全部（單頁） |
| 每頁棟別數 | number input + slider，範圍 1 ~ 全部棟別數 | 全部（單頁） |
| 格子內容 | checkbox 群：總價、坪數、單價、露台標示、文字標籤 | 全勾 |

參數列下方即時顯示：**總頁數**（如「共 4 頁（樓層 2 段 × 棟別 2 段）」）與**格子尺寸估計**（如「格寬約 18mm」）；格寬換算 < 12mm 時顯示黃色警告「格子過小可能難以閱讀，建議減少每頁棟別數或改用 A3 / 橫式」（僅提示，不阻擋下載）。

**下區：分頁即時預覽**

- 以 HTML/CSS 依 §5 版面規格 1:1 模擬每一頁（含頁首、表頭、格子、圖例），多頁時直向排列可捲動，每頁上方標「第 x / y 頁」
- 任何參數變動即時重算重繪
- 預覽渲染與 PDF 共用 `salesGridLayout.js` 的 page plan（單位 pt），預覽以固定 zoom 轉 px 呈現

**底部動作列**

- `下載 PDF`：呼叫後端，成功後 `base64ToBlob` + `saveAs`（沿用 [PaymentSchedulePreviewDialog.vue](../src/components/PaymentSchedulePreviewDialog.vue) 模式）；呼叫期間按鈕 loading
- 檔名：`{yyyyMMdd}-{建案名}-銷控表.pdf`（台灣時間）；店面分頁時為 `…-銷控表-店面.pdf`
- `關閉`

### 3.3 分頁與版面計算（`src/utils/salesGridLayout.js`）

核心函式 `buildPagePlan({ paper, orientation, rowsPerPage, colsPerPage, buildings, floors, cells, contentOptions, ... })`，輸出完整 page plan（pt 單位），前端預覽與後端 payload 共用。

**紙張規格（pt）**：A4 = 595.28 × 841.89、A3 = 841.89 × 1190.55；橫式互換寬高。頁邊界四邊 28pt。

**每頁可用網格區** = 頁面 −（邊界 + 頁首高 + 圖例高 + 表頭列高 + 樓層表頭欄寬）。

**格子尺寸（等比縮放）**：以畫面比例 120:90（寬:高）為基準，

```
scale = min( 可用寬 / (colsPerPage × 120 + (colsPerPage−1) × gapX),
             可用高 / (rowsPerPage × 90  + (rowsPerPage−1) × gapY) )
cellW = 120 × scale；cellH = 90 × scale
```

- gap、格內字級、padding、圓角、露台 chip 全部乘同一 `scale`（畫面基準字級：戶別 14 / 總價 13 / 坪數・單價 11）
- 字級下限 4pt：低於下限仍照算（對應前述格子過小警告）
- **所有頁共用同一組 cellW/cellH**（以滿版 rowsPerPage × colsPerPage 計算），最後不足一段的頁面留白，確保跨頁格子大小一致

**分頁切割與頁序**：樓層依畫面順序（高→低）切成 `ceil(R / rowsPerPage)` 段、棟別依畫面順序（左→右）切成 `ceil(C / colsPerPage)` 段。頁序＝**先橫後直**：同一樓層段先走完全部棟別段，再往低樓層段（第 1 頁＝最高樓層段 × 最左棟別段）。每頁都畫該頁自己的棟別表頭列與樓層表頭欄。

**格子資料（每 cell）**：

```js
{ building, floor, unitId, bgColor,        // bgColor 來自 statusColorMap，空值 '#ffffff'
  soldOnly: bool,                          // quote 模式已售 → 只印「已售」
  hasTerrace: bool,
  tags: [ { text: '熱銷', bgColor: '#E53935', textColor: '#FFFFFF' } ],  // 文字標籤（勾選時才帶，取自 unitTags）
  lines: { total: '1,234萬', area: '45.6坪', unit: '27.1萬/坪' } }  // 依勾選與模式，前端算好字串
// item.data 為 null → { empty: true }（灰底 #e9ecef 空格）
```

價格字串一律由前端以現行 `getDisplayTotalPrice` / `calculateUnitPrice` 產生（sales 模式跟隨 `priceDisplayMode`；quote 模式固定表價），**後端不重算**。

## 4. 後端：`generateSalesGridPdf` Cloud Function

```js
exports.generateSalesGridPdf = onCall({
  region: "asia-east1",
  timeoutSeconds: 120,
  memory: "512MiB",       // 依專案規範
}, async (request) => { ... })
```

- 新增模組 `functions/salesGridDocument.js`，`module.exports = { buildSalesGridPdf }`；`index.js` handler 內 **lazy require**（照 `paymentDocument.js` 模式）
- 字型：`functions/assets/fonts/NotoSansTC-Regular.otf` / `NotoSansTC-Bold.otf`（已存在，不需新增檔案）
- 無需 secrets、無外部 API

### 4.1 Request payload

```js
{
  projectId: string,
  doc: {
    projectName: string,
    titleSuffix: string,           // '' 或 '（店面）'
    generatedAt: string,           // '2026年8月22日 14:30'（前端台灣時間組好）
    priceModeLabel: string,        // '表價' | '底價' | '成交價'（quote 模式固定 '表價'）
    paper: 'A4' | 'A3',
    orientation: 'portrait' | 'landscape',
    layout: {                      // pt 單位，前端 buildPagePlan 算好
      cellW, cellH, gapX, gapY, fontScale,
      floorHeaderW, buildingHeaderH, headerH, legendH
    },
    legend: [ { statusName, colorCode } ],   // salesParameters 依 order 排序
    pages: [ {                     // 依頁序排好
      pageNo, totalPages,
      buildings: [string],         // 本頁棟別段
      floors: [string],            // 本頁樓層段（高→低），顯示 '{n}F'
      cells: [ /* §3.3 格子資料，依 floor×building 順序攤平 */ ]
    } ]
  }
}
```

後端僅做基本 schema 驗證（pages 非空、cells 數量 = floors × buildings、色碼格式），排版照 layout 直接繪製，不符回 `invalid-argument`。

### 4.2 Response 與限制

```js
{ status: 'success', fileName, mimeType: 'application/pdf', base64 }
```

- 沿用 7MB 保護：`buffer.length > 7*1024*1024` → `HttpsError('resource-exhausted')`（向量網格實際預估數十~數百 KB，遠低於上限）

## 5. 版面規格（每頁）

1. **頁首**（單列）：左＝「**{建案名}{titleSuffix} 銷控表**」（Bold）；中＝「價格：{priceModeLabel}」；右＝「{generatedAt}　第 {pageNo} / {totalPages} 頁」
2. **網格區**：
   - 頂列棟別表頭（Bold、置中）、左欄樓層表頭（`{n}F`、置中），底色淡灰 `#f5f5f5`
   - 格子：圓角矩形填 `bgColor` + 細框線 `#d0d0d0`；內容由上而下置中：**戶別編號（Bold）**、總價（`{n}萬`）、坪數（`{n}坪`）、單價（`{n}萬/坪`）——依勾選顯示
   - `soldOnly`：只印置中「已售」；`empty`：灰底 `#e9ecef` 無內容；`hasTerrace` 且有勾露台：格內右上角小綠點或「露」小字（縮放後過小則省略，門檻：cellW < 40pt）
   - `tags` 且有勾文字標籤：格內右上角一條標籤帶（高 14×scale），由右往左排圓角 chip（底色 `bgColor`、字色 `textColor`、字級 9×scale、單顆最寬 48×scale 超出截斷「…」），最多 2 顆，其餘折成灰底 `+N`；有標籤的格子內容區上緣內縮 16×scale（與畫面 `.unit-card.has-tags` 同），不與戶別編號重疊；有露臺綠點時標籤帶右界內縮讓開；cellW < 40pt 省略
3. **頁尾圖例**（單列、置中）：依 `legend` 順序排「■色塊 + 狀態名」，寬度不足時自動換行（圖例高度依行數動態計入 layout）

PDF 與預覽用同一份 layout 數值，允許 ±1pt 內的渲染差異。

## 6. 檔案異動清單

### 新增
| 檔案 | 內容 |
|---|---|
| `src/components/SalesGridDownloadDialog.vue` | 參數設定 + 分頁預覽 + 下載 |
| `src/utils/salesGridLayout.js` | `buildPagePlan` 版面/分頁計算（前端預覽與後端 payload 共用來源） |
| `functions/salesGridDocument.js` | `buildSalesGridPdf`（pdfkit 渲染） |

### 修改
| 檔案 | 內容 |
|---|---|
| `src/views/SalesControlSystem.vue` | 網格工具列加「下載銷控表」按鈕 + 掛載 Dialog、傳 props |
| `src/api.js` | 新增 `generateSalesGridPdf` httpsCallable（timeout 120000） |
| `functions/index.js` | 新增 `exports.generateSalesGridPdf`（lazy require 模組） |

無 Firestore 結構變更、無 firestore.rules 變更、functions 無新增依賴。

## 7. 邊界情況

- **無戶別資料**：入口按鈕 disabled
- **單棟或單層**：正常運作（1×N / N×1 網格）
- **樓層含非數字**（如 B1）：跟隨畫面現行 `parseInt` 排序邏輯，與畫面呈現一致
- **狀態無對應顏色**：格子白底（同畫面 fallback）；圖例僅列 salesParameters 有設定的狀態
- **超大建案**（如 30 棟 × 40 層單頁）：照算照畫，靠格子過小警告引導用戶分頁，不硬性阻擋
- **每頁樓層數/棟別數設 1**：允許（極端多頁），總頁數 > 60 時預覽僅渲染前 60 頁並提示（PDF 仍完整產出）
- **產製失敗 / 逾時**：Dialog 顯示錯誤 snackbar，可重試；不影響主畫面

## 8. 部署

- 前端照常 `npm run release:safe`
- 後端：`firebase deploy --only functions:generateSalesGridPdf`（必要時加 `FUNCTIONS_DISCOVERY_TIMEOUT=120`）
