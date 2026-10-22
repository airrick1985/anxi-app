# anxi-app

## 建置與設定

- 雲端 session 與其他機器沒有 `.env`（不進 git），而且缺值時建置不會報錯，要到線上打開頁面才會壞。前端用到的 LIFF ID 等公開設定一律寫在程式碼裡，不要新增 `import.meta.env.VITE_*`。
- LIFF ID 與入口路由登記在 `src/utils/liffApps.js`（名單回報在 `src/utils/leadReportLink.js`）；新增 LIFF 頁面要登記在這裡，頁面用 `liffAuth.initializeLiff`，不要直接呼叫 `liff.init`。
- Cloud Functions 的密鑰在 Firebase Secret Manager，不用 `.env`。
