// 載入真正的 functions/index.js 做端對端測試（假 Firestore、封鎖所有對外連線）：
// 退戶與復原、paymentProofApi 契約、paymentReminderApi 分派與排程進入點。
const test = require('node:test');
const assert = require('node:assert/strict');
const { db, loadIndex, blockedConnections } = require('./helpers/loadIndexOffline.cjs');
const { SHEET_SYNC_SKIP_FIELD } = require('../utils/sheetSyncSkip');

const quiet = { log: console.log, warn: console.warn, error: console.error };
const silence = () => { console.log = () => {}; console.warn = () => {}; console.error = () => {}; };
const restore = () => { console.log = quiet.log; console.warn = quiet.warn; console.error = quiet.error; };

silence();
const index = loadIndex();

const HOUSEHOLD = 'salesHouseholds/p1_A1';
const { store } = db;
const reset = (seed = {}) => {
  store.clear();
  Object.entries(seed).forEach(([key, value]) => store.set(key, value));
};

const planned = { id: 'pr_p', expectedDate: '2026-12-20', expectedAmount: 300000, planSource: 'manual', date: '', amount: null, note: '第3期', file: null, paidAt: null, paidBy: null, createdAt: 'c', updatedAt: 'c' };
const paid = { id: 'pr_d', date: '2026-11-01', amount: 600000, note: '簽約款', file: { fileId: 'drive1', fileName: 'f.pdf', webViewLink: 'l' }, createdAt: 'c', updatedAt: 'c' };

const household = (extra = {}) => ({
  projectId: 'p1',
  unitId: 'A1',
  salesStatus_backend: '簽約',
  status: '簽約',
  buyerName: '王小明',
  buyerPhone: '0912345678',
  salesperson: ['甲'],
  salespersonUserKey: ['s1'],
  paymentRecords: [paid, planned],
  remarks: '',
  remarkNotes: [],
  ...extra,
});

const backupKey = () => [...store.keys()].find(key => key.startsWith('cancelledPurchases/'));

test('退戶清空繳款紀錄，退戶備份與日誌都保留；買方資料一併清除', async () => {
  reset({ [HOUSEHOLD]: household(), 'projects/p1': { name: '森之樹' } });
  await index.cancelPurchase.run({ data: { projectId: 'p1', unitId: 'A1', operatorName: '管理', cancelReasons: ['x'], cancellationDate: '2026-12-01' } });

  assert.deepEqual(store.get(HOUSEHOLD).paymentRecords, []);
  assert.equal(store.get(HOUSEHOLD).salesStatus_backend, null);
  const backup = store.get(backupKey());
  assert.deepEqual(backup.paymentRecords.map(r => r.id), ['pr_d', 'pr_p']);
  assert.equal(backup.paymentRecords[0].file.fileId, 'drive1');
  const logKey = [...store.keys()].find(key => key.startsWith('purchaseCancellations/'));
  assert.equal(store.get(logKey).originalHouseholdData.paymentRecords.length, 2);
});

test('復原退戶：繳款紀錄回復，並保留退戶後在空戶別新增的紀錄', async () => {
  reset({ [HOUSEHOLD]: household({ paymentRecords: [paid] }), 'projects/p1': { name: '森之樹' } });
  await index.cancelPurchase.run({ data: { projectId: 'p1', unitId: 'A1', operatorName: '管理', cancellationDate: '2026-12-01' } });
  const cancelledDocId = backupKey().split('/')[1];

  // 空狀態期間新增（批次 API 不檢查狀態）；退戶時間取實際發生時間，所以不受填寫的退戶日期影響
  store.set(HOUSEHOLD, { ...store.get(HOUSEHOLD), paymentRecords: [{ ...planned, createdAt: new Date(Date.now() + 60000).toISOString() }] });
  const result = await index.restoreCancelledPurchase.run({ data: { projectId: 'p1', cancelledDocId, operatorName: '管理', keepRecord: true } });
  assert.equal(result.status, 'success');
  assert.deepEqual(store.get(HOUSEHOLD).paymentRecords.map(r => r.id), ['pr_d', 'pr_p']);
  assert.equal(store.get(HOUSEHOLD).salesStatus_backend, '簽約');
  assert.equal(store.get(HOUSEHOLD).buyerName, '王小明');
});

test('復原退戶：退戶後沒有新增時完整還原', async () => {
  reset({ [HOUSEHOLD]: household(), 'projects/p1': { name: '森之樹' } });
  await index.cancelPurchase.run({ data: { projectId: 'p1', unitId: 'A1', operatorName: '管理', cancellationDate: '2026-12-01' } });
  const cancelledDocId = backupKey().split('/')[1];
  await index.restoreCancelledPurchase.run({ data: { projectId: 'p1', cancelledDocId, operatorName: '管理' } });
  assert.deepEqual(store.get(HOUSEHOLD).paymentRecords.map(r => r.id), ['pr_d', 'pr_p']);
});

const emptyBackup = { projectId: 'p1', unitId: 'A1', salesStatus_backend: '簽約', buyerName: 'A', salesperson: [], salespersonUserKey: [], remarkNotes: [], remarks: '' };
const restoreBackup = cancelledDocId => index.restoreCancelledPurchase.run({ data: { projectId: 'p1', cancelledDocId, operatorName: '管理' } });
const recordIds = () => store.get(HOUSEHOLD).paymentRecords?.map(r => r.id);
const paidSum = () => store.get(HOUSEHOLD).paymentRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

