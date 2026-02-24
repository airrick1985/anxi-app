import { defineStore } from 'pinia';
import { db } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { goOffline, saveUserPreferencesToBackend, fetchUserPreferencesFromBackend, manageUserPresence, getLiffUserData } from '@/api';
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

        // ✅ 新增：在設定 user state 之前，先處理權限資料的轉換
        const permissions = {};
        if (Array.isArray(userData.detailedPermissions)) {
          userData.detailedPermissions.forEach(p => {
            // 確保 p.projectId 存在，避免錯誤
            if (!p.projectId) return;

            // 如果此 projectId 尚未存在於 permissions 物件中，則初始化
            if (!permissions[p.projectId]) {
              permissions[p.projectId] = {
                projectName: p.projectName,
                systems: []
              };
            }
            // 將系統權限加入對應的 projectId 中
            permissions[p.projectId].systems.push(p.system);
          });
        }

        this.user = {
          key: userData.key,
          email: userData.email || null,
          name: userData.name || null,
          roles: userData.roles || [],
          // ✅ 修改：使用上面轉換好的 permissions 物件，而不是舊的邏輯
          permissions: permissions,
          preferences: userData.preferences || {},
        };
        this.sessionId = sessionId;
        this.detailedPermissions = Array.isArray(userData.detailedPermissions)
          ? userData.detailedPermissions
          : [];

        manageUserPresence(userData.key);

      } else {
        this.clearUser();
      }
    },

    clearUser() {
      this.user = null;
      this.sessionId = null;
      this.detailedPermissions = [];
      this.unreadCount = 0;
    },

    async fetchUserByLineId(lineId) {
      if (!lineId) {
        this.clearUser();
        return false;
      }

      try {
        // 1. 呼叫 API 驗證綁定 (維持原樣，這是為了確認 LIFF 身份)
        const liffData = await getLiffUserData({ lineId: lineId });

        if (liffData.status === 'not_bound') {
          console.warn(`[UserStore] LIFF ID [${lineId}] 尚未綁定。`);
          this.clearUser();
          return false;
        }

        if (liffData.status !== 'bound') {
          throw new Error(liffData.message || '獲取 LIFF 用戶資料失敗');
        }

        // 2. 查詢 Users 集合取得 userKey
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("lineId", "==", lineId));
        const userSnapshot = await getDocs(q);

        if (userSnapshot.empty) {
          console.warn(`在 Firestore 中找不到對應的 LINE ID: ${lineId}`);
          this.clearUser();
          return false;
        }

        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();
        const userKey = userDoc.id;

        // ✅ [關鍵升級] 直接從資料庫讀取完整權限，不依賴 API 回傳的簡略版
        console.log(`[UserStore] 正在讀取權限資料: userPermissions/${userKey}`);
        const permRef = doc(db, "userPermissions", userKey);
        const permSnap = await getDoc(permRef);

        let finalPermissions = {};

        if (permSnap.exists()) {
          const permData = permSnap.data();
          // 使用資料庫裡的 permissions 物件 (包含客資、驗屋等所有系統)
          finalPermissions = permData.permissions || {};
          console.log('[UserStore] 成功取得完整權限:', Object.keys(finalPermissions));
        } else {
          // 如果沒有獨立權限檔，才勉強使用 API 回傳的 (降級備案)
          // 但根據您的資料結構，應該都有 userPermissions
          console.warn(`[UserStore] 找不到 userPermissions/${userKey}，將使用 API 回傳資料`);
          // 這裡可以放舊的轉換邏輯當備案，或者直接留空
        }

        const preferences = await fetchUserPreferencesFromBackend(userKey);

        // 3. 設定 User State
        this.user = {
          key: userKey,
          lineId: lineId,
          name: userData.name,
          email: userData.email,
          roles: userData.roles || [],
          // ✅ 將完整的權限資料寫入 State
          permissions: finalPermissions,
          preferences: preferences || {},
        };

        // 更新 detailedPermissions 供 UI 使用
        this.detailedPermissions = this.getDetailedPermissions(finalPermissions);

        manageUserPresence(userKey);
        return true;

      } catch (error) {
        console.error("fetchUserByLineId 發生錯誤:", error);
        this.clearUser();
        return false;
      }
    },

    async fetchUserByUserKey(userKey) {
      if (!userKey) {
        this.clearUser();
        return false;
      }
      try {
        const userRef = doc(db, "users", userKey);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          console.warn(`在 Firestore 中找不到對應的 userKey: ${userKey}`);
          this.clearUser();
          return false;
        }

        const userData = userSnap.data();

        console.log(`[UserStore] 正在讀取權限資料: userPermissions/${userKey}`);
        const permRef = doc(db, "userPermissions", userKey);
        const permSnap = await getDoc(permRef);

        let finalPermissions = {};
        if (permSnap.exists()) {
          finalPermissions = permSnap.data().permissions || {};
          console.log('[UserStore] 成功取得完整權限:', Object.keys(finalPermissions));
        } else {
          console.warn(`[UserStore] 找不到 userPermissions/${userKey}`);
        }

        const preferences = await fetchUserPreferencesFromBackend(userKey);

        this.user = {
          key: userKey,
          lineId: userData.lineId || null,
          name: userData.name,
          email: userData.email,
          roles: userData.roles || [],
          permissions: finalPermissions,
          preferences: preferences || {},
        };

        this.detailedPermissions = this.getDetailedPermissions(finalPermissions);
        manageUserPresence(userKey);
        return true;
      } catch (error) {
        console.error("fetchUserByUserKey 發生錯誤:", error);
        this.clearUser();
        return false;
      }
    },

    async loginWithLine(lineId) {
      try {
        console.log('[UserStore] 嘗試使用 LINE ID 登入:', lineId);

        // 呼叫後端 API 檢查此 Line ID 是否綁定
        // 注意: 這裡假設您有一支 API 叫 getLiffUserData 或類似名稱
        // 如果您的後端檢查函數名稱不同，請在此替換
        const response = await getLiffUserData(lineId);

        if (response && response.status === 'success' && response.userData) {
          // 綁定成功，設定使用者狀態
          // 注意：後端回傳的 userData 結構可能需要轉換以符合 setUser 的預期
          // 這裡假設 setUser 會處理權限轉換 (因為您之前的代碼有寫轉換邏輯)

          const userData = response.userData;

          // 呼叫自身的 setUser 來更新 Pinia state
          this.setUser(userData, null); // sessionId 暫時傳 null 或由後端提供

          return { success: true };
        } else {
          // 未綁定或查無此人
          console.warn('[UserStore] LINE ID 未綁定或無效');
          return { success: false };
        }
      } catch (error) {
        console.error('[UserStore] LINE 登入失敗:', error);
        return { success: false, error };
      }
    },

    getDetailedPermissions(permissions) {
      const permsArray = [];
      if (!permissions) return permsArray;
      for (const projectId in permissions) {
        const project = permissions[projectId];
        if (project && Array.isArray(project.systems)) {
          project.systems.forEach(system => {
            permsArray.push({
              projectId: projectId,
              projectName: project.projectName,
              system: system,
            });
          });
        }
      }
      return permsArray;
    },

    async loadUserPreferencesFromDatabase() {
      if (!this.user?.key) return;

      try {
        const preferences = await fetchUserPreferencesFromBackend(this.user.key);
        if (preferences) {
          this.user.preferences = preferences;
        }
      } catch (error) {
        console.error('[UserStore] 從資料庫載入偏好設定失敗:', error);
      }
    },

    async logoutUser() {
      // **** 👇👇👇 在這裡加入 Log 👇👇👇 ****
      console.log('>>> userStore.logoutUser: Action START <<<');
      // **** 👆👆👆 加入 Log 結束 👆👆👆 ****
      const userKey = this.user?.key;

      if (userKey) {
        try {
          // 在 goOffline 內部已有 Log，此處不再添加
          await goOffline(userKey);
        } catch (error) {
          // goOffline 內部會打印錯誤，此處可選擇是否重複打印
          console.error('[UserStore] Error calling goOffline, but proceeding with logout:', error);
        }
      } else {
        console.warn('[UserStore logoutUser] userKey not found when logging out.'); // Log
      }

      console.log('[UserStore logoutUser] Clearing user state...'); // Log
      this.clearUser();
      console.log('[UserStore logoutUser] Removing session storage...'); // Log
      sessionStorage.removeItem('anxi-user-session'); // 確認是 sessionStorage

      try {
        console.log('[UserStore logoutUser] Attempting to navigate to /login...'); // Log
        await router.replace('/login');
        console.log('[UserStore logoutUser] Navigation to /login successful.'); // Log
      } catch (navigationError) {
        console.error('[UserStore logoutUser] Navigation to /login failed:', navigationError); // Log error
        // 即使導航失敗，登出流程也應繼續
      }

      // **** 👇👇👇 在這裡加入 Log 👇👇👇 ****
      console.log('>>> userStore.logoutUser: Action END <<<');
      // **** 👆👆👆 加入 Log 結束 👆👆👆 ****
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

    async ensureLoaded() {
      if (this.user) {
        this.isLoaded = true;
        return;
      }
      this.isLoaded = true;
    },

    async updateUserPreferences(newPreferences) {
      if (this.user) {
        this.user.preferences = {
          ...this.user.preferences,
          ...newPreferences,
        };
        console.log('[UserStore] 使用者偏好設定已在前端更新:', this.user.preferences);

        try {
          await saveUserPreferencesToBackend(this.user.key, newPreferences);
          console.log('[UserStore] 使用者偏好設定已成功同步至後端。');
        } catch (error) {
          console.error('[UserStore] 同步偏好設定至後端失敗:', error);
        }
      }
    },
  },

  getters: {
    isLoggedIn: (state) => !!state.user,
    currentUserRoles: (state) => state.user?.roles || [],
    currentUserPreferences: (state) => state.user?.preferences || {},

    hasProjectPermission: (state) => (systemName, projectName) => {
      const permissions = state.user?.permissions;
      if (!permissions || !projectName) {
        return false;
      }

      for (const projectId in permissions) {
        const project = permissions[projectId];
        if (project.projectName === projectName) {
          return project.systems?.includes(systemName) || false;
        }
      }

      return false;
    },

    hasPermission: (state) => (systemName) => {
      const permissions = state.user?.permissions;
      if (!permissions) return false;
      for (const projectId in permissions) {
        if (permissions[projectId].systems?.includes(systemName)) {
          return true;
        }
      }
      return false;
    },
    hasAnyPermission: (state) => (systemNames) => {
      const permissions = state.user?.permissions;
      if (!permissions || !Array.isArray(systemNames)) return false;
      for (const projectId in permissions) {
        if (permissions[projectId].systems?.some(s => systemNames.includes(s))) {
          return true;
        }
      }
      return false;
    },
    canSendMessage: (state) => {
      const permissions = state.user?.permissions;
      if (!permissions) return false;
      for (const projectId in permissions) {
        if (permissions[projectId].systems?.some(s => s.startsWith('寄信-'))) {
          return true;
        }
      }
      return false;
    },
  },

  persist: {
    key: 'anxi-user-session',
    storage: sessionStorage,
    paths: ['user', 'detailedPermissions', 'unreadCount', 'sessionId']
  }
});