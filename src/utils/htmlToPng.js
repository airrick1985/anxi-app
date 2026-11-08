/**
 * HTML → PNG：交給瀏覽器原生排版（SVG foreignObject）後畫到 canvas。
 *
 * 為什麼不直接用 html2canvas：它會自己量每個詞的位置再逐一畫字，
 * Safari 開了頁面縮放（⌘+、網站縮放 125% 等）時量到的位置跟著放大、字卻沒放大，
 * 產出的圖字距整個錯開。這裡讓瀏覽器自己排版，圖上的字和網頁一致；
 * 只有在這條路失敗（瀏覽器不支援或畫出空白）時才退回 html2canvas。
 *
 * 使用限制：樣式寫在 inline style 或 css 參數（不會帶入網站的 CSS）；
 * 不能用外部圖片與網頁字型（SVG 圖片內不載入外部資源），字型用系統字型。
 */

export const PNG_FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "PingFang TC", "Heiti TC", "Microsoft JhengHei", "Noto Sans TC", "Noto Sans CJK TC", sans-serif';

const ROOT_CLASS = 'html-png-root';

// 手機（尤其 iOS Safari）canvas 面積上限約 16.7M 像素，超過會變空白圖；桌機寬鬆許多
const isMobileDevice = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints || 0) > 1;
const maxCanvasArea = () => (isMobileDevice() ? 16_000_000 : 120_000_000);
const MAX_CANVAS_SIDE = 32_000;

const baseCss = (width) => `
.${ROOT_CLASS}{display:flow-root;width:${width}px;margin:0;background:#fff;color:#1a1a1a;
font-family:${PNG_FONT_FAMILY};font-size:16px;line-height:1.5;
-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%;text-size-adjust:100%}
.${ROOT_CLASS} *,.${ROOT_CLASS} *::before,.${ROOT_CLASS} *::after{box-sizing:border-box}`;

const nextFrame = () => new Promise(resolve => requestAnimationFrame(() => resolve()));
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// XML 不允許的控制字元（使用者資料可能夾帶），留著會讓 SVG 解析失敗
const stripInvalidXmlChars = (s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '');

// 放進獨立的 iframe 排版：不受網站 CSS 影響，量到的高度和 SVG 內的排版一致
function mountInIsolatedFrame(html, width, css) {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  Object.assign(frame.style, {
    position: 'fixed', left: '-100000px', top: '0',
    width: `${width + 40}px`, height: '200px', border: '0',
    visibility: 'hidden', pointerEvents: 'none',
  });
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  doc.open();
  doc.write('<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#fff"></body></html>');
  doc.close();
  const root = doc.createElement('div');
  root.className = ROOT_CLASS;
  root.innerHTML = `<style>${baseCss(width)}${css}</style>${html}`;
  doc.body.appendChild(root);
  return { frame, doc, root };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('圖片排版失敗'));
    img.src = src;
  });
}

const canvasToBlob = (canvas) => new Promise((resolve, reject) =>
  canvas.toBlob(b => (b ? resolve(b) : reject(new Error('圖片轉檔失敗'))), 'image/png'));

// 縮成小圖檢查是否整張空白（Safari 偶爾畫不出 foreignObject 內容）
function isBlankCanvas(canvas) {
  const probe = document.createElement('canvas');
  probe.width = 48;
  probe.height = 48;
  const ctx = probe.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(canvas, 0, 0, 48, 48);
  const { data } = ctx.getImageData(0, 0, 48, 48);
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] < 200 || data[i + 1] < 200 || data[i + 2] < 200) return false;
  }
  return true;
}

async function renderViaForeignObject(root, width, height, scale) {
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const xhtml = stripInvalidXmlChars(new XMLSerializer().serializeToString(root));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${width} ${height}">`
    + `<foreignObject x="0" y="0" width="${width}" height="${height}">${xhtml}</foreignObject></svg>`;
  const img = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const draw = () => {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
  };
  draw();
  if (isBlankCanvas(canvas)) {
    // Safari 第一次繪製偶爾還沒排好版，稍等再畫一次
    await wait(150);
    draw();
    if (isBlankCanvas(canvas)) throw new Error('foreignObject 繪製結果為空白');
  }
  return canvasToBlob(canvas);
}

async function renderViaHtml2canvas(root, scale) {
  const html2canvas = (await import('html2canvas')).default;
  const canvas = await html2canvas(root, { scale, useCORS: true, backgroundColor: '#ffffff' });
  return canvasToBlob(canvas);
}

/**
 * @param {string} html  內容（inline style）
 * @param {object} opts
 * @param {number} opts.width  圖片寬度（CSS px）
 * @param {number} [opts.scale=2]  輸出倍率；內容太長時自動降低以免超過 canvas 上限
 * @param {string} [opts.css]  額外 CSS（會一起放進圖片內）
 * @returns {Promise<Blob>} PNG
 */
export async function renderHtmlToPngBlob(html, { width, scale = 2, css = '' } = {}) {
  const { frame, doc, root } = mountInIsolatedFrame(html, width, css);
  try {
    if (doc.fonts?.ready) await Promise.race([doc.fonts.ready, wait(1500)]);
    await nextFrame();
    // 頁面縮放時 getBoundingClientRect 可能是放大後的值，用寬度比例換回 CSS px
    const rect = root.getBoundingClientRect();
    const ratio = rect.width > 0 ? rect.width / width : 1;
    const height = Math.max(1, Math.ceil(rect.height / ratio));

    let outScale = scale;
    const area = width * height;
    if (area * outScale * outScale > maxCanvasArea()) outScale = Math.sqrt(maxCanvasArea() / area);
    if (height * outScale > MAX_CANVAS_SIDE) outScale = MAX_CANVAS_SIDE / height;

    try {
      return await renderViaForeignObject(root, width, height, outScale);
    } catch (e) {
      console.warn('原生排版轉圖失敗，改用 html2canvas:', e);
      return await renderViaHtml2canvas(root, outScale);
    }
  } finally {
    frame.remove();
  }
}