test('N1 同一戶上線前退過兩次：復原 A 不會併入 B 買方的金額', async () => {
  const recordA = { id: 'pr_a', date: '2026-01-01', amount: 1000000, note: 'A 買方', createdAt: '2026-01-01T00:00:00.000Z' };
  const recordB = { id: 'pr_b', date: '2026-06-01', amount: 2000000, note: 'B 買方', createdAt: '2026-06-01T00:00:00.000Z' };
  const emptyUnit = { projectId: 'p1', unitId: 'A1', salesStatus_backend: null, buyerName: null, paymentRecords: [recordA, recordB] };
  const seed = {
    'cancelledPurchases/p1_A1_20260301000000': { ...emptyBackup, paymentRecords: [recordA] },
    'cancelledPurchases/p1_A1_20260901000000': { ...emptyBackup, buyerName: 'B', paymentRecords: [recordA, recordB] },
    // 其他戶、其他建案的退戶不影響判斷
    'cancelledPurchases/p1_A2_20261001000000': { ...emptyBackup, unitId: 'A2' },
    'cancelledPurchases/p2_A1_20261001000000': { ...emptyBackup, projectId: 'p2' },
    [HOUSEHOLD]: emptyUnit,
  };
  reset(seed);
  await restoreBackup('p1_A1_20260301000000');
  assert.deepEqual(recordIds(), ['pr_a']);
  assert.equal(paidSum(), 1000000);
  assert.equal(store.get(HOUSEHOLD).buyerName, 'A');

  // B 的退戶之後新增的紀錄才保留：其他戶、其他建案較晚的退戶不能把它擋掉
  const addedLater = { id: 'pr_new', expectedDate: '2026-12-20', date: '', amount: null, note: '新增預計', createdAt: '2026-09-15T00:00:00.000Z' };
  reset({ ...seed, [HOUSEHOLD]: { ...emptyUnit, paymentRecords: [recordB, addedLater] } });
  await restoreBackup('p1_A1_20260301000000');
  assert.deepEqual(recordIds(), ['pr_a', 'pr_new']);
  assert.equal(paidSum(), 1000000);
});

test('N1 舊紀錄沒有 createdAt：無法判斷歸屬，不保留', async () => {
  const noCreatedAt = { id: 'pr_b', date: '2026-06-01', amount: 2000000, note: 'B 買方' };
  reset({
    'cancelledPurchases/a': { ...emptyBackup, paymentRecords: [{ id: 'pr_a', amount: 1000000, date: '2026-01-01' }] },
    [HOUSEHOLD]: { projectId: 'p1', unitId: 'A1', salesStatus_backend: null, paymentRecords: [noCreatedAt] },
  });
  await restoreBackup('a');
  assert.deepEqual(recordIds(), ['pr_a']);
  assert.equal(paidSum(), 1000000);
});

test('N1 查不到其他退戶時，用這筆備份自己的退戶時間', async () => {
  const seed = (records) => reset({
    // 舊文件沒有 projectId，依建案查不到；文件 ID 也沒有時間，只能用這筆自己的退戶日期
    'cancelledPurchases/old': { salesStatus_backend: '簽約', unitId: 'A1', cancellationDate: new Date('2026-03-01T00:00:00Z'), salesperson: [], salespersonUserKey: [], remarkNotes: [], remarks: '', paymentRecords: [] },
    [HOUSEHOLD]: { projectId: 'p1', unitId: 'A1', paymentRecords: records },
  });
  seed([{ id: 'before', amount: 1, createdAt: '2026-02-01T00:00:00.000Z' }, { id: 'after', amount: 2, createdAt: '2026-04-01T00:00:00.000Z' }]);
  await restoreBackup('old');
  assert.deepEqual(recordIds(), ['after']);
});

test('N1 舊備份沒有繳款紀錄欄位：只留退戶後新增的紀錄，不會憑空多出欄位', async () => {
  const noTime = { ...emptyBackup, cancellationDate: new Date('2026-03-01T00:00:00Z') };
  reset({
    'cancelledPurchases/old': noTime,
    [HOUSEHOLD]: { projectId: 'p1', unitId: 'A1', paymentRecords: [
      { id: 'after', amount: 5, date: '2026-04-01', createdAt: '2026-04-01T00:00:00.000Z' },
      { id: 'before', amount: 6, date: '2026-02-01', createdAt: '2026-02-01T00:00:00.000Z' },
      { id: 'none', amount: 7, date: '2026-02-01' },
    ] },
  });
  await restoreBackup('old');
  assert.deepEqual(recordIds(), ['after']);

  // 全部都不保留時要清掉，不可因為 merge 寫入而留在戶別上
  reset({ 'cancelledPurchases/old': noTime, [HOUSEHOLD]: { projectId: 'p1', unitId: 'A1', paymentRecords: [{ id: 'none', amount: 7 }] } });
  await restoreBackup('old');
  assert.deepEqual(recordIds(), []);

  reset({ 'cancelledPurchases/old': noTime, [HOUSEHOLD]: { projectId: 'p1', unitId: 'A1' } });
  await restoreBackup('old');
  assert.ok(!('paymentRecords' in store.get(HOUSEHOLD)));

  reset({ 'cancelledPurchases/old': noTime });
  await restoreBackup('old');
  assert.ok(!('paymentRecords' in store.get(HOUSEHOLD)));
});

test('N1 戶別已有有效銷售資料：仍回衝突，不動紀錄', async () => {
  const current = [{ id: 'pr_keep', amount: 1, createdAt: '2026-04-01T00:00:00.000Z' }];
  reset({
    'cancelledPurchases/p1_A1_20260301000000': { ...emptyBackup, paymentRecords: [{ id: 'pr_a', amount: 9 }] },
    [HOUSEHOLD]: { projectId: 'p1', unitId: 'A1', salesStatus_backend: '簽約', paymentRecords: current },
  });
  const result = await restoreBackup('p1_A1_20260301000000');
  assert.equal(result.status, 'conflict');
  assert.deepEqual(recordIds(), ['pr_keep']);
});

const parkingDoc = (projectId, spotId, unitId) => ({
  projectId, spotId, buyerUnitId: unitId, buyerName: '王小明', status: '簽約', status_backend: '簽約', price_transaction: 200, price_floor: 180,
});

