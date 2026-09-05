/**
 * 銷售圖面編輯器：圖面 schema（純資料，與 fabric 解耦）
 * 規格：docs/銷售圖面編輯器-spec.md §3.3
 *
 * element 型別：infoCard / line / text / shape
 * 讀取時未知 type 或欄位一律忽略；schemaVersion 升版在 normalizeDrawing 內 migrate。
 */

export const SCHEMA_VERSION = 1;
export const MAX_DRAWING_SIZE = 800 * 1024; // bytes；Firestore 單文件 1MB，保留餘裕

export const DEFAULT_CANVAS = { width: 1920, height: 1080, background: '#ffffff' };

export const DEFAULT_FONT_FAMILY = '"Noto Sans TC", "Microsoft JhengHei", "PingFang TC", sans-serif';

export const DEFAULT_INFO_CARD_STYLE = {
  fill: '#ffffff',
  opacity: 0.95,
  stroke: '#333333',
  strokeWidth: 1.5,
  borderRadius: 4,
  innerStroke: '#cccccc',
  innerStrokeWidth: 1,
  headerFill: '#1e3a8a',
  headerTextColor: '#ffffff',
  labelFill: '#f3f4f6',
  labelTextColor: '#374151',
  valueTextColor: '#111827',
  fontSize: 14,
  fontFamily: DEFAULT_FONT_FAMILY,
  fontWeight: 'normal',
  labelAlign: 'left',
  valueAlign: 'right',
};

export const DEFAULT_INFO_CARD_LAYOUT = {
  colWidths: null,      // null = 依內容自動決定（建立後轉為具體值）
  rowHeights: null,     // null = 全部自動；陣列內 null 表示該列自動
  headerHeight: 32,
  showLabelColumn: true,
  padding: 6,
};

export const DEFAULT_LINE_STYLE = {
  stroke: '#e11d48',
  strokeWidth: 3,
  dash: null,           // 例：[12, 8]
  arrowStart: false,
  arrowEnd: true,
  arrowSize: 14,
};

export const DEFAULT_TEXT_STYLE = {
  fontSize: 24,
  fontFamily: DEFAULT_FONT_FAMILY,
  fontWeight: 'bold',
  color: '#111827',
  background: 'rgba(255,255,255,0.8)',
  padding: 4,
  align: 'left',
};

export const DEFAULT_SHAPE_STYLE = {
  fill: 'rgba(59,130,246,0.15)',
  stroke: '#2563eb',
  strokeWidth: 2,
  dash: null,
  borderRadius: 0,
};

export const ELEMENT_TYPES = ['infoCard', 'line', 'text', 'shape'];

