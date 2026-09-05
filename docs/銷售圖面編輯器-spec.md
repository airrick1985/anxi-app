# 銷售圖面編輯器（Sales Drawing Editor）— 前後端規格

> 需求來源：`docs/local/銷售圖面編輯器.md`
> 建立日期：2026-09-05
> 狀態：確認版（2026-09-05，需求方確認：權限沿用銷控系統；CORS／rules 由實作時協助設定與引導；欄位常數抽共用檔；匯出需含 WebP 與常用圖片格式）
> 相關檔案（既有）：`src/views/SalesControlSystem.vue`（功能選單）、`src/components/PhotoEditor.vue`／`src/views/FloorplanSizingTool.vue`（fabric.js 既有用法）、`src/components/UnitDocumentsPanel.vue`（Storage 直傳先例）、`src/api.js`（quotePlans 前端直寫先例）、`src/utils/canvasCompress.js`
> 參考樣板：[方案編輯器-spec.md](./方案編輯器-spec.md)、[SPEC_UnitDocumentUpload.md](./SPEC_UnitDocumentUpload.md)

---

## 1. 功能概述

在「銷控系統 → 功能」選單新增「銷售圖面」入口。使用者可為建案建立多張**銷售圖面**：上傳一張底圖（全區平面圖、棟別立面、樓層平面等），在底圖上放置由**戶別資料欄位組成的資訊卡**（小表格），並以線段、箭頭、文字、框線加註說明，最後匯出 PNG／PDF 供銷售現場、客戶說明或列印使用。

本質上是一個**針對銷控資料客製的簡易圖片編輯器**：資訊卡的內容來自 `salesHouseholds`，可再手動覆寫（不回寫原始資料），並可整張重新整理同步最新戶別資料。

### 1.1 In scope（v1）

- 圖面列表頁：每建案可建立無限張圖面（新增／改名／複製／刪除／縮圖預覽）。
- 圖面編輯頁：
  - 底圖上傳（PNG／JPG／WebP）、更換底圖。
  - 資訊卡：選戶別 + 勾選欄位 → 產生「項目名稱｜欄位值」兩欄小表格；支援多戶別批次建立；項目名稱／欄位值可手動覆寫；欄寬、列高、整體長寬可拖曳調整；角落把手等比縮放（文字跟隨）。
  - 資訊卡樣式：底色、透明度、邊框粗細／顏色、文字顏色、字級、標題列（戶別名稱）開關與底色、圓角。
  - 線條：直線、單向／雙向箭頭、虛線；粗細、顏色可調；端點可拖曳。
  - 其他標註：自由文字、矩形／橢圓框（可填半透明色，用來圈出區域）。
  - 畫布操作：滾輪縮放、平移、多選、複製貼上、刪除、復原／重做、圖層上下移、鎖定、對齊參考線。
  - 儲存：手動儲存 + 自動儲存（防抖）；離頁未儲存提示；他人更新提示。
  - 匯出：PNG／JPEG／WebP（1x／2x，JPEG／WebP 可調品質）、PDF（A4／A3 橫向）、列印。
- 檢視模式：無編輯操作，供銷售人員在電腦／手機瀏覽與匯出。

### 1.2 Out of scope（v1 不做，列入後續）

- SVG／PDF 作為底圖（fabric 載入 SVG 成本高；先要求轉成點陣圖）。
- 自由畫筆、圖片貼入（logo、示意圖）、旋轉底圖。
- 資訊卡點擊直接開啟戶別資訊 Modal（先做 tooltip 顯示戶別，跳轉銷控留待後續）。
- 多人同時編輯的即時協作（採最後寫入為準 + 他人更新提示，見 §4.9）。
- 依銷售狀態自動變更資訊卡顏色（可作為後續「狀態同步」功能）。
- 新增獨立權限（沿用「銷控系統」權限，見 §2）。
- Cloud Function（v1 全前端直寫 Firestore + Storage 直傳，見 §5）。

---

## 2. 建議與待確認決策（未回覆即採建議預設）

