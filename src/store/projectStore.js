// src/store/projectStore.js

import { defineStore } from 'pinia';
import {
  fetchAllProjects,
  fetchProjectConfig,
  getBookingInitialData,
  fetchBuildingListForUpload,
  fetchAllUnitsForBooking,
  fetchAllUnitsForUpload,
  fetchAllHouseholds,
  getProjectBatchDetails,
  fetchAppointmentDateRange,
  fetchBookingOptions,
  getAllBookingRules,
  fetchAllHouseholdsForProject,
  getSmsBalanceAPI,
  sendSmsAPI,

} from '@/api';

import { useUserStore } from '@/store/user'; // 引入 userStore

import { db } from '@/firebase';
import { doc, getDoc, updateDoc } from "firebase/firestore";

export const useProjectStore = defineStore('projects', {
  state: () => ({
    projectsList: [], // 原始專案列表 [{id, name, ...}]
    idToNameMap: {},  // ID -> 名稱 的對照表 { fuyu61: '富宇富御' }
    nameToIdMap: {},  // 名稱 -> ID 的對照表 { '富宇富御': 'fuyu61' }
    isLoading: false,
    currentProjectId: null,
    projectDetailsCache: {}, // 格式: { 'projectId': { ...data } }
    projectHouseholdsCache: {}, // 格式: { 'projectId': [...] }
    projectBatchDetailsCache: {}, // 格式: { 'projectId': { ... } }
    projectBookingOptionsCache: {}, // 格式: { 'projectId': { ... } }
    projectBookingRulesCache: {},   // 格式: { 'projectId': { ... } }
    projectDateRangeCache: {},      // 格式: { 'projectId': { minDate, maxDate } }
    smsBalance: null, // ✅ 確保有這一行
  }),

  getters: {
    // ✓【修正】根據建案名稱查找其關聯的系統
    getSystemsForProject: (state) => {
      return (projectName) => {
        // 從 state.projectsList (而不是 state.projects) 中尋找
        const project = state.projectsList.find(p => p.name === projectName);
        return project?.systems || [];
      };
    },
    // ✅ [新增] 讓組件可以直接透過傳入的 ID 找專案資料，不依賴 state.currentProjectId
    getProjectById: (state) => {
      return (projectId) => state.projectsList.find(p => p.id === projectId);
    },
    currentProject: (state) => {
      if (!state.currentProjectId || state.projectsList.length === 0) return null;
      return state.projectsList.find(p => p.id === state.currentProjectId);
    },
  },


  actions: {
    async fetchProjects() {
      if (this.projectsList.length > 0) {
        // ✅ 修正點一：如果資料已存在，直接回傳快取的列表，而不是 undefined
        return this.projectsList;
      }

      this.isLoading = true;
      try {
        const projects = await fetchAllProjects();
        this.projectsList = projects;

        // 在 fetch 成功後直接更新 map
        this.idToNameMap = projects.reduce((acc, project) => {
          if (project.id && project.name) acc[project.id] = project.name;
          return acc;
        }, {});
        this.nameToIdMap = projects.reduce((acc, project) => {
          if (project.name && project.id) acc[project.name] = project.id;
          return acc;
        }, {});

        return projects; // 返回獲取的數據

      } catch (error) {
        console.error('Failed to fetch projects:', error);
        return []; // 返回空陣列
      } finally {
        this.isLoading = false;
      }
    },

    // ✅ 3. 修改 fetchProjectStaticData，讓它可以被共用
    // 這個 action 現在只負責獲取 config 和 booking page 的資料
    async fetchProjectStaticData(projectId, forceRefresh = false) {
      if (!forceRefresh && this.projectDetailsCache[projectId]) {
        console.log(`[ProjectStore] 從快取載入 ${projectId} 的 Booking 靜態資料...`);
        return this.projectDetailsCache[projectId];
      }

      console.log(`[ProjectStore] 首次載入 ${projectId} (Booking)，正在從後端獲取...`);
      // 注意：isLoading 由呼叫它的 action (例如 fetchAdminBookingData) 控制

      try {
        const config = await fetchProjectConfig(projectId);
        if (!config) {
          throw new Error(`無法獲取建案 ${projectId} 的設定。`);
        }

        const [
          initialRes,
          uploadBuildingsRes,
          unitsRes,
          uploadUnitsRes
        ] = await Promise.all([
          getBookingInitialData(config.projectName, projectId),
          fetchBuildingListForUpload(projectId),
          fetchAllUnitsForBooking(config.projectName, projectId),
          fetchAllUnitsForUpload(projectId)
        ]);

        const staticData = {
          projectConfig: config,
          initialData: initialRes?.data || { buildings: [] },
          uploadBuildingList: uploadBuildingsRes?.data?.buildings || [],
          allUnitsData: unitsRes?.data || {},
          allUnitsDataForUpload: uploadUnitsRes?.data || {}
        };

        this.projectDetailsCache[projectId] = staticData;
        return staticData;

      } catch (error) {
        console.error(`[ProjectStore] 獲取 ${projectId} Booking 靜態資料失敗:`, error);
        throw error;
      }
    },

    // ✅ 4. 新增一個專門給 AdminAddBookingDialog 使用的 action
    async fetchAdminBookingData(projectId) {
      this.isLoading = true;
      try {
        // 建立一個陣列來存放所有需要執行的 Promise
        const promisesToRun = [];

        // 任務 1: 獲取 Config (共用 fetchProjectStaticData 的一部分)
        // 我們檢查 projectDetailsCache 是否已有 config
        let configPromise;
        if (this.projectDetailsCache[projectId]?.projectConfig) {
          console.log(`[ProjectStore] (Admin) 從快取獲取 Config...`);
          configPromise = Promise.resolve(this.projectDetailsCache[projectId].projectConfig);
        } else {
          console.log(`[ProjectStore] (Admin) 首次獲取 Config...`);
          // 如果沒有，只獲取 config
          configPromise = fetchProjectConfig(projectId).then(config => {
            if (!this.projectDetailsCache[projectId]) {
              this.projectDetailsCache[projectId] = {};
            }
            this.projectDetailsCache[projectId].projectConfig = config; // 存入快取
            return config;
          });
        }
        promisesToRun.push(configPromise);

        // 任務 2: 獲取 Households
        let householdsPromise;
        const cachedHouseholds = this.projectHouseholdsCache[projectId];
        // ✅ [修正] 檢查快取是否有內容
        const hasValidHouseholdCache = cachedHouseholds && cachedHouseholds.length > 0;

        if (hasValidHouseholdCache) {
          console.log(`[ProjectStore] (Admin) 從快取獲取 Households...`);
          householdsPromise = Promise.resolve(cachedHouseholds);
        } else {
          console.log(`[ProjectStore] (Admin) 首次(或重新)獲取 Households...`);
          householdsPromise = fetchAllHouseholds(projectId).then(data => {
            // 只有當有資料時才快取 (或視需求決定是否快取空陣列)
            if (data && data.length > 0) {
              this.projectHouseholdsCache[projectId] = data;
            }
            return data;
          });
        }
        promisesToRun.push(householdsPromise);

        // 任務 3: 獲取 Batch Details

        let batchesPromise;

        // ✅ [修正] 增加檢查：快取必須存在且有內容 (keys length > 0)
        const cachedBatches = this.projectBatchDetailsCache[projectId];
        const hasValidCache = cachedBatches && Object.keys(cachedBatches).length > 0;

        if (hasValidCache) {
          console.log(`[ProjectStore] (Admin) 從快取獲取 Batches...`);
          batchesPromise = Promise.resolve(cachedBatches);
        } else {
          console.log(`[ProjectStore] (Admin) 首次(或重新)獲取 Batches...`);
          batchesPromise = getProjectBatchDetails({ projectId }).then(res => {
            const data = (res.status === 'success') ? res.data : {};

            // ✅ [修正] 只有當撈到的資料不為空時，才存入快取
            // 這樣可以避免「暫時性失敗」或「尚未建立資料」導致永久卡在空快取
            if (data && Object.keys(data).length > 0) {
              this.projectBatchDetailsCache[projectId] = data;
            }

            return data;
          });
        }
        promisesToRun.push(batchesPromise);

        // 平行執行所有任務
        const [config, householdsRes, batchesRes] = await Promise.all(promisesToRun);

        // 回傳 Vue 元件需要的格式
        return {
          projectConfig: config,
          householdsRes: householdsRes,
          batchesRes: batchesRes
        };

      } catch (error) {
        console.error(`[ProjectStore] 獲取 ${projectId} Admin 靜態資料失敗:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // ✅ 3. 新增一個專門給 InspectionCalendar 使用的 action
    async fetchCalendarStaticData(projectId) {
      this.isLoading = true; // 由 store 控制 loading
      try {
        const promisesToRun = {};

        // 任務 1: 獲取 Config (共用快取)
        if (this.projectDetailsCache[projectId]?.projectConfig) {
          console.log('[ProjectStore] (Calendar) 從快取獲取 Config...');
          promisesToRun.config = Promise.resolve(this.projectDetailsCache[projectId].projectConfig);
        } else {
          console.log('[ProjectStore] (Calendar) 首次獲取 Config...');
          promisesToRun.config = fetchProjectConfig(projectId).then(config => {
            if (!this.projectDetailsCache[projectId]) this.projectDetailsCache[projectId] = {};
            this.projectDetailsCache[projectId].projectConfig = config;
            return config;
          });
        }

        // 任務 2: 獲取 Date Range
        if (this.projectDateRangeCache[projectId]) {
          console.log('[ProjectStore] (Calendar) 從快取獲取 Date Range...');
          promisesToRun.dateRange = Promise.resolve(this.projectDateRangeCache[projectId]);
        } else {
          console.log('[ProjectStore] (Calendar) 首次獲取 Date Range...');
          promisesToRun.dateRange = fetchAppointmentDateRange(projectId).then(data => {
            this.projectDateRangeCache[projectId] = data; // 存入快取
            return data;
          });
        }

        // 任務 3: 獲取 Booking Options
        if (this.projectBookingOptionsCache[projectId]) {
          console.log('[ProjectStore] (Calendar) 從快取獲取 Booking Options...');
          promisesToRun.options = Promise.resolve(this.projectBookingOptionsCache[projectId]);
        } else {
          console.log('[ProjectStore] (Calendar)  spettacolo獲取 Booking Options...');
          promisesToRun.options = fetchBookingOptions(projectId).then(data => {
            this.projectBookingOptionsCache[projectId] = data; // 存入快取
            return data;
          });
        }

        // 任務 4: 獲取 Booking Rules
        if (this.projectBookingRulesCache[projectId]) {
          console.log('[ProjectStore] (Calendar) 從快取獲取 Booking Rules...');
          promisesToRun.rules = Promise.resolve(this.projectBookingRulesCache[projectId]);
        } else {
          console.log('[ProjectStore] (Calendar) 首次獲取 Booking Rules...');
          promisesToRun.rules = getAllBookingRules(projectId).then(data => {
            this.projectBookingRulesCache[projectId] = data; // 存入快取
            return data;
          });
        }

        // 任務 5: 獲取 Households (共用快取)
        // 注意：fetchAllHouseholdsForProject 和 fetchAllHouseholds 功能可能重複
        // 這裡我們使用 fetchAllHouseholdsForProject，因為日曆頁面需要它
        if (this.projectHouseholdsCache[projectId]) {
          console.log('[ProjectStore] (Calendar) 從快取獲取 Households...');
          promisesToRun.households = Promise.resolve(this.projectHouseholdsCache[projectId]);
        } else {
          console.log('[ProjectStore] (Calendar) 首次獲取 Households...');
          promisesToRun.households = fetchAllHouseholdsForProject(projectId).then(data => {
            this.projectHouseholdsCache[projectId] = data; // 存入快取
            return data;
          });
        }

        // 平行執行所有尚未快取的任務
        const results = await Promise.all(Object.values(promisesToRun));

        // 重新組合結果
        const [config, dateRange, options, rules, households] = results;

        return {
          projectConfig: config,
          dateRangeData: dateRange,
          optionsData: options,
          rulesData: rules,
          allHouseholds: households
        };

      } catch (error) {
        console.error(`[ProjectStore] 獲取 ${projectId} Calendar 靜態資料失敗:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },



    async fetchSmsBalance() {
      const userStore = useUserStore();
      const userKey = userStore.user?.key; // 這裡對應 user.js 的 state

      if (!userKey) {
        // 如果這裡噴錯，代表前端 userStore 還沒載入使用者資料
        console.error('[ProjectStore] 使用者未登入，無法查詢餘額');
        return;
      }
      try {
        const data = await getSmsBalanceAPI(userKey);
        if (data.status === 'success') {
          this.smsBalance = data.credit;
          return data.credit;
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        this.smsBalance = 0;
        throw error;
      }
    },

    // ✅ 修正 2: 實作 fetchProjectSettings (對應組件報錯)
    // 實際上是包裝 fetchProjectConfig 或是直接讀取 Firestore
    async fetchProjectSettings(projectId) {
      try {
        const docRef = doc(db, "projects", projectId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // 將設定存入快取 (如果有需要)
          this.projectDetailsCache[projectId] = data;
          return data;
        }
        return null;
      } catch (error) {
        console.error('[ProjectStore] fetchProjectSettings 失敗:', error);
        throw error;
      }
    },

    // ✅ 修正 3: 實作 updateProjectSettings (預防儲存時報錯)
    async updateProjectSettings(projectId, payload) {
      try {
        // 這裡直接使用 Firestore SDK，不需要 api.js 的轉發
        const { doc, updateDoc } = await import("firebase/firestore"); // 或是放在檔案頂部 import
        const { db } = await import("@/firebase");

        const docRef = doc(db, "projects", projectId);
        await updateDoc(docRef, payload);

        // 更新本地快取
        if (this.projectDetailsCache[projectId]) {
          this.projectDetailsCache[projectId] = {
            ...this.projectDetailsCache[projectId],
            ...payload
          };
        }
        return { status: 'success' };
      } catch (error) {
        console.error('[ProjectStore] updateProjectSettings 失敗:', error);
        throw error;
      }
    },



    async sendTestSms(payload) {
      const userStore = useUserStore();
      const userKey = userStore.user?.key;

      if (!userKey) throw new Error('使用者未登入');

      try {
        const res = await sendSmsAPI({
          userKey,
          phoneNumber: payload.phoneNumber,
          message: payload.message,
          subject: payload.subject
        });

        if (res.status === 'success') {
          // ✅ 發送成功後，順便更新 Store 裡的餘額
          this.smsBalance = res.credit;
          return res;
        } else {
          throw new Error(res.message);
        }
      } catch (error) {
        console.error('[ProjectStore] sendTestSms 失敗:', error);
        throw error;
      }
    },

    // --- START: ✓ 新增 setProjectMaps action ---
    // 設置建案 ID 與名稱的雙向映射 (供外部調用，例如 UserManagement)
    setProjectMaps(idMap, nameMap) {
      this.idToNameMap = idMap;
      this.nameToIdMap = nameMap;
      console.log('[ProjectStore] setProjectMaps called:', this.idToNameMap, this.nameToIdMap); // 加入 Log 確認
    },
    // --- END: ✓ 新增 setProjectMaps action ---

    setCurrentProject(id) {
      this.currentProjectId = id;
    },

  },
});