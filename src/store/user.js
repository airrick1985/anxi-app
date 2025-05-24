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
    user: null,
    permissions: [] // Added permissions state
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
        // Handle permissions
        if (Array.isArray(userData.permissions)) {
          this.permissions = userData.permissions;
          console.log("✅ User permissions updated in store:", JSON.parse(JSON.stringify(this.permissions)));
        } else {
          this.permissions = [];
          console.log("⚡ User permissions reset in store (no valid permissions data or not an array)");
        }
        console.log("✅ User state updated:", JSON.parse(JSON.stringify(this.user)));
      } else {
        this.user = null;
        this.permissions = []; // Also clear permissions when user data is invalid
        console.log("⚡ User state and permissions cleared (no valid data)");
      }
    },

    /**
     * 清除用戶資料（登出）
     */
    clearUser() {
      console.log("🚪 clearUser called, logging out...");
      this.user = null;
      this.permissions = []; // Clear permissions on logout
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

  getters: {
    /**
     * 檢查用戶是否擁有特定權限
     * @param {object} state - The store's state.
     * @returns {function(string): boolean} - A function that takes a permission name and returns true if the user has it.
     */
    hasPermission: (state) => (permissionName) => {
      // Check if user is loaded, permissions is an array, and then check for the specific permission.
      return !!state.user && Array.isArray(state.permissions) && state.permissions.includes(permissionName);
    }
  },

  persist: {
    key: 'anxi-user-session', 
    storage: localStorage,
    paths: ['user', 'permissions'] // Added 'permissions' to persisted paths
  }
});
