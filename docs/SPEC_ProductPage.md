# SPEC：產品介紹頁 `/#/product`

狀態：定稿（PM、UI/UX、美術、前後端兩輪討論；試用後修訂見 §12）　日期：2026-11-18

## 1. 定位

| 頁面 | 用途 |
|---|---|
| 首頁 `/` | 陌生訪客 30 秒看懂、導試用 |
| 簡報 `/deck` | 會議室投影，業務主講，一頁一重點 |
| **產品介紹 `/product/:section?`** | 客戶自己讀也看得懂的完整功能型錄；業務用 LINE 傳連結，或拜訪時用手機／平板邊滑邊講；可只傳某一個模組 |

讀者：建設公司經營者、專案主管、代銷主管、櫃台／銷售。多數非技術背景、以手機為主。

不需登入。文字簡短，不寫長說明；手機與桌機文字都不可被截斷（不用 ellipsis）。不出現客戶或建案名稱、「測試」「TEST」字樣；唯一例外是形象網站模組的兩張作品截圖（`website-1`、`website-2`，已在首頁與 deck 公開）。

## 2. 角色討論的裁決

| 爭點 | 裁決 |
|---|---|
| 文案與 deck 重複 | 文案資料抽到 `src/constants/productModules.js`，deck 改為匯入（純資料搬移，畫面不得有任何變化）。deck 的 CSS 示意圖不動、不抽共用；新頁示意圖另寫 |
| 角色入口 vs 篩選 | 做「角色捷徑」卡片（點了跳到模組），不做篩選 |
| 重點預設顯示幾項 | ≥1100px 全部顯示；<1100px 顯示前 4 項＋「看全部 N 項」原地展開 |
| 網址同步 | `router.replace`，250ms 防抖、章節有變才呼叫。守衛對公開路由沒有會影響本頁的副作用。**不可照抄 BookingGuide 的 section watcher**（見 §6） |
| 模組順序 | 主力先講：銷售成交 → 客戶開發 → 成交管理 → 交屋售後 → 預售行銷 → 管理。「全流程」總覽仍依時間順序，點階段跳到對應群 |
| 深色區 | 只用在首屏、最終 CTA、頁尾；群標題用淺色帶 |
| 截圖 | 既有截圖多數含「測試建案A／TESTA」，一律照 §7 的裁切表使用；裁不掉的不用，改示意圖 |
| 手機固定元件太佔高度 | <768px 頂欄不 sticky；只留模組列（上）與 CTA 列（下） |
| 各模組 CTA | 模組內不放試用鈕；CTA 只在頂欄、首屏、手機底部列、價格、最終區 |
| 後端 | 不新增、不修改 Cloud Function |

## 3. 路由與全域

- `src/router/index.js`，加在 ProductDeck 旁：
  `path: '/product/:section?'`、`name: 'ProductPage'`、`component: () => import('@/views/ProductPage.vue')`、`meta: { requiresAuth: false, layout: PublicLayout, title: 'ANXI 安熙智慧 - 產品介紹' }`
- `src/App.vue`：
  - `showBugReport` 排除名單（約 137 行）加 `'ProductPage'`。
  - `fetchProjects` 的排除名單（約 163 行）加 `'ProductPage'` 與 `'ProductDeck'`。改之前先讀該段確認條件的寫法。
- 進頁設定 `document.title = '產品介紹｜ANXI 安熙智慧'`，離開還原（同 deck 做法）。
- PublicLayout 的 `v-layout` 有行內 `overflow: hidden`，會讓 `position: sticky` 失效。照 `src/views/guide/BookingGuide.vue`（約 1043 行附近）的既有解法處理，不要改 PublicLayout 本身；離開頁面要還原。

## 4. 檔案

