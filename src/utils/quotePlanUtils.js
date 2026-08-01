/**
 * 方案（quotePlans）啟用期間工具
 * 時間一律以台灣時間 (Asia/Taipei) 為準；
 * activeFrom / activeUntil 為 datetime-local 格式字串 "YYYY-MM-DDTHH:mm"，空字串代表不限制。
 */

/** 取得台灣時間當下的 "YYYY-MM-DDTHH:mm" 字串（與 datetime-local 格式一致，可直接字串比較） */
export function taipeiNowString() {
  // sv-SE locale 輸出 "YYYY-MM-DD HH:mm:ss"
  return new Date()
    .toLocaleString('sv-SE', { timeZone: 'Asia/Taipei', hour12: false })
    .slice(0, 16)
    .replace(' ', 'T');
}

/**
 * 判斷方案啟用狀態
 * @returns {'active'|'notStarted'|'ended'} 未設定期間一律視為 active
 */
export function getPlanTimeStatus(plan) {
  const from = String(plan?.activeFrom || '').trim();
  const until = String(plan?.activeUntil || '').trim();
  if (!from && !until) return 'active';
  const now = taipeiNowString();
  if (from && now < from) return 'notStarted';
  if (until && now > until) return 'ended';
  return 'active';
}

export const PLAN_TIME_STATUS_LABEL = {
  active: '啟用中',
  notStarted: '尚未開始',
  ended: '已截止',
};

/** 啟用期間顯示文字；未設定回傳空字串 */
export function formatPlanPeriodText(plan) {
  const fmt = (s) => String(s || '').trim().replace('T', ' ');
  const from = fmt(plan?.activeFrom);
  const until = fmt(plan?.activeUntil);
  if (from && until) return `${from} ～ ${until}`;
  if (from) return `${from} 起`;
  if (until) return `至 ${until}`;
  return '';
}
