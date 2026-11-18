// 人員管理一鍵停用／啟用帳號：載入真正的 functions/index.js（假 Firestore、封鎖對外連線），
// 驗證停用後登入、Cloud Function、LINE 入口與綁定全部被擋下，啟用後恢復。
const test = require('node:test');
const assert = require('node:assert/strict');
const { db, loadIndex } = require('./helpers/loadIndexOffline.cjs');
const { actorKeysOf, isAccountDisabled } = require('../utils/accountGuard');
const { getEligibleRecipients } = require('../utils/getEligibleRecipients');

const quiet = { log: console.log, warn: console.warn, error: console.error };
console.log = () => {}; console.warn = () => {}; console.error = () => {};
const index = loadIndex();
test.after(() => Object.assign(console, quiet));

const { store } = db;
const DISABLED = '此帳號已停用，請聯絡管理員。';
const perms = { p1: { projectName: '建案一', systems: ['銷控系統', '人員管理'] } };

const seed = (extra = {}) => {
  store.clear();
  Object.entries({
    'users/super': { name: '超管', password: 'pw', roles: ['超級管理員'], activeSessionId: 's-super' },
    'users/sys': { name: '系管', password: 'pw', roles: ['系統管理員'], activeSessionId: 's-sys' },
    'users/mgr': { name: '主管', password: 'pw', roles: [], activeSessionId: 's-mgr' },
    'users/staff': { name: '小明', password: 'pw', email: 'staff@example.com', roles: [], activeSessionId: 's-staff', lineId: 'Ustaff' },
    'users/nolinestaff': { name: '小華', password: 'pw', roles: [], activeSessionId: 's-nl' },
    'userPermissions/staff': { permissions: perms },
    'userPermissions/mgr': { permissions: perms },
    'userPermissions/nolinestaff': { permissions: perms },
    'projects/p1': { name: '建案一' },
    'lineBindingTokens/tok1': { phone: 'staff', lineId: 'Uother', expiresAt: { toDate: () => new Date(Date.now() + 60000) } },
    ...extra,
  }).forEach(([key, value]) => store.set(key, value));
};

const call = (name, data) => index[name].run({ data });
const setStatus = (data) => call('setUserAccountStatus', { adminKey: 'super', sessionId: 's-super', targetUserKey: 'staff', ...data });
const rejects = (promise, code, message) => assert.rejects(promise, (error) => {
  assert.equal(error.code, code);
  if (message) assert.match(error.message, message);
  return true;
});
const logs = () => [...store.keys()].filter(key => key.startsWith('userAccountLogs/')).map(key => store.get(key));

test('操作者欄位：有管理者欄位時只看管理者，否則看 userKey，並往 data／payload 找一層', () => {
  assert.deepEqual(actorKeysOf({ adminKey: 'a', targetUserKey: 't', userKey: 'u' }), ['a']);
  assert.deepEqual(actorKeysOf({ userKey: 'u', projectId: 'p' }), ['u']);
  assert.deepEqual(actorKeysOf({ action: 'x', data: { operatorPhone: '0912' } }), ['0912']);
  assert.deepEqual(actorKeysOf({ action: 'x', payload: { userKey: 'u' } }), ['u']);
  assert.deepEqual(actorKeysOf({ targetUserKey: 't', phone: '0912', key: 'k' }), []);
  assert.deepEqual(actorKeysOf({ userKey: 'a/b' }), []);
  assert.deepEqual(actorKeysOf(null), []);
});

test('停用權限：需登入中的超管／系管，不可停用自己，系管不可動超管', async () => {
  seed();
  await rejects(call('setUserAccountStatus', { adminKey: 'super', targetUserKey: 'staff', disabled: true }), 'unauthenticated');
  await rejects(setStatus({ sessionId: 'old-session', disabled: true }), 'unauthenticated', /登入已過期/);
  await rejects(setStatus({ adminKey: 'mgr', sessionId: 's-mgr', disabled: true }), 'permission-denied', /權限不足/);
  await rejects(setStatus({ targetUserKey: 'super', disabled: true }), 'failed-precondition', /自己/);
  await rejects(setStatus({ adminKey: 'sys', sessionId: 's-sys', targetUserKey: 'super', disabled: true }), 'permission-denied', /超級管理員/);
  await rejects(setStatus({ targetUserKey: 'nobody', disabled: true }), 'not-found');
  await rejects(setStatus({ disabled: 'yes' }), 'invalid-argument');
  assert.equal(store.get('users/staff').disabled, undefined);
  assert.equal(store.get('users/super').disabled, undefined);
  // 系統管理員可以停用一般人員
  const result = await setStatus({ adminKey: 'sys', sessionId: 's-sys', disabled: true });
  assert.equal(result.disabled, true);
});