test('車位：甲案退 A1 不動乙案 A1 的車位，備份也只含本案車位', async () => {
  reset({
    [HOUSEHOLD]: household(),
    'projects/p1': { name: '甲案' },
    'salesParkings/p1_S1': parkingDoc('p1', 'S1', 'A1'),
    'salesParkings/p1_S2': parkingDoc('p1', 'S2', 'B9'),
    'salesParkings/p2_S1': parkingDoc('p2', 'S1', 'A1'),
  });
  await index.cancelPurchase.run({ data: { projectId: 'p1', unitId: 'A1', operatorName: '管理', cancellationDate: '2026-12-01' } });

  const released = store.get('salesParkings/p1_S1');
  assert.equal(released.buyerUnitId, null);
  assert.equal(released.status_backend, null);
  // 本案其他戶、乙案同戶別的車位都不動
  assert.equal(store.get('salesParkings/p1_S2').buyerUnitId, 'B9');
  assert.deepEqual(store.get('salesParkings/p2_S1'), parkingDoc('p2', 'S1', 'A1'));

  const backup = store.get(backupKey());
  assert.deepEqual(backup.parkingData.map(p => `${p.projectId}/${p.spotId}`), ['p1/S1']);
  const logKey = [...store.keys()].find(key => key.startsWith('purchaseCancellations/'));
  assert.deepEqual(store.get(logKey).originalParkingData.map(p => p.docId), ['p1_S1']);
});

test('車位：舊備份含他案車位時，復原不寫入本案，回傳略過筆數；本案車位照常還原', async () => {
  const otherParking = parkingDoc('p2', 'S1', 'A1');
  const legacyParking = { spotId: 'S3', buyerName: '王小明', status_backend: '簽約' }; // 舊資料沒有 projectId，視為本案
  reset({
    'cancelledPurchases/p1_A1_20260901000000': {
      ...household({ paymentRecords: [] }),
      parkingData: [parkingDoc('p1', 'S2', 'A1'), otherParking, legacyParking],
    },
    [HOUSEHOLD]: { projectId: 'p1', unitId: 'A1', salesStatus_backend: null },
    'salesParkings/p2_S1': { projectId: 'p2', spotId: 'S1', buyerUnitId: null, status_backend: null },
  });
  const warnings = [];
  console.warn = (...args) => warnings.push(args.join(' '));
  try {
    const result = await index.restoreCancelledPurchase.run({ data: { projectId: 'p1', cancelledDocId: 'p1_A1_20260901000000', operatorName: '管理' } });
    assert.equal(result.status, 'success');
    assert.equal(result.restoredParkingCount, 2);
    assert.equal(result.skippedOtherProjectParkingCount, 1);
  } finally {
    console.warn = () => {};
  }
  assert.ok(warnings.some(text => text.includes('略過 1 筆其他建案的車位備份')));
  assert.equal(store.get('salesParkings/p1_S2').buyerUnitId, 'A1');
  assert.equal(store.get('salesParkings/p1_S3').buyerUnitId, 'A1');
  // 他案車位不可寫到 {本案}_{spotId}，乙案原文件也不動
  assert.ok(!store.has('salesParkings/p1_S1'));
  assert.equal(store.get('salesParkings/p2_S1').buyerUnitId, null);
});

test('車位：復原筆數只算實際寫入的，沒有 spotId 的不算；新建的車位文件帶 projectId', async () => {
  reset({
    'cancelledPurchases/b': {
      ...household({ paymentRecords: [] }),
      parkingData: [parkingDoc('p1', 'S2', 'A1'), { projectId: 'p1', buyerName: '王小明' }, { buyerName: '王小明' }, parkingDoc('p2', 'S1', 'A1')],
    },
    [HOUSEHOLD]: { projectId: 'p1', unitId: 'A1', salesStatus_backend: null },
  });
  const result = await restoreBackup('b');
  assert.equal(result.restoredParkingCount, 1);
  assert.equal(result.skippedOtherProjectParkingCount, 1);
  assert.equal(store.get('salesParkings/p1_S2').projectId, 'p1');
  assert.deepEqual([...store.keys()].filter(key => key.startsWith('salesParkings/')), ['salesParkings/p1_S2']);
});

test('車位：舊資料沒有 projectId 的車位文件，復原時一併補上；既有欄位不動', async () => {
  reset({
    'cancelledPurchases/b': { ...household({ paymentRecords: [] }), parkingData: [{ spotId: 'S2', buyerName: '王小明', status_backend: '簽約' }] },
    [HOUSEHOLD]: { projectId: 'p1', unitId: 'A1', salesStatus_backend: null },
    'salesParkings/p1_S2': { spotId: 'S2', area: 12 },
  });
  await restoreBackup('b');
  const parking = store.get('salesParkings/p1_S2');
  assert.equal(parking.projectId, 'p1');
  assert.equal(parking.area, 12);
  assert.equal(parking.buyerUnitId, 'A1');
});

const OTHER_BUYER = '他案買方甲';
const leakedDetails = () => [{ ...parkingDoc('p2', 'S1', 'A1'), buyerName: OTHER_BUYER }];

test('復原退戶：parkingDetails 不寫回戶別，先前復原留下的也清掉；保留的退戶紀錄不受影響', async () => {
  reset({
    'cancelledPurchases/b': { ...household({ paymentRecords: [] }), parkingData: [parkingDoc('p1', 'S2', 'A1')], parkingDetails: leakedDetails() },
    [HOUSEHOLD]: { projectId: 'p1', unitId: 'A1', salesStatus_backend: null, parkingDetails: leakedDetails() },
  });
  const result = await index.restoreCancelledPurchase.run({ data: { projectId: 'p1', cancelledDocId: 'b', operatorName: '管理', keepRecord: true } });
  assert.equal(result.status, 'success');
  assert.ok(!('parkingDetails' in store.get(HOUSEHOLD)));
  assert.ok(!JSON.stringify(store.get(HOUSEHOLD)).includes(OTHER_BUYER));
  assert.ok(!('parkingData' in store.get(HOUSEHOLD)));
  assert.equal(store.get('cancelledPurchases/b').parkingDetails[0].buyerName, OTHER_BUYER);
});

