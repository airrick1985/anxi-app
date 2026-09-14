import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    // 控制是否處於車位編輯模式（最大化畫面）
    isParkingEditMode: false,
    // 控制 App.vue 的 Toolbar 顯示
    showAppToolbar: true,
    
    // ✅ 新增：全域 Loading 狀態
    loading: false,

    // 系統問題回報：漢堡選單觸發開啟（遞增計數，SystemBugReport 監聽）
    bugReportOpenRequest: 0,
    
    // ✅ 新增：全域 Snackbar (提示框) 狀態
    snackbar: {
      show: false,
      text: '',
      color: 'success',
      timeout: 3000
    }
  }),
  
  actions: {
    // 進入車位編輯模式
    enterParkingEditMode() {
      this.isParkingEditMode = true
      this.showAppToolbar = false
    },
    
    // 退出車位編輯模式
    exitParkingEditMode() {
      this.isParkingEditMode = false
      this.showAppToolbar = true
    },
    
    // 直接設置編輯模式狀態
    setParkingEditMode(isEditMode) {
      this.isParkingEditMode = isEditMode
      this.showAppToolbar = !isEditMode
    },

    // 開啟系統問題回報 Dialog（登入後由漢堡選單呼叫）
    openBugReport() {
      this.bugReportOpenRequest += 1
    },

    // ✅ 新增：設置 Loading 狀態的函式
    setLoading(val) {
      this.loading = val
    },

    // ✅ 新增：顯示 Snackbar 的函式
    showSnackbar(text, color = 'success', timeout = 3000) {
      this.snackbar.text = text
      this.snackbar.color = color
      this.snackbar.timeout = timeout
      this.snackbar.show = true
    }
  }
})