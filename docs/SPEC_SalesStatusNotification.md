# 功能 Spec：銷控狀態通知

**版本**: 0.2
**建立日期**: 2026-04-20
**狀態**: 待實施

---

## 1. 功能概述

### 1.1 目標
在「修改銷控 → 儲存」與「確認退戶」這兩個操作完成後，由操作者透過互動式對話框**即時挑選**接收人員與通道（LINE / Email），向「擁有該建案『報價系統』或『銷控系統』權限」的相關人員發送銷控狀態變動通知。

避免不同銷售人員重複介紹已售出戶別、或未即時得知釋出戶別。

### 1.2 使用情景
- A 業務在後台將 B-5 戶設為「小訂」→ 儲存成功 → 跳出通知對話框 → A 勾選 3 位同建案業務 + LINE & Email → 按「發送通知」→ 對方收到綠色 Flex「已售出，請勿重複介紹」。
- 客戶取消，操作者執行「確認退戶」→ 確認成功 → 跳出通知對話框 → 操作者按「本次不通知」→ 不寄送任何通知。

### 1.3 與現有功能的關係
- **依附入口**：[UnitDetailModal.vue:1120](../src/components/UnitDetailModal.vue#L1120) `executeSaveChanges` → `updateSalesData` Cloud Function；以及 `cancelPurchase` Cloud Function（[src/api.js:917](../src/api.js#L917)）。
- **沿用權限模型**：`userPermissions/{userKey}.permissions.{projectId}.systems` 陣列，以 `array-contains-any` 查詢「銷控系統」「報價系統」。
- **沿用 LINE 推播**：複用 `_sendLeadAssignmentFlex` 模式（functions/index.js:20872），環境變數 `ANXISMART_LINE_CRM_TOKEN`，以 `users.lineId`（格式 `U...`）作為 to。
- **沿用 Email 基建**：functions 既有 Nodemailer transporter（`SENDER_EMAIL` / `GMAIL_APP_PASSWORD`）。

---

## 2. 觸發流程

### 2.1 高階流程圖
```
使用者操作
   │
   ├── 修改銷控 → 儲存                確認退戶
   │       │                              │
   │       ▼                              ▼
   │  updateSalesData                cancelPurchase
   │  （比對舊新 salesStatus_backend） （視為退戶事件）
   │       │                              │
   │       └─────────┬────────────────────┘
   │                 ▼
   │        Cloud Function 回傳：
   │        { statusChanged: true, oldStatus, newStatus,
   │          eligibleRecipients: [{ userKey, name, email,
   │          hasLine, hasEmail }, ...] }
   │                 ▼
   │      前端開啟「銷控通知對話框」
   │      （勾選人員 / 勾選通道 / 預覽訊息）
   │                 ▼
   │       ┌─────────┴─────────┐
   │       ▼                   ▼
   │  [發送通知]           [本次不通知]
   │       │                   │
   │       ▼                   ▼
   │  sendSalesStatus     寫入一筆
   │  Notification        skipped log 後關閉
   │  (Cloud Function)
   │       │
   │       ▼
   │  對選定 recipient 寄 LINE / Email
   │  寫 notificationLogs
```

### 2.2 觸發判斷
| 觸發點 | 判斷條件 | newStatus 來源 |
| --- | --- | --- |
| 修改銷控 → 儲存 | `salesStatus_backend` 與儲存前舊值不同（含「有值 → 空值」「空值 → 有值」） | 新存入的 `salesStatus_backend`（可能為空字串 → 視為 neutral） |
| 確認退戶 | 一律觸發 | 固定為 `退戶` |

> **不會觸發**：純粹只改買方姓名 / 電話 / 車位等非 `salesStatus_backend` 欄位的儲存。
> **不限流**：依需求每次變動皆觸發對話框，由操作者自行決定是否發送。

---

## 3. 狀態分類

新增前後端共用模組 `src/utils/salesStatusGroups.js`（functions 端 require 同一份）：

```js
const DEAL_STATUSES = ['小訂', '補足', '簽約', '成交', '已售', '保留', '售出', '銷控'];
const RELEASED_STATUSES = ['退戶', '退訂', '解約', '取消', '刪除', '釋出', '退簽約', '退小訂', '退補足'];

function classifySalesStatus(status) {
  if (!status) return 'neutral';                           // 空字串 / null
  if (DEAL_STATUSES.includes(status)) return 'deal';
  if (RELEASED_STATUSES.includes(status)) return 'released';
  return 'neutral';
}

const STATUS_STYLE = {
  deal:     { color: '#2E7D32', tag: '已售出，請勿重複介紹', emoji: '✅' },
  released: { color: '#C62828', tag: '已釋出，可放介紹',     emoji: '🔓' },
  neutral:  { color: '#616161', tag: '',                     emoji: 'ℹ️'  },
};

module.exports = { DEAL_STATUSES, RELEASED_STATUSES, classifySalesStatus, STATUS_STYLE };
```

| 類別 | 顏色 | 加註文字 | 典型情境 |
| --- | --- | --- | --- |
| `deal` | 綠 `#2E7D32` | 已售出，請勿重複介紹 | 小訂 / 補足 / 簽約 / 成交 等 |
| `released` | 紅 `#C62828` | 已釋出，可放介紹 | 退戶 / 退訂 / 解約 等 |
| `neutral` | 灰 `#616161` | （無加註） | 狀態歸零（被清空）或未列入分類的字串 |

---

## 4. 通知內容格式

### 4.1 通用文案
```
[{projectName}] 銷控通知
戶別：{unitId}
狀態：{newStatus || '（已清空）'}
{加註文字}
操作者：{operatorName}
時間：{yyyy/MM/dd HH:mm}
```

### 4.2 LINE Flex Message
參考 `_sendLeadAssignmentFlex` 結構：

```jsonc
{
  "type": "flex",
  "altText": "[{projectName}] 銷控通知 - {unitId} {newStatus}",
  "contents": {
    "type": "bubble",
    "header": {
      "type": "box", "layout": "vertical",
      "backgroundColor": "{STATUS_STYLE.color}",
      "contents": [
        { "type": "text", "text": "[{projectName}] 銷控通知",
          "weight": "bold", "color": "#FFFFFF", "size": "md" }
      ]
    },
    "body": {
      "type": "box", "layout": "vertical",
      "contents": [
        { "type": "text", "text": "戶別：{unitId}", "weight": "bold", "size": "xl" },
        { "type": "text", "text": "狀態：{newStatus}", "weight": "bold", "size": "lg",
          "color": "{STATUS_STYLE.color}", "margin": "md" },
        { "type": "text", "text": "{STATUS_STYLE.emoji} {STATUS_STYLE.tag}",
          "color": "{STATUS_STYLE.color}", "size": "sm", "margin": "sm", "wrap": true },
        { "type": "separator", "margin": "md" },
        { "type": "text", "text": "操作者：{operatorName}",
          "color": "#666666", "size": "sm", "margin": "md" },
        { "type": "text", "text": "時間：{yyyy/MM/dd HH:mm}",
          "color": "#666666", "size": "sm" }
      ]
    }
  }
}
```

> Neutral 類（加註文字為空）時，省略 tag 那一行。
> 若 `STATUS_STYLE.tag` 為空字串則隱藏該 text 元件。

### 4.3 Email HTML
- 主旨：`[{projectName}] 銷控通知 - {unitId} {newStatus || '已清空'}`
- 內容：`<table>` 結構（最大相容性），上方 banner 用 `STATUS_STYLE.color`，視覺與 LINE 對應；底部加上發信時間與「本郵件由系統自動發送，請勿直接回覆」。
- 範本變數對齊 4.1。

---

## 5. 互動式通知對話框

### 5.1 觸發時機
- `executeSaveChanges` 收到 `updateSalesData` 回傳 `statusChanged: true` 後 → 開啟對話框（取代原本的 `alert('儲存成功！')`，改為「儲存成功 + 通知選單」一體）。
- 確認退戶按鈕的 success handler → 開啟對話框。
- 對話框關閉（不論是發送或取消）後，再執行原本的 `emit('data-updated')` / `close()` 等收尾。

### 5.2 對話框 UI（新增 `SalesStatusNotifyDialog.vue`）

```
┌─────────────────────────────────────────────────────────┐
│  銷控通知                                          [X]   │
├─────────────────────────────────────────────────────────┤
│  [projectName] B-5 戶                                   │
│  狀態變更：未售 → 小訂          ✅ 已售出，請勿重複介紹    │
│  （header banner 用該分類顏色）                            │
├─────────────────────────────────────────────────────────┤
│  選擇通知對象（擁有「銷控系統」或「報價系統」權限）         │
│                                                          │
│  [☑ 全選]  [☑ LINE 全選]  [☑ Email 全選]               │
│  ─────────────────────────────────────────────────       │
│  ☑ 王小明（0912345678）        [☑ LINE]   [☑ Email]    │
│  ☑ 陳大同（0922333444）        [☐ LINE*]  [☑ Email]    │
│      *未綁定 LINE，灰底並 disabled                        │
│  ☐ 林美麗（0933444555）        [☐ LINE]   [☐ Email]    │
│  …                                                       │
├─────────────────────────────────────────────────────────┤
│  📋 預覽（折疊區，預設展開）                               │
│  ┌──────────────────────────────────────┐                │
│  │ 顯示與 4.2 一致的 Flex 預覽縮圖         │                │
│  └──────────────────────────────────────┘                │
├─────────────────────────────────────────────────────────┤
│              [本次不通知]    [發送通知 (5)]                │
└─────────────────────────────────────────────────────────┘
```

- 「發送通知」按鈕後綴顯示**勾選人數**，0 人時 disable。
- 候選名單從 5.3 取得。
- 預設勾選邏輯（5.4）。

### 5.3 候選名單來源
Cloud Function 在儲存成功的回傳裡帶上 `eligibleRecipients`，由後端統一查詢，避免前端拿到全建案使用者後再過濾：

```js
// updateSalesData / cancelPurchase 內，狀態有變動時
const snap = await db.collection('userPermissions')
  .where(`permissions.${projectId}.systems`, 'array-contains-any',
    ['銷控系統', '報價系統'])
  .get();

const userKeys = snap.docs.map(d => d.id);
const userDocs = await Promise.all(
  userKeys.map(k => db.collection('users').doc(k).get())
);

const eligibleRecipients = userDocs
  .filter(d => d.exists)
  .map(d => ({
    userKey: d.id,
    name: d.data().name || d.id,
    email: d.data().email || null,
    hasLine: typeof d.data().lineId === 'string' && d.data().lineId.startsWith('U'),
    hasEmail: !!d.data().email,
  }))
  .filter(r => r.hasLine || r.hasEmail);  // 兩者都沒有就不列出
```

> Firestore 限制：`array-contains-any` 最多比對 30 個值，本場景僅 2 個無虞。

### 5.4 預設勾選規則
- **人員**：預設勾選**全部**候選人（含操作者本人也保留，由操作者自行決定要不要取消）。
- **通道**：每位候選人預設勾選**所有可用**通道（hasLine / hasEmail 為 true 的就勾，false 的 disabled 不勾）。
- 「全選」/「LINE 全選」/「Email 全選」三個 master checkbox 可一鍵切換。
- 不在前端做「記住上次選擇」，每次重新計算（避免使用者忘記取消上次勾選導致誤發）。

### 5.5 「本次不通知」行為
- 不呼叫寄送 API。
- 仍呼叫 `logSalesStatusNotification` callable 寫一筆 `skipped` log 以利稽核（含操作者、變更前後狀態、時間）。

---

## 6. 技術實現

### 6.1 新增檔案
| 檔案 | 用途 |
| --- | --- |
| `src/utils/salesStatusGroups.js` | 狀態分類常數，前後端共用 |
| `src/components/SalesStatusNotifyDialog.vue` | 5.2 的對話框 UI |
| `functions/notifications/salesStatusNotifier.js` | LINE Flex / Email HTML 組裝、寄送、log 寫入 |

### 6.2 修改檔案
| 檔案 | 修改內容 |
| --- | --- |
| `functions/index.js` `updateSalesData` | 寫入前先 `get` 取舊值；寫入後比對狀態，若異動則查 `eligibleRecipients` 並一併回傳 `{ statusChanged, oldStatus, newStatus, eligibleRecipients }` |
| `functions/index.js` `cancelPurchase` | 成功後回傳同樣結構（`newStatus='退戶'`） |
| `functions/index.js` | 新增 callable：`sendSalesStatusNotification`、`logSalesStatusNotification` |
| `src/api.js` | 新增 `sendSalesStatusNotification(payload)`、`logSalesStatusNotification(payload)` |
| `src/components/UnitDetailModal.vue` `executeSaveChanges` | 收到 `statusChanged: true` 後開啟對話框；對話框結束後再 `emit('data-updated')` & `close()` |
| 確認退戶元件（依實際位置補上） | 同上的對話框介接 |

### 6.3 Cloud Function：`sendSalesStatusNotification`
```js
exports.sendSalesStatusNotification = functions
  .region('asia-east1')
  .runWith({ memory: '512MB' })
  .https.onCall(async (data, context) => {
    const {
      projectId, projectName, unitId,
      oldStatus, newStatus, operatorName,
      recipients,  // [{ userKey, channels: ['line','email'] }]
      triggerType, // 'update' | 'cancel'
    } = data;

    // 1. 二次驗證：每位 recipient 仍擁有「銷控系統」或「報價系統」權限
    //    並重新讀取 users 取得 lineId / email（避免前端傳來的過期資料）
    // 2. 組 Flex / HTML（依 classifySalesStatus → STATUS_STYLE）
    // 3. Promise.allSettled 對每位 recipient 的每個 channel 寄送
    // 4. 寫入 projects/{projectId}/notificationLogs/{auto}：
    //    {
    //      type: 'salesStatus',
    //      triggerType, projectName, unitId,
    //      oldStatus, newStatus, statusClass,
    //      operatorUid, operatorName,
    //      attempts: [{ userKey, channel, status: 'sent'|'failed', error? }],
    //      createdAt: serverTimestamp(),
    //    }
    return { sent: <成功數>, failed: <失敗數> };
  });
```

### 6.4 LINE 寄送（複用既有模式）
```js
const token = process.env.ANXISMART_LINE_CRM_TOKEN;
await axios.post('https://api.line.me/v2/bot/message/push', {
  to: lineId,
  messages: [{ type: 'flex', altText, contents: bubble }]
}, { headers: { Authorization: `Bearer ${token}` } });
```

### 6.5 Email 寄送
複用既有 transporter，主旨與 HTML 模板見 4.3。

### 6.6 Cloud Function：`logSalesStatusNotification`
僅寫入 log，不寄送，供「本次不通知」與其他審計需求使用。Payload 含 `triggerType`、`oldStatus`、`newStatus`、`operatorName`、`reason: 'skipped'`。

### 6.7 Memory 配置
依專案規範，本次新增 / 修改的 Cloud Functions 一律設定 `memory: '512MB'`。

---

## 7. 失敗處理

| 失敗類型 | 處理 |
| --- | --- |
| 單一 recipient 的 LINE 推送失敗（401 / userId 失效） | 寫入該 attempt 的 `failed`，不重試本次；其他 recipient 不受影響 |
| Email 發送失敗 | 同上 |
| 全部 attempts 失敗 | 在前端 toast 顯示「通知全部寄送失敗，請查 notificationLogs」；不回滾銷控儲存 |
| 收到 `statusChanged: true` 但 `eligibleRecipients` 為空陣列 | 不開對話框，前端僅 toast「儲存成功（無可通知人員）」 |
| 對話框開啟後使用者直接關閉視窗（非按下兩個按鈕之一） | 視同「本次不通知」，寫 skipped log |

---

## 8. 安全與隱私

- `users.lineId`、`users.email` 屬個資；`sendSalesStatusNotification` 內二次驗證權限後才會把這些欄位讀出與使用，前端 `eligibleRecipients` 不回傳 `lineId`（只回傳 `hasLine: boolean`），避免外洩。
- 所有寄送只能透過 callable，不對外開 HTTP。
- callable 內驗證 `context.auth` 並比對操作者具有該 `projectId` 的「銷控系統」或「報價系統」權限，否則 throw `permission-denied`。

---

## 9. 測試計畫

1. **狀態變更觸發**：將 B-5 從 `''` → `小訂` → 對話框出現，header 綠色，加註「已售出，請勿重複介紹」。
2. **狀態歸零觸發**：將 `小訂` → 清空 → 對話框出現，header 灰色，無加註文字。
3. **退戶觸發**：對 B-5 執行確認退戶 → 對話框出現，header 紅色，加註「已釋出，可放介紹」。
4. **無變動不觸發**：只改買方姓名儲存 → 不出現對話框，仍正常顯示「儲存成功」。
5. **候選名單**：建立 3 位使用者：(a) 有銷控系統權限+LINE+Email、(b) 有報價系統權限+只 Email、(c) 無權限 → 對話框只看到 (a)(b)，且 (b) 的 LINE checkbox disabled。
6. **本次不通知**：按下後不寄送，notificationLogs 出現一筆 `reason: 'skipped'`。
7. **發送 0 人**：取消所有勾選 → 「發送通知 (0)」按鈕 disable。
8. **權限被撤後 callable 防呆**：前端 hack 傳入無權限的 userKey → 後端剔除並回 `failed: 0, sent: 0` 並 log。
9. **LINE 推送失敗**：刻意設置無效 lineId → 對話框 toast 顯示部分失敗，notificationLogs 內該 attempt 為 `failed`。
10. **退戶與更新並存**：先儲存「小訂」（觸發對話框 → 操作者按發送），再馬上退戶（再次觸發對話框）→ 兩次都正常運作，無交互干擾。

---

## 10. 待確認事項（v0.2 已縮減）

- **無**。所有原本懸而未決的決策已在 v0.2 收斂：
  - LINE userId：用 `users.lineId`，token 用 `ANXISMART_LINE_CRM_TOKEN`。
  - 通知對象選擇：每次彈窗讓操作者勾選，可「本次不通知」。
  - 狀態歸零：歸入 neutral 類，仍觸發對話框。
  - 不做類別過濾、不做頻率限流。

實作期若遇到具體技術問題（例如 transporter 設定、Flex 預覽元件選用）再個案討論。

---

## 11. 版本歷史
- **v0.2（2026-04-20）**：依使用者拍板更新。改為觸發時跳出互動式對話框；移除 `salesStatusNotification` 全域設定；補上 LINE 既有實作引用。
- **v0.1（2026-04-20）**：初版草案。
