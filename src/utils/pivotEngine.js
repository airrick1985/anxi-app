/**
 * 資料透視共用運算（純函式，不依賴 Vue／Firebase）
 *
 * 邏輯比照銷控／驗屋資料透視：
 * - 維度（dimension）：{ key, label, kind?, order?, multi?, numeric?, get? }
 *   kind：date/month/week/time 依時間序、weekday 依星期、number 依數值、natural 依自然排序；其餘依筆數多→少
 *   multi：一筆可有多個值（每人分計），所以各列加總可能大於總計；每個儲存格／總計仍以不重複筆計算
 *   numeric：數值欄位，可當「值」做加總／平均／最大／最小
 * - 計數欄位（count field）：{ key, label, short, icon, distinctOf? }，有 distinctOf 時為不重複計數
 */

export const EMPTY = '（未填寫）';
export const COUNT_FIELD = '__count__';
export const PIVOT_SEP = '|#|';            // 組合鍵層級分隔
export const PIVOT_CELL_SEP = '||CELL||';  // 下鑽 key 的列/欄分隔

export const TEXT_AGG_OPTIONS = [
  { key: 'distinct', label: '不重複計數' },
  { key: 'filled', label: '有填筆數' },
];
export const NUMERIC_AGG_OPTIONS = [
  { key: 'sum', label: '加總' },
  { key: 'avg', label: '平均' },
  { key: 'max', label: '最大' },
  { key: 'min', label: '最小' },
];
// 平均／最大／最小不可相加，不顯示佔比
const ADDITIVE_NUMERIC = new Set(['sum']);

export function aggOptionsOf(dim) {
  return dim?.numeric ? NUMERIC_AGG_OPTIONS : TEXT_AGG_OPTIONS;
}
export function isNonAdditive(mode) {
  return NUMERIC_AGG_OPTIONS.some(o => o.key === mode) && !ADDITIVE_NUMERIC.has(mode);
}

const DOW = ['日', '一', '二', '三', '四', '五', '六'];
const WEEKDAY_ORDER = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
const pad2 = (n) => String(n).padStart(2, '0');
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86400000;

/** Timestamp／Date／ISO／yyyy-MM-dd／yyyy/M/d／中文日期 → 台灣時區 yyyy-MM-dd（無效為 ''） */
export function anyDateStr(v) {
  if (!v) return '';
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return '';
    // 帶時區的 ISO 字串要換算成台灣日期，不能直接取前 10 碼
    if (!/T.*(Z|[+-]\d{2}:?\d{2})$/.test(s)) {
      const ymd = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
      if (ymd) return `${ymd[1]}-${pad2(ymd[2])}-${pad2(ymd[3])}`;
      const zh = s.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
      if (zh) return `${zh[1]}-${pad2(zh[2])}-${pad2(zh[3])}`;
    }
  }
  let d = null;
  if (v instanceof Date) d = v;
  else if (typeof v.toDate === 'function') d = v.toDate();
  else if (typeof v === 'object' && v._seconds !== undefined) d = new Date(v._seconds * 1000);
  else if (typeof v === 'object' && v.seconds !== undefined) d = new Date(v.seconds * 1000);
  else d = new Date(v);
  if (!d || isNaN(d.getTime())) return '';
  return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
}

