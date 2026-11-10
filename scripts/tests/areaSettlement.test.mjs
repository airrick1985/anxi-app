import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAreaUnits, calcAreaSettlement, excelRound, fmtFixed, fmtMoney, fmtWan, groupAreaUnits,
  parseFloor, resolveAreaSettings, summarizeAreaUnits, toNumber, unitGroup,
} from '../../src/utils/areaSettlement.js';
import { buildAreaSheetHtml, buildAreaListSheet } from '../../src/utils/areaSettlementExport.js';

// ───── 原版 Google Apps Script 算法（逐字複製自「面積找補.GS」，作為比對基準） ─────
const AREA = { BUILDING_PCT: 52, SIDE_RATIO: 0.95, CAP_PCT: 2, PAY_RATIO: 0.6, PING: 0.3025 };
function gasCalc(u, house) {
  const c = u.contract, d = u.deed;
  if (!(house > 0) || !(c.main > 0) || !(d.main > 0)) return null;
  const pre = c.main + c.balcony + c.common;
  const building = gasRound(house / 10000 * AREA.BUILDING_PCT / 100, 1);
  const balcony = gasRound(building * AREA.SIDE_RATIO / pre * c.balcony, 1);
  const common = gasRound(building * AREA.SIDE_RATIO / pre * c.common, 1);
  const main = gasRound(building - balcony - common, 1);
  const rows = [gasLine(c.main, d.main, main), gasLine(c.balcony, d.balcony, balcony), gasLine(c.common, d.common, common)];
  const amount = rows.reduce((s, r) => s + r.amount, 0);
  const own = gasRound(d.main + d.balcony, 2);
  const total = gasRound(own + d.common, 2);
  return {
    rows,
    sum: { pre: gasRound(pre, 2), deed: gasRound(d.main + d.balcony + d.common, 2), price: building, amount },
    pay: gasRound(amount * AREA.PAY_RATIO, 0),
    own,
    total,
    ping: gasRound(total * AREA.PING, 2),
  };
}
function gasLine(pre, deed, price) {
  const diff = gasRound(deed - pre, 2);
  const k = pre ? gasRound(price / pre, 4) : 0;
  const cap = gasRound(pre * AREA.CAP_PCT / 100, 2);
  const qty = cap > diff ? diff : cap;
  return { pre, deed, diff, price, unit: gasRound(k * 10000, 0), cap, amount: gasRound(k * qty * 10000, 0) };
}
function gasRound(x, d) {
  if (!isFinite(x)) return 0;
  const a = Number(Math.abs(x).toPrecision(15)).toExponential().split('e');
  const r = Number(Math.round(Number(a[0] + 'e' + (Number(a[1]) + d))) + 'e-' + d);
  return r === 0 ? 0 : (x < 0 ? -r : r);
}

// 固定亂數，結果可重現
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const r2 = (x) => Math.round(x * 100) / 100;

const DEFAULTS = resolveAreaSettings({}, '富宇天雋');

test('Excel ROUND：四捨五入遠離零、避開浮點誤差', () => {
  assert.equal(excelRound(2.675, 2), 2.68);
  assert.equal(excelRound(1.005, 2), 1.01);
  assert.equal(excelRound(-2.5, 0), -3);
  assert.equal(excelRound(-0.004, 2), 0);
  assert.equal(Object.is(excelRound(-0.004, 2), -0), false);
  assert.equal(excelRound(NaN, 2), 0);
  assert.equal(excelRound(123456.789, 1), 123456.8);
});

test('計算結果與原版 GAS 逐項相同（2000 組亂數）', () => {
  const rand = rng(20261110);
  for (let i = 0; i < 2000; i += 1) {
    const cMain = r2(20 + rand() * 120);
    const cBal = rand() < 0.15 ? 0 : r2(rand() * 15);
    const cCom = r2(10 + rand() * 60);
    // 權狀約在合約 ±4% 內浮動（涵蓋超過上限、不足兩種）
    const drift = (v) => r2(v * (0.96 + rand() * 0.08));
    const contract = { main: cMain, balcony: cBal, common: cCom };
    const deed = { main: drift(cMain), balcony: cBal ? drift(cBal) : 0, common: drift(cCom) };
    const house = Math.round((5_000_000 + rand() * 60_000_000) / 1000) * 1000;
    assert.deepEqual(calcAreaSettlement(contract, deed, house, DEFAULTS), gasCalc({ contract, deed }, house), `case ${i}`);
  }
});

