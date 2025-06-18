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

  // --- Getters ---
  // 使用 computed() 定義計算屬性，等同於 getters
  
  /**
   * (輔助 Getter) 計算指定戶別的車位總價
   */
 const getParkingTotalPrice = computed(() => {
    return (unitId) => {
      const item = items.value.find(i => i.unitId === unitId);
      if (!item) return 0;
      // 兼容舊資料結構：如果 item.selectedParking 不存在，則回傳 0
      if (!item.selectedParking) return 0;
      return item.selectedParking.reduce((sum, p) => sum + (Number(p['車位表價']) || 0), 0);
    };
  });

  /**
   * 計算「最終總價」
   * 根據我們最終確定的邏輯進行計算
   */
 const getFinalTotalPrice = computed(() => {
    return (unitId) => {
      const item = items.value.find(i => i.unitId === unitId);
      if (!item) return 0;
      
      // 自動偵測新舊資料結構
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

  /**
   * 計算「配套價」
   * 這是為了顯示在配套價欄位的數字，根據最終規則計算
   */
 const getPackagePrice = computed(() => {
    return (unitId) => {
      const item = items.value.find(i => i.unitId === unitId);
      if (!item) return 0;
      
      // 自動偵測新舊資料結構
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

  // --- Actions ---
  // 定義為普通函式，等同於 actions
  

// --- ✅✅✅ 偵錯重點 ✅✅✅ ---
  /**
   * 加入一個戶別到報價單
   */
  function addItem(unitData) {
    // 在函式最開頭，印出收到的資料
    console.log("--- DEBUG: 正要加入報價單的資料(unitData) ---");
    console.log(JSON.parse(JSON.stringify(unitData)));
    console.log("------------------------------------------");

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
      unitDetails: unitData, // 我們將 unitData 整個存入 unitDetails
      isFirstTimeBuyer: '否',
      usePackageDeal: false,
      selectedParking: []
    });
    toast.success(`戶別 ${unitData['戶別']} 已成功加入報價單！`);
  }
  // --- ✅✅✅ 偵錯結束 ✅✅✅ ---

  /**
   * 從報價單移除一個項目
   * @param {string} instanceId - 要移除的項目的唯一實例ID
   */
  function removeItem(instanceId) {
    const initialLength = items.value.length;
    items.value = items.value.filter(item => item.instanceId !== instanceId);
    if (items.value.length < initialLength) {
      toast.error(`已從報價單中移除一個項目。`);
    }
  }

  /**
   * 更新指定戶別的欄位
   * @param {string} unitId - 戶別ID
   * @param {string} field - 要更新的欄位名
   * @param {any} value - 新的值
   */
  function updateUnitField(unitId, field, value) {
    const itemsToUpdate = items.value.filter(item => item.unitId === unitId);
    itemsToUpdate.forEach(item => {
      item[field] = value;
    });
  }

  /**
   * 更新指定戶別的車位列表
   */
  function updateParking(unitId, parkingList) {
    const item = items.value.find(item => item.unitId === unitId);
    if (item) {
      item.selectedParking = parkingList;
    }
  }

  /**
   * 清空整個報價單
   */
  function clearQuote() {
    items.value = [];
    personnelName.value = '';
    personnelPhone.value = '';
  }

  // 將所有需要從外部訪問的 state, getters, actions 在此返回
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
  // 開啟持久化儲存
  persist: true
});