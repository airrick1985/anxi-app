import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { readLeadReportId, isLeadLiffLaunch, leadReportLiffUrl } from '../../src/utils/leadReportLink.js';

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
    isLeadLiffLaunch, readLeadReportId, LEAD_REPORT_LIFF_ID: 'test', URL,
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
