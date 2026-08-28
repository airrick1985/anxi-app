# SPEC：首頁改版 ＋ 開始試用（留資）＋ 試用留資管理／廣告 Email ＋ Home 導覽

> 版本：v1（2026-08-28 討論定稿）
> 相關檔案：[LandingPage.vue](../src/views/LandingPage.vue)、[Login.vue](../src/views/Login.vue)、[Home.vue](../src/views/Home.vue)、[DefaultLayout.vue](../src/layouts/DefaultLayout.vue)、[router/index.js](../src/router/index.js)、[store/user.js](../src/store/user.js)、[functions/index.js](../../functions/index.js)

---

## 0. 已確認設計決策（來自需求討論）

| 項目 | 決策 |
|---|---|
| 首頁風格 | 參考「Yapay」版型：固定頂欄、滿版 Hero、白底大標、藍色主打卡＋功能卡片、深色 Footer |
| 首頁主色 | 電光藍 `#2F6BFF`（**只用於首頁與試用頁**；系統內 Vuetify 主色 `#1976D2` 不動） |
| Hero 主標 | **「從案場銷控到交屋驗屋，一個平台全部搞定」** |
| 頂欄右側 | 「登入」（→ `/login`）＋「開始試用」（→ `/trial`） |
| Hero CTA | 主：「開始試用 →」；次：「LINE 洽詢」（保留） |
| 功能介紹 | 每系統：大標題＋文案＋重點畫面截圖；文字捲動時 **模糊→清晰** 浮現 |
| 截圖素材 | 由 Claude 以 DEMO 建案實際畫面擷取（形象網站／電子表板除外，見 §2.6） |
| 試用帳號 | **共用固定帳號 `TESTA` / 密碼 `TESTA`**，無期限、無座位問題（`allowMultiLogin: true`、訂閱座位加大，由使用者手動設定） |
| 試用不建帳號 | `開始試用` 表單**只留資**（姓名／電話／Email／服務公司／個人或公司），送出後前端以 TESTA 自動登入 → `/home?tour=1` |
| 試用帳號限制 | 不能修改帳號／密碼／個人資料；不可用「忘記密碼」；隱藏管理類功能；DEMO 建案封鎖對外 LINE／Email／簡訊 |
| 沙盒 | 共用 DEMO 建案，**每日 04:00（Asia/Taipei）自動重置** |
| 留資通知 | **Email 寄給所有超級管理員**（不推 LINE） |
| 留資管理 | 超管專用頁：查看名單、標籤（不聯絡／有興趣／已訂閱…）、備註、活動紀錄 |
| 廣告 Email | 富文字編輯器＋附件上傳＋範本管理＋一次群發多位留資用戶＋寄送紀錄 |
| 導覽 | 第一版只做 **Home**；僅試用帳號顯示；只導覽該帳號看得到的功能；「?」可重新開始 |
| 不做 | 手機 OTP、試用期／到期 CTA、系統頁內導覽（第二版） |
| 採用 | 截圖素材規格化、SEO/分享 meta、事件追蹤 |

---

## 1. 範圍

### In scope
1. `LandingPage.vue` 全面改版（版型、配色、動效、截圖素材、SEO meta）
2. 新頁 `/trial`（開始試用留資表單）＋ Cloud Function `submitTrialLead`（寫入 `trialLeads`、Email 通知超管、回傳試用登入資訊）
3. 試用帳號辨識與限制（`isTrial` 旗標、個人資料唯讀、忘記密碼拒絕、Home 隱藏管理功能、頂欄測試環境提示條）
4. DEMO 建案對外通知封鎖（LINE／Email／簡訊 helper 統一守衛）
5. 沙盒每日重置（範本快照＋排程還原）
6. 超管「試用留資管理」頁（名單／篩選／標籤／備註／活動紀錄／匯出）
7. 廣告 Email 編輯器（Tiptap）＋附件＋範本＋群發＋寄送紀錄（Cloud Function `sendMarketingEmail`）
8. Home 導覽（shepherd.js，權限過濾後的按鈕清單）＋「?」重看＋事件追蹤
9. `systemSettings/trial` 集中設定（試用帳號、DEMO 建案 ID、重置開關等）

### Out of scope
- 各系統頁內導覽（銷控表、客資等）— 留待第二版，但本次機制（`useOnboardingTour` + `data-tour` 錨點）需可直接擴充
- 試用期限、到期提醒、升級 CTA
- 手機／Email OTP 驗證
- Firebase Storage 檔案（圖檔、附件）的沙盒重置（只重置 Firestore 文件）
- 電子報退訂系統（僅以「不聯絡」標籤自動排除）

---

## 2. 首頁改版（LandingPage.vue）

### 2.1 頁面結構（由上而下）

```
┌───────────────────────────────────────────────────────────────┐
│ [ANXI logo]     產品功能  方案價格  聯絡我們     [登入] [開始試用] │  A 頂欄（fixed）
├───────────────────────────────────────────────────────────────┤
│  從案場銷控到                    ┌────────────────┐            │  B Hero
│  交屋驗屋，                      │ 玻璃卡：A棟 12F  │            │
│  一個平台全部搞定                 │ 已售 ✓ 2,880萬  │            │
│  (副標)                          └────────────────┘            │
│                        銷控報價、客資、預約、驗屋修繕、    [開始試用 →] │
│                        形象網站，一站整合。            LINE 洽詢    │
├───────────────────────────────────────────────────────────────┤
│                 一站式建案管理平台                                 │  C 價值主張
│         從銷售、客資、預約到驗屋交屋，資料一次到位                    │
│  ┌──────────────────────────────────────────────────────────┐  │  D 藍色主打卡
│  │ 雲端銷控／報價系統  文案 + 右側斜排截圖拼貼                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │  E 功能總覽卡 ×4
│  │客戶管理  │ │線上預約  │ │驗屋/修繕 │ │形象網站  │              │
│  │文案      │ │文案      │ │文案      │ │文案      │              │
│  │[裁切截圖]│ │[裁切截圖]│ │[裁切截圖]│ │[裁切截圖]│              │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
├───────────────────────────────────────────────────────────────┤
│  F 功能深入介紹 ×5（左右交錯）                                    │
│  [截圖輪播]        大標題 + 文案 + 重點功能 chips                  │
│  大標題 + 文案     [截圖輪播]                                     │
├───────────────────────────────────────────────────────────────┤
│  G 方案價格（沿用現有資料，tab 切換系統，改新配色）                   │
├───────────────────────────────────────────────────────────────┤
│  H 黑底 CTA 帶：「今天就開始試用」 [開始試用] [LINE 洽詢]           │
├───────────────────────────────────────────────────────────────┤
│  I 深色 Footer（沿用現有內容：聯絡、隱私權、服務條款）               │
└───────────────────────────────────────────────────────────────┘
```

