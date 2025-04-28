// src/store/user.js
import { defineStore } from 'pinia';
// **確保已安裝: npm install pinia-plugin-persistedstate**
// **確保已在 main.js 中配置: pinia.use(piniaPluginPersistedstate)**

export const useUserStore = defineStore('user', {
  state: () => ({
    /**
     * 用戶狀態物件
     * @type {{ key: string|null, email: string|null, name: string|null }|null}
     */
    user: null // 初始為 null，表示未登入
  }),
  actions: {
    /**
     * 設置或更新用戶狀態
     * @param {object|null} userData 從 API 收到的用戶物件 { key, email, name } 或 null (登出時)
     */
    setUser(userData) {
      console.log("setUser called with:", userData); // 檢查傳入的資料
      // 必須檢查 userData 是否存在，以及是否包含 key (作為用戶存在的標誌)
      if (userData && typeof userData === 'object' && userData.key) {
        this.user = {
          key: userData.key,
          // 提供預設值 null，防止 undefined 存入狀態
          email: userData.email || null,
          name: userData.name || null
        };
        console.log("User state updated:", JSON.parse(JSON.stringify(this.user))); // 顯示更新後的值
      } else {
        // 如果傳入的是 null, undefined 或缺少 key 的物件，則清空狀態
        this.user = null;
        console.log("User state cleared (set to null).");
      }
    },

    /**
     * 清除用戶狀態 (登出)
     */
    logout() {
      this.setUser(null); // 調用 setUser 清空狀態
      // 如果手動管理持久化，需要在此清除 localStorage
      console.log("User logged out action called.");
      // 可能需要跳轉到登入頁
      // import router from '../router'; // 在頂部導入
      // router.push('/login'); 
    }
  },
  // **** 啟用狀態持久化 (使用 pinia-plugin-persistedstate) ****
  // 這會將 store 的狀態自動存儲到 localStorage，並在應用加載時恢復
   persist: {
     key: 'anxi-user-session', // localStorage 中的 key 名稱 (可自訂)
     storage: localStorage, // 或 sessionStorage
     paths: ['user'], // 只持久化 user state，避免意外存儲其他狀態
   },
})