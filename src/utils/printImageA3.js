// 圖片列印：預設 A3 橫向（留白 10mm → 內容區約 400×275mm），圖片縮放至紙張寬度；過高的圖改以高度為限，避免跨頁
// @page 邊界設 0：瀏覽器的頁首頁尾（日期、標題、網址、頁碼）印在邊界區，邊界為 0 就不會印出；留白改由 body padding 提供
const PRINT_AREA_MM = { w: 400, h: 275 }; // 高度略小於 277，避免換算誤差多出一張空白頁

let printFrame = null;

/**
 * 以隱藏 iframe 列印單張圖片
 * @param {string} url 圖片網址
 * @param {object} [options] { title: 列印工作名稱, onError: 圖片載入失敗時呼叫 }
 */
export function printImageA3(url, { title = '', onError } = {}) {
  if (!url) return;
  if (printFrame?.parentNode) printFrame.parentNode.removeChild(printFrame);
  const iframe = document.createElement('iframe');
  // 不可設 0×0：列印時尺寸會以 iframe 計算，圖片被壓成 0 高而印出空白
  iframe.style.cssText = 'position:fixed;left:-10000px;top:0;width:1600px;height:1100px;border:0;';
  document.body.appendChild(iframe);
  printFrame = iframe;

  const { w, h } = PRINT_AREA_MM;
  const win = iframe.contentWindow;
  const doc = win.document;
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8">
    <title>${title}</title>
    <style>
      @page { size: A3 landscape; margin: 0; }
      html, body { margin: 0; background: #fff; }
      body { box-sizing: content-box; padding: 10mm; width: ${w}mm; height: ${h}mm; display: flex; justify-content: center; align-items: center; overflow: hidden; }
      img { width: ${w}mm; height: auto; max-height: ${h}mm; object-fit: contain; }
    </style></head>
    <body><img src="${url}"></body></html>`);
  doc.close();

  const cleanup = () => {
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    if (printFrame === iframe) printFrame = null;
  };
  win.addEventListener('afterprint', () => setTimeout(cleanup, 0));
  const doPrint = () => setTimeout(() => { win.focus(); win.print(); }, 100);
  const img = doc.querySelector('img');
  if (img.complete && img.naturalWidth) doPrint();
  else {
    img.onload = doPrint;
    img.onerror = () => { cleanup(); onError?.(); };
  }
}
