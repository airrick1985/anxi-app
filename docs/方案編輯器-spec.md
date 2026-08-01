# 方案編輯器（Quote Plan Editor）— 完整前後端規格

> 需求來源：`docs/方案編輯器.md`
> 狀態：規格確認版（2026-08-01，已與需求方確認 4 項關鍵決策）
>
> **已確認決策**
> 1. 方案的「可選擇的付款方式」選到**具體期款範本（templateName）**層級，非期款類別。
> 2. 戶別 Excel 上傳：「可選方案」為**可選標頭**，舊格式檔案仍可上傳（該欄位不異動）。
> 3. 方案搭配衝突規則採**最嚴格**：含議價調整的方案最多選一個、含付款方式的方案最多選一個，其餘只能搭配純文字型方案。
> 4. 戶別「可選方案」**限制報價端**：戶別有設定 → 僅顯示這些方案；戶別**未設定 → 不顯示、不可選任何方案**。

---

## 1. 功能概述

在「報價單設定」新增「方案編輯器」：具「銷控系統」權限者可預先定義多組方案（付款方式 + 議價調整 + 文字內容）。報價人員在報價項目上點「選擇方案」，即可快速套用方案，一鍵完成付款方式選取與議價調整，省去逐項手動設定。

戶別資料（`salesHouseholds`，注意實際 collection 為駝峰式）新增「可選方案」欄位，控制每一戶可套用哪些方案；可於「修改銷控 → 銷售資訊」編輯（複選），並納入戶別資料 Excel 上傳／下載。

---

## 2. 資料模型

### 2.1 新 collection：`quotePlans`（方案定義）

- **docId = `projectId`**，單文件存整個建案的方案清單（比照 `quoteRemarks/{projectId}` 模式，`api.js:202-222`）。
- 方案為建案獨立，不跨建案共用。
- **純前端直寫 Firestore**（比照 `paymentTermTemplates` 無 Cloud Function 的模式），需補 Firestore rules。

```js
// quotePlans/{projectId}
{
  projectId: string,
  plans: [
    {
      id: string,                  // uuid（前端產生，crypto.randomUUID()）
      name: string,                // 方案名稱（任意文字，同建案內不可重複）
      paymentTemplateIds: string[],// 可選擇的付款方式：paymentTermTemplates 的 docId 陣列（0~N 個）
      adjustments: [               // 議價調整方式（0~N 項；同 mode 最多一項）
        {
          mode: 'perTsubo' | 'directAmount' | 'totalPrice',
          value: number            // 單位「萬」；perTsubo/directAmount 可為負（降價為負值），totalPrice 為正數總價
        }
      ],
      note: string,                // 其他：直接輸入文本（贈品、特殊需求等），可為空
      activeFrom: string,          // 啟用時間 "YYYY-MM-DDTHH:mm"（台灣時間），空字串 = 不限制
      activeUntil: string,         // 結束時間 "YYYY-MM-DDTHH:mm"（台灣時間），空字串 = 不限制
      order: number                // 顯示排序
    }
  ],
  updatedAt: serverTimestamp
}
```

**資料層級約束（編輯器 UI 強制、儲存前驗證）：**

| 規則 | 說明 |
|---|---|
| 輸入總價互斥 | `adjustments` 內若含 `totalPrice` 項，不可再含 `perTsubo` / `directAmount` 項（對應需求：「議價調整方式若設定為輸入總價，則不可額外再設定每坪調整、直接調整」）。 |
| 每種調整方式最多一項 | 同一方案內 `perTsubo`、`directAmount`、`totalPrice` 各最多出現一次。`perTsubo` + `directAmount` 可並存（= 現有 `activeMode: 'both'`）。 |
| 方案名稱必填且唯一 | 空白或重名不可儲存。 |
| 純文字型方案 | `paymentTemplateIds` 為空且 `adjustments` 為空、僅有 `note` 的方案（如「其他」），即為純文字型——**由內容推導，不另存 type 欄位**。 |
| 至少一項內容 | 付款方式、議價調整、文字內容三者不可全空。 |
| 啟用期間 | `activeFrom` / `activeUntil` 皆可留空（不限制）；兩者皆設定時結束需晚於啟用。判斷一律以台灣時間 (Asia/Taipei) 為準（`src/utils/quotePlanUtils.js`）。不在期間內（已截止／尚未開始）的方案：**報價端「選擇方案」完全隱藏**（清單不顯示、開啟視窗不還原勾選，不可再套用）；若戶別有設定可選方案但全數不在期間內，顯示「目前沒有開放中的方案」提示。編輯器卡片仍全部列出並以標籤標示「啟用中／尚未開始／已截止」供管理。已套用在既有報價項目上的方案不受影響。 |

