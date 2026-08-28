// 首頁截圖素材擷取（DEMO 建案、TESTA 帳號）
// 用法：node capture.mjs [only=name1,name2]
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'c:/Project/anxi-app/anxi-app';
const OUT = path.join(ROOT, 'src/assets/landing');
const REVIEW = 'C:/Users/user/AppData/Local/Temp/claude/c--Project-anxi-app-anxi-app/b59048d3-eee0-4052-a2c8-582a5b2991ba/scratchpad/review';
const BASE = 'http://localhost:5199';
const PROJECT = 'TESTA';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const DESKTOP = { width: 1600, height: 1000, deviceScaleFactor: 2 };
const MOBILE = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

const SHOTS = [
  { system: 'sales', name: 'sales-grid', url: `/#/sales-control/${PROJECT}`, vp: DESKTOP, wait: 6000 },
  { system: 'sales', name: 'sales-quote', url: `/#/quote-system/${PROJECT}`, vp: DESKTOP, wait: 6000 },
  { system: 'sales', name: 'sales-parking', url: `/#/parking-control/${PROJECT}`, vp: DESKTOP, wait: 6000 },
  { system: 'sales', name: 'sales-mobile', url: `/#/quote-system/${PROJECT}`, vp: MOBILE, wait: 6000 },
  { system: 'customer', name: 'customer-list', url: `/#/customer-management/${PROJECT}`, vp: DESKTOP, wait: 6000 },
  { system: 'customer', name: 'customer-log', url: `/#/lead-distribution/${PROJECT}`, vp: DESKTOP, wait: 6000 },
  { system: 'customer', name: 'vip-form-mobile', url: `/#/vip-form/${PROJECT}`, vp: MOBILE, wait: 5000 },
  { system: 'booking', name: 'booking-calendar', url: `/#/inspection-calendar/${PROJECT}`, vp: DESKTOP, wait: 6000 },
  { system: 'booking', name: 'booking-page-mobile', url: `/#/booking/${PROJECT}`, vp: MOBILE, wait: 5000 },
  { system: 'booking', name: 'booking-batches', url: `/#/viewing-reservation/${PROJECT}`, vp: DESKTOP, wait: 6000 },
  { system: 'inspection', name: 'inspection-record-mobile', url: `/#/inspection-console/${PROJECT}`, vp: MOBILE, wait: 6000 },
  { system: 'inspection', name: 'inspection-tracking', url: `/#/inspection-console/${PROJECT}`, vp: DESKTOP, wait: 6000 },
  { system: 'inspection', name: 'inspection-report', url: `/#/inspection-reports/${PROJECT}`, vp: DESKTOP, wait: 6000 },
  // 首頁自我檢視（不進 assets）
  { system: '_review', name: 'landing-desktop', url: `/#/`, vp: { width: 1440, height: 900, deviceScaleFactor: 1 }, wait: 3000, full: true, noLogin: true },
  { system: '_review', name: 'landing-mobile', url: `/#/`, vp: { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true }, wait: 3000, full: true, noLogin: true },
  { system: '_review', name: 'trial-desktop', url: `/#/trial`, vp: { width: 1440, height: 900, deviceScaleFactor: 1 }, wait: 2500, full: true, noLogin: true },
  { system: '_review', name: 'home-tour', url: `/#/home?tour=1`, vp: { width: 1440, height: 900, deviceScaleFactor: 1 }, wait: 3500, simulateTrial: true, keepFab: true },
  // Hero 佔滿視窗檢視（不同比例）
  { system: '_review', name: 'hero-desktop-1440', url: `/#/`, vp: { width: 1440, height: 900, deviceScaleFactor: 1 }, wait: 2500, noLogin: true },
  { system: '_review', name: 'hero-ultrawide', url: `/#/`, vp: { width: 2560, height: 1080, deviceScaleFactor: 1 }, wait: 2500, noLogin: true },
  { system: '_review', name: 'hero-laptop-short', url: `/#/`, vp: { width: 1366, height: 640, deviceScaleFactor: 1 }, wait: 2500, noLogin: true },
  { system: '_review', name: 'hero-mobile', url: `/#/`, vp: { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true }, wait: 2500, noLogin: true },
  // og:image（1200×630，只擷取 Hero）
  { system: '_og', name: 'og-image', url: `/#/`, vp: { width: 1200, height: 630, deviceScaleFactor: 1 }, wait: 2500, noLogin: true },
];

// 等待頁面載入完成：URL 到達目標、無「正在載入」文字、無進度圈
async function waitReady(page, targetHash, maxMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const state = await page.evaluate((h) => {
      const atTarget = !h || decodeURIComponent(location.hash).startsWith(decodeURIComponent(h));
      const loadingText = /正在載入|載入中|Loading/.test(document.body.innerText || '');
      const spinner = Array.from(document.querySelectorAll('.v-progress-circular, .v-progress-linear')).some((el) => el.offsetParent !== null);
      return { atTarget, busy: loadingText || spinner };
    }, targetHash);
    if (state.atTarget && !state.busy) return true;
    await sleep(800);
  }
  return false;
}

