// src/store/adminStore.js
import { defineStore } from 'pinia';
import { useProjectStore } from '@/store/projectStore';
import { fetchUserManagementInitialData } from '@/api';
import { computed } from 'vue';

export const useAdminStore = defineStore('admin', {
  state: () => ({
    // 快取標記
    isLoaded: false,
    isLoading: false,

    // 快取的資料
    adminScope: {},
    adminScopeById: {}, // 以 projectId 為 key 的權限範圍，解決中文名稱 mapping 延遲問題
    manageableUsers: [],
    roles: [],
    systemFunctions: [],
    allUserPermissionsMap: new Map(),

    // (projectStore 相關資料，我們依賴 projectStore 自身)
  }),

  getters: {
    // 建立一個 Getter 來產生描述 Map (取代 Vue 檔中的 computed)
    functionDescriptionMap(state) {
      return state.systemFunctions.reduce((map, func) => {
        if (func.name && func.description) {
          map[func.name] = func.description;
        }
        return map;
      }, {});
    },

    // 建立 Getter 獲取所有功能名稱 (取代 Vue 檔中的 computed)
    allFunctionNames(state) {
      return state.systemFunctions.map(f => f.name).sort();
    },

    // 建立 Getter 獲取所有角色名稱 (取代 Vue 檔中的 computed)
    allRoleNames(state) {
      return state.roles.map(r => r.name);
    }
  },

  actions: {
    /**
     * 獲取所有管理資料，如果已載入則使用快取
     */
    async loadAdminData(adminKey, forceReload = false) {
      // 1. 檢查快取
      if (this.isLoaded && !forceReload) {
        console.log('[AdminStore] 從快取載入管理資料...');
        return;
      }

      // 如果強制重新載入，先清空舊資料
      if (forceReload) {
        this.invalidateCache();
      }

      console.log('[AdminStore] 正在從後端獲取管理資料...');
      this.isLoading = true;
      const projectStore = useProjectStore();

      try {
        // 2. 確保依賴的 projectStore 已載入
        // (projectStore 內建自己的快取，所以重複呼叫是安全的)
        await projectStore.fetchProjects();

        // 3. 呼叫主要的 API
        const result = await fetchUserManagementInitialData(adminKey);
        if (result.status !== 'success') {
          throw new Error(result.message || '獲取初始資料失敗');
        }

        const {
          adminScope: scopeData,
          manageableUsers: users,
          roles: rolesData,
          projects: projectsData, // 注意：這份 projectData 已被 projectStore.fetchProjects() 載入
          systemFunctions: functionsData,
          allUserPermissionsMap: permissionsMapObject
        } = result.data;

        // 4. 處理 Admin Scope (使用 projectStore 的 map)
        const scopeByProjectName = {};
        if (scopeData) {
          for (const projectId in scopeData) {
            const projectName = projectStore.idToNameMap[projectId]; // 應使用 idToNameMap
            if (projectName) {
              scopeByProjectName[projectName] = scopeData[projectId].systems;
            }
          }
        }

        // 5. 更新 State
        this.adminScope = scopeByProjectName;
        this.adminScopeById = scopeData || {}; // 直接保留以 id 為 key 的原始資料
        this.manageableUsers = users.map(u => ({ ...u, rolesLoading: false }));
        this.roles = rolesData;
        this.systemFunctions = functionsData;
        this.allUserPermissionsMap = new Map(Object.entries(permissionsMapObject));

        // 6. 標記為已載入 (快取生效)
        this.isLoaded = true;

      } catch (error) {
        console.error('[AdminStore] 載入管理資料失敗:', error);
        throw error; // 讓 Vue 元件的 catch 區塊可以捕捉到
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * 標記快取為無效，強制下次重新載入
     */
    invalidateCache() {
      this.isLoaded = false;
      this.manageableUsers = [];
      this.roles = [];
      this.systemFunctions = [];
      this.allUserPermissionsMap = new Map();
      this.adminScope = {};
      this.adminScopeById = {};
      console.log('[AdminStore] 快取已清除。');
    }
  },
});