# 請佣獎金系統 SPEC

> 版本：v1.1（已依 v1.0 完成全部三階段實作；本版同步實作時的架構調整，見 §11）
> 參考來源：`docs/local/富宇學森-請佣獎金系統.gs`、`富宇學森-請佣獎金系統(DIALOG).html`、`富宇學森-請佣獎金系統.xlsx`
> 目標：將 GAS + Google Sheet 版「佣金/獎金表製作」重建為銷控系統內建功能，並通用化到所有建案/公司。

---

## 1. 概述

### 1.1 功能定位
- **請佣**：對業主請領銷售服務佣金。以「戶別＋期別」為單位，每戶可分次請佣，累計不可超過 100%。
- **獎金**：對內部（含跨建案）人員發放獎金。依獎金類別（主委/副總/輔導/專案/副專/銷售個獎/銷售團獎/專案團獎…可自訂）計算獎金池，池內人員依「自訂分配比例或鎖定金額」分配，每人再扣保留款/稅金/二代健保得出實發。
- **匯出**：請佣總表、業務獎金表（Excel＋PDF），支援「欄位版型」選擇、預覽與擴充，不同建案/公司可各自維護格式。
- **歷史銜接**：上傳舊系統的「請佣紀錄」「獎金紀錄」Excel，完整進系統，讓已請比例與期別自動接續。

### 1.2 已確認的需求決策（與業主問答結論）

| 項目 | 決定 |
|---|---|
| 入口/權限 | 銷控系統內入口＋獨立權限「請佣獎金」（systemFunctions 新增），無權限者看不到入口 |
| 人員設定 | 擴充 `salesPersonnel`（不另建人員 collection） |
| 匯出產製 | Excel 前端產（xlsx-js-style）、PDF 後端產（pdfkit，同付款表模式） |
| 歷史上傳 | 完整匯入舊「請佣紀錄」＋「獎金紀錄」明細 |
| 修改機制 | 送出後不可編輯，可「作廢」（保留痕跡、比例回溯）後重建 |
| 版型架構 | 全域範本庫（超管/系管維護）＋建案版型（套用即複製、可另存回範本庫），請佣總表/獎金表各一套 |
| 獎金類別 | 類別清單可自訂（預設帶入 8 類），每類設比例與發放方式 |
| 優付規則 | 讀 `isPreferredPayment` 自動判定，預設佣金減半、比例可設定，優付列文字可自訂 |
| 累計/保留款 | 要做人員獎金累計查詢（本案＋跨案）與保留款追蹤（含發還登記） |
| 分配方式 | 百分比（預設均分）＋金額鎖定並行 |
| 他案人員 | 跨建案搜尋 salesPersonnel（電話識別同一人）＋可臨時新增 |
| 他案扣款比例 | 帶入原案設定，可逐次覆寫 |
| 跨案累計 | 累計查詢支援「本建案／跨建案」切換，以電話彙總 |

---

## 2. 名詞與公式定義（沿用舊系統，計算需 100% 一致）

金額單位慣例：`salesHouseholds` 價格欄位為「萬」，獎金/請佣金額為「元」。

### 2.1 戶別基礎值（皆取自現有 `salesHouseholds` / enrich 計算欄位）

| 名詞 | 來源 |
|---|---|
| 總成交價(含車) `dealTotal` | `total_transaction`（= `price_transaction_house` + `parking_trans_total`，萬） |
| 總底價 `totalFloor` | `total_floor`（= `price_floor_house_total` + `parking_floor_total`，萬） |
| 溢差價 `spread` | `price_diff`（萬） |
| 房屋成交價/車位成交總價 | `price_transaction_house` / `parking_trans_total` |
| 房屋總底價/車位底價 | `price_floor_house_total` / `parking_floor_total` |
| 是否優付 | `isPreferredPayment` |
| 簽約/小訂日期 | `payment_contract_date` / `payment_deposit_date` |
| 買方姓名/持有車位/備註 | `buyerName` / `parking_spots` / `remarks` |
| 銷售人員 | `salesperson`（陣列，經 `salespersonUtils.normalizeSalespersons()` 正規化） |

### 2.2 請佣計算（每戶每次）

輸入：本次請佣比例 `ratioPct`、佣金比例 `commPct`（預設值見 §2.4）、甲方負擔介紹費 `partyBFee`（元，預設欄名「富宇負擔介紹費/贈品」）、保留款比例 `keepPct`（預設 10）。

```
feeWan       = partyBFee / 10000                          // 介紹費（萬）
realSpread   = spread − feeWan                            // 實際溢差價（萬）
comm         = commPct / 100（未填 → 優付 ? 預設佣金×優付倍率 : 預設佣金）
baseWan      = min(dealTotal − feeWan, totalFloor)        // 請佣基準（萬）
realClaim    = round(baseWan × comm × 10000)              // 實際請領金額（元）
claimKeep    = round(realClaim × keepPct/100)             // 請佣保留款（元）
thisClaim    = realClaim − claimKeep                      // 本次請佣（元）
```

> 注意：`realClaim` 為整戶 100% 的請領金額，`ratioPct` 不影響請佣金額（與舊系統一致——分次請佣時各期各自匯出，比例僅控制獎金池折算與 100% 上限）。

