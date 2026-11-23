// src/utils/activityCover.js
// 活動訊息封面縮圖：上傳時產生小圖；舊 PDF 沒有封面時，在瀏覽器畫出第一頁
import { ACTIVITY_PDF_TYPE } from '@/utils/activityMessage';

const COVER_EDGE = 900;
const COVER_QUALITY = 0.82;
// 小於此大小的圖片直接當縮圖用，不另產生封面
const COVER_MIN_IMAGE_BYTES = 250 * 1024;

function toJpeg(canvas) {
  return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', COVER_QUALITY));
}

async function imageCover(file) {
  if (file.size < COVER_MIN_IMAGE_BYTES) return null;
  const bmp = await createImageBitmap(file);
  try {
    const ratio = Math.min(1, COVER_EDGE / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bmp.width * ratio));
    canvas.height = Math.max(1, Math.round(bmp.height * ratio));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await toJpeg(canvas);
    return blob && blob.size < file.size * 0.6 ? blob : null;
  } finally {
    bmp.close?.();
  }
}

/** 開啟 PDF（pdfjs 與中文 CMap 有用到才載入）；用完呼叫 doc.destroy() */
export async function openActivityPdf(bytes) {
  const { openPdfBytes } = await import('@/utils/contractPrint/pdfjsLoader');
  return openPdfBytes(bytes);
}

async function pdfCover(bytes) {
  const doc = await openActivityPdf(bytes);
  try {
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: COVER_EDGE / Math.max(base.width, base.height) });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    return { blob: await toJpeg(canvas), pageCount: doc.numPages };
  } finally {
    doc.destroy();
  }
}

/** 上傳前由檔案產生封面；回傳 { file|null, pageCount }，失敗不影響上傳 */
export async function buildActivityCover(file, contentType) {
  try {
    if (contentType === ACTIVITY_PDF_TYPE) {
      const { blob, pageCount } = await pdfCover(new Uint8Array(await file.arrayBuffer()));
      return { file: blob ? new File([blob], 'cover.jpg', { type: 'image/jpeg' }) : null, pageCount };
    }
    const blob = await imageCover(file);
    return { file: blob ? new File([blob], 'cover.jpg', { type: 'image/jpeg' }) : null, pageCount: 0 };
  } catch (err) {
    console.warn('產生活動訊息封面失敗：', err);
    return { file: null, pageCount: 0 };
  }
}

// ---------- 已上傳的 PDF ----------
// 最近開過的 PDF 內容（縮圖與瀏覽共用，避免重複下載）
const BYTES_CACHE_MAX = 4;
const bytesCache = new Map();

export function fetchPdfBytes(url) {
  let pending = bytesCache.get(url);
  if (pending) {
    bytesCache.delete(url);
    bytesCache.set(url, pending);
    return pending;
  }
  pending = fetch(url).then(async (res) => {
    if (!res.ok) throw new Error(`取得 PDF 失敗（HTTP ${res.status}）`);
    return new Uint8Array(await res.arrayBuffer());
  });
  pending.catch(() => bytesCache.delete(url));
  bytesCache.set(url, pending);
  while (bytesCache.size > BYTES_CACHE_MAX) bytesCache.delete(bytesCache.keys().next().value);
  return pending;
}

// 封面一次畫一份，避免同時下載多份 PDF
const remoteCovers = new Map();
let coverQueue = Promise.resolve();

/** 畫出線上 PDF 的第一頁；回傳 Promise<{ url, blob, pageCount }>（同一網址只畫一次） */
export function getRemotePdfCover(url) {
  if (remoteCovers.has(url)) return remoteCovers.get(url);
  const task = coverQueue.then(async () => {
    const { blob, pageCount } = await pdfCover(await fetchPdfBytes(url));
    if (!blob) throw new Error('產生 PDF 封面失敗');
    return { url: URL.createObjectURL(blob), blob, pageCount };
  });
  coverQueue = task.catch(() => {});
  task.catch(() => remoteCovers.delete(url));
  remoteCovers.set(url, task);
  return task;
}
