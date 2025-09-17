# Anxi-App 開發指南 (AI 助理版)

歡迎來到 Anxi-App！這份文件旨在幫助 AI 程式設計助理快速了解專案的架構、慣例和開發流程。

## 專案概觀

Anxi-App 是一個使用 Vue.js 3、Vite 和 Firebase 建構的漸進式網頁應用程式 (PWA)。它提供了一個用於管理停車場平面圖、銷售資訊和其他業務相關數據的平台。

- **前端框架**: Vue.js 3 (Composition API)
- **UI 元件庫**: Vuetify 3
- **狀態管理**: Pinia
- **路由**: Vue Router
- **建置工具**: Vite
- **後端服務**: Firebase (Firestore, Authentication, Storage)
- **資料表格**: AG-Grid
- **富文本編輯器**: Tiptap

## 關鍵目錄結構

- `src/`: 所有前端原始碼的根目錄。
  - `App.vue`: 根 Vue 元件。
  - `main.js`: 應用程式進入點，初始化 Vue、Pinia、Router 等。
  - `router/index.js`: 定義所有前端路由。
  - `store/`: 包含所有 Pinia 狀態管理模組。每個模組負責應用程式的一部分狀態 (例如 `authStore`, `parkingStore`)。
  - `views/`: 頁面級別的元件，對應到特定的路由。
  - `components/`: 可在整個應用程式中重複使用的元件。
  - `firebase.js`: Firebase 初始化和設定。
  - `api.js`: 封裝與後端 API (主要是 Firebase) 的互動。
- `public/`: 靜態資源和 `manifest.json`。
- `scripts/`: 用於自動化任務的 Node.js 腳本 (例如版本號更新、產生發行說明)。
- `vite.config.js`: Vite 建置設定，包含路徑別名 (`@` 指向 `src`) 和程式碼分割策略。

## 開發流程與指令

**1. 啟動開發伺服器:**
```bash
npm run dev
```
這會啟動一個具有熱重載功能的本地開發伺服器。

**2. 建置應用程式:**
```bash
npm run build
```
此指令會執行以下操作：
- 更新 `manifest.json` 中的版本號。
- 產生新的發行說明。
- 使用 Vite 將應用程式建置到 `dist` 目錄。

**3. 部署到 GitHub Pages:**
```bash
npm run deploy
```
這個指令會先建置應用程式，然後將 `dist` 目錄的內容部署到 GitHub Pages。

## 架構與模式

### 狀態管理 (Pinia)

- 狀態應該集中在 `src/store/` 的 Pinia 模組中管理。
- 盡量保持元件無狀態，並從 Pinia store 中讀取和更新資料。
- 使用 `pinia-plugin-persistedstate` 來將某些 store 的狀態持久化到 `localStorage`。

**範例: `src/store/authStore.js`**
```javascript
// 這是管理使用者認證狀態的範例
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
  }),
  actions: {
    async login(credentials) {
      // ... 登入邏輯 ...
      this.user = ...;
    },
    logout() {
      this.user = null;
    }
  },
  persist: true, // 這個 store 會被持久化
});
```

### API 互動

- 所有與 Firebase 或其他後端服務的通訊都應該透過 `src/api.js` 中的函式進行。這有助於將資料邏輯與 UI 分離。
- 避免在 Vue 元件中直接呼叫 Firebase SDK。

### 路由

- 路由定義在 `src/router/index.js` 中。
- 使用路由守衛 (navigation guards) 來保護需要認證的頁面。

### PWA 與 Service Worker

- 專案使用 `vite-plugin-pwa` 來實現 PWA 功能。
- Service Worker 的邏輯位於 `src/sw.js`。
- `vite.config.js` 中定義了快取策略，特別是對於 `cdnjs.cloudflare.com` 的資源。

## 注意事項

- **程式碼分割**: `vite.config.js` 中有手動的程式碼分割設定 (`manualChunks`)，將大型函式庫 (如 `ag-grid`, `firebase`, `vuetify`) 分割成獨立的 chunk，以改善初始載入時間。在新增大型依賴時，請考慮更新此設定。
- **別名**: 在 `import` 路徑中，請使用 `@/` 來代替 `../`，以指向 `src` 目錄。
- **AI 代理後端**: `ai-proxy-backend/` 目錄包含一個 Express 伺服器，可能是用來代理對外部 AI 服務的請求，以隱藏 API 金鑰。在處理與 AI 相關的功能時，請注意這個部分。