| # | 議題 | 建議預設 | 說明 |
|---|---|---|---|
| 1 | 畫布引擎 | **fabric.js 5.5.2（既有相依）**，資訊卡以自訂 fabric 類別實作 | 專案已在 `PhotoEditor.vue`、`FloorplanSizingTool.vue` 使用；全物件統一在 canvas 內，匯出直接 `toDataURL`，不需 html2canvas 拼合 DOM。 |
| 2 | 儲存格式 | **自訂精簡 schema（§3.3）**，不直接存 fabric `toJSON()` | 與 fabric 版本解耦（未來升 v6 不痛）；資訊卡保留 `unitId + fieldKey` 綁定，才能「重新整理資料」。序列化／反序列化集中於 `drawingSchema.js`。 |
| 3 | 座標系 | 畫布邏輯座標 = **底圖原始像素**，顯示縮放靠 viewportTransform | 匯出解析度等於底圖解析度；所有元素座標不因視窗大小而變。 |
| 4 | 底圖上傳 | 前端先壓縮（最長邊 4000px、JPEG 0.9；PNG 若含透明維持 PNG），以 `uploadBytesResumable` **直傳 Storage** | 比照 `UnitDocumentsPanel.vue`；不走 `handleSalesImageUpload`（base64 callable 10MB 限制且膨脹 33%）。 |
| 5 | 權限 | 有該建案「銷控系統」權限即可檢視＋編輯；超管／系管恆可 | 與「車位平面圖管理」一致；不新增 systemFunctions（省去同步超管授權作業）。若需區分「僅檢視」再加權限。 |
| 6 | 敏感欄位 | 欄位選擇器將「底價／成交價」「買方個資」「匯款帳號」群組預設收合並標示「內部資料」，**不禁止** | 圖面常直接給客戶看，誤放底價風險高；以 UI 警示取代硬限制。匯出時若圖面含內部欄位，匯出前再提示一次。 |
| 7 | 資料綁定 | 資訊卡每列記錄 `fieldKey` 與快照 `label/value`；覆寫的列打 `overridden` 標記；「重新整理資料」只更新未覆寫列 | 滿足「手動修改不影響原始資料」，同時保留同步能力。 |
| 8 | 批次建卡 | 新增資訊卡對話框允許多選戶別，一次建立多張卡（相同欄位／樣式），自動網格排列在可視區 | 全區平面圖標註數十戶時省大量操作；另提供「以此卡片為範本套用到其他戶別」。 |
| 9 | 併發 | 最後寫入為準；開啟時監聽文件，他人更新即顯示橫幅提示重新載入 | 不做編輯鎖，避免鎖未釋放的維運問題。 |
| 10 | 路由參數 | `projectId`（與車位平面圖管理一致） | 銷控主頁用 `projectName`，但功能選單內既有跳轉皆用 `projectId.value`。 |
| 11 | 匯出 PDF | 純前端 `jspdf`（既有相依）把高解析 PNG 放入橫向頁面 | 無需後端 PDF；需要中文字體時因內容已是點陣圖，無字型問題。 |
| 12 | 縮圖 | 儲存時前端產生 480px 寬 JPEG 上傳至同資料夾 `thumb.jpg` 覆蓋 | 列表頁預覽；純前端。 |

**環境項目確認結果（2026-09-05 以 TESTA 帳號實測）**
- Storage **CORS**：底圖以 Firebase 下載網址（`firebasestorage.googleapis.com/...?alt=media&token=`）載入，該端點預設即回應 CORS 標頭，`crossOrigin: 'anonymous'` 載入後可正常匯出，**不需**另外 `gsutil cors set`（§5.3 保留為改用 `storage.googleapis.com` 公開網址時的備案）。
- Storage rules：現行規則已允許 `salesDrawings/{projectId}/{drawingId}/…` 上傳、覆蓋與刪除（實測通過）。
- Firestore rules：現行規則已允許 `salesDrawings` 讀寫（實測通過）。
- 前端在底圖跨域載入失敗時仍會退回非跨域模式顯示，並在狀態列與匯出對話框提示「無法匯出」。

---

## 3. 資料模型

### 3.1 Firestore collection：`salesDrawings`（database：`anxi-app`）

- 一張圖面一份文件，docId 由前端 `doc(collection(db, 'salesDrawings'))` 自動產生。
- **純前端直寫**（比照 `quotePlans`），不經 Cloud Function。
- 查詢僅 `where('projectId', '==', projectId)`，**排序在前端**（依 `updatedAt` desc），避免複合索引靜默失敗。

```js
// salesDrawings/{drawingId}
{
  projectId: 'fuyu1750',
  name: '全區平面圖-A棟標價',          // 同建案內不強制唯一，但新增時預設「新圖面 N」
  baseImage: {
    url: 'https://firebasestorage.googleapis.com/...',  // getDownloadURL
    storagePath: 'salesDrawings/fuyu1750/{drawingId}/base_1757040000000.jpg',
    width: 4000,                       // 壓縮後像素尺寸 = 畫布邏輯尺寸
    height: 2830,
    contentType: 'image/jpeg',
    originalName: '全區平面圖.png',
    size: 1834211
  } | null,                            // 尚未上傳底圖時為 null（允許先建空白圖面，畫布預設 1920×1080 白底）
  thumbnailUrl: 'https://...thumb.jpg?v=1757040000000' | null,
  drawing: { /* §3.3 自訂 schema */ },
  drawingSize: 12873,                  // drawing 序列化後 bytes，供列表顯示與上限檢查
  createdBy: { userKey: '0912xxxxxx', name: '王小明' },
  createdAt: serverTimestamp,
  updatedBy: { userKey: '0912xxxxxx', name: '王小明' },
  updatedAt: serverTimestamp,
  rev: 12                              // 每次儲存 +1，供他人更新偵測與除錯
}
```

**大小限制**：Firestore 單文件 1MB。底圖只存 URL，一張資訊卡約 0.5～1KB，一般圖面遠低於上限。儲存前計算 `drawingSize`，超過 **800KB** 拒絕儲存並提示「圖面元素過多，請拆分圖面」。

### 3.2 Storage 路徑

```
salesDrawings/{projectId}/{drawingId}/base_{timestamp}.{jpg|png}   底圖（更換底圖時上傳新檔，成功後刪除舊檔）
salesDrawings/{projectId}/{drawingId}/thumb.jpg                     縮圖（固定檔名覆蓋，URL 加 ?v=timestamp 破快取）
```

刪除圖面時前端 `deleteObject` 底圖與縮圖後再刪 Firestore 文件（Storage 刪除失敗不阻擋文件刪除，僅 console.warn）。

### 3.3 圖面 schema（`drawing` 欄位）

