// 本機 production build 冒煙驗證；封鎖外部請求，不使用或修改正式資料。
// BROWSER_EXECUTABLE=/path/to/chromium npm run verify:startup
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { access } from 'node:fs/promises';
import puppeteer from 'puppeteer-core';
import { preview } from 'vite';

const candidates = [process.env.BROWSER_EXECUTABLE,
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'].filter(Boolean);
let executablePath;
for (const candidate of candidates) {
  if (await access(candidate).then(() => true, () => false)) { executablePath = candidate; break; }
}
assert(executablePath, '請以 BROWSER_EXECUTABLE 指定 Chromium 瀏覽器');
const server = await preview({ preview: { host: '127.0.0.1', port: 0, open: false } });
const base = `http://127.0.0.1:${server.httpServer.address().port}`;
const browser = await puppeteer.launch({ executablePath, headless: true });
const results = [];

async function newPage(width = 1280, intercept) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width, height: 900 });
  const errors = [], assets = new Set();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (/Failed to resolve (component|directive)/.test(message.text())) errors.push(message.text());
  });
  page.on('dialog', dialog => dialog.dismiss());
  await page.setRequestInterception(true);
  page.on('request', async request => {
    if (request.url().startsWith(base)) {
      if (request.url().includes('/assets/')) assets.add(new URL(request.url()).pathname);
      if (intercept && await intercept(request)) return;
      await request.continue();
    } else await request.abort();
  });
  return { context, page, errors, assets };
}

try {
  for (const width of [1280, 390]) {
    for (const [route, selector] of [
      ['/login', 'input[type="tel"]'], ['/', '.lp-nav'],
      ['/privacy', '.v-main'], ['/terms', '.v-main'],
      ['/trial', 'input'], ['/booking/startup-test', '.v-main .v-container'],
      ['/s/startup-test', '.v-main'],
    ]) {
      const { context, page, errors, assets } = await newPage(width);
      try {
        await page.goto(`${base}/#${route}`, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector(selector, { visible: true, timeout: 15000 });
        await page.waitForFunction(() => !document.getElementById('startup-screen'), { timeout: 15000 });
        if (route === '/login') {
          await page.type('input[type="tel"]', '0912345678');
          assert.equal(await page.$eval('input[type="tel"]', el => el.value), '0912345678');
          await page.evaluate(() => [...document.querySelectorAll('button')].find(el => el.textContent.includes('忘記密碼')).click());
          await page.waitForSelector('.v-dialog input', { visible: true });
          await page.evaluate(() => [...document.querySelectorAll('.v-dialog button')].find(el => el.textContent.includes('取消')).click());
          await page.waitForSelector('.v-dialog input', { hidden: true });
        }
        assert.deepEqual(errors, [], `${route}: 瀏覽器執行錯誤`);
        assert(![...assets].some(url => /xlsx|exceljs|ag-grid|pdfjs|tiptap/i.test(url)), `${route}: 不應載入功能套件`);
        if (route !== '/login') assert(![...assets].some(url => /DefaultLayout/.test(url)), `${route}: 不應載入管理版型`);
        if (route === '/login' && width === 390) await page.screenshot({ path: path.join(os.tmpdir(), 'anxi-login-mobile.png') });
        if (route === '/' && width === 1280) {
          await page.waitForFunction(() => [...document.querySelectorAll('.lp-hero__line')].every(el => getComputedStyle(el).opacity === '1'));
          await page.screenshot({ path: path.join(os.tmpdir(), 'anxi-public-desktop.png') });
        }
        results.push({ route, width, status: 'PASS', assetRequests: assets.size });
      } finally { await context.close(); }
    }
  }

  const transition = await newPage();
  await transition.page.goto(`${base}/#/`, { waitUntil: 'domcontentloaded' });
  await transition.page.waitForSelector('.lp-nav', { visible: true });
  await transition.page.waitForFunction(() => !document.getElementById('startup-screen'));
  await transition.page.click('.lp-nav__login');
  await transition.page.waitForSelector('input[type="tel"]', { visible: true });
  await transition.page.evaluate(() => { location.hash = '#/privacy'; });
  await transition.page.waitForFunction(() => document.body.innerText.includes('隱私權政策'));
  assert.deepEqual(transition.errors, []);
  await transition.context.close();
  results.push({ scenario: '公開頁與登入頁切換版型', status: 'PASS' });

  // 主程式尚未下載時也能看到 HTML 提示；下載完成才移除提示。
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const slow = await newPage(390, async request => {
    if (/\/assets\/index-[^/]+\.js$/.test(request.url())) { await gate; await request.continue(); return true; }
  });
  const navigation = slow.page.goto(`${base}/#/login`, { waitUntil: 'domcontentloaded' });
  await slow.page.waitForSelector('#startup-screen', { visible: true });
  assert.match(await slow.page.$eval('#startup-message', el => el.textContent), /正在載入/);
  release();
  await navigation;
  await slow.page.waitForSelector('input[type="tel"]', { visible: true });
  await slow.page.waitForFunction(() => !document.getElementById('startup-screen'));
  assert.deepEqual(slow.errors, []);
  await slow.context.close();
  results.push({ scenario: '慢速載入提示與完成後移除', status: 'PASS' });

  const failed = await newPage(390, async request => {
    if (/\/assets\/index-[^/]+\.js$/.test(request.url())) { await request.abort(); return true; }
  });
  await failed.page.goto(`${base}/?source=test#/login`, { waitUntil: 'domcontentloaded' });
  await failed.page.waitForSelector('#startup-retry', { visible: true, timeout: 20000 });
  await Promise.all([
    failed.page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    failed.page.click('#startup-retry'),
  ]);
  const retryUrl = new URL(failed.page.url());
  assert.equal(retryUrl.searchParams.get('source'), 'test');
  assert(retryUrl.searchParams.has('_v'));
  assert.equal(retryUrl.hash, '#/login');
  await failed.context.close();
  results.push({ scenario: '下載失敗可重試並保留入口參數', status: 'PASS' });

  const updated = await newPage(1280, async request => {
    if (new URL(request.url()).pathname === '/manifest.json') {
      await request.respond({ contentType: 'application/json', body: JSON.stringify({ version: 'test-next-version' }) });
      return true;
    }
  });
  await updated.page.goto(`${base}/?source=public#/privacy`, { waitUntil: 'domcontentloaded' });
  await updated.page.waitForFunction(() => document.body.innerText.includes('立即更新'));
  assert.match(await updated.page.$eval('body', el => el.innerText), /系統已更新/);
  await Promise.all([
    updated.page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    updated.page.evaluate(() => [...document.querySelectorAll('button')].find(el => el.textContent.includes('立即更新')).click()),
  ]);
  assert.equal(new URL(updated.page.url()).searchParams.get('source'), 'public');
  assert.equal(new URL(updated.page.url()).hash, '#/privacy');
  await updated.context.close();
  results.push({ scenario: '公開頁版本提示與更新', status: 'PASS' });
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