### 2.2 `salesHouseholds` 新欄位：`availablePlans`

```js
availablePlans: string[]   // 方案 id 陣列（存 id 不存名稱，改名不斷鏈）
```

- **儲存 plan id**；所有顯示／匯出處以 id → name 轉換，上傳時以 name → id 反查（轉換皆在前端完成，後端不需認得方案名稱）。
- 欄位定義加入權威來源 `COLUMN_DEFINITIONS`（`SalesControlSystem.vue:1981-2065`）：
  ```js
  { key: 'availablePlans', title: '可選方案' }
  ```
- 戶別中殘留的失效 id（方案已被刪除）：UI 與匯出時過濾不顯示，不主動清理資料。

### 2.3 `quoteStore` 報價項目新欄位：`appliedPlans`

```js
// quoteStore.js addItem() 的 item 結構新增：
appliedPlans: [
  {
    planId: string,
    planName: string,                    // 快照，供顯示（避免方案改名後 chip 讀不到名稱）
    selectedPaymentTemplateId: string | null  // 該方案含多個付款方式時，使用者二次選定的範本
  }
]
```

- 隨 pinia persist 一併持久化（現有機制，免額外處理）。
- 舊資料（無此欄位）讀取時視為 `[]`（存取處以 `item.appliedPlans || []` 容忍）。

---

## 3. 前端規格

### 3.1 方案編輯器入口（QuoteSettings.vue）

- 位置：`QuoteSettings.vue:69-105` 既有設定按鈕列（報價單備註、配套總價門檻、建案簡介網址旁），新增「方案編輯器」按鈕。
- 權限：與現有按鈕相同 gate（`canEditQuoteRemark` 樣式，`QuoteSettings.vue:574-578`）：
  ```js
  超級管理員 / 系統管理員 恆可；否則 userStore.hasProjectPermission('銷控系統', projectName)
  ```
- 點擊開啟新元件 `QuotePlanEditorDialog.vue`。

### 3.2 新元件：`src/components/QuotePlanEditorDialog.vue`（方案編輯器）

比照 `QuotePackageLimitDialog.vue` / `QuoteRemarkEditorDialog.vue` 的 dialog 模式。

**清單頁（預設畫面）：**
- 列出所有方案卡片：名稱、付款方式（範本名稱 chips）、議價調整摘要（如「每坪 -2.5萬｜直接 -5萬」或「總價 3500萬」）、文字內容（截斷顯示）。
- 操作：新增方案、編輯、刪除（confirm，提示「已設定此方案的戶別將自動忽略該方案」）、拖曳排序（vuedraggable，寫回 `order`）。

**編輯表單：**

| 欄位 | 元件 | 行為 |
|---|---|---|
| 方案名稱 | `v-text-field` | 必填、同建案唯一。 |
| 可選擇的付款方式 | `v-select multiple chips` | 資料源 = 該建案 `paymentTermTemplates`（`fetchPaymentTermTemplates(projectId)`，`api.js:168-199`），**排除 `paymentCategory === '配套期款'`**。選項顯示 `【{paymentCategory}】{templateName}`，value = 範本 docId。可複選。 |
| 議價調整 | 動態列（新增/移除） | 每列 = 調整方式下拉（每坪調整／直接調整／輸入總價）+ 數值輸入（萬）。**互斥控制**：已有「輸入總價」列時，「每坪」「直接」選項 disabled（反之亦然）；已用過的 mode 不可重複新增。 |
| 其他（文字內容） | `v-textarea` | 自由輸入，如「贈送冷氣全室20萬」。 |

**儲存：** 整包 `plans` 陣列 `setDoc` 回 `quotePlans/{projectId}`（merge）。`api.js` 新增：

```js
fetchQuotePlans(projectId)            // getDoc，無文件回 { plans: [] }
setQuotePlans(projectId, plans)       // setDoc merge + serverTimestamp
listenToQuotePlans(projectId, cb)     // onSnapshot（銷控端與報價端共用）
```

### 3.3 「選擇方案」按鈕與選擇對話框（QuoteItem.vue + 新元件）

