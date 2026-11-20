import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDateIso, formatDateSlash, parseDateInput, toDateOrNull } from '../../src/utils/dateInput.js';

const ymd = (d) => (d instanceof Date ? formatDateIso(d) : d);

test('各種寫法都能解析成同一天', () => {
  for (const s of ['2026/11/20', '2026-11-20', '2026.11.20', '2026/11/20 ', '2026年11月20日', '20261120', '115/11/20', '1151120', '115-11-20']) {
    assert.equal(ymd(parseDateInput(s)), '2026-11-20', s);
  }
  assert.equal(ymd(parseDateInput('2026/1/5')), '2026-01-05');
});

test('空白＝清除，無法辨識或不存在的日期回 undefined', () => {
  assert.equal(parseDateInput(''), null);
  assert.equal(parseDateInput('  '), null);
  assert.equal(parseDateInput(null), null);
  for (const s of ['2026', '2026/11', '0020/11/18', '2026/02/30', '2026/13/01', 'abc', '2026/11/20/1']) {
    assert.equal(parseDateInput(s), undefined, s);
  }
});

test('解析結果為當地午夜', () => {
  const d = parseDateInput('2026/11/20');
  assert.deepEqual([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()], [2026, 10, 20, 0, 0]);
});

test('Date、Timestamp、字串都能顯示', () => {
  const d = new Date(2026, 10, 20);
  assert.equal(formatDateSlash(d), '2026/11/20');
  assert.equal(formatDateSlash({ toDate: () => d }), '2026/11/20');
  assert.equal(formatDateSlash({ seconds: d.getTime() / 1000 }), '2026/11/20');
  assert.equal(formatDateSlash('2026-11-20'), '2026/11/20');
  assert.equal(formatDateIso('2026-11-20'), '2026-11-20');
  assert.equal(formatDateSlash(null), '');
  assert.equal(formatDateSlash('壞資料'), '');
  assert.equal(toDateOrNull(''), null);
});
