// src/store/user.js

import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    // ✨ 您的 detailedPermissions state 維持不變
    detailedPermissions: [] 
  }),

  actions: {
    // 您的 actions 維持不變
    setUser(userData) {
      if (userData && typeof userData === 'object' && userData.key) {
        this.user = {
          key: userData.key,
          email: userData.email || null,
          name: userData.name || null,
          projectName: userData.projectName || null
        };
        if (Array.isArray(userData.detailedPermissions)) {
          this.detailedPermissions = userData.detailedPermissions;
          console.log("✅ 已更新詳細權限列表至 Store:", JSON.parse(JSON.stringify(this.detailedPermissions)));
        } else {
          this.detailedPermissions = [];
        }
      } else {
        this.user = null;
        this.detailedPermissions = [];
      }
    },
    clearUser() {
      this.user = null;
      this.detailedPermissions = [];
    },
    setProjectName(projectName) {
      if (this.user) {
        this.user.projectName = projectName;
      }
    }
  },

  getters: {
    /**
     * ✅ 新增：簡單判斷是否登入的 getter
     */
    isLoggedIn: (state) => !!state.user,
    
    /**
     * ✅ 新增：檢查用戶是否擁有任何一個建案的「寄信」權限
     */
    canSendMessage: (state) => {
      if (!state.detailedPermissions || state.detailedPermissions.length === 0) {
        return false;
      }
      // 只要 detailedPermissions 陣列中，存在任何一個 system 以 "寄信-" 開頭且權限為 'Y' 的項目，就回傳 true
      return state.detailedPermissions.some(
        perm => perm.system && perm.system.startsWith('寄信-') && perm.access === 'Y'
      );
    },

    // 您的 hasProjectPermission getter 維持不變
    hasProjectPermission: (state) => (system, projectName) => {
      if (!state.detailedPermissions || state.detailedPermissions.length === 0) {
        return false;
      }
      return state.detailedPermissions.some(
        p => p.system === system && p.projectName === projectName && p.access === 'Y'
      );
    },
    
    // 您的 hasPermission getter 維持不變
    hasPermission: (state) => (systemName) => {
        if (!state.detailedPermissions || state.detailedPermissions.length === 0) {
            return false;
        }
        return state.detailedPermissions.some(p => p.system === systemName && p.access === 'Y');
    }
  },

  // 您的 persist 設定維持不變
  persist: {
    key: 'anxi-user-session',
    storage: sessionStorage,
    paths: ['user', 'detailedPermissions']
  }
});