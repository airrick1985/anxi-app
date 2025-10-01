// src/store/user.js

import { defineStore } from 'pinia';
import { goOffline, saveUserPreferencesToBackend } from '@/api'; 
import router from '@/router'; 

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    sessionId: null, 
    detailedPermissions: [],
    unreadCount: 0,
  }),

  actions: {
    setUser(userData, sessionId) {
      if (userData && typeof userData === 'object' && userData.key) {
        this.user = {
          key: userData.key,
          email: userData.email || null,
          name: userData.name || null,
          roles: userData.roles || [],
          preferences: userData.preferences || {},
        };
        this.sessionId = sessionId;
        this.detailedPermissions = Array.isArray(userData.detailedPermissions)
          ? userData.detailedPermissions
          : [];
      } else {
        this.user = null;
        this.sessionId = null;
        this.detailedPermissions = [];
      }
    },
    clearUser() {
      this.user = null;
      this.sessionId = null; 
      this.detailedPermissions = [];
      this.unreadCount = 0;
    },
    
    async logoutUser() {
      const userKey = this.user?.key;

      if (userKey) {
        try {
          await goOffline(userKey);
        } catch (error) {
          console.error('LOGOUT FAILED: Could not remove online status.', error);
        }
      }

      this.clearUser();

      // 將 sessionStorage 修改為 localStorage，與 persist 設定保持一致
      localStorage.removeItem('anxi-user-session');

      await router.replace('/login');
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
    },

    async updateUserPreferences(newPreferences) {
      if (this.user) {
        // 步驟 A: 立即更新前端 state，讓 UI 即時反應
        this.user.preferences = {
          ...this.user.preferences,
          ...newPreferences,
        };
        console.log('[UserStore] 使用者偏好設定已在前端更新:', this.user.preferences);

        // 步驟 B: 在背景呼叫 API，將設定寫入後端資料庫
        try {
          await saveUserPreferencesToBackend(this.user.key, newPreferences);
          console.log('[UserStore] 使用者偏好設定已成功同步至後端。');
        } catch (error) {
          console.error('[UserStore] 同步偏好設定至後端失敗:', error);
          // 在此處可以加入錯誤提示邏輯
        }
      }
    },
  },

  getters: {
    isLoggedIn: (state) => !!state.user,
    currentUserRoles: (state) => state.user?.roles || [],
    currentUserPreferences: (state) => state.user?.preferences || {},
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
    storage: localStorage,
    paths: ['user', 'detailedPermissions', 'unreadCount', 'sessionId']
  }
});