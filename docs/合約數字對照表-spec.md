# 合約數字對照表 頁面 Spec

> 版本：v1.1（2026-08-16：新增「房屋土地合一版」）
> 狀態：已與用戶確認需求
> 需求依據：`docs/合約製作對照表.pdf`（房地分開版，富宇首馥 C棟19樓）、
> `docs/合約製作對照表-房地合約版本.pdf`（房地合一版，富宇學森 C棟15樓）
> 母規格：`docs/合約製作資料範本-spec.md`（沿用其架構：頁面類型 / config / Dialog / 後端產製）

## 0. 兩種版本

新增頁面時選擇其一（兩個獨立頁型，渲染共用同一套 sections 引擎與預覽/PDF/EXCEL 渲染器）：

| | 房屋土地分開 `contractNumberTable` | 房屋土地合一 `contractNumberTableCombined` |
|---|---|---|
| 適用 | 房屋、土地合約分開製作 | 房地合一單一合約 |
| 區塊 | 房屋合約＋土地合約 兩表格 | 「房屋土地合約（一般合約）」單一表格 |
| 土地持分/專有部份面積 | 於土地合約區 | 併入主表（專有部份面積出現兩處，照契約書重複） |
| 價款區 | 主表無土地總價款（於土地區） | 含「土地總價款」列 |
| 本契約總價款 | 房屋價款＋車位 | 房屋價款＋土地總價款＋車位 |
| 貸款金額 | 兩列：房屋款（房屋合約）／土地款（土地合約） | 單列：銀行貸款期整期金額 |
| 無車位時車位價款明細 | Ｘ佔位 | 金額以「零」呈現（位置仍Ｘ） |
| 尾列「房屋（含…停車位）」 | 房屋區帶「N位」、土地區不帶 | 不帶「位」數 |
| 頁碼預設 | P11／P12 P22／P13／P14／P15／P27…／P6 P15／P9／P17 | P13／P14 P25／P15／P16／P17／P33 P34 |
| 常數 | 8 項（含土地賠償/沒收） | 6 項（無土地專屬條款） |

## 1. 目標與範圍

在「合約製作範本」新增第 8 種頁面類型 **`contractNumberTable`（合約數字對照表）**：

- 用途：用戶對照此表，將灰底（本表輸出為**藍字**）的文字**逐格蓋章**到紙本合約書上。
- **富宇首馥專用**（房屋合約、土地合約**分開製作**）；房地合一的建案欄位不同，本版不處理。
- 不加入 `buildDefaultContractDocConfig` 預設頁面組合，由建案設定「新增頁面」手動加入。
- 匯出：**PDF + EXCEL** 皆支援（Dialog 內同其他頁型預覽、單頁匯出、合併匯出）。

### 已確認的需求決策（2026-08-16 與用戶確認）

| # | 決策點 | 結論 |
|---|---|---|
| 1 | 車位長/寬 | 尺寸字串（如 `550*250`）**大的數字＝長、小的數字＝寬**（÷100 轉公尺：長5.5、寬2.5） |
| 2 | 車位樓層/編號 | 自車位編號拆解：`B4-73` → 地下第**肆**層第**73**號；`B4-002` → 第**002**號（**編號保留前導零、原樣輸出**） |
| 3 | 主建物面積占比（58.28%） | **需要蓋章 → 藍色**；主建物㎡ ÷ 房屋總面積㎡，取 2 位小數 |
| 4 | 貸款金額 | 取**拆款表期款房/土拆分結果**中「銀行貸款」期的房屋款/土地款（房屋合約用房屋款、土地合約用土地款） |
| 5 | 3 個以上車位 | **動態增列**同樣欄位（車位－3、（三）…）；第 2 車位（含以後）無資料時照 PDF 以全形「**Ｘ**」佔位 |
| 6 | 輸出樣式 | **白底＋藍字**（不保留灰底）；右側小字參考數值（2,261.9 等）**不保留** |
| 7 | 字體/顏色 | 沿用現有頁面字體選項（新細明體/Noto 黑體/標楷體，`page.font`）；藍色＝**印泥藍**（常數 `STAMP_BLUE = #1E50A2`，前後端共用同色值） |
| 8 | EXCEL | 也要做（每頁一 worksheet，藍字同 PDF） |

