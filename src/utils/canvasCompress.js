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
  