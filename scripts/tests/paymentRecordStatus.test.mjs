import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import * as front from '../../src/utils/paymentRecordStatus.js';

const back = createRequire(import.meta.url)('../../functions/utils/paymentRecordStatus.js');

const plan = (expectedDate, extra = {}) => ({ id: 'p', expectedDate, expectedAmount: 300000, date: '', amount: null, ...extra });
const paid = (date, amount = 300000, extra = {}) => ({ id: 'd', date, amount, ...extra });

test('舊資料（沒有預計日）一律算已繳區，金額照舊加總', () => {
  const { planned, paid: paidList } = front.splitPaymentRecords([paid('2026-01-01'), { id: 'x', date: '2026-02-01', amount: null }]);
  assert.equal(planned.length, 0);
  assert.equal(paidList.length, 2);
  assert.equal(front.summarizePaymentRecords(paidList).paidYuan, 300000);
});

test('預計紀錄不計入已繳，轉已繳後才計入', () => {
  const planned = plan('2026-12-20');
  const summary = front.summarizePaymentRecords([planned, paid('2026-01-01', 100000)], '2026-12-17');
  assert.equal(summary.paidYuan, 100000);
  assert.equal(summary.pendingYuan, 300000);
  assert.equal(summary.next.label, '剩 3 天');

  const converted = { ...planned, date: '2026-12-18', amount: 250000 };
  assert.equal(front.isPaidRecord(converted), true);
  assert.equal(front.isPlannedRecord(converted), false);
  assert.equal(front.summarizePaymentRecords([converted]).paidYuan, 250000);
});

test('只有 amount 的紀錄缺繳款日時，有預計日仍視為預計', () => {
  assert.equal(front.isPlannedRecord(plan('2026-12-20', { amount: 100 })), true);
});

test('到期狀態文字與分級', () => {
  const state = (date) => front.recordDueState(plan(date), '2026-12-17');
  assert.deepEqual(state('2026-12-16'), { state: 'overdue', daysLeft: -1, label: '逾期 1 天' });
  assert.deepEqual(state('2026-12-17'), { state: 'today', daysLeft: 0, label: '今天到期' });
  assert.deepEqual(state('2026-12-24'), { state: 'soon', daysLeft: 7, label: '剩 7 天' });
  assert.deepEqual(state('2026-12-25'), { state: 'upcoming', daysLeft: 8, label: '剩 8 天' });
  assert.equal(front.recordDueState(paid('2026-12-01'), '2026-12-17').state, 'paid');
});

test('台北時區跨日邊界', () => {
  assert.equal(front.taipeiToday(new Date('2026-12-16T15:59:00Z')), '2026-12-16');
  assert.equal(front.taipeiToday(new Date('2026-12-16T16:00:00Z')), '2026-12-17');
});

test('遲繳／提前附註，同日不顯示', () => {
  assert.equal(front.paidTimingNote(paid('2026-11-18', 1, { expectedDate: '2026-11-15' })), '預計 11/15・遲 3 天');
  assert.equal(front.paidTimingNote(paid('2026-11-13', 1, { expectedDate: '2026-11-15' })), '預計 11/15・提前 2 天');
  assert.equal(front.paidTimingNote(paid('2026-11-15', 1, { expectedDate: '2026-11-15' })), '');
  assert.equal(front.paidTimingNote(paid('2026-11-15')), '');
});

test('差額與尾款備註', () => {
  assert.equal(front.paymentBalance({ expectedAmount: 300000 }, 200000), 100000);
  assert.equal(front.paymentBalance({ expectedAmount: 300000 }, 300000), 0);
  assert.equal(front.paymentBalance({ expectedAmount: 300000 }, 400000), 0);
  assert.equal(front.paymentBalance({ expectedAmount: null }, 200000), 0);
  assert.equal(front.balanceNote('第3期'), '第3期 尾款');
  assert.equal(front.balanceNote('第3期 尾款'), '第3期 尾款');
  assert.equal(front.balanceNote(''), '尾款');
});

test('建案設定正規化：預設值與不合法輸入', () => {
  const defaults = front.normalizePaymentReminderSettings(undefined);
  assert.equal(defaults.enabled, false);
  assert.deepEqual(defaults.offsetDays, [7, 3, 1, 0]);
  assert.equal(defaults.sendHour, 9);
  assert.deepEqual(defaults.overdue, { enabled: true, intervalDays: 3 });
  assert.deepEqual(defaults.managers.channels, ['email', 'line']);
  assert.deepEqual(defaults.salespersons.channels, ['line']);

  const custom = front.normalizePaymentReminderSettings({
    enabled: true,
    offsetDays: [1, 1, 200, -1, 2.5, 3, 14],
    sendHour: 3,
    overdue: { enabled: false, intervalDays: 99 },
    managers: { channels: ['sms', 'line'], excludedUserKeys: ['a', 'a', ''] },
    salespersons: { channels: [] },
  });
  assert.deepEqual(custom.offsetDays, [14, 3, 1]);
  assert.equal(custom.sendHour, 9);
  assert.deepEqual(custom.overdue, { enabled: false, intervalDays: 3 });
  assert.deepEqual(custom.managers, { channels: ['line'], excludedUserKeys: ['a'] });
  assert.deepEqual(custom.salespersons.channels, []);
});