**按鈕：**
- 位置：`QuoteItem.vue` 現有「付款方式」按鈕 cell（`:238-245`）旁；表頭 `QuoteSettings.vue:171-190` 對應加欄（或併入付款方式欄，實作時擇版面較不擠者）。
- 樣式（需求：有質感且醒目）：漸層底色 + icon 按鈕，例如
  ```html
  <v-btn size="small" prepend-icon="mdi-star-box-multiple" class="plan-select-btn">選擇方案</v-btn>
  <!-- .plan-select-btn { background: linear-gradient(135deg,#7b2ff7,#f107a3); color:#fff; } -->
  ```
- 已套用方案時，按鈕下方顯示方案名稱 chips（closable，見 3.5 移除行為）。

**新元件 `src/components/QuotePlanPickerDialog.vue`（方案選擇）：**

- 開啟時取方案來源：`quotePlans/{projectId}`（QuoteSettings 載入一次傳入，或 listener 共用）。
- **可選清單過濾（已確認決策 4）**：
  - 取該報價項目 `item.unitDetails.availablePlans`（加入報價當下的戶別快照，與現有 unitDetails 機制一致）。
  - 有設定（非空陣列）→ 僅顯示 id 在其中且仍存在的方案。
  - **未設定或為空 → 顯示提示「此戶別尚未設定可選方案，請洽銷控人員於銷控系統設定」，無任何方案可選。**
- 排版（需求：優化排版過的內容）：方案卡片式列表，每卡顯示：
  - 方案名稱（粗體）
  - 付款方式：範本名稱 chips
  - 議價調整：格式化文字（`每坪調整 -2.5 萬`、`直接調整 -5 萬`、`輸入總價 3500 萬`）
  - 文字內容：完整顯示
- **複選 + 衝突規則（已確認決策 3，最嚴格）**：
  - 已勾選一個「含議價調整」的方案 → 其他含議價調整的方案卡片 disabled，並顯示原因「議價調整方案僅能擇一」。
  - 已勾選一個「含付款方式」的方案 → 其他含付款方式的方案卡片 disabled，原因「付款方式方案僅能擇一」。
  - 純文字型方案（無付款方式、無議價調整）不受限，可任意搭配。
  - 同時含議價與付款方式的方案，兩條規則皆計入。
- **付款方式二次選擇**：勾選的方案 `paymentTemplateIds` 有 2 個以上時，卡片內展開 radio 讓使用者擇一（`selectedPaymentTemplateId`）；只有 1 個則自動選定；未選定前「確認套用」disabled。
- 底部：「確認套用」／「取消」；若該項目已有套用方案，另提供「清除方案」。

### 3.4 套用行為（quoteStore 新 action：`applyPlansToItem`）

確認套用時，依勾選方案彙總後寫入該報價項目：

1. **付款方式**：取含付款方式之方案的 `selectedPaymentTemplateId` → 查範本得 `paymentCategory` →
   `updateItemManualTemplate(internalId, { category, templateId })`（`quoteStore.js:268-274`，等同手動兩層選擇器選定結果）。
2. **議價調整**：取含議價調整之方案的 `adjustments` → 寫入 `negotiationState`：
   - `perTsubo` → `perTsuboValue`；`directAmount` → `directAmountValue`；`totalPrice` → `totalPriceValue`
   - `activeMode` 依現有判定（`QuoteItem.vue:1873-1876`）：totalPrice > both > directAmount > perTsubo
   - 沿用 `saveNegotiatedPrice()`（`QuoteItem.vue:1838-1887`）之計價邏輯落地房屋總價（`originalPrice` 基準、四捨五入規則與手動議價一致）。**實作時將該計算抽成可共用函式**，避免第三份複製（`SalesInfoForm.vue:273-430` 已有一份銷控端複製，本次不動它）。
   - 套用即生效，**不觸發加價 confirm**以外的攔截；若換算後高於原價，沿用現有加價二次確認。
3. **文字內容**：所有勾選方案的 `note` 依序附加至該項目的方案備註顯示區（比照 `appliedPaymentNotes` 的呈現位置與列印行為，於報價單畫面與列印輸出顯示）。
4. 寫入 `item.appliedPlans` 快照。

**重複套用**：再次開啟選擇方案 → 以 `appliedPlans` 還原勾選狀態；重新確認 = 先執行清除（見 3.5）再套用新組合。

### 3.5 清除／手動修改的互動

