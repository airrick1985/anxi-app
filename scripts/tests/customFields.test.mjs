import test from 'node:test';
import assert from 'node:assert/strict';
import {
  customFieldKey, parseNumberInput, parseBooleanInput, coerceCellForField, excelPercentValue,
  formatCustomFieldValue, excelNumberFormat, makeFieldKey, guessFieldFormat, parsePastedTable,
  buildCustomFieldColDef, fieldFormatSummary,
} from '../../src/utils/customFields.js';

const cell = (v, w = typeof v === 'string' ? v : undefined) => ({ v, w });

test('資料 key：有 fieldKey 用 fieldKey，舊欄位用 fieldName', () => {
  assert.equal(customFieldKey({ fieldName: '新名稱', fieldKey: '舊名稱' }), '舊名稱');
  assert.equal(customFieldKey({ fieldName: '坪數' }), '坪數');
});

test('數字輸入：千分位、單位、%、全形、貨幣符號', () => {
  assert.deepEqual(parseNumberInput('1,234.5'), { ok: true, value: 1234.5, percent: false });
  assert.deepEqual(parseNumberInput('30坪'), { ok: true, value: 30, percent: false });
  assert.deepEqual(parseNumberInput('5%'), { ok: true, value: 5, percent: true });
  assert.deepEqual(parseNumberInput('１２３'), { ok: true, value: 123, percent: false });
  assert.deepEqual(parseNumberInput('NT$1,000'), { ok: true, value: 1000, percent: false });
  assert.deepEqual(parseNumberInput('-2.5'), { ok: true, value: -2.5, percent: false });
  assert.deepEqual(parseNumberInput(42), { ok: true, value: 42, percent: false });
  assert.deepEqual(parseNumberInput(''), { empty: true });
  assert.deepEqual(parseNumberInput('  '), { empty: true });
  assert.deepEqual(parseNumberInput(null), { empty: true });
  assert.equal(parseNumberInput('約30').ok, false);
  assert.equal(parseNumberInput('1.2.3').ok, false);
  assert.equal(parseNumberInput('3F-5').ok, false);
  assert.equal(parseNumberInput('abc').ok, false);
});

test('開關輸入', () => {
  assert.deepEqual(parseBooleanInput('TRUE'), { ok: true, value: true });
  assert.deepEqual(parseBooleanInput('否'), { ok: true, value: false });
  assert.deepEqual(parseBooleanInput(true), { ok: true, value: true });
  assert.deepEqual(parseBooleanInput(''), { empty: true });
  assert.equal(parseBooleanInput('也許').ok, false);
});

test('％：系統匯出的 5"%" 維持 5；Excel 打 5% 的 0.05 換成 5', () => {
  assert.equal(excelPercentValue(5, '5%'), 5);
  assert.equal(excelPercentValue(0.05, '5%'), 5);
  assert.equal(excelPercentValue(0.125, '12.50%'), 12.5);
  assert.equal(excelPercentValue(7, undefined), 7);
  const def = { fieldType: 'percent', decimals: 1 };
  assert.deepEqual(coerceCellForField(def, cell(0.05, '5%')), { ok: true, value: 5 });
  assert.deepEqual(coerceCellForField(def, cell('12.5%')), { ok: true, value: 12.5, percent: true });
  assert.deepEqual(coerceCellForField(def, cell(8, '8')), { ok: true, value: 8 });
});

test('文字欄用 Excel 顯示文字、去頭尾空白', () => {
  assert.deepEqual(coerceCellForField({ fieldType: 'text' }, { v: 45678, w: '2025/1/21' }), { ok: true, value: '2025/1/21' });
  assert.deepEqual(coerceCellForField({ fieldType: 'select' }, cell('  A 方案 ')), { ok: true, value: 'A 方案' });
  assert.deepEqual(coerceCellForField({ fieldType: 'text' }, cell('')), { empty: true });
});

test('顯示：千分位＋小數＋單位、%、舊文字照原文', () => {
  assert.equal(formatCustomFieldValue(1234.5, { fieldType: 'number', decimals: 2, unit: '坪' }), '1,234.50 坪');
  assert.equal(formatCustomFieldValue(1234.567, { fieldType: 'number', decimals: 0 }), '1,235');
  assert.equal(formatCustomFieldValue(5, { fieldType: 'percent', decimals: 0 }), '5%');
  assert.equal(formatCustomFieldValue(12.345, { fieldType: 'percent', decimals: 1 }), '12.3%');
  assert.equal(formatCustomFieldValue('約30', { fieldType: 'number' }), '約30');
  assert.equal(formatCustomFieldValue('30', { fieldType: 'number', decimals: 1 }), '30.0');
  assert.equal(formatCustomFieldValue(null, { fieldType: 'number' }), '');
});

