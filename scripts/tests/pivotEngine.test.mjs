import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COUNT_FIELD, EMPTY, PIVOT_CELL_SEP, anyDateStr, applyPivotFilters, computePivot, daysDiff, filterByDateRange,
  sortPivotRows, weekLabelOf, weekdayOf,
} from '../../src/utils/pivotEngine.js';
import { buildCustomerDataset, buildLogRows, buildLogDataset } from '../../src/utils/customerPivotConfig.js';
import {
  buildLeadDataset, buildReportDataset, buildReportRows, leadMarkLabel, leadSourceLabel,
} from '../../src/utils/leadPivotConfig.js';

const pivot = (dataset, overrides = {}) => computePivot({
  items: dataset.items,
  rowDims: dataset.defaults.rowDims,
  colDims: dataset.defaults.colDims,
  valueDefs: dataset.defaults.values,
  dimensionMap: new Map(dataset.dimensions.map(d => [d.key, d])),
  countFields: dataset.countFields,
  ...overrides,
});

test('anyDateStr 將各種格式換算成台灣日期', () => {
  assert.equal(anyDateStr('2026/1/2'), '2026-01-02');
  assert.equal(anyDateStr('2026-01-02'), '2026-01-02');
  assert.equal(anyDateStr('2026年6月11日 下午9:46'), '2026-06-11');
  // 帶時區的 ISO 要換算：UTC 3/1 17:30 是台灣 3/2
  assert.equal(anyDateStr('2026-03-01T17:30:00.000Z'), '2026-03-02');
  assert.equal(anyDateStr({ _seconds: Date.UTC(2026, 2, 1, 17, 30) / 1000 }), '2026-03-02');
  assert.equal(anyDateStr({ toDate: () => new Date(Date.UTC(2026, 2, 1, 15, 59)) }), '2026-03-01');
  assert.equal(anyDateStr(''), '');
  assert.equal(anyDateStr('亂寫'), '');
});

test('週與星期以週一為一週開始', () => {
  assert.equal(weekLabelOf('2026-11-04'), '2026-11-02～11-08');
  assert.equal(weekLabelOf('2026-11-08'), '2026-11-02～11-08');
  assert.equal(weekLabelOf('2026-11-09'), '2026-11-09～11-15');
  assert.equal(weekLabelOf(''), '');
  assert.equal(weekdayOf('2026-11-04'), '星期三');
  assert.equal(daysDiff('2026-11-01', '2026-11-04'), 3);
  assert.equal(daysDiff('', '2026-11-04'), '');
});

const dims = new Map([
  ['team', { key: 'team', label: '組別' }],
  ['people', { key: 'people', label: '人員', multi: true, get: r => r.people }],
  ['status', { key: 'status', label: '狀態', order: ['新', '舊'] }],
  ['visitors', { key: 'visitors', label: '人數', numeric: true }],
]);
const rows = [
  { id: 1, team: 'A', people: ['甲', '乙'], status: '新', visitors: 2 },
  { id: 2, team: 'A', people: ['甲'], status: '舊', visitors: 4 },
  { id: 3, team: 'B', people: [], status: '舊', visitors: '' },
];
const counts = [
  { key: COUNT_FIELD, label: '筆數' },
  { key: '__ids__', label: '不重複', distinctOf: r => r.team },
];

test('多值欄位每人分計：各列加總可大於總計，總計不重複', () => {
  const m = computePivot({
    items: rows, rowDims: ['people'], colDims: [], valueDefs: [{ field: COUNT_FIELD, mode: 'count' }],
    dimensionMap: dims, countFields: counts,
  });
  const byName = Object.fromEntries(m.rows.map(r => [r.parts[0], r.totalValues[0]]));
  assert.deepEqual(byName, { 甲: 2, 乙: 1, [EMPTY]: 1 });
  assert.equal(m.grand.values[0], 3);
  assert.equal(m.rows.at(-1).parts[0], EMPTY, '未填寫排最後');
  assert.equal(m.colKeys.length, 1);
});

