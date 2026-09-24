// Deferred API fixtures verify that no partial form is shown during initialization.
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';
import vue from '@vitejs/plugin-vue';
import puppeteer from 'puppeteer-core';
const root = path.resolve(import.meta.dirname, '../..');
const candidates = [process.env.BROWSER_EXECUTABLE, '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium'].filter(Boolean);
let executablePath;
for (const candidate of candidates) if (await access(candidate).then(() => true, () => false)) { executablePath = candidate; break; }
assert(executablePath, 'Set BROWSER_EXECUTABLE to a Chromium browser');
const mocks = {
  '@/api': `window.apiCalls = [];
    export const fetchCustomerSheetSettings = () => { window.apiCalls.push('settings'); return new Promise(resolve => { window.finishSettings = resolve; }); };
    export const fetchSingleVipGuest = () => { window.apiCalls.push('guest'); return new Promise(resolve => { window.finishGuest = resolve; }); };
    export const fetchVipGuests = () => { throw new Error('Public form must not fetch the guest list'); };
    export const submitCustomerSheet = () => {};
    export const fetchUserManagementInitialData = () => {};
    export const getLiffUserData = () => {};`,
  '@line/liff': `export default { init: () => { throw new Error('Public form must not initialize LIFF'); } };`,
};
const entry = `import { createApp, h } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import 'vuetify/styles'; import '@mdi/font/css/materialdesignicons.css';
import Page from '/src/views/CustomerDataSheet.vue';
const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/customer-data-sheet/:projectId/:docId?', component: Page }] });
await router.push('/customer-data-sheet/test/guest?pn=森之丘&sp=0900000000&sn=王小明');
createApp({ render: () => h(components.VApp, null, { default: () => h(Page, {projectId: 'test', docId: 'guest'}) }) }).use(router).use(createVuetify({components, directives})).mount('#app');`;
const server = await createServer({ root, configFile: false,
  optimizeDeps: { entries: [], noDiscovery: true, include: ['vue', 'vue-router', 'vuetify', 'vuetify/components', 'vuetify/directives', 'qrcode.vue'] },
  server: {host: '127.0.0.1', port: 0}, resolve: {alias: [{ find: '@', replacement: path.join(root, 'src') }]},
  plugins: [{name: 'loading-fixtures', enforce: 'pre',
    resolveId(id) { const key = Object.keys(mocks).find(k => id === k || (k.startsWith('@/') && id === path.join(root, 'src', k.slice(2)))); if(key) return '\0mock:' + key; if(id === '/loading-entry.js') return '\0entry'; },
    load(id) { if(id === '\0entry') return entry; if(id.startsWith('\0mock:')) return mocks[id.slice(6)]; },
    configureServer(s) { s.middlewares.use((req,res,next) => { if(req.url === '/loading-test') {res.setHeader('Content-Type','text/html');res.end('<meta name="viewport" content="width=device-width, initial-scale=1"><div id="app"></div><script type="module" src="/loading-entry.js"></script>');} else next(); }); }
  }, vue()]
});
await server.listen();
let browser;
try {
  browser = await puppeteer.launch({ executablePath, headless: true });
  const page = await browser.newPage();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  await page.setRequestInterception(true);
  page.on('request', request => request.url().startsWith(base) || request.url().startsWith('data:') ? request.continue() : request.abort());
  await page.setViewport({width: 390, height: 844});
  await page.goto(base + '/loading-test');
  await page.waitForSelector('.cds-loading');
  assert.match(await page.$eval('.cds-loading', el => el.textContent), /森之丘 客戶資料卡載入中/);
  assert.equal(await page.$('form'), null);
  assert.deepEqual(await page.evaluate(() => window.apiCalls), ['settings']);
  const settings = {status: 'success', projectName: '正式建案名稱', customerFieldSettings: {}, vipFormFields: {budget: {label: '預算選項', selectionMode: 'multiple', options: ['1000萬', '2000萬']}}};
  await page.evaluate(data => window.finishSettings(data), settings);
  await page.waitForFunction(() => window.apiCalls.includes('guest'));
  assert(await page.$('.cds-loading'));
  assert.match(await page.$eval('.cds-loading', el => el.textContent), /正式建案名稱 客戶資料卡載入中/);
  assert.equal(await page.$('form'), null, 'Must wait for customer data after settings');
  await page.evaluate(() => window.finishGuest({status:'success', data:{profile:{姓名:'測試客戶', 電話:'0900000000', 預算選項:['1000萬']}}}));
  await page.waitForSelector('form');
  assert.equal(await page.$('.cds-loading'), null);
  assert(await page.evaluate(() => [...document.querySelectorAll('input')].some(input => input.value === '測試客戶')));
  assert(await page.evaluate(() => document.body.innerText.includes('預算選項')));
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.reload(); await page.waitForSelector('.cds-loading');
  await page.evaluate(() => window.finishSettings({status:'error',message:'設定暫時無法讀取'}));
  await page.waitForFunction(() => document.body.innerText.includes('重新載入'));
  assert.equal(await page.$('form'), null);
  await page.evaluate(() => [...document.querySelectorAll('button')].find(el => el.textContent.includes('重新載入')).click());
  await page.waitForSelector('.cds-loading');
  await page.evaluate(data => window.finishSettings(data), settings);
  await page.waitForFunction(() => window.apiCalls.includes('guest'));
  await page.evaluate(() => window.finishGuest({status:'error',message:'客戶資料讀取失敗'}));
  await page.waitForFunction(() => document.body.innerText.includes('客戶資料讀取失敗'));
  assert.equal(await page.$('form'), null);
  assert.deepEqual(errors, []);
  console.log('PASS: named loading, settings-before-data ordering, no partial form, saved values, mobile, failure and retry.');
} finally { await browser?.close(); await server.close(); }