### 2.3 獎金計算（每戶每次）

輸入：受託方負擔介紹費 `partyAFee`（元，預設欄名「一研九鼎負擔介紹費/贈品」，計入折數）、各類獎金比例 `rates[cat]`（小數）、各類參與人員與分配 `allocations[cat]`。

```
base       = min(totalFloor, dealTotal × comm) × 10000    // 元
discount   = base > 0 ? round2((base − partyAFee) / base) : 0   // 獎金折數，四捨五入至小數第 2 位
dealAfter  = round(dealTotal × discount)                  // 折數後總價（萬），四捨五入至萬位
pool[cat]  = dealAfter × rates[cat] × 10000 × ratio       // 該類獎金池（元），ratio = ratioPct/100
```

**分配（新需求，取代舊系統固定均分）**：
- 每類參與人員每人有 `sharePct`（百分比）或 `lockedAmount`（鎖定金額，元）兩種模式之一。
- 預設行為：勾選人員即自動均分（n 人各 100/n%，與舊系統相容）。
- 鎖定金額者：`amt = lockedAmount`；其餘未鎖定者按彼此 sharePct 相對比例分配 `pool − Σlocked`。
- 每人金額 `amt[cat][person] = round(pool[cat] × sharePct/100)` 或鎖定值；分配後以「最後一人吃差額」修正 rounding，使 Σ = round(pool)。
- 驗證：`Σlocked ≤ pool`；未鎖定者 sharePct 合計 = 100%（容差 0.01）；違反即擋送出。

**每人扣款與實發**：
```
subtotal = Σ_cat amt[cat][person]
keep = round(subtotal × keepRate)     // 人員保留款%（人員設定值，可逐次覆寫）
tax  = round(subtotal × taxRate)
nhi  = round(subtotal × nhiRate)
net  = subtotal − keep − tax − nhi
```

### 2.4 佣金比例預設與優付

- 建案設定 `defaultCommissionPct`（對應舊「獎金設定」的包櫃佣金/包銷佣金，例 2.2）。
- 優付戶：`comm = defaultCommissionPct × preferredPaymentFactor`，`preferredPaymentFactor` 預設 0.5，可於建案設定調整。
- 每戶請佣時可逐戶覆寫 `commPct`。

### 2.5 100% 上限驗證

`已請比例(該戶所有 active 紀錄的 ratioPct 加總) + 本次 ratioPct ≤ 100`（容差 0.0001）。超過者整批拒絕（後端 transaction 內驗證，防並發）。作廢的紀錄不計入。

### 2.6 匯出時的「100% 重算」規則（非 100% 分組獎金表）

與舊系統一致：非 100% 請佣比例的分組，獎金表金額一律以 **100% 重算**呈現（由 `commissionRecords` 內保存的 rates + allocations 重算，四捨五入只做一次，避免先打折後還原的二次進位），並於「合計」下加一列「優付方案請款XX%」顯示折算後實際金額（= `bonusRecords` 實際值）；保留款/稅金/健保/實發以折算後金額為準。

---

## 3. 權限與入口

1. `systemFunctions` 新增功能：`{ name: '請佣獎金', description: '請佣與獎金製作、匯出、歷史管理' }`（管理員於 UserManagement「功能」分頁建立，再對使用者授權）。
2. 入口：`SalesControlSystem.vue` 工具列新增「請佣獎金」按鈕（icon: `mdi-cash-multiple`），僅當 `userStore.hasProjectPermission('請佣獎金', projectName)` 為真時顯示。
3. 路由：
   ```js
   { path: '/commission-bonus/:projectId', name: 'CommissionBonus',
     component: () => import('@/views/CommissionBonus.vue'),
     meta: { requiresAuth: true, layout: DefaultLayout, requiredSystem: '請佣獎金', title: '請佣獎金' } }
   ```
4. 全域版型範本管理：`/commission-export-templates` → `CommissionTemplateManager.vue`，`requiredRoles: ['超級管理員','系統管理員']`（仿 `ContractDocTemplateManager.vue`）。
5. Firestore rules：新 collection 比照現有 collection 授權模式；讀寫皆需登入，敏感金額資料不開放公開讀取。

---

## 4. 資料模型（Firestore，flat collection + projectId，具名 DB `anxi-app`）

### 4.1 `commissionSettings/{projectId}` — 建案設定（單一文件）