| 檔案 | 內容 |
|---|---|
| `src/constants/productModules.js` | 共用資料：模組文案、五階段、痛點、選擇理由、試用步驟、`LINE_URL`、`PHONE`、方案分頁對照（只放 `id／name／icon`） |
| `src/constants/productPage.js` | 本頁專用：模組順序與分群、角色捷徑、FAQ、`more` 補充重點、各模組示意設定（含截圖裁切） |
| `src/views/ProductPage.vue` | 版面、導覽、scrollspy、深連結、分享 |
| `src/components/product/*.vue` | 模組區塊、截圖框、示意圖、燈箱、分享面板、目錄面板（顆粒度由實作決定，單檔盡量不超過約 700 行） |
| `src/views/ProductDeck.vue` | 只把資料改為從 `productModules.js` 匯入 |
| `src/views/TrialSignup.vue` | 追蹤修正一行（§9） |
| `src/views/LandingPage.vue` | 試用來源加前綴（§9）；功能介紹區加文字連結「完整功能介紹」→ `/product` |
| `src/views/admin/ProspectManager.vue` | 「產品介紹連結」按鈕（§10） |

`productModules.js` 的模組結構：

```js
export const PRODUCT_MODULES = {
  sales: { id: 'sales', nav: '雲端銷控', eyebrow: '雲端銷控系統', icon: 'mdi-home-analytics',
           title: '即時同步的雲端銷控表', points: [['一張表，全團隊同步', '…'], …] },
  …
};
```

deck 改動的限制：

- deck 保留自己的 `slides` 陣列，逐一寫 id 與 `theme`，順序不變，寫成 `{ id, theme, nav: M.nav, feature: M }`。不可用 `Object.values(PRODUCT_MODULES)` 產生（新模組 `handover`、`admin` 不進 deck）。
- `planProducts` 的 `.map(... plans: PRODUCT_PLANS[p.id].pricing)` 與 `titleLines` 留在 deck。
- deck 只讀 `points`；`more` 放在 `productPage.js`，只有本頁顯示（deck 舞台高度固定，加點會溢出）。
- 共用資料可以多加欄位（例如痛點的 `solve`），deck 不讀就不受影響。

## 5. 章節

頁面由上到下（括號內為 section id）：

1. **首屏**（`top`，深色）
   - 標題：「從案場銷控到交屋驗屋，一個平台全部搞定」；副標：「專為建設公司與代銷團隊打造的雲端建案管理平台」。
   - 主鈕「免費試用」、次鈕「LINE 洽詢」。
   - 三個數字：累計合作建案 20+、系統管理戶數 4,000+、已發布版本數（取自 `COMPANY_PROFILE` 與 `appVersion`，算法同 deck）。
   - ≥768px：左文右圖（5：7），右側 `sales-grid` 瀏覽器框＋`booking-page-mobile` 手機框疊在左下；高度不超過一個視窗，底緣露出下一區約 40px。
   - <768px：H1、副標、兩顆 CTA 必須在距頂 600px 內完整可見；數字 3 欄一列（數字 26px、標籤 13px 可換行）；示意只放 `sales-grid` 一個框，接在數字下方，可被首屏下緣切到；不放手機框疊圖。
2. **案場痛點**（`pain`）：6 格（共用資料），每格一個連結「看解法」跳到對應模組：價目表→`sales`、手算→`quote`、撞客→`customer`、預約→`booking`、驗屋→`inspection`、請佣→`commission`。
3. **全流程總覽**（`flow`）：五階段（共用 `stages`），點了跳到該群第一個模組。
4. **角色捷徑**（`roles`）：四張卡，各三個連結。

   | 角色 | 連結（文字 → 模組） |
   |---|---|
   | 建設公司經營者 | 去化與價格即時掌握 → `sales`；議價有把關 → `quote`；交屋進度一張表 → `handover` |
   | 專案主管 | 名單公平分配 → `leads`；客資報表自動統計 → `customer`；指定時間自動調價 → `sales` |
   | 代銷主管 | 請佣獎金自動結算 → `commission`；撞客裁決有紀錄 → `customer`；合約文件一鍵產出 → `contract` |
   | 櫃台／銷售 | 手機就能報價 → `quote`；一句話查銷控 → `ai`；預約不用打電話 → `booking` |

   **第 2–4 段在 <768px 要壓縮，三段合計高度（含間距）不超過 1,900px**，否則太晚看到產品：
   - 痛點：2 欄 × 3 列精簡格，只放圖示、標題、「看解法」；說明文字 ≥768px 才顯示。
   - 全流程：5 列清單，每列約 64px：圖示、階段名、項目用「・」串成一行（可換行）。
   - 角色捷徑：橫向 scroll-snap 卡片，卡寬 78vw，露出下一張。
   - 這三段在手機的上下間距用 48px。

