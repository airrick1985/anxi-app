// 執行：node --test scripts/tests/contractPaymentPlan.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildContractPlan,
  reconcileContractRows,
  resolvePeriodOptions,
  splitPeriodAndNote,
  suggestPeriodForRecord,
  unassignedPaidRecords,
} from '../../src/utils/contractPaymentPlan.js';

const single = (key, name, amount) => ({ key, name, type: 'single', amount, percent: 0, children: [] });
const group = (key, name, children) => ({ key, name, type: 'group', percent: 0, children });

const data = {
  manualRows: [
    single('a', '訂金', 100),
    group('g', '工程期款', [{ key: 'g1', name: '開工款', amount: 200 }, { key: 'g2', name: '結構款', amount: 300 }]),
    single('z', '交屋款', 0),
    single('n', '回饋', -50),
    single('b', '銀行貸款', 1450),
  ],
  decorationManualRows: [single('d1', '訂金', 40), single('d2', '裝修尾款', 160)],
};

test('有子項列子項，金額由萬換算成元，0 與負數略過', () => {
  const plan = buildContractPlan(data, { mainBase: 2000 });
  assert.equal(plan.hasData, true);
  assert.deepEqual(plan.rows.map(r => [r.name, r.amount, r.groupName]), [
    ['訂金', 1000000, ''],
    ['開工款', 2000000, '工程期款'],
    ['結構款', 3000000, '工程期款'],
    ['銀行貸款', 14500000, ''],
  ]);
  assert.equal(plan.skippedCount, 2);
});

test('手動調整過的小數金額：換算成整數元', () => {
  const plan = buildContractPlan({ manualRows: [single('a', '訂金', 12.3456)] }, { mainBase: 12 });
  assert.equal(plan.rows[0].amount, 123456);
  assert.equal(Number.isInteger(plan.rows[0].amount), true);
});

test('字串金額可讀，非數字視為 0', () => {
  const plan = buildContractPlan({ manualRows: [single('a', '訂金', '100'), single('b', '尾款', 'abc')] }, { mainBase: 100 });
  assert.deepEqual(plan.rows.map(r => r.amount), [1000000]);
  assert.equal(plan.skippedCount, 1);
});

test('合計口徑同合約製作：各期先四捨五入再加總', () => {
  const plan = buildContractPlan({ manualRows: [single('a', 'A', 10.4), single('b', 'B', 10.4)] }, { mainBase: 20 });
  assert.equal(plan.sections[0].sumWan, 20);
  assert.equal(plan.sections[0].matchesBase, true);
});

test('沒有資料：null、空物件、空陣列都算沒有', () => {
  for (const input of [null, undefined, {}, { manualRows: [] }, { manualRows: 'x' }]) {
    const plan = buildContractPlan(input, { mainBase: 2000 });
    assert.equal(plan.hasData, false);
    assert.deepEqual(plan.rows, []);
  }
});

test('全部期別都是 0 仍算有資料，只是沒有可帶入的列', () => {
  const plan = buildContractPlan({ manualRows: [single('a', '訂金', 0)] }, { mainBase: 0 });
  assert.equal(plan.hasData, true);
  assert.equal(plan.rows.length, 0);
  assert.equal(plan.skippedCount, 1);
});

test('合計與基準相同時不標示不符；不同時標示', () => {
  assert.equal(buildContractPlan(data, { mainBase: 2000 }).sections[0].matchesBase, true);
  const stale = buildContractPlan(data, { mainBase: 2100 }).sections[0];
  assert.equal(stale.matchesBase, false);
  assert.deepEqual([stale.sumWan, stale.baseWan, stale.baseLabel], [2000, 2100, '成交總價']);
});

test('一般戶不讀裝修期款', () => {
  const plan = buildContractPlan(data, { mainBase: 2000, decorationBase: 200 });
  assert.deepEqual(plan.sections.map(s => s.id), ['main']);
  assert.equal(plan.rows.some(r => r.section === 'decoration'), false);
});

test('配套戶：期款與裝修期款都列出，基準名稱不同', () => {
  const plan = buildContractPlan(data, { isPackageContract: true, mainBase: 2000, decorationBase: 200 });
  assert.deepEqual(plan.sections.map(s => [s.id, s.baseLabel, s.sumWan, s.matchesBase]), [
    ['main', '配套房屋總價', 2000, true],
    ['decoration', '配套價格', 200, true],
  ]);
  assert.equal(plan.rows.filter(r => r.section === 'decoration').length, 2);
});

