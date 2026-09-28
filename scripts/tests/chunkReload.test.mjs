import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const recoverySource = await readFile(new URL('../../src/utils/chunkReload.js', import.meta.url), 'utf8');
const versionSource = await readFile(new URL('../../src/composables/useVersionCheck.js', import.meta.url), 'utf8');

// 執行實際模組函式，只替換 Vue / alias imports 與瀏覽器環境。
function setup({ stuck = false, storageBlocked = false } = {}) {
  const navigations = [], values = new Map(), timers = new Map();
  let nextTimer = 0;
  const location = { href: 'https://example.com/?existing=1#/projects', replace: url => navigations.push(url) };
  Object.defineProperty(location, 'hash', { set() { throw new Error('不得在 reload 前觸發 hash 導航'); } });
  const context = vm.createContext({
    URL, appVersion: 'test-version',
    window: { location },
    navigator: { serviceWorker: { getRegistrations: () => stuck ? new Promise(() => {}) : Promise.resolve([]) } },
    sessionStorage: {
      getItem: key => { if (storageBlocked) throw new Error('blocked'); return values.get(key); },
      setItem: (key, value) => values.set(key, value),
    },
    setTimeout: callback => { timers.set(++nextTimer, callback); return nextTimer; },
    clearTimeout: id => timers.delete(id),
  });
  const forceReload = versionSource.slice(versionSource.indexOf('export function forceReloadToLatest'), versionSource.indexOf('/** 抓取線上'));
  vm.runInContext(forceReload.replace('export ', ''), context);
  vm.runInContext(recoverySource.replace(/^import .*;\n/gm, '').replace(/^export /gm, ''), context);
  context.fetchLatestVersion = async () => null;
  return { context, navigations, timers };
}

test('PWA 清理永遠 pending，手動重新載入仍在期限後執行；連按只導航一次', async () => {
  const { context, navigations, timers } = setup({ stuck: true });
  const first = context.reloadToLatest();
  const second = context.reloadToLatest();
  assert.equal(first, second);
  assert.equal(navigations.length, 0);
  for (const callback of timers.values()) callback();
  await first;
  assert.equal(navigations.length, 1);
  const url = new URL(navigations[0]);
  assert.equal(url.hash, '#/projects');
  assert.equal(url.searchParams.get('existing'), '1');
  assert.ok(url.searchParams.get('_v'));
  assert.equal(timers.size, 0);
});

test('預載錯誤與路由錯誤共用修復，單次完整導航保留建案目標', async () => {
  const { context, navigations, timers } = setup();
  const preload = context.recoverFromChunkError();
  const route = context.recoverFromChunkError('/inspection/project-123?tab=week');
  assert.equal(preload, route);
  assert.equal(await route, true);
  assert.equal(navigations.length, 1);
  assert.equal(new URL(navigations[0]).hash, '#/inspection/project-123?tab=week');
  assert.equal(timers.size, 0);
  assert.equal(await context.recoverFromChunkError('/inspection/project-123'), false);
  assert.equal(navigations.length, 1);
  await context.reloadToLatest();
  assert.equal(navigations.length, 2); // 自動重試保險絲不能封鎖手動更新
});

test('storage 被封鎖仍可手動更新，且按鈕事件不會被當成路由', async () => {
  const { context, navigations } = setup({ storageBlocked: true });
  assert.equal(await context.recoverFromChunkError(), false);
  await context.reloadToLatest({ type: 'click' });
  assert.equal(navigations.length, 1);
  assert.equal(new URL(navigations[0]).hash, '#/projects');
});

test('清理失敗仍重新載入', async () => {
  const { context, navigations } = setup();
  context.navigator.serviceWorker.getRegistrations = async () => { throw new Error('SW unavailable'); };
  context.window.caches = context.caches = { keys: async () => { throw new Error('cache unavailable'); } };
  await context.reloadToLatest();
  assert.equal(navigations.length, 1);
});