test('超過上限以上限為準，不足全額找補', () => {
  const contract = { main: 100, balcony: 10, common: 50 };
  const over = calcAreaSettlement(contract, { main: 105, balcony: 10, common: 50 }, 20_000_000, DEFAULTS);
  // 差異 5 > 上限 2 → 以 2 計
  assert.equal(over.rows[0].diff, 5);
  assert.equal(over.rows[0].cap, 2);
  assert.equal(over.rows[0].amount, excelRound(over.rows[0].unit / 10000 * 2 * 10000, 0));
  const under = calcAreaSettlement(contract, { main: 95, balcony: 10, common: 50 }, 20_000_000, DEFAULTS);
  assert.equal(under.rows[0].diff, -5);
  assert.ok(under.rows[0].amount < 0);
  assert.equal(under.pay, excelRound(under.sum.amount * 0.6, 0));
});

test('建案設定可調整比例', () => {
  const s = resolveAreaSettings({ buildingPct: 50, sideRatio: 1, capPct: 1, payPct: 100 }, 'X');
  const res = calcAreaSettlement({ main: 100, balcony: 0, common: 0 }, { main: 103, balcony: 0, common: 0 }, 10_000_000, s);
  assert.equal(res.sum.price, 500); // 1000 萬 × 50%
  assert.equal(res.rows[0].cap, 1);
  assert.equal(res.rows[0].amount, 50_000); // 5 萬/㎡ × 1㎡
  assert.equal(res.pay, 50_000);
});

test('設定：空白或不合理時用預設值，標題預設為建案名稱＋分戶坪數', () => {
  const s = resolveAreaSettings({ buildingPct: '', sideRatio: 0, shareDen: 'abc', publicArea: '1,234.5' }, '富宇天雋');
  assert.equal(s.buildingPct, 52);
  assert.equal(s.sideRatio, 0.95);
  assert.equal(s.shareDen, 999999);
  assert.equal(s.publicArea, 1234.5);
  assert.equal(s.displayTitle, '富宇天雋分戶坪數');
  assert.equal(resolveAreaSettings({ title: '天雋分戶坪數表' }, 'X').displayTitle, '天雋分戶坪數表');
});

test('數字解析：千分位、空白、非數字', () => {
  assert.equal(toNumber('12,345,678'), 12345678);
  assert.equal(toNumber(' 45.6 '), 45.6);
  assert.equal(toNumber(''), null);
  assert.equal(toNumber(null), null);
  assert.equal(toNumber('約 30'), null);
  assert.equal(toNumber(0), 0);
});

const hh = (unitId, building, extra = {}) => ({ _docId: unitId, unitId, building, buyerName: '王小明', ...extra });
const full = {
  areaSettleContractMain: 60.12, areaSettleContractBalcony: 8.5, areaSettleContractCommon: 30.2,
  areaSettleDeedMain: 60.5, areaSettleDeedBalcony: 8.3, areaSettleDeedCommon: 31.5,
  areaSettleTotalPrice: '15,000,000', areaSettleParkingPrice: 1_500_000,
};

test('戶別整理：房屋價款扣車位、資料不足列出缺少欄位', () => {
  const units = buildAreaUnits([
    hh('A1-03', 'A1', full),
    hh('A1-02', 'A1', { ...full, areaSettleDeedCommon: '' }),
    hh('A1-04', 'A1', { areaSettleContractMain: 50 }),
  ], DEFAULTS);
  const byId = Object.fromEntries(units.map(u => [u.unitId, u]));
  assert.equal(byId['A1-03'].house, 13_500_000);
  assert.deepEqual(byId['A1-03'].calc, gasCalc({
    contract: { main: 60.12, balcony: 8.5, common: 30.2 },
    deed: { main: 60.5, balcony: 8.3, common: 31.5 },
  }, 13_500_000));
  assert.deepEqual(byId['A1-02'].missing, ['權狀公設']);
  assert.equal(byId['A1-02'].calc, null);
  assert.deepEqual(byId['A1-04'].missing, ['房地總價', '權狀主建物']);
  const sum = summarizeAreaUnits(units);
  assert.equal(sum.ready, 1);
  assert.equal(sum.missing, 2);
  assert.equal(sum.amount, byId['A1-03'].calc.sum.amount);
});

