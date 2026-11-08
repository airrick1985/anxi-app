// 上傳前預覽：縮圖、PDF／Word 渲染、HEIC 轉 JPG、照片旋轉與壓縮（SPEC_UnitDocumentUpload.md §9）
// pdfjs、docx-preview、heic2any、html2canvas 都是用到才載入，不進銷控頁的啟動包。
import { getFileExtension } from './unitDocuments';

export const IMAGE_COMPRESS_THRESHOLD = 3 * 1024 * 1024; // 超過 3MB 的 JPG 一律壓縮
export const IMAGE_MAX_EDGE = 2400; // 壓縮後長邊
export const PREVIEW_LAZY_SIZE = 30 * 1024 * 1024; // 超過 30MB 的 PDF／Word 點了才載入預覽
const THUMB_EDGE = 240;
// iOS Safari 單一 canvas 上限約 16.7M 像素，超過會畫出空白
const CANVAS_MAX_PIXELS = 16_000_000;

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'];
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const MIME_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** 'image' | 'heic' | 'pdf' | 'docx' | 'none' */
export function detectPreviewKind(file) {
  const ext = getFileExtension(file?.name);
  const type = String(file?.type || '').toLowerCase();
  if (ext === 'heic' || ext === 'heif' || type === 'image/heic' || type === 'image/heif') return 'heic';
  if (type === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (ext === 'docx' || type === DOCX_MIME) return 'docx';
  if (IMAGE_EXTS.includes(ext) || /^image\/(jpeg|png|webp|gif|bmp)$/.test(type)) return 'image';
  return 'none';
}

/** 處理後的圖片依實際格式決定副檔名（原檔是 jpeg 時保留 jpeg 寫法） */
export function extensionForBlob(blob, originalExt = '') {
  const ext = MIME_EXT[String(blob?.type || '').toLowerCase()];
  if (!ext) return originalExt;
  if (ext === 'jpg' && (originalExt === 'jpg' || originalExt === 'jpeg')) return originalExt;
  return ext;
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('圖片轉檔失敗'))), type, quality);
  });
}

function releaseCanvas(canvas) {
  canvas.width = 0;
  canvas.height = 0;
}

// 用 <img> 解碼：瀏覽器會依 EXIF 方向擺正，drawImage 也會沿用
function loadImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('無法讀取圖片'));
    };
    img.src = url;
  });
}

/**
 * 旋轉／縮小並重新編碼。rotation 為 0／90／180／270；maxEdge 為 0 時不縮小（仍受 canvas 像素上限）。
 * 重新編碼會去除 EXIF（含 GPS）。
 */
