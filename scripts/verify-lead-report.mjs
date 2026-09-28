// 正式模式 UI 回歸：LINE / 後端以 stub 模擬，不讀寫正式客戶資料。
import assert from 'node:assert/strict';
import { access, mkdtemp, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { build, preview } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import puppeteer from 'puppeteer-core';
const root = process.cwd();
let executablePath;
for (const candidate of [process.env.BROWSER_EXECUTABLE, '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium'].filter(Boolean)) {
  if (await access(candidate).then(() => true, () => false)) { executablePath = candidate; break; }
}
assert(executablePath, '請指定 BROWSER_EXECUTABLE');
const fixture = await mkdtemp(path.join(root, '.lead-report-test-'));
let server, browser;
try {
  const files = {
    'index.html': '<html><body><div id="app"></div><script type="module" src="./entry.js"></script></body></html>',
    'entry.js': `import '../src/bootstrap.js';`,
    'main.js': `import { createApp, h } from 'vue'; import { createVuetify } from 'vuetify'; import { VApp } from 'vuetify/components'; import 'vuetify/styles'; import LeadReport from '../src/views/LeadReport.vue';
window.scenario = new URLSearchParams(location.search).get('scenario');
const originalTimer = window.setTimeout;
window.setTimeout = (fn, delay, ...args) => originalTimer(fn, delay === 45000 ? 200 : delay, ...args);
window.requests = [];
createApp({ render: () => h(VApp, {}, () => h(LeadReport)) }).use(createVuetify()).mount('#app');`,
    'router.js': `export function useRoute() { return { query: { id: new URLSearchParams(location.hash.split('?')[1]).get('id') || 'lead-test' } }; }`,
    'user.js': `import { reactive } from 'vue'; const store = reactive({ user: { key: 'old-user' }, sessionId: 'old-session' }); window.testStore = store; export const useUserStore = () => store;`,
    'firebase.js': 'export const functions = {};',
    'liff.js': `export async function initializeLiff() { window.beforeLiff = location.href; await new Promise(resolve => setTimeout(resolve, 20)); }
export async function initLiffAndEnsureLogin() { if (window.scenario === 'init-stuck') return new Promise(() => {}); if (window.scenario === 'redirect') return false; return true; }
export async function getLiffProfileOrRelogin() { return { userId: 'Utest' }; }
export const getLiffAccessToken = () => 'test-token';
export const buildLiffRedirectUri = () => 'https://example.test';`,
    'functions.js': `export function httpsCallable() { return async data => {
window.requests.push(data);
if (window.scenario === 'denied') throw Object.assign(new Error('此名單已轉交其他人員'), { code: 'functions/permission-denied' });
if (window.scenario === 'network') throw Object.assign(new Error('網路暫時無法連線'), { code: 'functions/unavailable' });
if (data.action === 'submit') {
  if (window.scenario === 'retry' && window.requests.filter(x => x.action === 'submit').length === 1) throw new Error('提交逾時，請重試');
  return { data: { status: 'saved' } };
}
return { data: {
  lead: { id: 'lead-test', name: '測試客戶', phone: '0911111111', projectId: 'p' },
  user: { key: 'staff', name: '測試員工' }, projectName: '測試建案',
  statusOptions: ['未接', '已約賞屋'], reasonOptions: [], logs: [], reservations: [],
} };
}; }`,
    'Booking.vue': '<template><div>預約測試視窗</div></template>',
  };
  for (const [name, content] of Object.entries(files)) await writeFile(path.join(fixture, name), content);
  await build({ configFile: false, root: fixture, logLevel: 'error', plugins: [{
      name: 'isolated-bootstrap-dependencies', enforce: 'pre',
      resolveId(source, importer) {
        if (importer?.endsWith('/src/bootstrap.js')) {
          if (source === './main') return path.join(fixture, 'main.js');
          if (source === './utils/liffAuth') return path.join(fixture, 'liff.js');
        }
      },
    }, vue(), vuetify({ autoImport: true })],
    resolve: { alias: {
      'vue-router': path.join(fixture, 'router.js'),
      '@/store/user': path.join(fixture, 'user.js'),
      '@/firebase': path.join(fixture, 'firebase.js'),
      '@/utils/liffAuth': path.join(fixture, 'liff.js'),
      'firebase/functions': path.join(fixture, 'functions.js'),
      '@/components/ViewingReservationDialog.vue': path.join(fixture, 'Booking.vue'),
      '@': path.join(root, 'src'),
    } },
  });
  server = await preview({ configFile: false, root: fixture, preview: { host: '127.0.0.1', port: 0, open: false } });
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  browser = await puppeteer.launch({ executablePath, headless: true });
  for (const scenario of ['success', 'nested-callback', 'retry', 'denied', 'network', 'init-stuck', 'redirect']) {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setRequestInterception(true);
    page.on('request', request => request.url().startsWith(base) ? request.continue() : request.abort());
    const callback = '&liff.state=%3Fliff_path%3Dcontact%253Fid%253Dlead-test&code=fake-code&state=fake-state&liffClientId=2008257338&liffRedirectUri=' + encodeURIComponent(base + '/?liff.state=%3Fliff_path%3Dcontact%253Fid%253Dlead-test') + '#/';
    await page.goto(`${base}/?scenario=${scenario}${scenario === 'nested-callback' ? callback : ''}`);
    if (scenario === 'nested-callback') {
      await page.waitForFunction(() => location.hash === '#/contact?id=lead-test');
      assert.equal(await page.evaluate(() => new URL(window.beforeLiff).hash), '#/');
      assert.equal(await page.evaluate(() => new URL(location.href).searchParams.has('liff.state')), false);
    }
    if (['success', 'nested-callback', 'retry'].includes(scenario)) {
      await page.waitForFunction(() => document.body.textContent.includes('聯絡狀況回報'));
      assert.equal(await page.evaluate(() => window.testStore.sessionId), null);
      await page.click('.v-select');
      await page.waitForSelector('.v-overlay .v-list-item');
      await page.evaluate(() => [...document.querySelectorAll('.v-list-item')].find(x => x.textContent.includes('未接')).click());
      const submit = () => page.evaluate(() => [...document.querySelectorAll('button')].find(x => x.textContent.includes('送出回報內容')).click());
      await submit();
      if (scenario === 'retry') {
        await page.waitForFunction(() => document.body.textContent.includes('提交逾時'));
        await submit();
      }
      await page.waitForFunction(() => document.body.textContent.includes('回報成功'));
      const requests = await page.evaluate(() => window.requests.filter(x => x.action === 'submit'));
      assert.equal(requests.length, scenario === 'retry' ? 2 : 1);
      assert.equal(requests[0].report.status, '未接');
      assert.equal(requests[0].accessToken, 'test-token');
      if (requests.length === 2) assert.equal(requests[0].requestId, requests[1].requestId);
    } else {
      const text = scenario === 'denied' ? '此名單已轉交其他人員' : scenario === 'network' ? '服務暫時無法連線' : '連線時間較久';
      await page.waitForFunction(value => document.body.textContent.includes(value), {}, text);
      assert.equal(await page.evaluate(() => document.body.textContent.includes('測試客戶')), false);
      assert.equal(await page.$('.v-progress-circular--indeterminate'), null);
    }
    assert.deepEqual(errors, [], scenario);
    console.log(`PASS: ${scenario}`);
    await page.close();
  }
} finally {
  await browser?.close();
  await new Promise(resolve => server ? server.httpServer.close(resolve) : resolve());
  await rm(fixture, { recursive: true, force: true });
}