test('戶別排序：棟別自然排序、樓層由低到高、店面最後', () => {
  const units = buildAreaUnits([
    hh('S-01', 'S'), hh('B1-02', 'B1'), hh('A10-01', 'A10'), hh('A2-11', 'A2'), hh('A2-03', 'A2'), hh('2F-A1', ''),
  ], DEFAULTS);
  assert.deepEqual(units.map(u => u.unitId), ['2F-A1', 'A2-03', 'A2-11', 'A10-01', 'B1-02', 'S-01']);
  assert.deepEqual(groupAreaUnits(units).map(g => g.name), ['A1', 'A2', 'A10', 'B1', '店面']);
  assert.equal(parseFloor({ unitId: 'A1-2F' }), 2);
  assert.equal(parseFloor({ unitId: '12A3' }), 12);
  assert.equal(parseFloor({ unitId: 'S1', 樓層: '1F' }), 1);
  assert.equal(unitGroup({ unitId: 'S1', building: '' }), '店面');
  assert.equal(unitGroup({ unitId: '', building: '' }), '其他');
});

test('顯示格式', () => {
  assert.equal(fmtFixed(45.6, 2), '45.60');
  assert.equal(fmtFixed(-0.001, 2), '0.00');
  assert.equal(fmtFixed(null, 2), '');
  assert.equal(fmtMoney(-123456.5), '-123,457');
  assert.equal(fmtWan(702, 1), '702.0');
});

test('單據 HTML：數值、可編輯格只在畫面預覽出現', () => {
  const [u] = buildAreaUnits([hh('A1-03', 'A1', { ...full, address: '台中市西屯區市政路 1 號 3 樓', areaSettleBuildNo: '1234', areaSettleShare: 4567 })], DEFAULTS);
  const html = buildAreaSheetHtml(u, DEFAULTS);
  assert.match(html, /富宇天雋分戶坪數/);
  assert.match(html, /A1-03/);
  assert.match(html, /王小明/);
  assert.match(html, />60\.50</);
  assert.match(html, />\/999999</);
  assert.match(html, new RegExp(`>${fmtMoney(u.calc.pay)}<`));
  assert.doesNotMatch(html, /data-edit/);
  const edit = buildAreaSheetHtml(u, DEFAULTS, { editable: true });
  assert.match(edit, /data-edit="areaSettleDeedMain"/);
  assert.match(edit, /data-edit="@publicArea"/);
  // 使用者資料要跳脫
  const [x] = buildAreaUnits([hh('A1-05', 'A1', { buyerName: '<b>x</b>' })], DEFAULTS);
  assert.match(buildAreaSheetHtml(x, DEFAULTS), /&lt;b&gt;x&lt;\/b&gt;/);
});

test('Excel 一覽表：每戶一列、合計列', async () => {
  const mod = await import('xlsx-js-style');
  const XLSX = mod.utils ? mod : mod.default;
  const units = buildAreaUnits([hh('A1-03', 'A1', full), hh('A1-04', 'A1', full), hh('A1-05', 'A1')], DEFAULTS);
  const ws = buildAreaListSheet(XLSX, units, DEFAULTS, { projectName: '富宇天雋', exportedAt: new Date('2026-11-10T10:00:00') });
  const range = XLSX.utils.decode_range(ws['!ref']);
  assert.equal(range.e.r, 4 + units.length); // 標題 2 列＋表頭 2 列＋資料＋合計
  const headers = [];
  for (let c = 0; c <= range.e.c; c += 1) headers.push(ws[XLSX.utils.encode_cell({ r: 3, c })]?.v || ws[XLSX.utils.encode_cell({ r: 2, c })]?.v);
  const col = (label) => headers.indexOf(label);
  const totalRow = range.e.r;
  const amount = units.filter(u => u.calc).reduce((s, u) => s + u.calc.sum.amount, 0);
  assert.equal(ws[XLSX.utils.encode_cell({ r: totalRow, c: col('找補合計(元)') })].v, amount);
  assert.equal(ws[XLSX.utils.encode_cell({ r: 4, c: col('戶號') })].v, 'A1-03');
  assert.match(ws[XLSX.utils.encode_cell({ r: 6, c: col('資料不足') })].v, /^缺：房地總價/);
});
