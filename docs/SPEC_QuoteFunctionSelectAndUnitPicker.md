# SPEC：報價系統「選擇功能」層 ＋ 列印報價戶別選擇器

## 1. 目標

在報價系統「選建案」之後、進入系統之前，新增一層「選擇功能」頁面，提供兩條路徑：

1. **銷控表**：須通過「使用者本人登入密碼」驗證，通過後進入＝目前報價系統流程（[SalesControlSystem.vue](../src/views/SalesControlSystem.vue) quote 模式）。
2. **列印報價**：不需密碼，直接進入「報價單設定」頁（[QuoteSettings.vue](../src/views/QuoteSettings.vue)）。

因「列印報價」會跳過銷控表選戶別步驟，導致 `quoteStore.items` 為空、報價單設定頁無戶別，故同步新增一個**戶別選擇器**：使用者可逐筆「新增戶別」（最多 5 戶），已售戶別預設不可選，但在戶別選單開啟時於背景輸入解鎖碼 `aaaaaaaa` 即可解鎖已售戶別。

## 2. 已確認設計決策（來自需求確認）

| 項目 | 決策 |
|---|---|
| 「選擇功能」呈現方式 | **新獨立頁面（新路由）** |
| 銷控表密碼 | 使用者**本人登入密碼**，**前端本地比對 Firestore `users/{key}.password`**（同 [EditProfileDialog](../src/components/EditProfileDialog.vue) / [api.js](../src/api.js) `updateUserProfile` 既有做法），不需部署後端 |
| 戶別選擇器呈現 | QuoteSettings 內**彈窗**；點「新增戶別 ＋」才出現第 1 筆戶別選單，再點才出現第 2 筆，依此類推，**最多 5 筆** |
| 解鎖碼輸入位置 | **不在任何欄位**。戶別選單彈窗開啟期間，於該畫面背景以鍵盤連續輸入 `aaaaaaaa`，已售（disabled）戶別**立即**變為可選 |

## 3. 範圍

### In scope
- 新增路由 `/quote-function-select/:projectName` 與頁面 `QuoteFunctionSelect.vue`
- 修改 `/quote-system-entry` 路由 meta，將 `targetRouteName` 由 `QuoteSystem` 改為 `QuoteFunctionSelect`
- 新增 API `verifyUserPassword(key, password)`（[api.js](../src/api.js)，本地讀 Firestore `users/{key}` 比對）
- 銷控表密碼驗證對話框（在 `QuoteFunctionSelect.vue` 內）
- `QuoteSettings.vue` 新增戶別選擇彈窗元件（逐筆新增、最多 5、已售 disabled）
- 戶別選單彈窗開啟時的全域鍵盤序列偵測（`aaaaaaaa` 解鎖已售）

### Out of scope
- 不更動 [ProjectSelector.vue](../src/views/ProjectSelector.vue) 的選建案邏輯與 `checkInToSystem` 人數驗證（維持在選建案時觸發）
- 不更動銷控系統（`/sales-control-entry`）、驗屋預約、客資系統等其他共用 ProjectSelector 的入口
- 不更動 [SalesControlSystem.vue](../src/views/SalesControlSystem.vue) 既有選戶別 / 加入報價邏輯
- 不更動 [quoteStore.js](../src/store/quoteStore.js)（沿用既有 `addItem` / `clearQuote`）
- 密碼錯誤鎖定（連續錯誤鎖帳號）不在此次範圍（見 §11 待確認）

## 4. 流程設計

### 4.1 現況流程
```
/quote-system-entry  →  ProjectSelector（選建案）
   └─ enterProject(): checkInToSystem(報價系統) ──成功──▶ /quote-system/:projectName
                                                          （SalesControlSystem, viewMode=quote，選戶別→寫 quoteStore）
                                                              └─▶ /quote-settings/:projectName（讀 quoteStore）→ 列印
```

