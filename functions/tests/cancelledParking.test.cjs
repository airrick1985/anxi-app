// 載入真正的 functions/index.js（假 Firestore、封鎖對外連線）：車位轉出、退戶、查詢與復原的完整流程。
const test = require('node:test');
const assert = require('node:assert/strict');
const { Timestamp } = require('@google-cloud/firestore');
const { db, loadIndex } = require('./helpers/loadIndexOffline.cjs');

const quiet = { log: console.log, warn: console.warn, error: console.error };
const silence = () => { console.log = () => {}; console.warn = () => {}; console.error = () => {}; };
const restoreConsole = () => { console.log = quiet.log; console.warn = quiet.warn; console.error = quiet.error; };

silence();
const index = loadIndex();
test.after(restoreConsole);

const { store } = db;
const reset = (seed = {}) => {
  store.clear();
  store.set('projects/p1', { name: '森之樹' });
  Object.entries(seed).forEach(([key, value]) => store.set(key, value));
};

const household = (unitId, extra = {}) => ({
  projectId: 'p1', unitId, salesStatus_backend: '簽約', status: '簽約', buyerName: '王小明',
  price_transaction_house: 3010, remarks: '', remarkNotes: [], ...extra,
});
const parking = (spotId, buyerUnitId, extra = {}) => ({
  projectId: 'p1', spotId, floor: 'B3', type: '自設', type2: '坡道平面', size: '600*250',
  price_list: 270, price_floor: 255, price_transaction: 255, status: '已售', status_backend: '簽約',
  buyerUnitId, buyerName: '王小明', salesperson: ['甲'], salespersonUserKey: ['s1'], remarks: '', ...extra,
});
const seedHousehold = (unitId, extra) => [`salesHouseholds/p1_${unitId}`, household(unitId, extra)];
const seedParking = (spotId, unitId, extra) => [`salesParkings/p1_${spotId}`, parking(spotId, unitId, extra)];

const rebound = (spotId, toUnitId, afterExtra = {}) => {
  const key = `salesParkings/p1_${spotId}`;
  const before = store.get(key);
  const after = { ...before, buyerUnitId: toUnitId, ...afterExtra };
  store.set(key, after);
  return index.onSalesParkingRebound.run({ data: { before: { data: () => before }, after: { data: () => after } } });
};
const cancel = unitId => index.cancelPurchase.run({ data: { projectId: 'p1', unitId, operatorName: '管理', cancelReasons: ['換戶'], cancellationDate: '2026-11-03' } });
const listed = async () => (await index.getCancelledPurchases.run({ data: { projectId: 'p1', includeDeleted: true, includeRestored: true } })).data;
const moveOutKeys = () => [...store.keys()].filter(key => key.startsWith('salesParkingMoveOuts/'));
const backupKey = () => [...store.keys()].find(key => key.startsWith('cancelledPurchases/'));

test('退戶當下還綁著的車位：編號與價格都進紀錄並釋出', async () => {
  reset(Object.fromEntries([seedHousehold('A-9'), seedParking('B3-115', 'A-9')]));
  await cancel('A-9');
  const [record] = await listed();
  assert.equal(record.parkingCount, 1);
  const [spot] = record.parkingDetails;
  assert.deepEqual(
    [spot.spotId, spot.floor, spot.type, spot.type2, spot.size, spot.price_list, spot.price_floor, spot.price_transaction, spot.status_backend],
    ['B3-115', 'B3', '自設', '坡道平面', '600*250', 270, 255, 255, '簽約'],
  );
  assert.equal(spot.movedOut, false);
  assert.equal(spot.countsToDeal, true);
  assert.equal(store.get('salesParkings/p1_B3-115').buyerUnitId, null);
});

