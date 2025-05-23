// src/stores/dropdownStore.js
import { defineStore } from 'pinia';
import { fetchDropdownOptions, fetchAllSubcategories } from '@/api'; // 假設你的 api.js 在 src/api.js

export const useDropdownStore = defineStore('dropdown', {
  state: () => ({
    // 用於存儲來自 fetchDropdownOptions 的數據
    // 數據結構可能類似：{ areas: [], categories: [], statuses: [], levels: [] }
    options: null,
    optionsLastFetched: null,

    // 用於存儲來自 fetchAllSubcategories 的數據
    // 數據結構可能類似：{ categoryName1: [sub1, sub2], categoryName2: [subA, subB] }
    allSubcategories: null,
    allSubcategoriesLastFetched: null,

    // 可以為其他下拉選單數據添加類似的 state 和 lastFetched 時間戳
    // 例如：repairStatusOptions: [], repairStatusOptionsLastFetched: null,

    isLoadingOptions: false,
    isLoadingAllSubcategories: false,
    errorOptions: null,
    errorAllSubcategories: null,
  }),

  actions: {
    // 獲取通用的下拉選單選項
    async loadDropdownOptions(projectName, forceRefresh = false) {
      if (!projectName) {
        console.error('[dropdownStore] loadDropdownOptions: projectName is required.');
        this.errorOptions = 'Project name is required.';
        return;
      }

      const now = Date.now();
      // 簡單的過期策略：如果數據存在且在1小時內獲取過，並且不是強制刷新，則不重新獲取
      if (!forceRefresh && this.options && this.optionsLastFetched && (now - this.optionsLastFetched < 60 * 60 * 1000)) {
        console.log('[dropdownStore] Using cached dropdown options.');
        return;
      }

      this.isLoadingOptions = true;
      this.errorOptions = null;
      try {
        console.log(`[dropdownStore] Fetching dropdown options for project: ${projectName}`);
        const response = await fetchDropdownOptions(projectName);
        if (response && response.status === 'success') {
          // 假設 response.data 或 response.options 包含所需的選單數據對象
          // 例如 response.data = { areas: [...], categories: [...], ... }
          this.options = response.data || response.options || response; // 根據你的 API 實際返回結構調整
          this.optionsLastFetched = now;
          console.log('[dropdownStore] Dropdown options fetched and updated.');
        } else {
          const message = response?.message || 'Failed to fetch dropdown options.';
          console.error(`[dropdownStore] Error fetching dropdown options: ${message}`, response);
          this.errorOptions = message;
          // 如果 API 失敗，但 store 中已有舊數據，讓用戶繼續使用舊數據
          // 如果希望清除舊數據，可以在這裡 this.options = null;
        }
      } catch (error) {
        console.error('[dropdownStore] Exception fetching dropdown options:', error);
        this.errorOptions = error.message || 'An unexpected error occurred.';
      } finally {
        this.isLoadingOptions = false;
      }
    },

    // 獲取所有子分類
    async loadAllSubcategories(projectName, forceRefresh = false) {
      if (!projectName) {
        console.error('[dropdownStore] loadAllSubcategories: projectName is required.');
        this.errorAllSubcategories = 'Project name is required.';
        return;
      }
      const now = Date.now();
      if (!forceRefresh && this.allSubcategories && this.allSubcategoriesLastFetched && (now - this.allSubcategoriesLastFetched < 60 * 60 * 1000)) {
        console.log('[dropdownStore] Using cached subcategories.');
        return;
      }

      this.isLoadingAllSubcategories = true;
      this.errorAllSubcategories = null;
      try {
        console.log(`[dropdownStore] Fetching all subcategories for project: ${projectName}`);
        const response = await fetchAllSubcategories(projectName);
        if (response && response.status === 'success') {
          // 假設 response.data 或 response.subcategories 包含所需的數據
          this.allSubcategories = response.data || response.subcategories || response; // 根據 API 調整
          this.allSubcategoriesLastFetched = now;
          console.log('[dropdownStore] All subcategories fetched and updated.');
        } else {
          const message = response?.message || 'Failed to fetch all subcategories.';
          console.error(`[dropdownStore] Error fetching all subcategories: ${message}`, response);
          this.errorAllSubcategories = message;
        }
      } catch (error) {
        console.error('[dropdownStore] Exception fetching all subcategories:', error);
        this.errorAllSubcategories = error.message || 'An unexpected error occurred.';
      } finally {
        this.isLoadingAllSubcategories = false;
      }
    },
    // 你可以為 getRepairStatusOptions 等其他選單 API 添加類似的 action
  },

  getters: {
    // 可以添加一些 getter 來方便地訪問選單數據
    getAreas: (state) => state.options?.areas || [],
    getCategories: (state) => state.options?.categories || [],
    // ... 其他 getter
  },

  // 配置持久化
  persist: {
    // 預設情況下，它會持久化整個 state 到 localStorage
    // key: 'anxi-dropdown-data', // 可以自訂 localStorage 中的 key
    // storage: localStorage, // 預設是 localStorage
    // paths: ['options', 'optionsLastFetched', 'allSubcategories', 'allSubcategoriesLastFetched'], // 只持久化特定字段
  },
  // 如果你想用 IndexedDB (推薦，如果數據量大或複雜):
  // persist: {
  //   storage: indexedDBStorage, // 你需要實現或引入一個 IndexedDB storage adapter
  //   // (我們稍後可以討論如何實現一個簡單的 indexedDBStorage)
  // },
});

// (可選) 如果你想使用 IndexedDB，這裡是一個非常簡化的 IndexedDB storage adapter 概念
// 你可能需要一個更健壯的實現，或者使用現有的庫如 `pinia-plugin-persistedstate/lib/storages/indexedDB` (如果可用)
// 或自己基於 idb/Dexie 封裝。
/*
import { openDB } from 'idb';

const DB_NAME = 'pinia-persistence';
const STORE_NAME = 'pinia-store';

async function getPiniaDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME); // keyPath 會是 store 的 id (例如 'dropdown')
      }
    },
  });
}

const indexedDBStorage = {
  async getItem(key) {
    const db = await getPiniaDb();
    const value = await db.get(STORE_NAME, key);
    return value ? JSON.parse(value) : null; // Pinia 期望的是對象或 null
  },
  async setItem(key, value) {
    const db = await getPiniaDb();
    return db.put(STORE_NAME, JSON.stringify(value), key);
  },
  async removeItem(key) {
    const db = await getPiniaDb();
    return db.delete(STORE_NAME, key);
  },
};
*/