export async function transformImage(blob, { rotation = 0, maxEdge = 0, type = 'image/jpeg', quality = 0.92 } = {}) {
  const { img, url } = await loadImage(blob);
  try {
    const nw = img.naturalWidth || 1;
    const nh = img.naturalHeight || 1;
    let scale = 1;
    if (maxEdge && Math.max(nw, nh) > maxEdge) scale = maxEdge / Math.max(nw, nh);
    if (nw * nh * scale * scale > CANVAS_MAX_PIXELS) scale = Math.sqrt(CANVAS_MAX_PIXELS / (nw * nh));
    const w = Math.max(1, Math.round(nw * scale));
    const h = Math.max(1, Math.round(nh * scale));
    const quarter = (((Math.round(rotation / 90) % 4) + 4) % 4);
    const swap = quarter % 2 === 1;
    const canvas = document.createElement('canvas');
    canvas.width = swap ? h : w;
    canvas.height = swap ? w : h;
    const ctx = canvas.getContext('2d');
    if (type === 'image/jpeg') {
      ctx.fillStyle = '#fff'; // 透明 PNG 轉 JPG 時避免變黑底
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((quarter * Math.PI) / 2);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    const out = await canvasToBlob(canvas, type, quality);
    releaseCanvas(canvas);
    return out;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * 依規則產生要上傳的圖片：有旋轉就重新存檔；超過 3MB 的 JPG 一律壓縮（長邊 2400px）。
 * 不需處理（或壓縮後反而更大且沒旋轉）回傳 null，代表上傳原檔。
 */
export async function prepareUploadImage(source, rotation = 0) {
  const type = String(source?.type || '').toLowerCase();
  const isJpeg = type === 'image/jpeg';
  const compress = isJpeg && source.size > IMAGE_COMPRESS_THRESHOLD;
  const rotated = ((rotation % 360) + 360) % 360 !== 0;
  if (!rotated && !compress) return null;
  const outType = isJpeg ? 'image/jpeg' : (type === 'image/webp' ? 'image/webp' : 'image/png');
  const out = await transformImage(source, {
    rotation,
    maxEdge: compress ? IMAGE_MAX_EDGE : 0,
    type: outType,
    quality: compress ? 0.85 : 0.92,
  });
  if (!rotated && out.size >= source.size) return null;
  return out;
}

export async function makeImageThumb(blob) {
  const out = await transformImage(blob, { maxEdge: THUMB_EDGE, type: 'image/jpeg', quality: 0.8 });
  return URL.createObjectURL(out);
}

// ───────── HEIC ─────────
let heicModule = null;
export async function convertHeicToJpeg(file) {
  if (!heicModule) heicModule = import('heic2any');
  const { default: heic2any } = await heicModule;
  const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
  const blob = Array.isArray(out) ? out[0] : out;
  return blob.type ? blob : new Blob([blob], { type: 'image/jpeg' });
}

// ───────── PDF（pdfjs legacy build，支援較舊的 Safari／LINE 內建瀏覽器）─────────
let pdfjsPromise = null;
function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([
      import('pdfjs-dist/legacy/build/pdf.mjs'),
      import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'),
    ]).then(([lib, worker]) => {
      lib.GlobalWorkerOptions.workerSrc = worker.default;
      return lib;
    }).catch((err) => {
      pdfjsPromise = null;
      throw err;
    });
  }
  return pdfjsPromise;
}

/** 開啟 PDF；用完務必呼叫 doc.destroy() */
export async function openPdf(blob) {
  const pdfjs = await getPdfjs();
  const data = new Uint8Array(await blob.arrayBuffer());
  return pdfjs.getDocument({ data, isEvalSupported: false }).promise;
}

/**
 * 將 PDF 頁面畫到 canvas（CSS 寬 cssWidth，依螢幕倍率提高解析度）。
 * 回傳 pdfjs RenderTask：重畫前先 cancel()，同一個 canvas 不可同時有兩個 render。
 */
export async function renderPdfPage(doc, pageNumber, canvas, cssWidth) {
  const page = await doc.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let scale = (cssWidth / base.width) * dpr;
  if (base.width * base.height * scale * scale > CANVAS_MAX_PIXELS) {
    scale = Math.sqrt(CANVAS_MAX_PIXELS / (base.width * base.height));
    dpr = scale / (cssWidth / base.width);
  }
  const viewport = page.getViewport({ scale });
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  canvas.style.width = `${Math.floor(cssWidth)}px`;
  canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;
  return page.render({ canvasContext: canvas.getContext('2d'), viewport });
}

/** PDF 第 1 頁縮圖 → { url, pages } */
export async function makePdfThumb(blob) {
  const doc = await openPdf(blob);
  try {
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const scale = THUMB_EDGE / Math.max(base.width, base.height);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    const out = await canvasToBlob(canvas, 'image/jpeg', 0.8);
    releaseCanvas(canvas);
    return { url: URL.createObjectURL(out), pages: doc.numPages };
  } finally {
    doc.destroy();
  }
}

// ───────── Word（.docx，docx-preview）─────────
let docxModule = null;
let docxSeq = 0;
/** 每次渲染用不同 class 前綴，避免多份文件的樣式互相覆蓋 */
export function nextDocxClassName(prefix = 'udx') {
  docxSeq += 1;
  return `${prefix}${docxSeq}`;
}

/** 將 .docx 渲染到 container（樣式也放在 container 內，移除 container 即一併清掉） */
export async function renderDocx(blob, container, className = nextDocxClassName()) {
  if (!docxModule) docxModule = import('docx-preview');
  const { renderAsync } = await docxModule;
  container.innerHTML = '';
  await renderAsync(blob, container, container, {
    className,
    inWrapper: true,
    breakPages: true,
    ignoreLastRenderedPageBreak: false,
    useBase64URL: true, // 內嵌圖片用 data URL，不留下未釋放的 blob URL
    renderComments: false,
    renderChanges: false,
    experimental: false,
  });
  return className;
}

/** Word 第 1 頁縮圖：在畫面外渲染後用 html2canvas 截圖 → object URL */
export async function makeDocxThumb(blob) {
  const host = document.createElement('div');
  const hostId = `docx-thumb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  host.id = hostId;
  host.style.cssText = 'position:fixed;left:0;top:0;width:900px;opacity:0;pointer-events:none;z-index:-1;';
  document.body.appendChild(host);
  try {
    const className = await renderDocx(blob, host);
    const page = host.querySelector(`section.${className}`);
    if (!page) throw new Error('docx 沒有頁面');
    const width = page.offsetWidth || 794;
    const height = Math.min(page.offsetHeight || width * 1.414, Math.round(width * 1.414));
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(page, {
      scale: THUMB_EDGE / Math.max(width, height),
      width,
      height,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (doc) => {
        const clone = doc.getElementById(hostId);
        if (clone) clone.style.opacity = '1';
      },
    });
    const out = await canvasToBlob(canvas, 'image/jpeg', 0.8);
    releaseCanvas(canvas);
    return URL.createObjectURL(out);
  } finally {
    host.remove();
  }
}

export function revokeUrl(url) {
  if (url && String(url).startsWith('blob:')) {
    try { URL.revokeObjectURL(url); } catch (e) { /* noop */ }
  }
}
