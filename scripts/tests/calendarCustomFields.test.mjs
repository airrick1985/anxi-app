import test from 'node:test';
import assert from 'node:assert/strict';
import { collectCalendarCustomFields, getCalendarCustomFieldValue } from '../../src/utils/calendarCustomFields.js';

const menu = ['初驗', '交屋'].map((title, index) => ({
  title,
  methods: [{ title: '委託驗屋', customFields: [
    { id: `company-${index}`, label: '驗屋公司名稱', expanded: true },
  ] }],
}));

test('同名欄位保留原選項 key，初驗與交屋各自讀取對應 ID', () => {
  const fields = collectCalendarCustomFields(menu);
  assert.equal(fields.length, 1);
  assert.equal(fields[0].key, 'company-0');
  for (const [index, bookingType] of ['初驗', '交屋'].entries()) {
    assert.equal(getCalendarCustomFieldValue({
      bookingType, inspectionMethod: '委託驗屋',
      bookingMethodDetails: { [`company-${index}`]: `${bookingType}公司` },
    }, fields[0]), `${bookingType}公司`);
  }
});

test('切換項目後不顯示其他項目殘留值，空值不冒用初驗資料', () => {
  const [field] = collectCalendarCustomFields(menu);
  assert.equal(getCalendarCustomFieldValue({
    bookingType: '交屋', inspectionMethod: '委託驗屋',
    bookingMethodDetails: { 'company-0': '舊公司', 'company-1': '' },
  }, field), null);
});

test('舊資料缺少項目資訊仍可依 ID 取值，保留 false 與 0', () => {
  const [field] = collectCalendarCustomFields(menu);
  for (const value of ['交屋公司', false, 0]) {
    assert.equal(getCalendarCustomFieldValue({ bookingMethodDetails: { 'company-1': value } }, field), value);
  }
  assert.equal(getCalendarCustomFieldValue({}, field), null);
  assert.equal(getCalendarCustomFieldValue({ bookingMethodDetails: { old: '公司' } }, { key: 'old' }), '公司');
});

test('保留既有欄位篩選，忽略未展開、已刪除方式與基礎欄位同名選項', () => {
  assert.deepEqual(collectCalendarCustomFields(undefined), []);
  assert.deepEqual(collectCalendarCustomFields(menu, ['驗屋公司名稱']), []);
  assert.deepEqual(collectCalendarCustomFields([{ methods: [
    { deleted: true, customFields: [{ id: 'a', label: '刪除', expanded: true }] },
    { customFields: [{ id: 'b', label: '隱藏', expanded: false }] },
  ] }]), []);
});
