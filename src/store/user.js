// src/store/user.js

import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    // ✨ 新增 state，用來儲存從 API 來的詳細權限列表
    detailedPermissions: [] 
  }),

  actions: {
    setUser(userData) {
      if (userData && typeof userData === 'object' && userData.key) {
        this.user = {
          key: userData.key,
          email: userData.email || null,
          name: userData.name || null,
          projectName: userData.projectName || null
        };
        // ✨ 當設定使用者時，同時儲存詳細權限
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
      this.detailedPermissions = []; // ✨ 登出時清空
    },
    setProjectName(projectName) {
      if (this.user) {
        this.user.projectName = projectName;
      }
    }
  },

  getters: {
    /**
     * ✨ 新增：兩層權限檢查 Getter
     * @param state
     * @returns (system: string, projectName: string) => boolean
     */
    hasProjectPermission: (state) => (system, projectName) => {
      if (!state.detailedPermissions || state.detailedPermissions.length === 0) {
        return false;
      }
      // 在詳細權限列表中查找是否有匹配的項目
      return state.detailedPermissions.some(
        p => p.system === system && p.projectName === projectName && p.access === 'Y'
      );
    },
    
    /**
     * (可選) 舊的 hasPermission，現在用來檢查使用者是否"至少有一個"建案對該系統有權限
     */
    hasPermission: (state) => (systemName) => {
        if (!state.detailedPermissions || state.detailedPermissions.length === 0) {
            return false;
        }
        return state.detailedPermissions.some(p => p.system === systemName && p.access === 'Y');
    }
  },

  persist: {
    key: 'anxi-user-session',
    storage: sessionStorage,
    paths: ['user', 'detailedPermissions'] // ✨ 記得將新 state 加入持久化
  }
});