5. **模組**（14 個，依下表順序；每群前有淺色群標題帶）

   | 群 | 模組 id | 示意 |
   |---|---|---|
   | 銷售成交 | `sales` | 截圖 `sales-grid`（瀏覽器框） |
   | | `quote` | 示意圖：期款試算表（訂金／簽約金／工程期款／交屋貸款）＋`sales-mobile` 手機框 |
   | | `parking` | 截圖 `sales-parking` |
   | | `ai` | 示意圖：對話＋「修改前 → 修改後」確認表 |
   | 客戶開發 | `customer` | `vip-form-mobile` 手機框＋示意圖：銷售排行長條 |
   | | `leads` | 示意圖：分配表（本週／上週／本月） |
   | | `lineAi` | 示意圖：LINE 對話＋AI 建議回覆 |
   | 成交管理 | `contract` | 示意圖：合約數字對照表 |
   | | `commission` | 示意圖：請佣表＋獎金分配長條 |
   | 交屋售後 | `booking` | `booking-page-mobile` 手機框＋示意圖：週時間表（日 × 時段、名額） |
   | | `handover` | 示意圖：交屋控管矩陣（戶別 × 對保／驗屋／交屋 狀態籤） |
   | | `inspection` | 示意圖：缺失卡 2 張＋修繕進度四狀態長條 |
   | 預售行銷 | `website` | 截圖 `website-1`、`website-2`（不裁切） |
   | 管理 | `admin` | 無示意圖，精簡版型 |

   文案：
   - 12 個既有模組的文案直接沿用 deck（搬到共用檔，一字不改）。
   - `sales` 的 `more`：「活動訊息頁」— 自由排版活動頁，銷售在銷控與報價系統直接查看、列印。（依據：`src/components/ActivityMessageViewer.vue`，沒有對外連結，不可寫成可分享。）
   - `contract` 的 `more`：「合約套印」— 欄位套到既有合約 PDF 版型。（依據：`src/components/contractPrint/ContractPrintDialog.vue`。）
   - 新模組 `handover`：nav「交屋控管」、眉標「交屋控管・面積找補」、圖示 `mdi-clipboard-list-outline`、標題「交屋進度，一張表控管」。這些功能在**預約系統的戶別資料管理**（`src/views/HouseholdGrid.vue` 的分頁），不是銷控表，文案不可寫成銷控功能。四個重點，寫之前讀下列檔案確認行為再下筆：
     - 交屋控管表：`src/components/household/HandoverControlBoard.vue`、`src/utils/handoverBoard.js`
     - 面積找補單：`src/components/household/AreaSettlementBoard.vue`、`src/utils/areaSettlement.js`
     - 複製圖片回報：`handoverBoardImage.js`
     - Excel／PDF 下載：`handoverBoardExport.js` 與面積找補的下載
   - 新模組 `admin`：nav「權限與帳號」、眉標「權限與帳號」、圖示 `mdi-account-key-outline`、標題「誰能看什麼，一手掌握」。三個重點（依據 `src/views/UserManagement.vue`）：自訂角色、依建案與系統授權、一鍵停用帳號（管理員操作，離職人員立即無法登入）。
   - 新寫的每一項都要在程式碼找到對應功能；找不到的不寫。寫法比照 deck：標題 ≤10 字＋一句說明。
   - 示意圖資料全頁同一組假資料：戶別 A-3、B-5、C-4、D-2；金額 3,450 萬；人名周小倫、蔡小林、林小美。