### 4.2 新流程
```
/quote-system-entry  →  ProjectSelector（選建案，邏輯不變）
   └─ enterProject(): checkInToSystem(報價系統) ──成功──▶ /quote-function-select/:projectName  ◀── 新頁面
                                                              QuoteFunctionSelect（選擇功能）
                              ┌───────────────────────────────┴───────────────────────────────┐
                       點「銷控表」                                                      點「列印報價」
                       開密碼對話框 → verifyUserPassword()                          router.push QuoteSettings
                              │成功                                                  ?viewMode=quote&pick=1
                              ▼                                                            │
                  /quote-system/:projectName                                               ▼
                  （SalesControlSystem, viewMode=quote）                    QuoteSettings：偵測 pick=1 且
                  ＝目前報價系統，行為完全不變                                quoteStore.items 為空 → 自動開
                                                                            「選擇戶別」彈窗（逐筆新增最多5）
                                                                                           │確認
                                                                                           ▼
                                                                            quoteStore.addItem × N → 正常渲染
                                                                            報價單列表 → 列印報價單
```

> 設計依據：ProjectSelector 的 `enterProject` 以 `router.meta.targetRouteName` + `paramKey` 做泛型導向（[ProjectSelector.vue:213-223](../src/views/ProjectSelector.vue)）。只要把 `/quote-system-entry` 的 `targetRouteName` 改為 `QuoteFunctionSelect`，即可在**不加任何條件分支、不影響其他入口**的前提下插入新頁面；`checkInToSystem(報價系統)` 仍在選建案時執行，報價系統「席位」照常佔用。

## 5. 路由變更（[src/router/index.js](../src/router/index.js)）

### 5.1 修改既有路由
`/quote-system-entry`（約 router L104-116）：
```js
meta: {
  requiresAuth: true,
  requiredSystem: '報價系統',
  layout: DefaultLayout,
  targetRouteName: 'QuoteFunctionSelect',  // ← 由 'QuoteSystem' 改為此
  paramKey: 'projectName'
}
```

### 5.2 新增路由
```js
{
  path: '/quote-function-select/:projectName',
  name: 'QuoteFunctionSelect',
  component: () => import('@/views/QuoteFunctionSelect.vue'),
  props: true,
  meta: {
    requiresAuth: true,
    requiredSystem: '報價系統',     // 路由守衛沿用 projectName→建案名→hasProjectPermission 檢查
    layout: DefaultLayout,
    viewMode: 'quote',
    title: '選擇功能'
  }
}
```
> 路由守衛（router L944-963）對含 `projectName` 參數且 `requiredSystem` 的路由，會以 `idToNameMap[projectName]` 換建案全名再 `hasProjectPermission('報價系統', 全名)`。使用者能走到此頁代表已於入口通過權限，守衛會放行。

## 6. 檔案變更清單

| 檔案 | 變更 |
|---|---|
| `src/router/index.js` | 修改 `/quote-system-entry` meta；新增 `/quote-function-select/:projectName` 路由 |
| `src/views/QuoteFunctionSelect.vue` | **新增**：選擇功能頁（兩按鈕＋密碼對話框） |
| `src/api.js` | **新增** `verifyUserPassword(key, password)` |
| `src/views/QuoteSettings.vue` | 偵測 `?pick=1` 且無 items → 開戶別選擇彈窗；整合鍵盤解鎖 |
| `src/components/QuoteUnitPickerDialog.vue` | **新增**：戶別選擇彈窗（兩層 棟別→戶別、逐筆新增最多 5、已售 disabled、aaaaaaaa 解鎖含全形/大小寫） |
| `src/components/QuoteItem.vue` | **修正既有 TDZ bug**：`finalTotalPrice`/`packagePrice` computed 原宣告於 L1217，但 `selectPaymentTemplate`／`watch(generalPaymentCalculation,{immediate:true})` 在其前同步求值。一般流程因 `paymentTemplates` 載入較晚而提早 return 未觸發；本新流程 templates 已先載入，QuoteItem 掛載即觸發 `ReferenceError: Cannot access 'finalTotalPrice' before initialization`。修法：將兩個 computed 宣告上移至 `selectPaymentTemplate` 之前 |

## 7. 詳細設計

### 7.1 QuoteFunctionSelect.vue（選擇功能頁）

- 版面沿用入口頁風格（參考 [ProjectSelector.vue](../src/views/ProjectSelector.vue) 的 `v-card` + `DefaultLayout`），標題「選擇功能」，副標顯示建案名（`projectStore.idToNameMap[projectId]`）。
- 兩個大按鈕（建議 `IconButton` 或大 `v-btn`）：
  - **銷控表**（icon `mdi-table-edit`）：點擊 → `passwordDialog = true`
  - **列印報價**（icon `mdi-printer`）：點擊 → 直接導向
    ```js
    router.push({ name: 'QuoteSettings',
      params: { projectName: projectId },
      query: { viewMode: 'quote', pick: '1' } })
    ```
