// 以正式 build 驗證舊通知真的轉進 LIFF；攔截 LINE 網址，不進行真人登入或發送通知。
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import puppeteer from 'puppeteer-core';
import { preview } from 'vite';
import { leadReportLiffUrl } from '../src/utils/leadReportLink.js';

let executablePath;
for (const candidate of [process.env.BROWSER_EXECUTABLE,
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium'].filter(Boolean)) {
  if (await access(candidate).then(() => true, () => false)) { executablePath = candidate; break; }
}
assert(executablePath, '請指定 BROWSER_EXECUTABLE');
const server = await preview({ preview: { host: '127.0.0.1', port: 0, open: false } });
let browser;
try {
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  browser = await puppeteer.launch({ executablePath, headless: true });
  for (const [url, id] of [
    [`${base}/#/contact?id=legacy-test`, 'legacy-test'],
    [`${base}/?_v=123#/contact?id=a%26b`, 'a&b'],
  ]) {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844 });
    const requests = [], errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (request.isNavigationRequest() && request.frame() === page.mainFrame() && request.url().startsWith('https://liff.line.me/')) {
        requests.push(request.url());
        return request.respond({ status: 200, contentType: 'text/html', body: '<p id="liff-destination">LINE entry</p>' });
      }
      return request.url().startsWith(base) ? request.continue() : request.abort();
    });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#liff-destination');
    assert.deepEqual(requests, [leadReportLiffUrl(id)]);
    assert.deepEqual(errors, []);
    console.log(`PASS: 舊連結 ${id} 在載入登入頁前直接導向 LIFF，ID 完整且只轉址一次。`);
    await page.close();
  }
} finally {
  await browser?.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
