# SPEC: 自訂表單提交後 LINE 通知功能

> 建立日期：2026-04-26
> 狀態：待實作

## 一、功能概述

當使用者透過公開連結填寫並首次提交自訂表單後，系統依照表單設定自動透過 LINE 通知相關人員（必要時 Email 補發），並提供「可修改回覆」的公開連結讓收件人代為調整資料。

---

## 二、資料模型變更

### 2.1 `customFormTemplates/{formId}` 新增欄位

```ts
{
  // 既有欄位...
  notifySalesAdmins: boolean;        // 通知本建案銷控系統管理員，預設 true
  notifyUnitSalesPerson: boolean;    // 通知該戶別銷售人員，預設 true
  notificationExcludedUserKeys: string[];  // 通知抑制名單（per form），預設 []
}
```

> 編輯權限門檻：使用者擁有該建案「銷控系統」權限即可看到並修改此區塊。

### 2.2 `customFormSubmissions/{submissionId}` 新增欄位

```ts
{
  // 既有欄位...
  lastModifiedAt?: Timestamp;        // 銷控人員代客修改時更新
  notificationSent?: boolean;        // onCreate trigger 處理完成後標記
  notificationSentAt?: Timestamp;
}
```

### 2.3 `salesHouseholds/{docId}` 已存在欄位（僅讀取）

```ts
{
  salespersonUserKey: string;  // 對應 users/{userKey}
}
```

### 2.4 通知日誌：`projects/{projectId}/notificationLogs/{autoId}`

沿用現有銷控通知 log 集合，type 區分：

```ts
{
  type: 'formSubmission';
  formId: string;
  submissionId: string;
  unitId: string | null;
  recipients: Array<{
    userKey: string;
    name: string;
    channel: 'line' | 'email';
    success: boolean;
    error?: string;
    source: 'salesAdmin' | 'unitSalesPerson';  // 收件來源
  }>;
  createdAt: Timestamp;
}
```

---

## 三、後端 (Cloud Functions)

### 3.1 新增 Trigger：`notifyOnFormSubmission`

- **檔案**：`functions/notifications/formSubmissionNotifier.js`（新建）
- **註冊位置**：`functions/index.js`
- **觸發**：`onDocumentCreated('customFormSubmissions/{submissionId}')`
- **記憶體**：`512MiB`（依專案規範）
- **Region**：`asia-east1`

#### 處理流程

```
1. 讀取 submission 文件 → 取得 projectId, formId, unitId, data
2. 讀取 customFormTemplates/{formId} → 取得 notify 設定
3. 收件人收集：
   a) 若 notifySalesAdmins:
      - 查 userPermissions：permissions.{projectId}.systems array-contains-any ['銷控系統','報價系統']
      - **此來源套用** 抑制名單與 admin 角色過濾
      - 標記 source='salesAdmin'
   b) 若 notifyUnitSalesPerson 且 submission.unitId 存在:
      - 查 salesHouseholds/${projectId}_${unitId} → 取 salespersonUserKey
      - **此來源凌駕**抑制名單與 admin 角色過濾（該戶銷售必收）
      - 標記 source='unitSalesPerson'
4. 去重：以 userKey 為 key 合併（同人多來源時，source 取 'unitSalesPerson' 優先 → 因此抑制名單對該人也失效）
5. 排除：系統/超級管理員角色僅對 source='salesAdmin' 生效；source='unitSalesPerson' 不受影響
6. 為每位收件人選擇 channel：
   - lineId 以 'U' 開頭 → channel='line'
   - 否則若有 email → channel='email'
   - 都無 → 記為 success=false, error='no_contact'
7. 構建訊息（見 §3.2）
8. 並行發送（Promise.allSettled），記錄成功/失敗
9. 寫入 notificationLogs
10. 更新 submission：notificationSent=true, notificationSentAt
```

### 3.2 LINE Flex Message 結構

連結 URL：`https://{HOST}/form-view/{submissionId}`

```js
{
  type: 'flex',
  altText: `[${projectName}] ${formTitle} - 新表單提交`,
  contents: {
    type: 'bubble',
    header: {
      type: 'box', layout: 'vertical',
      backgroundColor: '#1A237E',
      contents: [
        { type: 'text', text: `[${projectName}] 表單通知`, weight: 'bold', color: '#FFFFFF', size: 'md' }
      ]
    },
    body: {
      type: 'box', layout: 'vertical', spacing: 'sm',
      contents: [
        { type: 'text', text: formTitle, weight: 'bold', size: 'lg', wrap: true },
        // 戶別行：unitId 存在才出現
        ...(unitId ? [row('戶別', unitId)] : []),
        row('提交者', `${buyerName} ${buyerPhone}`),
        row('提交時間', timestampText),
      ]
    },
    footer: {
      type: 'box', layout: 'vertical',
      contents: [{
        type: 'button', style: 'primary', color: '#1A237E',
        action: { type: 'uri', label: '查看 / 修改回覆', uri: viewUrl }
      }]
    }
  }
}
```

