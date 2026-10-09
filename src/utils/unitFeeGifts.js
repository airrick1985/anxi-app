// 戶別「介紹費／贈品」共用工具（銷售資訊編輯、銷控列表、匯出、資料透視、統計、請佣、會辦單共用）
// 資料存於 salesHouseholds：referralFees[] / gifts[]，金額單位為元；附件為 unitDocuments 的 id（存戶別 Drive 資料夾）
// 淨溢差價（萬）＝ 溢差價 − 勾選「併入淨溢差價」的金額 ÷ 10,000；溢差價本身不變

export const FEE_GIFT_KINDS = {
  referral: { key: 'referral', label: '介紹費', field: 'referralFees', icon: 'mdi-account-cash-outline', color: 'deep-orange' },
  gift: { key: 'gift', label: '贈品', field: 'gifts', icon: 'mdi-gift-outline', color: 'pink' },
};

const str = (v) => (v === null || v === undefined ? '' : String(v).trim());
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export function newFeeGiftId(kind) {
  return `${kind === 'gift' ? 'gf' : 'rf'}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function normalizeBase(raw, kind) {
  return {
    id: str(raw.id) || newFeeGiftId(kind),
    amount: num(raw.amount),
    remark: str(raw.remark),
    inNetPremium: raw.inNetPremium === true,
    attachmentIds: Array.isArray(raw.attachmentIds) ? raw.attachmentIds.filter(Boolean).map(String) : [],
    createdAt: raw.createdAt || null,
    createdBy: raw.createdBy || null,
    updatedAt: raw.updatedAt || null,
  };
}

/** 介紹費：{ id, amount, name, phone, address, remark, inNetPremium, attachmentIds } */
export function normalizeReferralFees(list) {
  return (Array.isArray(list) ? list : [])
    .filter(r => r && typeof r === 'object')
    .map(r => ({ ...normalizeBase(r, 'referral'), name: str(r.name), phone: str(r.phone), address: str(r.address) }));
}

/** 贈品：{ id, item, amount, remark, inNetPremium, attachmentIds } */
export function normalizeGifts(list) {
  return (Array.isArray(list) ? list : [])
    .filter(g => g && typeof g === 'object')
    .map(g => ({ ...normalizeBase(g, 'gift'), item: str(g.item) }));
}

/** 單筆顯示名稱：介紹費＝介紹人姓名；贈品＝品項 */
export function feeGiftTitle(entry, kind) {
  const title = kind === 'gift' ? entry?.item : entry?.name;
  return str(title) || FEE_GIFT_KINDS[kind]?.label || '';
}

const uniqueJoin = (values) => [...new Set(values.map(str).filter(Boolean))].join(',');

/** 介紹人姓名／電話同步欄位（多位以逗號分隔） */
export function referrerSyncFields(referralFees) {
  const list = normalizeReferralFees(referralFees);
  return {
    referrerName: uniqueJoin(list.map(r => r.name)),
    referrerPhone: uniqueJoin(list.map(r => r.phone)),
  };
}

/** 勾選併入淨溢差價的金額合計（元） */
export function netPremiumDeductYuan(unit) {
  const all = [...normalizeReferralFees(unit?.referralFees), ...normalizeGifts(unit?.gifts)];
  return all.filter(e => e.inNetPremium).reduce((s, e) => s + e.amount, 0);
}

/** 淨溢差價（萬）：溢差價為空（未成交）時回傳 null */
export function netPriceDiff(priceDiffWan, unit) {
  if (priceDiffWan === null || priceDiffWan === undefined || priceDiffWan === '') return null;
  const diff = Number(priceDiffWan);
  if (!Number.isFinite(diff)) return null;
  return diff - netPremiumDeductYuan(unit) / 10000;
}

/**
 * 戶別加算欄位：介紹費合計、贈品合計（元）、贈品品項、淨溢差價（萬）
 * @param {object} unit - salesHouseholds 原始資料
 * @param {number|null} priceDiffWan - 溢差價（萬）
 */
export function feeGiftFields(unit, priceDiffWan) {
  const fees = normalizeReferralFees(unit?.referralFees);
  const gifts = normalizeGifts(unit?.gifts);
  return {
    referral_fee_total: fees.reduce((s, r) => s + r.amount, 0),
    gift_total: gifts.reduce((s, g) => s + g.amount, 0),
    gift_items: uniqueJoin(gifts.map(g => g.item)),
    net_price_diff: netPriceDiff(priceDiffWan, unit),
  };
}

/** 請佣用：該戶所有介紹費／贈品（依類別排列，附顯示名稱） */
export function listFeeGiftEntries(unit) {
  return [
    ...normalizeReferralFees(unit?.referralFees).map(e => ({ ...e, kind: 'referral', title: feeGiftTitle(e, 'referral') })),
    ...normalizeGifts(unit?.gifts).map(e => ({ ...e, kind: 'gift', title: feeGiftTitle(e, 'gift') })),
  ];
}