- `projectId = route.params.projectName`。
- 提供「返回」按鈕（回 `QuoteSystemEntry` 或 Home）。

#### 密碼對話框（同頁內 `v-dialog`）
- 內容：`v-text-field`（`type="password"`、label「請輸入您的登入密碼」、`@keyup.enter` 觸發確認）、錯誤 `v-alert`、取消 / 確認按鈕。
- 確認流程：
  ```js
  const res = await verifyUserPassword(userStore.user.key, pwInput.value);
  if (res.status === 'success') {
    router.push({ name: 'QuoteSystem',
      params: { projectName: projectId },
      query: { viewMode: 'quote' } });
  } else {
    pwError.value = res.message || '密碼錯誤';
  }
  ```
- 取消：關閉對話框、清空輸入與錯誤。
- 載入中：確認按鈕 `loading`，避免重複送出。

### 7.2 verifyUserPassword（[src/api.js](../src/api.js)）

沿用 `updateUserProfile`（api.js L284-294）的本地 Firestore 比對模式，重用既有 `db, doc, getDoc` import：
```js
/**
 * 本地驗證使用者登入密碼（讀 Firestore users/{key} 比對 password 欄位）
 * @param {string} key 使用者手機號（users 文件 ID）
 * @param {string} password 使用者輸入之密碼
 * @returns {Promise<{status:'success'|'error', message?:string}>}
 */
export async function verifyUserPassword(key, password) {
  try {
    if (!key) return { status: 'error', message: '無法取得使用者資訊，請重新登入' };
    const snap = await getDoc(doc(db, 'users', key));
    if (!snap.exists()) return { status: 'error', message: '找不到用戶資料，請重新登入' };
    if (snap.data().password !== String(password)) {
      return { status: 'error', message: '密碼錯誤' };
    }
    return { status: 'success' };
  } catch (e) {
    console.error('verifyUserPassword 錯誤:', e);
    return { status: 'error', message: `驗證密碼時發生錯誤: ${e.message}` };
  }
}
```
> 與既有做法一致（明碼比對，無雜湊）；此次不引入新安全模型，僅複用現況。雜湊化屬全系統議題，不在本 SPEC。

### 7.3 戶別選擇器（QuoteUnitPickerDialog.vue ＋ QuoteSettings 整合）

#### 觸發時機（QuoteSettings.vue）
- `onMounted`：若 `route.query.pick === '1'` 且 `quoteStore.items.length === 0` → 開啟 `QuoteUnitPickerDialog`（戶別清單由 picker 內部以 `salesDataStore` 載入，見 §8）。
- 既有 `onMounted` 的 `fetchSalesControlData` 合併邏輯（L632-656）：當 picker 確認加入戶別後 `items` 才有資料，但此時 onMounted 已執行完畢，故 picker 必須自行建構完整 `unitData`（§8 轉換），不依賴 onMounted 的 unitDetails 合併。
- 使用者未選任何戶別就關閉 / 取消 → 導回 `QuoteFunctionSelect`（`router.push({ name:'QuoteFunctionSelect', params:{ projectName: projectId } })`），避免停在空白報價單頁。

#### 彈窗 UI（QuoteUnitPickerDialog.vue）— 兩層選單
- `v-dialog`（`max-width≈720`，`persistent`，`scrollable`）。標題「選擇戶別（最多 5 戶）」。
- 內部狀態：`rows = ref([])`，每個 row = `{ key, building, unitId }`（**兩層**：先棟別、再戶別）。
- **逐筆新增**：
  - 初始 `rows` 為空，畫面僅顯示一顆「新增戶別」按鈕。
  - 按下 → `rows.push({ key: uid(), building: null, unitId: null })`，出現第 1 筆。
  - 已有 ≥1 筆時，按鈕文字改為「繼續新增戶別」；`rows.length >= 5` 時 `disabled` 並提示「已達上限（最多 5 戶）」。
  - 每列右側提供移除鈕（`mdi-close`）。
