import { computeUnitFinance } from './commissionCalculation';
import { defaultPriceSource } from './commissionPlans';

const MONEY_KEYS = ['車位成交總價', '車位底價', '配套價格', '成交總價(含車)', '房屋成交價', '配套底價', '總底價', '房屋底價', '房屋總底價', '請佣總價(含車)', '配套房屋總價', '配套房屋總價(含車)', '溢差價'];

// 匯入先採檔案的歷史數字，缺少成交價才讀銷控；拆價底價不可回填目前房屋底價。
// 歷史金額與目前銷控或彼此加總不一致時僅列警告提醒，不阻擋匯入。
// opts.refund：退佣列。檔案金額若以負值表示則整列取反向，回傳值一律為正向金額，由呼叫端轉為負值寫入。
export function parseImportFinance(row, unit, parkings, plan, opts = {}) {
  const errors = [];
  const warnings = [];
  const present = v => v !== null && v !== undefined && String(v).trim() !== '';
  const fmt = v => Number(v).toLocaleString('en-US', { maximumFractionDigits: 4 });
  const differ = (a, b) => Math.abs(a - b) > 0.0001;
  const raw = k => Number(String(row[k]).replace(/,/g, '').trim());
  const sign = opts.refund && MONEY_KEYS.some(k => present(row[k]) && raw(k) < 0) ? -1 : 1;
  function number(keys, allowNegative = false) {
    const values = keys.filter(k => present(row[k])).map(k => {
      const value = raw(k) * sign;
      if (!Number.isFinite(value) || (!allowNegative && value < 0)) errors.push(`${k}須為有效${allowNegative ? '' : '非負'}數字`);
      return value;
    });
    if (values.some(v => differ(v, values[0]))) warnings.push(`${keys.filter(k => present(row[k])).join('／')}金額不一致，以${keys.find(k => present(row[k]))}為準`);
    return values.length ? values[0] : null;
  }
  const contractType = String(row['合約方式'] || unit.contractType || '').trim();
  const historicalUnit = { ...unit, contractType };
  const original = computeUnitFinance(historicalUnit, parkings);
  const sourceNames = { transaction: 'transaction', splitHouse: 'splitHouse', package: 'package', '原成交總價': 'transaction', '原成交總價（含車位）': 'transaction', '配套房屋總價': 'splitHouse', '配套房屋總價（含車位）': 'splitHouse', '配套價格': 'package' };
  const sourceText = String(row['價格來源'] || '').trim();
  const modernHouse = ['價格來源', '請佣總價(含車)', '配套房屋總價', '配套房屋總價(含車)'].some(k => Object.hasOwn(row, k));
  if (plan.priceBasis === 'house' && ['配套價格', '配套底價'].some(k => Object.hasOwn(row, k))) {
    errors.push('此檔案使用配套欄位，請切換至配套方案匯入');
  }
  if (plan.priceBasis === 'package' && modernHouse && sourceNames[sourceText] !== 'package') {
    errors.push('此檔案使用房屋欄位，請切換至房屋方案匯入');
  }
  const priceSource = sourceText ? sourceNames[sourceText]
    : plan.priceBasis === 'package' ? 'package'
      : modernHouse ? defaultPriceSource(historicalUnit, plan) : 'transaction';
  if (!priceSource || (plan.priceBasis === 'package' ? priceSource !== 'package' : priceSource === 'package')) errors.push('價格來源與目前請佣方案不符');
  const finance = { ...original, priceSource: priceSource || 'transaction', contractType, manualFloorRequired: priceSource === 'package' || priceSource === 'splitHouse' };
  const parkDeal = number(['車位成交總價']);
  const parkFloor = number(['車位底價']);
  // 檔案有填請佣價格時，與目前銷控數值不同僅提醒
  let currentDeal = null;
  if (priceSource === 'package') {
    if ((parkDeal !== null && parkDeal !== 0) || (parkFloor !== null && parkFloor !== 0)) errors.push('配套請佣不可包含車位成交價或底價');
    const deal = number(['配套價格', '成交總價(含車)', '房屋成交價']);
    const floor = number(['配套底價', '總底價', '房屋底價', '房屋總底價']);
    const splitTotal = Number(unit.price_package_deal);
    if (deal === null && (!(splitTotal > 0) || original.dealTotal <= splitTotal)) errors.push('請填寫歷史配套價格，或先確認戶別拆價資料');
    if (floor === null) errors.push('請填寫配套底價（萬）');
    finance.houseDeal = deal ?? (original.dealTotal - splitTotal);
    finance.houseFloor = floor ?? 0;
    finance.parkDeal = 0;
    finance.parkFloor = 0;
    finance.parkingSpots = '';
    finance.dealTotal = finance.houseDeal;
    finance.totalFloor = finance.houseFloor;
    if (deal !== null && splitTotal > 0 && original.dealTotal > splitTotal) currentDeal = original.dealTotal - splitTotal;
  } else {
    const dealKeys = ['請佣總價(含車)', '成交總價(含車)'];
    if (priceSource === 'splitHouse') dealKeys.push('配套房屋總價', '配套房屋總價(含車)');
    const total = number(dealKeys);
    const houseDeal = number(['房屋成交價']);
    const houseFloor = number(['房屋底價', '房屋總底價']);
    const totalFloor = number(['總底價']);
    finance.parkDeal = parkDeal ?? original.parkDeal;
    finance.parkFloor = parkFloor ?? original.parkFloor;
    finance.dealTotal = total ?? (houseDeal !== null ? houseDeal + finance.parkDeal : priceSource === 'splitHouse' ? Number(unit.price_package_deal) : original.houseDeal + finance.parkDeal);
    finance.houseDeal = houseDeal ?? (finance.dealTotal - finance.parkDeal);
    if (priceSource === 'splitHouse' && houseFloor === null && totalFloor === null) errors.push('請填寫歷史房屋底價（萬，不含車位），或總底價');
    finance.houseFloor = houseFloor ?? (totalFloor !== null ? totalFloor - finance.parkFloor : priceSource === 'splitHouse' ? 0 : original.houseFloor);
    finance.totalFloor = totalFloor ?? (finance.houseFloor + finance.parkFloor);
    if (differ(finance.dealTotal, finance.houseDeal + finance.parkDeal)) {
      warnings.push(`請佣總價 ${fmt(finance.dealTotal)} 與房屋成交價＋車位成交價 ${fmt(finance.houseDeal + finance.parkDeal)} 不一致，以請佣總價計算`);
    }
    if (differ(finance.totalFloor, finance.houseFloor + finance.parkFloor)) {
      warnings.push(`總底價 ${fmt(finance.totalFloor)} 與房屋底價＋車位底價 ${fmt(finance.houseFloor + finance.parkFloor)} 不一致，以總底價計算`);
    }
    if (total !== null || houseDeal !== null) currentDeal = priceSource === 'splitHouse' ? Number(unit.price_package_deal) : original.dealTotal;
  }
  if (currentDeal > 0 && differ(finance.dealTotal, currentDeal)) {
    warnings.push(`請佣總價 ${fmt(finance.dealTotal)} 與目前銷控 ${fmt(currentDeal)} 不同，以檔案歷史金額計算`);
  }
  if (!Number.isFinite(finance.dealTotal) || !(finance.dealTotal > 0) || finance.houseDeal < 0) errors.push('請佣價格須大於 0，且不得低於車位成交價');
  if (finance.houseFloor < 0) errors.push('房屋底價不得為負數，請確認總底價與車位底價');
  finance.spread = number(['溢差價'], true) ?? (finance.dealTotal - finance.totalFloor);
  return { ...finance, errors, warnings };
}
