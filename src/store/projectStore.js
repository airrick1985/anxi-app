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

  actions: {
    async fetchProjects() {
      if (this.projectsList.length > 0) {
        // 如果已經載入過，就不重複載入
        return;
      }
      
      this.isLoading = true;
      try {
        const projects = await fetchAllProjects();
        this.projectsList = projects;
        
        // 當專案列表載入後，自動產生兩種對照表
        this.idToNameMap = projects.reduce((acc, project) => {
          acc[project.id] = project.name;
          return acc;
        }, {});
        
        this.nameToIdMap = projects.reduce((acc, project) => {
          acc[project.name] = project.id;
          return acc;
        }, {});

      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        this.isLoading = false;
      }
    },
  },
});