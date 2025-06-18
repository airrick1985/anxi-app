// /src/store/quoteStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useToast } from 'vue-toastification';

const toast = useToast();

export const useQuoteStore = defineStore('quote', () => {
  const items = ref([]);
  const maxItems = ref(5);
  const personnelName = ref('');
  const personnelPhone = ref('');

  const getParkingTotalPrice = computed(() => {
    return (unitId) => {
      const item = items.value.find(i => i.unitId === unitId);
      if (!item || !item.selectedParking) return 0;
      return item.selectedParking.reduce((sum, p) => sum + (Number(p['車位表價']) || 0), 0);
    };
  });

  const getFinalTotalPrice = computed(() => {
    return (unitId) => {
      const item = items.value.find(i => i.unitId === unitId);
      if (!item) return 0;
      
      const details = item.unitDetails || item; 

      if (item.usePackageDeal) {
        return parseFloat(details['配套房屋總價']) || 0;
      } else {
        const originalHousePrice = parseFloat(details['房屋總表價']) || 0;
        const parkingTotal = getParkingTotalPrice.value(unitId);
        return originalHousePrice + parkingTotal;
      }
    };
  });

  const getPackagePrice = computed(() => {
    return (unitId) => {
      const item = items.value.find(i => i.unitId === unitId);
      if (!item) return 0;
      
      const details = item.unitDetails || item;

      if (item.usePackageDeal) {
        const originalHousePrice = parseFloat(details['房屋總表價']) || 0;
        const parkingTotal = getParkingTotalPrice.value(unitId);
        const packageHousePrice = parseFloat(details['配套房屋總價']) || 0;
        return (originalHousePrice + parkingTotal) - packageHousePrice;
      } else {
        return 0;
      }
    };
  });

  const itemCount = computed(() => items.value.length);
  const isItemInQuote = computed(() => {
    const itemIds = new Set(items.value.map(item => item.unitId));
    return (unitId) => itemIds.has(unitId);
  });

  function addItem(unitData) {
    if (items.value.length >= maxItems.value) {
      toast.warning(`報價單已滿，最多只能加入 ${maxItems.value} 戶！`);
      return;
    }
    if (unitData['銷控狀態'] === '已售') {
      toast.error(`戶別 ${unitData['戶別']} 為「已售」狀態，不可加入報價。`);
      return;
    }
    items.value.push({
      instanceId: crypto.randomUUID(),
      unitId: unitData['戶別'],
      unitDetails: unitData,
      isFirstTimeBuyer: '否',
      usePackageDeal: false,
      selectedParking: []
    });
    toast.success(`戶別 ${unitData['戶別']} 已成功加入報價單！`);
  }

  function removeItem(instanceId) {
    const initialLength = items.value.length;
    items.value = items.value.filter(item => item.instanceId !== instanceId);
    if (items.value.length < initialLength) {
      toast.error(`已從報價單中移除一個項目。`);
    }
  }

  function updateUnitField(unitId, field, value) {
    const itemsToUpdate = items.value.filter(item => item.unitId === unitId);
    itemsToUpdate.forEach(item => {
      item[field] = value;
    });
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
  }

  return {
    items, maxItems, personnelName, personnelPhone,
    itemCount, isItemInQuote, getParkingTotalPrice, getPackagePrice, getFinalTotalPrice,
    addItem, removeItem, updateUnitField, updateParking, clearQuote
  };
}, {
  persist: true
});