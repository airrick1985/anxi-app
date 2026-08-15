# 裝修合約製作範本（毛胚/配套合約）功能 Spec

> 版本：v1.0（2026-08-15）
> 狀態：已與需求方確認四項關鍵決策，待實作
> 需求依據：範例檔 `docs/C-6-洪瑋君-首購-毛胚合約-2025-05-27_08-52.pdf`（富宇首馥 C-6 毛胚合約，10 頁）
> 相關既有規格：`docs/合約製作資料範本-spec.md`（本文件為其擴充，沿用其資料模型與架構）、`docs/付款表產製-spec.md`

## 1. 目標與範圍

建案（首例：富宇首馥）中合約方式屬「配套合約」（如：毛胚合約）的戶別，其合約由兩個價金體系組成：

- **配套房屋總價**（`price_package_deal`，含車位）：走**既有一般合約製作**（簽約會辦單、房屋/土地付款明細表、繳款帳戶頁）。
- **配套價格**（= 成交總價 − 配套房屋總價，即裝修工程款）：走**新增的裝修合約頁面**（裝修工程會辦單、裝修付款明細表、配套款專用匯款帳戶）。

對照範例 PDF 的頁面構成：

| PDF 頁 | 內容 | 對應 |
|---|---|---|
| 1 | 簽約會辦單（總價 3,880 萬 = 配套房屋總價） | 既有 `breakdown` 頁（基準修正，見 §5） |
| 2 | **裝修工程會辦單**（總價 400 萬 = 配套價格，16 期單列付款明細） | **新頁型 `decorationBreakdown`**（§4.1） |
| 3 | 房屋合約(毛胚合約) 手寫填入頁 | 不在本版範圍（手寫頁） |
| 4 | **裝修付款明細表**（國字大寫金額 + 日期制期款） | **新頁型 `decorationPaymentDetail`**（§4.2） |
| 5–8 | 房屋/土地付款明細表 ×2 | 既有 `paymentDetail` 頁 |
| 9–10 | 繳款帳戶頁 | 既有 `bankAccounts` 頁 + `unit-package` 銀行組（§4.3，免改程式） |

### 已確認的關鍵決策

| 決策點 | 結論 |
|---|---|
| 整合方式 | **併入同一份合約製作**：現有 ContractDocDialog 新增兩種頁型，配套戶自動啟用、一般戶自動停用；同一份文件一次下載 |
| 裝修期款來源 | **重用 `paymentTermTemplates` 的「配套期款」分類**（付款表配套兩頁模式已在用），期別名稱（含日期）由範本定義，合約與付款表數字一致 |
| 配套款匯款帳號 | **戶別配套款欄位**（`packageBankName/Account/AccountName`），經既有 bankSets `source: 'unit-package'` 引用，可逐戶不同 |
| 毛胚戶基準不一致 | **一併修正**：配套戶一般合約頁基準改用配套房屋總價、裝修頁基準用配套價格，比照付款表配套兩頁模式（`PaymentSchedulePreviewDialog.vue:671-683`） |
| 配套判定來源 | 統一改讀建案設定 `projects.packageContractTypes`（`SalesSettings.vue:251-265`），fallback 既有硬編碼 `SPECIAL_CONTRACT_TYPES` |
| 國字大寫金額 | 系統目前無此工具（已全域搜尋確認），新增前端共用 util；後端只收前端轉好的字串（沿用「前端算、後端排版」原則） |

### 不在本版範圍

- PDF 第 3 頁「房屋合約(毛胚合約)」國字大寫手寫填入頁（既有合約用印流程處理）
- 裝修合約的獨立下載入口（併入同一份文件；單頁匯出既有功能已可單獨輸出裝修頁）
- Word 匯出

## 2. 現況與缺口

既有合約製作架構（詳見 `docs/合約製作資料範本-spec.md`）：預定義頁面類型 + 建案設定 `contractDocConfigs/{projectId}` + 戶別保存 `salesHouseholds.contractDocData`，前端計算、後端 `generateContractDocument` 僅排版。

