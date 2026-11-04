/**
 * 客戶資料透視：資料集定義（客戶／洽談紀錄）
 *
 * - 客戶：直接用客戶列表資料（每位銷售各一筆，與列表筆數相同），不含已刪除
 * - 洽談紀錄：fetchFullCustomersForExport 展開成每次互動一筆，只算本案紀錄（與儀表板 prepareCustomers 相同）
 * - 客戶欄位以 profile 為準（與儀表板一致）；各建案自訂的表單欄位會從資料自動找出（表單欄位用中文鍵，系統欄位用英文鍵）
 * - 櫃台備註不在其中：API 對所有人都移除，銷售不可見
 */
import { COUNT_FIELD, anyDateStr, dateDimensions } from './pivotEngine.js';
import { filterOwnCustomers, normValues, prepareCustomers, singleValue } from './customerDashboardStats.js';

const RATING_ORDER = ['A意願高', 'B有機會', 'C需考慮', 'D無希望'];
const VISIT_ORDER = ['新客', '回訪'];
// 設定裡沒有 vipFormFields 時仍提供的需求欄位（multi 與後端 _handleFetchCustomerList 一致）
const FALLBACK_NEED_FIELDS = [
  { label: '從何得知本建案', multi: true },
  { label: '購屋動機', multi: true },
  { label: '房型需求', multi: true },
  { label: '坪數需求', multi: true },
  { label: '購屋預算', multi: false },
];
// 已由專用維度處理、不要再自動列出的原始鍵
const HANDLED_RAW_KEYS = ['姓名', '電話', '銷售人員', '銷售人員電話', '等級研判', '未買原因', '拜訪日期'];
const SUBMISSION_SOURCE_LABELS = { public_form: '客戶表單', excel_import: 'Excel 匯入' };

const nonEmptyOrder = (options) => (Array.isArray(options) && options.length ? options : undefined);

// 自由文字欄位取最新值（profile 是歷次提交累積的陣列）；不拆逗號，避免地址、公司名被切開
function lastText(raw) {
  if (Array.isArray(raw)) {
    for (let i = raw.length - 1; i >= 0; i--) {
      const s = String(raw[i] ?? '').trim();
      if (s) return s;
    }
    return '';
  }
  return raw === null || raw === undefined ? '' : String(raw).trim();
}

const isPlainValue = (v) => v === null || ['string', 'number', 'boolean'].includes(typeof v);
const isFieldValue = (v) => (Array.isArray(v) ? v.every(isPlainValue) : isPlainValue(v));
const isBinaryText = (v) => typeof v === 'string' && v.startsWith('data:');
const hasCjk = (key) => /[㐀-鿿]/.test(key);

/**
 * 從資料找出其他表單欄位（中文鍵、值為文字或文字陣列）；內含 data URI 的欄位（圖片、簽名）不列入
 * @param {Iterable<object>} sources 要掃描的物件
 */
function discoverFieldKeys(sources, handled) {
  const found = new Set();
  const blocked = new Set();
  for (const source of sources) {
    for (const [key, value] of Object.entries(source || {})) {
      if (handled.has(key) || blocked.has(key) || !hasCjk(key)) continue;
      if (!isFieldValue(value) || (Array.isArray(value) ? value.some(isBinaryText) : isBinaryText(value))) {
        blocked.add(key);
        found.delete(key);
      } else {
        found.add(key);
      }
    }
  }
  return [...found].sort((a, b) => a.localeCompare(b, 'zh-Hant', { numeric: true }));
}

/**
 * 客戶欄位維度（客戶、洽談紀錄共用）
 * @param {object} settings 客資系統設定（fields、vipFormFields）
 * @param {(row: object, label: string) => any} read 取得該列的 profile 值
 * @param {Iterable<object>} sources 掃描自訂欄位用的物件
 */
