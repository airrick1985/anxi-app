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

} from '@/api';

export const useProjectStore = defineStore('projects', {
  state: () => ({
    projectsList: [], // 原始專案列表 [{id, name, ...}]
    idToNameMap: {},  // ID -> 名稱 的對照表 { fuyu61: '富宇富御' }
    nameToIdMap: {},  // 名稱 -> ID 的對照表 { '富宇富御': 'fuyu61' }
    isLoading: false,
    projectDetailsCache: {}, // 格式: { 'projectId': { ...data } }
    projectHouseholdsCache: {}, // 格式: { 'projectId': [...] }
    projectBatchDetailsCache: {}, // 格式: { 'projectId': { ... } }
    projectBookingOptionsCache: {}, // 格式: { 'projectId': { ... } }
    projectBookingRulesCache: {},   // 格式: { 'projectId': { ... } }
    projectDateRangeCache: {},      // 格式: { 'projectId': { minDate, maxDate } }
    // 注意: projectHouseholdsCache 已經存在，可以共用
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
          if(project.id && project.name) acc[project.id] = project.name;
          return acc;
        }, {});
        this.nameToIdMap = projects.reduce((acc, project) => {
          if(project.name && project.id) acc[project.name] = project.id;
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
    async fetchProjectStaticData(projectId) {
      if (this.projectDetailsCache[projectId]) {
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
        if (this.projectHouseholdsCache[projectId]) {
          console.log(`[ProjectStore] (Admin) 從快取獲取 Households...`);
          householdsPromise = Promise.resolve(this.projectHouseholdsCache[projectId]);
        } else {
          console.log(`[ProjectStore] (Admin) 首次獲取 Households...`);
          householdsPromise = fetchAllHouseholds(projectId).then(data => {
            this.projectHouseholdsCache[projectId] = data; // 存入快取
            return data;
          });
        }
        promisesToRun.push(householdsPromise);

        // 任務 3: 獲取 Batch Details
        let batchesPromise;
        if (this.projectBatchDetailsCache[projectId]) {
          console.log(`[ProjectStore] (Admin) 從快取獲取 Batches...`);
          batchesPromise = Promise.resolve(this.projectBatchDetailsCache[projectId]);
        } else {
          console.log(`[ProjectStore] (Admin) 首次獲取 Batches...`);
          batchesPromise = getProjectBatchDetails({ projectId }).then(res => {
            const data = (res.status === 'success') ? res.data : {};
            this.projectBatchDetailsCache[projectId] = data; // 存入快取
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


    // --- START: ✓ 新增 setProjectMaps action ---
    // 設置建案 ID 與名稱的雙向映射 (供外部調用，例如 UserManagement)
    setProjectMaps(idMap, nameMap) {
      this.idToNameMap = idMap;
      this.nameToIdMap = nameMap;
      console.log('[ProjectStore] setProjectMaps called:', this.idToNameMap, this.nameToIdMap); // 加入 Log 確認
    }
    // --- END: ✓ 新增 setProjectMaps action ---

  },
});