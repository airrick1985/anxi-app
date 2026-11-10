import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import * as front from '../../src/utils/scheduledPricePlan.js';

const back = createRequire(import.meta.url)('../../functions/utils/scheduledPricePlan.js');

const unit = (unitId, extra = {}) => ({
  unitId, building: 'A', floor: '5F', salesStatus_backend: '', area_house_ping: 35.67,
  price_list_house_only: 1288.3, price_list_terrace: 0, price_list_house_total: 1288.3,
  price_floor_house_only: 1200, price_floor_terrace: 0, price_floor_house_total: 1200,
  ...extra,
});
const spot = (spotId, extra = {}) => ({ spotId, type2: '坡道平面', floor: 'B2', status_backend: '', price_list: 250, price_floor: 230, ...extra });

const households = [
  unit('A5-1'),
  unit('A5-2', { salesStatus_backend: '簽約' }),
  unit('A6-1', { salesStatus_backend: '保留' }),
  unit('A7-1', { price_list_terrace: 12.5, price_list_house_total: 1300.8 }),
  unit('B3-1', { building: 'B', area_house_ping: null }),
  unit('B3-2', { building: 'B', price_list_house_only: null, price_list_house_total: null }),
  unit('B4-1', { building: 'B', salesStatus_backend: '退戶' }),
  { building: 'C' },
];
const parkings = [
  spot('B2-01'),
  spot('B2-02', { type2: '坡道機械', price_list: 180, price_floor: 170 }),
  spot('B2-03', { buyerUnitId: 'A5-2' }),
  spot('B2-04', { status_backend: '簽約', buyerUnitId: 'A5-2' }),
  spot('B2-05', { type2: '' }),
];

const configs = {
  每坪加價: { statuses: ['', '退戶'], house: { mode: 'perPing', list: 1, floor: 0.8 } },
  每戶加價: { statuses: [''], house: { mode: 'perUnit', list: 30, floor: '' } },
  百分比: { statuses: ['', '保留'], house: { mode: 'percent', list: 3, floor: 2.5 } },
  逐戶填價: { statuses: [''], house: { mode: 'manual', manual: { 'A5-1': { list: 1350.55, floor: '' }, 'A7-1': { floor: 1250 } } } },
  限定棟別與排除: { statuses: ['', '退戶'], buildings: ['B'], excludedUnitIds: ['B4-1'], house: { mode: 'perPing', list: 1 } },
  車位依形式: {
    statuses: [''], house: { mode: 'perUnit', list: 10 },
    parking: { enabled: true, mode: 'fixed', amounts: { 坡道平面: { list: 10, floor: 8 }, 坡道機械: { list: 5 }, 未填形式: { floor: 3 } } },
  },
  車位逐個填: {
    statuses: [''], house: { mode: 'perUnit' },
    parking: { enabled: true, mode: 'manual', manual: { 'B2-01': { list: 268 }, 'B2-05': { list: 300, floor: 280 } }, excludedSpotIds: ['B2-05'] },
  },
};

Object.entries(configs).forEach(([name, config]) => {
  test(`前後端一致：${name}`, () => {
    assert.deepEqual(front.planPriceUpdate(households, parkings, config), back.planPriceUpdate(households, parkings, config));
    assert.equal(front.describePriceConfig(config), back.describePriceConfig(config));
    assert.equal(front.hasPriceAdjustment(config), back.hasPriceAdjustment(config));
  });
});

const rowOf = (plan, id) => plan.households.find(r => r.id === id);

test('每坪加價：總價整萬四捨五入、差額算在房屋價，露臺不動', () => {
  const plan = back.planPriceUpdate(households, parkings, configs.每坪加價);
  // 1288.3 + 35.67 = 1323.97 → 1324
  assert.deepEqual(rowOf(plan, 'A5-1').changes.price_list_house_only, { from: 1288.3, to: 1324 });
  assert.deepEqual(rowOf(plan, 'A5-1').changes.price_list_house_total, { from: 1288.3, to: 1324 });
  // 1200 + 0.8 × 35.67 = 1228.536 → 1229
  assert.deepEqual(rowOf(plan, 'A5-1').changes.price_floor_house_only, { from: 1200, to: 1229 });
  // 有露臺：1288.3 + 12.5 + 35.67 = 1336.47 → 總價 1336、房屋 1323.5
  assert.deepEqual(rowOf(plan, 'A7-1').changes.price_list_house_only, { from: 1288.3, to: 1323.5 });
  assert.deepEqual(rowOf(plan, 'A7-1').changes.price_list_house_total, { from: 1300.8, to: 1336 });
  assert.equal(rowOf(plan, 'A7-1').changes.price_list_terrace, undefined);
});