test('沒有其他程式讀戶別上的 parkingDetails：列表回傳的明細來自 parkingData，不是備份裡的舊明細', async () => {
  reset({
    'cancelledPurchases/b': { ...household({ paymentRecords: [] }), parkingData: [parkingDoc('p1', 'S2', 'A1')], parkingDetails: leakedDetails() },
  });
  const result = await index.getCancelledPurchases.run({ data: { projectId: 'p1', includeDeleted: true, includeRestored: true } });
  assert.deepEqual(result.data[0].parkingDetails.map(p => p.spotId), ['S2']);
  assert.ok(!JSON.stringify(result.data[0].parkingDetails).includes(OTHER_BUYER));
});

// ---- Sheet 同步：用假的 Google Sheets 計算 API 呼叫，不連線
const { google } = require('googleapis');

function installFakeSheets({ failOn = null, headerRow = null, grid = { rowCount: 1000, columnCount: 2000 } } = {}) {
  const calls = [];
  const record = (name) => async (params) => {
    calls.push({ name, params });
    if (failOn === name) throw new Error(`${name} failed`);
    if (name === 'values.get') {
      return { data: { values: String(params.range).endsWith('!1:1') ? [headerRow || []] : [['系統編號 (勿動)'], ['p1_A1']] } };
    }
    if (name === 'spreadsheets.get') {
      return { data: { sheets: [{ properties: { gridProperties: grid } }] } };
    }
    return { data: {} };
  };
  google.auth.GoogleAuth = class { async getClient() { return {}; } };
  google.sheets = () => ({
    spreadsheets: {
      get: record('spreadsheets.get'),
      values: {
        get: record('values.get'),
        clear: record('values.clear'),
        update: record('values.update'),
        append: record('values.append'),
        batchClear: record('values.batchClear'),
      },
    },
  });
  return calls;
}

// 全量同步：先寫入，查格線，有多才清
const FULL_SYNC_CALLS = ['values.update', 'spreadsheets.get', 'values.batchClear'];
const callNames = calls => calls.map(call => call.name);
// A1 欄名轉欄號，與程式的轉換方向相反，才驗得出錯誤
const columnNumber = name => [...name].reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0);

const writtenEvent = (docId, before, after) => ({
  params: { docId },
  data: {
    before: before ? { data: () => before } : undefined,
    after: after ? { data: () => after } : undefined,
  },
});

const sheetSeed = () => ({
  ...seedUsers(),
  'projects/p1': { name: '森之樹', salesSheetId: 'sheet1', salesSheetTabName: 'tab1' },
  [HOUSEHOLD]: household({ paymentRecords: [] }),
});

test('Sheet：批次新增只全量同步一次，觸發器逐戶略過；標記不進 Sheet、也不寫回戶別', async () => {
  reset(sheetSeed());
  const calls = installFakeSheets();
  const before = { ...store.get(HOUSEHOLD) };
  const result = await api({
    action: 'batchAddPlans', userKey: 'mgr', expectedDate: '2027-01-15', note: '第4期', entries: [{ unitId: 'A1', expectedAmount: 1000 }, { unitId: 'A2' }],
  });
  assert.deepEqual(result.added.sort(), ['A1', 'A2']);
  assert.ok(!('sheetSyncWarning' in result));

  assert.deepEqual(callNames(calls), FULL_SYNC_CALLS);
  const { values } = calls[0].params.resource;
  const text = JSON.stringify(values);
  assert.ok(!text.includes(SHEET_SYNC_SKIP_FIELD));
  assert.ok(!text.includes('batch_'));
  assert.ok(values[0].includes('paymentRecords'), '繳款紀錄欄維持在 Sheet 內');
  assert.ok(text.includes('第4期'));
  assert.equal(values.length, 3, '標題列加兩戶');
  assert.ok(!text.includes('p2_Z9'), '其他建案不進 Sheet');

  // 模擬這次批次寫入引發的觸發器：不讀不寫 Sheet，也不再寫戶別
  calls.length = 0;
  const after = { ...store.get(HOUSEHOLD) };
  assert.ok(after[SHEET_SYNC_SKIP_FIELD]);
  await index.onSalesHouseholdWrite.run(writtenEvent('p1_A1', before, after));
  assert.equal(calls.length, 0);
  assert.deepEqual(store.get(HOUSEHOLD), after);
});

test('Sheet：批次之後的單筆繳款更新維持逐筆同步', async () => {
  reset(sheetSeed());
  installFakeSheets();
  await api({ action: 'batchAddPlans', userKey: 'mgr', expectedDate: '2027-01-15', note: '第4期', entries: [{ unitId: 'A1' }] });
  const marked = { ...store.get(HOUSEHOLD) };
  const header = ['系統編號 (勿動)', 'paymentRecords'];
  const calls = installFakeSheets({ headerRow: header });

  const updated = { ...marked, paymentRecords: [{ id: 'x', date: '2027-01-16', amount: 1000 }] };
  await index.onSalesHouseholdWrite.run(writtenEvent('p1_A1', marked, updated));
  assert.deepEqual(calls.map(call => call.name), ['values.get', 'values.get', 'values.update']);
  const row = calls[2].params.resource.values[0];
  assert.equal(row[0], 'p1_A1');
  assert.ok(row[1].includes('2027-01-16'));
});