- **chip 移除（×）或「清除方案」**：
  - 移除含議價調整的方案 → `resetNegotiationPrice(internalId)`（還原原價，`quoteStore.js:190-229`）。
  - 移除含付款方式的方案 → `resetManualTemplate()`（回到自動判斷）。
  - 移除純文字方案 → 移除其 note 顯示。
- **套用後手動修改**議價或付款方式：允許（方案是快速填入，不鎖定欄位）；此時對應方案 chip 標示「已修改」樣式（外框虛線），不自動移除。

### 3.6 銷控端：「修改銷控 → 銷售資訊」編輯可選方案

- **`SalesControlSystem.vue`**：
  - 以 `listenToQuotePlans(projectId)` 載入方案清單（存於元件層 `ref` 或併入 `salesDataStore`，實作擇一）。
  - 傳遞 `:plan-options` 給 `UnitDetailModal`（`:1096-1106` 掛載處）。
- **`UnitDetailModal.vue`**：props 加 `planOptions`，透傳給 `SalesInfoForm`（`:231`）。
- **`SalesInfoForm.vue`**：「銷售資訊」左欄（`:5-64`），於「銷售人員」（`:27-40`）之後新增：
  ```html
  <v-select label="可選方案" v-model="formData.availablePlans"
            :items="planOptions" item-title="name" item-value="id"
            multiple chips closable-chips clearable />
  ```
  - props 加 `planOptions`（default `[]`）。
  - `formData.availablePlans` 容忍 undefined → `[]`。
  - 顯示時過濾失效 id（不在 planOptions 中者不顯示 chip，儲存時一併剔除）。
- 儲存走既有 `updateSalesData`（`UnitDetailModal.vue:1716-1733`），payload 自然帶上 `availablePlans` 陣列。

### 3.7 戶別資料下載（匯出）

1. **`SalesControlSystem.vue` `COLUMN_DEFINITIONS`**（`:1981`）新增 `{ key: 'availablePlans', title: '可選方案' }` → 自動進入 `exportableColumns` 與兩條匯出路徑。
2. **`UnitDataExportDialog.vue` `formatCellValue`**（`:730-762`）：`availablePlans` 特殊處理——id 陣列 → 方案名稱 → `join(',')`（失效 id 略過）。需由父層傳入 `plans` prop（或 id→name map）。
3. **舊版全量匯出 `exportToExcel()`**（`SalesControlSystem.vue:2973-3021`）：同樣做 id→name 轉換。

### 3.8 戶別資料上傳（匯入）

`SalesControlSystem.vue handleFileChange()`（`:3030-3184`）：

1. **可選標頭（已確認決策 2）**：新增常數 `OPTIONAL_HEADERS = new Set(['可選方案'])`；必備標頭檢查（`:3057-3065`）改為 `requiredHeaders = 全部標頭 − OPTIONAL_HEADERS`。檔案缺「可選方案」欄 → 照常上傳，**該欄位不寫入、不清空既有值**（parsedData 不含該 key 即不會覆寫——需確認 `uploadHouseholds` 為 merge 寫入；若為整份覆蓋，前端需將既有值回填）。
2. **有此欄時的解析**（比照 salesperson 特殊處理區 `:3103-3106`）：
   - 以逗號／頓號分割字串 → trim → 過濾空值。
   - 名稱 → id 反查（用已載入的方案清單）。
   - **無法對應的名稱**：不擋整批，收集後於上傳結果訊息警示「以下方案名稱不存在已略過：…（戶別 xx）」，該名稱不寫入。
   - 空儲存格 → `availablePlans: []`（明確清空該戶設定）。

### 3.9 報價端載入需求

- `QuoteSettings.vue` 載入 `quotePlans/{projectId}` 一次（與 paymentTemplates 同時），以 props 傳入各 `QuoteItem` → `QuotePlanPickerDialog`。
- 報價系統檢視模式（`QuoteSystem` 路由）同樣可用「選擇方案」（一般報價人員的主要使用場景）；方案**編輯**入口仍僅限銷控權限。

---

## 4. 後端規格

### 4.1 Cloud Functions（`functions/index.js`）

**不新增 Cloud Function**（方案 CRUD 純前端直寫，比照 `paymentTermTemplates`）。既有兩處需加欄位正規化：

