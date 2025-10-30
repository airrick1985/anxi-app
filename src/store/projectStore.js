// src/store/projectStore.js

import { defineStore } from 'pinia';
import { fetchAllProjects } from '@/api';

export const useProjectStore = defineStore('projects', {
  state: () => ({
    projectsList: [], // 原始專案列表 [{id, name, ...}]
    idToNameMap: {},  // ID -> 名稱 的對照表 { fuyu61: '富宇富御' }
    nameToIdMap: {},  // 名稱 -> ID 的對照表 { '富宇富御': 'fuyu61' }
    isLoading: false,
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