test('Sheet：其他欄位同時變更時仍逐筆同步；一般全量同步也不帶標記', async () => {
  reset(sheetSeed());
  installFakeSheets();
  await api({ action: 'batchAddPlans', userKey: 'mgr', expectedDate: '2027-01-15', note: '第4期', entries: [{ unitId: 'A1' }] });
  const marked = { ...store.get(HOUSEHOLD) };
  const calls = installFakeSheets({ headerRow: ['系統編號 (勿動)', '戶別'] });

  const changed = { ...marked, buyerName: '李大同', [SHEET_SYNC_SKIP_FIELD]: `${marked[SHEET_SYNC_SKIP_FIELD]}z` };
  await index.onSalesHouseholdWrite.run(writtenEvent('p1_A1', marked, changed));
  assert.equal(calls.filter(call => call.name === 'values.update').length, 1);

  // 手動全量同步：沿用原本流程，會記下設定，戶別上的標記不進 Sheet
  const manual = installFakeSheets();
  const result = await index.syncSalesHouseholdsToSheet.run({ data: { projectId: 'p1', spreadsheetId: 'sheet2', sheetName: 'tab2' } });
  assert.equal(result.status, 'success');
  assert.equal(result.count, 2);
  assert.deepEqual(callNames(manual), FULL_SYNC_CALLS);
  assert.ok(manual.every(call => call.params.spreadsheetId === 'sheet2'));
  assert.ok(!JSON.stringify(manual[0].params.resource.values).includes(SHEET_SYNC_SKIP_FIELD));
  assert.equal(store.get('projects/p1').salesSheetId, 'sheet2');
  assert.equal(store.get('projects/p1').salesSheetTabName, 'tab2');

  store.delete(HOUSEHOLD);
  store.delete('salesHouseholds/p1_A2');
  const empty = await index.syncSalesHouseholdsToSheet.run({ data: { projectId: 'p1', spreadsheetId: 'sheet2', sheetName: 'tab2' } });
  assert.equal(empty.message, '該專案尚無銷控資料');
});

test('Sheet：批次後全量同步失敗回傳警告，批次仍算成功；沒設定 Sheet 不呼叫也不寫標記', async () => {
  reset(sheetSeed());
  const failedCalls = installFakeSheets({ failOn: 'values.update' });
  const failed = await api({ action: 'batchAddPlans', userKey: 'mgr', expectedDate: '2027-01-15', note: '第4期', entries: [{ unitId: 'A1' }] });
  assert.equal(failed.status, 'success');
  assert.deepEqual(failed.added, ['A1']);
  assert.match(failed.sheetSyncWarning, /values\.update failed/);
  assert.equal(store.get(HOUSEHOLD).paymentRecords.length, 1);
  assert.deepEqual(callNames(failedCalls), ['values.update'], '寫入失敗不可清除，Sheet 維持原資料');

  reset({ ...seedUsers(), 'projects/p1': { name: '森之樹' } });
  const calls = installFakeSheets();
  const plain = await api({ action: 'batchAddPlans', userKey: 'mgr', expectedDate: '2027-01-15', note: '第4期', entries: [{ unitId: 'A1' }] });
  assert.deepEqual(plain.added, ['A1']);
  assert.equal(calls.length, 0);
  assert.ok(!(SHEET_SYNC_SKIP_FIELD in store.get(HOUSEHOLD)));
});

test('Sheet：退戶備份的標記不進退戶 Sheet；退戶 Sheet 有自己的流程，仍先清空再寫入', async () => {
  reset(sheetSeed());
  installFakeSheets();
  await api({ action: 'batchAddPlans', userKey: 'mgr', expectedDate: '2027-01-15', note: '第4期', entries: [{ unitId: 'A1' }] });
  await index.cancelPurchase.run({ data: { projectId: 'p1', unitId: 'A1', operatorName: '管理', cancellationDate: '2026-12-01' } });
  assert.ok(store.get(backupKey())[SHEET_SYNC_SKIP_FIELD], '備份會帶到標記');
  const calls = installFakeSheets();
  const result = await index.syncCancelledPurchasesToSheet.run({ data: { projectId: 'p1', spreadsheetId: 'sheet3', sheetName: 'tab3' } });
  assert.equal(result.status, 'success');
  assert.deepEqual(callNames(calls), ['values.clear', 'values.update']);
  const update = calls.find(call => call.name === 'values.update');
  assert.ok(!JSON.stringify(update.params.resource.values).includes(SHEET_SYNC_SKIP_FIELD));
});

const fullSync = (extra = {}) => index.syncSalesHouseholdsToSheet.run({ data: { projectId: 'p1', spreadsheetId: 'sheet1', sheetName: 'tab1', ...extra } });

test('全量同步：先寫入，成功後才清下方多的列與右側多的欄；空值以空字串蓋掉舊內容', async () => {
  reset(sheetSeed());
  const calls = installFakeSheets();
  const result = await fullSync();
  assert.deepEqual([result.status, result.count], ['success', 2]);
  assert.deepEqual(callNames(calls), FULL_SYNC_CALLS);

  const [update, gridLookup, clear] = calls;
  assert.equal(update.params.range, "'tab1'!A1");
  const { values } = update.params.resource;
  assert.equal(values.length, 3, '標題列加兩戶');
  // Sheets 會略過 null，不先清空時舊內容就留著，所以每格都要是字串
  assert.ok(values.flat().every(cell => typeof cell === 'string'));
  assert.deepEqual(gridLookup.params.ranges, ["'tab1'!A1"]);

  const [rowRange, columnRange] = clear.params.resource.ranges;
  assert.equal(rowRange, "'tab1'!A4:ZZ");
  const [, column] = columnRange.match(/^'tab1'!([A-Z]+)1:ZZ$/);
  assert.ok(values[0].length > 26, '要涵蓋兩個字母的欄名');
  assert.equal(columnNumber(column), values[0].length + 1);
});