```js
{
  projectId,
  defaultCommissionPct: 2.2,          // 預設佣金比例（%）
  preferredPaymentFactor: 0.5,        // 優付倍率
  defaultKeepPct: 10,                 // 請佣保留款預設 %
  defaultCashPct: 50,                 // 現金比例預設 %
  // 可自訂文字
  partyALabel: '一研九鼎負擔介紹費/贈品',   // 計入折數的介紹費欄名
  partyBLabel: '富宇負擔介紹費/贈品',       // 計入請佣基準的介紹費欄名
  kiloLabel: '千4',                          // 獎金表「千4」標籤
  youfuLabelPattern: '優付方案請款{pct}%',   // 非100%分組合計列文字
  claimTitlePattern: '{建案名}－業務服務佣金第{期別中文}次請款',
  claimFileNamePattern: '{簡稱}NO.{期別}請款-{民國年月}',
  bonusFileNamePattern: '{簡稱}NO.{期別}獎金-{民國年月}',
  projectShortName: '學森',                  // 檔名用簡稱
  note1: '1、本次請領按委託銷售契約…',        // 請佣總表條文（可多筆）
  note2: '2、請領費用按合約第7條…',
  // 獎金類別（可自訂，預設帶入 8 類）
  bonusCategories: [
    { key: 'chairman',  label: '主委獎金',  ratePct: 0.05,  mode: 'role',       rolePositions: ['主委'],   enabled: true, order: 1 },
    { key: 'vp',        label: '副總獎金',  ratePct: 0.05,  mode: 'role',       rolePositions: ['副總'],   enabled: true, order: 2 },
    { key: 'coach',     label: '輔導獎金',  ratePct: 0.05,  mode: 'role',       rolePositions: ['輔導專案'], enabled: true, order: 3 },
    { key: 'pm',        label: '專案獎金',  ratePct: 0.1,   mode: 'role',       rolePositions: ['專案'],   enabled: true, order: 4 },
    { key: 'apm',       label: '副專獎金',  ratePct: 0.05,  mode: 'role',       rolePositions: ['副專'],   enabled: true, order: 5 },
    { key: 'indiv',     label: '銷售個獎',  ratePct: 0.32,  mode: 'individual', rolePositions: [],         enabled: true, order: 6 },
    { key: 'team',      label: '銷售團獎',  ratePct: 0.08,  mode: 'team',       rolePositions: [],         enabled: true, order: 7 },
    { key: 'pmTeam',    label: '專案團獎',  ratePct: 0.02,  mode: 'role',       rolePositions: ['專案團獎'], enabled: true, order: 8 },
  ],
  // 團獎分組（可自訂，對應舊「首馥團獎/天雋團獎」）
  teamGroups: [ { key: 'g1', label: '首馥團獎' }, { key: 'g2', label: '天雋團獎' } ],
  updatedAt, updatedBy
}
```

- `mode`：`role`＝依職務勾選、`individual`＝預設帶入該戶 `salesperson`、`team`＝依團獎分組＋進退場資格預設勾選。三種 mode 僅影響「預設名單」，最終皆可手動增刪與跨案加入。
- `ratePct` 單位為 %（0.32 = 0.32%），存值即 %，計算時 ÷100。
- 類別可新增/改名/停用（`enabled:false` 隱藏但保留歷史資料可讀）。key 一經建立不可改（歷史紀錄以 key 關聯）。

### 4.2 `salesPersonnel` 擴充欄位（既有 collection，向下相容）

```js
{
  // 既有：projectId, name, phone, email, positions[], order, updatedAt
  positions: ['銷售'],              // 選項擴充：銷售/專案/副專/助理/業主/主委/副總/輔導專案/專案團獎（仍可自由輸入）
  bonusConfig: {                    // 新增（無此物件視同 0/不參與，向下相容）
    keepPct: 20,                    // 個人保留款 %
    taxPct: 10,                     // 稅金 %
    nhiPct: 2.11,                   // 二代健保 %
    teamGroupKeys: ['g1'],          // 所屬團獎分組（對應 commissionSettings.teamGroups.key）
    inDate: '2025/03/01',           // 進場時間（團獎資格判斷：簽約日 ≥ inDate）
    outDate: '',                    // 結案時間（空＝在案中；簽約日 ≤ outDate）
    remark: ''                      // 預設備註（帶入獎金明細）
  }
}
```

- 人員管理 UI：`SalesSettings.vue` 的 `personnel` 分頁擴充（`SalesPersonnelForm.vue` 加「請佣獎金設定」區塊，僅具「請佣獎金」權限者可見可編輯）。
- **跨案人員識別鍵 `personKey` = phone**（沿用 `salespersonUserKey` 慣例）。

### 4.3 `commissionRecords` — 請佣紀錄（每戶每期一筆）

docId：`${projectId}_${unitId}_${period}_${yyyyMMddHHmmss}`

```js
{
  projectId, unitId, period,          // 期別（number）
  status: 'active' | 'voided',
  requestDate: '2026/08/25',
  ratioPct: 100,                      // 本次請佣比例（%）
  commPct: 2.2,                       // 佣金比例（%）
  partyAFee: 0, partyBFee: 0,         // 兩種介紹費（元）
  teamSiteKeys: ['g1'],               // 本次勾選的團獎分組
  // 戶別資料快照（送出當下凍結，作廢重建才會刷新）
  snapshot: {
    buyerName, salesperson: [], parkingSpots, isPreferredPayment,
    contractDate, depositDate, salesStatus,
    dealTotal, totalFloor, spread,
    houseDeal, parkDeal, houseFloor, parkFloor, remarks
  },
  // 計算結果快照
  calc: {
    feeWan, realSpread, baseWan, realClaim, claimKeep, thisClaim,   // 請佣
    base, discount, dealAfter                                        // 獎金折數
  },
  // 各類獎金設定與分配（供匯出時 100% 重算）
  categories: {
    [catKey]: {
      ratePct,                        // 本次使用比例（%）
      allocations: [                  // 參與人員與分配
        { personKey, name, sourceProjectId, sourceProjectName,
          mode: 'pct' | 'locked', sharePct: 70, lockedAmount: null }
      ]
    }
  },
  keepPct: 10,                        // 請佣保留款 %
  source: 'system' | 'import',        // 歷史匯入標記
  createdAt, createdBy,
  voidedAt, voidedBy, voidReason      // 作廢資訊
}
```