test('Excel 數值格式', () => {
  assert.equal(excelNumberFormat({ fieldType: 'number', decimals: 2, unit: '坪' }), '#,##0.00" 坪"');
  assert.equal(excelNumberFormat({ fieldType: 'number', decimals: 0 }), '#,##0');
  assert.equal(excelNumberFormat({ fieldType: 'percent', decimals: 1 }), '#,##0.0"%"');
});

test('建立 key：去掉路徑字元、與既有重複加序號', () => {
  assert.equal(makeFieldKey('No.1 戶', new Set()), 'No_1 戶');
  assert.equal(makeFieldKey('坪數', new Set(['坪數', '坪數_2'])), '坪數_3');
  assert.equal(makeFieldKey('a/b', new Set()), 'a_b');
});

test('猜格式：數字帶單位、％、開關、文字', () => {
  assert.deepEqual(guessFieldFormat([cell('30坪'), cell('45.25坪'), cell('')]), { fieldType: 'number', decimals: 2, unit: '坪' });
  assert.deepEqual(guessFieldFormat([cell(1200, '1,200'), cell(30, '30')]), { fieldType: 'number', decimals: 0, unit: '' });
  assert.deepEqual(guessFieldFormat([cell('5%'), cell('12.5%')]), { fieldType: 'percent', decimals: 1, unit: '' });
  assert.deepEqual(guessFieldFormat([cell(0.05, '5%'), cell(0.1, '10%')]), { fieldType: 'percent', decimals: 0, unit: '' });
  assert.equal(guessFieldFormat([cell(true, 'TRUE'), cell('FALSE')]).fieldType, 'checkbox');
  assert.equal(guessFieldFormat([cell('約30'), cell('40')]).fieldType, 'text');
  assert.equal(guessFieldFormat([cell(''), cell('')]).fieldType, 'text');
});

test('貼上：Tab 分隔、引號多行、去掉空白列', () => {
  const rows = parsePastedTable('戶號\t坪數\r\nA1-3F\t30\r\nA1-4F\t"多\n行"\r\n\r\n');
  assert.equal(rows.length, 3);
  assert.deepEqual(rows[0].map(c => c.v), ['戶號', '坪數']);
  assert.deepEqual(rows[2].map(c => c.v), ['A1-4F', '多\n行']);
  const csv = parsePastedTable('戶號,值\nA,1');
  assert.deepEqual(csv[1].map(c => c.v), ['A', '1']);
});

test('Grid 欄位：數字欄解析輸入、無效輸入不寫入', () => {
  const def = { fieldName: '坪數', fieldKey: 'area', fieldType: 'number', decimals: 1, unit: '坪' };
  const invalid = [];
  const col = buildCustomFieldColDef(def, { onInvalidInput: (d, raw) => invalid.push(raw) });
  assert.equal(col.field, 'area');
  assert.equal(col.headerName, '坪數');
  const data = {};
  assert.equal(col.valueSetter({ data, newValue: '1,234.5 坪' }), true);
  assert.equal(data.area, 1234.5);
  assert.equal(col.valueSetter({ data, newValue: '約30' }), false);
  assert.deepEqual(invalid, ['約30']);
  assert.equal(data.area, 1234.5);
  assert.equal(col.valueSetter({ data, newValue: '' }), true);
  assert.equal(data.area, null);
  assert.equal(col.valueFormatter({ value: 1234.5 }), '1,234.5 坪');
  assert.equal(col.comparator(2, 10) < 0, true);
  assert.equal(col.filterValueGetter({ data: { area: '12' } }), 12);
});

test('清單摘要', () => {
  assert.equal(fieldFormatSummary({ fieldType: 'number', decimals: 2, unit: '坪' }), '數字 · 2 位小數 · 坪');
  assert.equal(fieldFormatSummary({ fieldType: 'select', options: ['a', 'b'] }), '下拉 · 2 個選項');
  assert.equal(fieldFormatSummary({ fieldType: 'percent', decimals: 0 }), '％');
});
