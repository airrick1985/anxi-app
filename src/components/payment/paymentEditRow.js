// 修改銷控的繳款列分類：面板與戶別視窗共用
import { isPaidRecord, isPlannedRecord } from '@/utils/paymentRecordStatus';

// 編輯中欄位清空時紀錄不再符合判定條件，用 _kind 固定區塊，避免輸入途中跳區；_kind 儲存前會清除
export function paymentRowKind(record) {
  if (isPaidRecord(record)) return 'paid';
  if (record?._kind) return record._kind;
  return isPlannedRecord(record) ? 'planned' : 'paid';
}
