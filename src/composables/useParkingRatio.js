// 房車比速覽：戶別與車位的去化狀況、剩餘房車比與車位缺口計算
// Why: 車位數量有限，若車位賣得比房屋快，之後成交的戶別會沒車位可選。
//      這裡把「剩餘可售戶 × 每戶預期配車數 − 剩餘可售車位」算成缺口，供工具列徽章、速覽面板共用。
//      去化依確定度拆成「已簽約／已訂未簽／暫時保留」；暫時保留（含戶別與車位）隨時可能釋出，
//      因此房車比一律把保留視為未售（算進剩餘可售），另提供「若保留全部成交」的悲觀情境供參考。
// 資料來源：salesDataStore 已載入的 households / parkings，純前端即時計算，不寫回 Firestore。
import { computed, unref } from 'vue';
import { classifyCommitment, COMMITMENT_TIERS, buildCommitmentOverrides } from '@/utils/salesStatusGroups';

export const DEFAULT_PARKING_PER_UNIT = 1;
// 車位保留到期日預設天數
export const DEFAULT_RESERVATION_DAYS = 7;

const hasText = (v) => v !== undefined && v !== null && String(v).trim() !== '';

// =================================================================
// 日期工具（一律以台灣時區的「日」為單位）
// =================================================================
const pad2 = (n) => String(n).padStart(2, '0');

/** 台灣時區的今天，格式 YYYY-MM-DD */
export function todayKey() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });
}

/**
 * 任意日期值 → YYYY-MM-DD；接受 Date、Firestore Timestamp、'YYYY-MM-DD'、'YYYY/MM/DD'
 * 無法解析時回傳空字串
 */
export function toDateKey(value) {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value === 'string') {
    const m = value.trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (m) return `${m[1]}-${pad2(m[2])}-${pad2(m[3])}`;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });
  }
  let d = value;
  if (typeof value.toDate === 'function') d = value.toDate();
  else if (typeof value.seconds === 'number') d = new Date(value.seconds * 1000);
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });
}

/** 從某日往後加 N 天（回傳 YYYY-MM-DD） */
export function addDaysKey(days, fromKey) {
  const base = fromKey || todayKey();
  const [y, m, d] = base.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + (Number(days) || 0)));
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