### 4.4 `bonusRecords` — 獎金明細（每人每戶每期一筆）

docId：`${projectId}_${unitId}_${period}_${personKey}_${yyyyMMddHHmmss}`

```js
{
  projectId, unitId, period,
  status: 'active' | 'voided',        // 隨 commissionRecord 連動作廢
  commissionRecordId,                 // 關聯請佣紀錄
  personKey,                          // = phone（跨案識別）
  name, role,                         // 職務（送出當下）
  sourceProjectId, sourceProjectName, // 他案人員標記（本案人員 = 本案 projectId）
  isExternal: false,                  // 臨時新增（無 salesPersonnel 紀錄）者為 true
  requestDate,
  amounts: { [catKey]: 12345 },       // 各類實際金額（已乘 ratio）
  amountsFull: { [catKey]: 12345 },   // 各類 100% 金額（供非100%分組匯出重算核對）
  subtotal, keepPct, taxPct, nhiPct,  // 使用的扣款比例（含覆寫結果）
  keep, tax, nhi, net,
  remark,
  source: 'system' | 'import',
  createdAt, createdBy
}
```

### 4.5 匯出版型

**全域範本** `commissionExportTemplates/{templateId}`（超管/系管維護）
```js
{ docType: 'claim' | 'bonus',        // 請佣總表 / 獎金表
  name, description, config: { ...同建案版型 config... },
  createdBy, createdAt, updatedAt }
```

**建案版型** `commissionExportConfigs`（一建案多組具名版型）
docId：`${projectId}_${docType}_${timestamp}`
```js
{ projectId, docType: 'claim' | 'bonus',
  name: '富宇制式版',                 // 版型名稱
  isDefault: false,                   // 該建案該 docType 的預設版型
  sourceTemplateId, sourceTemplateName,  // 來源範本（僅記錄，套用即複製）
  config: {
    // 欄位（自欄位登錄表挑選，可排序/改名/隱藏/調寬度與格式）
    columns: [ { key, label, visible, order, width, numFmt } ],
    // 樣式
    style: {
      fontFamily: 'DFKai-SB',         // Excel 字型名；PDF 對應 functions/assets/fonts 的楷體檔
      titleFontSize: 22, headerFontSize: 14, dataFontSize: 14,
      headerBg: '#c4bd97', totalRowBg: '#ffff00', summaryColor: '#DD0806',
      borders: true
    },
    // 內容設定
    titlePattern, notes: [note1, note2],
    keepPct: 10, cashPct: 50,
    showSummaryBlock: true,           // 右側紅字現金/期票摘要
    fileNamePattern,
    // 獎金表專屬
    kiloLabel, youfuLabelPattern,
    showSourceProjectTag: true,       // 他案人員名字是否附註來源建案
    showSharePct: false,              // 是否顯示分配比例欄
    // PDF 專屬
    paper: 'A4' | 'A3', orientation: 'landscape' | 'portrait'
  },
  createdAt, updatedAt, updatedBy }
```

**欄位登錄表（程式碼常數，非 DB）** `src/constants/commissionExportColumns.js`
- `CLAIM_COLUMNS`：對應舊請佣總表 21 欄（編號/簽約日期/戶別/停車位/姓名/底價房價/底價車價/成交價房價/成交價車價/總底價/總成交價/溢差價/介紹費/實際溢差價/佣金比例/實際請領金額/保留款/本次請佣/備註(萬)/萬請款/優付標記），每欄含 `{ key, title, get(record), numFmt, defaultWidth }`。
- `BONUS_COLUMNS`：獎金表上段欄位（編號/小訂/簽約/戶別/停車位/姓名/房價/車價/總成交價/介紹費/折數/折數後總價/銷售人員/團獎人數＋動態人員個獎團獎欄）。
- 新增欄位＝在登錄表加一筆（含計算 getter），所有版型即可勾用——此即「欄位版型樣式擴充」機制。

### 4.6 `retentionPayouts` — 保留款發還登記

docId 自動。
```js
{ projectId,
  type: 'owner' | 'person',           // 業主請佣保留款 / 人員獎金保留款
  personKey, name,                    // type=person 時
  periods: [1, 2],                    // 對應期別（可多期一次發還）
  amount,                             // 發還金額（元）
  payoutDate, note,
  createdAt, createdBy }
```

### 4.7 期別規則

- 期別為建案層級流水號：`nextPeriod = max(commissionRecords[projectId 全部，含 voided、含 import].period) + 1`，送出時可手動改（同期可多戶）。
- 查詢一律 `where('projectId','==',...)` 單條件，排序在前端做（遵循專案慣例：不使用 where+orderBy 複合查詢）。

