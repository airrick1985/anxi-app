// 銷控狀態分類（functions CJS 版本）
// 前端對應檔案：src/utils/salesStatusGroups.js（請保持一致）

const DEAL_STATUSES = ['小訂', '補足', '簽約', '成交', '已售', '保留', '售出', '銷控'];
const RELEASED_STATUSES = ['退戶', '退訂', '解約', '取消', '刪除', '釋出', '退簽約', '退小訂', '退補足'];

function classifySalesStatus(status) {
  if (!status) return 'neutral';
  if (DEAL_STATUSES.includes(status)) return 'deal';
  if (RELEASED_STATUSES.includes(status)) return 'released';
  return 'neutral';
}

const STATUS_STYLE = {
  deal:     { color: '#2E7D32', tag: '已售出，請勿重複介紹', emoji: '🈲' },
  released: { color: '#C62828', tag: '已釋出，可開放介紹',     emoji: '✅' },
  neutral:  { color: '#616161', tag: '',                     emoji: 'ℹ️'  },
};

// =================================================================
// 確定度層級（房車比速覽／車位保留辨識用），與前端規則相同
// =================================================================
const COMMITMENT_TIERS = {
  signed:    { key: 'signed',    label: '已簽約',   short: '已簽', color: '#C62828', occupied: true,  sellable: true,  order: 1 },
  booked:    { key: 'booked',    label: '已訂未簽', short: '已訂', color: '#EF6C00', occupied: true,  sellable: true,  order: 2 },
  held:      { key: 'held',      label: '暫時保留', short: '保留', color: '#F9A825', occupied: true,  sellable: true,  order: 3 },
  guest:     { key: 'guest',     label: '非銷售用', short: '來賓', color: '#1565C0', occupied: false, sellable: false, order: 4 },
  released:  { key: 'released',  label: '已釋出',   short: '釋出', color: '#6A1B9A', occupied: false, sellable: true,  order: 5 },
  available: { key: 'available', label: '可售',     short: '可售', color: '#2E7D32', occupied: false, sellable: true,  order: 6 },
};

const normalizeStatus = (status) => (status === undefined || status === null ? '' : String(status).trim());
const includesAny = (s, words) => words.some((w) => s.includes(w));

function inferCommitmentTier(status) {
  const s = normalizeStatus(status);
  if (!s) return 'available';
  if (includesAny(s, ['可售', '未售', '待售'])) return 'available';
  if (RELEASED_STATUSES.includes(s) || /^退|解約|取消|釋出|刪除/.test(s)) return 'released';
  if (s.includes('來賓')) return 'guest';
  if (includesAny(s, ['簽約', '已售', '成交', '售出'])) return 'signed';
  // 「訂」單字太泛（自訂、訂製…），只認常見的下訂用語
  if (s === '訂' || /(小訂|下訂|已訂|預訂|訂金|訂購|補足)/.test(s)) return 'booked';
  if (includesAny(s, ['保留', '銷控'])) return 'held';
  return 'held';
}

function classifyCommitment(status, overrides) {
  const s = normalizeStatus(status);
  if (s && overrides && typeof overrides === 'object') {
    const o = overrides[s];
    if (o && o !== 'auto' && COMMITMENT_TIERS[o]) return o;
  }
  return inferCommitmentTier(s);
}

function buildCommitmentOverrides(parameters) {
  const map = {};
  (Array.isArray(parameters) ? parameters : []).forEach((p) => {
    const name = normalizeStatus(p && p.statusName);
    const tier = p && p.commitmentTier;
    if (name && tier && tier !== 'auto' && COMMITMENT_TIERS[tier]) map[name] = tier;
  });
  return map;
}

function isOccupiedTier(tier) {
  return !!(COMMITMENT_TIERS[tier] && COMMITMENT_TIERS[tier].occupied);
}

// 戶別「成交車位」判定（與前端規則相同）：後台狀態非小訂／補足／簽約 = 準備購買，不計入戶別金額
const FORMAL_PARKING_STATUSES = ['小訂', '補足', '簽約'];

function isPreparatoryParkingStatus(status) {
  const s = normalizeStatus(status);
  return !!s && !FORMAL_PARKING_STATUSES.includes(s);
}

function isDealParking(parking, unitId) {
  if (!parking) return false;
  const bound = parking.buyerUnitId !== undefined && parking.buyerUnitId !== null && String(parking.buyerUnitId).trim() !== '';
  if (!bound) return false;
  if (unitId !== undefined && parking.buyerUnitId !== unitId) return false;
  return !isPreparatoryParkingStatus(parking.status_backend);
}

function getUnitDealParkings(unitId, parkings) {
  if (!unitId) return [];
  return (Array.isArray(parkings) ? parkings : []).filter((p) => isDealParking(p, unitId));
}

module.exports = {
  DEAL_STATUSES,
  RELEASED_STATUSES,
  classifySalesStatus,
  STATUS_STYLE,
  COMMITMENT_TIERS,
  inferCommitmentTier,
  classifyCommitment,
  buildCommitmentOverrides,
  isOccupiedTier,
  FORMAL_PARKING_STATUSES,
  isPreparatoryParkingStatus,
  isDealParking,
  getUnitDealParkings,
};
