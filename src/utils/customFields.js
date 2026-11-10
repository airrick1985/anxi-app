/**
 * 戶別資料總表「自訂欄位」共用工具
 *
 * 欄位定義存在 projectFieldDefinitions：
 *   fieldName  顯示名稱（可改名）
 *   fieldKey   各戶資料的 key（建立後固定；舊定義沒有此欄，key = fieldName）
 *   fieldType  checkbox | text | select | number | percent
 *   options    下拉選項（select）
 *   decimals   小數位數 0–4（number／percent）
 *   unit       單位文字（number，可空）
 *
 * ％ 欄位存「百分比數值」：輸入 5 或 5% 都存 5，顯示 5%。
 */

export const CUSTOM_FIELD_TYPES = [
  { value: 'checkbox', title: '開關', icon: 'mdi-toggle-switch-outline' },
  { value: 'text', title: '文字', icon: 'mdi-format-text' },
  { value: 'select', title: '下拉', icon: 'mdi-form-dropdown' },
  { value: 'number', title: '數字', icon: 'mdi-pound' },
  { value: 'percent', title: '％', icon: 'mdi-percent-outline' },
];

const TYPE_VALUES = new Set(CUSTOM_FIELD_TYPES.map(t => t.value));
export const MAX_DECIMALS = 4;

export const customFieldKey = (def) => String(def?.fieldKey || def?.fieldName || '');
export const isNumericFieldType = (type) => type === 'number' || type === 'percent';
export const normalizeFieldType = (type) => (TYPE_VALUES.has(type) ? type : 'text');
export const fieldTypeTitle = (type) => CUSTOM_FIELD_TYPES.find(t => t.value === type)?.title || '文字';

export function clampDecimals(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, MAX_DECIMALS);
}

/** 清單上的格式摘要，例：「數字 · 2 位 · 坪」 */
export function fieldFormatSummary(def) {
  const type = normalizeFieldType(def?.fieldType);
  const parts = [fieldTypeTitle(type)];
  if (isNumericFieldType(type)) {
    const d = clampDecimals(def?.decimals);
    if (d > 0) parts.push(`${d} 位小數`);
    if (type === 'number' && def?.unit) parts.push(def.unit);
  } else if (type === 'select') {
    parts.push(`${(def?.options || []).length} 個選項`);
  }
  return parts.join(' · ');
}

// ───────────── 解析輸入 ─────────────