```js
{
  schemaVersion: 1,
  canvas: {
    width: 4000, height: 2830,          // = baseImage 尺寸；無底圖時為預設值
    background: '#ffffff'               // 無底圖時的底色
  },
  defaults: {                           // 使用者最近一次設定的樣式，作為新元素預設值
    infoCard: { /* InfoCardStyle */ },
    line: { /* LineStyle */ },
    text: { /* TextStyle */ },
    shape: { /* ShapeStyle */ }
  },
  elements: [ /* 依 z-order 由下至上 */
    {
      id: 'el_1757040000000_ab12',      // 前端產生；v-for :key 只綁此 id
      type: 'infoCard',
      x: 1200, y: 860,                  // 左上角（畫布邏輯座標）
      scale: 1,                         // 等比縮放倍率（角落把手），文字隨之縮放
      angle: 0,
      locked: false,
      unitDocId: 'fuyu1750_A1-2F',      // salesHouseholds docId
      unitId: 'A1-2F',
      header: { show: true, text: 'A1-2F', overridden: false },
      rows: [
        { fieldKey: 'area_house_ping', label: '房屋面積(坪)', value: '45.32 坪', labelOverridden: false, valueOverridden: false },
        { fieldKey: 'area_main_ping',  label: '主建物面積',   value: '28.10 坪', labelOverridden: true,  valueOverridden: false },
        { fieldKey: 'price_list_house_total', label: '房屋總價', value: '2,580 萬', labelOverridden: true, valueOverridden: false },
        { fieldKey: null, label: '備註', value: '含車位一個', labelOverridden: true, valueOverridden: true }  // 純手動列（fieldKey null）
      ],
      layout: {
        colWidths: [110, 150],          // [項目欄, 值欄]，未縮放前的邏輯像素
        rowHeights: [28, 28, 28, 40],   // 每列高度；null 表示自動（依內容換行撐高）
        headerHeight: 32,
        showLabelColumn: true,          // false 時只顯示值欄（單欄卡）
        padding: 6
      },
      style: {                          // InfoCardStyle
        fill: '#ffffff', opacity: 0.95,
        stroke: '#333333', strokeWidth: 1.5, borderRadius: 4,
        innerStroke: '#cccccc', innerStrokeWidth: 1,   // 格線
        headerFill: '#1e3a8a', headerTextColor: '#ffffff',
        labelFill: '#f3f4f6', labelTextColor: '#374151',
        valueTextColor: '#111827',
        fontSize: 14, fontFamily: 'Noto Sans TC, Microsoft JhengHei, sans-serif', fontWeight: 'normal',
        labelAlign: 'left', valueAlign: 'right'
      }
    },
    {
      id: 'el_...', type: 'line',
      x1: 1350, y1: 900, x2: 1700, y2: 1120,
      locked: false,
      style: { stroke: '#e11d48', strokeWidth: 3, dash: [12, 8] | null,
               arrowStart: false, arrowEnd: true, arrowSize: 14 }   // LineStyle；直線＝兩端皆 false
    },
    {
      id: 'el_...', type: 'text',
      x: 100, y: 100, width: 300, angle: 0, locked: false,
      text: '面海景觀戶',
      style: { fontSize: 24, fontFamily: '...', fontWeight: 'bold', color: '#111827',
               background: 'rgba(255,255,255,0.8)', padding: 4, align: 'left' }
    },
    {
      id: 'el_...', type: 'shape', shape: 'rect' | 'ellipse',
      x: 0, y: 0, width: 400, height: 300, angle: 0, locked: false,
      style: { fill: 'rgba(59,130,246,0.15)', stroke: '#2563eb', strokeWidth: 2, dash: null, borderRadius: 0 }
    }
  ]
}
```

- 讀取時遇到未知 `type` 或未知欄位一律忽略（向前相容）；`schemaVersion` 升版時在 `drawingSchema.js` 內做 migrate。
- 元素 `id` 為穩定值；**Vue 內任何 `:key` 只綁 id**，不綁座標／文字等會變動的值。

### 3.4 戶別欄位來源

- 將 `SalesControlSystem.vue` 內的 `COLUMN_DEFINITIONS` 與 `UNIT_EXPORT_COMPUTED_COLUMNS` 抽到 **`src/constants/householdColumns.js`** 並由原檔 import（純搬移，不改行為），圖面編輯器與其共用同一份權威定義。
- 欄位選擇器分群（依 key 前綴／清單對應）：

| 群組 | 範例欄位 | 預設 |
|---|---|---|
| 基本 | 棟別、樓層、戶別、物件類型、格局、銷控後台狀態、報價系統狀態 | 展開 |
| 面積 | 房屋／主建物／附屬／共用／露臺／土地持分（坪、m²）、公設比 | 展開 |
| 表價 | 房屋表價、露臺表價、其他附屬表價、房屋總表價、配套價格 | 展開 |
| 內部：底價／成交 | 房屋底價…、房屋成交價、價款比例、配套房屋總價 | 收合 + ⚠ 標示 |
| 內部：買方資料 | 買方姓名、電話、身分證、地址、職業…、介紹人 | 收合 + ⚠ 標示 |
| 內部：付款／銀行 | 小訂／補足／簽約日期與金額、各匯款帳號 | 收合 + ⚠ 標示 |
| 其他 | 銷售人員、合約方式、是否首購、興建方式、備註、文字標籤、可選方案 | 收合 |
| 計算欄位 | `UNIT_EXPORT_COMPUTED_COLUMNS` 內容 | 收合 |