test('欄維度依 order 排序，總計與下鑽明細正確', () => {
  const m = computePivot({
    items: rows, rowDims: ['team'], colDims: ['status'], valueDefs: [{ field: COUNT_FIELD, mode: 'count' }],
    dimensionMap: dims, countFields: counts,
  });
  assert.deepEqual(m.colKeys, ['新', '舊']);
  const a = m.rows.find(r => r.parts[0] === 'A');
  assert.equal(a.cells['新'].values[0], 1);
  assert.equal(a.cells['舊'].values[0], 1);
  assert.equal(a.totalValues[0], 2);
  const b = m.rows.find(r => r.parts[0] === 'B');
  assert.equal(b.cells['新'].values[0], 0);
  assert.equal(m.colTotals['舊'].values[0], 2);
  assert.deepEqual(m.itemsByCell.get(`A${PIVOT_CELL_SEP}舊`).map(r => r.id), [2]);
  assert.deepEqual(m.itemsByCell.get(`__col__${PIVOT_CELL_SEP}舊`).map(r => r.id), [2, 3]);
  assert.equal(m.itemsByCell.get('__grand__').length, 3);
});

test('值：不重複計數、有填筆數、數值加總平均最大最小（空值不計入平均）', () => {
  const valueDefs = [
    { field: '__ids__', mode: 'count' },
    { field: 'people', mode: 'distinct' },
    { field: 'people', mode: 'filled' },
    { field: 'visitors', mode: 'sum' },
    { field: 'visitors', mode: 'avg' },
    { field: 'visitors', mode: 'max' },
    { field: 'visitors', mode: 'min' },
  ];
  const m = computePivot({ items: rows, rowDims: ['team'], colDims: [], valueDefs, dimensionMap: dims, countFields: counts });
  assert.deepEqual(m.grand.values, [2, 2, 2, 6, 3, 4, 2]);
  const b = m.rows.find(r => r.parts[0] === 'B');
  assert.deepEqual(b.totalValues, [1, 0, 0, 0, null, null, null], '無數值時平均／最大／最小為空');
});

test('手動欄順序與結果排序', () => {
  const m = computePivot({
    items: rows, rowDims: ['team'], colDims: ['status'], valueDefs: [{ field: COUNT_FIELD, mode: 'count' }],
    dimensionMap: dims, countFields: counts, colKeyOrder: ['舊', '新'],
  });
  assert.deepEqual(m.colKeys, ['舊', '新']);
  const asc = sortPivotRows(m.rows, { type: 'total', vi: 0, dir: 'asc' }, ['team'], dims);
  assert.deepEqual(asc.map(r => r.parts[0]), ['B', 'A']);
  const desc = sortPivotRows(m.rows, { type: 'name', li: 0, dir: 'desc' }, ['team'], dims);
  assert.deepEqual(desc.map(r => r.parts[0]), ['B', 'A']);
  assert.equal(sortPivotRows(m.rows, null, ['team'], dims), m.rows);
});

test('日期起訖與篩選器', () => {
  const list = [{ d: '2026-01-05', t: 'x' }, { d: '2026-02-05', t: 'y' }, { d: '', t: 'x' }];
  assert.equal(filterByDateRange(list, r => r.d, '', '').length, 3);
  assert.deepEqual(filterByDateRange(list, r => r.d, '2026-02-01', '').map(r => r.t), ['y']);
  assert.equal(filterByDateRange(list, r => r.d, '2026-01-01', '2026-12-31').length, 2, '填起訖時沒有日期的不列入');

  const m = new Map([
    ['t', { key: 't', label: 'T' }],
    ['day', { key: 'day', label: '日', kind: 'date', get: r => [r.d] }],
  ]);
  assert.equal(applyPivotFilters(list, [{ field: 't', selected: ['x'] }], m).length, 2);
  assert.equal(applyPivotFilters(list, [{ field: 'day', selected: [], from: '2026-02-01', to: '' }], m).length, 1);
  assert.equal(applyPivotFilters(list, [{ field: 't', selected: ['y'] }, { field: 'day', selected: [], from: '2026-03-01' }], m).length, 0);
  assert.equal(applyPivotFilters(list, [{ field: '已移除', selected: ['y'] }], m).length, 3, '欄位已不存在時略過');
});

