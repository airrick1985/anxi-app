import { defineStore } from 'pinia';
import { db } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { goOffline, saveUserPreferencesToBackend, fetchUserPreferencesFromBackend, manageUserPresence,getLiffUserData } from '@/api';
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
        // --- START: ✓ 關鍵修改 (呼叫 GCF) ---
        // 正體中文註解：呼叫後端 getLiffUserData 函數
        // 確保 getLiffUserData 已經在 api.js 中 import
        // (您可能需要先在 api.js 中加入 getLiffUserData 的 onCall 函數)
        
        // 假設 getLiffUserData 已在 api.js 中定義：
        // export const getLiffUserData = async (payload) => {
        //   const func = httpsCallable(functions, 'getLiffUserData');
        //   const result = await func(payload);
        //   return result.data;
        // };
        // (如果 LiffInspectionCalendar.vue 已經在呼叫它，那 api.js 應該已經有了)
        const liffData = await getLiffUserData({ lineId: lineId });
        
        if (liffData.status === 'not_bound') {
            console.warn(`[UserStore] LIFF ID [${lineId}] 尚未綁定。`);
            this.clearUser();
            return false;
        }

        if (liffData.status !== 'bound') {
            throw new Error(liffData.message || '獲取 LIFF 用戶資料失敗');
        }
        // --- END: ✓ 關鍵修改 ---

        // 正體中文註解：從 liffData 中獲取資料
        const { userName, projects } = liffData;

        // 正體中文註解：將後端回傳的 projects 陣列轉換為 Store 儲存的 permissions 物件
        const permissions = {};
        const permsArray = []; // 同時建立 detailedPermissions
        
        if (Array.isArray(projects)) {
            projects.forEach(project => {
                if (project.projectId) {
                    // ✓ 將 bookingTypes 存入 permissions 物件
                    permissions[project.projectId] = {
                        projectName: project.projectName,
                        bookingTypes: project.bookingTypes || [], // ✓ 儲存 bookingTypes
                       systems: project.systems || []
                    };
                    
                   // (這部分是您原有的邏輯，保持不變)
                    // ✅ [打勾] 修正：
                    // 為了讓 detailedPermissions (permsArray) 也正確，
                    // 我們應該遍歷剛拿到的 project.systems
                    if (project.systems && Array.isArray(project.systems)) {
                        project.systems.forEach(systemName => {
                            permsArray.push({
                                projectId: project.projectId,
                                projectName: project.projectName,
                                system: systemName, // 使用真實的 system 名稱
                            });
                        });
                    }
                }
            });
        }
        
        // 正體中文註解：(假設) 需要 userKey (手機號碼)，但 getLiffUserData 沒回傳
        // 這表示 LIFF 登入可能不需要完整的 user 物件，
        // 我們需要從 users 集合再次查詢 userKey
        // (您的舊 `fetchUserByLineId` 邏輯比較好)
        
        // --- 採用您舊的 `fetchUserByLineId` 邏輯，但整合新的 `projects` 資料 ---
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
        
        const preferences = await fetchUserPreferencesFromBackend(userKey);

        // ✓ 組合 user 物件，使用上面剛轉換好的 permissions 物件
        this.user = {
          key: userKey,
          lineId: lineId,
          name: userData.name,
          email: userData.email,
          roles: userData.roles || [],
          permissions: permissions, // ✓ 使用包含 bookingTypes 的 permissions 物件
          preferences: preferences || {},
        };
        
        this.detailedPermissions = permsArray; // ✓ 使用上面轉換好的 permsArray
        
        manageUserPresence(userKey);
        return true;

      } catch (error) {
        console.error("fetchUserByLineId 發生錯誤:", error);
        this.clearUser();
        return false;
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