### 2.2 各區塊規格

**A 頂欄**
- `position: fixed`，高度 64px；Hero 上方為透明＋白字，捲動超過 40px 後轉 `rgba(255,255,255,.85)` + `backdrop-filter: blur(12px)` + 深色字（`scrolled` class）。
- 左：`public/anxi-logo.png` + 「ANXI」；中：錨點連結 `#features` `#pricing` `#contact`（平滑捲動）；右：「登入」＝白底/透明 pill outlined，「開始試用」＝`#2F6BFF` 實心 pill。
- 手機（<960px）：只留 logo、「開始試用」、漢堡（展開含 登入／產品功能／方案價格／聯絡我們）。
- 頂欄「登入」`router.push({ name: 'Login' })`；「開始試用」`router.push({ name: 'TrialSignup' })`。

**B Hero**（2026-08-28 改為背景影片、佔滿整個視窗）
- 背景：`<video autoplay muted loop playsinline>`，來源 `public/video/hero-desktop.(webm|mp4)`（16:9）與 `hero-mobile.(webm|mp4)`（9:16，由桌機版置中裁切），依 `(orientation: portrait) and (max-width: 959px)` 切換；皆無音軌。poster／缺檔／`prefers-reduced-motion` 時退回 `src/assets/landing/hero-poster.webp`（影片首幀）。
- 高度：`min-height: 100dvh`（任何瀏覽器比例都只看到 Hero，往下捲才出現下一區段），底部有「向下探索」提示。
- 對比：遮罩為上 .28／下 .66 的垂直漸層＋左側 .22 的水平漸層；標題與說明文字加 text-shadow；黑色 CTA 膠囊邊框 rgba(255,255,255,.38)。
- 左上主標：三行、`clamp(2.4rem, 5vw, 4.5rem)`、字重 600、白字、`letter-spacing:-0.02em`。文案固定為「從案場銷控到交屋驗屋，一個平台全部搞定」（斷行：從案場銷控到／交屋驗屋，／一個平台全部搞定）。
- ~~中央「玻璃卡」~~：已依使用者要求移除（2026-08-28）。
- 右下：短文案（2 行）＋主 CTA「開始試用 →」（黑底白字 pill，右側藍色圓形箭頭，同參考圖）＋次 CTA「LINE 洽詢」（白字文字鈕，`href=https://lin.ee/rBZmaUG`）。
- 進場動畫：主標逐行 `fadeUp` 錯開 120ms。

**C 價值主張**：白底、置中、H2 `clamp(2rem,4vw,3.2rem)`、副標灰字，套 `v-reveal`。

**D 藍色主打卡**（雲端銷控／報價系統）
- 背景 `#2F6BFF`，圓角 28px，最小高 420px；左下白字標題＋文案；右側 3 張截圖以 `rotate(-8deg)` 錯位堆疊（桌機），手機改單張。
- 點擊卡片 → 平滑捲動至 F 區對應段落。

**E 功能總覽卡 ×4**：白底、1px `#E5E7EB` 邊、圓角 24px、`hover` 上浮 4px；標題／文案／底部裁切截圖（`overflow:hidden`，截圖 `object-position: top`）。桌機 4 欄、平板 2 欄、手機 1 欄。點擊亦捲動至 F 區。

**F 功能深入介紹 ×5**
- 每系統一段 `<section :id="product.id">`，桌機左右各 50%、奇偶交錯；手機圖上文下。
- 文字側：eyebrow（系統名）、H3 slogan、description、`v-chip` 列出 `features` 前 6 項（沿用現有資料）；整組套 `v-reveal` 逐項延遲 80ms。
- 圖片側：截圖輪播（`v-carousel` hide-delimiters=false、自動 5s、`cycle`），外框依裝置別套「桌機視窗框」或「手機框」樣式（CSS 製作，不用圖片）。
- 資料來源：現有 `products` 陣列擴充 `screens: [{ src, alt, frame: 'desktop'|'mobile' }]`。

**G 方案價格**：沿用現有 `pricing` / `notes` 資料與 tab 切換，卡片改白底＋`#2F6BFF` 推薦邊框，推薦卡背景改黑底白字；「立即諮詢」保留 LINE 連結。

**H CTA 帶**：`#0B0B0F` 底、白字 H2「今天就開始試用」、副標、兩顆按鈕（開始試用＝藍實心、LINE 洽詢＝白 outlined）。

**I Footer**：沿用現有，底色改 `#0B0B0F`。

### 2.3 配色 / 字體 Token（首頁 scoped CSS 變數）

| Token | 值 | 用途 |
|---|---|---|
| `--lp-primary` | `#2F6BFF` | CTA、主打卡、chip、連結 |
| `--lp-primary-dark` | `#1F4FD1` | hover |
| `--lp-black` | `#0B0B0F` | 頂欄按鈕、CTA 帶、Footer |
| `--lp-bg` | `#FFFFFF` | 主底 |
| `--lp-bg-soft` | `#F5F6F8` | 區塊交錯底 |
| `--lp-text` | `#111827` | 標題 |
| `--lp-muted` | `#6B7280` | 文案 |
| `--lp-border` | `#E5E7EB` | 卡片邊 |
| 字體 | `'Inter', 'Noto Sans TC', system-ui` | 全頁（index.html 加 Google Fonts preconnect + link，`display=swap`） |

