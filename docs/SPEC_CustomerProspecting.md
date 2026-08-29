# SPEC：客戶開發（Prospecting）— 建案／建商名單管理 ＋ 開發 Email ＋ 追蹤

> 版本：v1（2026-08-29 討論定稿）
> 相關檔案：[Home.vue](../src/views/Home.vue)、[router/index.js](../src/router/index.js)、[TrialLeadsManager.vue](../src/views/admin/TrialLeadsManager.vue)、[MarketingEmailComposer.vue](../src/components/marketing/MarketingEmailComposer.vue)、[trialLeadsService.js](../src/services/trialLeadsService.js)、[functions/trial/marketingEmail.js](../functions/trial/marketingEmail.js)、[functions/utils/trialGuard.js](../functions/utils/trialGuard.js)
> 前身規格：[SPEC_LandingTrialLeadsOnboarding.md](./SPEC_LandingTrialLeadsOnboarding.md) §5／§6（試用留資管理／廣告 Email）— 本功能大量沿用其零件
> 初始資料：`docs/local/廣告投放/新竹建案廣告投放名單.xlsx`（4 個工作表：建案清單 78、建商清單 53、代銷公司 15、公會_平台_社群 12）

---

## 0. 已確認設計決策（來自需求討論）

| 項目 | 決策 |
|---|---|
| 使用者 | **僅超級管理員**（路由 `requiredRoles: ['超級管理員']`；Functions 以 `assertSuperAdmin` 驗證；試用帳號 Home 隱藏） |
| 入口 | Home 新增「客戶開發」按鈕 → `/admin/prospects` |
| 資料來源 | Excel 只是**初始匯入**，之後 Firestore 為唯一真相；提供 Excel **匯入**（UI）與**匯出** |
| 匯入方式 | **UI 匯入 Excel**：頁面「匯入 Excel」按鈕，瀏覽器以 SheetJS 解析四個工作表寫入 Firestore；同名（建案名稱／公司名稱）視為同一筆 → 更新不重複建立 |
| 資料模型 | 單一集合 `prospects`，`category` 對應四個工作表（`project` 建案／`builder` 建商／`agency` 代銷／`resource` 公會平台）；建案以 `companyId` 連到建商 |
| 聯絡人 | **每筆可有多位聯絡人**（姓名／職稱／Email／電話／LINE／備註）；寄信時逐位勾選；Excel 匯入時把 Email 欄轉成第一位聯絡人 |
| 狀態流程 | 標準業務漏斗：`new` 未聯絡 → `emailed` 已寄信 → `replied` 已回覆 → `negotiating` 洽談中 → `won` 已成交；另有 `paused` 暫緩、`do_not_contact` 不聯絡（群發自動排除） |
| 標籤 | 自訂標籤，沿用 `TrialLeadTagManager` 模式（獨立於狀態） |
| Email 編輯器 | 沿用 `MarketingEmailComposer`（Tiptap＋附件＋範本＋群發預覽），加 `target='prospects'` |
| 寄信後端 | 沿用 `sendMarketingEmail`，新增 `targetCollection`／`replyTo`／`tracking` 參數；寫回 `prospects/{id}.emailLogs` 與 `events` |
| 寄件人 | From 維持「ANXI 安熙智慧 <SENDER_EMAIL>」；**Reply-To = 操作者登入帳號 Email** |
| 寄信後追蹤 | 寄信成功後自動把 `followUpAt` 設為 **N 天後**（預設 7 天，頁面可設定）；頁面頂部顯示「今日待追蹤 N 筆」 |
| 開信追蹤 | 信件內嵌 1px 追蹤像素 → HTTP function `trackEmailOpen` 記錄 `openedAt`／`openCount`（Gmail 代理圖片會使準確度打折，僅供參考） |
| 回覆歸檔 | **手動**標記「已回覆」（含回覆日期／摘要）；不做 Gmail API 自動抓收件匣（第二版） |
| 變數 | `{{建案}} {{建商}} {{聯絡人}} {{公司}} {{Email}}`（向下相容原有 `{{姓名}}` = 聯絡人） |
| 版面 | 電腦版**左名單／右詳情**；手機堆疊（名單 → 點入詳情） |
| 不做（v1） | Gmail 收件匣自動同步、排程寄送、A/B 測試、LINE／簡訊開發、非超管授權 |

---

## 1. 範圍

