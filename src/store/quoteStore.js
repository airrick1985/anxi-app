import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useToast } from 'vue-toastification';

const toast = useToast();

export const useQuoteStore = defineStore('quote', () => {
  // --- State ---
  // 報價項目、最大數量、業務員姓名和電話
  const items = ref([]);
  const maxItems = ref(5);
  const personnelName = ref('');
  const personnelPhone = ref('');

  // --- Getters ---
  // ✅ 修改：所有 Getter 都改用 internalId 來查找項目
  const getParkingTotalPrice = computed(() => {
    return (internalId) => {
      const item = items.value.find(i => i.internalId === internalId);
      if (!item) return 0;
      return item.selectedParking.reduce((sum, parking) => sum + (parseFloat(parking['車位表價']) || 0), 0);
    }
  });

  const getFinalTotalPrice = computed(() => {
    return (internalId) => {
      const item = items.value.find(i => i.internalId === internalId);
      if (!item) return 0;
      if (item.usePackageDeal) {
        return parseFloat(item.unitDetails['配套房屋總價']) || 0;
      } else {
        const originalHousePrice = parseFloat(item.unitDetails['房屋總表價']) || 0;
        const parkingTotal = getParkingTotalPrice.value(internalId);
        return originalHousePrice + parkingTotal;
      }
    };
  });

  const getPackagePrice = computed(() => {
    return (internalId) => {
      const item = items.value.find(i => i.internalId === internalId);
      if (!item) return 0;
      if (item.usePackageDeal) {
        const originalHousePrice = parseFloat(item.unitDetails['房屋總表價']) || 0;
        const parkingTotal = getParkingTotalPrice.value(internalId);
        const packageHousePrice = parseFloat(item.unitDetails['配套房屋總價']) || 0;
        return (originalHousePrice + parkingTotal) - packageHousePrice;
      } else {
        return 0;
      }
    };
  });
  
  const itemCount = computed(() => items.value.length);
  
  // isItemInQuote 邏輯不變，因為它只檢查戶別名稱是否存在，用於初始加入前的判斷
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

    const salesStatus = unitData['銷控狀態'] || '';
    const backendStatus = unitData['銷控後台狀態'] || '';

    if (salesStatus === '已售' || backendStatus === '已售') {
      toast.error(`戶別 ${unitData['戶別']} 為「已售」狀態，不可加入報價。`);
      return;
    }

    // ✅ 核心修改：為每個項目建立唯一的 internalId
    const uniqueId = `${unitData['戶別']}-${Date.now()}`;

    items.value.push({
      internalId: uniqueId, // 唯一識別碼
      unitId: unitData['戶別'], // 戶別名稱，供顯示使用
      unitDetails: unitData,
      isFirstTimeBuyer: '否',
      usePackageDeal: false,
      selectedParking: []
    });
    toast.success(`戶別 ${unitData['戶別']} 已成功加入報價單！`);
  }

  // ✅ 修改：改用 internalId 來移除項目
  function removeItem(internalId) {
    const index = items.value.findIndex(item => item.internalId === internalId);
    if (index !== -1) {
      items.value.splice(index, 1);
      toast.info('已從報價單移除');
    }
  }

  // ✅ 修改：改用 internalId 來更新欄位
  function updateUnitField(internalId, field, value) {
    const item = items.value.find(i => i.internalId === internalId);
    if (item) {
      item[field] = value;
    }
  }
  
  // ✅ 修改：改用 internalId 來更新車位
  function updateParking(internalId, newParking) {
    const item = items.value.find(i => i.internalId === internalId);
    if (item) {
      item.selectedParking = newParking;
    }
  }

  function clearQuote() {
    items.value = [];
    personnelName.value = '';
    personnelPhone.value = '';
    toast.info('報價單已清空');
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