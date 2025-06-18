// /src/store/quoteStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useToast } from 'vue-toastification';

const toast = useToast();

export const useQuoteStore = defineStore('quote', () => {
  // --- State ---
  const items = ref([]);
  const maxItems = ref(5);
  const personnelName = ref('');
  const personnelPhone = ref('');

  // --- Getters ---

  // (Helper) 計算車位總價，此 getter 保持不變
  const getParkingTotalPrice = computed(() => {
    return (unitId) => {
      const item = items.value.find(item => item.unitId === unitId);
      if (!item) return 0;
      return item.selectedParking.reduce((sum, parking) => sum + (parseFloat(parking['車位表價']) || 0), 0);
    }
  });

  // ✅ START: 總價邏輯修改
  // getter: 計算最終總價
  const getFinalTotalPrice = computed(() => {
    return (unitId) => {
      const item = items.value.find(item => item.unitId === unitId);
      if (!item) return 0;

      if (item.usePackageDeal) {
        // 若配套=true, 總價 = 配套房屋總價
        return parseFloat(item.unitDetails['配套房屋總價']) || 0;
      } else {
        // 若配套=false, 總價 = 房屋總表價 + 車位價格
        const originalHousePrice = parseFloat(item.unitDetails['房屋總表價']) || 0;
        const parkingTotal = getParkingTotalPrice.value(unitId);
        return originalHousePrice + parkingTotal;
      }
    };
  });
  // ✅ END: 總價邏輯修改

  // ✅ START: 配套價邏輯修改
  // getter: 計算配套價
  const getPackagePrice = computed(() => {
    return (unitId) => {
      const item = items.value.find(item => item.unitId === unitId);
      if (!item) return 0;

      if (item.usePackageDeal) {
        // 若配套=true, 配套價 = (房屋總表價 + 車位價格) - 配套房屋總價
        const originalHousePrice = parseFloat(item.unitDetails['房屋總表價']) || 0;
        const parkingTotal = getParkingTotalPrice.value(unitId);
        const packageHousePrice = parseFloat(item.unitDetails['配套房屋總價']) || 0;
        return (originalHousePrice + parkingTotal) - packageHousePrice;
      } else {
        // 若配套=false, 配套價 = 0
        return 0;
      }
    };
  });
  // ✅ END: 配套價邏輯修改

  const itemCount = computed(() => items.value.length);

  const isItemInQuote = computed(() => {
    const itemIds = new Set(items.value.map(item => item.unitId));
    return (unitId) => itemIds.has(unitId);
  });

  // --- Actions ---
  function addItem(unitData) {
    if (items.value.length >= maxItems.value) {
      toast.warning(`報價單已滿，最多只能加入 ${maxItems.value} 戶！`);
      return;
    }
    if (isItemInQuote.value(unitData['戶別'])) {
      toast.info(`戶別 ${unitData['戶別']} 已在您的報價單中。`);
      return;
    }
    const salesStatus = unitData['銷控狀態'] || '';
    const backendStatus = unitData['銷控後台狀態'] || '';
    if (salesStatus !== '' || backendStatus !== '') {
      toast.error(`戶別 ${unitData['戶別']} 為「${salesStatus || backendStatus}」狀態，不可加入報價。`);
      return;
    }
    items.value.push({
      unitId: unitData['戶別'],
      unitDetails: unitData,
      isFirstTimeBuyer: '否',
      usePackageDeal: false,
      selectedParking: []
    });
    toast.success(`戶別 ${unitData['戶別']} 已成功加入報價單！`);
  }

  function removeItem(unitId) {
    const initialLength = items.value.length;
    items.value = items.value.filter(item => item.unitId !== unitId);
    if (items.value.length < initialLength) {
      toast.error(`戶別 ${unitId} 已從報價單中移除。`);
    }
  }

  function updateUnitField(unitId, field, value) {
    const item = items.value.find(item => item.unitId === unitId);
    if (item) {
      item[field] = value;
    }
  }

  function updateParking(unitId, parkingList) {
    const item = items.value.find(item => item.unitId === unitId);
    if (item) {
      item.selectedParking = parkingList;
    }
  }

  function clearQuote() {
    items.value = [];
    personnelName.value = '';
    personnelPhone.value = '';
    // toast.info('報價單已清空。');
  }

  return {
    items,
    maxItems,
    personnelName,
    personnelPhone,
    itemCount,
    isItemInQuote,
    getParkingTotalPrice,
    getPackagePrice,
    getFinalTotalPrice,
    addItem,
    removeItem,
    updateUnitField,
    updateParking,
    clearQuote
  };

}, {
  persist: true
});