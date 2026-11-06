const test = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const { createFakeDb } = require('./helpers/fakeFirestore.cjs');
const { SHEET_SYNC_SKIP_FIELD, newSheetSyncBatchId, shouldSkipSheetSync } = require('../utils/sheetSyncSkip');
const {
  normalizePaymentReminderSettings, taipeiToday, isPaidRecord, isPlannedRecord,
} = require('../utils/paymentRecordStatus');
const {
  paymentPayloadError, unpaidUpdateError, buildPaymentRecord, applyPaymentRecordUpdate, mergeRestoredPaymentRecords,
  cancellationEventMillis, latestCancellationMillis,
} = require('../utils/paymentProofRecord');
const {
  MAX_FLEX_ITEMS, MAIL_TIMEOUT_MS, buildLineFlex, buildEmailHtml, buildEmailSubject, lineDueUrl, emailDueUrl, sendDigest,
  lineRetryKey, pushLine, buildTransporter,
} = require('../notifications/paymentDueNotifier');
const {
  paymentDueReminder, LEASE_MS, RUN_INTERRUPTED_MESSAGE, isValidDocumentId, fetchByDocumentIds, loadRecipientContext,
  loadHouseholds, createDigestSender,
  taipeiHour, isWithinSendWindow, runLogId, isHouseholdEligible, collectReminderItems,
  resolveRecipients, planDeliveries, itemsForRecipient, summarizeRecipientReach,
  runProjectReminder, runScheduledReminders, handleListDue, handleBatchAddPlans,
  handlePreviewRecipients, handleSendTest, handleListLogs, handleRunNow, getProjectAccess,
} = require('../paymentDueReminder');

// 2026-12-17 09:00（台北）
const NOW = new Date('2026-12-17T01:00:00Z');
const TODAY = '2026-12-17';
const PROJECT = 'p1';
const LOG_PATH = `projects/${PROJECT}/notificationLogs/paymentDue_20261217`;

const plan = (id, expectedDate, extra = {}) => ({ id, expectedDate, expectedAmount: 300000, date: '', amount: null, note: `期別${id}`, ...extra });

const unit = (unitId, records, extra = {}) => ({
  unitId,
  projectId: PROJECT,
  salesStatus_backend: '簽約',
  buyerName: `買方${unitId}`,
  buyerPhone: '0912345678',
  salesperson: ['銷售甲'],
  salespersonUserKey: ['sales1'],
  paymentRecords: records,
  ...extra,
});

const contact = (userKey, extra = {}) => ({
  userKey, name: `人員${userKey}`, lineId: `U${userKey}`, email: `${userKey}@example.com`, roles: [], ...extra,
});

const makeSettings = (raw = {}) => normalizePaymentReminderSettings({ enabled: true, ...raw });

function makeContext(extra = {}) {
  return {
    managerKeys: new Set(['mgr1']),
    contacts: new Map([['mgr1', contact('mgr1')], ['sales1', contact('sales1')]]),
    permissions: new Map([['sales1', ['報價系統']]]),
    ...extra,
  };
}

function makeDeps({ households, context = makeContext(), blocked = false, failWhen = () => false } = {}) {
  const sent = [];
  return {
    sent,
    isBlocked: async () => blocked,
    loadHouseholds: async () => households,
    loadRecipientContext: async () => context,
    createSender: async () => async ({ channel, contact: to, items, isTest, retryKey }) => {
      if (failWhen(to, channel)) throw new Error('send failed');
      sent.push({ userKey: to.userKey, channel, items, isTest: !!isTest, retryKey });
    },
  };
}

const projectData = (raw = {}) => ({ name: '森之樹', paymentReminderSettings: { enabled: true, ...raw } });

test('台北時區的小時與跨日邊界', () => {
  assert.equal(taipeiHour(new Date('2026-12-16T15:59:00Z')), 23);
  assert.equal(taipeiHour(new Date('2026-12-16T16:00:00Z')), 0);
  assert.equal(taipeiHour(NOW), 9);
  assert.equal(runLogId('2026-12-17'), 'paymentDue_20261217');
});

test('發送時段：整點起算最多補發 3 小時', () => {
  assert.equal(isWithinSendWindow(9, 8), false);
  assert.equal(isWithinSendWindow(9, 9), true);
  assert.equal(isWithinSendWindow(9, 12), true);
  assert.equal(isWithinSendWindow(9, 13), false);
});

test('戶別資格：空狀態與退戶類不提醒，建案自訂狀態照常提醒', () => {
  assert.equal(isHouseholdEligible({ salesStatus_backend: '簽約' }), true);
  assert.equal(isHouseholdEligible({ salesStatus_backend: '自訂狀態' }), true);
  assert.equal(isHouseholdEligible({ salesStatus_backend: '退戶' }), false);
  assert.equal(isHouseholdEligible({ salesStatus_backend: '' }), false);
  assert.equal(isHouseholdEligible({ salesStatus_backend: null }), false);
});

test('提醒項目依規則篩選並排序：逾期、今天、即將到期', () => {
  const households = [
    unit('A1', [plan('soon', '2026-12-20'), plan('skip', '2026-12-19'), plan('far', '2026-12-24')]),
    unit('A2', [plan('today', TODAY), plan('late', '2026-12-14'), plan('late-skip', '2026-12-15')]),
    unit('A3', [plan('gone', TODAY)], { salesStatus_backend: '退戶' }),
    unit('A4', [{ id: 'paid', date: '2026-12-01', amount: 100, expectedDate: TODAY }]),
    unit('A5', [{ id: 'old', date: '2026-12-01', amount: 100 }]),
  ];
  const items = collectReminderItems(households, makeSettings(), TODAY);
  assert.deepEqual(items.map(i => i.recordId), ['late', 'today', 'soon', 'far']);
  assert.deepEqual(items.map(i => i.label), ['逾期 3 天', '今天到期', '剩 3 天', '剩 7 天']);
});

test('逾期關閉時只提醒到期前與當天', () => {
  const households = [unit('A1', [plan('late', '2026-12-14'), plan('today', TODAY)])];
  const items = collectReminderItems(households, makeSettings({ overdue: { enabled: false } }), TODAY);
  assert.deepEqual(items.map(i => i.recordId), ['today']);
});

test('收件人：排除名單與管理員角色過濾', () => {
  const contacts = new Map([
    ['mgr1', contact('mgr1')],
    ['mgr2', contact('mgr2')],
    ['admin1', contact('admin1', { roles: ['超級管理員'] })],
  ]);
  const { recipients } = resolveRecipients({
    settings: makeSettings({ managers: { channels: ['email'], excludedUserKeys: ['mgr2'] } }),
    managerKeys: new Set(['mgr1', 'mgr2', 'admin1']),
    salesKeys: new Set(),
    contacts,
    permissions: new Map(),
  });
  assert.deepEqual(recipients.map(r => r.userKey), ['mgr1']);
  assert.equal(recipients[0].role, 'manager');
});

test('收件人：雙重身分合併為一人，管道取聯集', () => {
  const { recipients } = resolveRecipients({
    settings: makeSettings({ managers: { channels: ['email'] }, salespersons: { channels: ['line'] } }),
    managerKeys: new Set(['both1']),
    salesKeys: new Set(['both1']),
    contacts: new Map([['both1', contact('both1')]]),
    permissions: new Map([['both1', ['銷控系統']]]),
  });
  assert.equal(recipients.length, 1);
  assert.equal(recipients[0].role, 'both');
  assert.deepEqual(recipients[0].channels.sort(), ['email', 'line']);
});

test('收件人：被排除的管理人員仍以銷售人員身分收到自己的戶', () => {
  const settings = makeSettings({ managers: { channels: ['email'], excludedUserKeys: ['both1'] } });
  const { recipients } = resolveRecipients({
    settings,
    managerKeys: new Set(['both1']),
    salesKeys: new Set(['both1']),
    contacts: new Map([['both1', contact('both1')]]),
    permissions: new Map([['both1', ['銷控系統']]]),
  });
  assert.equal(recipients[0].role, 'salesperson');
  const items = [{ unitId: 'A1', salesKeys: ['both1'] }, { unitId: 'A2', salesKeys: ['other'] }];
  assert.deepEqual(itemsForRecipient(items, recipients[0]).map(i => i.unitId), ['A1']);
});

test('收件人：失去權限的銷售人員被略過，管理員角色視為有權限', () => {
  const { recipients, skipped } = resolveRecipients({
    settings: makeSettings(),
    managerKeys: new Set(),
    salesKeys: new Set(['gone', 'ok', 'adminSales', 'missing']),
    contacts: new Map([
      ['gone', contact('gone')],
      ['ok', contact('ok')],
      ['adminSales', contact('adminSales', { roles: ['系統管理員'] })],
    ]),
    permissions: new Map([['gone', []], ['ok', ['報價系統']], ['adminSales', []]]),
  });
  assert.deepEqual(recipients.map(r => r.userKey).sort(), ['adminSales', 'ok']);
  assert.deepEqual(skipped.map(s => [s.userKey, s.reason]), [['gone', 'no-permission'], ['missing', 'user-not-found']]);
});

test('收件人：某角色管道全部取消就不收通知', () => {
  const { recipients } = resolveRecipients({
    settings: makeSettings({ managers: { channels: [] }, salespersons: { channels: [] } }),
    managerKeys: new Set(['mgr1']),
    salesKeys: new Set(['sales1']),
    contacts: new Map([['mgr1', contact('mgr1')], ['sales1', contact('sales1')]]),
    permissions: new Map([['sales1', ['報價系統']]]),
  });
  assert.deepEqual(recipients, []);
});

test('管理人員看全案，銷售人員只看自己的戶，自己的戶標示 mine', () => {
  const items = [{ unitId: 'A1', salesKeys: ['me'] }, { unitId: 'A2', salesKeys: ['other'] }];
  const manager = itemsForRecipient(items, { userKey: 'me', isManager: true });
  assert.deepEqual(manager.map(i => [i.unitId, i.mine]), [['A1', true], ['A2', false]]);
  const sales = itemsForRecipient(items, { userKey: 'me', isManager: false });
  assert.deepEqual(sales.map(i => i.unitId), ['A1']);
});

test('備援：未綁 LINE 改寄 Email，已勾 Email 不重複，都沒有記 no-contact', () => {
  const noLine = { lineId: null, email: 'a@example.com' };
  const noEmail = { lineId: 'U1', email: null };
  const none = { lineId: null, email: null };
  const both = { lineId: 'U1', email: 'a@example.com' };

  assert.deepEqual(planDeliveries(['line'], noLine).deliveries, [{ channel: 'email', fallbackFrom: 'line' }]);
  assert.deepEqual(planDeliveries(['line', 'email'], noLine).deliveries, [{ channel: 'email', fallbackFrom: null }]);
  assert.deepEqual(planDeliveries(['line', 'email'], noEmail).deliveries, [{ channel: 'line', fallbackFrom: null }]);
  assert.deepEqual(planDeliveries(['line', 'email'], both).deliveries.map(d => d.channel), ['line', 'email']);
  assert.equal(planDeliveries(['line'], none).skipReason, 'no-contact');
  assert.equal(planDeliveries(['email'], noEmail).skipReason, 'no-email');

  assert.deepEqual(summarizeRecipientReach([
    { channels: ['line'], ...noLine },
    { channels: ['line', 'email'], ...noLine },
    { channels: ['line'], ...none },
    { channels: ['line'], ...both },
  ]), { lineFallback: 1, unreachable: 1 });
});

const sampleItem = (index, extra = {}) => ({
  unitId: `A${index}`,
  recordId: `r${index}`,
  expectedDate: '2026-12-20',
  expectedAmount: 300000,
  note: '第 3 期工程款',
  state: 'soon',
  label: '剩 3 天',
  buyerName: '王小明',
  buyerPhone: '0912-345-678',
  mine: false,
  ...extra,
});