function profileDimensions(settings, read, sources) {
  const fields = settings?.fields || {};
  const option = (label) => (r) => [singleValue(read(r, label))];
  const text = (label) => (r) => [lastText(read(r, label))];
  const dims = [
    { key: 'p:age', label: '年齡', order: nonEmptyOrder(fields.age?.options), get: option('年齡') },
    { key: 'p:gender', label: '性別', get: option('性別') },
    { key: 'p:job', label: '職業', get: text('職業') },
    { key: 'p:company', label: '任職公司', get: text('任職公司') },
    { key: 'p:city', label: '居住城市', get: text('居住城市') },
    { key: 'p:district', label: '居住鄉鎮市區', get: text('居住鄉鎮市區') },
    {
      key: 'p:area',
      label: '居住區域',
      get: (r) => {
        const city = lastText(read(r, '居住城市'));
        const district = lastText(read(r, '居住鄉鎮市區'));
        return [city ? `${city}${district && !district.startsWith(city) ? district : ''}` : ''];
      },
    },
    { key: 'p:address', label: '居住詳細地址', get: text('居住詳細地址') },
  ];
  const handled = new Set([...HANDLED_RAW_KEYS, ...dims.map(d => d.label)]);
  const addNeed = (label, multi, options) => {
    if (handled.has(label)) return;
    handled.add(label);
    dims.push({
      key: `vip:${label}`,
      label,
      multi,
      order: nonEmptyOrder(options),
      get: multi ? (r) => normValues(read(r, label)) : option(label),
    });
  };
  Object.values(settings?.vipFormFields || {})
    .filter(f => f?.label)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .forEach(f => addNeed(f.label, f.selectionMode === 'multiple', f.options));
  FALLBACK_NEED_FIELDS.forEach(f => addNeed(f.label, f.multi));
  discoverFieldKeys(sources, handled).forEach((label) => {
    dims.push({ key: `auto:${label}`, label, get: text(label) });
  });
  return dims;
}

const otherContactDimensions = (listOf) => [
  { key: 'other:name', label: '其他聯絡人姓名', multi: true, get: r => listOf(r).map(p => p?.name) },
  { key: 'other:phone', label: '其他聯絡人電話', multi: true, get: r => listOf(r).map(p => p?.phone) },
  { key: 'other:relation', label: '其他聯絡人關係', multi: true, get: r => listOf(r).map(p => p?.relation) },
];
const projectDimensions = (ofRow, projectNames) => {
  const nameOf = id => (id ? (projectNames?.[id] || id) : '');
  return [
    { key: 'origin', label: '客戶歸屬', order: ['本案', '關聯建案'], get: r => [ofRow(r).isLinked ? '關聯建案' : '本案'] },
    { key: 'sourceProject', label: '來源建案', get: r => [nameOf(ofRow(r).sourceProjectId)] },
    { key: 'linkedProjects', label: '關聯建案', multi: true, get: r => (ofRow(r).linkedProjectIds || []).map(nameOf) },
  ];
};

// 客戶列：profileAttrs 有該欄位就以 profile 為準，舊版後端或無此欄位時用提交資料
const readCustomerProfile = (row, label) => {
  const attrs = row.profileAttrs;
  if (attrs && Object.prototype.hasOwnProperty.call(attrs, label)) return attrs[label];
  return row[label];
};
function* customerFieldSources(rows) {
  for (const r of rows) {
    yield r;
    yield r.profileAttrs;
  }
}

