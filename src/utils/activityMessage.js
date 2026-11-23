// src/utils/activityMessage.js
// 活動訊息共用工具：類型判斷、顯示名稱、上傳前檔案處理
import { isActivityPage } from '@/utils/activityPage';
import { shrinkImageToLimit } from '@/utils/canvasCompress';

export const ACTIVITY_PDF_TYPE = 'application/pdf';
export const ACTIVITY_FILE_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,application/pdf,.pdf';
export const ACTIVITY_TITLE_MAX = 60; // 與自建頁面名稱上限一致
export const ACTIVITY_DESCRIPTION_MAX = 500;

const IMAGE_MAX_BYTES = 2 * 1024 * 1024; // 圖檔上限 2MB（超過自動壓縮）
const PDF_MAX_BYTES = 7 * 1024 * 1024;   // PDF 上限 7MB（base64 後約 9.4MB，不超過 onCall 10MB 請求上限）

/** page｜pdf｜image（PDF 優先看 contentType，舊資料退回副檔名） */
export function activityKind(item) {
  if (isActivityPage(item)) return 'page';
  if (item?.contentType === ACTIVITY_PDF_TYPE || /\.pdf$/i.test(item?.fileName || '')) return 'pdf';
  return 'image';
}

export function activityTypeLabel(item) {
  const kind = activityKind(item);
  if (kind === 'page') return '自建頁面';
  if (kind === 'pdf') return item?.pageCount ? `PDF・${item.pageCount} 頁` : 'PDF';
  return '圖片';
}

export const ACTIVITY_KIND_ICONS = {
  page: 'mdi-file-document-outline',
  pdf: 'mdi-file-pdf-box',
  image: 'mdi-image-outline',
};

/** 去掉副檔名的檔名 */
export function activityFileBase(item) {
  return String(item?.fileName || '').replace(/\.[a-z0-9]{2,5}$/i, '');
}

/** 給一般瀏覽者看的名稱：標題；沒有標題時 PDF 用檔名、圖片不顯示（檔名多為流水號） */
export function activityPublicName(item) {
  if (item?.title) return item.title;
  return activityKind(item) === 'pdf' ? activityFileBase(item) : '';
}

/** 搜尋比對用文字 */
export function activityMatches(item, keyword) {
  const q = String(keyword || '').trim().toLowerCase();
  if (!q) return true;
  return [item?.title, item?.description, item?.fileName].some(t => String(t || '').toLowerCase().includes(q));
}

export function formatFileSize(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = () => reject(new Error('讀取檔案失敗'));
    reader.readAsDataURL(file);
  });
}

/** 部分瀏覽器選 PDF 時 file.type 為空字串，改以副檔名補判，避免後端因缺 contentType 退件 */
export function isPdfFile(file) {
  return file?.type === ACTIVITY_PDF_TYPE || (!file?.type && /\.pdf$/i.test(file?.name || ''));
}

function isImageFile(file) {
  return /^image\//.test(file?.type || '') || /\.(jpe?g|png|webp|heic|heif)$/i.test(file?.name || '');
}

/**
 * 上傳前處理：PDF 檢查大小；圖片超過 2MB 或 HEIC 自動壓縮轉檔
 * 回傳 { file, contentType, isPdf }，不能用的檔案丟出錯誤
 */
export async function prepareActivityFile(raw) {
  if (isPdfFile(raw)) {
    if (raw.size > PDF_MAX_BYTES) throw new Error(`PDF 超過 7MB（${formatFileSize(raw.size)}）`);
    return { file: raw, contentType: ACTIVITY_PDF_TYPE, isPdf: true };
  }
  if (!isImageFile(raw)) throw new Error('僅支援圖片與 PDF');
  const file = await shrinkImageToLimit(raw, IMAGE_MAX_BYTES);
  return { file, contentType: file.type, isPdf: false };
}
