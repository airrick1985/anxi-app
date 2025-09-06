// src/store/user.js

import { defineStore } from 'pinia';
import { removeUserOnlineStatus } from '@/api'; // 1. 引入我們需要的主動離線函式
import { goOffline } from '@/api'; // 確保引入的是 goOffline
import router from '@/router'; // 2. 引入 router 以便進行導航

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
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
    
    // ✓ START: 【新增】專門的登出動作
    async logoutUser() {
  const userKey = this.user?.key;

  if (userKey) {
    try {
      await goOffline(userKey);
    } catch (error) {
      console.error('LOGOUT FAILED: Could not remove online status.', error);
      // 即使失敗，我們仍然要繼續執行登出
    }
  } else {
  }

  this.clearUser();

  await router.replace('/login');
},
    // ✓ END: 【新增】專門的登出動作

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
  },

  persist: {
    key: 'anxi-user-session',
    storage: sessionStorage,
    paths: ['user', 'detailedPermissions', 'unreadCount']
  }
});