# 合約製作資料範本 功能 Spec（範本設定 + 預覽 + PDF/EXCEL 下載）

> 版本：v1.0（2026-08-14）
> 狀態：待確認
> 需求依據：`docs/合約製作資料範本spec.md`、範例檔 `docs/富宇學森拆款表.xlsx`
> 相關既有規格：`docs/付款表產製-spec.md`

## 1. 目標與範圍

為每個建案建立專屬的「合約製作資料範本」，以該建案 `salesHouseholds` 與相關集合欄位組成前端預覽頁面，確認後下載 PDF / EXCEL。

- **範本層（全域）**：超級管理員／系統管理員建立「範本樣式」（如：富宇建設專用範本），可儲存、複製並套用到不同建案。
- **建案層**：套用範本後複製一份到建案設定，可再依建案客製（頁面增減、公式、條款庫、銀行組、預設值）。
- **套用層（銷售端）**：戶別 Modal「付款表設定」旁新增「**合約製作設定**」按鈕 → 開 Dialog，以該戶別資料帶入、填寫本次值 → 預覽 → 下載。

### 已確認的關鍵決策

| 決策點 | 結論 |
|---|---|
| 範本形式 | **預定義頁面類型 + 豐富設定選項**（非自由拖拉設計器）；內建 5 種頁面類型，範本＝頁面組合＋各頁設定 |
| 匯出格式 | 第一版 **PDF + EXCEL**（沿用 pdfkit / exceljs 架構）；**Word 列後續階段** |
| 房屋/土地拆分比例 | **戶別層級欄位**（已存在：`housePriceRatio` / `landPriceRatio`，百分比整數、合計須為 100） |
| 價款計算（房屋款、主建物價款等） | 每建案公式不同 → **價款公式編輯器**（沿用既有 `usePriceFormula.js` token 公式引擎與 `FormulaEditor.vue` 編輯器，擴充變數） |
| 房屋/土地期款拆法 | 每建案不同 → **期款拆分公式編輯器**（如：土地款全數集中於銀行貸款期） |
| 計入合約的車位 | 由該戶別「持有車位」決定；車位價格取**成交價**（非表價/底價） |
| 戶別填寫資料保存 | **存回 `salesHouseholds`**（`contractDocData`），下次開啟帶出 |
| QR code 網址 | 每戶不固定（隨機），於「合約製作設定」Modal **預留欄位由用戶輸入**，前端 `qrcode` 套件即時生成 |
| 磋商條款 | 建案層級條款庫，每則可標適用條件（首購/非首購/店面/不限），依戶別首購欄位**自動預選**、可改 |
| 權限 | 範本管理限**超級管理員/系統管理員**；「合約製作設定」按鈕比照「付款表設定」（sales viewMode） |
| 合約附圖 | 新增第 5 種頁面，取戶別的合約附圖資料夾/檔案連結（Google Drive）；空值則不匯出並提示 |
| 檔案保存 | 僅本機下載（同付款表），不留 Storage / Firestore 產出記錄 |

### 不在本版範圍

- Word 匯出（後續階段；屆時評估 `docx` 套件，優先做純文字頁「合約加註」）
- 自由拖拉版面設計器
- 產出檔案雲端留存

## 2. 整體架構

```
┌─ 全域範本 contractDocTemplates（超管/系管維護，跨建案）
│    └─ 套用到建案時「複製」一份 →
┌─ 建案設定 contractDocConfigs/{projectId}（可再客製，不受範本後續修改影響）
│    ├─ pages[]：頁面組合（類型/紙張/順序/啟用/各類型選項）
│    ├─ priceFormulas：價款公式
│    ├─ installmentSplitRules：期款房/土拆分規則
│    ├─ clauseLibrary：磋商條款庫
│    ├─ bankSets：繳款銀行組（房屋款/土地款/裝潢款…可自由增減）
│    └─ freeFields / signFields 預設值
└─ 戶別資料 salesHouseholds/{docId}.contractDocData（本戶填寫值，保存）
     └─ 合約製作設定 Dialog：帶入戶別資料 + config → 預覽 → 下載
```

- 套用採「**複製**」而非引用：改全域範本不影響已上線建案；建案設定頁保留「從範本重新套用」（整份覆蓋，需二次確認）。
- 集合採本專案慣例：**頂層扁平集合**。`contractDocConfigs` 以 `projectId` 為文件 ID（1:1），不塞進 `projects` 文件（避免銷控端頻繁 snapshot 帶大 payload）。
- Firestore 規則不在版控（Console 手動維護），上線前需於 Console 新增 `contractDocTemplates`、`contractDocConfigs` 兩個 collection 的規則（見 §8）。

## 3. 資料模型

### 3.1 全域範本 `contractDocTemplates/{templateId}`

