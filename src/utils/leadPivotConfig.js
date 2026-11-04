/**
 * 聯絡名單透視：資料集定義（名單／回報紀錄）
 *
 * - 名單：每筆名單一筆，不含垃圾桶；銷售只傳入自己被分配的名單
 * - 回報紀錄：contactLogs 每次回報一筆，對應不到傳入名單的紀錄不列入（已刪除名單、其他銷售的名單）
 *   每筆回報也可用該名單的所有欄位統計；名單當下的狀態、原因以「名單目前」區分
 */
import { COUNT_FIELD, anyDateStr, daysDiff, dateDimensions } from './pivotEngine.js';

const UNHANDLED = '未處理';

/** 來源歸類（與名單頁來源篩選相同） */
export function leadSourceLabel(raw, projectName) {
  const s = String(raw || '未註明').trim();
  if (s.includes('官網')) return `${projectName}官網`;
  const upper = s.toUpperCase();
  if (upper === 'FB' || s.includes('臉書')) return 'FB';
  if (upper === 'IG' || s.includes('Instagram')) return 'IG';
  if (upper === 'LINE') return 'LINE';
  return s;
}

/** 名單標記歸類（statusText 為匯入時的查重結果，內含姓名等明細，先歸成固定類別） */
export function leadMarkLabel(statusText) {
  const s = String(statusText || '');
  if (!s) return '';
  if (s.includes('既有客資')) return '既有客資';
  if (s.includes('已購戶')) return '本案已購戶';
  if (s.includes('已有賞屋預約')) return '已有賞屋預約';
  if (s.includes('重複名單')) return '重複名單';
  if (s.includes('全新名單')) return '全新名單';
  return '其他';
}
const MARK_ORDER = ['全新名單', '重複名單', '既有客資', '本案已購戶', '已有賞屋預約', '其他'];

const statusOrder = (statusOptions) => [UNHANDLED, ...(statusOptions || []), '舊資料上傳'];
const hourLabelOf = (v) => {
  const d = v?.toDate ? v.toDate() : (v ? new Date(v) : null);
  if (!d || isNaN(d.getTime())) return '';
  return `${d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Taipei', hour: '2-digit', hour12: false }).slice(0, 2)}:00`;
};

/**
 * 名單欄位維度（名單、回報紀錄共用）
 * @param {(row: object) => object} lead 由資料列取得名單
 * @param {object} ctx { projectName, statusOptions, reservationsByPhone }
 */
function leadDimensions(lead, { projectName, statusOptions, reservationsByPhone }) {
  const formDay = r => anyDateStr(lead(r).date);
  const assignedDay = r => anyDateStr(lead(r).assignedAt);
  const reportedDay = r => anyDateStr(lead(r).lastReportedAt);
  const createdDay = r => anyDateStr(lead(r).createdAt);
  const modifiedDay = r => anyDateStr(lead(r).lastModifiedAt);
  const reservationCount = r => reservationsByPhone?.get?.(lead(r).phone)?.length || 0;
  return [
    { key: 'name', label: '姓名', get: r => [lead(r).name] },
    { key: 'phone', label: '電話', get: r => [lead(r).phone] },
    { key: 'sales', label: '分配銷售', get: r => [lead(r).assignedName || '未指派'] },
    { key: 'status', label: '聯絡狀況', order: statusOrder(statusOptions), get: r => [lead(r).status || UNHANDLED] },
    { key: 'progress', label: '處理進度', order: ['已處理', UNHANDLED], get: r => [lead(r).status ? '已處理' : UNHANDLED] },
    { key: 'reason', label: '不考慮原因', get: r => [lead(r).reason] },
    { key: 'source', label: '來源', get: r => [leadSourceLabel(lead(r).source, projectName)] },
    { key: 'sourceRaw', label: '來源原文', get: r => [lead(r).source] },
    { key: 'budget', label: '預算', get: r => [lead(r).budget || '未填寫'] },
    { key: 'mark', label: '名單標記', order: MARK_ORDER, get: r => [leadMarkLabel(lead(r).statusText)] },
    { key: 'statusText', label: '名單狀態原文', longText: true, get: r => [lead(r).statusText] },
    { key: 'note', label: '備註', longText: true, get: r => [lead(r).note] },
    { key: 'rawText', label: '匯入方式', longText: true, get: r => [lead(r).rawText] },
    { key: 'importedBy', label: '匯入人', get: r => [lead(r).importedBy] },
    { key: 'modifiedBy', label: '最後修改人', get: r => [lead(r).lastModifiedBy] },
    { key: 'reporter', label: '最新回報人', get: r => [lead(r).lastReport?.createdBy] },
    { key: 'lastReportNote', label: '最新回報內容', longText: true, get: r => [lead(r).lastReport?.note] },
    { key: 'hasReservation', label: '賞屋預約', order: ['有預約', '無預約'], get: r => [reservationCount(r) ? '有預約' : '無預約'] },
    { key: 'reservationCount', label: '預約筆數', numeric: true, get: r => [reservationCount(r)] },
    ...dateDimensions('form', '填表', formDay),
    ...dateDimensions('assigned', '指派', assignedDay),
    ...dateDimensions('reported', '最後回報', reportedDay),
    ...dateDimensions('created', '建檔', createdDay),
    ...dateDimensions('modified', '最後修改', modifiedDay),
    { key: 'responseDays', label: '指派到回報天數', numeric: true, get: r => [daysDiff(assignedDay(r), reportedDay(r))] },
  ];
}