本功能要補的缺口：

1. **無裝修頁型**：`PAGE_TYPES`（`src/utils/contractDocDefaults.js:4-10`）僅 5 種，無裝修工程會辦單、裝修付款明細表。
2. **公式引擎缺配套 ref**：`CONTRACT_BASE_REF_DEFINITIONS`（`src/composables/usePriceFormula.js:273-281`）無「配套房屋總價」「配套價格」，裝修金額無法用公式表達。
3. **基準不一致（既有 bug）**：配套戶在 ContractDocDialog 中，期款基準 `mainBase = unitCtx.totalPrice`（成交總價，`ContractDocDialog.vue:577`），但價款區 `buildContractBaseContext` 的 `total` 已換成 `price_package_deal`（`usePriceFormula.js:313-315`）——兩者對不起來。
4. **配套判定兩套並存**：`SPECIAL_CONTRACT_TYPES` 硬編碼 Set（`usePriceFormula.js:11-18`）vs 建案設定 `packageContractTypes`（`PaymentSettings.vue:732-740` 用後者）。
5. **配套期款範本被排除**：`ContractDocDialog.vue:622` 期款分類選單明確濾掉「配套期款」——一般頁維持排除，裝修頁專用。
6. **無國字大寫金額工具**。

## 3. 資料模型變更

**不新增 collection**。變更集中在三處：

### 3.1 頁面設定（`contractDocConfigs.pages[]`）

新增兩種 `type`：`decorationBreakdown`、`decorationPaymentDetail`（options 見 §4）。頁面共同結構（id/title/enabled/paper/repeatCount/pageCopies）不變。

裝修頁型隱含「僅配套戶適用」語意：**非配套戶開啟 Dialog 時自動停用並隱藏**（頁面清單顯示灰色提示「本頁僅適用配套合約戶別」），不需要額外 config 欄位。

### 3.2 戶別保存（`salesHouseholds.contractDocData`）新增欄位

```js
contractDocData: {
  // ...既有欄位不變...
  decorationTemplateId: string | null,        // 裝修期款範本手動覆蓋（null=自動預選）
  decorationManualRows: [...] | null,         // 裝修期款手動微調結果（結構同 manualRows；null=未調整）
  decorationManualRowsTemplateId: string | null, // 微調時所用範本 id（結構比對用，同 manualRowsTemplateId 機制）
  decorationRemark: string,                   // 裝修工程會辦單「備註」（與拆款表 breakdownRemark 各自獨立）
}
```

簽約日期（`signDate`）、簽核欄（`signFieldValues`）與一般會辦單**共用同一份值**（同一次簽約）。

### 3.3 公式引擎新增基礎 ref（§5.2）

`packageDealPrice`（配套房屋總價）、`packagePrice`（配套價格）。

## 4. 新頁面類型規格

### 4.1 `decorationBreakdown` 裝修工程會辦單（範例 PDF 第 2 頁）

版面 = 簽約會辦單的簡化版，差異：**無車位列、無房地價款/車位價款、無土地持分、無價款公式區、付款明細單列無房/土拆分**。

1. **表頭**：標題（預設「裝修工程會辦單」）；個案名稱、客戶姓名、身分證字號、房屋編號、**總價 = 配套價格**、聯絡電話、地址（買方通訊地址）、簽約日期（同 `signDate`）。
2. **面積區**：房屋總面積（㎡/坪）、主建物（占比%、㎡/坪）、共用部份、附屬建物(陽台)、專有部分(合計)——資料來源同 `breakdown` 頁 `areas`；無車位、無土地持分。
3. **付款明細（橫式表格）**：單列「裝修工程款」，欄位隨裝修期款範本動態產生（訂金、簽約金、期款 1..N、點交…），末欄「總價」= 配套價格。**無房/土拆分、無比例列**。
4. **備註**：自由輸入（`decorationRemark`）。
5. **簽核欄**：`options.signFields`，與 `breakdown` 頁同機制、**共用 `signFieldValues`**。

