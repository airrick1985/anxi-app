import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COLUMN_DEFINITIONS,
  SALES_EXCEL_PARKING_COLUMNS,
  SALES_EXCEL_LAND_SHEET_KEY,
  buildSalesExcelExportGroups,
} from '../../src/constants/householdColumns.js';

const groups = buildSalesExcelExportGroups(COLUMN_DEFINITIONS, '土地標的清冊');
const keysOf = (gKey) => groups.find(g => g.key === gKey).items.map(i => i.key);

test('每個可匯出欄位剛好出現一次，戶別固定匯出不列入勾選', () => {
  const all = groups.flatMap(g => g.items.map(i => i.key));
  assert.equal(new Set(all).size, all.length);
  const expected = [
    ...COLUMN_DEFINITIONS.map(c => c.key).filter(k => k !== 'unitId'),
    ...SALES_EXCEL_PARKING_COLUMNS.map(c => c.key),
    SALES_EXCEL_LAND_SHEET_KEY,
  ];
  assert.deepEqual([...all].sort(), [...expected].sort());
  assert.ok(!all.includes('unitId'));
});

test('欄位依類別分組', () => {
  assert.deepEqual(groups.map(g => g.label), ['基本資料', '買方資料', '面積', '價格', '付款／匯款帳戶', '標籤與圖檔', '車位與合計', '其他工作表']);
  assert.ok(keysOf('basic').includes('building'));
  assert.ok(keysOf('basic').includes('salesStatus_backend'));
  assert.ok(keysOf('buyer').includes('buyerName'));
  assert.ok(keysOf('buyer').includes('referrerPhone'));
  assert.ok(keysOf('area').includes('build_no'));
  assert.ok(keysOf('area').includes('land_share_ratio'));
  assert.ok(keysOf('price').includes('price_transaction_house'));
  assert.ok(keysOf('price').includes('landPriceRatio'));
  assert.ok(keysOf('payment').includes('payment_contract_date'));
  assert.ok(keysOf('payment').includes('houseBankAccountName'));
  assert.ok(keysOf('display').includes('unitTags_text'));
  assert.ok(keysOf('display').includes('contractDrawingFolderUrl'));
  assert.deepEqual(keysOf('sheet'), [SALES_EXCEL_LAND_SHEET_KEY]);
});

test('新增的未知欄位歸入基本資料', () => {
  const g = buildSalesExcelExportGroups([{ key: 'unitId', title: '戶別' }, { key: 'someNewField', title: '新欄位' }], '土地標的清冊');
  assert.deepEqual(g[0].items, [{ key: 'someNewField', label: '新欄位' }]);
});
