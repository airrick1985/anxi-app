# 功能 Spec：報價總價計算修正 ＋ 列印前底價守門與主管確認通知

**版本**: 1.0
**建立日期**: 2026-08-29
**定版日期**: 2026-08-29
**狀態**: 已實作（2026-08-29，待部署 quoteApprovalApi 與實測）
**時區**: 所有時間一律 Asia/Taipei (UTC+8)

---

## 0. 已定決策（2026-08-29 討論結果）

| # | 議題 | 決策 |
| --- | --- | --- |
| O1 | 主管名單來源 | 報價單設定新增「報價核准主管」清單（`projects/{id}.quoteApprovers`）；未設定時退回「所有具該案『銷控系統』權限且可通知者」。**候選與退回名單皆排除 roles 含「超級管理員」者。** |
| O2 | 守門強度 | 軟性：通知成功送出後 **直接解鎖**（不需勾選確認框），畫面保留提醒文字。主管 LINE 一鍵核准自動解鎖 **不做**（避免主管無法即時解鎖影響報價流程）。 |
| O3 | 檢查觸發 | 按下報價設定頁的 **「列印報價單(含期款)」按鈕**（開啟 QuotePrintDialog）即在背景觸發檢查，對象為報價單內全部戶別；對話框內 預覽／下載PDF／列印 三個動作皆受守門。 |
| O4 | 重複通知防呆 | 採用：同戶別＋同簽章 10 分鐘內已通知 → 顯示「再次通知」確認。 |
| O5 | 溢差容忍額度 | **本期實作**「銷售議價授權額度（萬）」，由具該案「銷控系統」權限人員於報價單設定維護；溢差 ≥ −額度 免通知。 |
| O6 | 阻擋區塊內容 | **前端不得顯示任何金額**（報價／底價／溢差皆不顯示），僅以警告文字提醒；後端 `check` 回應也不回傳底價數字。 |
| O7 | 通知紀錄 | 採用：寫 `projects/{id}/quoteApprovalRequests`。 |
| O8 | 主管未綁 LINE | 未綁 LINE 但有 Email → 可選，改以 **Email** 通知；LINE、Email 皆無 → 不可選。 |
| O9 | B1 修正方針 | **兩者皆做**：(1) 配套模式仍可議價（2026-08-29 追加決策）：折讓一律以「表價」為基準計算，配套模式下總價固定為配套價、折讓自「配套金額」扣除，折讓不得使配套金額為負；(2) 重構：`unitDetails` 唯讀化，議價改為由 `negotiationState` 推導的 computed，不再改寫表價。 |
| O10 | 報價卡片即時提示 | **不做**：卡片不得出現「低於底價」等敏感文字。 |

---

## 1. 現況 BUG 調查（總價錯亂、配套勾選時尤甚）

### 1.1 現行計算流程

