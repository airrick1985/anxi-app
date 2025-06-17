// /src/store/quoteStore.js
import { defineStore } from 'pinia';
import { useToast } from 'vue-toastification';

const toast = useToast();

export const useQuoteStore = defineStore('quote', {
  // 1. State: 數據存儲
  state: () => ({
    /**
     * 報價單中的項目列表。每個 item 都是一個包含詳細數據和用戶選擇狀態的物件。
     * @type {Array<{unitId: string, unitDetails: object, isFirstTimeBuyer: string, usePackageDeal: boolean, selectedParking: Array<object>}>}
     */
    items: [],
    
    /**
     * 報價單的最大容量
     * @type {Number}
     */
    maxItems: 5,

    /**
     * 報價單的全局資訊
     */
    personnelName: '',
    personnelPhone: ''
  }),

  // 2. Getters: 計算屬性
  getters: {
    /**
     * 獲取報價單中的戶別數量
     */
    itemCount: (state) => state.items.length,

    /**
     * 檢查某個戶別是否已經在報價單中
     * @returns {function(string): boolean}
     */
    isItemInQuote: (state) => {
      // 使用 Set 提高查找效率
      const itemIds = new Set(state.items.map(item => item.unitId));
      return (unitId) => itemIds.has(unitId);
    },

    /**
     * 計算特定戶別的已選車位總價
     * @returns {function(string): number}
     */
    getParkingTotalPrice: (state) => (unitId) => {
      const item = state.items.find(item => item.unitId === unitId);
      if (!item) return 0;
      return item.selectedParking.reduce((sum, parking) => sum + (parseFloat(parking['車位表價']) || 0), 0);
    },

    /**
     * 計算特定戶別的「配套價格」
     * @returns {function(string): number}
     */
    getPackagePrice: (state) => (unitId) => {
      const item = state.items.find(item => item.unitId === unitId);
      // 只有勾選了配套，才計算配套價
      if (!item || !item.usePackageDeal) return 0;
      
      // 注意：這裡的 getParkingTotalPrice 需要通過 this 來訪問 store 實例中的 getter
      const parkingTotal = this.getParkingTotalPrice(unitId);
      const originalHousePrice = parseFloat(item.unitDetails['房屋總表價']) || 0;
      const packageHousePrice = parseFloat(item.unitDetails['配套房屋總價']) || 0;
      
      // 配套價 = (原始總價) - (配套總價)
      return (originalHousePrice + parkingTotal) - packageHousePrice;
    },

    /**
     * 計算特定戶別的「最終顯示總價」
     * @returns {function(string): number}
     */
    getFinalTotalPrice: (state) => (unitId) => {
      const item = state.items.find(item => item.unitId === unitId);
      if (!item) return 0;
      
      const parkingTotal = this.getParkingTotalPrice(unitId);
      const housePrice = item.usePackageDeal 
        ? (parseFloat(item.unitDetails['配套房屋總價']) || 0)
        : (parseFloat(item.unitDetails['房屋總表價']) || 0);

      return housePrice + parkingTotal;
    }
  },

  // 3. Actions: 操作方法
  actions: {
    /**
     * 將一個戶別加入報價單，包含完整的業務邏輯檢查
     * @param {Object} unitData 要加入的戶別的完整數據
     */
    addItem(unitData) {
      // 檢查1：是否已達上限
      if (this.items.length >= this.maxItems) {
        toast.warning(`報價單已滿，最多只能加入 ${this.maxItems} 戶！`);
        return;
      }

      // 檢查2：是否已存在
      if (this.isItemInQuote(unitData['戶別'])) {
        toast.info(`戶別 ${unitData['戶別']} 已在您的報價單中。`);
        return;
      }
      
      // 檢查3：是否為「可售」狀態
      const salesStatus = unitData['銷控狀態'] || '';
      const backendStatus = unitData['銷控後台狀態'] || '';
      if (salesStatus !== '' || backendStatus !== '') {
        toast.error(`戶別 ${unitData['戶別']} 為「${salesStatus || backendStatus}」狀態，不可加入報價。`);
        return;
      }
      
      // 所有檢查通過，加入新戶別
      this.items.push({
        unitId: unitData['戶別'],
        unitDetails: unitData, // 存儲完整的原始數據
        isFirstTimeBuyer: '否', // 預設為非首購
        usePackageDeal: false, // 預設不使用配套
        selectedParking: []    // 預設沒有選擇車位
      });
      toast.success(`戶別 ${unitData['戶別']} 已成功加入報價單！`);
    },

    /**
     * 從報價單中移除一個戶別
     * @param {string} unitId 要移除的戶別 ID
     */
    removeItem(unitId) {
      const initialLength = this.items.length;
      this.items = this.items.filter(item => item.unitId !== unitId);
      
      if (this.items.length < initialLength) {
        toast.error(`戶別 ${unitId} 已從報價單中移除。`);
      }
    },

    /**
     * 更新特定戶別的某個字段狀態
     * @param {string} unitId 戶別 ID
     * @param {string} field 要更新的字段名 (e.g., 'isFirstTimeBuyer', 'usePackageDeal')
     * @param {*} value 新的值
     */
    updateUnitField(unitId, field, value) {
      const item = this.items.find(item => item.unitId === unitId);
      if (item) {
        item[field] = value;
      }
    },
    
    /**
     * 更新特定戶別的已選車位列表
     * @param {string} unitId 戶別 ID
     * @param {Array<object>} parkingList 新的車位列表
     */
    updateParking(unitId, parkingList) {
      const item = this.items.find(item => item.unitId === unitId);
      if (item) {
        item.selectedParking = parkingList;
      }
    },

    /**
     * 清空整個報價單
     */
    clearQuote() {
      this.items = [];
      this.personnelName = '';
      this.personnelPhone = '';
      toast.info('報價單已清空。');
    }
  },

  // 開啟持久化，讓報價單內容在刷新頁面或關閉瀏覽器後依然存在
  persist: true
});