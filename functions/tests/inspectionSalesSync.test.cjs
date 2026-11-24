const test = require('node:test');
const assert = require('node:assert/strict');
const { createFakeDb } = require('./helpers/fakeFirestore.cjs');
const { looseKey, cleanPhone, buildSyncPlan, syncInspectionFromSalesCore } = require('../inspectionSalesSync');

const P = 'proj1';
const household = (unitId, data = {}) => ({ docId: `${P}_${unitId}`, data: { projectId: P, unitId, building: 'A1', ...data } });
const salesUnit = (unitId, data = {}) => ({ docId: `${P}_${unitId}`, data: { projectId: P, unitId, building: 'A1', ...data } });
const plan = (households, salesUnits, parkings = []) => buildSyncPlan({ projectId: P, households, salesUnits, parkings });
const diffFields = unit => unit.diffs.map(d => d.field);

test('戶號忽略大小寫、空白與數字補零', () => {
  assert.equal(looseKey('A1-02'), looseKey('a1-2'));
  assert.equal(looseKey('Ａ１－０２'), looseKey('A1-2'));
  assert.equal(looseKey('B3-100'), 'B3-100');
  assert.notEqual(looseKey('A1-20'), looseKey('A1-2'));
});

test('電話寫成純數字，含其他文字時保留原樣', () => {
  assert.equal(cleanPhone('0912-345 678'), '0912345678');
  assert.equal(cleanPhone('0912-345678, 02-2345-6789'), '0912345678,0223456789');
  assert.equal(cleanPhone('02-23456789 分機 12'), '02-23456789 分機 12');
  assert.equal(cleanPhone(null), '');
});

test('只有格式不同不算差異', () => {
  const result = plan(
    [household('A1-02', {
      buyerName: '王小明／李小華', buyerPhone: '0912345678', buyerEmail: 'A@x.com',
      buyerIdNumber: 'a123456789', salesperson: ['陳一', '林二'], parkingLots: 'B3-089, B3-010', address: '台中市 西屯區1號',
    })],
    [salesUnit('A1-2', {
      buyerName: '李小華、王小明', buyerPhone: '0912-345678', buyerEmail: 'a@x.com',
      buyerIdNumber: 'A123456789', salesperson: '林二,陳一', doorplate: '台中市西屯區1號', salesStatus_backend: '簽約',
    })],
    [
      { buyerUnitId: 'A1-2', spotId: 'B3-89', status_backend: '簽約' },
      { buyerUnitId: 'A1-2', spotId: 'B3-10', status_backend: '簽約' },
    ],
  );
  assert.deepEqual(result.units, []);
  assert.deepEqual(result.additions, []);
  assert.equal(result.counts.matched, 1);
});

test('有差異的欄位列出前後值，銷控空白不覆蓋', () => {
  const result = plan(
    [household('A1-10', { buyerName: '王小明', buyerPhone: '0911111111', buyerIdNumber: '1234', address: '舊門牌' })],
    [salesUnit('A1-10', { buyerName: '王大明', buyerPhone: '0922-222222', buyerIdNumber: '', doorplate: '', salesperson: ['陳一'] })],
  );
  assert.equal(result.units.length, 1);
  const [unit] = result.units;
  assert.deepEqual(diffFields(unit), ['buyerName', 'buyerPhone', 'salesperson']);
  const phone = unit.diffs.find(d => d.field === 'buyerPhone');
  assert.deepEqual([phone.before, phone.after, phone.value], ['0911111111', '0922222222', '0922222222']);
  const sp = unit.diffs.find(d => d.field === 'salesperson');
  assert.deepEqual(sp.value, ['陳一']);
  assert.equal(unit.diffs.some(d => d.clear), false);
});

test('驗屋已包含銷控的姓名、電話、驗證碼時不覆蓋；棟別不比對', () => {
  const result = plan(
    [household('A1-10', { building: 'A1', buyerName: '王小明／李小華', buyerPhone: '0911111111(王)/0922222222', buyerIdNumber: 'A123456789 B223456789' })],
    [salesUnit('A1-10', { building: 'A', buyerName: '王小明', buyerPhone: '0911-111111', buyerIdNumber: 'a123456789' })],
  );
  assert.deepEqual(result.units, []);
  // 銷控多了驗屋沒有的人才算差異
  const more = plan(
    [household('A1-10', { buyerName: '王小明', buyerPhone: '0911111111' })],
    [salesUnit('A1-10', { buyerName: '王小明、李小華', buyerPhone: '0911111111,0922222222' })],
  );
  assert.deepEqual(diffFields(more.units[0]), ['buyerName', 'buyerPhone']);
});