```js
options: {
  headerTitle: '裝修工程會辦單',
  signFields: [   // 預設同 breakdown
    { label: '富宇主管', source: 'manual', default: '', readonly: false },
    { label: '富宇承辦', source: 'manual', default: '', readonly: false },
    { label: '專案經理', source: 'manual', default: '', readonly: false },
    { label: '銷售人員', source: 'salesperson', default: '', readonly: true },
  ],
}
```

### 4.2 `decorationPaymentDetail` 裝修付款明細表（範例 PDF 第 4 頁）

與既有 `paymentDetail`（元、千分位、房/土雙欄）樣式完全不同：**金額一律國字大寫（萬元整）、期別以國字序號直列**。

版面：

1. 標題「裝修付款明細表」；表頭列：工地名稱（建案名）、房屋代號（戶別編號）。
2. **工程總價**：「計新臺幣 {國字大寫} 萬元整」，= 配套價格。
3. **期款清單**（每期一列）：`{國字序號}、{期別名稱}：新台幣：{國字大寫}萬元整`
   - 國字序號：一、二、三…十六（自動依列序產生）。
   - 期別名稱直接取裝修期款範本 items 的 name（如「訂金」「簽約金」「114年05月28日」「點交」）——**日期制期款的日期即期別名稱，由範本維護**，本功能不做日期規則產生器。
   - 金額 = 期款計算結果（萬，取整）。

```js
options: {
  headerTitle: '裝修付款明細表',
  siteLabel: '工地名稱',      // 表頭左欄標籤
  unitLabel: '房屋代號',
  noteText: '',               // 頁尾備註（範例無，留空即不顯示）
}
```

**國字大寫格式**（依範例 PDF 樣式，固定位數含零位）：

- 佰拾個三位固定：400 →「肆 佰 零 拾 零 萬元整」；26 →「零 佰 貳 拾 陸 萬元整」；5 →「零 佰 零 拾 伍 萬元整」。
- ≥1000 萬時前置仟位（「X 仟」），<1000 萬不顯示仟位（維持範例三位樣式）。
- 新增共用 util `src/utils/zhNumber.js`：`toZhFixedWan(amountWan, {minDigits: 3})` 回傳含空格分節的字串；**前端轉好放進 payload，後端直接印**。

### 4.3 配套款匯款帳戶頁（免新頁型，設定即可）

既有 `bankAccounts` 頁 + `bankSets` 已完整支援：

1. 建案合約設定 `bankSets` 新增一組 `{ label: '配套款', source: 'unit-package' }`（`BANK_SET_SOURCES` 已有此來源，`contractDocDefaults.js:30`）。
2. 新建一個 `bankAccounts` 頁（標題如「配套款繳款帳戶」），`options.bankSetIds` 只勾配套款組；或直接在既有帳戶頁加勾此組。
3. 帳戶資料來自戶別 `packageBankName/Account/AccountName`（`SalesControlSystem.vue:3276-3278`），隨銷控 Excel 上傳維護；三欄全空時該組自動隱藏（`unitDocContext.js buildAccountSections` 既有行為），**頁面無任何可顯示組別時自動排除匯出**（需補此保護，見 §6.3）。

`buildDefaultBankSets()` 不改（配套款組由需要的建案自行新增，非全建案預設）。

## 5. 基準金額修正與配套判定（含既有 bug 修復）

### 5.1 三個基準，比照付款表配套兩頁模式

| 用途 | 一般戶 | 配套戶 |
|---|---|---|
| 一般合約頁期款基準 `mainBase` | 成交總價（`unitCtx.totalPrice`） | **配套房屋總價 `price_package_deal`** |
| 價款公式 `total` ref | `price_transaction_total` | `price_package_deal`（既有行為，`usePriceFormula.js:313-315`） |
| 裝修頁基準 `decorationBase` | —（頁面停用） | **配套價格 = `price_transaction_total` − `price_package_deal`** |