### 2.4 捲動「模糊→清晰」特效（`v-reveal` 指令）

- 新增 `src/directives/vReveal.js`，於 `main.js` 全域註冊 `app.directive('reveal', vReveal)`。
- 初始 style：`opacity:0; filter: blur(14px); transform: translateY(18px)`；IntersectionObserver（`threshold: 0.2`, `rootMargin: 0px 0px -10%`）進視窗後加 `is-visible` → `opacity:1; filter: blur(0); transform: none`，`transition: 700ms cubic-bezier(.2,.7,.2,1)`；只觸發一次（`unobserve`）。
- 修飾／參數：`v-reveal="{ delay: 80 }"` 設定延遲 ms；父層可用 `v-reveal-group` 讓子元素依序自動 +80ms（實作：指令對 `[data-reveal-item]` 子元素依 index 設 `transition-delay`）。
- `@media (prefers-reduced-motion: reduce)`：不套 blur/transform，只淡入 300ms。
- 特效套用範圍：C/D/E/F/G/H 區的標題、文案、chip、卡片。

### 2.5 SEO / 分享

- `index.html`：`<title>ANXI 建案管理系統｜銷控報價・客資・預約・驗屋修繕一站整合</title>`、`meta description`、`og:title/description/image/url`、`twitter:card=summary_large_image`、`theme-color=#2F6BFF`。
- `public/og-image.png`（1200×630）：由 Hero 版面輸出（Claude 製作）。
- 首頁為 hash 路由，meta 為全站靜態即可；`robots.txt` 已存在不動。

### 2.6 截圖素材規格（回答「需要提供哪些素材」）

存放：`src/assets/landing/{system}/{name}.webp`；桌機截圖 **1600×1000（2x DPR）**、手機截圖 **780×1688（390×844 @2x）**；WebP 品質 80、單檔 ≤ 250KB；全部 `loading="lazy"`（Hero 除外）。

Claude 以本機啟動 app、登入 TESTA、進 DEMO 建案擷取（Playwright，`deviceScaleFactor: 2`），必要時後製裁切、遮蔽個資：

| 系統 | 檔名 | 畫面 | 框型 |
|---|---|---|---|
| sales | `sales-grid` | 銷控表格模式（含狀態色塊） | desktop |
| sales | `sales-quote` | 報價單設定／預覽 | desktop |
| sales | `sales-parking` | 車位銷控圖面 | desktop |
| sales | `sales-mobile` | 手機版報價戶別選擇 | mobile |
| customer | `customer-list` | 客資列表（客資系統） | desktop |
| customer | `customer-log` | 客戶洽談紀錄／客戶詳情 | desktop |
| customer | `vip-form-mobile` | 貴賓資料表（客戶手機填寫） | mobile |
| booking | `booking-calendar` | 預約時間表（後台） | desktop |
| booking | `booking-page-mobile` | 客戶線上預約頁 | mobile |
| booking | `booking-batches` | 批次／時段規則設定 | desktop |
| inspection | `inspection-record-mobile` | 驗屋紀錄拍照標記 | mobile |
| inspection | `inspection-tracking` | 缺失改善追蹤列表 | desktop |
| inspection | `inspection-report` | PDF 驗屋報告預覽 | desktop |
| website | `website-1`, `website-2` | 形象網站首頁、電子表板畫面 | desktop |

**需由使用者提供**：`website-1`、`website-2`（形象網站／電子表板為外部作品，系統內無畫面）；未提供前以品牌色佔位圖呈現。Hero 背景若要換新照片亦請提供（建議 2400×1350，人物＋案場／平板操作情境）。

---

## 3. 開始試用（留資 → 自動登入 TESTA）

### 3.1 路由與頁面

- 新路由 `/trial`，`name: 'TrialSignup'`，`meta: { requiresAuth: false, layout: PublicLayout }`；新頁 `src/views/TrialSignup.vue`。
- 已登入者進 `/trial` → 直接 `next({ name: 'Home' })`（比照 `/` 的守衛邏輯）。
- 版面：左（桌機）品牌側欄——`#2F6BFF` 底、「開始免費試用」標題、3 點賣點、玻璃卡；右：白底表單卡。手機：表單為主、品牌側縮為頂部橫幅。

### 3.2 表單欄位

| 欄位 | 必填 | 驗證 |
|---|---|---|
| 姓名 `name` | ✔ | 2–30 字 |
| 手機 `phone` | ✔ | `^09\d{8}$`（台灣手機） |
| Email `email` | ✔ | RFC 基本格式 |
| 服務公司 `company` | ✔ | 1–60 字（個人使用可填「個人」） |
| 使用型態 `useType` | ✔ | `personal` / `company`（segmented button） |
| 想了解的系統 `interests[]` | ✘ | 多選 chip：銷控報價／客資／預約／驗屋修繕／形象網站（幫助跟進） |
| 同意條款 `agree` | ✔ | 勾選「我已閱讀並同意 隱私權政策 與 服務條款」 |
| honeypot `website` | 隱藏 | 有值即靜默丟棄 |

送出按鈕：「送出並開始試用 →」；loading 期間 disabled；成功後全頁轉場「正在為您準備測試環境…」→ 自動登入 → `/home?tour=1`。

### 3.3 Cloud Function `submitTrialLead`

`onCall({ region: 'asia-east1', memory: '512MiB', secrets: gmailSecrets })`

1. 驗證欄位（同 §3.2）；honeypot 有值 → 回 `success` 但不寫入。
2. 讀 `systemSettings/trial`（§9）；`enabled !== true` → `failed-precondition: 試用功能暫停`。
3. 去重：查 `trialLeads` where `phone == phone`：
   - 已存在 → 更新 `lastSeenAt`、`submitCount +1`、覆蓋 name/email/company/useType/interests（保留 tags/notes/status），不重寄通知（除非距上次通知 > 24h）。
   - 不存在 → 新建（欄位見 §3.4），`status: 'new'`，寄通知。
