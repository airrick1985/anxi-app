import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { isLeadLiffLaunch, readLeadReportId, legacyLeadReportRedirect, pendingLeadReportCallback } from '../../src/utils/leadReportLink.js';
import { findLiffLaunch, liffLaunchUrl, paymentDueLoginRedirectUri, LIFF_IDS } from '../../src/utils/liffApps.js';

// LINE 內開啟賞屋預約：實際 Endpoint + LIFF 放在 hash 的登入憑證（假值）
const inClientLaunch = 'https://anxismart.com/?liff_path=viewing-reservation-entry#access_token=fake&context_token=fake&feature_token=fake&id_token=fake&client_id=2008257338';

// LINE Developers 後台的正式 Endpoint（表單 Endpoint 為根目錄，不列入）
const CONSOLE_ENDPOINTS = [
  ['2008257338-o8grV0ZD', 'https://anxismart.com/?liff_path=liffinspection-calendar'],
  ['2008257338-9pcWLaKD', 'https://anxismart.com/?liff_path=line-ai-entry'],
  ['2008257338-n5Gp6pT3', 'https://anxismart.com/?liff_path=customer-management-entry'],
  ['2008257338-FCbKJ8bB', 'https://anxismart.com/?liff_path=viewing-reservation-entry'],
  ['2008257338-8AWzYeNQ', 'https://anxismart.com/?liff_path=customer-data-sheet'],
  ['2008257338-REkEX9xD', 'https://anxismart.com/?liff_path=vip-login'],
  ['2008257338-G2EJPAda', 'https://anxismart.com/?liff_path=customer-query-entry'],
  ['2008257338-QV34v0pb', 'https://anxismart.com/?liff_path=inspection-console'],
  ['2008257338-gYnbKlpR', 'https://anxismart.com/?liff_path=report-folder-manager'],
  ['2008257338-vZNMxJr0', 'https://anxismart.com/?liff_path=line-binding'],
];

test('後台每個 Endpoint 在 LINE 內開啟（hash 帶憑證）都對到自己的 LIFF ID', () => {
  for (const [liffId, endpoint] of CONSOLE_ENDPOINTS) {
    const href = endpoint + '#access_token=fake&context_token=fake';
    const route = '/' + new URL(endpoint).searchParams.get('liff_path');
    assert.deepEqual(findLiffLaunch(href), { liffId, route }, endpoint);
    assert.equal(isLeadLiffLaunch(href), false, endpoint);
  }
  // 名單管理 Endpoint 由 bootstrap 的名單回報分支處理
  assert.equal(isLeadLiffLaunch('https://anxismart.com/?liff_path=lead-distribution-entry#access_token=fake'), true);
});

test('外部瀏覽器、登入回跳、通知連結帶建案也能對到 LIFF ID 與路由', () => {
  for (const [href, liffId, route] of [
    [inClientLaunch, LIFF_IDS.viewingReservation, '/viewing-reservation-entry'],
    ['https://anxismart.com/?liff_path=/viewing-reservation-entry', LIFF_IDS.viewingReservation, '/viewing-reservation-entry'],
    ['https://anxismart.com/?liff_path=viewing-reservation-entry#/viewing-reservation/p1', LIFF_IDS.viewingReservation, '/viewing-reservation-entry'],
    ['https://anxismart.com/?liff_path=viewing-reservation-entry&liff.state=%23%2Fviewing-reservation-entry&code=c&state=s', LIFF_IDS.viewingReservation, '/viewing-reservation-entry'],
    ['https://anxismart.com/?liff.state=%23%2Fvip-arbitration-entry%2Fp1%2Fd1&code=c&state=s', LIFF_IDS.customerManagement, '/vip-arbitration-entry/p1/d1'],
    // 繳款到期通知 liff.line.me/{ID}?paymentDueProjectId=p1：primary（liff.line.me 實際回傳的編碼）、secondary redirect
    ['https://anxismart.com/?liff_path=customer-management-entry&liff.state=%3FpaymentDueProjectId%3Dp1#access_token=fake&context_token=fake', LIFF_IDS.customerManagement, '/payment-due-entry/p1'],
    ['https://anxismart.com/?liff_path=customer-management-entry&paymentDueProjectId=p1', LIFF_IDS.customerManagement, '/payment-due-entry/p1'],
    ['https://anxismart.com/?liff_path=customer-management-entry&liff.state=%3FpaymentDueProjectId%3Dp%25201', LIFF_IDS.customerManagement, '/payment-due-entry/p%201'],
    ['https://anxismart.com/?liff_path=customer-management-entry&paymentDueProjectId=p%201', LIFF_IDS.customerManagement, '/payment-due-entry/p%201'],
    ['https://anxismart.com/?liff_path=report-folder-manager/p1', LIFF_IDS.reportFolder, '/report-folder-manager/p1'],
    ['https://anxismart.com/?liff_path=inspection-console/p1', LIFF_IDS.inspectionConsole, '/inspection-console/p1'],
  ]) {
    assert.deepEqual(findLiffLaunch(href), { liffId, route }, href);
  }
});

test('非 LIFF 開啟、名單回報、未登記路由不在啟動時載入 SDK', () => {
  for (const href of [
    'https://anxismart.com/#/viewing-reservation-entry',
    'https://anxismart.com/#/customer-log-entry/p1/d1',
    'https://anxismart.com/#/payment-due-entry/p1',
    'https://anxismart.com/?paymentDueProjectId=p1',
    'https://anxismart.com/#/login',
    'https://anxismart.com/?liff_path=contact%3Fid%3Da',
    'https://anxismart.com/?liff.state=%3FleadReportId%3Da',
    'https://anxismart.com/?liff_path=home',
    'https://anxismart.com/?liff_path=customer-data-sheet/p1/d1',
    'https://anxismart.com/?liff_path=appointment-query',
    'https://anxismart.com/#access_token=fake&context_token=fake',
  ]) {
    assert.equal(findLiffLaunch(href), null, href);
  }
});

