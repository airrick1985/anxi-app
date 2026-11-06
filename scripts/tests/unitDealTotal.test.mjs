import test from 'node:test';
import assert from 'node:assert/strict';
import { dealTotalWan, parkingSaleTotal, resolveOwnedParkingSpots } from '../../src/utils/unitDealTotal.js';

test('成交總價不採用過時的 price_transaction_total 與文件快照', () => {
  const unit = {
    unitId: 'A1',
    salesStatus_backend: '簽約',
    price_transaction_house: 2000,
    price_transaction_total: 1,
    持有車位: [{ 車位編號: 'B1-1', 車位成交價: 150 }, { spotId: 'B1-2', price_transaction: 200 }],
  };
  const spots = resolveOwnedParkingSpots(unit, [{ buyerUnitId: 'A1', status_backend: '簽約', price_transaction: 999 }]);
  assert.deepEqual(spots.map(p => p.spotId), ['B1-1', 'B1-2']);
  assert.equal(parkingSaleTotal(spots), 350);
  assert.equal(dealTotalWan(unit, spots), 2350);
});

test('暫存清單為空時視為沒有車位，不退回 salesParkings', () => {
  const unit = { unitId: 'A1', price_transaction_house: 2000, 持有車位: [] };
  const spots = resolveOwnedParkingSpots(unit, [{ buyerUnitId: 'A1', status_backend: '簽約', price_transaction: 999 }]);
  assert.equal(dealTotalWan(unit, spots), 2000);
});

test('沒有暫存清單時依 salesParkings 取成交車位，保留中的車位不計', () => {
  const unit = { unitId: 'A1', salesStatus_backend: '簽約', price_transaction_house: 2000 };
  const parkings = [
    { buyerUnitId: 'A1', status_backend: '簽約', price_transaction: 300 },
    { buyerUnitId: 'A1', status_backend: '保留', price_transaction: 100 },
    { buyerUnitId: 'A2', status_backend: '簽約', price_transaction: 500 },
  ];
  assert.equal(dealTotalWan(unit, resolveOwnedParkingSpots(unit, parkings)), 2300);
});

test('成交價未填且沒有車位時為 0', () => {
  assert.equal(dealTotalWan({}, resolveOwnedParkingSpots({}, [])), 0);
  assert.equal(dealTotalWan(null, resolveOwnedParkingSpots(null, null)), 0);
  assert.equal(dealTotalWan({ price_transaction_house: '' }, []), 0);
});
