import { computeUnitFinance } from './commissionCalculation';

// 無方案欄位的歷史資料一律視為一般請佣。
const DEFAULT_PLANS = [
  { id: 'general', name: '一般請佣', priceBasis: 'house' },
  { id: 'package', name: '配套請佣', priceBasis: 'package' },
];
function planIdOf(row) { return row?.planId || 'general'; }
function isBuiltInPlan(planId) { return DEFAULT_PLANS.some(p => p.id === planId); }
// 內建方案只可改名，價格來源固定；自訂方案依定義文件；同名文件覆寫。
function mergePlans(saved = []) {
  const byId = new Map((saved || []).filter(p => p?.id).map(p => [p.id, p]));
  const builtIn = DEFAULT_PLANS.map(p => ({ ...p, name: String(byId.get(p.id)?.name || '').trim() || p.name }));
  const custom = (saved || []).filter(p => p?.id && !isBuiltInPlan(p.id) && ['house', 'package'].includes(p.priceBasis));
  return [...builtIn, ...custom];
}
function planDocumentId(projectId, planId = 'general') {
  return planId === 'general' ? projectId : `${projectId}__plan__${planId}`;
}
function commissionLedgerId(projectId, unitId, planId = 'general') {
  return `${planDocumentId(projectId, planId)}_${unitId}`;
}
function isNonGeneralContract(unit) {
  return !!String(unit?.contractType || '').trim() && String(unit.contractType).trim() !== '一般合約';
}
function defaultPriceSource(unit, plan) {
  if (plan.priceBasis === 'package') return 'package';
  return isNonGeneralContract(unit) && Number(unit.price_package_deal) > 0 ? 'splitHouse' : 'transaction';
}
// 無前次請佣時的預設底價：拆價為配套房屋總價減車位底價；配套方案不預設。
function defaultManualFloor(unit, parkFloor, priceSource) {
  if (priceSource !== 'splitHouse') return null;
  const packageTotal = Number(unit?.price_package_deal);
  if (!(packageTotal > 0)) return null;
  return Math.max(0, Math.round((packageTotal - Number(parkFloor || 0)) * 10000) / 10000);
}
// 價格單位：萬。配套房屋總價含車位；手填底價只取代房屋／配套底價。
function computePlanFinance(unit, parkings, plan, input = {}) {
  const original = computeUnitFinance(unit, parkings);
  const priceSource = input.priceSource || defaultPriceSource(unit, plan);
  const errors = [];
  const packageTotal = Number(unit.price_package_deal);
  const transactionTotal = original.dealTotal;
  const allowed = plan.priceBasis === 'package' ? ['package']
    : isNonGeneralContract(unit) ? ['transaction', 'splitHouse'] : ['transaction'];
  if (!allowed.includes(priceSource)) errors.push('此方案不適用所選價格來源');
  const manualFloorRequired = priceSource !== 'transaction';
  const manualFloor = input.manualFloor;
  if (manualFloorRequired && ((typeof manualFloor === 'string' && manualFloor.trim() === '') || manualFloor === null || manualFloor === undefined || !Number.isFinite(Number(manualFloor)) || Number(manualFloor) < 0)) {
    errors.push(priceSource === 'package' ? '請填寫有效的配套底價（萬）' : '請填寫有效的房屋底價（萬）');
  }
  const finance = { ...original };
  if (manualFloorRequired) {
    if (!Number.isFinite(packageTotal) || !Number.isFinite(transactionTotal) || !(packageTotal > 0) || packageTotal > transactionTotal || (priceSource === 'splitHouse' && packageTotal < original.parkDeal)) {
      errors.push('配套房屋總價不完整或與成交價、車位金額不符，請先確認戶別價格');
    }
    if (priceSource === 'package') {
      if (!isNonGeneralContract(unit)) errors.push('一般合約無配套價格，請選擇其他戶別');
      finance.houseDeal = transactionTotal - packageTotal;
      finance.parkDeal = 0;
      finance.parkFloor = 0;
      finance.parkingSpots = '';
      if (!(finance.houseDeal > 0)) errors.push('配套價格須大於 0');
    } else {
      finance.houseDeal = packageTotal - original.parkDeal;
    }
    finance.houseFloor = Number.isFinite(Number(manualFloor)) ? Number(manualFloor) : 0;
    finance.dealTotal = finance.houseDeal + finance.parkDeal;
    finance.totalFloor = finance.houseFloor + finance.parkFloor;
    finance.spread = finance.dealTotal - finance.totalFloor;
  }
  return { ...finance, transactionTotal, priceSource, manualFloorRequired, errors };
}

export { DEFAULT_PLANS, planIdOf, isBuiltInPlan, mergePlans, planDocumentId, commissionLedgerId, isNonGeneralContract, defaultPriceSource, defaultManualFloor, computePlanFinance };
