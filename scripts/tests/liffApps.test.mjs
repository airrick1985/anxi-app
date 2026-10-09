import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { isLeadLiffLaunch, readLeadReportId, legacyLeadReportRedirect, pendingLeadReportCallback } from '../../src/utils/leadReportLink.js';
import { findLiffLaunch, liffLaunchUrl, LIFF_IDS } from '../../src/utils/liffApps.js';

// LINE 內開啟賞屋預約：實際 Endpoint + LIFF 放在 hash 的登入憑證（假值）
const inClientLaunch = 'https://anxismart.com/?liff_path=viewing-reservation-entry#access_token=fake&context_token=fake&feature_token=fake&id_token=fake&client_id=2008257338';

// LINE Developers 後台的正式 Endpoint（驗屋時間表、表單的 ID 來自 .env，Node 測試環境讀不到，不列入）
const CONSOLE_ENDPOINTS = [
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
    .replace('import.meta.env.VITE_LIFF_ID_LEAD_REPORT', 'null')
    .replace("await import('./main');", 'recordMain();')
    .replace('bootstrap().catch(() => window.__anxiStartup?.fail());', 'globalThis.done = bootstrap();'), context);
  await new Promise(resolve => setImmediate(resolve));
  const init = `init:${LIFF_IDS.viewingReservation}:hash 憑證仍在`;
  assert.deepEqual(events, [init]);
  resolveInit();
  await context.done;
  assert.deepEqual(events, [init, '#/viewing-reservation-entry', 'main']);
});