```js
{
  name: "富宇建設專用範本",
  description: "",
  // 完整建案設定的「母版」：結構與 contractDocConfigs 內容相同（見 3.2，不含 projectId）
  config: { pages, priceFormulas, installmentSplitRules, clauseLibrary, bankSets },
  createdBy: userKey, createdAt, updatedAt
}
```

### 3.2 建案設定 `contractDocConfigs/{projectId}`

```js
{
  projectId,
  templateId: string | null,        // 來源範本（僅記錄，非引用）
  templateName: string | null,
  pages: [ /* 頁面設定，見 §4；order 由陣列順序決定 */ ],
  priceFormulas: [ /* §5.1 */ ],
  installmentSplitRules: { /* §5.2 */ },
  clauseLibrary: [                   // 磋商條款庫
    { id, title: "非首購版", condition: "非首購" | "首購" | "店面" | null, // null=不限
      content: "磋商條款:\n一、…", isDefault: true }
  ],
  bankSets: [                        // 繳款銀行組（可自由增減）
    // source 三種戶別內建來源：取該戶既有 9 個銀行欄位（houseBank*/landBank*/packageBank*）
    { id, label: "房屋款", source: "unit-house" },
    { id, label: "土地款", source: "unit-land" },
    // custom：建案層級固定帳戶（如裝潢款，戶別無對應欄位時使用）
    { id, label: "裝潢款", source: "custom",
      bankName: "永豐商業銀行 營業部",
      accountName: "永豐商業銀行受託信託財產專戶", account: "99622500010603" }
  ],
  updatedBy, updatedAt
}
```

> 繳款銀行帳戶在本系統為**戶別層級欄位**（`salesHouseholds` 上 9 個平面欄位：`houseBankName/houseBankAccount/houseBankAccountName`、`landBank*`、`packageBank*`，`SalesControlSystem.vue:3269-3277`），並已有組裝邏輯 `accountSections`（`PaymentSettings.vue:511-541`，空組自動隱藏）。合約製作沿用同一來源；`bankSets` 的 `custom` 僅用於戶別欄位涵蓋不到的額外項目（如裝潢款）。

### 3.3 戶別保存 `salesHouseholds/{docId}.contractDocData`

僅存「本戶填寫/選擇值」，不存計算結果（每次開啟重算）：

```js
contractDocData: {
  signDate: "2026-08-14" | null,          // 簽約日期覆寫；null=帶入戶別 payment_contract_date（不回寫戶別欄位）
  freeFieldValues: { 贈品: "", 仲人費: 30000, 介紹費: "", 溢差價: "" },
  signFieldValues: { 富宇主管: "", 富宇承辦: "", 專案經理: "陳文賢" },  // 銷售人員不存（永遠即時帶入）
  selectedClauseIds: ["clauseId1"],       // 拆款表勾選的磋商條款
  contractNotes: [                         // 合約加註頁（獨立副本，預設自 selectedClauseIds 同步）
    { id, content, fontSize: 10, rowHeight: null }
  ],
  qrUrl: "https://...",                   // 客戶資料卡 QR 網址（每戶輸入）
  paymentTemplateId: string | null,       // 期款範本手動覆蓋（null=自動）
  manualRows: [...] | null,               // 期款手動微調結果（同付款表 rows 結構，null=未調整；葉列可帶 landOverride=土地款手動覆寫，null=走拆分公式）
  pageOverrides: {                         // 本戶層級的頁面覆蓋
    [pageId]: { enabled: boolean, order: number, repeatCount: number }
  },
  attachmentSelection: [                   // 合約附圖：勾選的檔案與頁碼範圍
    { fileId, fileName, pageRange: "1-3" | null }   // null=全部頁
  ],
  updatedBy, updatedAt
}
```

### 3.4 戶別欄位對應（資料來源）

戶別資料組裝**抽用付款表既有邏輯**：將 `PaymentSettings.vue:756-797` 的 `paymentDocContext` 組裝抽成共用模組 `src/utils/unitDocContext.js`，付款表與合約製作共用，涵蓋：

| 資料 | 來源（既有） |
|---|---|
| 面積（房屋總面積坪/㎡、主建物、附屬建物(陽台)、共有部份、露臺、土地持分坪/㎡、土地持分比例） | `areas` 同 payload（houseTotalPing/Sqm、mainPing/Sqm、ancillaryPing/Sqm、commonPing/Sqm、terracePing、landSharePing/Sqm、landShareRatio） |
| 成交總價 | `calculated.grandTotalSalePrice` |
| 車位清單（編號、成交價） | `parkingSpots[{spotId, price_transaction}]`（成交價，非表價/底價） |
| 銷售人員（陣列→顯示字串） | `formatSalespersons(salesperson)`；帶入後唯讀 |
| 首購/合約方式/優付 | `isFirstTimeBuyer`、`contractType`、`usePreferredPayment` |
| 建案名/戶別編號/戶別顯示 | `projectName`、`unitId`、`unitLabel` |

