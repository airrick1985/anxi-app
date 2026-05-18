# 功能 Spec：STAND BY 看板 — 自訂自動截圖時段

**版本**: 0.1
**建立日期**: 2026-05-18
**狀態**: 待實施

---

## 1. 功能概述

### 1.1 目標
1. 在「看板設定」對話框中，為**目前 projectId** 新增「自動截圖時段」設定區，可**新增無限多組**截圖時間（每組為一天中的某個時:分），亦可刪除。
2. 將前端定時截圖的觸發判斷，由「瀏覽器本機時間」改為**強制以台灣時間 (Asia/Taipei) 判斷**，避免電腦時區設定錯誤造成截圖時間偏移。
3. 一併修正現有去重邏輯的潛在 Bug（見 §5）。

### 1.2 現況問題
- 截圖時段目前為**硬編碼**於 [src/views/Standby.vue:596-603](../src/views/Standby.vue#L596-L603) 的 `triggerTimes` 陣列（09:00 / 12:00 / 15:00 / 18:00 / 20:00），所有建案共用、無法調整。
- 觸發判斷使用 [Standby.vue:592-593](../src/views/Standby.vue#L592-L593) `currentTime.value.getHours()` / `getMinutes()` → 抓的是執行該頁面之電腦的本機時區，並非台灣時間。
- 去重變數 `lastTriggerMinute`（[Standby.vue:552](../src/views/Standby.vue#L552)）僅記錄「分鐘數 0–59」且不重置；當多個時段分鐘相同（皆為整點 :00）時，第一個時段觸發後其餘時段會被誤判為「本分鐘已觸發」而被跳過。

### 1.3 與現有功能的關係
- **沿用設定儲存**：Firestore 文件 `standbyConfig/{projectId}`，沿用 [fetchStandbyConfigAPI](../src/api.js#L7025) / [saveStandbyConfigAPI](../src/api.js#L7070)，**僅新增一個欄位**，不新增/修改任何 Cloud Function。
- **沿用截圖機制**：截圖仍由前端 `html2canvas` 擷取後呼叫 `saveStandbyScreenshotAPI`（[Standby.vue:1217](../src/views/Standby.vue#L1217) `captureAndSaveScreenshot`），本案不更動截圖與上傳流程。
- **沿用時區工具**：複用已 import 的 `date-fns-tz` `formatInTimeZone`（[Standby.vue:478](../src/views/Standby.vue#L478)）。
- **沿用 UI 樣式**：新增區塊比照「警示設定」fieldset（[Standby.vue:271-287](../src/views/Standby.vue#L271-L287)）。

### 1.4 範圍界定（非目標）
- 不改為「後端排程截圖」。截圖仍需有人在對應時間開著 STAND BY 頁面才會發生（此為現況限制，本案不處理）。
- 不變更截圖儲存位置、檔名、歷史瀏覽介面。
- 不做「每組時段可選星期」等進階排程（保留為未來擴充）。

---

## 2. 資料模型

於 `standbyConfig/{projectId}` 文件新增欄位：

| 欄位 | 型別 | 說明 |
|------|------|------|
| `screenshotTimes` | `string[]` | 截圖時段陣列，每筆為 24 小時制 `"HH:mm"`（補零，如 `"09:00"`、`"18:30"`）。已排序、去重。 |

範例：
```json
{
  "visiblePersonnelIds": ["..."],
  "colors": { "...": "..." },
  "alertThresholdMinutes": 120,
  "screenshotTimes": ["09:00", "12:00", "15:00", "18:00", "20:00"],
  "updatedAt": "<serverTimestamp>"
}
```

### 2.1 預設值與回溯相容（重要決策）
- `fetchStandbyConfigAPI` 的 `defaultConfig` 新增 `screenshotTimes: []`。
- **載入時的回退規則**：
  - 文件中 `screenshotTimes` 為**不存在 / 非陣列**（舊資料、從未設定過）→ 視為沿用舊有預設 `["09:00","12:00","15:00","18:00","20:00"]`，**維持現行行為不變**。
  - `screenshotTimes` 為**已存在的空陣列 `[]`**（使用者刻意清空並儲存）→ 代表**不自動截圖**（手動截圖按鈕仍可用）。
- 此規則使既有建案在未進設定前行為完全不變，同時允許明確關閉自動截圖。

### 2.2 驗證規則（前端，儲存前）
- 每筆需符合 `^([01]?\d|2[0-3]):[0-5]\d$`，正規化為兩位數補零 `HH:mm`。
- 去除空白、去除不合法項目、去除重複、依時間升冪排序後再寫入。
- 無上限筆數（符合「可新增無限多」需求）；不合法輸入不得寫入 Firestore。

---

## 3. UI 設計（看板設定對話框）

於現有「警示設定」fieldset 之後，新增 fieldset：

```
┌─ 自動截圖時段 ─────────────────────────────┐
│  ① [ 09:00 ⏱ ]   [🗑]                       │
│  ② [ 12:00 ⏱ ]   [🗑]                       │
│  ③ [ 18:30 ⏱ ]   [🗑]                       │
│  ...（無限多）                               │
│                                              │
│  [ ＋ 新增時段 ]                             │
│  說明：時間以台灣時間 (Asia/Taipei) 為準。   │
│  清空全部時段＝不自動截圖。                  │
└──────────────────────────────────────────────┘
```

- 每列：`<v-text-field type="time" density="compact" variant="outlined">` + 刪除 `v-btn`（icon `mdi-delete`）。採用原生 `type="time"` 以利時:分輸入。
- 「＋ 新增時段」按鈕：`push` 一筆預設值（建議 `"09:00"`）至暫存陣列 `tempScreenshotTimes`。
- 不在對話框內即時排序（避免使用者輸入中跳動）；於「儲存設定」時才正規化＋排序＋去重。
- 重複或不合法時，於儲存時以 snackbar/alert 提示並擋下（沿用現有 `saveSettings` 的錯誤呈現方式）。

---

## 4. 前端狀態與流程變更（Standby.vue）

### 4.1 新增 refs
- `screenshotTimes`（主狀態，`ref([])`）：實際生效的時段，供觸發邏輯讀取。
- `tempScreenshotTimes`（`ref([])`）：設定對話框編輯用暫存。
- 新增常數 `DEFAULT_SCREENSHOT_TIMES = ['09:00','12:00','15:00','18:00','20:00']`。

### 4.2 載入（`onMounted` 與 `openSettingsDialog`）
- `onMounted`（[Standby.vue:1383-1399](../src/views/Standby.vue#L1383-L1399)）：依 §2.1 規則計算 `screenshotTimes.value`。
- `openSettingsDialog`（[Standby.vue:837-890](../src/views/Standby.vue#L837-L890)）：`tempScreenshotTimes.value = [...screenshotTimes.value]`（深拷貝）。

### 4.3 儲存（`saveSettings`，[Standby.vue:893-930](../src/views/Standby.vue#L893-L930)）
- 對 `tempScreenshotTimes` 執行 §2.2 正規化（trim → 驗證 → 補零 → 去重 → 排序）。
- 任一筆不合法 → 中止儲存並提示，不寫入。
- `configToSave` 加入 `screenshotTimes`；成功後同步更新主 ref `screenshotTimes.value`。

### 4.4 觸發邏輯改寫（`updateClock`，[Standby.vue:589-636](../src/views/Standby.vue#L589-L636)）
- 以台灣時間取得目前時:分與當日日期：
  ```js
  const tw = formatInTimeZone(currentTime.value, 'Asia/Taipei', 'yyyy-MM-dd HH:mm');
  const nowHHmm = tw.slice(11);      // "HH:mm"（台灣時間）
  ```
- `shouldTrigger = screenshotTimes.value.includes(nowHHmm)`。
- **去重改用「當日 + 時段」鍵**取代 `lastTriggerMinute`：
  - 新增 `lastTriggeredKey = ref('')`。
  - 命中且 `lastTriggeredKey.value !== tw` 時 → 觸發 `captureAndSaveScreenshot()`，並設 `lastTriggeredKey.value = tw`。
  - 確保每個設定時段每天**恰好觸發一次**，且不同整點時段彼此不互相壓抑（修正 §1.2 / §5 的 Bug）。
- 移除舊的 `lastTriggerMinute` 相關四段 if/else。

---

## 5. 既有 Bug 修正

**現象**：當 `triggerTimes` 全為整點（分鐘皆 `0`），`lastTriggerMinute` 於 09:00 觸發後固定為 `0` 且永不重置；12:00 / 15:00 / 18:00 / 20:00 因 `currentMinute(0) === lastTriggerMinute(0)` 被判為「本分鐘已觸發」而**全部不截圖**——實際上每天僅 09:00 會截圖。

**修正**：改以台灣時間的 `"yyyy-MM-dd HH:mm"` 作為去重鍵（§4.4），每個 `(日期, 時段)` 僅觸發一次，徹底解決同分鐘互相壓抑問題。

---

## 6. 邊界情境

| 情境 | 行為 |
|------|------|
| 從未設定過（舊建案） | 沿用預設五時段，行為不變 |
| 使用者清空全部時段並儲存 | `screenshotTimes=[]`，不自動截圖；手動截圖按鈕仍可用 |
| 同一時:分重複輸入 | 儲存時去重，僅留一筆 |
| 不合法輸入（如 `25:99`、空白） | 儲存時擋下並提示，不寫入 Firestore |
| 跨午夜 / 換日 | 去重鍵含日期，隔日同時段可再次觸發 |
| 頁面於某時段未開啟 | 該次不截圖（現況限制，非本案範圍） |
| 電腦時區非台灣 | 觸發改以 Asia/Taipei 判斷，不受影響 |
| 頁面於時段中途才開啟（已過該分鐘的 :00 秒） | `updateClock` 每秒檢查，只要該分鐘內任一秒命中即觸發一次 |

---

## 7. 影響檔案清單

| 檔案 | 變更 |
|------|------|
| [src/views/Standby.vue](../src/views/Standby.vue) | 新增設定 UI fieldset；新增 `screenshotTimes` / `tempScreenshotTimes` / `lastTriggeredKey` refs 與常數；改寫 `updateClock` 觸發與去重；`onMounted` / `openSettingsDialog` / `saveSettings` 載入與儲存 `screenshotTimes`；移除 `lastTriggerMinute` 與硬編碼 `triggerTimes` |
| [src/api.js](../src/api.js) | `fetchStandbyConfigAPI` 之 `defaultConfig` 新增 `screenshotTimes: []`（`saveStandbyConfigAPI` 已展開整包 config，無需改動） |

> Cloud Functions、Firestore 規則、截圖上傳流程**皆不需變更**。

---

## 8. 驗收標準

1. 進入「看板設定」可見「自動截圖時段」區，能新增（無上限）、刪除、修改時段並儲存成功。
2. 重新整理 / 重開對話框後，設定值正確還原（讀自 `standbyConfig/{projectId}`）。
3. 不同 projectId 各自獨立的截圖時段設定，互不影響。
4. 設定 `["14:05"]`，於台灣時間 14:05 開著頁面 → 當分鐘內觸發**恰一次**截圖；14:06 不再觸發；隔日 14:05 再次觸發。
5. 將電腦時區改為非台灣（如 UTC），台灣時間 14:05 仍正確觸發（驗證 §1.2 時區修正）。
6. 設定多個整點時段（如 `["09:00","12:00","15:00"]`）→ 每個整點皆能各自觸發（驗證 §5 Bug 修正）。
7. 既有未設定過的建案，未進設定前行為與現況完全一致（沿用五時段）。
8. 清空全部時段並儲存後 → 不再自動截圖；手動截圖按鈕仍正常。

---

## 9. 待確認決策（請審閱）

- **D1（預設回退）**：採「未設定過 → 沿用舊五時段；明確清空 → 不截圖」(§2.1)。是否同意？
- **D2（時間輸入 UI）**：採原生 `type="time"`（時:分）。是否同意，或偏好「時 / 分」下拉？
- **D3（儲存格式）**：採 `"HH:mm"` 字串陣列（§2）。是否同意，或偏好 `{hour,minute}` 物件陣列？