---

## 5. 後端 Cloud Functions（region `asia-east1`，memory 512MB）

新檔 `functions/commissionDocument.js`（PDF 繪製）＋ `functions/index.js` 註冊：

| Function | 類型 | 說明 |
|---|---|---|
| `submitCommissionEntries` | onCall | 送出請佣：transaction 內重新驗證「已請＋本次 ≤ 100%」（以 DB 為準防並發）、伺服器端重算全部金額（不信任前端數值）、批次寫入 `commissionRecords` + `bonusRecords`。回傳 `{ ok, results }` 或逐戶錯誤。 |
| `voidCommissionRecord` | onCall | 作廢：權限檢查 → 該 `commissionRecordId` 與關聯 `bonusRecords` 標記 `voided` ＋作廢人/時間/原因。 |
| `generateCommissionPdf` | onCall | 產 PDF（pdfkit）：參數 `{ projectId, docType, period(s), configSnapshot }`，前端傳入版型 config 快照與資料列，後端照畫（同 `generateSalesGridPdf` 模式：前端算版面、後端渲染）。字型用 `functions/assets/fonts/TW-Kai`（楷體）/ NotoSansTC。回傳 `{ fileName, mimeType, base64 }`，7MB 上限保護。 |
| `importCommissionHistory` | onCall | 歷史匯入：接收前端解析驗證後的列資料，分批（450 筆/batch）寫入，`source:'import'`；timeout 540s。回傳成功/失敗明細。 |

- 部署：`firebase deploy --only functions:submitCommissionEntries,functions:voidCommissionRecord,functions:generateCommissionPdf,functions:importCommissionHistory`（必要時加 `FUNCTIONS_DISCOVERY_TIMEOUT=120`）。
- 計算引擎抽成 `functions/utils/commissionCalculation.js` 與前端 `src/utils/commissionCalculation.js` **同構雙份**（同付款表 `paymentCalculation.js` 慣例），單元測試比對前後端結果一致。

---

## 6. 前端頁面與 UI/UX

主頁 `src/views/CommissionBonus.vue`：頂部建案名＋分頁籤（Vuetify `v-tabs`）：

```
[請佣工作台] [歷期總覽] [累計統計] [匯出中心] [設定] [歷史匯入]
```

（「設定」「歷史匯入」僅具權限者可見；全部分頁共用 `salesDataStore` 已載入的戶別/車位/人員快取。）

### 6.1 請佣工作台（核心，重現並優化舊 Dialog）

版面：
- 頂部工具列：期別（預設 nextPeriod，可改）、請佣日期（預設今天，台灣時區）、「＋新增戶別」。
- **戶別選擇器**（v-dialog）：僅列簽約戶（`salesStatus_backend` ∈ DEAL 狀態且有簽約日期），每列顯示戶別/買方/已請 %/尚餘 %；已請畢（100%）與已加入者禁選；支援搜尋、多選。
- **快速定位列**（sticky）：每戶一個 chip（戶別＋本次請佣金額），點擊捲動展開該卡；「全部展開/收合」。
- **戶別卡片**（可收合，預設收合、單戶加入時自動展開）：
  1. **戶別資訊**（唯讀）：銷控狀態、簽約/小訂日期、持有車位、成交總價（可展開房/車明細）、溢差價、備註。備註含「介紹/贈品」關鍵字時卡片標頭顯示 ⚠ 紅色 chip 提醒。
  2. **請佣設定**（可編輯）：期別、請佣日期、已請比例（唯讀）、本次請佣比例（超過剩餘額度即鉗制＋toast）、佣金比例（優付戶自動帶減半值並顯示「優付」標記）、兩種介紹費（欄名取自建案設定）。
  3. **請佣試算表**（唯讀即時更新）：同匯出請佣總表欄位的單列預覽（底價/成交價/溢差/介紹費/實際溢差/佣金比例/實際請領/保留款/本次請佣），含取值說明列。
  4. **獎金人員與分配**（每個 enabled 類別一個區塊）：
     - 類別標題＋比例輸入（預設帶建案設定，可逐戶覆寫）＋該類池金額即時顯示。
     - 人員 chip 勾選（依 mode 預設：individual 帶該戶 salesperson；role 依職務、唯一一人自動勾；team 依團獎分組＋進退場資格）。
     - **分配編輯**：勾選 ≥1 人時顯示分配表——每人一列：`姓名（來源建案標籤） | 模式切換(%/鎖定金額) | 數值輸入 | 金額預覽`；預設均分；底部顯示「合計 / 池金額 / 差額」，差額非 0 紅字並擋送出；「重設均分」鈕。
     - **＋他案人員**：開啟跨案搜尋 dialog——輸入姓名或電話，搜尋全部建案 `salesPersonnel`（同 phone 多案時列出各案供選）；查無時可「臨時新增」（姓名＋電話＋扣款比例手填）。選入後 chip 顯示「李曉華・B案」。
  5. **獎金明細矩陣**（即時）：每人一列（含來源建案欄）×（各類金額/小計/保留款%/稅金%/健保%/實發/備註），扣款比例與備註可逐次覆寫（他案人員帶原案 `bonusConfig`，臨時人員手填）。
