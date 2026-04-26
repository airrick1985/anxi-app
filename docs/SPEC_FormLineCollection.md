# SPEC: 自訂表單收集填寫者 LINE ID 功能

> 建立日期：2026-04-26
> 狀態：待實作
> 相關前置功能：[SPEC_FormSubmissionNotification.md](./SPEC_FormSubmissionNotification.md)

## 一、功能概述

允許表單建立者在後台勾選「收集填寫者 LINE ID」。啟用後，公開填寫頁會在載入時要求填寫者完成 LIFF 登入，取得 `userId` 與 `displayName` 後再進入填寫流程；同人 + 同表單 + 同戶別重複填寫時，自動進入「修改模式」覆寫先前的回覆。

---

## 二、資料模型變更

### 2.1 `customFormTemplates/{formId}` 新增欄位

```ts
{
  // 既有欄位...
  requireLineLogin: boolean;   // 預設 false；true = 公開頁需完成 LIFF 登入
}
```

### 2.2 `customFormSubmissions/{submissionId}` 新增欄位

```ts
{
  // 既有欄位...
  submitterLineId?: string;    // LINE userId（U xxx），有完成 LIFF 登入才有值
  submitterLineName?: string;  // LINE displayName
}
```

### 2.3 submissionId 命名策略

兩種格式並存：

| 模式 | 格式 |
|---|---|
| 一般（不收 LINE） | `${projectId}_${unitId}_${formTitle}_${timestamp}`（維持現狀） |
| LINE 模式（含戶別） | `${projectId}_${formId}_LINE_${lineId}_${unitId}` |
| LINE 模式（無戶別） | `${projectId}_${formId}_LINE_${lineId}` |

LINE 模式採 deterministic ID，`setDoc` 自動 upsert，不需查詢，避免並發問題。純 ASCII 也避免中文 URL 編碼問題。

> 安全保護：寫入前對 unitId 做 `.replace(/[^\w-]/g, '_')` 防止特殊字元破壞 ID。

---

## 三、後端

### 3.1 Cloud Functions
**不需新增 / 修改任何 function**。

### 3.2 通知 trigger 行為（既有 `notifyOnFormSubmission`）
- 維持只在 onCreate 觸發 → LINE 模式下「修改模式」走 updateDoc 不會重發通知
- 通知訊息**不**顯示填寫者 LINE 名稱（依 Q6 決議）

### 3.3 Firestore 規則
若 client SDK 無讀取 `customFormSubmissions` 個別文件的權限（用於修改模式預填），需要放寬規則允許「持有 submissionId 即可讀」。實作時驗證。

---

## 四、前端：表單編輯器

### 檔案：`src/components/CustomFormEditor.vue`

於「通知設定」區塊上方（或內部最上方）新增單一 checkbox：

```html
<v-checkbox
  v-model="form.requireLineLogin"
  label="收集填寫者的 LINE ID（用戶填寫前需先登入 LINE）"
  color="primary"
  hide-details
  density="comfortable"
  class="mb-2"
></v-checkbox>
```

### `loadForm()` fallback
```ts
form.value = {
  // 既有...
  requireLineLogin: data.requireLineLogin ?? false,
};
```

### form ref 預設值
```ts
const form = ref({
  // 既有...
  requireLineLogin: false,
});
```

### 權限門檻
此 checkbox 與既有「通知設定」區塊共用 `canEditNotify` 條件（擁有銷控系統權限才能編輯）。

---

## 五、前端：公開填寫頁 PublicFormPage.vue

### 5.1 流程圖

```
[onMounted] 載入 token + 表單模板
    ↓
[檢查 form.requireLineLogin]
    ├─ false → 進入既有流程（原始邏輯不變）
    └─ true  → 進入 LIFF 流程
                ↓
            [liff.init({ liffId: VITE_LIFF_ID_FORM })]
                ↓
            [liff.isLoggedIn()?]
                ├─ 否 → liff.login({ redirectUri: window.location.href })
                │       (LINE 授權後 reload，下次進入此分支變 yes)
                └─ 是 → liff.getProfile() → { userId, displayName }
                        ↓
                    存入 lineProfile state
                    ↓
                    繼續載入戶別 / 表單欄位
                    ↓
                    [unitId 已知時] 嘗試 getDoc(deterministicSubmissionId)
                    ├─ 存在 → 預填 formData，提示「您先前已填寫過，本次將覆寫」
                    └─ 不存在 → 空白表單

[submit]
    ↓
[組 submissionId]
    ├─ requireLineLogin 模式 → deterministic ID
    └─ 一般模式 → 原 timestamp ID
    ↓
[setDoc] 自動 upsert
    ↓
[寫入 submitterLineId / submitterLineName 兩欄位（若有）]
```

