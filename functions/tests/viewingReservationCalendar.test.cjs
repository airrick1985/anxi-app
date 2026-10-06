const test = require('node:test');
const assert = require('node:assert/strict');
const { buildEvent, buildIcs, googleCalendarUrl, foldLine } = require('../viewingReservationCalendar');

const reservation = {
  customerName: '王小明', customerPhone: '0912345678', type: '簽約', unitId: 'A3-5F',
  salesName: '李小姐', note: '帶家人, 需停車;兩台',
  reservationTime: { toDate: () => new Date('2026-10-12T06:00:00Z') },
};

test('事件標題、內容與一小時時長', () => {
  const event = buildEvent(reservation, '森之樹');
  assert.equal(event.title, '【森之樹】王小明 簽約');
  assert.equal(event.description, '電話：0912345678\n建案：森之樹\n負責銷售：李小姐\n戶別：A3-5F\n備註：帶家人, 需停車;兩台');
  assert.equal(event.end - event.start, 60 * 60 * 1000);
  assert.equal(buildEvent({ ...reservation, unitId: '', note: '', salesName: '' }, '森之樹').description,
    '電話：0912345678\n建案：森之樹\n負責銷售：不指定');
  assert.equal(buildEvent({ ...reservation, reservationTime: null }, '森之樹'), null);
});

test('ICS 跳脫、提醒與 75 位元組折行', () => {
  const ics = buildIcs('abc123XYZ0', buildEvent(reservation, '森之樹'), { now: new Date('2026-10-01T00:00:00Z'), sequence: 5 });
  const lines = ics.split('\r\n');
  assert.ok(lines.every(line => Buffer.byteLength(line) <= 75));
  const unfolded = ics.replace(/\r\n /g, '');
  assert.match(unfolded, /DTSTART:20261012T060000Z\r\nDTEND:20261012T070000Z/);
  assert.match(unfolded, /DESCRIPTION:電話：0912345678\\n.*備註：帶家人\\, 需停車\\;兩台/);
  assert.match(unfolded, /UID:abc123XYZ0@/);
  assert.match(unfolded, /SEQUENCE:5/);
  assert.match(unfolded, /TRIGGER:-P1D/);
  assert.match(unfolded, /TRIGGER:-PT1H/);
  assert.equal(foldLine('中'.repeat(40)).replace(/\r\n /g, ''), '中'.repeat(40));
});

test('Google 日曆連結', () => {
  const url = new URL(googleCalendarUrl(buildEvent(reservation, '森之樹')));
  assert.equal(url.searchParams.get('text'), '【森之樹】王小明 簽約');
  assert.equal(url.searchParams.get('dates'), '20261012T060000Z/20261012T070000Z');
  assert.match(url.searchParams.get('details'), /戶別：A3-5F/);
});