test('提醒判定矩陣', () => {
  const settings = front.normalizePaymentReminderSettings({ offsetDays: [7, 3, 1, 0], overdue: { enabled: true, intervalDays: 3 } });
  const expected = { 8: false, 7: true, 5: false, 3: true, 1: true, 0: true, '-1': false, '-2': false, '-3': true, '-6': true };
  for (const [days, want] of Object.entries(expected)) {
    assert.equal(front.shouldRemind(Number(days), settings), want, `daysLeft=${days}`);
  }
  assert.equal(front.shouldRemind(null, settings), false);
  const noOverdue = front.normalizePaymentReminderSettings({ overdue: { enabled: false } });
  assert.equal(front.shouldRemind(-3, noOverdue), false);
});

test('前後端版本行為一致', () => {
  const records = [plan('2026-12-20'), plan('2026-12-01'), paid('2026-11-18', 200000, { expectedDate: '2026-11-15' }), { id: 'x', date: '', amount: null }];
  assert.deepEqual(back.summarizePaymentRecords(records, '2026-12-17'), front.summarizePaymentRecords(records, '2026-12-17'));
  assert.deepEqual(back.splitPaymentRecords(records), front.splitPaymentRecords(records));
  for (const r of records) {
    assert.deepEqual(back.recordDueState(r, '2026-12-17'), front.recordDueState(r, '2026-12-17'));
    assert.equal(back.paidTimingNote(r), front.paidTimingNote(r));
  }
  const raw = { enabled: true, offsetDays: [5, 2], sendHour: 22, overdue: { intervalDays: 7 }, managers: { channels: ['line'] } };
  assert.deepEqual(back.normalizePaymentReminderSettings(raw), front.normalizePaymentReminderSettings(raw));
  assert.deepEqual(back.normalizePaymentReminderSettings(undefined), front.normalizePaymentReminderSettings(undefined));
  assert.equal(back.shouldRemind(-7, back.normalizePaymentReminderSettings(raw)), front.shouldRemind(-7, front.normalizePaymentReminderSettings(raw)));
});

// 這些函式在 SFC 內沒有匯出：取出真正的函式本體來跑，相依的部分由測試提供
const readSource = file => readFile(new URL(`../../src/${file}`, import.meta.url), 'utf8');
function loadSfcFunction(source, name, deps) {
  const start = source.search(new RegExp(`(async )?function ${name}\\(`));
  assert.ok(start >= 0, name);
  const end = source.indexOf('\n}\n', start);
  // eslint-disable-next-line no-new-func
  return new Function(...Object.keys(deps), `${source.slice(start, end + 2)}\nreturn ${name};`)(...Object.values(deps));
}

const salesInfoForm = readSource('components/SalesInfoForm.vue');
const unitDetailModal = readSource('components/UnitDetailModal.vue');
const batchDialog = readSource('components/payment/PaymentPlanBatchDialog.vue');

async function confirmPrompt(data, prompt) {
  const statusPrompt = { value: { open: true, status: '簽約', field: 'payment_contract_date', date: new Date(2026, 11, 21), amount: 300000, ...prompt } };
  const confirm = loadSfcFunction(await salesInfoForm, 'confirmStatusPrompt', {
    statusPrompt,
    editableData: { value: data },
    toDateOrNull: value => value,
    todayTaipeiDate: () => new Date(2026, 11, 21),
    toYmd: () => '2026-12-21',
  });
  confirm();
  return statusPrompt.value;
}

// 修改銷控真正的儲存前處理；快照為空代表編輯前看不到這筆，只能靠標記判斷
async function prepareForSave(data, snapshot = new Map()) {
  const prepare = loadSfcFunction(await unitDetailModal, 'preparePaymentRecordsForSave', {
    editingData: { value: data },
    paymentRowKind: record => (front.isPaidRecord(record) ? 'paid' : record?._kind || (front.isPlannedRecord(record) ? 'planned' : 'paid')),
    isValidYmd: front.isValidYmd,
    paymentRecordsSnapshot: snapshot,
    props: { unitData: { unitId: 'A1' }, projectId: 'p1' },
    paymentProofApi: async () => { throw new Error('不應呼叫 Drive'); },
    paymentProofFileToBase64: async () => '',
    savingText: { value: '' },
    toast: { warning: () => {} },
    userStore: { user: { name: '王銷控' } },
  });
  await prepare();
}

