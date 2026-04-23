# SPEC：實價登錄 JSON 匯出功能

## 1. 目標
將 `匯出實價登錄申報JSON.gs` + `預售屋成交申報JSON轉檔列表.xlsx` 的 Google Sheet 實作，移植到 anxi-app 系統內，並提供前端 UI 可編輯所有欄位。

## 2. 範圍

### In scope
- UnitDetailModal 新增「匯出實價登錄JSON」按鈕
- 建案層級「實價登錄申報設定」頁（主體 / 土地 / 建物 / 車位 / 簽約日期，5 個分頁）
- 戶別層級覆寫（每戶可獨立編輯任何欄位）
- 匯出前「親友/員工/共有人」關係交易確認
- 產出符合內政部規範的 JSON 檔（結構同原腳本）

### Out of scope
- 「會辦單總表」分頁（依使用者確認不處理）
- ZIP / Google Drive 上傳（改直接瀏覽器下載 `.json`）
- 批次匯出多戶

## 3. JSON 產出格式
```json
{
  "ZWw1MDEw":      { ...主體資料 92 欄 },
  "ZWw1MDEwMQ==":  [ { "land_SEQ": "1", ...土地欄 }, ... ],
  "ZWw1MDEwMg==":  [ { "build_SEQ": "1", ...建物欄 } ],
  "ZWw1MDEwMw==":  [ { "car_SEQ": "1", ...車位欄 }, ... ]   // 無車位時不輸出此 key
}
```
特殊處理：
- `right_tel`：補 0 至 10 碼後格式化成 `0000-000-000`
- `p1sp_code0201`：依對話框勾選，填 `"Y"` 或 `""`
- `p1sp_code0505`：依合約類型 `毛胚合約` 自動帶 `"Y"`
- 所有數值欄位都轉為字串輸出（`val.toString()`）
- 檔名：`{unitId}{申報人名稱}.json`

## 4. 資料模型（Firestore）

### 4.1 建案層級（預設值）
**路徑**：`projects/{projectId}` 文件內新增 `realPriceReport` 欄位
```
realPriceReport: {
  mainDefaults: { ...主體 92 欄預設 },
  landDefaults: [ ...土地資料 ],
  buildDefaults: { ...建物資料 },
  carDefaults: [ ...車位類別模板 ],
  signDefaults: { defaultContractType: "一般合約" },
  updatedAt, updatedBy
}
```

### 4.2 戶別層級（覆寫值）
**路徑**：`projects/{projectId}/buildings/{buildingId}/unitId/{unitId}` 文件內新增 `realPriceReport` 欄位
```
realPriceReport: {
  mainOverrides: { ...只存與預設不同的欄位 },
  landOverrides: [ ...同上 (以 index 對應) ],
  buildOverrides: { ...同上 },
  carOverrides: [ ...完整車位資料 ],
  signOverride: { contractType: "..." },
  lastExportedAt, lastExportedBy
}
```

## 5. 自動映射優先序
**戶別覆寫 > 自動映射 > 建案預設**

