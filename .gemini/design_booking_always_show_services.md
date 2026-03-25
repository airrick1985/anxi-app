# 預約服務常駐顯示 + 批次未開放提示優化 設計文檔

## 📋 需求概述

目前預約頁面 Step 0 的「選擇您的預約服務」僅在批次項目狀態為「開放中」時才顯示對應服務按鈕。此需求要改為：

1. **Step 0 服務項目始終顯示** — 不論批次是否開放中，系統上線即顯示所有已設定的服務項目。
2. **Step 1 批次未開放提示** — 用戶選擇服務進入 Step 1 後，若該服務的批次尚未開放，則在上方顯示醒目提示區塊。
3. **行事曆/鬧鐘提醒** — 提示區塊提供「加入行事曆」與「設定鬧鐘提醒」功能。
4. **表單隱藏** — 批次未開放時隱藏 Step 1 的預約表單，僅保留其他欄位正常顯示。

---

## 🔍 現有架構分析

### Step 0 服務顯示邏輯

**位置：** `BookingPage.vue` Line 325-346

目前 Step 0 預約服務區受兩層過濾：

1. **外層條件** (Line 325): `v-if="systemStatus.code === 'OPEN'"` — 僅系統開放時顯示
2. **內層過濾** (Line 1376-1402): `availableBookingTypes` computed — 依據後端 `activeBookingTypes` 過濾

### 後端 `activeBookingTypes` 來源

**位置：** `functions/index.js` Line 13205-13292 (`_handleGetBookingInitialData`)

- 查詢 `bookingBatches` 集合中 `isDeleted == false` 的批次
- 比對 `applicationStart` / `applicationEnd` 與當前時間
- 僅回傳 **開放中** 批次的 `bookingType`

### 批次資料結構 (`bookingBatches` 集合)

| 欄位 | 類型 | 說明 |
|------|------|------|
| `projectId` | String | 建案 ID |
| `bookingType` | String | 預約類型 (如「初驗」「複驗」) |
| `batchCode` | String | 批次代碼 |
| `applicationStart` | Timestamp | 申請開始時間 |
| `applicationEnd` | Timestamp | 申請結束時間 |
| `bookingStart` | String | 可預約日期起始 |
| `bookingEnd` | String | 可預約日期結束 |
| `isDeleted` | Boolean | 是否已刪除 |

---

## 🏗 設計方案

### 一、後端修改：回傳所有批次時段資訊

**修改位置：** `functions/index.js` `_handleGetBookingInitialData` 函數

**變更內容：**

在回傳資料中新增 `allBatchSchedules` 欄位，包含 **所有未刪除批次** 的時段資訊（不僅限開放中的）。

```javascript
// 回傳結構新增
{
  // ... 原有欄位
  activeBookingTypes: finalTypes,        // 仍保留（開放中的類型）
  allBatchSchedules: {                   // 新增：所有批次的時段資訊
    "初驗": [
      { 
        batchCode: "A", 
        applicationStart: "2026-04-01T09:00:00+08:00",
        applicationEnd: "2026-04-15T17:00:00+08:00",
        isActive: false  // 是否正在開放中
      },
      // ...
    ],
    "複驗": [ ... ]
  }
}
```

**設計重點：**

- 遍歷所有 `isDeleted == false` 的批次
- 按 `bookingType` 分組
- 每個批次包含 `applicationStart`、`applicationEnd`、`isActive` 狀態
- 不影響現有 `activeBookingTypes` 的邏輯

### 二、前端修改：Step 0 常駐顯示

**修改位置：** `BookingPage.vue`

#### 2.1 新增 computed: `allBookingTypes`

```javascript
// 取得所有設定的預約服務類型（無論是否開放）
const allBookingTypes = computed(() => {
  if (!projectConfig.value) return [];
  
  // 從 bookingMenu 取得所有未刪除的項目
  if (projectConfig.value.bookingMenu?.length > 0) {
    return projectConfig.value.bookingMenu
      .filter(item => !item.deleted)
      .map(item => item.title);
  }
  
  // Fallback Legacy
  return projectConfig.value.bookingTypes || [];
});
```

#### 2.2 修改 Step 0 模板

**原邏輯：** `v-if="systemStatus.code === 'OPEN'"` 控制顯示，使用 `availableBookingTypes` 列表
**新邏輯：** 移除外層 `systemStatus.code === 'OPEN'` 限制，改用 `allBookingTypes` 渲染

