/**
 * 戶別「文字標籤」共用工具
 *
 * 資料結構（salesHouseholds.unitTags）：
 *   [{ text: '熱銷', bgColor: '#E53935', textColor: '#FFFFFF' }, ...]
 * - 一戶最多 MAX_UNIT_TAGS 個，順序即顯示優先序（網格右上角先露出前面的）
 * - textColor 未指定時依底色亮度自動判斷黑/白
 * - Excel 匯出/匯入以三欄「文字標籤 / 標籤顏色 / 文字顏色」逗號分隔、依索引對齊
 */

export const MAX_UNIT_TAGS = 5;
export const DEFAULT_TAG_BG = '#607D8B';

/** 預設色塊（底色）；文字色由 getContrastTextColor 自動判斷 */
export const TAG_PRESET_COLORS = [
  { name: '紅', value: '#E53935' },
  { name: '橘', value: '#FB8C00' },
  { name: '黃', value: '#FDD835' },
  { name: '綠', value: '#43A047' },
  { name: '青', value: '#00ACC1' },
  { name: '藍', value: '#1E88E5' },
  { name: '靛', value: '#3949AB' },
  { name: '紫', value: '#8E24AA' },
  { name: '灰', value: '#607D8B' },
  { name: '黑', value: '#212121' },
];

const HEX_RE = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** 是否為合法 hex 色碼（#RGB / #RRGGBB，可省略 #） */
export function isValidHexColor(str) {
  return typeof str === 'string' && HEX_RE.test(str.trim());
}

/** 正規化為大寫 #RRGGBB；不合法回傳 null */
export function normalizeHexColor(str) {
  if (!isValidHexColor(str)) return null;
  let hex = str.trim().replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  return `#${hex.toUpperCase()}`;
}

/** 依底色亮度（YIQ）回傳對比文字色：亮底黑字、暗底白字 */
export function getContrastTextColor(hexColor) {
  const hex = normalizeHexColor(hexColor);
  if (!hex) return '#FFFFFF';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#FFFFFF';
}

/**
 * 正規化單一標籤；text 為空回傳 null。
 * 顏色不合法 → 底色用預設灰、文字色自動判斷。
 */
export function normalizeUnitTag(raw) {
  if (!raw) return null;
  const text = typeof raw === 'string' ? raw.trim() : String(raw.text ?? '').trim();
  if (!text) return null;
  const bgColor = normalizeHexColor(typeof raw === 'object' ? raw.bgColor : null) || DEFAULT_TAG_BG;
  const textColor = normalizeHexColor(typeof raw === 'object' ? raw.textColor : null) || getContrastTextColor(bgColor);
  return { text, bgColor, textColor };
}

/** 正規化標籤陣列：去空、去重複文字、最多 MAX_UNIT_TAGS 個；容忍非陣列輸入 */
export function normalizeUnitTags(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const result = [];
  for (const item of raw) {
    const tag = normalizeUnitTag(item);
    if (!tag || seen.has(tag.text)) continue;
    seen.add(tag.text);
    result.push(tag);
    if (result.length >= MAX_UNIT_TAGS) break;
  }
  return result;
}

/** 從戶別物件取出正規化標籤（顯示用） */
export function getUnitTags(unit) {
  return normalizeUnitTags(unit?.unitTags);
}

/** Excel 匯出：標籤陣列 → 三欄逗號分隔字串 */
export function unitTagsToExportColumns(tags) {
  const list = normalizeUnitTags(tags);
  return {
    unitTags_text: list.map(t => t.text).join(','),
    unitTags_bgColor: list.map(t => t.bgColor).join(','),
    unitTags_textColor: list.map(t => t.textColor).join(','),
  };
}

const splitCell = (v) => (v === null || v === undefined ? '' : String(v))
  .split(/[,，、]/)
  .map(s => s.trim());

/**
 * Excel 匯入：三欄字串 → 標籤陣列（依索引對齊）
 * 回傳 { tags, warnings }；顏色缺漏/不合法 → 回退預設並產生警示文字（不擋整批）
 */
export function parseUnitTagsFromExport(textCell, bgCell, textColorCell, unitId = '') {
  const warnings = [];
  const texts = splitCell(textCell);
  const bgs = splitCell(bgCell);
  const colors = splitCell(textColorCell);
  const raw = [];
  texts.forEach((text, i) => {
    if (!text) return;
    const bgRaw = bgs[i] || '';
    const colorRaw = colors[i] || '';
    if (bgRaw && !isValidHexColor(bgRaw)) {
      warnings.push(`${unitId} 標籤「${text}」標籤顏色「${bgRaw}」格式不正確，已改用預設色`);
    }
    if (colorRaw && !isValidHexColor(colorRaw)) {
      warnings.push(`${unitId} 標籤「${text}」文字顏色「${colorRaw}」格式不正確，已自動判斷`);
    }
    raw.push({ text, bgColor: bgRaw, textColor: colorRaw });
  });
  if (raw.length > MAX_UNIT_TAGS) {
    warnings.push(`${unitId} 標籤超過 ${MAX_UNIT_TAGS} 個，僅保留前 ${MAX_UNIT_TAGS} 個`);
  }
  return { tags: normalizeUnitTags(raw), warnings };
}

/**
 * 從全建案戶別資料推導「常用標籤」（同名標籤取最常用的顏色組合），
 * 供編輯時下拉建議與顏色一致性；依使用次數多→少排序。
 */
export function collectTagSuggestions(households) {
  const stats = new Map(); // text -> { count, colors: Map<key, {count, bgColor, textColor}> }
  for (const unit of households || []) {
    for (const tag of getUnitTags(unit)) {
      if (!stats.has(tag.text)) stats.set(tag.text, { count: 0, colors: new Map() });
      const s = stats.get(tag.text);
      s.count += 1;
      const ck = `${tag.bgColor}|${tag.textColor}`;
      const c = s.colors.get(ck) || { count: 0, bgColor: tag.bgColor, textColor: tag.textColor };
      c.count += 1;
      s.colors.set(ck, c);
    }
  }
  return [...stats.entries()]
    .map(([text, s]) => {
      const best = [...s.colors.values()].sort((a, b) => b.count - a.count)[0];
      return { text, bgColor: best.bgColor, textColor: best.textColor, count: s.count };
    })
    .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text, 'zh-Hant'));
}

/** 列表排序用：依第一個標籤文字 */
export function unitTagsSortValue(tags) {
  const list = normalizeUnitTags(tags);
  return list.length ? list[0].text : '';
}