test('配套戶：裝修期別與期款同名才加前綴，不同名維持原名', () => {
  const plan = buildContractPlan(data, { isPackageContract: true, mainBase: 2000, decorationBase: 200 });
  const notes = plan.rows.filter(r => r.section === 'decoration').map(r => [r.name, r.period]);
  assert.deepEqual(notes, [['訂金', '裝修－訂金'], ['裝修尾款', '裝修尾款']]);
  assert.equal(plan.rows.find(r => r.section === 'main' && r.name === '訂金').period, '訂金');
});

test('配套戶只有裝修期款：仍算有資料，期款標為尚未設定', () => {
  const plan = buildContractPlan({ decorationManualRows: data.decorationManualRows }, { isPackageContract: true, mainBase: 1800, decorationBase: 200 });
  assert.equal(plan.hasData, true);
  assert.deepEqual(plan.sections.map(s => [s.id, s.hasRows, s.matchesBase]), [['main', false, false], ['decoration', true, true]]);
});

test('列的 key 跨區不重複', () => {
  const plan = buildContractPlan({ manualRows: [single('same', '訂金', 10)], decorationManualRows: [single('same', '尾款', 10)] }, { isPackageContract: true, mainBase: 10, decorationBase: 10 });
  assert.equal(new Set(plan.rows.map(r => r.key)).size, 2);
});

// ── 對帳 ──
const contract = rows => buildContractPlan({ manualRows: rows }, { mainBase: 0 });
const standard = () => contract([single('a', '訂金', 10), single('b', '簽約金', 100), single('c', '開工款', 220)]);
const planned = (id, note, expectedAmount, extra = {}) => ({ id, note, date: '', amount: null, expectedDate: '2026-12-01', expectedAmount, ...extra });
const paid = (id, note, amount, extra = {}) => ({ id, note, date: '2026-10-01', amount, ...extra });
const statusOf = (result, name) => result.rows.find(r => r.name === name);

test('沒有任何紀錄：帶合約全額，可勾選', () => {
  const row = statusOf(reconcileContractRows(standard(), []), '簽約金');
  assert.deepEqual([row.status, row.selectable, row.due, row.isBalance, row.record], ['new', true, 1000000, false, null]);
});

test('已繳不足、沒有預計：帶差額', () => {
  const row = statusOf(reconcileContractRows(standard(), [paid('p', '', 20000, { period: '訂金' })]), '訂金');
  assert.deepEqual([row.status, row.selectable, row.due, row.isBalance, row.paidAmount], ['new', true, 80000, true, 20000]);
});

test('多筆已繳對同一期：加總', () => {
  const records = [paid('a', '小訂', 20000, { period: '訂金' }), paid('b', '補足', 80000, { period: '訂金' })];
  const row = statusOf(reconcileContractRows(standard(), records), '訂金');
  assert.deepEqual([row.status, row.selectable, row.due, row.paidAmount, row.paidRecords.length], ['settled', false, 0, 100000, 2]);
});

test('一筆預計、金額等於應繳：已帶入，不可勾選', () => {
  const row = statusOf(reconcileContractRows(standard(), [planned('x', '', 1000000, { period: '簽約金' })]), '簽約金');
  assert.deepEqual([row.status, row.selectable, row.record.id], ['same', false, 'x']);
});

test('一筆預計、已繳部分：應繳扣掉已繳才比對', () => {
  const records = [paid('p', '', 20000, { period: '訂金' }), planned('x', '尾款', 80000, { period: '訂金' })];
  assert.equal(statusOf(reconcileContractRows(standard(), records), '訂金').status, 'same');
});

test('一筆預計、金額不同：可更新成應繳', () => {
  const row = statusOf(reconcileContractRows(standard(), [planned('x', '', 900000, { period: '簽約金' })]), '簽約金');
  assert.deepEqual([row.status, row.selectable, row.due, row.record.id], ['changed', true, 1000000, 'x']);
});

test('一筆預計、沒填金額：視為金額不同', () => {
  assert.equal(statusOf(reconcileContractRows(standard(), [planned('x', '', null, { period: '簽約金' })]), '簽約金').status, 'changed');
});