test('Flex：最多 10 筆，其餘顯示另有 N 筆，並含查看到期清單按鈕', () => {
  const items = Array.from({ length: 13 }, (_, i) => sampleItem(i));
  const flex = buildLineFlex({ projectId: 'p 1', projectName: '森之樹', items });
  const text = JSON.stringify(flex.contents);
  assert.equal(flex.type, 'flex');
  assert.ok(text.includes('A9'));
  assert.ok(!text.includes('"A10"') && !text.includes('A10'));
  assert.ok(text.includes('另有 3 筆'));
  assert.equal(flex.contents.footer.contents[0].action.uri, 'https://liff.line.me/2008257338-n5Gp6pT3?paymentDueProjectId=p%201');
  assert.equal(MAX_FLEX_ITEMS, 10);
});

test('Flex：極端長度內容仍在 30KB 上限內，文字不為空字串', () => {
  const items = Array.from({ length: 50 }, (_, i) => sampleItem(i, {
    note: '很長的期別名稱'.repeat(50),
    buyerName: '很長的買方姓名'.repeat(50),
    buyerPhone: '09'.repeat(50),
    state: 'overdue',
    label: '逾期 365 天',
    mine: true,
  }));
  const flex = buildLineFlex({ projectId: PROJECT, projectName: '建案'.repeat(20), items });
  assert.ok(Buffer.byteLength(JSON.stringify(flex.contents), 'utf8') < 30000);
  assert.ok(flex.altText.length <= 400);

  const empty = buildLineFlex({ projectId: PROJECT, projectName: '森之樹', items: [sampleItem(1, { note: '', buyerName: '', buyerPhone: '', expectedAmount: null })] });
  const collect = (node, out = []) => {
    if (Array.isArray(node)) node.forEach(child => collect(child, out));
    else if (node && typeof node === 'object') {
      if (node.type === 'text') out.push(node.text);
      Object.values(node).forEach(child => collect(child, out));
    }
    return out;
  };
  assert.ok(collect(empty.contents).every(text => typeof text === 'string' && text.trim().length > 0));
});

test('電話可撥號；格式不符時不加連結，避免 LINE 拒收整則訊息', () => {
  const good = JSON.stringify(buildLineFlex({ projectId: PROJECT, projectName: 'x', items: [sampleItem(1)] }).contents);
  assert.ok(good.includes('tel:0912345678'));
  const bad = JSON.stringify(buildLineFlex({ projectId: PROJECT, projectName: 'x', items: [sampleItem(1, { buyerPhone: '請洽櫃台' })] }).contents);
  assert.ok(!bad.includes('tel:'));
  assert.ok(bad.includes('請洽櫃台'));
});

test('通知預覽文字與 Email 主旨不含買方資料，內文才有', () => {
  const items = [sampleItem(1, { state: 'overdue', label: '逾期 3 天' }), sampleItem(2)];
  const flex = buildLineFlex({ projectId: PROJECT, projectName: '森之樹', items });
  const subject = buildEmailSubject({ projectName: '森之樹', items });
  for (const text of [flex.altText, subject]) {
    assert.ok(!text.includes('王小明'));
    assert.ok(!text.includes('0912'));
  }
  assert.equal(subject, '[森之樹] 繳款到期提醒 2 筆（逾期 1 筆）');
  assert.ok(JSON.stringify(flex.contents).includes('王小明'));
  assert.equal(buildEmailSubject({ projectName: '森之樹', items: [sampleItem(2)] }), '[森之樹] 繳款到期提醒 1 筆');
});

