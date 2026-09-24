// Isolated UI regression; no production API calls or customer data.
// BROWSER_EXECUTABLE=/path/to/chromium node scripts/tests/customer-form-share-browser.mjs
import assert from 'node:assert/strict';
import { access, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';
import vue from '@vitejs/plugin-vue';
import puppeteer from 'puppeteer-core';
import { customerFormProjects, customerFormUrl } from '../../src/utils/customerFormLink.js';

const root = path.resolve(import.meta.dirname, '../..');
const permissions = {
  a: { projectName: '森之丘', systems: ['客資系統-銷售'] },
  b: { projectName: '暖暖青禾', systems: ['客資系統-櫃台'] },
  hidden: { projectName: '無權限建案', systems: ['銷售系統'] },
};
assert.deepEqual(customerFormProjects(permissions).map(p => p.id).sort(), ['a', 'b']);
assert.equal(customerFormProjects(null).length, 0);
assert.equal(customerFormProjects({ bad: null }).length, 0);
assert.equal(customerFormUrl('https://example.test/app/?old=1#/old', 'a', { key: '0900000000', name: '王 小明&測試' }), 'https://example.test/app/#/customer-data-sheet/a?sp=0900000000&sn=%E7%8E%8B+%E5%B0%8F%E6%98%8E%26%E6%B8%AC%E8%A9%A6');
assert.equal(customerFormUrl('https://example.test', 'a', {}), '');
const routes = await readFile(path.join(root, 'src/router/index.js'), 'utf8');
assert.match(routes, /path: '\/customer-form-share',[\s\S]*?requiresAuth: true/);
assert.match(routes, /path: '\/customer-data-sheet\/:projectId\/:docId\?'/);
assert.match(await readFile(path.join(root, 'src/layouts/DefaultLayout.vue'), 'utf8'), /title="客戶資料表"[^\n]*customer-form-share/);

const candidates = [process.env.BROWSER_EXECUTABLE, '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium'].filter(Boolean);
let executablePath;
for (const candidate of candidates) if (await access(candidate).then(() => true, () => false)) { executablePath = candidate; break; }
assert(executablePath, 'Set BROWSER_EXECUTABLE to a Chromium browser');
const mocks = {
  '@/store/user': `import { reactive } from 'vue'; const store = reactive({ user: { key: '0900000000', name: '王小明', permissions: ${JSON.stringify(permissions)} } }); window.shareUser = store; export const useUserStore = () => store;`,
  '@/store/projectStore': `export const useProjectStore = () => ({ projectsList: [] });`,
};
const entry = `import { createApp, h } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import Page from '/src/views/CustomerFormShare.vue';
import jsQR from 'jsqr';
import { customerFormQr } from '/src/utils/customerFormLink.js';
window.jsQR = jsQR; window.makeQr = customerFormQr;
const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: Page }] });
await router.push('/');
const app = createApp({ render: () => h(components.VApp, null, { default: () => h(Page) }) });
app.use(router).use(createVuetify({ components })).mount('#app');
window.unmountShare = () => app.unmount();`;
const server = await createServer({
  root, configFile: false,
  optimizeDeps: { entries: [], noDiscovery: true, include: ['vue', 'vue-router', 'vuetify', 'vuetify/components', 'qrcode', 'jsqr', 'three'] },
  server: { host: '127.0.0.1', port: 0 },
  resolve: { alias: [{ find: '@', replacement: path.join(root, 'src') }] },
  plugins: [{ name: 'share-fixtures', enforce: 'pre',
    resolveId(id) {
      const key = Object.keys(mocks).find(k => id === k || id === path.join(root, 'src', k.slice(2)));
      if (key) return '\0mock:' + key;
      if (id === '/share-test-entry.js') return '\0entry';
    },
    load(id) { if (id === '\0entry') return entry; if (id.startsWith('\0mock:')) return mocks[id.slice(6)]; },
    configureServer(s) { s.middlewares.use((req, res, next) => {
      if (req.url === '/share-test') { res.setHeader('Content-Type', 'text/html'); res.end('<meta name="viewport" content="width=device-width, initial-scale=1"><div id="app"></div><script type="module" src="/share-test-entry.js"></script>'); } else next();
    }); },
  }, vue()],
});
await server.listen();
let browser;
try {
  browser = await puppeteer.launch({ executablePath, headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  await page.setRequestInterception(true);
  page.on('request', request => request.url().startsWith(base) || request.url().startsWith('data:') ? request.continue() : request.abort());
  await page.setViewport({ width: 1440, height: 1080, deviceScaleFactor: 1 });
  await page.goto(`${base}/share-test`);
  await page.waitForSelector('#share-project');
  assert.equal(await page.$$eval('#share-project option', options => options.length), 3);
  assert.equal(await page.$('.share-qr'), null);
  await page.select('#share-project', 'a');
  await page.waitForSelector('.share-qr');
  const url = await page.$eval('.open-form', element => element.href);
  assert.match(url, /customer-data-sheet\/a\?sp=0900000000&sn=/);
  const decoded = await page.evaluate(() => {
    const img = document.querySelector('.share-qr');
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 840;
    const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, 840, 840);
    return window.jsQR(ctx.getImageData(0, 0, 840, 840).data, 840, 840)?.data;
  });
  assert.equal(decoded, url, 'QR with central nameplate must decode to displayed URL');
  // Exercise dense QR versions, long names, and the rendered mobile size.
  await page.evaluate(async () => {
    for (const name of ['王小明', '陳王歐陽安安測試用戶', 'Alex & 王小明']) {
      for (const project of ['森之丘', '富宇森之樹花園御邸第一期']) {
        const url = 'https://example.test/anxi-app/#/customer-data-sheet/project-123456789?sp=0900000000&sn=' + encodeURIComponent(name);
        const image = new Image(); image.src = await window.makeQr(url, project, name); await image.decode();
        for (const size of [840, 280, 250]) {
          const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
          const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0, size, size);
          if (window.jsQR(ctx.getImageData(0, 0, size, size).data, size, size)?.data !== url) throw new Error('QR decode failed: ' + name + '/' + project + '/' + size);
        }
      }
    }
  });
  assert(await page.$('.clay-neighborhood canvas'), 'Three.js scene should initialize');
  await page.click('.motion-button');
  assert.equal(await page.$eval('.motion-button', e => e.getAttribute('aria-pressed')), 'true');
  await mkdir(path.join(root, 'docs/design-previews'), { recursive: true });
  await page.screenshot({ path: path.join(root, 'docs/design-previews/customer-form-share-desktop.png'), fullPage: true });
  await browser.defaultBrowserContext().overridePermissions(base, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);
  await page.click('.share-actions button');
  await page.waitForFunction(() => document.body.innerText.includes('已複製表單連結'));
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), url);
  await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Denied'); } } }); });
  await page.click('.share-actions button');
  await page.waitForFunction(() => document.body.innerText.includes('請手動複製'));
  assert.equal(await page.evaluate(() => document.activeElement.id), 'share-url');
  await page.select('#share-project', 'b');
  await page.waitForFunction(() => document.querySelector('.share-qr') && document.querySelector('.open-form').href.includes('/b?'));
  const download = await page.evaluate(() => {
    let result;
    const click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function() { result = { href: this.href, name: this.download }; };
    document.querySelectorAll('.share-actions button')[1].click();
    HTMLAnchorElement.prototype.click = click;
    return result;
  });
  assert.match(download.name, /暖暖青禾_王小明_客戶資料表\.png/);
  assert.equal(download.href, await page.$eval('.share-qr', image => image.src));
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.waitForFunction(() => document.querySelector('.customer-share').getBoundingClientRect().width === 390);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert(await page.evaluate(() => document.querySelector('.share-url').getBoundingClientRect().bottom <= document.querySelector('.customer-share').getBoundingClientRect().bottom), 'Mobile actions must not be clipped');
  const contentHeight = await page.$eval('.customer-share', element => Math.ceil(element.getBoundingClientRect().height));
  await page.screenshot({ path: path.join(root, 'docs/design-previews/customer-form-share-mobile.png'), clip: { x: 0, y: 0, width: 390, height: contentHeight }, captureBeyondViewport: true });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No mobile horizontal overflow');
  await page.evaluate(() => { window.shareUser.user.permissions = {}; });
  await page.waitForFunction(() => document.body.innerText.includes('目前沒有可分享的建案'));
  assert.equal(await page.$('.share-qr'), null, 'Permission removal clears QR');
  assert.equal(await page.$('.open-form'), null, 'Permission removal clears URL');
  await page.evaluate(() => { window.shareUser.user.permissions = { a: { projectName: '森之丘', systems: ['客資系統-銷售'] } }; window.shareUser.user.name = ''; });
  await page.waitForFunction(() => document.body.innerText.includes('請先完善個人資料'));
  await page.evaluate(() => window.unmountShare());
  assert.equal(await page.$('.clay-neighborhood canvas'), null);
  // WebGL unavailable: functional QR and links must still render.
  await page.evaluateOnNewDocument(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type.startsWith('webgl') ? null : getContext.call(this, type, ...args); };
  });
  await page.reload();
  await page.waitForSelector('#share-project');
  await page.select('#share-project', 'a');
  await page.waitForSelector('.share-qr');
  assert.equal(await page.$('.clay-neighborhood canvas'), null);
  assert.deepEqual(errors, []);
  console.log('PASS: permissions, URLs, QR decoding (19 samples), clipboard, mobile, reduced motion, empty states, WebGL fallback, cleanup.');
} finally {
  await browser?.close();
  await server.close();
}
