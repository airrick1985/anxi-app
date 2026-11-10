import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildHandoverBoard, defaultStageTitles, deriveStatus, parseUnitPosition, resolveStages,
  stageProgress, textColorFor, resolveStatusColors, normalizeHex, extraStatOptions,
} from '../../src/utils/handoverBoard.js';

const TODAY = new Date('2026-11-10T10:00:00+08:00');
const day = (s) => new Date(`${s}T00:00:00+08:00`);
const menu = (...titles) => ({ bookingMenu: titles.map(title => ({ title })) });
const bk = (status, date) => ({ status, date: date ? day(date) : null, appointmentId: Math.random().toString(36) });
const house = (unitId, building, extra = {}) => ({ _docId: unitId, unitId, building, buyerName: '王', _bookingInfo: {}, ...extra });
const info = (map) => Object.fromEntries(Object.entries(map).map(([type, list]) => [type, { all: list }]));

test('戶號解析：棟線-樓層、樓層F-棟線、店面、無法解析', () => {
  assert.deepEqual(parseUnitPosition({ unitId: 'A1-03', building: 'A1' }), { type: 'grid', col: 'A1', floor: 3 });
  assert.deepEqual(parseUnitPosition({ unitId: 'A01-12', building: 'A1' }), { type: 'grid', col: 'A1', floor: 12 });
  assert.deepEqual(parseUnitPosition({ unitId: '2F-A3', building: 'A3' }), { type: 'grid', col: 'A3', floor: 2 });
  assert.deepEqual(parseUnitPosition({ unitId: 'A1-2F', building: '' }), { type: 'grid', col: 'A1', floor: 2 });
  assert.deepEqual(parseUnitPosition({ unitId: 'S-01', building: 'S' }), { type: 'special', group: 'shop' });
  assert.deepEqual(parseUnitPosition({ unitId: 'S-1', building: 'S1' }), { type: 'special', group: 'shop' });
  assert.deepEqual(parseUnitPosition({ unitId: '店面', building: '' }), { type: 'special', group: 'other' });
  assert.deepEqual(parseUnitPosition({ unitId: 'A棟', building: 'A', 樓層: '5' }), { type: 'grid', col: 'A', floor: 5 });
});

test('預設進度項目：只取含驗／交屋，依 初驗→複驗→交屋 排序', () => {
  assert.deepEqual(defaultStageTitles(['對保', '自覓銀行', '交屋', '複驗', '初驗']), ['初驗', '複驗', '交屋']);
  assert.deepEqual(defaultStageTitles(['對保(填寫產權人資料)', '初驗(A棟)', '初驗(B棟)']), ['初驗(A棟)', '初驗(B棟)']);
  assert.deepEqual(defaultStageTitles(['對保']), ['對保']);
});

test('沒有交屋預約項目時補虛擬交屋項目；設定的進度項目只保留仍存在的', () => {
  const stages = resolveStages(menu('初驗', '複驗'), {});
  assert.deepEqual(stages.map(s => [s.key, s.virtual]), [['初驗', false], ['複驗', false], ['交屋', true]]);
  const custom = resolveStages(menu('對保', '初驗', '交屋'), { stages: ['對保', '已刪除項目', '交屋'] });
  assert.deepEqual(custom.map(s => s.key), ['對保', '交屋']);
});

