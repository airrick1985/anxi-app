import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { normalizeParking, resolveCancelledParkings } from '../../src/utils/cancelledParking.js';
import {
  calculatePremiumPrice, calculateTotalTransactionPrice, parkingLineText, parkingStateLabel,
} from '../../src/utils/cancelledPurchaseUtils.js';

const back = createRequire(import.meta.url)('../../functions/utils/cancelledParking.js');

const bound = (spotId, extra = {}) => ({
  projectId: 'p1', spotId, buyerUnitId: 'A', price_list: 270, price_floor: 255, price_transaction: 255, status_backend: '簽約', ...extra,
});

const cases = {
  空紀錄: { projectId: 'p1', unitId: 'A' },
  還綁著: { projectId: 'p1', unitId: 'A', salesStatus_backend: '簽約', parkingData: [bound('B1')] },
  新紀錄有轉出: { projectId: 'p1', unitId: 'A', salesStatus_backend: '簽約', parkingData: [bound('B1')], parkingMovedOut: [{ spotId: 'B2', price_transaction: 100, movedToUnitId: 'D' }] },
  新紀錄不看快照: { projectId: 'p1', unitId: 'A', salesStatus_backend: '簽約', parkingMovedOut: [], 持有車位: [{ spotId: 'B9', price_transaction: 1 }] },
  舊紀錄用快照: { projectId: 'p1', unitId: 'A', salesStatus_backend: '簽約', parkingData: [], 持有車位: [{ 車位編號: 'B3', 車位成交價: 255, 車位底價: 250, 車位尺寸: '600' }, 'B4'] },
  準備購買: { projectId: 'p1', unitId: 'A', salesStatus_backend: '小訂', parkingData: [bound('B1', { status_backend: '小訂' }), bound('B2', { status_backend: '已售' })] },
  快照上的車位狀態事後才改: { projectId: 'p1', unitId: 'A', salesStatus_backend: '小訂', parkingData: [bound('B1', { status_backend: '保留' })], 持有車位: [{ spotId: 'B1' }] },
  狀態空白舊資料: { projectId: 'p1', unitId: 'A', salesStatus_backend: '簽約', parkingData: [bound('B1', { status_backend: null })] },
  跨案: { projectId: 'p1', unitId: 'A', parkingData: [bound('B1', { projectId: 'p2' })], 持有車位: [{ projectId: 'p2', spotId: 'B2' }] },
  重複與沒編號: { projectId: 'p1', unitId: 'A', parkingData: [bound('B1'), bound('B1'), { price_transaction: 1 }], parkingMovedOut: [{ spotId: 'B1', movedToUnitId: 'D' }, null] },
};

Object.entries(cases).forEach(([name, doc]) => {
  test(`前後端一致：${name}`, () => {
    assert.deepEqual(resolveCancelledParkings(doc), back.resolveCancelledParkings(doc));
  });
});

test('前後端 normalizeParking 一致，保留 0 元、空白視為未填', () => {
  ['B1', null, { spotId: ' B1 ', price_transaction: 0, price_floor: '' }, { 車位編號: 'B2', 車位類型: '自設', 車位形式: '平面' }].forEach((raw) => {
    assert.deepEqual(normalizeParking(raw), back.normalizeParking(raw));
  });
  const parking = normalizeParking({ spotId: 'B1', price_transaction: 0, price_floor: '' });
  assert.equal(parking.price_transaction, 0);
  assert.equal(parking.price_floor, null);
});

test('沒有紀錄時不出錯', () => {
  assert.deepEqual(resolveCancelledParkings(null), []);
  assert.deepEqual(resolveCancelledParkings({}), []);
});

const withDetails = doc => ({ ...doc, parkingDetails: resolveCancelledParkings(doc) });

test('A-9：換戶已轉出的車位計入成交總價，回到原成交 3,265 萬', () => {
  const item = withDetails({
    projectId: 'p1', unitId: 'A-9', salesStatus_backend: '簽約', price_transaction_house: 3010, price_floor_house_total: 3000,
    parkingData: [],
    持有車位: [{ spotId: 'B3-115', price_transaction: 255, price_floor: 255, status_backend: '簽約' }],
  });
  assert.equal(calculateTotalTransactionPrice(item), 3265);
  assert.equal(calculatePremiumPrice(item), 10);
  assert.equal(parkingStateLabel(item.parkingDetails[0]), '已轉出');
});

test('D-15：準備購買的車位列出但不計入，成交總價 3,734 萬', () => {
  const item = withDetails({
    projectId: 'p1', unitId: 'D-15', salesStatus_backend: '小訂', price_transaction_house: 3569,
    parkingData: [
      bound('B6-13', { buyerUnitId: 'D-15', status_backend: '小訂', price_transaction: 165 }),
      bound('B6-13A', { buyerUnitId: 'D-15', status_backend: '已售', price_transaction: 175 }),
    ],
  });
  assert.equal(item.parkingDetails.length, 2);
  assert.equal(calculateTotalTransactionPrice(item), 3734);
  assert.equal(parkingStateLabel(item.parkingDetails[1]), '準備購買');
});

test('A5-9：快照上的車位狀態事後改成保留，仍計入，維持原成交 2,986 萬', () => {
  const item = withDetails({
    projectId: 'p1', unitId: 'A5-9', salesStatus_backend: '小訂', price_transaction_house: 2651,
    parkingData: [bound('B1-086', { buyerUnitId: 'A5-9', status_backend: '保留', price_transaction: 335 })],
    持有車位: [{ spotId: 'B1-086', price_transaction: 335 }],
  });
  assert.equal(calculateTotalTransactionPrice(item), 2986);
  assert.equal(parkingStateLabel(item.parkingDetails[0]), '');
});

test('尚未部署新後端的回應（沒有 countsToDeal）仍照舊全部計入', () => {
  const item = { price_transaction_house: 100, parkingDetails: [{ spotId: 'B1', price_transaction: 50 }] };
  assert.equal(calculateTotalTransactionPrice(item), 150);
  assert.equal(parkingStateLabel(item.parkingDetails[0]), '');
});

test('標示與列表文字', () => {
  assert.equal(parkingStateLabel({ movedOut: true, movedToUnitId: 'D-8' }), '已轉 D-8');
  assert.equal(parkingStateLabel({ movedOut: true, movedToUnitId: '' }), '已轉出');
  assert.equal(parkingStateLabel({ movedOut: false, countsToDeal: true }), '');
  assert.equal(parkingLineText({ spotId: 'B3-115', price_transaction: 1255 }), 'B3-115 · 1,255 萬');
  assert.equal(parkingLineText({ spotId: 'B3-115', price_transaction: null }), 'B3-115');
});
