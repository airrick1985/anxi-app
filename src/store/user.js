// src/store/user.js

import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    detailedPermissions: [],
    // ✅ 新增 state 來儲存未讀數量
    unreadCount: 0,
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
      // ✅ 登出時也清空未讀數
      this.unreadCount = 0;
    },
    setProjectName(projectName) {
      if (this.user) {
        this.user.projectName = projectName;
      }
    },
    
    // ✅ 新增 action 來從外部設定未讀數量 (例如，從 API 初始化時)
    setUnreadCount(count) {
      if (typeof count === 'number' && count >= 0) {
        this.unreadCount = count;
      }
    },
    
    // ✅ 新增 action 來將未讀數量減一 (例如，讀取信件後)
    decrementUnreadCount() {
      if (this.unreadCount > 0) {
        this.unreadCount--;
      }
    },

    // ✅ 新增 action 來將未讀數量加一 (未來可能用於收到新訊息通知)
    incrementUnreadCount() {
      this.unreadCount++;
    }
  },

  getters: {
    isLoggedIn: (state) => !!state.user,
    canSendMessage: (state) => {
      if (!state.detailedPermissions || state.detailedPermissions.length === 0) {
        return false;
      }
      return state.detailedPermissions.some(
        perm => perm.system && perm.system.startsWith('寄信-') && perm.access === 'Y'
      );
    },
    hasProjectPermission: (state) => (system, projectName) => {
      if (!state.detailedPermissions || state.detailedPermissions.length === 0) {
        return false;
      }
      return state.detailedPermissions.some(
        p => p.system === system && p.projectName === projectName && p.access === 'Y'
      );
    },
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
    // ✅ 將 unreadCount 加入持久化，這樣用戶重整頁面時數字不會馬上消失
    paths: ['user', 'detailedPermissions', 'unreadCount']
  }
});