test('狀態推導：未售、未驗、已約、已完成、交屋開關、過期未改狀態的預約', () => {
  const stages = resolveStages(menu('對保', '初驗', '複驗', '交屋'), {});
  const status = (h) => deriveStatus(h, stages, stageProgress(h, stages, TODAY));
  assert.equal(status(house('A1-02', 'A1', { buyerName: '' })), 'unsold');
  assert.equal(status(house('A1-03', 'A1')), 'pending');
  // 只有對保（不列入進度）仍算已售未驗
  assert.equal(status(house('A1-04', 'A1', { buyerName: '', _bookingInfo: info({ 對保: [bk('已完成', '2026-09-01')] }) })), 'pending');
  assert.equal(status(house('A1-05', 'A1', { _bookingInfo: info({ 初驗: [bk('預約中', '2026-11-20')] }) })), 'booked:初驗');
  assert.equal(status(house('A1-06', 'A1', { _bookingInfo: info({ 初驗: [bk('已完成', '2026-10-01')] }) })), 'done:初驗');
  // 日期已過但仍是預約中（排程漏跑）視為完成
  assert.equal(status(house('A1-07', 'A1', { _bookingInfo: info({ 初驗: [bk('預約中', '2026-11-01')] }) })), 'done:初驗');
  // 今天的預約仍是已約
  assert.equal(status(house('A1-08', 'A1', { _bookingInfo: info({ 初驗: [bk('預約中', '2026-11-10')] }) })), 'booked:初驗');
  // 取最遠進度
  assert.equal(status(house('A1-09', 'A1', { _bookingInfo: info({ 初驗: [bk('已完成', '2026-10-01')], 交屋: [bk('預約中', '2026-12-01')] }) })), 'booked:交屋');
  // 同項目完成後又再約：以已約為準
  assert.equal(status(house('A1-10', 'A1', { _bookingInfo: info({ 初驗: [bk('已完成', '2026-10-01'), bk('預約中', '2026-11-30')] }) })), 'booked:初驗');
  // 交屋開關優先
  assert.equal(status(house('A1-11', 'A1', { 交屋: true, _bookingInfo: info({ 初驗: [bk('預約中', '2026-11-30')] }) })), 'done:交屋');
});

test('交屋開關對應虛擬交屋項目', () => {
  const stages = resolveStages(menu('初驗'), {});
  const h = house('A1-03', 'A1', { 交屋: true });
  assert.equal(deriveStatus(h, stages, stageProgress(h, stages, TODAY)), 'done:交屋');
});

test('控管表模型：矩陣、棟分組、店面列、統計', () => {
  const households = [
    house('A1-03', 'A1', { _bookingInfo: info({ 初驗: [bk('已完成', '2026-10-01')] }) }),
    house('A1-04', 'A1', { buyerName: '' }),
    house('A2-03', 'A2', { 交屋: true, appropriationDate: day('2026-10-05') }),
    house('A2-04', 'A2', { _bookingInfo: info({ 初驗: [bk('已完成', '2026-10-01')], 交屋: [bk('預約中', '2026-11-25')] }) }),
    house('B10-03', 'B10'),
    house('B2-03', 'B2', { _bookingInfo: info({ 初驗: [bk('預約中', '2026-11-12')] }) }),
    house('S-01', 'S', { buyerName: '' }),
    house('S-02', 'S'),
  ];
  const board = buildHandoverBoard(households, menu('對保', '初驗', '複驗', '交屋'), TODAY);
  assert.deepEqual(board.cols, ['A1', 'A2', 'B2', 'B10']);
  assert.deepEqual(board.floors, [4, 3]);
  assert.deepEqual(board.towers.map(t => [t.name, t.cols]), [['A', ['A1', 'A2']], ['B', ['B2', 'B10']]]);
  assert.equal(board.showTowerHeader, true);
  assert.equal(board.cellMap['3|A1'].status, 'done:初驗');
  assert.equal(board.cellMap['4|A2'].status, 'booked:交屋');
  assert.equal(board.cellMap['4|A2'].nextDate.getDate(), 25);
  assert.equal(board.specialLabel, '店面');
  assert.deepEqual(board.specialUnits.map(u => u.unitId), ['S-01', 'S-02']);

  const s = board.stats;
  assert.equal(s.total, 8);
  assert.equal(s.sold, 6);
  assert.equal(s.unsold, 2);
  assert.equal(s.pending, 2); // B10-03、S-02
  assert.equal(s.inspected, 2); // A1-03、A2-04 已完成初驗
  assert.equal(s.handedOver, 1); // A2-03 交屋開關
  const byKey = Object.fromEntries(s.stageStats.map(x => [x.key, x]));
  assert.equal(byKey['初驗'].done, 2);
  assert.equal(byKey['初驗'].booked, 1);
  assert.equal(byKey['交屋'].done, 1);
  assert.equal(byKey['交屋'].booked, 1);
  assert.deepEqual(s.extra, [{ key: 'appropriationDate', label: '已撥款', count: 1 }]);
  assert.equal(s.statusCounts.unsold, 2);
  assert.equal(Object.values(s.statusCounts).reduce((a, b) => a + b, 0), 8);
});