合約製作額外需要的戶別欄位（key 已核對 `SalesControlSystem.vue:3207-3292` `COLUMN_DEFINITIONS`）：

| 資料 | key（`salesHouseholds`） | 說明 |
|---|---|---|
| 房屋比例 / 土地比例 | `housePriceRatio` / `landPriceRatio` | 百分比整數（55/45），儲存時已驗證合計=100（`UnitDetailModal.vue:1734-1741`）；0/0 表未設定 |
| 客戶姓名 / 電話 / 身分證字號 | `buyerName` / `buyerPhone` / `buyerIdNumber` | 買方欄位；`buyerPhone` 為逗號串接字串 |
| 簽約日期 | `payment_contract_date` | Firestore Timestamp；Modal 帶入後可覆寫（存 `contractDocData.signDate`） |
| 成交總價（含車位） | `price_transaction_total` | 萬元；由前端自動同步（`SalesInfoForm.vue:856-859`） |
| 面積（㎡/坪） | `area_house_sqm/ping`、`area_main_sqm/ping`、`area_ancillary_sqm/ping`、`area_common_sqm/ping`、`area_terrace_ping`、`land_share_sqm/ping` | 全 Number；資料 key 沿用既有（Excel 匯入標頭為「共用部分面積」），**文件顯示用字一律「共有部份」** |
| 土地持分比例 | `land_share_ratio` | 只存分子，分母固定十萬（882 → 882/100000） |
| 車位 | `salesParkings` 中 `buyerUnitId === unitId` 為準（同 `PaymentSettings.vue:506-509` fallback），`持有車位` 為快照 | 成交價 `price_transaction`；車位描述以 `spotId(type/type2/size)` 組字串（「B2-058(法定/坡道平面/550*250)」） |
| 繳款銀行 | `houseBank*` / `landBank*` / `packageBank*` 共 9 欄 | 經 `accountSections` 邏輯組裝 |
| 地址 | `buyerMailingAddressCity` + `buyerMailingAddressDistrict` + `buyerMailingAddressDetail` | 拆款表「地址」列 = **買方通訊地址**（三欄串接） |
| **合約附圖** | **`contractDrawingFolderUrl`**（String） | **欄位已存在**：`COLUMN_DEFINITIONS`（`SalesControlSystem.vue:3293`，Excel 標頭「合約分戶圖位置」），戶別 Modal 已有連結按鈕（`UnitDetailModal.vue:672`），後端上傳已正規化（`functions/index.js:1266-1268`）。直接沿用，不需新增 |

## 4. 頁面類型規格

每個頁面設定共同結構：

```js
{
  id: string,                 // uuid
  type: "breakdown" | "bankAccounts" | "paymentDetail" | "contractNotes" | "contractAttachments",
  title: "拆款表",            // 顯示/匯出名稱，可改
  enabled: true,              // 預設是否啟用
  paper: { size: "A4" | "A3" | "B4" | "Letter", orientation: "portrait" | "landscape" },
  repeatCount: 1,             // 同一頁重複份數（供裁剪浮貼；預設 1）
  options: { /* 依 type，見下 */ }
}
```

同一 `type` 可建多頁（例：付款明細表建「房屋版」「土地版」兩頁）。

### 4.1 `breakdown` 拆款表（簽約會辦單）

版面依範例 sheet「拆款表」：

1. **表頭**：標題（預設「簽約會辦單」，options 可改）；個案名稱、客戶姓名、身分證字號、房屋編號、總價、聯絡電話、地址、簽約日期、車位編號（每車位一列，含價款）、房地價款、車位價款。
2. **面積區**：房屋總面積（㎡/坪）、主建物（占比%、㎡/坪）、附屬建物(陽台)、共有部份、專有部分(合計)、車位面積、土地持分（比例、㎡/坪）。（顯示用字一律「共有部份」）
3. **價款區**：房屋款、主建物價款、附屬建物(陽台)價款、專有部份價款、共有部份價款——全部由 **priceFormulas 公式引擎**計算（§5.1）。
4. **付款明細（橫式表格）**：欄位隨選定期款範本動態產生（訂金、簽約金、工程期款 1..N、使照取得、銀行貸款、交屋款…）；列為「房屋 / 土地 / 合計 / 比例」，房/土拆分依 `installmentSplitRules`（§5.2）。期款選擇與計算沿用付款表：範本自動預選（`PaymentSchedulePreviewDialog.vue` `autoTemplate` 邏輯）＋手動兩層選擇器＋`runNewCalculationEngine`。
5. **備註**：自由輸入。
6. **磋商條款**：自 `clauseLibrary` 勾選（可複選），依戶別首購欄位自動預選符合 `condition` 的條款；內容可於 Modal 內就地微調（只影響本戶，不回寫條款庫）。
7. **自由欄位列**（贈品/仲人費/介紹費/溢差價）：`options.freeFields` 定義，可增減。
8. **簽核欄**（富宇主管/富宇承辦/專案經理/銷售人員）：`options.signFields` 定義；`source: "salesperson"` 者系統帶入且唯讀。

