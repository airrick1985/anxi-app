# SPEC：戶別土地標的清冊

## 1. 目標
在 `salesHouseholds` 集合每一戶新增「土地標的清冊」明細欄位，支援一戶 N 筆土地資料（縣市 / 區域 / 段小段 / 地號 / 面積 / 權利範圍 / 使用分區），並在 UnitDetailModal 提供預設收合的檢視與編輯介面，同時擴充 Excel 匯入/匯出以支援此結構。

## 2. 範圍

### In scope
- `salesHouseholds` 文件新增 `landParcels: []` 內嵌陣列
- UnitDetailModal 於「土地持分資訊」區塊下新增「土地標的清冊」折疊面板（預設收合、可檢視/編輯）
- 戶別資料 Excel 匯出新增第二工作表「土地標的清冊」
- 戶別資料 Excel 匯入支援讀取第二工作表並合併至 `landParcels`
- 縣市 / 區域 / 段小段三層級聯下拉（使用既有 `useLandSections` + `landOfficeCodeTable`）
- 段小段靜態資料產生腳本整合至建置流程

### Out of scope
- `land_share_ping` / `land_share_sqm` / `land_share_ratio` 既有彙總欄位的自動加總（**維持手動輸入**）
- 實價登錄 JSON 匯出邏輯整合（可於後續 SPEC 擴充）
- 土地標的清冊的獨立查詢 / 統計報表
- 歷史版本追蹤

## 3. 資料模型（Firestore）

### 3.1 文件路徑
沿用既有：`salesHouseholds/{docId}`，不新建子集合、不新建平行 collection。

### 3.2 新增欄位
```js
salesHouseholds/{docId} = {
  // ── 既有欄位完全保留 ──
  projectId, unitId,
  land_share_ping, land_share_sqm, land_share_ratio,  // 彙總（使用者手動輸入）
  ...,

  // ── 新增欄位 ──
  landParcels: [
    {
      id: string,                  // 本地唯一 ID（如 'lp_1714987654321_ab3'，用於 v-for key 與編輯列定位）
      city: string,                // 縣市名稱，例：'臺北市'
      cityCode: string,            // 縣市代碼，例：'A'
      district: string,            // 區域名稱，例：'中正區'
      districtCode: string,        // 鄉鎮代碼（2 碼），例：'01'
      section: string,             // 段小段完整名稱，例：'繼光段一小段'
      sectionCode: string,         // 段代碼（4 碼），例：'0001'
      parcelNumber: string,        // 地號，例：'123-4'
      landAreaSqm: number | null,  // 土地面積（m²）
      rightsType: string,          // 權利範圍類型：'分別共有' | '全部' | '公同共有' | ''
      rightsNumerator: number | null,    // 權利範圍分子
      rightsDenominator: number | null,  // 權利範圍分母
      zoneCategory: string,        // 次類別名稱：'住' | '商' | '公' | '農' | '其他' | ''
      zoneText: string             // 都市土地使用分區（自由文字），例：'第三種住宅區'
    }
  ]
}
```

### 3.3 預設值與相容性
- 既有文件無 `landParcels` 欄位 → 前端 / 匯出一律視為 `[]`
- 未填值欄位統一存 `''`（字串）或 `null`（數字），**不存 `undefined`**
- 選填：**所有欄位皆允許留空**，不做必填驗證（依使用者確認）

### 3.4 權限
沿用既有 `salesHouseholds` 規則，不額外設置（依使用者確認）。

## 4. UI 設計（UnitDetailModal.vue）