test('多筆預計：不可勾選，附筆數與合計', () => {
  const records = [planned('x', '', 500000, { period: '簽約金' }), planned('y', '', 500000, { period: '簽約金' })];
  const row = statusOf(reconcileContractRows(standard(), records), '簽約金');
  assert.deepEqual([row.status, row.selectable, row.matchCount, row.plannedAmount], ['existing', false, 2, 1000000]);
});

test('已繳清但還有預計：不刪預計，標示金額', () => {
  const records = [paid('p', '', 100000, { period: '訂金' }), planned('x', '', 50000, { period: '訂金' })];
  const row = statusOf(reconcileContractRows(standard(), records), '訂金');
  assert.deepEqual([row.status, row.selectable, row.plannedAmount], ['settled', false, 50000]);
});

test('無法判斷的舊資料（同名但沒金額、沒預計日）：不可勾選', () => {
  const row = statusOf(reconcileContractRows(standard(), [{ id: 'old', note: '簽約金', date: '', amount: null }]), '簽約金');
  assert.deepEqual([row.status, row.selectable], ['existing', false]);
});

test('舊資料：沒有期別時，備註等於期別名稱就視為該期', () => {
  const records = [paid('p', '簽約金', 1000000), planned('x', '開工款', 2200000)];
  const result = reconcileContractRows(standard(), records);
  assert.equal(statusOf(result, '簽約金').status, 'settled');
  assert.equal(statusOf(result, '開工款').status, 'same');
});

test('期別優先於備註：有期別就不看備註', () => {
  const result = reconcileContractRows(standard(), [paid('p', '簽約金', 1000000, { period: '訂金' })]);
  assert.equal(statusOf(result, '訂金').paidAmount, 1000000);
  assert.equal(statusOf(result, '簽約金').paidAmount, 0);
});

test('備註比對忽略前後空白；空備註與 null 不影響', () => {
  const result = reconcileContractRows(standard(), [paid('p', ' 訂金 ', 100000), paid('q', '', 5), null]);
  assert.equal(statusOf(result, '訂金').status, 'settled');
});

test('沒有紀錄或未傳：全部 new', () => {
  assert.ok(reconcileContractRows(standard(), null).rows.every(r => r.status === 'new'));
});

// ── 溢繳沖抵 ──
test('繳超過：多的金額依序沖抵後面未繳的期別', () => {
  const result = reconcileContractRows(standard(), [paid('p', '', 1100000, { period: '訂金' })]);
  const deposit = statusOf(result, '訂金');
  const sign = statusOf(result, '簽約金');
  const start = statusOf(result, '開工款');
  assert.deepEqual([deposit.status, deposit.surplus], ['settled', 1000000]);
  assert.deepEqual([sign.status, sign.offset, sign.due, sign.paidAmount], ['settled', 1000000, 0, 0]);
  assert.deepEqual([start.status, start.offset, start.due], ['new', 0, 2200000]);
  assert.deepEqual(result.overpaid, []);
});

test('繳超過：也會沖抵前面未繳的期別', () => {
  const result = reconcileContractRows(standard(), [paid('p', '', 1100000, { period: '簽約金' })]);
  assert.deepEqual([statusOf(result, '訂金').status, statusOf(result, '訂金').offset], ['settled', 100000]);
  assert.equal(statusOf(result, '簽約金').status, 'settled');
});

test('沖抵不足一期：該期帶差額', () => {
  const result = reconcileContractRows(standard(), [paid('p', '', 600000, { period: '訂金' })]);
  const sign = statusOf(result, '簽約金');
  assert.deepEqual([sign.status, sign.offset, sign.due, sign.isBalance], ['new', 500000, 500000, true]);
});

test('沖抵後有預計：應繳變少，預計金額不同可更新', () => {
  const result = reconcileContractRows(standard(), [paid('p', '', 600000, { period: '訂金' }), planned('x', '', 1000000, { period: '簽約金' })]);
  const sign = statusOf(result, '簽約金');
  assert.deepEqual([sign.status, sign.due, sign.record.id], ['changed', 500000, 'x']);
});