export function buildLeadDataset({ leads = [], projectName = '', statusOptions = [], reservationsByPhone = null }) {
  const formDay = l => anyDateStr(l.date);
  return {
    key: 'leads',
    label: '名單',
    items: leads,
    rowId: l => l.id,
    countFields: [
      { key: COUNT_FIELD, label: '名單筆數', short: '筆數', icon: 'mdi-counter' },
      { key: '__phones__', label: '電話數（不重複）', short: '電話數', icon: 'mdi-phone-outline', distinctOf: l => l.phone },
    ],
    dateFields: [
      { key: 'form', label: '填表日期', get: formDay },
      { key: 'assigned', label: '指派日期', get: l => anyDateStr(l.assignedAt) },
      { key: 'reported', label: '最後回報日', get: l => anyDateStr(l.lastReportedAt) },
      { key: 'created', label: '建檔日期', get: l => anyDateStr(l.createdAt) },
    ],
    dimensions: leadDimensions(l => l, { projectName, statusOptions, reservationsByPhone }),
    defaults: {
      rowDims: ['sales'],
      colDims: ['status'],
      values: [{ field: COUNT_FIELD, mode: 'count' }],
    },
    drillColumns: [
      { label: '填表日期', get: l => formDay(l) },
      { label: '姓名', primary: true, get: l => l.name },
      { label: '電話', get: l => l.phone },
      { label: '分配銷售', get: l => l.assignedName },
      { label: '來源', get: l => leadSourceLabel(l.source, projectName) },
      { label: '聯絡狀況', get: l => l.status || UNHANDLED },
      { label: '不考慮原因', get: l => l.reason },
    ],
    drillSort: (a, b) => formDay(b).localeCompare(formDay(a)),
    openTarget: l => l,
  };
}

/** contactLogs ＋ 名單 → 回報紀錄列（對應不到傳入名單的紀錄略過） */
export function buildReportRows(logs, leads) {
  const leadMap = new Map((leads || []).map(l => [l.id, l]));
  const rows = [];
  (logs || []).forEach((log, i) => {
    const lead = leadMap.get(log.leadId);
    if (lead) rows.push({ ...log, id: `${log.leadId}#${i}`, lead });
  });
  return rows;
}

// 回報當下與名單目前都有的欄位，名單這邊加前綴區分
const CURRENT_LEAD_KEYS = new Set(['status', 'reason', 'reporter']);

export function buildReportDataset({
  logs = [], leads = [], projectName = '', statusOptions = [], reservationsByPhone = null, loading = false, error = '',
}) {
  const day = r => anyDateStr(r.createdAt);
  return {
    key: 'reports',
    label: '回報紀錄',
    loading,
    error,
    lazy: true,
    items: buildReportRows(logs, leads),
    rowId: r => r.id,
    countFields: [
      { key: COUNT_FIELD, label: '回報筆數', short: '筆數', icon: 'mdi-counter' },
      { key: '__leads__', label: '名單數（不重複）', short: '名單數', icon: 'mdi-account-outline', distinctOf: r => r.leadId },
    ],
    dateFields: [{ key: 'report', label: '回報日期', get: day }],
    dimensions: [
      { key: 'reporter', label: '回報人', get: r => [r.createdBy] },
      { key: 'status', label: '回報狀態', order: statusOrder(statusOptions), get: r => [r.status] },
      { key: 'reason', label: '不考慮原因', get: r => [r.reason] },
      { key: 'reportNote', label: '回報內容', longText: true, get: r => [r.note] },
      ...dateDimensions('report', '回報', day),
      { key: 'hour', label: '回報時段', kind: 'time', get: r => [hourLabelOf(r.createdAt)] },
      ...leadDimensions(r => r.lead, { projectName, statusOptions, reservationsByPhone })
        .map(d => (CURRENT_LEAD_KEYS.has(d.key) ? { ...d, key: `lead:${d.key}`, label: `名單目前${d.label}` } : d)),
    ],
    defaults: {
      rowDims: ['reporter'],
      colDims: ['status'],
      values: [{ field: COUNT_FIELD, mode: 'count' }],
    },
    drillColumns: [
      { label: '回報日期', get: r => day(r) },
      { label: '姓名', primary: true, get: r => r.lead.name },
      { label: '電話', get: r => r.lead.phone },
      { label: '回報人', get: r => r.createdBy },
      { label: '回報狀態', get: r => r.status },
      { label: '不考慮原因', get: r => r.reason },
    ],
    drillSort: (a, b) => day(b).localeCompare(day(a)),
    openTarget: r => r.lead,
  };
}
