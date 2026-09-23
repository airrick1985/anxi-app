const test = require('node:test');
const assert = require('node:assert/strict');
const { openingKey, openBatchVisibility } = require('../bookingVisibility');

const now = new Date('2026-09-23T02:00:00Z');
const batch = {
  projectId: 'project', bookingType: '初驗.A', isDeleted: false,
  applicationStart: '2026-09-23T10:00', applicationEnd: '2026-09-23T11:00',
};

test('開放邊界、台灣時區、Timestamp 與未設定截止日期', () => {
  assert.ok(openingKey(batch, now));
  assert.equal(openingKey(batch, new Date(now.getTime() - 1)), null);
  assert.ok(openingKey(batch, new Date('2026-09-23T03:00:00Z')));
  assert.equal(openingKey(batch, new Date('2026-09-23T03:00:00.001Z')), null);
  assert.equal(openingKey({ ...batch, applicationStart: { seconds: now.getTime() / 1000 } }, now), openingKey(batch, now));
  assert.equal(openingKey({ ...batch, applicationStart: { _seconds: now.getTime() / 1000 } }, now), openingKey(batch, now));
  assert.ok(openingKey({ ...batch, applicationEnd: null }, now));
  for (const patch of [{ isDeleted: true }, { applicationStart: '' }, { applicationEnd: 'bad' }, { applicationStart: 'bad' }, { projectId: '' }]) {
    assert.equal(openingKey({ ...batch, ...patch }, now), null);
  }
});

function fixture(data = batch, config = {}) {
  const stored = { ...data };
  const writes = [];
  const batchRef = { id: 'batch' };
  const projectRef = { id: 'project' };
  const transaction = {
    get: async ref => ref === batchRef
      ? { data: () => stored }
      : { exists: true, data: () => config },
    update: (ref, ...args) => {
      writes.push({ ref, args });
      if (ref === batchRef) Object.assign(stored, args[0]);
    },
  };
  const db = {
    collection: () => ({ doc: () => projectRef }),
    runTransaction: fn => fn(transaction),
  };
  return { db, batchRef, projectRef, stored, writes };
}

test('已開放的舊批次會開啟可見性；重跑不覆蓋後續手動隱藏', async () => {
  const f = fixture(batch, { pageSettingsByItem: { '初驗.A': { visibleToCustomer: false } } });
  assert.equal(await openBatchVisibility(f.db, f.batchRef, now), true);
  assert.equal(f.writes.length, 2);
  assert.equal(f.writes[0].ref, f.projectRef);
  assert.equal(f.writes[0].args[0].isEqual(new (require('@google-cloud/firestore').FieldPath)('pageSettingsByItem', '初驗.A', 'visibleToCustomer')), true);
  assert.equal(f.writes[0].args[1], true);
  assert.equal(await openBatchVisibility(f.db, f.batchRef, now), false);
  assert.equal(f.writes.length, 2);
  f.stored.applicationStart = '2026-09-23T09:59';
  assert.equal(await openBatchVisibility(f.db, f.batchRef, now), true);
});

test('交易重讀後跳過刪除、未開放、已截止與已刪除的預約項目', async () => {
  for (const data of [{ ...batch, isDeleted: true }, { ...batch, applicationStart: '2026-09-24T10:00' }, { ...batch, applicationEnd: '2026-09-23T09:59' }]) {
    const f = fixture(data);
    assert.equal(await openBatchVisibility(f.db, f.batchRef, now), false);
    assert.equal(f.writes.length, 0);
  }
  const f = fixture(batch, { bookingMenu: [{ title: '初驗.A', deleted: true }] });
  assert.equal(await openBatchVisibility(f.db, f.batchRef, now), false);
  assert.equal(f.writes.length, 0);
});
