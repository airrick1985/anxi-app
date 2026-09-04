// src/firebase.js

// 從 Firebase SDK 引入您需要的函式
import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions"; // 確保導入
import { getDatabase } from "firebase/database"; 

// 您的 Web App 的 Firebase 設定 (從 Firebase 控制台複製)
// IMPORTANT: 這是一個範例設定，請務必替換成您自己的 Firebase 專案設定。
// 洩漏 API 金鑰可能會導致您的 Firebase 專案被濫用。
const firebaseConfig = {
  apiKey: "AIzaSyBdE26vC0UAprsdTgBcmYrVuO67ZbccMTA",
  authDomain: "apps-script-api-443402.firebaseapp.com",
  databaseURL: "https://apps-script-api-443402-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "apps-script-api-443402",
  storageBucket: "apps-script-api-443402.firebasestorage.app", 
  messagingSenderId: "46453918785",
  appId: "1:46453918785:web:a3c386def8dfe69f768ac0",
  measurementId: "G-TCZ9TL8FLW"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);


// 建立並匯出所有 Firebase 服務的實例
// 根據 Firebase v9+ 的多資料庫設定方式
//
// ✅ [效能] 啟用 Firestore 本機持久化快取（IndexedDB）：
//   - onSnapshot 會先立刻回傳上次快取的資料，再同步伺服器差異，重整頁面不必重新下載整批戶別
//   - persistentMultipleTabManager：多分頁共用同一份快取，不會因第二個分頁而停用持久化
//   - IndexedDB 不可用（隱私模式等）時 SDK 自動退回記憶體快取，行為與原本相同
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
}, 'anxi-app');
export const storage = getStorage(app);
export const functions = getFunctions(app, 'asia-east1');
export const rtdb = getDatabase(app);

// Firebase 服務已成功初始化 

// Google Analytics (分析) 功能是選用的，如果您暫時用不到可以先放著
// import { getAnalytics } from "firebase/analytics";
// const analytics = getAnalytics(app);