test('全量同步：欄名跨字母邊界都正確', async () => {
  for (let extra = 0; extra < 30; extra += 1) {
    const fields = Object.fromEntries(Array.from({ length: extra }, (_, i) => [`extra${i}`, 'v']));
    reset({ ...sheetSeed(), [HOUSEHOLD]: household({ paymentRecords: [], ...fields }) });
    const calls = installFakeSheets();
    await fullSync();
    const columns = calls[0].params.resource.values[0].length;
    const [, column] = calls[2].params.resource.ranges[1].match(/!([A-Z]+)1:ZZ$/);
    assert.equal(columnNumber(column), columns + 1);
  }
});

test('全量同步：格線放滿時不清除，起點超出格線 Sheets 會報錯；只清真的多出來的部分', async () => {
  reset(sheetSeed());
  const probe = installFakeSheets();
  await fullSync();
  const { values } = probe[0].params.resource;
  const rowCount = values.length;
  const columnCount = values[0].length;

  const exact = installFakeSheets({ grid: { rowCount, columnCount } });
  assert.equal((await fullSync()).status, 'success');
  assert.deepEqual(callNames(exact), ['values.update', 'spreadsheets.get']);

  const moreRows = installFakeSheets({ grid: { rowCount: rowCount + 5, columnCount } });
  await fullSync();
  assert.deepEqual(moreRows[2].params.resource.ranges, [`'tab1'!A${rowCount + 1}:ZZ`]);

  const moreColumns = installFakeSheets({ grid: { rowCount, columnCount: columnCount + 5 } });
  await fullSync();
  assert.equal(moreColumns[2].params.resource.ranges.length, 1);
  assert.match(moreColumns[2].params.resource.ranges[0], /^'tab1'![A-Z]+1:ZZ$/);
});

test('全量同步：欄數到清除範圍右邊界 ZZ 時不清右側；原本的清除範圍也只到 ZZ', async () => {
  const fields = Object.fromEntries(Array.from({ length: 720 }, (_, i) => [`extra${i}`, 'v']));
  reset({ ...sheetSeed(), [HOUSEHOLD]: household({ paymentRecords: [], ...fields }) });
  const calls = installFakeSheets({ grid: { rowCount: 1000, columnCount: 3000 } });
  await fullSync();
  assert.ok(calls[0].params.resource.values[0].length >= 702);
  assert.deepEqual(calls[2].params.resource.ranges, ["'tab1'!A4:ZZ"]);
});

test('全量同步：手動同步寫入失敗不清除並回報錯誤；已記下的設定行為不變', async () => {
  // 沒有使用者：失敗通知不會真的組信
  reset({ [HOUSEHOLD]: household({ paymentRecords: [] }), 'projects/p1': { name: '森之樹' } });
  const calls = installFakeSheets({ failOn: 'values.update' });
  await assert.rejects(fullSync(), err => err.code === 'internal' && /同步失敗.*values\.update failed/.test(err.message));
  assert.deepEqual(callNames(calls), ['values.update']);
  assert.equal(store.get('projects/p1').salesSheetId, 'sheet1');
});

test('全量同步：新資料已寫入但清舊資料失敗，一樣走失敗回報', async () => {
  for (const failOn of ['spreadsheets.get', 'values.batchClear']) {
    reset({ [HOUSEHOLD]: household({ paymentRecords: [] }), 'projects/p1': { name: '森之樹' } });
    const calls = installFakeSheets({ failOn });
    await assert.rejects(fullSync(), err => err.code === 'internal' && err.message.includes(`${failOn} failed`));
    assert.equal(calls[0].name, 'values.update');

    reset(sheetSeed());
    installFakeSheets({ failOn });
    const batch = await api({ action: 'batchAddPlans', userKey: 'mgr', expectedDate: '2027-01-15', note: '第4期', entries: [{ unitId: 'A1' }] });
    assert.deepEqual(batch.added, ['A1']);
    assert.ok(batch.sheetSyncWarning.includes(`${failOn} failed`));
  }
});

test('全量同步：讀不到格線時回報失敗，不會默默留下舊資料', async () => {
  reset({ [HOUSEHOLD]: household({ paymentRecords: [] }), 'projects/p1': { name: '森之樹' } });
  installFakeSheets({ grid: undefined });
  google.sheets = () => ({
    spreadsheets: {
      get: async () => ({ data: { sheets: [] } }),
      values: { update: async () => ({ data: {} }) },
    },
  });
  await assert.rejects(fullSync(), err => err.code === 'internal' && /格線/.test(err.message));
});

test('全量同步：沒有戶別時回傳 0，不動 Sheet', async () => {
  reset({ 'projects/p1': { name: '森之樹' } });
  const calls = installFakeSheets();
  assert.equal((await fullSync()).message, '該專案尚無銷控資料');
  assert.equal(calls.length, 0);
});

test('Sheet：戶別上殘留的 parkingDetails 不進全量與逐筆同步；舊 Sheet 的這一欄會被清掉', async () => {
  reset({ ...sheetSeed(), [HOUSEHOLD]: household({ paymentRecords: [], parkingDetails: leakedDetails() }) });
  const calls = installFakeSheets();
  await fullSync();
  const { values } = calls[0].params.resource;
  assert.ok(!values[0].includes('parkingDetails'));
  assert.ok(!JSON.stringify(values).includes(OTHER_BUYER));
  // 舊 Sheet 的動態欄在新表頭右側或被覆蓋，右側這段要清
  assert.equal(columnNumber(calls[2].params.resource.ranges[1].match(/!([A-Z]+)1:ZZ$/)[1]), values[0].length + 1);

  const single = installFakeSheets({ headerRow: ['系統編號 (勿動)', 'parkingDetails'] });
  const before = store.get(HOUSEHOLD);
  await index.onSalesHouseholdWrite.run(writtenEvent('p1_A1', before, { ...before, buyerName: '李大同' }));
  const update = single.find(call => call.name === 'values.update');
  assert.deepEqual(update.params.resource.values[0], ['p1_A1', '']);
});

