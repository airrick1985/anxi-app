// 隔離 production fixture：使用真實 AG Grid / Vuetify 元件，API 改為記憶體 stub。
import assert from 'node:assert/strict';
import { access, mkdtemp, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { build, preview } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import puppeteer from 'puppeteer-core';

const root = process.cwd();
const candidates = [process.env.BROWSER_EXECUTABLE,
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/chromium', '/usr/bin/google-chrome'].filter(Boolean);
let executablePath;
for (const candidate of candidates) {
  if (await access(candidate).then(() => true, () => false)) { executablePath = candidate; break; }
}
assert(executablePath, '請以 BROWSER_EXECUTABLE 指定 Chromium');
const fixture = await mkdtemp(path.join(root, '.household-grid-test-'));
let server, browser;
try {
  await writeFile(path.join(fixture, 'index.html'), '<html><body><div id="app"></div><script type="module" src="./main.js"></script></body></html>');
  await writeFile(path.join(fixture, 'api.js'), 'export async function batchUpdateHouseholds(updates) { window.batchUpdates = updates; }');
  await writeFile(path.join(fixture, 'main.js'), `
import { createApp, h } from 'vue';
import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import { AgGridVue } from 'ag-grid-vue3';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import SwitchRenderer from '../src/components/household/SwitchRenderer.vue';
import SwitchHeaderRenderer from '../src/components/household/SwitchHeaderRenderer.vue';
import CustomerMessageRenderer from '../src/components/household/CustomerMessageRenderer.vue';
ModuleRegistry.registerModules([AllCommunityModule]);
window.changes = [];
createApp({ render: () => h(AgGridVue, {
  style: 'height: 500px; width: 1000px', headerHeight: 90, rowHeight: 60,
  rowData: [
    { _docId: 'a', showInMenu: true, '交屋': false, customerMessages: [{ text: 'hello' }, { isDeleted: true }] },
    { _docId: 'b', showInMenu: false, '交屋': false, customerMessages: [] },
  ],
  columnDefs: [
    ...['showInMenu', '交屋'].map(field => ({ field, width: 250, editable: true,
      cellRenderer: SwitchRenderer, headerComponent: SwitchHeaderRenderer })),
    { field: 'customerMessages', cellRenderer: CustomerMessageRenderer,
      cellRendererParams: { onClick: data => { window.clickedHousehold = data._docId; } } },
  ],
  onCellValueChanged: event => window.changes.push({ field: event.colDef.field, value: event.newValue }),
}) }).use(createVuetify()).mount('#app');
`);
  await build({ configFile: false, root: fixture, logLevel: 'error',
    plugins: [vue(), vuetify({ autoImport: true })],
    resolve: { alias: { '@/api': path.join(fixture, 'api.js') } },
  });
  server = await preview({ configFile: false, root: fixture, preview: { host: '127.0.0.1', port: 0, open: false } });
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  browser = await puppeteer.launch({ executablePath, headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (/Failed to resolve|runtime compilation/.test(message.text())) errors.push(message.text()); });
  await page.setRequestInterception(true);
  page.on('request', request => request.url().startsWith(base) ? request.continue() : request.abort());
  await page.goto(base);
  const cell = field => `.ag-row[row-index="0"] [col-id="${field}"] .v-switch input`;
  for (const field of ['showInMenu', '交屋']) await page.waitForSelector(cell(field), { visible: true });
  assert.equal(await page.$eval(cell('showInMenu'), input => input.checked), true);
  assert.equal(await page.$eval(cell('交屋'), input => input.checked), false);
  await page.click(cell('showInMenu'));
  await page.click(cell('交屋'));
  await page.waitForFunction(() => window.changes.length === 2);
  assert.deepEqual(await page.evaluate(() => window.changes), [
    { field: 'showInMenu', value: false }, { field: '交屋', value: true },
  ]);
  await page.click('.ag-header-cell[col-id="showInMenu"] .v-switch input');
  await page.waitForFunction(() => window.batchUpdates?.length === 2);
  assert.deepEqual(await page.evaluate(() => window.batchUpdates), [
    { docId: 'a', data: { showInMenu: true } }, { docId: 'b', data: { showInMenu: true } },
  ]);
  await page.waitForFunction(() => [...document.querySelectorAll('.ag-row [col-id="showInMenu"] .v-switch input')].every(input => input.checked));
  const message = '.ag-row[row-index="0"] [col-id="customerMessages"] button';
  assert.match(await page.$eval(message, button => button.textContent), /1 則/);
  await page.click(message);
  assert.equal(await page.evaluate(() => window.clickedHousehold), 'a');
  assert.deepEqual(errors, []);
  console.log('PASS: production AG Grid 開關顯示、雙向切換、整欄全選與客戶回傳按鈕；無編譯或元件解析錯誤。');
} finally {
  await browser?.close();
  await new Promise(resolve => server ? server.httpServer.close(resolve) : resolve());
  await rm(fixture, { recursive: true, force: true });
}
