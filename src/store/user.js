// src/store/user.js

import { defineStore } from 'pinia';
import { goOffline, saveUserPreferencesToBackend, fetchUserPreferencesFromBackend, manageUserPresence } from '@/api';
import router from '@/router'; 

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    sessionId: null, 
    detailedPermissions: [],
    unreadCount: 0,
    isLoaded: false,
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

        manageUserPresence(userData.key);

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
    // 新增：從資料庫載入使用者偏好設定
  async loadUserPreferencesFromDatabase() {
    if (!this.user?.key) return;
    
    try {
      const preferences = await fetchUserPreferencesFromBackend(this.user.key);
      if (preferences) {
        // 直接設定 preferences，不會被 persist 保存
        this.user.preferences = preferences;
      }
    } catch (error) {
      console.error('[UserStore] 從資料庫載入偏好設定失敗:', error);
    }
  },

    async logoutUser() {
      const userKey = this.user?.key;

       if (userKey) {
        try {
          // 等待資料庫操作完成
          await goOffline(userKey);
        } catch (error) {
          // 即使這裡失敗，我們仍然要繼續登出流程
          console.error('LOGOUT FAILED: Could not set offline status.', error);
        }
      }

      // 步驟二：清空本地 state
      this.clearUser();

      // 步驟三：移除持久化儲存
      localStorage.removeItem('anxi-user-session'); // 確保與 persist 設定一致

      // 步驟四：重定向到登入頁面
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

    // 新增：確保 store 完全載入的方法
      async ensureLoaded() {
    // 如果使用者資料已存在（透過 persist 載入），則標記為已載入
    if (this.user) {
      this.isLoaded = true;
      return;
    }
    
    // 如果沒有使用者資料，也標記為已載入（表示檢查完成）
    this.isLoaded = true;
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
    storage: sessionStorage, 
    paths: ['user', 'detailedPermissions', 'unreadCount', 'sessionId']
  }
});