## 2. 版面規格

單頁 A4 直式（預設；沿用 `paper` 設定）。上下兩區、格線表格，列結構**固定照範例 PDF**（契約書預印空格決定槽位，槽位不隨數值大小變動、空槽補「零」）。

文字顏色規則：

- **藍字（印泥藍）**：所有「要蓋章」的值＝範例 PDF 灰底格內容，含 Ｘ 佔位、■/□ 勾選、58.28%、常數（三/七/三十/五/十五）。
- **黑字**：列標題與契約書印刷對照文字（「第」「棟第」「樓」「點」「平方公尺(」「坪)」「元整。」、P11 等頁碼標籤、括號說明文字）。

### 2.1 房屋合約（一般合約）區

| 列 | 內容（【】＝藍字） | 資料來源 |
|---|---|---|
| 房屋編號 | 第【C】棟第【19】樓 | 戶別 `building` / `floor`（缺值 → 紅字警示） |
| 車位－N | 地下第【肆】層第【73】號，長為【5.5】公尺，寬為【2.5】公尺 【■法定 □自設】 | 持有車位第 N 筆：`spotId` 拆解（§3.2）、`size` 拆解（§3.3）、`type` 判定勾選（§3.4） |
| 車位－N面積 | 【貳玖】點【柒伍】平方公尺(【玖】點【零零】坪) | `area`（㎡）；坪＝㎡×0.3025 四捨五入 2 位；數字串式大寫（§3.5） |
| （末車位列尾）以上停車位共計 | 【壹】個 | 持有車位數量，大寫 |
| 房屋面積共計 | 【壹】佰【肆】拾【壹】點【參陸】平方公尺(【肆貳】點【柒陸】坪) | `area_house_sqm/ping`；槽位式 3 槽（佰拾個）＋2 位小數（§3.5） |
| 專有部分面積 | 【零】佰【玖】拾【貳】點【陸零】…(【貳捌】點【零壹】坪) | 主建物＋附屬建物（㎡、坪各自相加）；槽位式 3 槽 |
| 主建物面積 | 同上格式 | `area_main_sqm/ping`；槽位式 3 槽 |
| 附屬建物陽台面積 | 【壹】拾【零】點【貳貳】…(【參】點【零玖】坪) | `area_ancillary_sqm/ping`；槽位式 **2 槽（拾個）** |
| 共有部份面積 | 【肆】拾【捌】點【柒陸】…(【壹肆】點【柒伍】坪) | `area_common_sqm/ping`；槽位式 2 槽 |
| 主建物面積占本房屋登記總面積之比例 | 【58.28%】 | 主建物㎡÷房屋總面積㎡×100，2 位小數，藍字 |
| 本契約總價款 | 【貳】仟【貳】佰【陸】拾【壹】萬【玖】仟元整。 | **房屋價款（價款公式 `houseAmount`）＋車位成交價合計**；金額槽位式 4＋1 槽（§3.6） |
| 房屋價款 | 同上格式 | 價款公式 `houseAmount`（房屋款，扣車位） |
| 專有部分價款 | 同上格式 | 價款公式 `exclusiveAmount` |
| 主建物價款 | 同上格式 | 價款公式 `mainAmount` |
| 附屬建物陽台價款 | 【壹】佰【參】拾【捌】萬【貳】仟元整。 | 價款公式 `ancillaryAmount`；金額槽位式 **3＋1 槽** |
| 共有部份價款 | 同上格式 | 價款公式 `commonAmount`；3＋1 槽 |
| 車位價款 | 【零】仟【貳】佰【伍】拾【零】萬【零】仟元整。 | 車位成交價合計（`parkingTotal`）；4＋1 槽 |
| （N）地下…層，編號…號 | （一）地下【肆】層，編號【73】號 | 各車位（依持有順序），無第 2 車位以 Ｘ 佔位 |
| 新台幣（每車位一列） | 新台幣【貳】佰【伍】拾【零】萬【零】仟元整。 | 該車位成交價（萬）；3＋1 槽 |
| P11 | 三、交屋日起【三】日內配合辦理交屋手續 | 常數（§4 options） |
| P12 P22 貸款金額 | 【壹】仟【伍】佰【貳】拾【玖】萬【玖】仟元整。 | 銀行貸款期**房屋款**（§3.7）；4＋1 槽 |
| P13 | 2、縮短償還期限為【七】年(期間不得少於七年)， | 常數 |
| P13 | （三）買方應於接獲通知之日起【三十】天（不得少於三十天） | 常數 |
| P14 | 三、房屋總價款萬分之【五】（最高以萬分之五為限）之手續費。 | 常數 |
| P15 | 賠償房屋總價款百分之【十五】（不得低於百分之十五）之違約金。 | 常數 |
| P15 | 沒收依房屋總價款百分之【十五】（最高不得超過百分之十五）計算之金額。 | 常數 |
| P27 P28或P30 P31 | 住家編號：第【C】棟第【19】樓 | 同房屋編號 |
| （續上）房屋 | 房屋（含地下【肆】層編號【73】號汽車停車位）【壹】位 | 車位多筆時「地下…層編號…號」段落逐車位重複（頓號分隔）；數量大寫 |