test('客戶資料集：不含已刪除、同客戶多銷售不重複、profile 優先、所有欄位都可用', () => {
  const settings = {
    fields: { age: { options: ['20-30', '31-40'] } },
    vipFormFields: {
      a: { label: '購屋動機', order: 1, selectionMode: 'multiple', options: ['自住', '投資'] },
      b: { label: '聯絡電話', order: 2 },
      c: { label: '購屋預算', order: 3, options: ['1000萬', '2000萬'] },
    },
  };
  const list = [
    { docId: 'd1', '銷售人員': '王', '等級研判': 'B有機會', '拜訪日期': '2026-10-01', '年齡': '20-30', profileAttrs: { '年齡': ['20-30', '31-40'], '性別': '' }, '性別': '女', '購屋動機': ['自住', '投資'] },
    { docId: 'd1', '銷售人員': '李', '等級研判': 'B有機會', '拜訪日期': '2026-10-01', '年齡': '20-30', profileAttrs: { '年齡': ['20-30', '31-40'], '性別': '' }, '性別': '女', '購屋動機': ['自住', '投資'] },
    { docId: 'd2', '銷售人員': '王', '等級研判': 'A意願高', '年齡': '20-30', '性別': '男', '購屋動機': ['投資'] },
    { docId: 'd3', '銷售人員': '王', isDeleted: true, '等級研判': 'A意願高' },
  ];
  const ds = buildCustomerDataset({ list, settings });
  assert.equal(ds.items.length, 3);
  const labels = ds.dimensions.map(d => d.label);
  for (const label of ['姓名', '電話', '聯絡電話', '銷售人員電話', '任職公司', '居住詳細地址', '其他聯絡人姓名', '其他聯絡人電話', '關聯建案', '最新洽談內容', '最後更新日期']) {
    assert(labels.includes(label), `缺少欄位：${label}`);
  }
  assert.equal(new Set(labels).size, labels.length, '欄位名稱不重複');
  assert.equal(new Set(ds.dimensions.map(d => d.key)).size, labels.length, '欄位鍵不重複');

  const m = pivot(ds);
  assert.deepEqual(m.colKeys, ['A意願高', 'B有機會'], '等級依選項排序');
  assert.equal(m.grand.values[0], 2, '客戶數不重複');
  assert.equal(m.rows.find(r => r.parts[0] === '王').totalValues[0], 2);
  assert.equal(m.rows.find(r => r.parts[0] === '李').totalValues[0], 1);

  const agePivot = pivot(ds, { rowDims: ['p:age'], colDims: [], valueDefs: [{ field: COUNT_FIELD, mode: 'count' }] });
  assert.deepEqual(agePivot.rows.map(r => r.parts[0]), ['20-30', '31-40'], 'profile 陣列取最新值、舊後端退回提交資料');
  const gender = pivot(ds, { rowDims: ['p:gender'], colDims: [], valueDefs: [{ field: COUNT_FIELD, mode: 'count' }] });
  assert.deepEqual(gender.rows.map(r => r.parts[0]), ['男', EMPTY], 'profile 已清空時不退回舊提交資料');
  const motive = pivot(ds, { rowDims: ['vip:購屋動機'], colDims: [], valueDefs: [{ field: '__customers__', mode: 'count' }] });
  assert.deepEqual(Object.fromEntries(motive.rows.map(r => [r.parts[0], r.totalValues[0]])), { 自住: 1, 投資: 2 });
});