### 5.2 程式碼骨架

```ts
import liff from '@line/liff';

const lineProfile = ref<{ userId: string; displayName: string } | null>(null);
const liffError = ref<string>('');
const isModifyMode = ref(false);

const initLineLogin = async () => {
  try {
    const liffId = import.meta.env.VITE_LIFF_ID_FORM;
    if (!liffId) throw new Error('LIFF_ID_NOT_CONFIGURED');
    await liff.init({ liffId });

    if (!liff.isLoggedIn()) {
      liff.login({ redirectUri: window.location.href });
      return false;  // 跳轉中，後續邏輯不執行
    }

    const profile = await liff.getProfile();
    lineProfile.value = {
      userId: profile.userId,
      displayName: profile.displayName,
    };
    return true;
  } catch (err) {
    console.error('[PublicFormPage] LIFF init/login 失敗:', err);
    liffError.value = '需要 LINE 授權才能填寫此表單，請允許授權後再試';
    return false;
  }
};

// onMounted 內：
if (form.value.requireLineLogin) {
  const ok = await initLineLogin();
  if (!ok) {
    // 顯示 liffError，停止後續處理
    return;
  }
}

// 戶別確定後（unitId 鎖定 or 用戶選擇）：
const tryLoadExistingSubmission = async (unitId: string) => {
  if (!lineProfile.value) return;
  const id = buildLineSubmissionId(projectId.value, form.value.id, lineProfile.value.userId, unitId);
  const snap = await getDoc(doc(db, 'customFormSubmissions', id));
  if (snap.exists()) {
    const data = snap.data();
    Object.assign(formData, data.data || {});
    currentSubmissionId.value = id;
    isModifyMode.value = true;
  }
};

// 提交時：
const submissionId = lineProfile.value
  ? buildLineSubmissionId(projectId.value, form.value.id, lineProfile.value.userId, formData.unitId)
  : (currentSubmissionId.value || `${projectId.value}_${formData.unitId}_${form.value.title}_${Date.now()}`);

const payload: any = {
  projectId: projectId.value,
  formId: form.value.id,
  unitId: formData.unitId,
  data: submissionData,
  readableSnapshot,
  snapshotAvailable: true,
  submittedAt: serverTimestamp(),
  tokenUsed: token,
};
if (lineProfile.value) {
  payload.submitterLineId = lineProfile.value.userId;
  payload.submitterLineName = lineProfile.value.displayName;
}
await setDoc(doc(db, 'customFormSubmissions', submissionId), payload, { merge: false });
```

### 5.3 deterministic ID 工具

```ts
const sanitizeForId = (s: string) => String(s || '').replace(/[^\w-]/g, '_');
const buildLineSubmissionId = (projectId: string, formId: string, lineId: string, unitId?: string) => {
  const base = `${projectId}_${formId}_LINE_${lineId}`;
  return unitId ? `${base}_${sanitizeForId(unitId)}` : base;
};
```

### 5.4 UI 變化
- 表單標頭顯示：`已以 LINE 帳號 {displayName} 登入`（顯示頭像 chip）
- 修改模式時顯示提示：「您先前已填寫過此戶別，本次提交將覆寫先前回覆」
- LIFF 失敗時整個表單區塊以 v-card error 替代

### 5.5 LIFF redirectUri 注意事項
`liff.login({ redirectUri })` 接受完整 URL。`window.location.href` 含 hash (`#/s/{token}`)，LIFF SDK 會將之保存於 `liff.state` 並於登入後還原。`router/index.js:779` 已有 `liff.state` 處理邏輯，路徑會被正確還原到 `/s/{token}`。

---

## 六、前端：後台回覆檢視 CustomFormResponses.vue

### 新增「填寫者 LINE」欄位

於資料表頭部加入新欄：

