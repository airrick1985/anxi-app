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
        // ✅ 修正點一：如果資料已存在，直接回傳快取的列表，而不是 undefined
        return this.projectsList;
      }
      
      this.isLoading = true;
      try {
        const projects = await fetchAllProjects();
        this.projectsList = projects;
        
        this.idToNameMap = projects.reduce((acc, project) => {
          if(project.id && project.name) acc[project.id] = project.name;
          return acc;
        }, {});
        
        this.nameToIdMap = projects.reduce((acc, project) => {
          if(project.name && project.id) acc[project.name] = project.id;
          return acc;
        }, {});

        // ✅ 修正點二：必須將 API 呼叫的結果回傳，Promise.all 才能接收到
        return projects;

      } catch (error) {
        console.error('Failed to fetch projects:', error);
        // ✅ 修正點三：發生錯誤時也回傳空陣列，避免 Promise.all 因錯誤而中斷
        return [];
      } finally {
        this.isLoading = false;
      }
    },
  },
});