6. **為什麼選 ANXI**（`why`）：6 個理由（共用資料）。
7. **方案價格**（`pricing`）：5 個分頁，讀 `PRODUCT_PLANS`，含各方案備註。
8. **常見問題**（`faq`）：手風琴，可同時開多題，預設全收。內容照下表，不增加未經查證的承諾（不寫 SLA、認證、資安標章）。

   | 問 | 答 |
   |---|---|
   | 需要安裝軟體嗎？ | 不用。手機、平板、電腦打開瀏覽器就能用。 |
   | 可以只用其中一個系統嗎？ | 可以。各系統可單獨訂閱，之後再加，資料彼此互通。 |
   | 可以先試用嗎？ | 可以。留下基本資料就會自動登入範例建案，直接操作。 |
   | 現有的 Excel 資料能匯入嗎？ | 銷控表與廣告名單都支援 Excel 匯入，導入時有專人協助。 |
   | 一定要有 LINE 官方帳號嗎？ | 不用。通知、裁決、名單回報綁定個人 LINE 即可；LINE AI 助理與形象網站留資通知才需要建案的官方帳號。 |
   | 不同職務看到的資料一樣嗎？ | 不一樣。櫃台、銷售、主管依權限各看各的；人員離職時，管理員可一鍵停用帳號。 |
   | 費用怎麼算？ | 依系統分為按帳號、按戶數或按案計費，見上方方案價格；多人或大量戶別另有優惠。 |
   | 多久可以開始使用？ | 確認需求後由專人協助建置開通。 |

9. **開始試用**（`start`，深色）：三步驟（共用 `trialSteps`）、試用 QR Code、主鈕「免費試用」、LINE 洽詢、電話。
10. **頁尾**：品牌、LINE、電話、「簡報模式」→ `/deck`、隱私權政策與服務條款（連到既有路由）。

## 6. 導覽與互動

**頂欄**（高 56px）：左 Logo＋「ANXI 安熙智慧」（點了回頂）；右「簡報模式」、分享鈕、主鈕「免費試用」。≥768px sticky；<768px 不 sticky、隨頁面捲走，且不顯示「簡報模式」。

**模組列**（高 48px，捲過首屏後才顯示）：
- 橫向膠囊，列 14 個模組＋「方案價格」「常見問題」，群與群之間一條細分隔線。
- ≥768px sticky 在頂欄下方（top 56px）；<768px sticky 在 top 0。
- 放得下就置中；放不下可橫向捲動，右緣漸層提示。
- <1100px：最左固定一顆 44px「目錄」鈕，不隨列橫捲。點了開目錄面板（手機為底部面板）：依群列出 14 個模組、方案價格、常見問題，每列 48px，標示目前項目。
- <768px：最右固定一顆 44px 分享鈕。
- 膠囊視覺高度約 34px，但點擊範圍吃滿 48px 列高。
- 讓目前項目置中只能改容器的 `scrollLeft`（同 BookingGuide 1014–1019 行），不可對膠囊呼叫 `scrollIntoView`，會打斷頁面本身的捲動。