test('自訂表單欄位從資料自動列出：取最新值、不拆逗號、系統欄位與圖片不列入', () => {
  const list = [
    { docId: 'd1', '姓名': '甲', '電話': '09', '銷售人員': '王', '家庭成員': '夫妻,兩小孩', '購屋動機_其他': '換屋', submissionSource: 'public_form', '簽名': 'data:image/png;base64,AAAA', lineUserId: 'U1', '巢狀': { a: 1 },
      profileAttrs: { '家庭成員': ['單身', '夫妻,兩小孩'], '只有輪廓有': '有值' } },
    { docId: 'd2', '姓名': '乙', '電話': '08', '銷售人員': '王', '家庭成員': '單身', '簽名': '已簽' },
  ];
  const ds = buildCustomerDataset({ list, settings: { fields: {}, vipFormFields: {} } });
  const labels = ds.dimensions.map(d => d.label);
  assert(labels.includes('家庭成員'));
  assert(labels.includes('購屋動機_其他'));
  assert(labels.includes('只有輪廓有'), '只存在 profile 的欄位也要列出');
  assert(!labels.includes('簽名'), '含 data URI 的欄位不列入');
  assert(!labels.includes('巢狀'), '物件欄位不列入');
  assert(!labels.includes('lineUserId'), '系統欄位不列入');
  assert.equal(labels.filter(l => l === '姓名').length, 1);
  const m = pivot(ds, { rowDims: ['auto:家庭成員'], colDims: [], valueDefs: [{ field: COUNT_FIELD, mode: 'count' }] });
  assert.deepEqual(m.rows.map(r => r.parts[0]).sort(), ['單身', '夫妻,兩小孩'].sort());

  const name = pivot(ds, { rowDims: ['name'], colDims: ['phone'], valueDefs: [{ field: COUNT_FIELD, mode: 'count' }] });
  assert.equal(name.rows.find(r => r.parts[0] === '甲').cells['09'].values[0], 1);
  const source = pivot(ds, { rowDims: ['submissionSource'], colDims: [], valueDefs: [{ field: COUNT_FIELD, mode: 'count' }] });
  assert(source.rows.some(r => r.parts[0] === '客戶表單'));
});

test('關聯建案與其他聯絡人', () => {
  const list = [
    { docId: 'd1', '銷售人員': '王', isLinked: true, sourceProjectId: 'p2', linkedProjectIds: ['p1', 'p3'], otherPhones: [{ name: '配偶', phone: '0900', relation: '夫妻' }, { name: '兒子', phone: '0911', relation: '親子' }] },
  ];
  const ds = buildCustomerDataset({ list, settings: null, projectNames: { p2: '森之丘', p1: '首馥' } });
  const row = (key) => pivot(ds, { rowDims: [key], colDims: [], valueDefs: [{ field: COUNT_FIELD, mode: 'count' }] }).rows.map(r => r.parts[0]);
  assert.deepEqual(row('sourceProject'), ['森之丘']);
  assert.deepEqual(row('linkedProjects').sort(), ['p3', '首馥'].sort(), '名稱對不到時顯示 id');
  assert.deepEqual(row('other:name').sort(), ['兒子', '配偶'].sort());
  assert.deepEqual(row('other:relation').sort(), ['夫妻', '親子'].sort());
  assert.deepEqual(row('origin'), ['關聯建案']);
});

