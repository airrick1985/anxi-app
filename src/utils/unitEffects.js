/**
 * 戶別「網格邊框特效」共用工具
 *
 * 資料結構（salesHouseholds.unitEffect）：
 *   { preset: 'breath', color: '#E53935' }   或 null（無特效）
 * - 每戶一組，與文字標籤 unitTags 各自獨立、可同時使用
 * - preset 必須是 UNIT_EFFECT_PRESETS 內的 key；color 不合法時回退該範本預設色
 * - 顯示：套用 class `unit-fx unit-fx--<preset>` 並以 CSS 變數 --fx-color 帶入顏色
 *   （樣式定義於 src/styles/unitEffects.css，全域載入，網格／列表／範本預覽共用）
 * - Excel 匯出/匯入以兩欄「邊框特效 / 特效顏色」對應（特效欄可填範本名稱或 key）
 */
import { normalizeHexColor, TAG_PRESET_COLORS } from './unitTags';

/** 邊框特效範本（順序即選擇器顯示順序） */
export const UNIT_EFFECT_PRESETS = [
  { key: 'solid',   name: '實線加粗', desc: '加粗實色邊框，靜態不閃動',     color: '#E53935', animated: false, usesColor: true },
  { key: 'glow',    name: '柔光暈染', desc: '邊框向外柔和暈光，靜態',       color: '#1E88E5', animated: false, usesColor: true },
  { key: 'breath',  name: '呼吸暈光', desc: '暈光緩慢明暗起伏，像呼吸一樣', color: '#E53935', animated: true,  usesColor: true },
  { key: 'blink',   name: '閃爍邊框', desc: '邊框規律亮滅，最醒目的提醒',   color: '#FB8C00', animated: true,  usesColor: true },
  { key: 'neon',    name: '霓虹燈管', desc: '霓虹光暈帶不規則閃動',         color: '#D500F9', animated: true,  usesColor: true },
  { key: 'ripple',  name: '波紋擴散', desc: '光圈由邊框向外擴散消失',       color: '#43A047', animated: true,  usesColor: true },
  { key: 'flow',    name: '流光環繞', desc: '一道光沿著邊框繞行',           color: '#00ACC1', animated: true,  usesColor: true },
  { key: 'stripes', name: '斜紋流動', desc: '警示斜紋沿邊框滾動',           color: '#FDD835', animated: true,  usesColor: true },
  { key: 'rainbow', name: '彩虹流轉', desc: '多彩漸層邊框旋轉流動（不需選色）', color: '#FF4081', animated: true,  usesColor: false },
];

const PRESET_MAP = new Map(UNIT_EFFECT_PRESETS.map(p => [p.key, p]));
const PRESET_BY_NAME = new Map(UNIT_EFFECT_PRESETS.map(p => [p.name, p]));

/** 特效可選顏色（沿用標籤色盤，保持全站一致） */
export const EFFECT_PRESET_COLORS = TAG_PRESET_COLORS;

/** 取得範本定義；找不到回傳 null */
export function getUnitEffectPreset(key) {
  return PRESET_MAP.get(String(key || '').trim()) || null;
}

/**
 * 正規化特效設定；preset 不合法或為空回傳 null。
 * color 不合法 → 回退範本預設色。
 */
export function normalizeUnitEffect(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const preset = getUnitEffectPreset(raw.preset);
  if (!preset) return null;
  const color = normalizeHexColor(raw.color) || preset.color;
  return { preset: preset.key, color };
}

/** 從戶別物件取出正規化特效（顯示用） */
export function getUnitEffect(unit) {
  return normalizeUnitEffect(unit?.unitEffect);
}

/** 顯示用 class 陣列：無特效回傳空陣列 */
export function unitEffectClass(effect) {
  const fx = normalizeUnitEffect(effect);
  return fx ? ['unit-fx', `unit-fx--${fx.preset}`] : [];
}

/** 顯示用 inline style（CSS 變數）：無特效回傳空物件 */
export function unitEffectStyle(effect) {
  const fx = normalizeUnitEffect(effect);
  return fx ? { '--fx-color': fx.color } : {};
}

/** 特效顯示名稱（快速選單、摘要用）；無特效回傳空字串 */
export function unitEffectLabel(effect) {
  const fx = normalizeUnitEffect(effect);
  return fx ? (getUnitEffectPreset(fx.preset)?.name || fx.preset) : '';
}

/** Excel 匯出：特效 → 兩欄（範本名稱 / 色碼） */
export function unitEffectToExportColumns(effect) {
  const fx = normalizeUnitEffect(effect);
  return {
    unitEffect_preset: fx ? (getUnitEffectPreset(fx.preset)?.name || fx.preset) : '',
    unitEffect_color: fx ? fx.color : '',
  };
}

/**
 * Excel 匯入：兩欄字串 → 特效設定
 * 回傳 { effect, warnings }；範本欄空白 → null（清除特效）；
 * 範本名稱/key 查不到 → 略過並警示；顏色不合法 → 回退範本預設色並警示（不擋整批）
 */
export function parseUnitEffectFromExport(presetCell, colorCell, unitId = '') {
  const warnings = [];
  const presetText = (presetCell === null || presetCell === undefined) ? '' : String(presetCell).trim();
  if (!presetText) return { effect: null, warnings };
  const preset = PRESET_BY_NAME.get(presetText) || getUnitEffectPreset(presetText);
  if (!preset) {
    warnings.push(`${unitId} 邊框特效「${presetText}」不是可用的範本，已略過`);
    return { effect: null, warnings };
  }
  const colorText = (colorCell === null || colorCell === undefined) ? '' : String(colorCell).trim();
  let color = normalizeHexColor(colorText);
  if (colorText && !color) {
    warnings.push(`${unitId} 特效顏色「${colorText}」格式不正確，已改用範本預設色`);
  }
  if (!color) color = preset.color;
  return { effect: { preset: preset.key, color }, warnings };
}
