import { liffLinkLayers } from './leadReportLink.js';

const env = import.meta.env || {};

// 頁面內自行登入的 LIFF App。LINE 內開啟時登入憑證放在 #access_token=…，hash 路由會把它當成未知頁並改寫，
// 所以 bootstrap 依網址先以對應 ID 初始化，頁面再用 liffAuth.initializeLiff 共用同一次初始化。
export const LIFF_IDS = {
  viewingReservation: '2008257338-FCbKJ8bB', // 測試 2008257338-6N3jwqxA
  customerManagement: '2008257338-n5Gp6pT3', // 客資系統入口、洽談紀錄、歸屬裁決共用
  customerQuery: '2008257338-G2EJPAda',
  vipLogin: '2008257338-REkEX9xD',
  customerDataSheet: '2008257338-8AWzYeNQ', // 測試 2008257338-6N3jwqxA
  lineBinding: '2008257338-vZNMxJr0',
  appointmentQuery: '2008257338-6N3jwqxA', // 預約查詢已停用；測試用 LIFF（Endpoint 為 trycloudflare），不列入入口路由
  reportFolder: '2008257338-gYnbKlpR', // 測試 2008257338-6N3jwqxA
  inspectionConsole: '2008257338-QV34v0pb', // 測試 2008257338-6N3jwqxA
  inspectionCalendar: env.DEV ? env.VITE_LIFF_ID_DEV : env.VITE_LIFF_ID_PROD,
  form: env.VITE_LIFF_ID_FORM,
};

// 依 LINE Developers 各 LIFF 的 Endpoint（?liff_path=…）；表單 Endpoint 為根目錄，只在登入回跳的 liff.state 出現 /s/…
const LIFF_ROUTES = [
  [/^\/viewing-reservation-entry$/, 'viewingReservation'],
  [/^\/(?:customer-management-entry|(?:customer-log-entry|vip-arbitration-entry)\/[^/]+\/[^/]+)$/, 'customerManagement'],
  [/^\/customer-query-entry$/, 'customerQuery'],
  [/^\/vip-login$/, 'vipLogin'],
  [/^\/customer-data-sheet$/, 'customerDataSheet'],
  [/^\/line-binding$/, 'lineBinding'],
  [/^\/report-folder-manager(?:\/[^/]+)?$/, 'reportFolder'],
  [/^\/inspection-console(?:\/[^/]+)?$/, 'inspectionConsole'],
  [/^\/liffinspection-calendar$/, 'inspectionCalendar'],
  [/^\/s\/[^/]+$/, 'form'],
];

// LIFF 開啟／登入回跳：目標路由放在 ?liff_path= 或 liff.state（可能多層）；回傳 { liffId, route } 或 null
export function findLiffLaunch(href) {
  const { searchParams } = new URL(href);
  if (!searchParams.has('liff_path') && !searchParams.has('liff.state')) return null;
  for (const url of liffLinkLayers(href)) {
    const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : url.pathname;
    const match = LIFF_ROUTES.find(([pattern]) => pattern.test(path));
    const liffId = match && LIFF_IDS[match[1]];
    if (liffId) return { liffId, route: path + url.search };
  }
  return null;
}

// LIFF 初始化後，hash 不是具體路由（LINE 憑證 #access_token=…、空白、根目錄）時改指向目標路由；已在其他頁則回傳 null
export function liffLaunchUrl(href, route) {
  const url = new URL(href);
  const current = url.hash.replace(/^#/, '').split('?')[0];
  if (current.startsWith('/') && current !== '/') return null;
  url.hash = route;
  return url.toString();
}