test('換戶、沒有快照：車位先轉走，轉出時的紀錄帶進退戶紀錄，車位留在新戶', async () => {
  reset(Object.fromEntries([seedHousehold('A-9'), seedHousehold('D-8'), seedParking('B3-115', 'A-9')]));
  await rebound('B3-115', 'D-8');
  assert.deepEqual(moveOutKeys(), ['salesParkingMoveOuts/p1_A-9_B3-115']);

  await cancel('A-9');
  const [record] = await listed();
  const [spot] = record.parkingDetails;
  assert.deepEqual([spot.spotId, spot.price_transaction, spot.movedOut, spot.movedToUnitId, spot.countsToDeal], ['B3-115', 255, true, 'D-8', true]);
  assert.equal(store.get('salesParkings/p1_B3-115').buyerUnitId, 'D-8', '新戶的車位不可被釋出');
  assert.deepEqual(moveOutKeys(), [], '紀錄帶走後要清除，不能算到下一位買方');
});

test('舊紀錄（A-9 案例）：備份沒有車位但快照有，查詢時補上', async () => {
  reset({
    'cancelledPurchases/old': {
      projectId: 'p1', unitId: 'A-9', salesStatus_backend: '簽約', price_transaction_house: 3010,
      parkingData: [],
      持有車位: [{ 車位編號: 'B3-115', spotId: 'B3-115', price_list: 270, 車位底價: 255, price_floor: 255, 車位成交價: 255, price_transaction: 255, status_backend: '簽約', buyerUnitId: 'A-9', projectId: 'p1' }],
      _cancellationMeta: { operatorName: '管理', cancellationDate: null, parkingCount: 0 },
    },
  });
  const [record] = await listed();
  assert.equal(record.parkingCount, 1);
  assert.deepEqual([record.parkingDetails[0].spotId, record.parkingDetails[0].price_transaction, record.parkingDetails[0].movedOut], ['B3-115', 255, true]);
});

test('快照有、已轉到別戶：退戶時記下去向；已無人綁定視為釋出，不列入', async () => {
  reset(Object.fromEntries([
    seedHousehold('A-9', { 持有車位: [{ spotId: 'B3-115', price_transaction: 255 }, { spotId: 'B3-200', price_transaction: 100 }] }),
    seedParking('B3-115', 'D-8'),
    seedParking('B3-200', null),
  ]));
  await cancel('A-9');
  const [record] = await listed();
  assert.deepEqual(record.parkingDetails.map(p => [p.spotId, p.movedToUnitId]), [['B3-115', 'D-8']]);
});

test('同時有綁定與快照：同一車位不重複，以綁定的資料為準', async () => {
  reset(Object.fromEntries([
    seedHousehold('A-9', { 持有車位: [{ spotId: 'B3-115', price_transaction: 1 }] }),
    seedParking('B3-115', 'A-9'),
  ]));
  await cancel('A-9');
  const [record] = await listed();
  assert.deepEqual(record.parkingDetails.map(p => [p.spotId, p.price_transaction, p.movedOut]), [['B3-115', 255, false]]);
});

test('準備購買的車位列出但不計入：D-15 案例', async () => {
  reset(Object.fromEntries([
    seedHousehold('D-15', { salesStatus_backend: '小訂', price_transaction_house: 3569 }),
    seedParking('B6-13', 'D-15', { status_backend: '小訂', price_transaction: 165 }),
    seedParking('B6-13A', 'D-15', { status_backend: '已售', price_transaction: 175 }),
  ]));
  await cancel('D-15');
  const [record] = await listed();
  assert.deepEqual(record.parkingDetails.map(p => [p.spotId, p.countsToDeal]).sort(), [['B6-13', true], ['B6-13A', false]]);
});

