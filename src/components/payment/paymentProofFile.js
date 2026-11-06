// 繳款憑證檔案規則：繳款紀錄面板與標記已繳對話框共用
export const PROOF_PDF_TYPE = 'application/pdf';
export const PROOF_ACCEPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', PROOF_PDF_TYPE];
export const PROOF_ACCEPT_ATTR = 'image/jpeg,image/png,image/webp,application/pdf,.pdf';
export const PROOF_MAX_SIZE_MB = 10;

// 部分瀏覽器選 PDF 時 file.type 可能為空字串，改以副檔名補判
export function resolveLocalFileType(file) {
  if (file && file.type) return file.type;
  return /\.pdf$/i.test((file && file.name) || '') ? PROOF_PDF_TYPE : '';
}

export function isPdfLocalFile(file) {
  return !!file && resolveLocalFileType(file) === PROOF_PDF_TYPE;
}

// 已上傳檔案：優先看 mimeType，舊資料退回副檔名
export function isPdfFile(file) {
  if (!file) return false;
  return file.mimeType === PROOF_PDF_TYPE || /\.pdf$/i.test(file.fileName || '');
}

// 回傳錯誤訊息；檔案可用時回傳空字串
export function proofFileError(file) {
  if (!PROOF_ACCEPT_TYPES.includes(resolveLocalFileType(file))) return '僅接受 JPG、PNG、WEBP 或 PDF';
  if (file.size > PROOF_MAX_SIZE_MB * 1024 * 1024) return `檔案不可超過 ${PROOF_MAX_SIZE_MB}MB`;
  return '';
}
