// 繳款紀錄改版、預計繳款與到期通知的瀏覽器測試（docs/SPEC_PaymentDueReminder.md §11、§12）
// 用假資料實際操作元件，不連 Firebase／Cloud Functions／LINE／Gmail：
// - 前端的 @/api、@/firebase、@/store/*、firebase/* 全部換成假模組（依解析後路徑比對，涵蓋所有元件）
// - 假後端跑在 Node，直接呼叫 functions/ 的真實驗證與處理函式（paymentProofRecord、paymentDueReminder），參數錯誤會回錯誤
// - 瀏覽器攔截所有非本機請求；任何想打出去的請求都記入 blockedRequests 並判定失敗
//
// 用法：node scripts/tests/payment-records-browser.mjs [輸出資料夾] [--only=T1,T7,visual]
//   群組：T1 面板檢視、T2 新增編輯刪除改回、T3 標記已繳、T4 憑證、T5 編輯模式、T6 繳款提醒設定、T7 到期清單、
//         T8 批次新增、T9 帶入合約期款資料、PERIOD 期別與備註、UNDATED 預計日留空、T10 計算欄位、T11 通知入口、T12 修改銷控（真實 UnitDetailModal）、
//         T13 銷控系統（真實 SalesControlSystem）、T14 樣式修正、visual 畫面矩陣
//   失敗項代表實際發現的問題，結束時 exit 1；已知問題（known）照常執行、列入報告但不影響結束碼，修好時會提示。明細在 <輸出資料夾>/results.json
//   只跑部分畫面：--only=visual --screens=settings,list-manager
//   環境變數：PLAYWRIGHT_MODULE（playwright 模組路徑）、BROWSER_EXECUTABLE（Chromium 路徑）、TEST_ENGINE=webkit
// 預設從 ~/.npm/_npx/*/node_modules/playwright 與 ~/Library/Caches/ms-playwright/chromium_headless_shell-* 尋找。
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { deflateSync, inflateSync, crc32 } from 'node:zlib';
import { createServer } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '../..');
const args = process.argv.slice(2);
const onlyArg = args.find(a => a.startsWith('--only='));
const ONLY = onlyArg ? new Set(onlyArg.slice(7).split(',')) : null;
const screensArg = args.find(a => a.startsWith('--screens='));
const ONLY_SCREENS = screensArg ? new Set(screensArg.slice(10).split(',')) : null;
const OUT_DIR = path.resolve(args.find(a => !a.startsWith('--')) || path.join(os.tmpdir(), 'payment-records-browser'));
const SHOT_DIR = path.join(OUT_DIR, 'screenshots');
mkdirSync(SHOT_DIR, { recursive: true });

// ── Playwright ──
function findPlaywright() {
  if (process.env.PLAYWRIGHT_MODULE) return process.env.PLAYWRIGHT_MODULE;
  const npx = path.join(os.homedir(), '.npm/_npx');
  if (existsSync(npx)) {
    for (const dir of readdirSync(npx)) {
      const candidate = path.join(npx, dir, 'node_modules/playwright');
      if (existsSync(path.join(candidate, 'package.json'))) return candidate;
    }
  }
  throw new Error('找不到 playwright，請設定 PLAYWRIGHT_MODULE');
}
function findBrowser() {
  if (process.env.BROWSER_EXECUTABLE) return process.env.BROWSER_EXECUTABLE;
  const cache = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  if (existsSync(cache)) {
    const shell = readdirSync(cache).filter(d => d.startsWith('chromium_headless_shell-')).sort().pop();
    if (shell) {
      const dir = path.join(cache, shell);
      for (const sub of readdirSync(dir)) {
        const candidate = path.join(dir, sub, 'chrome-headless-shell');
        if (existsSync(candidate)) return candidate;
      }
    }
  }
  throw new Error('找不到 Chromium，請設定 BROWSER_EXECUTABLE');
}
function findWebkit() {
  if (process.env.BROWSER_EXECUTABLE) return process.env.BROWSER_EXECUTABLE;
  const cache = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  const dir = readdirSync(cache).filter(d => d.startsWith('webkit-')).sort().pop();
  return dir ? path.join(cache, dir, 'pw_run.sh') : undefined;
}
const { chromium, webkit } = require(findPlaywright());
// TEST_ENGINE=webkit 用 Playwright 內建 WebKit 跑（接近 Safari，LINE iOS 內建瀏覽器同引擎，但不等於 iOS 實機）
const ENGINE = process.env.TEST_ENGINE === 'webkit' ? 'webkit' : 'chromium';

// ── 假後端（Node）：驗證規則與處理流程都是 functions/ 的真實程式 ──
const proof = require(path.join(root, 'functions/utils/paymentProofRecord.js'));
const reminder = require(path.join(root, 'functions/paymentDueReminder.js'));
const notifier = require(path.join(root, 'functions/notifications/paymentDueNotifier.js'));

const DAY = 86400000;
const TODAY = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
const addDays = (n, base = TODAY) => new Date(Date.parse(`${base}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
const md = ymd => ymd.slice(5).replace('-', '/');
const slash = ymd => ymd.replace(/-/g, '/');
const FOLDER = 'https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz012345';

const plan = (id, days, expectedAmount, note, extra = {}) => ({
  id, expectedDate: addDays(days), expectedAmount, planSource: 'manual', date: '', amount: null, note, file: null,
  paidAt: null, paidBy: null, createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z', ...extra,
});
const imageFile = id => ({ fileId: id, fileName: `${id}.jpg`, webViewLink: `https://drive.google.com/file/d/${id}/view`, mimeType: 'image/jpeg' });
const pdfFile = id => ({ fileId: id, fileName: `${id}.pdf`, webViewLink: `https://drive.google.com/file/d/${id}/view`, mimeType: 'application/pdf' });

function unitFixtures() {
  const all = baseUnitFixtures();
  // 修改銷控用：同 A1，但沒有缺日期的舊資料（那筆會擋下整個儲存，另外測）
  all.M1 = { ...all.A1, unitId: 'M1', paymentRecords: all.A1.paymentRecords.filter(r => r.id !== 'legacy2') };
  all.M2 = { ...all.A1, unitId: 'M2', salesStatus_backend: '小訂', paymentRecords: [plan('m2p', 5, 500000, '補足'), { id: 'm2d', date: addDays(-20), amount: 100000, note: '小訂', file: null }] };
  all.M3 = { ...all.A1, unitId: 'M3', price_transaction_house: 2000, paymentRecords: all.A1.paymentRecords.filter(r => r.id !== 'legacy2') };
  return all;
}

function baseUnitFixtures() {
  const unit = (unitId, extra) => ({
    projectId: 'p1', unitId, building: unitId[0], salesStatus_backend: '簽約', buyerName: `買方${unitId}`, buyerPhone: '0912000000',
    salesperson: ['銷售甲'], salespersonUserKey: ['sales1'], driveFolderUrl: FOLDER, price_transaction_house: 1000, price_floor_house_total: 900, paymentRecords: [], ...extra,
  });
  return {
    A1: unit('A1', {
      buyerName: '王小明', buyerPhone: '0912345678', price_transaction_house: 2000,
      paymentRecords: [
        plan('p_soon', 3, 300000, '第 4 期工程款'),
        plan('p_over', -7, 300000, '第 2 期工程款'),
        plan('p_far', 20, null, '第 5 期工程款'),
        plan('p_today', 0, 200000, '第 3 期工程款'),
        { id: 'd_early', date: addDays(-40), amount: 150000, note: '開工款', expectedDate: addDays(-38), expectedAmount: 150000, planSource: 'manual', file: pdfFile('proofPdf'), paidAt: '2026-09-01T00:00:00.000Z', paidBy: '管理甲', createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z' },
        { id: 'd_late', date: addDays(-10), amount: 600000, note: '簽約款', expectedDate: addDays(-13), expectedAmount: 600000, planSource: 'manual', file: imageFile('proofImg'), paidAt: '2026-10-01T00:00:00.000Z', paidBy: '管理甲', createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z' },
        { id: 'd_same', date: addDays(-60), amount: 100000, note: '訂金', expectedDate: addDays(-60), expectedAmount: null, planSource: 'manual', file: null, createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z' },
        { id: 'legacy1', date: addDays(-90), amount: 50000, note: '舊資料補足款', file: null, createdAt: '2026-07-01T00:00:00.000Z', updatedAt: '2026-07-01T00:00:00.000Z' },
        { id: 'legacy2', date: '', amount: null, note: '舊資料缺值', file: null, createdAt: '2026-07-01T00:00:00.000Z', updatedAt: '2026-07-01T00:00:00.000Z' },
      ],
    }),
    A2: unit('A2', {
      buyerName: '陳美麗', buyerPhone: '0922333444', salesStatus_backend: '小訂', salesperson: ['銷售乙'], salespersonUserKey: ['sales2'], price_transaction_house: 1500,
      paymentRecords: [plan('a2_soon', 5, 150000, '第 1 期工程款'), plan('a2_over', -3, 100000, '簽約款')],
    }),
    A3: unit('A3', {
      building: 'B', buyerName: '林大同', buyerPhone: '0933555666',
      paymentRecords: [plan('a3_month', 25, 250000, '第 2 期工程款'), plan('a3_far', 45, 250000, '第 3 期工程款')],
    }),
    A4: unit('A4', { salesStatus_backend: '退戶', paymentRecords: [plan('a4', 1, 999999, '退戶不應出現')] }),
    A5: unit('A5', { salesStatus_backend: '', paymentRecords: [plan('a5', 1, 999999, '空狀態不應出現')] }),
    A9: unit('A9', {
      buyerName: '歐陽修司馬相如諸葛孔明上官婉兒建設股份有限公司代表人', buyerPhone: '0987654321',
      salesperson: ['離職人員'], salespersonUserKey: ['quit1'], price_transaction_house: 12000,
      paymentRecords: [plan('a9_long', 2, 123456789, '第 12 期工程款（含地下室結構體完成第三次追加變更設計款項，須於交屋前繳清）')],
    }),
    B1: unit('B1', { salesStatus_backend: '成交', price_transaction_house: 1234.56, paymentRecords: [{ id: 'b1_paid', date: addDays(-5), amount: 100000, note: '舊款', file: null }] }),
    B2: unit('B2', { salesStatus_backend: '自訂狀態', buyerName: '趙自訂', salesperson: ['銷售丙'], salespersonUserKey: ['sales3'], price_transaction_house: 800, paymentRecords: [plan('b2', 40, 80000, '第 1 期工程款')] }),
    B3: unit('B3', { price_transaction_house: 0, buyerName: '', paymentRecords: [] }),
    B4: unit('B4', { price_transaction_house: 1000, salesStatus_backend: '簽約', paymentRecords: [plan('b4_dup', 30, 100000, '第 9 期工程款', { expectedDate: '2027-03-01' })] }),
    B5: unit('B5', { salesStatus_backend: '退戶', price_transaction_house: 999 }),
    B6: unit('B6', { salesStatus_backend: '', price_transaction_house: 999 }),
    EMPTY: unit('EMPTY', { paymentRecords: [] }),
    LEG: unit('LEG', { paymentRecords: [{ id: 'leg1', date: '2025-01-05', amount: 100000, note: '舊資料一', file: null }, { id: 'leg2', date: '2025-02-05', amount: 200000, note: '舊資料二', file: null }] }),
    NOPLAN: unit('NOPLAN', { paymentRecords: [plan('np', 2, null, '未填金額期')] }),
    P1: unit('P1', { contractType: '毛胚合約', price_transaction_house: 2000, price_package_deal: 1800, paymentRecords: [] }),
    PREF: unit('PREF', { isPreferredPayment: true, price_transaction_house: 2000, paymentRecords: [] }),
    ZERO: unit('ZERO', { price_transaction_house: 0, paymentRecords: [] }),
    NOFOLDER: unit('NOFOLDER', { driveFolderUrl: '', paymentRecords: [plan('nf', 2, 100000, '無資料夾期')] }),
  };
}

const LIST_UNITS = ['A1', 'A2', 'A3', 'A4', 'A5', 'A9', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6'];

const parkingFixtures = () => [
  { projectId: 'p1', spotId: 'P-101', floor: 'B1', buyerUnitId: 'A1', status: '已售', price_list: 120, price_transaction: 100, price_floor: 90 },
  { projectId: 'p1', spotId: 'P-102', floor: 'B1', buyerUnitId: 'B1', status: '已售', price_list: 80, price_transaction: 65.44, price_floor: 60 },
  { projectId: 'p1', spotId: 'P-301', floor: 'B2', buyerUnitId: 'M3', status: '已售', price_list: 150, price_transaction: 120, price_floor: 100 },
  { projectId: 'p1', spotId: 'P-302', floor: 'B2', price_list: 90, price_floor: 70 },
];

const it = (name, formula, extra = {}) => ({ id: extra.id || name, parentId: null, name, formula, roundingMethod: '四捨五入', roundingValue: 0, conditionalValue: 0, ...extra });
const templateFixtures = () => [
  {
    id: 'tpl-normal', projectId: 'p1', templateName: '一般期款範本', paymentCategory: '一般期款', propertyType: '住家', buyerType: '首購', minPrice: 0, maxPrice: 0,
    items: [
      it('頭期款', '總價*3%', { id: 'i1', conditionalValue: 3 }),
      it('簽約款', '總價*7%', { id: 'i2', conditionalValue: 7 }),
      it('工程期款', '總價*20%', { id: 'g1', conditionalValue: 20 }),
      it('開工期款', '工程期款*33%', { id: 'g1a', parentId: 'g1' }),
      it('結構款', '工程期款*33%', { id: 'g1b', parentId: 'g1' }),
      it('完工款', '工程期款-開工期款-結構款', { id: 'g1c', parentId: 'g1' }),
      it('交屋款', '0', { id: 'z0' }),
      it('回饋調整', '頭期款-簽約款', { id: 'n1' }),
      it('銀行貸款', '總價-頭期款-簽約款-工程期款', { id: 'i9', conditionalValue: 70 }),
    ],
  },
  {
    id: 'tpl-pref', projectId: 'p1', templateName: '優付期款範本', paymentCategory: '優付期款', propertyType: '住家', buyerType: '首購', minPrice: 0, maxPrice: 0,
    items: [it('優付訂金', '總價*10%', { id: 'pf1' }), it('優付尾款', '總價-優付訂金', { id: 'pf2' })],
  },
  {
    id: 'tpl-pkg', projectId: 'p1', templateName: '配套期款範本', paymentCategory: '配套期款', propertyType: '住家', buyerType: '首購', minPrice: 0, maxPrice: 0,
    items: [it('配套頭款', '配套金額*50%', { id: 'pk1' }), it('配套尾款', '配套金額-配套頭款', { id: 'pk2' })],
  },
  {
    id: 'tpl-out', projectId: 'p1', templateName: '高總價範本', paymentCategory: '一般期款', propertyType: '住家', buyerType: '首購', minPrice: 50000, maxPrice: 0,
    items: [it('高總價頭款', '總價*50%', { id: 'o1' }), it('高總價尾款', '總價-高總價頭款', { id: 'o2' })],
  },
];

// 只實作會用到的 Firestore 介面（同 functions/tests/paymentDueReminder.test.cjs）
function createFakeDb(initial = {}) {
  const store = new Map(Object.entries(initial));
  let autoId = 0;
  const getPath = (data, p) => p.split('.').reduce((v, key) => (v == null ? v : v[key]), data);
  const snapshot = p => ({ id: p.split('/').pop(), exists: store.has(p), data: () => (store.has(p) ? { ...store.get(p) } : undefined) });
  const docRef = p => ({
    path: p,
    get: async () => snapshot(p),
    set: async (data) => { store.set(p, data); },
    update: async (data) => { store.set(p, { ...store.get(p), ...data }); },
    collection: name => collectionRef(`${p}/${name}`),
  });
  const queryRef = (p, filters) => ({
    where: (field, op, value) => queryRef(p, [...filters, { field, op, value }]),
    get: async () => {
      const docs = [...store.keys()]
        .filter(key => key.startsWith(`${p}/`) && !key.slice(p.length + 1).includes('/'))
        .map(snapshot)
        .filter(doc => filters.every(({ field, op, value }) => {
          const actual = getPath(doc.data(), field);
          return op === 'in' ? value.includes(actual) : actual === value;
        }));
      return { docs, forEach: fn => docs.forEach(fn) };
    },
  });
  const collectionRef = p => ({
    ...queryRef(p, []),
    doc: id => docRef(`${p}/${id}`),
    add: async (data) => { autoId += 1; store.set(`${p}/auto${autoId}`, data); },
  });
  return {
    store,
    collection: name => collectionRef(name),
    txGetHook: null,
    runTransaction: async function runTransaction(fn) { return fn({
      get: (ref) => { this.txGetHook?.(ref.path); return ref.get(); },
      set: (ref, data) => { store.set(ref.path, data); },
      update: (ref, data) => { store.set(ref.path, { ...store.get(ref.path), ...data }); },
    }); },
  };
}

const USERS = {
  mgr1: { name: '管理甲', lineId: 'Umgr1', email: 'mgr1@example.com', roles: [], systems: ['銷控系統'] },
  mgr2: { name: '管理乙（未綁 LINE）', lineId: '', email: 'mgr2@example.com', roles: [], systems: ['銷控系統'] },
  mgr3: { name: '管理丙（都沒有）', lineId: '', email: '', roles: [], systems: ['銷控系統'] },
  admin1: { name: '系統管理員甲', lineId: 'Uadmin', email: 'admin@example.com', roles: ['系統管理員'], systems: ['銷控系統'] },
  sales1: { name: '銷售甲', lineId: 'Usales1', email: 'sales1@example.com', roles: [], systems: ['報價系統'] },
  sales2: { name: '銷售乙', lineId: '', email: '', roles: [], systems: ['報價系統'] },
  sales3: { name: '銷售丙', lineId: '', email: 'sales3@example.com', roles: [], systems: ['報價系統'] },
  quit1: { name: '離職人員', lineId: 'Uquit1', email: 'quit1@example.com', roles: [], systems: [] },
  none1: { name: '無權限者', lineId: '', email: 'none@example.com', roles: [], systems: [] },
};

function logFixtures() {
  const when = (daysAgo, hour = 1) => ({ toDate: () => new Date(Date.parse(`${addDays(-daysAgo)}T0${hour}:00:00Z`)) });
  return {
    'projects/p1/notificationLogs/paymentDue_a': {
      type: 'paymentDue', date: addDays(-1), trigger: 'schedule', status: 'partial', itemCount: 12, overdueCount: 3, sent: 3, failed: 1, skipped: 2, createdAt: when(1),
      attempts: [
        { userKey: 'mgr1', name: '管理甲', role: 'manager', channel: 'line', fallbackFrom: null, status: 'sent', error: null },
        { userKey: 'mgr1', name: '管理甲', role: 'manager', channel: 'email', fallbackFrom: null, status: 'sent', error: null },
        { userKey: 'mgr2', name: '管理乙（未綁 LINE）', role: 'manager', channel: 'email', fallbackFrom: 'line', status: 'sent', error: null },
        { userKey: 'sales1', name: '銷售甲', role: 'salesperson', channel: 'line', fallbackFrom: null, status: 'failed', error: 'LINE API 400 {"message":"The request body has 1 error(s)","details":[{"message":"May not be empty","property":"messages[0].contents.body.contents[3].contents[1].text"}]} 這是一段很長的錯誤訊息用來確認文字會換行不會撐破版面'.repeat(2).slice(0, 300) },
        { userKey: 'mgr3', name: '管理丙（都沒有）', role: 'manager', channel: null, fallbackFrom: null, status: 'skipped', error: 'no-contact' },
        { userKey: 'quit1', name: '離職人員', role: 'salesperson', channel: null, fallbackFrom: null, status: 'skipped', error: 'no-permission' },
      ],
    },
    'projects/p1/notificationLogs/paymentDue_b': { type: 'paymentDue', date: addDays(-2), trigger: 'schedule', status: 'done', itemCount: 5, sent: 4, failed: 0, skipped: 0, createdAt: when(2), attempts: [{ userKey: 'mgr1', name: '管理甲', channel: 'line', status: 'sent' }] },
    'projects/p1/notificationLogs/paymentDue_f': { type: 'paymentDue', date: addDays(-6), trigger: 'schedule', status: 'done', itemCount: 3, sent: 0, failed: 0, skipped: 0, noRecipients: true, createdAt: when(6), attempts: [] },
    'projects/p1/notificationLogs/paymentDue_g': { type: 'paymentDue', date: addDays(-7), trigger: 'schedule', status: 'partial', itemCount: 8, sent: 1, failed: 0, skipped: 0, lastError: 'DEADLINE_EXCEEDED: 讀取戶別逾時，下次排程補發', createdAt: when(7), attempts: [{ userKey: 'mgr1', name: '管理甲', channel: 'email', status: 'sent' }] },
    'projects/p1/notificationLogs/paymentDue_c': { type: 'paymentDue', date: addDays(-3), trigger: 'schedule', status: 'empty', itemCount: 0, sent: 0, failed: 0, skipped: 0, createdAt: when(3), attempts: [] },
    'projects/p1/notificationLogs/paymentDue_d': { type: 'paymentDue', date: addDays(-4), trigger: 'schedule', status: 'blocked', itemCount: 0, sent: 0, failed: 0, skipped: 0, createdAt: when(4), attempts: [] },
    'projects/p1/notificationLogs/test_e': { type: 'paymentDueTest', date: addDays(-5), trigger: 'manual', status: 'done', itemCount: 1, sent: 2, failed: 0, skipped: 0, createdAt: when(5), attempts: [{ userKey: 'mgr1', name: '管理甲', role: 'test', channel: 'email', status: 'sent' }] },
    'projects/p1/notificationLogs/other': { type: 'salesStatus', date: addDays(-1), status: 'done', createdAt: when(1), attempts: [] },
  };
}

function createBackend() {
  const backend = {
    calls: [],
    failures: {}, // { 'paymentProofApi:addRecord': '訊息', 'getProjectSettings': '訊息' }
    trashed: [],
    uploads: [],
    savedSettings: [],
    blockedProject: false,
    sendFail: () => false,
    emptyData: false,
    noTemplates: false,
    db: null,
  };

  backend.modalParkingList = () => [...parkingFixtures(), ...(backend.extraParkings || [])].map((p, i) => ({ id: `pk${i}`, ...p }));

  backend.reset = (opts = {}) => {
    backend.extraParkings = opts.extraParkings || [];
    const seed = { 'projects/p1': { name: '森之丘', paymentReminderSettings: undefined, packageContractTypes: ['毛胚合約'] }, ...logFixtures() };
    Object.entries(USERS).forEach(([key, u]) => {
      const { systems, ...data } = u;
      seed[`users/${key}`] = data;
      seed[`userPermissions/${key}`] = { permissions: { p1: { systems } } };
    });
    Object.values(unitFixtures()).forEach(u => { seed[`salesHouseholds/p1_${u.unitId}`] = u; });
    if (opts.projectSettings !== undefined) seed['projects/p1'].paymentReminderSettings = opts.projectSettings;
    if (opts.salesSheet) Object.assign(seed['projects/p1'], { salesSheetId: 'sheet-1', salesSheetTabName: '銷控' });
    backend.db = createFakeDb(seed);
    backend.sheetSyncError = opts.sheetSyncError || null;
    backend.sheetSyncCalls = [];
    backend.batchResults = [];
    backend.batchOverride = null;
    backend.extraParkings = opts.extraParkings || [];
    backend.parkingFail = null; // (docId, data) => true 時該筆車位寫入失敗
    backend.salesNotification = null; // 下一次 updateSalesData 回傳的 notification
    backend.parkingState = new Map(backend.modalParkingList().map(({ id, ...p }) => [id, p]));
    backend.calls = [];
    backend.failures = opts.failures || {};
    backend.trashed = [];
    backend.uploads = [];
    backend.savedSettings = [];
    backend.parkingWrites = [];
    backend.onCall = null;
    backend.blockedProject = !!opts.blockedProject;
    backend.sendFail = opts.sendFail || (() => false);
    backend.emptyData = !!opts.emptyData;
    backend.noTemplates = !!opts.noTemplates;
    backend.templates = opts.templates;
    Object.entries(opts.contractDocs || {}).forEach(([unit, contractDocData]) => {
      const key = `salesHouseholds/p1_${unit}`;
      backend.db.store.set(key, { ...backend.db.store.get(key), contractDocData });
    });
  };

  const households = () => [...backend.db.store.entries()]
    .filter(([key]) => key.startsWith('salesHouseholds/'))
    .map(([, value]) => value)
    .filter(u => LIST_UNITS.includes(u.unitId) && !backend.emptyData);

  // 網格以「樓層＋棟別」定位，每戶給不同樓層才都看得到
  const salesControlHouseholds = () => LIST_UNITS.map((unitId, index) => {
    const unit = backend.db.store.get(`salesHouseholds/p1_${unitId}`);
    return { id: `p1_${unitId}`, ...unit, building: unit.building, floor: String(index + 2), layout: '住家', price_list_house_total: 1500, price_list_house_only: 1500 };
  });

  const deps = {
    isBlocked: async () => backend.blockedProject,
    loadHouseholds: async () => households(),
    loadRecipientContext: async (db, projectId, salesKeys) => {
      const managerKeys = new Set(Object.entries(USERS).filter(([, u]) => u.systems.includes('銷控系統')).map(([k]) => k));
      const contacts = new Map();
      const permissions = new Map();
      const toContact = (key, u) => ({
        userKey: key, name: u.name, lineId: u.lineId && u.lineId.startsWith('U') ? u.lineId : null, email: u.email || null, roles: u.roles,
      });
      managerKeys.forEach(key => contacts.set(key, toContact(key, USERS[key])));
      [...(salesKeys || [])].forEach(key => {
        if (USERS[key]) contacts.set(key, toContact(key, USERS[key]));
        permissions.set(key, USERS[key]?.systems || []);
      });
      return { managerKeys, contacts, permissions };
    },
    createSender: async () => async ({ channel, contact }) => {
      if (backend.sendFail(contact, channel)) throw new Error('LINE 尚未綁定此帳號');
    },
    syncSalesSheet: async ({ projectId, spreadsheetId, sheetName }) => {
      backend.sheetSyncCalls.push({ projectId, spreadsheetId, sheetName });
      if (backend.sheetSyncError) throw new Error(backend.sheetSyncError);
    },
  };

  // 比照 src/api.js：callable 失敗時回 { status, code, message }，code 是 SDK 的 functions/xxx
  function httpsError(message, code = 'invalid-argument') {
    return { status: 'error', code: `functions/${code}`, message };
  }

  function sniffProof(base64) {
    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length > 10 * 1024 * 1024) return { error: '檔案大小超過 10MB 上限。' };
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return { mimeType: 'image/jpeg', ext: 'jpg' };
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return { mimeType: 'image/png', ext: 'png' };
    if (buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP') return { mimeType: 'image/webp', ext: 'webp' };
    if (buffer.slice(0, 4).toString('ascii') === '%PDF') return { mimeType: 'application/pdf', ext: 'pdf' };
    return { error: '僅接受 JPG、PNG、WEBP 圖檔或 PDF，請確認檔案內容。' };
  }

  // 依 functions/index.js 的 paymentProofApi 流程：同一組驗證、同一組組裝函式，Drive 改成記錄
  function paymentProofApi(data) {
    const { action, projectId, unitId, base64, fileId, recordId, removeFile } = data;
    if (!projectId || !unitId) return httpsError('缺少必要參數 (projectId, unitId)。');
    const payloadError = proof.paymentPayloadError(data);
    if (payloadError) return httpsError(payloadError);
    if (action === 'trashFile') {
      if (!fileId) return httpsError('缺少必要參數 (fileId)。');
      backend.trashed.push(fileId);
      return { status: 'success', fileId, trashWarning: false };
    }
    if (action === 'rename') return { status: 'success', file: { fileId, fileName: 'renamed.jpg', webViewLink: '' } };
    const key = `salesHouseholds/${projectId}_${unitId}`;
    const house = backend.db.store.get(key);
    const list = () => (Array.isArray(backend.db.store.get(key)?.paymentRecords) ? backend.db.store.get(key).paymentRecords : []);
    const save = next => backend.db.store.set(key, { ...backend.db.store.get(key), paymentRecords: next });
    if (action === 'deleteRecord') {
      if (!recordId) return httpsError('缺少必要參數 (recordId)。');
      const removed = list().find(r => r && r.id === recordId);
      if (!removed) return httpsError('找不到指定的繳款紀錄，可能已被其他人刪除，請重新整理。');
      save(list().filter(r => r.id !== recordId));
      if (removed.file?.fileId) backend.trashed.push(removed.file.fileId);
      return { status: 'success', removedId: recordId, trashWarning: false };
    }
    if (!['upload', 'addRecord', 'updateRecord'].includes(action)) return httpsError(`未知的 action: ${action}`);
    if (action === 'updateRecord' && !recordId) return httpsError('缺少必要參數 (recordId)。');
    let uploaded = null;
    if (base64) {
      if (!house) return httpsError(`找不到戶別 ${unitId}`);
      if (!house.driveFolderUrl) return httpsError(`戶別 "${unitId}" 尚未設定「戶別資料夾位置」，無法上傳繳款憑證。`);
      const sniff = sniffProof(base64);
      if (sniff.error) return httpsError(sniff.error);
      const id = `up_${backend.uploads.length + 1}`;
      uploaded = { fileId: id, fileName: `${data.date}_${unitId}.${sniff.ext}`, webViewLink: `https://drive.google.com/file/d/${id}/view`, mimeType: sniff.mimeType, uploadedAt: new Date().toISOString() };
      backend.uploads.push({ id, mimeType: sniff.mimeType, size: Buffer.from(base64, 'base64').length });
    }
    if (action === 'upload') return { status: 'success', file: uploaded };
    const nowIso = new Date().toISOString();
    if (action === 'addRecord') {
      const record = proof.buildPaymentRecord(data, { id: `pr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, nowIso, file: uploaded });
      save([...list(), record]);
      return { status: 'success', record };
    }
    const current = list().find(r => r && r.id === recordId);
    if (!current) return httpsError('找不到指定的繳款紀錄，可能已被其他人刪除，請重新整理。');
    if (proof.isUnpaidPaymentPayload(data)) {
      const unpaidError = proof.unpaidUpdateError(current, data);
      if (unpaidError) return httpsError(unpaidError);
    }
    let nextFile = current.file || null;
    if (uploaded) nextFile = uploaded;
    else if (removeFile) {
      nextFile = null;
      if (current.file?.fileId) backend.trashed.push(current.file.fileId);
    }
    const record = proof.applyPaymentRecordUpdate(current, data, { nowIso, file: nextFile });
    save(list().map(r => (r.id === recordId ? record : r)));
    return { status: 'success', record, renameWarning: false, trashWarning: false };
  }

  async function paymentReminderApi(data) {
    const { action, projectId, userKey } = data;
    if (!projectId) return httpsError('缺少必要參數 (projectId)。');
    try {
      const db = backend.db;
      const access = await reminder.getProjectAccess(db, userKey, projectId);
      switch (action) {
        case 'listDue': return await reminder.handleListDue({ db, projectId, access, deps });
        case 'batchAddPlans': {
          const batchResult = await reminder.handleBatchAddPlans({ db, projectId, access, expectedDate: data.expectedDate, period: data.period, note: data.note, entries: data.entries, deps });
          backend.batchResults.push(batchResult);
          return batchResult;
        }
        case 'previewRecipients': return await reminder.handlePreviewRecipients({ db, projectId, access, settings: data.settings, deps });
        case 'sendTest': return await reminder.handleSendTest({ db, projectId, projectName: '森之丘', access, channels: data.channels, deps });
        case 'listLogs': return await reminder.handleListLogs({ db, projectId, access, limit: data.limit });
        default: return httpsError(`未知的 action: ${action}`);
      }
    } catch (error) {
      return httpsError(error.message, error.code || 'internal');
    }
  }

  backend.dispatch = async (fn, payload) => {
    const label = payload && payload.action ? `${fn}:${payload.action}` : fn;
    backend.calls.push({ fn, action: payload?.action, payload: JSON.parse(JSON.stringify(payload ?? null)) });
    await backend.onCall?.(fn, payload);
    const failure = backend.failures[label] || backend.failures[fn];
    if (failure) return { __throw: failure.message || failure, __code: failure.code || 'functions/internal' };
    switch (fn) {
      case 'paymentProofApi': return paymentProofApi(payload);
      case 'paymentReminderApi': return paymentReminderApi(payload);
      case 'household': return backend.db.store.get(`salesHouseholds/p1_${payload.unitId}`) || null;
      case 'fetchSalesHouseholdsOnce': return backend.emptyData ? [] : households();
      case 'salesParkings': return parkingFixtures();
      case 'modalParkings': return backend.modalParkingList();
      case 'fetchPaymentTermTemplates': return { status: 'success', data: backend.noTemplates ? [] : (backend.templates || templateFixtures()) };
      case 'getProjectSettings': {
        const project = backend.db.store.get('projects/p1');
        return { id: 'p1', ...project };
      }
      case 'getDoc': return backend.db.store.get(payload.path) || null;
      case 'fetchContractDocConfig': return { pages: [] };
      case 'fetchContractDocData': return backend.db.store.get(`salesHouseholds/${payload.householdDocId}`)?.contractDocData ?? null;
      case 'updateContractDocData': {
        const key = `salesHouseholds/${payload.householdDocId}`;
        backend.db.store.set(key, { ...backend.db.store.get(key), contractDocData: payload.data });
        return { status: 'success' };
      }
      case 'updateSalesData': {
        const key = `salesHouseholds/${payload.projectId}_${payload.unitId}`;
        backend.db.store.set(key, { ...backend.db.store.get(key), ...payload.data });
        const notification = backend.salesNotification;
        backend.salesNotification = null;
        return notification ? { status: 'success', notification } : { status: 'success' };
      }
      case 'updateParkingLot': {
        if (backend.parkingFail?.(payload.docId, payload.dataToUpdate)) return { __throw: '網路逾時', __code: 'functions/internal' };
        backend.parkingWrites.push(payload);
        backend.parkingState.set(payload.docId, { ...(backend.parkingState.get(payload.docId) || {}), ...payload.dataToUpdate });
        return null;
      }
      case 'salesControlData': return {
        project: { name: '森之丘', packageContractTypes: ['毛胚合約'] },
        parameters: [{ id: 's1', statusName: '小訂', order: 1 }, { id: 's2', statusName: '簽約', order: 2 }, { id: 's3', statusName: '成交', order: 3 }, { id: 's4', statusName: '自訂狀態', order: 4 }, { id: 's5', statusName: '退戶', order: 5 }],
        households: salesControlHouseholds(),
        parkings: parkingFixtures().map((p, i) => ({ id: `pk${i}`, ...p })),
        personnel: [],
      };
      case 'updateProjectSalesSettings': {
        backend.savedSettings.push(payload);
        backend.db.store.set('projects/p1', { ...backend.db.store.get('projects/p1'), ...payload.dataToUpdate });
        return null;
      }
      default: return { __throw: `未實作的假 API: ${fn}` };
    }
  };
  return backend;
}

// ── 前端假模組 ──
const API_MOCK = `
// callable 會把 undefined 編碼成 null（firebase/functions encode），假 API 要一樣才測得出前端傳錯
const encode = v => (v === undefined ? null : Array.isArray(v) ? v.map(encode)
  : (v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, encode(x)])) : v));
const raw = async (fn, payload) => {
  const res = await window.__backendCall(fn, payload);
  if (res && res.__throw) throw Object.assign(new Error(res.__throw), { code: res.__code });
  return res;
};
const callable = async (fn, payload) => {
  try { return await raw(fn, encode(payload)); } catch (error) { return { status: 'error', code: error.code, message: error.message }; }
};
const firestoreSafe = (value, path = '') => {
  if (value === undefined) throw new Error('Function updateDoc() called with invalid data. Unsupported field value: undefined (' + path + ')');
  if (value && typeof value === 'object') Object.entries(value).forEach(([k, x]) => firestoreSafe(x, path + '.' + k));
  return value;
};
export const paymentProofApi = payload => callable('paymentProofApi', payload);
export const paymentReminderApi = payload => callable('paymentReminderApi', payload);
export const fetchPaymentTermTemplates = async projectId => {
  try { return await raw('fetchPaymentTermTemplates', { projectId }); } catch (error) { return { status: 'error', message: error.message }; }
};
export const fetchSalesHouseholdsOnce = projectId => raw('fetchSalesHouseholdsOnce', { projectId });
export const getProjectSettings = projectId => raw('getProjectSettings', { projectId });
export const updateProjectSalesSettings = async (projectId, dataToUpdate) => {
  firestoreSafe(dataToUpdate);
  await raw('updateProjectSalesSettings', { projectId, dataToUpdate });
};
export const generatePaymentDocument = async () => ({ status: 'error', message: 'harness' });
export const fetchContractDocConfig = projectId => raw('fetchContractDocConfig', { projectId });
export const fetchContractDocData = householdDocId => raw('fetchContractDocData', { householdDocId });
export const updateContractDocData = (householdDocId, data) => raw('updateContractDocData', { householdDocId, data });
export const updateSalesData = payload => raw('updateSalesData', encode(payload));
export const updateParkingLot = (docId, dataToUpdate) => raw('updateParkingLot', { docId, dataToUpdate });
export const listenToSalesControlData = (projectId, onData, onError) => {
  raw('salesControlData', { projectId }).then(onData).catch(error => onError?.(error));
  return () => {};
};
export const listenToSalesImages = (_projectId, onData) => { setTimeout(() => onData([]), 0); return () => {}; };
export const getProjectStatusColors = async () => ({ status: 'success', data: {} });
export const updateProjectStatusColors = async () => ({ status: 'success' });
`;

function buildApiMock() {
  const source = readFileSync(path.join(root, 'src/api.js'), 'utf8');
  const names = [...source.matchAll(/^export\s+(?:async\s+)?(?:const|let|function\*?|class)\s+([A-Za-z0-9_$]+)/gm)].map(m => m[1]);
  const explicit = new Set([...API_MOCK.matchAll(/^export const ([A-Za-z0-9_$]+)/gm)].map(m => m[1]));
  const stubs = names.filter(name => !explicit.has(name)).map((name) => {
    if (/^[A-Z0-9_]+$/.test(name)) return `export const ${name} = '';`;
    if (/^(listen|subscribe|watch)/.test(name)) return `export const ${name} = () => () => {};`;
    return `export const ${name} = (...args) => { (window.__unmockedApi = window.__unmockedApi || []).push('${name}'); return Promise.resolve({ status: 'success', data: [] }); };`;
  });
  return `${API_MOCK}\n${stubs.join('\n')}`;
}

const FIRESTORE_MOCK = `
export const collection = (_db, name) => ({ name });
export const where = (...args) => ({ where: args });
export const query = (col, ...rest) => ({ ...col, rest });
export const doc = (...args) => ({ path: args.slice(1).join('/') });
export const serverTimestamp = () => new Date();
export const getDoc = async (ref) => {
  const res = await window.__backendCall('getDoc', { path: ref.path });
  return { id: ref.path.split('/').pop(), exists: () => !!res, data: () => res || undefined };
};
export const updateDoc = async () => { window.__firestoreWrites = (window.__firestoreWrites || 0) + 1; };
export const setDoc = updateDoc;
export const addDoc = updateDoc;
export const deleteDoc = updateDoc;
export const onSnapshot = () => () => {};
export const orderBy = (...args) => ({ orderBy: args });
export const limit = n => ({ limit: n });
export const writeBatch = () => ({ set() {}, update() {}, delete() {}, commit: async () => {} });
export const runTransaction = async () => { throw new Error('harness: runTransaction not allowed'); };
export const arrayUnion = (...args) => args;
export const arrayRemove = (...args) => args;
export const increment = n => n;
export const deleteField = () => null;
export const documentId = () => '__name__';
export const collectionGroup = (_db, name) => ({ name });
export const startAfter = (...args) => ({ startAfter: args });
export const getCountFromServer = async () => ({ data: () => ({ count: 0 }) });
export const Timestamp = { now: () => ({ toDate: () => new Date() }), fromDate: d => ({ toDate: () => d }) };
export const getDocs = async (q) => {
  if (q.name === 'salesParkings') {
    const rows = await window.__backendCall('salesParkings', {});
    if (rows && rows.__throw) throw new Error(rows.__throw);
    const docs = rows.map(row => ({ data: () => row }));
    return { docs, forEach: fn => docs.forEach(fn) };
  }
  if (window.__harnessAllowEmptyDocs) return { docs: [], forEach() {}, empty: true, size: 0 };
  throw new Error('harness: unexpected getDocs ' + q.name);
};
`;

const MOCK_MODULES = {
  'src/api': buildApiMock(),
  'src/firebase': 'export const db = {}; export const functions = {}; export const storage = {}; export const auth = {}; export default {};',
  'src/store/user': `export const useUserStore = () => ({
    get user() { return window.__user; },
    get isLoggedIn() { return !!window.__user; },
    fetchUserByLineId: async () => { window.__user = window.__boundUser; return !!window.__boundUser; },
    hasProjectPermission: () => true,
    currentUserRoles: [],
  });`,
  'src/composables/useSystemPresence': 'export const useSystemPresence = () => ({});',
  'src/utils/liffAuth': `export const initializeLiff = async (id) => {
    window.__liff.initCalls.push(id);
    if (window.__liff.initError) throw new Error(window.__liff.initError);
  };`,
  'src/store/projectStore': `export const useProjectStore = () => ({
    idToNameMap: { p1: '森之丘' },
    getProjectById: id => ({ id, name: '森之丘', packageContractTypes: ['毛胚合約'], paymentDocSettings: {}, ...(new URLSearchParams(location.search).get('prefOption') === '1' ? { showPreferredPaymentInQuote: true } : {}) }),
    setCurrentProject() {},
    projectsList: [{ id: 'p1', name: '森之丘' }],
    fetchProjects: async () => {},
  });`,
};
const BARE_MOCKS = {
  'firebase/storage': `export const ref = () => ({});
    export const uploadBytes = async () => ({});
    export const uploadBytesResumable = () => ({ on() {} });
    export const getDownloadURL = async () => '';
    export const deleteObject = async () => {};
    export const listAll = async () => ({ items: [], prefixes: [] });`,
  // 繪圖引擎與這裡無關，只要載入不出錯
  fabric: `const any = new Proxy(function () {}, {
      get: (_t, key) => (key === Symbol.toPrimitive ? () => '' : key === Symbol.iterator ? function* () {} : any),
      apply: () => any,
      construct: () => any,
    });
    export const fabric = any;
    export default any;`,
  '@line/liff': `export default {
    isInClient: () => window.__liff.inClient,
    isLoggedIn: () => window.__liff.loggedIn,
    login: (options) => { window.__liff.loginCalls.push(options); },
    getProfile: async () => ({ userId: 'Uline' }),
  };`,
  'firebase/firestore': FIRESTORE_MOCK,
  'vue-toastification': `window.__toasts = window.__toasts || [];
    export const POSITION = { BOTTOM_CENTER: 'bottom-center', TOP_CENTER: 'top-center', TOP_RIGHT: 'top-right' };
    const push = type => (message) => { window.__toasts.push({ type, message: String(message) }); };
    export const useToast = () => ({ success: push('success'), error: push('error'), warning: push('warning'), info: push('info') });
    export default { install() {} };`,
};

const ENTRY = `
import { createApp, h, reactive, defineAsyncComponent, onMounted, Suspense } from 'vue';
import { createRouter, createWebHashHistory, useRouter, RouterView } from 'vue-router';
import { VApp } from 'vuetify/components/VApp';
import vuetify from '/src/plugins/vuetify.js';
import '/src/styles/macosUi.css';
import '/src/styles/fileDrop.css';
import { vFileDrop } from '/src/directives/vFileDrop.js';
import { paymentProofApi } from '@/api';
import { useToast } from 'vue-toastification';
import { paymentProofFileToBase64 } from '/src/utils/paymentRecordActions.js';

const q = new URLSearchParams(location.search);
const view = q.get('view') || 'panel';
const USERS = {
  manager: { key: 'mgr1', name: '管理甲', roles: [], permissions: { p1: { systems: ['銷控系統'] } } },
  sales: { key: 'sales1', name: '銷售甲', roles: [], permissions: { p1: { systems: ['報價系統'] } } },
  admin: { key: 'admin1', name: '系統管理員甲', roles: ['系統管理員'], permissions: {} },
  none: { key: 'none1', name: '無權限者', roles: [], permissions: {} },
  apiDenied: { key: 'none1', name: '無權限者', roles: [], permissions: { p1: { systems: ['報價系統'] } } },
};
window.__user = q.get('role') === 'anon' ? null : USERS[q.get('role') || 'manager'];
window.__boundUser = USERS[q.get('bound')] || null;
window.__liff = { inClient: q.get('inClient') === '1', loggedIn: q.get('liffLoggedIn') === '1', initError: q.get('initError') || '', loginCalls: [], initCalls: [] };
window.__nav = [];
const blank = { render: () => null };
if (view === 'sales' && !location.hash.includes('sales-control')) location.hash = '#/sales-control/p1';
const salesPage = view === 'sales' ? (await import('/src/views/SalesControlSystem.vue')).default : blank;

// 入口完整流程：與 src/bootstrap.js 相同的判斷與順序（用真的 liffApps／leadReportLink），之後才建立路由
if (view === 'entryflow') {
  const { findLiffLaunch, liffLaunchUrl } = await import('/src/utils/liffApps.js');
  const { isLeadLiffLaunch, legacyLeadReportRedirect } = await import('/src/utils/leadReportLink.js');
  const { initializeLiff } = await import('@/utils/liffAuth');
  const href = location.href;
  const launch = findLiffLaunch(href);
  window.__launch = { lead: isLeadLiffLaunch(href), legacy: legacyLeadReportRedirect(href), launch };
  if (launch) {
    try { await initializeLiff(launch.liffId); } catch { /* 頁面會再初始化一次 */ }
    const url = liffLaunchUrl(location.href, launch.route);
    if (url) history.replaceState(history.state, '', url);
  }
}
// 對照組：沒有等 App.vue 的 onMounted 就導頁（修正前的寫法），確認這個流程真的重現得出卡住
const ControlEntry = {
  props: ['projectId'],
  setup(props) {
    const r = useRouter();
    onMounted(() => { if (window.__user) r.replace({ name: 'PaymentDueList', params: { projectId: props.projectId } }); });
    return () => h('div', { class: 'pde-control' }, '對照組');
  },
};
const flowRoutes = view === 'entryflow' ? [
  { path: '/payment-due-entry/:projectId', name: 'PaymentDueEntry', props: true, component: q.get('control') === '1' ? ControlEntry : () => import('/src/views/PaymentDueEntry.vue') },
  { path: '/customer-management-entry', name: 'CustomerManagementEntry', component: { render: () => h('div', { class: 'cme-page' }, '客資入口') } },
] : [];
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    ...flowRoutes,
    { path: '/', name: 'Harness', component: blank },
    { path: '/home', name: 'Home', component: blank },
    { path: '/sales-control/:projectName', name: 'SalesControlSystem', component: salesPage, meta: { viewMode: 'sales', requiredSystem: '銷控系統' } },
    { path: '/payment-due/:projectId', name: 'PaymentDueList', component: blank },
    { path: '/login', name: 'Login', component: blank },
  ],
});
window.__navFull = [];
router.afterEach((to) => {
  if (to.name === 'Harness' || (view === 'sales' && to.name === 'SalesControlSystem')) return;
  window.__nav.push({ name: to.name, params: { ...to.params } });
  window.__navFull.push(to.fullPath);
});

const HAMBURGER = () => h('button', {
  class: 'harness-hamburger', title: '全站選單',
  style: 'position:fixed;top:10px;left:10px;width:40px;height:40px;z-index:1500;border:0;border-radius:50%;background:rgba(255,255,255,.6);box-shadow:0 1px 6px rgba(0,0,0,.2);',
}, '≡');

window.__panelEvents = [];
async function mountPanel() {
  const PaymentRecordsPanel = (await import('/src/components/PaymentRecordsPanel.vue')).default;
  const toast = useToast();
  const unitId = q.get('unit') || 'A1';
  const house = await window.__backendCall('household', { unitId });
  const state = reactive({ records: house.paymentRecords || [], contractDocOpen: false });
  window.__panelState = state;
  const operator = window.__user.name;
  // 與 UnitDetailModal 的 handleQuick* 相同的參數處理
  const quickAdd = async ({ date, amount, note, file, silent, ...planFields }) => {
    const base64 = file ? await paymentProofFileToBase64(file) : null;
    const res = await paymentProofApi({ action: 'addRecord', projectId: 'p1', unitId, base64, date, amount, note, ...planFields, paidBy: operator });
    if (res.status !== 'success' || !res.record) throw new Error(res.message || '請稍後再試');
    state.records = [...state.records, res.record];
    if (silent) return;
    toast.success('繳款紀錄已新增');
  };
  const quickUpdate = async ({ recordId, date, amount, note, file, removeFile, silent, ...planFields }) => {
    const base64 = file ? await paymentProofFileToBase64(file) : null;
    const res = await paymentProofApi({ action: 'updateRecord', projectId: 'p1', unitId, recordId, base64, removeFile: !!removeFile, date, amount, note, ...planFields, paidBy: operator });
    if (res.status !== 'success' || !res.record) throw new Error(res.message || '請稍後再試');
    state.records = state.records.map(r => (r.id === recordId ? res.record : r));
    if (silent) return;
    toast.success('繳款紀錄已更新');
  };
  const quickDelete = async ({ recordId }) => {
    const res = await paymentProofApi({ action: 'deleteRecord', projectId: 'p1', unitId, recordId });
    if (res.status !== 'success') throw new Error(res.message || '請稍後再試');
    state.records = state.records.filter(r => r.id !== recordId);
    toast.success('繳款紀錄已刪除');
  };
  const editable = q.get('editable') === '1';
  const readonly = q.get('readonly') === '1';
  const total = q.has('total') ? Number(q.get('total')) : (Number(house.price_transaction_house) || 0);
  return () => h(PaymentRecordsPanel, {
    modelValue: state.records,
    'onUpdate:modelValue': (v) => { state.records = v; },
    editable,
    totalPriceWan: total,
    unitId,
    driveFolderUrl: house.driveFolderUrl || '',
    defaultExpanded: q.get('collapsed') !== '1',
    allowQuickAdd: !readonly && !editable,
    quickAddHandler: readonly || editable ? null : quickAdd,
    quickUpdateHandler: readonly || editable ? null : quickUpdate,
    quickDeleteHandler: readonly || editable ? null : quickDelete,
    projectId: 'p1',
    unitData: house,
    contractDocOpen: state.contractDocOpen,
    onOpenContractDoc: () => window.__panelEvents.push('open-contract-doc'),
    onPlansSaved: () => window.__panelEvents.push('plans-saved'),
  });
}

async function mountList() {
  const PaymentDueList = (await import('/src/views/PaymentDueList.vue')).default;
  return () => h(PaymentDueList, { projectId: 'p1' });
}

async function mountSettings() {
  const PaymentReminderSettings = (await import('/src/components/payment/PaymentReminderSettings.vue')).default;
  return () => h(PaymentReminderSettings, { projectId: 'p1' });
}

async function mountSchedule() {
  const Dialog = (await import('/src/components/PaymentSchedulePreviewDialog.vue')).default;
  const context = JSON.parse(q.get('context'));
  const state = reactive({ show: false });
  setTimeout(() => { state.show = true; }, 50);
  return () => h(Dialog, { show: state.show, projectId: 'p1', projectName: '森之丘', context });
}

async function mountModal(app) {
  window.__harnessAllowEmptyDocs = true;
  const UnitDetailModal = (await import('/src/components/UnitDetailModal.vue')).default;
  const unitId = q.get('unit') || 'A1';
  const house = await window.__backendCall('household', { unitId });
  // 總表價／總底價由分項推算，分項要對得上，否則儲存會先跳「確認變更價格」
  const state = reactive({ show: false, unit: { ...house, price_list_house_only: 1500, price_list_house_total: 1500, price_floor_house_only: 900, price_floor_house_total: 900 } });
  setTimeout(() => { state.show = true; }, 80);
  window.__modalEvents = [];
  state.parkings = await window.__backendCall('modalParkings', {});
  // 模擬上層的即時監聽把車位資料刷新
  window.__setModalParkings = (list) => { state.parkings = list; };
  return () => h(UnitDetailModal, {
    show: state.show,
    'onUpdate:show': (v) => { state.show = v; },
    onDataUpdated: () => window.__modalEvents.push('data-updated'),
    unitData: state.unit,
    viewMode: 'sales',
    allData: { '參數': [{ statusName: '小訂' }, { statusName: '補足' }, { statusName: '簽約' }], '車位': state.parkings },
    projectName: '森之丘',
    projectId: 'p1',
    contractTypes: ['一般合約', '毛胚合約'],
    project: { id: 'p1', name: '森之丘' },
    initialTab: q.get('tab') || 'info',
    initialEditing: q.get('editing') === '1',
  });
}

async function mountSales() {
  window.__harnessAllowEmptyDocs = true;
  const { RouterView } = await import('vue-router');
  return () => h(RouterView);
}

async function mountEntry() {
  const PaymentDueEntry = (await import('/src/views/PaymentDueEntry.vue')).default;
  return () => h(PaymentDueEntry, { projectId: 'p1' });
}

// 與 src/App.vue 相同：Suspense 內放 router-view，掛載後依 liff_path 再導一次（子元件的 onMounted 先跑）
const FlowApp = {
  setup() {
    const r = useRouter();
    onMounted(() => {
      const liffPath = new URLSearchParams(window.location.search).get('liff_path');
      if (liffPath) r.replace('/' + liffPath.replace(/^\\/+/, ''));
    });
    return () => h(Suspense, null, { default: () => h(RouterView) });
  },
};
async function mountBroken() {
  await import('/@harness/broken.js');
  return () => null;
}
async function mountEntryFlow() {
  return () => h(FlowApp);
}

async function mountUtils() {
  const [columns, status, format, commission] = await Promise.all([
    import('/src/utils/paymentRecordColumns.js'),
    import('/src/utils/paymentRecordStatus.js'),
    import('/src/utils/salesDrawing/fieldFormat.js'),
    import('/src/utils/commissionCalculation.js'),
  ]);
  window.__utils = { columns, status, format, commission };
  window.__utilsReady = true;
  return () => h('div', 'utils');
}

const render = await ({ panel: mountPanel, list: mountList, settings: mountSettings, schedule: mountSchedule, utils: mountUtils, entry: mountEntry, entryflow: mountEntryFlow, broken: mountBroken, modal: mountModal, sales: mountSales }[view])();
const app = createApp({
  render: () => h(VApp, null, {
    default: () => [
      HAMBURGER(),
      (view === 'panel' || view === 'settings')
        ? h('div', { class: 'harness-host', style: 'padding:64px 12px 24px;max-width:760px;margin:0 auto;width:100%;box-sizing:border-box;' }, [render()])
        : render(),
    ],
  }),
});
app.config.errorHandler = (error, _instance, info) => { console.error('[vue-error]', info, error && error.stack || error); };
app.config.warnHandler = (msg, _instance, trace) => { console.error('[Vue warn] ' + msg + (trace ? '\\n' + trace : '')); };
if (view === 'modal' || view === 'sales') {
  const { createPinia } = await import('pinia');
  app.use(createPinia());
  // 與 main.js 相同的全域註冊，才不會誤報 Failed to resolve component
  const { VExpansionPanels, VList } = await import('vuetify/components');
  app.component('VExpansionPanels', VExpansionPanels).component('VList', VList)
    .component('font-awesome-icon', { render: () => null }).component('vue-draggable-resizable', { render: () => null })
    .directive('reveal', {});
}
app.directive('file-drop', vFileDrop).use(router).use(vuetify);
if (view === 'entryflow') await router.isReady(); // 與 src/main.js 相同：路由解析完才掛載
app.mount('#app');
window.__ready = true;
`;

// ── Vite ──
// 每次執行獨立：共用同一個快取時，別的 harness 跑完會刪掉或改寫它，進行中的這一輪就會收到 504 Outdated Optimize Dep
const cacheDir = path.join(root, `node_modules/.vite-harness-${process.pid}`);
const mockResolver = {
  name: 'payment-harness',
  enforce: 'pre',
  resolveId(source, importer) {
    if (source === '/@harness/entry.js') return '\0harness-entry';
    if (source === '/@harness/broken.js') return '\0harness-broken';
    if (BARE_MOCKS[source]) return `\0mock-bare:${source}`;
    if (source.startsWith('firebase/')) throw new Error(`harness: 未 mock 的 ${source}（來自 ${importer}）`);
    let abs = null;
    if (source.startsWith('@/')) abs = path.join(root, 'src', source.slice(2));
    else if (source.startsWith('/src/')) abs = path.join(root, source);
    else if (source.startsWith(root)) abs = source;
    else if (source.startsWith('.') && importer && !importer.startsWith('\0')) abs = path.resolve(path.dirname(importer.split('?')[0]), source);
    if (!abs) return null;
    const rel = path.relative(root, abs).replace(/\.(js|ts|mjs)$/, '').replace(/\/index$/, '');
    if (MOCK_MODULES[rel]) return `\0mock:${rel}`;
    return null;
  },
  load(id) {
    if (id === '\0harness-entry') return ENTRY;
    if (id === '\0harness-broken') return 'export default {'; // 故意的語法錯誤：Vite 回 500，等同真的編譯錯誤
    if (id.startsWith('\0mock-bare:')) return BARE_MOCKS[id.slice('\0mock-bare:'.length)];
    if (id.startsWith('\0mock:')) return MOCK_MODULES[id.slice('\0mock:'.length)];
    return null;
  },
  configureServer(s) {
    s.middlewares.use((req, res, next) => {
      if (req.url.startsWith('/harness')) {
        res.setHeader('Content-Type', 'text/html');
        res.end('<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>harness</title></head><body><div id="app"></div><script type="module" src="/@harness/entry.js"></script></body></html>');
      } else next();
    });
  },
};

// ── 瀏覽器工具 ──
const results = [];
function check(group, name, ok, detail = '') {
  results.push({ group, name, ok: !!ok, detail: ok ? '' : String(detail) });
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`${mark} [${group}] ${name}${ok ? '' : ` :: ${detail}`}`);
}
const eq = (group, name, actual, expected) => {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  check(group, name, a === b, `實際 ${a}，預期 ${b}`);
};
// 已知問題：照常執行並列入報告，不影響結束碼；一旦不再重現就提示，可改回一般 check
function known(group, name, ok, detail = '', note = '') {
  results.push({ group, name, ok: !!ok, known: true, note, detail: ok ? '' : String(detail) });
  if (ok) console.log(`FIXED [${group}] ${name} :: 已知問題已不再重現，請把這項改回一般檢查`);
  else console.log(`KNOWN [${group}] ${name} :: ${detail}${note ? `（${note}）` : ''}`);
}

const blockedRequests = [];
const driveStubbed = [];
const consoleIssues = [];
const preExistingWarnings = new Set();
const auditIssues = [];
let browser;
let base;
const backend = createBackend();

const STUB_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420"><rect width="640" height="420" fill="#e8eef7"/><text x="320" y="210" font-size="42" text-anchor="middle" fill="#123">測試憑證</text></svg>';

const envRetries = []; // 因 504 重試過的開頁
const late504 = []; // 開機後才遇到的 504：重試救不了，要讓這一輪失敗
async function open(params = {}, opts = {}) {
  try {
    return await openOnce(params, opts, true);
  } catch (error) {
    if (!error.outdatedDep) throw error;
    envRetries.push({ label: new URLSearchParams(params).toString(), url: error.outdatedDep, simulated: !!opts.simulate504 });
    await new Promise(resolve => setTimeout(resolve, 1500));
    return openOnce(params, opts.simulate504 === 'once' ? { ...opts, simulate504: null } : opts, false);
  }
}

async function openOnce(params = {}, { width = 1440, height, timezoneId = 'Asia/Taipei', hash = '', simulate504 = null } = {}, canRetry = false) {
  const viewportHeight = height || (width <= 390 ? 844 : width <= 820 ? 1180 : 900);
  const mobile = width <= 430;
  const context = await browser.newContext({
    viewport: { width, height: viewportHeight },
    deviceScaleFactor: mobile ? 2 : 1,
    isMobile: mobile,
    hasTouch: mobile,
    locale: 'zh-TW',
    timezoneId,
  });
  await context.exposeFunction('__backendCall', (fn, payload) => backend.dispatch(fn, payload));
  await context.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.startsWith(base) || url.startsWith('blob:') || url.startsWith('data:')) return route.continue();
    if (/^https:\/\/drive\.google\.com\//.test(url)) {
      driveStubbed.push(url);
      if (/\/preview/.test(url)) return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><meta charset="utf-8"><body style="font:24px sans-serif;background:#fff">PDF 預覽替身</body>' });
      return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: STUB_SVG });
    }
    blockedRequests.push(url);
    return route.abort();
  });
  // 保險：雲端服務一律中斷（後註冊的先比對）
  await context.route(/cloudfunctions\.net|googleapis\.com|firebaseio|firebaseapp|line\.me/, (route) => {
    blockedRequests.push(route.request().url());
    return route.abort();
  });
  if (simulate504) {
    await context.route(/\/src\/views\/PaymentDueList\.vue/, route => route.fulfill({ status: 504, contentType: 'text/plain', body: 'Outdated Optimize Dep' }));
  }
  const page = await context.newPage();
  const label = new URLSearchParams(params).toString();
  let booting = true;
  let saw504 = null;
  const bootIssues = [];
  const report = (issue) => { (booting ? bootIssues : consoleIssues).push(issue); };
  page.on('response', (response) => {
    if (response.status() !== 504) return;
    if (booting) saw504 = response.url();
    else late504.push(response.url());
  });
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error' || /Vue warn|Failed to resolve/.test(text)) {
      if (/net::ERR_FAILED/.test(text) && /blocked/.test(text)) return;
      if (/^Payment Due Entry Error: Error: LIFF 初始化失敗/.test(text)) return; // T11 故意注入的失敗
      if (/^儲存失敗: Error: (繳款紀錄|預計繳款|車位寫入失敗)/.test(text)) return; // T12 故意觸發的失敗
      if (/Property "firstPurchaseOptions" was accessed/.test(text)) { preExistingWarnings.add('UnitDetailModal: firstPurchaseOptions 未定義（2025 年既有，非本次改動）'); return; }
      report({ label, type: msg.type(), text: text.slice(0, 600) });
    }
  });
  let failBoot;
  const bootFailed = new Promise((_, reject) => { failBoot = reject; });
  bootFailed.catch(() => {}); // 開機後的 pageerror 只記錄，不讓程序中斷
  page.on('pageerror', (error) => {
    report({ label, type: 'pageerror', text: String(error.stack || error).slice(0, 800) });
    failBoot(new Error(`頁面載入失敗：${error.message}`));
  });
  await page.goto(`${base}/harness?${new URLSearchParams(params)}${hash}`);
  try {
    await Promise.race([page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 }), bootFailed]);
  } catch (error) {
    await context.close().catch(() => {});
    booting = false;
    if (saw504 && canRetry) {
      error.outdatedDep = saw504;
      throw error;
    }
    consoleIssues.push(...bootIssues);
    throw error;
  }
  booting = false;
  consoleIssues.push(...bootIssues);
  await page.waitForTimeout(250);
  return { page, close: () => context.close() };
}

const AUDIT_SOURCE = `(() => {
  const out = { hScroll: null, innerScroll: [], truncated: [], hamburger: [], smallInputs: [] };
  const de = document.documentElement;
  if (de.scrollWidth > de.clientWidth + 1) out.hScroll = [de.scrollWidth, de.clientWidth];
  const desc = el => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).slice(0, 3).join('.') : '') + ' "' + (el.innerText || el.value || el.placeholder || '').trim().slice(0, 30) + '"';
  const visible = el => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) !== 0;
  };
  const canvas = document.createElement('canvas').getContext('2d');
  const hb = document.querySelector('.harness-hamburger');
  const all = [...document.querySelectorAll('body *')].filter(visible);
  for (const el of all) {
    if (el.closest('.harness-hamburger')) continue;
    const s = getComputedStyle(el);
    if (['auto', 'scroll'].includes(s.overflowX) && el.scrollWidth > el.clientWidth + 1) out.innerScroll.push(desc(el) + ' ' + el.scrollWidth + '>' + el.clientWidth);
    const ownText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (ownText) {
      if ((s.overflowX === 'hidden' || s.overflowX === 'clip' || s.textOverflow === 'ellipsis') && el.scrollWidth > el.clientWidth + 1) {
        out.truncated.push('自身截斷 ' + desc(el) + ' ' + el.scrollWidth + '>' + el.clientWidth);
      }
      if (s.overflowY === 'hidden' && el.scrollHeight > el.clientHeight + 2 && el.clientHeight > 0) {
        out.truncated.push('垂直截斷 ' + desc(el) + ' ' + el.scrollHeight + '>' + el.clientHeight);
      }
      // 被祖先裁切
      for (const n of el.childNodes) {
        if (n.nodeType !== 3 || !n.textContent.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(n);
        const rect = range.getBoundingClientRect();
        let p = el.parentElement;
        while (p && p !== document.body) {
          const ps = getComputedStyle(p);
          if (ps.overflowX !== 'visible' && !['auto', 'scroll'].includes(ps.overflowX)) {
            const pr = p.getBoundingClientRect();
            if (rect.right > pr.right + 1.5 || rect.left < pr.left - 1.5) {
              out.truncated.push('祖先裁切 ' + desc(el) + ' by ' + desc(p).slice(0, 40));
              break;
            }
          }
          p = p.parentElement;
        }
      }
    }
    if ((el.tagName === 'INPUT' && !['checkbox', 'radio', 'file', 'hidden', 'date'].includes(el.type)) || el.tagName === 'SELECT') {
      const text = el.tagName === 'SELECT' ? (el.selectedOptions[0] ? el.selectedOptions[0].text : '') : (el.value || el.placeholder || '');
      if (text) {
        canvas.font = s.font;
        const w = canvas.measureText(text).width;
        const avail = el.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
        if (w > avail + 1) out.truncated.push('輸入欄文字超出 ' + desc(el) + ' 文字 ' + Math.round(w) + ' 可用 ' + Math.round(avail));
      }
    }
    if (el.tagName === 'INPUT' && el.type === 'date') {
      if (el.clientWidth < 110) out.truncated.push('日期欄過窄 ' + el.clientWidth);
    }
    if (window.innerWidth <= 600 && ['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName) && !['checkbox', 'radio', 'file', 'hidden'].includes(el.type) && parseFloat(s.fontSize) < 16) {
      out.smallInputs.push(desc(el) + ' ' + s.fontSize);
    }
    // 漢堡鈕遮擋：文字或可操作元素與按鈕重疊，且該點最上層是按鈕
    if (hb && (ownText || ['BUTTON', 'A', 'INPUT', 'SELECT'].includes(el.tagName))) {
      const r = el.getBoundingClientRect();
      const ox = Math.max(r.left, 10);
      const ox2 = Math.min(r.right, 50);
      const oy = Math.max(r.top, 10);
      const oy2 = Math.min(r.bottom, 50);
      if (ox2 - ox > 1 && oy2 - oy > 1) {
        const stack = document.elementsFromPoint((ox + ox2) / 2, (oy + oy2) / 2);
        if (stack[0] && stack[0].closest('.harness-hamburger') && stack.includes(el)) out.hamburger.push(desc(el));
      }
    }
  }
  out.truncated = [...new Set(out.truncated)];
  out.innerScroll = [...new Set(out.innerScroll)];
  out.hamburger = [...new Set(out.hamburger)];
  out.smallInputs = [...new Set(out.smallInputs)];
  const overlay = document.querySelector('.v-overlay--active');
  out.overlayZ = overlay ? getComputedStyle(overlay).zIndex : null;
  return out;
})()`;

async function auditScreen(page, name, width) {
  await page.waitForTimeout(350);
  const file = path.join(SHOT_DIR, `${name}-${width}.png`);
  await page.screenshot({ path: file });
  const audit = await page.evaluate(AUDIT_SOURCE);
  const problems = [];
  if (audit.hScroll) problems.push(`頁面橫向捲動 ${audit.hScroll.join('>')}`);
  audit.innerScroll.forEach(x => problems.push(`內層橫向捲動 ${x}`));
  audit.truncated.forEach(x => problems.push(x));
  audit.hamburger.forEach(x => problems.push(`被漢堡鈕遮住 ${x}`));
  audit.smallInputs.forEach(x => problems.push(`手機輸入字級小於 16px ${x}`));
  // 戶別視窗本身的外框不是這次範圍：選項列可橫向捲動是設計，底部工具列與導覽摘要的截斷是既有狀況，只記錄不判定
  // 銷控頁同理：列表欄位多本來就橫向捲動，收合的報價側欄與全域搜尋提示也不是這次範圍；只判定新增欄位與繳款視窗
  const isModalChrome = text => (name.startsWith('modal-') && /edit-mobile|edit-nav-summary|"關閉"/.test(text))
    || (name.startsWith('sales-') && !/next-due|\.pr-|mac-sheet|payment-popup|mpd-|pti-/.test(text));
  problems.filter(isModalChrome).filter(x => name.startsWith('modal-')).forEach(x => preExistingWarnings.add(`戶別視窗 @${width}：${x.slice(0, 80)}`));
  const realProblems = problems.filter(x => !isModalChrome(x));
  if (realProblems.length) auditIssues.push({ screen: name, width, file, problems: realProblems });
  check('畫面', `${name} @${width}`, realProblems.length === 0, realProblems.join('；').slice(0, 400));
  return audit;
}

const dialog = page => page.locator('.v-dialog.v-overlay--active').last();
const planned = page => page.locator('section[aria-label="預計繳款"]');
const paid = page => page.locator('section[aria-label="已繳款"]');
const plannedRow = (page, text) => planned(page).locator('.pr-row', { hasText: text });
const paidRow = (page, text) => paid(page).locator('.pr-row', { hasText: text });
const toasts = page => page.evaluate(() => window.__toasts || []);
const calls = (fn, action) => backend.calls.filter(c => c.fn === fn && (!action || c.action === action));
const lastCall = (fn, action) => calls(fn, action).at(-1)?.payload;
const settle = (page, ms = 320) => page.waitForTimeout(ms);
const evidence = (page, name) => page.screenshot({ path: path.join(SHOT_DIR, `issue-${name}.png`) }); // 問題證據

async function menu(page, row, itemText) {
  await row.locator('.pr-more').click();
  await page.locator('.v-menu.v-overlay--active .v-list-item', { hasText: itemText }).first().click();
  await settle(page);
}
async function clickDialogButton(page, name) {
  await dialog(page).getByRole('button', { name, exact: true }).click();
}
async function stats(page) {
  return page.locator('.pr-stat').evaluateAll(list => Object.fromEntries(list.map(s => [
    s.querySelector('.pr-stat-label').innerText.trim(),
    [...s.querySelectorAll('.pr-stat-value, .pr-stat-sub, .mac-tag')].map(x => x.innerText.trim()).join('|'),
  ])));
}
// 期別欄位：選下拉項目；「其他」再自行輸入
const pickPeriod = async (scope, name) => {
  const page = scope.page();
  await scope.locator('.ppf-select .v-field').click();
  await settle(page, 250);
  await page.locator('.v-menu.v-overlay--active .v-list-item').filter({ hasText: new RegExp(`^\\s*${name}\\s*$`) }).first().click();
  await settle(page, 150);
};
const fillOtherPeriod = async (scope, text) => {
  await pickPeriod(scope, '其他');
  await scope.locator('input[aria-label="其他期別"]').fill(text);
};
const rowsOf = locator => locator.locator('.pr-row').evaluateAll(rows => rows.map(r => ({
  fields: Object.fromEntries([...r.querySelectorAll('.pr-field')].map(f => [f.querySelector('.pr-field-label')?.innerText.trim(), f.querySelector('.pr-field-value')?.innerText.trim()])),
  sub: r.querySelector('.pr-field-sub')?.innerText.trim() || '',
  tag: r.querySelector('.mac-tag')?.innerText.trim() || '',
  tagClass: r.querySelector('.mac-tag')?.className || '',
  buttons: [...r.querySelectorAll('button')].map(b => b.innerText.trim() || b.getAttribute('aria-label')),
  hasThumb: !!r.querySelector('.pr-thumb'),
})));
const money = n => Number(n).toLocaleString('zh-TW');

// 真的能顯示的 PNG（藍色方塊），確認縮圖不是空白
function makePng(size = 64, [r, g, b] = [40, 120, 220]) {
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(size * 3).map((_, i) => [r, g, b][i % 3])]);
  const raw = Buffer.concat(Array.from({ length: size }, () => row));
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const PNG = makePng();
const JPG = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0, 16, 74, 70, 73, 70, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0xFF, 0xD9]);
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.from([20, 0, 0, 0]), Buffer.from('WEBPVP8 '), Buffer.alloc(8)]);

const groups = {};
function group(name, fn) { groups[name] = fn; }

// ─────────────── 測試環境自我檢查：504 才重試，真的載入失敗不可被掩蓋 ───────────────
group('HARNESS', async () => {
  const G = '測試環境';
  backend.reset();
  const issuesBefore = consoleIssues.length;
  const openError = async (params, opts) => {
    try {
      const handle = await open(params, opts);
      await handle.close();
      return null;
    } catch (error) {
      return error;
    }
  };
  const compileRetriesBefore = envRetries.length;
  const compileError = await openError({ view: 'broken' });
  check(G, '編譯錯誤：開頁失敗', !!compileError && /頁面載入失敗/.test(compileError.message), String(compileError?.message));
  eq(G, '編譯錯誤：不重試', envRetries.length, compileRetriesBefore);
  check(G, '編譯錯誤：console 錯誤有記錄', consoleIssues.length > issuesBefore, '');
  consoleIssues.length = issuesBefore; // 這個是故意的

  const once = await open({ view: 'list', role: 'manager' }, { simulate504: 'once' });
  await settle(once.page, 300);
  check(G, '遇到 504 一次：重試後頁面正常', await once.page.getByRole('button', { name: '批次新增' }).isVisible(), '');
  eq(G, '遇到 504 一次：重試一次', envRetries.length, compileRetriesBefore + 1);
  eq(G, '遇到 504 一次：重試前的錯誤不計入', consoleIssues.length, issuesBefore);
  await once.close();

  const always = await openError({ view: 'list', role: 'manager' }, { simulate504: 'always' });
  check(G, '一直 504：只重試一次，照樣失敗', !!always && /頁面載入失敗/.test(always.message), String(always?.message));
  eq(G, '一直 504：總共只重試一次', envRetries.length, compileRetriesBefore + 2);
  consoleIssues.length = issuesBefore;
});

// ─────────────── T1 面板檢視 ───────────────
group('T1', async () => {
  const G = 'T1 面板檢視';
  backend.reset();
  const { page, close } = await open({ view: 'panel', unit: 'A1', total: 2100 });
  const s = await stats(page);
  eq(G, '摘要：已繳只算實繳', s['已繳'], `${money(900000)} 元`);
  eq(G, '摘要：繳款比例（90 萬 / 2100 萬）', s['繳款比例'], '4.3%');
  eq(G, '摘要：待繳為預計金額加總', s['待繳'], `${money(800000)} 元`);
  eq(G, '摘要：下次到期為最早的預計日與逾期標籤', s['下次到期'], `${slash(addDays(-7))}|逾期 7 天`);
  const pl = await rowsOf(planned(page));
  eq(G, '預計區排序：逾期、今天、剩 N 天、遠期', pl.map(r => r.tag), ['逾期 7 天', '今天到期', '剩 3 天', '剩 20 天']);
  check(G, '預計區標籤顏色', /mac-tag--red/.test(pl[0].tagClass) && /mac-tag--orange-fill/.test(pl[1].tagClass) && /mac-tag--orange(\s|$)/.test(pl[2].tagClass) && !/mac-tag--(red|orange|green)/.test(pl[3].tagClass), JSON.stringify(pl.map(r => r.tagClass)));
  eq(G, '預計區金額：未填顯示「未填」', pl.map(r => r.fields['預計金額']), [`${money(300000)} 元`, `${money(200000)} 元`, `${money(300000)} 元`, '未填']);
  check(G, '預計區有標記已繳與更多', pl.every(r => r.buttons.includes('標記已繳') && r.buttons.includes('更多操作')), JSON.stringify(pl[0].buttons));
  eq(G, '區塊筆數', [await planned(page).locator('.pr-group-count').innerText(), await paid(page).locator('.pr-group-count').innerText()], ['4 筆', '5 筆']);
  const pd = await rowsOf(paid(page));
  eq(G, '已繳區由新到舊，缺值舊資料排最後', pd.map(r => r.fields['備註']), ['簽約款', '開工款', '訂金', '舊資料補足款', '舊資料缺值']);
  eq(G, '舊資料只在已繳區', (await rowsOf(planned(page))).filter(r => /舊資料/.test(r.fields['備註'])).length, 0);
  eq(G, '遲繳／提前附註，同日不顯示', pd.map(r => r.sub), [`預計 ${md(addDays(-13))}・遲 3 天`, `預計 ${md(addDays(-38))}・提前 2 天`, '', '', '']);
  eq(G, '缺值舊資料顯示「—」', [pd[4].fields['繳款日'], pd[4].fields['實繳金額']], ['—', '—']);
  const checks = await paid(page).locator('.pr-row').evaluateAll(rows => rows.map(r => !!r.querySelector('.pr-field-value--strong .mdi-check')));
  eq(G, '舊資料沒有效金額不顯示綠勾，其餘已繳有', checks, [true, true, true, true, false]);
  check(G, '已繳列有憑證縮圖', pd[0].hasThumb && pd[1].hasThumb && !pd[2].hasThumb, JSON.stringify(pd.map(r => r.hasThumb)));
  check(G, '預計與已繳圖示與標題', (await planned(page).locator('.pr-group-head .mdi-calendar-clock').count()) === 1 && (await paid(page).locator('.pr-group-head .mdi-check-circle').count()) === 1, '');
  const borders = await page.evaluate(() => [...document.querySelectorAll('.pr-group')].map(g => getComputedStyle(g).borderLeftStyle));
  eq(G, '灰階可分辨：預計虛線、已繳實線', borders, ['dashed', 'solid']);
  const weight = await page.evaluate(() => [
    getComputedStyle(document.querySelector('section[aria-label="預計繳款"] .pr-num')).fontWeight,
    getComputedStyle(document.querySelector('section[aria-label="已繳款"] .pr-num')).fontWeight,
  ]);
  eq(G, '預計金額一般字重、實繳粗體', weight, ['400', '700']);
  await close();

  backend.reset();
  const empty = await open({ view: 'panel', unit: 'EMPTY' });
  eq(G, '空資料：兩區各一行空狀態', [await planned(empty.page).locator('.pr-empty').innerText(), await paid(empty.page).locator('.pr-empty').innerText()], ['尚無預計繳款', '尚無繳款紀錄']);
  eq(G, '空資料：比例為 0.0%（有總價）', (await stats(empty.page))['繳款比例'], '0.0%');
  await empty.close();

  const legacy = await open({ view: 'panel', unit: 'LEG', total: 1000 });
  eq(G, '舊資料內容與比例不變', (await stats(legacy.page))['繳款比例'], '3.0%');
  eq(G, '舊資料：預計區空', await planned(legacy.page).locator('.pr-empty').count(), 1);
  const legacyRows = await rowsOf(paid(legacy.page));
  eq(G, '舊資料順序由新到舊', legacyRows.map(r => r.fields['備註']), ['舊資料二', '舊資料一']);
  await paidRow(legacy.page, '舊資料一').locator('.pr-more').click();
  await settle(legacy.page);
  eq(G, '舊資料沒有「改回預計」', await legacy.page.locator('.v-menu.v-overlay--active .v-list-item').allInnerTexts(), ['編輯', '刪除']);
  await legacy.close();

  const noTotal = await open({ view: 'panel', unit: 'ZERO' });
  const noTotalStats = await stats(noTotal.page);
  eq(G, '無成交總價顯示「—」與提示', noTotalStats['繳款比例'], '—|未填成交總價');
  await noTotal.close();

  const collapsed = await open({ view: 'panel', unit: 'A1', total: 2100, collapsed: 1 });
  check(G, '可收合模式預設收合', !(await collapsed.page.locator('.pr-body').isVisible()), '');
  await collapsed.page.locator('.pr-summary').click();
  check(G, '點摘要展開', await collapsed.page.locator('.pr-body').isVisible(), '');
  await collapsed.page.locator('.pr-summary').focus();
  await collapsed.page.keyboard.press('Enter');
  check(G, 'Enter 收合', !(await collapsed.page.locator('.pr-body').isVisible()), '');
  await collapsed.close();

  const readonly = await open({ view: 'panel', unit: 'A1', total: 2100, readonly: 1 });
  eq(G, '唯讀：沒有新增與標記已繳', [await readonly.page.locator('.pr-actions').count(), await readonly.page.getByRole('button', { name: '標記已繳' }).count(), await readonly.page.locator('.pr-more').count()], [0, 0, 0]);
  await readonly.close();
});

// ─────────────── T2 新增、編輯、刪除、改回預計 ───────────────
group('T2', async () => {
  const G = 'T2 新增編輯刪除改回';
  backend.reset();
  const { page, close } = await open({ view: 'panel', unit: 'A1', total: 2100 });

  // 新增預計：驗證
  await page.locator('.pr-actions').getByRole('button', { name: '預計繳款', exact: true }).click();
  await settle(page);
  const d = dialog(page);
  check(G, '入口預選「預計繳款」', await d.locator('.mac-form-seg-btn.is-active').innerText() === '預計繳款', '');
  check(G, '新增預計：沒有憑證區', (await d.locator('input[type=file]').count()) === 0, '');
  await clickDialogButton(page, '儲存');
  await settle(page, 150);
  check(G, '新增預計：預計日和金額都沒填要擋', (await d.locator('.mac-callout--error').innerText()).includes('至少要填一個'), '');
  eq(G, '驗證失敗不呼叫 API', calls('paymentProofApi').length, 0);
  await d.locator('input[aria-label="預計日"]').fill(addDays(10));
  await d.locator('input[aria-label="預計金額"]').fill('0');
  await clickDialogButton(page, '儲存');
  await settle(page, 150);
  check(G, '新增預計：金額 0 擋下', (await d.locator('.mac-callout--error').innerText()).includes('大於 0'), '');
  await d.locator('input[aria-label="預計金額"]').fill('-100');
  await clickDialogButton(page, '儲存');
  await settle(page, 150);
  check(G, '新增預計：負數擋下', (await d.locator('.mac-callout--error').innerText()).includes('大於 0'), '');
  await d.locator('input[aria-label="預計金額"]').fill('350000');
  await d.locator('input[aria-label="備註"]').fill('第 6 期工程款');
  await clickDialogButton(page, '儲存');
  await d.waitFor({ state: 'hidden' });
  const add = lastCall('paymentProofApi', 'addRecord');
  eq(G, '新增預計參數', { date: add.date, amount: add.amount, expectedDate: add.expectedDate, expectedAmount: add.expectedAmount, note: add.note, planSource: add.planSource, base64: add.base64 },
    { date: '', amount: null, expectedDate: addDays(10), expectedAmount: 350000, note: '第 6 期工程款', planSource: 'manual', base64: null });
  check(G, '新增預計：出現在預計區', await plannedRow(page, '第 6 期工程款').count() === 1, '');
  eq(G, '新增預計：已繳與比例不變', [(await stats(page))['已繳'], (await stats(page))['繳款比例']], [`${money(900000)} 元`, '4.3%']);
  eq(G, '新增預計：待繳增加', (await stats(page))['待繳'], `${money(1150000)} 元`);

  // 新增預計：金額留空
  await page.locator('.pr-actions').getByRole('button', { name: '預計繳款', exact: true }).click();
  await settle(page);
  await dialog(page).locator('input[aria-label="預計日"]').fill(addDays(11));
  await clickDialogButton(page, '儲存');
  await dialog(page).waitFor({ state: 'hidden' });
  eq(G, '金額留空送 null', lastCall('paymentProofApi', 'addRecord').expectedAmount, null);

  // 新增已繳
  await page.locator('.pr-actions').getByRole('button', { name: '已繳款', exact: true }).click();
  await settle(page);
  const d2 = dialog(page);
  check(G, '入口預選「已繳款」', await d2.locator('.mac-form-seg-btn.is-active').innerText() === '已繳款', '');
  eq(G, '已繳預帶今天', await d2.locator('input[aria-label="繳款日"]').inputValue(), TODAY);
  await clickDialogButton(page, '儲存');
  await settle(page, 150);
  check(G, '新增已繳：金額必填', (await d2.locator('.mac-callout--error').innerText()).includes('實繳金額'), '');
  await d2.locator('input[aria-label="繳款日"]').fill('');
  await d2.locator('input[aria-label="實繳金額"]').fill('100000');
  await clickDialogButton(page, '儲存');
  await settle(page, 150);
  check(G, '新增已繳：繳款日必填', (await d2.locator('.mac-callout--error').innerText()).includes('繳款日'), '');
  await d2.locator('input[aria-label="繳款日"]').fill(TODAY);
  await d2.locator('input[aria-label="備註"]').fill('臨時繳款');
  await clickDialogButton(page, '儲存');
  await d2.waitFor({ state: 'hidden' });
  const addPaid = lastCall('paymentProofApi', 'addRecord');
  eq(G, '新增已繳參數', { date: addPaid.date, amount: addPaid.amount, expectedDate: addPaid.expectedDate, expectedAmount: addPaid.expectedAmount, note: addPaid.note, removeFile: addPaid.removeFile }, { date: TODAY, amount: 100000, expectedDate: null, note: '臨時繳款', removeFile: false });
  check(G, '新增已繳：在已繳區最上方', (await rowsOf(paid(page)))[0].fields['備註'] === '臨時繳款', '');
  eq(G, '新增已繳：已繳增加', (await stats(page))['已繳'], `${money(1000000)} 元`);

  // 已繳補登預計日
  await page.locator('.pr-actions').getByRole('button', { name: '已繳款', exact: true }).click();
  await settle(page);
  const d3 = dialog(page);
  await d3.locator('input[aria-label="實繳金額"]').fill('20000');
  await d3.locator('input[aria-label="預計日"]').fill(addDays(-2));
  await d3.locator('input[aria-label="備註"]').fill('補登預計日');
  await clickDialogButton(page, '儲存');
  await d3.waitFor({ state: 'hidden' });
  eq(G, '補登預計日：附註遲 2 天', (await rowsOf(paid(page)))[0].sub.includes('遲 2 天') || (await rowsOf(paid(page))).some(r => r.fields['備註'] === '補登預計日' && r.sub.includes('遲 2 天')), true);

  // 小數：標記已繳會擋下，新增／編輯對話框應一致，不可默默四捨五入改金額
  await page.locator('.pr-actions').getByRole('button', { name: '已繳款', exact: true }).click();
  await settle(page);
  const dDecimal = dialog(page);
  await dDecimal.locator('input[aria-label="實繳金額"]').fill('12.5');
  await dDecimal.locator('input[aria-label="備註"]').fill('小數測試');
  await clickDialogButton(page, '儲存');
  await settle(page, 350);
  const decimalSaved = !(await dDecimal.isVisible());
  check(G, '實繳金額小數應擋下，不可默默改成整數', !decimalSaved, `輸入 12.5 直接存成 ${decimalSaved ? lastCall('paymentProofApi', 'addRecord').amount : ''}`);
  if (!decimalSaved) await clickDialogButton(page, '取消');
  await settle(page);

  // 新增對話框切換類型：隱藏欄位的值不應造成錯誤
  await page.locator('.pr-actions').getByRole('button', { name: '預計繳款', exact: true }).click();
  await settle(page);
  const d4 = dialog(page);
  await d4.locator('input[aria-label="預計日"]').fill(addDays(30));
  await d4.locator('input[aria-label="預計金額"]').fill('-5');
  await d4.locator('.mac-form-seg-btn', { hasText: '已繳款' }).click();
  await settle(page, 150);
  await d4.locator('input[aria-label="實繳金額"]').fill('12345');
  await d4.locator('input[aria-label="備註"]').fill('切換測試');
  await clickDialogButton(page, '儲存');
  await settle(page, 400);
  const switchVisible = await d4.isVisible();
  const switchError = switchVisible ? await d4.locator('.mac-callout--error').innerText().catch(() => '') : '';
  if (switchVisible) await evidence(page, 'hidden-expected-amount');
  check(G, '預計金額填 -5 再切到已繳可以儲存', !switchVisible, `預計區輸入 -5 後切到已繳，顯示：${switchError}（畫面上沒有預計金額欄位可修正）`);
  if (switchVisible) await clickDialogButton(page, '取消');
  await settle(page);

  // 切換類型把預計金額帶進已繳紀錄
  await page.locator('.pr-actions').getByRole('button', { name: '預計繳款', exact: true }).click();
  await settle(page);
  const d5 = dialog(page);
  await d5.locator('input[aria-label="預計金額"]').fill('777777');
  await d5.locator('.mac-form-seg-btn', { hasText: '已繳款' }).click();
  await settle(page, 150);
  await d5.locator('input[aria-label="實繳金額"]').fill('5000');
  await d5.locator('input[aria-label="備註"]').fill('切換測試二');
  await clickDialogButton(page, '儲存');
  await d5.waitFor({ state: 'hidden' });
  check(G, '切換類型：已繳紀錄不送預計金額', !('expectedAmount' in lastCall('paymentProofApi', 'addRecord')), JSON.stringify(lastCall('paymentProofApi', 'addRecord')));

  // 切換類型：已繳選了檔案再切預計，不可帶憑證
  await page.locator('.pr-actions').getByRole('button', { name: '已繳款', exact: true }).click();
  await settle(page);
  const d6 = dialog(page);
  await d6.locator('input[type=file]').setInputFiles({ name: 'proof.png', mimeType: 'image/png', buffer: PNG });
  await settle(page, 150);
  await d6.locator('.mac-form-seg-btn', { hasText: '預計繳款' }).click();
  await settle(page, 150);
  await d6.locator('input[aria-label="預計日"]').fill(addDays(33));
  await d6.locator('input[aria-label="備註"]').fill('切換憑證');
  await clickDialogButton(page, '儲存');
  await d6.waitFor({ state: 'hidden' });
  eq(G, '切到預計後不帶憑證', lastCall('paymentProofApi', 'addRecord').base64, null);
  await close();

  // 編輯預計：預計日、金額不被清掉
  backend.reset();
  const e = await open({ view: 'panel', unit: 'A1', total: 2100 });
  await menu(e.page, plannedRow(e.page, '第 4 期工程款'), '編輯');
  const de = dialog(e.page);
  eq(G, '編輯預計：帶入既有值', [await de.locator('input[aria-label="預計日"]').inputValue(), await de.locator('input[aria-label="預計金額"]').inputValue(), await de.locator('input[aria-label="備註"]').inputValue()], [addDays(3), '300000', '第 4 期工程款']);
  check(G, '編輯預計：沒有類型切換', (await de.locator('.mac-form-seg').count()) === 0, '');
  await de.locator('input[aria-label="備註"]').fill('第 4 期工程款（改）');
  await clickDialogButton(e.page, '儲存');
  await de.waitFor({ state: 'hidden' });
  const up = lastCall('paymentProofApi', 'updateRecord');
  eq(G, '編輯預計參數', { recordId: up.recordId, date: up.date, amount: up.amount, expectedDate: up.expectedDate, expectedAmount: up.expectedAmount, note: up.note, removeFile: up.removeFile },
    { recordId: 'p_soon', date: '', amount: null, expectedDate: addDays(3), expectedAmount: 300000, note: '第 4 期工程款（改）', removeFile: false });
  const stored = backend.db.store.get('salesHouseholds/p1_A1').paymentRecords.find(r => r.id === 'p_soon');
  eq(G, '編輯預計：後端保留 planSource 與 expected', [stored.planSource, stored.expectedDate, stored.expectedAmount, stored.amount], ['manual', addDays(3), 300000, null]);

  // 編輯預計：清空金額
  await menu(e.page, plannedRow(e.page, '第 3 期工程款'), '編輯');
  await dialog(e.page).locator('input[aria-label="預計金額"]').fill('');
  await clickDialogButton(e.page, '儲存');
  await dialog(e.page).waitFor({ state: 'hidden' });
  eq(G, '編輯預計：清空金額送 null', lastCall('paymentProofApi', 'updateRecord').expectedAmount, null);
  check(G, '編輯預計：清空後顯示未填', (await plannedRow(e.page, '第 3 期工程款').innerText()).includes('未填'), '');

  // 編輯已繳：預計欄位不被清掉
  await menu(e.page, paidRow(e.page, '簽約款'), '編輯');
  const dp = dialog(e.page);
  eq(G, '編輯已繳：帶入既有值', [await dp.locator('input[aria-label="繳款日"]').inputValue(), await dp.locator('input[aria-label="實繳金額"]').inputValue(), await dp.locator('input[aria-label="預計日"]').inputValue()], [addDays(-10), '600000', addDays(-13)]);
  await dp.locator('input[aria-label="備註"]').fill('簽約款（改）');
  await clickDialogButton(e.page, '儲存');
  await dp.waitFor({ state: 'hidden' });
  const upPaid = lastCall('paymentProofApi', 'updateRecord');
  eq(G, '編輯已繳參數', { date: upPaid.date, amount: upPaid.amount, expectedDate: upPaid.expectedDate, removeFile: upPaid.removeFile, base64: upPaid.base64, sentExpectedAmount: 'expectedAmount' in upPaid }, { date: addDays(-10), amount: 600000, expectedDate: addDays(-13), removeFile: false, base64: null, sentExpectedAmount: false });
  const storedPaid = backend.db.store.get('salesHouseholds/p1_A1').paymentRecords.find(r => r.id === 'd_late');
  check(G, '編輯已繳：憑證、paidAt、預計金額保留', storedPaid.file?.fileId === 'proofImg' && storedPaid.paidAt === '2026-10-01T00:00:00.000Z' && storedPaid.expectedAmount === 600000, JSON.stringify(storedPaid));

  // 編輯舊資料：不應多出預計日
  await menu(e.page, paidRow(e.page, '舊資料補足款'), '編輯');
  await clickDialogButton(e.page, '儲存');
  await dialog(e.page).waitFor({ state: 'hidden' });
  const storedLegacy = backend.db.store.get('salesHouseholds/p1_A1').paymentRecords.find(r => r.id === 'legacy1');
  check(G, '編輯舊資料：仍在已繳區且金額不變', (await rowsOf(paid(e.page))).some(r => r.fields['備註'] === '舊資料補足款') && storedLegacy.amount === 50000, JSON.stringify(storedLegacy));

  // 編輯舊的缺值資料：金額空白時不可存
  await menu(e.page, paidRow(e.page, '舊資料缺值'), '編輯');
  await clickDialogButton(e.page, '儲存');
  await settle(e.page, 200);
  check(G, '編輯缺值舊資料：提示繳款日', (await dialog(e.page).locator('.mac-callout--error').innerText().catch(() => '')).includes('繳款日'), '');
  await clickDialogButton(e.page, '取消');
  await settle(e.page);

  // 憑證移除
  await menu(e.page, paidRow(e.page, '開工款'), '編輯');
  const dr = dialog(e.page);
  await dr.getByRole('button', { name: '移除' }).click();
  check(G, '編輯已繳：移除憑證提示', (await dr.locator('.mac-tag--red').innerText()).includes('移至垃圾桶'), '');
  await clickDialogButton(e.page, '儲存');
  await dr.waitFor({ state: 'hidden' });
  eq(G, '編輯已繳：移除憑證參數', [lastCall('paymentProofApi', 'updateRecord').removeFile, backend.trashed.includes('proofPdf')], [true, true]);

  // 刪除
  await menu(e.page, plannedRow(e.page, '第 2 期工程款'), '刪除');
  const dd = dialog(e.page);
  eq(G, '刪除預計：確認文字', await dd.locator('.pr-confirm-title').innerText(), '確定刪除這筆紀錄？');
  eq(G, '刪除預計：沒有憑證提示', await dd.locator('.mac-sheet-note').count(), 0);
  await clickDialogButton(e.page, '取消');
  await settle(e.page);
  eq(G, '刪除取消不呼叫 API', calls('paymentProofApi', 'deleteRecord').length, 0);
  await menu(e.page, plannedRow(e.page, '第 2 期工程款'), '刪除');
  await clickDialogButton(e.page, '刪除');
  await settle(e.page, 400);
  eq(G, '刪除預計：recordId', lastCall('paymentProofApi', 'deleteRecord').recordId, 'p_over');
  eq(G, '刪除預計：列移除', await plannedRow(e.page, '第 2 期工程款').count(), 0);
  await menu(e.page, paidRow(e.page, '簽約款'), '刪除');
  check(G, '刪除有憑證：提示移至垃圾桶', (await dialog(e.page).locator('.mac-sheet-note').innerText()).includes('垃圾桶'), '');
  await clickDialogButton(e.page, '取消');
  await settle(e.page);
  await e.close();

  // 改回預計
  backend.reset();
  const r = await open({ view: 'panel', unit: 'A1', total: 2100 });
  await menu(r.page, paidRow(r.page, '簽約款'), '改回預計');
  const dv = dialog(r.page);
  check(G, '改回預計（有憑證）提示', (await dv.locator('.mac-sheet-note').innerText()).includes('憑證檔案移至垃圾桶'), '');
  await clickDialogButton(r.page, '改回預計');
  await settle(r.page, 400);
  const rv = lastCall('paymentProofApi', 'updateRecord');
  eq(G, '改回預計參數：不帶預計欄位', { date: rv.date, amount: rv.amount, removeFile: rv.removeFile, base64: rv.base64, sentExpected: 'expectedDate' in rv || 'expectedAmount' in rv }, { date: '', amount: null, removeFile: true, base64: null, sentExpected: false });
  const reverted = backend.db.store.get('salesHouseholds/p1_A1').paymentRecords.find(x => x.id === 'd_late');
  eq(G, '改回預計：後端清空實繳、保留預計', [reverted.date, reverted.amount, reverted.file, reverted.paidAt, reverted.paidBy, reverted.expectedDate, reverted.expectedAmount], ['', null, null, null, null, addDays(-13), 600000]);
  check(G, '改回預計：憑證移至垃圾桶', backend.trashed.includes('proofImg'), JSON.stringify(backend.trashed));
  check(G, '改回預計：移到預計區', await plannedRow(r.page, '簽約款').count() === 1 && await paidRow(r.page, '簽約款').count() === 0, '');
  eq(G, '改回預計：已繳減少', (await stats(r.page))['已繳'], `${money(300000)} 元`);
  await menu(r.page, paidRow(r.page, '訂金'), '改回預計');
  eq(G, '改回預計（無憑證）提示', await dialog(r.page).locator('.mac-sheet-note').innerText(), '實繳內容會清除。');
  await clickDialogButton(r.page, '取消');
  await settle(r.page);
  await r.close();

  // API 失敗
  backend.reset({ failures: { 'paymentProofApi:addRecord': '權限不足或網路錯誤' } });
  const f = await open({ view: 'panel', unit: 'A1', total: 2100 });
  await f.page.locator('.pr-actions').getByRole('button', { name: '預計繳款', exact: true }).click();
  await settle(f.page);
  await dialog(f.page).locator('input[aria-label="預計日"]').fill(addDays(9));
  await clickDialogButton(f.page, '儲存');
  await settle(f.page, 300);
  check(G, 'API 失敗：對話框保留並顯示錯誤', (await dialog(f.page).locator('.mac-callout--error').innerText()).includes('權限不足或網路錯誤'), '');
  await f.close();
});

// ─────────────── T3 標記已繳 ───────────────
group('T3', async () => {
  const G = 'T3 標記已繳';
  backend.reset();
  const { page, close } = await open({ view: 'panel', unit: 'A1', total: 2100 });
  await plannedRow(page, '第 2 期工程款').getByRole('button', { name: '標記已繳' }).click();
  await settle(page);
  const d = dialog(page);
  const summary = await d.locator('.mpd-summary').innerText();
  check(G, '摘要含期別、預計日、金額', summary.includes('第 2 期工程款') && summary.includes(slash(addDays(-7))) && summary.includes(money(300000)), summary);
  eq(G, '預帶今天與預計金額', [await d.getByLabel('繳款日').inputValue(), await d.getByLabel('實繳金額').inputValue()], [TODAY, '300000']);
  eq(G, '等於預計：不出現差額', await d.locator('.mpd-balance-amount').count(), 0);
  await d.getByLabel('實繳金額').fill('300001');
  await settle(page, 100);
  eq(G, '大於預計：不出現差額', await d.locator('.mpd-balance-amount').count(), 0);
  await d.getByLabel('實繳金額').fill('200000');
  await settle(page, 100);
  eq(G, '少於預計：出現差額', await d.locator('.mpd-balance-amount').innerText(), `差額 ${money(100000)} 元`);
  check(G, '差額開關預設開啟', await d.locator('.mpd-switch input').isChecked(), '');
  await d.getByLabel('預計日').fill(addDays(14));
  await clickDialogButton(page, '確認已繳');
  await d.waitFor({ state: 'hidden' });
  const up = calls('paymentProofApi', 'updateRecord').at(-1).payload;
  eq(G, '標記已繳參數：不帶預計欄位', { recordId: up.recordId, date: up.date, amount: up.amount, note: up.note, removeFile: up.removeFile, sentExpected: 'expectedDate' in up || 'expectedAmount' in up }, { recordId: 'p_over', date: TODAY, amount: 200000, note: '第 2 期工程款', removeFile: false, sentExpected: false });
  const add = calls('paymentProofApi', 'addRecord').at(-1).payload;
  eq(G, '差額新增參數', { date: add.date, amount: add.amount, note: add.note, expectedDate: add.expectedDate, expectedAmount: add.expectedAmount, planSource: add.planSource }, { date: '', amount: null, note: '第 2 期工程款 尾款', expectedDate: addDays(14), expectedAmount: 100000, planSource: 'balance' });
  check(G, '標記後移到已繳區', await paidRow(page, '第 2 期工程款').count() === 1 && await plannedRow(page, /^第 2 期工程款$/).count() === 0, '');
  check(G, '標記後差額在預計區', await plannedRow(page, '第 2 期工程款 尾款').count() === 1, '');
  const s = await stats(page);
  eq(G, '比例更新（110 萬 / 2100 萬）', [s['已繳'], s['繳款比例']], [`${money(1100000)} 元`, '5.2%']);
  check(G, '顯示遲繳天數', (await paidRow(page, '第 2 期工程款').locator('.pr-field-sub').innerText()) === `預計 ${md(addDays(-7))}・遲 7 天`, await paidRow(page, '第 2 期工程款').locator('.pr-field-sub').innerText().catch(() => ''));
  const stored = backend.db.store.get('salesHouseholds/p1_A1').paymentRecords.find(r => r.id === 'p_over');
  check(G, '後端寫入 paidAt、paidBy，保留預計日與金額', !!stored.paidAt && stored.paidBy === '管理甲' && stored.expectedDate === addDays(-7) && stored.expectedAmount === 300000, JSON.stringify(stored));
  check(G, '標記已繳成功提示', (await toasts(page)).some(t => t.type === 'success' && t.message.includes('已標記已繳')), JSON.stringify(await toasts(page)));

  // 關掉差額開關
  await plannedRow(page, '第 4 期工程款').getByRole('button', { name: '標記已繳' }).click();
  await settle(page);
  const d2 = dialog(page);
  await d2.getByLabel('實繳金額').fill('100000');
  await settle(page, 100);
  await d2.locator('.mpd-switch > span').first().click();
  await settle(page, 100);
  check(G, '點開關文字切換一次', !(await d2.locator('.mpd-switch input').isChecked()), '');
  const trackBox = await d2.locator('.mpd-switch .v-switch__track').boundingBox();
  await page.mouse.click(trackBox.x + trackBox.width / 2, trackBox.y + trackBox.height / 2);
  await settle(page, 100);
  check(G, '點開關軌道切換一次', await d2.locator('.mpd-switch input').isChecked(), '');
  await d2.locator('.mpd-switch input').uncheck();
  await settle(page, 100);
  eq(G, '關閉差額：隱藏預計日', await d2.getByLabel('預計日').count(), 0);
  const before = calls('paymentProofApi', 'addRecord').length;
  await clickDialogButton(page, '確認已繳');
  await d2.waitFor({ state: 'hidden' });
  eq(G, '關閉差額：不新增', calls('paymentProofApi', 'addRecord').length, before);

  // 未填金額的預計
  await plannedRow(page, '第 5 期工程款').getByRole('button', { name: '標記已繳' }).click();
  await settle(page);
  const d3 = dialog(page);
  eq(G, '未填預計金額：實繳留空', await d3.getByLabel('實繳金額').inputValue(), '');
  await clickDialogButton(page, '確認已繳');
  await settle(page, 150);
  check(G, '實繳必填', (await d3.locator('.mac-callout--error').innerText()).includes('實繳金額'), '');
  await d3.getByLabel('實繳金額').fill('0');
  await clickDialogButton(page, '確認已繳');
  await settle(page, 150);
  check(G, '實繳 0 擋下', (await d3.locator('.mac-callout--error').innerText()).includes('實繳金額'), '');
  await d3.getByLabel('實繳金額').fill('12.5');
  await clickDialogButton(page, '確認已繳');
  await settle(page, 150);
  check(G, '實繳小數擋下', (await d3.locator('.mac-callout--error').innerText()).includes('實繳金額'), '');
  await d3.getByLabel('實繳金額').fill('50000');
  await settle(page, 80);
  eq(G, '沒有預計金額：不出現差額', await d3.locator('.mpd-balance-amount').count(), 0);
  await d3.getByLabel('繳款日').fill('');
  await clickDialogButton(page, '確認已繳');
  await settle(page, 150);
  check(G, '繳款日必填', (await d3.locator('.mac-callout--error').innerText()).includes('繳款日'), '');
  await clickDialogButton(page, '取消');
  await settle(page);
  await close();

  // 差額新增失敗：主紀錄已標記
  backend.reset({ failures: { 'paymentProofApi:addRecord': '差額寫入失敗' } });
  const f = await open({ view: 'panel', unit: 'A1', total: 2100 });
  await plannedRow(f.page, '第 3 期工程款').getByRole('button', { name: '標記已繳' }).click();
  await settle(f.page);
  const fd = dialog(f.page);
  await fd.getByLabel('實繳金額').fill('100000');
  await settle(f.page, 80);
  await fd.getByLabel('預計日').fill(addDays(5));
  await clickDialogButton(f.page, '確認已繳');
  await fd.waitFor({ state: 'hidden' });
  const ft = await toasts(f.page);
  check(G, '差額失敗：提示且主紀錄已轉已繳', ft.some(t => t.type === 'warning' && t.message.includes('差額新增失敗')) && await paidRow(f.page, '第 3 期工程款').count() === 1, JSON.stringify(ft));
  await f.close();

  // 主紀錄失敗：對話框保留
  backend.reset({ failures: { 'paymentProofApi:updateRecord': '更新失敗' } });
  const g = await open({ view: 'panel', unit: 'A1', total: 2100 });
  await plannedRow(g.page, '第 3 期工程款').getByRole('button', { name: '標記已繳' }).click();
  await settle(g.page);
  await clickDialogButton(g.page, '確認已繳');
  await settle(g.page, 300);
  check(G, '標記失敗：對話框顯示錯誤', (await dialog(g.page).locator('.mac-callout--error').innerText()).includes('更新失敗'), '');
  await g.close();

  // 非台北時區
  backend.reset();
  const tz = await open({ view: 'panel', unit: 'A1', total: 2100 }, { timezoneId: 'America/Los_Angeles' });
  await plannedRow(tz.page, '第 3 期工程款').getByRole('button', { name: '標記已繳' }).click();
  await settle(tz.page);
  eq(G, '使用者在其他時區：仍帶台北今天', await dialog(tz.page).getByLabel('繳款日').inputValue(), TODAY);
  await tz.close();
});

// ─────────────── T4 憑證 ───────────────
group('T4', async () => {
  const G = 'T4 憑證';
  backend.reset();
  const { page, close } = await open({ view: 'panel', unit: 'A1', total: 2100 });
  await plannedRow(page, '第 3 期工程款').getByRole('button', { name: '標記已繳' }).click();
  await settle(page);
  const d = dialog(page);
  const input = d.locator('input[type=file]');
  await input.setInputFiles({ name: 'proof.png', mimeType: 'image/png', buffer: PNG });
  await settle(page, 150);
  eq(G, '標記已繳：選圖片顯示檔名', await d.locator('.mpd-file-name').innerText(), 'proof.png');
  check(G, '標記已繳：圖片縮圖有載入', await d.locator('.mpd-thumb img').evaluate(img => img.complete && img.naturalWidth > 0), '');
  await d.locator('.mpd-thumb').click();
  await settle(page);
  check(G, '標記已繳：放大預覽圖片', await page.locator('.mpd-preview img').isVisible(), '');
  await page.locator('.v-dialog.v-overlay--active .mac-sheet-close').last().click();
  await settle(page);
  await input.setInputFiles({ name: 'proof.pdf', mimeType: 'application/pdf', buffer: PDF });
  await settle(page, 150);
  check(G, '標記已繳：選 PDF 顯示 PDF 圖示', (await d.locator('.mpd-thumb .mdi-file-pdf-box').count()) === 1, '');
  await d.locator('.mpd-thumb').click();
  await settle(page);
  check(G, '標記已繳：PDF 預覽 iframe', (await page.locator('.mpd-preview iframe').getAttribute('src'))?.startsWith('blob:'), '');
  await page.locator('.v-dialog.v-overlay--active .mac-sheet-close').last().click();
  await settle(page);
  await input.setInputFiles({ name: 'big.png', mimeType: 'image/png', buffer: Buffer.alloc(10 * 1024 * 1024 + 1) });
  await settle(page, 200);
  check(G, '超過 10MB 擋下', (await d.locator('.mac-callout--error').innerText()).includes('10MB'), '');
  eq(G, '超過 10MB 保留原選檔', await d.locator('.mpd-file-name').innerText(), 'proof.pdf');
  await input.setInputFiles({ name: 'evil.gif', mimeType: 'image/gif', buffer: Buffer.from('GIF89a') });
  await settle(page, 150);
  check(G, '不支援格式擋下', (await d.locator('.mac-callout--error').innerText()).includes('僅接受'), '');
  await input.setInputFiles({ name: 'noext.pdf', mimeType: '', buffer: PDF });
  await settle(page, 150);
  eq(G, '空 type 的 .pdf 接受', await d.locator('.mpd-file-name').innerText(), 'noext.pdf');
  await d.getByRole('button', { name: '移除' }).click();
  await settle(page, 80);
  eq(G, '移除後回到選擇檔案', await d.getByRole('button', { name: '選擇檔案' }).count(), 1);
  await input.setInputFiles({ name: 'proof.png', mimeType: 'image/png', buffer: PNG });
  await settle(page, 150);
  await clickDialogButton(page, '確認已繳');
  await d.waitFor({ state: 'hidden' });
  const up = lastCall('paymentProofApi', 'updateRecord');
  eq(G, '標記已繳帶憑證：base64 為檔案內容', up.base64, PNG.toString('base64'));
  eq(G, '標記已繳帶憑證：後端存檔', backend.db.store.get('salesHouseholds/p1_A1').paymentRecords.find(r => r.id === 'p_today').file?.mimeType, 'image/png');

  // 拖放
  await plannedRow(page, '第 4 期工程款').getByRole('button', { name: '標記已繳' }).click();
  await settle(page);
  const dropped = await page.evaluate(async () => {
    const target = document.querySelector('.v-dialog.v-overlay--active .mpd-body');
    const dt = new DataTransfer();
    dt.items.add(new File([new Uint8Array([0x89, 0x50, 0x4E, 0x47])], 'drop.png', { type: 'image/png' }));
    target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
    await new Promise(r => setTimeout(r, 120));
    return document.querySelector('.v-dialog.v-overlay--active .mpd-file-name')?.innerText;
  });
  eq(G, '標記已繳：拖放檔案', dropped, 'drop.png');
  const droppedBad = await page.evaluate(async () => {
    const target = document.querySelector('.v-dialog.v-overlay--active .mpd-body');
    const dt = new DataTransfer();
    dt.items.add(new File(['x'], 'bad.txt', { type: 'text/plain' }));
    target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
    await new Promise(r => setTimeout(r, 120));
    return [document.querySelector('.v-dialog.v-overlay--active .mpd-file-name')?.innerText, (window.__toasts || []).at(-1)?.message];
  });
  eq(G, '標記已繳：拖放不支援格式', droppedBad, ['drop.png', '不支援的檔案格式']);
  await clickDialogButton(page, '取消');
  await settle(page);

  // 新增已繳
  await page.locator('.pr-actions').getByRole('button', { name: '已繳款', exact: true }).click();
  await settle(page);
  const q = dialog(page);
  const qi = q.locator('input[type=file]');
  await qi.setInputFiles({ name: 'q.jpg', mimeType: 'image/jpeg', buffer: JPG });
  await settle(page, 150);
  check(G, '新增已繳：選 JPG', (await q.locator('.pr-file-name').innerText()).includes('q.jpg'), '');
  await qi.setInputFiles({ name: 'w.webp', mimeType: 'image/webp', buffer: WEBP });
  await settle(page, 150);
  check(G, '新增已繳：選 WEBP', (await q.locator('.pr-file-name').innerText()).includes('w.webp'), '');
  await qi.setInputFiles({ name: 'big.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(10 * 1024 * 1024 + 1) });
  await settle(page, 200);
  check(G, '新增已繳：超過 10MB', (await q.locator('.mac-callout--error').innerText()).includes('10MB'), '');
  await qi.setInputFiles({ name: 'x.txt', mimeType: 'text/plain', buffer: Buffer.from('x') });
  await settle(page, 150);
  check(G, '新增已繳：不支援格式', (await q.locator('.mac-callout--error').innerText()).includes('僅接受'), '');
  await qi.setInputFiles({ name: 'q.pdf', mimeType: 'application/pdf', buffer: PDF });
  await settle(page, 150);
  await q.locator('.pr-pdf-tile').click();
  await settle(page);
  check(G, '新增已繳：PDF 燈箱', (await page.locator('.pr-lightbox-pdf-frame').getAttribute('src'))?.startsWith('blob:'), '');
  await page.locator('.pr-lightbox-close').click();
  await settle(page);
  await q.locator('input[aria-label="實繳金額"]').fill('8888');
  await clickDialogButton(page, '儲存');
  await q.waitFor({ state: 'hidden' });
  eq(G, '新增已繳帶 PDF：base64', lastCall('paymentProofApi', 'addRecord').base64, PDF.toString('base64'));

  // 新增對話框拖放：已繳可、預計不可
  await page.locator('.pr-actions').getByRole('button', { name: '已繳款', exact: true }).click();
  await settle(page);
  const dropQuick = await page.evaluate(async () => {
    const target = document.querySelector('.v-dialog.v-overlay--active .pr-dialog-body');
    const dt = new DataTransfer();
    dt.items.add(new File([new Uint8Array([0x89, 0x50, 0x4E, 0x47])], 'quick.png', { type: 'image/png' }));
    target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
    await new Promise(r => setTimeout(r, 150));
    return document.querySelector('.v-dialog.v-overlay--active .pr-file-name')?.innerText;
  });
  eq(G, '新增已繳：拖放檔案', dropQuick, 'quick.png');
  await dialog(page).locator('.mac-form-seg-btn', { hasText: '預計繳款' }).click();
  await settle(page, 150);
  const dropPlanned = await page.evaluate(async () => {
    const target = document.querySelector('.v-dialog.v-overlay--active .pr-dialog-body');
    const dt = new DataTransfer();
    dt.items.add(new File([new Uint8Array([0x89, 0x50, 0x4E, 0x47])], 'planned.png', { type: 'image/png' }));
    const event = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt });
    target.dispatchEvent(event);
    await new Promise(r => setTimeout(r, 150));
    return !!document.querySelector('.v-dialog.v-overlay--active .pr-file-name');
  });
  eq(G, '預計表單：拖放不會掛憑證', dropPlanned, false);
  await clickDialogButton(page, '取消');
  await settle(page);

  // 未繳不可附憑證：API 層
  const direct = await backend.dispatch('paymentProofApi', { action: 'addRecord', projectId: 'p1', unitId: 'A1', date: '', amount: null, expectedDate: addDays(3), base64: PNG.toString('base64') });
  eq(G, '後端拒絕未繳附憑證', direct.message, '尚未繳款的紀錄不可上傳憑證。');
  await page.locator('.pr-actions').getByRole('button', { name: '預計繳款', exact: true }).click();
  await settle(page);
  eq(G, '預計表單沒有上傳入口', await dialog(page).locator('input[type=file]').count(), 0);
  await clickDialogButton(page, '取消');
  await settle(page);
  await menu(page, plannedRow(page, '第 5 期工程款'), '編輯');
  eq(G, '編輯預計沒有上傳入口', await dialog(page).locator('input[type=file]').count(), 0);
  await clickDialogButton(page, '取消');
  await settle(page);

  // 燈箱
  await paidRow(page, '簽約款').locator('.pr-thumb').click();
  await settle(page, 500);
  const img = page.locator('.pr-lightbox-img');
  check(G, '燈箱：圖片載入', await img.isVisible() && (await page.locator('.pr-lightbox-loading').count()) === 0, '');
  eq(G, '燈箱：檔名', await page.locator('.pr-lightbox-name').innerText(), 'proofImg.jpg');
  check(G, '燈箱：Drive 連結', (await page.locator('.pr-lightbox-foot a').getAttribute('href')).includes('/file/d/proofImg/view'), '');
  const transform = () => img.evaluate(el => el.style.transform);
  await page.getByRole('button', { name: '放大' }).click().catch(async () => page.locator('.pr-lightbox-tool[title="放大"]').click());
  await settle(page, 100);
  check(G, '燈箱：放大 125%', (await page.locator('.pr-lightbox-zoom-label').innerText()) === '125%' && (await transform()).includes('scale(1.25)'), await transform());
  await page.locator('.pr-lightbox-tool[title="縮小"]').click();
  await settle(page, 100);
  eq(G, '燈箱：縮小回 100%', await page.locator('.pr-lightbox-zoom-label').innerText(), '100%');
  await page.locator('.pr-lightbox-tool[title="向右旋轉"]').click();
  await settle(page, 100);
  check(G, '燈箱：向右旋轉', (await transform()).includes('rotate(90deg)'), await transform());
  await page.locator('.pr-lightbox-tool[title="向左旋轉"]').click();
  await page.locator('.pr-lightbox-tool[title="向左旋轉"]').click();
  await settle(page, 100);
  check(G, '燈箱：向左旋轉', (await transform()).includes('rotate(-90deg)'), await transform());
  await page.locator('.pr-lightbox-tool[title="重設檢視"]').click();
  await settle(page, 100);
  check(G, '燈箱：重設', (await transform()).includes('scale(1)') && (await transform()).includes('rotate(0deg)'), await transform());
  const stage = page.locator('.pr-lightbox-stage');
  const box = await stage.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, -120);
  await settle(page, 150);
  check(G, '燈箱：滾輪放大', /scale\(1\.1[0-9]*\)/.test(await transform()), await transform());
  await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
  await settle(page, 150);
  await page.locator('.pr-lightbox-close').click();
  await settle(page);
  await paidRow(page, '開工款').locator('.pr-thumb').click();
  await settle(page, 500);
  eq(G, '燈箱：PDF 用 Drive 預覽', await page.locator('.pr-lightbox-pdf-frame').getAttribute('src'), 'https://drive.google.com/file/d/proofPdf/preview');
  eq(G, '燈箱：PDF 沒有縮放工具列', await page.locator('.pr-lightbox-toolbar').count(), 0);
  eq(G, '燈箱：PDF 載入後移除 loading', await page.locator('.pr-lightbox-loading').count(), 0);
  await page.locator('.pr-lightbox-close').click();
  await settle(page);
  await paidRow(page, '簽約款').locator('.pr-thumb').click();
  await settle(page, 500);
  check(G, '燈箱：重開同圖不卡 loading，檢視已重設', (await page.locator('.pr-lightbox-loading').count()) === 0 && (await transform()).includes('scale(1)'), await transform());
  await page.locator('.pr-lightbox-close').click();
  await settle(page);
  await close();

  // 沒有戶別資料夾
  backend.reset();
  const nf = await open({ view: 'panel', unit: 'NOFOLDER', total: 1000 });
  await plannedRow(nf.page, '無資料夾期').getByRole('button', { name: '標記已繳' }).click();
  await settle(nf.page);
  check(G, '沒有資料夾：標記已繳提示無法上傳', (await dialog(nf.page).locator('.mpd-muted').first().innerText()).includes('未設定戶別資料夾'), '');
  await clickDialogButton(nf.page, '取消');
  await settle(nf.page);
  await nf.page.locator('.pr-actions').getByRole('button', { name: '已繳款', exact: true }).click();
  await settle(nf.page);
  check(G, '沒有資料夾：新增已繳提示無法上傳', (await dialog(nf.page).locator('.pr-proof .pr-muted').first().innerText()).includes('未設定戶別資料夾'), '');
  await nf.close();
});

// ─────────────── T5 編輯模式 ───────────────
group('T5', async () => {
  const G = 'T5 編輯模式';
  backend.reset();
  const { page, close } = await open({ view: 'panel', unit: 'A1', total: 2100, editable: 1, collapsed: 1 });
  check(G, '編輯模式預設收合', !(await page.locator('.pr-body').isVisible()), '');
  await page.locator('.pr-summary').click();
  await settle(page, 120);
  const plannedCards = () => planned(page).locator('.pr-edit-card');
  const paidCards = () => paid(page).locator('.pr-edit-card');
  eq(G, '編輯模式分區筆數', [await plannedCards().count(), await paidCards().count()], [4, 5]);
  check(G, '編輯模式沒有帶入合約期款資料', (await page.getByRole('button', { name: '帶入合約期款資料' }).count()) === 0, '');

  await page.locator('.pr-actions').getByRole('button', { name: '預計繳款', exact: true }).click();
  await settle(page, 120);
  eq(G, '新增預計卡片', await plannedCards().count(), 5);
  const newCard = plannedCards().last();
  await newCard.locator('input[aria-label="預計日"]').fill(addDays(5));
  await newCard.locator('input[aria-label="預計金額"]').fill('123456');
  await newCard.locator('input[aria-label="備註"]').fill('編輯模式新增');
  await settle(page, 120);
  eq(G, '新增預計：狀態標籤即時', await plannedCards().last().locator('.mac-tag').innerText(), '剩 5 天');
  const rec = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__panelState.records)));
  let records = await rec();
  let added = records.at(-1);
  eq(G, '新增預計資料', { date: added.date, amount: added.amount, expectedDate: added.expectedDate, expectedAmount: added.expectedAmount, planSource: added.planSource, kind: added._kind }, { date: '', amount: null, expectedDate: addDays(5), expectedAmount: 123456, planSource: 'manual', kind: 'planned' });
  eq(G, '摘要即時：待繳', (await stats(page))['待繳'], `${money(800000 + 123456)} 元`);

  // 清空預計日不跳區
  await plannedCards().last().locator('input[aria-label="預計日"]').fill('');
  await settle(page, 120);
  eq(G, '清空預計日仍留在預計區', await plannedCards().count(), 5);
  await plannedCards().last().locator('input[aria-label="預計日"]').fill(addDays(5));
  await settle(page, 100);

  await page.locator('.pr-actions').getByRole('button', { name: '已繳款', exact: true }).click();
  await settle(page, 120);
  eq(G, '新增已繳卡片', await paidCards().count(), 6);
  const paidCard = paidCards().last();
  eq(G, '新增已繳預帶今天', await paidCard.locator('input[aria-label="繳款日"]').inputValue(), TODAY);
  await paidCard.locator('input[aria-label="實繳金額"]').fill('5000');
  await settle(page, 100);
  await paidCards().last().locator('input[aria-label="備註"]').fill('編輯已繳');
  await settle(page, 100);
  // 清空金額不跳區
  await paidCards().last().locator('input[aria-label="實繳金額"]').fill('');
  await settle(page, 120);
  eq(G, '清空實繳金額仍留在已繳區', await paidCards().count(), 6);
  eq(G, '清空實繳金額後摘要扣回', (await stats(page))['已繳'], `${money(900000)} 元`);
  await paidCards().last().locator('input[aria-label="實繳金額"]').fill('5000');
  await settle(page, 100);

  // 標記已繳（本地）
  await plannedCards().filter({ has: page.locator('input[aria-label="預計日"]') }).first().getByRole('button', { name: '標記已繳' }).click();
  await settle(page);
  const d = dialog(page);
  const firstNote = await d.locator('.mpd-summary-note').innerText();
  await d.getByLabel('實繳金額').fill('100');
  await settle(page, 80);
  await d.getByLabel('預計日').fill(addDays(40));
  await clickDialogButton(page, '確認已繳');
  await d.waitFor({ state: 'hidden' });
  await settle(page, 120);
  records = await rec();
  const converted = records.find(r => r.note === firstNote);
  eq(G, '本地標記已繳', { date: converted.date, amount: converted.amount, kind: converted._kind }, { date: TODAY, amount: 100, kind: 'paid' });
  const balance = records.at(-1);
  eq(G, '本地差額', { note: balance.note, expectedDate: balance.expectedDate, planSource: balance.planSource, kind: balance._kind, amount: balance.amount }, { note: `${firstNote} 尾款`, expectedDate: addDays(40), planSource: 'balance', kind: 'planned', amount: null });
  eq(G, '本地標記：後端沒被呼叫', calls('paymentProofApi').length, 0);

  // 改回預計（本地）
  const lateCard = paidCards().filter({ has: page.locator('input[aria-label="備註"]') }).nth(0);
  const revertCount = await paid(page).getByRole('button', { name: '改回預計' }).count();
  check(G, '有預計日的已繳卡片有改回預計', revertCount >= 3, String(revertCount));
  await lateCard.getByRole('button', { name: '改回預計' }).click();
  await settle(page);
  check(G, '本地改回預計提示', (await dialog(page).locator('.mac-sheet-note').innerText()).length > 0, '');
  await clickDialogButton(page, '改回預計');
  await settle(page, 200);
  records = await rec();
  const backToPlan = records.find(r => r.note === firstNote);
  eq(G, '本地改回預計資料', { date: backToPlan.date, amount: backToPlan.amount, kind: backToPlan._kind, file: backToPlan.file }, { date: '', amount: null, kind: 'planned', file: null });

  // 刪除
  const beforeDelete = await plannedCards().count();
  await plannedCards().last().getByRole('button', { name: '刪除' }).click();
  await settle(page);
  await clickDialogButton(page, '刪除');
  await settle(page, 200);
  eq(G, '刪除卡片', await plannedCards().count(), beforeDelete - 1);

  // 憑證（待上傳）
  const fileInput = paid(page).locator('input[type=file]');
  const noFileCard = paidCards().filter({ hasText: '選擇檔案' }).first();
  await noFileCard.getByRole('button', { name: '選擇檔案' }).click().catch(() => {});
  await settle(page, 100);
  await fileInput.setInputFiles({ name: 'edit.png', mimeType: 'image/png', buffer: PNG });
  await settle(page, 200);
  check(G, '選檔後顯示待上傳', (await paid(page).locator('.mac-tag--orange', { hasText: '待上傳' }).count()) >= 1, '');
  await paid(page).locator('.pr-edit-card', { hasText: '待上傳' }).getByRole('button', { name: '更換' }).click();
  await settle(page, 100);
  await fileInput.setInputFiles({ name: 'x.txt', mimeType: 'text/plain', buffer: Buffer.from('x') });
  await settle(page, 200);
  check(G, '不支援格式提示', (await toasts(page)).some(t => t.type === 'error' && t.message.includes('僅接受')), JSON.stringify(await toasts(page)));
  await close();

  // 只有舊資料：編輯模式沒有改回預計
  const legacy = await open({ view: 'panel', unit: 'LEG', total: 1000, editable: 1, collapsed: 1 });
  await legacy.page.locator('.pr-summary').click();
  await settle(legacy.page, 120);
  eq(G, '舊資料編輯模式沒有改回預計', await paid(legacy.page).getByRole('button', { name: '改回預計' }).count(), 0);
  await legacy.close();
});

// ─────────────── 批次新增 Sheet 同步提醒（真實 handleBatchAddPlans）───────────────
group('SHEET', async () => {
  const G = 'SHEET 同步提醒';
  const LONG_ERROR = 'SheetsApiError: quota exceeded '.repeat(12).trim();
  const toReview = async (page, units, note) => {
    await page.getByRole('button', { name: '批次新增' }).click();
    await settle(page, 500);
    const d = dialog(page);
    await fillOtherPeriod(d, note);
    await d.locator('input[type=date]').fill('2027-03-01');
    await settle(page, 80);
    await d.getByRole('button', { name: '下一步' }).click();
    await settle(page, 400);
    for (const id of units) await d.locator('label.ppb-unit', { hasText: id }).first().locator('input').check();
    await settle(page, 80);
    await d.getByRole('button', { name: '下一步' }).click();
    await settle(page, 200);
    return d;
  };

  // 全部成功＋同步失敗：不算失敗、留在結果畫面、仍更新清單
  backend.reset({ salesSheet: true, sheetSyncError: LONG_ERROR });
  const a = await open({ view: 'list', role: 'manager' }, { width: 390 });
  await settle(a.page, 400);
  const listBefore = calls('paymentReminderApi', 'listDue').length;
  const da = await toReview(a.page, ['A1', 'A2'], '同步失敗期');
  await da.getByRole('button', { name: '確認新增' }).click();
  await settle(a.page, 500);
  eq(G, '有設定 Sheet：全部新增後同步一次', backend.sheetSyncCalls, [{ projectId: 'p1', spreadsheetId: 'sheet-1', sheetName: '銷控' }]);
  eq(G, '全部成功：不顯示錯誤', await da.locator('.mac-callout--error').count(), 0);
  const warnA = (await da.locator('.ppb-sheet-warning').innerText()).trim();
  eq(G, '全部成功：同步提醒全文顯示（與後端回傳相同）', warnA, backend.batchResults.at(-1).sheetSyncWarning);
  check(G, '同步提醒內容：已新增、請手動同步', warnA.startsWith('預計繳款已新增，但 Sheet 同步失敗，請至建案設定手動同步') && warnA.includes('quota exceeded'), warnA);
  check(G, '提醒沒有溢出', await da.locator('.ppb-sheet-warning').evaluate(el => el.scrollWidth <= el.clientWidth + 1), '');
  check(G, '留在結果畫面', await a.page.locator('.ppb').isVisible(), '');
  check(G, 'saved 照常發出（清單有更新）', calls('paymentReminderApi', 'listDue').length > listBefore, '');
  const ta = await toasts(a.page);
  check(G, '成功提示照常', ta.some(t => t.type === 'success' && t.message.includes('已新增 2 戶')), JSON.stringify(ta));
  eq(G, '只剩完成按鈕', await da.locator('.mac-sheet-foot .mac-btn').allInnerTexts(), ['完成']);
  await da.getByRole('button', { name: '完成' }).click();
  await settle(a.page, 400);
  check(G, '按完成關閉', !(await a.page.locator('.ppb').isVisible().catch(() => false)), '');
  await a.page.getByRole('button', { name: '批次新增' }).click();
  await settle(a.page, 500);
  const reopened = dialog(a.page);
  eq(G, '重開回第一步、提醒不殘留', [await reopened.locator('.mac-page-count').innerText(), await reopened.locator('.ppb-sheet-warning').count()], ['1／3', 0]);
  check(G, '重開有下一步與取消', (await reopened.getByRole('button', { name: '下一步' }).count()) === 1 && (await reopened.getByRole('button', { name: '取消' }).count()) === 1, '');
  await a.close();

  // 部分失敗＋同步失敗：兩者都顯示；重送成功且同步成功時關閉
  backend.reset({ salesSheet: true, sheetSyncError: '同步失敗 A' });
  const b = await open({ view: 'list', role: 'manager' });
  await settle(b.page, 400);
  const db = await toReview(b.page, ['A1', 'A2'], '部分失敗期');
  backend.db.txGetHook = (docPath) => { if (docPath.endsWith('p1_A2')) throw new Error('Firestore 交易逾時，請重試'); };
  await db.getByRole('button', { name: '確認新增' }).click();
  await settle(b.page, 500);
  check(G, '部分失敗：錯誤與提醒並存', (await db.locator('.mac-callout--error').innerText()).includes('1 戶失敗') && (await db.locator('.ppb-sheet-warning').innerText()).includes('同步失敗 A'), '');
  eq(G, '部分失敗：可重送', await db.getByRole('button', { name: '確認新增' }).isDisabled(), false);
  backend.db.txGetHook = null;
  backend.sheetSyncError = null;
  await db.getByRole('button', { name: '確認新增' }).click();
  await settle(b.page, 600);
  eq(G, '重送：有新增就再同步一次', backend.sheetSyncCalls.length, 2);
  check(G, '重送成功且無提醒：關閉', !(await b.page.locator('.ppb').isVisible().catch(() => false)), '');
  await b.close();

  // 重送後同步仍失敗：提醒更新，不直接關閉
  backend.reset({ salesSheet: true, sheetSyncError: '同步失敗 A' });
  const b2 = await open({ view: 'list', role: 'manager' });
  await settle(b2.page, 400);
  const db2 = await toReview(b2.page, ['A1', 'A2'], '再失敗期');
  backend.db.txGetHook = (docPath) => { if (docPath.endsWith('p1_A2')) throw new Error('Firestore 交易逾時，請重試'); };
  await db2.getByRole('button', { name: '確認新增' }).click();
  await settle(b2.page, 500);
  backend.db.txGetHook = null;
  backend.sheetSyncError = '同步失敗 B';
  await db2.getByRole('button', { name: '確認新增' }).click();
  await settle(b2.page, 600);
  check(G, '重送同步仍失敗：提醒更新、留在畫面', (await db2.locator('.ppb-sheet-warning').innerText()).includes('同步失敗 B') && await b2.page.locator('.ppb').isVisible(), '');
  eq(G, '重送同步仍失敗：錯誤已清除，只剩完成', [await db2.locator('.mac-callout--error').count(), await db2.locator('.mac-sheet-foot .mac-btn').allInnerTexts()], [0, ['完成']]);
  await b2.close();

  // 重送沒有新增：不會同步，上次的同步失敗仍未解決，提醒要留著
  backend.reset({ salesSheet: true, sheetSyncError: '同步失敗 A' });
  const b3 = await open({ view: 'list', role: 'manager' });
  await settle(b3.page, 400);
  const db3 = await toReview(b3.page, ['A1', 'A2'], '提醒保留期');
  backend.db.txGetHook = (docPath) => { if (docPath.endsWith('p1_A2')) throw new Error('Firestore 交易逾時，請重試'); };
  await db3.getByRole('button', { name: '確認新增' }).click();
  await settle(b3.page, 500);
  backend.sheetSyncError = null;
  await db3.getByRole('button', { name: '確認新增' }).click();
  await settle(b3.page, 500);
  eq(G, '重送沒有新增：不再同步', backend.sheetSyncCalls.length, 1);
  check(G, '重送沒有新增：同步提醒保留、失敗訊息仍在', (await db3.locator('.ppb-sheet-warning').innerText()).includes('同步失敗 A') && (await db3.locator('.mac-callout--error').innerText()).includes('1 戶失敗'), '');
  backend.db.txGetHook = null;
  await db3.getByRole('button', { name: '確認新增' }).click();
  await settle(b3.page, 600);
  eq(G, '重送有新增且同步成功：同步第二次', backend.sheetSyncCalls.length, 2);
  check(G, '重送有新增且同步成功：提醒清除並關閉', !(await b3.page.locator('.ppb').isVisible().catch(() => false)), '');
  await b3.close();

  // 同步成功：沒有提醒，直接關閉
  backend.reset({ salesSheet: true });
  const c = await open({ view: 'list', role: 'manager' });
  await settle(c.page, 400);
  const dc = await toReview(c.page, ['A2'], '同步成功期');
  await dc.getByRole('button', { name: '確認新增' }).click();
  await settle(c.page, 500);
  eq(G, '同步成功：同步一次', backend.sheetSyncCalls.length, 1);
  check(G, '同步成功：直接關閉', !(await c.page.locator('.ppb').isVisible().catch(() => false)), '');
  await c.close();

  // 沒設定 Sheet：不同步、行為不變
  backend.reset();
  const n = await open({ view: 'list', role: 'manager' });
  await settle(n.page, 400);
  const dn = await toReview(n.page, ['A2'], '沒有 Sheet 期');
  await dn.getByRole('button', { name: '確認新增' }).click();
  await settle(n.page, 500);
  eq(G, '沒設定 Sheet：不同步', backend.sheetSyncCalls.length, 0);
  check(G, '沒設定 Sheet：直接關閉', !(await n.page.locator('.ppb').isVisible().catch(() => false)), '');
  await n.close();
});

// ─────────────── 優付規則 ───────────────
async function scheduleAmounts(context) {
  const { page, close } = await open({ view: 'schedule', context: JSON.stringify(context) });
  await settle(page, 900);
  const rows = await page.evaluate(() => [...document.querySelectorAll('.edit-table')].map(table => [...table.querySelectorAll('.edit-row')].filter(r => !r.classList.contains('edit-row-head') && !r.classList.contains('edit-row-group') && !r.classList.contains('edit-row-total')).map(r => ({
    name: r.querySelector('.col-name').innerText.trim().replace(/^\d+\.\s*/, ''),
    amount: Number(r.querySelector('.col-amount input')?.value),
  }))));
  await close();
  return rows;
}

group('PREF', async () => {
  const G = 'PREF 優付規則';
  const NO_PREF = () => templateFixtures().filter(t => t.paymentCategory !== '優付期款');
  const baseContext = { contractType: '', isFirstTimeBuyer: true, propertyType: '住家', isPackageContract: false, packageDealPrice: 0, packagePrice: 0, parkingSpots: [], areas: {}, banks: [] };

  // 付款表：優付戶用優付期款範本，一般戶用一般期款範本
  backend.reset();
  const prefSchedule = await scheduleAmounts({ ...baseContext, unitId: 'PREF', totalPrice: 2000, usePreferredPayment: true });
  const generalSchedule = await scheduleAmounts({ ...baseContext, unitId: 'PREF', totalPrice: 2000, usePreferredPayment: false });
  eq(G, '付款表：優付戶用優付期款範本', prefSchedule[0].map(r => r.name), ['優付訂金', '優付尾款']);
  check(G, '付款表：一般戶用一般期款範本', generalSchedule[0].some(r => r.name === '頭期款'), JSON.stringify(generalSchedule[0]));

  // 付款表：沒有優付範本不退回一般
  backend.reset({ templates: NO_PREF() });
  const noneSchedule = await scheduleAmounts({ ...baseContext, unitId: 'PREF', totalPrice: 2000, usePreferredPayment: true });
  eq(G, '付款表：沒有優付範本不退回一般', (noneSchedule[0] || []).length, 0);

  // 付款表設定（真實 PaymentSettings，從修改銷控開）：優付勾選依戶別開關
  const openPaymentSettings = async (unit, extra = { prefOption: 1 }) => {
    const ctx = await open({ view: 'modal', unit, ...extra });
    await ctx.page.waitForSelector('.v-dialog.v-overlay--active', { timeout: 60000 });
    await settle(ctx.page, 800);
    await ctx.page.locator('.v-dialog.v-overlay--active').getByRole('button', { name: '付款表設定' }).first().click();
    await settle(ctx.page, 900);
    return ctx;
  };
  const prefChecked = page => page.locator('.v-dialog.v-overlay--active').last().getByRole('checkbox', { name: '優付' }).isChecked();
  backend.reset();
  const psPref = await openPaymentSettings('PREF');
  eq(G, '付款表設定：優付戶預設勾選', await prefChecked(psPref.page), true);
  await psPref.close();
  backend.reset();
  const psGen = await openPaymentSettings('A1');
  eq(G, '付款表設定：一般戶不勾', await prefChecked(psGen.page), false);
  await psGen.close();
  backend.reset();
  backend.db.store.set('salesHouseholds/p1_A1', { ...backend.db.store.get('salesHouseholds/p1_A1'), isPreferredPayment: false, usePreferredPayment: true });
  const psStale = await openPaymentSettings('A1');
  eq(G, '付款表設定：開關關閉但有舊值仍不勾', await prefChecked(psStale.page), false);
  await psStale.close();
  backend.reset();
  const psHidden = await openPaymentSettings('PREF', {});
  eq(G, '付款表設定：建案隱藏優付時沒有優付勾選', await psHidden.page.locator('.v-dialog.v-overlay--active').last().getByRole('checkbox', { name: '優付' }).count(), 0);
  await psHidden.close();
});

// ─────────────── 合約製作（真實 ContractDocDialog，只看期款範本選擇）───────────────
group('CONTRACT', async () => {
  const G = 'CONTRACT 合約製作';
  const templates = () => templateFixtures().map(t => ({ ...t, maxPrice: t.maxPrice || 999999 }));
  const openContract = async (unit, extra = {}) => {
    const ctx = await open({ view: 'modal', unit, ...extra });
    await ctx.page.waitForSelector('.v-dialog.v-overlay--active', { timeout: 60000 });
    await settle(ctx.page, 800);
    await ctx.page.locator('.v-dialog.v-overlay--active').getByRole('button', { name: '合約製作設定' }).first().click();
    await settle(ctx.page, 2000);
    return ctx;
  };
  const contractState = page => page.evaluate(() => {
    for (const el of document.querySelectorAll('.v-overlay--active *')) {
      let inst = el.__vueParentComponent;
      while (inst) {
        if (/ContractDocDialog\.vue$/.test(inst.type?.__file || '')) {
          const st = inst.setupState;
          return { preferred: st.unitCtx?.usePreferredPayment, active: st.activeTemplate?.templateName || null, manual: st.manualTemplateId || null };
        }
        inst = inst.parent;
      }
    }
    return null;
  });
  const issuesBefore = consoleIssues.length;
  const setContract = (unit, data) => {
    const key = 'salesHouseholds/p1_' + unit;
    backend.db.store.set(key, { ...backend.db.store.get(key), contractDocData: data });
  };
  backend.reset({ templates: templates() });
  const prefOn = await openContract('PREF', { prefOption: 1 });
  const first = await contractState(prefOn.page);
  await prefOn.close();
  if (!first) {
    consoleIssues.length = issuesBefore;
    console.log('合約製作未測：對話框掛不起來');
    return;
  }
  eq(G, '優付戶：合約製作自動選優付期款範本（與付款表一致）', [first.preferred, first.active, first.manual], [true, '優付期款範本', null]);

  backend.reset({ templates: templates() });
  const prefOff = await openContract('PREF');
  eq(G, '建案隱藏優付：合約製作用一般期款範本', await contractState(prefOff.page), { preferred: false, active: '一般期款範本', manual: null });
  await prefOff.close();

  backend.reset({ templates: templates() });
  const gen = await openContract('A1', { prefOption: 1 });
  eq(G, '一般戶：合約製作用一般期款範本', await contractState(gen.page), { preferred: false, active: '一般期款範本', manual: null });
  await gen.close();

  // 舊合約存檔時是一般期款，現在判斷是優付：停在當時的範本
  backend.reset({ templates: templates() });
  setContract('PREF', { manualRowsTemplateId: 'tpl-normal', paymentTemplateId: null });
  const old = await openContract('PREF', { prefOption: 1 });
  eq(G, '舊合約：停在當時的一般期款範本', await contractState(old.page), { preferred: true, active: '一般期款範本', manual: 'tpl-normal' });
  await old.close();

  // 存檔與現在同類別：照常自動判斷
  backend.reset({ templates: templates() });
  setContract('PREF', { manualRowsTemplateId: 'tpl-pref', paymentTemplateId: null });
  const same = await openContract('PREF', { prefOption: 1 });
  eq(G, '舊合約同類別：維持自動判斷', await contractState(same.page), { preferred: true, active: '優付期款範本', manual: null });
  await same.close();

  // 手動指定過：還原指定的範本
  backend.reset({ templates: templates() });
  setContract('PREF', { paymentTemplateId: 'tpl-normal' });
  const manual = await openContract('PREF', { prefOption: 1 });
  eq(G, '手動指定的範本：還原', await contractState(manual.page), { preferred: true, active: '一般期款範本', manual: 'tpl-normal' });
  await manual.close();

  // 範本沒填總價上限（設定頁存成 null）：付款表視為不限，合約製作也要選得到
  backend.reset({ templates: templateFixtures().map(t => ({ ...t, maxPrice: null })) });
  const noMax = await openContract('A1', { prefOption: 1 });
  eq(G, '範本沒填總價上限：合約製作也選得到（與付款表一致）', (await contractState(noMax.page)).active, '一般期款範本');
  await noMax.close();

  // 上限存成 0 也視為不限；下限照常判斷
  backend.reset({ templates: templateFixtures().map(t => (t.id === 'tpl-normal' ? { ...t, maxPrice: 0 } : t)) });
  const zeroMax = await openContract('A1', { prefOption: 1 });
  eq(G, '範本上限 0：視為不限', (await contractState(zeroMax.page)).active, '一般期款範本');
  await zeroMax.close();
  backend.reset({ templates: templateFixtures().map(t => (t.id === 'tpl-normal' ? { ...t, minPrice: 99999, maxPrice: null } : t)) });
  const highMin = await openContract('A1', { prefOption: 1 });
  eq(G, '範本總價低於下限：不選', (await contractState(highMin.page)).active, null);
  await highMin.close();

  // 已存合約：排在前面的範本因為沒填上限而變成符合時，不可換掉存檔時用的範本
  const openEnded = { id: 'tpl-open', projectId: 'p1', templateName: '沒填上限範本', paymentCategory: '一般期款', propertyType: '住家', buyerType: '首購', minPrice: 0, maxPrice: null, items: [it('開放頭款', '總價*10%', { id: 'op1' }), it('開放尾款', '總價-開放頭款', { id: 'op2' })] };
  const bounded = { id: 'tpl-bounded', projectId: 'p1', templateName: '有上限範本', paymentCategory: '一般期款', propertyType: '住家', buyerType: '首購', minPrice: 1000, maxPrice: 3000, items: [it('有限頭款', '總價*20%', { id: 'bd1' }), it('有限尾款', '總價-有限頭款', { id: 'bd2' })] };
  const savedRows = [
    { key: 'bd1', name: '有限頭款', percent: 0, type: 'single', amount: 500, children: [] },
    { key: 'bd2', name: '有限尾款', percent: 0, type: 'single', amount: 1600, children: [] },
  ];
  const contractRows = page => page.evaluate(() => {
    for (const el of document.querySelectorAll('.v-overlay--active *')) {
      let inst = el.__vueParentComponent;
      while (inst) {
        if (/ContractDocDialog\.vue$/.test(inst.type?.__file || '')) return inst.setupState.editRows.map(r => [r.name, r.amount]);
        inst = inst.parent;
      }
    }
    return null;
  });
  backend.reset({ templates: [openEnded, bounded] });
  const untouched = await openContract('EMPTY');
  eq(G, '沒有存檔：照順序選第一個符合的範本', (await contractState(untouched.page)).active, '沒填上限範本');
  await untouched.close();
  backend.reset({ templates: [openEnded, bounded] });
  setContract('A1', { manualRowsTemplateId: 'tpl-bounded', paymentTemplateId: null, manualRowsBase: 2100, manualRows: savedRows });
  const keepSaved = await openContract('A1');
  eq(G, '已存合約：存檔時的範本還符合就不換', (await contractState(keepSaved.page)).active, '有上限範本');
  eq(G, '已存合約：手動調過的金額還在', await contractRows(keepSaved.page), [['有限頭款', 500], ['有限尾款', 1600]]);
  await keepSaved.close();
  backend.reset({ templates: [openEnded, { ...bounded, minPrice: 5000, maxPrice: 6000 }] });
  setContract('A1', { manualRowsTemplateId: 'tpl-bounded', paymentTemplateId: null, manualRowsBase: 2100, manualRows: savedRows });
  const movedOut = await openContract('A1');
  eq(G, '已存合約：存檔時的範本不符合了才跟著自動判斷', (await contractState(movedOut.page)).active, '沒填上限範本');
  await movedOut.close();

  // 裝修期款：存檔時用的範本不換掉；沒有存檔時選符合條件的範本
  const decoState = page => page.evaluate(() => {
    for (const el of document.querySelectorAll('.v-overlay--active *')) {
      let inst = el.__vueParentComponent;
      while (inst) {
        if (/ContractDocDialog\.vue$/.test(inst.type?.__file || '')) return inst.setupState.decoActiveTemplate?.templateName || null;
        inst = inst.parent;
      }
    }
    return null;
  });
  const decoFirst = { id: 'deco-first', projectId: 'p1', templateName: '配套範本一', paymentCategory: '配套期款', propertyType: '住家', buyerType: '首購', minPrice: 5000, maxPrice: 6000, items: [it('配一', '配套金額', { id: 'df1' })] };
  const decoOpen = { id: 'deco-open', projectId: 'p1', templateName: '配套範本二', paymentCategory: '配套期款', propertyType: '住家', buyerType: '首購', minPrice: 0, maxPrice: null, items: [it('配二', '配套金額', { id: 'do1' })] };
  backend.reset({ templates: [decoFirst, decoOpen] });
  const decoNew = await openContract('P1');
  eq(G, '裝修期款：選符合條件的範本（沒填上限也算）', await decoState(decoNew.page), '配套範本二');
  await decoNew.close();
  backend.reset({ templates: [decoFirst, decoOpen] });
  setContract('P1', { decorationManualRowsTemplateId: 'deco-first', decorationManualRowsBase: 200, decorationManualRows: [{ key: 'df1', name: '配一', percent: 0, type: 'single', amount: 200, children: [] }] });
  const decoKeep = await openContract('P1');
  eq(G, '裝修期款：存檔時用退路範本也不換掉', await decoState(decoKeep.page), '配套範本一');
  await decoKeep.close();
});

// ─────────────── T6 建案設定 ───────────────
group('T6', async () => {
  const G = 'T6 繳款提醒設定';
  backend.reset();
  const { page, close } = await open({ view: 'settings' });
  await settle(page, 500);
  const form = page.locator('.prs');
  check(G, '預設關閉', !(await form.locator('.prs-enable input').isChecked()), '');
  const tokens = () => form.locator('.prs-offsets .mac-token').allInnerTexts().then(l => l.map(x => x.trim()));
  eq(G, '預設天數', await tokens(), ['7 天', '3 天', '1 天', '當天']);
  eq(G, '預設 09:00', await form.locator('select[aria-label="發送時間"]').evaluate(el => el.selectedOptions[0].text), '09:00');
  eq(G, '發送時間 06–22 共 17 個', await form.locator('select[aria-label="發送時間"] option').allInnerTexts().then(o => [o.length, o[0], o.at(-1)]), [17, '06:00', '22:00']);
  check(G, '預設逾期開啟', await form.locator('input[aria-label="逾期提醒"]').isChecked(), '');
  eq(G, '預設每 3 天', await form.locator('input[aria-label="逾期提醒間隔天數"]').inputValue(), '3');
  const channelState = () => form.locator('.prs-role').evaluateAll(rows => rows.map(r => [...r.querySelectorAll('.prs-check')].map(l => `${l.innerText.trim()}:${l.querySelector('input').checked}`)));
  eq(G, '預設管道', await channelState(), [['Email:true', 'LINE:true'], ['Email:false', 'LINE:true']]);
  const saveBtn = form.getByRole('button', { name: '儲存' });
  check(G, '未修改不可儲存', await saveBtn.isDisabled(), '');
  await settle(page, 300);
  eq(G, '管理人員人數（排除系統管理員）', (await form.locator('.prs-link').first().innerText()).trim(), '3 位');
  eq(G, '未綁 LINE 提示', (await form.locator('.prs-warning').innerText()).trim(), '1 人未綁 LINE，改寄 Email；2 人無法通知');

  // 新增、刪除天數
  await form.locator('button[title="新增天數"]').click();
  await settle(page, 100);
  const offsetInput = form.locator('input[aria-label="到期前天數"]');
  check(G, '新增天數輸入框取得焦點', await offsetInput.evaluate(el => el === document.activeElement), '');
  await offsetInput.fill('14');
  await offsetInput.press('Enter');
  await settle(page, 100);
  eq(G, '新增 14 天並排序', await tokens(), ['14 天', '7 天', '3 天', '1 天', '當天']);
  check(G, '修改後可儲存', !(await saveBtn.isDisabled()), '');
  await form.locator('button[title="新增天數"]').click();
  await settle(page, 100);
  await offsetInput.fill('91');
  await form.getByRole('button', { name: '加入' }).click();
  await settle(page, 100);
  eq(G, '超過 90 天擋下', (await tokens()).length, 5);
  await offsetInput.fill('-1');
  await form.getByRole('button', { name: '加入' }).click();
  await settle(page, 100);
  eq(G, '負數不加入', (await tokens()).length, 5);
  await offsetInput.fill('1.5');
  await form.getByRole('button', { name: '加入' }).click();
  await settle(page, 100);
  eq(G, '小數不加入', (await tokens()).length, 5);
  await offsetInput.fill('7');
  await form.getByRole('button', { name: '加入' }).click();
  await settle(page, 100);
  eq(G, '重複天數不重複', await tokens(), ['14 天', '7 天', '3 天', '1 天', '當天']);
  await form.locator('button[title="新增天數"]').click();
  await settle(page, 100);
  await offsetInput.fill('30');
  await form.getByRole('button', { name: '加入' }).click();
  await settle(page, 100);
  eq(G, '第 6 個', (await tokens()).length, 6);
  check(G, '滿 6 個不可再加', await form.locator('button[title="新增天數"]').isDisabled(), '');
  await form.getByRole('button', { name: '移除30 天' }).click();
  await form.getByRole('button', { name: '移除當天' }).click();
  await settle(page, 100);
  eq(G, '移除天數', await tokens(), ['14 天', '7 天', '3 天', '1 天']);

  // 時間、逾期
  await form.locator('select[aria-label="發送時間"]').selectOption({ label: '10:00' });
  const intervalInput = form.locator('input[aria-label="逾期提醒間隔天數"]');
  await intervalInput.fill('31');
  await intervalInput.blur();
  await settle(page, 100);
  const after31 = await intervalInput.inputValue();
  eq(G, '逾期間隔 31 夾到上限 30', after31, '30');
  await intervalInput.fill('0');
  await intervalInput.blur();
  await settle(page, 100);
  eq(G, '逾期間隔 0 夾到下限 1', await intervalInput.inputValue(), '1');
  await intervalInput.fill('2.5');
  await intervalInput.blur();
  await settle(page, 100);
  eq(G, '逾期間隔小數四捨五入（2.5→3）', await intervalInput.inputValue(), '3');
  await intervalInput.fill('7.4');
  await intervalInput.blur();
  await settle(page, 100);
  eq(G, '逾期間隔小數四捨五入（7.4→7）', await intervalInput.inputValue(), '7');
  await intervalInput.fill('');
  await intervalInput.blur();
  await settle(page, 100);
  eq(G, '逾期間隔清空回到上一個有效值', await intervalInput.inputValue(), '7');
  await intervalInput.fill('5');
  await intervalInput.blur();
  await form.locator('input[aria-label="逾期提醒"]').uncheck();
  await settle(page, 100);
  eq(G, '關閉逾期：隱藏間隔', await intervalInput.count(), 0);
  await form.locator('input[aria-label="逾期提醒"]').check();
  await settle(page, 100);
  eq(G, '重開逾期：保留間隔', await intervalInput.inputValue(), '5');

  // 管道與預覽
  const previewBefore = calls('paymentReminderApi', 'previewRecipients').length;
  await form.locator('.prs-role').nth(1).locator('.prs-check', { hasText: 'Email' }).locator('input').check();
  await settle(page, 700);
  eq(G, '管道變更後重算預覽', calls('paymentReminderApi', 'previewRecipients').length, previewBefore + 1);
  const prevSettings = lastCall('paymentReminderApi', 'previewRecipients').settings;
  eq(G, '預覽帶目前管道', prevSettings.salespersons.channels, ['email', 'line']);

  // 人員清單
  await form.locator('.prs-link').first().click();
  await settle(page);
  const people = dialog(page);
  const managerRows = people.locator('label.prs-person');
  eq(G, '人員清單：管理人員', await managerRows.locator('.prs-person-name').allInnerTexts(), ['管理甲', '管理乙（未綁 LINE）', '管理丙（都沒有）']);
  const tagsOf = row => row.locator('.mac-tag').allInnerTexts();
  eq(G, '人員清單：LINE／Email 綁定標示', await tagsOf(managerRows.nth(1)), ['未綁 LINE', 'Email']);
  eq(G, '人員清單：無法通知', await tagsOf(managerRows.nth(2)), ['未綁 LINE', '無 Email', '無法通知']);
  const salesRows = people.locator('div.prs-person');
  eq(G, '人員清單：銷售人員', await salesRows.locator('.prs-person-name').allInnerTexts(), ['銷售甲', '銷售乙', '離職人員', '銷售丙']);
  check(G, '人員清單：已無權限標示', (await tagsOf(salesRows.nth(2))).includes('已無權限'), JSON.stringify(await tagsOf(salesRows.nth(2))));
  await managerRows.nth(1).locator('input').uncheck();
  await settle(page, 700);
  await clickDialogButton(page, '完成');
  await settle(page);
  eq(G, '排除後人數顯示', (await form.locator('.prs-link').first().innerText()).trim(), '2／3 位');

  // 儲存
  await form.locator('.prs-enable input').check();
  await settle(page, 100);
  await saveBtn.click();
  await settle(page, 400);
  const saved = backend.savedSettings.at(-1)?.dataToUpdate?.paymentReminderSettings;
  const { updatedAt, updatedBy, ...rest } = saved || {};
  eq(G, '儲存內容', rest, { enabled: true, offsetDays: [14, 7, 3, 1], sendHour: 10, overdue: { enabled: true, intervalDays: 5 }, managers: { channels: ['email', 'line'], excludedUserKeys: ['mgr2'] }, salespersons: { channels: ['email', 'line'] } });
  check(G, '儲存帶 updatedAt、updatedBy', !!updatedAt && updatedBy === '管理甲', JSON.stringify({ updatedAt, updatedBy }));
  eq(G, '只寫 paymentReminderSettings', Object.keys(backend.savedSettings.at(-1).dataToUpdate), ['paymentReminderSettings']);
  check(G, '儲存後回到未修改', await saveBtn.isDisabled(), '');
  check(G, '儲存成功提示', (await toasts(page)).some(t => t.type === 'success'), '');
  await page.reload();
  await page.waitForFunction(() => window.__ready === true);
  await settle(page, 700);
  eq(G, '重新載入後值一致', [await tokens(), await form.locator('select[aria-label="發送時間"]').inputValue(), await form.locator('input[aria-label="逾期提醒間隔天數"]').inputValue(), await form.locator('.prs-enable input').isChecked()], [['14 天', '7 天', '3 天', '1 天'], '10', '5', true]);
  eq(G, '重新載入後未修改', await saveBtn.isDisabled(), true);

  // 防呆
  for (const label of ['14 天', '7 天', '3 天', '1 天']) await form.getByRole('button', { name: `移除${label}` }).click();
  await form.locator('input[aria-label="逾期提醒"]').uncheck();
  await settle(page, 100);
  check(G, '防呆：無時機', (await form.locator('.prs-issue').innerText()).includes('提醒時機') && await saveBtn.isDisabled(), '');
  await form.locator('.prs-enable input').uncheck();
  await settle(page, 100);
  check(G, '關閉時不擋儲存', (await form.locator('.prs-issue').count()) === 0 && !(await saveBtn.isDisabled()), '');
  await form.locator('.prs-enable input').check();
  await form.locator('input[aria-label="逾期提醒"]').check();
  await settle(page, 100);
  check(G, '只有逾期提醒也可儲存', (await form.locator('.prs-issue').count()) === 0, '');
  for (const role of [0, 1]) {
    const boxes = form.locator('.prs-role').nth(role).locator('.prs-check input');
    for (let i = 0; i < await boxes.count(); i += 1) await boxes.nth(i).uncheck();
  }
  await settle(page, 100);
  check(G, '防呆：無管道', (await form.locator('.prs-issue').innerText()).includes('通知方式') && await saveBtn.isDisabled(), '');
  await close();

  // 測試通知
  backend.reset({ sendFail: (_c, channel) => channel === 'line' });
  const t = await open({ view: 'settings' });
  await settle(t.page, 500);
  await t.page.getByRole('button', { name: '寄測試通知給我' }).click();
  await settle(t.page, 400);
  const sendArgs = lastCall('paymentReminderApi', 'sendTest');
  eq(G, '測試通知參數', [sendArgs.userKey, sendArgs.channels], ['mgr1', ['email', 'line']]);
  const tr = await t.page.locator('.prs .mac-form-pad .mac-callout').innerText();
  check(G, '測試通知：部分失敗結果', tr.includes('Email：已送出') && tr.includes('LINE：失敗'), tr);
  await t.close();

  backend.reset({ blockedProject: true });
  const tb = await open({ view: 'settings' });
  await settle(tb.page, 500);
  await tb.page.getByRole('button', { name: '寄測試通知給我' }).click();
  await settle(tb.page, 400);
  check(G, '測試通知：試用建案', (await tb.page.locator('.prs .mac-form-pad .mac-callout').innerText()).includes('試用建案'), '');
  await tb.close();

  // 通知紀錄
  backend.reset();
  const l = await open({ view: 'settings' });
  await settle(l.page, 500);
  await l.page.getByRole('button', { name: '通知紀錄' }).click();
  await settle(l.page, 500);
  const ld = dialog(l.page);
  const heads = await ld.locator('.prs-log-head').allInnerTexts();
  eq(G, '通知紀錄筆數（只含繳款通知）', heads.length, 7);
  const logNotes = await ld.locator('.prs-log-note').allInnerTexts();
  check(G, '通知紀錄顯示沒有收件人與最後錯誤', logNotes.some(x => x.includes('有到期項目，但沒有收件人')) && logNotes.some(x => x.includes('DEADLINE_EXCEEDED')), logNotes.join(' / '));
  check(G, '通知紀錄新到舊與狀態', heads[0].includes('部分失敗') && heads[1].includes('完成') && heads[2].includes('沒有項目') && heads[3].includes('試用建案未發送') && heads[4].includes('測試'), heads.join(' / '));
  check(G, '通知紀錄：統計', heads[0].includes('12 筆') && heads[0].includes('成功 3') && heads[0].includes('失敗 1') && heads[0].includes('未送達 2'), heads[0]);
  await ld.locator('.prs-log-head').first().click();
  await settle(l.page, 150);
  const attempts = await ld.locator('.prs-attempt').allInnerTexts();
  check(G, '展開：每人結果與原因', attempts.length === 6 && attempts.some(a => a.includes('改寄')) && attempts.some(a => a.includes('沒有 LINE 與 Email')) && attempts.some(a => a.includes('已無此建案權限')), attempts.join(' / '));
  await ld.locator('.prs-log-head').nth(2).click();
  await settle(l.page, 150);
  check(G, '展開：沒有發送對象', (await ld.locator('.prs-attempts').innerText()).includes('沒有發送對象'), '');
  await l.close();

  // 載入失敗與預覽失敗
  backend.reset({ failures: { getProjectSettings: '資料庫連線失敗' } });
  const e = await open({ view: 'settings' });
  await settle(e.page, 400);
  check(G, '設定載入失敗畫面', (await e.page.locator('.prs .mac-callout--error').innerText()).includes('載入設定失敗') && (await e.page.getByRole('button', { name: '重試' }).count()) === 1, '');
  backend.failures = {};
  await e.page.getByRole('button', { name: '重試' }).click();
  await settle(e.page, 500);
  check(G, '設定重試成功', (await e.page.locator('.prs-enable').count()) === 1, '');
  await e.close();

  backend.reset({ failures: { 'paymentReminderApi:previewRecipients': '無法讀取人員' } });
  const pe = await open({ view: 'settings' });
  await settle(pe.page, 500);
  check(G, '預覽失敗提示', (await pe.page.locator('.prs-preview-error').innerText()).includes('讀取通知人員失敗'), '');
  await pe.close();

  backend.reset({ failures: { 'paymentReminderApi:listLogs': '紀錄失敗', updateProjectSalesSettings: '寫入失敗' } });
  const le = await open({ view: 'settings' });
  await settle(le.page, 500);
  await le.page.locator('.prs-enable input').check();
  await le.page.locator('.prs').getByRole('button', { name: '儲存' }).click();
  await settle(le.page, 300);
  check(G, '儲存失敗提示', (await toasts(le.page)).some(t => t.type === 'error' && t.message.includes('儲存失敗')), JSON.stringify(await toasts(le.page)));
  await le.page.getByRole('button', { name: '通知紀錄' }).click();
  await settle(le.page, 400);
  check(G, '通知紀錄失敗畫面', (await dialog(le.page).locator('.mac-callout--error').innerText()).includes('讀取紀錄失敗'), '');
  await le.close();

  // 既有設定帶入
  backend.reset({ projectSettings: { enabled: true, offsetDays: [5], sendHour: 21, overdue: { enabled: false, intervalDays: 10 }, managers: { channels: ['line'], excludedUserKeys: ['mgr3'] }, salespersons: { channels: [] } } });
  const ex = await open({ view: 'settings' });
  await settle(ex.page, 600);
  eq(G, '既有設定帶入', [await ex.page.locator('.prs-enable input').isChecked(), await ex.page.locator('.prs-offsets .mac-token').allInnerTexts().then(a => a.map(x => x.trim())), await ex.page.locator('select[aria-label="發送時間"]').inputValue(), await ex.page.locator('input[aria-label="逾期提醒"]').isChecked()], [true, ['5 天'], '21', false]);
  eq(G, '既有設定：人數', (await ex.page.locator('.prs-link').first().innerText()).trim(), '2／3 位');
  await ex.close();
});

// ─────────────── T7 到期清單 ───────────────
const listRows = page => page.locator('.pd-table tbody tr');
const listTexts = page => listRows(page).evaluateAll(rows => rows.map(r => [...r.children].map(c => c.innerText.trim().replace(/\s+/g, ' '))));
const segs = page => page.locator('.pd-toolbar .mac-form-seg-btn').allInnerTexts().then(l => l.map(x => x.trim()));

group('T7', async () => {
  const G = 'T7 到期清單';
  backend.reset();
  const { page, close } = await open({ view: 'list', role: 'manager' });
  await settle(page, 400);
  eq(G, '管理者：分段數字', await segs(page), ['全部 11', '逾期 2', '7 天內 4', '30 天內 6']);
  const rows = await listTexts(page);
  eq(G, '排序：逾期、今天、即將到期、遠期', rows.map(r => r[0]), ['逾期 7 天', '逾期 3 天', '今天到期', '剩 2 天', '剩 3 天', '剩 5 天', '剩 20 天', '剩 25 天', '剩 40 天', '剩 45 天', `剩 ${Math.round((Date.parse('2027-03-01') - Date.parse(TODAY)) / DAY)} 天`]);
  check(G, '退戶與空狀態戶別不列入', !rows.some(r => r[2].includes('不應出現')), rows.map(r => r[2]).join('/'));
  check(G, '管理者：有批次新增與標記已繳', (await page.getByRole('button', { name: '批次新增' }).count()) === 1 && (await page.getByRole('button', { name: '標記已繳' }).count()) === rows.length, '');
  eq(G, '摘要：逾期金額', await page.locator('.pd-stat.is-red').innerText().then(x => x.replace(/\s+/g, ' ')), `逾期 2 筆 ${money(400000)} 元`);
  check(G, 'tel 連結', (await page.locator('.pd-tel').first().getAttribute('href')).startsWith('tel:09'), '');
  await page.locator('.pd-table .pd-tel').first().click();
  await settle(page, 200);
  eq(G, '點電話不開戶別視窗', await page.locator('.v-dialog.v-overlay--active').count(), 0);
  // 搜尋
  const search = page.locator('.pd-search input');
  await search.fill('王小明');
  await settle(page, 120);
  eq(G, '搜尋買方', (await listTexts(page)).every(r => r[1].startsWith('A1')), true);
  await search.fill('0922333444');
  await settle(page, 120);
  eq(G, '搜尋電話', (await listTexts(page)).map(r => r[1]), ['A2', 'A2']);
  await search.fill('銷售乙');
  await settle(page, 120);
  eq(G, '搜尋銷售人員', (await listTexts(page)).length, 2);
  await search.fill('沒有這個人');
  await settle(page, 120);
  eq(G, '搜尋無結果', (await page.locator('.mac-list-empty').innerText()).trim(), '沒有符合的項目');
  await search.fill('');
  await settle(page, 120);

  // 分段
  await page.locator('.pd-toolbar .mac-form-seg-btn', { hasText: '逾期' }).click();
  await settle(page, 100);
  eq(G, '分段：逾期', (await listTexts(page)).map(r => r[0]), ['逾期 7 天', '逾期 3 天']);
  await page.locator('.pd-toolbar .mac-form-seg-btn', { hasText: '7 天內' }).click();
  await settle(page, 100);
  eq(G, '分段：7 天內含今天', (await listTexts(page)).map(r => r[0]), ['今天到期', '剩 2 天', '剩 3 天', '剩 5 天']);
  await page.locator('.pd-toolbar .mac-form-seg-btn', { hasText: '30 天內' }).click();
  await settle(page, 100);
  eq(G, '分段：30 天內', (await listTexts(page)).length, 6);
  await page.locator('.pd-stat.is-red').click();
  await settle(page, 100);
  check(G, '點摘要切換逾期', (await page.locator('.pd-toolbar .mac-form-seg-btn.is-active').innerText()).includes('逾期') && (await page.locator('.pd-stat.is-red.is-active').count()) === 1, '');
  await page.locator('.pd-stat.is-red').click();
  await settle(page, 100);
  check(G, '再點摘要回到全部', (await page.locator('.pd-toolbar .mac-form-seg-btn.is-active').innerText()).includes('全部'), '');

  // 標記已繳
  const beforeCount = (await listTexts(page)).length;
  const firstRow = listRows(page).first();
  await firstRow.getByRole('button', { name: '標記已繳' }).click();
  await settle(page);
  const d = dialog(page);
  eq(G, '標記已繳預帶', [await d.getByLabel('繳款日').inputValue(), await d.getByLabel('實繳金額').inputValue()], [TODAY, '300000']);
  check(G, '標記已繳不開戶別視窗', (await page.locator('.pd-sheet').count()) === 0 || !(await page.locator('.pd-sheet').isVisible()), '');
  await clickDialogButton(page, '確認已繳');
  await d.waitFor({ state: 'hidden' });
  await settle(page, 300);
  const up = lastCall('paymentProofApi', 'updateRecord');
  eq(G, '清單標記已繳參數', { recordId: up.recordId, date: up.date, amount: up.amount, paidBy: up.paidBy, note: up.note }, { recordId: 'p_over', date: TODAY, amount: 300000, paidBy: '管理甲', note: '第 2 期工程款' });
  check(G, '清單標記已繳未清掉預計日', backend.db.store.get('salesHouseholds/p1_A1').paymentRecords.find(r => r.id === 'p_over').expectedDate === addDays(-7), '');
  eq(G, '標記後清單少一筆', (await listTexts(page)).length, beforeCount - 1);
  eq(G, '標記後逾期數字更新', (await segs(page))[1], '逾期 1');

  // 差額：清單新增
  await listRows(page).filter({ hasText: 'A2' }).first().getByRole('button', { name: '標記已繳' }).click();
  await settle(page);
  const d2 = dialog(page);
  await d2.getByLabel('實繳金額').fill('60000');
  await settle(page, 80);
  await d2.getByLabel('預計日').fill(addDays(9));
  await clickDialogButton(page, '確認已繳');
  await d2.waitFor({ state: 'hidden' });
  await settle(page, 300);
  const addBalance = lastCall('paymentProofApi', 'addRecord');
  eq(G, '清單差額參數', { expectedAmount: addBalance.expectedAmount, expectedDate: addBalance.expectedDate, planSource: addBalance.planSource, date: addBalance.date, amount: addBalance.amount, note: addBalance.note }, { expectedAmount: 40000, expectedDate: addDays(9), planSource: 'balance', date: '', amount: null, note: '簽約款 尾款' });
  check(G, '清單差額列出現', (await listTexts(page)).some(r => r[2] === '簽約款 尾款'), '');

  // 開啟戶別
  await listRows(page).filter({ hasText: 'A1' }).first().locator('td').nth(2).click();
  await settle(page, 500);
  const ud = dialog(page);
  check(G, '點列開啟戶別繳款紀錄', (await ud.locator('.mac-sheet-head').innerText()).includes('A1 繳款紀錄'), '');
  check(G, '清單的戶別面板：隱藏比例', (await ud.locator('.pr-stat').allInnerTexts()).every(x => !x.includes('繳款比例')), '');
  eq(G, '清單的戶別面板：沒有帶入合約期款資料', await ud.getByRole('button', { name: '帶入合約期款資料' }).count(), 0);
  await ud.locator('section[aria-label="預計繳款"] .pr-row', { hasText: '第 3 期工程款' }).getByRole('button', { name: '標記已繳' }).click();
  await settle(page);
  await clickDialogButton(page, '確認已繳');
  await settle(page, 600);
  check(G, '戶別面板標記已繳後清單同步', !(await listTexts(page)).some(r => r[1].startsWith('A1') && r[2] === '第 3 期工程款'), '');
  check(G, '戶別面板：移到已繳區', (await ud.locator('section[aria-label="已繳款"] .pr-row', { hasText: '第 3 期工程款' }).count()) === 1, '');
  // 新增預計同步
  await ud.locator('.pr-actions').getByRole('button', { name: '預計繳款', exact: true }).click();
  await settle(page);
  const addD = dialog(page);
  await addD.locator('input[aria-label="預計日"]').fill(addDays(1));
  await addD.locator('input[aria-label="備註"]').fill('面板新增期');
  await clickDialogButton(page, '儲存');
  await page.locator('.v-dialog.v-overlay--active .pr-dialog-body').waitFor({ state: 'hidden' });
  await settle(page, 400);
  check(G, '戶別面板新增後清單同步', (await listTexts(page)).some(r => r[2] === '面板新增期'), '');
  const addCall = lastCall('paymentProofApi', 'addRecord');
  eq(G, '清單面板新增參數', { unitId: addCall.unitId, projectId: addCall.projectId, date: addCall.date, amount: addCall.amount, planSource: addCall.planSource, paidBy: addCall.paidBy }, { unitId: 'A1', projectId: 'p1', date: '', amount: null, planSource: 'manual', paidBy: '管理甲' });
  // 刪除
  await menu(page, ud.locator('section[aria-label="預計繳款"] .pr-row', { hasText: '面板新增期' }), '刪除');
  await clickDialogButton(page, '刪除');
  await settle(page, 500);
  check(G, '戶別面板刪除後清單同步', !(await listTexts(page)).some(r => r[2] === '面板新增期'), '');
  await ud.locator('.mac-sheet-close').click();
  await settle(page);

  // 全部繳清
  backend.reset();
  await page.getByRole('button').filter({ has: page.locator('.mdi-refresh') }).click();
  await settle(page, 400);
  eq(G, '重新整理重抓', (await segs(page))[0], '全部 11');

  // 返回
  await page.locator('.mac-page-title button').first().click();
  await settle(page, 200);
  eq(G, '管理者返回銷控系統', (await page.evaluate(() => window.__nav)).at(-1), { name: 'SalesControlSystem', params: { projectName: 'p1' } });
  await close();

  // 重新整理失敗不清空
  backend.reset();
  const rf = await open({ view: 'list', role: 'manager' });
  await settle(rf.page, 400);
  backend.failures = { 'paymentReminderApi:listDue': '暫時無法連線' };
  await rf.page.getByRole('button').filter({ has: rf.page.locator('.mdi-refresh') }).click();
  await settle(rf.page, 400);
  check(G, '重新整理失敗：保留清單並提示', (await listRows(rf.page).count()) > 0 && (await toasts(rf.page)).some(t => t.message.includes('清單更新失敗')), JSON.stringify(await toasts(rf.page)));
  await rf.close();

  // 銷售人員
  backend.reset();
  const s = await open({ view: 'list', role: 'sales' });
  await settle(s.page, 400);
  const salesRows = await listTexts(s.page);
  check(G, '銷售人員：只看自己的戶', salesRows.length > 0 && salesRows.every(r => /A1|A3|B1|B2|B3|B4/.test(r[1])) && !salesRows.some(r => r[1].startsWith('A2') || r[1].startsWith('A9')), salesRows.map(r => r[1]).join('/'));
  eq(G, '銷售人員：沒有批次新增與標記已繳', [await s.page.getByRole('button', { name: '批次新增' }).count(), await s.page.getByRole('button', { name: '標記已繳' }).count()], [0, 0]);
  check(G, '銷售人員：沒有操作欄', !(await s.page.locator('.pd-table thead').innerText()).includes('操作'), '');
  await listRows(s.page).first().locator('td').nth(2).click();
  await settle(s.page, 500);
  const sd = dialog(s.page);
  eq(G, '銷售人員：戶別面板唯讀', [await sd.locator('.pr-actions').count(), await sd.locator('.pr-more').count(), await sd.getByRole('button', { name: '標記已繳' }).count()], [0, 0, 0]);
  await sd.locator('.mac-sheet-close').click();
  await settle(s.page);
  await s.page.locator('.mac-page-title button').first().click();
  await settle(s.page, 200);
  eq(G, '銷售人員返回首頁', (await s.page.evaluate(() => window.__nav)).at(-1)?.name, 'Home');
  await s.close();

  // 同時是管理人員與該戶銷售人員：標「我的」
  backend.reset();
  const b4 = backend.db.store.get('salesHouseholds/p1_B4');
  backend.db.store.set('salesHouseholds/p1_B4', { ...b4, salesperson: ['管理甲'], salespersonUserKey: ['mgr1'] });
  const mine = await open({ view: 'list', role: 'manager' });
  await settle(mine.page, 400);
  const mineRows = await listTexts(mine.page);
  check(G, '管理者自己的戶標「我的」', mineRows.filter(r => r[1].includes('我的')).map(r => r[1].split(' ')[0]).join() === 'B4', mineRows.map(r => r[1]).join('/'));
  await mine.close();

  // 系統管理員
  backend.reset();
  const admin = await open({ view: 'list', role: 'admin' });
  await settle(admin.page, 400);
  eq(G, '系統管理員看全案', (await segs(admin.page))[0], '全部 11');
  await admin.close();

  // 權限不足
  backend.reset();
  const none = await open({ view: 'list', role: 'none' });
  await settle(none.page, 300);
  check(G, '權限不足畫面', (await none.page.locator('.pd-state .mac-callout--warning').innerText()).includes('權限不足'), '');
  eq(G, '權限不足不呼叫 API', calls('paymentReminderApi', 'listDue').length, 0);
  eq(G, '權限不足沒有摘要與清單', await none.page.locator('.pd-summary').count(), 0);
  await none.page.getByRole('button', { name: '回首頁', exact: true }).click();
  await settle(none.page, 200);
  eq(G, '權限不足回首頁', (await none.page.evaluate(() => window.__nav)).at(-1)?.name, 'Home');
  await none.close();

  // 前端有權限、後端拒絕
  backend.reset();
  const apiDenied = await open({ view: 'list', role: 'apiDenied' });
  await settle(apiDenied.page, 300);
  check(G, '後端權限拒絕也顯示權限畫面', (await apiDenied.page.locator('.pd-state .mac-callout--warning').count()) === 1, await apiDenied.page.locator('.pd-state').innerText().catch(() => ''));
  await apiDenied.close();

  // 依錯誤碼判斷，不是看訊息文字
  backend.reset({ failures: { 'paymentReminderApi:listDue': { message: '權限服務暫時無法連線', code: 'functions/internal' } } });
  const codeInternal = await open({ view: 'list', role: 'manager' });
  await settle(codeInternal.page, 300);
  eq(G, '訊息含「權限」但錯誤碼是 internal：顯示錯誤畫面可重試', [await codeInternal.page.locator('.pd-state .mac-callout--error').count(), await codeInternal.page.getByRole('button', { name: '重試' }).count()], [1, 1]);
  await codeInternal.close();
  backend.reset({ failures: { 'paymentReminderApi:listDue': { message: 'not allowed', code: 'functions/permission-denied' } } });
  const codeDenied = await open({ view: 'list', role: 'manager' });
  await settle(codeDenied.page, 300);
  eq(G, '錯誤碼 permission-denied：顯示權限畫面', await codeDenied.page.locator('.pd-state .mac-callout--warning').count(), 1);
  await codeDenied.close();

  // 載入失敗與重試
  backend.reset({ failures: { 'paymentReminderApi:listDue': '伺服器暫時無法處理' } });
  const err = await open({ view: 'list', role: 'manager' });
  await settle(err.page, 300);
  check(G, '載入失敗畫面', (await err.page.locator('.pd-state .mac-callout--error').innerText()).includes('伺服器暫時無法處理'), '');
  backend.failures = {};
  await err.page.getByRole('button', { name: '重試' }).click();
  await settle(err.page, 400);
  eq(G, '重試後顯示清單', (await segs(err.page))[0], '全部 11');
  await err.close();

  // 空資料
  backend.reset({ emptyData: true });
  const em = await open({ view: 'list', role: 'manager' });
  await settle(em.page, 300);
  eq(G, '空資料畫面', (await em.page.locator('.mac-list-empty').innerText()).trim(), '目前沒有待繳項目');
  eq(G, '空資料：數字為 0', await segs(em.page), ['全部 0', '逾期 0', '7 天內 0', '30 天內 0']);
  await em.close();

  // 手機
  backend.reset();
  const m = await open({ view: 'list', role: 'manager' }, { width: 390 });
  await settle(m.page, 400);
  const mobileRows = m.page.locator('.mac-list .mac-list-row');
  eq(G, '手機：清單列筆數', await mobileRows.count(), 11);
  check(G, '手機：沒有表格', (await m.page.locator('.pd-table').count()) === 0, '');
  const firstText = await mobileRows.first().innerText();
  check(G, '手機：列內容', firstText.includes('A1') && firstText.includes('第 2 期工程款') && firstText.includes('逾期 7 天') && firstText.includes('王小明') && firstText.includes('0912345678') && firstText.includes('銷售'), firstText);
  const telHref = await mobileRows.first().locator('.pd-tel').getAttribute('href');
  eq(G, '手機：tel 連結', telHref, 'tel:0912345678');
  await mobileRows.first().getByRole('button', { name: '標記已繳' }).tap();
  await settle(m.page);
  check(G, '手機：標記已繳不開戶別視窗', (await dialog(m.page).locator('.mpd-summary').count()) === 1, '');
  await clickDialogButton(m.page, '取消');
  await settle(m.page);
  await mobileRows.nth(1).locator('.mac-list-title').tap();
  await settle(m.page, 500);
  check(G, '手機：點列開啟戶別', (await dialog(m.page).locator('.mac-sheet-head').innerText()).includes('繳款紀錄'), '');
  await m.close();
});

// ─────────────── T8 批次新增 ───────────────
group('T8', async () => {
  const G = 'T8 批次新增';
  backend.reset();
  const { page, close } = await open({ view: 'list', role: 'manager' });
  await settle(page, 400);
  await page.getByRole('button', { name: '批次新增' }).click();
  await settle(page, 500);
  const d = dialog(page);
  eq(G, '步驟標示', await d.locator('.mac-page-count').innerText(), '1／3');
  const nextBtn = d.getByRole('button', { name: '下一步' });
  check(G, '第一步：內容未填不可下一步', await nextBtn.isDisabled(), '');
  await fillOtherPeriod(d, '第 9 期工程款');
  check(G, '第一步：只有期別不可下一步', await nextBtn.isDisabled(), '');
  await d.locator('input[type=date]').fill('2027-03-01');
  await settle(page, 80);
  check(G, '第一步：不填金額可下一步', !(await nextBtn.isDisabled()), '');
  await d.locator('.mac-form-seg-btn', { hasText: '固定金額' }).click();
  await settle(page, 80);
  check(G, '固定金額未填不可下一步', await nextBtn.isDisabled(), '');
  const fixed = d.locator('input[type=number]');
  await fixed.fill('0');
  check(G, '固定金額 0 不可', await nextBtn.isDisabled(), '');
  await fixed.fill('-5');
  check(G, '固定金額負數不可', await nextBtn.isDisabled(), '');
  await fixed.fill('12.5');
  check(G, '固定金額小數不可', await nextBtn.isDisabled(), '');
  await fixed.fill('50000');
  await settle(page, 80);
  check(G, '固定金額有效', !(await nextBtn.isDisabled()), '');
  await d.locator('.mac-form-seg-btn', { hasText: '成交總價比例' }).click();
  await settle(page, 80);
  const ratio = d.locator('input[type=number]');
  await ratio.fill('0');
  check(G, '比例 0 不可', await nextBtn.isDisabled(), '');
  await ratio.fill('101');
  check(G, '比例超過 100 不可', await nextBtn.isDisabled(), '');
  await ratio.fill('7.5');
  await settle(page, 80);
  check(G, '比例有效', !(await nextBtn.isDisabled()), '');
  await nextBtn.click();
  await settle(page, 400);

  // 選戶
  eq(G, '第二步標示', await d.locator('.mac-page-count').innerText(), '2／3');
  await d.locator('label.ppb-unit', { hasText: 'A1' }).locator('input').check();
  await page.mouse.click(1400, 880);
  await settle(page, 300);
  const batchStillOpen = await page.locator('.ppb').isVisible().catch(() => false);
  check(G, '批次新增 persistent：點外面不關閉', batchStillOpen, '在第 2 步點對話框外面，視窗關閉');
  if (!batchStillOpen) {
    await page.getByRole('button', { name: '批次新增' }).click();
    await settle(page, 400);
    await fillOtherPeriod(d, '第 9 期工程款');
    await d.locator('input[type=date]').fill('2027-03-01');
    await d.locator('.mac-form-seg-btn', { hasText: '成交總價比例' }).click();
    await settle(page, 80);
    await d.locator('input[type=number]').fill('7.5');
    await settle(page, 80);
    await d.getByRole('button', { name: '下一步' }).click();
    await settle(page, 400);
  } else {
    await d.locator('label.ppb-unit', { hasText: 'A1' }).locator('input').uncheck();
  }
  const statusLabels = await d.locator('.ppb-status').evaluateAll(l => l.map(x => [x.innerText.trim(), x.querySelector('input').checked]));
  check(G, '預設只勾已成交類狀態', statusLabels.find(s => s[0] === '簽約')?.[1] === true && statusLabels.find(s => s[0] === '成交')?.[1] === true && statusLabels.find(s => s[0] === '小訂')?.[1] === true && statusLabels.find(s => s[0] === '自訂狀態')?.[1] === false, JSON.stringify(statusLabels));
  check(G, '不列退戶與空狀態', !statusLabels.some(s => s[0] === '退戶' || s[0] === ''), JSON.stringify(statusLabels));
  const visibleUnits = () => d.locator('label.ppb-unit .ppb-unit-id').allInnerTexts();
  const defaultUnits = await visibleUnits();
  check(G, '預設列表不含自訂狀態與退戶', !defaultUnits.includes('B2') && !defaultUnits.includes('A4') && !defaultUnits.includes('B5') && !defaultUnits.includes('B6') && defaultUnits.includes('A1'), defaultUnits.join(','));
  check(G, '無買方顯示未填買方', (await d.locator('label.ppb-unit', { hasText: 'B3' }).innerText()).includes('未填買方'), '');
  check(G, '成交總價含車位', (await d.locator('label.ppb-unit', { hasText: 'A1' }).innerText()).includes('2,100 萬'), await d.locator('label.ppb-unit', { hasText: 'A1' }).innerText());
  check(G, '未選戶不可下一步', await nextBtn.isDisabled(), '');
  await d.locator('select[aria-label="棟別"]').selectOption('B');
  await settle(page, 100);
  check(G, '棟別篩選', (await visibleUnits()).every(u => u.startsWith('B') || u === 'A3'), (await visibleUnits()).join(','));
  await d.locator('select[aria-label="棟別"]').selectOption('');
  await d.locator('.ppb-search input').fill('王小明');
  await settle(page, 100);
  eq(G, '搜尋買方', await visibleUnits(), ['A1']);
  await d.locator('label.ppb-unit', { hasText: 'A1' }).locator('input').check();
  await d.locator('.ppb-search input').fill('');
  await settle(page, 100);
  eq(G, '搜尋後保留已選', await d.locator('.ppb-count').innerText(), '已選 1 戶');
  await d.locator('.ppb-all input').check();
  await settle(page, 100);
  check(G, '全選可見戶別', (await d.locator('.ppb-count').innerText()) === `已選 ${defaultUnits.length} 戶`, await d.locator('.ppb-count').innerText());
  await d.locator('label.ppb-unit', { hasText: 'A9' }).locator('input').uncheck();
  await nextBtn.click();
  await settle(page, 200);

  // 預覽
  eq(G, '第三步標示', await d.locator('.mac-page-count').innerText(), '3／3');
  const review = await d.locator('.ppb-unit').evaluateAll(l => l.map(x => ({
    id: x.querySelector('.ppb-unit-id').innerText, amount: x.querySelector('.ppb-unit-total').innerText, tag: x.querySelector('.mac-tag').innerText,
  })));
  const byId = Object.fromEntries(review.map(r => [r.id, r]));
  eq(G, '比例金額：含車位成交總價 2100 萬 × 7.5%', byId.A1.amount, `${money(1575000)} 元`);
  eq(G, '比例金額：小數成交總價（1234.56＋65.44）', byId.B1.amount, `${money(975000)} 元`);
  eq(G, '比例金額：無成交價顯示未填', byId.B3.amount, '未填金額');
  eq(G, '已存在略過', byId.B4.tag, '已存在，略過');
  eq(G, '新增標示', byId.A1.tag, '新增');
  const sum = await d.locator('.ppb-review-sum').innerText();
  check(G, '摘要：新增、略過、合計', sum.includes('略過 1 戶') && sum.includes('合計'), sum);

  // 上一步再改固定金額
  await d.getByRole('button', { name: '上一步' }).click();
  await settle(page, 100);
  eq(G, '上一步保留已選', (await d.locator('.ppb-count').innerText()).startsWith('已選'), true);
  await d.getByRole('button', { name: '上一步' }).click();
  await settle(page, 100);
  await d.locator('.mac-form-seg-btn', { hasText: '固定金額' }).click();
  await settle(page, 80);
  await d.locator('input[type=number]').fill('50000');
  await nextBtn.click();
  await settle(page, 100);
  await nextBtn.click();
  await settle(page, 200);
  const fixedRows = await d.locator('.ppb-unit').evaluateAll(l => l.map(x => x.querySelector('.ppb-unit-total').innerText));
  check(G, '固定金額預覽', fixedRows.every(x => x === `${money(50000)} 元`), fixedRows.join(','));
  await d.getByRole('button', { name: '確認新增' }).click();
  await d.waitFor({ state: 'hidden' });
  await settle(page, 400);
  const call = lastCall('paymentReminderApi', 'batchAddPlans');
  eq(G, '送出：期別、備註、預計日', [call.expectedDate, call.period, call.note, call.userKey, call.projectId], ['2027-03-01', '第 9 期工程款', '', 'mgr1', 'p1']);
  check(G, '送出：不含已存在戶', !call.entries.some(e => e.unitId === 'B4') && call.entries.some(e => e.unitId === 'A1' && e.expectedAmount === 50000), JSON.stringify(call.entries));
  const stored = backend.db.store.get('salesHouseholds/p1_A1').paymentRecords.at(-1);
  eq(G, '後端寫入', { source: stored.planSource, date: stored.date, amount: stored.amount, expectedAmount: stored.expectedAmount, expectedDate: stored.expectedDate }, { source: 'batch', date: '', amount: null, expectedAmount: 50000, expectedDate: '2027-03-01' });
  check(G, '完成提示含略過', (await toasts(page)).some(t => t.type === 'success' && t.message.includes('略過 1 戶')), JSON.stringify(await toasts(page)));
  check(G, '完成後清單更新', (await listTexts(page)).some(r => r[2] === '第 9 期工程款'), '');

  // 重複送出
  await page.getByRole('button', { name: '批次新增' }).click();
  await settle(page, 400);
  eq(G, '重新開啟回到第一步', [await d.locator('.mac-page-count').innerText(), await d.locator('.ppf-select .v-select__selection-text').innerText()], ['1／3', '未指定']);
  await fillOtherPeriod(d, '第 9 期工程款');
  await d.locator('input[type=date]').fill('2027-03-01');
  await settle(page, 80);
  await nextBtn.click();
  await settle(page, 400);
  await d.locator('label.ppb-unit', { hasText: 'A1' }).locator('input').check();
  await nextBtn.click();
  await settle(page, 200);
  eq(G, '重複送出：預覽已存在', await d.locator('.ppb-unit .mac-tag').innerText(), '已存在，略過');
  check(G, '重複送出：確認新增停用', await d.getByRole('button', { name: '確認新增' }).isDisabled(), '');
  await d.getByRole('button', { name: '取消' }).click();
  await settle(page);

  // 不填金額送 null
  await page.getByRole('button', { name: '批次新增' }).click();
  await settle(page, 400);
  await fillOtherPeriod(d, '  第 10 期  ');
  await d.locator('input[type=date]').fill('2027-04-01');
  await settle(page, 80);
  await nextBtn.click();
  await settle(page, 400);
  await d.locator('label.ppb-unit', { hasText: 'A2' }).locator('input').check();
  await nextBtn.click();
  await settle(page, 200);
  await d.getByRole('button', { name: '確認新增' }).click();
  await d.waitFor({ state: 'hidden' });
  const noneCall = lastCall('paymentReminderApi', 'batchAddPlans');
  eq(G, '不填金額：送 null 且期別去空白', [noneCall.period, noneCall.entries], ['第 10 期', [{ unitId: 'A2', expectedAmount: null }]]);

  // 失敗
  backend.failures = { 'paymentReminderApi:batchAddPlans': '已新增 0 戶，1 戶失敗' };
  await settle(page, 300);
  await page.getByRole('button', { name: '批次新增' }).click();
  await settle(page, 400);
  await fillOtherPeriod(d, '失敗期');
  await d.locator('input[type=date]').fill('2027-05-01');
  await settle(page, 80);
  await nextBtn.click();
  await settle(page, 400);
  await d.locator('label.ppb-unit', { hasText: 'A2' }).locator('input').check();
  await nextBtn.click();
  await settle(page, 200);
  await d.getByRole('button', { name: '確認新增' }).click();
  await settle(page, 300);
  check(G, '失敗：顯示錯誤不關閉', (await d.locator('.mac-callout--error').innerText()).includes('新增失敗'), '');
  await close();

  // 部分失敗：真實 handleBatchAddPlans 回 { added, skipped, failed }
  backend.reset();
  const partial = await open({ view: 'list', role: 'manager' });
  await settle(partial.page, 400);
  await goBatch(partial.page, 2, ['A1', 'A2', 'A3']);
  await dialog(partial.page).getByRole('button', { name: '下一步' }).click();
  await settle(partial.page, 200);
  backend.db.txGetHook = (docPath) => { if (docPath.endsWith('p1_A2')) throw new Error('Firestore 交易逾時'); };
  const pd = dialog(partial.page);
  await pd.getByRole('button', { name: '確認新增' }).click();
  await settle(partial.page, 500);
  const partialRows = await pd.locator('.ppb-unit').evaluateAll(l => l.map(x => [x.querySelector('.ppb-unit-id').innerText, x.querySelector('.mac-tag').innerText, x.querySelector('.ppb-unit-reason')?.innerText || '']));
  eq(G, '部分失敗：逐戶結果', partialRows, [['A1', '已新增', ''], ['A2', '失敗', 'Firestore 交易逾時'], ['A3', '已新增', '']]);
  const partialError = await pd.locator('.mac-callout--error').innerText();
  check(G, '部分失敗：錯誤訊息列出成功與失敗', partialError.includes('已新增 2 戶') && partialError.includes('1 戶失敗') && partialError.includes('A2'), partialError);
  check(G, '部分失敗：視窗保留', await partial.page.locator('.ppb').isVisible(), '');
  check(G, '部分失敗：成功的戶別清單已更新', (await listTexts(partial.page)).filter(r => r[2] === '第 9 期工程款' && ['A1', 'A3'].includes(r[1].split(' ')[0])).length === 2, JSON.stringify((await listTexts(partial.page)).map(r => r[1] + r[2])));
  backend.db.txGetHook = null;
  await pd.getByRole('button', { name: '確認新增' }).click();
  await settle(partial.page, 600);
  eq(G, '部分失敗重送：只送失敗的戶別', lastCall('paymentReminderApi', 'batchAddPlans').entries.map(e => e.unitId), ['A2']);
  check(G, '部分失敗重送成功後關閉', !(await partial.page.locator('.ppb').isVisible().catch(() => false)), '');
  const countOf = unitId => backend.db.store.get(`salesHouseholds/p1_${unitId}`).paymentRecords.filter(r => r.period === '第 9 期工程款').length;
  eq(G, '部分失敗重送：每戶只有一筆', [countOf('A1'), countOf('A2'), countOf('A3')], [1, 1, 1]);
  await partial.close();

  // 請求整個失敗
  backend.reset();
  const whole = await open({ view: 'list', role: 'manager' });
  await settle(whole.page, 400);
  await goBatch(whole.page, 2, ['A1']);
  await dialog(whole.page).getByRole('button', { name: '下一步' }).click();
  await settle(whole.page, 200);
  backend.failures = { 'paymentReminderApi:batchAddPlans': { message: '連線逾時', code: 'functions/deadline-exceeded' } };
  await dialog(whole.page).getByRole('button', { name: '確認新增' }).click();
  await settle(whole.page, 400);
  check(G, '整批請求失敗：顯示錯誤、列可重送', (await dialog(whole.page).locator('.mac-callout--error').innerText()).includes('連線逾時') && !(await dialog(whole.page).getByRole('button', { name: '確認新增' }).isDisabled()), '');
  await whole.close();

  // 載入失敗
  backend.reset();
  const lf = await open({ view: 'list', role: 'manager' });
  await settle(lf.page, 400);
  backend.failures = { fetchSalesHouseholdsOnce: '讀取失敗' };
  await lf.page.getByRole('button', { name: '批次新增' }).click();
  await settle(lf.page, 400);
  const ld = dialog(lf.page);
  await fillOtherPeriod(ld, 'x');
  await ld.locator('input[type=date]').fill('2027-05-01');
  await settle(lf.page, 80);
  await ld.getByRole('button', { name: '下一步' }).click();
  await settle(lf.page, 300);
  check(G, '載入戶別失敗畫面與重試', (await ld.locator('.mac-callout--error').innerText()).includes('載入戶別失敗') && (await ld.getByRole('button', { name: '重試' }).count()) === 1, '');
  backend.failures = {};
  await ld.getByRole('button', { name: '重試' }).click();
  await settle(lf.page, 400);
  check(G, '重試後列出戶別', (await ld.locator('label.ppb-unit').count()) > 0, '');
  await lf.close();
});

// ─────────────── T9 帶入合約期款資料 ───────────────
const contractSingle = (key, name, amount) => ({ key, name, percent: 0, type: 'single', amount, children: [] });
const contractGroup = (key, name, children) => ({
  key, name, percent: 0, type: 'group', verticalLabel: name,
  children: children.map(([childKey, childName, amount], index) => ({ key: childKey, seq: index + 1, name: childName, amount })),
});
const contract2100 = () => ({
  installmentManualMode: false,
  manualRowsBase: 2100,
  manualRows: [
    contractSingle('i1', '頭期款', 63),
    contractSingle('i2', '簽約款', 147),
    contractGroup('g1', '工程期款', [['g1a', '開工期款', 139], ['g1b', '結構款', 139], ['g1c', '完工款', 142]]),
    contractSingle('z0', '交屋款', 0),
    contractSingle('n1', '回饋調整', -84),
    contractSingle('i9', '銀行貸款', 1554),
  ],
});

group('T9', async () => {
  const G = 'T9 帶入合約期款資料';
  const setUnit = (unit, patch) => {
    const key = `salesHouseholds/p1_${unit}`;
    backend.db.store.set(key, { ...backend.db.store.get(key), ...patch });
  };
  const records = unit => backend.db.store.get(`salesHouseholds/p1_${unit}`).paymentRecords;
  const openImport = async (unit, total, opts) => {
    const ctx = await open({ view: 'panel', unit, total }, opts);
    await ctx.page.locator('.pr-actions').getByRole('button', { name: '帶入合約期款資料' }).click();
    await settle(ctx.page, 700);
    return { ...ctx, d: dialog(ctx.page) };
  };
  const readRows = d => d.locator('.pti-row').evaluateAll(list => list.map(r => ({
    name: r.querySelector('.pti-name').childNodes[0].textContent.trim(),
    tag: r.querySelector('.mac-tag')?.innerText.trim() || '',
    amount: r.querySelector('.pti-amount').innerText.replace(/\s+/g, ' ').trim(),
    checked: r.querySelector('input[type=checkbox]').checked,
    disabled: r.querySelector('input[type=checkbox]').disabled,
    hasDate: !!r.querySelector('input[type=date]'),
    dateText: r.querySelector('.pti-date-text')?.innerText.trim() || '',
    detail: r.querySelector('.pti-detail')?.innerText.trim() || '',
  })));
  const rowOf = (d, name) => d.locator('.pti-row').filter({ hasText: name });
  const submitBtn = d => d.locator('.mac-sheet-foot .mac-btn--primary');
  const reloadFromContract = async (page) => {
    await page.evaluate(() => { window.__panelState.contractDocOpen = true; });
    await settle(page, 150);
    await page.evaluate(() => { window.__panelState.contractDocOpen = false; });
    await settle(page, 600);
  };
  const keepOnly = async (d, kept) => {
    for (const row of await readRows(d)) {
      if (row.checked && !kept.includes(row.name)) await rowOf(d, row.name).locator('input[type=checkbox]').uncheck();
    }
  };

  // 這戶沒有合約資料：引導去合約製作設定，儲存回來後自動讀取
  backend.reset();
  const none = await openImport('EMPTY', 2100);
  eq(G, '沒有資料：提示尚未設定', (await none.d.locator('.pti-empty-title').innerText()).trim(), '尚未設定合約期款');
  eq(G, '沒有資料：沒有範本選單', await none.d.locator('.v-select').count(), 0);
  eq(G, '沒有資料：沒有帶入按鈕', await submitBtn(none.d).count(), 0);
  eq(G, '沒有資料：標題為帶入合約期款資料', (await none.d.locator('.mac-sheet-head').innerText()).trim(), '帶入合約期款資料');
  await evidence(none.page, 'contract-import-empty');
  await none.d.getByRole('button', { name: '開啟合約製作設定' }).click();
  await settle(none.page, 150);
  eq(G, '沒有資料：按鈕開啟合約製作設定', await none.page.evaluate(() => window.__panelEvents), ['open-contract-doc']);
  check(G, '開啟合約製作設定：帶入視窗留著', await none.page.locator('.pti').isVisible(), '');
  setUnit('EMPTY', { contractDocData: contract2100() });
  await reloadFromContract(none.page);
  eq(G, '合約製作設定關閉後自動讀取', (await readRows(none.d)).length, 6);
  await none.close();

  // 一般流程
  backend.reset();
  setUnit('EMPTY', { contractDocData: contract2100() });
  const { page, d, close } = await openImport('EMPTY', 2100);
  const list = await readRows(d);
  eq(G, '金額來自合約（萬換算成元、列子項）', list.map(r => [r.name, r.amount]), [
    ['頭期款', '630,000 元'], ['簽約款', '1,470,000 元'], ['開工期款', '1,390,000 元'], ['結構款', '1,390,000 元'], ['完工款', '1,420,000 元'], ['銀行貸款', '15,540,000 元'],
  ]);
  check(G, '0 與負數不帶入', !list.some(r => ['交屋款', '回饋調整'].includes(r.name)), list.map(r => r.name).join(','));
  check(G, '略過提示', (await d.locator('.pti-skip').innerText()).includes('2 期'), await d.locator('.pti-skip').innerText().catch(() => ''));
  check(G, '分組標題', (await d.locator('.pti-group-head').allInnerTexts()).includes('工程期款'), '');
  eq(G, '區塊合計', (await d.locator('.pti-section-head').innerText()).replace(/\s+/g, ' '), '期款 合計 2,100 萬');
  eq(G, '新期別預設勾選', list.every(r => r.checked && !r.disabled && r.hasDate), true);
  eq(G, '合計相符時沒有警示', await d.locator('.mac-callout--warning').count(), 0);
  eq(G, '金額不能在視窗內修改', await d.locator('.pti-amount input').count(), 0);
  eq(G, '沒有範本選單', await d.locator('.v-select').count(), 0);
  check(G, '有修改期款按鈕', await d.getByRole('button', { name: '修改期款' }).isVisible(), '');
  check(G, '未填預計日也可帶入', !(await submitBtn(d).isDisabled()), '');
  eq(G, '提示未填筆數與不會提醒', (await d.locator('.pti-missing').innerText()).trim(), '6 筆未填預計日，不會提醒');
  await rowOf(d, '頭期款').locator('input[type=date]').fill(addDays(10));
  await rowOf(d, '開工期款').locator('input[type=date]').fill(addDays(20));
  await keepOnly(d, ['頭期款', '開工期款']);
  await settle(page, 100);
  check(G, '取消勾選時停用日期欄', await rowOf(d, '銀行貸款').locator('input[type=date]').isDisabled(), '');
  await page.mouse.click(1420, 880);
  await settle(page, 300);
  check(G, '點外面不關閉、日期保留', await page.locator('.pti').isVisible() && (await rowOf(d, '頭期款').locator('input[type=date]').inputValue()) === addDays(10), '點對話框外面後視窗關閉或日期遺失');
  eq(G, '按鈕顯示筆數', (await submitBtn(d).innerText()).trim(), '帶入 2 筆');
  await submitBtn(d).click();
  await d.waitFor({ state: 'hidden' });
  await settle(page, 300);
  const adds = calls('paymentProofApi', 'addRecord').map(c => c.payload);
  eq(G, '寫入參數（期別、來源為合約）', adds.map(a => ({ date: a.date, amount: a.amount, period: a.period, note: a.note, expectedDate: a.expectedDate, expectedAmount: a.expectedAmount, planSource: a.planSource })), [
    { date: '', amount: null, period: '頭期款', note: '', expectedDate: addDays(10), expectedAmount: 630000, planSource: 'contract' },
    { date: '', amount: null, period: '開工期款', note: '', expectedDate: addDays(20), expectedAmount: 1390000, planSource: 'contract' },
  ]);
  eq(G, '後端接受合約來源', records('EMPTY').map(r => r.planSource), ['contract', 'contract']);
  check(G, '帶入後出現在預計區', await plannedRow(page, '頭期款').count() === 1 && await plannedRow(page, '開工期款').count() === 1, '');
  check(G, '帶入成功提示', (await toasts(page)).some(t => t.message.includes('已新增 2 筆預計繳款')), JSON.stringify(await toasts(page)));
  eq(G, '成功才 emit plans-saved', await page.evaluate(() => window.__panelEvents), ['plans-saved']);

  // 再開一次：已帶入的不能重複
  await page.locator('.pr-actions').getByRole('button', { name: '帶入合約期款資料' }).click();
  await settle(page, 700);
  const again = await readRows(dialog(page));
  const deposit = again.find(r => r.name === '頭期款');
  eq(G, '重開：已帶入不可勾選、顯示原預計日', [deposit.tag, deposit.checked, deposit.disabled, deposit.hasDate, deposit.dateText], ['已帶入', false, true, false, `預計 ${addDays(10)}`]);
  eq(G, '重開：其他期別仍是新期別', again.filter(r => !['頭期款', '開工期款'].includes(r.name)).every(r => r.checked && r.hasDate), true);

  // 到合約製作設定改金額：重新讀取，已填日期保留，金額不同預設不勾
  const d2 = dialog(page);
  await rowOf(d2, '銀行貸款').locator('input[type=date]').fill(addDays(40));
  await d2.getByRole('button', { name: '修改期款' }).click();
  await settle(page, 150);
  eq(G, '修改期款開啟合約製作設定', (await page.evaluate(() => window.__panelEvents)).at(-1), 'open-contract-doc');
  const edited = contract2100();
  edited.manualRows[0].amount = 80;
  setUnit('EMPTY', { contractDocData: edited });
  await reloadFromContract(page);
  const afterEdit = await readRows(d2);
  const changed = afterEdit.find(r => r.name === '頭期款');
  eq(G, '金額不同：標示差異、預設不勾、可勾選', [changed.tag, changed.amount, changed.checked, changed.disabled, changed.dateText], ['金額不同', '630,000 800,000 元', false, false, `預計 ${addDays(10)}`]);
  eq(G, '重新讀取保留已填預計日', await rowOf(d2, '銀行貸款').locator('input[type=date]').inputValue(), addDays(40));
  check(G, '合計不符：顯示警示', (await d2.locator('.mac-callout--warning').innerText()).includes('期款合計 2,117 萬，目前成交總價 2,100 萬'), await d2.locator('.mac-callout--warning').innerText());
  await rowOf(d2, '頭期款').locator('input[type=checkbox]').check();
  await keepOnly(d2, ['頭期款', '銀行貸款']);
  await settle(page, 100);
  eq(G, '同時有新增與更新：按鈕分開顯示', (await submitBtn(d2).innerText()).trim(), '帶入 1 筆、更新 1 筆');
  await rowOf(d2, '銀行貸款').locator('input[type=checkbox]').uncheck();
  await settle(page, 100);
  eq(G, '只有更新：按鈕顯示更新筆數', (await submitBtn(d2).innerText()).trim(), '更新 1 筆');
  const beforeUpdate = records('EMPTY').find(r => r.period === '頭期款');
  await submitBtn(d2).click();
  await d2.waitFor({ state: 'hidden' });
  await settle(page, 300);
  const update = calls('paymentProofApi', 'updateRecord').at(-1).payload;
  eq(G, '更新只改預計金額', { recordId: update.recordId, date: update.date, amount: update.amount, note: update.note, expectedDate: update.expectedDate, expectedAmount: update.expectedAmount, hasSource: 'planSource' in update, hasPeriod: 'period' in update }, { recordId: beforeUpdate.id, date: '', amount: null, note: '', expectedDate: addDays(10), expectedAmount: 800000, hasSource: false, hasPeriod: false });
  const afterUpdate = records('EMPTY').find(r => r.period === '頭期款');
  eq(G, '更新後：金額新、期別、預計日與來源不變', [afterUpdate.expectedAmount, afterUpdate.period, afterUpdate.expectedDate, afterUpdate.planSource], [800000, '頭期款', addDays(10), 'contract']);
  eq(G, '更新不新增紀錄', records('EMPTY').length, 2);
  check(G, '更新成功提示', (await toasts(page)).some(t => t.message.includes('已更新 1 筆預計繳款')), JSON.stringify(await toasts(page)));
  await close();

  // 既有紀錄的各種狀態
  backend.reset();
  const paidAt = addDays(-10);
  setUnit('EMPTY', {
    contractDocData: { manualRows: [
      contractSingle('a', '簽約款', 150), contractSingle('b', '銀行貸款', 1000), contractSingle('c', '舊尾款', 100), contractSingle('d', '未填金額期', 10), contractSingle('e', '新期別', 840),
    ] },
    paymentRecords: [
      { id: 'paid1', date: paidAt, amount: 1500000, note: '簽約款', expectedDate: addDays(-13), expectedAmount: 1500000, planSource: 'manual', file: null },
      plan('split1', 30, 5000000, '銀行貸款'),
      plan('split2', 60, 5000000, '銀行貸款'),
      { id: 'legacy', date: '', amount: null, note: '舊尾款', file: null },
      plan('noamount', 5, null, '未填金額期'),
    ],
  });
  const mix = await openImport('EMPTY', 2100);
  const mixed = await readRows(mix.d);
  const pick = name => mixed.find(r => r.name === name);
  eq(G, '已繳清：不可勾選、顯示已繳金額', [pick('簽約款').tag, pick('簽約款').disabled, pick('簽約款').detail, pick('簽約款').hasDate], ['已繳清', true, '已繳 1,500,000 元', false]);
  eq(G, '同名多筆：顯示筆數、不可勾選', [pick('銀行貸款').tag, pick('銀行貸款').disabled, pick('銀行貸款').hasDate], ['已有 2 筆', true, false]);
  eq(G, '無法判斷的舊資料：不可勾選', [pick('舊尾款').tag, pick('舊尾款').disabled], ['已有', true]);
  eq(G, '未填預計金額：顯示未填、可更新', [pick('未填金額期').tag, pick('未填金額期').amount, pick('未填金額期').disabled], ['金額不同', '未填 100,000 元', false]);
  eq(G, '沒有同名：可帶入', [pick('新期別').tag, pick('新期別').checked, pick('新期別').hasDate], ['', true, true]);
  await evidence(mix.page, 'contract-import-statuses');
  await rowOf(mix.d, '未填金額期').locator('input[type=checkbox]').check();
  await rowOf(mix.d, '新期別').locator('input[type=date]').fill(addDays(90));
  await settle(mix.page, 100);
  await submitBtn(mix.d).click();
  await mix.d.waitFor({ state: 'hidden' });
  await settle(mix.page, 300);
  const afterMix = records('EMPTY');
  eq(G, '已繳與多筆都沒有被改', [afterMix.find(r => r.id === 'paid1').amount, afterMix.find(r => r.id === 'split1').expectedAmount, afterMix.find(r => r.id === 'split2').expectedAmount], [1500000, 5000000, 5000000]);
  eq(G, '混合送出：新增與更新各一筆', [calls('paymentProofApi', 'addRecord').length, calls('paymentProofApi', 'updateRecord').length, afterMix.find(r => r.id === 'noamount').expectedAmount], [1, 1, 100000]);
  check(G, '混合送出提示', (await toasts(mix.page)).some(t => t.message.includes('已新增 1 筆、更新 1 筆預計繳款')), JSON.stringify(await toasts(mix.page)));
  await mix.close();

  // 合約總價對不上：警告但可帶入
  backend.reset();
  setUnit('EMPTY', { contractDocData: contract2100() });
  const stale = await openImport('EMPTY', 2000);
  check(G, '總價不符：顯示合約與目前總價', (await stale.d.locator('.mac-callout--warning').innerText()).includes('期款合計 2,100 萬，目前成交總價 2,000 萬'), await stale.d.locator('.mac-callout--warning').innerText());
  await rowOf(stale.d, '頭期款').locator('input[type=date]').fill(addDays(10));
  await keepOnly(stale.d, ['頭期款']);
  await settle(stale.page, 100);
  check(G, '總價不符：仍可帶入', !(await submitBtn(stale.d).isDisabled()), '');
  await submitBtn(stale.d).click();
  await stale.d.waitFor({ state: 'hidden' });
  eq(G, '總價不符：照合約金額帶入', calls('paymentProofApi', 'addRecord').at(-1).payload.expectedAmount, 630000);
  await stale.close();

  // 配套戶：期款與裝修期款都列出，同名時備註加前綴
  backend.reset();
  const packageContract = { manualRows: [contractSingle('m1', '訂金', 900), contractSingle('m2', '尾款', 900)], decorationManualRows: [contractSingle('d1', '訂金', 40), contractSingle('d2', '裝修尾款', 160)] };
  setUnit('P1', { contractDocData: packageContract });
  const pkg = await openImport('P1', 2000);
  eq(G, '配套戶：兩區合計', (await pkg.d.locator('.pti-section-head').allInnerTexts()).map(x => x.replace(/\s+/g, ' ')), ['期款 合計 1,800 萬', '裝修期款 合計 200 萬']);
  eq(G, '配套戶：合計相符沒有警示', await pkg.d.locator('.mac-callout--warning').count(), 0);
  await evidence(pkg.page, 'contract-import-package');
  const pkgDates = pkg.d.locator('.pti-row input[type=date]');
  for (let i = 0; i < await pkgDates.count(); i += 1) await pkgDates.nth(i).fill(addDays(30 + i));
  await settle(pkg.page, 100);
  await submitBtn(pkg.d).click();
  await pkg.d.waitFor({ state: 'hidden' });
  await settle(pkg.page, 300);
  eq(G, '配套戶：同名期別不衝突', calls('paymentProofApi', 'addRecord').map(c => [c.payload.period, c.payload.expectedAmount]), [['訂金', 9000000], ['尾款', 9000000], ['裝修－訂金', 400000], ['裝修尾款', 1600000]]);
  await pkg.page.locator('.pr-actions').getByRole('button', { name: '帶入合約期款資料' }).click();
  await settle(pkg.page, 700);
  eq(G, '配套戶：重開時同名期別各自比對到自己', (await readRows(dialog(pkg.page))).map(r => r.tag), ['已帶入', '已帶入', '已帶入', '已帶入']);
  await pkg.close();

  backend.reset();
  setUnit('P1', { contractDocData: { manualRows: packageContract.manualRows } });
  const pkgMissing = await openImport('P1', 2000);
  eq(G, '配套戶沒有裝修期款：提示尚未設定', (await pkgMissing.d.locator('.mac-callout--warning').innerText()).trim(), '裝修期款尚未設定');
  await pkgMissing.close();

  backend.reset();
  setUnit('EMPTY', { contractDocData: { manualRows: [contractSingle('m1', '訂金', 2100)], decorationManualRows: [contractSingle('d1', '裝修款', 40)] } });
  const notPkg = await openImport('EMPTY', 2100);
  eq(G, '一般戶不讀裝修期款', (await readRows(notPkg.d)).map(r => r.name), ['訂金']);
  await notPkg.close();

  // 無成交總價：有合約資料仍列出並警告
  backend.reset();
  setUnit('ZERO', { contractDocData: { manualRows: [contractSingle('m1', '訂金', 100)] } });
  const zero = await openImport('ZERO', 0);
  check(G, '無成交總價：警示且可讀取', (await zero.d.locator('.mac-callout--warning').innerText()).includes('目前成交總價 0 萬') && (await readRows(zero.d)).length === 1, await zero.d.locator('.mac-callout--warning').innerText());
  await zero.close();

  // 全部期別都是 0
  backend.reset();
  setUnit('EMPTY', { contractDocData: { manualRows: [contractSingle('m1', '訂金', 0)] } });
  const allZero = await openImport('EMPTY', 0);
  eq(G, '全部 0：提示沒有可帶入的期別、沒有帶入按鈕', [(await allZero.d.locator('.mac-list-empty').innerText()).trim(), await submitBtn(allZero.d).count()], ['沒有可帶入的期別', 0]);
  await allZero.close();

  // 讀取失敗可重試
  backend.reset({ failures: { fetchContractDocData: '讀取失敗' } });
  const lf = await openImport('EMPTY', 2100);
  check(G, '讀取失敗：顯示錯誤', (await lf.d.locator('.mac-callout--error').innerText()).includes('載入合約期款失敗'), '');
  eq(G, '讀取失敗：不會誤判成尚未設定', await lf.d.locator('.pti-empty-title').count(), 0);
  backend.failures = {};
  await lf.d.getByRole('button', { name: '重試' }).click();
  await settle(lf.page, 500);
  eq(G, '重試成功', (await lf.d.locator('.pti-empty-title').innerText()).trim(), '尚未設定合約期款');
  await lf.close();

  // 中途失敗：已完成筆數不重複
  backend.reset();
  setUnit('EMPTY', { contractDocData: contract2100() });
  const mf = await openImport('EMPTY', 2100);
  await rowOf(mf.d, '頭期款').locator('input[type=date]').fill(addDays(10));
  await rowOf(mf.d, '開工期款').locator('input[type=date]').fill(addDays(10));
  await keepOnly(mf.d, ['頭期款', '開工期款']);
  await settle(mf.page, 100);
  const realDispatch = backend.dispatch;
  let addAttempts = 0;
  backend.dispatch = async (fn, payload) => {
    if (fn === 'paymentProofApi' && payload?.action === 'addRecord') {
      addAttempts += 1;
      if (addAttempts === 2) return { status: 'error', message: '第二筆失敗' };
    }
    return realDispatch(fn, payload);
  };
  await submitBtn(mf.d).click();
  await settle(mf.page, 400);
  backend.dispatch = realDispatch;
  const partialText = await mf.d.locator('.mac-callout--error').innerText();
  check(G, '中途失敗：顯示完成筆數與錯誤', partialText.includes('已完成 1 筆') && partialText.includes('第二筆失敗'), partialText);
  eq(G, '中途失敗：至少成功一筆就 emit plans-saved', await mf.page.evaluate(() => window.__panelEvents), ['plans-saved']);
  const doneRow = (await readRows(mf.d)).find(r => r.name === '頭期款');
  eq(G, '中途失敗：成功列變已帶入、不可再勾', [doneRow.tag, doneRow.checked, doneRow.disabled], ['已帶入', false, true]);
  eq(G, '中途失敗：按鈕只算未成功的筆數', (await submitBtn(mf.d).innerText()).trim(), '帶入 1 筆');
  await evidence(mf.page, 'contract-import-partial-failure');
  await submitBtn(mf.d).click();
  await settle(mf.page, 400);
  eq(G, '中途失敗：重送不重複', records('EMPTY').map(r => r.period), ['頭期款', '開工期款']);
  eq(G, '中途失敗重送：只再送一筆', calls('paymentProofApi', 'addRecord').at(-1).payload.period, '開工期款');
  check(G, '中途失敗重送成功後關閉', !(await mf.page.locator('.pti').isVisible().catch(() => false)), '');
  await mf.close();

  // 第一筆就失敗
  backend.reset({ failures: { 'paymentProofApi:addRecord': '全部失敗' } });
  setUnit('EMPTY', { contractDocData: contract2100() });
  const af = await openImport('EMPTY', 2100);
  await rowOf(af.d, '頭期款').locator('input[type=date]').fill(addDays(10));
  await keepOnly(af.d, ['頭期款']);
  await settle(af.page, 100);
  await submitBtn(af.d).click();
  await settle(af.page, 300);
  eq(G, '全部失敗：不 emit plans-saved', await af.page.evaluate(() => window.__panelEvents), []);
  check(G, '全部失敗：訊息為帶入失敗，列仍勾選', (await af.d.locator('.mac-callout--error').innerText()).includes('帶入失敗') && await rowOf(af.d, '頭期款').locator('input[type=checkbox]').isChecked(), '');
  await af.close();

  // 更新失敗
  backend.reset({ failures: { 'paymentProofApi:updateRecord': '更新失敗' } });
  setUnit('EMPTY', { contractDocData: { manualRows: [contractSingle('m1', '訂金', 100)] }, paymentRecords: [plan('dep', 10, 500000, '訂金')] });
  const uf = await openImport('EMPTY', 100);
  await rowOf(uf.d, '訂金').locator('input[type=checkbox]').check();
  await settle(uf.page, 100);
  await submitBtn(uf.d).click();
  await settle(uf.page, 300);
  eq(G, '更新失敗：顯示錯誤、金額沒有變', [(await uf.d.locator('.mac-callout--error').innerText()).includes('更新失敗'), records('EMPTY')[0].expectedAmount], [true, 500000]);
  await uf.close();

  // 下訂先繳、簽約才帶入：預選對應，已繳滿不產生預計
  const depositContract = () => ({ manualRows: [contractSingle('a', '訂金', 10), contractSingle('b', '簽約金', 100), contractSingle('c', '開工款', 220), contractSingle('d', '尾款', 1770)] });
  const paidRecord = (id, days, amount, note, extra = {}) => ({ id, date: addDays(days), amount, note, file: null, createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z', ...extra });
  const assignRows = d => d.locator('.pti-assign-row').evaluateAll(list => list.map(r => ({
    note: r.querySelector('.pti-assign-note').innerText.trim(),
    amount: r.querySelector('.pti-amount').innerText.trim(),
    choice: r.querySelector('.v-select__selection-text')?.innerText.trim() || '',
  })));
  const chooseAssign = async (d, note, name) => {
    await d.locator('.pti-assign-row').filter({ hasText: note }).locator('.v-field').click();
    await settle(d.page(), 250);
    await d.page().locator('.v-menu.v-overlay--active .v-list-item').filter({ hasText: new RegExp(`^\\s*${name}\\s*$`) }).first().click();
    await settle(d.page(), 200);
  };
  backend.reset();
  setUnit('EMPTY', { contractDocData: depositContract(), paymentRecords: [paidRecord('small', -20, 20000, '小訂', { file: { fileId: 'proofImg', fileName: 'a.jpg' } }), paidRecord('top', -10, 80000, '補足')] });
  const flow = await openImport('EMPTY', 2100);
  eq(G, '下訂已繳：列出尚未對應並預選訂金', await assignRows(flow.d), [{ note: '小訂', amount: '20,000 元', choice: '訂金' }, { note: '補足', amount: '80,000 元', choice: '訂金' }]);
  check(G, '下訂已繳：區塊顯示合計', (await flow.d.locator('.pti-assign .pti-section-head').innerText()).includes('100,000 元'), await flow.d.locator('.pti-assign .pti-section-head').innerText());
  const flowRows = await readRows(flow.d);
  const flowDeposit = flowRows.find(r => r.name === '訂金');
  eq(G, '下訂已繳：訂金已繳清、不產生預計', [flowDeposit.tag, flowDeposit.disabled, flowDeposit.hasDate, flowDeposit.detail], ['已繳清', true, false, '已繳 100,000 元']);
  eq(G, '下訂已繳：其他期別帶全額', flowRows.filter(r => r.name !== '訂金').map(r => [r.name, r.amount, r.checked]), [['簽約金', '1,000,000 元', true], ['開工款', '2,200,000 元', true], ['尾款', '17,700,000 元', true]]);
  eq(G, '下訂已繳：按鈕分開顯示對應與帶入', (await submitBtn(flow.d).innerText()).trim(), '對應 2 筆、帶入 3 筆');
  await evidence(flow.page, 'contract-import-assign');
  await rowOf(flow.d, '簽約金').locator('input[type=date]').fill(addDays(30));
  await keepOnly(flow.d, ['簽約金']);
  await settle(flow.page, 100);
  await submitBtn(flow.d).click();
  await flow.d.waitFor({ state: 'hidden' });
  await settle(flow.page, 300);
  const assignCalls = calls('paymentProofApi', 'updateRecord').map(c => c.payload);
  eq(G, '下訂已繳：只標期別，日期金額備註不變', assignCalls.map(c => ({ recordId: c.recordId, date: c.date, amount: c.amount, note: c.note, period: c.period, removeFile: c.removeFile, base64: c.base64 })), [
    { recordId: 'small', date: addDays(-20), amount: 20000, note: '小訂', period: '訂金', removeFile: false, base64: null },
    { recordId: 'top', date: addDays(-10), amount: 80000, note: '補足', period: '訂金', removeFile: false, base64: null },
  ]);
  eq(G, '下訂已繳：先對應再帶入', backend.calls.filter(c => c.fn === 'paymentProofApi').map(c => c.action), ['updateRecord', 'updateRecord', 'addRecord']);
  const flowStored = records('EMPTY');
  eq(G, '下訂已繳：紀錄不合併、憑證保留', [flowStored.length, flowStored.find(r => r.id === 'small').file?.fileId, flowStored.filter(r => r.period === '訂金').length], [3, 'proofImg', 2]);
  eq(G, '下訂已繳：簽約金新增一筆預計', [flowStored.at(-1).period, flowStored.at(-1).expectedAmount, flowStored.at(-1).note], ['簽約金', 1000000, '']);
  check(G, '下訂已繳：提示筆數', (await toasts(flow.page)).some(t => t.message.includes('已對應 2 筆已繳款、新增 1 筆預計繳款')), JSON.stringify(await toasts(flow.page)));
  await flow.page.locator('.pr-actions').getByRole('button', { name: '帶入合約期款資料' }).click();
  await settle(flow.page, 700);
  eq(G, '下訂已繳：重開後不再列為未對應', await dialog(flow.page).locator('.pti-assign-row').count(), 0);
  eq(G, '下訂已繳：重開後訂金仍已繳清、簽約金已帶入', (await readRows(dialog(flow.page))).slice(0, 2).map(r => r.tag), ['已繳清', '已帶入']);
  await flow.close();

  // 只繳部分：帶差額，備註填差額
  backend.reset();
  setUnit('EMPTY', { contractDocData: depositContract(), paymentRecords: [paidRecord('small', -20, 20000, '小訂')] });
  const part = await openImport('EMPTY', 2100);
  const partRow = (await readRows(part.d)).find(r => r.name === '訂金');
  eq(G, '只繳部分：帶差額並顯示合約與已繳', [partRow.tag, partRow.amount, partRow.detail, partRow.checked, partRow.hasDate], ['差額', '80,000 元', '合約 100,000，已繳 20,000 元', true, true]);
  await rowOf(part.d, '訂金').locator('input[type=date]').fill(addDays(5));
  await keepOnly(part.d, ['訂金']);
  await settle(part.page, 100);
  await submitBtn(part.d).click();
  await part.d.waitFor({ state: 'hidden' });
  await settle(part.page, 300);
  const partAdd = calls('paymentProofApi', 'addRecord').at(-1).payload;
  eq(G, '只繳部分：預計金額為差額、備註差額', [partAdd.period, partAdd.note, partAdd.expectedAmount, partAdd.planSource], ['訂金', '差額', 80000, 'contract']);
  await part.close();

  // 改成不對應：恢復全額；只有對應沒有帶入也能送出
  backend.reset();
  setUnit('EMPTY', { contractDocData: depositContract(), paymentRecords: [paidRecord('small', -20, 100000, '小訂')] });
  const unassign = await openImport('EMPTY', 2100);
  await chooseAssign(unassign.d, '小訂', '不對應');
  const afterUnassign = (await readRows(unassign.d)).find(r => r.name === '訂金');
  eq(G, '選不對應：訂金恢復全額且預設勾選', [afterUnassign.tag, afterUnassign.amount, afterUnassign.checked], ['', '100,000 元', true]);
  check(G, '選不對應：按鈕不含對應', !(await submitBtn(unassign.d).innerText()).includes('對應'), await submitBtn(unassign.d).innerText());
  await chooseAssign(unassign.d, '小訂', '簽約金');
  eq(G, '手動改對應：簽約金算差額', (await readRows(unassign.d)).find(r => r.name === '簽約金').amount, '900,000 元');
  await keepOnly(unassign.d, []);
  await settle(unassign.page, 100);
  eq(G, '只有對應：按鈕只顯示對應', (await submitBtn(unassign.d).innerText()).trim(), '對應 1 筆');
  await submitBtn(unassign.d).click();
  await unassign.d.waitFor({ state: 'hidden' });
  await settle(unassign.page, 300);
  eq(G, '只有對應：只標期別', [calls('paymentProofApi', 'updateRecord').at(-1).payload.period, calls('paymentProofApi', 'addRecord').length], ['簽約金', 0]);
  check(G, '只有對應：提示', (await toasts(unassign.page)).some(t => t.message.includes('已對應 1 筆已繳款')), JSON.stringify(await toasts(unassign.page)));
  await unassign.close();

  // 比對不到：不預選
  backend.reset();
  setUnit('EMPTY', { contractDocData: depositContract(), paymentRecords: [paidRecord('other', -5, 5000, '代收款'), paidRecord('blank', -6, 3000, '')] });
  const noGuess = await openImport('EMPTY', 2100);
  eq(G, '比對不到：不預選；沒有備註也列出', await assignRows(noGuess.d), [{ note: '代收款', amount: '5,000 元', choice: '不對應' }, { note: '未填備註', amount: '3,000 元', choice: '不對應' }]);
  await noGuess.close();

  // 溢繳：自動沖抵其他未繳期別
  backend.reset();
  setUnit('EMPTY', { contractDocData: depositContract(), paymentRecords: [paidRecord('sign', -5, 1300000, '簽約', { period: '簽約金' })] });
  const over = await openImport('EMPTY', 2100);
  const overRows = await readRows(over.d);
  const overBy = name => overRows.find(r => r.name === name);
  eq(G, '溢繳：來源期別顯示超過', [overBy('簽約金').tag, overBy('簽約金').detail, overBy('簽約金').disabled], ['已繳清', '已繳 1,300,000，超過 300,000 元', true]);
  eq(G, '溢繳：沖抵其他未繳期別', [overBy('訂金').tag, overBy('訂金').detail, overBy('訂金').disabled], ['已繳清', '由溢繳沖抵 100,000 元', true]);
  eq(G, '溢繳：不足一期時帶差額', [overBy('開工款').tag, overBy('開工款').amount, overBy('開工款').detail], ['差額', '2,000,000 元', '合約 2,200,000，由溢繳沖抵 200,000 元']);
  eq(G, '溢繳：之後的期別不受影響', [overBy('尾款').tag, overBy('尾款').amount], ['', '17,700,000 元']);
  eq(G, '溢繳全部抵完：沒有超過警示', await over.d.locator('.mac-callout--warning').count(), 0);
  await evidence(over.page, 'contract-import-offset');
  await over.close();

  // 沖抵完還有剩：警示
  backend.reset();
  setUnit('EMPTY', { contractDocData: { manualRows: [contractSingle('a', '訂金', 10), contractSingle('b', '尾款', 10)] }, paymentRecords: [paidRecord('all', -5, 250000, '', { period: '訂金' })] });
  const leftover = await openImport('EMPTY', 20);
  check(G, '沖抵完還有剩：顯示超過金額', (await leftover.d.locator('.mac-callout--warning').innerText()).includes('期款已繳超過合約 50,000 元'), await leftover.d.locator('.mac-callout--warning').innerText());
  eq(G, '全部已繳清：帶入按鈕不可按', await submitBtn(leftover.d).isDisabled(), true);
  await leftover.close();

  // 已繳清但還有預計：不刪除，標示
  backend.reset();
  setUnit('EMPTY', { contractDocData: depositContract(), paymentRecords: [paidRecord('dep', -5, 100000, '', { period: '訂金' }), plan('extra', 5, 50000, '', { period: '訂金' })] });
  const extra = await openImport('EMPTY', 2100);
  const extraRow = (await readRows(extra.d)).find(r => r.name === '訂金');
  eq(G, '已繳清另有預計：標示金額、不可勾選', [extraRow.tag, extraRow.detail, extraRow.disabled], ['已繳清', '已繳 100,000，另有預計 50,000 元', true]);
  await extra.close();

  // 對應失敗：不寫入預計
  backend.reset({ failures: { 'paymentProofApi:updateRecord': '對應失敗' } });
  setUnit('EMPTY', { contractDocData: depositContract(), paymentRecords: [paidRecord('small', -20, 20000, '小訂')] });
  const assignFail = await openImport('EMPTY', 2100);
  await rowOf(assignFail.d, '訂金').locator('input[type=date]').fill(addDays(5));
  await keepOnly(assignFail.d, ['訂金']);
  await settle(assignFail.page, 100);
  await submitBtn(assignFail.d).click();
  await settle(assignFail.page, 300);
  eq(G, '對應失敗：顯示錯誤、不新增預計', [(await assignFail.d.locator('.pti-save-error').innerText()).includes('對應失敗'), calls('paymentProofApi', 'addRecord').length], [true, 0]);
  await assignFail.close();

  // 手機版：文字不截斷、沒有水平捲動
  backend.reset();
  setUnit('EMPTY', {
    contractDocData: { manualRows: [contractSingle('a', '第 12 期工程款（含地下室結構體完成第三次追加變更設計款項）', 1000), contractSingle('b', '簽約款', 1100)] },
    paymentRecords: [plan('long', 5, 123456789, '第 12 期工程款（含地下室結構體完成第三次追加變更設計款項）'), plan('new1', 5, 100000, '其他')],
  });
  const mobile = await openImport('EMPTY', 2000, { width: 390 });
  await rowOf(mobile.d, '第 12 期').locator('input[type=checkbox]').check();
  await settle(mobile.page, 150);
  await evidence(mobile.page, 'contract-import-mobile');
  const overflow = await mobile.page.evaluate(() => {
    const over = el => el.scrollWidth - el.clientWidth;
    return { page: over(document.documentElement), card: over(document.querySelector('.pti')), foot: over(document.querySelector('.pti .mac-sheet-foot')), rows: [...document.querySelectorAll('.pti-row')].map(over) };
  });
  check(G, '手機：沒有水平溢出', overflow.page <= 0 && overflow.card <= 0 && overflow.foot <= 0 && overflow.rows.every(x => x <= 0), JSON.stringify(overflow));
  const buttonFits = await mobile.page.evaluate(() => {
    const dialog = document.querySelector('.pti').getBoundingClientRect();
    return [...document.querySelectorAll('.pti .mac-sheet-foot button')].every((btn) => { const r = btn.getBoundingClientRect(); return r.left >= dialog.left - 1 && r.right <= dialog.right + 1; });
  });
  eq(G, '手機：底部按鈕都在視窗內', buttonFits, true);
  await clickDialogButton(mobile.page, '取消');
  await settle(mobile.page);
  const actionsFit = await mobile.page.evaluate(() => {
    const box = document.querySelector('.pr-actions');
    return box.scrollWidth <= box.clientWidth && document.documentElement.scrollWidth <= window.innerWidth;
  });
  eq(G, '手機：面板按鈕列沒有溢出', actionsFit, true);
  await evidence(mobile.page, 'contract-import-mobile-panel');
  await mobile.close();

  // 360px（常見 Android 寬度）：勾選框跟名稱同一行、底部不溢出
  backend.reset();
  setUnit('EMPTY', {
    contractDocData: { manualRows: [contractSingle('a', '第 12 期工程款（含地下室結構體完成第三次追加變更設計款項）', 1000), contractSingle('b', '簽約款', 1100)] },
    paymentRecords: [plan('long', 5, 123456789, '第 12 期工程款（含地下室結構體完成第三次追加變更設計款項）')],
  });
  const narrow = await openImport('EMPTY', 2000, { width: 360 });
  await rowOf(narrow.d, '第 12 期').locator('input[type=checkbox]').check();
  await settle(narrow.page, 150);
  await evidence(narrow.page, 'contract-import-360');
  const narrowLayout = await narrow.page.evaluate(() => {
    const longRow = document.querySelector('.pti-row');
    const check = longRow.querySelector('input[type=checkbox]').getBoundingClientRect();
    const name = longRow.querySelector('.pti-name').getBoundingClientRect();
    const dialogBox = document.querySelector('.pti').getBoundingClientRect();
    const over = el => el.scrollWidth - el.clientWidth;
    return {
      sameLine: name.top < check.bottom && name.left >= check.right,
      overflow: [over(document.documentElement), over(document.querySelector('.pti')), over(document.querySelector('.pti .mac-sheet-foot'))].every(x => x <= 0),
      buttons: [...document.querySelectorAll('.pti .mac-sheet-foot button')].every((btn) => { const r = btn.getBoundingClientRect(); return r.left >= dialogBox.left - 1 && r.right <= dialogBox.right + 1; }),
      buttonsSameRow: new Set([...document.querySelectorAll('.pti .mac-sheet-foot button')].map(btn => Math.round(btn.getBoundingClientRect().top))).size === 1,
    };
  });
  eq(G, '360px：勾選框與名稱同行、沒有溢出、按鈕同一行', narrowLayout, { sameLine: true, overflow: true, buttons: true, buttonsSameRow: true });
  await clickDialogButton(narrow.page, '取消');
  await settle(narrow.page);
  const narrowActions = await narrow.page.evaluate(() => {
    const box = document.querySelector('.pr-actions');
    return box.scrollWidth <= box.clientWidth && document.documentElement.scrollWidth <= window.innerWidth;
  });
  eq(G, '360px：面板按鈕列沒有溢出', narrowActions, true);
  await evidence(narrow.page, 'contract-import-360-panel');
  await narrow.close();

  // 真實戶別視窗與合約製作設定：沒有資料 → 開設定 → 儲存 → 回來帶入
  backend.reset({ templates: templateFixtures().map(t => ({ ...t, maxPrice: t.maxPrice || 999999 })) });
  const real = await open({ view: 'modal', unit: 'EMPTY' });
  await real.page.waitForSelector('.v-dialog.v-overlay--active .v-tab', { timeout: 60000 });
  await settle(real.page, 800);
  await real.page.locator('.v-dialog.v-overlay--active .v-tab', { hasText: '繳款紀錄' }).click();
  await settle(real.page, 500);
  await real.page.getByRole('button', { name: '帶入合約期款資料' }).click();
  await settle(real.page, 700);
  const realDialog = real.page.locator('.pti');
  eq(G, '戶別視窗：沒有資料時引導', (await realDialog.locator('.pti-empty-title').innerText()).trim(), '尚未設定合約期款');
  await realDialog.getByRole('button', { name: '開啟合約製作設定' }).click();
  await settle(real.page, 2000);
  const contractTop = dialog(real.page);
  check(G, '戶別視窗：合約製作設定開在帶入視窗上方', (await contractTop.innerText()).includes('合約製作設定 - EMPTY'), (await contractTop.innerText()).slice(0, 80));
  await contractTop.getByRole('button', { name: '儲存', exact: true }).click();
  await settle(real.page, 500);
  const savedContract = backend.db.store.get('salesHouseholds/p1_EMPTY').contractDocData;
  check(G, '戶別視窗：合約製作設定儲存後有期款', Array.isArray(savedContract?.manualRows) && savedContract.manualRows.length > 0, JSON.stringify(savedContract?.manualRows));
  await contractTop.getByRole('button', { name: '關閉', exact: true }).last().click();
  await settle(real.page, 1000);
  const realRows = await readRows(dialog(real.page));
  const expectedFirst = savedContract.manualRows.find(r => r.type !== 'group' && Number(r.amount) > 0);
  check(G, '戶別視窗：關閉合約製作設定後列出已存的期款', realRows.length > 0 && realRows.find(r => r.name === expectedFirst.name)?.amount === `${money(expectedFirst.amount * 10000)} 元`, JSON.stringify(realRows));
  await rowOf(dialog(real.page), expectedFirst.name).locator('input[type=date]').fill(addDays(15));
  await keepOnly(dialog(real.page), [expectedFirst.name]);
  await settle(real.page, 100);
  await submitBtn(dialog(real.page)).click();
  await settle(real.page, 800);
  const realSaved = records('EMPTY').find(r => r.period === expectedFirst.name);
  eq(G, '戶別視窗：帶入後寫入紀錄', [realSaved?.expectedAmount, realSaved?.expectedDate, realSaved?.planSource], [expectedFirst.amount * 10000, addDays(15), 'contract']);
  check(G, '戶別視窗：帶入後出現在預計區', await plannedRow(real.page, expectedFirst.name).count() === 1, '');
  await real.close();
});

// ─────────────── 期別與備註分欄 ───────────────
group('PERIOD', async () => {
  const G = 'PERIOD 期別與備註';
  const setUnit = (unit, patch) => {
    const key = `salesHouseholds/p1_${unit}`;
    backend.db.store.set(key, { ...backend.db.store.get(key), ...patch });
  };
  const records = unit => backend.db.store.get(`salesHouseholds/p1_${unit}`).paymentRecords;
  const openForm = async (page, kind) => {
    await page.locator('.pr-actions').getByRole('button', { name: kind, exact: true }).click();
    await settle(page);
    return dialog(page);
  };
  const periodMenu = async (scope) => {
    const page = scope.page();
    await scope.locator('.ppf-select .v-field').first().click();
    await settle(page, 250);
    const items = (await page.locator('.v-menu.v-overlay--active .v-list-item').allInnerTexts()).map(x => x.trim());
    await page.keyboard.press('Escape');
    await settle(page, 200);
    return items;
  };
  const selectionOf = scope => scope.locator('.ppf-select .v-select__selection-text').first().innerText().then(x => x.trim());

  // 沒有合約資料：列建案範本的期別，一般戶不列配套
  backend.reset();
  const { page, close } = await open({ view: 'panel', unit: 'EMPTY', total: 2100 });
  await settle(page, 400);
  const d = await openForm(page, '預計繳款');
  const templateOptions = await periodMenu(d);
  eq(G, '選單頭尾：未指定與其他', [templateOptions[0], templateOptions.at(-1)], ['未指定', '其他']);
  check(G, '沒有合約：列建案範本期別，有子項列子項', templateOptions.includes('頭期款') && templateOptions.includes('開工期款') && templateOptions.includes('優付訂金') && !templateOptions.includes('工程期款'), templateOptions.join(','));
  check(G, '一般戶：不列配套期別', !templateOptions.includes('配套頭款'), templateOptions.join(','));
  eq(G, '選單去重複', new Set(templateOptions).size, templateOptions.length);
  eq(G, '預設未指定、沒有輸入框', [await selectionOf(d), await d.locator('input[aria-label="其他期別"]').count()], ['未指定', 0]);

  // 新增：選期別＋備註分開存
  await d.locator('input[aria-label="預計日"]').fill(addDays(10));
  await d.locator('input[aria-label="預計金額"]').fill('100000');
  await pickPeriod(d, '頭期款');
  await d.locator('input[aria-label="備註"]').fill('客戶要求延後');
  await evidence(page, 'period-form');
  await clickDialogButton(page, '儲存');
  await d.waitFor({ state: 'hidden' });
  await settle(page, 200);
  const added = calls('paymentProofApi', 'addRecord').at(-1).payload;
  eq(G, '新增：期別與備註分開送出', [added.period, added.note], ['頭期款', '客戶要求延後']);
  eq(G, '新增：分開寫入', [records('EMPTY')[0].period, records('EMPTY')[0].note], ['頭期款', '客戶要求延後']);
  const shown = (await rowsOf(planned(page)))[0].fields;
  eq(G, '列表：期別與備註各一欄', [shown['期別'], shown['備註']], ['頭期款', '客戶要求延後']);

  // 其他：自行輸入
  const d2 = await openForm(page, '已繳款');
  await d2.locator('input[aria-label="實繳金額"]').fill('5000');
  await pickPeriod(d2, '其他');
  eq(G, '選其他：出現輸入框且先是空的', await d2.locator('input[aria-label="其他期別"]').inputValue(), '');
  await d2.locator('input[aria-label="其他期別"]').fill('  額外工程款  ');
  await evidence(page, 'period-form-other');
  await clickDialogButton(page, '儲存');
  await d2.waitFor({ state: 'hidden' });
  await settle(page, 200);
  eq(G, '其他：去空白後存成期別', [calls('paymentProofApi', 'addRecord').at(-1).payload.period, records('EMPTY').at(-1).period], ['額外工程款', '額外工程款']);

  // 編輯：自訂期別回到「其他」，有選項的回到選項
  await paidRow(page, '額外工程款').getByRole('button', { name: '更多操作' }).click();
  await settle(page, 200);
  await page.locator('.v-menu.v-overlay--active .v-list-item', { hasText: '編輯' }).click();
  await settle(page, 300);
  const d3 = dialog(page);
  eq(G, '編輯自訂期別：顯示其他與原文字', [await selectionOf(d3), await d3.locator('input[aria-label="其他期別"]').inputValue()], ['其他', '額外工程款']);
  await pickPeriod(d3, '銀行貸款');
  eq(G, '改選選項：輸入框收起', await d3.locator('input[aria-label="其他期別"]').count(), 0);
  await pickPeriod(d3, '其他');
  eq(G, '選項改回其他：清空', await d3.locator('input[aria-label="其他期別"]').inputValue(), '');
  await pickPeriod(d3, '未指定');
  await clickDialogButton(page, '儲存');
  await d3.waitFor({ state: 'hidden' });
  await settle(page, 200);
  eq(G, '改成未指定：清除期別', records('EMPTY').at(-1).period, '');
  await close();

  // 舊資料：備註等於期別名稱，編輯時視為期別，存檔才分開；沒存檔資料不動
  backend.reset();
  setUnit('EMPTY', { paymentRecords: [{ id: 'old1', date: addDays(-5), amount: 1000, note: '簽約款', file: null }, { id: 'old2', date: addDays(-6), amount: 2000, note: '其他文字', file: null }] });
  const legacy = await open({ view: 'panel', unit: 'EMPTY', total: 2100 });
  await settle(legacy.page, 400);
  const legacyRows = await rowsOf(paid(legacy.page));
  eq(G, '舊資料：列表內容留在備註', legacyRows.map(r => [r.fields['期別'], r.fields['備註']]), [['—', '簽約款'], ['—', '其他文字']]);
  await paidRow(legacy.page, '簽約款').getByRole('button', { name: '更多操作' }).click();
  await settle(legacy.page, 200);
  await legacy.page.locator('.v-menu.v-overlay--active .v-list-item', { hasText: '編輯' }).click();
  await settle(legacy.page, 300);
  const ld = dialog(legacy.page);
  eq(G, '舊資料編輯：備註等於期別名稱時視為期別', [await selectionOf(ld), await ld.locator('input[aria-label="備註"]').inputValue()], ['簽約款', '']);
  eq(G, '舊資料開編輯沒存檔：資料不動', calls('paymentProofApi', 'updateRecord').length, 0);
  await clickDialogButton(legacy.page, '儲存');
  await ld.waitFor({ state: 'hidden' });
  await settle(legacy.page, 200);
  eq(G, '舊資料存檔後分開', [records('EMPTY')[0].period, records('EMPTY')[0].note], ['簽約款', '']);
  await paidRow(legacy.page, '其他文字').getByRole('button', { name: '更多操作' }).click();
  await settle(legacy.page, 200);
  await legacy.page.locator('.v-menu.v-overlay--active .v-list-item', { hasText: '編輯' }).click();
  await settle(legacy.page, 300);
  const ld2 = dialog(legacy.page);
  eq(G, '舊資料編輯：對不上的留在備註', [await selectionOf(ld2), await ld2.locator('input[aria-label="備註"]').inputValue()], ['未指定', '其他文字']);
  await clickDialogButton(legacy.page, '取消');
  await legacy.close();

  // 有合約資料：只列該戶合約期別
  backend.reset();
  setUnit('EMPTY', { contractDocData: { manualRows: [contractSingle('a', '合約訂金', 10), contractSingle('z', '合約零元', 0)] } });
  const withContract = await open({ view: 'panel', unit: 'EMPTY', total: 2100 });
  await settle(withContract.page, 400);
  const cd = await openForm(withContract.page, '預計繳款');
  eq(G, '有合約：只列該戶金額大於 0 的期別', await periodMenu(cd), ['未指定', '合約訂金', '其他']);
  await clickDialogButton(withContract.page, '取消');
  await withContract.close();

  // 配套戶列配套期別；範本讀取失敗不擋操作
  backend.reset();
  const pkg = await open({ view: 'panel', unit: 'P1', total: 2000 });
  await settle(pkg.page, 400);
  const pd = await openForm(pkg.page, '預計繳款');
  check(G, '配套戶：列配套期別', (await periodMenu(pd)).includes('配套頭款'), '');
  await clickDialogButton(pkg.page, '取消');
  await pkg.close();
  backend.reset({ failures: { fetchPaymentTermTemplates: '讀取失敗', fetchContractDocData: '讀取失敗' } });
  const failed = await open({ view: 'panel', unit: 'EMPTY', total: 2100 });
  await settle(failed.page, 400);
  const fd = await openForm(failed.page, '預計繳款');
  eq(G, '讀取失敗：仍可選其他自行輸入', await periodMenu(fd), ['未指定', '其他']);
  await clickDialogButton(failed.page, '取消');
  await failed.close();

  // 標記已繳：期別保留，差額沿用同一期別
  backend.reset();
  setUnit('EMPTY', { paymentRecords: [plan('mark', 5, 100000, '客戶備註', { period: '訂金' })] });
  const mark = await open({ view: 'panel', unit: 'EMPTY', total: 2100 });
  await settle(mark.page, 400);
  await plannedRow(mark.page, '訂金').getByRole('button', { name: '標記已繳' }).click();
  await settle(mark.page);
  const md3 = dialog(mark.page);
  eq(G, '標記已繳：摘要顯示期別（備註）', (await md3.locator('.mpd-summary-note').innerText()).trim(), '訂金（客戶備註）');
  await md3.locator('input[type=number]').first().fill('60000');
  await settle(mark.page, 150);
  await md3.locator('input[type=date]').last().fill(addDays(15));
  await clickDialogButton(mark.page, '確認已繳');
  await md3.waitFor({ state: 'hidden' });
  await settle(mark.page, 300);
  const markStored = records('EMPTY');
  eq(G, '標記已繳：期別與備註不變', [markStored[0].period, markStored[0].note, markStored[0].amount], ['訂金', '客戶備註', 60000]);
  eq(G, '差額：沿用期別', [markStored[1].period, markStored[1].note, markStored[1].expectedAmount, markStored[1].planSource], ['訂金', '客戶備註 尾款', 40000, 'balance']);
  await mark.close();

  // 到期清單：顯示期別（備註），可搜尋期別
  backend.reset();
  setUnit('A1', { paymentRecords: [plan('due', 3, 100000, '客戶備註', { period: '自訂期別名稱' })] });
  const list = await open({ view: 'list', role: 'manager' });
  await settle(list.page, 500);
  check(G, '到期清單：顯示期別（備註）', (await listTexts(list.page)).some(r => r[2] === '自訂期別名稱（客戶備註）'), JSON.stringify((await listTexts(list.page)).slice(0, 3)));
  await list.page.locator('.pd-search input').first().fill('自訂期別');
  await settle(list.page, 400);
  eq(G, '到期清單：可搜尋期別', (await listTexts(list.page)).length, 1);
  await list.close();

  // 修改銷控：編輯卡片分欄，舊資料動到才分開
  backend.reset();
  const edit = await open({ view: 'modal', unit: 'M1', editing: 1 });
  await edit.page.waitForSelector('.v-dialog.v-overlay--active', { timeout: 60000 });
  await settle(edit.page, 800);
  await edit.page.locator('.edit-nav-item', { hasText: '戶別繳款紀錄' }).click();
  await settle(edit.page, 500);
  const summary = edit.page.locator('.pr-summary:visible').first();
  if ((await edit.page.locator('.pr-edit-card:visible').count()) === 0) { await summary.click(); await settle(edit.page, 300); }
  const editPaid = edit.page.locator('section[aria-label="已繳款"] .pr-edit-card');
  const signingCard = editPaid.filter({ has: edit.page.locator('.ppf-select', { hasText: '簽約款' }) }).first();
  eq(G, '修改銷控舊資料：備註等於期別名稱時視為期別', [await signingCard.locator('.ppf-select .v-select__selection-text').innerText(), await signingCard.locator('input[aria-label="備註"]').inputValue()], ['簽約款', '']);
  await signingCard.locator('input[aria-label="備註"]').fill('改了備註');
  await settle(edit.page, 150);
  await edit.page.getByRole('button', { name: '儲存變更' }).first().click();
  await settle(edit.page, 800);
  const editSaved = backend.db.store.get('salesHouseholds/p1_M1').paymentRecords.find(r => r.id === 'd_late');
  eq(G, '修改銷控：動到後分開寫入', [editSaved.period, editSaved.note], ['簽約款', '改了備註']);
  await edit.close();

  // 狀態改簽約：已有含「簽約」的預計時轉為已繳，不另外新增
  backend.reset();
  setUnit('M2', { paymentRecords: [plan('signplan', 5, 1000000, '', { period: '簽約金' })] });
  const sign = await open({ view: 'modal', unit: 'M2', editing: 1 });
  await sign.page.waitForSelector('.v-dialog.v-overlay--active', { timeout: 60000 });
  await settle(sign.page, 800);
  await sign.page.locator('.v-select', { hasText: '後台狀態' }).first().locator('.v-field').click();
  await settle(sign.page, 300);
  await sign.page.locator('.v-menu.v-overlay--active .v-list-item', { hasText: '簽約' }).first().click();
  await settle(sign.page, 400);
  const signPrompt = dialog(sign.page);
  eq(G, '狀態改簽約：帶入預計金額', await signPrompt.locator('input[type=number]').first().inputValue(), '1000000');
  check(G, '狀態改簽約：提示轉為已繳', (await signPrompt.innerText()).includes('已有預計繳款「簽約金」'), (await signPrompt.innerText()).slice(0, 160));
  await sign.close();
});

// ─────────────── 預計日留空 ───────────────
group('UNDATED', async () => {
  const G = 'UNDATED 預計日留空';
  const setUnit = (unit, patch) => {
    const key = `salesHouseholds/p1_${unit}`;
    backend.db.store.set(key, { ...backend.db.store.get(key), ...patch });
  };
  const records = unit => backend.db.store.get(`salesHouseholds/p1_${unit}`).paymentRecords;
  const undatedPlan = (id, expectedAmount, period, extra = {}) => plan(id, 0, expectedAmount, '', { expectedDate: null, period, planSource: 'contract', ...extra });
  const openRowMenu = async (row, page, item) => {
    await row.getByRole('button', { name: '更多操作' }).click();
    await settle(page, 200);
    await page.locator('.v-menu.v-overlay--active .v-list-item', { hasText: item }).click();
    await settle(page, 300);
  };

  // 帶入合約期款：預計日留空也能送出
  backend.reset();
  setUnit('EMPTY', { contractDocData: { manualRows: [contractSingle('a', '簽約金', 100), contractSingle('b', '尾款', 2000)] } });
  const { page, close } = await open({ view: 'panel', unit: 'EMPTY', total: 2100 });
  await settle(page, 400);
  await page.locator('.pr-actions').getByRole('button', { name: '帶入合約期款資料' }).click();
  await settle(page, 700);
  const d = dialog(page);
  await d.locator('.pti-row').filter({ hasText: '簽約金' }).locator('input[type=date]').fill(addDays(10));
  await settle(page, 100);
  eq(G, '帶入：只提示未填筆數，不阻擋', [(await d.locator('.pti-missing').innerText()).trim(), await d.locator('.mac-sheet-foot .mac-btn--primary').isDisabled()], ['1 筆未填預計日，不會提醒', false]);
  await evidence(page, 'undated-import');
  await d.locator('.mac-sheet-foot .mac-btn--primary').click();
  await d.waitFor({ state: 'hidden' });
  await settle(page, 300);
  const adds = calls('paymentProofApi', 'addRecord').map(c => c.payload);
  eq(G, '帶入：留空送 null，有填的照常', adds.map(a => [a.period, a.expectedDate, a.expectedAmount, a.planSource]), [['簽約金', addDays(10), 1000000, 'contract'], ['尾款', null, 20000000, 'contract']]);
  const stored = records('EMPTY').find(r => r.period === '尾款');
  eq(G, '帶入：後端寫入沒有預計日、有來源標記', [stored.expectedDate ?? null, stored.expectedAmount, stored.planSource, stored.date, stored.amount], [null, 20000000, 'contract', '', null]);

  // 繳款紀錄：留在預計區排最後，金額計入待繳，下次到期只看有日期的
  const plannedRows = await rowsOf(planned(page));
  eq(G, '列表：未定日期在預計區排最後', plannedRows.map(r => r.fields['期別']), ['簽約金', '尾款']);
  eq(G, '列表：預計日顯示未定、標籤未定日期', [plannedRows[1].fields['預計日'], plannedRows[1].tag], ['未定', '未定日期']);
  eq(G, '列表：不在已繳區', (await rowsOf(paid(page))).length, 0);
  const summary = await stats(page);
  eq(G, '統計：待繳含未定日期', summary['待繳'], `${money(21000000)} 元`);
  check(G, '統計：下次到期只看有日期的', summary['下次到期'].includes(addDays(10).replace(/-/g, '/')), summary['下次到期']);
  await evidence(page, 'undated-panel');

  // 再開帶入視窗：比對到同一筆，顯示預計日未定
  await page.locator('.pr-actions').getByRole('button', { name: '帶入合約期款資料' }).click();
  await settle(page, 700);
  const again = dialog(page).locator('.pti-row').filter({ hasText: '尾款' });
  eq(G, '重開帶入：已帶入、顯示預計日未定', [(await again.locator('.mac-tag').innerText()).trim(), (await again.locator('.pti-date-text').innerText()).trim()], ['已帶入', '預計日未定']);
  await clickDialogButton(page, '取消');
  await settle(page, 300);

  // 補上日期：變成一般預計繳款
  await openRowMenu(plannedRow(page, '尾款'), page, '編輯');
  const fillDate = dialog(page);
  eq(G, '編輯：預計日是空的', await fillDate.locator('input[aria-label="預計日"]').inputValue(), '');
  await fillDate.locator('input[aria-label="預計日"]').fill(addDays(40));
  await clickDialogButton(page, '儲存');
  await fillDate.waitFor({ state: 'hidden' });
  await settle(page, 300);
  const dated = (await rowsOf(planned(page))).find(r => r.fields['期別'] === '尾款');
  eq(G, '補日期：顯示日期與剩餘天數', [dated.fields['預計日'], dated.tag], [addDays(40).replace(/-/g, '/'), '剩 40 天']);

  // 清掉日期：可以；日期和金額都清掉要擋
  await openRowMenu(plannedRow(page, '尾款'), page, '編輯');
  const clearDate = dialog(page);
  await clearDate.locator('input[aria-label="預計日"]').fill('');
  await settle(page, 100);
  await clearDate.locator('input[aria-label="預計金額"]').fill('');
  await clickDialogButton(page, '儲存');
  await settle(page, 200);
  check(G, '編輯：日期和金額都清掉要擋', (await clearDate.locator('.mac-callout--error').innerText()).includes('至少要填一個'), '');
  await clearDate.locator('input[aria-label="預計金額"]').fill('20000000');
  await clickDialogButton(page, '儲存');
  await clearDate.waitFor({ state: 'hidden' });
  await settle(page, 300);
  eq(G, '編輯：可清除預計日', records('EMPTY').find(r => r.period === '尾款').expectedDate ?? null, null);
  await close();

  // 手動新增：只填金額可以
  backend.reset();
  const manual = await open({ view: 'panel', unit: 'EMPTY', total: 2100 });
  await settle(manual.page, 400);
  await manual.page.locator('.pr-actions').getByRole('button', { name: '預計繳款', exact: true }).click();
  await settle(manual.page);
  const md = dialog(manual.page);
  await md.locator('input[aria-label="預計金額"]').fill('300000');
  await pickPeriod(md, '頭期款');
  await clickDialogButton(manual.page, '儲存');
  await md.waitFor({ state: 'hidden' });
  await settle(manual.page, 300);
  const manualAdd = calls('paymentProofApi', 'addRecord').at(-1).payload;
  eq(G, '手動新增：只填金額可以', [manualAdd.expectedDate, manualAdd.expectedAmount, manualAdd.planSource], [null, 300000, 'manual']);
  eq(G, '手動新增：判定為預計', (await rowsOf(planned(manual.page))).map(r => r.tag), ['未定日期']);

  // 標記已繳：摘要顯示未定；可以改回預計；差額可留空且沿用期別
  await plannedRow(manual.page, '頭期款').getByRole('button', { name: '標記已繳' }).click();
  await settle(manual.page);
  const mark = dialog(manual.page);
  check(G, '標記已繳：摘要顯示預計未定', (await mark.locator('.mpd-summary').innerText()).includes('預計 未定'), await mark.locator('.mpd-summary').innerText());
  await mark.locator('input[type=number]').first().fill('100000');
  await settle(manual.page, 150);
  await clickDialogButton(manual.page, '確認已繳');
  await mark.waitFor({ state: 'hidden' });
  await settle(manual.page, 300);
  const afterMark = records('EMPTY');
  eq(G, '標記已繳：轉為已繳', [afterMark[0].date, afterMark[0].amount], [TODAY, 100000]);
  eq(G, '差額留空：沒有預計日、沿用期別', [afterMark[1].expectedDate ?? null, afterMark[1].expectedAmount, afterMark[1].period, afterMark[1].planSource], [null, 200000, '頭期款', 'balance']);
  eq(G, '差額留空：顯示未定日期', (await rowsOf(planned(manual.page))).map(r => r.tag), ['未定日期']);
  await openRowMenu(paidRow(manual.page, '頭期款'), manual.page, '改回預計');
  await clickDialogButton(manual.page, '改回預計');
  await settle(manual.page, 400);
  const reverted = records('EMPTY')[0];
  eq(G, '改回預計：沒有預計日也能改回', [reverted.date, reverted.amount, reverted.expectedAmount], ['', null, 300000]);
  eq(G, '改回預計：回到預計區', (await rowsOf(planned(manual.page))).length, 2);
  await manual.close();

  // 舊資料：沒有來源標記的缺值紀錄照舊在已繳區
  backend.reset();
  setUnit('EMPTY', { paymentRecords: [{ id: 'old', date: '', amount: null, note: '舊資料', file: null }] });
  const legacy = await open({ view: 'panel', unit: 'EMPTY', total: 2100 });
  await settle(legacy.page, 400);
  eq(G, '舊資料：缺值紀錄留在已繳區', [(await rowsOf(planned(legacy.page))).length, (await rowsOf(paid(legacy.page))).length], [0, 1]);
  await legacy.close();

  // 到期清單：列在最後、標示未定日期，不進篩選
  backend.reset();
  setUnit('A1', { paymentRecords: [undatedPlan('un', 500000, '未定期別'), plan('da', 3, 100000, '', { period: '有日期期別' })] });
  const list = await open({ view: 'list', role: 'manager' });
  await settle(list.page, 500);
  const listed = await listTexts(list.page);
  const undatedRow = listed.find(r => r[2] === '未定期別');
  check(G, '到期清單：有列出且標示未定日期', !!undatedRow && undatedRow[0].includes('未定日期') && undatedRow[3] === '未定', JSON.stringify(undatedRow));
  eq(G, '到期清單：未定日期排最後', listed.at(-1)[2], '未定期別');
  for (const label of ['逾期', '7 天內', '30 天內']) {
    await list.page.locator('.pd-toolbar .mac-form-seg-btn', { hasText: label }).click();
    await settle(list.page, 200);
    check(G, `到期清單：${label}不含未定日期`, !(await listTexts(list.page)).some(r => r[2] === '未定期別'), '');
  }
  await list.page.locator('.pd-toolbar .mac-form-seg-btn', { hasText: '全部' }).click();
  await settle(list.page, 200);
  await evidence(list.page, 'undated-list');
  await list.close();

  // 修改銷控：留空可以存；日期和金額都沒有擋下
  backend.reset();
  const edit = await open({ view: 'modal', unit: 'M1', editing: 1 });
  edit.page.on('dialog', async (alert) => { await alert.accept(); });
  await edit.page.waitForSelector('.v-dialog.v-overlay--active', { timeout: 60000 });
  await settle(edit.page, 800);
  await edit.page.locator('.edit-nav-item', { hasText: '戶別繳款紀錄' }).click();
  await settle(edit.page, 500);
  const toggle = edit.page.locator('.pr-summary:visible').first();
  if ((await edit.page.locator('.pr-edit-card:visible').count()) === 0) { await toggle.click(); await settle(edit.page, 300); }
  await edit.page.locator('.pr-actions').getByRole('button', { name: '預計繳款', exact: true }).click();
  await settle(edit.page, 200);
  await edit.page.locator('section[aria-label="預計繳款"] .pr-edit-card').last().locator('input[aria-label="預計金額"]').fill('88000');
  await settle(edit.page, 150);
  await edit.page.getByRole('button', { name: '儲存變更' }).first().click();
  await settle(edit.page, 800);
  const editSaved = backend.db.store.get('salesHouseholds/p1_M1').paymentRecords.find(r => r.expectedAmount === 88000);
  eq(G, '修改銷控：留空寫入 null 並有來源標記', [editSaved?.expectedDate ?? null, editSaved?.planSource, editSaved?.date, editSaved?.amount], [null, 'manual', '', null]);
  await edit.close();
});

// ─────────────── T10 列表計算欄位 ───────────────
group('T10', async () => {
  const G = 'T10 計算欄位';
  backend.reset();
  const { page, close } = await open({ view: 'utils' });
  await page.waitForFunction(() => window.__utilsReady === true);
  const r = await page.evaluate((today) => {
    const { columns, format, commission } = window.__utils;
    const fields = columns.paymentRecordColumnFields;
    const day = n => new Date(Date.parse(today + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
    const plan = (n, amount) => ({ id: 'p' + n, expectedDate: day(n), expectedAmount: amount, date: '', amount: null, note: 'x' });
    const paid = (date, amount, extra = {}) => ({ id: 'd' + date, date, amount, note: 'y', ...extra });
    const cases = {
      empty: fields([], 1000, today),
      undef: fields(undefined, 1000, today),
      legacy: fields([paid('2026-01-01', 500000)], 1000, today),
      plannedOnly: fields([plan(5, 300000), plan(9, 200000)], 1000, today),
      overdue: fields([plan(-4, 100000), plan(-1, 100000), plan(2, 100000), paid('2026-01-01', 100000)], 1000, today),
      today: fields([plan(0, 100000)], 1000, today),
      soon: fields([plan(7, 100000)], 1000, today),
      upcoming: fields([plan(8, null)], 1000, today),
      noTotal: fields([paid('2026-01-01', 500000), plan(2, 100000)], 0, today),
      paidWithExpected: fields([paid('2026-01-01', 300000, { expectedDate: '2025-12-20', expectedAmount: 500000 })], 1000, today),
      decimals: fields([paid('2026-01-01', 123456), plan(1, 76543)], 1234.56, today),
    };
    // 預計金額不影響 paid_total、payment_ratio、請佣比例
    const base = [paid('2026-01-01', 500000)];
    const withPlan = [...base, plan(3, 900000)];
    const deal = 1000;
    const comm = {
      base: commission.paymentRatioPct({ paymentRecords: base }, deal),
      withPlan: commission.paymentRatioPct({ paymentRecords: withPlan }, deal),
      converted: commission.paymentRatioPct({ paymentRecords: [...base, { ...plan(3, 900000), date: today, amount: 900000 }] }, deal),
      noDeal: commission.paymentRatioPct({ paymentRecords: base }, 0),
    };
    const derivedBase = format.withDerivedFields({ unitId: 'X', salesStatus_backend: '簽約', price_transaction_house: 1000, paymentRecords: base }, []);
    const derivedPlan = format.withDerivedFields({ unitId: 'X', salesStatus_backend: '簽約', price_transaction_house: 1000, paymentRecords: withPlan }, []);
    const derivedParking = format.withDerivedFields({ unitId: 'X', salesStatus_backend: '簽約', price_transaction_house: 1000, paymentRecords: [paid('2026-01-01', 550000)] }, [{ buyerUnitId: 'X', salesStatus: '簽約', price_transaction: 100, price_floor: 90 }]);
    const fmt = (k, v) => format.formatFieldValue(k, v);
    return {
      cases, comm,
      derived: {
        base: { paid: derivedBase.paid_total, ratio: derivedBase.payment_ratio },
        plan: { paid: derivedPlan.paid_total, ratio: derivedPlan.payment_ratio, next: derivedPlan.next_expected_date, pending: derivedPlan.pending_total, overdue: derivedPlan.overdue_count, state: derivedPlan.payment_due_state },
        parking: { total: derivedParking.total_transaction, ratio: derivedParking.payment_ratio },
      },
      formatted: {
        next: fmt('next_expected_date', day(3)),
        pending: fmt('pending_total', 30.5),
        pendingNull: fmt('pending_total', null),
        overdue0: fmt('overdue_count', 0),
        overdue2: fmt('overdue_count', 2),
        state: fmt('payment_due_state', '逾期'),
        stateEmpty: fmt('payment_due_state', ''),
        labels: ['next_expected_date', 'pending_total', 'overdue_count', 'payment_due_state'].map(k => format.getFieldLabel(k, false)),
      },
      // 只有 amount 沒有有效日期但有預計日的異常資料：兩條路徑要一致
      weird: {
        columns: fields([{ id: 'w', expectedDate: day(5), expectedAmount: 100000, date: '', amount: 100000 }], 1000, today).payment_ratio,
        comm: commission.paymentRatioPct({ paymentRecords: [{ id: 'w', expectedDate: day(5), expectedAmount: 100000, date: '', amount: 100000 }] }, 1000),
      },
      legacyNoDate: {
        columns: fields([{ id: 'w', date: '', amount: 100000 }], 1000, today).payment_ratio,
        comm: commission.paymentRatioPct({ paymentRecords: [{ id: 'w', date: '', amount: 100000 }] }, 1000),
      },
    };
  }, TODAY);
  const c = r.cases;
  eq(G, '空資料欄位', c.empty, { payment_records_count: 0, planned_records_count: 0, paid_total: 0, payment_ratio: 0, next_expected_date: '', next_expected_state: 'none', next_expected_label: '', pending_total: null, overdue_count: 0, payment_due_state: '' });
  eq(G, 'undefined 不報錯', c.undef.paid_total, 0);
  eq(G, '舊資料：paid_total、ratio', [c.legacy.paid_total, c.legacy.payment_ratio, c.legacy.next_expected_date, c.legacy.pending_total], [50, 5, '', null]);
  eq(G, '只有預計：paid_total、ratio 為 0', [c.plannedOnly.paid_total, c.plannedOnly.payment_ratio, c.plannedOnly.pending_total, c.plannedOnly.next_expected_date, c.plannedOnly.payment_due_state], [0, 0, 50, addDays(5), '7 天內']);
  eq(G, '逾期：筆數與狀態、下次為最早', [c.overdue.overdue_count, c.overdue.payment_due_state, c.overdue.next_expected_date, c.overdue.next_expected_label, c.overdue.pending_total, c.overdue.paid_total, c.overdue.payment_ratio], [2, '逾期', addDays(-4), '逾期 4 天', 30, 10, 1]);
  eq(G, '今天', [c.today.payment_due_state, c.today.next_expected_label], ['今天到期', '今天到期']);
  eq(G, '剛好 7 天算 7 天內', c.soon.payment_due_state, '7 天內');
  eq(G, '第 8 天算未到期、金額未填 pending 為 0', [c.upcoming.payment_due_state, c.upcoming.pending_total], ['未到期', 0]);
  eq(G, '無成交總價 ratio 為 null', [c.noTotal.payment_ratio, c.noTotal.paid_total], [null, 50]);
  eq(G, '已繳且有預計：不計待繳', [c.paidWithExpected.paid_total, c.paidWithExpected.planned_records_count, c.paidWithExpected.pending_total], [30, 0, null]);
  eq(G, '小數四捨五入', [c.decimals.paid_total, c.decimals.payment_ratio, c.decimals.pending_total], [12.35, 1, 7.65]);
  eq(G, 'paymentRatioPct 不受預計金額影響', [r.comm.base, r.comm.withPlan], [5, 5]);
  eq(G, 'paymentRatioPct 轉已繳後計入', r.comm.converted, 14);
  eq(G, 'paymentRatioPct 無成交總價', r.comm.noDeal, null);
  eq(G, 'withDerivedFields：預計不影響', [r.derived.base.paid, r.derived.base.ratio, r.derived.plan.paid, r.derived.plan.ratio], [50, 5, 50, 5]);
  eq(G, 'withDerivedFields：新欄位', [r.derived.plan.next, r.derived.plan.pending, r.derived.plan.overdue, r.derived.plan.state], [addDays(3), 90, 0, '7 天內']);
  eq(G, 'withDerivedFields：比例含車位', [r.derived.parking.total, r.derived.parking.ratio], [1100, 5]);
  eq(G, '格式：下次預計繳款日', r.formatted.next, slash(addDays(3)));
  eq(G, '格式：待繳金額', [r.formatted.pending, r.formatted.pendingNull], ['30.5 萬', '']);
  eq(G, '格式：逾期筆數含 0', [r.formatted.overdue0, r.formatted.overdue2], ['0', '2']);
  eq(G, '格式：到期狀態', [r.formatted.state, r.formatted.stateEmpty], ['逾期', '']);
  eq(G, '欄位標題', r.formatted.labels, ['下次預計繳款日', '待繳金額(萬)', '逾期筆數', '到期狀態']);
  known(G, '異常資料（預計未繳卻有 amount）：列表與請佣比例一致', r.weird.columns === r.weird.comm, `列表 ${r.weird.columns}，請佣 ${r.weird.comm}`, '正常流程不會產生這種資料');
  eq(G, '舊資料沒日期有金額：列表與請佣比例一致', r.legacyNoDate.columns, r.legacyNoDate.comm);
  await close();
});

// ─────────────── T11 LINE／Email 入口 ───────────────
group('T11', async () => {
  const G = 'T11 通知入口';
  backend.reset();
  const nav = page => page.evaluate(() => window.__navFull);
  const logged = await open({ view: 'entry', role: 'manager' });
  await settle(logged.page, 200);
  eq(G, '已登入直接進到期清單', await nav(logged.page), ['/payment-due/p1']);
  await logged.close();

  const browserUser = await open({ view: 'entry', role: 'anon' });
  await settle(browserUser.page, 200);
  eq(G, '外部瀏覽器未登入：導向登入並帶 redirect', await nav(browserUser.page), ['/login?redirect=/payment-due/p1']);
  await browserUser.close();

  const liffLogin = await open({ view: 'entry', role: 'anon', inClient: 1 });
  await settle(liffLogin.page, 200);
  const login = await liffLogin.page.evaluate(() => window.__liff);
  eq(G, 'LINE 內使用 customerManagement LIFF', login.initCalls, ['2008257338-n5Gp6pT3']);
  const uri = new URL(login.loginCalls[0]?.redirectUri || 'http://x/');
  eq(G, 'LINE 未登入：redirect 帶 liff_path 與目標', [uri.pathname, uri.searchParams.get('liff_path'), uri.searchParams.get('paymentDueProjectId'), uri.hash], ['/', 'customer-management-entry', 'p1', '']);
  await liffLogin.close();

  const unbound = await open({ view: 'entry', role: 'anon', inClient: 1, liffLoggedIn: 1 });
  await settle(unbound.page, 200);
  check(G, '未綁定：提示與綁定連結', (await unbound.page.locator('.pde-message').innerText()).includes('尚未綁定') && (await unbound.page.locator('a.mac-btn').getAttribute('href')) === '/?liff_path=line-binding', '');
  await unbound.close();

  const denied = await open({ view: 'entry', role: 'anon', inClient: 1, liffLoggedIn: 1, bound: 'none' });
  await settle(denied.page, 200);
  check(G, '已綁定無權限：權限不足', (await denied.page.locator('.pde-message').innerText()).includes('權限不足') && (await denied.page.getByRole('button', { name: '重試' }).count()) === 0, '');
  await denied.close();

  const bound = await open({ view: 'entry', role: 'anon', inClient: 1, liffLoggedIn: 1, bound: 'sales' });
  await settle(bound.page, 200);
  eq(G, '已綁定有權限：進到期清單', await nav(bound.page), ['/payment-due/p1']);
  await bound.close();

  const failed = await open({ view: 'entry', role: 'anon', initError: 'LIFF 初始化失敗' });
  await settle(failed.page, 200);
  check(G, 'LIFF 失敗：顯示錯誤與重試', (await failed.page.locator('.pde-message').innerText()).includes('LIFF 初始化失敗') && (await failed.page.getByRole('button', { name: '重試' }).count()) === 1, '');
  await failed.page.getByRole('button', { name: '改用帳號密碼登入' }).click();
  await settle(failed.page, 200);
  eq(G, '改用帳號密碼登入帶 redirect', (await nav(failed.page)).at(-1), '/login?redirect=/payment-due/p1');
  await failed.close();

  // ── 新連結格式 liff.line.me/{ID}?paymentDueProjectId=p1：比照 bootstrap → 路由 isReady → App.vue onMounted 的順序 ──
  const CM_LIFF = '2008257338-n5Gp6pT3';
  const noticeUrl = new URL(notifier.lineDueUrl('p1'));
  eq(G, '通知連結是 query 格式，不是路徑（GitHub Pages 路徑會 404）', [noticeUrl.origin, noticeUrl.pathname, noticeUrl.search], ['https://liff.line.me', `/${CM_LIFF}`, '?paymentDueProjectId=p1']);
  const PRIMARY = { liff_path: 'customer-management-entry', 'liff.state': '?paymentDueProjectId=p1' };
  const SECONDARY = { liff_path: 'customer-management-entry', paymentDueProjectId: 'p1' };
  const flow = async (params, opts) => {
    const handle = await open({ view: 'entryflow', ...params }, opts);
    await settle(handle.page, 300);
    return handle;
  };
  const flowState = page => page.evaluate(() => ({
    hash: location.hash,
    liffPath: new URLSearchParams(location.search).get('liff_path'),
    launch: window.__launch,
    init: window.__liff.initCalls,
    login: window.__liff.loginCalls,
  }));

  // 對照組：不等 App.vue 就導頁會卡住，證明這個流程確實重現原本的問題
  const control = await flow({ role: 'manager', control: 1, ...SECONDARY });
  eq(G, '對照組：不等 App.vue 就導頁會停在入口頁（流程有效）', (await flowState(control.page)).hash, '#/payment-due-entry/p1');
  await control.close();

  // 已登入：primary（LINE 第一次導回 Endpoint）、secondary（SDK 轉址後，帶 access_token）
  const primaryLogged = await flow({ role: 'manager', ...PRIMARY }, { hash: '#access_token=fake&id_token=fake' });
  const primaryState = await flowState(primaryLogged.page);
  eq(G, 'primary 已登入：不卡住，進到期清單', primaryState.hash, '#/payment-due/p1');
  eq(G, 'primary：不是名單回報連結', [primaryState.launch.lead, primaryState.launch.legacy], [false, null]);
  eq(G, 'primary：用共用的 customerManagement LIFF、目標為入口頁', primaryState.launch.launch, { liffId: CM_LIFF, route: '/payment-due-entry/p1' });
  eq(G, 'primary：liff_path 改寫為目標，不會被導回 Endpoint', primaryState.liffPath, 'payment-due-entry/p1');
  eq(G, 'primary：LIFF 只初始化一次', primaryState.init, [CM_LIFF]);
  check(G, 'primary：沒有留在載入中', (await primaryLogged.page.locator('.pde-message').count()) === 0, '');
  await primaryLogged.close();

  const secondaryLogged = await flow({ role: 'manager', ...SECONDARY }, { hash: '#access_token=fake' });
  eq(G, 'secondary 已登入：不卡住，進到期清單', (await flowState(secondaryLogged.page)).hash, '#/payment-due/p1');
  await secondaryLogged.close();

  // LINE 內未登入：liff.login，回跳網址再走一次完整流程
  const flowLogin = await flow({ role: 'anon', inClient: 1, ...SECONDARY });
  const flowLoginState = await flowState(flowLogin.page);
  const backUri = new URL(flowLoginState.login[0]?.redirectUri || 'http://x/');
  eq(G, 'LINE 內未登入：呼叫 liff.login，回跳到網站根目錄', [flowLoginState.login.length, backUri.pathname, backUri.hash], [1, '/', '']);
  check(G, 'LINE 內未登入：回跳網址沒有路徑、不會 404', !/payment-due-entry/.test(backUri.pathname), backUri.href);
  await flowLogin.close();
  const backParams = Object.fromEntries(backUri.searchParams);
  const flowBack = await flow({ role: 'anon', inClient: 1, liffLoggedIn: 1, bound: 'sales', ...backParams });
  eq(G, 'LINE 登入回跳、已綁定有權限：進到期清單', (await flowState(flowBack.page)).hash, '#/payment-due/p1');
  await flowBack.close();
  const flowUnbound = await flow({ role: 'anon', inClient: 1, liffLoggedIn: 1, ...backParams });
  check(G, 'LINE 登入回跳、未綁定：顯示綁定提示', (await flowUnbound.page.locator('.pde-message').innerText()).includes('尚未綁定'), '');
  await flowUnbound.close();

  // 外部瀏覽器點 LINE 連結
  const flowOut = await flow({ role: 'anon', ...PRIMARY });
  eq(G, '外部瀏覽器未登入：到登入頁並帶 redirect', (await flowState(flowOut.page)).hash, '#/login?redirect=/payment-due/p1');
  await flowOut.close();

  // Email 連結與舊格式、其他客資入口
  const flowEmail = await flow({ role: 'manager' }, { hash: '#/payment-due-entry/p1' });
  const emailState = await flowState(flowEmail.page);
  eq(G, 'Email 連結（hash）已登入：進到期清單', [emailState.hash, emailState.launch.launch], ['#/payment-due/p1', null]);
  await flowEmail.close();
  const flowOld = await flow({ role: 'manager', liff_path: 'customer-management-entry', 'liff.state': '/payment-due-entry/p1' });
  eq(G, '舊連結格式（liff.state 路徑）仍可進到期清單', (await flowState(flowOld.page)).hash, '#/payment-due/p1');
  await flowOld.close();
  const flowCm = await flow({ role: 'manager', liff_path: 'customer-management-entry' });
  const cmState = await flowState(flowCm.page);
  eq(G, '回歸：一般客資入口不受影響', [cmState.hash, cmState.init], ['#/customer-management-entry', [CM_LIFF]]);
  await flowCm.close();
});

// ─────────────── T12 修改銷控與戶別分頁（真實 UnitDetailModal）───────────────
group('T12', async () => {
  const G = 'T12 修改銷控';
  async function openModal(params, opts) {
    const handle = await open({ view: 'modal', unit: 'M1', ...params }, opts);
    handle.alerts = [];
    handle.page.on('dialog', async (d) => { handle.alerts.push(d.message()); await d.accept(); });
    await handle.page.waitForSelector('.v-dialog.v-overlay--active', { timeout: 60000 });
    await settle(handle.page, 800);
    return handle;
  }
  const save = async (page) => {
    await page.getByRole('button', { name: '儲存變更' }).first().click();
    await settle(page, 700);
  };
  const toPayments = async (page) => {
    await page.locator('.edit-nav-item', { hasText: '戶別繳款紀錄' }).click();
    await settle(page, 300);
    const summary = page.locator('.pr-summary:visible').first();
    if (!(await page.locator('.pr-body:visible').count())) await summary.click();
    await settle(page, 200);
  };
  const updates = () => calls('updateSalesData');

  // 1. 繳款紀錄沒變：不送欄位
  backend.reset();
  const noChange = await openModal({ editing: 1 });
  await save(noChange.page);
  check(G, '有預計紀錄的戶別可儲存', updates().length === 1 && noChange.alerts.length === 0, JSON.stringify(noChange.alerts));
  check(G, '繳款紀錄沒變：不送 paymentRecords', updates().at(-1) && !('paymentRecords' in updates().at(-1).payload.data), Object.keys(updates().at(-1)?.payload?.data || {}).includes('paymentRecords') ? '仍送出 paymentRecords' : '');
  await noChange.close();

  // 1b. 缺日期的舊資料：動了繳款紀錄就擋下儲存（修改前就是如此，訊息要指得出是哪一筆）
  backend.reset();
  const legacyBlock = await openModal({ editing: 1, unit: 'A1' });
  await toPayments(legacyBlock.page);
  await legacyBlock.page.locator('section[aria-label="預計繳款"] .pr-edit-card').first().locator('input[aria-label="備註"]').fill('改備註');
  await settle(legacyBlock.page, 150);
  await save(legacyBlock.page);
  check(G, '缺日期舊資料：提示指出是哪一筆', legacyBlock.alerts.some(a => a.includes('舊資料缺值')) && updates().length === 0, JSON.stringify(legacyBlock.alerts));
  await legacyBlock.close();

  // 2. 新增預計並儲存
  backend.reset();
  const add = await openModal({ editing: 1 });
  await toPayments(add.page);
  check(G, '編輯區分區顯示', (await add.page.locator('section[aria-label="預計繳款"] .pr-edit-card').count()) === 4 && (await add.page.locator('section[aria-label="已繳款"] .pr-edit-card').count()) === 4, '');
  await add.page.locator('.pr-actions').getByRole('button', { name: '預計繳款', exact: true }).click();
  await settle(add.page, 200);
  const newCard = add.page.locator('section[aria-label="預計繳款"] .pr-edit-card').last();
  await newCard.locator('input[aria-label="預計日"]').fill(addDays(12));
  await newCard.locator('input[aria-label="預計金額"]').fill('456789');
  await newCard.locator('input[aria-label="備註"]').fill('修改銷控新增');
  await settle(add.page, 150);
  await save(add.page);
  const payload = updates().at(-1)?.payload?.data?.paymentRecords || [];
  const row = payload.find(r => r.note === '修改銷控新增');
  check(G, '新增預計寫入內容', row && row.date === '' && row.amount === null && row.expectedDate === addDays(12) && row.expectedAmount === 456789 && row.planSource === 'manual' && !('_kind' in row), JSON.stringify(row));
  eq(G, '其他紀錄筆數保留', payload.length, 9);
  check(G, '儲存時沒有內部欄位', payload.every(r => !Object.keys(r).some(k => k.startsWith('_'))), JSON.stringify(payload.map(r => Object.keys(r).filter(k => k.startsWith('_')))));
  eq(G, '沒有 alert', add.alerts, []);
  await add.close();

  // 3. 預計日未填
  backend.reset();
  const missing = await openModal({ editing: 1 });
  await toPayments(missing.page);
  await missing.page.locator('.pr-actions').getByRole('button', { name: '預計繳款', exact: true }).click();
  await settle(missing.page, 200);
  await missing.page.locator('section[aria-label="預計繳款"] .pr-edit-card').last().locator('input[aria-label="備註"]').fill('缺日期');
  await settle(missing.page, 150);
  await save(missing.page);
  check(G, '預計日和金額都沒填擋下', missing.alerts.some(a => a.includes('至少要填一個')) && updates().length === 0, JSON.stringify(missing.alerts));
  await missing.close();

  // 3b. 預計金額負數
  backend.reset();
  const negative = await openModal({ editing: 1 });
  await toPayments(negative.page);
  await negative.page.locator('section[aria-label="預計繳款"] .pr-edit-card').first().locator('input[aria-label="預計金額"]').fill('-5');
  await settle(negative.page, 150);
  await save(negative.page);
  check(G, '預計金額負數擋下', negative.alerts.some(a => a.includes('金額必須為大於 0')) && updates().length === 0, JSON.stringify(negative.alerts));
  await negative.close();

  // 4. 已繳金額清空
  backend.reset();
  const badPaid = await openModal({ editing: 1 });
  await toPayments(badPaid.page);
  await badPaid.page.locator('section[aria-label="已繳款"] .pr-edit-card').first().locator('input[aria-label="實繳金額"]').fill('');
  await settle(badPaid.page, 150);
  await save(badPaid.page);
  check(G, '已繳金額清空擋下', badPaid.alerts.some(a => a.includes('金額')) && updates().length === 0, JSON.stringify(badPaid.alerts));
  await badPaid.close();

  // 5. 他人已修改
  backend.reset();
  const conflict = await openModal({ editing: 1 });
  await toPayments(conflict.page);
  const key = 'salesHouseholds/p1_M1';
  const doc = backend.db.store.get(key);
  backend.db.store.set(key, { ...doc, paymentRecords: doc.paymentRecords.map(r => (r.id === 'p_over' ? { ...r, date: TODAY, amount: 300000, updatedAt: new Date().toISOString() } : r)) });
  await conflict.page.locator('section[aria-label="預計繳款"] .pr-edit-card').first().locator('input[aria-label="備註"]').fill('我也改了');
  await settle(conflict.page, 150);
  await save(conflict.page);
  check(G, '他人已標記已繳：中止儲存並提示', conflict.alerts.some(a => a.includes('其他人修改')) && updates().length === 0, JSON.stringify(conflict.alerts));
  await conflict.close();

  // 5b. 他人已修改，但我沒動繳款紀錄：不覆蓋
  backend.reset();
  const noOverwrite = await openModal({ editing: 1 });
  const before = backend.db.store.get(key);
  backend.db.store.set(key, { ...before, paymentRecords: before.paymentRecords.map(r => (r.id === 'p_over' ? { ...r, date: TODAY, amount: 300000, updatedAt: new Date().toISOString() } : r)) });
  await save(noOverwrite.page);
  const after = backend.db.store.get(key).paymentRecords.find(r => r.id === 'p_over');
  check(G, '沒動繳款紀錄時不覆蓋他人的標記已繳', after.amount === 300000 && after.date === TODAY && noOverwrite.alerts.length === 0, JSON.stringify(after));
  await noOverwrite.close();

  // 6. 標記已繳（本地）＋憑證
  backend.reset();
  const mark = await openModal({ editing: 1 });
  await toPayments(mark.page);
  await mark.page.locator('section[aria-label="預計繳款"] .pr-edit-card').first().getByRole('button', { name: '標記已繳' }).click();
  await settle(mark.page);
  const md3 = dialog(mark.page);
  await md3.locator('input[type=file]').setInputFiles({ name: 'edit.png', mimeType: 'image/png', buffer: PNG });
  await settle(mark.page, 150);
  await clickDialogButton(mark.page, '確認已繳');
  await settle(mark.page, 400);
  await save(mark.page);
  const uploaded = calls('paymentProofApi', 'upload');
  check(G, '儲存時上傳待上傳憑證', uploaded.length === 1 && uploaded[0].payload.base64 === PNG.toString('base64'), JSON.stringify(uploaded.map(c => Object.keys(c.payload))));
  const savedRecords = updates().at(-1)?.payload?.data?.paymentRecords || [];
  const marked = savedRecords.find(r => r.id === 'p_soon'); // 編輯模式依資料順序，第一張是 p_soon
  check(G, '本地標記已繳寫入內容', marked && marked.date === TODAY && marked.amount === 300000 && marked.expectedDate === addDays(3) && marked.paidBy === '管理甲' && !!marked.paidAt && marked.file?.fileId === 'up_1', JSON.stringify(marked));
  const untouched = savedRecords.find(r => r.id === 'd_same');
  check(G, '沒動到的已繳紀錄：不應被補上 paidAt、paidBy', !untouched?.paidAt && !untouched?.paidBy, `「訂金」這筆沒有被操作，卻被寫入 paidAt=${untouched?.paidAt}、paidBy=${untouched?.paidBy}`);
  await mark.close();

  // 7. 改回預計與刪除：憑證移至垃圾桶
  backend.reset();
  const revert = await openModal({ editing: 1 });
  await toPayments(revert.page);
  const lateCard = revert.page.locator('section[aria-label="已繳款"] .pr-edit-card').filter({ has: revert.page.locator('input[aria-label="實繳金額"]') });
  let lateIndex = -1;
  for (let i = 0; i < await lateCard.count(); i += 1) {
    if (await lateCard.nth(i).locator('input[aria-label="實繳金額"]').inputValue() === '600000') lateIndex = i;
  }
  await lateCard.nth(lateIndex).getByRole('button', { name: '改回預計' }).click();
  await settle(revert.page);
  await clickDialogButton(revert.page, '改回預計');
  await settle(revert.page, 300);
  await save(revert.page);
  const reverted = updates().at(-1)?.payload?.data?.paymentRecords?.find(r => r.id === 'd_late');
  check(G, '本地改回預計寫入內容', reverted && reverted.date === '' && reverted.amount === null && reverted.file === null && reverted.paidAt === null && reverted.expectedDate === addDays(-13), JSON.stringify(reverted));
  check(G, '本地改回預計：憑證移至垃圾桶', calls('paymentProofApi', 'trashFile').some(c => c.payload.fileId === 'proofImg'), JSON.stringify(calls('paymentProofApi', 'trashFile')));
  await revert.close();

  // 7b. 狀態提示：比對到同名預計繳款，確認後轉已繳
  backend.reset();
  const prompt = await openModal({ editing: 1, unit: 'M2' });
  await prompt.page.locator('.v-select', { hasText: '後台狀態' }).first().locator('.v-field').click();
  await settle(prompt.page, 300);
  await prompt.page.locator('.v-menu.v-overlay--active .v-list-item', { hasText: '補足' }).first().click();
  await settle(prompt.page, 400);
  const promptDialog = dialog(prompt.page);
  const promptAmount = promptDialog.locator('input[type=number]').first();
  eq(G, '狀態提示：帶入預計金額', await promptAmount.inputValue().catch(() => ''), '500000');
  check(G, '狀態提示：提示會轉為已繳', (await promptDialog.innerText()).includes('已有預計繳款'), (await promptDialog.innerText()).slice(0, 200));
  await promptDialog.getByRole('button', { name: '確認填入' }).click();
  await settle(prompt.page, 300);
  await save(prompt.page);
  const promptSaved = updates().at(-1)?.payload?.data?.paymentRecords?.find(r => r.id === 'm2p');
  check(G, '狀態提示：轉已繳的內部標記不寫入', promptSaved && !Object.keys(promptSaved).some(k => k.startsWith('_')), JSON.stringify(promptSaved && Object.keys(promptSaved)));
  check(G, '狀態提示：預計轉已繳寫入內容', promptSaved && promptSaved.date === TODAY && promptSaved.amount === 500000 && promptSaved.expectedDate === addDays(5) && !!promptSaved.paidAt && promptSaved.paidBy === '管理甲', JSON.stringify(promptSaved));
  await prompt.close();

  // 7c. 詳細資訊分頁的快速入口與修改銷控導覽：只算已繳
  backend.reset();
  const info = await openModal({});
  const meta = await info.page.locator('.unit-quick-link__meta', { hasText: '已繳' }).first().innerText().catch(() => '');
  eq(G, '快速入口摘要', meta, `4 筆・已繳 90 萬・下次 ${md(addDays(-7))}`);
  const badge = await info.page.locator('.v-tab', { hasText: '繳款紀錄' }).locator('.v-badge__badge').innerText().catch(() => '');
  eq(G, '分頁徽章只算已繳', badge, '4');
  await info.close();
  backend.reset();
  const navSummary = await openModal({ editing: 1 });
  eq(G, '修改銷控導覽摘要', (await navSummary.page.locator('.edit-nav-item', { hasText: '戶別繳款紀錄' }).locator('.edit-nav-summary').innerText()).trim(), '已繳 4 筆・預計 4 筆');
  await toPayments(navSummary.page);
  const editRatio = await navSummary.page.locator('.pr-stat', { hasText: '繳款比例' }).first().innerText();
  check(G, '修改銷控的繳款比例應與檢視分頁一致（不用過時的 price_transaction_total）', !editRatio.includes('未填成交總價'), `編輯區顯示「${editRatio.replace(/\s+/g, ' ')}」，戶別成交價 2000 萬、檢視分頁可算出比例`);
  await navSummary.close();

  // 7d. 狀態提示其他分支（§7、§11.1）
  const pickStatus = async (page, name) => {
    await page.locator('.v-select', { hasText: '後台狀態' }).first().locator('.v-field').click();
    await settle(page, 300);
    await page.locator('.v-menu.v-overlay--active .v-list-item', { hasText: name }).first().click();
    await settle(page, 400);
  };
  backend.reset();
  const promptEmpty = await openModal({ editing: 1, unit: 'M2' });
  await pickStatus(promptEmpty.page, '補足');
  await dialog(promptEmpty.page).locator('input[type=number]').first().fill('');
  await dialog(promptEmpty.page).getByRole('button', { name: '確認填入' }).click();
  await settle(promptEmpty.page, 300);
  await save(promptEmpty.page);
  check(G, '狀態提示：金額留空不動繳款紀錄', updates().length === 1 && !('paymentRecords' in updates().at(-1).payload.data), JSON.stringify(Object.keys(updates().at(-1)?.payload?.data || {}).filter(k => k === 'paymentRecords')));
  await promptEmpty.close();

  backend.reset();
  const promptSkip = await openModal({ editing: 1, unit: 'M2' });
  await pickStatus(promptSkip.page, '補足');
  await dialog(promptSkip.page).getByRole('button', { name: '略過' }).click();
  await settle(promptSkip.page, 300);
  await save(promptSkip.page);
  check(G, '狀態提示：略過不動繳款紀錄', updates().length === 1 && !('paymentRecords' in updates().at(-1).payload.data), '');
  await promptSkip.close();

  backend.reset();
  const promptNew = await openModal({ editing: 1, unit: 'M2' });
  await pickStatus(promptNew.page, '簽約');
  const newPrompt = dialog(promptNew.page);
  check(G, '狀態提示：沒有同名紀錄時提示會新增', (await newPrompt.innerText()).includes('自動新增'), (await newPrompt.innerText()).slice(0, 160));
  await newPrompt.locator('input[type=number]').first().fill('300000');
  await newPrompt.getByRole('button', { name: '確認填入' }).click();
  await settle(promptNew.page, 300);
  await save(promptNew.page);
  const newSaved = updates().at(-1)?.payload?.data?.paymentRecords?.find(r => r.note === '簽約');
  check(G, '狀態提示：新增的已繳紀錄內容', newSaved && newSaved.date === TODAY && newSaved.amount === 300000 && !newSaved.expectedDate, JSON.stringify(newSaved));
  await promptNew.close();

  backend.reset();
  const promptPaid = await openModal({ editing: 1, unit: 'M2' });
  await pickStatus(promptPaid.page, '補足');
  await dialog(promptPaid.page).getByRole('button', { name: '略過' }).click();
  await settle(promptPaid.page, 300);
  await pickStatus(promptPaid.page, '小訂');
  const paidPrompt = dialog(promptPaid.page);
  eq(G, '狀態提示：同名已繳紀錄帶實繳金額', await paidPrompt.locator('input[type=number]').first().inputValue(), '100000');
  check(G, '狀態提示：同名已繳紀錄提示會更新', (await paidPrompt.innerText()).includes('將更新該筆'), (await paidPrompt.innerText()).slice(0, 160));
  await promptPaid.close();

  // 7e. §8.5 上傳憑證期間他人修改：第二次確認要擋下
  backend.reset();
  const race = await openModal({ editing: 1 });
  await toPayments(race.page);
  await race.page.locator('section[aria-label="預計繳款"] .pr-edit-card').first().getByRole('button', { name: '標記已繳' }).click();
  await settle(race.page);
  await dialog(race.page).locator('input[type=file]').setInputFiles({ name: 'race.png', mimeType: 'image/png', buffer: PNG });
  await settle(race.page, 150);
  await clickDialogButton(race.page, '確認已繳');
  await settle(race.page, 300);
  backend.onCall = (fn, payload) => {
    if (fn !== 'paymentProofApi' || payload.action !== 'upload') return;
    const current = backend.db.store.get(key);
    backend.db.store.set(key, { ...current, paymentRecords: current.paymentRecords.map(r => (r.id === 'p_far' ? { ...r, date: TODAY, amount: 1000, updatedAt: new Date().toISOString() } : r)) });
  };
  await save(race.page);
  backend.onCall = null;
  eq(G, '§8.5 上傳期間他人修改：有上傳', calls('paymentProofApi', 'upload').length, 1);
  check(G, '§8.5 上傳期間他人修改：中止儲存並提示', race.alerts.some(a => a.includes('其他人修改')) && updates().length === 0, JSON.stringify(race.alerts));
  eq(G, '§8.5 上傳期間他人修改：他人的內容沒被蓋掉', backend.db.store.get(key).paymentRecords.find(r => r.id === 'p_far').amount, 1000);
  await race.close();

  // 7e-2. 自己在分頁先快速新增再進修改銷控：不可誤報他人修改
  backend.reset();
  const self = await openModal({ tab: 'payments' });
  await self.page.locator('.pr-actions').getByRole('button', { name: '預計繳款', exact: true }).first().click();
  await settle(self.page);
  const selfDialog = dialog(self.page);
  await selfDialog.locator('input[aria-label="預計日"]').fill(addDays(9));
  await selfDialog.locator('input[aria-label="備註"]').fill('自己先新增');
  await clickDialogButton(self.page, '儲存');
  await settle(self.page, 500);
  await self.page.locator('.v-dialog.v-overlay--active .v-tab', { hasText: '詳細資訊' }).click();
  await settle(self.page, 400);
  await self.page.locator('.v-dialog.v-overlay--active').getByRole('button', { name: '修改銷控' }).first().click();
  await settle(self.page, 900);
  await toPayments(self.page);
  await self.page.locator('section[aria-label="預計繳款"] .pr-edit-card').filter({ has: self.page.locator('input[aria-label="備註"]') }).first().locator('input[aria-label="備註"]').fill('改一筆');
  await settle(self.page, 150);
  await save(self.page);
  check(G, '§8.5 自己快速新增後再修改銷控：不誤報他人修改', !self.alerts.some(a => a.includes('其他人修改')) && updates().length === 1 && updates().at(-1).payload.data.paymentRecords?.some(r => r.note === '自己先新增'), JSON.stringify(self.alerts));
  await self.close();

  // 7e-3. 停在繳款紀錄分頁直接按「修改銷控」：要看得到編輯畫面
  backend.reset();
  const fromTab = await openModal({ tab: 'payments' });
  await fromTab.page.locator('.v-dialog.v-overlay--active').getByRole('button', { name: '修改銷控' }).first().click();
  await settle(fromTab.page, 900);
  const editVisible = await fromTab.page.locator('.edit-nav-item').first().isVisible().catch(() => false);
  const selectedTab = await fromTab.page.locator('.v-dialog.v-overlay--active .v-tab--selected').innerText().catch(() => '');
  check(G, '在繳款紀錄分頁按修改銷控：切到表單', editVisible && selectedTab.includes('詳細資訊'), `表單可見=${editVisible}，目前分頁=${selectedTab}`);
  await fromTab.page.locator('.edit-nav-item', { hasText: '戶別繳款紀錄' }).click();
  await settle(fromTab.page, 300);
  check(G, '在繳款紀錄分頁按修改銷控：可到繳款紀錄編輯區', (await fromTab.page.locator('.pr-edit-card:visible').count()) > 0 || (await fromTab.page.locator('.pr-summary:visible').count()) > 0, '');
  await fromTab.close();

  // 7f. §8.5 戶別已寫入但車位寫入失敗：重試不誤報他人修改
  backend.reset();
  const pk = await openModal({ editing: 1, unit: 'M3' });
  await toPayments(pk.page);
  const pkCards = () => pk.page.locator('section[aria-label="預計繳款"] .pr-edit-card');
  await pkCards().first().locator('input[aria-label="備註"]').fill('車位失敗測試');
  await settle(pk.page, 150);
  backend.failures = { updateParkingLot: '車位寫入失敗' };
  await save(pk.page);
  eq(G, '§8.5 車位失敗：戶別已寫入', updates().length, 1);
  check(G, '§8.5 車位失敗：提示失敗原因', pk.alerts.some(a => a.includes('車位寫入失敗')), JSON.stringify(pk.alerts));
  backend.failures = {};
  pk.alerts.length = 0;
  await save(pk.page);
  check(G, '§8.5 車位失敗後重試：不誤報他人修改', !pk.alerts.some(a => a.includes('其他人修改')), JSON.stringify(pk.alerts));
  eq(G, '§8.5 車位失敗後重試：戶別再寫一次', updates().length, 2);
  check(G, '§8.5 車位失敗後重試：沒改繳款紀錄就不再送', !('paymentRecords' in updates().at(-1).payload.data), '');
  check(G, '§8.5 車位失敗後重試：車位有同步', backend.parkingWrites.length >= 1, JSON.stringify(backend.parkingWrites.length));
  check(G, '§8.5 車位失敗後重試：成功收尾', (await pk.page.evaluate(() => window.__modalEvents)).includes('data-updated'), JSON.stringify(await pk.page.evaluate(() => window.__modalEvents)));
  await pk.close();

  // 7g. 車位失敗後又改了繳款紀錄再存：基準已更新，不誤報
  backend.reset();
  const pk2 = await openModal({ editing: 1, unit: 'M3' });
  await toPayments(pk2.page);
  const pk2Cards = () => pk2.page.locator('section[aria-label="預計繳款"] .pr-edit-card');
  await pk2Cards().first().locator('input[aria-label="備註"]').fill('第一次');
  await settle(pk2.page, 150);
  backend.failures = { updateParkingLot: '車位寫入失敗' };
  await save(pk2.page);
  backend.failures = {};
  pk2.alerts.length = 0;
  await pk2Cards().first().locator('input[aria-label="備註"]').fill('第二次');
  await settle(pk2.page, 150);
  await save(pk2.page);
  check(G, '§8.5 車位失敗後再改繳款紀錄：不誤報且寫入', !pk2.alerts.some(a => a.includes('其他人修改')) && updates().length === 2 && updates().at(-1).payload.data.paymentRecords?.some(r => r.note === '第二次'), JSON.stringify(pk2.alerts));
  await pk2.close();

  // 7h. 車位寫入失敗後重試：保留暫存選擇與動過的車位，重試要補齊；可連續失敗、可改選、可取消
  const RETRY_ALERT = '車位寫入失敗，戶別資料已儲存，請再按一次儲存重試';
  const openDeal = modalOpenDeal;
  const addSpot = modalAddSpot;
  const removeSpot = async (page, spotId) => {
    await page.locator('.parking-spot-card', { hasText: spotId }).locator('.parking-spot-remove').click();
    await settle(page, 300);
  };
  // 目前資料庫裡 B2 車位的歸屬（pk2=P-301、pk3=P-302、pk4=P-303）
  const owners = () => Object.fromEntries([...backend.parkingState].filter(([id]) => !['pk0', 'pk1'].includes(id)).map(([id, p]) => [id, p.buyerUnitId || null]));
  const modalEvents = page => page.evaluate(() => window.__modalEvents);
  const pushParkings = page => page.evaluate(list => window.__setModalParkings(list), [...backend.parkingState].map(([id, p]) => ({ id, ...p, updatedAt: null })));
  const NOTIFY_TITLE = page => page.locator('.v-dialog.v-overlay--active .v-card-title', { hasText: '銷控通知' });
  const P303 = [{ projectId: 'p1', spotId: 'P-303', floor: 'B2', price_list: 80, price_floor: 60 }];

  // 全部失敗（第一筆就失敗，車位都沒動）；連續失敗兩次後成功
  backend.reset();
  const allFail = await openModal({ editing: 1, unit: 'M3' });
  await openDeal(allFail.page);
  await addSpot(allFail.page, 'P-302');
  backend.failures = { updateParkingLot: '網路逾時' };
  await save(allFail.page);
  check(G, '車位全部失敗：提示戶別已存、可重試與原因', allFail.alerts.length === 1 && allFail.alerts[0].includes(RETRY_ALERT) && allFail.alerts[0].includes('網路逾時'), JSON.stringify(allFail.alerts));
  eq(G, '車位全部失敗：車位都沒動', owners(), { pk2: 'M3', pk3: null });
  eq(G, '車位全部失敗：戶別已寫入一次', updates().length, 1);
  check(G, '車位全部失敗：停在編輯畫面、不算完成', (await allFail.page.getByRole('button', { name: '儲存變更' }).first().isVisible()) && !(await modalEvents(allFail.page)).includes('data-updated'), JSON.stringify(await modalEvents(allFail.page)));
  eq(G, '車位全部失敗：畫面保留新選的車位', await allFail.page.locator('.parking-spot-card', { hasText: 'P-302' }).count(), 1);
  allFail.alerts.length = 0;
  await save(allFail.page);
  check(G, '車位連續失敗：再次提示可重試', allFail.alerts.length === 1 && allFail.alerts[0].includes(RETRY_ALERT), JSON.stringify(allFail.alerts));
  backend.failures = {};
  allFail.alerts.length = 0;
  await save(allFail.page);
  eq(G, '車位寫入失敗後重試：新選的車位仍要寫入', owners(), { pk2: 'M3', pk3: 'M3' });
  eq(G, '車位失敗後重試：沒有 alert', allFail.alerts, []);
  check(G, '車位失敗後重試：成功收尾', (await modalEvents(allFail.page)).includes('data-updated'), JSON.stringify(await modalEvents(allFail.page)));
  eq(G, '車位失敗後重試：成交總價含新車位（2000+120+90）', Number(updates().at(-1).payload.data.price_transaction_total), 2210);
  await allFail.close();

  // 部分失敗：新車位那筆失敗
  backend.reset();
  const partA = await openModal({ editing: 1, unit: 'M3' });
  await openDeal(partA.page);
  await addSpot(partA.page, 'P-302');
  backend.parkingFail = (docId, data) => docId === 'pk3' && data.buyerUnitId === 'M3';
  await save(partA.page);
  check(G, '車位部分失敗（新車位）：提示可重試', partA.alerts.some(a => a.includes(RETRY_ALERT)), JSON.stringify(partA.alerts));
  eq(G, '車位部分失敗（新車位）：原車位已寫回、新車位還沒', owners(), { pk2: 'M3', pk3: null });
  backend.parkingFail = null;
  partA.alerts.length = 0;
  await save(partA.page);
  eq(G, '車位部分失敗（新車位）後重試：兩個都綁定', owners(), { pk2: 'M3', pk3: 'M3' });
  eq(G, '車位部分失敗（新車位）後重試：沒有 alert', partA.alerts, []);
  await partA.close();

  // 部分失敗：舊關聯已解除、寫回失敗（最危險：車位暫時沒有歸屬）
  backend.reset();
  const partB = await openModal({ editing: 1, unit: 'M3' });
  await openDeal(partB.page);
  await addSpot(partB.page, 'P-302');
  backend.parkingFail = (docId, data) => docId === 'pk2' && data.buyerUnitId === 'M3';
  await save(partB.page);
  eq(G, '車位部分失敗（舊關聯已解除）：原車位暫時無歸屬', owners(), { pk2: null, pk3: null });
  backend.parkingFail = null;
  partB.alerts.length = 0;
  await save(partB.page);
  eq(G, '車位部分失敗（舊關聯已解除）後重試：補回', owners(), { pk2: 'M3', pk3: 'M3' });
  await partB.close();

  // 同上，但重試前上層即時監聽已把車位資料刷新（原車位已不屬於本戶）
  backend.reset();
  const partC = await openModal({ editing: 1, unit: 'M3' });
  await openDeal(partC.page);
  await addSpot(partC.page, 'P-302');
  backend.parkingFail = (docId, data) => docId === 'pk2' && data.buyerUnitId === 'M3';
  await save(partC.page);
  await pushParkings(partC.page);
  await settle(partC.page, 300);
  backend.parkingFail = null;
  await save(partC.page);
  eq(G, '車位失敗、資料已刷新後重試：仍補回', owners(), { pk2: 'M3', pk3: 'M3' });
  await partC.close();

  // 重試前改選：上次已綁的車位要解除
  backend.reset({ extraParkings: P303 });
  const reselect = await openModal({ editing: 1, unit: 'M3' });
  await openDeal(reselect.page);
  await removeSpot(reselect.page, 'P-301');
  await addSpot(reselect.page, 'P-302');
  await addSpot(reselect.page, 'P-303');
  backend.parkingFail = (docId, data) => docId === 'pk4' && data.buyerUnitId === 'M3';
  await save(reselect.page);
  eq(G, '重試前改選：第一次已解除舊車位、綁了一個新車位', owners(), { pk2: null, pk3: 'M3', pk4: null });
  backend.parkingFail = null;
  await removeSpot(reselect.page, 'P-302');
  reselect.alerts.length = 0;
  await save(reselect.page);
  eq(G, '重試前改選：上次綁的車位解除、只綁新選的', owners(), { pk2: null, pk3: null, pk4: 'M3' });
  eq(G, '重試前改選：沒有 alert', reselect.alerts, []);
  await reselect.close();

  // 重試前該車位已被別戶買走：不可解除別戶的車位
  backend.reset({ extraParkings: P303 });
  const taken = await openModal({ editing: 1, unit: 'M3' });
  await openDeal(taken.page);
  await removeSpot(taken.page, 'P-301');
  await addSpot(taken.page, 'P-302');
  await addSpot(taken.page, 'P-303');
  backend.parkingFail = (docId, data) => docId === 'pk4' && data.buyerUnitId === 'M3';
  await save(taken.page);
  backend.parkingFail = null;
  backend.parkingState.set('pk3', { ...backend.parkingState.get('pk3'), buyerUnitId: 'B9' });
  await pushParkings(taken.page);
  await settle(taken.page, 300);
  await removeSpot(taken.page, 'P-302');
  backend.parkingWrites = [];
  await save(taken.page);
  eq(G, '重試前車位被別戶買走：不動別戶的車位', [owners(), backend.parkingWrites.filter(w => w.docId === 'pk3').length], [{ pk2: null, pk3: 'B9', pk4: 'M3' }, 0]);
  await taken.close();

  // 失敗後取消編輯：暫存選擇與待發通知都清掉，下次編輯不會帶到
  const STATUS_NOTIFY = { statusChanged: true, oldStatus: '補足', newStatus: '簽約', eligibleRecipients: [{ userKey: 'u9', name: '通知對象甲', email: 'a@example.com', hasLine: true, hasEmail: true }] };
  backend.reset();
  const cancelled = await openModal({ editing: 1, unit: 'M3' });
  await openDeal(cancelled.page);
  await addSpot(cancelled.page, 'P-302');
  backend.salesNotification = STATUS_NOTIFY;
  backend.failures = { updateParkingLot: '網路逾時' };
  await save(cancelled.page);
  backend.failures = {};
  await cancelled.page.getByRole('button', { name: '取消編輯' }).click();
  await settle(cancelled.page, 500);
  await cancelled.page.locator('.v-dialog.v-overlay--active').getByRole('button', { name: '修改銷控' }).first().click();
  await settle(cancelled.page, 900);
  await openDeal(cancelled.page);
  eq(G, '失敗後取消編輯：再次編輯不帶上次選的車位', await cancelled.page.locator('.parking-spot-card', { hasText: 'P-302' }).count(), 0);
  backend.parkingWrites = [];
  cancelled.alerts.length = 0;
  await save(cancelled.page);
  check(G, '失敗後取消編輯：再存不寫入上次選的車位', backend.parkingWrites.every(w => w.docId !== 'pk3') && owners().pk3 === null, JSON.stringify(backend.parkingWrites.map(w => [w.docId, w.dataToUpdate?.buyerUnitId])));
  eq(G, '失敗後取消編輯：不殘留狀態通知', await NOTIFY_TITLE(cancelled.page).count(), 0);
  eq(G, '失敗後取消編輯：再存沒有 alert', cancelled.alerts, []);
  await cancelled.close();

  // 狀態通知時機：車位成功才開通知；重試時後端比對不出變更，要用第一次記住的通知
  backend.reset();
  const notify = await openModal({ editing: 1, unit: 'M3' });
  await openDeal(notify.page);
  await addSpot(notify.page, 'P-302');
  backend.salesNotification = STATUS_NOTIFY;
  backend.failures = { updateParkingLot: '網路逾時' };
  await save(notify.page);
  eq(G, '狀態通知：車位失敗時不開通知', await NOTIFY_TITLE(notify.page).count(), 0);
  await save(notify.page);
  eq(G, '狀態通知：再次失敗仍不開', await NOTIFY_TITLE(notify.page).count(), 0);
  backend.failures = {};
  await save(notify.page);
  eq(G, '狀態通知：車位成功後才開', await NOTIFY_TITLE(notify.page).count(), 1);
  check(G, '狀態通知：內容是第一次的狀態與收件人', await notify.page.locator('.v-dialog.v-overlay--active', { hasText: '銷控通知' }).evaluate(el => el.innerText.includes('通知對象甲') && el.innerText.includes('簽約')), '');
  check(G, '狀態通知：開啟時尚未通知上層', !(await modalEvents(notify.page)).includes('data-updated'), JSON.stringify(await modalEvents(notify.page)));
  await notify.page.locator('.v-dialog.v-overlay--active').getByRole('button', { name: '本次不通知' }).click();
  await settle(notify.page, 500);
  check(G, '狀態通知：不通知後完成收尾', (await modalEvents(notify.page)).includes('data-updated') && (await NOTIFY_TITLE(notify.page).count()) === 0, JSON.stringify(await modalEvents(notify.page)));
  await notify.close();

  // 回歸：車位沒失敗時通知照常直接開
  backend.reset();
  const notifyOk = await openModal({ editing: 1, unit: 'M3' });
  backend.salesNotification = STATUS_NOTIFY;
  await save(notifyOk.page);
  eq(G, '狀態通知回歸：車位成功直接開通知', await NOTIFY_TITLE(notifyOk.page).count(), 1);
  await notifyOk.close();

  // 手機版：失敗後重試
  backend.reset();
  const mobileRetry = await openModal({ editing: 1, unit: 'M3' }, { width: 390 });
  await modalOpenDeal(mobileRetry.page);
  await modalAddSpot(mobileRetry.page, 'P-302');
  backend.failures = { updateParkingLot: '網路逾時' };
  await modalSave(mobileRetry.page);
  check(G, '手機版車位失敗：提示可重試', mobileRetry.alerts.some(a => a.includes(RETRY_ALERT)), JSON.stringify(mobileRetry.alerts));
  backend.failures = {};
  await modalSave(mobileRetry.page);
  eq(G, '手機版車位失敗後重試：車位寫入', owners(), { pk2: 'M3', pk3: 'M3' });
  await mobileRetry.close();
  // 證據：手機版房屋成交價輸入框的可用寬度（4 位數已超出 2px，較長的數字看不完整）
  backend.reset();
  const narrowPrice = await openModal({ editing: 1, unit: 'M3' }, { width: 390 });
  await modalOpenDeal(narrowPrice.page);
  const priceInput = narrowPrice.page.locator('.price-grid-input input').first();
  await priceInput.scrollIntoViewIfNeeded();
  await settle(narrowPrice.page, 300);
  await evidence(narrowPrice.page, 'price-input-2000-390');
  await priceInput.fill('12345.5');
  await settle(narrowPrice.page, 300);
  await evidence(narrowPrice.page, 'price-input-long-390');
  await narrowPrice.close();

  // 不改價直接存：舊資料的成交總價過時，存入即時總價，不跳價格確認
  const staleTotal = () => {
    const key = 'salesHouseholds/p1_M3';
    backend.db.store.set(key, { ...backend.db.store.get(key), price_transaction_total: 999 });
  };
  const priceDialogCount = page => page.locator('.v-dialog.v-overlay--active', { hasText: '確認變更價格' }).count();
  const savedTotal = () => Number(updates().at(-1)?.payload?.data?.price_transaction_total);
  backend.reset();
  staleTotal();
  const staleDirect = await openModal({ editing: 1, unit: 'M3' });
  await save(staleDirect.page);
  eq(G, '不改價直接存：寫入即時總價（2000+120）', savedTotal(), 2120);
  eq(G, '不改價直接存：不跳價格確認、沒有 alert', [await priceDialogCount(staleDirect.page), staleDirect.alerts], [0, []]);
  await staleDirect.close();
  backend.reset();
  staleTotal();
  const staleView = await openModal({ unit: 'M3' });
  await staleView.page.locator('.v-dialog.v-overlay--active').getByRole('button', { name: '修改銷控' }).first().click();
  await settle(staleView.page, 900);
  await save(staleView.page);
  eq(G, '從檢視按修改銷控後直接存：寫入即時總價', savedTotal(), 2120);
  eq(G, '從檢視按修改銷控後直接存：不跳價格確認', await priceDialogCount(staleView.page), 0);
  await staleView.close();
  backend.reset();
  staleTotal();
  const staleAgain = await openModal({ editing: 1, unit: 'M3' });
  await staleAgain.page.getByRole('button', { name: '取消編輯' }).click();
  await settle(staleAgain.page, 500);
  await staleAgain.page.locator('.v-dialog.v-overlay--active').getByRole('button', { name: '修改銷控' }).first().click();
  await settle(staleAgain.page, 900);
  await save(staleAgain.page);
  eq(G, '取消編輯再進來直接存：寫入即時總價', savedTotal(), 2120);
  eq(G, '取消編輯再進來直接存：不跳價格確認', await priceDialogCount(staleAgain.page), 0);
  await staleAgain.close();

  // 配套提示：用即時成交總價，不是舊資料的 price_transaction_total
  backend.reset();
  staleTotal();
  const pkg = await openModal({ editing: 1, unit: 'M3' });
  const toPrice = async () => { await pkg.page.locator('.edit-nav-item', { hasText: '價格設定' }).click(); await settle(pkg.page, 300); };
  const pkgHint = async () => { await settle(pkg.page, 500); return (await pkg.page.locator('.input-price-package .v-messages').innerText()).trim(); }; // 等訊息切換動畫結束
  await toPrice();
  eq(G, '配套提示：未填', await pkgHint(), '避開高價住宅門檻時填寫，未填則不啟用配套拆分');
  await pkg.page.getByRole('button', { name: '修改價格' }).click();
  await settle(pkg.page, 200);
  await pkg.page.locator('.input-price-package input').fill('1800');
  await settle(pkg.page, 200);
  eq(G, '配套提示：填 1800（2120−1800，不用過時的 999）', await pkgHint(), '配套價格: 320.00 萬（成交總價 2,120.00 − 配套房屋總價）');
  await openDeal(pkg.page);
  await pkg.page.locator('.price-grid-input input').first().fill('3000');
  await settle(pkg.page, 200);
  await toPrice();
  eq(G, '配套提示：改房屋價後更新', await pkgHint(), '配套價格: 1,320.00 萬（成交總價 3,120.00 − 配套房屋總價）');
  await openDeal(pkg.page);
  await addSpot(pkg.page, 'P-302');
  await toPrice();
  eq(G, '配套提示：加車位後更新', await pkgHint(), '配套價格: 1,410.00 萬（成交總價 3,210.00 − 配套房屋總價）');
  await pkg.page.locator('.input-price-package input').fill('');
  await settle(pkg.page, 200);
  eq(G, '配套提示：清空回到未填', await pkgHint(), '避開高價住宅門檻時填寫，未填則不啟用配套拆分');
  await pkg.close();

  // 7i. 修改銷控的繳款比例：改價、選車位即時更新；SalesInfoForm 的房屋與車位總價不變
  backend.reset();
  const tabRatio = await openModal({ tab: 'payments', unit: 'M3' });
  eq(G, '比例：檢視分頁基準（90 萬 / 2120 萬）', (await tabRatio.page.locator('.pr-stat', { hasText: '繳款比例' }).first().innerText()).replace(/\s+/g, ' '), '繳款比例 4.2%');
  await tabRatio.close();
  backend.reset();
  const live = await openModal({ editing: 1, unit: 'M3' });
  const ratioText = async () => (await live.page.locator('.pr-stat', { hasText: '繳款比例' }).first().innerText()).replace(/\s+/g, ' ');
  const dealSummary = () => live.page.locator('.edit-nav-item', { hasText: '成交資訊' }).locator('.edit-nav-summary').innerText();
  const priceNums = async () => live.page.locator('.price-grid-cell--sale .price-grid-num').allInnerTexts().then(l => l.map(x => x.replace(/\s+/g, ' ').trim()));
  eq(G, '比例：導覽摘要用即時成交總價', (await dealSummary()).trim(), '成交總價 2,120 萬');
  await toPayments(live.page);
  eq(G, '比例：初始（90 萬 / 2120 萬）', await ratioText(), '繳款比例 4.2%');
  await openDeal(live.page);
  eq(G, '回歸：房屋與車位總價（房屋 2000＋車位 120）', (await priceNums()).slice(-2), ['120 萬', '2,120 萬']);
  await live.page.locator('.price-grid-input input').first().fill('3000');
  await settle(live.page, 200);
  eq(G, '改價後成交總價', (await dealSummary()).trim(), '成交總價 3,120 萬');
  eq(G, '回歸：改價後合計', (await priceNums()).slice(-1), ['3,120 萬']);
  await toPayments(live.page);
  eq(G, '比例：改價後即時更新（90 / 3120）', await ratioText(), '繳款比例 2.9%');
  await openDeal(live.page);
  await addSpot(live.page, 'P-302');
  eq(G, '選車位後成交總價（加 P-302 表價 90）', (await dealSummary()).trim(), '成交總價 3,210 萬');
  eq(G, '回歸：選車位後車位與合計', (await priceNums()).slice(-2), ['210 萬', '3,210 萬']);
  await toPayments(live.page);
  eq(G, '比例：選車位後即時更新（90 / 3210）', await ratioText(), '繳款比例 2.8%');
  await openDeal(live.page);
  await live.page.locator('.parking-spot-card', { hasText: 'P-301' }).locator('.parking-spot-remove').click();
  await settle(live.page, 300);
  eq(G, '移除車位後成交總價', (await dealSummary()).trim(), '成交總價 3,090 萬');
  await toPayments(live.page);
  eq(G, '比例：移除車位後即時更新（90 / 3090）', await ratioText(), '繳款比例 2.9%');
  await live.close();

  // 7j. 同一次編輯：paidAt／paidBy 與內部欄位
  const noInternalKeys = records => records.every(r => !Object.keys(r).some(k => k.startsWith('_')));
  const sortedJson = value => JSON.stringify(Object.keys(value).sort().map(k => [k, value[k]]));
  const fixtureOf = id => unitFixtures().M1.paymentRecords.find(r => r.id === id);
  const cardByNote = async (page, sectionLabel, note) => {
    const cards = page.locator(`section[aria-label="${sectionLabel}"] .pr-edit-card`);
    for (let i = 0; i < await cards.count(); i += 1) {
      const card = cards.nth(i);
      // 舊資料的備註等於期別名稱時，編輯畫面視為期別，備註欄是空的
      const noteValue = await card.locator('input[aria-label="備註"]').inputValue();
      const period = (await card.locator('.ppf-select .v-select__selection-text').innerText()).trim();
      if (noteValue === note || period === note) return card;
    }
    throw new Error(`找不到 ${sectionLabel}「${note}」`);
  };
  const confirmMarkPaid = async (page) => {
    await settle(page);
    await clickDialogButton(page, '確認已繳');
    await settle(page, 400);
  };

  // 新增預計後標記已繳
  backend.reset();
  const sameEdit = await openModal({ editing: 1 });
  await toPayments(sameEdit.page);
  await sameEdit.page.locator('.pr-actions').getByRole('button', { name: '預計繳款', exact: true }).click();
  await settle(sameEdit.page, 200);
  const sameCard = sameEdit.page.locator('section[aria-label="預計繳款"] .pr-edit-card').last();
  await sameCard.locator('input[aria-label="預計日"]').fill(addDays(6));
  await sameCard.locator('input[aria-label="預計金額"]').fill('77000');
  await sameCard.locator('input[aria-label="備註"]').fill('同次新增');
  await settle(sameEdit.page, 150);
  await (await cardByNote(sameEdit.page, '預計繳款', '同次新增')).getByRole('button', { name: '標記已繳' }).click();
  await confirmMarkPaid(sameEdit.page);
  await save(sameEdit.page);
  const sameRecords = updates().at(-1)?.payload?.data?.paymentRecords || [];
  const sameSaved = sameRecords.find(r => r.note === '同次新增');
  check(G, '同次編輯：新增預計後標記已繳，寫入 paidAt、paidBy', sameSaved && sameSaved.date === TODAY && sameSaved.amount === 77000 && sameSaved.expectedDate === addDays(6) && !!sameSaved.paidAt && sameSaved.paidBy === '管理甲', JSON.stringify(sameSaved));
  check(G, '同次編輯：不寫出 _ 開頭欄位', sameRecords.length > 0 && noInternalKeys(sameRecords), JSON.stringify(sameRecords.map(r => Object.keys(r).filter(k => k.startsWith('_')))));
  for (const id of ['d_early', 'd_late', 'd_same', 'legacy1', 'p_far']) {
    eq(G, `沒操作的紀錄不動：${id}`, sortedJson(sameRecords.find(r => r.id === id) || {}), sortedJson(fixtureOf(id)));
  }
  await sameEdit.close();

  // 改回預計後再標記已繳
  backend.reset();
  const again = await openModal({ editing: 1 });
  await toPayments(again.page);
  await (await cardByNote(again.page, '已繳款', '簽約款')).getByRole('button', { name: '改回預計' }).click();
  await settle(again.page);
  await clickDialogButton(again.page, '改回預計');
  await settle(again.page, 300);
  await (await cardByNote(again.page, '預計繳款', '簽約款')).getByRole('button', { name: '標記已繳' }).click();
  await confirmMarkPaid(again.page);
  await save(again.page);
  const againRecords = updates().at(-1)?.payload?.data?.paymentRecords || [];
  const againSaved = againRecords.find(r => r.id === 'd_late');
  check(G, '同次編輯：改回預計後再標記已繳，重新寫入 paidAt、paidBy', againSaved && againSaved.date === TODAY && againSaved.amount === 600000 && againSaved.expectedDate === addDays(-13) && !!againSaved.paidAt && againSaved.paidAt !== fixtureOf('d_late').paidAt && againSaved.paidBy === '管理甲', JSON.stringify(againSaved));
  check(G, '改回再標記：不寫出 _ 開頭欄位', againRecords.length > 0 && noInternalKeys(againRecords), JSON.stringify(againRecords.map(r => Object.keys(r).filter(k => k.startsWith('_')))));
  eq(G, '改回再標記：沒操作的紀錄不動', sortedJson(againRecords.find(r => r.id === 'd_same') || {}), sortedJson(fixtureOf('d_same')));
  await again.close();

  // 一般修改已繳不誤寫
  backend.reset();
  const plainEdit = await openModal({ editing: 1 });
  await toPayments(plainEdit.page);
  await (await cardByNote(plainEdit.page, '已繳款', '訂金')).locator('input[aria-label="備註"]').fill('訂金（改）');
  await (await cardByNote(plainEdit.page, '已繳款', '舊資料補足款')).locator('input[aria-label="實繳金額"]').fill('60000');
  await (await cardByNote(plainEdit.page, '已繳款', '簽約款')).locator('input[aria-label="備註"]').fill('簽約款（改）');
  await settle(plainEdit.page, 150);
  await save(plainEdit.page);
  const plainRecords = updates().at(-1)?.payload?.data?.paymentRecords || [];
  const plainSame = plainRecords.find(r => r.id === 'd_same');
  const plainLegacy = plainRecords.find(r => r.id === 'legacy1');
  const plainLate = plainRecords.find(r => r.id === 'd_late');
  check(G, '一般修改已繳：有預計日但沒 paidAt 的不誤寫', plainSame?.note === '訂金（改）' && !plainSame.paidAt && !plainSame.paidBy, JSON.stringify(plainSame));
  check(G, '一般修改已繳：舊資料不誤寫', plainLegacy?.amount === 60000 && !('paidAt' in plainLegacy) && !('paidBy' in plainLegacy), JSON.stringify(plainLegacy));
  check(G, '一般修改已繳：既有 paidAt、paidBy 不變', plainLate?.note === '簽約款（改）' && plainLate.paidAt === fixtureOf('d_late').paidAt && plainLate.paidBy === fixtureOf('d_late').paidBy, JSON.stringify(plainLate));
  check(G, '一般修改已繳：不寫出 _ 開頭欄位', plainRecords.length > 0 && noInternalKeys(plainRecords), '');
  await plainEdit.close();

  // 8. 戶別分頁：真實 handler
  backend.reset();
  const tabView = await openModal({ tab: 'payments' });
  check(G, '戶別分頁預設展開', await tabView.page.locator('.pr-body').first().isVisible(), '');
  await tabView.page.locator('.pr-actions').getByRole('button', { name: '預計繳款', exact: true }).click();
  await settle(tabView.page);
  const qd = dialog(tabView.page);
  await qd.locator('input[aria-label="預計日"]').fill(addDays(15));
  await qd.locator('input[aria-label="預計金額"]').fill('111111');
  await qd.locator('input[aria-label="備註"]').fill('分頁新增');
  await clickDialogButton(tabView.page, '儲存');
  await settle(tabView.page, 500);
  const tabAdd = lastCall('paymentProofApi', 'addRecord');
  eq(G, '分頁新增參數', { date: tabAdd.date, amount: tabAdd.amount, expectedDate: tabAdd.expectedDate, expectedAmount: tabAdd.expectedAmount, planSource: tabAdd.planSource, paidBy: tabAdd.paidBy, silent: tabAdd.silent }, { date: '', amount: null, expectedDate: addDays(15), expectedAmount: 111111, planSource: 'manual', paidBy: '管理甲' });
  await tabView.page.locator('section[aria-label="預計繳款"] .pr-row', { hasText: '分頁新增' }).getByRole('button', { name: '標記已繳' }).click();
  await settle(tabView.page);
  await dialog(tabView.page).getByLabel('實繳金額').fill('100000');
  await settle(tabView.page, 100);
  await dialog(tabView.page).getByLabel('預計日').fill(addDays(30));
  await clickDialogButton(tabView.page, '確認已繳');
  await settle(tabView.page, 600);
  const tabUp = lastCall('paymentProofApi', 'updateRecord');
  eq(G, '分頁標記已繳參數：不帶預計欄位', { date: tabUp.date, amount: tabUp.amount, paidBy: tabUp.paidBy, sentExpected: 'expectedDate' in tabUp || 'expectedAmount' in tabUp }, { date: TODAY, amount: 100000, paidBy: '管理甲', sentExpected: false });
  const tabStored = backend.db.store.get('salesHouseholds/p1_M1').paymentRecords.find(r => r.note === '分頁新增');
  eq(G, '分頁標記已繳：後端保留預計', [tabStored.expectedDate, tabStored.expectedAmount, tabStored.date, tabStored.amount], [addDays(15), 111111, TODAY, 100000]);
  eq(G, '分頁差額參數', [lastCall('paymentProofApi', 'addRecord').note, lastCall('paymentProofApi', 'addRecord').planSource, lastCall('paymentProofApi', 'addRecord').expectedAmount], ['分頁新增 尾款', 'balance', 11111]);
  check(G, '分頁連續操作後通知父層刷新', (await tabView.page.evaluate(() => window.__modalEvents)).includes('data-updated'), '');
  await tabView.close();
});

// ─────────────── T13 銷控系統（真實 SalesControlSystem）───────────────
async function openSales(opts) {
  const handle = await open({ view: 'sales' }, opts);
  await handle.page.waitForSelector('.sales-control-page', { timeout: 60000 });
  await handle.page.waitForFunction(() => document.querySelectorAll('.unit-card').length > 0, null, { timeout: 60000 });
  await settle(handle.page, 600);
  return handle;
}
const salesToList = async (page) => {
  const desktop = page.locator('.toolbar .v-btn', { hasText: '列表' });
  if (await desktop.isVisible().catch(() => false)) await desktop.click();
  else await page.locator('.v-btn', { hasText: '列表' }).last().click();
  await page.waitForSelector('.list-view-container table');
  await settle(page, 500);
};
// 把列表捲到新欄位（下次預計繳款日、待繳金額）
const scrollToDueColumns = page => page.evaluate(() => {
  const wrapper = document.querySelector('.list-view-container .v-table__wrapper');
  const th = [...wrapper.querySelectorAll('thead th')].find(x => x.innerText.includes('下次預計繳款日'));
  wrapper.scrollLeft = th.offsetLeft - 260;
});
const salesTable = page => page.evaluate(() => {
  const ths = [...document.querySelectorAll('.list-view-container thead th')].map(th => th.innerText.trim());
  const rows = [...document.querySelectorAll('.list-view-container tbody tr')].filter(tr => tr.children.length === ths.length).map(tr => ({
    summary: tr.classList.contains('summary-row'),
    cells: [...tr.children].map(td => td.innerText.trim().replace(/\s+/g, ' ')),
    dueTag: tr.querySelector('.next-due-cell .mac-tag')?.className || '',
  }));
  return { ths, rows };
});

group('T13', async () => {
  const G = 'T13 銷控系統';
  backend.reset();
  const { page, close } = await openSales();
  check(G, '真實掛載成功，網格有戶別', (await page.locator('.unit-card').count()) >= 8, String(await page.locator('.unit-card').count()));

  // 桌機快速選單副標
  await page.locator('.unit-card', { hasText: 'A1' }).first().click({ button: 'right' });
  await settle(page, 400);
  const menuItem = page.locator('.unit-quick-menu .v-list-item', { hasText: '繳款紀錄' });
  eq(G, '桌機快速選單副標', (await menuItem.locator('.v-list-item-subtitle').innerText()).trim(), `已繳 4%・下次 ${md(addDays(-7))}`);
  await page.keyboard.press('Escape');
  await settle(page, 300);

  // 列表
  await salesToList(page);
  let table = await salesTable(page);
  const nextCol = table.ths.indexOf('下次預計繳款日');
  const pendingCol = table.ths.indexOf('待繳金額(萬)');
  const ratioCol = table.ths.indexOf('繳款比例');
  check(G, '列表有「下次預計繳款日」「待繳金額」欄', nextCol >= 0 && pendingCol >= 0, table.ths.join(','));
  const unitCol = table.ths.findIndex(t => t.includes('戶別'));
  const row = (t, unitId) => t.rows.find(r => !r.summary && r.cells[unitCol] === unitId);
  const A1 = row(table, 'A1');
  eq(G, '逾期戶：日期與標籤', A1?.cells[nextCol], `${slash(addDays(-7))} 逾期 7 天`);
  check(G, '逾期戶：紅色標籤', /mac-tag--red/.test(A1?.dueTag || ''), A1?.dueTag);
  eq(G, 'A1 待繳金額', A1?.cells[pendingCol], '80');
  const A3 = row(table, 'A3');
  eq(G, '未到期戶：日期與標籤', A3?.cells[nextCol], `${slash(addDays(25))} 剩 25 天`);
  check(G, '未到期戶：不是紅或橘', !/mac-tag--(red|orange)/.test(A3?.dueTag || ''), A3?.dueTag);
  const A9 = row(table, 'A9');
  check(G, '即將到期戶：橘色標籤', /mac-tag--orange/.test(A9?.dueTag || ''), A9?.dueTag);
  const B1 = row(table, 'B1');
  eq(G, '沒有預計的戶別顯示 -', [B1?.cells[nextCol], B1?.cells[pendingCol]], ['-', '-']);
  // 繳款比例不受預計影響：B2 只有預計，沒有已繳紀錄就不顯示比例
  eq(G, '只有預計的戶別不顯示繳款比例', row(table, 'B2')?.cells[ratioCol], '-');

  // 兩行內容（日期＋標籤）不可被列高切掉
  await scrollToDueColumns(page);
  await settle(page, 200);
  const clipped = await page.evaluate(() => [...document.querySelectorAll('.next-due-cell')].map((cell) => {
    const td = cell.closest('td');
    const tag = cell.querySelector('.mac-tag').getBoundingClientRect();
    const box = td.getBoundingClientRect();
    return tag.top < box.top - 0.5 || tag.bottom > box.bottom + 0.5;
  }).filter(Boolean).length);
  eq(G, '下次預計繳款日：標籤沒有被列高切掉', clipped, 0);

  // 合計列
  const summaryRows = table.rows.filter(r => r.summary);
  check(G, '合計列存在', summaryRows.length >= 1, JSON.stringify(table.rows.length));
  const pendingExpected = LIST_UNITS.reduce((sum, unitId) => sum + unitFixtures()[unitId].paymentRecords.filter(r => !r.date).reduce((s, r) => s + (Number(r.expectedAmount) || 0), 0), 0) / 10000;
  const summaryPending = Number((summaryRows[0]?.cells[pendingCol] || '').replace(/,/g, ''));
  check(G, '合計列待繳金額等於各戶加總', Math.abs(summaryPending - pendingExpected) < 1, `合計列 ${summaryRows[0]?.cells[pendingCol]}，預期約 ${pendingExpected}`);

  // 排序
  const headerCell = page.locator('.list-view-container thead th', { hasText: '下次預計繳款日' });
  await headerCell.click();
  await settle(page, 400);
  table = await salesTable(page);
  const dates = table.rows.filter(r => !r.summary).map(r => r.cells[nextCol].split(' ')[0]);
  const withDates = dates.filter(d => d !== '-');
  check(G, '排序遞增：日期由早到晚', withDates.join() === [...withDates].sort().join(), dates.join());
  check(G, '排序遞增：沒有預計的排最後', dates.indexOf('-') === withDates.length, dates.join());
  await headerCell.click();
  await settle(page, 400);
  table = await salesTable(page);
  const datesDesc = table.rows.filter(r => !r.summary).map(r => r.cells[nextCol].split(' ')[0]);
  const withDatesDesc = datesDesc.filter(d => d !== '-');
  check(G, '排序遞減：日期由晚到早', withDatesDesc.join() === [...withDatesDesc].sort().reverse().join(), datesDesc.join());
  known(G, '排序遞減：沒有預計的仍排最後', datesDesc[0] !== '-', datesDesc.join(), '與既有欄位一致');
  await headerCell.click();
  await settle(page, 400);

  // 浮動視窗：點日期開啟
  await page.locator('.list-view-container tbody tr', { hasText: 'A2' }).first().locator('.next-due-cell').click();
  await settle(page, 500);
  const popup = page.locator('.payment-popup-sheet');
  check(G, '點日期開啟浮動視窗', (await popup.locator('.mac-sheet-head').innerText()).includes('A2 繳款紀錄'), '');
  check(G, '浮動視窗預設展開、有帶入合約期款資料', await popup.locator('.pr-body').isVisible() && (await popup.getByRole('button', { name: '帶入合約期款資料' }).count()) === 1, '');

  // 新增預計
  await popup.locator('.pr-actions').getByRole('button', { name: '預計繳款', exact: true }).click();
  await settle(page);
  const add = dialog(page);
  await add.locator('input[aria-label="預計日"]').fill(addDays(2));
  await add.locator('input[aria-label="預計金額"]').fill('70000');
  await add.locator('input[aria-label="備註"]').fill('浮動新增');
  await clickDialogButton(page, '儲存');
  await page.locator('.v-dialog.v-overlay--active .pr-dialog-body').waitFor({ state: 'hidden' });
  await settle(page, 300);
  const popupAdd = lastCall('paymentProofApi', 'addRecord');
  eq(G, '浮動新增參數', { date: popupAdd.date, amount: popupAdd.amount, expectedDate: popupAdd.expectedDate, expectedAmount: popupAdd.expectedAmount, planSource: popupAdd.planSource, unitId: popupAdd.unitId, paidBy: popupAdd.paidBy }, { date: '', amount: null, expectedDate: addDays(2), expectedAmount: 70000, planSource: 'manual', unitId: 'A2', paidBy: '管理甲' });
  check(G, '浮動新增後面板有該筆', (await popup.locator('section[aria-label="預計繳款"] .pr-row', { hasText: '浮動新增' }).count()) === 1, '');
  table = await salesTable(page);
  eq(G, '浮動新增後列表待繳即時更新（25＋7）', row(table, 'A2')?.cells[pendingCol], '32');

  // 標記已繳
  await popup.locator('section[aria-label="預計繳款"] .pr-row', { hasText: '簽約款' }).getByRole('button', { name: '標記已繳' }).click();
  await settle(page);
  eq(G, '浮動標記已繳預帶金額', await dialog(page).getByLabel('實繳金額').inputValue(), '100000');
  await clickDialogButton(page, '確認已繳');
  await settle(page, 600);
  const popupUp = lastCall('paymentProofApi', 'updateRecord');
  eq(G, '浮動標記已繳參數', { recordId: popupUp.recordId, date: popupUp.date, amount: popupUp.amount, paidBy: popupUp.paidBy, sentExpected: 'expectedDate' in popupUp || 'expectedAmount' in popupUp }, { recordId: 'a2_over', date: TODAY, amount: 100000, paidBy: '管理甲', sentExpected: false });
  check(G, '浮動標記已繳後移到已繳區', (await popup.locator('section[aria-label="已繳款"] .pr-row', { hasText: '簽約款' }).count()) === 1, '');
  table = await salesTable(page);
  eq(G, '標記已繳後列表：待繳減少', row(table, 'A2')?.cells[pendingCol], '22');
  eq(G, '標記已繳後列表：下次日期往後', row(table, 'A2')?.cells[nextCol], `${slash(addDays(2))} 剩 2 天`);
  check(G, '標記已繳後列表：繳款比例更新（10 / 1500）', row(table, 'A2')?.cells[ratioCol].replace(/\s/g, '') === '0.7%', row(table, 'A2')?.cells[ratioCol]);

  // 刪除
  await popup.locator('section[aria-label="預計繳款"] .pr-row', { hasText: '浮動新增' }).locator('.pr-more').click();
  await page.locator('.v-menu.v-overlay--active .v-list-item', { hasText: '刪除' }).first().click();
  await settle(page);
  await clickDialogButton(page, '刪除');
  await settle(page, 500);
  eq(G, '浮動刪除 recordId 正確', backend.db.store.get('salesHouseholds/p1_A2').paymentRecords.some(r => r.note === '浮動新增'), false);
  table = await salesTable(page);
  eq(G, '刪除後列表：待繳', row(table, 'A2')?.cells[pendingCol], '15');
  eq(G, '刪除後列表：下次日期', row(table, 'A2')?.cells[nextCol], `${slash(addDays(5))} 剩 5 天`);
  await popup.locator('.mac-sheet-close').click();
  await settle(page, 300);

  // 浮動視窗帶入合約期款：沒有資料 → 開合約製作設定（真實）→ 儲存 → 回來；合約基準要含車位，才不會誤報總價不符
  // 用各期合計剛好等於總價的範本：預設範本的「回饋調整」是負數，合計本來就不等於總價
  backend.templates = [{
    id: 'tpl-balanced', projectId: 'p1', templateName: '合計相符範本', paymentCategory: '一般期款', propertyType: '住家', buyerType: '首購', minPrice: 0, maxPrice: 999999,
    items: [it('頭期款', '總價*10%', { id: 'b1' }), it('尾款', '總價-頭期款', { id: 'b2' })],
  }];
  await page.locator('.list-view-container tbody tr', { hasText: 'A1' }).first().locator('.next-due-cell').click();
  await settle(page, 500);
  await popup.getByRole('button', { name: '帶入合約期款資料' }).click();
  await settle(page, 700);
  const importSheet = page.locator('.pti');
  eq(G, '浮動帶入：沒有資料時引導', (await importSheet.locator('.pti-empty-title').innerText()).trim(), '尚未設定合約期款');
  await importSheet.getByRole('button', { name: '開啟合約製作設定' }).click();
  await settle(page, 2000);
  const popupContract = dialog(page);
  check(G, '浮動帶入：合約製作設定開在帶入視窗上方', (await popupContract.innerText()).includes('合約製作設定 - A1'), (await popupContract.innerText()).slice(0, 80));
  await popupContract.getByRole('button', { name: '儲存', exact: true }).click();
  await settle(page, 500);
  const popupSaved = backend.db.store.get('salesHouseholds/p1_A1').contractDocData;
  eq(G, '浮動帶入：合約基準含車位', popupSaved?.manualRowsBase, 2100);
  await popupContract.getByRole('button', { name: '關閉', exact: true }).last().click();
  await settle(page, 1000);
  check(G, '浮動帶入：關閉合約製作設定後列出期款', (await importSheet.locator('.pti-row').count()) > 0, '');
  eq(G, '浮動帶入：基準一致沒有總價不符警示', await importSheet.locator('.mac-callout--warning').count(), 0);
  eq(G, '浮動帶入：區塊合計含車位', (await importSheet.locator('.pti-section-head').last().innerText()).replace(/\s+/g, ' '), '期款 合計 2,100 萬');
  await dialog(page).getByRole('button', { name: '取消' }).click();
  await settle(page, 300);
  await popup.locator('.mac-sheet-close').click();
  await settle(page, 300);
  backend.templates = undefined;

  // 透視
  await page.locator('.toolbar').getByRole('button', { name: '功能' }).click();
  await settle(page, 300);
  await page.locator('.desktop-tool', { hasText: '資料透視' }).click();
  await settle(page, 800);
  const pivotAdd = page.locator('.pivot-zone', { hasText: '列' }).first().locator('.v-autocomplete input');
  const optionFound = async (input, keyword) => {
    await input.click();
    await input.fill(keyword);
    await settle(page, 300);
    const texts = await page.locator('.v-menu.v-overlay--active .v-list-item').allInnerTexts();
    return texts.map(x => x.trim());
  };
  for (const label of ['下次預計繳款日', '待繳金額(萬)', '逾期筆數', '到期狀態']) {
    const options = await optionFound(pivotAdd, label);
    check(G, `透視列維度可選「${label}」`, options.includes(label), options.join('|'));
    await page.keyboard.press('Escape');
    await settle(page, 150);
    await pivotAdd.fill('');
  }
  const valueInput = page.locator('.pivot-value-entry').first().locator('.v-autocomplete input');
  for (const label of ['待繳金額(萬)', '逾期筆數']) {
    await valueInput.click();
    await valueInput.fill(label);
    await settle(page, 300);
    const texts = await page.locator('.v-menu.v-overlay--active .v-list-item').allInnerTexts();
    check(G, `透視值可選「${label}」`, texts.some(t => t.includes(label)), texts.join('|'));
    await page.keyboard.press('Escape');
    await settle(page, 150);
  }
  // 實際算一次：到期狀態 × 待繳金額
  await pivotAdd.click();
  await pivotAdd.fill('到期狀態');
  await settle(page, 300);
  await page.locator('.v-menu.v-overlay--active .v-list-item', { hasText: '到期狀態' }).first().click();
  await settle(page, 300);
  await page.locator('.pivot-zone', { hasText: '列' }).first().locator('.v-chip', { hasText: '棟' }).locator('.v-chip__close').click().catch(() => {});
  await settle(page, 300);
  await valueInput.click();
  await valueInput.fill('待繳金額');
  await settle(page, 300);
  await page.locator('.v-menu.v-overlay--active .v-list-item', { hasText: '待繳金額' }).first().click();
  await settle(page, 600);
  const pivotText = await page.locator('.pivot-table-wrap').innerText();
  check(G, '透視結果：依到期狀態分列', pivotText.includes('逾期') && pivotText.includes('7 天內') && pivotText.includes('未到期'), pivotText.slice(0, 300));
  await page.screenshot({ path: path.join(SHOT_DIR, 'sales-pivot-1440.png') });
  await page.locator('.v-dialog.v-overlay--active .v-toolbar .v-btn, .v-dialog.v-overlay--active .v-btn').filter({ has: page.locator('.mdi-close') }).first().click().catch(() => {});
  await settle(page, 400);
  await close();

  // 匯出
  backend.reset();
  const exp = await openSales();
  await exp.page.locator('.toolbar').getByRole('button', { name: '功能' }).click();
  await settle(exp.page, 300);
  await exp.page.locator('.desktop-tool', { hasText: '指定戶別下載' }).click();
  await settle(exp.page, 900);
  const exportDialog = dialog(exp.page);
  await exportDialog.getByRole('button', { name: '全選' }).click();
  const columnSearch = exportDialog.locator('input[placeholder="搜尋欄位名稱"]');
  for (const label of ['戶別', '已繳款金額(萬)', '繳款比例(%)', '下次預計繳款日', '待繳金額(萬)', '逾期筆數', '到期狀態']) {
    await columnSearch.fill(label);
    await settle(exp.page, 200);
    const rowLoc = exportDialog.locator('.column-row', { hasText: label }).filter({ has: exp.page.locator('.mdi-magnify') }).first();
    if (label !== '戶別') check(G, `匯出可選「${label}」`, (await rowLoc.count()) === 1, '');
    if (await rowLoc.count()) await rowLoc.click();
    await settle(exp.page, 100);
  }
  const [download] = await Promise.all([
    exp.page.waitForEvent('download', { timeout: 15000 }),
    exportDialog.getByRole('button', { name: '下載 EXCEL' }).click(),
  ]);
  const XLSX = require('xlsx-js-style');
  const wb = XLSX.readFile(await download.path());
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
  const headers = rows[0];
  const col = name => headers.indexOf(name);
  const xlsxRow = unitId => rows.find(r => r[0] === unitId) || [];
  eq(G, '匯出 A1 新欄位值', [xlsxRow('A1')[col('下次預計繳款日')], xlsxRow('A1')[col('待繳金額(萬)')], xlsxRow('A1')[col('逾期筆數')], xlsxRow('A1')[col('到期狀態')]], [addDays(-7), 80, 1, '逾期']);
  eq(G, '匯出 A1 已繳與比例不受預計影響', [xlsxRow('A1')[col('已繳款金額(萬)')], xlsxRow('A1')[col('繳款比例(%)')]], [90, 4.3]);
  eq(G, '匯出 B1 沒有預計：空白、逾期 0', [xlsxRow('B1')[col('下次預計繳款日')] ?? '', xlsxRow('B1')[col('待繳金額(萬)')] ?? '', xlsxRow('B1')[col('逾期筆數')], xlsxRow('B1')[col('到期狀態')] ?? ''], ['', '', 0, '']);
  await exp.close();

  // 工具列路由
  backend.reset();
  const nav = await openSales();
  await nav.page.locator('.toolbar').getByRole('button', { name: '功能' }).click();
  await settle(nav.page, 300);
  await nav.page.locator('.desktop-tool', { hasText: '繳款到期' }).click();
  await settle(nav.page, 400);
  eq(G, '工具列「繳款到期」路由', (await nav.page.evaluate(() => window.__nav)).at(-1), { name: 'PaymentDueList', params: { projectId: 'p1' } });
  await nav.close();

  // 手機
  backend.reset();
  const mobile = await openSales({ width: 390 });
  await mobile.page.locator('.unit-card', { hasText: 'A1' }).first().dispatchEvent('contextmenu', { clientX: 120, clientY: 300 });
  await settle(mobile.page, 900);
  const sheetTool = mobile.page.locator('.unit-quick-sheet__tool', { hasText: '繳款紀錄' });
  eq(G, '手機快速選單：有預計顯示「下次 MM/DD」', (await sheetTool.locator('.unit-quick-sheet__caption').innerText().catch(() => '')).trim(), `下次 ${md(addDays(-7))}`);
  await mobile.page.screenshot({ path: path.join(SHOT_DIR, 'sales-quick-sheet-390.png') });
  await mobile.close();
  backend.reset();
  const mobileNoPlan = await openSales({ width: 390 });
  await mobileNoPlan.page.locator('.unit-card', { hasText: 'B1' }).first().dispatchEvent('contextmenu', { clientX: 120, clientY: 300 });
  await settle(mobileNoPlan.page, 900);
  const noPlanTool = mobileNoPlan.page.locator('.unit-quick-sheet__tool', { hasText: '繳款紀錄' });
  eq(G, '手機快速選單：沒有預計不顯示', [await noPlanTool.count(), await noPlanTool.locator('.unit-quick-sheet__caption').count()], [1, 0]);
  await mobileNoPlan.page.screenshot({ path: path.join(SHOT_DIR, 'sales-quick-sheet-noplan-390.png') });
  await mobileNoPlan.close();

  // 從網格開啟真實戶別視窗：銷控頁傳入的 props（含車位）算出來的比例要與列表一致
  backend.reset();
  const unitOpen = await openSales();
  await unitOpen.page.locator('.unit-card', { hasText: 'A1' }).first().click();
  await unitOpen.page.waitForSelector('.v-dialog.v-overlay--active .v-tab', { timeout: 60000 });
  await settle(unitOpen.page, 800);
  await unitOpen.page.locator('.v-dialog.v-overlay--active .v-tab', { hasText: '繳款紀錄' }).click();
  await settle(unitOpen.page, 500);
  const unitStats = await stats(unitOpen.page);
  eq(G, '戶別視窗（銷控頁開啟）：比例含車位', [unitStats['已繳'], unitStats['繳款比例'], unitStats['待繳']], [`${money(900000)} 元`, '4.3%', `${money(800000)} 元`]);
  await unitOpen.page.locator('.v-dialog.v-overlay--active .v-tab', { hasText: '詳細資訊' }).click();
  await settle(unitOpen.page, 400);
  await unitOpen.page.locator('.v-dialog.v-overlay--active').getByRole('button', { name: '修改銷控' }).first().click();
  await settle(unitOpen.page, 900);
  await unitOpen.page.locator('.edit-nav-item', { hasText: '戶別繳款紀錄' }).click();
  await settle(unitOpen.page, 300);
  eq(G, '修改銷控（銷控頁開啟）：比例與檢視一致', (await unitOpen.page.locator('.pr-stat', { hasText: '繳款比例' }).first().innerText()).replace(/\s+/g, ' '), '繳款比例 4.3%');
  await unitOpen.close();

  // 手機工具列路由
  backend.reset();
  const mobileNav = await openSales({ width: 390 });
  await mobileNav.page.locator('.v-bottom-navigation .v-btn', { hasText: '功能' }).click();
  await settle(mobileNav.page, 500);
  const moreTool = mobileNav.page.locator('.mobile-tool', { hasText: '繳款到期' }).first();
  if (await moreTool.count()) {
    await moreTool.click();
    await settle(mobileNav.page, 400);
    eq(G, '手機工具「繳款到期」路由', (await mobileNav.page.evaluate(() => window.__nav)).at(-1), { name: 'PaymentDueList', params: { projectId: 'p1' } });
  } else {
    check(G, '手機工具有「繳款到期」', false, '找不到手機工具入口');
  }
  await mobileNav.close();
});

// 只解 Playwright 截圖用到的 PNG（8 bit、RGB／RGBA、非交錯）
function decodePng(buffer) {
  let offset = 8;
  let width = 0;
  let height = 0;
  let channels = 0;
  const idat = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      channels = data[9] === 6 ? 4 : 3;
      if (data[8] !== 8 || ![2, 6].includes(data[9]) || data[12] !== 0) throw new Error('不支援的 PNG 格式');
    } else if (type === 'IDAT') idat.push(data);
    offset += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const pixels = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x += 1) {
      const value = raw[y * (stride + 1) + 1 + x];
      const left = x >= channels ? pixels[y * stride + x - channels] : 0;
      const up = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const upLeft = x >= channels && y > 0 ? pixels[(y - 1) * stride + x - channels] : 0;
      let predicted = 0;
      if (filter === 1) predicted = left;
      else if (filter === 2) predicted = up;
      else if (filter === 3) predicted = (left + up) >> 1;
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        predicted = pa <= pb && pa <= pc ? left : (pb <= pc ? up : upLeft);
      }
      pixels[y * stride + x] = (value + predicted) & 255;
    }
  }
  return { width, height, luminance: (x, y) => {
    const i = y * stride + x * channels;
    return 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
  } };
}

// 量欄位內文字的垂直位置：文字在 UA shadow DOM 量不到，直接看截圖的深色像素
async function measureFieldText(page, input) {
  await page.evaluate(() => document.activeElement?.blur?.());
  await input.scrollIntoViewIfNeeded();
  await settle(page, 120);
  const field = await input.evaluate((el) => {
    const r = el.closest('.v-field').getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  const clip = { x: field.x + 6, y: field.y + 3, width: Math.min(field.width * 0.6, 130), height: field.height - 6 };
  const png = decodePng(await page.screenshot({ clip }));
  const scale = png.height / clip.height;
  let top = -1;
  let bottom = -1;
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      if (png.luminance(x, y) < 150) {
        if (top < 0) top = y;
        bottom = y;
        break;
      }
    }
  }
  if (top < 0) return { height: field.height, offset: null };
  const textCenter = clip.y + (top + bottom + 1) / 2 / scale;
  return { height: field.height, offset: Math.round((textCenter - (field.y + field.height / 2)) * 10) / 10 };
}

// Chromium 才有日曆圖示：右側應有深色像素，且圖示落在欄位後段
async function calendarIconAtRight(page, input) {
  await page.evaluate(() => document.activeElement?.blur?.());
  await input.scrollIntoViewIfNeeded();
  const field = await input.evaluate((el) => {
    const r = el.closest('.v-field').getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  const clip = { x: field.x + field.width * 0.5, y: field.y + 3, width: field.width * 0.5 - 2, height: field.height - 6 };
  const png = decodePng(await page.screenshot({ clip }));
  const scale = png.width / clip.width;
  let right = -1;
  for (let x = png.width - 1; x >= 0 && right < 0; x -= 1) {
    for (let y = 0; y < png.height; y += 1) {
      if (png.luminance(x, y) < 150) { right = x; break; }
    }
  }
  if (right < 0) return false;
  return field.x + field.width - (clip.x + (right + 1) / scale) < 30;
}

// 與同一區的數字欄比較，不看絕對值：「/」比數字往下伸，欄位又可能落在半像素，絕對偏移本來就有 1–3px
const DATE_TEXT_TOLERANCE = 2; // CSS px；WebKit 上文字跑到頂端時差距會遠大於此（下方有對照組）

// ─────────────── T14 樣式修正 ───────────────
group('T14', async () => {
  const G = 'T14 樣式修正';
  const headPadding = page => dialog(page).locator('.mac-sheet-head').first().evaluate(el => getComputedStyle(el).paddingLeft);
  backend.reset();
  const list = await open({ view: 'list', role: 'manager' }, { width: 390 });
  await settle(list.page, 400);
  await list.page.getByRole('button', { name: '批次新增' }).click();
  await settle(list.page, 500);
  eq(G, '批次新增標題不再多縮排', await headPadding(list.page), '16px');
  await clickDialogButton(list.page, '取消');
  await settle(list.page, 300);
  await list.page.locator('.mac-list-row .mac-list-title').first().click();
  await settle(list.page, 500);
  eq(G, '到期清單戶別視窗標題不再多縮排', await headPadding(list.page), '16px');
  await list.close();

  const panel = await open({ view: 'panel', unit: 'A1', total: 2100 }, { width: 390 });
  await panel.page.locator('.pr-actions').getByRole('button', { name: '帶入合約期款資料' }).click();
  await settle(panel.page, 700);
  eq(G, '帶入合約期款資料標題不再多縮排', await headPadding(panel.page), '16px');
  await panel.page.locator('.pti .mac-sheet-foot').getByRole('button', { name: '關閉' }).click();
  await settle(panel.page, 300);
  await paidRow(panel.page, '簽約款').locator('.pr-thumb').click();
  await settle(panel.page, 500);
  eq(G, '燈箱底色不透明', await panel.page.locator('.pr-lightbox-card').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(20, 20, 22)');
  await panel.close();

  const settings = await open({ view: 'settings' }, { width: 390 });
  await settle(settings.page, 500);
  await settings.page.locator('.prs-link').first().click();
  await settle(settings.page, 400);
  eq(G, '通知人員標題不再多縮排', await headPadding(settings.page), '16px');
  await clickDialogButton(settings.page, '完成');
  await settle(settings.page, 300);
  await settings.page.getByRole('button', { name: '通知紀錄' }).click();
  await settle(settings.page, 500);
  eq(G, '通知紀錄標題不再多縮排', await headPadding(settings.page), '16px');
  await settings.close();

  // 日期欄：文字垂直置中、欄位高度與同列數字欄相同（標記已繳與修改銷控，桌機與手機寬度）
  const checkDateField = async (label, page, dateInput, amountInput) => {
    const dateResult = await measureFieldText(page, dateInput);
    const amountResult = await measureFieldText(page, amountInput);
    console.log(`  量測 ${label}：日期偏移 ${dateResult.offset}px、數字偏移 ${amountResult.offset}px、高度 ${dateResult.height}/${amountResult.height}`);
    check(G, `${label}：日期文字垂直置中`, dateResult.offset !== null && Math.abs(dateResult.offset - amountResult.offset) <= DATE_TEXT_TOLERANCE, `日期偏移 ${dateResult.offset}px，數字欄 ${amountResult.offset}px`);
    eq(G, `${label}：欄位高度與數字欄相同`, dateResult.height, amountResult.height);
    if (ENGINE === 'chromium') check(G, `${label}：日曆圖示靠右`, await calendarIconAtRight(page, dateInput), '');
  };
  // 對照組：WebKit 用修正前的 display:block 時要量得出偏上，否則這項檢查沒有意義
  if (ENGINE === 'webkit') {
    backend.reset();
    const control = await open({ view: 'panel', unit: 'A1', total: 2100 }, { width: 390 });
    await plannedRow(control.page, '第 2 期工程款').getByRole('button', { name: '標記已繳' }).click();
    await settle(control.page);
    await control.page.addStyleTag({ content: '.mac-vfield.v-input input[type="date"] { display: block !important; }' });
    await settle(control.page, 200);
    const controlDialog = dialog(control.page);
    const controlDate = await measureFieldText(control.page, controlDialog.getByLabel('繳款日'));
    const controlAmount = await measureFieldText(control.page, controlDialog.getByLabel('實繳金額'));
    console.log(`  量測 對照組 display:block：日期偏移 ${controlDate.offset}px、數字偏移 ${controlAmount.offset}px`);
    check(G, '對照組：display:block 量得出文字偏上', controlDate.offset - controlAmount.offset < -DATE_TEXT_TOLERANCE, `日期偏移 ${controlDate.offset}px，數字欄 ${controlAmount.offset}px`);
    await control.close();
  }

  for (const width of [1440, 390]) {
    backend.reset();
    const mark = await open({ view: 'panel', unit: 'A1', total: 2100 }, { width });
    await plannedRow(mark.page, '第 2 期工程款').getByRole('button', { name: '標記已繳' }).click();
    await settle(mark.page);
    const markDialog = dialog(mark.page);
    await markDialog.getByLabel('實繳金額').fill('200000');
    await settle(mark.page, 150);
    await checkDateField(`標記已繳 @${width}`, mark.page, markDialog.getByLabel('繳款日'), markDialog.getByLabel('實繳金額'));
    await checkDateField(`標記已繳差額（空白）@${width}`, mark.page, markDialog.getByLabel('預計日'), markDialog.getByLabel('實繳金額'));
    await mark.page.screenshot({ path: path.join(SHOT_DIR, `date-field-markpaid-${width}.png`) });
    await mark.close();

    backend.reset();
    const edit = await open({ view: 'modal', unit: 'M1', editing: 1 }, { width });
    await edit.page.waitForSelector('.v-dialog.v-overlay--active', { timeout: 60000 });
    await settle(edit.page, 800);
    const nav = edit.page.locator('.edit-nav-item', { hasText: '戶別繳款紀錄' });
    if (await nav.isVisible().catch(() => false)) await nav.click();
    else await edit.page.locator('.edit-mobile-chip', { hasText: '戶別繳款紀錄' }).click();
    await settle(edit.page, 300);
    if (!(await edit.page.locator('.pr-body:visible').count())) await edit.page.locator('.pr-summary:visible').first().click();
    await settle(edit.page, 300);
    const editCard = edit.page.locator('section[aria-label="預計繳款"] .pr-edit-card').first();
    await checkDateField(`修改銷控 @${width}`, edit.page, editCard.locator('input[aria-label="預計日"]'), editCard.locator('input[aria-label="預計金額"]'));
    await edit.page.screenshot({ path: path.join(SHOT_DIR, `date-field-edit-${width}.png`) });
    await edit.close();
  }
});

// 修改銷控共用操作（桌機導覽／手機分類列都可用）
async function modalOpenDeal(page) {
  const chip = page.locator('.edit-mobile-chip', { hasText: '成交資訊' });
  if (await chip.isVisible().catch(() => false)) await chip.click();
  else await page.locator('.edit-nav-item', { hasText: '成交資訊' }).click();
  await settle(page, 300);
}
async function modalAddSpot(page, spotId) {
  await page.locator('.parking-add-btn, .parking-empty').first().click(); // 沒有車位時是空狀態區塊
  await settle(page, 600);
  await page.locator('.floor-chip', { hasText: 'B2' }).click();
  await settle(page, 200);
  await page.locator('.add-parking-panel .v-select .v-field').click();
  await settle(page, 300);
  await page.locator('.v-menu.v-overlay--active .v-list-item', { hasText: spotId }).first().click();
  await settle(page, 200);
  await page.locator('.add-parking-panel').getByRole('button', { name: '加入' }).click();
  await settle(page, 200);
  await page.locator('.v-dialog.v-overlay--active').last().getByRole('button', { name: '確定' }).click();
  await settle(page, 400);
}
async function modalSave(page) {
  const mobile = page.locator('.mobile-actions-container').getByRole('button', { name: '儲存' });
  if (await mobile.isVisible().catch(() => false)) await mobile.click();
  else await page.getByRole('button', { name: '儲存變更' }).first().click();
  await settle(page, 700);
}

// ─────────────── 畫面矩陣 ───────────────
const WIDTHS = [390, 820, 1440];
const capturedAlerts = [];
const SCREENS = [
  ['panel-view', { view: 'panel', unit: 'A1', total: 2100 }],
  ['panel-empty', { view: 'panel', unit: 'EMPTY', total: 1000 }],
  ['panel-long', { view: 'panel', unit: 'A9', total: 12000 }],
  ['dlg-add-planned', { view: 'panel', unit: 'A1', total: 2100 }, async (page) => { await page.locator('.pr-actions').getByRole('button', { name: '預計繳款', exact: true }).click(); }],
  ['dlg-add-paid-file', { view: 'panel', unit: 'A1', total: 2100 }, async (page) => {
    await page.locator('.pr-actions').getByRole('button', { name: '已繳款', exact: true }).click();
    await settle(page);
    await dialog(page).locator('input[type=file]').setInputFiles({ name: '繳款憑證_2026-11-06_第三期工程款_轉帳收據掃描檔.png', mimeType: 'image/png', buffer: PNG });
  }],
  ['dlg-edit-paid', { view: 'panel', unit: 'A1', total: 2100 }, async (page) => { await menu(page, paidRow(page, '簽約款'), '編輯'); }],
  ['dlg-markpaid-balance', { view: 'panel', unit: 'A1', total: 2100 }, async (page) => {
    await plannedRow(page, '第 2 期工程款').getByRole('button', { name: '標記已繳' }).click();
    await settle(page);
    await dialog(page).getByLabel('實繳金額').fill('200000');
    await dialog(page).locator('input[type=file]').setInputFiles({ name: 'proof.png', mimeType: 'image/png', buffer: PNG });
  }],
  ['dlg-confirm-revert', { view: 'panel', unit: 'A1', total: 2100 }, async (page) => { await menu(page, paidRow(page, '簽約款'), '改回預計'); }],
  ['lightbox-image', { view: 'panel', unit: 'A1', total: 2100 }, async (page) => { await paidRow(page, '簽約款').locator('.pr-thumb').click(); await settle(page, 500); }],
  ['lightbox-pdf', { view: 'panel', unit: 'A1', total: 2100 }, async (page) => { await paidRow(page, '開工款').locator('.pr-thumb').click(); await settle(page, 500); }],
  ['panel-editable', { view: 'panel', unit: 'A1', total: 2100, editable: 1 }],
  ['dlg-contract-empty', { view: 'panel', unit: 'A1', total: 2100 }, async (page) => { await page.getByRole('button', { name: '帶入合約期款資料' }).click(); await settle(page, 700); }],
  ['dlg-contract-import', { view: 'panel', unit: 'A1', total: 2100 }, async (page) => { await page.getByRole('button', { name: '帶入合約期款資料' }).click(); await settle(page, 700); }, {
    contractDocs: { A1: { manualRows: [
      contractSingle('i1', '簽約款', 147),
      contractSingle('i2', '第 4 期工程款', 40),
      contractSingle('i3', '第 2 期工程款', 30),
      contractGroup('g1', '工程期款', [['g1a', '開工期款', 139], ['g1b', '結構款', 139], ['g1c', '完工款', 142]]),
      contractSingle('i9', '銀行貸款', 1500),
    ] } },
  }],
  ['settings', { view: 'settings' }, async (page) => { await settle(page, 500); }],
  ['settings-issue', { view: 'settings' }, async (page) => {
    await settle(page, 500);
    await page.locator('.prs-enable input').check();
    for (const l of ['7 天', '3 天', '1 天', '當天']) await page.getByRole('button', { name: `移除${l}` }).click();
    await page.locator('input[aria-label="逾期提醒"]').uncheck();
    await page.getByRole('button', { name: '寄測試通知給我' }).click();
    await settle(page, 400);
  }],
  ['settings-people', { view: 'settings' }, async (page) => { await settle(page, 500); await page.locator('.prs-link').first().click(); }],
  ['settings-logs', { view: 'settings' }, async (page) => {
    await settle(page, 500);
    await page.getByRole('button', { name: '通知紀錄' }).click();
    await settle(page, 500);
    await dialog(page).locator('.prs-log-head').first().click();
  }],
  ['list-manager', { view: 'list', role: 'manager' }, async (page) => { await settle(page, 400); }],
  ['list-sales', { view: 'list', role: 'sales' }, async (page) => { await settle(page, 400); }],
  ['list-denied', { view: 'list', role: 'none' }, async (page) => { await settle(page, 300); }],
  ['list-error', { view: 'list', role: 'manager' }, async (page) => { await settle(page, 300); }, { failures: { 'paymentReminderApi:listDue': '伺服器暫時無法處理，請稍後再試' } }],
  ['list-empty', { view: 'list', role: 'manager' }, async (page) => { await settle(page, 300); }, { emptyData: true }],
  ['list-unit', { view: 'list', role: 'manager' }, async (page) => {
    await settle(page, 400);
    const row = page.locator('.mac-list-row, .pd-row').first();
    await row.locator('.mac-list-title, td:nth-child(3)').first().click();
    await settle(page, 500);
  }],
  ['list-markpaid', { view: 'list', role: 'manager' }, async (page) => {
    await settle(page, 400);
    await page.getByRole('button', { name: '標記已繳' }).first().click();
  }],
  ['batch-1', { view: 'list', role: 'manager' }, async (page) => {
    await settle(page, 400);
    await page.getByRole('button', { name: '批次新增' }).click();
    await settle(page, 500);
    await dialog(page).locator('.mac-form-seg-btn', { hasText: '成交總價比例' }).click();
  }],
  ['batch-2', { view: 'list', role: 'manager' }, async (page) => { await goBatch(page, 2); }],
  ['batch-3', { view: 'list', role: 'manager' }, async (page) => { await goBatch(page, 3); }],
  ['modal-tab-payments', { view: 'modal', unit: 'M1', tab: 'payments' }, async (page) => { await page.waitForSelector('.v-dialog.v-overlay--active .pr-summary'); await settle(page, 600); }],
  ['modal-edit-payments', { view: 'modal', unit: 'M1', editing: 1 }, async (page) => {
    await page.waitForSelector('.v-dialog.v-overlay--active');
    await settle(page, 800);
    const nav = page.locator('.edit-nav-item', { hasText: '戶別繳款紀錄' });
    if (await nav.count()) await nav.click();
    else await page.getByRole('button', { name: /繳款紀錄/ }).first().click().catch(() => {});
    await settle(page, 300);
    if (!(await page.locator('.pr-body:visible').count())) await page.locator('.pr-summary:visible').first().click().catch(() => {});
    await settle(page, 300);
  }],
  ['batch-partial', { view: 'list', role: 'manager' }, async (page) => {
    await goBatch(page, 2, ['A1', 'A2', 'A3']);
    await dialog(page).getByRole('button', { name: '下一步' }).click();
    await settle(page, 200);
    backend.db.txGetHook = (docPath) => { if (docPath.endsWith('p1_A2')) throw new Error('Firestore 交易逾時，請重試'); };
    await dialog(page).getByRole('button', { name: '確認新增' }).click();
    await settle(page, 500);
  }],
  ['sales-list', { view: 'sales' }, async (page) => {
    await page.waitForFunction(() => document.querySelectorAll('.unit-card').length > 0, null, { timeout: 60000 });
    await settle(page, 500);
    await salesToList(page);
    await scrollToDueColumns(page);
  }],
  ['sales-popup', { view: 'sales' }, async (page) => {
    await page.waitForFunction(() => document.querySelectorAll('.unit-card').length > 0, null, { timeout: 60000 });
    await settle(page, 500);
    await salesToList(page);
    await page.evaluate(() => [...document.querySelectorAll('.next-due-cell')][0]?.click());
    await settle(page, 600);
  }],
  ['batch-sheet-warning', { view: 'list', role: 'manager' }, async (page) => {
    await goBatch(page, 3, ['A1', 'A2']);
    await dialog(page).getByRole('button', { name: '確認新增' }).click();
    await settle(page, 600);
  }, { salesSheet: true, sheetSyncError: 'SheetsApiError: quota exceeded '.repeat(12).trim() }],
  ['modal-parking-retry', { view: 'modal', unit: 'M3', editing: 1 }, async (page) => {
    await page.waitForSelector('.v-dialog.v-overlay--active', { timeout: 60000 });
    await settle(page, 800);
    await modalOpenDeal(page);
    await modalAddSpot(page, 'P-302');
    capturedAlerts.length = 0;
    page.on('dialog', async (d) => { capturedAlerts.push(d.message()); await d.accept(); });
    await modalSave(page);
    check('畫面', '車位重試提示：alert 文字', capturedAlerts.some(a => a.includes('車位寫入失敗，戶別資料已儲存，請再按一次儲存重試')), JSON.stringify(capturedAlerts));
  }, { failures: { updateParkingLot: '網路逾時' } }],
  ['entry-binding', { view: 'entry', role: 'anon', inClient: 1, liffLoggedIn: 1 }, async (page) => { await settle(page, 200); }],
  ['entry-failed', { view: 'entry', role: 'anon', initError: 'LIFF 初始化失敗：The liffId is invalid，請稍後再試' }, async (page) => { await settle(page, 200); }],
];

async function goBatch(page, step, onlyUnits = null) {
  await settle(page, 400);
  await page.getByRole('button', { name: '批次新增' }).click();
  await settle(page, 500);
  const d = dialog(page);
  await fillOtherPeriod(d, '第 9 期工程款');
  await d.locator('input[type=date]').fill('2027-03-01');
  await d.locator('.mac-form-seg-btn', { hasText: '成交總價比例' }).click();
  await settle(page, 80);
  await d.locator('input[type=number]').fill('7.5');
  await settle(page, 80);
  await d.getByRole('button', { name: '下一步' }).click();
  await settle(page, 400);
  await d.locator('.ppb-status', { hasText: '自訂狀態' }).locator('input').check();
  await settle(page, 100);
  if (onlyUnits) {
    for (const unitId of onlyUnits) await d.locator('label.ppb-unit', { hasText: unitId }).locator('input').check();
  } else {
    await d.locator('.ppb-all input').check();
  }
  if (step === 3) {
    await settle(page, 100);
    await d.getByRole('button', { name: '下一步' }).click();
    await settle(page, 200);
  }
}

group('visual', async () => {
  // 檢查工具自我測試：故意做出問題，確認真的抓得到（避免全部「通過」只是工具沒作用）
  backend.reset();
  const probe = await open({ view: 'list', role: 'none' }, { width: 390 });
  await settle(probe.page, 200);
  await probe.page.evaluate(() => {
    const clip = document.createElement('div');
    clip.style.cssText = 'width:40px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis';
    clip.textContent = '這是一段會被截斷的文字這是一段會被截斷的文字';
    document.body.append(clip);
    const parentClip = document.createElement('div');
    parentClip.style.cssText = 'width:40px;overflow:hidden';
    parentClip.innerHTML = '<span style="white-space:nowrap">祖先裁切祖先裁切祖先裁切祖先裁切祖先裁切</span>';
    document.body.append(parentClip);
    const under = document.createElement('span');
    under.style.cssText = 'position:fixed;top:20px;left:20px;z-index:1';
    under.textContent = '被遮住';
    document.body.append(under);
    const wide = document.createElement('div');
    wide.style.cssText = 'width:2000px;height:2px';
    document.body.append(wide);
  });
  const probeAudit = await probe.page.evaluate(AUDIT_SOURCE);
  check('畫面', '檢查工具：抓得到自身截斷', probeAudit.truncated.some(x => x.startsWith('自身截斷')), JSON.stringify(probeAudit.truncated));
  check('畫面', '檢查工具：抓得到祖先裁切', probeAudit.truncated.some(x => x.startsWith('祖先裁切')), JSON.stringify(probeAudit.truncated));
  check('畫面', '檢查工具：抓得到漢堡鈕遮擋', probeAudit.hamburger.some(x => x.includes('被遮住')), JSON.stringify(probeAudit.hamburger));
  check('畫面', '檢查工具：抓得到橫向捲動', !!probeAudit.hScroll, JSON.stringify(probeAudit.hScroll));
  await probe.close();

  for (const [name, params, setup, backendOpts] of SCREENS) {
    if (ONLY_SCREENS && !ONLY_SCREENS.has(name)) continue;
    for (const width of WIDTHS) {
      backend.reset(backendOpts || {});
      const { page, close } = await open(params, { width });
      try {
        if (setup) await setup(page);
        await settle(page);
        await auditScreen(page, name, width);
      } catch (error) {
        check('畫面', `${name} @${width} 操作`, false, error.message.slice(0, 300));
      } finally {
        await close();
      }
    }
  }
  // 額外寬度：桌機表格最窄處
  backend.reset();
  const narrow = await open({ view: 'list', role: 'manager' }, { width: 1024, height: 768 });
  await settle(narrow.page, 400);
  await auditScreen(narrow.page, 'list-manager', 1024);
  await narrow.close();
  // 灰階
  backend.reset();
  const gray = await open({ view: 'panel', unit: 'A1', total: 2100 }, { width: 820 });
  await gray.page.addStyleTag({ content: 'html { filter: grayscale(1); }' });
  await settle(gray.page);
  await gray.page.screenshot({ path: path.join(SHOT_DIR, 'grayscale-panel-820.png'), fullPage: true });
  await gray.close();
  backend.reset();
  const grayM = await open({ view: 'panel', unit: 'A1', total: 2100 }, { width: 390 });
  await grayM.page.addStyleTag({ content: 'html { filter: grayscale(1); }' });
  await settle(grayM.page);
  await grayM.page.screenshot({ path: path.join(SHOT_DIR, 'grayscale-panel-390.png'), fullPage: true });
  await grayM.close();
});

// ── 主流程 ──
let server;
try {
  server = await createServer({
    root,
    configFile: false,
    cacheDir,
    logLevel: 'warn',
    server: { host: '127.0.0.1', port: 5291, strictPort: false, hmr: false }, // 不用 5173：使用者的 dev server 可能在跑
    resolve: {
      alias: [
        { find: /^@\/(.*)$/, replacement: `${path.join(root, 'src')}/$1` },
        { find: /^xlsx$/, replacement: 'xlsx-js-style' },
      ],
    },
    optimizeDeps: {
      noDiscovery: true,
      include: ['vue', 'vue-router', 'pinia', 'qrcode', 'qrcode.vue', 'file-saver', 'date-fns-tz', 'date-fns', 'axios', '@vueuse/core', 'xlsx-js-style', 'vuedraggable', 'jspdf', 'html2canvas'],
      exclude: ['vuetify'],
    },
    plugins: [mockResolver, vue(), vuetify({ autoImport: true })],
  });
  await server.listen();
  base = `http://127.0.0.1:${server.httpServer.address().port}`;
  console.log(`harness: ${base}，輸出：${OUT_DIR}`);
  browser = ENGINE === 'webkit'
    ? await webkit.launch({ headless: true, executablePath: findWebkit() })
    : await chromium.launch({ executablePath: findBrowser(), headless: true });

  // 預熱：先把會動態載入的主要頁面編譯一次，真的有錯在後面的測試一樣會失敗
  backend.reset();
  const warmIssues = consoleIssues.length;
  for (const params of [{ view: 'panel', unit: 'A1', total: 2100 }, { view: 'list', role: 'manager' }, { view: 'settings' }, { view: 'schedule', context: JSON.stringify({ unitId: 'A1', totalPrice: 2100, parkingSpots: [], areas: {}, banks: [] }) }, { view: 'modal', unit: 'M1' }, { view: 'sales' }, { view: 'entry', role: 'manager' }]) {
    try {
      const warm = await open(params);
      await warm.close();
    } catch (error) {
      console.log('預熱失敗（後面的測試會照實失敗）：' + params.view + ' ' + error.message.slice(0, 160));
    }
  }
  consoleIssues.length = warmIssues;
  console.log('預熱完成');

  for (const [name, fn] of Object.entries(groups)) {
    if (ONLY && !ONLY.has(name)) continue;
    console.log(`\n===== ${name} =====`);
    try {
      await fn();
    } catch (error) {
      check(name, '情境中斷', false, String(error.stack || error).slice(0, 800));
    }
  }
} finally {
  await browser?.close().catch(() => {});
  await server?.close().catch(() => {});
  rmSync(cacheDir, { recursive: true, force: true });
}

check('安全', '沒有請求想打到外部服務', blockedRequests.length === 0, [...new Set(blockedRequests)].slice(0, 10).join('\n'));
const realRetries = envRetries.filter(r => !r.simulated);
console.log(`環境：504 重試 ${realRetries.length} 次${realRetries.length ? ` ${JSON.stringify(realRetries.map(r => r.label))}` : ''}`);
check('環境', '開機後沒有遇到 504（Outdated Optimize Dep）', late504.length === 0, late504.slice(0, 5).join('、'));
check('Console', '沒有 console error／Vue warn', consoleIssues.length === 0, `${consoleIssues.length} 筆，見 results.json`);

const failed = results.filter(r => !r.ok && !r.known);
const knownOpen = results.filter(r => r.known && !r.ok);
const knownFixed = results.filter(r => r.known && r.ok);
const summary = {
  today: TODAY,
  engine: ENGINE,
  total: results.length,
  passed: results.filter(r => r.ok && !r.known).length,
  failed: failed.length,
  failures: failed,
  knownIssues: knownOpen,
  knownFixed,
  blockedRequests: [...new Set(blockedRequests)],
  driveStubbedCount: driveStubbed.length,
  consoleIssues,
  preExistingWarnings: [...preExistingWarnings],
  auditIssues,
  results,
};
writeFileSync(path.join(OUT_DIR, 'results.json'), JSON.stringify(summary, null, 2));
knownOpen.forEach(r => console.log(`已知問題：[${r.group}] ${r.name}${r.note ? `（${r.note}）` : ''}`));
knownFixed.forEach(r => console.log(`已知問題已不再重現：[${r.group}] ${r.name}，請改回一般檢查`));
console.log(`\n總計 ${results.length}，通過 ${summary.passed}，失敗 ${failed.length}，已知問題 ${knownOpen.length}，已不再重現 ${knownFixed.length}；明細：${path.join(OUT_DIR, 'results.json')}`);
process.exit(failed.length ? 1 : 0);
