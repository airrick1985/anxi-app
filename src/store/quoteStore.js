import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useToast } from 'vue-toastification';

const toast = useToast();

export const useQuoteStore = defineStore('quote', () => {
  const items = ref([]);
  const personnelName = ref('');
  const personnelPhone = ref('');

  // --- 基礎 Getters ---
  const getParkingTotalPrice = computed(() => {
    return (internalId) => {
      const item = items.value.find(i => i.internalId === internalId);
      if (!item) return 0;
      return item.selectedParking.reduce((sum, p) => sum + (Number(p.price_list) || 0), 0);
    };
  });

  const getFinalTotalPrice = computed(() => {
    return (internalId) => {
      const item = items.value.find(i => i.internalId === internalId);
      if (!item) return 0;
      if (item.usePackageDeal) {
        // 使用配套價格作為最終總價
        return Number(item.unitDetails.price_package_deal) || 0;
      } else {
        const housePrice = Number(item.unitDetails.price_list_house_total) || 0;
        const parkingTotal = getParkingTotalPrice.value(internalId);
        return housePrice + parkingTotal;
      }
    };
  });
  
  const getPackagePrice = computed(() => {
    return (internalId) => {
      const item = items.value.find(i => i.internalId === internalId);
      if (!item || !item.usePackageDeal) return 0;
      
      // 原價總和
      const originalPrice = (Number(item.unitDetails.price_list_house_total) || 0) + 
                           getParkingTotalPrice.value(internalId);
      // 配套價
      const packagePrice = Number(item.unitDetails.price_package_deal) || 0;
      // 折扣金額
      return originalPrice - packagePrice;
    };
  });

  const getRawDisplayHousePrice = computed(() => {
    return (internalId) => {
      const item = items.value.find(i => i.internalId === internalId);
      if (!item) return 0;
      if (item.usePackageDeal) {
        // 配套模式下的房屋價格 = 配套總價 - 車位價格
        const packageTotal = Number(item.unitDetails.price_package_deal) || 0;
        return packageTotal - getParkingTotalPrice.value(internalId);
      } else {
        return Number(item.unitDetails.price_list_house_total) || 0;
      }
    };
  });

  const getDisplayUnitPrice = computed(() => {
    return (internalId) => {
      const item = items.value.find(i => i.internalId === internalId);
      if (!item) return 0;
      const area = Number(item.unitDetails.area_house_ping);
      if (!area) return 0;
      const housePrice = getRawDisplayHousePrice.value(internalId);
      return (housePrice / area);
    };
  });

  const itemCount = computed(() => items.value.length);
  
  const isItemInQuote = computed(() => {
    const itemIds = new Set(items.value.map(item => item.unitId));
    return (unitId) => itemIds.has(unitId);
  });

  // --- Actions ---
function addItem(unitData) {
    // ✅ [打勾] 移除(註解)重複檢查邏輯
    /*
    const existingItem = items.value.find(item => item.unitId === unitData['戶別']);
    if (existingItem) {
      toast.warning(`戶別 ${unitData['戶別']} 已在報價單中`);
      return false; 
    }
    */
    
    // 確保 internalId 絕對唯一 (因為現在允許多個相同 unitId)
    const uniqueId = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    
    items.value.push({
      internalId: uniqueId,
      unitId: unitData['戶別'],
      unitDetails: unitData,
      isFirstTimeBuyer: '否',
      usePackageDeal: false,
      selectedParking: [],
      // ★★★ 1. 新增：初始化 packageItems 屬性 ★★★
      packageItems: {},
      // ✅ [打勾] 新增：初始化期款計算結果
      calculatedPayments: [],
      // ✅ [新增] 議價調整狀態：追蹤每個品項的原始價格、調整方式和數值
      negotiationState: {
        originalPrice: null,    // null = 未調整；首次調整時記錄原始價格
        activeMode: '',         // '' | 'perTsubo' | 'directAmount' - 最後使用的模式
        perTsuboValue: '',      // 每坪調整的值（獨立保存）
        directAmountValue: ''   // 直接調整的值（獨立保存）
      }
    });

    return true; // 保持回傳 true，以便 UnitDetailModal 顯示 toast
     }

  function removeItem(internalId) {
    const index = items.value.findIndex(item => item.internalId === internalId);
    if (index !== -1) {
      items.value.splice(index, 1);
    }
  }

  function updateUnitField(internalId, field, value) {
    const item = items.value.find(i => i.internalId === internalId);
    if (item) {
      item[field] = value;
    }
  }
  
  function updateParking(internalId, newParking) {
    const item = items.value.find(i => i.internalId === internalId);
    if (item) {
      item.selectedParking = newParking;
    }
  }

  // ✅ [新增] 修改房屋總價
  function updateHousePrice(internalId, newPrice) {
    const item = items.value.find(i => i.internalId === internalId);
    if (item) {
      item.unitDetails.price_list_house_total = Number(newPrice) || 0;
    }
  }

  // ✅ [新增] 更新議價調整狀態：儲存每個 item 的調整方式、數值和原始價格
  function updateNegotiationState(internalId, negotiationState) {
    const item = items.value.find(i => i.internalId === internalId);
    if (item) {
      item.negotiationState = { ...item.negotiationState, ...negotiationState };
    }
  }

  // ✅ [新增] 重置議價調整：恢復原始價格並清除調整狀態
  function resetNegotiationPrice(internalId) {
    const item = items.value.find(i => i.internalId === internalId);
    if (item && item.negotiationState?.originalPrice !== null && item.negotiationState?.originalPrice !== undefined) {
      item.unitDetails.price_list_house_total = item.negotiationState.originalPrice;
      item.negotiationState = {
        originalPrice: null,
        activeMode: '',
        perTsuboValue: '',
        directAmountValue: ''
      };
    }
  }

  // ✅ [新增] 清空所有議價調整：離開報價設定時呼叫，恢復所有原始價格並清除調整狀態
  function clearAllNegotiations() {
    items.value.forEach(item => {
      // 若有原始價格，先恢復
      if (item.negotiationState?.originalPrice !== null &&
          item.negotiationState?.originalPrice !== undefined) {
        item.unitDetails.price_list_house_total = item.negotiationState.originalPrice;
      }
      // 清空調整狀態
      item.negotiationState = {
        originalPrice: null,
        activeMode: '',
        perTsuboValue: '',
        directAmountValue: ''
      };
    });
  }

  // ★★★ 2. 新增：更新配套價子項目的 action ★★★
  function updateItemPackageItems(internalId, newPackageItems) {
    const item = items.value.find(i => i.internalId === internalId);
    if (item) {
      item.packageItems = newPackageItems;
    }
  }

  // ✅ [打勾] 新增：儲存期款計算結果的 Action
  /**
   * @param {string} internalId 
   * @param {Array<{name: string, value: number}>} paymentsArray 
   */
  function updateItemCalculatedPayments(internalId, paymentsArray) {
    const item = items.value.find(i => i.internalId === internalId);
    if (item) {
      // 我們儲存簡化後的陣列，只包含名稱和值
      item.calculatedPayments = paymentsArray.map(p => ({
        name: p.name,
        value: p.value,
        percentage: p.percentage // 新增
      }));
    }
  }

  function clearQuote() {
    items.value = [];
  }

  return {
    items,
    personnelName,
    personnelPhone,
    itemCount,
    isItemInQuote,
    getParkingTotalPrice,
    getPackagePrice,
    getFinalTotalPrice,
    getRawDisplayHousePrice,
    getDisplayUnitPrice,
    addItem,
    removeItem,
    updateUnitField,
    updateParking,
    updateHousePrice,
    updateNegotiationState,
    resetNegotiationPrice,
    clearAllNegotiations,
    updateItemPackageItems,
    updateItemCalculatedPayments,
    clearQuote
  };
}, {
  persist: true
});