test('停用：寫入狀態、踢掉登入中的裝置、暫停 LINE 綁定、清除綁定驗證信並留下紀錄', async () => {
  seed();
  const result = await setStatus({ disabled: true });
  assert.deepEqual(
    { status: result.status, disabled: result.disabled, unchanged: result.unchanged, lineSuspended: result.lineSuspended },
    { status: 'success', disabled: true, unchanged: false, lineSuspended: true },
  );
  const user = store.get('users/staff');
  assert.equal(user.disabled, true);
  assert.equal(user.lineId, undefined);
  assert.equal(user.lineIdDisabled, 'Ustaff');
  assert.match(user.activeSessionId, /^disabled:/);
  assert.equal(user.disabledBy, 'super');
  assert.equal(user.disabledByName, '超管');
  // 權限、密碼原封不動
  assert.equal(user.password, 'pw');
  assert.deepEqual(store.get('userPermissions/staff').permissions, perms);
  assert.equal(store.has('lineBindingTokens/tok1'), false);
  assert.equal(logs().length, 1);
  assert.equal(logs()[0].action, 'disable');

  // 重複停用不重寫、不多留紀錄
  const again = await setStatus({ disabled: true });
  assert.equal(again.unchanged, true);
  assert.equal(logs().length, 1);
});

test('停用後：登入、忘記密碼、帶操作者身分的函式全部被擋', async () => {
  seed();
  await setStatus({ disabled: true });

  await rejects(call('handleLogin', { key: 'staff', password: 'pw', sessionId: 'new' }), 'permission-denied', new RegExp(DISABLED));
  // 密碼錯誤時不透露帳號狀態
  await rejects(call('handleLogin', { key: 'staff', password: 'wrong', sessionId: 'new' }), 'unauthenticated', /密碼錯誤/);
  assert.match(store.get('users/staff').activeSessionId, /^disabled:/);
  await rejects(call('forgotPasswordSender', { key: 'staff' }), 'permission-denied', new RegExp(DISABLED));

  // 入口守衛：userKey、operatorKey、路由型 data 內的操作者
  await rejects(call('updateUserPreferences', { userKey: 'staff', preferences: { a: 1 } }), 'permission-denied', new RegExp(DISABLED));
  await rejects(call('getUserManagementInitialData', { adminKey: 'staff' }), 'permission-denied', new RegExp(DISABLED));
  await rejects(call('liffCalendarApi', { action: 'fetchCalendarNotes', data: { projectId: 'p1', userKey: 'staff' } }), 'permission-denied', new RegExp(DISABLED));
  assert.equal(await isAccountDisabled('staff'), true);

  // 其他人不受影響
  const login = await call('handleLogin', { key: 'mgr', password: 'pw', sessionId: 'new-mgr' });
  assert.equal(login.status, 'success');
});

test('停用後：LINE 入口顯示已停用、不可重新綁定、不列入通知名單', async () => {
  seed();
  assert.equal((await call('getLiffUserData', { lineId: 'Ustaff' })).status, 'bound');
  const before = await getEligibleRecipients('p1', db);
  assert.deepEqual(before.map(r => r.userKey).sort(), ['staff']);

  await setStatus({ disabled: true });

  assert.deepEqual(await call('getLiffUserData', { lineId: 'Ustaff' }), { status: 'disabled' });
  assert.deepEqual(await call('liffCalendarApi', { action: 'getLiffUserData', data: { lineId: 'Ustaff' } }), { status: 'disabled' });
  assert.equal((await call('checkLineBindingStatus', { lineId: 'Ustaff' })).status, 'disabled');
  // 沒綁過的 LINE 仍是未綁定
  assert.deepEqual(await call('getLiffUserData', { lineId: 'Unobody' }), { status: 'not_bound' });
  assert.equal((await call('checkLineBindingStatus', { lineId: 'Unobody' })).status, 'not_found');

  await rejects(call('verifyUserByPhone', { phone: 'staff' }), 'permission-denied', new RegExp(DISABLED));
  await rejects(call('bindLineIdToUser', { phone: 'staff', lineId: 'Unew' }), 'permission-denied', new RegExp(DISABLED));
  await rejects(call('initiateLineBindingVerification', { phone: 'staff', lineId: 'Unew' }), 'permission-denied', new RegExp(DISABLED));
  store.set('lineBindingTokens/tok2', { phone: 'staff', lineId: 'Unew', expiresAt: { toDate: () => new Date(Date.now() + 60000) } });
  await rejects(call('finalizeLineBinding', { token: 'tok2' }), 'permission-denied', new RegExp(DISABLED));
  assert.equal(store.has('lineBindingTokens/tok2'), false);
  assert.equal(store.get('users/staff').lineId, undefined);

  assert.deepEqual(await getEligibleRecipients('p1', db), []);
});