| 位置 | 修改 |
|---|---|
| `uploadHouseholds`（`:1148`，陣列處理區 `:1234-1243` 附近） | `availablePlans`：若為逗號字串 → split 成陣列；非陣列非字串 → `[]`；元素 trim、去空。**payload 無此 key 時不寫入該欄位**（維持既有值）。 |
| `updateSalesData`（`:2868`，型別轉換區 `:2904` 附近） | 同上正規化。 |

> 若上述修改涉及重新部署，依專案慣例：`firebase deploy --only functions:uploadHouseholds,functions:updateSalesData`，記憶體維持既有設定（≥512MB）。

### 4.2 Firestore Rules

新增 `quotePlans` collection 規則（比照 `quoteRemarks` / `paymentTermTemplates` 現行寫法）：

- read：已登入且對該建案有「報價系統」或「銷控系統」權限（依現行 rules 粒度，若現行為登入即可讀則從之）。
- write：已登入；權限細節於前端 gate（與 `paymentTermTemplates` 現況一致）。

---

## 5. 檔案異動清單

| 檔案 | 異動 |
|---|---|
| `src/components/QuotePlanEditorDialog.vue` | **新增**：方案編輯器 dialog |
| `src/components/QuotePlanPickerDialog.vue` | **新增**：選擇方案 dialog |
| `src/views/QuoteSettings.vue` | 入口按鈕、載入 quotePlans、表頭欄 |
| `src/components/QuoteItem.vue` | 「選擇方案」按鈕、已套用 chips、套用/清除接線、議價計算抽共用 |
| `src/store/quoteStore.js` | `appliedPlans` 欄位、`applyPlansToItem` / `clearPlansFromItem` actions |
| `src/api.js` | `fetchQuotePlans` / `setQuotePlans` / `listenToQuotePlans` |
| `src/views/SalesControlSystem.vue` | `COLUMN_DEFINITIONS` 加欄、上傳解析（可選標頭+名稱反查）、兩條匯出路徑 id→name、載入 quotePlans、傳 props |
| `src/components/UnitDetailModal.vue` | 透傳 `planOptions` |
| `src/components/SalesInfoForm.vue` | 「可選方案」複選欄位 |
| `src/components/UnitDataExportDialog.vue` | `formatCellValue` 的 `availablePlans` id→name、`plans` prop |
| `functions/index.js` | `uploadHouseholds`、`updateSalesData` 欄位正規化 |
| `firestore.rules` | `quotePlans` 規則 |

---

## 6. 驗收情境

1. **編輯器互斥**：方案加入「輸入總價 3500」後，「每坪調整」「直接調整」不可再加入；反向亦然。
2. **範例方案 A**：付款方式選「一般付款、優惠付款」兩範本；議價：每坪 -2.5 萬 + 直接 -5 萬。報價套用時需二次選擇付款方式其一，房屋總價 = 原價 − 面積×2.5萬 − 5萬（與手動議價 both 模式結果一致）。
3. **範例方案 B**：付款方式一個範本（自動選定，不需二選）；議價：輸入總價 3500 → 房屋總價直接為 3500 萬。
4. **範例方案「其他」**：僅文字「贈送冷氣全室20萬」→ 可與 A 或 B 任意搭配，文字出現在報價單顯示與列印。
5. **衝突（嚴格）**：A、B 皆含議價與付款方式 → 勾 A 後 B 整卡 disabled 並顯示原因；A+其他 可。
6. **戶別限制**：戶別 availablePlans = [A] → 選擇方案只見 A；availablePlans 空／未設定 → 顯示「此戶別尚未設定可選方案」且無可選項。
7. **銷控編輯**：修改銷控 → 銷售資訊 → 可選方案複選儲存後，Firestore 該戶 `availablePlans` 為 id 陣列；重新整理後報價端立即反映（新加入購物車的項目）。
8. **匯出**：兩條匯出路徑「可選方案」欄顯示方案名稱逗號分隔；失效 id 不出現。
9. **上傳相容**：舊範本（無「可選方案」欄）上傳成功且不清空既有 availablePlans；新範本填「方案A,其他」正確反查為 id；填不存在的名稱 → 上傳完成但顯示略過警示；空儲存格 → 清空該戶設定。
10. **刪除方案**：刪除方案 A 後，殘留 A 的戶別在銷售資訊、匯出、選擇方案中皆不顯示 A，且不報錯。
11. **權限**：無「銷控系統」權限者看不到「方案編輯器」入口；有「報價系統」權限者可用「選擇方案」。
