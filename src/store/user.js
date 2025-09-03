// src/store/user.js

import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    // detailedPermissions 格式維持不變: [{ projectId, projectName, system, access }]
    detailedPermissions: [],
    unreadCount: 0,
  }),

 actions: {
setUser(userData) {
      if (userData && typeof userData === 'object' && userData.key) {
        this.user = {
          key: userData.key,
          email: userData.email || null,
          name: userData.name || null,
          roles: userData.roles || []
        };
        this.detailedPermissions = Array.isArray(userData.detailedPermissions)
          ? userData.detailedPermissions
          : [];
      } else {
        this.user = null;
        this.detailedPermissions = [];
      }
    },
    clearUser() {
      this.user = null;
      this.detailedPermissions = [];
      this.unreadCount = 0;
    },

    setProjectName(projectName) {
      if (this.user) {
        this.user.projectName = projectName;
      }
    },
    setUnreadCount(count) {
      if (typeof count === 'number' && count >= 0) {
        this.unreadCount = count;
      }
    },
    decrementUnreadCount() {
      if (this.unreadCount > 0) {
        this.unreadCount--;
      }
    },
    incrementUnreadCount() {
      this.unreadCount++;
    }
  },

   getters: {
    isLoggedIn: (state) => !!state.user,
    currentUserRoles: (state) => state.user?.roles || [],

    // ✅ START: 重寫所有權限相關的 getters
    hasPermission: (state) => (systemName) => {
      if (!state.detailedPermissions) return false;
      return state.detailedPermissions.some(p => p.system === systemName);
    },

    hasProjectPermission: (state) => (systemName, projectName) => {
      if (!state.detailedPermissions) return false;
      return state.detailedPermissions.some(p => p.system === systemName && p.projectName === projectName);
    },
    
    hasAnyPermission: (state) => (systemNames) => {
      if (!state.detailedPermissions || !Array.isArray(systemNames)) return false;
      return state.detailedPermissions.some(p => systemNames.includes(p.system));
    },

    canSendMessage: (state) => {
      if (!state.detailedPermissions) return false;
      return state.detailedPermissions.some(perm => perm.system && perm.system.startsWith('寄信-'));
    },
    // ✅ END: 重寫所有權限相關的 getters
  },

  persist: {
    key: 'anxi-user-session',
    storage: sessionStorage,
    paths: ['user', 'detailedPermissions', 'unreadCount']
  }
});