```js
options: {
  headerTitle: "簽約會辦單",
  freeFields: [   // 手動輸入欄，可空白
    { key: "gift",       label: "贈品",   type: "text",   default: "" },
    { key: "brokerFee",  label: "仲人費", type: "number", default: null },
    { key: "referralFee",label: "介紹費", type: "number", default: null },
    { key: "priceDiff",  label: "溢差價", type: "number", default: null }
  ],
  signFields: [
    { label: "富宇主管",  source: "manual", default: "" },
    { label: "富宇承辦",  source: "manual", default: "" },
    { label: "專案經理",  source: "manual", default: "陳文賢" },
    { label: "銷售人員",  source: "salesperson", readonly: true }
  ]
}
```

### 4.2 `bankAccounts` 繳款銀行帳戶名稱

```js
options: {
  bankSetIds: ["房屋款SetId"],     // 本頁顯示哪幾組（自 config.bankSets 勾選）
  showQr: true,                    // 是否顯示「請填寫客戶資料卡」QR 區塊
  qrLabel: "請填寫客戶資料卡"
}
```

- 每組帳戶一段：繳款銀行名稱 / 戶名 / 帳號 + 戶別編號。
- QR code：網址存於戶別 `contractDocData.qrUrl`（Modal 輸入），前端 `qrcode` 套件生成 dataURL，隨 payload 傳後端嵌入（同付款表 QR 資料流，`PaymentSchedulePreviewDialog.vue:1104-1108` 模式）。未輸入網址時 QR 區塊整塊不顯示。
- 「同一頁重複 2 份」用共同的 `repeatCount: 2`（列印裁剪浮貼）；非每建案需要，預設 1。
- 需要不同項目分頁者（房屋/土地/裝潢款不同銀行）：建多個 `bankAccounts` 頁、各指定 `bankSetIds`，或同頁多組。

### 4.3 `paymentDetail` 付款明細表

```js
options: {
  mode: "combined" | "house" | "land",  // 房土同頁 / 房屋版 / 土地版
  noteText: "備註：本附件所列各款明細與契約所訂總價若有不符情事，概以本契約第七條之金額為準。",
  showSignColumn: true                  // 收款人簽章欄
}
```

- 列＝期款項目（期別名稱含工程期款子項直排群組），欄依 mode：
  - `combined`：房屋款 / 土地款 兩欄 + 收款人簽章；「加總」列各欄合計、「合計總價」列 = 房+土（範例 sheet 樣式）。
  - `house`：僅房屋款欄，總價=房屋款總額；`land`：僅土地款欄，總價=土地款總額。
- 金額單位：**元**（拆款表為萬，本頁 ×10000，千分位、0 顯示「-」）。
- 金額來源：同一份期款計算結果（拆款表付款明細）× 房/土拆分規則，確保兩頁數字一致。

### 4.4 `contractNotes` 合約加註

```js
options: {
  defaultFontSize: 10,        // pt
  blockWidthMm: null,         // 條款區塊寬度（null=滿版）
  blockHeightMm: null,        // 區塊高度（供裁剪定位）
  showBuyerSignLine: true     // 「買方簽名：＿＿＿」列
}
```

- 預設內容 = 拆款表勾選的磋商條款（`selectedClauseIds` 展開），**同步為預設值**；用戶可在本頁獨立修改/刪除/新增更多加註條款（存 `contractDocData.contractNotes`），**不回寫**拆款表勾選。
- 拆款表勾選變更時：若本頁尚未手動編輯過→自動跟隨；已手動編輯→顯示「與拆款表不同步」提示 + 「重新同步」按鈕（覆蓋確認）。
- 每則條款可個別調整字體大小、列高；頁層級可調區塊寬度——所見即所得，供列印裁剪。
- `repeatCount` 支援同頁多份（同一條款印兩份裁剪）。

### 4.5 `contractAttachments` 合約附圖

```js
options: {
  sourceField: "contractDrawingFolderUrl",   // 取用的 salesHouseholds 欄位 key（config 可改；既有欄位，見 §3.4）
  fitMode: "fit" | "fill"          // 圖檔縮放進紙張的方式
}
```