test('Sheet：退戶 Sheet 同樣不輸出 parkingDetails', async () => {
  reset({
    'cancelledPurchases/p1_A1_20260901000000': { ...household({ paymentRecords: [] }), parkingData: [parkingDoc('p1', 'S2', 'A1')], parkingDetails: leakedDetails() },
  });
  const calls = installFakeSheets();
  await index.syncCancelledPurchasesToSheet.run({ data: { projectId: 'p1', spreadsheetId: 'sheet3', sheetName: 'tab3' } });
  const { values } = calls.find(call => call.name === 'values.update').params.resource;
  assert.ok(!values[0].includes('parkingDetails'));
  assert.ok(!JSON.stringify(values).includes(OTHER_BUYER));
});

const proof = data => index.paymentProofApi.run({ data: { projectId: 'p1', unitId: 'A1', ...data } });

test('paymentProofApi：舊呼叫方式的紀錄內容不變', async () => {
  reset({ [HOUSEHOLD]: household({ paymentRecords: [] }) });
  const added = await proof({ action: 'addRecord', date: '2026-12-01', amount: 100, note: '舊', base64: null });
  assert.deepEqual(Object.keys(added.record).sort(), ['amount', 'createdAt', 'date', 'file', 'id', 'note', 'updatedAt']);
  const updated = await proof({ action: 'updateRecord', recordId: added.record.id, date: '2026-12-02', amount: 200, note: '舊2', base64: null, removeFile: false });
  assert.deepEqual(Object.keys(updated.record).sort(), ['amount', 'createdAt', 'date', 'file', 'id', 'note', 'updatedAt']);
  assert.equal(store.get(HOUSEHOLD).paymentRecords[0].amount, 200);
});

test('paymentProofApi：預計 → 已繳 → 改回預計的完整流程', async () => {
  reset({ [HOUSEHOLD]: household({ paymentRecords: [] }) });
  const plan = await proof({ action: 'addRecord', date: '', amount: null, note: '第3期', expectedDate: '2026-12-20', expectedAmount: 300000, planSource: 'batch' });
  assert.equal(plan.record.amount, null);
  assert.equal(plan.record.date, '');
  assert.equal(plan.record.expectedAmount, 300000);
  assert.equal(plan.record.planSource, 'batch');

  const marked = await proof({ action: 'updateRecord', recordId: plan.record.id, date: '2026-12-21', amount: 200000, note: '第3期', paidBy: '王', base64: null, removeFile: false });
  assert.equal(marked.record.amount, 200000);
  assert.equal(marked.record.expectedDate, '2026-12-20');
  assert.equal(marked.record.paidBy, '王');
  assert.ok(marked.record.paidAt);

  const reverted = await proof({ action: 'updateRecord', recordId: plan.record.id, date: '', amount: null, note: '第3期', removeFile: true, base64: null });
  assert.equal(reverted.record.date, '');
  assert.equal(reverted.record.amount, null);
  assert.equal(reverted.record.paidAt, null);
  assert.equal(reverted.record.paidBy, null);
  assert.equal(reverted.record.expectedDate, '2026-12-20');
  assert.equal(reverted.trashWarning, false);
});

test('paymentProofApi：拒絕不合法的輸入，不動資料', async () => {
  reset({ [HOUSEHOLD]: household({ paymentRecords: [paid] }) });
  const invalid = err => err.code === 'invalid-argument';
  await assert.rejects(proof({ action: 'addRecord', date: '', amount: null, note: 'x' }), invalid);
  await assert.rejects(proof({ action: 'addRecord', date: '', amount: null, expectedDate: '2026-12-20', base64: 'QUJD' }), invalid);
  await assert.rejects(proof({ action: 'addRecord', date: '2026-02-30', amount: 1, expectedDate: '2026-02-10' }), invalid);
  await assert.rejects(proof({ action: 'addRecord', date: '', amount: null, expectedDate: '2026-12-20', expectedAmount: -1 }), invalid);
  // 已繳紀錄沒有預計日，不可變成未繳
  await assert.rejects(proof({ action: 'updateRecord', recordId: 'pr_d', date: '', amount: null, removeFile: true }), invalid);
  assert.deepEqual(store.get(HOUSEHOLD).paymentRecords.map(r => r.id), ['pr_d']);
});

test('paymentProofApi：有憑證的已繳改回預計要先移除憑證；Drive 失敗只回警告', async () => {
  const proofRecord = { ...paid, expectedDate: '2026-11-30', expectedAmount: 5 };
  reset({ [HOUSEHOLD]: household({ paymentRecords: [proofRecord] }) });
  await assert.rejects(
    proof({ action: 'updateRecord', recordId: 'pr_d', date: '', amount: null, note: 'n', removeFile: false }),
    err => err.code === 'invalid-argument' && /移除憑證/.test(err.message),
  );
  const result = await proof({ action: 'updateRecord', recordId: 'pr_d', date: '', amount: null, note: 'n', removeFile: true });
  assert.equal(result.record.file, null);
  assert.equal(result.record.date, '');
  assert.equal(result.trashWarning, true);
});

const api = data => index.paymentReminderApi.run({ data: { projectId: 'p1', ...data } });

const seedUsers = () => ({
  'users/admin': { name: '系統', roles: ['系統管理員'] },
  'users/mgr': { name: '管理', lineId: 'Umgr', email: 'mgr@example.com' },
  'userPermissions/mgr': { permissions: { p1: { systems: ['銷控系統'] } } },
  'users/s1': { name: '銷售', lineId: 'Us1' },
  'userPermissions/s1': { permissions: { p1: { systems: ['報價系統'] } } },
  'users/none': { name: '無權限' },
  [`${HOUSEHOLD}`]: household({ paymentRecords: [planned] }),
  'salesHouseholds/p1_A2': household({ unitId: 'A2', salespersonUserKey: ['other'], paymentRecords: [{ ...planned, id: 'pr_q' }] }),
  // 其他建案的戶別不可出現在結果中
  'salesHouseholds/p2_Z9': household({ projectId: 'p2', unitId: 'Z9', salespersonUserKey: ['s1'], paymentRecords: [{ ...planned, id: 'pr_z' }] }),
});