test('沖抵後已繳清但有預計：標示另有預計，不自動刪除', () => {
  const result = reconcileContractRows(standard(), [paid('p', '', 1100000, { period: '訂金' }), planned('x', '', 1000000, { period: '簽約金' })]);
  const sign = statusOf(result, '簽約金');
  assert.deepEqual([sign.status, sign.plannedAmount, sign.offset], ['settled', 1000000, 1000000]);
});

test('多期都有溢繳：合併沖抵', () => {
  const result = reconcileContractRows(standard(), [paid('a', '', 150000, { period: '訂金' }), paid('b', '', 1050000, { period: '簽約金' })]);
  const start = statusOf(result, '開工款');
  assert.deepEqual([start.offset, start.due], [100000, 2100000]);
});

test('沖抵完還有剩：回報超過金額', () => {
  const result = reconcileContractRows(contract([single('a', '訂金', 10)]), [paid('p', '', 150000, { period: '訂金' })]);
  assert.deepEqual(result.overpaid, [{ section: 'main', label: '期款', amount: 50000 }]);
});

test('配套戶：期款的溢繳不沖抵裝修期款', () => {
  const plan = buildContractPlan(
    { manualRows: [single('m', '訂金', 10)], decorationManualRows: [single('d', '裝修尾款', 10)] },
    { isPackageContract: true, mainBase: 10, decorationBase: 10 },
  );
  const result = reconcileContractRows(plan, [paid('p', '', 150000, { period: '訂金' })]);
  assert.deepEqual([statusOf(result, '裝修尾款').status, statusOf(result, '裝修尾款').offset], ['new', 0]);
  assert.deepEqual(result.overpaid, [{ section: 'main', label: '期款', amount: 50000 }]);
});

test('配套戶：同名期別各算各的', () => {
  const plan = buildContractPlan(
    { manualRows: [single('m', '訂金', 10)], decorationManualRows: [single('d', '訂金', 20)] },
    { isPackageContract: true, mainBase: 10, decorationBase: 20 },
  );
  const result = reconcileContractRows(plan, [paid('p', '', 100000, { period: '訂金' }), paid('q', '', 200000, { period: '裝修－訂金' })]);
  assert.ok(result.rows.every(r => r.status === 'settled'));
  assert.deepEqual(result.overpaid, []);
});

// ── 尚未對應的已繳款 ──
test('尚未對應：沒有期別、期別不在合約、備註對不上的已繳款；預計不算', () => {
  const records = [
    paid('a', '小訂', 20000),
    paid('b', '', 5000, { period: '其他款項' }),
    paid('c', '簽約金', 100),
    paid('d', '', 100, { period: '開工款' }),
    planned('e', '小訂', 100),
    null,
  ];
  assert.deepEqual(unassignedPaidRecords(standard(), records).map(r => r.id), ['a', 'b']);
});

test('使用者選的對應：計入該期；選空字串或不存在的期別不計', () => {
  const records = [paid('a', '小訂', 20000), paid('b', '補足', 80000), paid('c', '其他', 5)];
  const result = reconcileContractRows(standard(), records, { a: '訂金', b: '訂金', c: '不存在' });
  assert.equal(statusOf(result, '訂金').status, 'settled');
  assert.equal(result.rows.reduce((sum, r) => sum + r.paidAmount, 0), 100000);
  assert.equal(statusOf(reconcileContractRows(standard(), records, { a: '' }), '訂金').status, 'new');
});

test('已有期別的紀錄不會被對應值覆蓋，不重複計算', () => {
  const result = reconcileContractRows(standard(), [paid('a', '', 100000, { period: '訂金' })], { a: '簽約金' });
  assert.equal(statusOf(result, '訂金').paidAmount, 100000);
  assert.equal(statusOf(result, '簽約金').paidAmount, 0);
});

test('預計繳款不接受對應值', () => {
  const result = reconcileContractRows(standard(), [planned('a', '', 100000)], { a: '訂金' });
  assert.equal(statusOf(result, '訂金').status, 'new');
});

test('預選：小訂、補足對應含「訂」的期別，簽約對應含「簽約」', () => {
  const plan = standard();
  assert.equal(suggestPeriodForRecord(paid('a', '小訂', 1), plan), '訂金');
  assert.equal(suggestPeriodForRecord(paid('a', '補足', 1), plan), '訂金');
  assert.equal(suggestPeriodForRecord(paid('a', '簽約', 1), plan), '簽約金');
  assert.equal(suggestPeriodForRecord(paid('a', '', 1, { period: '簽約款' }), plan), '簽約金');
});

