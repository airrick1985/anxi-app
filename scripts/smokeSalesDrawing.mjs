// 銷售圖面編輯器煙霧測試（TESTA 帳號 / DEMO 建案）
// 用法：先 `npx vite --port 5199`，再 `node scripts/smokeSalesDrawing.mjs`；截圖輸出到 docs/local/tmp/shots
// 注意：此環境 puppeteer 實體滑鼠／鍵盤事件不會送達頁面，故以合成 DOM 事件驅動 fabric（見 synDrag / synKey）
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://localhost:5199';
const PROJECT = 'TESTA';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = 'c:/Project/anxi-app/anxi-app/docs/local/tmp/shots';
const DL = path.join(OUT, 'downloads');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(DL, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [];
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

async function shot(page, name) { await page.screenshot({ path: path.join(OUT, `${name}.png`) }); log('shot', name); }
async function clickText(page, selector, text) {
  const ok = await page.evaluate((sel, t) => {
    const els = Array.from(document.querySelectorAll(sel));
    const el = els.find(e => (e.innerText || '').trim().includes(t) && e.offsetParent !== null);
    if (el) { el.click(); return true; }
    return false;
  }, selector, text);
  if (!ok) throw new Error(`找不到可點擊元素: ${selector} "${text}"`);
}
async function bodyText(page) { return page.evaluate(() => document.body.innerText); }
async function statusText(page) { return page.evaluate(() => document.querySelector('.sde-status')?.innerText || ''); }
// puppeteer 實體滑鼠事件在此環境不會送達頁面，改以合成 DOM 事件驅動 fabric（mousedown 於 upper-canvas，move/up 於 document）
async function synDrag(page, x1, y1, x2, y2, { steps = 8, shift = false } = {}) {
  await page.evaluate((x1, y1, x2, y2, steps, shift) => {
    const u = document.querySelector('.upper-canvas');
    const fire = (type, cx, cy, target = u) => target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: cx, clientY: cy, button: 0, buttons: type === 'mouseup' ? 0 : 1, shiftKey: shift }));
    fire('mousemove', x1, y1);
    fire('mousedown', x1, y1);
    for (let i = 1; i <= steps; i++) fire('mousemove', x1 + (x2 - x1) * i / steps, y1 + (y2 - y1) * i / steps, document);
    fire('mouseup', x2, y2, document);
  }, x1, y1, x2, y2, steps, shift);
}
async function synClick(page, x, y) { await synDrag(page, x, y, x, y, { steps: 1 }); }

