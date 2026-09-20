// Isolated browser regression: all API/store access is replaced by local fixtures.
// BROWSER_EXECUTABLE=/path/to/chromium node scripts/tests/commission-browser.mjs
import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import puppeteer from 'puppeteer-core';

const root = path.resolve(import.meta.dirname, '../..');
const candidates = [process.env.BROWSER_EXECUTABLE, '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium', '/usr/bin/google-chrome'].filter(Boolean);
let executablePath;
for (const candidate of candidates) if (await access(candidate).then(() => true, () => false)) { executablePath = candidate; break; }
assert(executablePath, 'Set BROWSER_EXECUTABLE to a Chromium browser');
const files = ['src/views/CommissionBonus.vue', ...((await readdir(path.join(root, 'src/components/commission'))).filter(n => n.endsWith('.vue')).map(n => `src/components/commission/${n}`))];
const apiNames = new Set();
for (const file of files) {
  const source = await readFile(path.join(root, file), 'utf8');
  for (const match of source.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]@\/api['"]/g)) {
    match[1].split(',').map(s => s.trim()).filter(Boolean).forEach(n => apiNames.add(n));
  }
}
const fixture = `
window.fixture ??= { plans: [], configs: [], settings: {}, submissions: [], records: [], bonuses: [], ledgers: [] };
const state = window.fixture;
const handlers = {
  fetchCommissionPlans: () => state.plans,
  createCommissionPlan: (_, p) => { state.plans.push(p); },
  updateCommissionPlan: (_, p) => { const old = state.plans.find(x => x.id === p.id); if (old) Object.assign(old, p); else state.plans.push(p); },
  deleteCommissionPlan: (_, id) => { state.plans = state.plans.filter(p => p.id !== id); },
  fetchCommissionSettings: (_, id = 'general') => state.settings[id] || null,
  setCommissionSettings: (_, data, id = 'general') => { state.settings[id] = data; },
  fetchCommissionRecords: () => state.records,
  fetchBonusRecords: () => state.bonuses,
  fetchCommissionLedgers: () => state.ledgers,
  fetchCommissionExportConfigs: () => state.configs,
  setCommissionExportConfig: (id, data) => { const old = state.configs.find(c => c.id === id); if (old) Object.assign(old, data); else state.configs.push({id, ...data}); },
  submitCommissionEntriesAPI: payload => { state.submissions.push(payload); return { ok: true, results: payload.entries.map(e => ({ unitId: e.unitId, recordId: 'mock', refund: false })) }; },
};
`;
const mocks = {
  '@/api': fixture + [...apiNames].map(n => `export const ${n} = async (...args) => structuredClone(handlers.${n} ? handlers.${n}(...args) : []);`).join('\n'),
  '@/store/user': `export const useUserStore = () => ({ user: { name: '測試', phone: 'admin', roles: ['系統管理員'], permissions: {} } });`,
  '@/store/projectStore': `export const useProjectStore = () => ({ projectsList: [{}], idToNameMap: { fuyu1750: '富宇測試' } });`,
  '@/store/salesDataStore': `export const useSalesDataStore = () => ({ loadProjectData: async () => {}, getProjectData: () => ({
    project: { name: '富宇測試' }, personnel: [],
    households: [{ unitId: 'C-15', contractType: '毛胚合約', buyerName: '測試買方', salesStatus_backend: '簽約', payment_contract_date: '2026/09/01', price_transaction_house: 3649, price_floor_house_total: 3400, price_package_deal: 3750 }, { unitId: 'C-16', contractType: '一般合約', buyerName: '第二戶', salesStatus_backend: '簽約', payment_contract_date: '2026/09/01', price_transaction_house: 2000, price_floor_house_total: 1800 }],
    parkings: [{ buyerUnitId: 'C-15', spotId: 'P1', status_backend: '簽約', price_transaction: 200, price_floor: 180 }]
  }) });`,
};
const entry = `import { createApp, h } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';
import Page from '/src/views/CommissionBonus.vue';
import * as XLSX from 'xlsx-js-style';
window.testXLSX = XLSX;
const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:projectId', component: Page }] });
await router.push('/fuyu1750');
createApp({ render: () => h(components.VApp, null, { default: () => h(Page) }) }).use(router).use(createVuetify({ components, directives })).use(Toast).mount('#app');`;
const server = await createServer({
  root, configFile: false, optimizeDeps: { entries: [], noDiscovery: true, include: ['vue', 'vue-router', 'vuetify', 'vuetify/components', 'vuetify/directives', 'vue-toastification', 'jszip', 'xlsx-js-style', 'xlsx'] }, server: { host: '127.0.0.1', port: 0 },
  resolve: { alias: [{ find: '@', replacement: path.join(root, 'src') }] },
  plugins: [{
    name: 'commission-fixtures', enforce: 'pre',
    resolveId(id) {
      const key = Object.keys(mocks).find(k => id === k || id === path.join(root, 'src', k.slice(2)));
      if (key) return '\0mock:' + key;
      if (id === '/commission-test-entry.js') return '\0entry';
    },
    load(id) { if (id === '\0entry') return entry; if (id.startsWith('\0mock:')) return mocks[id.slice(6)]; },
    configureServer(s) { s.middlewares.use((req, res, next) => { if (req.url === '/commission-test') { res.setHeader('Content-Type', 'text/html'); res.end('<div id="app"></div><script type="module" src="/commission-test-entry.js"></script>'); } else next(); }); },
  }, vue(), vuetify({ autoImport: false })],
});
await server.listen();
let browser;
try {
  browser = await puppeteer.launch({ executablePath, headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1000 });
  const errors = [];
  page.on('pageerror', e => { errors.push(e.message); console.error('PAGE ERROR', e.message); });
  page.on('dialog', d => d.accept());
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  await page.setRequestInterception(true);
  page.on('request', r => r.url().startsWith(base) || r.url().startsWith('data:') ? r.continue() : r.abort());
  await page.goto(`${base}/commission-test`);
  const waitText = text => page.waitForFunction(t => document.body.innerText.includes(t), {}, text);
  const click = text => page.evaluate(t => { const el = [...document.querySelectorAll('button')].find(e => e.textContent.trim() === t && e.getClientRects().length); if (!el) throw new Error('Button not found: ' + t); el.click(); }, text);
  const select = async (label, option) => {
    const id = await page.evaluate(label => [...document.querySelectorAll('.v-select')].find(e => e.textContent.includes(label)).querySelector('input').id, label);
    await page.evaluate(id => document.getElementById(id).closest('.v-field').dispatchEvent(new MouseEvent('mousedown', { bubbles: true })), id);
    await page.waitForFunction(option => [...document.querySelectorAll('.v-overlay--active .v-list-item')].some(e => e.innerText.trim() === option), {}, option);
    await page.evaluate(option => [...document.querySelectorAll('.v-overlay--active .v-list-item')].find(e => e.innerText.trim() === option).click(), option);
  };
  const input = async (label, value) => page.evaluate(({ label, value }) => {
    const field = [...document.querySelectorAll('.v-input')].find(e => e.textContent.includes(label));
    const el = field.querySelector('input'); el.value = value; el.dispatchEvent(new Event('input', { bubbles: true }));
  }, { label, value });
  const addUnit = async (unitId = 'C-15') => {
    await click('新增戶別');
    await page.waitForSelector('.v-overlay--active .v-list-item');
    await page.evaluate(id => [...document.querySelectorAll('.v-overlay--active .v-list-item')].find(e => e.innerText.includes(id)).click(), unitId);
    await click('加入（1）');
  };
  await waitText('新增戶別'); console.log('loaded');
  await select('請佣方案', '配套請佣');
  await waitText('配套價格，不計車位'); console.log('package selected');
  await addUnit();
  await waitText('配套價格：99 萬'); console.log('package added');
  assert.match(await page.$eval('.finance-summary', e => e.innerText), /待填有效底價/);
  await input('配套底價（萬）', '80');
  await page.waitForFunction(() => !document.body.innerText.includes('請填寫有效的配套底價'));
  assert.match(await page.$eval('.unit-card', e => e.innerText), /15,840/);
  await select('請佣方案', '一般請佣');
  await waitText('房屋價格，含車位');
  await addUnit();
  await waitText('配套房屋總價（含車位）：3,750 萬');
  // Claim note is prefilled with the non-general contract type.
  assert.equal(await page.evaluate(() => [...document.querySelectorAll('.v-input')].find(e => e.textContent.includes('請佣備註')).querySelector('input').value), '毛胚合約');
  // House floor defaults to package total minus parking floor (3750 - 180) and survives a source round-trip.
  const houseFloor = () => page.evaluate(() => [...document.querySelectorAll('.v-input')].find(e => e.textContent.includes('房屋底價（萬')).querySelector('input').value);
  assert.equal(await houseFloor(), '3570');
  await select('本次採用價格', '原成交總價（含車位）');
  await click('計算明細');
  await page.waitForFunction(() => document.body.innerText.includes('成交總價(含車)'));
  await click('收合明細');
  await select('本次採用價格', '配套房屋總價（含車位）');
  await waitText('配套房屋總價（含車位）：3,750 萬');
  assert.equal(await houseFloor(), '3570');
  assert.equal(await page.$('#comm-summary'), null);
  assert(await page.$('.submit-bar'));
  await click('查看獎金與金額彙總');
  await page.waitForSelector('#comm-summary');
  await click('收合彙總');
  await click('全部收合');
  assert.equal(await page.$eval('.unit-toggle', e => e.getAttribute('aria-expanded')), 'false');
  await page.$eval('.unit-toggle', e => e.click());
  await click('其他設定');
  assert(await page.evaluate(() => [...document.querySelectorAll('.v-input')].some(e => e.innerText.includes('佣金比例(%)'))));
  await click('其他設定');
  await input('房屋底價（萬', '3300');
  await page.waitForFunction(() => document.body.innerText.includes('689,040'));
  assert.deepEqual(await page.$$eval('.finance-summary dd', els => els.map(e => e.textContent.trim())), ['3,750', '3,480', '270', '2.2', '100']);
  await input('房屋底價（萬', '3600');
  await page.waitForFunction(() => document.querySelector('.finance-summary .text-error')?.textContent === '-30');
  await input('房屋底價（萬', '3300');
  await page.waitForFunction(() => !document.querySelector('.adv-row') && !document.querySelector('.claim-table') && document.querySelector('.unit-toggle').getAttribute('aria-expanded') === 'true');
  await new Promise(resolve => setTimeout(resolve, 350));
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: '/tmp/anxi-commission-workbench-desktop.png', fullPage: false });
  const checkStickyHeader = async () => {
    await page.evaluate(() => {
      const card = document.querySelector('.unit-card');
      window.scrollTo({ top: card.getBoundingClientRect().top + window.scrollY + 250, behavior: 'instant' });
    });
    await page.waitForFunction(() => {
      const header = document.querySelector('.unit-card > .card-head');
      return Math.abs(header.getBoundingClientRect().top - parseFloat(getComputedStyle(header).top)) < 2;
    });
    assert(await page.$eval('.unit-card > .card-head', e => e.innerText.includes('銷售人員')));
  };
  await checkStickyHeader();

  await page.setViewport({ width: 390, height: 844 });
  await new Promise(resolve => setTimeout(resolve, 350));
  await page.screenshot({ path: '/tmp/anxi-commission-workbench-mobile.png', fullPage: false });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Mobile layout must not overflow');
  await checkStickyHeader();
  await page.screenshot({ path: '/tmp/anxi-commission-sticky-mobile.png', fullPage: false });
  await page.$eval('.unit-toggle', e => e.click());
  assert.equal(await page.$eval('.unit-card > .card-head', e => getComputedStyle(e).position), 'static', 'Collapsed headers must not stick');
  await page.$eval('.unit-toggle', e => e.click());
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));

  await page.setViewport({ width: 1280, height: 1000 });
  await addUnit('C-16');
  await page.waitForFunction(() => document.querySelectorAll('.unit-toggle').length === 2);
  assert.deepEqual(await page.$$eval('.unit-toggle', els => els.map(e => e.getAttribute('aria-expanded'))), ['false', 'true']);
  await page.evaluate(() => {
    const card = document.querySelectorAll('.unit-card')[1];
    for (const input of card.querySelectorAll('.rate-input input')) { input.value = '0'; input.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await page.waitForFunction(() => [...document.querySelectorAll('.unit-card')[1].querySelectorAll('.allocation-editor')].every(e => !e.getClientRects().length));
  await page.evaluate(() => [...document.querySelectorAll('.unit-card')[1].querySelectorAll('button')].find(e => e.textContent.includes('編輯人員與分配')).click());
  await page.waitForFunction(() => document.querySelectorAll('.unit-card')[1].querySelector('.allocation-editor').getClientRects().length > 0);
  await page.evaluate(() => {
    const card = document.querySelectorAll('.unit-card')[1];
    const input = card.querySelector('.rate-input input'); input.value = '1'; input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.evaluate(() => [...document.querySelectorAll('.unit-card')[1].querySelectorAll('button')].find(e => e.textContent.includes('完成設定')).click());
  await page.waitForFunction(() => document.querySelectorAll('.unit-card')[1].querySelector('.allocation-editor').getClientRects().length > 0);
  await page.$eval('.unit-toggle', e => e.click());
  assert.deepEqual(await page.$$eval('.unit-toggle', els => els.map(e => e.getAttribute('aria-expanded'))), ['true', 'false']);
  assert.equal(await houseFloor(), '3300', 'Switching cards preserves the manual floor');
  await page.evaluate(() => [...document.querySelectorAll('.unit-card')][1].querySelector('button[title="移除此戶"]').click());
  await click('移除此戶').catch(async () => page.click('button[title="移除此戶"]'));
  await select('請佣方案', '配套請佣');
  await click('匯出中心');
  await waitText('版型僅套用至本方案'); console.log('export loaded');
  // No records yet: template editor remains available.
  await click('以此為底新增版型');
  await waitText('新增請佣總表版型');
  await input('版型名稱', '配套專用請佣表');
  await click('儲存版型');
  await page.waitForFunction(() => window.fixture.configs.length === 1);
  assert.equal(await page.evaluate(() => window.fixture.configs[0].planId), 'package');
  await click('獎金表');
  await click('以此為底新增版型');
  await waitText('新增獎金表版型');
  await input('版型名稱', '配套專用獎金表');
  await click('儲存版型');
  await page.waitForFunction(() => window.fixture.configs.length === 2);
  assert.equal(await page.evaluate(() => window.fixture.configs[1].planId), 'package');
  await select('請佣方案', '一般請佣');
  await waitText('「一般請佣」的請佣總表');
  assert.ok(!(await page.evaluate(() => [...document.querySelectorAll('.v-select')].find(e => e.textContent.includes('欄位版型')).textContent)).includes('配套專用'));
  await click('設定');
  await waitText('基本比例');
  await input('預設佣金比例', '2.5');
  await click('儲存設定');
  await page.waitForFunction(() => window.fixture.settings.general?.defaultCommissionPct === 2.5);
  await select('請佣方案', '配套請佣');
  await waitText('正在設定「配套請佣」');
  assert.equal(await page.evaluate(() => [...document.querySelectorAll('.v-input')].find(e => e.textContent.includes('預設佣金比例')).querySelector('input').value), '2.2');
  await click('新增方案');
  await input('方案名稱', '裝修請佣');
  await click('建立方案');
  await waitText('正在設定「裝修請佣」');
  assert.equal(await page.evaluate(() => window.fixture.plans[0].priceBasis), 'package');
  await click('匯出中心');
  await waitText('「裝修請佣」的請佣總表');
  await page.waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running' || a.effect.getTiming().iterations === Infinity));
  await page.screenshot({ path: '/tmp/anxi-commission-export.png', fullPage: true });
  // Both claim and bonus exports use package labels and omit parking headers.
  const exported = await page.evaluate(async () => {
    const models = await import('/src/utils/commissionExportModel.js');
    const grids = await import('/src/services/commissionExcelService.js');
    const { mergeSettings } = await import('/src/utils/commissionCalculation.js');
    const settings = { ...mergeSettings(null), priceBasis: 'package' };
    const records = [{ id: 'p', unitId: 'C-15', period: 1, ratioPct: 100, status: 'active', note: '毛胚合約', snapshot: { dealTotal: 99, houseDeal: 99, houseFloor: 80, totalFloor: 80 }, calc: { dealAfter: 99 } }];
    // Saved templates without the note column still get it appended.
    const claim = models.buildClaimModel(records, { settings, period: 1, projectName: '富宇・配套請佣', config: { columns: [{ key: 'unit', visible: true }] } });
    const bonus = models.buildBonusModel({ records, settings, period: 1, projectName: '富宇・配套請佣' });
    const cells = grids.buildBonusGrids(bonus).flatMap(g => g.cells.flat().filter(Boolean).map(c => c.v));
    return { claim: claim.columns.map(c => c.key), note: claim.rows[0].cells.note, cells, filename: bonus.fileName };
  });
  assert.deepEqual(exported.claim.slice(0, 2), ['unit', 'no']);
  assert.ok(exported.claim.includes('note'));
  assert.equal(exported.note, '毛胚合約');
  assert.ok(exported.cells.includes('配套價格(萬)'));
  assert.ok(exported.cells.includes('配套底價(萬)'));
  assert.ok(!exported.cells.includes('車價'));
  assert.ok(!exported.cells.includes('停車位'));
  assert.match(exported.filename, /配套請佣/);
  // Plan CRUD: rename custom plan, switch basis while empty, rename built-in, delete custom plan.
  await click('編輯方案');
  await waitText('編輯請佣方案');
  await input('方案名稱', '裝修請佣改');
  await select('採用價格', '房屋價格（含車位）');
  await click('儲存方案');
  await waitText('「裝修請佣改」的請佣總表');
  await waitText('房屋價格，含車位');
  assert.deepEqual(await page.evaluate(() => window.fixture.plans.map(p => [p.name, p.priceBasis])), [['裝修請佣改', 'house']]);
  await select('請佣方案', '一般請佣');
  await click('編輯方案');
  await waitText('編輯請佣方案');
  assert.ok(await page.evaluate(() => [...document.querySelectorAll('.v-overlay--active .v-select')].find(e => e.textContent.includes('採用價格')).classList.contains('v-input--disabled')));
  assert.ok(!(await page.evaluate(() => [...document.querySelectorAll('.v-overlay--active button')].some(b => b.textContent.trim() === '刪除方案'))));
  await input('方案名稱', '一般請佣（房屋）');
  await click('儲存方案');
  await waitText('「一般請佣（房屋）」的請佣總表');
  assert.equal(await page.evaluate(() => window.fixture.plans.find(p => p.id === 'general')?.priceBasis), 'house');
  await select('請佣方案', '裝修請佣改');
  await waitText('「裝修請佣改」的請佣總表');
  await click('編輯方案');
  await waitText('編輯請佣方案');
  await click('刪除方案');
  await waitText('「一般請佣（房屋）」的請佣總表');
  assert.deepEqual(await page.evaluate(() => window.fixture.plans.map(p => p.id)), ['general']);
  // Real Excel upload and preview for the new package and split-house headers.
  await select('請佣方案', '配套請佣');
  await click('歷史匯入');
  await waitText('配套價格、配套底價');
  const uploadRow = row => page.evaluate(row => {
    const XLSX = window.testXLSX;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([row]), '請佣紀錄');
    const bytes = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const transfer = new DataTransfer();
    transfer.items.add(new File([bytes], 'commission-import.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const el = document.querySelector('input[type=file]');
    el.files = transfer.files;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, row);
  await uploadRow({ 期別: 1, 戶別: 'C-15', 請佣比例: 100, 合約方式: '毛胚合約', 配套價格: 99, 配套底價: 80 });
  await waitText('實際請領(元)');
  await page.waitForFunction(() => [...document.querySelectorAll('.history-import tbody tr')].some(r => r.innerText.includes('C-15') && r.innerText.includes('17,600')));
  assert.ok(await page.evaluate(() => [...document.querySelectorAll('.history-import tbody tr')].some(r => r.innerText.includes('配套價格') && r.innerText.includes('99') && r.innerText.includes('80'))));
  await select('請佣方案', '一般請佣（房屋）');
  await waitText('非一般合約可選');
  await uploadRow({ 期別: 1, 戶別: 'C-15', 請佣比例: 100, 合約方式: '毛胚合約', 價格來源: '配套房屋總價', '請佣總價(含車)': 3750, 房屋底價: 3300 });
  await page.waitForFunction(() => [...document.querySelectorAll('.history-import tbody tr')].some(r => r.innerText.includes('C-15') && r.innerText.includes('3,750') && r.innerText.includes('3,480')));
  assert.deepEqual(errors, []);
  console.log('PASS: scheme switching/CRUD, live floors, 3750/99 price bases, independent settings and claim/bonus templates, package bonus grid and filename, new Excel import headers/previews');
} finally {
  await browser?.close();
  await server.close();
}