- **第一層：棟別 `v-select`**：options ＝ `props.units` 之 `building` 去重後自然排序（`localeCompare(..,{numeric:true,sensitivity:'base'})`，與 [SalesControlSystem.vue:2067-2070](../src/views/SalesControlSystem.vue) 一致）。`building` 為空者歸入「未分棟」群組（避免該戶不可選）。選擇棟別時清空該列 `unitId`。
- **第二層：戶別 `v-select`**（選棟別後才啟用）：options ＝ 該棟別下的戶別（依 `unitId` 自然排序）。每個 option：
  - `title`：`unit.unitId`，已售者附註 →（已售）。
  - `value`：`unit.unitId`。
  - `disabled`：`isSold(unit) && !unlocked.value`（`isSold = unit.salesStatus_quote === '已售'`，對齊 [UnitDetailModal.vue:1706](../src/components/UnitDetailModal.vue)、[SalesControlSystem.vue:2242](../src/views/SalesControlSystem.vue)）。
- **採 `v-select`（非 `v-autocomplete`）**：選單無自由文字搜尋框，避免輸入游標停在篩選輸入框、導致解鎖碼被選單吃掉（修正 BUG，見下）。
- **重複戶別**：`quoteStore.addItem` 允許同戶別重複（[quoteStore.js:84-118](../src/store/quoteStore.js) 已移除去重）。本選擇器沿用允許重複，不跨列去重。
- **動作**：
  - 取消：`emit('cancel')` → QuoteSettings 導回 `QuoteFunctionSelect`。
  - 確認：`disabled` 條件為「沒有任何已選戶別」。逐一以 `(unitId, building)` 找回原始戶別物件 → 轉 unitData（§8）→ `emit('confirm', 陣列)`；QuoteSettings 收到後 `quoteStore.addItem()` 逐筆。

#### aaaaaaaa 解鎖（鍵盤序列偵測）＋ BUG 修正
- 彈窗顯示時掛 `window.addEventListener('keydown', onKey, true)`（**capture 階段**），彈窗關閉 / `onBeforeUnmount` 時 `removeEventListener(..,true)`（避免外洩到其他頁）。
- **彈窗開啟期間，任何單一字元按鍵（`e.key.length === 1`）一律於 window capture 階段攔截**：`preventDefault()+stopPropagation()+stopImmediatePropagation()`，事件完全不傳到 `v-select` → 解決「輸入 a 選單會依序往下選取（typeahead）」，且背景輸入解鎖碼不影響選單。非字元鍵（Tab/Enter/方向鍵等）不攔截，按鈕與導覽不受影響。
- 攔截後該字元仍先 **normalize 成半形小寫**（支援 `aaaaaaaa`/`AAAAAAAA`/全形 `ａａａａａａａａ`/`ＡＡＡＡＡＡＡＡ`；全形 ASCII 區 U+FF01–FF5E 對應半形為 `code − 0xFEE0`，再 `toLowerCase()`）後累積 `buffer = (buffer + normChar).slice(-8)`；`buffer === 'aaaaaaaa'` → `unlocked.value = true`、不顯眼 toast「已解鎖」、清空 buffer。
- `unlocked` 為 `true` 後，所有列 option `disabled` 即時解除。解鎖狀態僅存在於本彈窗實例；關閉再開重置。
- **BUG 修正（焦點停在選單）**：原設計監聽 `window` 並略過 `INPUT/TEXTAREA`，但實務上游標常停在戶別選單，導致 `aaaaaaaa` 被選單吃掉而無法解鎖。修正為：
  1. 改用 `v-select`（無自由文字搜尋框）；
  2. keydown 監聽改 **capture 階段且不再略過任何 target**（本彈窗無自由文字輸入框，全攔截安全）；
  3. 彈窗開啟時 `nextTick` 內 `document.activeElement.blur()`，不讓游標預設停在任何選單。
  即使游標停在某選單，連續輸入 `aaaaaaaa` 仍能於 window capture 階段被偵測並解鎖。

### 7.4 與既有「列印報價單」銜接
- 戶別加入 `quoteStore` 後，QuoteSettings 既有流程（`QuoteItem` 渲染、報價人員、`openQuoteEditor` → `PrintQuotation`）完全沿用，無需更動。
- QuoteSettings 既有 `onBeforeRouteLeave` 會在離開非報價/銷控頁時 `clearQuote()`；本流程返回 `QuoteFunctionSelect`（非 allowed back route）將清空報價單——符合預期（重新進入須重新選戶別）。

## 8. 資料流與資料形狀