test('狀態提示比對到預計紀錄：轉已繳時加標記，儲存寫入 paidAt、paidBy，標記不進 Firestore', async () => {
  const data = { paymentRecords: [plan('2026-12-20', { note: '簽約', updatedAt: 'old' }), paid('2026-01-01', 1000, { note: '小訂' })] };
  await confirmPrompt(data, { existingRecordId: 'p', existingPlanned: true });
  const [converted, other] = data.paymentRecords;
  assert.deepEqual([converted.date, converted.amount, converted._markedPaid], ['2026-12-21', 300000, true]);
  assert.ok(!('_markedPaid' in other));

  await prepareForSave(data);
  const [saved, untouched] = data.paymentRecords;
  assert.equal(saved.paidBy, '王銷控');
  assert.ok(saved.paidAt);
  assert.equal(saved.expectedDate, '2026-12-20');
  assert.ok(!('paidAt' in untouched));
  assert.ok(!JSON.stringify(data.paymentRecords).includes('_markedPaid'));
});

test('狀態提示比對到已繳紀錄：不加標記，不改 paidAt、paidBy', async () => {
  const data = { paymentRecords: [paid('2026-01-01', 1000, { note: '簽約' })] };
  await confirmPrompt(data, { existingRecordId: 'd', existingPlanned: false });
  assert.ok(!('_markedPaid' in data.paymentRecords[0]));
  await prepareForSave(data);
  assert.ok(!('paidAt' in data.paymentRecords[0]));
  assert.ok(!('paidBy' in data.paymentRecords[0]));
});

test('狀態提示：沒有比對到紀錄時新增已繳，金額留空不動繳款紀錄', async () => {
  const added = { paymentRecords: [] };
  await confirmPrompt(added, { existingRecordId: '', existingPlanned: false });
  assert.deepEqual([added.paymentRecords.length, added.paymentRecords[0].amount, '_markedPaid' in added.paymentRecords[0]], [1, 300000, false]);

  const blank = { paymentRecords: [plan('2026-12-20', { note: '簽約' })] };
  await confirmPrompt(blank, { amount: null, existingRecordId: 'p', existingPlanned: true });
  assert.deepEqual(blank.paymentRecords, [plan('2026-12-20', { note: '簽約' })]);
});

// 批次新增真正的 submit，只替換 API 與畫面相依
async function submitBatch({ warning = '', responses }) {
  const state = {
    saving: { value: false },
    saveError: { value: '' },
    sheetSyncWarning: { value: warning },
    outcomes: { value: new Map() },
    finished: { value: false },
  };
  const closed = [];
  const queue = [...responses];
  const submit = loadSfcFunction(await batchDialog, 'submit', {
    ...state,
    newRows: { value: [{ unitId: 'A1', expectedAmount: 100 }] },
    API_BATCH_SIZE: 500,
    paymentReminderApi: async () => queue.shift(),
    props: { projectId: 'p1' },
    userStore: { user: { key: 'mgr' } },
    content: { expectedDate: '2027-01-15', note: '第4期' },
    emit: () => {},
    addedCount: { value: 0 },
    existingCount: { value: 0 },
    toast: { success: () => {}, warning: () => {} },
    reviewRows: { value: [] },
    close: () => closed.push(true),
  });
  await submit();
  return { warning: state.sheetSyncWarning.value, finished: state.finished.value, closed: closed.length > 0, error: state.saveError.value };
}

test('批次重送：這次沒有新增就不會同步，上次的同步提醒要留著，不關閉', async () => {
  const result = await submitBatch({ warning: '同步失敗 A', responses: [{ status: 'success', added: [], skipped: [{ unitId: 'A1', reason: 'exists' }], failed: [] }] });
  assert.deepEqual(result, { warning: '同步失敗 A', finished: true, closed: false, error: '' });
});

test('批次重送：這次有新增且沒有新提醒才清除；有新提醒就換成新的', async () => {
  const cleared = await submitBatch({ warning: '同步失敗 A', responses: [{ status: 'success', added: ['A1'], skipped: [], failed: [] }] });
  assert.deepEqual([cleared.warning, cleared.closed], ['', true]);

  const replaced = await submitBatch({ warning: '同步失敗 A', responses: [{ status: 'success', added: ['A1'], skipped: [], failed: [], sheetSyncWarning: '同步失敗 B' }] });
  assert.deepEqual([replaced.warning, replaced.finished, replaced.closed], ['同步失敗 B', true, false]);
});

test('批次重送：請求失敗或全部失敗時提醒也留著', async () => {
  const requestFailed = await submitBatch({ warning: '同步失敗 A', responses: [{ status: 'error', message: '逾時' }] });
  assert.equal(requestFailed.warning, '同步失敗 A');
  assert.match(requestFailed.error, /逾時/);

  const allFailed = await submitBatch({ warning: '同步失敗 A', responses: [{ status: 'success', added: [], skipped: [], failed: [{ unitId: 'A1', reason: 'x' }] }] });
  assert.equal(allFailed.warning, '同步失敗 A');
  assert.match(allFailed.error, /1 戶失敗/);
});
