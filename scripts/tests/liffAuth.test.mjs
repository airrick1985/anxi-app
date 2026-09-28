import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const source = await readFile(new URL('../../src/utils/liffAuth.js', import.meta.url), 'utf8');
function setup(liff) {
  const storage = new Map(), timers = new Map();
  let timerId = 0;
  const context = vm.createContext({ liff, URL, console,
    window: { location: { origin: 'https://app.test' } },
    sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    setTimeout: fn => { timers.set(++timerId, fn); return timerId; }, clearTimeout: id => timers.delete(id),
  });
  vm.runInContext(source.replace(/^import .*;\n/, '').replace(/^export /gm, ''), context);
  return { context, timers };
}
test('bootstrap 與頁面共用 LIFF 初始化，已登入不再呼叫登入', async () => {
  let initialized = 0, logins = 0;
  const { context, timers } = setup({ init: async () => { initialized++; }, isLoggedIn: () => true, login: () => logins++ });
  await context.initializeLiff('id');
  assert.equal(await context.initLiffAndEnsureLogin('id'), true);
  assert.equal(initialized, 1);
  assert.equal(logins, 0);
  assert.equal(timers.size, 0);
});
test('OAuth 回跳仍未登入時明確報錯，不無限轉址', async () => {
  let logins = 0;
  const { context } = setup({ init: async () => {}, isLoggedIn: () => false, login: () => logins++ });
  assert.equal(await context.initLiffAndEnsureLogin('id'), false);
  await assert.rejects(context.initLiffAndEnsureLogin('id'), /LINE 登入尚未完成/);
  assert.equal(logins, 1);
});
test('SDK 初始化無回應會逾時，且清掉計時器', async () => {
  const { context, timers } = setup({ init: () => new Promise(() => {}) });
  const promise = context.initializeLiff('id');
  const check = assert.rejects(promise, /LINE 驗證逾時/);
  for (const callback of timers.values()) callback();
  await check;
  assert.equal(timers.size, 0);
});
test('hash 名單 query 在 LINE 登入回跳 URL 中完整保留', () => {
  const { context } = setup({});
  const url = new URL(context.buildLiffRedirectUri('contact?id=a%26b'));
  assert.equal(url.hash, '');
  assert.equal(url.searchParams.get('liff_path'), 'contact?id=a%26b');
});
