// 修改銷控的持有車位與成交總價（銷售表單、戶別視窗共用）
// 戶別文件的 price_transaction_total 與「持有車位」都可能過時，畫面計算一律以編輯中的成交價與車位為準
import { getUnitDealParkings } from './salesStatusGroups.js';

// 暫存清單（父層進入編輯時已依 salesParkings 初始化，選車位也寫回這裡）優先；沒有才從 salesParkings 過濾
// 準備購買（保留等）的車位不屬於本戶成交車位，不列入（避免儲存時被改成戶別狀態）
export function resolveOwnedParkingSpots(unit, allParkings) {
  const staged = unit?.['持有車位'];
  if (Array.isArray(staged)) {
    return staged.map(p => ({
      ...p,
      spotId: p.spotId || p['車位編號'], // 確保 Key 相容
      price_transaction: p.price_transaction || p['車位成交價'],
    }));
  }
  if (!allParkings || !unit?.unitId) return [];
  return getUnitDealParkings(unit.unitId, allParkings, unit.salesStatus_backend);
}

export function parkingSaleTotal(spots) {
  return (spots || []).reduce((sum, p) => sum + (Number(p.price_transaction) || 0), 0);
}

// 成交總價（萬）＝房屋成交價＋持有車位成交價
export function dealTotalWan(unit, spots) {
  return (Number(unit?.price_transaction_house) || 0) + parkingSaleTotal(spots);
}
