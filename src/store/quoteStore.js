import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useToast } from 'vue-toastification';

const toast = useToast();

// ✅ [重構] 議價狀態只保存「調整參數」，議價後價格一律由表價推導（規格 docs/SPEC_QuoteFloorPriceApproval.md §1.3 A0）
// activeMode: '' | 'perTsubo' | 'directAmount' | 'totalPrice' | 'both'
export const EMPTY_NEGOTIATION_STATE = Object.freeze({
  activeMode: '',
  perTsuboValue: '',
  directAmountValue: '',
  totalPriceValue: ''
});

// ✅ [新增] 列印前底價守門：通知主管後的紀錄（規格 §6.4）
export const EMPTY_FLOOR_APPROVAL = Object.freeze({
  signature: '',
  requestId: '',
  notifiedAt: '',
  supervisors: []
});

const hasVal = v => v !== '' && v !== null && v !== undefined && !Number.isNaN(Number(v));

/** 依調整參數推導 activeMode（舊資料或缺 activeMode 時使用） */
export function deriveNegotiationMode(state) {
  if (!state) return '';
  if (hasVal(state.totalPriceValue)) return 'totalPrice';
  const per = hasVal(state.perTsuboValue);
  const dir = hasVal(state.directAmountValue);
  if (per && dir) return 'both';
  if (dir) return 'directAmount';
  if (per) return 'perTsubo';
  return '';
}

/**
 * 依表價、坪數與議價參數計算議價後房屋總價（純函式，供 store getter 與元件預覽共用）
 * @param {number} listPrice 房屋總表價（萬）
 * @param {number} area 房屋坪數
 * @param {object} state negotiationState
 */
export function applyNegotiation(listPrice, area, state) {
  const base = Number(listPrice) || 0;
  const mode = state?.activeMode || deriveNegotiationMode(state);
  if (!mode) return base;
  if (mode === 'totalPrice') return Math.round(Number(state.totalPriceValue) || 0);
  const perAdj = hasVal(state.perTsuboValue) ? Math.round((Number(state.perTsuboValue) || 0) * (Number(area) || 0)) : 0;
  const dirAdj = hasVal(state.directAmountValue) ? Math.round(Number(state.directAmountValue) || 0) : 0;
  return Math.round(base + perAdj + dirAdj);
}

// ✅ [公用電腦防殘留] 報價單閒置逾時（毫秒）：超過此時間沒有任何操作即自動清空
export const QUOTE_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVITY_TOUCH_THROTTLE_MS = 10 * 1000;
const IDLE_CHECK_INTERVAL_MS = 60 * 1000;

