// src/store/user.js

import { defineStore } from 'pinia';

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
          projectName: userData.projectName || null,
          roles: userData.roles || []
        };
        // ✅ 核心修改點：即使 `detailedPermissions` 是 undefined，也將其視為空陣列
        // 這使得程式碼對於 API 回傳的物件結構有更好的容錯性。
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

     hasAnyPermission: (state) => (systemNames) => {
      if (!state.detailedPermissions || state.detailedPermissions.length === 0 || !Array.isArray(systemNames)) {
        return false;
      }
      // 檢查權限列表中的任何一個權限，其 system 名稱是否存在於傳入的 systemNames 陣列中
      return state.detailedPermissions.some(p => systemNames.includes(p.system) && p.access === 'Y');
    },
    
    isLoggedIn: (state) => !!state.user,
    // ✅ 新增 getter 以方便取得當前使用者的角色
    currentUserRoles: (state) => state.user?.roles || [],
    
    // ... (其他 getters 維持不變)
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
      if (!state.user || !state.user.detailedPermissions) return false;
      // ✅【核心修改】改用 .includes() 進行模糊比對
      return state.user.detailedPermissions.some(
        p => p.system.includes(systemName) && p.access === 'Y'
      );
    }
  },

  persist: {
    key: 'anxi-user-session',
    storage: sessionStorage,
    paths: ['user', 'detailedPermissions', 'unreadCount']
  }
});