- 排除不適合顯示的欄位：`salespersonUserKey`、`salesImages`、`svgName`、`driveFolderUrl`、`contractDrawingFolderUrl`、`unitTags_bgColor`、`unitTags_textColor`。

### 3.5 欄位值格式化（`src/utils/salesDrawing/fieldFormat.js`）

插入時依規則產生 `value` 字串（之後可手動覆寫）：

| 欄位類型 | 判斷 | 格式 |
|---|---|---|
| 面積（坪） | key 以 `_ping` 結尾 | 小數 2 位 + ` 坪` |
| 面積（m²） | key 以 `_sqm` 結尾 | 小數 2 位 + ` m²` |
| 比例 | `common_area_ratio`、`land_share_ratio`、`*Ratio` | 小數 2 位 + ` %`（依原值是否已為百分比判斷，比照 `UnitDataExportDialog` 匯出邏輯） |
| 價格 | key 以 `price_` 開頭 | 千分位 + ` 萬`（依銷控頁 `priceDisplayMode`；插入對話框提供「萬／元」切換） |
| 金額 | `payment_*_amount` | 千分位 + ` 元` |
| 日期 | `*_date`、`buyerDateOfBirth` | `YYYY/MM/DD`（台灣時間） |
| 布林 | `isPreferredPayment`、`isFirstTimeBuyer`、`buyerHasPurchasedFuyu` | `是`／`否` |
| 陣列 | `salesperson`、`unitTags_text`、`availablePlans` | 以 `、` 連接（`salesperson` 需容忍字串與陣列；`availablePlans` id→名稱） |
| 其他 | — | `String(value ?? '')` |

- 預設 `label` 取欄位 `title`，但面積／價格欄位提供**簡短標籤**對照（如「房屋面積(坪)」→「房屋面積」、「房屋總表價」→「房屋總價」），可在對話框「使用簡短名稱」切換，預設開啟。

---

## 4. 前端規格

### 4.1 路由與入口

```js
// src/router/index.js
{
  path: '/sales-drawings/:projectId',
  name: 'SalesDrawingList',
  component: () => import('@/views/SalesDrawingList.vue'),
  props: true,
  meta: { requiresAuth: true, requiredSystem: '銷控系統', layout: DefaultLayout, title: '銷售圖面' }
},
{
  path: '/sales-drawings/:projectId/:drawingId',
  name: 'SalesDrawingEditor',
  component: () => import('@/views/SalesDrawingEditor.vue'),
  props: true,
  meta: { requiresAuth: true, requiredSystem: '銷控系統', layout: DefaultLayout, title: '銷售圖面編輯器' }
  // query: ?mode=view 進入檢視模式
}
```

- `SalesControlSystem.vue` 功能選單：**電腦版 `desktopToolGroups` 與手機版 `moreToolGroups` 的「常用」群組**，在「車位銷控」之後新增
  `{ icon: 'mdi-map-marker-multiple-outline', label: '銷售圖面', action: goToSalesDrawings }`，僅 `currentViewMode === 'sales'` 顯示（報價模式不顯示）。
- 同時在「更多設定」（`SalesSettings.vue`）若有功能導覽清單則加入同名入口（非必要）。

### 4.2 圖面列表頁 `src/views/SalesDrawingList.vue`

- 標題列：建案名稱、「新增圖面」按鈕、返回銷控。
- 卡片網格：縮圖（無底圖顯示佔位圖）、名稱、最後更新（台灣時間）與更新者、元素數量。
- 卡片操作：開啟編輯、檢視、改名（inline）、複製（複製 Firestore 文件與 `drawing`，底圖 URL 沿用同一檔案不重複上傳；複製品更換底圖時才寫入自己的資料夾）、刪除（confirm，同步刪 Storage）。
- 監聽：`listenToSalesDrawings(projectId)`（onSnapshot + 前端排序）。
- 新增流程：建立空白文件（`baseImage: null`）→ 直接進入編輯頁 → 編輯頁偵測無底圖時自動開啟「上傳底圖」對話框（可跳過，使用白底畫布）。

### 4.3 編輯頁版面 `src/views/SalesDrawingEditor.vue`

電腦版（主要使用情境）：

```
┌ 頂部列：← 返回｜圖面名稱(可改)｜儲存狀態(已儲存/未儲存/儲存中)｜復原 重做｜縮放 - 100% + 適應｜匯出 ▾｜儲存 ┐
├ 左側工具列 (56px) ┬ 畫布區（深灰底、置中、滾輪縮放、空白鍵/中鍵拖曳平移） ┬ 右側面板 (320px) ┤
│ 選取 / 平移        │                                                        │ [屬性] [圖層]      │
│ 資訊卡 +           │                                                        │ 依選取物件顯示     │
│ 文字               │                                                        │ 樣式編輯欄位       │
│ 直線 / 箭頭 / 虛線 │                                                        │                    │
│ 矩形 / 橢圓        │                                                        │                    │
│ 底圖 (上傳/更換)   │                                                        │                    │
└────────────────────┴────────────────────────────────────────────────────────┴────────────────────┘
底部狀態列：畫布尺寸、游標座標、元素數、最後儲存時間
```