**scrollspy 與網址**：
- IntersectionObserver 判定目前章節，目前項目加 `aria-current`。
- spy 先設 `activeId`，再以 `router.replace` 把網址同步為 `/product/<id>`（250ms 防抖，保留 query）；回到首屏時網址回到 `/product`。
- `watch(() => route.params.section)` 只在「新值 ≠ 目前的 `activeId`」時才捲動（只處理手改網址、上一頁／下一頁）。**不可照抄 BookingGuide 那個一變就捲的 watcher**，否則 spy 寫網址 → watcher 把畫面拉回章節頂，使用者每跨一章就被吸過去。
- 頁內所有跳轉（模組列、目錄、痛點「看解法」、角色捷徑、五階段）一律「先捲動、由 spy 寫網址」，不可 `router.push`。按一次返回就離開本頁。
- 點導覽：JS 平滑捲動；捲動期間暫停 spy，直到 `scrollend` 或連續 150ms 沒有 scroll 事件，上限 2.5 秒。`prefers-reduced-motion` 時不做平滑。
- 深連結：帶 `:section` 進站時，版面就緒後直接定位（不做動畫）。未知 id 回頂部。
- 自動展開「看全部」只在進站那一次（`onMounted`）對深連結的模組執行，不可綁在 `route.params.section` 上（否則捲到哪展開到哪，版面在手指下跳動）。
- `scroll-margin-top`：≥768px 為 112px；<768px 為 64px。

**看全部**：`<button aria-expanded>`，原地展開，不可把畫面往上推。

**截圖放大**（只有真實截圖可點；示意圖不可）：
- 全螢幕燈箱，顯示的範圍和頁面上的裁切相同，不可露出原圖被裁掉的部分。
- ≥768px：預設符合視窗；點圖在「符合視窗」與「放大 2 倍可捲動」間切換。
- <768px：桌機截圖直接以放大狀態開啟（寬 300vw，可雙向捲動，起點左上），點一下切回符合視窗；手機截圖維持符合視窗高度。
- Esc、背景、44px 關閉鈕（固定在右上，不隨圖捲動）可關；開啟時鎖住背景捲動；關閉後焦點回到原縮圖。

**分享**：
- 分享鈕開面板（手機為底部面板、桌機為置中對話框）：目前章節的完整網址、複製鈕、該網址的 QR Code；支援 `navigator.share` 時多一個「分享」鈕。
- 每個模組標題旁一個連結小圖示，點了複製該模組網址，顯示「已複製連結」短訊息。
- 網址一律保留目前頁面上的 `utm_source`／`utm_medium`／`utm_campaign`。
- 複製：先試 `navigator.clipboard.writeText`，失敗退回 `document.execCommand('copy')`（LINE 內建瀏覽器常擋 clipboard API）。
- `qrcode` 用動態 `import()`，開面板或捲到最終區才載入。

**手機底部列**（<768px）：高 56px＋safe-area，左「LINE 洽詢」、右「免費試用」。捲過首屏才出現，最終區與頁尾進入畫面時隱藏。頁面底部留相應空間，不可遮住內容。

**列印**：只做最低限度 `@media print`：隱藏頂欄、模組列、底部列、分享鈕；展開所有收合內容。

## 7. 視覺

- 方向：「建築圖紙般的冷靜精準」。白底為主，深色只當開頭與結尾。和首頁、deck 同一套 token，class 前綴 `pp-`，樣式 scoped。
- 色彩：主色 `#2F6BFF`（hover `#1F4FD1`）、黑 `#0B0B0F`、深色區底 `#070A14`、soft `#F5F6F8`、內文 `#111827`、次要文字 `#4B5563`、邊框 `#E5E7EB`。小字不用 `#6B7280` 放在 soft 底上。不給各模組不同強調色。
- 深色區光暈只用一顆：`radial-gradient(900px 520px at 85% 0%, rgba(47,107,255,.28), transparent 60%)`。
- 本頁識別：模組大編號（01–14，等寬數字、極淡）；首屏與群標題帶可用 1px 細格線底紋（很淡）。
- 字體：`'Inter', 'Noto Sans TC', system-ui, -apple-system, 'Segoe UI', sans-serif`。

  | 層級 | 桌機 | 手機 | 行高 |
  |---|---|---|---|
  | H1 | 64 | 36 | 1.15 |
  | H2（模組標題） | 44 | 28 | 1.22 |
  | H3（重點標題） | 22 | 19 | 1.4 |
  | 內文 | 17 | 16 | 1.8 |
  | 註記 | 14 | 13 | 1.6 |

  標題字重 700、字距 -0.02em、`text-wrap: balance`；中文標題在逗號後斷行，避免單字孤行。