test('Email：列出全部項目、電話可點、內容跳脫 HTML', () => {
  const items = Array.from({ length: 13 }, (_, i) => sampleItem(i));
  items[0].note = '<script>x</script>';
  const html = buildEmailHtml({ projectId: PROJECT, projectName: '森之樹', items });
  assert.ok(html.includes('A12'));
  assert.ok(html.includes('tel:0912345678'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes(emailDueUrl(PROJECT)));
  assert.equal(emailDueUrl('p1'), 'https://anxismart.com/#/payment-due-entry/p1');
  assert.equal(lineDueUrl('p1'), 'https://liff.line.me/2008257338-n5Gp6pT3?paymentDueProjectId=p1');
  // liff.line.me/{ID}/路徑 會被 SDK 轉成實體路徑，GitHub Pages 回 404
  assert.equal(new URL(lineDueUrl('p1')).pathname, '/2008257338-n5Gp6pT3');
});

test('sendDigest：缺少 Token 或聯絡方式時丟出錯誤', async () => {
  const base = { projectId: PROJECT, projectName: '森之樹', items: [sampleItem(1)] };
  await assert.rejects(sendDigest({ ...base, channel: 'line', contact: { lineId: 'U1' }, lineToken: '' }), /missing-line-token/);
  await assert.rejects(sendDigest({ ...base, channel: 'line', contact: {}, lineToken: 't' }), /no-line-id/);
  await assert.rejects(sendDigest({ ...base, channel: 'email', contact: {}, transporter: {} }), /no-email/);

  const pushed = [];
  await sendDigest({ ...base, channel: 'line', contact: { lineId: 'U1' }, lineToken: 't', push: async (...args) => pushed.push(args) });
  assert.equal(pushed[0][1], 'U1');
  assert.equal(pushed[0][2].type, 'flex');

  const mails = [];
  await sendDigest({ ...base, channel: 'email', contact: { email: 'a@example.com' }, transporter: { sendMail: async m => mails.push(m) } });
  assert.equal(mails[0].to, 'a@example.com');
});

test('排程：管理人員收全案、銷售人員收自己的戶，每人只一則，紀錄不存買方個資', async () => {
  const db = createFakeDb();
  const deps = makeDeps({
    households: [
      unit('A1', [plan('a', TODAY)]),
      unit('A2', [plan('b', TODAY)], { salespersonUserKey: ['sales2'] }),
    ],
    context: makeContext({
      contacts: new Map([['mgr1', contact('mgr1')], ['sales1', contact('sales1')]]),
      permissions: new Map([['sales1', ['報價系統']], ['sales2', ['報價系統']]]),
    }),
  });
  const result = await runProjectReminder({
    db, projectId: PROJECT, projectData: projectData({ managers: { channels: ['email'] }, salespersons: { channels: ['line'] } }), now: NOW, deps,
  });

  assert.equal(result.status, 'done');
  assert.equal(result.itemCount, 2);
  assert.equal(result.sent, 2);
  const manager = deps.sent.find(s => s.userKey === 'mgr1');
  assert.equal(manager.channel, 'email');
  assert.deepEqual(manager.items.map(i => i.unitId), ['A1', 'A2']);
  const sales = deps.sent.find(s => s.userKey === 'sales1');
  assert.equal(sales.channel, 'line');
  assert.deepEqual(sales.items.map(i => [i.unitId, i.mine]), [['A1', true]]);

  const log = db.store.get(LOG_PATH);
  assert.equal(log.type, 'paymentDue');
  assert.equal(log.date, TODAY);
  assert.equal(log.status, 'done');
  assert.deepEqual(log.attempts.find(a => a.userKey === 'sales2'), {
    userKey: 'sales2', name: 'sales2', role: 'salesperson', channel: null, fallbackFrom: null, status: 'skipped', error: 'user-not-found',
  });
  const text = JSON.stringify(log);
  assert.ok(!text.includes('買方') && !text.includes('0912345678'));
});

test('防重複：當日已完成不重發，租約未過期不重入', async () => {
  const db = createFakeDb();
  const deps = makeDeps({ households: [unit('A1', [plan('a', TODAY)])] });
  const data = projectData();
  await runProjectReminder({ db, projectId: PROJECT, projectData: data, now: NOW, deps });
  const firstCount = deps.sent.length;
  assert.ok(firstCount > 0);

  const again = await runProjectReminder({ db, projectId: PROJECT, projectData: data, now: new Date(NOW.getTime() + 3600000), deps });
  assert.equal(again.status, 'done');
  assert.equal(deps.sent.length, firstCount);

  const locked = createFakeDb({
    [LOG_PATH]: { status: 'running', leaseUntil: new Date(NOW.getTime() + 60000), attempts: [] },
  });
  const lockedDeps = makeDeps({ households: [unit('A1', [plan('a', TODAY)])] });
  const result = await runProjectReminder({ db: locked, projectId: PROJECT, projectData: data, now: NOW, deps: lockedDeps });
  assert.equal(result.status, 'running');
  assert.equal(lockedDeps.sent.length, 0);
});

test('部分失敗：單人失敗不影響其他人，重試只補失敗項目', async () => {
  const db = createFakeDb();
  let shouldFail = true;
  const deps = makeDeps({
    households: [unit('A1', [plan('a', TODAY)])],
    failWhen: (to, channel) => shouldFail && to.userKey === 'mgr1' && channel === 'line',
  });
  const data = projectData();
  const first = await runProjectReminder({ db, projectId: PROJECT, projectData: data, now: NOW, deps });
  assert.equal(first.status, 'partial');
  assert.equal(first.failed, 1);
  // mgr1 的 Email 與 sales1 的 LINE 都已送出
  assert.deepEqual(deps.sent.map(s => `${s.userKey}:${s.channel}`).sort(), ['mgr1:email', 'sales1:line']);

  shouldFail = false;
  deps.sent.length = 0;
  const second = await runProjectReminder({ db, projectId: PROJECT, projectData: data, now: new Date(NOW.getTime() + 3600000), deps });
  assert.equal(second.status, 'done');
  assert.equal(second.failed, 0);
  assert.equal(second.sent, 3);
  assert.deepEqual(deps.sent.map(s => `${s.userKey}:${s.channel}`), ['mgr1:line']);
});

test('中途逾時：租約過期後只補尚未成功的部分', async () => {
  const db = createFakeDb({
    [LOG_PATH]: {
      type: 'paymentDue',
      status: 'running',
      leaseUntil: new Date(NOW.getTime() - 1000),
      attempts: [{ userKey: 'mgr1', name: 'x', role: 'manager', channel: 'email', fallbackFrom: null, status: 'sent', error: null }],
    },
  });
  const deps = makeDeps({ households: [unit('A1', [plan('a', TODAY)])] });
  const result = await runProjectReminder({ db, projectId: PROJECT, projectData: projectData(), now: NOW, deps });
  assert.equal(result.status, 'done');
  assert.ok(!deps.sent.some(s => s.userKey === 'mgr1' && s.channel === 'email'));
  assert.ok(deps.sent.some(s => s.userKey === 'mgr1' && s.channel === 'line'));
});

test('當天沒有項目記為 empty 且不發送；標記已繳後不再提醒', async () => {
  const db = createFakeDb();
  const deps = makeDeps({
    households: [unit('A1', [{ ...plan('a', TODAY), date: TODAY, amount: 300000 }])],
  });
  const result = await runProjectReminder({ db, projectId: PROJECT, projectData: projectData(), now: NOW, deps });
  assert.equal(result.status, 'empty');
  assert.equal(deps.sent.length, 0);
});

test('試用建案不發送，紀錄為 blocked', async () => {
  const db = createFakeDb();
  const deps = makeDeps({ households: [unit('A1', [plan('a', TODAY)])], blocked: true });
  const result = await runProjectReminder({ db, projectId: PROJECT, projectData: projectData(), now: NOW, deps });
  assert.equal(result.status, 'blocked');
  assert.equal(deps.sent.length, 0);
  assert.equal(db.store.get(LOG_PATH).status, 'blocked');
});

test('未綁 LINE 改寄 Email 記 fallbackFrom；都沒有聯絡方式記 no-contact', async () => {
  const db = createFakeDb();
  const deps = makeDeps({
    households: [unit('A1', [plan('a', TODAY)], { salespersonUserKey: ['s1', 's2'] })],
    context: makeContext({
      managerKeys: new Set(),
      contacts: new Map([['s1', contact('s1', { lineId: null })], ['s2', contact('s2', { lineId: null, email: null })]]),
      permissions: new Map([['s1', ['報價系統']], ['s2', ['報價系統']]]),
    }),
  });
  const result = await runProjectReminder({ db, projectId: PROJECT, projectData: projectData(), now: NOW, deps });
  assert.equal(result.status, 'done');
  assert.equal(result.skipped, 1);
  const { attempts } = db.store.get(LOG_PATH);
  assert.deepEqual(attempts.find(a => a.userKey === 's1').fallbackFrom, 'line');
  assert.equal(attempts.find(a => a.userKey === 's1').channel, 'email');
  assert.equal(attempts.find(a => a.userKey === 's2').error, 'no-contact');
});

test('排程掃描：只處理啟用且在發送時段的建案，單一建案失敗不影響其他建案', async () => {
  const households = [unit('A1', [plan('a', TODAY)])];
  const db = createFakeDb({
    'projects/on': projectData({ sendHour: 9 }),
    'projects/late': projectData({ sendHour: 15 }),
    'projects/off': { name: 'off', paymentReminderSettings: { enabled: false, sendHour: 9 } },
    'projects/broken': projectData({ sendHour: 9 }),
  });
  const deps = makeDeps({ households });
  deps.loadHouseholds = async (_db, projectId) => {
    if (projectId === 'broken') throw new Error('boom');
    return households;
  };
  const originalError = console.error;
  console.error = () => {};
  try {
    const results = await runScheduledReminders({ db, now: NOW, deps });
    assert.deepEqual(results.map(r => [r.projectId, r.status]), [['on', 'done'], ['broken', 'partial']]);
    assert.equal(results[1].lastError, 'boom');
    assert.ok(db.store.has('projects/on/notificationLogs/paymentDue_20261217'));
    assert.ok(!db.store.has('projects/late/notificationLogs/paymentDue_20261217'));
    assert.ok(!db.store.has('projects/off/notificationLogs/paymentDue_20261217'));
  } finally {
    console.error = originalError;
  }
});

const manageAccess = { userKey: 'mgr1', name: '管理', canManage: true, canView: true, isAdmin: false, lineId: 'Umgr1', email: 'mgr@example.com' };
const quoteAccess = { userKey: 'sales1', name: '銷售', canManage: false, canView: true, isAdmin: false };
const noAccess = { userKey: 'x', name: 'x', canManage: false, canView: false, isAdmin: false };

test('權限：銷控與管理員可管理，報價只能檢視，沒有權限被拒絕', async () => {
  const db = createFakeDb({
    'users/mgr': { name: 'm' },
    'userPermissions/mgr': { permissions: { [PROJECT]: { systems: ['銷控系統'] } } },
    'users/quote': { name: 'q' },
    'userPermissions/quote': { permissions: { [PROJECT]: { systems: ['報價系統'] } } },
    'users/admin': { name: 'a', roles: ['系統管理員'] },
    'users/none': { name: 'n' },
  });
  const mgr = await getProjectAccess(db, 'mgr', PROJECT);
  assert.deepEqual([mgr.canManage, mgr.canView, mgr.isAdmin], [true, true, false]);
  const quote = await getProjectAccess(db, 'quote', PROJECT);
  assert.deepEqual([quote.canManage, quote.canView], [false, true]);
  const admin = await getProjectAccess(db, 'admin', PROJECT);
  assert.deepEqual([admin.canManage, admin.isAdmin], [true, true]);
  const none = await getProjectAccess(db, 'none', PROJECT);
  assert.equal(none.canView, false);
  await assert.rejects(getProjectAccess(db, '', PROJECT), /userKey/);
  await assert.rejects(getProjectAccess(db, 'ghost', PROJECT), /找不到/);
});

test('listDue：管理人員看全案，報價權限只看自己的戶，不回傳 salesKeys', async () => {
  const households = [
    unit('A1', [plan('a', TODAY)]),
    unit('A2', [plan('b', '2026-12-10')], { salespersonUserKey: ['other'] }),
    unit('A3', [plan('c', TODAY)], { salesStatus_backend: '退戶' }),
    unit('A4', [{ id: 'd', date: '2026-01-01', amount: 100 }]),
  ];
  const deps = makeDeps({ households });

  const manager = await handleListDue({ db: createFakeDb(), projectId: PROJECT, access: manageAccess, now: NOW, deps });
  assert.equal(manager.canManage, true);
  assert.equal(manager.today, TODAY);
  assert.deepEqual(manager.items.map(i => i.unitId), ['A2', 'A1']);
  assert.deepEqual(Object.keys(manager.units).sort(), ['A1', 'A2']);
  assert.equal(manager.items[0].label, '逾期 7 天');
  assert.equal(manager.items[0].buyerName, '買方A2');
  assert.deepEqual(manager.items[0].salesperson, ['銷售甲']);
  assert.ok(!('salesKeys' in manager.items[0]));

  const sales = await handleListDue({ db: createFakeDb(), projectId: PROJECT, access: quoteAccess, now: NOW, deps });
  assert.equal(sales.canManage, false);
  assert.deepEqual(sales.items.map(i => [i.unitId, i.mine]), [['A1', true]]);
  assert.deepEqual(Object.keys(sales.units), ['A1']);

  await assert.rejects(handleListDue({ db: createFakeDb(), projectId: PROJECT, access: noAccess, now: NOW, deps }), /權限/);
});

test('batchAddPlans：新增、重複略過、找不到戶別、重送不產生重複', async () => {
  const db = createFakeDb({
    'salesHouseholds/p1_A1': { paymentRecords: [] },
    'salesHouseholds/p1_A2': { paymentRecords: [{ id: 'x', expectedDate: '2026-12-20', note: '第3期', date: '', amount: null }] },
    'salesHouseholds/p1_A3': {},
  });
  const params = {
    db,
    projectId: PROJECT,
    access: manageAccess,
    expectedDate: '2026-12-20',
    note: ' 第3期 ',
    entries: [
      { unitId: 'A1', expectedAmount: 100000 },
      { unitId: 'A2', expectedAmount: 100000 },
      { unitId: 'A3' },
      { unitId: 'A9', expectedAmount: 100000 },
      { unitId: 'A1', expectedAmount: 100000 },
    ],
    now: NOW,
  };
  const result = await handleBatchAddPlans(params);
  assert.deepEqual(result.added.sort(), ['A1', 'A3']);
  assert.deepEqual(result.skipped.map(s => [s.unitId, s.reason]).sort(), [['A1', 'exists'], ['A2', 'exists'], ['A9', 'not-found']]);

  const created = db.store.get('salesHouseholds/p1_A1').paymentRecords[0];
  assert.equal(created.expectedDate, '2026-12-20');
  assert.equal(created.expectedAmount, 100000);
  assert.equal(created.planSource, 'batch');
  assert.equal(created.note, '第3期');
  assert.equal(created.date, '');
  assert.equal(created.amount, null);
  assert.equal(db.store.get('salesHouseholds/p1_A3').paymentRecords[0].expectedAmount, null);

  const retry = await handleBatchAddPlans({ ...params, entries: [{ unitId: 'A1', expectedAmount: 100000 }] });
  assert.deepEqual(retry.added, []);
  assert.equal(db.store.get('salesHouseholds/p1_A1').paymentRecords.length, 1);
});

test('batchAddPlans：單戶失敗記入 failed，其他戶照常新增，不丟例外；重新送出可補齊', async () => {
  const seed = {
    'salesHouseholds/p1_A1': { paymentRecords: [] },
    'salesHouseholds/p1_A2': { buyerName: '王小明', buyerPhone: '0912345678', paymentRecords: [] },
    'salesHouseholds/p1_A3': { paymentRecords: [] },
    'salesHouseholds/p1_A4': { paymentRecords: [{ id: 'x', expectedDate: '2026-12-20', note: '第3期' }] },
  };
  const db = createFakeDb(seed);
  db.failures.set('salesHouseholds/p1_A2', new Error('DEADLINE_EXCEEDED'));
  const params = {
    db,
    projectId: PROJECT,
    access: manageAccess,
    expectedDate: '2026-12-20',
    note: '第3期',
    entries: ['A1', 'A2', 'A3', 'A4', 'A9'].map(unitId => ({ unitId, expectedAmount: 1000 })),
    now: NOW,
  };
  const originalError = console.error;
  console.error = () => {};
  try {
    const result = await handleBatchAddPlans(params);
    assert.equal(result.status, 'success');
    assert.deepEqual(result.added.sort(), ['A1', 'A3']);
    assert.deepEqual(result.skipped.map(s => [s.unitId, s.reason]).sort(), [['A4', 'exists'], ['A9', 'not-found']]);
    assert.deepEqual(result.failed, [{ unitId: 'A2', reason: 'DEADLINE_EXCEEDED' }]);
    assert.ok(!JSON.stringify(result).includes('王小明'));
    assert.ok(!JSON.stringify(result).includes('0912345678'));
    assert.equal(db.store.get('salesHouseholds/p1_A1').paymentRecords.length, 1);
    assert.equal(db.store.get('salesHouseholds/p1_A2').paymentRecords.length, 0);

    db.failures.delete('salesHouseholds/p1_A2');
    const retry = await handleBatchAddPlans(params);
    assert.deepEqual(retry.added, ['A2']);
    assert.deepEqual(retry.failed, []);
    assert.equal(db.store.get('salesHouseholds/p1_A1').paymentRecords.length, 1);
  } finally {
    console.error = originalError;
  }
});

test('batchAddPlans：全部成功時 failed 為空陣列', async () => {
  const db = createFakeDb({ 'salesHouseholds/p1_A1': { paymentRecords: [] } });
  const result = await handleBatchAddPlans({
    db, projectId: PROJECT, access: manageAccess, expectedDate: '2026-12-20', note: 'x', entries: [{ unitId: 'A1' }], now: NOW,
  });
  assert.deepEqual(result, { status: 'success', added: ['A1'], skipped: [], failed: [] });
});

test('batchAddPlans：輸入驗證與權限', async () => {
  const base = { db: createFakeDb(), projectId: PROJECT, access: manageAccess, expectedDate: '2026-12-20', note: 'x', entries: [{ unitId: 'A1' }], now: NOW };
  await assert.rejects(handleBatchAddPlans({ ...base, access: quoteAccess }), /銷控系統/);
  await assert.rejects(handleBatchAddPlans({ ...base, expectedDate: '2026-13-40' }), /預計繳款日/);
  await assert.rejects(handleBatchAddPlans({ ...base, entries: [] }), /至少/);
  await assert.rejects(handleBatchAddPlans({ ...base, entries: Array.from({ length: 501 }, (_, i) => ({ unitId: `A${i}` })) }), /500/);
  await assert.rejects(handleBatchAddPlans({ ...base, entries: [{ unitId: 'A1', expectedAmount: -5 }] }), /預計金額/);
});

test('previewRecipients：不回傳實際聯絡方式，可用未儲存的設定計算', async () => {
  const context = makeContext({
    managerKeys: new Set(['mgr1', 'mgr2', 'admin1']),
    contacts: new Map([
      ['mgr1', contact('mgr1')],
      ['mgr2', contact('mgr2', { lineId: null })],
      ['admin1', contact('admin1', { roles: ['超級管理員'] })],
      ['sales1', contact('sales1', { lineId: null, email: null })],
    ]),
    permissions: new Map([['sales1', ['報價系統']]]),
  });
  const deps = makeDeps({ households: [unit('A1', [plan('a', TODAY)])], context });
  const db = createFakeDb({ [`projects/${PROJECT}`]: { paymentReminderSettings: { enabled: true } } });

  const result = await handlePreviewRecipients({
    db,
    projectId: PROJECT,
    access: manageAccess,
    settings: { managers: { channels: ['line'], excludedUserKeys: ['mgr1'] }, salespersons: { channels: ['line'] } },
    now: NOW,
    deps,
  });
  assert.deepEqual(result.managers.map(m => [m.userKey, m.excluded, m.hasLine, m.hasEmail]), [
    ['mgr1', true, true, true],
    ['mgr2', false, false, true],
  ]);
  assert.deepEqual(result.salespersons, [{ userKey: 'sales1', name: '人員sales1', hasLine: false, hasEmail: false, hasPermission: true }]);
  assert.deepEqual(result.summary, { lineFallback: 1, unreachable: 1 });
  const text = JSON.stringify(result);
  assert.ok(!text.includes('@example.com'));
  assert.ok(!text.includes('Umgr'));

  await assert.rejects(handlePreviewRecipients({ db, projectId: PROJECT, access: quoteAccess, now: NOW, deps }), /銷控系統/);
});

test('sendTest：只寄給操作者、假資料，寫入測試紀錄；試用建案不發送', async () => {
  const db = createFakeDb();
  const deps = makeDeps({ households: [] });
  const result = await handleSendTest({
    db, projectId: PROJECT, projectName: '森之樹', access: manageAccess, channels: ['line', 'email', 'sms'], now: NOW, deps,
  });
  assert.deepEqual(result.attempts, [{ channel: 'email', status: 'sent' }, { channel: 'line', status: 'sent' }]);
  assert.ok(deps.sent.every(s => s.userKey === 'mgr1' && s.isTest));
  assert.equal(deps.sent[0].items[0].buyerName, '範例買方');

  const log = [...db.store.entries()].find(([key]) => key.includes('notificationLogs/'))[1];
  assert.equal(log.type, 'paymentDueTest');
  assert.equal(log.status, 'done');
  assert.equal(log.sent, 2);

  const failing = makeDeps({ households: [], failWhen: (_to, channel) => channel === 'line' });
  const partial = await handleSendTest({
    db: createFakeDb(), projectId: PROJECT, projectName: 'x', access: manageAccess, channels: ['line'], now: NOW, deps: failing,
  });
  assert.equal(partial.attempts[0].status, 'failed');
  assert.equal(partial.attempts[0].error, 'send failed');

  const blocked = await handleSendTest({
    db: createFakeDb(), projectId: PROJECT, projectName: 'x', access: manageAccess, channels: ['line'], now: NOW, deps: makeDeps({ blocked: true }),
  });
  assert.deepEqual(blocked, { status: 'success', blocked: true });

  await assert.rejects(handleSendTest({ db, projectId: PROJECT, projectName: 'x', access: manageAccess, channels: [], now: NOW, deps }), /Email 或 LINE/);
  await assert.rejects(handleSendTest({ db, projectId: PROJECT, projectName: 'x', access: quoteAccess, channels: ['line'], now: NOW, deps }), /銷控系統/);
});

test('listLogs：只回繳款通知紀錄，新到舊，最多 30 筆', async () => {
  const seed = { 'projects/p1/notificationLogs/other': { type: 'salesStatus', createdAt: new Date('2026-12-30') } };
  for (let i = 1; i <= 35; i += 1) {
    seed[`projects/p1/notificationLogs/d${i}`] = {
      type: i % 2 ? 'paymentDue' : 'paymentDueTest',
      date: `day${i}`,
      createdAt: { toDate: () => new Date(Date.UTC(2026, 10, i)) },
      attempts: [],
    };
  }
  const db = createFakeDb(seed);
  const result = await handleListLogs({ db, projectId: PROJECT, access: manageAccess });
  assert.equal(result.logs.length, 30);
  assert.equal(result.logs[0].date, 'day35');
  assert.ok(result.logs.every(log => log.type !== 'salesStatus'));
  assert.equal(result.logs[0].createdAt, new Date(Date.UTC(2026, 10, 35)).toISOString());
  const limited = await handleListLogs({ db, projectId: PROJECT, access: manageAccess, limit: 5 });
  assert.equal(limited.logs.length, 5);
  await assert.rejects(handleListLogs({ db, projectId: PROJECT, access: quoteAccess }), /銷控系統/);
});

test('runNow：僅系統／超級管理員，受防重複鎖保護', async () => {
  const db = createFakeDb({ [`projects/${PROJECT}`]: projectData() });
  const deps = makeDeps({ households: [unit('A1', [plan('a', TODAY)])] });
  const admin = { ...manageAccess, isAdmin: true };
  const first = await handleRunNow({ db, projectId: PROJECT, access: admin, now: NOW, deps });
  assert.equal(first.result.status, 'done');
  const sentCount = deps.sent.length;
  const second = await handleRunNow({ db, projectId: PROJECT, access: admin, now: NOW, deps });
  assert.equal(second.result.status, 'done');
  assert.equal(second.result.sent, sentCount);
  assert.equal(deps.sent.length, sentCount);
  assert.equal(db.store.get(LOG_PATH).trigger, 'manual');

  await assert.rejects(handleRunNow({ db, projectId: PROJECT, access: manageAccess, now: NOW, deps }), /管理員/);
  await assert.rejects(handleRunNow({ db: createFakeDb(), projectId: PROJECT, access: admin, now: NOW, deps }), /找不到/);
});

test('runNow：建案未啟用時拒絕，已啟用時不受發送時段限制', async () => {
  const admin = { ...manageAccess, isAdmin: true };
  const deps = makeDeps({ households: [unit('A1', [plan('a', TODAY)])] });
  const offDb = createFakeDb({ [`projects/${PROJECT}`]: { name: 'x', paymentReminderSettings: { enabled: false } } });
  await assert.rejects(
    handleRunNow({ db: offDb, projectId: PROJECT, access: admin, now: NOW, deps }),
    err => err.code === 'failed-precondition' && /尚未啟用/.test(err.message),
  );
  const noSettingDb = createFakeDb({ [`projects/${PROJECT}`]: { name: 'x' } });
  await assert.rejects(handleRunNow({ db: noSettingDb, projectId: PROJECT, access: admin, now: NOW, deps }), /尚未啟用/);
  assert.equal(deps.sent.length, 0);

  // 台北 20:00，遠超過 09:00 的補發時段
  const late = new Date('2026-12-17T12:00:00Z');
  const onDb = createFakeDb({ [`projects/${PROJECT}`]: projectData({ sendHour: 9 }) });
  const result = await handleRunNow({ db: onDb, projectId: PROJECT, access: admin, now: late, deps });
  assert.equal(result.result.status, 'done');
  assert.ok(deps.sent.length > 0);
});

test('paymentProofApi 驗證：舊呼叫方式不變、預計紀錄改驗證預計日', () => {
  const paid = { action: 'addRecord', date: '2026-12-01', amount: 100 };
  assert.equal(paymentPayloadError(paid), null);
  assert.match(paymentPayloadError({ action: 'addRecord', date: 'x', amount: 100 }), /繳款日期/);
  assert.match(paymentPayloadError({ action: 'addRecord', date: '2026-12-01', amount: 0 }), /繳款金額/);
  assert.match(paymentPayloadError({ action: 'addRecord', date: '2026-12-01' }), /繳款金額/);
  assert.match(paymentPayloadError({ action: 'addRecord', amount: 100, date: '' }), /繳款日期/);
  assert.match(paymentPayloadError({ action: 'upload', date: '', amount: null }), /繳款日期/);
  assert.match(paymentPayloadError({ action: 'rename', date: '', amount: null }), /繳款日期/);
  assert.equal(paymentPayloadError({ action: 'deleteRecord' }), null);
  assert.equal(paymentPayloadError({ action: 'trashFile' }), null);

  const unpaid = { action: 'addRecord', date: '', amount: null, expectedDate: '2026-12-20', expectedAmount: 100 };
  assert.equal(paymentPayloadError(unpaid), null);
  assert.equal(paymentPayloadError({ ...unpaid, expectedAmount: null }), null);
  assert.match(paymentPayloadError({ ...unpaid, expectedDate: '' }), /預計繳款日/);
  assert.match(paymentPayloadError({ ...unpaid, expectedDate: null }), /預計繳款日/);
  assert.match(paymentPayloadError({ ...unpaid, expectedDate: '2026-02-30' }), /預計繳款日/);
  assert.match(paymentPayloadError({ ...unpaid, expectedAmount: 0 }), /預計金額/);
  assert.match(paymentPayloadError({ ...unpaid, expectedAmount: 1.5 }), /預計金額/);
  assert.match(paymentPayloadError({ ...unpaid, base64: 'abc' }), /憑證/);
  assert.match(paymentPayloadError({ ...unpaid, planSource: 'x' }), /來源/);
  assert.equal(paymentPayloadError({ ...unpaid, planSource: 'balance' }), null);
  // updateRecord 未帶預計日要讀到紀錄才能判斷
  assert.equal(paymentPayloadError({ action: 'updateRecord', date: '', amount: null }), null);
});

test('paymentProofApi 更新前檢查：未繳必須有預計日，有憑證要先移除', () => {
  assert.match(unpaidUpdateError({ date: '2026-01-01', amount: 1 }, {}), /預計繳款日/);
  assert.match(unpaidUpdateError({ expectedDate: '2026-12-20' }, { expectedDate: null }), /預計繳款日/);
  assert.equal(unpaidUpdateError({ expectedDate: '2026-12-20' }, {}), null);
  assert.match(unpaidUpdateError({ expectedDate: '2026-12-20', file: { fileId: 'f' } }, {}), /移除憑證/);
  assert.equal(unpaidUpdateError({ expectedDate: '2026-12-20', file: { fileId: 'f' } }, { removeFile: true }), null);
});

test('新增紀錄：舊呼叫方式內容不變；預計紀錄金額不寫入 amount', () => {
  const options = { id: 'pr', nowIso: 'now', file: null };
  assert.deepEqual(buildPaymentRecord({ date: '2026-12-01', amount: 100, note: 'n' }, options), {
    id: 'pr', date: '2026-12-01', amount: 100, note: 'n', file: null, createdAt: 'now', updatedAt: 'now',
  });
  assert.deepEqual(buildPaymentRecord({ date: '', amount: null, expectedDate: '2026-12-20', expectedAmount: 300, note: 'n' }, options), {
    id: 'pr', date: '', amount: null, note: 'n', file: null, createdAt: 'now', updatedAt: 'now',
    expectedDate: '2026-12-20', expectedAmount: 300, planSource: 'manual', paidAt: null, paidBy: null,
  });
  const withSource = buildPaymentRecord({ date: '', amount: null, expectedDate: '2026-12-20', planSource: 'template' }, options);
  assert.equal(withSource.planSource, 'template');
  assert.equal(withSource.expectedAmount, null);
  const paidWithPlan = buildPaymentRecord({ date: '2026-12-01', amount: 100, expectedDate: '2026-11-30', paidBy: '王' }, options);
  assert.equal(paidWithPlan.expectedDate, '2026-11-30');
  assert.equal(paidWithPlan.paidAt, 'now');
  assert.equal(paidWithPlan.paidBy, '王');
});

test('更新紀錄：預計欄位未帶保留、帶 null 清除，已繳狀態轉換才動 paidAt／paidBy', () => {
  const options = { nowIso: 'now', file: null };
  const planned = { id: 'p', expectedDate: '2026-12-20', expectedAmount: 300, planSource: 'batch', date: '', amount: null, note: 'n', file: null, createdAt: 'c' };

  const paid = applyPaymentRecordUpdate(planned, { date: '2026-12-21', amount: 200, note: 'n', paidBy: '王' }, options);
  assert.equal(paid.expectedDate, '2026-12-20');
  assert.equal(paid.expectedAmount, 300);
  assert.equal(paid.planSource, 'batch');
  assert.equal(paid.amount, 200);
  assert.equal(paid.paidAt, 'now');
  assert.equal(paid.paidBy, '王');
  assert.equal(paid.createdAt, 'c');

  const edited = applyPaymentRecordUpdate({ ...paid, paidAt: 'old', paidBy: '李' }, { date: '2026-12-22', amount: 200, note: 'n', paidBy: '王' }, options);
  assert.equal(edited.paidAt, 'old');
  assert.equal(edited.paidBy, '李');

  const reverted = applyPaymentRecordUpdate(paid, { date: '', amount: null, note: 'n' }, options);
  assert.equal(reverted.date, '');
  assert.equal(reverted.amount, null);
  assert.equal(reverted.paidAt, null);
  assert.equal(reverted.paidBy, null);
  assert.equal(reverted.expectedDate, '2026-12-20');

  const changed = applyPaymentRecordUpdate(planned, { date: '', amount: null, note: 'n', expectedDate: '2026-12-25', expectedAmount: null, planSource: null }, options);
  assert.equal(changed.expectedDate, '2026-12-25');
  assert.equal(changed.expectedAmount, null);
  assert.equal(changed.planSource, null);
  assert.ok(!('paidAt' in changed));

  const cleared = applyPaymentRecordUpdate({ id: 'd', date: '2026-01-01', amount: 1, expectedDate: '2026-01-01' }, { date: '2026-01-01', amount: 1, expectedDate: null }, options);
  assert.equal(cleared.expectedDate, null);

  // 舊紀錄用舊方式更新：不新增任何欄位
  const legacy = applyPaymentRecordUpdate({ id: 'd', date: '2026-01-01', amount: 1, note: '', file: null, createdAt: 'c' }, { date: '2026-01-02', amount: 2, note: 'x' }, options);
  assert.deepEqual(legacy, { id: 'd', date: '2026-01-02', amount: 2, note: 'x', file: null, createdAt: 'c', updatedAt: 'now' });
});

test('後端狀態工具：台北時區跨日邊界', () => {
  assert.equal(taipeiToday(new Date('2026-12-16T15:59:59Z')), '2026-12-16');
  assert.equal(taipeiToday(new Date('2026-12-16T16:00:00Z')), '2026-12-17');
});

test('後端狀態工具：日期有值但金額空白不算已繳；有預計日才算預計', () => {
  assert.equal(isPaidRecord({ date: '2026-12-01', amount: null }), false);
  assert.equal(isPaidRecord({ date: '2026-12-01', amount: 0 }), false);
  assert.equal(isPaidRecord({ date: '2026-12-01', amount: 1 }), true);
  assert.equal(isPlannedRecord({ date: '2026-12-01', amount: null }), false);
  assert.equal(isPlannedRecord({ date: '2026-12-01', amount: null, expectedDate: '2026-12-20' }), true);
});

test('M1 不合法的 userKey 不會讓整個建案失敗，改記 user-not-found', async () => {
  assert.equal(isValidDocumentId('0912345678'), true);
  for (const bad of ['王/李', '', '.', '..', '__x__', 'a'.repeat(1501), null, undefined, 123]) {
    assert.equal(isValidDocumentId(bad), false, String(bad));
  }

  const seed = {
    'userPermissions/mgr1': { permissions: { [PROJECT]: { systems: ['銷控系統'] } } },
    'users/mgr1': { name: '管理', email: 'mgr@example.com' },
  };
  const docs = await fetchByDocumentIds(createFakeDb(seed), 'users', ['mgr1', '王/李', '', '..']);
  assert.deepEqual([...docs.keys()], ['mgr1']);

  const db = createFakeDb(seed);
  const deps = { ...makeDeps({ households: [unit('A1', [plan('a', TODAY)], { salespersonUserKey: ['王/李'] })] }), loadRecipientContext };
  const result = await runProjectReminder({ db, projectId: PROJECT, projectData: projectData(), now: NOW, deps });
  assert.equal(result.status, 'done');
  assert.deepEqual(deps.sent.map(s => s.userKey), ['mgr1']);
  const skipped = db.store.get(LOG_PATH).attempts.find(a => a.status === 'skipped');
  assert.equal(skipped.userKey, '王/李');
  assert.equal(skipped.error, 'user-not-found');

  const preview = await handlePreviewRecipients({
    db: createFakeDb(seed),
    projectId: PROJECT,
    access: manageAccess,
    settings: {},
    now: NOW,
    deps,
  });
  assert.deepEqual(preview.salespersons, [{ userKey: '王/李', name: '王/李', hasLine: false, hasEmail: false, hasPermission: false }]);
  assert.deepEqual(preview.managers.map(m => m.userKey), ['mgr1']);
});

test('L8 建案代號含特殊字元時，管理人員查詢仍走正確路徑', async () => {
  const projectId = 'p.1';
  const db = createFakeDb({
    'userPermissions/mgr1': { permissions: { [projectId]: { systems: ['銷控系統'] } } },
    'userPermissions/other': { permissions: { p: { 1: { systems: ['銷控系統'] } } } },
    'users/mgr1': { name: '管理' },
  });
  const { managerKeys } = await loadRecipientContext(db, projectId, new Set());
  assert.deepEqual([...managerKeys], ['mgr1']);
});

test('M2 取得租約後發生例外：釋放租約、記為 partial，不含個資，下次可接手', async () => {
  const db = createFakeDb();
  const households = [unit('A1', [plan('a', TODAY)])];
  const deps = makeDeps({ households });
  const originalLoad = deps.loadHouseholds;
  deps.loadHouseholds = async () => { throw new Error('DEADLINE_EXCEEDED'); };
  const originalError = console.error;
  console.error = () => {};
  let first;
  try {
    first = await runProjectReminder({ db, projectId: PROJECT, projectData: projectData(), now: NOW, deps });
  } finally {
    console.error = originalError;
  }
  assert.equal(first.status, 'partial');
  assert.equal(first.lastError, 'DEADLINE_EXCEEDED');
  const log = db.store.get(LOG_PATH);
  assert.equal(log.status, 'partial');
  assert.equal(log.leaseUntil, null);
  assert.equal(log.lastError, 'DEADLINE_EXCEEDED');

  const logs = await handleListLogs({ db, projectId: PROJECT, access: manageAccess });
  assert.equal(logs.logs[0].lastError, 'DEADLINE_EXCEEDED');

  deps.loadHouseholds = originalLoad;
  const second = await runProjectReminder({ db, projectId: PROJECT, projectData: projectData(), now: NOW, deps });
  assert.equal(second.status, 'done');
  assert.equal(second.lastError, null);
  assert.equal(db.store.get(LOG_PATH).lastError, null);
});

test('M2 發送器建立失敗（例如讀不到 Token）同樣釋放租約', async () => {
  const db = createFakeDb();
  const deps = makeDeps({ households: [unit('A1', [plan('a', TODAY)])] });
  deps.createSender = async () => { throw new Error('token read failed'); };
  const originalError = console.error;
  console.error = () => {};
  try {
    const result = await runProjectReminder({ db, projectId: PROJECT, projectData: projectData(), now: NOW, deps });
    assert.equal(result.status, 'partial');
    assert.equal(db.store.get(LOG_PATH).leaseUntil, null);
  } finally {
    console.error = originalError;
  }
});

test('M3 LINE 重試金鑰：固定 UUID，同人同日相同，跨建案與跨日不同；排程帶入、測試通知不帶', async () => {
  const key = lineRetryKey('p1:paymentDue_20261217:u1');
  assert.match(key, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(key, lineRetryKey('p1:paymentDue_20261217:u1'));
  assert.notEqual(key, lineRetryKey('p2:paymentDue_20261217:u1'));
  assert.notEqual(key, lineRetryKey('p1:paymentDue_20261218:u1'));
  assert.notEqual(key, lineRetryKey('p1:paymentDue_20261217:u2'));

  // 第一次回應逾時（實際已送達）→ 下一小時重試帶相同金鑰
  const db = createFakeDb();
  let failOnce = true;
  const deps = makeDeps({
    households: [unit('A1', [plan('a', TODAY)])],
    context: makeContext({ managerKeys: new Set(), contacts: new Map([['sales1', contact('sales1')]]) }),
    failWhen: () => {
      if (!failOnce) return false;
      failOnce = false;
      return true;
    },
  });
  const seen = [];
  const inner = deps.createSender;
  deps.createSender = async (...args) => {
    const send = await inner(...args);
    return (params) => { seen.push(params.retryKey); return send(params); };
  };
  const originalError = console.error;
  console.error = () => {};
  try {
    await runProjectReminder({ db, projectId: PROJECT, projectData: projectData(), now: NOW, deps });
    await runProjectReminder({ db, projectId: PROJECT, projectData: projectData(), now: new Date(NOW.getTime() + 3600000), deps });
  } finally {
    console.error = originalError;
  }
  assert.equal(seen.length, 2);
  assert.equal(seen[0], seen[1]);
  assert.equal(seen[0], lineRetryKey(`${PROJECT}:paymentDue_20261217:sales1`));

  const testDeps = makeDeps({ households: [] });
  await handleSendTest({ db: createFakeDb(), projectId: PROJECT, projectName: 'x', access: manageAccess, channels: ['line'], now: NOW, deps: testDeps });
  assert.equal(testDeps.sent[0].retryKey, undefined);
});

test('M3、M4 LINE 推播：帶重試金鑰標頭、409 視為成功、429 重試後成功、其他錯誤丟出', async () => {
  const originalPost = axios.post;
  const calls = [];
  const respond = (queue) => {
    axios.post = async (url, body, config) => {
      calls.push({ url, body, config });
      const next = queue.shift();
      if (next instanceof Error) throw next;
      return next;
    };
  };
  const httpError = (status) => Object.assign(new Error(`status ${status}`), { response: { status, data: {} } });
  const sleeps = [];
  const sleep = async (ms) => { sleeps.push(ms); };
  try {
    respond([{ status: 200 }]);
    await pushLine('token', 'U1', { type: 'text' }, { retryKey: 'key-1', sleep });
    assert.equal(calls[0].config.headers['X-Line-Retry-Key'], 'key-1');
    assert.equal(calls[0].config.headers.Authorization, 'Bearer token');

    calls.length = 0;
    respond([{ status: 200 }]);
    await pushLine('token', 'U1', { type: 'text' }, { sleep });
    assert.ok(!('X-Line-Retry-Key' in calls[0].config.headers));

    respond([httpError(409)]);
    const conflict = await pushLine('token', 'U1', { type: 'text' }, { retryKey: 'key-1', sleep });
    assert.equal(conflict.status, 409);
    respond([httpError(409)]);
    await assert.rejects(pushLine('token', 'U1', { type: 'text' }, { sleep }), /status 409/);

    calls.length = 0;
    sleeps.length = 0;
    respond([httpError(429), httpError(429), { status: 200 }]);
    await pushLine('token', 'U1', { type: 'text' }, { retryKey: 'key-1', sleep });
    assert.equal(calls.length, 3);
    assert.deepEqual(sleeps, [1000, 2000]);
    assert.ok(calls.every(call => call.config.headers['X-Line-Retry-Key'] === 'key-1'));

    calls.length = 0;
    respond([httpError(429), httpError(429), httpError(429)]);
    await assert.rejects(pushLine('token', 'U1', { type: 'text' }, { sleep }), /status 429/);
    assert.equal(calls.length, 3);

    respond([httpError(500)]);
    await assert.rejects(pushLine('token', 'U1', { type: 'text' }, { sleep }), /status 500/);
  } finally {
    axios.post = originalPost;
  }
});

test('sendDigest 把重試金鑰傳給 LINE 推播', async () => {
  const pushed = [];
  await sendDigest({
    channel: 'line',
    contact: { lineId: 'U1' },
    projectId: PROJECT,
    projectName: 'x',
    items: [sampleItem(1)],
    lineToken: 't',
    retryKey: 'key-9',
    push: async (...args) => pushed.push(args),
  });
  assert.deepEqual(pushed[0][3], { retryKey: 'key-9' });
});

test('L5 重試時失敗者已不在名單：舊失敗轉 skipped，done 不會有 failed', async () => {
  const db = createFakeDb();
  const deps = makeDeps({
    households: [unit('A1', [plan('a', TODAY)])],
    failWhen: (to, channel) => to.userKey === 'mgr1' && channel === 'line',
  });
  const originalError = console.error;
  console.error = () => {};
  try {
    const first = await runProjectReminder({ db, projectId: PROJECT, projectData: projectData(), now: NOW, deps });
    assert.equal(first.status, 'partial');
    assert.equal(first.failed, 1);

    // 管理人員被排除：這次不再發給他
    const second = await runProjectReminder({
      db,
      projectId: PROJECT,
      projectData: projectData({ managers: { channels: ['email', 'line'], excludedUserKeys: ['mgr1'] } }),
      now: new Date(NOW.getTime() + 3600000),
      deps,
    });
    assert.equal(second.status, 'done');
    assert.equal(second.failed, 0);
    const log = db.store.get(LOG_PATH);
    assert.equal(log.status, 'done');
    assert.equal(log.failed, 0);
    const retired = log.attempts.find(a => a.userKey === 'mgr1' && a.channel === 'line');
    assert.equal(retired.status, 'skipped');
    assert.equal(retired.error, 'no-longer-applicable');
    assert.equal(log.skipped, 1);
    assert.equal(log.attempts.find(a => a.userKey === 'mgr1' && a.channel === 'email').status, 'sent');
  } finally {
    console.error = originalError;
  }
});

test('L5 重試時項目都已繳：舊失敗轉 skipped，狀態 done', async () => {
  const db = createFakeDb();
  const deps = makeDeps({
    households: [unit('A1', [plan('a', TODAY)])],
    failWhen: (to) => to.userKey === 'sales1',
  });
  const originalError = console.error;
  console.error = () => {};
  try {
    const first = await runProjectReminder({ db, projectId: PROJECT, projectData: projectData(), now: NOW, deps });
    assert.equal(first.status, 'partial');
    deps.loadHouseholds = async () => [unit('A1', [{ ...plan('a', TODAY), date: TODAY, amount: 300000 }])];
    const second = await runProjectReminder({ db, projectId: PROJECT, projectData: projectData(), now: new Date(NOW.getTime() + 3600000), deps });
    assert.equal(second.status, 'done');
    assert.equal(second.failed, 0);
    assert.ok(db.store.get(LOG_PATH).attempts
      .filter(a => a.userKey === 'sales1')
      .every(a => a.status === 'skipped' && a.error === 'no-longer-applicable'));
  } finally {
    console.error = originalError;
  }
});

test('略過紀錄每次重新判定：之後補上聯絡方式不會留下舊的略過', async () => {
  const db = createFakeDb();
  const unreachable = makeContext({
    managerKeys: new Set(),
    contacts: new Map([['sales1', contact('sales1', { lineId: null, email: null })]]),
  });
  const deps = makeDeps({
    households: [unit('A1', [plan('a', TODAY)]), unit('A2', [plan('b', TODAY)], { salespersonUserKey: ['sales2'] })],
    context: unreachable,
    failWhen: () => true,
  });
  deps.loadRecipientContext = async () => ({
    ...unreachable,
    contacts: new Map([...unreachable.contacts, ['sales2', contact('sales2')]]),
    permissions: new Map([['sales1', ['報價系統']], ['sales2', ['報價系統']]]),
  });
  const originalError = console.error;
  console.error = () => {};
  try {
    await runProjectReminder({ db, projectId: PROJECT, projectData: projectData(), now: NOW, deps });
    assert.equal(db.store.get(LOG_PATH).attempts.find(a => a.userKey === 'sales1').error, 'no-contact');

    deps.loadRecipientContext = async () => ({
      managerKeys: new Set(),
      contacts: new Map([['sales1', contact('sales1')], ['sales2', contact('sales2')]]),
      permissions: new Map([['sales1', ['報價系統']], ['sales2', ['報價系統']]]),
    });
    await runProjectReminder({
      db, projectId: PROJECT, projectData: projectData(), now: new Date(NOW.getTime() + 3600000), deps,
    });
    const attempts = db.store.get(LOG_PATH).attempts.filter(a => a.userKey === 'sales1');
    assert.equal(attempts.length, 1);
    assert.equal(attempts[0].channel, 'line');
  } finally {
    console.error = originalError;
  }
});

test('L6 有到期項目但沒有收件人：noRecipients 回傳於結果與 listLogs', async () => {
  const db = createFakeDb();
  const deps = makeDeps({
    households: [unit('A1', [plan('a', TODAY)], { salesperson: [], salespersonUserKey: [] })],
    context: makeContext({ managerKeys: new Set() }),
  });
  let senderCreated = false;
  const inner = deps.createSender;
  deps.createSender = async (...args) => { senderCreated = true; return inner(...args); };
  const result = await runProjectReminder({ db, projectId: PROJECT, projectData: projectData(), now: NOW, deps });
  assert.equal(result.status, 'done');
  assert.equal(result.noRecipients, true);
  assert.equal(result.itemCount, 1);
  assert.equal(senderCreated, false);
  assert.equal(db.store.get(LOG_PATH).noRecipients, true);
  const logs = await handleListLogs({ db, projectId: PROJECT, access: manageAccess });
  assert.equal(logs.logs[0].noRecipients, true);

  const delivered = createFakeDb();
  const okDeps = makeDeps({ households: [unit('A1', [plan('a', TODAY)])] });
  const ok = await runProjectReminder({ db: delivered, projectId: PROJECT, projectData: projectData(), now: NOW, deps: okDeps });
  assert.equal(ok.noRecipients, false);
  assert.equal(delivered.store.get(LOG_PATH).noRecipients, false);
});

test('L6 收件人都無法聯絡：有略過紀錄，但不算沒有收件人', async () => {
  const db = createFakeDb();
  const deps = makeDeps({
    households: [unit('A1', [plan('a', TODAY)])],
    context: makeContext({
      managerKeys: new Set(),
      contacts: new Map([['sales1', contact('sales1', { lineId: null, email: null })]]),
    }),
  });
  const result = await runProjectReminder({ db, projectId: PROJECT, projectData: projectData(), now: NOW, deps });
  assert.equal(result.noRecipients, false);
  assert.equal(result.skipped, 1);
});

test('L6 只有銷售姓名沒有 userKey：每戶一筆 no-user-key，不含買方資料', async () => {
  const db = createFakeDb();
  const deps = makeDeps({
    households: [
      unit('A1', [plan('a', TODAY), plan('b', TODAY)], { salesperson: ['王銷售'], salespersonUserKey: [] }),
      unit('A2', [plan('c', TODAY)], { salesperson: ['林銷售'], salespersonUserKey: [] }),
      unit('A3', [plan('d', TODAY)], { salesperson: [], salespersonUserKey: [] }),
    ],
  });
  const result = await runProjectReminder({ db, projectId: PROJECT, projectData: projectData(), now: NOW, deps });
  assert.equal(result.status, 'done');
  const attempts = db.store.get(LOG_PATH).attempts.filter(a => a.error === 'no-user-key');
  assert.deepEqual(attempts.map(a => [a.userKey, a.unitId, a.name, a.status, a.channel]), [
    ['', 'A1', '王銷售', 'skipped', null],
    ['', 'A2', '林銷售', 'skipped', null],
  ]);
  assert.ok(!JSON.stringify(attempts).includes('買方'));

  const noSales = createFakeDb();
  const disabled = makeDeps({ households: [unit('A1', [plan('a', TODAY)], { salesperson: ['王銷售'], salespersonUserKey: [] })] });
  await runProjectReminder({ db: noSales, projectId: PROJECT, projectData: projectData({ salespersons: { channels: [] } }), now: NOW, deps: disabled });
  assert.ok(!noSales.store.get(LOG_PATH).attempts.some(a => a.error === 'no-user-key'));
});

test('M4 每完成一位收件人就寫入進度，中途中斷時不會遺失', async () => {
  const db = createFakeDb();
  const deps = makeDeps({ households: [unit('A1', [plan('a', TODAY)])] });
  const snapshots = [];
  const inner = deps.createSender;
  deps.createSender = async (...args) => {
    const send = await inner(...args);
    return (params) => {
      snapshots.push({
        target: `${params.contact.userKey}:${params.channel}`,
        persisted: db.store.get(LOG_PATH).attempts.map(a => `${a.userKey}:${a.channel}:${a.status}`),
      });
      return send(params);
    };
  };
  await runProjectReminder({ db, projectId: PROJECT, projectData: projectData(), now: NOW, deps });
  const salesSend = snapshots.find(s => s.target.startsWith('sales1'));
  assert.deepEqual(salesSend.persisted.sort(), ['mgr1:email:sent', 'mgr1:line:sent']);
});

test('M4 進度寫入失敗不影響其他收件人', async () => {
  const db = createFakeDb();
  const deps = makeDeps({ households: [unit('A1', [plan('a', TODAY)])] });
  const inner = deps.createSender;
  deps.createSender = async (...args) => {
    const send = await inner(...args);
    db.failures.set(LOG_PATH, new Error('write failed'));
    return send;
  };
  const originals = { warn: console.warn, error: console.error };
  console.warn = () => {};
  console.error = () => {};
  try {
    const result = await runProjectReminder({ db, projectId: PROJECT, projectData: projectData(), now: NOW, deps });
    assert.equal(deps.sent.length, 3);
    // 最後的狀態也寫不進去：回報 partial，紀錄維持 running，等租約過期後接手
    assert.equal(result.status, 'partial');
    assert.equal(db.store.get(LOG_PATH).status, 'running');
  } finally {
    console.warn = originals.warn;
    console.error = originals.error;
  }
});

test('M4 租約時間長於排程逾時，避免下一次排程在執行中接手', () => {
  const { timeoutSeconds } = paymentDueReminder.__endpoint;
  assert.equal(timeoutSeconds, 540);
  assert.ok(LEASE_MS > timeoutSeconds * 1000);
});

test('M4 Flex 有逾期時標題列轉紅，否則為藍色', () => {
  const overdue = buildLineFlex({ projectId: PROJECT, projectName: 'x', items: [sampleItem(1, { state: 'overdue', label: '逾期 3 天' }), sampleItem(2)] });
  assert.equal(overdue.contents.header.backgroundColor, '#d62d20');
  const upcoming = buildLineFlex({ projectId: PROJECT, projectName: 'x', items: [sampleItem(2)] });
  assert.equal(upcoming.contents.header.backgroundColor, '#0071e3');
  const html = buildEmailHtml({ projectId: PROJECT, projectName: 'x', items: [sampleItem(1, { state: 'overdue', label: '逾期 3 天' })] });
  assert.ok(html.includes('background:#d62d20'));
});

test('M4 Email：買方姓名與建案名稱跳脫 HTML，電話連結也安全', () => {
  const attack = '<img src=x onerror=alert(1)>';
  const html = buildEmailHtml({
    projectId: 'p"1',
    projectName: `森之樹${attack}`,
    items: [sampleItem(1, { buyerName: `王${attack}`, unitId: `A${attack}`, buyerPhone: '"><script>x</script>' })],
  });
  assert.ok(!html.includes('<img src=x'));
  assert.ok(!html.includes('<script>x'));
  assert.ok(html.includes('森之樹&lt;img'));
  assert.ok(html.includes('王&lt;img'));
  assert.ok(!html.includes('href="tel:"'));
  assert.ok(html.includes('payment-due-entry/p%221'));
});

test('L7 altText 不超過 400 字，戶別與建案名過長時截斷，仍在 Flex 上限內', () => {
  const longName = '很長的建案名稱'.repeat(200);
  const items = Array.from({ length: 10 }, (_, i) => sampleItem(i, {
    unitId: `A${'1'.repeat(500)}${i}`, note: 'x'.repeat(500), buyerName: 'y'.repeat(500), buyerPhone: '0'.repeat(500),
  }));
  const flex = buildLineFlex({ projectId: PROJECT, projectName: longName, items });
  assert.ok(flex.altText.length <= 400);
  assert.ok(Buffer.byteLength(JSON.stringify(flex.contents), 'utf8') < 30000);
  const headerText = flex.contents.header.contents[0].text;
  assert.ok(headerText.length < 100);
  const unitText = flex.contents.body.contents[2].contents[0].contents[0].text;
  assert.ok(unitText.length <= 31);
  assert.ok(unitText.endsWith('…'));
  const mine = buildLineFlex({ projectId: PROJECT, projectName: 'x', items: [sampleItem(1, { mine: true })] });
  assert.equal(mine.contents.body.contents[2].contents[0].contents[0].text, 'A1（我的）');
});

test('L9 寄信連線設有逾時，避免卡住整個排程', () => {
  const originals = { user: process.env.SENDER_EMAIL, pass: process.env.GMAIL_APP_PASSWORD };
  process.env.SENDER_EMAIL = 'sender@example.com';
  process.env.GMAIL_APP_PASSWORD = 'offline';
  try {
    const { options } = buildTransporter();
    assert.equal(options.connectionTimeout, MAIL_TIMEOUT_MS);
    assert.equal(options.greetingTimeout, MAIL_TIMEOUT_MS);
    assert.equal(options.socketTimeout, MAIL_TIMEOUT_MS);
    assert.equal(MAIL_TIMEOUT_MS, 20000);
  } finally {
    if (originals.user === undefined) delete process.env.SENDER_EMAIL; else process.env.SENDER_EMAIL = originals.user;
    if (originals.pass === undefined) delete process.env.GMAIL_APP_PASSWORD; else process.env.GMAIL_APP_PASSWORD = originals.pass;
  }
});

test('L2 不存在的日曆日不可寫入已繳紀錄', () => {
  assert.match(paymentPayloadError({ action: 'addRecord', date: '2026-02-30', amount: 100 }), /繳款日期/);
  assert.match(paymentPayloadError({ action: 'updateRecord', date: '2026-13-01', amount: 100 }), /繳款日期/);
  assert.match(paymentPayloadError({ action: 'upload', date: '2026-02-30', amount: 100 }), /繳款日期/);
  assert.equal(paymentPayloadError({ action: 'addRecord', date: '2028-02-29', amount: 100 }), null);
});

test('L3 日期有值但金額空白的舊紀錄用舊方式更新，不會多寫 paidAt／paidBy', () => {
  const options = { nowIso: 'now', file: null };
  const legacy = { id: 'd', date: '2026-01-01', amount: null, note: '', file: null, createdAt: 'c' };
  const updated = applyPaymentRecordUpdate(legacy, { date: '2026-01-02', amount: 500, note: 'x', paidBy: '王' }, options);
  assert.deepEqual(updated, { id: 'd', date: '2026-01-02', amount: 500, note: 'x', file: null, createdAt: 'c', updatedAt: 'now' });

  const planned = { ...legacy, expectedDate: '2026-01-01' };
  const converted = applyPaymentRecordUpdate(planned, { date: '2026-01-02', amount: 500, note: 'x', paidBy: '王' }, options);
  assert.equal(converted.paidAt, 'now');
  assert.equal(converted.paidBy, '王');
});

test('N1 復原退戶合併：以備份為主，只保留最近一次退戶之後新增的紀錄', () => {
  const cutoff = Date.UTC(2026, 8, 1);
  const before = '2026-06-01T00:00:00.000Z';
  const after = '2026-10-01T00:00:00.000Z';
  const backup = [{ id: 'a', amount: 1 }, { id: 'b', amount: 2 }];
  const current = [
    { id: 'b', amount: 99, createdAt: after },
    { id: 'c', amount: 3, createdAt: after },
    { id: 'old', amount: 200, createdAt: before },
    { id: 'none', amount: 300 },
    { id: 'bad', amount: 400, createdAt: 'not-a-date' },
    { id: 'same', amount: 500, createdAt: new Date(cutoff).toISOString() },
    { id: 'ts', amount: 600, createdAt: { toMillis: () => cutoff + 1 } },
  ];
  assert.deepEqual(mergeRestoredPaymentRecords(backup, current, cutoff).map(r => r.id), ['a', 'b', 'c', 'ts']);
  assert.equal(mergeRestoredPaymentRecords(backup, current, cutoff)[1].amount, 2);
  assert.deepEqual(mergeRestoredPaymentRecords(undefined, current, cutoff).map(r => r.id), ['b', 'c', 'ts']);
  assert.deepEqual(mergeRestoredPaymentRecords(backup, null, cutoff), backup);
  assert.deepEqual(mergeRestoredPaymentRecords(null, undefined, cutoff), []);
  assert.deepEqual(mergeRestoredPaymentRecords([null, { id: 'a' }], [undefined], cutoff), [{ id: 'a' }]);
  // 無法判斷退戶時間：只留備份
  assert.deepEqual(mergeRestoredPaymentRecords(backup, current, null), backup);
});

test('N1 退戶時間：文件 ID 的實際時間優先，人工修改的退戶日期只作退路', () => {
  const edited = { cancellationDate: new Date('2020-01-01'), _cancellationMeta: { cancellationDate: new Date('2020-01-01') } };
  assert.equal(cancellationEventMillis({ id: 'p1_A1_20260901123045', data: edited }), Date.UTC(2026, 8, 1, 12, 30, 45));
  assert.equal(cancellationEventMillis({ id: 'old', data: edited }), Date.UTC(2020, 0, 1));
  assert.equal(cancellationEventMillis({ id: 'old', data: { cancellationDate: '2026-03-01T00:00:00Z' } }), Date.UTC(2026, 2, 1));
  assert.equal(cancellationEventMillis({ id: 'old', data: { _cancellationMeta: { cancellationDate: { toMillis: () => 123 } } } }), 123);
  assert.equal(cancellationEventMillis({ id: 'old', data: {} }), null);
  assert.equal(cancellationEventMillis({ id: 'old' }), null);

  assert.equal(latestCancellationMillis([
    { id: 'p1_A1_20260301000000', data: {} },
    { id: 'p1_A1_20260901000000', data: {} },
    { id: 'nothing', data: {} },
  ]), Date.UTC(2026, 8, 1));
  assert.equal(latestCancellationMillis([{ id: 'nothing', data: {} }]), null);
  assert.equal(latestCancellationMillis([]), null);
});

test('N2 紀錄停在 running 且租約過期：回傳 partial 與中斷原因，不寫回；租約未過期仍為 running', async () => {
  const running = (leaseUntil, extra = {}) => ({
    type: 'paymentDue', date: TODAY, status: 'running', leaseUntil, attempts: [], createdAt: NOW, ...extra,
  });
  const path = `projects/${PROJECT}/notificationLogs/`;
  const db = createFakeDb({
    [`${path}expired`]: running(new Date(NOW.getTime() - 1000), { createdAt: new Date(NOW.getTime() + 2) }),
    [`${path}noLease`]: running(null, { createdAt: new Date(NOW.getTime() + 1) }),
    [`${path}active`]: running(new Date(NOW.getTime() + 60000)),
    [`${path}withError`]: running(new Date(NOW.getTime() - 1000), { lastError: '原本的錯誤', createdAt: new Date(NOW.getTime() - 1) }),
  });
  const { logs } = await handleListLogs({ db, projectId: PROJECT, access: manageAccess, now: NOW });
  const byId = Object.fromEntries(logs.map(log => [log.id, log]));
  assert.equal(byId.expired.status, 'partial');
  assert.equal(byId.expired.lastError, RUN_INTERRUPTED_MESSAGE);
  assert.equal(byId.noLease.status, 'partial');
  assert.equal(byId.active.status, 'running');
  assert.equal(byId.active.lastError, null);
  assert.equal(byId.withError.status, 'partial');
  assert.equal(byId.withError.lastError, '原本的錯誤');
  assert.equal(db.store.get(`${path}expired`).status, 'running');
  assert.ok(!('lastError' in db.store.get(`${path}expired`)));
});

test('N3 重試時本輪沒有對象，但上一輪已送出：不算沒有收件人', async () => {
  const db = createFakeDb();
  const deps = makeDeps({
    households: [unit('A1', [plan('a', TODAY)])],
    failWhen: (to, channel) => to.userKey === 'mgr1' && channel === 'line',
  });
  const originalError = console.error;
  console.error = () => {};
  try {
    const first = await runProjectReminder({ db, projectId: PROJECT, projectData: projectData(), now: NOW, deps });
    assert.equal(first.status, 'partial');
    assert.equal(first.noRecipients, false);
    const second = await runProjectReminder({
      db,
      projectId: PROJECT,
      projectData: projectData({ managers: { channels: [] }, salespersons: { channels: [] } }),
      now: new Date(NOW.getTime() + 3600000),
      deps,
    });
    assert.equal(second.status, 'done');
    assert.equal(second.noRecipients, false);
    assert.equal(db.store.get(LOG_PATH).noRecipients, false);
    assert.ok(second.sent > 0);
  } finally {
    console.error = originalError;
  }
});

test('N4 重試時發生例外：保留上一輪的略過紀錄與已送出紀錄', async () => {
  const db = createFakeDb();
  const deps = makeDeps({
    households: [
      unit('A1', [plan('a', TODAY)], { salesperson: ['王銷售'], salespersonUserKey: [] }),
      unit('A2', [plan('b', TODAY)], { salespersonUserKey: ['gone'] }),
    ],
    context: makeContext({
      contacts: new Map([['mgr1', contact('mgr1')], ['gone', contact('gone')]]),
      permissions: new Map([['gone', []]]),
    }),
    failWhen: (to, channel) => to.userKey === 'mgr1' && channel === 'line',
  });
  const originalError = console.error;
  console.error = () => {};
  try {
    await runProjectReminder({ db, projectId: PROJECT, projectData: projectData(), now: NOW, deps });
    const before = db.store.get(LOG_PATH).attempts.map(a => `${a.userKey || a.unitId}:${a.channel}:${a.status}:${a.error}`).sort();
    assert.ok(before.includes('A1:null:skipped:no-user-key'));
    assert.ok(before.includes('gone:null:skipped:no-permission'));

    const later = new Date(NOW.getTime() + 3600000);
    deps.loadHouseholds = async () => { throw new Error('DEADLINE_EXCEEDED'); };
    const failedRun = await runProjectReminder({ db, projectId: PROJECT, projectData: projectData(), now: later, deps });
    assert.equal(failedRun.status, 'partial');
    assert.equal(failedRun.skipped, 2);
    assert.ok(failedRun.sent > 0);
    const log = db.store.get(LOG_PATH);
    assert.deepEqual(log.attempts.map(a => `${a.userKey || a.unitId}:${a.channel}:${a.status}:${a.error}`).sort(), before);
    assert.equal(log.skipped, 2);

    // 讀收件人時失敗也一樣
    deps.loadHouseholds = async () => [unit('A1', [plan('a', TODAY)], { salesperson: ['王銷售'], salespersonUserKey: [] })];
    deps.loadRecipientContext = async () => { throw new Error('context failed'); };
    await runProjectReminder({ db, projectId: PROJECT, projectData: projectData(), now: later, deps });
    assert.equal(db.store.get(LOG_PATH).skipped, 2);
  } finally {
    console.error = originalError;
  }
});

test('N4 當天項目都已繳：舊的略過紀錄不再保留', async () => {
  const db = createFakeDb();
  const deps = makeDeps({ households: [unit('A1', [plan('a', TODAY)], { salesperson: ['王銷售'], salespersonUserKey: [] })], failWhen: () => true });
  const originalError = console.error;
  console.error = () => {};
  try {
    const first = await runProjectReminder({ db, projectId: PROJECT, projectData: projectData(), now: NOW, deps });
    assert.equal(first.status, 'partial');
    deps.loadHouseholds = async () => [];
    const second = await runProjectReminder({ db, projectId: PROJECT, projectData: projectData(), now: new Date(NOW.getTime() + 3600000), deps });
    assert.equal(second.status, 'done');
    assert.ok(!db.store.get(LOG_PATH).attempts.some(a => a.error === 'no-user-key'));
  } finally {
    console.error = originalError;
  }
});

test('M4 正式路徑 createDigestSender：排程帶重試金鑰到 LINE 標頭，測試通知不帶', async () => {
  const originalPost = axios.post;
  const originalToken = process.env.ANXISMART_LINE_CRM_TOKEN;
  process.env.ANXISMART_LINE_CRM_TOKEN = 'offline-token';
  const calls = [];
  axios.post = async (url, body, config) => {
    calls.push({ url, to: body.to, headers: config.headers });
    return { status: 200 };
  };
  try {
    const db = createFakeDb();
    const deps = {
      ...makeDeps({
        households: [unit('A1', [plan('a', TODAY)])],
        context: makeContext({ managerKeys: new Set(), contacts: new Map([['sales1', contact('sales1')]]) }),
      }),
      createSender: createDigestSender,
    };
    const result = await runProjectReminder({ db, projectId: PROJECT, projectData: projectData(), now: NOW, deps });
    assert.equal(result.status, 'done');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].to, 'Usales1');
    assert.equal(calls[0].headers.Authorization, 'Bearer offline-token');
    assert.equal(calls[0].headers['X-Line-Retry-Key'], lineRetryKey(`${PROJECT}:paymentDue_20261217:sales1`));

    calls.length = 0;
    const testResult = await handleSendTest({
      db, projectId: PROJECT, projectName: 'x', access: manageAccess, channels: ['line'], now: NOW, deps,
    });
    assert.deepEqual(testResult.attempts, [{ channel: 'line', status: 'sent' }]);
    assert.equal(calls.length, 1);
    assert.ok(!('X-Line-Retry-Key' in calls[0].headers));
  } finally {
    axios.post = originalPost;
    if (originalToken === undefined) delete process.env.ANXISMART_LINE_CRM_TOKEN;
    else process.env.ANXISMART_LINE_CRM_TOKEN = originalToken;
  }
});