/** 兩個 YYYY-MM-DD 的天數差：toKey − fromKey */
export function diffDays(fromKey, toKey) {
  const parse = (k) => {
    const [y, m, d] = String(k).split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((parse(toKey) - parse(fromKey)) / 86400000);
}

// =================================================================
// 狀態判斷
// =================================================================

/** 後台狀態是否代表「已占用」（已簽約／已訂未簽／暫時保留） */
export function isOccupiedStatus(status, overrides) {
  const tier = classifyCommitment(status, overrides);
  return !!(COMMITMENT_TIERS[tier] && COMMITMENT_TIERS[tier].occupied);
}

/** 戶別是否為店面（與銷控頁「住家／店面」切換的判斷一致） */
export const isStoreHousehold = (h) => h?.layout === '店面';

/**
 * 車位的確定度層級
 * 狀態空白或釋出、但已綁定購買戶別時，跟著該戶的狀態走；查不到戶別則視為已訂未簽
 */
export function resolveParkingTier(p, overrides, householdTierByUnit) {
  const tier = classifyCommitment(p?.status_backend, overrides);
  if (COMMITMENT_TIERS[tier].occupied || tier === 'guest') return tier;
  if (hasText(p?.buyerUnitId)) {
    const ht = householdTierByUnit?.get(String(p.buyerUnitId).trim());
    return ht && COMMITMENT_TIERS[ht].occupied ? ht : 'booked';
  }
  return tier;
}

/** 車位是否已占用（相容舊呼叫；不看戶別狀態） */
export function isParkingOccupied(p, overrides) {
  const tier = resolveParkingTier(p, overrides, null);
  return !!COMMITMENT_TIERS[tier]?.occupied;
}

/**
 * 組出保留車位的清單項目（保留人／到期日／已保留天數／是否逾期）
 * @param {object} p 車位文件
 * @param {string} tier 確定度層級
 * @param {string} today YYYY-MM-DD
 */
export function buildHeldEntry(p, tier, today) {
  const reservedUntil = toDateKey(p?.reservedUntil);
  const reservedAt = toDateKey(p?.reservedAt) || toDateKey(p?.updatedAt);
  const daysHeld = reservedAt ? Math.max(0, diffDays(reservedAt, today)) : null;
  const overdueDays = reservedUntil ? diffDays(reservedUntil, today) : null;
  const overdue = overdueDays !== null && overdueDays > 0;
  return {
    id: p?.id || p?.docId || null,
    spotId: p?.spotId || p?.number || '',
    floor: p?.floor || '',
    type2: p?.type2 || p?.type || '',
    status: p?.status_backend || '',
    tier,
    reservedBy: p?.reservedBy || '',
    reservedUntil,
    reservedNote: p?.reservedNote || '',
    buyerUnitId: p?.buyerUnitId || '',
    buyerName: p?.buyerName || '',
    salesperson: p?.salesperson,
    reservedAt,
    daysHeld,
    hasDeadline: !!reservedUntil,
    overdue,
    daysOverdue: overdue ? overdueDays : 0,
  };
}

function ratioOf(numerator, denominator) {
  const n = Number(numerator) || 0;
  const d = Number(denominator) || 0;
  if (d <= 0) return null;
  return n / d;
}

/**
 * 依門檻判定警示等級
 * - danger：缺口 > 0（剩餘車位不夠剩餘戶配置）
 * - warn：沒缺口但餘裕很少（少於需求的 10% 或少於 3 個）
 * - ok：其餘
 * - none：沒有戶別或車位資料，無法判斷
 */
function resolveLevel({ remainingHouseholds, remainingParkings, required, gap, hasData }) {
  if (!hasData) return 'none';
  if (remainingHouseholds <= 0) return 'ok';
  if (gap > 0) return 'danger';
  const surplus = remainingParkings - required;
  if (surplus < Math.max(3, Math.ceil(required * 0.1))) return 'warn';
  return 'ok';
}

const emptyTierCount = () => ({ signed: 0, booked: 0, held: 0 });
// 房車比只把「已簽約／已訂未簽」當已去化；暫時保留視為未售
const RATIO_OCCUPIED_TIERS = new Set(['signed', 'booked']);
export const isRatioOccupiedTier = (tier) => RATIO_OCCUPIED_TIERS.has(tier);

/**
 * 計算房車比統計
 * @param {Array} households 戶別陣列（salesHouseholds）
 * @param {Array} parkings 車位陣列（salesParkings）
 * @param {object} options
 * @param {boolean} options.includeStore 是否把店面納入戶別計算（預設納入；明確給 false 才排除）
 * @param {number} options.parkingPerUnit 每戶預期配車數（預設 1）
 * @param {Array} options.parameters 銷控狀態參數（含 commitmentTier 覆蓋）
 * @param {object} options.tierOverrides 直接給覆蓋表（優先於 parameters）
 * @param {string} options.today 以哪一天計算逾期（YYYY-MM-DD，預設台灣今天）
 */
export function computeParkingRatio(households, parkings, options = {}) {
  const includeStore = options.includeStore !== false;
  const parkingPerUnit = Math.max(0, Number(options.parkingPerUnit) || 0) || DEFAULT_PARKING_PER_UNIT;
  const overrides = options.tierOverrides || buildCommitmentOverrides(options.parameters);
  const today = options.today || todayKey();

  const allHouseholds = Array.isArray(households) ? households.filter(Boolean) : [];
  const allParkings = Array.isArray(parkings) ? parkings.filter(Boolean) : [];

  // 戶別層級 + 戶別 → 層級對照（車位狀態空白時沿用）
  const householdTierByUnit = new Map();
  allHouseholds.forEach((h) => {
    const tier = classifyCommitment(h.salesStatus_backend, overrides);
    householdTierByUnit.set(String(h.unitId ?? '').trim(), tier);
  });

  // 車位 → 購買戶別 對照
  const parkingsByUnit = new Map();
  allParkings.forEach((p) => {
    if (!hasText(p.buyerUnitId)) return;
    const key = String(p.buyerUnitId).trim();
    if (!parkingsByUnit.has(key)) parkingsByUnit.set(key, []);
    parkingsByUnit.get(key).push(p);
  });

  const buildHouseholdStats = (list) => {
    const stats = {
      total: list.length, occupied: 0, remaining: 0,
      occupiedWithParking: 0, occupiedWithoutParking: 0, linkedParkings: 0,
      byTier: emptyTierCount(),
    };
    list.forEach((h) => {
      const tier = householdTierByUnit.get(String(h.unitId ?? '').trim()) || 'available';
      // 暫時保留：視為未售（計入剩餘），但另記筆數供面板顯示
      if (tier === 'held') stats.byTier.held += 1;
      if (!isRatioOccupiedTier(tier)) { stats.remaining += 1; return; }
      stats.occupied += 1;
      stats.byTier[tier] += 1;
      const linked = parkingsByUnit.get(String(h.unitId ?? '').trim()) || [];
      if (linked.length > 0) {
        stats.occupiedWithParking += 1;
        stats.linkedParkings += linked.length;
      } else {
        stats.occupiedWithoutParking += 1;
      }
    });
    return stats;
  };

  const homeList = allHouseholds.filter((h) => !isStoreHousehold(h));
  const storeList = allHouseholds.filter((h) => isStoreHousehold(h));
  const byPropertyType = {
    住家: buildHouseholdStats(homeList),
    店面: buildHouseholdStats(storeList),
  };
  const householdStats = buildHouseholdStats(includeStore ? allHouseholds : homeList);

  // 車位統計：來賓車位等非銷售用不計入總數；已去化依層級拆解，暫時保留視為未售（計入剩餘）
  const parkingStats = {
    total: 0, occupied: 0, remaining: 0, standalone: 0, nonSale: 0,
    byTier: emptyTierCount(),
    heldList: [], overdueCount: 0, noDeadlineCount: 0,
  };
  const typeMap = new Map();
  allParkings.forEach((p) => {
    const tier = resolveParkingTier(p, overrides, householdTierByUnit);
    if (tier === 'guest') { parkingStats.nonSale += 1; return; }
    parkingStats.total += 1;
    const occupied = isRatioOccupiedTier(tier);
    if (tier === 'held') {
      parkingStats.byTier.held += 1;
      const entry = buildHeldEntry(p, tier, today);
      parkingStats.heldList.push(entry);
      if (entry.overdue) parkingStats.overdueCount += 1;
      if (!entry.hasDeadline) parkingStats.noDeadlineCount += 1;
    }
    if (occupied) {
      parkingStats.occupied += 1;
      parkingStats.byTier[tier] += 1;
      if (!hasText(p.buyerUnitId)) parkingStats.standalone += 1;
    } else {
      parkingStats.remaining += 1;
    }
    const label = hasText(p.type2) ? String(p.type2).trim() : (hasText(p.type) ? String(p.type).trim() : '未分類');
    if (!typeMap.has(label)) typeMap.set(label, { label, total: 0, occupied: 0, remaining: 0, held: 0 });
    const t = typeMap.get(label);
    t.total += 1;
    if (tier === 'held') t.held += 1;
    if (occupied) t.occupied += 1; else t.remaining += 1;
  });
  // 保留清單：逾期在前，其次到期日近的在前，未設到期日最後
  parkingStats.heldList.sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    if (a.hasDeadline !== b.hasDeadline) return a.hasDeadline ? -1 : 1;
    if (a.reservedUntil !== b.reservedUntil) return a.reservedUntil < b.reservedUntil ? -1 : 1;
    return String(a.spotId).localeCompare(String(b.spotId), 'zh-Hant', { numeric: true });
  });
  const byParkingType = Array.from(typeMap.values()).sort((a, b) =>
    String(a.label).localeCompare(String(b.label), 'zh-Hant', { numeric: true, sensitivity: 'base' })
  );

  const required = householdStats.remaining * parkingPerUnit;
  // 預設：暫時保留視為未售 → 可用 = 剩餘可售（已含保留車位）
  const gap = required - parkingStats.remaining;
  // 悲觀情境：保留戶與保留車位全部成交 → 需求扣掉保留戶、可用扣掉保留車位
  const heldParkings = parkingStats.byTier.held;
  const heldHouseholds = householdStats.byTier.held;
  const requiredIfHeldSold = Math.max(0, householdStats.remaining - heldHouseholds) * parkingPerUnit;
  const availableIfHeldSold = Math.max(0, parkingStats.remaining - heldParkings);
  const gapIfHeldSold = requiredIfHeldSold - availableIfHeldSold;
  const hasData = allHouseholds.length > 0 || allParkings.length > 0;
  const level = resolveLevel({
    remainingHouseholds: householdStats.remaining,
    remainingParkings: parkingStats.remaining,
    required,
    gap,
    hasData,
  });

  // 全案概況（不受住家／店面開關影響）：常駐顯示用
  const overview = {
    households: allHouseholds.length,
    home: homeList.length,
    store: storeList.length,
    // 已售戶數：已簽約＋已訂未簽（暫時保留不算），不受店面開關影響
    householdsSold: byPropertyType.住家.occupied + byPropertyType.店面.occupied,
    homeSold: byPropertyType.住家.occupied,
    storeSold: byPropertyType.店面.occupied,
    householdsHeld: byPropertyType.住家.byTier.held + byPropertyType.店面.byTier.held,
    parkings: allParkings.length,
    parkingsSellable: parkingStats.total,
    parkingsNonSale: parkingStats.nonSale,
    // 已售車位：已簽約＋已訂未簽（暫時保留不算）
    parkingsSold: parkingStats.occupied,
    parkingsHeld: parkingStats.byTier.held,
  };

  return {
    includeStore,
    parkingPerUnit,
    today,
    overview,
    households: householdStats,
    parkings: parkingStats,
    byPropertyType,
    byParkingType,
    ratio: {
      // 整體房車比：全部可售用車位 ÷ 納入計算的戶別
      overall: ratioOf(parkingStats.total, householdStats.total),
      // 剩餘房車比：剩餘可售車位 ÷ 剩餘可售戶
      remaining: ratioOf(parkingStats.remaining, householdStats.remaining),
      // 已去化戶平均配車：已去化戶綁定的車位數 ÷ 已去化戶數
      avgPerOccupiedUnit: ratioOf(householdStats.linkedParkings, householdStats.occupied),
    },
    required,
    gap,
    surplus: -gap,
    scenarios: {
      // 目前計算：保留視為未售
      heldReleased: { available: parkingStats.remaining, required, gap },
      // 悲觀情境：保留戶與保留車位全部成交
      heldSold: { available: availableIfHeldSold, required: requiredIfHeldSold, gap: gapIfHeldSold },
    },
    level,
  };
}