test('只有單一棟時不顯示棟名表頭；同格重複的戶別移到其他', () => {
  const board = buildHandoverBoard([house('A1-03', 'A1'), house('A2-03', 'A2'), house('A1-3F', 'A1')], menu('初驗'), TODAY);
  assert.equal(board.showTowerHeader, false);
  assert.equal(board.specialLabel, '其他');
  assert.deepEqual(board.specialUnits.map(u => u.unitId), ['A1-3F']);
});

test('顏色：自訂色覆蓋預設、非法值忽略、文字顏色依亮度', () => {
  const stages = resolveStages(menu('初驗', '交屋'), {});
  const colors = resolveStatusColors(stages, { colors: { unsold: '#123456', pending: 'red', 'done:交屋': '#abc' } });
  assert.equal(colors.unsold, '#123456');
  assert.equal(colors.pending, '#FFF1D2');
  assert.equal(colors['done:交屋'], '#AABBCC');
  assert.equal(normalizeHex('#0a84ff'), '#0A84FF');
  assert.equal(textColorFor('#FFFFFF'), '#1D1D1F');
  assert.equal(textColorFor('#1D1D1F'), '#FFFFFF');
  assert.equal(textColorFor('#0A84FF'), '#FFFFFF');
  assert.equal(textColorFor('#7FD992'), '#1D1D1F');
});

test('附加統計選項：撥款日＋自訂欄位，不重複交屋開關', () => {
  const opts = extraStatOptions([{ fieldName: '交屋' }, { fieldName: '權狀已取得' }, { fieldName: '' }]);
  assert.deepEqual(opts.map(o => o.key), ['appropriationDate', '權狀已取得']);
});

test('交屋開關：布林 true 或字串 TRUE 視為開啟，字串 FALSE 視為關閉', async () => {
  const { isHandoverOn, barColor } = await import('../../src/utils/handoverBoard.js');
  assert.equal(isHandoverOn({ 交屋: true }), true);
  assert.equal(isHandoverOn({ 交屋: 'TRUE' }), true);
  assert.equal(isHandoverOn({ 交屋: 'FALSE' }), false);
  assert.equal(isHandoverOn({ 交屋: '' }), false);
  assert.equal(isHandoverOn({}), false);
  const board = buildHandoverBoard([house('A1-03', 'A1', { buyerName: '', 交屋: 'FALSE' }), house('A1-04', 'A1', { 交屋: 'TRUE' })], menu('初驗'), TODAY);
  assert.equal(board.cellMap['3|A1'].status, 'unsold');
  assert.equal(board.cellMap['4|A1'].status, 'done:交屋');
  // 淺色進度條加深、深色不變
  assert.notEqual(barColor('#FFF1D2'), '#FFF1D2');
  assert.equal(barColor('#0A84FF'), '#0A84FF');
});

