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
    if (items.value.length >= 5) {
      toast.warning(`報價單已滿，最多只能加入 5 戶！`);
      return;
    }
    
    // 使用時間戳來確保每次添加都是唯一的
    const uniqueId = `${unitData['戶別']}-${Date.now()}`;
    items.value.push({
      internalId: uniqueId,
      unitId: unitData['戶別'],
      unitDetails: unitData,
      isFirstTimeBuyer: '否',
      usePackageDeal: false,
      selectedParking: [],
      // ★★★ 1. 新增：初始化 packageItems 屬性 ★★★
      packageItems: {}
    });
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

  // ★★★ 2. 新增：更新配套價子項目的 action ★★★
  function updateItemPackageItems(internalId, newPackageItems) {
    const item = items.value.find(i => i.internalId === internalId);
    if (item) {
      item.packageItems = newPackageItems;
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
    clearQuote,
    // ★★★ 3. 新增：將新的 action 回傳出去 ★★★
    updateItemPackageItems,
  };
}, {
  persist: true
});
