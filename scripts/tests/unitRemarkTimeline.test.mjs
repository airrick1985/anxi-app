import test from 'node:test';
import assert from 'node:assert/strict';
import { buildUnitRemarkTimeline } from '../../src/utils/unitRemarkTimeline.js';

const ts = iso => ({ seconds: Math.floor(new Date(iso).getTime() / 1000) });

test('一則一段：置頂最前，其餘依日期新到舊，沒有日期的排最後', () => {
  const unit = {
    unitId: 'A1',
    remarkNotes: [
      { noteId: 'n1', type: 'user', category: 'finance', content: '舊留言', authorName: '王', createdAt: ts('2026-01-05T02:00:00Z') },
      { noteId: 'n2', type: 'user', category: 'general', content: '新留言', authorName: '李', createdAt: ts('2026-10-01T02:00:00Z'), updatedAt: ts('2026-10-02T02:00:00Z') },
      { noteId: 'n3', type: 'system', content: '置頂但較舊', authorName: '', createdAt: ts('2025-12-01T02:00:00Z'), pinned: true },
    ],
    referralFees: [{ id: 'rf1', name: '介紹人', phone: '0912', amount: 40000, remark: '月底付' }],
  };
  const records = [
    { id: 'c1', unitId: 'A1', period: 2, status: 'active', requestDate: '2026/06/30', ratioPct: 50, note: '第二期' },
    { id: 'c0', unitId: 'A1', period: 1, status: 'voided', requestDate: '2026/03/31', ratioPct: 50, note: '作廢不列' },
    { id: 'c2', unitId: 'B9', period: 1, status: 'active', requestDate: '2026/09/30', ratioPct: 100, note: '他戶不列' },
    { id: 'c3', unitId: 'A1', period: 3, status: 'active', requestDate: '2026/08/31', ratioPct: 50, note: '' },
  ];
  const items = buildUnitRemarkTimeline({ unitId: 'A1', unit, records, cancelled: [] });
  assert.deepEqual(items.map(i => i.key), ['sales:n3', 'sales:n2', 'record:c1', 'sales:n1', 'feeGift:rf1']);
  assert.equal(items[0].by, '系統');
  assert.deepEqual(items[1].tags.map(t => t.text), ['已編輯']);
  assert.deepEqual(items[3].tags.map(t => t.text), ['財務']);
  assert.equal(items[2].title, '請佣 第 2 期');
  assert.equal(items[2].date, '2026/06/30');
  assert.equal(items[4].title, '介紹費・介紹人');
  assert.equal(items[4].content, '月底付');
  assert.equal(items[4].date, '');
});

test('舊字串備註沒有日期；退戶紀錄依前買方分段，舊備註以退戶日排序', () => {
  const unit = { unitId: 'A1', remarks: '介紹費4萬' };
  const cancelled = [
    {
      docId: 'x1', unitId: 'A1', buyerName: '前買方甲', cancellationDate: '2026-03-02', operatorName: '櫃台',
      cancelReasons: ['貸款不足'], remarks: '退訂金一半', remarkNotes: [], isRestored: false,
    },
    { docId: 'x2', unitId: 'A1', buyerName: '已刪除', cancellationDate: '2026-04-01', isDeleted: true, remarks: '不列' },
  ];
  const items = buildUnitRemarkTimeline({ unitId: 'A1', unit, cancelled });
  assert.deepEqual(items.map(i => i.source), ['cancelled', 'cancelled', 'sales']);
  assert.equal(items[0].title, '前買方 前買方甲');
  assert.equal(items[0].date, '2026/03/02');
  assert.ok(items.some(i => i.lines.some(l => l.label === '退戶原因' && l.text === '貸款不足')));
  assert.equal(items[2].by, '舊備註');
  assert.equal(items[2].date, '');
});

test('退佣原因與每人獎金備註併入該筆紀錄', () => {
  const records = [
    { id: 'r1', unitId: 'A1', period: 4, type: 'refund', status: 'active', requestDate: '2026/10/31', refundRatioPct: 50, reason: '買方解約', note: '' },
    { id: 'b1', unitId: 'A1', period: 2, submissionType: 'bonus', status: 'active', requestDate: '2026/07/15', ratioPct: 100, note: '' },
  ];
  const bonusRows = [
    { commissionRecordId: 'b1', status: 'active', name: '王', remark: '交屋保留' },
    { commissionRecordId: 'b1', status: 'voided', name: '李', remark: '作廢明細不列' },
  ];
  const items = buildUnitRemarkTimeline({ unitId: 'A1', unit: null, records, bonusRows });
  assert.deepEqual(items.map(i => i.title), ['退佣 第 4 期', '獎金 第 2 期']);
  assert.deepEqual(items[0].lines, [{ label: '原因', text: '買方解約' }]);
  assert.deepEqual(items[0].tags.map(t => t.text), ['退回 50%']);
  assert.deepEqual(items[1].lines, [{ label: '人員備註', text: '王：交屋保留' }]);
});