export const useQuoteStore = defineStore('quote', () => {
  const items = ref([]);
  const personnelName = ref('');
  const personnelPhone = ref('');
  // ✅ [公用電腦防殘留] 報價單持有者（登入者 key）與最後操作時間
  const ownerKey = ref('');
  const lastActiveAt = ref(0);

  // 舊版 persist 走 localStorage（key = 'quote'），改為 sessionStorage 後把殘留的舊資料清掉
  try { localStorage.removeItem('quote'); } catch (_) { /* 無視 */ }

  const findItem = internalId => items.value.find(i => i.internalId === internalId);

  // --- 基礎 Getters ---
  const getParkingTotalPrice = computed(() => {
    return (internalId) => {
      const item = findItem(internalId);
      if (!item) return 0;
      return (item.selectedParking || []).reduce((sum, p) => sum + (Number(p.price_list) || 0), 0);
    };
  });

  // ✅ [新增] 房屋總表價：unitDetails 為伺服器快照，唯讀，永遠是表價
  const getListHousePrice = computed(() => {
    return (internalId) => {
      const item = findItem(internalId);
      if (!item) return 0;
      return Number(item.unitDetails?.price_list_house_total) || 0;
    };
  });

  // ✅ [新增] 是否有議價調整
  const hasNegotiation = computed(() => {
    return (internalId) => {
      const item = findItem(internalId);
      if (!item) return false;
      return !!(item.negotiationState?.activeMode || deriveNegotiationMode(item.negotiationState));
    };
  });

  // ✅ [新增] 議價後房屋總價（由表價＋議價參數推導；表價更新後自動重算）
  const getNegotiatedHousePrice = computed(() => {
    return (internalId) => {
      const item = findItem(internalId);
      if (!item) return 0;
      return applyNegotiation(
        item.unitDetails?.price_list_house_total,
        item.unitDetails?.area_house_ping,
        item.negotiationState
      );
    };
  });

  // ✅ [新增] 議價差額 = 議價後 − 表價
  const getNegotiationDelta = computed(() => {
    return (internalId) => {
      if (!hasNegotiation.value(internalId)) return 0;
      return getNegotiatedHousePrice.value(internalId) - getListHousePrice.value(internalId);
    };
  });

  const getFinalTotalPrice = computed(() => {
    return (internalId) => {
      const item = findItem(internalId);
      if (!item) return 0;
      if (item.usePackageDeal) {
        // 使用配套價格作為最終總價
        return Number(item.unitDetails.price_package_deal) || 0;
      }
      return getNegotiatedHousePrice.value(internalId) + getParkingTotalPrice.value(internalId);
    };
  });

  // 配套金額 = (議價後房屋總價 ＋ 車位表價合計) − 配套價
  // 配套模式下總價固定為配套價（走一般期款），議價折讓以「表價」為基準計算，並自配套金額（走配套期款）扣除
  const getPackagePrice = computed(() => {
    return (internalId) => {
      const item = findItem(internalId);
      if (!item || !item.usePackageDeal) return 0;
      const originalPrice = getNegotiatedHousePrice.value(internalId) + getParkingTotalPrice.value(internalId);
      const packagePrice = Number(item.unitDetails.price_package_deal) || 0;
      return originalPrice - packagePrice;
    };
  });

  // ✅ [新增] 買方實付總價 = 議價後房屋總價 ＋ 車位表價合計
  // 非配套：即總價；配套：配套價（一般期款）＋ 配套金額（配套期款）。底價核對／主管通知以此為準。
  const getPayableTotalPrice = computed(() => {
    return (internalId) => {
      const item = findItem(internalId);
      if (!item) return 0;
      return getNegotiatedHousePrice.value(internalId) + getParkingTotalPrice.value(internalId);
    };
  });

  // ✅ [新增] 未議價的配套金額（表價合計 − 配套價），供議價視窗／列印顯示「原配套金額」
  const getListPackagePrice = computed(() => {
    return (internalId) => {
      const item = findItem(internalId);
      if (!item || !item.usePackageDeal) return 0;
      const originalPrice = getListHousePrice.value(internalId) + getParkingTotalPrice.value(internalId);
      const packagePrice = Number(item.unitDetails.price_package_deal) || 0;
      return originalPrice - packagePrice;
    };
  });

  const getRawDisplayHousePrice = computed(() => {
    return (internalId) => {
      const item = findItem(internalId);
      if (!item) return 0;
      if (item.usePackageDeal) {
        // 配套模式下的房屋價格 = 配套總價 - 車位價格
        const packageTotal = Number(item.unitDetails.price_package_deal) || 0;
        return packageTotal - getParkingTotalPrice.value(internalId);
      }
      return getNegotiatedHousePrice.value(internalId);
    };
  });

  // ✅ [新增] 露臺價格（表價）：僅在該戶確有露臺坪數時才視為有效
  // 配套模式下總價由配套價取代，無法對應原始露臺表價，故不拆分
  const getTerraceListPrice = computed(() => {
    return (internalId) => {
      const item = findItem(internalId);
      if (!item || item.usePackageDeal) return 0;
      const terraceArea = Number(item.unitDetails.area_terrace_ping) || 0;
      if (terraceArea <= 0) return 0;
      return Number(item.unitDetails.price_list_terrace) || 0;
    };
  });

  // ✅ [新增] 是否需拆分房屋/露臺單價
  const hasTerraceSplit = computed(() => {
    return (internalId) => getTerraceListPrice.value(internalId) > 0;
  });

  // ✅ [修正] 房屋單價：露臺價不計入分子（露臺坪本就不計入房屋總面積），
  // 否則露臺戶的房屋單價會被灌水。無露臺者結果與原本相同。
  const getDisplayUnitPrice = computed(() => {
    return (internalId) => {
      const item = findItem(internalId);
      if (!item) return 0;
      const area = Number(item.unitDetails.area_house_ping);
      if (!area) return 0;
      const housePrice = getRawDisplayHousePrice.value(internalId);
      const terracePrice = getTerraceListPrice.value(internalId);
      return ((housePrice - terracePrice) / area);
    };
  });

  // ✅ [新增] 露臺單價 = 露臺價 / 露臺坪數
  const getTerraceUnitPrice = computed(() => {
    return (internalId) => {
      const item = findItem(internalId);
      if (!item) return 0;
      const terraceArea = Number(item.unitDetails.area_terrace_ping) || 0;
      if (terraceArea <= 0) return 0;
      return getTerraceListPrice.value(internalId) / terraceArea;
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
    touchActivity(true);

    items.value.push({
      internalId: uniqueId,
      unitId: unitData['戶別'],
      unitDetails: unitData,
      isFirstTimeBuyer: '是', // 預設選「首購」
      usePackageDeal: false,
      selectedParking: [],
      // ★★★ 1. 新增：初始化 packageItems 屬性 ★★★
      packageItems: {},
      // ✅ [打勾] 新增：初始化期款計算結果
      calculatedPayments: [],
      // ✅ [新增] 初始化「套用期款時的說明」（來自所套用的期款範本 applyNote）
      appliedPaymentNotes: [],
      // ✅ [新增] 手動指定總價期款範本：category/templateId 皆為 null = 自動（依條件判斷）
      manualTemplate: { category: null, templateId: null },
      // ✅ [新增] 手動指定配套期款範本：類別固定為「配套期款」，templateId 為 null = 自動（依條件判斷）
      manualPackageTemplate: { category: null, templateId: null },
      // ✅ [新增] 列印報價單(含期款)用資料：{ general, preferred, package, notes }，由 QuoteItem 同步
      printPaymentData: null,
      // ✅ [重構] 議價調整參數（議價後價格由表價推導，unitDetails 不再被改寫）
      negotiationState: { ...EMPTY_NEGOTIATION_STATE },
      // ✅ [新增] 已套用方案快照（方案編輯器功能）：
      // [{ planId, planName, note, hasNegotiation, hasPayment, selectedPaymentTemplateId, negotiation }]
      appliedPlans: [],
      // ✅ [新增] 公司借貸：使用者於報價當下臨時調整的參數（不回存範本）
      // { templateId, annualRate, years, periods } | null = 使用範本預設
      companyLoanOverride: null,
      // ✅ [新增] 公司借貸參數快照（由 QuoteItem 同步；含臨時調整後生效值）
      companyLoan: null,
      // ✅ [新增] 列印前底價守門：通知主管紀錄
      floorApproval: { ...EMPTY_FLOOR_APPROVAL }
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
    const item = findItem(internalId);
    if (item) {
      item[field] = value;
    }
  }

  function updateParking(internalId, newParking) {
    const item = findItem(internalId);
    if (item) {
      item.selectedParking = newParking;
    }
  }

  // ✅ [新增] 將車位套用至多個報價項目（報價設定「套用車位至其他戶別」）
  // spots: 車位物件陣列（可為來源戶別勾選的子集合）
  // mode: 'replace' 覆蓋既有車位 | 'merge' 加入（依車位編號去重、保留原有）
  function applyParkingToItems(spots, targetInternalIds, mode = 'replace') {
    const keyOf = p => String(p?.spotId || p?.['車位編號'] || '');
    const targets = new Set(targetInternalIds);
    for (const item of items.value) {
      if (!targets.has(item.internalId)) continue;
      const copied = JSON.parse(JSON.stringify(spots));   // 各戶各自持有副本，避免共用參照
      if (mode === 'merge') {
        const existingKeys = new Set((item.selectedParking || []).map(keyOf));
        item.selectedParking = [
          ...(item.selectedParking || []),
          ...copied.filter(p => !existingKeys.has(keyOf(p))),
        ];
      } else {
        item.selectedParking = copied;
      }
    }
  }

  // ✅ [新增] 批次清除多個報價項目的車位
  function clearParkingForItems(targetInternalIds) {
    const targets = new Set(targetInternalIds);
    for (const item of items.value) {
      if (targets.has(item.internalId)) item.selectedParking = [];
    }
  }

  // ✅ [重構] 更新議價調整參數（僅保存參數，價格由 getter 推導；忽略舊欄位 originalPrice）
  function updateNegotiationState(internalId, negotiationState) {
    const item = findItem(internalId);
    if (item) {
      const { originalPrice: _ignored, ...rest } = negotiationState || {};
      const merged = { ...EMPTY_NEGOTIATION_STATE, ...(item.negotiationState || {}), ...rest };
      delete merged.originalPrice;
      if (!merged.activeMode) merged.activeMode = deriveNegotiationMode(merged);
      item.negotiationState = merged;
    }
  }

  // ✅ [重構] 重置議價調整：清除參數即恢復表價（unitDetails 未被改寫，無需還原）
  function resetNegotiationPrice(internalId) {
    const item = findItem(internalId);
    if (item) {
      item.negotiationState = { ...EMPTY_NEGOTIATION_STATE };
    }
  }

  // ✅ [重構] 清空所有議價調整（切換建案時呼叫）
  function clearAllNegotiations() {
    items.value.forEach(item => {
      item.negotiationState = { ...EMPTY_NEGOTIATION_STATE };
    });
  }

  // ★★★ 2. 新增：更新配套價子項目的 action ★★★
  function updateItemPackageItems(internalId, newPackageItems) {
    const item = findItem(internalId);
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
    const item = findItem(internalId);
    if (item) {
      // 我們儲存簡化後的陣列，只包含名稱和值
      item.calculatedPayments = paymentsArray.map(p => ({
        name: p.name,
        value: p.value,
        percentage: p.percentage // 新增
      }));
    }
  }

  // ✅ [新增] 儲存「套用期款時的說明」（來自所套用期款範本的 applyNote），供列印報價單渲染
  function updateItemPaymentNotes(internalId, notes) {
    const item = findItem(internalId);
    if (item) {
      item.appliedPaymentNotes = Array.isArray(notes)
        ? notes.map(n => String(n || '').trim()).filter(Boolean)
        : [];
    }
  }

  // ✅ [新增] 更新手動指定的總價期款範本（category / templateId）
  // payload 可只帶其一，例如 { category } 或 { templateId }；傳 null 代表還原自動
  function updateItemManualTemplate(internalId, payload) {
    const item = findItem(internalId);
    if (item) {
      const current = item.manualTemplate || { category: null, templateId: null };
      item.manualTemplate = { ...current, ...payload };
    }
  }

  // ✅ [新增] 儲存列印報價單(含期款)用資料（由 QuoteItem 計算後同步）
  function updateItemPrintPaymentData(internalId, data) {
    const item = findItem(internalId);
    if (item) {
      item.printPaymentData = data;
    }
  }

  // ✅ [新增] 公司借貸：更新報價當下的臨時調整參數（傳 null = 還原範本預設）
  function updateItemCompanyLoanOverride(internalId, payload) {
    const item = findItem(internalId);
    if (item) {
      item.companyLoanOverride = payload;
    }
  }

  // ✅ [新增] 公司借貸：儲存參數快照（由 QuoteItem 同步；無附掛時為 null）
  function updateItemCompanyLoan(internalId, snapshot) {
    const item = findItem(internalId);
    if (item) {
      item.companyLoan = snapshot;
    }
  }

  // ✅ [新增] 更新手動指定的配套期款範本（category / templateId）
  // payload 可只帶其一，例如 { category } 或 { templateId }；傳 null 代表還原自動
  function updateItemManualPackageTemplate(internalId, payload) {
    const item = findItem(internalId);
    if (item) {
      const current = item.manualPackageTemplate || { category: null, templateId: null };
      item.manualPackageTemplate = { ...current, ...payload };
    }
  }

  // ✅ [新增] 更新已套用方案快照（方案編輯器功能）
  // plans 為完整快照陣列；舊資料（persist 還原）無此欄位時也能安全寫入
  function updateItemAppliedPlans(internalId, plans) {
    const item = findItem(internalId);
    if (item) {
      item.appliedPlans = Array.isArray(plans) ? plans : [];
    }
  }

  // ✅ [新增] 列印前底價守門：記錄通知主管結果
  function setFloorApproval(internalId, payload) {
    const item = findItem(internalId);
    if (item) {
      item.floorApproval = { ...EMPTY_FLOOR_APPROVAL, ...(payload || {}) };
    }
  }

  // ✅ [新增] 清除底價守門紀錄（未給 internalId 時清除全部）
  function clearFloorApproval(internalId = null) {
    items.value.forEach(item => {
      if (internalId === null || item.internalId === internalId) {
        item.floorApproval = { ...EMPTY_FLOOR_APPROVAL };
      }
    });
  }

  // ✅ [新增] 進入報價頁時正規化：將所有戶別（含 persist 還原的舊資料）首購狀態一律重設為「是」（首購）
  function resetAllToFirstTimeBuyer() {
    items.value.forEach(item => {
      item.isFirstTimeBuyer = '是';
    });
  }

  // ✅ [新增] 正規化 persist 還原的舊資料：補齊缺欄位，並將舊版「改寫表價」的議價資料遷移為推導模式
  // - 舊版 negotiationState.originalPrice != null → 表價還原為 originalPrice（議價後價格由參數重新推導）
  function normalizeItems() {
    items.value.forEach(item => {
      if (!item.unitDetails || typeof item.unitDetails !== 'object') item.unitDetails = {};
      if (!Array.isArray(item.selectedParking)) item.selectedParking = [];
      if (!item.packageItems || typeof item.packageItems !== 'object') item.packageItems = {};
      if (!Array.isArray(item.calculatedPayments)) item.calculatedPayments = [];
      if (!Array.isArray(item.appliedPaymentNotes)) item.appliedPaymentNotes = [];
      if (!item.manualTemplate) item.manualTemplate = { category: null, templateId: null };
      if (!item.manualPackageTemplate) item.manualPackageTemplate = { category: null, templateId: null };
      if (item.printPaymentData === undefined) item.printPaymentData = null;
      if (!Array.isArray(item.appliedPlans)) item.appliedPlans = [];
      if (item.companyLoanOverride === undefined) item.companyLoanOverride = null;
      if (item.companyLoan === undefined) item.companyLoan = null;
      if (!item.floorApproval || typeof item.floorApproval !== 'object') item.floorApproval = { ...EMPTY_FLOOR_APPROVAL };

      const legacy = item.negotiationState || {};
      const migrated = {
        activeMode: legacy.activeMode || '',
        perTsuboValue: legacy.perTsuboValue ?? '',
        directAmountValue: legacy.directAmountValue ?? '',
        totalPriceValue: legacy.totalPriceValue ?? ''
      };
      if (legacy.originalPrice !== null && legacy.originalPrice !== undefined && Number.isFinite(Number(legacy.originalPrice))) {
        // 舊版：price_list_house_total 已被改寫為議價後價格，還原為表價
        item.unitDetails.price_list_house_total = Number(legacy.originalPrice);
      }
      if (!migrated.activeMode) migrated.activeMode = deriveNegotiationMode(migrated);
      if (!migrated.activeMode) {
        migrated.perTsuboValue = '';
        migrated.directAmountValue = '';
        migrated.totalPriceValue = '';
      }
      item.negotiationState = migrated;
    });
  }

  function clearQuote() {
    items.value = [];
    personnelName.value = '';
    personnelPhone.value = '';
    ownerKey.value = '';
    lastActiveAt.value = 0;
  }

  // ✅ [公用電腦防殘留] 記錄最後操作時間（預設 10 秒節流，避免每次滑鼠／鍵盤事件都寫 storage）
  let lastTouchWrite = 0;
  function touchActivity(force = false) {
    const now = Date.now();
    if (!force && now - lastTouchWrite < ACTIVITY_TOUCH_THROTTLE_MS) return;
    lastTouchWrite = now;
    lastActiveAt.value = now;
  }

  function isIdleExpired(now = Date.now()) {
    return items.value.length > 0 && lastActiveAt.value > 0 && now - lastActiveAt.value > QUOTE_IDLE_TIMEOUT_MS;
  }

  // ✅ [公用電腦防殘留] 確認報價單屬於目前登入者且未閒置逾時，否則清空
  // 回傳 '' | 'owner' | 'idle'（清空原因）
  function ensureFreshForUser(userKey) {
    const key = userKey ? String(userKey) : '';
    if (items.value.length === 0) {
      ownerKey.value = key;
      return '';
    }
    if (ownerKey.value && key && ownerKey.value !== key) {
      clearQuote();
      ownerKey.value = key;
      return 'owner';
    }
    if (isIdleExpired()) {
      clearQuote();
      ownerKey.value = key;
      toast.info(`報價單閒置超過 ${Math.round(QUOTE_IDLE_TIMEOUT_MS / 60000)} 分鐘，已自動清空`);
      return 'idle';
    }
    if (!ownerKey.value && key) ownerKey.value = key;
    if (!lastActiveAt.value) touchActivity(true);
    return '';
  }

  // 使用者有任何點擊／按鍵就視為活動；每分鐘檢查一次是否閒置逾時（頁面停在報價設定也會即時清空）
  if (typeof window !== 'undefined') {
    const onActivity = () => { if (items.value.length > 0) touchActivity(); };
    window.addEventListener('pointerdown', onActivity, { passive: true });
    window.addEventListener('keydown', onActivity, { passive: true });
    setInterval(() => {
      if (isIdleExpired()) {
        clearQuote();
        toast.info(`報價單閒置超過 ${Math.round(QUOTE_IDLE_TIMEOUT_MS / 60000)} 分鐘，已自動清空`);
      }
    }, IDLE_CHECK_INTERVAL_MS);
  }

  return {
    items,
    personnelName,
    personnelPhone,
    ownerKey,
    lastActiveAt,
    itemCount,
    isItemInQuote,
    getParkingTotalPrice,
    getListHousePrice,
    hasNegotiation,
    getNegotiatedHousePrice,
    getNegotiationDelta,
    getPackagePrice,
    getListPackagePrice,
    getPayableTotalPrice,
    getFinalTotalPrice,
    getRawDisplayHousePrice,
    getDisplayUnitPrice,
    getTerraceListPrice,
    getTerraceUnitPrice,
    hasTerraceSplit,
    addItem,
    removeItem,
    updateUnitField,
    updateParking,
    applyParkingToItems,
    clearParkingForItems,
    updateNegotiationState,
    resetNegotiationPrice,
    clearAllNegotiations,
    updateItemPackageItems,
    updateItemCalculatedPayments,
    updateItemPaymentNotes,
    updateItemManualTemplate,
    updateItemManualPackageTemplate,
    updateItemPrintPaymentData,
    updateItemCompanyLoanOverride,
    updateItemCompanyLoan,
    updateItemAppliedPlans,
    setFloorApproval,
    clearFloorApproval,
    normalizeItems,
    resetAllToFirstTimeBuyer,
    clearQuote,
    touchActivity,
    ensureFreshForUser
  };
}, {
  // ✅ [公用電腦防殘留] 改用 sessionStorage：關閉分頁即消失，重新整理仍保留
  persist: {
    key: 'quote',
    storage: sessionStorage
  }
});
