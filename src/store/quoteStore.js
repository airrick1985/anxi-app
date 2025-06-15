import { defineStore } from 'pinia';
import { useToast } from 'vue-toastification';

const toast = useToast();

export const useQuoteStore = defineStore('quote', {
  // 1. State: 數據存儲
  state: () => ({
    /**
     * 存放已加入報價的戶別物件的陣列
     * @type {Array<Object>}
     */
    items: [],
    /**
     * 報價單的最大容量
     * @type {Number}
     */
    maxItems: 5,
  }),

  // 2. Getters: 計算屬性
  getters: {
    /**
     * 獲取報價單中的戶別數量
     */
    itemCount: (state) => state.items.length,

    /**
     * 檢查某個戶別是否已經在報價單中
     */
    isItemInQuote: (state) => {
      return (unitId) => state.items.some(item => item['戶別'] === unitId);
    },
  },

  // 3. Actions: 操作方法
  actions: {
    /**
     * 將一個戶別加入報價單，包含業務邏輯檢查
     * @param {Object} unitData 要加入的戶別的完整數據
     */
    addItem(unitData) {
      // ✅ 新增：加入條件檢查
      const salesStatus = unitData['銷控狀態'] || '';
      const backendStatus = unitData['銷控後台狀態'] || '';

      // 只有兩種狀態都為空字符串時，才代表「可售」
      if (salesStatus !== '' || backendStatus !== '') {
        toast.error(`戶別 ${unitData['戶別']} 為「${salesStatus || backendStatus}」狀態，不可加入報價。`);
        return;
      }

      // 檢查是否已達上限
      if (this.items.length >= this.maxItems) {
        toast.warning(`報價單已滿，最多只能加入 ${this.maxItems} 戶！`);
        return;
      }

      // 檢查是否已存在
      if (this.isItemInQuote(unitData['戶別'])) {
        toast.info(`戶別 ${unitData['戶別']} 已在您的報價單中。`);
        return;
      }
      
      // 加入新戶別
      this.items.push(unitData);
      toast.success(`戶別 ${unitData['戶別']} 已成功加入報價單！`);
    },

    /**
     * 從報價單中移除一個戶別
     * @param {string} unitId 要移除的戶別 ID
     */
    removeItem(unitId) {
      const initialLength = this.items.length;
      this.items = this.items.filter(item => item['戶別'] !== unitId);
      
      if (this.items.length < initialLength) {
        toast.error(`戶別 ${unitId} 已從報價單中移除。`);
      }
    },

    /**
     * 清空整個報價單
     */
    clearQuote() {
      this.items = [];
      // 清空時可以不提示，或者用一個更柔和的提示
      // toast.info('報價單已清空。');
    },
  },

  // ✅ 關鍵修改：移除了 persist 配置
});