export const LEAD_REPORT_LIFF_ID = '2008257338-FSWtfaEM';

export function leadReportLiffUrl(id) {
  return `https://liff.line.me/${LEAD_REPORT_LIFF_ID}?leadReportId=${encodeURIComponent(id)}`;
}

// URLSearchParams 已解碼一次；不要對整段 state 再 decode，否則名單 ID 內的 & 會變成參數。
export function readLeadReportId(href) {
  const url = new URL(href);
  const candidates = [url.searchParams, new URLSearchParams(url.hash.split('?').slice(1).join('?'))];
  for (const key of ['liff.state', 'liff_path']) {
    const value = url.searchParams.get(key);
    if (value) candidates.push(new URLSearchParams(value.slice(value.indexOf('?') + 1)));
  }
  for (const params of candidates) {
    const id = params.get('leadReportId') || params.get('id');
    if (id && id.length <= 200 && !id.includes('/')) return id;
  }
  return null;
}

export function isLeadLiffLaunch(href) {
  const url = new URL(href);
  const paths = [url.hash, url.searchParams.get('liff_path'), url.searchParams.get('liff.state')];
  return url.searchParams.has('leadReportId') || paths.some(value =>
    value && /(?:^|[/?#])(?:contact(?:[?/#]|$)|lead-distribution-entry(?:[?/#]|$)|leadReportId=)/.test(value));
}

// 舊通知直接連到網站 hash；先轉成正式 LIFF URL，不在一般 LINE WebView 啟動另一輪 OAuth。
export function legacyLeadReportRedirect(href) {
  const url = new URL(href);
  if (!/^#\/contact(?:\?|$)/.test(url.hash)) return null;
  // OAuth / LIFF 回跳必須留給 SDK 處理，不能再次轉出或丟掉授權碼。
  if (['code', 'state', 'error', 'liff.state', 'liff_path', 'liffClientId', 'leadReportId']
    .some(key => url.searchParams.has(key))) return null;
  const id = readLeadReportId(href);
  return id ? leadReportLiffUrl(id) : null;
}

// 只救援本入口的近期登入回跳，不讓過期暫存影響一般首頁或其他 LIFF 功能。
export function pendingLeadReportCallback(href, rawPending, now = Date.now()) {
  const url = new URL(href);
  if ((url.hash && url.hash !== '#/' && url.hash !== '#') ||
      url.searchParams.has('liff_path') || url.searchParams.has('liff.state') ||
      !url.searchParams.has('code') || !url.searchParams.has('state')) return null;
  try {
    const { id, ts } = JSON.parse(rawPending || 'null') || {};
    const age = now - ts;
    return typeof id === 'string' && id.length > 0 && id.length <= 200 && !id.includes('/') &&
      Number.isFinite(ts) && age >= 0 && age < 5 * 60 * 1000 ? id : null;
  } catch { return null; }
}