4. 頻率限制：同 `phone` 60 秒內重複送出 → 直接回傳既有 leadId（不報錯）。
5. Email 通知：`users` where `roles array-contains '超級管理員'` 且 `email` 非空；主旨「【ANXI】新試用申請：{name}／{company}」；內容表格（所有欄位＋時間＋來源 UA）＋按鈕連結 `https://{host}/#/admin/trial-leads?lead={leadId}`。寄信失敗只 log，不影響回傳。
6. 回傳 `{ status: 'success', leadId, trial: { key: settings.accountKey, password: settings.password } }`。

### 3.4 `trialLeads/{leadId}` 資料結構

```js
{
  name, phone, email, company, useType: 'personal'|'company', interests: [],
  status: 'new' | 'contacted' | 'subscribed' | 'archived',   // 主狀態（與標籤分開）
  tags: ['有興趣'],                                          // 多標籤，見 §5.3
  notes: [{ id, text, author, createdAt }],                  // 留言式備註
  source: 'landing' | 'trial-page', utm: { source, medium, campaign }, userAgent, referrer,
  submitCount: 1, loginCount: 0, tourCompleted: false,
  events: [{ type, at, meta }],                               // 見 §8
  emailLogs: [{ campaignId, subject, sentAt, status }],       // 見 §6
  createdAt, updatedAt, lastSeenAt, lastLoginAt, lastNotifiedAt
}
```

### 3.5 前端自動登入流程（TrialSignup.vue）

```
submitTrialLead(form)
  └─ success → sessionStorage['anxi-trial-lead'] = leadId
             → sessionId = uuidv4(); loginUser(trial.key, trial.password, sessionId)   // 既有 api.loginUser / handleLogin
             → userStore.setUser(result.user, sessionId)（比照 Login.vue submit 流程）
             → trackTrialLeadEvent(leadId, 'auto_login')
             → router.replace({ name: 'Home', query: { tour: '1' } })
  └─ 登入失敗（帳號被停用等）→ 顯示「測試環境暫時無法登入，請以 LINE 洽詢」＋ LINE 按鈕
```

### 3.6 試用帳號辨識

- `users/TESTA` 由使用者手動設定：`isTrial: true`、`allowMultiLogin: true`、roles／`userPermissions` 指向 DEMO 建案、各系統 `subscriptions` 座位加大。
- `handleLogin` 回傳的 `userObject` **新增 `isTrial: userData.isTrial === true`**；`fetchUserByUserKey` / `fetchUserByLineId` 同步帶入。
- `store/user.js` 新增 getter `isTrialUser: (s) => s.user?.isTrial === true`（已透過 persist 保存於 sessionStorage）。

### 3.7 試用帳號限制

| 位置 | 行為 |
|---|---|
| `EditProfileDialog.vue` / `UserProfile.vue` | `isTrialUser` → 所有欄位唯讀、隱藏「修改密碼」「儲存」，顯示提示「測試帳號無法修改個人資料」 |
| `api.updateUserProfile` / 密碼變更（前端） | `isTrialUser` 直接 return 錯誤，不呼叫 |
| `forgotPasswordSender`（後端） | 目標 `users/{key}.isTrial === true` → `permission-denied: 測試帳號不提供密碼重設`（避免 TESTA 密碼被重設） |
| `updateUserPreferences`（後端） | `isTrial` → 仍允許（僅影響偏好），但沙盒重置時還原 `preferences` |
| `Home.vue` 按鈕 | 新增欄位 `hideForTrial: true`：`backupManagement`、`subscriptionManagement`、`UserManagement`、`subscriptionStatus`、`sendMessage`、`smsMonitor`、`adminToolsCenter`、`bookingTest`、`trialLeads`（§5）；過濾時 `isTrialUser && hideForTrial` → 隱藏 |
| `DefaultLayout.vue` | `isTrialUser` 時於 app-bar 下方顯示 `v-banner`（藍底白字、可收合、sessionStorage 記住）：「測試環境：資料每日 04:00 重置，系統不會發送真實 LINE／Email／簡訊」 |
| 登入頁 `/login` | 不做特別處理（試用者不會經過登入頁；若手動以 TESTA 登入亦視為試用） |

---

## 4. DEMO 沙盒

### 4.1 對外通知封鎖（後端）

- 新增 `functions/utils/trialGuard.js`：
  ```js
  async function isTrialProject(projectId)   // 讀 systemSettings/trial.projectIds，記憶體快取 5 分鐘
  async function guardedSendMail(transport, mailOptions, { projectId, force })  // force=true 略過守衛
  async function guardedLinePush(fn, args, { projectId })
  ```
- 守衛規則：`blockOutbound === true` 且 `projectId ∈ projectIds` → **不送、log `[TrialGuard] blocked {type} for {projectId}`、回傳 `{ blocked: true }`**（對呼叫端視同成功，不改變既有流程與回傳格式）。
- 接入點：
  1. LINE：`functions/index.js` 3 個 push/multicast helper（約 L24393、L24464、L24882）與 `notifications/*.js` 內的發送函式，統一先過 `isTrialProject`。
  2. Email：所有帶有 `projectId` 語境的 `sendMail(` 呼叫（約 20 處）改為 `guardedSendMail(...)`；無 projectId 語境者（忘記密碼、留資通知、廣告 Email、錯誤通知）維持原樣。
  3. 簡訊：簡訊發送 helper（`functions/sms/`）同樣接入。
- 前端不需改動；試用者操作仍顯示「已發送」，由頂欄 banner 說明不會真的送出。

### 4.2 每日重置

**範本快照**（超管操作，一次性＋日後更新）
- 於「試用留資管理 → 沙盒設定」tab 提供「建立／更新沙盒範本快照」按鈕 → Cloud Function `snapshotTrialSandbox`（512MB）。
- 快照範圍＝`systemSettings/trial.sandboxCollections`（可在 UI 勾選），預設清單（皆以 `projectId ∈ projectIds` 或 `projectName ∈ projectNames` 條件篩選）：
  `households, appointments, leads, vipGuests, contactLogs, calendarNotes, salesHouseholds, salesParkings, salesParameters, salesSVGs, salesImages, parkingFloorPlans, parkingSpotLayouts, inspectionRecords, inspectionOptions, cancelledPurchases, bookingBatches, batchRuleLinks, dateRules, timeSlotRules, activityMessages, customFormTemplates, customerFieldSettings, projectSettings, retentionPayouts, bonusRecords, commissionRecords, commissionUnitLedgers`
  另加 `users/TESTA.preferences`、`projects/{DEMO}` 文件本體。
