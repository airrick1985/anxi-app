// 聯絡名單「狀態顏色」共用工具
// - 預設色表供名單頁、回報 Dialog、設定 Dialog 共用，避免各自維護一份
// - 櫃台人員可在「聯絡名單系統設定」自訂每個狀態的顏色，存於 projectSettings.statusColors
// - 卡片／表格列以該顏色做淡色底 + 左側色條，方便人員一眼辨識狀態

export const LEAD_STATUS_UNPROCESSED = '未處理';
export const LEAD_STATUS_LEGACY = '舊資料上傳';

export const DEFAULT_LEAD_STATUS_COLORS = {
  '已約賞屋': '#4CAF50',
  '不考慮': '#F44336',
  '未接': '#FF9800',
  '空號': '#9E9E9E',
  [LEAD_STATUS_UNPROCESSED]: '#FF5722',
  [LEAD_STATUS_LEGACY]: '#607D8B',
};

// 其他自訂狀態未指定顏色時的預設值（indigo）
export const LEAD_STATUS_FALLBACK_COLOR = '#3949AB';

// 設定 Dialog 提供的快速色票（柔和、彼此易區分）
export const LEAD_STATUS_COLOR_PRESETS = [
  '#4CAF50', '#8BC34A', '#009688', '#00BCD4', '#2196F3', '#3949AB', '#673AB7', '#9C27B0',
  '#E91E63', '#F44336', '#FF5722', '#FF9800', '#FFC107', '#795548', '#607D8B', '#9E9E9E',
];

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export const isValidHexColor = (v) => typeof v === 'string' && HEX_RE.test(v.trim());

export const normalizeHexColor = (v) => {
  if (!isValidHexColor(v)) return null;
  let hex = v.trim().toUpperCase();
  if (hex.length === 4) hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  return hex;
};

/**
 * 取得狀態顏色：自訂 > 預設 > fallback；空狀態視為「未處理」
 * @param {string} status
 * @param {Record<string,string>} custom projectSettings.statusColors
 */
export const resolveLeadStatusColor = (status, custom = {}) => {
  const key = status || LEAD_STATUS_UNPROCESSED;
  const own = normalizeHexColor(custom?.[key]);
  if (own) return own;
  return DEFAULT_LEAD_STATUS_COLORS[key] || LEAD_STATUS_FALLBACK_COLOR;
};

export const getDefaultLeadStatusColor = (status) =>
  DEFAULT_LEAD_STATUS_COLORS[status || LEAD_STATUS_UNPROCESSED] || LEAD_STATUS_FALLBACK_COLOR;

export const hexToRgba = (hex, alpha = 1) => {
  const n = normalizeHexColor(hex);
  if (!n) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(n.slice(1, 3), 16);
  const g = parseInt(n.slice(3, 5), 16);
  const b = parseInt(n.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

/**
 * 卡片／表格列的狀態底色樣式（淡色底 + 左側色條，透過 CSS 變數供 :deep 規則使用）
 */
export const buildLeadStatusStyle = (status, custom = {}, { bgAlpha = 0.09 } = {}) => {
  const color = resolveLeadStatusColor(status, custom);
  return {
    '--lead-status-color': color,
    backgroundColor: hexToRgba(color, bgAlpha),
  };
};

/**
 * 儲存前整理：只保留合法 hex 且仍存在的狀態；與預設相同者不必存
 */
export const pruneLeadStatusColors = (colors = {}, statusNames = []) => {
  const allowed = new Set([LEAD_STATUS_UNPROCESSED, LEAD_STATUS_LEGACY, ...statusNames]);
  const out = {};
  Object.entries(colors || {}).forEach(([name, val]) => {
    const hex = normalizeHexColor(val);
    if (!hex || !allowed.has(name)) return;
    if (hex === getDefaultLeadStatusColor(name).toUpperCase()) return;
    out[name] = hex;
  });
  return out;
};
