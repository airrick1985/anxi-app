/**
 * 報價單 QR Code 產生工具
 *
 * 用於「列印報價單」右下角的建案簡介 QR Code：
 *  - 以建案簡介網址產生 QR Code（容錯等級 H）
 *  - 中央疊上文字（白底 + 主色外框）：預設為建案名稱、自動大小，也可自訂文字與大小
 *
 * 中央能遮多大取決於 QR Code 密度：網址越短、格數越少，能遮的面積越小。
 * 因此每次都實際解碼驗證（並把白框放大一圈留餘裕）：掃不到就先提高密度，再不行才縮小文字。
 */
import QRCode from 'qrcode';

const QR_DARK = '#1a3c6e';   // 與報價單標題底色一致
const QR_LIGHT = '#ffffff';
const QR_MARGIN = 2;         // 四周留白格數
const AUTO_BOX_RATIO = 0.40; // 自動大小時，中央文字框最大邊長比例
const MANUAL_BOX_RATIO = 0.62; // 自訂大小時的上限（實際上限由解碼驗證決定）
const PAD_RATIO = 0.016;
const LINE_HEIGHT = 1.15;
const MAX_VERSION = 10;      // 列印僅 20mm，密度再高每格會小於 0.33mm
const VERIFY_SIZE = 260;     // 驗證用尺寸，約等於 20mm 於 300dpi
const VERIFY_INFLATE = 1.10; // 驗證時白框放大比例，保留列印與拍攝的餘裕

export const QR_LABEL_FONT = '"Microsoft JhengHei", "Noto Sans TC", "PingFang TC", sans-serif';
export const QR_LABEL_COLOR = QR_DARK;
export const QR_LABEL_LINE_HEIGHT = LINE_HEIGHT;
export const QR_LABEL_MAX_CHARS = 40;
// 字級佔 QR Code 邊長的比例
export const QR_FONT_MIN = 0.035;
export const QR_FONT_MAX = 0.2;

/**
 * 正規化網址：允許使用者只輸入網域（自動補 https://）
 * @param {string} raw
 * @returns {string} 正規化後網址；空值回傳空字串
 */
