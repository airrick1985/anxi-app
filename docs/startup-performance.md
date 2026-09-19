# 登入與公開頁啟動優化

## 變更

- 移除把所有 node_modules 收進 vendor 的規則；功能頁相依的 Excel、PDF、圖表等交給 Rollup 依使用處拆分。
- Vuetify 改用 vite-plugin-vuetify 自動匯入模板實際使用的元件／指令，不再全域註冊全部元件。
- 公開與管理版型改為共用的非同步元件；公開頁不下載 DefaultLayout。個人資料、房貸試算、AI 視窗按需載入。
- 版本更新視窗在有更新時才載入；保留首次開啟取得更新說明的行為。
- 靜態公開頁與登入頁不再預先查詢全建案清單，進入需要資料的頁面或登入後才查詢。
- HTML 提供獨立啟動畫面；目前路由與版型就緒才移除。下載失敗或超過 15 秒提供手動重試；保留 query 與 hash。
- Google Fonts 樣式非阻塞載入；字體尚未下載時使用原有備援字體。

## 發布與快取

照常使用 `npm run deploy` 或現有 `release:*` 指令。

`deploy` 先建置，再執行 `scripts/deploy.js`，同一個 gh-pages commit 更新 HTML、manifest 與 assets。近期舊 assets 保留七天，避免舊 HTML／開著的分頁引用的 chunk 立即消失。七天以最後一次屬於當前 build 的發布時間計算，在後續發布時清理。第一次導入時，沒有歷史紀錄的既有資源也給七天寬限。

只有 assets 保留，已刪除的其他公開頁會移除；`stats.html` 不發布。請勿直接執行舊的 `gh-pages -d dist`，它會刪除保留資源。`build-and-deploy` 已修正為只建置一次。

GitHub Pages 無法由此專案設定 HTTP Cache-Control；本次沒有宣稱改變正式站回應標頭。沿用 manifest 的 no-store 版本檢查，以及更新時的 HTML query cache-busting；更新 URL 現在也保留原入口參數。超過保留期間的舊頁仍可能走既有 chunk 載入失敗重整機制。

## 驗證

```sh
npm run build
npm run verify:startup
```

`verify:startup` 使用本機 Chromium（macOS 自動尋找 Edge／Chrome，Linux 尋找 Chromium／Chrome）；其他路徑使用 `BROWSER_EXECUTABLE` 指定。

- 執行實際 production build 的瀏覽器驗證：登入、首頁、隱私權、服務條款、試用、公開預約、公開表單，涵蓋 1280px 與 390px。
- 驗證登入欄位與忘記密碼視窗、無 JS 例外、功能套件未提早載入、公開頁未下載管理版型。
- 驗證主程式下載延遲時的提示、下載失敗重試、公開頁版本提示，以及重新整理保留 query／hash。
- 向暫存本機 Git repository 連續發布兩版，確認新版 HTML 與舊／新 chunk 共存、已刪公開頁移除；另測試七天到期清理。

瀏覽器驗證封鎖外部請求，不讀寫正式客戶資料；預約／表單驗證範圍為前端啟動與版型，並非後端成功回應、登入認證或送出資料的端到端驗證。

## 大小比較

以修改前保留的本機 `dist/index.html` 直接引用之 JS／CSS 為基準，與修改後同樣範圍比較：

| 共用啟動資源 | 修改前 | 修改後 |
| --- | ---: | ---: |
| 原始大小 | 約 5.32 MB | 約 2.14 MB |
| gzip 本機估算 | 約 1.51 MB | 約 0.51 MB |

gzip 約減少 66%。此表不含 route 後續載入、圖片、字型與 API 資料；不是正式站下載時間測量。首次部署這次分包改動仍需下載新檔案，其後由瀏覽器依正常 HTTP 快取規則使用。