- `ContractDocDialog.vue:577` 改為：`mainBase = isPackageContract ? packageDealPrice : totalPrice`。
- 配套價格為即時計算值（與 `UnitDetailModal.vue:1451-1454`、`PaymentSettings.vue:563-567` 同口徑），**不読取 `price_package` 欄位**（該欄位實務上未被使用）。
- `unitDocContext.js` 已有 `packageDealPrice`（`:132`），補 `packagePrice`（計算值）與 `isPackageContract` 進 context。

### 5.2 公式引擎新增 ref

`CONTRACT_BASE_REF_DEFINITIONS`（`usePriceFormula.js:273-281`）新增：

```js
{ key: 'packageDealPrice', label: '配套房屋總價', group: 'primary', unit: '萬' },
{ key: 'packagePrice',     label: '配套價格',     group: 'primary', unit: '萬' },
```

`buildContractBaseContext`（`:311-334`）注入兩值（非配套戶為 0）。編輯器 chips 自動出現，各建案價款公式即可引用。

### 5.3 配套判定統一

- `usePriceFormula.js` 的 `isSpecialContractType` 泛化：新增可選參數 `packageTypes`（字串陣列），有傳入時以其為準，未傳入 fallback 既有 `SPECIAL_CONTRACT_TYPES`（呼叫端不變則行為不變）。
- ContractDocDialog / UnitDetailModal 呼叫處帶入 `projectStore.getProjectById(projectId)?.packageContractTypes`（同 `PaymentSettings.vue:732-740` 的 fallback 邏輯：未設定時視「毛胚合約」為配套）。
- 判定結果 `isPackageContract` 由 `unitDocContext` 輸出，Dialog 內所有配套分支（mainBase、裝修頁啟用、裝修基準）共用同一判定。

## 6. 前端變更

### 6.1 `contractDocDefaults.js`

- `PAGE_TYPES` 新增：
  ```js
  { type: 'decorationBreakdown',    label: '裝修工程會辦單',  icon: 'mdi-hammer-wrench' },
  { type: 'decorationPaymentDetail', label: '裝修付款明細表', icon: 'mdi-cash-clock' },
  ```
- `buildDefaultPageOptions()` 補兩 case（§4.1、§4.2 options）。
- `buildDefaultContractDocConfig()` **不預設加入**裝修頁（各建案於合約設定自行新增；富宇首馥套用時加入）。

### 6.2 `contractDocModel.js`

- 新增 `buildDecorationBreakdownPageData(page, ctx, decorationModel, formValues)`：表頭 + 面積 + 單列付款明細 + 備註 + 簽核欄。
- 新增 `buildDecorationPaymentDetailPageData(page, ctx, decorationModel)`：期款列（序號國字、名稱、金額數字 + 國字大寫字串）+ 總價（數字 + 國字大寫）。
- 兩者輸出均為「後端可直接排版」的顯示值（國字字串已轉好）。

### 6.3 `ContractDocDialog.vue`

- **裝修期款範本選擇**（僅配套戶顯示）：獨立於一般期款選擇器的第二區塊。
  - 自動預選：`paymentCategory === '配套期款'`，並依 `propertyType` / `buyerType` / `minPrice ≤ decorationBase ≤ maxPrice` 篩選（複製 `autoTemplate` 邏輯 `:597-610`，基準改 `decorationBase`）；付款表配套頁同一批範本，數字一致。
  - 手動覆蓋存 `decorationTemplateId`；微調列存 `decorationManualRows`（結構比對還原，同 `manualRows` 機制 `:1067-1080`）。
  - 期款計算：`runNewCalculationEngine(items, decorationBase, '總價')`（同 `buildRowsFromTemplate` `:666-688`，無房/土拆分）。