- 快照寫入 `trialSandboxTemplates/{collection}/docs/{docId}`（原 docId 保留），並記錄 `trialSandboxTemplates/_meta { snapshotAt, counts }`。
- 執行前 UI 需二次確認並顯示各集合筆數預覽（dry-run 回傳 counts）。

**排程還原**
- `resetTrialSandbox`：`onSchedule({ schedule: '0 4 * * *', timeZone: 'Asia/Taipei', region: 'asia-east1', memory: '512MiB' })`；`systemSettings/trial.resetEnabled !== true` 則跳過。
- 步驟：逐集合 (1) 查出目前 DEMO 條件下的所有文件，批次刪除（500/批）；(2) 由範本批次寫回；(3) 還原 `users/TESTA.preferences`；(4) 寫 `trialSandboxResets/{date} { startedAt, finishedAt, counts, errors }`。
- UI 提供「立即重置」按鈕（呼叫同一邏輯的 onCall 版本 `resetTrialSandboxNow`），並顯示最近 7 次重置紀錄。
- 失敗時以既有 `sendErrorNotification` 寄超管。

---

## 5. 試用留資管理（超級管理員）

### 5.1 入口

- 路由 `/admin/trial-leads`，`name: 'TrialLeadsManager'`，`meta: { requiresAuth: true, requiredRoles: ['超級管理員'], layout: DefaultLayout }`；頁面 `src/views/admin/TrialLeadsManager.vue`。
- Home 新增按鈕 `{ id: 'trialLeads', text: '試用留資', icon: customerIcon, permissionType: 'system', permissionArgs: ['超級管理員'], nav: { name: 'TrialLeadsManager' }, hideForTrial: true }`。
- `AdminToolsCenter.vue` 加一張卡片「試用留資管理」。
- 支援 `?lead={leadId}` 直接開啟該筆詳情（通知信連結）。

### 5.2 版面（桌機左列表／右詳情；手機列表→詳情全頁）

```
┌──────────────────────────────┬──────────────────────────────────┐
│ [搜尋 姓名/電話/Email/公司]     │ 王小明  ｜ ○○建設 ｜ 公司使用        │
│ 篩選: 狀態▾ 標籤▾ 型態▾ 日期▾   │ 0912-345-678  a@b.com   [寄送Email] │
│ 排序: 最新▾   [匯出][群發Email] │ ─────────────────────────────    │
│ ☐ 全選  已選 3 筆 → [加標籤][寄信]│ 標籤：[有興趣 ×][已聯絡 ×] [+]      │
│ ☐ 王小明 ○○建設 有興趣  08/28  │ 狀態：● 已聯絡 ▾                    │
│ ☐ 李小華 個人    不聯絡  08/27  │ 感興趣：銷控報價、客資                 │
│ ☐ …                          │ 備註（留言式）：[新增備註…]            │
│                              │ 活動紀錄：提交 → 自動登入 → 導覽完成 → │
│                              │           進入銷控系統 → 收到「歡迎信」 │
└──────────────────────────────┴──────────────────────────────────┘
```

- 列表欄位：勾選、姓名、公司、型態、電話、Email、標籤 chips、狀態、登入次數、最近活動、建立時間。
- 資料載入：`getDocs(collection(db,'trialLeads'))` 全量（預期量級 < 數千），**排序／篩選在前端**（勿 where+orderBy）；每次進頁重抓，提供「重新整理」。
- 詳情右側：基本資料（可編輯：姓名／公司／型態／Email／電話）、標籤編輯、狀態下拉、感興趣系統、備註（留言式：文字＋作者＋時間，可刪自己的）、活動紀錄 timeline（`events` + `emailLogs` 合併依時間排序）、「寄送 Email」「封存」按鈕。
- 匯出：目前篩選結果 → Excel（沿用 `xlsx` 既有匯出模式），欄位＝列表欄位＋標籤（逗號分隔）＋備註最新一則。

### 5.3 標籤

- 預設標籤（可改色、可刪）：`未聯絡`(灰) `已聯絡`(藍) `有興趣`(綠) `考慮中`(橘) `不聯絡`(紅) `已訂閱`(紫)。
- 自訂標籤存 `systemSettings/trialLeadTags { tags: [{ id, name, color }] }`；標籤管理 dialog（新增／改名／改色／刪除，刪除時從所有 lead 移除）。
- 一筆 lead 可多標籤；批次操作：勾選多筆 → 「加標籤」「移除標籤」「設定狀態」。
- 新 lead 自動帶 `未聯絡`；寄出廣告信不改標籤；`不聯絡` 在群發時預設排除（可勾選覆蓋）。

---

## 6. 廣告 Email 編輯器與群發

### 6.1 進入方式
- 詳情頁「寄送 Email」（單一收件人）；列表勾選多筆 →「群發 Email」；或工具列「群發 Email」→ 以目前篩選結果為收件人。
- 元件：`src/components/marketing/MarketingEmailComposer.vue`（全螢幕 dialog，桌機左右配置：左＝設定與收件人、右＝編輯器／預覽切換）。

### 6.2 編輯器
- 收件人：chips（姓名〈email〉），可逐一移除；顯示「已排除 N 位（不聯絡／無 Email）」，可展開勾回。
- 主旨（必填，支援變數）。
- 內文：重用 [TiptapEditor.vue](../src/components/TiptapEditor.vue)（粗斜體、標題、清單、連結、對齊、字級、顏色、圖片 URL 插入）；工具列加「插入變數」下拉：`{{姓名}}` `{{公司}}` `{{Email}}`。
- 附件：`v-file-input` 多檔；上傳至 Storage `marketing/attachments/{yyyyMM}/{ts}_{name}`；**單檔 ≤ 10MB、總計 ≤ 20MB、最多 5 個**；顯示檔名／大小／移除。
- 範本：「載入範本 ▾」「另存為範本」「管理範本」；範本存 `emailTemplates/{id} { name, subject, html, attachments: [{ name, url, size }], updatedAt, updatedBy }`。系統預置 3 份（可編輯／刪除）：`試用歡迎與快速上手`、`五大系統功能介紹`、`方案優惠與洽詢`（文案由 Claude 草擬）。
- 預覽：以第一位收件人套變數渲染；「寄測試信給我」→ 寄到目前登入超管 email。
- 送出前確認 dialog：收件人數、附件數、預估時間；Gmail 每日上限提示（約 500 封／日，超過請分天）。