test('復原：還綁著的車位寫回；已轉出的不搶回新戶，也不寫進戶別文件', async () => {
  reset(Object.fromEntries([
    seedHousehold('A-9'), seedHousehold('D-8'),
    seedParking('B3-115', 'A-9'), seedParking('B3-116', 'A-9'),
  ]));
  await rebound('B3-115', 'D-8');
  await cancel('A-9');
  const cancelledDocId = backupKey().split('/')[1];
  const result = await index.restoreCancelledPurchase.run({ data: { projectId: 'p1', cancelledDocId, operatorName: '管理', keepRecord: true } });
  assert.equal(result.status, 'success');
  assert.equal(store.get('salesParkings/p1_B3-115').buyerUnitId, 'D-8');
  assert.equal(store.get('salesParkings/p1_B3-116').buyerUnitId, 'A-9');
  assert.equal(store.get('salesHouseholds/p1_A-9').parkingMovedOut, undefined);
  assert.deepEqual(moveOutKeys(), ['salesParkingMoveOuts/p1_A-9_B3-115'], '復原後再退戶還要帶得到');

  // 假 Firestore 會原樣存 serverTimestamp 佔位值，正式環境讀回的是時間，備份時放進陣列才合法
  store.set('salesParkings/p1_B3-116', { ...store.get('salesParkings/p1_B3-116'), updatedAt: Timestamp.now() });
  await cancel('A-9');
  const records = await listed();
  const latest = records.find(r => !r.isRestored);
  assert.deepEqual(latest.parkingDetails.map(p => [p.spotId, p.movedOut]).sort(), [['B3-115', true], ['B3-116', false]]);
});

const restore = (extra = {}) => index.restoreCancelledPurchase.run({
  data: { projectId: 'p1', cancelledDocId: backupKey().split('/')[1], operatorName: '管理', keepRecord: true, ...extra },
});
const soldToOther = parking('B3-115', 'E-10', { buyerName: '別的買方', price_transaction: 300 });
const seedTwoSpots = extra => Object.fromEntries([
  seedHousehold('A-9', extra), seedParking('B3-115', 'A-9'), seedParking('B3-116', 'A-9', { price_transaction: 100 }),
]);

test('復原遇到車位已賣給別戶：回傳衝突，任何資料都不寫入', async () => {
  reset(seedTwoSpots());
  await cancel('A-9');
  store.set('salesParkings/p1_B3-115', soldToOther);
  const householdBefore = store.get('salesHouseholds/p1_A-9');

  const result = await restore();

  assert.equal(result.status, 'parking-conflict');
  assert.deepEqual(result.parkingConflicts, [{ spotId: 'B3-115', unitId: 'E-10', status: '簽約' }]);
  assert.deepEqual(store.get('salesParkings/p1_B3-115'), soldToOther);
  assert.equal(store.get('salesParkings/p1_B3-116').buyerUnitId, null, '其他車位也不可先寫回');
  assert.deepEqual(store.get('salesHouseholds/p1_A-9'), householdBefore);
  assert.equal(store.get(backupKey())._isRestored, undefined);
});

test('確認後不含衝突車位復原：別戶資料不動，戶別快照與總價扣掉，再退戶也不會算進去', async () => {
  reset(seedTwoSpots({ 持有車位: [{ spotId: 'B3-115', price_transaction: 255 }, { spotId: 'B3-116', price_transaction: 100 }], price_transaction_total: 3365 }));
  await cancel('A-9');
  store.set('salesParkings/p1_B3-115', soldToOther);

  const result = await restore({ skipParkingConflicts: true });

  assert.equal(result.status, 'success');
  assert.equal(result.restoredParkingCount, 1);
  assert.match(result.message, /未恢復車位 B3-115（E-10）/);
  assert.deepEqual(store.get('salesParkings/p1_B3-115'), soldToOther);
  assert.equal(store.get('salesParkings/p1_B3-116').buyerUnitId, 'A-9');
  const restored = store.get('salesHouseholds/p1_A-9');
  assert.deepEqual(restored['持有車位'].map(p => p.spotId), ['B3-116']);
  assert.equal(restored.price_transaction_total, 3110);
  assert.match(restored.remarkNotes.at(-1).content, /未恢復車位 B3-115（E-10）/);

  store.set('salesParkings/p1_B3-116', { ...store.get('salesParkings/p1_B3-116'), updatedAt: Timestamp.now() });
  await cancel('A-9');
  const latest = (await listed()).find(r => !r.isRestored);
  assert.deepEqual(latest.parkingDetails.map(p => p.spotId), ['B3-116']);
});