- **一般期款分類選單維持排除「配套期款」**（`:622` 不變）——兩個選擇器各管各的分類。
- `buildPageData()` dispatcher（`:917-939`）補兩 case；頁面 computed（`:503-508`）補裝修頁；預覽渲染區（`:363-385`）掛兩個新 Preview 元件。
- **頁面啟用邏輯**：非配套戶時裝修頁強制 `enabled = false` 且清單中鎖定（tooltip「本頁僅適用配套合約戶別」）；`pageOverrides` 不覆蓋此限制。
- **驗證**（不過則下載 disabled + 紅字）：配套戶啟用裝修頁時，Σ裝修期款 = 配套價格（容差 0.05 萬，同後端）；配套戶 `price_package_deal` 未設定（0）時，裝修頁與一般頁皆標錯並提示補齊戶別資料。
- **bankAccounts 頁保護**：該頁所有 bankSet 組裝後皆為空（如一般戶勾了配套款組）→ 該頁自動排除匯出 + 提示，比照合約附圖空值行為。
- `mainBase` 修正見 §5.1。

### 6.4 新 Preview 元件

- `src/components/contractDoc/DecorationBreakdownPreview.vue`：可大量重用 `BreakdownPreview.vue` 的表格樣式（表頭/面積/橫式付款明細/簽核欄），去掉車位/價款/比例區。
- `src/components/contractDoc/DecorationPaymentDetailPreview.vue`：直列國字大寫清單。

### 6.5 `ContractDocConfigEditor.vue`

- 新增頁面下拉自動含兩新頁型（吃 `PAGE_TYPES`）。
- 兩新頁型的 options 編輯 UI：`decorationBreakdown`（headerTitle、signFields，同 breakdown 的編輯元件重用）；`decorationPaymentDetail`（headerTitle、siteLabel、unitLabel、noteText）。

### 6.6 `src/utils/zhNumber.js`（新檔）

`toZhFixedWan(amountWan, opts)` 國字大寫轉換（§4.2 格式），單元測試涵蓋 0、5、26、35、400、1000+、非整數（四捨五入取整）邊界。

## 7. 後端變更

### 7.1 `functions/index.js`

- `VALID_TYPES`（`:18818` 附近）加入 `decorationBreakdown`、`decorationPaymentDetail`。
- 驗證擴充：`decorationBreakdown` 頁複核 Σ期款 = 頁面總價（容差 0.05 萬）；`decorationPaymentDetail` 頁複核 Σ期款 = 工程總價。既有「房+土 = 期款總額」驗證只套用一般頁，不動。

### 7.2 `functions/contractDocument.js`

- `drawDecorationBreakdown(doc, data, layout)`：重用 `drawBreakdown` 的表格繪製手法（欄寬計算/橫式付款明細），版面依範例 PDF 第 2 頁。
- `drawDecorationPaymentDetail(doc, data, layout)`：直列清單，國字大寫字串由 payload 直接印（後端不做轉換）。
- `drawPageContent` dispatcher（`:708-722`）與 `buildContractExcel` switch（`:1338-1344`）補兩 case；Excel 版兩頁各一 worksheet（裝修付款明細直列輸出，含國字大寫欄）。
- `repeatCount` / `pageCopies` 既有機制自動適用，無需特作。

## 8. 富宇首馥 上線設定（資料面，非程式）

1. 銷控設定確認 `packageContractTypes` 含「毛胚合約」（既有遷移已預設）。
2. 合約製作範本設定：新增「裝修工程會辦單」「裝修付款明細表」兩頁（排序放在簽約會辦單之後）；`bankSets` 新增「配套款」組（`unit-package`）並建配套款帳戶頁（或併入既有帳戶頁）。
3. 期款設定：建「配套期款」分類範本（訂金 5、簽約金 35、14 期日期款各 26、點交 22 之類，期別名稱含民國日期），`minPrice/maxPrice` 以配套價格區間設定。
4. 戶別資料：毛胚戶填妥 `price_package_deal` 與 `packageBank*` 三欄（銷控 Excel 上傳）。

## 9. 邊界情況