> 常數列（三/七/三十/五/十五）以**國字小寫**原樣輸出用戶設定字串，不做數字轉換。

### 2.2 土地合約區

| 列 | 內容 | 資料來源 |
|---|---|---|
| 土地持分面積 | 【壹貳】點【陸陸】平方公尺(【參】點【捌參】坪) 壹拾萬分之【陸玖肆】 | `land_share_sqm/ping`（數字串式）；分子 `land_share_ratio` 大寫數字串 |
| 專有部份面積 | 同房屋合約「專有部分面積」（槽位式 3 槽） | 主建物＋附屬建物 |
| 土地總價款 | 【壹】仟【參】佰【玖】拾【捌】萬【壹】仟元整。 | `landPrice`（土地價款，萬）；4＋1 槽 |
| P6 P15 貸款金額 | 同上格式 | 銀行貸款期**土地款**（§3.7） |
| P9 | 賠償土地總價款百分之【十五】…之違約金。 | 常數 |
| P9 | 沒收依土地總價款百分之【十五】…計算之金額。 | 常數 |
| P17 | 住家編號：第【C】棟第【19】樓 房屋（含地下【肆】層編號【73】號汽車停車位） | 同 2.1 末列（本列無「位數」尾綴） |

## 3. 數值轉換規則

### 3.1 大寫數字

`零壹貳參肆伍陸柒捌玖`（沿用 `zhNumber.js` `ZH_DIGITS`）。

### 3.2 車位編號拆解

`spotId` 以**第一個 `-`** 分段：

- 前段取數字部分＝地下層數 → 大寫（`B4`→4→「肆」；支援 1~99，10 以上如 `B12`→「壹拾貳」）。
- 後段＝車位號，**原樣輸出**（`002` 印「002」、`73` 印「73」，不去前導零、不轉大寫）。
- 無 `-` 或前段無數字：層留空並於預覽紅字警示（不擋下載）。

### 3.3 車位長寬

`size` 以分隔符拆成兩數，**大者＝長、小者＝寬**，÷100 轉公尺，去尾零顯示（550→5.5、600→6）。
容忍常見資料格式：`600*250`、`600＊250`（全形星號）、`600 X 250`、`600 x 250`、`600×250`、前後空白、全形數字（`６００＊２５０`）。解析失敗 → 該兩格以Ｘ佔位＋預覽警示。

### 3.4 法定/自設勾選

車位 `type` 含「法定」→「■法定 □自設」；含「自設」→「□法定 ■自設」；其他/空 → 兩者皆空框＋預覽警示。整段（含框與字）藍色。

### 3.5 面積轉換（新增 `zhNumber.js` helpers）

- **槽位式** `toZhAreaSlots(sqm, intSlots)`：整數部分固定 `intSlots` 槽（3=佰拾個、2=拾個）逐位大寫**補零**；小數固定 2 位（四捨五入）合併為一格數字串（`.36`→「參陸」、`.00`→「零零」）。整數位數超過槽位 → 往前加位並回傳 `overflow: true`（預覽紅字警示）。
- **數字串式** `toZhDigitString(value)`：整數部分逐位大寫串接（12→「壹貳」）、小數 2 位同上；車位面積、坪數、土地持分㎡/坪、持分分子用。
- 坪數一律數字串式；㎡→坪 換算 ×0.3025 四捨五入 2 位（車位；戶別面積直接用 `area_*_ping` 欄位值）。