### In scope
1. Home 入口「客戶開發」＋路由 `/admin/prospects`（`ProspectManager.vue`）
2. Firestore `prospects` 集合 CRUD（建案／建商／代銷／公會平台四類，含多聯絡人）
3. Excel 匯入（四工作表 → `prospects`，同名更新）與匯出（現況四工作表 + 開發欄位）
4. 名單頁：篩選／搜尋／排序／批次操作（改狀態、加減標籤、群發、刪除）
5. 詳情面板：基本資料編輯、聯絡人管理、狀態／標籤／負責人／下次追蹤日、備註、活動紀錄時間軸、寄信紀錄
6. 開發 Email：群發（勾選多筆／多聯絡人）、單寄、範本、附件、變數、Reply-To、追蹤像素
7. Cloud Functions：`sendMarketingEmail` 擴充、`trackEmailOpen`（新增，HTTP）
8. 「今日待追蹤」檢視與寄信後自動排追蹤日
9. `systemSettings/prospecting` 設定（追蹤天數預設值、預設 Reply-To 覆寫）

### Out of scope
- Gmail 收件匣同步／自動判斷回覆（第二版可用 Gmail API + Pub/Sub）
- 排程／定時寄送、寄信序列（drip）
- 非超管角色的授權（v1 不做角色細分）
- 建案資料自動從房地王／591 爬取更新

---

## 2. 資料模型

### 2.1 `prospects/{id}`（開發對象）

```js
{
  // ---- 分類與識別 ----
  category: 'project' | 'builder' | 'agency' | 'resource',
  name: '豐邑之森',                 // 建案名稱／公司名稱（匯入唯一鍵：category + name）
  nameKey: '豐邑之森',              // name 去空白、全形→半形、小寫；用於重複比對
  companyId: 'xxx' | null,          // 建案 → 建商（prospects.id）；其他類別 null
  companyName: '浩瀚開發(豐邑機構)', // 冗餘，列表顯示用

  // ---- Excel 原始欄位（依 category 使用）----
  region: '竹北市(高鐵特區)',        // 區域（建案）
  builder: '浩瀚開發(豐邑機構)',     // 建設公司（建案，字串原值）
  agency: '傑合開發',               // 代銷／企劃銷售（建案）
  saleStatus: '新成屋',             // 建案狀態（預售／新成屋／銷售中…）
  phone: '03-6576880',              // 直撥電話（建案）／公司電話（其他）
  phoneHousetube: '449-9089 轉 43177', // 房地王轉接
  phone591: '0972-528-588 轉 20334',   // 591 轉接
  receptionAddress: '...',          // 接待中心地址
  siteAddress: '...',               // 基地地址／公司地址
  facebook: 'https://...',
  line: '@705ukfvk',
  website: 'https://...',
  instagram: '',
  resourceType: '公會',             // 公會平台類別（resource）
  projectsText: '豐邑之森、豐采…',   // 在售建案／負責建案（builder／agency 的文字欄）
  note: '64戶 3-4房',               // Excel 備註（原值）

  // ---- 聯絡人（多筆）----
  contacts: [
    { id: 'c1', name: '', title: '', email: 'info@chunfu.com.tw', phone: '', line: '', note: '', isPrimary: true }
  ],

  // ---- 開發管理 ----
  status: 'new' | 'emailed' | 'replied' | 'negotiating' | 'won' | 'paused' | 'do_not_contact',
  tags: ['高優先'],                 // 自訂標籤名稱陣列（同 trialLeads）
  owner: 'userKey' | null,          // 負責人（超管 key）
  ownerName: '',
  priority: 0 | 1 | 2,              // 0 一般／1 高／2 最高（星號）
  followUpAt: Timestamp | null,     // 下次追蹤日
  memo: '',                         // 開發備註（富文字不需要，純文字 textarea）
  lastEmailAt: Timestamp | null,    // 最後寄信時間（冗餘，列表排序用）
  lastEmailStatus: 'sent' | 'failed' | null,
  lastOpenedAt: Timestamp | null,   // 最後開信時間（追蹤像素）
  repliedAt: Timestamp | null,      // 手動標記回覆
  emailCount: 0,                    // 累計寄信次數
  openCount: 0,

  // ---- 紀錄 ----
  emailLogs: [                      // 每次寄信一筆（同 trialLeads.emailLogs）
    { campaignId, subject, to: 'a@b.com', contactId: 'c1', sentAt, status: 'sent'|'failed', error: null,
      openedAt: null, openCount: 0 }
  ],
  events: [                         // 活動時間軸
    { type: 'imported'|'created'|'email_sent'|'email_opened'|'call'|'line'|'meeting'|'reply'|'note'|'status_changed'|'followup_set',
      at: Timestamp, by: 'userKey', byName: '', meta: {} , text: '' }
  ],

  // ---- 系統 ----
  source: 'excel' | 'manual',
  importBatchId: 'imp_20260829_xxx' | null,
  createdAt, createdBy, updatedAt, updatedBy,
}
```