### 4.1 顯示位置
在現有土地持分資訊區塊（[UnitDetailModal.vue:193-210](src/components/UnitDetailModal.vue#L193-L210)）下方，新增第二個 `area-group`：

```
┌─ 土地持分資訊 ─────────────────┐
│  項目            坪數    m²    │
│  土地持分面積    12.34   40.81 │
├───────────────────────────────┤
│ ▸ 土地標的清冊（3 筆）         │  ← 預設收合
└───────────────────────────────┘
```

### 4.2 折疊面板
- 使用 `v-expansion-panels`，`v-model` 預設為 `[]`（收合）
- 標題：`土地標的清冊（{{ landParcels.length }} 筆）`
- 標題右側標籤：
  - 檢視模式：無額外按鈕
  - 編輯模式：`+ 新增土地` 按鈕

### 4.3 檢視模式（read-only）
桌面：橫向緊湊表格；手機：卡片堆疊。

表頭：`#` | `縣市` | `區域` | `段小段` | `地號` | `面積(m²)` | `權利範圍` | `分區`

- 權利範圍顯示：`{分子}/{分母}`，並於右側灰字顯示百分比（例：`10000/100000 (10.00%)`）
- 權利範圍類型 = `全部` → 顯示「全部」
- 缺值欄位顯示 `—`

### 4.4 編輯模式（行內編輯）
每列為一 `v-row`，欄位：

| 欄位 | 控件 | 備註 |
|---|---|---|
| 縣市 | `v-select` | 來源：`CITIES`（22 項） |
| 區域 | `v-select` | 來源：`TOWNS.filter(cityCode)`，選縣市時清空 |
| 段小段 | `v-autocomplete` | 來源：`useLandSections(cityCode, districtCode)`，支援搜尋；選區域時清空 |
| 地號 | `v-text-field` | 自由文字（允許 `123-4` 格式） |
| 土地面積(m²) | `v-text-field` type=number | 2 位小數 |
| 權利範圍類型 | `v-select` | 選項：`['分別共有', '全部', '公同共有']` |
| 權利範圍(分子) | `v-text-field` type=number | 類型=`全部`時自動鎖定為 1 |
| 權利範圍(分母) | `v-text-field` type=number | 類型=`全部`時自動鎖定為 1 |
| 次類別名稱 | `v-select` | 選項：`['住', '商', '公', '農', '其他']` |
| 都市土地使用分區 | `v-text-field` | 自由文字 |
| 刪除 | `v-btn icon="mdi-delete"` | 二次確認 |

### 4.5 聯動邏輯
- 選縣市 → 區域、段小段、`cityCode` 同步更新；清空 `district/districtCode/section/sectionCode`
- 選區域 → 觸發 `fetchLandSections(cityCode, districtCode)`；清空 `section/sectionCode`
- 權利範圍類型 = `全部` → 自動設 `rightsNumerator: 1, rightsDenominator: 1` 並 disable 輸入

### 4.6 儲存流程
- 沿用既有 `executeSaveChanges()`（[UnitDetailModal.vue:1218-1261](src/components/UnitDetailModal.vue#L1218-L1261)）
- `editingData.landParcels` 直接併入 `updateSalesData()` payload 的 `data` 物件
- Cloud Function `updateSalesData` **無需修改**（當作一般欄位寫入）

## 5. Excel 匯入/匯出

### 5.1 匯出（雙工作表）

**Sheet 1：`戶別資料`** — 既有結構 100% 不變（向後相容）

**Sheet 2：`土地標的清冊`** — 新增

| 欄位順序 | 標題 | 來源 key |
|---|---|---|
| 1 | 戶別編號 | `parcel.unitId`（join key） |
| 2 | 縣市 | `parcel.city` |
| 3 | 區域 | `parcel.district` |
| 4 | 段小段 | `parcel.section` |
| 5 | 地號 | `parcel.parcelNumber` |
| 6 | 土地面積(m²) | `parcel.landAreaSqm` |
| 7 | 權利範圍類型 | `parcel.rightsType` |
| 8 | 權利範圍(分子) | `parcel.rightsNumerator` |
| 9 | 權利範圍(分母) | `parcel.rightsDenominator` |
| 10 | 次類別名稱 | `parcel.zoneCategory` |
| 11 | 都市土地使用分區 | `parcel.zoneText` |

規則：
- 每一筆 `landParcel` 對應一列；一戶 N 筆 = 該 `unitId` 出現 N 次
- 無土地資料的戶別不出現在 Sheet 2
- 戶別在 Sheet 1 出現、Sheet 2 不出現 → 視為該戶 `landParcels: []`
- 第 1 行：灰色標頭列；第 2+ 行：資料列（不需紅色警告列，保持簡潔）
- 欄位代碼常數集中於 `src/constants/landParcelColumns.js`（新建），同時給匯入/匯出使用

### 5.2 匯入（整批驗證）

**流程**：
1. 讀取兩個 Sheet
2. 解析 Sheet 1 → 戶別主檔 `Map<unitId, householdData>`
3. 解析 Sheet 2 → 依 `unitId` 分組成 `Map<unitId, landParcel[]>`
4. **交叉驗證（任一失敗 → 整批拒絕，依使用者確認）**：
   - Sheet 2 每一列的 `unitId` 必須存在於 Sheet 1
   - Sheet 2 標頭必須與規格完全一致
   - 數值欄位必須可解析為數字或留空（文字值例如 `"N/A"` → 報錯）
   - 權利範圍類型必須為 `['分別共有', '全部', '公同共有', '']` 其中之一
   - 次類別名稱必須為 `['住', '商', '公', '農', '其他', '']` 其中之一
5. 驗證通過 → 將 `landParcels` 合併進各戶資料 → 呼叫 `uploadHouseholds`

**錯誤訊息格式**（Snackbar / 對話框）：
```
土地標的清冊匯入失敗：
- 第 5 列：戶別「A1-3F」不存在於戶別資料工作表
- 第 12 列：權利範圍類型「共同共有」不是合法值（應為 分別共有 / 全部 / 公同共有）
- 第 18 列：土地面積(m²) 欄位值「N/A」無法解析為數字
整批拒絕，請修正後重新上傳。
```

**`id` 產生**：匯入時由前端以 `lp_{timestamp}_{random}` 重新產生（不來自 Excel）。

### 5.3 Cloud Function 變更

**`uploadHouseholds`**（[functions/index.js:1119](functions/index.js#L1119)）：
- **無需修改核心邏輯**（`landParcels` 當作一般欄位寫入）
- 僅需在欄位白名單中加入 `landParcels`（若有白名單機制，實作時確認）
- 記憶體設定維持現有 `1GiB`（符合 ≥512MB 規則）

## 6. 地段資料來源策略（混合方案）

採「靜態 JSON 優先、API fallback」的混合策略：

| 層級 | 來源 | 載入時機 |
|---|---|---|
| 縣市（22 項） | [`landOfficeCodeTable.js`](src/constants/landOfficeCodeTable.js) 的 `CITIES` | 啟動時同步載入 |
| 鄉鎮區 | 同檔 `TOWNS`（依 `cityCode` 過濾） | 啟動時同步載入 |
| 段小段 | 1. **優先**：`src/constants/landSections/{cityCode}.json`（懶載入）<br>2. **Fallback**：[`useLandSections`](src/composables/useLandSections.js) 呼叫 NLSC API | 選擇區域時觸發 |

### 6.1 靜態資料建置
- 由 [scripts/fetch-land-sections.mjs](scripts/fetch-land-sections.mjs) 產生（已實作）
- 於 `package.json` 新增 script：
  ```json
  "scripts": {
    "build:land-sections": "node scripts/fetch-land-sections.mjs",
    "build:land-sections:force": "node scripts/fetch-land-sections.mjs --force"
  }
  ```
- 部署前人工執行一次；資料不常變動，不納入 `prebuild` 自動流程
- `src/constants/landSections/` 加入 git 追蹤（若資料量大則評估 `.gitignore` + CI 產生）

### 6.2 `useLandSections` 擴充
現有實作直接呼叫 NLSC API；新增載入邏輯：
```js
async function fetchLandSections(cityCode, townCode) {
  // 1. 嘗試載入靜態 JSON
  try {
    const staticData = await import(`@/constants/landSections/${cityCode}.json`);
    const filtered = staticData.default.filter(s => s.townCode === townCode);
    if (filtered.length > 0) return filtered;
  } catch (_) { /* 檔案不存在，fallback */ }

  // 2. Fallback 呼叫 NLSC API（既有邏輯）
  return await fetchFromNLSC(cityCode, townCode);
}
```

## 7. 檔案異動清單

| 檔案 | 動作 |
|---|---|
| [src/components/UnitDetailModal.vue](src/components/UnitDetailModal.vue) | 新增土地標的清冊折疊面板（檢視 + 編輯），擴充 `editingData` |
| [src/composables/useLandSections.js](src/composables/useLandSections.js) | 擴充：先讀靜態 JSON，失敗才打 API |
| [src/views/SalesControlSystem.vue](src/views/SalesControlSystem.vue) | `exportToExcel()` 新增 Sheet 2；`handleFileChange()` 解析 Sheet 2 並交叉驗證；`uploadData()` 傳遞 `landParcels` |
| `src/constants/landParcelColumns.js` | **新建**：定義土地標的清冊 Excel 欄位順序/標題/key（供匯入匯出共用） |
| `src/constants/landSections/*.json` | **新建**：由 `fetch-land-sections.mjs` 產生（git 追蹤） |
| [package.json](package.json) | 新增 `build:land-sections` script |
| [functions/index.js](functions/index.js) | `uploadHouseholds` 若有欄位白名單則加入 `landParcels`（否則不動） |

## 8. 實作階段

1. **階段一：資料層與常數**
   - 建立 `landParcelColumns.js`
   - 執行 `build:land-sections` 產生靜態 JSON
   - 擴充 `useLandSections`

2. **階段二：UI（UnitDetailModal）**
   - 新增折疊面板（檢視模式）
   - 新增編輯表格（行內編輯 + 三層級聯下拉）
   - 接上 `executeSaveChanges`

3. **階段三：Excel 匯出**
   - `exportToExcel` 產生 Sheet 2

4. **階段四：Excel 匯入**
   - `handleFileChange` 讀取 Sheet 2
   - 交叉驗證、整批拒絕機制
   - `uploadHouseholds` 欄位白名單確認

5. **階段五：Cloud Function 部署**
   - `firebase deploy --only functions:uploadHouseholds`（若有改）
   - `firebase deploy --only functions:updateSalesData`（若有改）

## 9. 驗收條件

- [ ] UnitDetailModal 土地持分資訊下方出現「土地標的清冊」折疊面板，預設收合
- [ ] 檢視模式下可正確顯示所有欄位；無資料顯示「尚無土地資料」
- [ ] 編輯模式下可新增、編輯、刪除土地列；縣市→區域→段小段級聯下拉正常運作
- [ ] 權利範圍類型選「全部」時，分子/分母自動鎖定為 1/1
- [ ] 儲存後 Firestore 文件內正確寫入 `landParcels` 陣列
- [ ] Excel 匯出包含兩個工作表；Sheet 1 結構不變、Sheet 2 按規格輸出
- [ ] 一戶多筆土地時，Sheet 2 出現 N 列相同 `unitId`
- [ ] Excel 匯入可成功還原 `landParcels`；id 由前端重新產生
- [ ] Sheet 2 含 Sheet 1 不存在的 `unitId` → 整批拒絕並顯示明確錯誤
- [ ] 既有無 `landParcels` 欄位的戶別讀取不報錯、視為 `[]`
- [ ] `land_share_ping` / `land_share_sqm` / `land_share_ratio` 手動輸入行為不受影響

## 10. 風險與注意事項

- **段小段資料量**：全國段小段 JSON 可能數 MB，Vite 的動態 `import()` 會自動 code-split 為獨立 chunk，不影響主 bundle。
- **NLSC API 可用性**：若靜態 JSON 尚未產生且 API 失敗，下拉改以 `v-combobox` 允許自由輸入（保底方案）。
- **Excel 重複 `unitId`**：Sheet 2 允許同一 `unitId` 多列，這是預期行為；但需確保前端正確 group by。
- **`id` 欄位不上 Excel**：避免使用者誤改造成重複，匯入時一律重新產生。
- **既有 `land_share_ratio` 欄位命名**：與新 `landParcels[].rightsNumerator/Denominator` 無關，兩者獨立存在（使用者決策：手動輸入）。