test('洽談紀錄資料集：只算本案、銷售只看自己、新客回訪依序判定', () => {
  const raw = [
    {
      id: 'c1', projectId: 'p1', phone: '0911', latestName: '甲', activeSalesName: '王', latestSalesPhone: '0900',
      profile: { '年齡': '31-40' },
      interactionLogs: [
        { date: '2026-10-05', startTime: '14:30', endTime: '15:30', recorderName: '王', tags: { interactionType: '現場介紹', rating: 'B有機會', visitors: '2人', noPurchaseReason: ['總價'] } },
        { date: '2026-10-01', startTime: '09:00', endTime: '09:20', recorderName: '王', tags: { interactionType: '現場介紹', visitors: '3' } },
        { date: '2026-10-07', recorderName: '櫃台', tags: { interactionType: '電話', keyTags: ['急'] } },
        { date: '2026-10-08', sourceProjectId: 'p2', tags: { interactionType: '現場介紹' } },
      ],
      submissions: [],
    },
    {
      id: 'c2', projectId: 'p1', phone: '0922', latestName: '乙', activeSalesName: '李', latestSalesPhone: '0901',
      interactionLogs: [{ date: '2026-10-09', tags: { interactionType: '現場介紹' } }], submissions: [],
    },
    { id: 'c3', projectId: 'p1', isAllSalesDeleted: true, interactionLogs: [{ date: '2026-10-09', tags: { interactionType: '現場介紹' } }] },
  ];
  const all = buildLogRows(raw, 'p1', { canSeeAll: true });
  assert.equal(all.length, 4);
  const own = buildLogRows(raw, 'p1', { canSeeAll: false, user: { name: '王', key: '0900' } });
  assert.deepEqual([...new Set(own.map(r => r.customerId))], ['c1']);

  const ds = buildLogDataset({ rows: all, settings: { fields: {}, vipFormFields: {} } });
  const logLabels = ds.dimensions.map(d => d.label);
  for (const label of ['姓名', '電話', '洽談內容', '記錄人電話', '結束時間', '其他聯絡人姓名', '年齡', '客戶建檔月份']) {
    assert(logLabels.includes(label), `缺少欄位：${label}`);
  }
  assert.equal(new Set(logLabels).size, logLabels.length, '欄位名稱不重複');
  assert.equal(new Set(ds.dimensions.map(d => d.key)).size, logLabels.length, '欄位鍵不重複');
  const m = pivot(ds, { valueDefs: [{ field: COUNT_FIELD, mode: 'count' }, { field: '__customers__', mode: 'count' }] });
  assert.deepEqual(m.grand.values, [4, 2]);
  assert.equal(m.rows.find(r => r.parts[0] === '王').cells['現場介紹'].values[0], 2);

  const kind = pivot(ds, { rowDims: ['visitKind'], colDims: [], valueDefs: [{ field: COUNT_FIELD, mode: 'count' }] });
  assert.deepEqual(Object.fromEntries(kind.rows.map(r => [r.parts[0], r.totalValues[0]])), { 新客: 2, 回訪: 1, [EMPTY]: 1 });

  const nums = pivot(ds, { rowDims: [], colDims: [], valueDefs: [{ field: 'visitors', mode: 'sum' }, { field: 'minutes', mode: 'avg' }] });
  assert.deepEqual(nums.grand.values, [5, 40], '來客 2+3；洽談 (60+20)/2');
  assert.deepEqual(pivot(ds, { rowDims: ['hour'], colDims: [], valueDefs: [] }).rows.map(r => r.parts[0]), ['09:00', '14:00', EMPTY]);
});

test('名單資料集：來源歸類、未處理、標記、回報天數', () => {
  assert.equal(leadSourceLabel('臉書廣告', '森之丘'), 'FB');
  assert.equal(leadSourceLabel('舊官網', '森之丘'), '森之丘官網');
  assert.equal(leadSourceLabel('', '森之丘'), '未註明');
  assert.equal(leadMarkLabel('🚩 既有客資 (來客: 王 / 銷售: 李) ＋ ⚠️ 重複名單'), '既有客資');
  assert.equal(leadMarkLabel('✨ 全新名單'), '全新名單');
  assert.equal(leadMarkLabel(''), '');

  const leads = [
    { id: 'a', name: '甲', phone: '0911', source: 'FB', assignedName: '王', status: '未接', date: '2026/10/01', assignedAt: '2026-10-02', lastReportedAt: '2026-10-05', statusText: '✨ 全新名單' },
    { id: 'b', name: '甲', phone: '0911', source: 'fb', assignedName: '王', status: '', date: '2026年10月3日 下午1:00' },
    { id: 'c', name: '丙', phone: '0933', source: 'LINE', status: '不考慮', reason: '總價', date: '2026-10-20' },
  ];
  const ds = buildLeadDataset({
    leads, projectName: '森之丘', statusOptions: ['不考慮', '未接'], reservationsByPhone: new Map([['0911', [{}, {}]]]),
  });
  const labels = ds.dimensions.map(d => d.label);
  for (const label of ['姓名', '電話', '備註', '匯入人', '最後修改人', '最新回報內容', '賞屋預約', '預約筆數', '來源原文', '名單狀態原文']) {
    assert(labels.includes(label), `缺少欄位：${label}`);
  }
  assert.equal(new Set(labels).size, labels.length, '欄位名稱不重複');
  const reservation = pivot(ds, { rowDims: ['hasReservation'], colDims: [], valueDefs: [{ field: 'reservationCount', mode: 'sum' }] });
  assert.deepEqual(Object.fromEntries(reservation.rows.map(r => [r.parts[0], r.totalValues[0]])), { 有預約: 4, 無預約: 0 });
  const m = pivot(ds, { valueDefs: [{ field: COUNT_FIELD, mode: 'count' }, { field: '__phones__', mode: 'count' }] });
  assert.deepEqual(m.colKeys, ['未處理', '不考慮', '未接']);
  assert.deepEqual(m.grand.values, [3, 2]);
  assert.equal(m.rows.find(r => r.parts[0] === '未指派').cells['不考慮'].values[0], 1);
  const src = pivot(ds, { rowDims: ['source'], colDims: [], valueDefs: [{ field: COUNT_FIELD, mode: 'count' }] });
  assert.deepEqual(Object.fromEntries(src.rows.map(r => [r.parts[0], r.totalValues[0]])), { FB: 2, LINE: 1 });
  const month = pivot(ds, { rowDims: ['formMonth'], colDims: [], valueDefs: [{ field: COUNT_FIELD, mode: 'count' }] });
  assert.deepEqual(month.rows.map(r => r.parts[0]), ['2026-10']);
  const days = pivot(ds, { rowDims: [], colDims: [], valueDefs: [{ field: 'responseDays', mode: 'avg' }] });
  assert.equal(days.grand.values[0], 3);
  assert.equal(ds.openTarget(leads[0]), leads[0]);
});

