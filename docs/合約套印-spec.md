# 合約套印 功能 Spec

把建設公司提供的空白合約 PDF 做成「套印範本」，在合約製作設定中以該戶資料自動帶入（金額轉國字大寫、勾選框依條件打 V），預覽後列印或存 PDF。

## 1. 入口與權限

- 入口：銷控系統 › 戶別 › **合約製作設定** 視窗標題列「合約套印」按鈕（`ContractDocDialog.vue`）。
- 開啟後先看到本建案的範本清單；點範本進入預覽（本戶資料）。
- **有本建案「銷控系統」權限者**（超管／系管免勾）：新增／改名／刪除範本、編輯範本（拖曳位置、字型字級、綁定欄位、顯示條件、自動偵測）、修改建案設定。
- 沒有銷控系統權限者（例如從報價系統開啟）：只能預覽、列印、存 PDF（工具列不顯示編輯工具，物件不可選取）。

## 2. 資料模型

| 位置 | 內容 |
|---|---|
| Firestore `contractPrintTemplates/{templateId}` | `projectId`、`name`、`pdfName`、`pdfPath`、`pages`、`objects[]`、`removedPages[]`、`createdAt`、`updatedAt`、`updatedBy` |
| Firestore `contractPrintConfigs/{projectId}` | 建案層級設定（見 §4） |
| Storage `contractPrint/{projectId}/{templateId}.pdf` | 空白合約 PDF |

`objects[]` 每個物件：`page`、`x`、`y`（基線）、`size`、`font`（PostScript 名稱）、`color`、`anchor`（start/middle/end）、`maxW`（最大寬度，超過自動縮小）、`group`、`text`（固定文字）、`bind: { field, fmt, place?, lead?, index? }`、`when: { field, value, index? }`、`todo`（自動偵測到但未設定，不輸出）。

### Firestore 規則（Console 手動新增；前端未用 Firebase Auth，寫入權限由前端依銷控系統權限判斷）

| Collection | 讀 | 寫 |
|---|---|---|
| `contractPrintTemplates` | 已登入 | 已登入 |
| `contractPrintConfigs` | 已登入 | 已登入 |

Storage：`contractPrint/**` 需允許已登入讀寫（目前正式環境 Storage 規則為全開，收斂時要涵蓋此路徑）。

## 3. 新增的資料欄位（Excel 匯入／匯出同步）

戶別 `salesHouseholds`（戶別資料 Excel 欄位標頭）：

| key | Excel 標頭 | 型別 |
|---|---|---|
| `build_no` | 建號 | 文字 |
| `area_reg_main_sqm` | 登記主建物面積(平方公尺) | 數字 |
| `area_reg_ancillary_sqm` | 登記附屬建物面積(平方公尺) | 數字 |
| `common_share` | 共有部分持分 | 文字（`1525/100000`、`100000分之1525` 或只填分子） |

車位 `salesParkings`：`deed_type`「車位權狀」（有獨立權狀／無獨立權狀；空白用建案預設）。車位一般格式匯入改為**依標頭名稱**對應欄位，「車位權狀」可省略，舊檔仍可匯入。

## 4. 建案設定（`contractPrintConfigs/{projectId}`，合約套印內「建案設定」）

| 欄位 | 說明 |
|---|---|
| `landAreaTotalSqm` | 全部土地面積（㎡） |
| `commonBuildNo` | 共有部分建號 |
| `commonAreaSqm` | 共同使用部分面積（整棟，㎡） |
| `commonShareDen` | 持分分母（戶別持分只填分子時補上） |
| `parkingShare` | 共用部分持分（車位）：每個車位的持分分子 |
| `mergeParkingShare` | 是否併入共用部分持分：共用部分持分＝戶別持分＋車位持分×車位數（例 2461＋1502×1＝3963） |
| `parkingDeedDefault` | 車位權狀預設 |
| `installmentMap` | 付款欄位對應的期別名稱 `{ deposit: ['訂金'], signPay: [...], ... }`；未設定時依名稱比對 |
| `customFields` | 自訂欄位 `[{ key, label, type, value }]`（建案層級常數） |

