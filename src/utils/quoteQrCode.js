/**
 * 報價單 QR Code 產生工具
 *
 * 用於「列印報價單」右下角的建案簡介 QR Code：
 *  - 以建案簡介網址產生 QR Code（容錯等級 H，中央可覆蓋圖樣仍可掃描）
 *  - 中央疊上建案名稱文字（白底 + 主色外框），文字會自動換行並縮放至安全範圍內
 *
 * 中央覆蓋區邊長為畫面 40%（面積約 16%），仍在 H 等級容許約 30% 破損的安全範圍內，
 * 兼顧建案名稱可讀性與實際列印後的掃描成功率。
 */
import QRCode from 'qrcode';

const QR_DARK = '#1a3c6e';   // 與報價單標題底色一致
const QR_LIGHT = '#ffffff';
const OVERLAY_RATIO = 0.40;  // 中央覆蓋區最大佔比（邊長比例）

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
 * 產生「中央帶建案名稱」的 QR Code
 * @param {string} rawUrl - 建案簡介網址
 * @param {string} label - 中央文字（建案名稱）
 * @param {object} [options] - { size, dark, light }
 * @returns {Promise<string>} PNG data URL；無網址時回傳空字串
 */
export async function generateQrDataUrl(rawUrl, label = '', options = {}) {
  const url = normalizeIntroUrl(rawUrl);
  if (!url) return '';

  const size = options.size || 512;
  const dark = options.dark || QR_DARK;
  const light = options.light || QR_LIGHT;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  await QRCode.toCanvas(canvas, url, {
    width: size,
    margin: 2,
    errorCorrectionLevel: 'H', // 高容錯，容許中央覆蓋建案名稱
    color: { dark, light },
  });

  const text = String(label || '').trim();
  if (text) drawCenterLabel(canvas, text, { dark, light });

  return canvas.toDataURL('image/png');
}

/**
 * 於畫布中央繪製文字標籤（白底圓角框 + 主色外框）
 */
function drawCenterLabel(canvas, text, { dark, light }) {
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  const maxBox = size * OVERLAY_RATIO;
  const pad = size * 0.016;
  const maxTextW = maxBox - pad * 2;
  const maxTextH = maxBox - pad * 2;

  // 每行字數盡量接近方形排列（行寬≈行數），字級才能放到最大
  const chars = [...text].length;
  let maxPerLine = chars <= 2 ? chars : Math.min(5, Math.max(2, Math.ceil(Math.sqrt(chars))));
  // 含空白的英文名稱：至少容納最長的單字，避免單字被硬切（純中文無空白者不套用）
  if (/\s/.test(text)) {
    const longestWord = Math.max(...text.split(/\s+/).filter(Boolean).map(w => [...w].length), 0);
    if (longestWord > maxPerLine) maxPerLine = Math.min(10, longestWord);
  }
  const lines = layoutLines(text, maxPerLine);

  // 由大往小縮，直到文字塊塞得進中央安全區
  let fontSize = Math.round(size * 0.18);
  const measure = () => {
    ctx.font = `bold ${fontSize}px "Microsoft JhengHei", "Noto Sans TC", "PingFang TC", sans-serif`;
    const w = Math.max(...lines.map(l => ctx.measureText(l).width));
    const h = lines.length * fontSize * 1.15;
    return { w, h };
  };
  let { w: textW, h: textH } = measure();
  while (fontSize > 8 && (textW > maxTextW || textH > maxTextH)) {
    fontSize -= 1;
    ({ w: textW, h: textH } = measure());
  }

  const boxW = Math.min(textW + pad * 2, maxBox);
  const boxH = Math.min(textH + pad * 2, maxBox);
  const x = (size - boxW) / 2;
  const y = (size - boxH) / 2;
  const radius = Math.min(boxW, boxH) * 0.16;

  // 白底 + 主色細框，讓文字與 QR 圖樣明確區隔
  roundRectPath(ctx, x, y, boxW, boxH, radius);
  ctx.fillStyle = light;
  ctx.fill();
  ctx.lineWidth = Math.max(1, size * 0.006);
  ctx.strokeStyle = dark;
  ctx.stroke();

  ctx.fillStyle = dark;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lineHeight = fontSize * 1.15;
  const startY = size / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, size / 2, startY + i * lineHeight, boxW - pad * 2);
  });
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