- 戶別欄位值可能是 **Drive 資料夾連結**或**單一檔案分享連結**：
  - 資料夾 → 既有 `driveProxyList`（`api.js:6271`）列出檔案，僅收 PDF / 圖檔（png/jpg/jpeg/webp）。
  - 檔案連結 → 以既有 fileId 解析 regex（`/\/d\/([a-zA-Z0-9_-]+)/`、`[?&]id=`，同 `deprecateInspectionReport` 模式）取單檔。
- Modal 內顯示檔案清單（含縮圖/檔名），用戶勾選要匯出的檔案；PDF 檔可填**頁碼範圍**（如 `1-3,5`，空白=全部），存 `contractDocData.attachmentSelection`。
- 欄位空值或資料夾無可用檔案：本頁自動排除匯出，前端顯著提示「**目前無合約圖檔可匯出**」。
- 僅進 PDF 匯出；**EXCEL 匯出不含本頁**（Excel 不適合嵌 PDF，前端於匯出勾選 UI 註明）。

### 4.6 全頁共同：匯出控制

- 「合約製作設定」Modal 內有**頁面清單**：勾選啟用（預設依 config + 本戶 `pageOverrides`）、`vuedraggable` 拖曳排序 + 上/下按鈕（同 `SalesSettings.vue:361` 模式）、每頁「單獨匯出」按鈕。
- 「下載 PDF」= 勾選頁面依順序合併為**單一 PDF**（pdfkit 支援逐頁不同 size/layout：`addPage({size, layout})`）。
- 「下載 EXCEL」= 每頁一個 worksheet（各自 pageSetup 對應紙張/方向），合約附圖頁跳過。
- 實作註：EXCEL 版拆款表的付款明細採**直式清單**（期別/比例/房屋款/土地款/合計逐列），不做橫式動態欄——Excel 動態欄寬與合併在各建案期款數不同時難以維持版面，直式較利於後續編輯；PDF 版維持橫式（同範本樣式）。

## 5. 公式引擎擴充

### 5.1 價款公式編輯器 `priceFormulas`

**系統已有價款公式基礎建設，直接沿用並擴充**：

- 引擎：`src/composables/usePriceFormula.js` — token 式公式（`{type:'ref'|'op'|'paren'|'number'}`）+ `rounding: {mode: 'round'|'ceil'|'floor', decimals}`；既有 `computeHouseLandPrices(unitData, formulaSettings)`（`:212-259`）已依 `projects.priceFormulaSettings` 算出**房屋價款/土地價款**（含特殊合約以 `price_package_deal` 為基準、車位成交價加總等邏輯）。
- 編輯器 UI：`src/components/FormulaEditor.vue` + `PriceFormulaDialog.vue`（既有，變數 chips + 運算子 + 進位設定）。

合約製作的擴充：

```js
priceFormulas: [   // 有序陣列；每項結果自動註冊為後續項目可引用的 ref
  { key: "houseAmount",     label: "房屋款",
    tokens: [ {type:'ref',key:'housePrice'}, {type:'op',op:'-'}, {type:'ref',key:'parking'} ],
    rounding: { mode: 'round', decimals: 1 }, showOnPage: true },
  { key: "ancillaryAmount", label: "附屬建物(陽台)價款",
    tokens: [/* (房屋款)/房屋總面積㎡*附屬建物面積㎡*0.95 */], rounding: {mode:'round',decimals:1} },
  { key: "commonAmount",    label: "共有部份價款",   tokens: [/* …共有部份面積㎡*0.95 */], ... },
  { key: "mainAmount",      label: "主建物價款",     tokens: [/* 房屋款-附屬-共有 */], ... },
  { key: "exclusiveAmount", label: "專有部份價款",   tokens: [/* 主建物+附屬 */], ... }
]
```

- **基礎 ref 變數**：既有 `total / parking / houseRatio / landRatio / housePrice / landPrice`（`housePrice`/`landPrice` 直接取 `computeHouseLandPrices` 結果，與銷控/付款表口徑一致，合約 config 不重複定義），**新增面積 ref**：`houseAreaSqm / houseAreaPing / mainAreaSqm / ancillaryAreaSqm / commonAreaSqm / landShareSqm`（自 `area_*` 欄位注入 context）。
- `usePriceFormula.js` 需泛化：ref 定義表改為可注入擴充（面積變數 + 前面已定義的 `priceFormulas` 項目），求值改為依陣列順序逐項計算（編輯器僅提供「排在前面的項目」為可選 chips，天然避免循環依賴）。既有 `housePriceFormula`/`landPriceFormula` 呼叫端行為不變。
- **進位**：沿用 `rounding: {mode, decimals}`——「四捨五入到小數第一位」= `{mode:'round', decimals:1}`。
- **試算預覽**：編輯器附「以本建案任一戶試算」（選一戶帶入實際值即時顯示各價款結果）。
- 錯誤處理：ref 缺值（如戶別未填比例/面積）→ 該項標錯，前端紅字標示該價款欄、下載 disabled。

