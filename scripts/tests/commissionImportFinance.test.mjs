import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { computeUnitFinance } = require('../../functions/utils/commissionCalculation.js');
const { defaultPriceSource } = require('../../functions/utils/commissionPlans.js');
// Execute the actual ESM helper with the equivalent backend calculation dependencies.
const source = fs.readFileSync(new URL('../../src/utils/commissionImportFinance.js', import.meta.url), 'utf8')
  .replace(/^import .*;$/gm, '').replace('export function', 'function');
const implementation = vm.runInNewContext(`${source}\nparseImportFinance`, { computeUnitFinance, defaultPriceSource });
const parse = (row, plan, override = {}) => structuredClone(implementation(row, { unitId: 'C-15', contractType: '毛胚合約', price_transaction_house: 3649, price_package_deal: 3750, price_floor_house_total: 3400, ...override }, [{ buyerUnitId: 'C-15', status_backend: '簽約', price_transaction: 200, price_floor: 180 }], { priceBasis: plan }));

test('配套新欄位 99/80 排除車位，且歷史金額不被目前成交價覆寫', () => {
  const f = parse({ 配套價格: 99, 配套底價: 80, 合約方式: '裝修合約' }, 'package', { price_transaction_house: 8000, price_package_deal: 8100 });
  assert.deepEqual(f.errors, []);
  assert.equal(f.dealTotal, 99);
  assert.equal(f.houseFloor, 80);
  assert.equal(f.totalFloor, 80);
  assert.equal(f.parkDeal, 0);
  assert.equal(f.parkFloor, 0);
  assert.equal(f.contractType, '裝修合約');
});
test('配套舊欄位相容，金額必須是配套金額且不可含車位', () => {
  const row = { '成交總價(含車)': 99, 房屋成交價: 99, 總底價: 80, 房屋總底價: 80, 車位成交總價: 0, 車位底價: 0 };
  assert.deepEqual(parse(row, 'package').errors, []);
  assert.ok(parse({ ...row, 車位底價: 180 }, 'package').errors.some(e => e.includes('不可包含車位')));
});
test('房屋新範本以拆價 3750 計算；手填房屋底價加統一車位底價', () => {
  const f = parse({ 價格來源: '配套房屋總價', '請佣總價(含車)': '3,750', 房屋底價: 3300 }, 'house');
  assert.deepEqual(f.errors, []);
  assert.equal(f.houseDeal, 3550);
  assert.equal(f.dealTotal, 3750);
  assert.equal(f.totalFloor, 3480);
  assert.equal(f.priceSource, 'splitHouse');
});
test('已填歷史房價和車價時優先採檔案，不以銷控現值覆寫', () => {
  const f = parse({ 價格來源: '配套房屋總價', '請佣總價(含車)': 3700, 房屋成交價: 3500, 車位成交總價: 200, 房屋底價: 3200, 車位底價: 150 }, 'house', { price_package_deal: 9000 });
  assert.deepEqual(f.errors, []);
  assert.equal(f.totalFloor, 3350);
  assert.equal(f.dealTotal, 3700);
});
test('新格式拆價底價未填須阻擋；舊一般格式維持原成交總價', () => {
  assert.ok(parse({ 價格來源: '', '請佣總價(含車)': 3750 }, 'house').errors.some(e => e.includes('歷史房屋底價')));
  const f = parse({ '成交總價(含車)': 3849, 總底價: 3580, 房屋總底價: 3400 }, 'house');
  assert.deepEqual(f.errors, []);
  assert.equal(f.dealTotal, 3849);
  assert.equal(f.priceSource, 'transaction');
});
test('配套底價必填；無拆價資料不可用整筆房價代替配套價格', () => {
  assert.ok(parse({ 配套價格: 99 }, 'package').errors.some(e => e.includes('填寫配套底價')));
  assert.ok(parse({ 配套底價: 80 }, 'package', { price_package_deal: null }).errors.length);
  assert.deepEqual(parse({ 配套價格: 99, 配套底價: 0 }, 'package').errors, []);
});
test('錯誤數字、來源及不一致總價在匯入前阻擋', () => {
  assert.ok(parse({ 配套價格: 99, 配套底價: '錯誤' }, 'package').errors.length);
  assert.ok(parse({ 配套價格: 99, 配套底價: -1 }, 'package').errors.length);
  assert.ok(parse({ 配套價格: 99, 配套底價: 80, 總底價: 90 }, 'package').errors.length);
  assert.ok(parse({ 價格來源: '配套價格', 配套價格: 99, 配套底價: 80 }, 'house').errors.length);
  assert.ok(parse({ 價格來源: '配套房屋總價', '請佣總價(含車)': 3750, 房屋成交價: 3750, 房屋底價: 3300 }, 'house').errors.length);
});

test('新房屋／配套範本放錯方案時阻擋，不悄悄改用銷控金額', () => {
  assert.ok(parse({ 配套價格: 99, 配套底價: 80 }, 'house').errors.some(e => e.includes('切換至配套方案')));
  assert.ok(parse({ 價格來源: '', '請佣總價(含車)': 3750, 房屋底價: 3300 }, 'package').errors.some(e => e.includes('切換至房屋方案')));
});