test('M4 loadHouseholds：只讀該建案的戶別，缺 unitId 時由文件 ID 補回', async () => {
  const db = createFakeDb({
    'salesHouseholds/p1_A1': { projectId: 'p1', unitId: 'A1' },
    'salesHouseholds/p1_B2': { projectId: 'p1' },
    'salesHouseholds/p2_Z9': { projectId: 'p2', unitId: 'Z9' },
    'salesHouseholds/p11_C3': { projectId: 'p11', unitId: 'C3' },
  });
  const households = await loadHouseholds(db, 'p1');
  assert.deepEqual(households.map(h => h.unitId).sort(), ['A1', 'B2']);
  assert.ok(households.every(h => h.projectId === 'p1'));
});

test('M4 排程：單一建案取得租約失敗，其他建案照常發送', async () => {
  const households = [unit('A1', [plan('a', TODAY)])];
  const db = createFakeDb({
    'projects/broken': projectData({ sendHour: 9 }),
    'projects/on': projectData({ sendHour: 9 }),
  });
  const realTransaction = db.runTransaction;
  db.runTransaction = fn => realTransaction(tx => fn({
    ...tx,
    get: (ref) => {
      if (ref.path.startsWith('projects/broken/')) throw new Error('lease failed');
      return tx.get(ref);
    },
  }));
  const deps = makeDeps({ households });
  const originalError = console.error;
  console.error = () => {};
  try {
    const results = await runScheduledReminders({ db, now: NOW, deps });
    assert.deepEqual(results.map(r => [r.projectId, r.status]), [['on', 'done']]);
    assert.ok(deps.sent.length > 0);
    assert.ok(db.store.has('projects/on/notificationLogs/paymentDue_20261217'));
    assert.ok(!db.store.has('projects/broken/notificationLogs/paymentDue_20261217'));
  } finally {
    console.error = originalError;
  }
});