### 3.3 Email 補發樣板

沿用 `salesStatusNotifier.js` 的 HTML 結構，調整文案與按鈕指向 `viewUrl`。

### 3.4 環境變數

- 沿用 `ANXISMART_LINE_CRM_TOKEN`
- 新增（若無）：`PUBLIC_HOST`（前端域名，組 viewUrl 用）— 若已有現成設定就沿用

### 3.5 部署指令

```bash
firebase deploy --only functions:notifyOnFormSubmission
```

---

## 四、前端：表單編輯器修改

### 檔案：`src/components/CustomFormEditor.vue`

新增「通知設定」區塊（位置：表單送出後設定區塊之上）：

```html
<v-divider class="my-6" v-if="canEditNotify"></v-divider>
<div v-if="canEditNotify">
  <h3 class="text-h6 mb-4 font-weight-bold text-grey-darken-3">通知設定</h3>

  <v-checkbox v-model="form.notifySalesAdmins"
              label="通知本建案的銷控系統管理員"
              color="primary" hide-details />

  <v-checkbox v-model="form.notifyUnitSalesPerson"
              label="通知該戶別的銷售人員（需表單包含「戶別」系統欄位）"
              color="primary" hide-details class="mt-2" />

  <v-autocomplete
    v-model="form.notificationExcludedUserKeys"
    :items="projectUsers"
    item-title="displayLabel"
    item-value="userKey"
    label="通知抑制名單（這些人不會收到此表單的通知）"
    multiple chips clearable variant="outlined" class="mt-4"
    hint="從本建案有銷控系統權限的人員中選擇" persistent-hint
  />
</div>
```

#### 權限判斷

```ts
const canEditNotify = computed(() => {
  const userPerms = currentUserPermissions.permissions?.[projectId];
  return userPerms?.systems?.includes('銷控系統') === true;
});
```

#### `loadForm()` 新增 fallback

```ts
form.value = {
  // 既有...
  notifySalesAdmins: data.notifySalesAdmins ?? true,
  notifyUnitSalesPerson: data.notifyUnitSalesPerson ?? true,
  notificationExcludedUserKeys: data.notificationExcludedUserKeys ?? [],
};
```

#### `saveForm()` 寫入

無 `canEditNotify` 權限的使用者儲存時，**保留原值**（從 `loadForm` 讀到的值），不會被覆寫。新建表單由建立者預設兩個都 true、抑制名單為空。

#### `projectUsers` 載入

新增邏輯：透過 `userPermissions` 集合查出該 projectId 有銷控系統權限的所有人，組成 `[{userKey, name, displayLabel}]`。

---

## 五、前端：新公開路由 `/form-view/:submissionId`

### 5.1 路由註冊

`src/router/index.js`（或同等位置）：

```ts
{
  path: '/form-view/:submissionId',
  name: 'PublicFormView',
  component: () => import('@/views/public/PublicFormView.vue'),
  meta: { public: true }
}
```

### 5.2 新檔案：`src/views/public/PublicFormView.vue`

職責：以「填寫時的相同樣式」呈現該 submission，允許銷控人員代客修改並覆寫。

#### 流程

1. 從 URL 取 `submissionId`，讀取 `customFormSubmissions/{submissionId}`
2. 找不到 → 顯示「連結無效」
3. `isDeleted: true` → 顯示「此回覆已被刪除」
4. 讀對應 `customFormTemplates/{formId}` 取欄位定義
5. 將 `submission.data` 注入 formData（key 為 fieldId）
6. 渲染：複用 `FormRenderItem` 元件，跟 `PublicFormPage.vue` 同樣 layout
7. **戶別系統欄位永遠 readOnly**（即使原本表單設 `readOnly: false` 也強制鎖死）
8. 點「儲存修改」：
   - 重新計算 `readableSnapshot`（同 `PublicFormPage.vue` 的邏輯）
   - `updateDoc`：覆寫 `data`、`readableSnapshot`、`lastModifiedAt: serverTimestamp()`
   - **不重發通知**
9. 顯示成功 toast，停留在頁面（不導向）

### 5.3 樣式