- 依專案慣例「左項目右內容」：左側為工具／圖層，右側為屬性內容。
- 手機／平板：工具列收成底部 bottom-sheet；右側面板改為由下方彈出；支援單指拖曳物件、雙指縮放畫布。手機定位為「檢視＋微調」，複雜編輯提示使用電腦。
- 檢視模式（`?mode=view` 或無編輯權限）：隱藏工具列與屬性面板，只保留縮放／匯出；點資訊卡顯示 tooltip（戶別＋目前銷售狀態）。

### 4.4 底圖

- 上傳對話框：拖放或選檔；接受 `image/png, image/jpeg, image/webp`，原檔上限 30MB。
- 前端處理：`createImageBitmap` → 最長邊 > 4000px 等比縮小；JPEG/WebP 轉 JPEG 0.9；PNG 保留 PNG（透明底圖需求）。取得尺寸後寫入 `baseImage.width/height`。
- 上傳：`uploadBytesResumable` 至 §3.2 路徑，顯示進度；完成 `getDownloadURL` 後更新文件。
- 載入畫布：`fabric.Image.fromURL(url, cb, { crossOrigin: 'anonymous' })` 設為 `backgroundImage`，`canvas.setDimensions({ width, height })` 為邏輯尺寸，再 `zoomToFit`。
- 更換底圖：若新底圖尺寸不同，提示「元素位置將依比例換算 / 保持原座標」二選一（預設依比例換算）。

### 4.5 資訊卡（核心）

#### 4.5.1 建立：`InfoCardDialog.vue`

1. **選戶別**：`v-autocomplete` 多選，資料來源 `salesDataStore.getProjectData(projectId).households`（進頁面時 `loadProjectData`），可依棟別／樓層篩選、關鍵字搜尋。顯示「戶別｜狀態」。
2. **選欄位**：分群勾選（§3.4），已勾選欄位列在右側可拖曳排序（vuedraggable，`:key="fieldKey"`）。提供「常用組合」快速套用：面積組（房屋面積、主建物、附屬、公設比）、價格組（房屋總價、露臺表價、配套價格）；「記住此組合」存 localStorage（依建案）。
3. 選項：顯示標題列（戶別名）、顯示項目欄、價格單位（萬／元）、使用簡短名稱。
4. 預覽：右側即時渲染第一戶的卡片外觀（套用 `defaults.infoCard`）。
5. 「插入」：單戶 → 放在目前視窗中央；多戶 → 依戶別排序以網格自動排列於可視區（間距 24px），之後由使用者拖到位置。

#### 4.5.2 渲染：自訂 fabric 類別 `InfoCard`（`src/utils/salesDrawing/fabricInfoCard.js`）

- `fabric.util.createClass(fabric.Object, { type: 'infoCard', ... })`，自行實作 `_render(ctx)`：
  - 依 `layout.colWidths / rowHeights / headerHeight` 畫背景（圓角矩形）、標題列、格線、文字。
  - 文字以 `ctx.measureText` 依欄寬自動換行；`rowHeights[i] === null` 的列以內容高度自動撐開（含 padding）。
  - `width = sum(colWidths)`，`height = header + sum(rowHeights)`；`scaleX = scaleY = scale`。
- 序列化：`toObject()` 擴充上述自訂屬性；`drawingSchema.js` 負責 element ↔ fabric object 轉換（不依賴 fabric 的 `toJSON/loadFromJSON`）。
- 效能：文字量測結果快取於物件內（layout 或文字變更時失效）；100 張卡片內互動需維持順暢。

#### 4.5.3 縮放與調整行為

| 操作 | 把手 | 行為 |
|---|---|---|
| 等比縮放 | 四角 | 修改 `scale`（`scalingEqually`），文字隨比例縮放。 |
| 調整整體寬 | 左右邊中點 | 自訂 `actionHandler`：改總寬，差值**依比例分配到各欄** `colWidths`；文字大小不變，內容重新換行。 |
| 調整整體高 | 上下邊中點 | 改總高，差值依比例分配到 `rowHeights`（自動列先轉為固定值）。 |
| 調整單一欄寬 | 欄分界把手（選取時顯示於卡片頂緣上方 12px 的小三角） | 拖曳改 `colWidths[0]`，`colWidths[1]` 反向補償（總寬不變）；按住 Shift 則總寬跟著變。 |
| 調整單一列高 | 列分界把手（選取時顯示於卡片左緣外側） | 改該列 `rowHeights[i]`（設為固定值）。 |
| 旋轉 | 旋轉把手 | 允許（少用），`angle`。 |
| 重設 | 屬性面板「重設格線」 | `rowHeights` 全設 `null`、`colWidths` 恢復自動（依內容最寬值）。 |

- 分界把手以 `fabric.Control` 實作，僅在物件被單選時 `visible`，多選時隱藏。
- 最小值：欄寬 ≥ 40、列高 ≥ 18、`scale` 介於 0.2～5。

#### 4.5.4 內容編輯

- 雙擊卡片，或屬性面板「編輯內容」：面板內顯示列表（標題列 + 每列 label / value 兩個輸入框），修改即時反映；修改過的列顯示「已覆寫」標記與「還原」按鈕（還原 = 重新依戶別資料格式化）。
- 列操作：拖曳排序、刪除列、新增手動列（`fieldKey: null`）、從欄位清單追加列。
- 「重新整理資料」（單卡／全圖面）：以 `salesDataStore` 最新資料重算所有 `valueOverridden === false` 的值與 `labelOverridden === false` 的標籤；戶別已不存在時該卡標記「⚠ 戶別已移除」不刪除。
- 「以此卡為範本套用到其他戶別」：開 `InfoCardDialog` 預帶欄位／選項／樣式／layout，只選戶別。