> `emailLogs`／`events` 以 `arrayUnion` 追加，量級每筆 < 200 筆事件，符合現有 trialLeads 做法；若未來超過再拆子集合。

### 2.2 `emailCampaigns/{id}`（沿用，新增欄位）

```js
{
  ...現有欄位（subject, html, attachments, recipients[], total, sent, failed, status, createdBy, createdAt, finishedAt）,
  target: 'trialLeads' | 'prospects',      // 新增：收件人來源集合
  replyTo: 'airrick1985@gmail.com',        // 新增
  tracking: true,                           // 新增：是否嵌追蹤像素
  recipients: [{
    leadId,                 // = prospects.id（沿用欄位名，避免動舊程式）
    contactId,              // 新增
    name, email, company,   // name = 聯絡人姓名、company = 建案／公司名稱
    vars: { 建案, 建商, 聯絡人, 公司 },  // 新增：變數替換用
    status, error, sentAt,
    openedAt: null, openCount: 0,   // 新增
  }],
  opened: 0,                // 新增：至少開信一次的收件人數
}
```

### 2.3 `emailTemplates/{id}`（沿用，新增 `scope`）

- 新增 `scope: 'trial' | 'prospect' | 'all'`（既有文件視為 `'all'`）。
- 客戶開發頁的範本選單只列 `scope in ['prospect','all']`；另存為範本時預設 `scope='prospect'`。

### 2.4 `prospectTags/{id}`（自訂標籤定義）

```js
{ name: '高優先', color: 'red', order: 0, createdAt }
```
預設標籤：`高優先(red)`、`有 Email(green)`、`有 FB(blue)`、`已見面(purple)`、`名單不完整(grey)`。
（`有 Email`／`有 FB` 由匯入時自動打上，方便快速篩選。）

### 2.5 `prospectImports/{id}`（匯入批次紀錄）

```js
{ fileName, sheetSummary: { project: {created, updated, skipped}, builder: {...}, agency: {...}, resource: {...} },
  errors: [{ sheet, row, message }], createdBy, createdByName, createdAt }
```

### 2.6 `systemSettings/prospecting`

```js
{ followUpDaysAfterEmail: 7, defaultReplyTo: '' /* 空＝用操作者 Email */, trackingEnabled: true }
```

### 2.7 Firestore 規則

- `prospects`、`prospectTags`、`prospectImports`、`systemSettings/prospecting`：僅 `roles` 含 `超級管理員` 可讀寫（比照 `trialLeads` 規則區塊）。
- `emailCampaigns`／`emailTemplates`：沿用現有規則。

---

## 3. 入口與路由

### 3.1 Home（`Home.vue`）
```js
{
  id: 'prospecting',
  text: '客戶開發',
  icon: customerIcon,             // 暫用現有客戶圖示；若有新圖再換
  permissionType: 'system',
  permissionArgs: ['超級管理員'],
  nav: { name: 'ProspectManager' },
  badge: () => prospectStore.dueTodayCount,   // 今日待追蹤數（>0 才顯示紅點數字）
}
```
- `HIDE_FOR_TRIAL` 加入 `'prospecting'`。
- 放在「試用留資」按鈕旁。

### 3.2 路由（`router/index.js`）
```js
{
  path: '/admin/prospects',
  name: 'ProspectManager',
  component: () => import('@/views/admin/ProspectManager.vue'),
  meta: { requiresAuth: true, requiredRoles: ['超級管理員'], layout: DefaultLayout, title: '客戶開發' }
}
```

---

## 4. 頁面規格 `ProspectManager.vue`

