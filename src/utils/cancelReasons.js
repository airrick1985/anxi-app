/**
 * 退戶原因預設選項（前端共用）
 * 後端 cancelPurchase / updateCancelReason 不做白名單驗證，故可額外接受使用者自行輸入的原因。
 */
export const CANCEL_REASONS = [
  '總價太高',
  '單價太高',
  '自備款不足',
  '貸款成數太少',
  '地點不符',
  '家人反對',
  '家人意外、重病',
  '資金斷鏈',
  '神明指示',
  '風水忌諱',
  '生活機能不足',
  '環境不喜歡',
  '換戶',
  '景氣不好',
  '工期太久',
  '財務規劃暫不買房',
];

/** 自訂原因最大長度 */
export const CUSTOM_REASON_MAX_LENGTH = 50;
