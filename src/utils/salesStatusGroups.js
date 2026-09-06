// 銷控狀態分類（前端 ESM 版本）
// functions 端對應檔案：functions/utils/salesStatusGroups.js（請保持一致）

export const DEAL_STATUSES = ['小訂', '補足', '簽約', '成交', '已售', '保留', '售出', '銷控'];
export const RELEASED_STATUSES = ['退戶', '退訂', '解約', '取消', '刪除', '釋出', '退簽約', '退小訂', '退補足'];

export function classifySalesStatus(status) {
  if (!status) return 'neutral';
  if (DEAL_STATUSES.includes(status)) return 'deal';
  if (RELEASED_STATUSES.includes(status)) return 'released';
  return 'neutral';
}

export const STATUS_STYLE = {
  deal:     { color: '#2E7D32', tag: '已售出，請勿重複介紹', emoji: '✅' },
  released: { color: '#C62828', tag: '已釋出，已開放介紹',     emoji: '🔓' },
  neutral:  { color: '#616161', tag: '',                     emoji: 'ℹ️'  },
};

// =================================================================
// 確定度層級（房車比速覽／車位保留辨識用）
// Why: 「保留」只有兩個字，分不出「先卡住看看」和「確定要買只差簽約」。
//      把占用狀態拆成已簽約／已訂未簽／暫時保留三層，車位缺口才能分情境估算。
//      預設依狀態名稱關鍵字判斷；建案可在銷控設定的狀態參數指定 commitmentTier 覆蓋。
// =================================================================
export const COMMITMENT_TIERS = {
  signed:    { key: 'signed',    label: '已簽約',   short: '已簽', color: '#C62828', occupied: true,  sellable: true,  order: 1 },
  booked:    { key: 'booked',    label: '已訂未簽', short: '已訂', color: '#EF6C00', occupied: true,  sellable: true,  order: 2 },
  held:      { key: 'held',      label: '暫時保留', short: '保留', color: '#F9A825', occupied: true,  sellable: true,  order: 3 },
  guest:     { key: 'guest',     label: '非銷售用', short: '來賓', color: '#1565C0', occupied: false, sellable: false, order: 4 },
  released:  { key: 'released',  label: '已釋出',   short: '釋出', color: '#6A1B9A', occupied: false, sellable: true,  order: 5 },
  available: { key: 'available', label: '可售',     short: '可售', color: '#2E7D32', occupied: false, sellable: true,  order: 6 },
};

// 銷控設定可指定的層級（auto = 依狀態名稱自動判斷）
export const COMMITMENT_TIER_OPTIONS = [
  { value: 'auto',     title: '自動判斷（依狀態名稱）' },
  { value: 'signed',   title: '已簽約（確定，不會釋出）' },
  { value: 'booked',   title: '已訂未簽（確定要買，只差簽約）' },
  { value: 'held',     title: '暫時保留（未定，可能釋出）' },
  { value: 'guest',    title: '非銷售用（來賓車位等）' },
  { value: 'released', title: '已釋出（退戶／解約）' },
];

const normalizeStatus = (status) => (status === undefined || status === null ? '' : String(status).trim());
const includesAny = (s, words) => words.some((w) => s.includes(w));

/** 依狀態名稱關鍵字推斷確定度層級 */
export function inferCommitmentTier(status) {
  const s = normalizeStatus(status);
  if (!s) return 'available';
  if (includesAny(s, ['可售', '未售', '待售'])) return 'available';
  // 釋出類要先判斷：「退簽約」「退訂」本身含有簽約／訂字眼
  if (RELEASED_STATUSES.includes(s) || /^退|解約|取消|釋出|刪除/.test(s)) return 'released';
  if (s.includes('來賓')) return 'guest';
  if (includesAny(s, ['簽約', '已售', '成交', '售出'])) return 'signed';
  // 「訂」單字太泛（自訂、訂製…），只認常見的下訂用語
  if (s === '訂' || /(小訂|下訂|已訂|預訂|訂金|訂購|補足)/.test(s)) return 'booked';
  if (includesAny(s, ['保留', '銷控'])) return 'held';
  // 其餘非空的自訂狀態：視為占用但未確定（可在銷控設定指定層級）
  return 'held';
}

/**
 * 取得狀態的確定度層級
 * @param {string} status 後台狀態名稱
 * @param {object} [overrides] 建案指定的覆蓋表 { 狀態名稱: tier }
 */
export function classifyCommitment(status, overrides) {
  const s = normalizeStatus(status);
  if (s && overrides && typeof overrides === 'object') {
    const o = overrides[s];
    if (o && o !== 'auto' && COMMITMENT_TIERS[o]) return o;
  }
  return inferCommitmentTier(s);
}

/** 從銷控狀態參數（salesParameters）組出覆蓋表 */
export function buildCommitmentOverrides(parameters) {
  const map = {};
  (Array.isArray(parameters) ? parameters : []).forEach((p) => {
    const name = normalizeStatus(p && p.statusName);
    const tier = p && p.commitmentTier;
    if (name && tier && tier !== 'auto' && COMMITMENT_TIERS[tier]) map[name] = tier;
  });
  return map;
}

export function isOccupiedTier(tier) {
  return !!(COMMITMENT_TIERS[tier] && COMMITMENT_TIERS[tier].occupied);
}

// =================================================================
// 戶別「成交車位」判定
// Why: 車位後台狀態若是保留／已售／主管保留等「非小訂／補足／簽約」，代表客戶只是準備購買、尚未確定，
//      不能與實際成交車位混在一起計算戶別成交價／底價／單價／佣金，否則會誤判。
//      後台狀態為空視為舊資料（綁定時未同步狀態），仍照舊計入以免既有數字改變。
// =================================================================
export const FORMAL_PARKING_STATUSES = ['小訂', '補足', '簽約'];

/** 後台狀態是否屬於「準備購買」（非空且不是小訂／補足／簽約） */
export function isPreparatoryParkingStatus(status) {
  const s = normalizeStatus(status);
  return !!s && !FORMAL_PARKING_STATUSES.includes(s);
}

/** 車位是否為某戶的「成交車位」（有綁定戶別且不是準備購買狀態） */
export function isDealParking(parking, unitId) {
  if (!parking) return false;
  const bound = parking.buyerUnitId !== undefined && parking.buyerUnitId !== null && String(parking.buyerUnitId).trim() !== '';
  if (!bound) return false;
  if (unitId !== undefined && parking.buyerUnitId !== unitId) return false;
  return !isPreparatoryParkingStatus(parking.status_backend);
}

/** 取某戶的成交車位清單 */
export function getUnitDealParkings(unitId, parkings) {
  if (!unitId) return [];
  return (Array.isArray(parkings) ? parkings : []).filter((p) => isDealParking(p, unitId));
}