| 項目 | 來源 |
| --- | --- |
| 報價項目儲存 | `useQuoteStore`（Pinia，`persist: true` → localStorage）[quoteStore.js](../src/store/quoteStore.js) |
| 房屋總價 | `item.unitDetails.price_list_house_total`（**議價時直接被覆寫**，`updateHousePrice`） |
| 最終總價 `getFinalTotalPrice` | 配套：`price_package_deal`；非配套：`price_list_house_total + Σ selectedParking.price_list` |
| 配套金額（折扣）`getPackagePrice` | `(price_list_house_total + 車位表價合計) − price_package_deal` |
| 顯示用房屋價 `getRawDisplayHousePrice` | 配套：`price_package_deal − 車位表價合計`；非配套：`price_list_house_total` |
| 議價 | [QuoteItem.vue:1849-1938](../src/components/QuoteItem.vue#L1849-L1938) 以 `getRawDisplayHousePrice` 為基準，寫回 `price_list_house_total`，並記 `negotiationState.originalPrice` |
| 進頁同步 | [QuoteSettings.vue:889-905](../src/views/QuoteSettings.vue#L889-L905) 以伺服器最新戶別資料 **整包覆蓋** `unitDetails` |

### 1.2 發現的問題

#### B1（主因）配套模式下議價，會把「表價」改壞
- 配套模式下 `getRawDisplayHousePrice` 回傳的是 **配套價−車位**，議價視窗以它為「現價」，儲存時卻寫進 `price_list_house_total`，`originalPrice` 也記成配套推導值（[QuoteItem.vue:1849](../src/components/QuoteItem.vue#L1849)、[1901-1920](../src/components/QuoteItem.vue#L1901-L1920)）。
- 結果：
  1. 總價不變（仍是配套價），但「配套金額」＝ 議價後房價＋車位 − 配套價 會縮小甚至 ≤ 0 → 配套期款整段消失（[QuoteItem.vue:1405](../src/components/QuoteItem.vue#L1405)）。
  2. 之後取消配套 → 總價變成「配套推導價＋車位」，真正的表價已遺失；按「恢復原價」也只能恢復到配套推導價。
  3. 先議價再勾配套 → 總價直接跳回配套價，議價被靜默忽略但「已議價」chip 仍在。
- 方案編輯器 `computePlanNegotiation`（[QuoteItem.vue:1961](../src/components/QuoteItem.vue#L1961)）同樣以 `getRawDisplayHousePrice` 為基準，問題相同。

#### B2（「系統更新後沒同步」的真正原因）重新載入後議價被表價覆蓋，但議價狀態沒清
- `loadPageData` 用 `{ ...item.unitDetails, ...matchedUnit }` 覆蓋 → `price_list_house_total` 回到伺服器表價，但 `negotiationState`（originalPrice／perTsubo／direct／totalPrice）原封不動保留在 localStorage。
- 每次發版跳出更新 modal → 使用者重整 → **議價後的價格消失、chip 卻顯示「已議價 0」**；若期間管理員改了表價，`originalPrice` 還是舊值，按「恢復原價」會恢復成舊表價。
- `clearAllNegotiations` 註解寫「離開報價設定時呼叫」，實際只在切換建案時呼叫（[QuoteSettings.vue:1116](../src/views/QuoteSettings.vue#L1116)）。
- `selectedParking` 是加入時的快照，`loadPageData` 從不刷新 → 車位表價／底價異動後報價仍用舊價。

#### B3 配套門檻自動取消配套，與議價連鎖造成總價跳動
- `isPackageDealAllowed` 用「議價後」的 `price_list_house_total` 判斷門檻（[QuoteItem.vue:1080-1084](../src/components/QuoteItem.vue#L1080-L1084)），且 `watch` 會 **靜默** 取消配套（[1093-1097](../src/components/QuoteItem.vue#L1093-L1097)）。
- 情境：門檻 1000、房 1000＋車 200、配套 1100 → 勾配套（顯示房價 900）→ 議價 −150 → `price_list_house_total`=750 → 750+200 < 1000 → 配套被自動取消 → 總價變 950，使用者完全沒被告知。

#### B4「直接輸入總價」語意不清
- 欄位標籤為「直接輸入總價 (萬)」，實際寫入的是 **房屋總價（不含車位）**（[QuoteItem.vue:1857-1860](../src/components/QuoteItem.vue#L1857-L1860)）。使用者若輸入含車位的成交總價，最終總價會再加一次車位。

#### B5 舊版 persist 資料缺欄位
- 舊版加入的項目沒有 `negotiationState`／`appliedPlans` 等欄位，多數讀取有 `?.` 防護，但 `isPlanModified`、列印議價資訊等仍假設結構存在；宜在 store 還原時做一次正規化。

### 1.3 修正方案（Part A）

#### A0 重構：`unitDetails` 唯讀化，議價改為推導值（O9 (2)）
- `item.unitDetails` 視為 **伺服器快照，只在 `addItem` 與 `loadPageData` 同步時整包替換，任何地方不得逐欄改寫**；移除 `updateHousePrice`。
- `negotiationState` 只保留調整參數：
  ```js
  negotiationState: { activeMode: '', perTsuboValue: '', directAmountValue: '', totalPriceValue: '' }
  ```
  `hasNegotiation = activeMode !== ''`；不再儲存 `originalPrice`。
- store 新增 getters（皆以 internalId 取值）：
  | Getter | 定義 |
  | --- | --- |
  | `getListHousePrice` | `unitDetails.price_list_house_total`（表價，永遠可得） |
  | `getNegotiatedHousePrice` | `activeMode === ''` → 表價；`totalPrice` → `round(totalPriceValue)`；其他 → `round(表價 + perTsuboValue × area_house_ping + directAmountValue)` |
  | `getRawDisplayHousePrice` | 配套：`price_package_deal − 車位表價合計`；非配套：`getNegotiatedHousePrice` |
  | `getFinalTotalPrice` | 配套：`price_package_deal`；非配套：`getNegotiatedHousePrice + 車位表價合計` |
  | `getPackagePrice` | `(getNegotiatedHousePrice + 車位表價合計) − price_package_deal`（配套模式折讓自配套金額扣除） |
  | `getListPackagePrice` | `(表價 + 車位表價合計) − price_package_deal`（未議價的配套金額） |
  | `getNegotiationDelta` | `getNegotiatedHousePrice − 表價` |
  | `getPayableTotalPrice` | `getNegotiatedHousePrice + 車位表價合計`（買方實付總價；底價核對用） |
- 舊資料遷移（store 還原後 `normalizeItems()`）：若 `negotiationState.originalPrice != null` → `unitDetails.price_list_house_total = originalPrice`（把表價還原）、刪除 `originalPrice`；`activeMode` 為空但有數值 → 依數值推導 `activeMode`。
- 讀取 `negotiationState.originalPrice` 的位置改用 `getListHousePrice`：QuoteItem（chip／議價視窗／方案判斷）、QuotePrintDialog（原價刪除線）、PrintQuotation（舊版議價提醒）。
- 效益：B2 自動消失（表價刷新後議價自動以新表價重算）；B1 的表價遺失不可能再發生。

#### A1 配套模式議價規則（O9 (1)）
- 議價（每坪／直接調整／直接輸入房屋總價）在配套與非配套模式皆可使用，基準一律為 **表價** `getListHousePrice`。
- 配套模式：總價固定 = 配套價（走一般期款）；`getPackagePrice`（配套金額，走配套期款）= `(議價後房價 ＋ 車位表價合計) − 配套價`，即折讓自配套金額扣除；`getListPackagePrice` = 未議價的配套金額，供顯示「原配套金額」。
- 折讓不得使配套金額 < 0：議價視窗儲存、套用議價方案、勾選配套時皆檢查並 toast 拒絕。
- 議價視窗於配套模式顯示「配套價（總價，不變）」與「配套金額 原 → 新」；列印報價單的「配套價」格顯示原配套金額刪除線＋已優惠。
- `calculateNegotiatedPrice`／`saveNegotiatedPrice`／`computePlanNegotiation` 的基準一律為 `getListHousePrice`。

#### A2 進頁同步（B2 補強）
- `loadPageData`：`unitDetails` 整包替換後不需重套議價（A0 已推導）；若新表價 ≠ 舊表價且 `hasNegotiation` → toast 一次「○○ 表價已更新，議價已依新表價重新計算」。
- 以 `parkingStore` 最新資料依 `spotId`（`spotId || 車位編號`）刷新 `selectedParking` 的 `price_list / price_floor / area_ping / area`；找不到的戶別／車位 → toast 警告「○○ 已不存在於銷控資料，請移除後重新加入」，保留項目。

#### A3（B3）
- `isPackageDealAllowed` 改以 **表價**（`getListHousePrice + 車位表價合計`）判斷；`watch` 自動取消配套時 toast 告知「○○ 總價未達配套門檻，已自動取消配套」。

#### A4（B4）
- 欄位標籤改「直接輸入房屋總價 (不含車位)」；預覽區加一列「含車位總價 = ○○ 萬」。

#### A5（B5）
- `normalizeItems()`：進頁時補齊缺欄位（與 `addItem` 相同預設），並執行 A0 遷移。

---

## 2. 新功能概述：列印前底價守門（Part B）

### 2.1 目標
使用者按下報價設定頁「列印報價單(含期款)」開啟對話框時，系統於背景以 **Firestore 最新底價** 核對報價單內每一戶：

```
溢差價 = 報價總價 − (房屋底價 + 已選車位底價合計)
需主管確認 = 溢差價 < −授權額度        （授權額度預設 0）
```

任一戶需確認 → 該戶列印動作被阻擋，畫面顯示「戶別 ○○ 價格須經專案主管確認後才可生效」（**不顯示任何金額**），使用者選擇主管並按「通知主管」→ 後端以 LINE Flex（無 LINE 則 Email）通知 → 前端顯示「通知已發送，請確認主管已核對金額後再繼續列印」→ 動作按鈕解鎖。

### 2.2 與現有功能的關係
- **入口**：[QuoteSettings.vue:263](../src/views/QuoteSettings.vue#L263) 「列印報價單(含期款)」→ [QuotePrintDialog.vue](../src/components/QuotePrintDialog.vue) 開啟時觸發；`openPdfPreview` / `downloadPdf` / `handlePrint` 受守門。舊版 PrintQuotation 按鈕目前隱藏，不納入（若恢復需接同一守門）。
- **底價欄位**：`salesHouseholds/{projectId}_{unitId}.price_floor_house_total`、`salesParkings/{projectId}_{spotId}.price_floor`（functions/index.js:1123、1368）。
- **LINE 推播**：沿用 `functions/notifications/salesStatusNotifier.js` 的 `pushLine`（`ANXISMART_LINE_CRM_TOKEN`；`users/{key}.lineId` 以 `U` 開頭）。
- **Email**：沿用同檔 `buildTransporter()`（`gmailSecrets`）與 `guardedSendMail`。
- **收件人候選**：擴充 `functions/utils/getEligibleRecipients.js` 支援指定 `systems` 與排除角色。
- **試用沙盒**：`shouldBlockOutbound(projectId, 'line')`／`guardedSendMail` 命中 → 不真發、回傳 `simulated: true`。
- **設定入口**：報價單設定工具列（`canEditQuoteRemark` 守門，與配套門檻／簡介網址同列）新增「報價核准設定」按鈕（主管清單＋授權額度）。

---

## 3. 流程

```
報價設定頁 按「列印報價單(含期款)」→ QuotePrintDialog 開啟
        │
        ▼
 runFloorCheck()  ── 全部戶別簽章皆有未過期快取 ──▶ 沿用結果
        │ 否
        ▼
 quoteApprovalApi { action:'check', projectId, operatorKey,
                    items:[{ internalId, unitId, quoteTotal, parkingSpotIds[] }] }
        │   （對話框頂部顯示「正在核對報價…」線性進度條；三個動作按鈕暫時 disabled）
        ▼
 後端讀 salesHouseholds / salesParkings 最新底價 → 逐戶算溢差、比對授權額度
        │
   ┌────┴───────────────────┐
   全數不需確認               任一戶需確認
   │                         │
   ▼                         ▼
 三按鈕正常             顯示「須主管確認」區塊（§6），
                        勾選中含需確認戶別時三按鈕 disabled
                              │  選主管 → [通知主管]
                              ▼
                 quoteApprovalApi { action:'notify', ... }
                              │  後端再核對一次 → 寫 quoteApprovalRequests
                              │  → LINE Flex（無 LINE 者 Email）
                              ▼
                 「通知已發送給 ○○○（14:32），請確認主管已核對金額後再繼續列印。」
                              │  （不需勾選）
                              ▼
                        三按鈕解鎖 → 執行原動作
```

- 若對話框開啟期間回到報價設定改了金額／車位再重開 → 簽章不符 → 該戶回到「未通知」，重新檢查與通知。
- `check` 失敗（網路／後端錯誤）→ toast 錯誤，三按鈕維持 disabled 並顯示「重新核對」按鈕（fail-closed）。

---

## 4. 檢查規則（後端）

| 項目 | 定義 |
| --- | --- |
| 報價總價 `quoteTotal` | **買方實付總價** `quoteStore.getPayableTotalPrice(internalId)` = 議價後房屋總價 ＋ 車位表價合計（非配套＝總價；配套＝配套價＋配套金額，因配套金額亦為買方須支付），單位萬，四捨五入整數（2026-08-29 追加決策） |
| 溢差價單價 `diffPerPing` | `diff ÷ area_house_ping`，兩位小數（萬/坪）；面積為 0 不顯示（僅用於主管訊息與紀錄） |
| 房屋底價 `houseFloor` | `salesHouseholds/{projectId}_{unitId}.price_floor_house_total`（Number；空值 → 0 並標 `missingHouseFloor`） |
| 車位底價 `parkingFloor` | Σ `salesParkings/{projectId}_{spotId}.price_floor`；找不到的 spotId 記入 `missingParking[]`，以 0 計 |
| 底價合計 `floorTotal` | `houseFloor + parkingFloor` |
| 溢差價 `diff` | `quoteTotal − floorTotal` |
| 授權額度 `tolerance` | `projects/{projectId}.quoteFloorTolerance`（萬，≥ 0，預設 0） |
| 需確認 `needsApproval` | `diff < −tolerance` |
| 缺房屋底價 | `needsApproval = false`，回 `missingHouseFloor: true`，前端黃色提示「○○ 未設定房屋底價，無法核對，請通知銷控補登」，不阻擋 |
| 戶別不存在 | `missingUnit: true` → 阻擋並提示「○○ 已不存在於銷控資料，請移除後重新加入」 |
| 簽章 `signature` | `sha1(unitId|quoteTotal|sorted spotIds|tolerance)`；前端快取 key 與「金額已變更」偵測 |

> `check` 回應 **不含** `houseFloor / parkingFloor / floorTotal / diff` 任何數字（O6）；金額只出現在主管收到的訊息與 `quoteApprovalRequests` 紀錄中。
> 底價一律以後端讀取為準，不採用前端 persist 快照。

---

## 5. 主管名單（O1、O8）

### 5.1 報價核准設定（新對話框 `QuoteApprovalSettingDialog.vue`）
- 入口：報價單設定工具列 icon `mdi-account-check`，`canEditQuoteRemark` 守門（超級/系統管理員或具該案「銷控系統」權限）。
- 內容：
  1. **報價核准主管**（`v-select` 多選 chips）：候選由 `action:'listApprovers'` 回傳；每人顯示通道 chip：「LINE」綠／「Email」藍／「無法通知」灰（不可選）。
  2. **銷售議價授權額度（萬）**：數字輸入，≥ 0，空白＝0；說明「報價低於底價在此額度內免通知主管」。
- 儲存至 `projects/{projectId}`（`projectStore.updateProjectSettings`）：
  ```js
  quoteApprovers: ['0912xxxxxx', ...],
  quoteFloorTolerance: 0,
  quoteApprovalMeta: { updatedBy, updatedAt }   // updatedAt ISO 字串
  ```
- 開啟時直接讀 Firestore（比照 QuotePackageLimitDialog），並同步 `projectStore` 本地快取。

### 5.2 候選規則（`listApprovers`）
- `userPermissions` 中 `permissions[projectId].systems` 含「銷控系統」者。
- 排除：`users/{key}.roles` 含「超級管理員」、`EXCLUDED_USER_KEYS`。
- 每人回 `{ userKey, name, hasLine, hasEmail }`；`hasLine || hasEmail` 為 false 者仍回傳但前端標「無法通知」不可選。

### 5.3 列印時的選擇清單
- `quoteApprovers` 非空 → 只列這些人（即時查 `lineId / email`，仍套 5.2 排除）。
- 為空 → 退回 5.2 全部候選。
- 預設全選可通知者；至少一人才可按「通知主管」。
- 通道：有 LINE → LINE；無 LINE 有 Email → Email；皆無 → 不可選。

---

## 6. 前端 UI（QuotePrintDialog）

### 6.1 檢查中
- 對話框頂部 `v-progress-linear indeterminate` ＋ 文字「正在核對報價…」；三個動作按鈕 disabled。

### 6.2 阻擋區塊（備註區與 actions 之間；只在有需確認戶別時渲染）
```
┌─ ⚠ 以下戶別價格須經專案主管確認後才可生效 ─────────────────────────┐
│  • A1-5F   尚未通知                                                  │
│  • B2-3F   已通知 王主管（LINE）、李副理（Email）  2026/08/29 14:32   │
│                                                                      │
│  通知主管：[ 王主管 LINE ✓ ] [ 李副理 Email ✓ ] ▾    [ 📲 通知主管 ]  │
│                                                                      │
│  ✅ 通知已發送給 王主管、李副理（2026/08/29 14:32）。                  │
│     請確認主管已核對金額後再繼續列印。                                 │
└──────────────────────────────────────────────────────────────────────┘
```
- **不顯示** 報價／底價／溢差／授權額度等任何數字。
- 三個動作按鈕在「勾選的戶別中有 needsApproval 且尚未通知（或簽章不符）」時 `disabled`，tooltip「○○ 價格須經主管確認，請先通知主管」。通知成功後即解鎖（O2）。
- 「通知主管」執行中顯示 contained overlay（比照 SalesStatusNotifyDialog）。
- O4：任一勾選戶別同簽章 10 分鐘內已通知 → 按鈕文字改「再次通知」，點擊先 `confirm('已於 14:32 通知過，是否再次發送？')`。
- 缺底價／缺車位 → 黃色 `v-alert`，不阻擋；戶別不存在 → 紅色，阻擋。
- 手機版：每戶一列堆疊，主管選擇器與按鈕滿版。

### 6.3 報價設定頁（QuoteItem）
- **不新增任何底價相關提示**（O10）。

### 6.4 store 狀態
`quoteStore` 每個 item 新增（persist）：
```js
floorApproval: {
  signature: '',        // 通知當時簽章
  requestId: '',        // quoteApprovalRequests doc id
  notifiedAt: '',       // ISO（顯示時轉台灣時間）
  supervisors: [],      // [{ userKey, name, channel: 'line'|'email' }]
}
```
- 對話框內另有 session 級 `checkResults: Map<internalId, { needsApproval, missingUnit, missingHouseFloor, missingParking, signature, checkedAt }>`（不 persist；快取 10 分鐘）。
- `removeItem`／`clearQuote`／切換建案 一併清除 `floorApproval`。

---

## 7. 後端 Cloud Function

`exports.quoteApprovalApi = onCall({ region: 'asia-east1', memory: '512MiB', secrets: [...gmailSecrets, ...lineSecrets] }, ...)`
（比照 `bookingApi` router；實作放 `functions/quoteApproval.js`；部署 `FUNCTIONS_DISCOVERY_TIMEOUT=120 firebase deploy --only functions:quoteApprovalApi`）

### 7.1 共通驗證
- `projectId`、`operatorKey` 必填；`userPermissions/{operatorKey}.permissions[projectId].systems` 含「報價系統」或「銷控系統」，或 `users/{operatorKey}.roles` 含 超級管理員／系統管理員；否則 `permission-denied`。

### 7.2 `action: 'check'`
```js
// request
{ projectId, operatorKey, items: [{ internalId, unitId, quoteTotal, parkingSpotIds: [] }] }
// response（無任何金額）
{ status: 'success', tolerance_applied: true, checkedAt,
  results: [{ internalId, unitId, needsApproval, missingUnit, missingHouseFloor, missingParking: [], signature }] }
```
- `documentId in` 每批 ≤ 30 分批讀取；同 unitId／spotId 去重後查一次。

### 7.3 `action: 'notify'`
```js
// request
{ projectId, projectName, operatorKey, operatorName,
  salesName, salesPhone,                       // 報價人員（QuoteSettings 選定者）
  supervisorKeys: [],
  units: [{ internalId, unitId, quoteTotal /* 實付總價 */, areaHousePing, usePackageDeal, packageDeal, packageAmount,
            houseListPrice, houseNegotiatedPrice, parking: [{ spotId, priceList }] }] }
// response
{ status: 'success', simulated: false,
  requests: [{ internalId, unitId, requestId, signature }],
  supervisors: [{ userKey, name, channel: 'line'|'email', status: 'sent'|'failed'|'simulated' }] }
```
1. 重新執行 `check` 邏輯（底價、額度皆取後端），僅對 `needsApproval` 的戶別建立紀錄與發送；全部不需 → `skipped: 'no-breach'`。
2. `supervisorKeys` 逐一驗證：在 `quoteApprovers` 內或具「銷控系統」權限、非超級管理員；通道判定同 §5.3。
3. 每戶寫一筆 `quoteApprovalRequests`（§9.2）。
4. 每位主管一次推送：LINE → Flex carousel（≤ 10 bubble，超過分批）；Email → 一封含全部戶別表格的 HTML。
5. 沙盒命中 → 不發送，`simulated: true`，紀錄照寫（`lineStatus: 'simulated'`）。
6. LINE 429 重試 3 次（沿用既有邏輯）；單一主管失敗不影響其他人，結果逐人回傳。

### 7.4 `action: 'listApprovers'`
回傳 §5.2 候選清單。

---

## 8. 通知內容

### 8.1 LINE Flex（每戶一 bubble，紅色標頭 `#C62828`）
- `altText`：`[{projectName}] {unitId} 報價低於底價，請主管確認`
```
┌──────────────────────────────┐
│ ⚠ 報價低於底價，請主管確認     │  header
├──────────────────────────────┤
│ 建案      安心建案             │
│ 戶別      A1-5F               │
│ 銷售      王小明 0912-xxx-xxx  │
│ 房屋面積  45.2 坪              │
│ 車位      B1-12、B1-13（2 個） │  無車位顯示「無」
│ ───────────────────────────  │
│ 報價金額  1,150 萬（配套）     │  實付總價；「（配套）」僅配套模式顯示
│   配套價 1,100 ＋ 配套金額 50  │  小字，僅配套模式
│ 底價金額  1,080 萬            │  小字：房屋 950 ＋ 車位 130
│ 溢差價    −30 萬              │  紅色粗體
│ 溢差價單價 −0.66 萬/坪         │  溢差價 ÷ 房屋面積，兩位小數
│ 授權額度  20 萬               │  額度 > 0 才顯示
│ ───────────────────────────  │
│ 表價 1,100 萬 → 議價後 920 萬  │  有議價才顯示（小字灰）
│ 時間      2026/08/29 14:32    │
│ 操作帳號  王小明               │  報價人員 ≠ 登入者時顯示
└──────────────────────────────┘
```

### 8.2 Email（主管無 LINE 時）
- 主旨：`[{projectName}] 報價低於底價待確認：{unitId}（多戶：{unitId} 等 N 戶）`
- 內容：與 Flex 相同欄位的 HTML 表格，每戶一段；沿用 `salesStatusNotifier.buildEmailHtml` 風格。

---

## 9. 資料結構

### 9.1 `projects/{projectId}`（新增欄位）
| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `quoteApprovers` | string[] | 報價核准主管 userKey |
| `quoteFloorTolerance` | number | 銷售議價授權額度（萬，≥ 0，預設 0） |
| `quoteApprovalMeta` | `{ updatedBy, updatedAt }` | |

### 9.2 `projects/{projectId}/quoteApprovalRequests/{autoId}`
```js
{
  unitId, projectName,
  salesName, salesPhone, operatorKey, operatorName,
  quoteTotal, floorTotal, houseFloor, parkingFloor, diff, tolerance, diffPerPing,   // quoteTotal = 實付總價
  areaHousePing, usePackageDeal, packageDeal, packageAmount,                       // 配套價／配套金額
  houseListPrice, houseNegotiatedPrice,
  parking: [{ spotId, priceList, priceFloor }],
  supervisors: [{ userKey, name, channel, status }],
  signature, status: 'notified',
  source: 'quotePrint',
  createdAt: Timestamp, createdAtTaipei: 'YYYY/MM/DD HH:mm'
}
```

---

## 10. 權限／安全／沙盒
- 前端阻擋只是 UX；`notify` 後端會再次核對底價與額度，金額無法由前端竄改繞過。
- 前端任何畫面（報價卡片、列印對話框、toast）**不得出現底價／溢差數字或「低於底價」字樣**；統一用「價格須經專案主管確認」措辭。
- LINE／Email 僅發給經驗證的主管；`check` 回應不含金額。
- 試用帳號（TESTA／測試建案A）：走沙盒守衛，不對外推播、不寄信。
- 不使用 `where + orderBy` 複合查詢；`quoteApprovalRequests` 若需列表，前端排序。

---

## 11. 邊界情況
| 情況 | 處理 |
| --- | --- |
| 戶別在伺服器已不存在 | `missingUnit` → 阻擋，提示移除重加 |
| 車位 spotId 找不到 | 底價以 0 計，黃色提示，不阻擋 |
| 同一戶重複加入報價單兩筆 | 各自檢查（以 internalId 對應）；簽章相同者共用一筆通知紀錄 |
| 主管清單全部無法通知 | 按鈕 disabled，提示「所選主管皆未綁定 LINE 且無 Email，請先完成綁定或洽系統管理員」 |
| 網路失敗／後端錯誤 | toast 錯誤，維持阻擋，提供「重新核對」按鈕（fail-closed） |
| 對話框內改勾選戶別 | 阻擋判斷只看勾選戶別；未勾選的需確認戶別不影響列印 |
| 通知後回報價設定改金額再回來 | 簽章不符 → 該戶重新阻擋 |
| 授權額度變更 | 簽章含 tolerance → 舊快取自動失效 |
| 主管 LINE 發送失敗但 Email 成功／部分主管失敗 | 只要至少一位主管 `sent`（或 `simulated`）即視為已通知並解鎖；失敗者以 toast 警告列出 |

---

## 12. 測試案例

### Part A（修正）
1. 非配套：議價 −50 → 總價減 50；F5 重整 → 總價仍為議價後，chip 正確；`unitDetails.price_list_house_total` 仍為表價。
2. 配套模式：議價 −50 → 總價仍＝配套價、配套金額減 50、chip 顯示 −50；取消配套 → 總價＝表價−50＋車位；折讓超過配套金額 → 拒絕儲存。
3. 門檻 1000、房 1000＋車 200、配套 1100：非配套議價至 750 後配套 checkbox 仍可勾（以表價判斷）；管理員將門檻改 1300 → 自動取消配套且 toast。
4. 管理員改表價 1000→1050，使用者重整 → toast「表價已更新…」，perTsubo −1 × 坪數依新表價重算；「直接輸入房屋總價」模式維持輸入值。
5. 車位表價異動後重整 → 車位合計更新。
6. 舊版 localStorage（含 `originalPrice`）→ 遷移後表價正確、議價 chip 正確。

### Part B（守門）
7. 全部 ≥ 底價−額度：開啟對話框後短暫進度條，三按鈕可用，無阻擋區塊。
8. 一戶溢差 −30、額度 0：阻擋區塊只列戶別與文字，無數字；選主管 → 通知 → LINE 收到 Flex（欄位齊全）→ 三按鈕解鎖。
9. 額度設 50、同一戶 → 不阻擋。
10. 主管 A 無 LINE 有 Email → 顯示 Email chip，通知後收到信。
11. 通知後改金額回來 → 重新阻擋；10 分鐘內同金額重按 → 「再次通知」確認。
12. TESTA 建案 → `simulated: true`，流程照走，不發 LINE／Email。
13. 未設定底價戶別 → 黃色提示不阻擋；戶別被刪 → 紅色阻擋。
14. 無「報價系統」權限的 operatorKey → permission-denied；超級管理員不出現在主管候選。

---

## 13. 實作清單

### 前端
- [x] `src/store/quoteStore.js`：A0 getters 重構、移除 `updateHousePrice`、`normalizeItems()` 遷移、`floorApproval` 欄位與 `setFloorApproval()`/`clearFloorApproval()`。
- [x] `src/components/QuoteItem.vue`：A1／A3／A4；議價視窗與方案套用改以 `negotiationState` 參數為準；chip／delta 改用新 getters。
- [x] `src/components/QuotePrintDialog.vue`：原價刪除線改用 `getListHousePrice`；開啟時 `runFloorCheck()`；阻擋區塊、主管選擇、通知、解鎖；快取與簽章。
- [x] `src/views/PrintQuotation.vue`（舊版，隱藏中）：議價提醒改用 `getListHousePrice`，維持可編譯。
- [x] `src/views/QuoteSettings.vue`：A2（同步 toast、刷新車位）、工具列「報價核准設定」按鈕。
- [x] `src/components/QuoteApprovalSettingDialog.vue`（新）：主管清單＋授權額度。
- [x] `src/api.js`：`quoteApprovalApi = httpsCallable(functions, 'quoteApprovalApi')` 與 `checkQuoteFloor / notifyQuoteApproval / listQuoteApprovers` 包裝。
- [ ] `CHANGELOG.md` 更新資訊（commit-notes 流程）。

### 後端
- [x] `functions/quoteApproval.js`（新）：check／notify／listApprovers、Flex builder、Email builder。
- [x] `functions/utils/getEligibleRecipients.js`：新增 `{ systems, excludeRoles }` 參數（預設行為不變）。
- [x] `functions/index.js`：`exports.quoteApprovalApi`（512MiB、asia-east1、gmail＋line secrets）。
- [ ] 部署：`FUNCTIONS_DISCOVERY_TIMEOUT=120 firebase deploy --only functions:quoteApprovalApi`。

---

## 14. Phase 2 候選（本期不做）
1. 主管 LINE 一鍵核准／退回（LIFF）→ 自動解鎖與列印稿核准章。
2. 未核准列印稿浮水印。
3. 授權額度改為依人員層級設定。
4. 主管後台清單：查看 `quoteApprovalRequests` 與低於底價報價統計。