export function buildCustomerDataset({ list = [], settings = null, loading = false, projectNames = null }) {
  const items = list.filter(r => !r.isDeleted);
  const visitDay = r => anyDateStr(r['拜訪日期']);
  const lastLogDay = r => anyDateStr(r.latestLogDate);
  const createdDay = r => anyDateStr(r.createdAt);
  const updatedDay = r => anyDateStr(r.updatedAt);
  const submittedDay = r => anyDateStr(r.submittedAt);
  return {
    key: 'customers',
    label: '客戶',
    loading,
    items,
    rowId: r => `${r.docId}|${r['銷售人員'] || ''}`,
    countFields: [
      { key: '__customers__', label: '客戶數（不重複）', short: '客戶數', icon: 'mdi-account-outline', distinctOf: r => r.docId },
      { key: COUNT_FIELD, label: '筆數', short: '筆數', icon: 'mdi-counter' },
    ],
    dateFields: [
      { key: 'visit', label: '拜訪日期', get: visitDay },
      { key: 'lastLog', label: '最後洽談日', get: lastLogDay },
      { key: 'created', label: '建檔日期', get: createdDay },
      { key: 'updated', label: '最後更新日', get: updatedDay },
    ],
    dimensions: [
      { key: 'name', label: '姓名', get: r => [r['姓名']] },
      { key: 'phone', label: '電話', get: r => [r['電話']] },
      { key: 'sales', label: '銷售人員', get: r => [r['銷售人員']] },
      { key: 'salesPhone', label: '銷售人員電話', get: r => [r['銷售人員電話']] },
      { key: 'rating', label: '等級', order: RATING_ORDER, get: r => [r['等級研判']] },
      { key: 'visitStatus', label: '新客／回訪', order: VISIT_ORDER, get: r => [r.visitStatus] },
      { key: 'reasons', label: '未買原因', multi: true, get: r => normValues(r['未買原因']) },
      { key: 'lastType', label: '最新互動方式', get: r => [r.latestInteractionType] },
      { key: 'lastContent', label: '最新洽談內容', longText: true, get: r => [r.latestContent] },
      ...otherContactDimensions(r => r.otherPhones || []),
      ...projectDimensions(r => r, projectNames),
      { key: 'submissionSource', label: '資料來源', get: r => [SUBMISSION_SOURCE_LABELS[r.submissionSource] || r.submissionSource] },
      ...dateDimensions('visit', '拜訪', visitDay),
      ...profileDimensions(settings, readCustomerProfile, customerFieldSources(items)),
      ...dateDimensions('lastLog', '最後洽談', lastLogDay),
      ...dateDimensions('created', '建檔', createdDay),
      ...dateDimensions('updated', '最後更新', updatedDay),
      ...dateDimensions('submitted', '表單提交', submittedDay),
    ],
    defaults: {
      rowDims: ['sales'],
      colDims: ['rating'],
      values: [{ field: '__customers__', mode: 'count' }],
    },
    drillColumns: [
      { label: '姓名', primary: true, get: r => r['姓名'] },
      { label: '電話', get: r => r['電話'] },
      { label: '銷售', get: r => r['銷售人員'] },
      { label: '等級', get: r => r['等級研判'] },
      { label: '新客／回訪', get: r => r.visitStatus },
      { label: '拜訪日期', get: r => visitDay(r) },
      { label: '最後洽談', get: r => lastLogDay(r) },
    ],
    drillSort: (a, b) => visitDay(b).localeCompare(visitDay(a)),
  };
}

/** 完整客資 → 洽談紀錄列（銷售只保留自己負責的客戶） */
export function buildLogRows(rawList, projectId, { canSeeAll = false, user = null } = {}) {
  const prepared = prepareCustomers(rawList, projectId);
  const customers = canSeeAll ? prepared : filterOwnCustomers(prepared, user);
  const rows = [];
  customers.forEach(c => {
    c.logs.forEach((l, i) => {
      rows.push({
        ...l,
        id: `${c.id}#${i}`,
        customerId: c.id,
        customerName: c.name,
        phone: c.phone,
        sales: c.sales,
        salesPhone: c.salesPhone,
        customerRating: c.rating,
        profile: c.profile,
        customer: c,
      });
    });
  });
  return rows;
}

const readLogProfile = (row, label) => row.profile?.[label];
const hourLabel = (time) => {
  const m = String(time || '').match(/^(\d{1,2}):/);
  return m ? `${m[1].padStart(2, '0')}:00` : '';
};
function* logFieldSources(rows) {
  const seen = new Set();
  for (const r of rows) {
    if (r.profile && !seen.has(r.profile)) {
      seen.add(r.profile);
      yield r.profile;
    }
  }
}