test('回報紀錄資料集：只算傳入的名單，可對回原名單', () => {
  const leads = [
    { id: 'a', name: '甲', phone: '0911', source: 'FB', assignedName: '王', date: '2026/10/01' },
    { id: 'b', name: '乙', phone: '0922', source: 'IG', assignedName: '李', date: '2026/10/02' },
  ];
  const logs = [
    { leadId: 'a', status: '未接', createdBy: '王', createdAt: '2026-10-03T02:00:00.000Z' },
    { leadId: 'a', status: '不考慮', reason: '總價', createdBy: '王', createdAt: { toDate: () => new Date('2026-10-04T14:00:00Z') } },
    { leadId: 'b', status: '未接', createdBy: '櫃台', createdAt: '2026-10-03T03:00:00.000Z' },
    { leadId: '已刪除', status: '未接', createdBy: '王', createdAt: '2026-10-03T03:00:00.000Z' },
  ];
  assert.equal(buildReportRows(logs, leads).length, 3);
  assert.equal(buildReportRows(logs, [leads[0]]).length, 2, '銷售只算自己的名單');

  const ds = buildReportDataset({ logs, leads, projectName: '森之丘', statusOptions: ['不考慮', '未接'] });
  const reportLabels = ds.dimensions.map(d => d.label);
  for (const label of ['姓名', '電話', '回報內容', '備註', '名單目前聯絡狀況', '名單目前不考慮原因', '最後回報日期']) {
    assert(reportLabels.includes(label), `缺少欄位：${label}`);
  }
  assert.equal(new Set(reportLabels).size, reportLabels.length, '欄位名稱不重複');
  assert.equal(new Set(ds.dimensions.map(d => d.key)).size, reportLabels.length, '欄位鍵不重複');
  const m = pivot(ds, { valueDefs: [{ field: COUNT_FIELD, mode: 'count' }, { field: '__leads__', mode: 'count' }] });
  assert.deepEqual(m.colKeys, ['不考慮', '未接']);
  assert.deepEqual(m.grand.values, [3, 2]);
  assert.equal(m.rows.find(r => r.parts[0] === '王').totalValues[0], 2);
  const hour = pivot(ds, { rowDims: ['hour'], colDims: [], valueDefs: [{ field: COUNT_FIELD, mode: 'count' }] });
  assert.deepEqual(hour.rows.map(r => r.parts[0]), ['10:00', '11:00', '22:00'], '依台灣時間歸時段');
  const sales = pivot(ds, { rowDims: ['sales'], colDims: [], valueDefs: [{ field: COUNT_FIELD, mode: 'count' }] });
  assert.deepEqual(Object.fromEntries(sales.rows.map(r => [r.parts[0], r.totalValues[0]])), { 王: 2, 李: 1 });
  assert.equal(ds.openTarget(ds.items[0]).id, 'a');
});