- **底部彙總卡**：本次戶數、折數後總價合計、實際請領合計、本次請佣合計、每人獎金彙總矩陣（唯讀）。
- **送出前檢查**（confirm dialog 彙整）：比例超限（擋）、有類別未勾人（提醒）、備註提及介紹/贈品但介紹費為 0（提醒）、分配差額非 0（擋）→ 確認後呼叫 `submitCommissionEntries`。

### 6.2 歷期總覽

- 期別卡片列表（前端排序，新→舊）：期別、請佣日期、戶數、實際請領合計、本次請佣合計、獎金實發合計、狀態（含作廢戶數）。
- 點入期別 → 戶別明細表（含快照值）＋每人獎金明細；單戶紀錄可「作廢」（輸入原因，confirm 二次確認，呼叫 `voidCommissionRecord`）；作廢列灰色刪除線顯示。
- 每期右上：「匯出此期」捷徑 → 跳匯出中心並帶入期別。

### 6.3 累計統計

- **人員累計**：視角切換「本建案／跨建案」。本建案：查本案 `bonusRecords`（active）依 personKey 彙總各類金額/小計/保留款/稅金/健保/實發；跨建案：對使用者具「請佣獎金」權限的建案逐案查詢後前端依 personKey（電話）合併，人員列可展開看各案分佈。
- **保留款追蹤**：
  - 業主請佣保留款：Σ `commissionRecords.calc.claimKeep`（active）− Σ `retentionPayouts(type=owner).amount` ＝ 未發還餘額。
  - 人員獎金保留款：每人 Σ `bonusRecords.keep` − Σ 該人 payouts ＝ 未發還餘額。
  - 「登記發還」按鈕 → dialog（對象/期別複選/金額/日期/備註）寫入 `retentionPayouts`；發還歷史列表可刪（限管理權限）。

### 6.4 匯出中心（欄位版型選擇、預覽、擴充）

流程：**選文件（請佣總表/獎金表）→ 選期別 → 選版型 → 預覽 → 調整 → 下載**。

- 版型下拉：列出該建案該 docType 的具名版型（標記預設）＋「套用全域範本…」＋「＋新增版型」。
- **即時預覽區**：前端以 HTML table 渲染近似樣式（字型/合併/黃底/紅字摘要），資料用所選期別真實資料；獎金表預覽含依請佣比例分組的多張分頁（tab 切換），非 100% 組含「優付方案請款」列。
- **版型編輯抽屜**（可即改即看預覽）：
  - 欄位：雙欄拖拉（沿用 `UnitDataExportDialog.vue` 的 vuedraggable 模式）——右側「可用欄位」（欄位登錄表）、左側「顯示欄位（依序）」，每欄可改顯示名稱/寬度/數字格式。
  - 內容：標題 pattern、條文、保留款%、現金%、千4 標籤、優付列文字、檔名 pattern、他案標籤/分配比例欄開關。
  - 樣式：字型、字級、表頭底色、合計列底色、摘要文字色、框線。
  - 動作：儲存 / 另存新版型 / 設為預設 / 另存為全域範本（限超管/系管）/ 刪除。
- 下載：
  - **Excel**：前端 `xlsx-js-style` 依版型 config 產出（合併儲存格、凍結列、欄寬、字型名、底色、數字格式）；獎金總表＝請佣總表＋各比例分組獎金分頁合併於一個活頁簿（同舊系統）。
  - **PDF**：呼叫 `generateCommissionPdf`，後端 pdfkit 依同一 config 渲染；產生後顯示手動下載連結。
  - 檔名依 pattern 產生（民國年月自動計算），下載前可改。

### 6.5 設定分頁

對應 `commissionSettings` 全欄位的表單：基本比例（佣金/優付倍率/保留款/現金）、文字自訂（介紹費欄名×2、千4、優付列、標題/檔名 pattern、條文）、獎金類別管理（可拖曳排序、新增/改名/停用、每類 label/ratePct/mode/rolePositions）、團獎分組管理。變更僅影響之後的新請佣（歷史紀錄有快照）。

### 6.6 歷史匯入分頁（舊資料銜接）

仿 `LeadDistribution.vue` 成熟流程：

1. **下載範本**：一個 xlsx 三張工作表——「請佣紀錄」「獎金紀錄」「填寫說明」。欄位沿用舊 GAS Sheet 表頭（期別/戶別/請佣日期/請佣比例/佣金比例/介紹費×2/獎金折數/折數後總價/各類比例與名單/實際請領金額…；獎金紀錄：期別/戶別/請佣日期/人員姓名/人員電話/職務/各類金額/獎金小計/保留款/稅金/二代健保/實發金額/備註/分配比例%/來源建案），舊檔可直接貼上；新增欄未填有預設（分配比例未填＝均分、電話未填＝以姓名匹配本案 salesPersonnel，匹配不到列為需確認）。
2. **解析驗證**（前端 XLSX 解析，標頭列自動偵測、中文標頭→key 對應表）：逐列檢查——戶別存在於 `salesHouseholds`、期別/比例為數字、每戶比例累計 ≤100%（含既有系統資料）、獎金紀錄的 (期別,戶別) 能對到請佣紀錄、人員能否匹配。
3. **預覽**：驗證結果表（成功/警告/錯誤分色），錯誤列可下載失敗明細 Excel；顯示匯入後每戶已請比例與 nextPeriod 變化摘要。
4. **寫入**：呼叫 `importCommissionHistory` 分批寫入（`source:'import'`），進度條＋結果報告。
5. 匯入紀錄同樣可在歷期總覽檢視、作廢、列入累計統計與匯出。