### 6.3 Cloud Function `sendMarketingEmail`

`onCall({ region: 'asia-east1', memory: '512MiB', secrets: gmailSecrets, timeoutSeconds: 540 })`，僅 `超級管理員` 可呼叫（以 `request.data.operatorKey` 讀 `users` 驗證 roles）。

1. 建 `emailCampaigns/{id} { subject, html, attachments, recipients: [{ leadId, name, email, status:'pending' }], total, sent, failed, status:'running', createdBy, createdAt, finishedAt }`。
2. 下載附件（沿用 L13120 附件下載模式），逐位收件人：套變數 → `sendMail`（**個別寄送，不用 BCC**）→ 更新 recipient 狀態、`trialLeads/{leadId}.emailLogs arrayUnion`、`events` 加 `email_sent`；每封間隔 300ms；單封失敗記 `error` 不中斷。
3. 信尾自動加：「此信由 ANXI 安熙智慧 寄送｜如不想再收到相關資訊，請回覆此信告知。」
4. 完成更新 campaign `status:'done'`。前端以 `onSnapshot(emailCampaigns/{id})` 顯示進度條與失敗清單；離開頁面不影響後端執行。
5. 「寄信紀錄」tab：列出 campaigns（主旨、收件數、成功／失敗、時間、寄件人），可展開看每位狀態並「重寄失敗者」。

---

## 7. Home 導覽（僅試用帳號）

### 7.1 機制
- 新增 `src/composables/useOnboardingTour.js`：包 `shepherd.js`（已安裝，[InspectionCalendar.vue](../src/views/public/InspectionCalendar.vue) 已用），提供 `start(steps)`, `cancel()`, `isActive`；統一主題 class `anxi-tour`（白底、藍色主按鈕、圓角 16px、遮罩 `rgba(0,0,0,.5)`），按鈕文字「上一步／下一步／略過／完成」，`useModalOverlay: true`, `scrollTo: { behavior:'smooth', block:'center' }`。
- `IconButton.vue` 根節點加 `:data-tour="'home-' + id"`（由 Home 傳入 `id` prop）。
- `Home.vue`：每個按鈕定義新增 `tour: { title, desc }`（文案見 7.3）；步驟＝`[歡迎] + visibleButtons.map(...) + [頂欄：訊息中心／聯絡客服／個人資料] + [結尾]`，因 `visibleButtons` 已是權限過濾結果，**沒權限的功能自然不出現**；順序跟隨使用者目前拖曳排序。
- 顯示條件：`userStore.isTrialUser === true`；非試用帳號不註冊步驟、不渲染「?」。

### 7.2 觸發
- 自動啟動：進入 Home 時 `route.query.tour === '1'` 或 `localStorage['anxi-trial-tour-done'] !== '1'`（TESTA 為共用帳號，**不可用 `users.preferences` 記錄**）；啟動後移除 query。
- 「?」重看：Home 右下角 `v-btn` FAB（`mdi-help-circle`，藍色，`position: fixed; right: 24px; bottom: 88px` 避開全域問題回報鈕）＋ `DefaultLayout` app-bar 圖示 `mdi-help-circle-outline`（僅試用帳號、僅 Home 路由顯示）。
- 完成／略過 → `localStorage['anxi-trial-tour-done']='1'`、`trackTrialLeadEvent('tour_completed' | 'tour_skipped')`。

### 7.3 導覽文案（初稿，可改）

| 按鈕 id | 標題 | 說明 |
|---|---|---|
| (歡迎) | 歡迎使用 ANXI 測試環境 | 這裡是功能首頁，每個圖示就是一套系統。30 秒帶您快速認識，之後隨時點右下角「?」可以重看。 |
| salesSystem | 銷控系統 | 櫃台即時銷控：戶別狀態、價格、成交資訊，一張表全掌握，還能拖曳排序。 |
| quoteSystem | 報價系統 | 選戶別、選車位、套用付款方案，自動算出各期款項並列印報價單。 |
| customerSystem | 客資系統 | 客戶建檔、洽談紀錄、撞客比對，掃 QR Code 讓客戶自己填貴賓資料表。 |
| ViewingReservation | 賞屋預約 | 行事曆安排客戶賞屋時段，整合客資系統自動帶入資料。 |
| inspectionTimetable | 驗屋預約 | 設定開放批次與時段名額，客戶線上自助預約、修改與取消。 |
| inspectionSystem | 驗屋系統 | 手機拍照標記缺失、追蹤廠商修繕進度、一鍵產出 PDF 驗屋報告。 |
| inspectionReportManager | 驗屋報告 | 集中管理各戶驗屋報告檔案，住戶可掃碼查詢。 |
| designChangeSystem | 客變系統 | 客變需求與圖說管理（規劃中）。 |
| messageCenter | 訊息中心 | 系統通知與公告都在這裡，未讀會在右上角顯示數字。 |
| userProfile | 個人資料 | 檢視帳號資料；測試帳號為唯讀。 |
| (頂欄) | 常用工具 | 右上角有房貸試算、聯絡客服、全螢幕與訊息中心。 |
| (結尾) | 開始探索吧！ | 想進一步了解方案，歡迎透過「聯絡客服」或 LINE 找我們。 |

---

## 8. 事件追蹤