期款自動比對（未設定時）：定金＝含「訂金／定金」；簽約款＝含「訂金／定金／簽約」（合約寫「本款項包括已收定金」）；備證款＝「備證／用印」；完稅款＝「完稅」；銀行貸款＝「貸款」；交屋款＝「交屋」。

## 5. 欄位與資料來源（`src/utils/contractPrint/fields.js`）

| 群組 | 欄位 | 來源 |
|---|---|---|
| 基本 | 戶別、買方、棟別、樓層、門牌 | 戶別資料 |
| 土地（每筆） | 縣市、鄉鎮市區、段、小段、地號、面積、權利範圍 | 土地標的清冊（段小段拆成段／小段；權利範圍＝「分母分之分子」或「全部」） |
| 土地 | 全部土地面積 | 建案設定 |
| 建物 | 建號、登記主建物／附屬建物面積、共有部分持分 | 戶別新欄位 |
| 建物 | 門牌縣市／鄉鎮市區／街路／段巷弄／號樓 | 門牌拆解 |
| 建物 | 共用部分建號、共用部分面積 | 建案設定 |
| 建物 | 共用部分持分（車位） | 建案設定的車位持分 × 成交車位數 |
| 車位（每個） | 種類、樓層、型式、權狀、編號、面積㎡／坪、單一車位價款 | 合約製作的成交車位；屬性以 `salesParkings` 為準 |
| 車位 | 個數 | 成交車位數 |
| 價款 | 土地、建物、車位、總價款 | 合約製作的價款計算（`priceModel.fullContext`：`landPrice`、`houseAmount`／`housePrice`、`parking`、`total`），萬→元 |
| 付款 | 定金、簽約款、備證款、完稅款、銀行貸款、交屋款 | 合約製作的期款拆分（`splitModel.rows`），萬→元 |

格式：原樣、數字、千分位、國字（單一位數，逐格金額，前面不足補「零」）、國字大寫、國字金額（元整）。逐格金額有放不下的位數時標示「位數不足」。

## 6. 範本建立

- 新增範本：名稱＋空白合約 PDF；可選填本機試做版的範本檔（`template.json`）直接沿用版面。
- 未選範本檔時，建立後自動偵測全部頁（`detect.js`）：
  - 金額格：「元」往回找仟佰拾萬單位字前的空白（可跨行），依同行文字對欄位名稱／別名猜欄位。
  - 勾選框：每個 □ 產生 V，依後面文字對選項欄位猜顯示條件。
  - 猜不到的標「待設定」。
- 工具列可對本頁再偵測；新增自訂欄位後再偵測，待設定的格子會補上欄位。
- 頁面：工具列「頁面」以縮圖標記刪除／還原頁面，存在 `removedPages`（原始頁碼）。PDF 不變；刪除的頁不顯示、不輸出、不計入待設定與缺資料，頁上的物件保留，還原後回來。至少保留一頁。

## 7. 輸出

前端 pdf-lib 疊字（`pdfExport.js`）：本機有字型檔（Chrome 本機字型授權或載入字型檔）時內嵌子集字型，否則以 600dpi 圖片輸出。檔名「範本名稱-戶別.pdf」。

## 8. 檔案

- 新增：`src/utils/contractPrint/*`、`src/components/contractPrint/*`、本文件
- 修改：`src/components/contractDoc/ContractDocDialog.vue`（入口）、`src/api.js`（合約套印 API）、`src/constants/householdColumns.js`、`src/views/SalesControlSystem.vue`（匯入轉型）、`src/views/ParkingControl.vue`（車位權狀、依標頭匯入）、`functions/utils/householdUploadRow.js`（數字欄位）
- 套件：`pdf-lib`、`@pdf-lib/fontkit`

## 9. 部署

1. Firestore Console 新增 §2 兩個 collection 規則。
2. 前端發版。
3. Cloud Functions（`uploadHouseholds`）可隨下次部署更新；前端解析已先轉好型別，未部署也能正確匯入。
