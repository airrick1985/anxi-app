---
name: commit-notes
description: Commit 或發版前，將本次變更以簡潔的使用者視角文字寫入 CHANGELOG.md 頂部區塊，讓前台「新版本已推出」更新資訊 modal 顯示本次更新內容。使用者說 commit、提交、發版、release 時必須先執行此流程再提交。
---

# Commit 前撰寫更新資訊（顯示於更新 Modal）

## 背景（資料流）

前台的「新版本已推出」modal（`src/components/UpdateDialog.vue`）讀取 `public/release-notes.json`。
該檔案在發版時由 `scripts/generateReleaseNotes.js` 產生，來源是 **CHANGELOG.md 最頂部的版本區塊**：

```
CHANGELOG.md 頂部區塊 → generateReleaseNotes.js（發版時自動執行）→ public/release-notes.json → 更新 Modal
```

因此：**commit 前只需把本次更新摘要寫進 CHANGELOG.md 頂部**，發版鏈（`release:safe` / `release:publish` / `build`）會自動產生 JSON。
不要手動編輯 `public/release-notes.json`。

## 執行步驟

1. **算出「即將發布的版本號」**：讀 `package.json` 的 `version`，patch +1（`bump-version` 在發版時會自動 +1，CHANGELOG 要與之對齊）。例：目前 `1.0.650` → 寫 `1.0.651`。

2. **整理本次更新摘要**：
   - 台灣繁體中文、使用者視角（寫「使用者看得懂的效果」，不寫技術細節、檔名、函式名）
   - 簡潔：每條一句話，整次更新以 1～4 條為限，同類小改動合併成一條
   - 每條依類型加前綴 emoji（會決定 modal 內的分類標題）：
     - `✨` 新功能 (Features)
     - `🐛` 錯誤修復 (Bug Fixes)
     - `🛠️` 改進/優化 (Improvements)

3. **寫入 CHANGELOG.md 頂部**（`# Changelog` 標題之後、既有區塊之前）：

   ```markdown
   ## [1.0.651] - 2026-08-03
   - ✨ 批次預覽新增各時段已約/剩餘名額顯示
   - 🛠️ 額滿時段以紅色標示，更容易辨識
   ```

   - 日期用**台灣時區 (Asia/Taipei) 的今天**，格式 `YYYY-MM-DD`
   - 格式必須嚴格是 `## [版本號] - YYYY-MM-DD`，否則 generateReleaseNotes.js 解析不到會使發版失敗
   - **若頂部已存在同一個「即將發布版本」的區塊**（前次 commit 累積、尚未發版）：把新的 `- ` 條目**追加**進該區塊，不要另開新區塊、不要重複既有條目

4. **提交**：
   - 使用者只說 commit / 提交 → 直接 commit 到 main（含 CHANGELOG.md），commit 訊息用繁體中文描述本次變更
   - 使用者說發版 / release → 執行 `npm run release:safe`（會自動 bump 版本、產生 release-notes.json、commit、push、deploy）

## 注意

- CHANGELOG 條目 = 使用者會在更新彈窗看到的文字，語氣面向終端使用者（建案管理員／客戶）
- 不確定該歸哪類時用 `🛠️`
- 純內部重構、無使用者可感知變化時，寫一條 `🛠️ 微調細部功能` 即可
