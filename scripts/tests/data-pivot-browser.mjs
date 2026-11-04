// 客戶資料／聯絡名單資料透視的瀏覽器測試：用假資料實際操作視窗，不連 Firebase
// 用法：node scripts/tests/data-pivot-browser.mjs [截圖輸出資料夾]
import assert from 'node:assert/strict';
import { access, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';
import vue from '@vitejs/plugin-vue';
import puppeteer from 'puppeteer-core';

const root = path.resolve(import.meta.dirname, '../..');
const shotDir = process.argv[2] || '';
const candidates = [process.env.BROWSER_EXECUTABLE, '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium'].filter(Boolean);
let executablePath;
for (const candidate of candidates) if (await access(candidate).then(() => true, () => false)) { executablePath = candidate; break; }
assert(executablePath, 'Set BROWSER_EXECUTABLE to a Chromium browser');

const mocks = {
  '@/api': `window.apiCalls = [];
    export const fetchFullCustomersForExport = (...args) => { window.apiCalls.push(args); return new Promise((resolve, reject) => { window.finishFull = resolve; window.failFull = reject; }); };`,
  '@/store/user': `export const useUserStore = () => ({ get user() { return window.__user; }, isLoggedIn: true });`,
  'vue-toastification': `window.toasts = []; export const POSITION = { TOP_CENTER: 'top-center' };
    export const useToast = () => ({ success: m => window.toasts.push(['success', m]), error: m => window.toasts.push(['error', m]) });`,
  '@/services/pivotPresetService': `
    const stores = window.presetStores = window.presetStores || {};
    export const PIVOT_PRESET_NAME_MAX = 30;
    export const normalizePresetName = n => String(n || '').trim().slice(0, 30);
    // 模擬 Firestore：回傳時 map 鍵依字母排序
    const sortKeys = v => Array.isArray(v) ? v.map(sortKeys) : (v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sortKeys(v[k])])) : v);
    export function createPivotPresetService(name) {
      const store = stores[name] = stores[name] || { list: [], subs: new Set() };
      const emit = () => store.subs.forEach(fn => fn([...store.list]));
      return {
        listenToProjectPivotPresets(pid, onData) { store.subs.add(onData); onData([...store.list]); return () => store.subs.delete(onData); },
        async createPivotPreset(pid, n, settings) { const id = 'p' + (store.list.length + 1); store.list.push({ id, name: n, settings: sortKeys(JSON.parse(JSON.stringify(settings))) }); emit(); return id; },
        async updatePivotPreset(id, patch) { const p = store.list.find(x => x.id === id); if (patch.name !== undefined) p.name = patch.name; if (patch.settings) p.settings = sortKeys(JSON.parse(JSON.stringify(patch.settings))); emit(); },
        async deletePivotPreset(id) { store.list = store.list.filter(x => x.id !== id); emit(); },
      };
    }`,
};

const fixtures = `
const profile = (extra = {}) => ({ '年齡': '31-40', '性別': '女', '購屋動機': ['自住'], ...extra });
export const customerList = [
  { docId: 'c1', '姓名': '客戶甲', '電話': '0911000001', '銷售人員': '王小明', '等級研判': 'A意願高', visitStatus: '新客', '拜訪日期': '2026-10-05', latestLogDate: '2026-10-05', createdAt: '2026-10-01T02:00:00.000Z', latestContent: '客戶想看三房，希望高樓層且有雙車位，家人週末會一起再來看一次。\\n需要先提供貸款試算。', profileAttrs: { '年齡': '31-40', '性別': '女', '任職公司': ['舊公司', '新公司'], '家庭成員': ['夫妻,兩小孩'] }, '未買原因': ['總價'], '購屋動機': ['自住', '投資'], otherPhones: [{ name: '配偶', phone: '0933000001', relation: '夫妻' }] },
  { docId: 'c1', '姓名': '客戶甲', '電話': '0911000001', '銷售人員': '李小華', '等級研判': 'A意願高', visitStatus: '新客', '拜訪日期': '2026-10-05', latestLogDate: '2026-10-05', createdAt: '2026-10-01T02:00:00.000Z', profileAttrs: { '年齡': '31-40', '性別': '女' }, '未買原因': ['總價'], '購屋動機': ['自住', '投資'] },
  { docId: 'c2', '姓名': '客戶乙', '電話': '0911000002', '銷售人員': '王小明', '等級研判': 'B有機會', visitStatus: '回訪', '拜訪日期': '2026-09-12', createdAt: '2026-09-01T02:00:00.000Z', '購屋動機': ['投資'] },
  { docId: 'c3', '姓名': '客戶丙', '電話': '0911000003', '銷售人員': '李小華', '等級研判': 'A意願高', visitStatus: '新客', '拜訪日期': '2026-10-20', createdAt: '2026-10-15T02:00:00.000Z' },
  { docId: 'c4', '姓名': '客戶丁', '電話': '0911000004', '銷售人員': '王小明', createdAt: '2026-10-16T02:00:00.000Z' },
  { docId: 'c5', '姓名': '已刪除', '電話': '0911000005', '銷售人員': '王小明', isDeleted: true, '等級研判': 'A意願高' },
];
export const settings = {
  fields: { age: { options: ['20-30', '31-40'] } },
  vipFormFields: {
    a: { label: '購屋動機', order: 1, selectionMode: 'multiple', options: ['自住', '投資'] },
    b: { label: '聯絡電話', order: 2 },
  },
};
export const fullData = [
  { id: 'c1', projectId: 'p1', phone: '0911000001', latestName: '客戶甲', activeSalesName: '王小明', latestSalesPhone: '0900', profile: profile(), submissions: [], interactionLogs: [
    { date: '2026-10-05', startTime: '14:00', endTime: '15:00', recorderName: '王小明', tags: { interactionType: '現場介紹', rating: 'A意願高', visitors: '3' } },
    { date: '2026-10-08', recorderName: '王小明', tags: { interactionType: '電話' } },
  ] },
  { id: 'c3', projectId: 'p1', phone: '0911000003', latestName: '客戶丙', activeSalesName: '李小華', latestSalesPhone: '0901', profile: profile(), submissions: [], interactionLogs: [
    { date: '2026-10-20', startTime: '10:00', endTime: '10:30', recorderName: '李小華', tags: { interactionType: '現場介紹', visitors: '2' } },
  ] },
];
export const leads = [
  { id: 'l1', name: '名單甲', phone: '0922000001', source: 'FB', budget: '1500萬', assignedName: '王小明', status: '未接', date: '2026/10/01', statusText: '✨ 全新名單' },
  { id: 'l2', name: '名單乙', phone: '0922000002', source: '臉書廣告', assignedName: '王小明', status: '不考慮', reason: '總價', date: '2026/10/02' },
  { id: 'l3', name: '名單丙', phone: '0922000003', source: 'LINE', assignedName: '李小華', status: '', date: '2026/09/15' },
];
export const reportLogs = [
  { leadId: 'l1', status: '未接', createdBy: '王小明', createdAt: '2026-10-03T02:00:00.000Z' },
  { leadId: 'l2', status: '未接', createdBy: '王小明', createdAt: '2026-10-03T03:00:00.000Z' },
  { leadId: 'l2', status: '不考慮', reason: '總價', createdBy: '櫃台', createdAt: '2026-10-04T03:00:00.000Z' },
  { leadId: '已刪除', status: '未接', createdBy: '王小明', createdAt: '2026-10-04T03:00:00.000Z' },
];`;

const entry = `import { createApp, h, ref, reactive } from 'vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import 'vuetify/styles'; import '@mdi/font/css/materialdesignicons.css';
import CustomerPivotDialog from '/src/components/pivot/CustomerPivotDialog.vue';
import LeadPivotDialog from '/src/components/pivot/LeadPivotDialog.vue';
import { customerList, settings, fullData, leads, reportLogs } from '/pivot-fixtures.js';
const q = new URLSearchParams(location.search);
const mode = q.get('mode') || 'customer';
const isSales = q.get('role') === 'sales';
window.__user = isSales ? { name: '王小明', key: '0900' } : { name: '櫃台', key: '0999' };
window.__fullData = fullData;
window.__events = [];
const state = reactive({ open: true, reportLogs: [], reportsLoading: false });
createApp({ render: () => h(components.VApp, null, { default: () => (mode === 'customer'
  ? h(CustomerPivotDialog, {
      modelValue: state.open, 'onUpdate:modelValue': v => { state.open = v; },
      projectId: 'p1', projectName: '森之丘', customerList: isSales ? customerList.filter(c => c['銷售人員'] === '王小明') : customerList,
      settings, canSeeAll: !isSales, systems: isSales ? [] : ['客資系統-櫃台'],
      onOpenCustomer: e => window.__events.push(['open-customer', e]),
    })
  : h(LeadPivotDialog, {
      modelValue: state.open, 'onUpdate:modelValue': v => { state.open = v; },
      projectId: 'p1', projectName: '森之丘', leads: isSales ? leads.filter(l => l.assignedName === '王小明') : leads,
      reportLogs: state.reportLogs, reportsLoading: state.reportsLoading, statusOptions: ['不考慮', '已約賞屋', '空號', '未接'],
      canManagePresets: !isSales,
      onLoadReports: () => { window.__events.push(['load-reports']); state.reportsLoading = true; setTimeout(() => { state.reportLogs = reportLogs; state.reportsLoading = false; }, 50); },
      onOpenLead: l => window.__events.push(['open-lead', l.id]),
    })) }) }).use(createVuetify({ components, directives })).mount('#app');`;

const cacheDir = path.join(root, 'node_modules/.vite-harness-pivot');
const server = await createServer({
  root, configFile: false, cacheDir, logLevel: 'warn',
  optimizeDeps: { entries: [], noDiscovery: true, include: ['vue', 'vuetify', 'vuetify/components', 'vuetify/directives', 'date-fns', 'xlsx-js-style', 'jspdf', 'html2canvas'] },
  server: { host: '127.0.0.1', port: 0 },
  resolve: { alias: [{ find: '@', replacement: path.join(root, 'src') }] },
  plugins: [{
    name: 'pivot-fixtures', enforce: 'pre',
    resolveId(id) {
      const key = Object.keys(mocks).find(k => id === k || (k.startsWith('@/') && id === path.join(root, 'src', k.slice(2))));
      if (key) return `\0mock:${key}`;
      if (id === '/pivot-entry.js') return '\0entry';
      if (id === '/pivot-fixtures.js') return '\0fixtures';
    },
    load(id) {
      if (id === '\0entry') return entry;
      if (id === '\0fixtures') return fixtures;
      if (id.startsWith('\0mock:')) return mocks[id.slice(6)];
    },
    configureServer(s) {
      s.middlewares.use((req, res, next) => {
        if (req.url.startsWith('/pivot-test')) {
          res.setHeader('Content-Type', 'text/html');
          res.end('<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><div id="app"></div><script type="module" src="/pivot-entry.js"></script>');
        } else next();
      });
    },
  }, vue()],
});
await server.listen();

const tableOf = (page) => page.evaluate(() => [...document.querySelectorAll('.dpv-table-wrap table tr')]
  .map(tr => [...tr.children].map(c => c.innerText.trim().replace(/\s+/g, ' '))));
const clickText = (page, text, scope = '.v-overlay-container') => page.evaluate((t, s) => {
  const el = [...document.querySelectorAll(`${s} button, ${s} .v-list-item`)].find(b => b.offsetParent !== null && b.innerText.trim() === t);
  if (!el) throw new Error(`找不到按鈕：${t}`);
  el.click();
}, text, scope);
const hasButton = (page, text) => page.evaluate((t) => [...document.querySelectorAll('.v-overlay-container button')]
  .some(b => b.offsetParent !== null && b.innerText.trim() === t), text);
const settle = (page) => page.evaluate(() => new Promise(r => setTimeout(r, 120)));
const shot = async (page, name) => { if (shotDir) await page.screenshot({ path: path.join(shotDir, `${name}.png`) }); };

async function dropField(page, zoneTitle, key) {
  await page.evaluate((title, k) => {
    const zone = [...document.querySelectorAll('.dpv-zone')].find(z => z.querySelector('.dpv-zone-title')?.innerText.trim() === title);
    const dt = new DataTransfer();
    dt.setData('text/plain', k);
    zone.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
  }, zoneTitle, key);
  await settle(page);
}
async function setDate(page, index, value) {
  await page.evaluate((i, v) => {
    const input = document.querySelectorAll('.dpv-zone input[type="date"]')[i];
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, v);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, index, value);
  await settle(page);
}

let browser;
const errors = [];
try {
  if (shotDir) await mkdir(shotDir, { recursive: true });
  browser = await puppeteer.launch({ executablePath, headless: true });
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  const newPage = async (width, height) => {
    const page = await browser.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text())) errors.push(m.text()); if (m.type() === 'warn' && /Vue warn/.test(m.text())) errors.push(m.text()); });
    await page.setRequestInterception(true);
    page.on('request', r => (r.url().startsWith(base) || r.url().startsWith('data:') || r.url().startsWith('blob:') || r.url().startsWith('about:') ? r.continue() : r.abort()));
    await page.setViewport({ width, height });
    return page;
  };

  // ---------- 客戶資料（櫃台）
  let page = await newPage(1500, 900);
  await page.goto(`${base}/pivot-test?mode=customer`);
  await page.waitForSelector('.dpv-card');
  await page.waitForSelector('.dpv-table-wrap table');
  let t = await tableOf(page);
  assert.deepEqual(t[0], ['銷售人員', 'A意願高', 'B有機會', '（未填寫）', '總計'], '預設：列＝銷售人員、欄＝等級');
  assert.deepEqual(t[1], ['客戶數', '客戶數', '客戶數', '客戶數']);
  assert.deepEqual(t[2], ['總計', '2', '1', '1', '4'], '客戶數不重複，已刪除不算');
  assert.deepEqual(t[3], ['王小明', '1', '1', '1', '3']);
  assert.deepEqual(t[4], ['李小華', '2', '0', '0', '2']);
  assert.match(await page.$eval('.dpv-title-bar', e => e.innerText), /森之丘 客戶資料透視/);
  assert.match(await page.$eval('.dpv-title-bar', e => e.innerText), /5 筆/, '筆數與列表相同');
  const fieldLabels = await page.$$eval('.dpv-field-label', els => els.map(e => e.innerText));
  for (const label of ['姓名', '電話', '購屋動機', '年齡', '聯絡電話', '任職公司']) assert(fieldLabels.includes(label), `缺少欄位：${label}`);
  await shot(page, 'customer-desktop');

  // 日期範圍：拜訪日期起訖，沒有拜訪日期的不算
  await setDate(page, 0, '2026-10-01');
  t = await tableOf(page);
  assert.equal(t[2].at(-1), '2', '10 月後拜訪的客戶');
  await page.evaluate(() => [...document.querySelectorAll('.dpv-zone .v-chip')].find(c => c.innerText.trim() === '清除').click());
  await settle(page);
  assert.equal((await tableOf(page))[2].at(-1), '4');

  // 點儲存格看明細，再點一筆開客戶
  await page.evaluate(() => {
    const row = [...document.querySelectorAll('.dpv-table-wrap tbody tr')].find(tr => tr.innerText.includes('李小華'));
    row.children[1].click();
  });
  await page.waitForSelector('.dpv-drill-table');
  await settle(page);
  const drill = await page.$$eval('.dpv-drill-table tbody tr', trs => trs.map(tr => tr.innerText));
  assert.equal(drill.length, 2);
  assert.match(drill[0], /客戶丙/, '拜訪日新到舊');
  await shot(page, 'customer-drill');
  await page.evaluate(() => document.querySelector('.dpv-drill-table tbody tr').click());
  assert.deepEqual(await page.evaluate(() => window.__events.at(-1)), ['open-customer', { docId: 'c3', salesName: '李小華' }]);
  await clickText(page, '關閉');
  await settle(page);

  // 拖曳欄位到列：多層
  await dropField(page, '列', 'p:age');
  t = await tableOf(page);
  assert.deepEqual(t[0].slice(0, 2), ['銷售人員', '年齡']);
  assert.deepEqual(t[3].slice(0, 2), ['王小明', '31-40'], 'profile 年齡');

  // 切到洽談紀錄：才載入，失敗可重試
  await clickText(page, '洽談紀錄');
  await page.waitForFunction(() => window.apiCalls.length === 1);
  assert.deepEqual(await page.evaluate(() => window.apiCalls[0]), ['p1', '0999', ['客資系統-櫃台']]);
  await settle(page);
  assert.match(await page.$eval('.dpv-pane-result', e => e.innerText), /載入資料中/);
  await page.evaluate(() => window.failFull(new Error('boom')));
  await settle(page);
  assert.match(await page.$eval('.dpv-pane-result', e => e.innerText), /洽談紀錄載入失敗/);
  await clickText(page, '重試');
  await page.waitForFunction(() => window.apiCalls.length === 2);
  await page.evaluate(() => window.finishFull(window.__fullData));
  await settle(page);
  t = await tableOf(page);
  assert.deepEqual(t[0], ['負責銷售', '現場介紹', '電話', '總計'], '洽談紀錄預設版面');
  assert.deepEqual(t[2], ['總計', '2', '1', '3']);
  assert.deepEqual(t[3], ['王小明', '1', '1', '2']);

  // 值：數值欄位加總／平均
  await dropField(page, '值', 'visitors');
  t = await tableOf(page);
  assert.ok(t[1].includes('來客人數·加總'));
  await page.evaluate(() => [...document.querySelectorAll('.dpv-agg-toggle button')].find(b => b.innerText.trim() === '平均').click());
  await settle(page);
  t = await tableOf(page);
  assert.ok(t[1].includes('來客人數·平均'));
  assert.equal(t[2].at(-1), '2.5', '來客 (3+2)/2');
  await shot(page, 'customer-logs');

  // 明細：洽談紀錄帶客戶 id
  await page.evaluate(() => document.querySelector('.dpv-table-wrap tbody tr td').click());
  await page.waitForSelector('.dpv-drill-table tbody tr');
  await settle(page);
  await page.evaluate(() => document.querySelector('.dpv-drill-table tbody tr').click());
  assert.equal((await page.evaluate(() => window.__events.at(-1)))[1].docId, 'c1');
  await clickText(page, '關閉');
  await settle(page);

  // 方案：存在洽談紀錄，切回客戶後套用會切回資料集；未改動不顯示 *
  await clickText(page, '儲存方案');
  await settle(page);
  await page.evaluate(() => {
    const input = [...document.querySelectorAll('.v-overlay--active input')].find(i => i.closest('.v-card')?.innerText.includes('方案名稱'));
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, '來客分析');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await settle(page);
  await page.evaluate(() => {
    const card = [...document.querySelectorAll('.v-overlay--active .v-card')].find(c => c.innerText.includes('方案名稱'));
    [...card.querySelectorAll('button')].find(b => b.innerText.trim() === '儲存').click();
  });
  await page.waitForFunction(() => window.toasts.some(x => x[1] === '方案已儲存'));
  await settle(page);
  const saved = await page.evaluate(() => window.presetStores.customerPivotPresets.list[0]);
  assert.equal(saved.settings.dataset, 'logs');
  let presetBtn = await page.evaluate(() => [...document.querySelectorAll('.dpv-title-bar button')].map(b => b.innerText.trim()).find(x => x.includes('來客分析')));
  assert.equal(presetBtn, '來客分析', '剛存好不是修改狀態（Firestore 鍵順序不影響比對）');

  await clickText(page, '客戶');
  await settle(page);
  t = await tableOf(page);
  assert.equal(t[0][0], '銷售人員', '切回客戶還原自己的設定');
  assert.deepEqual(t[0].slice(0, 2), ['銷售人員', '年齡'], '各資料集設定分開記憶');
  await page.evaluate(() => [...document.querySelectorAll('.dpv-title-bar button')].find(b => b.innerText.includes('方案') && !b.innerText.includes('儲存')).click());
  await settle(page);
  await page.evaluate(() => [...document.querySelectorAll('.v-overlay--active .v-list-item')].find(i => i.innerText.includes('來客分析')).click());
  await settle(page);
  t = await tableOf(page);
  assert.equal(t[0][0], '負責銷售', '套用方案切回洽談紀錄');
  assert.ok(t[1].includes('來客人數·平均'));

  // 匯出
  await page.evaluate(() => { window.__clip = null; navigator.clipboard.writeText = async (x) => { window.__clip = x; }; });
  await clickText(page, '複製表格');
  await page.waitForFunction(() => window.__clip);
  assert.match(await page.evaluate(() => window.__clip), /負責銷售/);
  await clickText(page, '匯出EXCEL');
  await page.waitForFunction(() => window.toasts.some(x => x[1] === '已匯出 Excel！'));
  await clickText(page, '匯出PDF');
  await page.waitForSelector('.dpv-pdf-frame');
  const frame = await (await page.$('.dpv-pdf-frame')).contentFrame();
  await frame.waitForSelector('body[data-ready="1"]');
  assert.match(await frame.$eval('body', e => e.innerText), /森之丘 - 來客分析/);
  await page.close();

  // 記憶：重新開啟回到上次資料集與設定
  page = await newPage(1500, 900);
  await page.goto(`${base}/pivot-test?mode=customer`);
  await page.waitForFunction(() => window.apiCalls?.length === 1);
  await page.evaluate(() => window.finishFull(window.__fullData));
  await page.waitForSelector('.dpv-table-wrap table');
  t = await tableOf(page);
  assert.equal(t[0][0], '負責銷售', '回到上次資料集');
  assert.ok(t[1].includes('來客人數·平均'), '回到上次設定');
  await page.evaluate(() => localStorage.clear());
  await page.close();

  // ---------- 客戶資料（銷售）
  page = await newPage(1500, 900);
  await page.goto(`${base}/pivot-test?mode=customer&role=sales`);
  await page.waitForSelector('.dpv-table-wrap table');
  t = await tableOf(page);
  assert.equal(t.filter(r => r[0] === '李小華').length, 0, '銷售只看自己的');
  for (const label of ['儲存方案', '複製表格', '匯出EXCEL', '匯出PDF']) {
    assert.equal(await hasButton(page, label), false, `銷售不可用：${label}`);
  }
  await clickText(page, '洽談紀錄');
  await page.waitForFunction(() => window.apiCalls.length === 1);
  await page.evaluate(() => window.finishFull(window.__fullData));
  await settle(page);
  t = await tableOf(page);
  assert.deepEqual(t[2], ['總計', '1', '1', '2'], '洽談紀錄也只算自己的客戶');
  await page.evaluate(() => localStorage.clear());
  await page.close();

  // ---------- 聯絡名單（櫃台）
  page = await newPage(1500, 900);
  await page.goto(`${base}/pivot-test?mode=lead`);
  await page.waitForSelector('.dpv-table-wrap table');
  t = await tableOf(page);
  assert.deepEqual(t[0], ['分配銷售', '未處理', '不考慮', '未接', '總計']);
  assert.deepEqual(t[2], ['總計', '1', '1', '1', '3']);
  assert.deepEqual(t[3], ['王小明', '0', '1', '1', '2']);
  assert.match(await page.$eval('.dpv-title-bar', e => e.innerText), /森之丘 聯絡名單透視/);
  await shot(page, 'lead-desktop');
  await dropField(page, '列', 'source');
  t = await tableOf(page);
  assert.ok(t.some(r => r[0] === '王小明' && r[1] === 'FB' && r.at(-1) === '2'), '臉書廣告與 FB 同一來源');
  await page.evaluate(() => [...document.querySelectorAll('.dpv-title-bar button')].find(b => b.innerText.includes('清除全部')).click());
  await settle(page);
  assert.equal(await hasButton(page, '匯出EXCEL'), true);
  await dropField(page, '列', 'formMonth');
  t = await tableOf(page);
  assert.deepEqual(t.map(r => r[0]), ['填表月份', '2026-09', '2026-10'], '沒有值時只列組合，月份依時間序');

  await clickText(page, '回報紀錄');
  await page.waitForFunction(() => window.__events.some(e => e[0] === 'load-reports'));
  await settle(page);
  t = await tableOf(page);
  assert.deepEqual(t[0], ['回報人', '不考慮', '未接', '總計']);
  assert.deepEqual(t[2], ['總計', '1', '2', '3'], '已刪除名單的回報不算');
  await page.evaluate(() => {
    const row = [...document.querySelectorAll('.dpv-table-wrap tbody tr')].find(tr => tr.innerText.includes('櫃台'));
    row.children[0].click();
  });
  await page.waitForSelector('.dpv-drill-table tbody tr');
  await settle(page);
  assert.match(await page.$eval('.dpv-drill-table tbody tr', e => e.innerText), /名單乙/);
  await page.evaluate(() => document.querySelector('.dpv-drill-table tbody tr').click());
  assert.deepEqual(await page.evaluate(() => window.__events.at(-1)), ['open-lead', 'l2']);
  await page.evaluate(() => localStorage.clear());
  await page.close();

  // ---------- 聯絡名單（銷售）：可匯出、不可存方案、只算自己的回報
  page = await newPage(1500, 900);
  await page.goto(`${base}/pivot-test?mode=lead&role=sales`);
  await page.waitForSelector('.dpv-table-wrap table');
  assert.equal(await hasButton(page, '匯出EXCEL'), true, '名單匯出沿用現況');
  assert.equal(await hasButton(page, '儲存方案'), false);
  await clickText(page, '回報紀錄');
  await page.waitForFunction(() => window.__events.some(e => e[0] === 'load-reports'));
  await settle(page);
  t = await tableOf(page);
  assert.equal(t[2].at(-1), '3', 'l1、l2 共 3 筆回報');
  await page.evaluate(() => localStorage.clear());
  await page.close();

  // ---------- 姓名、電話、其他客戶欄位都可當列
  page = await newPage(1500, 900);
  await page.goto(`${base}/pivot-test?mode=customer`);
  await page.waitForSelector('.dpv-table-wrap table');
  await page.evaluate(() => [...document.querySelectorAll('.dpv-title-bar button')].find(b => b.innerText.includes('清除全部')).click());
  await settle(page);
  await dropField(page, '列', 'name');
  await dropField(page, '列', 'phone');
  await dropField(page, '值', '__customers__');
  t = await tableOf(page);
  assert.deepEqual(t[0], ['姓名', '電話', '客戶數']);
  assert.ok(t.some(r => r[0] === '客戶甲' && r[1] === '0911000001' && r[2] === '1'), '同客戶多銷售併成一列');
  await dropField(page, '列', 'p:company');
  await dropField(page, '列', 'auto:家庭成員');
  await dropField(page, '列', 'other:phone');
  t = await tableOf(page);
  const jia = t.find(r => r[0] === '客戶甲');
  assert.deepEqual(jia.slice(2, 5), ['新公司', '夫妻,兩小孩', '0933000001'], '任職公司取最新、自訂欄位不拆逗號、其他聯絡人');
  await dropField(page, '列', 'lastContent');
  const long = await page.evaluate(() => {
    const td = [...document.querySelectorAll('.dpv-table-wrap td.dpv-cell-long')].find(c => c.innerText.includes('三房'));
    const r = td.getBoundingClientRect();
    return { lines: td.innerText.split('\n').length, w: r.width, h: r.height, overflow: td.scrollWidth > td.clientWidth + 1 };
  });
  assert.ok(long.w <= 421, '長文字不撐寬表格');
  assert.equal(long.overflow, false, '長文字不被截斷');
  assert.ok(long.lines >= 2, '保留換行');
  t = await tableOf(page);
  assert.equal(t[0].at(-1), '客戶數', '多層列時值欄仍在表格內');
  const reach = await page.evaluate(async () => {
    const wrap = document.querySelector('.dpv-table-wrap');
    const th = [...wrap.querySelectorAll('thead th')].at(-1);
    const first = wrap.querySelector('thead th');
    const scrollable = wrap.scrollWidth > wrap.clientWidth;
    wrap.scrollLeft = wrap.scrollWidth;
    await new Promise(r => requestAnimationFrame(r));
    const box = wrap.getBoundingClientRect();
    return { scrollable, valueRight: th.getBoundingClientRect().right, boxRight: box.right, firstLeft: first.getBoundingClientRect().left, boxLeft: box.left };
  });
  assert.ok(reach.scrollable, '表格超出時由外層橫向捲動，捲軸不會落在長表底部');
  assert.ok(reach.valueRight <= reach.boxRight + 1, '捲到最右邊看得到值欄');
  assert.ok(Math.abs(reach.firstLeft - reach.boxLeft) <= 1, '第一欄固定在左側');
  await shot(page, 'customer-name-rows');
  await page.evaluate(() => localStorage.clear());
  await page.close();

  // ---------- 手機
  page = await newPage(390, 844);
  await page.goto(`${base}/pivot-test?mode=customer`);
  await page.waitForSelector('.dpv-table-wrap table');
  await settle(page);
  assert.equal(await page.$('.dpv-pane-fields'), null, '手機不顯示拖曳欄位清單');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '手機頁面不可橫向捲動');
  const overflowed = await page.evaluate(() => {
    const bar = document.querySelector('.dpv-title-bar');
    const r = bar.getBoundingClientRect();
    return [...bar.querySelectorAll('button')].some(b => b.getBoundingClientRect().right > r.right + 1);
  });
  assert.equal(overflowed, false, '手機標題列按鈕不可超出螢幕');
  const titleLeft = await page.$eval('.dpv-title-stack', e => e.getBoundingClientRect().left);
  assert(titleLeft >= 50, '標題避開全站漢堡鈕');
  await shot(page, 'customer-mobile');
  await page.evaluate(() => document.querySelector('.dpv-pane-editor').scrollIntoView());
  await settle(page);
  await shot(page, 'customer-mobile-settings');
  await page.evaluate(() => localStorage.clear());
  await page.close();

  // 「boom」是上面故意模擬的載入失敗
  assert.deepEqual(errors.filter(e => !e.includes('boom')), [], '瀏覽器主控台不可有錯誤');
  console.log('data-pivot browser tests passed');
} finally {
  await browser?.close();
  await server.close();
  await rm(cacheDir, { recursive: true, force: true });
}