### 5.2 期款房/土拆分編輯器 `installmentSplitRules`

```js
installmentSplitRules: {
  defaultLandTokens: [ {type:'number', value:0} ],   // 未指定的期別：土地款公式（預設 0 = 全屬房屋款）
  rules: [                          // 依期別名稱比對（含母子項目名，同期款範本 items name）
    { itemName: "產權移轉完成款(銀行貸款)", landTokens: [ {type:'ref', key:'landPrice'} ] }
    // 其他建案可能：{ itemName: "簽約金", landTokens: [/* 期款金額*土地比例% */] }
  ]
}
```

- 計算順序：期款範本算出各期**總額**（既有 `runNewCalculationEngine`）→ 每期以 token 公式（§5.1 同一引擎/編輯器）算 `土地款`、`房屋款 = 期款金額 - 土地款`。
- **每戶個別手動調整（2026-09-02 新增）**：合約製作 Dialog 期款表每一葉列（單期列／群組子項）多出「房屋款(萬)／土地款(萬)」兩欄，直接輸入即覆寫該期拆分。覆寫值以 `landOverride`（土地款）為單一真值存於 `manualRows` 葉列；輸入房屋款時換算成 `landOverride = 期款金額 − 房屋款`。`null` / 清空 / 按回復鍵 = 走公式。該期金額（比例）變動時覆寫的土地款維持不動、差額由房屋款吸收；換期款範本時 `manualRows` 重建，覆寫一併清除。`buildSplitModel` 在公式結果上套覆寫並回傳 `manualSplit` 標記與 `landDiff`，後端 payload 仍為算好的 `houseAmount/landAmount`（後端無需更動）。
- 可用 ref：`installmentAmount`（該期總額）、`landPrice`、`housePrice`、`total`、`houseRatio`、`landRatio` + priceFormulas 各項結果。
- **驗證**（不過則下載 disabled + 紅字）：Σ各期土地款 = 土地價款；Σ各期房屋款 = 房屋款總額（容差同付款表：金額整數精確、比例 0.01%）。尾差一鍵補正：差額歸入指定期（預設銀行貸款期），同付款表 `applyCorrection` 模式；土地款差額另有「一鍵補正土地差額」（把 `landDiff` 加到指定葉列的 `landOverride`，預設銀行貸款期、其次最後一期）。
- **編輯器 UI**：建案設定內表格——選定「預覽用期款範本」後列出全部期別，每列一欄「土地款公式」（空=預設公式），chips 輸入同 §5.1；即時顯示試算與合計驗證。
- 期別名稱比對不到（範本改名/換範本）：該 rule 顯示警告並視為未指定（走 default）。

## 6. 前端元件與流程

### 6.1 全域範本管理（超管/系管）

- 新 view `src/views/ContractDocTemplateManager.vue`，路由 `/contract-doc-templates`，`meta.requiredRoles: ['超級管理員','系統管理員']`（比照 `router/index.js:716` AdminToolsCenter 模式），入口放系統管理選單。
- 功能：範本清單 CRUD、複製；編輯畫面 = 與 §6.2 相同的設定編輯器（共用元件），另有「另存為全域範本」。

### 6.2 建案設定（SalesSettings 新分頁）

- `SalesSettings.vue` v-tabs 新增分頁 `contractDoc`「合約製作範本」（比照 `paymentTerms` 分頁：`SalesSettings.vue:424-426` 一行掛載子元件），掛 `src/components/ContractDocConfigEditor.vue`（自 `route.params.projectId` 取建案，同 `PaymentTermsSettings` 模式）。
- 分頁內容加權限 gate：`userStore.currentUserRoles` 含超級管理員/系統管理員才可編輯（其餘唯讀或隱藏），寫法比照 `UserManagement.vue:1698`。
- 區塊：
  1. **套用範本**：選全域範本 → 複製到 `contractDocConfigs/{projectId}`（已有設定時覆蓋確認）；「另存為全域範本」回寫。
  2. **頁面管理**：頁面清單（新增指定 type、刪除、拖曳排序、每頁設定：標題/紙張尺寸方向/repeatCount/type options）。
  3. **價款公式編輯器**（§5.1）。
  4. **期款拆分編輯器**（§5.2）。
  5. **磋商條款庫**：條款 CRUD（標題/適用條件/內容）。
  6. **繳款銀行組**：bankSets CRUD（`unit-house`/`unit-land`/`unit-package` 來源直接引用戶別欄位，僅 `custom` 需在此填帳戶資料）。

### 6.3 合約製作設定 Dialog（銷售端）