#### 4.5.5 樣式（右側屬性面板）

- 底色 + 透明度、邊框顏色／粗細、圓角、格線顏色／粗細、標題列底色／文字色、項目欄底色／文字色、值欄文字色、字級、粗體、對齊。
- 顏色選擇器：Vuetify `v-color-picker`（swatches 模式 + 自訂），並列出「本圖面已使用顏色」快速套用。
- 「設為預設」：寫入 `drawing.defaults.infoCard`，之後新卡沿用；「套用到所有資訊卡」：一鍵統一樣式（不動 layout）。
- 多選多張卡時面板可批次改樣式。

### 4.6 線條／箭頭

- 工具：直線、箭頭（單向）、雙向箭頭、虛線（可與箭頭疊加）。
- 繪製：按下拖曳放開建立；按住 Shift 鎖定 0／45／90 度。
- 自訂 fabric 類別 `Arrow`（`src/utils/salesDrawing/fabricArrow.js`）：以 `x1,y1,x2,y2` 描述，自行 `_render` 線身＋箭頭（三角形，尺寸 = `arrowSize`，隨 `strokeWidth` 有下限）；兩端各一個自訂 `fabric.Control` 可直接拖端點（不採用 Line+Triangle Group，Group 無法直觀調整端點）。
- 樣式面板：顏色、粗細（1～16）、線型（實線／虛線／點線，對應 `dash`）、起點／終點箭頭開關、箭頭大小。
- 不做曲線／多段折線（後續）。

### 4.7 文字與形狀

- 文字：`fabric.Textbox`（可換行、雙擊直接編輯）；樣式：字級、粗體、顏色、背景色、對齊。
- 矩形／橢圓：`fabric.Rect / Ellipse`；樣式：填色（含透明度）、邊框顏色／粗細／線型、圓角（矩形）。

### 4.8 畫布通用操作與快捷鍵

| 操作 | 方式 |
|---|---|
| 縮放 | 滾輪（以游標為中心 `zoomToPoint`，10%～800%）、頂部 +/-、`Ctrl+0` 適應視窗、`Ctrl+1` 100% |
| 平移 | 空白鍵 + 拖曳、滑鼠中鍵、平移工具、雙指（觸控） |
| 選取 | 點選、框選（選取工具）、`Ctrl+A` |
| 複製／貼上 | `Ctrl+C / Ctrl+V`（貼上偏移 20px，產生新 id）、`Ctrl+D` 複製 |
| 刪除 | `Delete / Backspace`（文字編輯中除外） |
| 復原／重做 | `Ctrl+Z / Ctrl+Y`，歷史上限 50 步（以 schema 快照 diff 儲存） |
| 圖層 | 右鍵選單／面板：上移、下移、置頂、置底 |
| 鎖定 | 面板鎖定圖示；鎖定物件不可選取移動，圖層面板可解鎖 |
| 微移 | 方向鍵 1px，Shift+方向鍵 10px |
| 對齊 | 拖曳時顯示與其他物件邊／中線的對齊參考線（吸附 ±4px），可於設定關閉 |
| 取消 | `Esc` 取消目前繪製／取消選取 |

- 圖層面板列出所有元素（名稱：資訊卡顯示戶別、文字顯示前 10 字、其他顯示類型），點選即選取、可拖曳排序、眼睛圖示切換顯示（`hidden` 僅編輯時暫隱，不存檔）。

### 4.9 儲存與同步

- 儲存觸發：手動「儲存」、`Ctrl+S`、自動儲存（元素異動後 **3 秒防抖**，可於設定關閉）。
- 寫入：`updateDoc(salesDrawings/{id}, { drawing, drawingSize, thumbnailUrl, updatedBy, updatedAt: serverTimestamp(), rev: increment(1) })`；縮圖每次儲存以 `canvas.toDataURL({ multiplier: 480 / width })` 產生後上傳（失敗不影響儲存）。
- 離開頁面：未儲存變更時 `onBeforeRouteLeave` + `beforeunload` 提示。
- 他人更新：頁面對本文件 `onSnapshot`；當遠端 `rev` 大於本地 rev 且 `updatedBy.userKey ≠ 自己` → 顯示橫幅「王小明 於 14:32 更新了此圖面」，提供「載入最新（放棄本地變更）」／「忽略（繼續編輯，儲存時將覆蓋）」。
- 儲存失敗（網路／權限）：toast 錯誤並保留未儲存狀態，自動儲存退避 30 秒後重試一次。

### 4.10 匯出

- 圖片：PNG／JPEG／WebP 三種格式，解析度 1x／2x，JPEG／WebP 品質預設 0.92 可調。以 `canvas.toDataURL({ format, quality, multiplier })` 產生（WebP 由瀏覽器 `canvas.toBlob('image/webp')` 支援，Safari 16 以下不支援時選項停用並提示）；匯出前 `discardActiveObject`、暫時隱藏參考線與把手；檔名 `{建案名}_{圖面名}_{YYYYMMDD}.{png|jpg|webp}`。JPEG 無透明，無底圖的白底畫布先鋪白色。
- PDF：以 2x PNG 放入 `jspdf` 橫向 A4／A3（依底圖比例自動 fit，留 10mm 邊）；`jspdf` 動態 `import()`。
- 列印：開新視窗放入 PNG 呼叫 `window.print()`。
- 匯出前檢查：圖面含 §3.4「內部」群組欄位時提示「此圖面含內部資料欄位（底價／買方資料），確定匯出？」。
- 檢視模式同樣可匯出。

