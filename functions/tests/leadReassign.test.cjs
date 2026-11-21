// 聯絡名單改派（reassignLeads）：載入真正的 functions/index.js（假 Firestore、封鎖對外連線），
// 驗證權限、只換負責人不動聯絡狀況、留改派紀錄，以及 LINE 通知對象與形式。
const test = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const { db, loadIndex } = require('./helpers/loadIndexOffline.cjs');

const quiet = { log: console.log, warn: console.warn, error: console.error };
console.log = () => {}; console.warn = () => {}; console.error = () => {};
const index = loadIndex();
test.after(() => Object.assign(console, quiet));

const { store } = db;
const lineCalls = [];
axios.post = async (url, body) => { lineCalls.push({ url, body }); return { data: {} }; };

const lead = (n, extra = {}) => ({
  projectId: 'p1', projectName: '建案一', name: `客戶${n}`, phone: `091100000${n}`, isDeleted: false,
  assignedTo: 'old', assignedName: '舊銷售', status: '未接', reason: '', lastReport: { status: '未接' }, ...extra,
});

const seed = (extra = {}) => {
  store.clear();
  lineCalls.length = 0;
  Object.entries({
    'users/desk': { name: '櫃台', roles: [] },
    'users/sales': { name: '小明', roles: [] },
    'users/admin': { name: '系管', roles: ['系統管理員'] },
    'users/old': { name: '舊銷售', roles: [] },
    'users/new': { name: '新銷售', roles: [], lineId: 'Unew' },
    'users/off': { name: '停用者', roles: [], disabled: true },
    'users/boss': { name: '主管', roles: [], lineId: 'Uboss' },
    'userPermissions/desk': { permissions: { p1: { systems: ['客資系統-櫃台'] } } },
    'userPermissions/sales': { permissions: { p1: { systems: ['客資系統-銷售'] } } },
    'projects/p1': { name: '建案一' },
    'projectSettings/p1': { notifyRecipients: ['boss'] },
    'leads/l1': lead(1),
    'leads/l2': lead(2),
    ...extra,
  }).forEach(([key, value]) => store.set(key, value));
};

const call = data => index.reassignLeads.run({ data: { projectId: 'p1', salesId: 'new', operatorKey: 'desk', operator: '櫃台', ...data } });
const rejects = (promise, code, message) => assert.rejects(promise, (error) => {
  assert.equal(error.code, code);
  if (message) assert.match(error.message, message);
  return true;
});

test('權限：櫃台與系統管理員可改派，銷售、他案櫃台與停用帳號不行', async () => {
  seed();
  await rejects(call({ leadIds: ['l1'], operatorKey: 'sales' }), 'permission-denied', /權限不足/);
  await rejects(call({ leadIds: ['l1'], projectId: 'p2' }), 'permission-denied', /權限不足/);
  await rejects(call({ leadIds: ['l1'], operatorKey: 'off' }), 'permission-denied', /已停用/);
  await rejects(call({ leadIds: [] }), 'invalid-argument');
  assert.equal(store.get('leads/l1').assignedTo, 'old');

  const res = await call({ leadIds: ['l1'], operatorKey: 'admin', operator: '' });
  assert.equal(res.updated, 1);
  assert.equal(store.get('leads/l1').lastModifiedBy, '系管');
});

test('不能改派給停用或不存在的銷售', async () => {
  seed();
  await rejects(call({ leadIds: ['l1'], salesId: 'off' }), 'failed-precondition', /停用/);
  await rejects(call({ leadIds: ['l1'], salesId: 'ghost' }), 'not-found');
  assert.equal(store.get('leads/l1').assignedTo, 'old');
});

test('只換負責人：聯絡狀況與回報保留，指派時間更新並留改派紀錄', async () => {
  seed();
  const res = await call({ leadIds: ['l1'] });
  assert.deepEqual(res, { status: 'success', updated: 1, skipped: 0, failed: [] });
  const after = store.get('leads/l1');
  assert.equal(after.assignedTo, 'new');
  assert.equal(after.assignedName, '新銷售');
  assert.equal(after.status, '未接');
  assert.deepEqual(after.lastReport, { status: '未接' });
  assert.ok(after.assignedAt?.toMillis);
  assert.equal(after.lastModifiedBy, '櫃台');
  const [entry] = after.reassignLog.elements;
  assert.equal(entry.fromSalesId, 'old');
  assert.equal(entry.fromSalesName, '舊銷售');
  assert.equal(entry.toSalesId, 'new');
  assert.equal(entry.byKey, 'desk');
  assert.equal(store.get('leads/l2').assignedTo, 'old');
});

test('批次：已是同一位略過，他案、垃圾桶、不存在的回報失敗，其餘照常改派', async () => {
  seed({
    'leads/same': lead(3, { assignedTo: 'new', assignedName: '新銷售' }),
    'leads/other': lead(4, { projectId: 'p2' }),
    'leads/trash': lead(5, { isDeleted: true }),
  });
  const res = await call({ leadIds: ['l1', 'l2', 'same', 'other', 'trash', 'ghost', 'l1'] });
  assert.equal(res.updated, 2);
  assert.equal(res.skipped, 1);
  assert.deepEqual(res.failed.map(f => f.leadId).sort(), ['ghost', 'other', 'trash']);
  assert.equal(store.get('leads/l2').assignedTo, 'new');
  assert.equal(store.get('leads/other').assignedTo, 'old');
  assert.equal(store.get('leads/trash').assignedTo, 'old');
});

test('LINE：5 筆以內逐筆「名單改派」卡片，發給新銷售＋固定通知人員；超過改一則彙總', async () => {
  seed();
  await call({ leadIds: ['l1', 'l2'] });
  assert.equal(lineCalls.length, 2);
  lineCalls.forEach(({ body }) => {
    assert.deepEqual([...body.to].sort(), ['Uboss', 'Unew']);
    assert.equal(body.messages[0].type, 'flex');
    assert.match(body.messages[0].contents.header.contents[0].text, /名單改派/);
    assert.match(body.messages[0].altText, /改派給 新銷售/);
  });

  const many = Object.fromEntries(Array.from({ length: 6 }, (_, i) => [`leads/m${i}`, lead(i)]));
  seed(many);
  await call({ leadIds: Object.keys(many).map(k => k.split('/')[1]) });
  assert.equal(lineCalls.length, 1);
  assert.equal(lineCalls[0].body.messages[0].type, 'text');
  assert.match(lineCalls[0].body.messages[0].text, /6 筆名單改派給 新銷售/);
});

test('沒有實際改派（已是同一位）就不發 LINE', async () => {
  seed({ 'leads/same': lead(3, { assignedTo: 'new', assignedName: '新銷售' }) });
  const res = await call({ leadIds: ['same'] });
  assert.equal(res.updated, 0);
  assert.equal(lineCalls.length, 0);
});