export function buildLogDataset({ rows = [], settings = null, loading = false, error = '', projectNames = null }) {
  const day = r => r.date || '';
  const loggedDay = r => anyDateStr(r.createdAt);
  const createdDay = r => anyDateStr(r.customer?.createdAt);
  const updatedDay = r => anyDateStr(r.customer?.updatedAt);
  return {
    key: 'logs',
    label: '洽談紀錄',
    loading,
    error,
    lazy: true,
    items: rows,
    rowId: r => r.id,
    countFields: [
      { key: COUNT_FIELD, label: '洽談筆數', short: '筆數', icon: 'mdi-counter' },
      { key: '__customers__', label: '客戶數（不重複）', short: '客戶數', icon: 'mdi-account-outline', distinctOf: r => r.customerId },
    ],
    dateFields: [{ key: 'log', label: '洽談日期', get: day }],
    dimensions: [
      { key: 'name', label: '姓名', get: r => [r.customerName] },
      { key: 'phone', label: '電話', get: r => [r.phone] },
      { key: 'sales', label: '負責銷售', get: r => [r.sales] },
      { key: 'salesPhone', label: '負責銷售電話', get: r => [r.salesPhone] },
      { key: 'recorder', label: '記錄人', get: r => [r.recorder] },
      { key: 'recorderPhone', label: '記錄人電話', get: r => [r.recorderPhone] },
      { key: 'type', label: '互動方式', get: r => [r.type] },
      { key: 'visitKind', label: '新客／回訪', order: VISIT_ORDER, get: r => [r.isNew === undefined ? '' : (r.isNew ? '新客' : '回訪')] },
      { key: 'rating', label: '當次等級', order: RATING_ORDER, get: r => [r.rating] },
      { key: 'customerRating', label: '客戶最新等級', order: RATING_ORDER, get: r => [r.customerRating] },
      { key: 'reasons', label: '未買原因', multi: true, get: r => r.reasons },
      { key: 'keyTags', label: '重點標籤', multi: true, get: r => r.keyTags },
      { key: 'content', label: '洽談內容', longText: true, get: r => [r.content] },
      ...dateDimensions('log', '洽談', day),
      { key: 'hour', label: '開始時段', kind: 'time', get: r => [hourLabel(r.startTime)] },
      { key: 'startTime', label: '開始時間', kind: 'time', get: r => [r.startTime] },
      { key: 'endTime', label: '結束時間', kind: 'time', get: r => [r.endTime] },
      { key: 'visitors', label: '來客人數', numeric: true, get: r => [r.visitors || ''] },
      { key: 'minutes', label: '洽談分鐘', numeric: true, get: r => [r.minutes || ''] },
      ...dateDimensions('logged', '紀錄建立', loggedDay),
      ...otherContactDimensions(r => r.customer?.otherPhones || []),
      ...projectDimensions(r => r.customer || {}, projectNames),
      ...profileDimensions(settings, readLogProfile, logFieldSources(rows)),
      ...dateDimensions('created', '客戶建檔', createdDay),
      ...dateDimensions('updated', '客戶更新', updatedDay),
    ],
    defaults: {
      rowDims: ['sales'],
      colDims: ['type'],
      values: [{ field: COUNT_FIELD, mode: 'count' }],
    },
    drillColumns: [
      { label: '日期', get: r => (r.startTime ? `${r.date} ${r.startTime}` : r.date) },
      { label: '姓名', primary: true, get: r => r.customerName },
      { label: '電話', get: r => r.phone },
      { label: '互動方式', get: r => r.type },
      { label: '負責銷售', get: r => r.sales },
      { label: '記錄人', get: r => r.recorder },
      { label: '當次等級', get: r => r.rating },
    ],
    drillSort: (a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`),
  };
}