const dayToUtc = (day) => {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
const utcToDay = (t) => new Date(t).toISOString().slice(0, 10);

/** 週區間標籤（週一開始）：2026-11-02～11-08 */
export function weekLabelOf(day) {
  if (!DAY_RE.test(day || '')) return '';
  const t = dayToUtc(day);
  const monday = t - ((new Date(t).getUTCDay() + 6) % 7) * DAY_MS;
  return `${utcToDay(monday)}～${utcToDay(monday + 6 * DAY_MS).slice(5)}`;
}
export function weekdayOf(day) {
  if (!DAY_RE.test(day || '')) return '';
  return `星期${DOW[new Date(dayToUtc(day)).getUTCDay()]}`;
}
/** 兩日相差天數（to − from）；任一無效回傳 '' */
export function daysDiff(from, to) {
  if (!DAY_RE.test(from || '') || !DAY_RE.test(to || '')) return '';
  return Math.round((dayToUtc(to) - dayToUtc(from)) / DAY_MS);
}

/** 一個日期來源展開成 日期／週／月份／星期 四個維度 */
export function dateDimensions(key, name, getDay) {
  return [
    { key: `${key}Date`, label: `${name}日期`, kind: 'date', get: r => [getDay(r)] },
    { key: `${key}Week`, label: `${name}週`, kind: 'week', get: r => [weekLabelOf(getDay(r))] },
    { key: `${key}Month`, label: `${name}月份`, kind: 'month', get: r => [getDay(r).slice(0, 7)] },
    { key: `${key}Weekday`, label: `${name}星期`, kind: 'weekday', get: r => [weekdayOf(getDay(r))] },
  ];
}

/** 欄位的個別值（轉字串、去空白、去空值與重複） */
export function valueListOf(item, dim) {
  if (!dim) return [];
  const raws = dim.get ? dim.get(item) : [item[dim.key]];
  const rawList = Array.isArray(raws) ? raws : [raws];
  const list = [];
  for (const raw of rawList) {
    let v = raw;
    if (v instanceof Date || (v && typeof v === 'object' && typeof v.toDate === 'function')) v = anyDateStr(v);
    else if (typeof v === 'boolean') v = v ? '是' : '否';
    else if (Array.isArray(v)) v = v.join('、');
    else if (v !== null && typeof v === 'object') v = '';
    const s = v === null || v === undefined ? '' : String(v).trim();
    if (s && !list.includes(s)) list.push(s);
  }
  return list;
}
export function dimValuesOf(item, dim) {
  const list = valueListOf(item, dim);
  return list.length ? list : [EMPTY];
}

/** 維度值的自然順序（未填寫一律最後） */
export function compareDimValues(dim, a, b) {
  if (a === b) return 0;
  if (a === EMPTY) return 1;
  if (b === EMPTY) return -1;
  if (dim?.kind === 'weekday') return WEEKDAY_ORDER.indexOf(a) - WEEKDAY_ORDER.indexOf(b);
  if (dim?.order) {
    const ia = dim.order.indexOf(a);
    const ib = dim.order.indexOf(b);
    if (ia !== ib) return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
  }
  if (dim?.kind === 'number' || dim?.numeric) {
    const na = Number(a);
    const nb = Number(b);
    if (isFinite(na) && isFinite(nb)) return na - nb;
  }
  return String(a).localeCompare(String(b), 'zh-Hant', { numeric: true });
}
/** 維度鍵值預設排序：有順序意義的欄位依自然順序，其餘依筆數多→少 */
export function sortDimKeys(keys, dim, getTotal) {
  if (dim && (dim.kind || dim.order || dim.numeric)) return [...keys].sort((a, b) => compareDimValues(dim, a, b));
  return [...keys].sort((a, b) => ((a === EMPTY) - (b === EMPTY))
    || (getTotal(b) - getTotal(a))
    || String(a).localeCompare(String(b), 'zh-Hant', { numeric: true }));
}

/** 維度值（日期 yyyy-MM-dd、月份 yyyy-MM、週 yyyy-MM-dd～MM-dd）是否落在起訖內；未填寫一律排除 */
export function dateValueInRange(value, kind, from, to) {
  if (!value || value === EMPTY) return false;
  const val = kind === 'week' ? value.slice(0, 10) : value;
  const norm = d => (kind === 'month' ? d.slice(0, 7) : d);
  if (DAY_RE.test(from || '') && val < norm(from)) return false;
  if (DAY_RE.test(to || '') && val > norm(to)) return false;
  return true;
}

/**
 * 計算透視矩陣
 * @param {object} o
 * @param {Array} o.items 資料列
 * @param {string[]} o.rowDims 列維度 key
 * @param {string[]} o.colDims 欄維度 key
 * @param {Array} o.valueDefs [{ field, mode }]
 * @param {Map} o.dimensionMap key → 維度定義
 * @param {Array} o.countFields 計數欄位定義
 * @param {string[]} [o.colKeyOrder] 欄群組手動順序
 */
export function computePivot({ items, rowDims, colDims, valueDefs, dimensionMap, countFields = [], colKeyOrder = [] }) {
  const useCol = colDims.length > 0;
  const countMap = new Map(countFields.map(c => [c.key, c]));

  // 每筆在單一儲存格只累加一次，所以筆數＝不重複筆數
  const listCache = new Map();
  const cachedList = (item, field) => {
    let byItem = listCache.get(field);
    if (!byItem) { byItem = new Map(); listCache.set(field, byItem); }
    let list = byItem.get(item);
    if (!list) { list = valueListOf(item, dimensionMap.get(field)); byItem.set(item, list); }
    return list;
  };
  const isNumericDef = vd => NUMERIC_AGG_OPTIONS.some(o => o.key === vd.mode);
  const newCell = () => ({
    count: 0,
    items: [],
    sets: valueDefs.map(vd => ((countMap.get(vd.field)?.distinctOf || vd.mode === 'distinct') ? new Set() : null)),
    filled: valueDefs.map(() => 0),
    nums: valueDefs.map(vd => (isNumericDef(vd) ? { sum: 0, n: 0, min: Infinity, max: -Infinity } : null)),
  });
  const accumulate = (cell, item) => {
    cell.count++;
    cell.items.push(item);
    valueDefs.forEach((vd, i) => {
      const cf = countMap.get(vd.field);
      if (cf) {
        if (cf.distinctOf) {
          const id = cf.distinctOf(item);
          if (id) cell.sets[i].add(id);
        }
        return;
      }
      const list = cachedList(item, vd.field);
      if (isNumericDef(vd)) {
        const num = list.length ? Number(list[0]) : NaN;
        if (isFinite(num)) {
          const a = cell.nums[i];
          a.sum += num;
          a.n++;
          if (num < a.min) a.min = num;
          if (num > a.max) a.max = num;
        }
      } else if (vd.mode === 'filled') {
        if (list.length) cell.filled[i]++;
      } else {
        list.forEach(v => cell.sets[i].add(v));
      }
    });
  };
  const cellValueAt = (cell, i) => {
    const vd = valueDefs[i];
    const cf = countMap.get(vd.field);
    if (cf) return cf.distinctOf ? cell.sets[i].size : cell.count;
    if (isNumericDef(vd)) {
      const a = cell.nums[i];
      if (vd.mode === 'sum') return a.sum;
      if (!a.n) return null;
      if (vd.mode === 'avg') return Math.round((a.sum / a.n) * 10) / 10;
      return vd.mode === 'max' ? a.max : a.min;
    }
    if (vd.mode === 'filled') return cell.filled[i];
    return cell.sets[i].size;
  };
  // 各維度值的笛卡兒積（多值欄位一筆可對到多個組合）
  const combosOf = (item, dims) => {
    let combos = [[]];
    for (const d of dims) {
      const values = dimValuesOf(item, dimensionMap.get(d));
      const next = [];
      for (const c of combos) for (const v of values) next.push([...c, v]);
      combos = next;
    }
    return combos;
  };

  const rowMap = new Map(); // rowKey -> { parts, totalCell, cols: Map(colKey -> cell) }
  const colMap = new Map(); // colKey -> { parts, cell }
  const grandCell = newCell();
  for (const item of items) {
    const rCombos = rowDims.length ? combosOf(item, rowDims) : [['全部']];
    const cCombos = useCol ? combosOf(item, colDims) : [['']];
    const cEntries = [];
    for (const cParts of cCombos) {
      const cKey = cParts.join(PIVOT_SEP);
      let col = colMap.get(cKey);
      if (!col) { col = { parts: cParts, cell: newCell() }; colMap.set(cKey, col); }
      accumulate(col.cell, item);
      cEntries.push(cKey);
    }
    for (const rParts of rCombos) {
      const rKey = rParts.join(PIVOT_SEP);
      let row = rowMap.get(rKey);
      if (!row) { row = { parts: rParts, totalCell: newCell(), cols: new Map() }; rowMap.set(rKey, row); }
      accumulate(row.totalCell, item);
      for (const cKey of cEntries) {
        let cc = row.cols.get(cKey);
        if (!cc) { cc = newCell(); row.cols.set(cKey, cc); }
        accumulate(cc, item);
      }
    }
    accumulate(grandCell, item);
  }

  // 階層排序：逐層依各維度的鍵值排序規則（數量權重取該層合計筆數）
  const buildLevelOrders = (dims, entries) => dims.map((dk, li) => {
    const totals = new Map();
    for (const e of entries) totals.set(e.parts[li], (totals.get(e.parts[li]) || 0) + e.count);
    const sorted = sortDimKeys([...totals.keys()], dimensionMap.get(dk), k => totals.get(k) || 0);
    return new Map(sorted.map((k, i) => [k, i]));
  });
  const cmpByLevels = orderMaps => (aParts, bParts) => {
    for (let i = 0; i < orderMaps.length; i++) {
      const d = (orderMaps[i].get(aParts[i]) ?? 0) - (orderMaps[i].get(bParts[i]) ?? 0);
      if (d) return d;
    }
    return 0;
  };
  const rowOrders = buildLevelOrders(rowDims, [...rowMap.values()].map(r => ({ parts: r.parts, count: r.totalCell.count })));
  const colOrders = buildLevelOrders(colDims, [...colMap.values()].map(c => ({ parts: c.parts, count: c.cell.count })));
  const rowKeys = [...rowMap.keys()].sort((a, b) => cmpByLevels(rowOrders)(rowMap.get(a).parts, rowMap.get(b).parts));
  let colKeys = useCol
    ? [...colMap.keys()].sort((a, b) => cmpByLevels(colOrders)(colMap.get(a).parts, colMap.get(b).parts))
    : [''];
  if (useCol && colKeyOrder.length) {
    const pos = new Map(colKeyOrder.map((k, i) => [k, i]));
    const manual = colKeys.filter(k => pos.has(k)).sort((a, b) => pos.get(a) - pos.get(b));
    colKeys = [...manual, ...colKeys.filter(k => !pos.has(k))];
  }

  const rows = rowKeys.map(rKey => {
    const row = rowMap.get(rKey);
    const cells = {};
    for (const cKey of colKeys) {
      const cc = useCol ? row.cols.get(cKey) : row.totalCell;
      cells[cKey] = { count: cc ? cc.count : 0, values: valueDefs.map((vd, i) => (cc ? cellValueAt(cc, i) : (isNumericDef(vd) && vd.mode !== 'sum' ? null : 0))) };
    }
    return {
      key: rKey,
      parts: row.parts,
      cells,
      total: row.totalCell.count,
      totalValues: valueDefs.map((vd, i) => cellValueAt(row.totalCell, i)),
    };
  });
  const colTotals = {};
  for (const cKey of colKeys) {
    const cell = useCol ? colMap.get(cKey)?.cell : grandCell;
    colTotals[cKey] = { count: cell ? cell.count : 0, values: valueDefs.map((vd, i) => (cell ? cellValueAt(cell, i) : 0)) };
  }

  // 下鑽明細：儲存格 → 資料列
  const itemsByCell = new Map();
  for (const rKey of rowKeys) {
    const row = rowMap.get(rKey);
    itemsByCell.set(`${rKey}${PIVOT_CELL_SEP}__row__`, row.totalCell.items);
    for (const [cKey, cc] of row.cols) itemsByCell.set(`${rKey}${PIVOT_CELL_SEP}${cKey}`, cc.items);
  }
  for (const [cKey, col] of colMap) itemsByCell.set(`__col__${PIVOT_CELL_SEP}${cKey}`, col.cell.items);
  itemsByCell.set('__grand__', grandCell.items);

  return {
    rows,
    colKeys,
    colTotals,
    useCol,
    valueDefs,
    itemCount: items.length,
    grand: { count: grandCell.count, values: valueDefs.map((vd, i) => cellValueAt(grandCell, i)) },
    itemsByCell,
  };
}

/** 排序結果列；spec: { type: 'name'|'cell'|'total', li?, cKey?, vi?, dir } */
export function sortPivotRows(rows, spec, rowDims, dimensionMap) {
  if (!spec) return rows;
  const mul = spec.dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (spec.type === 'name') {
      return compareDimValues(dimensionMap.get(rowDims[spec.li]), a.parts[spec.li] ?? '', b.parts[spec.li] ?? '') * mul;
    }
    const pick = r => (spec.type === 'total' ? r.totalValues[spec.vi] : r.cells[spec.cKey]?.values[spec.vi]) ?? -Infinity;
    return ((pick(a) - pick(b)) * mul) || String(a.key).localeCompare(String(b.key), 'zh-Hant');
  });
}