test('自訂欄位附加統計：用 fieldKey 當資料鍵，顯示目前名稱（改名後仍計得到）', async () => {
  const defs = [{ fieldKey: 'cf_title', fieldName: '權狀已點交' }, { fieldName: '舊欄位' }];
  assert.deepEqual(extraStatOptions(defs).map(o => [o.key, o.label]), [['appropriationDate', '已撥款'], ['cf_title', '權狀已點交'], ['舊欄位', '舊欄位']]);
  const cfg = { ...menu('初驗'), handoverBoard: { extraStats: ['cf_title', '舊欄位'] } };
  const board = buildHandoverBoard([house('A1-03', 'A1', { cf_title: true, 舊欄位: '' }), house('A1-04', 'A1', { cf_title: false, 舊欄位: 'x' })], cfg, TODAY, defs);
  assert.deepEqual(board.stats.extra, [{ key: 'cf_title', label: '權狀已點交', count: 1 }, { key: '舊欄位', label: '舊欄位', count: 1 }]);
});

test('QA：交屋預約項目未列入時，虛擬交屋只看開關，不產生圖例外的狀態', () => {
  const cfg = { bookingMenu: [{ title: '初驗' }, { title: '交屋' }], handoverBoard: { stages: ['初驗'] } };
  const board = buildHandoverBoard([
    house('A1-03', 'A1', { _bookingInfo: info({ 初驗: [bk('已完成', '2026-10-01')], 交屋: [bk('預約中', '2026-11-20')] }) }),
    house('A1-04', 'A1', { 交屋: true }),
  ], cfg, TODAY);
  const keys = new Set(board.statusList.map(s => s.key));
  for (const u of board.units) assert.ok(keys.has(u.status), u.status);
  assert.equal(board.cellMap['3|A1'].status, 'done:初驗');
  assert.equal(board.cellMap['4|A1'].status, 'done:交屋');
  // 已刪除的交屋選單、沒有選單
  const deleted = buildHandoverBoard([house('A1-03', 'A1', { _bookingInfo: info({ 交屋: [bk('預約中', '2026-11-20')] }) })], { bookingMenu: [{ title: '初驗' }, { title: '交屋', deleted: true }] }, TODAY);
  assert.equal(deleted.units[0].status, 'pending');
  const none = buildHandoverBoard([house('A1-03', 'A1', { _bookingInfo: info({ 交屋: [bk('預約中', '2026-11-20')] }) })], {}, TODAY);
  assert.ok(none.statusList.some(s => s.key === none.units[0].status));
});

test('QA：舊建案只有 bookingTypes 也有進度項目', () => {
  assert.deepEqual(resolveStages({ bookingTypes: ['初驗', '複驗'] }, {}).map(s => s.key), ['初驗', '複驗', '交屋']);
});

test('QA：棟別只填棟名時以戶號拆出的棟線分欄', () => {
  assert.deepEqual(parseUnitPosition({ unitId: 'A1-03', building: 'A' }), { type: 'grid', col: 'A1', floor: 3 });
  assert.deepEqual(parseUnitPosition({ unitId: '2F-A2', building: 'A' }), { type: 'grid', col: 'A2', floor: 2 });
  assert.deepEqual(parseUnitPosition({ unitId: 'A01-03', building: 'A1' }), { type: 'grid', col: 'A1', floor: 3 });
  const board = buildHandoverBoard([house('A1-03', 'A'), house('A2-03', 'A'), house('A3-03', 'A')], menu('初驗'), TODAY);
  assert.deepEqual(board.cols, ['A1', 'A2', 'A3']);
  assert.equal(board.specialUnits.length, 0);
});

test('QA：附加統計不把字串 FALSE 算成有值；交屋開關優先對應名稱剛好是交屋的項目', () => {
  const cfg = { ...menu('初驗'), handoverBoard: { extraStats: ['權狀'] } };
  const board = buildHandoverBoard([house('A1-03', 'A1', { 權狀: 'FALSE' }), house('A1-04', 'A1', { 權狀: 'TRUE' })], cfg, TODAY);
  assert.equal(board.stats.extra[0].count, 1);
  const stages = resolveStages(menu('初驗', '交屋', '交屋前說明'), { stages: ['初驗', '交屋', '交屋前說明'] });
  const h = house('A1-03', 'A1', { 交屋: true });
  assert.equal(deriveStatus(h, stages, stageProgress(h, stages, TODAY)), 'done:交屋');
});
