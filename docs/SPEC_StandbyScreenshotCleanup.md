# 功能 Spec：STAND BY 截圖 — 7 天保留期排程清理

**版本**: 0.1
**建立日期**: 2026-05-18
**狀態**: 待實施

---

## 1. 功能概述

### 1.1 目標
新增一個每日排程 Cloud Function，自動刪除 STAND BY 看板截圖中**超過 7 天**的資料，包含：
1. Firebase Storage 圖檔（`standby_screenshots/{projectId}/...png`）
2. Firestore `standbyScreenshots` collection 對應的 metadata 文件

保留 7 天內（含）的截圖，超過 7 天者一併清除，避免無限累積造成 Storage / Firestore 成本與容量負擔。

### 1.2 背景
- 截圖由 [saveStandbyScreenshot](../functions/index.js#L12690) 寫入：Storage 公開檔 + Firestore `standbyScreenshots` 文件（欄位含 `timestamp`、`createdAt`、`storagePath`、`imageUrl`、`projectId`、`operatorName`）。
- 目前**無任何清理機制**（無排程、無 lifecycle、無刪除入口）。
- 本次新增「欄位變化後 30 秒截圖」後，截圖產生速度大增，清理需求更迫切。

### 1.3 與現有功能的關係
- **沿用排程模式**：比照 [dailyAppointmentStatusUpdate](../functions/index.js#L6999) 的 `onSchedule` 寫法（region `asia-east1`、`timeZone: "Asia/Taipei"`）。
- **沿用 Storage 存取**：`getStorage().bucket()`（同 `saveStandbyScreenshot`）。
- **沿用 Firestore**：`new Firestore({ databaseId: "anxi-app" })`。
- 不更動 `saveStandbyScreenshot` / `fetchStandbyScreenshots` / 前端。

---

## 2. 規格

### 2.1 函式
| 項目 | 值 |
|------|-----|
| 名稱 | `cleanupStandbyScreenshots` |
| 類型 | `onSchedule` (firebase-functions/v2/scheduler) |
| region | `asia-east1` |
| schedule | `every day 03:30`（離峰時間） |
| timeZone | `Asia/Taipei` |
| memory | `512MiB` |

### 2.2 保留規則
- 基準欄位：Firestore 文件的 `timestamp`（截圖擷取時間，台灣時間轉存的 UTC Timestamp）。
- 截止點 `cutoff = 執行當下 - 7 天`（7 × 24 小時，毫秒級）。
- 刪除條件：`timestamp < cutoff` 的所有文件（**跨所有 projectId**，全域套用）。
- `timestamp >= cutoff`（7 天內）一律保留。

### 2.3 刪除流程（分批、可擴展、容錯）
```
迴圈：
  1. 查詢 standbyScreenshots
       .where("timestamp", "<", cutoff)
       .orderBy("timestamp", "asc")
       .limit(BATCH=300)
  2. 若 empty → 結束
  3. 平行刪除每筆 storagePath 對應的 Storage 檔
       bucket.file(storagePath).delete({ ignoreNotFound: true })
       （以 Promise.allSettled 容錯，單筆失敗不中斷整體）
  4. 以 Firestore batch 刪除這批文件（≤ 500/batch，採 300 安全值）
  5. 累計刪除數；若回傳數 < BATCH → 結束，否則續迴圈
最後輸出彙總 log：刪除文件數、Storage 失敗數、耗時
```

### 2.4 錯誤處理
- 整體以 try/catch 包覆，例外只記 log 不丟出（排程函式不需回傳，避免反覆重試）。
- Storage 刪除採 `ignoreNotFound: true` + `Promise.allSettled`，檔案已不存在或單筆失敗不影響其他刪除與 Firestore 清理。
- 每筆 Storage 失敗計數並 log，便於後續稽核。

---

## 3. 邊界情境

| 情境 | 行為 |
|------|------|
| 文件 `timestamp` 為 null / 不存在 | Firestore `<` 範圍查詢會自動排除，**不會被刪除**（已知限制；現行 `saveStandbyScreenshot` 必寫 `timestamp`，僅理論邊界） |
| 文件有 metadata 但 Storage 檔已遺失 | `ignoreNotFound` 略過，仍刪除 Firestore 文件（清除孤兒 metadata） |
| Storage 檔存在但 `storagePath` 欄位缺失 | 略過 Storage 刪除、仍刪 Firestore 文件並記 log |
| 單次累積待刪數量龐大（數萬筆） | 分批 300 筆迴圈處理，直到清空；單次執行 timeout 風險低（純刪除） |
| 7 天內截圖 | 完全保留，不受影響 |
| 無任何過期截圖 | 查詢 empty，直接結束，無副作用 |

---

## 4. 影響檔案

| 檔案 | 變更 |
|------|------|
| [functions/index.js](../functions/index.js) | 新增 `exports.cleanupStandbyScreenshots`（置於 `fetchStandbyScreenshots` 之後） |
| [docs/SPEC_StandbyScreenshotCleanup.md](SPEC_StandbyScreenshotCleanup.md) | 本文件 |

> 不需 Firestore 複合索引（單一欄位 `timestamp` 範圍 + 同欄位 orderBy）。

---

## 5. 部署

```
firebase deploy --only functions:cleanupStandbyScreenshots
```

部署後 Cloud Scheduler 會自動建立每日 `03:30 (Asia/Taipei)` 觸發排程。

---

## 6. 驗收標準

1. 函式成功部署，Cloud Scheduler 出現每日 03:30 (Asia/Taipei) 排程。
2. 手動建立一筆 `timestamp` 為 8 天前的測試截圖（Storage + Firestore）→ 執行後 Storage 檔與 Firestore 文件皆被刪除。
3. `timestamp` 為 6 天前的截圖 → 執行後仍完整保留。
4. Storage 檔事先手動刪除、僅剩 Firestore 文件（過期）→ 執行後孤兒文件被清除，無例外中斷。
5. 大量（>300 筆）過期資料 → 分批全數刪除，log 顯示正確累計數。
6. 無過期資料時執行 → 正常結束、無錯誤。
7. `saveStandbyScreenshot` / `fetchStandbyScreenshots` / 前端截圖瀏覽行為不受影響。