test('沒有衝突時，確認參數不影響復原，戶別快照與總價照備份', async () => {
  const seed = seedTwoSpots({ 持有車位: [{ spotId: 'B3-115', price_transaction: 255 }], price_transaction_total: 9999 });
  reset(seed);
  await cancel('A-9');
  const result = await restore({ skipParkingConflicts: true });
  assert.equal(result.status, 'success');
  assert.equal(result.restoredParkingCount, 2);
  const restored = store.get('salesHouseholds/p1_A-9');
  assert.equal(restored.price_transaction_total, 9999);
  assert.deepEqual(restored['持有車位'].map(p => p.spotId), ['B3-115']);
  assert.equal(restored.remarkNotes.at(-1).content, '復原退戶記錄，戶別銷售資料已還原');
});

test('車位現況判定：保留、備註算有資料；釋出、可售、舊版殘留的 salespersonUserKey、文件不存在不算', async () => {
  const empty = { buyerName: null, buyerUnitId: null, remarks: '', salesperson: [], salespersonUserKey: [], status: null, status_backend: null, price_transaction: null };
  const cases = [
    ['保留未綁戶', { status_backend: '保留', status: '已售' }, true],
    ['只有備註', { remarks: '留給親友' }, true],
    ['只有銷售人員', { salesperson: ['甲'] }, true],
    ['只有成交價', { price_transaction: 200 }, true],
    ['綁回本戶', { buyerUnitId: 'A-9' }, true],
    ['殘留 salespersonUserKey', { salespersonUserKey: ['s1'] }, false],
    ['釋出', { status_backend: '釋出' }, false],
    ['可售', { status_backend: '可售', status: '未售' }, false],
    ['成交價 0', { price_transaction: 0 }, false],
  ];
  for (const [name, fields, inUse] of cases) {
    reset(seedTwoSpots());
    await cancel('A-9');
    store.set('salesParkings/p1_B3-115', { ...store.get('salesParkings/p1_B3-115'), ...empty, ...fields });
    const result = await restore();
    assert.equal(result.status, inUse ? 'parking-conflict' : 'success', name);
  }

  reset(seedTwoSpots());
  await cancel('A-9');
  store.delete('salesParkings/p1_B3-115');
  assert.equal((await restore()).status, 'success', '文件不存在');
  assert.equal(store.get('salesParkings/p1_B3-115').buyerUnitId, 'A-9');
});

test('轉出後又回到原戶：轉出紀錄取消', async () => {
  reset(Object.fromEntries([seedHousehold('A-9'), seedHousehold('D-8'), seedParking('B3-115', 'A-9')]));
  await rebound('B3-115', 'D-8');
  await rebound('B3-115', 'A-9');
  assert.deepEqual(moveOutKeys(), ['salesParkingMoveOuts/p1_D-8_B3-115']);
  await cancel('A-9');
  const [record] = await listed();
  assert.deepEqual(record.parkingDetails.map(p => [p.spotId, p.movedOut]), [['B3-115', false]]);
});

test('釋出後再綁回原戶：也會取消先前的轉出紀錄', async () => {
  reset(Object.fromEntries([seedHousehold('A-9'), seedHousehold('D-8'), seedParking('B3-115', 'A-9')]));
  await rebound('B3-115', 'D-8');
  await rebound('B3-115', null);
  await rebound('B3-115', 'A-9');
  assert.deepEqual(moveOutKeys(), []);
});

test('不算轉出：釋出、原戶沒有銷售狀態、準備購買、只改其他欄位', async () => {
  reset(Object.fromEntries([seedHousehold('A-9'), seedParking('B3-115', 'A-9')]));
  await rebound('B3-115', null);
  assert.deepEqual(moveOutKeys(), [], '釋出');

  reset(Object.fromEntries([seedHousehold('A-9', { salesStatus_backend: null }), seedParking('B3-115', 'A-9')]));
  await rebound('B3-115', 'D-8');
  assert.deepEqual(moveOutKeys(), [], '原戶沒有銷售狀態');

  reset(Object.fromEntries([seedHousehold('A-9'), seedParking('B3-115', 'A-9', { status_backend: '保留' })]));
  await rebound('B3-115', 'D-8');
  assert.deepEqual(moveOutKeys(), [], '準備購買');

  reset(Object.fromEntries([seedHousehold('A-9'), seedParking('B3-115', 'A-9')]));
  await rebound('B3-115', 'A-9', { remarks: '改備註' });
  assert.deepEqual(moveOutKeys(), [], '沒有換戶');
});

