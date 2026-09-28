const test = require('node:test');
const assert = require('node:assert/strict');
const { canReportLead, createLeadReportHandler } = require('../leadReportAccess.cjs');
class HttpsError extends Error { constructor(code, message) { super(message); this.code = code; } }
const lead = { projectId: 'p', assignedTo: 'staff-doc', name: '測試客戶', phone: '0911111111' };
const perms = { p: { systems: ['客資系統-銷售'] } };
test('名單權限：銷售限本人、櫃台限建案、管理員可用、已刪除與停用拒絕', () => {
  assert.equal(canReportLead('staff-doc', {}, perms, lead), true);
  assert.equal(canReportLead('other', {}, perms, lead), false);
  assert.equal(canReportLead('staff-doc', {}, {}, lead), false);
  assert.equal(canReportLead('other', {}, { p: { systems: ['客資系統-櫃台'] } }, lead), true);
  assert.equal(canReportLead('other', {}, { q: { systems: ['客資系統-櫃台'] } }, lead), false);
  assert.equal(canReportLead('admin', { roles: ['系統管理員'] }, {}, lead), true);
  assert.equal(canReportLead('staff-doc', {}, perms, { ...lead, isDeleted: true }), false);
  assert.equal(canReportLead('staff-doc', { disabled: true }, perms, lead), false);
});
function setup({ channel = '2008257338', bound = true, reassigned = false, failLogs = false } = {}) {
  const records = new Map([
    ['leads/lead', { ...lead }],
    ['users/staff-doc', { name: '測試員工', phone: 'different-phone', lineId: 'Uverified' }],
    ['userPermissions/staff-doc', { permissions: perms }],
  ]);
  const ref = path => ({ path, get: async () => snap(path), collection: name => collection(`${path}/${name}`) });
  const snap = path => ({ id: path.split('/').at(-1), ref: ref(path), exists: records.has(path), data: () => records.get(path) });
  const collection = path => ({
    doc: id => ref(`${path}/${id}`), where() { return this; }, orderBy() { return this; }, limit() { return this; },
    get: async () => {
      if (path === 'users') return { size: bound ? 1 : 0, docs: bound ? [snap('users/staff-doc')] : [] };
      if (failLogs && path.endsWith('contactLogs')) throw new Error('offline');
      return { docs: [] };
    },
  });
  const calls = [];
  const handler = createLeadReportHandler({
    HttpsError, FieldValue: { serverTimestamp: () => 'server-time' },
    axios: { get: async (url, options) => {
      calls.push({ url, options });
      return { data: url.includes('verify') ? { client_id: channel, expires_in: 3600 } : { userId: 'Uverified' } };
    } },
    db: { collection, runTransaction: async callback => {
      if (reassigned) records.set('leads/lead', { ...lead, assignedTo: 'other' });
      await callback({ get: async ref => snap(ref.path),
        update: (ref, data) => records.set(ref.path, { ...records.get(ref.path), ...data }),
        set: (ref, data) => records.set(ref.path, data) });
    } },
  });
  return { handler, records, calls };
}
const request = { leadId: 'lead', accessToken: 'test-token', lineId: 'Uspoofed' };
test('驗證 channel 後才取得真實 LINE 身分；以 user document ID 查權限', async () => {
  const { handler, calls } = setup();
  const result = await handler({ data: request });
  assert.equal(result.user.key, 'staff-doc');
  assert.equal(result.lead.name, '測試客戶');
  assert.equal(calls[1].options.headers.Authorization, 'Bearer test-token');
});
test('錯誤 channel 與未綁定帳號不得讀名單', async () => {
  const wrong = setup({ channel: 'other' });
  await assert.rejects(wrong.handler({ data: request }), { code: 'unauthenticated' });
  assert.equal(wrong.calls.length, 1);
  await assert.rejects(setup({ bound: false }).handler({ data: request }), { code: 'permission-denied' });
});
test('次要資訊失敗不會讓已通過驗證的回報表單卡住', async () => {
  const result = await setup({ failLogs: true }).handler({ data: request });
  assert.equal(result.detailsIncomplete, true);
  assert.equal(result.lead.id, 'lead');
});
const submit = { ...request, action: 'submit', requestId: 'test-request-id-1234', report: { status: '未接', reason: '未接電話', note: '稍後再聯繫' } };
test('回報與名單狀態一起寫入，重送相同 requestId 不重複建日誌', async () => {
  const { handler, records } = setup();
  await handler({ data: submit });
  await handler({ data: submit });
  assert.equal([...records.keys()].filter(key => key.includes('contactLogs')).length, 1);
  assert.equal(records.get('leads/lead').status, '未接');
  assert.equal(records.get('leads/lead/contactLogs/test-request-id-1234').createdByKey, 'staff-doc');
});
test('開頁後名單被轉交，送出時必須拒絕且不能寫入', async () => {
  const { handler, records } = setup({ reassigned: true });
  await assert.rejects(handler({ data: submit }), { code: 'permission-denied' });
  assert.equal(records.has('leads/lead/contactLogs/test-request-id-1234'), false);
});