test('paymentReminderApi 分派：缺參數、未知動作與權限', async () => {
  reset(seedUsers());
  await assert.rejects(index.paymentReminderApi.run({ data: { action: 'listDue', userKey: 'mgr' } }), err => err.code === 'invalid-argument');
  await assert.rejects(api({ action: 'listDue' }), err => err.code === 'unauthenticated');
  await assert.rejects(api({ action: 'listDue', userKey: 'ghost' }), err => err.code === 'permission-denied');
  await assert.rejects(api({ action: 'listDue', userKey: 'none' }), err => err.code === 'permission-denied');
  await assert.rejects(api({ action: 'nope', userKey: 'mgr' }), err => err.code === 'invalid-argument' && /未知/.test(err.message));
  await assert.rejects(api({ action: 'batchAddPlans', userKey: 's1', expectedDate: '2026-12-20', entries: [{ unitId: 'A1' }] }), err => err.code === 'permission-denied');
  await assert.rejects(api({ action: 'runNow', userKey: 'mgr' }), err => err.code === 'permission-denied');
});

test('paymentReminderApi 分派：listDue、batchAddPlans、previewRecipients、listLogs、runNow 走到對應處理', async () => {
  reset(seedUsers());
  const manager = await api({ action: 'listDue', userKey: 'mgr' });
  assert.equal(manager.canManage, true);
  assert.deepEqual(manager.items.map(i => i.unitId).sort(), ['A1', 'A2']);
  assert.ok(!('Z9' in manager.units));
  const sales = await api({ action: 'listDue', userKey: 's1' });
  assert.equal(sales.canManage, false);
  assert.deepEqual(sales.items.map(i => i.unitId), ['A1']);

  const batch = await api({ action: 'batchAddPlans', userKey: 'mgr', expectedDate: '2027-01-15', note: '第4期', entries: [{ unitId: 'A1', expectedAmount: 1000 }, { unitId: 'A9' }] });
  assert.deepEqual(batch.added, ['A1']);
  assert.deepEqual(batch.skipped, [{ unitId: 'A9', reason: 'not-found' }]);
  assert.deepEqual(batch.failed, []);

  const preview = await api({ action: 'previewRecipients', userKey: 'mgr', settings: { managers: { channels: ['line'] } } });
  assert.deepEqual(preview.managers.map(m => m.userKey), ['mgr']);
  assert.ok(preview.salespersons.some(s => s.userKey === 's1' && s.hasPermission));
  assert.ok(!JSON.stringify(preview).includes('mgr@example.com'));

  const logs = await api({ action: 'listLogs', userKey: 'mgr' });
  assert.deepEqual(logs, { status: 'success', logs: [] });

  await assert.rejects(api({ action: 'runNow', userKey: 'admin' }), err => err.code === 'not-found');
  store.set('projects/p1', { name: '森之樹', paymentReminderSettings: { enabled: false } });
  await assert.rejects(api({ action: 'runNow', userKey: 'admin' }), err => err.code === 'failed-precondition');
});

test('paymentReminderApi sendTest：只寄給操作者，連線被擋時回報失敗，不丟例外', async () => {
  reset({ ...seedUsers(), 'projects/p1': { name: '森之樹' } });
  const before = blockedConnections.length;
  const result = await api({ action: 'sendTest', userKey: 'mgr', channels: ['line'] });
  assert.equal(result.attempts.length, 1);
  assert.equal(result.attempts[0].channel, 'line');
  assert.equal(result.attempts[0].status, 'failed');
  assert.ok(blockedConnections.length > before, '應該嘗試連線並被封鎖');
  const log = [...store.entries()].find(([key]) => key.includes('notificationLogs/'))[1];
  assert.equal(log.type, 'paymentDueTest');
  assert.equal(log.status, 'partial');
  const logs = await api({ action: 'listLogs', userKey: 'mgr' });
  assert.equal(logs.logs[0].type, 'paymentDueTest');
});

test('排程進入點：掃描啟用建案，連線被擋時記為 partial', async () => {
  reset({
    ...seedUsers(),
    'projects/p1': { name: '森之樹', paymentReminderSettings: { enabled: true, offsetDays: [0], sendHour: 9 } },
    [HOUSEHOLD]: household({ paymentRecords: [{ ...planned, expectedDate: new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' }) }] }),
  });
  const { runScheduledReminders } = require('../paymentDueReminder');
  // 固定在今天台北 09:00，確保落在發送時段
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
  const now = new Date(`${today}T09:00:00+08:00`);
  const results = await runScheduledReminders({ db, now });
  assert.equal(results.length, 1);
  assert.equal(results[0].projectId, 'p1');
  assert.equal(results[0].status, 'partial');
  assert.ok(results[0].failed > 0);
  const log = store.get(`projects/p1/notificationLogs/paymentDue_${today.replace(/-/g, '')}`);
  assert.ok(!JSON.stringify(log).includes('王小明'));
  assert.ok(!JSON.stringify(log).includes('0912345678'));
});

test('全程沒有成功的對外連線', () => {
  // 所有連線函式都被替換為丟錯的封鎖函式
  assert.throws(() => require('https').request('https://example.com'), /NETWORK BLOCKED/);
  assert.throws(() => require('net').Socket.prototype.connect.call({}), /NETWORK BLOCKED/);
});

test.after(() => {
  restore();
});
