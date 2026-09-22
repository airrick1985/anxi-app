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
window.fixture ??= { plans: [], configs: [], settings: {}, submissions: [], records: [], bonuses: [], ledgers: [], bonusEntries: [], notes: [] };
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
  fetchBonusEntries: () => state.bonusEntries,
  fetchBonusPeriodNotes: () => state.notes,
  setBonusPeriodNotes: (_, notes) => { state.notes = structuredClone(notes); },
  generateCommissionPdfAPI: payload => { state.pdfPayload = payload; return {ok:true,base64:btoa('%PDF-test'),fileName:'test.pdf'}; },
  fetchCommissionLedgers: () => state.ledgers,
  fetchCommissionExportConfigs: () => state.configs,
  setCommissionExportConfig: (id, data) => { const old = state.configs.find(c => c.id === id); if (old) Object.assign(old, data); else state.configs.push({id, ...data}); },
  submitCommissionEntriesAPI: payload => {
    payload = JSON.parse(JSON.stringify(payload));
    state.submissions.push(payload);
    if (payload.submissionType === 'bonus') state.notes = payload.periodNotes;
    const results = payload.entries.map((e, i) => {
      const recordId = 'submitted_' + state.submissions.length + '_' + i;
      const record = { ...e, id: recordId, projectId: payload.projectId, planId: payload.planId, submissionType: payload.submissionType, status: 'active', snapshot: {buyerName:'測試買方',salesperson:['業務'],houseDeal:2000,dealTotal:2000},calc:{dealAfter:2000} };
      if (payload.submissionType === 'bonus') {
        state.bonusEntries.push(record);
        state.bonuses.push({commissionRecordId:recordId,unitId:e.unitId,planId:payload.planId,period:e.period,personKey:'p1',name:'業務',amounts:{sales:100},subtotal:100,keep:0,tax:0,nhi:0,net:100,status:'active'});
      } else state.records.push(record);
      return {unitId:e.unitId,recordId,period:e.period,refund:false};
    });
    return {ok:true,results};
  },
};
`;
const mocks = {
  '@/api': fixture + [...apiNames].map(n => `export const ${n} = async (...args) => structuredClone(handlers.${n} ? handlers.${n}(...args) : []);`).join('\n'),
  '@/store/user': `export const useUserStore = () => ({ user: { name: '測試', phone: 'admin', roles: ['系統管理員'], permissions: {} } });`,
  '@/store/projectStore': `export const useProjectStore = () => ({ projectsList: [{}], idToNameMap: { fuyu1750: '富宇測試' } });`,
  '@/store/salesDataStore': `export const useSalesDataStore = () => ({ loadProjectData: async () => {}, getProjectData: () => ({
    project: { name: '富宇測試' }, personnel: [{name:'業務',phone:'p1',positions:['業務']}],
    households: [{ unitId: 'C-15', salesperson: ['業務'], contractType: '毛胚合約', buyerName: '測試買方', salesStatus_backend: '簽約', payment_contract_date: '2026/09/01', price_transaction_house: 3649, price_floor_house_total: 3400, price_package_deal: 3750 }, { unitId: 'C-16', contractType: '一般合約', buyerName: '第二戶', salesStatus_backend: '簽約', payment_contract_date: '2026/09/01', price_transaction_house: 2000, price_floor_house_total: 1800 }],
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
  await page.evaluateOnNewDocument(() => {
    window.fixture = { plans: [], configs: [], settings: {}, submissions: [], records: [], bonuses: [], ledgers: [], bonusEntries: [], notes: [] };
    ['general','package'].forEach((planId, i) => {
      window.fixture.records.push({id:planId,planId,unitId:'C-15',period:1,ratioPct:50,status:'active',snapshot:{buyerName:'測試買方',salesperson:['業務']},categories:{}});
      window.fixture.bonuses.push({commissionRecordId:planId,planId,unitId:'C-15',period:1,personKey:'p1',name:'業務',amounts:{sales:(i+1)*100},subtotal:(i+1)*100,keep:0,tax:0,nhi:0,net:(i+1)*100,status:'active'});
    });
  });
  await page.goto(`${base}/commission-test`);
  const waitText = text => page.waitForFunction(t => document.body.innerText.includes(t), {}, text);
  const click = text => page.evaluate(t => { const candidates = [...document.querySelectorAll('button')].filter(e => e.textContent.trim() === t && e.getClientRects().length); const el = candidates.find(e => e.closest('.v-overlay--active')) || candidates.find(e => e.closest('.v-window-item--active')) || candidates[0]; if (!el) throw new Error('Button not found: ' + t); el.click(); }, text);
  const select = async (label, option) => {
    const id = await page.evaluate(label => [...document.querySelectorAll('.v-select')].find(e => e.textContent.includes(label)).querySelector('input').id, label);
    await page.evaluate(id => document.getElementById(id).closest('.v-field').dispatchEvent(new MouseEvent('mousedown', { bubbles: true })), id);
    await page.waitForFunction(option => [...document.querySelectorAll('.v-overlay--active .v-list-item')].some(e => e.innerText.trim().startsWith(option)), {}, option);
    await page.evaluate(option => [...document.querySelectorAll('.v-overlay--active .v-list-item')].find(e => e.innerText.trim().startsWith(option)).click(), option);
  };
  const input = async (label, value) => page.evaluate(({ label, value }) => {
    const field = [...document.querySelectorAll('.v-input')].find(e => e.getClientRects().length && e.textContent.includes(label));
    const el = field.querySelector('input'); el.value = value; el.dispatchEvent(new Event('input', { bubbles: true }));
  }, { label, value });
  const visible = selector => page.$$eval('.v-window-item--active ' + selector, els => els.filter(e => e.getClientRects().length).length);
  const addUnit = async unitId => {
    await click('新增戶別');
    await page.waitForSelector('.v-overlay--active .v-list-item');
    await page.evaluate(id => [...document.querySelectorAll('.v-overlay--active .v-list-item')].find(e => e.innerText.includes(id)).click(), unitId);
    await click('加入（1）');
  };
  await waitText('請佣編輯');
  await addUnit('C-16');
  await page.waitForSelector('.commission-rate-input input');
  await page.$eval('.commission-rate-input input', el => { el.value = '4.5'; el.dispatchEvent(new Event('input', {bubbles:true})); });
  await page.$eval('.unit-toggle', el => el.click());
  assert.equal(await visible('.allocation-editor'), 0, 'claim editing must not expose bonus allocations');
  await click('獎金編輯');
  await waitText('每人當期獎金結果');
  await input('獎金期別／當期彙總', '1');
  await page.waitForFunction(() => [...document.querySelectorAll('.v-window-item--active tbody tr')].some(r => r.innerText.includes('業務') && r.innerText.includes('300')));
  await addUnit('C-15');
  await page.waitForSelector('.v-window-item--active .unit-toggle');
  await page.evaluate(() => document.querySelector('.v-window-item--active .unit-toggle').click());
  assert.equal(await visible('.commission-rate-input input'), 0, 'bonus cannot edit commission rate');
  assert.equal(await visible('.adv-row input'), 0, 'bonus cannot edit commission fees/retention');
  assert.equal(await visible('.rmk-input'), 0, 'no per-unit remark inputs');
  const resultToggle = await page.evaluate(() => [...document.querySelectorAll('.v-window-item--active button')].find(e => e.textContent.trim() === '每人獎金結果')?.getAttribute('aria-expanded'));
  assert.equal(resultToggle, 'false');
  await page.evaluate(() => [...document.querySelectorAll('.v-window-item--active button')].find(e => e.textContent.trim() === '新增備註').click());
  await page.waitForSelector('.v-window-item--active textarea');
  await page.evaluate(() => { const el = document.querySelector('.v-window-item--active textarea'); el.value = '當期備註第一列'; el.dispatchEvent(new Event('input', {bubbles:true})); });
  await page.evaluate(() => [...document.querySelectorAll('.v-window-item--active button')].find(e => e.textContent.trim() === '新增備註').click());
  await page.evaluate(() => { const els = document.querySelectorAll('.v-window-item--active textarea'); const el = [...els].find(e => e.getAttribute('aria-label')?.includes('2')) || els[2]; el.value = '當期備註第二列'; el.dispatchEvent(new Event('input', {bubbles:true})); });
  await click('預覽並送出獎金');
  await click('確認送出');
  await page.waitForFunction(() => window.fixture.submissions.length === 1);
  const bonus = await page.evaluate(() => window.fixture.submissions[0]);
  assert.equal(bonus.submissionType, 'bonus');
  assert.equal(bonus.entries[0].commPct, 2.2, 'legacy baseline remains readonly');
  assert.deepEqual(bonus.periodNotes[0].notes, ['當期備註第一列','當期備註第二列']);
  await waitText('匯出方式');
  await waitText('業務獎金-50%');
  await click('業務獎金-50%');
  await page.waitForFunction(() => document.querySelector('.v-window-item--active')?.innerText.includes('當期備註第一列'));
  await click('個人明細');
  await select('人員（可多選，批次產出）', '業務');
  await page.waitForFunction(() => document.querySelector('.v-window-item--active')?.innerText.includes('當期備註第二列'));
  await click('請佣編輯');
  assert.equal(await visible('.commission-rate-input input'), 1, 'switching tabs preserves claim draft');
  await click('預覽並送出請佣');
  await click('確認送出');
  await page.waitForFunction(() => window.fixture.submissions.length === 2);
  const claim = await page.evaluate(() => window.fixture.submissions[1]);
  assert.equal(claim.submissionType, 'claim');
  assert.equal(claim.entries[0].commPct, 4.5);
  assert.deepEqual(claim.entries[0].categories, {});
  assert.deepEqual(errors, []);
  console.log('PASS: independent tabs/submission, readonly claim basis in bonus, combined period totals, collapsed results, multi-row notes and export');
} finally {
  await browser?.close();
  await server.close();
}