test('Sheet 略過判定：只有批次標記為新值且只改繳款紀錄時才略過', () => {
  const field = SHEET_SYNC_SKIP_FIELD;
  const when = new Date('2026-12-17T01:00:00Z');
  const marker = newSheetSyncBatchId(when);
  const later = newSheetSyncBatchId(new Date(when.getTime() + 1000));
  assert.match(marker, /^batch_\d{13}_[a-z0-9]+$/);
  assert.ok(later > marker);

  const before = { unitId: 'A1', buyerName: '王', paymentRecords: [{ id: 'a' }], updatedAt: 1 };
  const records = [{ id: 'a' }, { id: 'b' }];
  // 批次寫入
  assert.equal(shouldSkipSheetSync(before, { ...before, paymentRecords: records, [field]: marker }), true);
  assert.equal(shouldSkipSheetSync(before, { ...before, paymentRecords: records, updatedAt: 2, [field]: marker }), true);
  assert.equal(shouldSkipSheetSync({ ...before, [field]: marker }, { ...before, paymentRecords: records, [field]: later }), true);
  // 一般單筆更新：標記沒變或沒有標記
  assert.equal(shouldSkipSheetSync(before, { ...before, paymentRecords: records }), false);
  assert.equal(shouldSkipSheetSync({ ...before, [field]: marker }, { ...before, paymentRecords: records, [field]: marker }), false);
  // 舊快照把較舊的標記寫回，不算新批次
  assert.equal(shouldSkipSheetSync({ ...before, [field]: later }, { ...before, paymentRecords: records, [field]: marker }), false);
  // 同時改了其他欄位（含新增、刪除欄位）
  assert.equal(shouldSkipSheetSync(before, { ...before, buyerName: '李', [field]: marker }), false);
  assert.equal(shouldSkipSheetSync(before, { ...before, extra: 1, [field]: marker }), false);
  const { buyerName, ...withoutBuyer } = before;
  assert.equal(shouldSkipSheetSync(before, { ...withoutBuyer, [field]: marker }), false);
  // 巢狀欄位內容相同不算變更
  const nested = { ...before, parking: [{ spotId: 'P1' }] };
  assert.equal(shouldSkipSheetSync(nested, { ...nested, parking: [{ spotId: 'P1' }], [field]: marker }), true);
  assert.equal(shouldSkipSheetSync(nested, { ...nested, parking: [{ spotId: 'P2' }], [field]: marker }), false);
  // 新增、刪除文件與不合法的標記
  assert.equal(shouldSkipSheetSync(null, { ...before, [field]: marker }), false);
  assert.equal(shouldSkipSheetSync(undefined, { ...before, [field]: marker }), false);
  assert.equal(shouldSkipSheetSync(before, null), false);
  assert.equal(shouldSkipSheetSync(before, { ...before, [field]: '' }), false);
  assert.equal(shouldSkipSheetSync(before, { ...before, [field]: 123 }), false);
});

