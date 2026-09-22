/**
 * 請佣工作台草稿 → 暫存紀錄
 *
 * 將工作台的 entry／退佣 entry 組成與 functions/commissionClaims.js submitCommissionEntries
 * 寫入 commissionRecords／bonusRecords 相同形狀的物件，讓送出前預覽可直接沿用
 * 匯出中心的 model → grid → HTML 流程（欄位對應請與後端保持一致）。
 */
import { toNum, formatDateTW } from '@/utils/commissionCalculation';

export function normalizeSalesNames(v) {
  if (Array.isArray(v)) return v.map(s => String(s).trim()).filter(Boolean);
  if (typeof v === 'string') return v.split(/[、,，\/\s]+/).map(s => s.trim()).filter(Boolean);
  return [];
}

function bonusRow(base, person) {
  return {
    ...base,
    id: `${base.commissionRecordId}_${person.personKey}`,
    personKey: person.personKey,
    name: person.name,
    role: person.role || '',
    sourceProjectId: person.sourceProjectId || base.projectId,
    sourceProjectName: person.sourceProjectName || '',
    isExternal: !!person.isExternal,
    amounts: person.amounts,
    amountsFull: person.amountsFull,
    subtotal: person.subtotal,
    keepPct: person.keepPct,
    taxPct: person.taxPct,
    nhiPct: person.nhiPct,
    keep: person.keep,
    tax: person.tax,
    nhi: person.nhi,
    net: person.net,
    remark: person.remark || '',
  };
}

/** 請佣 entry → { record, bonusRecords }；result 為 calcUnitBonus 結果 */
export function draftClaimRecord({ entry, result, projectId, planId, plan, createdBy = '' }) {
  const unit = entry.unit || {};
  const finance = entry.finance;
  const recordId = `draft_${entry.id}`;
  const period = Number(entry.period) || 0;
  const record = {
    id: recordId,
    projectId,
    planId,
    unitId: entry.unitId,
    period,
    status: 'active',
    requestDate: entry.requestDate || formatDateTW(new Date()),
    ratioPct: toNum(entry.ratioPct),
    commPct: toNum(entry.commPct),
    keepPct: toNum(entry.keepPct),
    partyAFee: toNum(entry.partyAFee),
    partyBFee: toNum(entry.partyBFee),
    claimBasisMethod: entry.claimBasisMethod || 'lower',
    bonusBasisMethod: entry.bonusBasisMethod || 'deal',
    partyBFeeTiming: entry.partyBFeeTiming || 'before',
    teamSiteKeys: [...(entry.teamSiteKeys || [])],
    note: String(entry.note ?? '').trim().slice(0, 200),
    snapshot: {
      planName: plan.name,
      priceBasis: plan.priceBasis,
      priceSource: finance.priceSource,
      manualFloor: finance.manualFloorRequired ? Number(entry.manualFloor) : null,
      contractType: unit.contractType || '',
      buyerName: unit.buyerName || '',
      salesperson: normalizeSalesNames(unit.salesperson),
      parkingSpots: finance.parkingSpots,
      isPreferredPayment: !!unit.isPreferredPayment,
      contractDate: formatDateTW(unit.payment_contract_date),
      depositDate: formatDateTW(unit.payment_deposit_date),
      salesStatus: unit.salesStatus_backend || '',
      remarks: unit.remarks || '',
      dealTotal: finance.dealTotal,
      totalFloor: finance.totalFloor,
      spread: finance.spread,
      houseDeal: finance.houseDeal,
      parkDeal: finance.parkDeal,
      houseFloor: finance.houseFloor,
      parkFloor: finance.parkFloor,
    },
    calc: {
      feeWan: result.claim.feeWan,
      realSpread: result.claim.realSpread,
      baseWan: result.claim.baseWan,
      realClaim: result.claim.realClaim,
      claimKeep: result.claim.claimKeep,
      thisClaim: result.claim.thisClaim,
      base: result.claim.base,
      discount: result.claim.discount,
      dealAfter: result.claim.dealAfter,
    },
    categories: entry.categories || {},
    handover: {
      total: toNum(result.handoverTotal),
      totalFull: toNum(result.handoverTotalFull),
      byCat: result.handover || {},
    },
    planName: plan.name,
    source: 'draft',
    createdBy,
  };
  const base = {
    projectId, planId, unitId: entry.unitId, period, status: 'active',
    commissionRecordId: recordId, requestDate: record.requestDate, planName: plan.name, source: 'draft', createdBy,
  };
  return { record, bonusRecords: result.people.map(p => bonusRow(base, p)) };
}

/** 退佣 entry → { record, bonusRecords }；refundPlan 為 buildRefundEntryPlan 結果 */
export function draftRefundRecord({ entry, refundPlan, projectId, planId, plan, createdBy = '' }) {
  const recordId = `draft_${entry.id}`;
  const period = Number(entry.period) || 0;
  const requestDate = entry.requestDate || formatDateTW(new Date());
  const record = {
    id: recordId,
    projectId,
    planId,
    unitId: entry.unitId,
    period,
    type: 'refund',
    status: 'active',
    requestDate,
    reason: String(entry.reason || ''),
    includeKeep: !!entry.includeKeep,
    refundBonus: entry.refundBonus !== false,
    ratioPct: -toNum(refundPlan.refundRatioPct),
    refundRatioPct: toNum(refundPlan.refundRatioPct),
    commPct: refundPlan.commPct,
    keepPct: refundPlan.keepPct,
    partyAFee: 0,
    partyBFee: 0,
    teamSiteKeys: [],
    sourceRecordIds: [...(entry.selectedIds || [])],
    sources: refundPlan.sources,
    snapshot: refundPlan.snapshot,
    calc: refundPlan.calc,
    categories: {},
    handover: refundPlan.handover,
    planName: plan.name,
    source: 'draft',
    createdBy,
  };
  const base = {
    projectId, planId, unitId: entry.unitId, period, type: 'refund', status: 'active',
    commissionRecordId: recordId, requestDate, planName: plan.name, source: 'draft', createdBy,
  };
  return {
    record,
    bonusRecords: refundPlan.people.map(p => ({ ...bonusRow(base, p), adjusted: !!p.adjusted })),
  };
}