- `UnitDetailModal.vue`：
  - 桌面按鈕列（`:680-683` 付款表設定旁）新增 `合約製作設定`（`v-if="viewMode === 'sales'"`，icon `mdi-file-document-edit`）。
  - 手機版 stacked 按鈕（`:709-715` 旁）新增「合約製作」。
  - 掛載 `<ContractDocDialog v-if="contractDocDialog" :show ... :unit-data="enrichedUnitData" :project-id :project-name :all-data />`（同 PaymentSettings 掛載模式 `:775-778`）。
- 新元件 `src/components/ContractDocDialog.vue`（fullscreen on mobile，桌機 max-width 1500px，手機 v-tabs「資料編輯/預覽」——整體結構仿 `PaymentSchedulePreviewDialog.vue`）：
  - **左欄（編輯）**：
    - 頁面清單（啟用勾選/排序/單頁匯出）
    - 期款範本選擇（自動預選 + 手動覆蓋，複用 `autoTemplate` 邏輯；比例/金額微調表沿用付款表雙向連動）
    - 拆款表欄位（簽約日期、自由欄位、簽核欄、備註、磋商條款勾選）
    - QR 網址輸入（即時 QR 預覽）
    - 合約附圖：載入檔案清單（`driveProxyList`）、勾選 + 頁碼範圍
  - **右欄（預覽）**：HTML/CSS 逐頁模擬（各頁依 paper 尺寸容器 + CSS zoom 縮放，同 `.preview-sheet` 模式），與左欄即時連動。
  - **底部**：`儲存`（寫 `contractDocData`）、`下載 PDF`、`下載 EXCEL`、`關閉`。下載前自動儲存；驗證不過（§5.2、期款 100%/總價相符）disabled。
  - 開啟時：讀 `contractDocConfigs` + `contractDocData` 合併；無 config 時提示「本建案尚未設定合約製作範本」並僅顯示引導。
- 檔名：`{yyyyMMdd}-{建案名}-合約製作-{戶別}-{銷售人員}.pdf/.xlsx`（台灣時間，同付款表慣例）；單頁匯出附頁名：`…-合約製作-{頁名}-{戶別}….pdf`。

### 6.4 api.js 新增

```js
// 全域範本
fetchContractDocTemplates() / setContractDocTemplate(id, data) / deleteContractDocTemplate(id)
// 建案設定
fetchContractDocConfig(projectId) / setContractDocConfig(projectId, data)
// 戶別
updateContractDocData(householdDocId, contractDocData)   // merge 寫入
// 產製
generateContractDocument(payload)   // httpsCallable, timeout 300000
```

## 7. 後端：`generateContractDocument` Cloud Function

```js
exports.generateContractDocument = onCall({
  region: "asia-east1",
  timeoutSeconds: 300,          // 含 Drive 抓附圖
  memory: "512MiB",             // 依專案規範
  secrets: driveSecrets,        // 僅為合約附圖頁；無附圖頁時不觸發 Drive
})
```

- 渲染模組獨立檔案 `functions/contractDocument.js`（同 `paymentDocument.js` 模式，index.js 內 lazy require），匯出 `buildContractPdf` / `buildContractExcel`。
- 字型沿用 `functions/assets/fonts/NotoSerifTC-Regular.otf / -Bold.otf`。
- **新增依賴 `pdf-lib`**（functions/package.json）：pdfkit 產出主文件後，用 pdf-lib 合併合約附圖（append 選定 PDF 的指定頁碼範圍；圖檔轉嵌單頁）。pdfkit 本身無法匯入既有 PDF 頁，故需此套件。
- 合約附圖下載：`getAuthenticatedDriveClient()`（`index.js:277-285` 既有）+ `files.get({alt:'media'})` 抓 buffer；單檔失敗不中斷整份，回傳 `warnings` 列出失敗檔名。
- 後端**信任前端計算結果**（同付款表原則）：僅 schema 驗證 + 期款比例/金額合計、房土拆分合計複核，不符回 `invalid-argument`。

### 7.1 Request payload（骨架）

```js
{
  projectId, format: 'pdf' | 'excel',
  fileNameParts: { projectName, unitId, salesperson },
  pages: [               // 已依用戶勾選與排序，僅含要匯出的頁
    { type, title, paper: {size, orientation}, repeatCount,
      data: { /* 依 type：前端算好的顯示值（含拆款價款、期款列、房/土金額、條款文字、
                 銀行組、qrDataUrl、簽核欄值、附圖 fileId+pageRange 清單…） */ } }
  ]
}
```

### 7.2 Response

```js
{ status: 'success', fileName, mimeType, base64, warnings: [] }   // 前端 file-saver 下載
```

- 附圖多時 PDF 可能較大；onCall 回應上限 10MB，超出時回 `resource-exhausted` 明確錯誤，提示用戶減少附圖頁數（本版不做 Storage 中轉）。

## 8. 權限與 Firestore 規則（Console 手動設定）