test('batchAddPlans Sheet：有設定才寫標記並全量同步一次，傳入正確參數', async () => {
  const seed = {
    [`projects/${PROJECT}`]: { salesSheetId: 'sheet1', salesSheetTabName: 'tab1' },
    'salesHouseholds/p1_A1': { paymentRecords: [] },
    'salesHouseholds/p1_A2': { paymentRecords: [] },
  };
  const params = { projectId: PROJECT, access: manageAccess, expectedDate: '2026-12-20', note: '第3期', now: NOW };
  const calls = [];
  const deps = { syncSalesSheet: async (args) => { calls.push(args); return 2; } };
  const db = createFakeDb(seed);
  const result = await handleBatchAddPlans({ ...params, db, entries: [{ unitId: 'A1' }, { unitId: 'A2' }], deps });
  assert.deepEqual(result, { status: 'success', added: ['A1', 'A2'], skipped: [], failed: [] });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].projectId, PROJECT);
  assert.equal(calls[0].spreadsheetId, 'sheet1');
  assert.equal(calls[0].sheetName, 'tab1');
  const first = db.store.get('salesHouseholds/p1_A1')[SHEET_SYNC_SKIP_FIELD];
  assert.match(first, /^batch_/);
  assert.equal(db.store.get('salesHouseholds/p1_A2')[SHEET_SYNC_SKIP_FIELD], first);

  // 沒有任何新增：不寫標記、不同步
  calls.length = 0;
  const none = await handleBatchAddPlans({ ...params, db, entries: [{ unitId: 'A1' }, { unitId: 'A9' }], deps });
  assert.deepEqual(none.added, []);
  assert.equal(calls.length, 0);
  assert.equal(db.store.get('salesHouseholds/p1_A1')[SHEET_SYNC_SKIP_FIELD], first);

  // 全部沒設定或只設一半：不寫標記、不同步
  for (const project of [{}, { salesSheetId: 'sheet1' }, { salesSheetTabName: 'tab1' }]) {
    const plainDb = createFakeDb({ ...seed, [`projects/${PROJECT}`]: project });
    await handleBatchAddPlans({ ...params, db: plainDb, entries: [{ unitId: 'A1' }], deps });
    assert.ok(!(SHEET_SYNC_SKIP_FIELD in plainDb.store.get('salesHouseholds/p1_A1')));
    assert.equal(calls.length, 0);
  }
});

