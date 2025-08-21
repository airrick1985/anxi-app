// src/firebase.js

// 從 Firebase SDK 引入您需要的函式
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions"; // ✅ 1. 從 firebase/functions 引入 getFunctions

// 您的 Web App 的 Firebase 設定 (從 Firebase 控制台複製)
const firebaseConfig = {
  apiKey: "AIzaSyBdE26vC0UAprsdTgBcmYrVuO67ZbccMTA",
  authDomain: "apps-script-api-443402.firebaseapp.com",
  projectId: "apps-script-api-443402",
  storageBucket: "apps-script-api-443402.firebasestorage.app",
  messagingSenderId: "46453918785",
  appId: "1:46453918785:web:a3c386def8dfe69f768ac0",
  measurementId: "G-TCZ9TL8FLW"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// ✅ 建立並匯出 Firestore 資料庫的實例，這樣您的其他檔案 (例如 api.js) 才能使用它
export const db = getFirestore(app, 'anxi-app');
export const storage = getStorage(app);
export const functions = getFunctions(app); // ✅ 2. 建立並匯出 functions 實例

// Google Analytics (分析) 功能是選用的，如果您暫時用不到可以先放著
// import { getAnalytics } from "firebase/analytics";
// const analytics = getAnalytics(app);