test('共同買方併入姓名與身分證，重複的不重複列', () => {
  const result = plan(
    [household('A1-10', { buyerName: '王小明' })],
    [salesUnit('A1-10', {
      buyerName: '王小明', buyerIdNumber: 'A123456789',
      coBuyers: [{ name: '李小華', idNumber: 'b223456789' }, { name: '王小明', idNumber: 'A123456789' }],
    })],
  );
  const [unit] = result.units;
  assert.equal(unit.diffs.find(d => d.field === 'buyerName').after, '王小明、李小華');
  assert.equal(unit.diffs.find(d => d.field === 'buyerIdNumber').after, 'A123456789/b223456789');
});

test('銷控該戶沒有買方時，買方相關欄位標記清空，門牌棟別不清', () => {
  const result = plan(
    [household('A1-10', { buyerName: '王小明', buyerPhone: '0911111111', parkingLots: 'B1-1', address: '門牌1號', salesperson: ['陳一'] })],
    [salesUnit('A1-10', { buyerName: '', doorplate: '', building: '' })],
  );
  const [unit] = result.units;
  assert.deepEqual(diffFields(unit), ['buyerName', 'buyerPhone', 'salesperson', 'parkingLots']);
  assert.equal(unit.diffs.every(d => d.clear && d.after === ''), true);
  assert.deepEqual(unit.diffs.find(d => d.field === 'salesperson').value, []);
});

test('車位以 salesParkings 為準：正式狀態或與戶別狀態相同才算', () => {
  const result = plan(
    [household('A1-10', { buyerName: '王小明' })],
    [salesUnit('A1-10', { buyerName: '王小明', salesStatus_backend: '簽約', 持有車位: [{ spotId: 'OLD-1' }] })],
    [
      { buyerUnitId: 'A1-10', spotId: 'B2-10', status_backend: '簽約' },
      { buyerUnitId: 'A1-10', spotId: 'B2-2', status_backend: '小訂' },
      { buyerUnitId: 'A1-10', spotId: 'B2-99', status_backend: '保留' },
      { buyerUnitId: 'A1-11', spotId: 'B2-50', status_backend: '簽約' },
    ],
  );
  assert.equal(result.units[0].diffs.find(d => d.field === 'parkingLots').after, 'B2-2,B2-10');
});

test('對不到唯一一戶就不對應；銷控多出來的戶別列為可新增', () => {
  const result = plan(
    [household('A1-02'), household('A1-2'), household('C-1')],
    [salesUnit('A1-002', { buyerName: '甲' }), salesUnit('B-1', { buyerName: '乙', building: 'B' }), salesUnit('X/1')],
  );
  assert.deepEqual(result.inspectionOnly, ['A1-02', 'A1-2', 'C-1']);
  assert.deepEqual(result.additions.map(a => a.unitId), ['A1-002', 'B-1']);
  assert.deepEqual(result.blocked, ['X/1']);
  assert.deepEqual(result.additions[1].values.map(v => v.field), ['buyerName']);
  assert.equal(result.additions[1].building, 'B');
});

test('完全相同的戶號優先於忽略補零的對應', () => {
  const result = plan(
    [household('A1-2', { buyerName: '舊' }), household('A1-02', { buyerName: '舊' })],
    [salesUnit('A1-2', { buyerName: '甲' }), salesUnit('A1-02', { buyerName: '乙' })],
  );
  const after = Object.fromEntries(result.units.map(u => [u.unitId, u.diffs[0].after]));
  assert.deepEqual(after, { 'A1-2': '甲', 'A1-02': '乙' });
});

// ───────────────────────── callable ─────────────────────────

function seedDb(extra = {}) {
  return createFakeDb({
    'users/admin': { name: '管理員', roles: ['系統管理員'] },
    'users/editor': { name: '小編', roles: [] },
    'userPermissions/editor': { permissions: { [P]: { systems: ['驗屋預約管理-修改'] } } },
    'users/viewer': { name: '訪客', roles: [] },
    'userPermissions/viewer': { permissions: { [P]: { systems: ['驗屋預約管理-檢視', '銷控系統'] } } },
    [`households/${P}_A1-02`]: { projectId: P, unitId: 'A1-02', building: 'A1', buyerName: '王小明', buyerPhone: '0911111111', remarks: '保留', showInMenu: true },
    [`households/${P}_A1-03`]: { projectId: P, unitId: 'A1-03', building: 'A1', buyerName: '退戶的人', buyerPhone: '0933333333' },
    [`salesHouseholds/${P}_A1-2`]: { projectId: P, unitId: 'A1-2', building: 'A1', buyerName: '王大明', buyerPhone: '0922-222222', salesperson: ['陳一'], doorplate: '一路1號', salesStatus_backend: '簽約' },
    [`salesHouseholds/${P}_A1-3`]: { projectId: P, unitId: 'A1-3', building: 'A1', buyerName: '' },
    [`salesHouseholds/${P}_A1-5`]: { projectId: P, unitId: 'A1-5', building: 'A1', buyerName: '新買方', buyerPhone: '0955-555555', buyerIdNumber: 'F123456789' },
    [`salesHouseholds/other_A1-9`]: { projectId: 'other', unitId: 'A1-9', building: 'A1', buyerName: '別的建案' },
    [`salesParkings/${P}_B1-7`]: { projectId: P, spotId: 'B1-7', buyerUnitId: 'A1-2', status_backend: '簽約' },
    ...extra,
  });
}
const call = (db, data) => syncInspectionFromSalesCore(db, { projectId: P, userKey: 'editor', ...data });

