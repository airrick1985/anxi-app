// /src/store/quoteStore.js
import { defineStore } from 'pinia';
import { useToast } from 'vue-toastification';

const toast = useToast();

export const useQuoteStore = defineStore('quote', {
  // 1. State: 數據存儲 (保持不變)
  state: () => ({
    items: [],
    maxItems: 5,
    personnelName: '',
    personnelPhone: ''
  }),

  // 2. Getters: 計算屬性 (✅ 關鍵修改區域)
  getters: {
    // 這個 getter 不需要訪問其他 getter，可以用箭頭函數或普通函數
    itemCount: (state) => state.items.length,

    // 這個 getter 也不需要訪問其他 getter
    isItemInQuote: (state) => {
      const itemIds = new Set(state.items.map(item => item.unitId));
      return (unitId) => itemIds.has(unitId);
    },

    /**
     * 計算特定戶別的已選車位總價
     * @returns {function(string): number}
     */
    getParkingTotalPrice(state) { // ✅ 改為普通函數
      return (unitId) => {
        const item = state.items.find(item => item.unitId === unitId);
        if (!item) return 0;
        return item.selectedParking.reduce((sum, parking) => sum + (parseFloat(parking['車位表價']) || 0), 0);
      }
    },

    /**
     * 計算特定戶別的「配套價格」
     * @returns {function(string): number}
     */
    getPackagePrice(state) { // ✅ 改為普通函數
      return (unitId) => {
        const item = state.items.find(item => item.unitId === unitId);
        if (!item || !item.usePackageDeal) return 0;
        
        // ✅ 關鍵修改：使用 this 來安全地調用同一個 store 中的其他 getter
        const parkingTotal = this.getParkingTotalPrice(unitId);
        
        const originalHousePrice = parseFloat(item.unitDetails['房屋總表價']) || 0;
        const packageHousePrice = parseFloat(item.unitDetails['配套房屋總價']) || 0;
        
        return (originalHousePrice + parkingTotal) - packageHousePrice;
      }
    },

    /**
     * 計算特定戶別的「最終顯示總價」
     * @returns {function(string): number}
     */
    getFinalTotalPrice(state) { // ✅ 改為普通函數
      return (unitId) => {
        const item = state.items.find(item => item.unitId === unitId);
        if (!item) return 0;
        
        // ✅ 關鍵修改：使用 this 來安全地調用同一個 store 中的其他 getter
        const parkingTotal = this.getParkingTotalPrice(unitId);
        
        const housePrice = item.usePackageDeal 
          ? (parseFloat(item.unitDetails['配套房屋總價']) || 0)
          : (parseFloat(item.unitDetails['房屋總表價']) || 0);

        return housePrice + parkingTotal;
      }
    }
  },

  // 3. Actions: 操作方法 (保持不變)
  actions: {
    addItem(unitData) {
      if (this.items.length >= this.maxItems) {
        toast.warning(`報價單已滿，最多只能加入 ${this.maxItems} 戶！`);
        return;
      }
      if (this.isItemInQuote(unitData['戶別'])) {
        toast.info(`戶別 ${unitData['戶別']} 已在您的報價單中。`);
        return;
      }
      const salesStatus = unitData['銷控狀態'] || '';
      const backendStatus = unitData['銷控後台狀態'] || '';
      if (salesStatus !== '' || backendStatus !== '') {
        toast.error(`戶別 ${unitData['戶別']} 為「${salesStatus || backendStatus}」狀態，不可加入報價。`);
        return;
      }
      this.items.push({
        unitId: unitData['戶別'],
        unitDetails: unitData,
        isFirstTimeBuyer: '否',
        usePackageDeal: false,
        selectedParking: []
      });
      toast.success(`戶別 ${unitData['戶別']} 已成功加入報價單！`);
    },
    removeItem(unitId) {
      const initialLength = this.items.length;
      this.items = this.items.filter(item => item.unitId !== unitId);
      if (this.items.length < initialLength) {
        toast.error(`戶別 ${unitId} 已從報價單中移除。`);
      }
    },
    updateUnitField(unitId, field, value) {
      const item = this.items.find(item => item.unitId === unitId);
      if (item) {
        item[field] = value;
      }
    },
    updateParking(unitId, parkingList) {
      const item = this.items.find(item => item.unitId === unitId);
      if (item) {
        item.selectedParking = parkingList;
      }
    },
    clearQuote() {
      this.items = [];
      this.personnelName = '';
      this.personnelPhone = '';
      toast.info('報價單已清空。');
    }
  },

  // 持久化 (保持不變)
  persist: true
});