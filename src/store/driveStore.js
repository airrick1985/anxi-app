import { defineStore } from 'pinia';
import { driveProxyList, driveProxyTask } from '@/api';
import { onSnapshot, doc } from 'firebase/firestore'; // ✓ 簡化 import
import { db } from '@/firebase';

export const useDriveStore = defineStore('drive', {
  state: () => ({
    // 用於快取每個資料夾的內容，key 是 folderId
    cache: {}, 
    // 用於追蹤背景任務的狀態，key 是 taskId
    tasks: {}, 
    // 用於存放監聽器，以便後續取消
    taskListeners: {}, 
  }),

  actions: {
    /**
     * 從 API 獲取檔案列表，並實作快取
     * @param {string} folderId - Google Drive 資料夾 ID
     * @param {boolean} forceRefresh - 是否強制重新整理，忽略快取
     * @returns {Promise<Array>} - 檔案列表
     */
    async fetchFiles(folderId, forceRefresh = false) {
      if (!forceRefresh && this.cache[folderId]) {
        console.log(`[DriveStore] 從快取讀取: ${folderId}`);
        return this.cache[folderId];
      }
      console.log(`[DriveStore] 從 API 獲取: ${folderId}`);
      const response = await driveProxyList({ folderId });
      if (response.status === 'success') {
        this.cache[folderId] = response.files;
        return response.files;
      } else {
        throw new Error(response.message || '無法獲取檔案列表');
      }
    },

    /**
     * 啟動一個後端背景任務 (下載或更名)
     * @param {object} payload - 任務所需的參數
     * @returns {Promise<string>} - 返回任務 ID
     */
    async startTask(payload) {
      const response = await driveProxyTask(payload);
      if (response.status === 'pending' && response.taskId) {
        const taskId = response.taskId;
        // 初始化任務狀態
        this.tasks[taskId] = {
          id: taskId,
          status: 'pending',
          progress: '0/0',
          details: '任務已送出...'
        };
        // 開始監聽這個任務的進度
        this.listenToTask(taskId);
        return taskId;
      } else {
        throw new Error(response.message || '無法啟動任務');
      }
    },

    /**
     * 監聽 Firestore 中特定任務文檔的即時變化
     * @param {string} taskId - 任務 ID
     */
    listenToTask(taskId) {
      // 如果已經在監聽，先取消舊的
      if (this.taskListeners[taskId]) {
        this.taskListeners[taskId]();
      }
      
      const taskDocRef = doc(db, 'driveTasks', taskId);
      
      const unsubscribe = onSnapshot(taskDocRef, (doc) => {
        if (doc.exists()) {
          const taskData = doc.data();
          this.tasks[taskId] = { id: taskId, ...taskData };

          // 當任務完成或失敗時，停止監聽以節省資源
          if (taskData.status === 'completed' || taskData.status === 'error') {
            if (this.taskListeners[taskId]) {
              this.taskListeners[taskId]();
              delete this.taskListeners[taskId];
            }
          }
        } else {
          console.warn(`[DriveStore] 監聽的任務 ${taskId} 不存在。`);
          if (this.taskListeners[taskId]) {
            this.taskListeners[taskId]();
            delete this.taskListeners[taskId];
          }
        }
      });
      
      this.taskListeners[taskId] = unsubscribe;
    },
  },
});