### 4.11 新增／修改檔案清單

| 檔案 | 說明 |
|---|---|
| `src/constants/householdColumns.js` | 新增：自 `SalesControlSystem.vue` 搬出 `COLUMN_DEFINITIONS`、`UNIT_EXPORT_COMPUTED_COLUMNS`，並新增分群／排除／簡短標籤對照 |
| `src/views/SalesControlSystem.vue` | 改 import 欄位常數；功能選單新增「銷售圖面」（電腦版＋手機版） |
| `src/router/index.js` | 新增兩條路由 |
| `src/views/SalesDrawingList.vue` | 新增：列表頁 |
| `src/views/SalesDrawingEditor.vue` | 新增：編輯頁（版面、工具狀態、快捷鍵、儲存流程） |
| `src/components/salesDrawing/DrawingToolbar.vue` | 新增：左側工具列 |
| `src/components/salesDrawing/DrawingPropertyPanel.vue` | 新增：右側屬性／圖層面板 |
| `src/components/salesDrawing/InfoCardDialog.vue` | 新增：選戶別＋欄位對話框 |
| `src/components/salesDrawing/BaseImageDialog.vue` | 新增：底圖上傳／更換 |
| `src/components/salesDrawing/ExportMenu.vue` | 新增：匯出選單 |
| `src/composables/useDrawingCanvas.js` | 新增：fabric canvas 生命週期、縮放平移、選取、歷史（undo/redo）、對齊線 |
| `src/utils/salesDrawing/fabricInfoCard.js` | 新增：InfoCard 自訂類別與把手 |
| `src/utils/salesDrawing/fabricArrow.js` | 新增：Arrow 自訂類別與端點把手 |
| `src/utils/salesDrawing/drawingSchema.js` | 新增：schema ↔ fabric 轉換、驗證、migrate、size 計算 |
| `src/utils/salesDrawing/fieldFormat.js` | 新增：欄位值格式化與簡短標籤 |
| `src/utils/salesDrawing/exportDrawing.js` | 新增：PNG／PDF／列印 |
| `src/api.js` | 新增 `salesDrawings` API 區塊：`listenToSalesDrawings`、`getSalesDrawing`、`createSalesDrawing`、`updateSalesDrawing`、`duplicateSalesDrawing`、`deleteSalesDrawing`、`uploadSalesDrawingImage`（含縮圖） |
| `CHANGELOG.md` | 發版前依 commit-notes 流程補更新資訊 |

- 自訂 fabric 類別的樣式若透過 `defineComponent + h()` 內嵌，CSS 需放非 scoped 區塊並加根 class 前綴（專案既有慣例）。
- 編輯頁重型相依（fabric、jspdf）皆動態 `import()`，不影響銷控主頁載入。

---

## 5. 後端規格

v1 **不新增 Cloud Function**：資料量小、無需伺服器端運算，讀寫全部由前端直接操作 Firestore／Storage（比照 `quotePlans`、`UnitDocumentsPanel` 直傳模式）。以下為需部署／設定的後端項目。

### 5.1 Firestore rules（`anxi-app` database，於 Console 或 rules 檔加入）

```
match /salesDrawings/{drawingId} {
  allow read, write: if request.auth != null;   // 依專案現行 rules 慣例調整（若現行為開放規則則比照）
}
```

- 若後續要限制「只有該建案有銷控系統權限者可寫」，需改為 Cloud Function 代理（見 §5.4 備援）。

### 5.2 Storage rules

```
match /salesDrawings/{projectId}/{drawingId}/{fileName} {
  allow read: if true;                                   // 圖面底圖需公開可讀（匯出／檢視）
  allow write: if request.resource == null               // 刪除
               || (request.resource.size < 30 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*'));
}
```

- 與 `UnitDocumentsPanel` 暫存路徑一樣，實際 rules 需人工在 Console 確認並部署。

### 5.3 Storage CORS（實測不需設定；僅在改用 `storage.googleapis.com` 公開網址時才需要）

`cors.json`：
```json
[{ "origin": ["https://<hosting-domain>", "http://localhost:5173"],
   "method": ["GET"], "maxAgeSeconds": 3600,
   "responseHeader": ["Content-Type"] }]
```
```
gsutil cors set cors.json gs://<bucket-name>
```
- 前端載入底圖必須帶 `crossOrigin: 'anonymous'`；缺 CORS 時 `toDataURL` 會拋 SecurityError。前端在底圖載入失敗時顯示明確錯誤「底圖跨域設定未完成，請聯絡管理員」，並允許以「僅檢視、不可匯出」模式繼續（不帶 crossOrigin 重新載入）。

### 5.4 備援方案：Cloud Function `salesDrawingApi`（v1 不實作，保留設計）

若日後需要伺服器端權限檢查、Drive 匯出或縮圖統一產生，新增 callable `salesDrawingApi`（`region: asia-east1`、**memory 512MB**、`FUNCTIONS_DISCOVERY_TIMEOUT=120` 部署）：

| action | 用途 |
|---|---|
| `save` | 驗證使用者對 `projectId` 的銷控權限後寫入 `drawing`（並檢查大小） |
| `delete` | 刪除文件與 Storage 資料夾 |
| `exportToDrive` | 前端傳 PNG → 存至建案 Drive 資料夾 |
| `thumbnail` | 以 sharp 由底圖產生縮圖（取代前端產生） |