- 版面：容器 `min(1200px, 100% - 48px)`，手機左右留白 20px、平板 32px。區塊上下間距 112px（手機 64px）。
- 模組區塊：≥1100px 左右兩欄（文 5：圖 7），逐個左右交替，背景白／soft 交替；<1100px 單欄，文在上、圖在下，圖寬上限 720px 置中。
- 卡片：圓角 20px、1px 邊框、陰影 `0 1px 2px rgba(15,23,42,.04), 0 12px 32px rgba(15,23,42,.06)`。截圖框用重陰影 `0 30px 70px rgba(15,23,42,.18)`。
- 圖示：mdi outline 為主，24px，放在 44px、圓角 12px、`rgba(47,107,255,.08)` 底的方塊裡。
- 數字：`tabular-nums`、56px、700；單位 18px 次要色（手機見 §5.1）。
- 動效：進場用 `v-reveal`（位移 16px＋淡入、0.6s、`cubic-bezier(.2,.7,.2,1)`、同組錯開 80ms、只播一次）。`.reveal` 的 CSS 在 LandingPage 的 scoped 樣式裡，本頁要自備。hover：卡片上移 2px、邊框轉主色、0.2s。`prefers-reduced-motion` 全關。
- 不做：滿版紫藍漸層、emoji 當圖示、3D 插畫或圖庫人像、玻璃擬態疊滿版、每模組一色、截圖傾斜透視、波浪或斜切分隔。

### 截圖框與裁切

- 瀏覽器框：圓角 14px、頂列高 26px、淺色頂列 `#EEF0F4`。手機框：圓角 32px、8px 邊，統一比例 780:1430。
- 每張截圖在 `productPage.js` 帶 `crop: { x, y, w, h }`（原圖 px）。截圖框 `aspect-ratio: w / h; overflow: hidden`，`<img>` 設 `width: (原圖寬 / w) × 100%`、`margin-left: -(x / w) × 100%`、`margin-top: -(y / w) × 100%`。燈箱套用同一個裁切。

| 截圖（原圖尺寸） | 裁切（原圖 px） |
|---|---|
| `sales-grid`（3200×2000） | x704 y548 w1760 h990 |
| `sales-parking`（3200×2000） | x80 y328 w2830 h1592 |
| `sales-mobile`（780×1688） | x0 y0 w780 h1430 |
| `vip-form-mobile`（780×1688） | x0 y128 w780 h1430 |
| `booking-page-mobile`（780×1688） | x0 y256 w780 h1430 |
| `website-1`、`website-2`（1600×900） | 不裁 |

- 上表數值是美術目視估的。**實作時每張都要自己開圖核對**：裁切後不可看到「測試建案」「TESTA」「TEST」或問題回報浮動鈕；有就調整數值。
- 不可使用：`customer-list`、`customer-log`（未確認）、`sales-quote`（裁完和 `sales-grid` 幾乎相同）、`booking-calendar`、`booking-batches`、`inspection-record-mobile`、`inspection-tracking`、`inspection-report`（含測試資料且裁不掉）。

### 示意圖規範

10 個示意圖共用一個外框元件，內容只用 5 種零件：表格、對話、長條、狀態矩陣、數字卡。

