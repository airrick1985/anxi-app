export const LEAD_REPORT_LIFF_ID = '2008257338-FSWtfaEM';

export function leadReportLiffUrl(id) {
  return `https://liff.line.me/${LEAD_REPORT_LIFF_ID}?leadReportId=${encodeURIComponent(id)}`;
}

// 逐層解析已解碼的參數值，不能一次 decode 整段網址：ID 裡的 & / % 必須保留。
export function liffLinkLayers(href) {
  const origin = new URL(href).origin;
  const queue = [href];
  const seen = new Set();
  const layers = [];
  while (queue.length && layers.length < 16) {
    const value = queue.shift();
    if (seen.has(value)) continue;
    seen.add(value);
    let url;
    try { url = new URL(value.replace(/^#/, ''), origin + '/'); } catch { continue; }
    if (url.origin !== origin) continue;
    layers.push(url);
    if (url.hash.startsWith('#/')) queue.push(url.hash);
    for (const key of ['liff.state', 'liff_path', 'liffRedirectUri']) {
      const nested = url.searchParams.get(key);
      if (nested) queue.push(nested);
    }
  }
  return layers;
}

export function readLeadReportId(href) {
  for (const url of liffLinkLayers(href)) {
    const id = url.searchParams.get('leadReportId') || url.searchParams.get('id');
    if (id && id.length <= 200 && !id.includes('/')) return id;
  }
  return null;
}

export function isLeadLiffLaunch(href) {
  return liffLinkLayers(href).some(url => url.searchParams.has('leadReportId') ||
    /^\/(?:contact|lead-distribution-entry)\/?$/.test(url.pathname));
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
