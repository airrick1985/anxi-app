// 附件檔案共用：類型判斷、副檔名、下載（訂閱管理附件檢視器與縮圖列表）

export function fileExtension(att) {
  const source = att?.name || (att?.url || '').split('?')[0];
  const match = /\.([a-z0-9]{1,5})$/i.exec(source || '');
  return match ? match[1].toLowerCase() : '';
}

export function isImageAttachment(att) {
  if (att?.contentType) return att.contentType.startsWith('image/');
  return /\.(png|jpe?g|gif|webp|bmp|heic)(\?|$)/i.test(att?.url || '') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'heic'].includes(fileExtension(att));
}

export function isPdfAttachment(att) {
  return att?.contentType === 'application/pdf' || /\.pdf(\?|$)/i.test(att?.url || '') || fileExtension(att) === 'pdf';
}

// 檔案類型標籤：顯示文字＋顏色
const TYPE_STYLES = [
  { exts: ['pdf'], label: 'PDF', color: '#d93025', icon: 'mdi-file-pdf-box' },
  { exts: ['doc', 'docx'], label: 'Word', color: '#2b579a', icon: 'mdi-file-word-box' },
  { exts: ['xls', 'xlsx', 'csv'], label: 'Excel', color: '#217346', icon: 'mdi-file-excel-box' },
  { exts: ['ppt', 'pptx'], label: 'PPT', color: '#c43e1c', icon: 'mdi-file-powerpoint-box' },
  { exts: ['zip', 'rar', '7z'], label: 'ZIP', color: '#6e6e73', icon: 'mdi-folder-zip-outline' },
];

export function fileTypeStyle(att) {
  if (isPdfAttachment(att)) return TYPE_STYLES[0];
  const ext = fileExtension(att);
  return TYPE_STYLES.find(t => t.exts.includes(ext))
    || { label: ext ? ext.toUpperCase() : '檔案', color: '#6e6e73', icon: 'mdi-file-document-outline' };
}

export function formatFileSize(bytes) {
  const n = Number(bytes);
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** 以原始檔名下載；取檔失敗（例如跨網域被擋）時改為另開分頁 */
export async function downloadAttachment(att) {
  if (!att?.url) return;
  try {
    const res = await fetch(att.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blobUrl = URL.createObjectURL(await res.blob());
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = att.name || `附件.${fileExtension(att) || 'bin'}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch (e) {
    console.warn('附件下載失敗，改為另開分頁:', e);
    window.open(att.url, '_blank', 'noopener');
  }
}

/** iPhone／iPad（含桌面版 iPadOS）：不支援網頁內嵌 PDF 列印 */
export function isIOSLike() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** PDF 列印：取回 blob 後以同源 blob 網址載入隱藏 iframe 列印 */
export async function printPdfAttachment(att) {
  const res = await fetch(att.url);
  if (!res.ok) throw new Error(`取得 PDF 失敗（HTTP ${res.status}）`);
  const blobUrl = URL.createObjectURL(await res.blob());
  await new Promise((resolve, reject) => {
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    // 不可設 0×0 或 visibility:hidden，PDF 檢視器不會渲染而印出空白
    frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:190mm;height:277mm;border:0;';
    const dispose = (delay) => setTimeout(() => { frame.remove(); URL.revokeObjectURL(blobUrl); }, delay);
    const timer = setTimeout(() => {
      dispose(0);
      reject(new Error('此瀏覽器不支援直接列印 PDF'));
    }, 8000);
    frame.onload = () => {
      clearTimeout(timer);
      // onload 時 PDF 頁面尚未渲染，稍候再印以免空白
      setTimeout(() => {
        try {
          frame.contentWindow.focus();
          frame.contentWindow.print();
          window.focus(); // 焦點還給頁面，方向鍵切換附件才有效
          resolve();
        } catch (e) {
          reject(e);
        } finally {
          dispose(60000);
        }
      }, 800);
    };
    frame.src = blobUrl;
    document.body.appendChild(frame);
  });
}
