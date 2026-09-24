// Renders the submitted-state envelope animation and checks its resting state; no API calls.
// BROWSER_EXECUTABLE=/path/to/chromium node scripts/tests/customer-form-received-browser.mjs
import assert from 'node:assert/strict';
import { access, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';
import vue from '@vitejs/plugin-vue';
import puppeteer from 'puppeteer-core';

const root = path.resolve(import.meta.dirname, '../..');
const candidates = [process.env.BROWSER_EXECUTABLE, '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium'].filter(Boolean);
let executablePath;
for (const candidate of candidates) if (await access(candidate).then(() => true, () => false)) { executablePath = candidate; break; }
assert(executablePath, 'Set BROWSER_EXECUTABLE to a Chromium browser');

const entry = `import { createApp, h } from 'vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import 'vuetify/styles'; import '@mdi/font/css/materialdesignicons.css';
import Received from '/src/components/CustomerFormReceived.vue';
createApp({ render: () => h(components.VApp, null, { default: () => h(components.VCard, { class: 'ma-4', rounded: 'xl' }, { default: () => h(Received, { onAction: () => { window.actioned = true; } }) }) }) }).use(createVuetify({ components })).mount('#app');`;
const server = await createServer({ root, configFile: false,
  optimizeDeps: { entries: [], noDiscovery: true, include: ['vue', 'vuetify', 'vuetify/components'] },
  server: { host: '127.0.0.1', port: 0 }, resolve: { alias: [{ find: '@', replacement: path.join(root, 'src') }] },
  plugins: [{ name: 'received-fixtures', enforce: 'pre',
    resolveId(id) { if (id === '/received-entry.js') return '\0entry'; },
    load(id) { if (id === '\0entry') return entry; },
    configureServer(s) { s.middlewares.use((req, res, next) => { if (req.url === '/received-test') { res.setHeader('Content-Type', 'text/html'); res.end('<meta name="viewport" content="width=device-width, initial-scale=1"><div id="app"></div><script type="module" src="/received-entry.js"></script>'); } else next(); }); }
  }, vue()],
});
await server.listen();
const browser = await puppeteer.launch({ executablePath, headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/received-test`);
  await page.waitForSelector('.cfr__badge');
  const early = await page.$eval('.cfr__text', el => getComputedStyle(el).opacity);
  assert.equal(early, '0', 'text should be hidden before the envelope closes');
  await new Promise(r => setTimeout(r, 3400));
  const rest = await page.evaluate(() => ({
    badge: getComputedStyle(document.querySelector('.cfr__badge')).transform,
    flapZ: getComputedStyle(document.querySelector('.cfr__flap')).zIndex,
    text: getComputedStyle(document.querySelector('.cfr__text')).opacity,
    title: document.querySelector('.cfr__text h2').textContent,
    subtitle: document.querySelector('.cfr__text p').textContent,
  }));
  assert.equal(rest.badge, 'matrix(1, 0, 0, 1, 0, 0)');
  assert.equal(rest.flapZ, '4', 'closed flap must sit above the letter');
  assert.equal(rest.text, '1');
  assert.equal(rest.title, '已收到您的資料');
  assert.equal(rest.subtitle, '感謝您的填寫');
  await page.click('.cfr__action');
  assert.equal(await page.evaluate(() => window.actioned), true, 'action button must emit');
  assert.deepEqual(errors, []);
  await mkdir(path.join(root, 'docs/design-previews'), { recursive: true });
  await page.screenshot({ path: path.join(root, 'docs/design-previews/customer-form-received-mobile.png'), clip: { x: 0, y: 0, width: 390, height: 520 } });
  console.log('PASS: envelope animation resting state, layer order, copy, action button.');
} finally {
  await browser.close();
  await server.close();
}