const toHalfWidth = (s) => s
  .replace(/[\uFF01-\uFF5E]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
  .replace(/\u3000/g, ' ');

/**
 * 把輸入轉成數字：接受 1,234、1234.5、30坪、5%、NT$1,000、全形數字
 * 前面有其他文字（例：約30）或夾雜多段數字視為無法判讀
 * @returns {{ empty: true } | { ok: true, value: number, percent: boolean } | { ok: false }}
 */
export function parseNumberInput(raw) {
  if (raw === null || raw === undefined) return { empty: true };
  if (typeof raw === 'number') return Number.isFinite(raw) ? { ok: true, value: raw, percent: false } : { ok: false };
  if (typeof raw === 'boolean') return { ok: false };
  const s = toHalfWidth(String(raw)).replace(/[,\s]/g, '');
  if (s === '') return { empty: true };
  const m = s.match(/^(?:NT\$|\$)?([-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)(.*)$/i);
  if (!m) return { ok: false };
  const rest = m[2];
  if (/\d/.test(rest)) return { ok: false };
  const value = Number(m[1]);
  if (!Number.isFinite(value)) return { ok: false };
  return { ok: true, value, percent: rest.startsWith('%') };
}

const TRUE_WORDS = new Set(['TRUE', 'T', 'Y', 'YES', '1', 'V', '✓', '✔', 'O', 'ON', '是', '有', '開', '已']);
const FALSE_WORDS = new Set(['FALSE', 'F', 'N', 'NO', '0', 'X', '✗', '✘', 'OFF', '否', '無', '關', '未', '-']);

/** @returns {{ empty: true } | { ok: true, value: boolean } | { ok: false }} */
export function parseBooleanInput(raw) {
  if (raw === null || raw === undefined) return { empty: true };
  if (typeof raw === 'boolean') return { ok: true, value: raw };
  if (typeof raw === 'number') return raw === 1 || raw === 0 ? { ok: true, value: raw === 1 } : { ok: false };
  const s = toHalfWidth(String(raw)).trim().toUpperCase();
  if (s === '') return { empty: true };
  if (TRUE_WORDS.has(s)) return { ok: true, value: true };
  if (FALSE_WORDS.has(s)) return { ok: true, value: false };
  return { ok: false };
}

/**
 * 依欄位格式把一個值轉成要存的值
 * cell：{ v, w }（v＝原始值、w＝Excel 顯示文字；貼上資料兩者相同）
 * @returns {{ empty: true } | { ok: true, value: any } | { ok: false }}
 */
export function coerceCellForField(def, cell) {
  const type = normalizeFieldType(def?.fieldType);
  const v = cell?.v;
  const w = cell?.w;
  if (type === 'checkbox') return parseBooleanInput(v);
  if (type === 'number') return parseNumberInput(v);
  if (type === 'percent') {
    if (typeof v === 'number' && Number.isFinite(v)) {
      return { ok: true, value: excelPercentValue(v, w) };
    }
    return parseNumberInput(v);
  }
  // 文字／下拉：用 Excel 顯示文字（日期等格式與畫面一致）
  const text = w !== undefined && w !== null && w !== '' ? String(w) : (v === null || v === undefined ? '' : String(v));
  const trimmed = text.trim();
  return trimmed === '' ? { empty: true } : { ok: true, value: trimmed };
}

/**
 * Excel 數值儲存格轉成百分比數值：
 * - 本系統匯出的格式是「5"%"」→ 值 5、顯示 5%，直接用 5
 * - 使用者在 Excel 打 5% → 值 0.05、顯示 5%，要乘 100
 * 以顯示文字判斷哪一種較接近
 */
export function excelPercentValue(v, w) {
  const shown = typeof w === 'string' && /%\s*$/.test(w) ? parseNumberInput(w) : null;
  if (shown?.ok) {
    const scaled = roundFloat(v * 100);
    if (Math.abs(scaled - shown.value) < Math.abs(v - shown.value)) return scaled;
  }
  return v;
}

const roundFloat = (n) => Math.round(n * 1e10) / 1e10;

// ───────────── 顯示 ─────────────

function formatFixed(n, decimals) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** 依欄位格式顯示值；數字／％ 欄裡讀不出數字的舊資料照原文顯示 */
export function formatCustomFieldValue(value, def) {
  const type = normalizeFieldType(def?.fieldType);
  if (value === null || value === undefined || value === '') return '';
  if (type === 'checkbox') return value === true ? '是' : value === false ? '否' : String(value);
  if (!isNumericFieldType(type)) return Array.isArray(value) ? value.join('、') : String(value);
  const r = parseNumberInput(value);
  if (!r.ok) return String(value);
  const text = formatFixed(r.value, clampDecimals(def?.decimals));
  if (type === 'percent') return `${text}%`;
  return def?.unit ? `${text} ${def.unit}` : text;
}

/** 編輯視窗的預覽範例 */
export function formatPreviewSample(def) {
  const type = normalizeFieldType(def?.fieldType);
  if (type === 'number') return formatCustomFieldValue(1234.5678, def);
  if (type === 'percent') return formatCustomFieldValue(12.3456, def);
  return '';
}

/** Excel 數值格式（真數字＋顯示千分位／小數／單位／%） */
export function excelNumberFormat(def) {
  const type = normalizeFieldType(def?.fieldType);
  const d = clampDecimals(def?.decimals);
  const base = d > 0 ? `#,##0.${'0'.repeat(d)}` : '#,##0';
  if (type === 'percent') return `${base}"%"`;
  const unit = String(def?.unit || '').replace(/["\\]/g, '');
  return unit ? `${base}" ${unit}"` : base;
}

// ───────────── AG Grid 欄位 ─────────────

/**
 * 產生自訂欄位的 AG Grid colDef
 * @param {object} def 欄位定義
 * @param {object} opts { switchRenderer, onInvalidInput(def, raw) }
 */
export function buildCustomFieldColDef(def, { switchRenderer, onInvalidInput } = {}) {
  const key = customFieldKey(def);
  const type = normalizeFieldType(def?.fieldType);
  const colDef = {
    headerName: def.fieldName,
    field: key,
    editable: true,
    valueGetter: params => {
      if (params.data && Object.prototype.hasOwnProperty.call(params.data, key)) return params.data[key];
      return type === 'checkbox' ? false : '';
    },
  };

  if (type === 'checkbox') {
    colDef.cellRenderer = switchRenderer;
  } else if (type === 'select') {
    colDef.cellEditor = 'agSelectCellEditor';
    colDef.cellEditorParams = { values: ['', ...(def.options || [])] };
  } else if (isNumericFieldType(type)) {
    colDef.cellDataType = false;
    colDef.cellEditor = 'agTextCellEditor';
    colDef.cellClass = 'ag-right-aligned-cell';
    colDef.headerClass = 'ag-right-aligned-header';
    colDef.valueFormatter = params => formatCustomFieldValue(params.value, def);
    colDef.valueSetter = params => {
      const data = params.data;
      if (!data) return false;
      const current = data[key];
      const r = parseNumberInput(params.newValue);
      if (r.empty) {
        if (current === null || current === undefined || current === '') return false;
        data[key] = null;
        return true;
      }
      if (!r.ok) {
        onInvalidInput?.(def, params.newValue);
        return false;
      }
      if (current === r.value) return false;
      data[key] = r.value;
      return true;
    };
    colDef.filter = 'agNumberColumnFilter';
    colDef.filterValueGetter = params => {
      const r = parseNumberInput(params.data?.[key]);
      return r.ok ? r.value : null;
    };
    colDef.comparator = (a, b) => {
      const ra = parseNumberInput(a);
      const rb = parseNumberInput(b);
      const na = ra.ok ? ra.value : null;
      const nb = rb.ok ? rb.value : null;
      if (na === null && nb === null) return 0;
      if (na === null) return -1;
      if (nb === null) return 1;
      return na - nb;
    };
  }
  return colDef;
}

// ───────────── 建立欄位 ─────────────

/** 由名稱產生資料 key：去掉 Firestore 路徑會誤判的字元，與既有 key 重複時加 _2、_3… */
export function makeFieldKey(name, takenKeys) {
  let base = String(name || '').trim().replace(/[.\/\[\]*~`$#]/g, '_');
  if (!base) base = 'field';
  if (/^__.*__$/.test(base)) base = `f${base}`;
  let key = base;
  let i = 2;
  while (takenKeys.has(key)) key = `${base}_${i++}`;
  return key;
}

/** 依一欄的值猜格式：全部是數字 → 數字（帶共同單位、小數位數）；全部帶 % → ％；全部 TRUE/FALSE → 開關 */
export function guessFieldFormat(cells) {
  const filled = cells.filter(c => c && c.v !== null && c.v !== undefined && String(c.v).trim() !== '');
  if (filled.length === 0) return { fieldType: 'text', decimals: 0, unit: '' };

  if (filled.every(c => typeof c.v === 'boolean' || /^(TRUE|FALSE)$/i.test(String(c.v).trim()))) {
    return { fieldType: 'checkbox', decimals: 0, unit: '' };
  }

  const decimalsOf = (n) => {
    const s = String(roundFloat(n));
    const i = s.indexOf('.');
    return i === -1 ? 0 : Math.min(s.length - i - 1, MAX_DECIMALS);
  };

  const percentCells = filled.map(c => {
    if (typeof c.v === 'number') return typeof c.w === 'string' && /%\s*$/.test(c.w) ? excelPercentValue(c.v, c.w) : null;
    const r = parseNumberInput(c.v);
    return r.ok && r.percent ? r.value : null;
  });
  if (percentCells.every(v => v !== null)) {
    return { fieldType: 'percent', decimals: Math.max(...percentCells.map(decimalsOf)), unit: '' };
  }

  const units = new Set();
  const nums = [];
  for (const c of filled) {
    const r = parseNumberInput(c.v);
    if (!r.ok || r.percent) return { fieldType: 'text', decimals: 0, unit: '' };
    nums.push(r.value);
    if (typeof c.v === 'string') {
      const unit = toHalfWidth(c.v).replace(/[\d,.\s+\-$]|NT/gi, '').trim();
      if (unit) units.add(unit);
    }
  }
  return {
    fieldType: 'number',
    decimals: Math.max(...nums.map(decimalsOf)),
    unit: units.size === 1 ? [...units][0] : '',
  };
}

// ───────────── 匯入資料 ─────────────

/** 解析從 Excel 複製貼上的文字（Tab 分隔；沒有 Tab 時改用逗號），支援引號包住的多行儲存格 */
export function parsePastedTable(text) {
  const src = String(text || '').replace(/\r\n?/g, '\n');
  const firstLine = src.split('\n').find(l => l.trim() !== '') || '';
  const sep = firstLine.includes('\t') ? '\t' : (firstLine.includes(',') ? ',' : '\t');
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      } else cell += ch;
    } else if (ch === '"' && cell === '') {
      quoted = true;
    } else if (ch === sep) {
      row.push(cell); cell = '';
    } else if (ch === '\n') {
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  row.push(cell);
  rows.push(row);
  return rows
    .filter(r => r.some(c => c.trim() !== ''))
    .map(r => r.map(c => ({ v: c, w: c })));
}

/** 讀 Excel／CSV 第一個工作表成 [[{ v, w }]]，略過整列空白 */
export function readSheetTable(XLSX, arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws || !ws['!ref']) return [];
  const range = XLSX.utils.decode_range(ws['!ref']);
  const rows = [];
  for (let r = range.s.r; r <= range.e.r; r++) {
    const row = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (!cell || cell.v === undefined || cell.v === null) { row.push({ v: '', w: '' }); continue; }
      let w = cell.w;
      if (w === undefined) w = cell.v instanceof Date ? cell.v.toLocaleDateString('zh-TW') : String(cell.v);
      row.push({ v: cell.v, w });
    }
    if (row.some(x => String(x.v).trim() !== '')) rows.push(row);
  }
  return rows;
}

export const cellText = (cell) => {
  if (!cell) return '';
  const t = cell.w !== undefined && cell.w !== null && cell.w !== '' ? cell.w : cell.v;
  return t === null || t === undefined ? '' : String(t).trim();
};

export const hasFieldValue = (v) => {
  if (v === null || v === undefined || v === '' || v === false) return false;
  if (Array.isArray(v)) return v.length > 0;
  return true;
};