- **戶別清單來源**：`salesDataStore.loadProjectData(projectId)` → `salesDataStore.getProjectData(projectId).households`（Array）。此為 Firestore `salesHouseholds` 文件（[api.js listenToSalesControlData L4238-4242](../src/api.js)），**與現有報價系統選戶別／加入報價完全同源**（[SalesControlSystem.vue:1933/2609](../src/views/SalesControlSystem.vue) 用 `getProjectData().households` → 傳給 `UnitDetailModal`）。每筆含 `id`、`unitId`、`salesStatus_quote`、`salesStatus_backend`、`price_list_house_total`、`area_house_ping`、`area_main_ping`…
  > 採此源而非 `fetchSalesControlData`（Apps Script proxy，回傳形狀不在 repo 內、且鍵名為中文 `戶別`）以確保與既有「加入報價」100% 一致，並沿用 store 30 分鐘快取（不額外增加 Firestore 讀取）。
- **已售判定**：`unit.salesStatus_quote === '已售'`（quote 模式狀態欄位，見 [SalesControlSystem.vue:2101](../src/views/SalesControlSystem.vue) `statusField`、[:2242](../src/views/SalesControlSystem.vue) 過濾、[UnitDetailModal.vue:1706](../src/components/UnitDetailModal.vue)）。
- **row → quoteStore item 轉換**：與 [UnitDetailModal.vue handleAddToQuote (L1718-1736)](../src/components/UnitDetailModal.vue) **完全對齊**，確保 `QuoteItem` / 計算引擎可正常運作：
  ```js
  const u = unitList.find(x => x.unitId === row.selectedUnitId);
  const unitData = {
    ...u,
    房屋總表價: u.price_list_house_total,
    戶別: u.unitId,
    area_house_ping: Number(u.area_house_ping),
    area_main_ping: u.area_main_ping,
    area_ancillary_ping: u.area_ancillary_ping,
    area_common_ping: u.area_common_ping,
    area_terrace_ping: u.area_terrace_ping,
    common_area_ratio: u.common_area_ratio,
    area_main_sqm: u.area_main_sqm,
    area_ancillary_sqm: u.area_ancillary_sqm,
    area_common_sqm: u.area_common_sqm,
  };
  quoteStore.addItem(unitData); // addItem 內部以 unitData['戶別'] 為 unitId
  ```

## 9. 邊界情境與錯誤處理

| 情境 | 處理 |
|---|---|
| 直接以網址打開 `/quote-settings/:p?pick=1` 但無權限 | 路由守衛既有檢查擋下（`requiredSystem:'報價系統'`） |
| `salesDataStore` 載入失敗 / 戶別清單為空 | 彈窗顯示「無法載入戶別資料」，僅可取消返回 |
| 某戶 `building` 為空 | 歸入「未分棟」群組，仍可被選取（不漏戶） |
| 使用者未登入 / 無 `userStore.user.key` | 密碼驗證回傳 error「請重新登入」；不導向 |
| 密碼錯誤 | 對話框內 `v-alert` 顯示「密碼錯誤」，可重試（本次不做鎖定，見 §11） |
| 已選 5 筆仍想新增 | 「新增戶別」鈕 disabled＋提示「最多 5 戶」 |
| 確認時某列未選 | 略過未選列；全部未選則確認鈕 disabled |
| 選了已售（解鎖後）戶別 | 允許加入（解鎖即視同授權）；報價計算照常 |
| 解鎖後關閉再開彈窗 | `unlocked` 重置為 false，已售重新 disabled |
| 鍵盤監聽未清除 | `onUnmounted`／彈窗關閉務必 `removeEventListener`，避免污染其他頁 |
| 從列印報價返回 | 導回 `QuoteFunctionSelect`；QuoteSettings `onBeforeRouteLeave` 清空 quoteStore（符合預期） |

## 10. 實作步驟（依序）

1. **api.js**：新增 `verifyUserPassword(key, password)`（§7.2）。
2. **router/index.js**：改 `/quote-system-entry` 的 `targetRouteName` → `QuoteFunctionSelect`；新增 `/quote-function-select/:projectName` 路由（§5）。
3. **QuoteFunctionSelect.vue**（新檔）：兩按鈕版面 ＋ 密碼對話框 ＋ 導向邏輯（§7.1）。
4. **QuoteUnitPickerDialog.vue**（新檔）：逐筆新增最多 5、已售 disabled、`window` keydown 解鎖 `aaaaaaaa`、確認 → emit 已選 unitData 陣列（§7.3、§8）。
5. **QuoteSettings.vue**：`onMounted` 偵測 `route.query.pick==='1'` 且 `items` 空 → 載戶別清單並開 picker；接 picker 確認 → `quoteStore.addItem` × N；取消 → 導回 `QuoteFunctionSelect`（§7.3）。
6. 自測（§11 檢查清單）。
7. 確認後依專案慣例 `npm run build` 驗證，無誤再 commit（commit 直接進 main，依使用者既定流程）。