| 申報欄位 | 來源 |
|---|---|
| `right_name` | `unitData.buyerName` |
| `right_idNo` | `unitData.buyerIdNumber` |
| `right_tel` | `unitData.buyerPhone`（套用補 0 + 格式化） |
| `right_mail` | `unitData.buyerEmail` |
| `right_addr` | `buyerMailingCity + buyerMailingDistrict + buyerMailingAddress` |
| `p1ma_date` | `unitData.payment_contract_date` → 民國 `YYYMMDD` |
| `p1ma_build10_1` | 從 `unitId` 解析樓層 → 3 碼 |
| `p1ma_build10_1c` | 中文樓層 (如「十七層」) |
| `p1ma_totprice` | `(房屋成交價 + 車位成交價合計) × 10000` |
| `p1ma_dbidprice` | `price_transaction_house × 10000` |
| `p1ma_parkprice` | 車位成交價合計 × 10000 |
| `p1ma_alidprice` | `totprice - dbidprice - parkprice`（若 > 0） |
| `p1ma_cntpark` | `持有車位.length` |
| `p1ma_cntdbid` | 固定 `"1"` |
| `p1ma_cntalid` | `landDefaults.length` |
| `p1ma_build1/2/3` | `rooms` / `livingRooms` / `bathrooms` |
| `p1ma_parkflag` | 有車位 = `"0"`，無 = `"2"` |
| `caseflag` | 有車位 = `"2"`，無 = `"1"` |
| `build_areaM/B/P` | `area_main_sqm` / `area_ancillary_sqm` / `area_common_sqm` |
| `car_*` | `持有車位[]` 逐筆對應 |
| `p1sp_code0505` | `signOverride.contractType === '毛胚合約'` → `"Y"` |
| `p1sp_code0201` | 匯出對話框勾選 |

## 6. UI 設計

### 6.1 UnitDetailModal 按鈕
- 位置：「辦理退戶」按鈕的右邊（桌機） / 退戶按鈕右邊（行動版）
- 顯示條件：`viewMode === 'sales'`
- 按鈕文字：「匯出實價登錄JSON」(桌機) / 「實登JSON」(行動版)
- 按鈕顏色：`deep-purple` outlined / stacked

### 6.2 匯出對話框（ExportDialog.vue）
- 載入：建案預設 + 戶別覆寫 + 自動映射，合併成預覽資料
- 5 個分頁：主體 / 土地 / 建物 / 車位 / JSON 預覽
- 所有欄位可編輯（即時覆寫戶別層級）
- 底部勾選：☐ 本筆交易為親友、員工、共有人或其他特殊關係
- 底部下拉：合約類型（一般合約 / 毛胚合約）
- 底部按鈕：[僅儲存覆寫] / [產生並下載 JSON] / 取消

### 6.3 建案層級設定頁
- 位置：`SalesSettings.vue` → 新 tab `realPriceReport`
- 元件：`RealPriceReportSettings.vue`（5 個子 tab）
- 權限：沿用 `requiredSystem: '銷控系統'`

## 7. 檔案清單

### 新增
| 檔案 | 用途 |
|---|---|
| `src/constants/realPriceReportSchema.js` | 欄位 schema |
| `src/composables/useRealPriceReport.js` | 讀寫 Firestore + JSON 產生 + 自動映射 |
| `src/components/RealPriceReport/ExportDialog.vue` | 匯出對話框 |
| `src/components/RealPriceReport/MainDataEditor.vue` | 主體資料表單 |
| `src/components/RealPriceReport/LandDataEditor.vue` | 土地資料編輯 |
| `src/components/RealPriceReport/BuildDataEditor.vue` | 建物資料編輯 |
| `src/components/RealPriceReport/CarDataEditor.vue` | 車位資料編輯 |
| `src/components/RealPriceReport/SignDataEditor.vue` | 簽約日期編輯 |
| `src/components/RealPriceReport/RealPriceReportSettings.vue` | 建案層級設定頁 |

### 修改
| 檔案 | 修改 |
|---|---|
| `src/components/UnitDetailModal.vue` | import + 2 個按鈕 + 對話框掛載 |
| `src/views/SalesSettings.vue` | 新增 `realPriceReport` tab |

## 8. 風險與注意事項
- **交易日期格式**：系統儲存 ISO / Timestamp，需轉換為民國 `YYYMMDD`
- **金額單位**：系統以「萬元」為主、申報 JSON 以「元」為主，× 10000
- **樓層推導**：預設從 `unitId` 的數字部分解析（`C-17` → 17）；若命名規則不同需手動覆寫
- **手機號碼格式**：`0000-000-000`；市話或格式異常時保留原字串
- **Firestore 寫入體積**：單戶覆寫 < 10KB