```html
<!-- 修改前 -->
<div class="pa-6" v-if="systemStatus.code === 'OPEN'">
  <div v-if="availableBookingTypes && availableBookingTypes.length > 0">
    <v-col v-for="type in availableBookingTypes" ...>

<!-- 修改後 -->
<div class="pa-6">
  <div v-if="allBookingTypes && allBookingTypes.length > 0">
    <v-col v-for="type in allBookingTypes" ...>
```

- 按鈕外觀加入開放狀態判斷：開放中使用 `color="primary"`，未開放使用灰色/次要色 + 附加說明標籤

### 三、前端修改：Step 1 批次未開放提示

#### 3.1 新增 computed: `nextBatchSchedule`

計算使用者選擇的預約服務對應的「距當下最近的未來批次時段」：

```javascript
const nextBatchSchedule = computed(() => {
  if (!selectedBookingType.value || !initialData.value?.allBatchSchedules) return null;
  
  const schedules = initialData.value.allBatchSchedules[selectedBookingType.value];
  if (!schedules?.length) return null;
  
  const now = currentTime.value;
  
  // 找到最近的未來批次（applicationStart > now）
  const futureSchedules = schedules
    .filter(s => {
      const start = parseDateValue(s.applicationStart);
      return start && start > now;
    })
    .sort((a, b) => {
      const aStart = parseDateValue(a.applicationStart);
      const bStart = parseDateValue(b.applicationStart);
      return aStart - bStart;
    });

  return futureSchedules.length > 0 ? futureSchedules[0] : null;
});
```

#### 3.2 新增 computed: `isSelectedTypeActive`

```javascript
const isSelectedTypeActive = computed(() => {
  if (!selectedBookingType.value) return false;
  return availableBookingTypes.value.includes(selectedBookingType.value);
});
```

#### 3.3 Step 1 模板 — 未開放提示區塊

在 Step 1（Line 399 之前）新增提示區塊：

```html
<!-- 批次未開放提示 -->
<v-alert 
  v-if="step === 1 && !isSelectedTypeActive && nextBatchSchedule"
  type="warning" variant="tonal" border="start" prominent
  class="mx-4 mt-4"
  icon="mdi-clock-alert-outline"
>
  <template v-slot:title>
    <span class="font-weight-bold">
      目前「{{ selectedBookingType }}」尚未開始
    </span>
  </template>
  <div class="mt-2">
    <p class="mb-3">
      開放時間：{{ formatScheduleDateTime(nextBatchSchedule.applicationStart) }} 
      ~ {{ formatScheduleDateTime(nextBatchSchedule.applicationEnd) }}
    </p>
    
    <!-- 行事曆/提醒按鈕 -->
    <div class="d-flex flex-wrap ga-2">
      <v-btn 
        size="small" variant="outlined" color="primary"
        prepend-icon="mdi-calendar-plus"
        @click="addToCalendar(nextBatchSchedule)"
      >
        加入 Google 行事曆
      </v-btn>
      <v-btn 
        size="small" variant="outlined" color="primary"
        prepend-icon="mdi-download"
        @click="downloadIcsFile(nextBatchSchedule)"
      >
        下載 .ics 行事曆檔
      </v-btn>
    </div>
  </div>
</v-alert>

<!-- 無任何批次可用提示 -->
<v-alert 
  v-else-if="step === 1 && !isSelectedTypeActive && !nextBatchSchedule"
  type="info" variant="tonal" border="start" prominent
  class="mx-4 mt-4"
  icon="mdi-information-outline"
>
  <template v-slot:title>
    <span class="font-weight-bold">
      「{{ selectedBookingType }}」尚未設定開放時間
    </span>
  </template>
  <p class="mt-2">目前該預約服務尚未安排批次，請洽詢服務人員。</p>
</v-alert>
```

#### 3.4 Step 1 表單隱藏邏輯

修改 Step 1 表單區 (Line 399 的 `<div v-if="step === 1 && !existingBookingInfo">`)：

```html
<!-- 修改前 -->
<div v-if="step === 1 && !existingBookingInfo">

<!-- 修改後：增加 isSelectedTypeActive 條件 -->
<div v-if="step === 1 && !existingBookingInfo && isSelectedTypeActive">
```

其餘 Step 1 欄位（intro 區塊、FAQ、附件、聯絡資訊等）不受影響，照常顯示。

### 四、行事曆/鬧鐘提醒功能

#### 4.1 Google 日曆連結

