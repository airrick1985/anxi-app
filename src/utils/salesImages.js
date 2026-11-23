// 銷控圖片管理共用工具（建案設定「銷控圖片管理」）
// 圖片名稱規則需與 functions/salesImages.js 的 normalizeImageName 一致

export const SALES_IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp';
export const SALES_IMAGE_MAX_BYTES = 1024 * 1024;
export const SALES_IMAGE_NAME_MAX = 80;

export const SALES_IMAGE_FORMATS = ['PNG', 'JPG', 'WEBP'];

export function normalizeImageName(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

/** 回傳錯誤訊息；合法時回傳空字串。taken：已存在（或本次已使用）的名稱集合 */
export function imageNameError(value, taken = new Set()) {
  const name = normalizeImageName(value);
  if (!name) return '請輸入名稱';
  if (name.length > SALES_IMAGE_NAME_MAX) return `最多 ${SALES_IMAGE_NAME_MAX} 字`;
  if (/[/\\,，]/.test(name)) return '不可包含 / \\ 或逗號';
  if (/^__.*__$/.test(name) || name === '.' || name === '..') return '名稱不可使用';
  if (taken.has(name)) return '名稱已存在';
  return '';
}

/** 名稱已被使用時依序加上 (2)、(3)…；不合法字元換成空白並截到長度上限 */
export function uniqueImageName(value, taken = new Set()) {
  const base = normalizeImageName(String(value ?? '').replace(/[/\\,，]/g, ' ')) || '圖片';
  const fit = (name, suffix = '') => `${name.slice(0, SALES_IMAGE_NAME_MAX - suffix.length).trim()}${suffix}`;
  let name = fit(base);
  for (let n = 2; taken.has(name); n += 1) name = fit(base, ` (${n})`);
  return name;
}

export function fileBaseName(fileName) {
  const name = String(fileName || '');
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
}

export function imageFormat(image) {
  const type = String(image?.contentType || '').toLowerCase();
  if (type === 'image/png') return 'PNG';
  if (type === 'image/jpeg') return 'JPG';
  if (type === 'image/webp') return 'WEBP';
  const ext = String(image?.fileName || '').split('.').pop().toLowerCase();
  if (ext === 'png') return 'PNG';
  if (ext === 'jpg' || ext === 'jpeg') return 'JPG';
  if (ext === 'webp') return 'WEBP';
  return '';
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function timestampMs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (typeof ts.seconds === 'number') return ts.seconds * 1000;
  const ms = new Date(ts).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

const unitCollator = new Intl.Collator('zh-Hant', { numeric: true });

/** 戶別引用表：Map<圖片名稱, 戶別陣列（自然排序）> */
export function buildImageUsage(households) {
  const usage = new Map();
  for (const h of households || []) {
    if (!Array.isArray(h.salesImages)) continue;
    const unit = h.unitId || h.id;
    for (const name of new Set(h.salesImages)) {
      if (!name) continue;
      if (!usage.has(name)) usage.set(name, []);
      usage.get(name).push(unit);
    }
  }
  usage.forEach(units => units.sort(unitCollator.compare));
  return usage;
}

/** 戶別的引用鍵（與 buildImageUsage 相同） */
export const householdUnitKey = h => h.unitId || h.id;

/** 樓層統一成整數字串（"3F"、" 3" → "3"）；無法解析（B1、店面…）保留原字串，空白回傳 '' */
export function floorKeyOf(value) {
  const s = String(value ?? '').trim();
  if (!s) return '';
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? String(n) : s;
}
export const floorLabel = key => (/^-?\d+$/.test(key) ? `${key}F` : (key || '未設定'));
export const buildingLabel = key => key || '未分棟';

/** 樓層由高到低；數字樓層在前，未設定排最後 */
export function compareFloorDesc(a, b) {
  if (a === b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  const na = /^-?\d+$/.test(a) ? Number(a) : null;
  const nb = /^-?\d+$/.test(b) ? Number(b) : null;
  if (na !== null && nb !== null) return nb - na;
  if (na !== null) return -1;
  if (nb !== null) return 1;
  return unitCollator.compare(a, b);
}

/** 戶別清單（樓層由高到低、棟別、戶別排序）：[{ docId, unitId, building, floorKey }] */
export function buildUnitList(households) {
  return (households || [])
    .map(h => ({
      docId: h.id,
      unitId: householdUnitKey(h),
      building: String(h.building ?? '').trim(),
      floorKey: floorKeyOf(h.floor),
    }))
    .sort((a, b) => compareFloorDesc(a.floorKey, b.floorKey)
      || unitCollator.compare(a.building, b.building)
      || unitCollator.compare(a.unitId, b.unitId));
}

/** 棟別／樓層選項：[{ title, value }] */
export function unitFilterOptions(units) {
  const buildings = [...new Set(units.map(u => u.building))].sort((a, b) => (!a) - (!b) || unitCollator.compare(a, b));
  const floors = [...new Set(units.map(u => u.floorKey))].sort(compareFloorDesc);
  return {
    buildings: buildings.map(value => ({ title: buildingLabel(value), value })),
    floors: floors.map(value => ({ title: floorLabel(value), value })),
  };
}

/** 讀取圖片寬高；無法解碼時回傳 null */
export function readImageSize(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(url); };
    img.onerror = () => { resolve(null); URL.revokeObjectURL(url); };
    img.src = url;
  });
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error('無法讀取檔案'));
    reader.readAsDataURL(file);
  });
}