test('沒有驗屋預約管理-修改權限不可使用', async () => {
  const db = seedDb();
  await assert.rejects(call(db, { userKey: 'viewer' }), { code: 'permission-denied' });
  await assert.rejects(call(db, { userKey: '' }), { code: 'unauthenticated' });
  await assert.rejects(call(db, { userKey: 'nobody' }), { code: 'permission-denied' });
  await assert.rejects(call(db, { projectId: 'a/b' }), { code: 'invalid-argument' });
  assert.equal((await call(db, { userKey: 'admin' })).status, 'success');
});

test('預覽：回傳差異、可新增戶別，不含寫入值，也不改資料', async () => {
  const db = seedDb();
  const before = JSON.stringify([...db.store.entries()]);
  const res = await call(db, { action: 'preview' });
  assert.equal(JSON.stringify([...db.store.entries()]), before);
  assert.deepEqual(res.counts, { sales: 3, inspection: 2, matched: 2, inspectionOnly: 0 });
  assert.deepEqual(res.units.map(u => [u.unitId, u.salesUnitId]), [['A1-02', 'A1-2'], ['A1-03', 'A1-3']]);
  assert.deepEqual(res.units[0].diffs.map(d => d.field), ['buyerName', 'buyerPhone', 'salesperson', 'parkingLots', 'address']);
  assert.equal(res.units[0].diffs.every(d => d.rev && !('value' in d) && !('previous' in d)), true);
  assert.deepEqual(res.units[1].diffs.map(d => [d.field, d.clear]), [['buyerName', true], ['buyerPhone', true]]);
  assert.deepEqual(res.additions.map(a => a.unitId), ['A1-5']);
  assert.equal(res.lastSync, null);
  assert.equal(res.fields.length, 7);
});

test('套用：只寫入勾選的欄位，其他欄位不動，並留下紀錄', async () => {
  const db = seedDb();
  const preview = await call(db, { action: 'preview' });
  const unit = preview.units[0];
  const pick = field => ({ key: unit.key, field, rev: unit.diffs.find(d => d.field === field).rev });
  const res = await call(db, { action: 'apply', changes: [pick('buyerPhone'), pick('salesperson'), pick('parkingLots')] });
  assert.deepEqual([res.updatedUnits, res.updatedFields, res.addedUnits, res.staleCount], [1, 3, 0, 0]);

  const saved = db.store.get(`households/${P}_A1-02`);
  assert.equal(saved.buyerName, '王小明'); // 沒勾選
  assert.equal(saved.buyerPhone, '0922222222');
  assert.deepEqual(saved.salesperson, ['陳一']);
  assert.equal(saved.parkingLots, 'B1-7');
  assert.equal(saved.address, undefined);
  assert.equal(saved.remarks, '保留');
  assert.equal(saved.showInMenu, true);
  assert.equal(db.store.get(`households/${P}_A1-03`).buyerName, '退戶的人');
  assert.equal(db.store.get(`salesHouseholds/${P}_A1-2`).buyerPhone, '0922-222222'); // 銷控不動

  const logs = [...db.store.entries()].filter(([path]) => /^inspectionSalesSyncLogs\/[^/]+$/.test(path));
  assert.equal(logs.length, 1);
  assert.equal(logs[0][1].operatorName, '小編');
  assert.deepEqual(logs[0][1].fieldCounts, { buyerPhone: 1, salesperson: 1, parkingLots: 1 });
  const detail = db.store.get(`${logs[0][0]}/changes/0000`);
  assert.deepEqual(detail.items.find(i => i.field === 'buyerPhone'), {
    type: 'update', docId: `${P}_A1-02`, unitId: 'A1-02', field: 'buyerPhone', before: '0911111111', after: '0922222222',
  });

  const again = await call(db, { action: 'preview' });
  assert.deepEqual(again.units[0].diffs.map(d => d.field), ['buyerName', 'address']);
  assert.equal(again.lastSync.operatorName, '小編');
  assert.equal(again.lastSync.updatedUnits, 1);
});