---

## 7. 匯出格式規格（預設版型須重現舊系統）

### 7.1 請佣總表（預設版型 = 舊格式）

- 版面：標題列（22pt 粗體，合併整列）→ 雙層表頭（底價/成交價各分房價車價；保留款欄第二層顯示 %）→ 資料列（48 高、14pt；簽約日期民國格式純文字；優付戶末欄紅字「5%優付」）→ 空行 → 黃底合計列 → 備註條文 2 行 ＋ 右側紅字摘要 4 行（請佣基準合計萬元/本次請佣元/現金/期票，`$#,##0` 格式）。
- 數字格式：佣金比例 `0.0%`、金額 `#,##0`、介紹費/實際溢差 `0.0`。
- 全表標楷體（Excel 存字型名 `DFKai-SB`；PDF 用 TW-Kai 楷體檔）。

### 7.2 業務獎金表（預設版型 = 舊格式）

- 依請佣比例分組，每組一張「業務獎金-XX%」。
- 上段：戶別列表（編號/小訂/簽約/戶別/停車位/姓名/房價/車價/總成交價/介紹費/折數/折數後總價/銷售人員/團獎人數）＋動態人員欄（每人「個獎/團獎」兩欄，表頭合併姓名）；標題下「千4」列（比例×10000 小字）；黃底合計列。
- 下段「獎金合計」：左側管理區（銷售日期/總銷/主委獎金%/輔導獎金%列，管理人員每人一欄）＋右側業務區（項目標籤欄含比例文字：個獎/團獎/專案/副專/合計/【優付方案請款XX%】/保留款/稅金/二代健保/實發/備註）。
- 非 100% 組：金額以 100% 重算呈現，合計下加優付列（§2.6）；扣款四列以折算後金額。
- 底部合計區：實發合計/稅金合計/二代健保合計/獎金總計（紅字），末列黃底。
- 表頭底色 `#c4bd97`、合計列 `#ffff00`（皆為版型 style 可改）。
- 「獎金總表」下載＝請佣總表＋全部比例分組分頁合併為一個 xlsx（分頁序：請佣總表 → 100% → 50% …）。
- 新增選項（版型開關）：他案人員名稱附來源建案註記、顯示每人分配比例欄。

---

## 8. 非功能與工程規範

- **時區**：所有日期以 Asia/Taipei 產生與顯示（`Intl` / dayjs 指定時區），民國年轉換共用 util。
- **Firestore 查詢**：僅 `where('projectId','==',...)`（必要時加 status 用前端過濾），排序前端 `localeCompare`/數字排序；不建複合索引。
- **salesperson 相容**：讀取一律過 `salespersonUtils`。
- **金額驗證以後端為準**：前端試算僅供顯示，`submitCommissionEntries` 於 transaction 內以 DB 現值重算與驗證。
- **快取**：工作台戶別資料走 `salesDataStore` 既有 onSnapshot；`commissionRecords`/`bonusRecords` 以 `getDocs` 按需載入＋頁內快取（進入分頁時刷新）。
- **稽核**：所有寫入含 createdBy（userStore.userKey）與 serverTimestamp；作廢保留完整原始資料。
- **CHANGELOG**：發版前依 commit-notes 流程寫入使用者視角更新摘要。

---

## 9. 實作分階段

| 階段 | 內容 | 產出 |
|---|---|---|
| **Phase 1 基礎** | commissionSettings 設定頁、salesPersonnel 擴充、請佣工作台（含自訂分配/跨案人員）、submitCommissionEntries、歷期總覽＋作廢 | 可完整建立與管理請佣獎金資料 |
| **Phase 2 匯出** | 欄位登錄表、版型 CRUD（建案版型＋全域範本）、匯出中心（預覽/Excel 前端/PDF 後端）、預設版型重現舊格式 | 可出正式請佣總表與獎金表 |
| **Phase 3 銜接與統計** | 歷史匯入（範本/驗證/批次寫入）、累計統計（本案/跨案）、保留款追蹤與發還登記 | 舊資料銜接完成、營運報表齊備 |

每階段完成後由業主以富宇學森實際資料驗證（尤其：計算結果與舊 GAS 匯出檔逐欄核對一致）再進下一階段。

---

## 10. 檔案異動清單（預估）

