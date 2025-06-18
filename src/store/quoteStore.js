// /src/store/quoteStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue'; // ✅ 引入 ref 和 computed
import { useToast } from 'vue-toastification';

const toast = useToast();

// ✅ 使用 Setup Store 的寫法
export const useQuoteStore = defineStore('quote', () => {
  // --- 1. State: 使用 ref() 定義 ---
  const items = ref([]);
  const maxItems = ref(5);
  const personnelName = ref('');
  const personnelPhone = ref('');

  // --- 2. Getters: 使用 computed() 定義 ---
  const itemCount = computed(() => items.value.length);

  const isItemInQuote = computed(() => {
    const itemIds = new Set(items.value.map(item => item.unitId));
    return (unitId) => itemIds.has(unitId);
  });

  const getParkingTotalPrice = computed(() => {
    return (unitId) => {
      const item = items.value.find(item => item.unitId === unitId);
      if (!item) return 0;
      return item.selectedParking.reduce((sum, parking) => sum + (parseFloat(parking['車位表價']) || 0), 0);
    }
  });

  // ✨ 注意：在 Setup Store 中，可以直接調用其他的 computed getter
  const getPackagePrice = computed(() => {
    return (unitId) => {
      const item = items.value.find(item => item.unitId === unitId);
      if (!item || !item.usePackageDeal) return 0;
      
      const parkingTotal = getParkingTotalPrice.value(unitId); // ✅ 直接調用
      
      const originalHousePrice = parseFloat(item.unitDetails['房屋總表價']) || 0;
      const packageHousePrice = parseFloat(item.unitDetails['配套房屋總價']) || 0;
      
      return (originalHousePrice + parkingTotal) - packageHousePrice;
    }
  });

  const getFinalTotalPrice = computed(() => {
    return (unitId) => {
      const item = items.value.find(item => item.unitId === unitId);
      if (!item) return 0;
      
      const parkingTotal = getParkingTotalPrice.value(unitId); // ✅ 直接調用
      
      const housePrice = item.usePackageDeal 
        ? (parseFloat(item.unitDetails['配套房屋總價']) || 0)
        : (parseFloat(item.unitDetails['房屋總表價']) || 0);

      return housePrice + parkingTotal;
    }
  });

  // --- 3. Actions: 定義為普通函式 ---
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
    // toast.info('報價單已清空。');  // 根據 SalesControlSystem.vue 的 console.log，這裡可能不需要重複提示
  }

  // --- 4. Return: 將需要暴露出去的 state, getters, actions 返回 ---
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
    clearQuote // ✅ 確保 clearQuote 函式被返回
  };

}, {
  persist: true
});