test('預選：比對不到留空；名稱用「定金」也對得到；不預選裝修期款', () => {
  assert.equal(suggestPeriodForRecord(paid('a', '其他收款', 1), standard()), '');
  assert.equal(suggestPeriodForRecord(paid('a', '小訂', 1), contract([single('a', '頭期款', 10)])), '');
  assert.equal(suggestPeriodForRecord(paid('a', '小訂', 1), contract([single('a', '定金', 10)])), '定金');
  const plan = buildContractPlan({ manualRows: [single('m', '尾款', 10)], decorationManualRows: [single('d', '裝修訂金', 10)] }, { isPackageContract: true });
  assert.equal(suggestPeriodForRecord(paid('a', '小訂', 1), plan), '');
});

// ── 期別選項 ──
const tpl = (paymentCategory, names) => ({
  paymentCategory,
  items: names.flatMap((name, index) => (Array.isArray(name)
    ? [{ id: `p${index}`, name: name[0] }, ...name[1].map((child, c) => ({ id: `c${index}${c}`, parentId: `p${index}`, name: child }))]
    : [{ id: `i${index}`, name }])),
});

test('選項：有合約資料列該戶期別，只列金額大於 0', () => {
  const options = resolvePeriodOptions({
    contractDocData: { manualRows: [single('a', '訂金', 10), single('z', '交屋款', 0)] },
    templates: [tpl('一般期款', ['不該出現'])],
    isPackageContract: false,
  });
  assert.deepEqual(options, ['訂金']);
});

test('選項：沒有合約資料列建案範本期別，有子項列子項、去重複', () => {
  const options = resolvePeriodOptions({
    templates: [tpl('一般期款', ['訂金', ['工程款', ['開工', '結構']]]), tpl('優付期款', ['訂金', '優付尾款'])],
    isPackageContract: false,
  });
  assert.deepEqual(options, ['訂金', '開工', '結構', '優付尾款']);
});

test('選項：一般戶不列配套期別；配套戶或不確定時都列', () => {
  const templates = [tpl('一般期款', ['訂金']), tpl('配套期款', ['配套頭款'])];
  assert.deepEqual(resolvePeriodOptions({ templates, isPackageContract: false }), ['訂金']);
  assert.deepEqual(resolvePeriodOptions({ templates, isPackageContract: true }), ['訂金', '配套頭款']);
  assert.deepEqual(resolvePeriodOptions({ templates }), ['訂金', '配套頭款']);
});

test('選項：配套戶列裝修期別（同名加前綴）；一般戶不列', () => {
  const contractDocData = { manualRows: [single('m', '訂金', 10)], decorationManualRows: [single('d', '訂金', 10)] };
  assert.deepEqual(resolvePeriodOptions({ contractDocData, isPackageContract: true }), ['訂金', '裝修－訂金']);
  assert.deepEqual(resolvePeriodOptions({ contractDocData, isPackageContract: false }), ['訂金']);
});

test('選項：沒有任何資料回傳空陣列', () => {
  assert.deepEqual(resolvePeriodOptions(), []);
  assert.deepEqual(resolvePeriodOptions({ contractDocData: null, templates: null }), []);
});

// ── 舊資料 ──
test('拆開舊資料：備註等於期別名稱視為期別；其他留在備註；已有期別不動', () => {
  const options = ['訂金', '簽約金'];
  assert.deepEqual(splitPeriodAndNote({ note: '訂金' }, options), { period: '訂金', note: '' });
  assert.deepEqual(splitPeriodAndNote({ note: ' 訂金 ' }, options), { period: '訂金', note: '' });
  assert.deepEqual(splitPeriodAndNote({ note: '小訂' }, options), { period: '', note: '小訂' });
  assert.deepEqual(splitPeriodAndNote({ period: '簽約金', note: '訂金' }, options), { period: '簽約金', note: '訂金' });
  assert.deepEqual(splitPeriodAndNote({}, options), { period: '', note: '' });
  assert.deepEqual(splitPeriodAndNote(null), { period: '', note: '' });
});