### 5.5 Firestore 索引

- 查詢僅單一 `where('projectId')`，不需複合索引；排序於前端。

---

## 6. 實作步驟（建議順序）

1. 搬移欄位常數至 `constants/householdColumns.js`，`SalesControlSystem.vue` 改 import（回歸測試銷控頁匯出／透視正常）。
2. `api.js` salesDrawings CRUD + 上傳；`SalesDrawingList.vue`；路由；功能選單入口。
3. `useDrawingCanvas.js` + `SalesDrawingEditor.vue` 骨架：底圖載入、縮放平移、選取、刪除、儲存／自動儲存、離頁提示。
4. `fabricInfoCard.js` + `InfoCardDialog.vue` + `fieldFormat.js`：建卡、拖曳、等比縮放、內容覆寫。
5. 欄寬／列高把手、邊中點非等比調整、屬性面板樣式編輯、批次建卡、重新整理資料。
6. `fabricArrow.js`、文字、形狀、圖層面板、undo/redo、快捷鍵、對齊線。
7. 匯出 PNG／PDF／列印、縮圖、他人更新提示、檢視模式、手機版收斂。
8. Storage rules／CORS／Firestore rules 部署確認；CHANGELOG；發版。

---

## 7. 驗收條件

- [ ] 從銷控系統「功能 → 銷售圖面」可進入列表，建立圖面並上傳 10MB PNG 底圖，畫布顯示完整且可縮放平移。
- [ ] 新增資訊卡：選 3 戶 × 4 欄位一次建立 3 張卡；值格式正確（坪 2 位小數、價格千分位＋萬）。
- [ ] 卡片可拖曳到任意位置；角落把手等比縮放且文字跟著變大；邊中點拉寬時文字大小不變、內容重新換行；欄分界把手可改欄寬；列分界可改列高。
- [ ] 手動改「房屋總價」的 label 與 value 後，`salesHouseholds` 原資料不變；「重新整理資料」只更新未覆寫列。
- [ ] 資訊卡底色／邊框粗細顏色／文字顏色可改並即時反映；「設為預設」後新卡沿用。
- [ ] 可畫直線、單向／雙向箭頭、虛線；粗細顏色可改；可拖端點；Shift 鎖角度。
- [ ] `Ctrl+Z / Ctrl+Y` 可復原重做至少 20 步；複製貼上、刪除、圖層順序正常。
- [ ] 儲存後重新整理頁面，所有元素位置、樣式、覆寫內容完整還原；Firestore 文件 `drawingSize` 正確。
- [ ] 另一帳號修改同一圖面後，本頁出現更新橫幅。
- [ ] 匯出 PNG（2x）與 PDF 內容與畫布一致，無把手／參考線；含底價欄位時匯出前有提示。
- [ ] 檢視模式無法移動元素，可縮放與匯出；手機可開啟檢視。
- [ ] 刪除圖面後 Storage 底圖與縮圖一併移除。
- [ ] 銷控頁匯出 Excel／資料透視／指定戶別下載（依賴搬移後的欄位常數）行為不變。

---

## 8. 實作紀錄（2026-09-05）

- 已依 §4.11 檔案清單實作完成；`vite build` 與 `vue-tsc --noEmit` 通過。
- 自動化煙霧測試：`scripts/smokeSalesDrawing.mjs`（puppeteer，TESTA 帳號）。流程：列表 → 新增圖面 → 上傳底圖 → 批次插入 3 張資訊卡（含內部欄位） → 面板覆寫標籤 → 拖曳／角落縮放／欄分界／邊中點拉寬 → 箭頭／矩形／虛線／文字 → 箭頭端點拖曳 → 快捷鍵（工具切換、Delete、Ctrl+Z/Y/D） → 儲存 → 匯出 WebP → 重新載入驗證持久化與 CORS 匯出 → 檢視模式 → 刪除測試圖面。全部通過。
- 注意：此環境的 puppeteer 實體滑鼠／鍵盤事件不會送達頁面（連一般按鈕都點不到），測試以合成 `MouseEvent`／`KeyboardEvent` 驅動；編輯頁在 DEV 模式掛載 `window.__drawingApi` 供自動化取用。
- 已知：直接重新整理編輯頁（deep link）時，既有路由守衛可能先跳「無法驗證建案權限」（與車位銷控等 `projectId` 路由相同的既有行為），非本功能新增問題。

## 9. 風險與注意事項

- **CORS 未設定**是最可能卡住匯出的環境問題，實作初期就要先在測試環境驗證 `toDataURL`。
- fabric 5 自訂類別需正確實作 `toObject / fromObject` 與 `_set` 觸發 `dirty`，否則變更後不重繪或複製失敗。
- 底圖超大（8000px 以上）時 canvas 記憶體壓力大，統一在上傳時縮到 4000px；匯出 2x 時對大底圖改為 1.5x 並提示。
- `:key` 一律綁元素 id；資訊卡列表輸入框若綁到值會在輸入時重掛載失焦（專案已踩坑）。
- 自動儲存與 undo 互動：儲存不清空歷史；載入他人版本才清空。
- 資訊卡數量很多時（>150）文字量測成本高，需快取量測結果並在 `object:moving` 期間跳過重排。
