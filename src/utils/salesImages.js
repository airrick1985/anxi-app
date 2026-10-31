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
