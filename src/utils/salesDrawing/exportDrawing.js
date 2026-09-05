/**
 * 銷售圖面編輯器：匯出 PNG／JPEG／WebP／PDF／列印
 * 規格：docs/銷售圖面編輯器-spec.md §4.10
 *
 * 匯出範圍固定為畫布邏輯區域（0,0 ~ canvas.width/height），暫時將 viewportTransform 設為單位矩陣。
 */

export const EXPORT_FORMATS = [
  { value: 'png', label: 'PNG（無損、支援透明）', mime: 'image/png', ext: 'png', lossy: false },
  { value: 'jpeg', label: 'JPEG（檔案小）', mime: 'image/jpeg', ext: 'jpg', lossy: true },
  { value: 'webp', label: 'WebP（檔案最小）', mime: 'image/webp', ext: 'webp', lossy: true },
];

let _webpSupport = null;
export function supportsWebp() {
  if (_webpSupport !== null) return _webpSupport;
  try {
    const c = document.createElement('canvas');
    c.width = 1; c.height = 1;
    _webpSupport = c.toDataURL('image/webp').startsWith('data:image/webp');
  } catch { _webpSupport = false; }
  return _webpSupport;
}

/**
 * 以 fabric canvas 產生圖片 DataURL
 * @param {fabric.Canvas} canvas
 * @param {{format?:string, quality?:number, multiplier?:number, width:number, height:number, background?:string, beforeRender?:Function, afterRender?:Function}} opts
 */
export function renderDrawingDataUrl(canvas, opts) {
  const { format = 'png', quality = 0.92, multiplier = 1, width, height, background } = opts;
  const active = canvas.getActiveObject();
  const vpt = canvas.viewportTransform.slice();
  const prevBg = canvas.backgroundColor;
  canvas.discardActiveObject();
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
  // JPEG 無透明：一律鋪底色；PNG／WebP 無底圖時也鋪白底以符合視覺
  if (background) canvas.backgroundColor = background;
  if (opts.beforeRender) opts.beforeRender();
  let dataUrl;
  try {
    dataUrl = canvas.toDataURL({
      format,
      quality,
      multiplier,
      left: 0, top: 0, width, height,
      enableRetinaScaling: false,
    });
  } finally {
    if (opts.afterRender) opts.afterRender();
    canvas.backgroundColor = prevBg;
    canvas.setViewportTransform(vpt);
    if (active) canvas.setActiveObject(active);
    canvas.requestRenderAll();
  }
  return dataUrl;
}

export async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return res.blob();
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function safeFileName(s) {
  return String(s || '').replace(/[\\/:*?"<>|\s]+/g, '_').replace(/^_+|_+$/g, '') || 'drawing';
}

export function todayStamp() {
  const parts = new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date()).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});
  return `${parts.year}${parts.month}${parts.day}`;
}

/**
 * 匯出 PDF（橫向 A4／A3，依底圖比例 fit，留 10mm 邊）
 */
export async function exportPdf(dataUrl, { pageSize = 'a4', width, height, filename }) {
  const { jsPDF } = await import('jspdf');
  const landscape = width >= height;
  const pdf = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'mm', format: pageSize });
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const maxW = pw - margin * 2, maxH = ph - margin * 2;
  const ratio = Math.min(maxW / width, maxH / height);
  const w = width * ratio, h = height * ratio;
  const x = (pw - w) / 2, y = (ph - h) / 2;
  pdf.addImage(dataUrl, 'JPEG', x, y, w, h, undefined, 'FAST');
  pdf.save(filename);
}

/** 開新視窗列印 */
export function printDataUrl(dataUrl, title = '') {
  const win = window.open('', '_blank');
  if (!win) throw new Error('瀏覽器阻擋了彈出視窗，請允許後再試');
  win.document.write(`<!doctype html><html><head><title>${title}</title>
    <style>@page{margin:8mm}html,body{margin:0;height:100%}body{display:flex;align-items:center;justify-content:center}img{max-width:100%;max-height:100vh}</style>
    </head><body><img src="${dataUrl}" onload="setTimeout(function(){window.print();},200)"></body></html>`);
  win.document.close();
}