## 11. 測試檢查清單

- [ ] 報價系統入口選建案 → 進入「選擇功能」頁（非直接進銷控表）
- [ ] 其他入口（銷控系統、驗屋預約、客資系統）行為不受影響
- [ ] 點「銷控表」→ 出密碼框；輸入正確登入密碼 → 進入 `/quote-system/:p`（行為同現況）
- [ ] 密碼錯誤 → 顯示錯誤可重試；取消可關閉
- [ ] 點「列印報價」→ 直接進報價單設定並自動跳出戶別選擇彈窗
- [ ] 「新增戶別」逐筆增加選單；第 6 筆被擋（最多 5）
- [ ] 兩層選單：先選棟別，戶別選單僅顯示該棟別的戶；改棟別會清空已選戶別
- [ ] 已售戶別預設為 disabled 且標示「（已售）」
- [ ] **BUG 修正**：游標停在戶別/棟別選單時，連打 `aaaaaaaa` 仍能解鎖（不被選單吃掉）
- [ ] 彈窗開啟時連打 `aaaaaaaa` → 已售即時可選＋「已解鎖」toast；關閉再開恢復鎖定
- [ ] 選 N 戶確認 → 報價單正確列出 N 戶，可正常列印報價單
- [ ] 戶別資料（面積/總價/車位/配套）顯示與既有「加入報價」一致
- [ ] 取消戶別選擇 → 導回「選擇功能」頁，無殘留空白報價單
- [ ] 鍵盤監聽於離開彈窗後解除（切到別頁打字不觸發）

## 12. 待確認 / 風險（已由使用者確認 2026-05-19）

1. **密碼錯誤鎖定**：✅ 確認「可無限重試」，不做鎖定（與系統其他密碼輸入處一致）。
2. **解鎖回饋**：✅ 確認解鎖成功給「不顯眼 toast『已解鎖』」。
3. **checkInToSystem 時機**：✅ 確認維持在「選建案」時觸發（即使只走「列印報價」也佔報價系統席位）。
4. **戶別資料源**：✅ 改用 `salesDataStore.getProjectData().households`（Firestore `salesHouseholds`，與既有加入報價同源），不用 `fetchSalesControlData`；實作首步仍快速驗證欄位。
5. **重複戶別**：✅ 確認沿用 quoteStore 允許重複（不跨列去重）。

## 13. 後續優化（使用者迭代 2026-05-19）

1. **列印報價入口不提供返回**（修 bug）：`QuoteSettings` 偵測 `isPickEntry = route.query.pick === '1'`。為 `true` 時隱藏 page-header 返回鈕；空狀態不顯示「返回銷控表」改顯示「新增戶別」。`onPickerCancel` 改為僅關閉彈窗（不再導回 `QuoteFunctionSelect`），徹底避免從列印報價回到報價系統銷控模式。
2. **報價設定內可直接管理戶別**：page-header 新增「新增戶別」鈕（`openUnitPicker`：以 `salesDataStore` 快取載入戶別清單後重開 `QuoteUnitPickerDialog`，確認 → `addItem` 追加）與「移除全部戶別」鈕（含確認對話框 → `quoteStore.clearQuote()`）。兩鈕於所有入口皆可用；移除鈕僅 `items>0` 顯示。
3. **選戶別彈窗預設帶第一筆 row**：開啟時 `rows = [{building:null,unitId:null}]`（取代原先空陣列），少按一次「新增戶別」。（覆寫 §7.3「初始 rows 為空」設計）
4. **首購預設＝首購**：`quoteStore.addItem` 之 `isFirstTimeBuyer` 預設由 `'否'` 改為 `'是'`。
5. **首購/非首購 UI 改版**：[QuoteItem.vue](../src/components/QuoteItem.vue) 兩處（卡片視圖、列表視圖）`v-radio-group` 改為 `v-btn-toggle`（segmented，`mandatory`、`variant="outlined"`、`divided`、`color="primary"`），不再使用 radio 樣式，較美觀易讀。