export function genElementId() {
  return `el_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export function createEmptyDrawing(canvas = {}) {
  return {
    schemaVersion: SCHEMA_VERSION,
    canvas: { ...DEFAULT_CANVAS, ...canvas },
    defaults: {
      infoCard: { ...DEFAULT_INFO_CARD_STYLE },
      line: { ...DEFAULT_LINE_STYLE },
      text: { ...DEFAULT_TEXT_STYLE },
      shape: { ...DEFAULT_SHAPE_STYLE },
    },
    elements: [],
  };
}

/** 序列化後大小（bytes，以 UTF-8 估算） */
export function drawingSize(drawing) {
  try {
    const s = JSON.stringify(drawing);
    return typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(s).length : s.length;
  } catch { return 0; }
}

function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }

/**
 * 正規化／補齊預設值（讀取 Firestore 後呼叫）；不合法元素直接丟棄
 */
export function normalizeDrawing(raw) {
  const base = createEmptyDrawing();
  if (!raw || typeof raw !== 'object') return base;
  const out = {
    schemaVersion: SCHEMA_VERSION,
    canvas: { ...base.canvas, ...(raw.canvas || {}) },
    defaults: {
      infoCard: { ...base.defaults.infoCard, ...(raw.defaults?.infoCard || {}) },
      line: { ...base.defaults.line, ...(raw.defaults?.line || {}) },
      text: { ...base.defaults.text, ...(raw.defaults?.text || {}) },
      shape: { ...base.defaults.shape, ...(raw.defaults?.shape || {}) },
    },
    elements: [],
  };
  out.canvas.width = Math.max(100, Number(out.canvas.width) || DEFAULT_CANVAS.width);
  out.canvas.height = Math.max(100, Number(out.canvas.height) || DEFAULT_CANVAS.height);
  const seen = new Set();
  for (const el of (Array.isArray(raw.elements) ? raw.elements : [])) {
    const n = normalizeElement(el, out.defaults);
    if (!n) continue;
    if (seen.has(n.id)) n.id = genElementId();
    seen.add(n.id);
    out.elements.push(n);
  }
  return out;
}

function num(v, d = 0) { const n = Number(v); return isNaN(n) ? d : n; }

export function normalizeElement(el, defaults = createEmptyDrawing().defaults) {
  if (!el || typeof el !== 'object' || !ELEMENT_TYPES.includes(el.type)) return null;
  const id = typeof el.id === 'string' && el.id ? el.id : genElementId();
  const locked = !!el.locked;
  switch (el.type) {
    case 'infoCard': {
      const rows = (Array.isArray(el.rows) ? el.rows : []).map(r => ({
        fieldKey: r?.fieldKey ?? null,
        label: String(r?.label ?? ''),
        value: String(r?.value ?? ''),
        labelOverridden: !!r?.labelOverridden,
        valueOverridden: !!r?.valueOverridden,
      }));
      const layout = { ...DEFAULT_INFO_CARD_LAYOUT, ...(el.layout || {}) };
      if (!Array.isArray(layout.colWidths) || layout.colWidths.length !== 2) layout.colWidths = null;
      if (!Array.isArray(layout.rowHeights)) layout.rowHeights = null;
      return {
        id, type: 'infoCard', locked,
        x: num(el.x), y: num(el.y), scale: Math.min(5, Math.max(0.2, num(el.scale, 1) || 1)), angle: num(el.angle),
        unitDocId: el.unitDocId || null, unitId: el.unitId || '',
        header: { show: el.header?.show !== false, text: String(el.header?.text ?? el.unitId ?? ''), overridden: !!el.header?.overridden },
        rows, layout,
        format: { shortLabel: el.format?.shortLabel !== false, priceUnit: el.format?.priceUnit === 'yuan' ? 'yuan' : 'wan' },
        style: { ...defaults.infoCard, ...(el.style || {}) },
      };
    }
    case 'line':
      return {
        id, type: 'line', locked,
        x1: num(el.x1), y1: num(el.y1), x2: num(el.x2), y2: num(el.y2),
        style: { ...defaults.line, ...(el.style || {}) },
      };
    case 'text':
      return {
        id, type: 'text', locked,
        x: num(el.x), y: num(el.y), width: Math.max(20, num(el.width, 200)), angle: num(el.angle),
        scale: Math.min(10, Math.max(0.1, num(el.scale, 1) || 1)),
        text: String(el.text ?? ''),
        style: { ...defaults.text, ...(el.style || {}) },
      };
    case 'shape':
      return {
        id, type: 'shape', locked,
        shape: el.shape === 'ellipse' ? 'ellipse' : 'rect',
        x: num(el.x), y: num(el.y), width: Math.max(2, num(el.width, 100)), height: Math.max(2, num(el.height, 100)), angle: num(el.angle),
        style: { ...defaults.shape, ...(el.style || {}) },
      };
    default:
      return null;
  }
}

/** 複製元素（新 id + 位移） */
export function cloneElement(el, offset = 20) {
  const c = clone(el);
  c.id = genElementId();
  if (c.type === 'line') { c.x1 += offset; c.y1 += offset; c.x2 += offset; c.y2 += offset; }
  else { c.x += offset; c.y += offset; }
  return c;
}

/** 圖面內是否含內部資料欄位（匯出前提示） */
export function collectFieldKeys(drawing) {
  const keys = new Set();
  for (const el of drawing?.elements || []) {
    if (el.type !== 'infoCard') continue;
    for (const r of el.rows || []) if (r.fieldKey) keys.add(r.fieldKey);
  }
  return [...keys];
}
