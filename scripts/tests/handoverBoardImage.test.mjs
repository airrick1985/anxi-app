import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHandoverBoard } from '../../src/utils/handoverBoard.js';
import { buildHandoverImage, handoverImageFileName } from '../../src/utils/handoverBoardImage.js';

const TODAY = new Date('2026-11-10T10:00:00+08:00');
const menu = { bookingMenu: [{ title: '初驗' }, { title: '交屋' }] };
const h = (unitId, building, extra = {}) => ({ unitId, building, buyerName: '王', _bookingInfo: {}, ...extra });
const booked = (date) => ({ all: [{ status: '預約中', date: new Date(`${date}T00:00:00+08:00`), appointmentId: 'x' }] });

test('圖片包含完整矩陣、店面、統計與圖例戶數', () => {
  const board = buildHandoverBoard([
    h('A1-03', 'A1', { _bookingInfo: { 交屋: booked('2026-11-20') } }),
    h('A2-03', 'A2', { buyerName: '' }),
    h('B1-04', 'B1'),
    h('S-01', 'S'),
  ], menu, TODAY);
  const { html, css, width } = buildHandoverImage(board, { projectName: '測試建案', updatedAt: TODAY });
  assert.match(html, /測試建案/);
  assert.match(html, /交屋控管表/);
  assert.equal((html.match(/class="hi-c[ "]/g) || []).length, 4); // 3 格＋1 店面
  assert.match(html, /已約交屋<small>11\/20<\/small>/);
  assert.match(html, /A 棟/);
  assert.match(html, /hi-special-label">店面/);
  assert.match(html, /總覽/);
  assert.match(html, /交屋戶數/);
  assert.match(css, /\.hi-c\{/);
  assert.ok(width >= 760);
});

test('篩選：不符合的格子淡化、標題列顯示條件、圖例其他狀態淡化', () => {
  const board = buildHandoverBoard([h('A1-03', 'A1'), h('A1-04', 'A1', { buyerName: '' })], menu, TODAY);
  const { html } = buildHandoverImage(board, {
    projectName: 'X', isMatch: (u) => u.status === 'unsold', filterText: '篩選：未售', activeStatuses: ['unsold'],
  });
  assert.equal((html.match(/hi-c dim/g) || []).length, 1);
  assert.match(html, /hi-filter">篩選：未售/);
  assert.ok((html.match(/hi-chip off/g) || []).length >= 1);
});

test('使用者資料會被跳脫，不會破壞版面', () => {
  const board = buildHandoverBoard([h('A<1>-03', 'A<1>')], menu, TODAY);
  const { html } = buildHandoverImage(board, { projectName: '建案 <b>&"' });
  assert.ok(!html.includes('<b>&"'));
  assert.match(html, /建案 &lt;b&gt;&amp;&quot;/);
  assert.match(html, /A&lt;1&gt;/);
});

test('欄數多時圖片加寬', () => {
  const many = Array.from({ length: 21 }, (_, i) => h(`A${i + 1}-03`, `A${i + 1}`));
  const few = buildHandoverImage(buildHandoverBoard([h('A1-03', 'A1')], menu, TODAY), {}).width;
  const wide = buildHandoverImage(buildHandoverBoard(many, menu, TODAY), {}).width;
  assert.ok(wide > few + 1000, `${few} → ${wide}`);
});

test('檔名', () => {
  assert.equal(handoverImageFileName('富宇天雋', new Date(2026, 10, 10)), '富宇天雋_交屋控管表_2026-11-10.png');
});
