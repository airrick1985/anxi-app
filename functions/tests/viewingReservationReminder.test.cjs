const test = require('node:test');
const assert = require('node:assert/strict');
const {
  pendingReminders, nextReminderAt, currentSentKeys, normalizeOffsets, formatOffset, buildReminderMessage, syncReminderSchedule, reservationActionFooter,
} = require('../viewingReservationReminder');

const MIN = 60 * 1000;
const time = Date.parse('2026-10-15T06:00:00Z'); // 台北 14:00
const ts = ms => ({ toMillis: () => ms, toDate: () => new Date(ms) });
const reservation = (overrides = {}) => ({
  status: 'active',
  reservationTime: ts(time),
  lineReminder: { enabled: true, offsets: [60, 1440] },
  customerName: '王小明', customerPhone: '0912345678', type: '新客',
  ...overrides,
});

test('提前分鐘數：去重、由遠到近、最多 3 個、排除不合法值', () => {
  assert.deepEqual(normalizeOffsets([15, 60, 60, 1440, 30, -5, 1.5, 'x']), [1440, 60, 30]);
  assert.deepEqual(normalizeOffsets(null), []);
  assert.deepEqual(normalizeOffsets([60 * 24 * 31]), []);
});

test('下次提醒時間：取最早未發送的時間點', () => {
  assert.equal(nextReminderAt(reservation(), time - 2 * 24 * 60 * MIN).getTime(), time - 1440 * MIN);
  assert.equal(nextReminderAt(reservation(), time - 120 * MIN).getTime(), time - 60 * MIN);
  const sent = reservation({ lineReminderSent: [`1440@${time}`] });
  assert.equal(nextReminderAt(sent, time - 2 * 24 * 60 * MIN).getTime(), time - 60 * MIN);
});

test('關閉、取消、已過預約時間、超過補發期限都不提醒', () => {
  const now = time - 120 * MIN;
  assert.equal(nextReminderAt(reservation({ lineReminder: { enabled: false, offsets: [60] } }), now), null);
  assert.equal(nextReminderAt(reservation({ status: 'deleted' }), now), null);
  assert.equal(nextReminderAt(reservation(), time + MIN), null);
  assert.equal(nextReminderAt(reservation({ lineReminder: undefined }), now), null);
  // 1 天前的時間點已過 20 分鐘（超過 15 分鐘補發期限），只剩 1 小時前
  assert.deepEqual(pendingReminders(reservation(), time - 1420 * MIN).map(r => r.offset), [60]);
  // 剛過 5 分鐘仍會補發
  assert.deepEqual(pendingReminders(reservation(), time - 55 * MIN).map(r => r.offset), [60]);
});

test('改預約時間後舊發送紀錄失效', () => {
  const moved = time + 60 * MIN;
  const data = reservation({ reservationTime: ts(moved), lineReminderSent: [`60@${time}`, `1440@${moved}`] });
  assert.deepEqual(currentSentKeys(data), [`1440@${moved}`]);
  assert.equal(nextReminderAt(data, time - 120 * MIN).getTime(), moved - 60 * MIN);
});

// 模擬 Firestore：交易內讀到的是 stored（可能比觸發器快照新）
const fakeRef = (stored) => {
  const writes = [];
  const ref = {
    writes,
    firestore: {
      runTransaction: async fn => fn({ get: async () => ({ data: () => stored }), update: (_, payload) => writes.push(payload) }),
    },
  };
  return ref;
};

test('重算結果與現值相同時不寫入', async () => {
  const now = time - 120 * MIN;
  const legacy = fakeRef(reservation({ lineReminder: undefined }));
  await syncReminderSchedule(legacy, reservation({ lineReminder: undefined }), now);
  assert.equal(legacy.writes.length, 0);

  const fresh = fakeRef(reservation());
  await syncReminderSchedule(fresh, reservation(), now);
  assert.equal(fresh.writes.length, 1);
  assert.equal(fresh.writes[0].lineReminderNextAt.getTime(), time - 60 * MIN);

  const synced = reservation({ lineReminderNextAt: ts(time - 60 * MIN), lineReminderSent: [] });
  const unchanged = fakeRef(synced);
  await syncReminderSchedule(unchanged, synced, now);
  assert.equal(unchanged.writes.length, 0);
});

test('觸發器快照較舊時，以交易內最新資料為準、保留發送紀錄', async () => {
  const now = time - 30 * MIN;
  const stale = reservation({ lineReminderNextAt: ts(time - 60 * MIN), lineReminderSent: [] });
  // 排程已發送 1 小時前提醒並清空下次時間
  const latest = reservation({ lineReminderNextAt: null, lineReminderSent: [`60@${time}`] });
  const ref = fakeRef(latest);
  await syncReminderSchedule(ref, stale, now);
  assert.equal(ref.writes.length, 0);
});

test('提醒訊息標題與內容', () => {
  assert.equal(formatOffset(1440), '1 天');
  assert.equal(formatOffset(180), '3 小時');
  assert.equal(formatOffset(90), '90 分鐘');
  const data = reservation({ projectId: 'p1', salesName: '陳大文', unitId: 'A3-5F', note: '帶家人' });
  const message = buildReminderMessage('abc123XYZ0', data, '森之樹', 60);
  assert.equal(message.altText, '⏰ 預約提醒｜1 小時後｜王小明');
  const rows = message.contents.body.contents[2].contents;
  assert.deepEqual(rows.map(row => row.contents[0].text), ['建案', '時間', '客戶', '電話', '銷售', '戶別', '備註']);
  assert.match(rows[1].contents[1].text, /14:00/);
  assert.equal(rows[4].contents[1].text, '陳大文');
  const unassigned = buildReminderMessage('abc123XYZ0', reservation({ salesName: '' }), '森之樹', 60);
  assert.equal(unassigned.contents.body.contents[2].contents[4].contents[1].text, '不指定');
});

test('取消預約／查看預約按鈕開啟該筆預約', () => {
  const [cancel, view] = reservationActionFooter('abc123XYZ0', 'p1').contents;
  assert.equal(cancel.action.label, '取消預約');
  assert.equal(cancel.action.uri, 'https://liff.line.me/2008257338-FCbKJ8bB?reservationId=abc123XYZ0&projectId=p1&action=cancel');
  assert.equal(view.action.label, '查看預約');
  assert.equal(view.action.uri, 'https://liff.line.me/2008257338-FCbKJ8bB?reservationId=abc123XYZ0&projectId=p1');
});
