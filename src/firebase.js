import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// 如果您也需要 Firebase Authentication
// import { getAuth } from "firebase/auth";

// 您的 Web App 的 Firebase 設定
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "...",
  appId: "1:..."
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 匯出您需要的 Firebase 服務
export const db = getFirestore(app);
// export const auth = getAuth(app);