/** 依日期起訖過濾（填了起訖時，沒有日期的資料不列入） */
export function filterByDateRange(items, getDay, from, to) {
  const f = DAY_RE.test(from || '') ? from : '';
  const t = DAY_RE.test(to || '') ? to : '';
  if (!f && !t) return items;
  return items.filter(r => {
    const day = getDay(r);
    if (!day) return false;
    if (f && day < f) return false;
    if (t && day > t) return false;
    return true;
  });
}

/** 套用篩選器（篩選器內 OR、篩選器之間 AND）；日期類維度另可限定起訖 */
export function applyPivotFilters(items, filters, dimensionMap) {
  const active = filters
    .filter(f => dimensionMap.has(f.field) && (f.selected?.length > 0 || hasRange(f, dimensionMap)))
    .map(f => {
      const dim = dimensionMap.get(f.field);
      return { dim, sel: f.selected?.length ? new Set(f.selected) : null, range: hasRange(f, dimensionMap) ? f : null };
    });
  if (!active.length) return items;
  return items.filter(item => active.every(({ dim, sel, range }) => {
    let values = dimValuesOf(item, dim);
    if (range) values = values.filter(v => dateValueInRange(v, dim.kind, range.from, range.to));
    if (!values.length) return false;
    return sel ? values.some(v => sel.has(v)) : true;
  }));
}
export function filterIsDateKind(dim) {
  return ['date', 'month', 'week'].includes(dim?.kind);
}
function hasRange(f, dimensionMap) {
  return filterIsDateKind(dimensionMap.get(f.field)) && (DAY_RE.test(f.from || '') || DAY_RE.test(f.to || ''));
}
