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
      return item.selectedParking.reduce((sum, p) => sum + (Number(p['車位表價']) || 0), 0);
    };
  });

  const getFinalTotalPrice = computed(() => {
    return (internalId) => {
      const item = items.value.find(i => i.internalId === internalId);
      if (!item) return 0;
      if (item.usePackageDeal) {
        return Number(item.unitDetails['配套房屋總價']) || 0;
      } else {
        const housePrice = Number(item.unitDetails['房屋總表價']) || 0;
        const parkingTotal = getParkingTotalPrice.value(internalId);
        return housePrice + parkingTotal;
      }
    };
  });
  
  const getPackagePrice = computed(() => {
    return (internalId) => {
      const item = items.value.find(i => i.internalId === internalId);
      if (!item || !item.usePackageDeal) return 0;
      const originalPrice = (Number(item.unitDetails['房屋總表價']) || 0) + getParkingTotalPrice.value(internalId);
      const packagePrice = Number(item.unitDetails['配套房屋總價']) || 0;
      return originalPrice - packagePrice;
    };
  });

  // ✅ --- 確保這些計算價格的 Getter 都存在 --- ✅
  const getRawDisplayHousePrice = computed(() => {
    return (internalId) => {
      const item = items.value.find(i => i.internalId === internalId);
      if (!item) return 0;
      if (item.usePackageDeal) {
        const packageTotal = Number(item.unitDetails['配套房屋總價']) || 0;
        return packageTotal - getParkingTotalPrice.value(internalId);
      } else {
        return Number(item.unitDetails['房屋總表價']) || 0;
      }
    };
  });

  const getDisplayUnitPrice = computed(() => {
    return (internalId) => {
      const item = items.value.find(i => i.internalId === internalId);
      if (!item) return 0;
      const area = Number(item.unitDetails['房屋面積(坪)']);
      if (!area) return 0;
      const housePrice = getRawDisplayHousePrice.value(internalId);
      return (housePrice / area);
    };
  });

  const itemCount = computed(() => items.value.length);
  
  // ✅ 確保 isItemInQuote 的定義正確
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
    const salesStatus = unitData['銷控狀態'] || '';
    if (salesStatus === '已售') {
      toast.error(`戶別 ${unitData['戶別']} 為「已售」狀態，不可加入報價。`);
      return;
    }
    const uniqueId = `${unitData['戶別']}-${Date.now()}`;
    items.value.push({
      internalId: uniqueId,
      unitId: unitData['戶別'],
      unitDetails: unitData,
      isFirstTimeBuyer: '否',
      usePackageDeal: false,
      selectedParking: []
    });
    toast.success(`戶別 ${unitData['戶別']} 已成功加入報價單！`);
  }

  function removeItem(internalId) {
    const index = items.value.findIndex(item => item.internalId === internalId);
    if (index !== -1) {
      items.value.splice(index, 1);
      toast.info('已從報價單移除');
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

  function clearQuote() {
    items.value = [];
  }

  // ✅ 確保所有需要的 Getters 和 Actions 都在這裡被回傳
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
  };
}, {
  persist: true
});