**新增**
- `src/views/CommissionBonus.vue`（主頁＋分頁容器）
- `src/components/commission/`：`CommissionWorkbench.vue`、`CommissionUnitCard.vue`、`AllocationEditor.vue`、`CrossProjectPersonPicker.vue`、`CommissionPeriodList.vue`、`CommissionStats.vue`、`RetentionTracker.vue`、`CommissionExportCenter.vue`、`CommissionTemplateEditor.vue`、`CommissionHistoryImport.vue`
- `src/views/CommissionTemplateManager.vue`（全域範本管理）
- `src/utils/commissionCalculation.js`（計算引擎，前端）
- `src/constants/commissionExportColumns.js`（欄位登錄表）
- `src/services/commissionExcelService.js`（xlsx-js-style 產檔）
- `functions/commissionDocument.js`（PDF）
- `functions/utils/commissionCalculation.js`（計算引擎，後端同構）

**修改**
- `src/router/index.js`（2 條路由）
- `src/views/SalesControlSystem.vue`（工具列入口按鈕）
- `src/views/SalesSettings.vue`、`src/views/SalesPersonnelForm.vue`（人員 bonusConfig）
- `src/api.js`（commission 相關 CRUD/監聽）
- `functions/index.js`（4 個 onCall 註冊）
- Firestore rules（新 collections）

---

## 11. 實作紀錄（v1.1 更新）

三階段皆已實作完成並通過驗證（計算引擎前後端一致性單元測試 21 項、匯出模型/Excel/PDF 端對端測試 21 項、`npm run build` 建置）。與 v1.0 規格的差異調整如下：

### 11.1 架構調整
- **新增 `commissionUnitLedgers/{projectId}_{unitId}`**：每戶已請比例帳本（`claimedRatioPct`）。送出/作廢/匯入皆在 transaction 內讀寫此文件，比 query 加總更能防止並發超額，前端「已請比例」也直接讀此 collection（單一 where 查詢）。
- **欄位登錄表位置**：`src/utils/commissionExportModel.js`（`CLAIM_COLUMNS`），未另建 `src/constants/commissionExportColumns.js`；model 建構函式（`buildClaimModel` / `buildBonusModel`）與版型預設值（`defaultClaimConfig` / `defaultBonusConfig`）同檔。
- **grid 中間層**：`src/services/commissionExcelService.js` 將 model 轉為「grid」（儲存格矩陣＋合併＋欄寬列高＋樣式），預覽 HTML（`gridToHtml`）、Excel（`gridToWorksheet`）、後端 PDF（payload 直接傳 grid，`functions/commissionDocument.js` 照畫）三端共用，保證版面一致。
- **後端檔案**：4 個 onCall 實作於 `functions/commissionClaims.js`，`functions/index.js` 僅註冊 exports；PDF 字型使用 `TW-Kai-98_1.ttf`（楷體，粗體以描邊模擬）。
- **歷史匯入範本**：一個 xlsx 三分頁（請佣紀錄／獎金紀錄／填寫說明）。比例欄位自動判斷格式（≤1 視為舊表小數、否則為 %）；民國日期（115/5/23）自動轉西元；金額欄位未填時以本案銷控現值重算；非 100% 比例的獎金金額自動回推 100%（amountsFull）供獎金表匯出。

### 11.2 檔案清單（實際）
**新增**：`src/views/CommissionBonus.vue`、`src/views/CommissionTemplateManager.vue`、
`src/components/commission/`（CommissionWorkbench / CommissionUnitCard / AllocationEditor / CrossProjectPersonPicker / CommissionPeriodList / CommissionSettingsTab / CommissionStats / RetentionTracker / CommissionExportCenter / CommissionTemplateEditor / CommissionHistoryImport）、
`src/utils/commissionCalculation.js`、`src/utils/commissionExportModel.js`、`src/services/commissionExcelService.js`、
`functions/commissionClaims.js`、`functions/commissionDocument.js`、`functions/utils/commissionCalculation.js`

**修改**：`src/router/index.js`（CommissionBonus / CommissionTemplateManager 路由）、`src/views/SalesControlSystem.vue`（工具列入口＋權限）、`src/views/SalesPersonnelForm.vue`（bonusConfig 區塊＋職位選項擴充）、`src/views/SalesSettings.vue`（傳入 projectId）、`src/api.js`（請佣獎金 API 區塊）、`functions/index.js`（4 個 exports 註冊）

### 11.3 上線前待辦
1. `systemFunctions` 新增「請佣獎金」功能並對使用者授權（UserManagement「功能」分頁）。
2. Firestore 安全規則：新增 collections（commissionSettings / commissionRecords / bonusRecords / commissionUnitLedgers / commissionExportConfigs / commissionExportTemplates / retentionPayouts）比照既有 collection 授權。其中 **commissionExportTemplates（全域範本）的寫入/刪除務必在規則層限制超級管理員/系統管理員**——前端僅有路由 requiredRoles 守衛，屬 client-side 檢查；commissionRecords / bonusRecords / commissionUnitLedgers 建議規則層設為僅 Cloud Functions 可寫（client 唯讀），確保金額與比例僅由後端 transaction 產生。
3. 部署 Cloud Functions：
   `firebase deploy --only functions:submitCommissionEntries,functions:voidCommissionRecord,functions:importCommissionHistory,functions:generateCommissionPdf`
4. 以富宇學森實際資料與舊 GAS 匯出檔逐欄核對（計算與版面）。