- 外框：和截圖同一種瀏覽器框。「示意畫面」固定在頂列右端，12px `#4B5563`。
- 畫布：白底；內距 20px（手機 14px）；≥768px `aspect-ratio: 16 / 10`、內容垂直置中；手機高度自動、`min-height: 220px`。流式排版，不用等比縮放。
- 字級三級：標題 14px／600；內容 13px／500（手機 12px）；表頭與輔助 12px `#4B5563`（手機 11px）。這是「輔助字 ≥13px」的唯一例外，整塊設 `role="img"`＋`aria-label`。數字 `tabular-nums`。
- 色塊：表頭與次層底 `#F5F6F8`；線 1px `#E5E7EB`；每個示意圖只有一處主色強調。
- 狀態籤：高 22px、圓角 6px、12px／600，四種：紅 `#B91C1C`／`#FEF2F2`、橘 `#B45309`／`#FFFBEB`、綠 `#15803D`／`#F0FDF4`、藍 `#1F4FD1`／`rgba(47,107,255,.08)`（字色／底色）。
- 尺寸：列高 36px（手機 32px）；內卡圓角 10px；間距 12px；長條高 8px、圓角 4px、軌道 `#E5E7EB`。
- 對話：泡泡圓角 14px、最寬 78%；使用者 `#2F6BFF` 白字，AI `#F5F6F8`。
- 內容上限：表格 ≤4 欄 × ≤5 列、每格 ≤6 字；對話 ≤3 則。360px 寬不可溢出。
- 示意圖內不加陰影、漸層；圖示只用 mdi 16px。

## 8. 手機、相容性、無障礙、效能

- 斷點：手機 <768、平板 768–1099、桌機 ≥1100。360–1920px 都不可出現水平捲動（含示意圖；橫向溢出用 `overflow-x: clip`，不要在 sticky 的祖先放 `overflow: hidden`）。
- 手機內文 ≥16px、輔助字 ≥13px（示意圖內例外）。觸控目標 ≥44×44px、間距 ≥8px。
- 高度用 `100dvh`，前面保留 `100vh` 後備。`backdrop-filter` 加 `-webkit-` 前綴並給不透明底色後備。
- 導覽用 `<nav aria-label>`；按鈕都是 `<button>`；focus 外框 2px `#2F6BFF`、外擴 2px；只用鍵盤可走完全頁。
- 所有 `<img>` 寫 `width`／`height`（或 `aspect-ratio`）與有意義的 alt；首屏圖 eager，其餘 `loading="lazy" decoding="async"`。
- 不 import firebase、`api.js`、ag-grid 等大型套件；本頁不發任何 Cloud Function 請求。

## 9. CTA 與追蹤

- 試用連結：`router.push({ name: 'TrialSignup', query })`，`source` 取值：`product-top`（頂欄）、`product-hero`、`product-bar`（手機底部列）、`product-pricing`、`product-start`、`product-qr`。同時轉帶目前網址上的 `utm_*`。
- LINE：`https://lin.ee/rBZmaUG`；電話：`0980-371-014`（搬到共用檔，deck 一併改用）。
- 業務個人代碼：不新增參數，用既有的 `utm_campaign=<代號>`。
- **既有缺口修正**：`TrialSignup.vue` 把 `?source=` 存進 `utm.entry`，但送出時 `source` 寫死 `'trial-page'`（約 237 行），後端又不存 `entry`，後台分不出名單來自 deck 還是本頁。改成 `source: utm.entry || 'trial-page'`。已確認 `'trial-page'` 沒有其他地方依賴。
- 連帶修正：首頁 `LandingPage.vue` 的 `goTrial(position)`（約 527 行）目前送 `hero`／`nav`／`pricing`／`bottom`，沒有前綴，會和本頁的值看混。改成 `` source: `landing-${position}` ``。

## 10. 業務入口

- `ProspectManager.vue`：在頁面既有的工具列放一個按鈕「產品介紹連結」，點了複製 `<origin>/#/product?utm_source=prospect`，並顯示「已複製」。樣式沿用該頁既有按鈕，不加說明文字。該頁左上要避開全站漢堡鈕（左上 50×50px 禁區）。
- 首頁功能介紹區的文字連結「完整功能介紹」。

