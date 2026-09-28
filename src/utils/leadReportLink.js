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
