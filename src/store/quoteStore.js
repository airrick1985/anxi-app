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

  // Getters (維持不變)
  const getParkingTotalPrice = computed(() => { /* ... */ });
  const getFinalTotalPrice = computed(() => { /* ... */ });
  const getPackagePrice = computed(() => { /* ... */ });
  const itemCount = computed(() => items.value.length);
  const isItemInQuote = computed(() => {
    const itemIds = new Set(items.value.map(item => item.unitId));
    return (unitId) => itemIds.has(unitId);
  });

  // --- ✅ Actions 修改處 ---
 function addItem(unitData) {
    if (items.value.length >= maxItems.value) {
      toast.warning(`報價單已滿，最多只能加入 ${maxItems.value} 戶！`);
      return;
    }

    // ✨ 新增：恢復對「已售」狀態的檢查
    if (unitData['銷控狀態'] === '已售') {
      toast.error(`戶別 ${unitData['戶別']} 為「已售」狀態，不可加入報價。`);
      return;
    }

    // 允許重複加入，並為每個項目實例產生唯一的ID
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

  // 修改 removeItem，使其通過唯一的 instanceId 來刪除
  function removeItem(instanceId) { // ✨ 參數從 unitId 改為 instanceId
    const initialLength = items.value.length;
    items.value = items.value.filter(item => item.instanceId !== instanceId); // ✨ 使用 instanceId 進行過濾
    if (items.value.length < initialLength) {
      toast.error(`已從報價單中移除一個項目。`);
    }
  }

  function updateUnitField(unitId, field, value) {
    // 注意：此函式現在會更新所有相同 unitId 的項目。
    // 如果需要只更新單一實例，則需要傳入 instanceId。目前維持原樣。
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