### 3.6 金額轉換（萬、1 位小數）

`toZhAmountSlots(amountWan, intSlots)`：金額四捨五入到 0.1 萬；整數部分固定槽位（4=仟佰拾萬、3=佰拾萬）逐位大寫補零；小數第 1 位＝「仟」槽（2261.9 → 貳仟貳佰陸拾壹萬**玖**仟）。溢位處理同 §3.5。

### 3.7 貸款金額

取拆款表同一份期款房/土拆分結果（`splitModel.rows`）中的**銀行貸款期**：

- 期別認定：頁面 options `loanItemName` 指定期別名稱；空值時自動比對名稱含「銀行貸款」的期別，仍找不到再比對含「貸款」者。
- 房屋合約貸款金額＝該期 `houseAmount`、土地合約＝該期 `landAmount`（元 → ÷10000 轉萬）。
- 找不到期別或該戶無適用期款範本：兩格Ｘ佔位＋預覽紅字警示（不擋下載）。

### 3.8 Ｘ佔位

車位 2（含固定顯示的空列）與任何解析失敗格：全形「Ｘ」，**藍色**。第 2 車位列即使無車位也固定顯示（照契約書格式），第 3 列以後僅在有車位時增列。

## 4. 資料模型

### 4.1 頁面類型註冊（`contractDocDefaults.js`）

```js
{ type: 'contractNumberTable', label: '合約數字對照表', icon: 'mdi-stamper',
  description: '蓋章對照表（富宇首馥・房地分開合約專用）；藍字＝需蓋章內容' }
```

`DEFAULT_PAGE_FONT.contractNumberTable = 'kai'`（標楷體，近印章字體；可於頁面設定改明體/黑體）。

### 4.2 頁面 options

```js
options: {
  loanItemName: '',                  // 銀行貸款期別名稱；空 = 自動比對（§3.7）
  constants: {                       // 契約書常數（藍字原樣輸出）
    handoverDays: '三',              // P11 交屋日起 N 日
    shortenYears: '七',              // P13 縮短償還期限 N 年
    noticeDays: '三十',              // P13 接獲通知之日起 N 天
    feePerTenThousand: '五',         // P14 萬分之 N 手續費
    housePenaltyPercent: '十五',     // P15 賠償房屋總價款百分之 N
    houseForfeitPercent: '十五',     // P15 沒收房屋總價款百分之 N
    landPenaltyPercent: '十五',      // 土地 P9 賠償百分之 N
    landForfeitPercent: '十五',      // 土地 P9 沒收百分之 N
  },
  pageLabels: {                      // 契約書頁碼標籤（黑字，每建案不同）
    handover: 'P11', houseLoan: 'P12 P22', shorten: 'P13', notice: 'P13',
    fee: 'P14', housePenalty: 'P15', houseForfeit: 'P15', houseUnitNo: 'P27 P28或P30 P31',
    landLoan: 'P6 P15', landPenalty: 'P9', landForfeit: 'P9', landUnitNo: 'P17',
  },
}
```

以上皆屬**建案層** config（`ContractDocConfigEditor` 頁面設定表單），銷售端 Dialog 不需逐戶填寫；本頁**無戶別層輸入欄位**（全部自動帶入）。

### 4.3 渲染模型（`contractDocModel.js` 新增 `buildContractNumberTablePageData`）

輸入 `page, ctx, priceModel, splitModel, state`，輸出前後端共用 data：

```js
{
  building, floor,                       // 房屋編號（缺值 warnings）
  parkings: [{ floorZh, number, lengthM, widthM, isLegal, isSelf,
               areaSqm: {digits, decimal}, areaPing: {digits, decimal}, priceSlots, valid }],
  parkingCount, parkingCountZh,
  areas: { houseTotal: {slots, decimal, pingDigits, pingDecimal, overflow}, exclusive, main,
           ancillary, common },          // 各列槽位結果（§3.5）
  mainRatioText,                         // '58.28%'
  amounts: { contractTotal, houseAmount, exclusiveAmount, mainAmount,
             ancillaryAmount, commonAmount, parkingTotal,  // §3.6 槽位結果
             houseLoan, landLoan, landPrice },
  landShare: { sqmDigits, sqmDecimal, pingDigits, pingDecimal, ratioZh },
  constants, pageLabels,                 // options 帶出
  warnings: ['車位 B4-73 尺寸無法解析', ...],   // 預覽紅字列示
}
```