test('LIFF 初始化後 hash 不是具體路由才改指向目標路由', () => {
  const route = '/viewing-reservation-entry';
  assert.equal(new URL(liffLaunchUrl(inClientLaunch, route)).hash, '#/viewing-reservation-entry');
  for (const hash of ['', '#', '#/', '#/?x=1']) {
    assert.equal(new URL(liffLaunchUrl('https://anxismart.com/?liff_path=viewing-reservation-entry' + hash, route)).hash, '#/viewing-reservation-entry', hash);
  }
  // 保留 Endpoint 的 liff_path，登入回跳網址才符合 LIFF Endpoint 前綴
  assert.equal(new URL(liffLaunchUrl(inClientLaunch, route)).search, '?liff_path=viewing-reservation-entry');
  assert.equal(new URL(liffLaunchUrl('https://anxismart.com/?liff_path=report-folder-manager/p1', '/report-folder-manager/p1')).hash, '#/report-folder-manager/p1');
  assert.equal(liffLaunchUrl('https://anxismart.com/?liff_path=viewing-reservation-entry#/viewing-reservation/p1', route), null);
});

test('共用 LIFF 的 query 連結：secondary redirect 後不會被 App.vue 依 Endpoint 的 liff_path 導走', () => {
  // SDK 依 liff.state 組出的網址（@liff/init decodeState）：Endpoint 路徑＋state query 接在 Endpoint query 後，仍是根目錄
  const secondary = 'https://anxismart.com/?liff_path=customer-management-entry&paymentDueProjectId=p1';
  const launch = findLiffLaunch(secondary);
  assert.deepEqual(launch, { liffId: LIFF_IDS.customerManagement, route: '/payment-due-entry/p1' });

  const url = new URL(liffLaunchUrl(secondary, launch.route));
  assert.equal(url.pathname, '/');
  assert.equal(url.hash, '#/payment-due-entry/p1');
  assert.equal(url.searchParams.get('liff_path'), 'payment-due-entry/p1');

  // 重新整理後網址已改寫，仍對到同一個 LIFF 與入口頁
  assert.deepEqual(findLiffLaunch(url.toString().replace(/#.*$/, '')), { liffId: LIFF_IDS.customerManagement, route: '/payment-due-entry/p1' });
});

test('沒帶繳款到期參數時，共用 LIFF 仍進客資系統入口', () => {
  assert.deepEqual(findLiffLaunch('https://anxismart.com/?liff_path=customer-management-entry'), { liffId: LIFF_IDS.customerManagement, route: '/customer-management-entry' });
});

test('登入回跳網址以 Endpoint 開頭、留在根目錄，回來後對到入口頁', () => {
  const uri = paymentDueLoginRedirectUri('https://anxismart.com', 'p 1');
  assert.ok(uri.startsWith('https://anxismart.com/?liff_path=customer-management-entry'));
  assert.equal(new URL(uri).pathname, '/');
  assert.equal(new URL(uri).searchParams.has('liff.state'), false);
  const route = '/payment-due-entry/p%201';
  assert.deepEqual(findLiffLaunch(`${uri}&code=c&state=s`), { liffId: LIFF_IDS.customerManagement, route });
  // LINE 也可能把回跳網址的 query 包進 liff.state
  const wrapped = new URL('https://anxismart.com/?liff_path=customer-management-entry');
  wrapped.searchParams.set('liff.state', new URL(uri).search.replace('liff_path=customer-management-entry&', ''));
  assert.deepEqual(findLiffLaunch(`${wrapped}&code=c&state=s`), { liffId: LIFF_IDS.customerManagement, route });
});

test('bootstrap 等 LINE 取走 hash 憑證後才改網址並建立主程式', async () => {
  let resolveInit;
  const events = [];
  const source = await readFile(new URL('../../src/bootstrap.js', import.meta.url), 'utf8');
  const location = { href: inClientLaunch };
  const context = vm.createContext({
    isLeadLiffLaunch, readLeadReportId, legacyLeadReportRedirect, pendingLeadReportCallback, LEAD_REPORT_LIFF_ID: 'lead',
    findLiffLaunch, liffLaunchUrl, URL,
    localStorage: { getItem: () => null },
    initializeLiff: id => {
      events.push(`init:${id}:${location.href.includes('#access_token=') ? 'hash 憑證仍在' : 'hash 已被改寫'}`);
      return new Promise(resolve => { resolveInit = resolve; });
    },
    window: { location, history: { replaceState: (_, __, url) => { location.href = url; events.push(new URL(url).hash); } } },
    recordMain: () => events.push('main'),
  });
  vm.runInContext(source.replace(/^import .*;\n/gm, '')
    .replaceAll("const { initializeLiff } = await import('./utils/liffAuth');", '')
    .replace("await import('./main');", 'recordMain();')
    .replace('bootstrap().catch(() => window.__anxiStartup?.fail());', 'globalThis.done = bootstrap();'), context);
  await new Promise(resolve => setImmediate(resolve));
  const init = `init:${LIFF_IDS.viewingReservation}:hash 憑證仍在`;
  assert.deepEqual(events, [init]);
  resolveInit();
  await context.done;
  assert.deepEqual(events, [init, '#/viewing-reservation-entry', 'main']);
});
