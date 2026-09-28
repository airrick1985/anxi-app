import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { readLeadReportId, isLeadLiffLaunch, leadReportLiffUrl, legacyLeadReportRedirect, pendingLeadReportCallback } from '../../src/utils/leadReportLink.js';

test('LINE 新通知、舊 hash 連結、OAuth 回跳及 primary state 保留同一名單', () => {
  for (const href of [
    'https://app.test/?leadReportId=lead-1',
    'https://app.test/#/contact?id=lead-1',
    'https://app.test/?liff_path=contact%3Fid%3Dlead-1&code=code&state=state',
    'https://app.test/?liff_path=lead-distribution-entry&liff.state=%3FleadReportId%3Dlead-1',
    'https://app.test/?liff.state=%2F%3FleadReportId%3Dlead-1',
  ]) {
    assert.equal(isLeadLiffLaunch(href), true, href);
    assert.equal(readLeadReportId(href), 'lead-1', href);
  }
  assert.equal(isLeadLiffLaunch('https://app.test/#/login'), false);
  assert.equal(readLeadReportId('https://app.test/?leadReportId=a%2Fb'), null);
  assert.equal(readLeadReportId('https://app.test/?liff.state=%3FleadReportId%3Da%2526b'), 'a&b');
  assert.match(leadReportLiffUrl('a&b'), /\?leadReportId=a%26b$/);
});

test('bootstrap 必須等 LINE 初始化才改網址或建立主程式', async () => {
  let resolveInit;
  const events = [];
  const source = await readFile(new URL('../../src/bootstrap.js', import.meta.url), 'utf8');
  const context = vm.createContext({
    isLeadLiffLaunch, readLeadReportId, legacyLeadReportRedirect, pendingLeadReportCallback, LEAD_REPORT_LIFF_ID: 'test', URL,
    initializeLiff: () => new Promise(resolve => { resolveInit = resolve; }),
    window: { location: { href: 'https://app.test/?liff.state=%3FleadReportId%3Da' },
      history: { replaceState: (_, __, url) => events.push(url.hash) } },
    recordMain: () => events.push('main'),
  });
  vm.runInContext(source.replace(/^import .*;\n/, '')
    .replace("const { initializeLiff } = await import('./utils/liffAuth');", '')
    .replace('import.meta.env.VITE_LIFF_ID_LEAD_REPORT', 'null')
    .replace("await import('./main');", 'recordMain();')
    .replace('bootstrap().catch(() => window.__anxiStartup?.fail());', 'globalThis.done = bootstrap();'), context);
  assert.deepEqual(events, []);
  resolveInit();
  await context.done;
  assert.deepEqual(events, ['#/contact?id=a', 'main']);
});


test('舊通知直接接到已可用的 LIFF 入口，名單 ID 不遺失', () => {
  assert.equal(legacyLeadReportRedirect('https://app.test/#/contact?id=old-lead'), leadReportLiffUrl('old-lead'));
  assert.equal(legacyLeadReportRedirect('https://app.test/?_v=123#/contact?id=a%26b'), leadReportLiffUrl('a&b'));
  for (const query of ['code=c&state=s', 'leadReportId=a', 'liff.state=x', 'liff_path=contact%3Fid%3Da', 'error=access_denied']) {
    assert.equal(legacyLeadReportRedirect(`https://app.test/?${query}#/contact?id=a`), null);
  }
  assert.equal(legacyLeadReportRedirect('https://app.test/#/contact'), null);
});

test('只對五分鐘內遺失路徑的 OAuth 回跳救援，不挾持其他功能', () => {
  const now = 1000000;
  const pending = JSON.stringify({ id: 'old-lead', ts: now - 1000 });
  assert.equal(pendingLeadReportCallback('https://app.test/?code=c&state=s', pending, now), 'old-lead');
  for (const url of ['https://app.test/', 'https://app.test/?code=c&state=s#/other', 'https://app.test/?code=c&state=s&liff_path=other']) {
    assert.equal(pendingLeadReportCallback(url, pending, now), null);
  }
  for (const raw of ['bad-json', JSON.stringify({ id: 'old', ts: now - 300001 }), JSON.stringify({ id: 'old', ts: now + 1 })]) {
    assert.equal(pendingLeadReportCallback('https://app.test/?code=c&state=s', raw, now), null);
  }
});

test('實際 bootstrap 遇到舊連結先轉 LIFF，不載入 SDK 或主程式', async () => {
  const source = await readFile(new URL('../../src/bootstrap.js', import.meta.url), 'utf8');
  const events = [];
  const context = vm.createContext({ legacyLeadReportRedirect,
    window: { location: { href: 'https://app.test/#/contact?id=old-lead', replace: url => events.push(url) } },
  });
  vm.runInContext(source.replace(/^import .*;\n/, '')
    .replace('import.meta.env.VITE_LIFF_ID_LEAD_REPORT', 'null')
    .replace('bootstrap().catch(() => window.__anxiStartup?.fail());', 'globalThis.done = bootstrap();'), context);
  await context.done;
  assert.deepEqual(events, [leadReportLiffUrl('old-lead')]);
});

test('遺失路徑的登入回跳也在 SDK 完成後才恢復名單', async () => {
  let resolveInit;
  const events = [];
  const source = await readFile(new URL('../../src/bootstrap.js', import.meta.url), 'utf8');
  const context = vm.createContext({
    isLeadLiffLaunch, readLeadReportId, legacyLeadReportRedirect, pendingLeadReportCallback, LEAD_REPORT_LIFF_ID: 'test', URL,
    localStorage: { getItem: () => JSON.stringify({ id: 'old-lead', ts: Date.now() }) },
    initializeLiff: () => new Promise(resolve => { resolveInit = resolve; }),
    window: { location: { href: 'https://app.test/?code=c&state=s' },
      history: { replaceState: (_, __, url) => events.push(url.hash) } },
    recordMain: () => events.push('main'),
  });
  vm.runInContext(source.replace(/^import .*;\n/, '')
    .replace("const { initializeLiff } = await import('./utils/liffAuth');", '')
    .replace('import.meta.env.VITE_LIFF_ID_LEAD_REPORT', 'null')
    .replace("await import('./main');", 'recordMain();')
    .replace('bootstrap().catch(() => window.__anxiStartup?.fail());', 'globalThis.done = bootstrap();'), context);
  assert.deepEqual(events, []);
  resolveInit();
  await context.done;
  assert.deepEqual(events, ['#/contact?id=old-lead', 'main']);
});