test('batchAddPlans Sheet：全量同步失敗不影響批次結果，回傳 sheetSyncWarning', async () => {
  const db = createFakeDb({
    [`projects/${PROJECT}`]: { salesSheetId: 'sheet1', salesSheetTabName: 'tab1' },
    'salesHouseholds/p1_A1': { buyerName: '王小明', buyerPhone: '0912345678', paymentRecords: [] },
  });
  const originalError = console.error;
  console.error = () => {};
  try {
    const result = await handleBatchAddPlans({
      db,
      projectId: PROJECT,
      access: manageAccess,
      expectedDate: '2026-12-20',
      note: '第3期',
      entries: [{ unitId: 'A1' }],
      now: NOW,
      deps: { syncSalesSheet: async () => { throw new Error('quota exceeded'); } },
    });
    assert.equal(result.status, 'success');
    assert.deepEqual(result.added, ['A1']);
    assert.deepEqual(result.failed, []);
    assert.match(result.sheetSyncWarning, /Sheet 同步失敗/);
    assert.match(result.sheetSyncWarning, /quota exceeded/);
    assert.ok(!result.sheetSyncWarning.includes('王小明'));
    assert.equal(db.store.get('salesHouseholds/p1_A1').paymentRecords.length, 1);
  } finally {
    console.error = originalError;
  }
});

test('假 DB 與真 SDK 一樣對 undefined 丟錯、支援 array-contains', async () => {
  const db = createFakeDb({ 'c/1': { list: ['x'] }, 'c/2': { list: ['y'] } });
  await assert.rejects(db.collection('c').doc('3').set({ value: undefined }));
  await assert.rejects(db.collection('c').doc('1').update({ value: undefined }));
  await assert.rejects(db.collection('c').add({ nested: { value: undefined } }));
  const snap = await db.collection('c').where('list', 'array-contains', 'x').get();
  assert.deepEqual(snap.docs.map(d => d.id), ['1']);
});