| Collection | 讀 | 寫 |
|---|---|---|
| `contractDocTemplates` | 已登入 | roles 含 超級管理員/系統管理員 |
| `contractDocConfigs` | 已登入（該建案權限） | roles 含 超級管理員/系統管理員 |
| `salesHouseholds.contractDocData` | 沿用既有戶別規則 | 沿用既有戶別規則 |

前端 UI gate：範本管理路由 `requiredRoles`；建案設定分頁內以 `currentUserRoles` 判斷；「合約製作設定」按鈕比照付款表設定（`viewMode === 'sales'`）。

## 9. 邊界情況

- **建案未設定 config**：Dialog 顯示引導提示，不可產製。
- **戶別缺房屋/土地比例**：價款區顯示錯誤標示，下載 disabled，提示補齊戶別資料。
- **無適用期款範本**：同付款表——提示引導，不開放全手動。
- **成交總價 0/未設定**：下載 disabled。
- **磋商條款庫為空**：拆款表條款區留白；合約加註頁仍可手動新增。
- **合約附圖欄位空/無可用檔**：該頁自動排除 + 提示「目前無合約圖檔可匯出」；其餘頁照常匯出。
- **附圖檔 Drive 抓取失敗**：跳過該檔、`warnings` 回報，不中斷。
- **期款範本事後被改/刪**：`paymentTemplateId` 失效時回自動預選並提示；`manualRows` 與現行範本結構不符時捨棄並提示重調。
- **repeatCount=2 且內容過長**：預覽即時顯示溢出警示（超出半頁高度）。
- **EXCEL 與合約附圖**：跳過附圖頁，匯出結果 toast 註明。
- **同 type 多頁**（房屋版/土地版付款明細）：驗證各自總價 = 房屋款總額/土地款總額。

## 10. 檔案異動清單

### 新增

| 檔案 | 內容 |
|---|---|
| `src/views/ContractDocTemplateManager.vue` | 全域範本管理（超管/系管） |
| `src/components/ContractDocConfigEditor.vue` | 建案設定編輯器（頁面/公式/條款庫/銀行組；範本管理共用） |
| `src/components/ContractDocDialog.vue` | 銷售端合約製作設定 + 預覽 + 下載 |
| `src/utils/unitDocContext.js` | 自 `PaymentSettings.vue` 抽出的戶別文件資料組裝（付款表/合約製作共用） |
| `functions/contractDocument.js` | pdfkit + pdf-lib + exceljs 渲染模組 |

### 修改

| 檔案 | 內容 |
|---|---|
| `src/components/UnitDetailModal.vue` | 「合約製作設定」按鈕（桌面 + 手機）與 Dialog 掛載（合約附圖沿用既有欄位，免加輸入框） |
| `src/views/SalesSettings.vue` | 新增 `contractDoc` 分頁掛 `ContractDocConfigEditor` |
| `src/views/PaymentSettings.vue` | **維持原狀**（其 context 依賴對話框內可編輯的 formData，抽共用會改變行為；`unitDocContext.js` 為合約製作專用的純函式版本） |
| `src/composables/usePriceFormula.js` | ref 定義表可注入擴充（面積變數 + priceFormulas 前項）、依序求值；既有呼叫端行為不變 |
| `src/api.js` | §6.4 新增 API |
| `src/router/index.js` | `/contract-doc-templates` 路由（requiredRoles） |
| `functions/index.js` | `generateContractDocument` onCall（lazy require 模組） |
| `functions/package.json` | 加 `pdf-lib` |

### Firebase Console（非版控）

- Firestore 規則：新增 `contractDocTemplates`、`contractDocConfigs`（§8）。

## 11. 實作分期建議

| 階段 | 內容 |
|---|---|
| Phase 1 | 資料模型 + 建案設定編輯器（頁面/公式/條款庫/銀行組）+ `unitDocContext` 模組 + `usePriceFormula` 擴充 |
| Phase 2 | 合約製作設定 Dialog：拆款表 + 付款明細表（含期款選擇/房土拆分/驗證）預覽 |
| Phase 3 | 繳款銀行頁 + 合約加註頁 + QR + repeatCount |
| Phase 4 | 後端 PDF/EXCEL（`contractDocument.js`）+ 下載流程 |
| Phase 5 | 合約附圖頁（Drive 清單/勾選/pdf-lib 合併） |
| Phase 6 | 全域範本管理 + 套用/另存 + 權限 gate 收尾 |
| 後續 | Word 匯出（`docx`，優先合約加註頁） |

## 12. 部署

- 前端：`npm run release:safe`
- 後端：`cd functions && npm install`，`FUNCTIONS_DISCOVERY_TIMEOUT=120 firebase deploy --only functions:generateContractDocument`
- Firebase Console：Firestore 規則手動新增（§8）