複用 `PublicFormPage.vue` 的卡片 / header 漸層 / FormRenderItem，差異點：

- 標題列：`{表單名稱}（修改回覆模式）`
- 副標：「您正在代客修改 {買方姓名} 在 {戶別} 的填寫內容」
- 提交按鈕文字：「儲存修改」（取代「提交表單」）

---

## 六、邊界情況彙整

| 情境 | 處理 |
|---|---|
| 表單無「戶別」欄位 | 通知該戶銷售人員直接跳過；LINE 訊息「戶別」整列不顯示 |
| `salesHouseholds` 找不到 `salespersonUserKey` | 跳過該收件人，log 記 `error='no_salesperson'` |
| 收件人無 lineId 也無 email | log 記 `error='no_contact'`，success=false |
| LINE API 失敗 | log 記實際錯誤訊息，不阻擋其他收件人發送 |
| 抑制名單包含全部收件人 | 不發任何通知，仍寫一筆 log（recipients=[]）|
| `notifySalesAdmins=false` 且 `notifyUnitSalesPerson=false` | 不發送，不寫 log |
| 同一人既是銷控管理員也是該戶銷售 | 去重，source 取 `unitSalesPerson`，只發 1 則 |
| 該戶銷售人員在抑制名單內 | 仍然發送（unitSalesPerson 凌駕抑制名單） |
| 該戶銷售人員是系統管理員角色 | 仍然發送（unitSalesPerson 凌駕角色排除） |
| 修改回覆時 trigger 不會再次觸發 | 因為是 onDocumentCreated 不是 onWrite，`updateDoc` 不會觸發 |
| 表單軟刪除後（`isDeleted=true`） | PublicFormView 顯示「此回覆已被刪除」 |

---

## 七、實作順序建議

1. **後端**：建立 `formSubmissionNotifier.js` + 註冊 trigger，先不串前端，用 Firestore 手動建文件測試
2. **前端編輯器**：CustomFormEditor 加通知設定 UI
3. **前端公開頁**：PublicFormView.vue + 路由註冊
4. **整合測試**：建立含戶別的表單 → 公開填寫 → 驗證 LINE 收到 → 點連結修改 → 驗證資料更新
5. **部署**：`firebase deploy --only functions:notifyOnFormSubmission`

---

## 八、待確認事項

1. `PUBLIC_HOST` 環境變數是否已存在？若無，部署前需 `firebase functions:config:set` 或加到 `.env`。
2. 「通知抑制名單」的候選人選清單是否限定「該建案銷控系統權限者」？預設為「是」，避免名單太雜。

---

## 九、需求問答記錄（決策依據）

| 編號 | 問題 | 決策 |
|---|---|---|
| Q1 | 「銷控系統」權限定義 | 只篩 `銷控系統`，不含報價系統 |
| Q2 | 該戶別銷售人員查詢方式 | `salesHouseholds.salespersonUserKey` → `users/{key}.lineId` |
| Q3 | 收件人去重 | 同人只收 1 則 |
| Q4 | 找不到 lineId | Email 補發 |
| Q5 | 連結頁面行為 | 可修改回覆 |
| Q6 | 路由設計 | 公開路由 `/form-view/:token`，無須登入 |
| Q7 | Token 機制 | 永久有效、複用 submissionId、多人可開 |
| Q8 | 觸發時機 | 只首次提交（onCreate） |
| Q9 | LINE 訊息內容 | 建案/表單名/戶別/提交者/時間 + 連結按鈕，不含欄位摘要 |
| Q10 | 通知日誌 | 寫入 `notificationLogs` |
| Q11 | 設定範圍 | 表單模板內可選通知對象 |
| Q12 | 抑制名單 | 有，per form |
| Q13 | Trigger 方式 | Firestore onCreate trigger |
| Q14 | LINE Token | 沿用 `ANXISMART_LINE_CRM_TOKEN` |
| F1-a | 通知設定預設值 | 兩個都勾選 |
| F1-b | 編輯權限門檻 | 擁有「銷控系統」權限即可 |
| F1-c | 欄位命名 | `notifySalesAdmins`, `notifyUnitSalesPerson` |
| F2 | 抑制名單範圍 | per form（`customFormTemplates.notificationExcludedUserKeys`） |
| F3 | URL token | 直接用 submissionId |
| F4 | 修改人標記 | 不記錄修改人，僅記 `lastModifiedAt` |
| F5 | 戶別欄位缺席時 LINE 顯示 | 該行整列不顯示 |
| F6 | 修改後再通知 | 不再發 |
| F7 | 修改回覆頁戶別可改否 | 永遠唯讀 |