/**
 * Vue composable：回傳響應式的房車比統計
 * @param {Ref<Array>|Array} households
 * @param {Ref<Array>|Array} parkings
 * @param {Ref<object>|object} options { includeStore, parkingPerUnit, parameters, tierOverrides }
 */
export function useParkingRatio(households, parkings, options = {}) {
  const stats = computed(() => computeParkingRatio(unref(households), unref(parkings), unref(options) || {}));
  const level = computed(() => stats.value.level);
  // 工具列徽章用的極簡文字：「車位剩 12／戶剩 30」
  const badgeText = computed(() => {
    const s = stats.value;
    if (s.level === 'none') return '';
    return `車位剩 ${s.parkings.remaining}／戶剩 ${s.households.remaining}`;
  });
  // 一句人話結論
  const summaryText = computed(() => {
    const s = stats.value;
    if (s.level === 'none') return '尚無戶別或車位資料';
    const heldNote = s.parkings.byTier.held > 0
      ? `；其中暫時保留 ${s.parkings.byTier.held} 個視為未售${s.parkings.overdueCount > 0 ? `（${s.parkings.overdueCount} 個已逾期）` : ''}`
      : '';
    if (s.households.remaining <= 0) {
      return `戶別已全數去化，剩餘可售車位 ${s.parkings.remaining} 個${heldNote}`;
    }
    const base = `剩餘可售 ${s.households.remaining} 戶、可售車位 ${s.parkings.remaining} 個，每戶配 ${s.parkingPerUnit} 車需 ${s.required} 個`;
    if (s.gap > 0) return `${base}，尚缺 ${s.gap} 個車位${heldNote}`;
    if (s.level === 'warn') return `${base}，僅餘裕 ${s.surplus} 個，車位吃緊${heldNote}`;
    return `${base}，餘裕 ${s.surplus} 個${heldNote}`;
  });
  // 常駐的全案概況文字：「全案 120 戶（住家 100／店面 20）・車位 150」
  const overviewText = computed(() => {
    const o = stats.value.overview;
    if (!o || (o.households === 0 && o.parkings === 0)) return '';
    return `全案 ${o.households} 戶（住家 ${o.home}／店面 ${o.store}，已售 ${o.householdsSold}）・車位 ${o.parkings}（已售 ${o.parkingsSold}）`;
  });
  return { stats, level, badgeText, summaryText, overviewText };
}

export const PARKING_RATIO_LEVEL_META = {
  danger: { color: 'error', icon: 'mdi-car-off', label: '車位不足' },
  warn: { color: 'warning', icon: 'mdi-car-clock', label: '車位吃緊' },
  ok: { color: 'success', icon: 'mdi-car-multiple', label: '車位充足' },
  none: { color: 'grey', icon: 'mdi-car-multiple', label: '無資料' },
};