```html
<th>填寫者 LINE</th>
```

每列 cell：
```html
<td>
  <span v-if="row.submitterLineName" :title="row.submitterLineId">
    {{ row.submitterLineName }}
  </span>
  <span v-else class="text-grey">—</span>
</td>
```

### Excel 匯出
匯出邏輯加入兩欄：「填寫者 LINE 名稱」「填寫者 LINE userId」（若該表單啟用 `requireLineLogin`）。

---

## 七、邊界情況彙整

| 情境 | 處理 |
|---|---|
| `requireLineLogin=false` 表單 | 完全不走 LIFF，原行為 |
| LIFF init 失敗（網路 / SDK 錯誤） | 顯示 error 阻擋表單 |
| 用戶拒絕 LINE 授權 | `getProfile()` throw → 進 catch → 顯示 error 阻擋 |
| 桌面/外部瀏覽器 | LIFF 自動走 LINE Login OAuth → 用戶 LINE 登入後返回 |
| 用戶無 LINE 帳號 | OAuth 頁面引導註冊 / 提示 |
| 同人填同戶 | 自動找到既有 submission 預填，提交時覆寫 |
| 同人填不同戶 | submissionId 不同，新建獨立紀錄 |
| 同人在無戶別表單填多次 | 視為同一份，覆寫 |
| LIFF login redirect 後 hash 遺失 | 由 router guard 的 `liff.state` 處理還原 |
| submitterLineName 含特殊字元 | 直接寫入 Firestore，前端顯示時依靠瀏覽器 escape |
| LINE displayName 變更 | 每次提交時用最新 displayName 覆寫，userId 不變 |
| 修改模式下舊 readableSnapshot 結構與新表單欄位不一致 | 以新表單模板的 fields 重新生成 readableSnapshot |
| 無 lineId 的舊 submission | 後台欄位顯示 "—" |

---

## 八、實作順序建議

1. **資料模型 + 表單編輯器**：CustomFormEditor 加 checkbox + form ref / loadForm fallback + saveForm 寫入
2. **PublicFormPage 整合 LIFF**：依 §5 流程實作
3. **後台欄位**：CustomFormResponses 加欄位 + Excel 匯出
4. **整合測試**：
   - 建立啟用 LINE 收集的表單
   - 桌面瀏覽器開啟 → 驗證 LIFF OAuth 跳轉
   - 手機 LINE App 內開啟 → 驗證無感登入
   - 同人重填 → 驗證進入修改模式預填
   - 後台檢視 → 驗證欄位顯示
5. **無需部署 functions**（純前端改動）

---

## 九、待確認事項

1. **VITE_LIFF_ID_FORM 對應的 LIFF App 設定**：
   - Endpoint URL 是否為 `https://anxismart.com`
   - Scopes 是否含 `profile`、`openid`
   - 若 scopes 不含 profile，需到 LINE Developers Console 開啟
2. **Firestore rules**：確認公開頁可讀取 `customFormSubmissions/{deterministicId}` 來實現修改模式預填
3. **VITE_LIFF_ID_DEV 切換**：開發環境是否要走 `VITE_LIFF_ID_DEV`？實作可加 `import.meta.env.MODE` 判斷

---

## 十、需求問答記錄

| 編號 | 問題 | 決策 |
|---|---|---|
| Q1 | LIFF ID 選擇 | 後改為新建專屬 LIFF App「表單填寫」（`VITE_LIFF_ID_FORM=2008257338-gmEaYQzA`） |
| Q2 | 用戶不授權怎麼辦 | (a) 完全擋下 |
| Q3 | 同人重複填寫 | (b) 自動進入修改模式（預填覆寫） |
| Q3-延伸 | 唯一鍵組合 | (b) (projectId, formId, lineId, unitId) |
| Q4 | 存哪些 LINE 資料 | (b) 只存 userId + displayName |
| Q5 | 隱私聲明 | (a) 不顯示（LIFF 授權頁本身會問） |
| Q6 | 通知訊息含填寫者 LINE | (b) 否，維持現狀 |
| Q7 | 後台欄位顯示填寫者 LINE | (a) 是，加一欄 |
| Q8 | PublicFormView 修改頁也要 LINE 登入嗎 | (a) 維持現狀（憑 submissionId 直接修改） |