test('前任買方的轉出紀錄（狀態未經退戶清空）：不算到現任買方，退戶後一併清除', async () => {
  reset(Object.fromEntries([seedHousehold('A-9'), seedHousehold('D-8'), seedParking('B3-115', 'A-9')]));
  await rebound('B3-115', 'D-8');
  store.set('salesHouseholds/p1_A-9', household('A-9', { buyerName: '新買方' }));
  await cancel('A-9');
  const [record] = await listed();
  assert.deepEqual(record.parkingDetails, []);
  assert.deepEqual(moveOutKeys(), []);
});

test('其他建案的車位不列入（舊版退戶留下的備份）', async () => {
  reset({
    'cancelledPurchases/old': {
      projectId: 'p1', unitId: 'A-9', salesStatus_backend: '簽約',
      parkingData: [parking('B3-115', 'A-9'), parking('B9-999', 'A-9', { projectId: 'p2' })],
      _cancellationMeta: { operatorName: '管理', cancellationDate: null },
    },
  });
  const [record] = await listed();
  assert.deepEqual(record.parkingDetails.map(p => p.spotId), ['B3-115']);
});

test('退戶 Sheet：車位明細與成交總價和退戶記錄一致，內部欄位不進 Sheet', async () => {
  const { google } = require('googleapis');
  const calls = [];
  const record = name => async (params) => { calls.push({ name, params }); return { data: { values: [[]] } }; };
  google.auth.GoogleAuth = class { async getClient() { return {}; } };
  google.sheets = () => ({
    spreadsheets: { values: { get: record('get'), clear: record('clear'), update: record('update'), append: record('append') } },
  });

  reset({
    'cancelledPurchases/a9': {
      projectId: 'p1', unitId: 'A-9', salesStatus_backend: '簽約', price_transaction_house: 3010,
      parkingData: [],
      parkingMovedOut: [{ spotId: 'B3-115', price_floor: 255, price_transaction: 255, movedToUnitId: 'D-8' }],
      _cancellationMeta: { operatorName: '管理' },
    },
    'cancelledPurchases/d15': {
      projectId: 'p1', unitId: 'D-15', salesStatus_backend: '小訂', price_transaction_house: 3569,
      parkingData: [
        parking('B6-13', 'D-15', { status_backend: '小訂', price_transaction: 165 }),
        parking('B6-13A', 'D-15', { status_backend: '已售', price_transaction: 175 }),
      ],
      _cancellationMeta: { operatorName: '管理' },
    },
  });
  const result = await index.syncCancelledPurchasesToSheet.run({ data: { projectId: 'p1', spreadsheetId: 's', sheetName: 't' } });
  assert.equal(result.status, 'success');
  const [header, ...rows] = calls.find(call => call.name === 'update').params.resource.values;
  const cell = (unitId, title) => rows.find(row => row.includes(unitId))[header.indexOf(title)];
  assert.ok(String(cell('A-9', '車位成交明細')).includes('B3-115'));
  assert.equal(Number(cell('A-9', '成交總價(含車)')), 3265);
  assert.ok(!String(cell('D-15', '車位成交明細')).includes('B6-13A'));
  assert.equal(Number(cell('D-15', '成交總價(含車)')), 3734);
  assert.ok(!header.includes('parkingMovedOut'));
});

test('車位轉出紀錄不寫到戶別文件，修改銷控不會蓋掉', async () => {
  reset(Object.fromEntries([seedHousehold('A-9'), seedHousehold('D-8'), seedParking('B3-115', 'A-9')]));
  const householdBefore = { ...store.get('salesHouseholds/p1_A-9') };
  await rebound('B3-115', 'D-8');
  assert.deepEqual(store.get('salesHouseholds/p1_A-9'), householdBefore);
});