test('人員管理資料：列表與明細帶出停用狀態，管理者仍可查看與編輯停用中的人員', async () => {
  seed();
  await setStatus({ disabled: true });

  const initial = await call('getUserManagementInitialData', { adminKey: 'super' });
  const staff = initial.data.manageableUsers.find(u => u.phone === 'staff');
  assert.deepEqual(
    { disabled: staff.disabled, lineId: staff.lineId, lineSuspended: staff.lineSuspended },
    { disabled: true, lineId: null, lineSuspended: true },
  );
  const mgr = initial.data.manageableUsers.find(u => u.phone === 'mgr');
  assert.deepEqual({ disabled: mgr.disabled, lineSuspended: mgr.lineSuspended }, { disabled: false, lineSuspended: false });

  const detail = await call('fetchUserDetailsForAdmin', { adminKey: 'super', targetUserKey: 'staff' });
  assert.equal(detail.status, 'success');
  assert.equal(detail.data.account.disabled, true);
  assert.equal(detail.data.account.disabledByName, '超管');
  assert.equal(detail.data.account.lineSuspended, true);
  assert.equal('disabled' in detail.data.basicInfo, false);
});

test('啟用：恢復登入與 LINE 綁定；停用期間 LINE 已綁到別人則不搶回', async () => {
  seed();
  await setStatus({ disabled: true });
  const enabled = await setStatus({ disabled: false });
  assert.deepEqual(
    { disabled: enabled.disabled, lineRestored: enabled.lineRestored, lineConflict: enabled.lineConflict },
    { disabled: false, lineRestored: true, lineConflict: false },
  );
  const user = store.get('users/staff');
  assert.equal(user.disabled, undefined);
  assert.equal(user.lineId, 'Ustaff');
  assert.equal(user.lineIdDisabled, undefined);
  assert.equal(user.enabledBy, 'super');
  assert.deepEqual(logs().map(l => l.action), ['disable', 'enable']);

  const login = await call('handleLogin', { key: 'staff', password: 'pw', sessionId: 'fresh' });
  assert.equal(login.status, 'success');
  assert.equal(store.get('users/staff').activeSessionId, 'fresh');
  assert.equal((await call('getLiffUserData', { lineId: 'Ustaff' })).status, 'bound');
  assert.equal((await call('updateUserPreferences', { userKey: 'staff', preferences: { a: 1 } })).status, 'success');
  assert.deepEqual((await getEligibleRecipients('p1', db)).map(r => r.userKey), ['staff']);

  // 衝突：停用期間同一個 LINE 綁到另一個帳號
  seed();
  await setStatus({ disabled: true });
  store.set('users/nolinestaff', { ...store.get('users/nolinestaff'), lineId: 'Ustaff' });
  const conflict = await setStatus({ disabled: false });
  assert.deepEqual({ lineRestored: conflict.lineRestored, lineConflict: conflict.lineConflict }, { lineRestored: false, lineConflict: true });
  assert.equal(store.get('users/staff').lineId, undefined);
  assert.equal(store.get('users/staff').lineIdDisabled, undefined);
  assert.equal(store.get('users/staff').previousLineId, 'Ustaff');
  assert.equal(store.get('users/nolinestaff').lineId, 'Ustaff');
});

test('沒有綁定 LINE 的人員停用／啟用不產生多餘欄位；停用中可由超管解除 LINE 綁定', async () => {
  seed();
  const off = await setStatus({ targetUserKey: 'nolinestaff', disabled: true });
  assert.equal(off.lineSuspended, false);
  assert.equal('lineIdDisabled' in store.get('users/nolinestaff'), false);
  const on = await setStatus({ targetUserKey: 'nolinestaff', disabled: false });
  assert.deepEqual({ lineRestored: on.lineRestored, lineConflict: on.lineConflict }, { lineRestored: false, lineConflict: false });
  assert.equal('lineId' in store.get('users/nolinestaff'), false);

  await setStatus({ disabled: true });
  const unbind = await call('unbindLineIdByAdmin', { adminKey: 'super', targetUserKey: 'staff' });
  assert.equal(unbind.alreadyUnbound, false);
  assert.equal(store.get('users/staff').lineIdDisabled, undefined);
  assert.equal(store.get('users/staff').previousLineId, 'Ustaff');
  const enabled = await setStatus({ disabled: false });
  assert.equal(enabled.lineRestored, false);
  assert.equal(store.get('users/staff').lineId, undefined);
});
