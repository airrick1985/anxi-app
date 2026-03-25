# 任務：預約服務常駐顯示 + 批次未開放提示優化

**設計文檔：** `.gemini/design_booking_always_show_services.md`  
**建立時間：** 2026-03-25

---

## 任務目標

優化 `BookingPage.vue` 預約頁面，使所有預約服務項目在 Step 0 始終可見，並在 Step 1 對未開放的批次提供友善提示與行事曆提醒功能。

---

## 子任務清單

### Task 1：後端 — 回傳所有批次時段資訊

**檔案：** `functions/index.js`  
**狀態：** ✅ 已完成

- [x] 修改 `_handleGetBookingInitialData` 函數 (Line 13205)
- [x] 新增 `allBatchSchedules` 欄位在回傳資料中
  - 遍歷所有 `isDeleted == false` 的批次
  - 按 `bookingType` 分組
  - 每個批次包含 `batchCode`、`applicationStart`、`applicationEnd`、`isActive`
- [x] 保留現有 `activeBookingTypes` 邏輯不變
- [x] 同步修改舊版 `getBookingInitialData` (Line 912) 的回傳值（若仍有使用）

> ⚠️ **後端變更提醒：** 完成後需部署
>
> ```
> firebase deploy --only "functions:bookingApiRouter"
> ```

---

### Task 2：前端 — Step 0 服務項目常駐顯示

**檔案：** `src/views/BookingPage.vue`  
**狀態：** ⬜ 未開始

- [ ] 新增 `allBookingTypes` computed（取得所有設定的預約服務，不過濾開放狀態）
- [ ] 修改 Step 0 模板 (Line 325)：移除 `v-if="systemStatus.code === 'OPEN'"` 的限制
- [ ] 修改按鈕列表：從 `availableBookingTypes` 改為 `allBookingTypes`
- [ ] 按鈕外觀區分：
  - 開放中：`color="primary"` 原樣
  - 未開放：灰色/次要色 + 小標籤「即將開放」或「尚未開放」
- [x] 確保系統關閉（`isPublished === false` 等全域狀態）仍能正確攔截

---

### Task 3：前端 — Step 1 批次未開放提示

**檔案：** `src/views/BookingPage.vue`  
**狀態：** ⬜ 未開始

- [ ] 新增 `isSelectedTypeActive` computed（判斷選取的服務是否在 `availableBookingTypes` 中）
- [ ] 新增 `nextBatchSchedule` computed（計算該服務對應最近未來批次的起訖時段）
- [ ] 新增 `formatScheduleDateTime()` 方法（格式化為 `YYYY/M/DD HH:MM`）
- [ ] 在 Step 1 上方新增 `v-alert` 提示區塊：
  - 顯示文字：`目前「{服務名稱}」尚未開始，開放時間 YYYY/M/DD HH:MM ~ YYYY/M/DD HH:MM`
  - 若無任何批次，顯示：`「{服務名稱}」尚未設定開放時間`
- [x] 修改 Step 1 表單顯示條件 (Line 399)：增加 `isSelectedTypeActive` 判斷

---

### Task 4：前端 — 行事曆/鬧鐘提醒功能

**檔案：** `src/views/BookingPage.vue`  
**狀態：** ⬜ 未開始

- [ ] 實作 `addToCalendar()` 方法：
  - 產生 Google Calendar URL
  - 包含事件標題、時間、說明
  - 新分頁開啟
- [x] 實作 `downloadIcsFile()` 方法：
  - 產生 ICS 格式字串
  - 包含兩組鬧鐘提醒（提前30分鐘 + 提前1天）
  - 自動下載 `.ics` 檔案
- [x] 在提示區塊中加入兩個按鈕：
  - 「加入 Google 行事曆」
  - 「下載 .ics 行事曆檔」（支援 Apple、Outlook 等）

---

### Task 5：整合測試

**狀態：** ⬜ 未開始

- [ ] 測試 Step 0 所有服務項目始終顯示
- [ ] 測試未開放服務進入 Step 1 顯示提示、隱藏表單
- [ ] 測試開放中服務進入 Step 1 正常顯示表單
- [ ] 測試 Google 行事曆連結正確開啟
- [ ] 測試 .ics 檔案正確下載且包含鬧鐘
- [ ] 測試多批次情境下正確找到最近未來批次
- [ ] 測試 Step 1 其他欄位（intro、FAQ、附件、聯絡資訊）正常顯示
- [ ] 測試即時切換場景（頁面停留時批次狀態變更）

---

## 技術依賴

| 依賴 | 說明 |
|------|------|
| `bookingBatches` 集合 | 需能正確讀取 `applicationStart` / `applicationEnd` |
| `projectConfig.bookingMenu` | Step 0 顯示所有服務的資料來源 |
| `currentTime` (每秒更新) | 已存在的即時時間 ref，用於即時判斷批次狀態 |
| `parseDateValue()` | 已存在的日期解析輔助函式 |

---

## 執行順序建議

1. **Task 1** (後端) → 部署 → 驗證 API 回傳新欄位
2. **Task 2** (Step 0) → 本地測試
3. **Task 3** (Step 1 提示) → 本地測試
4. **Task 4** (行事曆功能) → 本地測試
5. **Task 5** (整合測試)
