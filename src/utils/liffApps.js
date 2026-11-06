import { liffLinkLayers } from './leadReportLink.js';

const env = import.meta.env || {};

// 頁面內自行登入的 LIFF App。LINE 內開啟時登入憑證放在 #access_token=…，hash 路由會把它當成未知頁並改寫，
// 所以 bootstrap 依網址先以對應 ID 初始化，頁面再用 liffAuth.initializeLiff 共用同一次初始化。
// ID 一律寫在這裡、不放 .env：.env 不進 git，雲端建置讀不到會讓 LIFF 頁面初始化失敗。
export const LIFF_IDS = {
  viewingReservation: '2008257338-FCbKJ8bB', // 測試 2008257338-6N3jwqxA
  customerManagement: '2008257338-n5Gp6pT3', // 客資系統入口、洽談紀錄、歸屬裁決、繳款到期共用
  customerQuery: '2008257338-G2EJPAda',
  vipLogin: '2008257338-REkEX9xD',
  customerDataSheet: '2008257338-8AWzYeNQ', // 測試 2008257338-6N3jwqxA
  lineBinding: '2008257338-vZNMxJr0',
  appointmentQuery: '2008257338-6N3jwqxA', // 預約查詢已停用；測試用 LIFF（Endpoint 為 trycloudflare），不列入入口路由
  reportFolder: '2008257338-gYnbKlpR', // 測試 2008257338-6N3jwqxA
  inspectionConsole: '2008257338-QV34v0pb', // 測試 2008257338-6N3jwqxA
  inspectionCalendar: env.DEV ? '2008257338-6N3jwqxA' : '2008257338-o8grV0ZD', // 本機開發用測試 LIFF
  form: '2008257338-gmEaYQzA',
  lineAi: '2008257338-9pcWLaKD', // Endpoint：https://anxismart.com/?liff_path=line-ai-entry
};

// 依 LINE Developers 各 LIFF 的 Endpoint（?liff_path=…）；表單 Endpoint 為根目錄，只在登入回跳的 liff.state 出現 /s/…
const LIFF_ROUTES = [
  [/^\/viewing-reservation-entry$/, 'viewingReservation'],
  [/^\/(?:customer-management-entry|payment-due-entry\/[^/]+|(?:customer-log-entry|vip-arbitration-entry)\/[^/]+\/[^/]+)$/, 'customerManagement'],
  [/^\/customer-query-entry$/, 'customerQuery'],
  [/^\/vip-login$/, 'vipLogin'],
  [/^\/customer-data-sheet$/, 'customerDataSheet'],
  [/^\/line-binding$/, 'lineBinding'],
  [/^\/report-folder-manager(?:\/[^/]+)?$/, 'reportFolder'],
  [/^\/inspection-console(?:\/[^/]+)?$/, 'inspectionConsole'],
  [/^\/liffinspection-calendar$/, 'inspectionCalendar'],
  [/^\/line-ai-entry$/, 'lineAi'],
  [/^\/s\/[^/]+$/, 'form'],
];

// 繳款到期通知：liff.line.me/{customerManagement}?paymentDueProjectId=…（functions/notifications/paymentDueNotifier.js 產生）。
// 共用 LIFF 只能用 query 分流：liff.line.me/{ID}/路徑 會被 SDK 轉成實體路徑 /路徑，GitHub Pages 沒有 SPA rewrite 會 404。
const PAYMENT_DUE_PARAM = 'paymentDueProjectId';

// LIFF 開啟／登入回跳：目標路由放在 ?liff_path= 或 liff.state（可能多層）；回傳 { liffId, route } 或 null
export function findLiffLaunch(href) {
  const { searchParams } = new URL(href);
  if (!searchParams.has('liff_path') && !searchParams.has('liff.state')) return null;
  const layers = liffLinkLayers(href);
  // 通知帶的目標優先：同一網址的 liff_path 是共用 LIFF 的 Endpoint，不是目的地
  const paymentDueProjectId = layers.map(url => url.searchParams.get(PAYMENT_DUE_PARAM)).find(Boolean);
  if (paymentDueProjectId) {
    return { liffId: LIFF_IDS.customerManagement, route: `/payment-due-entry/${encodeURIComponent(paymentDueProjectId)}` };
  }
  for (const url of layers) {
    const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : url.pathname;
    const match = LIFF_ROUTES.find(([pattern]) => pattern.test(path));
    const liffId = match && LIFF_IDS[match[1]];
    if (liffId) return { liffId, route: path + url.search };
  }
  return null;
}

// 繳款到期入口的 LINE 登入回跳網址：須以 Endpoint 開頭，目標同樣放 query
export function paymentDueLoginRedirectUri(origin, projectId) {
  const url = new URL('/', origin);
  url.searchParams.set('liff_path', 'customer-management-entry');
  url.searchParams.set(PAYMENT_DUE_PARAM, projectId);
  return url.toString();
}

// App.vue 掛載時會依 liff_path 導頁；與目標不同（如共用 LIFF 的 Endpoint）時要改成目標路由，否則會被導回 Endpoint 頁
const normalizeLiffPath = value => String(value || '').split('?')[0].replace(/^\/+|\/+$/g, '');

// LIFF 初始化後，hash 不是具體路由（LINE 憑證 #access_token=…、空白、根目錄）時改指向目標路由；已在其他頁則回傳 null
export function liffLaunchUrl(href, route) {
  const url = new URL(href);
  const current = url.hash.replace(/^#/, '').split('?')[0];
  if (current.startsWith('/') && current !== '/') return null;
  url.hash = route;
  if (url.searchParams.has('liff_path')
    && normalizeLiffPath(url.searchParams.get('liff_path')) !== normalizeLiffPath(route)) {
    url.searchParams.set('liff_path', route.replace(/^\/+/, ''));
  }
  return url.toString();
}
