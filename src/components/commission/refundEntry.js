/**
 * 退佣 entry 共用工具（工作台與退佣卡片共用）
 */
import { buildRefundPlan, toNum } from '@/utils/commissionCalculation';

/** 可退回的原紀錄：有效、非退佣、尚未被退佣；bonus＝退獎金（標記欄位 bonusRefundedBy，與退佣各自獨立） */
export function isRefundableRecord(r, bonus = false) {
  return !!r && r.status !== 'voided' && r.type !== 'refund' && !(bonus ? r.bonusRefundedBy : r.refundedBy);
}

/** 依戶別彙整可退回的原紀錄 */
export function refundableRecordsByUnit(records, bonus = false) {
  const map = {};
  (records || []).forEach(r => {
    if (!isRefundableRecord(r, bonus)) return;
    if (!map[r.unitId]) map[r.unitId] = [];
    map[r.unitId].push(r);
  });
  Object.values(map).forEach(list => list.sort((a, b) => toNum(a.period) - toNum(b.period)));
  return map;
}

/** 依退佣 entry 目前的來源勾選／設定／逐人調整計算退佣試算 */
export function buildRefundEntryPlan(entry, bonusRecords) {
  const sel = new Set(entry.selectedIds || []);
  const sources = (entry.candidates || []).filter(r => sel.has(r.id));
  const sourceBonuses = (bonusRecords || []).filter(b => sel.has(b.commissionRecordId) && b.status !== 'voided');
  return buildRefundPlan({
    sources,
    sourceBonuses,
    includeKeep: !!entry.includeKeep,
    refundBonus: entry.refundBonus !== false,
    people: entry.people,
  });
}