## 11. 驗收條件

1. 未登入開 `/#/product` 可完整瀏覽，不跳登入，不出現問題回報浮動鈕。
2. 開 `/#/product/commission`（及任一模組 id）直接定位到該模組，標題不被 sticky 列蓋住，該模組為展開狀態。
3. 捲動時模組列高亮與網址同步，**捲動過程不會被拉回章節頂**；重新整理停在同一章節；頁內跳轉多次後按一次返回就離開本頁。
4. 360、390、430、768、1024、1440、1920 寬度都沒有水平捲動、沒有文字被截斷或重疊。
5. sticky 列在 Chromium 與 WebKit 都有效；手機底部列不遮內容。
6. 390px 寬：H1、副標、兩顆 CTA 在距頂 600px 內；痛點＋全流程＋角色捷徑合計 ≤1,900px；目錄面板可開、可跳到「方案價格」。
7. 每個模組都有示意畫面（`admin` 除外），沒有空白區塊、沒有破圖。
8. 價格與 `productPlans.js` 一致。
9. 各 CTA 帶正確 `source` 與 `utm_*`；`TrialSignup` 送出的 `source` 為 `product-*`，首頁 CTA 為 `landing-hero` 等（攔截請求驗證，不可真的送出名單）。
10. 複製連結與 QR 指向目前章節並保留 `utm_*`。
11. 全頁（含燈箱）不出現「TEST」「測試」字樣，除形象網站兩張作品截圖外不出現建案名稱。
12. console 無錯誤；本頁沒有發出 cloudfunctions／firestore 請求。
13. `/deck` 各頁畫面與改動前一致（至少比對封面、一個功能頁、痛點、平台總覽、理由、價格、試用頁）；首頁正常。
14. `npm run build`（含 `vue-tsc`）通過。

## 12. 試用後的修訂

測試人員試用後調整，與前面章節衝突時以本節為準。

- **模組列**：「目錄」鈕改為膠囊放不下就顯示（不綁 1100px），帶「目錄」文字；背景不透明白。≥768px 頂欄加「方案價格」連結。
- **首屏**：CTA 下方加文字連結「看方案價格」。<380px 數字縮小。平板不強制撐滿視窗。
- **群標題帶**：不放編號，避免和模組編號 01–14 混淆。
- **模組標題**：複製連結鈕移到眉標那一列右端。
- **桌機模組**：示意欄 sticky（top 136px），跟著文字欄往下。
- **示意圖**：≥768px 字級 15／14／13px、列高 40px，內容撐滿畫布，畫布高度自動（不強制 16:10）。
- **車位**：`sales-parking` 截圖縮小後看不清，改示意圖（統計數字卡＋車位狀態矩陣）。示意圖共 11 個。
- **交屋控管示意圖**：改為棟別 × 樓層矩陣，每格一個狀態籤，與文案一致。
- **開始試用**：<768px 不顯示 QR（客戶無法掃自己的螢幕），文案改為點按鈕；第一步文字本頁自訂為「留下資料」。
- **價格卡按鈕**：形象網站兩張卡與「請洽詢報價」的卡改為「LINE 洽詢」。
- **斷行**：全流程項目只在「・」換行；重點說明用 `line-break: strict` 與 `word-break: auto-phrase`，個別詞渲染時包 nowrap（不改共用文案字串）。
- **手機橫拿**（高度 <500px）：頂欄不 sticky、首屏不放手機框。
- **視窗寬度改變**：依改變前的章節重新定位。
- **ProspectManager**：按鈕改為只有圖示（`title`「產品介紹連結」），避免標題列折行。

## 13. 範圍外

後台內容管理、多語系、影片、頁內留資表單、瀏覽統計、重拍截圖、專屬 OG 分享預覽（hash 路由下 LINE 只會顯示首頁的 OG）、deck 的版面或示意圖調整。