### 4.1 整體結構

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 客戶開發                       [今日待追蹤 5] [匯入 Excel] [匯出] [＋新增] [⚙] │
│ ─────────────────────────────────────────────────────────────────────────── │
│ [名單] [寄信紀錄] [Email 範本] [標籤管理]                                     │
├──────────────────────────────┬──────────────────────────────────────────────┤
│ 篩選列                        │  詳情面板（右側，桌機 ≥ 960px）                │
│ 類別 ▾ 區域 ▾ 狀態 ▾ 標籤 ▾    │  ┌──────────────────────────────────────┐   │
│ 有Email ☐ N天未寄信 ▾ 搜尋…    │  │ 豐邑之森   [建案] [新成屋]   ★★        │   │
│ ─────────────────────────────  │  │ 狀態 [已寄信 ▾]  負責人 [我 ▾]         │   │
│ ☐ 全選  已選 3 → [寄信][狀態▾][標籤▾][刪除] │ 下次追蹤 [2026-09-05 📅]  標籤 [+] │   │
│ ─────────────────────────────  │  ├──────────────────────────────────────┤   │
│ ☐ 豐邑之森   建案 竹北  已寄信  │  │ 基本資料（可編輯）                      │   │
│    浩瀚開發 ｜ 2 聯絡人 ｜ 9/5  │  │ 區域／建商／代銷／電話／地址／FB／LINE… │   │
│ ☐ 春福承曦   建案 新竹市 未聯絡 │  │ 聯絡人 (2)  [＋新增聯絡人]             │   │
│ ☐ 春福建設   建商       洽談中  │  │  ✉ info@chunfu.com.tw  主要  [寄信]    │   │
│ …                             │  │ 開發備註 [textarea]                    │   │
│                               │  │ 活動紀錄  [＋電話] [＋LINE] [＋會面] [＋備註] │
│ 共 158 筆                      │  │  09/01 寄信「ANXI 一個平台就夠」✔ 已開信 │   │
│                               │  │  08/29 匯入 Excel                       │   │
│                               │  │ 寄信紀錄 (3)                            │   │
│                               │  └──────────────────────────────────────┘   │
└──────────────────────────────┴──────────────────────────────────────────────┘
```

- 桌機：左 5／右 7 欄（`v-row`），左側名單 `v-data-table`（`density=compact`、`show-select`、固定表頭、虛擬捲動），點列 → 右側載入詳情。
- 手機：只顯示名單；點列 → 全螢幕 `v-dialog fullscreen` 詳情（同 `TrialLeadDetailPanel` 手機模式）。
- 頁面頂部 chip「今日待追蹤 N」點擊 = 套用篩選 `followUpAt <= 今天 && status not in [won, do_not_contact]`。

### 4.2 Tab「名單」

**篩選／搜尋**（全部前端運算，一次 `getDocs` 載入全部 `prospects`，勿 where+orderBy）
- 類別（多選）：建案／建商／代銷／公會平台
- 區域（多選，由資料自動彙整：竹北市、新竹市東區、新竹市北區、湖口鄉…；以 `region` 前綴分組）
- 狀態（多選）、標籤（多選，含／不含）、負責人
- 快速勾選：有 Email、有 FB、有 LINE、**N 天內未寄信**（7／14／30／從未）、今日待追蹤、已開信未回覆
- 搜尋：名稱／建商／代銷／地址／聯絡人姓名／Email（`includes`，大小寫不分）
- 排序：預設 `followUpAt` 升冪（到期優先）→ `updatedAt` 降冪；可切最後寄信時間、名稱、區域

**欄位**：勾選、名稱（＋類別 chip）、區域、建商（建案才顯示）、狀態 chip、標籤 chips、聯絡人數（有 Email 者以 ✉ 標示）、最後寄信（時間＋開信 👁 圖示）、下次追蹤（逾期紅字）、負責人

**批次操作**（已選 ≥ 1）
- 寄信 → 開 `MarketingEmailComposer`（收件人 = 所選對象的所有「有 Email 且非 do_not_contact」聯絡人；Composer 內可個別取消勾選）
- 改狀態、加標籤／移除標籤、設定下次追蹤日、指派負責人、刪除（二次確認，顯示筆數）

**新增**：`＋新增` → 詳情面板空白表單（必填：類別、名稱）；建案類可從既有建商挑 `companyId`（autocomplete，找不到可直接鍵入 `builder` 字串）。

### 4.3 詳情面板 `ProspectDetailPanel.vue`

- **頂部**：名稱（可編輯）、類別 chip、`saleStatus` chip、優先度星號（0–2）、狀態 select（改變即寫入並追加 `status_changed` 事件）、負責人 select（超管清單）、下次追蹤日 date picker（含「+7 天」「+14 天」「清除」快捷）、標籤 chips（＋ 選單）。
- **基本資料**：依 `category` 顯示對應欄位（§2.1 Excel 欄位），行內編輯（`v-text-field` 失焦即存；FB／官網顯示為可點連結＋複製鈕；電話顯示 `tel:` 連結）。建案類顯示「所屬建商」連結 → 點擊切換右側面板到該建商。建商類顯示「旗下建案」清單（`companyId === id` 的建案，點擊切換）。
- **聯絡人**：表格（姓名／職稱／Email／電話／LINE／主要），列尾 `寄信`（單寄，Composer 預帶此一收件人）、編輯、刪除；`＋新增聯絡人`。Email 重複時提示。
- **開發備註**：`v-textarea`，失焦即存。
- **活動紀錄**：時間軸（新→舊），快捷按鈕 `＋電話`／`＋LINE`／`＋會面`／`＋備註`／`＋標記已回覆`，各開小 dialog 填「時間（預設現在）＋內容」；`標記已回覆` 另寫 `repliedAt` 並把狀態自動推到 `replied`（若目前狀態在 replied 之前）。事件 type→圖示／中文對照放 `prospectService.PROSPECT_EVENT_LABELS`。
- **寄信紀錄**：`emailLogs` 表格（時間／主旨／收件 Email／狀態／開信時間／開信次數），點主旨 → 開 campaign 詳情 dialog（沿用 `TrialLeadsManager` 的 campaign dialog）。

### 4.4 Tab「寄信紀錄」
- 沿用 `TrialLeadsManager` 寄信紀錄 tab，但只列 `emailCampaigns.target === 'prospects'`；欄位加「開信 N／已寄 M」。
- 點列 → campaign 詳情（收件人／狀態／開信時間／錯誤），可「重寄失敗者」（帶原內容重新開 Composer，只勾失敗者）。

### 4.5 Tab「Email 範本」
- 沿用現有範本 tab（`fetchEmailTemplates` 加 `scope` 篩選）。
- 預設提供一份範本「ANXI 一個平台就夠」，內容取自 `docs/local/廣告投放/20260829廣告/20260829廣告文案.md`，圖片 `20260829廣告圖.jpg` 上傳為附件／內嵌圖（首次進入頁面若無任何 `scope='prospect'` 範本則由前端 seed，一次性）。

### 4.6 Tab「標籤管理」
- 沿用 `TrialLeadTagManager`，資料改讀寫 `prospectTags`；改名／刪除時批次更新 `prospects.tags`（同現有邏輯）。

### 4.7 設定 `⚙`
- dialog：寄信後自動排追蹤天數（1–60，預設 7）、預設 Reply-To（空＝操作者 Email）、開信追蹤開關。寫 `systemSettings/prospecting`。

---

## 5. Excel 匯入／匯出

### 5.1 匯入 `ProspectImportDialog.vue`
1. 選擇 `.xlsx`（`accept=.xlsx`，前端 SheetJS `XLSX.read(arrayBuffer)`）。
2. 工作表對應（依名稱自動辨識；辨識不到讓使用者用 select 指定或略過）：

| 工作表 | category | 唯一鍵 | 欄位對應 |
|---|---|---|---|
| 建案清單 | project | 建案名稱 | 區域→region、建設公司→builder、代銷/企劃銷售→agency、狀態→saleStatus、建案直撥電話→phone、房地王轉接→phoneHousetube、591轉接→phone591、接待中心地址→receptionAddress、基地地址→siteAddress、FB 粉專→facebook、LINE→line、Email→contacts[0].email、官網/來源→website、備註→note |
| 建商清單 | builder | 建設公司 | 電話→phone、地址→siteAddress、Email→contacts[0].email、FB 粉專→facebook、LINE→line、IG / 其他→instagram、官網→website、在售新竹建案→projectsText |
| 代銷公司 | agency | 代銷/企劃銷售公司 | 電話→phone、LINE / 官網→line（含 http 者拆到 website）、負責新竹建案→projectsText |
| 公會_平台_社群 | resource | 名稱 | 類型→resourceType、電話→phone、Email→contacts[0].email、地址→siteAddress、連結→website、說明→note |
| 說明 | （略過） | | |

3. **預覽**：顯示每個工作表「新增 N／更新 M／略過（空名稱）K」與前 5 筆對照；勾選「更新時覆蓋既有欄位」（預設：只填補空欄位，不覆蓋已手動修改的值；`status`／`tags`／`contacts`（既有者）／`memo`／`events` 一律不動）。
4. **執行**：`writeBatch` 每 400 筆一批；`nameKey` 比對決定新增／更新；建案的 `builder` 字串若能對到 `builder` 類別的 `nameKey`（去掉括號內容後比對，例：`浩瀚開發(豐邑機構)` → 先整串、再 `浩瀚開發`、再括號內 `豐邑機構`）則寫 `companyId`。匯入順序：builder → agency → resource → project（確保建案能連到建商）。
5. 自動標籤：`有 Email`（contacts 有 email）、`有 FB`、`名單不完整`（無 phone 且無 email 且無 facebook）。
6. 每筆追加 `events: imported`；寫 `prospectImports` 批次紀錄；完成後 snackbar 顯示摘要，失敗列可下載錯誤清單。
7. 首批匯入：由使用者透過此 UI 匯入 `新竹建案廣告投放名單.xlsx`（我不另寫腳本）。

### 5.2 匯出
- 「匯出」按鈕 → 依目前篩選結果或全部，輸出 xlsx：四個工作表同匯入格式 + 額外欄位（狀態、標籤、負責人、下次追蹤、最後寄信、開信次數、回覆日、開發備註、聯絡人（以 `;` 串接 `姓名<email>`））。沿用 `XLSX.writeFile`。

---

## 6. Email 寄送

### 6.1 前端 `MarketingEmailComposer.vue` 擴充
- 新 prop：`target: 'trialLeads' | 'prospects'`（預設 `trialLeads`，舊呼叫不受影響）、`replyTo`（字串，預設操作者 Email，可在 Composer 內改）、`tracking`（布林，預設讀 `systemSettings/prospecting.trackingEnabled`）。
- `recipients` 傳入格式（prospects）：`[{ leadId: prospectId, contactId, name: 聯絡人姓名, email, company: 建案/公司名稱, tags, vars: { 建案, 建商, 聯絡人, 公司 } }]`。
- 排除規則：`status === 'do_not_contact'` 或標籤含「不聯絡」→ 顯示排除原因（沿用既有 UI）。
- 變數說明列改為：`{{建案}} {{建商}} {{聯絡人}} {{公司}} {{Email}}`（target=trialLeads 時維持原文案）。
- 範本選單依 `scope` 過濾；另存範本時寫入 `scope`。
- 送出：`sendMarketingEmailAPI({ operatorKey, subject, html, attachments, recipients, target, replyTo, tracking })`。
- `sent` 事件回傳 `{ campaignId, sent, failed }` → 父頁面重新載入所選 prospects，並依設定自動設定 `followUpAt`（見 §6.3）。

### 6.2 後端 `functions/trial/marketingEmail.js` 擴充（同一支 function）
- 參數：`target`（預設 `'trialLeads'`，僅允許 `'trialLeads' | 'prospects'`）、`replyTo`（驗 Email 格式，無效則忽略）、`tracking`（布林）。
- `applyVariables`：改為通用替換 `{{key}}` → `recipient.vars[key] ?? 舊對照表`；舊 `{{姓名}}` 對到 `vars.聯絡人 || name`。
- 追蹤像素：`tracking && target==='prospects'` 時，在 `FOOTER_HTML` 前插入
  `<img src="https://asia-east1-apps-script-api-443402.cloudfunctions.net/trackEmailOpen?c={campaignId}&r={index}&t={token}" width="1" height="1" alt="" style="display:none">`
  `token = sha256(campaignId + index + TRACKING_SALT).slice(0,16)`（`TRACKING_SALT` 為新 secret；避免被亂打）。
- 寫回：`target==='prospects'` 時寫 `prospects/{leadId}`：
  ```js
  emailLogs: arrayUnion({ campaignId, subject, to: email, contactId, sentAt, status, error, openedAt: null, openCount: 0 }),
  events: arrayUnion({ type: 'email_sent', at: sentAt, by: operatorKey, byName, meta: { campaignId, status, to: email } }),
  lastEmailAt: sentAt, lastEmailStatus: status, emailCount: FieldValue.increment(status==='sent'?1:0),
  status: (目前為 'new' 且 status==='sent') ? 'emailed' : 不變,    // 以 transaction 讀後決定
  updatedAt: sentAt
  ```
- `mailOptions.replyTo = replyTo`；campaign 文件寫入 `target`／`replyTo`／`tracking`。
- 其餘（逐位寄送、300ms 間隔、附件、MAX 500）不變。記憶體維持 `512MiB`。

### 6.3 寄信後自動排追蹤
- 前端在 `sent` 回呼後：對每個「成功」的 prospect，若 `followUpAt` 為空或早於今天，設 `followUpAt = 今天 + followUpDaysAfterEmail`，並追加 `events: followup_set`（`meta.auto=true`）。
- 放前端做（而非 function）是為了讓使用者可在同一畫面立即看到並調整；量級 < 500 筆用 `writeBatch`。

### 6.4 開信追蹤 `trackEmailOpen`（新增，`onRequest`）
```js
exports.trackEmailOpen = onRequest({ region: 'asia-east1', memory: '512MiB', secrets: ['TRACKING_SALT'] }, async (req, res) => {
  // 1. 解析 c/r/t；驗 token；任何錯誤都回 1x1 gif（不洩漏資訊）
  // 2. emailCampaigns/{c}：recipients[r].openedAt ??= now、openCount++；opened 重新計數
  // 3. 若 campaign.target==='prospects' 且 recipients[r].leadId：
  //    prospects/{leadId}：lastOpenedAt = now、openCount++、
  //    emailLogs 內對應 campaignId 的 openedAt ??= now / openCount++（讀出陣列改寫後整體 update）、
  //    events arrayUnion({ type:'email_opened', at: now, meta:{ campaignId } })（同 campaign 每小時最多記 1 次，避免洗版）
  // 4. 回應：Content-Type image/gif、Cache-Control: no-store、1x1 透明 gif
});
```
- 檔案放 `functions/trial/emailTracking.js`，`index.js` 一行 `exports.trackEmailOpen = require('./trial/emailTracking').trackEmailOpen`。
- 部署：`FUNCTIONS_DISCOVERY_TIMEOUT=120 firebase deploy --only functions:sendMarketingEmail,functions:trackEmailOpen`。
- 已知限制：Gmail 圖片代理會在使用者開信時抓一次（仍算開信），但 Apple Mail Privacy 會預先載入造成誤判；UI 標示「開信（參考）」。

### 6.5 手動「標記已回覆」
- 詳情面板 `＋標記已回覆` → dialog：回覆時間（預設現在）、摘要（選填）。寫 `repliedAt`、`events: reply`，若狀態 ∈ {new, emailed} 自動改 `replied`。

---

## 7. 前端檔案

| 檔案 | 說明 |
|---|---|
| `src/views/admin/ProspectManager.vue` | 主頁（tabs、名單、批次操作、匯入／匯出、設定） |
| `src/components/prospecting/ProspectDetailPanel.vue` | 右側／全螢幕詳情面板 |
| `src/components/prospecting/ProspectContactsEditor.vue` | 聯絡人表格＋編輯 dialog |
| `src/components/prospecting/ProspectEventDialog.vue` | 新增活動（電話／LINE／會面／備註／已回覆）小 dialog |
| `src/components/prospecting/ProspectImportDialog.vue` | Excel 匯入（解析、對應、預覽、執行） |
| `src/components/prospecting/ProspectFilters.vue` | 篩選列（可抽出以免主頁過長） |
| `src/services/prospectService.js` | Firestore CRUD、常數（狀態／事件對照／預設標籤）、匯入比對、匯出、`nameKey()`、`resolveCompanyId()` |
| `src/store/prospectStore.js` | 快取全部 `prospects`（onSnapshot 或手動 refresh）、`dueTodayCount` 給 Home badge |
| `src/components/marketing/MarketingEmailComposer.vue` | 加 `target`／`replyTo`／`tracking` props、變數文案、`scope` 過濾（向下相容） |
| `src/components/marketing/TrialLeadTagManager.vue` | 加 prop `collection`（預設 `trialLeadTags` 現行來源）讓 prospects 重用 |
| `src/api.js` | `sendMarketingEmailAPI` 已可傳額外欄位，不用改；新增 `fetchProspectSettings/saveProspectSettings` 可放 service |
| `src/views/Home.vue`、`src/router/index.js` | 入口＋路由＋`HIDE_FOR_TRIAL` |
| `firestore.rules` | `prospects`／`prospectTags`／`prospectImports`／`systemSettings/prospecting` 超管限定 |

後端：

| 檔案 | 說明 |
|---|---|
| `functions/trial/marketingEmail.js` | §6.2 擴充 |
| `functions/trial/emailTracking.js` | 新增 `trackEmailOpen` |
| `functions/index.js` | export `trackEmailOpen` |
| Secret Manager | 新增 `TRACKING_SALT` |

---

## 8. 權限與安全

- 路由 `requiredRoles: ['超級管理員']`；Home 以 `permissionArgs` 過濾；試用帳號 `HIDE_FOR_TRIAL`。
- Functions：`sendMarketingEmail` 已 `assertSuperAdmin`；`trackEmailOpen` 為公開端點但只接受帶有效 token 的 `c/r`，且只做「標記已開信」一件事、不回任何資料。
- Firestore 規則：新集合超管限定讀寫。
- Email 寄送上限沿用 500／次；Gmail 帳號每日上限由 SENDER_EMAIL 承擔（提醒：單日群發建議 ≤ 300 封，分兩天寄）。
- `do_not_contact` 狀態與「不聯絡」標籤在 Composer 端與 function 端（`normalizeRecipients` 加檢查 `excluded`）雙重排除。

---

## 9. 驗收清單

1. 非超管登入看不到 Home「客戶開發」；直接打 `/admin/prospects` 被擋。試用帳號 TESTA 看不到。
2. 匯入 `新竹建案廣告投放名單.xlsx`：建案 78／建商 53／代銷 15／公會平台 12 全數進入；再匯入一次 → 全部「更新」、0 新增；建案 `豐邑之森` 的 `companyId` 指到 `浩瀚開發(豐邑機構)`；春福四案指到同一建商。
3. 名單篩選「有 Email」= 13 筆建案 + 建商中有 Email 者；搜尋「春福」列出建案與建商。
4. 勾選 3 筆（其中 1 筆 `do_not_contact`）→ 寄信 → Composer 顯示 2 位有效收件人、1 位排除；套用範本、加附件、變數 `{{建案}}` 在預覽正確替換；送出後 campaign 出現在「寄信紀錄」tab，`target='prospects'`；每筆 prospect 的 `emailLogs`／`events`／`lastEmailAt` 更新；狀態由 `new` 變 `emailed`；`followUpAt` 自動 = 今天+7。
5. 用收件信箱開信 → 60 秒內 campaign `opened` 與 prospect `lastOpenedAt` 更新，時間軸出現「已開信」。回信會進操作者信箱（Reply-To）。
6. 詳情面板：改狀態／加標籤／設追蹤日／新增聯絡人／新增電話紀錄／標記已回覆，重新整理後皆保留；「標記已回覆」使狀態變 `replied`。
7. 「今日待追蹤」chip 數字 = `followUpAt <= 今天` 且狀態非 `won/do_not_contact` 的筆數；Home 按鈕 badge 同步。
8. 匯出 xlsx 四工作表 + 開發欄位，可重新匯入而不產生重複。
9. 標籤改名／刪除後所有 prospects 的 `tags` 同步。
10. 手機（<960px）：名單可捲動、點列開全螢幕詳情、可寄信。
11. 既有「試用留資」寄信功能行為不變（回歸）。

---

## 9.1 實作備註（2026-08-29 v1 完成）

- 基本資料採「編輯後按儲存」（同試用留資面板），非逐欄失焦即存；開發備註為失焦即存。
- 「標籤管理」為名單 tab 上的按鈕（開 `TrialLeadTagManager`，傳入 `prospectTagAdapter`），未另設 tab。
- 預設範本只有文字（取自 `20260829廣告文案.md`），廣告圖需自行於範本編輯加為附件或內嵌。
- 匯出的建案工作表中「狀態_銷售」為銷售狀態、「狀態」為開發狀態；重新匯入時只讀「狀態_銷售」，開發狀態不會被覆蓋。
- Firestore 規則不在本 repo（由 Console 管理）：`prospects`／`prospectImports`／`systemSettings/prospectTags`／`systemSettings/prospecting` 需比照 `trialLeads` 開放給已登入使用者（超管限制由路由與 Functions 把關）。
- `TRACKING_SALT` 已於 Secret Manager 建立（版本 1）。
- 相關檔案：`src/views/admin/ProspectManager.vue`、`src/components/prospecting/*`、`src/services/prospectService.js`、`src/store/prospectStore.js`、`functions/trial/emailTracking.js`。

## 10. 實作順序（建議）

1. 資料層：`prospectService.js`（常數、CRUD、nameKey、匯入比對）＋ `prospectStore.js` ＋ Firestore 規則
2. 路由／Home 入口／空頁面骨架（tabs）
3. 匯入 dialog → 匯入實際名單（之後開發都有真資料可看）
4. 名單表格＋篩選＋批次操作
5. 詳情面板（基本資料、聯絡人、狀態／標籤／追蹤日、活動紀錄）
6. Composer／function 擴充（target、replyTo、變數）→ 寄信寫回 → 自動追蹤日
7. `trackEmailOpen` ＋ UI 開信顯示
8. 寄信紀錄／範本／標籤 tab 接線、預設範本 seed
9. 匯出、設定 dialog
10. CHANGELOG（commit-notes）、部署 functions