// 關閉頁面自帶的導覽／歡迎對話框（例如驗屋系統 Welcome）
async function dismissDialogs(page) {
  for (let i = 0; i < 3; i++) {
    const closed = await page.evaluate(() => {
      const dialogs = Array.from(document.querySelectorAll('.v-overlay--active .v-card, .v-dialog--active, [role="dialog"]'));
      for (const d of dialogs) {
        const btn = d.querySelector('button .mdi-close, .mdi-close')?.closest('button');
        if (btn) { btn.click(); return true; }
      }
      return false;
    });
    if (!closed) break;
    await sleep(600);
  }
  await page.keyboard.press('Escape').catch(() => {});
}

const HIDE_CSS = '.bug-report-tab, .tour-fab { display: none !important; }';

const only = (process.argv.find((a) => a.startsWith('only=')) || '').replace('only=', '').split(',').filter(Boolean);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function login(page) {
  await page.setViewport(DESKTOP);
  await page.goto(`${BASE}/#/login`, { waitUntil: 'networkidle2' });
  await sleep(1500);
  const inputs = await page.$$('input');
  const text = [];
  for (const i of inputs) {
    const t = await (await i.getProperty('type')).jsonValue();
    text.push({ el: i, t });
  }
  const phone = text.find((x) => x.t === 'text')?.el;
  const pwd = text.find((x) => x.t === 'password')?.el;
  if (!phone || !pwd) throw new Error('找不到登入欄位');
  await phone.type('TESTA');
  await pwd.type('TESTA');
  await page.click('.login-btn');
  let url = page.url();
  for (let k = 0; k < 10; k++) {
    await sleep(2000);
    url = page.url();
    if (url.includes('/home')) break;
  }
  console.log('登入後 URL:', url);
  if (!url.includes('/home')) throw new Error('登入失敗：' + url);
  const sess = await page.evaluate(() => sessionStorage.getItem('anxi-user-session'));
  try { const u = JSON.parse(sess).user; console.log('permissions:', JSON.stringify(u.permissions)); } catch (e) { /* ignore */ }
}

async function main() {
  fs.mkdirSync(REVIEW, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--lang=zh-TW', '--no-sandbox'] });
  const page = await browser.newPage();
  page.on('dialog', async (d) => { console.log('  [dialog]', d.message().slice(0, 160)); try { await d.accept(); } catch (e) { /* ignore */ } });
  await login(page);

  for (const s of SHOTS) {
    if (only.length && !only.includes(s.name)) continue;
    try {
      await page.setViewport(s.vp);
      let target = page;
      let tmpContext = null;
      if (s.noLogin) {
        // 未登入情境：獨立 incognito context（避免已登入被導向 Home）
        tmpContext = await browser.createBrowserContext();
        target = await tmpContext.newPage();
        await target.setViewport(s.vp);
        await target.goto(`${BASE}${s.url}`, { waitUntil: 'networkidle2' });
      } else if (s.simulateTrial) {
        // 預覽導覽：本機模擬 isTrial（後端部署後由 handleLogin 回傳）
        await page.goto(`${BASE}/#/home`, { waitUntil: 'networkidle2' });
        await page.evaluate(() => {
          const raw = sessionStorage.getItem('anxi-user-session');
          if (!raw) return;
          const data = JSON.parse(raw);
          data.user.isTrial = true;
          sessionStorage.setItem('anxi-user-session', JSON.stringify(data));
          localStorage.removeItem('anxi-trial-tour-done');
        });
        await page.goto(`${BASE}${s.url}`, { waitUntil: 'networkidle2' });
        await page.reload({ waitUntil: 'networkidle2' }); // 重新水合 pinia（讀取修改後的 sessionStorage）
      } else {
        // 先全頁重載回 Home（讓建案清單載入完成），再以 hash 導航到目標頁（模擬實際操作路徑）
        await page.goto(`${BASE}/#/home`, { waitUntil: 'networkidle2' });
        await sleep(6000);
        await page.evaluate((h) => { window.location.hash = h; }, s.url.replace('/#', ''));
      }
      const ready = await waitReady(target, s.noLogin ? '' : s.url.split('?')[0].replace('/#', '#'));
      await sleep(s.wait || 2500);
      if (!s.keepFab) {
        await dismissDialogs(target);
        await target.addStyleTag({ content: HIDE_CSS });
      }
      await sleep(300);
      if (!ready) console.log('  (逾時仍在載入，照樣擷取)');
      // 關閉可能的 dialog / banner 不處理，先看結果
      if (s.full) {
        // 逐段捲動觸發 v-reveal，再回頂部
        await target.evaluate(async () => {
          const step = window.innerHeight * 0.6;
          for (let y = 0; y < document.body.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
          window.scrollTo(0, 0);
        });
        await sleep(1200);
      }
      const reviewPng = path.join(REVIEW, `${s.name}.png`);
      await target.screenshot({ path: reviewPng, type: 'png', fullPage: !!s.full });
      if (s.system === '_og') {
        await target.screenshot({ path: path.join(ROOT, 'public/og-image.png'), type: 'png' });
      } else if (s.system !== '_review') {
        const dir = path.join(OUT, s.system);
        fs.mkdirSync(dir, { recursive: true });
        await target.screenshot({ path: path.join(dir, `${s.name}.webp`), type: 'webp', quality: 80 });
      }
      console.log('✔', s.name, target.url());
      if (tmpContext) await tmpContext.close();
    } catch (e) {
      console.log('✘', s.name, e.message);
    }
  }
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
