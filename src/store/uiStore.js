import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    // 控制是否處於車位編輯模式（最大化畫面）
    isParkingEditMode: false,
    // 控制 App.vue 的 Toolbar 顯示
    showAppToolbar: true
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
    }
  }
})