test('只調勾選狀態的戶；已售、保留（未勾）不在名單', () => {
  const plan = back.planPriceUpdate(households, parkings, configs.每坪加價);
  const ids = plan.households.map(r => r.id);
  assert.deepEqual(ids, ['A5-1', 'A7-1', 'B3-1', 'B3-2', 'B4-1']);
  assert.ok(!ids.includes('A5-2'));
  assert.ok(!ids.includes('A6-1'));
});

test('缺坪數、缺原價列入略過原因', () => {
  const plan = back.planPriceUpdate(households, parkings, configs.每坪加價);
  assert.deepEqual(rowOf(plan, 'B3-1').skips, ['無房屋坪數', '無房屋坪數']);
  assert.deepEqual(rowOf(plan, 'B3-2').skips, ['表價無原價']);
  assert.ok(rowOf(plan, 'B3-2').changes.price_floor_house_only);
  assert.equal(plan.summary.skipCount, 2);
});

test('每戶加價：底價留空不調', () => {
  const plan = back.planPriceUpdate(households, parkings, configs.每戶加價);
  const row = rowOf(plan, 'A5-1');
  assert.deepEqual(row.changes.price_list_house_only, { from: 1288.3, to: 1318 });
  assert.equal(row.changes.price_floor_house_only, undefined);
});

test('百分比：房屋價 × (1 + %)，再加露臺取整', () => {
  const plan = back.planPriceUpdate(households, parkings, configs.百分比);
  // 1288.3 × 1.03 = 1326.949 → 1327；1200 × 1.025 = 1230
  assert.deepEqual(rowOf(plan, 'A5-1').changes.price_list_house_only, { from: 1288.3, to: 1327 });
  assert.deepEqual(rowOf(plan, 'A6-1').changes.price_floor_house_only, { from: 1200, to: 1230 });
});

test('逐戶填價：照填不取整，總價加露臺', () => {
  const plan = back.planPriceUpdate(households, parkings, configs.逐戶填價);
  assert.deepEqual(rowOf(plan, 'A5-1').changes, {
    price_list_house_only: { from: 1288.3, to: 1350.55 },
    price_list_house_total: { from: 1288.3, to: 1350.55 },
  });
  assert.deepEqual(rowOf(plan, 'A7-1').changes.price_floor_house_only, { from: 1200, to: 1250 });
  assert.equal(plan.summary.unitCount, 2);
});

test('限定棟別、排除的戶不計算', () => {
  const plan = back.planPriceUpdate(households, parkings, configs.限定棟別與排除);
  assert.deepEqual(plan.households.map(r => r.id), ['B3-1', 'B3-2', 'B4-1']);
  assert.equal(rowOf(plan, 'B4-1').excluded, true);
  assert.deepEqual(rowOf(plan, 'B4-1').changes, {});
});

test('車位：依形式加價、整萬；空白狀態但已綁戶別視為已售', () => {
  const plan = back.planPriceUpdate(households, parkings, configs.車位依形式);
  const ids = plan.parkings.map(r => r.id);
  assert.deepEqual(ids, ['B2-01', 'B2-02', 'B2-05']);
  const row = id => plan.parkings.find(r => r.id === id);
  assert.deepEqual(row('B2-01').changes, { price_list: { from: 250, to: 260 }, price_floor: { from: 230, to: 238 } });
  assert.deepEqual(row('B2-02').changes, { price_list: { from: 180, to: 185 } });
  assert.deepEqual(row('B2-05').changes, { price_floor: { from: 230, to: 233 } });
  assert.equal(plan.summary.parkingCount, 3);
});

test('車位逐個填價與排除', () => {
  const plan = back.planPriceUpdate(households, parkings, configs.車位逐個填);
  const row = id => plan.parkings.find(r => r.id === id);
  assert.deepEqual(row('B2-01').changes, { price_list: { from: 250, to: 268 } });
  assert.deepEqual(row('B2-05').changes, {});
  assert.equal(row('B2-05').excluded, true);
});

test('摘要與是否有調整內容', () => {
  assert.equal(back.describePriceConfig(configs.每坪加價), '房屋 表價 +1萬/坪、底價 +0.8萬/坪');
  assert.equal(back.describePriceConfig(configs.車位依形式), '房屋 表價 +10萬/戶；車位 表價依形式調整、底價依形式調整');
  assert.equal(back.describePriceConfig(configs.車位逐個填), '車位逐個填價 2 個');
  assert.equal(back.hasPriceAdjustment({ statuses: [''], house: { mode: 'perPing' } }), false);
  assert.equal(back.hasPriceAdjustment({ statuses: [''], house: { mode: 'manual', manual: { A: { list: '' } } } }), false);
});

test('整萬四捨五入收斂浮點誤差', () => {
  assert.equal(back.roundWan(1323.4999), 1323);
  assert.equal(back.roundWan(1323.4999999999), 1324); // 浮點誤差視為 .5
  assert.equal(back.roundWan(1323.5), 1324);
  assert.equal(back.roundWan(0.1 + 0.2 + 1322.2), 1323);
});