- Cloud Function `trackTrialLeadEvent`（onCall, asia-east1）：`{ leadId, type, meta }` → `trialLeads/{leadId}.events arrayUnion({ type, at: now, meta })`，並依 type 更新：`auto_login` → `loginCount +1, lastLoginAt`；`tour_completed` → `tourCompleted: true`；任何事件更新 `lastSeenAt`。leadId 不存在則忽略。
- 前端 helper `src/utils/trialTracking.js`：`trackTrialEvent(type, meta)` 讀 `sessionStorage['anxi-trial-lead']`，無 leadId 或非試用帳號則 no-op；fire-and-forget。
- 事件清單：`submitted`（後端）、`auto_login`、`tour_started`、`tour_completed`、`tour_skipped`、`enter_system`（`ProjectSelector.enterProject` 成功後，meta `{ system, projectId }`）、`email_sent`（後端）。
- 留資頁與首頁 CTA 點擊：`landing_cta_click`（meta `{ position: 'nav'|'hero'|'bottom' }`）— 此時尚無 leadId，改寫入 `trialLeadEvents`（無主）集合僅作計數；第一版可先只做 console/analyticsStore 計數，不阻塞。

---

## 9. 設定文件 `systemSettings/trial`

```js
{
  enabled: true,
  accountKey: 'TESTA', password: 'TESTA',
  projectIds: ['TESTA'], projectNames: ['測試建案A'],
  blockOutbound: true,
  resetEnabled: true, resetHour: 4,          // 排程固定 04:00，resetHour 僅顯示用
  sandboxCollections: [ ...§4.2 預設清單 ],
  lastSnapshotAt, lastResetAt
}
```
- 於「試用留資管理 → 沙盒設定」tab 編輯（超管）；`password` 欄位以密碼型輸入顯示。
- 首次由 Claude 以 script 建立預設文件（DEMO id 由使用者提供）。

---

## 10. 檔案異動清單

**前端**
- 修改：`src/views/LandingPage.vue`（重寫）、`index.html`（fonts/meta）、`src/main.js`（註冊指令）、`src/router/index.js`（`/trial`、`/admin/trial-leads`、`/trial` 已登入導向）、`src/views/Home.vue`（tour 定義、hideForTrial、FAB、自動啟動）、`src/components/IconButton.vue`（`data-tour`）、`src/layouts/DefaultLayout.vue`（試用 banner、「?」）、`src/store/user.js`（`isTrialUser`）、`src/components/EditProfileDialog.vue`、`src/views/UserProfile.vue`（唯讀）、`src/views/ProjectSelector.vue`（enter_system 事件）、`src/views/AdminToolsCenter.vue`（卡片）、`src/api.js`（新 API 包裝）
- 新增：`src/views/TrialSignup.vue`、`src/views/admin/TrialLeadsManager.vue`、`src/components/marketing/MarketingEmailComposer.vue`、`src/components/marketing/EmailTemplateManager.vue`、`src/components/marketing/TrialLeadTagManager.vue`、`src/composables/useOnboardingTour.js`、`src/directives/vReveal.js`、`src/utils/trialTracking.js`、`src/assets/landing/**`、`public/og-image.png`

**後端（functions，皆 512MiB）**
- 新增：`submitTrialLead`、`trackTrialLeadEvent`、`sendMarketingEmail`、`snapshotTrialSandbox`、`resetTrialSandbox`（schedule）、`resetTrialSandboxNow`
- 新增檔：`functions/utils/trialGuard.js`、`functions/trial/*.js`（上述函式實作，於 `index.js` re-export）
- 修改：`handleLogin`（回傳 `isTrial`）、`forgotPasswordSender`（拒絕 isTrial）、LINE／Email／簡訊發送點接入守衛
- 部署：`firebase deploy --only functions:submitTrialLead,functions:trackTrialLeadEvent,functions:sendMarketingEmail,functions:snapshotTrialSandbox,functions:resetTrialSandbox,functions:resetTrialSandboxNow,functions:handleLogin,functions:forgotPasswordSender`（守衛接入的函式另列）

**Firestore 規則**：`trialLeads`、`emailTemplates`、`emailCampaigns`、`systemSettings/trial*`、`trialSandboxTemplates` 僅允許已登入前端讀寫（沿用現行規則模式），寫入主要走 Cloud Function。

---

## 11. 實作順序

1. **P1 首頁**：素材擷取（DEMO）→ `v-reveal` → LandingPage 重寫 → SEO meta／og-image
2. **P2 試用留資**：`systemSettings/trial` → `submitTrialLead` → `TrialSignup.vue` → 自動登入 → `isTrial` 限制（profile／forgot／Home 隱藏／banner）
3. **P3 留資管理**：`TrialLeadsManager.vue`（列表／詳情／標籤／備註／匯出）→ 事件追蹤
4. **P4 廣告 Email**：Composer → 範本 → `sendMarketingEmail` → 寄信紀錄
5. **P5 沙盒**：`trialGuard` 接入 → 快照／重置函式與 UI
6. **P6 導覽**：`useOnboardingTour` → Home 步驟／FAB／自動啟動 → 事件
7. 各階段完成後依 commit-notes 流程更新 `CHANGELOG.md` 再 commit。

---

## 12. 驗收清單

- [ ] 首頁桌機／手機皆無橫向捲動；頂欄捲動變色；所有 CTA 導向正確；LINE 洽詢保留
- [ ] 文字區塊捲入時 blur→clear，`prefers-reduced-motion` 只淡入
- [ ] `/trial` 送出 → `trialLeads` 新增 → 超管收到通知信 → 自動登入 TESTA → `/home` 導覽自動啟動
- [ ] 同手機重複送出：不重複建檔、`submitCount` 累加、60 秒內不重寄通知
- [ ] TESTA 登入：個人資料唯讀、忘記密碼被拒、管理類按鈕不顯示、banner 顯示
- [ ] 正式帳號登入：無「?」、無導覽、無 banner
- [ ] 導覽只包含 TESTA 有權限的按鈕；拖曳排序後順序跟隨；「?」可重看
- [ ] DEMO 建案內觸發 LINE／Email／簡訊：不送出、log 有 `[TrialGuard] blocked`、前端流程不報錯
- [ ] 快照 dry-run 筆數正確；手動重置後 DEMO 資料回復；排程 04:00 執行紀錄存在
- [ ] 留資管理：搜尋／篩選／標籤／批次／備註／匯出／`?lead=` 直開
- [ ] 廣告 Email：變數套用、附件寄達、範本存取、群發進度、失敗重寄、「不聯絡」預設排除、測試信