export function normalizeIntroUrl(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

/**
 * 驗證是否為可用的網址（需有含點的主機名，避免打錯字產生無效 QR Code）
 * @param {string} raw
 * @returns {boolean}
 */
export function isValidIntroUrl(raw) {
  const url = normalizeIntroUrl(raw);
  if (!url) return false;
  try {
    const u = new URL(url);
    return !!u.hostname && u.hostname.includes('.');
  } catch {
    return false;
  }
}

/**
 * 還原儲存的中央文字設定
 * @param {{text: string|null, fontRatio: number|null}|undefined} saved - 未設定者沿用建案名稱、自動大小
 * @returns {{text: string, fontRatio: number|null, custom: boolean}} custom＝自訂文字（換行以使用者輸入為準）
 */
export function resolveQrLabel(saved, projectName) {
  const custom = typeof saved?.text === 'string';
  const ratio = Number(saved?.fontRatio);
  return {
    text: custom ? saved.text : String(projectName || ''),
    fontRatio: ratio > 0 ? Math.min(QR_FONT_MAX, Math.max(QR_FONT_MIN, ratio)) : null,
    custom,
  };
}

/**
 * 產生中央帶文字、確認可掃描的 QR Code
 * @param {string} rawUrl - 建案簡介網址
 * @param {string|{text: string, fontRatio?: number|null, custom?: boolean}} label - 中央文字
 * @param {object} [options] - { size }
 * @returns {Promise<string>} PNG data URL；無網址時回傳空字串
 */
export async function generateQrDataUrl(rawUrl, label = '', options = {}) {
  const url = normalizeIntroUrl(rawUrl);
  if (!url) return '';
  const opts = normalizeLabel(label);
  const fit = await fitIntroQr(url, opts);
  return drawIntroQr(url, { ...opts, ...fit }, options.size || 512).toDataURL('image/png');
}

/**
 * 找出掃得到的 QR 密度與字級
 * @returns {Promise<{version: number, fontRatio: number|null, limited: boolean, verified: boolean}>}
 *   limited＝為了掃得到，字級比要求的小；verified＝false 表示怎麼調都掃不到或無法驗證
 */
export async function fitIntroQr(rawUrl, label) {
  const url = normalizeIntroUrl(rawUrl);
  const opts = normalizeLabel(label);
  const minVersion = createModules(url).version;
  const requested = measureLabel(opts, VERIFY_SIZE)?.fontRatio ?? null;
  if (!requested) return { version: minVersion, fontRatio: opts.fontRatio, limited: false, verified: true };

  const decode = await loadDecoder();
  if (!decode) return { version: Math.max(minVersion, MAX_VERSION), fontRatio: opts.fontRatio, limited: false, verified: false };

  const maxVersion = Math.max(minVersion, MAX_VERSION);
  const passes = (version, fontRatio) => isScannable(url, { ...opts, version, fontRatio }, decode);
  for (let version = minVersion; version <= maxVersion; version += 1) {
    if (passes(version, requested)) return { version, fontRatio: requested, limited: false, verified: true };
  }
  for (let ratio = requested * 0.95; ratio >= QR_FONT_MIN; ratio *= 0.95) {
    if (passes(maxVersion, ratio)) return { version: maxVersion, fontRatio: ratio, limited: true, verified: true };
  }
  return { version: maxVersion, fontRatio: QR_FONT_MIN, limited: true, verified: false };
}

/**
 * 同步繪製（不驗證）：編輯時即時預覽用
 * @returns {HTMLCanvasElement}
 */
export function drawIntroQr(rawUrl, label, size, { hideLabel = false } = {}) {
  const url = normalizeIntroUrl(rawUrl);
  const opts = normalizeLabel(label);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  drawModules(canvas, createModules(url, opts.version).modules);
  if (!hideLabel) {
    const box = measureLabel(opts, size);
    if (box) drawLabel(canvas, box);
  }
  return canvas;
}

/**
 * 中央文字框的位置與實際字級（皆為佔邊長的比例）；沒有文字回傳 null
 */
export function measureIntroLabel(label) {
  const box = measureLabel(normalizeLabel(label), 512);
  return box && {
    w: box.w / 512,
    h: box.h / 512,
    pad: PAD_RATIO,
    fontRatio: box.fontRatio,
    lines: box.lines,
  };
}

// ---------- 內部 ----------
function normalizeLabel(label) {
  if (label && typeof label === 'object') {
    return { ...label, text: String(label.text || ''), fontRatio: label.fontRatio || null, custom: !!label.custom };
  }
  return { text: String(label || ''), fontRatio: null, custom: false };
}

function createModules(url, version) {
  const base = { errorCorrectionLevel: 'H' };
  try {
    return QRCode.create(url, version ? { ...base, version } : base);
  } catch (e) {
    // 指定的密度裝不下（網址改長了）：改用能裝下的最小密度
    return QRCode.create(url, base);
  }
}

function drawModules(canvas, modules, { pad = 0 } = {}) {
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  ctx.fillStyle = QR_LIGHT;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = QR_DARK;
  const n = modules.size;
  const cell = (size - pad * 2) / (n + QR_MARGIN * 2);
  const at = i => Math.round(pad + (i + QR_MARGIN) * cell);
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      if (modules.data[r * n + c]) ctx.fillRect(at(c), at(r), at(c + 1) - at(c), at(r + 1) - at(r));
    }
  }
}

function labelLines({ text, custom }) {
  const trimmed = text.trim();
  if (!trimmed) return [];
  // 自訂文字：照使用者的換行
  if (custom) return trimmed.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // 建案名稱：每行字數盡量接近方形排列（行寬≈行數），字級才能放到最大
  const chars = [...trimmed].length;
  let maxPerLine = chars <= 2 ? chars : Math.min(5, Math.max(2, Math.ceil(Math.sqrt(chars))));
  // 含空白的英文名稱：至少容納最長的單字，避免單字被硬切（純中文無空白者不套用）
  if (/\s/.test(trimmed)) {
    const longestWord = Math.max(...trimmed.split(/\s+/).filter(Boolean).map(w => [...w].length), 0);
    if (longestWord > maxPerLine) maxPerLine = Math.min(10, longestWord);
  }
  return layoutLines(trimmed, maxPerLine);
}