```javascript
const addToCalendar = (schedule) => {
  const start = parseDateValue(schedule.applicationStart);
  const end = parseDateValue(schedule.applicationEnd);
  if (!start || !end) return;
  
  const title = encodeURIComponent(`${projectConfig.value.name} - ${selectedBookingType.value} 預約開放`);
  const details = encodeURIComponent(`${projectConfig.value.name} ${selectedBookingType.value}預約系統已開放，請把握時間完成預約。`);
  
  // 轉為 Google Calendar 格式 (YYYYMMDDTHHmmssZ)
  const formatGCal = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  
  const url = `https://calendar.google.com/calendar/event?action=TEMPLATE&text=${title}&dates=${formatGCal(start)}/${formatGCal(end)}&details=${details}`;
  
  window.open(url, '_blank');
};
```

#### 4.2 下載 .ics 行事曆檔 (通用日曆/鬧鐘)

```javascript
const downloadIcsFile = (schedule) => {
  const start = parseDateValue(schedule.applicationStart);
  const end = parseDateValue(schedule.applicationEnd);
  if (!start || !end) return;
  
  const formatICS = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AnxiSmart//BookingReminder//ZH',
    'BEGIN:VEVENT',
    `DTSTART:${formatICS(start)}`,
    `DTEND:${formatICS(end)}`,
    `SUMMARY:${projectConfig.value.name} - ${selectedBookingType.value} 預約開放`,
    `DESCRIPTION:${projectConfig.value.name} ${selectedBookingType.value}預約系統已開放，請把握時間完成預約。`,
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',           // 提前 30 分鐘提醒
    'ACTION:DISPLAY',
    `DESCRIPTION:${selectedBookingType.value}預約即將開放！`,
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',              // 提前 1 天提醒
    'ACTION:DISPLAY',
    `DESCRIPTION:明天${selectedBookingType.value}預約將開放`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${selectedBookingType.value}_預約提醒.ics`;
  link.click();
  URL.revokeObjectURL(link.href);
};
```

---

## 📊 影響範圍

### 前端 (`BookingPage.vue`)

| 區域 | 修改類型 | 說明 |
|------|---------|------|
| `allBookingTypes` computed | 新增 | 取得所有服務項目（不過濾開放狀態） |
| `nextBatchSchedule` computed | 新增 | 計算最近的未來批次時段 |
| `isSelectedTypeActive` computed | 新增 | 判斷選取的服務是否開放中 |
| `addToCalendar()` 方法 | 新增 | Google 行事曆添加功能 |
| `downloadIcsFile()` 方法 | 新增 | .ics 行事曆檔產生與下載 |
| `formatScheduleDateTime()` 方法 | 新增 | 格式化時段顯示 |
| Step 0 模板 | 修改 | 移除 `systemStatus.code === 'OPEN'` 條件，改用 `allBookingTypes` |
| Step 1 模板 | 修改 | 新增未開放提示區塊，表單加入 `isSelectedTypeActive` 條件 |

### 後端 (`functions/index.js`)

| 函數 | 修改類型 | 說明 |
|------|---------|------|
| `_handleGetBookingInitialData` | 修改 | 新增回傳 `allBatchSchedules` 欄位 |

---

## 🧪 測試要點

1. **Step 0 顯示** — 確認所有設定的服務項目（無論批次是否開放）都會在 Step 0 顯示
2. **開放中按鈕** — 開放中的服務點擊後正常進入 Step 1 表單
3. **未開放按鈕** — 未開放的服務點擊後進入 Step 1，顯示未開放提示，隱藏表單
4. **時段顯示** — 提示區塊正確顯示最近的未來批次起訖時間
5. **Google 行事曆** — 點擊按鈕正確跳轉 Google Calendar 新增事件
6. **.ics 下載** — 點擊按鈕正確下載 .ics 檔案，含鬧鐘提醒（30分鐘前、1天前）
7. **表單隱藏/顯示** — 批次開放時表單正常顯示，未開放時隱藏
8. **即時切換** — 批次在頁面停留期間變為開放時，提示區塊消失，表單自動出現
9. **多批次情境** — 同一服務有多個批次時，正確找到最近的未來批次

---

## ⚠️ 注意事項

1. **後端部署** — 此功能涉及 `functions/index.js` 修改，完成後需部署：

   ```
   firebase deploy --only "functions:bookingApiRouter"
   ```

2. **相容性** — `allBatchSchedules` 為新增欄位，不影響現有功能（前端有 null check）
3. **時區處理** — 所有時間比對與顯示需統一使用 `Asia/Taipei` 時區