---

## 13. 待使用者提供／確認

1. DEMO 建案的 `projectId` 與名稱（寫入 `systemSettings/trial`）。
2. `users/TESTA` 建立並設定：`isTrial: true`、`allowMultiLogin: true`、權限、各系統訂閱座位。
3. 形象網站／電子表板截圖 2 張；Hero 是否換新背景照片。
4. Gmail 單日約 500 封上限：若群發量會超過，是否改接 SendGrid／Resend（第二版）。
5. 導覽文案（§7.3）與預置 Email 範本文案是否需先審稿。

---

## 14. 實作狀態（2026-08-28）

### 已完成
- **P1 首頁**：`LandingPage.vue` 重寫（頂欄／Hero／藍色主打卡／功能卡／深入介紹輪播／方案／CTA／Footer）、`v-reveal` 指令、SEO meta、`public/og-image.png`、新 LOGO（白底用 `anxi-logo.webp`、深色底用 `anxi-logo-white.webp`）。
- **截圖素材**：`node scripts/captureLandingShots.mjs [only=name,...]`（需先 `npx vite --port 5199`，使用本機 Chrome + `puppeteer-core`）。輸出 `src/assets/landing/{system}/{name}.webp`；形象網站 2 張已轉 WebP。
  - DEMO 虛擬資料：`node scripts/seedTrialDemoData.mjs`（`--clean` 只清除）建立初驗／對保批次、6 週時段規則、預約紀錄、聯絡名單、賞屋預約，全部標記 `isDemo:true, demoSeed:'landing-2026-08'`，並把 `pageSettingsByItem.初驗／對保.visibleToCustomer` 設為 true（2026-08-28 已執行，截圖已更新）。
- **P2 試用留資**：`/trial`（`TrialSignup.vue`）→ `submitTrialLead` → 自動登入 TESTA → `/home?tour=1`；`isTrial` 旗標、個人資料唯讀（`UserProfile` / `EditProfileDialog` / `api.updateUserProfile`）、忘記密碼拒絕、Home 隱藏管理功能、頂欄測試環境提示條。
- **P3 留資管理**：`src/views/admin/TrialLeadsManager.vue`（留資名單／寄信紀錄／Email 範本／沙盒設定）、`TrialLeadDetailPanel.vue`（規格外新增，桌機右欄與手機 dialog 共用）、`TrialLeadTagManager.vue`、`src/services/trialLeadsService.js`；Home「試用留資」按鈕、AdminToolsCenter 卡片。
- **P4 廣告 Email**：`MarketingEmailComposer.vue` + `sendMarketingEmail`；3 份預置範本於首次進頁自動建立。
- **P5 沙盒**：`functions/utils/trialGuard.js`（Email 21 處、LINE 8 處、簡訊模組接入）、`snapshotTrialSandbox` / `resetTrialSandbox`（每日 04:00）/ `resetTrialSandboxNow`。
- **P6 導覽**：`useOnboardingTour.js`（shepherd）+ `tour-theme.css`、Home 步驟依 `visibleButtons` 產生、FAB「?」與頂欄「?」、事件追蹤（`trialTracking.js`）。
- `npx vite build` 通過。

### 待使用者執行
1. ~~**部署 Cloud Functions**~~ 已於 2026-08-28 部署完成（44 個函式）。指令留存：
   ```
   firebase deploy --only functions:submitTrialLead,functions:trackTrialLeadEvent,functions:sendMarketingEmail,functions:snapshotTrialSandbox,functions:resetTrialSandbox,functions:resetTrialSandboxNow,functions:handleLogin,functions:forgotPasswordSender,functions:handleSpecialReportUpload,functions:saveBooking,functions:cancelBooking,functions:addAppointmentByAdmin,functions:cancelAppointmentByAdmin,functions:handleDirectReportUpload,functions:initiateAuthSigningProcess,functions:completeAuthSigningProcess,functions:sendUploadReminders,functions:manualTriggerSendReminders,functions:sendUploadReminderForUnit,functions:updateAppointmentByAdmin,functions:generateInspectionPdf,functions:sendInspectionReportEmails,functions:bookingApi,functions:adminBookingApi,functions:inspectionCalendarApi,functions:liffCalendarApi,functions:sendNotDownloadedReportReminder,functions:testNotDownloadedReminderToAdmins,functions:scheduledReportReminder,functions:onVipGuestDuplicate,functions:onVipGuestSubmission,functions:onViewingReservationChange,functions:processAndAssignLead,functions:scheduledLeadReminder,functions:batchImportAndAssignLeads,functions:batchImportLeadsV2,functions:syncSalesHouseholdsToSheet,functions:onSalesHouseholdWrite,functions:syncCancelledPurchasesToSheet,functions:onCancelledPurchasesWrite,functions:sendSalesStatusNotification,functions:notifyOnFormSubmission,functions:smsApi,functions:autoSmsReminderTrigger
   ```
   逾時請加 `FUNCTIONS_DISCOVERY_TIMEOUT=120`。
2. `users/TESTA` 設定 `isTrial: true`（`allowMultiLogin: true` 已有）。部署 `handleLogin` 前，試用限制與導覽不會生效。
3. 進「試用留資 → 沙盒設定」儲存一次設定（建立 `systemSettings/trial`，projectIds=`TESTA`、projectNames=`測試建案A`），再按「建立沙盒範本快照」。
4. ~~補充 DEMO 資料~~ 已由 `seedTrialDemoData.mjs` 建立；之後每日沙盒重置前請先建立範本快照，示範資料才會被保留還原。
5. `firestore.rules` 若有集合白名單，需開放 `trialLeads`、`emailTemplates`、`emailCampaigns`、`systemSettings`、`trialSandboxTemplates`、`trialSandboxResets` 給已登入前端讀寫（本專案 repo 內無 rules 檔，請於主控台確認）。
