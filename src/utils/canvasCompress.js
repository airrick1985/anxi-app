// src/utils/canvasCompress.js
/**
 * 把 File 轉成壓縮後的 Blob
 * @param {File|Blob} file  — 原始檔（任何 mime 都可；JPEG / PNG 最常見）
 * @param {number} edge    — 最長邊像素，預設 1280
 * @param {number} quality — JPEG 壓縮率 0‑1，預設 0.8
 * @returns {Promise<Blob>}
 */
export async function compressImage(file, edge = 1280, quality = 0.8) {
    // 1. 檔案 → ImageBitmap（瀏覽器原生支援，快且低記憶體）
    const bmp = await createImageBitmap(file);
  
    // 2. 依比例計算寬高
    const ratio = Math.min(1, edge / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * ratio);
    const h = Math.round(bmp.height * ratio);
  
    // 3. 畫到 Canvas
    const canvas = new OffscreenCanvas(w, h);          // Chrome / Edge / FF 支援
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bmp, 0, 0, w, h);
  
    // 4. 轉成 JPEG Blob（quality 控檔案大小）
    return await canvas.convertToBlob({ type: 'image/jpeg', quality });
  }
  
  /**
   * 把 Blob 包裝回 File，方便維持原本流程
   */
  export async function compressToFile(file, edge = 1280, quality = 0.8) {
    const blob = await compressImage(file, edge, quality);
    return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
  }
  
const UPLOAD_MAX_EDGE = 2400;
const PHOTO_SHRINK_BYTES = 1.5 * 1024 * 1024;

/**
 * 上傳前整理圖片（訂閱管理附件共用）
 * - JPEG 超過 1.5MB 或長邊 > 2400px → 縮成長邊 2400px 的 JPEG
 * - HEIC／HEIF 一律轉 JPEG（其他瀏覽器無法顯示）
 * - PNG／WebP 可能有透明底，只在超過 maxBytes 時等比縮小並輸出 PNG
 * 其他檔案或瀏覽器無法解碼時回傳原檔
 */
export async function prepareImageForUpload(file, maxBytes = 7 * 1024 * 1024) {
  const type = (file.type || '').toLowerCase();
  const isHeic = /^image\/hei[cf]$/.test(type) || /\.hei[cf]$/i.test(file.name || '');
  const isPhoto = isHeic || type === 'image/jpeg';
  const keepAlpha = type === 'image/png' || type === 'image/webp';
  if (!isPhoto && !(keepAlpha && file.size > maxBytes)) return file;

  let bmp;
  try {
    bmp = await createImageBitmap(file);
  } catch (e) {
    return file;
  }
  const longEdge = Math.max(bmp.width, bmp.height);
  if (isPhoto && !isHeic && file.size <= PHOTO_SHRINK_BYTES && longEdge <= UPLOAD_MAX_EDGE) {
    bmp.close?.();
    return file;
  }
  // PNG 檔案大小約與像素數成正比，依面積比例估算縮小倍率
  const ratio = Math.min(1, UPLOAD_MAX_EDGE / longEdge, keepAlpha ? Math.sqrt(maxBytes / file.size) * 0.9 : 1);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bmp.width * ratio));
  canvas.height = Math.max(1, Math.round(bmp.height * ratio));
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close?.();

  const outType = keepAlpha ? 'image/png' : 'image/jpeg';
  const blob = await new Promise(resolve => canvas.toBlob(resolve, outType, 0.85));
  if (!blob || (!isHeic && blob.size >= file.size)) return file;
  const base = (file.name || 'photo').replace(/\.[^.]+$/, '');
  return new File([blob], `${base}.${keepAlpha ? 'png' : 'jpg'}`, { type: outType, lastModified: Date.now() });
}