- **非配套戶**：裝修頁強制停用（清單鎖定 + 提示），其餘頁行為與現行完全一致。
- **配套戶未填配套房屋總價（0/空）**：`mainBase`、`decorationBase` 皆無效 → 下載 disabled，提示補齊。
- **配套戶 `price_package_deal` ≥ 成交總價**：`decorationBase ≤ 0` → 裝修頁標錯、下載 disabled。
- **無適用配套期款範本**：裝修期款區顯示引導提示（同一般期款無範本行為），裝修頁不可匯出；一般頁不受影響（可先關閉裝修頁匯出其餘頁）。
- **配套期款範本事後被改/刪**：`decorationTemplateId` 失效回自動預選並提示；`decorationManualRows` 結構不符捨棄並提示（同 `manualRows` 機制）。
- **配套款帳戶三欄空**：該組自動隱藏；帳戶頁無任何組 → 該頁自動排除 + toast 註明。
- **金額 ≥ 1000 萬**：國字大寫自動含仟位；**非整數萬**：四捨五入取整（範例期款皆整數萬，微調輸入限整數）。
- **舊戶 `contractDocData` 無新欄位**：讀取時全部給預設值（null/''），不需遷移。

## 10. 檔案異動清單

### 新增

| 檔案 | 內容 |
|---|---|
| `src/components/contractDoc/DecorationBreakdownPreview.vue` | 裝修工程會辦單預覽 |
| `src/components/contractDoc/DecorationPaymentDetailPreview.vue` | 裝修付款明細表預覽 |
| `src/utils/zhNumber.js` | 國字大寫金額轉換 |

### 修改

| 檔案 | 內容 |
|---|---|
| `src/utils/contractDocDefaults.js` | `PAGE_TYPES` + `buildDefaultPageOptions` 兩新頁型 |
| `src/utils/contractDocModel.js` | `buildDecorationBreakdownPageData` / `buildDecorationPaymentDetailPageData` |
| `src/utils/unitDocContext.js` | context 補 `packagePrice`、`isPackageContract` |
| `src/composables/usePriceFormula.js` | `isSpecialContractType` 泛化（packageTypes 參數）；`CONTRACT_BASE_REF_DEFINITIONS` + `buildContractBaseContext` 加 `packageDealPrice`/`packagePrice` |
| `src/components/contractDoc/ContractDocDialog.vue` | `mainBase` 配套修正；裝修期款選擇/計算/微調；兩新頁型 dispatch/預覽/驗證；帳戶頁空組保護 |
| `src/components/ContractDocConfigEditor.vue` | 兩新頁型 options 編輯 UI |
| `functions/index.js` | `VALID_TYPES` + 裝修頁合計驗證 |
| `functions/contractDocument.js` | `drawDecorationBreakdown` / `drawDecorationPaymentDetail` + PDF/Excel dispatcher |

不動：`PaymentSchedulePreviewDialog.vue`、`PaymentSettings.vue`（付款表配套兩頁模式既有，維持現狀）、Firestore 規則（無新 collection）。

## 11. 實作分期

| 階段 | 內容 |
|---|---|
| Phase 1 | 基準修正 + 配套判定統一 + 公式 ref（§5）＋ `zhNumber.js`——獨立可先上線，順手修掉既有基準不一致 bug |
| Phase 2 | 前端兩新頁型（defaults/model/Dialog/Preview/ConfigEditor）+ 裝修期款選擇與驗證 |
| Phase 3 | 後端 PDF/Excel 渲染 + 驗證，端到端比對範例 PDF |
| Phase 4 | 富宇首馥設定套用（§8）與實戶驗收 |

## 12. 部署

- 前端：`npm run release:safe`（commit 前先依 commit-notes 流程寫 `CHANGELOG.md`）
- 後端：`FUNCTIONS_DISCOVERY_TIMEOUT=120 firebase deploy --only functions:generateContractDocument`（512MiB 既有設定不變）
- Firebase Console：無需變更（不新增 collection / 規則）