test('套用：清空已無買方的戶別', async () => {
  const db = seedDb();
  const preview = await call(db, { action: 'preview' });
  const unit = preview.units[1];
  const res = await call(db, { action: 'apply', changes: unit.diffs.map(d => ({ key: unit.key, field: d.field, rev: d.rev })) });
  assert.equal(res.updatedFields, 2);
  const saved = db.store.get(`households/${P}_A1-03`);
  assert.deepEqual([saved.buyerName, saved.buyerPhone], ['', '']);
});

test('套用：預覽後資料有變動的項目略過', async () => {
  const db = seedDb();
  const preview = await call(db, { action: 'preview' });
  const unit = preview.units[0];
  const name = unit.diffs.find(d => d.field === 'buyerName');
  const phone = unit.diffs.find(d => d.field === 'buyerPhone');
  // 預覽後，驗屋端有人改了買方姓名
  db.store.set(`households/${P}_A1-02`, { ...db.store.get(`households/${P}_A1-02`), buyerName: '王小明(更正)' });
  const res = await call(db, {
    action: 'apply',
    changes: [
      { key: unit.key, field: 'buyerName', rev: name.rev },
      { key: unit.key, field: 'buyerPhone', rev: phone.rev },
      { key: 'no-such-doc', field: 'buyerName', rev: 'x' },
    ],
  });
  assert.deepEqual([res.updatedFields, res.staleCount], [1, 2]);
  const saved = db.store.get(`households/${P}_A1-02`);
  assert.equal(saved.buyerName, '王小明(更正)');
  assert.equal(saved.buyerPhone, '0922222222');
});

test('套用：新增戶別只帶入勾選的欄位，預設不開放預約', async () => {
  const db = seedDb();
  const res = await call(db, { action: 'apply', additions: ['A1-5', 'A1-2', 'NOPE'], addFields: ['buyerName', 'buyerPhone', 'bogus'] });
  assert.deepEqual([res.updatedUnits, res.addedUnits, res.staleCount], [0, 1, 2]);
  const { updatedAt, ...saved } = db.store.get(`households/${P}_A1-5`);
  assert.ok(updatedAt);
  assert.deepEqual(saved, {
    projectId: P, unitId: 'A1-5', building: 'A1', buyerName: '新買方', buyerPhone: '0955555555',
    showInMenu: false, initialReportUploadSwitch: false, reInspectionReportUploadSwitch: false,
  });
  // 已存在的戶別不會因為「新增」被覆蓋
  assert.equal(db.store.get(`households/${P}_A1-02`).buyerName, '王小明');
  assert.deepEqual((await call(db, { action: 'preview' })).additions, []);
});

test('套用：沒有選取項目、全部過期時不寫入', async () => {
  const db = seedDb();
  await assert.rejects(call(db, { action: 'apply', changes: [], additions: [] }), { code: 'invalid-argument' });
  await assert.rejects(call(db, { action: 'nope' }), { code: 'invalid-argument' });
  const res = await call(db, { action: 'apply', changes: [{ key: `${P}_A1-02`, field: 'buyerName', rev: 'stale' }] });
  assert.deepEqual([res.updatedUnits, res.staleCount], [0, 1]);
  assert.equal([...db.store.keys()].some(path => path.startsWith('inspectionSalesSyncLogs/')), false);
});

test('大量戶別分批寫入', async () => {
  const docs = {};
  for (let i = 1; i <= 950; i += 1) {
    docs[`households/${P}_U-${i}`] = { projectId: P, unitId: `U-${i}`, building: 'U', buyerName: '' };
    docs[`salesHouseholds/${P}_U-${i}`] = { projectId: P, unitId: `U-${i}`, building: 'U', buyerName: `買方${i}` };
  }
  const db = seedDb(docs);
  const preview = await call(db, { action: 'preview' });
  const changes = preview.units.filter(u => u.unitId.startsWith('U-')).map(u => ({ key: u.key, field: 'buyerName', rev: u.diffs[0].rev }));
  assert.equal(changes.length, 950);
  const res = await call(db, { action: 'apply', changes });
  assert.equal(res.updatedUnits, 950);
  assert.equal(db.store.get(`households/${P}_U-950`).buyerName, '買方950');
  const parts = [...db.store.keys()].filter(path => /\/changes\//.test(path));
  assert.equal(parts.length, 4);
});
