import { defineStore } from 'pinia';

// 確保你的 main.js 有使用 pinia-plugin-persistedstate
// import { createPinia } from 'pinia';
// import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
// const pinia = createPinia();
// pinia.use(piniaPluginPersistedstate);

export const useUserStore = defineStore('user', {
  state: () => ({
     /**
     * 用戶資料
     * @type {{ key: string|null, email: string|null, name: string|null, projectName: string|null }|null}
     */
    user: null
  }),

  actions: {
    /**
     * 設定用戶資料
     * @param {object|null} userData
     */
    setUser(userData) {
      console.log("✅ setUser called with:", userData);
      if (userData && typeof userData === 'object' && userData.key) {
        this.user = {
          key: userData.key,
          email: userData.email || null,
          name: userData.name || null,
          projectName: userData.projectName || null // Explicitly set to null if not provided
        };
        console.log("✅ User state updated:", JSON.parse(JSON.stringify(this.user)));
      } else {
        this.user = null;
        console.log("⚡ User state cleared (no valid data)");
      }
    },

    /**
     * 清除用戶資料（登出）
     */
    clearUser() {
      console.log("🚪 clearUser called, logging out...");
      this.user = null;
     
    },

    setProjectName(projectName) {
      if (this.user) {
        this.user.projectName = projectName;
        console.log("✅ Project name updated in store:", projectName);
      } else {
        console.warn("⚠️ User not set, cannot update project name.");
      }
    }
  },

  persist: {
    key: 'anxi-user-session', 
    storage: localStorage,
    paths: ['user']
  }
});