價款來源為**固定公式 key**（`houseAmount`/`exclusiveAmount`/`mainAmount`/`ancillaryAmount`/`commonAmount`＋基礎 ref `housePrice`/`landPrice`）；建案價款公式缺少對應 key 或計算錯誤 → 該格Ｘ＋warnings。

## 5. 前端

- **預覽元件** `src/components/contractDoc/ContractNumberTablePreview.vue`：HTML table 依 §2 版面，白底、格線黑、藍字 class `stamp-blue`（`color: #1E50A2`）；頂部 warnings 紅字條列（僅預覽顯示、不進匯出）。字體沿用既有 `page.font` CSS 機制。
- **設定表單**（`ContractDocConfigEditor.vue` 頁面設定）：`contractNumberTable` 專屬區塊——`loanItemName`（下拉自期款範本期別＋可手填）、constants 8 欄、pageLabels 12 欄文字輸入。
- **Dialog**（`ContractDocDialog.vue`）：頁面清單支援本頁型（啟用/排序/單頁匯出照舊）；本頁無左欄輸入項，僅預覽。依賴既有 `priceModel` / `splitModel`（即使拆款表頁停用也已計算）。

## 6. 後端（`functions/contractDocument.js`）

- 常數 `STAMP_BLUE = '#1E50A2'`（與前端同值）。
- **PDF**：pdfkit 依 §2 畫格線表格；藍字用頁面字體（既有 ming/hei/kai 字型檔，含 `TW-Kai-98_1.ttf`）；黑字對照文字同字體黑色。■/□ 以字元繪製（藍色）。
- **EXCEL**：exceljs 一 worksheet，儲存格結構照表格（合併儲存格對應欄位槽）、藍字 `font.color`、黑框線；紙張設定同頁面 paper。
- payload 沿用母規格 §7：前端算好 data 傳入，後端僅渲染。

## 7. 邊界情況

| 情況 | 行為 |
|---|---|
| 戶別缺 `building`/`floor` | 該格空白＋預覽紅字警示（不擋下載） |
| 無車位 | 車位1、車位2 兩列均Ｘ佔位；共計【零】個；價款（一）（二）Ｘ |
| 車位 ≥3 | 動態增列（車位－3…、（三）…）；「含…停車位」段落逐車位串接 |
| spotId / size / type 解析失敗 | 該格Ｘ＋warnings |
| 面積/價款欄位缺值或公式錯誤 | 該格Ｘ＋warnings（紅字），不擋下載 |
| 槽位溢位（數值超出契約書空格位數） | 往前補位輸出＋warnings |
| 找不到銀行貸款期 | 貸款金額Ｘ＋warnings |
| 配套合約戶別 | 本頁照一般邏輯輸出（價款公式以該建案 config 為準）；不做配套限定 |

## 8. 檔案異動清單

| 檔案 | 內容 |
|---|---|
| `src/utils/zhNumber.js` | 新增 `toZhAreaSlots` / `toZhDigitString` / `toZhAmountSlots`、層數大寫 |
| `src/utils/contractDocDefaults.js` | PAGE_TYPES 註冊、`buildDefaultPageOptions('contractNumberTable')`、DEFAULT_PAGE_FONT |
| `src/utils/contractDocModel.js` | `buildContractNumberTablePageData` |
| `src/components/contractDoc/ContractNumberTablePreview.vue` | 新增預覽元件 |
| `src/components/ContractDocConfigEditor.vue` | 頁型設定表單（loanItemName/constants/pageLabels） |
| `src/components/contractDoc/ContractDocDialog.vue` | 掛預覽元件、payload 組裝 |
| `functions/contractDocument.js` | PDF/EXCEL 渲染（STAMP_BLUE） |

無新集合、無新 Firestore 規則、無新依賴。

## 9. 部署

- 前端：`npm run release:safe`
- 後端：`FUNCTIONS_DISCOVERY_TIMEOUT=120 firebase deploy --only functions:generateContractDocument`（記憶配置維持 512MiB）