async function login(page) {
  await page.goto(`${BASE}/#/login`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('.login-btn', { timeout: 20000 }).catch(() => {});
  await sleep(1500);
  const inputs = await page.$$('input');
  let phone, pwd;
  const types = [];
  for (const i of inputs) {
    const t = await (await i.getProperty('type')).jsonValue();
    types.push(t);
    if ((t === 'text' || t === 'tel') && !phone) phone = i;
    if (t === 'password') pwd = i;
  }
  log('登入頁 input types:', types);
  if (!phone || !pwd) { await shot(page, '00-login-fail'); throw new Error('找不到登入欄位'); }
  await phone.type('TESTA'); await pwd.type('TESTA');
  await page.click('.login-btn');
  for (let k = 0; k < 10; k++) { await sleep(2000); if (page.url().includes('/home')) break; }
  if (!page.url().includes('/home')) throw new Error('登入失敗 ' + page.url());
  log('登入成功');
}

async function main() {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--lang=zh-TW', '--no-sandbox', '--window-size=1600,1000'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });
  const client = await page.createCDPSession();
  await client.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DL });
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') { const t = m.text(); if (!/DevTools|favicon|Third-party cookie/i.test(t)) errors.push(`[${m.type()}] ${t.slice(0, 300)} @ ${m.location()?.url || ''}`); } });
  page.on('requestfailed', (r) => errors.push(`[requestfailed] ${r.url().slice(0, 200)}`));
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`[http ${r.status()}] ${r.url().slice(0, 200)}`); });
  page.on('pageerror', (e) => errors.push(`[pageerror] ${String(e).slice(0, 300)}`));
  page.on('dialog', async (d) => { log('[dialog]', d.message()); try { await d.accept(); } catch (e) { /* ignore */ } });

  await login(page);
  await page.goto(`${BASE}/#/home`, { waitUntil: 'networkidle2' });
  await sleep(4000);

  // 1. 列表頁
  await page.evaluate((h) => { window.location.hash = h; }, `#/sales-drawings/${PROJECT}`);
  await sleep(4000);
  await shot(page, '01-list');
  const t1 = await bodyText(page);
  log('列表頁含「銷售圖面」:', t1.includes('銷售圖面'), '| 含「新增圖面」:', t1.includes('新增圖面'));

  // 2. 新增圖面 → 編輯頁（底圖對話框）
  await clickText(page, 'button', '新增圖面');
  await sleep(5000);
  log('URL:', page.url());
  const TEST_NAME = `煙霧測試-${Date.now()}`;
  await page.evaluate((n) => { const i = document.querySelector('.sde-name'); i.value = n; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); }, TEST_NAME);
  await sleep(1000);
  await shot(page, '02-editor-new');
  // 用先前截圖當底圖上傳
  const fileInput = await page.$('input[type=file]');
  if (fileInput) {
    await fileInput.uploadFile(path.join(OUT, '01-list.png'));
    await sleep(2500);
    await shot(page, '03-baseimage-preview');
    await clickText(page, 'button', '使用此底圖');
    for (let k = 0; k < 20; k++) { await sleep(1000); const t = await bodyText(page); if (!t.includes('底圖上傳中')) break; }
    await sleep(1500);
    await shot(page, '04-baseimage-loaded');
    log('底圖後狀態列:', await statusText(page));
  } else {
    log('!! 找不到底圖上傳 input');
  }

  // 3. 新增資訊卡：選 3 戶 + 面積組（先等戶別資料）
  for (let k = 0; k < 30; k++) {
    const n = await page.evaluate(() => Number(document.querySelector('.sde-root')?.dataset.households || 0));
    if (n > 0) { log('戶別資料載入:', n); break; }
    await sleep(1000);
  }
  await clickText(page, '.sde-tool', '資訊卡');
  await sleep(2500);
  await shot(page, '05-infocard-dialog');
  const unitCount = await page.evaluate(() => document.querySelectorAll('.icd-unit-item input').length);
  log('可選戶別數:', unitCount);
  await page.evaluate(() => { document.querySelectorAll('.icd-unit-item input').forEach((el, i) => { if (i < 3) el.click(); }); });
  await clickText(page, '.v-chip', '面積組');
  await sleep(500);
  await clickText(page, '.v-chip', '價格組');
  await sleep(300);
  // 再加一個內部欄位（測試警示）
  await page.evaluate(() => { const t = Array.from(document.querySelectorAll('.v-expansion-panel-title')).find(e => e.innerText.includes('底價')); t?.click(); });
  await sleep(600);
  await page.evaluate(() => { const l = Array.from(document.querySelectorAll('.icd-field-item')).find(e => e.innerText.includes('房屋底價')); l?.querySelector('input')?.click(); });
  await sleep(500);
  await shot(page, '06-infocard-selected');
  await clickText(page, 'button', '插入到圖面');
  await sleep(2000);
  await shot(page, '07-cards-inserted');
  log('插卡後狀態列:', await statusText(page));

  // 4. 點選一張卡 → 屬性面板；修改標籤與底色
  await synClick(page, 1100, 200); // 先清空選取
  await sleep(300);
  const cardHit = await page.evaluate(() => {
    // 透過圖層面板選取第一張卡
    const tab = Array.from(document.querySelectorAll('.v-tab')).find(e => e.innerText.includes('圖層'));
    tab?.click();
    return !!tab;
  });
  await sleep(600);
  await page.evaluate(() => { document.querySelector('.dpp-layer')?.click(); });
  await sleep(600);
  await page.evaluate(() => { const tab = Array.from(document.querySelectorAll('.v-tab')).find(e => e.innerText.includes('屬性')); tab?.click(); });
  await sleep(800);
  await shot(page, '08-card-selected-panel');
  const labelInput = await page.$('.dpp-row .dpp-input');
  if (labelInput) {
    await labelInput.click({ clickCount: 3 });
    await labelInput.type('總坪數');
    await page.keyboard.press('Tab');
    await sleep(800);
    await shot(page, '09-card-label-edited');
  } else log('!! 找不到列編輯輸入框（cardHit=' + cardHit + '）');

  // 4b. 互動：拖曳卡片、角落等比縮放、欄分界把手（透過 window.__drawingApi 取得螢幕座標）
  const rectOf = async (idx) => page.evaluate((i) => {
    const api = window.__drawingApi; const o = api.getObjects()[i]; const r = o.getBoundingRect();
    const c = document.querySelector('.sde-canvas-wrap').getBoundingClientRect();
    return { left: r.left + c.left, top: r.top + c.top, width: r.width, height: r.height, scale: o.scaleX, colWidths: o.cardLayout ? [...o.cardLayout.colWidths] : null, x: o.left, y: o.top };
  }, idx);
  const elBefore = await rectOf(0);
  log('卡片0 螢幕矩形:', JSON.stringify(elBefore));
  // 拖曳卡片中心 +120,+80
  await synClick(page, elBefore.left + elBefore.width / 2, elBefore.top + elBefore.height / 2);
  await sleep(200);
  await synDrag(page, elBefore.left + elBefore.width / 2, elBefore.top + elBefore.height / 2, elBefore.left + elBefore.width / 2 + 120, elBefore.top + elBefore.height / 2 + 80);
  await sleep(300);
  const elMoved = await rectOf(0);
  log('拖曳後 x,y 變化:', Math.round(elMoved.x - elBefore.x), Math.round(elMoved.y - elBefore.y));
  // 右下角把手等比縮放
  await synDrag(page, elMoved.left + elMoved.width, elMoved.top + elMoved.height, elMoved.left + elMoved.width + 80, elMoved.top + elMoved.height + 80);
  await sleep(300);
  const elScaled = await rectOf(0);
  log('角落縮放後 scale:', elScaled.scale.toFixed(2), '（原', elBefore.scale, '）');
  // 欄分界把手（卡片頂緣上方 12px，x = colWidths[0]*scale*zoom）
  const zoom = await page.evaluate(() => window.__drawingApi.zoom.value);
  const divX = elScaled.left + elScaled.colWidths[0] * elScaled.scale * zoom;
  await synDrag(page, divX, elScaled.top - 12, divX + 40, elScaled.top - 12);
  await sleep(300);
  const elCol = await rectOf(0);
  log('欄分界後選取:', await page.evaluate(() => window.__drawingApi.selected.value.length));
  log('欄分界拖曳後 colWidths:', elScaled.colWidths.map(Math.round), '→', elCol.colWidths.map(Math.round), '總寬不變:', Math.round(elScaled.colWidths[0] + elScaled.colWidths[1]) === Math.round(elCol.colWidths[0] + elCol.colWidths[1]));
  // 右邊中點拉寬（文字不縮放）
  await synDrag(page, elCol.left + elCol.width, elCol.top + elCol.height / 2, elCol.left + elCol.width + 60, elCol.top + elCol.height / 2);
  await sleep(300);
  const elWide = await rectOf(0);
  log('邊中點拉寬後 colWidths:', elWide.colWidths.map(Math.round), 'scale 不變:', elWide.scale.toFixed(2) === elCol.scale.toFixed(2));
  await shot(page, '09b-card-interactions');

  // 5. 畫箭頭、矩形、文字（先點畫布空白處讓輸入框失焦）
  await synClick(page, 1100, 200);
  await page.evaluate(() => document.activeElement?.blur());
  await sleep(200);
  await page.keyboard.press('Escape');
  await page.keyboard.press('a');
  await sleep(200);
  const toolAfterKey = await page.evaluate(() => window.__drawingApi.tool.value);
  log('按 a 後工具:', toolAfterKey);
  if (toolAfterKey !== 'arrow') await page.evaluate(() => window.__drawingApi.setTool('arrow'));
  await synDrag(page, 700, 700, 900, 600);
  await sleep(400);
  log('畫箭頭後元素數:', await page.evaluate(() => window.__drawingApi.getObjects().length));
  await page.evaluate(() => window.__drawingApi.setTool('rect'));
  await synDrag(page, 950, 650, 1150, 800);
  await sleep(400);
  await page.evaluate(() => window.__drawingApi.setTool('dashed'));
  await synDrag(page, 600, 900, 1000, 900, { shift: true });
  await sleep(400);
  await page.evaluate(() => window.__drawingApi.setTool('text'));
  await synClick(page, 800, 850);
  await sleep(500);
  await page.keyboard.type('Sea view 面海景觀戶');
  await sleep(300);
  await page.keyboard.press('Escape');
  await sleep(600);
  await shot(page, '10-annotations');
  // 拖曳箭頭端點
  const arrowInfo = await page.evaluate(() => {
    const api = window.__drawingApi; const a = api.getObjects().find(o => o.type === 'arrow'); if (!a) return null;
    api.selectById(a.elementId);
    const pos = a.controls.end.positionHandler(null, null, a);
    const c = document.querySelector('.sde-canvas-wrap').getBoundingClientRect();
    const el = api.toElement(a);
    return { x: pos.x + c.left, y: pos.y + c.top, x2: el.x2, y2: el.y2 };
  });
  if (arrowInfo) {
    await synDrag(page, arrowInfo.x, arrowInfo.y, arrowInfo.x + 60, arrowInfo.y - 40);
    await sleep(300);
    const after = await page.evaluate(() => { const api = window.__drawingApi; const a = api.getObjects().find(o => o.type === 'arrow'); const el = api.toElement(a); return { x2: el.x2, y2: el.y2 }; });
    log('箭頭端點拖曳前後 x2,y2:', Math.round(arrowInfo.x2), Math.round(arrowInfo.y2), '→', Math.round(after.x2), Math.round(after.y2));
  } else log('!! 沒有箭頭物件');
  const types = await page.evaluate(() => window.__drawingApi.toElements().map(e => e.type + (e.type === 'text' ? `(${e.text})` : '')));
  log('元素類型:', types);
  log('標註後狀態列:', await statusText(page));

  // 5b. 快捷鍵（合成 KeyboardEvent 於 window）
  const synKey = (key, opts = {}) => page.evaluate((key, opts) => { document.activeElement?.blur(); window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opts })); }, key, opts);
  await synKey('a'); log('合成鍵 a → 工具:', await page.evaluate(() => window.__drawingApi.tool.value));
  await synKey('Escape'); log('合成鍵 Esc → 工具:', await page.evaluate(() => window.__drawingApi.tool.value));
  await page.evaluate(() => { const api = window.__drawingApi; const t = api.getObjects().find(o => o.type === 'textbox'); api.selectById(t.elementId); });
  const nBefore = await page.evaluate(() => window.__drawingApi.getObjects().length);
  await synKey('Delete'); await sleep(200);
  const nDel = await page.evaluate(() => window.__drawingApi.getObjects().length);
  await synKey('z', { ctrlKey: true }); await sleep(300);
  const nUndo = await page.evaluate(() => window.__drawingApi.getObjects().length);
  await synKey('y', { ctrlKey: true }); await sleep(300);
  const nRedo = await page.evaluate(() => window.__drawingApi.getObjects().length);
  await synKey('z', { ctrlKey: true }); await sleep(300);
  log('Delete/Ctrl+Z/Ctrl+Y 元素數:', nBefore, '→', nDel, '→', nUndo, '→', nRedo);
  await page.evaluate(() => { const api = window.__drawingApi; api.selectById(api.getObjects()[0].elementId); });
  await synKey('d', { ctrlKey: true }); await sleep(300);
  log('Ctrl+D 後元素數:', await page.evaluate(() => window.__drawingApi.getObjects().length));
  await synKey('ArrowRight', { shiftKey: true }); await sleep(200);

  // 6. 復原／重做
  await page.keyboard.down('Control'); await page.keyboard.press('z'); await page.keyboard.up('Control');
  await sleep(400);
  log('undo 後:', await statusText(page));
  await page.keyboard.down('Control'); await page.keyboard.press('y'); await page.keyboard.up('Control');
  await sleep(400);
  log('redo 後:', await statusText(page));

  // 7. 儲存
  await page.keyboard.down('Control'); await page.keyboard.press('s'); await page.keyboard.up('Control');
  await sleep(4000);
  const t7 = await bodyText(page);
  log('儲存狀態:', /已儲存|儲存失敗|儲存中/.exec(t7)?.[0], '| toast:', /已儲存圖面|儲存失敗[^\n]*/.exec(t7)?.[0]);
  await shot(page, '11-saved');

  // 8. 匯出 WebP
  await clickText(page, 'button', '匯出');
  await sleep(1000);
  await shot(page, '12-export-dialog');
  const t8 = await bodyText(page);
  log('匯出對話框含內部資料警示:', t8.includes('內部資料'), '| 含 CORS 警示:', t8.includes('跨域'));
  await clickText(page, '.v-dialog .v-btn', 'WEBP');
  await sleep(400);
  await page.evaluate(() => { const btns = Array.from(document.querySelectorAll('.v-dialog button')); const b = btns.find(e => e.innerText.trim() === '匯出'); b?.click(); });
  await sleep(4000);
  const files = fs.readdirSync(DL);
  log('下載檔案:', files);
  const t8b = await bodyText(page);
  if (/匯出失敗[^\n]*/.test(t8b)) log('!! 匯出錯誤:', /匯出失敗[^\n]*/.exec(t8b)[0]);
  await page.keyboard.press('Escape');

  // 8b. 切換圖面：下拉「新增圖面」→ 新圖面 → 下拉切回原圖面
  const elemCountBefore = await page.evaluate(() => window.__drawingApi.getObjects().length);
  await page.evaluate(() => { document.querySelector('button[title="切換圖面"]')?.click(); });
  await sleep(800);
  await shot(page, '12b-switch-menu');
  const menuItems = await page.evaluate(() => Array.from(document.querySelectorAll('.sde-switch-list .v-list-item-title')).map(e => e.innerText));
  log('切換選單項目:', menuItems);
  await page.evaluate(() => { Array.from(document.querySelectorAll('.sde-switch-list .v-list-item')).find(e => e.innerText.includes('新增圖面'))?.click(); });
  await sleep(5000);
  log('新增後 URL:', page.url());
  await page.evaluate(() => { Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('先不上傳'))?.click(); });
  await sleep(800);
  await page.evaluate((n) => { const i = document.querySelector('.sde-name'); i.value = n; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); }, TEST_NAME + '-2');
  await sleep(800);
  log('新圖面元素數:', await page.evaluate(() => window.__drawingApi.getObjects().length));
  await page.evaluate(() => { document.querySelector('button[title="切換圖面"]')?.click(); });
  await sleep(800);
  await page.evaluate((n) => { Array.from(document.querySelectorAll('.sde-switch-list .v-list-item')).find(e => e.innerText.includes(n) && !e.innerText.includes(n + '-2'))?.click(); }, TEST_NAME);
  await sleep(6000);
  const backName = await page.evaluate(() => document.querySelector('.sde-name')?.value);
  const backCount = await page.evaluate(() => window.__drawingApi.getObjects().length);
  log('切回原圖面 名稱:', backName === TEST_NAME ? 'OK' : backName, '| 元素數:', backCount, '(切換前', elemCountBefore, ')');
  await shot(page, '12c-switched-back');

  // 9. 重新整理驗證持久化（底圖從 Storage URL 載入 → 驗證 CORS）
  const url = page.url();
  await page.evaluate(() => { window.location.hash = '#/home'; });
  await sleep(2500);
  await page.evaluate((u) => { window.location.hash = u; }, url.replace(/^.*#/, '#'));
  await sleep(7000);
  await shot(page, '13-reloaded');
  log('重載後狀態列:', await statusText(page));
  const t9 = await bodyText(page);
  log('重載後 tainted 警示:', t9.includes('跨域'));
  // 重載後（底圖來自 Storage URL）再匯出一次 → 驗證 CORS
  await clickText(page, 'button', '匯出');
  await sleep(800);
  await page.evaluate(() => { const b = Array.from(document.querySelectorAll('.v-dialog button')).find(e => e.innerText.trim() === '匯出'); b?.click(); });
  await sleep(4000);
  const t9b = await bodyText(page);
  const exportErr = t9b.split(String.fromCharCode(10)).find(l => l.includes('匯出失敗'));
  log('重載後匯出:', exportErr || 'OK', '| 下載數:', fs.readdirSync(DL).length);
  await page.keyboard.press('Escape');
  await page.evaluate(() => { const b = Array.from(document.querySelectorAll('.v-dialog button')).find(e => e.innerText.trim() === '取消'); b?.click(); });

  // 10. 檢視模式
  await page.evaluate(() => { window.location.hash = window.location.hash.replace(/\?.*$/, '') + '?mode=view'; });
  await sleep(4000);
  await shot(page, '14-view-mode');
  log('檢視模式文字:', (await bodyText(page)).includes('檢視模式'));

  // 11. 回列表 → 刪除測試圖面（清理）
  await page.evaluate((h) => { window.location.hash = h; }, `#/sales-drawings/${PROJECT}`);
  await sleep(4000);
  await shot(page, '15-list-after');
  const cards = await page.$$('.sdl-card');
  log('列表卡片數:', cards.length);
  // 只刪除本次建立的測試圖面（含 -2）
  for (let i = 0; i < 3; i++) {
    const found = await page.evaluate((n) => { const c = Array.from(document.querySelectorAll('.sdl-card')).find(e => e.innerText.includes(n)); if (!c) return false; c.querySelector('button')?.click(); return true; }, TEST_NAME);
    if (!found) break;
    await sleep(600);
    await page.evaluate(() => { const it = Array.from(document.querySelectorAll('.v-list-item')).find(e => e.innerText.includes('刪除')); it?.click(); });
    await sleep(600);
    await page.evaluate(() => { const b = Array.from(document.querySelectorAll('.v-dialog button')).find(e => e.innerText.trim() === '刪除'); b?.click(); });
    await sleep(3000);
  }
  log('清理後仍存在測試圖面:', await page.evaluate((n) => Array.from(document.querySelectorAll('.sdl-card')).some(e => e.innerText.includes(n)), TEST_NAME));

  log('=== console errors/warnings ===');
  errors.forEach(e => console.log(e));
  await browser.close();
}
main().catch(async (e) => { console.error('FAILED:', e); console.log('=== console errors/warnings (on failure) ==='); errors.forEach(x => console.log(x)); process.exit(1); });