let measureCtx = null;
function measureLabel(opts, size) {
  const lines = labelLines(opts);
  if (!lines.length) return null;
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');

  // 以 100px 量一次，文字寬度與字級成正比
  measureCtx.font = `bold 100px ${QR_LABEL_FONT}`;
  const unitW = Math.max(...lines.map(l => measureCtx.measureText(l).width)) / 100;
  const unitH = lines.length * LINE_HEIGHT;
  const maxInner = (opts.fontRatio ? MANUAL_BOX_RATIO : AUTO_BOX_RATIO) - PAD_RATIO * 2;
  const fontRatio = Math.min(opts.fontRatio || 0.18, maxInner / unitW, maxInner / unitH);
  return {
    lines,
    fontRatio,
    w: (unitW * fontRatio + PAD_RATIO * 2) * size,
    h: (unitH * fontRatio + PAD_RATIO * 2) * size,
  };
}

function drawLabel(canvas, box, { pad = 0 } = {}) {
  const ctx = canvas.getContext('2d');
  const center = canvas.width / 2;
  const size = canvas.width - pad * 2;
  const x = center - box.w / 2;
  const y = center - box.h / 2;

  // 白底 + 主色細框，讓文字與 QR 圖樣明確區隔
  roundRectPath(ctx, x, y, box.w, box.h, Math.min(box.w, box.h) * 0.16);
  ctx.fillStyle = QR_LIGHT;
  ctx.fill();
  ctx.lineWidth = Math.max(1, size * 0.006);
  ctx.strokeStyle = QR_DARK;
  ctx.stroke();

  const fontSize = box.fontRatio * size;
  const lineHeight = fontSize * LINE_HEIGHT;
  ctx.font = `bold ${fontSize}px ${QR_LABEL_FONT}`;
  ctx.fillStyle = QR_DARK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const startY = center - ((box.lines.length - 1) * lineHeight) / 2;
  box.lines.forEach((line, i) => ctx.fillText(line, center, startY + i * lineHeight));
}

// 解碼器只有產生 QR Code 時才載入；載入失敗就略過驗證
let decoderPromise = null;
function loadDecoder() {
  if (!decoderPromise) {
    decoderPromise = import('jsqr').then(m => m.default).catch((e) => {
      console.warn('[quoteQrCode] QR 驗證元件載入失敗:', e);
      decoderPromise = null;
      return null;
    });
  }
  return decoderPromise;
}

function isScannable(url, opts, decode) {
  const pad = 16;
  const canvas = document.createElement('canvas');
  canvas.width = VERIFY_SIZE + pad * 2;
  canvas.height = canvas.width;
  drawModules(canvas, createModules(url, opts.version).modules, { pad });
  const box = measureLabel(opts, VERIFY_SIZE);
  if (box) {
    const w = box.w * VERIFY_INFLATE;
    const h = box.h * VERIFY_INFLATE;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = QR_LIGHT;
    ctx.fillRect((canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    drawLabel(canvas, box, { pad });
  }
  const image = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
  return decode(image.data, canvas.width, canvas.height, { inversionAttempts: 'dontInvert' })?.data === url;
}

/**
 * 文字換行：優先以空白斷詞（英文），過長或無空白（中文）則硬斷
 */
function layoutLines(text, maxPerLine) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';

  const flushLong = () => {
    while ([...cur].length > maxPerLine) {
      const arr = [...cur];
      lines.push(arr.slice(0, maxPerLine).join(''));
      cur = arr.slice(maxPerLine).join('');
    }
  };

  for (const w of words) {
    if (!cur) cur = w;
    else if ([...(`${cur} ${w}`)].length <= maxPerLine) cur = `${cur} ${w}`;
    else { flushLong(); if (cur) lines.push(cur); cur = w; }
    flushLong();
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [String(text)];
}

/**
 * 圓角矩形路徑（相容未支援 ctx.roundRect 的瀏覽器）
 */
function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
